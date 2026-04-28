// File: frontend/src/pages/SalaryConfigPage.jsx
import React, { useState, useEffect } from 'react';
import {
  FaSearch, FaEdit, FaSave, FaTimes, FaExclamationCircle, FaArrowLeft, FaUserPlus
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import axios from 'axios';

const PAGE_SIZE = 5;

const FieldError = ({ msg }) =>
  msg ? <span className="field-err"><FaExclamationCircle size={10} /> {msg}</span> : null;

const emptyForm = () => ({
  configKey: '',
  configName: '',
  configValue: '',
  description: '',
  category: 'PERCENTAGE',
  isActive: true,
});

const CATEGORIES = ['PERCENTAGE', 'FIXED', 'SLAB'];

const SalaryConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [filteredConfigs, setFilteredConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(0); // zero‑based for emp-pagination

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Status modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: '' });

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = { headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/payroll/config/all`, axiosConfig);
      const arr = res.data?.response || res.data?.data || [];
      setConfigs(Array.isArray(arr) ? arr : []);
    } catch (err) {
      toast.error('Error', 'Failed to load configurations');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  useEffect(() => {
    let filtered = [...configs];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.configKey?.toLowerCase().includes(s) ||
        c.configName?.toLowerCase().includes(s) ||
        c.description?.toLowerCase().includes(s)
      );
    }
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }
    setFilteredConfigs(filtered);
    setPage(0);
  }, [search, categoryFilter, configs]);

  const totalItems = filteredConfigs.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const startIndex = page * PAGE_SIZE;
  const paginatedConfigs = filteredConfigs.slice(startIndex, startIndex + PAGE_SIZE);

  const validate = () => {
    const errs = {};
    if (!formData.configKey?.trim()) errs.configKey = 'Config key is required';
    if (!formData.configName?.trim()) errs.configName = 'Config name is required';
    if (formData.configValue === '' || formData.configValue === null) errs.configValue = 'Value is required';
    else if (isNaN(parseFloat(formData.configValue))) errs.configValue = 'Must be a number';
    if (formData.configKey?.trim() && !/^[A-Z0-9_]+$/.test(formData.configKey.trim())) {
      errs.configKey = 'Only uppercase letters, numbers, and underscores';
    }
    return errs;
  };

  const handleChange = (field, value) => {
    if (field === 'configKey' && editMode) return;
    let newValue = value;
    if (field === 'configKey') newValue = value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setFormData(prev => ({ ...prev, [field]: newValue }));
    if (touched[field]) {
      const errs = validate();
      setErrors(prev => ({ ...prev, [field]: errs[field] || '' }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validate();
    setErrors(prev => ({ ...prev, [field]: errs[field] || '' }));
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setErrors({});
    setTouched({});
    setEditMode(false);
    setEditId(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (config) => {
    setFormData({
      configKey: config.configKey || '',
      configName: config.configName || '',
      configValue: String(config.configValue || ''),
      description: config.description || '',
      category: config.category || 'PERCENTAGE',
      isActive: config.isActive !== undefined ? config.isActive : true,
    });
    setErrors({});
    setTouched({});
    setEditMode(true);
    setEditId(config.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ configKey: true, configName: true, configValue: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.warning('Validation Error', 'Please fix highlighted fields');
      return;
    }

    const payload = {
      configKey: formData.configKey.trim(),
      configName: formData.configName.trim(),
      configValue: parseFloat(formData.configValue),
      description: formData.description?.trim() || '',
      category: formData.category,
      isActive: formData.isActive,
    };

    setSubmitting(true);
    try {
      if (editMode) {
        await axios.put(`${BASE_URL}/api/payroll/config/full/${editId}`, payload, axiosConfig);
        toast.success('Updated', 'Configuration updated successfully');
      } else {
        await axios.post(`${BASE_URL}/api/payroll/config`, payload, axiosConfig);
        toast.success('Created', 'Configuration created successfully');
      }
      setShowForm(false);
      fetchConfigs();
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Status toggle with confirmation modal
  const handleStatusToggle = (id, currentStatus, name) => {
    setStatusAction({ id, newStatus: !currentStatus, name });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    const { id, newStatus } = statusAction;
    try {
      await axios.put(`${BASE_URL}/api/payroll/config/${id}/toggle-status`, {}, axiosConfig);
      setConfigs(prev => prev.map(c => c.id === id ? { ...c, isActive: newStatus } : c));
      toast.success('Updated', `Configuration ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Error', 'Failed to update status');
    } finally {
      setShowStatusModal(false);
      setStatusAction({ id: null, newStatus: null, name: '' });
    }
  };

  const isFieldOk = (f) => touched[f] && !errors[f] && formData[f] !== undefined && formData[f] !== '';
  const isFieldErr = (f) => touched[f] && !!errors[f];

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

  if (loading) return <LoadingSpinner message="Loading salary configurations…" />;

  return (
    <>
      <div className="emp-root">
        {/* Header */}
        <div className="emp-header" style={showForm ? { justifyContent: 'space-between' } : {}}>
          {showForm ? (
            <>
              <div>
                <h1 className="emp-title">{editMode ? 'Edit Configuration' : 'Add Configuration'}</h1>
                <p className="emp-subtitle">
                  {editMode ? `Editing: ${formData.configKey}` : 'Create a new salary configuration'}
                </p>
              </div>
              <button className="emp-back-btn" onClick={() => setShowForm(false)}>
                <FaArrowLeft size={12} /> Back
              </button>
            </>
          ) : (
            <>
              <div className="emp-header-left">
                <div>
                  <h1 className="emp-title">Salary Configurations</h1>
                  <p className="emp-subtitle">{configs.length} configurations • Manage percentages, fixed values, and slabs</p>
                </div>
              </div>
              <button className="emp-add-btn" onClick={handleAdd}>
                <FaUserPlus size={13} /> Add Config
              </button>
            </>
          )}
        </div>

        {showForm ? (
          /* ========== FORM VIEW – BRANCH STYLE (3‑column grid, compact fields) ========== */
          <div className="emp-form-wrap">
            <form onSubmit={handleSubmit} noValidate className="emp-form-compact">
              <div className="emp-form-section-compact">
                <div className="emp-section-label">Configuration Details</div>
                <div className="emp-form-grid-3col">
                  {/* Config Key */}
                  <div className={`emp-field-compact ${isFieldErr('configKey') ? 'has-error' : ''} ${isFieldOk('configKey') ? 'has-ok' : ''}`}>
                    <label>Config Key <span className="req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g., BASIC_PCT"
                      value={formData.configKey}
                      maxLength={50}
                      onChange={(e) => handleChange('configKey', e.target.value)}
                      onBlur={() => handleBlur('configKey')}
                      disabled={editMode}
                    />
                    <FieldError msg={errors.configKey} />
                  </div>

                  {/* Config Name */}
                  <div className={`emp-field-compact ${isFieldErr('configName') ? 'has-error' : ''} ${isFieldOk('configName') ? 'has-ok' : ''}`}>
                    <label>Config Name <span className="req">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g., Basic Salary (% of CTC)"
                      value={formData.configName}
                      maxLength={100}
                      onChange={(e) => handleChange('configName', e.target.value)}
                      onBlur={() => handleBlur('configName')}
                    />
                    <FieldError msg={errors.configName} />
                  </div>

                  {/* Value */}
                  <div className={`emp-field-compact ${isFieldErr('configValue') ? 'has-error' : ''} ${isFieldOk('configValue') ? 'has-ok' : ''}`}>
                    <label>Value <span className="req">*</span></label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 40.0"
                      value={formData.configValue}
                      onChange={(e) => handleChange('configValue', e.target.value)}
                      onBlur={() => handleBlur('configValue')}
                    />
                    <FieldError msg={errors.configValue} />
                  </div>

                  {/* Category */}
                  <div className="emp-field-compact">
                    <label>Category</label>
                    <select value={formData.category} onChange={(e) => handleChange('category', e.target.value)}>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="emp-field-compact">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="Brief description…"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </div>

                  {/* Active Checkbox */}
                  <div className="emp-field-compact" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleChange('isActive', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label style={{ marginBottom: 0, fontWeight: '500', color: 'var(--text-secondary)' }}>
                      Active
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="emp-form-actions">
                <button type="button" className="emp-cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="emp-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {submitting
                    ? <><span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</>
                    : <><FaSave size={12} /> {editMode ? 'Update Configuration' : 'Create Configuration'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ========== LIST VIEW ========== */
          <>
            <div className="emp-search-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 13, background: 'var(--bg-white)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <div className="emp-search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 350 }}>
                <FaSearch className="emp-search-icon" size={12} />
                <input
                  className="emp-search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by key, name, or description…"
                />
                {search && <button className="emp-search-clear" onClick={() => setSearch('')}><FaTimes size={11} /></button>}
              </div>

              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredConfigs.length} config{filteredConfigs.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="emp-table-card">
              <div className="emp-table-wrap">
                <table className="emp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Config Key</th>
                      <th>Name</th>
                      <th>Value</th>
                      <th>Category</th>
                      <th style={{ width: 80 }}>Status</th>
                      <th style={{ width: 70, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedConfigs.length > 0 ? paginatedConfigs.map((c, idx) => (
                      <tr key={c.id} className="emp-row">
                        <td className="emp-sno">{startIndex + idx + 1}</td>
                        <td><code className="emp-code">{c.configKey}</code></td>
                        <td className="emp-name">{c.configName}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>
                          {c.configValue}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                            {c.category === 'PERCENTAGE' ? '%' : c.category === 'FIXED' ? '₹' : ''}
                          </span>
                        </td>
                        <td>
                          <span className={`emp-pill ${c.category === 'PERCENTAGE' ? 'emp-pill--indigo' : c.category === 'FIXED' ? 'emp-pill--green' : 'emp-pill--amber'}`}>
                            {c.category}
                          </span>
                        </td>
                        <td>
                          <div
                            onClick={() => handleStatusToggle(c.id, c.isActive, c.configKey)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '16px',
                                borderRadius: '50px',
                                backgroundColor: c.isActive ? 'var(--accent-indigo)' : 'var(--border-medium)',
                                position: 'relative',
                                transition: '0.2s',
                              }}
                            >
                              <div
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: 'white',
                                  position: 'absolute',
                                  top: '2px',
                                  left: c.isActive ? '14px' : '2px',
                                  transition: '0.2s',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '500',
                                color: c.isActive ? 'var(--accent-indigo)' : 'var(--text-muted)',
                              }}
                            >
                              {c.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="emp-actions">
                            <button
                              className="emp-act emp-act--edit"
                              onClick={() => handleEdit(c)}
                              title="Edit"
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="emp-empty">
                          <div className="emp-empty-inner">
                            <span className="emp-empty-icon">⚙️</span>
                            <p>No configurations found</p>
                            <small>Click "Add Config" to create a new salary configuration</small>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination – emp-pagination style */}
            {totalItems > 0 && (
              <div className="emp-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="emp-page-info">
                    Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalItems)} of {totalItems} configurations
                  </span>
                </div>
                <div className="emp-page-controls">
                  <button className="emp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={`dots-${i}`} className="emp-page-dots">…</span>
                    ) : (
                      <button key={pg} className={`emp-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button className="emp-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
              </div>
            )}

            {/* Stats cards (optional, kept for reference) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 20 }}>
              {[
                { label: 'Total Configs', value: configs.length, color: 'var(--accent-indigo)' },
                { label: 'Active', value: configs.filter(c => c.isActive).length, color: '#10b981' },
                { label: 'Inactive', value: configs.filter(c => !c.isActive).length, color: '#ef4444' },
                { label: 'Percentage Types', value: configs.filter(c => c.category === 'PERCENTAGE').length, color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--card-bg)', borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Sora',sans-serif" }}>{value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Status Confirmation Modal */}
        {showStatusModal && (
          <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
            <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="emp-modal-icon">{statusAction.newStatus ? "✅" : "⛔"}</div>
              <h3 className="emp-modal-title">Confirm Status Change</h3>
              <p className="emp-modal-body">
                Are you sure you want to <strong>{statusAction.newStatus ? "activate" : "deactivate"}</strong>{" "}
                <strong>{statusAction.name}</strong>?
              </p>
              <p className="emp-modal-warn">
                {!statusAction.newStatus
                  ? "Inactive configurations cannot be edited until reactivated."
                  : "Active configurations will be used in payroll calculations."}
              </p>
              <div className="emp-modal-actions">
                <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SalaryConfigPage;