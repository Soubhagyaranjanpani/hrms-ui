import React, { useState, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaCircle,
  FaTag, FaList, FaInfoCircle
} from 'react-icons/fa';

// ============================================
// TOAST NOTIFICATION
// ============================================
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

const RejectionReasonMaster = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [reasons, setReasons] = useState([
    {
      id: 1,
      reasonCode: 'RR001',
      reasonName: 'Skill Gap',
      reasonCategory: 'Technical',
      description: 'Candidate lacks required technical skills for the position',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 2,
      reasonCode: 'RR002',
      reasonName: 'Salary Mismatch',
      reasonCategory: 'Compensation',
      description: 'Candidate salary expectation does not match budget',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-20T14:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 3,
      reasonCode: 'RR003',
      reasonName: 'Culture Fit',
      reasonCategory: 'HR',
      description: 'Candidate does not fit company culture',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-01T09:15:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 4,
      reasonCode: 'RR004',
      reasonName: 'Better Opportunity',
      reasonCategory: 'Candidate Decision',
      description: 'Candidate found better opportunity elsewhere',
      status: 'Inactive',
      createdBy: 'Admin',
      createdDate: '2026-02-10T11:45:00Z',
      modifiedBy: 'Admin',
      modifiedDate: '2026-07-20T16:30:00Z'
    },
    {
      id: 5,
      reasonCode: 'RR005',
      reasonName: 'Position Closed',
      reasonCategory: 'Organization Decision',
      description: 'Position has been closed due to budget constraints',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-05T08:50:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 6,
      reasonCode: 'RR006',
      reasonName: 'Experience Mismatch',
      reasonCategory: 'Technical',
      description: 'Candidate does not have required experience level',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-04-12T13:10:00Z',
      modifiedBy: null,
      modifiedDate: null
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingReason, setEditingReason] = useState(null);
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
    reasonCode: '',
    reasonName: '',
    reasonCategory: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // CONSTANTS
  // ============================================
  const reasonCategories = [
    { value: 'Technical', label: 'Technical' },
    { value: 'HR', label: 'HR' },
    { value: 'Compensation', label: 'Compensation' },
    { value: 'Candidate Decision', label: 'Candidate Decision' },
    { value: 'Organization Decision', label: 'Organization Decision' },
    { value: 'Other', label: 'Other' }
  ];

  // ============================================
  // FILTER & PAGINATION
  // ============================================
  const filteredReasons = reasons.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.reasonCode.toLowerCase().includes(search) ||
      item.reasonName.toLowerCase().includes(search) ||
      item.reasonCategory.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search));
  });

  const totalItems = filteredReasons.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentReasons = filteredReasons.slice(startIndex, startIndex + rowsPerPage);

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

  const generateReasonCode = () => {
    const count = reasons.length + 1;
    const prefix = 'RR';
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

  // ============================================
  // FORM FUNCTIONS
  // ============================================
  const resetForm = () => {
    setFormData({
      reasonCode: generateReasonCode(),
      reasonName: '',
      reasonCategory: '',
      description: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingReason(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';

    if (field === 'reasonName') {
      if (!value) {
        error = 'Reason Name is required';
      } else if (value.length > 100) {
        error = 'Reason Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        const duplicate = reasons.some(item =>
          item.reasonName.toLowerCase() === value.toLowerCase() &&
          (!editingReason || item.id !== editingReason.id)
        );
        if (duplicate) {
          error = 'Reason Name must be unique';
        }
      }
    } else if (field === 'reasonCategory' && !value) {
      error = 'Reason Category is required';
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = ['reasonName', 'reasonCategory'];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }

    if (formData.reasonName) {
      if (formData.reasonName.length > 100) {
        newErrors.reasonName = 'Reason Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.reasonName)) {
        newErrors.reasonName = 'No special characters allowed';
      } else {
        const duplicate = reasons.some(item =>
          item.reasonName.toLowerCase() === formData.reasonName.toLowerCase() &&
          (!editingReason || item.id !== editingReason.id)
        );
        if (duplicate) {
          newErrors.reasonName = 'Reason Name must be unique';
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

    const reasonData = {
      reasonCode: formData.reasonCode,
      reasonName: formData.reasonName,
      reasonCategory: formData.reasonCategory,
      description: formData.description || '',
      status: formData.status
    };

    if (editingReason) {
      const updated = reasons.map(item =>
        item.id === editingReason.id
          ? {
            ...item,
            ...reasonData,
            modifiedBy: 'Admin',
            modifiedDate: new Date().toISOString()
          }
          : item
      );
      setReasons(updated);
      showToast('success', 'Success', 'Rejection reason updated successfully');
    } else {
      const newReason = {
        id: Date.now(),
        ...reasonData,
        createdBy: 'Admin',
        createdDate: new Date().toISOString(),
        modifiedBy: null,
        modifiedDate: null
      };
      setReasons([newReason, ...reasons]);
      showToast('success', 'Success', 'Rejection reason added successfully');
    }

    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive reasons cannot be edited');
      return;
    }
    setEditingReason(item);
    setFormData({
      reasonCode: item.reasonCode,
      reasonName: item.reasonName,
      reasonCategory: item.reasonCategory,
      description: item.description || '',
      status: item.status
    });
    setShowForm(true);
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
    const updated = reasons.map(item =>
      item.id === id
        ? {
          ...item,
          status: newStatus,
          modifiedBy: 'Admin',
          modifiedDate: new Date().toISOString()
        }
        : item
    );
    setReasons(updated);
    setShowStatusModal(false);
    showToast('success', 'Status Updated', `${statusAction.name} is now ${newStatus}`);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, reasonCode: generateReasonCode() }));
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Rejection Reason Master</h1>
          <p className="cert-subtitle">Manage rejection reasons for candidate evaluation</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Rejection Reason
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
        /* ==========================================
           FORM SECTION
           ========================================== */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Rejection Reason Details</div>
              <div className="cert-form-grid-3col">

                {/* Reason Code - Auto */}
                <div className="cert-field-compact">
                  <label>Reason Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.reasonCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated</small>
                </div>

                {/* Reason Name - Required */}
                <div className={`cert-field-compact ${touched.reasonName && errors.reasonName ? 'has-error' : ''}`}>
                  <label className="required">Reason Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Skill Gap, Salary Mismatch"
                    value={formData.reasonName}
                    onChange={(e) => handleChange('reasonName', e.target.value)}
                    onBlur={() => handleBlur('reasonName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.reasonName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Max 100 characters, no special characters</small>
                </div>

                {/* Reason Category - Required */}
                <div className={`cert-field-compact ${touched.reasonCategory && errors.reasonCategory ? 'has-error' : ''}`}>
                  <label className="required">Reason Category</label>
                  <select
                    value={formData.reasonCategory}
                    onChange={(e) => handleChange('reasonCategory', e.target.value)}
                    onBlur={() => handleBlur('reasonCategory')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Category</option>
                    {reasonCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.reasonCategory} />
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
                <FaSave size={12} /> {editingReason ? 'Update' : 'Save'}
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
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name, category or description..."
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
                    <th>Reason Code</th>
                    <th>Reason Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReasons.length > 0 ? (
                    currentReasons.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {item.reasonCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.reasonName}</strong>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            fontSize: '12px',
                            padding: '2px 10px'
                          }}>
                            {item.reasonCategory}
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
                              item.reasonName,
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
                        No rejection reasons found
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} reasons
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
                ? 'Inactive rejection reasons cannot be used during candidate rejection.'
                : 'This rejection reason will become available for selection.'}
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

// ============================================
// FIELD ERROR COMPONENT
// ============================================
const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default RejectionReasonMaster;