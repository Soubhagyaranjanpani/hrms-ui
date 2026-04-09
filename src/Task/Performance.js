import React, { useState } from 'react';
import { FaStar, FaChartLine, FaUserCheck, FaTrophy, FaArrowUp, FaArrowDown, FaCheckCircle } from 'react-icons/fa';

const Performance = ({ user }) => {
  const [performances] = useState([
    { id: 1, name: 'Emma Watson', rating: 4.8, department: 'IT', improvement: '+12%', status: 'Excellent', goals: 5, achieved: 4 },
    { id: 2, name: 'Liam Brown', rating: 4.5, department: 'HR', improvement: '+8%', status: 'Great', goals: 4, achieved: 4 },
    { id: 3, name: 'Olivia Davis', rating: 4.2, department: 'Sales', improvement: '+15%', status: 'Good', goals: 6, achieved: 5 },
    { id: 4, name: 'Noah Wilson', rating: 3.8, department: 'IT', improvement: '+5%', status: 'Satisfactory', goals: 5, achieved: 4 },
    { id: 5, name: 'Ava Martinez', rating: 4.9, department: 'Marketing', improvement: '+20%', status: 'Outstanding', goals: 4, achieved: 4 },
  ]);

  const topPerformers = [...performances].sort((a, b) => b.rating - a.rating).slice(0, 3);

  // Helper to get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Outstanding':
        return 'badge-success';
      case 'Excellent':
        return 'badge-success';
      case 'Great':
        return 'badge-info';
      case 'Good':
        return 'badge-info';
      default:
        return 'badge-warning';
    }
  };

  return (
    <div className="performance-root">
      {/* Header */}
      <div className="performance-header">
        <div>
          <h1 className="performance-title">Performance Reviews</h1>
          <p className="performance-subtitle">Track and manage employee performance metrics</p>
        </div>
        {/* <button className="performance-add-btn" onClick={() => alert('Start review cycle')}>
          <FaUserCheck size={13} /> Start Review Cycle
        </button> */}
      </div>

      {/* Stats Cards */}
      <div className="performance-stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Avg Rating</p>
              <h3 className="stat-value">4.3</h3>
              <small className="stat-trend positive">
                <FaArrowUp size={10} /> +0.3 vs last quarter
              </small>
            </div>
            <div className="stat-icon icon-indigo">
              <FaStar />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Completed Reviews</p>
              <h3 className="stat-value">124</h3>
              <small className="stat-trend">This quarter</small>
            </div>
            <div className="stat-icon icon-coral">
              <FaChartLine />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Goal Achievement</p>
              <h3 className="stat-value">87%</h3>
              <small className="stat-trend positive">
                <FaArrowUp size={10} /> +5%
              </small>
            </div>
            <div className="stat-icon icon-teal">
              <FaCheckCircle />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Outstanding</p>
              <h3 className="stat-value">23</h3>
              <small className="stat-trend">Employees with 4.5+</small>
            </div>
            <div className="stat-icon icon-amber">
              <FaTrophy />
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers Section */}
      <div className="performance-top-performers">
        <div className="top-performers-header">
          <h3>🏆 Top Performers</h3>
        </div>
        <div className="top-performers-grid">
          {topPerformers.map(performer => (
            <div key={performer.id} className="performer-card">
              <div className="performer-icon">
                <FaStar size={24} />
              </div>
              <h6 className="performer-name">{performer.name}</h6>
              <p className="performer-dept">{performer.department}</p>
              <div className="performer-rating">{performer.rating}</div>
              <small className="performer-improvement positive">
                <FaArrowUp size={10} /> {performer.improvement} improvement
              </small>
            </div>
          ))}
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
              {performances.map(perf => (
                <tr key={perf.id} className="performance-row">
                  <td className="employee-name">{perf.name}</td>
                  <td>{perf.department}</td>
                  <td>
                    <div className="rating-cell">
                      <FaStar size={14} className="star-icon" />
                      <span>{perf.rating}</span>
                    </div>
                  </td>
                  <td>{perf.achieved}/{perf.goals}</td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-modern">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${(perf.achieved / perf.goals) * 100}%` }}
                        ></div>
                      </div>
                      <span className="progress-percent">
                        {Math.round((perf.achieved / perf.goals) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className={perf.improvement.includes('+') ? 'improvement-positive' : 'improvement-negative'}>
                    {perf.improvement}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(perf.status)}>
                      {perf.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .performance-root {
          padding: 0;
        }

        /* Header */
        .performance-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .performance-title {
          font-family: 'Sora', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .performance-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin: 4px 0 0;
        }

        .performance-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: linear-gradient(135deg, var(--accent-indigo), var(--accent-indigo-light));
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
          transition: all 0.25s;
        }

        .performance-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
        }

        /* Stats Grid */
        .performance-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: var(--spacing-lg);
        }

        .stat-card {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.04);
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(99, 102, 241, 0.1);
        }

        .stat-card-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .stat-trend {
          font-size: 11px;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .stat-trend.positive {
          color: var(--success);
        }

        .stat-trend.negative {
          color: var(--danger);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .icon-indigo {
          background: #ede9fe;
          color: var(--accent-indigo);
        }

        .icon-coral {
          background: #fff0e8;
          color: var(--accent-coral);
        }

        .icon-teal {
          background: #d1fae5;
          color: var(--accent-teal);
        }

        .icon-amber {
          background: #fef3c7;
          color: var(--accent-amber);
        }

        /* Top Performers */
        .performance-top-performers {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          margin-bottom: var(--spacing-lg);
          overflow: hidden;
        }

        .top-performers-header {
          padding: 15px 20px;
          border-bottom: 1px solid var(--border-light);
          background: var(--bg-surface);
        }

        .top-performers-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
        }

        .top-performers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 20px;
        }

        .performer-card {
          text-align: center;
          padding: 20px;
          border-radius: 16px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          transition: all 0.3s ease;
        }

        .performer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        .performer-icon {
          margin-bottom: 12px;
          color: var(--accent-amber);
        }

        .performer-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .performer-dept {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .performer-rating {
          font-size: 28px;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
          color: var(--accent-teal);
          margin-bottom: 6px;
        }

        .performer-improvement {
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .performer-improvement.positive {
          color: var(--success);
        }

        /* Table */
        .performance-table-card {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          overflow: hidden;
        }

        .performance-table {
          width: 100%;
          border-collapse: collapse;
        }

        .performance-table thead tr {
          background: var(--bg-surface);
          border-bottom: 1.5px solid var(--accent-indigo-pale);
        }

        .performance-table th {
          padding: 14px 18px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: var(--accent-indigo);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .performance-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #f0f2f9;
          font-size: 13px;
          color: var(--text-secondary);
          vertical-align: middle;
        }

        .performance-row:hover td {
          background: #fafbff;
        }

        .employee-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .rating-cell {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fef3c7;
          padding: 4px 10px;
          border-radius: 20px;
          color: #92400e;
          font-weight: 600;
        }

        .star-icon {
          color: var(--accent-amber);
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .progress-modern {
          flex: 1;
          background: #e8eaf6;
          border-radius: 10px;
          height: 6px;
          overflow: hidden;
        }

        .progress-modern .progress-bar {
          background: linear-gradient(90deg, var(--accent-indigo), var(--accent-indigo-light));
          border-radius: 10px;
          transition: width 0.6s ease;
          height: 100%;
        }

        .progress-percent {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          min-width: 35px;
        }

        .improvement-positive {
          color: var(--success);
          font-weight: 600;
        }

        .improvement-negative {
          color: var(--danger);
          font-weight: 600;
        }

        /* Badges */
        .badge-success {
          background: #d1fae5;
          color: #065f46;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .badge-info {
          background: #ede9fe;
          color: #4c1d95;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .badge-warning {
          background: #fef3c7;
          color: #92400e;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .performance-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .performance-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .performance-add-btn {
            width: 100%;
            justify-content: center;
          }

          .top-performers-grid {
            grid-template-columns: 1fr;
          }

          .performance-stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .performance-table {
            min-width: 680px;
          }
        }
      `}</style>
    </div>
  );
};

export default Performance;