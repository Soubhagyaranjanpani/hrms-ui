import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaBuilding, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaUserTie,
  FaFileAlt, FaSearch, FaExchangeAlt, FaClock,FaArrowRight,
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const DeputationManagement = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [deputations, setDeputations] = useState(initialData?.deputations || []);
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
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Dummy employees data for lookup
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  // Filtered employees for search
  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = searchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || 
           emp.code.toLowerCase().includes(search);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    if (editingDeputation) {
      const updated = deputations.map(dep =>
        dep.id === editingDeputation.id
          ? { ...formData, id: dep.id }
          : dep
      );
      setDeputations(updated);
      toast.success('Success', 'Deputation updated successfully');
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
  };

  const handleEdit = (deputation) => {
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
  };

  const handleDelete = (id) => {
    setDeputations(deputations.filter(dep => dep.id !== id));
    toast.success('Success', 'Deputation deleted successfully');
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeSearch(false);
    setSearchTerm('');
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
  };

  // Calculate deputation duration
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
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaExchangeAlt className="text-primary" size={24} />
        </div>
        <div>
          <h3 className="mb-0">Deputation Management</h3>
          <p className="text-muted mb-0 small">Manage employee deputation records</p>
        </div>
      </div>

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
              <small className="text-muted">Select an employee to manage deputation records</small>
            </div>
          </div>
          {selectedEmployee && (
            <div className="alert alert-success mt-3 mb-0 py-2">
              <FaUserTie className="me-2" /> <strong>Selected Employee:</strong> {selectedEmployee.name} ({selectedEmployee.code})
            </div>
          )}
        </div>
      </div>

      {/* Deputation Form - Show only if employee selected */}
      {selectedEmployee && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-light border-0 py-3">
            <h6 className="mb-0 fw-bold">
              {editingDeputation ? '✏️ Edit Deputation' : '📝 New Deputation Record'}
            </h6>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Deputation Order Number */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Deputation Order Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${touched.deputationOrderNo && errors.deputationOrderNo ? 'is-invalid' : ''}`}
                    placeholder="e.g., ARI/DEP/2024/001"
                    value={formData.deputationOrderNo}
                    onChange={(e) => handleChange('deputationOrderNo', e.target.value)}
                    onBlur={() => handleBlur('deputationOrderNo')}
                  />
                  {errors.deputationOrderNo && <small className="text-danger">{errors.deputationOrderNo}</small>}
                  <small className="text-muted">Unique order number for deputation</small>
                </div>

                {/* Deputation Organization */}
                <div className="col-md-8">
                  <label className="form-label fw-bold">
                    Deputation Organization <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${touched.deputationOrganization && errors.deputationOrganization ? 'is-invalid' : ''}`}
                    placeholder="e.g., Ministry of Corporate Affairs, PwC India, etc."
                    value={formData.deputationOrganization}
                    onChange={(e) => handleChange('deputationOrganization', e.target.value)}
                    onBlur={() => handleBlur('deputationOrganization')}
                  />
                  {errors.deputationOrganization && <small className="text-danger">{errors.deputationOrganization}</small>}
                </div>

                {/* Start Date */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Start Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${touched.startDate && errors.startDate ? 'is-invalid' : ''}`}
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    onBlur={() => handleBlur('startDate')}
                  />
                  {errors.startDate && <small className="text-danger">{errors.startDate}</small>}
                </div>

                {/* End Date */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    End Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${touched.endDate && errors.endDate ? 'is-invalid' : ''}`}
                    value={formData.endDate}
                    min={formData.startDate || undefined}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    onBlur={() => handleBlur('endDate')}
                  />
                  {errors.endDate && <small className="text-danger">{errors.endDate}</small>}
                </div>

                {/* Duration (Auto-calculated) */}
                <div className="col-md-2">
                  <label className="form-label fw-bold">Duration</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={getDuration(formData.startDate, formData.endDate)}
                    readOnly
                  />
                  <small className="text-muted">Auto-calculated</small>
                </div>

                {/* Deputation Type */}
                <div className="col-md-4">
                  <label className="form-label fw-bold">
                    Deputation Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${touched.deputationType && errors.deputationType ? 'is-invalid' : ''}`}
                    value={formData.deputationType}
                    onChange={(e) => handleChange('deputationType', e.target.value)}
                    onBlur={() => handleBlur('deputationType')}
                  >
                    {deputationTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.deputationType && <small className="text-danger">{errors.deputationType}</small>}
                </div>

                {/* Reporting Authority */}
                <div className="col-md-5">
                  <label className="form-label fw-bold">
                    Reporting Authority <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${touched.reportingAuthority && errors.reportingAuthority ? 'is-invalid' : ''}`}
                    value={formData.reportingAuthority}
                    onChange={(e) => handleChange('reportingAuthority', e.target.value)}
                    onBlur={() => handleBlur('reportingAuthority')}
                  >
                    <option value="">Select Authority</option>
                    {reportingAuthorities.map(auth => (
                      <option key={auth.value} value={auth.value}>{auth.label}</option>
                    ))}
                  </select>
                  {errors.reportingAuthority && <small className="text-danger">{errors.reportingAuthority}</small>}
                </div>

                {/* Order Upload */}
                <div className="col-12">
                  <label className="form-label fw-bold">Deputation Order Upload</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="deputation-order-upload"
                    />
                    <label htmlFor="deputation-order-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload className="me-1" size={12} /> Choose File
                    </label>
                    {formData.orderFileName && (
                      <div className="mt-2 text-primary">
                        {formData.orderFileName.endsWith('.pdf') ? 
                          <FaFilePdf className="me-1" /> : <FaFileImage className="me-1" />}
                        {formData.orderFileName}
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
                  <FaSave className="me-1" size={12} /> {editingDeputation ? 'Update Deputation' : 'Save Deputation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deputations List Table - Show only if employee selected */}
      {selectedEmployee && deputations.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0 py-3">
            <h6 className="mb-0 fw-bold">📋 Deputation History - {selectedEmployee.name}</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order No.</th>
                    <th>Organization</th>
                    <th>Period</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Reporting To</th>
                    <th>Document</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deputations.map((dep) => (
                    <tr key={dep.id}>
                      <td><strong>{dep.deputationOrderNo}</strong></td>
                      <td>{dep.deputationOrganization}</td>
                      <td>
                        <small>
                          {formatDate(dep.startDate)} <FaArrowRight className="mx-1 text-primary" size={10} /> {formatDate(dep.endDate)}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-info">
                          <FaClock className="me-1" size={10} /> {getDuration(dep.startDate, dep.endDate)}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {dep.deputationType}
                        </span>
                      </td>
                      <td>{dep.reportingAuthority}</td>
                      <td className="text-center">
                        {dep.orderFileName ? (
                          <a 
                            href={dep.orderFileData} 
                            download={dep.orderFileName}
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
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(dep)}>
                          <FaEdit size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(dep.id)}>
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

export default DeputationManagement;