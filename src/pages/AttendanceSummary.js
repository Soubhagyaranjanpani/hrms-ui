import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartPie, FaCalendarAlt, FaTrophy, FaClock, FaCheckCircle, FaTimesCircle, FaUmbrellaBeach } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const AttendanceSummary = () => {
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

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
      
      // Updated to match actual response structure: response.data?.response
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
        
        toast.success('Success', `Summary loaded for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`);
      } else {
        setSummary(null);
        toast.info('No Data', 'No attendance data available for selected period');
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

  useEffect(() => {
    fetchSummary();
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

  // Format working hours to show 1 decimal place
  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0.0';
    return hours.toFixed(1);
  };

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
            <div className="card-modern" style={{ 
              background: rating.bg, 
              marginBottom: '24px',
              border: `1px solid ${rating.color}`
            }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <p style={{ color: rating.color, marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Attendance Rating
                    </p>
                    <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '4px', color: rating.color }}>
                      {attendanceRate}%
                    </h2>
                    <p style={{ color: rating.color, fontWeight: '500', fontSize: '16px' }}>{rating.text}</p>
                  </div>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: rating.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.9
                  }}>
                    <FaTrophy size={40} color="white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid - 3 columns for better layout */}
            <div className="summary-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div className="stat-card attendance-stat">
                <div className="stat-label">
                  <FaCalendarAlt size={12} style={{ marginRight: '6px' }} />
                  Total Working Days
                </div>
                <div className="stat-value total">{summary.totalWorkingDays || 0}</div>
                <div className="stat-trend">Days in month</div>
              </div>
              
              <div className="stat-card attendance-stat">
                <div className="stat-label">
                  <FaCheckCircle size={12} style={{ marginRight: '6px' }} />
                  Present Days
                </div>
                <div className="stat-value present">{summary.presentDays || 0}</div>
                <div className="stat-trend">
                  {summary.totalWorkingDays > 0 ? ((summary.presentDays / summary.totalWorkingDays) * 100).toFixed(1) : 0}% of total
                </div>
              </div>

              <div className="stat-card attendance-stat">
                <div className="stat-label">
                  <FaClock size={12} style={{ marginRight: '6px' }} />
                  Half Days
                </div>
                <div className="stat-value late">{summary.halfDays || 0}</div>
                <div className="stat-trend">Partial attendance</div>
              </div>
              
              <div className="stat-card attendance-stat">
                <div className="stat-label">
                  <FaTimesCircle size={12} style={{ marginRight: '6px' }} />
                  Absent Days
                </div>
                <div className="stat-value absent">{summary.absentDays || 0}</div>
                <div className="stat-trend">No attendance</div>
              </div>

              <div className="stat-card attendance-stat">
                <div className="stat-label">
                  <FaUmbrellaBeach size={12} style={{ marginRight: '6px' }} />
                  Leave Days
                </div>
                <div className="stat-value" style={{ color: '#8b5cf6' }}>{summary.leaveDays || 0}</div>
                <div className="stat-trend">Approved leaves</div>
              </div>

              <div className="stat-card attendance-stat">
                <div className="stat-label">
                  <FaClock size={12} style={{ marginRight: '6px' }} />
                  Total Working Hours
                </div>
                <div className="stat-value hours">{formatHours(summary.totalWorkingHours)}</div>
                <div className="stat-trend">Hours worked</div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="card-modern" style={{ marginBottom: '24px' }}>
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

            {/* Info Note */}
            {/* <div className="card-modern" style={{ background: '#eff6ff' }}>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                  📊 Summary for {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                </p>
                <p style={{ fontSize: '12px', color: '#1e40af', margin: '8px 0 0 0', opacity: 0.8 }}>
                  Total Working Days = Present + Absent + Leave + Half Days
                </p>
              </div>
            </div> */}
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