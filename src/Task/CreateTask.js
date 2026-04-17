import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSave, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';
import { toast } from '../components/Toast';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import LoadingSpinner from '../components/LoadingSpinner';

// Helper to extract array from various API response formats
const extractArray = (data) => {
  if (data?.response && Array.isArray(data.response)) {
    return data.response;
  }
  if (data?.response?.content && Array.isArray(data.response.content)) {
    return data.response.content;
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  if (data?.data?.content && Array.isArray(data.data.content)) {
    return data.data.content;
  }
  if (data?.content && Array.isArray(data.content)) {
    return data.content;
  }

  console.warn('Unexpected data format:', data);
  return [];
};

// Helper to clean employee name (remove "null")
const cleanEmployeeName = (name) => {
  if (!name) return '';
  return name.replace(/\s+null\s*/gi, '').trim();
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {};
  } catch {
    return {};
  }
};

// Priority Enum matching backend
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

  // Get edit data from navigation state
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

  // Fetch all dropdown data first
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        console.log('Fetching branches from:', API_ENDPOINTS.GET_ACTIVE_BRANCHES);
        console.log('Fetching employees from:', `${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=100`);

        const [branchRes, empRes, deptRes] = await Promise.all([
          fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }),
          fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=100`, { headers: getAuthHeaders() }),
          fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: getAuthHeaders() })
        ]);

        const branchData = await branchRes.json();
        const empData = await empRes.json();
        const deptData = await deptRes.json();

        console.log('Branch Data:', branchData);
        console.log('Employee Data:', empData);
        console.log('Department Data:', deptData);

        const branchArray = extractArray(branchData);
        const employeeArray = extractArray(empData);
        const deptArray = extractArray(deptData);

        console.log('Extracted Branches:', branchArray);
        console.log('Extracted Employees:', employeeArray);
        console.log('Extracted Departments:', deptArray);

        setBranches(branchArray);
        setEmployees(employeeArray);
        setDepartments(deptArray);
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

  // Pre-fill form when editing and data is loaded
  useEffect(() => {
    if (isEditing && taskToEdit && dataLoaded) {
      console.log('Editing task with full data:', taskToEdit);
      
      // Format date from ISO string to YYYY-MM-DD
      let formattedDeadline = '';
      if (taskToEdit.dueDate) {
        const date = new Date(taskToEdit.dueDate);
        formattedDeadline = date.toISOString().split('T')[0];
      }

      // Get priority - handle both uppercase and title case
      let priority = 'MEDIUM';
      if (taskToEdit.priority) {
        const upperPriority = taskToEdit.priority.toUpperCase();
        if (PRIORITIES.some(p => p.code === upperPriority)) {
          priority = upperPriority;
        }
      }

      // Find branch ID from branch name or use existing branchId
      let branchId = '';
      if (taskToEdit.branchId) {
        branchId = String(taskToEdit.branchId);
      } else if (taskToEdit.branchName && branches.length > 0) {
        const foundBranch = branches.find(b => b.name === taskToEdit.branchName);
        if (foundBranch) branchId = String(foundBranch.id);
      }

      // Find department ID
      let deptId = '';
      if (taskToEdit.departmentId) {
        deptId = String(taskToEdit.departmentId);
      } else if (taskToEdit.departmentName && departments.length > 0) {
        const foundDept = departments.find(d => d.name === taskToEdit.departmentName);
        if (foundDept) deptId = String(foundDept.id);
      }

      // Find assignee ID
      let assigneeId = '';
      if (taskToEdit.assignedToId) {
        assigneeId = String(taskToEdit.assignedToId);
      } else if (taskToEdit.assignedTo && employees.length > 0) {
        const foundEmp = employees.find(e => 
          cleanEmployeeName(e.name) === cleanEmployeeName(taskToEdit.assignedTo)
        );
        if (foundEmp) assigneeId = String(foundEmp.id);
      }

      const newForm = {
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
      };

      console.log('Setting form with:', newForm);
      setForm(newForm);
    }
  }, [isEditing, taskToEdit, dataLoaded, branches, departments, employees]);

  // Filter departments based on selected branch
  useEffect(() => {
    if (form.branch && departments.length > 0) {
      const branchId = parseInt(form.branch);
      const filtered = departments.filter(
        dept => dept.branchId === branchId
      );
      console.log(`Filtered departments for branch ${branchId}:`, filtered);
      setFilteredDepts(filtered);
    } else {
      setFilteredDepts([]);
    }
  }, [form.branch, departments]);

  // Filter employees based on selected branch and department
  useEffect(() => {
    if (employees.length > 0) {
      let filtered = [...employees];

      // Filter by branch if selected
      if (form.branch) {
        const branchId = parseInt(form.branch);
        const selectedBranch = branches.find(b => b.id === branchId);
        if (selectedBranch) {
          filtered = filtered.filter(emp =>
            emp.branchName === selectedBranch.name
          );
        }
      }

      // Filter by department if selected
      if (form.dept) {
        const deptId = parseInt(form.dept);
        const selectedDept = departments.find(d => d.id === deptId);
        if (selectedDept) {
          filtered = filtered.filter(emp =>
            emp.departmentName === selectedDept.name
          );
        }
      }

      console.log('Filtered employees:', filtered);
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  }, [employees, form.branch, form.dept, branches, departments]);

  const validateField = (field, value) => {
    if (!value && ['title', 'assignee', 'branch', 'dept', 'deadline'].includes(field))
      return 'This field is required';
    if (field === 'title' && value && value.trim().length < 3)
      return 'Minimum 3 characters required';
    if (field === 'title' && value && value.trim().length > 100)
      return 'Maximum 100 characters allowed';
    if (field === 'deadline' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return 'Deadline cannot be in the past';
      }
    }
    return '';
  };

  const handleChange = (field, value) => {
    if (field === 'title' && value.length > 100) return;
    
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Reset dependent fields when branch changes
      if (field === 'branch') {
        newForm.dept = '';
        newForm.assignee = '';
      }
      
      // Reset assignee when department changes
      if (field === 'dept') {
        newForm.assignee = '';
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
    if (Object.keys(errs).length > 0) {
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

    console.log('Submitting payload:', payload);

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

      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} task`);
      }

      toast.success(
        isEditing ? 'Task Updated' : 'Task Created', 
        `"${form.title}" has been ${isEditing ? 'updated' : 'submitted'} successfully`
      );
      
      // Navigate back to task list
      navigate('/TaskList');

    } catch (err) {
      console.error('Task operation error:', err);
      toast.error('Error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const isFieldErr = (f) => touched[f] && !!errors[f];
  const isFieldOk = (f) => touched[f] && !errors[f] && form[f];

  const getPriorityColor = (priorityCode) => {
    const colors = {
      'LOW': '#10b981',
      'MEDIUM': '#3b82f6',
      'HIGH': '#f59e0b',
      'CRITICAL': '#ef4444'
    };
    return colors[priorityCode] || '#6b7280';
  };

  if (loadingDrops) return <LoadingSpinner message="Loading form data…" />;

  return (
    <div className="task-root">
      <div className="task-header">
        <div className="task-header-left">
          <button 
            onClick={() => navigate('/TaskList')} 
            style={{ 
              background: 'var(--bg-surface)', 
              border: '1.5px solid var(--border-medium)', 
              color: 'var(--text-secondary)', 
              padding: '8px 14px', 
              borderRadius: 10, 
              fontSize: 13, 
              fontWeight: 500, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              marginRight: 12
            }}
          >
            <FaArrowLeft size={11} /> Back
          </button>
          <div>
            <h1 className="task-title">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h1>
            <p className="task-subtitle">
              {isEditing ? 'Update the task details below' : 'Fill in the details below to submit a task'}
            </p>
          </div>
        </div>
      </div>

      <div className="task-form-wrap">
        <form onSubmit={handleSubmit} noValidate>

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

          <div className="task-form-section">
            <div className="task-section-label">Assignment & Details</div>
            <div className="task-form-grid two-col">

              <div className={`task-field ${isFieldErr('branch') ? 'has-error' : ''}`}>
                <label>Branch <span className="req">*</span></label>
                <select
                  value={form.branch}
                  onChange={(e) => handleChange('branch', e.target.value)}
                  onBlur={() => handleBlur('branch')}
                >
                  <option value="">Select branch</option>
                  {branches.length > 0 ? (
                    branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} 
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No branches available</option>
                  )}
                </select>
                <FieldError msg={errors.branch} />
              </div>

              <div className={`task-field ${isFieldErr('dept') ? 'has-error' : ''}`}>
                <label>Department <span className="req">*</span></label>
                <select
                  value={form.dept}
                  onChange={(e) => handleChange('dept', e.target.value)}
                  onBlur={() => handleBlur('dept')}
                  disabled={!form.branch || filteredDepts.length === 0}
                >
                  <option value="">
                    {!form.branch ? 'Select branch first' :
                      filteredDepts.length === 0 ? 'No departments available' :
                        'Select department'}
                  </option>
                  {filteredDepts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.dept} />
                {!form.branch && (
                  <small className="task-hint-text">Please select a branch first</small>
                )}
              </div>

              <div className={`task-field ${isFieldErr('assignee') ? 'has-error' : ''}`}>
                <label>Assign To <span className="req">*</span></label>
                <select
                  value={form.assignee}
                  onChange={(e) => handleChange('assignee', e.target.value)}
                  onBlur={() => handleBlur('assignee')}
                  disabled={!form.branch || !form.dept || filteredEmployees.length === 0}
                >
                  <option value="">
                    {!form.branch || !form.dept ? 'Select branch and department first' :
                      filteredEmployees.length === 0 ? 'No employees available' :
                        'Select assignee'}
                  </option>
                  {filteredEmployees.map(m => {
                    const cleanName = cleanEmployeeName(m.name);
                    return (
                      <option key={m.id} value={m.id}>
                        {cleanName} {m.roleName ? `· ${m.roleName}` : ''}
                      </option>
                    );
                  })}
                </select>
                <FieldError msg={errors.assignee} />
                {(!form.branch || !form.dept) && (
                  <small className="task-hint-text">Please select branch and department first</small>
                )}
              </div>

              <div className="task-field">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  style={{
                    borderColor: getPriorityColor(form.priority),
                    fontWeight: '500'
                  }}
                >
                  {PRIORITIES.map(p => (
                    <option key={p.code} value={p.code}>
                      {p.display}
                    </option>
                  ))}
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

          <div className="task-form-footer">
            <button
              type="button"
              className="task-cancel-footer-btn"
              onClick={() => navigate('/TaskList')}
            >
              Cancel
            </button>
            <button type="submit" className="task-submit-btn" disabled={submitting}>
              {submitting
                ? <><span className="task-spinner" /> {isEditing ? 'Updating...' : 'Creating...'}</>
                : <><FaSave size={12} /> {isEditing ? 'Update Task' : 'Create Task'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}