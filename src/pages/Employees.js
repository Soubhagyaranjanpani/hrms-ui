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
  address: { required: false, maxLen: 200 },
  branchId: { required: true },
  departmentId: { required: true },
  roleId: { required: true },
  gradeId: { required: false },
  joiningDate: { required: false },
  bankAccount: { required: false, pattern: /^\d{9,18}$/, patternMsg: '9-18 digits only' },
  uan: { required: false, pattern: /^\d{12}$/, patternMsg: '12 digits required' },
  pan: { required: false, pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, patternMsg: 'Format: ABCDE1234F' }
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
  const fields = ['name', 'email', 'phone', 'address', 'branchId', 'departmentId', 'roleId', 'gradeId', 'joiningDate', 'bankAccount', 'uan', 'pan'];
  if (!editMode) fields.push('password');
  fields.forEach(f => {
    const err = validate(f, formData[f], editMode);
    if (err) errors[f] = err;
  });
  return errors;
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const Employees = ({ user }) => {
  const [view, setView] = useState('list');
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchName, setSearchName] = useState('');
  const [filterActive] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    joiningDate: '', roleId: '', departmentId: '',
    branchId: '', gradeId: '', address: '', profilePicture: '', bankAccount: '',
    uan: '', pan: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchName); setPage(0); }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/api/employees?page=${page}&size=${size}`;
      if (debouncedSearch) url += `&name=${debouncedSearch}`;
      if (filterActive !== null) url += `&isActive=${filterActive}`;
      const res = await axios.get(url, axiosConfig);
      if (res.data?.status === 200 && res.data?.response) {
        const cleanedEmployees = (res.data.response.content || []).map(emp => ({
          ...emp,
          name: cleanName(emp.name)
        }));
        setEmployees(cleanedEmployees);
        setTotalPages(res.data.response.totalPages || 0);
        setTotalElements(res.data.response.totalElements || 0);
      } else { setEmployees([]); }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Failed to fetch employees');
      setEmployees([]);
    } finally { setLoading(false); }
  }, [page, size, debouncedSearch, filterActive]);

  const cleanName = (name) => {
    if (!name) return '';
    let cleaned = name.replace(/\s+null\s*/gi, ' ').replace(/\s+null$/i, '');
    cleaned = cleaned.replace(/^null\s+/i, '');
    cleaned = cleaned.trim();
    return cleaned || name;
  };

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

  const fetchGrades = async () => {
    setLoadingGrades(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/grades`, axiosConfig);
      if (res.data?.status === 200) setGrades(res.data.response || []);
    } catch { toast.error('Error', 'Failed to fetch grades'); }
    finally { setLoadingGrades(false); }
  };

  const filterDepartmentsByBranch = (branchId) => {
    if (!branchId) { setDepartments(allDepartments); return; }
    setDepartments(allDepartments.filter(d => d.branchId === parseInt(branchId)));
  };

  useEffect(() => {
    fetchEmployees(); fetchBranches(); fetchRoles(); fetchAllDepartments(); fetchGrades();
  }, []);
  useEffect(() => {
    if (view === 'list') fetchEmployees();
  }, [page, debouncedSearch, filterActive]);

  const handleChange = (field, value) => {
    if (field === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
    if (field === 'name' && /\d/.test(value)) return;
    if (field === 'pan') value = value.toUpperCase();

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
    if (touched.branchId) setErrors(prev => ({ ...prev, branchId: validate('branchId', branchId) }));
    if (touched.departmentId) setErrors(prev => ({ ...prev, departmentId: 'This field is required' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allFields = [
      'name', 'email', 'phone', 'password',
      'branchId', 'departmentId', 'roleId', 'gradeId',
      'joiningDate', 'address',
      'bankAccount', 'uan', 'pan'
    ];

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
        const res = await axios.put(
          `${BASE_URL}/api/employees/${selectedEmployee.id}`,
          {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone,
            joiningDate: formData.joiningDate,
            roleId: parseInt(formData.roleId),
            departmentId: parseInt(formData.departmentId),
            branchId: parseInt(formData.branchId),
            gradeId: formData.gradeId ? parseInt(formData.gradeId) : null,
            address: formData.address.trim(),
            profilePicture: formData.profilePicture,
            bankAccount: formData.bankAccount,
            uan: formData.uan,
            pan: formData.pan
          },
          axiosConfig
        );

        if (res.data?.status === 200) {
          toast.success('Success', 'Employee updated successfully');
          resetForm();
          setView('list');
          fetchEmployees();
        } else {
          toast.error('Error', res.data?.message || 'Failed to update');
        }

      } else {
        const res = await axios.post(
          `${BASE_URL}/api/employees/create`,
          {
            email: formData.email.trim(),
            password: formData.password,
            name: formData.name.trim(),
            phone: formData.phone,
            joiningDate: formData.joiningDate,
            roleId: parseInt(formData.roleId),
            departmentId: parseInt(formData.departmentId),
            branchId: parseInt(formData.branchId),
            gradeId: formData.gradeId ? parseInt(formData.gradeId) : null,
            address: formData.address.trim(),
            profilePicture: formData.profilePicture,
            bankAccount: formData.bankAccount,
            uan: formData.uan,
            pan: formData.pan
          },
          axiosConfig
        );

        if (res.data?.status === 200) {
          toast.success('Success', 'Employee created successfully');
          resetForm();
          setView('list');
          fetchEmployees();
        } else {
          toast.error('Error', res.data?.message || 'Failed to create');
        }
      }

    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (emp) => { setEmployeeToDelete(emp); setShowDeleteModal(true); };
  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      const res = await axios.delete(`${BASE_URL}/api/employees/${employeeToDelete.id}`, axiosConfig);
      if (res.data?.status === 200) {
        toast.success('Success', `${employeeToDelete.name} deleted`);
        setShowDeleteModal(false); setEmployeeToDelete(null); fetchEmployees();
      } else { toast.error('Error', res.data?.message || 'Failed to delete'); }
    } catch (err) { toast.error('Error', err.response?.data?.message || 'Failed to delete'); }
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    const fd = {
      name: cleanName(emp.name || ''), email: emp.email || '', password: '',
      phone: emp.phone || '', joiningDate: emp.joiningDate || '',
      roleId: '', departmentId: '', branchId: '', gradeId: '',
      address: emp.address || '', profilePicture: emp.profilePicture || '',
      bankAccount: emp.bankAccount || '', uan: emp.uan || '', pan: emp.pan || ''
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
    if (emp.gradeId) {
      fd.gradeId = emp.gradeId;
    }
    setFormData(fd); setErrors({}); setTouched({});
    setEditMode(true); setView('form');
  };

  const resetForm = () => {
    setFormData({ 
      name: '', email: '', password: '', phone: '', 
      joiningDate: '', roleId: '', departmentId: '', 
      branchId: '', gradeId: '', address: '', 
      profilePicture: '', bankAccount: '', uan: '', pan: '' 
    });
    setErrors({}); setTouched({});
    setEditMode(false); setSelectedEmployee(null);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const cleanedName = cleanName(fullName);
    const nameParts = cleanedName.trim().split(/\s+/);
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    const firstInitial = nameParts[0].charAt(0);
    const lastInitial = nameParts[nameParts.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };

  const avatarColors = [
    { bg: '#ede9fe', color: '#5b21b6' }, { bg: '#fff0e8', color: '#c2410c' },
    { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef3c7', color: '#92400e' },
    { bg: '#e0e7ff', color: '#3730a3' }, { bg: '#fce7f3', color: '#9d174d' },
  ];
  const getAvatarColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];

  const isFieldOk = (f) => touched[f] && !errors[f] && (typeof formData[f] === 'string' ? formData[f].trim() : formData[f]);
  const isFieldErr = (f) => touched[f] && !!errors[f];

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  if (loading && view === 'list' && employees.length === 0) {
    return <LoadingSpinner message="Loading employees..." />;
  }

  return (
    <div className="emp-root">
      <div className="emp-header" style={{ justifyContent: view !== 'list' ? 'space-between' : 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {view !== 'list' ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? 'Edit Employee' : 'Add Employee'}</h1>
              <p className="emp-subtitle">{editMode ? 'Update employee information' : 'Enter new employee details'}</p>
            </div>
            <button className="emp-back-btn" onClick={() => { setView('list'); resetForm(); }}>
              <FaArrowLeft size={12} /> Back to List
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 className="emp-title">Employee Directory</h1>
              <p className="emp-subtitle">{totalElements} total employees</p>
            </div>
            <button className="emp-add-btn" onClick={() => { resetForm(); setView('form'); }}>
              <FaUserPlus size={13} /> Add Employee
            </button>
          </>
        )}
      </div>

      {view === 'list' ? (
        <>
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

          <div className="emp-table-card">
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Branch</th>
                    <th>Joined</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? employees.map((emp, idx) => {
                    const cleanedName = cleanName(emp.name);
                    const ac = getAvatarColor(cleanedName);
                    const initials = getInitials(cleanedName);
                    return (
                      <tr key={emp.id} className="emp-row">
                        <td className="emp-sno">{page * size + idx + 1}</td>
                        <td>
                          <div className="emp-info-cell">
                            <div className="emp-avatar" style={{ background: ac.bg, color: ac.color }}>
                              {initials}
                            </div>
                            <div>
                              <div className="emp-name">{cleanedName || '—'}</div>
                              <div className="emp-email">{emp.email}</div>
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
        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit} className="emp-form-compact">
            {/* Personal Information */}
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Personal Information</div>
              <div className="emp-form-grid-3col">
                <div className={`emp-field-compact ${isFieldErr('name') ? 'has-error' : ''} ${isFieldOk('name') ? 'has-ok' : ''}`}>
                  <label className="required">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    maxLength={50}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                  />
                  <FieldError msg={errors.name} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('email') ? 'has-error' : ''} ${isFieldOk('email') ? 'has-ok' : ''}`}>
                  <label className="required">Email</label>
                  <input
                    type="email"
                    placeholder="example@company.com"
                    value={formData.email}
                    maxLength={100}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    disabled={editMode}
                  />
                  <FieldError msg={errors.email} />
                </div>

                {!editMode && (
                  <div className={`emp-field-compact ${isFieldErr('password') ? 'has-error' : ''} ${isFieldOk('password') ? 'has-ok' : ''}`}>
                    <label className="required">Password</label>
                    <input
                      type="password"
                      placeholder="Min 6 chars, letters + numbers"
                      value={formData.password}
                      maxLength={32}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                    />
                    <FieldError msg={errors.password} />
                  </div>
                )}

                <div className={`emp-field-compact ${isFieldErr('phone') ? 'has-error' : ''} ${isFieldOk('phone') ? 'has-ok' : ''}`}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    maxLength={10}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                  />
                  <FieldError msg={errors.phone} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('bankAccount') ? 'has-error' : ''} ${isFieldOk('bankAccount') ? 'has-ok' : ''}`}>
                  <label>Bank Account</label>
                  <input
                    type="text"
                    placeholder="Account number"
                    value={formData.bankAccount}
                    maxLength={20}
                    onChange={(e) => handleChange('bankAccount', e.target.value)}
                    onBlur={() => handleBlur('bankAccount')}
                  />
                  <FieldError msg={errors.bankAccount} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('uan') ? 'has-error' : ''} ${isFieldOk('uan') ? 'has-ok' : ''}`}>
                  <label>UAN</label>
                  <input
                    type="text"
                    placeholder="12-digit UAN"
                    value={formData.uan}
                    maxLength={12}
                    onChange={(e) => handleChange('uan', e.target.value)}
                    onBlur={() => handleBlur('uan')}
                  />
                  <FieldError msg={errors.uan} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('pan') ? 'has-error' : ''} ${isFieldOk('pan') ? 'has-ok' : ''}`}>
                  <label>PAN</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    maxLength={10}
                    onChange={(e) => handleChange('pan', e.target.value)}
                    onBlur={() => handleBlur('pan')}
                  />
                  <FieldError msg={errors.pan} />
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            {/* Work Details */}
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Work Details</div>
              <div className="emp-form-grid-3col">
                <div className={`emp-field-compact ${isFieldErr('branchId') ? 'has-error' : ''} ${isFieldOk('branchId') ? 'has-ok' : ''}`}>
                  <label className="required">Branch</label>
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

                <div className={`emp-field-compact ${isFieldErr('departmentId') ? 'has-error' : ''} ${isFieldOk('departmentId') ? 'has-ok' : ''}`}>
                  <label className="required">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleChange('departmentId', e.target.value)}
                    onBlur={() => handleBlur('departmentId')}
                  >
                    <option value="">{!formData.branchId ? 'Select branch first' : 'Select department'}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <FieldError msg={errors.departmentId} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('roleId') ? 'has-error' : ''} ${isFieldOk('roleId') ? 'has-ok' : ''}`}>
                  <label className="required">Role</label>
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

                <div className={`emp-field-compact ${isFieldErr('gradeId') ? 'has-error' : ''} ${isFieldOk('gradeId') ? 'has-ok' : ''}`}>
                  <label>Grade</label>
                  <select
                    value={formData.gradeId}
                    onChange={(e) => handleChange('gradeId', e.target.value)}
                    onBlur={() => handleBlur('gradeId')}
                    disabled={loadingGrades}
                  >
                    <option value="">Select grade (optional)</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <FieldError msg={errors.gradeId} />
                </div>

                <div className="emp-field-compact">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleChange('joiningDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            {/* Address */}
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Address (Optional)</div>
              <div className={`emp-field-compact ${isFieldErr('address') ? 'has-error' : ''} ${isFieldOk('address') ? 'has-ok' : ''}`} style={{ gridColumn: 'span 3' }}>
                <textarea
                  rows={2}
                  placeholder="Enter address"
                  value={formData.address}
                  maxLength={200}
                  onChange={(e) => handleChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                />
                <FieldError msg={errors.address} />
              </div>
            </div>

            <div className="emp-form-actions">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="emp-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting
                  ? <><span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</>
                  : <><FaSave size={12} /> {editMode ? 'Update Employee' : 'Create Employee'}</>
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && employeeToDelete && (
        <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon"><FaTrash size={18} /></div>
            <h3 className="emp-modal-title">Delete Employee</h3>
            <p className="emp-modal-body">
              You're about to permanently delete <strong>{cleanName(employeeToDelete.name)}</strong>.
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