import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaTrophy, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaAward, FaUserTie, FaEye, FaDownload, FaStar, FaArrowLeft,FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AwardsHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [awards, setAwards] = useState(initialData?.awards || [
    { id: 1, awardName: 'Star Performer of the Year', awardDate: '2024-01-15', awardType: 'Star Performer', issuedBy: 'CEO Office', description: 'Exceptional performance throughout the year', createdAt: '2024-01-15T10:30:00Z', employeeName: 'John Doe', employeeId: 1, certificateFileName: 'star_performer.pdf', certificateFileData: null },
    { id: 2, awardName: 'Innovation Award', awardDate: '2024-03-20', awardType: 'Innovation', issuedBy: 'HR Department', description: 'Outstanding innovation in process improvement', createdAt: '2024-03-20T11:45:00Z', employeeName: 'Jane Smith', employeeId: 2 },
    { id: 3, awardName: 'Employee of the Month', awardDate: '2024-05-10', awardType: 'Employee of Month', issuedBy: 'Department Head', description: 'Consistent performance', createdAt: '2024-05-10T09:15:00Z', employeeName: 'Mike Johnson', employeeId: 3, certificateFileName: 'employee_month.jpg', certificateFileData: null },
    { id: 4, awardName: 'Leadership Excellence', awardDate: '2024-07-05', awardType: 'Leadership', issuedBy: 'Managing Director', description: 'Excellent leadership skills', createdAt: '2024-07-05T14:20:00Z', employeeName: 'Sarah Williams', employeeId: 4 },
    { id: 5, awardName: 'Customer Service Star', awardDate: '2024-09-12', awardType: 'Customer Service', issuedBy: 'CEO Office', description: 'Outstanding customer service', createdAt: '2024-09-12T10:00:00Z', employeeName: 'David Brown', employeeId: 5, certificateFileName: 'service_star.pdf', certificateFileData: null }
  ]);
  
  const [editingAward, setEditingAward] = useState(null);
  const [selectedAward, setSelectedAward] = useState(null); // For inline detail view
  const [documentPreview, setDocumentPreview] = useState(null); // For document preview modal
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
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
   const [showStatusModal, setShowStatusModal] = useState(false);
      const [statusAction, setStatusAction] = useState({
        id: null,
        name: "",
        newStatus: ""
      });

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

  // Handle row click for detail view
  const handleRowClick = (award) => {
    setSelectedAward(award);
  };

  // Handle document view
  const handleViewDocument = (e, award) => {
    e.stopPropagation(); // Prevent row click
    if (award.certificateFileData) {
      setDocumentPreview({
        data: award.certificateFileData,
        name: award.certificateFileName
      });
    } else {
      toast.info('No Document', 'No certificate has been uploaded for this award');
    }
  };

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

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({
      ...prev,
      employeeId: employee.id,
      employeeName: employee.name
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
  if (award.status === 'Inactive') {
    toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
    return;
  }
  
  const emp = DUMMY_EMPLOYEES.find(e => e.id === award.employeeId);
  setSelectedEmployee(emp || null);  
  setEditingAward(award);
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
  setEmployeeSearchTerm(emp?.name || '');
  setShowForm(true);
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
    setSelectedAward(null);
  };

  // Calculate stats
  const totalAwards = awards.length;
  const topAwards = awards.filter(a => a.awardType === 'Employee of Year' || a.awardType === 'Star Performer').length;

  // Get award type color
  const getAwardTypeColor = (awardType) => {
    switch(awardType) {
      case 'Star Performer':
      case 'Employee of Year':
        return { bg: '#fef3c7', color: '#92400e', icon: '⭐' };
      case 'Innovation':
        return { bg: '#e0e7ff', color: '#4f46e5', icon: '💡' };
      case 'Leadership':
        return { bg: '#d1fae5', color: '#065f46', icon: '👑' };
      case 'Performance':
        return { bg: '#fce7f3', color: '#9d174d', icon: '📈' };
      case 'Customer Service':
        return { bg: '#dbeafe', color: '#1e40af', icon: '🤝' };
      case 'Teamwork':
        return { bg: '#e5e7eb', color: '#374151', icon: '🤲' };
      case 'Employee of Month':
        return { bg: '#ffedd5', color: '#9a3412', icon: '📅' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280', icon: '🏆' };
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
    
        const confirmStatusChange = () => {
          const { id, newStatus } = statusAction;
        
          const updatedAward = awards.map((award) =>
            award.id === id
              ? {
                  ...award,
                  status: newStatus
                }
              : award
          );
        
          setAwards(updatedAward);
        
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
          <h1 className="cert-title">Awards & Recognition History</h1>
          <p className="cert-subtitle">Manage employee awards and recognitions</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedAward && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Award
            </button>
          )}
          {(showForm || selectedAward) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedAward && onCancel && (
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
                
                {/* Employee Code - Auto Populate */}
                <div className="cert-field-compact">
                  <label>Employee Code</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.code || ''} readOnly placeholder="Auto-populated" />
                </div>
                
                {/* Department - Auto Populate */}
                <div className="cert-field-compact">
                  <label>Department</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.department || ''} readOnly placeholder="Auto-populated" />
                </div>
                
                {/* Designation - Auto Populate */}
                <div className="cert-field-compact">
                  <label>Designation</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.designation || ''} readOnly placeholder="Auto-populated" />
                </div>
                        
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
           ) : selectedAward ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaTrophy size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedAward.awardName}</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaCalendarAlt/> {formatDate(selectedAward.createdAt)}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedAward.awardType}</span></div>
            </div>
            {/* <button onClick={handleBackToList} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'white',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}><FaArrowLeft size={12}/> Back</button> */}
          </div>
          <div style={{padding:'32px'}}>
            <div style={{textAlign:'center',padding:'30px',background:'linear-gradient(135deg,#fef3c7,#fde68a)',borderRadius:'12px',marginBottom:'24px',border:'2px solid #f59e0b'}}>
              <div style={{fontSize:'48px',marginBottom:'12px'}}>{getAwardTypeColor(selectedAward.awardType).icon}</div>
              <h2 style={{fontSize:'24px',fontWeight:700,color:'#92400e',margin:'0 0 8px 0'}}>{selectedAward.awardName}</h2>
              <span style={{display:'inline-block',padding:'6px 16px',borderRadius:'6px',fontSize:'14px',fontWeight:600,background:getAwardTypeColor(selectedAward.awardType).bg,color:getAwardTypeColor(selectedAward.awardType).color}}><FaAward style={{marginRight:'6px'}}/>{selectedAward.awardType}</span>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedAward.employeeId)?.name?.charAt(0)||'?'}</div>
              <div><h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedAward.employeeId)?.name||selectedAward.employeeName}</h3><span style={{fontSize:'13px',color:'#64748b'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedAward.employeeId)?.code||''}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#fffbeb',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#f59e0b'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Award Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedAward.awardDate)}</p></div>
              <div style={{background:'#fdf2f8',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaBuilding size={16} style={{color:'#9d174d'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Issued By</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedAward.issuedBy}</p></div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#ea580c'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedAward.status==='Active'?'#d1fae5':'#fee2e2',color:selectedAward.status==='Active'?'#065f46':'#991b1b'}}>{selectedAward.status||'Active'}</span></div>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0'}}><h4 style={{fontSize:'14px',fontWeight:600,color:'#1e293b',marginBottom:'12px'}}>Description</h4><p style={{fontSize:'15px',color:'#374151',margin:0,lineHeight:1.6}}>{selectedAward.description||'No description provided'}</p></div>
            <div style={{background:'linear-gradient(135deg,#e0e7ff,#c7d2fe)',padding:'20px',borderRadius:'8px',textAlign:'center',border:'1px solid #a5b4fc',marginBottom:'24px'}}>
              <FaStar size={32} style={{color:'#f59e0b',marginBottom:'8px'}}/>
              <label style={{fontSize:'12px',color:'#4f46e5',display:'block',marginBottom:'4px'}}>Achievement Level</label>
              <p style={{fontSize:'14px',fontWeight:700,color:'#3730a3',margin:0}}>{selectedAward.awardType==='Employee of Year'||selectedAward.awardType==='Star Performer'?'🏆 Top Honor':'🎖️ Excellence'}</p>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}><FaFilePdf size={16} style={{color:'#dc2626'}}/> Award Certificate</h4>
              {selectedAward.certificateFileName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedAward.certificateFileName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}</div><div><p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedAward.certificateFileName}</p><span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded certificate</span></div></div>
                  <button onClick={(e)=>handleViewDocument(e,selectedAward)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}><FaEye size={14}/> View Certificate</button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}><FaFileAlt size={36} style={{marginBottom:'12px',opacity:0.3}}/><p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No certificate uploaded</p><span style={{fontSize:'13px'}}>No award certificate has been uploaded</span></div>
              )}
            </div>
          </div>
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
                    <th>#</th>
                    <th>Employee</th>
                    <th>Award Name</th>                   
                    <th>Award Date</th>
                    <th>Award Type</th>
                    <th>Issued By</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAwards.length > 0 ? (
                    currentAwards.map((award,idx) => (
                      <tr 
                        key={award.id}
                        onClick={() => handleRowClick(award)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                      <td className="text-center">{startIndex + idx + 1}</td>
                        <td>{DUMMY_EMPLOYEES.find(e => e.id === award.employeeId)?.name || 'Unknown'}</td>
                        <td><strong>{award.awardName}</strong></td>
                        <td>{formatDate(award.awardDate)}</td>
                        <td>{award.awardType}</td>
                        <td>{award.issuedBy}</td>
                        <td>{award.description ? (award.description.length > 30 ? award.description.substring(0, 30) + '...' : award.description) : '—'}</td>
                       
                             <td>
  <div
    className="d-flex align-items-center gap-1"
    style={{ cursor: "pointer" }}
    onClick={(e) => {
      e.stopPropagation();
      handleStatusToggle(
        award.id,
        DUMMY_EMPLOYEES.find(e => e.id === award.employeeId)?.name || "",
        award.status || "Active"
      );
    }}
  >
    <div
      style={{
        width: "28px",
        height: "16px",
        borderRadius: "50px",
        backgroundColor:
          (award.status || "Active") === "Active"
            ? "#9d174d"
            : "#d1d5db",
        position: "relative",
        transition: ".2s"
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
            (award.status || "Active") === "Active"
              ? "14px"
              : "2px",
          transition: ".2s"
        }}
      />
    </div>

    <span
      style={{
        fontSize: "11px",
        fontWeight: 500,
        color:
          (award.status || "Active") === "Active"
            ? "#9d174d"
            : "#94a3b8"
      }}
    >
      {award.status || "Active"}
    </span>
  </div>
</td>
                        <td>
  <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
    <button 
      className="cert-act cert-act--edit" 
      onClick={() => handleEdit(award)} 
      title={award.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
      disabled={award.status === 'Inactive'}
      style={{ 
        opacity: award.status === 'Inactive' ? 0.5 : 1,
        cursor: award.status === 'Inactive' ? 'not-allowed' : 'pointer'
      }}
    >
      <FaEdit size={12} />
    </button>
  </div>
</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="10" className="text-center py-5">No award records found</td></tr>
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

      {/* Document Preview Modal */}
      {documentPreview && (
        <div
          className="emp-modal-overlay"
          onClick={() => setDocumentPreview(null)}
          style={{ zIndex: 1050 }}
        >
          <div
            className="emp-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '900px', 
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                <FaFileAlt style={{ marginRight: '8px' }} />
                Certificate Preview
              </h3>
              <button 
                onClick={() => setDocumentPreview(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {documentPreview.data && documentPreview.name && documentPreview.name.endsWith('.pdf') ? (
                <div style={{ 
                  width: '100%', 
                  height: '70vh',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <iframe
                    src={documentPreview.data}
                    width="100%"
                    height="100%"
                    title="PDF Preview"
                    style={{ border: 'none' }}
                  />
                </div>
              ) : documentPreview.data ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={documentPreview.data} 
                    alt="Certificate Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '70vh',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} 
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p>No preview available</p>
                </div>
              )}
              
              <div style={{ 
                marginTop: '20px', 
                padding: '12px 16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: '#111827' }}>{documentPreview.name}</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                    Uploaded certificate
                  </p>
                </div>
                <a 
                  href={documentPreview.data} 
                  download={documentPreview.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#9d174d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  <FaDownload /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for row hover effect */}
      <style jsx>{`
        .cert-table-row-hover:hover {
          background-color: #f9fafb;
          transition: background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default AwardsHistory;