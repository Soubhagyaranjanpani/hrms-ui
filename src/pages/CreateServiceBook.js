
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FaEdit, FaSearch, FaTimes, FaBook, FaExclamationCircle,
  FaArrowLeft,
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

// Configuration
const BASE_URL = 'http://localhost:8080/hrms/api';
const STORAGE_KEYS = {
  JWT_TOKEN: 'jwtToken',
  USER_DATA: 'userData'
};

// Validation Rules (kept for edit form)
const RULES = {
  employeeName: {
    required: true,
    minLen: 2,
    maxLen: 100,
    pattern: /^[a-zA-Z\s]+$/,
    patternMsg: "Only letters and spaces allowed",
  },
  employeeCode: {
    required: true,
    minLen: 3,
    maxLen: 20,
    pattern: /^[A-Z0-9-]+$/,
    patternMsg: "Only uppercase letters, numbers, and hyphens",
  },
  department: {
    required: true,
    minLen: 2,
    maxLen: 50,
  },
  designation: {
    required: true,
    minLen: 2,
    maxLen: 50,
  },
  serviceBookNumber: {
    required: true,
    minLen: 5,
    maxLen: 30,
  },
};

const validate = (field, value) => {
  const r = RULES[field];
  if (!r) return "";
  const v = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (r.required && !v) return "This field is required";
  if (!v && !r.required) return "";
  if (r.minLen && v.length < r.minLen) return `Minimum ${r.minLen} characters`;
  if (r.maxLen && v.length > r.maxLen) return `Maximum ${r.maxLen} characters`;
  if (r.pattern && !r.pattern.test(v)) return r.patternMsg;
  return "";
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

// Helper: Remove "null" from employee name
const cleanEmployeeName = (name) => {
  if (!name) return '—';
  let cleaned = name.trim();
  cleaned = cleaned.replace(/\bnull\b/gi, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned || '—';
};

const CreateServiceBook = ({ employeeId: propEmployeeId, onSuccess, onCancel }) => {
  // View States
  const [editingId, setEditingId] = useState(null);

  // Data States
  const [serviceBooks, setServiceBooks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States (for edit)
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeCode: '',
    department: '',
    designation: '',
    serviceBookNumber: '',
    serviceBookStatus: 'Active'
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Search and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // Employee Dropdown (for edit)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const employeeInputRef = useRef(null);

  // Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: "",
    newStatus: ""
  });

  // Auth Functions
  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        toast.error('Session Expired', 'Please login again');
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      }
      return Promise.reject(error);
    }
  );

  const ensureToken = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication Required", "Please login to continue");
      return false;
    }
    return true;
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        employeeInputRef.current && !employeeInputRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. FETCH EMPLOYEES (for dropdown)
  const fetchEmployees = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axiosInstance.get('/employees?flag=0');
      let empArray = [];
      if (Array.isArray(res.data)) {
        empArray = res.data;
      } else if (res.data?.response && Array.isArray(res.data.response)) {
        empArray = res.data.response;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        empArray = res.data.data;
      }
      const mapped = empArray.map(emp => ({
        id: emp.id || emp.empId || emp.employeeId,
        name: cleanEmployeeName(emp.name || emp.employeeName || emp.empName),
        code: emp.code || emp.employeeCode || emp.empCode || '—',
        department: emp.department || emp.dept || '—',
        designation: emp.designation || emp.desig || '—'
      }));
      setEmployees(mapped);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Error', 'Failed to load employees for dropdown');
    }
  }, []);

  // 2. FETCH SERVICE BOOKS
  const fetchServiceBooks = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get('/service-books?flag=0');

      let dataArray = [];
      if (Array.isArray(res.data)) {
        dataArray = res.data;
      } else if (res.data?.response && Array.isArray(res.data.response)) {
        dataArray = res.data.response;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        dataArray = res.data.data;
      } else {
        setServiceBooks([]);
        toast.info('No Data', 'No service books found');
        return;
      }

      if (dataArray.length === 0) {
        setServiceBooks([]);
        toast.info('No Data', 'No service books available');
        return;
      }

      const mapped = dataArray.map((sb) => ({
        id: sb.id || sb.serviceBookId || null,
        employeeId: sb.empId || sb.employeeId || null,
        employeeName: cleanEmployeeName(sb.employeeName || sb.empName),
        employeeCode: sb.employeeCode || sb.empCode || '—',
        department: sb.department || sb.dept || '—',
        designation: sb.designation || sb.desig || '—',
        serviceBookNumber: sb.serviceBookNo || sb.serviceBookNumber || 'SB/2024/0001',
        serviceBookName: sb.serviceBookName || '—',
        branchName: sb.branchName || '—',
        serviceBookStatus: sb.isActive !== undefined ? (sb.isActive ? 'Active' : 'Inactive') : 'Active',
        createdAt: sb.createdAt || sb.createdDate || null,
        createdBy: sb.createdBy || '—',
        updatedAt: sb.updatedAt || sb.updatedDate || null,
      }));

      setServiceBooks(mapped);
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.response?.status === 401) {
        toast.error('Authentication Error', 'Please login again');
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      } else {
        toast.error('Error', err.response?.data?.message || err.message || 'Failed to fetch service books');
      }
      setServiceBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEmployees();
    fetchServiceBooks();
  }, [fetchEmployees, fetchServiceBooks]);

  // 4. FILTER, SORT, PAGINATION
  const filteredEmployees = employees.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) ||
      emp.code.toLowerCase().includes(search) ||
      emp.department.toLowerCase().includes(search);
  });

  const filteredServiceBooks = serviceBooks.filter(book => {
    const search = debouncedSearch.toLowerCase();
    return (book.employeeName?.toLowerCase().includes(search) ||
      book.employeeCode?.toLowerCase().includes(search) ||
      book.department?.toLowerCase().includes(search) ||
      book.serviceBookNumber?.toLowerCase().includes(search) ||
      book.designation?.toLowerCase().includes(search) ||
      book.branchName?.toLowerCase().includes(search) ||
      book.serviceBookName?.toLowerCase().includes(search));
  });

  const sortedServiceBooks = [...filteredServiceBooks].sort((a, b) => {
    if (a.serviceBookStatus === 'Active' && b.serviceBookStatus === 'Inactive') return -1;
    if (a.serviceBookStatus === 'Inactive' && b.serviceBookStatus === 'Active') return 1;
    return 0;
  });

  const totalItems = sortedServiceBooks.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentBooks = sortedServiceBooks.slice(startIndex, startIndex + rowsPerPage);

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

  const generateServiceBookNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SB/${year}/${random}`;
  };

  // 5. FORM HANDLERS (for edit)
  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, formData[field]) }));
  };

  const handleEmployeeSelect = (employee) => {
    setFormData({
      ...formData,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.code,
      department: employee.department,
      designation: employee.designation,
      serviceBookNumber: formData.serviceBookNumber || generateServiceBookNumber()
    });
    setEmployeeSearchTerm(employee.name);
    setShowEmployeeDropdown(false);
    if (errors.employeeName) {
      setErrors({ ...errors, employeeName: '' });
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      employeeCode: '',
      department: '',
      designation: '',
      serviceBookNumber: generateServiceBookNumber(),
      serviceBookStatus: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingId(null);
    setEmployeeSearchTerm('');
  };

  const handleEdit = (book) => {
    if (book.serviceBookStatus === 'Inactive') {
      toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
      return;
    }
    setEditingId(book.id);
    setFormData({
      employeeId: book.employeeId,
      employeeName: book.employeeName,
      employeeCode: book.employeeCode,
      department: book.department,
      designation: book.designation,
      serviceBookNumber: book.serviceBookNumber,
      serviceBookStatus: book.serviceBookStatus
    });
    setEmployeeSearchTerm(book.employeeName);
    setShowEditForm(true);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowEditForm(false);
  };

  const handleBackToList = () => {
    resetForm();
    setShowEditForm(false);
  };

  // 6. SUBMIT (UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    // Validate all fields
    const newErrors = {};
    Object.keys(RULES).forEach(field => {
      const err = validate(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    setTouched(Object.keys(RULES).reduce((acc, f) => ({ ...acc, [f]: true }), {}));

    if (Object.keys(newErrors).length > 0) {
      toast.error('Validation Error', 'Please fix all errors before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        employeeCode: formData.employeeCode,
        department: formData.department,
        designation: formData.designation,
        serviceBookNumber: formData.serviceBookNumber,
        isActive: formData.serviceBookStatus === 'Active',
      };

      const res = await axiosInstance.put(`/service-books/${editingId}`, payload);

      if (res.status === 200 || res.data?.status === 200 || res.data?.success === true) {
        toast.success('Success', 'Service book updated successfully');
        resetForm();
        setShowEditForm(false);
        fetchServiceBooks();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Error', err.response?.data?.message || err.message || 'Failed to update service book');
    } finally {
      setSubmitting(false);
    }
  };

  // 7. STATUS CHANGE
  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({ id, name, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    const { id, newStatus } = statusAction;
    setLoading(true);
    try {
      const payload = { isActive: newStatus === 'Active' };
      console.log(`📤 Updating status for ID ${id}:`, payload);

      const res = await axiosInstance.put(
        `/service-books/status/${id}`,
        payload
      );
      console.log('✅ Status Update Response:', res.data);

      const isSuccess =
        res.status === 200 ||
        res.data?.status === 200 ||
        res.data?.status === 'SUCCESS' ||
        res.data?.id ||
        res.data?.success === true;

      if (isSuccess) {
        toast.success('Status Updated', `${statusAction.name} is now ${newStatus}`);
        await fetchServiceBooks();
      } else {
        throw new Error(res.data?.message || 'Status change failed');
      }
    } catch (err) {
      console.error('❌ Status Update Error:', err);
      if (err.response?.status === 401) {
        toast.error('Authentication Error', 'Please login again');
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      } else {
        toast.error('Error', err.response?.data?.message || err.message || 'Failed to change status');
      }
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, newStatus: null, name: "" });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const isFieldOk = (f) => touched[f] && !errors[f] && formData[f]?.trim();
  const isFieldErr = (f) => touched[f] && !!errors[f];

  if (loading && serviceBooks.length === 0 && !showEditForm) {
    return <LoadingSpinner message="Loading service books..." />;
  }

  // 8. RENDER
  return (
    <div className="service-book-root">
      <style>{`
        .service-book-root {
          font-family: inherit;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }
        .field-err {
          color: #ef4444;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
        }
        .emp-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .cert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        .cert-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .cert-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 4px 0 0 0;
        }
        .cert-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          transition: all 0.2s;
        }
        .cert-back-btn:hover {
          background: #f1f5f9;
        }
        .cert-form-wrap {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e2e8f0;
        }
        .cert-form-section-compact {
          margin-bottom: 24px;
        }
        .cert-section-label {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f1f5f9;
        }
        .cert-form-grid-3col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .cert-field-compact {
          margin-bottom: 4px;
        }
        .cert-field-compact label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }
        .cert-field-compact label .req {
          color: #ef4444;
          margin-left: 2px;
        }
        .cert-field-compact input,
        .cert-field-compact textarea,
        .cert-field-compact select {
          width: 100%;
          padding: 8px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
          background: white;
          font-family: inherit;
          box-sizing: border-box;
        }
        .cert-field-compact input:focus,
        .cert-field-compact textarea:focus,
        .cert-field-compact select:focus {
          border-color: #9d174d;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1);
        }
        .cert-field-compact.has-error input,
        .cert-field-compact.has-error textarea,
        .cert-field-compact.has-error select {
          border-color: #ef4444;
        }
        .cert-field-compact.has-ok input,
        .cert-field-compact.has-ok textarea,
        .cert-field-compact.has-ok select {
          border-color: #10b981;
        }
        .cert-field-compact input.bg-light,
        .cert-field-compact textarea.bg-light {
          background: #f8fafc;
          color: #475569;
          cursor: not-allowed;
        }
        .cert-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          margin-top: 8px;
        }
        .cert-cancel-btn {
          padding: 8px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          transition: all 0.2s;
        }
        .cert-cancel-btn:hover {
          background: #f1f5f9;
        }
        .cert-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          background: #9d174d;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(157,23,77,0.3);
        }
        .cert-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(157,23,77,0.4);
        }
        .cert-add-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .position-relative {
          position: relative;
        }
        .employee-dropdown {
          position: absolute;
          top: calc(100% + 2px);
          left: 0;
          right: 0;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          max-height: 250px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .employee-dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .employee-dropdown-item:last-child {
          border-bottom: none;
        }
        .employee-dropdown-item:hover {
          background: #f8f0f3;
        }
        .employee-dropdown-item .emp-name {
          font-weight: 600;
          color: #0f172a;
        }
        .employee-dropdown-item .emp-details {
          font-size: 12px;
          color: #94a3b8;
        }
        .employee-dropdown-item .emp-code {
          padding: 2px 10px;
          background: #f1f5f9;
          border-radius: 12px;
          font-size: 11px;
          color: #64748b;
        }
        .emp-search-bar {
          margin-bottom: 16px;
        }
        .emp-search-wrap {
          position: relative;
          max-width: 500px;
        }
        .emp-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .emp-search-input {
          width: 100%;
          padding: 8px 40px 8px 36px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
          background: white;
          box-sizing: border-box;
        }
        .emp-search-input:focus {
          border-color: #9d174d;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1);
        }
        .cert-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
        }
        .cert-search-clear:hover {
          color: #ef4444;
        }
        .cert-table-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .cert-table-wrap {
          overflow-x: auto;
        }
        .cert-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .cert-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .cert-table td {
          padding: 10px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .cert-table tr:hover td {
          background: #f8fafc;
        }
        .cert-name {
          font-weight: 600;
          color: #0f172a;
        }
        .cert-actions {
          display: flex;
          gap: 6px;
          justify-content: center;
        }
        .cert-act {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .cert-act--edit {
          color: #6366f1;
        }
        .cert-act--edit:hover:not(:disabled) {
          background: #e0e7ff;
          border-color: #6366f1;
        }
        .cert-act--edit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cert-table-footer {
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .cert-table-info {
          font-size: 13px;
          color: #6b7280;
        }
        .cert-pagination {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .cert-page-btn {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .cert-page-btn:hover:not(:disabled) {
          background: #f1f5f9;
        }
        .cert-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cert-page-num {
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          min-width: 34px;
          transition: all 0.2s;
        }
        .cert-page-num:hover:not(.active) {
          background: #f1f5f9;
        }
        .cert-page-num.active {
          background: #9d174d;
          color: white;
          border-color: #9d174d;
        }
        .cert-page-dots {
          padding: 6px 4px;
          color: #94a3b8;
        }
        .emp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
        }
        .emp-modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 25px 50px rgba(0,0,0,0.25);
          text-align: center;
        }
        .emp-modal-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .emp-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
        }
        .emp-modal-body {
          font-size: 14px;
          color: #475569;
          margin: 0 0 8px 0;
        }
        .emp-modal-warn {
          font-size: 13px;
          color: #94a3b8;
          margin: 0 0 20px 0;
        }
        .emp-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .emp-modal-cancel {
          padding: 8px 24px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          transition: all 0.2s;
        }
        .emp-modal-cancel:hover {
          background: #f1f5f9;
        }
        .emp-modal-confirm {
          padding: 8px 24px;
          border: none;
          border-radius: 8px;
          background: #9d174d;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .emp-modal-confirm:hover {
          background: #7a0f3a;
        }
        .status-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .status-toggle .toggle-track {
          width: 28px;
          height: 16px;
          border-radius: 50px;
          position: relative;
          transition: 0.2s;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        .status-toggle .toggle-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          position: absolute;
          top: 2px;
          transition: 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .status-toggle .status-label {
          font-size: 11px;
          font-weight: 500;
        }
        .text-center {
          text-align: center;
        }
        .text-muted {
          color: #94a3b8;
        }
        .py-5 {
          padding-top: 40px;
          padding-bottom: 40px;
        }
        .mb-3 {
          margin-bottom: 12px;
        }
        .fw-bold {
          font-weight: 700;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge.bg-light {
          background: #f1f5f9;
          color: #475569;
        }
        .gap-1 {
          gap: 4px;
        }
        .gap-2 {
          gap: 8px;
        }
        .d-flex {
          display: flex;
        }
        .align-items-center {
          align-items: center;
        }
        .justify-content-between {
          justify-content: space-between;
        }
        .p-2 {
          padding: 8px;
        }
        .rounded {
          border-radius: 6px;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }
        .empty-state-icon {
          font-size: 48px;
          color: #cbd5e1;
        }
        .empty-state-title {
          font-size: 16px;
          font-weight: 500;
          color: #475569;
          margin-top: 12px;
        }
        .empty-state-subtitle {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .dept-badge {
          padding: 2px 10px;
          background: #dbeafe;
          border-radius: 12px;
          font-size: 11px;
          color: #2563eb;
        }
        .sb-number {
          font-family: monospace;
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
        }
        .serial-no {
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
        }
        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .grid-span-1 {
          grid-column: span 1;
        }
      `}</style>

      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Service Book Management</h1>
          <p className="cert-subtitle">{totalItems} total service books</p>
        </div>
        <div className="header-actions">
          {showEditForm && (
            <button type="button" className="cert-back-btn" onClick={handleBackToList}>
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {showEditForm ? (
        // Edit Form View
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit}>
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Edit Service Book</div>
              <div className="cert-form-grid-3col">
                <div className="cert-field-compact grid-span-1">
                  <label className="required">Employee Name <span className="req">*</span></label>
                  <div className="position-relative" ref={dropdownRef}>
                    <input
                      ref={employeeInputRef}
                      type="text"
                      className={`service-doc-input ${isFieldErr('employeeName') ? 'has-error' : ''} ${isFieldOk('employeeName') ? 'has-ok' : ''}`}
                      placeholder="Type employee name to search..."
                      value={employeeSearchTerm}
                      onChange={(e) => {
                        setEmployeeSearchTerm(e.target.value);
                        setShowEmployeeDropdown(true);
                        if (e.target.value === '') {
                          setFormData({ ...formData, employeeId: '', employeeName: '', employeeCode: '', department: '', designation: '' });
                        }
                      }}
                      onFocus={() => { if (employeeSearchTerm.length > 0) setShowEmployeeDropdown(true); }}
                      onBlur={() => handleBlur('employeeName')}
                    />
                    {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
                      <div className="employee-dropdown">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map(emp => (
                            <div key={emp.id} className="employee-dropdown-item" onClick={() => handleEmployeeSelect(emp)}>
                              <div>
                                <div className="emp-name">{emp.name}</div>
                                <div className="emp-details">Code: {emp.code} | Dept: {emp.department}</div>
                              </div>
                              <span className="emp-code">{emp.designation}</span>
                            </div>
                          ))
                        ) : (
                          <div className="employee-dropdown-item"><span className="text-muted">No employees found</span></div>
                        )}
                      </div>
                    )}
                    <FieldError msg={errors.employeeName} />
                  </div>
                </div>

                <div className={`cert-field-compact ${isFieldErr('serviceBookNumber') ? 'has-error' : ''} ${isFieldOk('serviceBookNumber') ? 'has-ok' : ''}`}>
                  <label>Service Book Number <span className="req">*</span></label>
                  <input type="text" placeholder="Auto-Populated" className="bg-light" value={formData.serviceBookNumber} readOnly />
                  <FieldError msg={errors.serviceBookNumber} />
                </div>
              </div>
            </div>

            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" disabled={submitting}>
                {submitting ? <><span className="emp-spinner" /> Updating...</> : <><FaBook size={12} /> Update Service Book</>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // List View
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input 
                className="emp-search-input" 
                type="text" 
                placeholder="Search by employee name, code, department, branch, service book name or number..." 
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
                    <th className="serial-no">#</th>
                    <th>Employee Name</th>
                    <th>Employee Code</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Service Book No.</th>
                    <th>Service Book Name</th>
                    <th>Branch</th>
                    <th>Created Date</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBooks.length > 0 ? (
                    currentBooks.map((book, idx) => (
                      <tr key={book.id}>
                        <td className="serial-no">{startIndex + idx + 1}</td>
                        <td><div className="cert-name">{book.employeeName}</div></td>
                        <td>{book.employeeCode}</td>
                        <td><span className="dept-badge">{book.department}</span></td>
                        <td>{book.designation}</td>
                        <td><span className="sb-number">{book.serviceBookNumber}</span></td>
                        <td>{book.serviceBookName}</td>
                        <td>{book.branchName}</td>
                        <td>{formatDate(book.createdAt)}</td>
                        <td>
                          <div className="status-toggle" onClick={() => handleStatusToggle(book.id, book.employeeName, book.serviceBookStatus)}>
                            <div className="toggle-track" style={{ backgroundColor: book.serviceBookStatus === 'Active' ? '#9d174d' : '#d1d5db' }}>
                              <div className="toggle-thumb" style={{ left: book.serviceBookStatus === 'Active' ? '14px' : '2px' }} />
                            </div>
                            <span className="status-label" style={{ color: book.serviceBookStatus === 'Active' ? '#9d174d' : '#94a3b8' }}>
                              {book.serviceBookStatus}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions">
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(book)} 
                              title={book.serviceBookStatus === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'} 
                              disabled={book.serviceBookStatus === 'Inactive'}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11">
                        <div className="empty-state">
                          <FaBook className="empty-state-icon" />
                          <div className="empty-state-title">No service books found</div>
                          <div className="empty-state-subtitle">{searchTerm ? 'Try a different search term' : 'No records available'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info">
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} service books
                </div>
                <div className="cert-pagination">
                  <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
                  {getPaginationRange().map((pg, i) => 
                    pg === '...' ? 
                      <span key={i} className="cert-page-dots">…</span> : 
                      <button 
                        key={pg} 
                        className={`cert-page-num ${pg === page ? 'active' : ''}`} 
                        onClick={() => setPage(pg)}
                      >
                        {pg + 1}
                      </button>
                  )}
                  <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
              </div>
            )}
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
    </div>
  );
};

export default CreateServiceBook;