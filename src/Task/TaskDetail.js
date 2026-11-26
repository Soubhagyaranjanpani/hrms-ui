import SubmissionsPanel, { SubmitWorkModal } from './TaskSubmissions';
import DailyWorkReport from './DailyWorkReport';
import { formatDate as formatIsoDate } from './DailyWorkCalendar';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaCheck, FaTimes, FaComment, FaExchangeAlt,
  FaCheckCircle, FaUndo, FaTasks, FaPlus, FaSave, FaExclamationCircle,
  FaEdit, FaChevronDown, FaClock, FaBan, FaSearch, FaCalendarAlt,
  FaChevronLeft, FaChevronRight, FaPaperPlane, FaEye, FaUserTie,
  FaBuilding, FaSitemap, FaStar
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  extractArray
} from '../config/api.config';
import {
  getNormalizedRole,
  getMyId,
  cleanPersonName,
  unwrapResponse,
  calculateEffortFromDates
} from './taskAccess';
import { getStoredUser, scopeEmployeesForRole } from './taskScope';
import { parseReview } from './taskRating';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './TaskModule.css';

const PRIORITY_COLORS = { Critical: '#991b1b', High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };
const PRIORITY_BG     = { Critical: '#fee2e2', High: '#fef2f2', Medium: '#fef3c7', Low: '#dcfce7' };

const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  IN_PROGRESS:      'In Progress',
  IN_REVIEW:        'In Review',
  COMPLETED:        'Completed',
  REJECTED:         'Rejected',
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
  return String(effort).trim().replace(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/, '$1 $2');
};

const priKey = (p) => {
  if (!p) return 'Medium';
  const u = String(p).toUpperCase();
  if (u === 'HIGH') return 'High';
  if (u === 'MEDIUM') return 'Medium';
  if (u === 'LOW') return 'Low';
  if (u === 'CRITICAL') return 'Critical';
  return u.charAt(0) + u.slice(1).toLowerCase();
};

const StatusBadge = ({ status, onClick, showDropdown = false, disabled = false }) => {
  const map = {
    PENDING_APPROVAL: ['#fef3c7', '#92400e'],
    IN_PROGRESS:      ['#dbeafe', '#1e40af'],
    COMPLETED:        ['#dcfce7', '#166534'],
    IN_REVIEW:        ['#fef3c7', '#92400e'],
    REJECTED:         ['#fee2e2', '#991b1b'],
    CHANGE_REQUESTED: ['#fff7ed', '#c2410c'],
  };
  const [bg, color] = map[status] || ['#f1f5f9', '#475569'];

  if (!showDropdown) {
    return (
      <span className="tm-status-badge" style={{ background: bg, color }}>
        <span className="tm-status-dot" />
        {STATUS_LABELS[status] || status}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tm-status-badge"
      style={{
        background: bg, color,
        border: '1px solid rgba(15,23,42,0.1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span className="tm-status-dot" />
      {STATUS_LABELS[status] || status}
      <FaChevronDown size={8} />
    </button>
  );
};

const MiniAvatar = ({ name, size = 24 }) => {
  const clean   = cleanPersonName(name) || 'U';
  const initial = clean.charAt(0).toUpperCase();
  const colors  = ['#2563eb', '#0891b2', '#16a34a', '#d97706', '#4f46e5', '#dc2626'];
  const idx     = initial.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: colors[idx], color: '#fff', fontSize: size * 0.44,
      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Sora', sans-serif",
    }}>{initial}</div>
  );
};

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const SUBTASKS_PER_PAGE = 5;

const FieldError = ({ msg }) =>
  msg ? <span className="tm-field-err"><FaExclamationCircle size={10} /> {msg}</span> : null;

const CharCount = ({ value, max }) => {
  const len = (value || '').length;
  return (
    <span className="tm-char-count" style={{ color: len > max * 0.85 ? '#d97706' : '#64748b' }}>
      {len}/{max}
    </span>
  );
};

export default function TaskDetail({ user }) {
  const navigate        = useNavigate();
  const location        = useLocation();
  const taskIdFromState = location.state?.taskId;
  const userRole        = getNormalizedRole(user);
  const myId            = getMyId(user);
  const canManageSubtasks = ['Admin', 'Hr', 'Manager'].includes(userRole);

  const [showSubmitWork, setShowSubmitWork] = useState(false);
  const [task,           setTask]           = useState(null);
  const [submissions,    setSubmissions]    = useState([]);
  const [loading,        setLoading]        = useState(true);

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

  // Subtask Form State
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingSubtask,  setEditingSubtask]  = useState(null);
  const [subEffortEdited, setSubEffortEdited] = useState(false);
  const [subtaskForm,     setSubtaskForm]     = useState({
    title: '', description: '', assignee: '', branch: '', dept: '',
    priority: 'Medium', deadline: '', effort: '', tags: '',
  });
  const [subtaskErrors,  setSubtaskErrors]  = useState({});
  const [subtaskTouched, setSubtaskTouched] = useState({});

  // Portal Status Dropdown State
  const [dropdownState, setDropdownState] = useState({
    open: false,
    subtaskId: null,
    position: { top: 0, left: 0 }
  });

  // Subtask Filter & Pagination State
  const [subtaskCurrentPage,  setSubtaskCurrentPage]  = useState(1);
  const [subtaskSearchTerm,   setSubtaskSearchTerm]   = useState('');
  const [subtaskStatusFilter, setSubtaskStatusFilter] = useState('ALL');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.target.closest('[data-status-portal="true"]') || e.target.closest('[data-status-trigger="true"]')) {
        return;
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownState({ open: false, subtaskId: null, position: { top: 0, left: 0 } });
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownState({ open: false, subtaskId: null, position: { top: 0, left: 0 } });
        setShowCRModal(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!dropdownState.open) return;
    const handleScroll = () => {
      setDropdownState({ open: false, subtaskId: null, position: { top: 0, left: 0 } });
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [dropdownState.open]);

  const fetchTaskAndSubmissions = useCallback(async () => {
    if (!taskIdFromState) {
      setLoading(false);
      return;
    }
    try {
      const [taskRes, subRes] = await Promise.all([
        fetch(API_ENDPOINTS.GET_TASK_BY_ID(taskIdFromState), { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.GET_TASK_SUBMISSIONS(taskIdFromState), { headers: getAuthHeaders() }),
      ]);

      const taskData = await taskRes.json();
      if (!taskRes.ok) throw new Error(taskData.message || 'Task not found');
      const unwrappedTask = unwrapResponse(taskData);
      setTask(unwrappedTask && typeof unwrappedTask === 'object' ? unwrappedTask : null);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(extractArray(subData));
      }
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [taskIdFromState]);

  useEffect(() => {
    setActiveTab('overview');
    setShowSubtaskForm(false);
    setEditingSubtask(null);
    setLoading(true);
    fetchTaskAndSubmissions();
  }, [fetchTaskAndSubmissions]);

  useEffect(() => {
    if (!canManageSubtasks) return;
    let active = true;
    const fetchDropdowns = async () => {
      try {
        const currentRole = getNormalizedRole();
        const needsRefEmployees = currentRole === 'Manager' || currentRole === 'Hr';
        const [branchRes, empRes, deptRes, refEmpRes] = await Promise.all([
          fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }),
          fetch(API_ENDPOINTS.GET_TASK_ASSIGNEES, { headers: getAuthHeaders() }),
          fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: getAuthHeaders() }),
          needsRefEmployees
            ? fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=200`, { headers: getAuthHeaders() }).catch(() => null)
            : Promise.resolve(null),
        ]);

        const [bJson, eJson, dJson, refJson] = await Promise.all([
          branchRes.json(),
          empRes.json(),
          deptRes.json(),
          refEmpRes ? refEmpRes.json().catch(() => null) : Promise.resolve(null),
        ]);

        if (!active) return;
        const deptList = extractArray(dJson);
        setBranches(extractArray(bJson));
        setDepartments(deptList);
        if (empRes.ok) {
          const flatEmployees = extractArray(eJson).flatMap(group =>
            Array.isArray(group.employees)
              ? group.employees.map(employee => ({
                  ...employee,
                  roleName: employee.roleName || employee.role,
                  departmentId: employee.departmentId ?? group.departmentId,
                  departmentName: employee.departmentName ?? group.departmentName,
                }))
              : [{ ...group, roleName: group.roleName || group.role }]
          );
          const referenceEmployees = refJson ? extractArray(refJson) : [];
          setEmployees(
            scopeEmployeesForRole(flatEmployees, getStoredUser(), deptList, {
              referenceEmployees,
              failClosed: false,
            })
          );
        }
        setDropdownsLoaded(true);
      } catch (err) {
        console.error('Dropdown fetch error:', err);
      }
    };
    fetchDropdowns();
    return () => { active = false; };
  }, [canManageSubtasks]);

  const areAllSubtasksCompleted = () => {
    if (!task?.subtasks?.length) return true;
    return task.subtasks.every(s => s.status === 'COMPLETED');
  };

  useEffect(() => {
    if (subtaskForm.branch && departments.length > 0) {
      setFilteredDepts(departments.filter(d => String(d.branchId) === String(subtaskForm.branch)));
    } else {
      setFilteredDepts([]);
    }
  }, [subtaskForm.branch, departments]);

  useEffect(() => {
    let filtered = [...employees];
    if (subtaskForm.dept) {
      filtered = filtered.filter(emp => String(emp.departmentId) === String(subtaskForm.dept));
    } else if (subtaskForm.branch) {
      const deptIds = departments
        .filter(d => String(d.branchId) === String(subtaskForm.branch))
        .map(d => String(d.id));
      filtered = filtered.filter(emp => deptIds.includes(String(emp.departmentId)));
    }
    setFilteredEmployees(filtered);
  }, [employees, departments, subtaskForm.branch, subtaskForm.dept]);

  const updateTaskStatus = async (taskId, newStatus, extraProgress = null) => {
    const payload = { taskId, status: newStatus };
    if (extraProgress !== null) payload.progress = extraProgress;
    const res = await fetch(API_ENDPOINTS.UPDATE_TASK_STATUS, {
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
      await fetchTaskAndSubmissions();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setActionBusy(false);
    }
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
      await fetchTaskAndSubmissions();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleApproveChange = async () => {
    setActionBusy(true);
    try {
      const res  = await fetch(API_ENDPOINTS.APPROVE_CHANGE(crTaskId || task.id), { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success('Approved', 'Change request approved');
      setShowCRModal(false); setCrTaskId(null); setCrReason(''); setCrDeadline('');
      await fetchTaskAndSubmissions();
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
      await fetchTaskAndSubmissions();
    } catch (err) { toast.error('Error', err.message); }
    finally { setActionBusy(false); }
  };

  const handleSendChange = async () => {
    if (!crReason.trim()) return;
    setActionBusy(true);
    try {
      const targetId = crTaskId || task.id;
      const payload = { reason: crReason.trim(), requestedDeadline: crDeadline ? `${crDeadline}T00:00:00` : null };
      const res  = await fetch(API_ENDPOINTS.SEND_CHANGE_REQ(targetId), {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.warning('Sent', 'Change request submitted');
      setShowCRModal(false); setCrTaskId(null); setCrReason(''); setCrDeadline('');
      await fetchTaskAndSubmissions();
    } catch (err) { toast.error('Error', err.message); }
    finally { setActionBusy(false); }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res  = await fetch(API_ENDPOINTS.ADD_COMMENT(task.id), {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ comment: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success('Added', 'Comment posted');
      setCommentText('');
      await fetchTaskAndSubmissions();
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
    if (field === 'effort') {
      setSubEffortEdited(value.trim() !== '');
    }
    setSubtaskForm(prev => {
      const nf = { ...prev, [field]: value };
      if (field === 'branch') { nf.dept = ''; nf.assignee = ''; }
      if (field === 'dept')   { nf.assignee = ''; }
      if (field === 'deadline' && !subEffortEdited) {
        nf.effort = calculateEffortFromDates(value) || '';
      }
      return nf;
    });
    if (subtaskTouched[field])
      setSubtaskErrors(prev => ({ ...prev, [field]: validateSubtaskField(field, value) }));
  };

  const handleSubtaskBlur = (field) => {
    setSubtaskTouched(prev => ({ ...prev, [field]: true }));
    setSubtaskErrors(prev => ({ ...prev, [field]: validateSubtaskField(field, subtaskForm[field]) }));
  };

  const openCreateSubtaskForm = () => {
    let defaultBranch = task?.branchId != null ? String(task.branchId) : '';
    if (!defaultBranch && task?.branch && branches.length > 0) {
      const bName = typeof task.branch === 'object' ? task.branch.name : task.branch;
      const found = branches.find(b => b.name === bName || String(b.id) === String(task.branch));
      if (found) defaultBranch = String(found.id);
    }

    let defaultDept = task?.departmentId != null ? String(task.departmentId) : '';
    if (!defaultDept && task?.department && departments.length > 0) {
      const dName = typeof task.department === 'object' ? task.department.name : task.department;
      const found = departments.find(d => d.name === dName || String(d.id) === String(task.department));
      if (found) defaultDept = String(found.id);
    }

    setEditingSubtask(null);
    setSubEffortEdited(false);
    setSubtaskForm({
      title: '', description: '', assignee: '',
      branch: defaultBranch, dept: defaultDept,
      priority: 'Medium', deadline: '', effort: '', tags: '',
    });
    setSubtaskErrors({});
    setSubtaskTouched({});
    setShowSubtaskForm(true);
  };

  const handleEditSubtask = (subtask) => {
    if (!dropdownsLoaded) { toast.warning('Please wait', 'Loading form data...'); return; }
    let formattedDeadline = '';
    if (subtask.dueDate) {
      formattedDeadline = new Date(subtask.dueDate).toISOString().split('T')[0];
    }
    let branchId = subtask.branchId != null ? String(subtask.branchId) : '';
    if (!branchId && subtask.branch && branches.length > 0) {
      const name = typeof subtask.branch === 'object' ? subtask.branch.name : subtask.branch;
      const found = branches.find(b => b.name === name || String(b.id) === String(subtask.branch));
      if (found) branchId = String(found.id);
    }
    let deptId = subtask.departmentId != null ? String(subtask.departmentId) : '';
    if (!deptId && subtask.department && departments.length > 0) {
      const name = typeof subtask.department === 'object' ? subtask.department.name : subtask.department;
      const found = departments.find(d => d.name === name || String(d.id) === String(subtask.department));
      if (found) deptId = String(found.id);
    }
    let assigneeId = subtask.assignedToId != null ? String(subtask.assignedToId) : '';
    if (!assigneeId && subtask.assignedTo && employees.length > 0) {
      const aName = cleanPersonName(subtask.assignedTo);
      const found = employees.find(
        e => cleanPersonName(e.name) === aName || String(e.id) === String(subtask.assignedTo)
      );
      if (found) assigneeId = String(found.id);
    }

    const existingEffort = subtask.effort || subtask.effortEstimate || '';
    setSubEffortEdited(Boolean(existingEffort));
    setEditingSubtask(subtask);
    setSubtaskForm({
      title: subtask.title || '',
      description: subtask.description || '',
      assignee: assigneeId,
      branch: branchId,
      dept: deptId,
      priority: priKey(subtask.priority),
      deadline: formattedDeadline,
      effort: existingEffort,
      tags: subtask.tags || '',
    });
    setShowSubtaskForm(true);
    setSubtaskErrors({});
    setSubtaskTouched({});
  };

  const handleCreateOrUpdateSubtask = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const allFields = ['title', 'assignee', 'branch', 'dept', 'deadline'];
    setSubtaskTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    const errs = {};
    allFields.forEach(f => { const err = validateSubtaskField(f, subtaskForm[f]); if (err) errs[f] = err; });
    setSubtaskErrors(errs);
    if (Object.keys(errs).length > 0) { toast.warning('Validation', 'Fix highlighted fields'); return; }

    const payload = {
      title:        subtaskForm.title.trim(),
      description:  subtaskForm.description.trim() || null,
      priority:     subtaskForm.priority.toUpperCase(),
      assignedToId: Number(subtaskForm.assignee),
      departmentId: Number(subtaskForm.dept),
      branchId:     Number(subtaskForm.branch),
      dueDate:      subtaskForm.deadline ? `${subtaskForm.deadline}T00:00:00` : null,
      effort:       subtaskForm.effort.trim() || null,
      tags:         subtaskForm.tags.trim() || null,
    };

    setSubmitting(true);
    try {
      const url = editingSubtask
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
      await fetchTaskAndSubmissions();
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
    event.stopPropagation();
    if (dropdownState.open && dropdownState.subtaskId === subtaskId) {
      setDropdownState({ open: false, subtaskId: null, position: { top: 0, left: 0 } });
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 160;
    let top = rect.bottom + 6;
    if (top + dropdownHeight > viewportHeight) {
      top = rect.top - dropdownHeight - 6;
    }
    setDropdownState({
      open: true,
      subtaskId,
      position: { top, left: Math.min(rect.left, window.innerWidth - 190) }
    });
  };

  const isSubtaskFieldErr = (f) => subtaskTouched[f] && !!subtaskErrors[f];
  const isSubtaskFieldOk  = (f) => subtaskTouched[f] && !subtaskErrors[f] && Boolean(subtaskForm[f]);

  const STATUS_FLOW = ['PENDING_APPROVAL', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
  const statusIdx   = task ? STATUS_FLOW.indexOf(task.status) : -1;

  // Subtask filter & pagination
  const filteredSubtasks = useMemo(() => {
    if (!task?.subtasks) return [];
    return task.subtasks.filter(s => {
      const matchesStatus =
        subtaskStatusFilter === 'ALL' ||
        (subtaskStatusFilter === 'COMPLETED' && s.status === 'COMPLETED') ||
        (subtaskStatusFilter === 'PENDING' && s.status !== 'COMPLETED');

      if (!matchesStatus) return false;
      if (!subtaskSearchTerm.trim()) return true;

      const term = subtaskSearchTerm.toLowerCase();
      return (
        s.title?.toLowerCase().includes(term) ||
        String(s.id).includes(term) ||
        `t-${String(s.id).padStart(3, '0')}`.includes(term) ||
        cleanPersonName(s.assignedTo).toLowerCase().includes(term)
      );
    });
  }, [task?.subtasks, subtaskSearchTerm, subtaskStatusFilter]);

  const totalSubtaskPages = Math.max(1, Math.ceil(filteredSubtasks.length / SUBTASKS_PER_PAGE));
  const paginatedSubtasks = useMemo(() => {
    const start = (subtaskCurrentPage - 1) * SUBTASKS_PER_PAGE;
    return filteredSubtasks.slice(start, start + SUBTASKS_PER_PAGE);
  }, [filteredSubtasks, subtaskCurrentPage]);

  useEffect(() => {
    if (subtaskCurrentPage > totalSubtaskPages) {
      setSubtaskCurrentPage(totalSubtaskPages);
    }
  }, [totalSubtaskPages, subtaskCurrentPage]);

  const getPageNumbers = () => {
    if (totalSubtaskPages <= 5) return Array.from({ length: totalSubtaskPages }, (_, i) => i + 1);
    if (subtaskCurrentPage <= 3) return [1, 2, 3, 4, '...', totalSubtaskPages];
    if (subtaskCurrentPage >= totalSubtaskPages - 2) {
      return [1, '...', totalSubtaskPages - 3, totalSubtaskPages - 2, totalSubtaskPages - 1, totalSubtaskPages];
    }
    return [1, '...', subtaskCurrentPage - 1, subtaskCurrentPage, subtaskCurrentPage + 1, '...', totalSubtaskPages];
  };

  // Real actual hours logged across submissions
  const actualHoursLogged = useMemo(() => {
    return submissions.reduce((sum, s) => {
      const h = Number(s.hoursSpent);
      return Number.isFinite(h) ? sum + h : sum;
    }, 0);
  }, [submissions]);

  // Reviewed feedback records
  const reviewedFeedbacks = useMemo(() => {
    return submissions.filter(s => s.status !== 'SUBMITTED' || s.reviewComment);
  }, [submissions]);

  // Real chronological activity timeline (no fabricated entries)
  const activityEvents = useMemo(() => {
    if (!task) return [];
    const items = [];
    if (task.createdAt) {
      items.push({
        id: 'created',
        icon: '🆕',
        color: '#6366f1',
        title: 'Task Created',
        desc: `Assigned to ${cleanPersonName(task.assignedTo) || 'Unassigned'}${task.assignedBy ? ` by ${cleanPersonName(task.assignedBy)}` : ''}`,
        time: task.createdAt,
      });
    }
    (task.subtasks || []).forEach(sub => {
      if (sub.createdAt) {
        items.push({
          id: `sub-${sub.id}`,
          icon: sub.status === 'COMPLETED' ? '✅' : '📌',
          color: sub.status === 'COMPLETED' ? '#059669' : '#0891b2',
          title: `Subtask T-${String(sub.id).padStart(3, '0')}: ${sub.title}`,
          desc: `Status: ${STATUS_LABELS[sub.status] || sub.status} · Assigned to ${cleanPersonName(sub.assignedTo) || 'Unassigned'}`,
          time: sub.updatedAt || sub.createdAt,
        });
      }
    });
    submissions.forEach(sub => {
      if (sub.submittedAt) {
        items.push({
          id: `work-${sub.id}`,
          icon: '📤',
          color: '#2563eb',
          title: `${sub.finalSubmission ? 'Final Submission' : 'Daily Work Report'} by ${cleanPersonName(sub.employeeName) || 'Employee'}`,
          desc: `Progress: ${sub.progressPercent ?? 0}%${sub.hoursSpent != null ? ` · Hours: ${sub.hoursSpent}h` : ''} · Status: ${sub.status}`,
          time: sub.submittedAt,
        });
      }
    });
    if (task.changeRequest) {
      items.push({
        id: 'cr',
        icon: '↩',
        color: '#d97706',
        title: 'Change Request Submitted',
        desc: task.changeRequest.reason,
        time: task.changeRequest.createdAt || task.updatedAt || task.createdAt,
      });
    }
    (task.comments || []).forEach((c, idx) => {
      items.push({
        id: `comment-${c.id || idx}`,
        icon: '💬',
        color: '#7c3aed',
        title: `Comment by ${cleanPersonName(c.author) || 'User'}`,
        desc: c.comment,
        time: c.createdAt,
      });
    });
    return items.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  }, [task, submissions]);

  if (loading) return <LoadingSpinner message="Loading task workspace…" />;
  if (!task)   return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Task not found.</div>;

  const isAssignedUser = !!myId && String(task.assignedToId) === String(myId);
  const canReviewSubmission =
    !!myId &&
    !isAssignedUser &&
    (String(task.assignedById) === String(myId) || ['Admin', 'Hr'].includes(userRole));

  const tags = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const allSubtasksCompleted    = areAllSubtasksCompleted();
  const totalSubtasksCount      = task.subtasks?.length || 0;
  const completedSubtasksCount  = task.subtasks ? task.subtasks.filter(s => s.status === 'COMPLETED').length : 0;
  const incompleteSubtasksCount = totalSubtasksCount - completedSubtasksCount;
  const subtaskCompletionPct    = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;

  const openSubtask = dropdownState.open && dropdownState.subtaskId
    ? paginatedSubtasks.find(s => s.id === dropdownState.subtaskId)
    : null;
  const availableStatuses = openSubtask ? getAvailableStatuses(openSubtask.status) : [];

  const startItemIndex = filteredSubtasks.length === 0 ? 0 : (subtaskCurrentPage - 1) * SUBTASKS_PER_PAGE + 1;
  const endItemIndex   = Math.min(subtaskCurrentPage * SUBTASKS_PER_PAGE, filteredSubtasks.length);

  return (
    <div className="tm-page">
      {/* Top Header Card */}
      <div className="tm-detail-hero">
        <div className="tm-detail-hero-top">
          <div className="tm-detail-badges">
            <button type="button" className="tm-btn tm-btn-ghost tm-btn-sm" onClick={() => navigate('/TaskList')}>
              <FaArrowLeft size={11} /> Back
            </button>
            {(task.parentTaskId || task.parentId) && (
              <button
                type="button"
                className="tm-link-chip"
                onClick={() => navigate('/TaskDetail', { state: { taskId: task.parentTaskId || task.parentId } })}
                title="Open parent task"
              >
                Parent #T-{String(task.parentTaskId || task.parentId).padStart(3, '0')}
              </button>
            )}
            <span className="tm-id-badge">
              T-{String(task.id).padStart(3, '0')}
            </span>
            <StatusBadge status={task.status} />
            <span className="tm-status-badge" style={{ background: PRIORITY_BG[priKey(task.priority)] || '#f1f5f9', color: PRIORITY_COLORS[priKey(task.priority)] || '#475569' }}>
              {priKey(task.priority)} Priority
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {task.status === 'COMPLETED' && (
              <button
                type="button"
                className="tm-btn tm-btn-secondary tm-btn-sm"
                onClick={() => navigate('/performance')}
              >
                <FaStar size={11} /> Performance
              </button>
            )}
            {canManageSubtasks && (
              <>
                <button
                  type="button"
                  className="tm-btn tm-btn-secondary tm-btn-sm"
                  disabled={actionBusy}
                  onClick={() => navigate('/CreateTask', { state: { taskToEdit: task, isEditing: true } })}
                >
                  <FaEdit size={11} /> Edit Task
                </button>
                <button
                  type="button"
                  className="tm-btn tm-btn-primary tm-btn-sm"
                  disabled={actionBusy}
                  onClick={() => {
                    setActiveTab('subtasks');
                    openCreateSubtaskForm();
                  }}
                >
                  <FaPlus size={11} /> Add Subtask
                </button>
              </>
            )}

            {isAssignedUser && task.status === 'IN_PROGRESS' && (
              <button
                type="button"
                className="tm-btn tm-btn-primary tm-btn-sm"
                disabled={actionBusy}
                onClick={() => setShowSubmitWork(true)}
              >
                <FaPaperPlane size={11} /> Submit Work
              </button>
            )}
          </div>
        </div>
        <h1 className="tm-detail-title">
          {task.title}
        </h1>
      </div>

      {/* Action Banners */}
      {isAssignedUser && task.status === 'PENDING_APPROVAL' && (
        <div className="tm-alert tm-alert--amber">
          <div className="tm-alert-text">Action Required — Accept or Reject Assigned Task</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="tm-btn tm-btn-success" disabled={actionBusy} onClick={() => updateStatus('IN_PROGRESS')}><FaCheck size={11} /> Accept Task</button>
            <button type="button" className="tm-btn tm-btn-danger" disabled={actionBusy} onClick={() => updateStatus('REJECTED')}><FaTimes size={11} /> Reject Task</button>
          </div>
        </div>
      )}

      {isAssignedUser && task.status === 'IN_PROGRESS' && (
        <div className="tm-alert tm-alert--green">
          <div>
            <div className="tm-alert-text">Task In Progress</div>
            {!allSubtasksCompleted && totalSubtasksCount > 0 && (
              <div className="tm-alert-sub">
                {incompleteSubtasksCount} of {totalSubtasksCount} subtask{incompleteSubtasksCount !== 1 ? 's' : ''} still pending completion.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="tm-btn tm-btn-primary" disabled={actionBusy} onClick={() => setShowSubmitWork(true)}>Submit for Review</button>
            <button type="button" className="tm-btn tm-btn-amber-outline" disabled={actionBusy} onClick={() => updateStatus('CHANGE_REQUESTED')}><FaExchangeAlt size={11} /> Request Change</button>
            <button type="button" className="tm-btn tm-btn-success" disabled={actionBusy || !allSubtasksCompleted} onClick={() => updateStatus('COMPLETED', 100)}>
              <FaCheckCircle size={11} /> Mark Complete
            </button>
          </div>
        </div>
      )}

      {canReviewSubmission && task.status === 'IN_REVIEW' && (
        <div className="tm-alert tm-alert--purple">
          <div>
            <div className="tm-alert-text">Under Review — Manager Action</div>
            {!allSubtasksCompleted && totalSubtasksCount > 0 && (
              <div className="tm-alert-sub">
                {incompleteSubtasksCount} subtask{incompleteSubtasksCount !== 1 ? 's' : ''} still pending before approving.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="tm-btn tm-btn-success" disabled={actionBusy || !allSubtasksCompleted} onClick={() => updateStatus('COMPLETED', 100)}>
              <FaCheck size={11} /> Approve &amp; Complete
            </button>
            <button type="button" className="tm-btn tm-btn-secondary" disabled={actionBusy} onClick={() => updateStatus('IN_PROGRESS')}><FaUndo size={11} /> Send Back</button>
          </div>
        </div>
      )}

      {task.status === 'CHANGE_REQUESTED' && (
        <div className="tm-alert tm-alert--amber" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="tm-alert-text">Change Request Pending</div>
          {task.changeRequest && (
            <div className="tm-card tm-card--padded" style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 13, color: 'var(--tm-text-primary)', marginBottom: 4 }}><strong>Reason:</strong> {task.changeRequest.reason}</div>
              {task.changeRequest.requestedDeadline && (
                <div style={{ fontSize: 12, color: 'var(--tm-text-muted)' }}>Requested Deadline: <strong>{formatDate(task.changeRequest.requestedDeadline)}</strong></div>
              )}
            </div>
          )}
          {canReviewSubmission && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="tm-btn tm-btn-success" disabled={actionBusy} onClick={handleApproveChange}><FaCheck size={11} /> Approve Change</button>
              <button type="button" className="tm-btn tm-btn-danger" disabled={actionBusy} onClick={handleRejectChange}><FaTimes size={11} /> Reject Change</button>
            </div>
          )}
        </div>
      )}

      {/* 6-Tab Workspace Navigation */}
      <div className="tm-tab-bar">
        <button type="button" className={`tm-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button type="button" className={`tm-tab-btn ${activeTab === 'subtasks' ? 'active' : ''}`} onClick={() => setActiveTab('subtasks')}>
          Subtasks ({totalSubtasksCount})
        </button>
        <button type="button" className={`tm-tab-btn ${activeTab === 'dailywork' ? 'active' : ''}`} onClick={() => setActiveTab('dailywork')}>
          Daily Work
        </button>
        <button type="button" className={`tm-tab-btn ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => setActiveTab('submissions')}>
          Submissions ({submissions.length})
        </button>
        <button type="button" className={`tm-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
          Feedback &amp; Comments ({reviewedFeedbacks.length + (task.comments || []).length})
        </button>
        <button type="button" className={`tm-tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
          Activity History ({activityEvents.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="tm-overview-grid">
          <div className="tm-col-stack">
            <div className="tm-card">
              <div className="tm-card-header">
                <h3 className="tm-card-title">Description &amp; Scope</h3>
              </div>
              <div className="tm-card-body">
                <p className="tm-description-text">
                  {task.description || 'No description provided.'}
                </p>
                {tags.length > 0 && (
                  <div className="tm-tag-list">
                    {tags.map(tag => (
                      <span key={tag} className="tm-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Progress + Hours Summary */}
            <div className="tm-card">
              <div className="tm-card-header">
                <h3 className="tm-card-title">Completion &amp; Hours Summary</h3>
                <span style={{ fontSize: 19, fontWeight: 800, fontFamily: "'Sora',sans-serif", color: 'var(--tm-primary)' }}>
                  {task.progress || 0}%
                </span>
              </div>
              <div className="tm-card-body">
                <div className="tm-progress-track tm-progress-track--lg" style={{ marginBottom: 16 }}>
                  <div className={`tm-progress-fill ${(task.progress || 0) >= 100 ? 'tm-progress-fill--done' : ''}`} style={{ width: `${task.progress || 0}%` }} />
                </div>

                <div className="tm-mini-stats-grid">
                  <div className="tm-mini-stat">
                    <div className="tm-mini-stat-label">Estimated Effort</div>
                    <div className="tm-mini-stat-val">{normaliseEffort(task.effort || task.effortEstimate)}</div>
                  </div>
                  <div className="tm-mini-stat">
                    <div className="tm-mini-stat-label">Actual Submitted Hours</div>
                    <div className="tm-mini-stat-val">
                      {actualHoursLogged > 0 ? `${actualHoursLogged} hrs` : '—'}
                    </div>
                  </div>
                  <div className="tm-mini-stat">
                    <div className="tm-mini-stat-label">Subtask Completion</div>
                    <div className="tm-mini-stat-val">
                      {completedSubtasksCount} / {totalSubtasksCount} ({subtaskCompletionPct}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="tm-col-stack">
            <div className="tm-card">
              <div className="tm-card-header">
                <h3 className="tm-card-title">Task Metadata</h3>
              </div>
              <div className="tm-card-body" style={{ paddingTop: 10, paddingBottom: 14 }}>
                <div className="tm-meta-row">
                  <span className="tm-meta-key">Assignee</span>
                  <div className="tm-meta-val">
                    <MiniAvatar name={task.assignedTo} size={22} />
                    <span>{cleanPersonName(task.assignedTo) || 'Unassigned'}</span>
                  </div>
                </div>
                {task.assignedBy && (
                  <div className="tm-meta-row">
                    <span className="tm-meta-key">Assigned By</span>
                    <span className="tm-meta-val">
                      <FaUserTie size={11} color="var(--tm-primary)" /> {cleanPersonName(task.assignedBy)}
                    </span>
                  </div>
                )}
                {task.department && (
                  <div className="tm-meta-row">
                    <span className="tm-meta-key">Department</span>
                    <span className="tm-meta-val">
                      <FaSitemap size={11} color="var(--tm-primary)" /> {typeof task.department === 'object' ? task.department.name : task.department}
                    </span>
                  </div>
                )}
                {task.branch && (
                  <div className="tm-meta-row">
                    <span className="tm-meta-key">Branch</span>
                    <span className="tm-meta-val">
                      <FaBuilding size={11} color="var(--tm-primary)" /> {typeof task.branch === 'object' ? task.branch.name : task.branch}
                    </span>
                  </div>
                )}
                <div className="tm-meta-row">
                  <span className="tm-meta-key">Deadline</span>
                  <span className="tm-meta-val" style={{ color: daysUntil(task.dueDate) < 0 && task.status !== 'COMPLETED' ? '#dc2626' : undefined }}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="tm-card">
              <div className="tm-card-header">
                <h3 className="tm-card-title">Workflow Stage</h3>
              </div>
              <div className="tm-card-body">
                {[
                  { status: 'PENDING_APPROVAL', label: 'Pending Approval', color: '#d97706' },
                  { status: 'IN_PROGRESS',      label: 'In Progress',      color: '#2563eb' },
                  { status: 'IN_REVIEW',        label: 'In Review',        color: '#d97706' },
                  { status: 'COMPLETED',        label: 'Completed',        color: '#16a34a' },
                ].map((s, i) => {
                  const isDone   = statusIdx > i;
                  const isActive = task.status === s.status;
                  return (
                    <div key={s.status} className={`tm-workflow-step ${i < 3 ? 'tm-workflow-step--spaced' : ''}`}>
                      {i < 3 && (
                        <div className={`tm-workflow-line ${isDone ? 'tm-workflow-line--done' : ''}`} />
                      )}
                      <div
                        className="tm-workflow-node"
                        style={{
                          background: isDone ? '#16a34a' : isActive ? s.color : undefined,
                          borderColor: isDone ? '#16a34a' : isActive ? s.color : undefined,
                          color: isDone || isActive ? '#fff' : undefined,
                        }}
                      >
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div style={{ paddingTop: 2 }}>
                        <div style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isDone ? '#16a34a' : isActive ? s.color : 'var(--tm-text-muted)' }}>
                          {s.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBTASKS */}
      {activeTab === 'subtasks' && (
        <div className="tm-card">
          <div className="tm-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <FaTasks size={14} color="var(--tm-primary)" />
              <h3 className="tm-card-title">Subtasks</h3>
              <span className="tm-count-badge">
                {completedSubtasksCount}/{totalSubtasksCount} Done
              </span>
            </div>

            {canManageSubtasks && !showSubtaskForm && (
              <button
                type="button"
                className="tm-btn tm-btn-primary tm-btn-sm"
                onClick={openCreateSubtaskForm}
              >
                <FaPlus size={10} /> Add Subtask
              </button>
            )}
          </div>

          {totalSubtasksCount > 0 && !showSubtaskForm && (
            <div className="tm-subtask-toolbar">
              <div className="tm-pill-group">
                {[
                  { id: 'ALL', label: `All (${totalSubtasksCount})` },
                  { id: 'PENDING', label: `Pending (${incompleteSubtasksCount})` },
                  { id: 'COMPLETED', label: `Completed (${completedSubtasksCount})` },
                ].map(pill => (
                  <button
                    key={pill.id}
                    type="button"
                    className={`tm-filter-pill ${subtaskStatusFilter === pill.id ? 'active' : ''}`}
                    onClick={() => { setSubtaskStatusFilter(pill.id); setSubtaskCurrentPage(1); }}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="tm-search-wrap">
                <FaSearch className="tm-search-icon" />
                <input
                  type="text"
                  className="tm-input"
                  placeholder="Search title, ID, assignee..."
                  value={subtaskSearchTerm}
                  onChange={(e) => { setSubtaskSearchTerm(e.target.value); setSubtaskCurrentPage(1); }}
                />
              </div>
            </div>
          )}

          <div className="tm-card-body">
            {showSubtaskForm && canManageSubtasks && (
              <div className="tm-subtask-form-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--tm-primary)' }}>
                      {editingSubtask ? `Edit Subtask #T-${String(editingSubtask.id).padStart(3, '0')}` : 'Create New Subtask'}
                    </h4>
                    <span className="tm-count-badge">Subtask</span>
                  </div>
                  <button type="button" className="tm-modal-close" onClick={handleCancelSubtaskForm}><FaTimes size={11} /></button>
                </div>
                <form onSubmit={handleCreateOrUpdateSubtask}>
                  <div className="tm-form-grid-3">
                    <div className={`tm-field ${isSubtaskFieldErr('title') ? 'has-error' : ''} ${isSubtaskFieldOk('title') ? 'has-ok' : ''}`}>
                      <div className="tm-field-label-row">
                        <label>Title <span className="tm-req">*</span></label>
                        <CharCount value={subtaskForm.title} max={100} />
                      </div>
                      <input type="text" maxLength={100} placeholder="Subtask title" value={subtaskForm.title} onChange={e => handleSubtaskChange('title', e.target.value)} onBlur={() => handleSubtaskBlur('title')} />
                      <FieldError msg={subtaskErrors.title} />
                    </div>

                    <div className={`tm-field ${isSubtaskFieldErr('branch') ? 'has-error' : ''}`}>
                      <label>Branch <span className="tm-req">*</span></label>
                      <select value={subtaskForm.branch} onChange={e => handleSubtaskChange('branch', e.target.value)} onBlur={() => handleSubtaskBlur('branch')}>
                        <option value="">Select branch</option>
                        {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                      </select>
                      <FieldError msg={subtaskErrors.branch} />
                    </div>

                    <div className={`tm-field ${isSubtaskFieldErr('dept') ? 'has-error' : ''}`}>
                      <label>Department <span className="tm-req">*</span></label>
                      <select value={subtaskForm.dept} onChange={e => handleSubtaskChange('dept', e.target.value)} onBlur={() => handleSubtaskBlur('dept')} disabled={!subtaskForm.branch}>
                        <option value="">{!subtaskForm.branch ? 'Select branch first' : filteredDepts.length === 0 ? 'No departments' : 'Select department'}</option>
                        {filteredDepts.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                      </select>
                      <FieldError msg={subtaskErrors.dept} />
                    </div>

                    <div className={`tm-field ${isSubtaskFieldErr('assignee') ? 'has-error' : ''}`}>
                      <label>Assign To <span className="tm-req">*</span></label>
                      <select value={subtaskForm.assignee} onChange={e => handleSubtaskChange('assignee', e.target.value)} onBlur={() => handleSubtaskBlur('assignee')} disabled={!subtaskForm.branch || !subtaskForm.dept}>
                        <option value="">{!subtaskForm.branch || !subtaskForm.dept ? 'Select branch & dept first' : filteredEmployees.length === 0 ? 'No employees' : 'Select assignee'}</option>
                        {filteredEmployees.map(m => <option key={m.id} value={String(m.id)}>{cleanPersonName(m.name)}{m.roleName ? ` · ${m.roleName}` : ''}</option>)}
                      </select>
                      <FieldError msg={subtaskErrors.assignee} />
                    </div>

                    <div className="tm-field">
                      <label>Priority</label>
                      <select value={subtaskForm.priority} onChange={e => handleSubtaskChange('priority', e.target.value)}>
                        {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>

                    <div className={`tm-field ${isSubtaskFieldErr('deadline') ? 'has-error' : ''}`}>
                      <label>Deadline <span className="tm-req">*</span></label>
                      <input
                        type="date"
                        value={subtaskForm.deadline}
                        onChange={e => handleSubtaskChange('deadline', e.target.value)}
                        onBlur={() => handleSubtaskBlur('deadline')}
                        min={!editingSubtask ? new Date().toISOString().split('T')[0] : undefined}
                      />
                      <FieldError msg={subtaskErrors.deadline} />
                    </div>

                    <div className="tm-field">
                      <label>Estimated Effort</label>
                      <input type="text" placeholder="Auto-fills on date selection" value={subtaskForm.effort} onChange={e => handleSubtaskChange('effort', e.target.value)} />
                    </div>

                    <div className="tm-field">
                      <label>Tags</label>
                      <input type="text" placeholder="e.g., Frontend, API" value={subtaskForm.tags} onChange={e => handleSubtaskChange('tags', e.target.value)} />
                    </div>

                    <div className="tm-field tm-col-span-full">
                      <label>Description</label>
                      <textarea rows={2} placeholder="Subtask description (optional)" value={subtaskForm.description} onChange={e => handleSubtaskChange('description', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                    <button type="button" className="tm-btn tm-btn-secondary" onClick={handleCancelSubtaskForm}>Cancel</button>
                    <button type="submit" className="tm-btn tm-btn-primary" disabled={submitting}>
                      {submitting
                        ? <><span className="tm-spinner" /> {editingSubtask ? 'Updating...' : 'Creating...'}</>
                        : <><FaSave size={11} /> {editingSubtask ? 'Update Subtask' : 'Create Subtask'}</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {filteredSubtasks.length > 0 ? (
              <>
                <div className="tm-table-scroll">
                  <table className="tm-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Assignee</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th>Effort</th>
                        <th className="tm-th-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSubtasks.map(sub => {
                        const subAvailableStatuses = getAvailableStatuses(sub.status);
                        const dueFmt = formatDate(sub.dueDate);
                        const daysLeft = daysUntil(sub.dueDate);
                        const isCompleted = sub.status === 'COMPLETED';
                        const isSubAssignee = !!myId && String(sub.assignedToId) === String(myId);
                        const canChangeSubStatus = subAvailableStatuses.length > 0 && (isSubAssignee || canManageSubtasks);

                        let dateClass = '';
                        if (!isCompleted && daysLeft !== null) {
                          if (daysLeft < 0) dateClass = 'tm-cell-date--overdue';
                          else if (daysLeft <= 3) dateClass = 'tm-cell-date--soon';
                        }

                        return (
                          <tr key={sub.id} style={{ opacity: isCompleted ? 0.78 : 1 }}>
                            <td>
                              <button
                                type="button"
                                className={`tm-id-badge ${isCompleted ? 'tm-id-badge--done' : ''}`}
                                style={{ border: 'none', cursor: 'pointer' }}
                                onClick={() => navigate('/TaskDetail', { state: { taskId: sub.id } })}
                                title="Open subtask workspace"
                              >
                                T-{String(sub.id).padStart(3, '0')}
                              </button>
                            </td>
                            <td>
                              <div
                                className="tm-cell-title"
                                style={{
                                  color: isCompleted ? 'var(--tm-text-muted)' : undefined,
                                  textDecoration: isCompleted ? 'line-through' : 'none',
                                  cursor: 'pointer',
                                }}
                                title={sub.title}
                                onClick={() => navigate('/TaskDetail', { state: { taskId: sub.id } })}
                              >
                                {sub.title}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                                <MiniAvatar name={sub.assignedTo} size={22} />
                                <span style={{ color: 'var(--tm-text-secondary)' }}>{cleanPersonName(sub.assignedTo) || 'Unassigned'}</span>
                              </div>
                            </td>
                            <td>
                              <span className="tm-status-badge" style={{ background: PRIORITY_BG[priKey(sub.priority)] || '#f1f5f9', color: PRIORITY_COLORS[priKey(sub.priority)] || '#475569' }}>
                                {priKey(sub.priority)}
                              </span>
                            </td>
                            <td data-status-trigger="true">
                              <StatusBadge
                                status={sub.status}
                                showDropdown={canChangeSubStatus}
                                onClick={(e) => handleStatusClick(sub.id, e)}
                                disabled={actionBusy}
                              />
                            </td>
                            <td>
                              <span className={`tm-cell-date ${dateClass}`}>
                                <FaCalendarAlt size={10} />
                                {dueFmt}
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--tm-text-secondary)' }}>
                              {normaliseEffort(sub.effort || sub.effortEstimate)}
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="tm-icon-action tm-icon-action--primary"
                                  onClick={() => navigate('/TaskDetail', { state: { taskId: sub.id } })}
                                  title="Open subtask workspace"
                                >
                                  <FaEye size={11} />
                                </button>
                                {canManageSubtasks && (
                                  <button
                                    type="button"
                                    className="tm-icon-action tm-icon-action--amber"
                                    onClick={() => handleEditSubtask(sub)}
                                    title="Edit subtask"
                                  >
                                    <FaEdit size={11} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="tm-pagination-bar" style={{ margin: '14px -20px -18px' }}>
                  <span className="tm-pagination-info">
                    Showing <strong>{startItemIndex}</strong>–<strong>{endItemIndex}</strong> of <strong>{filteredSubtasks.length}</strong> subtasks
                  </span>

                  {totalSubtaskPages > 1 && (
                    <div className="tm-pagination-controls">
                      <button
                        type="button"
                        className="tm-pg-btn"
                        onClick={() => setSubtaskCurrentPage(p => Math.max(1, p - 1))}
                        disabled={subtaskCurrentPage === 1}
                      >
                        <FaChevronLeft size={10} />
                      </button>

                      {getPageNumbers().map((pageItem, idx) =>
                        pageItem === '...' ? (
                          <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', fontSize: 12, color: 'var(--tm-text-muted)' }}>…</span>
                        ) : (
                          <button
                            key={pageItem}
                            type="button"
                            className={`tm-pg-btn ${pageItem === subtaskCurrentPage ? 'active' : ''}`}
                            onClick={() => setSubtaskCurrentPage(pageItem)}
                          >
                            {pageItem}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className="tm-pg-btn"
                        onClick={() => setSubtaskCurrentPage(p => Math.min(totalSubtaskPages, p + 1))}
                        disabled={subtaskCurrentPage === totalSubtaskPages}
                      >
                        <FaChevronRight size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              !showSubtaskForm && (
                <div className="tm-table-empty">
                  <FaTasks style={{ fontSize: 30, opacity: 0.3, marginBottom: 10 }} />
                  <p style={{ fontSize: 13, margin: 0 }}>
                    {subtaskSearchTerm || subtaskStatusFilter !== 'ALL'
                      ? 'No subtasks match the current filter.'
                      : 'No subtasks created under this task yet.'}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DAILY WORK */}
      {activeTab === 'dailywork' && (
        <div className="tm-col-stack">
          {isAssignedUser ? (
            <DailyWorkReport
              tasks={[task, ...(task.subtasks || [])]}
              selectedDate={formatIsoDate(new Date())}
              onSubmitted={fetchTaskAndSubmissions}
            />
          ) : (
            <div className="tm-card tm-card--padded">
              <h3 className="tm-card-title" style={{ marginBottom: 8 }}>Daily Work Logs</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--tm-text-muted)' }}>
                Daily work reports submitted by {cleanPersonName(task.assignedTo) || 'the assignee'} appear in the Submissions and Feedback tabs.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <SubmissionsPanel taskId={task.id} canReview={canReviewSubmission} onChanged={fetchTaskAndSubmissions} />
      )}

      {/* TAB 5: FEEDBACK & COMMENTS */}
      {activeTab === 'feedback' && (
        <div className="tm-col-stack">
          {/* Manager Review Feedback from Submissions */}
          <div className="tm-card">
            <div className="tm-card-header">
              <h3 className="tm-card-title">Manager Review Feedback ({reviewedFeedbacks.length})</h3>
            </div>
            <div className="tm-card-body">
              {reviewedFeedbacks.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--tm-text-muted)' }}>No review feedback recorded yet.</p>
              ) : (
                reviewedFeedbacks.map(sub => {
                  const parsed = parseReview(sub.reviewComment);
                  return (
                    <div key={sub.id} className="tm-feedback-item">
                      <div className="tm-submission-head">
                        <span className="tm-submission-author">
                          {sub.reviewedBy ? `Reviewed by ${cleanPersonName(sub.reviewedBy)}` : 'Submission Review'}
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {parsed.rating && (
                            <span className="tm-count-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FaStar size={9} /> {parsed.rating}
                            </span>
                          )}
                          <span className="tm-mini-tag" style={{ background: sub.status === 'APPROVED' ? '#dcfce7' : '#fee2e2', color: sub.status === 'APPROVED' ? '#166534' : '#991b1b' }}>
                            {sub.status}
                          </span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--tm-text-secondary)' }}>
                        {parsed.feedback || 'No written comment.'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Task Discussion Comments */}
          <div className="tm-card">
            <div className="tm-card-header">
              <h3 className="tm-card-title">Task Comments ({(task.comments || []).length})</h3>
            </div>
            <div className="tm-card-body">
              {(task.comments || []).map((c, i) => (
                <div key={c.id || i} className="tm-comment-row">
                  <MiniAvatar name={c.author} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tm-text-primary)' }}>{cleanPersonName(c.author) || 'User'}</span>
                      <span style={{ fontSize: 11, color: 'var(--tm-text-muted)' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--tm-text-secondary)', lineHeight: 1.5, margin: 0 }}>{c.comment}</p>
                  </div>
                </div>
              ))}
              {!(task.comments || []).length && (
                <div className="tm-table-empty" style={{ padding: 20 }}>
                  No comments yet.
                </div>
              )}
              <div className="tm-comment-composer">
                <div style={{ flex: 1 }}>
                  <textarea className="tm-textarea" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment…" style={{ minHeight: 74 }} />
                </div>
                <button type="button" className="tm-btn tm-btn-primary" onClick={handleComment} disabled={!commentText.trim() || submitting}>
                  <FaComment size={11} /> {submitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY HISTORY */}
      {activeTab === 'activity' && (
        <div className="tm-card">
          <div className="tm-card-header">
            <h3 className="tm-card-title">Activity History</h3>
          </div>
          <div className="tm-card-body">
            {activityEvents.length > 0 ? (
              <div className="tm-timeline">
                {activityEvents.map((ev, idx) => (
                  <div key={ev.id} className="tm-timeline-item">
                    {idx < activityEvents.length - 1 && (
                      <div className="tm-timeline-line" />
                    )}
                    <div className="tm-timeline-icon" style={{ background: `${ev.color}18`, border: `1.5px solid ${ev.color}44` }}>
                      {ev.icon}
                    </div>
                    <div className="tm-timeline-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tm-text-primary)' }}>{ev.title}</span>
                        {ev.time && (
                          <span style={{ fontSize: 11, color: 'var(--tm-text-muted)' }}>
                            {new Date(ev.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--tm-text-secondary)' }}>{ev.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tm-table-empty">
                No activity recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portal Status Dropdown */}
      {dropdownState.open && openSubtask && availableStatuses.length > 0 && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          data-status-portal="true"
          className="tm-status-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownState.position.top}px`,
            left: `${dropdownState.position.left}px`,
            zIndex: 99999,
          }}
        >
          {availableStatuses.map(status => {
            const icons = {
              IN_PROGRESS:      <FaCheckCircle size={12} color="#1e40af" />,
              IN_REVIEW:        <FaSearch size={12} color="#92400e" />,
              COMPLETED:        <FaCheck size={12} color="#166534" />,
              CHANGE_REQUESTED: <FaExchangeAlt size={12} color="#c2410c" />,
              REJECTED:         <FaBan size={12} color="#991b1b" />,
            };
            return (
              <button
                key={status}
                type="button"
                className="tm-status-dropdown-item"
                onClick={() => handleStatusChange(openSubtask.id, status, true)}
              >
                {icons[status] || <FaClock size={12} color="#92400e" />}
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>,
        document.body
      )}

      {/* Change Request Modal */}
      {showCRModal && (
        <div className="tm-modal-overlay">
          <div className="tm-modal-card">
            <div className="tm-modal-head">
              <h3 className="tm-modal-title"><FaExchangeAlt size={13} color="#d97706" /> Request Change</h3>
              <button type="button" className="tm-modal-close" onClick={() => { setShowCRModal(false); setCrTaskId(null); }}><FaTimes size={12} /></button>
            </div>
            <div className="tm-modal-body">
              <div className="tm-field" style={{ marginBottom: 14 }}>
                <label>Reason for Change <span className="tm-req">*</span></label>
                <textarea rows={3} value={crReason} onChange={e => setCrReason(e.target.value)} placeholder="Describe why you need a change…" />
              </div>
              <div className="tm-field">
                <label>Requested New Deadline (optional)</label>
                <input type="date" value={crDeadline} onChange={e => setCrDeadline(e.target.value)} />
              </div>
            </div>
            <div className="tm-modal-foot">
              <button type="button" className="tm-btn tm-btn-secondary" onClick={() => { setShowCRModal(false); setCrTaskId(null); }}>Cancel</button>
              <button type="button" className="tm-btn tm-btn-primary" style={{ background: '#d97706', borderColor: '#d97706' }} onClick={handleSendChange} disabled={!crReason.trim() || actionBusy}>
                <FaExchangeAlt size={11} /> Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitWork && <SubmitWorkModal task={task} onClose={() => setShowSubmitWork(false)} onDone={fetchTaskAndSubmissions} />}
    </div>
  );
}