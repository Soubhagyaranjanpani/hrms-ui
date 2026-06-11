import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, FaSearch, FaUserTie, FaBriefcase, FaCheckCircle, 
  FaChartLine, FaExchangeAlt, FaBuilding, FaChalkboardTeacher, 
  FaTrophy, FaGavel, FaRupeeSign, FaClock, FaFileAlt, FaEye,FaTimes,
  FaUserPlus, FaUserCheck, FaArrowUp, FaMapMarkerAlt, FaCertificate, FaStar, FaGavel as FaDiscipline
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookTimeline = ({ employeeId, initialData }) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  // Dummy timeline data
  const getDummyTimelineData = (employee) => {
    if (!employee) return [];
    
    return [
      {
        id: 1,
        type: 'appointment',
        title: 'Appointment',
        description: `Appointed as ${employee.designation} in ${employee.department} department`,
        date: '2020-01-15',
        icon: <FaUserPlus />,
        color: '#4f46e5',
        bgColor: '#e0e7ff',
        details: {
          orderNo: 'APP/2020/001',
          authority: 'Managing Director',
          appointmentType: 'Permanent',
          employmentType: 'Full-Time',
          joiningDate: '2020-01-15'
        }
      },
      {
        id: 2,
        type: 'confirmation',
        title: 'Confirmation',
        description: 'Probation period completed - Employee confirmed',
        date: '2020-07-15',
        icon: <FaUserCheck />,
        color: '#10b981',
        bgColor: '#d1fae5',
        details: {
          orderNo: 'CONF/2020/001',
          confirmedBy: 'HR Manager',
          remarks: 'Performance satisfactory'
        }
      },
      {
        id: 3,
        type: 'promotion',
        title: 'Promotion',
        description: `Promoted from ${employee.designation} to Senior ${employee.designation}`,
        date: '2021-03-01',
        icon: <FaArrowUp />,
        color: '#f59e0b',
        bgColor: '#fed7aa',
        details: {
          orderNo: 'PROMO/2021/001',
          fromDesignation: employee.designation,
          toDesignation: `Senior ${employee.designation}`,
          effectiveDate: '2021-03-01',
          hike: '15%'
        }
      },
      {
        id: 4,
        type: 'training',
        title: 'Training Completed',
        description: 'Advanced Leadership Program',
        date: '2021-08-10',
        icon: <FaChalkboardTeacher />,
        color: '#8b5cf6',
        bgColor: '#ede9fe',
        details: {
          provider: 'Harvard Business School',
          duration: '5 days',
          certificationReceived: 'Yes',
          certificateNo: 'HBS/2021/456'
        }
      },
      {
        id: 5,
        type: 'award',
        title: 'Award Received',
        description: 'Star Performer of the Year',
        date: '2022-01-20',
        icon: <FaTrophy />,
        color: '#ef4444',
        bgColor: '#fee2e2',
        details: {
          awardedBy: 'CEO Office',
          awardType: 'Star Performer',
          description: 'For outstanding performance in FY 2021-22'
        }
      },
      {
        id: 6,
        type: 'transfer',
        title: 'Transfer',
        description: 'Transferred from Mumbai to Bangalore branch',
        date: '2022-06-01',
        icon: <FaExchangeAlt />,
        color: '#06b6d4',
        bgColor: '#cffafe',
        details: {
          orderNo: 'TRF/2022/001',
          fromBranch: 'Mumbai',
          toBranch: 'Bangalore',
          reason: 'Project requirement'
        }
      },
      {
        id: 7,
        type: 'payRevision',
        title: 'Pay Revision',
        description: 'Annual salary increment',
        date: '2023-01-01',
        icon: <FaRupeeSign />,
        color: '#ec489a',
        bgColor: '#fce7f3',
        details: {
          orderNo: 'PAY/2023/001',
          previousPayScale: '₹50,000 - ₹80,000',
          revisedPayScale: '₹60,000 - ₹95,000',
          increment: '₹10,000 (15%)',
          reason: 'Annual Increment'
        }
      },
      {
        id: 8,
        type: 'disciplinary',
        title: 'Disciplinary Action',
        description: 'Warning letter issued for policy violation',
        date: '2023-04-15',
        icon: <FaDiscipline />,
        color: '#dc2626',
        bgColor: '#fecaca',
        details: {
          caseNumber: 'DISC/2023/001',
          actionType: 'Warning',
          penalty: 'Warning Letter',
          status: 'Closed'
        }
      },
      {
        id: 9,
        type: 'deputation',
        title: 'Deputation',
        description: 'Deputed to Ministry of Corporate Affairs',
        date: '2023-09-01',
        icon: <FaBuilding />,
        color: '#14b8a6',
        bgColor: '#ccfbf1',
        details: {
          orderNo: 'DEP/2023/001',
          organization: 'Ministry of Corporate Affairs',
          duration: '6 months',
          reportingAuthority: 'Joint Secretary'
        }
      },
      {
        id: 10,
        type: 'retirement',
        title: 'Retirement',
        description: 'Superannuation retirement after 30 years of service',
        date: '2024-12-31',
        icon: <FaClock />,
        color: '#64748b',
        bgColor: '#f1f5f9',
        details: {
          orderNo: 'RET/2024/001',
          retirementType: 'Superannuation',
          pensionEligibility: 'Yes',
          pensionNumber: 'PEN/2024/001'
        }
      }
    ];
  };

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

  const eventTypes = [
    { value: 'all', label: 'All Events', icon: <FaCalendarAlt /> },
    { value: 'appointment', label: 'Appointment', icon: <FaUserPlus /> },
    { value: 'confirmation', label: 'Confirmation', icon: <FaUserCheck /> },
    { value: 'promotion', label: 'Promotion', icon: <FaArrowUp /> },
    { value: 'transfer', label: 'Transfer', icon: <FaExchangeAlt /> },
    { value: 'deputation', label: 'Deputation', icon: <FaBuilding /> },
    { value: 'training', label: 'Training', icon: <FaChalkboardTeacher /> },
    { value: 'award', label: 'Awards', icon: <FaTrophy /> },
    { value: 'disciplinary', label: 'Disciplinary', icon: <FaDiscipline /> },
    { value: 'payRevision', label: 'Pay Revision', icon: <FaRupeeSign /> },
    { value: 'retirement', label: 'Retirement', icon: <FaClock /> }
  ];

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    const events = getDummyTimelineData(employee);
    setTimelineEvents(events);
    setFilteredEvents(events);
    setSearchTerm('');
    setShowDropdown(false);
    setFilterType('all');
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    if (type === 'all') {
      setFilteredEvents(timelineEvents);
    } else {
      setFilteredEvents(timelineEvents.filter(event => event.type === type));
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getEventTypeLabel = (type) => {
    const found = eventTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  // Group events by year
  const getEventsByYear = () => {
    const grouped = {};
    filteredEvents.forEach(event => {
      const year = new Date(event.date).getFullYear();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(event);
    });
    return Object.keys(grouped).sort((a, b) => b - a);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaCalendarAlt className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Service Book Timeline</h5>
          <p className="text-muted mb-0 small">View employee career journey chronologically</p>
        </div>
      </div>

      {/* Search Employee */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">Select Employee</h6>
        </div>
        <div className="card-body">
          <div className="position-relative">
            <div className="input-group">
              
                <span className="input-group-text bg-light">
                  <FaSearch size={14} />
                </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {selectedEmployee && (
        
                  <button className="btn btn-outline-danger" onClick={() => { setSelectedEmployee(null); setTimelineEvents([]); setFilteredEvents([]); }}>
                     Cancel
                  </button>
        
              )}
            </div>
            
            {showDropdown && searchTerm && (
              <div className="dropdown-menu show w-100 mt-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => (
                    <button key={emp.id} className="dropdown-item" onClick={() => handleEmployeeSelect(emp)}>
                      <div className="font-weight-bold">{emp.name}</div>
                      <small className="text-muted">{emp.code} | {emp.department} | {emp.designation}</small>
                    </button>
                  ))
                ) : (
                  <div className="dropdown-item text-center text-muted">No employees found</div>
                )}
              </div>
            )}
          </div>
                           <small className="text-muted mt-2 d-block">Type employee name or code to search</small>

          {selectedEmployee && (
            <div className="alert alert-info mt-3 mb-0 py-2">
              <FaUserTie className="mr-2" /> 
              <strong>Employee:</strong> {selectedEmployee.name} ({selectedEmployee.code}) | 
              <strong> Department:</strong> {selectedEmployee.department} | 
              <strong> Designation:</strong> {selectedEmployee.designation}
            </div>
          )}
        </div>
      </div>

      {/* Timeline View */}
      {selectedEmployee && filteredEvents.length > 0 && (
        <>
          {/* Filter Buttons */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">Filter by Event Type</h6>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                {eventTypes.map(type => (
                  <button
                    key={type.value}
                    className={`btn ${filterType === type.value ? 'btn-primary' : 'btn-outline-secondary'} btn-sm`}
                    onClick={() => handleFilterChange(type.value)}
                  >
                    {type.icon} <span className="ml-1">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h6 className="mb-0">Career Timeline - {selectedEmployee.name}</h6>
            </div>
            <div className="card-body">
              {getEventsByYear().map(year => (
                <div key={year} className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary text-white rounded-circle p-2 mr-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <strong>{year}</strong>
                    </div>
                    <h5 className="mb-0">Year {year}</h5>
                  </div>
                  
                  <div className="timeline-container position-relative pl-4">
                    {filteredEvents.filter(e => new Date(e.date).getFullYear() === parseInt(year)).map((event, index) => (
                      <div key={event.id} className="timeline-item position-relative mb-4" style={{ cursor: 'pointer' }} onClick={() => handleEventClick(event)}>
                        <div className="timeline-dot position-absolute rounded-circle" style={{
                          left: '-8px',
                          top: '8px',
                          width: '16px',
                          height: '16px',
                          backgroundColor: event.color,
                          border: '3px solid white',
                          boxShadow: '0 0 0 2px #e5e7eb'
                        }}></div>
                        <div className="timeline-content card border-0 shadow-sm ml-3" style={{ transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'
                        }>
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="badge" style={{ backgroundColor: event.bgColor, color: event.color, padding: '4px 8px' }}>
                                    {event.icon} {getEventTypeLabel(event.type)}
                                  </span>
                                  <span className="text-muted small">
                                    <FaCalendarAlt className="mr-1" size={10} /> {formatDate(event.date)}
                                  </span>
                                </div>
                                <h6 className="mb-1">{event.title}</h6>
                                <p className="text-muted small mb-0">{event.description}</p>
                              </div>
                              <FaEye className="text-muted" size={14} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}


      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header btn btn-primary">
                <h5 className="modal-title text-white">
                   Details
                </h5>
               
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>{selectedEvent.title}</h6>
                  <p className="text-muted">{selectedEvent.description}</p>
                  <hr />
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="text-muted small">Event Date</label>
                    <p className="mb-0">{formatDate(selectedEvent.date)}</p>
                  </div>
                  {selectedEvent.details && Object.entries(selectedEvent.details).map(([key, value]) => (
                    <div key={key} className="col-md-6 mb-2">
                      <label className="text-muted small">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                      <p className="mb-0">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .timeline-container {
          border-left: 2px solid #e5e7eb;
        }
        .timeline-item:last-child {
          margin-bottom: 0 !important;
        }
        .timeline-content {
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default ServiceBookTimeline;