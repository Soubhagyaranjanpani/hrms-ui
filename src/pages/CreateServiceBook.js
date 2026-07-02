
import React, { useState, useRef, useEffect } from 'react';
import { FaSave, FaTimes, FaUser, FaIdCard, FaBuilding, FaBriefcase, FaBook, FaCheckCircle, FaSearch, FaEdit, FaTrash, FaPlus, FaArrowLeft, FaArrowRight, FaChevronDown } from 'react-icons/fa';
import { toast } from '../components/Toast';

const CreateServiceBook = ({ employeeId: propEmployeeId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    department: '',
    designation: '',
    serviceBookNumber: '',
    serviceBookStatus: 'Active'
  });

  // Dummy Service Books Data
  const DUMMY_SERVICE_BOOKS = [
    { id: 1, employeeId: 1, employeeName: 'John Doe', employeeCode: 'EMP001', department: 'IT', designation: 'Software Engineer', serviceBookNumber: 'SB/2024/0001', serviceBookStatus: 'Active', createdAt: '2024-01-15T10:30:00Z' },
    { id: 2, employeeId: 2, employeeName: 'Jane Smith', employeeCode: 'EMP002', department: 'HR', designation: 'HR Manager', serviceBookNumber: 'SB/2024/0002', serviceBookStatus: 'Active', createdAt: '2024-02-20T11:45:00Z' },
    { id: 3, employeeId: 3, employeeName: 'Mike Johnson', employeeCode: 'EMP003', department: 'IT', designation: 'Senior Developer', serviceBookNumber: 'SB/2024/0003', serviceBookStatus: 'Active', createdAt: '2024-03-10T09:15:00Z' },
    { id: 4, employeeId: 4, employeeName: 'Sarah Williams', employeeCode: 'EMP004', department: 'Sales', designation: 'Sales Manager', serviceBookNumber: 'SB/2023/0015', serviceBookStatus: 'Inactive', createdAt: '2023-11-05T14:20:00Z' },
    { id: 5, employeeId: 5, employeeName: 'David Brown', employeeCode: 'EMP005', department: 'Finance', designation: 'Accountant', serviceBookNumber: 'SB/2024/0008', serviceBookStatus: 'Active', createdAt: '2024-04-18T08:00:00Z' },
    { id: 6, employeeId: 1, employeeName: 'John Doe', employeeCode: 'EMP001', department: 'IT', designation: 'Tech Lead', serviceBookNumber: 'SB/2024/0012', serviceBookStatus: 'Active', createdAt: '2024-05-01T10:00:00Z' },
    { id: 7, employeeId: 2, employeeName: 'Jane Smith', employeeCode: 'EMP002', department: 'HR', designation: 'Sr. HR Manager', serviceBookNumber: 'SB/2024/0015', serviceBookStatus: 'Active', createdAt: '2024-05-15T09:30:00Z' },
    { id: 8, employeeId: 3, employeeName: 'Mike Johnson', employeeCode: 'EMP003', department: 'IT', designation: 'Tech Lead', serviceBookNumber: 'SB/2024/0020', serviceBookStatus: 'Active', createdAt: '2024-06-01T11:00:00Z' }
  ];

  const [serviceBooks, setServiceBooks] = useState(DUMMY_SERVICE_BOOKS);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const dropdownRef = useRef(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
const [showStatusModal, setShowStatusModal] = useState(false);

const [statusAction, setStatusAction] = useState({
  id: null,
  name: "",
  newStatus: ""
});

// Click outside dropdown
useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  // Dummy employees data for lookup
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

 
const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
  const search = employeeSearchTerm.toLowerCase();
  return emp.name.toLowerCase().includes(search) || 
         emp.code.toLowerCase().includes(search) ||
         emp.department.toLowerCase().includes(search);
});

  // Filter service books by search term
  const filteredServiceBooks = serviceBooks.filter(book => {
    const search = searchTerm.toLowerCase();
    return book.employeeName.toLowerCase().includes(search) || 
           book.employeeCode.toLowerCase().includes(search) ||
           book.department.toLowerCase().includes(search) ||
           book.serviceBookNumber.toLowerCase().includes(search);
  });

  // Pagination
  const totalItems = filteredServiceBooks.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentBooks = filteredServiceBooks.slice(startIndex, startIndex + rowsPerPage);

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

  // Auto generate service book number
  const generateServiceBookNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SB/${year}/${random}`;
  };

const handleEmployeeSelect = (employee) => {
  setFormData({
    ...formData,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeCode: employee.code,
    department: employee.department,
    designation: employee.designation,
    serviceBookNumber: generateServiceBookNumber()
  });
  setEmployeeSearchTerm(employee.name);
  setShowEmployeeDropdown(false); // Close dropdown after selection
  if (errors.employeeName) {
    setErrors({ ...errors, employeeName: '' });
  }
};

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'employeeName' && !value) {
      error = 'Employee Name is required';
    } else if (field === 'serviceBookStatus' && !value) {
      error = 'Status is required';
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
    if (!formData.employeeName) newErrors.employeeName = 'Employee Name is required';
    if (!formData.serviceBookStatus) newErrors.serviceBookStatus = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }

    if (editingId) {
      const updated = serviceBooks.map(sb => 
        sb.id === editingId ? { ...formData, id: editingId, createdAt: new Date().toISOString() } : sb
      );
      setServiceBooks(updated);
      toast.success('Success', 'Service Book updated successfully');
      setEditingId(null);
    } else {
      const serviceBookData = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: 'Current User'
      };
      setServiceBooks([serviceBookData, ...serviceBooks]);
      toast.success('Success', 'Service Book created successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
    if (onSuccess) onSuccess(formData);
  };

 const handleEdit = (book) => {
  if (book.serviceBookStatus === 'Inactive') {
    toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
    return;
  }
  
  setEditingId(book.id);
  setFormData({
    employeeId: book.employeeId,
    employeeName: book.employeeName,
    employeeCode: book.employeeCode,
    department: book.department,
    designation: book.designation,
    serviceBookNumber: book.serviceBookNumber,
    serviceBookStatus: book.serviceBookStatus
  });
  setSearchTerm(book.employeeName);
  setShowForm(true);
};

  const clearEmployee = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      employeeCode: '',
      department: '',
      designation: '',
      serviceBookNumber: '',
      serviceBookStatus: 'Active'
    });
    setSearchTerm('');
    setEditingId(null);
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      employeeCode: '',
      department: '',
      designation: '',
      serviceBookNumber: '',
      serviceBookStatus: 'Active'
    });
    setSearchTerm('');
    setEditingId(null);
    setErrors({});
    setTouched({});
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  
 
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
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

  const updatedBooks = serviceBooks.map(book =>
    book.id === id
      ? {
          ...book,
          serviceBookStatus: newStatus
        }
      : book
  );

  setServiceBooks(updatedBooks);

  setShowStatusModal(false);

  toast.success(
    "Status Updated",
    `${statusAction.name} is now ${newStatus}`
  );
};

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Service Book Management</h1>
          <p className="cert-subtitle">Manage employee service book records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Service Book
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
        </div>
      </div>

      {showForm ? (
        // Form View
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            
           

            <div className="cert-form-section-compact">
              <div className="cert-section-label">Employee Information</div>
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
                  <input type="text" placeholder='Auto-Populated' className="bg-light" value={formData.employeeCode} readOnly />
                </div>
                
                <div className="cert-field-compact">
                  <label>Department</label>
                  <input type="text" placeholder='Auto-Populated' className="bg-light" value={formData.department} readOnly />
                </div>
                
                <div className="cert-field-compact">
                  <label>Designation</label>
                  <input type="text" placeholder='Auto-Populated' className="bg-light" value={formData.designation} readOnly />
                </div>
                
                <div className="cert-field-compact">
                  <label>Service Book Number</label>
                  <input type="text" placeholder='Auto-Populated' className="bg-light" value={formData.serviceBookNumber} readOnly />
                </div>
                
              </div>
            </div>

            {/* {formData.employeeId && (
              <div className="alert alert-success mt-3">
                <FaCheckCircle className="me-2" />
                <strong>Service Book Ready to Create</strong>
                <hr />
                <div className="row">
                  <div className="col-md-3"><small>Service Book No:</small><br /><strong>{formData.serviceBookNumber}</strong></div>
                  <div className="col-md-3"><small>Status:</small><br /><span className="badge" style={{ background: getStatusStyle(formData.serviceBookStatus).bg, color: getStatusStyle(formData.serviceBookStatus).color }}>{formData.serviceBookStatus}</span></div>
                  <div className="col-md-3"><small>Employee:</small><br /><strong>{formData.employeeName}</strong></div>
                  <div className="col-md-3"><small>Department:</small><br /><strong>{formData.department}</strong></div>
                </div>
              </div>
            )}
             */}
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingId ? 'Update Service Book' : 'Create Service Book'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // List View
        <>
          {/* Search Bar */}
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by employee name, code, department or service book number..."
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

         
          {/* Service Books Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Employee Code</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Service Book No.</th>            
                    <th>Created Date</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBooks.length > 0 ? (
                    currentBooks.map((book,idx) => (
                      <tr key={book.id}>
                     <td className="text-center">{startIndex + idx + 1}</td>
                        <td><div className="cert-name">{book.employeeName}</div></td>
                        <td>{book.employeeCode}</td>
                        <td>{book.department}</td>
                        <td>{book.designation}</td>
                        <td>{book.serviceBookNumber}</td>
                        <td>{formatDate(book.createdAt)}</td>
                         <td>
  <div
    className="d-flex align-items-center gap-1"
    style={{ cursor: "pointer" }}
    onClick={() =>
      handleStatusToggle(
        book.id,
        book.employeeName,
        book.serviceBookStatus
      )
    }
  >
    <div
      style={{
        width: "28px",
        height: "16px",
        borderRadius: "50px",
        backgroundColor:
          book.serviceBookStatus === "Active"
            ? "#9d174d"
            : "#d1d5db",
        position: "relative",
        transition: "0.2s",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
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
            book.serviceBookStatus === "Active"
              ? "14px"
              : "2px",
          transition: "0.2s"
        }}
      />
    </div>

    <span
      style={{
        fontSize: "11px",
        fontWeight: 500,
        color:
          book.serviceBookStatus === "Active"
            ? "#9d174d"
            : "#94a3b8"
      }}
    >
      {book.serviceBookStatus}
    </span>
  </div>
</td>
                        <td>
  <div className="cert-actions">
    <button 
      className="cert-act cert-act--edit" 
      onClick={() => handleEdit(book)} 
      title={book.serviceBookStatus === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
      disabled={book.serviceBookStatus === 'Inactive'}
      style={{ 
        opacity: book.serviceBookStatus === 'Inactive' ? 0.5 : 1,
        cursor: book.serviceBookStatus === 'Inactive' ? 'not-allowed' : 'pointer'
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
                      <td colSpan="8" className="text-center py-5">
                        <FaBook size={48} className="text-muted mb-3" />
                        <p>No service books found</p>
                        <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                          <FaPlus size={13} /> Add First Service Book
                        </button>
                      </td>
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

      <h3 className="emp-modal-title">
        Confirm Status Change
      </h3>

      <p className="emp-modal-body">
        Are you sure you want to{" "}
        <strong>
          {statusAction.newStatus === "Active"
            ? "activate"
            : "deactivate"}
        </strong>{" "}
        <strong>{statusAction.name}</strong>?
      </p>

      <p className="emp-modal-warn">
        {statusAction.newStatus === "Inactive"
          ? "Inactive records cannot be edited until reactivated."
          : "This record will become active again."}
      </p>

      <div className="emp-modal-actions">
        <button
          className="emp-modal-cancel"
          onClick={() => setShowStatusModal(false)}
        >
          Cancel
        </button>

        <button
          className="emp-modal-confirm"
          onClick={confirmStatusChange}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default CreateServiceBook;