import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartPie, FaCalendarAlt, FaTrophy, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
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
      
      const summaryData = response.data?.response || response.data?.data;
      
      if (summaryData) {
        setSummary({
          presentDays: summaryData.presentDays || 0,
          absentDays: summaryData.absentDays || 0,
          leaveDays: summaryData.leaveDays || 0,
          halfDays: summaryData.halfDays || 0,
          totalWorkingHours: summaryData.totalWorkingHours || 0,
          totalWorkingDays: (summaryData.presentDays || 0) + (summaryData.absentDays || 0) + (summaryData.leaveDays || 0),
          lateDays: summaryData.lateDays || 0,
          overtimeHours: summaryData.overtimeHours || 0
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
    if (rate >= 90) return { color: 'success', text: 'Excellent', bg: '#d1fae5' };
    if (rate >= 75) return { color: 'warning', text: 'Good', bg: '#fed7aa' };
    if (rate >= 60) return { color: 'warning', text: 'Average', bg: '#ffedd5' };
    return { color: 'danger', text: 'Needs Improvement', bg: '#fee2e2' };
  };

  const rating = getRatingColor();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

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
              border: `1px solid var(--${rating.color})`
            }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <p style={{ color: `var(--${rating.color})`, marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Attendance Rating
                    </p>
                    <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '4px', color: `var(--${rating.color})` }}>
                      {attendanceRate}%
                    </h2>
                    <p style={{ color: `var(--${rating.color})`, fontWeight: '500', fontSize: '16px' }}>{rating.text}</p>
                  </div>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: `var(--${rating.color})`,
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

            {/* Stats Grid */}
            <div className="summary-grid">
              <div className="stat-card attendance-stat">
                <div className="stat-label">Working Days</div>
                <div className="stat-value total">{summary.totalWorkingDays || 0}</div>
              </div>
              
              <div className="stat-card attendance-stat">
                <div className="stat-label"><FaCheckCircle size={12} /> Present</div>
                <div className="stat-value present">{summary.presentDays || 0}</div>
              </div>

              <div className="stat-card attendance-stat">
                <div className="stat-label"><FaClock size={12} /> Half Days</div>
                <div className="stat-value late">{summary.halfDays || 0}</div>
              </div>
              
              <div className="stat-card attendance-stat">
                <div className="stat-label"><FaTimesCircle size={12} /> Absent</div>
                <div className="stat-value absent">{summary.absentDays || 0}</div>
              </div>

              <div className="stat-card attendance-stat">
                <div className="stat-label">Leave Days</div>
                <div className="stat-value">{summary.leaveDays || 0}</div>
              </div>

              <div className="stat-card attendance-stat">
                <div className="stat-label">Total Hours</div>
                <div className="stat-value hours">{summary.totalWorkingHours ? summary.totalWorkingHours.toFixed(1) : 0}</div>
              </div>
            </div>

            {/* Additional Info */}
            {(summary.lateDays > 0 || summary.overtimeHours > 0) && (
              <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                {summary.lateDays > 0 && (
                  <div className="stat-card attendance-stat">
                    <div className="stat-label">Late Arrivals</div>
                    <div className="stat-value late">{summary.lateDays} days</div>
                  </div>
                )}
                {summary.overtimeHours > 0 && (
                  <div className="stat-card attendance-stat">
                    <div className="stat-label">Overtime Hours</div>
                    <div className="stat-value hours">{summary.overtimeHours.toFixed(1)} hrs</div>
                  </div>
                )}
              </div>
            )}

            {/* Info Note */}
            <div className="card-modern" style={{ background: '#eff6ff', marginTop: '24px' }}>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                  📊 Summary for {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                </p>
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