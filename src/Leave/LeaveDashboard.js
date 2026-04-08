import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaUserCheck, 
  FaUsers, 
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaFilter,
  FaSync,
  FaUserCircle,
  FaUmbrellaBeach
} from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const LeaveDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    myLeaves: [],
    teamLeaves: [],
    allLeaves: [],
    pendingApprovals: [],
    stats: null
  });
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('myLeaves');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState(true); // Toggle between calendar and table

  const getAuthConfig = () => ({
    headers: { 
      Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}`,
      'Content-Type': 'application/json'
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const fetchDashboard = async (showRefreshMessage = false) => {
    if (showRefreshMessage) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const response = await axios.get(API_ENDPOINTS.LEAVE_DASHBOARD, {
        params: { page, size },
        ...getAuthConfig()
      });
      
      const data = response.data?.response || response.data;
      
      if (data) {
        setDashboardData({
          myLeaves: data.myLeaves || [],
          teamLeaves: data.teamLeaves || [],
          allLeaves: data.allLeaves || [],
          pendingApprovals: data.pendingApprovals || [],
          stats: data.stats || null
        });
        
        if (data.stats) {
          setUserRole('HR');
        } else if (data.teamLeaves?.length > 0 || data.pendingApprovals?.length > 0) {
          setUserRole('MANAGER');
        } else {
          setUserRole('EMPLOYEE');
        }
        
        if (showRefreshMessage) {
          toast.success('Success', 'Dashboard refreshed successfully');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      const message = error.response?.data?.message || 'Failed to fetch dashboard data';
      toast.error('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [page, size]);

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'APPROVED': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'PENDING_L2': return '#f59e0b';
      case 'REJECTED': return '#ef4444';
      case 'CANCELLED': return '#6b7280';
      default: return '#8b92b8';
    }
  };

  const getStatusBgColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'APPROVED': return '#d1fae5';
      case 'PENDING': return '#fed7aa';
      case 'PENDING_L2': return '#fed7aa';
      case 'REJECTED': return '#fee2e2';
      case 'CANCELLED': return '#f3f4f6';
      default: return '#f0f2ff';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toUpperCase()) {
      case 'APPROVED': return <FaCheckCircle size={12} />;
      case 'PENDING': return <FaClock size={12} />;
      case 'PENDING_L2': return <FaClock size={12} />;
      case 'REJECTED': return <FaTimesCircle size={12} />;
      default: return <FaCalendarAlt size={12} />;
    }
  };

  // Get all leaves for the current tab
  const getCurrentLeaves = () => {
    switch(activeTab) {
      case 'myLeaves':
        return dashboardData.myLeaves;
      case 'teamLeaves':
        return dashboardData.teamLeaves;
      case 'allLeaves':
        return dashboardData.allLeaves;
      case 'pendingApprovals':
        return dashboardData.pendingApprovals;
      default:
        return [];
    }
  };

  // Filter leaves by status
  const filterLeavesByStatus = (leaves) => {
    if (selectedStatus === 'all') return leaves;
    return leaves.filter(leave => 
      leave.status?.toLowerCase() === selectedStatus.toLowerCase()
    );
  };

  const getFilteredLeaves = () => {
    return filterLeavesByStatus(getCurrentLeaves());
  };

  // Calendar generation logic for leave dates
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateInLeaveRange = (dateStr, leave) => {
    const checkDate = new Date(dateStr);
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    return checkDate >= startDate && checkDate <= endDate;
  };

  const getLeaveForDate = (dateStr) => {
    const leaves = getFilteredLeaves();
    return leaves.find(leave => isDateInLeaveRange(dateStr, leave));
  };

  const getDateStatusClass = (dateStr) => {
    const leave = getLeaveForDate(dateStr);
    if (!leave) return '';
    
    switch(leave.status?.toUpperCase()) {
      case 'APPROVED': return 'calendar-day-present';
      case 'PENDING': return 'calendar-day-halfday';
      case 'PENDING_L2': return 'calendar-day-halfday';
      case 'REJECTED': return 'calendar-day-absent';
      default: return '';
    }
  };

  const getStatusTooltip = (dateStr) => {
    const leave = getLeaveForDate(dateStr);
    if (!leave) return 'No leave';
    return `${leave.employeeName} - ${leave.leaveType} (${leave.status})`;
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
      const hasLeave = !!getLeaveForDate(dateStr);
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${statusClass} ${isToday ? 'calendar-day-today' : ''}`}
          title={tooltip}
        >
          <span className="calendar-day-number">{day}</span>
          {hasLeave && <span className="calendar-day-indicator"></span>}
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

  const renderLeaveTable = (leaves) => {
    if (leaves.length === 0) {
      return (
        <div className="attendance-empty" style={{ padding: '40px' }}>
          <div className="empty-icon">
            <FaCalendarAlt />
          </div>
          <p>No leave records found</p>
          <small>No data available for the selected filters</small>
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Duration</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave, idx) => {
              const start = new Date(leave.startDate);
              const end = new Date(leave.endDate);
              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
              
              return (
                <tr key={leave.leaveId || idx}>
                  <td className="date-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--accent-indigo-pale)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaUserCircle size={16} color="var(--accent-indigo)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{leave.employeeName}</div>
                       
                      </div>
                    </div>
                  </td>
                  <td className="day-cell">{leave.leaveType}</td>
                  <td className="time-cell">{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</td>
                  <td className="hours-cell">{days}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: getStatusBgColor(leave.status),
                      color: getStatusColor(leave.status)
                    }}>
                      {getStatusIcon(leave.status)}
                      <span>{leave.status?.replace('_L2', '') || 'UNKNOWN'}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const tabs = [
    { id: 'myLeaves', label: 'My Leaves', icon: <FaUserCheck size={14} />, count: dashboardData.myLeaves?.length || 0 },
    ...(userRole === 'MANAGER' ? [
      { id: 'teamLeaves', label: 'Team Leaves', icon: <FaUsers size={14} />, count: dashboardData.teamLeaves?.length || 0 },
      { id: 'pendingApprovals', label: 'Pending Approvals', icon: <FaClock size={14} />, count: dashboardData.pendingApprovals?.length || 0 }
    ] : []),
    ...(userRole === 'HR' ? [
      { id: 'allLeaves', label: 'All Leaves', icon: <FaUsers size={14} />, count: dashboardData.allLeaves?.length || 0 },
      { id: 'pendingApprovals', label: 'Pending L2', icon: <FaClock size={14} />, count: dashboardData.pendingApprovals?.length || 0 }
    ] : [])
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'pending_l2', label: 'Pending L2' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const filteredLeaves = getFilteredLeaves();

  return (
    <>
      <ToastContainer />
      <div className="attendance-root">
        {refreshing && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Refreshing dashboard..." />
          </div>
        )}

        <div className="attendance-header">
          <h1>Leave Dashboard</h1>
          <p>Manage and track leave requests</p>
        </div>

        {/* HR Stats Cards */}
        {userRole === 'HR' && dashboardData.stats && (
          <div className="summary-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
              <div className="stat-label" style={{ fontSize: '12px' }}>
                <FaClock size={12} style={{ marginRight: '4px' }} />
                Pending
              </div>
              <div className="stat-value" style={{ fontSize: '32px', color: '#f59e0b' }}>{dashboardData.stats.pending || 0}</div>
              <div className="stat-trend" style={{ fontSize: '11px' }}>Awaiting approval</div>
            </div>
            
            <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
              <div className="stat-label" style={{ fontSize: '12px' }}>
                <FaCheckCircle size={12} style={{ marginRight: '4px' }} />
                Approved
              </div>
              <div className="stat-value" style={{ fontSize: '32px', color: '#10b981' }}>{dashboardData.stats.approved || 0}</div>
              <div className="stat-trend" style={{ fontSize: '11px' }}>Approved leaves</div>
            </div>
            
            <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
              <div className="stat-label" style={{ fontSize: '12px' }}>
                <FaTimesCircle size={12} style={{ marginRight: '4px' }} />
                Rejected
              </div>
              <div className="stat-value" style={{ fontSize: '32px', color: '#ef4444' }}>{dashboardData.stats.rejected || 0}</div>
              <div className="stat-trend" style={{ fontSize: '11px' }}>Rejected leaves</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-light)',
          overflowX: 'auto',
          flexWrap: 'wrap'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: activeTab === tab.id ? 'var(--accent-indigo)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '12px 12px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                borderBottom: activeTab === tab.id ? 'none' : '2px solid transparent'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--accent-indigo-pale)',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="filter-card" style={{ marginBottom: '24px' }}>
          <div className="filter-group">
            <div className="filter-item">
              <label><FaFilter size={12} /> Status Filter</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <label><FaEye size={12} /> View</label>
              <select
                value={calendarView ? 'calendar' : 'table'}
                onChange={(e) => setCalendarView(e.target.value === 'calendar')}
                className="filter-select"
              >
                <option value="calendar">📅 Calendar View</option>
                <option value="table">📋 Table View</option>
              </select>
            </div>
            
            <div className="filter-item">
              <button onClick={() => fetchDashboard(true)} className="refresh-btn" disabled={refreshing}>
                <FaSync size={14} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {calendarView && (
          <div className="attendance-table-card" style={{ overflow: 'visible', marginBottom: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Leave Calendar
                  {selectedStatus !== 'all' && (
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      marginLeft: '10px',
                      padding: '2px 8px',
                      background: 'var(--accent-indigo-pale)',
                      borderRadius: '20px',
                      color: 'var(--accent-indigo)'
                    }}>
                      Filtered: {selectedStatus}
                    </span>
                  )}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()} • {filteredLeaves.length} leave requests
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
                  <p>Loading leave data...</p>
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
                      <span>Approved Leave</span>
                    </div>
                    <div className="legend-item" style={{ fontSize: '12px' }}>
                      <span className="legend-color halfday-color"></span>
                      <span>Pending Leave</span>
                    </div>
                    <div className="legend-item" style={{ fontSize: '12px' }}>
                      <span className="legend-color absent-color"></span>
                      <span>Rejected Leave</span>
                    </div>
                    <div className="legend-item" style={{ fontSize: '12px' }}>
                      <span className="legend-color today-color"></span>
                      <span>Today</span>
                    </div>
                  </div>

                  {/* Filter info message */}
                  {selectedStatus !== 'all' && (
                    <div style={{
                      marginTop: '20px',
                      padding: '10px 16px',
                      background: 'var(--accent-indigo-pale)',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '12px', color: 'var(--accent-indigo)', margin: 0 }}>
                        🔍 Showing only <strong>{selectedStatus}</strong> leave requests in the calendar
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Table View */}
        {!calendarView && (
          <div className="attendance-table-card">
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {tabs.find(t => t.id === activeTab)?.label || 'Leaves'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Showing {filteredLeaves.length} records
                  {selectedStatus !== 'all' && ` filtered by ${selectedStatus}`}
                </p>
              </div>
            </div>
            
            {loading ? (
              <div className="attendance-loading" style={{ padding: '60px' }}>
                <div className="loading-spinner"></div>
                <p>Loading leave data...</p>
              </div>
            ) : (
              renderLeaveTable(filteredLeaves)
            )}
          </div>
        )}

        {/* Pagination (only for table view) */}
        {!calendarView && filteredLeaves.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Page {page + 1} • {filteredLeaves.length} records
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="calendar-nav-btn"
                style={{ padding: '6px 12px' }}
              >
                <FaChevronLeft size={12} />
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={filteredLeaves.length < size}
                className="calendar-nav-btn"
                style={{ padding: '6px 12px' }}
              >
                Next
                <FaChevronRight size={12} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: '12px',
          padding: '14px 20px',
          marginTop: '20px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <FaUmbrellaBeach color="var(--accent-teal)" size={16} />
            <div>
              <p style={{ fontWeight: '600', color: '#166534', marginBottom: '2px', fontSize: '13px' }}>Leave Policy</p>
              <p style={{ fontSize: '12px', color: '#15803d' }}>
                • Pending leaves require manager approval • L2 approval needed for HR • Leave requests should be submitted at least 3 days in advance
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaveDashboard;