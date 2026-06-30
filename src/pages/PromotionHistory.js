import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaArrowUp, FaBuilding,
  FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaChartLine, FaSearch,FaArrowLeft
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const PromotionHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [promotions, setPromotions] = useState(initialData?.promotions || [
    { id: 1, employeeId:1,promotionOrderNo: 'PROMO/2024/001', promotionDate: '2024-03-01', previousDesignation: 'Software Engineer', newDesignation: 'Senior Software Engineer', previousGrade: 'Grade A2', newGrade: 'Grade B1', promotionType: 'Merit', effectiveDate: '2024-03-01', promotionAuthority: 'HR Director', createdAt: '2024-03-01T10:30:00Z' },
    { id: 2, employeeId:2,promotionOrderNo: 'PROMO/2024/002', promotionDate: '2024-06-15', previousDesignation: 'Senior Software Engineer', newDesignation: 'Tech Lead', previousGrade: 'Grade B1', newGrade: 'Grade C1', promotionType: 'Merit', effectiveDate: '2024-06-15', promotionAuthority: 'CEO', createdAt: '2024-06-15T11:45:00Z' },
    { id: 3, employeeId:3,promotionOrderNo: 'PROMO/2024/003', promotionDate: '2024-09-20', previousDesignation: 'HR Executive', newDesignation: 'HR Manager', previousGrade: 'Grade B1', newGrade: 'Grade C2', promotionType: 'Time Scale', effectiveDate: '2024-09-20', promotionAuthority: 'HR Director', createdAt: '2024-09-20T09:15:00Z' },
    { id: 4, employeeId:4,promotionOrderNo: 'PROMO/2024/004', promotionDate: '2024-11-10', previousDesignation: 'Tech Lead', newDesignation: 'Project Manager', previousGrade: 'Grade C1', newGrade: 'Grade D1', promotionType: 'Fast Track', effectiveDate: '2024-11-10', promotionAuthority: 'Board of Directors', createdAt: '2024-11-10T14:20:00Z' },
    { id: 5, employeeId:5,promotionOrderNo: 'PROMO/2024/005', promotionDate: '2024-12-01', previousDesignation: 'Accountant', newDesignation: 'Senior Accountant', previousGrade: 'Grade A2', newGrade: 'Grade B1', promotionType: 'Merit', effectiveDate: '2024-12-01', promotionAuthority: 'Finance Director', createdAt: '2024-12-01T10:00:00Z' }
  ]);
  
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    promotionOrderNo: '',
    promotionDate: '',
    previousDesignation: '',
    newDesignation: '',
    previousGrade: '',
    newGrade: '',
    promotionType: 'Merit',
    effectiveDate: '',
    promotionAuthority: '',
    promotionDocument: null,
    promotionDocumentData: null,
    promotionDocumentName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' }
  ];

  // Dummy data for dropdowns
  const promotionTypes = [
    { value: 'Merit', label: 'Merit Based' },
    { value: 'Time Scale', label: 'Time Scale' },
    { value: 'Departmental', label: 'Departmental' },
    { value: 'Special', label: 'Special Promotion' },
    { value: 'Fast Track', label: 'Fast Track' }
  ];

  const promotionAuthorities = [
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'CEO', label: 'CEO' },
    { value: 'HR Director', label: 'HR Director' },
    { value: 'Promotion Committee', label: 'Promotion Committee' },
    { value: 'Board of Directors', label: 'Board of Directors' }
  ];

  const grades = [
    { value: 'Grade A1', label: 'Grade A1 - Entry Level' },
    { value: 'Grade A2', label: 'Grade A2 - Junior Executive' },
    { value: 'Grade B1', label: 'Grade B1 - Executive' },
    { value: 'Grade B2', label: 'Grade B2 - Senior Executive' },
    { value: 'Grade C1', label: 'Grade C1 - Assistant Manager' },
    { value: 'Grade C2', label: 'Grade C2 - Deputy Manager' },
    { value: 'Grade D1', label: 'Grade D1 - Manager' },
    { value: 'Grade D2', label: 'Grade D2 - Senior Manager' },
    { value: 'Grade E1', label: 'Grade E1 - Associate Director' },
    { value: 'Grade E2', label: 'Grade E2 - Director' }
  ];

  const designations = [
    { value: 'Software Engineer', label: 'Software Engineer' },
    { value: 'Senior Software Engineer', label: 'Senior Software Engineer' },
    { value: 'Tech Lead', label: 'Tech Lead' },
    { value: 'Project Manager', label: 'Project Manager' },
    { value: 'Senior Project Manager', label: 'Senior Project Manager' },
    { value: 'Delivery Manager', label: 'Delivery Manager' },
    { value: 'Associate Director', label: 'Associate Director' },
    { value: 'Director', label: 'Director' }
  ];

  // Filter promotions by search
  const filteredPromotions = promotions.filter(promo => {
    const search = searchTerm.toLowerCase();
    return promo.promotionOrderNo.toLowerCase().includes(search) ||
           promo.previousDesignation.toLowerCase().includes(search) ||
           promo.newDesignation.toLowerCase().includes(search) ||
           promo.promotionType.toLowerCase().includes(search);
  });

  // Pagination
  const totalItems = filteredPromotions.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentPromotions = filteredPromotions.slice(startIndex, startIndex + rowsPerPage);
 const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
  const search = employeeSearchTerm.toLowerCase();
  return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
});

const handleEmployeeSelect = (employee) => {
  setSelectedEmployee(employee);
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

  // Update existing order numbers
  useEffect(() => {
    setExistingOrderNos(promotions.map(promo => promo.promotionOrderNo));
  }, [promotions]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get last promotion date for validation
  const getLastPromotionDate = () => {
    if (promotions.length === 0) return null;
    const dates = promotions.map(p => new Date(p.promotionDate));
    const maxDate = new Date(Math.max(...dates));
    return maxDate.toISOString().split('T')[0];
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
          promotionDocument: file,
          promotionDocumentData: reader.result,
          promotionDocumentName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    const lastPromotionDate = getLastPromotionDate();
    
    if (field === 'promotionOrderNo') {
      if (!value) error = 'Promotion Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingPromotion || editingPromotion.promotionOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'promotionDate') {
      if (!value) error = 'Promotion Date is required';
      else if (lastPromotionDate && new Date(value) <= new Date(lastPromotionDate)) {
        error = `Promotion Date must be greater than last promotion date (${formatDate(lastPromotionDate)})`;
      }
    }
    else if (field === 'previousDesignation' && !value) error = 'Previous Designation is required';
    else if (field === 'newDesignation' && !value) error = 'New Designation is required';
    else if (field === 'promotionType' && !value) error = 'Promotion Type is required';
    else if (field === 'effectiveDate') {
      if (!value) error = 'Effective Date is required';
      else if (formData.promotionDate && new Date(value) < new Date(formData.promotionDate)) {
        error = 'Effective Date must be on or after Promotion Date';
      }
    }
    else if (field === 'promotionAuthority' && !value) error = 'Promotion Authority is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const lastPromotionDate = getLastPromotionDate();
    const newErrors = {};
    
    if (!formData.promotionOrderNo) {
      newErrors.promotionOrderNo = 'Promotion Order Number is required';
    } else if (existingOrderNos.includes(formData.promotionOrderNo) && 
        (!editingPromotion || editingPromotion.promotionOrderNo !== formData.promotionOrderNo)) {
      newErrors.promotionOrderNo = 'Order Number already exists';
    }
    
    if (!formData.promotionDate) {
      newErrors.promotionDate = 'Promotion Date is required';
    } else if (lastPromotionDate && new Date(formData.promotionDate) <= new Date(lastPromotionDate)) {
      newErrors.promotionDate = `Promotion Date must be greater than last promotion date`;
    }
    
    if (!formData.previousDesignation) newErrors.previousDesignation = 'Previous Designation is required';
    if (!formData.newDesignation) newErrors.newDesignation = 'New Designation is required';
    if (!formData.promotionType) newErrors.promotionType = 'Promotion Type is required';
    
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective Date is required';
    } else if (formData.promotionDate && new Date(formData.effectiveDate) < new Date(formData.promotionDate)) {
      newErrors.effectiveDate = 'Effective Date must be on or after Promotion Date';
    }
    
    if (!formData.promotionAuthority) newErrors.promotionAuthority = 'Promotion Authority is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
     const promotionData = {
    ...formData,
    employeeId: selectedEmployee?.id || null,  
    id: editingPromotion ? editingPromotion.id : Date.now(),
    createdAt: editingPromotion ? editingPromotion.createdAt : new Date().toISOString()
  };
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    if (editingPromotion) {
      const updated = promotions.map(promo =>
        promo.id === editingPromotion.id
          ? { ...formData, id: promo.id, createdAt: promo.createdAt }
          : promo
      );
      setPromotions(updated);
      toast.success('Success', 'Promotion updated successfully');
      setEditingPromotion(null);
    } else {
      const newPromotion = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      setPromotions([newPromotion, ...promotions]);
      toast.success('Success', 'Promotion added successfully');
    }
    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (promotion) => {
     const emp = DUMMY_EMPLOYEES.find(e => e.id === promotion.employeeId);  
  setSelectedEmployee(emp || null);  
    setEditingPromotion(promotion);
    setFormData({
      promotionOrderNo: promotion.promotionOrderNo,
      promotionDate: promotion.promotionDate,
      previousDesignation: promotion.previousDesignation,
      newDesignation: promotion.newDesignation,
      previousGrade: promotion.previousGrade || '',
      newGrade: promotion.newGrade || '',
      promotionType: promotion.promotionType,
      effectiveDate: promotion.effectiveDate,
      promotionAuthority: promotion.promotionAuthority,
      promotionDocument: null,
      promotionDocumentData: promotion.promotionDocumentData,
      promotionDocumentName: promotion.promotionDocumentName
    });
     setEmployeeSearchTerm(emp?.name || '');
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setPromotions(promotions.filter(promo => promo.id !== id));
    toast.success('Success', 'Promotion deleted successfully');
  };

  const resetForm = () => {
    setFormData({
      promotionOrderNo: '',
      promotionDate: '',
      previousDesignation: '',
      newDesignation: '',
      previousGrade: '',
      newGrade: '',
      promotionType: 'Merit',
      effectiveDate: '',
      promotionAuthority: '',
      promotionDocument: null,
      promotionDocumentData: null,
      promotionDocumentName: null,
      
    });
    setErrors({});
    setTouched({});
    setEditingPromotion(null);
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

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Promotion History</h1>
          <p className="cert-subtitle">Manage employee promotion records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Promotion
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
        // Form View
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Promotion Details</div>
              <div className="cert-form-grid-3col">
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label className="required">Employee Name</label>
                  <div className="position-relative">
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaSearch size={14} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type employee name to search..."
                        value={employeeSearchTerm}
                        onChange={(e) => {
                          setEmployeeSearchTerm(e.target.value);
                          setShowEmployeeDropdown(true);
                        }}
                        onFocus={() => setShowEmployeeDropdown(true)}
                      />
                    </div>
                    
                    {showEmployeeDropdown && employeeSearchTerm && (
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
                       
                <div className={`cert-field-compact ${touched.promotionOrderNo && errors.promotionOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Promotion Order Number</label>
                  <input type="text" placeholder="e.g., ARI/PROMO/2024/001" value={formData.promotionOrderNo} onChange={(e) => handleChange('promotionOrderNo', e.target.value)} onBlur={() => handleBlur('promotionOrderNo')} />
                  <FieldError msg={errors.promotionOrderNo} />
                  <small>Unique order number for promotion</small>
                </div>
                
                <div className={`cert-field-compact ${touched.promotionDate && errors.promotionDate ? 'has-error' : ''}`}>
                  <label className="required">Promotion Date</label>
                  <input type="date" value={formData.promotionDate} onChange={(e) => handleChange('promotionDate', e.target.value)} onBlur={() => handleBlur('promotionDate')} />
                  <FieldError msg={errors.promotionDate} />
                  <small>Date of promotion approval</small>
                </div>
                
                <div className={`cert-field-compact ${touched.promotionType && errors.promotionType ? 'has-error' : ''}`}>
                  <label className="required">Promotion Type</label>
                  <select value={formData.promotionType} onChange={(e) => handleChange('promotionType', e.target.value)} onBlur={() => handleBlur('promotionType')}>
                    {promotionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <FieldError msg={errors.promotionType} />
                </div>
                
                <div className={`cert-field-compact ${touched.previousDesignation && errors.previousDesignation ? 'has-error' : ''}`}>
                  <label className="required">Previous Designation</label>
                  <select value={formData.previousDesignation} onChange={(e) => handleChange('previousDesignation', e.target.value)} onBlur={() => handleBlur('previousDesignation')}>
                    <option value="">Select Designation</option>
                    {designations.map(des => <option key={des.value} value={des.value}>{des.label}</option>)}
                  </select>
                  <FieldError msg={errors.previousDesignation} />
                </div>
                
                <div className={`cert-field-compact ${touched.newDesignation && errors.newDesignation ? 'has-error' : ''}`}>
                  <label className="required">New Designation</label>
                  <select value={formData.newDesignation} onChange={(e) => handleChange('newDesignation', e.target.value)} onBlur={() => handleBlur('newDesignation')}>
                    <option value="">Select Designation</option>
                    {designations.map(des => <option key={des.value} value={des.value}>{des.label}</option>)}
                  </select>
                  <FieldError msg={errors.newDesignation} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Previous Grade</label>
                  <select value={formData.previousGrade} onChange={(e) => handleChange('previousGrade', e.target.value)}>
                    <option value="">Select Grade</option>
                    {grades.map(grade => <option key={grade.value} value={grade.value}>{grade.label}</option>)}
                  </select>
                </div>
                
                <div className="cert-field-compact">
                  <label>New Grade</label>
                  <select value={formData.newGrade} onChange={(e) => handleChange('newGrade', e.target.value)}>
                    <option value="">Select Grade</option>
                    {grades.map(grade => <option key={grade.value} value={grade.value}>{grade.label}</option>)}
                  </select>
                </div>
                
                <div className={`cert-field-compact ${touched.effectiveDate && errors.effectiveDate ? 'has-error' : ''}`}>
                  <label className="required">Effective Date</label>
                  <input type="date" value={formData.effectiveDate} min={formData.promotionDate} onChange={(e) => handleChange('effectiveDate', e.target.value)} onBlur={() => handleBlur('effectiveDate')} />
                  <FieldError msg={errors.effectiveDate} />
                </div>
                
                <div className={`cert-field-compact ${touched.promotionAuthority && errors.promotionAuthority ? 'has-error' : ''}`}>
                  <label className="required">Promotion Authority</label>
                  <select value={formData.promotionAuthority} onChange={(e) => handleChange('promotionAuthority', e.target.value)} onBlur={() => handleBlur('promotionAuthority')}>
                    <option value="">Select Authority</option>
                    {promotionAuthorities.map(auth => <option key={auth.value} value={auth.value}>{auth.label}</option>)}
                  </select>
                  <FieldError msg={errors.promotionAuthority} />
                </div>
                
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Promotion Document</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} id="promotion-doc-upload" />
                    <label htmlFor="promotion-doc-upload" className="btn btn-outline-primary btn-sm">
                      <FaUpload size={12} /> Choose File
                    </label>
                    {formData.promotionDocumentName && (
                      <div className="mt-2 text-primary">
                        {formData.promotionDocumentName.endsWith('.pdf') ? <FaFilePdf /> : <FaFileImage />} {formData.promotionDocumentName}
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
                <FaSave size={12} /> {editingPromotion ? 'Update Promotion' : 'Save Promotion'}
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
                placeholder="Search by order number, designation or type..."
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

        

        {/* Promotions Table */}
<div className="cert-table-card">
  <div className="cert-table-wrap">
    <table className="cert-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Employee</th>
          <th>Order No.</th>
          <th>Promotion Date</th>
          <th>Previous Designation</th>
          <th>New Designation</th>
          <th>Previous Grade</th>
          <th>New Grade</th>
          <th>Promotion Type</th>
          <th>Effective Date</th>
          <th>Authority</th>
          <th>Document</th>
          <th style={{ width: 100 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentPromotions.length > 0 ? (
          currentPromotions.map((promo,idx) => (
            <tr key={promo.id}>
           <td className="text-center">{startIndex + idx + 1}</td>

               <td>                        
    {DUMMY_EMPLOYEES.find(e => e.id === promo.employeeId)?.name || 'Unknown'}
</td>
              <td><strong>{promo.promotionOrderNo}</strong></td>
              <td>{formatDate(promo.promotionDate)}</td>
              <td>{promo.previousDesignation}</td>
              <td>
                <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                  <FaArrowUp className="me-1" size={10} /> {promo.newDesignation}
                </span>
              </td>
              <td>{promo.previousGrade || '—'}</td>
              <td>{promo.newGrade || '—'}</td>
              <td>
                <span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  {promo.promotionType}
                </span>
              </td>
              <td>{formatDate(promo.effectiveDate)}</td>
              <td>{promo.promotionAuthority}</td>
              <td className="text-center">
                {promo.promotionDocumentName ? (
                  <a href={promo.promotionDocumentData} download={promo.promotionDocumentName} className="btn btn-sm btn-outline-primary">
                    <FaFileAlt size={12} /> View
                  </a>
                ) : <span className="text-muted">—</span>}
              </td>
              <td>
                <div className="cert-actions">
                  <button className="cert-act cert-act--edit" onClick={() => handleEdit(promo)} title="Edit">
                    <FaEdit size={12} />
                  </button>
                  <button className="cert-act cert-act--del" onClick={() => handleDelete(promo.id)} title="Delete">
                    <FaTrash size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="11" className="text-center py-5">No promotion records found</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
 {/* Pagination */}
{totalItems > 0 && (
  <div className="emp-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span className="emp-page-info">
        Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} events
      </span>
    </div>
    <div className="emp-page-controls">
      <button 
        className="emp-page-btn" 
        disabled={page === 0} 
        onClick={() => setPage(page - 1)}
      >
        ← Prev
      </button>
      {getPaginationRange().map((pg, i) =>
        pg === '...' ? (
          <span key={`dots-${i}`} className="emp-page-dots">…</span>
        ) : (
          <button 
            key={pg} 
            className={`emp-page-num ${pg === page ? 'active' : ''}`} 
            onClick={() => setPage(pg)}
          >
            {pg + 1}
          </button>
        )
      )}
      <button 
        className="emp-page-btn" 
        disabled={page + 1 >= totalPages} 
        onClick={() => setPage(page + 1)}
      >
        Next →
      </button>
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

export default PromotionHistory;