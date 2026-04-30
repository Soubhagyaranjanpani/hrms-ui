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

  // Calendar generation
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
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

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
      <div className="attendance-root" style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {loading && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Processing..." />
          </div>
        )}

        {/* Header */}
        <div className="attendance-header">
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>Attendance Dashboard</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--text-muted)' }}>Track your daily attendance and view statistics</p>
        </div>

        {/* Time and Check Section */}
        <div className="card-modern" style={{ marginBottom: '20px' }}>
          <div style={{ padding: '12px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>Current Time</p>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCheckIn}
                  disabled={loading || !canCheckIn}
                  className={!canCheckIn ? 'btn-outline-indigo' : 'btn-gradient'}
                  style={!canCheckIn ? { opacity: 0.5, cursor: 'not-allowed', padding: '8px 16px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" } : { padding: '8px 16px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  <FaSignInAlt size={12} style={{ marginRight: '6px' }} />
                  Check In
                </button>

                <button
                  onClick={handleCheckOut}
                  disabled={loading || !canCheckOut}
                  className={!canCheckOut ? 'btn-outline-indigo' : 'btn-gradient-coral'}
                  style={!canCheckOut ? { opacity: 0.5, cursor: 'not-allowed', padding: '8px 16px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" } : { padding: '8px 16px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  <FaSignOutAlt size={12} style={{ marginRight: '6px' }} />
                  Check Out
                </button>
              </div>
            </div>

            {/* Today's Status */}
            {todayRecord && todayRecord.status !== 'WEEKEND' && (
              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px'
              }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Check In</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>
                    {todayRecord.checkIn ? formatTime(todayRecord.checkIn) : '--:--'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Check Out</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>
                    {todayRecord.checkOut ? formatTime(todayRecord.checkOut) : '--:--'}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Working Hours</p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>
                    {todayRecord.hours > 0 ? todayRecord.hours.toFixed(1) : '0.0'} hrs
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Status</p>
                  <span className={`badge-${getStatusColor(todayRecord.status)}`} style={{ fontSize: '11px', padding: '3px 8px', fontFamily: "'DM Sans', sans-serif" }}>
                    {getStatusText(todayRecord)}
                  </span>
                </div>
                {todayRecord.overtimeHours > 0 && (
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Overtime</p>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--accent-teal)', fontFamily: "'Sora', sans-serif" }}>
                      +{todayRecord.overtimeHours.toFixed(1)} hrs
                    </p>
                  </div>
                )}
              </div>
            )}

            {todayRecord?.status === 'WEEKEND' && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                <p>🏖️ Today is a weekend! Enjoy your day off.</p>
              </div>
            )}

            {todayRecord?.status === 'LEAVE' && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                <p>📅 You are on {todayRecord.leaveType || ''} leave today.</p>
              </div>
            )}

            {!todayRecord && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                <p>No attendance record for today. Click "Check In" to start your day.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - Centered (same as other dashboards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* Present Days */}
          <div className="stat-card attendance-stat" style={{
            padding: '20px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            transition: 'all 0.2s'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              color: '#10b981',
              fontSize: 20
            }}>
              <FaUserCheck />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Present Days</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981', fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.totalPresent}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This month</div>
          </div>

          {/* Half Days */}
          <div className="stat-card attendance-stat" style={{
            padding: '20px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              color: '#f59e0b',
              fontSize: 20
            }}>
              <FaClock />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Half Days</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.totalHalfDay}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This month</div>
          </div>

          {/* Leave Days */}
          <div className="stat-card attendance-stat" style={{
            padding: '20px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              color: '#8b5cf6',
              fontSize: 20
            }}>
              <FaCalendarAlt />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Leave Days</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.totalLeave}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This month</div>
          </div>

          {/* Absent Days */}
          <div className="stat-card attendance-stat" style={{
            padding: '20px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              color: '#ef4444',
              fontSize: 20
            }}>
              <FaCalendarAlt />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Absent Days</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444', fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.totalAbsent}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This month</div>
          </div>
        </div>

        {/* Modern Calendar Component */}
        <div className="attendance-table-card" style={{ overflow: 'visible' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>
                Attendance Calendar
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => changeMonth(-1)} className="calendar-nav-btn" style={{ padding: '6px 10px', fontFamily: "'DM Sans', sans-serif" }}>
                <FaChevronLeft size={12} />
              </button>
              <button onClick={() => changeMonth(1)} className="calendar-nav-btn" style={{ padding: '6px 10px', fontFamily: "'DM Sans', sans-serif" }}>
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <div className="calendar-grid">
              {weekDays.map(day => (
                <div key={day} className="calendar-weekday" style={{ fontSize: '13px', padding: '8px', fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{day}</div>
              ))}
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="calendar-legend" style={{ gap: '12px', paddingTop: '16px', fontFamily: "'DM Sans', sans-serif" }}>
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
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color holiday-color"></span>
                <span>Holiday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceDashboard;