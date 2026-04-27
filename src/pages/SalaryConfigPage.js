// File: frontend/src/pages/SalaryConfigPage.jsx
import React, { useState, useEffect } from 'react';
import {
  FaSearch, FaPlus, FaEdit, FaSave, FaTimes,
  FaToggleOn, FaToggleOff, FaExclamationCircle, FaArrowLeft,
  FaChevronLeft, FaChevronRight,
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
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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
    setCurrentPage(1);
  }, [search, categoryFilter, configs]);

  const totalPages = Math.ceil(filteredConfigs.length / PAGE_SIZE);
  const paginatedConfigs = filteredConfigs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const validate = () => {
    const errs = {};
    if (!formData.configKey?.trim()) errs.configKey = 'Config key is required';
    if (!formData.configName?.trim()) errs.configName = 'Config name is required';
    if (formData.configValue === '' || formData.configValue === null) errs.configValue = 'Value is required';
    else if (isNaN(parseFloat(formData.configValue))) errs.configValue = 'Must be a number';
    return errs;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleAdd = () => {
    setFormData(emptyForm());
    setErrors({});
    setTouched({});
    setEditMode(false);
    setEditId(null);
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

  const handleToggleStatus = async (config) => {
    try {
      await axios.put(`${BASE_URL}/api/payroll/config/${config.id}/toggle-status`, {}, axiosConfig);
      setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, isActive: !c.isActive } : c));
      toast.success('Updated', `${config.configKey} ${config.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Error', 'Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner message="Loading salary configurations…" />;

  return (
    <div className="emp-root">
      <div className="emp-header" style={showForm ? { justifyContent: 'space-between' } : {}}>
        {showForm ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? 'Edit Configuration' : 'Add Configuration'}</h1>
              <p className="emp-subtitle">{editMode ? `Editing: ${formData.configKey}` : 'Create a new salary configuration'}</p>
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
              <FaPlus size={13} /> Add Config
            </button>
          </>
        )}
      </div>

      {showForm ? (
        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit} noValidate>
            <div className="emp-form-section">
              <div className="emp-section-label">Configuration Details</div>
              <div className="emp-form-grid">
                <div className={`emp-field ${errors.configKey ? 'has-error' : ''}`}>
                  <label>Config Key <span className="req">*</span></label>
                  <input type="text" placeholder="e.g., BASIC_PCT" value={formData.configKey} onChange={e => handleChange('configKey', e.target.value.toUpperCase())} onBlur={() => handleBlur('configKey')} disabled={editMode} style={editMode ? { background: 'var(--bg-disabled)', cursor: 'not-allowed' } : {}} />
                  <FieldError msg={errors.configKey} />
                  <small className="emp-hint-text">Unique identifier (e.g., BASIC_PCT, HRA_PCT)</small>
                </div>
                <div className={`emp-field ${errors.configName ? 'has-error' : ''}`}>
                  <label>Config Name <span className="req">*</span></label>
                  <input type="text" placeholder="e.g., Basic Salary (% of CTC)" value={formData.configName} onChange={e => handleChange('configName', e.target.value)} onBlur={() => handleBlur('configName')} />
                  <FieldError msg={errors.configName} />
                </div>
                <div className={`emp-field ${errors.configValue ? 'has-error' : ''}`}>
                  <label>Value <span className="req">*</span></label>
                  <input type="number" min="0" step="0.01" placeholder="e.g., 40.0" value={formData.configValue} onChange={e => handleChange('configValue', e.target.value)} onBlur={() => handleBlur('configValue')} />
                  <FieldError msg={errors.configValue} />
                </div>
                <div className="emp-field">
                  <label>Category</label>
                  <select value={formData.category} onChange={e => handleChange('category', e.target.value)}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="emp-field">
                  <label>Description</label>
                  <input type="text" placeholder="Brief description…" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                </div>
                <div className="emp-field" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 28 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.isActive} onChange={e => handleChange('isActive', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-indigo)' }} />
                    <span style={{ fontWeight: 600 }}>Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting ? <><span className="emp-spinner" /> Saving…</> : <><FaSave size={12} /> {editMode ? 'Update' : 'Save'}</>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="emp-search-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 13, background: 'var(--bg-white)', cursor: 'pointer', outline: 'none' }}>
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="emp-search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 350 }}>
              <FaSearch className="emp-search-icon" size={12} />
              <input className="emp-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by key, name, or description…" />
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
                    <th style={{ width: 80, textAlign: 'center' }}>Status</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedConfigs.length > 0 ? paginatedConfigs.map((c, idx) => (
                    <tr key={c.id} className="emp-row">
                      <td className="emp-sno">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                      <td><code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>{c.configKey}</code></td>
                      <td style={{ fontWeight: 500 }}>{c.configName}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-indigo)', fontSize: 15, fontFamily: "'Sora',sans-serif" }}>
                        {c.configValue}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                          {c.category === 'PERCENTAGE' ? '%' : c.category === 'FIXED' ? '₹' : ''}
                        </span>
                      </td>
                      <td><span className={`emp-pill ${c.category === 'PERCENTAGE' ? 'emp-pill--indigo' : c.category === 'FIXED' ? 'emp-pill--green' : 'emp-pill--amber'}`}>{c.category}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleToggleStatus(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.isActive ? '#10b981' : '#ef4444' }} title={c.isActive ? 'Active' : 'Inactive'}>
                          {c.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="emp-actions" style={{ justifyContent: 'center' }}>
                          <button className="emp-act emp-act--edit" onClick={() => handleEdit(c)} title="Edit"><FaEdit size={12} /></button>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', border: '1px solid var(--border-medium)', borderRadius: 8, background: 'var(--bg-white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
                <FaChevronLeft size={11} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ padding: '6px 12px', border: '1px solid var(--border-medium)', borderRadius: 8, background: currentPage === i + 1 ? 'var(--accent-indigo)' : 'var(--bg-white)', color: currentPage === i + 1 ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontWeight: currentPage === i + 1 ? 700 : 400 }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', border: '1px solid var(--border-medium)', borderRadius: 8, background: 'var(--bg-white)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                <FaChevronRight size={11} />
              </button>
            </div>
          )}

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
    </div>
  );
};

export default SalaryConfigPage;