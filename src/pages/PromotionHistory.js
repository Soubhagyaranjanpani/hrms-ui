import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaArrowUp, FaBuilding,
  FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaChartLine, FaSearch, FaArrowLeft, FaEye,FaArrowRight,
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const PromotionHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [promotions, setPromotions] = useState(initialData?.promotions || [
    { id: 1, employeeId:1,promotionOrderNo: 'PROMO/2024/001', promotionDate: '2024-03-01', previousDesignation: 'Software Engineer', newDesignation: 'Senior Software Engineer', previousGrade: 'Grade A2', newGrade: 'Grade B1', promotionType: 'Merit', effectiveDate: '2024-03-01', promotionAuthority: 'HR Director', createdAt: '2024-03-01T10:30:00Z', promotionDocumentName: 'promotion_order.pdf', promotionDocumentData: null },
    { id: 2, employeeId:2,promotionOrderNo: 'PROMO/2024/002', promotionDate: '2024-06-15', previousDesignation: 'Senior Software Engineer', newDesignation: 'Tech Lead', previousGrade: 'Grade B1', newGrade: 'Grade C1', promotionType: 'Merit', effectiveDate: '2024-06-15', promotionAuthority: 'CEO', createdAt: '2024-06-15T11:45:00Z' },
    { id: 3, employeeId:3,promotionOrderNo: 'PROMO/2024/003', promotionDate: '2024-09-20', previousDesignation: 'HR Executive', newDesignation: 'HR Manager', previousGrade: 'Grade B1', newGrade: 'Grade C2', promotionType: 'Time Scale', effectiveDate: '2024-09-20', promotionAuthority: 'HR Director', createdAt: '2024-09-20T09:15:00Z', promotionDocumentName: 'promotion_letter.pdf', promotionDocumentData: null },
    { id: 4, employeeId:4,promotionOrderNo: 'PROMO/2024/004', promotionDate: '2024-11-10', previousDesignation: 'Tech Lead', newDesignation: 'Project Manager', previousGrade: 'Grade C1', newGrade: 'Grade D1', promotionType: 'Fast Track', effectiveDate: '2024-11-10', promotionAuthority: 'Board of Directors', createdAt: '2024-11-10T14:20:00Z' },
    { id: 5, employeeId:5,promotionOrderNo: 'PROMO/2024/005', promotionDate: '2024-12-01', previousDesignation: 'Accountant', newDesignation: 'Senior Accountant', previousGrade: 'Grade A2', newGrade: 'Grade B1', promotionType: 'Merit', effectiveDate: '2024-12-01', promotionAuthority: 'Finance Director', createdAt: '2024-12-01T10:00:00Z' }
  ]);
  
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null); 
  const [documentPreview, setDocumentPreview] = useState(null); 
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

  // Handle row click for detail view
  const handleRowClick = (promotion) => {
    setSelectedPromotion(promotion);
  };

  // Handle document view
  const handleViewDocument = (e, promotion) => {
    e.stopPropagation(); // Prevent row click
    if (promotion.promotionDocumentData) {
      setDocumentPreview({
        data: promotion.promotionDocumentData,
        name: promotion.promotionDocumentName
      });
    } else {
      toast.info('No Document', 'No document has been uploaded for this promotion');
    }
  };

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
  if (promotion.status === 'Inactive') {
    toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
    return;
  }
  
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
    setSelectedPromotion(null);
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
    
      const updatedPromotions = promotions.map((promo) =>
        promo.id === id
          ? {
              ...promo,
              status: newStatus
            }
          : promo
      );
    
      setPromotions(updatedPromotions);
    
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
          <h1 className="cert-title">Promotion History</h1>
          <p className="cert-subtitle">Manage employee promotion records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedPromotion && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Promotion
            </button>
          )}
           {(showForm || selectedPromotion) && (
                        <button 
                          type="button" 
                          className="cert-back-btn" 
                          onClick={handleBackToList}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                        >
                          <FaArrowLeft size={12} /> Back
                        </button>
                      )}
          {!showForm && !selectedPromotion && onCancel && (
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
          ) : selectedPromotion ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaArrowUp size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedPromotion.promotionOrderNo}</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaCalendarAlt/> {formatDate(selectedPromotion.createdAt)}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedPromotion.promotionType}</span></div>
            </div>
            {/* <button onClick={handleBackToList} style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',color:'white',padding:'8px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}><FaArrowLeft size={12}/> Back</button> */}
          </div>
          <div style={{padding:'32px'}}>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedPromotion.employeeId)?.name?.charAt(0)||'?'}</div>
              <div><h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedPromotion.employeeId)?.name||'Unknown'}</h3><span style={{fontSize:'13px',color:'#64748b'}}>{DUMMY_EMPLOYEES.find(e=>e.id===selectedPromotion.employeeId)?.code||''} • {selectedPromotion.newDesignation}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#fdf2f8',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#9d174d'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Promotion Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedPromotion.promotionDate)}</p></div>
              <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaChartLine size={16} style={{color:'#4f46e5'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Promotion Type</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:'#e0e7ff',color:'#4f46e5'}}>{selectedPromotion.promotionType}</span></div>
              <div style={{background:'#f8fafc',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaBuilding size={16} style={{color:'#6b7280'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Previous Designation</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedPromotion.previousDesignation}</p></div>
              <div style={{background:'#ecfdf5',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaArrowUp size={16} style={{color:'#059669'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>New Designation</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#059669',margin:0}}>{selectedPromotion.newDesignation}</p></div>
              <div style={{background:'#fffbeb',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaArrowRight size={16} style={{color:'#d97706'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Grade Progression</span></div><div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'14px'}}><span style={{color:'#6b7280',fontWeight:500}}>{selectedPromotion.previousGrade||'N/A'}</span><FaArrowRight size={12} style={{color:'#9d174d'}}/><span style={{fontWeight:600,color:'#9d174d'}}>{selectedPromotion.newGrade||'N/A'}</span></div></div>
              <div style={{background:'#ecfeff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#0891b2'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Effective Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedPromotion.effectiveDate)}</p></div>
              <div style={{background:'#faf5ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaBuilding size={16} style={{color:'#7c3aed'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Authority</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedPromotion.promotionAuthority}</p></div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaChartLine size={16} style={{color:'#ea580c'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedPromotion.status==='Active'?'#d1fae5':'#fee2e2',color:selectedPromotion.status==='Active'?'#065f46':'#991b1b'}}>{selectedPromotion.status||'Active'}</span></div>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}><FaFilePdf size={16} style={{color:'#dc2626'}}/> Promotion Order Document</h4>
              {selectedPromotion.promotionDocumentName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedPromotion.promotionDocumentName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}</div><div><p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedPromotion.promotionDocumentName}</p><span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded document</span></div></div>
                  <button onClick={(e)=>handleViewDocument(e,selectedPromotion)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}><FaEye size={14}/> View Document</button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}><FaFileAlt size={36} style={{marginBottom:'12px',opacity:0.3}}/><p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No document uploaded</p><span style={{fontSize:'13px'}}>No promotion order document has been uploaded</span></div>
              )}
            </div>
          </div>
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
          <th>Status</th>
          <th style={{ width: 100 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentPromotions.length > 0 ? (
          currentPromotions.map((promo,idx) => (
            <tr 
              key={promo.id}
              onClick={() => handleRowClick(promo)}
              style={{ cursor: 'pointer' }}
              className="cert-table-row-hover"
            >
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
                <span className="cert-status-badge" style={{ background: '#dd8aca', color: '#4f46e5' }}>
                  {promo.promotionType}
                </span>
              </td>
              <td>{formatDate(promo.effectiveDate)}</td>
              <td>{promo.promotionAuthority}</td>
             
                                 <td>
  <div
    className="d-flex align-items-center gap-1"
    style={{ cursor: "pointer" }}
    onClick={(e) => {
      e.stopPropagation();
      handleStatusToggle(
        promo.id,
        DUMMY_EMPLOYEES.find(e => e.id === promo.employeeId)?.name || "",
        promo.status || "Active"
      );
    }}
  >
    <div
      style={{
        width: "28px",
        height: "16px",
        borderRadius: "50px",
        backgroundColor:
          (promo.status || "Active") === "Active"
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
            (promo.status || "Active") === "Active"
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
          (promo.status || "Active") === "Active"
            ? "#9d174d"
            : "#94a3b8"
      }}
    >
      {promo.status || "Active"}
    </span>
  </div>
</td>
            
              <td>
  <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
    <button 
      className="cert-act cert-act--edit" 
      onClick={() => handleEdit(promo)} 
      title={promo.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
      disabled={promo.status === 'Inactive'}
      style={{ 
        opacity: promo.status === 'Inactive' ? 0.5 : 1,
        cursor: promo.status === 'Inactive' ? 'not-allowed' : 'pointer'
      }}
    >
      <FaEdit size={12} />
    </button>
  </div>
</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="14" className="text-center py-5">No promotion records found</td>
          </tr>
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
                Document Preview
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
                    alt="Document Preview" 
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
                    Uploaded document
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
                  <FaFileAlt /> Download
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

export default PromotionHistory;