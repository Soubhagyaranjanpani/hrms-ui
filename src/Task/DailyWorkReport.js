import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaCalendarDay, FaTasks, FaClock, FaLink, FaPaperclip,
  FaPaperPlane, FaCheckCircle, FaExclamationCircle, FaLock, FaTimes,
  FaUserCheck, FaStar
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  getMultipartAuthHeaders,
  extractArray
} from '../config/api.config';
import {
  cleanPersonName,
  safeReadJson,
  parseApiError,
  getSubmissionLocalDate,
  getNextBusinessDateStr,
  formatBusinessDateLabel,
  notifyTaskDataChanged
} from './taskAccess';
import { getStoredUser, collectMyIds } from './taskScope';
import { parseReview } from './taskRating';
import { formatDate } from './DailyWorkCalendar';
import './DailyWork.css';

const QUICK_HOURS = [1, 2, 4, 8];

const SUBMISSION_STATUS_META = {
  SUBMITTED: { label: 'Pending Review', bg: '#fef3c7', color: '#92400e' },
  APPROVED:  { label: 'Approved',       bg: '#dcfce7', color: '#166534' },
  REJECTED:  { label: 'Rejected',       bg: '#fee2e2', color: '#991b1b' },
};

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DailyWorkReport({
  tasks = [],
  selectedDate,
  submissions = [],
  onSubmitted
}) {
  const currentUser = getStoredUser();
  const myIds = useMemo(() => collectMyIds(currentUser), [currentUser]);

  const [taskId, setTaskId]       = useState('');
  const [note, setNote]           = useState('');
  const [hours, setHours]         = useState('');
  const [progress, setProgress]   = useState(0);
  const [proofLink, setProofLink] = useState('');
  const [file, setFile]           = useState(null);

  const [loading, setLoading]                 = useState(false);
  const [checkingHistory, setCheckingHistory] = useState(false);
  const [taskSubmissions, setTaskSubmissions] = useState([]);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');

  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);

  const today = formatDate(new Date());
  const isToday = selectedDate === today;
  const nextBusinessDate = getNextBusinessDateStr(new Date());
  const nextBusinessDateLabel = formatBusinessDateLabel(nextBusinessDate);

  const activeTasks = useMemo(
    () => (Array.isArray(tasks) ? tasks.filter(task => task.status === 'IN_PROGRESS') : []),
    [tasks]
  );

  const selectedTask = activeTasks.find(t => String(t.id) === String(taskId));

  // Verify live submission history whenever selected task changes
  useEffect(() => {
    if (!taskId) {
      setTaskSubmissions([]);
      setCheckingHistory(false);
      return;
    }

    const propMatches = (Array.isArray(submissions) ? submissions : []).filter(
      s => String(s.taskId) === String(taskId)
    );
    setTaskSubmissions(propMatches);

    let active = true;
    const loadTaskHistory = async () => {
      setCheckingHistory(true);
      try {
        const res = await fetch(API_ENDPOINTS.GET_TASK_SUBMISSIONS(taskId), {
          headers: getAuthHeaders(),
        });
        const data = await safeReadJson(res);
        if (!active) return;
        if (!res.ok) {
          setError(parseApiError(res, data, 'Could not verify submission history'));
          return;
        }
        setTaskSubmissions(extractArray(data));
      } catch {
        // retain propMatches if offline/error
      } finally {
        if (active) setCheckingHistory(false);
      }
    };

    loadTaskHistory();
    return () => { active = false; };
  }, [taskId, submissions]);

  const todaySubmission = useMemo(() => {
    if (!taskId) return null;
    const merged = new Map();
    [...(Array.isArray(submissions) ? submissions : []), ...taskSubmissions].forEach(s => {
      if (s && s.id != null && String(s.taskId ?? taskId) === String(taskId)) {
        merged.set(String(s.id), s);
      }
    });

    return [...merged.values()].find(s => {
      if (s.finalSubmission) return false;
      if (getSubmissionLocalDate(s) !== today) return false;
      if (s.employeeId != null && myIds.size > 0) {
        return myIds.has(String(s.employeeId));
      }
      return true;
    }) || null;
  }, [taskId, submissions, taskSubmissions, today, myIds]);

  const isLockedForToday = Boolean(todaySubmission);

  const selectTask = (id) => {
    setTaskId(id);
    setError('');
    setSuccess('');
    const task = activeTasks.find(t => String(t.id) === String(id));
    setProgress(Number(task?.progress) || 0);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (submittingRef.current || loading) return;
    setError('');
    setSuccess('');

    if (!isToday) {
      setError('Only today’s work can be submitted.');
      return;
    }

    if (!selectedTask) {
      setError('Please select an active task.');
      return;
    }

    if (checkingHistory) {
      setError('Please wait while today’s submission status is verified.');
      return;
    }

    if (isLockedForToday) {
      setError("Today's work has already been submitted.");
      return;
    }

    if (!note.trim()) {
      setError('Please enter your work description.');
      return;
    }

    const numericHours = Number(hours);
    if (!Number.isFinite(numericHours) || numericHours <= 0 || numericHours > 24) {
      setError('Enter valid working hours between 0.5 and 24.');
      return;
    }

    try {
      submittingRef.current = true;
      setLoading(true);

      const formData = new FormData();
      formData.append('note', note.trim());
      formData.append('hoursSpent', String(numericHours));
      formData.append('progress', String(progress));
      formData.append('finalSubmission', 'false');

      if (proofLink.trim()) {
        formData.append('proofLink', proofLink.trim());
      }

      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(
        API_ENDPOINTS.SUBMIT_TASK_PROOF(taskId),
        {
          method: 'POST',
          headers: getMultipartAuthHeaders(),
          body: formData
        }
      );

      const data = await safeReadJson(response);

      if (!response.ok) {
        throw new Error(parseApiError(response, data, 'Submission failed'));
      }

      const created = data?.response ?? data?.data ?? data;
      if (created && created.id != null) {
        setTaskSubmissions(prev => [created, ...prev]);
      }

      setSuccess('Daily work report submitted to manager successfully.');
      setNote('');
      setHours('');
      setProofLink('');
      clearFile();

      notifyTaskDataChanged();
      onSubmitted?.();
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const existingStatusMeta = todaySubmission
    ? (SUBMISSION_STATUS_META[todaySubmission.status] || {
        label: todaySubmission.status || 'Submitted',
        bg: '#f1f5f9',
        color: '#475569',
      })
    : null;
  const existingReview = todaySubmission ? parseReview(todaySubmission.reviewComment) : null;

  return (
    <div className="dw-card">
      {/* Header */}
      <div className="dw-header">
        <div className="dw-title-wrap">
          <div className="dw-title-icon">
            <FaTasks size={15} />
          </div>
          <div>
            <h3 className="dw-title">Daily Work Report</h3>
            <p className="dw-subtitle">One daily progress report per task per day · Next cycle on {nextBusinessDateLabel}</p>
          </div>
        </div>

        <span className={`dw-date-chip ${isToday ? 'today' : 'readonly'}`}>
          <FaCalendarDay size={11} />
          {selectedDate || today}
        </span>
      </div>

      {!isToday ? (
        <div className="dw-readonly-box">
          <div className="dw-readonly-icon">
            <FaLock size={16} />
          </div>
          <h4>Historical Date (Read-Only)</h4>
          <p className="dw-muted" style={{ margin: 0 }}>
            Select today&apos;s date (<strong>{today}</strong>) on the calendar to submit a new work report.
          </p>
        </div>
      ) : (
        <form className="dw-form" onSubmit={submitReport}>
          {/* Assigned Task Select */}
          <div className="dw-field">
            <label>
              Assigned Task <span className="dw-req">*</span>
            </label>
            <select
              value={taskId}
              onChange={e => selectTask(e.target.value)}
              disabled={!activeTasks.length}
              required
            >
              <option value="">
                {activeTasks.length ? 'Select an in-progress task...' : 'No active tasks available'}
              </option>
              {activeTasks.map(task => (
                <option key={task.id} value={task.id}>
                  T-{String(task.id).padStart(3, '0')} · {task.title}
                </option>
              ))}
            </select>

            {!activeTasks.length && (
              <div className="dw-info-banner">
                <FaExclamationCircle size={12} />
                <span>No active tasks found. Accept a pending task first before logging daily work.</span>
              </div>
            )}

            {selectedTask && (
              <div className="dw-task-preview">
                <span className="dw-task-id">T-{String(selectedTask.id).padStart(3, '0')}</span>
                <span className="dw-task-meta">
                  {(typeof selectedTask.department === 'object' ? selectedTask.department?.name : selectedTask.departmentName || selectedTask.department) || 'General'}
                  {' · '}Current Progress: <strong>{selectedTask.progress || 0}%</strong>
                </span>
              </div>
            )}
          </div>

          {checkingHistory && taskId && (
            <div className="dw-info-banner">
              <FaClock size={12} />
              <span>Checking today&apos;s submission history…</span>
            </div>
          )}

          {/* One Day, One Work Lock Card */}
          {isLockedForToday && todaySubmission && (
            <div className="dw-locked-submission-card">
              <div className="dw-locked-submission-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaLock size={13} color="#d97706" />
                  <strong>Today&apos;s work has already been submitted.</strong>
                </div>
                <span
                  className="dwr-status-pill"
                  style={{ background: existingStatusMeta.bg, color: existingStatusMeta.color, padding: '2px 9px', fontSize: 11 }}
                >
                  {existingStatusMeta.label}
                </span>
              </div>

              <div className="dw-locked-submission-meta">
                <span>Progress: <strong>{todaySubmission.progressPercent ?? 0}%</strong></span>
                {todaySubmission.hoursSpent != null && (
                  <span>Hours: <strong>{todaySubmission.hoursSpent}h</strong></span>
                )}
                {todaySubmission.submittedAt && (
                  <span>
                    Submitted at:{' '}
                    <strong>
                      {new Date(todaySubmission.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </span>
                )}
              </div>

              {todaySubmission.note && (
                <p className="dwr-note-box--compact" style={{ marginTop: 6 }}>
                  {todaySubmission.note}
                </p>
              )}

              {/* Existing Manager Feedback */}
              <div
                className={`dwr-saved-box dwr-saved-box--compact ${
                  todaySubmission.status === 'APPROVED'
                    ? 'approved'
                    : todaySubmission.status === 'REJECTED'
                      ? 'rejected'
                      : ''
                }`}
                style={{
                  marginTop: 8,
                  background: todaySubmission.status === 'SUBMITTED' ? '#fffbeb' : undefined,
                  border: todaySubmission.status === 'SUBMITTED' ? '1px solid #fde68a' : undefined,
                }}
              >
                <div className="dwr-saved-head" style={{ marginBottom: 3 }}>
                  <h4 style={{ fontSize: 12 }}>
                    <FaUserCheck size={11} /> Manager Feedback
                  </h4>
                  {existingReview?.rating && (
                    <span className={`dwr-rating-tag ${existingReview.rating.toLowerCase()}`}>
                      <FaStar size={9} /> {existingReview.rating}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary, #334155)' }}>
                  {todaySubmission.status === 'SUBMITTED'
                    ? 'Awaiting Manager review.'
                    : (existingReview?.feedback || 'Reviewed with no written comment.')}
                </p>
                {todaySubmission.reviewedBy && (
                  <small style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
                    Reviewed by <strong>{cleanPersonName(todaySubmission.reviewedBy)}</strong>
                  </small>
                )}
              </div>

              <div className="dw-locked-next-note">
                Next daily submission will be enabled on <strong>{nextBusinessDateLabel}</strong>.
              </div>
            </div>
          )}

          {/* Work Completed Today */}
          <div className="dw-field">
            <div className="dw-label-row">
              <label>
                Work Completed Today <span className="dw-req">*</span>
              </label>
              <span className="dw-char-hint">{note.length} chars</span>
            </div>
            <textarea
              rows={4}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Summarize completed milestones, pull requests, or blockers encountered today..."
              disabled={isLockedForToday || loading}
              required
            />
          </div>

          {/* Working Hours + Task Progress Row */}
          <div className="dw-form-row">
            <div className="dw-field">
              <div className="dw-label-row">
                <label>
                  <FaClock size={11} style={{ marginRight: 5, color: '#6366f1' }} />
                  Working Hours <span className="dw-req">*</span>
                </label>
                <div className="dw-hour-presets">
                  {QUICK_HOURS.map(h => (
                    <button
                      key={h}
                      type="button"
                      className={`dw-hour-chip ${Number(hours) === h ? 'active' : ''}`}
                      onClick={() => setHours(String(h))}
                      disabled={isLockedForToday || loading}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="e.g., 4.5"
                disabled={isLockedForToday || loading}
                required
              />
            </div>

            <div className="dw-field">
              <div className="dw-label-row">
                <label>Updated Progress</label>
                <span className="dw-progress-val">{progress}%</span>
              </div>
              <div className="dw-slider-wrap">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={e => setProgress(Number(e.target.value))}
                  disabled={isLockedForToday || loading}
                  className="dw-range"
                />
                <div className="dw-range-ticks">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Proof Link */}
          <div className="dw-field">
            <label>
              <FaLink size={11} style={{ marginRight: 5, color: '#6366f1' }} />
              Proof Link <span className="dw-opt">(Optional)</span>
            </label>
            <input
              type="url"
              value={proofLink}
              onChange={e => setProofLink(e.target.value)}
              placeholder="https://github.com/org/repo/pull/12 or document URL"
              disabled={isLockedForToday || loading}
            />
          </div>

          {/* File Attachment */}
          <div className="dw-field">
            <label>
              <FaPaperclip size={11} style={{ marginRight: 5, color: '#6366f1' }} />
              Attachment <span className="dw-opt">(Optional)</span>
            </label>

            {!file ? (
              <label className="dw-file-drop" style={isLockedForToday ? { opacity: 0.55, pointerEvents: 'none' } : undefined}>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  disabled={isLockedForToday || loading}
                  style={{ display: 'none' }}
                />
                <FaPaperclip size={14} color="#6366f1" />
                <span>Click to attach screenshot, PDF, or deliverable file</span>
              </label>
            ) : (
              <div className="dw-file-selected">
                <div className="dw-file-info">
                  <FaPaperclip size={12} color="#6366f1" />
                  <span className="dw-file-name">{file.name}</span>
                  <span className="dw-file-size">({formatBytes(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="dw-file-remove"
                  title="Remove attachment"
                  disabled={isLockedForToday || loading}
                >
                  <FaTimes size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="dw-error">
              <FaExclamationCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="dw-success">
              <FaCheckCircle size={13} />
              <span>{success}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="dw-primary-btn"
            disabled={loading || checkingHistory || isLockedForToday || !activeTasks.length}
          >
            <FaPaperPlane size={12} />
            {loading
              ? 'Submitting Report...'
              : isLockedForToday
                ? "Today's work has already been submitted."
                : 'Submit to Manager'}
          </button>
        </form>
      )}
    </div>
  );
}
