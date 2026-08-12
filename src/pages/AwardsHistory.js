
import React, { useState, useEffect,useCallback } from 'react';
import { 
  FaSave, FaTimes, FaTrophy, FaCalendarAlt, FaBuilding, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaTrash, FaPlus,
  FaFileAlt, FaSearch, FaAward, FaUserTie, FaEye, FaDownload, FaStar, FaArrowLeft,FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';
import axios from 'axios';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';

const AwardsHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [awards, setAwards] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [selectedAward, setSelectedAward] = useState(null); 
  const [documentPreview, setDocumentPreview] = useState(null); 
  const [formRows, setFormRows] = useState([
    {
      id: Date.now(),
      awardName: '',
      awardDate: '',
     awardTypeId: '',
issuedById: '',
      description: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null,
      employeeId: '',
      employeeName: ''
    }
  ]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: "",
    newStatus: ""
  });
  const [employees, setEmployees] = useState([]);
const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showDocumentActions, setShowDocumentActions] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [awardTypesList, setAwardTypesList] = useState([]);
const [loadingAwardTypes, setLoadingAwardTypes] = useState(false);
const [issuedByList, setIssuedByList] = useState([]);
const [loadingIssuedBy, setLoadingIssuedBy] = useState(false);
 const [docLoading, setDocLoading] = useState(false);
const [loading, setLoading] = useState(false);
const [totalPages, setTotalPages] = useState(0);
const [totalElements, setTotalElements] = useState(0);
 
// ─── LOOKUP FUNCTIONS ──────────────────────────────────────────────
const getAwardTypeIdByName = (name) => awardTypesList.find(at => at.label === name)?.id || null;
const getIssuedByIdByName = (name) => issuedByList.find(ib => ib.label === name)?.id || null;

  // Handle row click for detail view
  const handleRowClick = (award) => {
    setSelectedAward(award);
  };

  // ─── Auth helpers ──────────────────────────────────────────
const getAuthToken = () => localStorage.getItem(STORAGE_KEYS?.JWT_TOKEN || 'jwtToken');

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

const getEmployeeName = (employeeId) => {
  const emp = employees.find(e => e.id === employeeId);
  return emp?.name || 'Unknown';
};

const fetchEmployees = useCallback(async () => {
  if (!ensureToken()) return;
  try {
    const res = await axios.get(`${BASE_URL}/api/employees`, { 
      ...getAxiosConfig(), 
      params: { size: 1000, page: 0 } 
    });
    if (res.data?.status === 200) {
      let employeesData = Array.isArray(res.data.response)
        ? res.data.response
        : (res.data.response?.content || res.data.response?.data || []);
        
  
      const mappedEmployees = employeesData.map(emp => ({
        id: emp.id || emp.employeeId,
        name: emp.name || emp.employeeName || '',
        employeeCode: emp.employeeCode || emp.code || `EMP${String(emp.id || emp.employeeId || '').padStart(4, '0')}`,
        department: emp.department || emp.departmentName || '',
        departmentName: emp.department || emp.departmentName || '',
        designation: emp.designation || emp.designationName || '',
        designationName: emp.designation || emp.designationName || '',
        email: emp.email || '',
        ...emp
      }));
        
      console.log("✅ Mapped Employees:", mappedEmployees);
      setEmployees(mappedEmployees);
    } else {
      setEmployees([]);
    }
  } catch (err) {
    console.error('Fetch employees error:', err);
    toast.error('Error', err.response?.data?.message || 'Failed to fetch employees');
    setEmployees([]);
  }
}, []);

// ─── FETCH AWARDS FROM API ──────────────────────────────────────
const fetchAwards = useCallback(async () => {
  if (!ensureToken()) return;
  setLoading(true);
  try {
    const params = {
      page: page,
      size: rowsPerPage,
    };
    if (searchTerm) params.search = searchTerm;
    if (employeeId) params.employeeId = employeeId;

    const res = await axios.get(
      `${BASE_URL}/api/awards`,
      { ...getAxiosConfig(), params }
    );

    console.log("📥 Awards Response:", res.data);

    let awardsData = [];
    let totalPagesData = 0;
    let totalElementsData = 0;

    if (res.data?.status === 200) {
      if (res.data.response?.content) {
        awardsData = res.data.response.content;
        totalPagesData = res.data.response.totalPages || 0;
        totalElementsData = res.data.response.totalElements || 0;
      } else if (Array.isArray(res.data.response)) {
        awardsData = res.data.response;
        totalPagesData = Math.ceil(awardsData.length / rowsPerPage);
        totalElementsData = awardsData.length;
      }
    } else if (res.data?.content) {
      awardsData = res.data.content;
      totalPagesData = res.data.totalPages || 0;
      totalElementsData = res.data.totalElements || 0;
    } else if (res.data?.data && Array.isArray(res.data.data)) {
      awardsData = res.data.data;
      totalPagesData = Math.ceil(awardsData.length / rowsPerPage);
      totalElementsData = awardsData.length;
    } else if (Array.isArray(res.data)) {
      awardsData = res.data;
      totalPagesData = Math.ceil(awardsData.length / rowsPerPage);
      totalElementsData = awardsData.length;
    }

    const mappedAwards = awardsData.map((item) => ({
  id: item.id,
  employeeId: item.employeeId,
  employeeName: item.employeeName || 'Unknown',
  employeeCode: item.employeeCode || '',
  departmentName: item.departmentName || '',
  designationName: item.designationName || '',
  awardName: item.awardName || '',
  awardDate: item.awardDate || '',
  awardType: item.awardType?.name || item.awardType || '',  // ✅ ADD THIS - for display
  awardTypeId: item.awardType?.id || item.awardTypeId || null,
  issuedById: item.issuedById || item.issuedBy?.id || null,  // ✅ FIX
  issuedByName: item.issuedByName || item.issuedBy?.name || '',  // ✅ ADD THIS - for display
  description: item.description || '',
  status: item.isActive ? 'Active' : 'Inactive',
  createdAt: item.createdAt || new Date().toISOString(),
   certificateFileName: item.documentName || item.certificateFileName || null,
  certificateFileData: item.certificateFileData || null,
  documentPath: item.documentPath || null,
  hasDocument: !!(item.documentName || item.certificateFileName), 

}));

    console.log("✅ Mapped Awards:", mappedAwards);
    setAwards(mappedAwards);
    setTotalPages(totalPagesData);
    setTotalElements(totalElementsData);

  } catch (err) {
    console.error('Fetch awards error:', err);
    toast.error('Error', err.response?.data?.message || 'Failed to load awards');
    setAwards([]);
  } finally {
    setLoading(false);
  }
}, [page, rowsPerPage, searchTerm, employeeId]);

useEffect(() => {
  fetchAwards();
  fetchEmployees();
}, [page, searchTerm, fetchAwards, fetchEmployees]);

// ─── FETCH AWARD TYPES ──────────────────────────────────────────
const fetchAwardTypes = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingAwardTypes(true);
  try {
    const res = await axios.get(`${BASE_URL}/api/award-types/list?flag=0`, getAxiosConfig());
    
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
      value: item.name || item.awardType || '',
      label: item.name || item.awardType || ''
    }));
    setAwardTypesList(mapped);
  } catch (err) {
    console.error('Fetch award types error:', err);
    setAwardTypesList([]);
  } finally {
    setLoadingAwardTypes(false);
  }
}, []);

// ─── FETCH ISSUED BY (Employee Designation) ──────────────────────────
const fetchIssuedBy = useCallback(async () => {
  if (!ensureToken()) return;
  setLoadingIssuedBy(true);
  try {
    const res = await axios.get(`${BASE_URL}/employee-designation?flag=0`, getAxiosConfig());
    console.log("📥 Issued By Response:", res.data);
    
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
      value: item.employeeName || item.designationName || item.name || '',
      label: item.employeeName || item.designationName || item.name || ''
    }));
    setIssuedByList(mapped);
  } catch (err) {
    console.error('Fetch issued by error:', err);
    setIssuedByList([]);
  } finally {
    setLoadingIssuedBy(false);
  }
}, []);

useEffect(() => {
  fetchAwardTypes();
  fetchIssuedBy();
}, [fetchAwardTypes, fetchIssuedBy]);

 const handleViewDocument = async (e, award) => {
  e.stopPropagation(); 
  setSelectedAward(award);
  
  // Check if document exists in award data
  if (award.certificateFileData) {
    setDocumentPreview({
      data: award.certificateFileData,
      name: award.certificateFileName || 'certificate.pdf'
    });
    return;
  }
  
  // Fetch from API if not available
  if (award.hasDocument || award.documentPath) {
    setDocLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/awards/${award.id}/document`,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
          responseType: 'blob',
        }
      );
      const blobUrl = URL.createObjectURL(res.data);
      setDocumentPreview({
        data: blobUrl,
        name: award.certificateFileName || `award_${award.id}.pdf`
      });
      toast.success('Success', 'Document loaded successfully');
    } catch (err) {
      console.error('Document fetch error:', err);
      toast.error('Error', 'Failed to load document');
    } finally {
      setDocLoading(false);
    }
  } else {
    toast.info('No Document', 'No certificate has been uploaded for this award');
  }
};
 

 const filteredEmployees = employees.filter(emp => {
  const search = (employeeSearchTerm || '').toLowerCase();
  return (emp.name || emp.employeeName || '').toLowerCase().includes(search) || 
         (emp.code || emp.employeeCode || '').toLowerCase().includes(search) ||
         (emp.department || emp.departmentName || '').toLowerCase().includes(search) ||
         (emp.designation || emp.designationName || '').toLowerCase().includes(search) ||
         (emp.email || '').toLowerCase().includes(search);
});

const filteredAwards = awards.filter(award => {
  const search = (searchTerm || '').toLowerCase();
  return (award.awardName || '').toLowerCase().includes(search) ||
         (award.awardType || '').toLowerCase().includes(search) ||
         (award.issuedByName || '').toLowerCase().includes(search) ||
         (award.employeeName || '').toLowerCase().includes(search);
});

  // Pagination
 const totalItems = totalElements || filteredAwards.length;
const totalPagesCount = totalPages || Math.ceil(filteredAwards.length / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentAwards = filteredAwards.slice(startIndex, startIndex + rowsPerPage);

 const handleEmployeeSelect = (rowId, employee) => {
  console.log("✅ Selected Employee:", employee);
  
  const empCode = employee.code || employee.employeeCode || '';
  const empDepartment = employee.department || employee.departmentName || '';
  const empDesignation = employee.designation || employee.designationName || '';
  
  console.log("📌 Employee Code:", empCode);
  console.log("📌 Department:", empDepartment);
  console.log("📌 Designation:", empDesignation);
  
  setFormRows(prev => prev.map(row => 
    row.id === rowId ? {
      ...row,
      employeeId: employee.id,
      employeeName: employee.name || employee.employeeName,
      employeeCode: empCode,           
      departmentName: empDepartment,   
      designationName: empDesignation   
    } : row
  ));
  
  setSelectedEmployee(employee);
  setEmployeeSearchTerm(employee.name || employee.employeeName);
  setShowEmployeeDropdown(false);
  
  if (rowErrors[rowId]) {
    const newErrors = { ...rowErrors };
    delete newErrors[rowId];
    setRowErrors(newErrors);
  }
};

 const getPaginationRange = () => { 
  const delta = 2;
  const range = [];
  const left = Math.max(0, page - delta);
  const right = Math.min(totalPagesCount - 1, page + delta);
  if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
  for (let i = left; i <= right; i++) range.push(i);
  if (right < totalPagesCount - 1) { if (right < totalPagesCount - 2) range.push('...'); range.push(totalPagesCount - 1); }
  return range;
};
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleRowChange = (rowId, field, value) => {
    setFormRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
    
    // Clear error for this field
    if (rowErrors[rowId] && rowErrors[rowId][field]) {
      const newErrors = { ...rowErrors };
      delete newErrors[rowId][field];
      if (Object.keys(newErrors[rowId] || {}).length === 0) {
        delete newErrors[rowId];
      }
      setRowErrors(newErrors);
    }
  };

  const handleRowFileChange = (rowId, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('File too large', 'Maximum file size is 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormRows(prev => prev.map(row => 
          row.id === rowId ? {
            ...row,
            certificateFile: file,
            certificateFileData: reader.result,
            certificateFileName: file.name
          } : row
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateRow = (row) => {
    const errors = {};
    if (!row.awardName) errors.awardName = 'Award Name is required';
    if (!row.awardDate) errors.awardDate = 'Award Date is required';
   if (!row.awardTypeId) errors.awardTypeId = 'Award Type is required';
if (!row.issuedById) errors.issuedById = 'Issued By is required';
    if (!row.employeeId) errors.employeeId = 'Employee is required';
    return errors;
  };

  const addRow = () => {
    const newRow = {
      id: Date.now() + Math.random(),
      awardName: '',
      awardDate: '',
     awardTypeId: '',    
    issuedById: '',
      description: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null,
      employeeId: '',
      employeeName: '',
      employeeCode: '',      
    departmentName: '',    
    designationName: '' 
    };
    setFormRows([...formRows, newRow]);
  };

  const removeRow = (rowId) => {
    if (formRows.length <= 1) {
      toast.warning('Cannot Remove', 'At least one row is required');
      return;
    }
    setFormRows(prev => prev.filter(row => row.id !== rowId));
    // Remove errors for this row
    const newErrors = { ...rowErrors };
    delete newErrors[rowId];
    setRowErrors(newErrors);
  };

// ─── CREATE & UPDATE API ──────────────────────────────────────
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!ensureToken()) return;
  
  // Validate all rows
  let hasErrors = false;
  const allErrors = {};
  
  formRows.forEach(row => {
    const rowError = validateRow(row);
    if (Object.keys(rowError).length > 0) {
      allErrors[row.id] = rowError;
      hasErrors = true;
    }
  });
  
  if (hasErrors) {
    setRowErrors(allErrors);
    toast.warning('Validation Error', 'Please fix the highlighted fields in all rows');
    return;
  }

  // Check if employee selected
  if (!selectedEmployee && !formRows[0]?.employeeId) {
    toast.warning('Validation Error', 'Please select an employee');
    return;
  }

  setSubmitting(true);
  try {
    let res;
    
    // Get employee details from the first row
    const empData = selectedEmployee || null;
    const employeeId = empData?.id || Number(formRows[0]?.employeeId) || 0;

    if (editingAward) {
      const payload = {
        employeeId: employeeId,
        awardName: formRows[0]?.awardName || '',
        awardDate: formRows[0]?.awardDate || '',
      awardTypeId: Number(formRows[0]?.awardTypeId) || 0,  
  issuedById: Number(formRows[0]?.issuedById) || 0,    
        description: formRows[0]?.description || ''
      };
      
      console.log("📤 UPDATE payload:", payload);
      
      res = await axios.put(
        `${BASE_URL}/api/awards/${editingAward.id}/update`,
        payload,
        getAxiosConfig()
      );

      if (res.data?.status === 200 || res.data?.status === 201) {
        toast.success('Success', 'Award updated successfully');
        resetForm();
        setShowForm(false);
        setPage(0);
        await fetchAwards();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
      
    } else {
      // ✅ CREATE API - Multiple rows
      const createPayloads = formRows.map(row => ({
        employeeId: row.employeeId || employeeId || 0,
        awardName: row.awardName || '',
        awardDate: row.awardDate || '',
       awardTypeId: Number(row.awardTypeId) || 0,  
  issuedById: Number(row.issuedById) || 0, 
        description: row.description || ''
      }));
      
      console.log("📤 CREATE payloads:", createPayloads);
      
      // Send one by one
      let successCount = 0;
      for (const payload of createPayloads) {
        res = await axios.post(
          `${BASE_URL}/api/awards/create`,
          payload,
          getAxiosConfig()
        );
        if (res.data?.status === 200 || res.data?.status === 201) {
          successCount++;
        }
      }
      
      if (successCount === createPayloads.length) {
        toast.success('Success', `${successCount} Award(s) created successfully`);
        resetForm();
        setShowForm(false);
        setPage(0);
        await fetchAwards();
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Some awards failed to create');
      }
    }

  } catch (err) {
    console.error('Submit error:', err);
    toast.error('Error', err.response?.data?.message || err.message || 'Something went wrong');
  } finally {
    setSubmitting(false);
  }
};

const handleEdit = (award) => {
  if (award.status === 'Inactive') {
    toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
    return;
  }
  
  const emp = employees.find(e => e.id === award.employeeId);
  setSelectedEmployee(emp || null);  
  setEditingAward(award);
  
  setFormRows([{
    id: Date.now(),
    awardName: award.awardName || '',
    awardDate: award.awardDate || '',
    awardTypeId: award.awardTypeId || '',  
    issuedById: award.issuedById || '', 
    description: award.description || '',
    certificateFile: null,
    certificateFileData: award.certificateFileData || null,
    certificateFileName: award.certificateFileName || null,
    employeeId: award.employeeId || '',
    employeeName: emp?.name || emp?.employeeName || award.employeeName || '',
    employeeCode: emp?.code || emp?.employeeCode || award.employeeCode || '',  
    departmentName: emp?.department || emp?.departmentName || award.departmentName || '', 
    designationName: emp?.designation || emp?.designationName || award.designationName || ''  
  }]);

  setEmployeeSearchTerm(emp?.name || emp?.employeeName || '');
  setShowForm(true);
};

  const resetForm = () => {
    setFormRows([{
      id: Date.now(),
      awardName: '',
      awardDate: '',
      awardTypeId: '',    
    issuedById: '',  
      description: '',
      certificateFile: null,
      certificateFileData: null,
      certificateFileName: null,
      employeeId: '',
      employeeName: '',
       employeeCode: '',      
    departmentName: '',    
    designationName: ''    
    }]);
    setErrors({});
    setTouched({});
    setEditingAward(null);
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
    setRowErrors({});
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
    setSelectedAward(null);
    setShowDocumentActions(false);
  };

  // Calculate stats
  const totalAwards = awards.length;
  const topAwards = awards.filter(a => a.awardType === 'Employee of Year' || a.awardType === 'Star Performer').length;

  // Get award type color
  const getAwardTypeColor = (awardType) => {
    switch(awardType) {
      case 'Star Performer':
      case 'Employee of Year':
        return { bg: '#fef3c7', color: '#92400e', icon: '⭐' };
      case 'Innovation':
        return { bg: '#e0e7ff', color: '#4f46e5', icon: '💡' };
      case 'Leadership':
        return { bg: '#d1fae5', color: '#065f46', icon: '👑' };
      case 'Performance':
        return { bg: '#fce7f3', color: '#9d174d', icon: '📈' };
      case 'Customer Service':
        return { bg: '#dbeafe', color: '#1e40af', icon: '🤝' };
      case 'Teamwork':
        return { bg: '#e5e7eb', color: '#374151', icon: '🤲' };
      case 'Employee of Month':
        return { bg: '#ffedd5', color: '#9a3412', icon: '📅' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280', icon: '🏆' };
    }
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

 // ─── STATUS API ──────────────────────────────────────────────
const confirmStatusChange = async () => {
  const { id, newStatus, name } = statusAction;
  
  if (!id) {
    toast.error('Error', 'Invalid record ID');
    return;
  }

  setLoading(true);
  try {
    const isActive = newStatus === 'Active';
    const res = await axios.put(
      `${BASE_URL}/api/awards/${id}/status?active=${isActive}`,
      null,
      getAxiosConfig()
    );
    
    if (res.status === 200) {
      toast.success('Status Updated', `${name} is now ${newStatus}`);
      await fetchAwards();
    }
  } catch (err) {
    console.error('Status change error:', err);
    toast.error('Error', err.response?.data?.message || 'Failed to change status');
  } finally {
    setLoading(false);
    setShowStatusModal(false);
    setStatusAction({ id: null, name: "", newStatus: "" });
  }
};

// ─── FETCH AWARD DOCUMENT ──────────────────────────────────────────
const fetchAwardDocument = useCallback(async (awardId) => {
  if (!ensureToken()) return;
  setDocLoading(true);
  try {
    const res = await axios.get(
      `${BASE_URL}/api/awards/${awardId}/document`,
      {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        responseType: 'blob',
      }
    );
    const blobUrl = URL.createObjectURL(res.data);
    return blobUrl;
  } catch (err) {
    console.error('Document fetch error:', err);
    toast.error('Error', 'Failed to load document');
    return null;
  } finally {
    setDocLoading(false);
  }
}, []);

 const handleGenerateLetter = (award) => {
  console.log('Generate clicked for:', award.awardName);
  toast.info('Generate Certificate', `Generating award certificate for ${award.awardName}`);
  // Call API for PDF generation
  generateAwardPDF(award.id);
};

 const getEmployeeDetails = (employeeId) => {
  if (!employeeId) return null;
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) return null;
  return {
    ...emp,
    employeeCode: emp.code || emp.employeeCode || '',
    departmentName: emp.department || emp.departmentName || '',
    designationName: emp.designation || emp.designationName || ''
  };
};

// ─── GENERATE AWARD PDF ──────────────────────────────────────────
const generateAwardPDF = useCallback(async (awardId) => {
  if (!ensureToken()) return;
  setSubmitting(true);
  try {
    const res = await axios.post(
      `${BASE_URL}/api/awards/${awardId}/generate-pdf`,
      {},
      {
        headers: { 
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        responseType: 'blob',
      }
    );
    
    // Download the generated PDF
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `award_${awardId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Success', 'Certificate generated successfully');
  } catch (err) {
    console.error('Generate PDF error:', err);
    toast.error('Error', err.response?.data?.message || 'Failed to generate certificate');
  } finally {
    setSubmitting(false);
  }
}, []);

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Awards & Recognition History</h1>
          <p className="cert-subtitle">Manage employee awards and recognitions</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedAward && !showDocumentActions && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Award
            </button>
          )}
          {(showForm || selectedAward || showDocumentActions) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedAward && !showDocumentActions && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

     {showForm ? (
  <div className="cert-form-wrap mb-4">
    <form onSubmit={handleSubmit}>
      <div className="cert-form-section-compact">
        <div className="cert-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px',paddingLeft: '10px', paddingTop: '8px'  }}>
          <span>Award Details {formRows.length > 1 && <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>({formRows.length} entries)</span>}</span>
        </div>
        
        {/* Table-like form */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '160px' }}>Employee <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '120px' }}>Employee Code</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '120px' }}>Department</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '120px' }}>Designation</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '140px' }}>Award Name <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '110px' }}>Award Date <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '140px' }}>Award Type <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '140px' }}>Issued By <span style={{ color: '#ef4444' }}>*</span></th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', minWidth: '140px' }}>Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', minWidth: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formRows.map((row, index) => {
                const employee = getEmployeeDetails(row.employeeId);
                const rowError = rowErrors[row.id] || {};
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className={`form-control ${rowError.employeeId ? 'is-invalid' : ''}`}
                          placeholder="Search employee..."
value={employee?.name || row.employeeName || ''} 
                          onChange={(e) => {
                            setEmployeeSearchTerm(e.target.value);
                            setShowEmployeeDropdown(true);
                          }}
                          onFocus={() => {
                            if (employeeSearchTerm.length > 0) {
                              setShowEmployeeDropdown(true);
                            }
                          }}
                          style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                        />
                        {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            right: 0, 
                            background: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '6px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                            zIndex: 1000, 
                            maxHeight: '180px', 
                            overflow: 'auto',
                            marginTop: '2px'
                          }}>
                            {filteredEmployees.length > 0 ? (
                              filteredEmployees.map(emp => (
                                <div
                                  key={emp.id}
                                  style={{ 
                                    padding: '6px 10px', 
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontSize: '12px'
                                  }}
                                  onClick={() => handleEmployeeSelect(row.id, emp)}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <div style={{ fontWeight: 500 }}>{emp.name}</div>
                                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
 <div style={{ fontWeight: 500 }}>{emp.name || emp.employeeName}</div>
<div style={{ fontSize: '10px', color: '#6b7280' }}>
  {emp.code || emp.employeeCode || 'N/A'}
  {emp.department || emp.departmentName ? ` | ${emp.department || emp.departmentName}` : ''}
  {emp.designation || emp.designationName ? ` | ${emp.designation || emp.designationName}` : ''}
</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '8px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                                No employees found
                              </div>
                            )}
                          </div>
                        )}
                        {rowError.employeeId && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.employeeId}</div>}
                      </div>
                    </td>
                 <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
  <input 
    type="text" 
    className="form-control bg-light" 
    value={row.employeeCode || employee?.code || employee?.employeeCode || ''} 
    readOnly 
    placeholder="Auto" 
    style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }} 
  />
</td>
<td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
  <input 
    type="text" 
    className="form-control bg-light" 
    value={row.departmentName || employee?.department || employee?.departmentName || ''} 
    readOnly 
    placeholder="Auto" 
    style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }} 
  />
</td>
<td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
  <input 
    type="text" 
    className="form-control bg-light" 
    value={row.designationName || employee?.designation || employee?.designationName || ''} 
    readOnly 
    placeholder="Auto" 
    style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }} 
  />
</td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input
                        type="text"
                        className={`form-control ${rowError.awardName ? 'is-invalid' : ''}`}
                        placeholder="Award name"
                        value={row.awardName}
                        onChange={(e) => handleRowChange(row.id, 'awardName', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      />
                      {rowError.awardName && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.awardName}</div>}
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input
                        type="date"
                        className={`form-control ${rowError.awardDate ? 'is-invalid' : ''}`}
                        value={row.awardDate}
                        onChange={(e) => handleRowChange(row.id, 'awardDate', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      />
                      {rowError.awardDate && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.awardDate}</div>}
                    </td>
                   <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
  <select
    className={`form-control ${rowError.awardTypeId ? 'is-invalid' : ''}`}
    value={row.awardTypeId || ''}
    onChange={(e) => handleRowChange(row.id, 'awardTypeId', e.target.value)}
    style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
    disabled={loadingAwardTypes}
  >
    <option value="">Select Award Type</option>
    {awardTypesList.map(type => (
      <option key={type.id} value={type.id}>{type.label}</option>
    ))}
  </select>
  {loadingAwardTypes && <small>Loading...</small>}
  {rowError.awardTypeId && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.awardTypeId}</div>}
</td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
           <select
                        className={`form-control ${rowError.issuedById ? 'is-invalid' : ''}`}
                        value={row.issuedById}
                        onChange={(e) => handleRowChange(row.id, 'issuedById', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      >
                        <option value="">Select</option>
{issuedByList.map(item => (
    <option key={item.id} value={item.id}>{item.label}</option> 
  ))}                      </select>
                      {rowError.issuedById && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '2px' }}>{rowError.issuedById}</div>}        
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Description"
                        value={row.description}
                        onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Add Row Button */}
                        <button
                          type="button"
                          onClick={addRow}
                          title="Add new row"
                          style={{ 
                            padding: '4px 8px', 
                            background: '#9d174d', 
                            border: 'none', 
                            borderRadius: '4px', 
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <FaPlus size={11} />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          type="button"
                          className="cert-act cert-act--delete"
                          onClick={() => removeRow(row.id)}
                          title="Remove row"
                          style={{ 
                            padding: '4px 8px', 
                            background: '#fee2e2', 
                            border: 'none', 
                            borderRadius: '4px', 
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          disabled={formRows.length <= 1}
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
         <div className="cert-form-actions" style={{ marginTop: '20px' }}>
        <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
        <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', paddingRight: '15px' }}>
          <FaSave size={12} /> {editingAward ? 'Update Award' : `Save ${formRows.length} Award(s)`}
        </button>
      </div>
      </div>     
     
    </form>
  </div>

      ) : selectedAward ? (
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}><FaTrophy size={20}/><h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedAward.awardName}</h2></div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}><span><FaCalendarAlt/> {formatDate(selectedAward.createdAt)}</span><span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedAward.awardType || '—'}</span></div>
            </div>
          </div>
          <div style={{padding:'32px'}}>
            <div style={{textAlign:'center',padding:'30px',background:'linear-gradient(135deg,#fef3c7,#fde68a)',borderRadius:'12px',marginBottom:'24px',border:'2px solid #f59e0b'}}>
              <div style={{fontSize:'48px',marginBottom:'12px'}}>{getAwardTypeColor(selectedAward.awardType).icon}</div>
              <h2 style={{fontSize:'24px',fontWeight:700,color:'#92400e',margin:'0 0 8px 0'}}>{selectedAward.awardName}</h2>
              <span style={{display:'inline-block',padding:'6px 16px',borderRadius:'6px',fontSize:'14px',fontWeight:600,background:getAwardTypeColor(selectedAward.awardType).bg,color:getAwardTypeColor(selectedAward.awardType).color}}><FaAward style={{marginRight:'6px'}}/>{selectedAward.awardType}</span>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>{employees.find(e=>e.id===selectedAward.employeeId)?.name?.charAt(0)||'?'}
</div>
              <div><h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>{employees.find(e=>e.id===selectedAward.employeeId)?.name||selectedAward.employeeName}
</h3><span style={{fontSize:'13px',color:'#64748b'}}>{employees.find(e=>e.id===selectedAward.employeeId)?.code||''}
</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#fffbeb',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaCalendarAlt size={16} style={{color:'#f59e0b'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Award Date</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedAward.awardDate)}</p></div>
              <div style={{background:'#fdf2f8',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaBuilding size={16} style={{color:'#9d174d'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Issued By</span></div><p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedAward.issuedByName || '—'}</p></div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}><FaClock size={16} style={{color:'#ea580c'}}/><span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span></div><span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedAward.status==='Active'?'#d1fae5':'#fee2e2',color:selectedAward.status==='Active'?'#065f46':'#991b1b'}}>{selectedAward.status||'Active'}</span></div>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0'}}><h4 style={{fontSize:'14px',fontWeight:600,color:'#1e293b',marginBottom:'12px'}}>Description</h4><p style={{fontSize:'15px',color:'#374151',margin:0,lineHeight:1.6}}>{selectedAward.description||'No description provided'}</p></div>
            <div style={{background:'linear-gradient(135deg,#e0e7ff,#c7d2fe)',padding:'20px',borderRadius:'8px',textAlign:'center',border:'1px solid #a5b4fc',marginBottom:'24px'}}>
              <FaStar size={32} style={{color:'#f59e0b',marginBottom:'8px'}}/>
              <label style={{fontSize:'12px',color:'#4f46e5',display:'block',marginBottom:'4px'}}>Achievement Level</label>
              <p style={{fontSize:'14px',fontWeight:700,color:'#3730a3',margin:0}}>{selectedAward.awardType==='Employee of Year'||selectedAward.awardType==='Star Performer'?'🏆 Top Honor':'🎖️ Excellence'}</p>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}><FaFilePdf size={16} style={{color:'#dc2626'}}/> Award Certificate</h4>
              {selectedAward.certificateFileName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}><div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>{selectedAward.certificateFileName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}</div><div><p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedAward.certificateFileName}</p><span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded certificate</span></div></div>
                  <button onClick={(e)=>handleViewDocument(e,selectedAward)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}><FaEye size={14}/> View Certificate</button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}><FaFileAlt size={36} style={{marginBottom:'12px',opacity:0.3}}/><p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No certificate uploaded</p><span style={{fontSize:'13px'}}>No award certificate has been uploaded</span></div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by award name, type, issued by or employee..."
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

          {/* Awards Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Award Name</th>                   
                    <th>Award Date</th>
                    <th>Award Type</th>
                    <th>Issued By</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAwards.length > 0 ? (
                    currentAwards.map((award,idx) => (
                      <tr 
                        key={award.id}
                        onClick={() => handleRowClick(award)} 
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                        <td className="text-center">{startIndex + idx + 1}</td>
<td>{employees.find(e => e.id === award.employeeId)?.name || award.employeeName || 'Unknown'}</td>

                        <td><strong>{award.awardName}</strong></td>
                        <td>{formatDate(award.awardDate)}</td>
<td>{award.awardType || '—'}</td>
<td>{award.issuedByName || '—'}</td>
                        <td>{award.description ? (award.description.length > 30 ? award.description.substring(0, 30) + '...' : award.description) : '—'}</td>
                        <td>
                          <div
                            className="d-flex align-items-center gap-1"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                          handleStatusToggle(
  award.id,
  getEmployeeName(award.employeeId),  // Changed
  award.status || "Active"
)
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "16px",
                                borderRadius: "50px",
                                backgroundColor:
                                  (award.status || "Active") === "Active"
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
                                    (award.status || "Active") === "Active"
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
                                  (award.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#94a3b8"
                              }}
                            >
                              {award.status || "Active"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(award)} 
                              title={award.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={award.status === 'Inactive'}
                              style={{ 
                                opacity: award.status === 'Inactive' ? 0.5 : 1,
                                cursor: award.status === 'Inactive' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="10" className="text-center py-5">No award records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
        <div className="cert-table-footer">
  <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} awards
  </div>
  
  {totalPagesCount > 0 && (
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
        disabled={page + 1 >= totalPagesCount} 
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

            <h3 className="emp-modal-title">
              Confirm Status Change
            </h3>

            <p className="emp-modal-body">
              Are you sure you want to{" "}
              <strong>
                {statusAction.newStatus === "Active"
                  ? "activate"
                  : "deactivate"}
              </strong>{" "}
              <strong>{statusAction.name}</strong>?
            </p>

            <p className="emp-modal-warn">
              {statusAction.newStatus === "Inactive"
                ? "Inactive records cannot be edited until reactivated."
                : "This record will become active again."}
            </p>

            <div className="emp-modal-actions">
              <button
                className="emp-modal-cancel"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>

              <button
                className="emp-modal-confirm"
                onClick={confirmStatusChange}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
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
                Certificate Preview
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
                    alt="Certificate Preview" 
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
                    Uploaded certificate
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
                  <FaDownload /> Download
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
        .is-invalid {
          border-color: #ef4444 !important;
        }
        .is-invalid:focus {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default AwardsHistory;