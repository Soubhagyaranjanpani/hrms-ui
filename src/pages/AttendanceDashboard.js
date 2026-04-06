import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaClock, FaSignInAlt, FaSignOutAlt, FaChartLine, FaUserCheck, FaCalendarAlt } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AttendanceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalHalfDay: 0,
    attendanceRate: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [monthlyRecords, setMonthlyRecords] = useState([]);

  const getAuthConfig = () => ({
    headers: { 
      Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}`,
      'Content-Type': 'application/json'
    }
  });

  const formatTime = (timeString) => {
    if (!timeString) return null;
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

  const fetchTodayStatus = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, getAuthConfig());
      const records = response.data?.response || response.data?.data || [];
      const today = new Date().toISOString().split('T')[0];
      const todayData = records.find(record => record.date === today);
      
      if (todayData) {
        setTodayRecord({
          id: todayData.id,
          checkIn: todayData.checkIn,
          checkOut: todayData.checkOut,
          hours: todayData.workingHours || 0,
          status: todayData.status,
          overtimeHours: todayData.overtimeHours || 0,
          date: todayData.date
        });
      } else {
        setTodayRecord(null);
      }
      
      setMonthlyRecords(records);
      calculateStats(records);
    } catch (error) {
      console.error('Error fetching today status:', error);
      toast.error('Error', 'Failed to fetch attendance status');
    }
  };

  const calculateStats = (records) => {
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const halfDay = records.filter(r => r.status === 'HALF_DAY').length;
    const total = records.length;
    
    setStats({
      totalPresent: present,
      totalAbsent: absent,
      totalHalfDay: halfDay,
      attendanceRate: total > 0 ? (((present + halfDay * 0.5) / total) * 100).toFixed(1) : 0
    });
  };

  const fetchMonthlyStats = async () => {
    try {
      const now = new Date();
      const response = await axios.get(API_ENDPOINTS.GET_DASHBOARD, {
        params: { month: now.getMonth() + 1, year: now.getFullYear() },
        ...getAuthConfig()
      });
      const records = response.data?.response || response.data?.data || [];
      if (records.length > 0) {
        setMonthlyRecords(records);
        calculateStats(records);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.CHECK_IN, {}, getAuthConfig());
      if (response.data?.status === 'SUCCESS' || response.data?.message?.includes('success')) {
        toast.success('Success!', 'Checked in successfully!');
        await Promise.all([fetchTodayStatus(), fetchMonthlyStats()]);
      } else {
        toast.error('Check-in Failed', response.data?.message || 'Failed to check in');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Check-in failed';
      toast.error('Check-in Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.CHECK_OUT, {}, getAuthConfig());
      if (response.data?.status === 'SUCCESS' || response.data?.message?.includes('success')) {
        toast.success('Success!', 'Checked out successfully!');
        await Promise.all([fetchTodayStatus(), fetchMonthlyStats()]);
      } else {
        toast.error('Check-out Failed', response.data?.message || 'Failed to check out');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Check-out failed';
      if (message.toLowerCase().includes('check-in not found')) {
        toast.error('Check-out Failed', 'You need to check in first before checking out');
      } else if (message.toLowerCase().includes('already checked out')) {
        toast.error('Check-out Failed', 'You have already checked out for today');
      } else {
        toast.error('Check-out Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchMonthlyStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = todayRecord?.checkOut !== null && todayRecord?.checkOut !== undefined;
  const canCheckIn = !isCheckedIn && !isCheckedOut;
  const canCheckOut = isCheckedIn && !isCheckedOut;

  const getStatusColor = (status) => {
    switch(status) {
      case 'PRESENT': return 'success';
      case 'HALF_DAY': return 'warning';
      case 'ABSENT': return 'danger';
      default: return 'info';
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="attendance-root">
        {loading && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Processing..." />
          </div>
        )}

        {/* Header */}
        <div className="attendance-header">
          <h1>Attendance Dashboard</h1>
          <p>Track your daily attendance and view statistics</p>
        </div>

        {/* Time and Check Section */}
        <div className="card-modern" style={{ marginBottom: '28px' }}>
          <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Current Time</p>
                <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCheckIn}
                  disabled={loading || !canCheckIn}
                  className={!canCheckIn ? 'btn-outline-indigo' : 'btn-gradient'}
                  style={!canCheckIn ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <FaSignInAlt size={16} style={{ marginRight: '8px' }} />
                  Check In
                </button>
                
                <button
                  onClick={handleCheckOut}
                  disabled={loading || !canCheckOut}
                  className={!canCheckOut ? 'btn-outline-indigo' : 'btn-gradient-coral'}
                  style={!canCheckOut ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <FaSignOutAlt size={16} style={{ marginRight: '8px' }} />
                  Check Out
                </button>
              </div>
            </div>

            {/* Today's Status */}
            {todayRecord && (
              <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>Check In</p>
                  <p style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {todayRecord.checkIn ? formatTime(todayRecord.checkIn) : '--:--'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>Check Out</p>
                  <p style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {todayRecord.checkOut ? formatTime(todayRecord.checkOut) : '--:--'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>Working Hours</p>
                  <p style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {todayRecord.hours > 0 ? todayRecord.hours.toFixed(1) : '0.0'} hrs
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>Status</p>
                  <span className={`badge-${getStatusColor(todayRecord.status)}`}>
                    {todayRecord.status || 'PENDING'}
                  </span>
                </div>
                {todayRecord.overtimeHours > 0 && (
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>Overtime</p>
                    <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--accent-teal)' }}>
                      +{todayRecord.overtimeHours.toFixed(1)} hrs
                    </p>
                  </div>
                )}
              </div>
            )}

            {!todayRecord && (
              <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border-light)',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <p>No attendance record for today. Click "Check In" to start your day.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="summary-grid">
          <div className="stat-card attendance-stat">
            <div className="stat-label">
              <FaUserCheck size={14} />
              Present Days
            </div>
            <div className="stat-value present">{stats.totalPresent}</div>
            <div className="stat-trend">This month</div>
          </div>
          
          <div className="stat-card attendance-stat">
            <div className="stat-label">
              <FaClock size={14} />
              Half Days
            </div>
            <div className="stat-value late">{stats.totalHalfDay}</div>
            <div className="stat-trend">This month</div>
          </div>
          
          <div className="stat-card attendance-stat">
            <div className="stat-label">
              <FaCalendarAlt size={14} />
              Absent Days
            </div>
            <div className="stat-value absent">{stats.totalAbsent}</div>
            <div className="stat-trend">This month</div>
          </div>
          
          <div className="stat-card attendance-stat">
            <div className="stat-label">
              <FaChartLine size={14} />
              Attendance Rate
            </div>
            <div className="stat-value hours">{stats.attendanceRate}%</div>
            <div className="stat-trend">Overall</div>
          </div>
        </div>

        {/* Recent Records Table */}
        {monthlyRecords.length > 0 && (
          <div className="attendance-table-card">
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Recent Attendance Records
              </h3>
            </div>
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
                  {monthlyRecords.slice(0, 5).map((record) => (
                    <tr key={record.id}>
                      <td className="date-cell">{record.date}</td>
                      <td className="day-cell">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </td>
                      <td className="time-cell">{formatTime(record.checkIn) || '--:--'}</td>
                      <td className="time-cell">{formatTime(record.checkOut) || '--:--'}</td>
                      <td className="hours-cell">{record.workingHours?.toFixed(1) || '0.0'}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(record.status)}`}>
                          {record.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: '16px',
          padding: '20px',
          marginTop: '24px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <FaCheckCircle color="var(--accent-teal)" size={20} />
            <div>
              <p style={{ fontWeight: '600', color: '#166534', marginBottom: '4px' }}>Attendance Policy</p>
              <p style={{ fontSize: '14px', color: '#15803d' }}>
                Working hours: 9:00 AM - 6:00 PM | Full day: 8+ hours | Half day: 4-8 hours | Below 4 hours: Absent
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceDashboard;