import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaRupeeSign, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaChartLine,
  FaFileAlt, FaSearch, FaArrowUp, FaMoneyBillWave, FaUserTie
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const PayRevisionHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [revisions, setRevisions] = useState(initialData?.revisions || []);
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
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Dummy employees data for lookup
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer', currentPayScale: '₹50,000 - ₹80,000' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager', currentPayScale: '₹60,000 - ₹90,000' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer', currentPayScale: '₹70,000 - ₹1,00,000' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager', currentPayScale: '₹55,000 - ₹85,000' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant', currentPayScale: '₹45,000 - ₹70,000' }
  ];

  // Filtered employees for search
  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || 
           emp.code.toLowerCase().includes(search);
  });

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

  // Update existing order numbers
  useEffect(() => {
    setExistingOrderNos(revisions.map(rev => rev.revisionOrderNo));
  }, [revisions]);

  // Auto calculate increment amount
  useEffect(() => {
    if (formData.previousPayScale && formData.revisedPayScale) {
      const prev = parseFloat(formData.previousPayScale.replace(/[^0-9.-]/g, ''));
      const rev = parseFloat(formData.revisedPayScale.replace(/[^0-9.-]/g, ''));
      if (!isNaN(prev) && !isNaN(rev)) {
        const increment = rev - prev;
        const incrementPercent = ((increment / prev) * 100).toFixed(2);
        setFormData(prev => ({
          ...prev,
          incrementAmount: `₹${increment.toLocaleString()} (${incrementPercent}%)`
        }));
      }
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
    
    // Validate revised pay scale > previous pay scale
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    if (editingRevision) {
      const updated = revisions.map(rev =>
        rev.id === editingRevision.id
          ? { ...formData, id: rev.id, employeeId: selectedEmployee?.id || employeeId, employeeName: selectedEmployee?.name }
          : rev
      );
      setRevisions(updated);
      toast.success('Success', 'Pay revision updated successfully');
    } else {
      const newRevision = {
        id: Date.now(),
        ...formData,
        employeeId: selectedEmployee?.id || employeeId,
        employeeName: selectedEmployee?.name,
        createdAt: new Date().toISOString()
      };
      setRevisions([newRevision, ...revisions]);
      toast.success('Success', 'Pay revision added successfully');
    }
    resetForm();
  };

  const handleEdit = (revision) => {
    setEditingRevision(revision);
    setSelectedEmployee({ id: revision.employeeId, name: revision.employeeName });
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
  };

  const handleDelete = (id) => {
    setRevisions(revisions.filter(rev => rev.id !== id));
    toast.success('Success', 'Pay revision deleted successfully');
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeSearch(false);
    setSearchTerm('');
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
  };

  // Calculate total increment for stats
  const totalIncrement = revisions.reduce((sum, rev) => {
    const inc = parseFloat(rev.incrementAmount?.replace(/[^0-9.-]/g, '') || 0);
    return sum + (isNaN(inc) ? 0 : inc);
  }, 0);

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaMoneyBillWave className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Pay Revision History</h5>
          <p className="text-muted mb-0 small">Manage employee salary revision records</p>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedEmployee && revisions.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-primary text-white p-3 rounded-circle">
                  <FaChartLine size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{revisions.length}</h4>
                  <small className="text-muted">Total Revisions</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm bg-success bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-success text-white p-3 rounded-circle">
                  <FaArrowUp size={20} />
                </div>
                <div>
                  <h4 className="mb-0">₹{totalIncrement.toLocaleString()}</h4>
                  <small className="text-muted">Total Increment</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-warning text-white p-3 rounded-circle">
                  <FaCalendarAlt size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{revisions[0]?.effectiveDate ? formatDate(revisions[0].effectiveDate) : '—'}</h4>
                  <small className="text-muted">Last Revision</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Search Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold">🔍 Select Employee</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-12">
              <div className="position-relative">
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaSearch size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employee by name or code..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowEmployeeSearch(true);
                    }}
                    onFocus={() => setShowEmployeeSearch(true)}
                  />
                  {selectedEmployee && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => {
                        setSelectedEmployee(null);
                        setSearchTerm('');
                        resetForm();
                      }}
                    >
                      <FaTimes size={12} /> Clear
                    </button>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showEmployeeSearch && searchTerm && (
                  <div className="card position-absolute top-100 start-0 end-0 mt-1 shadow-lg" style={{ zIndex: 1000, maxHeight: '300px', overflow: 'auto' }}>
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
              <small className="text-muted">Select an employee to manage pay revision records</small>
            </div>
          </div>
          {selectedEmployee && (
            <div className="alert alert-success mt-3 mb-0 py-2">
              <FaUserTie className="me-2" /> <strong>Selected Employee:</strong> {selectedEmployee.name} ({selectedEmployee.code})
              {selectedEmployee.currentPayScale && (
                <span className="ms-3 text-muted">Current Pay Scale: {selectedEmployee.currentPayScale}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pay Revision Form - Show only if employee selected */}
      {selectedEmployee && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-light border-0 py-3">
            <h6 className="mb-0 fw-bold">
              {editingRevision ? '✏️ Edit Pay Revision' : '💰 New Pay Revision'}
            </h6>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Revision Order Number */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Revision Order Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${touched.revisionOrderNo && errors.revisionOrderNo ? 'is-invalid' : ''}`}
                    placeholder="e.g., ARI/PAY/2024/001"
                    value={formData.revisionOrderNo}
                    onChange={(e) => handleChange('revisionOrderNo', e.target.value)}
                    onBlur={() => handleBlur('revisionOrderNo')}
                  />
                  {errors.revisionOrderNo && <small className="text-danger">{errors.revisionOrderNo}</small>}
                  <small className="text-muted">Unique order number for pay revision</small>
                </div>

                {/* Effective Date */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Effective Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${touched.effectiveDate && errors.effectiveDate ? 'is-invalid' : ''}`}
                    value={formData.effectiveDate}
                    onChange={(e) => handleChange('effectiveDate', e.target.value)}
                    onBlur={() => handleBlur('effectiveDate')}
                  />
                  {errors.effectiveDate && <small className="text-danger">{errors.effectiveDate}</small>}
                  <small className="text-muted">Date when new salary takes effect</small>
                </div>

                {/* Revision Reason */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Revision Reason <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${touched.revisionReason && errors.revisionReason ? 'is-invalid' : ''}`}
                    value={formData.revisionReason}
                    onChange={(e) => handleChange('revisionReason', e.target.value)}
                    onBlur={() => handleBlur('revisionReason')}
                  >
                    <option value="">Select Reason</option>
                    {revisionReasons.map(reason => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                  {errors.revisionReason && <small className="text-danger">{errors.revisionReason}</small>}
                </div>

                {/* Previous Pay Scale */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Previous Pay Scale <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaRupeeSign size={14} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className={`form-control ${touched.previousPayScale && errors.previousPayScale ? 'is-invalid' : ''}`}
                      placeholder="e.g., ₹50,000 - ₹80,000"
                      value={formData.previousPayScale}
                      onChange={(e) => handleChange('previousPayScale', e.target.value)}
                      onBlur={() => handleBlur('previousPayScale')}
                    />
                  </div>
                  {errors.previousPayScale && <small className="text-danger">{errors.previousPayScale}</small>}
                  <small className="text-muted">Previous salary range or fixed amount</small>
                </div>

                {/* Revised Pay Scale */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Revised Pay Scale <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaRupeeSign size={14} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className={`form-control ${touched.revisedPayScale && errors.revisedPayScale ? 'is-invalid' : ''}`}
                      placeholder="e.g., ₹60,000 - ₹95,000"
                      value={formData.revisedPayScale}
                      onChange={(e) => handleChange('revisedPayScale', e.target.value)}
                      onBlur={() => handleBlur('revisedPayScale')}
                    />
                  </div>
                  {errors.revisedPayScale && <small className="text-danger">{errors.revisedPayScale}</small>}
                  <small className="text-muted">New salary range or fixed amount</small>
                </div>

                {/* Increment Amount (Auto-calculated) */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Increment Amount</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FaRupeeSign size={14} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={formData.incrementAmount}
                      readOnly
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <small className="text-muted">Auto-calculated based on pay scale difference</small>
                </div>

                {/* Revision Document Upload */}
                <div className="col-12">
                  <label className="form-label fw-bold">Revision Document</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="revision-doc-upload"
                    />
                    <label htmlFor="revision-doc-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload className="me-1" size={12} /> Choose File
                    </label>
                    {formData.revisionDocumentName && (
                      <div className="mt-2 text-primary">
                        {formData.revisionDocumentName.endsWith('.pdf') ? 
                          <FaFilePdf className="me-1" /> : <FaFileImage className="me-1" />}
                        {formData.revisionDocumentName}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancel 
                </button>
                <button type="submit" className="btn btn-primary">
                  <FaSave className="me-1" size={12} /> {editingRevision ? 'Update Revision' : 'Save Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Revision List Table - Show only if employee selected */}
      {selectedEmployee && revisions.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0 py-3">
            <h6 className="mb-0 fw-bold">📋 Pay Revision History - {selectedEmployee.name}</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
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
                  {revisions.map((rev) => (
                    <tr key={rev.id}>
                      <td><strong>{rev.revisionOrderNo}</strong></td>
                      <td>{formatDate(rev.effectiveDate)}</td>
                      <td>{formatCurrency(rev.previousPayScale)}</td>
                      <td>
                        <span className="fw-bold text-success">
                          {formatCurrency(rev.revisedPayScale)}
                        </span>
                       </td>
                      <td>
                        <span className="badge bg-success bg-opacity-10 text-success">
                          <FaArrowUp className="me-1" size={10} /> {rev.incrementAmount || '—'}
                        </span>
                       </td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {rev.revisionReason}
                        </span>
                       </td>
                      <td className="text-center">
                        {rev.revisionDocumentName ? (
                          <a 
                            href={rev.revisionDocumentData} 
                            download={rev.revisionDocumentName}
                            className="btn btn-sm btn-outline-primary"
                            title="Download Document"
                          >
                            <FaFileAlt size={12} className="me-1" /> View
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(rev)}>
                          <FaEdit size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(rev.id)}>
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

     
    </div>
  );
};

export default PayRevisionHistory;