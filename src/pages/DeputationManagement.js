import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaBuilding, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaUserTie,
  FaFileAlt, FaSearch, FaExchangeAlt, FaClock, FaArrowLeft, FaEye
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';

const DeputationManagement = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [deputations, setDeputations] = useState(initialData?.deputations || [
    { id: 1,employeeId:1, deputationOrderNo: 'DEP/2024/001', deputationOrganization: 'Ministry of Corporate Affairs', startDate: '2024-01-15', endDate: '2024-06-15', deputationType: 'Government', reportingAuthority: 'HR Director', createdAt: '2024-01-15T10:30:00Z', orderFileName: 'deputation_order.pdf', orderFileData: null },
    { id: 2,employeeId:2, deputationOrderNo: 'DEP/2024/002', deputationOrganization: 'PwC India', startDate: '2024-03-01', endDate: '2024-08-31', deputationType: 'Project Based', reportingAuthority: 'Project Director', createdAt: '2024-03-01T11:45:00Z' },
    { id: 3, employeeId:3,deputationOrderNo: 'DEP/2024/003', deputationOrganization: 'Harvard Business School', startDate: '2024-05-10', endDate: '2024-07-20', deputationType: 'Training', reportingAuthority: 'Department Head', createdAt: '2024-05-10T09:15:00Z', orderFileName: 'training_deputation.pdf', orderFileData: null },
    { id: 4, employeeId:4,deputationOrderNo: 'DEP/2024/004', deputationOrganization: 'World Bank', startDate: '2024-08-01', endDate: '2025-01-31', deputationType: 'International', reportingAuthority: 'CEO', createdAt: '2024-08-01T14:20:00Z' },
    { id: 5, employeeId:5,deputationOrderNo: 'DEP/2024/005', deputationOrganization: 'NITI Aayog', startDate: '2024-10-15', endDate: '2025-03-15', deputationType: 'Domestic', reportingAuthority: 'Managing Director', createdAt: '2024-10-15T10:00:00Z' }
  ]);
  
  const [editingDeputation, setEditingDeputation] = useState(null);
  const [selectedDeputation, setSelectedDeputation] = useState(null); // For inline detail view
  const [documentPreview, setDocumentPreview] = useState(null); // For document preview modal
  const [formData, setFormData] = useState({
    deputationOrderNo: '',
    deputationOrganization: '',
    startDate: '',
    endDate: '',
    deputationType: 'Domestic',
    reportingAuthority: '',
    orderFile: null,
    orderFileData: null,
    orderFileName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
   const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusAction, setStatusAction] = useState({
      id: null,
      name: "",
      newStatus: ""
    });
  const [showDocumentActions, setShowDocumentActions] = useState(false);
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

 

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

  // Handle row click for detail view
  const handleRowClick = (deputation) => {
    setSelectedDeputation(deputation);
  };

  // Handle document view
  const handleViewDocument = (e, deputation) => {
    e.stopPropagation();
      setSelectedDeputation(deputation); 
      setShowDocumentActions(true);
    if (deputation.orderFileData) {
      setDocumentPreview({
        data: deputation.orderFileData,
        name: deputation.orderFileName
      });
    } else {
      toast.info('No Document', 'No document has been uploaded for this deputation');
    }
  };
  
  // Deputation Types
  const deputationTypes = [
    { value: 'Domestic', label: 'Domestic Deputation' },
    { value: 'International', label: 'International Deputation' },
    { value: 'Government', label: 'Government Deputation' },
    { value: 'Training', label: 'Training Deputation' },
    { value: 'Project Based', label: 'Project Based Deputation' }
  ];

  // Reporting Authorities
  const reportingAuthorities = [
    { value: 'HR Director', label: 'HR Director' },
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'CEO', label: 'CEO' },
    { value: 'Department Head', label: 'Department Head' },
    { value: 'Project Director', label: 'Project Director' }
  ];

  // Filter deputations by search
  const filteredDeputations = deputations.filter(dep => {
    const search = searchTerm.toLowerCase();
    return dep.deputationOrderNo.toLowerCase().includes(search) ||
           dep.deputationOrganization.toLowerCase().includes(search) ||
           dep.deputationType.toLowerCase().includes(search) ||
           dep.reportingAuthority.toLowerCase().includes(search);
  });

  // Pagination
  const totalItems = filteredDeputations.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentDeputations = filteredDeputations.slice(startIndex, startIndex + rowsPerPage);

 
const handleEmployeeSelect = (employee) => {
  setSelectedEmployee(employee);
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

  // Update existing order numbers
  useEffect(() => {
    setExistingOrderNos(deputations.map(dep => dep.deputationOrderNo));
  }, [deputations]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
          orderFile: file,
          orderFileData: reader.result,
          orderFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'deputationOrderNo') {
      if (!value) error = 'Deputation Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingDeputation || editingDeputation.deputationOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'deputationOrganization' && !value) error = 'Deputation Organization is required';
    else if (field === 'startDate') {
      if (!value) error = 'Start Date is required';
      else if (formData.endDate && new Date(value) > new Date(formData.endDate)) {
        error = 'Start Date must be before End Date';
      }
    }
    else if (field === 'endDate') {
      if (!value) error = 'End Date is required';
      else if (formData.startDate && new Date(value) < new Date(formData.startDate)) {
        error = 'End Date must be after Start Date';
      }
    }
    else if (field === 'deputationType' && !value) error = 'Deputation Type is required';
    else if (field === 'reportingAuthority' && !value) error = 'Reporting Authority is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.deputationOrderNo) {
      newErrors.deputationOrderNo = 'Deputation Order Number is required';
    } else if (existingOrderNos.includes(formData.deputationOrderNo) && 
        (!editingDeputation || editingDeputation.deputationOrderNo !== formData.deputationOrderNo)) {
      newErrors.deputationOrderNo = 'Order Number already exists';
    }
    
    if (!formData.deputationOrganization) newErrors.deputationOrganization = 'Deputation Organization is required';
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start Date is required';
    } else if (formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.startDate = 'Start Date must be before End Date';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End Date is required';
    } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End Date must be after Start Date';
    }
    
    if (!formData.deputationType) newErrors.deputationType = 'Deputation Type is required';
    if (!formData.reportingAuthority) newErrors.reportingAuthority = 'Reporting Authority is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
     const appointmentData = {
    ...formData,
    employeeId: selectedEmployee?.id || null,  
    id: editingDeputation ? editingDeputation.id : Date.now(),
    createdAt: editingDeputation ? editingDeputation.createdAt : new Date().toISOString()
  };
    if (editingDeputation) {
      const updated = deputations.map(dep =>
        dep.id === editingDeputation.id
          ? { ...formData, id: dep.id, createdAt: dep.createdAt }
          : dep
      );
      setDeputations(updated);
      toast.success('Success', 'Deputation updated successfully');
      setEditingDeputation(null);
    } else {
      const newDeputation = {
        id: Date.now(),
        ...formData,
        employeeId: selectedEmployee?.id || employeeId,
        employeeName: selectedEmployee?.name,
        createdAt: new Date().toISOString()
      };
      setDeputations([newDeputation, ...deputations]);
      toast.success('Success', 'Deputation added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
  };

 const handleEdit = (deputation) => {
  if (deputation.status === 'Inactive') {
    toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
    return;
  }
  
  const emp = DUMMY_EMPLOYEES.find(e => e.id === deputation.employeeId);  
  setSelectedEmployee(emp || null); 
  setEditingDeputation(deputation);
  setFormData({
    deputationOrderNo: deputation.deputationOrderNo,
    deputationOrganization: deputation.deputationOrganization,
    startDate: deputation.startDate,
    endDate: deputation.endDate,
    deputationType: deputation.deputationType,
    reportingAuthority: deputation.reportingAuthority,
    orderFile: null,
    orderFileData: deputation.orderFileData,
    orderFileName: deputation.orderFileName
  });
  setEmployeeSearchTerm(emp?.name || '');
  setShowForm(true);
};

  const handleDelete = (id) => {
    setDeputations(deputations.filter(dep => dep.id !== id));
    toast.success('Success', 'Deputation deleted successfully');
  };

 
  const resetForm = () => {
    setFormData({
      deputationOrderNo: '',
      deputationOrganization: '',
      startDate: '',
      endDate: '',
      deputationType: 'Domestic',
      reportingAuthority: '',
      orderFile: null,
      orderFileData: null,
      orderFileName: null
    });
    setErrors({});
    setTouched({});
    setEditingDeputation(null);
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
    setSelectedDeputation(null);
  };

  const getDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '—';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
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
      
        const updatedDeputations = deputations.map((dep) =>
          dep.id === id
            ? {
                ...dep,
                status: newStatus
              }
            : dep
        );
      
        setDeputations(updatedDeputations);
      
        setShowStatusModal(false);
      
        toast.success(
          "Status Updated",
          `${statusAction.name} is now ${newStatus}`
        );
      };

  // Get deputation type color
  const getDeputationTypeColor = (type) => {
    switch(type) {
      case 'Domestic': return { bg: '#d1fae5', color: '#065f46' };
      case 'International': return { bg: '#e0e7ff', color: '#4f46e5' };
      case 'Government': return { bg: '#fef3c7', color: '#92400e' };
      case 'Training': return { bg: '#fce7f3', color: '#9d174d' };
      case 'Project Based': return { bg: '#ffedd5', color: '#9a3412' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };
  
   const handleGenerateLetter = (deputation) => {
    console.log('Generate clicked for:', deputation.deputationOrderNo);
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Deputation Management</h1>
          <p className="cert-subtitle">Manage employee deputation records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedDeputation && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Deputation
            </button>
          )}
          {(showForm || selectedDeputation) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedDeputation && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        // Form View
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Deputation Details</div>
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
                
                {/* Deputation Order Number */}
                <div className={`cert-field-compact ${touched.deputationOrderNo && errors.deputationOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Deputation Order Number</label>
                  <input type="text" placeholder="e.g., DEP/2024/001" value={formData.deputationOrderNo} onChange={(e) => handleChange('deputationOrderNo', e.target.value)} onBlur={() => handleBlur('deputationOrderNo')} />
                  <FieldError msg={errors.deputationOrderNo} />
                </div>
                
                {/* Deputation Organization */}
                <div className={`cert-field-compact ${touched.deputationOrganization && errors.deputationOrganization ? 'has-error' : ''}`}>
                  <label className="required">Deputation Organization</label>
                  <input type="text" placeholder="e.g., Ministry of Corporate Affairs" value={formData.deputationOrganization} onChange={(e) => handleChange('deputationOrganization', e.target.value)} onBlur={() => handleBlur('deputationOrganization')} />
                  <FieldError msg={errors.deputationOrganization} />
                </div>
                
                {/* Start Date */}
                <div className={`cert-field-compact ${touched.startDate && errors.startDate ? 'has-error' : ''}`}>
                  <label className="required">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} onBlur={() => handleBlur('startDate')} />
                  <FieldError msg={errors.startDate} />
                </div>
                
                {/* End Date */}
                <div className={`cert-field-compact ${touched.endDate && errors.endDate ? 'has-error' : ''}`}>
                  <label className="required">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => handleChange('endDate', e.target.value)} onBlur={() => handleBlur('endDate')} />
                  <FieldError msg={errors.endDate} />
                </div>
                
                {/* Deputation Type */}
                <div className={`cert-field-compact ${touched.deputationType && errors.deputationType ? 'has-error' : ''}`}>
                  <label className="required">Deputation Type</label>
                  <select value={formData.deputationType} onChange={(e) => handleChange('deputationType', e.target.value)} onBlur={() => handleBlur('deputationType')}>
                    {deputationTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <FieldError msg={errors.deputationType} />
                </div>
                
                {/* Reporting Authority */}
                <div className={`cert-field-compact ${touched.reportingAuthority && errors.reportingAuthority ? 'has-error' : ''}`}>
                  <label className="required">Reporting Authority</label>
                  <select value={formData.reportingAuthority} onChange={(e) => handleChange('reportingAuthority', e.target.value)} onBlur={() => handleBlur('reportingAuthority')}>
                    <option value="">Select Reporting Authority</option>
                    {reportingAuthorities.map(auth => <option key={auth.value} value={auth.value}>{auth.label}</option>)}
                  </select>
                  <FieldError msg={errors.reportingAuthority} />
                </div>
                
               
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingDeputation ? 'Update Deputation' : 'Save Deputation'}
              </button>
            </div>
          </form>
        </div>
        ) : showDocumentActions && selectedDeputation ? (
          <DocumentActions 
            title="Deputation Letter"
            documentName={selectedDeputation.deputationOrderFileName}
            documentData={selectedDeputation.deputationOrderFileData}
            onGenerate={() => handleGenerateLetter(selectedDeputation)}
            onBack={handleBackToList}
            generateLabel="Generate Letter"
            themeColor="#9d174d"
          />
           ) : selectedDeputation ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaExchangeAlt size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedDeputation.deputationOrderNo}</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaCalendarAlt/> {formatDate(selectedDeputation.createdAt)}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedDeputation.deputationType}</span></div>
            </div>
            {/* <button onClick={handleBackToList} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'white',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}><FaArrowLeft size={12}/> Back</button> */}
          </div>
          <div style={{padding:'32px'}}>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedDeputation.employeeId)?.name?.charAt(0)||'?'}</div>
              <div><h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedDeputation.employeeId)?.name||'Unknown'}</h3><span style={{fontSize:'13px',color:'#64748b'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedDeputation.employeeId)?.code||''}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#fdf2f8',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaBuilding size={16} style={{color:'#9d174d'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Organization</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedDeputation.deputationOrganization}</p></div>
              <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaExchangeAlt size={16} style={{color:'#4f46e5'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Deputation Type</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:'#e0e7ff',color:'#4f46e5'}}>{selectedDeputation.deputationType}</span></div>
              <div style={{background:'#ecfdf5',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#059669'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Start Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedDeputation.startDate)}</p></div>
              <div style={{background:'#fff1f2',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#dc2626'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>End Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedDeputation.endDate)}</p></div>
              <div style={{background:'#f0fdf4',borderRadius:'10px',padding:'16px 18px',border:'1px solid #bbf7d0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#166534'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Duration</span></div><p style={{fontSize:'18px',fontWeight:700,color:'#166534',margin:0}}>{getDuration(selectedDeputation.startDate,selectedDeputation.endDate)}</p></div>
              <div style={{background:'#faf5ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaUserTie size={16} style={{color:'#7c3aed'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Reporting Authority</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedDeputation.reportingAuthority}</p></div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#ea580c'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedDeputation.status==='Active'?'#d1fae5':'#fee2e2',color:selectedDeputation.status==='Active'?'#065f46':'#991b1b'}}>{selectedDeputation.status||'Active'}</span></div>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}><FaFilePdf size={16} style={{color:'#dc2626'}}/> Deputation Order Document</h4>
              {selectedDeputation.orderFileName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedDeputation.orderFileName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}</div><div><p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedDeputation.orderFileName}</p><span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded document</span></div></div>
                  <button onClick={(e)=>handleViewDocument(e,selectedDeputation)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}><FaEye size={14}/> View Document</button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}><FaFileAlt size={36} style={{marginBottom:'12px',opacity:0.3}}/><p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No document uploaded</p><span style={{fontSize:'13px'}}>No deputation order document has been uploaded</span></div>
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
                placeholder="Search by order number, organization, type or reporting authority..."
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

        

          {/* Deputations Table - Updated with all form fields */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Order No.</th>
                    <th>Organization</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Deputation Type</th>
                    <th>Reporting Authority</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDeputations.length > 0 ? (
                    currentDeputations.map((dep,idx) => (
                      <tr 
                        key={dep.id}
                        onClick={() => handleRowClick(dep)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                     <td className="text-center">{startIndex + idx + 1}</td>
                        <td>                        
    {DUMMY_EMPLOYEES.find(e => e.id === dep.employeeId)?.name || 'Unknown'}
</td>
                        <td><strong>{dep.deputationOrderNo}</strong></td>
                        <td>{dep.deputationOrganization}</td>
                        <td>{formatDate(dep.startDate)}</td>
                        <td>{formatDate(dep.endDate)}</td>
                        
                        <td>
                          <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                            {dep.deputationType}
                          </span>
                        </td>
                        <td>{dep.reportingAuthority}</td>
                      
                                               <td>
  <div
    className="d-flex align-items-center gap-1"
    style={{ cursor: "pointer" }}
    onClick={(e) => {
      e.stopPropagation();
      handleStatusToggle(
        dep.id,
        DUMMY_EMPLOYEES.find(e => e.id === dep.employeeId)?.name || "",
        dep.status || "Active"
      );
    }}
  >
    <div
      style={{
        width: "28px",
        height: "16px",
        borderRadius: "50px",
        backgroundColor:
          (dep.status || "Active") === "Active"
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
            (dep.status || "Active") === "Active"
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
          (dep.status || "Active") === "Active"
            ? "#9d174d"
            : "#94a3b8"
      }}
    >
      {dep.status || "Active"}
    </span>
  </div>
</td>
                        <td className="text-center">
  <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
    <button 
      className="cert-act cert-act--edit" 
      onClick={() => handleEdit(dep)} 
      title={dep.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
      disabled={dep.status === 'Inactive'}
      style={{ 
        opacity: dep.status === 'Inactive' ? 0.5 : 1,
        cursor: dep.status === 'Inactive' ? 'not-allowed' : 'pointer'
      }}
    >
      <FaEdit size={12} />
    </button>
  </div>
</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="text-center py-5">No deputation records found</td>
                    </tr>
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
                <FaFileAlt style={{ marginRight: '8px' }} />
                Document Preview
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
                    alt="Document Preview" 
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
                    Uploaded document
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
                  <FaFileAlt /> Download
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

export default DeputationManagement;