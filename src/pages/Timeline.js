import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, FaSearch, FaUserTie, FaBriefcase, FaCheckCircle, 
  FaChartLine, FaExchangeAlt, FaBuilding, FaChalkboardTeacher, 
  FaTrophy, FaGavel, FaRupeeSign, FaClock, FaFileAlt, FaEye, FaTimes,
  FaUserPlus, FaUserCheck, FaArrowUp, FaMapMarkerAlt, FaCertificate, FaStar, 
  FaGavel as FaDiscipline, FaSave, FaEdit, FaTrash, FaPlus, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookTimeline = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [timelineEvents, setTimelineEvents] = useState(initialData?.timelineEvents || [
    { id: 1, type: 'appointment', title: 'Appointment', description: 'Appointed as Software Engineer in IT department', date: '2020-01-15', employeeName: 'John Doe', employeeId: 1 },
    { id: 2, type: 'confirmation', title: 'Confirmation', description: 'Probation period completed - Employee confirmed', date: '2020-07-15', employeeName: 'John Doe', employeeId: 1 },
    { id: 3, type: 'promotion', title: 'Promotion', description: 'Promoted from Software Engineer to Senior Software Engineer', date: '2021-03-01', employeeName: 'John Doe', employeeId: 1 },
    { id: 4, type: 'training', title: 'Training Completed', description: 'Advanced Leadership Program', date: '2021-08-10', employeeName: 'Jane Smith', employeeId: 2 },
    { id: 5, type: 'award', title: 'Award Received', description: 'Star Performer of the Year', date: '2022-01-20', employeeName: 'Jane Smith', employeeId: 2 },
    { id: 6, type: 'transfer', title: 'Transfer', description: 'Transferred from Mumbai to Bangalore branch', date: '2022-06-01', employeeName: 'Mike Johnson', employeeId: 3 },
    { id: 7, type: 'payRevision', title: 'Pay Revision', description: 'Annual salary increment', date: '2023-01-01', employeeName: 'Sarah Williams', employeeId: 4 },
    { id: 8, type: 'retirement', title: 'Retirement', description: 'Superannuation retirement after 30 years of service', date: '2024-12-31', employeeName: 'David Brown', employeeId: 5 }
  ]);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    type: 'appointment',
    title: '',
    description: '',
    date: '',
    employeeId: '',
    employeeName: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

  const eventTypes = [
    { value: 'appointment', label: 'Appointment', icon: <FaUserPlus />, color: '#4f46e5', bg: '#e0e7ff' },
    { value: 'confirmation', label: 'Confirmation', icon: <FaUserCheck />, color: '#10b981', bg: '#d1fae5' },
    { value: 'promotion', label: 'Promotion', icon: <FaArrowUp />, color: '#f59e0b', bg: '#fed7aa' },
    { value: 'transfer', label: 'Transfer', icon: <FaExchangeAlt />, color: '#06b6d4', bg: '#cffafe' },
    { value: 'deputation', label: 'Deputation', icon: <FaBuilding />, color: '#14b8a6', bg: '#ccfbf1' },
    { value: 'training', label: 'Training', icon: <FaChalkboardTeacher />, color: '#8b5cf6', bg: '#ede9fe' },
    { value: 'award', label: 'Award', icon: <FaTrophy />, color: '#ef4444', bg: '#fee2e2' },
    { value: 'payRevision', label: 'Pay Revision', icon: <FaRupeeSign />, color: '#ec489a', bg: '#fce7f3' },
    { value: 'retirement', label: 'Retirement', icon: <FaClock />, color: '#64748b', bg: '#f1f5f9' }
  ];

  // Filter events by selected employee and search
  const getFilteredEvents = () => {
    let events = timelineEvents;
    
    if (selectedEmployee) {
      events = events.filter(event => event.employeeId === selectedEmployee.id);
    }
    
    if (filterType !== 'all') {
      events = events.filter(event => event.type === filterType);
    }
    
    return events;
  };

  const filteredEvents = getFilteredEvents();
  
  // Pagination
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowDropdown(false);
    setFilterType('all');
    setPage(0);
    toast.success('Employee Selected', `Showing timeline for ${employee.name}`);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setPage(0);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      type: event.type,
      title: event.title,
      description: event.description,
      date: event.date,
      employeeId: event.employeeId,
      employeeName: event.employeeName
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setTimelineEvents(timelineEvents.filter(event => event.id !== id));
    toast.success('Success', 'Event deleted successfully');
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleEmployeeSelectForForm = (employee) => {
    setFormData({
      ...formData,
      employeeId: employee.id,
      employeeName: employee.name
    });
    setEmployeeSearchTerm('');
    setShowDropdown(false);
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'title' && !value) error = 'Title is required';
    else if (field === 'date' && !value) error = 'Date is required';
    else if (field === 'type' && !value) error = 'Type is required';
    else if (field === 'employeeId' && !value) error = 'Employee is required';
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.employeeId) newErrors.employeeId = 'Employee is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    const eventType = eventTypes.find(t => t.value === formData.type);
    const newEvent = {
      id: editingEvent ? editingEvent.id : Date.now(),
      type: formData.type,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      employeeId: formData.employeeId,
      employeeName: formData.employeeName
    };
    
    if (editingEvent) {
      const updated = timelineEvents.map(event =>
        event.id === editingEvent.id ? newEvent : event
      );
      setTimelineEvents(updated);
      toast.success('Success', 'Event updated successfully');
      setEditingEvent(null);
    } else {
      setTimelineEvents([newEvent, ...timelineEvents]);
      toast.success('Success', 'Event added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const resetForm = () => {
    setFormData({
      type: 'appointment',
      title: '',
      description: '',
      date: '',
      employeeId: '',
      employeeName: ''
    });
    setErrors({});
    setTouched({});
    setEditingEvent(null);
    setEmployeeSearchTerm('');
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getEventTypeLabel = (type) => {
    const found = eventTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getEventTypeColor = (type) => {
    const found = eventTypes.find(t => t.value === type);
    return found || eventTypes[0];
  };

  // Calculate stats
  const totalEvents = timelineEvents.length;
  const eventsForSelected = selectedEmployee ? filteredEvents.length : totalEvents;

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Service Book Timeline</h1>
          <p className="cert-subtitle">Manage employee career timeline events</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Event
            </button>
          )}
          {showForm && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && onCancel && (
            <button className="cert-cancel-btn" onClick={handleCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        // Only Form - Table Hidden
        <div className="cert-form-wrap mb-4">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Event Details</div>
              <div className="cert-form-grid-3col">
                {/* Employee Selection */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label className="required">Select Employee</label>
                  <div className="position-relative">
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaSearch size={14} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search employee by name or code..."
                        value={employeeSearchTerm}
                        onChange={(e) => {
                          setEmployeeSearchTerm(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                      />
                    </div>
                    
                    {showDropdown && employeeSearchTerm && (
                      <div className="card position-absolute top-100 start-0 end-0 mt-1 shadow-lg" style={{ zIndex: 1000, maxHeight: '300px', overflow: 'auto' }}>
                        <div className="card-body p-2">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                              <div
                                key={emp.id}
                                className="d-flex justify-content-between align-items-center p-2 rounded cursor-pointer hover-bg-light"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleEmployeeSelectForForm(emp)}
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
                  <FieldError msg={errors.employeeId} />
                  {formData.employeeName && (
                    <div className="alert alert-success mt-2 py-1">
                      <FaUserTie className="me-1" /> Selected: {formData.employeeName}
                    </div>
                  )}
                </div>
                
                <div className={`cert-field-compact ${touched.type && errors.type ? 'has-error' : ''}`}>
                  <label className="required">Event Type</label>
                  <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} onBlur={() => handleBlur('type')}>
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.type} />
                </div>
                
                <div className={`cert-field-compact ${touched.date && errors.date ? 'has-error' : ''}`} style={{ gridColumn: 'span 2' }}>
                  <label className="required">Event Date</label>
                  <input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} onBlur={() => handleBlur('date')} />
                  <FieldError msg={errors.date} />
                </div>
                
                <div className={`cert-field-compact ${touched.title && errors.title ? 'has-error' : ''}`} style={{ gridColumn: 'span 3' }}>
                  <label className="required">Event Title</label>
                  <input type="text" placeholder="e.g., Promotion to Senior Engineer" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} onBlur={() => handleBlur('title')} />
                  <FieldError msg={errors.title} />
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Description</label>
                  <textarea rows="2" placeholder="Brief description of the event..." value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
                </div>
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingEvent ? 'Update Event' : 'Save Event'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Only Table - Form Hidden
        <>
          {/* Search Bar for Employee Selection */}
          <div className="cert-search-bar">
            <div className="cert-search-wrap">
              <FaSearch className="cert-search-icon" size={12} />
              <input
                className="cert-search-input"
                type="text"
                placeholder="Search by employee name or code..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              />
              {searchTerm && (
                <button className="cert-search-clear" onClick={() => { setSearchTerm(''); setShowDropdown(false); }}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && searchTerm && (
            <div className="card shadow-sm mb-4" style={{ maxHeight: '300px', overflow: 'auto' }}>
              <div className="card-body p-2">
                {DUMMY_EMPLOYEES.filter(emp => {
                  const search = searchTerm.toLowerCase();
                  return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
                }).length > 0 ? (
                  DUMMY_EMPLOYEES.filter(emp => {
                    const search = searchTerm.toLowerCase();
                    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
                  }).map(emp => (
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

          {/* Selected Employee Alert */}
          {selectedEmployee && (
            <div className="alert alert-success mt-3 mb-4 py-2">
              <FaUserTie className="me-2" /> 
              <strong>Selected Employee:</strong> {selectedEmployee.name} ({selectedEmployee.code}) | 
              <strong> Department:</strong> {selectedEmployee.department} | 
              <strong> Designation:</strong> {selectedEmployee.designation}
            </div>
          )}

          {/* Stats */}
          <div className="cert-stats">
            <div className="cert-stat-card">
              <FaCalendarAlt size={16} color="#4f46e5" />
              <span>{totalEvents} Total Events</span>
            </div>
            <div className="cert-stat-card">
              <FaClock size={16} color="#10b981" />
              <span>{eventsForSelected} {selectedEmployee ? `for ${selectedEmployee.name}` : 'in System'}</span>
            </div>
          </div>

          {/* Filter Buttons */}
          {timelineEvents.length > 0 && (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0">Filter by Event Type</h6>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2">
                  <button
                    className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-outline-secondary'} btn-sm`}
                    onClick={() => handleFilterChange('all')}
                  >
                    All Events ({filteredEvents.length})
                  </button>
                  {eventTypes.map(type => {
                    const count = timelineEvents.filter(e => e.type === type.value).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={type.value}
                        className={`btn ${filterType === type.value ? 'btn-primary' : 'btn-outline-secondary'} btn-sm`}
                        onClick={() => handleFilterChange(type.value)}
                      >
                        {type.icon} {type.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Events Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Event Type</th>
                    <th>Event Title</th>
                    <th>Event Date</th>
                    <th>Description</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEvents.length > 0 ? (
                    currentEvents.map((event, idx) => {
                      const eventType = getEventTypeColor(event.type);
                      return (
                        <tr key={event.id} style={{ cursor: 'pointer' }} onClick={() => handleEventClick(event)}>
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td className="fw-bold">{event.employeeName}</td>
                          <td>
                            <span className="badge" style={{ backgroundColor: eventType.bg, color: eventType.color, padding: '4px 8px' }}>
                              {eventType.icon} {eventType.label}
                            </span>
                          </td>
                          <td><strong>{event.title}</strong></td>
                          <td>{formatDate(event.date)}</td>
                          <td>{event.description ? (event.description.length > 30 ? event.description.substring(0, 30) + '...' : event.description) : '—'}</td>
                          <td className="text-center">
                            <div className="cert-actions">
                              <button className="cert-act cert-act--edit" onClick={(e) => { e.stopPropagation(); handleEdit(event); }} title="Edit">
                                <FaEdit size={12} />
                              </button>
                              <button className="cert-act cert-act--del" onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }} title="Delete">
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="7" className="text-center py-5">No timeline events found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="cert-pagination" style={{ justifyContent: 'center', display: 'flex', gap: '8px', marginTop: '20px', padding: '12px 0' }}>
                <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
                {getPaginationRange().map((pg, i) =>
                  pg === '...' ? <span key={i} className="cert-page-dots">…</span> : <button key={pg} className={`cert-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg + 1}</button>
                )}
                <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            )}
          </div>

          {/* Event Details Modal */}
          {showEventModal && selectedEvent && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">{getEventTypeLabel(selectedEvent.type)} Details</h5>
                    <button type="button" className="close text-white" onClick={() => setShowEventModal(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <p><strong>Employee:</strong> {selectedEvent.employeeName}</p>
                    <p><strong>Event Title:</strong> {selectedEvent.title}</p>
                    <p><strong>Event Date:</strong> {formatDate(selectedEvent.date)}</p>
                    <p><strong>Description:</strong> {selectedEvent.description || '—'}</p>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default ServiceBookTimeline;