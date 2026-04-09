import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaComment, FaExchangeAlt, FaCheckCircle, FaUndo, FaTasks, FaPlus, FaSave, FaExclamationCircle } from 'react-icons/fa';
import { STORAGE_KEYS } from '../config/api.config';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; }
};

/* ── shared mock (replace with API) ── */
const MOCK_TASKS = [
  { id: 'T-001', title: 'Redesign User Onboarding Flow', description: 'Revamp the complete onboarding experience for new users including welcome screens, tutorial steps, and first-time setup wizard.', status: 'In Progress', priority: 'High', assigneeName: 'Arjun Mehta', assigneeId: 2, assigneeRole: 'Lead', assigneeDept: 'Engineering', createdByName: 'Riya Sharma', createdById: 1, dept: 'Design', deadline: '2026-04-20', effort: '5 days', tags: ['UX','Frontend'], progress: 65, comments: [{ author: 'Riya Sharma', text: 'Please ensure mobile responsiveness is covered.', time: '2h ago' }], activity: [{ type: 'indigo', text: '<strong>Arjun Mehta</strong> updated status to In Progress', time: '2h ago' },{ type: 'green', text: '<strong>Riya Sharma</strong> approved the task', time: '1d ago' },{ type: 'amber', text: '<strong>Task created</strong> by Riya Sharma', time: '3d ago' }], changeRequest: null,
    subtasks: [
      { id: 'ST-001', title: 'Design wireframes', status: 'Completed', priority: 'High', assignee: 'Priya Nair', deadline: '2026-04-15', effort: '2 days' },
      { id: 'ST-002', title: 'Develop UI components', status: 'In Progress', priority: 'Critical', assignee: 'Arjun Mehta', deadline: '2026-04-18', effort: '3 days' }
    ]
  },
  { id: 'T-002', title: 'API Rate Limiting Implementation', description: 'Implement rate limiting on all public API endpoints to prevent abuse.', status: 'Pending Approval', priority: 'Critical', assigneeName: 'Dev Patel', assigneeId: 6, assigneeRole: 'Lead', assigneeDept: 'Backend', createdByName: 'Karan Singh', createdById: 4, dept: 'Backend', deadline: '2026-04-15', effort: '3 days', tags: ['Backend','Security'], progress: 0, comments: [], activity: [{ type: 'amber', text: '<strong>Task created</strong> by Karan Singh, awaiting approval', time: '5h ago' }], changeRequest: null, subtasks: [] },
  { id: 'T-003', title: 'Monthly Performance Report Q1', description: 'Compile and analyze Q1 performance metrics for all departments.', status: 'Completed', priority: 'Medium', assigneeName: 'Priya Nair', assigneeId: 3, assigneeRole: 'Employee', assigneeDept: 'Design', createdByName: 'Riya Sharma', createdById: 1, dept: 'HR', deadline: '2026-04-10', effort: '2 days', tags: ['Reports','Analytics'], progress: 100, comments: [{ author: 'Priya Nair', text: 'Report submitted. Awaiting sign-off.', time: '1d ago' }], activity: [{ type: 'green', text: '<strong>Priya Nair</strong> marked task Completed', time: '1d ago' }], changeRequest: null, subtasks: [] },
  { id: 'T-004', title: 'Fix Authentication Bug on Mobile', description: 'Users on iOS 17+ experiencing token expiry issues.', status: 'In Review', priority: 'High', assigneeName: 'Karan Singh', assigneeId: 4, assigneeRole: 'Employee', assigneeDept: 'Engineering', createdByName: 'Arjun Mehta', createdById: 2, dept: 'Engineering', deadline: '2026-04-12', effort: '1 day', tags: ['Bug','Mobile'], progress: 85, comments: [], activity: [{ type: 'purple', text: '<strong>Karan Singh</strong> submitted for review', time: '3h ago' }], changeRequest: null, subtasks: [] },
  { id: 'T-005', title: 'Set Up CI/CD Pipeline for Staging', description: 'Configure GitHub Actions workflow for automated deployment.', status: 'Pending Approval', priority: 'Medium', assigneeName: 'Dev Patel', assigneeId: 6, assigneeRole: 'Lead', assigneeDept: 'Backend', createdByName: 'Dev Patel', createdById: 6, dept: 'DevOps', deadline: '2026-04-25', effort: '4 days', tags: ['DevOps'], progress: 0, comments: [], activity: [{ type: 'amber', text: '<strong>Dev Patel</strong> created task', time: '6h ago' }], changeRequest: null, subtasks: [] },
  { id: 'T-006', title: 'User Research for New Dashboard', description: 'Conduct 10 user interviews and synthesize insights for analytics dashboard design.', status: 'Change Requested', priority: 'Low', assigneeName: 'Priya Nair', assigneeId: 3, assigneeRole: 'Employee', assigneeDept: 'Design', createdByName: 'Riya Sharma', createdById: 1, dept: 'Design', deadline: '2026-04-30', effort: '6 days', tags: ['Research','UX'], progress: 30, comments: [], activity: [{ type: 'red', text: '<strong>Priya Nair</strong> requested a change in deadline', time: '1h ago' }], changeRequest: { reason: 'Timeline too tight due to existing commitments. Requesting 1-week extension.', requestedDeadline: '2026-05-07' }, subtasks: [] },
];

const PRIORITY_COLORS = { Critical: '#9d174d', High: '#ef4444', Medium: '#d97706', Low: '#059669' };
const PRIORITY_BG     = { Critical: '#fdf2f8', High: '#fee2e2', Medium: '#fef3c7', Low: '#d1fae5' };
const ACTIVITY_DOT    = { indigo: 'var(--accent-indigo)', green: 'var(--success)', amber: 'var(--warning)', red: 'var(--danger)', purple: '#8b5cf6' };

const StatusBadge = ({ status }) => {
  const map = { 'Pending Approval': ['#fef3c7','#92400e'], 'In Progress': ['#dbeafe','#1e40af'], 'Completed': ['#dcfce7','#166534'], 'In Review': ['#f3e8ff','#5b21b6'], 'Rejected': ['#fee2e2','#991b1b'], 'Change Requested': ['#fff7ed','#c2410c'] };
  const [bg, color] = map[status] || ['#f1f5f9','#475569'];
  return <span style={{ background: bg, color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{status}</span>;
};

// Team members for assignment
const TEAM_MEMBERS = [
  { id: 2, name: 'Arjun Mehta', role: 'Lead', dept: 'Engineering' },
  { id: 3, name: 'Priya Nair', role: 'Employee', dept: 'Design' },
  { id: 4, name: 'Karan Singh', role: 'Employee', dept: 'Engineering' },
  { id: 5, name: 'Neha Gupta', role: 'Employee', dept: 'QA' },
  { id: 6, name: 'Dev Patel', role: 'Lead', dept: 'Backend' },
];

const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'HR', 'Backend', 'DevOps'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

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

export default function TaskDetail({ user }) {
  const navigate      = useNavigate();
  const location      = useLocation();
  const currentUser   = user || getUser();
  const isManager     = currentUser?.role === 'Manager' || currentUser?.roleName === 'Manager';

  const taskIdFromState = location.state?.taskId;
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [activeTab, setActiveTab] = useState('overview');
  const [commentText, setCommentText] = useState('');
  const [showCRModal, setShowCRModal] = useState(false);
  const [crReason, setCrReason] = useState('');
  const [crDeadline, setCrDeadline] = useState('');
  const [notification, setNotification] = useState(null);
  
  // Subtask form state
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subtaskForm, setSubtaskForm] = useState({
    title: '',
    description: '',
    assignee: '',
    dept: '',
    priority: 'Medium',
    deadline: '',
    effort: '',
    tags: '',
  });
  const [subtaskErrors, setSubtaskErrors] = useState({});
  const [subtaskTouched, setSubtaskTouched] = useState({});

  const task = tasks.find(t => t.id === taskIdFromState) || tasks[0];

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const updateTask = (updates) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));

  // Subtask form validation
  const validateSubtaskField = (field, value) => {
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

  const handleSubtaskChange = (field, value) => {
    if (field === 'title' && value.length > 100) return;
    
    const updated = { ...subtaskForm, [field]: value };
    setSubtaskForm(updated);
    if (subtaskTouched[field]) {
      setSubtaskErrors(prev => ({ ...prev, [field]: validateSubtaskField(field, value) }));
    }
  };

  const handleSubtaskBlur = (field) => {
    setSubtaskTouched(prev => ({ ...prev, [field]: true }));
    setSubtaskErrors(prev => ({ ...prev, [field]: validateSubtaskField(field, subtaskForm[field]) }));
  };

  const validateSubtaskAll = () => {
    const errors = {};
    const fields = ['title', 'assignee', 'dept', 'deadline'];
    fields.forEach(f => {
      const err = validateSubtaskField(f, subtaskForm[f]);
      if (err) errors[f] = err;
    });
    return errors;
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    const allFields = ['title', 'assignee', 'dept', 'deadline'];
    setSubtaskTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    
    const errs = validateSubtaskAll();
    setSubtaskErrors(errs);
    
    if (Object.keys(errs).length > 0) {
      notify('Please fix the highlighted fields', 'danger');
      return;
    }
    
    setSubmitting(true);
    
    // Simulate API call - create new subtask
    setTimeout(() => {
      const newSubtask = {
        id: `ST-${Math.floor(Math.random() * 1000)}`,
        title: subtaskForm.title,
        description: subtaskForm.description,
        status: 'Pending Approval',
        priority: subtaskForm.priority,
        assignee: TEAM_MEMBERS.find(m => m.id == subtaskForm.assignee)?.name || 'Unknown',
        deadline: subtaskForm.deadline,
        effort: subtaskForm.effort,
        tags: subtaskForm.tags ? subtaskForm.tags.split(',') : [],
      };
      
      // Add subtask to the current task
      const currentSubtasks = task.subtasks || [];
      updateTask({ 
        subtasks: [...currentSubtasks, newSubtask],
        activity: [{ type: 'green', text: `<strong>${currentUser?.name}</strong> added subtask: ${newSubtask.title}`, time: 'just now' }, ...(task.activity || [])]
      });
      
      setSubmitting(false);
      setShowSubtaskForm(false);
      setSubtaskForm({
        title: '',
        description: '',
        assignee: '',
        dept: '',
        priority: 'Medium',
        deadline: '',
        effort: '',
        tags: '',
      });
      setSubtaskErrors({});
      setSubtaskTouched({});
      notify('Subtask created successfully!');
    }, 900);
  };

  const handleApprove = () => {
    updateTask({ status: 'In Progress', activity: [{ type: 'green', text: `<strong>${currentUser?.name || 'Manager'}</strong> approved this task`, time: 'just now' }, ...(task.activity || [])] });
    notify('Task approved and moved to In Progress!');
  };
  const handleReject = () => {
    updateTask({ status: 'Rejected', activity: [{ type: 'red', text: `<strong>${currentUser?.name || 'Manager'}</strong> rejected this task`, time: 'just now' }, ...(task.activity || [])] });
    notify('Task rejected.', 'danger');
  };
  const handleSubmitReview = () => {
    updateTask({ status: 'In Review', progress: Math.max(task.progress, 80), activity: [{ type: 'purple', text: `<strong>${task.assigneeName}</strong> submitted for review`, time: 'just now' }, ...(task.activity || [])] });
    notify('Submitted for review!');
  };
  const handleComplete = () => {
    updateTask({ status: 'Completed', progress: 100, activity: [{ type: 'green', text: `<strong>${currentUser?.name}</strong> marked as Completed`, time: 'just now' }, ...(task.activity || [])] });
    notify('Task marked as Completed 🎉');
  };
  const handleSendBack = () => {
    updateTask({ status: 'In Progress', activity: [{ type: 'indigo', text: `<strong>Manager</strong> sent task back to In Progress`, time: 'just now' }, ...(task.activity || [])] });
    notify('Task sent back to assignee.', 'warning');
  };
  const handleApproveChange = () => {
    updateTask({ deadline: task.changeRequest?.requestedDeadline || task.deadline, status: 'In Progress', changeRequest: null, activity: [{ type: 'green', text: `<strong>${currentUser?.name}</strong> approved change request`, time: 'just now' }, ...(task.activity || [])] });
    notify('Change request approved!');
  };
  const handleRejectChange = () => {
    updateTask({ status: 'In Progress', changeRequest: null, activity: [{ type: 'red', text: `<strong>${currentUser?.name}</strong> rejected change request`, time: 'just now' }, ...(task.activity || [])] });
    notify('Change request rejected.', 'danger');
  };
  const handleSendChange = () => {
    if (!crReason.trim()) return;
    updateTask({ status: 'Change Requested', changeRequest: { reason: crReason, requestedDeadline: crDeadline }, activity: [{ type: 'amber', text: `<strong>${task.assigneeName}</strong> sent a change request`, time: 'just now' }, ...(task.activity || [])] });
    setShowCRModal(false); setCrReason(''); setCrDeadline('');
    notify('Change request sent to manager.', 'warning');
  };
  const handleComment = () => {
    if (!commentText.trim()) return;
    updateTask({ comments: [...(task.comments || []), { author: currentUser?.name || 'You', text: commentText, time: 'just now' }] });
    setCommentText('');
    notify('Comment added!');
  };

  const STATUS_FLOW = ['Pending Approval','In Progress','In Review','Completed'];
  const statusIdx   = STATUS_FLOW.indexOf(task.status);

  const isSubtaskFieldErr = (f) => subtaskTouched[f] && !!subtaskErrors[f];
  const isSubtaskFieldOk = (f) => subtaskTouched[f] && !subtaskErrors[f] && subtaskForm[f];

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, padding: '8px 14px', background: activeTab === id ? 'var(--bg-white)' : 'transparent',
        border: 'none', borderRadius: 9, fontSize: 13, fontWeight: activeTab === id ? 700 : 500,
        color: activeTab === id ? 'var(--accent-indigo)' : 'var(--text-muted)',
        cursor: 'pointer', transition: 'all .2s',
        boxShadow: activeTab === id ? '0 1px 6px rgba(99,102,241,.12)' : 'none',
      }}
    >{label}</button>
  );

  return (
    <div style={{ padding: '22px 24px', background: 'var(--bg-page)', minHeight: '100vh', animation: 'tdFadeUp .35s ease' }}>
      <style>{`
        @keyframes tdFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .td-notif { position:fixed; bottom:22px; right:22px; z-index:9999; padding:12px 18px; border-radius:12px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:10px; animation:tdFadeUp .25s ease; }
        textarea.td-ta:focus { border-color:var(--accent-indigo)!important; box-shadow:0 0 0 3px rgba(99,102,241,.10); background:var(--bg-white)!important; outline:none; }
        
        /* Subtask form styles */
        .subtask-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .subtask-field label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .subtask-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .subtask-field input,
        .subtask-field select,
        .subtask-field textarea {
          padding: 10px 12px;
          border: 1.5px solid var(--border-medium);
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
          background: var(--bg-surface);
          transition: all 0.2s;
          width: 100%;
        }
        .subtask-field input:focus,
        .subtask-field select:focus,
        .subtask-field textarea:focus {
          outline: none;
          border-color: var(--accent-indigo);
          background: var(--bg-white);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .subtask-field.has-error input,
        .subtask-field.has-error select,
        .subtask-field.has-error textarea {
          border-color: var(--danger);
        }
        .subtask-field.has-ok input,
        .subtask-field.has-ok select {
          border-color: var(--success);
        }
        .subtask-hint-text {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .field-err {
          font-size: 11px;
          color: var(--danger);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .req {
          color: var(--accent-coral);
        }
        .subtask-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Notification */}
      {notification && (
        <div className="td-notif" style={{
          background: 'var(--primary-navy)', color: 'var(--text-light)',
          boxShadow: '0 8px 24px rgba(15,23,42,.25)',
          borderLeft: `4px solid ${notification.type === 'danger' ? 'var(--danger)' : notification.type === 'warning' ? 'var(--warning)' : 'var(--success)'}`,
        }}>
          {notification.type === 'danger' ? '❌' : notification.type === 'warning' ? '⚠️' : '✅'} {notification.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={() => navigate('/TaskList')} style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaArrowLeft size={11} /> Back to Tasks
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: 13, background: '#ede9fe', padding: '4px 11px', borderRadius: 7, fontWeight: 700, color: 'var(--accent-indigo)' }}>{task.id}</span>
          <StatusBadge status={task.status} />
          <span style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority], padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{task.priority}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Sora',sans-serif", letterSpacing: '-0.02em' }}>{task.title}</h1>
      </div>

      {/* ── Contextual Action Banner ── */}
      {task.status === 'Pending Approval' && (
        <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fcd34d', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>🔔 Action Required — Manager Review</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleApprove} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaCheck size={11} /> Approve Task</button>
            <button onClick={handleReject}  style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaTimes size={11} /> Reject Task</button>
          </div>
        </div>
      )}

      {task.status === 'In Progress' && (
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border: '1.5px solid #6ee7b7', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46', marginBottom: 12 }}>🚀 Task In Progress</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleSubmitReview} style={{ background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>🔍 Submit for Review</button>
            <button onClick={() => setShowCRModal(true)} style={{ background: 'transparent', border: '1.5px solid var(--warning)', color: 'var(--warning)', padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FaExchangeAlt size={11} /> Request Change</button>
            <button onClick={handleComplete} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaCheckCircle size={11} /> Mark Complete</button>
          </div>
        </div>
      )}

      {task.status === 'In Review' && (
        <div style={{ background: 'linear-gradient(135deg,#faf5ff,#f3e8ff)', border: '1.5px solid #a78bfa', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#5b21b6', marginBottom: 12 }}>🔍 Under Review — Manager Action</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleComplete}  style={{ background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaCheck size={11} /> Approve & Complete</button>
            <button onClick={handleSendBack}  style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '9px 18px', borderRadius: 11, fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaUndo size={11} /> Send Back</button>
          </div>
        </div>
      )}

      {task.status === 'Change Requested' && (
        <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fcd34d', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>↩ Change Request Pending</div>
          {task.changeRequest && (
            <div style={{ background: 'var(--bg-white)', borderRadius: 10, padding: '11px 14px', marginBottom: 12, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}><strong>Reason:</strong> {task.changeRequest.reason}</div>
              {task.changeRequest.requestedDeadline && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 Requested deadline: <strong>{task.changeRequest.requestedDeadline}</strong></div>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleApproveChange} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaCheck size={11} /> Approve Change</button>
            <button onClick={handleRejectChange}  style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaTimes size={11} /> Reject Change</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', padding: 4, borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: 20 }}>
        <TabBtn id="overview"  label="📋 Overview"  />
        <TabBtn id="activity"  label={`📜 Activity (${task.activity?.length || 0})`} />
        <TabBtn id="comments"  label={`💬 Comments (${task.comments?.length || 0})`} />
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Main Column */}
          <div>
            {/* Description */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📄 Description</h3></div>
              <div style={{ padding: 20 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{task.description || 'No description provided.'}</p>
                {task.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                    {task.tags.map(tag => (
                      <span key={tag} style={{ background: '#ede9fe', color: 'var(--accent-indigo)', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Progress */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📊 Progress</h3>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--accent-indigo)' }}>{task.progress}%</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ background: '#e8eaf6', borderRadius: 10, height: 12, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${task.progress}%`, background: task.progress >= 100 ? 'var(--success)' : 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 10, transition: 'width .6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {STATUS_FLOW.map(s => (
                    <span key={s} style={{ fontSize: 11, color: task.status === s ? 'var(--accent-indigo)' : 'var(--text-muted)', fontWeight: task.status === s ? 700 : 400 }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaTasks size={13} color="var(--accent-indigo)" />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Sub-tasks</h3>
                  <span style={{ background: '#ede9fe', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: 'var(--accent-indigo)' }}>{(task.subtasks || []).length}</span>
                </div>
                {!showSubtaskForm && (
                  <button
                    onClick={() => setShowSubtaskForm(true)}
                    style={{ background: 'transparent', border: '1px solid var(--accent-indigo)', color: 'var(--accent-indigo)', padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <FaPlus size={10} /> Add Subtask
                  </button>
                )}
              </div>
              <div style={{ padding: 20 }}>
                {/* Subtask Creation Form */}
                {showSubtaskForm && (
                  <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--accent-indigo)' }}>Create New Subtask</h4>
                      <button onClick={() => setShowSubtaskForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                    </div>
                    <form onSubmit={handleCreateSubtask}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className={`subtask-field ${isSubtaskFieldErr('title') ? 'has-error' : ''} ${isSubtaskFieldOk('title') ? 'has-ok' : ''}`}>
                          <div className="subtask-label-row">
                            <label>Title <span className="req">*</span></label>
                            <CharCount value={subtaskForm.title} max={100} />
                          </div>
                          <input
                            type="text"
                            placeholder="Subtask title"
                            value={subtaskForm.title}
                            onChange={(e) => handleSubtaskChange('title', e.target.value)}
                            onBlur={() => handleSubtaskBlur('title')}
                          />
                          <FieldError msg={subtaskErrors.title} />
                        </div>

                        <div className={`subtask-field ${isSubtaskFieldErr('assignee') ? 'has-error' : ''}`}>
                          <label>Assign To <span className="req">*</span></label>
                          <select
                            value={subtaskForm.assignee}
                            onChange={(e) => handleSubtaskChange('assignee', e.target.value)}
                            onBlur={() => handleSubtaskBlur('assignee')}
                          >
                            <option value="">Select assignee</option>
                            {TEAM_MEMBERS.map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                            ))}
                          </select>
                          <FieldError msg={subtaskErrors.assignee} />
                        </div>

                        <div className={`subtask-field ${isSubtaskFieldErr('dept') ? 'has-error' : ''}`}>
                          <label>Department <span className="req">*</span></label>
                          <select
                            value={subtaskForm.dept}
                            onChange={(e) => handleSubtaskChange('dept', e.target.value)}
                            onBlur={() => handleSubtaskBlur('dept')}
                          >
                            <option value="">Select department</option>
                            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                          </select>
                          <FieldError msg={subtaskErrors.dept} />
                        </div>

                        <div className="subtask-field">
                          <label>Priority</label>
                          <select
                            value={subtaskForm.priority}
                            onChange={(e) => handleSubtaskChange('priority', e.target.value)}
                          >
                            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                          </select>
                        </div>

                        <div className={`subtask-field ${isSubtaskFieldErr('deadline') ? 'has-error' : ''}`}>
                          <label>Deadline <span className="req">*</span></label>
                          <input
                            type="date"
                            value={subtaskForm.deadline}
                            onChange={(e) => handleSubtaskChange('deadline', e.target.value)}
                            onBlur={() => handleSubtaskBlur('deadline')}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <FieldError msg={subtaskErrors.deadline} />
                        </div>

                        <div className="subtask-field">
                          <label>Estimated Effort</label>
                          <input
                            type="text"
                            placeholder="e.g., 2 days"
                            value={subtaskForm.effort}
                            onChange={(e) => handleSubtaskChange('effort', e.target.value)}
                          />
                        </div>

                        <div className="subtask-field" style={{ gridColumn: 'span 2' }}>
                          <label>Description</label>
                          <textarea
                            rows={2}
                            placeholder="Subtask description (optional)"
                            value={subtaskForm.description}
                            onChange={(e) => handleSubtaskChange('description', e.target.value)}
                          />
                        </div>

                        <div className="subtask-field" style={{ gridColumn: 'span 2' }}>
                          <label>Tags (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="e.g., Frontend, API, Testing"
                            value={subtaskForm.tags}
                            onChange={(e) => handleSubtaskChange('tags', e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                        <button type="button" onClick={() => setShowSubtaskForm(false)} style={{ padding: '8px 16px', border: '1px solid var(--border-medium)', borderRadius: 8, background: 'var(--bg-white)', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={submitting} style={{ padding: '8px 20px', background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {submitting ? <><span className="subtask-spinner" /> Creating...</> : <><FaSave size={10} /> Create Subtask</>}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Subtasks List */}
                {task.subtasks && task.subtasks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {task.subtasks.map(sub => (
                      <div
                        key={sub.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 10,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#ede9fe', padding: '2px 6px', borderRadius: 5, fontWeight: 600, color: 'var(--accent-indigo)' }}>{sub.id}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{sub.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Due: {sub.deadline} · {sub.effort}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <StatusBadge status={sub.status} />
                          <span style={{ background: PRIORITY_BG[sub.priority] || '#f1f5f9', color: PRIORITY_COLORS[sub.priority] || '#475569', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{sub.priority}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>👤 {sub.assignee}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !showSubtaskForm && (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      <FaTasks style={{ fontSize: 32, opacity: 0.3, marginBottom: 10 }} />
                      <p style={{ fontSize: 13, margin: 0 }}>No sub-tasks yet. Click "Add Subtask" to create one.</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📌 Task Details</h3></div>
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Task ID', task.id],
                  ['Department', task.dept],
                  ['Deadline', task.deadline],
                  ['Effort', task.effort],
                  ['Created By', task.createdByName],
                  ['Assigned To', task.assigneeName],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 11, padding: '11px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Column */}
          <div>
            {/* Assignee */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>👤 Assignee</h3></div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 auto 12px', fontFamily: "'Sora',sans-serif" }}>
                  {task.assigneeName?.charAt(0) || '?'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{task.assigneeName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{task.assigneeRole} · {task.assigneeDept}</div>
              </div>
            </div>

            {/* Status Timeline */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>🗺 Status Flow</h3></div>
              <div style={{ padding: 18 }}>
                {[
                  { label: 'Pending Approval', icon: '⏳', color: '#fbbf24' },
                  { label: 'In Progress', icon: '🚀', color: 'var(--accent-indigo)' },
                  { label: 'In Review', icon: '🔍', color: '#8b5cf6' },
                  { label: 'Completed', icon: '✅', color: 'var(--success)' },
                ].map((s, i) => {
                  const isDone = statusIdx > i;
                  const isActive = task.status === s.label;
                  return (
                    <div key={s.label} style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
                      {i < 3 && <div style={{ position: 'absolute', left: 15, top: 30, bottom: 0, width: 2, background: 'var(--border-light)' }} />}
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                        background: isDone ? 'var(--success)' : isActive ? s.color : 'var(--bg-surface)',
                        border: `2px solid ${isDone ? 'var(--success)' : isActive ? s.color : 'var(--border-medium)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                        boxShadow: isActive ? `0 0 0 3px ${s.color}33` : undefined,
                        color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                      }}>
                        {isDone ? '✅' : s.icon}
                      </div>
                      <div style={{ paddingTop: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isDone ? 'var(--success)' : isActive ? s.color : 'var(--text-muted)' }}>{s.label}</div>
                        {isActive && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current status</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📜 Activity Log</h3></div>
          <div style={{ padding: 20 }}>
            {(!task.activity || task.activity.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}><div style={{ fontSize: 36, opacity: .3, marginBottom: 14 }}>📜</div><h4 style={{ fontWeight: 700, fontSize: 16 }}>No activity yet</h4></div>
            ) : task.activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: i < task.activity.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: ACTIVITY_DOT[a.type] || 'var(--text-muted)', flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: a.text }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMMENTS TAB */}
      {activeTab === 'comments' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>💬 Comments</h3></div>
          <div style={{ padding: 20 }}>
            {(task.comments || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,var(--accent-teal),var(--accent-teal-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {c.author?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{c.author}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.time}</span>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{c.text}</p>
                </div>
              </div>
            ))}
            {(!task.comments || task.comments.length === 0) && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', marginBottom: 16 }}><div style={{ fontSize: 28, opacity: .3 }}>💬</div><p style={{ fontSize: 13 }}>No comments yet. Be first!</p></div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {currentUser?.name?.charAt(0) || 'Y'}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  className="td-ta"
                  value={commentText} onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-medium)', borderRadius: 11, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'var(--text-primary)', background: 'var(--bg-surface)', resize: 'vertical', minHeight: 76 }}
                />
              </div>
              <button
                onClick={handleComment} disabled={!commentText.trim()}
                style={{ background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', border: 'none', color: '#fff', padding: '9px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: commentText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, opacity: commentText.trim() ? 1 : .6 }}>
                <FaComment size={11} /> Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Request Modal */}
      {showCRModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, animation: 'tdFadeUp .15s ease' }}>
          <div style={{ background: 'var(--bg-white)', borderRadius: 22, width: '90%', maxWidth: 500, boxShadow: '0 25px 70px rgba(15,23,42,.25)' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>↩ Request Change</h3>
              <button onClick={() => setShowCRModal(false)} style={{ background: 'var(--bg-surface)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Reason for Change <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  className="td-ta" value={crReason} onChange={e => setCrReason(e.target.value)}
                  placeholder="Describe why you need a change…"
                  style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, background: 'var(--bg-surface)', resize: 'vertical', minHeight: 80, color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Requested New Deadline (optional)</label>
                <input type="date" value={crDeadline} onChange={e => setCrDeadline(e.target.value)} style={{ padding: '10px 13px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-primary)', background: 'var(--bg-surface)', width: '100%', outline: 'none' }} />
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: 10, borderRadius: '0 0 22px 22px' }}>
              <button onClick={() => setShowCRModal(false)} style={{ background: 'var(--bg-white)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '9px 18px', borderRadius: 10, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleSendChange} disabled={!crReason.trim()}
                style={{ background: 'transparent', border: '1.5px solid var(--warning)', color: 'var(--warning)', padding: '9px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: crReason.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, opacity: crReason.trim() ? 1 : .6 }}>
                <FaExchangeAlt size={11} /> Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}