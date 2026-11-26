














import React, { useState, useEffect, useCallback } from 'react';
import { FaPaperclip, FaDownload, FaCheck, FaTimes, FaUpload } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS, getAuthHeaders } from '../config/api.config';
import { toast } from '../components/Toast';
import './TaskModule.css';

// multipart request: do NOT send Content-Type (browser sets the boundary)
const authOnly = () => ({ Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}` });
const unwrap = (d) => d?.response ?? d?.data ?? d;

const SUB_COLORS = {
  SUBMITTED: ['#fef3c7', '#92400e'],
  APPROVED:  ['#dcfce7', '#166534'],
  REJECTED:  ['#fee2e2', '#991b1b'],
};

async function postReview(submissionId, approved, comment) {
  const res = await fetch(API_ENDPOINTS.REVIEW_TASK_SUBMISSION(submissionId), {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ approved, comment }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Review failed (HTTP ${res.status})`);
  return data;
}

// Used by the IN_REVIEW banner: approve / reject the newest pending FINAL submission
export async function reviewLatest(taskId, approved, comment = '') {
  const res = await fetch(API_ENDPOINTS.GET_TASK_SUBMISSIONS(taskId), { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Could not load submissions (HTTP ${res.status})`);
  const list = unwrap(await res.json());
  const pending = (Array.isArray(list) ? list : []).find(s => s.status === 'SUBMITTED' && s.finalSubmission);
  if (!pending) return false;           // no submission (old task) -> caller falls back to old status call
  await postReview(pending.id, approved, comment);
  return true;
}

/* ───────────────── Employee: "Submit Work" modal ───────────────── */
export function SubmitWorkModal({ task, onClose, onDone }) {
  const [form, setForm] = useState({
    progress: task?.progress || 0, hoursSpent: '', note: '', proofLink: '', finalSubmission: false,
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
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

    setBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.SUBMIT_TASK_PROOF(task.id), { method: 'POST', headers: authOnly(), body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Submit failed (HTTP ${res.status})`);
      toast.success('Submitted', form.finalSubmission ? 'Sent to manager for review' : 'Daily progress saved');
      onDone?.();
      onClose();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
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
          <div className="tm-modal-grid">
            <div className="tm-field">
              <label>Progress % <span className="tm-req">*</span></label>
              <input type="number" min="0" max="100" value={form.finalSubmission ? 100 : form.progress} disabled={form.finalSubmission} onChange={e => set('progress', e.target.value)} />
            </div>
            <div className="tm-field">
              <label>Hours spent today</label>
              <input type="number" min="0" max="24" step="0.5" value={form.hoursSpent} onChange={e => set('hoursSpent', e.target.value)} />
            </div>
            <div className="tm-field tm-col-span-full">
              <label>What did you do?</label>
              <textarea rows={3} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Short update / work done…" />
            </div>
            <div className="tm-field tm-col-span-full">
              <label>Proof link (optional)</label>
              <input type="text" value={form.proofLink} onChange={e => set('proofLink', e.target.value)} placeholder="https://…" />
            </div>
            <div className="tm-field tm-col-span-full">
              <label>Proof file (pdf, png, jpg, doc, xls, txt, zip — max 10 MB)</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <label className="tm-modal-check tm-col-span-full">
              <input type="checkbox" checked={form.finalSubmission} onChange={e => set('finalSubmission', e.target.checked)} />
              This is the FINAL submission (task is complete, send to manager for approval)
            </label>
          </div>
        </div>
        <div className="tm-modal-foot">
          <button type="button" className="tm-btn tm-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="tm-btn tm-btn-primary" onClick={submit} disabled={busy}>
            <FaUpload size={11} /> {busy ? 'Submitting…' : 'Submit'}
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
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_TASK_SUBMISSIONS(taskId), { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not load submissions');
      const arr = unwrap(data);
      setList(Array.isArray(arr) ? arr : []);
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const download = async (s) => {
    try {
      const res = await fetch(API_ENDPOINTS.DOWNLOAD_TASK_PROOF(s.id), { headers: authOnly() });
      if (!res.ok) throw new Error('Could not download file');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url; a.download = s.proofFileName || 'proof'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error('Error', err.message); }
  };

  const review = async (s, approved) => {
    let comment = '';
    if (!approved) {
      comment = window.prompt('Reason for rejecting (required):') || '';
      if (!comment.trim()) return;
    }
    setBusyId(s.id);
    try {
      await postReview(s.id, approved, comment);
      toast.success(approved ? 'Approved' : 'Rejected', approved ? 'Submission approved' : 'Sent back to employee');
      await load();
      onChanged?.();
    } catch (err) { toast.error('Error', err.message); }
    finally { setBusyId(null); }
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
        {!loading && list.length === 0 && (
          <div className="tm-table-empty" style={{ padding: 24 }}>No work submitted yet.</div>
        )}
        {list.map(s => {
          const [bg, color] = SUB_COLORS[s.status] || ['#f1f5f9', '#475569'];
          return (
            <div key={s.id} className="tm-submission-item">
              <div className="tm-submission-head">
                <div className="tm-submission-author">
                  {(s.employeeName || '').replace(/\s+null\s*/gi, '').trim()}
                  <span className="tm-submission-time">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                  </span>
                </div>
                <div className="tm-submission-badges">
                  {s.finalSubmission && <span className="tm-mini-tag" style={{ background: '#eef2ff', color: '#4f46e5' }}>FINAL</span>}
                  {s.late && <span className="tm-mini-tag" style={{ background: '#fee2e2', color: '#991b1b' }}>LATE</span>}
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
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--tm-text-muted)' }}>
                  Review by {s.reviewedBy}: “{s.reviewComment}”
                </div>
              )}
              {canReview && s.status === 'SUBMITTED' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" className="tm-btn tm-btn-success tm-btn-sm" disabled={busyId === s.id} onClick={() => review(s, true)}><FaCheck size={10} /> Approve</button>
                  <button type="button" className="tm-btn tm-btn-danger tm-btn-sm" disabled={busyId === s.id} onClick={() => review(s, false)}><FaTimes size={10} /> Reject</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}




