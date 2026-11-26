import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaSave, FaExclamationCircle, FaArrowLeft,
  FaBuilding, FaTasks, FaUserCheck, FaCalendarAlt, FaStickyNote,
  FaCheckCircle, FaTags, FaFlag
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import {
  getNormalizedRole,
  calculateEffortFromDates
} from './taskAccess';
import { getStoredUser, scopeEmployeesForRole } from './taskScope';
import LoadingSpinner from '../components/LoadingSpinner';
import './TaskModule.css';

// Helper to extract array from various API response formats
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

const cleanEmployeeName = (name) => {
  if (!name) return '';
  return name.replace(/\s+null\s*/gi, '').trim();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const PRIORITIES = [
  { code: 'LOW', display: 'Low', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { code: 'MEDIUM', display: 'Medium', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { code: 'HIGH', display: 'High', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  { code: 'CRITICAL', display: 'Critical', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
];

const FieldError = ({ msg }) =>
  msg ? (
    <span className="tm-field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const CharCount = ({ value, max }) => {
  const len = (value || '').length;
  const warn = len > max * 0.85;
  return (
    <span className="tm-char-count" style={{ color: warn ? '#d97706' : '#64748b' }}>
      {len}/{max}
    </span>
  );
};

export default function CreateTask({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = user || getStoredUser();
  const userRole = getNormalizedRole(currentUser);
  const isManagerOrHR = userRole === 'Manager' || userRole === 'Hr';

  const taskToEdit = location.state?.taskToEdit;
  const isEditing = location.state?.isEditing || false;

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepts, setFilteredDepts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loadingDrops, setLoadingDrops] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee: '',
    branch: '',
    dept: '',
    priority: 'MEDIUM',
    deadline: '',
    effort: '',
    tags: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [effortEdited, setEffortEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const requests = [
          fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }),
          fetch(API_ENDPOINTS.GET_TASK_ASSIGNEES, { headers: getAuthHeaders() }),
          fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: getAuthHeaders() }),
        ];
        if (isManagerOrHR) {
          requests.push(
            fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=200`, { headers: getAuthHeaders() }).catch(() => null)
          );
        }

        const [branchRes, empRes, deptRes, allEmpRes] = await Promise.all(requests);
        const [branchData, empData, deptData, allEmpData] = await Promise.all([
          branchRes.json(),
          empRes.json(),
          deptRes.json(),
          allEmpRes && allEmpRes.ok ? allEmpRes.json().catch(() => null) : Promise.resolve(null),
        ]);

        const rawBranches = extractArray(branchData);
        const rawDepts = extractArray(deptData);
        if (!empRes.ok) throw new Error('Could not load eligible assignees');

        let loadedEmployees = extractArray(empData).flatMap(group =>
          (group.employees || []).map(employee => ({
            ...employee,
            roleName: employee.roleName || employee.role,
            departmentId: employee.departmentId ?? group.departmentId,
            departmentName: employee.departmentName ?? group.departmentName,
            branchId: employee.branchId ?? group.branchId,
          }))
        );

        const referenceEmployees = allEmpData ? extractArray(allEmpData) : [];
        let scopedBranches = rawBranches;
        let scopedDepts = rawDepts;

        // Restrict Manager & HR to only their own employees (never Admin/Manager/HR or other teams)
        if (isManagerOrHR) {
          loadedEmployees = scopeEmployeesForRole(loadedEmployees, currentUser, rawDepts, {
            referenceEmployees,
            failClosed: false,
          });

          // Limit Branch & Department dropdowns to those containing eligible employees (unless editing)
          if (!isEditing && loadedEmployees.length > 0) {
            const eligibleDeptIds = new Set(loadedEmployees.map(e => String(e.departmentId)).filter(Boolean));
            const filteredDeptList = rawDepts.filter(d => eligibleDeptIds.has(String(d.id)));
            if (filteredDeptList.length > 0) {
              scopedDepts = filteredDeptList;
              const eligibleBranchIds = new Set(scopedDepts.map(d => String(d.branchId)).filter(Boolean));
              if (eligibleBranchIds.size > 0) {
                scopedBranches = rawBranches.filter(b => eligibleBranchIds.has(String(b.id)));
              }
            }
          }
        }

        setBranches(scopedBranches);
        setEmployees(loadedEmployees);
        setDepartments(scopedDepts);
        setDataLoaded(true);

        // Auto-select branch/department when Manager or HR only has a single scope
        if (isManagerOrHR && !isEditing && scopedBranches.length === 1) {
          const singleBranchId = String(scopedBranches[0].id);
          const branchDepts = scopedDepts.filter(d => String(d.branchId) === singleBranchId);
          setForm(prev => ({
            ...prev,
            branch: prev.branch || singleBranchId,
            dept: prev.dept || (branchDepts.length === 1 ? String(branchDepts[0].id) : ''),
          }));
        }
      } catch (err) {
        console.error('Dropdown fetch error:', err);
        toast.error('Load Error', err.message || 'Could not load form data');
      } finally {
        setLoadingDrops(false);
      }
    };
    fetchDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditing && taskToEdit && dataLoaded) {
      let formattedDeadline = '';
      if (taskToEdit.dueDate) {
        const date = new Date(taskToEdit.dueDate);
        formattedDeadline = date.toISOString().split('T')[0];
      }

      let priority = 'MEDIUM';
      if (taskToEdit.priority) {
        const upper = taskToEdit.priority.toUpperCase();
        if (PRIORITIES.some(p => p.code === upper)) priority = upper;
      }

      let branchId = '';
      const taskBranchName =
        taskToEdit.branchName ||
        (typeof taskToEdit.branch === 'object' ? taskToEdit.branch?.name : taskToEdit.branch);
      if (taskToEdit.branchId) branchId = String(taskToEdit.branchId);
      else if (typeof taskToEdit.branch === 'object' && taskToEdit.branch?.id) branchId = String(taskToEdit.branch.id);
      else if (taskBranchName && branches.length) {
        const found = branches.find(b => b.name === taskBranchName);
        if (found) branchId = String(found.id);
      }

      let deptId = '';
      const taskDeptName =
        taskToEdit.departmentName ||
        (typeof taskToEdit.department === 'object' ? taskToEdit.department?.name : taskToEdit.department);
      if (taskToEdit.departmentId) deptId = String(taskToEdit.departmentId);
      else if (typeof taskToEdit.department === 'object' && taskToEdit.department?.id) deptId = String(taskToEdit.department.id);
      else if (taskDeptName && departments.length) {
        const found = departments.find(d => d.name === taskDeptName);
        if (found) deptId = String(found.id);
      }

      if (!branchId && deptId && departments.length) {
        const deptObj = departments.find(d => String(d.id) === String(deptId));
        if (deptObj?.branchId != null) branchId = String(deptObj.branchId);
      }

      let assigneeId = '';
      if (taskToEdit.assignedToId) assigneeId = String(taskToEdit.assignedToId);
      else if (taskToEdit.assignedTo && employees.length) {
        const found = employees.find(e =>
          cleanEmployeeName(e.name) === cleanEmployeeName(taskToEdit.assignedTo)
        );
        if (found) assigneeId = String(found.id);
      }

      const prefilledEffort = taskToEdit.effort || taskToEdit.effortEstimate || '';
      setEffortEdited(Boolean(prefilledEffort));

      setForm({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        assignee: assigneeId,
        branch: branchId,
        dept: deptId,
        priority: priority,
        deadline: formattedDeadline,
        effort: prefilledEffort,
        tags: taskToEdit.tags || '',
        note: taskToEdit.note || '',
      });
    }
  }, [isEditing, taskToEdit, dataLoaded, branches, departments, employees]);

  // Filter departments based on branch
  useEffect(() => {
    if (form.branch && departments.length) {
      setFilteredDepts(departments.filter(d => String(d.branchId) === String(form.branch)));
    } else setFilteredDepts([]);
  }, [form.branch, departments]);

  // Filter employees based on branch and department
  useEffect(() => {
    let filtered = [...employees];
    if (form.branch) {
      const ids = departments.filter(d => String(d.branchId) === String(form.branch)).map(d => String(d.id));
      filtered = filtered.filter(e => ids.includes(String(e.departmentId)));
    }
    if (form.dept) filtered = filtered.filter(e => String(e.departmentId) === String(form.dept));
    setFilteredEmployees(filtered);
  }, [employees, form.branch, form.dept, departments]);

  const validateField = (field, value) => {
    if (!value && ['title', 'assignee', 'branch', 'dept', 'deadline'].includes(field))
      return 'This field is required';
    if (field === 'title' && value && value.trim().length < 3)
      return 'Minimum 3 characters required';
    if (field === 'title' && value && value.trim().length > 100)
      return 'Maximum 100 characters allowed';
    if (field === 'deadline' && value && !isEditing) {
      const selected = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) return 'Deadline cannot be in the past';
    }
    return '';
  };

  const handleChange = (field, value) => {
    if (field === 'title' && value.length > 100) return;
    if (field === 'effort') {
      setEffortEdited(value.trim() !== '');
    }
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      if (field === 'branch') { newForm.dept = ''; newForm.assignee = ''; }
      if (field === 'dept') newForm.assignee = '';
      if (field === 'deadline' && !effortEdited) {
        newForm.effort = calculateEffortFromDates(value) || '';
      }
      return newForm;
    });
    if (touched[field])
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, form[field]) }));
  };

  const validateAll = () => {
    const errs = {};
    ['title', 'assignee', 'branch', 'dept', 'deadline'].forEach(f => {
      const e = validateField(f, form[f]);
      if (e) errs[f] = e;
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['title', 'assignee', 'branch', 'dept', 'deadline'];
    setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      assignedToId: parseInt(form.assignee),
      departmentId: parseInt(form.dept),
      branchId: parseInt(form.branch),
      dueDate: form.deadline ? `${form.deadline}T00:00:00` : null,
      effort: form.effort || null,
      tags: form.tags || null,
    };

    setSubmitting(true);
    try {
      let url, method;
      if (isEditing && taskToEdit) {
        url = API_ENDPOINTS.UPDATE_TASK(taskToEdit.id);
        method = 'PUT';
      } else {
        url = API_ENDPOINTS.CREATE_TASK;
        method = 'POST';
      }
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} task`);
      toast.success(isEditing ? 'Task Updated' : 'Task Created', `"${form.title}" has been ${isEditing ? 'updated' : 'submitted'} successfully`);
      navigate('/TaskList');
    } catch (err) {
      console.error(err);
      toast.error('Error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const isFieldErr = (f) => touched[f] && !!errors[f];
  const isFieldOk = (f) => touched[f] && !errors[f] && form[f];

  const selectedBranchObj = useMemo(
    () => branches.find(b => String(b.id) === String(form.branch)),
    [branches, form.branch]
  );
  const selectedDeptObj = useMemo(
    () => filteredDepts.find(d => String(d.id) === String(form.dept)),
    [filteredDepts, form.dept]
  );
  const selectedEmpObj = useMemo(
    () => filteredEmployees.find(e => String(e.id) === String(form.assignee)),
    [filteredEmployees, form.assignee]
  );
  const selectedPriorityObj = PRIORITIES.find(p => p.code === form.priority) || PRIORITIES[1];

  const parsedTags = useMemo(
    () => form.tags.split(',').map(t => t.trim()).filter(Boolean),
    [form.tags]
  );

  const readinessSteps = [
    { label: 'Scope', done: Boolean(form.branch && form.dept) },
    { label: 'Task Info', done: Boolean(form.title && form.title.trim().length >= 3) },
    { label: 'Assignee', done: Boolean(form.assignee) },
    { label: 'Deadline', done: Boolean(form.deadline) },
  ];

  const getInitials = (name) => {
    const clean = cleanEmployeeName(name);
    if (!clean) return '?';
    return clean
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  if (loadingDrops) return <LoadingSpinner message="Loading form data…" />;

  return (
    <div className="tm-page">
      {/* Enhanced Hero Header */}
      <div className="tm-create-hero">
        <div className="tm-header-left">
          <div className="tm-header-icon">
            <FaTasks />
          </div>
          <div>
            <h1 className="tm-title">{isEditing ? 'Edit Task' : 'Create New Task'}</h1>
            <p className="tm-subtitle">
              <span className="tm-role-pill">{userRole}</span>
              <span>
                {isEditing
                  ? 'Update task deliverables, assignment, and schedule'
                  : 'Define deliverables, assign an owner, and set a target deadline'}
              </span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="tm-create-steps">
            {readinessSteps.map(step => (
              <span key={step.label} className={`tm-create-step-chip ${step.done ? 'done' : ''}`}>
                <FaCheckCircle size={10} /> {step.label}
              </span>
            ))}
          </div>
          <button type="button" className="tm-btn tm-btn-secondary" onClick={() => navigate('/TaskList')}>
            <FaArrowLeft size={11} /> Back
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="tm-create-layout">
          {/* LEFT COLUMN: Task Information, Tags & Notes */}
          <div className="tm-create-col">
            <div className="tm-form-section">
              <div className="tm-form-section-head">
                <h3 className="tm-form-section-title">
                  <FaTasks size={13} color="var(--tm-primary)" /> Task Information
                </h3>
                <span className="tm-form-section-sub">Title and clear scope of deliverables</span>
              </div>

              <div className="tm-form-stack">
                {/* Task Title */}
                <div className={`tm-field ${isFieldErr('title') ? 'has-error' : ''} ${isFieldOk('title') ? 'has-ok' : ''}`}>
                  <div className="tm-field-label-row">
                    <label>Task Title <span className="tm-req">*</span></label>
                    <CharCount value={form.title} max={100} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., Redesign Q4 Payroll Reconciliation Flow"
                    value={form.title}
                    maxLength={100}
                    onChange={(e) => handleChange('title', e.target.value)}
                    onBlur={() => handleBlur('title')}
                  />
                  <FieldError msg={errors.title} />
                  <small className="tm-field-hint">3–100 characters, clear and actionable title</small>
                </div>

                {/* Description */}
                <div className="tm-field">
                  <label>Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the task — goals, requirements, acceptance criteria…"
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                  <small className="tm-field-hint">Optional, but recommended for faster execution</small>
                </div>

                {/* Tags with Live Chip Preview */}
                <div className="tm-field">
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FaTags size={11} color="var(--tm-primary)" /> Tags
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Frontend, UX, Bug"
                    value={form.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                  />
                  {parsedTags.length > 0 ? (
                    <div className="tm-tag-list" style={{ marginTop: 6 }}>
                      {parsedTags.map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className="tm-tag">#{tag}</span>
                      ))}
                    </div>
                  ) : (
                    <small className="tm-field-hint">Comma-separated labels for quick filtering</small>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="tm-form-section">
              <div className="tm-form-section-head">
                <h3 className="tm-form-section-title">
                  <FaStickyNote size={13} color="var(--tm-primary)" /> Additional Notes &amp; Instructions
                </h3>
                <span className="tm-form-section-sub">Context visible to the assignee</span>
              </div>
              <div className="tm-field">
                <textarea
                  rows={3}
                  placeholder="Any special instructions, references, or context for the assignee…"
                  value={form.note}
                  onChange={(e) => handleChange('note', e.target.value)}
                />
                <small className="tm-field-hint">Visible to the assignee</small>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Organization & Assignment, Priority & Scheduling, Live Summary */}
          <div className="tm-create-col">
            {/* Organization & Assignment Unified Flow */}
            <div className="tm-form-section">
              <div className="tm-form-section-head">
                <h3 className="tm-form-section-title">
                  <FaBuilding size={13} color="var(--tm-primary)" /> Organization &amp; Assignment
                </h3>
                <span className="tm-form-section-sub">Branch → Department → Owner</span>
              </div>

              <div className="tm-form-stack" style={{ gap: 12 }}>
                <div className="tm-form-grid-2">
                  {/* Step 1: Branch */}
                  <div className={`tm-field ${isFieldErr('branch') ? 'has-error' : ''}`}>
                    <label>
                      <span className="tm-step-badge">1</span>
                      Branch <span className="tm-req">*</span>
                    </label>
                    <select
                      value={form.branch}
                      onChange={(e) => handleChange('branch', e.target.value)}
                      onBlur={() => handleBlur('branch')}
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <FieldError msg={errors.branch} />
                  </div>

                  {/* Step 2: Department */}
                  <div className={`tm-field ${isFieldErr('dept') ? 'has-error' : ''}`}>
                    <label>
                      <span className="tm-step-badge">2</span>
                      Department <span className="tm-req">*</span>
                    </label>
                    <select
                      value={form.dept}
                      onChange={(e) => handleChange('dept', e.target.value)}
                      onBlur={() => handleBlur('dept')}
                      disabled={!form.branch || filteredDepts.length === 0}
                    >
                      <option value="">
                        {!form.branch
                          ? 'Select branch first'
                          : filteredDepts.length === 0
                            ? 'No departments'
                            : 'Select department'}
                      </option>
                      {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <FieldError msg={errors.dept} />
                  </div>
                </div>

                {/* Step 3: Assign To */}
                <div className={`tm-field ${isFieldErr('assignee') ? 'has-error' : ''}`}>
                  <div className="tm-field-label-row">
                    <label>
                      <span className="tm-step-badge">3</span>
                      Assign To <span className="tm-req">*</span>
                    </label>
                    {form.branch && form.dept && (
                      <span className="tm-card-meta">
                        {filteredEmployees.length} eligible
                      </span>
                    )}
                  </div>
                  <select
                    value={form.assignee}
                    onChange={(e) => handleChange('assignee', e.target.value)}
                    onBlur={() => handleBlur('assignee')}
                    disabled={!form.branch || !form.dept || filteredEmployees.length === 0}
                  >
                    <option value="">
                      {!form.branch || !form.dept
                        ? 'Select branch & department first'
                        : filteredEmployees.length === 0
                          ? 'No eligible assignees'
                          : 'Select employee or manager'}
                    </option>
                    {filteredEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {cleanEmployeeName(emp.name)} {emp.roleName ? `· ${emp.roleName}` : ''}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.assignee} />

                  {selectedEmpObj && (
                    <div className="tm-assignee-preview">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div className="tm-assignee-avatar">{getInitials(selectedEmpObj.name)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tm-text-primary)' }}>
                            {cleanEmployeeName(selectedEmpObj.name)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--tm-text-muted)' }}>
                            {selectedDeptObj?.name || 'Department'} · {selectedBranchObj?.name || 'Branch'}
                          </div>
                        </div>
                      </div>
                      <span className="tm-role-pill">
                        <FaUserCheck size={10} style={{ marginRight: 4 }} />
                        {selectedEmpObj.roleName || 'Assignee'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Priority & Scheduling */}
            <div className="tm-form-section">
              <div className="tm-form-section-head">
                <h3 className="tm-form-section-title">
                  <FaCalendarAlt size={13} color="var(--tm-primary)" /> Priority &amp; Scheduling
                </h3>
                <span className="tm-form-section-sub">Urgency, deadline &amp; effort</span>
              </div>

              <div className="tm-form-stack" style={{ gap: 14 }}>
                {/* Priority Selector Pills */}
                <div className="tm-field">
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FaFlag size={11} color={selectedPriorityObj.color} /> Priority
                  </label>
                  <div className="tm-priority-grid">
                    {PRIORITIES.map(p => {
                      const active = form.priority === p.code;
                      return (
                        <button
                          key={p.code}
                          type="button"
                          className="tm-priority-pill"
                          onClick={() => handleChange('priority', p.code)}
                          style={
                            active
                              ? {
                                  background: p.bg,
                                  borderColor: p.border,
                                  color: p.color,
                                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
                                }
                              : undefined
                          }
                        >
                          <span className="tm-priority-dot" style={{ background: p.color }} />
                          {p.display}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Deadline & Estimated Effort */}
                <div className="tm-form-grid-2">
                  <div className={`tm-field ${isFieldErr('deadline') ? 'has-error' : ''}`}>
                    <label>Deadline <span className="tm-req">*</span></label>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={(e) => handleChange('deadline', e.target.value)}
                      onBlur={() => handleBlur('deadline')}
                      min={!isEditing ? new Date().toISOString().split('T')[0] : undefined}
                    />
                    <FieldError msg={errors.deadline} />
                  </div>

                  <div className="tm-field">
                    <div className="tm-field-label-row">
                      <label>Estimated Effort</label>
                      {form.effort && (
                        <span className="tm-card-meta">
                          {effortEdited ? 'Custom' : 'Auto'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Auto from deadline"
                      value={form.effort}
                      onChange={(e) => handleChange('effort', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Task Summary Preview */}
            <div className="tm-summary-card">
              <h4 className="tm-summary-title">
                <span>Task Summary</span>
                <span
                  className="tm-status-badge"
                  style={{
                    background: selectedPriorityObj.bg,
                    color: selectedPriorityObj.color,
                    border: `1px solid ${selectedPriorityObj.border}`,
                  }}
                >
                  {selectedPriorityObj.display} Priority
                </span>
              </h4>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Title</span>
                <span className="tm-summary-val">{form.title.trim() || 'Untitled task'}</span>
              </div>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Scope</span>
                <span className="tm-summary-val">
                  {selectedBranchObj?.name || '—'} / {selectedDeptObj?.name || '—'}
                </span>
              </div>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Assignee</span>
                <span className="tm-summary-val">
                  {selectedEmpObj ? cleanEmployeeName(selectedEmpObj.name) : 'Not selected'}
                </span>
              </div>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Deadline</span>
                <span className="tm-summary-val">
                  {form.deadline || 'Not set'}{form.effort ? ` · ${form.effort}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="tm-form-footer" style={{ marginTop: 16 }}>
          <button type="button" className="tm-btn tm-btn-secondary" onClick={() => navigate('/TaskList')}>
            Cancel
          </button>
          <button type="submit" className="tm-btn tm-btn-primary" disabled={submitting}>
            {submitting
              ? <><span className="tm-spinner" /> {isEditing ? 'Updating…' : 'Creating…'}</>
              : <><FaSave size={12} /> {isEditing ? 'Update Task' : 'Create Task'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
