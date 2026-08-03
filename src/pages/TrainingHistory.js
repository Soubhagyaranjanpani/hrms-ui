
import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaChalkboardTeacher, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaUserTie, FaEye, FaDownload, FaClock, FaCertificate, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';

const TrainingHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [trainings, setTrainings] = useState(initialData?.trainings || [
    { id: 1, trainingName: 'Advanced React Development', trainingProvider: 'Udemy', startDate: '2024-01-15', endDate: '2024-02-15', certificationReceived: 'Yes', trainingHours: '40', duration: '32 days', createdAt: '2024-01-15T10:30:00Z', employeeName: 'John Doe', employeeId: 1, certificateFileName: 'react_certificate.pdf', certificateFileData: null },
    { id: 2, trainingName: 'Leadership Program', trainingProvider: 'Harvard Business School', startDate: '2024-03-01', endDate: '2024-03-10', certificationReceived: 'Yes', trainingHours: '30', duration: '10 days', createdAt: '2024-03-01T11:45:00Z', employeeName: 'Jane Smith', employeeId: 2 },
    { id: 3, trainingName: 'Cloud Architecture', trainingProvider: 'AWS', startDate: '2024-05-10', endDate: '2024-06-10', certificationReceived: 'Pending', trainingHours: '50', duration: '32 days', createdAt: '2024-05-10T09:15:00Z', employeeName: 'Mike Johnson', employeeId: 3, certificateFileName: 'aws_cert.pdf', certificateFileData: null },
    { id: 4, trainingName: 'Sales Fundamentals', trainingProvider: 'Salesforce', startDate: '2024-07-05', endDate: '2024-07-20', certificationReceived: 'Yes', trainingHours: '25', duration: '16 days', createdAt: '2024-07-05T14:20:00Z', employeeName: 'Sarah Williams', employeeId: 4 },
    { id: 5, trainingName: 'Accounting Software', trainingProvider: 'Tally', startDate: '2024-09-12', endDate: '2024-09-30', certificationReceived: 'No', trainingHours: '35', duration: '19 days', createdAt: '2024-09-12T10:00:00Z', employeeName: 'David Brown', employeeId: 5 }
  ]);
  
  const [editingTraining, setEditingTraining] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [formRows, setFormRows] = useState([
    {
      id: Date.now(),
      trainingName: '',
      trainingProvider: '',
      startDate: '',
      endDate: '',
      certificationReceived: 'No',
      trainingHours: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null,
      employeeId: '',
      employeeName: ''
    }
  ]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTraining, setViewingTraining] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: "",
    newStatus: ""
  });
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showDocumentActions, setShowDocumentActions] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  
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

  const handleRowClick = (training) => {
    setSelectedTraining(training);
  };

  const handleViewDocument = (e, training) => {
    e.stopPropagation(); 
    setSelectedTraining(training); 
    setShowDocumentActions(true);
    if (training.certificateFileData) {
      setDocumentPreview({
        data: training.certificateFileData,
        name: training.certificateFileName
      });
    } else {
      toast.info('No Document', 'No certificate has been uploaded for this training');
    }
  };

  const certificationOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
    { value: 'Pending', label: 'Pending' }
  ];

  const filteredTrainings = trainings.filter(training => {
    const search = searchTerm.toLowerCase();
    return training.trainingName.toLowerCase().includes(search) ||
           training.trainingProvider.toLowerCase().includes(search) ||
           training.employeeName.toLowerCase().includes(search);
  });

  const totalItems = filteredTrainings.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentTrainings = filteredTrainings.slice(startIndex, startIndex + rowsPerPage);
  
  const handleEmployeeSelect = (rowId, employee) => {
    setFormRows(prev => prev.map(row => 
      row.id === rowId ? {
        ...row,
        employeeId: employee.id,
        employeeName: employee.name
      } : row
    ));
    setEmployeeSearchTerm(employee.name);
    setShowEmployeeDropdown(false);
    
    if (rowErrors[rowId]) {
      const newErrors = { ...rowErrors };
      delete newErrors[rowId];
      setRowErrors(newErrors);
    }
  };

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '—';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '1 day';
    return `${diffDays} days`;
  };

  const handleRowChange = (rowId, field, value) => {
    setFormRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
    
    if (rowErrors[rowId] && rowErrors[rowId][field]) {
      const newErrors = { ...rowErrors };
      delete newErrors[rowId][field];
      if (Object.keys(newErrors[rowId] || {}).length === 0) {
        delete newErrors[rowId];
      }
      setRowErrors(newErrors);
    }
  };

  const handleRowFileChange = (rowId, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('File too large', 'Maximum file size is 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormRows(prev => prev.map(row => 
          row.id === rowId ? {
            ...row,
            certificateFile: file,
            certificateFileData: reader.result,
            certificateFileName: file.name
          } : row
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateRow = (row) => {
    const errors = {};
    if (!row.trainingName) errors.trainingName = 'Training Name is required';
    if (!row.trainingProvider) errors.trainingProvider = 'Training Provider is required';
    if (!row.startDate) errors.startDate = 'Start Date is required';
    if (!row.endDate) {
      errors.endDate = 'End Date is required';
    } else if (row.startDate && new Date(row.endDate) < new Date(row.startDate)) {
      errors.endDate = 'End Date must be after Start Date';
    }
    if (!row.trainingHours) errors.trainingHours = 'Training Hours is required';
    if (!row.certificationReceived) errors.certificationReceived = 'Certification Received is required';
    if (!row.employeeId) errors.employeeId = 'Employee is required';
    return errors;
  };

  const addRow = () => {
    const newRow = {
      id: Date.now() + Math.random(),
      trainingName: '',
      trainingProvider: '',
      startDate: '',
      endDate: '',
      certificationReceived: 'No',
      trainingHours: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null,
      employeeId: '',
      employeeName: ''
    };
    setFormRows([...formRows, newRow]);
  };

  const removeRow = (rowId) => {
    if (formRows.length <= 1) {
      toast.warning('Cannot Remove', 'At least one row is required');
      return;
    }
    setFormRows(prev => prev.filter(row => row.id !== rowId));
    const newErrors = { ...rowErrors };
    delete newErrors[rowId];
    setRowErrors(newErrors);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let hasErrors = false;
    const allErrors = {};
    
    formRows.forEach(row => {
      const rowError = validateRow(row);
      if (Object.keys(rowError).length > 0) {
        allErrors[row.id] = rowError;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setRowErrors(allErrors);
      toast.warning('Validation Error', 'Please fix the highlighted fields in all rows');
      return;
    }
    
    const newTrainings = formRows.map(row => ({
      id: Date.now() + Math.random() * 1000,
      trainingName: row.trainingName,
      trainingProvider: row.trainingProvider,
      startDate: row.startDate,
      endDate: row.endDate,
      certificationReceived: row.certificationReceived,
      trainingHours: row.trainingHours,
      duration: calculateDuration(row.startDate, row.endDate),
      certificateFileData: row.certificateFileData,
      certificateFileName: row.certificateFileName,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      createdAt: new Date().toISOString(),
      status: 'Active'
    }));
    
    setTrainings([...newTrainings, ...trainings]);
    toast.success('Success', `${newTrainings.length} training(s) added successfully`);
    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (training) => {
    if (training.status === 'Inactive') {
      toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
      return;
    }
    
    const emp = DUMMY_EMPLOYEES.find(e => e.id === training.employeeId);
    setSelectedEmployee(emp || null);
    setEditingTraining(training);
    
    setFormRows([{
      id: Date.now(),
      trainingName: training.trainingName,
      trainingProvider: training.trainingProvider,
      startDate: training.startDate,
      endDate: training.endDate,
      certificationReceived: training.certificationReceived,
      trainingHours: training.trainingHours,
      certificateFile: null,
      certificateFileData: training.certificateFileData,
      certificateFileName: training.certificateFileName,
      employeeId: training.employeeId,
      employeeName: training.employeeName
    }]);
    
    setEmployeeSearchTerm(emp?.name || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormRows([{
      id: Date.now(),
      trainingName: '',
      trainingProvider: '',
      startDate: '',
      endDate: '',
      certificationReceived: 'No',
      trainingHours: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null,
      employeeId: '',
      employeeName: ''
    }]);
    setErrors({});
    setTouched({});
    setEditingTraining(null);
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
    setRowErrors({});
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
    setSelectedTraining(null);
    setShowDocumentActions(false);
  };

  const totalTrainings = trainings.length;
  const certifiedTrainings = trainings.filter(t => t.certificationReceived === 'Yes').length;
  const totalHours = trainings.reduce((sum, t) => sum + (parseInt(t.trainingHours) || 0), 0);

  const getCertificationColor = (status) => {
    switch(status) {
      case 'Yes': return { bg: '#d1fae5', color: '#065f46', icon: '✅' };
      case 'Pending': return { bg: '#fed7aa', color: '#9a3412', icon: '⏳' };
      case 'No': return { bg: '#f3f4f6', color: '#6b7280', icon: '❌' };
      default: return { bg: '#f3f4f6', color: '#6b7280', icon: '—' };
    }
  };

  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({
      id,
      name,
      newStatus
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;
  
    const updatedTrainings = trainings.map((training) =>
      training.id === id
        ? {
            ...training,
            status: newStatus
          }
        : training
    );
  
    setTrainings(updatedTrainings);
    setShowStatusModal(false);
    toast.success(
      "Status Updated",
      `${statusAction.name} is now ${newStatus}`
    );
  };

  const handleGenerateLetter = (training) => {
    console.log('Generate clicked for:', training.trainingCertificateFileName);
  };

  const getEmployeeDetails = (employeeId) => {
    return DUMMY_EMPLOYEES.find(e => e.id === employeeId);
  };

  return (
    <div className="cert-root">
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Training History</h1>
          <p className="cert-subtitle">Manage employee training records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedTraining && !showDocumentActions && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Training
            </button>
          )}
          {(showForm || selectedTraining || showDocumentActions) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedTraining && !showDocumentActions && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

     {showForm ? (
  <div className="cert-form-wrap mb-4">
    <form onSubmit={handleSubmit}>
      <div className="cert-form-section-compact">
        <div className="cert-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',paddingLeft: '10px',paddingTop: '8px' }}>
          <span>Training Details {formRows.length > 1 && <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>({formRows.length} entries)</span>}</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '160px' }}>Employee <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '120px' }}>Employee Code</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '120px' }}>Department</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '120px' }}>Designation</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '140px' }}>Training Name <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '130px' }}>Provider <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '110px' }}>Start Date <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '110px' }}>End Date <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '90px' }}>Hours <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '120px' }}>Certification <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', minWidth: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formRows.map((row, index) => {
                const employee = getEmployeeDetails(row.employeeId);
                const rowError = rowErrors[row.id] || {};
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className={`form-control ${rowError.employeeId ? 'is-invalid' : ''}`}
                          placeholder="Search employee..."
                          value={employee?.name || ''}
                          onChange={(e) => {
                            setEmployeeSearchTerm(e.target.value);
                            setShowEmployeeDropdown(true);
                          }}
                          onFocus={() => {
                            if (employeeSearchTerm.length > 0) {
                              setShowEmployeeDropdown(true);
                            }
                          }}
                          style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                        />
                        {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            right: 0, 
                            background: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '6px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                            zIndex: 1000, 
                            maxHeight: '180px', 
                            overflow: 'auto',
                            marginTop: '2px'
                          }}>
                            {filteredEmployees.length > 0 ? (
                              filteredEmployees.map(emp => (
                                <div
                                  key={emp.id}
                                  style={{ 
                                    padding: '6px 10px', 
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontSize: '12px'
                                  }}
                                  onClick={() => handleEmployeeSelect(row.id, emp)}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <div style={{ fontWeight: 500 }}>{emp.name}</div>
                                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{emp.code} | {emp.department}</div>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '8px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                                No employees found
                              </div>
                            )}
                          </div>
                        )}
                        {rowError.employeeId && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.employeeId}</div>}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input type="text" className="form-control bg-light" value={employee?.code || ''} readOnly placeholder="Auto" style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }} />
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input type="text" className="form-control bg-light" value={employee?.department || ''} readOnly placeholder="Auto" style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }} />
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input type="text" className="form-control bg-light" value={employee?.designation || ''} readOnly placeholder="Auto" style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }} />
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input
                        type="text"
                        className={`form-control ${rowError.trainingName ? 'is-invalid' : ''}`}
                        placeholder="Training name"
                        value={row.trainingName}
                        onChange={(e) => handleRowChange(row.id, 'trainingName', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      />
                      {rowError.trainingName && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.trainingName}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input
                        type="text"
                        className={`form-control ${rowError.trainingProvider ? 'is-invalid' : ''}`}
                        placeholder="Provider"
                        value={row.trainingProvider}
                        onChange={(e) => handleRowChange(row.id, 'trainingProvider', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      />
                      {rowError.trainingProvider && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.trainingProvider}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input
                        type="date"
                        className={`form-control ${rowError.startDate ? 'is-invalid' : ''}`}
                        value={row.startDate}
                        onChange={(e) => handleRowChange(row.id, 'startDate', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      />
                      {rowError.startDate && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.startDate}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input
                        type="date"
                        className={`form-control ${rowError.endDate ? 'is-invalid' : ''}`}
                        value={row.endDate}
                        min={row.startDate}
                        onChange={(e) => handleRowChange(row.id, 'endDate', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      />
                      {rowError.endDate && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.endDate}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input
                        type="number"
                        className={`form-control ${rowError.trainingHours ? 'is-invalid' : ''}`}
                        placeholder="Hours"
                        value={row.trainingHours}
                        onChange={(e) => handleRowChange(row.id, 'trainingHours', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      />
                      {rowError.trainingHours && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.trainingHours}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <select
                        className={`form-control ${rowError.certificationReceived ? 'is-invalid' : ''}`}
                        value={row.certificationReceived}
                        onChange={(e) => handleRowChange(row.id, 'certificationReceived', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      >
                        {certificationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      {rowError.certificationReceived && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.certificationReceived}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Add Row Button */}
                        <button
                          type="button"
                          onClick={addRow}
                          title="Add new row"
                          style={{ 
                            padding: '4px 8px', 
                            background: '#9d174d', 
                            border: 'none', 
                            borderRadius: '4px', 
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaPlus size={11} />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          type="button"
                          className="cert-act cert-act--delete"
                          onClick={() => removeRow(row.id)}
                          title="Remove row"
                          style={{ 
                            padding: '4px 8px', 
                            background: '#fee2e2', 
                            border: 'none', 
                            borderRadius: '4px', 
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          disabled={formRows.length <= 1}
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="cert-form-actions" style={{ marginTop: '15px' }}>
        <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
        <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <FaSave size={12} /> {editingTraining ? 'Update Training' : `Save ${formRows.length} Training(s)`}
        </button>
      </div>
      </div>
      
      
    </form>
  </div> 
        
      ) : selectedTraining ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaChalkboardTeacher size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedTraining.trainingName}</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaBuilding/> {selectedTraining.trainingProvider}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedTraining.certificationReceived}</span></div>
            </div>
          </div>
          <div style={{padding:'32px'}}>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedTraining.employeeId)?.name?.charAt(0)||'?'}</div>
              <div><h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedTraining.employeeId)?.name||selectedTraining.employeeName}</h3><span style={{fontSize:'13px',color:'#64748b'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedTraining.employeeId)?.code||''}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaBuilding size={16} style={{color:'#4f46e5'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Training Provider</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedTraining.trainingProvider}</p></div>
              <div style={{background:'#fffbeb',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCertificate size={16} style={{color:'#f59e0b'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Certification</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:getCertificationColor(selectedTraining.certificationReceived).bg,color:getCertificationColor(selectedTraining.certificationReceived).color}}>{getCertificationColor(selectedTraining.certificationReceived).icon} {selectedTraining.certificationReceived}</span></div>
              <div style={{background:'#ecfdf5',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#059669'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Start Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedTraining.startDate)}</p></div>
              <div style={{background:'#fff1f2',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#dc2626'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>End Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedTraining.endDate)}</p></div>
              <div style={{background:'#f0fdf4',borderRadius:'10px',padding:'16px 18px',border:'1px solid #bbf7d0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#166534'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Duration</span></div><p style={{fontSize:'18px',fontWeight:700,color:'#166534',margin:0}}>{calculateDuration(selectedTraining.startDate,selectedTraining.endDate)}</p></div>
              <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #c7d2fe'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#4f46e5'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Training Hours</span></div><p style={{fontSize:'18px',fontWeight:700,color:'#3730a3',margin:0}}>{selectedTraining.trainingHours} hours</p></div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#ea580c'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedTraining.status==='Active'?'#d1fae5':'#fee2e2',color:selectedTraining.status==='Active'?'#065f46':'#991b1b'}}>{selectedTraining.status||'Active'}</span></div>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}><FaCertificate size={16} style={{color:'#dc2626'}}/> Training Certificate</h4>
              {selectedTraining.certificateFileName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedTraining.certificateFileName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}</div><div><p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedTraining.certificateFileName}</p><span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded certificate</span></div></div>
                  <button onClick={(e)=>handleViewDocument(e,selectedTraining)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}><FaEye size={14}/> View Certificate</button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}><FaCertificate size={36} style={{marginBottom:'12px',opacity:0.3}}/><p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No certificate uploaded</p><span style={{fontSize:'13px'}}>No training certificate has been uploaded</span></div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by training name, provider or employee..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              />
              {searchTerm && (
                <button className="cert-search-clear" onClick={() => { setSearchTerm(''); setPage(0); }}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Training Name</th>                  
                    <th>Provider</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Hours</th>
                    <th>Certification</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrainings.length > 0 ? (
                    currentTrainings.map((training,idx) => (
                      <tr 
                        key={training.id}
                        onClick={() => handleRowClick(training)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>{DUMMY_EMPLOYEES.find(e => e.id === training.employeeId)?.name || training.employeeName}</td>
                        <td><strong>{training.trainingName}</strong></td>
                        <td>{training.trainingProvider}</td>
                        <td>{formatDate(training.startDate)}</td>
                        <td>{formatDate(training.endDate)}</td>
                        <td>{training.trainingHours} hrs</td>
                        <td className="text-center">
                          <span className="cert-status-badge" style={{ 
                            background: training.certificationReceived === 'Yes' ? '#d1fae5' : training.certificationReceived === 'Pending' ? '#fed7aa' : '#f3f4f6',
                            color: training.certificationReceived === 'Yes' ? '#065f46' : training.certificationReceived === 'Pending' ? '#9a3412' : '#6b7280'
                          }}>
                            {training.certificationReceived}
                          </span>
                        </td>
                        <td>
                          <div
                            className="d-flex align-items-center gap-1"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusToggle(
                                training.id,
                                DUMMY_EMPLOYEES.find(e => e.id === training.employeeId)?.name || "",
                                training.status || "Active"
                              );
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "16px",
                                borderRadius: "50px",
                                backgroundColor:
                                  (training.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#d1d5db",
                                position: "relative",
                                transition: ".2s"
                              }}
                            >
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "50%",
                                  background: "#fff",
                                  position: "absolute",
                                  top: "2px",
                                  left:
                                    (training.status || "Active") === "Active"
                                      ? "14px"
                                      : "2px",
                                  transition: ".2s"
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color:
                                  (training.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#94a3b8"
                              }}
                            >
                              {training.status || "Active"}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(training)} 
                              title={training.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={training.status === 'Inactive'}
                              style={{ 
                                opacity: training.status === 'Inactive' ? 0.5 : 1,
                                cursor: training.status === 'Inactive' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="11" className="text-center py-5">No training records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cert-table-footer">
              <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} employees
              </div>
              
              {totalPages > 0 && (
                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    className="cert-page-btn" 
                    disabled={page === 0} 
                    onClick={() => setPage(page - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots" style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button 
                        key={pg} 
                        className={`cert-page-num ${pg === page ? 'active' : ''}`} 
                        onClick={() => setPage(pg)}
                        style={{ 
                          padding: '6px 10px', 
                          border: '1px solid #e5e7eb', 
                          background: pg === page ? '#9d174d' : 'white', 
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontSize: '12px',
                          minWidth: '34px'
                        }}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button 
                    className="cert-page-btn" 
                    disabled={page + 1 >= totalPages} 
                    onClick={() => setPage(page + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {showStatusModal && (
        <div
          className="emp-modal-overlay"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="emp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="emp-modal-icon">
              {statusAction.newStatus === "Active" ? "✅" : "⛔"}
            </div>

            <h3 className="emp-modal-title">
              Confirm Status Change
            </h3>

            <p className="emp-modal-body">
              Are you sure you want to{" "}
              <strong>
                {statusAction.newStatus === "Active"
                  ? "activate"
                  : "deactivate"}
              </strong>{" "}
              <strong>{statusAction.name}</strong>?
            </p>

            <p className="emp-modal-warn">
              {statusAction.newStatus === "Inactive"
                ? "Inactive records cannot be edited until reactivated."
                : "This record will become active again."}
            </p>

            <div className="emp-modal-actions">
              <button
                className="emp-modal-cancel"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>

              <button
                className="emp-modal-confirm"
                onClick={confirmStatusChange}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {documentPreview && (
        <div
          className="emp-modal-overlay"
          onClick={() => setDocumentPreview(null)}
          style={{ zIndex: 1050 }}
        >
          <div
            className="emp-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '900px', 
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                <FaCertificate style={{ marginRight: '8px' }} />
                Certificate Preview
              </h3>
              <button 
                onClick={() => setDocumentPreview(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {documentPreview.data && documentPreview.name && documentPreview.name.endsWith('.pdf') ? (
                <div style={{ 
                  width: '100%', 
                  height: '70vh',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <iframe
                    src={documentPreview.data}
                    width="100%"
                    height="100%"
                    title="PDF Preview"
                    style={{ border: 'none' }}
                  />
                </div>
              ) : documentPreview.data ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={documentPreview.data} 
                    alt="Certificate Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '70vh',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} 
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p>No preview available</p>
                </div>
              )}
              
              <div style={{ 
                marginTop: '20px', 
                padding: '12px 16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: '#111827' }}>{documentPreview.name}</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                    Uploaded certificate
                  </p>
                </div>
                <a 
                  href={documentPreview.data} 
                  download={documentPreview.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#9d174d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  <FaDownload /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cert-table-row-hover:hover {
          background-color: #f9fafb;
          transition: background-color 0.2s ease;
        }
        .is-invalid {
          border-color: #ef4444 !important;
        }
        .is-invalid:focus {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default TrainingHistory;