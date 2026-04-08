import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaUmbrellaBeach, FaRegCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const MyAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      const attendanceData = response.data?.response || [];
      
      const transformedData = attendanceData.map(record => ({
        id: record.id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        hours: record.workingHours || 0,
        status: record.status,
        overtimeHours: record.overtimeHours || 0,
        leaveType: record.leaveType || null,
        employeeName: record.employeeName
      }));
      
      setRecords(transformedData);
      
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

  // Sync current month with selected month/year
  useEffect(() => {
    setCurrentMonth(new Date(selectedYear, selectedMonth, 1));
  }, [selectedMonth, selectedYear]);

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
    return records.find(record => record.date === dateStr);
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
    
    // Apply status filter to calendar view
    if (statusFilter !== 'all') {
      if (record.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return '';
      }
    }
    
    switch(record.status) {
      case 'PRESENT': return 'calendar-day-present';
      case 'ABSENT': return 'calendar-day-absent';
      case 'LEAVE': return 'calendar-day-leave';
      case 'WEEKEND': return 'calendar-day-weekend';
      case 'HALF_DAY': return 'calendar-day-halfday';
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
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate summary stats for the selected month/year
  const monthRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
  });
  
  const workingDaysRecords = monthRecords.filter(r => r.status !== 'WEEKEND');
  
  const summary = {
    total: workingDaysRecords.length,
    present: workingDaysRecords.filter(r => r.status === 'PRESENT').length,
    absent: workingDaysRecords.filter(r => r.status === 'ABSENT').length,
    halfDay: workingDaysRecords.filter(r => r.status === 'HALF_DAY').length,
    leave: workingDaysRecords.filter(r => r.status === 'LEAVE').length,
    totalHours: workingDaysRecords.reduce((sum, r) => sum + (r.hours || 0), 0).toFixed(1)
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

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

        {/* Summary Cards - Compact */}
        <div className="summary-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaCalendarAlt size={11} style={{ marginRight: '4px' }} />
              Working Days
            </div>
            <div className="stat-value total" style={{ fontSize: '28px' }}>{summary.total}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>Excluding weekends</div>
          </div>
          
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaCheckCircle size={11} style={{ marginRight: '4px' }} />
              Present
            </div>
            <div className="stat-value present" style={{ fontSize: '28px' }}>{summary.present}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>
              {summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : 0}% rate
            </div>
          </div>
          
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaClock size={11} style={{ marginRight: '4px' }} />
              Half Day
            </div>
            <div className="stat-value late" style={{ fontSize: '28px' }}>{summary.halfDay}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>Partial attendance</div>
          </div>

          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaUmbrellaBeach size={11} style={{ marginRight: '4px' }} />
              Leave
            </div>
            <div className="stat-value" style={{ fontSize: '28px', color: '#8b5cf6' }}>{summary.leave}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>Approved leaves</div>
          </div>
          
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaTimesCircle size={11} style={{ marginRight: '4px' }} />
              Absent
            </div>
            <div className="stat-value absent" style={{ fontSize: '28px' }}>{summary.absent}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>No attendance</div>
          </div>
          
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaClock size={11} style={{ marginRight: '4px' }} />
              Total Hours
            </div>
            <div className="stat-value hours" style={{ fontSize: '28px' }}>{summary.totalHours}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>Hours worked</div>
          </div>
        </div>

        {/* Filters - Above Calendar */}
        <div className="filter-card" style={{ marginBottom: '24px' }}>
          <div className="filter-group">
            <div className="filter-item">
              <label><FaCalendarAlt size={12} /> Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="filter-select"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {new Date(2000, month, 1).toLocaleString('default', { month: 'long' })}
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
              <label><FaEye size={12} /> Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
                <option value="absent">Absent</option>
                <option value="weekend">Weekend</option>
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

        {/* Modern Calendar Component */}
        <div className="attendance-table-card" style={{ overflow: 'visible', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Attendance Calendar
                {statusFilter !== 'all' && (
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    marginLeft: '10px',
                    padding: '2px 8px',
                    background: 'var(--accent-indigo-pale)',
                    borderRadius: '20px',
                    color: 'var(--accent-indigo)'
                  }}>
                    Filtered: {statusFilter}
                  </span>
                )}
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
            {loading ? (
              <div className="attendance-loading" style={{ padding: '40px' }}>
                <div className="loading-spinner"></div>
                <p>Loading attendance data...</p>
              </div>
            ) : (
              <>
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
                </div>

                {/* Filter info message */}
                {statusFilter !== 'all' && (
                  <div style={{
                    marginTop: '20px',
                    padding: '10px 16px',
                    background: 'var(--accent-indigo-pale)',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '12px', color: 'var(--accent-indigo)', margin: 0 }}>
                      🔍 Showing only <strong>{statusFilter}</strong> days in the calendar
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary Footer */}
        {!loading && monthRecords.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Total records for {monthNames[selectedMonth]} {selectedYear}: {monthRecords.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
                {summary.present > 0 && (
                  <span style={{ color: '#10b981' }}>
                    ✅ Present: {summary.present}
                  </span>
                )}
                {summary.halfDay > 0 && (
                  <span style={{ color: '#f59e0b' }}>
                    ⏰ Half Day: {summary.halfDay}
                  </span>
                )}
                {summary.leave > 0 && (
                  <span style={{ color: '#8b5cf6' }}>
                    📅 Leave: {summary.leave}
                  </span>
                )}
                {summary.absent > 0 && (
                  <span style={{ color: '#ef4444' }}>
                    ❌ Absent: {summary.absent}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MyAttendance;