import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaExchangeAlt, FaBuilding, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaMapMarkerAlt, 
  FaBriefcase, FaFileAlt, FaSearch, FaArrowRight,FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const TransferHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [transfers, setTransfers] = useState(initialData?.transfers || [
    { id: 1, transferOrderNo: 'TRF/2024/001', transferDate: '2024-06-01', transferType: 'Permanent', fromDepartment: 'IT', toDepartment: 'IT', fromBranch: 'Mumbai - Head Office', toBranch: 'Bangalore - South Region', effectiveDate: '2024-06-15', transferReason: 'Project requirement', createdAt: '2024-06-01T10:30:00Z' },
    { id: 2, transferOrderNo: 'TRF/2024/002', transferDate: '2024-08-20', transferType: 'Temporary', fromDepartment: 'HR', toDepartment: 'Operations', fromBranch: 'Delhi - North Region', toBranch: 'Mumbai - Head Office', effectiveDate: '2024-09-01', transferReason: 'Department restructuring', createdAt: '2024-08-20T11:45:00Z' },
    { id: 3, transferOrderNo: 'TRF/2024/003', transferDate: '2024-10-15', transferType: 'On Deputation', fromDepartment: 'Finance', toDepartment: 'Legal', fromBranch: 'Chennai - East Region', toBranch: 'Hyderabad - Central Region', effectiveDate: '2024-11-01', transferReason: 'Special assignment', createdAt: '2024-10-15T09:15:00Z' },
    { id: 4, transferOrderNo: 'TRF/2024/004', transferDate: '2024-12-01', transferType: 'Permanent', fromDepartment: 'Sales', toDepartment: 'Marketing', fromBranch: 'Kolkata - East Region', toBranch: 'Delhi - North Region', effectiveDate: '2024-12-15', transferReason: 'Promotion transfer', createdAt: '2024-12-01T14:20:00Z' },
    { id: 5, transferOrderNo: 'TRF/2024/005', transferDate: '2024-12-10', transferType: 'Contractual', fromDepartment: 'IT', toDepartment: 'Operations', fromBranch: 'Bangalore - South Region', toBranch: 'Pune - West Region', effectiveDate: '2025-01-01', transferReason: 'Contract completion', createdAt: '2024-12-10T10:00:00Z' }
  ]);
  
  const [editingTransfer, setEditingTransfer] = useState(null);
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
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setTransfers(transfers.filter(transfer => transfer.id !== id));
    toast.success('Success', 'Transfer deleted successfully');
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
          <h1 className="cert-title">Transfer History</h1>
          <p className="cert-subtitle">Manage employee transfer records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Transfer
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
        // Form View
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Transfer Details</div>
              <div className="cert-form-grid-3col">
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
                    <th>Order No.</th>
                    <th>Transfer Date</th>
                    <th>From → To (Branch)</th>
                    <th>Department (From → To)</th>
                    <th>Transfer Type</th>
                    <th>Effective Date</th>
                    <th>Reason</th>
                    <th>Document</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransfers.length > 0 ? (
                    currentTransfers.map((transfer) => (
                      <tr key={transfer.id}>
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
                        <td className="text-center">
                          {transfer.transferOrderFileName ? (
                            <a href={transfer.transferOrderFileData} download={transfer.transferOrderFileName} className="btn btn-sm btn-outline-primary">
                              <FaFileAlt size={12} /> View
                            </a>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <div className="cert-actions">
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(transfer)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(transfer.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-5">No transfer records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="emp-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="emp-page-info">
                    Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} transfers
                  </span>
                </div>
                <div className="emp-page-controls">
                  <button className="emp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={`dots-${i}`} className="emp-page-dots">…</span>
                    ) : (
                      <button key={pg} className={`emp-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button className="emp-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
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

export default TransferHistory;