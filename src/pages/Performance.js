import React, { useState } from 'react';
import { FaStar, FaChartLine, FaUserCheck, FaTrophy, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const Performance = ({ user }) => {
  const [performances] = useState([
    { id: 1, name: 'Emma Watson', rating: 4.8, department: 'IT', improvement: '+12%', status: 'Excellent', goals: 5, achieved: 4 },
    { id: 2, name: 'Liam Brown', rating: 4.5, department: 'HR', improvement: '+8%', status: 'Great', goals: 4, achieved: 4 },
    { id: 3, name: 'Olivia Davis', rating: 4.2, department: 'Sales', improvement: '+15%', status: 'Good', goals: 6, achieved: 5 },
    { id: 4, name: 'Noah Wilson', rating: 3.8, department: 'IT', improvement: '+5%', status: 'Satisfactory', goals: 5, achieved: 4 },
    { id: 5, name: 'Ava Martinez', rating: 4.9, department: 'Marketing', improvement: '+20%', status: 'Outstanding', goals: 4, achieved: 4 },
  ]);

  const topPerformers = [...performances].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Performance Reviews</h2>
        <button className="btn-gradient" onClick={() => alert('Start review')}>
          <FaUserCheck className="me-2" /> Start Review Cycle
        </button>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Avg Rating</p>
                <h3 className="fw-bold mb-0">4.3</h3>
                <small className="text-success">+0.3 vs last quarter</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.2)' }}>
                <FaStar color="#f4b942" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Completed Reviews</p>
                <h3 className="fw-bold mb-0">124</h3>
                <small>This quarter</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.2)' }}>
                <FaChartLine color="#3498db" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Goal Achievement</p>
                <h3 className="fw-bold mb-0">87%</h3>
                <small className="text-success">+5%</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(45,156,124,0.2)' }}>
                <FaCheckCircle color="#2d9c7c" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Outstanding</p>
                <h3 className="fw-bold mb-0">23</h3>
                <small>Employees with 4.5+</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(243,156,18,0.2)' }}>
                <FaTrophy color="#f4b942" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card-modern p-4 mb-4">
        <h5 className="mb-3">🏆 Top Performers</h5>
        <div className="row">
          {topPerformers.map(performer => (
            <div key={performer.id} className="col-md-4">
              <div className="text-center p-3 rounded" style={{ background: 'rgba(45,156,124,0.1)' }}>
                <div className="mb-2">
                  <FaStar color="#f4b942" size={24} />
                </div>
                <h6 className="mb-1">{performer.name}</h6>
                <p className="text-gray small mb-2">{performer.department}</p>
                <div className="display-6 fw-bold text-teal">{performer.rating}</div>
                <small className="text-success">{performer.improvement} improvement</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Table */}
      <div className="card-modern overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom">
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
                <tr key={perf.id}>
                  <td className="fw-semibold">{perf.name}</td>
                  <td>{perf.department}</td>
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      <FaStar color="#f4b942" size={14} />
                      <span>{perf.rating}</span>
                    </div>
                  </td>
                  <td>{perf.achieved}/{perf.goals}</td>
                  <td>
                    <div className="progress-modern" style={{ width: '100px' }}>
                      <div className="progress-bar" style={{ width: `${(perf.achieved / perf.goals) * 100}%` }}></div>
                    </div>
                  </td>
                  <td className={perf.improvement.includes('+') ? 'text-success' : 'text-danger'}>
                    {perf.improvement}
                  </td>
                  <td>
                    <span className={perf.status === 'Outstanding' ? 'badge-success' : 'badge-info'}>
                      {perf.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;