import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaUserCheck, 
  FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaCheckCircle, FaSearch, FaArrowLeft, FaArrowRight, FaEye, FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';

const ConfirmationDetails = ({ employeeId, employeeJoiningDate, initialData, onSuccess, onCancel }) => {
  const [confirmations, setConfirmations] = useState(initialData?.confirmations || [
    { id: 1, employeeId:1,confirmationOrderNo: 'CONF/2024/001', confirmationDate: '2024-07-15', confirmedBy: 'HR Manager', remarks: 'Performance satisfactory', createdAt: '2024-07-15T10:30:00Z', confirmationDocumentName: 'confirmation_letter.pdf', confirmationDocumentData: null },
    { id: 2, employeeId:2,confirmationOrderNo: 'CONF/2024/002', confirmationDate: '2024-08-20', confirmedBy: 'CEO', remarks: 'Excellent performance', createdAt: '2024-08-20T11:45:00Z', confirmationDocumentName: 'probation_completion.pdf', confirmationDocumentData: null },
    { id: 3, employeeId:3,confirmationOrderNo: 'CONF/2024/003', confirmationDate: '2024-06-10', confirmedBy: 'HR Director', remarks: 'Probation completed', createdAt: '2024-06-10T09:15:00Z' },
    { id: 4, employeeId:4,confirmationOrderNo: 'CONF/2024/004', confirmationDate: '2024-09-05', confirmedBy: 'Department Head', remarks: '', createdAt: '2024-09-05T14:20:00Z' },
    { id: 5, employeeId:5,confirmationOrderNo: 'CONF/2024/005', confirmationDate: '2024-10-12', confirmedBy: 'Senior HR Officer', remarks: 'Confirmed after review', createdAt: '2024-10-12T10:00:00Z' }
  ]);
  
  const [editingConfirmation, setEditingConfirmation] = useState(null);
  const [selectedConfirmation, setSelectedConfirmation] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [formData, setFormData] = useState({
    confirmationOrderNo: '',
    confirmationDate: '',
    confirmedBy: '',
    remarks: '',
    confirmationDocument: null,
    confirmationDocumentData: null,
    confirmationDocumentName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(3);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
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

  const confirmedByOptions = [
    { value: 'HR Manager', label: 'HR Manager' },
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'CEO', label: 'CEO' },
    { value: 'Department Head', label: 'Department Head' },
    { value: 'Senior HR Officer', label: 'Senior HR Officer' }
  ];

  const handleRowClick = (confirmation) => {
    setSelectedConfirmation(confirmation);
  };

  const handleViewDocument = (e, confirmation) => {
    e.stopPropagation();
     setSelectedConfirmation(confirmation); 
      setShowDocumentActions(true);
    if (confirmation.confirmationDocumentData) {
      setDocumentPreview({
        data: confirmation.confirmationDocumentData,
        name: confirmation.confirmationDocumentName
      });
    } else {
      toast.info('No Document', 'No document has been uploaded for this confirmation');
    }
  };

  const filteredConfirmations = confirmations.filter(conf => {
    const search = searchTerm.toLowerCase();
    return conf.confirmationOrderNo.toLowerCase().includes(search) ||
           conf.confirmedBy.toLowerCase().includes(search) ||
           (conf.remarks && conf.remarks.toLowerCase().includes(search));
  });

  const totalItems = filteredConfirmations.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentConfirmations = filteredConfirmations.slice(startIndex, startIndex + rowsPerPage);

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

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

  useEffect(() => {
    setExistingOrderNos(confirmations.map(conf => conf.confirmationOrderNo));
  }, [confirmations]);

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
          confirmationDocument: file,
          confirmationDocumentData: reader.result,
          confirmationDocumentName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'confirmationOrderNo') {
      if (!value) error = 'Confirmation Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingConfirmation || editingConfirmation.confirmationOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'confirmationDate') {
      if (!value) error = 'Confirmation Date is required';
      else if (employeeJoiningDate) {
        const confirmationDate = new Date(value);
        const joiningDate = new Date(employeeJoiningDate);
        if (confirmationDate <= joiningDate) {
          error = 'Confirmation Date must be greater than Joining Date';
        }
      }
    }
    else if (field === 'confirmedBy' && !value) error = 'Confirmed By is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.confirmationOrderNo) {
      newErrors.confirmationOrderNo = 'Confirmation Order Number is required';
    } else if (existingOrderNos.includes(formData.confirmationOrderNo) && 
        (!editingConfirmation || editingConfirmation.confirmationOrderNo !== formData.confirmationOrderNo)) {
      newErrors.confirmationOrderNo = 'Order Number already exists';
    }
    
    if (!formData.confirmationDate) {
      newErrors.confirmationDate = 'Confirmation Date is required';
    } else if (employeeJoiningDate) {
      const confirmationDate = new Date(formData.confirmationDate);
      const joiningDate = new Date(employeeJoiningDate);
      if (confirmationDate <= joiningDate) {
        newErrors.confirmationDate = 'Confirmation Date must be greater than Joining Date';
      }
    }
    
    if (!formData.confirmedBy) {
      newErrors.confirmedBy = 'Confirmed By is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  if (!validateForm()) {
    toast.warning('Validation Error', 'Please fix the highlighted fields');
    return;
  }
  
  // Get employee data
  const empData = selectedEmployee || null;
  
  const confirmationData = {
    ...formData,
    employeeId: empData?.id || null,
    employeeName: empData?.name || null,
    employeeCode: empData?.code || null,  
    employeeDepartment: empData?.department || null, 
    employeeDesignation: empData?.designation || null,
    id: editingConfirmation ? editingConfirmation.id : Date.now(),
    createdAt: editingConfirmation ? editingConfirmation.createdAt : new Date().toISOString()
  };
  
  if (editingConfirmation) {
    const updated = confirmations.map(conf =>
      conf.id === editingConfirmation.id
        ? { ...confirmationData, id: conf.id, createdAt: conf.createdAt }
        : conf
    );
    setConfirmations(updated);
    toast.success('Success', 'Confirmation details updated successfully');
    setEditingConfirmation(null);
  } else {
    const newConfirmation = {
      id: Date.now(),
      ...confirmationData,
      createdAt: new Date().toISOString()
    };
    setConfirmations([newConfirmation, ...confirmations]);
    toast.success('Success', 'Confirmation details added successfully');
  }
  resetForm();
  setShowForm(false);
  setPage(0);
};

  const handleEdit = (confirmation) => {
    if (confirmation.status === 'Inactive') {
      toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
      return;
    }
    
    const emp = DUMMY_EMPLOYEES.find(e => e.id === confirmation.employeeId); 
    setSelectedEmployee(emp || null);  
    setEditingConfirmation(confirmation);
    setFormData({
      confirmationOrderNo: confirmation.confirmationOrderNo,
      confirmationDate: confirmation.confirmationDate,
      confirmedBy: confirmation.confirmedBy,
      remarks: confirmation.remarks || '',
      confirmationDocument: null,
      confirmationDocumentData: confirmation.confirmationDocumentData,
      confirmationDocumentName: confirmation.confirmationDocumentName
    });
    setEmployeeSearchTerm(emp?.name || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      confirmationOrderNo: '',
      confirmationDate: '',
      confirmedBy: '',
      remarks: '',
      confirmationDocument: null,
      confirmationDocumentData: null,
      confirmationDocumentName: null
    });
    setErrors({});
    setTouched({});
    setEditingConfirmation(null);
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
    setSelectedConfirmation(null);
  };

  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({ id, name, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;
    const updatedConfirmations = confirmations.map((conf) =>
      conf.id === id ? { ...conf, status: newStatus } : conf
    );
    setConfirmations(updatedConfirmations);
    setShowStatusModal(false);
    toast.success("Status Updated", `${statusAction.name} is now ${newStatus}`);
  };

   const handleGenerateLetter = (confirmation) => {
    console.log('Generate clicked for:', confirmation.confirmationOrderNo);
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Confirmation Details</h1>
          <p className="cert-subtitle">Manage employee probation confirmation records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedConfirmation && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Confirmation
            </button>
          )}
          {(showForm || selectedConfirmation) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedConfirmation && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Joining Date Info Alert */}
      {employeeJoiningDate && !showForm && !selectedConfirmation && (
        <div className="alert alert-info bg-opacity-10 border-0 mb-4" style={{ padding: '12px 16px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5' }}>
          <div className="d-flex align-items-center gap-2">
            <FaCalendarAlt />
            <span>
              <strong>Employee Joining Date:</strong> {formatDate(employeeJoiningDate)}
              <span className="text-muted ms-2">Confirmation Date must be after this date</span>
            </span>
          </div>
        </div>
      )}

      {showForm ? (
        // FORM VIEW - KEPT EXACTLY AS ORIGINAL
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Confirmation Details</div>
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
                          if (employeeSearchTerm.length > 0) setShowEmployeeDropdown(true);
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
                                <div><span className="badge bg-light text-dark">{emp.designation}</span></div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-3 text-muted"><small>No employees found</small></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="cert-field-compact">
                  <label>Employee Code</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.code || ''} readOnly placeholder="Auto-populated" />
                </div>
                
                <div className="cert-field-compact">
                  <label>Department</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.department || ''} readOnly placeholder="Auto-populated" />
                </div>
                
                <div className="cert-field-compact">
                  <label>Designation</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.designation || ''} readOnly placeholder="Auto-populated" />
                </div>
                    
                <div className={`cert-field-compact ${touched.confirmationOrderNo && errors.confirmationOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Confirmation Order Number</label>
                  <input type="text" placeholder="e.g., ARI/CONF/2024/001" value={formData.confirmationOrderNo} onChange={(e) => handleChange('confirmationOrderNo', e.target.value)} onBlur={() => handleBlur('confirmationOrderNo')} />
                  <FieldError msg={errors.confirmationOrderNo} />
                  <small>Unique order number for confirmation</small>
                </div>
                
                <div className={`cert-field-compact ${touched.confirmationDate && errors.confirmationDate ? 'has-error' : ''}`}>
                  <label className="required">Confirmation Date</label>
                  <input type="date" value={formData.confirmationDate} onChange={(e) => handleChange('confirmationDate', e.target.value)} onBlur={() => handleBlur('confirmationDate')} />
                  <FieldError msg={errors.confirmationDate} />
                  <small>Date when employee was confirmed</small>
                </div>
                
                <div className={`cert-field-compact ${touched.confirmedBy && errors.confirmedBy ? 'has-error' : ''}`}>
                  <label className="required">Confirmed By</label>
                  <select value={formData.confirmedBy} onChange={(e) => handleChange('confirmedBy', e.target.value)} onBlur={() => handleBlur('confirmedBy')}>
                    <option value="">Select Authority</option>
                    {confirmedByOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <FieldError msg={errors.confirmedBy} />
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Remarks</label>
                  <textarea rows="3" placeholder="Additional remarks about confirmation..." value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
                </div>
                
                {/* <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Confirmation Document</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="confirmation-doc-upload" />
                    <label htmlFor="confirmation-doc-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.confirmationDocumentName && (
                      <div className="mt-2 text-primary">
                        {formData.confirmationDocumentName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.confirmationDocumentName}
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
                <FaSave size={12} /> {editingConfirmation ? 'Update Confirmation' : 'Save Confirmation'}
              </button>
            </div>
          </form>
        </div>
         ) : showDocumentActions && selectedConfirmation ? (
                  <DocumentActions 
                    title="Confirmation Letter"
                    documentName={selectedConfirmation.confirmationOrderFileName}
                    documentData={selectedConfirmation.confirmationOrderFileData}
                    onGenerate={() => handleGenerateLetter(selectedConfirmation)}
                    onBack={handleBackToList}
                    generateLabel="Generate Letter"
                    themeColor="#9d174d"
                  />
      ) : selectedConfirmation ? (
        // PROFESSIONAL INLINE DETAIL VIEW
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {/* Top Banner */}
          <div style={{ 
            background: 'linear-gradient(135deg, #9d174d 0%, #7c2d12 100%)', 
            padding: '28px 32px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <FaCheckCircle size={20} />
                  <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
                    {selectedConfirmation.confirmationOrderNo}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', opacity: 0.9 }}>
                  <span><FaCalendarAlt style={{ marginRight: '6px' }} />{formatDate(selectedConfirmation.createdAt)}</span>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '3px 12px', 
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>
                    Confirmed
                  </span>
                </div>
              </div>
            
            </div>
          </div>

          {/* Content Area */}
          <div style={{ padding: '32px' }}>
            {/* Employee Profile Card */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '20px 24px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9d174d, #7c2d12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '700'
                }}>
                  {DUMMY_EMPLOYEES.find(e => e.id === selectedConfirmation.employeeId)?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 2px 0' }}>
                    {DUMMY_EMPLOYEES.find(e => e.id === selectedConfirmation.employeeId)?.name || 'Unknown'}
                  </h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {DUMMY_EMPLOYEES.find(e => e.id === selectedConfirmation.employeeId)?.code || ''} • {DUMMY_EMPLOYEES.find(e => e.id === selectedConfirmation.employeeId)?.designation || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '16px',
              marginBottom: '28px'
            }}>
              <DetailCard 
                icon={<FaCalendarAlt size={16} style={{ color: '#9d174d' }} />}
                label="Confirmation Date"
                value={formatDate(selectedConfirmation.confirmationDate)}
                bg="#ecfdf5"
              />
              
              <DetailCard 
                icon={<FaUserCheck size={16} style={{ color: '#9d174d' }} />}
                label="Confirmed By"
                value={selectedConfirmation.confirmedBy}
                bg="#eef2ff"
              />
              
              <DetailCard 
                icon={<FaClock size={16} style={{ color: '#d97706' }} />}
                label="Status"
                value={selectedConfirmation.status || 'Active'}
                bg="#fffbeb"
                badge
              />
            </div>

            {/* Remarks Section */}
            <div style={{ 
              background: '#f0fdf4', 
              borderRadius: '12px', 
              padding: '20px 24px',
              marginBottom: '24px',
              border: '1px solid #bbf7d0'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileAlt size={14} /> Remarks
              </h4>
              <p style={{ fontSize: '15px', color: '#065f46', margin: 0, lineHeight: '1.6' }}>
                {selectedConfirmation.remarks || 'No remarks provided'}
              </p>
            </div>

            {/* Document Section */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '20px 24px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf size={16} style={{ color: '#dc2626' }} /> Confirmation Document
              </h4>
              {selectedConfirmation.confirmationDocumentName ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: '#fef2f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedConfirmation.confirmationDocumentName.endsWith('.pdf') ? (
                        <FaFilePdf size={20} style={{ color: '#dc2626' }} />
                      ) : (
                        <FaFileImage size={20} style={{ color: '#3b82f6' }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: '500', color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>
                        {selectedConfirmation.confirmationDocumentName}
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uploaded document</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleViewDocument(e, selectedConfirmation)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '10px 20px',
                      background: '#9d174d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    <FaEye size={14} /> View Document
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <FaFileAlt size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: '500', margin: '0 0 4px 0', color: '#64748b' }}>No document uploaded</p>
                  <span style={{ fontSize: '13px' }}>No confirmation document has been uploaded for this record</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // TABLE VIEW - KEPT EXACTLY AS ORIGINAL
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by order number, confirmed by or remarks..."
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
                    <th>Order No.</th>
                    <th>Confirmation Date</th>
                    <th>Confirmed By</th>
                    <th>Remarks</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentConfirmations.length > 0 ? (
                    currentConfirmations.map((conf,idx) => (
                      <tr 
                        key={conf.id}
                        onClick={() => handleRowClick(conf)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>{DUMMY_EMPLOYEES.find(e => e.id === conf.employeeId)?.name || 
   conf.employeeName || 
   'Unknown'}</td>
                        <td><strong>{conf.confirmationOrderNo}</strong></td>
                        <td>
                          <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                            <FaCheckCircle className="me-1" size={10} /> {formatDate(conf.confirmationDate)}
                          </span>
                        </td>
                        <td>{conf.confirmedBy}</td>
                        <td>{conf.remarks ? <span className="text-muted small">{conf.remarks}</span> : <span className="text-muted">—</span>}</td>
                        <td>
                          <div
                            className="d-flex align-items-center gap-1"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusToggle(conf.id, DUMMY_EMPLOYEES.find(e => e.id === conf.employeeId)?.name || "", conf.status || "Active");
                            }}
                          >
                            <div style={{ width: "28px", height: "16px", borderRadius: "50px", backgroundColor: (conf.status || "Active") === "Active" ? "#9d174d" : "#d1d5db", position: "relative", transition: ".2s" }}>
                              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: (conf.status || "Active") === "Active" ? "14px" : "2px", transition: ".2s" }} />
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: 500, color: (conf.status || "Active") === "Active" ? "#9d174d" : "#94a3b8" }}>
                              {conf.status || "Active"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(conf)} 
                              title={conf.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={conf.status === 'Inactive'}
                              style={{ opacity: conf.status === 'Inactive' ? 0.5 : 1, cursor: conf.status === 'Inactive' ? 'not-allowed' : 'pointer' }}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="text-center py-5">No confirmation records found</td></tr>
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
                  <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>← Prev</button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots" style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button key={pg} className={`cert-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', background: pg === page ? '#9d174d' : 'white', color: pg === page ? 'white' : '#374151', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px' }}>{pg + 1}</button>
                    )
                  )}
                  <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Next →</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">{statusAction.newStatus === "Active" ? "✅" : "⛔"}</div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">Are you sure you want to <strong>{statusAction.newStatus === "Active" ? "activate" : "deactivate"}</strong> <strong>{statusAction.name}</strong>?</p>
            <p className="emp-modal-warn">{statusAction.newStatus === "Inactive" ? "Inactive records cannot be edited until reactivated." : "This record will become active again."}</p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {documentPreview && (
        <div className="emp-modal-overlay" onClick={() => setDocumentPreview(null)} style={{ zIndex: 1050 }}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}><FaFileAlt style={{ marginRight: '8px' }} />Document Preview</h3>
              <button onClick={() => setDocumentPreview(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}><FaTimes /></button>
            </div>
            <div style={{ padding: '24px' }}>
              {documentPreview.data && documentPreview.name && documentPreview.name.endsWith('.pdf') ? (
                <div style={{ width: '100%', height: '70vh', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe src={documentPreview.data} width="100%" height="100%" title="PDF Preview" style={{ border: 'none' }} />
                </div>
              ) : documentPreview.data ? (
                <div style={{ textAlign: 'center' }}>
                  <img src={documentPreview.data} alt="Document Preview" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}><p>No preview available</p></div>
              )}
              <div style={{ marginTop: '20px', padding: '12px 16px', background: '#f9fafb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#111827' }}>{documentPreview.name}</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Uploaded document</p>
                </div>
                <a href={documentPreview.data} download={documentPreview.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}><FaFileAlt /> Download</a>
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
      `}</style>
    </div>
  );
};

// Detail Card Component
const DetailCard = ({ icon, label, value, bg, badge }) => (
  <div style={{ 
    background: bg || '#f8fafc', 
    borderRadius: '10px', 
    padding: '16px 18px',
    border: '1px solid #e2e8f0'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      {icon}
      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
    {badge ? (
      <span style={{
        display: 'inline-block',
        background: '#d1fae5',
        color: '#065f46',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        {value}
      </span>
    ) : (
      <p style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
        {value}
      </p>
    )}
  </div>
);

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default ConfirmationDetails;