import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaChalkboardTeacher, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaUserTie, FaEye, FaDownload, FaClock, FaCertificate, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const TrainingHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [trainings, setTrainings] = useState(initialData?.trainings || [
    { id: 1, trainingName: 'Advanced React Development', trainingProvider: 'Udemy', startDate: '2024-01-15', endDate: '2024-02-15', certificationReceived: 'Yes', trainingHours: '40', duration: '32 days', createdAt: '2024-01-15T10:30:00Z', employeeName: 'John Doe', employeeId: 1, certificateFileName: 'react_certificate.pdf', certificateFileData: null },
    { id: 2, trainingName: 'Leadership Program', trainingProvider: 'Harvard Business School', startDate: '2024-03-01', endDate: '2024-03-10', certificationReceived: 'Yes', trainingHours: '30', duration: '10 days', createdAt: '2024-03-01T11:45:00Z', employeeName: 'Jane Smith', employeeId: 2 },
    { id: 3, trainingName: 'Cloud Architecture', trainingProvider: 'AWS', startDate: '2024-05-10', endDate: '2024-06-10', certificationReceived: 'Pending', trainingHours: '50', duration: '32 days', createdAt: '2024-05-10T09:15:00Z', employeeName: 'Mike Johnson', employeeId: 3, certificateFileName: 'aws_cert.pdf', certificateFileData: null },
    { id: 4, trainingName: 'Sales Fundamentals', trainingProvider: 'Salesforce', startDate: '2024-07-05', endDate: '2024-07-20', certificationReceived: 'Yes', trainingHours: '25', duration: '16 days', createdAt: '2024-07-05T14:20:00Z', employeeName: 'Sarah Williams', employeeId: 4 },
    { id: 5, trainingName: 'Accounting Software', trainingProvider: 'Tally', startDate: '2024-09-12', endDate: '2024-09-30', certificationReceived: 'No', trainingHours: '35', duration: '19 days', createdAt: '2024-09-12T10:00:00Z', employeeName: 'David Brown', employeeId: 5 }
  ]);
  
  const [editingTraining, setEditingTraining] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null); // For inline detail view
  const [documentPreview, setDocumentPreview] = useState(null); // For document preview modal
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
   const [showStatusModal, setShowStatusModal] = useState(false);
      const [statusAction, setStatusAction] = useState({
        id: null,
        name: "",
        newStatus: ""
      });

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

  // Handle row click for detail view
  const handleRowClick = (training) => {
    setSelectedTraining(training);
  };

  // Handle document view
  const handleViewDocument = (e, training) => {
    e.stopPropagation(); // Prevent row click
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
    if (training.status === 'Inactive') {
      toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
      return;
    }
    
    const emp = DUMMY_EMPLOYEES.find(e => e.id === training.employeeId);
    setSelectedEmployee(emp || null);
    setEditingTraining(training);
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
    setEmployeeSearchTerm(emp?.name || '');
    setShowForm(true);
  };

  const handleView = (training) => {
    setViewingTraining(training);
    setShowViewModal(true);
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
    setSelectedTraining(null);
  };

  // Calculate stats
  const totalTrainings = trainings.length;
  const certifiedTrainings = trainings.filter(t => t.certificationReceived === 'Yes').length;
  const totalHours = trainings.reduce((sum, t) => sum + (parseInt(t.trainingHours) || 0), 0);

  // Get certification status color
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

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Training History</h1>
          <p className="cert-subtitle">Manage employee training records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedTraining && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Training
            </button>
          )}
          {(showForm || selectedTraining) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedTraining && onCancel && (
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
          <div className="position-relative" style={{ maxWidth: '500px' }}>
    <div className="input-group">
      <input
        type="text"
        className="form-control"
        placeholder="Type employee name to search..."
        value={employeeSearchTerm}
        onChange={(e) => {
          setEmployeeSearchTerm(e.target.value);
          setShowEmployeeDropdown(true);
        }}
        onFocus={() => {
          if (employeeSearchTerm.length > 0) {
            setShowEmployeeDropdown(true);
          }
        }}
        style={{ fontSize: '14px', padding: '6px 12px' }}
      />
    </div>
    
    {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
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
            ) : selectedTraining ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaChalkboardTeacher size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedTraining.trainingName}</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaBuilding/> {selectedTraining.trainingProvider}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedTraining.certificationReceived}</span></div>
            </div>
            {/* <button onClick={handleBackToList} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'white',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}><FaArrowLeft size={12}/> Back</button> */}
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

            
            {/* Pagination */}
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

      {/* Document Preview Modal */}
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

      {/* Add CSS for row hover effect */}
      <style jsx>{`
        .cert-table-row-hover:hover {
          background-color: #f9fafb;
          transition: background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default TrainingHistory;