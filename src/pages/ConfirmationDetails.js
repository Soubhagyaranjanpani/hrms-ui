import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaUserCheck,
  FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaCheckCircle, FaSearch, FaArrowLeft, FaArrowRight, FaEye, FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';

const ConfirmationDetails = ({ employeeId, employeeJoiningDate, initialData, onSuccess, onCancel }) => {
  // ─── State ──────────────────────────────────────────────────
  const [confirmations, setConfirmations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [confirmedByList, setConfirmedByList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingConfirmation, setEditingConfirmation] = useState(null);
  const [selectedConfirmation, setSelectedConfirmation] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  const [formData, setFormData] = useState({
    confirmationOrderNo: '',
    confirmationDate: '',
    confirmedBy: '',          // display name (for UI)
    confirmedById: null,      // ID sent to API
    remarks: '',
    confirmationDocument: null,
    confirmationDocumentData: null,
    confirmationDocumentName: null
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(3);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: "",
    newStatus: ""
  });
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

  const fetchConfirmations = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const params = { page: 0, size: 100, search: searchTerm || '' };
      const res = await axios.get(`${BASE_URL}/api/confirmations`, { ...getAxiosConfig(), params });
      if (res.data?.status === 200) {
        let list = res.data.response?.content || [];
        if (employeeId) {
          list = list.filter(c => String(c.employeeId) === String(employeeId));
        }
        setConfirmations(list);
      } else {
        setConfirmations([]);
      }
    } catch (err) {
      console.error('Fetch confirmations error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch confirmations');
      setConfirmations([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, employeeId]);

 const fetchConfirmedByList = useCallback(async () => {
  if (!ensureToken()) return;

  try {
    const res = await axios.get(
      `${BASE_URL}/employee-designation?flag=0`,
      getAxiosConfig()
    );

    let data = [];

    if (Array.isArray(res.data)) {
      data = res.data;
    } else if (
      res.data?.status === 200 &&
      Array.isArray(res.data.response)
    ) {
      data = res.data.response;
    } else if (Array.isArray(res.data?.response?.content)) {
      data = res.data.response.content;
    }

    setConfirmedByList(
      data.map((item) => ({
        id: item.id,
        employeeName: item.employeeName,
        designationName: item.designationName,
        name: `${item.employeeName} (${item.designationName})`
      }))
    );

  } catch (err) {
    console.error("Fetch confirmed by list error:", err);

    toast.error(
      "Error",
      err.response?.data?.message || "Failed to fetch confirmed by list"
    );

    setConfirmedByList([]);
  }
}, []);

  // ─── Load data on mount ────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      await fetchEmployees();
      await fetchConfirmations();
      await fetchConfirmedByList();
    };
    loadAll();
  }, [fetchEmployees, fetchConfirmations, fetchConfirmedByList]);

  // ─── Update existing order numbers ─────────────────────────
  useEffect(() => {
    setExistingOrderNos(confirmations.map(c => c.confirmationOrderNumber).filter(Boolean));
  }, [confirmations]);

  // ─── Helpers ────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusLabel = (conf) => (conf?.isActive === false ? 'Inactive' : 'Active');

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

  // ─── Form handlers ──────────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'confirmationOrderNo') {
      if (!value) error = 'Confirmation Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingConfirmation || editingConfirmation.confirmationOrderNumber !== value)) {
        error = 'This Order Number already exists';
      }
    } else if (field === 'confirmationDate') {
      if (!value) error = 'Confirmation Date is required';
      else if (employeeJoiningDate) {
        const confDate = new Date(value);
        const joiningDate = new Date(employeeJoiningDate);
        if (confDate <= joiningDate) {
          error = 'Confirmation Date must be greater than Joining Date';
        }
      }
    } else if (field === 'confirmedBy' && !value) {
      error = 'Confirmed By is required';
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
    if (!formData.confirmationOrderNo) {
      newErrors.confirmationOrderNo = 'Confirmation Order Number is required';
    } else if (existingOrderNos.includes(formData.confirmationOrderNo) &&
      (!editingConfirmation || editingConfirmation.confirmationOrderNumber !== formData.confirmationOrderNo)) {
      newErrors.confirmationOrderNo = 'Order Number already exists';
    }
    if (!formData.confirmationDate) {
      newErrors.confirmationDate = 'Confirmation Date is required';
    } else if (employeeJoiningDate) {
      const confDate = new Date(formData.confirmationDate);
      const joiningDate = new Date(employeeJoiningDate);
      if (confDate <= joiningDate) {
        newErrors.confirmationDate = 'Confirmation Date must be greater than Joining Date';
      }
    }
    if (!formData.confirmedBy) {
      newErrors.confirmedBy = 'Confirmed By is required';
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
      // ✅ SEND confirmedById (the ID) – API expects this
      const payload = {
        employeeId: selectedEmployee.id,
        confirmationOrderNumber: formData.confirmationOrderNo.trim(),
        confirmationDate: formData.confirmationDate,
        confirmedById: formData.confirmedById,   // <--- fixed
        remarks: formData.remarks || '',
      };
      if (formData.confirmationDocumentData) {
        payload.documentData = formData.confirmationDocumentData;
        payload.documentName = formData.confirmationDocumentName;
      }

      const url = editingConfirmation
        ? `${BASE_URL}/api/confirmations/${editingConfirmation.id}/update`
        : `${BASE_URL}/api/confirmations/create`;
      const method = editingConfirmation ? 'put' : 'post';

      const res = await axios[method](url, payload, getAxiosConfig());

      if (res.data?.status === 200 || res.data?.status === 201) {
        toast.success('Success', editingConfirmation ? 'Confirmation updated' : 'Confirmation added');
        resetForm();
        setShowForm(false);
        await fetchConfirmations();
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
  const handleEdit = (confirmation) => {
    if (confirmation.isActive === false) {
      toast.warning('Inactive', 'Cannot edit an inactive record');
      return;
    }
    const emp = employees.find(e => e.id === confirmation.employeeId);
    if (emp) {
      setSelectedEmployee(emp);
      setEmployeeSearchTerm(emp.name);
    } else {
      setSelectedEmployee(null);
      setEmployeeSearchTerm('');
    }

    // Find the authority ID from the name
    const found = confirmedByList.find(item => item.name === confirmation.confirmedBy);
    setEditingConfirmation(confirmation);
    setFormData({
      confirmationOrderNo: confirmation.confirmationOrderNumber || '',
      confirmationDate: confirmation.confirmationDate || '',
      confirmedBy: confirmation.confirmedBy || '',
      confirmedById: found ? found.id : null,   // set the ID for editing
      remarks: confirmation.remarks || '',
      confirmationDocument: null,
      confirmationDocumentData: null,
      confirmationDocumentName: confirmation.documentName || null
    });
    setShowForm(true);
  };

  // ─── Reset form ─────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      confirmationOrderNo: '',
      confirmationDate: '',
      confirmedBy: '',
      confirmedById: null,
      remarks: '',
      confirmationDocument: null,
      confirmationDocumentData: null,
      confirmationDocumentName: null
    });
    setErrors({});
    setTouched({});
    setEditingConfirmation(null);
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
    setSelectedConfirmation(null);
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
        `${BASE_URL}/api/confirmations/${id}/status`,
        null,
        { ...getAxiosConfig(), params: { active: newStatus === 'Active' } }
      );
      if (res.data?.status === 200) {
        toast.success('Status Updated', 'Confirmation status changed');
        await fetchConfirmations();
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
  const handleViewDocument = async (e, confirmation) => {
    e.stopPropagation();
    setSelectedConfirmation(confirmation);
    setShowDocumentActions(true);

    if (!confirmation.documentName) {
      toast.info('No Document', 'No document has been uploaded for this confirmation');
      return;
    }

    setDocLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/confirmations/${confirmation.id}/document`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(res.data);
      setDocumentPreview({ data: blobUrl, name: confirmation.documentName });
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
  const filteredConfirmations = confirmations.filter(conf => {
    const search = searchTerm.toLowerCase();
    return conf.confirmationOrderNumber?.toLowerCase().includes(search) ||
           conf.confirmedBy?.toLowerCase().includes(search) ||
           (conf.remarks && conf.remarks.toLowerCase().includes(search)) ||
           getEmployeeName(conf.employeeId).toLowerCase().includes(search);
  });

  const totalItems = filteredConfirmations.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentConfirmations = filteredConfirmations.slice(startIndex, startIndex + rowsPerPage);

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

  const handleRowClick = (confirmation) => {
    setSelectedConfirmation(confirmation);
  };

  const handleGenerateLetter = (confirmation) => {
    console.log('Generate letter for:', confirmation.confirmationOrderNumber);
  };

  // ─── Render ──────────────────────────────────────────────────
  if (loading && confirmations.length === 0) {
    return <LoadingSpinner message="Loading confirmations..." />;
  }

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Confirmation Details</h1>
          <p className="cert-subtitle">Manage employee probation confirmation records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedConfirmation && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Confirmation
            </button>
          )}
          {(showForm || selectedConfirmation) && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedConfirmation && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Joining Date Alert */}
      {employeeJoiningDate && !showForm && !selectedConfirmation && (
        <div className="alert alert-info bg-opacity-10 border-0 mb-4" style={{ padding: '12px 16px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5' }}>
          <div className="d-flex align-items-center gap-2">
            <FaCalendarAlt />
            <span>
              <strong>Employee Joining Date:</strong> {formatDate(employeeJoiningDate)}
              <span className="text-muted ms-2">Confirmation Date must be after this date</span>
            </span>
          </div>
        </div>
      )}

      {showForm ? (
        // ─── FORM VIEW ──────────────────────────────────────────────
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Confirmation Details</div>
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

                <div className={`cert-field-compact ${touched.confirmationOrderNo && errors.confirmationOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Confirmation Order Number</label>
                  <input type="text" placeholder="e.g., ARI/CONF/2024/001" value={formData.confirmationOrderNo} onChange={(e) => handleChange('confirmationOrderNo', e.target.value)} onBlur={() => handleBlur('confirmationOrderNo')} />
                  <FieldError msg={errors.confirmationOrderNo} />
                  <small>Unique order number for confirmation</small>
                </div>

                <div className={`cert-field-compact ${touched.confirmationDate && errors.confirmationDate ? 'has-error' : ''}`}>
                  <label className="required">Confirmation Date</label>
                  <input type="date" value={formData.confirmationDate} onChange={(e) => handleChange('confirmationDate', e.target.value)} onBlur={() => handleBlur('confirmationDate')} />
                  <FieldError msg={errors.confirmationDate} />
                  <small>Date when employee was confirmed</small>
                </div>

                <div className={`cert-field-compact ${touched.confirmedBy && errors.confirmedBy ? 'has-error' : ''}`}>
                  <label className="required">Confirmed By</label>
                  <select value={formData.confirmedBy} onChange={(e) => {
                    const selectedName = e.target.value;
                    const selected = confirmedByList.find(item => item.name === selectedName);
                    setFormData(prev => ({
                      ...prev,
                      confirmedBy: selectedName,
                      confirmedById: selected ? selected.id : null
                    }));
                    if (touched.confirmedBy) validateField('confirmedBy', selectedName);
                  }} onBlur={() => handleBlur('confirmedBy')}>
                    <option value="">Select Authority</option>
                    {confirmedByList.map(item => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                    {/* If editing and current value is not in the list, add it dynamically */}
                    {formData.confirmedBy && !confirmedByList.some(item => item.name === formData.confirmedBy) && (
                      <option key={formData.confirmedBy} value={formData.confirmedBy}>{formData.confirmedBy}</option>
                    )}
                  </select>
                  <FieldError msg={errors.confirmedBy} />
                </div>

                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Remarks</label>
                  <textarea rows="3" placeholder="Additional remarks about confirmation..." value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting ? (
                  <><span className="cert-spinner" /> {editingConfirmation ? 'Updating…' : 'Creating…'}</>
                ) : (
                  <><FaSave size={12} /> {editingConfirmation ? 'Update Confirmation' : 'Save Confirmation'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : showDocumentActions && selectedConfirmation ? (
        <DocumentActions
          title="Confirmation Letter"
          documentName={selectedConfirmation.documentName}
          documentData={documentPreview?.data}
          onGenerate={() => handleGenerateLetter(selectedConfirmation)}
          onBack={handleBackToList}
          generateLabel="Generate Letter"
          themeColor="#9d174d"
        />
      ) : selectedConfirmation ? (
        // ─── DETAIL VIEW ──────────────────────────────────────────────
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg, #9d174d 0%, #7c2d12 100%)', padding: '28px 32px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <FaCheckCircle size={20} />
                  <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
                    {selectedConfirmation.confirmationOrderNumber}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', opacity: 0.9 }}>
                  <span><FaCalendarAlt style={{ marginRight: '6px' }} />{formatDate(selectedConfirmation.confirmationDate)}</span>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    Confirmed
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            {/* Employee Profile */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9d174d, #7c2d12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '20px', fontWeight: '700'
                }}>
                  {getEmployeeName(selectedConfirmation.employeeId)?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 2px 0' }}>
                    {getEmployeeName(selectedConfirmation.employeeId)}
                  </h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {getEmployeeCode(selectedConfirmation.employeeId)} • {getEmployeeDesignation(selectedConfirmation.employeeId)}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <DetailCard
                icon={<FaCalendarAlt size={16} style={{ color: '#9d174d' }} />}
                label="Confirmation Date"
                value={formatDate(selectedConfirmation.confirmationDate)}
                bg="#ecfdf5"
              />
              <DetailCard
                icon={<FaUserCheck size={16} style={{ color: '#9d174d' }} />}
                label="Confirmed By"
                value={selectedConfirmation.confirmedBy}
                bg="#eef2ff"
              />
              <DetailCard
                icon={<FaClock size={16} style={{ color: '#d97706' }} />}
                label="Status"
                value={getStatusLabel(selectedConfirmation)}
                bg="#fffbeb"
                badge
              />
            </div>

            {/* Remarks */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid #bbf7d0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileAlt size={14} /> Remarks
              </h4>
              <p style={{ fontSize: '15px', color: '#065f46', margin: 0, lineHeight: '1.6' }}>
                {selectedConfirmation.remarks || 'No remarks provided'}
              </p>
            </div>

            {/* Document */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf size={16} style={{ color: '#dc2626' }} /> Confirmation Document
              </h4>
              {selectedConfirmation.documentName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedConfirmation.documentName.endsWith('.pdf') ? (
                        <FaFilePdf size={20} style={{ color: '#dc2626' }} />
                      ) : (
                        <FaFileImage size={20} style={{ color: '#3b82f6' }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: '500', color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>
                        {selectedConfirmation.documentName}
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uploaded document</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleViewDocument(e, selectedConfirmation)}
                    disabled={docLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                  >
                    <FaEye size={14} /> {docLoading ? 'Loading…' : 'View Document'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <FaFileAlt size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: '500', margin: '0 0 4px 0', color: '#64748b' }}>No document uploaded</p>
                  <span style={{ fontSize: '13px' }}>No confirmation document has been uploaded for this record</span>
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
                placeholder="Search by order number, confirmed by or remarks..."
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
                    <th>Confirmation Date</th>
                    <th>Confirmed By</th>
                    <th>Remarks</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentConfirmations.length > 0 ? (
                    currentConfirmations.map((conf, idx) => {
                      const isActive = conf.isActive !== false;
                      return (
                        <tr
                          key={conf.id}
                          onClick={() => handleRowClick(conf)}
                          style={{ cursor: 'pointer' }}
                          className="cert-table-row-hover"
                        >
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td>{getEmployeeName(conf.employeeId)}</td>
                          <td><strong>{conf.confirmationOrderNumber}</strong></td>
                          <td>
                            <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                              <FaCheckCircle className="me-1" size={10} /> {formatDate(conf.confirmationDate)}
                            </span>
                          </td>
                          <td>{conf.confirmedBy}</td>
                          <td>{conf.remarks ? <span className="text-muted small">{conf.remarks}</span> : <span className="text-muted">—</span>}</td>
                          <td>
                            <div
                              className="d-flex align-items-center gap-1"
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusToggle(conf.id, getEmployeeName(conf.employeeId), isActive);
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
                          <td>
                            <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="cert-act cert-act--edit"
                                onClick={() => handleEdit(conf)}
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
                    <tr><td colSpan="8" className="text-center py-5">No confirmation records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cert-table-footer">
              <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} records
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

      <style>{`
        .cert-table-row-hover:hover {
          background-color: #f9fafb;
          transition: background-color 0.2s ease;
        }
        .cert-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
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

// ─── Helper Components ─────────────────────────────────────────
const DetailCard = ({ icon, label, value, bg, badge }) => (
  <div style={{ background: bg || '#f8fafc', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      {icon}
      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
    {badge ? (
      <span style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
        {value}
      </span>
    ) : (
      <p style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
        {value}
      </p>
    )}
  </div>
);

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default ConfirmationDetails;