import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FaSave, FaTimes, FaUser, FaIdCard, FaBuilding, FaBriefcase, 
  FaBook, FaCheckCircle, FaSearch, FaEdit, FaTrash, FaPlus, 
  FaArrowLeft, FaArrowRight, FaChevronDown, FaExclamationCircle
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

// Configuration - Update these according to your setup
const BASE_URL = 'http://localhost:8080/hrms/api';
const STORAGE_KEYS = {
  JWT_TOKEN: 'jwtToken',
  USER_DATA: 'userData'
};

// Validation Rules
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

const CreateServiceBook = ({ employeeId: propEmployeeId, onSuccess, onCancel }) => {
  // View States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Data States
  const [serviceBooks, setServiceBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
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

  // Employee Dropdown
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

  // Dummy Employees for lookup
  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant' },
    { id: 6, name: 'Robert Wilson', code: 'EMP006', department: 'IT', designation: 'DevOps Engineer' },
    { id: 7, name: 'Emily Davis', code: 'EMP007', department: 'HR', designation: 'Recruitment Specialist' },
    { id: 8, name: 'James Taylor', code: 'EMP008', department: 'Finance', designation: 'Financial Analyst' },
  ];

  // Auth Functions - Updated with better token handling
  const getAuthToken = () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    console.log('Token retrieved:', token ? 'Token exists' : 'No token');
    return token;
  };

  // Create axios instance with interceptors
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Request interceptor to add token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Authorization header added:', config.headers.Authorization);
      } else {
        console.warn('No token available for request');
      }
      console.log('Making request to:', config.url);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('401 Unauthorized - Token may be expired or invalid');
        toast.error('Session Expired', 'Please login again');
        // Clear token and redirect to login
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        // Redirect to login page if needed
        // window.location.href = '/login';
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

  // Fetch Service Books from API - Updated with better error handling
  const fetchServiceBooks = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      console.log('Fetching service books from:', `${BASE_URL}/service-books?flag=0`);
      
      const res = await axiosInstance.get('/service-books?flag=0');
      
      console.log('API Response Status:', res.status);
      console.log('API Response Data:', res.data);
      
      // Handle different response structures
      let dataArray = [];
      if (Array.isArray(res.data)) {
        dataArray = res.data;
      } else if (res.data?.response && Array.isArray(res.data.response)) {
        dataArray = res.data.response;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        dataArray = res.data.data;
      } else if (res.data?.status === 200 || res.data?.status === 201) {
        if (Array.isArray(res.data.response)) {
          dataArray = res.data.response;
        } else if (Array.isArray(res.data.data)) {
          dataArray = res.data.data;
        }
      } else {
        console.warn('Unexpected API response structure:', res.data);
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
        id: sb.id || sb.serviceBookId || sb.sbId,
        employeeId: sb.employeeId || sb.empId,
        employeeName: sb.employeeName || sb.employee?.name || sb.empName || 'Unknown',
        employeeCode: sb.employeeCode || sb.employee?.code || sb.empCode || '—',
        department: sb.department || sb.employee?.department || sb.dept || '—',
        designation: sb.designation || sb.employee?.designation || sb.desig || '—',
        serviceBookNumber: sb.serviceBookNumber || sb.sbNumber || 'SB/2024/0001',
        serviceBookStatus: sb.isActive !== undefined ? (sb.isActive ? 'Active' : 'Inactive') : 'Active',
        createdAt: sb.createdAt || sb.createdDate || sb.createdOn || new Date().toISOString(),
        createdBy: sb.createdBy || sb.creator || 'System'
      }));
      setServiceBooks(mapped);
      console.log('Mapped service books:', mapped.length);
    } catch (err) {
      console.error('API Error Details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      if (err.response?.status === 401) {
        toast.error('Authentication Error', 'Your session has expired. Please login again.');
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        // Optionally redirect to login
        // window.location.href = '/login';
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
    fetchServiceBooks();
  }, [fetchServiceBooks]);

  // Filter employees for dropdown
  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || 
           emp.code.toLowerCase().includes(search) ||
           emp.department.toLowerCase().includes(search);
  });

  // Filter service books by search term
  const filteredServiceBooks = serviceBooks.filter(book => {
    const search = debouncedSearch.toLowerCase();
    return book.employeeName?.toLowerCase().includes(search) || 
           book.employeeCode?.toLowerCase().includes(search) ||
           book.department?.toLowerCase().includes(search) ||
           book.serviceBookNumber?.toLowerCase().includes(search) ||
           book.designation?.toLowerCase().includes(search);
  });

  // Sort: Active first
  const sortedServiceBooks = [...filteredServiceBooks].sort((a, b) => {
    if (a.serviceBookStatus === 'Active' && b.serviceBookStatus === 'Inactive') return -1;
    if (a.serviceBookStatus === 'Inactive' && b.serviceBookStatus === 'Active') return 1;
    return 0;
  });

  // Pagination
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

  // Generate Service Book Number
  const generateServiceBookNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SB/${year}/${random}`;
  };

  // Form Handlers
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    const fields = ['employeeName', 'employeeCode', 'department', 'designation', 'serviceBookNumber'];
    const newTouched = {};
    const newErrors = {};
    fields.forEach((f) => {
      newTouched[f] = true;
      const err = validate(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setTouched(newTouched);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    try {
      let url, method, payload;

      if (editingId) {
        url = '/service-books/update';
        method = axiosInstance.put;
        payload = {
          id: editingId,
          employeeId: formData.employeeId,
          employeeName: formData.employeeName.trim(),
          employeeCode: formData.employeeCode.trim(),
          department: formData.department.trim(),
          designation: formData.designation.trim(),
          serviceBookNumber: formData.serviceBookNumber.trim(),
          isActive: formData.serviceBookStatus === 'Active'
        };
      } else {
        url = '/service-books/create';
        method = axiosInstance.post;
        payload = {
          employeeId: formData.employeeId,
          employeeName: formData.employeeName.trim(),
          employeeCode: formData.employeeCode.trim(),
          department: formData.department.trim(),
          designation: formData.designation.trim(),
          serviceBookNumber: formData.serviceBookNumber.trim(),
          isActive: true
        };
      }

      console.log('Submitting payload:', payload);
      const res = await method(url, payload);
      console.log('Submit Response:', res.data);
      
      if (res.data?.status === 200 || res.data?.status === 201) {
        toast.success('Success', editingId ? 'Service Book updated successfully' : 'Service Book created successfully');
        resetForm();
        setShowForm(false);
        await fetchServiceBooks();
        setPage(0);
        if (onSuccess) onSuccess(formData);
      } else {
        throw new Error(res.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (err.response?.status === 401) {
        toast.error('Authentication Error', 'Please login again to continue');
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      } else {
        toast.error('Error', err.response?.data?.message || err.message || 'Something went wrong');
      }
    } finally {
      setSubmitting(false);
    }
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
    setShowForm(true);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

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
      const res = await axiosInstance.put(
        `/service-books/status/${id}`,
        { isActive: newStatus === 'Active' }
      );
      console.log('Status Update Response:', res.data);
      
      if (res.data?.status === 200) {
        toast.success('Status Updated', `${statusAction.name} is now ${newStatus}`);
        await fetchServiceBooks();
      } else {
        throw new Error(res.data?.message || 'Status change failed');
      }
    } catch (err) {
      console.error('Status Update Error:', err);
      if (err.response?.status === 401) {
        toast.error('Authentication Error', 'Please login again');
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      } else {
        toast.error('Error', err.response?.data?.message || 'Failed to change status');
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

  if (loading && serviceBooks.length === 0 && !showForm) {
    return <LoadingSpinner message="Loading service books..." />;
  }

  return (
    <div className="emp-root">
      <style>{`
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
        .cert-root {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
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
          box-shadow: 0 4px 12px rgba(157, 23, 77, 0.3);
        }
        .cert-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(157, 23, 77, 0.4);
        }
        .cert-add-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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
          box-shadow: 0 0 0 3px rgba(157, 23, 77, 0.1);
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
          box-shadow: 0 0 0 3px rgba(157, 23, 77, 0.1);
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
          background: rgba(15, 23, 42, 0.6);
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
      `}</style>

      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Service Book Management</h1>
          <p className="cert-subtitle">{totalItems} total service books</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button 
              className="cert-add-btn" 
              onClick={() => { 
                resetForm(); 
                setShowForm(true); 
              }}
            >
              <FaPlus size={13} /> Add Service Book
            </button>
          )}
          {showForm && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        // Form View
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit}>
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Employee Information</div>
              <div className="cert-form-grid-3col">
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
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
                      onFocus={() => {
                        if (employeeSearchTerm.length > 0) {
                          setShowEmployeeDropdown(true);
                        }
                      }}
                      onBlur={() => handleBlur('employeeName')}
                    />
                    {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
                      <div className="employee-dropdown">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map(emp => (
                            <div
                              key={emp.id}
                              className="employee-dropdown-item"
                              onClick={() => handleEmployeeSelect(emp)}
                            >
                              <div>
                                <div className="emp-name">{emp.name}</div>
                                <div className="emp-details">Code: {emp.code} | Dept: {emp.department}</div>
                              </div>
                              <span className="emp-code">{emp.designation}</span>
                            </div>
                          ))
                        ) : (
                          <div className="employee-dropdown-item">
                            <span style={{ color: '#94a3b8' }}>No employees found</span>
                          </div>
                        )}
                      </div>
                    )}
                    <FieldError msg={errors.employeeName} />
                  </div>
                </div>

                <div className={`cert-field-compact ${isFieldErr('employeeCode') ? 'has-error' : ''} ${isFieldOk('employeeCode') ? 'has-ok' : ''}`}>
                  <label>Employee Code <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Auto-Populated"
                    className="bg-light"
                    value={formData.employeeCode}
                    readOnly
                  />
                  <FieldError msg={errors.employeeCode} />
                </div>
                
                <div className={`cert-field-compact ${isFieldErr('department') ? 'has-error' : ''} ${isFieldOk('department') ? 'has-ok' : ''}`}>
                  <label>Department <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Auto-Populated"
                    className="bg-light"
                    value={formData.department}
                    readOnly
                  />
                  <FieldError msg={errors.department} />
                </div>
                
                <div className={`cert-field-compact ${isFieldErr('designation') ? 'has-error' : ''} ${isFieldOk('designation') ? 'has-ok' : ''}`}>
                  <label>Designation <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Auto-Populated"
                    className="bg-light"
                    value={formData.designation}
                    readOnly
                  />
                  <FieldError msg={errors.designation} />
                </div>
                
                <div className={`cert-field-compact ${isFieldErr('serviceBookNumber') ? 'has-error' : ''} ${isFieldOk('serviceBookNumber') ? 'has-ok' : ''}`}>
                  <label>Service Book Number <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Auto-Populated"
                    className="bg-light"
                    value={formData.serviceBookNumber}
                    readOnly
                  />
                  <FieldError msg={errors.serviceBookNumber} />
                </div>
              </div>
            </div>

            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>
                Cancel
              </button>
              <button type="submit" className="cert-add-btn" disabled={submitting}>
                {submitting ? (
                  <><span className="emp-spinner" /> {editingId ? 'Updating...' : 'Creating...'}</>
                ) : (
                  <><FaSave size={12} /> {editingId ? 'Update Service Book' : 'Create Service Book'}</>
                )}
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
                placeholder="Search by employee name, code, department or service book number..."
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

          {/* Service Books Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Employee Name</th>
                    <th>Employee Code</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Service Book No.</th>
                    <th>Created Date</th>
                    <th style={{ width: 80 }}>Status</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBooks.length > 0 ? (
                    currentBooks.map((book, idx) => (
                      <tr key={book.id}>
                        <td style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
                          {startIndex + idx + 1}
                        </td>
                        <td><div className="cert-name">{book.employeeName}</div></td>
                        <td>{book.employeeCode}</td>
                        <td>
                          <span style={{ padding: '2px 10px', background: '#dbeafe', borderRadius: '12px', fontSize: '11px', color: '#2563eb' }}>
                            {book.department}
                          </span>
                        </td>
                        <td>{book.designation}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                            {book.serviceBookNumber}
                          </span>
                        </td>
                        <td>{formatDate(book.createdAt)}</td>
                        <td>
                          <div 
                            className="status-toggle"
                            onClick={() => handleStatusToggle(book.id, book.employeeName, book.serviceBookStatus)}
                          >
                            <div 
                              className="toggle-track"
                              style={{ backgroundColor: book.serviceBookStatus === 'Active' ? '#9d174d' : '#d1d5db' }}
                            >
                              <div 
                                className="toggle-thumb"
                                style={{ left: book.serviceBookStatus === 'Active' ? '14px' : '2px' }}
                              />
                            </div>
                            <span 
                              className="status-label"
                              style={{ color: book.serviceBookStatus === 'Active' ? '#9d174d' : '#94a3b8' }}
                            >
                              {book.serviceBookStatus}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" style={{ justifyContent: 'center' }}>
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
                      <td colSpan="9">
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                          <FaBook size={48} style={{ color: '#cbd5e1' }} />
                          <div style={{ fontSize: '16px', fontWeight: '500', color: '#475569', marginTop: '12px' }}>
                            No service books found
                          </div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                            {searchTerm ? 'Try a different search term' : 'Click "Add Service Book" to create one'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info">
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} service books
                </div>
                <div className="cert-pagination">
                  <button 
                    className="cert-page-btn" 
                    disabled={page === 0} 
                    onClick={() => setPage(page - 1)}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots">…</span>
                    ) : (
                      <button 
                        key={pg} 
                        className={`cert-page-num ${pg === page ? 'active' : ''}`} 
                        onClick={() => setPage(pg)}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button 
                    className="cert-page-btn" 
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

      {/* Status Modal */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">
              {statusAction.newStatus === "Active" ? "✅" : "⛔"}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{" "}
              <strong>{statusAction.newStatus === "Active" ? "activate" : "deactivate"}</strong>{" "}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === "Inactive"
                ? "Inactive records cannot be edited until reactivated."
                : "This record will become active again."}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateServiceBook;