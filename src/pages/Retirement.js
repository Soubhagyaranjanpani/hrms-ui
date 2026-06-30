import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaUserTie, FaEye, FaDownload, FaRupeeSign, FaClock, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const RetirementRecords = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [retirements, setRetirements] = useState(initialData?.retirements || [
    { id: 1, retirementDate: '2045-12-31', retirementType: 'Superannuation', pensionEligibility: 'Yes', pensionNumber: 'PEN/2045/001', retirementOrder: 'ORD/RET/2045/001', retirementBenefits: 'Gratuity, Provident Fund, Leave Encashment', createdAt: '2024-01-15T10:30:00Z', employeeName: 'John Doe', employeeCode: 'EMP001', superannuationDate: '2045-12-31' },
    { id: 2, retirementDate: '2040-06-15', retirementType: 'Superannuation', pensionEligibility: 'Yes', pensionNumber: 'PEN/2040/002', retirementOrder: 'ORD/RET/2040/002', retirementBenefits: 'Gratuity, Provident Fund', createdAt: '2024-02-20T11:45:00Z', employeeName: 'Jane Smith', employeeCode: 'EMP002', superannuationDate: '2040-06-15' },
    { id: 3, retirementDate: '2042-03-20', retirementType: 'Voluntary', pensionEligibility: 'Pending', pensionNumber: '', retirementOrder: 'ORD/RET/2042/003', retirementBenefits: 'Pending approval', createdAt: '2024-03-10T09:15:00Z', employeeName: 'Mike Johnson', employeeCode: 'EMP003', superannuationDate: '2042-03-20' },
    { id: 4, retirementDate: '2038-08-10', retirementType: 'Medical', pensionEligibility: 'Yes', pensionNumber: 'PEN/2038/004', retirementOrder: 'ORD/RET/2038/004', retirementBenefits: 'Medical benefits, Provident Fund', createdAt: '2024-04-05T14:20:00Z', employeeName: 'Sarah Williams', employeeCode: 'EMP004', superannuationDate: '2038-08-10' },
    { id: 5, retirementDate: '2048-01-05', retirementType: 'Superannuation', pensionEligibility: 'No', pensionNumber: '', retirementOrder: 'ORD/RET/2048/005', retirementBenefits: 'Provident Fund only', createdAt: '2024-05-12T10:00:00Z', employeeName: 'David Brown', employeeCode: 'EMP005', superannuationDate: '2048-01-05' }
  ]);
  
  const [editingRecord, setEditingRecord] = useState(null);
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
    setEditingRecord(record);
    setSelectedEmployee({ 
      id: record.employeeId, 
      name: record.employeeName,
      code: record.employeeCode,
      superannuationDate: record.superannuationDate
    });
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
    setShowForm(true);
  };

 

  const handleDelete = (id) => {
    setRetirements(retirements.filter(r => r.id !== id));
    toast.success('Success', 'Retirement record deleted successfully');
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
  };

  // Calculate stats
  const totalRetirements = retirements.length;
  const pensionEligible = retirements.filter(r => r.pensionEligibility === 'Yes').length;
  const upcomingRetirements = retirements.filter(r => new Date(r.retirementDate) > new Date()).length;

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Retirement Records</h1>
          <p className="cert-subtitle">Manage employee retirement records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Retirement Record
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
              <div className="cert-section-label">Retirement Details</div>
              <div className="cert-form-grid-3col">
                {/* Employee Selection */}
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
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
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
                </div>
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
                    <th>Document</th>
                   
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRetirements.length > 0 ? (
                    currentRetirements.map((record,idx) => (
                      <tr key={record.id}>
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
                        <td className="text-center">
                          {record.retirementOrderFileName ? (
                            <a href={record.retirementOrderFileData} download={record.retirementOrderFileName} className="btn btn-sm btn-outline-primary">
                              <FaFileAlt size={12} /> View
                            </a>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <div className="cert-actions">
                            
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(record)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(record.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="9" className="text-center py-5">No retirement records found</td></tr>
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

export default RetirementRecords;