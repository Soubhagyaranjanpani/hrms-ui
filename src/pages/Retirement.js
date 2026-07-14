import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaUserTie, FaEye, FaDownload, FaRupeeSign, FaClock, FaArrowLeft,FaCheckCircle
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';

const RetirementRecords = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [retirements, setRetirements] = useState(initialData?.retirements || [
    { id: 1, retirementDate: '2045-12-31', retirementType: 'Superannuation', pensionEligibility: 'Yes', pensionNumber: 'PEN/2045/001', retirementOrder: 'ORD/RET/2045/001', retirementBenefits: 'Gratuity, Provident Fund, Leave Encashment', createdAt: '2024-01-15T10:30:00Z', employeeName: 'John Doe', employeeCode: 'EMP001', superannuationDate: '2045-12-31', employeeId: 1, retirementOrderFileName: 'retirement_order.pdf', retirementOrderFileData: null },
    { id: 2, retirementDate: '2040-06-15', retirementType: 'Superannuation', pensionEligibility: 'Yes', pensionNumber: 'PEN/2040/002', retirementOrder: 'ORD/RET/2040/002', retirementBenefits: 'Gratuity, Provident Fund', createdAt: '2024-02-20T11:45:00Z', employeeName: 'Jane Smith', employeeCode: 'EMP002', superannuationDate: '2040-06-15', employeeId: 2 },
    { id: 3, retirementDate: '2042-03-20', retirementType: 'Voluntary', pensionEligibility: 'Pending', pensionNumber: '', retirementOrder: 'ORD/RET/2042/003', retirementBenefits: 'Pending approval', createdAt: '2024-03-10T09:15:00Z', employeeName: 'Mike Johnson', employeeCode: 'EMP003', superannuationDate: '2042-03-20', employeeId: 3, retirementOrderFileName: 'voluntary_retirement.pdf', retirementOrderFileData: null },
    { id: 4, retirementDate: '2038-08-10', retirementType: 'Medical', pensionEligibility: 'Yes', pensionNumber: 'PEN/2038/004', retirementOrder: 'ORD/RET/2038/004', retirementBenefits: 'Medical benefits, Provident Fund', createdAt: '2024-04-05T14:20:00Z', employeeName: 'Sarah Williams', employeeCode: 'EMP004', superannuationDate: '2038-08-10', employeeId: 4 },
    { id: 5, retirementDate: '2048-01-05', retirementType: 'Superannuation', pensionEligibility: 'No', pensionNumber: '', retirementOrder: 'ORD/RET/2048/005', retirementBenefits: 'Provident Fund only', createdAt: '2024-05-12T10:00:00Z', employeeName: 'David Brown', employeeCode: 'EMP005', superannuationDate: '2048-01-05', employeeId: 5 }
  ]);
  
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null); // For inline detail view
  const [documentPreview, setDocumentPreview] = useState(null); // For document preview modal
  const [formData, setFormData] = useState({
    retirementDate: '',
    retirementType: 'Superannuation',
    pensionEligibility: 'Yes',
    pensionNumber: '',
    retirementOrder: '',
    retirementBenefits: '',
    retirementOrderFile: null,
    retirementOrderFileData: null,
    retirementOrderFileName: null,
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    superannuationDate: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: "",
    newStatus: ""
  });
   const [selectedRetirement, setSelectedRetirement] = useState(null); 
   const [showDocumentActions, setShowDocumentActions] = useState(false);
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer', superannuationDate: '2045-12-31' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager', superannuationDate: '2040-06-15' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer', superannuationDate: '2042-03-20' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager', superannuationDate: '2038-08-10' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant', superannuationDate: '2048-01-05' }
  ];

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

  // Handle row click for detail view
  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  // Handle document view
  const handleViewDocument = (e, record) => {
    e.stopPropagation(); 
     setSelectedRetirement(record); 
    setShowDocumentActions(true);
    if (record.retirementOrderFileData) {
      setDocumentPreview({
        data: record.retirementOrderFileData,
        name: record.retirementOrderFileName
      });
    } else {
      toast.info('No Document', 'No retirement order document has been uploaded');
    }
  };

  // Filter retirements by search
  const filteredRetirements = retirements.filter(record => {
    const search = searchTerm.toLowerCase();
    return record.employeeName.toLowerCase().includes(search) ||
           record.retirementType.toLowerCase().includes(search) ||
           record.pensionNumber.toLowerCase().includes(search);
  });

  // Pagination
  const totalItems = filteredRetirements.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentRetirements = filteredRetirements.slice(startIndex, startIndex + rowsPerPage);

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

  const retirementTypes = [
    { value: 'Superannuation', label: 'Superannuation' },
    { value: 'Voluntary', label: 'Voluntary Retirement' },
    { value: 'Medical', label: 'Medical Retirement' },
    { value: 'Compulsory', label: 'Compulsory Retirement' },
    { value: 'Early', label: 'Early Retirement' },
    { value: 'VRS', label: 'Voluntary Retirement Scheme (VRS)' }
  ];

  const pensionEligibilityOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
    { value: 'Pending', label: 'Pending' }
  ];

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
          retirementOrderFile: file,
          retirementOrderFileData: reader.result,
          retirementOrderFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'retirementDate') {
      if (!value) error = 'Retirement Date is required';
      else if (formData.superannuationDate) {
        if (new Date(value) < new Date(formData.superannuationDate)) {
          error = 'Retirement Date must be on or after Superannuation Date';
        }
      }
    }
    else if (field === 'retirementType' && !value) error = 'Retirement Type is required';
    else if (field === 'pensionEligibility' && !value) error = 'Pension Eligibility is required';
    else if (field === 'pensionNumber') {
      if (formData.pensionEligibility === 'Yes' && !value) {
        error = 'Pension Number is required when pension is eligible';
      }
    }
    else if (field === 'retirementOrder' && !value) error = 'Retirement Order is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.retirementDate) {
      newErrors.retirementDate = 'Retirement Date is required';
    } else if (formData.superannuationDate) {
      if (new Date(formData.retirementDate) < new Date(formData.superannuationDate)) {
        newErrors.retirementDate = 'Retirement Date must be on or after Superannuation Date';
      }
    }
    
    if (!formData.retirementType) newErrors.retirementType = 'Retirement Type is required';
    if (!formData.pensionEligibility) newErrors.pensionEligibility = 'Pension Eligibility is required';
    
    if (formData.pensionEligibility === 'Yes' && !formData.pensionNumber) {
      newErrors.pensionNumber = 'Pension Number is required';
    }
    
    if (!formData.retirementOrder) newErrors.retirementOrder = 'Retirement Order is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      ...formData,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.code,
      superannuationDate: employee.superannuationDate
    });
    setEmployeeSearchTerm('');
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    const recordData = {
      ...formData,
      id: editingRecord ? editingRecord.id : Date.now(),
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString()
    };
    
    if (editingRecord) {
      const updated = retirements.map(r =>
        r.id === editingRecord.id ? recordData : r
      );
      setRetirements(updated);
      toast.success('Success', 'Retirement record updated successfully');
      setEditingRecord(null);
    } else {
      setRetirements([recordData, ...retirements]);
      toast.success('Success', 'Retirement record added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
  };

 const handleEdit = (record) => {
  if (record.status === 'Inactive') {
    toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
    return;
  }
  
  const emp = DUMMY_EMPLOYEES.find(e => e.id === record.employeeId);
  setSelectedEmployee(emp || null);
  setEditingRecord(record);
  setFormData({
    retirementDate: record.retirementDate,
    retirementType: record.retirementType,
    pensionEligibility: record.pensionEligibility,
    pensionNumber: record.pensionNumber || '',
    retirementOrder: record.retirementOrder,
    retirementBenefits: record.retirementBenefits || '',
    retirementOrderFile: null,
    retirementOrderFileData: record.retirementOrderFileData,
    retirementOrderFileName: record.retirementOrderFileName,
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    employeeCode: record.employeeCode,
    superannuationDate: record.superannuationDate
  });
  setEmployeeSearchTerm(emp?.name || '');
  setShowForm(true);
};

  const resetForm = () => {
    setFormData({
      retirementDate: '',
      retirementType: 'Superannuation',
      pensionEligibility: 'Yes',
      pensionNumber: '',
      retirementOrder: '',
      retirementBenefits: '',
      retirementOrderFile: null,
      retirementOrderFileData: null,
      retirementOrderFileName: null,
      employeeId: '',
      employeeName: '',
      employeeCode: '',
      superannuationDate: ''
    });
    setErrors({});
    setTouched({});
    setEditingRecord(null);
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
    setSelectedRecord(null);
  };

  // Calculate stats
  const totalRetirements = retirements.length;
  const pensionEligible = retirements.filter(r => r.pensionEligibility === 'Yes').length;
  const upcomingRetirements = retirements.filter(r => new Date(r.retirementDate) > new Date()).length;

  // Get retirement type color
  const getRetirementTypeColor = (type) => {
    switch(type) {
      case 'Superannuation': return { bg: '#d1fae5', color: '#065f46' };
      case 'Voluntary': return { bg: '#e0e7ff', color: '#4f46e5' };
      case 'Medical': return { bg: '#fee2e2', color: '#991b1b' };
      case 'Compulsory': return { bg: '#fef3c7', color: '#92400e' };
      case 'Early': return { bg: '#fce7f3', color: '#9d174d' };
      case 'VRS': return { bg: '#ffedd5', color: '#9a3412' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  // Get pension eligibility color
  const getPensionEligibilityColor = (status) => {
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
  
    const updatedRecord = retirements.map((r) =>
      r.id === id
        ? {
            ...r,
            status: newStatus
          }
        : r
    );
  
    setRetirements(updatedRecord);
  
    setShowStatusModal(false);
  
    toast.success(
      "Status Updated",
      `${statusAction.name} is now ${newStatus}`
    );
  };

    const handleGenerateLetter = (retirement) => {
    console.log('Generate clicked for:', retirement.retirementOrderNo);
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Retirement Records</h1>
          <p className="cert-subtitle">Manage employee retirement records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedRecord && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Retirement Record
            </button>
          )}
          {(showForm || selectedRecord) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedRecord && onCancel && (
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
              <div className="cert-section-label">Retirement Details</div>
              <div className="cert-form-grid-3col">
                {/* Employee Selection */}
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
                     
                <div className={`cert-field-compact ${touched.retirementDate && errors.retirementDate ? 'has-error' : ''}`}>
                  <label className="required">Retirement Date</label>
                  <input type="date" value={formData.retirementDate} min={formData.superannuationDate} onChange={(e) => handleChange('retirementDate', e.target.value)} onBlur={() => handleBlur('retirementDate')} />
                  <FieldError msg={errors.retirementDate} />
                  <small>Must be on or after superannuation date</small>
                </div>
                
                <div className={`cert-field-compact ${touched.retirementType && errors.retirementType ? 'has-error' : ''}`}>
                  <label className="required">Retirement Type</label>
                  <select value={formData.retirementType} onChange={(e) => handleChange('retirementType', e.target.value)} onBlur={() => handleBlur('retirementType')}>
                    {retirementTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <FieldError msg={errors.retirementType} />
                </div>
                
                <div className={`cert-field-compact ${touched.pensionEligibility && errors.pensionEligibility ? 'has-error' : ''}`}>
                  <label className="required">Pension Eligibility</label>
                  <select value={formData.pensionEligibility} onChange={(e) => handleChange('pensionEligibility', e.target.value)} onBlur={() => handleBlur('pensionEligibility')}>
                    {pensionEligibilityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <FieldError msg={errors.pensionEligibility} />
                </div>
                
                <div className={`cert-field-compact ${touched.pensionNumber && errors.pensionNumber ? 'has-error' : ''}`}>
                  <label className="required">Pension Number {formData.pensionEligibility === 'Yes' && '*'}</label>
                  <input type="text" placeholder="e.g., PEN/2024/001" value={formData.pensionNumber} onChange={(e) => handleChange('pensionNumber', e.target.value)} onBlur={() => handleBlur('pensionNumber')} />
                  <FieldError msg={errors.pensionNumber} />
                </div>
                
                <div className={`cert-field-compact ${touched.retirementOrder && errors.retirementOrder ? 'has-error' : ''}`}>
                  <label className="required">Retirement Order</label>
                  <input type="text" placeholder="e.g., ORD/RET/2024/001" value={formData.retirementOrder} onChange={(e) => handleChange('retirementOrder', e.target.value)} onBlur={() => handleBlur('retirementOrder')} />
                  <FieldError msg={errors.retirementOrder} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Retirement Benefits</label>
                  <textarea rows="2" placeholder="e.g., Gratuity, Leave Encashment, Provident Fund" value={formData.retirementBenefits} onChange={(e) => handleChange('retirementBenefits', e.target.value)} />
                </div>
                
                {/* <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Retirement Order Upload</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="retirement-order-upload" />
                    <label htmlFor="retirement-order-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.retirementOrderFileName && (
                      <div className="mt-2 text-primary">
                        {formData.retirementOrderFileName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.retirementOrderFileName}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
                  </div>
                </div> */}
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingRecord ? 'Update Record' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
        
           ) : showDocumentActions && selectedRetirement ? (
                  <DocumentActions 
                    title="Retirement Letter"
                    documentName={selectedRetirement.retirementOrderFileName}
                    documentData={selectedRetirement.retirementOrderFileData}
                    onGenerate={() => handleGenerateLetter(selectedRetirement)}
                    onBack={handleBackToList}
                    generateLabel="Generate Letter"
                    themeColor="#9d174d"
                  />

           ) : selectedRecord ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaCalendarAlt size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>Retirement Record</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaCalendarAlt/> {formatDate(selectedRecord.createdAt)}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedRecord.retirementType}</span></div>
            </div>
            {/* <button onClick={handleBackToList} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'white',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}><FaArrowLeft size={12}/> Back</button> */}
          </div>
          <div style={{padding:'32px'}}>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedRecord.employeeId)?.name?.charAt(0)||'?'}</div>
              <div><h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>{selectedRecord.employeeName}</h3><span style={{fontSize:'13px',color:'#64748b'}}>{selectedRecord.employeeCode}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#fff1f2',borderRadius:'10px',padding:'16px 18px',border:'1px solid #fecaca'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#dc2626'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Retirement Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#991b1b',margin:0}}>{formatDate(selectedRecord.retirementDate)}</p></div>
              <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaBuilding size={16} style={{color:'#4f46e5'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Retirement Type</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:getRetirementTypeColor(selectedRecord.retirementType).bg,color:getRetirementTypeColor(selectedRecord.retirementType).color}}>{selectedRecord.retirementType}</span></div>
              <div style={{background:'#ecfdf5',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCheckCircle size={16} style={{color:'#059669'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Pension Eligibility</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:getPensionEligibilityColor(selectedRecord.pensionEligibility).bg,color:getPensionEligibilityColor(selectedRecord.pensionEligibility).color}}>{getPensionEligibilityColor(selectedRecord.pensionEligibility).icon} {selectedRecord.pensionEligibility}</span></div>
              <div style={{background:'#f8fafc',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaFileAlt size={16} style={{color:'#6b7280'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Pension Number</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedRecord.pensionNumber||'—'}</p></div>
              <div style={{background:'#f8fafc',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaFileAlt size={16} style={{color:'#6b7280'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Retirement Order</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedRecord.retirementOrder}</p></div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#ea580c'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedRecord.status==='Active'?'#d1fae5':'#fee2e2',color:selectedRecord.status==='Active'?'#065f46':'#991b1b'}}>{selectedRecord.status||'Active'}</span></div>
            </div>
            <div style={{background:'#f0fdf4',borderRadius:'12px',padding:'20px',marginBottom:'24px',border:'1px solid #bbf7d0'}}>
              <label style={{fontSize:'14px',fontWeight:600,color:'#166534',display:'block',marginBottom:'8px'}}><FaRupeeSign style={{marginRight:'8px'}}/> Retirement Benefits</label>
              <p style={{fontSize:'15px',color:'#065f46',margin:0,lineHeight:1.6,fontWeight:500}}>{selectedRecord.retirementBenefits||'No benefits specified'}</p>
            </div>
            <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #c7d2fe',marginBottom:'24px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#4f46e5'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Superannuation Date</span></div>
              <p style={{fontSize:'15px',fontWeight:600,color:'#3730a3',margin:0}}>{formatDate(selectedRecord.superannuationDate)}</p>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}><FaFilePdf size={16} style={{color:'#dc2626'}}/> Retirement Order Document</h4>
              {selectedRecord.retirementOrderFileName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedRecord.retirementOrderFileName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}</div><div><p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedRecord.retirementOrderFileName}</p><span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded document</span></div></div>
                  <button onClick={(e)=>handleViewDocument(e,selectedRecord)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}><FaEye size={14}/> View Document</button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}><FaFileAlt size={36} style={{marginBottom:'12px',opacity:0.3}}/><p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No document uploaded</p><span style={{fontSize:'13px'}}>No retirement order document has been uploaded</span></div>
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
                placeholder="Search by employee name, retirement type or pension number..."
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

        

          {/* Retirement Records Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Retirement Date</th>
                    <th>Retirement Type</th>
                    <th>Pension Eligibility</th>
                    <th>Pension Number</th>
                    <th>Retirement Order</th>
                    <th>Benefits</th>
                   <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRetirements.length > 0 ? (
                    currentRetirements.map((record,idx) => (
                      <tr 
                        key={record.id}
                        onClick={() => handleRowClick(record)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                     <td className="text-center">{startIndex + idx + 1}</td>
                        <td><strong>{record.employeeName}</strong><br /><small>{record.employeeCode}</small></td>
                        <td>{formatDate(record.retirementDate)}</td>
                        <td>{record.retirementType}</td>
                        <td className="text-center">
                          <span className="cert-status-badge" style={{ 
                            background: record.pensionEligibility === 'Yes' ? '#d1fae5' : record.pensionEligibility === 'Pending' ? '#fed7aa' : '#f3f4f6',
                            color: record.pensionEligibility === 'Yes' ? '#065f46' : record.pensionEligibility === 'Pending' ? '#9a3412' : '#6b7280'
                          }}>
                            {record.pensionEligibility}
                          </span>
                        </td>
                        <td>{record.pensionNumber || '—'}</td>
                        <td>{record.retirementOrder}</td>
                        <td>{record.retirementBenefits ? (record.retirementBenefits.length > 25 ? record.retirementBenefits.substring(0, 25) + '...' : record.retirementBenefits) : '—'}</td>
                      
                        <td>
  <div
    className="d-flex align-items-center gap-1"
    style={{ cursor: "pointer" }}
    onClick={(e) => {
      e.stopPropagation();
      handleStatusToggle(
        record.id,
        DUMMY_EMPLOYEES.find(e => e.id === record.employeeId)?.name || "",
        record.status || "Active"
      );
    }}
  >
    <div
      style={{
        width: "28px",
        height: "16px",
        borderRadius: "50px",
        backgroundColor:
          (record.status || "Active") === "Active"
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
            (record.status || "Active") === "Active"
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
          (record.status || "Active") === "Active"
            ? "#9d174d"
            : "#94a3b8"
      }}
    >
      {record.status || "Active"}
    </span>
  </div>
</td>
                       <td>
  <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
    <button 
      className="cert-act cert-act--edit" 
      onClick={() => handleEdit(record)} 
      title={record.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
      disabled={record.status === 'Inactive'}  
      style={{ 
        opacity: record.status === 'Inactive' ? 0.5 : 1,
        cursor: record.status === 'Inactive' ? 'not-allowed' : 'pointer'
      }}
    >
      <FaEdit size={12} />
    </button>
  </div>
</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="11" className="text-center py-5">No retirement records found</td></tr>
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

export default RetirementRecords;