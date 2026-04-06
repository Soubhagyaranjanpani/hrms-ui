import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaTimes, FaCheck, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { toast } from '../components/Toast';
import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import LoadingSpinner from '../components/LoadingSpinner';

const LeaveApproval = ({ user }) => {
  // ---------- State ----------
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'approve' or 'reject'
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helper: get auth headers
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}`,
    'Content-Type': 'application/json',
  });

  // Fetch team leaves
  const fetchTeamLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.GET_TEAM_LEAVES, {
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
        employeeName: leave.employeeName || leave.employee?.name || 'Unknown',
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        status: leave.status,
        reason: leave.reason || '',
        appliedDate: leave.appliedDate || leave.startDate,
      }));
      
      setLeaves(transformedData);
      setTotalElements(transformedData.length);
      setTotalPages(Math.ceil(transformedData.length / size));
      
      const total = transformedData.length;
      const pending = transformedData.filter(l => l.status === 'PENDING' || l.status === 'PENDING_L2').length;
      const approved = transformedData.filter(l => l.status === 'APPROVED').length;
      const rejected = transformedData.filter(l => l.status === 'REJECTED').length;
      setStats({ total, pending, approved, rejected });
      
    } catch (error) {
      console.error('Error fetching team leaves:', error);
      toast.error('Error', 'Failed to load team leave requests');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [size]);

  // Initialize data
  useEffect(() => {
    fetchTeamLeaves();
  }, [fetchTeamLeaves]);

  // Get filtered leaves
  const getFilteredLeaves = useCallback(() => {
    const leavesArray = Array.isArray(leaves) ? leaves : [];
    
    if (!debouncedSearch || debouncedSearch.trim() === '') {
      return leavesArray;
    }
    
    const term = debouncedSearch.toLowerCase().trim();
    return leavesArray.filter(leave => {
      if (!leave) return false;
      return (
        (leave.employeeName?.toLowerCase() || '').includes(term) ||
        (leave.leaveType?.toLowerCase() || '').includes(term) ||
        (leave.reason?.toLowerCase() || '').includes(term) ||
        (leave.status?.toLowerCase() || '').includes(term)
      );
    });
  }, [leaves, debouncedSearch]);

  const filteredLeaves = getFilteredLeaves();
  
  const getPaginatedLeaves = () => {
    if (!Array.isArray(filteredLeaves)) return [];
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

  // Open modal for approve/reject
  const openModal = (type, leave) => {
    setModalType(type);
    setSelectedLeave(leave);
    setRemarks('');
    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
    setSelectedLeave(null);
    setRemarks('');
  };

  // Handle approve submit
  const handleApprove = async () => {
    if (!selectedLeave) return;
    
    setSubmitting(true);
    try {
      const payload = {
        leaveId: selectedLeave.id,
        remarks: remarks.trim() || `Approved by ${localStorage.getItem(STORAGE_KEYS.USERNAME) || 'Manager'}`,
      };
      
      const response = await axios.post(API_ENDPOINTS.APPROVE_LEAVE, payload, {
        headers: getAuthHeaders(),
      });
      
      if (response.data?.status === 200) {
        toast.success('Success', response.data?.message || 'Leave request approved successfully');
      } else {
        toast.success('Success', 'Leave request approved successfully');
      }
      
      closeModal();
      fetchTeamLeaves();
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to approve leave request';
      toast.error('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reject submit
  const handleReject = async () => {
    if (!selectedLeave) return;
    
    if (!remarks.trim()) {
      toast.warning('Validation', 'Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        leaveId: selectedLeave.id,
        remarks: remarks.trim(),
      };
      
      const response = await axios.post(API_ENDPOINTS.REJECT_LEAVE, payload, {
        headers: getAuthHeaders(),
      });
      
      if (response.data?.status === 200) {
        toast.success('Success', response.data?.message || 'Leave request rejected successfully');
      } else {
        toast.success('Success', 'Leave request rejected successfully');
      }
      
      closeModal();
      fetchTeamLeaves();
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to reject leave request';
      toast.error('Error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'PENDING_L2': return 'badge-warning';
      case 'REJECTED': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'APPROVED': return 'Approved';
      case 'PENDING': return 'Pending';
      case 'PENDING_L2': return 'Level 2 Pending';
      case 'REJECTED': return 'Rejected';
      default: return status || 'Unknown';
    }
  };

  const isPending = (status) => {
    return status === 'PENDING' || status === 'PENDING_L2';
  };

  // Format leave type name
  const formatLeaveTypeName = (name) => {
    if (!name) return '-';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
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

  // Loading state
  if (loading && leaves.length === 0) {
    return <LoadingSpinner message="Loading team leave requests..." />;
  }

  return (
    <div className="emp-root" style={{ maxWidth: '100%', overflowX: 'auto' }}>
      {/* Header */}
      <div className="emp-header">
        <div className="emp-header-left">
          <div>
            <h1 className="emp-title">Leave Approval</h1>
            <p className="emp-subtitle">{totalElements} total requests</p>
          </div>
        </div>
      </div>

      {/* Stats Cards - Equal height using flexbox */}
      <div className="row g-4 mb-4" style={{ display: 'flex', flexWrap: 'wrap', margin: '0 -8px' }}>
        <div className="col-md-3" style={{ padding: '0 8px', flex: '1 1 200px', minWidth: '180px' }}>
          <div className="stat-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1" style={{ fontSize: '12px', color: '#8b92b8' }}>Total Requests</p>
                <h3 className="fw-bold mb-0" style={{ fontSize: '32px', fontWeight: 700 }}>{stats.total}</h3>
              </div>
              <div className="stat-icon icon-indigo" style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ede9fe' }}>
                <FaSearch color="#6366f1" size={18} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3" style={{ padding: '0 8px', flex: '1 1 200px', minWidth: '180px' }}>
          <div className="stat-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1" style={{ fontSize: '12px', color: '#8b92b8' }}>Pending for Approval</p>
                <h3 className="fw-bold mb-0" style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>{stats.pending}</h3>
              </div>
              <div className="stat-icon icon-amber" style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7' }}>
                <FaSpinner color="#f59e0b" size={18} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3" style={{ padding: '0 8px', flex: '1 1 200px', minWidth: '180px' }}>
          <div className="stat-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1" style={{ fontSize: '12px', color: '#8b92b8' }}>Approved</p>
                <h3 className="fw-bold mb-0" style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{stats.approved}</h3>
              </div>
              <div className="stat-icon icon-teal" style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d1fae5' }}>
                <FaCheck color="#10b981" size={18} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3" style={{ padding: '0 8px', flex: '1 1 200px', minWidth: '180px' }}>
          <div className="stat-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1" style={{ fontSize: '12px', color: '#8b92b8' }}>Rejected</p>
                <h3 className="fw-bold mb-0" style={{ fontSize: '32px', fontWeight: 700, color: '#ef4444' }}>{stats.rejected}</h3>
              </div>
              <div className="stat-icon" style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2' }}>
                <FaTimesCircle color="#ef4444" size={18} />
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
            placeholder="Search by employee, leave type, reason or status…"
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

      {/* Table - Increased width */}
      <div className="emp-table-card" style={{ overflowX: 'auto' }}>
        <div className="emp-table-wrap" style={{ minWidth: '1000px', overflowX: 'auto' }}>
          <table className="emp-table" style={{ width: '100%', minWidth: '1000px' }}>
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '15%' }}>Employee</th>
                <th style={{ width: '12%' }}>Leave Type</th>
                <th style={{ width: '20%' }}>Duration</th>
                <th style={{ width: '8%' }}>Days</th>
                <th style={{ width: '20%' }}>Reason</th>
                <th style={{ width: '12%' }}>Applied Date</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="emp-empty">
                    <div className="emp-empty-inner">
                      <FaSpinner className="emp-spinner" style={{ width: '24px', height: '24px', marginBottom: '12px' }} />
                      <p>Loading team leave requests...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedLeaves.length > 0 ? (
                paginatedLeaves.map((leave, idx) => (
                  <tr key={leave.id} className="emp-row">
                    <td className="emp-sno">{page * size + idx + 1}</td>
                    <td>
                      <div className="emp-info-cell">
                        <div className="emp-avatar" style={{ background: '#ede9fe', color: '#6366f1', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                          {(leave.employeeName?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <div className="emp-name" style={{ fontWeight: 600, color: '#1e2340' }}>{leave.employeeName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="emp-pill emp-pill--indigo" style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        {formatLeaveTypeName(leave.leaveType)}
                      </span>
                    </td>
                    <td className="emp-date" style={{ fontSize: '12px', color: '#4a5082' }}>
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                    </td>
                    <td style={{ fontWeight: 500, color: '#6366f1' }}>{leave.totalDays || 1}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '12px', color: '#4a5082' }}>
                      {leave.reason || '-'}
                    </td>
                    <td className="emp-date" style={{ fontSize: '12px', color: '#8b92b8' }}>{formatDate(leave.appliedDate)}</td>
                    <td>
                      <span className={getStatusBadge(leave.status)} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                        {getStatusText(leave.status)}
                      </span>
                    </td>
                    <td>
                      <div className="emp-actions" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {isPending(leave.status) && (
                          <>
                            <button
                              className="emp-act"
                              onClick={() => openModal('approve', leave)}
                              title="Approve"
                              style={{ background: '#d1fae5', color: '#065f46', width: '28px', height: '28px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <FaCheck size={12} />
                            </button>
                            <button
                              className="emp-act"
                              onClick={() => openModal('reject', leave)}
                              title="Reject"
                              style={{ background: '#fee2e2', color: '#b91c1c', width: '28px', height: '28px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <FaTimes size={12} />
                            </button>
                          </>
                        )}
                        {!isPending(leave.status) && (
                          <span className="emp-pill" style={{ background: '#e0e7ff', color: '#6366f1', fontSize: '11px', padding: '4px 10px', borderRadius: '20px' }}>
                            Processed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="emp-empty">
                    <div className="emp-empty-inner">
                      <span className="emp-empty-icon" style={{ fontSize: '32px', opacity: 0.4 }}>📋</span>
                      <p style={{ fontWeight: 600, color: '#4a5082', marginTop: '8px' }}>No leave requests found</p>
                      <small style={{ fontSize: '12px', color: '#8b92b8' }}>No pending requests to approve at this time</small>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="emp-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e0e2ff', flexWrap: 'wrap' }}>
            <span className="emp-page-info" style={{ fontSize: '12px', color: '#8b92b8' }}>
              Showing {page * size + 1}–{Math.min((page + 1) * size, totalElements)} of {totalElements} requests
            </span>
            <div className="emp-page-controls" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button className="emp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ padding: '5px 12px', border: '1px solid #e0e2ff', borderRadius: '8px', background: '#fff', color: '#6366f1', fontSize: '12px', cursor: 'pointer' }}>← Prev</button>
              {getPaginationRange().map((pg, i) =>
                pg === '...' ? <span key={`dots-${i}`} className="emp-page-dots" style={{ color: '#8b92b8', padding: '0 4px' }}>…</span> : (
                  <button key={pg} className={`emp-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)} style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e2ff', borderRadius: '8px', background: pg === page ? '#6366f1' : '#fff', color: pg === page ? '#fff' : '#4a5082', fontSize: '12px', cursor: 'pointer' }}>
                    {pg + 1}
                  </button>
                )
              )}
              <button className="emp-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '5px 12px', border: '1px solid #e0e2ff', borderRadius: '8px', background: '#fff', color: '#6366f1', fontSize: '12px', cursor: 'pointer' }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {modalOpen && (
        <div className="emp-modal-overlay" onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(30,35,64,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '90%', maxWidth: '420px', textAlign: 'left', boxShadow: '0 20px 60px rgba(30,35,64,0.2)' }}>
            <div className="emp-modal-icon" style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              background: modalType === 'approve' ? '#d1fae5' : '#fee2e2',
              color: modalType === 'approve' ? '#065f46' : '#b91c1c'
            }}>
              {modalType === 'approve' ? <FaCheck size={24} /> : <FaTimesCircle size={24} />}
            </div>
            <h3 className="emp-modal-title" style={{ fontFamily: 'Sora, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1e2340', textAlign: 'center', marginBottom: '16px' }}>
              {modalType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ background: '#f5f6ff', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#4a5082', marginBottom: '6px' }}>
                  <strong>Employee:</strong> {selectedLeave?.employeeName}
                </p>
                <p style={{ fontSize: '13px', color: '#4a5082', marginBottom: '6px' }}>
                  <strong>Leave Type:</strong> {formatLeaveTypeName(selectedLeave?.leaveType)}
                </p>
                <p style={{ fontSize: '13px', color: '#4a5082', marginBottom: '6px' }}>
                  <strong>Duration:</strong> {formatDate(selectedLeave?.startDate)} → {formatDate(selectedLeave?.endDate)}
                </p>
                <p style={{ fontSize: '13px', color: '#4a5082' }}>
                  <strong>Days:</strong> {selectedLeave?.totalDays || 1}
                </p>
              </div>
              
              <div className="emp-field">
                <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block', fontSize: '13px', color: '#4a5082' }}>
                  {modalType === 'approve' ? 'Remarks (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={modalType === 'approve' ? 'Add any remarks...' : 'Please provide a reason for rejection...'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #e0e2ff',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontFamily: 'DM Sans, sans-serif',
                    resize: 'vertical',
                    background: '#f5f6ff'
                  }}
                  required={modalType === 'reject'}
                />
                {modalType === 'reject' && remarks.length === 0 && (
                  <small style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    Reason is required for rejection
                  </small>
                )}
              </div>
            </div>
            
            <div className="emp-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="emp-modal-cancel" onClick={closeModal} disabled={submitting} style={{ flex: 1, padding: '9px', border: '1.5px solid #e0e2ff', borderRadius: '10px', background: '#fff', color: '#4a5082', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                className="emp-modal-confirm"
                onClick={modalType === 'approve' ? handleApprove : handleReject}
                disabled={submitting || (modalType === 'reject' && !remarks.trim())}
                style={{
                  flex: 1,
                  padding: '9px',
                  border: 'none',
                  borderRadius: '10px',
                  background: modalType === 'approve' ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #ef4444, #f87171)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: (submitting || (modalType === 'reject' && !remarks.trim())) ? 0.6 : 1
                }}
              >
                {submitting ? (
                  <><FaSpinner className="emp-spinner" style={{ marginRight: '6px' }} /> Processing...</>
                ) : (
                  <>{modalType === 'approve' ? 'Approve' : 'Reject'} Request</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;