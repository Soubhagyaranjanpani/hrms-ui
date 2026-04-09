import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTimes, FaSave, FaExclamationCircle } from 'react-icons/fa';
import { toast } from '../components/Toast';
import { STORAGE_KEYS } from '../config/api.config';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; }
};

/* ── replace these with real API calls ── */
const TEAM_MEMBERS = [
  { id: 2, name: 'Arjun Mehta',  role: 'Lead',     dept: 'Engineering' },
  { id: 3, name: 'Priya Nair',   role: 'Employee',  dept: 'Design' },
  { id: 4, name: 'Karan Singh',  role: 'Employee',  dept: 'Engineering' },
  { id: 5, name: 'Neha Gupta',   role: 'Employee',  dept: 'QA' },
  { id: 6, name: 'Dev Patel',    role: 'Lead',      dept: 'Backend' },
];

const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'HR', 'Backend', 'DevOps', 'Marketing', 'Finance'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const SUBTASK_TYPES = ['Frontend', 'Backend', 'Design', 'Testing', 'DevOps', 'Documentation', 'Research', 'Database'];

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const CharCount = ({ value, max }) => {
  const len = (value || '').length;
  const warn = len > max * 0.85;
  return (
    <span className="char-count" style={{ color: warn ? '#f97316' : '#8b92b8' }}>
      {len}/{max}
    </span>
  );
};

export default function CreateTask({ user }) {
  const navigate = useNavigate();
  const currentUser = user || getUser();
  const isManager = currentUser?.role === 'Manager' || currentUser?.roleName === 'Manager';

  const [form, setForm] = useState({
    title: '', description: '', assignee: '', dept: '', priority: 'Medium',
    deadline: '', effort: '', subtask: '', tags: '', note: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateField = (field, value) => {
    if (!value && ['title', 'assignee', 'dept', 'deadline'].includes(field)) {
      return 'This field is required';
    }
    if (field === 'title' && value && value.trim().length < 3) {
      return 'Minimum 3 characters required';
    }
    if (field === 'title' && value && value.trim().length > 100) {
      return 'Maximum 100 characters allowed';
    }
    return '';
  };

  const handleChange = (field, value) => {
    if (field === 'title' && value.length > 100) return;
    
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  const validateAll = () => {
    const errors = {};
    const fields = ['title', 'assignee', 'dept', 'deadline'];
    fields.forEach(f => {
      const err = validateField(f, form[f]);
      if (err) errors[f] = err;
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['title', 'assignee', 'dept', 'deadline'];
    setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    
    const errs = validateAll();
    setErrors(errs);
    
    if (Object.keys(errs).length > 0) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    setSubmitting(true);
    /* ── replace with real API call ── */
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Success', 'Task created successfully');
      navigate('/tasks');
    }, 900);
  };

  const isFieldErr = (f) => touched[f] && !!errors[f];
  const isFieldOk = (f) => touched[f] && !errors[f] && form[f];

  return (
    <div className="task-root">
      {/* Header */}
      <div className="task-header">
        <div className="task-header-left">
          <div>
            <h1 className="task-title">Create New Task</h1>
            <p className="task-subtitle">Fill in the details below to submit a task</p>
          </div>
        </div>
        
      </div>

      {/* Main Form */}
      <div className="task-form-wrap">
        <form onSubmit={handleSubmit} noValidate>
          {/* Task Information Section */}
          <div className="task-form-section">
            <div className="task-section-label">Task Information</div>
            <div className="task-form-grid">
              <div className={`task-field ${isFieldErr('title') ? 'has-error' : ''} ${isFieldOk('title') ? 'has-ok' : ''}`}>
                <div className="task-label-row">
                  <label>Task Title <span className="req">*</span></label>
                  <CharCount value={form.title} max={100} />
                </div>
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={form.title}
                  maxLength={100}
                  onChange={(e) => handleChange('title', e.target.value)}
                  onBlur={() => handleBlur('title')}
                />
                <FieldError msg={errors.title} />
                <small className="task-hint-text">3–100 characters, descriptive title</small>
              </div>

              <div className="task-field">
                <label>Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe the task — goals, requirements, acceptance criteria…"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                <small className="task-hint-text">Optional, but recommended</small>
              </div>
            </div>
          </div>

          <div className="task-divider" />

          {/* Assignment & Details Section */}
          <div className="task-form-section">
            <div className="task-section-label">Assignment & Details</div>
            <div className="task-form-grid two-col">
              <div className={`task-field ${isFieldErr('assignee') ? 'has-error' : ''}`}>
                <label>Assign To <span className="req">*</span></label>
                <select
                  value={form.assignee}
                  onChange={(e) => handleChange('assignee', e.target.value)}
                  onBlur={() => handleBlur('assignee')}
                >
                  <option value="">Select assignee</option>
                  {TEAM_MEMBERS.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role} · {m.dept})</option>
                  ))}
                </select>
                <FieldError msg={errors.assignee} />
              </div>

              <div className={`task-field ${isFieldErr('dept') ? 'has-error' : ''}`}>
                <label>Department <span className="req">*</span></label>
                <select
                  value={form.dept}
                  onChange={(e) => handleChange('dept', e.target.value)}
                  onBlur={() => handleBlur('dept')}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
                <FieldError msg={errors.dept} />
              </div>

              <div className="task-field">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className={`task-field ${isFieldErr('deadline') ? 'has-error' : ''}`}>
                <label>Deadline <span className="req">*</span></label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  onBlur={() => handleBlur('deadline')}
                  min={new Date().toISOString().split('T')[0]}
                />
                <FieldError msg={errors.deadline} />
                <small className="task-hint-text">Cannot be a past date</small>
              </div>

              

              <div className="task-field">
                <label>Estimated Effort</label>
                <input
                  type="text"
                  placeholder="e.g., 3 days, 8 hours"
                  value={form.effort}
                  onChange={(e) => handleChange('effort', e.target.value)}
                />
                <small className="task-hint-text">Optional time estimate</small>
              </div>

              <div className="task-field">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Frontend, UX, Bug"
                  value={form.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                />
                <small className="task-hint-text">Add relevant tags for categorization</small>
              </div>
            </div>
          </div>

          <div className="task-divider" />

          {/* Additional Notes Section */}
          <div className="task-form-section">
            <div className="task-section-label">Additional Notes</div>
            <div className="task-field">
              <label>Internal Note (optional)</label>
              <textarea
                rows={3}
                placeholder="Any special instructions, references, or context for the assignee…"
                value={form.note}
                onChange={(e) => handleChange('note', e.target.value)}
              />
              <small className="task-hint-text">This will be visible to the assignee</small>
            </div>
          </div>

          {/* Footer */}
          <div className="task-form-footer">
            <button type="button" className="task-cancel-footer-btn" onClick={() => navigate('/tasks')}>
              Cancel
            </button>
            <button type="submit" className="task-submit-btn" disabled={submitting}>
              {submitting
                ? <><span className="task-spinner" /> Creating…</>
                : <><FaSave size={12} /> Create Task</>
              }
            </button>
          </div>
        </form>
      </div>

      
    </div>
  );
}