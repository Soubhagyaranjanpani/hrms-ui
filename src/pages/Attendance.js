import React, { useState } from 'react';
import { FaCheckCircle, FaClock, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Attendance = ({ user }) => {
  const [attendance, setAttendance] = useState([
    { id: 1, name: 'Emma Watson', date: '2024-04-01', checkIn: '09:00', checkOut: '17:30', status: 'Present', hours: 8.5, location: 'New York' },
    { id: 2, name: 'Liam Brown', date: '2024-04-01', checkIn: '08:45', checkOut: '17:15', status: 'Present', hours: 8.5, location: 'London' },
    { id: 3, name: 'Olivia Davis', date: '2024-04-01', checkIn: null, checkOut: null, status: 'Absent', hours: 0, location: '-' },
    { id: 4, name: 'Noah Wilson', date: '2024-04-01', checkIn: '09:15', checkOut: '18:00', status: 'Present', hours: 8.75, location: 'Singapore' },
    { id: 5, name: 'Ava Martinez', date: '2024-04-01', checkIn: '09:30', checkOut: '17:45', status: 'Late', hours: 8.25, location: 'Remote' },
  ]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getStatusBadge = (status) => {
    const badges = {
      Present: 'badge-success',
      Absent: 'badge-danger',
      Late: 'badge-warning'
    };
    return badges[status] || 'badge-secondary';
  };

  const handleCheckIn = () => {
    toast.success('Checked in successfully!');
  };

  const handleCheckOut = () => {
    toast.success('Checked out successfully!');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0">Attendance Management</h2>
        <div className="d-flex gap-2">
          <button className="btn-gradient" onClick={handleCheckIn}>
            <FaCheckCircle className="me-2" /> Check In
          </button>
          <button className="btn-outline-teal" onClick={handleCheckOut}>
            <FaClock className="me-2" /> Check Out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Present Today</p>
                <h3 className="fw-bold mb-0">3</h3>
                <small>60% of workforce</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.2)' }}>
                <FaCheckCircle color="#2ecc71" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Late Arrivals</p>
                <h3 className="fw-bold mb-0">1</h3>
                <small>20% late</small>
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
                <p className="text-gray mb-1">Avg. Hours</p>
                <h3 className="fw-bold mb-0">8.4</h3>
                <small>+0.3 vs last week</small>
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
                <p className="text-gray mb-1">Monthly Rate</p>
                <h3 className="fw-bold mb-0">94%</h3>
                <small>Excellent</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(45,156,124,0.2)' }}>
                <FaCheckCircle color="#2d9c7c" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="card-modern p-4 mb-4">
        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Select Date</label>
            <input
              type="date"
              className="form-control"
              style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Quick Actions</label>
            <div className="d-flex gap-2">
              <button className="btn-outline-teal w-100">Export Report</button>
              <button className="btn-outline-teal w-100">Bulk Update</button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card-modern overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(record => (
                <tr key={record.id}>
                  <td>
                    <div className="fw-semibold">{record.name}</div>
                  </td>
                  <td>{record.date}</td>
                  <td>{record.checkIn || '-'}</td>
                  <td>{record.checkOut || '-'}</td>
                  <td>{record.hours}</td>
                  <td><span className={getStatusBadge(record.status)}>{record.status}</span></td>
                  <td>
                    {record.location !== '-' && <FaMapMarkerAlt className="me-1" />}
                    {record.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;