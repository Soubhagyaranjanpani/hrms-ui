
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaSave, FaTimes, FaGavel, FaCalendarAlt, FaUserShield, 
  FaUpload, FaFilePdf, FaFileImage, FaEdit, FaPlus, FaExclamationTriangle,
  FaFileAlt, FaSearch, FaCheckCircle, FaClock, FaUserTie, FaEye, FaDownload, FaArrowLeft, FaTrash
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';
import axios from "axios";
import { BASE_URL, STORAGE_KEYS } from "../config/api.config";

const DisciplinaryRecords = ({ employeeId, initialData, onSuccess, onCancel }) => {
  // States
  const [disciplinaries, setDisciplinaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [formData, setFormData] = useState({
    caseNumber: '',
    incidentDate: '',
    actionType: '',
    investigationOfficer: '',
    penalty: '',
    resolutionDate: '',
    supportingDocuments: null,
    supportingDocumentsData: null,
    supportingDocumentsName: null,
    employeeId: '',
    employeeName: '',
    employeeCode: '',     
    department: '',      
    designation: ''       
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingCaseNumbers, setExistingCaseNumbers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: "",
    newStatus: ""
  });
  const [showDocumentActions, setShowDocumentActions] = useState(false);
  
  // Dropdown states
  const [actionTypesList, setActionTypesList] = useState([]);
  const [loadingActionTypes, setLoadingActionTypes] = useState(false);
  const [investigationOfficersList, setInvestigationOfficersList] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [penaltyTypesList, setPenaltyTypesList] = useState([]);
  const [loadingPenalties, setLoadingPenalties] = useState(false);
  const [employeesList, setEmployeesList] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Auth functions
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
      toast.error('Authentication Required', 'Please login to continue');
      return false;
    }
    return true;
  };

  // Helper functions to get IDs from names
  const getActionTypeIdByName = (name) => {
    const found = actionTypesList.find(item => item.value === name || item.label === name);
    return found?.id || null;
  };

  const getOfficerIdByName = (name) => {
    const found = investigationOfficersList.find(item => item.value === name || item.label === name);
    return found?.id || null;
  };

  const getPenaltyIdByName = (name) => {
    const found = penaltyTypesList.find(item => item.value === name || item.label === name);
    return found?.id || null;
  };

  // Fetch Employees from API
  // const fetchEmployees = useCallback(async () => {
  //   const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  //   if (!token) return;

  //   setLoadingEmployees(true);
  //   try {
  //     const res = await axios.get(
  //       `${BASE_URL}/api/employees?page=0&size=1000`,
  //       getAxiosConfig()
  //     );

  //     let employeesData = [];
  //     if (res.data?.response?.content) {
  //       employeesData = res.data.response.content;
  //     } else if (res.data?.content) {
  //       employeesData = res.data.content;
  //     } else if (Array.isArray(res.data)) {
  //       employeesData = res.data;
  //     }

  //     const mapped = employeesData.map((item) => ({
  //       id: item.id,
  //       name: item.name || item.employeeName || '',
  //       code: item.employeeCode || item.code || '',
  //       department: item.departmentName || item.department || '',
  //       designation: item.designation || '',
  //     }));

  //     setEmployeesList(mapped);
  //   } catch (err) {
  //     console.error("❌ Fetch employees error:", err);
  //     setEmployeesList([]);
  //   } finally {
  //     setLoadingEmployees(false);
  //   }
  // }, []);
const fetchEmployees = useCallback(async () => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  if (!token) return;

  setLoadingEmployees(true);

  try {
    const res = await axios.get(
      `${BASE_URL}/api/employees?page=0&size=1000`,
      getAxiosConfig()
    );

    console.log("📥 EMPLOYEE API RESPONSE:", res.data);

    let employeesData = [];

    if (res.data?.response?.content) {
      employeesData = res.data.response.content;
    } else if (res.data?.response) {
      employeesData = Array.isArray(res.data.response)
        ? res.data.response
        : [];
    } else if (res.data?.content) {
      employeesData = res.data.content;
    } else if (res.data?.data) {
      employeesData = Array.isArray(res.data.data)
        ? res.data.data
        : [];
    } else if (Array.isArray(res.data)) {
      employeesData = res.data;
    }

    const mapped = employeesData.map((item) => ({
      id: item.id || item.employeeId,

      name:
        item.name ||
        item.employeeName ||
        item.fullName ||
        '',

      code:
        item.employeeCode ||
        item.code ||
        item.empCode ||
        '',

      department:
        item.departmentName ||
        item.department ||
        item.department?.name ||
        item.department?.departmentName ||
        item.deptName ||
        '',

      designation:
        item.designationName ||
        item.designation ||
        item.designation?.name ||
        item.designation?.designationName ||
        item.postName ||
        ''
    }));

    console.log("✅ MAPPED EMPLOYEES:", mapped);

    setEmployeesList(mapped);

  } catch (err) {
    console.error("❌ Fetch employees error:", err);
    setEmployeesList([]);
  } finally {
    setLoadingEmployees(false);
  }
}, []);

  // Fetch Action Types
  const fetchActionTypes = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) return;
    setLoadingActionTypes(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/action-types/list?flag=0`,
        getAxiosConfig()
      );
      let data = res.data?.response?.content || res.data?.response || res.data?.data || res.data || [];
      const mapped = data.map((item) => ({
        id: item.id,
        value: item.name || item.actionType,
        label: item.name || item.actionType
      }));
      setActionTypesList(mapped);
    } catch (err) {
      console.error("❌ Fetch action types error:", err);
    } finally {
      setLoadingActionTypes(false);
    }
  }, []);

  // Fetch Investigation Officers
  const fetchInvestigationOfficers = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) return;
    setLoadingOfficers(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/employee-designation?flag=0`,
        getAxiosConfig()
      );
      let data = res.data?.response?.content || res.data?.response || res.data?.data || res.data || [];
      const mapped = data.map((item) => ({
        id: item.id,
        value: item.employeeName || item.designationName,
        label: item.employeeName || item.designationName
      }));
      setInvestigationOfficersList(mapped);
    } catch (err) {
      console.error("❌ Fetch officers error:", err);
    } finally {
      setLoadingOfficers(false);
    }
  }, []);

  // Fetch Penalty Types
  const fetchPenaltyTypes = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) return;
    setLoadingPenalties(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/penalty-types/list?flag=0`,
        getAxiosConfig()
      );
      let data = res.data?.response?.content || res.data?.response || res.data?.data || res.data || [];
      const mapped = data.map((item) => ({
        id: item.id,
        value: item.name || item.penaltyType,
        label: item.name || item.penaltyType
      }));
      setPenaltyTypesList(mapped);
    } catch (err) {
      console.error("❌ Fetch penalty types error:", err);
    } finally {
      setLoadingPenalties(false);
    }
  }, []);

  // Fetch Disciplinary Records
  const fetchDisciplinaryRecords = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/disciplinary?page=${page}&size=${rowsPerPage}`,
        getAxiosConfig()
      );

      console.log("📥 Disciplinary Records Response:", res.data);

      let recordsData = [];
      let totalPagesData = 0;
      let totalElementsData = 0;

      if (res.data?.response?.content) {
        recordsData = res.data.response.content;
        totalPagesData = res.data.response.totalPages || 0;
        totalElementsData = res.data.response.totalElements || 0;
      } else if (res.data?.content) {
        recordsData = res.data.content;
        totalPagesData = res.data.totalPages || 0;
        totalElementsData = res.data.totalElements || 0;
      } else if (Array.isArray(res.data)) {
        recordsData = res.data;
        totalPagesData = Math.ceil(recordsData.length / rowsPerPage);
        totalElementsData = recordsData.length;
      }

      const mappedRecords = recordsData.map((item) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeName: item.employee || item.employeeName || 'Unknown',
        employeeCode: item.employeeCode || '',
        department: item.department || '',
        designation: item.designation || '',
        caseNumber: item.caseNumber || '',
        incidentDate: item.incidentDate || '',
        actionType: item.actionType?.name || item.actionType || '',
        investigationOfficer: item.investigationOfficerName || item.investigationOfficer || '',
        investigationOfficerDesignation: item.investigationOfficerDesignation || '',
        penalty: item.penaltyType?.name || item.penalty || '',
        resolutionDate: item.resolutionDate || '',
        status: item.isActive ? 'Active' : 'Inactive',
        createdAt: item.createdAt || new Date().toISOString(),
        supportingDocumentsName: item.supportingDocumentsName || null,
        supportingDocumentsData: item.supportingDocumentsData || null
      }));

      console.log("✅ Mapped Records:", mappedRecords);
      setDisciplinaries(mappedRecords);
      setTotalPages(totalPagesData);
      setTotalElements(totalElementsData);

    } catch (err) {
      console.error("❌ Fetch disciplinary records error:", err);
      toast.error('Error', 'Failed to load disciplinary records');
      setDisciplinaries([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  // Load all data on mount
  useEffect(() => {
    fetchEmployees();
    fetchActionTypes();
    fetchInvestigationOfficers();
    fetchPenaltyTypes();
    fetchDisciplinaryRecords();
  }, [fetchEmployees, fetchActionTypes, fetchInvestigationOfficers, fetchPenaltyTypes, page]); 

  // Filter employees for dropdown
  const filteredEmployees = employeesList.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return (emp.name?.toLowerCase() || '').includes(search) || 
           (emp.code?.toLowerCase() || '').includes(search);
  });

  const filteredRecords = disciplinaries.filter(rec => {
    const search = searchTerm.toLowerCase();
    return (rec.caseNumber?.toLowerCase() || '').includes(search) ||
           (rec.actionType?.toLowerCase() || '').includes(search) ||
           (rec.employeeName?.toLowerCase() || '').includes(search) ||
           (rec.investigationOfficer?.toLowerCase() || '').includes(search) ||
           (rec.penalty?.toLowerCase() || '').includes(search);
  });

  // Pagination 
  const totalItems = filteredRecords.length;
  const totalPagesCount = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPagesCount - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPagesCount - 1) {
      if (right < totalPagesCount - 2) range.push('...');
      range.push(totalPagesCount - 1);
    }
    return range;
  };

  useEffect(() => {
    setExistingCaseNumbers(disciplinaries.map(rec => rec.caseNumber));
  }, [disciplinaries]);

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
          supportingDocuments: file,
          supportingDocumentsData: reader.result,
          supportingDocumentsName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateField = (field, value) => {
    let error = '';
    
    if (field === 'caseNumber') {
      if (!value) error = 'Case Number is required';
      else if (existingCaseNumbers.includes(value) && (!editingRecord || editingRecord.caseNumber !== value)) {
        error = 'This Case Number already exists';
      }
    }
    else if (field === 'incidentDate' && !value) error = 'Incident Date is required';
    else if (field === 'actionType' && !value) error = 'Action Type is required';
    else if (field === 'investigationOfficer' && !value) error = 'Investigation Officer is required';
    else if (field === 'penalty' && !value) error = 'Penalty is required';
    else if (field === 'employeeId' && !value) error = 'Employee is required';
    
    if (field === 'resolutionDate' && value && formData.incidentDate) {
      if (new Date(value) < new Date(formData.incidentDate)) {
        error = 'Resolution Date must be on or after Incident Date';
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
    const newErrors = {};
    
    if (!formData.caseNumber) {
      newErrors.caseNumber = 'Case Number is required';
    } else if (existingCaseNumbers.includes(formData.caseNumber) && 
        (!editingRecord || editingRecord.caseNumber !== formData.caseNumber)) {
      newErrors.caseNumber = 'Case Number already exists';
    }
    
    if (!formData.incidentDate) newErrors.incidentDate = 'Incident Date is required';
    if (!formData.actionType) newErrors.actionType = 'Action Type is required';
    if (!formData.investigationOfficer) newErrors.investigationOfficer = 'Investigation Officer is required';
    if (!formData.penalty) newErrors.penalty = 'Penalty is required';
    if (!formData.employeeId) newErrors.employeeId = 'Employee is required';
    
    if (formData.resolutionDate && formData.incidentDate) {
      if (new Date(formData.resolutionDate) < new Date(formData.incidentDate)) {
        newErrors.resolutionDate = 'Resolution Date must be on or after Incident Date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmployeeSelect = (employee) => {
  console.log("👤 SELECTED EMPLOYEE:", employee);

  setSelectedEmployee(employee);

  setFormData(prev => ({
    ...prev,

    employeeId: employee.id || '',
    employeeName: employee.name || '',

    // Auto populated fields
    employeeCode: employee.code || '',
    department: employee.department || '',
    designation: employee.designation || ''
  }));

  setEmployeeSearchTerm(employee.name || '');
  setShowEmployeeDropdown(false);

  // Clear employee validation error
  setErrors(prev => ({
    ...prev,
    employeeId: ''
  }));

  setTouched(prev => ({
    ...prev,
    employeeId: true
  }));
};
  // Handle row click for detail view
  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;
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
      const empData = selectedEmployee || null;
      const employeeId = empData?.id || Number(formData.employeeId) || 0;

      // ✅ Get IDs from names
      const actionTypeId = getActionTypeIdByName(formData.actionType);
      const officerId = getOfficerIdByName(formData.investigationOfficer);
      const penaltyId = getPenaltyIdByName(formData.penalty);

      if (editingRecord) {
        // ✅ UPDATE PAYLOAD
        const updatePayload = {
          employeeId: employeeId,
          caseNumber: formData.caseNumber,
          incidentDate: formData.incidentDate,
          actionTypeId: actionTypeId,
          investigationOfficerId: officerId,
          penaltyTypeId: penaltyId,
          resolutionDate: formData.resolutionDate || null,
          remarks: formData.remarks || ''
        };
        console.log("📤 UPDATE payload:", updatePayload);
        res = await axios.put(
          `${BASE_URL}/api/disciplinary/${editingRecord.id}/update`,
          updatePayload,
          getAxiosConfig()
        );
      } else {
        // ✅ CREATE PAYLOAD
        const createPayload = {
          employeeId: employeeId,
          caseNumber: formData.caseNumber,
          incidentDate: formData.incidentDate,
          actionTypeId: actionTypeId,
          investigationOfficerId: officerId,
          penaltyTypeId: penaltyId,
          resolutionDate: formData.resolutionDate || null,
          remarks: formData.remarks || ''
        };
        console.log("📤 CREATE payload:", createPayload);
        res = await axios.post(
          `${BASE_URL}/api/disciplinary/create`,
          createPayload,
          getAxiosConfig()
        );
      }

      if (res.status === 200 || res.status === 201) {
        toast.success('Success', editingRecord ? 'Disciplinary record updated successfully' : 'Disciplinary record created successfully');
        resetForm();
        setShowForm(false);
        setPage(0);
        await fetchDisciplinaryRecords();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Submit error:', err);
      console.error('Backend message:', err.response?.data);
      toast.error('Error', err.response?.data?.message || 'Failed to save disciplinary record');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ STATUS API
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
        `${BASE_URL}/api/disciplinary/${id}/status?active=${isActive}`,
        null,
        getAxiosConfig()
      );
      
      if (res.status === 200) {
        toast.success('Status Updated', `${name} is now ${newStatus}`);
        await fetchDisciplinaryRecords();
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

  // ✅ Updated handleEdit - stores ALL employee details in formData (like PromotionHistory)
  const handleEdit = (record) => {
    if (record.status === 'Inactive') {
      toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
      return;
    }
    
    console.log("✏️ Editing Record:", record);
    
    // ✅ Find the employee from the employeesList
    const emp = employeesList.find(e => e.id === record.employeeId);
    
    // ✅ Set selected employee with all details
    setSelectedEmployee(emp || {
      id: record.employeeId,
      name: record.employee || record.employeeName || '',
      code: record.employeeCode || '',
      department: record.department || '',
      designation: record.designation || ''
    });
    
    setEditingRecord(record);
    
    // ✅ Set ALL form data including employee details (like PromotionHistory)
    setFormData({
      caseNumber: record.caseNumber || '',
      incidentDate: record.incidentDate || '',
      actionType: record.actionType?.name || record.actionType || '',
      investigationOfficer: record.investigationOfficerName || record.investigationOfficer || '',
      penalty: record.penaltyType?.name || record.penalty || '',
      resolutionDate: record.resolutionDate || '',
      supportingDocuments: null,
      supportingDocumentsData: record.supportingDocumentsData || null,
      supportingDocumentsName: record.supportingDocumentsName || null,
      employeeId: record.employeeId || '',
      employeeName: record.employee || record.employeeName || '',
      employeeCode: record.employeeCode || '',      // ✅ Set from record
      department: record.department || '',          // ✅ Set from record
      designation: record.designation || ''         // ✅ Set from record
    });
    
    // ✅ Set the employee search term to show the name
    setEmployeeSearchTerm(emp?.name || record.employee || record.employeeName || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      caseNumber: '',
      incidentDate: '',
      actionType: '',
      investigationOfficer: '',
      penalty: '',
      resolutionDate: '',
      supportingDocuments: null,
      supportingDocumentsData: null,
      supportingDocumentsName: null,
      employeeId: '',
      employeeName: '',
      employeeCode: '',     // ✅ Add this
      department: '',       // ✅ Add this
      designation: ''       // ✅ Add this
    });
    setErrors({});
    setTouched({});
    setEditingRecord(null);
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
    setSelectedRecord(null);
    setShowDocumentActions(false);
  };

  const handleDelete = (id) => {
    setDisciplinaries(disciplinaries.filter(rec => rec.id !== id));
    toast.success('Success', 'Disciplinary record deleted successfully');
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

  const getActionTypeColor = (actionType) => {
    switch(actionType) {
      case 'Warning': return { bg: '#fef3c7', color: '#92400e' };
      case 'Show Cause': return { bg: '#e0e7ff', color: '#4f46e5' };
      case 'Suspension': return { bg: '#ffedd5', color: '#9a3412' };
      case 'Fine': return { bg: '#fce7f3', color: '#9d174d' };
      case 'Demotion': return { bg: '#fee2e2', color: '#991b1b' };
      case 'Termination': return { bg: '#dc2626', color: '#ffffff' };
      case 'Legal Notice': return { bg: '#e5e7eb', color: '#374151' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };
  
  // ✅ Generate Disciplinary Document (PDF)
const handleGenerateDocument = async (recordId) => {
  if (!ensureToken()) return null;
  
  try {
    toast.info('Generating', 'Generating disciplinary document...');
    
    const res = await axios.post(
      `${BASE_URL}/api/disciplinary/${recordId}/document`,
      null,  // No body needed
      {
        ...getAxiosConfig(),
        responseType: 'blob'  // ✅ For file download
      }
    );
    
    // Create file from blob response
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(blob);
    const fileName = `disciplinary_${recordId}_${Date.now()}.pdf`;
    
    toast.success('Success', 'Document generated successfully');
    
    return {
      data: fileURL,
      name: fileName,
      blob: blob
    };
    
  } catch (error) {
    console.error('Generate document error:', error);
    toast.error('Error', error.response?.data?.message || 'Failed to generate document');
    throw error;
  }
};

// ✅ Generate Letter (called from DocumentActions)
const handleGenerateLetter = async (record) => {
  if (!record || !record.id) {
    toast.error('Error', 'Invalid disciplinary record');
    return;
  }
  
  try {
    const result = await handleGenerateDocument(record.id);
    
    if (result) {
      // Update record with new document info
      const updatedRecords = disciplinaries.map(r =>
        r.id === record.id
          ? { ...r, supportingDocumentsName: result.name, supportingDocumentsData: result.data }
          : r
      );
      setDisciplinaries(updatedRecords);
      
      // Show preview
      setDocumentPreview({
        data: result.data,
        name: result.name
      });
      
      // Also update the selected record if it's the same
      if (selectedRecord && selectedRecord.id === record.id) {
        setSelectedRecord({
          ...selectedRecord,
          supportingDocumentsName: result.name,
          supportingDocumentsData: result.data
        });
      }
    }
  } catch (error) {
    console.error('Generate letter error:', error);
  }
};

// ✅ View Document (updated to fetch from API if needed)
const handleViewDocument = async (e, record) => {
  e.stopPropagation();
  
  if (!record || !record.id) {
    toast.error('Error', 'Invalid disciplinary record');
    return;
  }
  
  setSelectedRecord(record);
  setShowDocumentActions(true);
  
  // ✅ Check if document exists in the record data
  if (record.supportingDocumentsData) {
    setDocumentPreview({
      data: record.supportingDocumentsData,
      name: record.supportingDocumentsName || 'document.pdf'
    });
    return;
  }
  
  // ✅ Try to fetch document from API
  try {
    toast.info('Loading', 'Fetching document...');
    
    const res = await axios.get(
      `${BASE_URL}/api/disciplinary/${record.id}/document`,
      {
        ...getAxiosConfig(),
        responseType: 'blob'
      }
    );
    
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(blob);
    const fileName = `disciplinary_${record.caseNumber || record.id}.pdf`;
    
    setDocumentPreview({
      data: fileURL,
      name: fileName
    });
    
    // Update record with document data
    const updatedRecords = disciplinaries.map(r =>
      r.id === record.id
        ? { ...r, supportingDocumentsName: fileName, supportingDocumentsData: fileURL }
        : r
    );
    setDisciplinaries(updatedRecords);
    
    toast.success('Success', 'Document loaded successfully');
    
  } catch (error) {
    console.error('View document error:', error);
    
    if (error.response?.status === 404) {
      toast.info('No Document', 'No document has been uploaded for this disciplinary record');
    } else {
      toast.error('Error', error.response?.data?.message || 'Failed to load document');
    }
  }
};

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Disciplinary Action Records</h1>
          <p className="cert-subtitle">Manage employee disciplinary records and conduct history</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedRecord && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Disciplinary Record
            </button>
          )}
          {(showForm || selectedRecord || showDocumentActions) && (
            <button 
              type="button" 
              className="cert-back-btn" 
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedRecord && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="cert-form-wrap mb-4">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Disciplinary Details</div>
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
                          {loadingEmployees ? (
                            <div className="text-center py-3"><small>Loading employees...</small></div>
                          ) : filteredEmployees.length > 0 ? (
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
                
                {/* Employee Code - Auto Populate - using formData first (like PromotionHistory) */}
                <div className="cert-field-compact">
                  <label>Employee Code</label>
                 <input
  type="text"
  className="form-control bg-light"
  value={formData.employeeCode || selectedEmployee?.code || ''}
  readOnly
  placeholder="Auto-populated"
/>
                </div>

                {/* Department - Auto Populate - using formData first (like PromotionHistory) */}
                <div className="cert-field-compact">
                  <label>Department</label>
                 <input
  type="text"
  className="form-control bg-light"
  value={formData.department || selectedEmployee?.department || ''}
  readOnly
  placeholder="Auto-populated"
/>
                </div>

                {/* Designation - Auto Populate - using formData first (like PromotionHistory) */}
                <div className="cert-field-compact">
                  <label>Designation</label>
                  <input
  type="text"
  className="form-control bg-light"
  value={formData.designation || selectedEmployee?.designation || ''}
  readOnly
  placeholder="Auto-populated"
/>
                </div>

                {/* Case Number */}
                <div className={`cert-field-compact ${touched.caseNumber && errors.caseNumber ? 'has-error' : ''}`}>
                  <label className="required">Case Number</label>
                  <input type="text" placeholder="e.g., DISC/2024/001" value={formData.caseNumber} onChange={(e) => handleChange('caseNumber', e.target.value)} onBlur={() => handleBlur('caseNumber')} />
                  <FieldError msg={errors.caseNumber} />
                  <small>Unique case number</small>
                </div>
                
                {/* Incident Date */}
                <div className={`cert-field-compact ${touched.incidentDate && errors.incidentDate ? 'has-error' : ''}`}>
                  <label className="required">Incident Date</label>
                  <input type="date" value={formData.incidentDate} onChange={(e) => handleChange('incidentDate', e.target.value)} onBlur={() => handleBlur('incidentDate')} />
                  <FieldError msg={errors.incidentDate} />
                </div>
                
                {/* Action Type */}
                <div className={`cert-field-compact ${touched.actionType && errors.actionType ? 'has-error' : ''}`}>
                  <label className="required">Action Type</label>
                  <select 
                    value={formData.actionType} 
                    onChange={(e) => handleChange('actionType', e.target.value)} 
                    onBlur={() => handleBlur('actionType')}
                    disabled={loadingActionTypes}
                  >
                    <option value="">Select Action Type</option>
                    {actionTypesList.map((type) => (
                      <option key={type.id} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {loadingActionTypes && <small>Loading...</small>}
                  <FieldError msg={errors.actionType} />
                </div>
                
                {/* Investigation Officer */}
                <div className={`cert-field-compact ${touched.investigationOfficer && errors.investigationOfficer ? 'has-error' : ''}`}>
                  <label className="required">Investigation Officer</label>
                  <select 
                    value={formData.investigationOfficer} 
                    onChange={(e) => handleChange('investigationOfficer', e.target.value)} 
                    onBlur={() => handleBlur('investigationOfficer')}
                    disabled={loadingOfficers}
                  >
                    <option value="">Select Officer</option>
                    {investigationOfficersList.map((officer) => (
                      <option key={officer.id} value={officer.value}>
                        {officer.label}
                      </option>
                    ))}
                  </select>
                  {loadingOfficers && <small>Loading...</small>}
                  <FieldError msg={errors.investigationOfficer} />
                </div>
                
                {/* Penalty */}
                <div className={`cert-field-compact ${touched.penalty && errors.penalty ? 'has-error' : ''}`}>
                  <label className="required">Penalty</label>
                  <select 
                    value={formData.penalty} 
                    onChange={(e) => handleChange('penalty', e.target.value)} 
                    onBlur={() => handleBlur('penalty')}
                    disabled={loadingPenalties}
                  >
                    <option value="">Select Penalty</option>
                    {penaltyTypesList.map((penalty) => (
                      <option key={penalty.id} value={penalty.value}>
                        {penalty.label}
                      </option>
                    ))}
                  </select>
                  {loadingPenalties && <small>Loading...</small>}
                  <FieldError msg={errors.penalty} />
                </div>
                
                {/* Resolution Date */}
                <div className={`cert-field-compact ${touched.resolutionDate && errors.resolutionDate ? 'has-error' : ''}`}>
                  <label>Resolution Date</label>
                  <input type="date" value={formData.resolutionDate} min={formData.incidentDate} onChange={(e) => handleChange('resolutionDate', e.target.value)} onBlur={() => handleBlur('resolutionDate')} />
                  <FieldError msg={errors.resolutionDate} />
                </div>
              </div>
            </div>
            
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {submitting ? 'Saving...' : (editingRecord ? 'Update Record' : 'Save Record')}
              </button>
            </div>
          </form>
        </div>
      ) : showDocumentActions && selectedRecord ? (
        <DocumentActions 
          title="Record Letter"
          documentName={selectedRecord.supportingDocumentsName}
          documentData={selectedRecord.supportingDocumentsData}
          onGenerate={() => handleGenerateLetter(selectedRecord)}
          onBack={handleBackToList}
          generateLabel="Generate Letter"
          themeColor="#9d174d"
        />
      ) : selectedRecord ? (
        // Detail View
        <div style={{background:'white',borderRadius:'16px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{background:'linear-gradient(135deg,#9d174d,#be185d)',padding:'28px 32px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                <FaGavel size={20}/>
                <h2 style={{fontSize:'22px',fontWeight:700,margin:0}}>{selectedRecord.caseNumber}</h2>
              </div>
              <div style={{display:'flex',gap:'16px',alignItems:'center',fontSize:'13px',opacity:0.9}}>
                <span><FaCalendarAlt/> {formatDate(selectedRecord.createdAt)}</span>
                <span style={{background:'rgba(255,255,255,0.2)',padding:'3px 12px',borderRadius:'20px',fontSize:'12px'}}>{selectedRecord.actionType}</span>
              </div>
            </div>
          </div>
          <div style={{padding:'32px'}}>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',marginBottom:'24px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:'16px'}}>
              <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'linear-gradient(135deg,#9d174d,#be185d)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'20px',fontWeight:700}}>
                {selectedRecord.employeeName?.charAt(0) || '?'}
              </div>
              <div>
                <h3 style={{fontSize:'16px',fontWeight:600,color:'#1e293b',margin:'0 0 2px 0'}}>
                  {selectedRecord.employeeName || 'Unknown'}
                </h3>
                <span style={{fontSize:'13px',color:'#64748b'}}>{selectedRecord.employeeCode || ''}</span>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px',marginBottom:'28px'}}>
              <div style={{background:'#fff1f2',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <FaCalendarAlt size={16} style={{color:'#dc2626'}}/>
                  <span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Incident Date</span>
                </div>
                <p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{formatDate(selectedRecord.incidentDate)}</p>
              </div>
              <div style={{background:'#fdf2f8',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <FaGavel size={16} style={{color:'#9d174d'}}/>
                  <span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Action Type</span>
                </div>
                <span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:getActionTypeColor(selectedRecord.actionType).bg,color:getActionTypeColor(selectedRecord.actionType).color}}>
                  {selectedRecord.actionType}
                </span>
              </div>
              <div style={{background:'#eef2ff',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <FaUserShield size={16} style={{color:'#4f46e5'}}/>
                  <span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Investigation Officer</span>
                </div>
                <p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedRecord.investigationOfficer}</p>
              </div>
              <div style={{background:'#fffbeb',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <FaExclamationTriangle size={16} style={{color:'#f59e0b'}}/>
                  <span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Penalty</span>
                </div>
                <p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>{selectedRecord.penalty}</p>
              </div>
              <div style={{background:'#ecfdf5',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <FaCheckCircle size={16} style={{color:'#059669'}}/>
                  <span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Resolution Date</span>
                </div>
                <p style={{fontSize:'15px',fontWeight:600,color:'#1e293b',margin:0}}>
                  {selectedRecord.resolutionDate ? formatDate(selectedRecord.resolutionDate) : 'Pending'}
                </p>
              </div>
              <div style={{background:'#fff7ed',borderRadius:'10px',padding:'16px 18px',border:'1px solid #e2e8f0'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <FaClock size={16} style={{color:'#ea580c'}}/>
                  <span style={{fontSize:'12px',color:'#64748b',fontWeight:500,textTransform:'uppercase'}}>Status</span>
                </div>
                <span style={{display:'inline-block',padding:'4px 12px',borderRadius:'6px',fontSize:'13px',fontWeight:600,background:selectedRecord.status==='Active'?'#d1fae5':'#fee2e2',color:selectedRecord.status==='Active'?'#065f46':'#991b1b'}}>
                  {selectedRecord.status || 'Active'}
                </span>
              </div>
            </div>
            <div style={{background:'#fff7ed',borderRadius:'12px',padding:'20px',marginBottom:'24px',border:'1px solid #fed7aa'}}>
              <label style={{fontSize:'14px',fontWeight:600,color:'#9a3412',display:'block',marginBottom:'12px'}}>
                <FaExclamationTriangle style={{marginRight:'8px'}}/> Case Summary
              </label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <div>
                  <span style={{fontSize:'12px',color:'#6b7280'}}>Action Taken:</span>
                  <p style={{fontWeight:600,color:'#9d174d',margin:'4px 0 0 0'}}>{selectedRecord.actionType}</p>
                </div>
                <div>
                  <span style={{fontSize:'12px',color:'#6b7280'}}>Penalty Imposed:</span>
                  <p style={{fontWeight:600,color:'#dc2626',margin:'4px 0 0 0'}}>{selectedRecord.penalty}</p>
                </div>
              </div>
            </div>
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'20px 24px',border:'1px solid #e2e8f0'}}>
              <h4 style={{fontSize:'15px',fontWeight:600,color:'#1e293b',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
                <FaFilePdf size={16} style={{color:'#dc2626'}}/> Supporting Documents
              </h4>
              {selectedRecord.supportingDocumentsName ? (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background:'white',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'10px',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {selectedRecord.supportingDocumentsName.endsWith('.pdf')?<FaFilePdf size={20} style={{color:'#dc2626'}}/>:<FaFileImage size={20} style={{color:'#3b82f6'}}/>}
                    </div>
                    <div>
                      <p style={{fontWeight:500,color:'#1e293b',margin:'0 0 2px 0',fontSize:'14px'}}>{selectedRecord.supportingDocumentsName}</p>
                      <span style={{fontSize:'12px',color:'#94a3b8'}}>Uploaded document</span>
                    </div>
                  </div>
                  <button onClick={(e)=>handleViewDocument(e,selectedRecord)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 20px',background:'#9d174d',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:500}}>
                    <FaEye size={14}/> View Document
                  </button>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'32px',color:'#94a3b8'}}>
                  <FaFileAlt size={36} style={{marginBottom:'12px',opacity:0.3}}/>
                  <p style={{fontWeight:500,margin:'0 0 4px 0',color:'#64748b'}}>No document uploaded</p>
                  <span style={{fontSize:'13px'}}>No supporting documents have been uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Table View
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by case number, employee name or action type..."
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
                    <th>Case No.</th>                   
                    <th>Incident Date</th>
                    <th>Action Type</th>
                    <th>Investigation Officer</th>
                    <th>Penalty</th>
                    <th>Resolution Date</th>
                    <th>Status</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentRecords.length > 0 ? (
                    currentRecords.map((record, idx) => (
                      <tr 
                        key={record.id}
                        onClick={() => handleRowClick(record)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>{record.employeeName || 'Unknown'}</td>
                        <td><strong>{record.caseNumber}</strong></td>
                        <td>{formatDate(record.incidentDate)}</td>
                        <td>{record.actionType}</td>
                        <td>{record.investigationOfficer}</td>
                        <td>{record.penalty}</td>
                        <td>{record.resolutionDate ? formatDate(record.resolutionDate) : '—'}</td>
                        <td>
                          <div
                            className="d-flex align-items-center gap-1"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusToggle(
                                record.id,
                                record.employeeName || "",
                                record.status || "Active"
                              );
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "16px",
                                borderRadius: "50px",
                                backgroundColor:
                                  (record.status || "Active") === "Active"
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
                                    (record.status || "Active") === "Active"
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
                                  (record.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#94a3b8"
                              }}
                            >
                              {record.status || "Active"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="cert-act cert-act--edit" 
                              onClick={() => handleEdit(record)} 
                              title={record.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={record.status === 'Inactive'}
                              style={{ 
                                opacity: record.status === 'Inactive' ? 0.5 : 1,
                                cursor: record.status === 'Inactive' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <FaEdit size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="10" className="text-center py-5">No disciplinary records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cert-table-footer">
              <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} records
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

      {/* Document Preview Modal */}
      {documentPreview && (
        <div className="emp-modal-overlay" onClick={() => setDocumentPreview(null)} style={{ zIndex: 1050 }}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                <FaFileAlt style={{ marginRight: '8px' }} /> Document Preview
              </h3>
              <button onClick={() => setDocumentPreview(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>
                <FaTimes />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              {documentPreview.data && documentPreview.name && documentPreview.name.endsWith('.pdf') ? (
                <div style={{ width: '100%', height: '70vh', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe src={documentPreview.data} width="100%" height="100%" title="PDF Preview" style={{ border: 'none' }} />
                </div>
              ) : documentPreview.data ? (
                <div style={{ textAlign: 'center' }}>
                  <img src={documentPreview.data} alt="Document Preview" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <p>No preview available</p>
                </div>
              )}
              <div style={{ marginTop: '20px', padding: '12px 16px', background: '#f9fafb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#111827' }}>{documentPreview.name}</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Uploaded document</p>
                </div>
                <a href={documentPreview.data} download={documentPreview.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}>
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

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default DisciplinaryRecords;