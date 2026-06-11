import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaGavel, FaCalendarAlt, FaUserShield, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaPlus, FaExclamationTriangle,
  FaFileAlt, FaSearch, FaCheckCircle, FaClock, FaUserTie, FaEye, FaDownload
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const DisciplinaryRecords = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [disciplinaries, setDisciplinaries] = useState(initialData?.disciplinaries || []);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    caseNumber: '',
    incidentDate: '',
    actionType: 'Warning',
    investigationOfficer: '',
    penalty: '',
    resolutionDate: '',
    supportingDocuments: null,
    supportingDocumentsData: null,
    supportingDocumentsName: null,
    remarks: '',
    status: 'Open'
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingCaseNumbers, setExistingCaseNumbers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

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

  // Action Types
  const actionTypes = [
    { value: 'Warning', label: 'Warning Letter' },
    { value: 'Show Cause', label: 'Show Cause Notice' },
    { value: 'Suspension', label: 'Suspension' },
    { value: 'Fine', label: 'Fine / Penalty' },
    { value: 'Demotion', label: 'Demotion' },
    { value: 'Termination', label: 'Termination' },
    { value: 'Legal Notice', label: 'Legal Notice' }
  ];

  // Penalty Options
  const penaltyOptions = [
    { value: 'None', label: 'None' },
    { value: 'Salary Deduction', label: 'Salary Deduction' },
    { value: 'Leave Without Pay', label: 'Leave Without Pay' },
    { value: 'Bonus Cancellation', label: 'Bonus Cancellation' },
    { value: 'Increment Hold', label: 'Increment Hold' },
    { value: 'Promotion Hold', label: 'Promotion Hold' },
    { value: 'Training Cost Recovery', label: 'Training Cost Recovery' }
  ];

  // Status Options
  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'Under Investigation', label: 'Under Investigation' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
  ];

  // Investigation Officers
  const investigationOfficers = [
    { value: 'Mr. Ramesh Sharma', label: 'Mr. Ramesh Sharma - HR Manager' },
    { value: 'Ms. Priya Singh', label: 'Ms. Priya Singh - Senior HR' },
    { value: 'Mr. Amit Patel', label: 'Mr. Amit Patel - Legal Head' },
    { value: 'Ms. Neha Gupta', label: 'Ms. Neha Gupta - Compliance Officer' },
    { value: 'Mr. Vikram Mehta', label: 'Mr. Vikram Mehta - HR Director' }
  ];

  // Update existing case numbers
  useEffect(() => {
    setExistingCaseNumbers(disciplinaries.map(rec => rec.caseNumber));
  }, [disciplinaries]);

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
          supportingDocuments: file,
          supportingDocumentsData: reader.result,
          supportingDocumentsName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'caseNumber') {
      if (!value) error = 'Case Number is required';
      else if (existingCaseNumbers.includes(value) && (!editingRecord || editingRecord.caseNumber !== value)) {
        error = 'This Case Number already exists';
      }
    }
    else if (field === 'incidentDate' && !value) error = 'Incident Date is required';
    else if (field === 'actionType' && !value) error = 'Action Type is required';
    else if (field === 'investigationOfficer' && !value) error = 'Investigation Officer is required';
    else if (field === 'penalty' && !value) error = 'Penalty is required';
    
    if (field === 'resolutionDate' && value && formData.incidentDate) {
      if (new Date(value) < new Date(formData.incidentDate)) {
        error = 'Resolution Date must be on or after Incident Date';
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
    
    if (!formData.caseNumber) {
      newErrors.caseNumber = 'Case Number is required';
    } else if (existingCaseNumbers.includes(formData.caseNumber) && 
        (!editingRecord || editingRecord.caseNumber !== formData.caseNumber)) {
      newErrors.caseNumber = 'Case Number already exists';
    }
    
    if (!formData.incidentDate) newErrors.incidentDate = 'Incident Date is required';
    if (!formData.actionType) newErrors.actionType = 'Action Type is required';
    if (!formData.investigationOfficer) newErrors.investigationOfficer = 'Investigation Officer is required';
    if (!formData.penalty) newErrors.penalty = 'Penalty is required';
    
    if (formData.resolutionDate && formData.incidentDate) {
      if (new Date(formData.resolutionDate) < new Date(formData.incidentDate)) {
        newErrors.resolutionDate = 'Resolution Date must be on or after Incident Date';
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
    
    const recordData = {
      ...formData,
      employeeId: selectedEmployee?.id || employeeId,
      employeeName: selectedEmployee?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (editingRecord) {
      const updated = disciplinaries.map(rec =>
        rec.id === editingRecord.id
          ? { ...recordData, id: rec.id }
          : rec
      );
      setDisciplinaries(updated);
      toast.success('Success', 'Disciplinary record updated successfully');
    } else {
      const newRecord = { id: Date.now(), ...recordData };
      setDisciplinaries([newRecord, ...disciplinaries]);
      toast.success('Success', 'Disciplinary record added successfully');
    }
    resetForm();
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setSelectedEmployee({ id: record.employeeId, name: record.employeeName });
    setFormData({
      caseNumber: record.caseNumber,
      incidentDate: record.incidentDate,
      actionType: record.actionType,
      investigationOfficer: record.investigationOfficer,
      penalty: record.penalty,
      resolutionDate: record.resolutionDate || '',
      supportingDocuments: null,
      supportingDocumentsData: record.supportingDocumentsData,
      supportingDocumentsName: record.supportingDocumentsName,
      remarks: record.remarks || '',
      status: record.status || 'Open'
    });
  };

  const handleView = (record) => {
    setViewingRecord(record);
    setShowViewModal(true);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const resetForm = () => {
    setFormData({
      caseNumber: '',
      incidentDate: '',
      actionType: 'Warning',
      investigationOfficer: '',
      penalty: '',
      resolutionDate: '',
      supportingDocuments: null,
      supportingDocumentsData: null,
      supportingDocumentsName: null,
      remarks: '',
      status: 'Open'
    });
    setErrors({});
    setTouched({});
    setEditingRecord(null);
  };

  // Calculate stats
  const openCases = disciplinaries.filter(d => d.status === 'Open' || d.status === 'Under Investigation').length;
  const resolvedCases = disciplinaries.filter(d => d.status === 'Resolved' || d.status === 'Closed').length;

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaGavel className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Disciplinary Action Records</h5>
          <p className="text-muted mb-0 small">Manage employee disciplinary records and conduct history</p>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedEmployee && disciplinaries.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-warning text-white p-3 rounded-circle">
                  <FaExclamationTriangle size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{openCases}</h4>
                  <small className="text-muted">Open Cases</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm bg-success bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-success text-white p-3 rounded-circle">
                  <FaCheckCircle size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{resolvedCases}</h4>
                  <small className="text-muted">Resolved/Closed</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm bg-danger bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-danger text-white p-3 rounded-circle">
                  <FaFileAlt size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{disciplinaries.length}</h4>
                  <small className="text-muted">Total Records</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Search Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0 fw-bold">🔍 Select Employee</h6>
        </div>
        <div className="card-body">
          <div className="position-relative">
            <div className="input-group">
              <span className="input-group-text bg-light">
                <FaSearch size={14} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by employee name or code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
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
                   Cancel
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showDropdown && searchTerm && (
              <div className="dropdown-menu show w-100 mt-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      className="dropdown-item d-flex justify-content-between align-items-center"
                      onClick={() => handleEmployeeSelect(emp)}
                    >
                      <div>
                        <div className="fw-bold">{emp.name}</div>
                        <small className="text-muted">Code: {emp.code} | Dept: {emp.department}</small>
                      </div>
                      <span className="badge bg-secondary">{emp.designation}</span>
                    </button>
                  ))
                ) : (
                  <div className="dropdown-item text-center text-muted">
                    No employees found
                  </div>
                )}
              </div>
            )}
          </div>
          <small className="text-muted mt-2 d-block">Type employee name or code to search</small>
          
          {selectedEmployee && (
            <div className="alert alert-info mt-3 mb-0 py-2">
              <FaUserTie className="me-2" /> <strong>Selected Employee:</strong> {selectedEmployee.name} ({selectedEmployee.code}) - {selectedEmployee.designation}
            </div>
          )}
        </div>
      </div>

      {/* Disciplinary Form - Show only if employee selected */}
      {selectedEmployee && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-light">
            <h6 className="mb-0 fw-bold">
              {editingRecord ? '✏️ Edit Disciplinary Record' : '📝 New Disciplinary Record'}
            </h6>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Case Number */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Case Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${touched.caseNumber && errors.caseNumber ? 'is-invalid' : ''}`}
                    placeholder="e.g., DISC/2024/001"
                    value={formData.caseNumber}
                    onChange={(e) => handleChange('caseNumber', e.target.value)}
                    onBlur={() => handleBlur('caseNumber')}
                  />
                  {errors.caseNumber && <small className="text-danger">{errors.caseNumber}</small>}
                </div>

                {/* Incident Date */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">
                    Incident Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${touched.incidentDate && errors.incidentDate ? 'is-invalid' : ''}`}
                    value={formData.incidentDate}
                    onChange={(e) => handleChange('incidentDate', e.target.value)}
                    onBlur={() => handleBlur('incidentDate')}
                  />
                  {errors.incidentDate && <small className="text-danger">{errors.incidentDate}</small>}
                </div>

                {/* Action Type */}
               <div className="col-md-3">
  <label className="form-label fw-bold">
    Action Type <span className="text-danger">*</span>
  </label>
  <select
    className={`form-control ${touched.actionType && errors.actionType ? 'is-invalid' : ''}`}
    value={formData.actionType}
    onChange={(e) => handleChange('actionType', e.target.value)}
    onBlur={() => handleBlur('actionType')}
  >
    {actionTypes.map(type => (
      <option key={type.value} value={type.value}>{type.label}</option>
    ))}
  </select>
  {errors.actionType && <small className="text-danger">{errors.actionType}</small>}
</div>

                {/* Status */}
                <div className="col-md-3">
                  <label className="form-label fw-bold">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Investigation Officer */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Investigation Officer <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${touched.investigationOfficer && errors.investigationOfficer ? 'is-invalid' : ''}`}
                    value={formData.investigationOfficer}
                    onChange={(e) => handleChange('investigationOfficer', e.target.value)}
                    onBlur={() => handleBlur('investigationOfficer')}
                  >
                    <option value="">Select Investigation Officer</option>
                    {investigationOfficers.map(officer => (
                      <option key={officer.value} value={officer.value}>{officer.label}</option>
                    ))}
                  </select>
                  {errors.investigationOfficer && <small className="text-danger">{errors.investigationOfficer}</small>}
                </div>

                {/* Penalty */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Penalty <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${touched.penalty && errors.penalty ? 'is-invalid' : ''}`}
                    value={formData.penalty}
                    onChange={(e) => handleChange('penalty', e.target.value)}
                    onBlur={() => handleBlur('penalty')}
                  >
                    {penaltyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.penalty && <small className="text-danger">{errors.penalty}</small>}
                </div>

                {/* Resolution Date */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Resolution Date</label>
                  <input
                    type="date"
                    className={`form-control ${touched.resolutionDate && errors.resolutionDate ? 'is-invalid' : ''}`}
                    value={formData.resolutionDate}
                    min={formData.incidentDate || undefined}
                    onChange={(e) => handleChange('resolutionDate', e.target.value)}
                    onBlur={() => handleBlur('resolutionDate')}
                  />
                  {errors.resolutionDate && <small className="text-danger">{errors.resolutionDate}</small>}
                  <small className="text-muted">Date when the case was resolved</small>
                </div>

                {/* Remarks */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Remarks</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="Additional remarks or case summary..."
                    value={formData.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                  />
                </div>

                {/* Supporting Documents */}
                <div className="col-12">
                  <label className="form-label fw-bold">Supporting Documents</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="disciplinary-doc-upload"
                    />
                    <label htmlFor="disciplinary-doc-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload className="me-1" size={12} /> Choose File
                    </label>
                    {formData.supportingDocumentsName && (
                      <div className="mt-2 text-primary">
                        {formData.supportingDocumentsName.endsWith('.pdf') ? 
                          <FaFilePdf className="me-1" /> : <FaFileImage className="me-1" />}
                        {formData.supportingDocumentsName}
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
                  <FaSave className="me-1" size={12} /> {editingRecord ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disciplinary Records List Table */}
      {selectedEmployee && disciplinaries.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light">
            <h6 className="mb-0 fw-bold">📋 Disciplinary Records - {selectedEmployee.name}</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Case No.</th>
                    <th>Incident Date</th>
                    <th>Action Type</th>
                    <th>Investigation Officer</th>
                    <th>Penalty</th>
                    <th>Status</th>
                    <th>Resolution Date</th>
                    <th>Documents</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplinaries.map((record) => (
                    <tr key={record.id}>
                      <td><strong>{record.caseNumber}</strong></td>
                      <td>{formatDate(record.incidentDate)}</td>
                      <td>{record.actionType}</td>
                      <td>{record.investigationOfficer.split(' - ')[0]}</td>
                      <td>{record.penalty}</td>
                      <td>
                        <span className={`badge ${record.status === 'Open' || record.status === 'Under Investigation' ? 'bg-warning' : record.status === 'Resolved' ? 'bg-success' : 'bg-secondary'} bg-opacity-10 text-dark`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.resolutionDate ? formatDate(record.resolutionDate) : '—'}</td>
                      <td className="text-center">
                        {record.supportingDocumentsName ? (
                          <a 
                            href={record.supportingDocumentsData} 
                            download={record.supportingDocumentsName}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <FaFileAlt size={12} /> View
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-info me-1" onClick={() => handleView(record)} title="View">
                          <FaEye size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(record)} title="Edit">
                          <FaEdit size={12} />
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

    
      {/* View Record Modal */}
      {showViewModal && viewingRecord && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaGavel className="me-2" /> Disciplinary Case Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted small">Case Number</label>
                    <p className="fw-bold">{viewingRecord.caseNumber}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Employee</label>
                    <p className="fw-bold">{viewingRecord.employeeName}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Incident Date</label>
                    <p>{formatDate(viewingRecord.incidentDate)}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Action Type</label>
                    <p>{viewingRecord.actionType}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small">Status</label>
                    <p>{viewingRecord.status}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Investigation Officer</label>
                    <p>{viewingRecord.investigationOfficer}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small">Penalty</label>
                    <p>{viewingRecord.penalty}</p>
                  </div>
                  <div className="col-12">
                    <label className="text-muted small">Remarks</label>
                    <p>{viewingRecord.remarks || '—'}</p>
                  </div>
                  {viewingRecord.supportingDocumentsName && (
                    <div className="col-12">
                      <label className="text-muted small">Supporting Documents</label>
                      <div>
                        <a 
                          href={viewingRecord.supportingDocumentsData} 
                          download={viewingRecord.supportingDocumentsName}
                          className="btn btn-sm btn-outline-primary mt-1"
                        >
                          <FaDownload className="me-1" size={12} /> Download {viewingRecord.supportingDocumentsName}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplinaryRecords;
