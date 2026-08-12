
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaSave, FaTimes, FaExchangeAlt, FaBuilding, FaCalendarAlt, FaUpload, 
  FaFilePdf, FaFileImage, FaTrash, FaEdit, FaPlus, FaMapMarkerAlt, 
  FaBriefcase, FaFileAlt, FaSearch, FaArrowRight, FaArrowLeft, FaEye, FaClock
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';
import axios from "axios";
import { BASE_URL, STORAGE_KEYS } from "../config/api.config";

const TransferHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  // ========== STATE VARIABLES ==========
  const [transfers, setTransfers] = useState(initialData?.transfers || []);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [transferTypesList, setTransferTypesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loadingTransferTypes, setLoadingTransferTypes] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [employeesList, setEmployeesList] = useState([]);
  const [formData, setFormData] = useState({
    transferOrderNo: '',
    transferDate: '',
    transferType: '',
    fromDepartment: '',
    toDepartment: '',
    fromBranch: '',
    toBranch: '',
    effectiveDate: '',
    transferReason: '',
    transferOrderFile: null,
    transferOrderFileData: null,
    transferOrderFileName: null,
    employeeId: '',
    employeeCode: '',
    employeeDesignation: '',
    fromDepartmentId: '',
    fromBranchId: ''
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

  // ========== AUTH FUNCTIONS ==========
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

  // ========== HELPER FUNCTIONS ==========
  const getTransferTypeIdByName = (name) => {
    if (!name) return null;
    const found = transferTypesList.find(t => 
      t.name?.toLowerCase() === name?.toLowerCase() || 
      t.value?.toLowerCase() === name?.toLowerCase() ||
      t.label?.toLowerCase() === name?.toLowerCase()
    );
    return found?.id || null;
  };

  const getDepartmentIdByName = (name) => {
    if (!name) return null;
    const found = departmentsList.find(d => 
      d.name?.toLowerCase() === name?.toLowerCase()
    );
    return found?.id || null;
  };

  const getBranchIdByName = (name) => {
    if (!name) return null;
    const found = branchesList.find(b => 
      b.name?.toLowerCase() === name?.toLowerCase()
    );
    return found?.id || null;
  };

  // ========== FETCH TRANSFERS ==========
  const fetchTransfers = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) {
      console.warn("No token found");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/transfers?page=${page}&size=${rowsPerPage}`,
        getAxiosConfig()
      );

      let transfersData = [];
      let totalPagesData = 0;
      let totalElementsData = 0;

      if (res.data?.response?.content) {
        transfersData = res.data.response.content;
        totalPagesData = res.data.response.totalPages || 0;
        totalElementsData = res.data.response.totalElements || 0;
      } else if (res.data?.content) {
        transfersData = res.data.content;
        totalPagesData = res.data.totalPages || 0;
        totalElementsData = res.data.totalElements || 0;
      } else if (Array.isArray(res.data)) {
        transfersData = res.data;
        totalPagesData = Math.ceil(transfersData.length / rowsPerPage);
        totalElementsData = transfersData.length;
      } else if (res.data?.response && Array.isArray(res.data.response)) {
        transfersData = res.data.response;
        totalPagesData = Math.ceil(transfersData.length / rowsPerPage);
        totalElementsData = transfersData.length;
      }

      const mappedTransfers = transfersData.map((item) => ({
        id: item.id,
        employeeId: item.employeeId,
        employeeName: item.employee || item.employeeName || '',
        employeeCode: item.employeeCode || '',
        transferOrderNo: item.transferOrderNumber || '',
        transferDate: item.transferDate,
        transferType: item.transferType?.name || item.transferType || '',
        fromDepartment: item.fromDepartment || '',
        toDepartment: item.toDepartment || '',
        fromBranch: item.fromBranch || '',
        toBranch: item.toBranch || '',
        effectiveDate: item.effectiveDate,
        transferReason: item.transferReason || '',
        status: item.isActive ? 'Active' : 'Inactive',
        createdAt: item.createdAt,
        transferOrderFileName: item.documentName || item.transferOrderFileName || '',
        transferOrderFileData: item.transferOrderFileData || '',
        designation: item.designation || '',
        fromDepartmentId: item.fromDepartmentId || '',
        fromBranchId: item.fromBranchId || ''
      }));

      console.log("✅ Mapped Transfers:", mappedTransfers);
      setTransfers(mappedTransfers);
      setTotalPages(totalPagesData);
      setTotalElements(totalElementsData);

    } catch (err) {
      console.error("❌ Fetch transfers error:", err);
      toast.error('Error', 'Failed to load transfer records');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  // ========== FETCH TRANSFER TYPES ==========
  const fetchTransferTypes = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) return;

    setLoadingTransferTypes(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/transfer-types/list?flag=0`,
        getAxiosConfig()
      );

      let data = [];
      if (res.data?.response && Array.isArray(res.data.response)) {
        data = res.data.response;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }

      const mapped = data.map((item) => ({
        id: item.id,
        value: item.name,
        label: item.name,
        name: item.name,
        isActive: item.isActive
      }));

      setTransferTypesList(mapped);
    } catch (err) {
      console.error("❌ Fetch transfer types error:", err);
      setTransferTypesList([]);
    } finally {
      setLoadingTransferTypes(false);
    }
  }, []);

  // ========== FETCH BRANCHES ==========
  const fetchBranches = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) return;

    setLoadingBranches(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/branches/list?flag=0`,
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
        code: item.code || item.branchCode || '',
      }));

      setBranchesList(mapped);
    } catch (err) {
      console.error("❌ Fetch branches error:", err);
      setBranchesList([]);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  // ========== FETCH DEPARTMENTS ==========
  const fetchDepartments = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) return;

    setLoadingDepartments(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/departments/list?flag=0`,
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
        code: item.code || ''
      }));

      setDepartmentsList(mapped);
    } catch (err) {
      console.error("❌ Fetch departments error:", err);
      setDepartmentsList([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  // ========== FETCH EMPLOYEES ==========
 
const fetchEmployees = useCallback(async () => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  if (!token) return;

  try {
    const res = await axios.get(
      `${BASE_URL}/api/employees?page=0&size=1000`,
      getAxiosConfig()
    );

    let employeesData = [];
    if (res.data?.response?.content) {
      employeesData = res.data.response.content;
    } else if (res.data?.content) {
      employeesData = res.data.content;
    } else if (Array.isArray(res.data)) {
      employeesData = res.data;
    }

    const mapped = employeesData.map((item) => ({
      id: item.id,
      name: item.name || item.employeeName || '',
      code: item.employeeCode || item.code || `EMP${String(item.id).padStart(4, '0')}`,
      department: item.departmentName || item.department || '',
      departmentId: item.departmentId || item.department_id || 0,  
      designation: item.designation || item.empDesignation || '',
      branch: item.branchName || item.branch || '',
      branchId: item.branchId || item.branch_id || 0  
    }));

    console.log("✅ Mapped Employees:", mapped);
    setEmployeesList(mapped);
  } catch (err) {
    console.error("❌ Fetch employees error:", err);
    setEmployeesList([]);
  }
}, []);

  // ========== LOAD DATA ON MOUNT ==========
  useEffect(() => {
    fetchTransferTypes();
    fetchBranches();
    fetchDepartments();
    fetchTransfers();
    fetchEmployees();
  }, []);

  useEffect(() => {
  fetchTransfers();
}, [page]
);
  // ========== UPDATE EXISTING ORDER NUMBERS ==========
  useEffect(() => {
    setExistingOrderNos(transfers.map(transfer => transfer.transferOrderNo));
  }, [transfers]);

  // ========== FILTERS ==========
  const filteredTransfers = transfers.filter(transfer => {
    const search = searchTerm.toLowerCase();
    return (transfer.transferOrderNo?.toLowerCase() || '').includes(search) ||
        (transfer.employeeName?.toLowerCase() || '').includes(search) ||  
      (transfer.fromDepartment?.toLowerCase() || '').includes(search) ||
      (transfer.toDepartment?.toLowerCase() || '').includes(search) ||
      (transfer.fromBranch?.toLowerCase() || '').includes(search) ||
      (transfer.toBranch?.toLowerCase() || '').includes(search) ||
      (transfer.transferReason?.toLowerCase() || '').includes(search) ||
      (transfer.employeeName?.toLowerCase() || '').includes(search);
  });

  const totalItems = filteredTransfers.length;
const totalPagesCount = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = page * rowsPerPage;
  const currentTransfers = filteredTransfers.slice(startIndex, startIndex + rowsPerPage);

  const filteredEmployees = employeesList.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return (emp.name?.toLowerCase() || '').includes(search) || 
           (emp.code?.toLowerCase() || '').includes(search);
  });

  // ========== PAGINATION ==========
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

  // ========== FORMAT DATE ==========
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ========== HANDLE EMPLOYEE SELECT ==========
  
const handleEmployeeSelect = (employee) => {
  console.log("👤 Selected Employee:", employee);
  
  const empCode = employee.code || employee.employeeCode || '';
  const empDesignation = employee.designation || '';
  const empDepartment = employee.department || '';
  const empDepartmentId = employee.departmentId || 0;
  const empBranch = employee.branch || '';
  const empBranchId = employee.branchId || 0;
  
  console.log("📌 Department ID:", empDepartmentId);
  console.log("📌 Branch ID:", empBranchId);
  
  setSelectedEmployee({
    ...employee,
    code: empCode,
    designation: empDesignation,
    department: empDepartment,
    departmentId: empDepartmentId,
    branch: empBranch,
    branchId: empBranchId
  });
  
  setEmployeeSearchTerm(employee.name);
  setShowEmployeeDropdown(false);

  setFormData(prev => ({
    ...prev,
    employeeId: employee.id,
    employeeCode: empCode,
    employeeDesignation: empDesignation,
    fromBranch: empBranch,
    fromBranchId: empBranchId,
    fromDepartment: empDepartment,
    fromDepartmentId: empDepartmentId
  }));
};
  // ========== HANDLE CHANGE ==========
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  // ========== HANDLE FILE CHANGE ==========
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
          transferOrderFile: file,
          transferOrderFileData: reader.result,
          transferOrderFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // ========== VALIDATION ==========
  const validateField = (field, value) => {
    let error = '';

    if (field === 'transferOrderNo') {
      if (!value) error = 'Transfer Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingTransfer || editingTransfer.transferOrderNo !== value)) {
        error = 'This Order Number already exists';
      }
    } else if (field === 'transferDate' && !value) error = 'Transfer Date is required';
    else if (field === 'transferType' && !value) error = 'Transfer Type is required';
    else if (field === 'fromDepartment' && !value) error = 'From Department is required';
    else if (field === 'toDepartment' && !value) error = 'To Department is required';
    else if (field === 'fromBranch' && !value) error = 'From Branch is required';
    else if (field === 'toBranch' && !value) error = 'To Branch is required';
    else if (field === 'effectiveDate' && !value) error = 'Effective Date is required';
    else if (field === 'transferReason' && !value) error = 'Transfer Reason is required';

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.transferOrderNo) {
      newErrors.transferOrderNo = 'Transfer Order Number is required';
    } else if (existingOrderNos.includes(formData.transferOrderNo) &&
      (!editingTransfer || editingTransfer.transferOrderNo !== formData.transferOrderNo)) {
      newErrors.transferOrderNo = 'Order Number already exists';
    }

    if (!formData.transferDate) newErrors.transferDate = 'Transfer Date is required';
    if (!formData.transferType) newErrors.transferType = 'Transfer Type is required';

    if (!editingTransfer) {
      if (!selectedEmployee && !formData.employeeId) {
        newErrors.employeeId = 'Please select an employee';
      }
      if (!selectedEmployee && !formData.fromDepartment) {
        newErrors.fromDepartment = 'Please select an employee first';
      }
      if (!selectedEmployee && !formData.fromBranch) {
        newErrors.fromBranch = 'Please select an employee first';
      }
    }

    if (!formData.toDepartment) newErrors.toDepartment = 'To Department is required';
    if (!formData.toBranch) newErrors.toBranch = 'To Branch is required';
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective Date is required';
    if (!formData.transferReason) newErrors.transferReason = 'Transfer Reason is required';

    if (formData.transferDate && formData.effectiveDate) {
      if (new Date(formData.effectiveDate) < new Date(formData.transferDate)) {
        newErrors.effectiveDate = 'Effective Date must be on or after Transfer Date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  if (!ensureToken()) return;
  if (!validateForm()) {
    toast.warning('Validation Error', 'Please fix the highlighted fields');
    return;
  }
  
  const employeeId = selectedEmployee?.id || Number(formData.employeeId) || 0;
  console.log("🔍 Employee ID:", employeeId);
  
  if (!employeeId || employeeId === 0) {
    toast.warning('Validation Error', 'Please select an employee');
    return;
  }

  setSubmitting(true);
  try {
    let res;

    // ✅ Get all IDs
  const transferTypeId = getTransferTypeIdByName(formData.transferType);
const fromDepartmentId = getDepartmentIdByName(formData.fromDepartment) || 0;  
const fromBranchId = getBranchIdByName(formData.fromBranch) || 0;              
const toDepartmentId = getDepartmentIdByName(formData.toDepartment) || 0;
const toBranchId = getBranchIdByName(formData.toBranch) || 0;

    if (!transferTypeId || transferTypeId === 0) {
      toast.error('Validation Error', 'Invalid Transfer Type selected.');
      setSubmitting(false);
      return;
    }

    if (!toDepartmentId || toDepartmentId === 0) {
      toast.error('Validation Error', 'Invalid Department selected.');
      setSubmitting(false);
      return;
    }

    if (!toBranchId || toBranchId === 0) {
      toast.error('Validation Error', 'Invalid Branch selected.');
      setSubmitting(false);
      return;
    }

    const formatDateForBackend = (dateStr) => {
      if (!dateStr) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };

    const formattedTransferDate = formatDateForBackend(formData.transferDate);
    const formattedEffectiveDate = formatDateForBackend(formData.effectiveDate);

    if (editingTransfer) {
      // ✅ UPDATE PAYLOAD
      const updatePayload = {
        employeeId: Number(employeeId),  
        transferOrderNumber: formData.transferOrderNo,
        transferDate: formattedTransferDate,
        transferTypeId: transferTypeId,
       fromDepartmentId: fromDepartmentId, 
  fromBranchId: fromBranchId,       
        toDepartmentId: toDepartmentId,
        toBranchId: toBranchId,
        effectiveDate: formattedEffectiveDate,
        transferReason: formData.transferReason || ''
      };
      
      console.log("📤 UPDATE payload:", JSON.stringify(updatePayload, null, 2));
      
      res = await axios.put(
        `${BASE_URL}/api/transfers/${editingTransfer.id}/update`,
        updatePayload,
        getAxiosConfig()
      );
      
      console.log("✅ Update Response:", res.data);
      
      if (res.status === 200 || res.status === 201) {
        toast.success('Success', 'Transfer updated successfully');
        resetForm();
        setShowForm(false);
        setPage(0);
        await fetchTransfers();
        if (onSuccess) onSuccess();
      }
    } else {
      // ✅ CREATE PAYLOAD
      const createPayload = {
        employeeId: Number(employeeId),
        transferOrderNumber: formData.transferOrderNo,
        transferDate: formattedTransferDate,
        transferTypeId: transferTypeId,
        fromDepartmentId: fromDepartmentId,
  fromBranchId: fromBranchId,        
        toDepartmentId: toDepartmentId,
        toBranchId: toBranchId,
        effectiveDate: formattedEffectiveDate,
        transferReason: formData.transferReason || ''
      };
      
      console.log("📤 CREATE payload:", JSON.stringify(createPayload, null, 2));
      
      res = await axios.post(
        `${BASE_URL}/api/transfers/create`,
        createPayload,
        getAxiosConfig()
      );
      
      console.log("✅ Create Response:", res.data);
      
      if (res.status === 200 || res.status === 201) {
        toast.success('Success', 'Transfer created successfully');
        resetForm();
        setShowForm(false);
        setPage(0);
        await fetchTransfers();
        if (onSuccess) onSuccess();
      }
    }
    
  } catch (err) {
    console.error('❌ Submit error:', err);
    console.error('❌ Backend response:', err.response?.data);
    console.error('❌ Status:', err.response?.status);
    
    let errorMessage = 'Failed to save transfer';
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.errors) {
        errorMessage = Object.values(data.errors).join(', ');
      } else if (data.error) {
        errorMessage = data.error;
      }
    }
    
    toast.error('Error', errorMessage);
  } finally {
    setSubmitting(false);
  }
};

  // ========== HANDLE EDIT ==========
  const handleEdit = (transfer) => {
    if (transfer.status === 'Inactive') {
      toast.warning('Cannot Edit', 'This record is inactive and cannot be edited');
      return;
    }

    console.log("✏️ Editing Transfer:", transfer);

    setSelectedEmployee({
      id: transfer.employeeId,
      name: transfer.employeeName,
      code: transfer.employeeCode,
      department: transfer.fromDepartment,
      branch: transfer.fromBranch,
      designation: transfer.designation || ''
    });
    
    setEditingTransfer(transfer);
    setFormData({
      transferOrderNo: transfer.transferOrderNo || '',
      transferDate: transfer.transferDate ? transfer.transferDate.split('T')[0] : '',
      transferType: transfer.transferType || '',
      fromDepartment: transfer.fromDepartment || '',
      toDepartment: transfer.toDepartment || '',
      fromBranch: transfer.fromBranch || '',
      toBranch: transfer.toBranch || '',
      effectiveDate: transfer.effectiveDate ? transfer.effectiveDate.split('T')[0] : '',
      transferReason: transfer.transferReason || '',
      transferOrderFile: null,
      transferOrderFileData: transfer.transferOrderFileData || '',
      transferOrderFileName: transfer.transferOrderFileName || '',
      employeeId: transfer.employeeId || '',
      employeeCode: transfer.employeeCode || '',
      employeeDesignation: transfer.designation || '',
      fromDepartmentId: transfer.fromDepartmentId || '',
      fromBranchId: transfer.fromBranchId || ''
    });
    setEmployeeSearchTerm(transfer.employeeName || '');
    setShowForm(true);
  };

  // ========== RESET FORM ==========
  const resetForm = () => {
    setFormData({
      transferOrderNo: '',
      transferDate: '',
      transferType: '',
      fromDepartment: '',
      toDepartment: '',
      fromBranch: '',
      toBranch: '',
      effectiveDate: '',
      transferReason: '',
      transferOrderFile: null,
      transferOrderFileData: null,
      transferOrderFileName: null,
      employeeId: '',
      employeeCode: '',
      employeeDesignation: '',
      fromDepartmentId: '',
      fromBranchId: ''
    });
    setErrors({});
    setTouched({});
    setEditingTransfer(null);
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
  };

  // ========== CANCEL FORM ==========
  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  // ========== BACK TO LIST ==========
  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
    setShowDocumentActions(false);
    setSelectedTransfer(null);
  };

  // ========== STATUS TOGGLE ==========
  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({
      id,
      name,
      newStatus
    });
    setShowStatusModal(true);
  };

  // ========== CONFIRM STATUS CHANGE ==========
  const confirmStatusChange = async () => {
    const { id, newStatus, name } = statusAction;
    
    if (!id) {
      toast.error('Error', 'Invalid record ID');
      return;
    }

    setLoading(true);
    try {
      const isActive = newStatus === 'Active';
      await axios.put(
        `${BASE_URL}/api/transfers/${id}/status?active=${isActive}`,
        null,
        getAxiosConfig()
      );
      
      toast.success('Status Updated', `${name} is now ${newStatus}`);
      await fetchTransfers();
      
    } catch (err) {
      console.error('Status change error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to change status');
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, name: "", newStatus: "" });
    }
  };

  // ========== ROW CLICK ==========
  const handleRowClick = (transfer) => {
    setSelectedTransfer(transfer);
  };

  // ========== GENERATE DOCUMENT ==========
  const handleGenerateDocument = async (transferId) => {
    if (!ensureToken()) return null;
    
    try {
      toast.info('Generating', 'Generating transfer document...');
      
      const res = await axios.get(
        `${BASE_URL}/api/transfers/${transferId}/document`,
        {
          ...getAxiosConfig(),
          responseType: 'blob'
        }
      );
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blob);
      const fileName = `transfer_order_${transferId}_${Date.now()}.pdf`;
      
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

  // ========== VIEW DOCUMENT ==========
const handleViewDocument = async (e, transfer) => {
  e.stopPropagation();
  
  if (!transfer || !transfer.id) {
    toast.error('Error', 'Invalid transfer record');
    return;
  }
  
  setSelectedTransfer(transfer);
  setShowDocumentActions(true);
  
  if (transfer.transferOrderFileData) {
    setDocumentPreview({
      data: transfer.transferOrderFileData,
      name: transfer.transferOrderFileName || 'document.pdf'
    });
    return;
  }
  
  if (transfer.transferOrderFileName) {
    try {
      toast.info('Loading', 'Fetching document...');
      
      const res = await axios.get(
        `${BASE_URL}/api/transfers/${transfer.id}/document`,
        {
          ...getAxiosConfig(),
          responseType: 'blob'
        }
      );
      
      if (!res.data || res.data.size === 0) {
        toast.warning('No Document', 'Document file is empty');
        return;
      }
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blob);
      
      setDocumentPreview({
        data: fileURL,
        name: transfer.transferOrderFileName || 'document.pdf'
      });
      
      toast.success('Success', 'Document loaded successfully');
      
    } catch (error) {
      console.error('Fetch document error:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to load document');
    }
    return;
  }
  
  toast.info('No Document', 'No document has been generated. Click "Generate Letter" to create one.');
};

  // ========== GENERATE LETTER ==========
const handleGenerateLetter = async (transfer) => {
  if (!transfer || !transfer.id) {
    toast.error('Error', 'Invalid transfer record');
    return;
  }
  
  try {
    const result = await handleGenerateDocument(transfer.id);
    
    if (result) {
      // ✅ Update transfers list
      const updatedTransfers = transfers.map(t =>
        t.id === transfer.id
          ? { ...t, transferOrderFileName: result.name, transferOrderFileData: result.data }
          : t
      );
      setTransfers(updatedTransfers);
      
      // ✅ Update selected transfer
      setSelectedTransfer({
        ...selectedTransfer,
        transferOrderFileName: result.name,
        transferOrderFileData: result.data
      });
      
      // ✅ Show preview
      setDocumentPreview({
        data: result.data,
        name: result.name
      });
      
      toast.success('Success', 'Document generated successfully');
    }
  } catch (error) {
    console.error('Generate letter error:', error);
    toast.error('Error', error?.response?.data?.message || 'Failed to generate document');
  }
};

  // ========== RENDER ==========
  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Transfer History</h1>
          <p className="cert-subtitle">Manage employee transfer records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedTransfer && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Transfer
            </button>
          )}
          {(showForm || selectedTransfer) && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedTransfer && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        // ===== FORM VIEW =====
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Transfer Details</div>
              <div className="cert-form-grid-3col">
                {/* Employee Name */}
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
                                  <small className="text-muted">
                                    Code: {emp.code || 'N/A'} | Dept: {emp.department || 'N/A'} | Designation: {emp.designation || 'N/A'}
                                  </small>
                                </div>
                                <div>
                                  <span className="badge bg-light text-dark">{emp.designation || 'N/A'}</span>
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

                {/* Employee Code */}
                {/* <div className="cert-field-compact">
                  <label>Employee Code</label>
                  <input 
                    type="text" 
                    className="form-control bg-light" 
                    value={formData.employeeCode || selectedEmployee?.code || ''} 
                    readOnly 
                    placeholder="Auto-populated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                </div> */}
<div className="cert-field-compact">
  <label>Employee Code</label>
  <input 
    type="text" 
    className="form-control bg-light" 
    value={formData.employeeCode || ''}  // ✅ Sirf formData se lo
    readOnly 
    placeholder="Auto-populated"
    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
  />
</div>       {/* Designation */}
                <div className="cert-field-compact">
                  <label>Designation</label>
                  <input 
                    type="text" 
                    className="form-control bg-light" 
                    value={formData.employeeDesignation || selectedEmployee?.designation || ''} 
                    readOnly 
                    placeholder="Auto-populated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                </div>

                {/* Transfer Order Number */}
                <div className={`cert-field-compact ${touched.transferOrderNo && errors.transferOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Transfer Order Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g., ARI/TRF/2024/001" 
                    value={formData.transferOrderNo} 
                    onChange={(e) => handleChange('transferOrderNo', e.target.value)} 
                    onBlur={() => handleBlur('transferOrderNo')} 
                  />
                  <FieldError msg={errors.transferOrderNo} />
                </div>

                {/* Transfer Date */}
                <div className={`cert-field-compact ${touched.transferDate && errors.transferDate ? 'has-error' : ''}`}>
                  <label className="required">Transfer Date</label>
                  <input 
                    type="date" 
                    value={formData.transferDate} 
                    onChange={(e) => handleChange('transferDate', e.target.value)} 
                    onBlur={() => handleBlur('transferDate')} 
                  />
                  <FieldError msg={errors.transferDate} />
                </div>

                {/* Transfer Type */}
                <div className={`cert-field-compact ${touched.transferType && errors.transferType ? 'has-error' : ''}`}>
                  <label className="required">Transfer Type</label>
                  <select
                    value={formData.transferType}
                    onChange={(e) => handleChange('transferType', e.target.value)}
                    onBlur={() => handleBlur('transferType')}
                  >
                    <option value="">Select Transfer Type</option>
                    {transferTypesList.length > 0 ? (
                      transferTypesList.map((type) => (
                        <option key={type.id} value={type.value || type.name}>
                          {type.label || type.name} 
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No transfer types available</option>
                    )}
                  </select>
                  {loadingTransferTypes && <small>Loading...</small>}
                  <FieldError msg={errors.transferType} />
                </div>

                {/* Current Department */}
                <div className="cert-field-compact">
                  <label>Current Department</label>
                  <input 
                    type="text" 
                    className="form-control bg-light" 
                    value={formData.fromDepartment || selectedEmployee?.department || ''} 
                    readOnly 
                    placeholder="Auto-populated" 
                  />
                </div>

                {/* To Department */}
                <div className={`cert-field-compact ${touched.toDepartment && errors.toDepartment ? 'has-error' : ''}`}>
                  <label className="required">To Department</label>
                  <select
                    value={formData.toDepartment}
                    onChange={(e) => handleChange('toDepartment', e.target.value)}
                    onBlur={() => handleBlur('toDepartment')}
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {loadingDepartments && <small>Loading...</small>}
                  <FieldError msg={errors.toDepartment} />
                </div>

                {/* Current Branch */}
                <div className="cert-field-compact">
                  <label className="required">Current Branch</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.fromBranch || selectedEmployee?.branch || ''}
                    readOnly
                    placeholder="Auto-populated from employee"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                </div>

                {/* To Branch */}
                <div className={`cert-field-compact ${touched.toBranch && errors.toBranch ? 'has-error' : ''}`}>
                  <label className="required">To Branch</label>
                  <select
                    value={formData.toBranch}
                    onChange={(e) => handleChange('toBranch', e.target.value)}
                    onBlur={() => handleBlur('toBranch')}
                  >
                    <option value="">Select Branch</option>
                    {branchesList.map((branch) => (
                      <option key={branch.id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {loadingBranches && <small>Loading...</small>}
                  <FieldError msg={errors.toBranch} />
                </div>

                {/* Effective Date */}
                <div className={`cert-field-compact ${touched.effectiveDate && errors.effectiveDate ? 'has-error' : ''}`}>
                  <label className="required">Effective Date</label>
                  <input 
                    type="date" 
                    value={formData.effectiveDate} 
                    onChange={(e) => handleChange('effectiveDate', e.target.value)} 
                    onBlur={() => handleBlur('effectiveDate')} 
                  />
                  <FieldError msg={errors.effectiveDate} />
                </div>

                {/* Transfer Reason */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 2' }}>
                  <label className="required">Transfer Reason</label>
                  <textarea 
                    rows="2" 
                    placeholder="e.g., Promotion, Department restructuring, Project requirement..." 
                    value={formData.transferReason} 
                    onChange={(e) => handleChange('transferReason', e.target.value)} 
                    onBlur={() => handleBlur('transferReason')} 
                  />
                  <FieldError msg={errors.transferReason} />
                </div>
              </div>
            </div>

            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={submitting}>
                <FaSave size={12} /> {editingTransfer ? 'Update Transfer' : 'Save Transfer'}
              </button>
            </div>
          </form>
        </div>

      ) : showDocumentActions && selectedTransfer ? (
        // ===== DOCUMENT ACTIONS =====
        <DocumentActions
          title="Transfer Letter"
          documentName={selectedTransfer.transferOrderFileName}
          documentData={selectedTransfer.transferOrderFileData}
          onGenerate={() => handleGenerateLetter(selectedTransfer)}
          onBack={handleBackToList}
          generateLabel="Generate Letter"
          themeColor="#9d174d"
        />

      ) : selectedTransfer ? (
        // ===== DETAIL VIEW ===== (Same as before - no changes)
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg,#9d174d,#be185d)', padding: '28px 32px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <FaExchangeAlt size={20} />
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{selectedTransfer.transferOrderNo}</h2>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', opacity: 0.9 }}>
                <span><FaCalendarAlt /> {formatDate(selectedTransfer.createdAt)}</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '12px' }}>{selectedTransfer.transferType}</span>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '32px' }}>
            {/* Employee Info */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg,#9d174d,#be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700 }}>
                {selectedTransfer.employeeName?.charAt(0) || '?'}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 2px 0' }}>
                  {selectedTransfer.employeeName || 'Unknown'}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedTransfer.employeeCode || ''}
                </span>
              </div>
            </div>

            {/* Info Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#fdf2f8', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaCalendarAlt size={16} style={{ color: '#9d174d' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Transfer Date</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatDate(selectedTransfer.transferDate)}</p>
              </div>

              <div style={{ background: '#eef2ff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaExchangeAlt size={16} style={{ color: '#4f46e5' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Transfer Type</span>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: '#e0e7ff', color: '#4f46e5' }}>{selectedTransfer.transferType}</span>
              </div>

              <div style={{ background: '#ecfeff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaCalendarAlt size={16} style={{ color: '#0891b2' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Effective Date</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatDate(selectedTransfer.effectiveDate)}</p>
              </div>

              <div style={{ background: '#fff7ed', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaClock size={16} style={{ color: '#9d174d' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Status</span>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: selectedTransfer.status === 'Active' ? '#d1fae5' : '#fee2e2', color: selectedTransfer.status === 'Active' ? '#065f46' : '#991b1b' }}>
                  {selectedTransfer.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Branch Transfer */}
            <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #fed7aa' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#9a3412', display: 'block', marginBottom: '16px' }}>
                <FaMapMarkerAlt style={{ marginRight: '8px' }} /> Branch Transfer
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
                <div style={{ background: '#fee2e2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <label style={{ fontSize: '11px', color: '#9d174d', display: 'block', marginBottom: '4px' }}>From Branch</label>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#991b1b', margin: 0 }}>{selectedTransfer.fromBranch}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#9d174d' }}>
                  <FaArrowRight size={24} />
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Transfer</span>
                </div>
                <div style={{ background: '#d1fae5', padding: '16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <label style={{ fontSize: '11px', color: '#059669', display: 'block', marginBottom: '4px' }}>To Branch</label>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#065f46', margin: 0 }}>{selectedTransfer.toBranch}</p>
                </div>
              </div>
            </div>

            {/* Department Transfer */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#166534', display: 'block', marginBottom: '16px' }}>
                <FaBuilding style={{ marginRight: '8px' }} /> Department Transfer
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
                <div style={{ background: '#e0e7ff', padding: '16px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                  <label style={{ fontSize: '11px', color: '#4f46e5', display: 'block', marginBottom: '4px' }}>From Department</label>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#3730a3', margin: 0 }}>{selectedTransfer.fromDepartment}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#9d174d' }}>
                  <FaArrowRight size={24} />
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Transfer</span>
                </div>
                <div style={{ background: '#d1fae5', padding: '16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <label style={{ fontSize: '11px', color: '#059669', display: 'block', marginBottom: '4px' }}>To Department</label>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#065f46', margin: 0 }}>{selectedTransfer.toDepartment}</p>
                </div>
              </div>
            </div>

            {/* Transfer Reason */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid #bbf7d0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileAlt size={14} /> Transfer Reason
              </h4>
              <p style={{ fontSize: '15px', color: '#065f46', margin: 0, lineHeight: 1.6 }}>{selectedTransfer.transferReason || 'No reason provided'}</p>
            </div>

            {/* Document Section */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf size={16} style={{ color: '#dc2626' }} /> Transfer Order Document
              </h4>
              {selectedTransfer.transferOrderFileName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedTransfer.transferOrderFileName.endsWith('.pdf') ? 
                        <FaFilePdf size={20} style={{ color: '#dc2626' }} /> : 
                        <FaFileImage size={20} style={{ color: '#3b82f6' }} />
                      }
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>{selectedTransfer.transferOrderFileName}</p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uploaded document</span>
                    </div>
                  </div>
                  <button onClick={(e) => handleViewDocument(e, selectedTransfer)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    <FaEye size={14} /> View Document
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <FaFileAlt size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: 500, margin: '0 0 4px 0', color: '#64748b' }}>No document uploaded</p>
                  <span style={{ fontSize: '13px' }}>No transfer order document has been uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>

      ) : (
        // ===== TABLE VIEW ===== (Same as before - no changes)
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by order number, employee, department, branch or reason..."
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
                    <th>Transfer Date</th>
                    <th>From → To (Branch)</th>
                    <th>Department (From → To)</th>
                    <th>Transfer Type</th>
                    <th>Effective Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransfers.length > 0 ? (
                    currentTransfers.map((transfer, idx) => (
                      <tr
                        key={transfer.id}
                        onClick={() => handleRowClick(transfer)}
                        style={{ cursor: 'pointer' }}
                        className="cert-table-row-hover"
                      >
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>{transfer.employeeName || 'Unknown'}</td>
                        <td><strong>{transfer.transferOrderNo}</strong></td>
                        <td>{formatDate(transfer.transferDate)}</td>
                        <td>
                          <span className="text-muted">{transfer.fromBranch}</span>
                          <FaArrowRight className="mx-1 text-primary" size={10} />
                          <span className="fw-bold text-success">{transfer.toBranch}</span>
                        </td>
                        <td>
                          <span className="text-muted">{transfer.fromDepartment}</span>
                          <FaArrowRight className="mx-1 text-primary" size={10} />
                          <span className="fw-bold text-success">{transfer.toDepartment}</span>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                            {transfer.transferType}
                          </span>
                        </td>
                        <td>{formatDate(transfer.effectiveDate)}</td>
                        <td className="text-center" style={{ maxWidth: '150px' }}>
                          {transfer.transferReason ? (
                            <span title={transfer.transferReason}>
                              {transfer.transferReason.length > 20 ? transfer.transferReason.substring(0, 20) + '...' : transfer.transferReason}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <div
                            className="d-flex align-items-center gap-1"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusToggle(
                                transfer.id,
                                transfer.employeeName || "",
                                transfer.status || "Active"
                              )
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "16px",
                                borderRadius: "50px",
                                backgroundColor:
                                  (transfer.status || "Active") === "Active"
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
                                    (transfer.status || "Active") === "Active"
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
                                  (transfer.status || "Active") === "Active"
                                    ? "#9d174d"
                                    : "#94a3b8"
                              }}
                            >
                              {transfer.status || "Active"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="cert-act cert-act--edit"
                              onClick={() => handleEdit(transfer)}
                              title={transfer.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={transfer.status === 'Inactive'}
                              style={{
                                opacity: transfer.status === 'Inactive' ? 0.5 : 1,
                                cursor: transfer.status === 'Inactive' ? 'not-allowed' : 'pointer'
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
                      <td colSpan="12" className="text-center py-5">No transfer records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cert-table-footer">
              <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} transfers
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

      {/* ===== STATUS MODAL ===== */}
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

      {/* ===== DOCUMENT PREVIEW MODAL ===== */}
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

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default TransferHistory;