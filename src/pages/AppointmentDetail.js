
import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaBuilding,FaCheckCircle,
  FaBriefcase, FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, 
  FaSearch, FaArrowLeft, FaArrowRight, FaEye, FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';

const AppointmentDetails = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [appointments, setAppointments] = useState(initialData?.appointments || [
    { id: 1, employeeId:1, appointmentOrderNo: 'APP/2024/001', appointmentDate: '2024-01-15', appointmentAuthority: 'Managing Director', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Software Engineer', initialDepartment: 'IT', initialBranch: 'Mumbai', joiningDate: '2024-01-15', probationPeriod: '6', confirmationDueDate: '2024-07-15', createdAt: '2024-01-15T10:30:00Z', appointmentOrderFileName: 'appointment_letter.pdf', appointmentOrderFileData: null },
    { id: 2, employeeId:2, appointmentOrderNo: 'APP/2024/002', appointmentDate: '2024-02-20', appointmentAuthority: 'CEO', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'HR Manager', initialDepartment: 'HR', initialBranch: 'Delhi', joiningDate: '2024-02-20', probationPeriod: '6', confirmationDueDate: '2024-08-20', createdAt: '2024-02-20T11:45:00Z', appointmentOrderFileName: 'offer_letter.pdf', appointmentOrderFileData: null },
    { id: 3, employeeId:3, appointmentOrderNo: 'APP/2024/003', appointmentDate: '2024-03-10', appointmentAuthority: 'HR Director', appointmentType: 'Contract', employmentType: 'Contractual', initialDesignation: 'Senior Developer', initialDepartment: 'IT', initialBranch: 'Bangalore', joiningDate: '2024-03-10', probationPeriod: '3', confirmationDueDate: '2024-06-10', createdAt: '2024-03-10T09:15:00Z' },
    { id: 4, employeeId:4, appointmentOrderNo: 'APP/2024/004', appointmentDate: '2024-04-05', appointmentAuthority: 'Managing Director', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Tech Lead', initialDepartment: 'IT', initialBranch: 'Mumbai', joiningDate: '2024-04-05', probationPeriod: '6', confirmationDueDate: '2024-10-05', createdAt: '2024-04-05T14:20:00Z' },
    { id: 5, employeeId:5, appointmentOrderNo: 'APP/2024/005', appointmentDate: '2024-05-12', appointmentAuthority: 'HR Director', appointmentType: 'Temporary', employmentType: 'Part-Time', initialDesignation: 'HR Executive', initialDepartment: 'HR', initialBranch: 'Delhi', joiningDate: '2024-05-12', probationPeriod: '3', confirmationDueDate: '2024-08-12', createdAt: '2024-05-12T10:00:00Z' },
    { id: 6, employeeId:6, appointmentOrderNo: 'APP/2024/006', appointmentDate: '2024-06-01', appointmentAuthority: 'CEO', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Sales Manager', initialDepartment: 'Sales', initialBranch: 'Bangalore', joiningDate: '2024-06-01', probationPeriod: '6', confirmationDueDate: '2024-12-01', createdAt: '2024-06-01T09:30:00Z' }
  ]);
  
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: "",
    newStatus: ""
  });
  const [showDocumentActions, setShowDocumentActions] = useState(false);
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

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

  const handleRowClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleViewDocument = (e, appointment) => {
    e.stopPropagation();
     setSelectedAppointment(appointment); 
    setShowDocumentActions(true);
    if (appointment.appointmentOrderFileData) {
      setDocumentPreview({
        data: appointment.appointmentOrderFileData,
        name: appointment.appointmentOrderFileName
      });
    } else {
      toast.info('No Document', 'No document has been uploaded for this appointment');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const search = searchTerm.toLowerCase();
    return apt.appointmentOrderNo.toLowerCase().includes(search) ||
           apt.initialDesignation.toLowerCase().includes(search) ||
           apt.initialDepartment.toLowerCase().includes(search) ||
           apt.initialBranch.toLowerCase().includes(search);
  });

  const totalItems = filteredAppointments.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, startIndex + rowsPerPage);

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

  useEffect(() => {
    setExistingOrderNos(appointments.map(apt => apt.appointmentOrderNo));
  }, [appointments]);

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
    
    if (formData.appointmentOrderNo && existingOrderNos.includes(formData.appointmentOrderNo) && 
        (!editingAppointment || editingAppointment.appointmentOrderNo !== formData.appointmentOrderNo)) {
      newErrors.appointmentOrderNo = 'Order Number already exists';
    }
    
    if (formData.joiningDate) {
      const joiningDate = new Date(formData.joiningDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (joiningDate > today) {
        newErrors.joiningDate = 'Joining Date cannot be future date';
      }
    }
    
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
  
  // Get employee data
  const empData = selectedEmployee || null;
  
  const appointmentData = {
    ...formData,
    employeeId: empData?.id || null,
    employeeName: empData?.name || null,
    employeeCode: empData?.code || null,  
    employeeDepartment: empData?.department || null, 
    employeeDesignation: empData?.designation || null, 
    id: editingAppointment ? editingAppointment.id : Date.now(),
    createdAt: editingAppointment ? editingAppointment.createdAt : new Date().toISOString()
  };
  
  if (editingAppointment) {
    const updated = appointments.map(apt =>
      apt.id === editingAppointment.id
        ? { ...appointmentData, id: apt.id, createdAt: apt.createdAt }
        : apt
    );
    setAppointments(updated);
    toast.success('Success', 'Appointment updated successfully');
    setEditingAppointment(null);
  } else {
    const newAppointment = {
      id: Date.now(),
      ...appointmentData,
      createdAt: new Date().toISOString()
    };
    setAppointments([newAppointment, ...appointments]);
    toast.success('Success', 'Appointment added successfully');
  }
  resetForm();
  setShowForm(false);
  setPage(0);
};

  const handleEdit = (appointment) => {
    if (appointment.status === 'Inactive') {
      return;
    }
    
    const emp = DUMMY_EMPLOYEES.find(e => e.id === appointment.employeeId);
    setSelectedEmployee(emp || null);  
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
    setEmployeeSearchTerm(emp?.name || '');
    setShowForm(true);
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
    setSelectedAppointment(null);
  };

  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({
      id,
      name,
      newStatus
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;

    const updatedAppointments = appointments.map((apt) =>
      apt.id === id
        ? {
            ...apt,
            status: newStatus
          }
        : apt
    );

    setAppointments(updatedAppointments);

    setShowStatusModal(false);

    toast.success(
      "Status Updated",
      `${statusAction.name} is now ${newStatus}`
    );
  };

   const handleGenerateLetter = (appointment) => {
    console.log('Generate clicked for:', appointment.appointmentOrderNo);
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Appointment Details</h1>
          <p className="cert-subtitle">Manage employee appointment information</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!showForm && !selectedAppointment && (
              <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                <FaPlus size={13} /> Add Appointment
              </button>
            )}
            
            {(showForm || selectedAppointment) && (
              <button 
                type="button" 
                className="cert-back-btn" 
                onClick={handleBackToList}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
              >
                <FaArrowLeft size={12} /> Back
              </button>
            )}
            
            {!showForm && !selectedAppointment && onCancel && (
              <button className="cert-cancel-btn" onClick={onCancel}>
                <FaTimes size={13} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Appointment Details</div>
              <div className="cert-form-grid-3col">
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label className="required">Employee Name</label>
                  <div className="position-relative" style={{ maxWidth: '500px' }}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type employee name to search..."
                        value={employeeSearchTerm}
                        onChange={(e) => {
                          setEmployeeSearchTerm(e.target.value);
                          setShowEmployeeDropdown(true);
                        }}
                        onFocus={() => {
                          if (employeeSearchTerm.length > 0) {
                            setShowEmployeeDropdown(true);
                          }
                        }}
                        style={{ fontSize: '14px', padding: '6px 12px' }}
                      />
                    </div>
                     
                    {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
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

                <div className="cert-field-compact">
                  <label>Employee Code</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.code || ''} readOnly placeholder="Auto-populated" />
                </div>

                <div className="cert-field-compact">
                  <label>Department</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.department || ''} readOnly placeholder="Auto-populated" />
                </div>
  <div className={`cert-field-compact ${touched.initialDepartment && errors.initialDepartment ? 'has-error' : ''}`}>
                  <label className="required">Initial Department</label>
                  <select value={formData.initialDepartment} onChange={(e) => handleChange('initialDepartment', e.target.value)}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                  <FieldError msg={errors.initialDepartment} />
                </div>
                <div className="cert-field-compact">
                  <label>Designation</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.designation || ''} readOnly placeholder="Auto-populated" />
                </div>
 <div className={`cert-field-compact ${touched.initialDesignation && errors.initialDesignation ? 'has-error' : ''}`}>
                  <label className="required">Initial Designation</label>
                  <select value={formData.initialDesignation} onChange={(e) => handleChange('initialDesignation', e.target.value)} onBlur={() => handleBlur('initialDesignation')}>
                    <option value="">Select Designation</option>
                    {designations.map(des => <option key={des.id} value={des.name}>{des.name}</option>)}
                  </select>
                  <FieldError msg={errors.initialDesignation} />
                </div>
                <div className={`cert-field-compact ${touched.appointmentOrderNo && errors.appointmentOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Appointment Order Number</label>
                  <input type="text" placeholder="e.g., ARI/APP/2024/001" value={formData.appointmentOrderNo} onChange={(e) => handleChange('appointmentOrderNo', e.target.value)} onBlur={() => handleBlur('appointmentOrderNo')} />
                  <FieldError msg={errors.appointmentOrderNo} />
                </div>
                
                <div className={`cert-field-compact ${touched.appointmentDate && errors.appointmentDate ? 'has-error' : ''}`}>
                  <label className="required">Appointment Date</label>
                  <input type="date" value={formData.appointmentDate} onChange={(e) => handleChange('appointmentDate', e.target.value)} onBlur={() => handleBlur('appointmentDate')} />
                  <FieldError msg={errors.appointmentDate} />
                </div>
                
                <div className={`cert-field-compact ${touched.appointmentAuthority && errors.appointmentAuthority ? 'has-error' : ''}`}>
                  <label className="required">Appointment Authority</label>
                  <select value={formData.appointmentAuthority} onChange={(e) => handleChange('appointmentAuthority', e.target.value)} onBlur={() => handleBlur('appointmentAuthority')}>
                    <option value="">Select Authority</option>
                    {appointmentAuthorities.map(auth => <option key={auth.value} value={auth.value}>{auth.label}</option>)}
                  </select>
                  <FieldError msg={errors.appointmentAuthority} />
                </div>
                
                <div className={`cert-field-compact ${touched.appointmentType && errors.appointmentType ? 'has-error' : ''}`}>
                  <label className="required">Appointment Type</label>
                  <select value={formData.appointmentType} onChange={(e) => handleChange('appointmentType', e.target.value)}>
                    {appointmentTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <FieldError msg={errors.appointmentType} />
                </div>
                
                <div className={`cert-field-compact ${touched.employmentType && errors.employmentType ? 'has-error' : ''}`}>
                  <label className="required">Employment Type</label>
                  <select value={formData.employmentType} onChange={(e) => handleChange('employmentType', e.target.value)}>
                    {employmentTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <FieldError msg={errors.employmentType} />
                </div>
                
              
                
                <div className={`cert-field-compact ${touched.initialBranch && errors.initialBranch ? 'has-error' : ''}`}>
                  <label className="required">Initial Branch</label>
                  <select value={formData.initialBranch} onChange={(e) => handleChange('initialBranch', e.target.value)}>
                    <option value="">Select Branch</option>
                    {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                  </select>
                  <FieldError msg={errors.initialBranch} />
                </div>
                
                <div className={`cert-field-compact ${touched.joiningDate && errors.joiningDate ? 'has-error' : ''}`}>
                  <label className="required">Joining Date</label>
                  <input type="date" value={formData.joiningDate} onChange={(e) => handleChange('joiningDate', e.target.value)} onBlur={() => handleBlur('joiningDate')} />
                  <FieldError msg={errors.joiningDate} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Probation Period (months)</label>
                  <input type="number" placeholder="e.g., 6" value={formData.probationPeriod} onChange={(e) => handleChange('probationPeriod', e.target.value)} />
                  <small>Auto-calculates confirmation due date</small>
                </div>
                
                <div className="cert-field-compact">
                  <label>Confirmation Due Date</label>
                  <input type="text" className="bg-light" value={formatDate(formData.confirmationDueDate)} readOnly />
                  <small>Auto-calculated</small>
                </div>
                
                {/* <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Appointment Order Upload</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="appointment-order-upload" />
                    <label htmlFor="appointment-order-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.appointmentOrderFileName && (
                      <div className="mt-2 text-primary">
                        {formData.appointmentOrderFileName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.appointmentOrderFileName}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
                  </div>
                </div> */}
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingAppointment ? 'Update Appointment' : 'Save Appointment'}
              </button>
            </div>
          </form>
        </div>
         ) : showDocumentActions && selectedAppointment ? (
                  <DocumentActions 
                    title="Appointment Letter"
                    documentName={selectedAppointment.appointmentOrderFileName}
                    documentData={selectedAppointment.appointmentOrderFileData}
                    onGenerate={() => handleGenerateLetter(selectedAppointment)}
                    onBack={handleBackToList}
                    generateLabel="Generate Letter"
                    themeColor="#9d174d"
                  />
      ) : selectedAppointment ? (
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {/* Top Banner */}
          <div style={{ 
            background: 'linear-gradient(135deg, #9d174d 0%, #be185d 100%)', 
            padding: '28px 32px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <FaFileAlt size={20} />
                  <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
                    {selectedAppointment.appointmentOrderNo}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', opacity: 0.9 }}>
                  <span><FaCalendarAlt style={{ marginRight: '6px' }} />{formatDate(selectedAppointment.createdAt)}</span>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '3px 12px', 
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>
                    {selectedAppointment.appointmentType}
                  </span>
                </div>
              </div>
              {/* <button 
                onClick={handleBackToList}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaArrowLeft size={12} /> Back
              </button> */}
            </div>
          </div>

          {/* Content Area */}
          <div style={{ padding: '32px' }}>
            {/* Employee Profile Card */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '20px 24px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9d174d, #be185d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '700'
                }}>
                  {DUMMY_EMPLOYEES.find(e => e.id === selectedAppointment.employeeId)?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 2px 0' }}>
                    {DUMMY_EMPLOYEES.find(e => e.id === selectedAppointment.employeeId)?.name || 'Unknown'}
                  </h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {DUMMY_EMPLOYEES.find(e => e.id === selectedAppointment.employeeId)?.code || ''} • {selectedAppointment.initialDesignation}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '16px',
              marginBottom: '28px'
            }}>
              <DetailCard 
                icon={<FaCalendarAlt size={16} style={{ color: '#9d174d' }} />}
                label="Appointment Date"
                value={formatDate(selectedAppointment.appointmentDate)}
                bg="#fdf2f8"
              />
              
              <DetailCard 
                icon={<FaCalendarAlt size={16} style={{ color: '#059669' }} />}
                label="Joining Date"
                value={formatDate(selectedAppointment.joiningDate)}
                bg="#ecfdf5"
              />
              
              <DetailCard 
                icon={<FaBuilding size={16} style={{ color: '#4f46e5' }} />}
                label="Appointment Authority"
                value={selectedAppointment.appointmentAuthority}
                bg="#eef2ff"
              />
              
              <DetailCard 
                icon={<FaBriefcase size={16} style={{ color: '#d97706' }} />}
                label="Appointment Type"
                value={selectedAppointment.appointmentType}
                bg="#fffbeb"
                badge
              />
              
              <DetailCard 
                icon={<FaBriefcase size={16} style={{ color: '#7c3aed' }} />}
                label="Employment Type"
                value={selectedAppointment.employmentType}
                bg="#faf5ff"
              />
              
              <DetailCard 
                icon={<FaBuilding size={16} style={{ color: '#0891b2' }} />}
                label="Department"
                value={selectedAppointment.initialDepartment}
                bg="#ecfeff"
              />
              
              <DetailCard 
                icon={<FaBuilding size={16} style={{ color: '#be123c' }} />}
                label="Branch"
                value={selectedAppointment.initialBranch}
                bg="#fff1f2"
              />
              
              <DetailCard 
                icon={<FaClock size={16} style={{ color: '#ea580c' }} />}
                label="Probation Period"
                value={`${selectedAppointment.probationPeriod} months`}
                bg="#fff7ed"
              />
              
              <DetailCard 
                icon={<FaCheckCircle size={16} style={{ color: selectedAppointment.confirmationDueDate && new Date(selectedAppointment.confirmationDueDate) > new Date() ? '#d97706' : '#059669' }} />}
                label="Confirmation Due Date"
                value={selectedAppointment.confirmationDueDate ? formatDate(selectedAppointment.confirmationDueDate) : '—'}
                bg={selectedAppointment.confirmationDueDate && new Date(selectedAppointment.confirmationDueDate) > new Date() ? '#fffbeb' : '#ecfdf5'}
                highlight
              />
            </div>

            {/* Document Section */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '20px 24px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf size={16} style={{ color: '#dc2626' }} /> Appointment Order Document
              </h4>
              {selectedAppointment.appointmentOrderFileName ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: '#fef2f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedAppointment.appointmentOrderFileName.endsWith('.pdf') ? (
                        <FaFilePdf size={20} style={{ color: '#dc2626' }} />
                      ) : (
                        <FaFileImage size={20} style={{ color: '#3b82f6' }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: '500', color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>
                        {selectedAppointment.appointmentOrderFileName}
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uploaded document</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleViewDocument(e, selectedAppointment)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '10px 20px',
                      background: '#9d174d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    <FaEye size={14} /> View Document
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <FaFileAlt size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: '500', margin: '0 0 4px 0', color: '#64748b' }}>No document uploaded</p>
                  <span style={{ fontSize: '13px' }}>No appointment order document has been uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by order number, designation, department or branch..."
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

          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>  
                    <th>Order No.</th>
                    <th>Appointment Date</th>
                    <th>Appointment Authority</th>
                    <th>Appointment Type</th>
                    <th>Employment Type</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th>Joining Date</th>
                    <th>Probation Period</th>
                    <th>Confirmation Due Date</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAppointments.length > 0 ? (
                    currentAppointments.map((apt,idx) => (
                      <tr 
                        key={apt.id} 
                        onClick={() => handleRowClick(apt)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>                        
<td>
  {DUMMY_EMPLOYEES.find(e => e.id === apt.employeeId)?.name || 
   apt.employeeName || 
   'Unknown'}
</td>                        </td>
                        <td><strong>{apt.appointmentOrderNo}</strong></td>
                        <td>{formatDate(apt.appointmentDate)}</td>
                        <td>{apt.appointmentAuthority}</td>
                        <td>
                          <span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                            {apt.appointmentType}
                          </span>
                        </td>
                        <td>{apt.employmentType}</td>
                        <td>{apt.initialDesignation}</td>
                        <td>{apt.initialDepartment}</td>
                        <td>{apt.initialBranch}</td>
                        <td>{formatDate(apt.joiningDate)}</td>
                        <td>{apt.probationPeriod} months</td>
                        <td>
                          {apt.confirmationDueDate && new Date(apt.confirmationDueDate) > new Date() ? (
                            <span className="cert-status-badge" style={{ background: '#fed7aa', color: '#9a3412' }}>
                              Due: {formatDate(apt.confirmationDueDate)}
                            </span>
                          ) : apt.confirmationDueDate ? (
                            <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                              Confirmed: {formatDate(apt.confirmationDueDate)}
                            </span>
                          ) : (
                            <span className="cert-status-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>Pending</span>
                          )}
                        </td>
                        <td>
                          <div
                            className="d-flex align-items-center gap-1"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusToggle(
                                apt.id,
                                DUMMY_EMPLOYEES.find(e => e.id === apt.employeeId)?.name || "",
                                apt.status || "Active"
                              );
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "16px",
                                borderRadius: "50px",
                                backgroundColor:
                                  (apt.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#d1d5db",
                                position: "relative",
                                transition: ".2s"
                              }}
                            >
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "50%",
                                  background: "#fff",
                                  position: "absolute",
                                  top: "2px",
                                  left:
                                    (apt.status || "Active") === "Active"
                                      ? "14px"
                                      : "2px",
                                  transition: ".2s"
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color:
                                  (apt.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#94a3b8"
                              }}
                            >
                              {apt.status || "Active"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(apt)} 
                              title={apt.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={apt.status === 'Inactive'}
                              style={{ 
                                opacity: apt.status === 'Inactive' ? 0.5 : 1,
                                cursor: apt.status === 'Inactive' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="15" className="text-center py-5">No appointments found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cert-table-footer">
              <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} employees
              </div>
              
              {totalPages > 0 && (
                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    className="cert-page-btn" 
                    disabled={page === 0} 
                    onClick={() => setPage(page - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots" style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button 
                        key={pg} 
                        className={`cert-page-num ${pg === page ? 'active' : ''}`} 
                        onClick={() => setPage(pg)}
                        style={{ 
                          padding: '6px 10px', 
                          border: '1px solid #e5e7eb', 
                          background: pg === page ? '#9d174d' : 'white', 
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontSize: '12px',
                          minWidth: '34px'
                        }}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button 
                    className="cert-page-btn" 
                    disabled={page + 1 >= totalPages} 
                    onClick={() => setPage(page + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {showStatusModal && (
        <div
          className="emp-modal-overlay"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="emp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="emp-modal-icon">
              {statusAction.newStatus === "Active" ? "✅" : "⛔"}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{" "}
              <strong>
                {statusAction.newStatus === "Active" ? "activate" : "deactivate"}
              </strong>{" "}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === "Inactive"
                ? "Inactive records cannot be edited until reactivated."
                : "This record will become active again."}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {documentPreview && (
        <div
          className="emp-modal-overlay"
          onClick={() => setDocumentPreview(null)}
          style={{ zIndex: 1050 }}
        >
          <div
            className="emp-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '900px', 
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                <FaFileAlt style={{ marginRight: '8px' }} />
                Document Preview
              </h3>
              <button 
                onClick={() => setDocumentPreview(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {documentPreview.data && documentPreview.name && documentPreview.name.endsWith('.pdf') ? (
                <div style={{ 
                  width: '100%', 
                  height: '70vh',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <iframe
                    src={documentPreview.data}
                    width="100%"
                    height="100%"
                    title="PDF Preview"
                    style={{ border: 'none' }}
                  />
                </div>
              ) : documentPreview.data ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={documentPreview.data} 
                    alt="Document Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '70vh',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} 
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p>No preview available</p>
                </div>
              )}
              
              <div style={{ 
                marginTop: '20px', 
                padding: '12px 16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: '#111827' }}>{documentPreview.name}</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                    Uploaded document
                  </p>
                </div>
                <a 
                  href={documentPreview.data} 
                  download={documentPreview.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#9d174d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  <FaFileAlt /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cert-table-row-hover:hover {
          background-color: #f9fafb;
          transition: background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
};

// Detail Card Component
const DetailCard = ({ icon, label, value, bg, badge, highlight }) => (
  <div style={{ 
    background: bg || '#f8fafc', 
    borderRadius: '10px', 
    padding: '16px 18px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      {icon}
      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
    {badge ? (
      <span style={{
        display: 'inline-block',
        background: highlight ? '#fef3c7' : '#e0e7ff',
        color: highlight ? '#92400e' : '#4f46e5',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        {value}
      </span>
    ) : (
      <p style={{ 
        fontSize: '15px', 
        fontWeight: '600', 
        color: highlight ? '#d97706' : '#1e293b', 
        margin: 0 
      }}>
        {value}
      </p>
    )}
  </div>
);

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default AppointmentDetails;