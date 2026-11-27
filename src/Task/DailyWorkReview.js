import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt, FaClock, FaExternalLinkAlt,
  FaDownload, FaCheck, FaTimes, FaStar, FaExclamationCircle,
  FaUserCheck, FaChevronDown
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  getMultipartAuthHeaders
} from '../config/api.config';
import {
  cleanPersonName,
  safeReadJson,
  parseApiError,
  notifyTaskDataChanged
} from './taskAccess';
import {
  buildReviewComment,
  parseReview
} from './taskRating';
import './DailyWork.css';

const STATUS_META = {
  SUBMITTED: { label: 'Pending Review', bg: '#fef3c7', color: '#92400e' },
  APPROVED:  { label: 'Approved',       bg: '#dcfce7', color: '#166534' },
  REJECTED:  { label: 'Rework Needed',  bg: '#fee2e2', color: '#991b1b' },
};

const RATING_OPTIONS = [
  { id: 'LOW',    label: 'Low (1/3)',    desc: 'Needs improvement',    color: '#dc2626' },
  { id: 'MEDIUM', label: 'Medium (2/3)', desc: 'Meets expectations',   color: '#d97706' },
  { id: 'HIGH',   label: 'High (3/3)',   desc: 'Exceeds expectations', color: '#16a34a' },
];

export default function DailyWorkReview({
  submission,
  canReview = false,
  onReviewed,
  defaultExpanded = false
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded]                 = useState(defaultExpanded);
  const [rating, setRating]                     = useState('');
  const [feedback, setFeedback]                 = useState('');
  const [submittingAction, setSubmittingAction] = useState(null); // 'approve' | 'reject' | null
  const [downloading, setDownloading]           = useState(false);
  const [error, setError]                       = useState('');
  const reviewBusyRef = useRef(false);

  // Reset form state whenever a different submission is selected
  useEffect(() => {
    setExpanded(defaultExpanded);
    setRating('');
    setFeedback('');
    setSubmittingAction(null);
    setError('');
  }, [submission?.id, defaultExpanded]);

  if (!submission) return null;

  const savedReview = parseReview(submission.reviewComment);
  const statusInfo  = STATUS_META[submission.status] || {
    label: submission.status || 'Unknown',
    bg: '#f1f5f9',
    color: '#475569'
  };

  const cleanEmpName     = cleanPersonName(submission.employeeName) || 'Employee';
  const cleanReviewer    = cleanPersonName(submission.reviewedBy);
  const employeeInitial  = cleanEmpName.charAt(0).toUpperCase();
  const progressVal      = Math.min(100, Math.max(0, Number(submission.progressPercent) || 0));
  const hasValidLink     = submission.proofLink && /^https?:\/\//i.test(submission.proofLink);
  const isBusy           = submittingAction !== null;

  const review = async (approved) => {
    setError('');
    if (!canReview || isBusy || reviewBusyRef.current) return;

    if (approved && !rating) {
      setError('Please select a performance rating before approving.');
      return;
    }

    if (!feedback.trim()) {
      setError('Please enter your feedback before submitting.');
      return;
    }

    try {
      reviewBusyRef.current = true;
      setSubmittingAction(approved ? 'approve' : 'reject');

      const comment = approved
        ? buildReviewComment(rating, feedback)
        : feedback.trim();

      const response = await fetch(
        API_ENDPOINTS.REVIEW_TASK_SUBMISSION(submission.id),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ approved, comment })
        }
      );

      const data = await safeReadJson(response);

      if (!response.ok) {
        throw new Error(parseApiError(response, data, 'Review failed'));
      }

      notifyTaskDataChanged();
      onReviewed?.();
    } catch (err) {
      setError(err.message);
    } finally {
      reviewBusyRef.current = false;
      setSubmittingAction(null);
    }
  };

  const handleDownloadProof = async (e) => {
    e?.stopPropagation?.();
    if (downloading) return;
    setError('');
    try {
      setDownloading(true);
      const res = await fetch(
        API_ENDPOINTS.DOWNLOAD_PROOF(submission.id),
        { headers: getMultipartAuthHeaders() }
      );

      if (!res.ok) {
        const errData = await safeReadJson(res);
        throw new Error(parseApiError(res, errData, 'Proof download failed'));
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');

      a.href     = url;
      a.download = submission.proofFileName || 'proof';
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`dwr-row-card ${expanded ? 'open' : ''}`}>
      {/* Ultra-Compact 1-Line Summary Bar (click to open details) */}
      <div
        className="dwr-row-summary"
        onClick={() => setExpanded(prev => !prev)}
        title="Click to expand submission details"
      >
        <div className="dwr-row-left">
          <span className="dwr-avatar" style={{ width: 22, height: 22, fontSize: 10, flexShrink: 0 }}>
            {employeeInitial}
          </span>
          {submission.taskId && (
            <button
              type="button"
              className="dwr-task-link"
              style={{ flexShrink: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/TaskDetail', { state: { taskId: submission.taskId } });
              }}
              title="Open Task Workspace"
            >
              <span className="dwr-task-id-pill">T-{String(submission.taskId).padStart(3, '0')}</span>
            </button>
          )}
          <span className="dwr-row-emp-name">{cleanEmpName}</span>
          <span className="dwr-row-task-text">
            {submission.taskTitle || 'Daily Submission'}
          </span>
        </div>

        <div className="dwr-row-right">
          {submission.hoursSpent !== null && submission.hoursSpent !== undefined && (
            <span className="dwr-mini-chip">
              <FaClock size={9} /> {submission.hoursSpent}h
            </span>
          )}
          <span className="dwr-mini-chip dwr-mini-chip--prog">
            {progressVal}%
          </span>
          {submission.status !== 'SUBMITTED' && savedReview.rating && (
            <span className={`dwr-rating-tag ${savedReview.rating.toLowerCase()}`} style={{ padding: '2px 7px', fontSize: 10 }}>
              <FaStar size={8} /> {savedReview.rating}
            </span>
          )}
          <span
            className="dwr-status-pill"
            style={{ background: statusInfo.bg, color: statusInfo.color, padding: '2px 8px', fontSize: 10.5 }}
          >
            {statusInfo.label}
          </span>
          <button
            type="button"
            className={`dwr-expand-btn ${expanded ? 'open' : ''}`}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(prev => !prev);
            }}
          >
            <FaChevronDown size={9} />
          </button>
        </div>
      </div>

      {/* Smoothly Animated Collapsible Details, Proof & Review Form */}
      <div className={`dwr-collapse ${expanded ? 'open' : ''}`} aria-hidden={!expanded}>
        <div className="dwr-collapse-inner">
          <div className="dwr-row-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11.5, color: 'var(--text-muted, #64748b)' }}>
              <span>
                <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{submission.taskTitle || 'Daily Submission'}</strong>
                {' · '}Submitted by <strong>{cleanEmpName}</strong>
              </span>
              {submission.submissionDate && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <FaCalendarAlt size={10} /> {submission.submissionDate}
                </span>
              )}
            </div>

            {/* Work Completed Notes */}
            <div>
              <span className="dwr-section-lbl" style={{ marginBottom: 4 }}>Work Completed</span>
              <p className="dwr-note-box--compact">
                {submission.note || 'No work notes provided.'}
              </p>
            </div>

            {/* Proof Link & File Download */}
            {(hasValidLink || submission.hasProofFile) && (
              <div className="dwr-proof-actions" style={{ marginBottom: 0 }}>
                {hasValidLink && (
                  <a
                    href={submission.proofLink}
                    target="_blank"
                    rel="noreferrer"
                    className="dwr-proof-btn link"
                    style={{ padding: '5px 10px', fontSize: 12 }}
                  >
                    <FaExternalLinkAlt size={10} /> View Work Proof
                  </a>
                )}

                {submission.hasProofFile && (
                  <button
                    type="button"
                    className="dwr-proof-btn file"
                    style={{ padding: '5px 10px', fontSize: 12 }}
                    disabled={downloading}
                    onClick={handleDownloadProof}
                  >
                    <FaDownload size={10} />
                    {downloading
                      ? 'Downloading...'
                      : `Download ${submission.proofFileName || 'Proof'}`}
                  </button>
                )}
              </div>
            )}

            {/* Saved Manager Feedback */}
            {submission.status !== 'SUBMITTED' && (
              <div className={`dwr-saved-box dwr-saved-box--compact ${submission.status === 'APPROVED' ? 'approved' : 'rejected'}`} style={{ marginTop: 0 }}>
                <div className="dwr-saved-head" style={{ marginBottom: 4 }}>
                  <h4 style={{ fontSize: 12.5 }}>
                    <FaUserCheck size={12} /> Manager Feedback
                  </h4>
                  {savedReview.rating && (
                    <span className={`dwr-rating-tag ${savedReview.rating.toLowerCase()}`}>
                      <FaStar size={9} /> {savedReview.rating}
                    </span>
                  )}
                </div>

                <p style={{ margin: '0 0 4px', fontSize: 12.5, lineHeight: 1.45, color: 'var(--text-secondary, #334155)' }}>
                  {savedReview.feedback || 'No feedback provided.'}
                </p>

                {cleanReviewer && (
                  <small style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
                    Reviewed by <strong>{cleanReviewer}</strong>
                  </small>
                )}
              </div>
            )}

            {/* Manager Action Form */}
            {canReview && submission.status === 'SUBMITTED' && (
              <div className="dwr-review-form" style={{ marginTop: 2, paddingTop: 10, gap: 10 }}>
                <div>
                  <label className="dwr-section-lbl" style={{ marginBottom: 0 }}>
                    Performance Rating <span style={{ color: '#ef4444' }}>*</span>{' '}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted, #94a3b8)' }}>
                      (Required for approval)
                    </span>
                  </label>

                  <div className="dwr-rating-grid">
                    {RATING_OPTIONS.map(opt => {
                      const isSelected = rating === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => { setRating(opt.id); setError(''); }}
                          className={`dwr-rate-card ${opt.id.toLowerCase()} ${isSelected ? 'active' : ''}`}
                          aria-pressed={isSelected}
                        >
                          <div className="dwr-rate-top">
                            <FaStar size={11} color={isSelected ? opt.color : '#94a3b8'} />
                            <strong>{opt.label}</strong>
                          </div>
                          <span>{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="dwr-section-lbl" style={{ marginBottom: 0 }}>
                    Manager Feedback <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={2}
                    className="dwr-textarea"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Enter feedback or rework instructions..."
                  />
                </div>

                {error && (
                  <div className="dwr-err-alert">
                    <FaExclamationCircle size={12} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="dwr-btn-row">
                  <button
                    type="button"
                    className="dwr-btn-reject"
                    disabled={isBusy}
                    onClick={() => review(false)}
                  >
                    <FaTimes size={11} />
                    {submittingAction === 'reject' ? 'Rejecting...' : 'Reject / Rework'}
                  </button>

                  <button
                    type="button"
                    className="dwr-btn-approve"
                    disabled={isBusy}
                    onClick={() => review(true)}
                  >
                    <FaCheck size={11} />
                    {submittingAction === 'approve' ? 'Approving...' : 'Approve Report'}
                  </button>
                </div>
              </div>
            )}

            {/* Standalone Error */}
            {error && !(canReview && submission.status === 'SUBMITTED') && (
              <div className="dwr-err-alert">
                <FaExclamationCircle size={12} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
