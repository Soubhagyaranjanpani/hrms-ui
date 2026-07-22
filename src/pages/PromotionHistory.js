import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaFileAlt, FaCalendarAlt, FaArrowUp, FaBuilding,
  FaFilePdf, FaFileImage, FaEdit, FaPlus, FaChartLine,
  FaSearch, FaArrowLeft, FaEye, FaArrowRight, FaBook
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import DocumentActions from './DocumentsAction';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';

const PromotionHistory = ({ employeeId, initialData, onSuccess, onCancel }) => {
  // ─── State ──────────────────────────────────────────────
  const [promotions, setPromotions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [designationList, setDesignationList] = useState([]);
  const [gradeList, setGradeList] = useState([]);
  const [promotionTypeList, setPromotionTypeList] = useState([]);
  const [promotionAuthorityList, setPromotionAuthorityList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingPromotion, setEditingPromotion] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  const [formData, setFormData] = useState({
    promotionOrderNo: '',
    promotionDate: '',
    effectiveDate: '',
    oldGrade: '',
    newGrade: '',
    serviceBookNo: '',
    employeeId: null,
    oldBranchId: null,
    newBranchId: null,
    oldDepartmentId: null,
    newDepartmentId: null,
    oldDesignationId: null,
    newDesignationId: null,
    promotionTypeId: null,
    promotionAuthorityId: null,
    oldGradeId: null,
    newGradeId: null,
    oldBranchName: '',
    newBranchName: '',
    oldDepartmentName: '',
    newDepartmentName: '',
    oldDesignationName: '',
    newDesignationName: '',
    promotionTypeName: '',
    promotionAuthorityName: '',
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
  const [statusAction, setStatusAction] = useState({ id: null, name: '', newStatus: '' });
  const [showDocumentActions, setShowDocumentActions] = useState(false);

  // ─── Token helper ──────────────────────────────────────────
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

  // ─── Reverse-lookup helpers ───────────────────────────────
  const getBranchIdByName = (name) => branchList.find(b => b.name === name)?.id || null;
  const getDepartmentIdByName = (name) => departmentList.find(d => d.name === name)?.id || null;
  const getDesignationIdByName = (name) => designationList.find(d => d.name === name)?.id || null;
  const getGradeIdByName = (name) => gradeList.find(g => g.name === name)?.id || null;
  const getPromotionTypeIdByName = (name) => promotionTypeList.find(pt => pt.promotionTypeName === name)?.id || null;
  const getPromotionAuthorityIdByName = (name) => promotionAuthorityList.find(a => a.name === name)?.id || null;

  // ─── Fetch single employee details ────────────────────────
  const fetchEmployeeDetails = useCallback(async (employeeId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/employees/${employeeId}`, getAxiosConfig());
      if (res.data?.status === 200 && res.data.response) {
        return res.data.response;
      } else if (res.data && typeof res.data === 'object' && !res.data.status) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching employee details:', err);
      return null;
    }
  }, []);

  // ─── Data fetching functions (all use getAxiosConfig) ────
  const fetchBranches = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/branches/list?flag=0`, getAxiosConfig());
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        setBranchList(res.data.response.map(b => ({ id: b.id, name: b.name || b.branchName })));
      } else {
        setBranchList([]);
      }
    } catch (err) {
      console.error('Fetch branches error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch branches');
      setBranchList([]);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/departments/list?flag=0`, getAxiosConfig());
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        setDepartmentList(res.data.response.map(d => ({ id: d.id, name: d.name })));
      } else {
        setDepartmentList([]);
      }
    } catch (err) {
      console.error('Fetch departments error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch departments');
      setDepartmentList([]);
    }
  }, []);

  const fetchDesignations = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/designations/list?flag=0`, getAxiosConfig());
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        setDesignationList(res.data.response.map(d => ({ id: d.id, name: d.name || d.designationName || '' })));
      } else {
        setDesignationList([]);
      }
    } catch (err) {
      console.error('Fetch designations error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch designations');
      setDesignationList([]);
    }
  }, []);

  const fetchGrades = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/grades`, getAxiosConfig());
      if (res.data?.status === 200) {
        let gradesData = Array.isArray(res.data.response)
          ? res.data.response
          : (res.data.response?.content || []);
        setGradeList(gradesData.map(g => ({ id: g.id, name: g.name || g.gradeName || '' })));
      } else {
        setGradeList([]);
      }
    } catch (err) {
      console.error('Fetch grades error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch grades');
      setGradeList([]);
    }
  }, []);

  const fetchPromotionAuthorities = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/employee-designation?flag=0`, getAxiosConfig());
      let authoritiesData = [];
      if (Array.isArray(res.data)) authoritiesData = res.data;
      else if (res.data?.status === 200 && Array.isArray(res.data.response)) authoritiesData = res.data.response;
      else if (res.data?.response?.content) authoritiesData = res.data.response.content;

      const mapped = authoritiesData.map(item => ({
        id: item.id,
        name: item.name || item.designationName || item.title || item.authorityName || ''
      }));
      setPromotionAuthorityList(mapped);
    } catch (err) {
      console.error('Fetch promotion authorities error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch promotion authorities');
      setPromotionAuthorityList([]);
    }
  }, []);

  const fetchPromotionTypes = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/promotion-types?flag=0`, getAxiosConfig());
      let typesData = [];
      if (Array.isArray(res.data)) typesData = res.data;
      else if (res.data?.status === 200 && Array.isArray(res.data.response)) typesData = res.data.response;
      else if (res.data?.response?.content) typesData = res.data.response.content;

      setPromotionTypeList(typesData.map(pt => ({
        id: pt.id,
        promotionTypeName: pt.promotionTypeName || pt.name || ''
      })));
    } catch (err) {
      console.error('Fetch promotion types error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch promotion types');
      setPromotionTypeList([]);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/employees`, { ...getAxiosConfig(), params: { size: 1000, page: 0 } });
      if (res.data?.status === 200) {
        let employeesData = Array.isArray(res.data.response)
          ? res.data.response
          : (res.data.response?.content || res.data.response?.data || []);
        setEmployees(employeesData);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch employees');
      setEmployees([]);
    }
  }, []);

  const fetchPromotions = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const params = { page: 0, size: 100 };
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${BASE_URL}/api/promotions`, { ...getAxiosConfig(), params });
      if (res.data?.status === 200) {
        let list = res.data.response?.content || [];
        if (employeeId) {
          list = list.filter(p => String(p.employeeId) === String(employeeId));
        }
        setPromotions(list);
      } else {
        setPromotions([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch promotions');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, employeeId]);

  // ─── Load all data on mount ───────────────────────────
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchBranches(),
        fetchDepartments(),
        fetchDesignations(),
        fetchGrades(),
        fetchPromotionTypes(),
        fetchPromotionAuthorities(),
        fetchEmployees(),
        fetchPromotions()
      ]);
    };
    loadAllData();
  }, [fetchBranches, fetchDepartments, fetchDesignations, fetchGrades, fetchPromotionTypes, fetchPromotionAuthorities, fetchEmployees, fetchPromotions]);

  // ─── Update existing order numbers ────────────────────
  useEffect(() => {
    // Filter out null/undefined to avoid false uniqueness errors
    setExistingOrderNos(
      promotions.map(promo => promo.promotionOrderNumber).filter(Boolean)
    );
  }, [promotions]);

  // ─── Helpers ─────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusLabel = (promo) => (promo?.isActive === false ? 'Inactive' : 'Active');

  const getLastPromotionDate = () => {
    const empId = formData.employeeId || selectedEmployee?.id;
    if (!empId) return null;

    const filtered = promotions.filter(p =>
      String(p.employeeId) === String(empId) &&
      (!editingPromotion || p.id !== editingPromotion.id)
    );
    if (filtered.length === 0) return null;

    const dates = filtered
      .map(p => new Date(p.promotionDate))
      .filter(d => !isNaN(d.getTime()));
    if (dates.length === 0) return null;

    const maxDate = new Date(Math.max(...dates));
    return maxDate.toISOString().split('T')[0];
  };

  // ─── Form handlers ────────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) validateField(field, value);
  };

  const handleBranchChange = (field, value) => {
    const selected = branchList.find(b => b.name === value);
    setFormData(prev => ({ ...prev, [`${field}Name`]: value, [`${field}Id`]: selected?.id || null }));
    if (touched[`${field}Name`]) validateField(`${field}Name`, value);
  };

  const handleDepartmentChange = (field, value) => {
    const selected = departmentList.find(d => d.name === value);
    setFormData(prev => ({ ...prev, [`${field}Name`]: value, [`${field}Id`]: selected?.id || null }));
    if (touched[`${field}Name`]) validateField(`${field}Name`, value);
  };

  const handleDesignationChange = (field, value) => {
    const selected = designationList.find(d => d.name === value);
    setFormData(prev => ({ ...prev, [`${field}Name`]: value, [`${field}Id`]: selected?.id || null }));
    if (touched[`${field}Name`]) validateField(`${field}Name`, value);
  };

  const handlePromotionTypeChange = (value) => {
    const selected = promotionTypeList.find(pt => pt.promotionTypeName === value);
    setFormData(prev => ({ ...prev, promotionTypeName: value, promotionTypeId: selected?.id || null }));
    if (touched.promotionTypeName) validateField('promotionTypeName', value);
  };

  const handleAuthorityChange = (value) => {
    const selected = promotionAuthorityList.find(a => a.name === value);
    setFormData(prev => ({ ...prev, promotionAuthorityName: value, promotionAuthorityId: selected?.id || null }));
    if (touched.promotionAuthorityName) validateField('promotionAuthorityName', value);
  };

  const handleNewGradeChange = (value) => {
    const selected = gradeList.find(g => g.name === value);
    setFormData(prev => ({ ...prev, newGrade: value, newGradeId: selected?.id || null }));
    if (touched.newGrade) validateField('newGrade', value);
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // ─── validateField – returns error string (empty = no error) ─
  const validateField = (field, value) => {
    let error = '';
    const lastPromotionDate = getLastPromotionDate();

    if (field === 'promotionOrderNo') {
      if (!value) error = 'Promotion Order Number is required';
      else if (existingOrderNos.includes(value) && (!editingPromotion || editingPromotion.promotionOrderNumber !== value)) {
        error = 'This Order Number already exists';
      }
    } else if (field === 'promotionDate') {
      if (!value) error = 'Promotion Date is required';
      else if (!editingPromotion && lastPromotionDate && new Date(value) <= new Date(lastPromotionDate)) {
        error = `Promotion Date must be greater than last promotion date (${formatDate(lastPromotionDate)})`;
      }
    } else if (field === 'newDesignationName' && !value) error = 'New Designation is required';
    else if (field === 'promotionTypeName' && !value) error = 'Promotion Type is required';
    else if (field === 'effectiveDate') {
      if (!value) error = 'Effective Date is required';
      else if (formData.promotionDate && new Date(value) < new Date(formData.promotionDate)) {
        error = 'Effective Date must be on or after Promotion Date';
      }
    } else if (field === 'promotionAuthorityName' && !value) error = 'Promotion Authority is required';
    else if (field === 'newBranchName' && !value) error = 'New Branch is required';
    else if (field === 'newDepartmentName' && !value) error = 'New Department is required';
    else if (field === 'newGrade' && !value) error = 'New Grade is required';

    setErrors(prev => ({ ...prev, [field]: error }));
    return error; // ← returns error string
  };

  // ─── validateForm – only returns true when no errors ──────
  const validateForm = () => {
    const newErrors = {};
    const newTouched = {};
    const fields = [
      'promotionOrderNo',
      'promotionDate',
      'newDesignationName',
      'promotionTypeName',
      'effectiveDate',
      'promotionAuthorityName',
      'newBranchName',
      'newDepartmentName',
      'newGrade'
    ];
    fields.forEach(f => {
      newTouched[f] = true;
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;   // ← only add if error string is non‑empty
    });
    setErrors(newErrors);
    setTouched(prev => ({ ...prev, ...newTouched }));

    console.log('FORM DATA →', JSON.stringify(formData, null, 2));
    console.log('VALIDATION ERRORS →', JSON.stringify(newErrors, null, 2));

    return Object.keys(newErrors).length === 0;
  };

  // ─── Reset form ──────────────────────────────────────
  const resetForm = () => {
    setFormData({
      promotionOrderNo: '', promotionDate: '', effectiveDate: '', oldGrade: '', newGrade: '', serviceBookNo: '',
      employeeId: null,
      oldBranchId: null, newBranchId: null,
      oldDepartmentId: null, newDepartmentId: null,
      oldDesignationId: null, newDesignationId: null,
      promotionTypeId: null, promotionAuthorityId: null,
      oldGradeId: null, newGradeId: null,
      oldBranchName: '', newBranchName: '',
      oldDepartmentName: '', newDepartmentName: '',
      oldDesignationName: '', newDesignationName: '',
      promotionTypeName: promotionTypeList.length > 0 ? promotionTypeList[0].promotionTypeName : '',
      promotionAuthorityName: promotionAuthorityList.length > 0 ? promotionAuthorityList[0].name : '',
      remarks: '',
    });
    setErrors({});
    setTouched({});
    setEditingPromotion(null);
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
  };

  // ─── Submit ──────────────────────────────────────────────────
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
      const payload = {
        employeeId: formData.employeeId || selectedEmployee?.id || 0,
        oldBranchId: formData.oldBranchId || getBranchIdByName(formData.oldBranchName) || null,
        newBranchId: formData.newBranchId || getBranchIdByName(formData.newBranchName),
        oldDepartmentId: formData.oldDepartmentId || getDepartmentIdByName(formData.oldDepartmentName) || null,
        newDepartmentId: formData.newDepartmentId || getDepartmentIdByName(formData.newDepartmentName),
        oldDesignationId: formData.oldDesignationId || getDesignationIdByName(formData.oldDesignationName) || null,
        newDesignationId: formData.newDesignationId || getDesignationIdByName(formData.newDesignationName),
        promotionOrderNumber: formData.promotionOrderNo.trim(),
        promotionDate: formData.promotionDate,
        promotionTypeId: formData.promotionTypeId || getPromotionTypeIdByName(formData.promotionTypeName),
        previousGradeId: formData.oldGradeId || getGradeIdByName(formData.oldGrade) || null,
        newGradeId: formData.newGradeId || getGradeIdByName(formData.newGrade),
        effectiveDate: formData.effectiveDate,
        promotionAuthorityId: formData.promotionAuthorityId || getPromotionAuthorityIdByName(formData.promotionAuthorityName),
        remarks: formData.remarks || '',
      };

      const url = editingPromotion
        ? `${BASE_URL}/api/promotions/${editingPromotion.id}/update`
        : `${BASE_URL}/api/promotions/create`;
      const method = editingPromotion ? 'put' : 'post';

      const res = await axios[method](url, payload, getAxiosConfig());

      if (res.data?.status === 200 || res.data?.status === 201) {
        toast.success('Success', editingPromotion ? 'Promotion updated successfully' : 'Promotion saved successfully');
        resetForm();
        setShowForm(false);
        fetchPromotions();
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
  const handleEdit = async (promotion) => {
    if (promotion.isActive === false) {
      toast.warning('Inactive', 'Cannot edit an inactive promotion');
      return;
    }
    let emp = employees.find(e => e.id === promotion.employeeId);
    if (!emp) {
      const details = await fetchEmployeeDetails(promotion.employeeId);
      if (details) emp = details;
    }
    if (emp) {
      setSelectedEmployee(emp);
      setEmployeeSearchTerm(emp.name);
    }

    // Populate form with promotion data
    setFormData({
      promotionOrderNo: promotion.promotionOrderNumber || '',
      promotionDate: promotion.promotionDate || '',
      effectiveDate: promotion.effectiveDate || '',
      oldGrade: promotion.previousGrade || '',
      newGrade: promotion.newGrade || '',
      serviceBookNo: emp?.serviceBookNo || '',

      employeeId: promotion.employeeId || null,

      oldBranchId: getBranchIdByName(promotion.oldBranch),
      newBranchId: getBranchIdByName(promotion.newBranch),
      oldDepartmentId: getDepartmentIdByName(promotion.oldDepartment),
      newDepartmentId: getDepartmentIdByName(promotion.newDepartment),
      oldDesignationId: getDesignationIdByName(promotion.oldDesignation),
      newDesignationId: getDesignationIdByName(promotion.newDesignation),
      promotionTypeId: getPromotionTypeIdByName(promotion.promotionType),
      promotionAuthorityId: getPromotionAuthorityIdByName(promotion.promotionAuthority),
      oldGradeId: getGradeIdByName(promotion.previousGrade),
      newGradeId: getGradeIdByName(promotion.newGrade),

      oldBranchName: promotion.oldBranch || '',
      newBranchName: promotion.newBranch || '',
      oldDepartmentName: promotion.oldDepartment || '',
      newDepartmentName: promotion.newDepartment || '',
      oldDesignationName: promotion.oldDesignation || '',
      newDesignationName: promotion.newDesignation || '',
      promotionTypeName: promotion.promotionType || '',
      promotionAuthorityName: promotion.promotionAuthority || '',

      remarks: promotion.remarks || '',
    });

    setEditingPromotion(promotion);
    setShowForm(true);
    setSelectedPromotion(null);
  };

  // ─── Status toggle via API ───────────────────────────
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
        `${BASE_URL}/api/promotions/${id}/status`,
        null,
        { ...getAxiosConfig(), params: { active: newStatus === 'Active' } }
      );
      if (res.data?.status === 200) {
        toast.success('Status Updated', 'Promotion status changed');
        fetchPromotions();
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

  // ─── View document ────────────────────────────────────
  const handleViewDocument = async (e, promotion) => {
    e.stopPropagation();
    setSelectedPromotion(promotion);
    setShowDocumentActions(true);

    if (!promotion.documentName) {
      toast.info('No Document', 'No document has been uploaded for this promotion');
      return;
    }

    setDocLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/promotions/${promotion.id}/document`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(res.data);
      setDocumentPreview({ data: blobUrl, name: promotion.documentName });
    } catch (err) {
      console.error('Document fetch error:', err);
      toast.error('Error', 'Failed to load document');
    } finally {
      setDocLoading(false);
    }
  };

  // ─── Pagination / search ─────────────────────────────
  const filteredPromotions = promotions.filter(promo => {
    const search = searchTerm.toLowerCase();
    return promo.promotionOrderNumber?.toLowerCase().includes(search) ||
      promo.oldDesignation?.toLowerCase().includes(search) ||
      promo.newDesignation?.toLowerCase().includes(search) ||
      promo.promotionType?.toLowerCase().includes(search) ||
      promo.employee?.toLowerCase().includes(search);
  });

  const totalItems = filteredPromotions.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentPromotions = filteredPromotions.slice(startIndex, startIndex + rowsPerPage);

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

  // ─── Employee dropdown ──────────────────────────────────
  const filteredEmployees = employees.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name?.toLowerCase().includes(search) || emp.email?.toLowerCase().includes(search);
  });

  // ✅ proper mapping of employee fields
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearchTerm(employee.name);
    setShowEmployeeDropdown(false);

    setFormData(prev => ({
      ...prev,
      employeeId: employee.id,
      oldBranchName: employee.branchName || '',
      oldBranchId: getBranchIdByName(employee.branchName),
      oldDepartmentName: employee.departmentName || '',
      oldDepartmentId: getDepartmentIdByName(employee.departmentName),
      oldGrade: employee.gradeName || '',
      oldGradeId: employee.gradeId || null,
      oldDesignationName: employee.designation || '',
      oldDesignationId: employee.designationId || null,
      serviceBookNo: employee.serviceBookNo || '',
    }));
  };

  // ─── Other handlers ──────────────────────────────────
  const handleRowClick = (promotion) => setSelectedPromotion(promotion);

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
    setShowDocumentActions(false);
    setSelectedPromotion(null);
    if (documentPreview?.data) URL.revokeObjectURL(documentPreview.data);
    setDocumentPreview(null);
  };

  const handleGenerateLetter = (promotion) => {
    console.log('Generate clicked for:', promotion.promotionOrderNumber);
  };

  // ─── Render ──────────────────────────────────────────
  if (loading && promotions.length === 0) {
    return <LoadingSpinner message="Loading promotions..." />;
  }

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Promotion History</h1>
          <p className="cert-subtitle">Manage employee promotion records</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && !selectedPromotion && (
            <button className="cert-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
              <FaPlus size={13} /> Add Promotion
            </button>
          )}
          {(showForm || selectedPromotion) && (
            <button type="button" className="cert-back-btn" onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {!showForm && !selectedPromotion && onCancel && (
            <button className="cert-cancel-btn" onClick={onCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        // ─── FORM VIEW ──────────────────────────────────────────
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Promotion Details</div>
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
                        onChange={(e) => { setEmployeeSearchTerm(e.target.value); setShowEmployeeDropdown(true); }}
                        onFocus={() => { if (employeeSearchTerm.length > 0) setShowEmployeeDropdown(true); }}
                        style={{ fontSize: '14px', padding: '6px 12px' }}
                      />
                    </div>
                    {showEmployeeDropdown && employeeSearchTerm.length > 0 && (
                      <div className="card position-absolute top-100 start-0 end-0 mt-1 shadow-lg" style={{ zIndex: 1000, maxHeight: '250px', overflow: 'auto' }}>
                        <div className="card-body p-2">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                              <div key={emp.id} className="d-flex justify-content-between align-items-center p-2 rounded cursor-pointer hover-bg-light"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleEmployeeSelect(emp)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <div>
                                  <div className="fw-bold">{emp.name}</div>
                                  <small className="text-muted">{emp.email || emp.phone || ''} {emp.departmentName ? `| Dept: ${emp.departmentName}` : ''}</small>
                                </div>
                                <div><span className="badge bg-light text-dark">{emp.roleName}</span></div>
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
                  <label>Service Book No</label>
                  <input type="text" className="form-control bg-light"
                    value={formData.serviceBookNo || ''} readOnly placeholder="Not tracked in employee records" />
                </div>

                <div className="cert-field-compact">
                  <label>Old Branch</label>
                  <input type="text" className="form-control bg-light"
                    value={formData.oldBranchName || selectedEmployee?.branchName || ''} readOnly placeholder="Auto-populated" />
                </div>

                <div className={`cert-field-compact ${touched.newBranchName && errors.newBranchName ? 'has-error' : ''}`}>
                  <label className="required">New Branch</label>
                  <select value={formData.newBranchName} onChange={(e) => handleBranchChange('newBranch', e.target.value)} onBlur={() => handleBlur('newBranchName')}>
                    <option value="">Select Branch</option>
                    {branchList.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                  </select>
                  <FieldError msg={errors.newBranchName} />
                </div>

                <div className="cert-field-compact">
                  <label>Old Department</label>
                  <input type="text" className="form-control bg-light"
                    value={formData.oldDepartmentName || selectedEmployee?.departmentName || ''} readOnly placeholder="Auto-populated" />
                </div>

                <div className={`cert-field-compact ${touched.newDepartmentName && errors.newDepartmentName ? 'has-error' : ''}`}>
                  <label className="required">New Department</label>
                  <select value={formData.newDepartmentName} onChange={(e) => handleDepartmentChange('newDepartment', e.target.value)} onBlur={() => handleBlur('newDepartmentName')}>
                    <option value="">Select Department</option>
                    {departmentList.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                  <FieldError msg={errors.newDepartmentName} />
                </div>

                <div className="cert-field-compact">
                  <label>Old Designation</label>
                  <input type="text" className="form-control bg-light"
                    value={formData.oldDesignationName || selectedEmployee?.designation || ''} readOnly placeholder="Auto-populated" />
                </div>

                <div className={`cert-field-compact ${touched.newDesignationName && errors.newDesignationName ? 'has-error' : ''}`}>
                  <label className="required">New Designation</label>
                  <select value={formData.newDesignationName} onChange={(e) => handleDesignationChange('newDesignation', e.target.value)} onBlur={() => handleBlur('newDesignationName')}>
                    <option value="">Select New Designation</option>
                    {designationList.map(des => <option key={des.id} value={des.name}>{des.name}</option>)}
                  </select>
                  <FieldError msg={errors.newDesignationName} />
                </div>

                <div className={`cert-field-compact ${touched.promotionOrderNo && errors.promotionOrderNo ? 'has-error' : ''}`}>
                  <label className="required">Promotion Order Number</label>
                  <input type="text" placeholder="e.g., ARI/PROMO/2024/001" value={formData.promotionOrderNo}
                    onChange={(e) => handleChange('promotionOrderNo', e.target.value)} onBlur={() => handleBlur('promotionOrderNo')} />
                  <FieldError msg={errors.promotionOrderNo} />
                  <small>Unique order number for promotion</small>
                </div>

                <div className={`cert-field-compact ${touched.promotionDate && errors.promotionDate ? 'has-error' : ''}`}>
                  <label className="required">Promotion Date</label>
                  <input type="date" value={formData.promotionDate}
                    onChange={(e) => handleChange('promotionDate', e.target.value)} onBlur={() => handleBlur('promotionDate')} />
                  <FieldError msg={errors.promotionDate} />
                  <small>Date of promotion approval</small>
                </div>

                <div className={`cert-field-compact ${touched.promotionTypeName && errors.promotionTypeName ? 'has-error' : ''}`}>
                  <label className="required">Promotion Type</label>
                  <select value={formData.promotionTypeName || ''} onChange={(e) => handlePromotionTypeChange(e.target.value)} onBlur={() => handleBlur('promotionTypeName')}>
                    <option value="">Select Promotion Type</option>
                    {promotionTypeList.length > 0 ? (
                      promotionTypeList.map((pt) => <option key={pt.id} value={pt.promotionTypeName}>{pt.promotionTypeName}</option>)
                    ) : (
                      <option value="" disabled>Loading promotion types...</option>
                    )}
                  </select>
                  <FieldError msg={errors.promotionTypeName} />
                </div>

                <div className="cert-field-compact">
                  <label>Old Grade</label>
                  <input type="text" className="form-control bg-light"
                    value={formData.oldGrade || selectedEmployee?.gradeName || ''} readOnly placeholder="Auto-populated" />
                </div>

                <div className={`cert-field-compact ${touched.newGrade && errors.newGrade ? 'has-error' : ''}`}>
                  <label className="required">New Grade</label>
                  <select value={formData.newGrade} onChange={(e) => handleNewGradeChange(e.target.value)} onBlur={() => handleBlur('newGrade')}>
                    <option value="">Select Grade</option>
                    {gradeList.map(grade => <option key={grade.id} value={grade.name}>{grade.name}</option>)}
                  </select>
                  <FieldError msg={errors.newGrade} />
                </div>

                <div className={`cert-field-compact ${touched.effectiveDate && errors.effectiveDate ? 'has-error' : ''}`}>
                  <label className="required">Effective Date</label>
                  <input type="date" value={formData.effectiveDate} min={formData.promotionDate}
                    onChange={(e) => handleChange('effectiveDate', e.target.value)} onBlur={() => handleBlur('effectiveDate')} />
                  <FieldError msg={errors.effectiveDate} />
                </div>

                <div className={`cert-field-compact ${touched.promotionAuthorityName && errors.promotionAuthorityName ? 'has-error' : ''}`}>
                  <label className="required">Promotion Authority</label>
                  <select value={formData.promotionAuthorityName || ''} onChange={(e) => handleAuthorityChange(e.target.value)} onBlur={() => handleBlur('promotionAuthorityName')}>
                    <option value="">Select Authority</option>
                    {promotionAuthorityList.length > 0 ? (
                      promotionAuthorityList.map((auth) => <option key={auth.id} value={auth.name}>{auth.name}</option>)
                    ) : (
                      <option value="" disabled>Loading authorities...</option>
                    )}
                  </select>
                  <FieldError msg={errors.promotionAuthorityName} />
                </div>

                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Remarks</label>
                  <input type="text" placeholder="Optional remarks"
                    value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>Cancel</button>
              <button type="submit" className="cert-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting ? (
                  <><span className="cert-spinner" /> {editingPromotion ? 'Updating…' : 'Creating…'}</>
                ) : (
                  <><FaSave size={12} /> {editingPromotion ? 'Update Promotion' : 'Save Promotion'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : showDocumentActions && selectedPromotion ? (
        <DocumentActions
          title="Promotion Letter"
          documentName={selectedPromotion.documentName}
          documentData={documentPreview?.data}
          onGenerate={() => handleGenerateLetter(selectedPromotion)}
          onBack={handleBackToList}
          generateLabel="Generate Letter"
          themeColor="#9d174d"
        />
      ) : selectedPromotion ? (
        // ─── DETAIL VIEW ──────────────────────────────────────────
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg,#9d174d,#be185d)', padding: '28px 32px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <FaArrowUp size={20} />
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{selectedPromotion.promotionOrderNumber}</h2>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', opacity: 0.9 }}>
                <span><FaCalendarAlt /> {formatDate(selectedPromotion.promotionDate)}</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  {selectedPromotion.promotionType}
                </span>
              </div>
            </div>
          </div>
          <div style={{ padding: '32px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg,#9d174d,#be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700 }}>
                {selectedPromotion.employee?.charAt(0) || '?'}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 2px 0' }}>
                  {selectedPromotion.employee || 'Unknown'}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedPromotion.employeeCode || ''} • {selectedPromotion.newDesignation}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#fdf2f8', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaCalendarAlt size={16} style={{ color: '#9d174d' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Promotion Date</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatDate(selectedPromotion.promotionDate)}</p>
              </div>
              <div style={{ background: '#eef2ff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaChartLine size={16} style={{ color: '#4f46e5' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Promotion Type</span>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: '#e0e7ff', color: '#4f46e5' }}>
                  {selectedPromotion.promotionType}
                </span>
              </div>
              <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaBook size={16} style={{ color: '#0369a1' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Employee Code</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{selectedPromotion.employeeCode || '—'}</p>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaBuilding size={16} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Old Designation</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{selectedPromotion.oldDesignation}</p>
              </div>
              <div style={{ background: '#ecfdf5', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaArrowUp size={16} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>New Designation</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#059669', margin: 0 }}>{selectedPromotion.newDesignation}</p>
              </div>
              <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaArrowRight size={16} style={{ color: '#d97706' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Grade Progression</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>{selectedPromotion.previousGrade || 'N/A'}</span>
                  <FaArrowRight size={12} style={{ color: '#9d174d' }} />
                  <span style={{ fontWeight: 600, color: '#9d174d' }}>{selectedPromotion.newGrade || 'N/A'}</span>
                </div>
              </div>
              <div style={{ background: '#ecfeff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaCalendarAlt size={16} style={{ color: '#0891b2' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Effective Date</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{formatDate(selectedPromotion.effectiveDate)}</p>
              </div>
              <div style={{ background: '#faf5ff', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaBuilding size={16} style={{ color: '#7c3aed' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Authority</span>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{selectedPromotion.promotionAuthority}</p>
              </div>
              <div style={{ background: '#fff7ed', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaChartLine size={16} style={{ color: '#ea580c' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Status</span>
                </div>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: getStatusLabel(selectedPromotion) === 'Active' ? '#d1fae5' : '#fee2e2', color: getStatusLabel(selectedPromotion) === 'Active' ? '#065f46' : '#991b1b' }}>
                  {getStatusLabel(selectedPromotion)}
                </span>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilePdf size={16} style={{ color: '#dc2626' }} /> Promotion Order Document
              </h4>
              {selectedPromotion.documentName ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedPromotion.documentName.endsWith('.pdf') ? <FaFilePdf size={20} style={{ color: '#dc2626' }} /> : <FaFileImage size={20} style={{ color: '#3b82f6' }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: '#1e293b', margin: '0 0 2px 0', fontSize: '14px' }}>{selectedPromotion.documentName}</p>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Uploaded document</span>
                    </div>
                  </div>
                  <button onClick={(e) => handleViewDocument(e, selectedPromotion)} disabled={docLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                    <FaEye size={14} /> {docLoading ? 'Loading…' : 'View Document'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <FaFileAlt size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontWeight: 500, margin: '0 0 4px 0', color: '#64748b' }}>No document uploaded</p>
                  <span style={{ fontSize: '13px' }}>No promotion order document has been uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ─── LIST VIEW ──────────────────────────────────────────
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by order number, designation or type..."
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
                    <th>Employee Code</th>
                    <th>Order No.</th>
                    <th>Promotion Date</th>
                    <th>Promotion Type</th>
                    <th>Effective Date</th>
                    <th>Authority</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPromotions.length > 0 ? (
                    currentPromotions.map((promo, idx) => {
                      const isActive = promo.isActive !== false;
                      return (
                        <tr key={promo.id} onClick={() => handleRowClick(promo)} style={{ cursor: 'pointer' }} className="cert-table-row-hover">
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td>{promo.employee || 'Unknown'}</td>
                          <td>{promo.employeeCode || '—'}</td>
                          <td><strong>{promo.promotionOrderNumber}</strong></td>
                          <td>{formatDate(promo.promotionDate)}</td>
                          <td>
                            <span className="cert-status-badge" style={{ background: '#dd8aca', color: '#4f46e5' }}>
                              {promo.promotionType}
                            </span>
                          </td>
                          <td>{formatDate(promo.effectiveDate)}</td>
                          <td>{promo.promotionAuthority}</td>
                          <td>
                            <div className="d-flex align-items-center gap-1" style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusToggle(promo.id, promo.employee || '', isActive);
                              }}>
                              <div style={{
                                width: '28px', height: '16px', borderRadius: '50px',
                                backgroundColor: isActive ? '#9d174d' : '#d1d5db',
                                position: 'relative', transition: '.2s'
                              }}>
                                <div style={{
                                  width: '12px', height: '12px', borderRadius: '50%', background: '#fff',
                                  position: 'absolute', top: '2px', left: isActive ? '14px' : '2px', transition: '.2s'
                                }} />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 500, color: isActive ? '#9d174d' : '#94a3b8' }}>
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="cert-actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="cert-act cert-act--edit"
                                onClick={() => handleEdit(promo)}
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
                    <tr><td colSpan="10" className="text-center py-5">No promotion records found</td></tr>
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
                  <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots" style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button key={pg} className={`cert-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}
                        style={{
                          padding: '6px 10px', border: '1px solid #e5e7eb',
                          background: pg === page ? '#9d174d' : 'white',
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px'
                        }}>
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Status Confirmation Modal */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">{statusAction.newStatus === 'Active' ? '✅' : '⛔'}</div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{' '}
              <strong>{statusAction.newStatus === 'Active' ? 'activate' : 'deactivate'}</strong>{' '}
              <strong>{statusAction.name}</strong>'s promotion record?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === 'Inactive'
                ? 'Inactive records cannot be edited until reactivated.'
                : 'This record will become active again.'}
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                <FaFileAlt style={{ marginRight: '8px' }} /> Document Preview
              </h3>
              <button onClick={() => { URL.revokeObjectURL(documentPreview.data); setDocumentPreview(null); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>
                <FaTimes />
              </button>
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
                <a href={documentPreview.data} download={documentPreview.name}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}>
                  <FaFileAlt /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cert-table-row-hover:hover { background-color: #f9fafb; transition: background-color 0.2s ease; }
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
export default PromotionHistory;