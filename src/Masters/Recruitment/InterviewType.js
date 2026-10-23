import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit,
  FaArrowLeft, FaCheckCircle, FaCircle, FaExclamationCircle
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../../config/api.config';

const InterviewTypeMaster = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [interviewTypes, setInterviewTypes] = useState([]);
  const [interviewModesList, setInterviewModesList] = useState([]); // 👈 Store real modes from DB
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: '',
    newStatus: ''
  });

  // Form state (Matches Backend DTO)
  const [formData, setFormData] = useState({
    interviewTypeCode: '',
    interviewTypeName: '',
    interviewModeId: '', // 👈 Store the ID, not the string name
    description: '',
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
  // FETCH DATA (Types & Modes)
  // ============================================
  
  // 1. Fetch Interview Types
  const fetchTypes = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/recuirment/getAllInterviewType`, axiosConfig);
      
      const list = Array.isArray(res.data) ? res.data : (res.data?.response || []);

      const mapped = list.map((item) => {
        const isActive = String(item.status ?? '').toLowerCase() === 'y' || item.status === true;
        return {
          id: item.id,
          interviewTypeCode: item.interviewTypeCode || item.interviewCode || '',
          interviewTypeName: item.interviewTypeName || item.interviewName || '',
          interviewModeId: item.interviewModeId || item.interviewMode?.id || '',
          interviewModeName: item.interviewModeName || item.interviewMode?.name || item.interviewMode || '',
          description: item.description || '',
          status: isActive ? 'Active' : 'Inactive',
        };
      });

      setInterviewTypes(mapped);
    } catch (err) {
      console.error('🔴 [fetchTypes] error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch interview types');
      setInterviewTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Interview Modes for the Dropdown
  // ⚠️ NOTE: Change this endpoint if your backend uses a different URL for modes
  const fetchModes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/recuirment/getAllInterviewMode`, axiosConfig);
      const list = Array.isArray(res.data) ? res.data : (res.data?.response || []);
      
      setInterviewModesList(list.map(m => ({
        id: m.id,
        name: m.name || m.modeName || m.interviewModeName
      })));
    } catch (err) {
      console.error('Failed to fetch modes:', err);
      // Fallback if endpoint doesn't exist yet (so UI doesn't break)
      setInterviewModesList([
        { id: 1, name: 'Virtual' },
        { id: 2, name: 'Face to Face' },
        { id: 3, name: 'Telephonic' },
        { id: 4, name: 'Hybrid' }
      ]);
    }
  };

  useEffect(() => {
    fetchTypes();
    fetchModes();
  }, [fetchTypes]);

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
  // FILTERED DATA
  // ============================================
  const filteredTypes = interviewTypes.filter(item => {
    const search = debouncedSearch.toLowerCase();
    return (
      item.interviewTypeCode?.toLowerCase().includes(search) ||
      item.interviewTypeName?.toLowerCase().includes(search) ||
      item.interviewModeName?.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search))
    );
  }).sort((a, b) => {
    if (a.status === 'Active' && b.status === 'Inactive') return -1;
    if (a.status === 'Inactive' && b.status === 'Active') return 1;
    return 0;
  });

  const totalItems = filteredTypes.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentTypes = filteredTypes.slice(startIndex, startIndex + rowsPerPage);

  // ============================================
  // FORM HANDLERS
  // ============================================
  const generateInterviewCode = () => {
    return `INT${String(interviewTypes.length + 1).padStart(3, '0')}`;
  };

  const resetForm = () => {
    setFormData({
      interviewTypeCode: generateInterviewCode(),
      interviewTypeName: '',
      interviewModeId: '',
      description: '',
    });
    setErrors({});
    setTouched({});
    setEditingType(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) validateField(field, value);
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'interviewTypeName') {
      if (!value) error = 'Interview Type Name is required';
      else if (value.length > 100) error = 'Must be 100 characters or less';
      else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) error = 'No special characters allowed';
    } else if (field === 'interviewModeId' && !value) {
      error = 'Interview Mode is required';
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.interviewTypeName) newErrors.interviewTypeName = 'This field is required';
    if (!formData.interviewModeId) newErrors.interviewModeId = 'This field is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      // ✅ PAYLOAD FIX: Matches the backend DTO exactly
      const payload = {
        id: editingType ? editingType.id : 0,
        interviewTypeCode: formData.interviewTypeCode,
        interviewTypeName: formData.interviewTypeName.trim(),
        interviewModeId: Number(formData.interviewModeId), // 👈 Sending the Long ID!
        description: formData.description?.trim() || '',
        status: 'y',
      };

      let res;
      if (editingType) {
        // Update API
        res = await axios.put(`${BASE_URL}/api/recuirment/updateInterviewTypeById/${editingType.id}`, payload, axiosConfig);
      } else {
        // Create API
        res = await axios.post(`${BASE_URL}/api/recuirment/saveInterviewType`, payload, axiosConfig);
      }

      if (res.status === 200 || res.status === 201) {
        toast.success('Success', editingType ? 'Interview type updated' : 'Interview type created');
        resetForm();
        setShowForm(false);
        fetchTypes(); 
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
      toast.warning('Cannot Edit', 'Inactive types cannot be edited');
      return;
    }
    setEditingType(item);
    setFormData({
      interviewTypeCode: item.interviewTypeCode,
      interviewTypeName: item.interviewTypeName,
      interviewModeId: item.interviewModeId || '', 
      description: item.description || '',
    });
    setShowForm(true);
  };

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
      const typeToUpdate = interviewTypes.find((t) => t.id === id);
      if (!typeToUpdate) throw new Error('Type not found');

      const payload = {
        id: id,
        interviewTypeCode: typeToUpdate.interviewTypeCode,
        interviewTypeName: typeToUpdate.interviewTypeName,
        interviewModeId: typeToUpdate.interviewModeId,
        description: typeToUpdate.description,
        status: newStatus === 'Active' ? 'y' : 'n',
      };

      const res = await axios.put(`${BASE_URL}/api/recuirment/updateInterviewTypeById/${id}`, payload, axiosConfig);

      if (res.status === 200) {
        toast.success('Status Updated', `${name} is now ${newStatus}`);
        fetchTypes(); 
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Failed to change status');
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, name: '', newStatus: '' });
    }
  };

  const getModeColor = (modeName) => {
    const colors = {
      'Virtual': '#8b5cf6',
      'Face to Face': '#3b82f6',
      'Telephonic': '#f59e0b',
      'Hybrid': '#10b981'
    };
    return colors[modeName] || '#6b7280';
  };

    // ============================================
  // PAGINATION RANGE UTILITY
  // ============================================
  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    
    if (left > 0) { 
      range.push(0); 
      if (left > 1) range.push('...'); 
    }
    
    for (let i = left; i <= right; i++) {
      range.push(i);
    }
    
    if (right < totalPages - 1) { 
      if (right < totalPages - 2) range.push('...'); 
      range.push(totalPages - 1); 
    }
    
    return range;
  };

  if (loading && !showForm && interviewTypes.length === 0) {
    return <LoadingSpinner message="Loading interview types..." />;
  }

  return (
    <div className="cert-root">
      {/* HEADER */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Interview Type Master</h1>
          <p className="cert-subtitle">Manage interview types for recruitment process</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setFormData(prev => ({ ...prev, interviewTypeCode: generateInterviewCode() })); setShowForm(true); }}>
              <FaPlus size={13} /> Add Interview Type
            </button>
          )}
          {showForm && (
            <button type="button" className="cert-back-btn" onClick={() => { resetForm(); setShowForm(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {/* FORM SECTION */}
      {showForm ? (
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Interview Type Details</div>
              <div className="cert-form-grid-3col">

                {/* Interview Code */}
                <div className="cert-field-compact">
                  <label>Interview Type Code</label>
                  <input type="text" className="form-control bg-light" value={formData.interviewTypeCode} readOnly style={{ background: '#f8f9fc' }} />
                </div>

                {/* Interview Name */}
                <div className={`cert-field-compact ${touched.interviewTypeName && errors.interviewTypeName ? 'has-error' : ''}`}>
                  <label className="required">Interview Type Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Technical Round, HR Round"
                    value={formData.interviewTypeName}
                    onChange={(e) => handleChange('interviewTypeName', e.target.value)}
                    onBlur={() => handleBlur('interviewTypeName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.interviewTypeName} />
                </div>

                {/* Interview Mode */}
                <div className={`cert-field-compact ${touched.interviewModeId && errors.interviewModeId ? 'has-error' : ''}`}>
                  <label className="required">Interview Mode</label>
                  <select
                    value={formData.interviewModeId}
                    onChange={(e) => handleChange('interviewModeId', e.target.value)}
                    onBlur={() => handleBlur('interviewModeId')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Mode</option>
                    {interviewModesList.map(mode => (
                      <option key={mode.id} value={mode.id}>
                        {mode.name}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.interviewModeId} />
                </div>

                {/* Description */}
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

            {/* Form Actions */}
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={() => { resetForm(); setShowForm(false); }}>
                <FaTimes size={12} /> Cancel
              </button>
              <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting ? <><span className="emp-spinner" /> Saving…</> : <><FaSave size={12} /> {editingType ? 'Update' : 'Save'}</>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* TABLE SECTION */
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name, mode or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button className="emp-search-clear" onClick={() => setSearchTerm('')}><FaTimes size={11} /></button>}
            </div>
          </div>

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
                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTypes.length > 0 ? (
                    currentTypes.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>{item.interviewTypeCode}</span></td>
                        <td><strong>{item.interviewTypeName}</strong></td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: `${getModeColor(item.interviewModeName)}20`, color: getModeColor(item.interviewModeName),
                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                          }}>
                            {item.interviewModeName}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="d-flex align-items-center justify-content-center gap-1" style={{ cursor: 'pointer' }} onClick={() => handleStatusToggle(item.id, item.interviewTypeName, item.status)}>
                            <div style={{ width: '28px', height: '16px', borderRadius: '50px', backgroundColor: item.status === 'Active' ? '#9d174d' : '#d1d5db', position: 'relative', transition: '.2s' }}>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: item.status === 'Active' ? '14px' : '2px', transition: '.2s' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 500, color: item.status === 'Active' ? '#9d174d' : '#94a3b8' }}>{item.status}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" style={{ justifyContent: 'center' }}>
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(item)} disabled={item.status === 'Inactive'} style={{ opacity: item.status === 'Inactive' ? 0.5 : 1 }}>
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="text-center py-5" style={{ color: '#6b7280' }}>No interview types found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} interview types
                </div>
                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>← Prev</button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span> : (
                      <button key={pg} onClick={() => setPage(pg)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', background: pg === page ? '#9d174d' : 'white', color: pg === page ? 'white' : '#374151', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px' }}>{pg + 1}</button>
                    )
                  )}
                  <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Next →</button>
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
            <div className="emp-modal-icon">{statusAction.newStatus === 'Active' ? '✅' : '⛔'}</div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">Are you sure you want to <strong>{statusAction.newStatus === 'Active' ? 'activate' : 'deactivate'}</strong> <strong>{statusAction.name}</strong>?</p>
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

const FieldError = ({ msg }) => msg ? <span className="field-err"><FaExclamationCircle size={10} /> {msg}</span> : null;

export default InterviewTypeMaster;