import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, 
  FaBook, FaEye, FaDownload, FaPrint, FaTimes,
  FaCheckCircle, FaClock, FaUserCheck, FaFileAlt, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher,
  FaPlus, FaSave, FaEdit, FaTrash, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookSearch = ({ user, onCancel }) => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Doe', department: 'IT', designation: 'Software Engineer', status: 'Active', joiningDate: '2020-01-15', retirementDate: null },
    { id: 2, name: 'Jane Smith', department: 'HR', designation: 'HR Manager', status: 'Active', joiningDate: '2019-06-10', retirementDate: null },
    { id: 3, name: 'Mike Johnson', department: 'IT', designation: 'Senior Developer', status: 'Active', joiningDate: '2021-03-20', retirementDate: null },
    { id: 4, name: 'Sarah Williams', department: 'Sales', designation: 'Sales Manager', status: 'Retired', joiningDate: '2010-08-01', retirementDate: '2024-03-31' },
    { id: 5, name: 'David Brown', department: 'Finance', designation: 'Accountant', status: 'Terminated', joiningDate: '2022-01-10', retirementDate: null },
    { id: 6, name: 'Emily Wilson', department: 'Marketing', designation: 'Marketing Manager', status: 'Active', joiningDate: '2018-09-15', retirementDate: null },
    { id: 7, name: 'Robert Taylor', department: 'Operations', designation: 'Operations Manager', status: 'Active', joiningDate: '2017-03-10', retirementDate: null },
    { id: 8, name: 'Lisa Anderson', department: 'IT', designation: 'Product Manager', status: 'Active', joiningDate: '2019-11-20', retirementDate: null }
  ]);
  
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
    retirementDate: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);

  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations'];
  const designations = ['Software Engineer', 'Senior Developer', 'Tech Lead', 'HR Manager', 'Sales Manager', 'Accountant', 'Marketing Manager', 'Operations Manager', 'Product Manager'];
  const statuses = ['Active', 'Retired', 'Terminated'];

  // Filter employees by search
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

  // Pagination
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

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
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      joiningDate: employee.joiningDate,
      retirementDate: employee.retirementDate || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    toast.success('Deleted', 'Employee deleted successfully');
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
      retirementDate: formData.retirementDate || null
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
      retirementDate: ''
    });
    setErrors({});
    setTouched({});
    setEditingEmployee(null);
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

  const getStatusBadge = (status) => {
    const styles = {
      Active: { bg: '#d1fae5', color: '#065f46' },
      Retired: { bg: '#fed7aa', color: '#9a3412' },
      Terminated: { bg: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || styles.Active;
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 8px' }}>{status}</span>;
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Service Book Search</h1>
          <p className="cert-subtitle">Manage employee service records</p>
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
                <div className={`cert-field-compact ${touched.name && errors.name ? 'has-error' : ''}`} style={{ gridColumn: 'span 2' }}>
                  <label className="required">Employee Name</label>
                  <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} />
                  <FieldError msg={errors.name} />
                </div>
                
                <div className={`cert-field-compact ${touched.department && errors.department ? 'has-error' : ''}`}>
                  <label className="required">Department</label>
                  <select value={formData.department} onChange={(e) => handleChange('department', e.target.value)} onBlur={() => handleBlur('department')}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                  <FieldError msg={errors.department} />
                </div>
                
                <div className={`cert-field-compact ${touched.designation && errors.designation ? 'has-error' : ''}`}>
                  <label className="required">Designation</label>
                  <select value={formData.designation} onChange={(e) => handleChange('designation', e.target.value)} onBlur={() => handleBlur('designation')}>
                    <option value="">Select Designation</option>
                    {designations.map(des => <option key={des} value={des}>{des}</option>)}
                  </select>
                  <FieldError msg={errors.designation} />
                </div>
                
                <div className={`cert-field-compact ${touched.joiningDate && errors.joiningDate ? 'has-error' : ''}`}>
                  <label className="required">Joining Date</label>
                  <input type="date" value={formData.joiningDate} onChange={(e) => handleChange('joiningDate', e.target.value)} onBlur={() => handleBlur('joiningDate')} />
                  <FieldError msg={errors.joiningDate} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Status</label>
                  <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                    {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                
                <div className="cert-field-compact">
                  <label>Retirement Date</label>
                  <input type="date" value={formData.retirementDate} onChange={(e) => handleChange('retirementDate', e.target.value)} />
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

          {/* Employees Table - With Serial No */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Joining Date</th>
                    <th>Retirement Date</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map((emp, idx) => (
                      <tr key={emp.id}>
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td className="fw-bold">{emp.name}</td>
                        <td>{emp.department}</td>
                        <td>{emp.designation}</td>
                        <td>{getStatusBadge(emp.status)}</td>
                        <td>{formatDate(emp.joiningDate)}</td>
                        <td>{emp.retirementDate ? formatDate(emp.retirementDate) : '—'}</td>
                        <td className="text-center">
                          <div className="cert-actions">
                           
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(emp)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(emp.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5">No employees found</td>
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
                    Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} employees
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

export default ServiceBookSearch;