import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSave, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';
import { toast } from '../components/Toast';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import LoadingSpinner from '../components/LoadingSpinner';

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

const getUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; }
};

const PRIORITIES = [
  { code: 'LOW', display: 'Low' },
  { code: 'MEDIUM', display: 'Medium' },
  { code: 'HIGH', display: 'High' },
  { code: 'CRITICAL', display: 'Critical' }
];

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
  const location = useLocation();
  const currentUser = user || getUser();

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
  const [submitting, setSubmitting] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [branchRes, empRes, deptRes] = await Promise.all([
          fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }),
          fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=100`, { headers: getAuthHeaders() }),
          fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: getAuthHeaders() })
        ]);
        const branchData = await branchRes.json();
        const empData = await empRes.json();
        const deptData = await deptRes.json();

        setBranches(extractArray(branchData));
        setEmployees(extractArray(empData));
        setDepartments(extractArray(deptData));
        setDataLoaded(true);
      } catch (err) {
        console.error('Dropdown fetch error:', err);
        toast.error('Load Error', err.message || 'Could not load form data');
      } finally {
        setLoadingDrops(false);
      }
    };
    fetchDropdowns();
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
      if (taskToEdit.branchId) branchId = String(taskToEdit.branchId);
      else if (taskToEdit.branchName && branches.length) {
        const found = branches.find(b => b.name === taskToEdit.branchName);
        if (found) branchId = String(found.id);
      }

      let deptId = '';
      if (taskToEdit.departmentId) deptId = String(taskToEdit.departmentId);
      else if (taskToEdit.departmentName && departments.length) {
        const found = departments.find(d => d.name === taskToEdit.departmentName);
        if (found) deptId = String(found.id);
      }

      let assigneeId = '';
      if (taskToEdit.assignedToId) assigneeId = String(taskToEdit.assignedToId);
      else if (taskToEdit.assignedTo && employees.length) {
        const found = employees.find(e =>
          cleanEmployeeName(e.name) === cleanEmployeeName(taskToEdit.assignedTo)
        );
        if (found) assigneeId = String(found.id);
      }

      setForm({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        assignee: assigneeId,
        branch: branchId,
        dept: deptId,
        priority: priority,
        deadline: formattedDeadline,
        effort: taskToEdit.effort || taskToEdit.effortEstimate || '',
        tags: taskToEdit.tags || '',
        note: taskToEdit.note || '',
      });
    }
  }, [isEditing, taskToEdit, dataLoaded, branches, departments, employees]);

  // Filter departments based on branch
  useEffect(() => {
    if (form.branch && departments.length) {
      setFilteredDepts(departments.filter(d => d.branchId === parseInt(form.branch)));
    } else setFilteredDepts([]);
  }, [form.branch, departments]);

  // Filter employees based on branch and department
  useEffect(() => {
    if (!employees.length) {
      setFilteredEmployees([]);
      return;
    }
    let filtered = [...employees];
    if (form.branch) {
      const branchObj = branches.find(b => b.id === parseInt(form.branch));
      if (branchObj) filtered = filtered.filter(emp => emp.branchName === branchObj.name);
    }
    if (form.dept) {
      const deptObj = departments.find(d => d.id === parseInt(form.dept));
      if (deptObj) filtered = filtered.filter(emp => emp.departmentName === deptObj.name);
    }
    setFilteredEmployees(filtered);
  }, [employees, form.branch, form.dept, branches, departments]);

  const validateField = (field, value) => {
    if (!value && ['title', 'assignee', 'branch', 'dept', 'deadline'].includes(field))
      return 'This field is required';
    if (field === 'title' && value && value.trim().length < 3)
      return 'Minimum 3 characters required';
    if (field === 'title' && value && value.trim().length > 100)
      return 'Maximum 100 characters allowed';
    if (field === 'deadline' && value) {
      const selected = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) return 'Deadline cannot be in the past';
    }
    return '';
  };

  const handleChange = (field, value) => {
    if (field === 'title' && value.length > 100) return;
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      if (field === 'branch') { newForm.dept = ''; newForm.assignee = ''; }
      if (field === 'dept') newForm.assignee = '';
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
  const getPriorityColor = (code) => ({ LOW: '#10b981', MEDIUM: '#3b82f6', HIGH: '#f59e0b', CRITICAL: '#ef4444' }[code] || '#6b7280');

  if (loadingDrops) return <LoadingSpinner message="Loading form data…" />;

  return (
    <div className="emp-root">
      {/* Header like Branch page */}
      <div className="emp-header" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 className="emp-title">{isEditing ? 'Edit Task' : 'Create New Task'}</h1>
          <p className="emp-subtitle">
            {isEditing ? 'Update the task details below' : 'Fill in the details below to submit a task'}
          </p>
        </div>
        <button className="emp-back-btn" onClick={() => navigate('/TaskList')}>
          <FaArrowLeft size={12} /> Back
        </button>
      </div>

      <div className="emp-form-wrap">
        <form onSubmit={handleSubmit} noValidate className="emp-form-compact">

          {/* Task Information Section */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Task Information</div>
            <div className="emp-form-grid-3col">

              {/* Task Title (full width? but we keep 3-col, let title span 3 cols?) */}
              <div className={`emp-field-compact ${isFieldErr('title') ? 'has-error' : ''} ${isFieldOk('title') ? 'has-ok' : ''}`} style={{ gridColumn: 'span 3' }}>
                <div className="task-label-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                <small className="task-hint-text" style={{ fontSize: 11, color: 'var(--text-muted)' }}>3–100 characters, descriptive title</small>
              </div>

              {/* Description (full width) */}
              <div className="emp-field-compact" style={{ gridColumn: 'span 3' }}>
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the task — goals, requirements, acceptance criteria…"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                <small className="task-hint-text" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Optional, but recommended</small>
              </div>
            </div>
          </div>

          {/* Assignment & Details Section */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Assignment & Details</div>
            <div className="emp-form-grid-3col">

              {/* Branch */}
              <div className={`emp-field-compact ${isFieldErr('branch') ? 'has-error' : ''}`}>
                <label>Branch <span className="req">*</span></label>
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

              {/* Department */}
              <div className={`emp-field-compact ${isFieldErr('dept') ? 'has-error' : ''}`}>
                <label>Department <span className="req">*</span></label>
                <select
                  value={form.dept}
                  onChange={(e) => handleChange('dept', e.target.value)}
                  onBlur={() => handleBlur('dept')}
                  disabled={!form.branch || filteredDepts.length === 0}
                >
                  <option value="">
                    {!form.branch ? 'Select branch first' :
                     filteredDepts.length === 0 ? 'No departments' : 'Select department'}
                  </option>
                  {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <FieldError msg={errors.dept} />
                {!form.branch && <small style={{ fontSize: 10, color: 'var(--text-muted)' }}>Select branch first</small>}
              </div>

              {/* Assignee */}
              <div className={`emp-field-compact ${isFieldErr('assignee') ? 'has-error' : ''}`}>
                <label>Assign To <span className="req">*</span></label>
                <select
                  value={form.assignee}
                  onChange={(e) => handleChange('assignee', e.target.value)}
                  onBlur={() => handleBlur('assignee')}
                  disabled={!form.branch || !form.dept || filteredEmployees.length === 0}
                >
                  <option value="">
                    {!form.branch || !form.dept ? 'Select branch & dept first' :
                     filteredEmployees.length === 0 ? 'No employees' : 'Select assignee'}
                  </option>
                  {filteredEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {cleanEmployeeName(emp.name)} {emp.roleName ? `· ${emp.roleName}` : ''}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.assignee} />
                {(!form.branch || !form.dept) && <small style={{ fontSize: 10, color: 'var(--text-muted)' }}>Select branch and department first</small>}
              </div>

              {/* Priority */}
              <div className="emp-field-compact">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  style={{ borderColor: getPriorityColor(form.priority), fontWeight: 500 }}
                >
                  {PRIORITIES.map(p => <option key={p.code} value={p.code}>{p.display}</option>)}
                </select>
              </div>

              {/* Deadline */}
              <div className={`emp-field-compact ${isFieldErr('deadline') ? 'has-error' : ''}`}>
                <label>Deadline <span className="req">*</span></label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  onBlur={() => handleBlur('deadline')}
                  min={new Date().toISOString().split('T')[0]}
                />
                <FieldError msg={errors.deadline} />
              </div>

              {/* Effort Estimate */}
              <div className="emp-field-compact">
                <label>Estimated Effort</label>
                <input
                  type="text"
                  placeholder="e.g., 3 days, 8 hours"
                  value={form.effort}
                  onChange={(e) => handleChange('effort', e.target.value)}
                />
                <small style={{ fontSize: 10, color: 'var(--text-muted)' }}>Optional</small>
              </div>

              {/* Tags */}
              <div className="emp-field-compact">
                <label>Tags</label>
                <input
                  type="text"
                  placeholder="e.g., Frontend, UX, Bug"
                  value={form.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                />
                <small style={{ fontSize: 10, color: 'var(--text-muted)' }}>Comma‑separated</small>
              </div>
            </div>
          </div>

          {/* Additional Notes Section */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Additional Notes</div>
            <div className="emp-field-compact" style={{ gridColumn: 'span 3' }}>
              <textarea
                rows={2}
                placeholder="Any special instructions, references, or context for the assignee…"
                value={form.note}
                onChange={(e) => handleChange('note', e.target.value)}
              />
              <small style={{ fontSize: 10, color: 'var(--text-muted)' }}>Visible to the assignee</small>
            </div>
          </div>

          {/* Form Actions */}
          <div className="emp-form-actions">
            <button type="button" className="emp-cancel-btn" onClick={() => navigate('/TaskList')}>
              Cancel
            </button>
            <button type="submit" className="emp-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {submitting
                ? <><span className="emp-spinner" /> {isEditing ? 'Updating…' : 'Creating…'}</>
                : <><FaSave size={12} /> {isEditing ? 'Update Task' : 'Create Task'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}