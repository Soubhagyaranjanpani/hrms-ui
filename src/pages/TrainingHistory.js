
import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaChalkboardTeacher, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaUserTie, FaEye, FaDownload, FaClock, FaCertificate, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const TrainingHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [trainings, setTrainings] = useState(initialData?.trainings || [
    { id: 1, trainingName: 'Advanced React Development', trainingProvider: 'Udemy', startDate: '2024-01-15', endDate: '2024-02-15', certificationReceived: 'Yes', trainingHours: '40', duration: '32 days', createdAt: '2024-01-15T10:30:00Z', employeeName: 'John Doe', employeeId: 1 },
    { id: 2, trainingName: 'Leadership Program', trainingProvider: 'Harvard Business School', startDate: '2024-03-01', endDate: '2024-03-10', certificationReceived: 'Yes', trainingHours: '30', duration: '10 days', createdAt: '2024-03-01T11:45:00Z', employeeName: 'Jane Smith', employeeId: 2 },
    { id: 3, trainingName: 'Cloud Architecture', trainingProvider: 'AWS', startDate: '2024-05-10', endDate: '2024-06-10', certificationReceived: 'Pending', trainingHours: '50', duration: '32 days', createdAt: '2024-05-10T09:15:00Z', employeeName: 'Mike Johnson', employeeId: 3 },
    { id: 4, trainingName: 'Sales Fundamentals', trainingProvider: 'Salesforce', startDate: '2024-07-05', endDate: '2024-07-20', certificationReceived: 'Yes', trainingHours: '25', duration: '16 days', createdAt: '2024-07-05T14:20:00Z', employeeName: 'Sarah Williams', employeeId: 4 },
    { id: 5, trainingName: 'Accounting Software', trainingProvider: 'Tally', startDate: '2024-09-12', endDate: '2024-09-30', certificationReceived: 'No', trainingHours: '35', duration: '19 days', createdAt: '2024-09-12T10:00:00Z', employeeName: 'David Brown', employeeId: 5 }
  ]);
  
  const [editingTraining, setEditingTraining] = useState(null);
  const [formData, setFormData] = useState({
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
  });
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

   // Employee Search State
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  
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

  const certificationOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
    { value: 'Pending', label: 'Pending' }
  ];

  // Filter trainings by search
  const filteredTrainings = trainings.filter(training => {
    const search = searchTerm.toLowerCase();
    return training.trainingName.toLowerCase().includes(search) ||
           training.trainingProvider.toLowerCase().includes(search) ||
           training.employeeName.toLowerCase().includes(search);
  });

  // Pagination
  const totalItems = filteredTrainings.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
const currentTrainings = filteredTrainings.slice(startIndex, startIndex + rowsPerPage);
  
const handleEmployeeSelect = (employee) => {
  setSelectedEmployee(employee);
  setFormData(prev => ({
    ...prev,
    employeeId: employee.id,
    employeeName: employee.name
  }));
  setEmployeeSearchTerm(employee.name);
  setShowEmployeeDropdown(false);
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

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('File too large', 'Maximum file size is 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          certificateFile: file,
          certificateFileData: reader.result,
          certificateFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'trainingName' && !value) error = 'Training Name is required';
    else if (field === 'trainingProvider' && !value) error = 'Training Provider is required';
    else if (field === 'startDate' && !value) error = 'Start Date is required';
    else if (field === 'endDate') {
      if (!value) error = 'End Date is required';
      else if (formData.startDate && new Date(value) < new Date(formData.startDate)) {
        error = 'End Date must be after Start Date';
      }
    }
    else if (field === 'trainingHours' && !value) error = 'Training Hours is required';
    else if (field === 'certificationReceived' && !value) error = 'Certification Received is required';
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
    
    if (!formData.trainingName) newErrors.trainingName = 'Training Name is required';
    if (!formData.trainingProvider) newErrors.trainingProvider = 'Training Provider is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    if (!formData.endDate) {
      newErrors.endDate = 'End Date is required';
    } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End Date must be after Start Date';
    }
    if (!formData.trainingHours) newErrors.trainingHours = 'Training Hours is required';
    if (!formData.certificationReceived) newErrors.certificationReceived = 'Certification Received is required';
    if (!formData.employeeId) newErrors.employeeId = 'Employee is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const handleEmployeeSelect = (employee) => {
  //   setSelectedEmployee(employee);
  //   setFormData(prev => ({
  //     ...prev,
  //     employeeId: employee.id,
  //     employeeName: employee.name
  //   }));
  //   setEmployeeSearchTerm('');
  //   setShowDropdown(false);
  // };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    const trainingData = {
      ...formData,
      id: editingTraining ? editingTraining.id : Date.now(),
      duration: calculateDuration(formData.startDate, formData.endDate),
      createdAt: editingTraining ? editingTraining.createdAt : new Date().toISOString()
    };
    
    if (editingTraining) {
      const updated = trainings.map(t =>
        t.id === editingTraining.id ? trainingData : t
      );
      setTrainings(updated);
      toast.success('Success', 'Training updated successfully');
      setEditingTraining(null);
    } else {
      setTrainings([trainingData, ...trainings]);
      toast.success('Success', 'Training added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (training) => {
    setEditingTraining(training);
    setSelectedEmployee({ id: training.employeeId, name: training.employeeName });
    setFormData({
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
    });
    setShowForm(true);
  };

  const handleView = (training) => {
    setViewingTraining(training);
    setShowViewModal(true);
  };

  const handleDelete = (id) => {
    setTrainings(trainings.filter(t => t.id !== id));
    toast.success('Success', 'Training deleted successfully');
  };

  const resetForm = () => {
    setFormData({
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
    });
    setErrors({});
    setTouched({});
    setEditingTraining(null);
    setSelectedEmployee(null);
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

  // Calculate stats
  const totalTrainings = trainings.length;
  const certifiedTrainings = trainings.filter(t => t.certificationReceived === 'Yes').length;
  const totalHours = trainings.reduce((sum, t) => sum + (parseInt(t.trainingHours) || 0), 0);

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Training History</h1>
          <p className="cert-subtitle">Manage employee training records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Training
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
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="cert-form-wrap mb-4">
  <form onSubmit={handleSubmit} className="cert-form-compact">
    <div className="cert-form-section-compact">
      <div className="cert-section-label">Training Details</div>
      <div className="cert-form-grid-3col">   
        <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
          <label className="required">Employee Name</label>
          <div className="position-relative">
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaSearch size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Type employee name to search..."
                value={employeeSearchTerm}
                onChange={(e) => {
                  setEmployeeSearchTerm(e.target.value);
                  setShowEmployeeDropdown(true);
                }}
                onFocus={() => setShowEmployeeDropdown(true)}
              />
            </div>
            
            {showEmployeeDropdown && employeeSearchTerm && (
              <div className="card position-absolute top-100 start-0 end-0 mt-1 shadow-lg" style={{ zIndex: 1000, maxHeight: '250px', overflow: 'auto' }}>
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
        </div>
        
        {/* Employee Code - Auto Populate */}
        <div className="cert-field-compact">
          <label>Employee Code</label>
          <input type="text" className="form-control bg-light" value={selectedEmployee?.code || ''} readOnly placeholder="Auto-populated" />
        </div>
        
        {/* Department - Auto Populate */}
        <div className="cert-field-compact">
          <label>Department</label>
          <input type="text" className="form-control bg-light" value={selectedEmployee?.department || ''} readOnly placeholder="Auto-populated" />
        </div>
        
        {/* Designation - Auto Populate */}
        <div className="cert-field-compact">
          <label>Designation</label>
          <input type="text" className="form-control bg-light" value={selectedEmployee?.designation || ''} readOnly placeholder="Auto-populated" />
        </div>
                   
        <div className={`cert-field-compact ${touched.trainingName && errors.trainingName ? 'has-error' : ''}`}>
          <label className="required">Training Name</label>
          <input type="text" placeholder="e.g., Advanced React Development" value={formData.trainingName} onChange={(e) => handleChange('trainingName', e.target.value)} onBlur={() => handleBlur('trainingName')} />
          <FieldError msg={errors.trainingName} />
        </div>
        
        <div className={`cert-field-compact ${touched.trainingProvider && errors.trainingProvider ? 'has-error' : ''}`}>
          <label className="required">Training Provider</label>
          <input type="text" placeholder="e.g., Udemy, Coursera" value={formData.trainingProvider} onChange={(e) => handleChange('trainingProvider', e.target.value)} onBlur={() => handleBlur('trainingProvider')} />
          <FieldError msg={errors.trainingProvider} />
        </div>
        
        <div className={`cert-field-compact ${touched.startDate && errors.startDate ? 'has-error' : ''}`}>
          <label className="required">Start Date</label>
          <input type="date" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} onBlur={() => handleBlur('startDate')} />
          <FieldError msg={errors.startDate} />
        </div>
        
        <div className={`cert-field-compact ${touched.endDate && errors.endDate ? 'has-error' : ''}`}>
          <label className="required">End Date</label>
          <input type="date" value={formData.endDate} min={formData.startDate} onChange={(e) => handleChange('endDate', e.target.value)} onBlur={() => handleBlur('endDate')} />
          <FieldError msg={errors.endDate} />
        </div>
        
        <div className={`cert-field-compact ${touched.trainingHours && errors.trainingHours ? 'has-error' : ''}`}>
          <label className="required">Training Hours</label>
          <input type="number" placeholder="e.g., 40" value={formData.trainingHours} onChange={(e) => handleChange('trainingHours', e.target.value)} onBlur={() => handleBlur('trainingHours')} />
          <FieldError msg={errors.trainingHours} />
        </div>
        
        <div className={`cert-field-compact ${touched.certificationReceived && errors.certificationReceived ? 'has-error' : ''}`}>
          <label className="required">Certification Received</label>
          <select value={formData.certificationReceived} onChange={(e) => handleChange('certificationReceived', e.target.value)} onBlur={() => handleBlur('certificationReceived')}>
            {certificationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <FieldError msg={errors.certificationReceived} />
        </div>
        
        <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
          <label>Certificate Upload</label>
          <div className="border rounded p-3 text-center bg-light">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="certificate-upload" />
            <label htmlFor="certificate-upload" className="btn btn-outline-primary btn-sm">
              <FaUpload size={12} /> Choose File
            </label>
            {formData.certificateFileName && (
              <div className="mt-2 text-primary">
                {formData.certificateFileName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.certificateFileName}
              </div>
            )}
            <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
          </div>
        </div>
      </div>
    </div>
    
    <div className="cert-form-actions">
      <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
      <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <FaSave size={12} /> {editingTraining ? 'Update Training' : 'Save Training'}
      </button>
    </div>
  </form>
</div>
      ) : (
        <>
          {/* Search Bar */}
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


          {/* Trainings Table */}
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
                    <th>Certificate</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrainings.length > 0 ? (
                    currentTrainings.map((training,idx) => (
                      <tr key={training.id}>
                     <td className="text-center">{startIndex + idx + 1}</td>

                         <td>{training.employeeName}</td>
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
                        <td className="text-center">
                          {training.certificateFileName ? (
                            <a href={training.certificateFileData} download={training.certificateFileName} className="btn btn-sm btn-outline-primary">
                              <FaFileAlt size={12} /> View
                            </a>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center">
                          <div className="cert-actions">
                           
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(training)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(training.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="10" className="text-center py-5">No training records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            
           {/* Pagination */}
            {/* Pagination */}
{totalItems > 0 && (
  <div className="emp-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span className="emp-page-info">
        Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} events
      </span>
    </div>
    <div className="emp-page-controls">
      <button 
        className="emp-page-btn" 
        disabled={page === 0} 
        onClick={() => setPage(page - 1)}
      >
        ← Prev
      </button>
      {getPaginationRange().map((pg, i) =>
        pg === '...' ? (
          <span key={`dots-${i}`} className="emp-page-dots">…</span>
        ) : (
          <button 
            key={pg} 
            className={`emp-page-num ${pg === page ? 'active' : ''}`} 
            onClick={() => setPage(pg)}
          >
            {pg + 1}
          </button>
        )
      )}
      <button 
        className="emp-page-btn" 
        disabled={page + 1 >= totalPages} 
        onClick={() => setPage(page + 1)}
      >
        Next →
      </button>
    </div>
  </div>
)}
          </div>

        
        </>
      )}
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default TrainingHistory;