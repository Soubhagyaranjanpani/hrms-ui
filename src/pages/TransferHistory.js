import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaExchangeAlt, FaBuilding, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaMapMarkerAlt, 
  FaBriefcase, FaFileAlt, FaSearch,FaArrowRight,
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const TransferHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [transfers, setTransfers] = useState(initialData?.transfers || []);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [formData, setFormData] = useState({
    transferOrderNo: '',
    transferDate: '',
    transferType: 'Permanent',
    fromDepartment: '',
    toDepartment: '',
    fromBranch: '',
    toBranch: '',
    effectiveDate: '',
    transferReason: '',
    transferOrderFile: null,
    transferOrderFileData: null,
    transferOrderFileName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);

  // Dummy data for dropdowns
  const transferTypes = [
    { value: 'Permanent', label: 'Permanent Transfer' },
    { value: 'Temporary', label: 'Temporary Transfer' },
    { value: 'On Deputation', label: 'On Deputation' },
    { value: 'Contractual', label: 'Contractual Transfer' },
    { value: 'Project Based', label: 'Project Based' }
  ];

  const departments = [
    { id: 1, name: 'IT' },
    { id: 2, name: 'HR' },
    { id: 3, name: 'Finance' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'Marketing' },
    { id: 6, name: 'Operations' },
    { id: 7, name: 'Legal' }
  ];

  const branches = [
    { id: 1, name: 'Mumbai - Head Office' },
    { id: 2, name: 'Delhi - North Region' },
    { id: 3, name: 'Bangalore - South Region' },
    { id: 4, name: 'Chennai - East Region' },
    { id: 5, name: 'Kolkata - East Region' },
    { id: 6, name: 'Pune - West Region' },
    { id: 7, name: 'Hyderabad - Central Region' }
  ];

  // Update existing order numbers
  useEffect(() => {
    setExistingOrderNos(transfers.map(transfer => transfer.transferOrderNo));
  }, [transfers]);

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
          transferOrderFile: file,
          transferOrderFileData: reader.result,
          transferOrderFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'transferOrderNo') {
      if (!value) error = 'Transfer Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingTransfer || editingTransfer.transferOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'transferDate' && !value) error = 'Transfer Date is required';
    else if (field === 'transferType' && !value) error = 'Transfer Type is required';
    else if (field === 'fromDepartment' && !value) error = 'From Department is required';
    else if (field === 'toDepartment' && !value) error = 'To Department is required';
    else if (field === 'fromBranch' && !value) error = 'From Branch is required';
    else if (field === 'toBranch' && !value) error = 'To Branch is required';
    else if (field === 'effectiveDate' && !value) error = 'Effective Date is required';
    else if (field === 'transferReason' && !value) error = 'Transfer Reason is required';
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.transferOrderNo) {
      newErrors.transferOrderNo = 'Transfer Order Number is required';
    } else if (existingOrderNos.includes(formData.transferOrderNo) && 
        (!editingTransfer || editingTransfer.transferOrderNo !== formData.transferOrderNo)) {
      newErrors.transferOrderNo = 'Order Number already exists';
    }
    
    if (!formData.transferDate) newErrors.transferDate = 'Transfer Date is required';
    if (!formData.transferType) newErrors.transferType = 'Transfer Type is required';
    if (!formData.fromDepartment) newErrors.fromDepartment = 'From Department is required';
    if (!formData.toDepartment) newErrors.toDepartment = 'To Department is required';
    if (!formData.fromBranch) newErrors.fromBranch = 'From Branch is required';
    if (!formData.toBranch) newErrors.toBranch = 'To Branch is required';
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective Date is required';
    if (!formData.transferReason) newErrors.transferReason = 'Transfer Reason is required';
    
    // Validate effective date >= transfer date
    if (formData.transferDate && formData.effectiveDate) {
      if (new Date(formData.effectiveDate) < new Date(formData.transferDate)) {
        newErrors.effectiveDate = 'Effective Date must be on or after Transfer Date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    
    if (editingTransfer) {
      const updated = transfers.map(transfer =>
        transfer.id === editingTransfer.id
          ? { ...formData, id: transfer.id }
          : transfer
      );
      setTransfers(updated);
      toast.success('Success', 'Transfer updated successfully');
    } else {
      const newTransfer = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      setTransfers([newTransfer, ...transfers]);
      toast.success('Success', 'Transfer added successfully');
    }
    resetForm();
  };

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer);
    setFormData({
      transferOrderNo: transfer.transferOrderNo,
      transferDate: transfer.transferDate,
      transferType: transfer.transferType,
      fromDepartment: transfer.fromDepartment,
      toDepartment: transfer.toDepartment,
      fromBranch: transfer.fromBranch,
      toBranch: transfer.toBranch,
      effectiveDate: transfer.effectiveDate,
      transferReason: transfer.transferReason,
      transferOrderFile: null,
      transferOrderFileData: transfer.transferOrderFileData,
      transferOrderFileName: transfer.transferOrderFileName
    });
  };

  const handleDelete = (id) => {
    setTransfers(transfers.filter(transfer => transfer.id !== id));
    toast.success('Success', 'Transfer deleted successfully');
  };

  const resetForm = () => {
    setFormData({
      transferOrderNo: '',
      transferDate: '',
      transferType: 'Permanent',
      fromDepartment: '',
      toDepartment: '',
      fromBranch: '',
      toBranch: '',
      effectiveDate: '',
      transferReason: '',
      transferOrderFile: null,
      transferOrderFileData: null,
      transferOrderFileName: null
    });
    setErrors({});
    setTouched({});
    setEditingTransfer(null);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
          <FaExchangeAlt className="text-primary" size={24} />
        </div>
        <div>
          <h5 className="mb-0">Transfer History</h5>
          <p className="text-muted mb-0 small">Manage employee transfer records</p>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light border-0 py-3">
          <h6 className="mb-0 fw-bold">
            {editingTransfer ? '✏️ Edit Transfer' : '📍 New Transfer'}
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Transfer Order Number */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Transfer Order Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${touched.transferOrderNo && errors.transferOrderNo ? 'is-invalid' : ''}`}
                  placeholder="e.g., ARI/TRF/2024/001"
                  value={formData.transferOrderNo}
                  onChange={(e) => handleChange('transferOrderNo', e.target.value)}
                  onBlur={() => handleBlur('transferOrderNo')}
                />
                {errors.transferOrderNo && <small className="text-danger">{errors.transferOrderNo}</small>}
                <small className="text-muted">Unique order number for transfer</small>
              </div>

              {/* Transfer Date */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Transfer Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${touched.transferDate && errors.transferDate ? 'is-invalid' : ''}`}
                  value={formData.transferDate}
                  onChange={(e) => handleChange('transferDate', e.target.value)}
                  onBlur={() => handleBlur('transferDate')}
                />
                {errors.transferDate && <small className="text-danger">{errors.transferDate}</small>}
                <small className="text-muted">Date of transfer approval</small>
              </div>

              {/* Transfer Type */}
              <div className="col-md-4">
                <label className="form-label fw-bold">
                  Transfer Type <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.transferType && errors.transferType ? 'is-invalid' : ''}`}
                  value={formData.transferType}
                  onChange={(e) => handleChange('transferType', e.target.value)}
                  onBlur={() => handleBlur('transferType')}
                >
                  {transferTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.transferType && <small className="text-danger">{errors.transferType}</small>}
              </div>

              {/* From Department */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  From Department <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.fromDepartment && errors.fromDepartment ? 'is-invalid' : ''}`}
                  value={formData.fromDepartment}
                  onChange={(e) => handleChange('fromDepartment', e.target.value)}
                  onBlur={() => handleBlur('fromDepartment')}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
                {errors.fromDepartment && <small className="text-danger">{errors.fromDepartment}</small>}
              </div>

              {/* To Department */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  To Department <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.toDepartment && errors.toDepartment ? 'is-invalid' : ''}`}
                  value={formData.toDepartment}
                  onChange={(e) => handleChange('toDepartment', e.target.value)}
                  onBlur={() => handleBlur('toDepartment')}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
                {errors.toDepartment && <small className="text-danger">{errors.toDepartment}</small>}
              </div>

              {/* From Branch */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  From Branch <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.fromBranch && errors.fromBranch ? 'is-invalid' : ''}`}
                  value={formData.fromBranch}
                  onChange={(e) => handleChange('fromBranch', e.target.value)}
                  onBlur={() => handleBlur('fromBranch')}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
                {errors.fromBranch && <small className="text-danger">{errors.fromBranch}</small>}
              </div>

              {/* To Branch */}
              <div className="col-md-3">
                <label className="form-label fw-bold">
                  To Branch <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${touched.toBranch && errors.toBranch ? 'is-invalid' : ''}`}
                  value={formData.toBranch}
                  onChange={(e) => handleChange('toBranch', e.target.value)}
                  onBlur={() => handleBlur('toBranch')}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
                {errors.toBranch && <small className="text-danger">{errors.toBranch}</small>}
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
                  min={formData.transferDate || undefined}
                  onChange={(e) => handleChange('effectiveDate', e.target.value)}
                  onBlur={() => handleBlur('effectiveDate')}
                />
                {errors.effectiveDate && <small className="text-danger">{errors.effectiveDate}</small>}
                <small className="text-muted">Date when transfer takes effect</small>
              </div>

              {/* Transfer Reason */}
              <div className="col-md-8">
                <label className="form-label fw-bold">
                  Transfer Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  rows="2"
                  className={`form-control ${touched.transferReason && errors.transferReason ? 'is-invalid' : ''}`}
                  placeholder="e.g., Promotion, Department restructuring, Project requirement, etc."
                  value={formData.transferReason}
                  onChange={(e) => handleChange('transferReason', e.target.value)}
                  onBlur={() => handleBlur('transferReason')}
                />
                {errors.transferReason && <small className="text-danger">{errors.transferReason}</small>}
              </div>

              {/* Transfer Order Upload */}
              <div className="col-12">
                <label className="form-label fw-bold">Transfer Order Upload</label>
                <div className="border rounded p-3 text-center bg-light">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="transfer-order-upload"
                  />
                  <label htmlFor="transfer-order-upload" className="btn btn-outline-primary btn-sm">
                    <FaUpload className="me-1" size={12} /> Choose File
                  </label>
                  {formData.transferOrderFileName && (
                    <div className="mt-2 text-primary">
                      {formData.transferOrderFileName.endsWith('.pdf') ? 
                        <FaFilePdf className="me-1" /> : <FaFileImage className="me-1" />}
                      {formData.transferOrderFileName}
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
                <FaSave className="me-1" size={12} /> {editingTransfer ? 'Update Transfer' : 'Save Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Transfers List Table */}
      {transfers.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light border-0 py-3">
            <h6 className="mb-0 fw-bold">📋 Transfer History</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order No.</th>
                    <th>Transfer Date</th>
                    <th>From → To</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th>Type</th>
                    <th>Effective Date</th>
                    <th>Document</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td><strong>{transfer.transferOrderNo}</strong></td>
                      <td>{formatDate(transfer.transferDate)}</td>
                      <td>
                        <span className="text-muted">{transfer.fromBranch}</span>
                        <FaArrowRight className="mx-1 text-primary" size={10} />
                        <span className="fw-bold text-success">{transfer.toBranch}</span>
                      </td>
                      <td>
                        {transfer.fromDepartment} 
                        <FaArrowRight className="mx-1 text-primary" size={10} />
                        {transfer.toDepartment}
                      </td>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-info">
                          {transfer.transferType}
                        </span>
                      </td>
                      <td>{formatDate(transfer.effectiveDate)}</td>
                      <td className="text-center">
                        {transfer.transferOrderFileName ? (
                          <a 
                            href={transfer.transferOrderFileData} 
                            download={transfer.transferOrderFileName}
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
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(transfer)}>
                          <FaEdit size={12} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(transfer.id)}>
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

export default TransferHistory;