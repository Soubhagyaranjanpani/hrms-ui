import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSearch, FaEdit, FaSave, FaTimes, FaArrowLeft,
  FaExclamationCircle, FaRupeeSign, FaUserPlus,
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import axios from 'axios';

/* ─── helpers ─────────────────────────────────────────── */
const cleanName = (n) => (n || '').replace(/\s+null\s*/gi, ' ').replace(/\s+null$/i, '').replace(/^null\s+/i, '').trim();
const fmt       = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));

const avatarColors = [
  { bg: '#ede9fe', color: '#5b21b6' }, { bg: '#fff0e8', color: '#c2410c' },
  { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef3c7', color: '#92400e' },
  { bg: '#e0e7ff', color: '#3730a3' }, { bg: '#fce7f3', color: '#9d174d' },
];
const getAvatarColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];
const getInitials    = (n) => {
  const p = cleanName(n).trim().split(/\s+/);
  return p.length === 1 ? p[0][0]?.toUpperCase() || '?' : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const FieldError = ({ msg }) =>
  msg ? <span className="field-err"><FaExclamationCircle size={10} /> {msg}</span> : null;

/* ─── validation ──────────────────────────────────────── */
const validateField = (field, value) => {
  const num = parseFloat(value);
  if (field === 'employeeId' && !value) return 'Select an employee';
  if (['basicSalary'].includes(field)) {
    if (value === '' || value === null) return 'Basic salary is required';
    if (isNaN(num) || num < 0) return 'Enter a valid positive amount';
  }
  if (value !== '' && value !== null && !['employeeId','remarks'].includes(field)) {
    if (isNaN(parseFloat(value)) || parseFloat(value) < 0) return 'Must be a positive number';
  }
  return '';
};

const emptyForm = () => ({
  employeeId: '', basicSalary: '', hra: '', travelAllow: '',
  medicalAllow: '', specialAllow: '', providentFund: '',
  professionalTax: '', incomeTax: '', ctc: '',
});

/* ─── salary component rows config ──────────────────────*/
const EARNINGS = [
  { key: 'basicSalary', label: 'Basic Salary',       required: true  },
  { key: 'hra',         label: 'HRA',                required: false },
  { key: 'travelAllow', label: 'Travel Allowance',   required: false },
  { key: 'medicalAllow',label: 'Medical Allowance',  required: false },
  { key: 'specialAllow',label: 'Special Allowance',  required: false },
];
const DEDUCTIONS = [
  { key: 'providentFund',   label: 'Provident Fund (PF)' },
  { key: 'professionalTax', label: 'Professional Tax'     },
  { key: 'incomeTax',       label: 'Income Tax (TDS)'     },
];

/* ═══════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════ */
const SalaryStructure = ({ user }) => {

  const [view,           setView]           = useState('list');
  const [editMode,       setEditMode]       = useState(false);
  const [selectedStruct, setSelectedStruct] = useState(null);

  const [structures, setStructures] = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState(emptyForm());
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig  = { headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } };

  /* fetch salary structures */
  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/payroll/structure/all`, axiosConfig);
      const arr = res.data?.response || res.data?.data || [];
      setStructures(Array.isArray(arr) ? arr : []);
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Failed to load salary structures');
      setStructures([]);
    } finally { setLoading(false); }
  }, []);

  /* fetch employees for dropdown */
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/employees?page=0&size=200`, axiosConfig);
      const arr = res.data?.response?.content || res.data?.data || [];
      setEmployees(Array.isArray(arr) ? arr : []);
    } catch { setEmployees([]); }
  }, []);

  useEffect(() => { fetchStructures(); fetchEmployees(); }, []);

  /* filter */
  const filtered = structures.filter(s =>
    !search || (cleanName(s.employeeName) || '').toLowerCase().includes(search.toLowerCase())
              || (s.department || '').toLowerCase().includes(search.toLowerCase())
  );

  /* field change */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field])
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  /* edit click */
  const handleEdit = (struct) => {
    setSelectedStruct(struct);
    setFormData({
      employeeId:      String(struct.employeeId || ''),
      basicSalary:     String(struct.basicSalary     || ''),
      hra:             String(struct.hra             || ''),
      travelAllow:     String(struct.travelAllow     || ''),
      medicalAllow:    String(struct.medicalAllow    || ''),
      specialAllow:    String(struct.specialAllow    || ''),
      providentFund:   String(struct.providentFund   || ''),
      professionalTax: String(struct.professionalTax || ''),
      incomeTax:       String(struct.incomeTax       || ''),
      ctc:             String(struct.ctc             || ''),
    });
    setErrors({}); setTouched({});
    setEditMode(true); setView('form');
  };

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['employeeId', 'basicSalary', ...EARNINGS.map(f=>f.key), ...DEDUCTIONS.map(f=>f.key)];
    setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    const errs = {};
    allFields.forEach(f => { const e = validateField(f, formData[f]); if (e) errs[f] = e; });
    setErrors(errs);
    if (Object.keys(errs).length > 0) { toast.warning('Validation Error', 'Please fix the highlighted fields'); return; }

    const payload = {
      employeeId:      parseInt(formData.employeeId),
      basicSalary:     parseFloat(formData.basicSalary)     || 0,
      hra:             parseFloat(formData.hra)             || 0,
      travelAllow:     parseFloat(formData.travelAllow)     || 0,
      medicalAllow:    parseFloat(formData.medicalAllow)    || 0,
      specialAllow:    parseFloat(formData.specialAllow)    || 0,
      providentFund:   parseFloat(formData.providentFund)   || 0,
      professionalTax: parseFloat(formData.professionalTax) || 0,
      incomeTax:       parseFloat(formData.incomeTax)       || 0,
      ctc:             parseFloat(formData.ctc)             || 0,
    };

    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/payroll/structure`, payload, axiosConfig);
      if (res.data?.status === 200 || res.status === 200) {
        toast.success('Saved', editMode ? 'Salary structure updated' : 'Salary structure created');
        resetForm(); setView('list'); fetchStructures();
      } else { toast.error('Error', res.data?.message || 'Failed to save'); }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Something went wrong');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setFormData(emptyForm()); setErrors({}); setTouched({});
    setEditMode(false); setSelectedStruct(null);
  };

  /* live CTC preview */
  const liveBasic    = parseFloat(formData.basicSalary) || 0;
  const liveHra      = parseFloat(formData.hra) || 0;
  const liveTravel   = parseFloat(formData.travelAllow) || 0;
  const liveMedical  = parseFloat(formData.medicalAllow) || 0;
  const liveSpecial  = parseFloat(formData.specialAllow) || 0;
  const liveGross    = liveBasic + liveHra + liveTravel + liveMedical + liveSpecial;
  const livePF       = parseFloat(formData.providentFund) || 0;
  const livePT       = parseFloat(formData.professionalTax) || 0;
  const liveTDS      = parseFloat(formData.incomeTax) || 0;
  const liveDeduct   = livePF + livePT + liveTDS;
  const liveNet      = liveGross - liveDeduct;

  const isFieldOk  = (f) => touched[f] && !errors[f] && formData[f] !== '';
  const isFieldErr = (f) => touched[f] && !!errors[f];

  if (loading && view === 'list' && structures.length === 0)
    return <LoadingSpinner message="Loading salary structures…" />;

  /* ── RENDER ── */
  return (
    <div className="emp-root">

      {/* Header */}
      <div className="emp-header" style={view === 'form' ? { justifyContent: 'space-between' } : {}}>
        {view === 'form' ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? 'Edit Salary Structure' : 'Add Salary Structure'}</h1>
              <p className="emp-subtitle">
                {editMode && selectedStruct
                  ? `${cleanName(selectedStruct.employeeName)} — update salary components`
                  : 'Set up salary components for an employee'}
              </p>
            </div>
            <button className="emp-back-btn" onClick={() => { setView('list'); resetForm(); }}>
              <FaArrowLeft size={12} /> Back
            </button>
          </>
        ) : (
          <>
            <div className="emp-header-left">
              <div>
                <h1 className="emp-title">Salary Structures</h1>
                <p className="emp-subtitle">{structures.length} employees configured</p>
              </div>
            </div>
            <button className="emp-add-btn" onClick={() => { resetForm(); setView('form'); }}>
              <FaUserPlus size={13} /> Add Structure
            </button>
          </>
        )}
      </div>

      {/* ════ LIST VIEW ════ */}
      {view === 'list' && (
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search employee or department…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="emp-search-clear" onClick={() => setSearch('')}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="emp-table-card">
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Basic</th>
                    <th>Gross (Monthly)</th>
                    <th>Deductions</th>
                    <th>Net (Monthly)</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((s, idx) => {
                    const name = cleanName(s.employeeName);
                    const ac   = getAvatarColor(name);
                    const gross   = (s.basicSalary||0)+(s.hra||0)+(s.travelAllow||0)+(s.medicalAllow||0)+(s.specialAllow||0);
                    const deducts = (s.providentFund||0)+(s.professionalTax||0)+(s.incomeTax||0);
                    return (
                      <tr key={s.id || idx} className="emp-row">
                        <td className="emp-sno">{idx + 1}</td>
                        <td>
                          <div className="emp-info-cell">
                            <div className="emp-avatar" style={{ background: ac.bg, color: ac.color }}>
                              {getInitials(name)}
                            </div>
                            <div>
                              <div className="emp-name">{name || '—'}</div>
                              <div className="emp-email">{s.employeeCode || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {s.department
                            ? <span className="emp-pill emp-pill--indigo">{s.department}</span>
                            : <span className="emp-dash">—</span>}
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          ₹{fmt(s.basicSalary)}
                        </td>
                        <td style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>
                          ₹{fmt(gross)}
                        </td>
                        <td style={{ fontSize: 13, color: '#dc2626' }}>
                          -₹{fmt(deducts)}
                        </td>
                        <td style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-indigo)', fontFamily: "'Sora',sans-serif" }}>
                          ₹{fmt(gross - deducts)}
                        </td>
                        <td>
                          <div className="emp-actions">
                            <button className="emp-act emp-act--edit" onClick={() => handleEdit(s)} title="Edit structure">
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="8" className="emp-empty">
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon"><FaRupeeSign /></span>
                          <p>No salary structures found</p>
                          <small>Click "Add Structure" to set up an employee's salary</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ════ FORM VIEW ════ */}
      {view === 'form' && (
        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit} noValidate>

            {/* Employee selector — only in create mode */}
            {!editMode && (
              <>
                <div className="emp-form-section">
                  <div className="emp-section-label">Select Employee</div>
                  <div className="emp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className={`emp-field ${isFieldErr('employeeId') ? 'has-error' : ''} ${isFieldOk('employeeId') ? 'has-ok' : ''}`}>
                      <label>Employee <span className="req">*</span></label>
                      <select
                        value={formData.employeeId}
                        onChange={e => handleChange('employeeId', e.target.value)}
                        onBlur={() => handleBlur('employeeId')}
                      >
                        <option value="">Select employee</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {cleanName(emp.name)} — {emp.departmentName || emp.department || ''} ({emp.roleName || ''})
                          </option>
                        ))}
                      </select>
                      <FieldError msg={errors.employeeId} />
                      <small className="emp-hint-text">Employee will be linked to this salary structure</small>
                    </div>
                  </div>
                </div>
                <div className="emp-divider" />
              </>
            )}

            {/* Earnings */}
            <div className="emp-form-section">
              <div className="emp-section-label" style={{ color: '#059669' }}>💰 Earnings (Monthly)</div>
              <div className="emp-form-grid">
                {EARNINGS.map(({ key, label, required }) => (
                  <div key={key} className={`emp-field ${isFieldErr(key) ? 'has-error' : ''} ${isFieldOk(key) ? 'has-ok' : ''}`}>
                    <label>{label} {required && <span className="req">*</span>}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData[key]}
                        onChange={e => handleChange(key, e.target.value)}
                        onBlur={() => handleBlur(key)}
                        style={{ paddingLeft: 22 }}
                      />
                    </div>
                    <FieldError msg={errors[key]} />
                  </div>
                ))}
                {/* Annual CTC */}
                <div className="emp-field">
                  <label>Annual CTC (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.ctc}
                      onChange={e => handleChange('ctc', e.target.value)}
                      style={{ paddingLeft: 22 }}
                    />
                  </div>
                  <small className="emp-hint-text">Cost to company per year</small>
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            {/* Deductions */}
            <div className="emp-form-section">
              <div className="emp-section-label" style={{ color: '#dc2626' }}>📉 Deductions (Monthly)</div>
              <div className="emp-form-grid">
                {DEDUCTIONS.map(({ key, label }) => (
                  <div key={key} className="emp-field">
                    <label>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData[key]}
                        onChange={e => handleChange(key, e.target.value)}
                        style={{ paddingLeft: 22 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live salary preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, margin: '0 0 20px', background: 'var(--bg-surface)', borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border-light)' }}>
              {[
                { label: 'Gross / Month',  value: liveGross,  color: '#059669' },
                { label: 'Deductions',     value: liveDeduct, color: '#dc2626' },
                { label: 'Net / Month',    value: liveNet,    color: 'var(--accent-indigo)' },
                { label: 'Annual CTC',     value: parseFloat(formData.ctc) || liveGross * 12, color: '#7c3aed' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Sora',sans-serif" }}>₹{fmt(value)}</div>
                </div>
              ))}
            </div>

            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>Cancel</button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting
                  ? <><span className="emp-spinner" /> Saving…</>
                  : <><FaSave size={12} /> {editMode ? 'Update Structure' : 'Save Structure'}</>
                }
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalaryStructure;