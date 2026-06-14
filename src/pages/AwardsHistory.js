
import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaTrophy, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaAward, FaUserTie, FaEye, FaDownload, FaStar, FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AwardsHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [awards, setAwards] = useState(initialData?.awards || [
    { id: 1, awardName: 'Star Performer of the Year', awardDate: '2024-01-15', awardType: 'Star Performer', issuedBy: 'CEO Office', description: 'Exceptional performance throughout the year', createdAt: '2024-01-15T10:30:00Z', employeeName: 'John Doe', employeeId: 1 },
    { id: 2, awardName: 'Innovation Award', awardDate: '2024-03-20', awardType: 'Innovation', issuedBy: 'HR Department', description: 'Outstanding innovation in process improvement', createdAt: '2024-03-20T11:45:00Z', employeeName: 'Jane Smith', employeeId: 2 },
    { id: 3, awardName: 'Employee of the Month', awardDate: '2024-05-10', awardType: 'Employee of Month', issuedBy: 'Department Head', description: 'Consistent performance', createdAt: '2024-05-10T09:15:00Z', employeeName: 'Mike Johnson', employeeId: 3 },
    { id: 4, awardName: 'Leadership Excellence', awardDate: '2024-07-05', awardType: 'Leadership', issuedBy: 'Managing Director', description: 'Excellent leadership skills', createdAt: '2024-07-05T14:20:00Z', employeeName: 'Sarah Williams', employeeId: 4 },
    { id: 5, awardName: 'Customer Service Star', awardDate: '2024-09-12', awardType: 'Customer Service', issuedBy: 'CEO Office', description: 'Outstanding customer service', createdAt: '2024-09-12T10:00:00Z', employeeName: 'David Brown', employeeId: 5 }
  ]);
  
  const [editingAward, setEditingAward] = useState(null);
  const [formData, setFormData] = useState({
    awardName: '',
    awardDate: '',
    awardType: 'Performance',
    issuedBy: '',
    description: '',
    certificateFile: null,
    certificateFileData: null,
    certificateFileName: null,
    employeeId: '',
    employeeName: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
 
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

  const awardTypes = [
    { value: 'Performance', label: 'Performance Award' },
    { value: 'Innovation', label: 'Innovation Award' },
    { value: 'Leadership', label: 'Leadership Award' },
    { value: 'Teamwork', label: 'Teamwork Award' },
    { value: 'Customer Service', label: 'Customer Service Award' },
    { value: 'Long Service', label: 'Long Service Award' },
    { value: 'Spot Award', label: 'Spot Award' },
    { value: 'Star Performer', label: 'Star Performer' },
    { value: 'Employee of Month', label: 'Employee of the Month' },
    { value: 'Employee of Year', label: 'Employee of the Year' }
  ];

  const issuedByOptions = [
    { value: 'CEO', label: 'CEO Office' },
    { value: 'HR Department', label: 'HR Department' },
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'Department Head', label: 'Department Head' },
    { value: 'Client', label: 'Client' },
    { value: 'External Organization', label: 'External Organization' }
  ];

  // Filter awards by search
  const filteredAwards = awards.filter(award => {
    const search = searchTerm.toLowerCase();
    return award.awardName.toLowerCase().includes(search) ||
           award.awardType.toLowerCase().includes(search) ||
           award.issuedBy.toLowerCase().includes(search) ||
           award.employeeName.toLowerCase().includes(search);
  });

  // Pagination
  const totalItems = filteredAwards.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentAwards = filteredAwards.slice(startIndex, startIndex + rowsPerPage);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('File too large', 'Maximum file size is 5MB');
        return;
      }
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

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'awardName' && !value) error = 'Award Name is required';
    else if (field === 'awardDate' && !value) error = 'Award Date is required';
    else if (field === 'awardType' && !value) error = 'Award Type is required';
    else if (field === 'issuedBy' && !value) error = 'Issued By is required';
    else if (field === 'employeeId' && !value) error = 'Employee is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.awardName) newErrors.awardName = 'Award Name is required';
    if (!formData.awardDate) newErrors.awardDate = 'Award Date is required';
    if (!formData.awardType) newErrors.awardType = 'Award Type is required';
    if (!formData.issuedBy) newErrors.issuedBy = 'Issued By is required';
    if (!formData.employeeId) newErrors.employeeId = 'Employee is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({
      ...prev,
      employeeId: employee.id,
      employeeName: employee.name
    }));
    setEmployeeSearchTerm('');
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    const awardData = {
      ...formData,
      id: editingAward ? editingAward.id : Date.now(),
      createdAt: editingAward ? editingAward.createdAt : new Date().toISOString()
    };
    
    if (editingAward) {
      const updated = awards.map(a =>
        a.id === editingAward.id ? awardData : a
      );
      setAwards(updated);
      toast.success('Success', 'Award updated successfully');
      setEditingAward(null);
    } else {
      setAwards([awardData, ...awards]);
      toast.success('Success', 'Award added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (award) => {
    setEditingAward(award);
    setSelectedEmployee({ id: award.employeeId, name: award.employeeName });
    setFormData({
      awardName: award.awardName,
      awardDate: award.awardDate,
      awardType: award.awardType,
      issuedBy: award.issuedBy,
      description: award.description || '',
      certificateFile: null,
      certificateFileData: award.certificateFileData,
      certificateFileName: award.certificateFileName,
      employeeId: award.employeeId,
      employeeName: award.employeeName
    });
    setShowForm(true);
  };

 

  const handleDelete = (id) => {
    setAwards(awards.filter(a => a.id !== id));
    toast.success('Success', 'Award deleted successfully');
  };

  const resetForm = () => {
    setFormData({
      awardName: '',
      awardDate: '',
      awardType: 'Performance',
      issuedBy: '',
      description: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null,
      employeeId: '',
      employeeName: ''
    });
    setErrors({});
    setTouched({});
    setEditingAward(null);
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // Calculate stats
  const totalAwards = awards.length;
  const topAwards = awards.filter(a => a.awardType === 'Employee of Year' || a.awardType === 'Star Performer').length;

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Awards & Recognition History</h1>
          <p className="cert-subtitle">Manage employee awards and recognitions</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Award
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
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="cert-form-wrap mb-4">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Award Details</div>
              <div className="cert-form-grid-3col">
               
                <div className={`cert-field-compact ${touched.awardName && errors.awardName ? 'has-error' : ''}`}>
                  <label className="required">Award Name</label>
                  <input type="text" placeholder="e.g., Best Employee of the Year" value={formData.awardName} onChange={(e) => handleChange('awardName', e.target.value)} onBlur={() => handleBlur('awardName')} />
                  <FieldError msg={errors.awardName} />
                </div>
                
                <div className={`cert-field-compact ${touched.awardDate && errors.awardDate ? 'has-error' : ''}`}>
                  <label className="required">Award Date</label>
                  <input type="date" value={formData.awardDate} onChange={(e) => handleChange('awardDate', e.target.value)} onBlur={() => handleBlur('awardDate')} />
                  <FieldError msg={errors.awardDate} />
                </div>
                
                <div className={`cert-field-compact ${touched.awardType && errors.awardType ? 'has-error' : ''}`}>
                  <label className="required">Award Type</label>
                  <select value={formData.awardType} onChange={(e) => handleChange('awardType', e.target.value)} onBlur={() => handleBlur('awardType')}>
                    {awardTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <FieldError msg={errors.awardType} />
                </div>
                
                <div className={`cert-field-compact ${touched.issuedBy && errors.issuedBy ? 'has-error' : ''}`}>
                  <label className="required">Issued By</label>
                  <select value={formData.issuedBy} onChange={(e) => handleChange('issuedBy', e.target.value)} onBlur={() => handleBlur('issuedBy')}>
                    <option value="">Select Issued By</option>
                    {issuedByOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <FieldError msg={errors.issuedBy} />
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 2' }}>
                  <label>Description</label>
                  <textarea rows="3" placeholder="Brief description of the award and achievement..." value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Award Certificate</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="certificate-upload" />
                    <label htmlFor="certificate-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.certificateFileName && (
                      <div className="mt-2 text-primary">
                        {formData.certificateFileName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.certificateFileName}
                      </div>
                    )}
                    <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingAward ? 'Update Award' : 'Save Award'}
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
                placeholder="Search by award name, type, issued by or employee..."
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

         
          {/* Awards Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>Award Name</th>
                    
                    <th>Award Date</th>
                    <th>Award Type</th>
                    <th>Issued By</th>
                    <th>Description</th>
                    <th>Certificate</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAwards.length > 0 ? (
                    currentAwards.map((award) => (
                      <tr key={award.id}>
                        <td><strong>{award.awardName}</strong></td>
                       
                        <td>{formatDate(award.awardDate)}</td>
                        <td>{award.awardType}</td>
                        <td>{award.issuedBy}</td>
                        <td>{award.description ? (award.description.length > 30 ? award.description.substring(0, 30) + '...' : award.description) : '—'}</td>
                        <td className="text-center">
                          {award.certificateFileName ? (
                            <a href={award.certificateFileData} download={award.certificateFileName} className="btn btn-sm btn-outline-primary">
                              <FaFileAlt size={12} /> View
                            </a>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <div className="cert-actions">
                            
                            <button className="cert-act cert-act--edit" onClick={() => handleEdit(award)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="cert-act cert-act--del" onClick={() => handleDelete(award.id)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="text-center py-5">No award records found</td></tr>
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

export default AwardsHistory;