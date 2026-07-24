import React, { useState, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaCircle,
  FaVideo, FaUser, FaPhone, FaUsers
} from 'react-icons/fa';

// Simple toast notification function
const showToast = (type, title, message) => {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:${colors[type] || '#3b82f6'};color:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:300px;margin-bottom:8px;animation:slideIn 0.3s ease;">
      <span style="font-weight:600;">${title}</span>
      <span style="flex:1;">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">×</button>
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 500px;
  `;
  document.body.appendChild(container);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  return container;
};

const InterviewTypeMaster = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [interviewTypes, setInterviewTypes] = useState([
    {
      id: 1,
      interviewCode: 'INT001',
      interviewName: 'Technical Round 1',
      interviewMode: 'Virtual',
      description: 'First technical assessment round conducted virtually',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 2,
      interviewCode: 'INT002',
      interviewName: 'HR Round',
      interviewMode: 'Face to Face',
      description: 'HR discussion about culture fit and expectations',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-20T14:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 3,
      interviewCode: 'INT003',
      interviewName: 'Technical Round 2',
      interviewMode: 'Virtual',
      description: 'Advanced technical assessment with coding',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-01T09:15:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 4,
      interviewCode: 'INT004',
      interviewName: 'Manager Round',
      interviewMode: 'Hybrid',
      description: 'Discussion with hiring manager',
      status: 'Inactive',
      createdBy: 'Admin',
      createdDate: '2026-02-10T11:45:00Z',
      modifiedBy: 'Admin',
      modifiedDate: '2026-07-20T16:30:00Z'
    },
    {
      id: 5,
      interviewCode: 'INT005',
      interviewName: 'Telephonic Screening',
      interviewMode: 'Telephonic',
      description: 'Initial telephonic screening round',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-05T08:50:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 6,
      interviewCode: 'INT006',
      interviewName: 'Final Round',
      interviewMode: 'Face to Face',
      description: 'Final round with leadership team',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-04-12T13:10:00Z',
      modifiedBy: null,
      modifiedDate: null
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: '',
    newStatus: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    interviewCode: '',
    interviewName: '',
    interviewMode: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // INTERVIEW MODE OPTIONS
  // ============================================
  const interviewModes = [
    { value: 'Virtual', label: 'Virtual', icon: <FaVideo size={12} /> },
    { value: 'Face to Face', label: 'Face to Face', icon: <FaUser size={12} /> },
    { value: 'Telephonic', label: 'Telephonic', icon: <FaPhone size={12} /> },
    { value: 'Hybrid', label: 'Hybrid', icon: <FaUsers size={12} /> }
  ];

  // ============================================
  // FILTERED DATA
  // ============================================
  const filteredTypes = interviewTypes.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.interviewCode.toLowerCase().includes(search) ||
      item.interviewName.toLowerCase().includes(search) ||
      item.interviewMode.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search));
  });

  const totalItems = filteredTypes.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentTypes = filteredTypes.slice(startIndex, startIndex + rowsPerPage);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateInterviewCode = () => {
    const count = interviewTypes.length + 1;
    const prefix = 'INT';
    const padded = String(count).padStart(3, '0');
    return `${prefix}${padded}`;
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

  const getModeIcon = (mode) => {
    const found = interviewModes.find(m => m.value === mode);
    return found ? found.icon : <FaUser size={12} />;
  };

  const getModeColor = (mode) => {
    const colors = {
      'Virtual': '#8b5cf6',
      'Face to Face': '#3b82f6',
      'Telephonic': '#f59e0b',
      'Hybrid': '#10b981'
    };
    return colors[mode] || '#6b7280';
  };

  // ============================================
  // FORM FUNCTIONS
  // ============================================
  const resetForm = () => {
    setFormData({
      interviewCode: generateInterviewCode(),
      interviewName: '',
      interviewMode: '',
      description: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingType(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';

    if (field === 'interviewName') {
      if (!value) {
        error = 'Interview Type Name is required';
      } else if (value.length > 100) {
        error = 'Interview Type Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        const duplicate = interviewTypes.some(item =>
          item.interviewName.toLowerCase() === value.toLowerCase() &&
          (!editingType || item.id !== editingType.id)
        );
        if (duplicate) {
          error = 'Interview Type Name must be unique';
        }
      }
    } else if (field === 'interviewMode' && !value) {
      error = 'Interview Mode is required';
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = ['interviewName', 'interviewMode'];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }

    if (formData.interviewName) {
      if (formData.interviewName.length > 100) {
        newErrors.interviewName = 'Interview Type Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.interviewName)) {
        newErrors.interviewName = 'No special characters allowed';
      } else {
        const duplicate = interviewTypes.some(item =>
          item.interviewName.toLowerCase() === formData.interviewName.toLowerCase() &&
          (!editingType || item.id !== editingType.id)
        );
        if (duplicate) {
          newErrors.interviewName = 'Interview Type Name must be unique';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('warning', 'Validation Error', 'Please fix the highlighted fields');
      return;
    }

    const typeData = {
      interviewCode: formData.interviewCode,
      interviewName: formData.interviewName,
      interviewMode: formData.interviewMode,
      description: formData.description || '',
      status: formData.status
    };

    if (editingType) {
      const updated = interviewTypes.map(item =>
        item.id === editingType.id
          ? {
            ...item,
            ...typeData,
            modifiedBy: 'Admin',
            modifiedDate: new Date().toISOString()
          }
          : item
      );
      setInterviewTypes(updated);
      showToast('success', 'Success', 'Interview type updated successfully');
    } else {
      const newType = {
        id: Date.now(),
        ...typeData,
        createdBy: 'Admin',
        createdDate: new Date().toISOString(),
        modifiedBy: null,
        modifiedDate: null
      };
      setInterviewTypes([newType, ...interviewTypes]);
      showToast('success', 'Success', 'Interview type added successfully');
    }

    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive types cannot be edited');
      return;
    }
    setEditingType(item);
    setFormData({
      interviewCode: item.interviewCode,
      interviewName: item.interviewName,
      interviewMode: item.interviewMode,
      description: item.description || '',
      status: item.status
    });
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const isUsed = false; // Replace with actual check

    if (isUsed) {
      showToast('error', 'Cannot Delete', 'This interview type is already in use');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    const updated = interviewTypes.filter(item => item.id !== deleteTarget.id);
    setInterviewTypes(updated);
    showToast('success', 'Deleted', `${deleteTarget.interviewName} has been deleted`);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({
      id,
      name,
      newStatus
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;
    const updated = interviewTypes.map(item =>
      item.id === id
        ? {
          ...item,
          status: newStatus,
          modifiedBy: 'Admin',
          modifiedDate: new Date().toISOString()
        }
        : item
    );
    setInterviewTypes(updated);
    setShowStatusModal(false);
    showToast('success', 'Status Updated', `${statusAction.name} is now ${newStatus}`);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, interviewCode: generateInterviewCode() }));
    setShowForm(true);
  };

  return (
    <div className="cert-root">
      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Interview Type Master</h1>
          <p className="cert-subtitle">Manage interview types for recruitment process</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Interview Type
            </button>
          )}
          {showForm && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleCancelForm}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          FORM SECTION
          ========================================== */}
      {showForm ? (
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Interview Type Details</div>
              <div className="cert-form-grid-3col">

                {/* Interview Code - Auto */}
                <div className="cert-field-compact">
                  <label>Interview Type Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.interviewCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated</small>
                </div>

                {/* Interview Name - Required */}
                <div className={`cert-field-compact ${touched.interviewName && errors.interviewName ? 'has-error' : ''}`}>
                  <label className="required">Interview Type Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Technical Round, HR Round"
                    value={formData.interviewName}
                    onChange={(e) => handleChange('interviewName', e.target.value)}
                    onBlur={() => handleBlur('interviewName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.interviewName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Max 100 characters, no special characters</small>
                </div>

                {/* Interview Mode - Required */}
                <div className={`cert-field-compact ${touched.interviewMode && errors.interviewMode ? 'has-error' : ''}`}>
                  <label className="required">Interview Mode</label>
                  <select
                    value={formData.interviewMode}
                    onChange={(e) => handleChange('interviewMode', e.target.value)}
                    onBlur={() => handleBlur('interviewMode')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Mode</option>
                    {interviewModes.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.interviewMode} />
                </div>

                {/* Description - Text Area */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 1' }}>
                  <label>Description</label>
                  <textarea
                    rows="2"
                    placeholder="Enter description (optional)"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    style={{ fontSize: '14px', padding: '6px 12px', resize: 'vertical', minHeight: '60px' }}
                  />
                </div>

               
              </div>
            </div>

            {/* Form Actions */}
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>
                <FaTimes size={12} /> Cancel
              </button>
            
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingType ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ==========================================
            TABLE SECTION
            ========================================== */
        <>
          {/* Search Bar */}
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              {/* <FaSearch className="emp-search-icon" size={12} /> */}
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name, mode or description..."
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

          {/* Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Interview Code</th>
                    <th>Interview Name</th>
                    <th>Mode</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th>Last Modified</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTypes.length > 0 ? (
                    currentTypes.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {item.interviewCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.interviewName}</strong>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: `${getModeColor(item.interviewMode)}20`,
                            color: getModeColor(item.interviewMode),
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {getModeIcon(item.interviewMode)}
                            {item.interviewMode}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(
                              item.id,
                              item.interviewName,
                              item.status || 'Active'
                            )}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '16px',
                                borderRadius: '50px',
                                backgroundColor: (item.status || 'Active') === 'Active' ? '#9d174d' : '#d1d5db',
                                position: 'relative',
                                transition: '.2s'
                              }}
                            >
                              <div
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  background: '#fff',
                                  position: 'absolute',
                                  top: '2px',
                                  left: (item.status || 'Active') === 'Active' ? '14px' : '2px',
                                  transition: '.2s'
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: (item.status || 'Active') === 'Active' ? '#9d174d' : '#94a3b8'
                              }}
                            >
                              {item.status || 'Active'}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: '#6b7280' }}>
                          {item.modifiedDate ? formatDate(item.modifiedDate) : formatDate(item.createdDate)}
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No interview types found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} interview types
                </div>

                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    className="cert-page-btn"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots" style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button
                        key={pg}
                        className={`cert-page-num ${pg === page ? 'active' : ''}`}
                        onClick={() => setPage(pg)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #e5e7eb',
                          background: pg === page ? '#9d174d' : 'white',
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          minWidth: '34px'
                        }}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button
                    className="cert-page-btn"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==========================================
          STATUS CHANGE MODAL
          ========================================== */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">
              {statusAction.newStatus === 'Active' ? '✅' : '⛔'}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{' '}
              <strong>{statusAction.newStatus === 'Active' ? 'activate' : 'deactivate'}</strong>{' '}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === 'Inactive'
                ? 'Inactive interview types cannot be used in recruitment process.'
                : 'This interview type will become available for selection.'}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL
          ========================================== */}
      {showDeleteModal && deleteTarget && (
        <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">🗑️</div>
            <h3 className="emp-modal-title">Confirm Delete</h3>
            <p className="emp-modal-body">
              Are you sure you want to delete <strong>{deleteTarget.interviewName}</strong>?
            </p>
            <p className="emp-modal-warn" style={{ color: '#dc2626' }}>
              {deleteTarget.status === 'Active'
                ? 'This interview type is currently active. It cannot be deleted if already used in recruitments.'
                : 'This action cannot be undone.'}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmDelete} style={{ background: '#dc2626' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// FIELD ERROR COMPONENT
// ============================================
const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default InterviewTypeMaster;