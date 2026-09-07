import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle,
  FaTag, FaList, FaInfoCircle, FaClock
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../../config/api.config';

const OfferStatusMaster = () => {
  // ─── State Management ──────────────────────────────────────
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    offerStatusCode: '',
    offerStatusName: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── Token helpers ─────────────────────────────────────────
  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const getAxiosConfig = () => ({
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  });
  const ensureToken = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication Required', 'Please login to continue');
      return false;
    }
    return true;
  };

  // ─── Fetch all offer statuses from API ─────────────────────
  const fetchStatuses = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/fetchallOfferStatus`, getAxiosConfig());
      const data = res.data; // Array of offer statuses
      const mapped = data.map(item => ({
        id: item.id,
        offerStatusCode: item.statusCode,
        offerStatusName: item.statusName,
        description: item.description || '',
        status: item.status === 'y' ? 'Active' : 'Inactive',
        createdBy: item.lastChangeBy || null,
        createdDate: item.lastchangeAt || null,
        modifiedBy: null,
        modifiedDate: null
      }));
      setStatuses(mapped);
    } catch (err) {
      console.error('Fetch offer statuses error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch offer statuses');
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // ─── Filter & pagination ───────────────────────────────────
  const filteredStatuses = statuses.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.offerStatusCode?.toLowerCase().includes(search) ||
      item.offerStatusName?.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search));
  });

  const totalItems = filteredStatuses.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentStatuses = filteredStatuses.slice(startIndex, startIndex + rowsPerPage);

  // ─── Utility functions ─────────────────────────────────────
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

  const generateOfferStatusCode = () => {
    const maxId = statuses.reduce((max, item) => Math.max(max, item.id || 0), 0);
    const count = maxId + 1;
    const prefix = 'OFF';
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

  // ─── Form validation ───────────────────────────────────────
  const resetForm = () => {
    setFormData({
      offerStatusCode: generateOfferStatusCode(),
      offerStatusName: '',
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

  const validateField = (field, value) => {
    let error = '';
    if (field === 'offerStatusName') {
      if (!value) {
        error = 'Offer Status Name is required';
      } else if (value.length > 100) {
        error = 'Status Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        const duplicate = statuses.some(item =>
          item.offerStatusName.toLowerCase() === value.toLowerCase() &&
          (!editingStatus || item.id !== editingStatus.id)
        );
        if (duplicate) {
          error = 'Status Name must be unique';
        }
      }
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = ['offerStatusName'];
    const newErrors = {};
    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }
    if (formData.offerStatusName) {
      if (formData.offerStatusName.length > 100) {
        newErrors.offerStatusName = 'Status Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.offerStatusName)) {
        newErrors.offerStatusName = 'No special characters allowed';
      } else {
        const duplicate = statuses.some(item =>
          item.offerStatusName.toLowerCase() === formData.offerStatusName.toLowerCase() &&
          (!editingStatus || item.id !== editingStatus.id)
        );
        if (duplicate) {
          newErrors.offerStatusName = 'Status Name must be unique';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── CRUD Operations ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        statusCode: formData.offerStatusCode,
        statusName: formData.offerStatusName,
        description: formData.description || '',
        status: formData.status === 'Active' ? 'y' : 'n'
      };

      if (editingStatus) {
        await axios.put(
          `${BASE_URL}/updateOfferStatus/${editingStatus.id}`,
          payload,
          getAxiosConfig()
        );
        toast.success('Success', 'Offer status updated successfully');
      } else {
        await axios.post(
          `${BASE_URL}/saveOfferStatus`,
          payload,
          getAxiosConfig()
        );
        toast.success('Success', 'Offer status added successfully');
      }

      resetForm();
      setShowForm(false);
      setPage(0);
      await fetchStatuses();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      toast.warning('Cannot Edit', 'Inactive statuses cannot be edited');
      return;
    }
    setEditingStatus(item);
    setFormData({
      offerStatusCode: item.offerStatusCode,
      offerStatusName: item.offerStatusName,
      description: item.description || '',
      status: item.status
    });
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!ensureToken()) return;
    try {
      // Since there is no dedicated delete endpoint, we deactivate by toggling status
      await axios.put(
        `${BASE_URL}/updateOfferStatusStatus/${deleteTarget.id}`,
        null,
        getAxiosConfig()
      );
      toast.success('Deactivated', `${deleteTarget.offerStatusName} has been deactivated`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchStatuses();
    } catch (err) {
      console.error('Deactivate error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to deactivate');
    }
  };

  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({ id, name, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    try {
      await axios.put(
        `${BASE_URL}/updateOfferStatusStatus/${statusAction.id}`,
        null,
        getAxiosConfig()
      );
      toast.success('Status Updated', `${statusAction.name} is now ${statusAction.newStatus}`);
      setShowStatusModal(false);
      await fetchStatuses();
    } catch (err) {
      console.error('Status change error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, offerStatusCode: generateOfferStatusCode() }));
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // ─── Render ────────────────────────────────────────────────
  if (loading && statuses.length === 0) {
    return <LoadingSpinner message="Loading offer statuses..." />;
  }

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Offer Status Master</h1>
          <p className="cert-subtitle">Manage offer statuses for candidate offer management</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Offer Status
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
        /* ─── FORM SECTION ─── */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Offer Status Details</div>
              <div className="cert-form-grid-3col">

                {/* Offer Status Code - Auto */}
                <div className="cert-field-compact">
                  <label className="required">Offer Status Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.offerStatusCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Auto-generated unique identifier
                  </small>
                </div>

                {/* Offer Status Name - Required */}
                <div className={`cert-field-compact ${touched.offerStatusName && errors.offerStatusName ? 'has-error' : ''}`}>
                  <label className="required">Offer Status Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Draft, Released, Accepted"
                    value={formData.offerStatusName}
                    onChange={(e) => handleChange('offerStatusName', e.target.value)}
                    onBlur={() => handleBlur('offerStatusName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.offerStatusName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Max 100 characters, no special characters
                  </small>
                </div>

                {/* Description - Text Area */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 1' }}>
                  <label>Description</label>
                  <textarea
                    rows="2"
                    placeholder="Enter description (optional)"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    style={{ 
                      fontSize: '14px', 
                      padding: '6px 12px', 
                      resize: 'vertical', 
                      minHeight: '80px',
                      width: '100%'
                    }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Additional explanation about the purpose of the status
                  </small>
                </div>

              </div>
            </div>

            {/* Form Actions */}
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>
                <FaTimes size={12} /> Cancel
              </button>
              <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting ? (
                  <><span className="cert-spinner" /> {editingStatus ? 'Updating…' : 'Saving…'}</>
                ) : (
                  <><FaSave size={12} /> {editingStatus ? 'Update' : 'Save'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ─── TABLE SECTION ─── */
        <>
          {/* Search Bar */}
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name or description..."
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
                            {item.offerStatusCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.offerStatusName}</strong>
                        </td>
                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(item.id, item.offerStatusName, item.status)}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '16px',
                                borderRadius: '50px',
                                backgroundColor: item.status === 'Active' ? '#9d174d' : '#d1d5db',
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
                                  left: item.status === 'Active' ? '14px' : '2px',
                                  transition: '.2s'
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: item.status === 'Active' ? '#9d174d' : '#94a3b8'
                              }}
                            >
                              {item.status}
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
                            <button
                              className="cert-act cert-act--delete"
                              onClick={() => handleDelete(item)}
                              title="Deactivate"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#dc3545'
                              }}
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No offer statuses found
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} statuses
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

      {/* ─── STATUS CHANGE MODAL ─── */}
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
                ? 'Inactive offer statuses cannot be used for new offer transactions.'
                : 'This offer status will become available for selection.'}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE (DEACTIVATE) MODAL ─── */}
      {showDeleteModal && (
        <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">🗑️</div>
            <h3 className="emp-modal-title">Deactivate Offer Status</h3>
            <p className="emp-modal-body">
              Are you sure you want to deactivate <strong>{deleteTarget?.offerStatusName}</strong>?
            </p>
            <p className="emp-modal-warn">
              The record will be set to inactive and cannot be edited until reactivated.
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmDelete}>Deactivate</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cert-table-row-hover:hover {
          background-color: #f9fafb;
          transition: background-color 0.2s ease;
        }
        .cert-spinner {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;
          border-top-color: #fff; animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .has-error input, .has-error textarea {
          border-color: #dc3545 !important;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25) !important;
        }
        .text-danger.small {
          color: #dc3545;
          font-size: 12px;
          display: block;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

// ─── Field Error Component ────────────────────────────────────
const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default OfferStatusMaster;