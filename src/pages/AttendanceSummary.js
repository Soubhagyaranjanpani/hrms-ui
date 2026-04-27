import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartPie, FaCalendarAlt, FaTrophy, FaClock, FaCheckCircle, FaTimesCircle, FaUmbrellaBeach, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AttendanceSummary = () => {
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getAuthConfig = () => ({
    headers: { 
      Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}`,
      'Content-Type': 'application/json'
    }
  });

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.GET_SUMMARY, {
        params: { month, year },
        ...getAuthConfig()
      });
      
      const summaryData = response.data?.response;
      
      if (summaryData) {
        setSummary({
          presentDays: summaryData.presentDays || 0,
          absentDays: summaryData.absentDays || 0,
          leaveDays: summaryData.leaveDays || 0,
          halfDays: summaryData.halfDays || 0,
          totalWorkingHours: summaryData.totalWorkingHours || 0,
          totalWorkingDays: (summaryData.presentDays || 0) + 
                           (summaryData.absentDays || 0) + 
                           (summaryData.leaveDays || 0) + 
                           (summaryData.halfDays || 0)
        });
        
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      const message = error.response?.data?.message || 'Failed to fetch attendance summary';
      toast.error('Error', message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyRecords = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, getAuthConfig());
      const records = response.data?.response || [];
      setMonthlyRecords(records);
    } catch (error) {
      console.error('Error fetching monthly records:', error);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchMonthlyRecords();
  }, [month, year]);

  // Sync current month with selected month/year
  useEffect(() => {
    setCurrentMonth(new Date(year, month - 1, 1));
  }, [month, year]);

  const attendanceRate = summary?.totalWorkingDays && summary.totalWorkingDays > 0
    ? ((summary.presentDays / summary.totalWorkingDays) * 100).toFixed(1)
    : 0;

  const getRatingColor = () => {
    const rate = parseFloat(attendanceRate);
    if (rate >= 90) return { color: '#10b981', text: 'Excellent', bg: '#d1fae5' };
    if (rate >= 75) return { color: '#f59e0b', text: 'Good', bg: '#fed7aa' };
    if (rate >= 60) return { color: '#f59e0b', text: 'Average', bg: '#ffedd5' };
    return { color: '#ef4444', text: 'Needs Improvement', bg: '#fee2e2' };
  };

  const rating = getRatingColor();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0.0';
    return hours.toFixed(1);
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
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1);
    setCurrentMonth(newDate);
    setMonth(newDate.getMonth() + 1);
    setYear(newDate.getFullYear());
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <ToastContainer />
      <div className="attendance-root">
        {loading && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Loading summary data..." />
          </div>
        )}

        <div className="attendance-header">
          <h1>Attendance Summary</h1>
          <p>Monthly overview and performance metrics</p>
        </div>

        {/* Filter Card */}
        <div className="filter-card">
          <div className="filter-group">
            <div className="filter-item">
              <label>Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="filter-select"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <label>Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="filter-select"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <button onClick={fetchSummary} className="refresh-btn" disabled={loading}>
                <FaCalendarAlt size={14} />
                {loading ? 'Loading...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {summary ? (
          <>
            {/* Rating Card */}
            {/* <div className="card-modern" style={{ 
              background: rating.bg, 
              marginBottom: '24px',
              border: `1px solid ${rating.color}`
            }}>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <p style={{ color: rating.color, marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                      Attendance Rating
                    </p>
                    <h2 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '2px', color: rating.color }}>
                      {attendanceRate}%
                    </h2>
                    <p style={{ color: rating.color, fontWeight: '500', fontSize: '14px' }}>{rating.text}</p>
                  </div>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    background: rating.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.9
                  }}>
                    <FaTrophy size={32} color="white" />
                  </div>
                </div>
              </div>
            </div> */}

            {/* Stats Grid - 6 cards */}
            <div className="summary-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaCalendarAlt size={11} style={{ marginRight: '4px' }} />
                  Total Working Days
                </div>
                <div className="stat-value total" style={{ fontSize: '28px' }}>{summary.totalWorkingDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>Days in month</div>
              </div>
              
              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaCheckCircle size={11} style={{ marginRight: '4px' }} />
                  Present Days
                </div>
                <div className="stat-value present" style={{ fontSize: '28px' }}>{summary.presentDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>
                  {summary.totalWorkingDays > 0 ? ((summary.presentDays / summary.totalWorkingDays) * 100).toFixed(1) : 0}% of total
                </div>
              </div>

              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaClock size={11} style={{ marginRight: '4px' }} />
                  Half Days
                </div>
                <div className="stat-value late" style={{ fontSize: '28px' }}>{summary.halfDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>Partial attendance</div>
              </div>
              
              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaTimesCircle size={11} style={{ marginRight: '4px' }} />
                  Absent Days
                </div>
                <div className="stat-value absent" style={{ fontSize: '28px' }}>{summary.absentDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>No attendance</div>
              </div>

              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaUmbrellaBeach size={11} style={{ marginRight: '4px' }} />
                  Leave Days
                </div>
                <div className="stat-value" style={{ fontSize: '28px', color: '#8b5cf6' }}>{summary.leaveDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>Approved leaves</div>
              </div>

              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaClock size={11} style={{ marginRight: '4px' }} />
                  Total Hours
                </div>
                <div className="stat-value hours" style={{ fontSize: '28px' }}>{formatHours(summary.totalWorkingHours)}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>Hours worked</div>
              </div>
            </div>

            {/* Modern Calendar Component */}
            <div className="attendance-table-card" style={{ overflow: 'visible', marginBottom: '24px' }}>
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
                    <span className="legend-color holiday-color"></span>
                    <span>Holiday</span>
                  </div>
                  <div className="legend-item" style={{ fontSize: '12px' }}>
                    <span className="legend-color future-color"></span>
                    <span>Future Date</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="card-modern">
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Performance Insights
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Attendance Rate</span>
                    <div style={{ flex: 1, maxWidth: '300px', marginLeft: 'auto' }}>
                      <div style={{ 
                        background: '#e5e7eb', 
                        borderRadius: '10px', 
                        height: '8px', 
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${attendanceRate}%`, 
                          background: rating.color, 
                          height: '100%', 
                          borderRadius: '10px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                    <span style={{ fontWeight: '600', color: rating.color }}>{attendanceRate}%</span>
                  </div>
                  
                  {summary.presentDays > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Average Hours/Day</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {summary.totalWorkingDays > 0 
                          ? (summary.totalWorkingHours / summary.totalWorkingDays).toFixed(1) 
                          : '0.0'} hours
                      </span>
                    </div>
                  )}
                  
                  {summary.absentDays > 0 && (
                    <div style={{ 
                      background: '#fef2f2', 
                      padding: '12px', 
                      borderRadius: '12px',
                      marginTop: '8px'
                    }}>
                      <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>
                        ⚠️ You were absent for {summary.absentDays} day{summary.absentDays > 1 ? 's' : ''} this month.
                        {summary.absentDays > 3 && " Consider improving your attendance."}
                      </p>
                    </div>
                  )}
                  
                  {summary.leaveDays > 0 && (
                    <div style={{ 
                      background: '#f3e8ff', 
                      padding: '12px', 
                      borderRadius: '12px',
                      marginTop: '8px'
                    }}>
                      <p style={{ fontSize: '13px', color: '#7c3aed', margin: 0 }}>
                        📅 You took {summary.leaveDays} day{summary.leaveDays > 1 ? 's' : ''} of leave this month.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="attendance-empty">
            <div className="empty-icon">
              <FaChartPie />
            </div>
            <p>No data available for selected period</p>
            <small>Try selecting a different month or year</small>
          </div>
        )}
      </div>
    </>
  );
};

export default AttendanceSummary;