import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaChalkboardTeacher, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaUserTie, FaEye, FaDownload, FaClock, FaCertificate
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const TrainingHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [trainings, setTrainings] = useState(initialData?.trainings || []);
  const [editingTraining, setEditingTraining] = useState(null);
  const [formData, setFormData] = useState({
    trainingName: '',
    trainingProvider: '',
    startDate: '',
    endDate: '',
    certificationReceived: 'No',
    trainingHours: '',
    certificateFile: null,
    certificateFileData: null,
    certificateFileName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTraining, setViewingTraining] = useState(null);

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

  const certificationOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
    { value: 'Pending', label: 'Pending' }
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '—';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '1 day';
    return `${diffDays} days`;
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
          certificateFile: file,
          certificateFileData: reader.result,
          certificateFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'trainingName' && !value) error = 'Training Name is required';
    else if (field === 'trainingProvider' && !value) error = 'Training Provider is required';
    else if (field === 'startDate' && !value) error = 'Start Date is required';
    else if (field === 'endDate') {
      if (!value) error = 'End Date is required';
      else if (formData.startDate && new Date(value) < new Date(formData.startDate)) {
        error = 'End Date must be after Start Date';
      }
    }
    else if (field === 'trainingHours' && !value) error = 'Training Hours is required';
    else if (field === 'certificationReceived' && !value) error = 'Certification Received is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.trainingName) newErrors.trainingName = 'Training Name is required';
    if (!formData.trainingProvider) newErrors.trainingProvider = 'Training Provider is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    if (!formData.endDate) {
      newErrors.endDate = 'End Date is required';
    } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End Date must be after Start Date';
    }
    if (!formData.trainingHours) newErrors.trainingHours = 'Training Hours is required';
    if (!formData.certificationReceived) newErrors.certificationReceived = 'Certification Received is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }
    
    const trainingData = {
      ...formData,
      employeeId: selectedEmployee?.id || employeeId,
      employeeName: selectedEmployee?.name,
      duration: calculateDuration(formData.startDate, formData.endDate),
      createdAt: new Date().toISOString()
    };
    
    if (editingTraining) {
      const updated = trainings.map(t =>
        t.id === editingTraining.id ? { ...trainingData, id: t.id } : t
      );
      setTrainings(updated);
      toast.success('Success', 'Training updated successfully');
    } else {
      const newTraining = { id: Date.now(), ...trainingData };
      setTrainings([newTraining, ...trainings]);
      toast.success('Success', 'Training added successfully');
    }
    resetForm();
  };

  const handleEdit = (training) => {
    setEditingTraining(training);
    setSelectedEmployee({ id: training.employeeId, name: training.employeeName });
    setFormData({
      trainingName: training.trainingName,
      trainingProvider: training.trainingProvider,
      startDate: training.startDate,
      endDate: training.endDate,
      certificationReceived: training.certificationReceived,
      trainingHours: training.trainingHours,
      certificateFile: null,
      certificateFileData: training.certificateFileData,
      certificateFileName: training.certificateFileName
    });
  };

  const handleView = (training) => {
    setViewingTraining(training);
    setShowViewModal(true);
  };

  const handleDelete = (id) => {
    setTrainings(trainings.filter(t => t.id !== id));
    toast.success('Success', 'Training deleted successfully');
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const resetForm = () => {
    setFormData({
      trainingName: '',
      trainingProvider: '',
      startDate: '',
      endDate: '',
      certificationReceived: 'No',
      trainingHours: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null
    });
    setErrors({});
    setTouched({});
    setEditingTraining(null);
  };

  // Calculate stats
  const totalTrainings = trainings.length;
  const certifiedTrainings = trainings.filter(t => t.certificationReceived === 'Yes').length;
  const totalHours = trainings.reduce((sum, t) => sum + (parseInt(t.trainingHours) || 0), 0);

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaChalkboardTeacher className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Training History</h5>
          <p className="text-muted mb-0 small">Manage employee training records</p>
        </div>
      </div>

      {/* Stats */}
      {selectedEmployee && trainings.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card bg-primary bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-primary text-white p-3 rounded-circle">
                  <FaChalkboardTeacher size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{totalTrainings}</h4>
                  <small className="text-muted">Total Trainings</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="bg-success text-white p-3 rounded-circle">
                  <FaCertificate size={20} />
                </div>
                <div>
                  <h4 className="mb-0">{certifiedTrainings}</h4>
                  <small className="text-muted">Certified</small>
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
                  <h4 className="mb-0">{totalHours}</h4>
                  <small className="text-muted">Total Hours</small>
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
                      <small className="text-muted">{emp.code} | {emp.department}</small>
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
              <FaUserTie className="mr-2" /> Selected: {selectedEmployee.name} ({selectedEmployee.code})
            </div>
          )}
        </div>
      </div>
          
          

      {/* Form - 2 columns per row */}
      {selectedEmployee && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <h6 className="mb-0">{editingTraining ? 'Edit Training' : 'New Training'}</h6>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Training Name - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Training Name <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.trainingName ? 'is-invalid' : ''}`} 
                    placeholder="e.g., Advanced React Development"
                    value={formData.trainingName} 
                    onChange={(e) => handleChange('trainingName', e.target.value)} 
                    onBlur={() => handleBlur('trainingName')}
                  />
                  {errors.trainingName && <small className="text-danger">{errors.trainingName}</small>}
                </div>

                {/* Training Provider - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Training Provider <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.trainingProvider ? 'is-invalid' : ''}`} 
                    placeholder="e.g., Udemy, Coursera, Internal"
                    value={formData.trainingProvider} 
                    onChange={(e) => handleChange('trainingProvider', e.target.value)} 
                    onBlur={() => handleBlur('trainingProvider')}
                  />
                  {errors.trainingProvider && <small className="text-danger">{errors.trainingProvider}</small>}
                </div>

                {/* Start Date - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Start Date <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="date" 
                    className={`form-control ${errors.startDate ? 'is-invalid' : ''}`} 
                    value={formData.startDate} 
                    onChange={(e) => handleChange('startDate', e.target.value)} 
                    onBlur={() => handleBlur('startDate')}
                  />
                  {errors.startDate && <small className="text-danger">{errors.startDate}</small>}
                </div>

                {/* End Date - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    End Date <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="date" 
                    className={`form-control ${errors.endDate ? 'is-invalid' : ''}`} 
                    value={formData.endDate} 
                    min={formData.startDate}
                    onChange={(e) => handleChange('endDate', e.target.value)} 
                    onBlur={() => handleBlur('endDate')}
                  />
                  {errors.endDate && <small className="text-danger">{errors.endDate}</small>}
                </div>

                {/* Training Hours - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Training Hours <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="number" 
                    className={`form-control ${errors.trainingHours ? 'is-invalid' : ''}`} 
                    placeholder="e.g., 40"
                    value={formData.trainingHours} 
                    onChange={(e) => handleChange('trainingHours', e.target.value)} 
                    onBlur={() => handleBlur('trainingHours')}
                  />
                  {errors.trainingHours && <small className="text-danger">{errors.trainingHours}</small>}
                  <small className="text-muted">Total duration of training in hours</small>
                </div>

                {/* Certification Received - col 6 */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Certification Received <span className="text-danger">*</span>
                  </label>
                  <select 
                    className={`form-control ${errors.certificationReceived ? 'is-invalid' : ''}`} 
                    value={formData.certificationReceived} 
                    onChange={(e) => handleChange('certificationReceived', e.target.value)} 
                    onBlur={() => handleBlur('certificationReceived')}
                  >
                    {certificationOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.certificationReceived && <small className="text-danger">{errors.certificationReceived}</small>}
                </div>

                {/* Certificate Upload - col 12 */}
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Certificate Upload</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                      id="certificate-upload" 
                    />
                    <label htmlFor="certificate-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload className="mr-1" /> Choose File
                    </label>
                    {formData.certificateFileName && (
                      <div className="mt-2 text-primary">
                        {formData.certificateFileName.endsWith('.pdf') ? 
                          <FaFilePdf className="mr-1" /> : <FaFileImage className="mr-1" />}
                        {formData.certificateFileName}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Clear</button>
                <button type="submit" className="btn btn-primary"><FaSave className="mr-1" /> {editingTraining ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {selectedEmployee && trainings.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-header bg-light">
            <h6 className="mb-0">Training History - {selectedEmployee.name}</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead className="thead-light">
                <tr>
                  <th>Training Name</th>
                  <th>Provider</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Hours</th>
                  <th>Certification</th>
                  <th>Certificate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainings.map((training) => (
                  <tr key={training.id}>
                    <td><strong>{training.trainingName}</strong></td>
                    <td>{training.trainingProvider}</td>
                    <td>{formatDate(training.startDate)}</td>
                    <td>{formatDate(training.endDate)}</td>
                    <td>{training.duration}</td>
                    <td>{training.trainingHours} hrs</td>
                    <td className="text-center">
                      {training.certificationReceived === 'Yes' ? (
                        <span className="badge badge-success">Yes</span>
                      ) : training.certificationReceived === 'Pending' ? (
                        <span className="badge badge-warning">Pending</span>
                      ) : (
                        <span className="badge badge-secondary">No</span>
                      )}
                    </td>
                    <td className="text-center">
                      {training.certificateFileName ? (
                        <a href={training.certificateFileData} download={training.certificateFileName} className="btn btn-sm btn-outline-primary">
                          <FaFileAlt size={12} /> View
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-info mr-1" onClick={() => handleView(training)}><FaEye size={12} /></button>
                      <button className="btn btn-sm btn-outline-primary mr-1" onClick={() => handleEdit(training)}><FaEdit size={12} /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(training.id)}><FaTrash size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingTraining && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><FaChalkboardTeacher className="mr-2" /> Training Details</h5>
                <button type="button" className="close text-white" onClick={() => setShowViewModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p><strong>Training Name:</strong> {viewingTraining.trainingName}</p>
                <p><strong>Training Provider:</strong> {viewingTraining.trainingProvider}</p>
                <p><strong>Start Date:</strong> {formatDate(viewingTraining.startDate)}</p>
                <p><strong>End Date:</strong> {formatDate(viewingTraining.endDate)}</p>
                <p><strong>Duration:</strong> {viewingTraining.duration}</p>
                <p><strong>Training Hours:</strong> {viewingTraining.trainingHours} hrs</p>
                <p><strong>Certification Received:</strong> {viewingTraining.certificationReceived}</p>
                {viewingTraining.certificateFileName && (
                  <a href={viewingTraining.certificateFileData} download={viewingTraining.certificateFileName} className="btn btn-sm btn-primary mt-2">Download Certificate</a>
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

export default TrainingHistory;