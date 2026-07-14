import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaRupeeSign, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaChartLine,
  FaFileAlt, FaSearch, FaArrowUp, FaMoneyBillWave, FaUserTie, FaArrowLeft, FaEye,FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';

const PayRevisionHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [revisions, setRevisions] = useState(initialData?.revisions || [
    { id: 1, employeeId:1,revisionOrderNo: 'PAY/2024/001', effectiveDate: '2024-01-01', previousPayScale: '₹50,000 - ₹80,000', revisedPayScale: '₹55,000 - ₹88,000', incrementAmount: '₹5,000 (10%)', revisionReason: 'Annual Increment', createdAt: '2024-01-01T10:30:00Z', revisionDocumentName: 'pay_revision.pdf', revisionDocumentData: null },
    { id: 2, employeeId:2,revisionOrderNo: 'PAY/2024/002', effectiveDate: '2024-03-15', previousPayScale: '₹55,000 - ₹88,000', revisedPayScale: '₹65,000 - ₹1,00,000', incrementAmount: '₹10,000 (18%)', revisionReason: 'Promotion', createdAt: '2024-03-15T11:45:00Z' },
    { id: 3, employeeId:3,revisionOrderNo: 'PAY/2024/003', effectiveDate: '2024-06-01', previousPayScale: '₹60,000 - ₹90,000', revisedPayScale: '₹65,000 - ₹95,000', incrementAmount: '₹5,000 (8%)', revisionReason: 'Performance Based', createdAt: '2024-06-01T09:15:00Z', revisionDocumentName: 'increment_letter.pdf', revisionDocumentData: null },
    { id: 4, employeeId:4,revisionOrderNo: 'PAY/2024/004', effectiveDate: '2024-08-20', previousPayScale: '₹45,000 - ₹70,000', revisedPayScale: '₹50,000 - ₹78,000', incrementAmount: '₹5,000 (11%)', revisionReason: 'Market Correction', createdAt: '2024-08-20T14:20:00Z' },
    { id: 5, employeeId:5,revisionOrderNo: 'PAY/2024/005', effectiveDate: '2024-10-01', previousPayScale: '₹70,000 - ₹1,00,000', revisedPayScale: '₹80,000 - ₹1,20,000', incrementAmount: '₹10,000 (14%)', revisionReason: 'Grade Revision', createdAt: '2024-10-01T10:00:00Z' }
  ]);
  
  const [editingRevision, setEditingRevision] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null); // For inline detail view
  const [documentPreview, setDocumentPreview] = useState(null); // For document preview modal
  const [formData, setFormData] = useState({
    revisionOrderNo: '',
    effectiveDate: '',
    previousPayScale: '',
    revisedPayScale: '',
    incrementAmount: '',
    revisionReason: '',
    revisionDocument: null,
    revisionDocumentData: null,
    revisionDocumentName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
   // Employee Search State
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

  // Handle row click for detail view
  const handleRowClick = (revision) => {
    setSelectedRevision(revision);
  };

  // Handle document view
  const handleViewDocument = (e, revision) => {
    e.stopPropagation(); 
     setSelectedRevision(revision); 
      setShowDocumentActions(true);
    if (revision.revisionDocumentData) {
      setDocumentPreview({
        data: revision.revisionDocumentData,
        name: revision.revisionDocumentName
      });
    } else {
      toast.info('No Document', 'No document has been uploaded for this pay revision');
    }
  };

  // Revision Reasons
  const revisionReasons = [
    { value: 'Annual Increment', label: 'Annual Increment' },
    { value: 'Promotion', label: 'Promotion' },
    { value: 'Market Correction', label: 'Market Correction' },
    { value: 'Performance Based', label: 'Performance Based' },
    { value: 'Grade Revision', label: 'Grade Revision' },
    { value: 'Special Allowance', label: 'Special Allowance' },
    { value: 'Contract Renewal', label: 'Contract Renewal' },
    { value: 'Retention Bonus', label: 'Retention Bonus' }
  ];

  // Filter revisions by search
  const filteredRevisions = revisions.filter(rev => {
    const search = searchTerm.toLowerCase();
    return rev.revisionOrderNo.toLowerCase().includes(search) ||
           rev.revisionReason.toLowerCase().includes(search) ||
           rev.previousPayScale.toLowerCase().includes(search) ||
           rev.revisedPayScale.toLowerCase().includes(search);
  });

  // Pagination
  const totalItems = filteredRevisions.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentRevisions = filteredRevisions.slice(startIndex, startIndex + rowsPerPage);

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
    setExistingOrderNos(revisions.map(rev => rev.revisionOrderNo));
  }, [revisions]);

  // Auto-calculate increment amount
  useEffect(() => {
    if (formData.previousPayScale && formData.revisedPayScale) {
      const prevMatch = formData.previousPayScale.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g);
      const revMatch = formData.revisedPayScale.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g);
      
      if (prevMatch && revMatch && prevMatch.length > 0 && revMatch.length > 0) {
        const prevValue = parseInt(prevMatch[0].replace(/,/g, ''));
        const revValue = parseInt(revMatch[0].replace(/,/g, ''));
        
        if (!isNaN(prevValue) && !isNaN(revValue)) {
          const difference = revValue - prevValue;
          const percentage = ((difference / prevValue) * 100).toFixed(0);
          
          if (difference > 0) {
            setFormData(prev => ({
              ...prev,
              incrementAmount: `₹${difference.toLocaleString()} (${percentage}%)`
            }));
          } else if (difference < 0) {
            setFormData(prev => ({
              ...prev,
              incrementAmount: `-₹${Math.abs(difference).toLocaleString()} (${Math.abs(percentage)}%)`
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              incrementAmount: '₹0 (0%)'
            }));
          }
        }
      }
    } else if (formData.previousPayScale && !formData.revisedPayScale) {
      setFormData(prev => ({
        ...prev,
        incrementAmount: ''
      }));
    }
  }, [formData.previousPayScale, formData.revisedPayScale]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value) => {
    if (!value) return '—';
    return value;
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
          revisionDocument: file,
          revisionDocumentData: reader.result,
          revisionDocumentName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'revisionOrderNo') {
      if (!value) error = 'Revision Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingRevision || editingRevision.revisionOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'effectiveDate' && !value) error = 'Effective Date is required';
    else if (field === 'previousPayScale' && !value) error = 'Previous Pay Scale is required';
    else if (field === 'revisedPayScale' && !value) error = 'Revised Pay Scale is required';
    else if (field === 'revisionReason' && !value) error = 'Revision Reason is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.revisionOrderNo) {
      newErrors.revisionOrderNo = 'Revision Order Number is required';
    } else if (existingOrderNos.includes(formData.revisionOrderNo) && 
        (!editingRevision || editingRevision.revisionOrderNo !== formData.revisionOrderNo)) {
      newErrors.revisionOrderNo = 'Order Number already exists';
    }
    
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective Date is required';
    if (!formData.previousPayScale) newErrors.previousPayScale = 'Previous Pay Scale is required';
    if (!formData.revisedPayScale) newErrors.revisedPayScale = 'Revised Pay Scale is required';
    if (!formData.revisionReason) newErrors.revisionReason = 'Revision Reason is required';
    
    if (formData.previousPayScale && formData.revisedPayScale) {
      const prev = parseFloat(formData.previousPayScale.replace(/[^0-9.-]/g, ''));
      const rev = parseFloat(formData.revisedPayScale.replace(/[^0-9.-]/g, ''));
      if (!isNaN(prev) && !isNaN(rev) && rev <= prev) {
        newErrors.revisedPayScale = 'Revised Pay Scale must be greater than Previous Pay Scale';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fixed handleSubmit function
  const handleSubmit = (e) => {
  e.preventDefault();
  if (!validateForm()) {
    toast.warning('Validation Error', 'Please fix the highlighted fields');
    return;
  }
  
  // Get employee data
  const empData = selectedEmployee || null;
  
  const revisionData = {
    ...formData,
    employeeId: empData?.id || null,
    employeeName: empData?.name || null,  // Store employee name
    employeeCode: empData?.code || null,  // Store employee code
    employeeDepartment: empData?.department || null, // Store department
    employeeDesignation: empData?.designation || null, // Store designation
    id: editingRevision ? editingRevision.id : Date.now(),
    createdAt: editingRevision ? editingRevision.createdAt : new Date().toISOString()
  };
  
  if (editingRevision) {
    const updated = revisions.map(rev =>
      rev.id === editingRevision.id
        ? { ...revisionData, id: rev.id, createdAt: rev.createdAt }
        : rev
    );
    setRevisions(updated);
    toast.success('Success', 'Pay revision updated successfully');
    setEditingRevision(null);
  } else {
    const newRevision = {
      id: Date.now(),
      ...revisionData,
      createdAt: new Date().toISOString()
    };
    setRevisions([newRevision, ...revisions]);
    toast.success('Success', 'Pay revision added successfully');
  }
  resetForm();
  setShowForm(false);
  setPage(0);
};

 const handleEdit = (revision) => {
  if (revision.status === 'Inactive') {
    toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
    return;
  }
  
  const emp = DUMMY_EMPLOYEES.find(e => e.id === revision.employeeId);
  setSelectedEmployee(emp || null);  
  setEditingRevision(revision);
  setFormData({
    revisionOrderNo: revision.revisionOrderNo,
    effectiveDate: revision.effectiveDate,
    previousPayScale: revision.previousPayScale,
    revisedPayScale: revision.revisedPayScale,
    incrementAmount: revision.incrementAmount,
    revisionReason: revision.revisionReason,
    revisionDocument: null,
    revisionDocumentData: revision.revisionDocumentData,
    revisionDocumentName: revision.revisionDocumentName
  });
  setEmployeeSearchTerm(emp?.name || '');
  setShowForm(true);
};

  const resetForm = () => {
    setFormData({
      revisionOrderNo: '',
      effectiveDate: '',
      previousPayScale: '',
      revisedPayScale: '',
      incrementAmount: '',
      revisionReason: '',
      revisionDocument: null,
      revisionDocumentData: null,
      revisionDocumentName: null
    });
    setErrors({});
    setTouched({});
    setEditingRevision(null);
     setSelectedEmployee(null);      
  setEmployeeSearchTerm('');  
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  // Calculate total increment for stats
  const totalIncrement = revisions.reduce((sum, rev) => {
    const inc = parseFloat(rev.incrementAmount?.replace(/[^0-9.-]/g, '') || 0);
    return sum + (isNaN(inc) ? 0 : inc);
  }, 0);

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
    setSelectedRevision(null);
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
        
          const updatedRevision = revisions.map((rev) =>
            rev.id === id
              ? {
                  ...rev,
                  status: newStatus
                }
              : rev
          );
        
          setRevisions(updatedRevision);
        
          setShowStatusModal(false);
        
          toast.success(
            "Status Updated",
            `${statusAction.name} is now ${newStatus}`
          );
        };

          const handleGenerateLetter = (revision) => {
    console.log('Generate clicked for:', revision.revisionOrderNo);
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Pay Revision History</h1>
          <p className="cert-subtitle">Manage employee salary revision records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedRevision && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Pay Revision
            </button>
          )}
          {(showForm || selectedRevision) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedRevision && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

     

      {/* Pay Revision Form */}
      {showForm ? (
        <div className="cert-form-wrap mb-4">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Pay Revision Details</div>
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
                       
                <div className={`cert-field-compact ${touched.revisionOrderNo && errors.revisionOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Revision Order Number</label>
                  <input type="text" placeholder="e.g., ARI/PAY/2024/001" value={formData.revisionOrderNo} onChange={(e) => handleChange('revisionOrderNo', e.target.value)} onBlur={() => handleBlur('revisionOrderNo')} />
                  <FieldError msg={errors.revisionOrderNo} />
                </div>
                
                <div className={`cert-field-compact ${touched.effectiveDate && errors.effectiveDate ? 'has-error' : ''}`}>
                  <label className="required">Effective Date</label>
                  <input type="date" value={formData.effectiveDate} onChange={(e) => handleChange('effectiveDate', e.target.value)} onBlur={() => handleBlur('effectiveDate')} />
                  <FieldError msg={errors.effectiveDate} />
                </div>
                
                <div className={`cert-field-compact ${touched.revisionReason && errors.revisionReason ? 'has-error' : ''}`}>
                  <label className="required">Revision Reason</label>
                  <select value={formData.revisionReason} onChange={(e) => handleChange('revisionReason', e.target.value)} onBlur={() => handleBlur('revisionReason')}>
                    <option value="">Select Reason</option>
                    {revisionReasons.map(reason => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                  </select>
                  <FieldError msg={errors.revisionReason} />
                </div>
                
                <div className={`cert-field-compact ${touched.previousPayScale && errors.previousPayScale ? 'has-error' : ''}`}>
                  <label className="required">Previous Pay Scale</label>
                  <div className="input-group">
                    <input type="text" placeholder="e.g., ₹50,000 - ₹80,000" value={formData.previousPayScale} onChange={(e) => handleChange('previousPayScale', e.target.value)} onBlur={() => handleBlur('previousPayScale')} />
                  </div>
                  <FieldError msg={errors.previousPayScale} />
                </div>
                
                <div className={`cert-field-compact ${touched.revisedPayScale && errors.revisedPayScale ? 'has-error' : ''}`}>
                  <label className="required">Revised Pay Scale</label>
                  <div className="input-group">
                    <input type="text" placeholder="e.g., ₹60,000 - ₹95,000" value={formData.revisedPayScale} onChange={(e) => handleChange('revisedPayScale', e.target.value)} onBlur={() => handleBlur('revisedPayScale')} />
                  </div>
                  <FieldError msg={errors.revisedPayScale} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Increment Amount</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="bg-light" 
                      value={formData.incrementAmount} 
                      readOnly 
                      placeholder="Auto-calculated" 
                    />
                  </div>
                </div>
                
                {/* <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Revision Document</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="revision-doc-upload" />
                    <label htmlFor="revision-doc-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.revisionDocumentName && (
                      <div className="mt-2 text-primary">
                        {formData.revisionDocumentName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.revisionDocumentName}
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
                <FaSave size={12} /> {editingRevision ? 'Update Revision' : 'Save Revision'}
              </button>
            </div>
          </form>
        </div>
         ) : showDocumentActions && selectedRevision ? (
          <DocumentActions 
            title="Revision Letter"
            documentName={selectedRevision.revisionOrderFileName}
            documentData={selectedRevision.revisionOrderFileData}
            onGenerate={() => handleGenerateLetter(selectedRevision)}
            onBack={handleBackToList}
            generateLabel="Generate Letter"
            themeColor="#9d174d"
          />
           ) : selectedRevision ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaMoneyBillWave size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedRevision.revisionOrderNo}</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaCalendarAlt/> {formatDate(selectedRevision.createdAt)}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedRevision.revisionReason}</span></div>
            </div>
            {/* <button onClick={handleBackToList} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'white',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}><FaArrowLeft size={12}/> Back</button> */}
          </div>
          <div style={{padding:'32px'}}>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedRevision.employeeId)?.name?.charAt(0)||'?'}</div>
              <div><h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedRevision.employeeId)?.name||'Unknown'}</h3><span style={{fontSize:'13px',color:'#64748b'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedRevision.employeeId)?.code||''}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#fdf2f8',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#9d174d'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Effective Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedRevision.effectiveDate)}</p></div>
              <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaChartLine size={16} style={{color:'#4f46e5'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Revision Reason</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:'#e0e7ff',color:'#4f46e5'}}>{selectedRevision.revisionReason}</span></div>
              <div style={{background:'#fff1f2',borderRadius:'10px',padding:'16px 18px',border:'1px solid #fecaca'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaMoneyBillWave size={16} style={{color:'#dc2626'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Previous Pay Scale</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#991b1b',margin:0}}>{selectedRevision.previousPayScale}</p></div>
              <div style={{background:'#ecfdf5',borderRadius:'10px',padding:'16px 18px',border:'1px solid #a7f3d0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaMoneyBillWave size={16} style={{color:'#059669'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Revised Pay Scale</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#065f46',margin:0}}>{selectedRevision.revisedPayScale}</p></div>
              <div style={{background:'#fffbeb',borderRadius:'10px',padding:'16px 18px',border:'1px solid #fde68a'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaArrowUp size={16} style={{color:'#d97706'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Increment</span></div><p style={{fontSize:'18px',fontWeight:700,color:'#92400e',margin:0}}>{selectedRevision.incrementAmount||'Not calculated'}</p></div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#ea580c'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedRevision.status==='Active'?'#d1fae5':'#fee2e2',color:selectedRevision.status==='Active'?'#065f46':'#991b1b'}}>{selectedRevision.status||'Active'}</span></div>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}><FaFilePdf size={16} style={{color:'#dc2626'}}/> Pay Revision Document</h4>
              {selectedRevision.revisionDocumentName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedRevision.revisionDocumentName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}</div><div><p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedRevision.revisionDocumentName}</p><span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded document</span></div></div>
                  <button onClick={(e)=>handleViewDocument(e,selectedRevision)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}><FaEye size={14}/> View Document</button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}><FaFileAlt size={36} style={{marginBottom:'12px',opacity:0.3}}/><p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No document uploaded</p><span style={{fontSize:'13px'}}>No pay revision document has been uploaded</span></div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Pay Revision Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Order No.</th>
                    <th>Effective Date</th>
                    <th>Previous Pay Scale</th>
                    <th>Revised Pay Scale</th>
                    <th>Increment</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRevisions.length > 0 ? (
                    currentRevisions.map((rev,idx) => (
                      <tr 
                        key={rev.id}
                        onClick={() => handleRowClick(rev)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                    <td className="text-center">{startIndex + idx + 1}</td>
                         <td>                        
    {DUMMY_EMPLOYEES.find(e => e.id === rev.employeeId)?.name || 'Unknown'}
</td>
                        <td><strong>{rev.revisionOrderNo}</strong></td>
                        <td>{formatDate(rev.effectiveDate)}</td>
                        <td>{formatCurrency(rev.previousPayScale)}</td>
                        <td>
                          <span className="fw-bold text-success">
                            {formatCurrency(rev.revisedPayScale)}
                          </span>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                            <FaArrowUp className="me-1" size={10} /> {rev.incrementAmount || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                            {rev.revisionReason}
                          </span>
                        </td>
                       
           <td>
  <div
    className="d-flex align-items-center gap-1"
    style={{ cursor: "pointer" }}
    onClick={(e) => {
      e.stopPropagation();
      handleStatusToggle(
        rev.id,
        DUMMY_EMPLOYEES.find(e => e.id === rev.employeeId)?.name || "",
        rev.status || "Active"
      );
    }}
  >
    <div
      style={{
        width: "28px",
        height: "16px",
        borderRadius: "50px",
        backgroundColor:
          (rev.status || "Active") === "Active"
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
            (rev.status || "Active") === "Active"
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
          (rev.status || "Active") === "Active"
            ? "#9d174d"
            : "#94a3b8"
      }}
    >
      {rev.status || "Active"}
    </span>
  </div>
</td>
         
                       <td className="text-center">
  <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
    <button 
      className="cert-act cert-act--edit" 
      onClick={() => handleEdit(rev)} 
      title={rev.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
      disabled={rev.status === 'Inactive'}
      style={{ 
        opacity: rev.status === 'Inactive' ? 0.5 : 1,
        cursor: rev.status === 'Inactive' ? 'not-allowed' : 'pointer'
      }}
    >
      <FaEdit size={12} />
    </button>
  </div>
</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="11" className="text-center py-5">No pay revision records found</td></tr>
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

export default PayRevisionHistory;