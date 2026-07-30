
import React, { useState, useEffect,useCallback} from 'react';
import { 
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaBuilding,FaCheckCircle,
  FaBriefcase, FaUpload, FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, 
  FaSearch, FaArrowLeft, FaArrowRight, FaEye, FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';
import axios from "axios";
import { BASE_URL, STORAGE_KEYS } from "../config/api.config";

const AppointmentDetails = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [appointments, setAppointments] = useState(initialData?.appointments || [
    { id: 1, employeeId:1, appointmentOrderNo: 'APP/2024/001', appointmentDate: '2024-01-15', appointmentAuthority: 'Managing Director', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Software Engineer', initialDepartment: 'IT', initialBranch: 'Mumbai', joiningDate: '2024-01-15', probationPeriod: '6', confirmationDueDate: '2024-07-15', createdAt: '2024-01-15T10:30:00Z', appointmentOrderFileName: 'appointment_letter.pdf', appointmentOrderFileData: null },
    { id: 2, employeeId:2, appointmentOrderNo: 'APP/2024/002', appointmentDate: '2024-02-20', appointmentAuthority: 'CEO', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'HR Manager', initialDepartment: 'HR', initialBranch: 'Delhi', joiningDate: '2024-02-20', probationPeriod: '6', confirmationDueDate: '2024-08-20', createdAt: '2024-02-20T11:45:00Z', appointmentOrderFileName: 'offer_letter.pdf', appointmentOrderFileData: null },
    { id: 3, employeeId:3, appointmentOrderNo: 'APP/2024/003', appointmentDate: '2024-03-10', appointmentAuthority: 'HR Director', appointmentType: 'Contract', employmentType: 'Contractual', initialDesignation: 'Senior Developer', initialDepartment: 'IT', initialBranch: 'Bangalore', joiningDate: '2024-03-10', probationPeriod: '3', confirmationDueDate: '2024-06-10', createdAt: '2024-03-10T09:15:00Z' },
    { id: 4, employeeId:4, appointmentOrderNo: 'APP/2024/004', appointmentDate: '2024-04-05', appointmentAuthority: 'Managing Director', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Tech Lead', initialDepartment: 'IT', initialBranch: 'Mumbai', joiningDate: '2024-04-05', probationPeriod: '6', confirmationDueDate: '2024-10-05', createdAt: '2024-04-05T14:20:00Z' },
    { id: 5, employeeId:5, appointmentOrderNo: 'APP/2024/005', appointmentDate: '2024-05-12', appointmentAuthority: 'HR Director', appointmentType: 'Temporary', employmentType: 'Part-Time', initialDesignation: 'HR Executive', initialDepartment: 'HR', initialBranch: 'Delhi', joiningDate: '2024-05-12', probationPeriod: '3', confirmationDueDate: '2024-08-12', createdAt: '2024-05-12T10:00:00Z' },
    { id: 6, employeeId:6, appointmentOrderNo: 'APP/2024/006', appointmentDate: '2024-06-01', appointmentAuthority: 'CEO', appointmentType: 'Permanent', employmentType: 'Full-Time', initialDesignation: 'Sales Manager', initialDepartment: 'Sales', initialBranch: 'Bangalore', joiningDate: '2024-06-01', probationPeriod: '6', confirmationDueDate: '2024-12-01', createdAt: '2024-06-01T09:30:00Z' }
  ]);
  
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);

  // ✅ formData now carries both <field>Id AND <field>Name for every dropdown-backed field
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeCode: '',
    appointmentOrderNo: '',
    appointmentDate: '',
    appointmentAuthorityId: '',
    appointmentAuthorityName: '',
    appointmentTypeId: '',
    appointmentTypeName: '',
    employmentTypeId: '',
    employmentTypeName: '',
    initialDesignationId: '',
    initialDesignationName: '',
    initialDepartmentId: '',
    initialDepartmentName: '',
    initialBranchId: '',
    initialBranchName: '',
    joiningDate: '',
    probationPeriod: '6',
    confirmationDueDate: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingOrderNos, setExistingOrderNos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
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
  const [loading, setLoading] = useState(false);
const [apiError, setApiError] = useState(null);
const [docLoading, setDocLoading] = useState(false);
const [submitting, setSubmitting] = useState(false);  

  // ============================================
// ✅ DROPDOWN STATES
// ============================================
const [departmentsList, setDepartmentsList] = useState([]);
const [loadingDepartments, setLoadingDepartments] = useState(false);
const [designationsList, setDesignationsList] = useState([]);
const [loadingDesignations, setLoadingDesignations] = useState(false);
const [branchesList, setBranchesList] = useState([]);
const [loadingBranches, setLoadingBranches] = useState(false);
const [appointmentAuthoritiesList, setAppointmentAuthoritiesList] = useState([]);
const [loadingAuthorities, setLoadingAuthorities] = useState(false);
const [employmentTypesList, setEmploymentTypesList] = useState([]);
const [loadingEmploymentTypes, setLoadingEmploymentTypes] = useState(false);
const [appointmentTypesList, setAppointmentTypesList] = useState([]);
const [loadingAppointmentTypes, setLoadingAppointmentTypes] = useState(false);
const [employees, setEmployees] = useState([]);
const [loadingEmployees, setLoadingEmployees] = useState(false);

  // ============================================
// ✅ AUTH FUNCTIONS
// ============================================
const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

const getAxiosConfig = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
    "Content-Type": "application/json",
  },
});

const ensureToken = () => {
  const token = getAuthToken();
  if (!token) {
    toast.error("Authentication Required", "Please login to continue");
    return false;
  }
  return true;
};

// ============================================
// ✅ REVERSE-LOOKUP HELPERS (name -> id), normalized match
// ============================================
const norm = (s) => (s || '').trim().toLowerCase();
const getDeptIdByName = (name) => departmentsList.find(d => norm(d.name) === norm(name))?.id || '';
const getDesigIdByName = (name) => designationsList.find(d => norm(d.name) === norm(name))?.id || '';
const getBranchIdByName = (name) => branchesList.find(b => norm(b.name) === norm(name))?.id || '';
const getAuthorityIdByName = (name) => appointmentAuthoritiesList.find(a => norm(a.name) === norm(name))?.id || '';
const getAptTypeIdByName = (name) => appointmentTypesList.find(t => norm(t.name) === norm(name))?.id || '';
const getEmpTypeIdByName = (name) => employmentTypesList.find(t => norm(t.name) === norm(name))?.id || '';

// ============================================
// ✅ FETCH APPOINTMENTS - GET API
// ============================================
const fetchAppointments = useCallback(async () => {
  if (!ensureToken()) return;
  setLoading(true);
  setApiError(null);
  try {
    const res = await axios.get(
      `${BASE_URL}/api/appointments`,
      getAxiosConfig()
    );
    
    console.log("📥 Response:", res.data);
    
    // ✅ Parse response
    let data = [];
    if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      data = res.data.response.content;
    } else if (res.data?.response && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    // ✅ Map backend fields to frontend fields
    const mapped = data.map((item) => ({
      id: item.id,
      employeeId: item.employeeId,
      employeeName: item.employee || 'Unknown',
      employeeCode: item.employeeCode || '',
      appointmentOrderNo: item.appointmentOrderNumber || '',
      appointmentDate: item.appointmentDate || '',
      appointmentAuthority: item.appointmentAuthority || '',
      appointmentAuthorityDesignation: item.appointmentAuthorityDesignation || '',
      appointmentType: item.appointmentType || '',
      employmentType: item.employmentType || '',
      initialDesignation: item.designation || '',
      initialDepartment: item.department || '',
      initialBranch: item.branch || '',
      joiningDate: item.joiningDate || '',
      probationPeriod: item.probationPeriodMonths || 0,
      confirmationDueDate: item.confirmationDueDate || '',
      status: item.isActive ? "Active" : "Inactive",
      isActive: item.isActive,
      documentPath: item.documentPath || '',
      documentName: item.documentName || '',
      remarks: item.remarks || '',
      processedBy: item.processedBy || '',
      createdAt: item.createdAt || '',
      appointmentOrderFileName: item.documentName || '',
      appointmentOrderFileData: item.documentData || null,
    }));
    
    console.log("✅ Mapped Appointments:", mapped);
    setAppointments(mapped);
    
  } catch (err) {
    console.error("❌ Fetch error:", err);
    setApiError(err.response?.data?.message || "Failed to fetch appointments");
    toast.error("Error", "Failed to load appointments");
    setAppointments([]);
  } finally {
    setLoading(false);
  }
}, []);

// ✅ Fetch Employees from API
const fetchEmployees = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingEmployees(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/api/employees?page=0&size=100`,
      getAxiosConfig()
    );
    
    let data = [];
    if (res.data?.status === 200 && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      data = res.data.response.content;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map((item) => ({
      id: item.id,
      name: item.name || item.fullName || 'Unknown',
      code: item.code || item.employeeCode || '',
      email: item.email || '',
      department: item.department || item.departmentName || '',
      designation: item.designation || item.designationName || '',
    }));
    
    setEmployees(mapped);
  } catch (err) {
    console.error('Fetch employees error:', err);
    setEmployees([]);
  } finally {
    setLoadingEmployees(false);
  }
}, []);

// ============================================
// ✅ HELPER FUNCTIONS - COPY PASTE ALL
// ============================================
const getAppointmentTypeLabel = (type) => {
  if (!type) return '—';
  return type;
};

const getEmploymentTypeLabel = (type) => {
  if (!type) return '—';
  return type;
};

const getAuthorityLabel = (authority) => {
  if (!authority) return '—';
  return authority;
};

const getDepartmentLabel = (dept) => {
  if (!dept) return '—';
  return dept;
};

const getBranchLabel = (branch) => {
  if (!branch) return '—';
  return branch;
};

const getDesignationLabel = (designation) => {
  if (!designation) return '—';
  return designation;
};

const getEmployeeName = (appointment) => {
  if (appointment.employeeName) return appointment.employeeName;
  if (appointment.employee) return appointment.employee;
  const emp = employees.find(e => e.id === appointment.employeeId);
  return emp?.name || 'Unknown';
};

const getEmployeeCode = (appointment) => {
  if (appointment.employeeCode) return appointment.employeeCode;
  const emp = employees.find(e => e.id === appointment.employeeId);
  return emp?.code || '';
};
// ============================================
// ✅ FETCH FUNCTIONS FOR DROPDOWNS
// ============================================

// 1. Fetch Departments
const fetchDepartments = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingDepartments(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/departments/list?flag=1`,
      getAxiosConfig()
    );
    
    let data = [];
    if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      data = res.data.response.content;
    } else if (res.data?.response && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map((item) => ({
      id: item.id,
      name: item.name || item.departmentName || item.department || '',
    }));
    setDepartmentsList(mapped);
  } catch (err) {
    console.error('Fetch departments error:', err);
    setDepartmentsList([]);
  } finally {
    setLoadingDepartments(false);
  }
}, []);

// 2. Fetch Designations
const fetchDesignations = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingDesignations(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/api/designations/list?flag=1`,
      getAxiosConfig()
    );
    
    let data = [];
    if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      data = res.data.response.content;
    } else if (res.data?.response && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map((item) => ({
      id: item.id,
      name: item.name || item.designationName || item.designation || '',
    }));
    setDesignationsList(mapped);
  } catch (err) {
    console.error('Fetch designations error:', err);
    setDesignationsList([]);
  } finally {
    setLoadingDesignations(false);
  }
}, []);

// 3. Fetch Branches
const fetchBranches = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingBranches(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/branches/list?flag=1`,
      getAxiosConfig()
    );
    
    let data = [];
    if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      data = res.data.response.content;
    } else if (res.data?.response && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map((item) => ({
      id: item.id,
      name: item.name || item.branchName || item.branch || '',
    }));
    setBranchesList(mapped);
  } catch (err) {
    console.error('Fetch branches error:', err);
    setBranchesList([]);
  } finally {
    setLoadingBranches(false);
  }
}, []);

// 4. Fetch Appointment Authorities
const fetchAppointmentAuthorities = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingAuthorities(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/employee-designation?flag=1`,
      getAxiosConfig()
    );
    
    let data = [];
    if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      data = res.data.response.content;
    } else if (res.data?.response && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const authorityMap = new Map();
    data.forEach((item) => {
      const authorityName = item.employeeName || item.name || item.authority || '';
      if (authorityName && !authorityMap.has(authorityName)) {
        authorityMap.set(authorityName, {
          id: item.id || authorityMap.size + 1,
          name: authorityName,
          designation: item.designationName || item.designation || '',
        });
      }
    });
    
    setAppointmentAuthoritiesList(Array.from(authorityMap.values()));
  } catch (err) {
    console.error('Fetch appointment authorities error:', err);
    setAppointmentAuthoritiesList([]);
  } finally {
    setLoadingAuthorities(false);
  }
}, []);

// 5. Fetch Employment Types
const fetchEmploymentTypes = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingEmploymentTypes(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/api/employment-types/list?flag=1`,
      getAxiosConfig()
    );
    
    let data = [];
    if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      data = res.data.response.content;
    } else if (res.data?.response && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map((item) => ({
      id: item.id,
      name: item.name || item.employmentTypeName || item.employmentType || '',
    }));
    setEmploymentTypesList(mapped);
  } catch (err) {
    console.error('Fetch employment types error:', err);
    setEmploymentTypesList([]);
  } finally {
    setLoadingEmploymentTypes(false);
  }
}, []);

// 6. Fetch Appointment Types
const fetchAppointmentTypes = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingAppointmentTypes(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/api/appointment-types/list?flag=1`,
      getAxiosConfig()
    );
    
    let data = [];
    if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      data = res.data.response.content;
    } else if (res.data?.response && Array.isArray(res.data.response)) {
      data = res.data.response;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      data = res.data.data;
    } else if (Array.isArray(res.data)) {
      data = res.data;
    }
    
    const mapped = data.map((item) => ({
      id: item.id,
      name: item.name || item.appointmentTypeName || item.appointmentType || '',
    }));
    setAppointmentTypesList(mapped);
  } catch (err) {
    console.error('Fetch appointment types error:', err);
    setAppointmentTypesList([]);
  } finally {
    setLoadingAppointmentTypes(false);
  }
}, []);

// ============================================
// ✅ LOAD DROPDOWNS ON MOUNT
// ============================================
useEffect(() => {
  const loadDropdowns = async () => {
    await Promise.all([
       fetchEmployees(),
      fetchDepartments(),
      fetchDesignations(),
      fetchBranches(),
      fetchAppointmentAuthorities(),
      fetchEmploymentTypes(),
      fetchAppointmentTypes(),
    ]);
        await fetchAppointments();

  };
  loadDropdowns();
}, []);

  const handleRowClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

 const handleViewDocument = async (e, appointment) => {
  e.stopPropagation();
  
  // ✅ Agar already document data hai toh preview dikhao
  if (appointment.documentData || appointment.appointmentOrderFileData) {
    setSelectedAppointment(appointment);
    setShowDocumentActions(true);
    setDocumentPreview({
      data: appointment.documentData || appointment.appointmentOrderFileData,
      name: appointment.documentName || appointment.appointmentOrderFileName
    });
    return;
  }
  
  // ✅ Agar document name hai toh API se fetch karo
  if (appointment.documentName) {
    setSelectedAppointment(appointment);
    setShowDocumentActions(true);
    setDocLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/appointments/${appointment.id}/document`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` }, responseType: 'blob' }
      );
      const blobUrl = URL.createObjectURL(res.data);
      setDocumentPreview({ data: blobUrl, name: appointment.documentName });
    } catch (err) {
      console.error('Document fetch error:', err);
      toast.error('Error', 'Failed to load document');
    } finally {
      setDocLoading(false);
    }
    return;
  }
  
  toast.info('No Document', 'No document has been uploaded for this appointment');
};

  const filteredAppointments = appointments.filter(apt => {
    const search = searchTerm.toLowerCase();
    return apt.appointmentOrderNo.toLowerCase().includes(search) ||
           apt.initialDesignation.toLowerCase().includes(search) ||
           apt.initialDepartment.toLowerCase().includes(search) ||
           apt.initialBranch.toLowerCase().includes(search);
  });

  const totalItems = filteredAppointments.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, startIndex + rowsPerPage);

  const filteredEmployees = employees.filter(emp => {
  const search = employeeSearchTerm.toLowerCase();
  return emp.name?.toLowerCase().includes(search) || 
         emp.code?.toLowerCase().includes(search) ||
         emp.email?.toLowerCase().includes(search);
});

 const handleEmployeeSelect = (employee) => {
  setSelectedEmployee(employee);
  setEmployeeSearchTerm(employee.name);
  setShowEmployeeDropdown(false);

  // ✅ naam se match karke ID nikaalo
  const matchedDept = departmentsList.find(d => norm(d.name) === norm(employee.department));
  const matchedDesig = designationsList.find(d => norm(d.name) === norm(employee.designation));

  setFormData(prev => ({
    ...prev,
    employeeId: employee.id,
    employeeCode: employee.code || '',
    initialDepartmentId: matchedDept?.id || '',
    initialDepartmentName: matchedDept?.name || employee.department || '',
    initialDesignationId: matchedDesig?.id || '',
    initialDesignationName: matchedDesig?.name || employee.designation || '',
  }));
};

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

  useEffect(() => {
    setExistingOrderNos(appointments.map(apt => apt.appointmentOrderNo));
  }, [appointments]);

  useEffect(() => {
    if (formData.joiningDate && formData.probationPeriod) {
      const joiningDate = new Date(formData.joiningDate);
      const probationMonths = parseInt(formData.probationPeriod);
      if (!isNaN(probationMonths) && probationMonths > 0) {
        const dueDate = new Date(joiningDate);
        dueDate.setMonth(dueDate.getMonth() + probationMonths);
        setFormData(prev => ({
          ...prev,
          confirmationDueDate: dueDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.joiningDate, formData.probationPeriod]);

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

  // ============================================
  // ✅ NAME+ID PAIR HANDLERS — every dropdown sets both Id and Name together
  // ============================================
  const handleDeptSelect = (value) => {
    const selected = departmentsList.find(d => String(d.id) === String(value));
    setFormData(prev => ({ ...prev, initialDepartmentId: value, initialDepartmentName: selected?.name || '' }));
    if (touched.initialDepartmentId) validateField('initialDepartmentId', value);
  };
  const handleDesigSelect = (value) => {
    const selected = designationsList.find(d => String(d.id) === String(value));
    setFormData(prev => ({ ...prev, initialDesignationId: value, initialDesignationName: selected?.name || '' }));
    if (touched.initialDesignationId) validateField('initialDesignationId', value);
  };
  const handleBranchSelect = (value) => {
    const selected = branchesList.find(b => String(b.id) === String(value));
    setFormData(prev => ({ ...prev, initialBranchId: value, initialBranchName: selected?.name || '' }));
    if (touched.initialBranchId) validateField('initialBranchId', value);
  };
  const handleAuthoritySelect = (value) => {
    const selected = appointmentAuthoritiesList.find(a => String(a.id) === String(value));
    setFormData(prev => ({ ...prev, appointmentAuthorityId: value, appointmentAuthorityName: selected?.name || '' }));
    if (touched.appointmentAuthorityId) validateField('appointmentAuthorityId', value);
  };
  const handleAptTypeSelect = (value) => {
    const selected = appointmentTypesList.find(t => String(t.id) === String(value));
    setFormData(prev => ({ ...prev, appointmentTypeId: value, appointmentTypeName: selected?.name || '' }));
    if (touched.appointmentTypeId) validateField('appointmentTypeId', value);
  };
  const handleEmpTypeSelect = (value) => {
    const selected = employmentTypesList.find(t => String(t.id) === String(value));
    setFormData(prev => ({ ...prev, employmentTypeId: value, employmentTypeName: selected?.name || '' }));
    if (touched.employmentTypeId) validateField('employmentTypeId', value);
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
          appointmentOrderFile: file,
          appointmentOrderFileData: reader.result,
          appointmentOrderFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'appointmentOrderNo') {
      if (!value) error = 'Appointment Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingAppointment || editingAppointment.appointmentOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    }
    else if (field === 'appointmentDate' && !value) error = 'Appointment Date is required';
    else if (field === 'appointmentAuthorityId' && !value) error = 'Appointment Authority is required';
    else if (field === 'appointmentTypeId' && !value) error = 'Appointment Type is required';
    else if (field === 'employmentTypeId' && !value) error = 'Employment Type is required';
    else if (field === 'initialDesignationId' && !value) error = 'Initial Designation is required';
    else if (field === 'initialDepartmentId' && !value) error = 'Initial Department is required';
    else if (field === 'initialBranchId' && !value) error = 'Initial Branch is required';
    else if (field === 'joiningDate') {
      if (!value) error = 'Joining Date is required';
      else {
        const joiningDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (joiningDate > today) error = 'Joining Date cannot be future date';
      }
    }
    
    if (field === 'appointmentDate' && formData.joiningDate) {
      const aptDate = new Date(field === 'appointmentDate' ? value : formData.appointmentDate);
      const joinDate = new Date(formData.joiningDate);
      if (aptDate > joinDate) {
        error = 'Appointment Date must be on or before Joining Date';
      }
    }
    if (field === 'joiningDate' && formData.appointmentDate) {
      const aptDate = new Date(formData.appointmentDate);
      const joinDate = new Date(value);
      if (aptDate > joinDate) {
        setErrors(prev => ({ ...prev, appointmentDate: 'Appointment Date must be on or before Joining Date' }));
      }
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = [
      'appointmentOrderNo', 'appointmentDate', 'appointmentAuthorityId',
      'appointmentTypeId', 'employmentTypeId', 'initialDesignationId',
      'initialDepartmentId', 'initialBranchId', 'joiningDate'
    ];
    
    const newErrors = {};
    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }
    
    if (formData.appointmentOrderNo && existingOrderNos.includes(formData.appointmentOrderNo) && 
        (!editingAppointment || editingAppointment.appointmentOrderNo !== formData.appointmentOrderNo)) {
      newErrors.appointmentOrderNo = 'Order Number already exists';
    }
    
    if (formData.joiningDate) {
      const joiningDate = new Date(formData.joiningDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (joiningDate > today) {
        newErrors.joiningDate = 'Joining Date cannot be future date';
      }
    }
    
    if (formData.appointmentDate && formData.joiningDate) {
      const aptDate = new Date(formData.appointmentDate);
      const joinDate = new Date(formData.joiningDate);
      if (aptDate > joinDate) {
        newErrors.appointmentDate = 'Appointment Date must be on or before Joining Date';
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
  if (!selectedEmployee && !formData.employeeId) {
    toast.warning('Validation Error', 'Please select an employee');
    return;
  }

  setSubmitting(true);
  try {
    let res;

    if (editingAppointment) {
      // ✅ UPDATE — sirf wahi fields jo backend accept karta hai
      // fallback: agar Id khali reh gaya ho kisi wajah se, Name se dobara lookup karo
      const updatePayload = {
        appointmentOrderNumber: formData.appointmentOrderNo,
        appointmentDate: formData.appointmentDate,
        appointmentTypeId: Number(formData.appointmentTypeId || getAptTypeIdByName(formData.appointmentTypeName)),
        employmentTypeId: Number(formData.employmentTypeId || getEmpTypeIdByName(formData.employmentTypeName)),
        joiningDate: formData.joiningDate,
        probationPeriodMonths: Number(formData.probationPeriod) || 0,
        remarks: formData.remarks || '',
      };
      console.log("📤 UPDATE payload:", updatePayload);
      res = await axios.put(
        `${BASE_URL}/api/appointments/${editingAppointment.id}/update`,
        updatePayload,
        getAxiosConfig()
      );
    } else {
      // ✅ CREATE — poora payload with IDs (with name-based fallback)
      const createPayload = {
        employeeId: selectedEmployee?.id || Number(formData.employeeId) || 0,
        appointmentOrderNumber: formData.appointmentOrderNo,
        appointmentDate: formData.appointmentDate,
        appointmentAuthorityId: Number(formData.appointmentAuthorityId || getAuthorityIdByName(formData.appointmentAuthorityName)),
        appointmentTypeId: Number(formData.appointmentTypeId || getAptTypeIdByName(formData.appointmentTypeName)),
        employmentTypeId: Number(formData.employmentTypeId || getEmpTypeIdByName(formData.employmentTypeName)),
        initialDesignationId: Number(formData.initialDesignationId || getDesigIdByName(formData.initialDesignationName)),
        initialDepartmentId: Number(formData.initialDepartmentId || getDeptIdByName(formData.initialDepartmentName)),
        initialBranchId: Number(formData.initialBranchId || getBranchIdByName(formData.initialBranchName)),
        joiningDate: formData.joiningDate,
        probationPeriodMonths: Number(formData.probationPeriod) || 0,
        remarks: formData.remarks || '',
      };
      console.log("📤 CREATE payload:", createPayload);
      res = await axios.post(
        `${BASE_URL}/api/appointments/create`,
        createPayload,
        getAxiosConfig()
      );
    }

    if (res.status === 200 || res.status === 201) {
      toast.success('Success', editingAppointment ? 'Appointment updated' : 'Appointment created');
      resetForm();
      setShowForm(false);
      await fetchAppointments();
      if (onSuccess) onSuccess();
    }
  } catch (err) {
    console.error('Submit error:', err);
    console.error('Backend message:', err.response?.data);
    toast.error('Error', err.response?.data?.message || 'Failed to save');
  } finally {
    setSubmitting(false);
  }
};

// ✅ handleEdit — sets both Name (from record, always trustworthy) and Id (looked up)
const handleEdit = (appointment) => {
  if (appointment.status === 'Inactive') return;

  const emp = employees.find(e => String(e.id) === String(appointment.employeeId));

  setSelectedEmployee(emp || null);
  setEditingAppointment(appointment);
  setFormData({
    employeeId: appointment.employeeId,
    employeeCode: emp?.code || appointment.employeeCode || '',
    appointmentOrderNo: appointment.appointmentOrderNo,
    appointmentDate: appointment.appointmentDate,

    appointmentAuthorityName: appointment.appointmentAuthority || '',
    appointmentAuthorityId: getAuthorityIdByName(appointment.appointmentAuthority),

    appointmentTypeName: appointment.appointmentType || '',
    appointmentTypeId: getAptTypeIdByName(appointment.appointmentType),

    employmentTypeName: appointment.employmentType || '',
    employmentTypeId: getEmpTypeIdByName(appointment.employmentType),

    initialDesignationName: appointment.initialDesignation || '',
    initialDesignationId: getDesigIdByName(appointment.initialDesignation),

    initialDepartmentName: appointment.initialDepartment || '',
    initialDepartmentId: getDeptIdByName(appointment.initialDepartment),

    initialBranchName: appointment.initialBranch || '',
    initialBranchId: getBranchIdByName(appointment.initialBranch),

    joiningDate: appointment.joiningDate,
    probationPeriod: appointment.probationPeriod || '6',
    confirmationDueDate: appointment.confirmationDueDate || '',
    remarks: appointment.remarks || '',
  });
  setEmployeeSearchTerm(emp?.name || appointment.employeeName || '');
  setShowForm(true);
};

 const resetForm = () => {
  setFormData({
    employeeId: '',
    employeeCode: '',
    appointmentOrderNo: '',
    appointmentDate: '',
    appointmentAuthorityId: '',
    appointmentAuthorityName: '',
    appointmentTypeId: '',
    appointmentTypeName: '',
    employmentTypeId: '',
    employmentTypeName: '',
    initialDesignationId: '',
    initialDesignationName: '',
    initialDepartmentId: '',
    initialDepartmentName: '',
    initialBranchId: '',
    initialBranchName: '',
    joiningDate: '',
    probationPeriod: '6',
    confirmationDueDate: '',
    remarks: '',
  });
  setErrors({});
  setTouched({});
  setEditingAppointment(null);
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
    setSelectedAppointment(null);
  };

  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({
      id,
      name,
      newStatus
    });
    setShowStatusModal(true);
  };

 const confirmStatusChange = async () => {
  const { id, newStatus, name } = statusAction;
  setLoading(true);
  try {
    // ✅ Status Update API
    const isActive = newStatus === 'Active';
    await axios.put(
      `${BASE_URL}/api/appointments/${id}/status?active=${isActive}`,
      null,
      getAxiosConfig()
    );
    toast.success('Status Updated', `${name} is now ${newStatus}`);
    await fetchAppointments();
  } catch (err) {
    console.error('Status change error:', err);
    toast.error('Error', err.response?.data?.message || 'Failed to change status');
  } finally {
    setLoading(false);
    setShowStatusModal(false);
    setStatusAction({ id: null, name: "", newStatus: "" });
  }
};

 const handleGenerateLetter = async (appointment) => {
  if (!ensureToken()) return;
  setLoading(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/api/appointments/${appointment.id}/document`,
      { headers: { Authorization: `Bearer ${getAuthToken()}` }, responseType: 'blob' }
    );

    // ✅ Check: agar backend error JSON blob bhej raha hai (404/500), usko pehle pakdo
    if (res.data.type && res.data.type.includes('application/json')) {
      const text = await res.data.text();
      const errJson = JSON.parse(text);
      throw new Error(errJson.message || 'Document not found on server');
    }

    const blobUrl = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = appointment.documentName || `Appointment_Letter_${appointment.appointmentOrderNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success('Success', 'Appointment letter downloaded successfully');
  } catch (err) {
    console.error('Generate letter FULL error:', err.response?.status, err.response?.data, err.message);
    toast.error('Error', err.response?.data?.message || err.message || 'Failed to generate letter');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Appointment Details</h1>
          <p className="cert-subtitle">Manage employee appointment information</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!showForm && !selectedAppointment && (
              <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                <FaPlus size={13} /> Add Appointment
              </button>
            )}
            
            {(showForm || selectedAppointment) && (
              <button 
                type="button" 
                className="cert-back-btn" 
                onClick={handleBackToList}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
              >
                <FaArrowLeft size={12} /> Back
              </button>
            )}
            
            {!showForm && !selectedAppointment && onCancel && (
              <button className="cert-cancel-btn" onClick={onCancel}>
                <FaTimes size={13} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Appointment Details</div>
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
                          if (employeeSearchTerm.length > 0) {
                            setShowEmployeeDropdown(true);
                          }
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
                                  <small className="text-muted">Code: {emp.code} | Dept: {emp.department}</small>
                                </div>
                                <div>
                                  <span className="badge bg-light text-dark">{emp.designation}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-3 text-muted">
                              <small>No employees found</small>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

               <div className="cert-field-compact">
  <label>Employee Code</label>
  <input 
    type="text" 
    className="form-control bg-light" 
    value={selectedEmployee?.code || formData.employeeCode || ''} 
    readOnly 
    placeholder="Auto-populated"
    style={{ fontSize: '14px', padding: '6px 12px' }}
  />
</div>

               <div className="cert-field-compact">
  <label>Department</label>
  <input 
    type="text" 
    className="form-control bg-light" 
    value={selectedEmployee?.department || formData.initialDepartmentName || ''} 
    readOnly 
    placeholder="Auto-populated"
    style={{ fontSize: '14px', padding: '6px 12px' }}
  />
</div>
  <div className={`cert-field-compact ${touched.initialDepartmentId && errors.initialDepartmentId ? 'has-error' : ''}`}>
  <label className="required">Initial Department</label>
 <select 
  value={formData.initialDepartmentId} 
  onChange={(e) => handleDeptSelect(e.target.value)}
  onBlur={() => handleBlur('initialDepartmentId')}
>
  <option value="">Select Department</option>
  {departmentsList.map((dept) => (
    <option key={dept.id} value={dept.id}>{dept.name}</option>
  ))}
</select>
  {loadingDepartments && <small>Loading...</small>}
  <FieldError msg={errors.initialDepartmentId} />
</div>
              <div className="cert-field-compact">
  <label>Designation</label>
  <input 
    type="text" 
    className="form-control bg-light" 
    value={selectedEmployee?.designation || formData.initialDesignationName || ''} 
    readOnly 
    placeholder="Auto-populated"
    style={{ fontSize: '14px', padding: '6px 12px' }}
  />
</div>
<div className={`cert-field-compact ${touched.initialDesignationId && errors.initialDesignationId ? 'has-error' : ''}`}>
  <label className="required">Initial Designation</label>
  <select 
    value={formData.initialDesignationId} 
    onChange={(e) => handleDesigSelect(e.target.value)}
    onBlur={() => handleBlur('initialDesignationId')}
  >
    <option value="">Select Designation</option>
    {designationsList.map((des) => (
      <option key={des.id} value={des.id}>{des.name}</option>
    ))}
  </select>
  {loadingDesignations && <small>Loading...</small>}
  <FieldError msg={errors.initialDesignationId} />
</div>
                <div className={`cert-field-compact ${touched.appointmentOrderNo && errors.appointmentOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Appointment Order Number</label>
                  <input type="text" placeholder="e.g., ARI/APP/2024/001" value={formData.appointmentOrderNo} onChange={(e) => handleChange('appointmentOrderNo', e.target.value)} onBlur={() => handleBlur('appointmentOrderNo')} />
                  <FieldError msg={errors.appointmentOrderNo} />
                </div>
                
                <div className={`cert-field-compact ${touched.appointmentDate && errors.appointmentDate ? 'has-error' : ''}`}>
                  <label className="required">Appointment Date</label>
                  <input type="date" value={formData.appointmentDate} onChange={(e) => handleChange('appointmentDate', e.target.value)} onBlur={() => handleBlur('appointmentDate')} />
                  <FieldError msg={errors.appointmentDate} />
                </div>
                
            <div className={`cert-field-compact ${touched.appointmentAuthorityId && errors.appointmentAuthorityId ? 'has-error' : ''}`}>
  <label className="required">Appointment Authority</label>
  <select 
    value={formData.appointmentAuthorityId} 
    onChange={(e) => handleAuthoritySelect(e.target.value)}
    onBlur={() => handleBlur('appointmentAuthorityId')}
  >
    <option value="">Select Authority</option>
    {appointmentAuthoritiesList.map((auth) => (
      <option key={auth.id} value={auth.id}>
        {auth.name} {auth.designation ? `(${auth.designation})` : ''}
      </option>
    ))}
  </select>
  {loadingAuthorities && <small>Loading...</small>}
  <FieldError msg={errors.appointmentAuthorityId} />
</div>
         <div className={`cert-field-compact ${touched.appointmentTypeId && errors.appointmentTypeId ? 'has-error' : ''}`}>
  <label className="required">Appointment Type</label>
  <select 
    value={formData.appointmentTypeId} 
    onChange={(e) => handleAptTypeSelect(e.target.value)}
    onBlur={() => handleBlur('appointmentTypeId')}
  >
    <option value="">Select Appointment Type</option>
    {appointmentTypesList.map((type) => (
      <option key={type.id} value={type.id}>{type.name}</option>
    ))}
  </select>
  {loadingAppointmentTypes && <small>Loading...</small>}
  <FieldError msg={errors.appointmentTypeId} />
</div>

          <div className={`cert-field-compact ${touched.employmentTypeId && errors.employmentTypeId ? 'has-error' : ''}`}>
  <label className="required">Employment Type</label>
  <select 
    value={formData.employmentTypeId} 
    onChange={(e) => handleEmpTypeSelect(e.target.value)}
    onBlur={() => handleBlur('employmentTypeId')}
  >
    <option value="">Select Employment Type</option>
    {employmentTypesList.map((type) => (
      <option key={type.id} value={type.id}>{type.name}</option>
    ))}
  </select>
  {loadingEmploymentTypes && <small>Loading...</small>}
  <FieldError msg={errors.employmentTypeId} />
</div>
                
            <div className={`cert-field-compact ${touched.initialBranchId && errors.initialBranchId ? 'has-error' : ''}`}>
  <label className="required">Initial Branch</label>
  <select 
    value={formData.initialBranchId} 
    onChange={(e) => handleBranchSelect(e.target.value)}
    onBlur={() => handleBlur('initialBranchId')}
  >
    <option value="">Select Branch</option>
    {branchesList.map((branch) => (
      <option key={branch.id} value={branch.id}>{branch.name}</option>
    ))}
  </select>
  {loadingBranches && <small>Loading...</small>}
  <FieldError msg={errors.initialBranchId} />
</div>
 <div className={`cert-field-compact ${touched.joiningDate && errors.joiningDate ? 'has-error' : ''}`}>
                  <label className="required">Joining Date</label>
                  <input type="date" value={formData.joiningDate} onChange={(e) => handleChange('joiningDate', e.target.value)} onBlur={() => handleBlur('joiningDate')} />
                  <FieldError msg={errors.joiningDate} />
                </div>
                
                <div className="cert-field-compact">
                  <label>Probation Period (months)</label>
                  <input type="number" placeholder="e.g., 6" value={formData.probationPeriod} onChange={(e) => handleChange('probationPeriod', e.target.value)} />
                  <small>Auto-calculates confirmation due date</small>
                </div>
                
                <div className="cert-field-compact">
                  <label>Confirmation Due Date</label>
                  <input type="text" className="bg-light" value={formatDate(formData.confirmationDueDate)} readOnly />
                  <small>Auto-calculated</small>
                </div>
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingAppointment ? 'Update Appointment' : 'Save Appointment'}
              </button>
            </div>
          </form>
        </div>
         ) : showDocumentActions && selectedAppointment ? (
                  <DocumentActions 
                    title="Appointment Letter"
                    documentName={selectedAppointment.appointmentOrderFileName}
                    documentData={selectedAppointment.appointmentOrderFileData}
                    onGenerate={() => handleGenerateLetter(selectedAppointment)}
                    onBack={handleBackToList}
                    generateLabel="Generate Letter"
                    themeColor="#9d174d"
                  />
      ) : selectedAppointment ? (
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {/* Top Banner */}
          <div style={{ 
            background: 'linear-gradient(135deg, #9d174d 0%, #be185d 100%)', 
            padding: '28px 32px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <FaFileAlt size={20} />
                  <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>
                    {selectedAppointment.appointmentOrderNo}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', opacity: 0.9 }}>
                  <span><FaCalendarAlt style={{ marginRight: '6px' }} />{formatDate(selectedAppointment.createdAt)}</span>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '3px 12px', 
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>
                    {selectedAppointment.appointmentType}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ padding: '32px' }}>
            {/* Employee Profile Card */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '20px 24px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9d174d, #be185d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '700'
                }}>
    {getEmployeeName(selectedAppointment).charAt(0) || '?'}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 2px 0' }}>
      {getEmployeeName(selectedAppointment)}
                  </h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
      {getEmployeeCode(selectedAppointment)} • {getDesignationLabel(selectedAppointment.initialDesignation)}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '16px',
              marginBottom: '28px'
            }}>
              <DetailCard 
                icon={<FaCalendarAlt size={16} style={{ color: '#9d174d' }} />}
                label="Appointment Date"
                value={formatDate(selectedAppointment.appointmentDate)}
                bg="#fdf2f8"
              />
              
              <DetailCard 
                icon={<FaCalendarAlt size={16} style={{ color: '#059669' }} />}
                label="Joining Date"
                value={formatDate(selectedAppointment.joiningDate)}
                bg="#ecfdf5"
              />
              
              <DetailCard 
                icon={<FaBuilding size={16} style={{ color: '#4f46e5' }} />}
                label="Appointment Authority"
                value={selectedAppointment.appointmentAuthority}
                bg="#eef2ff"
              />
              
              <DetailCard 
                icon={<FaBriefcase size={16} style={{ color: '#d97706' }} />}
                label="Appointment Type"
                value={selectedAppointment.appointmentType}
                bg="#fffbeb"
                badge
              />
              
              <DetailCard 
                icon={<FaBriefcase size={16} style={{ color: '#7c3aed' }} />}
                label="Employment Type"
                value={selectedAppointment.employmentType}
                bg="#faf5ff"
              />
              
              <DetailCard 
                icon={<FaBuilding size={16} style={{ color: '#0891b2' }} />}
                label="Department"
                value={selectedAppointment.initialDepartment}
                bg="#ecfeff"
              />
              
              <DetailCard 
                icon={<FaBuilding size={16} style={{ color: '#be123c' }} />}
                label="Branch"
                value={selectedAppointment.initialBranch}
                bg="#fff1f2"
              />
              
              <DetailCard 
                icon={<FaClock size={16} style={{ color: '#ea580c' }} />}
                label="Probation Period"
                value={`${selectedAppointment.probationPeriod} months`}
                bg="#fff7ed"
              />
              
              <DetailCard 
                icon={<FaCheckCircle size={16} style={{ color: selectedAppointment.confirmationDueDate && new Date(selectedAppointment.confirmationDueDate) > new Date() ? '#d97706' : '#059669' }} />}
                label="Confirmation Due Date"
                value={selectedAppointment.confirmationDueDate ? formatDate(selectedAppointment.confirmationDueDate) : '—'}
                bg={selectedAppointment.confirmationDueDate && new Date(selectedAppointment.confirmationDueDate) > new Date() ? '#fffbeb' : '#ecfdf5'}
                highlight
              />
            </div>

            {/* Document Section */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '20px 24px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf size={16} style={{ color: '#dc2626' }} /> Appointment Order Document
              </h4>
              {selectedAppointment.appointmentOrderFileName ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: '#fef2f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedAppointment.appointmentOrderFileName.endsWith('.pdf') ? (
                        <FaFilePdf size={20} style={{ color: '#dc2626' }} />
                      ) : (
                        <FaFileImage size={20} style={{ color: '#3b82f6' }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: '500', color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>
                        {selectedAppointment.appointmentOrderFileName}
                      </p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uploaded document</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleViewDocument(e, selectedAppointment)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '10px 20px',
                      background: '#9d174d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    <FaEye size={14} /> View Document
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <FaFileAlt size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: '500', margin: '0 0 4px 0', color: '#64748b' }}>No document uploaded</p>
                  <span style={{ fontSize: '13px' }}>No appointment order document has been uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by order number, designation, department or branch..."
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
                    <th>Employee code</th>  
                    <th>Order No.</th>
                    <th>Appointment Date</th>
                    <th>Appointment Authority</th>
                    <th>Appointment Type</th>
                    <th>Employment Type</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th>Joining Date</th>
                    <th>Probation Period</th>
                    <th>Confirmation Due Date</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAppointments.length > 0 ? (
                    currentAppointments.map((apt,idx) => (
                      <tr 
                        key={apt.id} 
                        onClick={() => handleRowClick(apt)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>{getEmployeeName(apt)}</td>
                        <td>{getEmployeeCode(apt)}</td>

                        <td><strong>{apt.appointmentOrderNo}</strong></td>
                        <td>{formatDate(apt.appointmentDate)}</td>
                        <td>{apt.appointmentAuthority}</td>
                        <td>
                          <span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                            {apt.appointmentType}
                          </span>
                        </td>
                        <td>{apt.employmentType}</td>
                        <td>{apt.initialDesignation}</td>
                        <td>{apt.initialDepartment}</td>
                        <td>{apt.initialBranch}</td>
                        <td>{formatDate(apt.joiningDate)}</td>
                        <td>{apt.probationPeriod} months</td>
                        <td>
                          {apt.confirmationDueDate && new Date(apt.confirmationDueDate) > new Date() ? (
                            <span className="cert-status-badge" style={{ background: '#fed7aa', color: '#9a3412' }}>
                              Due: {formatDate(apt.confirmationDueDate)}
                            </span>
                          ) : apt.confirmationDueDate ? (
                            <span className="cert-status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                              Confirmed: {formatDate(apt.confirmationDueDate)}
                            </span>
                          ) : (
                            <span className="cert-status-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>Pending</span>
                          )}
                        </td>
                        <td>
                          <div
                            className="d-flex align-items-center gap-1"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                             handleStatusToggle(
  apt.id,
  getEmployeeName(apt),
  apt.status || "Active"
)
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "16px",
                                borderRadius: "50px",
                                backgroundColor:
                                  (apt.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#d1d5db",
                                position: "relative",
                                transition: ".2s"
                              }}
                            >
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "50%",
                                  background: "#fff",
                                  position: "absolute",
                                  top: "2px",
                                  left:
                                    (apt.status || "Active") === "Active"
                                      ? "14px"
                                      : "2px",
                                  transition: ".2s"
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                color:
                                  (apt.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#94a3b8"
                              }}
                            >
                              {apt.status || "Active"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(apt)} 
                              title={apt.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={apt.status === 'Inactive'}
                              style={{ 
                                opacity: apt.status === 'Inactive' ? 0.5 : 1,
                                cursor: apt.status === 'Inactive' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="15" className="text-center py-5">No appointments found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cert-table-footer">
              <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} employees
              </div>
              
              {totalPages > 0 && (
                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    className="cert-page-btn" 
                    disabled={page === 0} 
                    onClick={() => setPage(page - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots" style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button 
                        key={pg} 
                        className={`cert-page-num ${pg === page ? 'active' : ''}`} 
                        onClick={() => setPage(pg)}
                        style={{ 
                          padding: '6px 10px', 
                          border: '1px solid #e5e7eb', 
                          background: pg === page ? '#9d174d' : 'white', 
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontSize: '12px',
                          minWidth: '34px'
                        }}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button 
                    className="cert-page-btn" 
                    disabled={page + 1 >= totalPages} 
                    onClick={() => setPage(page + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {showStatusModal && (
        <div
          className="emp-modal-overlay"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="emp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="emp-modal-icon">
              {statusAction.newStatus === "Active" ? "✅" : "⛔"}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{" "}
              <strong>
                {statusAction.newStatus === "Active" ? "activate" : "deactivate"}
              </strong>{" "}
              <strong>{statusAction.name}</strong>?
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

      {documentPreview && (
        <div
          className="emp-modal-overlay"
          onClick={() => setDocumentPreview(null)}
          style={{ zIndex: 1050 }}
        >
          <div
            className="emp-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '900px', 
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                <FaFileAlt style={{ marginRight: '8px' }} />
                Document Preview
              </h3>
              <button 
                onClick={() => setDocumentPreview(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {documentPreview.data && documentPreview.name && documentPreview.name.endsWith('.pdf') ? (
                <div style={{ 
                  width: '100%', 
                  height: '70vh',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <iframe
                    src={documentPreview.data}
                    width="100%"
                    height="100%"
                    title="PDF Preview"
                    style={{ border: 'none' }}
                  />
                </div>
              ) : documentPreview.data ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={documentPreview.data} 
                    alt="Document Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '70vh',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} 
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p>No preview available</p>
                </div>
              )}
              
              <div style={{ 
                marginTop: '20px', 
                padding: '12px 16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: '#111827' }}>{documentPreview.name}</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
                    Uploaded document
                  </p>
                </div>
                <a 
                  href={documentPreview.data} 
                  download={documentPreview.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#9d174d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  <FaFileAlt /> Download
                </a>
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
      `}</style>
    </div>
  );
};

// Detail Card Component
const DetailCard = ({ icon, label, value, bg, badge, highlight }) => (
  <div style={{ 
    background: bg || '#f8fafc', 
    borderRadius: '10px', 
    padding: '16px 18px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      {icon}
      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
    {badge ? (
      <span style={{
        display: 'inline-block',
        background: highlight ? '#fef3c7' : '#e0e7ff',
        color: highlight ? '#92400e' : '#4f46e5',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        {value}
      </span>
    ) : (
      <p style={{ 
        fontSize: '15px', 
        fontWeight: '600', 
        color: highlight ? '#d97706' : '#1e293b', 
        margin: 0 
      }}>
        {value}
      </p>
    )}
  </div>
);

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default AppointmentDetails;