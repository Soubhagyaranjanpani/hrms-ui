import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit,
  FaArrowLeft, FaExclamationCircle
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../../config/api.config';

const RejectionReasonMaster = () => {
  // ============================================
  // STATE
  // ============================================
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingReason, setEditingReason] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [categories, setCategories] = useState([]);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: '',
    newStatus: '',
  });

  // Form state (matches Backend DTO)
  const [formData, setFormData] = useState({
    reasonCode: '',
    reasonName: '',
    reasonCategory: '',
    description: '',
    reasonCategoryId: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // AUTH HELPERS
  // ============================================
  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  };

  const ensureToken = () => {
    if (!getAuthToken()) {
      toast.error('Authentication Required', 'Please login to continue');
      return false;
    }
    return true;
  };



  // ============================================
  // FETCH
  // ============================================
  const fetchReasons = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/recuirment/getAllRejectionReason`,
        axiosConfig
      );
      const list = Array.isArray(res.data) ? res.data : (res.data?.response || []);

      const mapped = list.map((item) => {
        const isActive =
          String(item.status ?? '').toLowerCase() === 'y' || item.status === true;
        return {
          id: item.id,
          reasonCode: item.reasonCode || '',
          reasonName: item.reasonName || '',
          reasonCategory: item.reasonCategory || '',
          reasonCategoryId: item.reasonCategoryId || '',
          description: item.description || '',
          status: isActive ? 'Active' : 'Inactive',
          createdBy: item.createdBy || '—',
          createdDate: item.createdDate || null,
          modifiedBy: item.modifiedBy || null,
          modifiedDate: item.modifiedDate || null,
        };
      });


      setReasons(mapped);
      console.log('🔵 dp:', reasons);
      console.log('🔵 [fetchReasons] og:', res);
    } catch (err) {
      console.error('🔴 [fetchReasons] error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch rejection reasons');
      setReasons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategory = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/api/recuirment/getAllReasonCategory`,
        axiosConfig
      );

      setCategories(res.data || []);

    } catch (err) {
      console.error('🔴 [fetchCategory] error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch reason categories');
      setCategories([]);
    }
  }, []);


  useEffect(() => {
    fetchReasons();
    fetchCategory();
  }, [fetchReasons, fetchCategory]);

  // ============================================
  // DEBOUNCED SEARCH
  // ============================================
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ============================================
  // FILTERED + PAGINATED DATA
  // ============================================
  const filteredReasons = reasons
    .filter((item) => {
      const search = debouncedSearch.toLowerCase();
      return (
        item.reasonCode?.toLowerCase().includes(search) ||
        item.reasonName?.toLowerCase().includes(search) ||
        item.reasonCategory?.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      if (a.status === 'Active' && b.status === 'Inactive') return -1;
      if (a.status === 'Inactive' && b.status === 'Active') return 1;
      return 0;
    });

  const totalItems = filteredReasons.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentReasons = filteredReasons.slice(startIndex, startIndex + rowsPerPage);

  // ============================================
  // UTILITIES
  // ============================================
  const generateReasonCode = () =>
    `RR${String(reasons.length + 1).padStart(3, '0')}`;

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    if (left > 0) {
      range.push(0);
      if (left > 1) range.push('...');
    }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) {
      if (right < totalPages - 2) range.push('...');
      range.push(totalPages - 1);
    }
    return range;
  };

  // ============================================
  // FORM HANDLERS
  // ============================================
  const resetForm = () => {
    setFormData({
      reasonCode: generateReasonCode(),
      reasonName: '',
      reasonCategory: '',
      reasonCategoryId: '',
      description: '',
    });
    setErrors({});
    setTouched({});
    setEditingReason(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) validateField(field, value);
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'reasonName') {
      if (!value) error = 'Reason Name is required';
      else if (value.length > 100) error = 'Must be 100 characters or less';
      else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) error = 'No special characters allowed';
      else {
        const duplicate = reasons.some(
          (item) =>
            item.reasonName.toLowerCase() === value.toLowerCase() &&
            (!editingReason || item.id !== editingReason.id)
        );
        if (duplicate) error = 'Reason Name must be unique';
      }
    } else if (field === 'reasonCategory' && !value) {
      error = 'Reason Category is required';
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    debugger;
    const newErrors = {};
    if (!formData.reasonName) newErrors.reasonName = 'This field is required';
    if (!formData.reasonCategoryId) newErrors.reasonCategoryId= 'This field is required';

    if (formData.reasonName) {
      if (formData.reasonName.length > 100) {
        newErrors.reasonName = 'Must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.reasonName)) {
        newErrors.reasonName = 'No special characters allowed';
      } else {
        const duplicate = reasons.some(
          (item) =>
            item.reasonName.toLowerCase() === formData.reasonName.toLowerCase() &&
            (!editingReason || item.id !== editingReason.id)
        );
        if (duplicate) newErrors.reasonName = 'Reason Name must be unique';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  console.log('🔵 [formData]', formData);

  // ============================================
  // SUBMIT (Create / Update)
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    try {
      // ✅ Payload matches backend DTO
      const payload = {
        id: editingReason ? editingReason.id : 0,
        reasonCode: formData.reasonCode,
        reasonName: formData.reasonName.trim(),
        reasonCategoryId: formData.reasonCategoryId,
        // saveRejectionReason: 
        description: formData.description?.trim() || '',
        status: 'y',
      };

      console.log('formdata: ', formData);

      let res;
      if (editingReason) {
        res = await axios.put(
          `${BASE_URL}/api/recuirment/updateRejectionReasonById/${editingReason.id}`,
          payload,
          axiosConfig
        );
      } else {
        res = await axios.post(
          `${BASE_URL}/api/recuirment/saveRejectionReason`,
          payload,
          axiosConfig
        );
      }

      if (res.status === 200 || res.status === 201) {
        toast.success(
          'Success',
          editingReason ? 'Rejection reason updated' : 'Rejection reason created'
        );
        resetForm();
        setShowForm(false);
        setPage(0);
        fetchReasons();
      } else {
        throw new Error(res.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('🔴 [submit] error:', err);
      toast.error(
        'Error',
        err.response?.data?.message || err.message || 'Something went wrong'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      toast.warning('Cannot Edit', 'Inactive reasons cannot be edited');
      return;
    }
    setEditingReason(item);
    setFormData({
      reasonCode: item.reasonCode,
      reasonName: item.reasonName,
      reasonCategory: item.reasonCategory,
      reasonCategoryId: Number(item.reasonCategoryId),
      description: item.description || '',
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, reasonCode: generateReasonCode() }));
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // ============================================
  // STATUS TOGGLE (via Update endpoint)
  // ============================================
  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({ id, name, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    const { id, newStatus, name } = statusAction;
    setLoading(true);
    try {
      const target = reasons.find((r) => r.id === id);
      if (!target) throw new Error('Reason not found');


      const res = await axios.put(
        `${BASE_URL}/api/recuirment/updateRejectionReasonStatus/${id}`,
        { status: newStatus === 'Active' ? 'y' : 'n' },
        axiosConfig
      );

      if (res.status === 200) {
        toast.success('Status Updated', `${name} is now ${newStatus}`);
        fetchReasons();
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

  // ============================================
  // RENDER GUARD
  // ============================================
  if (loading && !showForm && reasons.length === 0) {
    return <LoadingSpinner message="Loading rejection reasons..." />;
  }

  return (
    <div className="cert-root">
      {/* HEADER */}
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
        /* ================= FORM ================= */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Rejection Reason Details</div>
              <div className="cert-form-grid-3col">

                <div className="cert-field-compact">
                  <label>Reason Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.reasonCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f8f9fc' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated</small>
                </div>

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
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Max 100 characters, no special characters
                  </small>
                </div>

                <div className={`cert-field-compact ${touched.reasonCategory && errors.reasonCategory ? 'has-error' : ''}`}>
                  <label className="required">Reason Category</label>
                  <select
  value={formData.reasonCategoryId ?? ''}
  onChange={(e) =>
    handleChange(
      'reasonCategoryId',
      e.target.value === '' ? '' : Number(e.target.value)
    )
  }
  onBlur={() => handleBlur('reasonCategoryId')}
  style={{ fontSize: '14px', padding: '6px 12px' }}
>
  <option value="">Select Category</option>

  {categories.map((cat) => (
    <option key={cat.id} value={Number(cat.id)}>
      {cat.reasonCategoryName}
    </option>
  ))}
</select>
                  <FieldError msg={errors.reasonCategoryId} />
                </div>

                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
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

            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleBackToList}>
                <FaTimes size={12} /> Cancel
              </button>
              <button
                type="submit"
                className="cert-add-btn"
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {submitting ? (
                  <><span className="emp-spinner" /> Saving…</>
                ) : (
                  <><FaSave size={12} /> {editingReason ? 'Update' : 'Save'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= TABLE ================= */
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name, category or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="emp-search-clear" onClick={() => setSearchTerm('')}>
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
                    <th>Reason Code</th>
                    <th>Reason Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
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
                        <td><strong>{item.reasonName}</strong></td>
                        <td>
                          <span className="cert-status-badge" style={{
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            fontSize: '12px',
                            padding: '2px 10px',
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
                            onClick={() => handleStatusToggle(item.id, item.reasonName, item.status)}
                          >
                            <div style={{
                              width: '28px',
                              height: '16px',
                              borderRadius: '50px',
                              backgroundColor: item.status === 'Active' ? '#9d174d' : '#d1d5db',
                              position: 'relative',
                              transition: '.2s',
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#fff',
                                position: 'absolute',
                                top: '2px',
                                left: item.status === 'Active' ? '14px' : '2px',
                                transition: '.2s',
                              }} />
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              color: item.status === 'Active' ? '#9d174d' : '#94a3b8',
                            }}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" style={{ justifyContent: 'center' }}>
                            <button
                              className="cert-act cert-act--edit"
                              onClick={() => handleEdit(item)}
                              disabled={item.status === 'Inactive'}
                              style={{ opacity: item.status === 'Inactive' ? 0.5 : 1 }}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No rejection reasons found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} reasons
                </div>
                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    className="cert-page-btn"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >← Prev</button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #e5e7eb',
                          background: pg === page ? '#9d174d' : 'white',
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          minWidth: '34px',
                        }}
                      >{pg + 1}</button>
                    )
                  )}
                  <button
                    className="cert-page-btn"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* STATUS CHANGE MODAL */}
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
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

export default RejectionReasonMaster;