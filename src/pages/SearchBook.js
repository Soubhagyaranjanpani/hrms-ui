
import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, 
  FaBook, FaEye, FaDownload, FaPrint, FaFilter, FaTimes,
  FaCheckCircle, FaClock, FaUserCheck, FaFileAlt, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookSearch = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dummy employee data for service book
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer', status: 'Active', joiningDate: '2020-01-15', retirementDate: null, serviceBookNumber: 'SB/2020/0001', totalYears: 4.5, promotions: 2, trainings: 3, awards: 1 },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager', status: 'Active', joiningDate: '2019-06-10', retirementDate: null, serviceBookNumber: 'SB/2019/0023', totalYears: 5.8, promotions: 1, trainings: 4, awards: 2 },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer', status: 'Active', joiningDate: '2021-03-20', retirementDate: null, serviceBookNumber: 'SB/2021/0045', totalYears: 3.2, promotions: 1, trainings: 5, awards: 0 },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager', status: 'Retired', joiningDate: '2010-08-01', retirementDate: '2024-03-31', serviceBookNumber: 'SB/2010/0089', totalYears: 13.7, promotions: 3, trainings: 6, awards: 3 },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant', status: 'Terminated', joiningDate: '2022-01-10', retirementDate: null, serviceBookNumber: 'SB/2022/0123', totalYears: 1.5, promotions: 0, trainings: 2, awards: 0 },
    { id: 6, name: 'Emily Wilson', code: 'EMP006', department: 'Marketing', designation: 'Marketing Manager', status: 'Active', joiningDate: '2018-09-15', retirementDate: null, serviceBookNumber: 'SB/2018/0156', totalYears: 5.8, promotions: 2, trainings: 4, awards: 2 },
    { id: 7, name: 'Robert Taylor', code: 'EMP007', department: 'Operations', designation: 'Operations Manager', status: 'Active', joiningDate: '2017-03-10', retirementDate: null, serviceBookNumber: 'SB/2017/0234', totalYears: 7.3, promotions: 2, trainings: 5, awards: 1 },
    { id: 8, name: 'Lisa Anderson', code: 'EMP008', department: 'IT', designation: 'Product Manager', status: 'Active', joiningDate: '2019-11-20', retirementDate: null, serviceBookNumber: 'SB/2019/0345', totalYears: 4.7, promotions: 1, trainings: 6, awards: 3 }
  ];

  // Dummy service book details
  const getServiceBookDetails = (employee) => {
    return {
      appointments: [{ date: employee.joiningDate, type: 'Appointment' }],
      promotions: employee.promotions > 0 ? [
        { date: '2021-03-01', from: 'Software Engineer', to: 'Senior Software Engineer' },
        { date: '2023-01-15', from: 'Senior Software Engineer', to: 'Tech Lead' }
      ] : [],
      transfers: [],
      trainings: employee.trainings > 0 ? [
        { date: '2021-08-10', name: 'Leadership Program' },
        { date: '2023-02-15', name: 'Cloud Architecture' }
      ] : [],
      awards: employee.awards > 0 ? [
        { date: '2022-01-20', name: 'Star Performer' }
      ] : []
    };
  };

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || 
           emp.code.toLowerCase().includes(search);
  });

  const handleEmployeeSelect = (employee) => {
    const serviceBookData = getServiceBookDetails(employee);
    setSelectedEmployee({ ...employee, serviceBookData });
    setSearchTerm('');
    setShowEmployeeSearch(false);
    toast.success('Employee Selected', `Showing service book for ${employee.name}`);
  };

  const handleClear = () => {
    setSelectedEmployee(null);
    setSearchTerm('');
  };

  const handleViewDetails = () => {
    setShowDetailModal(true);
  };

  const handleDownloadServiceBook = () => {
    toast.success('Download Started', `Downloading service book for ${selectedEmployee?.name}`);
  };

  const handlePrintServiceBook = () => {
    toast.info('Print', `Printing service book for ${selectedEmployee?.name}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      Active: { bg: '#d1fae5', color: '#065f46' },
      Retired: { bg: '#fed7aa', color: '#9a3412' },
      Terminated: { bg: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || styles.Active;
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 8px' }}>{status}</span>;
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaBook className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Service Book Search</h5>
          <p className="text-muted mb-0 small">Search and retrieve employee service records</p>
        </div>
      </div>

      {/* Search Employee Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold"> Select Employee</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-12">
              <div className="position-relative">
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaSearch size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or code..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowEmployeeSearch(true);
                    }}
                    onFocus={() => setShowEmployeeSearch(true)}
                  />
                  {selectedEmployee && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={handleClear}
                    >
                 Cancel
                    </button>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showEmployeeSearch && searchTerm && (
                  <div className="card position-absolute top-100 start-0 end-0 mt-1 shadow-lg" style={{ zIndex: 1000, maxHeight: '300px', overflow: 'auto' }}>
                    <div className="card-body p-2">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(emp => (
                          <div
                            key={emp.id}
                            className="d-flex justify-content-between align-items-center p-2 rounded cursor-pointer hover-bg-light"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleEmployeeSelect(emp)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div>
                              <div className="fw-bold">{emp.name}</div>
                              <small className="text-muted">Code: {emp.code} | Dept: {emp.department}</small>
                            </div>
                            <div>
                              <span className="badge bg-light text-dark">{emp.designation}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-3 text-muted">
                          <small>No employees found</small>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <small className="text-muted">Select an employee to view service book records</small>
            </div>
          </div>
          {selectedEmployee && (
            <div className="alert alert-success mt-3 mb-0 py-2">
              <FaUserTie className="me-2" /> <strong>Selected Employee:</strong> {selectedEmployee.name} ({selectedEmployee.code})
            </div>
          )}
        </div>
      </div>

      {/* Employee Service Book Details - Shows when employee is selected */}
      {selectedEmployee && (
        <>
          {/* Quick Stats */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card bg-primary bg-opacity-10 border-0">
                <div className="card-body text-center">
                  <FaChartLine size={24} className="text-primary mb-2" />
                  <h5 className="mb-0">{selectedEmployee.promotions}</h5>
                  <small className="text-muted">Promotions</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success bg-opacity-10 border-0">
                <div className="card-body text-center">
                  <FaChalkboardTeacher size={24} className="text-success mb-2" />
                  <h5 className="mb-0">{selectedEmployee.trainings}</h5>
                  <small className="text-muted">Trainings</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning bg-opacity-10 border-0">
                <div className="card-body text-center">
                  <FaTrophy size={24} className="text-warning mb-2" />
                  <h5 className="mb-0">{selectedEmployee.awards}</h5>
                  <small className="text-muted">Awards</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info bg-opacity-10 border-0">
                <div className="card-body text-center">
                  <FaClock size={24} className="text-info mb-2" />
                  <h5 className="mb-0">{selectedEmployee.totalYears} yrs</h5>
                  <small className="text-muted">Total Service</small>
                </div>
              </div>
            </div>
          </div>

          {/* Service Book Details Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">
                <FaBook className="me-2 text-primary" /> Service Book Details - {selectedEmployee.name}
              </h6>
              <div>
                <button 
                  className="btn btn-sm btn-outline-success me-1" 
                  onClick={handleDownloadServiceBook}
                >
                  <FaDownload className="me-1" size={12} /> Download
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={handlePrintServiceBook}
                >
                  <FaPrint className="me-1" size={12} /> Print
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Employee Information Table */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <td className="bg-light fw-bold" style={{ width: '30%' }}>Employee Name</td>
                      <td>{selectedEmployee.name}</td>
                      <td className="bg-light fw-bold" style={{ width: '30%' }}>Employee Code</td>
                      <td>{selectedEmployee.code}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Department</td>
                      <td>{selectedEmployee.department}</td>
                      <td className="bg-light fw-bold">Designation</td>
                      <td>{selectedEmployee.designation}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Service Book Number</td>
                      <td>{selectedEmployee.serviceBookNumber}</td>
                      <td className="bg-light fw-bold">Status</td>
                      <td>{getStatusBadge(selectedEmployee.status)}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Joining Date</td>
                      <td>{formatDate(selectedEmployee.joiningDate)}</td>
                      <td className="bg-light fw-bold">Retirement Date</td>
                      <td>{selectedEmployee.retirementDate ? formatDate(selectedEmployee.retirementDate) : '—'}</td>
                    </tr>
                    <tr>
                      <td className="bg-light fw-bold">Total Service</td>
                      <td colSpan="3">{selectedEmployee.totalYears} years</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Career Timeline */}
              <h6 className="fw-bold mb-3"><FaClock className="me-2" /> Career Timeline</h6>
              <div className="position-relative" style={{ paddingLeft: '30px' }}>
                <div className="position-absolute" style={{ left: '15px', top: '0', bottom: '0', width: '2px', background: '#e5e7eb' }}></div>
                
                {/* Appointment */}
                <div className="position-relative mb-3">
                  <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#4f46e5' }}></div>
                  <div className="d-flex align-items-center gap-2">
                    <FaUserCheck className="text-primary" />
                    <strong>Appointment</strong>
                    <span className="text-muted small">{formatDate(selectedEmployee.joiningDate)}</span>
                  </div>
                  <div className="text-muted small mt-1">Appointed as {selectedEmployee.designation} in {selectedEmployee.department}</div>
                </div>
                
                {/* Promotions */}
                {selectedEmployee.promotions > 0 && (
                  <div className="position-relative mb-3">
                    <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#f59e0b' }}></div>
                    <div className="d-flex align-items-center gap-2">
                      <FaChartLine className="text-warning" />
                      <strong>Promotion</strong>
                      <span className="text-muted small">Mar 2021</span>
                    </div>
                    <div className="text-muted small mt-1">Promoted to Senior {selectedEmployee.designation}</div>
                  </div>
                )}
                
                {/* Trainings */}
                {selectedEmployee.trainings > 0 && (
                  <div className="position-relative mb-3">
                    <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#8b5cf6' }}></div>
                    <div className="d-flex align-items-center gap-2">
                      <FaChalkboardTeacher className="text-purple" />
                      <strong>Training</strong>
                      <span className="text-muted small">Aug 2021</span>
                    </div>
                    <div className="text-muted small mt-1">Completed Leadership Program</div>
                  </div>
                )}
                
                {/* Awards */}
                {selectedEmployee.awards > 0 && (
                  <div className="position-relative mb-3">
                    <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#ef4444' }}></div>
                    <div className="d-flex align-items-center gap-2">
                      <FaTrophy className="text-danger" />
                      <strong>Award</strong>
                      <span className="text-muted small">Jan 2022</span>
                    </div>
                    <div className="text-muted small mt-1">Received Star Performer Award</div>
                  </div>
                )}
                
                {/* Retirement */}
                {selectedEmployee.retirementDate && (
                  <div className="position-relative mb-3">
                    <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#64748b' }}></div>
                    <div className="d-flex align-items-center gap-2">
                      <FaClock className="text-secondary" />
                      <strong>Retirement</strong>
                      <span className="text-muted small">{formatDate(selectedEmployee.retirementDate)}</span>
                    </div>
                    <div className="text-muted small mt-1">Retired from service</div>
                  </div>
                )}
              </div>

              <div className="mt-4 text-end">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleViewDetails}
                >
                  <FaEye className="me-1" size={12} /> View Complete Service Book
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    
      {/* Service Book Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header btn btn-primary text-white">
                <h5 className="modal-title text-white">
              <FaFileAlt className="mr-2" />    Complete Service Book - {selectedEmployee.name}
                </h5>
               
              </div>
              <div className="modal-body">
                {/* Employee Summary Cards */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="text-center p-3 bg-light rounded">
                      <FaUserTie size={28} className="text-#831843 mb-2" />
                      <h6 className="mb-0">{selectedEmployee.name}</h6>
                      <small className="text-muted">{selectedEmployee.code}</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 bg-light rounded">
                      <FaBuilding size={28} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedEmployee.department}</h6>
                      <small className="text-muted">Department</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 bg-light rounded">
                      <FaBriefcase size={28} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedEmployee.designation}</h6>
                      <small className="text-muted">Designation</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 bg-light rounded">
                      <FaCalendarAlt size={28} className="text-primary mb-2" />
                      <h6 className="mb-0">{formatDate(selectedEmployee.joiningDate)}</h6>
                      <small className="text-muted">Joining Date</small>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="text-center p-2 bg-success bg-opacity-10 rounded">
                      <FaChartLine size={20} className="text-success" />
                      <h5 className="mb-0 mt-1">{selectedEmployee.promotions}</h5>
                      <small>Promotions</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-2 bg-info bg-opacity-10 rounded">
                      <FaChalkboardTeacher size={20} className="text-info" />
                      <h5 className="mb-0 mt-1">{selectedEmployee.trainings}</h5>
                      <small>Trainings</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-2 bg-warning bg-opacity-10 rounded">
                      <FaTrophy size={20} className="text-warning" />
                      <h5 className="mb-0 mt-1">{selectedEmployee.awards}</h5>
                      <small>Awards</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-2 bg-secondary bg-opacity-10 rounded">
                      <FaClock size={20} className="text-secondary" />
                      <h5 className="mb-0 mt-1">{selectedEmployee.totalYears} yrs</h5>
                      <small>Total Service</small>
                    </div>
                  </div>
                </div>

                {/* Complete Details Table */}
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Employee Information</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered mb-0">
                      <tbody>
                        <tr>
                          <td className="bg-light fw-bold" style={{ width: '30%' }}>Employee Name</td>
                          <td>{selectedEmployee.name}</td>
                          <td className="bg-light fw-bold" style={{ width: '30%' }}>Employee Code</td>
                          <td>{selectedEmployee.code}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Department</td>
                          <td>{selectedEmployee.department}</td>
                          <td className="bg-light fw-bold">Designation</td>
                          <td>{selectedEmployee.designation}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Service Book Number</td>
                          <td>{selectedEmployee.serviceBookNumber}</td>
                          <td className="bg-light fw-bold">Status</td>
                          <td>{getStatusBadge(selectedEmployee.status)}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Joining Date</td>
                          <td>{formatDate(selectedEmployee.joiningDate)}</td>
                          <td className="bg-light fw-bold">Retirement Date</td>
                          <td>{selectedEmployee.retirementDate ? formatDate(selectedEmployee.retirementDate) : '—'}</td>
                        </tr>
                        <tr>
                          <td className="bg-light fw-bold">Total Service</td>
                          <td colSpan="3">{selectedEmployee.totalYears} years</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Career Timeline */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Career Timeline</h6>
                  </div>
                  <div className="card-body">
                    <div className="position-relative" style={{ paddingLeft: '30px' }}>
                      <div className="position-absolute" style={{ left: '15px', top: '0', bottom: '0', width: '2px', background: '#e5e7eb' }}></div>
                      
                      <div className="position-relative mb-3">
                        <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#4f46e5' }}></div>
                        <div><strong>Appointment</strong> <span className="text-muted small">({formatDate(selectedEmployee.joiningDate)})</span></div>
                        <div className="text-muted small">Appointed as {selectedEmployee.designation} in {selectedEmployee.department}</div>
                      </div>
                      
                      {selectedEmployee.promotions > 0 && (
                        <div className="position-relative mb-3">
                          <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#f59e0b' }}></div>
                          <div><strong>Promotion</strong> <span className="text-muted small">(Mar 2021)</span></div>
                          <div className="text-muted small">Promoted to Senior {selectedEmployee.designation}</div>
                        </div>
                      )}
                      
                      {selectedEmployee.trainings > 0 && (
                        <div className="position-relative mb-3">
                          <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#8b5cf6' }}></div>
                          <div><strong>Training</strong> <span className="text-muted small">(Aug 2021)</span></div>
                          <div className="text-muted small">Completed Leadership Program</div>
                        </div>
                      )}
                      
                      {selectedEmployee.awards > 0 && (
                        <div className="position-relative mb-3">
                          <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#ef4444' }}></div>
                          <div><strong>Award</strong> <span className="text-muted small">(Jan 2022)</span></div>
                          <div className="text-muted small">Received Star Performer Award</div>
                        </div>
                      )}
                      
                      {selectedEmployee.retirementDate && (
                        <div className="position-relative mb-3">
                          <div className="position-absolute rounded-circle" style={{ left: '-22px', top: '5px', width: '12px', height: '12px', backgroundColor: '#64748b' }}></div>
                          <div><strong>Retirement</strong> <span className="text-muted small">({formatDate(selectedEmployee.retirementDate)})</span></div>
                          <div className="text-muted small">Retired from service</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                <button className="btn btn-success" onClick={handleDownloadServiceBook}>
                  <FaDownload className="me-1" /> Download Service Book
                </button>
                <button className="btn btn-primary" onClick={handlePrintServiceBook}>
                  <FaPrint className="me-1" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookSearch;