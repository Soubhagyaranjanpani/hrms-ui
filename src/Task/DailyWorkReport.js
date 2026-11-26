import React, { useState, useRef } from 'react';
import {
  FaCalendarDay, FaTasks, FaClock, FaLink, FaPaperclip,
  FaPaperPlane, FaCheckCircle, FaExclamationCircle, FaLock, FaTimes
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getMultipartAuthHeaders
} from '../config/api.config';
import { formatDate } from './DailyWorkCalendar';
import './DailyWork.css';

const QUICK_HOURS = [1, 2, 4, 8];

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DailyWorkReport({
  tasks = [],
  selectedDate,
  onSubmitted
}) {
  const [taskId, setTaskId]       = useState('');
  const [note, setNote]           = useState('');
  const [hours, setHours]         = useState('');
  const [progress, setProgress]   = useState(0);
  const [proofLink, setProofLink] = useState('');
  const [file, setFile]           = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef(null);

  const today = formatDate(new Date());
  const isToday = selectedDate === today;

  const activeTasks = Array.isArray(tasks)
    ? tasks.filter(task => task.status === 'IN_PROGRESS')
    : [];

  const selectedTask = activeTasks.find(t => String(t.id) === String(taskId));

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setSuccess('Daily work report submitted to manager successfully.');
      setTaskId('');
      setNote('');
      setHours('');
      setProgress(0);
      setProofLink('');
      clearFile();

      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            <p className="dw-subtitle">Log today&apos;s task progress &amp; proof of work</p>
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
                  {selectedTask.department || 'General'} · Current Progress: <strong>{selectedTask.progress || 0}%</strong>
                </span>
              </div>
            )}
          </div>

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
            />
          </div>

          {/* File Attachment */}
          <div className="dw-field">
            <label>
              <FaPaperclip size={11} style={{ marginRight: 5, color: '#6366f1' }} />
              Attachment <span className="dw-opt">(Optional)</span>
            </label>

            {!file ? (
              <label className="dw-file-drop">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => setFile(e.target.files?.[0] || null)}
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
            disabled={loading || !activeTasks.length}
          >
            <FaPaperPlane size={12} />
            {loading ? 'Submitting Report...' : 'Submit to Manager'}
          </button>
        </form>
      )}
    </div>
  );
}