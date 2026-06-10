
import React, { useState } from 'react';
import {
  FaSearch, FaEdit, FaTrash, FaPlus, FaTimes, FaMinus,
  FaArrowLeft, FaSave, FaExclamationCircle, FaClock, FaCheckCircle, FaFileAlt, FaEye, FaUpload, FaFilePdf, FaFileImage
} from 'react-icons/fa';
import { toast } from '../components/Toast';

/* ─── Dummy Data ─── */
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
     certificateFileData: 'https://images.credly.com/images/0e284c3f-5164-4b21-8660-0d84737941bc/aws-certified-solutions-architect-associate.png',
  certificateFileName: 'AWS_Certificate.png'
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
    certificateFileData: null,
    certificateFileName: null
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
    certificateFileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    certificateFileName: 'CSM_Certificate.png'
  },
  {
    id: 4,
    employeeId: 2,
    employeeName: 'Jane Smith',
    certificationName: 'PMP Certification',
    issuedBy: 'PMI',
    certificateNumber: 'PMP-22222',
    issueDate: '2022-01-10',
    expiryDate: '2025-01-09',
    reminderDays: 60,
    notes: 'Project Management Professional',
    certificateFileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    certificateFileName: 'PMP_Certificate.png'
  },
  {
    id: 5,
    employeeId: 3,
    employeeName: 'Mike Johnson',
    certificationName: 'CISSP',
    issuedBy: 'ISC2',
    certificateNumber: 'CISSP-44444',
    issueDate: '2023-11-15',
    expiryDate: '2026-11-14',
    reminderDays: 90,
    notes: 'Security certification',
    certificateFileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    certificateFileName: 'CISSP_Certificate.png'
  },
  {
    id: 6,
    employeeId: 1,
    employeeName: 'John Doe',
    certificationName: 'Google Cloud Professional',
    issuedBy: 'Google',
    certificateNumber: 'GCP-33333',
    issueDate: '2024-05-01',
    expiryDate: '2026-04-30',
    reminderDays: 30,
    notes: '',
    certificateFileData: null,
    certificateFileName: null
  }
];

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const Certifications = ({ user, employeeId: propEmployeeId }) => {
  const [view, setView] = useState('list');
  const [editMode, setEditMode] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState(null);
  const [allCertifications, setAllCertifications] = useState(DUMMY_CERTIFICATIONS);
  const [nextId, setNextId] = useState(7);
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState(propEmployeeId || '');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certToDelete, setCertToDelete] = useState(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalData, setRenewalData] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [certToView, setCertToView] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    certificationName: '',
    issuedBy: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    reminderDays: '30',
    notes: '',
    certificateFile: null,
    certificateFileData: null,
    certificateFileName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getCertStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Never Expires', type: 'never', icon: FaCheckCircle, color: '#10b981' };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return { label: 'Expired', type: 'expired', icon: FaExclamationCircle, color: '#ef4444' };
    if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', type: 'expiring', icon: FaClock, color: '#f59e0b' };
    return { label: 'Active', type: 'active', icon: FaCheckCircle, color: '#10b981' };
  };

  const getEmployeeCertificates = (employeeId) => {
    return allCertifications.filter(cert => cert.employeeId === employeeId);
  };

  const toggleExpand = (employeeId) => {
    setExpandedEmployees(prev => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  const addNewCertificate = (employeeId, employeeName) => {
    const newCert = {
      id: nextId,
      employeeId: employeeId,
      employeeName: employeeName,
      certificationName: 'New Certification',
      issuedBy: '',
      certificateNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      reminderDays: 30,
      notes: '',
      certificateFileData: null,
      certificateFileName: null
    };
    setAllCertifications([...allCertifications, newCert]);
    setNextId(nextId + 1);
    toast.success('Success', 'New certification added. Click Edit to fill details.');
    setExpandedEmployees(prev => ({ ...prev, [employeeId]: true }));
  };

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    if (employeeFilter && emp.id !== parseInt(employeeFilter)) return false;
    const search = searchTerm.toLowerCase();
    if (search && !emp.name.toLowerCase().includes(search) && !emp.email.toLowerCase().includes(search)) return false;
    return true;
  });

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (touched[field]) {
      let error = '';
      if (field === 'issueDate' && !value) error = 'This field is required';
      if (field === 'certificationName' && !value) error = 'This field is required';
      if (field === 'issuedBy' && !value) error = 'This field is required';
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          certificateFile: file,
          certificateFileData: reader.result,
          certificateFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let error = '';
    if (field === 'issueDate' && !formData[field]) error = 'This field is required';
    if (field === 'certificationName' && !formData[field]) error = 'This field is required';
    if (field === 'issuedBy' && !formData[field]) error = 'This field is required';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.certificationName) newErrors.certificationName = 'This field is required';
    if (!formData.issuedBy) newErrors.issuedBy = 'This field is required';
    if (!formData.issueDate) newErrors.issueDate = 'This field is required';
    if (!propEmployeeId && !formData.employeeId) newErrors.employeeId = 'This field is required';
    if (formData.issueDate && formData.expiryDate) {
      if (new Date(formData.expiryDate) <= new Date(formData.issueDate)) {
        newErrors.expiryDate = 'Expiry date must be after issue date';
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
    
    const employeeName = DUMMY_EMPLOYEES.find(e => e.id === parseInt(formData.employeeId))?.name || '';
    
    if (editMode) {
      const updatedCerts = allCertifications.map(cert =>
        cert.id === selectedCertification.id
          ? {
              ...cert,
              employeeId: parseInt(formData.employeeId),
              employeeName: employeeName,
              certificationName: formData.certificationName,
              issuedBy: formData.issuedBy,
              certificateNumber: formData.certificateNumber,
              issueDate: formData.issueDate,
              expiryDate: formData.expiryDate || null,
              reminderDays: parseInt(formData.reminderDays),
              notes: formData.notes,
              certificateFileData: formData.certificateFileData || cert.certificateFileData,
              certificateFileName: formData.certificateFileName || cert.certificateFileName
            }
          : cert
      );
      setAllCertifications(updatedCerts);
      toast.success('Success', 'Certification updated successfully');
    } else {
      const newCert = {
        id: nextId,
        employeeId: propEmployeeId ? parseInt(propEmployeeId) : parseInt(formData.employeeId),
        employeeName: propEmployeeId ? `Employee #${propEmployeeId}` : employeeName,
        certificationName: formData.certificationName,
        issuedBy: formData.issuedBy,
        certificateNumber: formData.certificateNumber || '',
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate || null,
        reminderDays: parseInt(formData.reminderDays) || 30,
        notes: formData.notes || '',
        certificateFileData: formData.certificateFileData || null,
        certificateFileName: formData.certificateFileName || null
      };
      setAllCertifications([...allCertifications, newCert]);
      setNextId(nextId + 1);
      toast.success('Success', 'Certification added successfully');
    }
    resetForm();
    setView('list');
  };

  const handleRenewal = () => {
    if (!renewalData) return;
    const updatedCerts = allCertifications.map(cert =>
      cert.id === renewalData.id
        ? {
            ...cert,
            issueDate: renewalData.newIssueDate,
            expiryDate: renewalData.newExpiryDate || null,
            certificateNumber: renewalData.newCertificateNumber || cert.certificateNumber
          }
        : cert
    );
    setAllCertifications(updatedCerts);
    toast.success('Success', 'Certification renewed successfully');
    setShowRenewalModal(false);
    setRenewalData(null);
  };

  const handleDelete = () => {
    if (!certToDelete) return;
    setAllCertifications(allCertifications.filter(cert => cert.id !== certToDelete.id));
    toast.success('Success', 'Certification deleted');
    setShowDeleteModal(false);
    setCertToDelete(null);
  };

  const handleEdit = (cert) => {
    setSelectedCertification(cert);
    setFormData({
      employeeId: cert.employeeId || '',
      certificationName: cert.certificationName || '',
      issuedBy: cert.issuedBy || '',
      certificateNumber: cert.certificateNumber || '',
      issueDate: cert.issueDate?.split('T')[0] || '',
      expiryDate: cert.expiryDate?.split('T')[0] || '',
      reminderDays: cert.reminderDays?.toString() || '30',
      notes: cert.notes || '',
      certificateFile: null,
      certificateFileData: cert.certificateFileData,
      certificateFileName: cert.certificateFileName
    });
    setErrors({});
    setTouched({});
    setEditMode(true);
    setView('form');
  };

  const openRenewalModal = (cert) => {
    setRenewalData({
      id: cert.id,
      certificationName: cert.certificationName,
      newIssueDate: new Date().toISOString().split('T')[0],
      newExpiryDate: '',
      newCertificateNumber: ''
    });
    setShowRenewalModal(true);
  };

  const openViewModal = (cert) => {
    setCertToView(cert);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      employeeId: propEmployeeId || '',
      certificationName: '',
      issuedBy: '',
      certificateNumber: '',
      issueDate: '',
      expiryDate: '',
      reminderDays: '30',
      notes: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null
    });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedCertification(null);
  };

  const formatDate = (d) => {
    if (!d) return 'Never Expires';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getPaginationRange = () => {
  const delta = 2;
  const range = [];
  const left = Math.max(0, page - delta);
  const right = Math.min(totalPages - 1, page + delta);
  if (left > 0) { 
    range.push(0); 
    if (left > 1) range.push('...'); 
  }
  for (let i = left; i <= right; i++) range.push(i);
  if (right < totalPages - 1) { 
    if (right < totalPages - 2) range.push('...'); 
    range.push(totalPages - 1); 
  }
  return range;
};

  return (
    <div className="cert-root">
      <div className="cert-header">
        {view !== 'list' ? (
          <>
            <div>
              <h1 className="cert-title">{editMode ? 'Edit Certification' : 'Add Certification'}</h1>
              <p className="cert-subtitle">{editMode ? 'Update certification details' : 'Enter new certification information'}</p>
            </div>
            <button className="cert-back-btn" onClick={() => { setView('list'); resetForm(); }}>
              <FaArrowLeft size={12} /> Back to List
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 className="cert-title">Certification Management</h1>
              <p className="cert-subtitle">Manage employee certifications and track expiry</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="cert-add-btn" onClick={() => { resetForm(); setView('form'); }}>
                <FaPlus size={13} /> Add Certification
              </button>
            </div>
          </>
        )}
      </div>

      {view === 'list' ? (
        <>
          <div className="cert-search-bar">
            <div className="cert-search-wrap">
              <FaSearch className="cert-search-icon" size={12} />
              <input
                className="cert-search-input"
                type="text"
                placeholder="Search by employee name or email..."
                value={searchTerm}
                // onChange={(e) => setSearchTerm(e.target.value)}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              />
              {searchTerm && (
                <button className="cert-search-clear" onClick={() => setSearchTerm('')}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
            <div className="cert-filter-group">
              <select 
                className="cert-filter-select" 
                value={employeeFilter} 
                // onChange={(e) => setEmployeeFilter(e.target.value)}
                onChange={(e) => { setEmployeeFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Departments</option>
                <option value="1">IT</option>
                <option value="2">HR</option>
                <option value="3">Sales</option>
                <option value="4">Finance</option>
              </select>
            </div>
          </div>

          <div className="cert-stats">
            <div className="cert-stat-card">
              <FaCheckCircle size={16} color="#10b981" />
              <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'active').length} Active Certs</span>
            </div>
            <div className="cert-stat-card">
              <FaClock size={16} color="#f59e0b" />
              <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'expiring').length} Expiring Soon</span>
            </div>
            <div className="cert-stat-card">
              <FaExclamationCircle size={16} color="#ef4444" />
              <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'expired').length} Expired</span>
            </div>
          </div>

          <div className="cert-table-card">
            <div className="cert-table-wrap" style={{ borderBottom: 'none' }}>
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Total Certs</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? currentEmployees.map((emp) => {
                    const empCerts = getEmployeeCertificates(emp.id);
                    const isExpanded = expandedEmployees[emp.id];
                    const activeCount = empCerts.filter(c => getCertStatus(c.expiryDate).type === 'active').length;
                    const expiringCount = empCerts.filter(c => getCertStatus(c.expiryDate).type === 'expiring').length;
                    const expiredCount = empCerts.filter(c => getCertStatus(c.expiryDate).type === 'expired').length;
                    
                    let statusText = '';
                    let statusColor = {};
                    if (empCerts.length === 0) {
                      statusText = 'No Certificates';
                      statusColor = { background: '#f3f4f6', color: '#6b7280' };
                    } else if (expiringCount > 0) {
                      statusText = `${expiringCount} Expiring Soon`;
                      statusColor = { background: '#fed7aa', color: '#9a3412' };
                    } else if (expiredCount > 0) {
                      statusText = `${expiredCount} Expired`;
                      statusColor = { background: '#fee2e2', color: '#991b1b' };
                    } else {
                      statusText = `${activeCount} Active`;
                      statusColor = { background: '#d1fae5', color: '#065f46' };
                    }

                    return (
                      <React.Fragment key={emp.id}>
                        <tr className="cert-row" style={{ cursor: 'pointer' }} onClick={() => empCerts.length > 0 && toggleExpand(emp.id)}>
                          <td>
                            <div>
                              <strong>{emp.name}</strong>
                              <div style={{ fontSize: '11px', color: '#666' }}>{emp.email}</div>
                            </div>
                          </td>
                          <td>{emp.department}</td>
                          <td>{emp.designation}</td>
                          <td>{empCerts.length}</td>
                          <td>
                            {empCerts.length > 0 ? (
                              <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', ...statusColor }}>
                                {statusText}
                              </span>
                            ) : (
                              <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', background: '#f3f4f6', color: '#6b7280' }}>
                                No Certificates
                              </span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="cert-act cert-act--add"
                              onClick={(e) => { e.stopPropagation(); addNewCertificate(emp.id, emp.name); }}
                              title="Add Certificate"
                              style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              <FaPlus size={20} /> Add
                            </button>
                          </td>
                        </tr>
                        
                        {isExpanded && empCerts.length > 0 && (
                          <tr>
                            <td colSpan="6" style={{ padding: '0 0 20px 40px', background: '#f9fafb' }}>
                              <div style={{ marginTop: '10px' }}>
                                <table className="cert-table" style={{ width: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                  <thead>
                                    <tr style={{ background: '#f3f4f6' }}>
                                      <th style={{ width: 40 }}>#</th>
                                      <th>Certification Name</th>
                                      <th>Issued By</th>
                                      <th>Cert. No.</th>
                                      <th>Issue Date</th>
                                      <th>Expiry Date</th>
                                      <th>Status</th>
                                      <th style={{ width: 100 }}>Actions</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                    {empCerts.map((cert, idx) => {
                                      const status = getCertStatus(cert.expiryDate);
                                      const StatusIcon = status.icon;
                                      return (
                                        <tr key={cert.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                          <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                          <td>
                                            <strong>{cert.certificationName}</strong>
                                            {cert.notes && <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{cert.notes}</div>}
                                          </td>
                                          <td>{cert.issuedBy}</td>
                                          <td>{cert.certificateNumber || '—'}</td>
                                          <td>{formatDate(cert.issueDate)}</td>
                                          <td>{formatDate(cert.expiryDate)}</td>
                                          <td>
                                            <span className={`cert-status-badge cert-status--${status.type}`}>
                                              <StatusIcon size={10} /> {status.label}
                                            </span>
                                          </td>
                                          <td>
                                            {/* <div className="cert-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                              {cert.expiryDate && new Date(cert.expiryDate) > new Date() && (
                                                <button className="cert-act cert-act--renew" onClick={() => openRenewalModal(cert)} title="Renew">
                                                  <FaClock size={12} />
                                                </button>
                                              )}
                                              <button className="cert-act cert-act--edit" onClick={() => handleEdit(cert)} title="Edit">
                                                <FaEdit size={12} />
                                              </button>
                                             
                                            </div> */}
                                            <div className="cert-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
  {/* VIEW BUTTON - Certificate dekhne ke liye */}
  <button 
    onClick={() => openViewModal(cert)} 
    title="View Certificate"
    style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}
  >
    <FaEye size={12} />
  </button>
  {cert.expiryDate && new Date(cert.expiryDate) > new Date() && (
    <button className="cert-act cert-act--renew" onClick={() => openRenewalModal(cert)} title="Renew">
      <FaClock size={12} />
    </button>
  )}
  <button className="cert-act cert-act--edit" onClick={() => handleEdit(cert)} title="Edit">
    <FaEdit size={12} />
  </button>
</div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                           </tr>
                        )}
                      </React.Fragment>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" className="cert-empty">
                        <div className="cert-empty-inner">
                          <span className="cert-empty-icon">📜</span>
                          <p>No employees found</p>
                          <small>Try a different search</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

<div className="cert-table-footer">
  <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} employees
  </div>
  
  {/* Right side - Pagination */}
  {totalPages > 1 && (
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
      ) : (
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Certification Details</div>
              <div className="cert-form-grid-3col">
                {!propEmployeeId && (
                  <div className={`cert-field-compact ${touched.employeeId && errors.employeeId ? 'has-error' : ''}`}>
                    <label className="required">Employee</label>
                    <select value={formData.employeeId} onChange={(e) => handleChange('employeeId', e.target.value)} onBlur={() => handleBlur('employeeId')}>
                      <option value="">Select employee</option>
                      {DUMMY_EMPLOYEES.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                      ))}
                    </select>
                    <FieldError msg={errors.employeeId} />
                  </div>
                )}
                
                <div className={`cert-field-compact ${touched.certificationName && errors.certificationName ? 'has-error' : ''}`}>
                  <label className="required">Certification Name</label>
                  <input type="text" placeholder="e.g., AWS Certified Solutions Architect" value={formData.certificationName} onChange={(e) => handleChange('certificationName', e.target.value)} onBlur={() => handleBlur('certificationName')} />
                  <FieldError msg={errors.certificationName} />
                </div>
                
                <div className={`cert-field-compact ${touched.issuedBy && errors.issuedBy ? 'has-error' : ''}`}>
                  <label className="required">Issuing Authority</label>
                  <input type="text" placeholder="e.g., Amazon Web Services" value={formData.issuedBy} onChange={(e) => handleChange('issuedBy', e.target.value)} onBlur={() => handleBlur('issuedBy')} />
                  <FieldError msg={errors.issuedBy} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Certificate Number</label>
                  <input type="text" placeholder="Optional reference number" value={formData.certificateNumber} onChange={(e) => handleChange('certificateNumber', e.target.value)} />
                </div>
                
                <div className={`cert-field-compact ${touched.issueDate && errors.issueDate ? 'has-error' : ''}`}>
                  <label className="required">Issue Date</label>
                  <input type="date" value={formData.issueDate} onChange={(e) => handleChange('issueDate', e.target.value)} onBlur={() => handleBlur('issueDate')} />
                  <FieldError msg={errors.issueDate} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Expiry Date</label>
                  <input type="date" value={formData.expiryDate} min={formData.issueDate || undefined} onChange={(e) => handleChange('expiryDate', e.target.value)} />
                  <FieldError msg={errors.expiryDate} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Reminder (days before expiry)</label>
                  <input type="number" placeholder="30" value={formData.reminderDays} min="0" max="365" onChange={(e) => handleChange('reminderDays', e.target.value)} />
                  <small style={{ fontSize: '11px', color: '#666' }}>Email notifications sent before expiry</small>
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Upload Certificate (Optional)</label>
                  <div style={{ border: '1px dashed #ccc', borderRadius: '6px', padding: '12px', textAlign: 'center', background: '#f9fafb' }}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="certificate-upload" />
                    <label htmlFor="certificate-upload" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#4f46e5', color: 'white', borderRadius: '6px', fontSize: '13px' }}>
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.certificateFileName && (
                      <div style={{ marginTop: '10px', fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {formData.certificateFileName.endsWith('.pdf') ? <FaFilePdf size={14} /> : <FaFileImage size={14} />}
                        {formData.certificateFileName}
                      </div>
                    )}
                    <small style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '8px' }}>Supported: PDF, JPG, PNG (Max 5MB)</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="cert-divider" />
            
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Additional Information</div>
              <div className={`cert-field-compact`} style={{ gridColumn: 'span 3' }}>
                <label>Notes</label>
                <textarea rows={3} placeholder="Any additional information about this certification..." value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editMode ? 'Update Certification' : 'Add Certification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */} 
      {showDeleteModal && certToDelete && (
        <div className="cert-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cert-modal-icon"><FaTrash size={18} /></div>
            <h3 className="cert-modal-title">Delete Certification</h3>
            <p className="cert-modal-body">You're about to permanently delete <strong>{certToDelete.certificationName}</strong>.</p>
            <p className="cert-modal-warn">This action cannot be undone.</p>
            <div className="cert-modal-actions">
              <button className="cert-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="cert-modal-confirm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      {showRenewalModal && renewalData && (
        <div className="cert-modal-overlay" onClick={() => setShowRenewalModal(false)}>
          <div className="cert-modal cert-renewal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cert-modal-icon" style={{ background: '#fef3c7', color: '#d97706' }}><FaClock size={18} /></div>
            <h3 className="cert-modal-title">Renew Certification</h3>
            <p className="cert-modal-body">Renewing: <strong>{renewalData.certificationName}</strong></p>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div className="cert-field-compact"><label className="required">New Issue Date</label><input type="date" value={renewalData.newIssueDate} onChange={(e) => setRenewalData({ ...renewalData, newIssueDate: e.target.value })} /></div>
              <div className="cert-field-compact"><label>New Expiry Date</label><input type="date" value={renewalData.newExpiryDate} min={renewalData.newIssueDate} onChange={(e) => setRenewalData({ ...renewalData, newExpiryDate: e.target.value })} /></div>
              <div className="cert-field-compact"><label>New Certificate Number (Optional)</label><input type="text" value={renewalData.newCertificateNumber} onChange={(e) => setRenewalData({ ...renewalData, newCertificateNumber: e.target.value })} /></div>
            </div>
            <div className="cert-modal-actions">
              <button className="cert-modal-cancel" onClick={() => setShowRenewalModal(false)}>Cancel</button>
              <button className="cert-modal-confirm renew" onClick={handleRenewal}>Confirm Renewal</button>
            </div>
          </div>
        </div>
      )}

      {/* View Certificate Modal */}
      {/* {showViewModal && certToView && (
        <div className="cert-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="cert-modal cert-view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', width: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="cert-modal-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><FaFileAlt size={18} /></div>
            <h3 className="cert-modal-title">Certificate Document</h3>
            <p className="cert-modal-body" style={{ textAlign: 'center' }}><strong>{certToView.certificationName}</strong><br />{certToView.employeeName}</p>
            <div style={{ margin: '20px 0', padding: '20px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {certToView.certificateFileData ? (
                certToView.certificateFileData.startsWith('data:image') ? (
                  <div><img src={certToView.certificateFileData} alt="Certificate" style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '4px', objectFit: 'contain' }} /><p style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>File: {certToView.certificateFileName}</p></div>
                ) : certToView.certificateFileData.startsWith('data:application/pdf') ? (
                  <div style={{ textAlign: 'center', width: '100%' }}><FaFilePdf size={80} color="#ef4444" /><p style={{ marginTop: '16px', marginBottom: '16px' }}>{certToView.certificateFileName || 'Certificate.pdf'}</p><iframe src={certToView.certificateFileData} title="Certificate PDF" style={{ width: '100%', height: '500px', border: 'none', borderRadius: '4px' }} /></div>
                ) : (
                  <div><FaFileAlt size={80} color="#4f46e5" /><p style={{ marginTop: '16px' }}>{certToView.certificateFileName}</p><p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>Certificate file is available</p></div>
                )
              ) : (
                <div><FaFileAlt size={64} /><p style={{ marginTop: '16px' }}>No certificate uploaded</p><p style={{ fontSize: '12px', marginTop: '8px' }}>Click Edit to upload a certificate</p></div>
              )}
            </div>
            <div className="cert-modal-actions">
              <button className="cert-modal-cancel" onClick={() => setShowViewModal(false)}>Close</button>
              {certToView.certificateFileData && <a href={certToView.certificateFileData} download={certToView.certificateFileName || 'certificate'} style={{ padding: '8px 16px', background: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaUpload size={12} /> Download</a>}
            </div>
          </div>
        </div>
      )} */}
     {/* View Certificate Modal */}
{showViewModal && certToView && (
  <div className="cert-modal-overlay" onClick={() => setShowViewModal(false)}>
    <div className="cert-modal cert-view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', width: '800px', maxHeight: '90vh', overflow: 'auto' }}>
      <div className="cert-modal-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><FaFileAlt size={18} /></div>
      <h3 className="cert-modal-title">Certificate Document</h3>
      <p className="cert-modal-body" style={{ textAlign: 'center' }}><strong>{certToView.certificationName}</strong><br />{certToView.employeeName}</p>
      <div style={{ margin: '20px 0', padding: '20px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* SAFE CHECK - certToView aur uski property dono check karo */}
        {certToView && certToView.certificateFileData ? (
          (certToView.certificateFileData.startsWith('data:image') || 
           certToView.certificateFileData.startsWith('https://')) ? (
            <div>
              <img 
                src={certToView.certificateFileData} 
                alt="Certificate" 
                style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '4px', objectFit: 'contain' }} 
              />
              <p style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>File: {certToView.certificateFileName || 'Certificate'}</p>
            </div>
          ) : certToView.certificateFileData.startsWith('data:application/pdf') ? (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <FaFilePdf size={80} color="#ef4444" />
              <p style={{ marginTop: '16px', marginBottom: '16px' }}>{certToView.certificateFileName || 'Certificate.pdf'}</p>
              <iframe src={certToView.certificateFileData} title="Certificate PDF" style={{ width: '100%', height: '500px', border: 'none', borderRadius: '4px' }} />
            </div>
          ) : (
            <div>
              <FaFileAlt size={80} color="#4f46e5" />
              <p style={{ marginTop: '16px' }}>{certToView.certificateFileName || 'Certificate'}</p>
              <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>Certificate file is available</p>
            </div>
          )
        ) : (
          <div>
            <FaFileAlt size={64} />
            <p style={{ marginTop: '16px' }}>No certificate uploaded</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>Click Edit to upload a certificate</p>
          </div>
        )}
      </div>
      <div className="cert-modal-actions">
        <button className="cert-modal-cancel" onClick={() => setShowViewModal(false)}>Close</button>
        {certToView && certToView.certificateFileData && (
          <a 
            href={certToView.certificateFileData} 
            download={certToView.certificateFileName || 'certificate'} 
            style={{ padding: '8px 16px', background: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FaUpload size={12} /> Download
          </a>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Certifications;