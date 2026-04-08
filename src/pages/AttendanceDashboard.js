import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaClock, FaSignInAlt, FaSignOutAlt, FaUserCheck, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
    totalLeave: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      const records = response.data?.response || [];
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
          date: todayData.date,
          leaveType: todayData.leaveType
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
    // Filter out WEEKEND records from statistics and only count past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate <= today && record.status !== 'WEEKEND';
    });

    const present = pastRecords.filter(r => r.status === 'PRESENT').length;
    const absent = pastRecords.filter(r => r.status === 'ABSENT').length;
    const halfDay = pastRecords.filter(r => r.status === 'HALF_DAY').length;
    const leave = pastRecords.filter(r => r.status === 'LEAVE').length;

    setStats({
      totalPresent: present,
      totalAbsent: absent,
      totalHalfDay: halfDay,
      totalLeave: leave
    });
  };

  const fetchMonthlyStats = async () => {
    try {
      const now = new Date();
      const response = await axios.get(API_ENDPOINTS.GET_DASHBOARD, {
        params: { month: now.getMonth() + 1, year: now.getFullYear() },
        ...getAuthConfig()
      });
      const records = response.data?.response || [];
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
      if (response.data?.status === 200 || response.data?.message?.includes('success')) {
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
      if (response.data?.status === 200 || response.data?.message?.includes('success')) {
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

  // Check if user can check in (not checked in today and not weekend)
  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = todayRecord?.checkOut !== null && todayRecord?.checkOut !== undefined;
  const isWeekend = todayRecord?.status === 'WEEKEND';
  const isOnLeave = todayRecord?.status === 'LEAVE';
  const canCheckIn = !isCheckedIn && !isCheckedOut && !isWeekend && !isOnLeave;
  const canCheckOut = isCheckedIn && !isCheckedOut && !isWeekend;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'success';
      case 'HALF_DAY': return 'warning';
      case 'ABSENT': return 'danger';
      case 'LEAVE': return 'info';
      case 'WEEKEND': return 'secondary';
      default: return 'info';
    }
  };

  const getStatusText = (record) => {
    if (record.status === 'LEAVE' && record.leaveType) {
      return `${record.status} (${record.leaveType})`;
    }
    return record.status || 'PENDING';
  };

  // Calendar generation logic
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getAttendanceForDate = (dateStr) => {
    return monthlyRecords.find(record => record.date === dateStr);
  };

  const isFutureDate = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const getDateStatusClass = (dateStr) => {
  if (isFutureDate(dateStr)) return '';
  
  const record = getAttendanceForDate(dateStr);
  if (!record) return '';
  switch(record.status) {
    case 'PRESENT': return 'calendar-day-present';
    case 'ABSENT': return 'calendar-day-absent';
    case 'LEAVE': return 'calendar-day-leave';
    case 'WEEKEND': return 'calendar-day-weekend';
    case 'HALF_DAY': return 'calendar-day-halfday';
    case 'HOLIDAY': return 'calendar-day-holiday';  
    default: return '';
  }
};

  const getStatusTooltip = (dateStr) => {
    if (isFutureDate(dateStr)) return 'Future date - No data yet';
    const record = getAttendanceForDate(dateStr);
    if (!record) return 'No record';
    if (record.status === 'LEAVE' && record.leaveType) {
      return `${record.status} (${record.leaveType})`;
    }
    if (record.workingHours) {
      return `${record.status} - ${record.workingHours.toFixed(1)} hrs`;
    }
    return record.status;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date().toISOString().split('T')[0];

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === today;
      const statusClass = getDateStatusClass(dateStr);
      const tooltip = getStatusTooltip(dateStr);
      const isFuture = isFutureDate(dateStr);

      days.push(
        <div
          key={day}
          className={`calendar-day ${statusClass} ${isToday ? 'calendar-day-today' : ''} ${isFuture ? 'calendar-day-future' : ''}`}
          title={tooltip}
        >
          <span className="calendar-day-number">{day}</span>
          {statusClass && !isFuture && <span className="calendar-day-indicator"></span>}
        </div>
      );
    }

    return days;
  };

  const changeMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

        {/* Time and Check Section - Compact Height */}
        <div className="card-modern" style={{ marginBottom: '20px' }}>
          <div style={{ padding: '12px 20px' }}>  {/* Reduced padding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>  {/* Reduced gap from 16px to 12px */}
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '11px' }}>Current Time</p>  {/* Smaller font */}
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', color: 'var(--text-primary)' }}>  {/* Reduced from 28px to 24px */}
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>  {/* Smaller font */}
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>  {/* Reduced gap */}
                <button
                  onClick={handleCheckIn}
                  disabled={loading || !canCheckIn}
                  className={!canCheckIn ? 'btn-outline-indigo' : 'btn-gradient'}
                  style={!canCheckIn ? { opacity: 0.5, cursor: 'not-allowed', padding: '8px 16px', fontSize: '13px' } : { padding: '8px 16px', fontSize: '13px' }}
                >
                  <FaSignInAlt size={12} style={{ marginRight: '6px' }} />
                  Check In
                </button>

                <button
                  onClick={handleCheckOut}
                  disabled={loading || !canCheckOut}
                  className={!canCheckOut ? 'btn-outline-indigo' : 'btn-gradient-coral'}
                  style={!canCheckOut ? { opacity: 0.5, cursor: 'not-allowed', padding: '8px 16px', fontSize: '13px' } : { padding: '8px 16px', fontSize: '13px' }}
                >
                  <FaSignOutAlt size={12} style={{ marginRight: '6px' }} />
                  Check Out
                </button>
              </div>
            </div>

            {/* Today's Status - Compact */}
            {todayRecord && todayRecord.status !== 'WEEKEND' && (
              <div style={{
                marginTop: '12px',  // Reduced from 16px
                paddingTop: '10px',  // Reduced from 16px
                borderTop: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',  // Smaller min width
                gap: '8px'  // Reduced from 12px
              }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px' }}>Check In</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {todayRecord.checkIn ? formatTime(todayRecord.checkIn) : '--:--'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px' }}>Check Out</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {todayRecord.checkOut ? formatTime(todayRecord.checkOut) : '--:--'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px' }}>Working Hours</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {todayRecord.hours > 0 ? todayRecord.hours.toFixed(1) : '0.0'} hrs
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px' }}>Status</p>
                  <span className={`badge-${getStatusColor(todayRecord.status)}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                    {getStatusText(todayRecord)}
                  </span>
                </div>
                {todayRecord.overtimeHours > 0 && (
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px' }}>Overtime</p>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--accent-teal)' }}>
                      +{todayRecord.overtimeHours.toFixed(1)} hrs
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Weekend/Leave/No record messages - Compact */}
            {todayRecord?.status === 'WEEKEND' && (
              <div style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-light)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}>
                <p>🏖️ Today is a weekend! Enjoy your day off.</p>
              </div>
            )}

            {todayRecord?.status === 'LEAVE' && (
              <div style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-light)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}>
                <p>📅 You are on {todayRecord.leaveType || ''} leave today.</p>
              </div>
            )}

            {!todayRecord && (
              <div style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-light)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}>
                <p>No attendance record for today. Click "Check In" to start your day.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - Smaller Size, No Attendance Rate */}
        <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
            <div className="stat-label" style={{ fontSize: '12px' }}>
              <FaUserCheck size={12} />
              Present Days
            </div>
            <div className="stat-value present" style={{ fontSize: '28px' }}>{stats.totalPresent}</div>
            <div className="stat-trend" style={{ fontSize: '11px' }}>This month</div>
          </div>

          <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
            <div className="stat-label" style={{ fontSize: '12px' }}>
              <FaClock size={12} />
              Half Days
            </div>
            <div className="stat-value late" style={{ fontSize: '28px' }}>{stats.totalHalfDay}</div>
            <div className="stat-trend" style={{ fontSize: '11px' }}>This month</div>
          </div>

          <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
            <div className="stat-label" style={{ fontSize: '12px' }}>
              <FaCalendarAlt size={12} />
              Leave Days
            </div>
            <div className="stat-value" style={{ fontSize: '28px', color: '#8b5cf6' }}>{stats.totalLeave}</div>
            <div className="stat-trend" style={{ fontSize: '11px' }}>This month</div>
          </div>

          <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
            <div className="stat-label" style={{ fontSize: '12px' }}>
              <FaCalendarAlt size={12} />
              Absent Days
            </div>
            <div className="stat-value absent" style={{ fontSize: '28px' }}>{stats.totalAbsent}</div>
            <div className="stat-trend" style={{ fontSize: '11px' }}>This month</div>
          </div>
        </div>

        {/* Modern Calendar Component */}
        <div className="attendance-table-card" style={{ overflow: 'visible' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Attendance Calendar
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => changeMonth(-1)} className="calendar-nav-btn" style={{ padding: '6px 10px' }}>
                <FaChevronLeft size={12} />
              </button>
              <button onClick={() => changeMonth(1)} className="calendar-nav-btn" style={{ padding: '6px 10px' }}>
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <div className="calendar-grid">
              {weekDays.map(day => (
                <div key={day} className="calendar-weekday" style={{ fontSize: '13px', padding: '8px' }}>{day}</div>
              ))}
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="calendar-legend" style={{ gap: '12px', paddingTop: '16px' }}>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color present-color"></span>
                <span>Present</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color absent-color"></span>
                <span>Absent</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color leave-color"></span>
                <span>Leave</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color weekend-color"></span>
                <span>Weekend</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color halfday-color"></span>
                <span>Half Day</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color today-color"></span>
                <span>Today</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color future-color"></span>
                <span>Future Date</span>
              </div>
              <div className="legend-item">
                <span className="legend-color holiday-color"></span>
                <span>Holiday</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: '12px',
          padding: '14px 20px',
          marginTop: '20px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <FaCheckCircle color="var(--accent-teal)" size={16} />
            <div>
              <p style={{ fontWeight: '600', color: '#166534', marginBottom: '2px', fontSize: '13px' }}>Attendance Policy</p>
              <p style={{ fontSize: '12px', color: '#15803d' }}>
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