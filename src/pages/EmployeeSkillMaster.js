import React, { useState } from 'react';
import { 
  FaSearch, FaUserTie, FaCode, FaStar, FaCalendarAlt, 
  FaEye, FaTimes, FaFilter, FaChartLine, FaAward, FaCheckCircle, FaClock,FaBuilding,FaBriefcase,
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const EmployeeSkillMaster = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Employee Data
  const EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' },
    { id: 6, name: 'Emily Wilson', code: 'EMP006', department: 'Marketing', designation: 'Marketing Manager' },
    { id: 7, name: 'Robert Taylor', code: 'EMP007', department: 'Operations', designation: 'Operations Manager' },
    { id: 8, name: 'Lisa Anderson', code: 'EMP008', department: 'IT', designation: 'Product Manager' },
    { id: 9, name: 'Amit Kumar', code: 'EMP009', department: 'IT', designation: 'Tech Lead' },
    { id: 10, name: 'Priya Singh', code: 'EMP010', department: 'HR', designation: 'HR Executive' }
  ];

  // Skills Data
  const SKILLS = [
    'React.js',
    'Node.js',
    'Python',
    'Java',
    'AWS',
    'Docker',
    'Kubernetes',
    'MongoDB',
    'PostgreSQL',
    'HTML/CSS',
    'JavaScript',
    'TypeScript',
    'Angular',
    'Vue.js',
    'HR Management',
    'Payroll Processing',
    'Recruitment',
    'Salesforce',
    'Digital Marketing',
    'SEO',
    'Google Analytics',
    'Financial Accounting',
    'Tally',
    'Operations Management'
  ];

  // Employee Skills Data
  const EMPLOYEE_SKILLS = {
    1: [ // John Doe
      { skill: 'React.js', proficiency: 'Expert', yearsOfExperience: 4, lastUsed: '2024-01-15', certified: true },
      { skill: 'Node.js', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-10', certified: true },
      { skill: 'MongoDB', proficiency: 'Intermediate', yearsOfExperience: 2, lastUsed: '2023-12-20', certified: false },
      { skill: 'JavaScript', proficiency: 'Expert', yearsOfExperience: 5, lastUsed: '2024-01-15', certified: true }
    ],
    2: [ // Jane Smith
      { skill: 'HR Management', proficiency: 'Expert', yearsOfExperience: 7, lastUsed: '2024-01-10', certified: true },
      { skill: 'Payroll Processing', proficiency: 'Advanced', yearsOfExperience: 5, lastUsed: '2024-01-05', certified: true },
      { skill: 'Recruitment', proficiency: 'Expert', yearsOfExperience: 6, lastUsed: '2024-01-12', certified: true }
    ],
    3: [ // Mike Johnson
      { skill: 'Python', proficiency: 'Expert', yearsOfExperience: 5, lastUsed: '2024-01-15', certified: true },
      { skill: 'AWS', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-10', certified: true },
      { skill: 'Docker', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-08', certified: false },
      { skill: 'Kubernetes', proficiency: 'Intermediate', yearsOfExperience: 2, lastUsed: '2023-12-15', certified: false }
    ],
    4: [ // Sarah Williams
      { skill: 'Salesforce', proficiency: 'Expert', yearsOfExperience: 8, lastUsed: '2024-01-14', certified: true },
      { skill: 'CRM', proficiency: 'Advanced', yearsOfExperience: 6, lastUsed: '2024-01-10', certified: true }
    ],
    5: [ // David Brown
      { skill: 'Financial Accounting', proficiency: 'Expert', yearsOfExperience: 6, lastUsed: '2024-01-15', certified: true },
      { skill: 'Tally', proficiency: 'Advanced', yearsOfExperience: 4, lastUsed: '2024-01-12', certified: true },
      { skill: 'Excel', proficiency: 'Expert', yearsOfExperience: 7, lastUsed: '2024-01-15', certified: true }
    ],
    6: [ // Emily Wilson
      { skill: 'Digital Marketing', proficiency: 'Expert', yearsOfExperience: 5, lastUsed: '2024-01-15', certified: true },
      { skill: 'SEO', proficiency: 'Advanced', yearsOfExperience: 4, lastUsed: '2024-01-10', certified: true },
      { skill: 'Google Analytics', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-08', certified: true }
    ],
    7: [ // Robert Taylor
      { skill: 'Operations Management', proficiency: 'Expert', yearsOfExperience: 8, lastUsed: '2024-01-15', certified: true },
      { skill: 'Supply Chain', proficiency: 'Advanced', yearsOfExperience: 5, lastUsed: '2024-01-10', certified: false }
    ],
    8: [ // Lisa Anderson
      { skill: 'Product Management', proficiency: 'Expert', yearsOfExperience: 6, lastUsed: '2024-01-15', certified: true },
      { skill: 'Agile', proficiency: 'Expert', yearsOfExperience: 5, lastUsed: '2024-01-12', certified: true },
      { skill: 'JIRA', proficiency: 'Advanced', yearsOfExperience: 4, lastUsed: '2024-01-10', certified: false }
    ],
    9: [ // Amit Kumar
      { skill: 'Java', proficiency: 'Expert', yearsOfExperience: 6, lastUsed: '2024-01-15', certified: true },
      { skill: 'Spring Boot', proficiency: 'Advanced', yearsOfExperience: 4, lastUsed: '2024-01-10', certified: true },
      { skill: 'Microservices', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-05', certified: false }
    ],
    10: [ // Priya Singh
      { skill: 'HR Management', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-15', certified: true },
      { skill: 'Recruitment', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-12', certified: true }
    ]
  };

  const handleSearch = () => {
    if (!selectedEmployee && !selectedSkill) {
      toast.warning('Select Filter', 'Please select either Employee or Skill');
      return;
    }
    
    let results = [];
    
    if (selectedEmployee) {
      const employee = EMPLOYEES.find(emp => emp.name === selectedEmployee);
      if (employee) {
        const skills = EMPLOYEE_SKILLS[employee.id] || [];
        results = [{
          ...employee,
          skills: skills
        }];
      }
    } else if (selectedSkill) {
      results = EMPLOYEES.filter(emp => {
        const skills = EMPLOYEE_SKILLS[emp.id] || [];
        return skills.some(s => s.skill === selectedSkill);
      }).map(emp => ({
        ...emp,
        skills: EMPLOYEE_SKILLS[emp.id] || []
      }));
    }
    
    setFilteredData(results);
    if (results.length === 0) {
      toast.info('No Results', 'No employees found for selected criteria');
    } else {
      toast.success('Success', `${results.length} record(s) found`);
    }
  };

  const handleReset = () => {
    setSelectedEmployee('');
    setSelectedSkill('');
    setFilteredData([]);
    setShowDetails(false);
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  const getProficiencyBadge = (proficiency) => {
    const styles = {
      Beginner: { bg: '#fef3c7', color: '#92400e' },
      Intermediate: { bg: '#cffafe', color: '#0e7490' },
      Advanced: { bg: '#ede9fe', color: '#6d28d9' },
      Expert: { bg: '#d1fae5', color: '#065f46' }
    };
    const style = styles[proficiency] || styles.Intermediate;
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 8px', fontSize: '11px' }}>{proficiency}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Employee Skill Master</h1>
          <p className="cert-subtitle">View employee skills and competencies</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="card border-0 shadow-sm mb-4">
       
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label fw-bold">Select Employee</label>
              <select 
                className="form-select" 
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  if (e.target.value) setSelectedSkill('');
                }}
                style={{ width: '100%' }}
              >
                <option value="">-- Select Employee --</option>
                {EMPLOYEES.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name} ({emp.code}) - {emp.designation}</option>
                ))}
              </select>
            </div>
            <div className="col-md-5">
              <label className="form-label fw-bold">Select Skill</label>
              <select 
                className="form-select" 
                value={selectedSkill}
                onChange={(e) => {
                  setSelectedSkill(e.target.value);
                  if (e.target.value) setSelectedEmployee('');
                }}
                style={{ width: '100%' }}
              >
                <option value="">-- Select Skill --</option>
                {SKILLS.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end gap-2">
              <button className="btn btn-primary" onClick={handleSearch} style={{ flex: 1 }}>
                Search
              </button>
              <button className="btn btn-outline-secondary" onClick={handleReset} style={{ flex: 1 }}>
           Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {filteredData.length > 0 && (
        <>
         
          {/* Results Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th style={{ width: 180 }}>Employee</th>
                    <th style={{ width: 120 }}>Department</th>
                    <th style={{ width: 150 }}>Designation</th>
                    <th style={{ width: 200 }}>Skills</th>
                    <th style={{ width: 80 }}>Total</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((emp, idx) => (
                    <tr key={emp.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <div className="fw-bold">{emp.name}</div>
                        <small className="text-muted">{emp.code}</small>
                      </td>
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {emp.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="badge" style={{ background: '#e0e7ff', color: '#4f46e5', padding: '2px 6px', fontSize: '10px' }}>
                              {skill.skill}
                            </span>
                          ))}
                          {emp.skills.length > 3 && (
                            <span className="badge" style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 6px', fontSize: '10px' }}>
                              +{emp.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '12px' }}>
                          {emp.skills.length}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="cert-act cert-act--edit" onClick={() => handleViewDetails(emp)} title="View Skills" style={{ background: '#e0e7ff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
                          <FaEye size={12} style={{ color: '#4f46e5' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      
      {/* Skill Details Modal */}
      {showDetails && selectedRecord && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header btn btn-primary text-white">
                <h5 className="modal-title">
                  <FaCode className="me-2" /> Skills Details - {selectedRecord.name}
                </h5>
                <button type="button" className="close text-white" onClick={() => setShowDetails(false)}>×</button>
              </div>
              <div className="modal-body">
                {/* Basic Info */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <FaUserTie size={24} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedRecord.name}</h6>
                      <small className="text-muted">{selectedRecord.code}</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <FaBuilding size={24} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedRecord.department}</h6>
                      <small className="text-muted">Department</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <FaBriefcase size={24} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedRecord.designation}</h6>
                      <small className="text-muted">Designation</small>
                    </div>
                  </div>
                </div>

                {/* Skills Table */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Skills & Competencies</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Skill</th>
                          <th>Proficiency</th>
                          <th>Years of Experience</th>
                          <th>Last Used</th>
                          <th>Certified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.skills.map((skill, idx) => (
                          <tr key={idx}>
                            <td><strong>{skill.skill}</strong></td>
                            <td>{getProficiencyBadge(skill.proficiency)}</td>
                            <td>{skill.yearsOfExperience} years</td>
                            <td>{formatDate(skill.lastUsed)}</td>
                            <td className="text-center">
                              {skill.certified ? (
                                <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                                  <FaCheckCircle className="me-1" size={10} /> Certified
                                </span>
                              ) : (
                                <span className="badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                  Not Certified
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetails(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSkillMaster;