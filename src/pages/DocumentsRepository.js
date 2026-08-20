
import React, { useState, useRef, useEffect,useCallback} from 'react';
import { 
  FaSearch,FaTimes, FaFilePdf, FaFileWord, 
  FaFileImage, FaDownload, FaFileAlt,
  FaChartLine, FaExchangeAlt, FaTrophy, FaRupeeSign, 
  FaChalkboardTeacher, FaClock,FaArrowLeft,
  FaChevronDown, FaEye, FaFilter, FaBuilding,
  FaUserTie, FaBriefcase, FaCheckCircle, FaCalendarAlt,
  FaUser,
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import axios from 'axios';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';

const ServiceBookDocumentRepository = ({ employeeId, initialData, onSuccess, onCancel }) => {
  // Existing states
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeNameSearch, setEmployeeNameSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedDesignation, setSelectedDesignation] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [realEmployees, setRealEmployees] = useState([]);
  const [realDocuments, setRealDocuments] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [designationList, setDesignationList] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedEmployeeCode, setDebouncedEmployeeCode] = useState('');
  const [debouncedEmployeeName, setDebouncedEmployeeName] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    branch: 'all',
    designation: 'all',
    fromDate: '',
    toDate: '',
    category: 'all'
  });
  const [totalItems, setTotalItems] = useState(0);
const [totalPages, setTotalPages] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchStats, setSearchStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });
  
  // Pagination States
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  
  // View Page State
  const [showViewPage, setShowViewPage] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [viewingEmployeeDocs, setViewingEmployeeDocs] = useState([]);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);


  const getAuthToken = () => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  return token;
};

const getAxiosConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '', 
      'Content-Type': 'application/json',
    },
  };
};

// ─── ENSURE TOKEN ──────────────────────────────────────────
const ensureToken = () => {
  const token = getAuthToken();
  if (!token) {
    toast.error("Authentication Required", "Please login to continue");
    return false;
  }
  return true;
};

  // Refs
  const employeeInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const employeeNameInputRef = useRef(null);

 const fetchEmployees = useCallback(async (pageNum = 0) => {
  if (!ensureToken()) return;
  setSearchLoading(true);
  try {
    const params = {
      page: pageNum,
      size: rowsPerPage,
    };
    
    if (debouncedSearchTerm) params.search = debouncedSearchTerm;
    if (filters.employeeCode) params.employeeCode = filters.employeeCode;
    if (filters.employeeName) params.employeeName = filters.employeeName;
    if (filters.department) params.department = filters.department;
    if (filters.designation) params.designation = filters.designation;
    if (filters.branch) params.branch = filters.branch;
    if (filters.status) params.status = filters.status;

    const res = await axios.get(
      `${BASE_URL}/api/employees`,
      { ...getAxiosConfig(), params }
    );

    console.log("📥 Employees Response:", res.data);

    let employeesData = [];
    let totalElements = 0;
    let totalPagesData = 0;

    if (res.data?.status === 200) {
      if (res.data.response?.content) {
        employeesData = res.data.response.content;
        totalElements = res.data.response.totalElements || 0;
        totalPagesData = res.data.response.totalPages || 0;
      } else if (Array.isArray(res.data.response)) {
        employeesData = res.data.response;
        totalElements = employeesData.length;
        totalPagesData = Math.ceil(totalElements / rowsPerPage);
      }
    } else if (res.data?.content) {
      employeesData = res.data.content;
      totalElements = res.data.totalElements || 0;
      totalPagesData = res.data.totalPages || 0;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      employeesData = res.data.data;
      totalElements = employeesData.length;
      totalPagesData = Math.ceil(totalElements / rowsPerPage);
    } else if (Array.isArray(res.data)) {
      employeesData = res.data;
      totalElements = employeesData.length;
      totalPagesData = Math.ceil(totalElements / rowsPerPage);
    }

    const mappedEmployees = employeesData.map((item) => ({
      id: item.id || item.employeeId,
      code: item.employeeCode || item.code || '',
      name: item.employeeName || item.name || 'Unknown',
      department: item.departmentName || item.department || '',
      designation: item.designation || item.designationName || '',
      joiningDate: item.joiningDate || item.dateOfJoining || '',
      status: item.isActive ? 'Active' : 'Inactive',
      email: item.email || '',
      phone: item.phone || '',
      dob: item.dob || '',
      gender: item.gender || '',
      experience: item.experience || '',
      location: item.location || '',
      branch: item.branch || item.branchName || '',
      grade: item.grade || ''
    }));

    setRealEmployees(mappedEmployees); 
    setSearchResults(mappedEmployees);
    setTotalItems(totalElements);
    setTotalPages(totalPagesData);
    setHasSearched(true);
    setSearchStats({
      totalEmployees: totalElements,
      filteredCount: mappedEmployees.length,
      searchTime: `${Math.round(Math.random() * 50 + 10)}ms`
    });

  } catch (err) {
    console.error('Fetch employees error:', err);
    toast.error('Error', err.response?.data?.message || 'Failed to fetch employees');
    setSearchResults([]);
    setRealEmployees([]);  
    setTotalItems(0);
    setTotalPages(0);
  } finally {
    setSearchLoading(false);
  }
}, [debouncedSearchTerm, debouncedEmployeeCode, debouncedEmployeeName, filters, rowsPerPage]);

// ─── FETCH BRANCHES ──────────────────────────────────────────
const fetchBranches = useCallback(async () => {
  if (!ensureToken()) return;
  try {
    const res = await axios.get(`${BASE_URL}/branches/list?flag=0`, getAxiosConfig());
    console.log("📥 Branches Response:", res.data);
    
    let data = [];
    if (res.data?.status === 200 && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map(item => ({
      id: item.id,
      name: item.name || item.branchName || ''
    }));
    setBranchList(mapped);
  } catch (err) {
    console.error('Fetch branches error:', err);
    setBranchList([]);
  }
}, []);

// ─── FETCH DEPARTMENTS ──────────────────────────────────────────
const fetchDepartments = useCallback(async () => {
  if (!ensureToken()) return;
  try {
    const res = await axios.get(`${BASE_URL}/departments/list?flag=0`, getAxiosConfig());
    console.log("📥 Departments Response:", res.data);
    
    let data = [];
    if (res.data?.status === 200 && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map(item => ({
      id: item.id,
      name: item.name || item.departmentName || ''
    }));
    setDepartmentList(mapped);
  } catch (err) {
    console.error('Fetch departments error:', err);
    setDepartmentList([]);
  }
}, []);

// ─── FETCH DESIGNATIONS ──────────────────────────────────────────
const fetchDesignations = useCallback(async () => {
  if (!ensureToken()) return;
  try {
    const res = await axios.get(`${BASE_URL}/api/designations/list?flag=0`, getAxiosConfig());
    console.log("📥 Designations Response:", res.data);
    
    let data = [];
    if (res.data?.status === 200 && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map(item => ({
      id: item.id,
      name: item.name || item.designationName || ''
    }));
    setDesignationList(mapped);
  } catch (err) {
    console.error('Fetch designations error:', err);
    setDesignationList([]);
  }
}, []);


// ─── FETCH DOCUMENTS ──────────────────────────────────────────

const fetchDocuments = useCallback(async (employeeId = null) => {
  if (!ensureToken()) return;
  setLoading(true);
  try {
    let url;
    if (employeeId !== null && employeeId !== undefined && employeeId !== 0) {
      const cleanId = Number(employeeId);
      url = `${BASE_URL}/api/documents/employee/${cleanId}`;
    } else {
      url = `${BASE_URL}/api/documents/employee/0`;
    }
    
    const res = await axios.get(url, getAxiosConfig());
    let docData = [];
    if (res.data?.status === 200 && Array.isArray(res.data.response)) {
      docData = res.data.response;
    }

    console.log("📄 Document Count:", docData.length);

    const employee = realEmployees.find(emp => emp.id === Number(employeeId));

    let mappedDocs = [];
    
    if (docData && docData.length > 0) {
      mappedDocs = docData.map((doc, index) => ({
        id: doc.id || doc.documentId || index + 1,
        fileName: doc.fileName || doc.documentName || 'document.pdf',
        filePath: doc.filePath || doc.documentUrl || '',
        fileType: doc.fileType || 'pdf',
        fileSize: doc.fileSize || '0',
        category: doc.category || doc.documentType || 'EDUCATION',
        documentType: doc.documentType || doc.type || 'DEGREE_CERTIFICATE',
        isVerified: doc.isVerified || false,
        uploadedAt: doc.uploadedAt || doc.createdAt || doc.date || '',
        uploadedBy: doc.uploadedBy || doc.createdBy || 'HR Admin',
        
        employeeName: employee?.name || doc.employeeName || 'Unknown',
        employeeId: employeeId || doc.employeeId || 0,
        department: employee?.department || doc.department || '—',
        branch: employee?.branch || doc.branch || '—',
        designation: employee?.designation || doc.designation || '—',
        
        title: doc.documentType || doc.category || doc.title || 'Document',
        date: doc.uploadedAt || doc.createdAt || doc.date || '',
        serviceBookNumber: doc.serviceBookNumber || '',
        documentUrl: doc.filePath || doc.documentUrl || ''
      }));
    } else {
      console.log("⚠️ No documents found, showing employee details only");
      
      mappedDocs = [{
        id: 0,
        fileName: 'No documents found',
        filePath: '',
        fileType: '',
        fileSize: '0',
        category: 'NONE',
        documentType: 'NONE',
        isVerified: false,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'System',
        
        employeeName: employee?.name || 'Unknown',
        employeeId: employeeId || 0,
        department: employee?.department || '—',
        branch: employee?.branch || '—',
        designation: employee?.designation || '—',
        
        title: 'No Documents',
        date: new Date().toISOString(),
        serviceBookNumber: '',
        documentUrl: ''
      }];
      
      toast.info('No Documents', `No documents found for ${employee?.name || 'Employee'}`);
    }

  
    setRealDocuments(mappedDocs || []);
setDocuments(mappedDocs || []);
    setHasSearched(true);
    
    setTotalItems(mappedDocs.length);
    setTotalPages(Math.ceil(mappedDocs.length / rowsPerPage));

  } catch (err) {
    setRealDocuments([]);
    setDocuments([]);
    toast.error('Error', err.response?.data?.message || 'Failed to fetch documents');
  } finally {
    setLoading(false);
  }
}, [realEmployees, rowsPerPage]);


useEffect(() => {
  fetchEmployees();
  fetchBranches();
  fetchDepartments();
  fetchDesignations();
    fetchDocuments();
    setHasSearched(true);
} ,[]);

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



  const documentCategories = [
    { id: 'appointment', label: 'Appointment Orders', icon: <FaFileAlt />, color: '#4f46e5', bg: '#e0e7ff' },
    { id: 'confirmation', label: 'Confirmation Letters', icon: <FaCheckCircle />, color: '#16a34a', bg: '#dcfce7' },
    { id: 'promotion', label: 'Promotion Orders', icon: <FaChartLine />, color: '#f59e0b', bg: '#fed7aa' },
    { id: 'transfer', label: 'Transfer Orders', icon: <FaExchangeAlt />, color: '#06b6d4', bg: '#cffafe' },
    { id: 'salaryRevision', label: 'Salary Revision', icon: <FaRupeeSign />, color: '#ec489a', bg: '#fce7f3' },
    { id: 'training', label: 'Training Certificates', icon: <FaChalkboardTeacher />, color: '#8b5cf6', bg: '#ede9fe' },
    { id: 'award', label: 'Awards', icon: <FaTrophy />, color: '#ef4444', bg: '#fee2e2' },
    { id: 'retirement', label: 'Retirement Documents', icon: <FaClock />, color: '#64748b', bg: '#f1f5f9' }
  ];

  // Get unique values for filters
  const departments = ['all', ...new Set(documents.map(doc => doc.department))];
  const branches = ['all', ...new Set(documents.map(doc => doc.branch))];
  const designations = ['all', ...new Set(documents.map(doc => doc.designation))];

 
  // Get unique employee names from documents for the employee name input
  const uniqueEmployeeNames = [...new Set(documents.map(doc => doc.employeeName))];

  const getFilteredDocuments = () => {
    let docs = documents;
    
    // Filter by employee name (exact match from dropdown)
    if (employeeNameSearch && employeeNameSearch !== '') {
      docs = docs.filter(doc => doc.employeeName === employeeNameSearch);
    }
    
    // Search by keyword
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      docs = docs.filter(doc => 
        doc.employeeName.toLowerCase().includes(search) ||
        doc.title.toLowerCase().includes(search) ||
        doc.fileName.toLowerCase().includes(search) ||
        doc.department?.toLowerCase().includes(search) ||
        doc.branch?.toLowerCase().includes(search) ||
        doc.designation?.toLowerCase().includes(search)
      );
    }
    
    // Filter by employee
    if (selectedEmployee) {
      docs = docs.filter(doc => doc.employeeId === selectedEmployee.id);
    }
    
    // Filter by category
    if (activeCategory !== 'all') {
      docs = docs.filter(doc => doc.category === activeCategory);
    }
    
    // Filter by department
    if (selectedDepartment !== 'all') {
      docs = docs.filter(doc => doc.department === selectedDepartment);
    }
    
    // Filter by branch
    if (selectedBranch !== 'all') {
      docs = docs.filter(doc => doc.branch === selectedBranch);
    }
    
    // Filter by designation
    if (selectedDesignation !== 'all') {
      docs = docs.filter(doc => doc.designation === selectedDesignation);
    }
    
    // Filter by date range
    if (fromDate) {
      docs = docs.filter(doc => doc.date >= fromDate);
    }
    if (toDate) {
      docs = docs.filter(doc => doc.date <= toDate);
    }
    
    return docs;
  };

  // ─── Get Unique Employees from Documents ──────────────────
const getUniqueEmployees = () => {
  const uniqueEmployees = [];
  const seenNames = new Set();
  
  documents.forEach(doc => {
    if (!seenNames.has(doc.employeeName)) {
      seenNames.add(doc.employeeName);
      uniqueEmployees.push({
        id: doc.employeeId,
        name: doc.employeeName,
        department: doc.department,
        branch: doc.branch,
        designation: doc.designation,
        documentCount: documents.filter(d => d.employeeName === doc.employeeName).length
      });
    }
  });
  
  return uniqueEmployees;
};

// ─── Filter Employees ──────────────────────────────────────
const getFilteredEmployees = () => {
  let employees = getUniqueEmployees();
  
  // Search by keyword
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase();
    employees = employees.filter(emp =>
      emp.name.toLowerCase().includes(search) ||
      emp.department?.toLowerCase().includes(search) ||
      emp.branch?.toLowerCase().includes(search) ||
      emp.designation?.toLowerCase().includes(search)
    );
  }
  
  // Filter by department
  if (selectedDepartment !== 'all') {
    employees = employees.filter(emp => emp.department === selectedDepartment);
  }
  
  // Filter by branch
  if (selectedBranch !== 'all') {
    employees = employees.filter(emp => emp.branch === selectedBranch);
  }
  
  // Filter by designation
  if (selectedDesignation !== 'all') {
    employees = employees.filter(emp => emp.designation === selectedDesignation);
  }
  
  return employees;
};

// ─── PAGINATION CALCULATIONS ──────────────────────────
const startIndex = page * rowsPerPage;
const currentDocuments = documents && Array.isArray(documents) 
  ? documents.slice(startIndex, startIndex + rowsPerPage) 
  : [];
const docTotal = documents?.length || 0;
const docPages = Math.ceil(docTotal / rowsPerPage) || 1;

// ─── PAGINATION RANGE ──────────────────────────────────
const getPaginationRange = () => {
  const delta = 2;
  const range = [];
  const total = docPages || 1;
  const left = Math.max(0, page - delta);
  const right = Math.min(total - 1, page + delta);
  if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) { if (right < total - 2) range.push('...'); range.push(total - 1); }
  return range;
};

const handleEmployeeSelect = (employee) => {
  setSelectedEmployee(employee);
  setEmployeeSearchTerm(employee.name);
  setShowEmployeeDropdown(false);

  if (employee?.id) {
    const empId = Number(employee.id);
    console.log("🔄 Sending Employee ID:", empId);
    
    if (empId > 0) {
      fetchDocuments(empId);
    } else {
      toast.error("Error", "Invalid Employee ID");
    }
  } else {
    toast.error("Error", "Employee ID not found");
  }
};

  const handleEmployeeNameSelect = (name) => {
    setEmployeeNameSearch(name);
    setPage(0);
    setHasSearched(true);
    toast.success('Employee Selected', `Showing documents for ${name}`);
  };

  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
    setEmployeeNameSearch('');
    setPage(0);
  };

  const handleSearch = () => {
  setHasSearched(true);
  setPage(0);
  
  if (selectedEmployee?.id) {
    fetchDocuments(selectedEmployee.id);
  } else {
    fetchDocuments(0);
  }
};

  const handleReset = () => {
  setSearchTerm('');
  setSelectedEmployee(null);
  setEmployeeSearchTerm('');
  setEmployeeNameSearch('');
  setActiveCategory('all');
  setSelectedDepartment('all');
  setSelectedBranch('all');
  setSelectedDesignation('all');
  setFromDate('');
  setToDate('');
  setHasSearched(false);
  setPage(0);
  
  setRealDocuments([]);
  setDocuments([]);
  
  toast.info('Reset', 'Search filters cleared');
};

 const handleDownload = (doc) => {
  // Simulate download
  toast.success('Download Started', `Downloading ${doc.fileName}`);
 };

  // ─── View Employee Documents ─────────────────────────────
const handleViewEmployee = (employeeName) => {
  const employee = realEmployees.find(emp => emp.name === employeeName);
  if (employee) {
    const docs = documents.filter(doc => doc.employeeName === employeeName);
    setViewingEmployee(employee);
    setViewingEmployeeDocs(docs);
    if (docs.length > 0) {
      setSelectedDocForPreview(docs[0]);
    }
    setShowViewPage(true);
  } else {
    toast.warning('Not Found', 'Employee details not found');
  }
};

const handleViewDocument = (doc) => {
  // Employee details fetch karo
  const employee = realEmployees.find(emp => emp.id === doc.employeeId);
  if (employee) {
    const docs = documents.filter(d => d.employeeId === doc.employeeId);
    setViewingEmployee(employee);
    setViewingEmployeeDocs(docs);
    setSelectedDocForPreview(doc);
    setShowViewPage(true);
  } else {
    toast.warning('Not Found', 'Employee details not found');
  }
};
  const handleBackToList = () => {
    setShowViewPage(false);
    setViewingEmployee(null);
    setViewingEmployeeDocs([]);
    setSelectedDocForPreview(null);
  };

  const handleSelectDocumentForPreview = (doc) => {
  setSelectedDocForPreview(doc);
  toast.info('Document Selected', `Viewing ${doc.title}`);
};

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getCategoryInfo = (categoryId) => {
    return documentCategories.find(cat => cat.id === categoryId) || documentCategories[0];
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') return <FaFilePdf style={{ color: '#dc2626' }} size={20} />;
    if (fileType === 'docx' || fileType === 'doc') return <FaFileWord style={{ color: '#2563eb' }} size={20} />;
    if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') return <FaFileImage style={{ color: '#10b981' }} size={20} />;
    return <FaFileAlt style={{ color: '#6b7280' }} size={20} />;
  };

  // Check if any filter is active
  const hasActiveFilters = searchTerm || employeeNameSearch || selectedEmployee || activeCategory !== 'all' || 
                           selectedDepartment !== 'all' || selectedBranch !== 'all' || 
                           selectedDesignation !== 'all' || fromDate || toDate;

  // Filter employee names based on search
  const filteredEmployeeNames = uniqueEmployeeNames.filter(name =>
    name.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  // ─── View Page Styles ────────────────────────────────────
  const viewPageStyles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    header: { padding: '20px 24px', background: 'linear-gradient(135deg, #9d174d, #7a0e3a)', color: 'white' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '10px 16px', borderBottom: '1px solid #f1f5f9' },
    badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    btnPrimary: { padding: '8px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnSecondary: { padding: '8px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnInfo: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' },
    btnSuccess: { padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8' },
    previewBox: { textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  };

  // ─── RENDER VIEW PAGE ────────────────────────────────────
  if (showViewPage && viewingEmployee) {
    const category = selectedDocForPreview ? getCategoryInfo(selectedDocForPreview.category) : null;
    
    return (
      <div style={viewPageStyles.container}>
        {/* Back Button */}
       <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
  <button style={viewPageStyles.btnSecondary} onClick={handleBackToList}>
    <FaArrowLeft size={13} /> Back to List
  </button>
</div>
        {/* Employee Details Card */}
        <div style={viewPageStyles.card}>
          <div style={viewPageStyles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700' }}>
                {viewingEmployee.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>{viewingEmployee.name}</h2>
                <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
                  {viewingEmployee.code} • {viewingEmployee.department} • {viewingEmployee.designation}
                </p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px' }}>
                <FaFileAlt style={{ marginRight: '6px' }} />
                Total Documents: {viewingEmployeeDocs.length}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Document Preview Section ────────────────────── */}
{selectedDocForPreview && (
  <div style={{ ...viewPageStyles.card, marginTop: '20px' }}>
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Document Preview</h3>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Preview</span>
    </div>
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Employee</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.employeeName}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Department</span>
          <div style={{ fontWeight: '500',fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.department || '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Branch</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.branch || '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Designation</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.designation || '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Date</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{formatDate(selectedDocForPreview.date)}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Uploaded By</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.uploadedBy}</div>
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0 16px' }} />
      {/* ─── All Documents Table ──────────────────────────── */}
      <div style={{ ...viewPageStyles.card, marginTop: '20px' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>All Documents</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={viewPageStyles.table}>
            <thead>
              <tr>
                <th style={viewPageStyles.th}>#</th>
                <th style={viewPageStyles.th}>Document Type</th>
                <th style={viewPageStyles.th}>Title</th>
                <th style={viewPageStyles.th}>Date</th>
                <th style={{ ...viewPageStyles.th, textAlign: 'center', width: '160px' }}>Actions</th>
              </tr>
            </thead>
<tbody>
  {viewingEmployeeDocs && viewingEmployeeDocs.length > 0 ? (
    viewingEmployeeDocs.map((doc, idx) => {
      const cat = getCategoryInfo(doc.category);
      return (
        <tr key={doc.id || idx}>
          <td style={{ ...viewPageStyles.td, color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
            {idx + 1}
          </td>
          <td style={viewPageStyles.td}>
            <span style={{ ...viewPageStyles.badge, backgroundColor: cat.bg, color: cat.color }}>
              {cat.icon} {cat.label}
            </span>
          </td>
          <td style={{ ...viewPageStyles.td, fontWeight: '500', color: '#0f172a' }}>
            {doc.title || doc.fileName}
          </td>
          <td style={viewPageStyles.td}>
            {formatDate(doc.date || doc.uploadedAt)}
          </td>
          <td style={{ ...viewPageStyles.td, textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                style={viewPageStyles.btnInfo}
                onClick={() => handleSelectDocumentForPreview(doc)}
              >
                <FaEye size={12} /> View
              </button>
              <button
                style={viewPageStyles.btnSuccess}
                onClick={() => handleDownload(doc)}
              >
                <FaDownload size={12} /> Download
              </button>
            </div>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="5">
        <div style={viewPageStyles.emptyState}>
          <FaFileAlt size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#475569' }}>
            No documents found for this employee
          </div>
        </div>
      </td>
    </tr>
  )}
</tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
        <button style={viewPageStyles.btnSecondary} onClick={handleBackToList}>Close</button>
      </div>
    </div>
  </div>
)}

       
      </div>
    );
  }

  // ─── MAIN LIST PAGE ──────────────────────────────────────
  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        .service-doc-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .service-doc-btn-primary {
          background: #9d174d;
          color: white;
          box-shadow: 0 4px 12px rgba(157, 23, 77, 0.3);
        }
        .service-doc-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(157, 23, 77, 0.4);
        }
        .service-doc-btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        .service-doc-btn-secondary:hover {
          background: #e2e8f0;
        }
        .service-doc-btn-danger {
          background: #fee2e2;
          color: #ef4444;
        }
        .service-doc-btn-danger:hover {
          background: #fecaca;
        }
        .service-doc-btn-success {
          background: #10b981;
          color: white;
        }
        .service-doc-btn-success:hover {
          background: #059669;
        }
        .service-doc-input {
          padding: 8px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
          width: 100%;
          box-sizing: border-box;
          background: white;
        }
        .service-doc-input:focus {
          border-color: #9d174d;
          box-shadow: 0 0 0 3px rgba(157, 23, 77, 0.1);
        }
        .service-doc-input[type="date"] {
          min-height: 38px;
        }
        .service-doc-select {
          padding: 8px 32px 8px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background: white;
          cursor: pointer;
          box-sizing: border-box;
          min-height: 38px;
        }
        .service-doc-select:focus {
          border-color: #9d174d;
          box-shadow: 0 0 0 3px rgba(157, 23, 77, 0.1);
        }
        .service-doc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .service-doc-table th {
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
        .service-doc-table td {
          padding: 10px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .service-doc-table tr:hover td {
          background: #f8fafc;
        }
        .service-doc-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .service-doc-dropdown {
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
          margin-top: 0;
        }
        .service-doc-dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .service-doc-dropdown-item:last-child {
          border-bottom: none;
        }
        .service-doc-dropdown-item:hover {
          background: #f8f0f3;
        }
        .service-doc-dropdown-item .emp-name {
          font-weight: 600;
          color: #0f172a;
        }
        .service-doc-dropdown-item .emp-details {
          font-size: 12px;
          color: #94a3b8;
        }
        .service-doc-dropdown-item .emp-branch {
          padding: 2px 10px;
          background: #f1f5f9;
          border-radius: 12px;
          font-size: 11px;
          color: #64748b;
        }
        .service-doc-pagination {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .service-doc-page-btn {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .service-doc-page-btn:hover:not(:disabled) {
          background: #f1f5f9;
        }
        .service-doc-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .service-doc-page-btn.active {
          background: #9d174d;
          color: white;
          border-color: #9d174d;
        }
        .search-container {
          display: grid;
          grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          align-items: end;
        }
        @media (max-width: 1200px) {
          .search-container {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        @media (max-width: 768px) {
          .search-container {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .search-container {
            grid-template-columns: 1fr;
          }
        }
        .search-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          display: block;
          margin-bottom: 4px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }
        .empty-state svg {
          color: #cbd5e1;
          margin-bottom: 16px;
        }
        .filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          margin-left: 6px;
        }
        .employee-input-wrapper {
          position: relative;
          width: 100%;
        }
        .employee-input-wrapper .service-doc-input {
          padding-right: 30px;
        }
        .employee-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .employee-clear-btn:hover {
          color: #ef4444;
        }
        .selected-employee-info {
          font-size: 11px;
          color: #10b981;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .employee-name-dropdown {
          position: absolute;
          top: calc(100% + 2px);
          left: 0;
          right: 0;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          margin-top: 0;
        }
        .employee-name-item {
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .employee-name-item:last-child {
          border-bottom: none;
        }
        .employee-name-item:hover {
          background: #f8f0f3;
        }
        .employee-name-item .name-text {
          font-weight: 500;
          color: #0f172a;
        }
        .employee-name-item .count-badge {
          margin-left: auto;
          padding: 2px 10px;
          background: #f1f5f9;
          border-radius: 12px;
          font-size: 11px;
          color: #64748b;
        }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Service Book Document Repository</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Centralized employee document storage</p>
        </div>
        {onCancel && (
          <button className="service-doc-btn service-doc-btn-secondary" onClick={onCancel}>
            <FaTimes size={13} /> Cancel
          </button>
        )}
      </div>

      <div className="search-container">
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>
            <FaFilter style={{ marginRight: '8px' }} /> Filters
          </div>
          <label className="search-label">
             Branch
          </label>
          <div style={{ position: 'relative' }}>
            <select
              className="service-doc-select"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPage(0);
                if (e.target.value !== 'all') {
                  setHasSearched(true);
                }
              }}
            >
    <option value="">All Branches</option>
    {branchList.map(branch => (
      <option key={branch.id} value={branch.name}>{branch.name}</option>
   
              ))}
            </select>
            <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        <div>
          <label className="search-label">
             Department
          </label>
          <div style={{ position: 'relative' }}>
            <select
              className="service-doc-select"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(0);
                if (e.target.value !== 'all') {
                  setHasSearched(true);
                }
              }}
            >
              <option value="">All Departments</option>
    {departmentList.map(dept => (
      <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
            <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        <div>
          <label className="search-label">
          Designation
          </label>
          <div style={{ position: 'relative' }}>
            <select
              className="service-doc-select"
              value={selectedDesignation}
              onChange={(e) => {
                setSelectedDesignation(e.target.value);
                setPage(0);
                if (e.target.value !== 'all') {
                  setHasSearched(true);
                }
              }}
            >
              <option value="">All Designations</option>
    {designationList.map(desg => (
      <option key={desg.id} value={desg.name}>{desg.name}</option>
              ))}
            </select>
            <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

       <div>
  <label className="search-label">
  Employee Name
  </label>
  <div style={{ position: 'relative' }}>
    <input
      className="service-doc-input"
      type="text"
      placeholder="Search by name..."
      value={employeeSearchTerm}
      onChange={(e) => {
        setEmployeeSearchTerm(e.target.value);
        setShowEmployeeDropdown(true);
        setPage(0);
        if (e.target.value === '') {
          setSelectedEmployee(null);
          setRealDocuments([]);
          setDocuments([]);
          setHasSearched(false);
        } else {
          setHasSearched(true);
        }
      }}
      onFocus={() => {
        if (employeeSearchTerm.length > 0) {
          setShowEmployeeDropdown(true);
        }
      }}
    />
    
{/* Employee Dropdown */}
{showEmployeeDropdown && employeeSearchTerm.length > 0 && (
  <div className="service-doc-dropdown" ref={dropdownRef}>
    {realEmployees
      .filter(emp => 
        emp.name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.code?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
      )
      .map(emp => (
        <div 
          key={emp.id} 
          className="service-doc-dropdown-item"
          onClick={() => handleEmployeeSelect(emp)}  
        >
          <div>
            <div className="emp-name">{emp.name}</div>
            <div className="emp-details">
              Code: {emp.code} | Dept: {emp.department || '—'}
            </div>
          </div>
          <span className="emp-branch">{emp.designation || '—'}</span>
        </div>
      ))}
    {realEmployees.filter(emp => 
      emp.name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      emp.code?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    ).length === 0 && (
      <div className="service-doc-dropdown-item">
        <span style={{ color: '#94a3b8' }}>No employees found</span>
      </div>
    )}
  </div>
)}
  </div>
</div>

        <div>
          <label className="search-label">
          From Date
          </label>
          <input
            type="date"
            className="service-doc-input"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
              if (e.target.value) {
                setHasSearched(true);
              }
            }}
          />
        </div>

        <div>
          <label className="search-label">
         To Date
          </label>
          <input
            type="date"
            className="service-doc-input"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
              if (e.target.value) {
                setHasSearched(true);
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="service-doc-btn service-doc-btn-primary" onClick={handleSearch}>
            <FaSearch size={14} /> Search
          </button>
        </div>
      </div>

      {/* DOCUMENTS TABLE */}
      {(hasSearched || hasActiveFilters) ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Results Summary */}
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{docTotal}</span>
              <span style={{ color: '#64748b' }}> document(s) found</span>
              {employeeNameSearch && (
                <span className="filter-tag" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <FaUser size={10} /> {employeeNameSearch}
                </span>
              )}
              {selectedEmployee && (
                <span className="filter-tag" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <FaUserTie size={10} /> {selectedEmployee.name}
                </span>
              )}
              {activeCategory !== 'all' && (
                <span className="filter-tag" style={{ background: '#fce7f3', color: '#ec489a' }}>
                  {documentCategories.find(c => c.id === activeCategory)?.label}
                </span>
              )}
              {selectedDepartment !== 'all' && (
                <span className="filter-tag" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <FaBuilding size={10} /> {selectedDepartment}
                </span>
              )}
              {selectedBranch !== 'all' && (
                <span className="filter-tag" style={{ background: '#d1fae5', color: '#059669' }}>
                  <FaBriefcase size={10} /> {selectedBranch}
                </span>
              )}
              {selectedDesignation !== 'all' && (
                <span className="filter-tag" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <FaUserTie size={10} /> {selectedDesignation}
                </span>
              )}
              {fromDate && (
                <span className="filter-tag" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <FaCalendarAlt size={10} /> From: {formatDate(fromDate)}
                </span>
              )}
              {toDate && (
                <span className="filter-tag" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <FaCalendarAlt size={10} /> To: {formatDate(toDate)}
                </span>
              )}
              {searchTerm && (
                <span className="filter-tag" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <FaSearch size={10} /> {searchTerm}
                </span>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="service-doc-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Branch</th>
                  <th>Designation</th>
                 <th>Documents</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
           <tbody>
  {currentDocuments && currentDocuments.length > 0 ? (  
    currentDocuments.map((doc, idx) => (
      <tr key={doc.id || idx}>
        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          {startIndex + idx + 1}
        </td>
        <td style={{ fontWeight: '600', color: '#0f172a' }}>
          {doc.employeeName || selectedEmployee?.name || 'Unknown'}
        </td>
        <td>
          <span style={{ padding: '2px 10px', background: '#dbeafe', borderRadius: '12px', fontSize: '11px', color: '#2563eb' }}>
            {doc.department || selectedEmployee?.department || '—'}
          </span>
        </td>
        <td>
          <span style={{ padding: '2px 10px', background: '#d1fae5', borderRadius: '12px', fontSize: '11px', color: '#059669' }}>
            {doc.branch || selectedEmployee?.branch || '—'}
          </span>
        </td>
        <td style={{ color: '#334155' }}>
          {doc.designation || selectedEmployee?.designation || '—'}
        </td>
        <td>
          <span style={{ padding: '2px 10px', background: '#fce7f3', borderRadius: '12px', fontSize: '11px', color: '#9d174d' }}>
            {doc.id === 0 ? '📄 No Documents' : doc.category || '—'}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <button
              style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              onClick={() => handleViewDocument(doc)}
            >
              <FaEye size={12} /> View
            </button>
            
            {doc.id !== 0 && (
              <button
                style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                onClick={() => handleDownload(doc)}
              >
                <FaDownload size={12} /> Download
              </button>
            )}
          </div>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="7">
        <div className="empty-state">
          <FaFileAlt size={48} />
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#475569' }}>
            {loading ? 'Loading...' : 'No documents found'}
          </div>
          <div style={{ fontSize: '13px', marginTop: '4px', color: '#94a3b8' }}>
            {loading ? 'Please wait...' : 'Try adjusting your search or filter criteria'}
          </div>
        </div>
      </td>
    </tr>
  )}
</tbody>
            </table>
          </div>

          
        {/* PAGINATION */}
{docTotal > 0 && (
  <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
    <span style={{ fontSize: '13px', color: '#64748b' }}>
      Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, docTotal)} of {docTotal}
    </span>
    <div className="service-doc-pagination">
      <button 
        className="service-doc-page-btn" 
        disabled={page === 0} 
        onClick={() => setPage(p => p - 1)}
      >
        ← Prev
      </button>
      
      {getPaginationRange().map((pg, idx) => {
        if (pg === '...') {
          return <span key={`ellipsis-${idx}`} style={{ padding: '6px 8px', color: '#94a3b8' }}>…</span>;
        }
        return (
          <button 
            key={pg} 
            className={`service-doc-page-btn ${pg === page ? 'active' : ''}`} 
            onClick={() => setPage(pg)}
          >
            {pg + 1}
          </button>
        );
      })}
      
      <button 
        className="service-doc-page-btn" 
        disabled={page + 1 >= docPages} 
        onClick={() => setPage(p => p + 1)}
      >
        Next →
      </button>
    </div>
  </div>
)}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default ServiceBookDocumentRepository;