import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock, FaEye } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const MyAttendance = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');

  const getAuthConfig = () => ({
    headers: { 
      Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}`,
      'Content-Type': 'application/json'
    }
  });

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    try {
      const timePart = timeString.split('.')[0];
      const [hours, minutes] = timePart.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };

  const fetchAttendance = async (showRefreshMessage = false) => {
    if (showRefreshMessage) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, getAuthConfig());
      const attendanceData = response.data?.response || response.data?.data || [];
      
      const transformedData = attendanceData.map(record => ({
        id: record.id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        hours: record.workingHours || 0,
        status: record.status,
        overtimeHours: record.overtimeHours || 0,
        isLate: record.isLate || false,
        isEarlyExit: record.isEarlyExit || false
      }));
      
      setRecords(transformedData);
      setFilteredRecords(transformedData);
      
      if (showRefreshMessage) {
        toast.success('Success', 'Attendance records refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      const message = error.response?.data?.message || 'Failed to fetch attendance records';
      toast.error('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    let filtered = [...records];
    
    filtered = filtered.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    });
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => 
        record.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    setFilteredRecords(filtered);
  }, [selectedMonth, selectedYear, statusFilter, records]);

  const getStatusClass = (status) => {
    switch(status?.toUpperCase()) {
      case 'PRESENT': return 'present';
      case 'ABSENT': return 'absent';
      case 'HALF_DAY': return 'late';
      default: return 'pending';
    }
  };

  const summary = {
    total: filteredRecords.length,
    present: filteredRecords.filter(r => r.status === 'PRESENT').length,
    absent: filteredRecords.filter(r => r.status === 'ABSENT').length,
    halfDay: filteredRecords.filter(r => r.status === 'HALF_DAY').length,
    totalHours: filteredRecords.reduce((sum, r) => sum + (r.hours || 0), 0).toFixed(1)
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <>
      <ToastContainer />
      <div className="attendance-root">
        {refreshing && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Refreshing records..." />
          </div>
        )}

        <div className="attendance-header">
          <h1>My Attendance History</h1>
          <p>View and track all your attendance records</p>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="stat-card attendance-stat">
            <div className="stat-label">Total Days</div>
            <div className="stat-value total">{summary.total}</div>
          </div>
          
          <div className="stat-card attendance-stat">
            <div className="stat-label"><FaCheckCircle size={12} /> Present</div>
            <div className="stat-value present">{summary.present}</div>
          </div>
          
          <div className="stat-card attendance-stat">
            <div className="stat-label"><FaClock size={12} /> Half Day</div>
            <div className="stat-value late">{summary.halfDay}</div>
          </div>
          
          <div className="stat-card attendance-stat">
            <div className="stat-label"><FaTimesCircle size={12} /> Absent</div>
            <div className="stat-value absent">{summary.absent}</div>
          </div>
          
          <div className="stat-card attendance-stat">
            <div className="stat-label">Total Hours</div>
            <div className="stat-value hours">{summary.totalHours}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-card">
          <div className="filter-group">
            <div className="filter-item">
              <label><FaCalendarAlt size={12} /> Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="filter-select"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <label><FaCalendarAlt size={12} /> Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="filter-select"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <label><FaEye size={12} /> Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="present">Present</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            
            <div className="filter-item">
              <button onClick={() => fetchAttendance(true)} className="refresh-btn" disabled={refreshing}>
                <FaSearch size={14} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="attendance-table-card">
          {loading ? (
            <div className="attendance-loading">
              <div className="loading-spinner"></div>
              <p>Loading attendance records...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="attendance-empty">
                        <div className="empty-icon">
                          <FaCalendarAlt />
                        </div>
                        <p>No attendance records found</p>
                        <small>Try selecting a different month or year</small>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, idx) => (
                      <tr key={record.id || idx}>
                        <td className="date-cell">{record.date}</td>
                        <td className="day-cell">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </td>
                        <td className="time-cell">{formatTime(record.checkIn)}</td>
                        <td className="time-cell">{formatTime(record.checkOut)}</td>
                        <td className="hours-cell">{record.hours ? record.hours.toFixed(1) : 0}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(record.status)}`}>
                            {record.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredRecords.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-muted)',
            background: 'var(--bg-surface)',
            borderRadius: '12px'
          }}>
            Showing {filteredRecords.length} of {records.length} total records
          </div>
        )}
      </div>
    </>
  );
};

export default MyAttendance;