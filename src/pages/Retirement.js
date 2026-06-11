import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaUserTie, FaEye, FaDownload, FaRupeeSign, FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const RetirementRecords = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [retirements, setRetirements] = useState(initialData?.retirements || []);
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
    retirementOrderFileName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer', superannuationDate: '2045-12-31' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager', superannuationDate: '2040-06-15' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer', superannuationDate: '2042-03-20' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager', superannuationDate: '2038-08-10' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant', superannuationDate: '2048-01-05' }
  ];

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

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
      else if (selectedEmployee && selectedEmployee.superannuationDate) {
        if (new Date(value) < new Date(selectedEmployee.superannuationDate)) {
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
    } else if (selectedEmployee && selectedEmployee.superannuationDate) {
      if (new Date(formData.retirementDate) < new Date(selectedEmployee.superannuationDate)) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    const recordData = {
      ...formData,
      employeeId: selectedEmployee?.id || employeeId,
      employeeName: selectedEmployee?.name,
      employeeCode: selectedEmployee?.code,
      superannuationDate: selectedEmployee?.superannuationDate,
      createdAt: new Date().toISOString()
    };
    
    if (editingRecord) {
      const updated = retirements.map(r =>
        r.id === editingRecord.id ? { ...recordData, id: r.id } : r
      );
      setRetirements(updated);
      toast.success('Success', 'Retirement record updated successfully');
    } else {
      const newRecord = { id: Date.now(), ...recordData };
      setRetirements([newRecord, ...retirements]);
      toast.success('Success', 'Retirement record added successfully');
    }
    resetForm();
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
      retirementOrderFileName: record.retirementOrderFileName
    });
  };

  const handleView = (record) => {
    setViewingRecord(record);
    setShowViewModal(true);
  };

  const handleDelete = (id) => {
    setRetirements(retirements.filter(r => r.id !== id));
    toast.success('Success', 'Retirement record deleted successfully');
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowDropdown(false);
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
      retirementOrderFileName: null
    });
    setErrors({});
    setTouched({});
    setEditingRecord(null);
  };

  // Calculate stats
  const totalRetirements = retirements.length;
  const pensionEligible = retirements.filter(r => r.pensionEligibility === 'Yes').length;
  const upcomingRetirements = retirements.filter(r => new Date(r.retirementDate) > new Date()).length;

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaCalendarAlt className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Retirement Records</h5>
          <p className="text-muted mb-0 small">Manage employee retirement records</p>
        </div>
      </div>

      {/* Stats */}
      {selectedEmployee && retirements.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card bg-primary bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-primary text-white p-3 rounded-circle">
                  <FaCalendarAlt size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{totalRetirements}</h4>
                  <small className="text-muted">Total Retirements</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-success text-white p-3 rounded-circle">
                  <FaRupeeSign size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{pensionEligible}</h4>
                  <small className="text-muted">Pension Eligible</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-warning bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-warning text-white p-3 rounded-circle">
                  <FaClock size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{upcomingRetirements}</h4>
                  <small className="text-muted">Upcoming</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Employee */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">Search Employee</h6>
        </div>
        <div className="card-body">
          <div className="position-relative">
            <div className="input-group">
        
                <span className="input-group-text bg-light">
                  <FaSearch size={14} />
                </span>

              <input
                type="text"
                className="form-control"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {selectedEmployee && (
    
                  <button className="btn btn-outline-danger" onClick={() => { setSelectedEmployee(null); setSearchTerm(''); resetForm(); }}>
                     Cancel
                  </button>
        
              )}
            </div>
            
            {showDropdown && searchTerm && (
              <div className="dropdown-menu show w-100 mt-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => (
                    <button key={emp.id} className="dropdown-item" onClick={() => handleEmployeeSelect(emp)}>
                      <div className="font-weight-bold">{emp.name}</div>
                      <small className="text-muted">{emp.code} | {emp.department} | Superannuation: {formatDate(emp.superannuationDate)}</small>
                    </button>
                  ))
                ) : (
                  <div className="dropdown-item text-center text-muted">No employees found</div>
                )}
              </div>
            )}
          </div>
                           <small className="text-muted mt-2 d-block">Type employee name or code to search</small>

          {selectedEmployee && (
            <div className="alert alert-info mt-3 mb-0 py-2">
              <FaUserTie className="mr-2" /> 
              <strong>Selected:</strong> {selectedEmployee.name} ({selectedEmployee.code}) | 
              <strong> Superannuation Date:</strong> {formatDate(selectedEmployee.superannuationDate)}
            </div>
          )}
        </div>
      </div>

      {/* Form - 2 columns per row */}
      {selectedEmployee && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <h6 className="mb-0">{editingRecord ? 'Edit Retirement Record' : 'New Retirement Record'}</h6>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Retirement Date - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Retirement Date <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="date" 
                    className={`form-control ${errors.retirementDate ? 'is-invalid' : ''}`} 
                    value={formData.retirementDate} 
                    min={selectedEmployee?.superannuationDate}
                    onChange={(e) => handleChange('retirementDate', e.target.value)} 
                    onBlur={() => handleBlur('retirementDate')}
                  />
                  {errors.retirementDate && <small className="text-danger">{errors.retirementDate}</small>}
                  <small className="text-muted">Must be on or after superannuation date: {formatDate(selectedEmployee?.superannuationDate)}</small>
                </div>

                {/* Retirement Type - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Retirement Type <span className="text-danger">*</span>
                  </label>
                  <select 
                    className={`form-control ${errors.retirementType ? 'is-invalid' : ''}`} 
                    value={formData.retirementType} 
                    onChange={(e) => handleChange('retirementType', e.target.value)} 
                    onBlur={() => handleBlur('retirementType')}
                  >
                    {retirementTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.retirementType && <small className="text-danger">{errors.retirementType}</small>}
                </div>

                {/* Pension Eligibility - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Pension Eligibility <span className="text-danger">*</span>
                  </label>
                  <select 
                    className={`form-control ${errors.pensionEligibility ? 'is-invalid' : ''}`} 
                    value={formData.pensionEligibility} 
                    onChange={(e) => handleChange('pensionEligibility', e.target.value)} 
                    onBlur={() => handleBlur('pensionEligibility')}
                  >
                    {pensionEligibilityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.pensionEligibility && <small className="text-danger">{errors.pensionEligibility}</small>}
                </div>

                {/* Pension Number - col 6 (conditional) */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Pension Number {formData.pensionEligibility === 'Yes' && <span className="text-danger">*</span>}
                  </label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.pensionNumber ? 'is-invalid' : ''}`} 
                    placeholder="e.g., PEN/2024/001"
                    value={formData.pensionNumber} 
                    onChange={(e) => handleChange('pensionNumber', e.target.value)} 
                    onBlur={() => handleBlur('pensionNumber')}
                  />
                  {errors.pensionNumber && <small className="text-danger">{errors.pensionNumber}</small>}
                </div>

                {/* Retirement Order - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Retirement Order <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.retirementOrder ? 'is-invalid' : ''}`} 
                    placeholder="e.g., ORD/RET/2024/001"
                    value={formData.retirementOrder} 
                    onChange={(e) => handleChange('retirementOrder', e.target.value)} 
                    onBlur={() => handleBlur('retirementOrder')}
                  />
                  {errors.retirementOrder && <small className="text-danger">{errors.retirementOrder}</small>}
                </div>

                {/* Retirement Benefits - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Retirement Benefits</label>
                  <textarea 
                    rows="2" 
                    className="form-control" 
                    placeholder="e.g., Gratuity, Leave Encashment, Provident Fund, etc."
                    value={formData.retirementBenefits} 
                    onChange={(e) => handleChange('retirementBenefits', e.target.value)}
                  />
                </div>

                {/* Retirement Order Upload - col 12 */}
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Retirement Order Upload</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                      id="retirement-order-upload" 
                    />
                    <label htmlFor="retirement-order-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload className="mr-1" /> Choose File
                    </label>
                    {formData.retirementOrderFileName && (
                      <div className="mt-2 text-primary">
                        {formData.retirementOrderFileName.endsWith('.pdf') ? 
                          <FaFilePdf className="mr-1" /> : <FaFileImage className="mr-1" />}
                        {formData.retirementOrderFileName}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Clear</button>
                <button type="submit" className="btn btn-primary"><FaSave className="mr-1" /> {editingRecord ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {selectedEmployee && retirements.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-light">
            <h6 className="mb-0">Retirement Records - {selectedEmployee.name}</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead className="thead-light">
                <tr>
                  <th>Retirement Date</th>
                  <th>Retirement Type</th>
                  <th>Pension Eligibility</th>
                  <th>Pension Number</th>
                  <th>Retirement Order</th>
                  <th>Benefits</th>
                  <th>Document</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {retirements.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.retirementDate)}</td>
                    <td>{record.retirementType}</td>
                    <td className="text-center">
                      {record.pensionEligibility === 'Yes' ? (
                        <span className="badge badge-success">Yes</span>
                      ) : record.pensionEligibility === 'Pending' ? (
                        <span className="badge badge-warning">Pending</span>
                      ) : (
                        <span className="badge badge-secondary">No</span>
                      )}
                    </td>
                    <td>{record.pensionNumber || '—'}</td>
                    <td><strong>{record.retirementOrder}</strong></td>
                    <td>{record.retirementBenefits ? (record.retirementBenefits.length > 30 ? record.retirementBenefits.substring(0, 30) + '...' : record.retirementBenefits) : '—'}</td>
                    <td className="text-center">
                      {record.retirementOrderFileName ? (
                        <a href={record.retirementOrderFileData} download={record.retirementOrderFileName} className="btn btn-sm btn-outline-primary">
                          <FaFileAlt size={12} /> View
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-info mr-1" onClick={() => handleView(record)}><FaEye size={12} /></button>
                      <button className="btn btn-sm btn-outline-primary mr-1" onClick={() => handleEdit(record)}><FaEdit size={12} /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(record.id)}><FaTrash size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* View Modal */}
      {showViewModal && viewingRecord && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><FaCalendarAlt className="mr-2" /> Retirement Details</h5>
                <button type="button" className="close text-white" onClick={() => setShowViewModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p><strong>Employee:</strong> {viewingRecord.employeeName} ({viewingRecord.employeeCode})</p>
                <p><strong>Retirement Date:</strong> {formatDate(viewingRecord.retirementDate)}</p>
                <p><strong>Retirement Type:</strong> {viewingRecord.retirementType}</p>
                <p><strong>Superannuation Date:</strong> {formatDate(viewingRecord.superannuationDate)}</p>
                <p><strong>Pension Eligibility:</strong> {viewingRecord.pensionEligibility}</p>
                <p><strong>Pension Number:</strong> {viewingRecord.pensionNumber || '—'}</p>
                <p><strong>Retirement Order:</strong> {viewingRecord.retirementOrder}</p>
                <p><strong>Retirement Benefits:</strong> {viewingRecord.retirementBenefits || '—'}</p>
                {viewingRecord.retirementOrderFileName && (
                  <a href={viewingRecord.retirementOrderFileData} download={viewingRecord.retirementOrderFileName} className="btn btn-sm btn-primary mt-2">Download Document</a>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetirementRecords;