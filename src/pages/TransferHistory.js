import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaExchangeAlt, FaBuilding, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaMapMarkerAlt, 
  FaBriefcase, FaFileAlt, FaSearch, FaArrowRight, FaArrowLeft, FaEye,FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const TransferHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [transfers, setTransfers] = useState(initialData?.transfers || [
    { id: 1,employeeId:1, transferOrderNo: 'TRF/2024/001', transferDate: '2024-06-01', transferType: 'Permanent', fromDepartment: 'IT', toDepartment: 'IT', fromBranch: 'Mumbai - Head Office', toBranch: 'Bangalore - South Region', effectiveDate: '2024-06-15', transferReason: 'Project requirement', createdAt: '2024-06-01T10:30:00Z', transferOrderFileName: 'transfer_order.pdf', transferOrderFileData: null },
    { id: 2, employeeId:2,transferOrderNo: 'TRF/2024/002', transferDate: '2024-08-20', transferType: 'Temporary', fromDepartment: 'HR', toDepartment: 'Operations', fromBranch: 'Delhi - North Region', toBranch: 'Mumbai - Head Office', effectiveDate: '2024-09-01', transferReason: 'Department restructuring', createdAt: '2024-08-20T11:45:00Z' },
    { id: 3, employeeId:3,transferOrderNo: 'TRF/2024/003', transferDate: '2024-10-15', transferType: 'On Deputation', fromDepartment: 'Finance', toDepartment: 'Legal', fromBranch: 'Chennai - East Region', toBranch: 'Hyderabad - Central Region', effectiveDate: '2024-11-01', transferReason: 'Special assignment', createdAt: '2024-10-15T09:15:00Z', transferOrderFileName: 'deputation_letter.pdf', transferOrderFileData: null },
    { id: 4,employeeId:4, transferOrderNo: 'TRF/2024/004', transferDate: '2024-12-01', transferType: 'Permanent', fromDepartment: 'Sales', toDepartment: 'Marketing', fromBranch: 'Kolkata - East Region', toBranch: 'Delhi - North Region', effectiveDate: '2024-12-15', transferReason: 'Promotion transfer', createdAt: '2024-12-01T14:20:00Z' },
    { id: 5, employeeId:5,transferOrderNo: 'TRF/2024/005', transferDate: '2024-12-10', transferType: 'Contractual', fromDepartment: 'IT', toDepartment: 'Operations', fromBranch: 'Bangalore - South Region', toBranch: 'Pune - West Region', effectiveDate: '2025-01-01', transferReason: 'Contract completion', createdAt: '2024-12-10T10:00:00Z' }
  ]);
  
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null); // For inline detail view
  const [documentPreview, setDocumentPreview] = useState(null); // For document preview modal
  const [formData, setFormData] = useState({
    transferOrderNo: '',
    transferDate: '',
    transferType: 'Permanent',
    fromDepartment: '',
    toDepartment: '',
    fromBranch: '',
    toBranch: '',
    effectiveDate: '',
    transferReason: '',
    transferOrderFile: null,
    transferOrderFileData: null,
    transferOrderFileName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusAction, setStatusAction] = useState({
      id: null,
      name: "",
      newStatus: ""
    });

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  // Handle row click for detail view
  const handleRowClick = (transfer) => {
    setSelectedTransfer(transfer);
  };

  // Handle document view
  const handleViewDocument = (e, transfer) => {
    e.stopPropagation(); // Prevent row click
    if (transfer.transferOrderFileData) {
      setDocumentPreview({
        data: transfer.transferOrderFileData,
        name: transfer.transferOrderFileName
      });
    } else {
      toast.info('No Document', 'No document has been uploaded for this transfer');
    }
  };

  // Dummy data for dropdowns
  const transferTypes = [
    { value: 'Permanent', label: 'Permanent Transfer' },
    { value: 'Temporary', label: 'Temporary Transfer' },
    { value: 'On Deputation', label: 'On Deputation' },
    { value: 'Contractual', label: 'Contractual Transfer' },
    { value: 'Project Based', label: 'Project Based' }
  ];

  const departments = [
    { id: 1, name: 'IT' },
    { id: 2, name: 'HR' },
    { id: 3, name: 'Finance' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'Marketing' },
    { id: 6, name: 'Operations' },
    { id: 7, name: 'Legal' }
  ];

  const branches = [
    { id: 1, name: 'Mumbai - Head Office' },
    { id: 2, name: 'Delhi - North Region' },
    { id: 3, name: 'Bangalore - South Region' },
    { id: 4, name: 'Chennai - East Region' },
    { id: 5, name: 'Kolkata - East Region' },
    { id: 6, name: 'Pune - West Region' },
    { id: 7, name: 'Hyderabad - Central Region' }
  ];

  // Filter transfers by search
  const filteredTransfers = transfers.filter(transfer => {
    const search = searchTerm.toLowerCase();
    return transfer.transferOrderNo.toLowerCase().includes(search) ||
           transfer.fromDepartment.toLowerCase().includes(search) ||
           transfer.toDepartment.toLowerCase().includes(search) ||
           transfer.fromBranch.toLowerCase().includes(search) ||
           transfer.toBranch.toLowerCase().includes(search) ||
           (transfer.transferReason && transfer.transferReason.toLowerCase().includes(search));
  });

  // Pagination
  const totalItems = filteredTransfers.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentTransfers = filteredTransfers.slice(startIndex, startIndex + rowsPerPage);
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

  // Update existing order numbers
  useEffect(() => {
    setExistingOrderNos(transfers.map(transfer => transfer.transferOrderNo));
  }, [transfers]);

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
          transferOrderFile: file,
          transferOrderFileData: reader.result,
          transferOrderFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'transferOrderNo') {
      if (!value) error = 'Transfer Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingTransfer || editingTransfer.transferOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'transferDate' && !value) error = 'Transfer Date is required';
    else if (field === 'transferType' && !value) error = 'Transfer Type is required';
    else if (field === 'fromDepartment' && !value) error = 'From Department is required';
    else if (field === 'toDepartment' && !value) error = 'To Department is required';
    else if (field === 'fromBranch' && !value) error = 'From Branch is required';
    else if (field === 'toBranch' && !value) error = 'To Branch is required';
    else if (field === 'effectiveDate' && !value) error = 'Effective Date is required';
    else if (field === 'transferReason' && !value) error = 'Transfer Reason is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
  
    if (!formData.transferOrderNo) {
      newErrors.transferOrderNo = 'Transfer Order Number is required';
    } else if (existingOrderNos.includes(formData.transferOrderNo) && 
        (!editingTransfer || editingTransfer.transferOrderNo !== formData.transferOrderNo)) {
      newErrors.transferOrderNo = 'Order Number already exists';
    }
    
    if (!formData.transferDate) newErrors.transferDate = 'Transfer Date is required';
    if (!formData.transferType) newErrors.transferType = 'Transfer Type is required';
    if (!formData.fromDepartment) newErrors.fromDepartment = 'From Department is required';
    if (!formData.toDepartment) newErrors.toDepartment = 'To Department is required';
    if (!formData.fromBranch) newErrors.fromBranch = 'From Branch is required';
    if (!formData.toBranch) newErrors.toBranch = 'To Branch is required';
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective Date is required';
    if (!formData.transferReason) newErrors.transferReason = 'Transfer Reason is required';
    
    if (formData.transferDate && formData.effectiveDate) {
      if (new Date(formData.effectiveDate) < new Date(formData.transferDate)) {
        newErrors.effectiveDate = 'Effective Date must be on or after Transfer Date';
      }
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
    
    if (editingTransfer) {
      const updated = transfers.map(transfer =>
        transfer.id === editingTransfer.id
          ? { ...formData, id: transfer.id, createdAt: transfer.createdAt }
          : transfer
      );
      setTransfers(updated);
      toast.success('Success', 'Transfer updated successfully');
      setEditingTransfer(null);
    } else {
      const newTransfer = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      setTransfers([newTransfer, ...transfers]);
      toast.success('Success', 'Transfer added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (transfer) => {
    if (transfer.status === 'Inactive') {
      toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
      return;
    }
    
    const emp = DUMMY_EMPLOYEES.find(e => e.id === transfer.employeeId);
    setSelectedEmployee(emp || null);  
    setEditingTransfer(transfer);
    setFormData({
      transferOrderNo: transfer.transferOrderNo,
      transferDate: transfer.transferDate,
      transferType: transfer.transferType,
      fromDepartment: transfer.fromDepartment,
      toDepartment: transfer.toDepartment,
      fromBranch: transfer.fromBranch,
      toBranch: transfer.toBranch,
      effectiveDate: transfer.effectiveDate,
      transferReason: transfer.transferReason || '',
      transferOrderFile: null,
      transferOrderFileData: transfer.transferOrderFileData,
      transferOrderFileName: transfer.transferOrderFileName
    });
    setEmployeeSearchTerm(emp?.name || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      transferOrderNo: '',
      transferDate: '',
      transferType: 'Permanent',
      fromDepartment: '',
      toDepartment: '',
      fromBranch: '',
      toBranch: '',
      effectiveDate: '',
      transferReason: '',
      transferOrderFile: null,
      transferOrderFileData: null,
      transferOrderFileName: null
    });
    setErrors({});
    setTouched({});
    setEditingTransfer(null);
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
    setSelectedTransfer(null);
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
  
    const updatedTransfers = transfers.map((transfer) =>
      transfer.id === id
        ? {
            ...transfer,
            status: newStatus
          }
        : transfer
    );
  
    setTransfers(updatedTransfers);
  
    setShowStatusModal(false);
  
    toast.success(
      "Status Updated",
      `${statusAction.name} is now ${newStatus}`
    );
  };

  // Get transfer type color
  const getTransferTypeColor = (type) => {
    switch(type) {
      case 'Permanent': return { bg: '#d1fae5', color: '#065f46' };
      case 'Temporary': return { bg: '#fed7aa', color: '#9a3412' };
      case 'On Deputation': return { bg: '#e0e7ff', color: '#4f46e5' };
      case 'Contractual': return { bg: '#fce7f3', color: '#9d174d' };
      case 'Project Based': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Transfer History</h1>
          <p className="cert-subtitle">Manage employee transfer records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedTransfer && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Transfer
            </button>
          )}
          {(showForm || selectedTransfer) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedTransfer && onCancel && (
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
              <div className="cert-section-label">Transfer Details</div>
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
                         
                <div className={`cert-field-compact ${touched.transferOrderNo && errors.transferOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Transfer Order Number</label>
                  <input type="text" placeholder="e.g., ARI/TRF/2024/001" value={formData.transferOrderNo} onChange={(e) => handleChange('transferOrderNo', e.target.value)} onBlur={() => handleBlur('transferOrderNo')} />
                  <FieldError msg={errors.transferOrderNo} />
                </div>
                
                <div className={`cert-field-compact ${touched.transferDate && errors.transferDate ? 'has-error' : ''}`}>
                  <label className="required">Transfer Date</label>
                  <input type="date" value={formData.transferDate} onChange={(e) => handleChange('transferDate', e.target.value)} onBlur={() => handleBlur('transferDate')} />
                  <FieldError msg={errors.transferDate} />
                </div>
                
                <div className={`cert-field-compact ${touched.transferType && errors.transferType ? 'has-error' : ''}`}>
                  <label className="required">Transfer Type</label>
                  <select value={formData.transferType} onChange={(e) => handleChange('transferType', e.target.value)} onBlur={() => handleBlur('transferType')}>
                    {transferTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <FieldError msg={errors.transferType} />
                </div>
                
                <div className={`cert-field-compact ${touched.fromDepartment && errors.fromDepartment ? 'has-error' : ''}`}>
                  <label className="required">From Department</label>
                  <select value={formData.fromDepartment} onChange={(e) => handleChange('fromDepartment', e.target.value)} onBlur={() => handleBlur('fromDepartment')}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                  <FieldError msg={errors.fromDepartment} />
                </div>
                
                <div className={`cert-field-compact ${touched.toDepartment && errors.toDepartment ? 'has-error' : ''}`}>
                  <label className="required">To Department</label>
                  <select value={formData.toDepartment} onChange={(e) => handleChange('toDepartment', e.target.value)} onBlur={() => handleBlur('toDepartment')}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                  <FieldError msg={errors.toDepartment} />
                </div>
                
                <div className={`cert-field-compact ${touched.fromBranch && errors.fromBranch ? 'has-error' : ''}`}>
                  <label className="required">From Branch</label>
                  <select value={formData.fromBranch} onChange={(e) => handleChange('fromBranch', e.target.value)} onBlur={() => handleBlur('fromBranch')}>
                    <option value="">Select Branch</option>
                    {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                  </select>
                  <FieldError msg={errors.fromBranch} />
                </div>
                
                <div className={`cert-field-compact ${touched.toBranch && errors.toBranch ? 'has-error' : ''}`}>
                  <label className="required">To Branch</label>
                  <select value={formData.toBranch} onChange={(e) => handleChange('toBranch', e.target.value)} onBlur={() => handleBlur('toBranch')}>
                    <option value="">Select Branch</option>
                    {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                  </select>
                  <FieldError msg={errors.toBranch} />
                </div>
                
                <div className={`cert-field-compact ${touched.effectiveDate && errors.effectiveDate ? 'has-error' : ''}`}>
                  <label className="required">Effective Date</label>
                  <input type="date" value={formData.effectiveDate} onChange={(e) => handleChange('effectiveDate', e.target.value)} onBlur={() => handleBlur('effectiveDate')} />
                  <FieldError msg={errors.effectiveDate} />
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 2' }}>
                  <label className="required">Transfer Reason</label>
                  <textarea rows="2" placeholder="e.g., Promotion, Department restructuring, Project requirement..." value={formData.transferReason} onChange={(e) => handleChange('transferReason', e.target.value)} onBlur={() => handleBlur('transferReason')} />
                  <FieldError msg={errors.transferReason} />
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Transfer Order Upload</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="transfer-order-upload" />
                    <label htmlFor="transfer-order-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.transferOrderFileName && (
                      <div className="mt-2 text-primary">
                        {formData.transferOrderFileName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.transferOrderFileName}
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
                <FaSave size={12} /> {editingTransfer ? 'Update Transfer' : 'Save Transfer'}
              </button>
            </div>
          </form>
        </div>
              ) : selectedTransfer ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaExchangeAlt size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedTransfer.transferOrderNo}</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaCalendarAlt/> {formatDate(selectedTransfer.createdAt)}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedTransfer.transferType}</span></div>
            </div>
            {/* <button onClick={handleBackToList} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'white',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}><FaArrowLeft size={12}/> Back</button> */}
          </div>
          <div style={{padding:'32px'}}>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedTransfer.employeeId)?.name?.charAt(0)||'?'}</div>
              <div><h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedTransfer.employeeId)?.name||'Unknown'}</h3><span style={{fontSize:'13px',color:'#64748b'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedTransfer.employeeId)?.code||''}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#fdf2f8',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#9d174d'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Transfer Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedTransfer.transferDate)}</p></div>
              <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaExchangeAlt size={16} style={{color:'#4f46e5'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Transfer Type</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:'#e0e7ff',color:'#4f46e5'}}>{selectedTransfer.transferType}</span></div>
              <div style={{background:'#ecfeff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#0891b2'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Effective Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedTransfer.effectiveDate)}</p></div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#9d174d'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedTransfer.status==='Active'?'#d1fae5':'#fee2e2',color:selectedTransfer.status==='Active'?'#065f46':'#991b1b'}}>{selectedTransfer.status||'Active'}</span></div>
            </div>
            <div style={{background:'#fff7ed',borderRadius:'12px',padding:'20px',marginBottom:'16px',border:'1px solid #fed7aa'}}>
              <label style={{fontSize:'14px',fontWeight:600,color:'#9a3412',display:'block',marginBottom:'16px'}}><FaMapMarkerAlt style={{marginRight:'8px'}}/> Branch Transfer</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'16px',alignItems:'center'}}>
                <div style={{background:'#fee2e2',padding:'16px',borderRadius:'8px',border:'1px solid #fecaca'}}><label style={{fontSize:'11px',color:'#9d174d',display:'block',marginBottom:'4px'}}>From Branch</label><p style={{fontSize:'15px',fontWeight:600,color:'#991b1b',margin:0}}>{selectedTransfer.fromBranch}</p></div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',color:'#9d174d'}}><FaArrowRight size={24}/><span style={{fontSize:'11px',color:'#6b7280'}}>Transfer</span></div>
                <div style={{background:'#d1fae5',padding:'16px',borderRadius:'8px',border:'1px solid #a7f3d0'}}><label style={{fontSize:'11px',color:'#059669',display:'block',marginBottom:'4px'}}>To Branch</label><p style={{fontSize:'15px',fontWeight:600,color:'#065f46',margin:0}}>{selectedTransfer.toBranch}</p></div>
              </div>
            </div>
            <div style={{background:'#f0fdf4',borderRadius:'12px',padding:'20px',marginBottom:'16px',border:'1px solid #bbf7d0'}}>
              <label style={{fontSize:'14px',fontWeight:600,color:'#166534',display:'block',marginBottom:'16px'}}><FaBuilding style={{marginRight:'8px'}}/> Department Transfer</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'16px',alignItems:'center'}}>
                <div style={{background:'#e0e7ff',padding:'16px',borderRadius:'8px',border:'1px solid #c7d2fe'}}><label style={{fontSize:'11px',color:'#4f46e5',display:'block',marginBottom:'4px'}}>From Department</label><p style={{fontSize:'15px',fontWeight:600,color:'#3730a3',margin:0}}>{selectedTransfer.fromDepartment}</p></div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',color:'#9d174d'}}><FaArrowRight size={24}/><span style={{fontSize:'11px',color:'#6b7280'}}>Transfer</span></div>
                <div style={{background:'#fef3c7',padding:'16px',borderRadius:'8px',border:'1px solid #fde68a'}}><label style={{fontSize:'11px',color:'#9d174d',display:'block',marginBottom:'4px'}}>To Department</label><p style={{fontSize:'15px',fontWeight:600,color:'#92400e',margin:0}}>{selectedTransfer.toDepartment}</p></div>
              </div>
            </div>
            <div style={{background:'#f0fdf4',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #bbf7d0'}}><h4 style={{fontSize:'14px',fontWeight:600,color:'#166534',marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}><FaFileAlt size={14}/> Transfer Reason</h4><p style={{fontSize:'15px',color:'#065f46',margin:0,lineHeight:1.6}}>{selectedTransfer.transferReason||'No reason provided'}</p></div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}><FaFilePdf size={16} style={{color:'#dc2626'}}/> Transfer Order Document</h4>
              {selectedTransfer.transferOrderFileName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedTransfer.transferOrderFileName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}</div><div><p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedTransfer.transferOrderFileName}</p><span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded document</span></div></div>
                  <button onClick={(e)=>handleViewDocument(e,selectedTransfer)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}><FaEye size={14}/> View Document</button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}><FaFileAlt size={36} style={{marginBottom:'12px',opacity:0.3}}/><p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No document uploaded</p><span style={{fontSize:'13px'}}>No transfer order document has been uploaded</span></div>
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
                placeholder="Search by order number, department, branch or reason..."
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

          {/* Transfers Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Order No.</th>
                    <th>Transfer Date</th>
                    <th>From → To (Branch)</th>
                    <th>Department (From → To)</th>
                    <th>Transfer Type</th>
                    <th>Effective Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransfers.length > 0 ? (
                    currentTransfers.map((transfer,idx) => (
                      <tr 
                        key={transfer.id}
                        onClick={() => handleRowClick(transfer)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                      <td className="text-center">{startIndex + idx + 1}</td>
                         <td>                        
    {DUMMY_EMPLOYEES.find(e => e.id === transfer.employeeId)?.name || 'Unknown'}
</td>
                        <td><strong>{transfer.transferOrderNo}</strong></td>
                        <td>{formatDate(transfer.transferDate)}</td>
                        <td>
                          <span className="text-muted">{transfer.fromBranch?.split(' - ')[0]}</span>
                          <FaArrowRight className="mx-1 text-primary" size={10} />
                          <span className="fw-bold text-success">{transfer.toBranch?.split(' - ')[0]}</span>
                        </td>
                        <td>
                          <span className="text-muted">{transfer.fromDepartment}</span>
                          <FaArrowRight className="mx-1 text-primary" size={10} />
                          <span className="fw-bold text-success">{transfer.toDepartment}</span>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                            {transfer.transferType}
                          </span>
                        </td>
                        <td>{formatDate(transfer.effectiveDate)}</td>
                        <td className="text-center" style={{ maxWidth: '150px' }}>
                          {transfer.transferReason ? (
                            <span title={transfer.transferReason}>
                              {transfer.transferReason.length > 20 ? transfer.transferReason.substring(0, 20) + '...' : transfer.transferReason}
                            </span>
                          ) : '—'}
                        </td>
                      
                            <td>
  <div
    className="d-flex align-items-center gap-1"
    style={{ cursor: "pointer" }}
    onClick={(e) => {
      e.stopPropagation();
      handleStatusToggle(
        transfer.id,
        DUMMY_EMPLOYEES.find(e => e.id === transfer.employeeId)?.name || "",
        transfer.status || "Active"
      );
    }}
  >
    <div
      style={{
        width: "28px",
        height: "16px",
        borderRadius: "50px",
        backgroundColor:
          (transfer.status || "Active") === "Active"
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
            (transfer.status || "Active") === "Active"
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
          (transfer.status || "Active") === "Active"
            ? "#9d174d"
            : "#94a3b8"
      }}
    >
      {transfer.status || "Active"}
    </span>
  </div>
</td>
                        <td>
                          <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(transfer)} 
                              title={transfer.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={transfer.status === 'Inactive'}
                              style={{ 
                                opacity: transfer.status === 'Inactive' ? 0.5 : 1,
                                cursor: transfer.status === 'Inactive' ? 'not-allowed' : 'pointer'
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
                      <td colSpan="12" className="text-center py-5">No transfer records found</td>
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

export default TransferHistory;