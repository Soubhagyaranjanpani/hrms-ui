// File: frontend/src/pages/EmployeeGradePage.jsx
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

const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));
const PAGE_SIZE = 5;

const FieldError = ({ msg }) =>
  msg ? <span className="field-err"><FaExclamationCircle size={10} /> {msg}</span> : null;

const emptyForm = () => ({
  code: '',
  name: '',
  description: '',
  minSalary: '',
  maxSalary: '',
  gradePay: '',
  level: '',
  isActive: true,
});

const EmployeeGradePage = () => {
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = { headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } };

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/grades/all`, axiosConfig);
      const arr = res.data?.response || res.data?.data || [];
      setGrades(Array.isArray(arr) ? arr : []);
    } catch (err) {
      toast.error('Error', 'Failed to load grades');
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGrades(); }, []);

  useEffect(() => {
    let filtered = [...grades];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(g =>
        g.code?.toLowerCase().includes(s) ||
        g.name?.toLowerCase().includes(s) ||
        g.description?.toLowerCase().includes(s)
      );
    }
    if (statusFilter === 'ACTIVE') filtered = filtered.filter(g => g.isActive);
    if (statusFilter === 'INACTIVE') filtered = filtered.filter(g => !g.isActive);
    setFilteredGrades(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, grades]);

  // Pagination
  const totalPages = Math.ceil(filteredGrades.length / PAGE_SIZE);
  const paginatedGrades = filteredGrades.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const validate = () => {
    const errs = {};
    if (!formData.code?.trim()) errs.code = 'Code is required';
    if (!formData.name?.trim()) errs.name = 'Name is required';
    if (!formData.level || isNaN(parseInt(formData.level))) errs.level = 'Valid level number required';
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

  const handleEdit = (grade) => {
    setFormData({
      code: grade.code || '',
      name: grade.name || '',
      description: grade.description || '',
      minSalary: String(grade.minSalary || ''),
      maxSalary: String(grade.maxSalary || ''),
      gradePay: String(grade.gradePay || ''),
      level: String(grade.level || ''),
      isActive: grade.isActive !== undefined ? grade.isActive : true,
    });
    setErrors({});
    setTouched({});
    setEditMode(true);
    setEditId(grade.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ code: true, name: true, level: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.warning('Validation Error', 'Please fix highlighted fields');
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      minSalary: parseFloat(formData.minSalary) || 0,
      maxSalary: parseFloat(formData.maxSalary) || 0,
      gradePay: parseFloat(formData.gradePay) || 0,
      level: parseInt(formData.level) || 1,
      isActive: formData.isActive,
    };

    setSubmitting(true);
    try {
      if (editMode) {
        await axios.put(`${BASE_URL}/api/grades/${editId}`, payload, axiosConfig);
        toast.success('Updated', 'Grade updated successfully');
      } else {
        await axios.post(`${BASE_URL}/api/grades`, payload, axiosConfig);
        toast.success('Created', 'Grade created successfully');
      }
      setShowForm(false);
      fetchGrades();
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (grade) => {
    try {
      await axios.put(`${BASE_URL}/api/grades/${grade.id}/toggle-status`, {}, axiosConfig);
      setGrades(prev => prev.map(g => g.id === grade.id ? { ...g, isActive: !g.isActive } : g));
      toast.success(grade.isActive ? 'Deactivated' : 'Activated', `${grade.code} updated`);
    } catch (err) {
      toast.error('Error', 'Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner message="Loading grades…" />;

  return (
    <div className="emp-root">
      <div className="emp-header" style={showForm ? { justifyContent: 'space-between' } : {}}>
        {showForm ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? 'Edit Grade' : 'Add Grade'}</h1>
              <p className="emp-subtitle">{editMode ? `Editing: ${formData.name}` : 'Create a new employee grade level'}</p>
            </div>
            <button className="emp-back-btn" onClick={() => setShowForm(false)}>
              <FaArrowLeft size={12} /> Back to List
            </button>
          </>
        ) : (
          <>
            <div className="emp-header-left">
              <div>
                <h1 className="emp-title">Employee Grades</h1>
                <p className="emp-subtitle">{grades.length} grades • {grades.filter(g => g.isActive).length} active</p>
              </div>
            </div>
            <button className="emp-add-btn" onClick={handleAdd}>
              <FaPlus size={13} /> Add Grade
            </button>
          </>
        )}
      </div>

      {showForm ? (
        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit} noValidate>
            <div className="emp-form-section">
              <div className="emp-section-label">Grade Details</div>
              <div className="emp-form-grid">
                <div className={`emp-field ${errors.code ? 'has-error' : ''}`}>
                  <label>Grade Code <span className="req">*</span></label>
                  <input type="text" placeholder="e.g., L1, M1" value={formData.code} onChange={e => handleChange('code', e.target.value.toUpperCase())} onBlur={() => handleBlur('code')} disabled={editMode} />
                  <FieldError msg={errors.code} />
                  <small className="emp-hint-text">Unique identifier (cannot change after creation)</small>
                </div>
                <div className={`emp-field ${errors.name ? 'has-error' : ''}`}>
                  <label>Grade Name <span className="req">*</span></label>
                  <input type="text" placeholder="e.g., Level 1" value={formData.name} onChange={e => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} />
                  <FieldError msg={errors.name} />
                </div>
                <div className={`emp-field ${errors.level ? 'has-error' : ''}`}>
                  <label>Level Number <span className="req">*</span></label>
                  <input type="number" min="1" placeholder="e.g., 1" value={formData.level} onChange={e => handleChange('level', e.target.value)} onBlur={() => handleBlur('level')} />
                  <FieldError msg={errors.level} />
                  <small className="emp-hint-text">Higher number = higher grade</small>
                </div>
                <div className="emp-field">
                  <label>Grade Pay (₹)</label>
                  <input type="number" min="0" placeholder="e.g., 5400" value={formData.gradePay} onChange={e => handleChange('gradePay', e.target.value)} />
                </div>
                <div className="emp-field">
                  <label>Min Salary (₹)</label>
                  <input type="number" min="0" placeholder="e.g., 40000" value={formData.minSalary} onChange={e => handleChange('minSalary', e.target.value)} />
                </div>
                <div className="emp-field">
                  <label>Max Salary (₹)</label>
                  <input type="number" min="0" placeholder="e.g., 60000" value={formData.maxSalary} onChange={e => handleChange('maxSalary', e.target.value)} />
                </div>
                <div className="emp-field" style={{ gridColumn: 'span 2' }}>
                  <label>Description</label>
                  <textarea rows={2} placeholder="Brief description…" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                </div>
                <div className="emp-field" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                {submitting ? <><span className="emp-spinner" /> Saving…</> : <><FaSave size={12} /> {editMode ? 'Update Grade' : 'Create Grade'}</>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="emp-search-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 13, background: 'var(--bg-white)', cursor: 'pointer', outline: 'none' }}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
            <div className="emp-search-wrap" style={{ flex: 1, maxWidth: 400 }}>
              <FaSearch className="emp-search-icon" size={12} />
              <input className="emp-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code, name, or description…" />
              {search && <button className="emp-search-clear" onClick={() => setSearch('')}><FaTimes size={11} /></button>}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredGrades.length} grade{filteredGrades.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="emp-table-card">
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Grade Pay</th>
                    <th>Salary Range</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Status</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGrades.length > 0 ? paginatedGrades.map((g, idx) => (
                    <tr key={g.id} className="emp-row" style={{ opacity: g.isActive ? 1 : 0.5 }}>
                      <td className="emp-sno">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                      <td><code style={{ background: g.isActive ? '#ede9fe' : '#f1f5f9', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: g.isActive ? '#5b21b6' : '#94a3b8' }}>{g.code}</code></td>
                      <td style={{ fontWeight: 600, color: g.isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{g.name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-indigo)', fontSize: 16, fontFamily: "'Sora',sans-serif" }}>{g.level}</td>
                      <td style={{ color: '#059669', fontWeight: 600 }}>{g.gradePay > 0 ? `₹${fmt(g.gradePay)}` : '—'}</td>
                      <td style={{ fontSize: 13 }}>{g.minSalary > 0 ? `₹${fmt(g.minSalary)} - ₹${fmt(g.maxSalary)}` : '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleToggleStatus(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: g.isActive ? '#10b981' : '#ef4444' }} title={g.isActive ? 'Active' : 'Inactive'}>
                          {g.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="emp-actions" style={{ justifyContent: 'center' }}>
                          <button className="emp-act emp-act--edit" onClick={() => handleEdit(g)} title="Edit"><FaEdit size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="emp-empty">
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon">🏷️</span>
                          <p>No grades found</p>
                          <small>Click "Add Grade" to create a new employee grade level</small>
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

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 20 }}>
            {[
              { label: 'Total Grades', value: grades.length, color: 'var(--accent-indigo)', bg: '#ede9fe' },
              { label: 'Active', value: grades.filter(g => g.isActive).length, color: '#10b981', bg: '#d1fae5' },
              { label: 'Inactive', value: grades.filter(g => !g.isActive).length, color: '#ef4444', bg: '#fee2e2' },
              { label: 'Max Level', value: Math.max(...grades.map(g => g.level || 0), 0), color: '#f59e0b', bg: '#fef3c7' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 11, color: color, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Sora',sans-serif" }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeGradePage;