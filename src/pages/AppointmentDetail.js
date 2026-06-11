import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaBuilding, 
  FaBriefcase, FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AppointmentDetails = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [appointments, setAppointments] = useState(initialData?.appointments || []);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({
    appointmentOrderNo: '',
    appointmentDate: '',
    appointmentAuthority: '',
    appointmentType: 'Permanent',
    employmentType: 'Full-Time',
    initialDesignation: '',
    initialDepartment: '',
    initialBranch: '',
    joiningDate: '',
    probationPeriod: '6',
    confirmationDueDate: '',
    appointmentOrderFile: null,
    appointmentOrderFileData: null,
    appointmentOrderFileName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);

  // Dummy data for dropdowns
  const appointmentTypes = [
    { value: 'Permanent', label: 'Permanent' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Probation', label: 'Probation' },
    { value: 'Consultant', label: 'Consultant' }
  ];

  const employmentTypes = [
    { value: 'Full-Time', label: 'Full-Time' },
    { value: 'Part-Time', label: 'Part-Time' },
    { value: 'Contractual', label: 'Contractual' },
    { value: 'Intern', label: 'Intern' }
  ];

  const appointmentAuthorities = [
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'CEO', label: 'CEO' },
    { value: 'HR Director', label: 'HR Director' },
    { value: 'Board of Directors', label: 'Board of Directors' }
  ];

  const departments = [
    { id: 1, name: 'IT' },
    { id: 2, name: 'HR' },
    { id: 3, name: 'Finance' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'Marketing' }
  ];

  const branches = [
    { id: 1, name: 'Mumbai' },
    { id: 2, name: 'Delhi' },
    { id: 3, name: 'Bangalore' },
    { id: 4, name: 'Chennai' },
    { id: 5, name: 'Kolkata' }
  ];

  const designations = [
    { id: 1, name: 'Software Engineer' },
    { id: 2, name: 'Senior Software Engineer' },
    { id: 3, name: 'Tech Lead' },
    { id: 4, name: 'HR Executive' },
    { id: 5, name: 'HR Manager' }
  ];

  // Update existing order numbers
  useEffect(() => {
    setExistingOrderNos(appointments.map(apt => apt.appointmentOrderNo));
  }, [appointments]);

  // Calculate confirmation due date based on joining date and probation period
  useEffect(() => {
    if (formData.joiningDate && formData.probationPeriod) {
      const joiningDate = new Date(formData.joiningDate);
      const probationMonths = parseInt(formData.probationPeriod);
      if (!isNaN(probationMonths) && probationMonths > 0) {
        const dueDate = new Date(joiningDate);
        dueDate.setMonth(dueDate.getMonth() + probationMonths);
        setFormData(prev => ({
          ...prev,
          confirmationDueDate: dueDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.joiningDate, formData.probationPeriod]);

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
          appointmentOrderFile: file,
          appointmentOrderFileData: reader.result,
          appointmentOrderFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'appointmentOrderNo') {
      if (!value) error = 'Appointment Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingAppointment || editingAppointment.appointmentOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'appointmentDate' && !value) error = 'Appointment Date is required';
    else if (field === 'appointmentAuthority' && !value) error = 'Appointment Authority is required';
    else if (field === 'appointmentType' && !value) error = 'Appointment Type is required';
    else if (field === 'employmentType' && !value) error = 'Employment Type is required';
    else if (field === 'initialDesignation' && !value) error = 'Initial Designation is required';
    else if (field === 'initialDepartment' && !value) error = 'Initial Department is required';
    else if (field === 'initialBranch' && !value) error = 'Initial Branch is required';
    else if (field === 'joiningDate') {
      if (!value) error = 'Joining Date is required';
      else {
        const joiningDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (joiningDate > today) error = 'Joining Date cannot be future date';
      }
    }
    
    // Validate Appointment Date <= Joining Date
    if (field === 'appointmentDate' && formData.joiningDate) {
      const aptDate = new Date(field === 'appointmentDate' ? value : formData.appointmentDate);
      const joinDate = new Date(formData.joiningDate);
      if (aptDate > joinDate) {
        error = 'Appointment Date must be on or before Joining Date';
      }
    }
    if (field === 'joiningDate' && formData.appointmentDate) {
      const aptDate = new Date(formData.appointmentDate);
      const joinDate = new Date(value);
      if (aptDate > joinDate) {
        setErrors(prev => ({ ...prev, appointmentDate: 'Appointment Date must be on or before Joining Date' }));
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
    const fieldsToValidate = [
      'appointmentOrderNo', 'appointmentDate', 'appointmentAuthority',
      'appointmentType', 'employmentType', 'initialDesignation',
      'initialDepartment', 'initialBranch', 'joiningDate'
    ];
    
    const newErrors = {};
    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }
    
    // Check unique order number
    if (formData.appointmentOrderNo && existingOrderNos.includes(formData.appointmentOrderNo) && 
        (!editingAppointment || editingAppointment.appointmentOrderNo !== formData.appointmentOrderNo)) {
      newErrors.appointmentOrderNo = 'Order Number already exists';
    }
    
    // Check joining date not future
    if (formData.joiningDate) {
      const joiningDate = new Date(formData.joiningDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (joiningDate > today) {
        newErrors.joiningDate = 'Joining Date cannot be future date';
      }
    }
    
    // Check appointment date <= joining date
    if (formData.appointmentDate && formData.joiningDate) {
      const aptDate = new Date(formData.appointmentDate);
      const joinDate = new Date(formData.joiningDate);
      if (aptDate > joinDate) {
        newErrors.appointmentDate = 'Appointment Date must be on or before Joining Date';
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
    
    if (editingAppointment) {
      const updated = appointments.map(apt =>
        apt.id === editingAppointment.id
          ? { ...formData, id: apt.id }
          : apt
      );
      setAppointments(updated);
      toast.success('Success', 'Appointment updated successfully');
    } else {
      const newAppointment = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      setAppointments([newAppointment, ...appointments]);
      toast.success('Success', 'Appointment added successfully');
    }
    resetForm();
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      appointmentOrderNo: appointment.appointmentOrderNo,
      appointmentDate: appointment.appointmentDate,
      appointmentAuthority: appointment.appointmentAuthority,
      appointmentType: appointment.appointmentType,
      employmentType: appointment.employmentType,
      initialDesignation: appointment.initialDesignation,
      initialDepartment: appointment.initialDepartment,
      initialBranch: appointment.initialBranch,
      joiningDate: appointment.joiningDate,
      probationPeriod: appointment.probationPeriod || '6',
      confirmationDueDate: appointment.confirmationDueDate || '',
      appointmentOrderFile: null,
      appointmentOrderFileData: appointment.appointmentOrderFileData,
      appointmentOrderFileName: appointment.appointmentOrderFileName
    });
  };

  const handleDelete = (id) => {
    setAppointments(appointments.filter(apt => apt.id !== id));
    toast.success('Success', 'Appointment deleted successfully');
  };

  const resetForm = () => {
    setFormData({
      appointmentOrderNo: '',
      appointmentDate: '',
      appointmentAuthority: '',
      appointmentType: 'Permanent',
      employmentType: 'Full-Time',
      initialDesignation: '',
      initialDepartment: '',
      initialBranch: '',
      joiningDate: '',
      probationPeriod: '6',
      confirmationDueDate: '',
      appointmentOrderFile: null,
      appointmentOrderFileData: null,
      appointmentOrderFileName: null
    });
    setErrors({});
    setTouched({});
    setEditingAppointment(null);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaFileAlt className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Appointment Details</h5>
          <p className="text-muted mb-0 small">Manage employee appointment information</p>
        </div>
      </div>

      {/* Appointment Form - Direct show, no Add button */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold">
            {editingAppointment ? '✏️ Edit Appointment' : '📝 New Appointment'}
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Appointment Order Number */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Appointment Order Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${touched.appointmentOrderNo && errors.appointmentOrderNo ? 'is-invalid' : ''}`}
                  placeholder="e.g., ARI/APP/2024/001"
                  value={formData.appointmentOrderNo}
                  onChange={(e) => handleChange('appointmentOrderNo', e.target.value)}
                  onBlur={() => handleBlur('appointmentOrderNo')}
                />
                {errors.appointmentOrderNo && <small className="text-danger">{errors.appointmentOrderNo}</small>}
              </div>

              {/* Appointment Date */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Appointment Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${touched.appointmentDate && errors.appointmentDate ? 'is-invalid' : ''}`}
                  value={formData.appointmentDate}
                  onChange={(e) => handleChange('appointmentDate', e.target.value)}
                  onBlur={() => handleBlur('appointmentDate')}
                />
                {errors.appointmentDate && <small className="text-danger">{errors.appointmentDate}</small>}
              </div>

              {/* Appointment Authority */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Appointment Authority <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.appointmentAuthority && errors.appointmentAuthority ? 'is-invalid' : ''}`}
                  value={formData.appointmentAuthority}
                  onChange={(e) => handleChange('appointmentAuthority', e.target.value)}
                  onBlur={() => handleBlur('appointmentAuthority')}
                >
                  <option value="">Select Authority</option>
                  {appointmentAuthorities.map(auth => (
                    <option key={auth.value} value={auth.value}>{auth.label}</option>
                  ))}
                </select>
                {errors.appointmentAuthority && <small className="text-danger">{errors.appointmentAuthority}</small>}
              </div>

              {/* Appointment Type */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  Appointment Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.appointmentType && errors.appointmentType ? 'is-invalid' : ''}`}
                  value={formData.appointmentType}
                  onChange={(e) => handleChange('appointmentType', e.target.value)}
                >
                  {appointmentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Employment Type */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  Employment Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.employmentType && errors.employmentType ? 'is-invalid' : ''}`}
                  value={formData.employmentType}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                >
                  {employmentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Initial Designation */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  Initial Designation <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.initialDesignation && errors.initialDesignation ? 'is-invalid' : ''}`}
                  value={formData.initialDesignation}
                  onChange={(e) => handleChange('initialDesignation', e.target.value)}
                >
                  <option value="">Select Designation</option>
                  {designations.map(desig => (
                    <option key={desig.id} value={desig.name}>{desig.name}</option>
                  ))}
                </select>
                {errors.initialDesignation && <small className="text-danger">{errors.initialDesignation}</small>}
              </div>

              {/* Initial Department */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  Initial Department <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.initialDepartment && errors.initialDepartment ? 'is-invalid' : ''}`}
                  value={formData.initialDepartment}
                  onChange={(e) => handleChange('initialDepartment', e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Initial Branch */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  Initial Branch <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.initialBranch && errors.initialBranch ? 'is-invalid' : ''}`}
                  value={formData.initialBranch}
                  onChange={(e) => handleChange('initialBranch', e.target.value)}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>

              {/* Joining Date */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  Joining Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${touched.joiningDate && errors.joiningDate ? 'is-invalid' : ''}`}
                  value={formData.joiningDate}
                  onChange={(e) => handleChange('joiningDate', e.target.value)}
                  onBlur={() => handleBlur('joiningDate')}
                />
                {errors.joiningDate && <small className="text-danger">{errors.joiningDate}</small>}
              </div>

              {/* Probation Period */}
              <div className="col-md-3">
                <label className="form-label fw-bold">Probation Period (months)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g., 6"
                  value={formData.probationPeriod}
                  onChange={(e) => handleChange('probationPeriod', e.target.value)}
                />
                <small className="text-muted">Auto-calculates confirmation due date</small>
              </div>

              {/* Confirmation Due Date (Auto-calculated) */}
              <div className="col-md-3">
                <label className="form-label fw-bold">Confirmation Due Date</label>
                <input
                  type="text"
                  className="form-control bg-light"
                  value={formatDate(formData.confirmationDueDate)}
                  readOnly
                />
                <small className="text-muted">Auto-calculated based on joining date</small>
              </div>

              {/* Appointment Order Upload */}
              <div className="col-12">
                <label className="form-label fw-bold">Appointment Order Upload</label>
                <div className="border rounded p-3 text-center bg-light">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="appointment-order-upload"
                  />
                  <label htmlFor="appointment-order-upload" className="btn btn-outline-primary btn-sm">
                    <FaUpload className="me-1" size={12} /> Choose File
                  </label>
                  {formData.appointmentOrderFileName && (
                    <div className="mt-2 text-primary">
                      {formData.appointmentOrderFileName.endsWith('.pdf') ? 
                        <FaFilePdf className="me-1" /> : <FaFileImage className="me-1" />}
                      {formData.appointmentOrderFileName}
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
                <FaSave className="me-1" size={12} /> {editingAppointment ? 'Update Appointment' : 'Save Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Appointments List Table */}
      {appointments.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0 py-3">
            <h6 className="mb-0 fw-bold">📋 Appointment History</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order No.</th>
                    <th>Appointment Date</th>
                    <th>Joining Date</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td><strong>{apt.appointmentOrderNo}</strong></td>
                      <td>{formatDate(apt.appointmentDate)}</td>
                      <td>{formatDate(apt.joiningDate)}</td>
                      <td>{apt.initialDesignation}</td>
                      <td>{apt.initialDepartment}</td>
                      <td>{apt.initialBranch}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {apt.appointmentType}
                        </span>
                      </td>
                      <td>
                        {apt.confirmationDueDate && new Date(apt.confirmationDueDate) > new Date() ? (
                          <span className="badge bg-warning bg-opacity-10 text-warning">On Probation</span>
                        ) : apt.confirmationDueDate ? (
                          <span className="badge bg-success bg-opacity-10 text-success">Confirmed</span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary">Pending</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(apt)}>
                          <FaEdit size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(apt.id)}>
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

export default AppointmentDetails;