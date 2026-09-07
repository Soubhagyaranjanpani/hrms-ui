import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle,
  FaTag, FaList, FaInfoCircle, FaClock, FaCalendarAlt
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../../config/api.config';

const NoticePeriodMaster = () => {
  // ─── State Management ──────────────────────────────────────
  const [noticePeriods, setNoticePeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
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
    noticePeriodCode: '',
    noticePeriodName: '',
    numberOfDays: '',
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

  // ─── Fetch all notice periods from API ─────────────────────
  const fetchNoticePeriods = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/fetchallNoticePeriod`, getAxiosConfig());
      const data = res.data; // Array of notice periods
      const mapped = data.map(item => ({
        ...item,
        // Map 'y'/'n' to 'Active'/'Inactive' for UI consistency
        status: item.status === 'y' ? 'Active' : 'Inactive',
        // Ensure days is treated as string for form input
        numberOfDays: item.days !== undefined ? item.days.toString() : '0',
        // Alias fields to match the original component's expectations
        noticePeriodCode: item.periodCode,
        noticePeriodName: item.periodName,
      }));
      setNoticePeriods(mapped);
    } catch (err) {
      console.error('Fetch notice periods error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch notice periods');
      setNoticePeriods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchNoticePeriods();
  }, [fetchNoticePeriods]);

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

  const generateNoticePeriodCode = () => {
    const maxId = noticePeriods.reduce((max, item) => Math.max(max, item.id || 0), 0);
    const count = maxId + 1;
    const prefix = 'NP';
    const padded = String(count).padStart(3, '0');
    return `${prefix}${padded}`;
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const totalPages = Math.ceil(filteredPeriods.length / rowsPerPage);
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  // ─── Filter & pagination ───────────────────────────────────
  const filteredPeriods = noticePeriods.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      item.noticePeriodCode?.toLowerCase().includes(search) ||
      item.noticePeriodName?.toLowerCase().includes(search) ||
      item.numberOfDays?.toString().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search))
    );
  });

  const totalItems = filteredPeriods.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentPeriods = filteredPeriods.slice(startIndex, startIndex + rowsPerPage);

  // ─── Form validation ───────────────────────────────────────
  const resetForm = () => {
    setFormData({
      noticePeriodCode: generateNoticePeriodCode(),
      noticePeriodName: '',
      numberOfDays: '',
      description: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingPeriod(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'noticePeriodName') {
      if (!value) {
        error = 'Notice Period Name is required';
      } else if (value.length > 100) {
        error = 'Notice Period Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        const duplicate = noticePeriods.some(item =>
          item.noticePeriodName.toLowerCase() === value.toLowerCase() &&
          (!editingPeriod || item.id !== editingPeriod.id)
        );
        if (duplicate) {
          error = 'Notice Period Name must be unique';
        }
      }
    } else if (field === 'numberOfDays') {
      if (value === '' || value === null || value === undefined) {
        error = 'Number of Days is required';
      } else if (isNaN(value) || !Number.isInteger(Number(value))) {
        error = 'Must be a whole number';
      } else if (Number(value) < 0) {
        error = 'Must be 0 or greater';
      } else if (Number(value) > 365) {
        error = 'Cannot exceed 365 days';
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
    const fieldsToValidate = ['noticePeriodName', 'numberOfDays'];
    const newErrors = {};
    for (const field of fieldsToValidate) {
      if (!formData[field] && formData[field] !== 0) {
        newErrors[field] = 'This field is required';
      }
    }
    if (formData.noticePeriodName) {
      if (formData.noticePeriodName.length > 100) {
        newErrors.noticePeriodName = 'Notice Period Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.noticePeriodName)) {
        newErrors.noticePeriodName = 'No special characters allowed';
      } else {
        const duplicate = noticePeriods.some(item =>
          item.noticePeriodName.toLowerCase() === formData.noticePeriodName.toLowerCase() &&
          (!editingPeriod || item.id !== editingPeriod.id)
        );
        if (duplicate) {
          newErrors.noticePeriodName = 'Notice Period Name must be unique';
        }
      }
    }
    if (formData.numberOfDays !== '') {
      const days = Number(formData.numberOfDays);
      if (isNaN(days) || !Number.isInteger(days)) {
        newErrors.numberOfDays = 'Must be a whole number';
      } else if (days < 0) {
        newErrors.numberOfDays = 'Must be 0 or greater';
      } else if (days > 365) {
        newErrors.numberOfDays = 'Cannot exceed 365 days';
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
        periodCode: formData.noticePeriodCode,
        periodName: formData.noticePeriodName,
        days: Number(formData.numberOfDays),
        description: formData.description || '',
        status: formData.status === 'Active' ? 'y' : 'n'
      };

      if (editingPeriod) {
        // Update existing
        const res = await axios.put(
          `${BASE_URL}/updateNoticePeriod/${editingPeriod.id}`,
          payload,
          getAxiosConfig()
        );
        toast.success('Success', 'Notice period updated successfully');
      } else {
        // Create new
        const res = await axios.post(
          `${BASE_URL}/saveNoticePeriod`,
          payload,
          getAxiosConfig()
        );
        toast.success('Success', 'Notice period added successfully');
      }

      resetForm();
      setShowForm(false);
      setPage(0);
      await fetchNoticePeriods();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      toast.warning('Cannot Edit', 'Inactive notice periods cannot be edited');
      return;
    }
    setEditingPeriod(item);
    setFormData({
      noticePeriodCode: item.noticePeriodCode,
      noticePeriodName: item.noticePeriodName,
      numberOfDays: item.numberOfDays,
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
    // Since there is no dedicated delete endpoint, we deactivate the record
    try {
      await axios.put(
        `${BASE_URL}/updateNoticePeriodPeriod/${deleteTarget.id}`,
        null,
        getAxiosConfig()
      );
      toast.success('Deactivated', `${deleteTarget.noticePeriodName} has been deactivated`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchNoticePeriods();
    } catch (err) {
      console.error('Delete (deactivate) error:', err);
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
        `${BASE_URL}/updateNoticePeriodPeriod/${statusAction.id}`,
        null,
        getAxiosConfig()
      );
      toast.success('Status Updated', `${statusAction.name} is now ${statusAction.newStatus}`);
      setShowStatusModal(false);
      await fetchNoticePeriods();
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
    setFormData(prev => ({ ...prev, noticePeriodCode: generateNoticePeriodCode() }));
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // ─── Render ────────────────────────────────────────────────
  if (loading && noticePeriods.length === 0) {
    return <LoadingSpinner message="Loading notice periods..." />;
  }

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Notice Period Master</h1>
          <p className="cert-subtitle">Manage notice periods for candidate evaluation</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Notice Period
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
              <div className="cert-section-label">Notice Period Details</div>
              <div className="cert-form-grid-3col">

                {/* Notice Period Code - Auto */}
                <div className="cert-field-compact">
                  <label className="required">Notice Period Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.noticePeriodCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Auto-generated unique identifier
                  </small>
                </div>

                {/* Notice Period Name - Required */}
                <div className={`cert-field-compact ${touched.noticePeriodName && errors.noticePeriodName ? 'has-error' : ''}`}>
                  <label className="required">Notice Period Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Immediate, 30 Days, 2 Months"
                    value={formData.noticePeriodName}
                    onChange={(e) => handleChange('noticePeriodName', e.target.value)}
                    onBlur={() => handleBlur('noticePeriodName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.noticePeriodName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Display name shown to recruiters
                  </small>
                </div>

                {/* Number of Days - Required */}
                <div className={`cert-field-compact ${touched.numberOfDays && errors.numberOfDays ? 'has-error' : ''}`}>
                  <label className="required">Number of Days</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    placeholder="Enter days"
                    value={formData.numberOfDays}
                    onChange={(e) => handleChange('numberOfDays', e.target.value)}
                    onBlur={() => handleBlur('numberOfDays')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.numberOfDays} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Actual notice period in days (0-365)
                  </small>
                </div>

                {/* Description - Text Area */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 2' }}>
                  <label>Description</label>
                  <textarea
                    rows="3"
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
                    Additional explanation about the notice period
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
                  <><span className="cert-spinner" /> {editingPeriod ? 'Updating…' : 'Saving…'}</>
                ) : (
                  <><FaSave size={12} /> {editingPeriod ? 'Update' : 'Save'}</>
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
                placeholder="Search by code, name, days or description..."
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
                    <th>Period Code</th>
                    <th>Period Name</th>
                    <th style={{ textAlign: 'center' }}>Days</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPeriods.length > 0 ? (
                    currentPeriods.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {item.noticePeriodCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.noticePeriodName}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            padding: '2px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}>
                            {item.numberOfDays}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(item.id, item.noticePeriodName, item.status)}
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
                      <td colSpan="7" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No notice periods found
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} periods
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
                ? 'Inactive notice periods cannot be used for new recruitment transactions.'
                : 'This notice period will become available for selection.'}
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
            <h3 className="emp-modal-title">Deactivate Notice Period</h3>
            <p className="emp-modal-body">
              Are you sure you want to deactivate <strong>{deleteTarget?.noticePeriodName}</strong>?
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

export default NoticePeriodMaster;