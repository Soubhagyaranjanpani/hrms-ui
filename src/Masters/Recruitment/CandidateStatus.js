
import React, { useState, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaCircle,
  FaFlag, FaPalette, FaList, FaTag, FaInfoCircle
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

const CandidateStatusMaster = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [statuses, setStatuses] = useState([
    {
      id: 1,
      statusCode: 'STA001',
      statusName: 'Applied',
      displayOrder: 1,
      finalStatus: false,
      statusColor: '#3b82f6',
      statusCategory: 'Application',
      description: 'Candidate has submitted application',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 2,
      statusCode: 'STA002',
      statusName: 'Under Review',
      displayOrder: 2,
      finalStatus: false,
      statusColor: '#8b5cf6',
      statusCategory: 'Screening',
      description: 'Application is being reviewed by HR',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-20T14:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 3,
      statusCode: 'STA003',
      statusName: 'Shortlisted',
      displayOrder: 3,
      finalStatus: false,
      statusColor: '#f59e0b',
      statusCategory: 'Screening',
      description: 'Candidate has been shortlisted for interview',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-01T09:15:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 4,
      statusCode: 'STA004',
      statusName: 'Interview Scheduled',
      displayOrder: 4,
      finalStatus: false,
      statusColor: '#06b6d4',
      statusCategory: 'Interview',
      description: 'Interview has been scheduled',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-10T11:45:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 5,
      statusCode: 'STA005',
      statusName: 'Interview Completed',
      displayOrder: 5,
      finalStatus: false,
      statusColor: '#14b8a6',
      statusCategory: 'Interview',
      description: 'Interview process has been completed',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-15T13:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 6,
      statusCode: 'STA006',
      statusName: 'Selected',
      displayOrder: 6,
      finalStatus: false,
      statusColor: '#22c55e',
      statusCategory: 'Decision',
      description: 'Candidate has been selected',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-01T10:00:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 7,
      statusCode: 'STA007',
      statusName: 'Offer Released',
      displayOrder: 7,
      finalStatus: false,
      statusColor: '#8b5cf6',
      statusCategory: 'Offer',
      description: 'Offer letter has been released',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-10T14:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 8,
      statusCode: 'STA008',
      statusName: 'Offer Accepted',
      displayOrder: 8,
      finalStatus: false,
      statusColor: '#10b981',
      statusCategory: 'Offer',
      description: 'Candidate has accepted the offer',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-20T09:45:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 9,
      statusCode: 'STA009',
      statusName: 'Joined',
      displayOrder: 9,
      finalStatus: true,
      statusColor: '#065f46',
      statusCategory: 'Onboarding',
      description: 'Candidate has joined the organization',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-04-01T11:00:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 10,
      statusCode: 'STA010',
      statusName: 'Rejected',
      displayOrder: 10,
      finalStatus: true,
      statusColor: '#ef4444',
      statusCategory: 'Decision',
      description: 'Candidate has been rejected',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-20T16:00:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 11,
      statusCode: 'STA011',
      statusName: 'Withdrawn',
      displayOrder: 11,
      finalStatus: true,
      statusColor: '#6b7280',
      statusCategory: 'Withdrawal',
      description: 'Candidate has withdrawn the application',
      status: 'Inactive',
      createdBy: 'Admin',
      createdDate: '2026-03-15T15:00:00Z',
      modifiedBy: 'Admin',
      modifiedDate: '2026-07-20T16:30:00Z'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
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
    statusCode: '',
    statusName: '',
    displayOrder: '',
    finalStatus: false,
    statusColor: '#3b82f6',
    statusCategory: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // STATUS CATEGORY OPTIONS
  // ============================================
  const statusCategories = [
    { value: 'Application', label: 'Application' },
    { value: 'Screening', label: 'Screening' },
    { value: 'Interview', label: 'Interview' },
    { value: 'Decision', label: 'Decision' },
    { value: 'Offer', label: 'Offer' },
    { value: 'Onboarding', label: 'Onboarding' },
    { value: 'Withdrawal', label: 'Withdrawal' },
    { value: 'Other', label: 'Other' }
  ];

  // ============================================
  // PRESET COLOR OPTIONS
  // ============================================
  const presetColors = [
    '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', 
    '#14b8a6', '#22c55e', '#10b981', '#065f46',
    '#ef4444', '#dc2626', '#6b7280', '#4b5563',
    '#f97316', '#ec4899', '#6366f1', '#0ea5e9'
  ];

  // ============================================
  // FILTERED DATA
  // ============================================
  const filteredStatuses = statuses.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.statusCode.toLowerCase().includes(search) ||
      item.statusName.toLowerCase().includes(search) ||
      item.statusCategory.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search));
  });

  const totalItems = filteredStatuses.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentStatuses = filteredStatuses.slice(startIndex, startIndex + rowsPerPage);

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

  const generateStatusCode = () => {
    const count = statuses.length + 1;
    const prefix = 'STA';
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

  const getFinalStatusBadge = (finalStatus) => {
    return finalStatus ? (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: '#d1fae5',
        color: '#065f46',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500'
      }}>
        <FaCheckCircle size={10} /> Yes
      </span>
    ) : (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: '#f3f4f6',
        color: '#6b7280',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500'
      }}>
        <FaCircle size={10} /> No
      </span>
    );
  };

  // ============================================
  // FORM FUNCTIONS - FIXED
  // ============================================
  const resetForm = () => {
    setFormData({
      statusCode: generateStatusCode(),
      statusName: '',
      displayOrder: '',
      finalStatus: false,
      statusColor: '#3b82f6',
      statusCategory: '',
      description: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingStatus(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  // ✅ FIXED: validateField with 'statuses' instead of 'rounds'
  const validateField = (field, value) => {
    let error = '';

    if (field === 'statusName') {
      if (!value) {
        error = 'Status Name is required';
      } else if (value.length > 100) {
        error = 'Status Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        // ✅ FIXED: Use 'statuses' instead of 'rounds'
        const duplicate = statuses.some(item =>
          item.statusName.toLowerCase() === value.toLowerCase() &&
          (!editingStatus || item.id !== editingStatus.id)
        );
        if (duplicate) {
          error = 'Status Name must be unique';
        }
      }
    } else if (field === 'displayOrder') {
      if (!value) {
        error = 'Display Order is required';
      } else if (!/^\d+$/.test(value) || Number(value) <= 0) {
        error = 'Enter a valid positive number';
      } else {
        // ✅ FIXED: Use 'statuses' instead of 'rounds'
        const duplicate = statuses.some(item =>
          Number(item.displayOrder) === Number(value) &&
          (!editingStatus || item.id !== editingStatus.id)
        );
        if (duplicate) {
          error = 'Display Order must be unique';
        }
      }
    } else if (field === 'statusCategory' && !value) {
      error = 'Status Category is required';
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // ✅ FIXED: validateForm with 'statuses' instead of 'rounds'
  const validateForm = () => {
    const fieldsToValidate = ['statusName', 'displayOrder', 'statusCategory'];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }

    // Status Name Validation
    if (formData.statusName) {
      if (formData.statusName.length > 100) {
        newErrors.statusName = 'Status Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.statusName)) {
        newErrors.statusName = 'No special characters allowed';
      } else {
        // ✅ FIXED: Use 'statuses' instead of 'rounds'
        const duplicate = statuses.some(item =>
          item.statusName.toLowerCase() === formData.statusName.toLowerCase() &&
          (!editingStatus || item.id !== editingStatus.id)
        );
        if (duplicate) {
          newErrors.statusName = 'Status Name must be unique';
        }
      }
    }

    // Display Order Validation
    if (formData.displayOrder) {
      if (!/^\d+$/.test(formData.displayOrder) || Number(formData.displayOrder) <= 0) {
        newErrors.displayOrder = 'Enter a valid positive number';
      } else {
        // ✅ FIXED: Use 'statuses' instead of 'rounds'
        const duplicate = statuses.some(item =>
          Number(item.displayOrder) === Number(formData.displayOrder) &&
          (!editingStatus || item.id !== editingStatus.id)
        );
        if (duplicate) {
          newErrors.displayOrder = 'Display Order must be unique';
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

    const statusData = {
      statusCode: formData.statusCode,
      statusName: formData.statusName,
      displayOrder: Number(formData.displayOrder),
      finalStatus: formData.finalStatus,
      statusColor: formData.statusColor,
      statusCategory: formData.statusCategory,
      description: formData.description || '',
      status: formData.status
    };

    if (editingStatus) {
      const updated = statuses.map(item =>
        item.id === editingStatus.id
          ? {
            ...item,
            ...statusData,
            modifiedBy: 'Admin',
            modifiedDate: new Date().toISOString()
          }
          : item
      );
      setStatuses(updated);
      showToast('success', 'Success', 'Candidate status updated successfully');
    } else {
      const newStatus = {
        id: Date.now(),
        ...statusData,
        createdBy: 'Admin',
        createdDate: new Date().toISOString(),
        modifiedBy: null,
        modifiedDate: null
      };
      setStatuses([newStatus, ...statuses]);
      showToast('success', 'Success', 'Candidate status added successfully');
    }

    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive statuses cannot be edited');
      return;
    }
    setEditingStatus(item);
    setFormData({
      statusCode: item.statusCode,
      statusName: item.statusName,
      displayOrder: String(item.displayOrder),
      finalStatus: item.finalStatus,
      statusColor: item.statusColor,
      statusCategory: item.statusCategory,
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
      showToast('error', 'Cannot Delete', 'This status is already in use');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    const updated = statuses.filter(item => item.id !== deleteTarget.id);
    setStatuses(updated);
    showToast('success', 'Deleted', `${deleteTarget.statusName} has been deleted`);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // ============================================
  // STATUS TOGGLE
  // ============================================
  const handleStatusToggle = (id, name, currentStatus) => {
    if (!id) {
      showToast('error', 'Error', 'Invalid record ID');
      return;
    }

    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    setStatusAction({
      id: id,
      name: name || 'Record',
      newStatus: newStatus
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    if (!statusAction.id) {
      showToast('error', 'Error', 'Invalid record ID');
      setShowStatusModal(false);
      return;
    }

    const { id, newStatus, name } = statusAction;

    const updated = statuses.map(item =>
      item.id === id
        ? {
          ...item,
          status: newStatus,
          modifiedBy: 'Admin',
          modifiedDate: new Date().toISOString()
        }
        : item
    );
    setStatuses(updated);
    
    showToast('success', 'Status Updated', `${name} is now ${newStatus}`);
    setShowStatusModal(false);
    setStatusAction({ id: null, newStatus: null, name: '' });
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, statusCode: generateStatusCode() }));
    setShowForm(true);
  };

  return (
    <div className="cert-root">
      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Candidate Status Master</h1>
          <p className="cert-subtitle">Manage candidate statuses for recruitment process</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Candidate Status
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
              <div className="cert-section-label">Candidate Status Details</div>
              <div className="cert-form-grid-3col">

                {/* Status Code - Auto */}
                <div className="cert-field-compact">
                  <label>Status Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.statusCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated</small>
                </div>

                {/* Status Name - Required */}
                <div className={`cert-field-compact ${touched.statusName && errors.statusName ? 'has-error' : ''}`}>
                  <label className="required">Status Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Applied, Under Review"
                    value={formData.statusName}
                    onChange={(e) => handleChange('statusName', e.target.value)}
                    onBlur={() => handleBlur('statusName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.statusName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Max 100 characters, no special characters</small>
                </div>

                {/* Display Order - Required */}
                <div className={`cert-field-compact ${touched.displayOrder && errors.displayOrder ? 'has-error' : ''}`}>
                  <label className="required">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 1, 2, 3"
                    value={formData.displayOrder}
                    onChange={(e) => handleChange('displayOrder', e.target.value)}
                    onBlur={() => handleBlur('displayOrder')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.displayOrder} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Must be unique positive number</small>
                </div>

                {/* Final Status */}
                <div className="cert-field-compact">
                  <label>Final Status</label>
                  <select
                    value={formData.finalStatus}
                    onChange={(e) => handleChange('finalStatus', e.target.value === 'true')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Is this a final status?</small>
                </div>

                {/* Status Color */}
                <div className="cert-field-compact">
                  <label>Status Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="color"
                      value={formData.statusColor}
                      onChange={(e) => handleChange('statusColor', e.target.value)}
                      style={{
                        width: '40px',
                        height: '40px',
                        padding: '2px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {presetColors.map(color => (
                        <div
                          key={color}
                          onClick={() => handleChange('statusColor', color)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: color,
                            border: formData.statusColor === color ? '2px solid #1e293b' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Category - Required */}
                <div className={`cert-field-compact ${touched.statusCategory && errors.statusCategory ? 'has-error' : ''}`}>
                  <label className="required">Status Category</label>
                  <select
                    value={formData.statusCategory}
                    onChange={(e) => handleChange('statusCategory', e.target.value)}
                    onBlur={() => handleBlur('statusCategory')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Category</option>
                    {statusCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.statusCategory} />
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
                <FaSave size={12} /> {editingStatus ? 'Update' : 'Save'}
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
                    <th>Status Code</th>
                    <th>Status Name</th>
                    <th style={{ textAlign: 'center' }}>Order</th>
                    <th style={{ textAlign: 'center' }}>Final</th>
                    <th>Color</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStatuses.length > 0 ? (
                    currentStatuses.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {item.statusCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.statusName}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#ede9fe',
                            color: '#6d28d9',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {item.displayOrder}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {getFinalStatusBadge(item.finalStatus)}
                        </td>
                        <td>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: item.statusColor,
                              border: '2px solid #e2e8f0'
                            }} />
                            <span style={{
                              fontSize: '11px',
                              color: '#6b7280',
                              fontFamily: 'monospace'
                            }}>
                              {item.statusColor}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            background: '#e0e7ff',
                            color: '#3730a3',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {item.statusCategory}
                          </span>
                        </td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(
                              item.id,
                              item.statusName,
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
                      <td colSpan="10" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No candidate statuses found
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} candidate statuses
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
        <div 
          className="emp-modal-overlay" 
          onClick={() => {
            setShowStatusModal(false);
            setStatusAction({ id: null, newStatus: null, name: '' });
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="emp-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div 
              className="emp-modal-icon"
              style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '16px'
              }}
            >
              {statusAction.newStatus === 'Active' ? '✅' : '⛔'}
            </div>
            <h3 
              className="emp-modal-title"
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                textAlign: 'center',
                marginBottom: '12px'
              }}
            >
              Confirm Status Change
            </h3>
            <p 
              className="emp-modal-body"
              style={{
                fontSize: '14px',
                color: '#475569',
                textAlign: 'center',
                marginBottom: '8px',
                lineHeight: '1.5'
              }}
            >
              Are you sure you want to{' '}
              <strong style={{ color: '#9d174d' }}>
                {statusAction.newStatus === 'Active' ? 'activate' : 'deactivate'}
              </strong>{' '}
              <strong>{statusAction.name || 'this record'}</strong>?
            </p>
            <p 
              className="emp-modal-warn"
              style={{
                fontSize: '13px',
                color: statusAction.newStatus === 'Inactive' ? '#dc2626' : '#059669',
                textAlign: 'center',
                marginBottom: '24px',
                padding: '8px 12px',
                background: statusAction.newStatus === 'Inactive' ? '#fef2f2' : '#ecfdf5',
                borderRadius: '8px'
              }}
            >
              {statusAction.newStatus === 'Inactive'
                ? 'Inactive statuses cannot be used in recruitment process.'
                : 'This status will become available for selection.'}
            </p>
            <div 
              className="emp-modal-actions"
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}
            >
              <button
                className="emp-modal-cancel"
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusAction({ id: null, newStatus: null, name: '' });
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                className="emp-modal-confirm"
                onClick={confirmStatusChange}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: statusAction.newStatus === 'Active' ? '#10b981' : '#9d174d',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Confirm
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

export default CandidateStatusMaster;