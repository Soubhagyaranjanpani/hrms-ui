
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaSearch, FaEdit, FaTrash, FaUserPlus, FaTimes,
  FaArrowLeft, FaSave, FaExclamationCircle, FaUpload, FaDownload,
  FaUserFriends, FaPlus, FaChild, FaVenusMars, FaGraduationCap, FaBriefcase
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import axios from 'axios';

/* ─── Validation Rules ─── */
const RULES = {
  name: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    patternMsg: 'Only letters, spaces, hyphens and apostrophes allowed'
  }, 
  
  email: {
    required: true,
    maxLen: 100,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMsg: 'Enter a valid email address'
  },
  password: {
    required: true,
    minLen: 6,
    maxLen: 32,
    pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
    patternMsg: 'Must contain at least one letter and one number'
  },
  phone: {
    required: false,
    minLen: 10,
    maxLen: 10,
    pattern: /^[6-9]\d{9}$/,
    patternMsg: 'Enter a valid 10-digit Indian mobile number'
  },
  address: { required: false, maxLen: 200 },
  branchId: { required: true },
  departmentId: { required: true },
  roleId: { required: true },
  gradeId: { required: false },
  joiningDate: { required: false },
  bankAccount: { required: false, pattern: /^\d{9,18}$/, patternMsg: '9-18 digits only' },
  uan: { required: false, pattern: /^\d{12}$/, patternMsg: '12 digits required' },
  pan: { required: false, pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, patternMsg: 'Format: ABCDE1234F' }
};

const validate = (field, value, editMode = false) => {
  const r = RULES[field];
  if (!r) return '';
  if (field === 'password' && editMode) return '';

  const v = typeof value === 'string' ? value.trim() : String(value ?? '').trim();

  if (r.required && !v) return 'This field is required';
  if (!v && !r.required) return '';

  if (r.minLen && v.length < r.minLen) return `Minimum ${r.minLen} characters required`;
  if (r.maxLen && v.length > r.maxLen) return `Maximum ${r.maxLen} characters allowed`;
  if (r.pattern && !r.pattern.test(v)) return r.patternMsg;
  return '';
};

const validateAll = (formData, editMode) => {
  const errors = {};
  const fields = ['name', 'email', 'phone', 'address', 'branchId', 'departmentId', 'roleId', 'gradeId', 'joiningDate', 'bankAccount', 'uan', 'pan'];
  if (!editMode) fields.push('password');
  fields.forEach(f => {
    const err = validate(f, formData[f], editMode);
    if (err) errors[f] = err;
  });
  return errors;
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const RELATION_OPTIONS = [
  { value: 'SPOUSE', label: 'Spouse (Husband/Wife)' },
  { value: 'FATHER', label: 'Father' },
  { value: 'MOTHER', label: 'Mother' },
  { value: 'SON', label: 'Son' },
  { value: 'DAUGHTER', label: 'Daughter' },
  { value: 'BROTHER', label: 'Brother' },
  { value: 'SISTER', label: 'Sister' },
  { value: 'FATHER_IN_LAW', label: 'Father-in-Law' },
  { value: 'MOTHER_IN_LAW', label: 'Mother-in-Law' },
  { value: 'OTHER', label: 'Other' }
];

const Employees = ({ user }) => {
  const [view, setView] = useState('list');
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Local pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // Client‑side search
  const [searchName, setSearchName] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Bulk upload states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // New Family States (without add family member button)
  const [marriedStatus, setMarriedStatus] = useState('');
  const [childrenCount, setChildrenCount] = useState(0);
  const [child1, setChild1] = useState('');
const [child2, setChild2] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  
  // Nominee list with serial numbers
  const [nomineeList, setNomineeList] = useState([]);
  const [nomineeFormData, setNomineeFormData] = useState({
    serialNo: '',
    name: '',
    relation: '',
    phone: ''
  });
  const [showNomineeForm, setShowNomineeForm] = useState(false);
  const [editingNomineeIndex, setEditingNomineeIndex] = useState(null);
  

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    joiningDate: '', roleId: '', departmentId: '',
    branchId: '', gradeId: '', address: '', profilePicture: '', bankAccount: '',
    uan: '', pan: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Qualification States
const [qualifications, setQualifications] = useState({
  tenth: {
    board: '',
    percentage: '',
    year: ''
  },
  twelfth: {
    board: '',
    percentage: '',
    year: ''
  },
  graduation: {
    university: '',
    degree: '',
    cgpa: '',
    percentage: '',
    year: ''
  }
});

// Experience State
const [experience, setExperience] = useState({
  company: '',
  position: '',
  years: '',
  months: ''
});

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  };

  // ──────────────── FETCH ALL EMPLOYEES ────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/employees?page=0&size=1000`, axiosConfig);
      if (res.data?.status === 200 && res.data?.response) {
        const cleaned = (res.data.response.content || []).map(emp => ({
          ...emp,
          name: cleanName(emp.name)
        }));
        setAllEmployees(cleaned);
      } else {
        setAllEmployees([]);
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Failed to fetch employees');
      setAllEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Client‑side filtering
  const filteredEmployees = allEmployees.filter(emp => {
    const query = searchName.toLowerCase().trim();
    if (!query) return true;
    return (
      emp.name?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.departmentName?.toLowerCase().includes(query) ||
      emp.roleName?.toLowerCase().includes(query) ||
      emp.branchName?.toLowerCase().includes(query)
    );
  });

  // Local pagination
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [searchName]);

  // Fetch data once on mount
  useEffect(() => {
    fetchEmployees();
    fetchBranches();
    fetchRoles();
    fetchAllDepartments();
    fetchGrades();
  }, []);

  const cleanName = (name) => {
    if (!name) return '';
    let cleaned = name.replace(/\s+null\s*/gi, ' ').replace(/\s+null$/i, '');
    cleaned = cleaned.replace(/^null\s+/i, '');
    cleaned = cleaned.trim();
    return cleaned || name;
  };

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await axios.get(`${BASE_URL}/branches/list?flag=0`, axiosConfig);
      if (res.data?.status === 200) setBranches(res.data.response);
    } catch { toast.error('Error', 'Failed to fetch branches'); }
    finally { setLoadingBranches(false); }
  };

  const fetchAllDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const res = await axios.get(`${BASE_URL}/departments/list?flag=0`, axiosConfig);
      if (res.data?.status === 200) {
        setAllDepartments(res.data.response);
        setDepartments(res.data.response);
      }
    } catch { toast.error('Error', 'Failed to fetch departments'); }
    finally { setLoadingDepartments(false); }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await axios.get(`${BASE_URL}/roles/list?flag=0`, axiosConfig);
      if (res.data?.status === 200) setRoles(res.data.response);
    } catch { toast.error('Error', 'Failed to fetch roles'); }
    finally { setLoadingRoles(false); }
  };

  const fetchGrades = async () => {
    setLoadingGrades(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/grades`, axiosConfig);
      if (res.data?.status === 200) setGrades(res.data.response || []);
    } catch { toast.error('Error', 'Failed to fetch grades'); }
    finally { setLoadingGrades(false); }
  };

  const filterDepartmentsByBranch = (branchId) => {
    if (!branchId) { setDepartments(allDepartments); return; }
    setDepartments(allDepartments.filter(d => d.branchId === parseInt(branchId)));
  };

  // Nominee functions
  const addOrUpdateNominee = () => {
    if (!nomineeFormData.name.trim()) {
      toast.warning('Validation', 'Please enter nominee name');
      return;
    }
    if (!nomineeFormData.relation) {
      toast.warning('Validation', 'Please select relation');
      return;
    }
    
    if (editingNomineeIndex !== null) {
      const updated = [...nomineeList];
      updated[editingNomineeIndex] = { ...nomineeFormData };
      setNomineeList(updated);
      toast.success('Success', 'Nominee updated successfully');
    } else {
      const newSerialNo = nomineeList.length + 1;
      setNomineeList([...nomineeList, { ...nomineeFormData, serialNo: newSerialNo }]);
      toast.success('Success', 'Nominee added successfully');
    }
    resetNomineeForm();
  };

  // Handle Qualification Change
const handleQualificationChange = (level, field, value) => {
  setQualifications(prev => ({
    ...prev,
    [level]: {
      ...prev[level],
      [field]: value
    }
  }));
};

// Handle Experience Change
const handleExperienceChange = (field, value) => {
  setExperience(prev => ({
    ...prev,
    [field]: value
  }));
};

  const editNominee = (index) => {
    setEditingNomineeIndex(index);
    setNomineeFormData({ ...nomineeList[index] });
    setShowNomineeForm(true);
  };

  const removeNominee = (index) => {
    setNomineeList(nomineeList.filter((_, i) => i !== index));
    const reordered = nomineeList.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      serialNo: idx + 1
    }));
    setNomineeList(reordered);
    toast.success('Success', 'Nominee removed successfully');
  };

  const resetNomineeForm = () => {
    setNomineeFormData({ serialNo: '', name: '', relation: '', phone: '' });
    setEditingNomineeIndex(null);
    setShowNomineeForm(false);
  };

  // ──────────────── BULK UPLOAD HANDLERS ────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      toast.error('Invalid File', 'Please upload an Excel (.xlsx, .xls) or CSV file');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'File size should not exceed 5MB');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setSelectedFile(file);
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast.warning('No File', 'Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadConfig = {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      };

      const res = await axios.post(
        `${BASE_URL}/api/employees/bulk-upload`,
        formData,
        uploadConfig
      );

      if (res.data?.status === 200) {
        toast.success('Success', res.data?.message || 'Employees uploaded successfully');
        setShowBulkUploadModal(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchEmployees();
      } else {
        toast.error('Error', res.data?.message || 'Failed to upload employees');
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to upload employees';
      toast.error('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const headers = [
      'Name', 'Email', 'Password', 'Phone', 'Branch ID', 
      'Department ID', 'Role ID', 'Grade ID', 'Joining Date',
      'Address', 'Bank Account', 'UAN', 'PAN'
    ];
    
    const sampleData = [
      'John Doe', 'john@example.com', 'pass123', '9876543210', '1',
      '1', '1', '1', '2024-01-01',
      '123 Main St', '1234567890', '123456789012', 'ABCDE1234F'
    ];
    
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_bulk_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template Downloaded', 'Fill in the template and upload it back');
  };

  // ──────────────── All form handlers ────────────────
  const handleChange = (field, value) => {
    if (field === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
    if (field === 'name' && /\d/.test(value)) return;
    if (field === 'pan') value = value.toUpperCase();

    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value, editMode) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(field, formData[field], editMode) }));
  };

  const handleBranchChange = (branchId) => {
    const updated = { ...formData, branchId, departmentId: '' };
    setFormData(updated);
    filterDepartmentsByBranch(branchId);
    if (touched.branchId) setErrors(prev => ({ ...prev, branchId: validate('branchId', branchId) }));
    if (touched.departmentId) setErrors(prev => ({ ...prev, departmentId: 'This field is required' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allFields = [
      'name', 'email', 'phone', 'password',
      'branchId', 'departmentId', 'roleId', 'gradeId',
      'joiningDate', 'address',
      'bankAccount', 'uan', 'pan'
    ];

    setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));

    const errs = validateAll(formData, editMode);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);

    try {
      const employeeData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone,
        joiningDate: formData.joiningDate,
        roleId: parseInt(formData.roleId),
        departmentId: parseInt(formData.departmentId),
        branchId: parseInt(formData.branchId),
        gradeId: formData.gradeId ? parseInt(formData.gradeId) : null,
        address: formData.address.trim(),
        profilePicture: formData.profilePicture,
        bankAccount: formData.bankAccount,
        uan: formData.uan,
        pan: formData.pan,
        marriedStatus: marriedStatus,
        childrenCount: parseInt(childrenCount) || 0,
        child1: child1,
  child2: child2,
   qualifications: qualifications,
  experience: experience,
        fatherName: fatherName,
        motherName: motherName,
        nomineeList: nomineeList.map(n => ({
          serialNo: n.serialNo,
          name: n.name,
          relation: n.relation,
          phone: n.phone
        }))
      };

      if (editMode) {
        const res = await axios.put(
          `${BASE_URL}/api/employees/${selectedEmployee.id}`,
          employeeData,
          axiosConfig
        );

        if (res.data?.status === 200) {
          toast.success('Success', 'Employee updated successfully');
          resetForm();
          setView('list');
          fetchEmployees();
        } else {
          toast.error('Error', res.data?.message || 'Failed to update');
        }
      } else {
        employeeData.password = formData.password;
        const res = await axios.post(
          `${BASE_URL}/api/employees/create`,
          employeeData,
          axiosConfig
        );

        if (res.data?.status === 200) {
          toast.success('Success', 'Employee created successfully');
          resetForm();
          setView('list');
          fetchEmployees();
        } else {
          toast.error('Error', res.data?.message || 'Failed to create');
        }
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (emp) => { setEmployeeToDelete(emp); setShowDeleteModal(true); };
  
  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      const res = await axios.delete(`${BASE_URL}/api/employees/${employeeToDelete.id}`, axiosConfig);
      if (res.data?.status === 200) {
        toast.success('Success', `${employeeToDelete.name} deleted`);
        setShowDeleteModal(false); setEmployeeToDelete(null); fetchEmployees();
      } else { toast.error('Error', res.data?.message || 'Failed to delete'); }
    } catch (err) { toast.error('Error', err.response?.data?.message || 'Failed to delete'); }
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    const fd = {
      name: cleanName(emp.name || ''), email: emp.email || '', password: '',
      phone: emp.phone || '', joiningDate: emp.joiningDate || '',
      roleId: '', departmentId: '', branchId: '', gradeId: '',
      address: emp.address || '', profilePicture: emp.profilePicture || '',
      bankAccount: emp.bankAccount || '', uan: emp.uan || '', pan: emp.pan || ''
    };
    if (emp.branchName) {
      const branch = branches.find(b => b.name === emp.branchName);
      if (branch) { fd.branchId = branch.id; filterDepartmentsByBranch(branch.id); }
    }
    if (emp.departmentName) {
      const dept = allDepartments.find(d => d.name === emp.departmentName);
      if (dept) fd.departmentId = dept.id;
    }
    if (emp.roleName) {
      const role = roles.find(r => r.name === emp.roleName);
      if (role) fd.roleId = role.id;
    }
    if (emp.gradeId) {
      fd.gradeId = emp.gradeId;
    }
    setFormData(fd); setErrors({}); setTouched({});
    setEditMode(true); setView('form');
    
    // Load family data
    setMarriedStatus(emp.marriedStatus || '');
    setChildrenCount(emp.childrenCount || 0);
    setChild1(emp.child1 || '');
setChild2(emp.child2 || '');
if (emp.qualifications) {
  setQualifications(emp.qualifications);
}
if (emp.experience) {
  setExperience(emp.experience);
}
    setFatherName(emp.fatherName || '');
    setMotherName(emp.motherName || '');
    setNomineeList(emp.nomineeList || []);
  };

  const resetForm = () => {
    setFormData({ 
      name: '', email: '', password: '', phone: '', 
      joiningDate: '', roleId: '', departmentId: '', 
      branchId: '', gradeId: '', address: '', 
      profilePicture: '', bankAccount: '', uan: '', pan: '' 
    });
    setErrors({}); setTouched({});
    setEditMode(false); setSelectedEmployee(null);
    setMarriedStatus('');
    setChildrenCount(0);
    setChild1('');
setChild2('');
setQualifications({
  tenth: { board: '', percentage: '', year: '' },
  twelfth: { board: '', percentage: '', year: '' },
  graduation: { university: '', degree: '', cgpa: '', percentage: '', year: '' }
});
setExperience({ company: '', position: '', years: '', months: '' });
    setFatherName('');
    setMotherName('');
    setNomineeList([]);
    resetNomineeForm();
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const cleanedName = cleanName(fullName);
    const nameParts = cleanedName.trim().split(/\s+/);
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    const firstInitial = nameParts[0].charAt(0);
    const lastInitial = nameParts[nameParts.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };

  const avatarColors = [
    { bg: '#ede9fe', color: '#5b21b6' }, { bg: '#fff0e8', color: '#c2410c' },
    { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef3c7', color: '#92400e' },
    { bg: '#e0e7ff', color: '#3730a3' }, { bg: '#fce7f3', color: '#9d174d' },
  ];
  const getAvatarColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];

  const isFieldOk = (f) => touched[f] && !errors[f] && (typeof formData[f] === 'string' ? formData[f].trim() : formData[f]);
  const isFieldErr = (f) => touched[f] && !!errors[f];

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

  if (loading && view === 'list' && allEmployees.length === 0) {
    return <LoadingSpinner message="Loading employees..." />;
  }

  return (
    <div className="emp-root">
      <div className="emp-header" style={{ justifyContent: view !== 'list' ? 'space-between' : 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {view !== 'list' ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? 'Edit Employee' : 'Add Employee'}</h1>
              <p className="emp-subtitle">{editMode ? 'Update employee information' : 'Enter new employee details'}</p>
            </div>
            <button className="emp-back-btn" onClick={() => { setView('list'); resetForm(); }}>
              <FaArrowLeft size={12} /> Back to List
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 className="emp-title">Employee Directory</h1>
              <p className="emp-subtitle">{totalItems} total employees</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="emp-bulk-btn" onClick={() => setShowBulkUploadModal(true)}>
                <FaUpload size={13} /> Bulk Upload
              </button>
              <button className="emp-add-btn" onClick={() => { resetForm(); setView('form'); }}>
                <FaUserPlus size={13} /> Add Employee
              </button>
            </div>
          </>
        )}
      </div>

      {view === 'list' ? (
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by name, email, department, role or branch…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              {searchName && (
                <button className="emp-search-clear" onClick={() => setSearchName('')}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="emp-table-card">
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Branch</th>
                    <th>Joined</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length > 0 ? currentEmployees.map((emp, idx) => {
                    const cleanedName = cleanName(emp.name);
                    const ac = getAvatarColor(cleanedName);
                    const initials = getInitials(cleanedName);
                    return (
                      <tr key={emp.id} className="emp-row">
                        <td className="emp-sno">{startIndex + idx + 1}</td>
                        <td>
                          <div className="emp-info-cell">
                            <div className="emp-avatar" style={{ background: ac.bg, color: ac.color }}>
                              {initials}
                            </div>
                            <div>
                              <div className="emp-name">{cleanedName || '—'}</div>
                              <div className="emp-email">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {emp.departmentName
                            ? <span className="emp-pill emp-pill--indigo">{emp.departmentName}</span>
                            : <span className="emp-dash">—</span>}
                        </td>
                        <td>
                          {emp.roleName
                            ? <span className="emp-pill emp-pill--coral">{emp.roleName}</span>
                            : <span className="emp-dash">—</span>}
                        </td>
                        <td className="emp-branch">{emp.branchName || <span className="emp-dash">—</span>}</td>
                        <td className="emp-date">{formatDate(emp.joiningDate)}</td>
                        <td>
                          <div className="emp-actions">
                            <button className="emp-act emp-act--edit" onClick={() => handleEdit(emp)} title="Edit">
                              <FaEdit size={12} />
                            </button>
                            <button className="emp-act emp-act--del" onClick={() => confirmDelete(emp)} title="Delete">
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="7" className="emp-empty">
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon">👤</span>
                          <p>No employees found</p>
                          <small>Try a different search or add a new employee</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="emp-pagination" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="emp-page-info">
                    Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} employees
                  </span>
                </div>
                <div className="emp-page-controls">
                  <button className="emp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={`dots-${i}`} className="emp-page-dots">…</span>
                    ) : (
                      <button key={pg} className={`emp-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button className="emp-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // Form view
        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit} className="emp-form-compact">
            {/* Personal Information */}
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Personal Information</div>
              <div className="emp-form-grid-3col">
                <div className={`emp-field-compact ${isFieldErr('name') ? 'has-error' : ''} ${isFieldOk('name') ? 'has-ok' : ''}`}>
                  <label className="required">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    maxLength={50}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                  />
                  <FieldError msg={errors.name} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('email') ? 'has-error' : ''} ${isFieldOk('email') ? 'has-ok' : ''}`}>
                  <label className="required">Email</label>
                  <input
                    type="email"
                    placeholder="example@company.com"
                    value={formData.email}
                    maxLength={100}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    disabled={editMode}
                  />
                  <FieldError msg={errors.email} />
                </div>

                {!editMode && (
                  <div className={`emp-field-compact ${isFieldErr('password') ? 'has-error' : ''} ${isFieldOk('password') ? 'has-ok' : ''}`}>
                    <label className="required">Password</label>
                    <input
                      type="password"
                      placeholder="Min 6 chars, letters + numbers"
                      value={formData.password}
                      maxLength={32}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                    />
                    <FieldError msg={errors.password} />
                  </div>
                )}

                <div className={`emp-field-compact ${isFieldErr('phone') ? 'has-error' : ''} ${isFieldOk('phone') ? 'has-ok' : ''}`}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    maxLength={10}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                  />
                  <FieldError msg={errors.phone} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('bankAccount') ? 'has-error' : ''} ${isFieldOk('bankAccount') ? 'has-ok' : ''}`}>
                  <label>Bank Account</label>
                  <input
                    type="text"
                    placeholder="Account number"
                    value={formData.bankAccount}
                    maxLength={20}
                    onChange={(e) => handleChange('bankAccount', e.target.value)}
                    onBlur={() => handleBlur('bankAccount')}
                  />
                  <FieldError msg={errors.bankAccount} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('uan') ? 'has-error' : ''} ${isFieldOk('uan') ? 'has-ok' : ''}`}>
                  <label>UAN</label>
                  <input
                    type="text"
                    placeholder="12-digit UAN"
                    value={formData.uan}
                    maxLength={12}
                    onChange={(e) => handleChange('uan', e.target.value)}
                    onBlur={() => handleBlur('uan')}
                  />
                  <FieldError msg={errors.uan} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('pan') ? 'has-error' : ''} ${isFieldOk('pan') ? 'has-ok' : ''}`}>
                  <label>PAN</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    maxLength={10}
                    onChange={(e) => handleChange('pan', e.target.value)}
                    onBlur={() => handleBlur('pan')}
                  />
                  <FieldError msg={errors.pan} />
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            {/* Work Details */}
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Work Details</div>
              <div className="emp-form-grid-3col">
                <div className={`emp-field-compact ${isFieldErr('branchId') ? 'has-error' : ''} ${isFieldOk('branchId') ? 'has-ok' : ''}`}>
                  <label className="required">Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    onBlur={() => handleBlur('branchId')}
                    disabled={loadingBranches}
                  >
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <FieldError msg={errors.branchId} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('departmentId') ? 'has-error' : ''} ${isFieldOk('departmentId') ? 'has-ok' : ''}`}>
                  <label className="required">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleChange('departmentId', e.target.value)}
                    onBlur={() => handleBlur('departmentId')}
                  >
                    <option value="">{!formData.branchId ? 'Select branch first' : 'Select department'}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <FieldError msg={errors.departmentId} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('roleId') ? 'has-error' : ''} ${isFieldOk('roleId') ? 'has-ok' : ''}`}>
                  <label className="required">Role</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => handleChange('roleId', e.target.value)}
                    onBlur={() => handleBlur('roleId')}
                    disabled={loadingRoles}
                  >
                    <option value="">Select role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <FieldError msg={errors.roleId} />
                </div>

                <div className={`emp-field-compact ${isFieldErr('gradeId') ? 'has-error' : ''} ${isFieldOk('gradeId') ? 'has-ok' : ''}`}>
                  <label>Grade</label>
                  <select
                    value={formData.gradeId}
                    onChange={(e) => handleChange('gradeId', e.target.value)}
                    onBlur={() => handleBlur('gradeId')}
                    disabled={loadingGrades}
                  >
                    <option value="">Select grade (optional)</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <FieldError msg={errors.gradeId} />
                </div>

                <div className="emp-field-compact">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleChange('joiningDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            {/* Address */}
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Address (Optional)</div>
              <div className={`emp-field-compact ${isFieldErr('address') ? 'has-error' : ''} ${isFieldOk('address') ? 'has-ok' : ''}`} style={{ gridColumn: 'span 3' }}>
                <textarea
                  rows={2}
                  placeholder="Enter address"
                  value={formData.address}
                  maxLength={200}
                  onChange={(e) => handleChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                />
                <FieldError msg={errors.address} />
              </div>
            </div>
{/* Qualification Section */}
<div className="emp-divider" />
<div className="emp-form-section-compact">
  <div className="emp-section-label">
    <FaGraduationCap style={{ marginRight: '8px' }} /> Educational Qualifications
  </div>

  {/* 10th Standard */}
  <div className="emp-form-section-compact" style={{ marginBottom: '20px' }}>
    <div className="emp-section-label" style={{ fontSize: '14px', fontWeight: '600' }}>10th Standard</div>
    <div className="emp-form-grid-3col">
      <div className="emp-field-compact">
        <label>Board</label>
        <input
          type="text"
          placeholder="e.g., CBSE, ICSE, State Board"
          value={qualifications.tenth.board}
          onChange={(e) => handleQualificationChange('tenth', 'board', e.target.value)}
        />
      </div>
      <div className="emp-field-compact">
        <label>Percentage (%)</label>
        <input
          type="number"
          placeholder="Enter percentage"
          min="0"
          max="100"
          step="0.01"
          value={qualifications.tenth.percentage}
          onChange={(e) => handleQualificationChange('tenth', 'percentage', e.target.value)}
        />
      </div>
      <div className="emp-field-compact">
        <label>Passing Year</label>
        <input
          type="number"
          placeholder="YYYY"
          min="1950"
          max="2026"
          value={qualifications.tenth.year}
          onChange={(e) => handleQualificationChange('tenth', 'year', e.target.value)}
        />
      </div>
    </div>
  </div>

  {/* 12th Standard */}
  <div className="emp-form-section-compact" style={{ marginBottom: '20px' }}>
    <div className="emp-section-label" style={{ fontSize: '14px', fontWeight: '600' }}>12th Standard</div>
    <div className="emp-form-grid-3col">
      <div className="emp-field-compact">
        <label>Board</label>
        <input
          type="text"
          placeholder="e.g., CBSE, ICSE, State Board"
          value={qualifications.twelfth.board}
          onChange={(e) => handleQualificationChange('twelfth', 'board', e.target.value)}
        />
      </div>
      <div className="emp-field-compact">
        <label>Percentage (%)</label>
        <input
          type="number"
          placeholder="Enter percentage"
          min="0"
          max="100"
          step="0.01"
          value={qualifications.twelfth.percentage}
          onChange={(e) => handleQualificationChange('twelfth', 'percentage', e.target.value)}
        />
      </div>
      <div className="emp-field-compact">
        <label>Passing Year</label>
        <input
          type="number"
          placeholder="YYYY"
          min="1950"
          max="2026"
          value={qualifications.twelfth.year}
          onChange={(e) => handleQualificationChange('twelfth', 'year', e.target.value)}
        />
      </div>
    </div>
  </div>

  {/* Graduation */}
  <div className="emp-form-section-compact">
    <div className="emp-section-label" style={{ fontSize: '14px', fontWeight: '600' }}>Graduation</div>
    <div className="emp-form-grid-3col">
      <div className="emp-field-compact">
        <label>University</label>
        <input
          type="text"
          placeholder="University name"
          value={qualifications.graduation.university}
          onChange={(e) => handleQualificationChange('graduation', 'university', e.target.value)}
        />
      </div>
      <div className="emp-field-compact">
        <label>Degree</label>
        <input
          type="text"
          placeholder="e.g., B.Tech, B.Sc, B.Com, BA"
          value={qualifications.graduation.degree}
          onChange={(e) => handleQualificationChange('graduation', 'degree', e.target.value)}
        />
      </div>
      <div className="emp-field-compact">
        <label>CGPA</label>
        <input
          type="number"
          placeholder="CGPA (0-10)"
          min="0"
          max="10"
          step="0.01"
          value={qualifications.graduation.cgpa}
          onChange={(e) => handleQualificationChange('graduation', 'cgpa', e.target.value)}
        />
      </div>
      <div className="emp-field-compact">
        <label>Passing Year</label>
        <input
          type="number"
          placeholder="YYYY"
          min="1950"
          max="2026"
          value={qualifications.graduation.year}
          onChange={(e) => handleQualificationChange('graduation', 'year', e.target.value)}
        />
      </div>
    </div>
  </div>
</div>

{/* Experience Section */}
<div className="emp-divider" />
<div className="emp-form-section-compact">
  <div className="emp-section-label">
    <FaBriefcase style={{ marginRight: '8px' }} /> Work Experience
  </div>
  
  <div className="emp-form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
    <div className="emp-field-compact">
      <label>Company Name</label>
      <input
        type="text"
        placeholder="Last/Current company"
        value={experience.company}
        onChange={(e) => handleExperienceChange('company', e.target.value)}
      />
    </div>
    
    <div className="emp-field-compact">
      <label>Position / Designation</label>
      <input
        type="text"
        placeholder="e.g., Software Engineer, Manager"
        value={experience.position}
        onChange={(e) => handleExperienceChange('position', e.target.value)}
      />
    </div>
    
    <div className="emp-field-compact">
      <label>Years of Experience</label>
      <input
        type="number"
        placeholder="Years"
        min="0"
        max="50"
        value={experience.years}
        onChange={(e) => handleExperienceChange('years', e.target.value)}
      />
    </div>
    
    <div className="emp-field-compact">
      <label>Months of Experience</label>
      <input
        type="number"
        placeholder="Months (0-11)"
        min="0"
        max="11"
        value={experience.months}
        onChange={(e) => handleExperienceChange('months', e.target.value)}
      />
    </div>
  </div>
  
</div>
            {/* Family Information */}
            <div className="emp-divider" />
            <div className="emp-form-section-compact">
              <div className="emp-section-label">
                <FaUserFriends style={{ marginRight: '8px' }} /> Family Information
              </div>
              
              {/* Married Status Dropdown */}
               <div className="emp-form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="emp-field-compact">
                  <label>Father's Name</label>
                  <input
                    type="text"
                    placeholder="Enter father's full name"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                  />
                </div>
                <div className="emp-field-compact">
                  <label>Mother's Name</label>
                  <input
                    type="text"
                    placeholder="Enter mother's full name"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                  />
                </div>
              </div>
            </div>
              <div className="emp-form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="emp-field-compact">
                  <label>Married Status</label>
                  <select
                    value={marriedStatus}
                    onChange={(e) => setMarriedStatus(e.target.value)}
                  >
                    <option value="">Select status</option>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
                
                <div className="emp-field-compact">
                  <label>Number of Children</label>
                  <input
                    type="number"
                    placeholder="Count"
                    min="0"
                    max="20"
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(parseInt(e.target.value) || 0)}
                  />
                </div>
                {/* Children Details - Only Child 1 and Child 2 */}
<div className="emp-divider" />
<div className="emp-form-section-compact">
 
  
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
    {/* Child 1 Input */}
    <div className="emp-field-compact">
      <label>Child 1 Name</label>
      <input
        type="text"
        placeholder="Enter first child's name"
        value={child1}
        onChange={(e) => setChild1(e.target.value)}
      />
    </div>
    
    {/* Child 2 Input */}
    <div className="emp-field-compact">
      <label>Child 2 Name</label>
      <input
        type="text"
        placeholder="Enter second child's name"
        value={child2}
        onChange={(e) => setChild2(e.target.value)}
      />
    </div>
  </div>
</div>
              </div>

             

            {/* Nominee List Section */}
            <div className="emp-divider" />
            <div className="emp-form-section-compact">
              <div className="emp-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><FaChild style={{ marginRight: '8px' }} /> Nominee List</span>
                {!showNomineeForm && (
                  <button type="button" className="emp-add-family-btn" onClick={() => setShowNomineeForm(true)}>
                    <FaPlus size={12} /> Add Nominee
                  </button>
                )}
              </div>

              {/* Nominee List Table */}
              {nomineeList.length > 0 && (
                <div className="emp-table-wrap" style={{ marginTop: '16px' }}>
                  <table className="emp-table" style={{ minWidth: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>S.No.</th>
                        <th>Nominee Name</th>
                        <th>Relation</th>
                        <th>Phone No.</th>
                        <th style={{ width: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nomineeList.map((nominee, idx) => (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center' }}>{nominee.serialNo}</td>
                          <td><strong>{nominee.name}</strong></td>
                          <td>{nominee.relation}</td>
                          <td>{nominee.phone || '—'}</td>
                          <td>
                            <div className="emp-actions" style={{ gap: '6px' }}>
                              <button type="button" onClick={() => editNominee(idx)} className="emp-act emp-act--edit" title="Edit">
                                <FaEdit size={12} />
                              </button>
                              <button type="button" onClick={() => removeNominee(idx)} className="emp-act emp-act--del" title="Delete">
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add/Edit Nominee Form */}
              {showNomineeForm && (
                <div className="emp-family-form" style={{ marginTop: '16px' }}>
                  <div className="emp-family-form-header">
                    <h4>{editingNomineeIndex !== null ? 'Edit Nominee' : 'Add Nominee'}</h4>
                    <button type="button" onClick={resetNomineeForm} className="emp-close-form-btn">
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="emp-form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="emp-field-compact">
                      <label className="required">Nominee Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter nominee name"
                        value={nomineeFormData.name}
                        onChange={(e) => setNomineeFormData({ ...nomineeFormData, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="emp-field-compact">
                      <label className="required">Relation</label>
                      <select
                        value={nomineeFormData.relation}
                        onChange={(e) => setNomineeFormData({ ...nomineeFormData, relation: e.target.value })}
                      >
                        <option value="">Select relation</option>
                        {RELATION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="emp-field-compact">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength="10"
                        value={nomineeFormData.phone}
                        onChange={(e) => setNomineeFormData({ ...nomineeFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      />
                    </div>
                  </div>
                  
                  <div className="emp-family-form-actions" style={{ marginTop: '16px' }}>
                    <button type="button" onClick={resetNomineeForm} className="emp-cancel-family-btn">
                      Cancel
                    </button>
                    <button type="button" onClick={addOrUpdateNominee} className="emp-save-family-btn">
                      <FaSave size={12} /> {editingNomineeIndex !== null ? 'Update' : 'Add'} Nominee
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="emp-form-actions">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="emp-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting
                  ? <><span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</>
                  : <><FaSave size={12} /> {editMode ? 'Update Employee' : 'Create Employee'}</>
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon"><FaTrash size={18} /></div>
            <h3 className="emp-modal-title">Delete Employee</h3>
            <p className="emp-modal-body">
              You're about to permanently delete <strong>{cleanName(employeeToDelete.name)}</strong>.
            </p>
            <p className="emp-modal-warn">This action cannot be undone.</p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="emp-modal-overlay" onClick={() => { 
          if (!uploading) {
            setShowBulkUploadModal(false); 
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }}>
          <div className="emp-modal emp-bulk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <FaUpload size={18} />
            </div>
            <h3 className="emp-modal-title">Bulk Upload Employees</h3>
            <p className="emp-modal-body">
              Upload an Excel or CSV file containing employee data.
            </p>
            
            <div className="emp-bulk-upload-area">
              <div 
                className={`emp-file-dropzone ${selectedFile ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                
                {!selectedFile ? (
                  <>
                    <FaUpload size={24} style={{ color: '#6366f1', marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>Click to select file</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      Supported formats: .xlsx, .xls, .csv (Max 5MB)
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '24px' }}>📄</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>{selectedFile.name}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="emp-file-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={uploading}
                    >
                      <FaTimes size={10} /> Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="emp-bulk-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FaDownload size={14} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Download Template</span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                Don't have the correct format? Download our template and fill in the data.
              </p>
              <button
                type="button"
                className="emp-template-download-btn"
                onClick={downloadSampleTemplate}
              >
                <FaDownload size={12} /> Download Sample Template
              </button>
            </div>

            <div className="emp-modal-actions" style={{ marginTop: '20px' }}>
              <button 
                className="emp-modal-cancel" 
                onClick={() => {
                  setShowBulkUploadModal(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                className="emp-modal-confirm" 
                onClick={handleBulkUpload}
                disabled={!selectedFile || uploading}
                style={{ 
                  background: uploading || !selectedFile ? '#ccc' : '#6366f1',
                  cursor: uploading || !selectedFile ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? (
                  <><span className="emp-spinner" style={{ width: '14px', height: '14px' }} /> Uploading...</>
                ) : (
                  <><FaUpload size={12} /> Upload Employees</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;