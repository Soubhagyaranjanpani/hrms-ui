
import React, { useState, useRef, useEffect } from 'react';
import {
  FaSearch, FaPlus, FaTimes, FaSave, FaTrash, FaEdit,
  FaExclamationCircle, FaClock, FaCheckCircle, FaFileAlt,
  FaUser, FaEnvelope, FaBuilding, FaUserCheck, FaArrowLeft,
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const DUMMY_EMPLOYEES = [
  { id: 1, name: 'John Doe', email: 'john@example.com', department: 'IT', designation: 'Software Engineer' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'HR', designation: 'HR Manager' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', department: 'IT', designation: 'Senior Developer' },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', department: 'Sales', designation: 'Sales Manager' },
  { id: 5, name: 'David Brown', email: 'david@example.com', department: 'Finance', designation: 'Accountant' }
];

const DUMMY_CERTIFICATIONS = [
  {
    id: 1,
    employeeId: 1,
    employeeName: 'John Doe',
    certificationName: 'AWS Certified Solutions Architect',
    issuedBy: 'Amazon Web Services',
    certificateNumber: 'AWS-12345',
    issueDate: '2024-01-15',
    expiryDate: '2026-01-14',
    reminderDays: 30,
    notes: 'Professional certification',
  },
  {
    id: 2,
    employeeId: 1,
    employeeName: 'John Doe',
    certificationName: 'Microsoft Azure Fundamentals',
    issuedBy: 'Microsoft',
    certificateNumber: 'AZ-900-11111',
    issueDate: '2024-03-20',
    expiryDate: '2026-03-19',
    reminderDays: 45,
    notes: 'Fundamentals certification',
  },
  {
    id: 3,
    employeeId: 2,
    employeeName: 'Jane Smith',
    certificationName: 'Certified Scrum Master',
    issuedBy: 'Scrum Alliance',
    certificateNumber: 'CSM-67890',
    issueDate: '2023-06-10',
    expiryDate: '2025-06-09',
    reminderDays: 30,
    notes: '',
  },
];

const CertStatusBadge = ({ expiryDate }) => {
  if (!expiryDate) {
    return (
      <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <FaCheckCircle size={10} /> Never Expires
      </span>
    );
  }
  const today = new Date();
  const expiry = new Date(expiryDate);
  const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  
  if (days < 0) {
    return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaExclamationCircle size={10} /> Expired</span>;
  }
  if (days <= 30) {
    return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaClock size={10} /> Expiring Soon</span>;
  }
  return <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaCheckCircle size={10} /> Active</span>;
};

export default function Certifications() {
  const [certifications, setCertifications] = useState(DUMMY_CERTIFICATIONS);
  const [employees, setEmployees] = useState(DUMMY_EMPLOYEES);
  const [nextId, setNextId] = useState(4);

  // ── Pagination States ──
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // ── Form Rows States ──
  const [formRows, setFormRows] = useState([
    {
      id: Date.now(),
      employeeId: '',
      employeeName: '',
      certificationName: '',
      issuedBy: '',
      certificateNumber: '',
      issueDate: '',
      expiryDate: '',
      reminderDays: 30,
      notes: ''
    }
  ]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [rowErrors, setRowErrors] = useState({});

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Row Handlers ──
  const handleRowChange = (rowId, field, value) => {
    setFormRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
    
    if (rowErrors[rowId] && rowErrors[rowId][field]) {
      const newErrors = { ...rowErrors };
      delete newErrors[rowId][field];
      if (Object.keys(newErrors[rowId] || {}).length === 0) {
        delete newErrors[rowId];
      }
      setRowErrors(newErrors);
    }
  };

  const handleEmployeeSelect = (rowId, employee) => {
    setFormRows(prev => prev.map(row => 
      row.id === rowId ? {
        ...row,
        employeeId: employee.id,
        employeeName: employee.name
      } : row
    ));
    setEmployeeSearchTerm(employee.name);
    setShowEmployeeDropdown(false);
    
    if (rowErrors[rowId]) {
      const newErrors = { ...rowErrors };
      delete newErrors[rowId];
      setRowErrors(newErrors);
    }
  };

  const addRow = () => {
    const newRow = {
      id: Date.now() + Math.random(),
      employeeId: '',
      employeeName: '',
      certificationName: '',
      issuedBy: '',
      certificateNumber: '',
      issueDate: '',
      expiryDate: '',
      reminderDays: 30,
      notes: ''
    };
    setFormRows([...formRows, newRow]);
  };

  const removeRow = (rowId) => {
    if (formRows.length <= 1) {
      toast.warning('Cannot Remove', 'At least one row is required');
      return;
    }
    setFormRows(prev => prev.filter(row => row.id !== rowId));
    const newErrors = { ...rowErrors };
    delete newErrors[rowId];
    setRowErrors(newErrors);
  };

  const validateRow = (row) => {
    const errors = {};
    if (!row.employeeId) errors.employeeId = 'Employee required';
    if (!row.certificationName) errors.certificationName = 'Certification required';
    if (!row.issuedBy) errors.issuedBy = 'Issued By required';
    if (!row.issueDate) errors.issueDate = 'Issue Date required';
    if (row.expiryDate && new Date(row.expiryDate) <= new Date(row.issueDate)) {
      errors.expiryDate = 'Expiry must be after Issue Date';
    }
    return errors;
  };

  const handleAddOrUpdate = () => {
    let hasErrors = false;
    const allErrors = {};
    
    formRows.forEach(row => {
      const rowError = validateRow(row);
      if (Object.keys(rowError).length > 0) {
        allErrors[row.id] = rowError;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setRowErrors(allErrors);
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    if (isEditMode && editingRowId) {
      const updated = formRows.map(row => 
        row.id === editingRowId ? { ...row } : row
      );
      // Update single row in certifications
      const updatedCert = certifications.map(cert => 
        cert.id === editingRowId ? { ...cert, ...updated[0] } : cert
      );
      setCertifications(updatedCert);
      toast.success('Updated', 'Certificate updated successfully');
      resetForm();
      return;
    }

    const newCertifications = formRows.map(row => ({
      id: nextId + Math.random() * 1000,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      certificationName: row.certificationName,
      issuedBy: row.issuedBy,
      certificateNumber: row.certificateNumber || '',
      issueDate: row.issueDate,
      expiryDate: row.expiryDate || '',
      reminderDays: row.reminderDays || 30,
      notes: row.notes || ''
    }));

    setCertifications([...newCertifications, ...certifications]);
    setNextId(nextId + newCertifications.length);
    toast.success('Success', `${newCertifications.length} certificate(s) added successfully`);
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      const updated = certifications.filter(cert => cert.id !== id);
      setCertifications(updated);
      toast.info('Deleted', 'Certificate removed successfully');
      if (currentPage > 0 && updated.length <= currentPage * rowsPerPage) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  
const handleTableRowClick = (row) => {
  setFormRows([{
    id: Date.now(),
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    certificationName: row.certificationName,
    issuedBy: row.issuedBy,
    certificateNumber: row.certificateNumber || '',
    issueDate: row.issueDate,
    expiryDate: row.expiryDate || '',
    reminderDays: row.reminderDays || 30,
    notes: row.notes || ''
  }]);
  setEmployeeSearchTerm(row.employeeName);
  setIsEditMode(true);
  setEditingRowId(row.id);
  
};

  const resetForm = () => {
    setFormRows([{
      id: Date.now(),
      employeeId: '',
      employeeName: '',
      certificationName: '',
      issuedBy: '',
      certificateNumber: '',
      issueDate: '',
      expiryDate: '',
      reminderDays: 30,
      notes: ''
    }]);
    setEmployeeSearchTerm('');
    setIsEditMode(false);
    setEditingRowId(null);
    setShowForm(false);
    setShowEmployeeDropdown(false);
    setRowErrors({});
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setShowForm(true);
      setFormRows([{
        id: Date.now(),
        employeeId: '',
        employeeName: '',
        certificationName: '',
        issuedBy: '',
        certificateNumber: '',
        issueDate: '',
        expiryDate: '',
        reminderDays: 30,
        notes: ''
      }]);
      setEmployeeSearchTerm('');
      setIsEditMode(false);
      setEditingRowId(null);
      setShowEmployeeDropdown(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const search = employeeSearchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      emp.name.toLowerCase().includes(search) ||
      emp.email.toLowerCase().includes(search) ||
      emp.department.toLowerCase().includes(search)
    );
  });

  const getEmployeeDetails = (employeeId) => {
    return employees.find(e => e.id === employeeId);
  };

  // ── Pagination Logic ──
  const totalItems = certifications.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const currentCertifications = certifications.slice(startIndex, startIndex + rowsPerPage);

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

  return (
    <div style={{ padding: '22px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        .cert-input { 
          padding: 6px 10px; 
          border: 1.5px solid #e2e8f0; 
          border-radius: 6px; 
          font-size: 13px; 
          outline: none; 
          transition: all .2s; 
          width: 100%; 
          min-height: 32px; 
          background: white;
          font-family: inherit;
        }
        .cert-input:focus { 
          border-color: #9d174d; 
          box-shadow: 0 0 0 3px rgba(157,23,77,.10); 
        }
        .cert-input::placeholder { 
          color: #94a3b8; 
        }
        .cert-btn { 
          padding: 6px 16px; 
          border-radius: 6px; 
          border: none; 
          cursor: pointer; 
          font-size: 13px; 
          font-weight: 600; 
          transition: all .2s; 
          font-family: inherit;
        }
        .cert-btn-success { 
          background: #9d174d; 
          color: white; 
        }
        .cert-btn-success:hover { 
          background: #7a0e3a; 
        }
        .cert-btn-danger { 
          background: #dc2626; 
          color: white; 
        }
        .cert-btn-danger:hover { 
          background: #b91c1c; 
        }
        .cert-btn-warning { 
          background: #f59e0b; 
          color: white; 
        }
        .cert-btn-warning:hover { 
          background: #d97706; 
        }
        .cert-btn-cancel { 
          background: #e2e8f0; 
          color: #374151; 
        }
        .cert-btn-cancel:hover { 
          background: #cbd5e1; 
        }
        .cert-row:hover td { 
          background: #f8fafc !important; 
          cursor: pointer; 
        }
        .is-invalid {
          border-color: #ef4444 !important;
        }
        .is-invalid:focus {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
        }
        
        .employee-search-wrapper {
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .employee-search-wrapper .search-label {
          font-size: 12px;
          font-weight: 600;
          color: #9d174d;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .employee-search-wrapper .search-container {
          position: relative;
          flex: 1;
          min-width: 200px;
          max-width: 400px;
        }
        .employee-search-wrapper .search-container .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 13px;
          pointer-events: none;
          z-index: 2;
        }
        .employee-search-wrapper .search-container .cert-input {
          padding-left: 32px;
          background: white;
        }
        .employee-search-wrapper .search-container .cert-input:focus {
          border-color: #9d174d;
        }
        .employee-search-wrapper .selected-employee-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #fdf2f8;
          border: 1.5px solid #9d174d;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #9d174d;
        }
        .employee-search-wrapper .selected-employee-display .emp-code {
          font-size: 11px;
          color: #64748b;
          font-weight: 400;
        }
        
        .cert-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 1.5px solid #9d174d;
          border-radius: 8px;
          max-height: 220px;
          overflow-y: auto;
          z-index: 9999;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          padding: 4px 0;
          min-width: 100%;
        }
        .cert-dropdown::-webkit-scrollbar {
          width: 4px;
        }
        .cert-dropdown::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .cert-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }
        .cert-dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          transition: all .2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .cert-dropdown-item:hover {
          background: #fdf2f8;
        }
        .cert-dropdown-item:last-child {
          border-bottom: none;
        }
        .cert-dropdown-item .emp-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .cert-dropdown-item .emp-name {
          font-weight: 600;
          color: #0f172a;
        }
        .cert-dropdown-item .emp-email {
          font-size: 11px;
          color: #94a3b8;
        }
        .cert-dropdown-item .emp-detail {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .cert-dropdown-item .emp-dept {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 10px;
          border-radius: 12px;
          font-weight: 500;
        }
        .cert-dropdown-item .emp-designation {
          font-size: 11px;
          color: #94a3b8;
        }
        .cert-dropdown-empty {
          padding: 16px 14px;
          color: #64748b;
          text-align: center;
          font-size: 13px;
        }
        
        .form-table td {
          padding: 6px 8px !important;
          vertical-align: middle;
        }
        
        .cert-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
          font-size: 13px;
        }
        .cert-table th {
          padding: 10px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #9d174d;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: #faf5f7;
          border-bottom: 1.5px solid #e2e8f0;
        }
        .cert-table td {
          padding: 11px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .cert-table .cert-row:hover td {
          background: #faf5f7 !important;
          cursor: pointer;
        }
        
        .cert-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          background: #faf5f7;
          border-radius: 0 0 16px 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .cert-pagination .info {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          padding: 10px 10px;
        }
        .cert-pagination .page-group {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
        }
        .cert-pagination .page-btn {
          padding: 6px 12px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all .2s;
          color: #374151;
        }
        .cert-pagination .page-btn:hover:not(:disabled) {
          background: #fdf2f8;
          border-color: #9d174d;
        }
        .cert-pagination .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cert-pagination .page-num {
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          min-width: 34px;
          text-align: center;
          transition: all .2s;
          color: #374151;
        }
        .cert-pagination .page-num:hover:not(.active) {
          background: #fdf2f8;
          border-color: #9d174d;
        }
        .cert-pagination .page-num.active {
          background: #9d174d;
          color: white;
          border-color: #9d174d;
          font-weight: 600;
        }
        .cert-pagination .page-dots {
          padding: 6px 4px;
          color: #6b7280;
          font-size: 14px;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#9d174d,#be185d)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 21 }}>
            <FaFileAlt />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1e293b' }}>Certification Management</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {certifications.length} certificates
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          {!showForm && (
            <button className="cert-btn cert-btn-success" onClick={toggleForm} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}>
              <FaPlus size={13} /> Add Certificate
            </button>
          )}
          {showForm && (
            <button className="cert-btn cert-btn-cancel" onClick={toggleForm} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}>
              <FaArrowLeft size={13} /> Back to list
            </button>
          )}
        </div>
      </div>

      {/* ── FORM SECTION WITH MULTIPLE ROWS ── */}
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #9d174d', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '12px 20px', background: '#faf5f7', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
              {isEditMode ? 'Edit Certificate' : 'Add New Certificate(s)'}
              {!isEditMode && formRows.length > 1 && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280', marginLeft: '8px' }}>({formRows.length} entries)</span>}
            </h4>
            {!isEditMode && (
              <button 
                type="button" 
                onClick={addRow}
                style={{ 
                  padding: '4px 12px', 
                  background: '#9d174d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FaPlus size={11} /> Add Row
              </button>
            )}
          </div>
          
          {/* ── FORM ROWS TABLE ── */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', minWidth: '140px' }}>
                    Employee <span style={{ color: '#ef4444' }}>*</span>
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', minWidth: '130px' }}>
                    Certification <span style={{ color: '#ef4444' }}>*</span>
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', minWidth: '120px' }}>
                    Issued By <span style={{ color: '#ef4444' }}>*</span>
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', minWidth: '100px' }}>
                    Cert No.
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', minWidth: '100px' }}>
                    Issue Date <span style={{ color: '#ef4444' }}>*</span>
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', minWidth: '100px' }}>
                    Expiry Date
                  </th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', width: '70px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {formRows.map((row) => {
                  const employee = getEmployeeDetails(row.employeeId);
                  const rowError = rowErrors[row.id] || {};
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      {/* Employee */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className={`cert-input ${rowError.employeeId ? 'is-invalid' : ''}`}
                            placeholder="Search employee..."
                            value={employee?.name || row.employeeName || ''}
                            onChange={(e) => {
                              setEmployeeSearchTerm(e.target.value);
                              setShowEmployeeDropdown(true);
                            }}
                            onFocus={() => {
                              if (employeeSearchTerm.length > 0) {
                                setShowEmployeeDropdown(true);
                              }
                            }}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          />
                          {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '100%', 
                              left: 0, 
                              right: 0, 
                              background: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '6px', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                              zIndex: 1000, 
                              maxHeight: '180px', 
                              overflow: 'auto',
                              marginTop: '2px'
                            }}>
                              {filteredEmployees.length > 0 ? (
                                filteredEmployees.map(emp => (
                                  <div
                                    key={emp.id}
                                    style={{ 
                                      padding: '6px 10px', 
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f3f4f6',
                                      fontSize: '12px'
                                    }}
                                    onClick={() => handleEmployeeSelect(row.id, emp)}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <div style={{ fontWeight: 500 }}>{emp.name}</div>
                                    <div style={{ fontSize: '10px', color: '#6b7280' }}>{emp.code} | {emp.department}</div>
                                  </div>
                                ))
                              ) : (
                                <div style={{ padding: '8px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                                  No employees found
                                </div>
                              )}
                            </div>
                          )}
                          {rowError.employeeId && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.employeeId}</div>}
                        </div>
                      </td>
                      
                      {/* Certification Name */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                        <input
                          type="text"
                          className={`cert-input ${rowError.certificationName ? 'is-invalid' : ''}`}
                          placeholder="Certification name"
                          value={row.certificationName}
                          onChange={(e) => handleRowChange(row.id, 'certificationName', e.target.value)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        />
                        {rowError.certificationName && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.certificationName}</div>}
                      </td>
                      
                      {/* Issued By */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                        <input
                          type="text"
                          className={`cert-input ${rowError.issuedBy ? 'is-invalid' : ''}`}
                          placeholder="Issuing authority"
                          value={row.issuedBy}
                          onChange={(e) => handleRowChange(row.id, 'issuedBy', e.target.value)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        />
                        {rowError.issuedBy && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.issuedBy}</div>}
                      </td>
                      
                      {/* Certificate Number */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                        <input
                          type="text"
                          className="cert-input"
                          placeholder="Optional"
                          value={row.certificateNumber}
                          onChange={(e) => handleRowChange(row.id, 'certificateNumber', e.target.value)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        />
                      </td>
                      
                      {/* Issue Date */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                        <input
                          type="date"
                          className={`cert-input ${rowError.issueDate ? 'is-invalid' : ''}`}
                          value={row.issueDate}
                          onChange={(e) => handleRowChange(row.id, 'issueDate', e.target.value)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        />
                        {rowError.issueDate && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.issueDate}</div>}
                      </td>
                      
                      {/* Expiry Date */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                        <input
                          type="date"
                          className={`cert-input ${rowError.expiryDate ? 'is-invalid' : ''}`}
                          value={row.expiryDate}
                          min={row.issueDate || undefined}
                          onChange={(e) => handleRowChange(row.id, 'expiryDate', e.target.value)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        />
                        {rowError.expiryDate && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.expiryDate}</div>}
                      </td>
                      
                      {/* Actions */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'top', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {!isEditMode && (
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              title="Remove row"
                              disabled={formRows.length <= 1}
                              style={{ 
                                padding: '4px 8px', 
                                background: formRows.length <= 1 ? '#f3f4f6' : '#fee2e2', 
                                border: 'none', 
                                borderRadius: '4px', 
                                color: formRows.length <= 1 ? '#9ca3af' : '#dc2626',
                                cursor: formRows.length <= 1 ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <FaTrash size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── FORM ACTIONS ── */}
          <div style={{ padding: '12px 20px', background: '#faf5f7', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="cert-btn cert-btn-cancel" onClick={resetForm} style={{ padding: '6px 16px' }}>
              Cancel
            </button>
            <button 
              className="cert-btn cert-btn-success" 
              onClick={handleAddOrUpdate}
              style={{ padding: '6px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FaSave size={12} /> 
              {isEditMode ? 'Update' : `Save ${formRows.length} Certificate(s)`}
            </button>
          </div>
        </div>
      )}

      {/* ── SAVED CERTIFICATES TABLE ── */}
      {!showForm && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
         
          <div style={{ overflowX: 'auto' }}>
            <table className="cert-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Employee</th>
                  <th>Certification</th>
                  <th>Issued By</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCertifications.length > 0 ? (
                  currentCertifications.map((cert, idx) => (
                    <tr key={cert.id} className="cert-row">
                      <td style={{ fontWeight: 600, color: '#9d174d' }}>{startIndex + idx + 1}</td>
                      <td>{cert.employeeName}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{cert.certificationName}</div>
                        {cert.notes && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{cert.notes}</div>}
                      </td>
                      <td>{cert.issuedBy}</td>
                      <td>{formatDate(cert.issueDate)}</td>
                      <td>{formatDate(cert.expiryDate)}</td>
                      <td>
                        <CertStatusBadge expiryDate={cert.expiryDate} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation();    setShowForm(true);   handleTableRowClick(cert); }}
                            style={{ width: 28, height: 28, background: '#fef3c7', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#92400e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit"
                          >
                            <FaEdit size={11} />
                          </button>
                         
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                      <FaFileAlt style={{ fontSize: 36, opacity: .3, marginBottom: 14 }} />
                      <h4 style={{ fontSize: 17, fontWeight: 700, color: '#475569', marginBottom: 6 }}>No certificates saved yet</h4>
                      <p style={{ fontSize: 13 }}>Click "Add Certificate" to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ── */}
          {totalPages > 0 && (
            <div className="cert-pagination">
              <span className="info">
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} certificates
              </span>
              <div className="page-group">
                <button 
                  className="page-btn" 
                  disabled={currentPage === 0} 
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ← Prev
                </button>
                {getPaginationRange().map((pg, i) =>
                  pg === '...' ? (
                    <span key={i} className="page-dots">…</span>
                  ) : (
                    <button 
                      key={pg} 
                      className={`page-num ${pg === currentPage ? 'active' : ''}`} 
                      onClick={() => setCurrentPage(pg)}
                    >
                      {pg + 1}
                    </button>
                  )
                )}
                <button 
                  className="page-btn" 
                  disabled={currentPage + 1 >= totalPages} 
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}