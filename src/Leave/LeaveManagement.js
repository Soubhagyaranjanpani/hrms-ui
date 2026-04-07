import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaTimes, FaPlus, FaClock, FaFilter, FaSpinner, FaSave, FaArrowLeft } from 'react-icons/fa';
import { toast } from '../components/Toast';
import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import LoadingSpinner from '../components/LoadingSpinner';

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
  
  // Current user state
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

  // Helper: get auth headers
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}`,
    'Content-Type': 'application/json',
  });

  // Fetch current user profile
  const fetchCurrentUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const response = await axios.get(API_ENDPOINTS.GET_CURRENT, {
        headers: getAuthHeaders(),
      });
      const responseData = response.data;
      if (responseData?.status === 200) {
        const userString = responseData.response;
        const nameMatch = userString.match(/\(([^)]+)\)/);
        const emailMatch = userString.match(/^[^(]+/);
        const userName = nameMatch ? nameMatch[1] : '';
        const userEmail = emailMatch ? emailMatch[0].trim() : '';
        
        setCurrentUser({ name: userName, email: userEmail, fullName: userName });
        setFormData(prev => ({ ...prev, employeeName: userName || userEmail }));
      } else if (responseData?.response) {
        const userString = responseData.response;
        const nameMatch = userString.match(/\(([^)]+)\)/);
        const userName = nameMatch ? nameMatch[1] : '';
        setCurrentUser({ name: userName, email: userString, fullName: userName });
        setFormData(prev => ({ ...prev, employeeName: userName || userString }));
      } else {
        setCurrentUser({ name: 'User', email: '' });
        setFormData(prev => ({ ...prev, employeeName: 'User' }));
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          setFormData(prev => ({ ...prev, employeeName: parsedUser?.name || parsedUser?.fullName || '' }));
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
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
      
      if (types.length === 0) {
        toast.warning('No Leave Types', 'No leave types available for selection');
      }
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
      const response = await axios.get(API_ENDPOINTS.GET_MY_LEAVES, {
        headers: getAuthHeaders(),
      });
      
      const responseData = response.data;
      let data = [];
      
      if (responseData?.status === 200 && Array.isArray(responseData.response)) {
        data = responseData.response;
      } else if (Array.isArray(responseData)) {
        data = responseData;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        data = responseData.data;
      } else {
        data = [];
      }
      
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

  // Initialize data
  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser();
      await fetchLeaveTypes();
      await fetchMyLeaves();
    };
    init();
  }, [fetchCurrentUser, fetchLeaveTypes, fetchMyLeaves]);

  // Get filtered leaves - ALWAYS returns array
  const getFilteredLeaves = useCallback(() => {
    const leavesArray = Array.isArray(leaves) ? leaves : [];
    
    if (!debouncedSearch || debouncedSearch.trim() === '') {
      return leavesArray;
    }
    
    const term = debouncedSearch.toLowerCase().trim();
    return leavesArray.filter(leave => {
      if (!leave) return false;
      return (
        (leave.leaveType?.name?.toLowerCase() || leave.leaveTypeName?.toLowerCase() || '').includes(term) ||
        (leave.reason?.toLowerCase() || '').includes(term) ||
        (leave.status?.toLowerCase() || '').includes(term)
      );
    });
  }, [leaves, debouncedSearch]);

  const filteredLeaves = getFilteredLeaves();
  
  const getPaginatedLeaves = () => {
    if (!Array.isArray(filteredLeaves)) {
      return [];
    }
    const start = page * size;
    const end = start + size;
    return filteredLeaves.slice(start, end);
  };
  
  const paginatedLeaves = getPaginatedLeaves();

  // Update pagination when filtered list changes
  useEffect(() => {
    const filtered = getFilteredLeaves();
    const total = Array.isArray(filtered) ? filtered.length : 0;
    setTotalPages(Math.ceil(total / size));
    setTotalElements(total);
    if (page !== 0 && total > 0) {
      setPage(0);
    }
  }, [debouncedSearch, leaves]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Validation functions
  const validateField = (field, value) => {
    switch(field) {
      case 'leaveTypeId':
        if (!value) return 'Leave type is required';
        return '';
      case 'startDate':
        if (!value) return 'Start date is required';
        if (formData.endDate && new Date(value) > new Date(formData.endDate)) {
          return 'Start date cannot be after end date';
        }
        return '';
      case 'endDate':
        if (!formData.isHalfDay && !value) return 'End date is required';
        if (value && formData.startDate && new Date(value) < new Date(formData.startDate)) {
          return 'End date cannot be before start date';
        }
        return '';
      case 'reason':
        if (!value?.trim()) return 'Reason is required';
        if (value?.length > 500) return 'Reason cannot exceed 500 characters';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const getStatusBadge = (status) => {
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
      default:         return status || 'Unknown';
    }
  };

  // Format leave type name
  const formatLeaveTypeName = (name) => {
    if (!name) return '-';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Pagination range
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

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
    
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
      
      const response = await axios.post(API_ENDPOINTS.APPLY_LEAVE, payload, {
        headers: getAuthHeaders(),
      });
      
      if (response.data?.status === 200) {
        toast.success('Success', response.data?.message || 'Leave request submitted successfully');
      } else {
        toast.success('Success', 'Leave request submitted successfully');
      }
      
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Loading state
  if (loading && view === 'list' && leaves.length === 0) {
    return <LoadingSpinner message="Loading your leave requests..." />;
  }

  // ---------- FORM VIEW (Back button moved to right side) ----------
  if (view === 'form') {
    if (loadingUser) {
      return <LoadingSpinner message="Loading user profile..." />;
    }

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
          <form onSubmit={handleFormSubmit} noValidate>
            <div className="emp-form-section">
              <div className="emp-section-label">Leave Details</div>
              <div className="emp-form-grid">
                
                <div className="emp-field">
                  <label>Employee Name</label>
                  <input
                    type="text"
                    value={formData.employeeName || ''}
                    style={{ background: '#f0f2ff', cursor: 'not-allowed', fontWeight: 500 }}
                  />
                  <small className="emp-hint-text">Auto-filled from your profile</small>
                </div>

                <div className={`emp-field ${touched.leaveTypeId && errors.leaveTypeId ? 'has-error' : ''}`}>
                  <label>Leave Type <span className="req">*</span></label>
                  <select
                    name="leaveTypeId"
                    value={formData.leaveTypeId}
                    onChange={handleFormChange}
                    onBlur={() => handleBlur('leaveTypeId')}
                    required
                  >
                    <option value="">Select leave type</option>
                    {Array.isArray(leaveTypes) && leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {formatLeaveTypeName(type.name)}
                      </option>
                    ))}
                  </select>
                  {touched.leaveTypeId && errors.leaveTypeId && (
                    <span className="field-err">{errors.leaveTypeId}</span>
                  )}
                </div>

                <div className={`emp-field ${touched.startDate && errors.startDate ? 'has-error' : ''}`}>
                  <label>Start Date <span className="req">*</span></label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    onBlur={() => handleBlur('startDate')}
                    required
                  />
                  {touched.startDate && errors.startDate && (
                    <span className="field-err">{errors.startDate}</span>
                  )}
                </div>

                <div className={`emp-field ${!formData.isHalfDay && touched.endDate && errors.endDate ? 'has-error' : ''}`}>
                  <label>End Date {!formData.isHalfDay && <span className="req">*</span>}</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    onBlur={() => handleBlur('endDate')}
                    required={!formData.isHalfDay}
                    disabled={formData.isHalfDay}
                  />
                  {formData.isHalfDay && (
                    <span className="emp-hint-text">Disabled for half‑day requests</span>
                  )}
                  {!formData.isHalfDay && touched.endDate && errors.endDate && (
                    <span className="field-err">{errors.endDate}</span>
                  )}
                </div>

                <div className="emp-field">
                  <label>&nbsp;</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="isHalfDay"
                      checked={formData.isHalfDay}
                      onChange={handleFormChange}
                      style={{ width: '16px', height: '16px', margin: 0 }}
                    />
                    Half Day Leave
                  </label>
                </div>

                {formData.isHalfDay && (
                  <div className="emp-field">
                    <label>Session <span className="req">*</span></label>
                    <select
                      name="halfDaySession"
                      value={formData.halfDaySession}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="MORNING">Morning (First Half)</option>
                      <option value="AFTERNOON">Afternoon (Second Half)</option>
                    </select>
                  </div>
                )}

                <div className={`emp-field ${touched.reason && errors.reason ? 'has-error' : ''}`} style={{ gridColumn: '1 / -1' }}>
                  <div className="emp-label-row">
                    <label>Reason <span className="req">*</span></label>
                    <span className="char-count" style={{ color: (formData.reason?.length || 0) > 400 ? '#f97316' : '#8b92b8' }}>
                      {(formData.reason?.length || 0)}/500
                    </span>
                  </div>
                  <textarea
                    name="reason"
                    rows="3"
                    value={formData.reason}
                    onChange={handleFormChange}
                    onBlur={() => handleBlur('reason')}
                    required
                    placeholder="Brief reason for leave..."
                    maxLength={500}
                  />
                  {touched.reason && errors.reason && (
                    <span className="field-err">{errors.reason}</span>
                  )}
                  <small className="emp-hint-text">Provide a clear reason for your leave request</small>
                </div>
              </div>
            </div>

            <div className="emp-divider"></div>

            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); setErrors({}); setTouched({}); }}>
                Cancel
              </button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting ? <><FaSpinner className="emp-spinner" /> Submitting...</> : <><FaSave size={12} /> Apply Leave</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------- LIST VIEW ----------
  return (
    <div className="emp-root">
      <div className="emp-header">
        <div className="emp-header-left">
          <div>
            <h1 className="emp-title">My Leaves</h1>
            <p className="emp-subtitle">{totalElements} total leave requests</p>
          </div>
        </div>
        <button className="emp-add-btn" onClick={() => setView('form')}>
          <FaPlus size={13} /> Apply for Leave
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Total Requests</p>
                <h3 className="fw-bold mb-0">{stats.total}</h3>
              </div>
              <div className="stat-icon icon-indigo">
                <FaFilter color="#6366f1" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Pending</p>
                <h3 className="fw-bold mb-0">{stats.pending}</h3>
              </div>
              <div className="stat-icon icon-amber">
                <FaClock color="#f59e0b" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Approved</p>
                <h3 className="fw-bold mb-0">{stats.approved}</h3>
              </div>
              <div className="stat-icon icon-teal">
                <span style={{ fontSize: '20px' }}>✓</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Rejected</p>
                <h3 className="fw-bold mb-0">{stats.rejected}</h3>
              </div>
              <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
                <span style={{ fontSize: '20px' }}>✗</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="emp-search-bar">
        <div className="emp-search-wrap">
          <FaSearch className="emp-search-icon" size={12} />
          <input
            className="emp-search-input"
            type="text"
            placeholder="Search by leave type, reason or status…"
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
                <th>#</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Session</th>
                <th>Reason</th>
                <th>Applied Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="emp-empty">
                    <div className="emp-empty-inner">
                      <FaSpinner className="emp-spinner" style={{ width: '24px', height: '24px', marginBottom: '12px' }} />
                      <p>Loading your leave requests...</p>
                    </div>
                   </td>
                 </tr>
              ) : paginatedLeaves.length > 0 ? (
                paginatedLeaves.map((leave, idx) => (
                  <tr key={leave?.id || idx} className="emp-row">
                    <td className="emp-sno">{page * size + idx + 1}</td>
                    <td>
                      <span className="emp-pill emp-pill--indigo">
                        {formatLeaveTypeName(leave?.leaveType?.name || leave?.leaveTypeName || '-')}
                      </span>
                    </td>
                    <td className="emp-date">
                      {formatDate(leave?.startDate)} → {formatDate(leave?.endDate)}
                    </td>
                    <td>{leave?.totalDays || leave?.days || 1}</td>
                    <td>
                      {leave?.isHalfDay ? (
                        <span className="emp-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                          {leave?.halfDaySession === 'MORNING' ? 'Morning' : 'Afternoon'}
                        </span>
                      ) : (
                        <span className="emp-pill" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                          Full Day
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {leave?.reason || '-'}
                    </td>
                    <td className="emp-date">{formatDate(leave?.createdAt || leave?.appliedDate)}</td>
                    <td>
                      <span className={getStatusBadge(leave?.status)}>
                        {getStatusText(leave?.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="emp-empty">
                    <div className="emp-empty-inner">
                      <span className="emp-empty-icon">📋</span>
                      <p>No leave requests found</p>
                      <small>Apply for a new leave using the button above</small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="emp-pagination">
            <span className="emp-page-info">
              Showing {page * size + 1}–{Math.min((page + 1) * size, totalElements)} of {totalElements} requests
            </span>
            <div className="emp-page-controls">
              <button className="emp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
              {getPaginationRange().map((pg, i) =>
                pg === '...' ? <span key={`dots-${i}`} className="emp-page-dots">…</span> : (
                  <button key={pg} className={`emp-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
                    {pg + 1}
                  </button>
                )
              )}
              <button className="emp-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;