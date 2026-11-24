import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaEdit,
  FaArrowLeft, FaChevronDown,
  FaTimesCircle, FaUser, FaUserTie
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../../components/Toast';
import { BASE_URL, STORAGE_KEYS } from '../../config/api.config';

// ============================================
// TOAST NOTIFICATION (fallback helper, unused but kept)
// ============================================
const showToast = (type, title, message) => {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const el = document.createElement('div');
  const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:${colors[type] || '#3b82f6'};color:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:300px;margin-bottom:8px;">
      <span style="font-weight:600;">${title}</span>
      <span style="flex:1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">×</button>
    </div>`;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 4000);
};

const createToastContainer = () => {
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:500px;';
  document.body.appendChild(c);
  return c;
};

const InterviewPanelMaster = () => {
  // ============================================
  // STATE
  // ============================================
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]); // ✅ single source

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, name: '', newStatus: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Dropdown states
  const departmentRef = useRef(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberRef = useRef(null);

  // Form state — stores IDs
  const [formData, setFormData] = useState({
    panelCode: '',
    panelName: '',
    department: '',            // department id
    primaryInterviewer: '',    // employee id
    secondaryInterviewer: '',  // employee id
    panelMembers: [],          // employee ids
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // AUTH
  // ============================================
  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  };

  const ensureToken = () => {
    if (!getAuthToken()) {
      toast.error('Authentication Required', 'Please login to continue');
      return false;
    }
    return true;
  };

  // ============================================
  // FETCH PANELS
  // ============================================
  const fetchPanels = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/recuirment/getAllInterviewPanel`,
        axiosConfig
      );
      const list = Array.isArray(res.data) ? res.data : (res.data?.response || []);

      const mapped = list.map((item) => {
        const isActive =
          String(item.status ?? '').toLowerCase() === 'y' ||
          item.status === true ||
          String(item.status ?? '').toLowerCase() === 'active';
        return {
          id: item.id,
          panelCode: item.panelCode || '',
          panelName: item.panelName || '',
          departmentId: item.departmentId ?? '',
          department: item.department || '',
          primaryInterviewerId: item.primaryInterviewerId ?? '',
          secondaryInterviewerId: item.secondaryInterviewerId ?? '',
          panelMembersIds: item.panelMembersId || [],
          // legacy name fields for fallback display
          primaryInterviewer: item.primaryInterviewer || '',
          secondaryInterviewer: item.secondaryInterviewer || '',
          panelMembers: item.panelMembers || [],
          status: isActive ? 'Active' : 'Inactive',
          createdBy: item.createdBy || '—',
          createdDate: item.createdDate || null,
          modifiedBy: item.modifiedBy || null,
          modifiedDate: item.modifiedDate || null
        };
      });

      setPanels(mapped);
    } catch (err) {
      console.error('🔴 [fetchPanels] error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch interview panels');
      setPanels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // FETCH DEPARTMENTS
  // ============================================
  const fetchDepartments = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const response = await axios.get(`${BASE_URL}/departments/list?flag=1`, axiosConfig);
      setDepartments(response.data.response || []);
    } catch (error) {
      console.error('[fetchDepartments] error:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to fetch departments');
      setDepartments([]);
    }
  }, []);

  // ============================================
  // FETCH EMPLOYEES (single source for all dropdowns)
  // ============================================
  const fetchEmployees = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const response = await axios.get(
        `${BASE_URL}/api/employees?isActive=true&page=0&size=100`,
        axiosConfig
      );
      console.log('🔵 [fetchEmployees] raw:', response.data);
      setEmployees(response.data.response?.content || []);
    } catch (error) {
      console.error('[fetchEmployees] error:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to fetch employees');
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    fetchPanels();
  }, [fetchDepartments, fetchEmployees, fetchPanels]);

  // ============================================
  // HELPERS
  // ============================================
  const getNameById = (id) => {
    if (!id && id !== 0) return '—';
    const emp = employees.find(e => String(e.id) === String(id));
    return emp?.name || `#${id}`;
  };

  // Returns [{ id, name }] excluding provided ids
  const getEmployeeOptions = (search, excludeIds = []) => {
    const q = (search || '').toLowerCase().trim();
    return employees
      .filter(emp => {
        const matches = !q || emp.name?.toLowerCase().includes(q);
        const notExcluded = !excludeIds.some(x => String(x) === String(emp.id));
        return matches && notExcluded;
      })
      .map(emp => ({ id: emp.id, name: emp.name }));
  };

  // ============================================
  // FILTER & PAGINATION
  // ============================================
  const filteredPanels = panels.filter(item => {
    const s = searchTerm.toLowerCase();
    const primaryName = getNameById(item.primaryInterviewerId || item.primaryInterviewer);
    const secondaryName = getNameById(item.secondaryInterviewerId || item.secondaryInterviewer);
    const memberNames = (item.panelMembersIds || item.panelMembers || []).map(getNameById).join(' ');

    return (
      item.panelCode.toLowerCase().includes(s) ||
      item.panelName.toLowerCase().includes(s) ||
      (item.department || '').toLowerCase().includes(s) ||
      primaryName.toLowerCase().includes(s) ||
      secondaryName.toLowerCase().includes(s) ||
      memberNames.toLowerCase().includes(s)
    );
  });

  const totalItems = filteredPanels.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentPanels = filteredPanels.slice(startIndex, startIndex + rowsPerPage);

  // ============================================
  // UTILITIES
  // ============================================
  const generatePanelCode = () => {
    const count = panels.length + 1;
    return `PNL${String(count).padStart(3, '0')}`;
  };

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

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      if (memberRef.current && !memberRef.current.contains(e.target)) setShowMemberDropdown(false);
      if (departmentRef.current && !departmentRef.current.contains(e.target)) { /* no-op */ }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ============================================
  // FORM FUNCTIONS
  // ============================================
  const resetForm = () => {
    setFormData({
      panelCode: generatePanelCode(),
      panelName: '',
      department: '',
      primaryInterviewer: '',
      secondaryInterviewer: '',
      panelMembers: [],
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingPanel(null);
    setMemberSearch('');
    setShowMemberDropdown(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'panelName') {
      if (!value) error = 'Panel Name is required';
      else if (value.length > 100) error = 'Panel Name must be 100 characters or less';
      else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) error = 'No special characters allowed';
      else {
        const dup = panels.some(item =>
          item.panelName.toLowerCase() === value.toLowerCase() &&
          (!editingPanel || item.id !== editingPanel.id)
        );
        if (dup) error = 'Panel Name must be unique';
      }
    } else if (field === 'department' && !value) {
      error = 'Department is required';
    } else if (field === 'primaryInterviewer' && !value) {
      error = 'Primary Interviewer is required';
    } else if (field === 'panelMembers' && (!value || value.length === 0)) {
      error = 'At least one Panel Member is required';
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = ['panelName', 'department', 'primaryInterviewer', 'panelMembers'];
    for (const f of fields) {
      if (!formData[f] || (f === 'panelMembers' && formData[f].length === 0)) {
        newErrors[f] = f === 'panelMembers' ? 'At least one Panel Member is required' : 'This field is required';
      }
    }
    if (formData.panelName) {
      if (formData.panelName.length > 100) newErrors.panelName = 'Panel Name must be 100 characters or less';
      else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.panelName)) newErrors.panelName = 'No special characters allowed';
      else {
        const dup = panels.some(item =>
          item.panelName.toLowerCase() === formData.panelName.toLowerCase() &&
          (!editingPanel || item.id !== editingPanel.id)
        );
        if (dup) newErrors.panelName = 'Panel Name must be unique';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // PANEL MEMBERS
  // ============================================
  const toggleMember = (id) => {
    const current = formData.panelMembers;
    const updated = current.some(x => String(x) === String(id))
      ? current.filter(m => String(m) !== String(id))
      : [...current, id];
    handleChange('panelMembers', updated);
  };

  const removeMember = (id) => {
    handleChange('panelMembers', formData.panelMembers.filter(m => String(m) !== String(id)));
  };

  // ============================================
  // CRUD
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;
    if (!validateForm()) {
      showToast('warning', 'Validation Error', 'Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        id: editingPanel ? editingPanel.id : 0,
        panelCode: formData.panelCode,
        panelName: formData.panelName,
        departmentId: Number(formData.department),
        primaryInterviewerId: Number(formData.primaryInterviewer),
        secondaryInterviewerId: formData.secondaryInterviewer ? Number(formData.secondaryInterviewer) : null,
        panelMembersIds: formData.panelMembers.map(Number),
        status: 'y'
      };

      let res;
      if (editingPanel) {
        res = await axios.put(
          `${BASE_URL}/api/recuirment/updateInterviewPanel/${editingPanel.id}`,
          payload,
          axiosConfig
        );
      } else {
        res = await axios.post(
          `${BASE_URL}/api/recuirment/createInterviewPanel`,
          payload,
          axiosConfig
        );
      }

      if (res.status === 200 || res.status === 201) {
        toast.success('Success', editingPanel ? 'Interview panel updated successfully' : 'Interview panel created successfully');
        resetForm();
        setShowForm(false);
        setPage(0);
        fetchPanels();
      } else {
        throw new Error(res.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('🔴 [submit] error:', err);
      toast.error('Error', err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive panels cannot be edited');
      return;
    }
    setEditingPanel(item);
    setFormData({
      panelCode: item.panelCode,
      panelName: item.panelName,
      department: item.departmentId ?? '',
      primaryInterviewer: item.primaryInterviewerId ?? '',
      secondaryInterviewer: item.secondaryInterviewerId ?? '',
      panelMembers: item.panelMembersIds ?? [],
      status: 'Active'
    });

    setShowForm(true);
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!ensureToken()) return;
    const updated = panels.filter(item => item.id !== deleteTarget.id);
    setPanels(updated);
    showToast('success', 'Deleted', `${deleteTarget.panelName} has been deleted`);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleStatusToggle = (id, name, currentStatus) => {
    setStatusAction({
      id,
      name,
      newStatus: currentStatus === 'Active' ? 'Inactive' : 'Active'
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    const { id, newStatus, name } = statusAction;
    setLoading(true);
    try {
      const target = panels.find((r) => r.id === id);
      if (!target) throw new Error('Panel not found');


      const res = await axios.put(
        `${BASE_URL}/api/recuirment/updateInterviewPanelStatus/${id}`,
        { status: newStatus === 'Active' ? 'y' : 'n' },
        axiosConfig
      );

      if (res.status === 200) {
        toast.success('Status Updated', `${name} is now ${newStatus}`);
        fetchPanels();
      } else {
        throw new Error(res.data?.message || 'Failed to change status');
      }
    } catch (err) {
      console.error('🔴 [statusToggle] error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to change status');
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, name: '', newStatus: '' });
    }
  };

  const handleCancelForm = () => { resetForm(); setShowForm(false); };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, panelCode: generatePanelCode() }));
    setShowForm(true);
  };

  const handleBackToList = () => { resetForm(); setShowForm(false); };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Interview Panel Master</h1>
          <p className="cert-subtitle">Manage interview panels for candidate evaluation</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Interview Panel
            </button>
          )}
          {showForm && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        /* ================= FORM ================= */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Interview Panel Details</div>
              <div className="cert-form-grid-3col">

                {/* Panel Code */}
                <div className="cert-field-compact">
                  <label className="required">Panel Code</label>
                  <input
                    type="text"
                    value={formData.panelCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated unique identifier</small>
                </div>

                {/* Panel Name */}
                <div className={`cert-field-compact ${touched.panelName && errors.panelName ? 'has-error' : ''}`}>
                  <label className="required">Panel Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Java Technical Panel"
                    value={formData.panelName}
                    onChange={(e) => handleChange('panelName', e.target.value)}
                    onBlur={() => handleBlur('panelName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.panelName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Display name used while assigning interview panels</small>
                </div>

                {/* Department */}
                <div className={`cert-field-compact ${touched.department && errors.department ? 'has-error' : ''}`}>
                  <label className="required">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    onBlur={() => handleBlur('department')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={Number(dept.id)}>{dept.name}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.department} />
                </div>

                {/* Primary Interviewer - Native Select */}
                <div className={`cert-field-compact ${touched.primaryInterviewer && errors.primaryInterviewer ? 'has-error' : ''}`}>
                  <label className="required">Primary Interviewer</label>
                  <select
                    value={formData.primaryInterviewer}
                    onChange={(e) => handleChange('primaryInterviewer', e.target.value)}
                    onBlur={() => handleBlur('primaryInterviewer')}
                    style={{ fontSize: '14px', padding: '6px 12px', width: '100%', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">Select Primary Interviewer</option>
                    {employees
                      .filter(emp => 
                        String(emp.id) !== String(formData.secondaryInterviewer) && 
                        !formData.panelMembers.some(m => String(m) === String(emp.id))
                      )
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))
                    }
                  </select>
                  <FieldError msg={errors.primaryInterviewer} />
                </div>

                {/* Secondary Interviewer - Native Select */}
                <div className={`cert-field-compact ${touched.secondaryInterviewer && errors.secondaryInterviewer ? 'has-error' : ''}`}>
                  <label>Secondary Interviewer (Optional)</label>
                  <select
                    value={formData.secondaryInterviewer}
                    onChange={(e) => handleChange('secondaryInterviewer', e.target.value)}
                    onBlur={() => handleBlur('secondaryInterviewer')}
                    style={{ fontSize: '14px', padding: '6px 12px', width: '100%', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">Select Secondary Interviewer</option>
                    {employees
                      .filter(emp => 
                        String(emp.id) !== String(formData.primaryInterviewer) && 
                        !formData.panelMembers.some(m => String(m) === String(emp.id))
                      )
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))
                    }
                  </select>
                  <FieldError msg={errors.secondaryInterviewer} />
                </div>

                {/* Panel Members (multi-select, IDs) */}
                <div className={`cert-field-compact ${touched.panelMembers && errors.panelMembers ? 'has-error' : ''}`} ref={memberRef}>
                  <label className="required">Panel Members</label>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px',
                        border: `1px solid ${touched.panelMembers && errors.panelMembers ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '8px', padding: '4px 8px', background: '#fff', minHeight: '38px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    >
                      {formData.panelMembers.length > 0 ? (
                        formData.panelMembers.map(memberId => (
                          <span
                            key={memberId}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: '#fdf2f8', color: '#9d174d',
                              padding: '2px 8px', borderRadius: '4px',
                              fontSize: '12px', fontWeight: '500'
                            }}
                          >
                            {getNameById(memberId)}
                            <FaTimesCircle
                              size={12}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); removeMember(memberId); }}
                            />
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>Select panel members...</span>
                      )}
                      <FaChevronDown size={12} style={{ color: '#6b7280', marginLeft: 'auto' }} />
                    </div>

                    {showMemberDropdown && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                        border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '4px',
                        maxHeight: '200px', overflowY: 'auto', zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                          <input
                            type="text"
                            placeholder="Search members..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', padding: '4px 0' }}
                          />
                        </div>

                        {getEmployeeOptions(memberSearch, [formData.primaryInterviewer, formData.secondaryInterviewer])
                          .filter(opt => !formData.panelMembers.some(m => String(m) === String(opt.id)))
                          .map(opt => (
                            <div
                              key={opt.id}
                              style={{
                                padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                borderBottom: '1px solid #f3f4f6'
                              }}
                              onClick={() => toggleMember(opt.id)}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={formData.panelMembers.some(m => String(m) === String(opt.id))}
                                onChange={() => { }}
                                style={{ cursor: 'pointer' }}
                              />
                              {opt.name}
                            </div>
                          ))}

                        {getEmployeeOptions(memberSearch, [formData.primaryInterviewer, formData.secondaryInterviewer])
                          .filter(opt => !formData.panelMembers.some(m => String(m) === String(opt.id))).length === 0 && (
                            <div style={{ padding: '8px 12px', color: '#6b7280', fontSize: '14px' }}>No members found</div>
                          )}
                      </div>
                    )}
                  </div>
                  <FieldError msg={errors.panelMembers} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Additional interviewers participating in the panel</small>
                </div>

              </div>
            </div>

            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>
                <FaTimes size={12} /> Cancel
              </button>
              <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {submitting ? 'Saving...' : (editingPanel ? 'Update' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= TABLE ================= */
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name, department, interviewer..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                style={{ fontSize: '14px', padding: '6px 12px' }}
              />
              {searchTerm && (
                <button className="cert-search-clear" onClick={() => { setSearchTerm(''); setPage(0); }}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Panel Code</th>
                    <th>Panel Name</th>
                    <th>Department</th>
                    <th>Primary Interviewer</th>
                    <th>Secondary</th>
                    <th>Members</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPanels.length > 0 ? currentPanels.map((item, idx) => {
                    const memberIds = item.panelMembersIds?.length ? item.panelMembersIds : (item.panelMembers || []);
                    return (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '13px' }}>{item.panelCode}</span>
                        </td>
                        <td><strong>{item.panelName}</strong></td>
                        <td>
                          <span style={{
                            background: '#e0e7ff', color: '#4f46e5',
                            fontSize: '12px', padding: '2px 10px', borderRadius: '10px'
                          }}>
                            {item.department || getNameById(item.departmentId)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaUserTie size={12} style={{ color: '#9d174d' }} />
                            {getNameById(item.primaryInterviewerId || item.primaryInterviewer)}
                          </span>
                        </td>
                        <td>
                          {(item.secondaryInterviewerId || item.secondaryInterviewer) ? (
                            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaUser size={12} style={{ color: '#6b7280' }} />
                              {getNameById(item.secondaryInterviewerId || item.secondaryInterviewer)}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {memberIds.map(id => (
                              <span
                                key={id}
                                style={{
                                  background: '#fdf2f8', color: '#9d174d',
                                  fontSize: '10px', padding: '1px 8px',
                                  borderRadius: '10px', fontWeight: 500
                                }}
                              >
                                {getNameById(id)}
                              </span>
                            ))}
                            {memberIds.length === 0 && <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={() => handleStatusToggle(item.id, item.panelName, item.status || 'Active')}
                          >
                            <div style={{
                              width: '28px', height: '16px', borderRadius: '50px',
                              backgroundColor: (item.status || 'Active') === 'Active' ? '#9d174d' : '#d1d5db',
                              position: 'relative', transition: '.2s'
                            }}>
                              <div style={{
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: '#fff', position: 'absolute', top: '2px',
                                left: (item.status || 'Active') === 'Active' ? '14px' : '2px',
                                transition: '.2s'
                              }} />
                            </div>
                            <span style={{
                              fontSize: '11px', fontWeight: 500,
                              color: (item.status || 'Active') === 'Active' ? '#9d174d' : '#94a3b8'
                            }}>
                              {item.status || 'Active'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" style={{ justifyContent: 'center' }}>
                            <button
                              className="cert-act cert-act--edit"
                              onClick={() => handleEdit(item)}
                              title={item.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={item.status === 'Inactive'}
                              style={{
                                opacity: item.status === 'Inactive' ? 0.5 : 1,
                                cursor: item.status === 'Inactive' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="10" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No interview panels found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} panels
                </div>
                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        style={{
                          padding: '6px 10px', border: '1px solid #e5e7eb',
                          background: pg === page ? '#9d174d' : 'white',
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px'
                        }}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* STATUS MODAL */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">{statusAction.newStatus === 'Active' ? '✅' : '⛔'}</div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{' '}
              <strong>{statusAction.newStatus === 'Active' ? 'activate' : 'deactivate'}</strong>{' '}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === 'Inactive'
                ? 'Inactive panels cannot be used for interview scheduling.'
                : 'This panel will become available for interview scheduling.'}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// FIELD ERROR
const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default InterviewPanelMaster;