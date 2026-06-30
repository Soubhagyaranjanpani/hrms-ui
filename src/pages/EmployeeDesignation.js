import React, { useState, useEffect } from 'react';
import { 
  FaSearch, FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, 
  FaTimes, FaEdit, FaSave, FaPlus, FaTrash,
  FaArrowLeft, FaEye
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const EmployeeDesignation = ({ user, onCancel }) => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Doe', code: 'EMP001', email: 'john@example.com', department: 'IT', currentDesignation: 'Software Engineer', joiningDate: '2020-01-15', status: 'Active' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', email: 'jane@example.com', department: 'HR', currentDesignation: 'HR Manager', joiningDate: '2019-06-10', status: 'Active' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', email: 'mike@example.com', department: 'IT', currentDesignation: 'Senior Developer', joiningDate: '2021-03-20', status: 'Active' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', email: 'sarah@example.com', department: 'Sales', currentDesignation: 'Sales Manager', joiningDate: '2010-08-01', status: 'Inactive' },
    { id: 5, name: 'David Brown', code: 'EMP005', email: 'david@example.com', department: 'Finance', currentDesignation: 'Accountant', joiningDate: '2022-01-10', status: 'Inactive' },
    { id: 6, name: 'Emily Wilson', code: 'EMP006', email: 'emily@example.com', department: 'Marketing', currentDesignation: 'Marketing Manager', joiningDate: '2018-09-15', status: 'Active' },
    { id: 7, name: 'Robert Taylor', code: 'EMP007', email: 'robert@example.com', department: 'Operations', currentDesignation: 'Operations Manager', joiningDate: '2017-03-10', status: 'Active' },
    { id: 8, name: 'Lisa Anderson', code: 'EMP008', email: 'lisa@example.com', department: 'IT', currentDesignation: 'Product Manager', joiningDate: '2019-11-20', status: 'Active' },
    { id: 9, name: 'Amit Kumar', code: 'EMP009', email: 'amit@example.com', department: 'IT', currentDesignation: 'Tech Lead', joiningDate: '2018-05-15', status: 'Inactive' },
    { id: 10, name: 'Priya Singh', code: 'EMP010', email: 'priya@example.com', department: 'HR', currentDesignation: 'HR Executive', joiningDate: '2021-08-20', status: 'Active' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState(employees);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
const [statusAction, setStatusAction] = useState({ id: null, name: '', newStatus: '' });
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    currentDesignation: '',
    joiningDate: '',
    status: 'Active'
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  
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

  const DESIGNATIONS = [
    'Software Engineer',
    'Senior Developer',
    'Tech Lead',
    'Product Manager',
    'HR Manager',
    'HR Executive',
    'Sales Manager',
    'Marketing Manager',
    'Operations Manager',
    'Accountant'
  ];

  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations'];
  const statuses = ['Active', 'Inactive'];

  // Filter employees by search
  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = employees.filter(emp => 
      emp.name.toLowerCase().includes(search) ||
      emp.code.toLowerCase().includes(search) ||
      emp.department.toLowerCase().includes(search) ||
      emp.currentDesignation.toLowerCase().includes(search)
    );
    setFilteredEmployees(filtered);
    setPage(0);
  }, [searchTerm, employees]);

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
    setFormData(prev => ({
      ...prev,
      name: employee.name,
      code: employee.code,
      department: employee.department,
      currentDesignation: employee.designation
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

  const handleAddNew = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      code: '',
      department: '',
      currentDesignation: '',
      joiningDate: '',
      status: 'Active'
    });
    setEmployeeSearchTerm('');
    setSelectedEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee) => {
    const emp = DUMMY_EMPLOYEES.find(e => e.id === employee.id);
    setSelectedEmployee(emp || null);
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      code: employee.code,
      department: employee.department,
      currentDesignation: employee.currentDesignation,
      joiningDate: employee.joiningDate,
      status: employee.status
    });
    setEmployeeSearchTerm(emp?.name || '');
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      const updatedEmployees = employees.filter(emp => emp.id !== id);
      setEmployees(updatedEmployees);
      toast.success('Deleted', 'Employee record deleted successfully');
    }
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

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'name' && !value) error = 'Name is required';
    else if (field === 'code' && !value) error = 'Employee Code is required';
    else if (field === 'department' && !value) error = 'Department is required';
    else if (field === 'currentDesignation' && !value) error = 'Designation is required';
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
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.code) newErrors.code = 'Employee Code is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.currentDesignation) newErrors.currentDesignation = 'Designation is required';
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
    
    if (editingEmployee) {
      const updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee.id ? { ...emp, ...formData } : emp
      );
      setEmployees(updatedEmployees);
      toast.success('Success', 'Employee updated successfully');
      setEditingEmployee(null);
    } else {
      const newEmployee = {
        id: employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1,
        ...formData,
        email: formData.code.toLowerCase() + '@example.com'
      };
      setEmployees([newEmployee, ...employees]);
      toast.success('Success', 'Employee added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
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

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      department: '',
      currentDesignation: '',
      joiningDate: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingEmployee(null);
    setEmployeeSearchTerm('');
    setSelectedEmployee(null);
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
      Inactive: { bg: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || styles.Active;
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 8px' }}>{status}</span>;
  };

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Employee Designation</h1>
          <p className="cert-subtitle">Manage employee designation details and career progression</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
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
                          {employeeSearchResults.length > 0 ? (
                            employeeSearchResults.map(emp => (
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
                placeholder="Search by Name, Code, Department or Designation..."
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
                    <th>Code</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? (
                    currentEmployees.map((emp, idx) => (
                      <tr key={emp.id}>
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td className="fw-bold">{emp.name}</td>
                        <td>{emp.code}</td>
                        <td>{emp.department}</td>
                        <td>
                          <span className="badge" style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 8px' }}>
                            {emp.currentDesignation}
                          </span>
                        </td>
                        <td>{formatDate(emp.joiningDate)}</td>
<td>
  <div 
    className="d-flex align-items-center gap-1" 
    style={{ cursor: 'pointer' }}
    onClick={() => handleStatusToggle(emp.id, emp.name, emp.status)}
  >
    <div className="position-relative" style={{
      width: '28px',
      height: '16px',
      borderRadius: '50px',
      backgroundColor: emp.status === 'Active' ? '#9d174d' : '#d1d5db',
      transition: '0.2s',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
      flexShrink: 0
    }}>
      <div className="position-absolute" style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: 'white',
        top: '2px',
        left: emp.status === 'Active' ? '14px' : '2px',
        transition: '0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }} />
    </div>
    <span className="small fw-medium" style={{
      color: emp.status === 'Active' ? '#9d174d' : '#94a3b8',
      minWidth: '40px'
    }}>
      {emp.status}
    </span>
  </div>
</td>                       <td className="text-center">
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
              
   
{showStatusModal && (
          <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
            <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="emp-modal-icon">{statusAction.newStatus === "y" ? "✅" : "⛔"}</div>
              <h3 className="emp-modal-title">Confirm Status Change</h3>
              <p className="emp-modal-body">
                Are you sure you want to <strong>{statusAction.newStatus === "y" ? "activate" : "deactivate"}</strong>{" "}
                <strong>{statusAction.name}</strong>?
              </p>
              <p className="emp-modal-warn">
                {statusAction.newStatus === "n"
                  ? "Inactive designations cannot be edited until reactivated."
                  : "Active designations will be available for selection."}
              </p>
              <div className="emp-modal-actions">
                <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
              </div>
            </div>
          </div>
        )}
            </div>
            
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

export default EmployeeDesignation;