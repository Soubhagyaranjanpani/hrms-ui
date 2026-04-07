import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSearch, FaEdit, FaTrash, FaUserPlus, FaTimes,
  FaArrowLeft, FaSave, FaCheckCircle, FaTimesCircle,
  FaExclamationCircle
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import axios from 'axios';

/* ─── Validation Rules ─── */
const RULES = {
  name: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    patternMsg: 'Only letters, spaces, hyphens and apostrophes allowed'
  },
  email: {
    required: true,
    maxLen: 100,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMsg: 'Enter a valid email address'
  },
  password: {
    required: true,
    minLen: 6,
    maxLen: 32,
    pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
    patternMsg: 'Must contain at least one letter and one number'
  },
  phone: {
    required: false,
    minLen: 10,
    maxLen: 10,
    pattern: /^[6-9]\d{9}$/,
    patternMsg: 'Enter a valid 10-digit Indian mobile number'
  },
  address:      { required: false, maxLen: 200 },
  branchId:     { required: true },
  departmentId: { required: true },
  roleId:       { required: true },
  joiningDate:  { required: false }
};

const validate = (field, value, editMode = false) => {
  const r = RULES[field];
  if (!r) return '';
  if (field === 'password' && editMode) return '';

  const v = typeof value === 'string' ? value.trim() : String(value ?? '').trim();

  if (r.required && !v) return 'This field is required';
  if (!v && !r.required) return '';

  if (r.minLen && v.length < r.minLen) return `Minimum ${r.minLen} characters required`;
  if (r.maxLen && v.length > r.maxLen) return `Maximum ${r.maxLen} characters allowed`;
  if (r.pattern && !r.pattern.test(v)) return r.patternMsg;
  return '';
};

const validateAll = (formData, editMode) => {
  const errors = {};
  const fields = ['name', 'email', 'phone', 'address', 'branchId', 'departmentId', 'roleId', 'joiningDate'];
  if (!editMode) fields.push('password');
  fields.forEach(f => {
    const err = validate(f, formData[f], editMode);
    if (err) errors[f] = err;
  });
  return errors;
};

/* ─── Sub-components ─── */
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

/* ═══════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════ */
const Employees = ({ user }) => {
  const [view, setView]                 = useState('list');
  const [editMode, setEditMode]         = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);

  const [page, setPage]                 = useState(0);
  const [size]                          = useState(5);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchName, setSearchName]     = useState('');
  const [filterActive]                  = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    joiningDate: '', roleId: '', departmentId: '',
    branchId: '', address: '', profilePicture: ''
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const [branches, setBranches]           = useState([]);
  const [departments, setDepartments]     = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [roles, setRoles]                 = useState([]);
  const [loadingBranches, setLoadingBranches]       = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles]             = useState(false);

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig  = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  };

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchName); setPage(0); }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  /* ─── Fetch employees ─── */
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/api/employees?page=${page}&size=${size}`;
      if (debouncedSearch) url += `&name=${debouncedSearch}`;
      if (filterActive !== null) url += `&isActive=${filterActive}`;
      const res = await axios.get(url, axiosConfig);
      if (res.data?.status === 200 && res.data?.response) {
        setEmployees(res.data.response.content || []);
        setTotalPages(res.data.response.totalPages || 0);
        setTotalElements(res.data.response.totalElements || 0);
      } else { setEmployees([]); }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Failed to fetch employees');
      setEmployees([]);
    } finally { setLoading(false); }
  }, [page, size, debouncedSearch, filterActive]);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await axios.get(`${BASE_URL}/branches/list?flag=0`, axiosConfig);
      if (res.data?.status === 200) setBranches(res.data.response);
    } catch { toast.error('Error', 'Failed to fetch branches'); }
    finally { setLoadingBranches(false); }
  };

  const fetchAllDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const res = await axios.get(`${BASE_URL}/departments/list?flag=0`, axiosConfig);
      if (res.data?.status === 200) {
        setAllDepartments(res.data.response);
        setDepartments(res.data.response);
      }
    } catch { toast.error('Error', 'Failed to fetch departments'); }
    finally { setLoadingDepartments(false); }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await axios.get(`${BASE_URL}/roles/list?flag=0`, axiosConfig);
      if (res.data?.status === 200) setRoles(res.data.response);
    } catch { toast.error('Error', 'Failed to fetch roles'); }
    finally { setLoadingRoles(false); }
  };

  const filterDepartmentsByBranch = (branchId) => {
    if (!branchId) { setDepartments(allDepartments); return; }
    setDepartments(allDepartments.filter(d => d.branchId === parseInt(branchId)));
  };

  useEffect(() => {
    fetchEmployees(); fetchBranches(); fetchRoles(); fetchAllDepartments();
  }, []);
  useEffect(() => {
    if (view === 'list') fetchEmployees();
  }, [page, debouncedSearch, filterActive]);

  /* ─── Field handlers ─── */
  const handleChange = (field, value) => {
    if (field === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
    if (field === 'name' && /\d/.test(value)) return;

    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value, editMode) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(field, formData[field], editMode) }));
  };

  const handleBranchChange = (branchId) => {
    const updated = { ...formData, branchId, departmentId: '' };
    setFormData(updated);
    filterDepartmentsByBranch(branchId);
    if (touched.branchId)     setErrors(prev => ({ ...prev, branchId: validate('branchId', branchId) }));
    if (touched.departmentId) setErrors(prev => ({ ...prev, departmentId: 'This field is required' }));
  };

  /* ─── Submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['name','email','phone','password','branchId','departmentId','roleId','joiningDate','address'];
    setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    const errs = validateAll(formData, editMode);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      if (editMode) {
        const res = await axios.put(`${BASE_URL}/api/employees/${selectedEmployee.id}`, {
          name: formData.name.trim(), email: formData.email.trim(),
          phone: formData.phone, joiningDate: formData.joiningDate,
          roleId: parseInt(formData.roleId), departmentId: parseInt(formData.departmentId),
          branchId: parseInt(formData.branchId), address: formData.address.trim(),
          profilePicture: formData.profilePicture
        }, axiosConfig);
        if (res.data?.status === 200) {
          toast.success('Success', 'Employee updated successfully');
          resetForm(); setView('list'); fetchEmployees();
        } else { toast.error('Error', res.data?.message || 'Failed to update'); }
      } else {
        const res = await axios.post(`${BASE_URL}/api/employees/create`, {
          email: formData.email.trim(), password: formData.password,
          name: formData.name.trim(), phone: formData.phone,
          joiningDate: formData.joiningDate, roleId: parseInt(formData.roleId),
          departmentId: parseInt(formData.departmentId), branchId: parseInt(formData.branchId),
          address: formData.address.trim(), profilePicture: formData.profilePicture
        }, axiosConfig);
        if (res.data?.status === 200) {
          toast.success('Success', 'Employee created successfully');
          resetForm(); setView('list'); fetchEmployees();
        } else { toast.error('Error', res.data?.message || 'Failed to create'); }
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Something went wrong');
    } finally { setSubmitting(false); }
  };

  /* ─── Delete ─── */
  const confirmDelete = (emp) => { setEmployeeToDelete(emp); setShowDeleteModal(true); };
  const handleDelete  = async () => {
    if (!employeeToDelete) return;
    try {
      const res = await axios.delete(`${BASE_URL}/api/employees/${employeeToDelete.id}`, axiosConfig);
      if (res.data?.status === 200) {
        toast.success('Success', `${employeeToDelete.name} deleted`);
        setShowDeleteModal(false); setEmployeeToDelete(null); fetchEmployees();
      } else { toast.error('Error', res.data?.message || 'Failed to delete'); }
    } catch (err) { toast.error('Error', err.response?.data?.message || 'Failed to delete'); }
  };

  /* ─── Edit ─── */
  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    const fd = {
      name: emp.name || '', email: emp.email || '', password: '',
      phone: emp.phone || '', joiningDate: emp.joiningDate || '',
      roleId: '', departmentId: '', branchId: '',
      address: emp.address || '', profilePicture: emp.profilePicture || ''
    };
    if (emp.branchName) {
      const branch = branches.find(b => b.name === emp.branchName);
      if (branch) { fd.branchId = branch.id; filterDepartmentsByBranch(branch.id); }
    }
    if (emp.departmentName) {
      const dept = allDepartments.find(d => d.name === emp.departmentName);
      if (dept) fd.departmentId = dept.id;
    }
    if (emp.roleName) {
      const role = roles.find(r => r.name === emp.roleName);
      if (role) fd.roleId = role.id;
    }
    setFormData(fd); setErrors({}); setTouched({});
    setEditMode(true); setView('form');
  };

  const resetForm = () => {
    setFormData({ name:'',email:'',password:'',phone:'',joiningDate:'',roleId:'',departmentId:'',branchId:'',address:'',profilePicture:'' });
    setErrors({}); setTouched({});
    setEditMode(false); setSelectedEmployee(null);
  };

  /* ─── Helpers ─── */
  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  };

  const avatarColors = [
    { bg:'#ede9fe', color:'#5b21b6' }, { bg:'#fff0e8', color:'#c2410c' },
    { bg:'#d1fae5', color:'#065f46' }, { bg:'#fef3c7', color:'#92400e' },
    { bg:'#e0e7ff', color:'#3730a3' }, { bg:'#fce7f3', color:'#9d174d' },
  ];
  const getAvatarColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];

  const isFieldOk  = (f) => touched[f] && !errors[f] && (typeof formData[f] === 'string' ? formData[f].trim() : formData[f]);
  const isFieldErr = (f) => touched[f] && !!errors[f];

  /* ─── Pagination range with ellipsis ─── */
  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left  = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  if (loading && view === 'list' && employees.length === 0) {
    return <LoadingSpinner message="Loading employees..." />;
  }

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="emp-root">

      {/* ── Header ── */}
      <div className="emp-header" style={view === 'form' ? { justifyContent: 'space-between' } : {}}>
        {view === 'form' ? (
          // Form view: title on left, back button on right
          <>
            <div>
              <h1 className="emp-title">{editMode ? 'Edit Employee' : 'Add Employee'}</h1>
              <p className="emp-subtitle">{editMode ? 'Update employee information' : 'Enter new employee details'}</p>
            </div>
            <button className="emp-back-btn" onClick={() => { setView('list'); resetForm(); }}>
              <FaArrowLeft size={12} /> Back
            </button>
          </>
        ) : (
          // List view: original layout
          <>
            <div className="emp-header-left">
              <div>
                <h1 className="emp-title">Employee Directory</h1>
                <p className="emp-subtitle">{totalElements} total employees</p>
              </div>
            </div>
            <button className="emp-add-btn" onClick={() => { resetForm(); setView('form'); }}>
              <FaUserPlus size={13} /> Add Employee
            </button>
          </>
        )}
      </div>

      {/* ════════════ LIST VIEW ════════════ */}
      {view === 'list' ? (
        <>
          {/* Search */}
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by name…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              {searchName && (
                <button className="emp-search-clear" onClick={() => setSearchName('')}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="emp-table-card">
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th style={{ width:44 }}>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Branch</th>
                    <th>Joined</th>
                    <th style={{ width:80, textAlign:'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? employees.map((emp, idx) => {
                    const ac = getAvatarColor(emp.name);
                    const initials = `${emp.name?.charAt(0)||''}${emp.name?.split(' ')[1]?.charAt(0)||''}`.toUpperCase();
                    return (
                      <tr key={emp.id} className="emp-row">
                        <td className="emp-sno">{page * size + idx + 1}</td>
                        <td>
                          <div className="emp-info-cell">
                            <div className="emp-avatar" style={{ background:ac.bg, color:ac.color }}>
                              {initials}
                            </div>
                            <div>
                              <div className="emp-name">{emp.name}</div>
                              <div className="emp-email">{emp.email}</div>
                              {emp.phone && <div className="emp-phone">{emp.phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          {emp.departmentName
                            ? <span className="emp-pill emp-pill--indigo">{emp.departmentName}</span>
                            : <span className="emp-dash">—</span>}
                        </td>
                        <td>
                          {emp.roleName
                            ? <span className="emp-pill emp-pill--coral">{emp.roleName}</span>
                            : <span className="emp-dash">—</span>}
                        </td>
                        <td className="emp-branch">{emp.branchName || <span className="emp-dash">—</span>}</td>
                        <td className="emp-date">{formatDate(emp.joiningDate)}</td>
                        <td>
                          <div className="emp-actions">
                            <button className="emp-act emp-act--edit" onClick={() => handleEdit(emp)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="emp-act emp-act--del" onClick={() => confirmDelete(emp)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="7" className="emp-empty">
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon">👤</span>
                          <p>No employees found</p>
                          <small>Try a different search or add a new employee</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="emp-pagination">
                <span className="emp-page-info">
                  Showing {page * size + 1}–{Math.min((page + 1) * size, totalElements)} of {totalElements} employees
                </span>
                <div className="emp-page-controls">
                  <button
                    className="emp-page-btn"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Prev
                  </button>

                  {getPaginationRange().map((pg, i) =>
                    pg === '...'
                      ? <span key={`dots-${i}`} className="emp-page-dots">…</span>
                      : (
                        <button
                          key={pg}
                          className={`emp-page-num ${pg === page ? 'active' : ''}`}
                          onClick={() => setPage(pg)}
                        >
                          {pg + 1}
                        </button>
                      )
                  )}

                  <button
                    className="emp-page-btn"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (

        /* ════════════ FORM VIEW (unchanged except header) ════════════ */
        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit} noValidate>

            {/* Personal Information */}
            <div className="emp-form-section">
              <div className="emp-section-label">Personal Information</div>
              <div className="emp-form-grid">

                {/* Full Name */}
                <div className={`emp-field ${isFieldErr('name')?'has-error':''} ${isFieldOk('name')?'has-ok':''}`}>
                  <div className="emp-label-row">
                    <label>Full Name <span className="req">*</span></label>
                    <CharCount value={formData.name} max={50} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    maxLength={50}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                  />
                  <FieldError msg={errors.name} />
                  <small className="emp-hint-text">2–50 characters, letters only</small>
                </div>

                {/* Email */}
                <div className={`emp-field ${isFieldErr('email')?'has-error':''} ${isFieldOk('email')?'has-ok':''}`}>
                  <div className="emp-label-row">
                    <label>Email Address <span className="req">*</span></label>
                    <CharCount value={formData.email} max={100} />
                  </div>
                  <input
                    type="email"
                    placeholder="example@company.com"
                    value={formData.email}
                    maxLength={100}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    disabled={editMode}
                    style={editMode ? { opacity:0.6, cursor:'not-allowed' } : {}}
                  />
                  {editMode
                    ? <small className="emp-hint-text">Email cannot be changed after creation</small>
                    : <FieldError msg={errors.email} />
                  }
                </div>

                {/* Password — create only */}
                {!editMode && (
                  <div className={`emp-field ${isFieldErr('password')?'has-error':''} ${isFieldOk('password')?'has-ok':''}`}>
                    <div className="emp-label-row">
                      <label>Password <span className="req">*</span></label>
                      <CharCount value={formData.password} max={32} />
                    </div>
                    <input
                      type="password"
                      placeholder="Min 6 chars, letters + numbers"
                      value={formData.password}
                      maxLength={32}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                    />
                    <FieldError msg={errors.password} />
                    <small className="emp-hint-text">6–32 characters, must include a letter and a number</small>
                  </div>
                )}

                {/* Phone */}
                <div className={`emp-field ${isFieldErr('phone')?'has-error':''} ${isFieldOk('phone')?'has-ok':''}`}>
                  <div className="emp-label-row">
                    <label>Phone Number</label>
                    <span className="char-count" style={{ color: formData.phone.length === 10 ? '#10b981' : '#8b92b8' }}>
                      {formData.phone.length}/10
                    </span>
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    maxLength={10}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                  />
                  <FieldError msg={errors.phone} />
                  <small className="emp-hint-text">Indian mobile number starting with 6–9</small>
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            {/* Work Details */}
            <div className="emp-form-section">
              <div className="emp-section-label">Work Details</div>
              <div className="emp-form-grid">

                {/* Branch */}
                <div className={`emp-field ${isFieldErr('branchId')?'has-error':''} ${isFieldOk('branchId')?'has-ok':''}`}>
                  <label>Branch <span className="req">*</span></label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    onBlur={() => handleBlur('branchId')}
                    disabled={loadingBranches}
                  >
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <FieldError msg={errors.branchId} />
                </div>

                {/* Department */}
                <div className={`emp-field ${isFieldErr('departmentId')?'has-error':''} ${isFieldOk('departmentId')?'has-ok':''}`}>
                  <label>Department <span className="req">*</span></label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleChange('departmentId', e.target.value)}
                    onBlur={() => handleBlur('departmentId')}
                    disabled={!formData.branchId || loadingDepartments}
                  >
                    <option value="">{!formData.branchId ? 'Select branch first' : 'Select department'}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <FieldError msg={errors.departmentId} />
                </div>

                {/* Role */}
                <div className={`emp-field ${isFieldErr('roleId')?'has-error':''} ${isFieldOk('roleId')?'has-ok':''}`}>
                  <label>Role <span className="req">*</span></label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => handleChange('roleId', e.target.value)}
                    onBlur={() => handleBlur('roleId')}
                    disabled={loadingRoles}
                  >
                    <option value="">Select role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <FieldError msg={errors.roleId} />
                </div>

                {/* Joining Date */}
                <div className="emp-field">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleChange('joiningDate', e.target.value)}
                  />
                  <small className="emp-hint-text">Cannot be a future date</small>
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            {/* Address */}
            <div className="emp-form-section">
              <div className="emp-section-label">Additional Info</div>
              <div className={`emp-field ${isFieldErr('address')?'has-error':''}`} style={{ maxWidth:'100%' }}>
                <div className="emp-label-row">
                  <label>Address</label>
                  <CharCount value={formData.address} max={200} />
                </div>
                <textarea
                  rows={3}
                  placeholder="Enter address (optional)"
                  value={formData.address}
                  maxLength={200}
                  onChange={(e) => handleChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                />
                <FieldError msg={errors.address} />
              </div>
            </div>

            {/* Footer */}
            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting
                  ? <><span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</>
                  : <><FaSave size={12} /> {editMode ? 'Update Employee' : 'Create Employee'}</>
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && employeeToDelete && (
        <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon"><FaTrash size={18} /></div>
            <h3 className="emp-modal-title">Delete Employee</h3>
            <p className="emp-modal-body">
              You're about to permanently delete <strong>{employeeToDelete.name}</strong>.
            </p>
            <p className="emp-modal-warn">This action cannot be undone.</p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default Employees;