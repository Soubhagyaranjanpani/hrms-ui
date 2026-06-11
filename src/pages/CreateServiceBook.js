// import React, { useState } from 'react';
// import { FaSave, FaTimes, FaUser, FaIdCard, FaBuilding, FaBriefcase, FaBook, FaCheckCircle, FaSearch } from 'react-icons/fa';
// import { toast } from '../components/Toast';

// const CreateServiceBook = ({ employeeId: propEmployeeId, onSuccess, onCancel }) => {
//   const [formData, setFormData] = useState({
//     employeeId: '',
//     employeeName: '',
//     employeeCode: '',
//     department: '',
//     designation: '',
//     serviceBookNumber: '',
//     serviceBookStatus: 'Active'
//   });

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');

//   // Dummy employees data for lookup
//   const DUMMY_EMPLOYEES = [
//     { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
//     { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
//     { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
//     { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
//     { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
//   ];

//   // Filtered employees for search
//   const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
//     const search = searchTerm.toLowerCase();
//     return emp.name.toLowerCase().includes(search) || 
//            emp.code.toLowerCase().includes(search);
//   });

//   // Auto generate service book number
//   const generateServiceBookNumber = () => {
//     const year = new Date().getFullYear();
//     const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//     return `SB/${year}/${random}`;
//   };

//   // Handle employee selection
//   const handleEmployeeSelect = (employee) => {
//     setFormData({
//       ...formData,
//       employeeId: employee.id,
//       employeeName: employee.name,
//       employeeCode: employee.code,
//       department: employee.department,
//       designation: employee.designation,
//       serviceBookNumber: generateServiceBookNumber()
//     });
//     setShowEmployeeSearch(false);
//     setSearchTerm('');
    
//     if (errors.employeeName) {
//       setErrors({ ...errors, employeeName: '' });
//     }
//   };

//   // Handle form field change
//   const handleChange = (field, value) => {
//     setFormData({ ...formData, [field]: value });
//     if (touched[field]) {
//       validateField(field, value);
//     }
//   };

//   // Validate single field
//   const validateField = (field, value) => {
//     let error = '';
//     if (field === 'employeeName' && !value) {
//       error = 'Employee Name is required';
//     } else if (field === 'serviceBookStatus' && !value) {
//       error = 'Status is required';
//     }
//     setErrors(prev => ({ ...prev, [field]: error }));
//     return error === '';
//   };

//   // Handle blur
//   const handleBlur = (field) => {
//     setTouched(prev => ({ ...prev, [field]: true }));
//     validateField(field, formData[field]);
//   };

//   // Validate entire form
//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.employeeName) newErrors.employeeName = 'Employee Name is required';
//     if (!formData.serviceBookStatus) newErrors.serviceBookStatus = 'Status is required';
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submit
//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       toast.warning('Validation Error', 'Please fill all required fields');
//       return;
//     }

//     const serviceBookData = {
//       ...formData,
//       createdAt: new Date().toISOString(),
//       createdBy: 'Current User'
//     };

//     console.log('Service Book Data:', serviceBookData);
//     toast.success('Success', 'Service Book created successfully');
    
//     if (onSuccess) {
//       onSuccess(serviceBookData);
//     }
//   };

//   // Status options
//   const statusOptions = [
//     { value: 'Active', label: 'Active', color: '#10b981', bg: '#d1fae5' },
//     { value: 'Closed', label: 'Closed', color: '#6b7280', bg: '#f3f4f6' },
//     { value: 'Retired', label: 'Retired', color: '#f59e0b', bg: '#fed7aa' },
//     { value: 'Terminated', label: 'Terminated', color: '#ef4444', bg: '#fee2e2' }
//   ];

//   const getStatusStyle = (status) => {
//     const option = statusOptions.find(opt => opt.value === status);
//     return option || statusOptions[0];
//   };

//   return (
//     <div className="container-fluid p-4">
//       {/* Header */}
//       <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
//         <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
//           <FaBook className="text-primary" size={24} />
//         </div>
//         <div>
//           <h3 className="mb-0">Create Service Book</h3>
//           <p className="text-muted mb-0 small">Create new employee service book record</p>
//         </div>
//       </div>

//       {/* Form Card */}
//       <div className="card border-0 shadow-sm">
//         <div className="card-header bg-light border-0 py-3">
//           <h6 className="mb-0 fw-bold">📋 Employee Information</h6>
//         </div>
//         <div className="card-body">
//           <form onSubmit={handleSubmit}>
//             <div className="row g-4">
              
//               {/* Employee Name - Lookup */}
//               <div className="col-md-6">
//                 <label className="form-label fw-bold">
//                   Employee Name <span className="text-danger">*</span>
//                 </label>
//                 <div className="position-relative">
//                   <div className="input-group">
//                     <span className="input-group-text bg-light">
//                       <FaUser size={14} className="text-muted" />
//                     </span>
//                     <input
//                       type="text"
//                       className={`form-control ${touched.employeeName && errors.employeeName ? 'is-invalid' : ''}`}
//                       placeholder="Search employee by name or code..."
//                       value={formData.employeeName}
//                       onFocus={() => setShowEmployeeSearch(true)}
//                       onChange={(e) => {
//                         setFormData({ ...formData, employeeName: e.target.value });
//                         setSearchTerm(e.target.value);
//                       }}
//                       readOnly={!!formData.employeeId}
//                     />
//                     {formData.employeeId && (
//                       <button
//                         type="button"
//                         className="btn btn-outline-secondary"
//                         onClick={() => {
//                           setFormData({
//                             employeeId: '',
//                             employeeName: '',
//                             employeeCode: '',
//                             department: '',
//                             designation: '',
//                             serviceBookNumber: '',
//                             serviceBookStatus: 'Active'
//                           });
//                         }}
//                       >
//                         <FaTimes size={12} />
//                       </button>
//                     )}
//                     <button
//                       type="button"
//                       className="btn btn-outline-secondary"
//                       onClick={() => setShowEmployeeSearch(true)}
//                     >
//                       <FaSearch size={12} />
//                     </button>
//                   </div>
                  
//                   {/* Employee Search Dropdown */}
//                   {showEmployeeSearch && (
//                     <div className="card position-absolute top-100 start-0 end-0 mt-1 shadow-lg" style={{ zIndex: 1000, maxHeight: '300px', overflow: 'auto' }}>
//                       <div className="card-body p-2">
//                         <div className="mb-2">
//                           <input
//                             type="text"
//                             className="form-control form-control-sm"
//                             placeholder="Search by name or code..."
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             autoFocus
//                           />
//                         </div>
//                         {filteredEmployees.length > 0 ? (
//                           filteredEmployees.map(emp => (
//                             <div
//                               key={emp.id}
//                               className="d-flex justify-content-between align-items-center p-2 rounded cursor-pointer hover-bg-light"
//                               style={{ cursor: 'pointer' }}
//                               onClick={() => handleEmployeeSelect(emp)}
//                               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
//                               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
//                             >
//                               <div>
//                                 <div className="fw-bold">{emp.name}</div>
//                                 <small className="text-muted">Code: {emp.code} | Dept: {emp.department}</small>
//                               </div>
//                               <div>
//                                 <span className="badge bg-light text-dark">{emp.designation}</span>
//                               </div>
//                             </div>
//                           ))
//                         ) : (
//                           <div className="text-center py-3 text-muted">
//                             <small>No employees found</small>
//                           </div>
//                         )}
//                       </div>
//                       <div className="card-footer bg-light py-1">
//                         <button
//                           type="button"
//                           className="btn btn-sm btn-link text-danger w-100"
//                           onClick={() => setShowEmployeeSearch(false)}
//                         >
//                           Close
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//                 {touched.employeeName && errors.employeeName && (
//                   <small className="text-danger">{errors.employeeName}</small>
//                 )}
//                 <small className="text-muted">Search by employee name or code</small>
//               </div>

//               {/* Employee Code - Auto Populate */}
//               <div className="col-md-6">
//                 <label className="form-label fw-bold">Employee Code</label>
//                 <div className="input-group">
//                   <span className="input-group-text bg-light">
//                     <FaIdCard size={14} className="text-muted" />
//                   </span>
//                   <input
//                     type="text"
//                     className="form-control bg-light"
//                     value={formData.employeeCode}
//                     readOnly
//                     placeholder="Auto-populated after selection"
//                   />
//                 </div>
//               </div>

//               {/* Department - Auto Populate */}
//               <div className="col-md-6">
//                 <label className="form-label fw-bold">Department</label>
//                 <div className="input-group">
//                   <span className="input-group-text bg-light">
//                     <FaBuilding size={14} className="text-muted" />
//                   </span>
//                   <input
//                     type="text"
//                     className="form-control bg-light"
//                     value={formData.department}
//                     readOnly
//                     placeholder="Auto-populated after selection"
//                   />
//                 </div>
//               </div>

//               {/* Designation - Auto Populate */}
//               <div className="col-md-6">
//                 <label className="form-label fw-bold">Designation</label>
//                 <div className="input-group">
//                   <span className="input-group-text bg-light">
//                     <FaBriefcase size={14} className="text-muted" />
//                   </span>
//                   <input
//                     type="text"
//                     className="form-control bg-light"
//                     value={formData.designation}
//                     readOnly
//                     placeholder="Auto-populated after selection"
//                   />
//                 </div>
//               </div>

//               {/* Service Book Number - Auto Generated */}
//               <div className="col-md-6">
//                 <label className="form-label fw-bold">Service Book Number</label>
//                 <div className="input-group">
//                   <span className="input-group-text bg-light">
//                     <FaBook size={14} className="text-muted" />
//                   </span>
//                   <input
//                     type="text"
//                     className="form-control bg-light"
//                     value={formData.serviceBookNumber}
//                     readOnly
//                     placeholder="Auto-generated after selection"
//                   />
//                 </div>
//                 <small className="text-muted">Auto-generated on employee selection</small>
//               </div>

//               {/* Service Book Status - Dropdown */}
//               <div className="col-md-6">
//                 <label className="form-label fw-bold">
//                   Service Book Status <span className="text-danger">*</span>
//                 </label>
//                 <select
//                   className={`form-select ${touched.serviceBookStatus && errors.serviceBookStatus ? 'is-invalid' : ''}`}
//                   value={formData.serviceBookStatus}
//                   onChange={(e) => handleChange('serviceBookStatus', e.target.value)}
//                   onBlur={() => handleBlur('serviceBookStatus')}
//                 >
//                   {statusOptions.map(option => (
//                     <option key={option.value} value={option.value}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//                 {touched.serviceBookStatus && errors.serviceBookStatus && (
//                   <small className="text-danger">{errors.serviceBookStatus}</small>
//                 )}
//               </div>

//               {/* Preview Section */}
//               {formData.employeeId && (
//                 <div className="col-12 mt-3">
//                   <div className="alert alert-success bg-opacity-10 border-0">
//                     <div className="d-flex align-items-center gap-2">
//                       <FaCheckCircle className="text-success" size={18} />
//                       <strong>Service Book Ready to Create</strong>
//                     </div>
//                     <hr className="my-2" />
//                     <div className="row">
//                       <div className="col-md-3">
//                         <small className="text-muted d-block">Service Book No:</small>
//                         <span className="fw-bold">{formData.serviceBookNumber}</span>
//                       </div>
//                       <div className="col-md-3">
//                         <small className="text-muted d-block">Status:</small>
//                         <span className={`badge`} style={{
//                           background: getStatusStyle(formData.serviceBookStatus).bg,
//                           color: getStatusStyle(formData.serviceBookStatus).color
//                         }}>
//                           {formData.serviceBookStatus}
//                         </span>
//                       </div>
//                       <div className="col-md-3">
//                         <small className="text-muted d-block">Employee:</small>
//                         <span>{formData.employeeName}</span>
//                       </div>
//                       <div className="col-md-3">
//                         <small className="text-muted d-block">Department:</small>
//                         <span>{formData.department}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Form Actions */}
//             <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
//               <button
//                 type="button"
//                 className="btn btn-outline-secondary px-4"
//                 onClick={onCancel}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="btn btn-primary px-4"
//                 disabled={!formData.employeeId}
//               >
//                 <FaSave className="me-1" size={12} /> Create Service Book
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateServiceBook;
import React, { useState } from 'react';
import { FaSave, FaTimes, FaUser, FaIdCard, FaBuilding, FaBriefcase, FaBook, FaCheckCircle, FaSearch } from 'react-icons/fa';
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

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

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

  // Auto generate service book number
  const generateServiceBookNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SB/${year}/${random}`;
  };

  // Handle employee selection
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
    setSearchTerm('');
    setShowDropdown(false);
    
    if (errors.employeeName) {
      setErrors({ ...errors, employeeName: '' });
    }
  };

  // Handle form field change
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  // Validate single field
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

  // Handle blur
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeName) newErrors.employeeName = 'Employee Name is required';
    if (!formData.serviceBookStatus) newErrors.serviceBookStatus = 'Status is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }

    const serviceBookData = {
      ...formData,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User'
    };

    console.log('Service Book Data:', serviceBookData);
    toast.success('Success', 'Service Book created successfully');
    
    if (onSuccess) {
      onSuccess(serviceBookData);
    }
  };

  // Clear selected employee
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
  };

  // Status options
  const statusOptions = [
    { value: 'Active', label: 'Active', color: '#10b981', bg: '#d1fae5' },
    { value: 'Closed', label: 'Closed', color: '#6b7280', bg: '#f3f4f6' },
    { value: 'Retired', label: 'Retired', color: '#f59e0b', bg: '#fed7aa' },
    { value: 'Terminated', label: 'Terminated', color: '#ef4444', bg: '#fee2e2' }
  ];

  const getStatusStyle = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option || statusOptions[0];
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaBook className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Create Service Book</h5>
          <p className="text-muted mb-0 small">Create new employee service book record</p>
        </div>
      </div>

      {/* Search Section - Separate */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold">🔍 Search Employee</h6>
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
                    placeholder="Search by employee name or code..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {formData.employeeId && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={clearEmployee}
                    >
                      <FaTimes size={12} /> Clear
                    </button>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showDropdown && searchTerm && (
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
              <small className="text-muted">Type employee name or code to search</small>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold">📋 Employee Information</h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              
              {/* Employee Name - Auto Populate */}
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  Employee Name <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaUser size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className={`form-control bg-light ${touched.employeeName && errors.employeeName ? 'is-invalid' : ''}`}
                    value={formData.employeeName}
                    readOnly
                    placeholder="Select from search above"
                  />
                </div>
                {touched.employeeName && errors.employeeName && (
                  <small className="text-danger">{errors.employeeName}</small>
                )}
                <small className="text-muted">Auto-populated from search selection</small>
              </div>

              {/* Employee Code - Auto Populate */}
              <div className="col-md-6">
                <label className="form-label fw-bold">Employee Code</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaIdCard size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.employeeCode}
                    readOnly
                    placeholder="Auto-populated"
                  />
                </div>
              </div>

              {/* Department - Auto Populate */}
              <div className="col-md-6">
                <label className="form-label fw-bold">Department</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaBuilding size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.department}
                    readOnly
                    placeholder="Auto-populated"
                  />
                </div>
              </div>

              {/* Designation - Auto Populate */}
              <div className="col-md-6">
                <label className="form-label fw-bold">Designation</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaBriefcase size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.designation}
                    readOnly
                    placeholder="Auto-populated"
                  />
                </div>
              </div>

              {/* Service Book Number - Auto Generated */}
              <div className="col-md-6">
                <label className="form-label fw-bold">Service Book Number</label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaBook size={14} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.serviceBookNumber}
                    readOnly
                    placeholder="Auto-generated after selection"
                  />
                </div>
                <small className="text-muted">Auto-generated on employee selection</small>
              </div>

              {/* Service Book Status - Dropdown */}
              <div className="col-md-6">
                <label className="form-label fw-bold">
                  Service Book Status <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.serviceBookStatus && errors.serviceBookStatus ? 'is-invalid' : ''}`}
                  value={formData.serviceBookStatus}
                  onChange={(e) => handleChange('serviceBookStatus', e.target.value)}
                  onBlur={() => handleBlur('serviceBookStatus')}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {touched.serviceBookStatus && errors.serviceBookStatus && (
                  <small className="text-danger">{errors.serviceBookStatus}</small>
                )}
              </div>

              {/* Preview Section */}
              {formData.employeeId && (
                <div className="col-12 mt-3">
                  <div className="alert alert-success bg-opacity-10 border-0">
                    <div className="d-flex align-items-center gap-2">
                      <FaCheckCircle className="text-success" size={18} />
                      <strong>Service Book Ready to Create</strong>
                    </div>
                    <hr className="my-2" />
                    <div className="row">
                      <div className="col-md-3">
                        <small className="text-muted d-block">Service Book No:</small>
                        <span className="fw-bold">{formData.serviceBookNumber}</span>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Status:</small>
                        <span className={`badge`} style={{
                          background: getStatusStyle(formData.serviceBookStatus).bg,
                          color: getStatusStyle(formData.serviceBookStatus).color
                        }}>
                          {formData.serviceBookStatus}
                        </span>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Employee:</small>
                        <span>{formData.employeeName}</span>
                      </div>
                      <div className="col-md-3">
                        <small className="text-muted d-block">Department:</small>
                        <span>{formData.department}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
    
              >
                <FaSave className="me-1" size={12} /> Create Service Book
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateServiceBook;