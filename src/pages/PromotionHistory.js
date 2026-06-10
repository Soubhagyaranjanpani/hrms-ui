import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaArrowUp, FaBuilding,
  FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaChartLine
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const PromotionHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [promotions, setPromotions] = useState(initialData?.promotions || []);
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
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    if (editingPromotion) {
      const updated = promotions.map(promo =>
        promo.id === editingPromotion.id
          ? { ...formData, id: promo.id }
          : promo
      );
      setPromotions(updated);
      toast.success('Success', 'Promotion updated successfully');
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
  };

  const handleEdit = (promotion) => {
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
      promotionDocumentName: null
    });
    setErrors({});
    setTouched({});
    setEditingPromotion(null);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaChartLine className="text-primary" size={24} />
        </div>
        <div>
          <h3 className="mb-0">Promotion History</h3>
          <p className="text-muted mb-0 small">Manage employee promotion records</p>
        </div>
      </div>

      {/* Promotion Form - Direct show */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold">
            {editingPromotion ? '✏️ Edit Promotion' : '📈 New Promotion'}
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Promotion Order Number */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Promotion Order Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${touched.promotionOrderNo && errors.promotionOrderNo ? 'is-invalid' : ''}`}
                  placeholder="e.g., ARI/PROMO/2024/001"
                  value={formData.promotionOrderNo}
                  onChange={(e) => handleChange('promotionOrderNo', e.target.value)}
                  onBlur={() => handleBlur('promotionOrderNo')}
                />
                {errors.promotionOrderNo && <small className="text-danger">{errors.promotionOrderNo}</small>}
                <small className="text-muted">Unique order number for promotion</small>
              </div>

              {/* Promotion Date */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Promotion Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${touched.promotionDate && errors.promotionDate ? 'is-invalid' : ''}`}
                  value={formData.promotionDate}
                  onChange={(e) => handleChange('promotionDate', e.target.value)}
                  onBlur={() => handleBlur('promotionDate')}
                />
                {errors.promotionDate && <small className="text-danger">{errors.promotionDate}</small>}
                <small className="text-muted">Date of promotion approval</small>
              </div>

              {/* Promotion Type */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Promotion Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.promotionType && errors.promotionType ? 'is-invalid' : ''}`}
                  value={formData.promotionType}
                  onChange={(e) => handleChange('promotionType', e.target.value)}
                  onBlur={() => handleBlur('promotionType')}
                >
                  {promotionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.promotionType && <small className="text-danger">{errors.promotionType}</small>}
              </div>

              {/* Previous Designation */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  Previous Designation <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.previousDesignation && errors.previousDesignation ? 'is-invalid' : ''}`}
                  value={formData.previousDesignation}
                  onChange={(e) => handleChange('previousDesignation', e.target.value)}
                  onBlur={() => handleBlur('previousDesignation')}
                >
                  <option value="">Select Designation</option>
                  {designations.map(des => (
                    <option key={des.value} value={des.value}>{des.label}</option>
                  ))}
                </select>
                {errors.previousDesignation && <small className="text-danger">{errors.previousDesignation}</small>}
              </div>

              {/* New Designation */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  New Designation <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.newDesignation && errors.newDesignation ? 'is-invalid' : ''}`}
                  value={formData.newDesignation}
                  onChange={(e) => handleChange('newDesignation', e.target.value)}
                  onBlur={() => handleBlur('newDesignation')}
                >
                  <option value="">Select Designation</option>
                  {designations.map(des => (
                    <option key={des.value} value={des.value}>{des.label}</option>
                  ))}
                </select>
                {errors.newDesignation && <small className="text-danger">{errors.newDesignation}</small>}
              </div>

              {/* Previous Grade */}
              <div className="col-md-3">
                <label className="form-label fw-bold">Previous Grade</label>
                <select
                  className="form-select"
                  value={formData.previousGrade}
                  onChange={(e) => handleChange('previousGrade', e.target.value)}
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade.value} value={grade.value}>{grade.label}</option>
                  ))}
                </select>
              </div>

              {/* New Grade */}
              <div className="col-md-3">
                <label className="form-label fw-bold">New Grade</label>
                <select
                  className="form-select"
                  value={formData.newGrade}
                  onChange={(e) => handleChange('newGrade', e.target.value)}
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade.value} value={grade.value}>{grade.label}</option>
                  ))}
                </select>
              </div>

              {/* Effective Date */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Effective Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${touched.effectiveDate && errors.effectiveDate ? 'is-invalid' : ''}`}
                  value={formData.effectiveDate}
                  min={formData.promotionDate || undefined}
                  onChange={(e) => handleChange('effectiveDate', e.target.value)}
                  onBlur={() => handleBlur('effectiveDate')}
                />
                {errors.effectiveDate && <small className="text-danger">{errors.effectiveDate}</small>}
                <small className="text-muted">Date when promotion takes effect</small>
              </div>

              {/* Promotion Authority */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Promotion Authority <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.promotionAuthority && errors.promotionAuthority ? 'is-invalid' : ''}`}
                  value={formData.promotionAuthority}
                  onChange={(e) => handleChange('promotionAuthority', e.target.value)}
                  onBlur={() => handleBlur('promotionAuthority')}
                >
                  <option value="">Select Authority</option>
                  {promotionAuthorities.map(auth => (
                    <option key={auth.value} value={auth.value}>{auth.label}</option>
                  ))}
                </select>
                {errors.promotionAuthority && <small className="text-danger">{errors.promotionAuthority}</small>}
              </div>

              {/* Promotion Document Upload */}
              <div className="col-12">
                <label className="form-label fw-bold">Promotion Document</label>
                <div className="border rounded p-3 text-center bg-light">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="promotion-doc-upload"
                  />
                  <label htmlFor="promotion-doc-upload" className="btn btn-outline-primary btn-sm">
                    <FaUpload className="me-1" size={12} /> Choose File
                  </label>
                  {formData.promotionDocumentName && (
                    <div className="mt-2 text-primary">
                      {formData.promotionDocumentName.endsWith('.pdf') ? 
                        <FaFilePdf className="me-1" /> : <FaFileImage className="me-1" />}
                      {formData.promotionDocumentName}
                    </div>
                  )}
                  <small className="text-muted d-block mt-2">Supported: PDF, JPG, PNG (Max 5MB)</small>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                 Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <FaSave className="me-1" size={12} /> {editingPromotion ? 'Update Promotion' : 'Save Promotion'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Promotions List Table */}
      {promotions.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0 py-3">
            <h6 className="mb-0 fw-bold">📋 Promotion History</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order No.</th>
                    <th>Promotion Date</th>
                    <th>From Designation</th>
                    <th>To Designation</th>
                    <th>Type</th>
                    <th>Effective Date</th>
                    <th>Authority</th>
                    <th>Document</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promo) => (
                    <tr key={promo.id}>
                      <td><strong>{promo.promotionOrderNo}</strong></td>
                      <td>{formatDate(promo.promotionDate)}</td>
                      <td>{promo.previousDesignation}</td>
                      <td>
                        <span className="badge bg-success bg-opacity-10 text-success">
                          <FaArrowUp className="me-1" size={10} /> {promo.newDesignation}
                        </span>
                       </td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {promo.promotionType}
                        </span>
                       </td>
                      <td>{formatDate(promo.effectiveDate)}</td>
                      <td>{promo.promotionAuthority}</td>
                      <td className="text-center">
                        {promo.promotionDocumentName ? (
                          <a 
                            href={promo.promotionDocumentData} 
                            download={promo.promotionDocumentName}
                            className="btn btn-sm btn-outline-primary"
                            title="Download Document"
                          >
                            <FaFileAlt size={12} className="me-1" /> View
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(promo)}>
                          <FaEdit size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(promo.id)}>
                          <FaTrash size={12} />
                        </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
               </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionHistory;