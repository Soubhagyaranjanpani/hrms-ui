import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit,
  FaArrowLeft, FaCheckCircle, FaCircle, FaExclamationCircle
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../../config/api.config';

/* ─── Validation Rules ─── */
const RULES = {
  roundName: {
    required: true,
    maxLen: 100,
    pattern: /^[a-zA-Z0-9\s\-\.]+$/,
    patternMsg: 'Only letters, numbers, spaces, hyphens and dots allowed',
  },
  roundSequence: {
    required: true,
    pattern: /^\d+$/,
    patternMsg: 'Enter a valid positive number',
  },
  departmentId: {
    required: true,
  },
  maxScore: {
    required: true,
    pattern: /^\d+$/,
    patternMsg: 'Enter a valid positive number',
    max: 1000,
  },
  passingScore: {
    required: true,
    pattern: /^\d+$/,
    patternMsg: 'Enter a valid positive number',
  },
};

const validate = (field, value, formData) => {
  const r = RULES[field];
  if (!r) return '';
  const v = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  if (r.required && !v) return 'This field is required';
  if (!v && !r.required) return '';
  if (r.maxLen && v.length > r.maxLen) return `Maximum ${r.maxLen} characters`;
  if (r.pattern && !r.pattern.test(v)) return r.patternMsg;
  if (r.max && Number(v) > r.max) return `Cannot exceed ${r.max}`;
  if (field === 'passingScore' && formData?.maxScore) {
    if (Number(v) > Number(formData.maxScore)) return 'Passing Score cannot exceed Maximum Score';
  }
  return '';
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const CharCount = ({ value, max }) => {
  const len = (value || '').length;
  const warn = len > max * 0.85;
  return (
    <span className="char-count" style={{ color: warn ? '#f97316' : '#8b92b8' }}>
      {len}/{max}
    </span>
  );
};

const InterviewRoundMaster = () => {
  /* ─── View State ─── */
  const [view, setView] = useState('list');
  const [editMode, setEditMode] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);

  /* ─── Data State ─── */
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ─── Pagination & Search ─── */
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  /* ─── Status Modal ─── */
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: '' });

  /* ─── Form State ─── */
  const [formData, setFormData] = useState({
    roundCode: '',
    roundName: '',
    roundSequence: '',
    applicableDepartment: '',   // for display only
    departmentId: '',           // ✅ what gets sent
    mandatory: true,
    maxScore: '',
    passingScore: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /* ─── Departments ─── */
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  /* ─── Auth Helpers ─── */
  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  };

  const ensureToken = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication Required', 'Please login to continue');
      return false;
    }
    return true;
  };

  /* ─── Debounced Search ─── */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ─── Fetch Departments for Dropdown ─── */
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const res = await axios.get(`${BASE_URL}/departments/list?flag=0`, axiosConfig);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.response)
        ? res.data.response
        : [];

      setDepartments(
        list.map((d) => ({
          value: d.id,                 //  ID as option value
          label: d.name || d.code,
          id: d.id,
        }))
      );
    } catch (err) {
      console.error('Fetch departments error:', err);
      setDepartments([]);              // no fake fallback with missing IDs
    } finally {
      setLoadingDepartments(false);
    }
  };

  /* ─── Fetch All Interview Rounds ─── */
  const fetchRounds = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const url = `${BASE_URL}/api/recuirment/getAllInterviewRound`;
      const res = await axios.get(url, axiosConfig);

      let list = [];
      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res.data?.response)) {
        list = res.data.response;
      } else if (Array.isArray(res.data?.data)) {
        list = res.data.data;
      }

      const mapped = list.map((r) => {
        const isMandatory =
          r.mandatory === true ||
          String(r.mandatory ?? '').trim().toLowerCase() === 'yes';

        const isActive =
          r.status === true ||
          String(r.status ?? '').trim().toLowerCase() === 'y' ||
          String(r.status ?? '').trim().toLowerCase() === 'active';

        return {
          id: r.id,
          roundCode: r.roundCode || r.code || '',
          roundName: r.roundName || r.name || '',
          roundSequence: r.roundSequence || r.sequence || '',
          applicableDepartment: r.departmentName || r.applicableDepartment || '',
          departmentId: r.departmentId ?? '',
          mandatory: isMandatory,
          maxScore: Number(r.maximumScore ?? r.maxScore ?? 0),
          passingScore: Number(r.passingScore ?? 0),
          status: isActive ? 'Active' : 'Inactive',
        };
      });

      setRounds(mapped);
    } catch (err) {
      console.error('🔴 [fetchRounds] error:', err);
      console.error('🔴 [fetchRounds] err.response?.data:', err.response?.data);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch interview rounds');
      setRounds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRounds();
    fetchDepartments();
  }, [fetchRounds]);

  /* ─── Filter + Sort: Active first ─── */
  const filteredRounds = rounds
    .filter((item) => {
      const s = debouncedSearch.toLowerCase();
      return (
        item.roundCode?.toLowerCase().includes(s) ||
        item.roundName?.toLowerCase().includes(s) ||
        item.applicableDepartment?.toLowerCase().includes(s) ||
        String(item.roundSequence).includes(s)
      );
    })
    .sort((a, b) => {
      if (a.status === 'Active' && b.status === 'Inactive') return -1;
      if (a.status === 'Inactive' && b.status === 'Active') return 1;
      return 0;
    });

  const totalItems = filteredRounds.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentRounds = filteredRounds.slice(startIndex, startIndex + rowsPerPage);

  /* ─── Generate Round Code ─── */
  const generateRoundCode = () => {
    const count = rounds.length + 1;
    return `RND${String(count).padStart(3, '0')}`;
  };

  /* ─── Form Handlers ─── */
  const handleChange = (field, value) => {
    if (field === 'roundSequence' || field === 'maxScore' || field === 'passingScore') {
      value = String(value).replace(/[^0-9]/g, '');
    }
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, value, updated) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, formData[field], formData) }));
  };

  const resetForm = () => {
    setFormData({
      roundCode: generateRoundCode(),
      roundName: '',
      roundSequence: '',
      applicableDepartment: '',
      departmentId: '',
      mandatory: true,
      maxScore: '',
      passingScore: '',
    });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedRound(null);
  };

  /* ─── Submit (Create / Update) ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    const fieldsToValidate = ['roundName', 'roundSequence', 'departmentId', 'maxScore', 'passingScore'];
    const newErrors = {};
    const newTouched = {};

    fieldsToValidate.forEach((f) => {
      newTouched[f] = true;
      newErrors[f] = validate(f, formData[f], formData);
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e)) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    // Extra guard against NaN departmentId
    if (!formData.departmentId || isNaN(Number(formData.departmentId))) {
      toast.warning('Validation Error', 'Please select a department');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        roundCode: formData.roundCode,
        roundName: formData.roundName.trim(),
        roundSequence: String(formData.roundSequence),
        mandatory: formData.mandatory ? 'yes' : 'NO',
        maximumScore: String(formData.maxScore),
        passingScore: String(formData.passingScore),
        status: 'y',
        departmentId: Number(formData.departmentId),    // ✅ always numeric
      };

      const headers = {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      };

      let res;
      if (editMode && selectedRound) {
        const url = `${BASE_URL}/api/recuirment/updateInterviewRoundById/${selectedRound.id}`;
        res = await axios.put(url, payload, headers);
      } else {
        const url = `${BASE_URL}/api/recuirment/saveInterviewRound`;
        res = await axios.post(url, payload, headers);
      }

      if (res.status === 200 || res.status === 201) {
        toast.success('Success', editMode ? 'Interview round updated' : 'Interview round created');
        resetForm();
        setView('list');
        fetchRounds();
      } else {
        throw new Error(res.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('🔴 [submit] error:', err);
      console.error('🔴 [submit] status:', err.response?.status);
      console.error('🔴 [submit] data:', err.response?.data);
      toast.error('Error', err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Edit ─── */
  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      toast.warning('Inactive', 'Cannot edit an inactive interview round');
      return;
    }
    setFormData({
      roundCode: item.roundCode,
      roundName: item.roundName,
      roundSequence: String(item.roundSequence),
      applicableDepartment: item.applicableDepartment,
      departmentId: item.departmentId || '',
      mandatory: item.mandatory,
      maxScore: String(item.maxScore),
      passingScore: String(item.passingScore),
    });
    setSelectedRound(item);
    setEditMode(true);
    setView('form');
  };

  /* ─── Status Toggle ─── */
  const handleStatusToggle = (id, currentStatus, name) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({ id, newStatus, name });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    const { id, newStatus, name } = statusAction;
    setLoading(true);
    try {
      const url = `${BASE_URL}/api/recuirment/updateInterviewRoundStatus/${id}`;
      const headers = {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      };
      const res = await axios.put(url, null, headers);

      if (res.status === 200) {
        toast.success('Status Updated', `${name} is now ${newStatus}`);
        fetchRounds();
      } else {
        throw new Error(res.data?.message || 'Status change failed');
      }
    } catch (err) {
      console.error('🔴 [status] error:', err);
      console.error('🔴 [status] data:', err.response?.data);
      toast.error('Error', err.response?.data?.message || 'Failed to change status');
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, newStatus: null, name: '' });
    }
  };

  /* ─── Pagination Range ─── */
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

  const isFieldOk = (f) => touched[f] && !errors[f] && String(formData[f] ?? '').trim();
  const isFieldErr = (f) => touched[f] && !!errors[f];

  if (loading && view === 'list' && rounds.length === 0) {
    return <LoadingSpinner message="Loading interview rounds..." />;
  }

  return (
    <>
      <div className="emp-root">
        {/* Header */}
        <div className="emp-header" style={view === 'form' ? { justifyContent: 'space-between' } : {}}>
          {view === 'form' ? (
            <>
              <div>
                <h1 className="emp-title">{editMode ? 'Edit Interview Round' : 'Add Interview Round'}</h1>
                <p className="emp-subtitle">
                  {editMode ? 'Update interview round information' : 'Enter new interview round details'}
                </p>
              </div>
              <button
                className="emp-back-btn"
                onClick={() => { resetForm(); setView('list'); }}
              >
                <FaArrowLeft size={12} /> Back
              </button>
            </>
          ) : (
            <>
              <div className="emp-header-left">
                <div>
                  <h1 className="emp-title">Interview Round Master</h1>
                  <p className="emp-subtitle">{totalItems} total interview rounds</p>
                </div>
              </div>
              <button
                className="emp-add-btn"
                onClick={() => {
                  resetForm();
                  setFormData((prev) => ({ ...prev, roundCode: generateRoundCode() }));
                  setView('form');
                }}
              >
                <FaPlus size={13} /> Add Interview Round
              </button>
            </>
          )}
        </div>

        {/* LIST VIEW */}
        {view === 'list' ? (
          <>
            <div className="emp-search-bar">
              <div className="emp-search-wrap">
                <FaSearch className="emp-search-icon" size={12} />
                <input
                  className="emp-search-input"
                  type="text"
                  placeholder="Search by code, name, department or sequence..."
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

            <div className="emp-table-card">
              <div className="emp-table-wrap">
                <table className="emp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Round Code</th>
                      <th>Round Name</th>
                      <th style={{ textAlign: 'center' }}>Sequence</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'center' }}>Mandatory</th>
                      <th style={{ textAlign: 'center' }}>Max Score</th>
                      <th style={{ textAlign: 'center' }}>Passing Score</th>
                      <th style={{ width: 100, textAlign: 'center' }}>Status</th>
                      <th style={{ width: 70, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRounds.length > 0 ? (
                      currentRounds.map((item, idx) => (
                        <tr key={item.id} className="emp-row">
                          <td className="emp-sno">{startIndex + idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: 13 }}>
                              {item.roundCode}
                            </span>
                          </td>
                          <td><div className="emp-name">{item.roundName}</div></td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 32, height: 32, borderRadius: '50%',
                              background: '#ede9fe', color: '#6d28d9', fontWeight: 600, fontSize: 14,
                            }}>
                              {item.roundSequence}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              background: '#e0e7ff', color: '#3730a3',
                              padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                            }}>
                              {item.applicableDepartment}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.mandatory ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: '#d1fae5', color: '#065f46',
                                padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                              }}>
                                <FaCheckCircle size={10} /> Yes
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: '#f3f4f6', color: '#6b7280',
                                padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                              }}>
                                <FaCircle size={10} /> No
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>
                            {item.maxScore}
                          </td>
                          <td style={{
                            textAlign: 'center', fontWeight: 600,
                            color: item.passingScore >= 70 ? '#065f46' : '#b45309',
                          }}>
                            {item.passingScore}
                          </td>
                          <td>
                            <div
                              onClick={() => handleStatusToggle(item.id, item.status, item.roundName)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                            >
                              <div style={{
                                width: 28, height: 16, borderRadius: 50,
                                backgroundColor: item.status === 'Active' ? '#9d174d' : '#d1d5db',
                                position: 'relative', transition: '0.2s',
                              }}>
                                <div style={{
                                  width: 12, height: 12, borderRadius: '50%',
                                  backgroundColor: '#fff', position: 'absolute',
                                  top: 2, left: item.status === 'Active' ? 14 : 2,
                                  transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                }} />
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 500,
                                color: item.status === 'Active' ? '#9d174d' : '#94a3b8',
                              }}>
                                {item.status}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="emp-actions" style={{ justifyContent: 'center' }}>
                              <button
                                className="emp-act emp-act--edit"
                                onClick={() => handleEdit(item)}
                                title={item.status === 'Inactive' ? 'Cannot edit inactive round' : 'Edit'}
                                style={{ opacity: item.status === 'Inactive' ? 0.5 : 1 }}
                                disabled={item.status === 'Inactive'}
                              >
                                <FaEdit size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="emp-empty">
                          <div className="emp-empty-inner">
                            <span className="emp-empty-icon">📋</span>
                            <p>No interview rounds found</p>
                            <small>Try a different search or add a new round</small>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <div className="emp-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="emp-page-info">
                      Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} rounds
                    </span>
                  </div>
                  <div className="emp-page-controls">
                    <button className="emp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
                    {getPaginationRange().map((pg, i) =>
                      pg === '...' ? (
                        <span key={`dots-${i}`} className="emp-page-dots">…</span>
                      ) : (
                        <button
                          key={pg}
                          className={`emp-page-num ${pg === page ? 'active' : ''}`}
                          onClick={() => setPage(pg)}
                        >
                          {pg + 1}
                        </button>
                      )
                    )}
                    <button
                      className="emp-page-btn"
                      disabled={page + 1 >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* FORM VIEW */
          <div className="emp-form-wrap">
            <form onSubmit={handleSubmit} noValidate className="emp-form-compact">
              <div className="emp-form-section-compact">
                <div className="emp-section-label">Interview Round Details</div>
                <div className="emp-form-grid-3col">

                  {/* Round Code (Auto) */}
                  <div className="emp-field-compact">
                    <div className="emp-label-row">
                      <label>Round Code</label>
                    </div>
                    <input
                      type="text"
                      value={formData.roundCode}
                      readOnly
                      placeholder="Auto-generated"
                      style={{ background: '#f8f9fc', cursor: 'not-allowed' }}
                    />
                    <small style={{ fontSize: 12, color: '#6b7280' }}>Auto-generated</small>
                  </div>

                  {/* Round Name */}
                  <div className={`emp-field-compact ${isFieldErr('roundName') ? 'has-error' : ''} ${isFieldOk('roundName') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>Round Name <span className="req">*</span></label>
                      <CharCount value={formData.roundName} max={100} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Technical Round, HR Round"
                      value={formData.roundName}
                      maxLength={100}
                      onChange={(e) => handleChange('roundName', e.target.value)}
                      onBlur={() => handleBlur('roundName')}
                    />
                    <FieldError msg={errors.roundName} />
                    <small style={{ fontSize: 12, color: '#6b7280' }}>
                      Max 100 characters, no special characters
                    </small>
                  </div>

                  {/* Round Sequence */}
                  <div className={`emp-field-compact ${isFieldErr('roundSequence') ? 'has-error' : ''} ${isFieldOk('roundSequence') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>Round Sequence <span className="req">*</span></label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g., 1, 2, 3"
                      value={formData.roundSequence}
                      onChange={(e) => handleChange('roundSequence', e.target.value)}
                      onBlur={() => handleBlur('roundSequence')}
                    />
                    <FieldError msg={errors.roundSequence} />
                    <small style={{ fontSize: 12, color: '#6b7280' }}>Must be unique positive number</small>
                  </div>

                  {/* Applicable Department */}
                  <div className={`emp-field-compact ${isFieldErr('departmentId') ? 'has-error' : ''} ${isFieldOk('departmentId') ? 'has-ok' : ''}`}>
                    <label>Applicable Department <span className="req">*</span></label>
                    <select
                      value={formData.departmentId || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        const dept = departments.find((d) => String(d.id) === String(id));
                        setFormData((prev) => ({
                          ...prev,
                          departmentId: id,
                          applicableDepartment: dept?.label || '',
                        }));
                        if (touched.departmentId) {
                          setErrors((prev) => ({ ...prev, departmentId: '' }));
                        }
                      }}
                      onBlur={() => handleBlur('departmentId')}
                      disabled={loadingDepartments}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.label}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.departmentId} />
                  </div>

                  {/* Mandatory */}
                  <div className="emp-field-compact">
                    <label>Mandatory</label>
                    <select
                      value={String(formData.mandatory)}
                      onChange={(e) => handleChange('mandatory', e.target.value === 'true')}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  {/* Max Score */}
                  <div className={`emp-field-compact ${isFieldErr('maxScore') ? 'has-error' : ''} ${isFieldOk('maxScore') ? 'has-ok' : ''}`}>
                    <label>Maximum Score <span className="req">*</span></label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="e.g., 100"
                      value={formData.maxScore}
                      onChange={(e) => handleChange('maxScore', e.target.value)}
                      onBlur={() => handleBlur('maxScore')}
                    />
                    <FieldError msg={errors.maxScore} />
                    <small style={{ fontSize: 12, color: '#6b7280' }}>Max 1000</small>
                  </div>

                  {/* Passing Score */}
                  <div className={`emp-field-compact ${isFieldErr('passingScore') ? 'has-error' : ''} ${isFieldOk('passingScore') ? 'has-ok' : ''}`}>
                    <label>Passing Score <span className="req">*</span></label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g., 70"
                      value={formData.passingScore}
                      onChange={(e) => handleChange('passingScore', e.target.value)}
                      onBlur={() => handleBlur('passingScore')}
                    />
                    <FieldError msg={errors.passingScore} />
                    <small style={{ fontSize: 12, color: '#6b7280' }}>
                      Must be less than or equal to Maximum Score
                    </small>
                  </div>
                </div>
              </div>

              <div className="emp-form-actions">
                <button
                  type="button"
                  className="emp-cancel-btn"
                  onClick={() => { resetForm(); setView('list'); }}
                >
                  <FaTimes size={12} /> Cancel
                </button>
                <button
                  type="submit"
                  className="emp-add-btn"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {submitting ? (
                    <>
                      <span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}
                    </>
                  ) : (
                    <>
                      <FaSave size={12} /> {editMode ? 'Update Interview Round' : 'Save Interview Round'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Status Confirmation Modal */}
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
                  ? 'Inactive interview rounds cannot be used in recruitment process.'
                  : 'This interview round will become available for selection.'}
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
    </>
  );
};

export default InterviewRoundMaster;