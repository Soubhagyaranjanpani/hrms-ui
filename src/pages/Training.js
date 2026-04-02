import React, { useState } from 'react';
import { FaGraduationCap, FaClock, FaUsers, FaPlay, FaCheckCircle } from 'react-icons/fa';

const Training = ({ user }) => {
  const [programs] = useState([
    { id: 1, name: 'Leadership Development', duration: '8 weeks', enrolled: 24, progress: 65, status: 'Active', startDate: '2024-04-01' },
    { id: 2, name: 'Technical Skills Bootcamp', duration: '12 weeks', enrolled: 42, progress: 40, status: 'Active', startDate: '2024-03-15' },
    { id: 3, name: 'Communication Skills', duration: '4 weeks', enrolled: 56, progress: 85, status: 'Active', startDate: '2024-03-20' },
    { id: 4, name: 'Project Management', duration: '6 weeks', enrolled: 31, progress: 25, status: 'Upcoming', startDate: '2024-04-15' },
    { id: 5, name: 'Data Analytics', duration: '10 weeks', enrolled: 38, progress: 55, status: 'Active', startDate: '2024-03-10' },
  ]);

  const completedCount = programs.filter(p => p.progress === 100).length;
  const totalEnrolled = programs.reduce((sum, p) => sum + p.enrolled, 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Training Programs</h2>
        <button className="btn-gradient" onClick={() => alert('New program')}>
          <FaGraduationCap className="me-2" /> Create Program
        </button>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Active Programs</p>
                <h3 className="fw-bold mb-0">{programs.filter(p => p.status === 'Active').length}</h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.2)' }}>
                <FaPlay color="#2ecc71" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Total Enrolled</p>
                <h3 className="fw-bold mb-0">{totalEnrolled}</h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.2)' }}>
                <FaUsers color="#3498db" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Completion Rate</p>
                <h3 className="fw-bold mb-0">76%</h3>
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
                <p className="text-gray mb-1">Hours Completed</p>
                <h3 className="fw-bold mb-0">1,284</h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(243,156,18,0.2)' }}>
                <FaClock color="#f39c12" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="row g-4">
        {programs.map(program => (
          <div key={program.id} className="col-md-6 col-lg-4">
            <div className="card-modern p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="mb-1">{program.name}</h6>
                  <small className="text-gray">
                    <FaClock className="me-1" size={12} />
                    {program.duration}
                  </small>
                </div>
                <div className={`badge ${program.status === 'Active' ? 'badge-success' : 'badge-info'}`}>
                  {program.status}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Progress</small>
                  <small>{program.progress}%</small>
                </div>
                <div className="progress-modern">
                  <div className="progress-bar" style={{ width: `${program.progress}%` }}></div>
                </div>
              </div>
              
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <small className="text-gray">Enrolled</small>
                  <div className="fw-semibold">{program.enrolled}</div>
                </div>
                <div>
                  <small className="text-gray">Start Date</small>
                  <div className="fw-semibold small">{program.startDate}</div>
                </div>
              </div>
              
              <button className="btn-outline-teal w-100">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Training;