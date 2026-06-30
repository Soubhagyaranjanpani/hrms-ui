import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaBuilding, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaUserTie,
  FaFileAlt, FaSearch, FaExchangeAlt, FaClock, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const DeputationManagement = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [deputations, setDeputations] = useState(initialData?.deputations || [
    { id: 1,employeeId:1, deputationOrderNo: 'DEP/2024/001', deputationOrganization: 'Ministry of Corporate Affairs', startDate: '2024-01-15', endDate: '2024-06-15', deputationType: 'Government', reportingAuthority: 'HR Director', createdAt: '2024-01-15T10:30:00Z' },
    { id: 2,employeeId:2, deputationOrderNo: 'DEP/2024/002', deputationOrganization: 'PwC India', startDate: '2024-03-01', endDate: '2024-08-31', deputationType: 'Project Based', reportingAuthority: 'Project Director', createdAt: '2024-03-01T11:45:00Z' },
    { id: 3, employeeId:3,deputationOrderNo: 'DEP/2024/003', deputationOrganization: 'Harvard Business School', startDate: '2024-05-10', endDate: '2024-07-20', deputationType: 'Training', reportingAuthority: 'Department Head', createdAt: '2024-05-10T09:15:00Z' },
    { id: 4, employeeId:4,deputationOrderNo: 'DEP/2024/004', deputationOrganization: 'World Bank', startDate: '2024-08-01', endDate: '2025-01-31', deputationType: 'International', reportingAuthority: 'CEO', createdAt: '2024-08-01T14:20:00Z' },
    { id: 5, employeeId:5,deputationOrderNo: 'DEP/2024/005', deputationOrganization: 'NITI Aayog', startDate: '2024-10-15', endDate: '2025-03-15', deputationType: 'Domestic', reportingAuthority: 'Managing Director', createdAt: '2024-10-15T10:00:00Z' }
  ]);
  
  const [editingDeputation, setEditingDeputation] = useState(null);
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
   // Employee Search State
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  
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
     const emp = DUMMY_EMPLOYEES.find(e => e.id === deputation.employeeId);  
  setSelectedEmployee(emp || null); 
    setEditingDeputation(deputation);
    setSelectedEmployee({ id: deputation.employeeId, name: deputation.employeeName });
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

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Deputation Management</h1>
          <p className="cert-subtitle">Manage employee deputation records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Deputation
            </button>
          )}
          {showForm && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleCancelForm}
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
        // Form View
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Deputation Details</div>
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
                
                {/* Order Upload */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Order Upload</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="order-upload" />
                    <label htmlFor="order-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.orderFileName && (
                      <div className="mt-2 text-primary">
                        {formData.orderFileName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.orderFileName}
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
                <FaSave size={12} /> {editingDeputation ? 'Update Deputation' : 'Save Deputation'}
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
                    <th>Document</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDeputations.length > 0 ? (
                    currentDeputations.map((dep,idx) => (
                      <tr key={dep.id}>
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
                        <td className="text-center">
                          {dep.orderFileName ? (
                            <a href={dep.orderFileData} download={dep.orderFileName} className="btn btn-sm btn-outline-primary">
                              <FaFileAlt size={12} /> View
                            </a>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center">
                          <div className="cert-actions">
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(dep)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(dep.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-5">No deputation records found</td>
                    </tr>
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

export default DeputationManagement;