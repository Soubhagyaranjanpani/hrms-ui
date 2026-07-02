
import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, 
  FaBook, FaEye, FaDownload, FaPrint, FaTimes,
  FaCheckCircle, FaClock, FaUserCheck, FaFileAlt, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher,
  FaPlus, FaSave, FaEdit, FaTrash, FaArrowLeft, FaCode
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const EmployeeSkillMaster = ({ user, onCancel }) => {
 const [employees, setEmployees] = useState([
  { id: 1, name: 'John Doe', department: 'IT', designation: 'Software Engineer', status: 'Active', joiningDate: '2020-01-15', retirementDate: null, skills: ['React.js', 'Node.js', 'JavaScript'] },
  { id: 2, name: 'Jane Smith', department: 'HR', designation: 'HR Manager', status: 'Active', joiningDate: '2019-06-10', retirementDate: null, skills: ['HR Management', 'Payroll Processing', 'Recruitment'] },
  { id: 3, name: 'Mike Johnson', department: 'IT', designation: 'Senior Developer', status: 'Active', joiningDate: '2021-03-20', retirementDate: null, skills: ['Python', 'AWS', 'Docker'] },
  { id: 4, name: 'Sarah Williams', department: 'Sales', designation: 'Sales Manager', status: 'Active ', joiningDate: '2010-08-01', retirementDate: '2024-03-31', skills: ['Salesforce', 'CRM'] },
  { id: 5, name: 'David Brown', department: 'Finance', designation: 'Accountant', status: 'Active', joiningDate: '2022-01-10', retirementDate: null, skills: ['Financial Accounting', 'Tally', 'Excel'] },
  { id: 6, name: 'Emily Wilson', department: 'Marketing', designation: 'Marketing Manager', status: 'Active', joiningDate: '2018-09-15', retirementDate: null, skills: ['Digital Marketing', 'SEO', 'Google Analytics'] },
  { id: 7, name: 'Robert Taylor', department: 'Operations', designation: 'Operations Manager', status: 'Active', joiningDate: '2017-03-10', retirementDate: null, skills: ['Operations Management', 'Supply Chain'] },
  { id: 8, name: 'Lisa Anderson', department: 'IT', designation: 'Product Manager', status: 'Active', joiningDate: '2019-11-20', retirementDate: null, skills: ['Product Management', 'Agile', 'JIRA'] }
]);
const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
const [selectedEmployee, setSelectedEmployee] = useState(null);
const [skillSearchTerm, setSkillSearchTerm] = useState('');
const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState(employees);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    designation: '',
    status: 'Active',
    joiningDate: '',
    retirementDate: '',
    skills: []
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
const [statusAction, setStatusAction] = useState({ id: null, name: '', newStatus: '' });
 const [viewEmployee, setViewEmployee] = useState(null);
const [showViewModal, setShowViewModal] = useState(false);

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

const AVAILABLE_SKILLS = [
  'React.js', 'Node.js', 'MongoDB', 'JavaScript', 'TypeScript', 'Python',
  'AWS', 'Docker', 'Kubernetes', 'HR Management', 'Payroll Processing',
  'Recruitment', 'Financial Accounting', 'Tally', 'Excel',
  'Digital Marketing', 'SEO', 'Google Analytics', 'Operations Management',
  'Supply Chain', 'Product Management', 'Agile', 'JIRA', 'Salesforce',
  'CRM', 'HTML', 'CSS', 'Java', 'C#', 'PHP', 'Laravel', 'Vue.js',
  'Angular', 'SQL', 'PostgreSQL', 'Git', 'CI/CD', 'Jenkins'
];

const filteredSkillList = AVAILABLE_SKILLS.filter(skill =>
  skill.toLowerCase().includes(skillSearchTerm.toLowerCase())
);
  // Employee Skills Data
  const EMPLOYEE_SKILLS = {
    1: [
      { skill: 'React.js', proficiency: 'Expert', yearsOfExperience: 4, lastUsed: '2024-01-15', certified: true },
      { skill: 'Node.js', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-10', certified: true },
      { skill: 'MongoDB', proficiency: 'Intermediate', yearsOfExperience: 2, lastUsed: '2023-12-20', certified: false },
      { skill: 'JavaScript', proficiency: 'Expert', yearsOfExperience: 5, lastUsed: '2024-01-15', certified: true }
    ],
    2: [
      { skill: 'HR Management', proficiency: 'Expert', yearsOfExperience: 7, lastUsed: '2024-01-10', certified: true },
      { skill: 'Payroll Processing', proficiency: 'Advanced', yearsOfExperience: 5, lastUsed: '2024-01-05', certified: true },
      { skill: 'Recruitment', proficiency: 'Expert', yearsOfExperience: 6, lastUsed: '2024-01-12', certified: true }
    ],
    3: [
      { skill: 'Python', proficiency: 'Expert', yearsOfExperience: 5, lastUsed: '2024-01-15', certified: true },
      { skill: 'AWS', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-10', certified: true },
      { skill: 'Docker', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-08', certified: false },
      { skill: 'Kubernetes', proficiency: 'Intermediate', yearsOfExperience: 2, lastUsed: '2023-12-15', certified: false }
    ],
    4: [
      { skill: 'Salesforce', proficiency: 'Expert', yearsOfExperience: 8, lastUsed: '2024-01-14', certified: true },
      { skill: 'CRM', proficiency: 'Advanced', yearsOfExperience: 6, lastUsed: '2024-01-10', certified: true }
    ],
    5: [
      { skill: 'Financial Accounting', proficiency: 'Expert', yearsOfExperience: 6, lastUsed: '2024-01-15', certified: true },
      { skill: 'Tally', proficiency: 'Advanced', yearsOfExperience: 4, lastUsed: '2024-01-12', certified: true },
      { skill: 'Excel', proficiency: 'Expert', yearsOfExperience: 7, lastUsed: '2024-01-15', certified: true }
    ],
    6: [
      { skill: 'Digital Marketing', proficiency: 'Expert', yearsOfExperience: 5, lastUsed: '2024-01-15', certified: true },
      { skill: 'SEO', proficiency: 'Advanced', yearsOfExperience: 4, lastUsed: '2024-01-10', certified: true },
      { skill: 'Google Analytics', proficiency: 'Advanced', yearsOfExperience: 3, lastUsed: '2024-01-08', certified: true }
    ],
    7: [
      { skill: 'Operations Management', proficiency: 'Expert', yearsOfExperience: 8, lastUsed: '2024-01-15', certified: true },
      { skill: 'Supply Chain', proficiency: 'Advanced', yearsOfExperience: 5, lastUsed: '2024-01-10', certified: false }
    ],
    8: [
      { skill: 'Product Management', proficiency: 'Expert', yearsOfExperience: 6, lastUsed: '2024-01-15', certified: true },
      { skill: 'Agile', proficiency: 'Expert', yearsOfExperience: 5, lastUsed: '2024-01-12', certified: true },
      { skill: 'JIRA', proficiency: 'Advanced', yearsOfExperience: 4, lastUsed: '2024-01-10', certified: false }
    ]
  };

  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations'];
  const designations = ['Software Engineer', 'Senior Developer', 'Tech Lead', 'HR Manager', 'Sales Manager', 'Accountant', 'Marketing Manager', 'Operations Manager', 'Product Manager'];

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = employees.filter(emp => 
      emp.name.toLowerCase().includes(search) ||
      emp.department.toLowerCase().includes(search) ||
      emp.designation.toLowerCase().includes(search)
    );
    setFilteredEmployees(filtered);
    setPage(0);
  }, [searchTerm, employees]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest('.skill-dropdown-container')) {
      setShowSkillDropdown(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  // Pagination
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

  const employeeSearchResults = DUMMY_EMPLOYEES.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

 const handleEmployeeSelect = (employee) => {
  setSelectedEmployee(employee);
  const existingEmployee = employees.find(e => e.id === employee.id);
  const existingSkills = existingEmployee?.skills || [];
  
  setFormData(prev => ({
    ...prev,
    name: employee.name,
    department: employee.department,
    designation: employee.designation,
    skills: existingSkills 
  }));
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

  

 const handleEdit = (employee) => {
  if (employee.status === 'Inactive') {
    toast.warning('Cannot Edit', 'This employee is inactive and cannot be edited');
    return;
  }
  
  const emp = DUMMY_EMPLOYEES.find(e => e.id === employee.id);
  setSelectedEmployee(emp || null);
  setEditingEmployee(employee);
  setFormData({
    name: employee.name,
    department: employee.department,
    designation: employee.designation,
    status: employee.status,
    joiningDate: employee.joiningDate,
    retirementDate: employee.retirementDate || '',
    skills: employee.skills || [] 
  });
  setEmployeeSearchTerm(emp?.name || '');
  setShowForm(true);
};

  // Status Toggle
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
  
  const updatedEmployees = employees.map(emp => {
    if (emp.id === id) {
      return { ...emp, status: newStatus };
    }
    return emp;
  });
  setEmployees(updatedEmployees);
  
  if (filteredEmployees.length > 0) {
    setFilteredEmployees(filteredEmployees.map(emp => {
      if (emp.id === id) {
        return { ...emp, status: newStatus };
      }
      return emp;
    }));
  }
  
  setShowStatusModal(false);
  toast.success('Status Updated', `Employee ${statusAction.name} is now ${newStatus}`);
};

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'name' && !value) error = 'Employee Name is required';
    else if (field === 'department' && !value) error = 'Department is required';
    else if (field === 'designation' && !value) error = 'Designation is required';
    else if (field === 'joiningDate' && !value) error = 'Joining Date is required';
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Employee Name is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
  e.preventDefault();
  if (!validateForm()) {
    toast.warning('Validation Error', 'Please fill all required fields');
    return;
  }
  
  const employeeData = {
    id: editingEmployee ? editingEmployee.id : Date.now(),
    name: formData.name,
    department: formData.department,
    designation: formData.designation,
    status: formData.status,
    joiningDate: formData.joiningDate,
    retirementDate: formData.retirementDate || null,
    skills: formData.skills || [] 
  };

  if (editingEmployee) {
    setEmployees(employees.map(emp => emp.id === editingEmployee.id ? employeeData : emp));
    toast.success('Success', 'Employee updated successfully');
    setEditingEmployee(null);
  } else {
    setEmployees([employeeData, ...employees]);
    toast.success('Success', 'Employee added successfully');
  }
  resetForm();
  setShowForm(false);
  setPage(0);
};

 const resetForm = () => {
  setFormData({
    name: '',
    department: '',
    designation: '',
    status: 'Active',
    joiningDate: '',
    retirementDate: '',
    skills: [] 
  });
  setErrors({});
  setTouched({});
  setEditingEmployee(null);
  setEmployeeSearchTerm('');
  setSelectedEmployee(null);
  setSkillSearchTerm(''); 
  setShowSkillDropdown(false); 
};

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

 
  const getProficiencyBadge = (proficiency) => {
    const styles = {
      Beginner: { bg: '#fef3c7', color: '#92400e' },
      Intermediate: { bg: '#cffafe', color: '#0e7490' },
      Advanced: { bg: '#ede9fe', color: '#6d28d9' },
      Expert: { bg: '#d1fae5', color: '#065f46' }
    };
    const style = styles[proficiency] || styles.Intermediate;
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 8px' }}>{proficiency}</span>;
  };

  // View Employee Details
const handleView = (employee) => {
  setViewEmployee(employee);
  setShowViewModal(true);
};

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Employee Skill Master</h1>
          <p className="cert-subtitle">Manage employee skills and competencies</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Employee
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
            <button className="cert-cancel-btn" onClick={handleCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="cert-form-wrap mb-4">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Employee Details</div>
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
                
                <div className="cert-field-compact">
                  <label>Designation</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.designation || ''} readOnly placeholder="Auto-populated" />
                </div>
                
                <div className={`cert-field-compact ${touched.joiningDate && errors.joiningDate ? 'has-error' : ''}`}>
                  <label className="required">Joining Date</label>
                  <input type="date" value={formData.joiningDate} onChange={(e) => handleChange('joiningDate', e.target.value)} onBlur={() => handleBlur('joiningDate')} />
                  <FieldError msg={errors.joiningDate} />
                </div>
     {/* Skills */}
<div
  className="cert-field-compact"
>
  <label className="required">Skills</label>

  <input
    type="text"
    className="form-control"
    placeholder="Search skill..."
    value={skillSearchTerm}
    onChange={(e) => {
      setSkillSearchTerm(e.target.value);
      setShowSkillDropdown(true);
    }}
    onFocus={() => setShowSkillDropdown(true)}
  />

  {showSkillDropdown && skillSearchTerm && (
    <div
      className="card position-absolute w-100 shadow mt-1"
      style={{
        zIndex: 999,
        maxHeight: 180,
        overflowY: "auto"
      }}
    >
      {AVAILABLE_SKILLS.filter(
        skill =>
          skill.toLowerCase().includes(skillSearchTerm.toLowerCase()) &&
          !formData.skills.includes(skill)
      ).map(skill => (
        <div
          key={skill}
          className="px-3 py-2"
          style={{ cursor: "pointer" }}
          onMouseDown={(e) => {
  e.preventDefault();

  setFormData(prev => ({
    ...prev,
    skills: [...(prev.skills || []), skill]
  }));

  setSkillSearchTerm("");
  setShowSkillDropdown(false);
}}
          onMouseEnter={e =>
            (e.currentTarget.style.background = "#f3f4f6")
          }
          onMouseLeave={e =>
            (e.currentTarget.style.background = "#fff")
          }
        >
          {skill}
        </div>
      ))}
    </div>
  )}

  {/* Selected Skills */}

  <div className="d-flex flex-wrap gap-2 mt-2">
    {formData.skills.map(skill => (
      <span
        key={skill}
        className="badge bg-primary d-flex align-items-center"
        style={{
          padding: "8px 12px",
          fontSize: "13px"
        }}
      >
        {skill}

        <FaTimes
          style={{
            cursor: "pointer",
            marginLeft: 8
          }}
          onClick={() =>
            setFormData(prev => ({
              ...prev,
              skills: prev.skills.filter(s => s !== skill)
            }))
          }
        />
      </span>
    ))}
  </div>
</div>
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingEmployee ? 'Update Employee' : 'Save Employee'}
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
                placeholder="Search by Name, Department or Designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="cert-search-clear" onClick={() => setSearchTerm('')}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Employees Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Designation</th>           
                    <th>Joining Date</th>
                    <th>Skills</th>
                     <th>Status</th>
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map((emp, idx) => {
const skills = emp.skills || [];                      return (
                        <tr key={emp.id}>
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td className="fw-bold">{emp.name}</td>
                          <td>{emp.department}</td>
                          <td>{emp.designation}</td>
                          <td>{formatDate(emp.joiningDate)}</td>
                          <td>
                            <span className="badge" style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px' }}>
                              {skills.length} Skills
                            </span>
                          </td>
                          <td>
  <div 
    className="d-flex align-items-center gap-1" 
    style={{ cursor: 'pointer' }}
    onClick={() => handleStatusToggle(emp.id, emp.name, emp.status)}
  >
    <div style={{
      width: '28px',
      height: '16px',
      borderRadius: '50px',
      backgroundColor: emp.status === 'Active' ? '#9d174d' : '#d1d5db',
      position: 'relative',
      transition: '0.2s',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
      flexShrink: 0
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: 'white',
        position: 'absolute',
        top: '2px',
        left: emp.status === 'Active' ? '14px' : '2px',
        transition: '0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }} />
    </div>
    <span style={{
      fontSize: '11px',
      fontWeight: '500',
      color: emp.status === 'Active' ? '#9d174d' : '#94a3b8',
      minWidth: '40px'
    }}>
      {emp.status}
    </span>
  </div>
</td>
                         <td className="text-center">
  <div className="cert-actions">
    <button 
      className="cert-act cert-act--view" 
      onClick={() => handleView(emp)} 
      title="View Details"
    >
      <FaEye size={12} />
    </button>
    <button 
      className="cert-act cert-act--edit" 
      onClick={() => handleEdit(emp)} 
      title={emp.status === 'Inactive' ? 'Cannot edit inactive employee' : 'Edit'}
      disabled={emp.status === 'Inactive'}
      style={{ 
        opacity: emp.status === 'Inactive' ? 0.5 : 1,
        cursor: emp.status === 'Inactive' ? 'not-allowed' : 'pointer'
      }}
    >
      <FaEdit size={12} />
    </button>
  </div>
</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5">No employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
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

      {/* Skills Details Modal */}
      {showDetails && selectedRecord && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaCode className="me-2" /> Skills Details - {selectedRecord.name}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetails(false)}></button>
              </div>
              <div className="modal-body">
                {/* Basic Info */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <FaUserTie size={24} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedRecord.name}</h6>
                      <small className="text-muted">Employee</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <FaBuilding size={24} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedRecord.department}</h6>
                      <small className="text-muted">Department</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <FaBriefcase size={24} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedRecord.designation}</h6>
                      <small className="text-muted">Designation</small>
                    </div>
                  </div>
                </div>

                {/* Skills Table */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Skills & Competencies</h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-bordered mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Skill</th>
                          <th>Proficiency</th>
                          <th>Years of Experience</th>
                          <th>Last Used</th>
                          <th className="text-center">Certified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.skills && selectedRecord.skills.length > 0 ? (
                          selectedRecord.skills.map((skill, idx) => (
                            <tr key={idx}>
                              <td><strong>{skill.skill}</strong></td>
                              <td>{getProficiencyBadge(skill.proficiency)}</td>
                              <td>{skill.yearsOfExperience} years</td>
                              <td>{formatDate(skill.lastUsed)}</td>
                              <td className="text-center">
                                {skill.certified ? (
                                  <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                                    <FaCheckCircle className="me-1" size={10} /> Certified
                                  </span>
                                ) : (
                                  <span className="badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                                    Not Certified
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-3 text-muted">
                              No skills added for this employee
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetails(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showStatusModal && (
  <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
    <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
      <div className="emp-modal-icon">{statusAction.newStatus === "Active" ? "✅" : "⛔"}</div>
      <h3 className="emp-modal-title">Confirm Status Change</h3>
      <p className="emp-modal-body">
        Are you sure you want to <strong>{statusAction.newStatus === "Active" ? "activate" : "deactivate"}</strong>{" "}
        <strong>{statusAction.name}</strong>?
      </p>
      <p className="emp-modal-warn">
        {statusAction.newStatus === "Inactive"
          ? "Inactive employees cannot be edited until reactivated."
          : "Active employees will be available for selection and editing."}
      </p>
      <div className="emp-modal-actions">
        <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
        <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
      </div>
    </div>
  </div>
  
)}
{/* View Employee Details Modal */}
{showViewModal && viewEmployee && (
  <div className="modal show d-block" style={{ 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    zIndex: 1050
  }}>
    <div className="modal-dialog modal-dialog-centered modal-md">
      <div className="modal-content" style={{
        borderRadius: '8px',
        border: 'none',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}>
        {/* Header - Colorful */}
        <div className="modal-header" style={{
          background: 'linear-gradient(135deg, #9d174d, #7c1340)',
          borderBottom: 'none',
          padding: '14px 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FaUserTie size={14} />
            </div>
            <div>
              <h6 className="modal-title" style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'white' }}>
                Employee Profile
              </h6>
              <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>View complete employee details</small>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => setShowViewModal(false)}
            style={{ fontSize: '10px' }}
          ></button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px', background: '#f9fafb' }}>
          {/* Employee Card */}
          <div style={{
            background: 'white',
            borderRadius: '6px',
            padding: '14px 16px',
            border: '1px solid #e5e7eb',
            marginBottom: '12px'
          }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #9d174d, #7c1340)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                flexShrink: 0
              }}>
                {viewEmployee.name?.charAt(0) || 'E'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h6 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                    {viewEmployee.name}
                  </h6>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '500',
                    padding: '1px 10px',
                    borderRadius: '12px',
                    background: viewEmployee.status === 'Active' ? '#d1fae5' : '#fee2e2',
                    color: viewEmployee.status === 'Active' ? '#065f46' : '#991b1b'
                  }}>
                    {viewEmployee.status === 'Active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  <span><span style={{ fontWeight: '500', color: '#374151' }}>Department:</span> {viewEmployee.department}</span>
                  <span><span style={{ fontWeight: '500', color: '#374151' }}>Designation:</span> {viewEmployee.designation}</span>
                  <span><span style={{ fontWeight: '500', color: '#374151' }}>Joining:</span> {formatDate(viewEmployee.joiningDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid - Colorful Cards */}
          <div className="row g-2 mb-3">
            <div className="col-4">
              <div style={{
                background: 'white',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
                borderTop: '3px solid #4f46e5'
              }}>
                <div style={{ fontSize: '16px' }}>🏢</div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#1f2937', marginTop: '2px' }}>{viewEmployee.department}</div>
              </div>
            </div>
            <div className="col-4">
              <div style={{
                background: 'white',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
                borderTop: '3px solid #7c3aed'
              }}>
                <div style={{ fontSize: '16px' }}>💼</div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Designation</div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#1f2937', marginTop: '2px' }}>{viewEmployee.designation}</div>
              </div>
            </div>
            <div className="col-4">
              <div style={{
                background: 'white',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
                borderTop: '3px solid #059669'
              }}>
                <div style={{ fontSize: '16px' }}>📚</div>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills</div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#1f2937', marginTop: '2px' }}>{viewEmployee.skills?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Skills Section - Colorful */}
          <div style={{
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '8px 14px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                <FaCode size={11} style={{ color: '#9d174d' }} className="me-1" /> Skills & Competencies
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '500',
                color: '#9d174d',
                background: '#fce7f3',
                padding: '1px 8px',
                borderRadius: '10px'
              }}>
                {viewEmployee.skills?.length || 0}
              </span>
            </div>
            <div style={{ padding: '10px 14px', maxHeight: '80px', overflowY: 'auto' }}>
              {viewEmployee.skills && viewEmployee.skills.length > 0 ? (
                <div className="d-flex flex-wrap gap-1">
                  {viewEmployee.skills.map((skill, index) => (
                    <span 
                      key={index}
                      style={{
                        background: index % 2 === 0 ? '#fce7f3' : '#ede9fe',
                        color: index % 2 === 0 ? '#9d174d' : '#6d28d9',
                        padding: '2px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        border: '1px solid ' + (index % 2 === 0 ? '#fbcfe8' : '#ddd6fe')
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '6px 0' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>No skills assigned</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Colorful */}
        <div className="modal-footer" style={{
          background: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          padding: '8px 20px'
        }}>
          <button 
            className="btn btn-sm"
            onClick={() => setShowViewModal(false)}
            style={{
              padding: '4px 16px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #9d174d, #7c1340)',
              color: 'white',
              border: 'none',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(157,23,77,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default EmployeeSkillMaster;