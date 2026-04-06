import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaTimes, FaPlus, FaCheck, FaClock, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

const LeaveManagement = ({ user }) => {
  // ---------- Mock leave data ----------
  const [leaves, setLeaves] = useState([
    { id: 1, employee: 'Emma Watson', type: 'Sick Leave', startDate: '2024-04-05', endDate: '2024-04-06', days: 2, status: 'Pending', reason: 'Flu', appliedDate: '2024-04-01' },
    { id: 2, employee: 'Olivia Davis', type: 'Casual Leave', startDate: '2024-04-10', endDate: '2024-04-10', days: 1, status: 'Approved', reason: 'Personal', appliedDate: '2024-03-28' },
    { id: 3, employee: 'Liam Brown', type: 'Paid Leave', startDate: '2024-04-15', endDate: '2024-04-18', days: 4, status: 'Pending', reason: 'Vacation', appliedDate: '2024-04-02' },
    { id: 4, employee: 'Ava Martinez', type: 'Sick Leave', startDate: '2024-04-08', endDate: '2024-04-09', days: 2, status: 'Rejected', reason: 'Doctor appointment', appliedDate: '2024-04-01' },
  ]);

  // UI view: 'list' or 'form'
  const [view, setView] = useState('list');

  // List view state (search, pagination)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Form state (moved to top level to satisfy hooks rules)
  const [formData, setFormData] = useState({
    employeeName: "",
    leaveType: "CL",
    fromDate: "",
    toDate: "",
    isHalfDay: false,
    halfDaySession: "first",
    reason: "",
  });
  const [message, setMessage] = useState("");

  // Stats
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;

  // Filter leaves
  const filterLeaves = useCallback(() => {
    if (!debouncedSearch) return leaves;
    const term = debouncedSearch.toLowerCase();
    return leaves.filter(l =>
      l.employee.toLowerCase().includes(term) ||
      l.reason.toLowerCase().includes(term) ||
      l.type.toLowerCase().includes(term)
    );
  }, [leaves, debouncedSearch]);

  const filteredLeaves = filterLeaves();
  const paginatedLeaves = filteredLeaves.slice(page * size, (page + 1) * size);

  // Update pagination when filtered list changes
  useEffect(() => {
    setTotalPages(Math.ceil(filteredLeaves.length / size));
    setTotalElements(filteredLeaves.length);
    setPage(0);
  }, [filteredLeaves, size]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Approve / Reject handlers
  const handleApprove = (id) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'Approved' } : l));
    toast.success('Leave request approved');
  };

  const handleReject = (id) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'Rejected' } : l));
    toast.error('Leave request rejected');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved': return 'badge-success';
      case 'Pending':  return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      default:         return 'badge-info';
    }
  };

  // Pagination range (same as Employees)
  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left  = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  // Form handlers (defined at top level, but only used when view === 'form')
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setMessage("Leave Applied Successfully!");

    // Convert form data to leave record
    let leaveTypeDisplay = '';
    if (formData.leaveType === 'CL') leaveTypeDisplay = 'Casual Leave';
    else if (formData.leaveType === 'SL') leaveTypeDisplay = 'Sick Leave';
    else if (formData.leaveType === 'PL') leaveTypeDisplay = 'Paid Leave';

    let days = 1;
    if (!formData.isHalfDay && formData.fromDate && formData.toDate) {
      const diffTime = new Date(formData.toDate) - new Date(formData.fromDate);
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else if (formData.isHalfDay) {
      days = 0.5;
    }

    const newLeave = {
      id: leaves.length + 1,
      employee: formData.employeeName || (user?.name || 'Unknown'),
      type: leaveTypeDisplay,
      startDate: formData.fromDate,
      endDate: formData.isHalfDay ? formData.fromDate : formData.toDate,
      days: days,
      status: 'Pending',
      reason: formData.reason,
      appliedDate: new Date().toISOString().slice(0, 10),
    };

    setLeaves(prev => [newLeave, ...prev]);
    toast.success('Leave request submitted successfully');

    // Reset form and return to list after 1 second
    setFormData({
      employeeName: "",
      leaveType: "CL",
      fromDate: "",
      toDate: "",
      isHalfDay: false,
      halfDaySession: "first",
      reason: "",
    });
    setTimeout(() => setView('list'), 1000);
  };

  const resetFormMessage = () => {
    setMessage("");
  };

  // ---------- FORM VIEW ----------
  if (view === 'form') {
    // Reset message when entering form (optional)
    if (message) resetFormMessage();

    return (
      <div className="main-content">
        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <h1>Apply Leave</h1>
            <p>Submit a new leave request</p>
          </div>
          <button className="btn-outline-indigo" onClick={() => setView('list')}>
            Back
          </button>
        </div>

        <div className="card-modern p-4">
          {message && (
            <div className="badge-success mb-4" style={{ display: "inline-block" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label-modern">Employee Name *</label>
                <input
                  type="text"
                  className="form-control-modern"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-modern">Leave Type *</label>
                <select
                  className="form-control-modern"
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleFormChange}
                  required
                >
                  <option value="CL">Casual Leave (CL)</option>
                  <option value="SL">Sick Leave (SL)</option>
                  <option value="PL">Paid Leave (PL)</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label-modern">From Date *</label>
                <input
                  type="date"
                  className="form-control-modern"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label-modern">To Date *</label>
                <input
                  type="date"
                  className="form-control-modern"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleFormChange}
                  required
                  disabled={formData.isHalfDay}
                />
                {formData.isHalfDay && (
                  <small className="text-muted" style={{ fontSize: "11px" }}>
                    To date disabled for half‑day requests
                  </small>
                )}
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isHalfDay"
                    name="isHalfDay"
                    checked={formData.isHalfDay}
                    onChange={handleFormChange}
                    style={{ borderColor: "#6366f1", cursor: "pointer" }}
                  />
                  <label className="form-check-label" htmlFor="isHalfDay" style={{ fontWeight: "500" }}>
                    Half Day Leave
                  </label>
                </div>
              </div>

              {formData.isHalfDay && (
                <div className="col-md-6">
                  <label className="form-label-modern">Session *</label>
                  <select
                    className="form-control-modern"
                    name="halfDaySession"
                    value={formData.halfDaySession}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="first">First Half (Morning)</option>
                    <option value="second">Second Half (Afternoon)</option>
                  </select>
                </div>
              )}

              <div className="col-12">
                <label className="form-label-modern">Reason *</label>
                <textarea
                  className="form-control-modern"
                  name="reason"
                  rows="3"
                  value={formData.reason}
                  onChange={handleFormChange}
                  required
                  placeholder="Brief reason for leave..."
                />
              </div>

              <div className="col-12 mt-3">
                <button type="submit" className="btn-gradient me-3">
                  Apply Leave
                </button>
                <button type="button" className="btn-outline-indigo" onClick={() => setView('list')}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------- LIST VIEW (same structure as Employees) ----------
  return (
    <div className="emp-root">
      <div className="emp-header">
        <div className="emp-header-left">
          <div>
            <h1 className="emp-title">Leave Management</h1>
            <p className="emp-subtitle">{totalElements} total requests</p>
          </div>
        </div>
        <button className="emp-add-btn" onClick={() => setView('form')}>
          <FaPlus size={13} /> Apply for Leave
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Pending Requests</p>
                <h3 className="fw-bold mb-0">{pendingCount}</h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(243,156,18,0.2)' }}>
                <FaClock color="#f39c12" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Approved This Month</p>
                <h3 className="fw-bold mb-0">{approvedCount}</h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.2)' }}>
                <FaCheck color="#2ecc71" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Available Balance</p>
                <h3 className="fw-bold mb-0">12</h3>
                <small>Days remaining</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.2)' }}>
                <FaClock color="#3498db" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Leave Types</p>
                <h3 className="fw-bold mb-0">4</h3>
                <small>Sick, Casual, Paid, Unpaid</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(45,156,124,0.2)' }}>
                <FaFilter color="#2d9c7c" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="emp-search-bar">
        <div className="emp-search-wrap">
          <FaSearch className="emp-search-icon" size={12} />
          <input
            className="emp-search-input"
            type="text"
            placeholder="Search by employee, leave type or reason…"
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

      {/* Table */}
      <div className="emp-table-card">
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeaves.length > 0 ? (
                paginatedLeaves.map((leave, idx) => (
                  <tr key={leave.id} className="emp-row">
                    <td className="emp-sno">{page * size + idx + 1}</td>
                    <td className="fw-semibold">{leave.employee}</td>
                    <td>{leave.type}</td>
                    <td>{leave.startDate} → {leave.endDate}</td>
                    <td>{leave.days}</td>
                    <td>{leave.reason}</td>
                    <td className="emp-date">{leave.appliedDate}</td>
                    <td><span className={getStatusBadge(leave.status)}>{leave.status}</span></td>
                    <td>
                      <div className="emp-actions">
                        {leave.status === 'Pending' && (
                          <>
                            <button
                              className="emp-act emp-act--edit"
                              onClick={() => handleApprove(leave.id)}
                              title="Approve"
                              style={{ background: '#d1fae5', color: '#065f46' }}
                            >
                              <FaCheck size={12} />
                            </button>
                            <button
                              className="emp-act emp-act--del"
                              onClick={() => handleReject(leave.id)}
                              title="Reject"
                            >
                              <FaTimes size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="emp-empty">
                    <div className="emp-empty-inner">
                      <span className="emp-empty-icon">📋</span>
                      <p>No leave requests found</p>
                      <small>Try a different search or apply for a new leave</small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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