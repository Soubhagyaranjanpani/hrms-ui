import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaUserCheck, 
  FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaCheckCircle
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ConfirmationDetails = ({ employeeId, employeeJoiningDate, initialData, onSuccess, onCancel }) => {
  const [confirmations, setConfirmations] = useState(initialData?.confirmations || []);
  const [editingConfirmation, setEditingConfirmation] = useState(null);
  const [formData, setFormData] = useState({
    confirmationOrderNo: '',
    confirmationDate: '',
    confirmedBy: '',
    remarks: '',
    confirmationDocument: null,
    confirmationDocumentData: null,
    confirmationDocumentName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);

  // Dummy data for Confirmed By dropdown
  const confirmedByOptions = [
    { value: 'HR Manager', label: 'HR Manager' },
    { value: 'Managing Director', label: 'Managing Director' },
    { value: 'CEO', label: 'CEO' },
    { value: 'Department Head', label: 'Department Head' },
    { value: 'Senior HR Officer', label: 'Senior HR Officer' }
  ];

  // Update existing order numbers
  useEffect(() => {
    setExistingOrderNos(confirmations.map(conf => conf.confirmationOrderNo));
  }, [confirmations]);

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
          confirmationDocument: file,
          confirmationDocumentData: reader.result,
          confirmationDocumentName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'confirmationOrderNo') {
      if (!value) error = 'Confirmation Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingConfirmation || editingConfirmation.confirmationOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'confirmationDate') {
      if (!value) error = 'Confirmation Date is required';
      else if (employeeJoiningDate) {
        const confirmationDate = new Date(value);
        const joiningDate = new Date(employeeJoiningDate);
        if (confirmationDate <= joiningDate) {
          error = 'Confirmation Date must be greater than Joining Date';
        }
      }
    }
    else if (field === 'confirmedBy' && !value) error = 'Confirmed By is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.confirmationOrderNo) {
      newErrors.confirmationOrderNo = 'Confirmation Order Number is required';
    } else if (existingOrderNos.includes(formData.confirmationOrderNo) && 
        (!editingConfirmation || editingConfirmation.confirmationOrderNo !== formData.confirmationOrderNo)) {
      newErrors.confirmationOrderNo = 'Order Number already exists';
    }
    
    if (!formData.confirmationDate) {
      newErrors.confirmationDate = 'Confirmation Date is required';
    } else if (employeeJoiningDate) {
      const confirmationDate = new Date(formData.confirmationDate);
      const joiningDate = new Date(employeeJoiningDate);
      if (confirmationDate <= joiningDate) {
        newErrors.confirmationDate = 'Confirmation Date must be greater than Joining Date';
      }
    }
    
    if (!formData.confirmedBy) {
      newErrors.confirmedBy = 'Confirmed By is required';
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
    
    if (editingConfirmation) {
      const updated = confirmations.map(conf =>
        conf.id === editingConfirmation.id
          ? { ...formData, id: conf.id, createdAt: conf.createdAt }
          : conf
      );
      setConfirmations(updated);
      toast.success('Success', 'Confirmation details updated successfully');
    } else {
      const newConfirmation = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      setConfirmations([newConfirmation, ...confirmations]);
      toast.success('Success', 'Confirmation details added successfully');
    }
    resetForm();
  };

  const handleEdit = (confirmation) => {
    setEditingConfirmation(confirmation);
    setFormData({
      confirmationOrderNo: confirmation.confirmationOrderNo,
      confirmationDate: confirmation.confirmationDate,
      confirmedBy: confirmation.confirmedBy,
      remarks: confirmation.remarks || '',
      confirmationDocument: null,
      confirmationDocumentData: confirmation.confirmationDocumentData,
      confirmationDocumentName: confirmation.confirmationDocumentName
    });
  };

  const handleDelete = (id) => {
    setConfirmations(confirmations.filter(conf => conf.id !== id));
    toast.success('Success', 'Confirmation record deleted successfully');
  };

  const resetForm = () => {
    setFormData({
      confirmationOrderNo: '',
      confirmationDate: '',
      confirmedBy: '',
      remarks: '',
      confirmationDocument: null,
      confirmationDocumentData: null,
      confirmationDocumentName: null
    });
    setErrors({});
    setTouched({});
    setEditingConfirmation(null);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaUserCheck className="text-primary" size={24} />
        </div>
        <div>
          <h3 className="mb-0">Confirmation Details</h3>
          <p className="text-muted mb-0 small">Manage employee probation confirmation records</p>
        </div>
      </div>

      {/* Joining Date Info Alert */}
      {employeeJoiningDate && (
        <div className="alert alert-info bg-opacity-10 border-0 mb-4">
          <div className="d-flex align-items-center gap-2">
            <FaCalendarAlt className="text-info" />
            <span>
              <strong>Employee Joining Date:</strong> {formatDate(employeeJoiningDate)}
              <small className="text-muted ms-2">Confirmation Date must be after this date</small>
            </span>
          </div>
        </div>
      )}

      {/* Confirmation Form - Direct show, no Add button */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold">
            {editingConfirmation ? '✏️ Edit Confirmation' : '✅ New Confirmation Record'}
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Confirmation Order Number */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Confirmation Order Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${touched.confirmationOrderNo && errors.confirmationOrderNo ? 'is-invalid' : ''}`}
                  placeholder="e.g., ARI/CONF/2024/001"
                  value={formData.confirmationOrderNo}
                  onChange={(e) => handleChange('confirmationOrderNo', e.target.value)}
                  onBlur={() => handleBlur('confirmationOrderNo')}
                />
                {errors.confirmationOrderNo && <small className="text-danger">{errors.confirmationOrderNo}</small>}
                <small className="text-muted">Unique order number for confirmation</small>
              </div>

              {/* Confirmation Date */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Confirmation Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${touched.confirmationDate && errors.confirmationDate ? 'is-invalid' : ''}`}
                  value={formData.confirmationDate}
                  min={employeeJoiningDate ? new Date(new Date(employeeJoiningDate).setDate(new Date(employeeJoiningDate).getDate() + 1)).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleChange('confirmationDate', e.target.value)}
                  onBlur={() => handleBlur('confirmationDate')}
                />
                {errors.confirmationDate && <small className="text-danger">{errors.confirmationDate}</small>}
                <small className="text-muted">Date when employee was confirmed</small>
              </div>

              {/* Confirmed By */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Confirmed By <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.confirmedBy && errors.confirmedBy ? 'is-invalid' : ''}`}
                  value={formData.confirmedBy}
                  onChange={(e) => handleChange('confirmedBy', e.target.value)}
                  onBlur={() => handleBlur('confirmedBy')}
                >
                  <option value="">Select Authority</option>
                  {confirmedByOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.confirmedBy && <small className="text-danger">{errors.confirmedBy}</small>}
              </div>

              {/* Remarks */}
              <div className="col-12">
                <label className="form-label fw-bold">Remarks</label>
                <textarea
                  rows="3"
                  className="form-control"
                  placeholder="Additional remarks about confirmation..."
                  value={formData.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                />
                <small className="text-muted">Optional: Any special notes or comments</small>
              </div>

              {/* Confirmation Document Upload */}
              <div className="col-12">
                <label className="form-label fw-bold">Confirmation Document</label>
                <div className="border rounded p-3 text-center bg-light">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="confirmation-doc-upload"
                  />
                  <label htmlFor="confirmation-doc-upload" className="btn btn-outline-primary btn-sm">
                    <FaUpload className="me-1" size={12} /> Choose File
                  </label>
                  {formData.confirmationDocumentName && (
                    <div className="mt-2 text-primary">
                      {formData.confirmationDocumentName.endsWith('.pdf') ? 
                        <FaFilePdf className="me-1" /> : <FaFileImage className="me-1" />}
                      {formData.confirmationDocumentName}
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
                <FaSave className="me-1" size={12} /> {editingConfirmation ? 'Update Confirmation' : 'Save Confirmation'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmations List Table */}
      {confirmations.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0 py-3">
            <h6 className="mb-0 fw-bold">📋 Confirmation History</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order No.</th>
                    <th>Confirmation Date</th>
                    <th>Confirmed By</th>
                    <th>Remarks</th>
                    <th>Document</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmations.map((conf) => (
                    <tr key={conf.id}>
                      <td><strong>{conf.confirmationOrderNo}</strong></td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          <FaCheckCircle className="me-1" size={10} /> {formatDate(conf.confirmationDate)}
                        </span>
                      </td>
                      <td>{conf.confirmedBy}</td>
                      <td>
                        {conf.remarks ? (
                          <span className="text-muted small">{conf.remarks}</span>
                        ) : (
                          <span className="text-muted fst-italic">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        {conf.confirmationDocumentName ? (
                          <a 
                            href={conf.confirmationDocumentData} 
                            download={conf.confirmationDocumentName}
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
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(conf)}>
                          <FaEdit size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(conf.id)}>
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

export default ConfirmationDetails;