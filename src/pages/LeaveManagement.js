import React, { useState } from 'react';
import { FaCheck, FaTimes, FaClock, FaPlus, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

const LeaveManagement = ({ user }) => {
  const [leaves, setLeaves] = useState([
    { id: 1, employee: 'Emma Watson', type: 'Sick Leave', startDate: '2024-04-05', endDate: '2024-04-06', days: 2, status: 'Pending', reason: 'Flu', appliedDate: '2024-04-01' },
    { id: 2, employee: 'Olivia Davis', type: 'Casual Leave', startDate: '2024-04-10', endDate: '2024-04-10', days: 1, status: 'Approved', reason: 'Personal', appliedDate: '2024-03-28' },
    { id: 3, employee: 'Liam Brown', type: 'Paid Leave', startDate: '2024-04-15', endDate: '2024-04-18', days: 4, status: 'Pending', reason: 'Vacation', appliedDate: '2024-04-02' },
    { id: 4, employee: 'Ava Martinez', type: 'Sick Leave', startDate: '2024-04-08', endDate: '2024-04-09', days: 2, status: 'Rejected', reason: 'Doctor appointment', appliedDate: '2024-04-01' },
  ]);

  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleApprove = (id) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'Approved' } : l));
    toast.success('Leave request approved');
  };

  const handleReject = (id) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: 'Rejected' } : l));
    toast.error('Leave request rejected');
  };

  const getStatusBadge = (status) => {
    const badges = {
      Approved: 'badge-success',
      Pending: 'badge-warning',
      Rejected: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0">Leave Management</h2>
        <button className="btn-gradient" onClick={() => setShowApplyModal(true)}>
          <FaPlus className="me-2" /> Apply for Leave
        </button>
      </div>

      {/* Stats */}
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

      {/* Leave Requests Table */}
      <div className="card-modern overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.id}>
                  <td className="fw-semibold">{leave.employee}</td>
                  <td>{leave.type}</td>
                  <td>{leave.startDate} → {leave.endDate}</td>
                  <td>{leave.days}</td>
                  <td>{leave.reason}</td>
                  <td>{leave.appliedDate}</td>
                  <td><span className={getStatusBadge(leave.status)}>{leave.status}</span></td>
                  <td>
                    {leave.status === 'Pending' && (
                      <>
                        <FaCheck 
                          className="me-2" 
                          style={{ color: '#2ecc71', cursor: 'pointer' }} 
                          onClick={() => handleApprove(leave.id)}
                        />
                        <FaTimes 
                          style={{ color: '#e74c3c', cursor: 'pointer' }} 
                          onClick={() => handleReject(leave.id)}
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal (Simplified) */}
      {showApplyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: 'var(--card-bg)' }}>
              <div className="modal-header" style={{ borderBottomColor: 'rgba(45,156,124,0.3)' }}>
                <h5 className="modal-title">Apply for Leave</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowApplyModal(false)}></button>
              </div>
              <div className="modal-body">
                <select className="form-control mb-3" style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}>
                  <option>Select Leave Type</option>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Paid Leave</option>
                </select>
                <input type="date" className="form-control mb-3" placeholder="Start Date" style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }} />
                <input type="date" className="form-control mb-3" placeholder="End Date" style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }} />
                <textarea className="form-control mb-3" rows="3" placeholder="Reason" style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}></textarea>
              </div>
              <div className="modal-footer" style={{ borderTopColor: 'rgba(45,156,124,0.3)' }}>
                <button className="btn-outline-teal" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button className="btn-gradient" onClick={() => {
                  toast.success('Leave request submitted');
                  setShowApplyModal(false);
                }}>Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;