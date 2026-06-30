
import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaBuilding,FaCheckCircle,
  FaBriefcase, FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaSearch, FaArrowLeft, FaArrowRight
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AppointmentDetails = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [appointments, setAppointments] = useState(initialData?.appointments || [
    { id: 1, employeeId:1, appointmentOrderNo: 'APP/2024/001', appointmentDate: '2024-01-15', appointmentAuthority: 'Managing Director', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Software Engineer', initialDepartment: 'IT', initialBranch: 'Mumbai', joiningDate: '2024-01-15', probationPeriod: '6', confirmationDueDate: '2024-07-15', createdAt: '2024-01-15T10:30:00Z' },
    { id: 2, employeeId:2, appointmentOrderNo: 'APP/2024/002', appointmentDate: '2024-02-20', appointmentAuthority: 'CEO', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'HR Manager', initialDepartment: 'HR', initialBranch: 'Delhi', joiningDate: '2024-02-20', probationPeriod: '6', confirmationDueDate: '2024-08-20', createdAt: '2024-02-20T11:45:00Z' },
    { id: 3, employeeId:3, appointmentOrderNo: 'APP/2024/003', appointmentDate: '2024-03-10', appointmentAuthority: 'HR Director', appointmentType: 'Contract', employmentType: 'Contractual', initialDesignation: 'Senior Developer', initialDepartment: 'IT', initialBranch: 'Bangalore', joiningDate: '2024-03-10', probationPeriod: '3', confirmationDueDate: '2024-06-10', createdAt: '2024-03-10T09:15:00Z' },
    { id: 4, employeeId:4, appointmentOrderNo: 'APP/2024/004', appointmentDate: '2024-04-05', appointmentAuthority: 'Managing Director', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Tech Lead', initialDepartment: 'IT', initialBranch: 'Mumbai', joiningDate: '2024-04-05', probationPeriod: '6', confirmationDueDate: '2024-10-05', createdAt: '2024-04-05T14:20:00Z' },
    { id: 5, employeeId:5, appointmentOrderNo: 'APP/2024/005', appointmentDate: '2024-05-12', appointmentAuthority: 'HR Director', appointmentType: 'Temporary', employmentType: 'Part-Time', initialDesignation: 'HR Executive', initialDepartment: 'HR', initialBranch: 'Delhi', joiningDate: '2024-05-12', probationPeriod: '3', confirmationDueDate: '2024-08-12', createdAt: '2024-05-12T10:00:00Z' },
    { id: 6, employeeId:6, appointmentOrderNo: 'APP/2024/006', appointmentDate: '2024-06-01', appointmentAuthority: 'CEO', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Sales Manager', initialDepartment: 'Sales', initialBranch: 'Bangalore', joiningDate: '2024-06-01', probationPeriod: '6', confirmationDueDate: '2024-12-01', createdAt: '2024-06-01T09:30:00Z' }
  ]);
  
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  // Employee Search State
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

  // Filter appointments by search
  const filteredAppointments = appointments.filter(apt => {
    const search = searchTerm.toLowerCase();
    return apt.appointmentOrderNo.toLowerCase().includes(search) ||
           apt.initialDesignation.toLowerCase().includes(search) ||
           apt.initialDepartment.toLowerCase().includes(search) ||
           apt.initialBranch.toLowerCase().includes(search);
  });

  // Pagination
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

  // Update existing order numbers
  useEffect(() => {
    setExistingOrderNos(appointments.map(apt => apt.appointmentOrderNo));
  }, [appointments]);

  // Calculate confirmation due date
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
     const appointmentData = {
    ...formData,
    employeeId: selectedEmployee?.id || null,  
    id: editingAppointment ? editingAppointment.id : Date.now(),
    createdAt: editingAppointment ? editingAppointment.createdAt : new Date().toISOString()
  };
    if (editingAppointment) {
      const updated = appointments.map(apt =>
        apt.id === editingAppointment.id
          ? { ...formData, id: apt.id, createdAt: apt.createdAt }
          : apt
      );
      setAppointments(updated);
      toast.success('Success', 'Appointment updated successfully');
      setEditingAppointment(null);
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
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (appointment) => {
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
          <h1 className="cert-title">Appointment Details</h1>
          <p className="cert-subtitle">Manage employee appointment information</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Only show Add Appointment button when form is hidden */}
         <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  {/* Show Add Appointment button only when form is hidden */}
  {!showForm && (
    <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
      <FaPlus size={13} /> Add Appointment
    </button>
  )}
  
  {/* Show Back button only when form is visible */}
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
  
  {/* Show Cancel button only when form is hidden */}
  {!showForm && onCancel && (
    <button className="cert-cancel-btn" onClick={onCancel}>
      <FaTimes size={13} /> Cancel
    </button>
  )}
</div>
        </div>
      </div>

      {showForm ? (
        // Form View with Back Button
        <div className="cert-form-wrap">
          {/* Back Button at the top of the form */}
         

          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Appointment Details</div>
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
                
                <div className={`cert-field-compact ${touched.initialDesignation && errors.initialDesignation ? 'has-error' : ''}`}>
                  <label className="required">Initial Designation</label>
                  <select value={formData.initialDesignation} onChange={(e) => handleChange('initialDesignation', e.target.value)} onBlur={() => handleBlur('initialDesignation')}>
                    <option value="">Select Designation</option>
                    {designations.map(des => <option key={des.id} value={des.name}>{des.name}</option>)}
                  </select>
                  <FieldError msg={errors.initialDesignation} />
                </div>
                
                <div className={`cert-field-compact ${touched.initialDepartment && errors.initialDepartment ? 'has-error' : ''}`}>
                  <label className="required">Initial Department</label>
                  <select value={formData.initialDepartment} onChange={(e) => handleChange('initialDepartment', e.target.value)}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                  <FieldError msg={errors.initialDepartment} />
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
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
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
                </div>
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
      ) : (
        <>
          {/* Search Bar */}
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

        
         {/* Appointments Table */}
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
          <th>Document</th>
          <th style={{ width: 100 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentAppointments.length > 0 ? (
          currentAppointments.map((apt,idx) => (
            <tr key={apt.id}>
             <td className="text-center">{startIndex + idx + 1}</td>

              <td>                        

    {DUMMY_EMPLOYEES.find(e => e.id === apt.employeeId)?.name || 'Unknown'}
</td>
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
              <td className="text-center">
                {apt.appointmentOrderFileName ? (
                  <a href={apt.appointmentOrderFileData} download={apt.appointmentOrderFileName} className="btn btn-sm btn-outline-primary">
                    <FaFileAlt size={12} /> View
                  </a>
                ) : <span className="text-muted">—</span>}
              </td>
              <td>
                <div className="cert-actions">
                  <button className="cert-act cert-act--edit" onClick={() => handleEdit(apt)} title="Edit">
                    <FaEdit size={12} />
                  </button>
                  <button className="cert-act cert-act--del" onClick={() => handleDelete(apt.id)} title="Delete">
                    <FaTrash size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="13" className="text-center py-5">No appointments found</td>
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

export default AppointmentDetails;