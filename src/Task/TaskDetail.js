import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaCheck, FaTimes, FaComment, FaExchangeAlt,
  FaCheckCircle, FaUndo, FaTasks, FaPlus, FaSave, FaExclamationCircle,
  FaEdit, FaChevronDown, FaClock, FaBan, FaSearch, FaCalendarAlt,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS, getAuthHeaders } from '../config/api.config';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

// Helper to extract array from API response
const extractArray = (data) => {
  if (data?.response && Array.isArray(data.response)) return data.response;
  if (data?.response?.content && Array.isArray(data.response.content)) return data.response.content;
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.data?.content && Array.isArray(data.data.content)) return data.data.content;
  if (data?.content && Array.isArray(data.content)) return data.content;
  console.warn('Unexpected data format:', data);
  return [];
};

const getUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; }
};

const PRIORITY_COLORS = { Critical: '#9d174d', HIGH: '#ef4444', MEDIUM: '#d97706', LOW: '#059669' };
const PRIORITY_BG     = { Critical: '#fdf2f8', HIGH: '#fee2e2', MEDIUM: '#fef3c7', LOW: '#d1fae5' };

const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CHANGE_REQUESTED: 'Change Requested',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now  = new Date(); now.setHours(0, 0, 0, 0);
  const then = new Date(dateStr); then.setHours(0, 0, 0, 0);
  return Math.round((then - now) / 86400000);
};

const normaliseEffort = (effort) => {
  if (!effort) return '—';
  return effort.trim().replace(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/, '$1 $2');
};

const StatusBadge = ({ status, onClick, showDropdown = false, disabled = false }) => {
  const map = {
    PENDING_APPROVAL:  ['#fef3c7', '#92400e'],
    IN_PROGRESS:       ['#dbeafe', '#1e40af'],
    COMPLETED:         ['#dcfce7', '#166534'],
    IN_REVIEW:         ['#f3e8ff', '#5b21b6'],
    REJECTED:          ['#fee2e2', '#991b1b'],
    CHANGE_REQUESTED:  ['#fff7ed', '#c2410c'],
  };
  const [bg, color] = map[status] || ['#f1f5f9', '#475569'];

  if (!showDropdown) {
    return (
      <span style={{ background: bg, color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {STATUS_LABELS[status] || status}
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg, color, padding: '4px 8px 4px 10px', borderRadius: 20,
        fontSize: 11, fontWeight: 600, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        opacity: disabled ? 0.6 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap'
      }}
    >
      {STATUS_LABELS[status] || status}
      <FaChevronDown size={8} />
    </button>
  );
};

const priKey = (p) => {
  if (!p) return 'Medium';
  const u = p.toUpperCase();
  if (u === 'HIGH') return 'High';
  if (u === 'MEDIUM') return 'Medium';
  if (u === 'LOW') return 'Low';
  if (u === 'CRITICAL') return 'Critical';
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
};

const formatAssignee = (assignedTo) => {
  if (!assignedTo) return 'Unassigned';
  return assignedTo.replace(/\s+null\s*/g, '').trim();
};

const cleanEmployeeName = (name) => {
  if (!name) return '';
  return name.replace(/\s+null\s*/gi, '').trim();
};

const MiniAvatar = ({ name, size = 24 }) => {
  const initial = (formatAssignee(name) || '?').charAt(0).toUpperCase();
  const colors  = ['#6366f1', '#0891b2', '#059669', '#d97706', '#9333ea', '#e11d48'];
  const idx     = initial.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors[idx], color: '#fff', fontSize: size * 0.45,
      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Sora', sans-serif",
    }}>{initial}</div>
  );
};

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const FieldError = ({ msg }) =>
  msg ? <span className="field-err"><FaExclamationCircle size={10} /> {msg}</span> : null;

const CharCount = ({ value, max }) => {
  const len = (value || '').length;
  return (
    <span className="char-count" style={{ color: len > max * 0.85 ? '#f97316' : '#8b92b8' }}>
      {len}/{max}
    </span>
  );
};

const SUBTASKS_PER_PAGE = 5;

export default function TaskDetail({ user }) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const currentUser = user || getUser();
  const taskIdFromState = location.state?.taskId;

  const [task,      setTask]      = useState(null);
  const [loading,   setLoading]   = useState(true);

  const [branches,          setBranches]          = useState([]);
  const [departments,       setDepartments]       = useState([]);
  const [filteredDepts,     setFilteredDepts]     = useState([]);
  const [employees,         setEmployees]         = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [dropdownsLoaded,   setDropdownsLoaded]   = useState(false);

  const [activeTab,   setActiveTab]   = useState('overview');
  const [commentText, setCommentText] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [actionBusy,  setActionBusy]  = useState(false);

  // Change Request Modal State
  const [showCRModal, setShowCRModal] = useState(false);
  const [crTaskId,    setCrTaskId]    = useState(null);
  const [crReason,    setCrReason]    = useState('');
  const [crDeadline,  setCrDeadline]  = useState('');

  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingSubtask,  setEditingSubtask]  = useState(null);
  const [subtaskForm,     setSubtaskForm]     = useState({
    title: '', description: '', assignee: '', branch: '', dept: '',
    priority: 'Medium', deadline: '', effort: '', tags: '',
  });
  const [subtaskErrors,  setSubtaskErrors]  = useState({});
  const [subtaskTouched, setSubtaskTouched] = useState({});

  // Dropdown state
  const [dropdownState, setDropdownState] = useState({
    open: false,
    subtaskId: null,
    position: { top: 0, left: 0 }
  });
  
  const [subtaskCurrentPage, setSubtaskCurrentPage] = useState(1);
  const [subtaskSearchTerm, setSubtaskSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownState({ open: false, subtaskId: null, position: { top: 0, left: 0 } });
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Add scroll listener to close dropdown when scrolling
  useEffect(() => {
    if (!dropdownState.open) return;
    
    const handleScroll = () => {
      setDropdownState({ open: false, subtaskId: null, position: { top: 0, left: 0 } });
    };
    
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownState.open]);

  const extractTaskFromResponse = (data) => {
    if (data.response && typeof data.response === 'object') return data.response;
    if (data.data    && typeof data.data    === 'object') return data.data;
    if (typeof data  === 'object' && data.id)             return data;
    console.warn('Unexpected API response structure:', data);
    return null;
  };

  const fetchTask = useCallback(async () => {
    if (!taskIdFromState) { setLoading(false); return; }
    try {
      const res  = await fetch(API_ENDPOINTS.GET_TASK_BY_ID(taskIdFromState), { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Task not found');
      setTask(extractTaskFromResponse(data));
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [taskIdFromState]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [branchRes, empRes, deptRes] = await Promise.all([
          fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }),
          fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=100`, { headers: getAuthHeaders() }),
          fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: getAuthHeaders() }),
        ]);
        setBranches(extractArray(await branchRes.json()));
        setEmployees(extractArray(await empRes.json()));
        setDepartments(extractArray(await deptRes.json()));
        setDropdownsLoaded(true);
      } catch (err) {
        console.error('Dropdown fetch error:', err);
        toast.error('Load Error', 'Could not load form data');
      }
    };
    fetchTask();
    fetchDropdowns();
  }, [fetchTask]);

  const areAllSubtasksCompleted = () => {
    if (!task?.subtasks?.length) return true;
    return task.subtasks.every(s => s.status === 'COMPLETED');
  };

  useEffect(() => {
    if (subtaskForm.branch && departments.length > 0) {
      setFilteredDepts(departments.filter(d => d.branchId === parseInt(subtaskForm.branch)));
    } else {
      setFilteredDepts([]);
    }
  }, [subtaskForm.branch, departments]);

  useEffect(() => {
    if (!employees.length) { setFilteredEmployees([]); return; }
    let filtered = [...employees];
    if (subtaskForm.branch) {
      const sel = branches.find(b => b.id === parseInt(subtaskForm.branch));
      if (sel) filtered = filtered.filter(e => e.branchName === sel.name);
    }
    if (subtaskForm.dept) {
      const sel = departments.find(d => d.id === parseInt(subtaskForm.dept));
      if (sel) filtered = filtered.filter(e => e.departmentName === sel.name);
    }
    setFilteredEmployees(filtered);
  }, [employees, subtaskForm.branch, subtaskForm.dept, branches, departments]);

  const updateTaskStatus = async (taskId, newStatus, extraProgress = null) => {
    const payload = { taskId, status: newStatus };
    if (extraProgress !== null) payload.progress = extraProgress;
    const res  = await fetch(API_ENDPOINTS.UPDATE_TASK_STATUS, {
      method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update status');
    return true;
  };

  const handleStatusChange = async (taskId, newStatus, isSubtask = false) => {
    if (newStatus === 'CHANGE_REQUESTED') {
      setCrTaskId(taskId);
      setCrReason('');
      setCrDeadline('');
      setShowCRModal(true);
      setDropdownState({ open: false, subtaskId: null, position: { top: 0, left: 0 } });
      return;
    }

    setActionBusy(true);
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success('Updated', `${isSubtask ? 'Subtask' : 'Task'} moved to ${STATUS_LABELS[newStatus]}`);
      setDropdownState({ open: false, subtaskId: null, position: { top: 0, left: 0 } });
      await fetchTask();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const updateSubtaskStatus = async (subtaskId, newStatus) => {
    await handleStatusChange(subtaskId, newStatus, true);
  };

  const updateStatus = async (newStatus, extraProgress = null) => {
    if (newStatus === 'COMPLETED' && !areAllSubtasksCompleted()) {
      toast.warning('Cannot Complete', 'All subtasks must be completed before marking the main task as complete.');
      return;
    }
    
    if (newStatus === 'CHANGE_REQUESTED') {
      setCrTaskId(task.id);
      setCrReason('');
      setCrDeadline('');
      setShowCRModal(true);
      return;
    }

    setActionBusy(true);
    try {
      await updateTaskStatus(task.id, newStatus, extraProgress);
      toast.success('Updated', `Task moved to ${STATUS_LABELS[newStatus] || newStatus}`);
      await fetchTask();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleApprove      = () => updateStatus('IN_PROGRESS');
  const handleReject       = () => updateStatus('REJECTED');
  const handleSubmitReview = () => updateStatus('IN_REVIEW', Math.max((task?.progress || 0), 80));
  const handleComplete     = () => updateStatus('COMPLETED', 100);
  const handleSendBack     = () => updateStatus('IN_PROGRESS');
  const handleRequestChange = () => updateStatus('CHANGE_REQUESTED');

  const handleApproveChange = async () => {
    setActionBusy(true);
    try {
      const res  = await fetch(API_ENDPOINTS.APPROVE_CHANGE(crTaskId || task.id), { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success('Approved', 'Change request approved, deadline updated');
      setShowCRModal(false); setCrTaskId(null); setCrReason(''); setCrDeadline('');
      await fetchTask();
    } catch (err) { toast.error('Error', err.message); }
    finally { setActionBusy(false); }
  };

  const handleRejectChange = async () => {
    setActionBusy(true);
    try {
      const res  = await fetch(API_ENDPOINTS.REJECT_CHANGE(crTaskId || task.id), { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success('Rejected', 'Change request rejected');
      setShowCRModal(false); setCrTaskId(null); setCrReason(''); setCrDeadline('');
      await fetchTask();
    } catch (err) { toast.error('Error', err.message); }
    finally { setActionBusy(false); }
  };

  const handleSendChange = async () => {
    if (!crReason.trim()) return;
    setActionBusy(true);
    try {
      const targetId = crTaskId || task.id;
      const payload = { reason: crReason, requestedDeadline: crDeadline ? `${crDeadline}T00:00:00` : null };
      const res  = await fetch(API_ENDPOINTS.SEND_CHANGE_REQ(targetId), {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.warning('Sent', 'Change request submitted to manager');
      setShowCRModal(false); setCrTaskId(null); setCrReason(''); setCrDeadline('');
      await fetchTask();
    } catch (err) { toast.error('Error', err.message); }
    finally { setActionBusy(false); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res  = await fetch(API_ENDPOINTS.ADD_COMMENT(task.id), {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ comment: commentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success('Added', 'Comment posted');
      setCommentText('');
      await fetchTask();
    } catch (err) { toast.error('Error', err.message); }
    finally { setSubmitting(false); }
  };

  const validateSubtaskField = (field, value) => {
    if (!value && ['title', 'assignee', 'branch', 'dept', 'deadline'].includes(field))
      return 'This field is required';
    if (field === 'title' && value && value.trim().length < 3)
      return 'Minimum 3 characters required';
    return '';
  };

  const handleSubtaskChange = (field, value) => {
    setSubtaskForm(prev => {
      const nf = { ...prev, [field]: value };
      if (field === 'branch') { nf.dept = ''; nf.assignee = ''; }
      if (field === 'dept')   { nf.assignee = ''; }
      return nf;
    });
    if (subtaskTouched[field])
      setSubtaskErrors(prev => ({ ...prev, [field]: validateSubtaskField(field, value) }));
  };

  const handleSubtaskBlur = (field) => {
    setSubtaskTouched(prev => ({ ...prev, [field]: true }));
    setSubtaskErrors(prev => ({ ...prev, [field]: validateSubtaskField(field, subtaskForm[field]) }));
  };

  const handleEditSubtask = (subtask) => {
    if (!dropdownsLoaded) { toast.warning('Please wait', 'Loading form data...'); return; }
    let formattedDeadline = '';
    if (subtask.dueDate) {
      formattedDeadline = new Date(subtask.dueDate).toISOString().split('T')[0];
    }
    let branchId = '';
    if (subtask.branchId) {
      branchId = String(subtask.branchId);
    } else if (subtask.branch && branches.length > 0) {
      const name = typeof subtask.branch === 'object' ? subtask.branch.name : subtask.branch;
      const found = branches.find(b => b.name === name || b.id === subtask.branch);
      if (found) branchId = String(found.id);
    }
    let deptId = '';
    if (subtask.departmentId) {
      deptId = String(subtask.departmentId);
    } else if (subtask.department && departments.length > 0) {
      const name = typeof subtask.department === 'object' ? subtask.department.name : subtask.department;
      const found = departments.find(d => d.name === name || d.id === subtask.department);
      if (found) deptId = String(found.id);
    }
    let assigneeId = '';
    if (subtask.assignedToId) {
      assigneeId = String(subtask.assignedToId);
    } else if (subtask.assignedTo && employees.length > 0) {
      const aName = typeof subtask.assignedTo === 'object'
        ? (subtask.assignedTo.name || `${subtask.assignedTo.firstName} ${subtask.assignedTo.lastName}`)
        : subtask.assignedTo;
      const found = employees.find(e =>
        cleanEmployeeName(e.name) === cleanEmployeeName(aName) || e.id === subtask.assignedTo
      );
      if (found) assigneeId = String(found.id);
    }
    let priority = 'Medium';
    if (subtask.priority) {
      const u = subtask.priority.toUpperCase();
      if (u === 'HIGH') priority = 'High';
      else if (u === 'MEDIUM') priority = 'Medium';
      else if (u === 'LOW') priority = 'Low';
      else if (u === 'CRITICAL') priority = 'Critical';
    }
    setEditingSubtask(subtask);
    setSubtaskForm({
      title: subtask.title || '', description: subtask.description || '',
      assignee: assigneeId, branch: branchId, dept: deptId,
      priority, deadline: formattedDeadline,
      effort: subtask.effort || subtask.effortEstimate || '',
      tags: subtask.tags || '',
    });
    setShowSubtaskForm(true);
    setSubtaskErrors({});
    setSubtaskTouched({});
  };

  const handleCreateOrUpdateSubtask = async (e) => {
    e.preventDefault();
    const allFields = ['title', 'assignee', 'branch', 'dept', 'deadline'];
    setSubtaskTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    const errs = {};
    allFields.forEach(f => { const err = validateSubtaskField(f, subtaskForm[f]); if (err) errs[f] = err; });
    setSubtaskErrors(errs);
    if (Object.keys(errs).length > 0) { toast.warning('Validation', 'Fix highlighted fields'); return; }

    const payload = {
      title:        subtaskForm.title.trim(),
      description:  subtaskForm.description || null,
      priority:     subtaskForm.priority.toUpperCase(),
      assignedToId: Number(subtaskForm.assignee),
      departmentId: Number(subtaskForm.dept),
      branchId:     Number(subtaskForm.branch),
      dueDate:      subtaskForm.deadline ? `${subtaskForm.deadline}T00:00:00` : null,
      effort:       subtaskForm.effort || null,
      tags:         subtaskForm.tags   || null,
    };

    setSubmitting(true);
    try {
      const url    = editingSubtask
        ? API_ENDPOINTS.UPDATE_SUBTASK(task.id, editingSubtask.id)
        : API_ENDPOINTS.CREATE_SUBTASK(task.id);
      const method = editingSubtask ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${editingSubtask ? 'update' : 'create'} subtask`);
      toast.success(editingSubtask ? 'Updated' : 'Created', `Subtask ${editingSubtask ? 'updated' : 'added'} successfully`);
      setShowSubtaskForm(false); setEditingSubtask(null);
      setSubtaskForm({ title: '', description: '', assignee: '', branch: '', dept: '', priority: 'Medium', deadline: '', effort: '', tags: '' });
      setSubtaskErrors({}); setSubtaskTouched({});
      setSubtaskCurrentPage(1);
      await fetchTask();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubtaskForm = () => {
    setShowSubtaskForm(false); setEditingSubtask(null);
    setSubtaskForm({ title: '', description: '', assignee: '', branch: '', dept: '', priority: 'Medium', deadline: '', effort: '', tags: '' });
    setSubtaskErrors({}); setSubtaskTouched({});
  };

  const getAvailableStatuses = (currentStatus) => {
    const flow = {
      PENDING_APPROVAL: ['IN_PROGRESS', 'REJECTED'],
      IN_PROGRESS:      ['IN_REVIEW', 'CHANGE_REQUESTED', 'COMPLETED'],
      IN_REVIEW:        ['COMPLETED', 'IN_PROGRESS'],
      COMPLETED:        [],
      REJECTED:         [],
      CHANGE_REQUESTED: ['IN_PROGRESS'],
    };
    return flow[currentStatus] || [];
  };

  const handleStatusClick = (subtaskId, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Approximate height of dropdown
    
    let top = rect.bottom + 4;
    
    // If dropdown would go off screen, position it above the button
    if (top + dropdownHeight > viewportHeight) {
      top = rect.top - dropdownHeight - 4;
    }
    
    setDropdownState({
      open: true,
      subtaskId: subtaskId,
      position: {
        top: top,
        left: rect.left
      }
    });
  };

  const isSubtaskFieldErr = (f) => subtaskTouched[f] && !!subtaskErrors[f];
  const isSubtaskFieldOk  = (f) => subtaskTouched[f] && !subtaskErrors[f] && subtaskForm[f];

  const STATUS_FLOW = ['PENDING_APPROVAL', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
  const statusIdx   = task ? STATUS_FLOW.indexOf(task.status) : -1;

  const filteredSubtasks = useMemo(() => {
    if (!task?.subtasks) return [];
    if (!subtaskSearchTerm) return task.subtasks;
    return task.subtasks.filter(s => 
      s.title.toLowerCase().includes(subtaskSearchTerm.toLowerCase()) ||
      String(s.id).includes(subtaskSearchTerm) ||
      formatAssignee(s.assignedTo).toLowerCase().includes(subtaskSearchTerm.toLowerCase())
    );
  }, [task?.subtasks, subtaskSearchTerm]);

  const totalSubtaskPages = Math.ceil(filteredSubtasks.length / SUBTASKS_PER_PAGE);
  const paginatedSubtasks = filteredSubtasks.slice(
    (subtaskCurrentPage - 1) * SUBTASKS_PER_PAGE,
    subtaskCurrentPage * SUBTASKS_PER_PAGE
  );

  useEffect(() => {
    if (subtaskCurrentPage > totalSubtaskPages && totalSubtaskPages > 0) {
      setSubtaskCurrentPage(totalSubtaskPages);
    }
  }, [totalSubtaskPages, subtaskCurrentPage]);

  if (loading) return <LoadingSpinner message="Loading task…" />;
  if (!task)   return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Task not found.</div>;

  const tags = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const allSubtasksCompleted     = areAllSubtasksCompleted();
  const incompleteSubtasksCount  = task.subtasks ? task.subtasks.filter(s => s.status !== 'COMPLETED').length : 0;

  // Find the currently open subtask for dropdown
  const openSubtask = dropdownState.open && dropdownState.subtaskId 
    ? paginatedSubtasks.find(s => s.id === dropdownState.subtaskId) 
    : null;
  const availableStatuses = openSubtask ? getAvailableStatuses(openSubtask.status) : [];

  return (
    <div style={{ padding: '22px 24px', background: 'var(--bg-page)', minHeight: '100vh', animation: 'tdFadeUp .35s ease' }}>
      <style>{`
        @keyframes tdFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        textarea.td-ta:focus { border-color:var(--accent-indigo)!important; box-shadow:0 0 0 3px rgba(99,102,241,.10); background:var(--bg-white)!important; outline:none; }
        .subtask-field { display:flex; flex-direction:column; gap:4px; }
        .subtask-field label { font-size:13px; font-weight:600; color:var(--text-secondary); }
        .subtask-label-row { display:flex; justify-content:space-between; align-items:center; }
        .subtask-field input,.subtask-field select,.subtask-field textarea { padding:10px 12px; border:1.5px solid var(--border-medium); border-radius:10px; font-size:14px; font-family:'DM Sans',sans-serif; color:var(--text-primary); background:var(--bg-surface); transition:all 0.2s; width:100%; }
        .subtask-field input:focus,.subtask-field select:focus,.subtask-field textarea:focus { outline:none; border-color:var(--accent-indigo); background:var(--bg-white); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .subtask-field.has-error input,.subtask-field.has-error select { border-color:var(--danger); }
        .subtask-field.has-ok input,.subtask-field.has-ok select { border-color:var(--success); }
        .field-err { font-size:11px; color:var(--danger); font-weight:500; display:flex; align-items:center; gap:4px; }
        .char-count { font-size:11px; }
        .req { color:var(--accent-coral); }
        .subtask-spinner { width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin .6s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        
        .status-dropdown { 
          position: fixed; 
          background: var(--bg-white); 
          border: 1px solid var(--border-light); 
          border-radius: 10px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
          z-index: 99999; 
          min-width: 170px; 
          overflow: hidden;
          animation: fadeIn 0.15s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .status-dropdown-item { padding:10px 14px; font-size:12px; cursor:pointer; transition:background 0.2s; border:none; background:none; width:100%; text-align:left; display:flex; align-items:center; gap:8px; color:var(--text-primary); }
        .status-dropdown-item:hover { background:var(--bg-surface); }
        .status-dropdown-item:not(:last-child) { border-bottom:1px solid var(--border-light); }

        .subtask-table { width:100%; border-collapse:collapse; }
        .subtask-table th { text-align:left; padding:12px 16px; font-size:11px; font-weight:700; color:var(--accent-indigo); text-transform:uppercase; letter-spacing:0.05em; background:var(--bg-surface); border-bottom:1.5px solid var(--accent-indigo-pale); }
        .subtask-table td { padding:14px 16px; border-bottom:1px solid #f0f2f9; vertical-align:middle; }
        .subtask-table tbody tr:hover td { background:#fafbff; }
        
        .pagination-btn { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-medium); border-radius:8px; background:var(--bg-white); color:var(--text-secondary); cursor:pointer; transition:all 0.2s; }
        .pagination-btn:hover:not(:disabled) { border-color:var(--accent-indigo); color:var(--accent-indigo); background:var(--bg-surface); }
        .pagination-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .pagination-btn.active { background:var(--accent-indigo); border-color:var(--accent-indigo); color:#fff; }

        .tab-btn { flex: 1; padding: 10px 14px; border: none; border-radius: 9px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: var(--accent-indigo) !important; color: #fff !important; font-weight: 700; box-shadow: 0 2px 8px rgba(99,102,241,.25); }
        .tab-btn:not(.active) { background: transparent; color: var(--text-muted); }
        .tab-btn:not(.active):hover { background: var(--bg-white); color: var(--text-primary); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 10000; }
        .modal-content { background: var(--bg-white); border-radius: 22px; width: 90%; max-width: 500px; box-shadow: 0 25px 70px rgba(15,23,42,.25); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={() => navigate('/TaskList')} style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaArrowLeft size={11} /> Back to Tasks
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: 13, background: '#ede9fe', padding: '4px 11px', borderRadius: 7, fontWeight: 700, color: 'var(--accent-indigo)' }}>T-{String(task.id).padStart(3, '0')}</span>
          <StatusBadge status={task.status} />
          <span style={{ background: PRIORITY_BG[priKey(task.priority)] || '#f1f5f9', color: PRIORITY_COLORS[priKey(task.priority)] || '#475569', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{priKey(task.priority)}</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'Sora',sans-serif", letterSpacing: '-0.02em' }}>{task.title}</h1>
      </div>

      {/* Action banners */}
      {task.status === 'PENDING_APPROVAL' && (
        <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fcd34d', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>🔔 Action Required — Manager Review</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button disabled={actionBusy} onClick={handleApprove} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaCheck size={11} /> Approve Task</button>
            <button disabled={actionBusy} onClick={handleReject}  style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaTimes size={11} /> Reject Task</button>
          </div>
        </div>
      )}

      {task.status === 'IN_PROGRESS' && (
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border: '1.5px solid #6ee7b7', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46', marginBottom: 12 }}>🚀 Task In Progress</div>
          {!allSubtasksCompleted && task.subtasks?.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#92400e' }}>
              ⚠️ {incompleteSubtasksCount} subtask{incompleteSubtasksCount !== 1 ? 's' : ''} still pending. All subtasks must be completed before marking this task as complete.
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button disabled={actionBusy} onClick={handleSubmitReview} style={{ background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>🔍 Submit for Review</button>
            <button disabled={actionBusy} onClick={handleRequestChange} style={{ background: 'transparent', border: '1.5px solid var(--warning)', color: 'var(--warning)', padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FaExchangeAlt size={11} /> Request Change</button>
            <button disabled={actionBusy || !allSubtasksCompleted} onClick={handleComplete} style={{ background: !allSubtasksCompleted ? 'var(--bg-surface)' : 'linear-gradient(135deg,#059669,#10b981)', border: !allSubtasksCompleted ? '1.5px solid var(--border-medium)' : 'none', color: !allSubtasksCompleted ? 'var(--text-muted)' : '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: !allSubtasksCompleted ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, opacity: !allSubtasksCompleted ? 0.6 : 1 }}>
              <FaCheckCircle size={11} /> Mark Complete
            </button>
          </div>
        </div>
      )}

      {task.status === 'IN_REVIEW' && (
        <div style={{ background: 'linear-gradient(135deg,#faf5ff,#f3e8ff)', border: '1.5px solid #a78bfa', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#5b21b6', marginBottom: 12 }}>🔍 Under Review — Manager Action</div>
          {!allSubtasksCompleted && task.subtasks?.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#92400e' }}>
              ⚠️ {incompleteSubtasksCount} subtask{incompleteSubtasksCount !== 1 ? 's' : ''} still pending. All subtasks must be completed before approving.
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button disabled={actionBusy || !allSubtasksCompleted} onClick={handleComplete} style={{ background: !allSubtasksCompleted ? 'var(--bg-surface)' : 'linear-gradient(135deg,#059669,#10b981)', border: !allSubtasksCompleted ? '1.5px solid var(--border-medium)' : 'none', color: !allSubtasksCompleted ? 'var(--text-muted)' : '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: !allSubtasksCompleted ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, opacity: !allSubtasksCompleted ? 0.6 : 1 }}>
              <FaCheck size={11} /> Approve & Complete
            </button>
            <button disabled={actionBusy} onClick={handleSendBack} style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '9px 18px', borderRadius: 11, fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaUndo size={11} /> Send Back</button>
          </div>
        </div>
      )}

      {task.status === 'CHANGE_REQUESTED' && (
        <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fcd34d', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 10 }}>↩ Change Request Pending</div>
          {task.changeRequest && (
            <div style={{ background: 'var(--bg-white)', borderRadius: 10, padding: '11px 14px', marginBottom: 12, border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}><strong>Reason:</strong> {task.changeRequest.reason}</div>
              {task.changeRequest.requestedDeadline && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 Requested: <strong>{formatDate(task.changeRequest.requestedDeadline)}</strong></div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button disabled={actionBusy} onClick={handleApproveChange} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaCheck size={11} /> Approve Change</button>
            <button disabled={actionBusy} onClick={handleRejectChange}  style={{ background: 'linear-gradient(135deg,#ef4444,#f87171)', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><FaTimes size={11} /> Reject Change</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface)', padding: 5, borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: 20 }}>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          📋 Overview
        </button>
        <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
          📜 Activity
        </button>
        <button className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
          💬 Comments ({(task.comments || []).length})
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Description */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📄 Description</h3>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{task.description || 'No description provided.'}</p>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                  {tags.map(tag => (
                    <span key={tag} style={{ background: '#ede9fe', color: 'var(--accent-indigo)', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress + Status Flow Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📊 Progress</h3>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--accent-indigo)' }}>{task.progress || 0}%</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ background: '#e8eaf6', borderRadius: 10, height: 12, overflow: 'hidden', marginBottom: 15 }}>
                  <div style={{ height: '100%', width: `${task.progress || 0}%`, background: (task.progress || 0) >= 100 ? 'var(--success)' : 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 10, transition: 'width .6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {STATUS_FLOW.map(s => (
                    <span key={s} style={{ fontSize: 11, color: task.status === s ? 'var(--accent-indigo)' : 'var(--text-muted)', fontWeight: task.status === s ? 700 : 400 }}>{STATUS_LABELS[s]}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>🗺 Status Tracker</h3>
              </div>
              <div style={{ padding: 16 }}>
                {[
                  { status: 'PENDING_APPROVAL', icon: '⏳', color: '#fbbf24' },
                  { status: 'IN_PROGRESS',      icon: '🚀', color: 'var(--accent-indigo)' },
                  { status: 'IN_REVIEW',         icon: '🔍', color: '#8b5cf6' },
                  { status: 'COMPLETED',         icon: '✅', color: 'var(--success)' },
                ].map((s, i) => {
                  const isDone   = statusIdx > i;
                  const isActive = task.status === s.status;
                  return (
                    <div key={s.status} style={{ display: 'flex', gap: 10, paddingBottom: 12, position: 'relative' }}>
                      {i < 3 && <div style={{ position: 'absolute', left: 14, top: 28, bottom: 0, width: 2, background: 'var(--border-light)' }} />}
                      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, zIndex: 1, background: isDone ? 'var(--success)' : isActive ? s.color : 'var(--bg-surface)', border: `2px solid ${isDone ? 'var(--success)' : isActive ? s.color : 'var(--border-medium)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, boxShadow: isActive ? `0 0 0 3px ${s.color}33` : undefined, color: isDone || isActive ? '#fff' : 'var(--text-muted)' }}>
                        {isDone ? '✓' : s.icon}
                      </div>
                      <div style={{ paddingTop: 3 }}>
                        <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isDone ? 'var(--success)' : isActive ? s.color : 'var(--text-muted)' }}>{STATUS_LABELS[s.status]}</div>
                        {isActive && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Current status</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sub-tasks Table */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaTasks size={13} color="var(--accent-indigo)" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Sub-tasks</h3>
                <span style={{ background: '#ede9fe', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, color: 'var(--accent-indigo)' }}>{(task.subtasks || []).length}</span>
                {incompleteSubtasksCount > 0 && (
                  <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                    {incompleteSubtasksCount} pending
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 11 }} />
                  <input
                    type="text"
                    placeholder="Search subtasks..."
                    value={subtaskSearchTerm}
                    onChange={(e) => { setSubtaskSearchTerm(e.target.value); setSubtaskCurrentPage(1); }}
                    style={{ padding: '6px 10px 6px 30px', border: '1.5px solid var(--border-medium)', borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-primary)', background: 'var(--bg-white)', width: 180, outline: 'none' }}
                  />
                </div>
                {!showSubtaskForm && (
                  <button onClick={() => setShowSubtaskForm(true)} style={{ background: 'transparent', border: '1px solid var(--accent-indigo)', color: 'var(--accent-indigo)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaPlus size={10} /> Add Subtask
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Subtask form */}
              {showSubtaskForm && (
                <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--accent-indigo)' }}>
                      {editingSubtask ? 'Edit Subtask' : 'Create New Subtask'}
                    </h4>
                    <button onClick={handleCancelSubtaskForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                  </div>
                  <form onSubmit={handleCreateOrUpdateSubtask}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className={`subtask-field ${isSubtaskFieldErr('title') ? 'has-error' : ''} ${isSubtaskFieldOk('title') ? 'has-ok' : ''}`}>
                        <div className="subtask-label-row">
                          <label>Title <span className="req">*</span></label>
                          <CharCount value={subtaskForm.title} max={100} />
                        </div>
                        <input type="text" placeholder="Subtask title" value={subtaskForm.title} onChange={e => handleSubtaskChange('title', e.target.value)} onBlur={() => handleSubtaskBlur('title')} />
                        <FieldError msg={subtaskErrors.title} />
                      </div>
                      <div className={`subtask-field ${isSubtaskFieldErr('branch') ? 'has-error' : ''}`}>
                        <label>Branch <span className="req">*</span></label>
                        <select value={subtaskForm.branch} onChange={e => handleSubtaskChange('branch', e.target.value)} onBlur={() => handleSubtaskBlur('branch')}>
                          <option value="">Select branch</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <FieldError msg={subtaskErrors.branch} />
                      </div>
                      <div className={`subtask-field ${isSubtaskFieldErr('dept') ? 'has-error' : ''}`}>
                        <label>Department <span className="req">*</span></label>
                        <select value={subtaskForm.dept} onChange={e => handleSubtaskChange('dept', e.target.value)} onBlur={() => handleSubtaskBlur('dept')} disabled={!subtaskForm.branch}>
                          <option value="">{!subtaskForm.branch ? 'Select branch first' : filteredDepts.length === 0 ? 'No departments' : 'Select department'}</option>
                          {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <FieldError msg={subtaskErrors.dept} />
                      </div>
                      <div className={`subtask-field ${isSubtaskFieldErr('assignee') ? 'has-error' : ''}`}>
                        <label>Assign To <span className="req">*</span></label>
                        <select value={subtaskForm.assignee} onChange={e => handleSubtaskChange('assignee', e.target.value)} onBlur={() => handleSubtaskBlur('assignee')} disabled={!subtaskForm.branch || !subtaskForm.dept}>
                          <option value="">{!subtaskForm.branch || !subtaskForm.dept ? 'Select branch & dept first' : filteredEmployees.length === 0 ? 'No employees' : 'Select assignee'}</option>
                          {filteredEmployees.map(m => <option key={m.id} value={m.id}>{cleanEmployeeName(m.name)}{m.roleName ? ` · ${m.roleName}` : ''}</option>)}
                        </select>
                        <FieldError msg={subtaskErrors.assignee} />
                      </div>
                      <div className="subtask-field">
                        <label>Priority</label>
                        <select value={subtaskForm.priority} onChange={e => handleSubtaskChange('priority', e.target.value)}>
                          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className={`subtask-field ${isSubtaskFieldErr('deadline') ? 'has-error' : ''}`}>
                        <label>Deadline <span className="req">*</span></label>
                        <input type="date" value={subtaskForm.deadline} onChange={e => handleSubtaskChange('deadline', e.target.value)} onBlur={() => handleSubtaskBlur('deadline')} min={new Date().toISOString().split('T')[0]} />
                        <FieldError msg={subtaskErrors.deadline} />
                      </div>
                      <div className="subtask-field">
                        <label>Estimated Effort</label>
                        <input type="text" placeholder="e.g., 2 days" value={subtaskForm.effort} onChange={e => handleSubtaskChange('effort', e.target.value)} />
                      </div>
                      <div className="subtask-field" style={{ gridColumn: 'span 3' }}>
                        <label>Description</label>
                        <textarea rows={2} placeholder="Subtask description (optional)" value={subtaskForm.description} onChange={e => handleSubtaskChange('description', e.target.value)} />
                      </div>
                      <div className="subtask-field" style={{ gridColumn: 'span 3' }}>
                        <label>Tags (comma-separated)</label>
                        <input type="text" placeholder="e.g., Frontend, API, Testing" value={subtaskForm.tags} onChange={e => handleSubtaskChange('tags', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                      <button type="button" onClick={handleCancelSubtaskForm} style={{ padding: '8px 16px', border: '1px solid var(--border-medium)', borderRadius: 8, background: 'var(--bg-white)', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" disabled={submitting} style={{ padding: '8px 20px', background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {submitting
                          ? <><span className="subtask-spinner" /> {editingSubtask ? 'Updating...' : 'Creating...'}</>
                          : <><FaSave size={10} /> {editingSubtask ? 'Update Subtask' : 'Create Subtask'}</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Subtask Table */}
              {filteredSubtasks.length > 0 ? (
                <>
                  <div ref={tableContainerRef} style={{ overflowX: 'auto', overflowY: 'visible' }}>
                    <table className="subtask-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Assignee</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Deadline</th>
                          <th>Effort</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSubtasks.map(sub => {
                          const availableStatuses = getAvailableStatuses(sub.status);
                          const dueFmt = formatDate(sub.dueDate);
                          const daysLeft = daysUntil(sub.dueDate);
                          const isCompleted = sub.status === 'COMPLETED';
                          
                          let deadlineColor = 'var(--text-secondary)';
                          if (!isCompleted && daysLeft !== null) {
                            if (daysLeft < 0) deadlineColor = '#ef4444';
                            else if (daysLeft <= 3) deadlineColor = '#f59e0b';
                          }

                          return (
                            <tr key={sub.id} style={{ opacity: isCompleted ? 0.7 : 1 }}>
                              <td>
                                <span style={{ fontFamily: 'monospace', fontSize: 11, background: isCompleted ? '#dcfce7' : '#ede9fe', color: isCompleted ? '#166534' : 'var(--accent-indigo)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                                  T-{String(sub.id).padStart(3, '0')}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 500, color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                                  {sub.title}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <MiniAvatar name={sub.assignedTo} size={22} />
                                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatAssignee(sub.assignedTo)}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{ background: PRIORITY_BG[priKey(sub.priority)] || '#f1f5f9', color: PRIORITY_COLORS[priKey(sub.priority)] || '#475569', padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                                  {priKey(sub.priority)}
                                </span>
                              </td>
                              <td>
                                <StatusBadge
                                  status={sub.status}
                                  showDropdown={availableStatuses.length > 0}
                                  onClick={(e) => handleStatusClick(sub.id, e)}
                                  disabled={actionBusy}
                                />
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <FaCalendarAlt size={10} color={deadlineColor} />
                                  <span style={{ fontSize: 12, color: deadlineColor, fontWeight: 500 }}>{dueFmt}</span>
                                  {!isCompleted && daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && (
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>({daysLeft}d)</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{normaliseEffort(sub.effort || sub.effortEstimate)}</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => handleEditSubtask(sub)}
                                  style={{ width: 28, height: 28, background: '#fef3c7', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}
                                  title="Edit subtask"
                                >
                                  <FaEdit size={11} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalSubtaskPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>
                        Page {subtaskCurrentPage} of {totalSubtaskPages}
                      </span>
                      <button className="pagination-btn" onClick={() => setSubtaskCurrentPage(1)} disabled={subtaskCurrentPage === 1}>
                        <FaChevronLeft size={10} /><FaChevronLeft size={10} style={{ marginLeft: -4 }} />
                      </button>
                      <button className="pagination-btn" onClick={() => setSubtaskCurrentPage(p => Math.max(1, p - 1))} disabled={subtaskCurrentPage === 1}>
                        <FaChevronLeft size={12} />
                      </button>
                      {[...Array(Math.min(5, totalSubtaskPages))].map((_, i) => {
                        let pageNum;
                        if (totalSubtaskPages <= 5) pageNum = i + 1;
                        else if (subtaskCurrentPage <= 3) pageNum = i + 1;
                        else if (subtaskCurrentPage >= totalSubtaskPages - 2) pageNum = totalSubtaskPages - 4 + i;
                        else pageNum = subtaskCurrentPage - 2 + i;
                        return (
                          <button key={pageNum} className={`pagination-btn ${pageNum === subtaskCurrentPage ? 'active' : ''}`} onClick={() => setSubtaskCurrentPage(pageNum)} style={{ fontSize: 12 }}>
                            {pageNum}
                          </button>
                        );
                      })}
                      <button className="pagination-btn" onClick={() => setSubtaskCurrentPage(p => Math.min(totalSubtaskPages, p + 1))} disabled={subtaskCurrentPage === totalSubtaskPages}>
                        <FaChevronRight size={12} />
                      </button>
                      <button className="pagination-btn" onClick={() => setSubtaskCurrentPage(totalSubtaskPages)} disabled={subtaskCurrentPage === totalSubtaskPages}>
                        <FaChevronRight size={10} /><FaChevronRight size={10} style={{ marginLeft: -4 }} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                !showSubtaskForm && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <FaTasks style={{ fontSize: 36, opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontSize: 13, margin: 0 }}>
                      {subtaskSearchTerm ? 'No subtasks match your search.' : 'No sub-tasks yet. Click "Add Subtask" to create one.'}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Position Status Dropdown - Rendered at root level using Portal */}
      {dropdownState.open && openSubtask && availableStatuses.length > 0 && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="status-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownState.position.top}px`,
            left: `${dropdownState.position.left}px`,
            zIndex: 99999,
          }}
        >
          {availableStatuses.map(status => {
            const icons = {
              IN_PROGRESS:      <FaCheckCircle size={11} color="#1e40af" />,
              IN_REVIEW:        <FaSearch size={11} color="#5b21b6" />,
              COMPLETED:        <FaCheck size={11} color="#166534" />,
              CHANGE_REQUESTED: <FaExchangeAlt size={11} color="#c2410c" />,
              REJECTED:         <FaBan size={11} color="#991b1b" />,
            };
            return (
              <button
                key={status}
                className="status-dropdown-item"
                onClick={() => updateSubtaskStatus(openSubtask.id, status)}
              >
                {icons[status] || <FaClock size={11} color="#92400e" />}
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>,
        document.body
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📜 Activity Log</h3>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, opacity: .3, marginBottom: 14 }}>📜</div>
              <p style={{ fontSize: 13 }}>Activity log coming soon...</p>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS TAB */}
      {activeTab === 'comments' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>💬 Comments</h3>
          </div>
          <div style={{ padding: 20 }}>
            {(task.comments || []).map((c, i) => (
              <div key={c.id || i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,var(--accent-teal),var(--accent-teal-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {(c.author || '?').charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{formatAssignee(c.author)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{c.comment}</p>
                </div>
              </div>
            ))}
            {!(task.comments || []).length && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', marginBottom: 16 }}>
                <div style={{ fontSize: 28, opacity: .3 }}>💬</div>
                <p style={{ fontSize: 13 }}>No comments yet. Be first!</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {(currentUser?.name || currentUser?.firstName || 'Y').charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <textarea className="td-ta" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment…" style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-medium)', borderRadius: 11, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, color: 'var(--text-primary)', background: 'var(--bg-surface)', resize: 'vertical', minHeight: 76 }} />
              </div>
              <button onClick={handleComment} disabled={!commentText.trim() || submitting} style={{ background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', border: 'none', color: '#fff', padding: '9px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: commentText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, opacity: commentText.trim() ? 1 : .6 }}>
                <FaComment size={11} /> {submitting ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Request Modal */}
      {showCRModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>↩ Request Change</h3>
              <button onClick={() => { setShowCRModal(false); setCrTaskId(null); }} style={{ background: 'var(--bg-surface)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Reason for Change <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea className="td-ta" value={crReason} onChange={e => setCrReason(e.target.value)} placeholder="Describe why you need a change…" style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, background: 'var(--bg-surface)', resize: 'vertical', minHeight: 80, color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Requested New Deadline (optional)</label>
                <input type="date" value={crDeadline} onChange={e => setCrDeadline(e.target.value)} style={{ padding: '10px 13px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-primary)', background: 'var(--bg-surface)', width: '100%', outline: 'none' }} />
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end', gap: 10, borderRadius: '0 0 22px 22px' }}>
              <button onClick={() => { setShowCRModal(false); setCrTaskId(null); }} style={{ background: 'var(--bg-white)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '9px 18px', borderRadius: 10, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSendChange} disabled={!crReason.trim() || actionBusy} style={{ background: 'transparent', border: '1.5px solid var(--warning)', color: 'var(--warning)', padding: '9px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: crReason.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, opacity: crReason.trim() ? 1 : .6 }}>
                <FaExchangeAlt size={11} /> Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}