// export default AuditTrail;
import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaUserTie, FaBuilding, FaCalendarAlt, 
  FaBook, FaEye, FaDownload, FaFilter, FaTimes,
  FaPlus, FaEdit, FaCheckCircle, FaUpload, FaEye as FaView,
  FaClock, FaFileAlt, FaUserCheck, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher,
  FaSave, FaTrash, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AuditTrail = ({ user, onCancel }) => {
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, eventType: 'Create', description: 'Service book created for John Doe', timestamp: '2024-01-15 09:30:00', ipAddress: '192.168.1.101', userName: 'HR Admin', employeeName: 'John Doe', employeeId: 1, details: { serviceBookNumber: 'SB/2024/0001', joiningDate: '2024-01-15' } },
    { id: 2, eventType: 'Document Upload', description: 'Appointment order document uploaded', timestamp: '2024-01-15 10:15:22', ipAddress: '192.168.1.101', userName: 'HR Admin', employeeName: 'John Doe', employeeId: 1, details: { documentName: 'Appointment_Order.pdf', documentSize: '1.2 MB' } },
    { id: 3, eventType: 'Update', description: 'Employee designation updated', timestamp: '2024-03-01 14:20:35', ipAddress: '192.168.1.105', userName: 'HR Manager', employeeName: 'John Doe', employeeId: 1, details: { fieldChanged: 'designation', oldValue: 'Software Engineer', newValue: 'Senior Software Engineer' } },
    { id: 4, eventType: 'Approval', description: 'Promotion request approved', timestamp: '2024-03-05 11:45:00', ipAddress: '192.168.1.110', userName: 'HR Director', employeeName: 'Jane Smith', employeeId: 2, details: { approvalType: 'Promotion', approvedBy: 'HR Director' } },
    { id: 5, eventType: 'View', description: 'Service book viewed by Manager', timestamp: '2024-03-10 09:15:30', ipAddress: '192.168.1.115', userName: 'Department Head', employeeName: 'Mike Johnson', employeeId: 3, details: { viewedFrom: 'Employee Management Module' } },
    { id: 6, eventType: 'Download', description: 'Service book PDF downloaded', timestamp: '2024-03-12 16:30:45', ipAddress: '192.168.1.120', userName: 'HR Executive', employeeName: 'Sarah Williams', employeeId: 4, details: { downloadFormat: 'PDF', fileSize: '2.5 MB' } },
    { id: 7, eventType: 'Document Upload', description: 'Promotion order document uploaded', timestamp: '2024-03-05 12:00:00', ipAddress: '192.168.1.105', userName: 'HR Manager', employeeName: 'David Brown', employeeId: 5, details: { documentName: 'Promotion_Order.pdf', documentSize: '856 KB' } },
    { id: 8, eventType: 'Update', description: 'Salary revised', timestamp: '2024-04-01 10:00:00', ipAddress: '192.168.1.125', userName: 'Payroll Manager', employeeName: 'Emily Wilson', employeeId: 6, details: { fieldChanged: 'salary', oldValue: '₹50,000', newValue: '₹60,000' } },
    { id: 9, eventType: 'Approval', description: 'Leave request approved', timestamp: '2024-05-10 14:30:00', ipAddress: '192.168.1.130', userName: 'HR Manager', employeeName: 'John Doe', employeeId: 1, details: { approvalType: 'Leave', approvedBy: 'HR Manager' } }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState(auditLogs);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState({
    eventType: 'Create',
    description: '',
    userName: '',
    employeeName: '',
    ipAddress: '',
    details: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // Event Types as per requirements
  const eventTypes = [
    { value: 'Create', label: 'Create', icon: <FaPlus />, color: '#10b981', bg: '#d1fae5' },
    { value: 'Update', label: 'Update', icon: <FaEdit />, color: '#f59e0b', bg: '#fed7aa' },
    { value: 'Approval', label: 'Approval', icon: <FaCheckCircle />, color: '#10b981', bg: '#d1fae5' },
    { value: 'Document Upload', label: 'Document Upload', icon: <FaUpload />, color: '#8b5cf6', bg: '#ede9fe' },
    { value: 'Download', label: 'Download', icon: <FaDownload />, color: '#ec489a', bg: '#fce7f3' },
    { value: 'View', label: 'View', icon: <FaView />, color: '#06b6d4', bg: '#cffafe' }
  ];

  const DUMMY_EMPLOYEES = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'David Brown', 'Emily Wilson'];

  // Filter logs by search
  useEffect(() => {
    let filtered = auditLogs;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.employeeName.toLowerCase().includes(search) ||
        log.eventType.toLowerCase().includes(search) ||
        log.userName.toLowerCase().includes(search) ||
        log.description.toLowerCase().includes(search)
      );
    }
    
    setFilteredLogs(filtered);
    setPage(0);
  }, [searchTerm, auditLogs]);

  // Pagination
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

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

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'eventType' && !value) error = 'Event Type is required';
    else if (field === 'description' && !value) error = 'Description is required';
    else if (field === 'userName' && !value) error = 'User Name is required';
    else if (field === 'employeeName' && !value) error = 'Employee Name is required';
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.eventType) newErrors.eventType = 'Event Type is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.userName) newErrors.userName = 'User Name is required';
    if (!formData.employeeName) newErrors.employeeName = 'Employee Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }
    
    const newLog = {
      id: editingLog ? editingLog.id : Date.now(),
      eventType: formData.eventType,
      description: formData.description,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: formData.ipAddress || '192.168.1.1',
      userName: formData.userName,
      employeeName: formData.employeeName,
      employeeId: editingLog ? editingLog.employeeId : DUMMY_EMPLOYEES.indexOf(formData.employeeName) + 1,
      details: { note: formData.details || 'No additional details' }
    };
    
    if (editingLog) {
      setAuditLogs(auditLogs.map(log => log.id === editingLog.id ? newLog : log));
      toast.success('Success', 'Audit log updated successfully');
      setEditingLog(null);
    } else {
      setAuditLogs([newLog, ...auditLogs]);
      toast.success('Success', 'Audit log added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      eventType: log.eventType,
      description: log.description,
      userName: log.userName,
      employeeName: log.employeeName,
      ipAddress: log.ipAddress,
      details: log.details?.note || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setAuditLogs(auditLogs.filter(log => log.id !== id));
    toast.success('Deleted', 'Audit log deleted successfully');
  };

  const resetForm = () => {
    setFormData({
      eventType: 'Create',
      description: '',
      userName: '',
      employeeName: '',
      ipAddress: '',
      details: ''
    });
    setErrors({});
    setTouched({});
    setEditingLog(null);
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

  const formatDateTime = (timestamp) => {
    const [date, time] = timestamp.split(' ');
    const formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return { date: formattedDate, time };
  };

  const getEventBadge = (eventType) => {
    const event = eventTypes.find(e => e.value === eventType);
    const style = event || eventTypes[0];
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '6px 12px' }}>{eventType}</span>;
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Service Book Audit Trail</h1>
          <p className="cert-subtitle">Track service book changes for compliance management</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Audit Log
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
              <div className="cert-section-label">Audit Log Details</div>
              <div className="cert-form-grid-3col">
                <div className={`cert-field-compact ${touched.eventType && errors.eventType ? 'has-error' : ''}`}>
                  <label className="required">Event Type</label>
                  <select value={formData.eventType} onChange={(e) => handleChange('eventType', e.target.value)} onBlur={() => handleBlur('eventType')}>
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.eventType} />
                </div>
                
                <div className={`cert-field-compact ${touched.employeeName && errors.employeeName ? 'has-error' : ''}`}>
                  <label className="required">Employee Name</label>
                  <select value={formData.employeeName} onChange={(e) => handleChange('employeeName', e.target.value)} onBlur={() => handleBlur('employeeName')}>
                    <option value="">Select Employee</option>
                    {DUMMY_EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                  </select>
                  <FieldError msg={errors.employeeName} />
                </div>
                
                <div className={`cert-field-compact ${touched.userName && errors.userName ? 'has-error' : ''}`}>
                  <label className="required">User Name</label>
                  <input type="text" placeholder="User who performed action" value={formData.userName} onChange={(e) => handleChange('userName', e.target.value)} onBlur={() => handleBlur('userName')} />
                  <FieldError msg={errors.userName} />
                </div>
                
                <div className={`cert-field-compact ${touched.description && errors.description ? 'has-error' : ''}`} style={{ gridColumn: 'span 2' }}>
                  <label className="required">Description</label>
                  <input type="text" placeholder="Description of the event" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} onBlur={() => handleBlur('description')} />
                  <FieldError msg={errors.description} />
                </div>
                
                <div className="cert-field-compact">
                  <label>IP Address</label>
                  <input type="text" placeholder="e.g., 192.168.1.1" value={formData.ipAddress} onChange={(e) => handleChange('ipAddress', e.target.value)} />
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Additional Details</label>
                  <textarea rows="2" placeholder="Any additional details..." value={formData.details} onChange={(e) => handleChange('details', e.target.value)} />
                </div>
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingLog ? 'Update Log' : 'Save Log'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Only Table - Form Hidden
        <>
          {/* Search Bar */}
          <div className="cert-search-bar">
            <div className="cert-search-wrap">
              <FaSearch className="cert-search-icon" size={12} />
              <input
                className="cert-search-input"
                type="text"
                placeholder="Search by employee name, event type, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="cert-search-clear" onClick={() => setSearchTerm('')}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Event Types Legend */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h6 className="mb-0"><FaClock className="me-2" /> Track Events</h6>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-3">
                {eventTypes.map(event => (
                  <div key={event.value} className="d-flex align-items-center gap-2">
                    <span className="badge" style={{ backgroundColor: event.bg, color: event.color, padding: '6px 12px' }}>
                      {event.icon} {event.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Event Type</th>
                    <th>Employee</th>
                    <th>Description</th>
                    <th>User</th>
                    <th>Timestamp</th>
                    <th>IP Address</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log, idx) => {
                      const { date, time } = formatDateTime(log.timestamp);
                      return (
                        <tr key={log.id}>
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td className="text-center">{getEventBadge(log.eventType)}</td>
                          <td className="fw-bold">{log.employeeName}</td>
                          <td>{log.description}</td>
                          <td>{log.userName}</td>
                          <td><div>{date}</div><small className="text-muted">{time}</small></td>
                          <td><code>{log.ipAddress}</code></td>
                          <td className="text-center">
                            <div className="cert-actions">
                              <button className="cert-act cert-act--edit" onClick={() => handleEdit(log)} title="Edit">
                                <FaEdit size={12} />
                              </button>
                              <button className="cert-act cert-act--del" onClick={() => handleDelete(log.id)} title="Delete">
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5">No audit records found</td>
                    </tr>
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
        </>
      )}
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default AuditTrail;