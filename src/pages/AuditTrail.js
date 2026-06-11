import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaUserTie, FaBuilding, FaCalendarAlt, 
  FaBook, FaEye, FaDownload, FaFilter, FaTimes,
  FaPlus, FaEdit, FaCheckCircle, FaUpload, FaEye as FaView,
  FaClock, FaFileAlt, FaUserCheck, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AuditTrail = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [eventFilter, setEventFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dummy employee data
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  // Dummy audit log data
  const getAuditLogs = (employee) => {
    if (!employee) return [];
    
    return [
      {
        id: 1,
        eventType: 'Create',
        eventIcon: <FaPlus style={{ color: '#10b981' }} />,
        eventColor: '#10b981',
        eventBg: '#d1fae5',
        description: `Service book created for ${employee.name}`,
        timestamp: '2024-01-15 09:30:00',
        ipAddress: '192.168.1.101',
        userAgent: 'Chrome/120.0.0.0',
        userName: 'HR Admin',
        details: {
          serviceBookNumber: 'SB/2024/0001',
          joiningDate: '2024-01-15',
          designation: employee.designation
        }
      },
      {
        id: 2,
        eventType: 'Upload',
        eventIcon: <FaUpload style={{ color: '#8b5cf6' }} />,
        eventColor: '#8b5cf6',
        eventBg: '#ede9fe',
        description: `Appointment order document uploaded`,
        timestamp: '2024-01-15 10:15:22',
        ipAddress: '192.168.1.101',
        userAgent: 'Chrome/120.0.0.0',
        userName: 'HR Admin',
        details: {
          documentName: 'Appointment_Order.pdf',
          documentSize: '1.2 MB',
          category: 'Appointment Orders'
        }
      },
      {
        id: 3,
        eventType: 'Update',
        eventIcon: <FaEdit style={{ color: '#f59e0b' }} />,
        eventColor: '#f59e0b',
        eventBg: '#fed7aa',
        description: `Employee designation updated from ${employee.designation} to Senior ${employee.designation}`,
        timestamp: '2024-03-01 14:20:35',
        ipAddress: '192.168.1.105',
        userAgent: 'Chrome/120.0.0.0',
        userName: 'HR Manager',
        details: {
          fieldChanged: 'designation',
          oldValue: employee.designation,
          newValue: `Senior ${employee.designation}`
        }
      },
      {
        id: 4,
        eventType: 'Approval',
        eventIcon: <FaCheckCircle style={{ color: '#10b981' }} />,
        eventColor: '#10b981',
        eventBg: '#d1fae5',
        description: `Promotion request approved by HR Director`,
        timestamp: '2024-03-05 11:45:00',
        ipAddress: '192.168.1.110',
        userAgent: 'Chrome/120.0.0.0',
        userName: 'HR Director',
        details: {
          approvalType: 'Promotion',
          approvedBy: 'HR Director',
          remarks: 'Performance based promotion'
        }
      },
      {
        id: 5,
        eventType: 'View',
        eventIcon: <FaView style={{ color: '#06b6d4' }} />,
        eventColor: '#06b6d4',
        eventBg: '#cffafe',
        description: `Service book viewed by Manager`,
        timestamp: '2024-03-10 09:15:30',
        ipAddress: '192.168.1.115',
        userAgent: 'Chrome/120.0.0.0',
        userName: 'Department Head',
        details: {
          viewedFrom: 'Employee Management Module',
          viewDuration: '5 minutes'
        }
      },
      {
        id: 6,
        eventType: 'Download',
        eventIcon: <FaDownload style={{ color: '#ec489a' }} />,
        eventColor: '#ec489a',
        eventBg: '#fce7f3',
        description: `Service book PDF downloaded`,
        timestamp: '2024-03-12 16:30:45',
        ipAddress: '192.168.1.120',
        userAgent: 'Chrome/120.0.0.0',
        userName: 'HR Executive',
        details: {
          downloadFormat: 'PDF',
          fileSize: '2.5 MB'
        }
      },
      {
        id: 7,
        eventType: 'Upload',
        eventIcon: <FaUpload style={{ color: '#8b5cf6' }} />,
        eventColor: '#8b5cf6',
        eventBg: '#ede9fe',
        description: `Promotion order document uploaded`,
        timestamp: '2024-03-05 12:00:00',
        ipAddress: '192.168.1.105',
        userAgent: 'Chrome/120.0.0.0',
        userName: 'HR Manager',
        details: {
          documentName: 'Promotion_Order.pdf',
          documentSize: '856 KB',
          category: 'Promotion Orders'
        }
      },
      {
        id: 8,
        eventType: 'Update',
        eventIcon: <FaEdit style={{ color: '#f59e0b' }} />,
        eventColor: '#f59e0b',
        eventBg: '#fed7aa',
        description: `Salary revised from ₹50,000 to ₹60,000`,
        timestamp: '2024-04-01 10:00:00',
        ipAddress: '192.168.1.125',
        userAgent: 'Chrome/120.0.0.0',
        userName: 'Payroll Manager',
        details: {
          fieldChanged: 'salary',
          oldValue: '₹50,000',
          newValue: '₹60,000'
        }
      }
    ];
  };

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || 
           emp.code.toLowerCase().includes(search);
  });

  const eventTypes = [
    { value: 'all', label: 'All Events', icon: <FaClock /> },
    { value: 'Create', label: 'Create', icon: <FaPlus /> },
    { value: 'Update', label: 'Update', icon: <FaEdit /> },
    { value: 'Approval', label: 'Approval', icon: <FaCheckCircle /> },
    { value: 'Upload', label: 'Document Upload', icon: <FaUpload /> },
    { value: 'Download', label: 'Download', icon: <FaDownload /> },
    { value: 'View', label: 'View', icon: <FaView /> }
  ];

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    const logs = getAuditLogs(employee);
    setAuditLogs(logs);
    setFilteredLogs(logs);
    setSearchTerm('');
    setShowEmployeeSearch(false);
    toast.success('Employee Selected', `Showing audit trail for ${employee.name}`);
  };

  const handleClear = () => {
    setSelectedEmployee(null);
    setAuditLogs([]);
    setFilteredLogs([]);
    setSearchTerm('');
    setEventFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];
    
    // Filter by event type
    if (eventFilter !== 'all') {
      filtered = filtered.filter(log => log.eventType === eventFilter);
    }
    
    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(log => log.timestamp.split(' ')[0] >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(log => log.timestamp.split(' ')[0] <= dateTo);
    }
    
    setFilteredLogs(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [eventFilter, dateFrom, dateTo, auditLogs]);

  const formatDateTime = (timestamp) => {
    const [date, time] = timestamp.split(' ');
    const formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return { date: formattedDate, time };
  };

  const getEventBadge = (eventType) => {
    const styles = {
      Create: { bg: '#d1fae5', color: '#065f46' },
      Update: { bg: '#fed7aa', color: '#9a3412' },
      Approval: { bg: '#d1fae5', color: '#065f46' },
      Upload: { bg: '#ede9fe', color: '#6d28d9' },
      Download: { bg: '#fce7f3', color: '#be185d' },
      View: { bg: '#cffafe', color: '#0e7490' }
    };
    const style = styles[eventType] || styles.View;
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '6px 12px' }}>{eventType}</span>;
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaBook className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Service Book Audit Trail</h5>
          <p className="text-muted mb-0 small">Track all service book changes and activities for compliance</p>
        </div>
      </div>

      {/* Select Employee Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold">Select Employee</h6>
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
              <small className="text-muted">Select an employee to view service book audit trail</small>
            </div>
          </div>
          {selectedEmployee && (
            <div className="alert alert-info mt-3 mb-0 py-2">
              <FaUserTie className="me-2" /> <strong>Selected Employee:</strong> {selectedEmployee.name} ({selectedEmployee.code}) | {selectedEmployee.department} | {selectedEmployee.designation}
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Section */}
      {selectedEmployee && (
        <>
          {/* Filter Section */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-light border-0 py-3">
              <h6 className="mb-0 fw-bold"><FaFilter className="me-2" /> Filter Audit Logs</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Event Type</label>
                  <select
                    className="form-select"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                  >
                    {eventTypes.map(event => (
                      <option key={event.value} value={event.value}>
                        {event.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Date From</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Date To</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs Summary */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card bg-primary bg-opacity-10 border-0">
                <div className="card-body text-center">
                  <FaClock size={24} className="text-primary mb-2" />
                  <h5 className="mb-0">{auditLogs.length}</h5>
                  <small className="text-muted">Total Events</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success bg-opacity-10 border-0">
                <div className="card-body text-center">
                  <FaPlus size={24} className="text-success mb-2" />
                  <h5 className="mb-0">{auditLogs.filter(l => l.eventType === 'Create').length}</h5>
                  <small className="text-muted">Creates</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning bg-opacity-10 border-0">
                <div className="card-body text-center">
                  <FaEdit size={24} className="text-warning mb-2" />
                  <h5 className="mb-0">{auditLogs.filter(l => l.eventType === 'Update').length}</h5>
                  <small className="text-muted">Updates</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info bg-opacity-10 border-0">
                <div className="card-body text-center">
                  <FaUpload size={24} className="text-info mb-2" />
                  <h5 className="mb-0">{auditLogs.filter(l => l.eventType === 'Upload').length}</h5>
                  <small className="text-muted">Documents</small>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0 py-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">
                <FaBook className="me-2 text-primary" /> Audit Trail - {selectedEmployee.name}
              </h6>
              <span className="badge bg-primary">{filteredLogs.length} Records Found</span>
            </div>
            <div className="table-responsive">
              <table className="table table-bordered table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '10%' }}>Event</th>
                    <th style={{ width: '20%' }}>Description</th>
                    <th style={{ width: '15%' }}>User</th>
                    <th style={{ width: '15%' }}>Timestamp</th>
                    <th style={{ width: '15%' }}>IP Address</th>
                    <th style={{ width: '20%' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, index) => {
                      const { date, time } = formatDateTime(log.timestamp);
                      return (
                        <tr key={log.id}>
                          <td className="text-center">{index + 1}</td>
                          <td className="text-center">
                            {getEventBadge(log.eventType)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {log.eventIcon}
                              <span>{log.description}</span>
                            </div>
                          </td>
                          <td>
                            <strong>{log.userName}</strong>
                            <br />
                            <small className="text-muted">{log.userAgent}</small>
                          </td>
                          <td>
                            <div>{date}</div>
                            <small className="text-muted">{time}</small>
                          </td>
                          <td>
                            <code className="small">{log.ipAddress}</code>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-info"
                              data-toggle="collapse"
                              data-target={`#details-${log.id}`}
                            >
                              <FaEye size={10} className="me-1" /> View Details
                            </button>
                            <div className="collapse mt-2" id={`details-${log.id}`}>
                              <div className="card card-body bg-light p-2 small">
                                {Object.entries(log.details).map(([key, value]) => (
                                  <div key={key}>
                                    <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <FaBook size={48} className="text-muted mb-3" />
                        <p className="mb-0">No audit records found</p>
                        <small className="text-muted">Try changing your filter criteria</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    
    </div>
  );
};

export default AuditTrail;