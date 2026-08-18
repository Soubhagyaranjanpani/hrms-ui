import React, { useState } from 'react';
import {
  FaSave, FaEdit, FaPlus, FaArrowLeft, FaUser,
  FaFingerprint, FaEye, FaIdCard, FaBuilding,
  FaCheckCircle, FaExclamationCircle, FaSearch,
  FaToggleOn, FaToggleOff, FaUsers, FaTrash
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const BiometricMapping = () => {
  // ─── Dummy Data ──────────────────────────────────────────
  const [mappings, setMappings] = useState([
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      deviceId: 1,
      deviceCode: 'DEV-001',
      deviceName: 'Main Gate Scanner',
      enrollmentId: 'ENR-2024-001',
      fingerprintRegistered: true,
      faceRegistered: true,
      rfidCardNumber: 'RFID-123456',
      isActive: true,
      status: 'Active'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      deviceId: 2,
      deviceCode: 'DEV-002',
      deviceName: 'Office Entry Device',
      enrollmentId: 'ENR-2024-002',
      fingerprintRegistered: true,
      faceRegistered: false,
      rfidCardNumber: 'RFID-789012',
      isActive: true,
      status: 'Active'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Mike Johnson',
      deviceId: 3,
      deviceCode: 'DEV-003',
      deviceName: 'Back Door Scanner',
      enrollmentId: 'ENR-2024-003',
      fingerprintRegistered: false,
      faceRegistered: true,
      rfidCardNumber: 'RFID-345678',
      isActive: false,
      status: 'Inactive'
    }
  ]);

  // ─── Dropdown Options ────────────────────────────────────
  const devices = [
    { id: 1, deviceCode: 'DEV-001', deviceName: 'Main Gate Scanner' },
    { id: 2, deviceCode: 'DEV-002', deviceName: 'Office Entry Device' },
    { id: 3, deviceCode: 'DEV-003', deviceName: 'Back Door Scanner' },
    { id: 4, deviceCode: 'DEV-004', deviceName: 'HR Department Device' },
    { id: 5, deviceCode: 'DEV-005', deviceName: 'Finance Entry Scanner' }
  ];

  // Dummy Employees for Search
  const employees = [
    { id: 1, employeeId: 'EMP001', name: 'John Doe', department: 'IT' },
    { id: 2, employeeId: 'EMP002', name: 'Jane Smith', department: 'HR' },
    { id: 3, employeeId: 'EMP003', name: 'Mike Johnson', department: 'IT' },
    { id: 4, employeeId: 'EMP004', name: 'Sarah Williams', department: 'Sales' },
    { id: 5, employeeId: 'EMP005', name: 'David Brown', department: 'Finance' }
  ];

  // ─── States ──────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // ─── Form State ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    deviceId: '',
    enrollmentId: '',
    fingerprintRegistered: false,
    faceRegistered: false,
    rfidCardNumber: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── Form Handlers ───────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    const requiredFields = ['employeeId', 'deviceId', 'enrollmentId'];
    
    if (requiredFields.includes(field) && !value) {
      error = 'This field is required';
    }
    
    setErrors({ ...errors, [field]: error });
    return error === '';
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['employeeId', 'deviceId', 'enrollmentId'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Employee Search ─────────────────────────────────────
  const handleEmployeeSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    // Auto select if exact match
    const found = employees.find(emp => 
      emp.employeeId === value || 
      emp.name.toLowerCase() === value.toLowerCase()
    );
    if (found) {
      handleEmployeeSelect(found);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setFormData({
      ...formData,
      employeeId: employee.employeeId,
      employeeName: employee.name
    });
    setSearchTerm(employee.employeeId + ' - ' + employee.name);
    setShowDropdown(false);
    if (touched.employeeId) {
      validateField('employeeId', employee.employeeId);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Submit Handler ──────────────────────────────────────
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }

    const device = devices.find(d => d.id === Number(formData.deviceId));

    if (editingMapping) {
      setMappings(mappings.map(m => 
        m.id === editingMapping.id 
          ? { 
              ...formData, 
              id: m.id, 
              deviceCode: device?.deviceCode, 
              deviceName: device?.deviceName,
              status: formData.isActive ? 'Active' : 'Inactive'
            } 
          : m
      ));
      toast.success('Success', 'Biometric mapping updated successfully');
    } else {
      const newMapping = {
        id: Date.now(),
        ...formData,
        deviceCode: device?.deviceCode || '',
        deviceName: device?.deviceName || '',
        status: formData.isActive ? 'Active' : 'Inactive'
      };
      setMappings([...mappings, newMapping]);
      toast.success('Success', 'Biometric mapping created successfully');
    }
    resetForm();
    setShowForm(false);
  };

  // ─── Reset Form ──────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      deviceId: '',
      enrollmentId: '',
      fingerprintRegistered: false,
      faceRegistered: false,
      rfidCardNumber: '',
      isActive: true
    });
    setErrors({});
    setTouched({});
    setEditingMapping(null);
    setSearchTerm('');
  };

  // ─── Edit Handler ────────────────────────────────────────
  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      employeeId: mapping.employeeId,
      employeeName: mapping.employeeName,
      deviceId: mapping.deviceId,
      enrollmentId: mapping.enrollmentId,
      fingerprintRegistered: mapping.fingerprintRegistered,
      faceRegistered: mapping.faceRegistered,
      rfidCardNumber: mapping.rfidCardNumber || '',
      isActive: mapping.isActive
    });
    setSearchTerm(mapping.employeeId + ' - ' + mapping.employeeName);
    setShowForm(true);
  };

  // ─── Delete Handler ──────────────────────────────────────
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this mapping?')) {
      setMappings(mappings.filter(m => m.id !== id));
      toast.info('Deleted', 'Mapping removed successfully');
    }
  };

  // ─── Status Toggle ──────────────────────────────────────
  const handleStatusToggle = (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setMappings(mappings.map(m =>
      m.id === id ? { ...m, isActive: newStatus === 'Active', status: newStatus } : m
    ));
    toast.success('Status Updated', `Mapping is now ${newStatus}`);
  };

  // ─── Pagination ──────────────────────────────────────────
  const filteredMappings = mappings;
  const totalItems = filteredMappings.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const currentMappings = filteredMappings.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  // ─── Open Form ──────────────────────────────────────────
  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  // ─── Styles ──────────────────────────────────────────────
  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8ecf1' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    iconBox: { width: '46px', height: '46px', background: 'linear-gradient(135deg, #9d174d, #be185d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
    field: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    required: { color: '#ef4444', marginLeft: '2px' },
    input: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', transition: 'all 0.3s ease' },
    error: { color: '#ef4444', fontSize: '11px', marginTop: '2px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' },
    td: { padding: '10px 16px', borderBottom: '1px solid #f1f5f9' },
    btnPrimary: { padding: '8px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSecondary: { padding: '8px 20px', background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnDanger: { padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' },
    btnWarning: { padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' },
    btnSuccess: { padding: '6px 12px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' },
    chip: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#eef2ff', color: '#4f46e5', marginRight: '4px', display: 'inline-block' },
    readOnly: { background: '#f1f5f9', cursor: 'not-allowed' }
  };

  return (
    <div className="page-container">
     
      {/* ─── HEADER ──────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="icon-box"><FaFingerprint size={20} /></div>
          <div>
            <h1 className="page-title">Biometric Mapping</h1>
            <p className="page-subtitle">{mappings.length} biometric mappings</p>
          </div>
        </div>                                                                                                                                                                                                                                                                     
        <div style={{ display: 'flex', gap: '10px',alignItems: 'center'  }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={openForm}>
              <FaPlus size={13} /> Add Mapping
            </button>
          )}
          {showForm && (
            <button className="cert-back-btn" onClick={() => { resetForm(); setShowForm(false); }}>
              <FaArrowLeft size={13} /> Back 
            </button> 
          )}
        </div>
      </div>

      {/* ─── FORM SECTION ────────────────────────────────── */}
      {showForm && (
        <div style={{ ...styles.card, marginBottom: '24px', borderColor: '#9d174d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              {editingMapping ? 'Edit Biometric Mapping' : 'Add Biometric Mapping'}
            </h4>
          </div>

          <div className="form-grid">
            {/* Employee ID - Search */}
            <div className="form-group">
              <label style={styles.label}>Employee ID <span style={styles.required}>*</span></label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className={`bio-input ${errors.employeeId && touched.employeeId ? 'error' : ''}`}
                    style={{ ...styles.input, paddingRight: '36px' }}
                    placeholder="Search by ID or Name..."
                    value={searchTerm}
                    onChange={handleEmployeeSearch}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  />
                </div>
                {showDropdown && searchTerm && (
                  <div className="employee-dropdown">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(emp => (
                        <div
                          key={emp.id}
                          className="employee-dropdown-item"
                          onClick={() => handleEmployeeSelect(emp)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <span className="emp-id">{emp.employeeId}</span>
                          <span className="emp-name"> - {emp.name}</span>
                          <span className="emp-dept"> • {emp.department}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px 14px', color: '#94a3b8' }}>
                        No employees found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.employeeId && touched.employeeId && <div className="form-error">{errors.employeeId}</div>}
            </div>

            {/* Employee Name - Read Only */}
            <div className="form-group">
              <label style={styles.label}>Employee Name</label>
              <input
                type="text"
                style={{ ...styles.input, ...styles.readOnly }}
                value={formData.employeeName || '—'}
                readOnly
                disabled
                placeholder="Select employee first"
              />
            </div>

            {/* Device Dropdown */}
            <div className="form-group">
              <label style={styles.label}>Device <span style={styles.required}>*</span></label>
              <select
                className={`bio-input ${errors.deviceId && touched.deviceId ? 'error' : ''}`}
                className="form-control"
                value={formData.deviceId}
                onChange={(e) => handleChange('deviceId', e.target.value)}
                onBlur={() => handleBlur('deviceId')}
              >
                <option value="">Select Device</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.deviceCode} - {d.deviceName}
                  </option>
                ))}
              </select>
              {errors.deviceId && touched.deviceId && <div className="form-error">{errors.deviceId}</div>}
            </div>

            {/* Enrollment ID */}
            <div className="form-group">
              <label style={styles.label}>Enrollment ID <span style={styles.required}>*</span></label>
              <input
                type="text"
                className={`bio-input ${errors.enrollmentId && touched.enrollmentId ? 'error' : ''}`}
                className="form-control"
                placeholder="ENR-2024-001"
                value={formData.enrollmentId}
                onChange={(e) => handleChange('enrollmentId', e.target.value)}
                onBlur={() => handleBlur('enrollmentId')}
              />
              {errors.enrollmentId && touched.enrollmentId && <div className="form-error">{errors.enrollmentId}</div>}
            </div>

            {/* Fingerprint Registered - Toggle */}
            <div className="form-group">
              <label style={styles.label}>Fingerprint Registered</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <button
                  className={`toggle-switch ${formData.fingerprintRegistered ? 'active' : 'inactive'}`}
                  onClick={() => handleChange('fingerprintRegistered', !formData.fingerprintRegistered)}
                />
                <span style={{ fontSize: '13px', fontWeight: '500', color: formData.fingerprintRegistered ? '#065f46' : '#991b1b' }}>
                  <FaCheckCircle size={14} style={{ marginRight: '4px' }} />
                  {formData.fingerprintRegistered ? 'Registered' : 'Not Registered'}
                </span>
              </div>
            </div>

            {/* Face Registered - Toggle */}
            <div className="form-group">
              <label style={styles.label}>Face Registered</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <button
                  className={`toggle-switch ${formData.faceRegistered ? 'active' : 'inactive'}`}
                  onClick={() => handleChange('faceRegistered', !formData.faceRegistered)}
                />
                <span style={{ fontSize: '13px', fontWeight: '500', color: formData.faceRegistered ? '#065f46' : '#991b1b' }}>
                  <FaCheckCircle size={14} style={{ marginRight: '4px' }} />
                  {formData.faceRegistered ? 'Registered' : 'Not Registered'}
                </span>
              </div>
            </div>

            {/* RFID Card Number */}
            <div className="form-group">
              <label style={styles.label}>RFID Card Number</label>
              <input
                type="text"
                className="bio-input"
                className="form-control"
                placeholder="RFID-XXXXXX"
                value={formData.rfidCardNumber}
                onChange={(e) => handleChange('rfidCardNumber', e.target.value)}
              />
            </div>

           
          </div>

          {/* ─── Form Actions ────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button className="btn btn-secondary" onClick={() => { resetForm(); setShowForm(false); }}>
              Cancel
            </button>
            <button className="btn btn-secondary" onClick={resetForm}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              <FaSave size={13} /> {editingMapping ? 'Update Mapping' : 'Add Mapping'}
            </button>
          </div>
        </div>
      )}

      {/* ─── TABLE ─────────────────────────────────────────── */}
      {!showForm && (
        <div className="card">
          {mappings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FaFingerprint size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No biometric mappings yet</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>Click "Add Mapping" to enroll employees</p>
              <button className="btn btn-primary" onClick={openForm}>
                <FaPlus size={13} /> Add Mapping
              </button>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Employee ID</th>
                      <th style={styles.th}>Employee Name</th>
                      <th style={styles.th}>Device</th>
                      <th style={styles.th}>Enrollment ID</th>
                      <th style={styles.th}>Fingerprint</th>
                      <th style={styles.th}>Face</th>
                      <th style={styles.th}>RFID</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, textAlign: 'center', width: '120px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMappings.length > 0 ? (
                      currentMappings.map((mapping, idx) => (
                        <tr key={mapping.id} style={{ transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={styles.td}>{startIndex + idx + 1}</td>
                          <td style={{ ...styles.td, fontWeight: '600', color: '#9d174d' }}>{mapping.employeeId}</td>
                          <td style={styles.td}><strong>{mapping.employeeName}</strong></td>
                          <td style={styles.td}>
                            <span style={styles.chip}>
                              {mapping.deviceCode}
                            </span>
                          </td>
                          <td style={styles.td}>{mapping.enrollmentId}</td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: mapping.fingerprintRegistered ? '#d1fae5' : '#fee2e2',
                              color: mapping.fingerprintRegistered ? '#065f46' : '#991b1b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <FaCheckCircle size={10} />
                              {mapping.fingerprintRegistered ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: mapping.faceRegistered ? '#d1fae5' : '#fee2e2',
                              color: mapping.faceRegistered ? '#065f46' : '#991b1b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <FaCheckCircle size={10} />
                              {mapping.faceRegistered ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {mapping.rfidCardNumber || '—'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                className={`toggle-switch ${mapping.isActive ? 'active' : 'inactive'}`}
                                onClick={() => handleStatusToggle(mapping.id, mapping.status)}
                              />
                              <span style={{ fontSize: '11px', fontWeight: '500', color: mapping.isActive ? '#065f46' : '#991b1b' }}>
                                {mapping.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                style={styles.btnWarning}
                                onClick={() => handleEdit(mapping)}
                                title="Edit"
                              >
                                <FaEdit size={13} />
                              </button>
                             
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                          <p>No mappings found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ─── Pagination ────────────────────────────────── */}
              {totalPages > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} mappings
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: currentPage === 0 ? 0.5 : 1 }}
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      ← Prev
                    </button>
                    {getPaginationRange().map((pg, i) =>
                      pg === '...' ? (
                        <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                      ) : (
                        <button
                          key={pg}
                          style={{ padding: '6px 10px', border: '1px solid #e5e7eb', background: pg === currentPage ? '#9d174d' : 'white', color: pg === currentPage ? 'white' : '#374151', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px' }}
                          onClick={() => setCurrentPage(pg)}
                        >
                          {pg + 1}
                        </button>
                      )
                    )}
                    <button
                      style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: currentPage + 1 >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: currentPage + 1 >= totalPages ? 0.5 : 1 }}
                      disabled={currentPage + 1 >= totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BiometricMapping;