import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FaPaperclip, FaDownload, FaCheck, FaTimes, FaUpload, FaLock, FaStar, FaUserCheck } from 'react-icons/fa';
import { API_ENDPOINTS, getAuthHeaders, getMultipartAuthHeaders, extractArray } from '../config/api.config';
import {
  cleanPersonName,
  safeReadJson,
  parseApiError,
  toLocalDateStr,
  getSubmissionLocalDate,
  getNextBusinessDateStr,
  formatBusinessDateLabel,
  notifyTaskDataChanged,
  unwrapResponse,
} from './taskAccess';
import { getStoredUser, collectMyIds } from './taskScope';
import { buildReviewComment, parseReview } from './taskRating';
import { toast } from '../components/Toast';
import './TaskModule.css';

const SUB_COLORS = {
  SUBMITTED: ['#fef3c7', '#92400e'],
  APPROVED:  ['#dcfce7', '#166534'],
  REJECTED:  ['#fee2e2', '#991b1b'],
};

const RATING_OPTIONS = [
  { id: 'LOW', label: 'Low' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'HIGH', label: 'High' },
];

async function postReview(submissionId, approved, comment) {
  const res = await fetch(API_ENDPOINTS.REVIEW_TASK_SUBMISSION(submissionId), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ approved, comment }),
  });
  const data = await safeReadJson(res);
  if (!res.ok) throw new Error(parseApiError(res, data, 'Review failed'));
  return data;
}

// Used by the IN_REVIEW banner: approve / reject the newest pending FINAL submission
export async function reviewLatest(taskId, approved, comment = '') {
  const res = await fetch(API_ENDPOINTS.GET_TASK_SUBMISSIONS(taskId), { headers: getAuthHeaders() });
  const data = await safeReadJson(res);
  if (!res.ok) throw new Error(parseApiError(res, data, 'Could not load submissions'));
  const list = unwrapResponse(data);
  const pending = (Array.isArray(list) ? list : []).find(s => s.status === 'SUBMITTED' && s.finalSubmission);
  if (!pending) return false;
  await postReview(pending.id, approved, comment);
  notifyTaskDataChanged();
  return true;
}

/* ───────────────── Employee: "Submit Work" modal ───────────────── */
export function SubmitWorkModal({ task, submissions: initialSubmissions = [], onClose, onDone }) {
  const currentUser = getStoredUser();
  const myIds = useMemo(() => collectMyIds(currentUser), [currentUser]);
  const today = toLocalDateStr(new Date());
  const nextBusinessLabel = formatBusinessDateLabel(getNextBusinessDateStr(new Date()));

  const [form, setForm] = useState({
    progress: task?.progress || 0, hoursSpent: '', note: '', proofLink: '', finalSubmission: false,
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [checking, setChecking] = useState(true);
  const [history, setHistory] = useState(Array.isArray(initialSubmissions) ? initialSubmissions : []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      if (!task?.id) {
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const res = await fetch(API_ENDPOINTS.GET_TASK_SUBMISSIONS(task.id), { headers: getAuthHeaders() });
        const data = await safeReadJson(res);
        if (active && res.ok) {
          setHistory(extractArray(data));
        }
      } finally {
        if (active) setChecking(false);
      }
    };
    loadHistory();
    return () => { active = false; };
  }, [task?.id]);

  const todayDailySubmission = useMemo(() => {
    return history.find(s => {
      if (!s || s.finalSubmission) return false;
      if (getSubmissionLocalDate(s) !== today) return false;
      if (s.employeeId != null && myIds.size > 0) return myIds.has(String(s.employeeId));
      return true;
    }) || null;
  }, [history, today, myIds]);

  const pendingFinalSubmission = useMemo(() => {
    return history.find(s => {
      if (!s || !s.finalSubmission) return false;
      if (s.status !== 'SUBMITTED' && s.status !== 'APPROVED') return false;
      if (s.employeeId != null && myIds.size > 0) return myIds.has(String(s.employeeId));
      return true;
    }) || null;
  }, [history, myIds]);

  const isDailyBlocked = !form.finalSubmission && Boolean(todayDailySubmission);
  const isFinalBlocked = form.finalSubmission && Boolean(pendingFinalSubmission);
  const todayReview = todayDailySubmission ? parseReview(todayDailySubmission.reviewComment) : null;

  const submit = async () => {
    if (busyRef.current || busy || checking) return;
    if (isDailyBlocked) {
      toast.warning('Already Submitted', "Today's work has already been submitted.");
      return;
    }
    if (isFinalBlocked) {
      toast.warning('Final Submission Pending', 'A final submission is already pending or approved.');
      return;
    }

    const p = Number(form.progress);
    if (isNaN(p) || p < 0 || p > 100) return toast.warning('Validation', 'Progress must be 0 to 100');
    const hasProof = !!file || !!form.proofLink.trim();
    if (form.finalSubmission && !hasProof) return toast.warning('Proof required', 'Attach a file or a link for final submission');
    if (!hasProof && !form.note.trim()) return toast.warning('Validation', 'Add a note or proof');

    const fd = new FormData();
    fd.append('progress', form.finalSubmission ? 100 : p);
    fd.append('finalSubmission', form.finalSubmission);
    if (form.hoursSpent !== '') fd.append('hoursSpent', form.hoursSpent);
    if (form.note.trim())      fd.append('note', form.note.trim());
    if (form.proofLink.trim()) fd.append('proofLink', form.proofLink.trim());
    if (file)                  fd.append('file', file);

    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.SUBMIT_TASK_PROOF(task.id), {
        method: 'POST',
        headers: getMultipartAuthHeaders(),
        body: fd,
      });
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(parseApiError(res, data, 'Submit failed'));
      toast.success('Submitted', form.finalSubmission ? 'Sent to manager for review' : 'Daily progress saved');
      notifyTaskDataChanged();
      onDone?.();
      onClose();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="tm-modal-overlay">
      <div className="tm-modal-card">
        <div className="tm-modal-head">
          <h3 className="tm-modal-title"><FaUpload size={13} color="var(--accent-indigo, #2563eb)" /> Submit Work</h3>
          <button type="button" className="tm-modal-close" onClick={onClose}><FaTimes size={12} /></button>
        </div>
        <div className="tm-modal-body">
          {todayDailySubmission && (
            <div
              className="tm-alert tm-alert--amber"
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, marginBottom: 14 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="tm-alert-text" style={{ fontSize: 13 }}>
                  <FaLock size={12} /> Today&apos;s work has already been submitted.
                </span>
                <span
                  className="tm-mini-tag"
                  style={{
                    background: (SUB_COLORS[todayDailySubmission.status] || ['#f1f5f9', '#475569'])[0],
                    color: (SUB_COLORS[todayDailySubmission.status] || ['#f1f5f9', '#475569'])[1],
                  }}
                >
                  {todayDailySubmission.status}
                </span>
              </div>
              {todayReview?.feedback && (
                <div style={{ fontSize: 12, color: 'var(--tm-text-secondary)' }}>
                  <strong>Manager Feedback:</strong> {todayReview.feedback}
                </div>
              )}
              <div style={{ fontSize: 11.5, color: 'var(--tm-text-muted)' }}>
                Next daily progress submission opens on <strong>{nextBusinessLabel}</strong>. You may still check &ldquo;FINAL submission&rdquo; below if the task is complete.
              </div>
            </div>
          )}

          <div className="tm-modal-grid">
            <div className="tm-field">
              <label>Progress % <span className="tm-req">*</span></label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.finalSubmission ? 100 : form.progress}
                disabled={form.finalSubmission || isDailyBlocked}
                onChange={e => set('progress', e.target.value)}
              />
            </div>
            <div className="tm-field">
              <label>Hours spent today</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.hoursSpent}
                disabled={isDailyBlocked || isFinalBlocked}
                onChange={e => set('hoursSpent', e.target.value)}
              />
            </div>
            <div className="tm-field tm-col-span-full">
              <label>What did you do?</label>
              <textarea
                rows={3}
                value={form.note}
                disabled={isDailyBlocked || isFinalBlocked}
                onChange={e => set('note', e.target.value)}
                placeholder="Short update / work done…"
              />
            </div>
            <div className="tm-field tm-col-span-full">
              <label>Proof link (optional)</label>
              <input
                type="text"
                value={form.proofLink}
                disabled={isDailyBlocked || isFinalBlocked}
                onChange={e => set('proofLink', e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="tm-field tm-col-span-full">
              <label>Proof file (pdf, png, jpg, doc, xls, txt, zip — max 10 MB)</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,.zip"
                disabled={isDailyBlocked || isFinalBlocked}
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <label className="tm-modal-check tm-col-span-full">
              <input
                type="checkbox"
                checked={form.finalSubmission}
                onChange={e => set('finalSubmission', e.target.checked)}
              />
              This is the FINAL submission (task is complete, send to manager for approval)
            </label>
          </div>
        </div>
        <div className="tm-modal-foot">
          <button type="button" className="tm-btn tm-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="tm-btn tm-btn-primary"
            onClick={submit}
            disabled={busy || checking || isDailyBlocked || isFinalBlocked}
          >
            <FaUpload size={11} /> {checking ? 'Checking…' : busy ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── "Submissions" tab: history + manager review ───────────────── */
export default function SubmissionsPanel({ taskId, canReview, refreshKey = 0, onChanged }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewRating, setReviewRating] = useState('MEDIUM');
  const [reviewComment, setReviewComment] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.GET_TASK_SUBMISSIONS(taskId), { headers: getAuthHeaders() });
      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(parseApiError(res, data, 'Could not load submissions'));
      const arr = unwrapResponse(data);
      setList(Array.isArray(arr) ? arr : []);
    } catch (err) {
      setError(err.message);
      toast.error('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const download = async (s) => {
    try {
      const res = await fetch(API_ENDPOINTS.DOWNLOAD_TASK_PROOF(s.id), { headers: getMultipartAuthHeaders() });
      if (!res.ok) {
        const errData = await safeReadJson(res);
        throw new Error(parseApiError(res, errData, 'Could not download file'));
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url; a.download = s.proofFileName || 'proof'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { toast.error('Error', err.message); }
  };

  const openReviewForm = (s) => {
    setReviewingId(s.id);
    setReviewRating('MEDIUM');
    setReviewComment('');
  };

  const submitReview = async (s, approved) => {
    if (busyId === s.id) return;
    if (!approved && !reviewComment.trim()) {
      toast.warning('Feedback Required', 'Please provide a reason or rework instructions before rejecting.');
      return;
    }

    const commentPayload = approved
      ? (reviewRating ? buildReviewComment(reviewRating, reviewComment) : reviewComment.trim())
      : reviewComment.trim();

    setBusyId(s.id);
    try {
      await postReview(s.id, approved, commentPayload);
      toast.success(approved ? 'Approved' : 'Rejected', approved ? 'Submission approved' : 'Sent back to employee');
      setReviewingId(null);
      setReviewComment('');
      notifyTaskDataChanged();
      await load();
      onChanged?.();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="tm-card">
      <div className="tm-card-header">
        <h3 className="tm-card-title">
          <FaUpload size={13} color="var(--tm-primary)" /> Work Submissions ({list.length})
        </h3>
      </div>
      <div className="tm-card-body">
        {loading && <p style={{ color: 'var(--tm-text-muted)', fontSize: 13, margin: 0 }}>Loading…</p>}
        {!loading && error && (
          <div className="tm-alert tm-alert--danger" style={{ marginBottom: 12 }}>
            <span className="tm-alert-text">{error}</span>
          </div>
        )}
        {!loading && !error && list.length === 0 && (
          <div className="tm-table-empty" style={{ padding: 24 }}>No work submitted yet.</div>
        )}
        {list.map(s => {
          const [bg, color] = SUB_COLORS[s.status] || ['#f1f5f9', '#475569'];
          const parsedReview = parseReview(s.reviewComment);
          const isReviewOpen = reviewingId === s.id;
          return (
            <div key={s.id} className="tm-submission-item">
              <div className="tm-submission-head">
                <div className="tm-submission-author">
                  {cleanPersonName(s.employeeName)}
                  <span className="tm-submission-time">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                  </span>
                </div>
                <div className="tm-submission-badges">
                  {s.finalSubmission && <span className="tm-mini-tag" style={{ background: '#eef2ff', color: '#4f46e5' }}>FINAL</span>}
                  {s.late && <span className="tm-mini-tag" style={{ background: '#fee2e2', color: '#991b1b' }}>LATE</span>}
                  {s.status !== 'SUBMITTED' && parsedReview.rating && (
                    <span className="tm-mini-tag" style={{ background: '#f0fdf4', color: '#166534', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <FaStar size={9} /> {parsedReview.rating}
                    </span>
                  )}
                  <span className="tm-mini-tag" style={{ background: bg, color }}>{s.status}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--tm-text-secondary)', marginBottom: 6 }}>
                Progress <strong>{s.progressPercent ?? 0}%</strong>
                {s.hoursSpent != null && <> · Hours <strong>{s.hoursSpent}</strong></>}
              </div>
              {s.note && <p style={{ margin: '0 0 8px', fontSize: 13.5, color: 'var(--tm-text-secondary)', lineHeight: 1.5 }}>{s.note}</p>}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {s.proofLink && (
                  <a href={s.proofLink} target="_blank" rel="noreferrer" className="tm-btn tm-btn-ghost tm-btn-sm">
                    <FaPaperclip size={10} /> Proof link
                  </a>
                )}
                {s.hasProofFile && (
                  <button type="button" className="tm-btn tm-btn-ghost tm-btn-sm" onClick={() => download(s)}>
                    <FaDownload size={10} /> {s.proofFileName || 'Download proof'}
                  </button>
                )}
              </div>
              {s.reviewComment && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--tm-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaUserCheck size={11} />
                  <span>
                    Review by <strong>{cleanPersonName(s.reviewedBy) || 'Manager'}</strong>: &ldquo;{parsedReview.feedback || s.reviewComment}&rdquo;
                  </span>
                </div>
              )}
              {canReview && s.status === 'SUBMITTED' && !isReviewOpen && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" className="tm-btn tm-btn-success tm-btn-sm" disabled={busyId === s.id} onClick={() => openReviewForm(s)}>
                    <FaCheck size={10} /> Review Submission
                  </button>
                </div>
              )}
              {canReview && s.status === 'SUBMITTED' && isReviewOpen && (
                <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tm-text-secondary)' }}>Quality Rating:</span>
                    {RATING_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`tm-filter-pill ${reviewRating === opt.id ? 'active' : ''}`}
                        onClick={() => setReviewRating(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    className="tm-textarea"
                    style={{ width: '100%', marginBottom: 8 }}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Enter feedback (required when rejecting)..."
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="tm-btn tm-btn-success tm-btn-sm" disabled={busyId === s.id} onClick={() => submitReview(s, true)}>
                      <FaCheck size={10} /> {busyId === s.id ? 'Saving…' : 'Approve'}
                    </button>
                    <button type="button" className="tm-btn tm-btn-danger tm-btn-sm" disabled={busyId === s.id} onClick={() => submitReview(s, false)}>
                      <FaTimes size={10} /> {busyId === s.id ? 'Saving…' : 'Reject'}
                    </button>
                    <button type="button" className="tm-btn tm-btn-secondary tm-btn-sm" disabled={busyId === s.id} onClick={() => setReviewingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
