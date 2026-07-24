import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash, 
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaCircle
} from 'react-icons/fa';

// Simple toast notification function (no external dependency)
const showToast = (type, title, message) => {
  // You can replace this with your actual toast implementation
  // For now, using alert for demonstration
  // Or you can import from your actual toast path
  console.log(`${type}: ${title} - ${message}`);
  
  // If you want to use alert (temporary):
  // alert(`${title}\n${message}`);
  
  // Better: Use a simple DOM-based notification
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};color:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:300px;margin-bottom:8px;">
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
  return container;
};

const SourceManagement = () => {
  // State for sources
  const [sources, setSources] = useState([
    { 
      id: 1, 
      sourceCode: 'SRC001', 
      sourceName: 'LinkedIn', 
      category: 'Online', 
      description: 'Professional networking platform',
      displayOrder: 1,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    { 
      id: 2, 
      sourceCode: 'SRC002', 
      sourceName: 'Naukri.com', 
      category: 'Online', 
      description: 'Leading job portal in India',
      displayOrder: 2,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-20T14:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    { 
      id: 3, 
      sourceCode: 'SRC003', 
      sourceName: 'Employee Referral', 
      category: 'Referral', 
      description: 'Referrals from existing employees',
      displayOrder: 3,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-01T09:15:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    { 
      id: 4, 
      sourceCode: 'SRC004', 
      sourceName: 'Campus Recruitment', 
      category: 'Campus', 
      description: 'College campus placements',
      displayOrder: 4,
      status: 'Inactive',
      createdBy: 'Admin',
      createdDate: '2026-02-10T11:45:00Z',
      modifiedBy: 'Admin',
      modifiedDate: '2026-07-20T16:30:00Z'
    },
    { 
      id: 5, 
      sourceCode: 'SRC005', 
      sourceName: 'Consultancy', 
      category: 'Agency', 
      description: 'External recruitment agencies',
      displayOrder: 5,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-05T08:50:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    { 
      id: 6, 
      sourceCode: 'SRC006', 
      sourceName: 'Walk-in', 
      category: 'Direct', 
      description: 'Walk-in candidates',
      displayOrder: 6,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-04-12T13:10:00Z',
      modifiedBy: null,
      modifiedDate: null
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
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
    sourceCode: '',
    sourceName: '',
    category: '',
    description: '',
    displayOrder: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Category options
  const categories = [
    { value: 'Online', label: 'Online' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Campus', label: 'Campus' },
    { value: 'Agency', label: 'Agency' },
    { value: 'Direct', label: 'Direct' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Other', label: 'Other' }
  ];

  // Filtered sources
  const filteredSources = sources.filter(src => {
    const search = searchTerm.toLowerCase();
    return src.sourceCode.toLowerCase().includes(search) ||
           src.sourceName.toLowerCase().includes(search) ||
           src.category.toLowerCase().includes(search) ||
           (src.description && src.description.toLowerCase().includes(search));
  });

  // Pagination
  const totalItems = filteredSources.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentSources = filteredSources.slice(startIndex, startIndex + rowsPerPage);

  // Format date
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

  // Get pagination range
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

  // Generate source code
  const generateSourceCode = () => {
    const count = sources.length + 1;
    const prefix = 'SRC';
    const padded = String(count).padStart(3, '0');
    return `${prefix}${padded}`;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      sourceCode: generateSourceCode(),
      sourceName: '',
      category: '',
      description: '',
      displayOrder: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingSource(null);
  };

  // Handle form field change
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  // Validate field
  const validateField = (field, value) => {
    let error = '';

    if (field === 'sourceName') {
      if (!value) {
        error = 'Source Name is required';
      } else if (value.length > 100) {
        error = 'Source Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        // Check uniqueness (excluding current editing source)
        const duplicate = sources.some(src => 
          src.sourceName.toLowerCase() === value.toLowerCase() && 
          (!editingSource || src.id !== editingSource.id)
        );
        if (duplicate) {
          error = 'Source Name must be unique';
        }
      }
    } else if (field === 'category' && !value) {
      error = 'Category is required';
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  // Handle blur
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // Validate form
  const validateForm = () => {
    const fieldsToValidate = ['sourceName', 'category'];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }

    // Additional validation for sourceName
    if (formData.sourceName) {
      if (formData.sourceName.length > 100) {
        newErrors.sourceName = 'Source Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.sourceName)) {
        newErrors.sourceName = 'No special characters allowed';
      } else {
        const duplicate = sources.some(src => 
          src.sourceName.toLowerCase() === formData.sourceName.toLowerCase() && 
          (!editingSource || src.id !== editingSource.id)
        );
        if (duplicate) {
          newErrors.sourceName = 'Source Name must be unique';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('warning', 'Validation Error', 'Please fix the highlighted fields');
      return;
    }

    const sourceData = {
      sourceCode: formData.sourceCode,
      sourceName: formData.sourceName,
      category: formData.category,
      description: formData.description || '',
      displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : null,
      status: formData.status
    };

    if (editingSource) {
      // Update existing source
      const updated = sources.map(src =>
        src.id === editingSource.id
          ? { 
              ...src, 
              ...sourceData,
              modifiedBy: 'Admin',
              modifiedDate: new Date().toISOString()
            }
          : src
      );
      setSources(updated);
      showToast('success', 'Success', 'Recruitment source updated successfully');
    } else {
      // Add new source
      const newSource = {
        id: Date.now(),
        ...sourceData,
        createdBy: 'Admin',
        createdDate: new Date().toISOString(),
        modifiedBy: null,
        modifiedDate: null
      };
      setSources([newSource, ...sources]);
      showToast('success', 'Success', 'Recruitment source added successfully');
    }

    resetForm();
    setShowForm(false);
    setPage(0);
  };

  // Handle edit
  const handleEdit = (source) => {
    if (source.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive sources cannot be edited');
      return;
    }
    setEditingSource(source);
    setFormData({
      sourceCode: source.sourceCode,
      sourceName: source.sourceName,
      category: source.category,
      description: source.description || '',
      displayOrder: source.displayOrder ? String(source.displayOrder) : '',
      status: source.status
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = (source) => {
    setDeleteTarget(source);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // Check if source is used (simulated - in real app, check from backend)
    const isUsed = false; // Replace with actual check
    
    if (isUsed) {
      showToast('error', 'Cannot Delete', 'This source is already in use and cannot be deleted');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    const updated = sources.filter(src => src.id !== deleteTarget.id);
    setSources(updated);
    showToast('success', 'Deleted', `${deleteTarget.sourceName} has been deleted`);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // Handle status toggle
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
    const updated = sources.map(src =>
      src.id === id
        ? { 
            ...src, 
            status: newStatus,
            modifiedBy: 'Admin',
            modifiedDate: new Date().toISOString()
          }
        : src
    );
    setSources(updated);
    setShowStatusModal(false);
    showToast('success', 'Status Updated', `${statusAction.name} is now ${newStatus}`);
  };

  // Cancel form
  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  // Add new source
  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, sourceCode: generateSourceCode() }));
    setShowForm(true);
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Recruitment Sources</h1>
          <p className="cert-subtitle">Manage recruitment sources for candidate registration</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Recruitment Source
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

      {showForm ? (
        /* Form Section */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Recruitment Source Details</div>
              <div className="cert-form-grid-3col">
                {/* Source Code - Auto */}
                <div className="cert-field-compact">
                  <label>Source Code</label>
                  <input 
                    type="text" 
                    className="form-control bg-light" 
                    value={formData.sourceCode} 
                    readOnly 
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated</small>
                </div>

                {/* Source Name - Required */}
                <div className={`cert-field-compact ${touched.sourceName && errors.sourceName ? 'has-error' : ''}`}>
                  <label className="required">Source Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., LinkedIn, Naukri.com" 
                    value={formData.sourceName}
                    onChange={(e) => handleChange('sourceName', e.target.value)}
                    onBlur={() => handleBlur('sourceName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.sourceName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Max 100 characters, no special characters</small>
                </div>

                {/* Category - Required */}
                <div className={`cert-field-compact ${touched.category && errors.category ? 'has-error' : ''}`}>
                  <label className="required">Source Category</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => handleChange('category', e.target.value)}
                    onBlur={() => handleBlur('category')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.category} />
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

                {/* Display Order */}
                <div className="cert-field-compact">
                  <label>Display Sequence</label>
                  <input 
                    type="number" 
                    placeholder="e.g., 1, 2, 3" 
                    value={formData.displayOrder}
                    onChange={(e) => handleChange('displayOrder', e.target.value)}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Optional - determines display order</small>
                </div>

            
              </div>
            </div>

            {/* Form Actions */}
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>
                <FaTimes size={12} /> Cancel
              </button>
             
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingSource ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Table Section */
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
                    <th>Source Code</th>
                    <th>Source Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Display Order</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th>Last Modified</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSources.length > 0 ? (
                    currentSources.map((src, idx) => (
                      <tr key={src.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {src.sourceCode}
                          </span>
                        </td>
                        <td>
                          <strong>{src.sourceName}</strong>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{ 
                            background: '#e0e7ff', 
                            color: '#4f46e5',
                            fontSize: '12px',
                            padding: '2px 10px'
                          }}>
                            {src.category}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {src.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {src.displayOrder || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(
                              src.id,
                              src.sourceName,
                              src.status || 'Active'
                            )}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '16px',
                                borderRadius: '50px',
                                backgroundColor: (src.status || 'Active') === 'Active' ? '#9d174d' : '#d1d5db',
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
                                  left: (src.status || 'Active') === 'Active' ? '14px' : '2px',
                                  transition: '.2s'
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: (src.status || 'Active') === 'Active' ? '#9d174d' : '#94a3b8'
                              }}
                            >
                              {src.status || 'Active'}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: '#6b7280' }}>
                          {src.modifiedDate ? formatDate(src.modifiedDate) : formatDate(src.createdDate)}
                        </td>
                        <td>
                          <div className="cert-actions" style={{ justifyContent: 'center' }}>
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(src)} 
                              title={src.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={src.status === 'Inactive'}
                              style={{ 
                                opacity: src.status === 'Inactive' ? 0.5 : 1,
                                cursor: src.status === 'Inactive' ? 'not-allowed' : 'pointer'
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
                      <td colSpan="9" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No recruitment sources found
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} sources
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

      {/* Status Change Modal */}
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
                ? 'Inactive sources cannot be selected during candidate registration.'
                : 'This source will become available for candidate registration.'}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">🗑️</div>
            <h3 className="emp-modal-title">Confirm Delete</h3>
            <p className="emp-modal-body">
              Are you sure you want to delete <strong>{deleteTarget.sourceName}</strong>?
            </p>
            <p className="emp-modal-warn" style={{ color: '#dc2626' }}>
              {deleteTarget.status === 'Active' 
                ? 'This source is currently active. It cannot be deleted if already used in candidate registrations.'
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

// Field Error Component
const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default SourceManagement;