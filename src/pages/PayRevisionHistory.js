
import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaRupeeSign, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaChartLine,
  FaFileAlt, FaSearch, FaArrowUp, FaMoneyBillWave, FaUserTie, FaArrowLeft,
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const PayRevisionHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [revisions, setRevisions] = useState(initialData?.revisions || [
    { id: 1, employeeId:1,revisionOrderNo: 'PAY/2024/001', effectiveDate: '2024-01-01', previousPayScale: '₹50,000 - ₹80,000', revisedPayScale: '₹55,000 - ₹88,000', incrementAmount: '₹5,000 (10%)', revisionReason: 'Annual Increment', createdAt: '2024-01-01T10:30:00Z' },
    { id: 2, employeeId:2,revisionOrderNo: 'PAY/2024/002', effectiveDate: '2024-03-15', previousPayScale: '₹55,000 - ₹88,000', revisedPayScale: '₹65,000 - ₹1,00,000', incrementAmount: '₹10,000 (18%)', revisionReason: 'Promotion', createdAt: '2024-03-15T11:45:00Z' },
    { id: 3, employeeId:3,revisionOrderNo: 'PAY/2024/003', effectiveDate: '2024-06-01', previousPayScale: '₹60,000 - ₹90,000', revisedPayScale: '₹65,000 - ₹95,000', incrementAmount: '₹5,000 (8%)', revisionReason: 'Performance Based', createdAt: '2024-06-01T09:15:00Z' },
    { id: 4, employeeId:4,revisionOrderNo: 'PAY/2024/004', effectiveDate: '2024-08-20', previousPayScale: '₹45,000 - ₹70,000', revisedPayScale: '₹50,000 - ₹78,000', incrementAmount: '₹5,000 (11%)', revisionReason: 'Market Correction', createdAt: '2024-08-20T14:20:00Z' },
    { id: 5, employeeId:5,revisionOrderNo: 'PAY/2024/005', effectiveDate: '2024-10-01', previousPayScale: '₹70,000 - ₹1,00,000', revisedPayScale: '₹80,000 - ₹1,20,000', incrementAmount: '₹10,000 (14%)', revisionReason: 'Grade Revision', createdAt: '2024-10-01T10:00:00Z' }
  ]);
  
  const [editingRevision, setEditingRevision] = useState(null);
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
  
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

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
     const appointmentData = {
    ...formData,
    employeeId: selectedEmployee?.id || null,  
    id: editingRevision ? editingRevision.id : Date.now(),
    createdAt: editingRevision ? editingRevision.createdAt : new Date().toISOString()
  };
    if (editingRevision) {
      const updated = revisions.map(rev =>
        rev.id === editingRevision.id
          ? { ...formData, id: rev.id, createdAt: rev.createdAt, employeeId: employeeId }
          : rev
      );
      setRevisions(updated);
      toast.success('Success', 'Pay revision updated successfully');
      setEditingRevision(null);
    } else {
      const newRevision = {
        id: Date.now(),
        ...formData,
        employeeId: employeeId,
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

  const handleDelete = (id) => {
    setRevisions(revisions.filter(rev => rev.id !== id));
    toast.success('Success', 'Pay revision deleted successfully');
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
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Pay Revision
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

     

      {/* Pay Revision Form */}
      {showForm ? (
        <div className="cert-form-wrap mb-4">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Pay Revision Details</div>
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
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
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
                </div>
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
                    <th>Document</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRevisions.length > 0 ? (
                    currentRevisions.map((rev,idx) => (
                      <tr key={rev.id}>
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
                        <td className="text-center">
                          {rev.revisionDocumentName ? (
                            <a href={rev.revisionDocumentData} download={rev.revisionDocumentName} className="btn btn-sm btn-outline-primary">
                              <FaFileAlt size={12} /> View
                            </a>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center">
                          <div className="cert-actions">
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(rev)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(rev.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="text-center py-5">No pay revision records found</td></tr>
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

export default PayRevisionHistory;