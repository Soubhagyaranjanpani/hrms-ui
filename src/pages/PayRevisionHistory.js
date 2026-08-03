import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaRupeeSign, FaCalendarAlt, FaUpload,
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaChartLine,
  FaFileAlt, FaSearch, FaArrowUp, FaMoneyBillWave, FaUserTie, FaArrowLeft, FaEye, FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';

const PayRevisionHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  // ─── State ──────────────────────────────────────────────────
  const [revisions, setRevisions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [revisionReasons, setRevisionReasons] = useState([]); // fetched from API
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingRevision, setEditingRevision] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  const [formData, setFormData] = useState({
    payRevisionOrderNumber: '',
    effectiveDate: '',
    previousPayScaleMin: '',
    previousPayScaleMax: '',
    revisedPayScaleMin: '',
    revisedPayScaleMax: '',
    reasonId: '',
    remarks: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [totalElements, setTotalElements] = useState(0);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, name: '', newStatus: '' });
  const [showDocumentActions, setShowDocumentActions] = useState(false);

  // ─── Token helpers ──────────────────────────────────────────
  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const getAxiosConfig = () => ({
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  });
  const ensureToken = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication Required', 'Please login to continue');
      return false;
    }
    return true;
  };

  // ─── Data fetching ──────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/employees`, {
        ...getAxiosConfig(),
        params: { size: 1000, page: 0 }
      });
      if (res.data?.status === 200) {
        let empData = Array.isArray(res.data.response)
          ? res.data.response
          : (res.data.response?.content || res.data.response?.data || []);
        setEmployees(empData);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch employees');
      setEmployees([]);
    }
  }, []);

  const fetchRevisionReasons = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/pay-revision-reasons`, getAxiosConfig());
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        data = res.data.response;
      } else if (res.data?.response?.content) {
        data = res.data.response.content;
      }
      setRevisionReasons(data.map(item => ({
        id: item.id,
        name: item.reason || item.name || ''
      })));
    } catch (err) {
      console.error('Fetch revision reasons error:', err);
      // Fallback to static list
      setRevisionReasons([
        { id: 1, name: 'Annual Performance Increment' },
        { id: 2, name: 'Promotion' },
        { id: 3, name: 'Market Correction' },
        { id: 4, name: 'Performance Based' },
        { id: 5, name: 'Grade Revision' },
        { id: 6, name: 'Special Allowance' },
        { id: 7, name: 'Contract Renewal' },
        { id: 8, name: 'Retention Bonus' }
      ]);
    }
  }, []);

  const fetchPayRevisions = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const params = {
        search: searchTerm || '',
        page: page,
        size: rowsPerPage
      };
      const res = await axios.get(`${BASE_URL}/api/pay-revisions`, { ...getAxiosConfig(), params });
      if (res.data?.status === 200) {
        const content = res.data.response?.content || [];
        setRevisions(content);
        setTotalElements(res.data.response?.totalElements || content.length);
      } else {
        setRevisions([]);
        setTotalElements(0);
      }
    } catch (err) {
      console.error('Fetch pay revisions error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch pay revisions');
      setRevisions([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, rowsPerPage]);

  // ─── Load data on mount ────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      await fetchEmployees();
      await fetchRevisionReasons();
      await fetchPayRevisions();
    };
    loadAll();
  }, [fetchEmployees, fetchRevisionReasons, fetchPayRevisions]);

  // ─── Update existing order numbers ─────────────────────────
  useEffect(() => {
    setExistingOrderNos(revisions.map(r => r.payRevisionOrderNumber).filter(Boolean));
  }, [revisions]);

  // ─── Helpers ────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : 'Unknown';
  };
  const getEmployeeCode = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.employeeCode || emp.code : '—';
  };
  const getEmployeeDepartment = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.department || emp.departmentName : '—';
  };
  const getEmployeeDesignation = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.designation || emp.designationName : '—';
  };

  const getReasonName = (reasonId) => {
    const found = revisionReasons.find(r => r.id === reasonId);
    return found ? found.name : reasonId;
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '—';
    return `₹${Number(value).toLocaleString()}`;
  };

  const formatPayScale = (min, max) => {
    if (!min && !max) return '—';
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  // ─── Form handlers ──────────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'payRevisionOrderNumber') {
      if (!value) error = 'Revision Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingRevision || editingRevision.payRevisionOrderNumber !== value)) {
        error = 'This Order Number already exists';
      }
    } else if (field === 'effectiveDate' && !value) {
      error = 'Effective Date is required';
    } else if (field === 'previousPayScaleMin') {
      if (value === '' || isNaN(value) || Number(value) < 0) error = 'Valid minimum amount is required';
    } else if (field === 'previousPayScaleMax') {
      if (value === '' || isNaN(value) || Number(value) < 0) error = 'Valid maximum amount is required';
      else if (formData.previousPayScaleMin && Number(value) < Number(formData.previousPayScaleMin)) {
        error = 'Max must be >= Min';
      }
    } else if (field === 'revisedPayScaleMin') {
      if (value === '' || isNaN(value) || Number(value) < 0) error = 'Valid minimum amount is required';
      else if (formData.previousPayScaleMin && Number(value) < Number(formData.previousPayScaleMin)) {
        error = 'Revised min cannot be less than previous min';
      }
    } else if (field === 'revisedPayScaleMax') {
      if (value === '' || isNaN(value) || Number(value) < 0) error = 'Valid maximum amount is required';
      else if (formData.revisedPayScaleMin && Number(value) < Number(formData.revisedPayScaleMin)) {
        error = 'Max must be >= Min';
      }
    } else if (field === 'reasonId' && !value) {
      error = 'Revision Reason is required';
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.payRevisionOrderNumber) {
      newErrors.payRevisionOrderNumber = 'Revision Order Number is required';
    } else if (existingOrderNos.includes(formData.payRevisionOrderNumber) &&
      (!editingRevision || editingRevision.payRevisionOrderNumber !== formData.payRevisionOrderNumber)) {
      newErrors.payRevisionOrderNumber = 'Order Number already exists';
    }
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective Date is required';
    if (!formData.previousPayScaleMin) newErrors.previousPayScaleMin = 'Previous Min is required';
    if (!formData.previousPayScaleMax) newErrors.previousPayScaleMax = 'Previous Max is required';
    if (!formData.revisedPayScaleMin) newErrors.revisedPayScaleMin = 'Revised Min is required';
    if (!formData.revisedPayScaleMax) newErrors.revisedPayScaleMax = 'Revised Max is required';
    if (!formData.reasonId) newErrors.reasonId = 'Revision Reason is required';

    // Additional validations
    if (formData.previousPayScaleMin && formData.previousPayScaleMax &&
      Number(formData.previousPayScaleMax) < Number(formData.previousPayScaleMin)) {
      newErrors.previousPayScaleMax = 'Max must be >= Min';
    }
    if (formData.revisedPayScaleMin && formData.revisedPayScaleMax &&
      Number(formData.revisedPayScaleMax) < Number(formData.revisedPayScaleMin)) {
      newErrors.revisedPayScaleMax = 'Max must be >= Min';
    }
    if (formData.previousPayScaleMin && formData.revisedPayScaleMin &&
      Number(formData.revisedPayScaleMin) < Number(formData.previousPayScaleMin)) {
      newErrors.revisedPayScaleMin = 'Revised min cannot be less than previous min';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit (Create / Update) ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    if (!selectedEmployee) {
      toast.warning('Validation Error', 'Please select an employee');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: selectedEmployee.id,
        payRevisionOrderNumber: formData.payRevisionOrderNumber.trim(),
        effectiveDate: formData.effectiveDate,
        previousPayScaleMin: Number(formData.previousPayScaleMin),
        previousPayScaleMax: Number(formData.previousPayScaleMax),
        revisedPayScaleMin: Number(formData.revisedPayScaleMin),
        revisedPayScaleMax: Number(formData.revisedPayScaleMax),
        reasonId: Number(formData.reasonId),
        remarks: formData.remarks || '',
      };

      const url = editingRevision
        ? `${BASE_URL}/api/pay-revisions/${editingRevision.id}/update`
        : `${BASE_URL}/api/pay-revisions/create`;
      const method = editingRevision ? 'put' : 'post';

      const res = await axios[method](url, payload, getAxiosConfig());

      if (res.data?.status === 200 || res.data?.status === 201) {
        toast.success('Success', editingRevision ? 'Pay revision updated' : 'Pay revision added');
        resetForm();
        setShowForm(false);
        await fetchPayRevisions();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Error', err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Edit ──────────────────────────────────────────────────
  const handleEdit = (revision) => {
    if (revision.isActive === false) {
      toast.warning('Inactive', 'Cannot edit an inactive record');
      return;
    }
    const emp = employees.find(e => e.id === revision.employeeId);
    if (emp) {
      setSelectedEmployee(emp);
      setEmployeeSearchTerm(emp.name);
    } else {
      setSelectedEmployee(null);
      setEmployeeSearchTerm('');
    }

    setEditingRevision(revision);
    setFormData({
      payRevisionOrderNumber: revision.payRevisionOrderNumber || '',
      effectiveDate: revision.effectiveDate || '',
      previousPayScaleMin: revision.previousPayScaleMin?.toString() || '',
      previousPayScaleMax: revision.previousPayScaleMax?.toString() || '',
      revisedPayScaleMin: revision.revisedPayScaleMin?.toString() || '',
      revisedPayScaleMax: revision.revisedPayScaleMax?.toString() || '',
      reasonId: revision.reasonId?.toString() || '',
      remarks: revision.remarks || '',
    });
    setShowForm(true);
  };

  // ─── Reset form ─────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      payRevisionOrderNumber: '',
      effectiveDate: '',
      previousPayScaleMin: '',
      previousPayScaleMax: '',
      revisedPayScaleMin: '',
      revisedPayScaleMax: '',
      reasonId: '',
      remarks: '',
    });
    setErrors({});
    setTouched({});
    setEditingRevision(null);
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
    setSelectedRevision(null);
    setShowDocumentActions(false);
    if (documentPreview?.data) URL.revokeObjectURL(documentPreview.data);
    setDocumentPreview(null);
  };

  // ─── Status toggle ──────────────────────────────────────────
  const handleStatusToggle = (id, name, currentIsActive) => {
    const newStatus = currentIsActive ? 'Inactive' : 'Active';
    setStatusAction({ id, name, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    const { id, newStatus } = statusAction;
    setLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/pay-revisions/${id}/status`,
        null,
        { ...getAxiosConfig(), params: { active: newStatus === 'Active' } }
      );
      if (res.data?.status === 200) {
        toast.success('Status Updated', 'Pay revision status changed');
        await fetchPayRevisions();
      } else {
        throw new Error(res.data?.message || 'Status change failed');
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Failed to change status');
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, name: '', newStatus: '' });
    }
  };

  // ─── View Document ──────────────────────────────────────────
  const handleViewDocument = async (e, revision) => {
    e.stopPropagation();
    setSelectedRevision(revision);
    setShowDocumentActions(true);

    if (!revision.documentName) {
      toast.info('No Document', 'No document has been uploaded for this pay revision');
      return;
    }

    setDocLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/pay-revisions/${revision.id}/document`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(res.data);
      setDocumentPreview({ data: blobUrl, name: revision.documentName });
    } catch (err) {
      console.error('Document fetch error:', err);
      toast.error('Error', 'Failed to load document');
    } finally {
      setDocLoading(false);
    }
  };

  // ─── Employee dropdown ──────────────────────────────────────
  const filteredEmployees = employees.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return (emp.name?.toLowerCase().includes(search) ||
            emp.employeeCode?.toLowerCase().includes(search) ||
            emp.email?.toLowerCase().includes(search));
  });

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearchTerm(employee.name);
    setShowEmployeeDropdown(false);
  };

  // ─── Pagination ─────────────────────────────────────────────
  const totalItems = totalElements;
  const totalPages = Math.ceil(totalItems / rowsPerPage);

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

  const handleRowClick = (revision) => {
    setSelectedRevision(revision);
  };

  const handleGenerateLetter = (revision) => {
    console.log('Generate letter for:', revision.payRevisionOrderNumber);
  };

  // ─── Render ──────────────────────────────────────────────────
  if (loading && revisions.length === 0) {
    return <LoadingSpinner message="Loading pay revisions..." />;
  }

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Pay Revision History</h1>
          <p className="cert-subtitle">Manage employee salary revision records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedRevision && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Pay Revision
            </button>
          )}
          {(showForm || selectedRevision) && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedRevision && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        // ─── FORM VIEW ──────────────────────────────────────────────
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Pay Revision Details</div>
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
                          if (employeeSearchTerm.length > 0) setShowEmployeeDropdown(true);
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
                                  <small className="text-muted">Code: {emp.employeeCode || emp.code} | Dept: {emp.department || emp.departmentName}</small>
                                </div>
                                <div><span className="badge bg-light text-dark">{emp.designation || emp.designationName}</span></div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-3 text-muted"><small>No employees found</small></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cert-field-compact">
                  <label>Employee Code</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.employeeCode || selectedEmployee?.code || ''} readOnly placeholder="Auto-populated" />
                </div>

                <div className="cert-field-compact">
                  <label>Department</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.department || selectedEmployee?.departmentName || ''} readOnly placeholder="Auto-populated" />
                </div>

                <div className="cert-field-compact">
                  <label>Designation</label>
                  <input type="text" className="form-control bg-light" value={selectedEmployee?.designation || selectedEmployee?.designationName || ''} readOnly placeholder="Auto-populated" />
                </div>

                <div className={`cert-field-compact ${touched.payRevisionOrderNumber && errors.payRevisionOrderNumber ? 'has-error' : ''}`}>
                  <label className="required">Revision Order Number</label>
                  <input type="text" placeholder="e.g., PAY/2024/001" value={formData.payRevisionOrderNumber} onChange={(e) => handleChange('payRevisionOrderNumber', e.target.value)} onBlur={() => handleBlur('payRevisionOrderNumber')} />
                  <FieldError msg={errors.payRevisionOrderNumber} />
                </div>

                <div className={`cert-field-compact ${touched.effectiveDate && errors.effectiveDate ? 'has-error' : ''}`}>
                  <label className="required">Effective Date</label>
                  <input type="date" value={formData.effectiveDate} onChange={(e) => handleChange('effectiveDate', e.target.value)} onBlur={() => handleBlur('effectiveDate')} />
                  <FieldError msg={errors.effectiveDate} />
                </div>

                <div className={`cert-field-compact ${touched.reasonId && errors.reasonId ? 'has-error' : ''}`}>
                  <label className="required">Revision Reason</label>
                  <select value={formData.reasonId} onChange={(e) => handleChange('reasonId', e.target.value)} onBlur={() => handleBlur('reasonId')}>
                    <option value="">Select Reason</option>
                    {revisionReasons.map(reason => (
                      <option key={reason.id} value={reason.id}>{reason.name}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.reasonId} />
                </div>

                <div className={`cert-field-compact ${touched.previousPayScaleMin && errors.previousPayScaleMin ? 'has-error' : ''}`}>
                  <label className="required">Previous Pay Scale (Min)</label>
                  <input type="number" placeholder="e.g., 50000" value={formData.previousPayScaleMin} onChange={(e) => handleChange('previousPayScaleMin', e.target.value)} onBlur={() => handleBlur('previousPayScaleMin')} />
                  <FieldError msg={errors.previousPayScaleMin} />
                </div>

                <div className={`cert-field-compact ${touched.previousPayScaleMax && errors.previousPayScaleMax ? 'has-error' : ''}`}>
                  <label className="required">Previous Pay Scale (Max)</label>
                  <input type="number" placeholder="e.g., 80000" value={formData.previousPayScaleMax} onChange={(e) => handleChange('previousPayScaleMax', e.target.value)} onBlur={() => handleBlur('previousPayScaleMax')} />
                  <FieldError msg={errors.previousPayScaleMax} />
                </div>

                <div className={`cert-field-compact ${touched.revisedPayScaleMin && errors.revisedPayScaleMin ? 'has-error' : ''}`}>
                  <label className="required">Revised Pay Scale (Min)</label>
                  <input type="number" placeholder="e.g., 55000" value={formData.revisedPayScaleMin} onChange={(e) => handleChange('revisedPayScaleMin', e.target.value)} onBlur={() => handleBlur('revisedPayScaleMin')} />
                  <FieldError msg={errors.revisedPayScaleMin} />
                </div>

                <div className={`cert-field-compact ${touched.revisedPayScaleMax && errors.revisedPayScaleMax ? 'has-error' : ''}`}>
                  <label className="required">Revised Pay Scale (Max)</label>
                  <input type="number" placeholder="e.g., 88000" value={formData.revisedPayScaleMax} onChange={(e) => handleChange('revisedPayScaleMax', e.target.value)} onBlur={() => handleBlur('revisedPayScaleMax')} />
                  <FieldError msg={errors.revisedPayScaleMax} />
                </div>

                <div className="cert-field-compact">
                  <label>Increment Amount (Auto-calculated)</label>
                  <input
                    type="text"
                    className="bg-light"
                    value={
                      formData.previousPayScaleMin && formData.revisedPayScaleMin ?
                      `₹${(Number(formData.revisedPayScaleMin) - Number(formData.previousPayScaleMin)).toLocaleString()}` :
                      ''
                    }
                    readOnly
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Remarks</label>
                  <textarea rows="3" placeholder="Additional remarks..." value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting ? (
                  <><span className="cert-spinner" /> {editingRevision ? 'Updating…' : 'Creating…'}</>
                ) : (
                  <><FaSave size={12} /> {editingRevision ? 'Update Revision' : 'Save Revision'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : showDocumentActions && selectedRevision ? (
        <DocumentActions
          title="Revision Letter"
          documentName={selectedRevision.documentName}
          documentData={documentPreview?.data}
          onGenerate={() => handleGenerateLetter(selectedRevision)}
          onBack={handleBackToList}
          generateLabel="Generate Letter"
          themeColor="#9d174d"
        />
      ) : selectedRevision ? (
        // ─── DETAIL VIEW ──────────────────────────────────────────────
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg,#9d174d,#be185d)', padding: '28px 32px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <FaMoneyBillWave size={20} />
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{selectedRevision.payRevisionOrderNumber}</h2>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', opacity: 0.9 }}>
                <span><FaCalendarAlt /> {formatDate(selectedRevision.effectiveDate)}</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  {getReasonName(selectedRevision.reasonId)}
                </span>
              </div>
            </div>
          </div>
          <div style={{ padding: '32px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg,#9d174d,#be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700 }}>
                {getEmployeeName(selectedRevision.employeeId)?.charAt(0) || '?'}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 2px 0' }}>
                  {getEmployeeName(selectedRevision.employeeId)}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {getEmployeeCode(selectedRevision.employeeId)} • {getEmployeeDesignation(selectedRevision.employeeId)}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#fdf2f8', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaCalendarAlt size={16} style={{ color: '#9d174d' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Effective Date</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatDate(selectedRevision.effectiveDate)}</p>
              </div>
              <div style={{ background: '#eef2ff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaChartLine size={16} style={{ color: '#4f46e5' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Revision Reason</span>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: '#e0e7ff', color: '#4f46e5' }}>
                  {getReasonName(selectedRevision.reasonId)}
                </span>
              </div>
              <div style={{ background: '#fff1f2', borderRadius: '10px', padding: '16px 18px', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaMoneyBillWave size={16} style={{ color: '#dc2626' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Previous Pay Scale</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#991b1b', margin: 0 }}>
                  {formatPayScale(selectedRevision.previousPayScaleMin, selectedRevision.previousPayScaleMax)}
                </p>
              </div>
              <div style={{ background: '#ecfdf5', borderRadius: '10px', padding: '16px 18px', border: '1px solid #a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaMoneyBillWave size={16} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Revised Pay Scale</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#065f46', margin: 0 }}>
                  {formatPayScale(selectedRevision.revisedPayScaleMin, selectedRevision.revisedPayScaleMax)}
                </p>
              </div>
              <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '16px 18px', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaArrowUp size={16} style={{ color: '#d97706' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Increment</span>
                </div>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  {selectedRevision.incrementAmount ? `₹${selectedRevision.incrementAmount.toLocaleString()}` : '—'}
                  {selectedRevision.incrementPercent ? ` (${selectedRevision.incrementPercent.toFixed(1)}%)` : ''}
                </p>
              </div>
              <div style={{ background: '#fff7ed', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaClock size={16} style={{ color: '#ea580c' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Status</span>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: selectedRevision.isActive !== false ? '#d1fae5' : '#fee2e2', color: selectedRevision.isActive !== false ? '#065f46' : '#991b1b' }}>
                  {selectedRevision.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf size={16} style={{ color: '#dc2626' }} /> Pay Revision Document
              </h4>
              {selectedRevision.documentName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedRevision.documentName.endsWith('.pdf') ? <FaFilePdf size={20} style={{ color: '#dc2626' }} /> : <FaFileImage size={20} style={{ color: '#3b82f6' }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>{selectedRevision.documentName}</p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uploaded document</span>
                    </div>
                  </div>
                  <button onClick={(e) => handleViewDocument(e, selectedRevision)} disabled={docLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    <FaEye size={14} /> {docLoading ? 'Loading…' : 'View Document'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <FaFileAlt size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: 500, margin: '0 0 4px 0', color: '#64748b' }}>No document uploaded</p>
                  <span style={{ fontSize: '13px' }}>No pay revision document has been uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ─── LIST VIEW ──────────────────────────────────────────────
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by order number, reason, employee..."
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

          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Order No.</th>
                    <th>Effective Date</th>
                    <th>Previous Pay Scale</th>
                    <th>Revised Pay Scale</th>
                    <th>Increment</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.length > 0 ? (
                    revisions.map((rev, idx) => {
                      const isActive = rev.isActive !== false;
                      return (
                        <tr
                          key={rev.id}
                          onClick={() => handleRowClick(rev)}
                          style={{ cursor: 'pointer' }}
                          className="cert-table-row-hover"
                        >
                          <td className="text-center">{page * rowsPerPage + idx + 1}</td>
                          <td>{getEmployeeName(rev.employeeId)}</td>
                          <td><strong>{rev.payRevisionOrderNumber}</strong></td>
                          <td>{formatDate(rev.effectiveDate)}</td>
                          <td>{formatPayScale(rev.previousPayScaleMin, rev.previousPayScaleMax)}</td>
                          <td>
                            <span className="fw-bold text-success">
                              {formatPayScale(rev.revisedPayScaleMin, rev.revisedPayScaleMax)}
                            </span>
                          </td>
                          <td>
                            <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                              <FaArrowUp className="me-1" size={10} />
                              {rev.incrementAmount ? `₹${rev.incrementAmount.toLocaleString()}` : '—'}
                              {rev.incrementPercent ? ` (${rev.incrementPercent.toFixed(1)}%)` : ''}
                            </span>
                          </td>
                          <td>
                            <span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                              {getReasonName(rev.reasonId)}
                            </span>
                          </td>
                          <td>
                            <div
                              className="d-flex align-items-center gap-1"
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusToggle(rev.id, getEmployeeName(rev.employeeId), isActive);
                              }}
                            >
                              <div style={{ width: "28px", height: "16px", borderRadius: "50px", backgroundColor: isActive ? "#9d174d" : "#d1d5db", position: "relative", transition: ".2s" }}>
                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: isActive ? "14px" : "2px", transition: ".2s" }} />
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 500, color: isActive ? "#9d174d" : "#94a3b8" }}>
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="cert-act cert-act--edit"
                                onClick={() => handleEdit(rev)}
                                title={!isActive ? 'Cannot edit inactive record' : 'Edit'}
                                disabled={!isActive}
                                style={{ opacity: !isActive ? 0.5 : 1, cursor: !isActive ? 'not-allowed' : 'pointer' }}
                              >
                                <FaEdit size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="10" className="text-center py-5">No pay revision records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cert-table-footer">
              <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, totalItems)} of {totalItems} records
              </div>
              {totalPages > 0 && (
                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>← Prev</button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots" style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button key={pg} className={`cert-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', background: pg === page ? '#9d174d' : 'white', color: pg === page ? 'white' : '#374151', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px' }}>{pg + 1}</button>
                    )
                  )}
                  <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Next →</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">{statusAction.newStatus === "Active" ? "✅" : "⛔"}</div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to <strong>{statusAction.newStatus === "Active" ? "activate" : "deactivate"}</strong> <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === "Inactive"
                ? "Inactive records cannot be edited until reactivated."
                : "This record will become active again."}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {documentPreview && (
        <div className="emp-modal-overlay" onClick={() => { URL.revokeObjectURL(documentPreview.data); setDocumentPreview(null); }} style={{ zIndex: 1050 }}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}><FaFileAlt style={{ marginRight: '8px' }} />Document Preview</h3>
              <button onClick={() => { URL.revokeObjectURL(documentPreview.data); setDocumentPreview(null); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}><FaTimes /></button>
            </div>
            <div style={{ padding: '24px' }}>
              {documentPreview.name?.toLowerCase().endsWith('.pdf') ? (
                <div style={{ width: '100%', height: '70vh', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe src={documentPreview.data} width="100%" height="100%" title="PDF Preview" style={{ border: 'none' }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <img src={documentPreview.data} alt="Document Preview" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                </div>
              )}
              <div style={{ marginTop: '20px', padding: '12px 16px', background: '#f9fafb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#111827' }}>{documentPreview.name}</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Uploaded document</p>
                </div>
                <a href={documentPreview.data} download={documentPreview.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}><FaFileAlt /> Download</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cert-table-row-hover:hover {
          background-color: #f9fafb;
          transition: background-color 0.2s ease;
        }
        .cert-spinner {
          display: inline-block; width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;
          border-top-color: #fff; animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .has-error input, .has-error select {
          border-color: #dc3545 !important;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25) !important;
        }
        .text-danger.small {
          color: #dc3545;
          font-size: 12px;
          display: block;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default PayRevisionHistory;