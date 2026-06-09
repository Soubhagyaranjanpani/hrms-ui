
// // import React, { useState, useEffect, useCallback } from 'react';
// // import {
// //   FaSearch, FaEdit, FaTrash, FaPlus, FaTimes,
// //   FaArrowLeft, FaSave, FaExclamationCircle, FaClock, FaCheckCircle, FaFileAlt
// // } from 'react-icons/fa';
// // import { toast } from '../components/Toast';
// // import LoadingSpinner from '../components/LoadingSpinner';
// // import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
// // import axios from 'axios';

// // /* ─── Validation Rules ─── */
// // const RULES = {
// //   certificationName: {
// //     required: true,
// //     minLen: 2,
// //     maxLen: 100,
// //     pattern: /^[a-zA-Z0-9\s\-&,.'()]+$/,
// //     patternMsg: 'Valid characters: letters, numbers, spaces, and -&,.\'()'
// //   },
// //   issuedBy: {
// //     required: true,
// //     minLen: 2,
// //     maxLen: 100
// //   },
// //   certificateNumber: {
// //     required: false,
// //     maxLen: 50
// //   },
// //   issueDate: {
// //     required: true
// //   },
// //   expiryDate: {
// //     required: false
// //   },
// //   reminderDays: {
// //     required: false,
// //     min: 0,
// //     max: 365
// //   }
// // };

// // const validate = (field, value) => {
// //   const r = RULES[field];
// //   if (!r) return '';
  
// //   const v = typeof value === 'string' ? value.trim() : String(value ?? '').trim();

// //   if (r.required && !v) return 'This field is required';
// //   if (!v && !r.required) return '';

// //   if (r.minLen && v.length < r.minLen) return `Minimum ${r.minLen} characters required`;
// //   if (r.maxLen && v.length > r.maxLen) return `Maximum ${r.maxLen} characters allowed`;
// //   if (r.pattern && !r.pattern.test(v)) return r.patternMsg;
// //   if (r.min !== undefined && parseInt(v) < r.min) return `Minimum value is ${r.min}`;
// //   if (r.max !== undefined && parseInt(v) > r.max) return `Maximum value is ${r.max}`;
// //   return '';
// // };

// // const FieldError = ({ msg }) =>
// //   msg ? (
// //     <span className="field-err">
// //       <FaExclamationCircle size={10} /> {msg}
// //     </span>
// //   ) : null;

// // const Certifications = ({ user, employeeId: propEmployeeId }) => {
// //   // View state
// //   const [view, setView] = useState('list');
// //   const [editMode, setEditMode] = useState(false);
// //   const [selectedCertification, setSelectedCertification] = useState(null);
  
// //   // Data states
// //   const [allCertifications, setAllCertifications] = useState([]);
// //   const [employees, setEmployees] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [submitting, setSubmitting] = useState(false);
  
// //   // Filter states
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [statusFilter, setStatusFilter] = useState('all');
// //   const [employeeFilter, setEmployeeFilter] = useState(propEmployeeId || '');
  
// //   // Pagination
// //   const [page, setPage] = useState(0);
// //   const [rowsPerPage] = useState(5);
  
// //   // Modal states
// //   const [showDeleteModal, setShowDeleteModal] = useState(false);
// //   const [certToDelete, setCertToDelete] = useState(null);
// //   const [showRenewalModal, setShowRenewalModal] = useState(false);
// //   const [renewalData, setRenewalData] = useState(null);
  
// //   // Form data
// //   const [formData, setFormData] = useState({
// //     employeeId: '',
// //     certificationName: '',
// //     issuedBy: '',
// //     certificateNumber: '',
// //     issueDate: '',
// //     expiryDate: '',
// //     reminderDays: '30',
// //     notes: ''
// //   });
// //   const [errors, setErrors] = useState({});
// //   const [touched, setTouched] = useState({});
  
// //   const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
// //   const axiosConfig = {
// //     headers: {
// //       Authorization: `Bearer ${getAuthToken()}`,
// //       'Content-Type': 'application/json'
// //     }
// //   };
  
// //   // Helper: Get certification status
// //   const getCertStatus = (expiryDate) => {
// //     if (!expiryDate) return { label: 'Never Expires', type: 'never', icon: FaCheckCircle, color: '#10b981' };
    
// //     const today = new Date();
// //     const expiry = new Date(expiryDate);
// //     const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
// //     if (daysUntilExpiry < 0) return { label: 'Expired', type: 'expired', icon: FaExclamationCircle, color: '#ef4444' };
// //     if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', type: 'expiring', icon: FaClock, color: '#f59e0b' };
// //     return { label: 'Active', type: 'active', icon: FaCheckCircle, color: '#10b981' };
// //   };
  
// //   // ──────────────── API CALLS ────────────────
// //   const fetchCertifications = useCallback(async () => {
// //     setLoading(true);
// //     try {
// //       let url = `${BASE_URL}/api/certifications?page=0&size=1000`;
// //       if (propEmployeeId) {
// //         url = `${BASE_URL}/api/certifications/employee/${propEmployeeId}`;
// //       }
// //       const res = await axios.get(url, axiosConfig);
// //       if (res.data?.status === 200) {
// //         setAllCertifications(res.data.response?.content || res.data.response || []);
// //       } else {
// //         setAllCertifications([]);
// //       }
// //     } catch (err) {
// //       toast.error('Error', err.response?.data?.message || 'Failed to fetch certifications');
// //       setAllCertifications([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [propEmployeeId]);
  
// //   const fetchEmployees = async () => {
// //     try {
// //       const res = await axios.get(`${BASE_URL}/api/employees?page=0&size=1000`, axiosConfig);
// //       if (res.data?.status === 200 && res.data?.response?.content) {
// //         setEmployees(res.data.response.content);
// //       }
// //     } catch (err) {
// //       console.error('Failed to fetch employees');
// //     }
// //   };
  
// //   useEffect(() => {
// //     fetchCertifications();
// //     if (!propEmployeeId) fetchEmployees();
// //   }, []);
  
// //   // ──────────────── FILTERING & PAGINATION ────────────────
// //   const filteredCerts = allCertifications.filter(cert => {
// //     const search = searchTerm.toLowerCase().trim();
// //     const matchesSearch = !search || 
// //       cert.certificationName?.toLowerCase().includes(search) ||
// //       cert.issuedBy?.toLowerCase().includes(search) ||
// //       cert.certificateNumber?.toLowerCase().includes(search) ||
// //       cert.employeeName?.toLowerCase().includes(search);
    
// //     let matchesStatus = true;
// //     if (statusFilter !== 'all') {
// //       const status = getCertStatus(cert.expiryDate).type;
// //       matchesStatus = status === statusFilter;
// //     }
    
// //     const matchesEmployee = !employeeFilter || cert.employeeId === parseInt(employeeFilter);
    
// //     return matchesSearch && matchesStatus && matchesEmployee;
// //   });
  
// //   useEffect(() => {
// //     setPage(0);
// //   }, [searchTerm, statusFilter, employeeFilter]);
  
// //   const totalItems = filteredCerts.length;
// //   const totalPages = Math.ceil(totalItems / rowsPerPage);
// //   const startIndex = page * rowsPerPage;
// //   const currentCertifications = filteredCerts.slice(startIndex, startIndex + rowsPerPage);
  
// //   // ──────────────── FORM HANDLERS ────────────────
// //   const handleChange = (field, value) => {
// //     const updated = { ...formData, [field]: value };
// //     setFormData(updated);
// //     if (touched[field]) {
// //       setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
// //     }
// //   };
  
// //   const handleBlur = (field) => {
// //     setTouched(prev => ({ ...prev, [field]: true }));
// //     setErrors(prev => ({ ...prev, [field]: validate(field, formData[field]) }));
// //   };
  
// //   const validateForm = () => {
// //     const fields = ['certificationName', 'issuedBy', 'issueDate'];
// //     if (!propEmployeeId) fields.push('employeeId');
// //     const newErrors = {};
// //     fields.forEach(f => {
// //       const err = validate(f, formData[f]);
// //       if (err) newErrors[f] = err;
// //     });
    
// //     if (formData.issueDate && formData.expiryDate) {
// //       if (new Date(formData.expiryDate) <= new Date(formData.issueDate)) {
// //         newErrors.expiryDate = 'Expiry date must be after issue date';
// //       }
// //     }
    
// //     setErrors(newErrors);
// //     return Object.keys(newErrors).length === 0;
// //   };
  
// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     if (!validateForm()) {
// //       toast.warning('Validation Error', 'Please fix the highlighted fields');
// //       return;
// //     }
    
// //     setSubmitting(true);
    
// //     try {
// //       const payload = {
// //         employeeId: propEmployeeId ? parseInt(propEmployeeId) : parseInt(formData.employeeId),
// //         certificationName: formData.certificationName.trim(),
// //         issuedBy: formData.issuedBy.trim(),
// //         certificateNumber: formData.certificateNumber?.trim() || null,
// //         issueDate: formData.issueDate,
// //         expiryDate: formData.expiryDate || null,
// //         reminderDays: parseInt(formData.reminderDays) || 30,
// //         notes: formData.notes?.trim() || null
// //       };
      
// //       if (editMode) {
// //         await axios.put(
// //           `${BASE_URL}/api/certifications/${selectedCertification.id}`,
// //           payload,
// //           axiosConfig
// //         );
// //         toast.success('Success', 'Certification updated successfully');
// //       } else {
// //         await axios.post(`${BASE_URL}/api/certifications`, payload, axiosConfig);
// //         toast.success('Success', 'Certification added successfully');
// //       }
      
// //       resetForm();
// //       setView('list');
// //       fetchCertifications();
// //     } catch (err) {
// //       toast.error('Error', err.response?.data?.message || 'Something went wrong');
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };
  
// //   const handleRenewal = async () => {
// //     if (!renewalData) return;
    
// //     setSubmitting(true);
// //     try {
// //       await axios.put(
// //         `${BASE_URL}/api/certifications/${renewalData.id}/renew`,
// //         {
// //           newIssueDate: renewalData.newIssueDate,
// //           newExpiryDate: renewalData.newExpiryDate,
// //           newCertificateNumber: renewalData.newCertificateNumber
// //         },
// //         axiosConfig
// //       );
// //       toast.success('Success', 'Certification renewed successfully');
// //       setShowRenewalModal(false);
// //       setRenewalData(null);
// //       fetchCertifications();
// //     } catch (err) {
// //       toast.error('Error', err.response?.data?.message || 'Renewal failed');
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };
  
// //   const handleDelete = async () => {
// //     if (!certToDelete) return;
// //     try {
// //       await axios.delete(`${BASE_URL}/api/certifications/${certToDelete.id}`, axiosConfig);
// //       toast.success('Success', 'Certification deleted');
// //       setShowDeleteModal(false);
// //       setCertToDelete(null);
// //       fetchCertifications();
// //     } catch (err) {
// //       toast.error('Error', err.response?.data?.message || 'Failed to delete');
// //     }
// //   };
  
// //   const handleEdit = (cert) => {
// //     setSelectedCertification(cert);
// //     setFormData({
// //       employeeId: cert.employeeId || '',
// //       certificationName: cert.certificationName || '',
// //       issuedBy: cert.issuedBy || '',
// //       certificateNumber: cert.certificateNumber || '',
// //       issueDate: cert.issueDate?.split('T')[0] || '',
// //       expiryDate: cert.expiryDate?.split('T')[0] || '',
// //       reminderDays: cert.reminderDays?.toString() || '30',
// //       notes: cert.notes || ''
// //     });
// //     setErrors({});
// //     setTouched({});
// //     setEditMode(true);
// //     setView('form');
// //   };
  
// //   const openRenewalModal = (cert) => {
// //     setRenewalData({
// //       id: cert.id,
// //       certificationName: cert.certificationName,
// //       newIssueDate: new Date().toISOString().split('T')[0],
// //       newExpiryDate: '',
// //       newCertificateNumber: ''
// //     });
// //     setShowRenewalModal(true);
// //   };
  
// //   const resetForm = () => {
// //     setFormData({
// //       employeeId: propEmployeeId || '',
// //       certificationName: '',
// //       issuedBy: '',
// //       certificateNumber: '',
// //       issueDate: '',
// //       expiryDate: '',
// //       reminderDays: '30',
// //       notes: ''
// //     });
// //     setErrors({});
// //     setTouched({});
// //     setEditMode(false);
// //     setSelectedCertification(null);
// //   };
  
// //   const getEmployeeName = (empId) => {
// //     const emp = employees.find(e => e.id === empId);
// //     return emp?.name || `Employee #${empId}`;
// //   };
  
// //   const formatDate = (d) => {
// //     if (!d) return 'Never Expires';
// //     return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
// //   };
  
// //   const getPaginationRange = () => {
// //     const delta = 2;
// //     const range = [];
// //     const left = Math.max(0, page - delta);
// //     const right = Math.min(totalPages - 1, page + delta);
// //     if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
// //     for (let i = left; i <= right; i++) range.push(i);
// //     if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
// //     return range;
// //   };
  
// //   if (loading && view === 'list' && allCertifications.length === 0) {
// //     return <LoadingSpinner message="Loading certifications..." />;
// //   }
  
// //   return (
// //     <div className="cert-root">
// //       {/* Header */}
// //       <div className="cert-header" style={{ justifyContent: view !== 'list' ? 'space-between' : 'space-between', flexWrap: 'wrap', gap: '12px' }}>
// //         {view !== 'list' ? (
// //           <>
// //             <div>
// //               <h1 className="cert-title">{editMode ? 'Edit Certification' : 'Add Certification'}</h1>
// //               <p className="cert-subtitle">{editMode ? 'Update certification details' : 'Enter new certification information'}</p>
// //             </div>
// //             <button className="cert-back-btn" onClick={() => { setView('list'); resetForm(); }}>
// //               <FaArrowLeft size={12} /> Back to List
// //             </button>
// //           </>
// //         ) : (
// //           <>
// //             <div>
// //               <h1 className="cert-title">Certification Management</h1>
// //               <p className="cert-subtitle">
// //                 {propEmployeeId 
// //                   ? `Manage certifications for ${getEmployeeName(propEmployeeId)}`
// //                   : `${totalItems} total certifications tracked`}
// //               </p>
// //             </div>
// //             <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
// //               <button className="cert-add-btn" onClick={() => { resetForm(); setView('form'); }}>
// //                 <FaPlus size={13} /> Add Certification
// //               </button>
// //             </div>
// //           </>
// //         )}
// //       </div>
      
// //       {view === 'list' ? (
// //         <>
// //           {/* Filters */}
// //           <div className="cert-search-bar">
// //             <div className="cert-search-wrap">
// //               <FaSearch className="cert-search-icon" size={12} />
// //               <input
// //                 className="cert-search-input"
// //                 type="text"
// //                 placeholder="Search by certification, issuer, or employee..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //               />
// //               {searchTerm && (
// //                 <button className="cert-search-clear" onClick={() => setSearchTerm('')}>
// //                   <FaTimes size={11} />
// //                 </button>
// //               )}
// //             </div>
            
// //             <div className="cert-filter-group">
// //               <select 
// //                 className="cert-filter-select" 
// //                 value={statusFilter} 
// //                 onChange={(e) => setStatusFilter(e.target.value)}
// //               >
// //                 <option value="all">All Status</option>
// //                 <option value="active">Active</option>
// //                 <option value="expiring">Expiring Soon (≤30 days)</option>
// //                 <option value="expired">Expired</option>
// //               </select>
              
// //               {!propEmployeeId && (
// //                 <select 
// //                   className="cert-filter-select" 
// //                   value={employeeFilter} 
// //                   onChange={(e) => setEmployeeFilter(e.target.value)}
// //                 >
// //                   <option value="">All Employees</option>
// //                   {employees.slice(0, 50).map(emp => (
// //                     <option key={emp.id} value={emp.id}>{emp.name}</option>
// //                   ))}
// //                 </select>
// //               )}
// //             </div>
// //           </div>
          
// //           {/* Stats Summary */}
// //           <div className="cert-stats">
// //             <div className="cert-stat-card">
// //               <FaCheckCircle size={16} color="#10b981" />
// //               <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'active').length} Active</span>
// //             </div>
// //             <div className="cert-stat-card">
// //               <FaClock size={16} color="#f59e0b" />
// //               <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'expiring').length} Expiring Soon</span>
// //             </div>
// //             <div className="cert-stat-card">
// //               <FaExclamationCircle size={16} color="#ef4444" />
// //               <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'expired').length} Expired</span>
// //             </div>
// //           </div>
          
// //           {/* Table */}
// //           <div className="cert-table-card">
// //             <div className="cert-table-wrap">
// //               <table className="cert-table">
// //                 <thead>
// //                   <tr>
// //                     <th style={{ width: 44 }}>#</th>
// //                     <th>Certification</th>
// //                     {!propEmployeeId && <th>Employee</th>}
// //                     <th>Issued By</th>
// //                     <th>Cert. No.</th>
// //                     <th>Issue Date</th>
// //                     <th>Expiry Date</th>
// //                     <th>Status</th>
// //                     <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {currentCertifications.length > 0 ? currentCertifications.map((cert, idx) => {
// //                     const status = getCertStatus(cert.expiryDate);
// //                     const StatusIcon = status.icon;
// //                     return (
// //                       <tr key={cert.id} className="cert-row">
// //                         <td className="cert-sno">{startIndex + idx + 1}</td>
// //                         <td>
// //                           <div className="cert-info-cell">
// //                             <div className="cert-avatar" style={{ background: '#ede9fe', color: '#5b21b6' }}>
// //                               <FaFileAlt size={14} />
// //                             </div>
// //                             <div>
// //                               <div className="cert-name">{cert.certificationName}</div>
// //                               {cert.notes && <div className="cert-notes">{cert.notes.slice(0, 40)}</div>}
// //                             </div>
// //                           </div>
// //                         </td>
// //                         {!propEmployeeId && (
// //                           <td className="cert-employee">{cert.employeeName || getEmployeeName(cert.employeeId)}</td>
// //                         )}
// //                         <td className="cert-issuer">{cert.issuedBy}</td>
// //                         <td className="cert-number">{cert.certificateNumber || '—'}</td>
// //                         <td className="cert-date">{formatDate(cert.issueDate)}</td>
// //                         <td className="cert-date">{formatDate(cert.expiryDate)}</td>
// //                         <td>
// //                           <span className={`cert-status-badge cert-status--${status.type}`}>
// //                             <StatusIcon size={10} /> {status.label}
// //                           </span>
// //                         </td>
// //                         <td>
// //                           <div className="cert-actions">
// //                             {cert.expiryDate && new Date(cert.expiryDate) > new Date() && (
// //                               <button 
// //                                 className="cert-act cert-act--renew" 
// //                                 onClick={() => openRenewalModal(cert)} 
// //                                 title="Renew"
// //                               >
// //                                 <FaClock size={12} />
// //                               </button>
// //                             )}
// //                             <button className="cert-act cert-act--edit" onClick={() => handleEdit(cert)} title="Edit">
// //                               <FaEdit size={12} />
// //                             </button>
// //                             <button className="cert-act cert-act--del" onClick={() => { setCertToDelete(cert); setShowDeleteModal(true); }} title="Delete">
// //                               <FaTrash size={12} />
// //                             </button>
// //                           </div>
// //                         </td>
// //                       </tr>
// //                     );
// //                   }) : (
// //                     <tr>
// //                       <td colSpan={!propEmployeeId ? 9 : 8} className="cert-empty">
// //                         <div className="cert-empty-inner">
// //                           <span className="cert-empty-icon">📜</span>
// //                           <p>No certifications found</p>
// //                           <small>Add a certification or adjust your filters</small>
// //                         </div>
// //                       </td>
// //                     </tr>
// //                   )}
// //                 </tbody>
// //               </table>
// //             </div>
            
// //             {/* Pagination */}
// //             {totalPages > 1 && (
// //               <div className="cert-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
// //                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
// //                   <span className="cert-page-info">
// //                     Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} certifications
// //                   </span>
// //                 </div>
// //                 <div className="cert-page-controls">
// //                   <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
// //                   {getPaginationRange().map((pg, i) =>
// //                     pg === '...' ? (
// //                       <span key={`dots-${i}`} className="cert-page-dots">…</span>
// //                     ) : (
// //                       <button key={pg} className={`cert-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
// //                         {pg + 1}
// //                       </button>
// //                     )
// //                   )}
// //                   <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         </>
// //       ) : (
// //         /* Form View */
// //         <div className="cert-form-wrap">
// //           <form onSubmit={handleSubmit} className="cert-form-compact">
// //             {/* Certification Details */}
// //             <div className="cert-form-section-compact">
// //               <div className="cert-section-label">Certification Details</div>
// //               <div className="cert-form-grid-3col">
// //                 {!propEmployeeId && (
// //                   <div className={`cert-field-compact ${touched.employeeId && errors.employeeId ? 'has-error' : ''}`}>
// //                     <label className="required">Employee</label>
// //                     <select
// //                       value={formData.employeeId}
// //                       onChange={(e) => handleChange('employeeId', e.target.value)}
// //                       onBlur={() => handleBlur('employeeId')}
// //                     >
// //                       <option value="">Select employee</option>
// //                       {employees.map(emp => (
// //                         <option key={emp.id} value={emp.id}>{emp.name}</option>
// //                       ))}
// //                     </select>
// //                     <FieldError msg={errors.employeeId} />
// //                   </div>
// //                 )}
                
// //                 <div className={`cert-field-compact ${touched.certificationName && errors.certificationName ? 'has-error' : ''}`}>
// //                   <label className="required">Certification Name</label>
// //                   <input
// //                     type="text"
// //                     placeholder="e.g., AWS Certified Solutions Architect"
// //                     value={formData.certificationName}
// //                     maxLength={100}
// //                     onChange={(e) => handleChange('certificationName', e.target.value)}
// //                     onBlur={() => handleBlur('certificationName')}
// //                   />
// //                   <FieldError msg={errors.certificationName} />
// //                 </div>
                
// //                 <div className={`cert-field-compact ${touched.issuedBy && errors.issuedBy ? 'has-error' : ''}`}>
// //                   <label className="required">Issuing Authority</label>
// //                   <input
// //                     type="text"
// //                     placeholder="e.g., Amazon Web Services"
// //                     value={formData.issuedBy}
// //                     maxLength={100}
// //                     onChange={(e) => handleChange('issuedBy', e.target.value)}
// //                     onBlur={() => handleBlur('issuedBy')}
// //                   />
// //                   <FieldError msg={errors.issuedBy} />
// //                 </div>
                
// //                 <div className="cert-field-compact">
// //                   <label>Certificate Number</label>
// //                   <input
// //                     type="text"
// //                     placeholder="Optional reference number"
// //                     value={formData.certificateNumber}
// //                     maxLength={50}
// //                     onChange={(e) => handleChange('certificateNumber', e.target.value)}
// //                   />
// //                 </div>
                
// //                 <div className={`cert-field-compact ${touched.issueDate && errors.issueDate ? 'has-error' : ''}`}>
// //                   <label className="required">Issue Date</label>
// //                   <input
// //                     type="date"
// //                     value={formData.issueDate}
// //                     max={new Date().toISOString().split('T')[0]}
// //                     onChange={(e) => handleChange('issueDate', e.target.value)}
// //                     onBlur={() => handleBlur('issueDate')}
// //                   />
// //                   <FieldError msg={errors.issueDate} />
// //                 </div>
                
// //                 <div className="cert-field-compact">
// //                   <label>Expiry Date</label>
// //                   <input
// //                     type="date"
// //                     value={formData.expiryDate}
// //                     min={formData.issueDate || undefined}
// //                     onChange={(e) => handleChange('expiryDate', e.target.value)}
// //                   />
// //                   <FieldError msg={errors.expiryDate} />
// //                 </div>
                
// //                 <div className="cert-field-compact">
// //                   <label>Reminder (days before expiry)</label>
// //                   <input
// //                     type="number"
// //                     placeholder="30"
// //                     value={formData.reminderDays}
// //                     min="0"
// //                     max="365"
// //                     onChange={(e) => handleChange('reminderDays', e.target.value)}
// //                   />
// //                   <small style={{ fontSize: '11px', color: '#666' }}>Email notifications sent this many days before expiry</small>
// //                 </div>
// //               </div>
// //             </div>
            
// //             <div className="cert-divider" />
            
// //             {/* Additional Info */}
// //             <div className="cert-form-section-compact">
// //               <div className="cert-section-label">Additional Information</div>
// //               <div className={`cert-field-compact`} style={{ gridColumn: 'span 3' }}>
// //                 <label>Notes</label>
// //                 <textarea
// //                   rows={3}
// //                   placeholder="Any additional information about this certification..."
// //                   value={formData.notes}
// //                   maxLength={500}
// //                   onChange={(e) => handleChange('notes', e.target.value)}
// //                 />
// //               </div>
// //             </div>
            
// //             {/* Form Actions */}
// //             <div className="cert-form-actions">
// //               <button type="button" className="cert-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>
// //                 Cancel
// //               </button>
// //               <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
// //                 {submitting
// //                   ? <><span className="cert-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</>
// //                   : <><FaSave size={12} /> {editMode ? 'Update Certification' : 'Add Certification'}</>
// //                 }
// //               </button>
// //             </div>
// //           </form>
// //         </div>
// //       )}
      
// //       {/* Delete Modal */}
// //       {showDeleteModal && certToDelete && (
// //         <div className="cert-modal-overlay" onClick={() => setShowDeleteModal(false)}>
// //           <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
// //             <div className="cert-modal-icon"><FaTrash size={18} /></div>
// //             <h3 className="cert-modal-title">Delete Certification</h3>
// //             <p className="cert-modal-body">
// //               You're about to permanently delete <strong>{certToDelete.certificationName}</strong>.
// //             </p>
// //             <p className="cert-modal-warn">This action cannot be undone.</p>
// //             <div className="cert-modal-actions">
// //               <button className="cert-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
// //               <button className="cert-modal-confirm" onClick={handleDelete}>Delete</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
      
// //       {/* Renewal Modal */}
// //       {showRenewalModal && renewalData && (
// //         <div className="cert-modal-overlay" onClick={() => !submitting && setShowRenewalModal(false)}>
// //           <div className="cert-modal cert-renewal-modal" onClick={(e) => e.stopPropagation()}>
// //             <div className="cert-modal-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
// //               <FaClock size={18} />
// //             </div>
// //             <h3 className="cert-modal-title">Renew Certification</h3>
// //             <p className="cert-modal-body">
// //               Renewing: <strong>{renewalData.certificationName}</strong>
// //             </p>
            
// //             <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
// //               <div className="cert-field-compact">
// //                 <label className="required">New Issue Date</label>
// //                 <input
// //                   type="date"
// //                   value={renewalData.newIssueDate}
// //                   onChange={(e) => setRenewalData({ ...renewalData, newIssueDate: e.target.value })}
// //                 />
// //               </div>
// //               <div className="cert-field-compact">
// //                 <label>New Expiry Date</label>
// //                 <input
// //                   type="date"
// //                   value={renewalData.newExpiryDate}
// //                   min={renewalData.newIssueDate}
// //                   onChange={(e) => setRenewalData({ ...renewalData, newExpiryDate: e.target.value })}
// //                 />
// //               </div>
// //               <div className="cert-field-compact">
// //                 <label>New Certificate Number (Optional)</label>
// //                 <input
// //                   type="text"
// //                   value={renewalData.newCertificateNumber}
// //                   onChange={(e) => setRenewalData({ ...renewalData, newCertificateNumber: e.target.value })}
// //                 />
// //               </div>
// //             </div>
            
// //             <div className="cert-modal-actions">
// //               <button className="cert-modal-cancel" onClick={() => setShowRenewalModal(false)} disabled={submitting}>Cancel</button>
// //               <button className="cert-modal-confirm renew" onClick={handleRenewal} disabled={submitting}>
// //                 {submitting ? 'Processing...' : 'Confirm Renewal'}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default Certifications;
// import React, { useState } from 'react';
// import {
//   FaSearch, FaEdit, FaTrash, FaPlus, FaTimes,
//   FaArrowLeft, FaSave, FaExclamationCircle, FaClock, FaCheckCircle, FaFileAlt
// } from 'react-icons/fa';
// import { toast } from '../components/Toast';

// /* ─── Dummy Data ─── */
// const DUMMY_CERTIFICATIONS = [
//   {
//     id: 1,
//     employeeId: 1,
//     employeeName: 'John Doe',
//     certificationName: 'AWS Certified Solutions Architect',
//     issuedBy: 'Amazon Web Services',
//     certificateNumber: 'AWS-12345',
//     issueDate: '2024-01-15',
//     expiryDate: '2026-01-14',
//     reminderDays: 30,
//     notes: 'Professional certification'
//   },
//   {
//     id: 2,
//     employeeId: 2,
//     employeeName: 'Jane Smith',
//     certificationName: 'Certified Scrum Master',
//     issuedBy: 'Scrum Alliance',
//     certificateNumber: 'CSM-67890',
//     issueDate: '2023-06-10',
//     expiryDate: '2025-06-09',
//     reminderDays: 30,
//     notes: ''
//   },
//   {
//     id: 3,
//     employeeId: 1,
//     employeeName: 'John Doe',
//     certificationName: 'Microsoft Azure Fundamentals',
//     issuedBy: 'Microsoft',
//     certificateNumber: 'AZ-900-11111',
//     issueDate: '2024-03-20',
//     expiryDate: '2026-03-19',
//     reminderDays: 45,
//     notes: 'Fundamentals certification'
//   },
//   {
//     id: 4,
//     employeeId: 3,
//     employeeName: 'Mike Johnson',
//     certificationName: 'PMP Certification',
//     issuedBy: 'PMI',
//     certificateNumber: 'PMP-22222',
//     issueDate: '2022-01-10',
//     expiryDate: '2025-01-09',
//     reminderDays: 60,
//     notes: 'Project Management Professional'
//   },
//   {
//     id: 5,
//     employeeId: 2,
//     employeeName: 'Jane Smith',
//     certificationName: 'Google Cloud Professional',
//     issuedBy: 'Google',
//     certificateNumber: 'GCP-33333',
//     issueDate: '2024-05-01',
//     expiryDate: '2026-04-30',
//     reminderDays: 30,
//     notes: ''
//   },
//   {
//     id: 6,
//     employeeId: 4,
//     employeeName: 'Sarah Williams',
//     certificationName: 'CISSP',
//     issuedBy: 'ISC2',
//     certificateNumber: 'CISSP-44444',
//     issueDate: '2023-11-15',
//     expiryDate: '2026-11-14',
//     reminderDays: 90,
//     notes: 'Security certification'
//   }
// ];

// const DUMMY_EMPLOYEES = [
//   { id: 1, name: 'John Doe' },
//   { id: 2, name: 'Jane Smith' },
//   { id: 3, name: 'Mike Johnson' },
//   { id: 4, name: 'Sarah Williams' },
//   { id: 5, name: 'David Brown' }
// ];

// const FieldError = ({ msg }) =>
//   msg ? (
//     <span className="field-err">
//       <FaExclamationCircle size={10} /> {msg}
//     </span>
//   ) : null;

// const Certifications = ({ user, employeeId: propEmployeeId }) => {
//   // View state
//   const [view, setView] = useState('list');
//   const [editMode, setEditMode] = useState(false);
//   const [selectedCertification, setSelectedCertification] = useState(null);
  
//   // Data states
//   const [allCertifications, setAllCertifications] = useState(DUMMY_CERTIFICATIONS);
//   const [nextId, setNextId] = useState(7);
  
//   // Filter states
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [employeeFilter, setEmployeeFilter] = useState(propEmployeeId || '');
  
//   // Pagination
//   const [page, setPage] = useState(0);
//   const [rowsPerPage] = useState(5);
  
//   // Modal states
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [certToDelete, setCertToDelete] = useState(null);
//   const [showRenewalModal, setShowRenewalModal] = useState(false);
//   const [renewalData, setRenewalData] = useState(null);
  
//   // Form data
//   const [formData, setFormData] = useState({
//     employeeId: '',
//     certificationName: '',
//     issuedBy: '',
//     certificateNumber: '',
//     issueDate: '',
//     expiryDate: '',
//     reminderDays: '30',
//     notes: ''
//   });
//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
  
//   // Helper: Get certification status
//   const getCertStatus = (expiryDate) => {
//     if (!expiryDate) return { label: 'Never Expires', type: 'never', icon: FaCheckCircle, color: '#10b981' };
    
//     const today = new Date();
//     const expiry = new Date(expiryDate);
//     const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
//     if (daysUntilExpiry < 0) return { label: 'Expired', type: 'expired', icon: FaExclamationCircle, color: '#ef4444' };
//     if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', type: 'expiring', icon: FaClock, color: '#f59e0b' };
//     return { label: 'Active', type: 'active', icon: FaCheckCircle, color: '#10b981' };
//   };
  
//   // ──────────────── FILTERING & PAGINATION ────────────────
//   const filteredCerts = allCertifications.filter(cert => {
//     const search = searchTerm.toLowerCase().trim();
//     const matchesSearch = !search || 
//       cert.certificationName?.toLowerCase().includes(search) ||
//       cert.issuedBy?.toLowerCase().includes(search) ||
//       cert.certificateNumber?.toLowerCase().includes(search) ||
//       cert.employeeName?.toLowerCase().includes(search);
    
//     let matchesStatus = true;
//     if (statusFilter !== 'all') {
//       const status = getCertStatus(cert.expiryDate).type;
//       matchesStatus = status === statusFilter;
//     }
    
//     const matchesEmployee = !employeeFilter || cert.employeeId === parseInt(employeeFilter);
    
//     return matchesSearch && matchesStatus && matchesEmployee;
//   });
  
//   const totalItems = filteredCerts.length;
//   const totalPages = Math.ceil(totalItems / rowsPerPage);
//   const startIndex = page * rowsPerPage;
//   const currentCertifications = filteredCerts.slice(startIndex, startIndex + rowsPerPage);
  
//   // ──────────────── FORM HANDLERS ────────────────
//   const handleChange = (field, value) => {
//     const updated = { ...formData, [field]: value };
//     setFormData(updated);
//     if (touched[field]) {
//       let error = '';
//       if (field === 'issueDate' && !value) error = 'This field is required';
//       if (field === 'certificationName' && !value) error = 'This field is required';
//       if (field === 'issuedBy' && !value) error = 'This field is required';
//       setErrors(prev => ({ ...prev, [field]: error }));
//     }
//   };
  
//   const handleBlur = (field) => {
//     setTouched(prev => ({ ...prev, [field]: true }));
//     let error = '';
//     if (field === 'issueDate' && !formData[field]) error = 'This field is required';
//     if (field === 'certificationName' && !formData[field]) error = 'This field is required';
//     if (field === 'issuedBy' && !formData[field]) error = 'This field is required';
//     setErrors(prev => ({ ...prev, [field]: error }));
//   };
  
//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.certificationName) newErrors.certificationName = 'This field is required';
//     if (!formData.issuedBy) newErrors.issuedBy = 'This field is required';
//     if (!formData.issueDate) newErrors.issueDate = 'This field is required';
//     if (!propEmployeeId && !formData.employeeId) newErrors.employeeId = 'This field is required';
    
//     if (formData.issueDate && formData.expiryDate) {
//       if (new Date(formData.expiryDate) <= new Date(formData.issueDate)) {
//         newErrors.expiryDate = 'Expiry date must be after issue date';
//       }
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };
  
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!validateForm()) {
//       toast.warning('Validation Error', 'Please fix the highlighted fields');
//       return;
//     }
    
//     const employeeName = DUMMY_EMPLOYEES.find(e => e.id === parseInt(formData.employeeId))?.name || '';
    
//     if (editMode) {
//       // Update existing certification
//       const updatedCerts = allCertifications.map(cert =>
//         cert.id === selectedCertification.id
//           ? {
//               ...cert,
//               employeeId: parseInt(formData.employeeId),
//               employeeName: DUMMY_EMPLOYEES.find(e => e.id === parseInt(formData.employeeId))?.name || '',
//               certificationName: formData.certificationName,
//               issuedBy: formData.issuedBy,
//               certificateNumber: formData.certificateNumber,
//               issueDate: formData.issueDate,
//               expiryDate: formData.expiryDate || null,
//               reminderDays: parseInt(formData.reminderDays),
//               notes: formData.notes
//             }
//           : cert
//       );
//       setAllCertifications(updatedCerts);
//       toast.success('Success', 'Certification updated successfully');
//     } else {
//       // Add new certification
//       const newCert = {
//         id: nextId,
//         employeeId: propEmployeeId ? parseInt(propEmployeeId) : parseInt(formData.employeeId),
//         employeeName: propEmployeeId ? `Employee #${propEmployeeId}` : employeeName,
//         certificationName: formData.certificationName,
//         issuedBy: formData.issuedBy,
//         certificateNumber: formData.certificateNumber || '',
//         issueDate: formData.issueDate,
//         expiryDate: formData.expiryDate || null,
//         reminderDays: parseInt(formData.reminderDays) || 30,
//         notes: formData.notes || ''
//       };
//       setAllCertifications([...allCertifications, newCert]);
//       setNextId(nextId + 1);
//       toast.success('Success', 'Certification added successfully');
//     }
    
//     resetForm();
//     setView('list');
//   };
  
//   const handleRenewal = () => {
//     if (!renewalData) return;
    
//     const updatedCerts = allCertifications.map(cert =>
//       cert.id === renewalData.id
//         ? {
//             ...cert,
//             issueDate: renewalData.newIssueDate,
//             expiryDate: renewalData.newExpiryDate || null,
//             certificateNumber: renewalData.newCertificateNumber || cert.certificateNumber
//           }
//         : cert
//     );
//     setAllCertifications(updatedCerts);
//     toast.success('Success', 'Certification renewed successfully');
//     setShowRenewalModal(false);
//     setRenewalData(null);
//   };
  
//   const handleDelete = () => {
//     if (!certToDelete) return;
//     setAllCertifications(allCertifications.filter(cert => cert.id !== certToDelete.id));
//     toast.success('Success', 'Certification deleted');
//     setShowDeleteModal(false);
//     setCertToDelete(null);
//   };
  
//   const handleEdit = (cert) => {
//     setSelectedCertification(cert);
//     setFormData({
//       employeeId: cert.employeeId || '',
//       certificationName: cert.certificationName || '',
//       issuedBy: cert.issuedBy || '',
//       certificateNumber: cert.certificateNumber || '',
//       issueDate: cert.issueDate?.split('T')[0] || '',
//       expiryDate: cert.expiryDate?.split('T')[0] || '',
//       reminderDays: cert.reminderDays?.toString() || '30',
//       notes: cert.notes || ''
//     });
//     setErrors({});
//     setTouched({});
//     setEditMode(true);
//     setView('form');
//   };
  
//   const openRenewalModal = (cert) => {
//     setRenewalData({
//       id: cert.id,
//       certificationName: cert.certificationName,
//       newIssueDate: new Date().toISOString().split('T')[0],
//       newExpiryDate: '',
//       newCertificateNumber: ''
//     });
//     setShowRenewalModal(true);
//   };
  
//   const resetForm = () => {
//     setFormData({
//       employeeId: propEmployeeId || '',
//       certificationName: '',
//       issuedBy: '',
//       certificateNumber: '',
//       issueDate: '',
//       expiryDate: '',
//       reminderDays: '30',
//       notes: ''
//     });
//     setErrors({});
//     setTouched({});
//     setEditMode(false);
//     setSelectedCertification(null);
//   };
  
//   const getEmployeeName = (empId) => {
//     const emp = DUMMY_EMPLOYEES.find(e => e.id === empId);
//     return emp?.name || `Employee #${empId}`;
//   };
  
//   const formatDate = (d) => {
//     if (!d) return 'Never Expires';
//     return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
//   };
  
//   const getPaginationRange = () => {
//     const delta = 2;
//     const range = [];
//     const left = Math.max(0, page - delta);
//     const right = Math.min(totalPages - 1, page + delta);
//     if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
//     for (let i = left; i <= right; i++) range.push(i);
//     if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
//     return range;
//   };
  
//   return (
//     <div className="cert-root">
//       {/* Header */}
//       <div className="cert-header" style={{ justifyContent: view !== 'list' ? 'space-between' : 'space-between', flexWrap: 'wrap', gap: '12px' }}>
//         {view !== 'list' ? (
//           <>
//             <div>
//               <h1 className="cert-title">{editMode ? 'Edit Certification' : 'Add Certification'}</h1>
//               <p className="cert-subtitle">{editMode ? 'Update certification details' : 'Enter new certification information'}</p>
//             </div>
//             <button className="cert-back-btn" onClick={() => { setView('list'); resetForm(); }}>
//               <FaArrowLeft size={12} /> Back to List
//             </button>
//           </>
//         ) : (
//           <>
//             <div>
//               <h1 className="cert-title">Certification Management</h1>
//               <p className="cert-subtitle">
//                 {propEmployeeId 
//                   ? `Manage certifications for ${getEmployeeName(propEmployeeId)}`
//                   : `${totalItems} total certifications tracked`}
//               </p>
//             </div>
//             <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//               <button className="cert-add-btn" onClick={() => { resetForm(); setView('form'); }}>
//                 <FaPlus size={13} /> Add Certification
//               </button>
//             </div>
//           </>
//         )}
//       </div>
      
//       {view === 'list' ? (
//         <>
//           {/* Filters */}
//           <div className="cert-search-bar">
//             <div className="cert-search-wrap">
//               <FaSearch className="cert-search-icon" size={12} />
//               <input
//                 className="cert-search-input"
//                 type="text"
//                 placeholder="Search by certification, issuer, or employee..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               {searchTerm && (
//                 <button className="cert-search-clear" onClick={() => setSearchTerm('')}>
//                   <FaTimes size={11} />
//                 </button>
//               )}
//             </div>
            
//             <div className="cert-filter-group">
//               <select 
//                 className="cert-filter-select" 
//                 value={statusFilter} 
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="all">All Status</option>
//                 <option value="active">Active</option>
//                 <option value="expiring">Expiring Soon (≤30 days)</option>
//                 <option value="expired">Expired</option>
//               </select>
              
//               {!propEmployeeId && (
//                 <select 
//                   className="cert-filter-select" 
//                   value={employeeFilter} 
//                   onChange={(e) => setEmployeeFilter(e.target.value)}
//                 >
//                   <option value="">All Employees</option>
//                   {DUMMY_EMPLOYEES.map(emp => (
//                     <option key={emp.id} value={emp.id}>{emp.name}</option>
//                   ))}
//                 </select>
//               )}
//             </div>
//           </div>
          
//           {/* Stats Summary */}
//           <div className="cert-stats">
//             <div className="cert-stat-card">
//               <FaCheckCircle size={16} color="#10b981" />
//               <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'active').length} Active</span>
//             </div>
//             <div className="cert-stat-card">
//               <FaClock size={16} color="#f59e0b" />
//               <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'expiring').length} Expiring Soon</span>
//             </div>
//             <div className="cert-stat-card">
//               <FaExclamationCircle size={16} color="#ef4444" />
//               <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'expired').length} Expired</span>
//             </div>
//           </div>
          
//           {/* Table */}
//           <div className="cert-table-card">
//             <div className="cert-table-wrap">
//               <table className="cert-table">
//                 <thead>
//                   <tr>
//                     <th style={{ width: 44 }}>#</th>
//                     <th>Certification</th>
//                     {!propEmployeeId && <th>Employee</th>}
//                     <th>Issued By</th>
//                     <th>Cert. No.</th>
//                     <th>Issue Date</th>
//                     <th>Expiry Date</th>
//                     <th>Status</th>
//                     <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {currentCertifications.length > 0 ? currentCertifications.map((cert, idx) => {
//                     const status = getCertStatus(cert.expiryDate);
//                     const StatusIcon = status.icon;
//                     return (
//                       <tr key={cert.id} className="cert-row">
//                         <td className="cert-sno">{startIndex + idx + 1}</td>
//                         <td>
//                           <div className="cert-info-cell">
//                             <div className="cert-avatar" style={{ background: '#ede9fe', color: '#5b21b6' }}>
//                               <FaFileAlt size={14} />
//                             </div>
//                             <div>
//                               <div className="cert-name">{cert.certificationName}</div>
//                               {cert.notes && <div className="cert-notes">{cert.notes.slice(0, 40)}</div>}
//                             </div>
//                           </div>
//                         </td>
//                         {!propEmployeeId && (
//                           <td className="cert-employee">{cert.employeeName}</td>
//                         )}
//                         <td className="cert-issuer">{cert.issuedBy}</td>
//                         <td className="cert-number">{cert.certificateNumber || '—'}</td>
//                         <td className="cert-date">{formatDate(cert.issueDate)}</td>
//                         <td className="cert-date">{formatDate(cert.expiryDate)}</td>
//                         <td>
//                           <span className={`cert-status-badge cert-status--${status.type}`}>
//                             <StatusIcon size={10} /> {status.label}
//                           </span>
//                         </td>
//                         <td>
//                           <div className="cert-actions">
//                             {cert.expiryDate && new Date(cert.expiryDate) > new Date() && (
//                               <button 
//                                 className="cert-act cert-act--renew" 
//                                 onClick={() => openRenewalModal(cert)} 
//                                 title="Renew"
//                               >
//                                 <FaClock size={12} />
//                               </button>
//                             )}
//                             <button className="cert-act cert-act--edit" onClick={() => handleEdit(cert)} title="Edit">
//                               <FaEdit size={12} />
//                             </button>
//                             <button className="cert-act cert-act--del" onClick={() => { setCertToDelete(cert); setShowDeleteModal(true); }} title="Delete">
//                               <FaTrash size={12} />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   }) : (
//                     <tr>
//                       <td colSpan={!propEmployeeId ? 9 : 8} className="cert-empty">
//                         <div className="cert-empty-inner">
//                           <span className="cert-empty-icon">📜</span>
//                           <p>No certifications found</p>
//                           <small>Add a certification or adjust your filters</small>
//                         </div>
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
            
//             {/* Pagination */}
//             {totalPages > 1 && (
//               <div className="cert-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//                   <span className="cert-page-info">
//                     Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} certifications
//                   </span>
//                 </div>
//                 <div className="cert-page-controls">
//                   <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
//                   {getPaginationRange().map((pg, i) =>
//                     pg === '...' ? (
//                       <span key={`dots-${i}`} className="cert-page-dots">…</span>
//                     ) : (
//                       <button key={pg} className={`cert-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
//                         {pg + 1}
//                       </button>
//                     )
//                   )}
//                   <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </>
//       ) : (
//         /* Form View */
//         <div className="cert-form-wrap">
//           <form onSubmit={handleSubmit} className="cert-form-compact">
//             <div className="cert-form-section-compact">
//               <div className="cert-section-label">Certification Details</div>
//               <div className="cert-form-grid-3col">
//                 {!propEmployeeId && (
//                   <div className={`cert-field-compact ${touched.employeeId && errors.employeeId ? 'has-error' : ''}`}>
//                     <label className="required">Employee</label>
//                     <select
//                       value={formData.employeeId}
//                       onChange={(e) => handleChange('employeeId', e.target.value)}
//                       onBlur={() => handleBlur('employeeId')}
//                     >
//                       <option value="">Select employee</option>
//                       {DUMMY_EMPLOYEES.map(emp => (
//                         <option key={emp.id} value={emp.id}>{emp.name}</option>
//                       ))}
//                     </select>
//                     <FieldError msg={errors.employeeId} />
//                   </div>
//                 )}
                
//                 <div className={`cert-field-compact ${touched.certificationName && errors.certificationName ? 'has-error' : ''}`}>
//                   <label className="required">Certification Name</label>
//                   <input
//                     type="text"
//                     placeholder="e.g., AWS Certified Solutions Architect"
//                     value={formData.certificationName}
//                     onChange={(e) => handleChange('certificationName', e.target.value)}
//                     onBlur={() => handleBlur('certificationName')}
//                   />
//                   <FieldError msg={errors.certificationName} />
//                 </div>
                
//                 <div className={`cert-field-compact ${touched.issuedBy && errors.issuedBy ? 'has-error' : ''}`}>
//                   <label className="required">Issuing Authority</label>
//                   <input
//                     type="text"
//                     placeholder="e.g., Amazon Web Services"
//                     value={formData.issuedBy}
//                     onChange={(e) => handleChange('issuedBy', e.target.value)}
//                     onBlur={() => handleBlur('issuedBy')}
//                   />
//                   <FieldError msg={errors.issuedBy} />
//                 </div>
                
//                 <div className="cert-field-compact">
//                   <label>Certificate Number</label>
//                   <input
//                     type="text"
//                     placeholder="Optional reference number"
//                     value={formData.certificateNumber}
//                     onChange={(e) => handleChange('certificateNumber', e.target.value)}
//                   />
//                 </div>
                
//                 <div className={`cert-field-compact ${touched.issueDate && errors.issueDate ? 'has-error' : ''}`}>
//                   <label className="required">Issue Date</label>
//                   <input
//                     type="date"
//                     value={formData.issueDate}
//                     onChange={(e) => handleChange('issueDate', e.target.value)}
//                     onBlur={() => handleBlur('issueDate')}
//                   />
//                   <FieldError msg={errors.issueDate} />
//                 </div>
                
//                 <div className="cert-field-compact">
//                   <label>Expiry Date</label>
//                   <input
//                     type="date"
//                     value={formData.expiryDate}
//                     min={formData.issueDate || undefined}
//                     onChange={(e) => handleChange('expiryDate', e.target.value)}
//                   />
//                   <FieldError msg={errors.expiryDate} />
//                 </div>
                
//                 <div className="cert-field-compact">
//                   <label>Reminder (days before expiry)</label>
//                   <input
//                     type="number"
//                     placeholder="30"
//                     value={formData.reminderDays}
//                     min="0"
//                     max="365"
//                     onChange={(e) => handleChange('reminderDays', e.target.value)}
//                   />
//                   <small style={{ fontSize: '11px', color: '#666' }}>Email notifications sent this many days before expiry</small>
//                 </div>
//               </div>
//             </div>
            
//             <div className="cert-divider" />
            
//             <div className="cert-form-section-compact">
//               <div className="cert-section-label">Additional Information</div>
//               <div className={`cert-field-compact`} style={{ gridColumn: 'span 3' }}>
//                 <label>Notes</label>
//                 <textarea
//                   rows={3}
//                   placeholder="Any additional information about this certification..."
//                   value={formData.notes}
//                   onChange={(e) => handleChange('notes', e.target.value)}
//                 />
//               </div>
//             </div>
            
//             <div className="cert-form-actions">
//               <button type="button" className="cert-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>
//                 Cancel
//               </button>
//               <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
//                 <FaSave size={12} /> {editMode ? 'Update Certification' : 'Add Certification'}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}
      
//       {/* Delete Modal */}
//       {showDeleteModal && certToDelete && (
//         <div className="cert-modal-overlay" onClick={() => setShowDeleteModal(false)}>
//           <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="cert-modal-icon"><FaTrash size={18} /></div>
//             <h3 className="cert-modal-title">Delete Certification</h3>
//             <p className="cert-modal-body">
//               You're about to permanently delete <strong>{certToDelete.certificationName}</strong>.
//             </p>
//             <p className="cert-modal-warn">This action cannot be undone.</p>
//             <div className="cert-modal-actions">
//               <button className="cert-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
//               <button className="cert-modal-confirm" onClick={handleDelete}>Delete</button>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Renewal Modal */}
//       {showRenewalModal && renewalData && (
//         <div className="cert-modal-overlay" onClick={() => !setShowRenewalModal && setShowRenewalModal(false)}>
//           <div className="cert-modal cert-renewal-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="cert-modal-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
//               <FaClock size={18} />
//             </div>
//             <h3 className="cert-modal-title">Renew Certification</h3>
//             <p className="cert-modal-body">
//               Renewing: <strong>{renewalData.certificationName}</strong>
//             </p>
            
//             <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
//               <div className="cert-field-compact">
//                 <label className="required">New Issue Date</label>
//                 <input
//                   type="date"
//                   value={renewalData.newIssueDate}
//                   onChange={(e) => setRenewalData({ ...renewalData, newIssueDate: e.target.value })}
//                 />
//               </div>
//               <div className="cert-field-compact">
//                 <label>New Expiry Date</label>
//                 <input
//                   type="date"
//                   value={renewalData.newExpiryDate}
//                   min={renewalData.newIssueDate}
//                   onChange={(e) => setRenewalData({ ...renewalData, newExpiryDate: e.target.value })}
//                 />
//               </div>
//               <div className="cert-field-compact">
//                 <label>New Certificate Number (Optional)</label>
//                 <input
//                   type="text"
//                   value={renewalData.newCertificateNumber}
//                   onChange={(e) => setRenewalData({ ...renewalData, newCertificateNumber: e.target.value })}
//                 />
//               </div>
//             </div>
            
//             <div className="cert-modal-actions">
//               <button className="cert-modal-cancel" onClick={() => setShowRenewalModal(false)}>Cancel</button>
//               <button className="cert-modal-confirm renew" onClick={handleRenewal}>
//                 Confirm Renewal
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Certifications;
import React, { useState } from 'react';
import {
  FaSearch, FaEdit, FaTrash, FaPlus, FaTimes,
  FaArrowLeft, FaSave, FaExclamationCircle, FaClock, FaCheckCircle, FaFileAlt, FaEye, FaUpload, FaFilePdf, FaFileImage
} from 'react-icons/fa';
import { toast } from '../components/Toast';

/* ─── Dummy Data ─── */
/* ─── Dummy Data with Sample Certificates ─── */
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
    certificateFileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    certificateFileName: 'AWS_Certificate_Sample.png'
  },
  {
    id: 2,
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
    id: 3,
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
    id: 4,
    employeeId: 3,
    employeeName: 'Mike Johnson',
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
    employeeId: 2,
    employeeName: 'Jane Smith',
    certificationName: 'Google Cloud Professional',
    issuedBy: 'Google',
    certificateNumber: 'GCP-33333',
    issueDate: '2024-05-01',
    expiryDate: '2026-04-30',
    reminderDays: 30,
    notes: '',
    certificateFileData: null,
    certificateFileName: null
  },
  {
    id: 6,
    employeeId: 4,
    employeeName: 'Sarah Williams',
    certificationName: 'CISSP',
    issuedBy: 'ISC2',
    certificateNumber: 'CISSP-44444',
    issueDate: '2023-11-15',
    expiryDate: '2026-11-14',
    reminderDays: 90,
    notes: 'Security certification',
    certificateFileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    certificateFileName: 'CISSP_Certificate.png'
  }
];

const DUMMY_EMPLOYEES = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Mike Johnson' },
  { id: 4, name: 'Sarah Williams' },
  { id: 5, name: 'David Brown' }
];

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const Certifications = ({ user, employeeId: propEmployeeId }) => {
  // View state
  const [view, setView] = useState('list');
  const [editMode, setEditMode] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState(null);
  
  // Data states
  const [allCertifications, setAllCertifications] = useState(DUMMY_CERTIFICATIONS);
  const [nextId, setNextId] = useState(7);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState(propEmployeeId || '');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certToDelete, setCertToDelete] = useState(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalData, setRenewalData] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [certToView, setCertToView] = useState(null);
  
  // Form data
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
  
  // Helper: Get certification status
  const getCertStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Never Expires', type: 'never', icon: FaCheckCircle, color: '#10b981' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', type: 'expired', icon: FaExclamationCircle, color: '#ef4444' };
    if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', type: 'expiring', icon: FaClock, color: '#f59e0b' };
    return { label: 'Active', type: 'active', icon: FaCheckCircle, color: '#10b981' };
  };
  
  // ──────────────── FILTERING & PAGINATION ────────────────
  const filteredCerts = allCertifications.filter(cert => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch = !search || 
      cert.certificationName?.toLowerCase().includes(search) ||
      cert.issuedBy?.toLowerCase().includes(search) ||
      cert.certificateNumber?.toLowerCase().includes(search) ||
      cert.employeeName?.toLowerCase().includes(search);
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const status = getCertStatus(cert.expiryDate).type;
      matchesStatus = status === statusFilter;
    }
    
    const matchesEmployee = !employeeFilter || cert.employeeId === parseInt(employeeFilter);
    
    return matchesSearch && matchesStatus && matchesEmployee;
  });
  
  const totalItems = filteredCerts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentCertifications = filteredCerts.slice(startIndex, startIndex + rowsPerPage);
  
  // ──────────────── FORM HANDLERS ────────────────
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
      // Update existing certification
      const updatedCerts = allCertifications.map(cert =>
        cert.id === selectedCertification.id
          ? {
              ...cert,
              employeeId: parseInt(formData.employeeId),
              employeeName: DUMMY_EMPLOYEES.find(e => e.id === parseInt(formData.employeeId))?.name || '',
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
      // Add new certification
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
  console.log('Opening certificate:', cert.certificateFileName, cert.certificateFileData);
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
  
  const getEmployeeName = (empId) => {
    const emp = DUMMY_EMPLOYEES.find(e => e.id === empId);
    return emp?.name || `Employee #${empId}`;
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
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };
  
  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header" style={{ justifyContent: view !== 'list' ? 'space-between' : 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
              <p className="cert-subtitle">
                {propEmployeeId 
                  ? `Manage certifications for ${getEmployeeName(propEmployeeId)}`
                  : `${totalItems} total certifications tracked`}
              </p>
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
          {/* Filters */}
          <div className="cert-search-bar">
            <div className="cert-search-wrap">
              <FaSearch className="cert-search-icon" size={12} />
              <input
                className="cert-search-input"
                type="text"
                placeholder="Search by certification, issuer, or employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring Soon (≤30 days)</option>
                <option value="expired">Expired</option>
              </select>
              
              {!propEmployeeId && (
                <select 
                  className="cert-filter-select" 
                  value={employeeFilter} 
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {DUMMY_EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="cert-stats">
            <div className="cert-stat-card">
              <FaCheckCircle size={16} color="#10b981" />
              <span>{allCertifications.filter(c => getCertStatus(c.expiryDate).type === 'active').length} Active</span>
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
          
          {/* Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Certification</th>
                    {!propEmployeeId && <th>Employee</th>}
                    <th>Issued By</th>
                    <th>Cert. No.</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Certificate</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCertifications.length > 0 ? currentCertifications.map((cert, idx) => {
                    const status = getCertStatus(cert.expiryDate);
                    const StatusIcon = status.icon;
                    const hasCertificate = cert.certificateFileData || cert.certificateFileName;
                    return (
                      <tr key={cert.id} className="cert-row">
                        <td className="cert-sno">{startIndex + idx + 1}</td>
                        <td>
                          <div className="cert-info-cell">
                            <div className="cert-avatar" style={{ background: '#ede9fe', color: '#5b21b6' }}>
                              <FaFileAlt size={14} />
                            </div>
                            <div>
                              <div className="cert-name">{cert.certificationName}</div>
                              {cert.notes && <div className="cert-notes">{cert.notes.slice(0, 40)}</div>}
                            </div>
                          </div>
                        </td>
                        {!propEmployeeId && (
                          <td className="cert-employee">{cert.employeeName}</td>
                        )}
                        <td className="cert-issuer">{cert.issuedBy}</td>
                        <td className="cert-number">{cert.certificateNumber || '—'}</td>
                        <td className="cert-date">{formatDate(cert.issueDate)}</td>
                        <td className="cert-date">{formatDate(cert.expiryDate)}</td>
                        <td>
                          <span className={`cert-status-badge cert-status--${status.type}`}>
                            <StatusIcon size={10} /> {status.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="cert-act cert-act--view"
                            onClick={() => openViewModal(cert)}
                            title={hasCertificate ? "View Certificate" : "No Certificate Uploaded"}
                            style={{ opacity: hasCertificate ? 1 : 0.5 }}
                            disabled={!hasCertificate}
                          >
                            <FaEye size={12} />
                          </button>
                        </td>
                        <td>
                          <div className="cert-actions">
                            {cert.expiryDate && new Date(cert.expiryDate) > new Date() && (
                              <button 
                                className="cert-act cert-act--renew" 
                                onClick={() => openRenewalModal(cert)} 
                                title="Renew"
                              >
                                <FaClock size={12} />
                              </button>
                            )}
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(cert)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => { setCertToDelete(cert); setShowDeleteModal(true); }} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={!propEmployeeId ? 10 : 9} className="cert-empty">
                        <div className="cert-empty-inner">
                          <span className="cert-empty-icon">📜</span>
                          <p>No certifications found</p>
                          <small>Add a certification or adjust your filters</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="cert-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="cert-page-info">
                    Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} certifications
                  </span>
                </div>
                <div className="cert-page-controls">
                  <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={`dots-${i}`} className="cert-page-dots">…</span>
                    ) : (
                      <button key={pg} className={`cert-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Form View */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Certification Details</div>
              <div className="cert-form-grid-3col">
                {!propEmployeeId && (
                  <div className={`cert-field-compact ${touched.employeeId && errors.employeeId ? 'has-error' : ''}`}>
                    <label className="required">Employee</label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => handleChange('employeeId', e.target.value)}
                      onBlur={() => handleBlur('employeeId')}
                    >
                      <option value="">Select employee</option>
                      {DUMMY_EMPLOYEES.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                    <FieldError msg={errors.employeeId} />
                  </div>
                )}
                
                <div className={`cert-field-compact ${touched.certificationName && errors.certificationName ? 'has-error' : ''}`}>
                  <label className="required">Certification Name</label>
                  <input
                    type="text"
                    placeholder="e.g., AWS Certified Solutions Architect"
                    value={formData.certificationName}
                    onChange={(e) => handleChange('certificationName', e.target.value)}
                    onBlur={() => handleBlur('certificationName')}
                  />
                  <FieldError msg={errors.certificationName} />
                </div>
                
                <div className={`cert-field-compact ${touched.issuedBy && errors.issuedBy ? 'has-error' : ''}`}>
                  <label className="required">Issuing Authority</label>
                  <input
                    type="text"
                    placeholder="e.g., Amazon Web Services"
                    value={formData.issuedBy}
                    onChange={(e) => handleChange('issuedBy', e.target.value)}
                    onBlur={() => handleBlur('issuedBy')}
                  />
                  <FieldError msg={errors.issuedBy} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Certificate Number</label>
                  <input
                    type="text"
                    placeholder="Optional reference number"
                    value={formData.certificateNumber}
                    onChange={(e) => handleChange('certificateNumber', e.target.value)}
                  />
                </div>
                
                <div className={`cert-field-compact ${touched.issueDate && errors.issueDate ? 'has-error' : ''}`}>
                  <label className="required">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleChange('issueDate', e.target.value)}
                    onBlur={() => handleBlur('issueDate')}
                  />
                  <FieldError msg={errors.issueDate} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    min={formData.issueDate || undefined}
                    onChange={(e) => handleChange('expiryDate', e.target.value)}
                  />
                  <FieldError msg={errors.expiryDate} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Reminder (days before expiry)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={formData.reminderDays}
                    min="0"
                    max="365"
                    onChange={(e) => handleChange('reminderDays', e.target.value)}
                  />
                  <small style={{ fontSize: '11px', color: '#666' }}>Email notifications sent this many days before expiry</small>
                </div>
                
                {/* Certificate Upload Field - Single click upload */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Upload Certificate (Optional)</label>
                  <div style={{ 
                    border: '1px dashed #ccc', 
                    borderRadius: '6px', 
                    padding: '12px',
                    textAlign: 'center',
                    background: '#f9fafb'
                  }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="certificate-upload"
                    />
                    <label htmlFor="certificate-upload" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#4f46e5', color: 'white', borderRadius: '6px', fontSize: '13px' }}>
                      <FaUpload size={12} />
                      Choose File
                    </label>
                    {formData.certificateFileName && (
                      <div style={{ marginTop: '10px', fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {formData.certificateFileName.endsWith('.pdf') ? <FaFilePdf size={14} /> : <FaFileImage size={14} />}
                        {formData.certificateFileName}
                      </div>
                    )}
                    <small style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '8px' }}>
                      Supported: PDF, JPG, PNG (Max 5MB)
                    </small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="cert-divider" />
            
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Additional Information</div>
              <div className={`cert-field-compact`} style={{ gridColumn: 'span 3' }}>
                <label>Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any additional information about this certification..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>
                Cancel
              </button>
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
            <p className="cert-modal-body">
              You're about to permanently delete <strong>{certToDelete.certificationName}</strong>.
            </p>
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
            <div className="cert-modal-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <FaClock size={18} />
            </div>
            <h3 className="cert-modal-title">Renew Certification</h3>
            <p className="cert-modal-body">
              Renewing: <strong>{renewalData.certificationName}</strong>
            </p>
            
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div className="cert-field-compact">
                <label className="required">New Issue Date</label>
                <input
                  type="date"
                  value={renewalData.newIssueDate}
                  onChange={(e) => setRenewalData({ ...renewalData, newIssueDate: e.target.value })}
                />
              </div>
              <div className="cert-field-compact">
                <label>New Expiry Date</label>
                <input
                  type="date"
                  value={renewalData.newExpiryDate}
                  min={renewalData.newIssueDate}
                  onChange={(e) => setRenewalData({ ...renewalData, newExpiryDate: e.target.value })}
                />
              </div>
              <div className="cert-field-compact">
                <label>New Certificate Number (Optional)</label>
                <input
                  type="text"
                  value={renewalData.newCertificateNumber}
                  onChange={(e) => setRenewalData({ ...renewalData, newCertificateNumber: e.target.value })}
                />
              </div>
            </div>
            
            <div className="cert-modal-actions">
              <button className="cert-modal-cancel" onClick={() => setShowRenewalModal(false)}>Cancel</button>
              <button className="cert-modal-confirm renew" onClick={handleRenewal}>
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* View Certificate Modal - Proper certificate display */}
           {/* View Certificate Modal - Proper certificate display */}
      {showViewModal && certToView && (
        <div className="cert-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="cert-modal cert-view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', width: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="cert-modal-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
              <FaFileAlt size={18} />
            </div>
            <h3 className="cert-modal-title">Certificate Document</h3>
            <p className="cert-modal-body" style={{ textAlign: 'center' }}>
              <strong>{certToView.certificationName}</strong><br />
              {certToView.employeeName}
            </p>
            
            <div style={{ 
              margin: '20px 0', 
              padding: '20px', 
              background: '#f9fafb', 
              borderRadius: '8px',
              textAlign: 'center',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {certToView.certificateFileData ? (
                certToView.certificateFileData.startsWith('data:image') ? (
                  <div>
                    <img 
                      src={certToView.certificateFileData} 
                      alt="Certificate" 
                      style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '4px', objectFit: 'contain' }}
                    />
                    <p style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                      File: {certToView.certificateFileName}
                    </p>
                  </div>
                ) : certToView.certificateFileData.startsWith('data:application/pdf') ? (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <FaFilePdf size={80} color="#ef4444" />
                    <p style={{ marginTop: '16px', marginBottom: '16px', wordBreak: 'break-all' }}>
                      {certToView.certificateFileName || 'Certificate.pdf'}
                    </p>
                    <iframe
                      src={certToView.certificateFileData}
                      title="Certificate PDF"
                      style={{ width: '100%', height: '500px', border: 'none', borderRadius: '4px' }}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <FaFileAlt size={80} color="#4f46e5" />
                    <p style={{ marginTop: '16px' }}>{certToView.certificateFileName}</p>
                    <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>
                      Certificate file is available
                    </p>
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <FaFileAlt size={64} />
                  <p style={{ marginTop: '16px' }}>No certificate uploaded for this certification</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>Click Edit to upload a certificate</p>
                </div>
              )}
            </div>
            
            <div className="cert-modal-actions">
              <button className="cert-modal-cancel" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              {certToView.certificateFileData && (
                <a 
                  href={certToView.certificateFileData} 
                  download={certToView.certificateFileName || 'certificate'}
                  style={{ 
                    padding: '8px 16px',
                    background: '#10b981',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FaUpload size={12} /> Download Certificate
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