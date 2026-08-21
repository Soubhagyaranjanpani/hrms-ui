import React, { useState } from 'react';
import {
  FaSave, FaEdit, FaPlus, FaArrowLeft, FaExclamationTriangle,
  FaCalendarAlt, FaToggleOn, FaServer, FaCheckCircle,
  FaToggleOff, FaExclamationCircle, FaSearch, FaFilter,
  FaClock, FaUser, FaFingerprint, FaEye, FaCheck,
  FaTimes, FaClock as FaClockIcon, FaUserSlash,
  FaBuilding, FaUserTie, FaBriefcase, FaFileAlt,
  FaChevronDown
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AttendanceExceptionManagement = () => {
  // ─── Dummy Data ──────────────────────────────────────────
  const [exceptions, setExceptions] = useState([
    {
      id: 1,
      employeeId: 1,
      employeeName: 'Rahul Sharma',
      employeeCode: 'EMP001',
      deviceId: 1,
      deviceCode: 'DEV-001',
      deviceName: 'Main Gate Scanner',
      punchDate: '2024-01-15',
      punchTime: '09:30:00',
      exceptionType: 'Missing Punch',
      exceptionCode: 'MISSING_IN',
      remarks: 'Employee was on leave, forgot to mark attendance',
      resolutionStatus: 'Pending',
      resolvedBy: null,
      resolvedAt: null,
      createdAt: '2024-01-15T09:35:00'
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: 'Priya Patel',
      employeeCode: 'EMP002',
      deviceId: 2,
      deviceCode: 'DEV-002',
      deviceName: 'Office Entry Device',
      punchDate: '2024-01-15',
      punchTime: '18:45:00',
      exceptionType: 'Duplicate Punch',
      exceptionCode: 'DUPLICATE',
      remarks: 'System captured same punch twice',
      resolutionStatus: 'Resolved',
      resolvedBy: 'HR Manager',
      resolvedAt: '2024-01-15T19:00:00',
      createdAt: '2024-01-15T18:50:00'
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: 'Amit Singh',
      employeeCode: 'EMP003',
      deviceId: 3,
      deviceCode: 'DEV-003',
      deviceName: 'Back Door Scanner',
      punchDate: '2024-01-14',
      punchTime: '08:15:00',
      exceptionType: 'Unknown Employee',
      exceptionCode: 'UNKNOWN_EMP',
      remarks: 'Biometric ID not recognized in system',
      resolutionStatus: 'Pending',
      resolvedBy: null,
      resolvedAt: null,
      createdAt: '2024-01-14T08:20:00'
    },
    {
      id: 4,
      employeeId: 4,
      employeeName: 'Neha Verma',
      employeeCode: 'EMP004',
      deviceId: 1,
      deviceCode: 'DEV-001',
      deviceName: 'Main Gate Scanner',
      punchDate: '2024-01-14',
      punchTime: '17:30:00',
      exceptionType: 'Missing Punch',
      exceptionCode: 'MISSING_OUT',
      remarks: 'Employee forgot to punch out',
      resolutionStatus: 'Ignored',
      resolvedBy: 'System Admin',
      resolvedAt: '2024-01-14T18:00:00',
      createdAt: '2024-01-14T17:35:00'
    },
    {
      id: 5,
      employeeId: 5,
      employeeName: 'Vikram Kumar',
      employeeCode: 'EMP005',
      deviceId: 4,
      deviceCode: 'DEV-004',
      deviceName: 'HR Department Device',
      punchDate: '2024-01-13',
      punchTime: '10:00:00',
      exceptionType: 'Duplicate Punch',
      exceptionCode: 'DUPLICATE',
      remarks: 'Multiple entries within 5 minutes',
      resolutionStatus: 'Pending',
      resolvedBy: null,
      resolvedAt: null,
      createdAt: '2024-01-13T10:05:00'
    }
  ]);

  // ─── Employees Data with Punch Details ──────────────────
  const employees = [
    { id: 1, name: 'Rahul Sharma', code: 'EMP001', department: 'IT', deviceName: 'Main Gate Scanner', deviceCode: 'DEV-001', punchDate: '2024-01-15', punchTime: '09:30:00', exceptionType: 'Missing Punch' },
    { id: 2, name: 'Priya Patel', code: 'EMP002', department: 'HR', deviceName: 'Office Entry Device', deviceCode: 'DEV-002', punchDate: '2024-01-15', punchTime: '18:45:00', exceptionType: 'Duplicate Punch' },
    { id: 3, name: 'Amit Singh', code: 'EMP003', department: 'Operations', deviceName: 'Back Door Scanner', deviceCode: 'DEV-003', punchDate: '2024-01-14', punchTime: '08:15:00', exceptionType: 'Unknown Employee' },
    { id: 4, name: 'Neha Verma', code: 'EMP004', department: 'Finance', deviceName: 'Main Gate Scanner', deviceCode: 'DEV-001', punchDate: '2024-01-14', punchTime: '17:30:00', exceptionType: 'Missing Punch' },
    { id: 5, name: 'Vikram Kumar', code: 'EMP005', department: 'IT', deviceName: 'HR Department Device', deviceCode: 'DEV-004', punchDate: '2024-01-13', punchTime: '10:00:00', exceptionType: 'Duplicate Punch' },
    { id: 6, name: 'Sunita Reddy', code: 'EMP006', department: 'Sales', deviceName: 'Sales Floor Device', deviceCode: 'DEV-005', punchDate: '2024-01-15', punchTime: '11:20:00', exceptionType: 'Late Entry' },
    { id: 7, name: 'Rajesh Gupta', code: 'EMP007', department: 'Marketing', deviceName: 'Marketing Wing Device', deviceCode: 'DEV-006', punchDate: '2024-01-15', punchTime: '16:45:00', exceptionType: 'Early Exit' }
  ];

  // ─── Exception Types ─────────────────────────────────────
  const exceptionTypes = [
    { value: 'Missing Punch', label: 'Missing Punch', icon: <FaClockIcon size={12} />, color: '#f59e0b', bg: '#fef3c7' },
    { value: 'Duplicate Punch', label: 'Duplicate Punch', icon: <FaExclamationCircle size={12} />, color: '#ef4444', bg: '#fee2e2' },
    { value: 'Unknown Employee', label: 'Unknown Employee', icon: <FaUserSlash size={12} />, color: '#8b5cf6', bg: '#ede9fe' },
    { value: 'Missing Punch In', label: 'Missing Punch In', icon: <FaClockIcon size={12} />, color: '#f59e0b', bg: '#fef3c7' },
    { value: 'Missing Punch Out', label: 'Missing Punch Out', icon: <FaClockIcon size={12} />, color: '#f59e0b', bg: '#fef3c7' },
    { value: 'Late Entry', label: 'Late Entry', icon: <FaClockIcon size={12} />, color: '#f59e0b', bg: '#fef3c7' },
    { value: 'Early Exit', label: 'Early Exit', icon: <FaClockIcon size={12} />, color: '#f59e0b', bg: '#fef3c7' }
  ];

  const resolutionStatuses = ['Pending', 'Resolved', 'Ignored'];

  // ─── States ──────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingException, setEditingException] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedException, setSelectedException] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ─── Employee Dropdown States ───────────────────────────
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  // ─── Form State ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    deviceName: '',
    deviceCode: '',
    punchDate: '',
    punchTime: '',
    exceptionType: '',
    remarks: '',
    resolutionStatus: 'Pending'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── Employee Selection ──────────────────────────────────
  const filteredEmployees = employees.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) ||
           emp.code.toLowerCase().includes(search) ||
           emp.department.toLowerCase().includes(search);
  });

  const handleEmployeeSelect = (employee) => {
    setFormData({
      ...formData,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.code,
      deviceName: employee.deviceName,
      deviceCode: employee.deviceCode,
      // ✅ Auto-populate punch date, punch time, exception type
      punchDate: employee.punchDate || '',
      punchTime: employee.punchTime || '',
      exceptionType: employee.exceptionType || ''
    });
    setEmployeeSearchTerm(employee.name);
    setShowEmployeeDropdown(false);
    if (errors.employeeName) {
      setErrors({ ...errors, employeeName: '' });
    }
  };

  // ─── Form Handlers ────────────────────────────────────────
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
    const requiredFields = ['employeeName', 'punchDate', 'punchTime', 'exceptionType'];
    
    if (requiredFields.includes(field) && !value) {
      error = 'This field is required';
    }
    
    setErrors({ ...errors, [field]: error });
    return error === '';
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['employeeName', 'punchDate', 'punchTime', 'exceptionType'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit Handler ──────────────────────────────────────
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }

    if (editingException) {
      setExceptions(exceptions.map(exp =>
        exp.id === editingException.id
          ? { 
              ...exp, 
              ...formData,
              exceptionCode: formData.exceptionType.toUpperCase().replace(/ /g, '_')
            }
          : exp
      ));
      toast.success('Success', 'Exception updated successfully');
    } else {
      const newException = {
        id: Date.now(),
        employeeId: formData.employeeId || exceptions.length + 1,
        employeeName: formData.employeeName,
        employeeCode: formData.employeeCode || `EMP${String(exceptions.length + 1).padStart(3, '0')}`,
        deviceId: exceptions.length + 1,
        deviceCode: formData.deviceCode || `DEV-${String(exceptions.length + 1).padStart(3, '0')}`,
        deviceName: formData.deviceName,
        punchDate: formData.punchDate,
        punchTime: formData.punchTime,
        exceptionType: formData.exceptionType,
        exceptionCode: formData.exceptionType.toUpperCase().replace(/ /g, '_'),
        remarks: formData.remarks || '',
        resolutionStatus: formData.resolutionStatus || 'Pending',
        resolvedBy: null,
        resolvedAt: null,
        createdAt: new Date().toISOString()
      };
      setExceptions([...exceptions, newException]);
      toast.success('Success', 'Exception added successfully');
    }
    resetForm();
    setShowForm(false);
  };

  // ─── Reset Form ──────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      employeeCode: '',
      deviceName: '',
      deviceCode: '',
      punchDate: '',
      punchTime: '',
      exceptionType: '',
      remarks: '',
      resolutionStatus: 'Pending'
    });
    setErrors({});
    setTouched({});
    setEditingException(null);
    setEmployeeSearchTerm('');
  };

  // ─── Edit Handler ────────────────────────────────────────
  const handleEdit = (exception) => {
    setEditingException(exception);
    setFormData({
      employeeId: exception.employeeId,
      employeeName: exception.employeeName,
      employeeCode: exception.employeeCode,
      deviceName: exception.deviceName,
      deviceCode: exception.deviceCode,
      punchDate: exception.punchDate,
      punchTime: exception.punchTime,
      exceptionType: exception.exceptionType,
      remarks: exception.remarks || '',
      resolutionStatus: exception.resolutionStatus
    });
    setEmployeeSearchTerm(exception.employeeName);
    setShowForm(true);
  };

  // ─── Open Form ────────────────────────────────────────────
  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  // ─── View Handler ────────────────────────────────────────
  const handleView = (exception) => {
    setSelectedException(exception);
    setResolveData({
      remarks: exception.remarks || '',
      resolutionStatus: exception.resolutionStatus || 'Pending'
    });
    setShowResolveModal(true);
  };

  // ─── Resolve Form State ──────────────────────────────────
  const [resolveData, setResolveData] = useState({
    remarks: '',
    resolutionStatus: 'Resolved'
  });

  const handleResolve = () => {
    if (!selectedException) return;

    if (!resolveData.remarks) {
      toast.warning('Validation Error', 'Please add resolution remarks');
      return;
    }

    setExceptions(exceptions.map(exp =>
      exp.id === selectedException.id
        ? {
            ...exp,
            remarks: resolveData.remarks,
            resolutionStatus: resolveData.resolutionStatus,
            resolvedBy: 'HR Manager',
            resolvedAt: new Date().toISOString()
          }
        : exp
    ));

    toast.success('Success', 'Exception resolved successfully');
    setShowResolveModal(false);
    setSelectedException(null);
    setResolveData({ remarks: '', resolutionStatus: 'Resolved' });
  };

  const handleCloseModal = () => {
    setShowResolveModal(false);
    setSelectedException(null);
    setResolveData({ remarks: '', resolutionStatus: 'Resolved' });
  };

  // ─── Pagination ──────────────────────────────────────────
  const filteredExceptions = exceptions.filter(exp => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = exp.employeeName.toLowerCase().includes(search) ||
                          exp.employeeCode.toLowerCase().includes(search) ||
                          exp.deviceName.toLowerCase().includes(search) ||
                          exp.exceptionType.toLowerCase().includes(search);
    const matchesStatus = filterStatus === 'all' || exp.resolutionStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredExceptions.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const currentExceptions = filteredExceptions.slice(startIndex, startIndex + rowsPerPage);

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

  // ─── Format Date/Time ────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExceptionBadge = (type) => {
    const found = exceptionTypes.find(et => et.value === type);
    if (found) {
      return { bg: found.bg, color: found.color, icon: found.icon };
    }
    return { bg: '#f3f4f6', color: '#6b7280', icon: <FaExclamationTriangle size={12} /> };
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { bg: '#fef3c7', color: '#92400e', icon: <FaClockIcon size={12} /> },
      'Resolved': { bg: '#d1fae5', color: '#065f46', icon: <FaCheckCircle size={12} /> },
      'Ignored': { bg: '#f3f4f6', color: '#6b7280', icon: <FaTimes size={12} /> }
    };
    return badges[status] || badges['Pending'];
  };

  // ─── Styles ──────────────────────────────────────────────
  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8ecf1' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    iconBox: { width: '46px', height: '46px', background: 'linear-gradient(135deg, #9d174d, #be185d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' },
    td: { padding: '10px 16px', borderBottom: '1px solid #f1f5f9' },
    btnPrimary: { padding: '8px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSecondary: { padding: '8px 20px', background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSuccess: { padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', transition: 'all 0.3s ease' },
    btnInfo: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', transition: 'all 0.3s ease' },
    chip: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    searchBox: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchInput: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', flex: '1', minWidth: '200px', transition: 'all 0.3s ease' },
    filterSelect: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer', transition: 'all 0.3s ease' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modal: { background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' },
    modalSubtitle: { fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' },
    field: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    input: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', transition: 'all 0.3s ease' },
    textarea: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', minHeight: '80px', resize: 'vertical', transition: 'all 0.3s ease' },
    infoRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' },
    infoLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: '500' },
    infoValue: { fontSize: '13px', color: '#1e293b', fontWeight: '500' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
    dropdown: { position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
    dropdownItem: { padding: '10px 14px', cursor: 'pointer', transition: 'all 0.2s', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .exp-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .exp-input.error {
          border-color: #ef4444 !important;
        }
        .exp-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
        .dropdown-item:hover {
          background: #f8f0f3;
        }
        .dropdown-item .emp-name { font-weight: 600; color: #0f172a; }
        .dropdown-item .emp-details { font-size: 12px; color: #94a3b8; }
        .dropdown-item .emp-code { padding: 2px 10px; background: #f1f5f9; border-radius: 12px; font-size: 11px; color: #64748b; }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaExclamationTriangle size={20} /></div>
          <div>
            <h1 style={styles.title}>Attendance Exception Management</h1>
            <p style={styles.subtitle}>
              {showForm ? 'Add/Edit Exception' : `${exceptions.length} exceptions found`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!showForm && (
            <button style={styles.btnPrimary} onClick={openForm}>
              <FaPlus size={13} /> Add Exception
            </button>
          )}
          {showForm && (
            <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>
              <FaArrowLeft size={13} /> Back to List
            </button>
          )}
        </div>
      </div>

      {/* ─── FORM SECTION ────────────────────────────────── */}
      {showForm && (
        <div style={{ ...styles.card, marginBottom: '16px', borderColor: '#9d174d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              {editingException ? 'Edit Exception' : 'Add New Exception'}
            </h4>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required</span>
          </div>

          <div style={styles.formGrid}>
            {/* Employee Name with Dropdown */}
            <div style={styles.field}>
              <label style={styles.label}>Employee <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className={`exp-input ${errors.employeeName && touched.employeeName ? 'error' : ''}`}
                  style={styles.input}
                  placeholder="Type employee name to search..."
                  value={employeeSearchTerm}
                  onChange={(e) => {
                    setEmployeeSearchTerm(e.target.value);
                    setShowEmployeeDropdown(true);
                    if (e.target.value === '') {
                      setFormData({ ...formData, employeeId: '', employeeName: '', employeeCode: '', deviceName: '', deviceCode: '', punchDate: '', punchTime: '', exceptionType: '' });
                    }
                  }}
                  onFocus={() => { if (employeeSearchTerm.length > 0) setShowEmployeeDropdown(true); }}
                  onBlur={() => handleBlur('employeeName')}
                />
                <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                
                {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
                  <div style={styles.dropdown}>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(emp => (
                        <div 
                          key={emp.id} 
                          style={styles.dropdownItem}
                          className="dropdown-item"
                          onClick={() => handleEmployeeSelect(emp)}
                        >
                          <div>
                            <div className="emp-name">{emp.name}</div>
                            <div className="emp-details">Code: {emp.code} | Dept: {emp.department}</div>
                          </div>
                          <span className="emp-code">{emp.deviceName}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px 14px', color: '#94a3b8' }}>No employees found</div>
                    )}
                  </div>
                )}
              </div>
              {errors.employeeName && touched.employeeName && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errors.employeeName}</span>}
            </div>

            {/* Employee Code - Auto Populated */}
            <div style={styles.field}>
              <label style={styles.label}>Employee Code</label>
              <input
                type="text"
                className="exp-input"
                style={{ ...styles.input, background: '#f3f4f6', cursor: 'not-allowed' }}
                value={formData.employeeCode}
                disabled
              />
            </div>

            {/* Device Name - Auto Populated */}
            <div style={styles.field}>
              <label style={styles.label}>Device</label>
              <input
                type="text"
                className="exp-input"
                style={{ ...styles.input, background: '#f3f4f6', cursor: 'not-allowed' }}
                value={formData.deviceName}
                disabled
              />
            </div>

            {/* Device Code - Auto Populated */}
            <div style={styles.field}>
              <label style={styles.label}>Device Code</label>
              <input
                type="text"
                className="exp-input"
                style={{ ...styles.input, background: '#f3f4f6', cursor: 'not-allowed' }}
                value={formData.deviceCode}
                disabled
              />
            </div>

            {/* Punch Date - Auto Populated */}
            <div style={styles.field}>
              <label style={styles.label}>Punch Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="date"
                className={`exp-input ${errors.punchDate && touched.punchDate ? 'error' : ''}`}
                style={{ ...styles.input, background: '#f3f4f6', cursor: 'not-allowed' }}
                value={formData.punchDate}
                disabled
              />
              {errors.punchDate && touched.punchDate && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errors.punchDate}</span>}
            </div>

            {/* Punch Time - Auto Populated */}
            <div style={styles.field}>
              <label style={styles.label}>Punch Time <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="time"
                className={`exp-input ${errors.punchTime && touched.punchTime ? 'error' : ''}`}
                style={{ ...styles.input, background: '#f3f4f6', cursor: 'not-allowed' }}
                value={formData.punchTime}
                disabled
              />
              {errors.punchTime && touched.punchTime && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errors.punchTime}</span>}
            </div>

            {/* Exception Type - Auto Populated */}
            <div style={styles.field}>
              <label style={styles.label}>Exception Type <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                className={`exp-input ${errors.exceptionType && touched.exceptionType ? 'error' : ''}`}
                style={{ ...styles.input, background: '#f3f4f6', cursor: 'not-allowed' }}
                value={formData.exceptionType}
                disabled
              >
                <option value="">Select Exception Type</option>
                {exceptionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.exceptionType && touched.exceptionType && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errors.exceptionType}</span>}
            </div>

            {/* Resolution Status */}
            <div style={styles.field}>
              <label style={styles.label}>Resolution Status</label>
              <select
                className="exp-input"
                style={styles.input}
                value={formData.resolutionStatus}
                onChange={(e) => handleChange('resolutionStatus', e.target.value)}
              >
                {resolutionStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Remarks */}
            <div style={{ ...styles.field, gridColumn: 'span 1' }}>
              <label style={styles.label}>Remarks</label>
              <textarea
                className="exp-input"
                style={styles.textarea}
                placeholder="Add remarks..."
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
              />
            </div>
          </div>

          {/* ─── Form Actions ────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>
              Cancel
            </button>
            <button style={styles.btnSecondary} onClick={resetForm}>
              Reset
            </button>
            <button style={styles.btnPrimary} onClick={handleSubmit}>
              <FaSave size={13} /> {editingException ? 'Update Exception' : 'Save Exception'}
            </button>
          </div>
        </div>
      )}

      {/* ─── SEARCH & FILTER ────────────────────────────── */}
      {!showForm && (
        <>
         <div className="emp-search-bar">
  <div className="emp-search-wrap">
    <FaSearch className="emp-search-icon" size={12} />
    <input
      className="emp-search-input"
      type="text"
      placeholder="Search by employee, device or exception type..."
      value={searchTerm}
      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
    />
    {searchTerm && (
      <button className="cert-search-clear" onClick={() => { setSearchTerm(''); setCurrentPage(0); }}>
        <FaTimes size={11} />
      </button>
    )}
  </div>
 
</div>

          {/* ─── TABLE ─────────────────────────────────────────── */}
          <div style={styles.card}>
            {exceptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <FaExclamationTriangle size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No exceptions found</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>All attendance records are clean</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>Employee</th>
                        <th style={styles.th}>Device</th>
                        <th style={styles.th}>Punch Date</th>
                        <th style={styles.th}>Punch Time</th>
                        <th style={styles.th}>Exception Type</th>
                        <th style={styles.th}>Status</th>
                        <th style={{ ...styles.th, textAlign: 'center', width: '140px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentExceptions.length > 0 ? (
                        currentExceptions.map((exp, idx) => {
                          const exceptionBadge = getExceptionBadge(exp.exceptionType);
                          const statusBadge = getStatusBadge(exp.resolutionStatus);
                          return (
                            <tr key={exp.id} style={{ transition: 'all 0.2s ease' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={styles.td}>{startIndex + idx + 1}</td>
                              <td style={{ ...styles.td, fontWeight: '500' }}>
                                <div>{exp.employeeName}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{exp.employeeCode}</div>
                              </td>
                              <td style={styles.td}>
                                <div>{exp.deviceName}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{exp.deviceCode}</div>
                              </td>
                              <td style={styles.td}>{formatDate(exp.punchDate)}</td>
                              <td style={styles.td}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <FaClock size={12} style={{ color: '#94a3b8' }} />
                                  {exp.punchTime}
                                </span>
                              </td>
                              <td style={styles.td}>
                                <span style={{ 
                                  ...styles.chip, 
                                  background: exceptionBadge.bg, 
                                  color: exceptionBadge.color 
                                }}>
                                  {exceptionBadge.icon}
                                  {exp.exceptionType}
                                </span>
                              </td>
                              <td style={styles.td}>
                                <span style={{ 
                                  ...styles.chip, 
                                  background: statusBadge.bg, 
                                  color: statusBadge.color 
                                }}>
                                  {statusBadge.icon}
                                  {exp.resolutionStatus}
                                </span>
                              </td>
                              <td style={{ ...styles.td, textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button
                                    style={styles.btnInfo}
                                    onClick={() => handleView(exp)}
                                    title="View Details"
                                  >
                                    <FaEye size={11} />
                                  </button>
                                  {exp.resolutionStatus === 'Pending' && (
                                    <>
                                      <button
                                        style={styles.btnSuccess}
                                        onClick={() => handleEdit(exp)}
                                        title="Edit"
                                      >
                                        <FaEdit size={11} />
                                      </button>
                                      <button
                                        style={styles.btnSuccess}
                                        onClick={() => handleView(exp)}
                                        title="Resolve"
                                      >
                                        <FaCheck size={11} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                            <p>No matching exceptions found</p>
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
                      Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} exceptions
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
        </>
      )}

      {/* ─── VIEW/RESOLVE MODAL ───────────────────────────── */}
      {showResolveModal && selectedException && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={styles.modalTitle}>
                  {selectedException.resolutionStatus === 'Pending' ? 'Resolve Exception' : 'Exception Details'}
                </h3>
                <p style={styles.modalSubtitle}>
                  {selectedException.employeeName} • {selectedException.exceptionType}
                </p>
              </div>
              <button
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            {/* Exception Details */}
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Employee</span>
                <span style={styles.infoValue}>{selectedException.employeeName} ({selectedException.employeeCode})</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Device</span>
                <span style={styles.infoValue}>{selectedException.deviceName} ({selectedException.deviceCode})</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Punch Date & Time</span>
                <span style={styles.infoValue}>{formatDate(selectedException.punchDate)} {selectedException.punchTime}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Exception Type</span>
                <span style={styles.infoValue}>
                  <span style={{ 
                    ...styles.chip, 
                    background: getExceptionBadge(selectedException.exceptionType).bg, 
                    color: getExceptionBadge(selectedException.exceptionType).color 
                  }}>
                    {getExceptionBadge(selectedException.exceptionType).icon}
                    {selectedException.exceptionType}
                  </span>
                </span>
              </div>
              {selectedException.resolvedBy && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Resolved By</span>
                  <span style={styles.infoValue}>{selectedException.resolvedBy}</span>
                </div>
              )}
              {selectedException.resolvedAt && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Resolved At</span>
                  <span style={styles.infoValue}>{formatDateTime(selectedException.resolvedAt)}</span>
                </div>
              )}
            </div>

            {/* Resolve Form */}
            <div style={styles.field}>
              <label style={styles.label}>Remarks <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                style={styles.textarea}
                placeholder="Add resolution remarks..."
                value={resolveData.remarks}
                onChange={(e) => setResolveData({ ...resolveData, remarks: e.target.value })}
                disabled={selectedException.resolutionStatus !== 'Pending'}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Resolution Status</label>
              <select
                style={styles.input}
                value={resolveData.resolutionStatus}
                onChange={(e) => setResolveData({ ...resolveData, resolutionStatus: e.target.value })}
                disabled={selectedException.resolutionStatus !== 'Pending'}
              >
                {resolutionStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button style={styles.btnSecondary} onClick={handleCloseModal}>
                Close
              </button>
              {selectedException.resolutionStatus === 'Pending' && (
                <button style={styles.btnPrimary} onClick={handleResolve}>
                  <FaCheck size={13} /> Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceExceptionManagement;