import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaEdit,
  FaArrowLeft
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

const SourceManagement = () => {
  // ============================================
  // STATE
  // ============================================
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const [categories, setCategories] = useState([]);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, name: '', newStatus: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Dropdown refs
  const categoryRef = useRef(null);

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
  // FETCH SOURCES
  // ============================================
  const fetchSources = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/recruitment-source`, axiosConfig);
      const list = Array.isArray(res.data) ? res.data : (res.data?.response || []);

      const mapped = list.map((item) => {
        const isActive =
          String(item.status ?? '').toLowerCase() === 'y' ||
          item.status === true ||
          String(item.status ?? '').toLowerCase() === 'active';

        // ✅ Normalize category — could be a string, an object, or null
        // const category =
        //   typeof item.category === 'object' && item.category !== null
        //     ? (item.category.name || item.category.categoryName || '')
        //     : (item.category || '');
        const categoryId =
          typeof item.category === 'object' && item.category !== null
            ? item.category.id
            : item.categoryId ?? item.category ?? '';

        const categoryName =
          typeof item.category === 'object' && item.category !== null
            ? (item.category.name || item.category.categoryName || '')
            : '';

        return {
          id: item.id,
          sourceCode: item.sourceCode || '',
          sourceName: item.sourceName || '',
          categoryId: categoryId,
          categoryName: categoryName,
          description: item.description || '',
          displayOrder: item.displayOrder ?? '',
          status: isActive ? 'Active' : 'Inactive',
          createdBy: item.createdBy || '—',
          createdDate: item.createdDate || null,
          modifiedBy: item.modifiedBy || null,
          modifiedDate: item.modifiedDate || null
        };
      });

      setSources(mapped);
    } catch (err) {
      console.error('🔴 [fetchSources] error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch recruitment sources');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // FETCH CATEGORIES
  // ============================================
  const fetchCategories = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const response = await axios.get(
        `${BASE_URL}/api/source_category/list?flag=1`,
        axiosConfig
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error('[fetchCategories] error:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to fetch source categories');
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchSources();
    fetchCategories();
  }, [fetchSources, fetchCategories]);

  // ============================================
  // FILTER & PAGINATION
  // ============================================
  const filteredSources = sources.filter(src => {
    const search = searchTerm.toLowerCase();
    return (
      src.sourceCode.toLowerCase().includes(search) ||
      src.sourceName.toLowerCase().includes(search) ||
      src.category.toLowerCase().includes(search) ||
      (src.description && src.description.toLowerCase().includes(search))
    );
  });

  const totalItems = filteredSources.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentSources = filteredSources.slice(startIndex, startIndex + rowsPerPage);

  // ============================================
  // UTILITIES
  // ============================================
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

  const generateSourceCode = () => {
    const count = sources.length + 1;
    const prefix = 'SRC';
    const padded = String(count).padStart(3, '0');
    return `${prefix}${padded}`;
  };

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) { /* no-op */ }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ============================================
  // FORM FUNCTIONS
  // ============================================
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'sourceName') {
      if (!value) error = 'Source Name is required';
      else if (value.length > 100) error = 'Source Name must be 100 characters or less';
      else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) error = 'No special characters allowed';
      else {
        const dup = sources.some(src =>
          src.sourceName.toLowerCase() === value.toLowerCase() &&
          (!editingSource || src.id !== editingSource.id)
        );
        if (dup) error = 'Source Name must be unique';
      }
    } else if (field === 'category' && !value) {
      error = 'Category is required';
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
    const fields = ['sourceName', 'category'];
    for (const f of fields) {
      if (!formData[f]) {
        newErrors[f] = 'This field is required';
      }
    }
    if (formData.sourceName) {
      if (formData.sourceName.length > 100) newErrors.sourceName = 'Source Name must be 100 characters or less';
      else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.sourceName)) newErrors.sourceName = 'No special characters allowed';
      else {
        const dup = sources.some(src =>
          src.sourceName.toLowerCase() === formData.sourceName.toLowerCase() &&
          (!editingSource || src.id !== editingSource.id)
        );
        if (dup) newErrors.sourceName = 'Source Name must be unique';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        id: editingSource ? editingSource.id : 0,
        sourceCode: formData.sourceCode,
        sourceName: formData.sourceName,
        category: Number(formData.category),
        description: formData.description || '',
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder, 10) : null,
        status: 'y'
      };

      let res;
      if (editingSource) {
        res = await axios.put(
          `${BASE_URL}/api/recruitment-source/${editingSource.id}`,
          payload,
          axiosConfig
        );
      } else {
        res = await axios.post(
          `${BASE_URL}/api/recruitment-source`,
          payload,
          axiosConfig
        );
      }

      if (res.status === 200 || res.status === 201) {
        toast.success('Success', editingSource ? 'Recruitment source updated successfully' : 'Recruitment source created successfully');
        resetForm();
        setShowForm(false);
        setPage(0);
        fetchSources();
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
    showToast('warning', 'Cannot Edit', 'Inactive sources cannot be edited');
    return;
  }

  setEditingSource(item);

  setFormData({
    sourceCode: item.sourceCode,
    sourceName: item.sourceName,
    category: String(item.categoryId || ''),
    description: item.description || '',
    displayOrder: item.displayOrder ? String(item.displayOrder) : '',
    status: item.status
  });

  setShowForm(true);
};

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!ensureToken()) return;
    const updated = sources.filter(item => item.id !== deleteTarget.id);
    setSources(updated);
    showToast('success', 'Deleted', `${deleteTarget.sourceName} has been deleted`);
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
      const res = await axios.put(
        `${BASE_URL}/api/recruitment-source/updateRecruitmentSourceStatus/${id}`,
        { status: newStatus === 'Active' ? 'y' : 'n' },
        axiosConfig
      );

      if (res.status === 200) {
        toast.success('Status Updated', `${name} is now ${newStatus}`);
        fetchSources();
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
    setFormData(prev => ({ ...prev, sourceCode: generateSourceCode() }));
    setShowForm(true);
  };

  // ============================================
  // RENDER
  // ============================================
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
        /* ================= FORM ================= */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Recruitment Source Details</div>
              <div className="cert-form-grid-3col">

                {/* Source Code */}
                <div className="cert-field-compact">
                  <label className="required">Source Code</label>
                  <input
                    type="text"
                    value={formData.sourceCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated</small>
                </div>

                {/* Source Name */}
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

                {/* Category */}
                <div className={`cert-field-compact ${touched.category && errors.category ? 'has-error' : ''}`}>
                  <label className="required">Source Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    onBlur={() => handleBlur('category')}
                    style={{ fontSize: '14px', padding: '6px 12px', width: '100%', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">Select Category</option>
                    {categories.length === 0 && (
                      <option value="" disabled>Loading categories…</option>
                    )}
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.category} />
                </div>

                {/* Description */}
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
              <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {submitting ? 'Saving...' : (editingSource ? 'Update' : 'Save')}
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
                        <td><strong>{src.sourceName}</strong></td>
                        <td>
                          <span style={{
                            background: '#e0e7ff', color: '#4f46e5',
                            fontSize: '12px', padding: '2px 10px', borderRadius: '10px'
                          }}>
                            {src.category}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {src.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>{src.displayOrder || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={() => handleStatusToggle(src.id, src.sourceName, src.status || 'Active')}
                          >
                            <div style={{
                              width: '28px', height: '16px', borderRadius: '50px',
                              backgroundColor: (src.status || 'Active') === 'Active' ? '#9d174d' : '#d1d5db',
                              position: 'relative', transition: '.2s'
                            }}>
                              <div style={{
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: '#fff', position: 'absolute', top: '2px',
                                left: (src.status || 'Active') === 'Active' ? '14px' : '2px',
                                transition: '.2s'
                              }} />
                            </div>
                            <span style={{
                              fontSize: '11px', fontWeight: 500,
                              color: (src.status || 'Active') === 'Active' ? '#9d174d' : '#94a3b8'
                            }}>
                              {src.status || 'Active'}
                            </span>
                          </div>
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
                      <td colSpan="8" className="text-center py-5" style={{ color: '#6b7280' }}>
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

      {/* DELETE MODAL */}
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

// FIELD ERROR
const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default SourceManagement;