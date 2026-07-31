import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaBuilding, FaCalendarAlt, FaUpload,
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaUserTie,
  FaFileAlt, FaSearch, FaExchangeAlt, FaClock, FaArrowLeft, FaEye
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';

const DeputationManagement = ({ employeeId, initialData, onSuccess, onCancel }) => {
  // ─── State ──────────────────────────────────────────────────
  const [deputations, setDeputations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reportingAuthorities, setReportingAuthorities] = useState([]);
  const [deputationTypes, setDeputationTypes] = useState([]); // now dynamic
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingDeputation, setEditingDeputation] = useState(null);
  const [selectedDeputation, setSelectedDeputation] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  const [formData, setFormData] = useState({
    deputationOrderNo: '',
    deputationOrganization: '',
    startDate: '',
    endDate: '',
    deputationTypeId: '',
    reportingAuthorityId: '',
    reportingAuthorityName: '',
    remarks: '',
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
  const [statusAction, setStatusAction] = useState({ id: null, name: "", newStatus: "" });
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

  const fetchReportingAuthorities = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/employee-designation?flag=0`, getAxiosConfig());
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        data = res.data.response;
      } else if (res.data?.response?.content) {
        data = res.data.response.content;
      }
      setReportingAuthorities(data.map(item => ({
        id: item.id,
        name: item.name || item.designationName || item.title || ''
      })));
    } catch (err) {
      console.error('Fetch reporting authorities error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch reporting authorities');
      setReportingAuthorities([]);
    }
  }, []);

  // ─── NEW: fetch deputation types from API ──────────────────
  const fetchDeputationTypes = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      // Adjust the endpoint as per your actual API
      const res = await axios.get(`${BASE_URL}/api/deputation-types/list?flag=0`, getAxiosConfig());
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        data = res.data.response;
      } else if (res.data?.response?.content) {
        data = res.data.response.content;
      }
      // Map to { id, name } – adjust field names if needed
      setDeputationTypes(data.map(item => ({
        id: item.id,
        name: item.name || item.deputationTypeName || item.typeName || ''
      })));
    } catch (err) {
      console.error('Fetch deputation types error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch deputation types');
      // Fallback to static list if API fails
      setDeputationTypes([
        { id: 1, name: 'Domestic Deputation' },
        { id: 2, name: 'International Deputation' },
        { id: 3, name: 'Government Deputation' },
        { id: 4, name: 'Training Deputation' },
        { id: 5, name: 'Project Based Deputation' }
      ]);
    }
  }, []);

  const fetchDeputations = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const params = { page: 0, size: 100, search: searchTerm || '' };
      const res = await axios.get(`${BASE_URL}/api/deputations`, { ...getAxiosConfig(), params });
      if (res.data?.status === 200) {
        let list = res.data.response?.content || [];
        if (employeeId) {
          list = list.filter(d => String(d.employeeId) === String(employeeId));
        }
        setDeputations(list);
      } else {
        setDeputations([]);
      }
    } catch (err) {
      console.error('Fetch deputations error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch deputations');
      setDeputations([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, employeeId]);

  // ─── Load data on mount ────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      await fetchEmployees();
      await fetchReportingAuthorities();
      await fetchDeputationTypes(); // fetch types from API
      await fetchDeputations();
    };
    loadAll();
  }, [fetchEmployees, fetchReportingAuthorities, fetchDeputationTypes, fetchDeputations]);

  // ─── Update existing order numbers ─────────────────────────
  useEffect(() => {
    setExistingOrderNos(deputations.map(d => d.deputationOrderNumber).filter(Boolean));
  }, [deputations]);

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

  const getDeputationTypeName = (typeId) => {
    const found = deputationTypes.find(t => t.id === typeId);
    return found ? found.name : typeId;
  };

  const getDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '—';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
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
    if (field === 'deputationOrderNo') {
      if (!value) error = 'Deputation Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingDeputation || editingDeputation.deputationOrderNumber !== value)) {
        error = 'This Order Number already exists';
      }
    } else if (field === 'deputationOrganization' && !value) {
      error = 'Deputation Organization is required';
    } else if (field === 'startDate') {
      if (!value) error = 'Start Date is required';
      else if (formData.endDate && new Date(value) > new Date(formData.endDate)) {
        error = 'Start Date must be before End Date';
      }
    } else if (field === 'endDate') {
      if (!value) error = 'End Date is required';
      else if (formData.startDate && new Date(value) < new Date(formData.startDate)) {
        error = 'End Date must be after Start Date';
      }
    } else if (field === 'deputationTypeId' && !value) {
      error = 'Deputation Type is required';
    } else if (field === 'reportingAuthorityId' && !value) {
      error = 'Reporting Authority is required';
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
    if (!formData.deputationOrderNo) {
      newErrors.deputationOrderNo = 'Deputation Order Number is required';
    } else if (existingOrderNos.includes(formData.deputationOrderNo) &&
      (!editingDeputation || editingDeputation.deputationOrderNumber !== formData.deputationOrderNo)) {
      newErrors.deputationOrderNo = 'Order Number already exists';
    }
    if (!formData.deputationOrganization) newErrors.deputationOrganization = 'Deputation Organization is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    else if (formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.startDate = 'Start Date must be before End Date';
    }
    if (!formData.endDate) newErrors.endDate = 'End Date is required';
    else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End Date must be after Start Date';
    }
    if (!formData.deputationTypeId) newErrors.deputationTypeId = 'Deputation Type is required';
    if (!formData.reportingAuthorityId) newErrors.reportingAuthorityId = 'Reporting Authority is required';

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
        deputationOrderNumber: formData.deputationOrderNo.trim(),
        deputationOrganization: formData.deputationOrganization.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        deputationTypeId: formData.deputationTypeId,
        reportingAuthorityId: formData.reportingAuthorityId,
        remarks: formData.remarks || '',
      };

      const url = editingDeputation
        ? `${BASE_URL}/api/deputations/${editingDeputation.id}/update`
        : `${BASE_URL}/api/deputations/create`;
      const method = editingDeputation ? 'put' : 'post';

      const res = await axios[method](url, payload, getAxiosConfig());

      if (res.data?.status === 200 || res.data?.status === 201) {
        toast.success('Success', editingDeputation ? 'Deputation updated' : 'Deputation added');
        resetForm();
        setShowForm(false);
        await fetchDeputations();
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
  const handleEdit = (deputation) => {
    if (deputation.isActive === false) {
      toast.warning('Inactive', 'Cannot edit an inactive record');
      return;
    }
    const emp = employees.find(e => e.id === deputation.employeeId);
    if (emp) {
      setSelectedEmployee(emp);
      setEmployeeSearchTerm(emp.name);
    } else {
      setSelectedEmployee(null);
      setEmployeeSearchTerm('');
    }

    // Map names to IDs
    const typeId = deputation.deputationType?.id || '';
    const authorityFound = reportingAuthorities.find(a => a.name === deputation.reportingAuthority);
    const authorityId = authorityFound ? authorityFound.id : '';

    setEditingDeputation(deputation);
    setFormData({
      deputationOrderNo: deputation.deputationOrderNumber || '',
      deputationOrganization: deputation.deputationOrganization || '',
      startDate: deputation.startDate || '',
      endDate: deputation.endDate || '',
      deputationTypeId: typeId,
      reportingAuthorityId: authorityId,
      reportingAuthorityName: deputation.reportingAuthority || '',
      remarks: deputation.remarks || '',
    });
    setShowForm(true);
  };

  // ─── Reset form ─────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      deputationOrderNo: '',
      deputationOrganization: '',
      startDate: '',
      endDate: '',
      deputationTypeId: '',
      reportingAuthorityId: '',
      reportingAuthorityName: '',
      remarks: '',
    });
    setErrors({});
    setTouched({});
    setEditingDeputation(null);
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
    setSelectedDeputation(null);
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
        `${BASE_URL}/api/deputations/${id}/status`,
        null,
        { ...getAxiosConfig(), params: { active: newStatus === 'Active' } }
      );
      if (res.data?.status === 200) {
        toast.success('Status Updated', 'Deputation status changed');
        await fetchDeputations();
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
  const handleViewDocument = async (e, deputation) => {
    e.stopPropagation();
    setSelectedDeputation(deputation);
    setShowDocumentActions(true);

    if (!deputation.documentName) {
      toast.info('No Document', 'No document has been uploaded for this deputation');
      return;
    }

    setDocLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/deputations/${deputation.id}/document`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(res.data);
      setDocumentPreview({ data: blobUrl, name: deputation.documentName });
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
  const filteredDeputations = deputations.filter(dep => {
    const search = searchTerm.toLowerCase();
    return dep.deputationOrderNumber?.toLowerCase().includes(search) ||
           dep.deputationOrganization?.toLowerCase().includes(search) ||
           (dep.deputationType?.name && dep.deputationType.name.toLowerCase().includes(search)) ||
           dep.reportingAuthority?.toLowerCase().includes(search);
  });

  const totalItems = filteredDeputations.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentDeputations = filteredDeputations.slice(startIndex, startIndex + rowsPerPage);

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

  const handleRowClick = (deputation) => {
    setSelectedDeputation(deputation);
  };

  const handleGenerateLetter = (deputation) => {
    console.log('Generate letter for:', deputation.deputationOrderNumber);
  };

  // ─── Render ──────────────────────────────────────────────────
  if (loading && deputations.length === 0) {
    return <LoadingSpinner message="Loading deputations..." />;
  }

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Deputation Management</h1>
          <p className="cert-subtitle">Manage employee deputation records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedDeputation && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Deputation
            </button>
          )}
          {(showForm || selectedDeputation) && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedDeputation && onCancel && (
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
              <div className="cert-section-label">Deputation Details</div>
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

                <div className={`cert-field-compact ${touched.deputationOrderNo && errors.deputationOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Deputation Order Number</label>
                  <input type="text" placeholder="e.g., DEP/2024/001" value={formData.deputationOrderNo} onChange={(e) => handleChange('deputationOrderNo', e.target.value)} onBlur={() => handleBlur('deputationOrderNo')} />
                  <FieldError msg={errors.deputationOrderNo} />
                </div>

                <div className={`cert-field-compact ${touched.deputationOrganization && errors.deputationOrganization ? 'has-error' : ''}`}>
                  <label className="required">Deputation Organization</label>
                  <input type="text" placeholder="e.g., Ministry of Corporate Affairs" value={formData.deputationOrganization} onChange={(e) => handleChange('deputationOrganization', e.target.value)} onBlur={() => handleBlur('deputationOrganization')} />
                  <FieldError msg={errors.deputationOrganization} />
                </div>

                <div className={`cert-field-compact ${touched.startDate && errors.startDate ? 'has-error' : ''}`}>
                  <label className="required">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} onBlur={() => handleBlur('startDate')} />
                  <FieldError msg={errors.startDate} />
                </div>

                <div className={`cert-field-compact ${touched.endDate && errors.endDate ? 'has-error' : ''}`}>
                  <label className="required">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => handleChange('endDate', e.target.value)} onBlur={() => handleBlur('endDate')} />
                  <FieldError msg={errors.endDate} />
                </div>

                <div className={`cert-field-compact ${touched.deputationTypeId && errors.deputationTypeId ? 'has-error' : ''}`}>
                  <label className="required">Deputation Type</label>
                  <select value={formData.deputationTypeId} onChange={(e) => handleChange('deputationTypeId', e.target.value)} onBlur={() => handleBlur('deputationTypeId')}>
                    <option value="">Select Type</option>
                    {deputationTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.deputationTypeId} />
                </div>

                <div className={`cert-field-compact ${touched.reportingAuthorityId && errors.reportingAuthorityId ? 'has-error' : ''}`}>
                  <label className="required">Reporting Authority</label>
                  <select
                    value={formData.reportingAuthorityId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const found = reportingAuthorities.find(a => String(a.id) === String(id));
                      setFormData(prev => ({
                        ...prev,
                        reportingAuthorityId: id,
                        reportingAuthorityName: found ? found.name : ''
                      }));
                      if (touched.reportingAuthorityId) validateField('reportingAuthorityId', id);
                    }}
                    onBlur={() => handleBlur('reportingAuthorityId')}
                  >
                    <option value="">Select Reporting Authority</option>
                    {reportingAuthorities.map(auth => (
                      <option key={auth.id} value={auth.id}>{auth.name}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.reportingAuthorityId} />
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
                  <><span className="cert-spinner" /> {editingDeputation ? 'Updating…' : 'Creating…'}</>
                ) : (
                  <><FaSave size={12} /> {editingDeputation ? 'Update Deputation' : 'Save Deputation'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : showDocumentActions && selectedDeputation ? (
        <DocumentActions
          title="Deputation Letter"
          documentName={selectedDeputation.documentName}
          documentData={documentPreview?.data}
          onGenerate={() => handleGenerateLetter(selectedDeputation)}
          onBack={handleBackToList}
          generateLabel="Generate Letter"
          themeColor="#9d174d"
        />
      ) : selectedDeputation ? (
        // ─── DETAIL VIEW ──────────────────────────────────────────────
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg,#9d174d,#be185d)', padding: '28px 32px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <FaExchangeAlt size={20} />
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{selectedDeputation.deputationOrderNumber}</h2>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', opacity: 0.9 }}>
                <span><FaCalendarAlt /> {formatDate(selectedDeputation.startDate)}</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  {selectedDeputation.deputationType?.name || selectedDeputation.deputationType}
                </span>
              </div>
            </div>
          </div>
          <div style={{ padding: '32px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg,#9d174d,#be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700 }}>
                {getEmployeeName(selectedDeputation.employeeId)?.charAt(0) || '?'}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 2px 0' }}>
                  {getEmployeeName(selectedDeputation.employeeId)}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {getEmployeeCode(selectedDeputation.employeeId)} • {getEmployeeDesignation(selectedDeputation.employeeId)}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#fdf2f8', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaBuilding size={16} style={{ color: '#9d174d' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Organization</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{selectedDeputation.deputationOrganization}</p>
              </div>
              <div style={{ background: '#eef2ff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaExchangeAlt size={16} style={{ color: '#4f46e5' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Deputation Type</span>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: '#e0e7ff', color: '#4f46e5' }}>
                  {selectedDeputation.deputationType?.name || selectedDeputation.deputationType}
                </span>
              </div>
              <div style={{ background: '#ecfdf5', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaCalendarAlt size={16} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Start Date</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatDate(selectedDeputation.startDate)}</p>
              </div>
              <div style={{ background: '#fff1f2', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaCalendarAlt size={16} style={{ color: '#dc2626' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>End Date</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatDate(selectedDeputation.endDate)}</p>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px 18px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaClock size={16} style={{ color: '#166534' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Duration</span>
                </div>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#166534', margin: 0 }}>
                  {getDuration(selectedDeputation.startDate, selectedDeputation.endDate)}
                </p>
              </div>
              <div style={{ background: '#faf5ff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaUserTie size={16} style={{ color: '#7c3aed' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Reporting Authority</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{selectedDeputation.reportingAuthority}</p>
              </div>
              <div style={{ background: '#fff7ed', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaClock size={16} style={{ color: '#ea580c' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Status</span>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: selectedDeputation.isActive !== false ? '#d1fae5' : '#fee2e2', color: selectedDeputation.isActive !== false ? '#065f46' : '#991b1b' }}>
                  {selectedDeputation.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf size={16} style={{ color: '#dc2626' }} /> Deputation Order Document
              </h4>
              {selectedDeputation.documentName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedDeputation.documentName.endsWith('.pdf') ? <FaFilePdf size={20} style={{ color: '#dc2626' }} /> : <FaFileImage size={20} style={{ color: '#3b82f6' }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>{selectedDeputation.documentName}</p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uploaded document</span>
                    </div>
                  </div>
                  <button onClick={(e) => handleViewDocument(e, selectedDeputation)} disabled={docLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    <FaEye size={14} /> {docLoading ? 'Loading…' : 'View Document'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <FaFileAlt size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: 500, margin: '0 0 4px 0', color: '#64748b' }}>No document uploaded</p>
                  <span style={{ fontSize: '13px' }}>No deputation order document has been uploaded</span>
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
                placeholder="Search by order number, organization, type or reporting authority..."
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
                    <th>Organization</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Deputation Type</th>
                    <th>Reporting Authority</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDeputations.length > 0 ? (
                    currentDeputations.map((dep, idx) => {
                      const isActive = dep.isActive !== false;
                      return (
                        <tr
                          key={dep.id}
                          onClick={() => handleRowClick(dep)}
                          style={{ cursor: 'pointer' }}
                          className="cert-table-row-hover"
                        >
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td>{getEmployeeName(dep.employeeId)}</td>
                          <td><strong>{dep.deputationOrderNumber}</strong></td>
                          <td>{dep.deputationOrganization}</td>
                          <td>{formatDate(dep.startDate)}</td>
                          <td>{formatDate(dep.endDate)}</td>
                          <td>
                            <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                              {dep.deputationType?.name || dep.deputationType}
                            </span>
                          </td>
                          <td>{dep.reportingAuthority}</td>
                          <td>
                            <div
                              className="d-flex align-items-center gap-1"
                              style={{ cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusToggle(dep.id, getEmployeeName(dep.employeeId), isActive);
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
                                onClick={() => handleEdit(dep)}
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
                    <tr><td colSpan="10" className="text-center py-5">No deputation records found</td></tr>
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

export default DeputationManagement;