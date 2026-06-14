import React, { useState } from 'react';
import { 
  FaSearch, FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, 
  FaTimes, FaFilter, FaChartLine, FaCheckCircle, FaClock, FaEdit, FaSave,FaEye
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const EmployeeDesignation = () => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Doe', code: 'EMP001', email: 'john@example.com', department: 'IT', currentDesignation: 'Software Engineer', joiningDate: '2020-01-15', status: 'Active' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', email: 'jane@example.com', department: 'HR', currentDesignation: 'HR Manager', joiningDate: '2019-06-10', status: 'Active' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', email: 'mike@example.com', department: 'IT', currentDesignation: 'Senior Developer', joiningDate: '2021-03-20', status: 'Active' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', email: 'sarah@example.com', department: 'Sales', currentDesignation: 'Sales Manager', joiningDate: '2010-08-01', status: 'Retired' },
    { id: 5, name: 'David Brown', code: 'EMP005', email: 'david@example.com', department: 'Finance', currentDesignation: 'Accountant', joiningDate: '2022-01-10', status: 'Terminated' },
    { id: 6, name: 'Emily Wilson', code: 'EMP006', email: 'emily@example.com', department: 'Marketing', currentDesignation: 'Marketing Manager', joiningDate: '2018-09-15', status: 'Active' },
    { id: 7, name: 'Robert Taylor', code: 'EMP007', email: 'robert@example.com', department: 'Operations', currentDesignation: 'Operations Manager', joiningDate: '2017-03-10', status: 'Active' },
    { id: 8, name: 'Lisa Anderson', code: 'EMP008', email: 'lisa@example.com', department: 'IT', currentDesignation: 'Product Manager', joiningDate: '2019-11-20', status: 'Active' },
    { id: 9, name: 'Amit Kumar', code: 'EMP009', email: 'amit@example.com', department: 'IT', currentDesignation: 'Tech Lead', joiningDate: '2018-05-15', status: 'Active' },
    { id: 10, name: 'Priya Singh', code: 'EMP010', email: 'priya@example.com', department: 'HR', currentDesignation: 'HR Executive', joiningDate: '2021-08-20', status: 'Active' }
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
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
  const statuses = ['Active', 'Retired', 'Terminated'];

  // Designation-wise mapping (career path)
  const getDesignationHistory = (employee, designation) => {
    const designationHistory = {
      'Software Engineer': [
        { date: '2020-01-15', designation: 'Associate Engineer' },
        { date: '2021-03-01', designation: 'Software Engineer' }
      ],
      'Senior Developer': [
        { date: '2021-03-20', designation: 'Software Engineer' },
        { date: '2023-05-01', designation: 'Senior Developer' }
      ],
      'Tech Lead': [
        { date: '2018-05-15', designation: 'Software Engineer' },
        { date: '2020-04-01', designation: 'Senior Developer' },
        { date: '2022-01-15', designation: 'Tech Lead' }
      ],
      'Product Manager': [
        { date: '2019-11-20', designation: 'Product Owner' },
        { date: '2022-04-01', designation: 'Product Manager' }
      ],
      'HR Manager': [
        { date: '2019-06-10', designation: 'HR Executive' },
        { date: '2022-04-01', designation: 'HR Manager' }
      ],
      'HR Executive': [
        { date: '2021-08-20', designation: 'HR Executive' }
      ],
      'Sales Manager': [
        { date: '2010-08-01', designation: 'Sales Executive' },
        { date: '2013-04-01', designation: 'Sr. Sales Executive' },
        { date: '2017-01-15', designation: 'Assistant Sales Manager' },
        { date: '2021-03-01', designation: 'Sales Manager' }
      ],
      'Marketing Manager': [
        { date: '2018-09-15', designation: 'Marketing Executive' },
        { date: '2020-04-01', designation: 'Sr. Marketing Executive' },
        { date: '2022-01-15', designation: 'Marketing Manager' }
      ],
      'Operations Manager': [
        { date: '2017-03-10', designation: 'Operations Executive' },
        { date: '2019-06-01', designation: 'Sr. Operations Executive' },
        { date: '2021-01-15', designation: 'Operations Manager' }
      ],
      'Accountant': [
        { date: '2022-01-10', designation: 'Junior Accountant' },
        { date: '2022-06-15', designation: 'Accountant' }
      ]
    };
    
    return designationHistory[designation] || [{ date: employee.joiningDate, designation: designation }];
  };

  const handleSearch = () => {
    if (!selectedEmployee && !selectedDesignation) {
      toast.warning('Select Filter', 'Please select either Employee or Designation');
      return;
    }
    
    let results = [];
    
    if (selectedEmployee) {
      const employee = employees.find(emp => emp.name === selectedEmployee);
      if (employee) {
        results = [{
          ...employee,
          designationHistory: getDesignationHistory(employee, employee.currentDesignation)
        }];
      }
    } else if (selectedDesignation) {
      results = employees.filter(emp => emp.currentDesignation === selectedDesignation)
        .map(emp => ({
          ...emp,
          designationHistory: getDesignationHistory(emp, emp.currentDesignation)
        }));
    }
    
    setFilteredData(results);
    setShowForm(false);
    if (results.length === 0) {
      toast.info('No Results', 'No employees found for selected criteria');
    } else {
      toast.success('Success', `${results.length} record(s) found`);
    }
  };

  const handleReset = () => {
    setSelectedEmployee('');
    setSelectedDesignation('');
    setFilteredData([]);
    setShowDetails(false);
    setShowForm(false);
    setEditingEmployee(null);
  };

 

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      code: employee.code,
      department: employee.department,
      currentDesignation: employee.currentDesignation,
      joiningDate: employee.joiningDate,
      status: employee.status
    });
    setShowForm(true);
    setFilteredData([]);
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
    
    const updatedEmployees = employees.map(emp => 
      emp.id === editingEmployee.id ? { ...emp, ...formData } : emp
    );
    
    setEmployees(updatedEmployees);
    toast.success('Success', 'Employee updated successfully');
    setShowForm(false);
    setEditingEmployee(null);
    handleReset();
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
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 8px', borderRadius: '4px' }}>{status}</span>;
  };

  const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Employee Designation</h1>
          <p className="cert-subtitle">View employee designation details and career progression</p>
        </div>
        {showForm && (
          <button type="button" className="cert-back-btn" onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
            <FaTimes size={12} /> Back
          </button>
        )}
      </div>

      {/* Search Section */}
      {!showForm && (
        <div className="card border-0 shadow-sm mb-4">
          
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label fw-bold">Select Employee</label>
                <select 
                  className="form-select" 
                  value={selectedEmployee}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    if (e.target.value) setSelectedDesignation('');
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.code})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-5">
                <label className="form-label fw-bold">Select Designation</label>
                <select 
                  className="form-select" 
                  value={selectedDesignation}
                  onChange={(e) => {
                    setSelectedDesignation(e.target.value);
                    if (e.target.value) setSelectedEmployee('');
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Select Designation --</option>
                  {DESIGNATIONS.map(des => (
                    <option key={des} value={des}>{des}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end gap-2">
                <button className="btn btn-primary" onClick={handleSearch} style={{ flex: 1 }}>
              Search
                </button>
                <button className="btn btn-outline-secondary" onClick={handleReset} style={{ flex: 1 }}>
           Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {showForm && editingEmployee && (
        <div className="cert-form-wrap mb-4">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Edit Employee Details</div>
              <div className="cert-form-grid-3col">
                <div className={`cert-field-compact ${touched.name && errors.name ? 'has-error' : ''}`}>
                  <label className="required">Employee Name</label>
                  <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} />
                  <FieldError msg={errors.name} />
                </div>
                
                <div className={`cert-field-compact ${touched.code && errors.code ? 'has-error' : ''}`}>
                  <label className="required">Employee Code</label>
                  <input type="text" value={formData.code} onChange={(e) => handleChange('code', e.target.value)} onBlur={() => handleBlur('code')} />
                  <FieldError msg={errors.code} />
                </div>
                
                <div className={`cert-field-compact ${touched.department && errors.department ? 'has-error' : ''}`}>
                  <label className="required">Department</label>
                  <select value={formData.department} onChange={(e) => handleChange('department', e.target.value)} onBlur={() => handleBlur('department')}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                  <FieldError msg={errors.department} />
                </div>
                
                <div className={`cert-field-compact ${touched.currentDesignation && errors.currentDesignation ? 'has-error' : ''}`}>
                  <label className="required">Designation</label>
                  <select value={formData.currentDesignation} onChange={(e) => handleChange('currentDesignation', e.target.value)} onBlur={() => handleBlur('currentDesignation')}>
                    <option value="">Select Designation</option>
                    {DESIGNATIONS.map(des => <option key={des} value={des}>{des}</option>)}
                  </select>
                  <FieldError msg={errors.currentDesignation} />
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
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleReset}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> Update Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Results Section */}
      {!showForm && filteredData.length > 0 && (
        <>
         
          {/* Results Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th style={{ width: 200 }}>Employee</th>
                    <th style={{ width: 120 }}>Department</th>
                    <th style={{ width: 180 }}>Current Designation</th>
                    <th style={{ width: 110 }}>Joining Date</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((emp, idx) => (
                    <tr key={emp.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <div className="fw-bold">{emp.name}</div>
                        <small className="text-muted">{emp.code}</small>
                      </td>
                      <td>{emp.department}</td>
                      <td>
                        <span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '12px' }}>
                          <FaBriefcase className="me-1" size={10} /> {emp.currentDesignation}
                        </span>
                      </td>
                      <td>{formatDate(emp.joiningDate)}</td>
                      <td>{getStatusBadge(emp.status)}</td>
                      <td className="text-center">
                        <div className="cert-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          
                          <button className="cert-act cert-act--edit" onClick={() => handleEdit(emp)} title="Edit Employee" style={{ background: '#e0e7ff', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
                            <FaEdit size={12} style={{ color: '#4f46e5' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Designation Details Modal */}
      {showDetails && selectedRecord && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaBriefcase className="me-2" /> Designation History - {selectedRecord.name}
                </h5>
                <button type="button" className="close text-white" onClick={() => setShowDetails(false)}>×</button>
              </div>
              <div className="modal-body">
                {/* Basic Info */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="text-center p-3 bg-light rounded">
                      <FaUserTie size={24} className="text-primary mb-2" />
                      <h6 className="mb-0">{selectedRecord.name}</h6>
                      <small className="text-muted">{selectedRecord.code}</small>
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
                      <FaCalendarAlt size={24} className="text-primary mb-2" />
                      <h6 className="mb-0">{formatDate(selectedRecord.joiningDate)}</h6>
                      <small className="text-muted">Joining Date</small>
                    </div>
                  </div>
                </div>

                {/* Designation History Timeline */}
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Designation History / Career Progression</h6>
                  </div>
                  <div className="card-body">
                    <div className="position-relative" style={{ paddingLeft: '30px' }}>
                      <div className="position-absolute" style={{ left: '15px', top: '0', bottom: '0', width: '2px', background: '#e5e7eb' }}></div>
                      
                      {selectedRecord.designationHistory?.map((item, idx) => (
                        <div key={idx} className="position-relative mb-3">
                          <div className="position-absolute rounded-circle" style={{ 
                            left: '-22px', top: '5px', width: '12px', height: '12px', 
                            backgroundColor: idx === selectedRecord.designationHistory.length - 1 ? '#4f46e5' : '#f59e0b' 
                          }}></div>
                          <div className="d-flex align-items-center gap-2">
                            <FaBriefcase className={idx === selectedRecord.designationHistory.length - 1 ? 'text-primary' : 'text-warning'} />
                            <strong>{item.designation}</strong>
                            <span className="text-muted small">{formatDate(item.date)}</span>
                            {idx === selectedRecord.designationHistory.length - 1 && (
                              <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>Current</span>
                            )}
                          </div>
                          {idx === 0 && (
                            <div className="text-muted small mt-1">Initial appointment as {item.designation}</div>
                          )}
                          {idx === selectedRecord.designationHistory.length - 1 && idx > 0 && (
                            <div className="text-muted small mt-1">Current designation - {item.designation}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                <div className="card mt-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Current Status</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Status:</strong> {getStatusBadge(selectedRecord.status)}
                      </div>
                      <div className="col-md-6">
                        <strong>Current Designation:</strong> {selectedRecord.currentDesignation}
                      </div>
                    </div>
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
    </div>
  );
};

export default EmployeeDesignation;