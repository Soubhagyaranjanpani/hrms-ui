import React, { useState } from 'react';
import { FaUserPlus, FaBriefcase, FaMapMarkerAlt, FaClock, FaCheck, FaTimes, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Recruitment = ({ user }) => {
  const [candidates, setCandidates] = useState([
    { id: 1, name: 'John Smith', position: 'Senior Developer', stage: 'Applied', appliedDate: '2024-03-25', experience: '5 years', location: 'New York', email: 'john@email.com' },
    { id: 2, name: 'Sarah Johnson', position: 'HR Manager', stage: 'Screening', appliedDate: '2024-03-24', experience: '7 years', location: 'London', email: 'sarah@email.com' },
    { id: 3, name: 'Michael Chen', position: 'Sales Executive', stage: 'Interview', appliedDate: '2024-03-22', experience: '3 years', location: 'Singapore', email: 'michael@email.com' },
    { id: 4, name: 'Emily Davis', position: 'Marketing Lead', stage: 'Offer', appliedDate: '2024-03-20', experience: '6 years', location: 'New York', email: 'emily@email.com' },
    { id: 5, name: 'David Wilson', position: 'System Admin', stage: 'Hired', appliedDate: '2024-03-18', experience: '4 years', location: 'Dubai', email: 'david@email.com' },
  ]);

  const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

  const moveCandidate = (id, direction) => {
    const candidate = candidates.find(c => c.id === id);
    const currentIndex = stages.indexOf(candidate.stage);
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < stages.length) {
      setCandidates(candidates.map(c => 
        c.id === id ? { ...c, stage: stages[newIndex] } : c
      ));
      toast.success(`Candidate moved to ${stages[newIndex]}`);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      Applied: '#f39c12',
      Screening: '#3498db',
      Interview: '#9b59b6',
      Offer: '#2ecc71',
      Hired: '#2d9c7c'
    };
    return colors[stage] || '#95a5a6';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0">Recruitment Pipeline</h2>
        <button className="btn-gradient" onClick={() => toast.info('New job posting form')}>
          <FaUserPlus className="me-2" /> Post New Job
        </button>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Active Jobs</p>
                <h3 className="fw-bold mb-0">12</h3>
                <small>3 new this week</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(45,156,124,0.2)' }}>
                <FaBriefcase color="#2d9c7c" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Total Applicants</p>
                <h3 className="fw-bold mb-0">156</h3>
                <small>+24 this month</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.2)' }}>
                <FaUserPlus color="#3498db" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Interviews Scheduled</p>
                <h3 className="fw-bold mb-0">8</h3>
                <small>This week</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(243,156,18,0.2)' }}>
                <FaClock color="#f39c12" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Hired This Month</p>
                <h3 className="fw-bold mb-0">5</h3>
                <small>+2 vs last month</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.2)' }}>
                <FaCheck color="#2ecc71" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="row g-4">
        {stages.map(stage => (
          <div key={stage} className="col-md-2">
            <div className="card-modern p-3">
              <h6 className="mb-3 text-center" style={{ color: getStageColor(stage) }}>{stage}</h6>
              <div className="d-flex flex-column gap-2">
                {candidates.filter(c => c.stage === stage).map(candidate => (
                  <div key={candidate.id} className="p-3 rounded" style={{ background: 'rgba(10,25,31,0.5)', borderLeft: `3px solid ${getStageColor(stage)}` }}>
                    <div className="fw-semibold small">{candidate.name}</div>
                    <div className="text-gray small">{candidate.position}</div>
                    <div className="text-gray small mt-1">
                      <FaMapMarkerAlt className="me-1" size={10} />
                      {candidate.location}
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      {stage !== 'Applied' && (
                        <FaTimes 
                          size={12} 
                          style={{ color: '#e74c3c', cursor: 'pointer' }} 
                          onClick={() => moveCandidate(candidate.id, -1)}
                        />
                      )}
                      {stage !== 'Hired' && (
                        <FaArrowRight 
                          size={12} 
                          style={{ color: '#2d9c7c', cursor: 'pointer' }} 
                          onClick={() => moveCandidate(candidate.id, 1)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="card-modern p-4 mt-4">
        <h5 className="mb-3">Recent Applications</h5>
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Position</th>
                <th>Experience</th>
                <th>Location</th>
                <th>Applied Date</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {candidates.slice(0, 5).map(candidate => (
                <tr key={candidate.id}>
                  <td>
                    <div className="fw-semibold">{candidate.name}</div>
                    <small className="text-gray">{candidate.email}</small>
                  </td>
                  <td>{candidate.position}</td>
                  <td>{candidate.experience}</td>
                  <td>{candidate.location}</td>
                  <td>{candidate.appliedDate}</td>
                  <td>
                    <span style={{ color: getStageColor(candidate.stage) }}>
                      {candidate.stage}
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

export default Recruitment;