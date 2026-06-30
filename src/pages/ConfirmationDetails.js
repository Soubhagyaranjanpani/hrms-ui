
import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaUserCheck, 
  FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaCheckCircle, FaSearch, FaArrowLeft, FaArrowRight
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ConfirmationDetails = ({ employeeId, employeeJoiningDate, initialData, onSuccess, onCancel }) => {
  const [confirmations, setConfirmations] = useState(initialData?.confirmations || [
    { id: 1, employeeId:1,confirmationOrderNo: 'CONF/2024/001', confirmationDate: '2024-07-15', confirmedBy: 'HR Manager', remarks: 'Performance satisfactory', createdAt: '2024-07-15T10:30:00Z' },
    { id: 2, employeeId:2,confirmationOrderNo: 'CONF/2024/002', confirmationDate: '2024-08-20', confirmedBy: 'CEO', remarks: 'Excellent performance', createdAt: '2024-08-20T11:45:00Z' },
    { id: 3, employeeId:3,confirmationOrderNo: 'CONF/2024/003', confirmationDate: '2024-06-10', confirmedBy: 'HR Director', remarks: 'Probation completed', createdAt: '2024-06-10T09:15:00Z' },
    { id: 4, employeeId:4,confirmationOrderNo: 'CONF/2024/004', confirmationDate: '2024-09-05', confirmedBy: 'Department Head', remarks: '', createdAt: '2024-09-05T14:20:00Z' },
    { id: 5, employeeId:5,confirmationOrderNo: 'CONF/2024/005', confirmationDate: '2024-10-12', confirmedBy: 'Senior HR Officer', remarks: 'Confirmed after review', createdAt: '2024-10-12T10:00:00Z' }
  ]);
  
  const [editingConfirmation, setEditingConfirmation] = useState(null);
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

const DUMMY_EMPLOYEES = [
  { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
  { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
  { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
  { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
  { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
];
  // Dummy data for Confirmed By dropdown
  const confirmedByOptions = [
    { value: 'HR Manager', label: 'HR Manager' },
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'CEO', label: 'CEO' },
    { value: 'Department Head', label: 'Department Head' },
    { value: 'Senior HR Officer', label: 'Senior HR Officer' }
  ];

  // Filter confirmations by search
  const filteredConfirmations = confirmations.filter(conf => {
    const search = searchTerm.toLowerCase();
    return conf.confirmationOrderNo.toLowerCase().includes(search) ||
           conf.confirmedBy.toLowerCase().includes(search) ||
           (conf.remarks && conf.remarks.toLowerCase().includes(search));
  });

  // Pagination
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

  // Update existing order numbers
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
     const ConfirmationData = {
    ...formData,
    employeeId: selectedEmployee?.id || null,  
    id: editingConfirmation ? editingConfirmation.id : Date.now(),
    createdAt: editingConfirmation ? editingConfirmation.createdAt : new Date().toISOString()
  };
    if (editingConfirmation) {
      const updated = confirmations.map(conf =>
        conf.id === editingConfirmation.id
          ? { ...formData, id: conf.id, createdAt: conf.createdAt }
          : conf
      );
      setConfirmations(updated);
      toast.success('Success', 'Confirmation details updated successfully');
      setEditingConfirmation(null);
    } else {
      const newConfirmation = {
        id: Date.now(),
        ...formData,
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

  const handleDelete = (id) => {
    setConfirmations(confirmations.filter(conf => conf.id !== id));
    toast.success('Success', 'Confirmation record deleted successfully');
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
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Confirmation
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

      {/* Joining Date Info Alert */}
      {employeeJoiningDate && !showForm && (
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
        // Form View
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Confirmation Details</div>
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
                  <small>Optional: Any special notes or comments</small>
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
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
                </div>
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
      ) : (
        // List View
        <>
          {/* Search Bar */}
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

       

          {/* Confirmations Table */}
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
                    <th>Document</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentConfirmations.length > 0 ? (
                    currentConfirmations.map((conf,idx) => (
                      <tr key={conf.id}>
                      <td className="text-center">{startIndex + idx + 1}</td>

                         <td> {DUMMY_EMPLOYEES.find(e => e.id === conf.employeeId)?.name || 'Unknown'}
</td>
                        <td><strong>{conf.confirmationOrderNo}</strong></td>
                        <td>
                          <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                            <FaCheckCircle className="me-1" size={10} /> {formatDate(conf.confirmationDate)}
                          </span>
                        </td>
                        <td>{conf.confirmedBy}</td>
                        <td>{conf.remarks ? <span className="text-muted small">{conf.remarks}</span> : <span className="text-muted">—</span>}</td>
                        <td>
                          {conf.confirmationDocumentName ? (
                            <a href={conf.confirmationDocumentData} download={conf.confirmationDocumentName} className="btn btn-sm btn-outline-primary">
                              <FaFileAlt size={12} /> View
                            </a>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="cert-actions">
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(conf)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(conf.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center py-5">No confirmation records found</td></tr>
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

export default ConfirmationDetails;