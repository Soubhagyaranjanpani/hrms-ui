import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaTimes, FaPlus, FaClock, FaFilter, FaSpinner, FaSave, FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from '../components/Toast';
import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import LoadingSpinner from '../components/LoadingSpinner';

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const LeaveManagement = ({ user }) => {
  // ---------- State ----------
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    employeeName: "",
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    isHalfDay: false,
    halfDaySession: "MORNING",
    reason: "",
  });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}`,
    'Content-Type': 'application/json',
  });

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const response = await axios.get(API_ENDPOINTS.GET_CURRENT, { headers: getAuthHeaders() });
      const responseData = response.data;
      if (responseData?.status === 200) {
        const userString = responseData.response;
        const nameMatch = userString.match(/\(([^)]+)\)/);
        const emailMatch = userString.match(/^[^(]+/);
        const userName = nameMatch ? nameMatch[1] : '';
        const userEmail = emailMatch ? emailMatch[0].trim() : '';
        setCurrentUser({ name: userName, email: userEmail, fullName: userName });
        setFormData(prev => ({ ...prev, employeeName: userName || userEmail }));
      } else {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          setFormData(prev => ({ ...prev, employeeName: parsedUser?.name || parsedUser?.fullName || '' }));
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Fetch leave types
  const fetchLeaveTypes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.BASE_URL || 'http://localhost:8080/hrms'}/api/leave-type`, {
        headers: getAuthHeaders(),
      });
      const types = Array.isArray(response.data) ? response.data : [];
      setLeaveTypes(types);
      if (types.length === 0) toast.warning('No Leave Types', 'No leave types available');
    } catch (error) {
      console.error('Error fetching leave types:', error);
      toast.error('Error', 'Failed to load leave types');
      setLeaveTypes([]);
    }
  }, []);

  // Fetch my leaves
  const fetchMyLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.GET_MY_LEAVES, { headers: getAuthHeaders() });
      const responseData = response.data;
      let data = [];
      if (responseData?.status === 200 && Array.isArray(responseData.response)) data = responseData.response;
      else if (Array.isArray(responseData)) data = responseData;
      else if (responseData?.data && Array.isArray(responseData.data)) data = responseData.data;
      
      const transformedData = data.map(leave => ({
        id: leave.leaveId,
        leaveType: { name: leave.leaveType },
        leaveTypeName: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        days: leave.totalDays,
        status: leave.status,
        reason: leave.reason || '',
        createdAt: leave.appliedDate || leave.startDate,
        isHalfDay: leave.totalDays === 0.5,
        halfDaySession: null
      }));
      
      setLeaves(transformedData);
      setTotalElements(transformedData.length);
      setTotalPages(Math.ceil(transformedData.length / size));
      
      const total = transformedData.length;
      const pending = transformedData.filter(l => l.status === 'PENDING').length;
      const approved = transformedData.filter(l => l.status === 'APPROVED').length;
      const rejected = transformedData.filter(l => l.status === 'REJECTED').length;
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Error fetching my leaves:', error);
      toast.error('Error', 'Failed to load your leave requests');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [size]);

  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser();
      await fetchLeaveTypes();
      await fetchMyLeaves();
    };
    init();
  }, [fetchCurrentUser, fetchLeaveTypes, fetchMyLeaves]);

  const getFilteredLeaves = useCallback(() => {
    const leavesArray = Array.isArray(leaves) ? leaves : [];
    if (!debouncedSearch.trim()) return leavesArray;
    const term = debouncedSearch.toLowerCase().trim();
    return leavesArray.filter(leave => 
      (leave.leaveType?.name?.toLowerCase() || leave.leaveTypeName?.toLowerCase() || '').includes(term) ||
      (leave.reason?.toLowerCase() || '').includes(term) ||
      (leave.status?.toLowerCase() || '').includes(term)
    );
  }, [leaves, debouncedSearch]);

  const filteredLeaves = getFilteredLeaves();
  const getPaginatedLeaves = () => {
    if (!Array.isArray(filteredLeaves)) return [];
    const start = page * size;
    return filteredLeaves.slice(start, start + size);
  };
  const paginatedLeaves = getPaginatedLeaves();

  useEffect(() => {
    const filtered = getFilteredLeaves();
    const total = filtered.length;
    setTotalPages(Math.ceil(total / size));
    setTotalElements(total);
    if (page !== 0 && total > 0) setPage(0);
  }, [debouncedSearch, leaves]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const validateField = (field, value) => {
    switch(field) {
      case 'leaveTypeId': if (!value) return 'Leave type is required'; return '';
      case 'startDate':
        if (!value) return 'Start date is required';
        if (formData.endDate && new Date(value) > new Date(formData.endDate)) return 'Start date cannot be after end date';
        return '';
      case 'endDate':
        if (!formData.isHalfDay && !value) return 'End date is required';
        if (value && formData.startDate && new Date(value) < new Date(formData.startDate)) return 'End date cannot be before start date';
        return '';
      case 'reason':
        if (!value?.trim()) return 'Reason is required';
        if (value?.length > 500) return 'Reason cannot exceed 500 characters';
        return '';
      default: return '';
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const fieldsToValidate = ['leaveTypeId', 'startDate', 'reason'];
    if (!formData.isHalfDay) fieldsToValidate.push('endDate');
    const newErrors = {};
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setTouched(fieldsToValidate.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    if (Object.keys(newErrors).length > 0) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        leaveTypeId: parseInt(formData.leaveTypeId),
        startDate: formData.startDate,
        endDate: formData.isHalfDay ? formData.startDate : formData.endDate,
        isHalfDay: formData.isHalfDay,
        halfDaySession: formData.isHalfDay ? formData.halfDaySession : null,
        reason: formData.reason.trim(),
      };
      await axios.post(API_ENDPOINTS.APPLY_LEAVE, payload, { headers: getAuthHeaders() });
      toast.success('Success', 'Leave request submitted successfully');
      setFormData({
        employeeName: currentUser?.name || currentUser?.fullName || "",
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        isHalfDay: false,
        halfDaySession: "MORNING",
        reason: "",
      });
      setErrors({});
      setTouched({});
      setView('list');
      fetchMyLeaves();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit leave request';
      toast.error('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateString; }
  };

  const formatLeaveTypeName = (name) => name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : '-';

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'APPROVED': return 'badge-success';
      case 'PENDING':  return 'badge-warning';
      case 'REJECTED': return 'badge-danger';
      default:         return 'badge-info';
    }
  };
  const getStatusText = (status) => {
    switch(status) {
      case 'APPROVED': return 'Approved';
      case 'PENDING':  return 'Pending';
      case 'REJECTED': return 'Rejected';
      default: return status || 'Unknown';
    }
  };

  const getPaginationRange = () => {
    if (totalPages <= 1) return [];
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

  if (loading && view === 'list' && leaves.length === 0) return <LoadingSpinner message="Loading your leave requests..." />;

  // ──────────────────────────────────────────────────────────────
  // FORM VIEW (matching Branch/CreateTask design)
  // ──────────────────────────────────────────────────────────────
  if (view === 'form') {
    if (loadingUser) return <LoadingSpinner message="Loading user profile..." />;
    const fieldErrClass = (field) => (errors[field] && touched[field] ? 'has-error' : '');
    const fieldOkClass = (field) => (touched[field] && !errors[field] && formData[field] ? 'has-ok' : '');

    return (
      <div className="emp-root">
        <div className="emp-header" style={{ justifyContent: 'space-between' }}>
          <div>
            <h1 className="emp-title">Apply Leave</h1>
            <p className="emp-subtitle">Submit a new leave request</p>
          </div>
          <button className="emp-back-btn" onClick={() => { setView('list'); setErrors({}); setTouched({}); }}>
            <FaArrowLeft size={12} /> Back
          </button>
        </div>
        <div className="emp-form-wrap">
          <form onSubmit={handleFormSubmit} noValidate className="emp-form-compact">
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Leave Details</div>
              <div className="emp-form-grid-3col">
                <div className="emp-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Employee Name</label>
                  <input type="text" value={formData.employeeName || ''} style={{ background: '#f0f2ff', cursor: 'not-allowed', fontWeight: 500 }} readOnly />
                  <small className="task-hint-text">Auto-filled from your profile</small>
                </div>

                <div className={`emp-field-compact ${fieldErrClass('leaveTypeId')} ${fieldOkClass('leaveTypeId')}`}>
                  <label className="required">Leave Type</label>
                  <select name="leaveTypeId" value={formData.leaveTypeId} onChange={handleFormChange} onBlur={() => handleBlur('leaveTypeId')}>
                    <option value="">Select leave type</option>
                    {leaveTypes.map(type => <option key={type.id} value={type.id}>{formatLeaveTypeName(type.name)}</option>)}
                  </select>
                  <FieldError msg={errors.leaveTypeId} />
                </div>

                <div className={`emp-field-compact ${fieldErrClass('startDate')}`}>
                  <label className="required">Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleFormChange} onBlur={() => handleBlur('startDate')} />
                  <FieldError msg={errors.startDate} />
                </div>

                <div className={`emp-field-compact ${!formData.isHalfDay && fieldErrClass('endDate')}`}>
                  <label>{!formData.isHalfDay && <span className="required">End Date</span>}{formData.isHalfDay && 'End Date'}</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleFormChange} onBlur={() => handleBlur('endDate')} disabled={formData.isHalfDay} />
                  {formData.isHalfDay && <small className="task-hint-text">Disabled for half‑day requests</small>}
                  <FieldError msg={!formData.isHalfDay ? errors.endDate : ''} />
                </div>

                <div className="emp-field-compact">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="isHalfDay" checked={formData.isHalfDay} onChange={handleFormChange} style={{ width: '16px', height: '16px', margin: 0 }} />
                    Half Day Leave
                  </label>
                </div>

                {formData.isHalfDay && (
                  <div className="emp-field-compact">
                    <label className="required">Session</label>
                    <select name="halfDaySession" value={formData.halfDaySession} onChange={handleFormChange}>
                      <option value="MORNING">Morning (First Half)</option>
                      <option value="AFTERNOON">Afternoon (Second Half)</option>
                    </select>
                  </div>
                )}

                <div className={`emp-field-compact ${fieldErrClass('reason')}`} style={{ gridColumn: 'span 3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="required">Reason</label>
                    <span className="char-count" style={{ color: (formData.reason?.length || 0) > 400 ? '#f97316' : '#8b92b8' }}>
                      {(formData.reason?.length || 0)}/500
                    </span>
                  </div>
                  <textarea rows="3" name="reason" value={formData.reason} onChange={handleFormChange} onBlur={() => handleBlur('reason')} placeholder="Brief reason for leave..." maxLength={500} />
                  <FieldError msg={errors.reason} />
                  <small className="task-hint-text">Provide a clear reason for your leave request</small>
                </div>
              </div>
            </div>
            <div className="emp-form-actions">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); setErrors({}); setTouched({}); }}>Cancel</button>
              <button type="submit" className="emp-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting ? <><span className="emp-spinner" /> Submitting...</> : <><FaSave size={12} /> Apply Leave</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // LIST VIEW
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="emp-root">
      <div className="emp-header" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 className="emp-title">My Leaves</h1>
          <p className="emp-subtitle">{totalElements} total leave requests</p>
        </div>
        <button className="emp-add-btn" onClick={() => setView('form')}>
          <FaPlus size={13} /> Apply for Leave
        </button>
      </div>

      {/* Stats Cards - Centered (icon above label/value) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ padding: '20px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#6366f1', fontSize: 20 }}><FaFilter /></div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Total Requests</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.total}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>All time</div>
        </div>

        <div className="stat-card" style={{ padding: '20px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#f59e0b', fontSize: 20 }}><FaClock /></div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Pending</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.pending}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Awaiting approval</div>
        </div>

        <div className="stat-card" style={{ padding: '20px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#10b981', fontSize: 20 }}><FaCheckCircle /></div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Approved</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.approved}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Approved leaves</div>
        </div>

        <div className="stat-card" style={{ padding: '20px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#ef4444', fontSize: 20 }}><FaTimesCircle /></div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Rejected</div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.rejected}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Rejected leaves</div>
        </div>
      </div>

      <div className="emp-search-bar">
        <div className="emp-search-wrap">
          <FaSearch className="emp-search-icon" size={12} />
          <input className="emp-search-input" type="text" placeholder="Search by leave type, reason or status…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button className="emp-search-clear" onClick={() => setSearchTerm('')}><FaTimes size={11} /></button>}
        </div>
      </div>

      <div className="emp-table-card">
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr><th>#</th><th>Leave Type</th><th>Duration</th><th>Days</th><th>Session</th><th>Reason</th><th>Applied Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="emp-empty"><div className="emp-empty-inner"><FaSpinner className="emp-spinner" style={{ width: 24, height: 24, marginBottom: 12 }} /><p>Loading your leave requests...</p></div></td></tr>
              ) : paginatedLeaves.length > 0 ? (
                paginatedLeaves.map((leave, idx) => (
                  <tr key={leave?.id || idx} className="emp-row">
                    <td className="emp-sno">{page * size + idx + 1}</td>
                    <td><span className="emp-pill emp-pill--indigo">{formatLeaveTypeName(leave?.leaveType?.name || leave?.leaveTypeName)}</span></td>
                    <td className="emp-date">{formatDate(leave?.startDate)} → {formatDate(leave?.endDate)}</td>
                    <td>{leave?.totalDays || leave?.days || 1}</td>
                    <td>{leave?.isHalfDay ? (leave?.halfDaySession === 'MORNING' ? 'Morning' : 'Afternoon') : 'Full Day'}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{leave?.reason || '-'}</td>
                    <td className="emp-date">{formatDate(leave?.createdAt || leave?.appliedDate)}</td>
                    <td><span className={getStatusBadgeClass(leave?.status)}>{getStatusText(leave?.status)}</span></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="emp-empty"><div className="emp-empty-inner"><span className="emp-empty-icon">📋</span><p>No leave requests found</p><small>Apply for a new leave using the button above</small></div></td></tr>
              )}
            </tbody>
           </table>
        </div>

        {totalPages > 1 && (
          <div className="emp-pagination">
            <span className="emp-page-info">Showing {page * size + 1}–{Math.min((page + 1) * size, totalElements)} of {totalElements} requests</span>
            <div className="emp-page-controls">
              <button className="emp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
              {getPaginationRange().map((pg, i) => pg === '...' ? <span key={`dots-${i}`} className="emp-page-dots">…</span> : (
                <button key={pg} className={`emp-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg + 1}</button>
              ))}
              <button className="emp-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;