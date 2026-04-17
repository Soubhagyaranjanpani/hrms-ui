import React, { useState, useEffect } from 'react';
import { FaStar, FaChartLine, FaTrophy, FaArrowUp, FaCheckCircle, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getAuthHeaders } from '../config/api.config';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Performance = ({ user }) => {
  const navigate = useNavigate();
  const [performances, setPerformances] = useState([]);
  const [stats, setStats] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to clean name (remove "null" suffix)
  const cleanName = (fullName) => {
    if (!fullName) return 'Anonymous';
    return fullName.replace(/\s*null\s*/gi, '').trim() || 'Anonymous';
  };

  // Load all data
  const loadPerformanceData = async () => {
    try {
      const [listRes, statsRes, topRes] = await Promise.all([
        fetch(API_ENDPOINTS.GET_PERFORMANCE, { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.GET_PERF_STATS, { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.GET_TOP_PERFORMERS, { headers: getAuthHeaders() }),
      ]);

      if (!listRes.ok) throw new Error('Failed to load performance list');
      if (!statsRes.ok) throw new Error('Failed to load performance stats');
      if (!topRes.ok) throw new Error('Failed to load top performers');

      const listData = await listRes.json();
      const statsData = await statsRes.json();
      const topData = await topRes.json();

      // Handle different response structures and clean names
      const performanceList = listData.response || listData.data || listData || [];
      const cleanedPerformances = Array.isArray(performanceList) 
        ? performanceList.map(perf => ({
            ...perf,
            name: cleanName(perf.name)
          }))
        : [];

      const topPerformersList = topData.response || topData.data || topData || [];
      const cleanedTopPerformers = Array.isArray(topPerformersList)
        ? topPerformersList.map(perf => ({
            ...perf,
            name: cleanName(perf.name)
          }))
        : [];

      setPerformances(cleanedPerformances);
      setStats(statsData.response || statsData.data || statsData || null);
      setTopPerformers(cleanedTopPerformers);
    } catch (err) {
      toast.error('Load Error', err.message || 'Could not load performance data');
      console.error('Performance data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Outstanding': return 'badge-success';
      case 'Excellent': return 'badge-success';
      case 'Great': return 'badge-info';
      case 'Good': return 'badge-info';
      default: return 'badge-warning';
    }
  };

  const formatImprovement = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return `${value}%`;
    if (typeof value === 'string' && value.includes('%')) return value;
    return `${value}%`;
  };

  const calculateProgress = (achieved, total) => {
    if (!total || total === 0) return 0;
    return Math.round((achieved / total) * 100);
  };

  if (loading) return <LoadingSpinner message="Loading performance data…" />;

  return (
    <div className="performance-root">
      {/* Header */}
      <div className="performance-header">
        <div>
          <h1 className="performance-title">Performance Reviews</h1>
          <p className="performance-subtitle">Track and manage employee performance metrics</p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="performance-stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Avg Rating</p>
              <h3 className="stat-value">{stats?.avgRating?.toFixed(1) ?? '—'}</h3>
              <small className="stat-trend positive">
                <FaArrowUp size={10} /> This quarter
              </small>
            </div>
            <div className="stat-icon icon-indigo"><FaStar /></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Completed Reviews</p>
              <h3 className="stat-value">{stats?.completedReviews ?? '—'}</h3>
              <small className="stat-trend">This quarter</small>
            </div>
            <div className="stat-icon icon-coral"><FaChartLine /></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Goal Achievement</p>
              <h3 className="stat-value">{stats?.goalAchievementPct != null ? `${stats.goalAchievementPct}%` : '—'}</h3>
              <small className="stat-trend positive">
                <FaArrowUp size={10} /> Overall
              </small>
            </div>
            <div className="stat-icon icon-teal"><FaCheckCircle /></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Outstanding</p>
              <h3 className="stat-value">{stats?.outstandingCount ?? '—'}</h3>
              <small className="stat-trend">Employees with 4.5+</small>
            </div>
            <div className="stat-icon icon-amber"><FaTrophy /></div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="performance-top-performers">
        <div className="top-performers-header">
          <h3>🏆 Top Performers</h3>
        </div>
        <div className="top-performers-grid">
          {!Array.isArray(topPerformers) || topPerformers.length === 0 ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
              No top performers data yet.
            </div>
          ) : (
            topPerformers.map(performer => (
              <div key={performer.employeeId} className="performer-card">
                <div className="performer-icon"><FaStar size={24} /></div>
                <h6 className="performer-name">{performer.name || 'Anonymous'}</h6>
                <p className="performer-dept">{performer.department || '—'}</p>
                <div className="performer-rating">{performer.rating?.toFixed(1) || '—'}</div>
                <small className={`performer-improvement ${performer.improvementPercent ? 'positive' : ''}`}>
                  {performer.improvementPercent ? (
                    <>
                      <FaArrowUp size={10} /> {formatImprovement(performer.improvementPercent)} improvement
                    </>
                  ) : (
                    '—'
                  )}
                </small>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Table */}
      <div className="performance-table-card">
        <div className="table-responsive">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Rating</th>
                <th>Goals</th>
                <th>Progress</th>
                <th>Improvement</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(performances) || performances.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
                    No performance reviews found. Click "Start Review Cycle" to add one.
                  </td>
                </tr>
              ) : (
                performances.map(perf => (
                  <tr key={perf.id || perf.employeeId} className="performance-row">
                    <td className="employee-name">{perf.name || 'Anonymous'}</td>
                    <td>{perf.department || '—'}</td>
                    <td>
                      <div className="rating-cell">
                        <FaStar size={14} className="star-icon" />
                        <span>{perf.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </td>
                    <td>{perf.achievedGoals || 0}/{perf.totalGoals || 0}</td>
                    <td>
                      <div className="progress-container">
                        <div className="progress-modern">
                          <div
                            className="progress-bar"
                            style={{ width: `${calculateProgress(perf.achievedGoals, perf.totalGoals)}%` }}
                          />
                        </div>
                        <span className="progress-percent">
                          {calculateProgress(perf.achievedGoals, perf.totalGoals)}%
                        </span>
                      </div>
                    </td>
                    <td className={perf.improvementPercent?.toString().includes('+') ? 'improvement-positive' : 'improvement-negative'}>
                      {formatImprovement(perf.improvementPercent) || '—'}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(perf.status)}>
                        {perf.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      
    </div>
  );
};

export default Performance;