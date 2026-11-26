import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaStar, FaArrowLeft, FaSave, FaTasks,
  FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner,
  FaInfoCircle, FaCalendarAlt, FaExclamationCircle,
  FaBuilding, FaSearch, FaBullseye, FaUserCheck
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  extractArray
} from '../config/api.config';
import {
  getNormalizedRole,
  normalizeRole,
  cleanPersonName,
  unwrapResponse,
  calculateEffortFromDates
} from './taskAccess';
import { getStoredUser, fetchScopedEmployeesPool } from './taskScope';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './TaskModule.css';

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildReviewCycle = (from, to) => {
  if (!from || !to) return '';
  return `${formatDateLabel(from)} - ${formatDateLabel(to)}`;
};

const norm = (val) => (val == null ? '' : String(val).trim().toLowerCase());

const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const FieldError = ({ msg }) =>
  msg ? (
    <span className="tm-field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const StarRating = ({ rating, onRatingChange, size = 32, editable = true }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating || 0);

  useEffect(() => {
    setSelectedRating(rating || 0);
  }, [rating]);

  const handleMouseMove = (e, index) => {
    if (!editable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starValue = index + (x / rect.width > 0.5 ? 1 : 0.5);
    setHoverRating(starValue);
  };

  const handleClick = (e, index) => {
    if (!editable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starValue = index + (x / rect.width > 0.5 ? 1 : 0.5);
    setSelectedRating(starValue);
    onRatingChange(starValue);
  };

  const displayRating = hoverRating || selectedRating;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fillPercent = Math.max(0, Math.min(1, displayRating - index)) * 100;
          return (
            <div
              key={index}
              style={{ position: 'relative', display: 'inline-block', cursor: editable ? 'pointer' : 'default' }}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={(e) => handleClick(e, index)}
            >
              <div style={{ color: '#d1d5db' }}><FaStar size={size} /></div>
              <div style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', width: `${fillPercent}%`, color: '#fbbf24' }}>
                <FaStar size={size} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{displayRating.toFixed(1)}</span>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 5.0</span>
      </div>
    </div>
  );
};

const StartPerformanceReview = ({ user }) => {
  const navigate = useNavigate();
  const currentUser = user || getStoredUser();
  const userRole = getNormalizedRole(currentUser);
  const canStartReview = ['Admin', 'Hr', 'Manager'].includes(userRole);
  const isManagerOrHR = userRole === 'Manager' || userRole === 'Hr';

  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);

  // Employee selection filters
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [empSearch, setEmpSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    employeeId: '',
    rating: 0,
    totalGoals: '',
    achievedGoals: '',
    improvementPercent: '',
    fromDate: '',
    toDate: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!canStartReview) {
      setLoadingEmployees(false);
      return;
    }
    let active = true;
    const fetchEmployees = async () => {
      try {
        const [pool, branchRes, deptRes, assigneeRes] = await Promise.all([
          fetchScopedEmployeesPool(currentUser, { includeAssigneesMeta: isManagerOrHR }),
          fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }).catch(() => null),
          fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: getAuthHeaders() }).catch(() => null),
          fetch(API_ENDPOINTS.GET_TASK_ASSIGNEES, { headers: getAuthHeaders() }).catch(() => null),
        ]);
        const [branchJson, deptJson, assigneeJson] = await Promise.all([
          branchRes && branchRes.ok ? branchRes.json().catch(() => null) : Promise.resolve(null),
          deptRes && deptRes.ok ? deptRes.json().catch(() => null) : Promise.resolve(null),
          assigneeRes && assigneeRes.ok ? assigneeRes.json().catch(() => null) : Promise.resolve(null),
        ]);
        if (!active) return;

        const assigneeMetaById = new Map();
        const assigneeMetaByName = new Map();
        if (assigneeJson) {
          extractArray(assigneeJson).forEach(group => {
            (group.employees || []).forEach(emp => {
              const meta = {
                roleName: emp.roleName || emp.role,
                departmentId: emp.departmentId ?? group.departmentId,
                departmentName: emp.departmentName ?? group.departmentName,
                branchId: emp.branchId ?? group.branchId,
                branchName: emp.branchName ?? group.branchName,
              };
              [emp?.id, emp?.employeeId, emp?.userId].forEach(id => {
                if (id != null && String(id).trim() !== '') {
                  assigneeMetaById.set(String(id), meta);
                }
              });
              const n = norm(cleanPersonName(emp?.name));
              if (n && !assigneeMetaByName.has(n)) {
                assigneeMetaByName.set(n, meta);
              }
            });
          });
        }

        const mergedEmployees = (pool.scopedEmployees || []).map(emp => {
          const meta =
            [emp?.id, emp?.employeeId, emp?.userId]
              .map(id => (id != null ? assigneeMetaById.get(String(id)) : null))
              .find(Boolean) ||
            assigneeMetaByName.get(norm(cleanPersonName(emp?.name)));
          if (!meta) return emp;
          return {
            ...emp,
            roleName: emp.roleName || emp.role || meta.roleName,
            departmentId: emp.departmentId ?? emp.department?.id ?? meta.departmentId,
            departmentName: emp.departmentName ?? emp.department?.name ?? meta.departmentName,
            branchId: emp.branchId ?? emp.branch?.id ?? meta.branchId,
            branchName: emp.branchName ?? emp.branch?.name ?? meta.branchName,
          };
        });

        setEmployees(mergedEmployees);
        const fetchedDepts = deptJson ? extractArray(deptJson) : [];
        setDepartments(fetchedDepts.length > 0 ? fetchedDepts : (pool.departments || []));
        if (branchJson) setBranches(extractArray(branchJson));
      } catch {
        if (active) toast.error('Error', 'Failed to load employees');
      } finally {
        if (active) setLoadingEmployees(false);
      }
    };
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve branch & department metadata on each scoped employee
  const enrichedEmployees = useMemo(() => {
    const branchById = new Map();
    const branchByName = new Map();
    branches.forEach(b => {
      if (b?.id != null) branchById.set(String(b.id), b);
      if (b?.name) branchByName.set(norm(b.name), b);
    });

    const deptById = new Map();
    const deptByBranchAndName = new Map();
    const deptByName = new Map();
    departments.forEach(d => {
      if (d?.id != null) deptById.set(String(d.id), d);
      const dBranchId = d?.branchId ?? d?.branch?.id ?? null;
      if (d?.name) {
        if (dBranchId != null) {
          deptByBranchAndName.set(`${dBranchId}:${norm(d.name)}`, d);
        }
        if (!deptByName.has(norm(d.name))) deptByName.set(norm(d.name), d);
      }
    });

    return employees.map(emp => {
      const empRawBranchId = emp.branchId ?? emp.branch?.id ?? null;
      const empRawBranchName =
        emp.branchName ||
        (typeof emp.branch === 'object' ? emp.branch?.name : typeof emp.branch === 'string' && isNaN(Number(emp.branch)) ? emp.branch : '') ||
        '';
      const empBranchObj =
        (empRawBranchId != null ? branchById.get(String(empRawBranchId)) : null) ||
        (empRawBranchName ? branchByName.get(norm(empRawBranchName)) : null);
      const effectiveEmpBranchId = empRawBranchId ?? empBranchObj?.id ?? null;

      const rawDeptId = emp.departmentId ?? emp.department?.id ?? null;
      const rawDeptName =
        emp.departmentName ||
        (typeof emp.department === 'object' ? emp.department?.name : typeof emp.department === 'string' && isNaN(Number(emp.department)) ? emp.department : '') ||
        '';
      const deptObj =
        (rawDeptId != null ? deptById.get(String(rawDeptId)) : null) ||
        (effectiveEmpBranchId != null && rawDeptName ? deptByBranchAndName.get(`${effectiveEmpBranchId}:${norm(rawDeptName)}`) : null) ||
        (rawDeptName ? deptByName.get(norm(rawDeptName)) : null);

      const resolvedDeptId = rawDeptId ?? deptObj?.id ?? null;
      const resolvedDeptName = rawDeptName || deptObj?.name || 'No Dept';

      const rawBranchId =
        effectiveEmpBranchId ??
        deptObj?.branchId ??
        deptObj?.branch?.id ??
        null;
      const rawBranchName =
        empRawBranchName ||
        empBranchObj?.name ||
        deptObj?.branchName ||
        (typeof deptObj?.branch === 'object' ? deptObj.branch?.name : typeof deptObj?.branch === 'string' && isNaN(Number(deptObj.branch)) ? deptObj.branch : '') ||
        '';
      const branchObj =
        (rawBranchId != null ? branchById.get(String(rawBranchId)) : null) ||
        (rawBranchName ? branchByName.get(norm(rawBranchName)) : null);

      const resolvedBranchId = rawBranchId ?? branchObj?.id ?? null;
      const resolvedBranchName = rawBranchName || branchObj?.name || '';
      const resolvedRole = normalizeRole(emp.roleName || emp.role) || emp.roleName || emp.role || 'Employee';

      return {
        ...emp,
        cleanName: cleanPersonName(emp.name) || emp.name || `Emp #${emp.id}`,
        resolvedDeptId: resolvedDeptId != null ? String(resolvedDeptId) : '',
        resolvedDeptName,
        resolvedBranchId: resolvedBranchId != null ? String(resolvedBranchId) : '',
        resolvedBranchName,
        resolvedRole,
      };
    });
  }, [employees, branches, departments]);

  // Unified Branch options
  const branchOptions = useMemo(() => {
    const map = new Map();
    const seenNames = new Set();

    const addBranch = (id, name) => {
      if (!name) return;
      const cleanName = name.trim();
      const key = id != null && String(id).trim() !== '' ? String(id) : `name:${norm(cleanName)}`;
      if (map.has(key)) return;
      if (key.startsWith('name:') && seenNames.has(norm(cleanName))) return;
      seenNames.add(norm(cleanName));
      map.set(key, cleanName);
    };

    if (!isManagerOrHR) {
      branches.forEach(b => addBranch(b?.id, b?.name));
    }
    enrichedEmployees.forEach(emp => addBranch(emp.resolvedBranchId, emp.resolvedBranchName));

    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [branches, enrichedEmployees, isManagerOrHR]);

  // Department options strictly scoped by selected Branch and identified by Department ID
  const deptOptions = useMemo(() => {
    const branchNameById = new Map();
    branches.forEach(b => {
      if (b?.id != null && b?.name) branchNameById.set(String(b.id), b.name);
    });

    const selectedBranchLabel = branchOptions.find(([id]) => id === branchFilter)?.[1] || '';
    const matchesSelectedBranch = (bId, bName) => {
      if (branchFilter === 'ALL') return true;
      if (branchFilter.startsWith('name:')) {
        return norm(bName) === branchFilter.slice(5);
      }
      if (bId != null && String(bId) !== '') {
        return String(bId) === String(branchFilter);
      }
      return Boolean(selectedBranchLabel && bName && norm(bName) === norm(selectedBranchLabel));
    };

    const entries = new Map();
    const nameCounts = new Map();

    const addDeptEntry = (id, name, bName) => {
      if (!name || name === 'No Dept') return;
      const cleanName = name.trim();
      const key = id != null && String(id).trim() !== '' ? String(id) : `name:${norm(cleanName)}`;
      if (!entries.has(key)) {
        entries.set(key, { key, name: cleanName, branchName: bName || '' });
      }
    };

    if (!isManagerOrHR) {
      departments.forEach(d => {
        if (!d?.name) return;
        const dBranchId = d.branchId ?? d.branch?.id ?? null;
        const dBranchName =
          d.branchName ??
          d.branch?.name ??
          (dBranchId != null ? branchNameById.get(String(dBranchId)) : '') ??
          '';
        if (matchesSelectedBranch(dBranchId, dBranchName)) {
          addDeptEntry(d.id, d.name, dBranchName);
        }
      });
    }

    enrichedEmployees.forEach(emp => {
      if (!matchesSelectedBranch(emp.resolvedBranchId, emp.resolvedBranchName)) return;
      if (emp.resolvedDeptId && entries.has(emp.resolvedDeptId)) return;
      if (!emp.resolvedDeptId && [...entries.values()].some(e => norm(e.name) === norm(emp.resolvedDeptName))) return;
      addDeptEntry(emp.resolvedDeptId, emp.resolvedDeptName, emp.resolvedBranchName);
    });

    const list = [...entries.values()];
    list.forEach(item => {
      const n = norm(item.name);
      nameCounts.set(n, (nameCounts.get(n) || 0) + 1);
    });

    return list
      .map(item => [
        item.key,
        branchFilter === 'ALL' && nameCounts.get(norm(item.name)) > 1 && item.branchName
          ? `${item.name} (${item.branchName})`
          : item.name,
      ])
      .sort((a, b) => a[1].localeCompare(b[1]));
  }, [branches, departments, enrichedEmployees, branchFilter, branchOptions, isManagerOrHR]);

  const roleOptions = useMemo(() => {
    const set = new Set();
    enrichedEmployees.forEach(emp => {
      if (emp.resolvedRole) set.add(emp.resolvedRole);
    });
    return [...set].sort();
  }, [enrichedEmployees]);

  const filteredEmployees = useMemo(() => {
    const selectedBranchLabel = branchOptions.find(([id]) => id === branchFilter)?.[1] || '';
    const selectedDeptRaw = deptOptions.find(([id]) => id === deptFilter)?.[1] || '';
    const selectedDeptLabel = selectedDeptRaw.replace(/\s*\([^)]*\)$/, '');
    const selectedDeptObj = departments.find(d => String(d.id) === String(deptFilter));
    const selectedDeptBranchId = selectedDeptObj?.branchId ?? selectedDeptObj?.branch?.id ?? null;
    const selectedDeptBranchName =
      selectedDeptObj?.branchName ||
      selectedDeptObj?.branch?.name ||
      branches.find(b => String(b.id) === String(selectedDeptBranchId))?.name ||
      selectedBranchLabel ||
      '';
    const q = empSearch.trim().toLowerCase();

    return enrichedEmployees
      .filter(emp => {
        if (branchFilter !== 'ALL') {
          if (branchFilter.startsWith('name:')) {
            if (norm(emp.resolvedBranchName) !== branchFilter.slice(5)) return false;
          } else {
            const idMatch = emp.resolvedBranchId && emp.resolvedBranchId === String(branchFilter);
            const nameMatch = selectedBranchLabel && emp.resolvedBranchName && norm(emp.resolvedBranchName) === norm(selectedBranchLabel);
            if (!idMatch && !nameMatch) return false;
          }
        }

        if (deptFilter !== 'ALL') {
          if (deptFilter.startsWith('name:')) {
            if (norm(emp.resolvedDeptName) !== deptFilter.slice(5)) return false;
          } else {
            const idMatch = emp.resolvedDeptId && emp.resolvedDeptId === String(deptFilter);
            const deptNameMatch = selectedDeptLabel && emp.resolvedDeptName && norm(emp.resolvedDeptName) === norm(selectedDeptLabel);
            const sameBranch =
              (!selectedDeptBranchId && !selectedDeptBranchName) ||
              (selectedDeptBranchId != null && emp.resolvedBranchId && String(emp.resolvedBranchId) === String(selectedDeptBranchId)) ||
              (selectedDeptBranchName && emp.resolvedBranchName && norm(emp.resolvedBranchName) === norm(selectedDeptBranchName));
            if (!idMatch && !(deptNameMatch && sameBranch)) return false;
          }
        }

        if (roleFilter !== 'ALL' && emp.resolvedRole !== roleFilter) return false;

        if (q) {
          const matches =
            emp.cleanName.toLowerCase().includes(q) ||
            emp.resolvedDeptName.toLowerCase().includes(q) ||
            emp.resolvedBranchName.toLowerCase().includes(q) ||
            emp.resolvedRole.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => a.cleanName.localeCompare(b.cleanName));
  }, [enrichedEmployees, departments, branches, branchFilter, deptFilter, roleFilter, empSearch, branchOptions, deptOptions]);

  const hasEmployeeFilters =
    branchFilter !== 'ALL' || deptFilter !== 'ALL' || roleFilter !== 'ALL' || empSearch.trim() !== '';

  const clearEmployeeFilters = () => {
    setBranchFilter('ALL');
    setDeptFilter('ALL');
    setRoleFilter('ALL');
    setEmpSearch('');
  };

  const fetchEmployeeStats = async (employeeId) => {
    if (!employeeId) return;
    if (!employees.some(emp => String(emp.id) === String(employeeId))) {
      toast.warning('Access Denied', 'You can only review your own employees');
      return;
    }
    setLoadingStats(true);
    try {
      const response = await fetch(
        API_ENDPOINTS.GET_EMPLOYEE_TASK_STATS(employeeId),
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        const stats = unwrapResponse(data);
        if (stats?.employeeName) stats.employeeName = cleanPersonName(stats.employeeName);
        setEmployeeStats(stats);

        const totalTasks = stats?.totalAssigned || 0;
        const completedTasks = stats?.completed || 0;
        const inProgressTasks = stats?.inProgress || 0;
        const achievedGoals = completedTasks + Math.floor(inProgressTasks * 0.5);
        const improvementPercent = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

        setFormData(prev => ({
          ...prev,
          totalGoals: totalTasks.toString(),
          achievedGoals: achievedGoals.toString(),
          improvementPercent,
        }));
        setSelectedEmployee(enrichedEmployees.find(emp => String(emp.id) === String(employeeId)) || null);
      } else {
        setEmployeeStats(null);
        setSelectedEmployee(enrichedEmployees.find(emp => String(emp.id) === String(employeeId)) || null);
      }
    } catch {
      setEmployeeStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setFormData(prev => ({
      ...prev,
      employeeId,
      rating: 0,
      totalGoals: '',
      achievedGoals: '',
      improvementPercent: '',
    }));
    setEmployeeStats(null);
    setSelectedEmployee(employeeId ? (enrichedEmployees.find(emp => String(emp.id) === String(employeeId)) || null) : null);
    if (employeeId) fetchEmployeeStats(employeeId);
    if (errors.employeeId) setErrors(prev => ({ ...prev, employeeId: '' }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) setErrors(prev => ({ ...prev, rating: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if ((name === 'totalGoals' || name === 'achievedGoals') && newFormData.totalGoals && newFormData.achievedGoals) {
      const total = parseFloat(newFormData.totalGoals) || 0;
      const achieved = parseFloat(newFormData.achievedGoals) || 0;
      if (total > 0) newFormData.improvementPercent = ((achieved / total) * 100).toFixed(1);
    }

    if (name === 'fromDate' && newFormData.toDate && value > newFormData.toDate) {
      newFormData.toDate = '';
    }

    setFormData(newFormData);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const applyPeriodPreset = (daysBack) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysBack);
    const fromDate = toIsoDate(start);
    const toDate = toIsoDate(end);
    setFormData(prev => ({ ...prev, fromDate, toDate }));
    setErrors(prev => ({ ...prev, fromDate: '', toDate: '' }));
  };

  const validateField = (field, value) => {
    let error = '';
    switch (field) {
      case 'employeeId':
        if (!value) error = 'Please select an employee';
        break;
      case 'rating':
        if (!value || value < 0.5) error = 'Please provide a rating';
        break;
      case 'totalGoals':
        if (!value) error = 'Total goals is required';
        else if (parseInt(value, 10) < 1) error = 'Must be at least 1';
        break;
      case 'achievedGoals':
        if (value === '') error = 'Achieved goals is required';
        else if (parseInt(value, 10) < 0) error = 'Cannot be negative';
        else if (formData.totalGoals && parseInt(value, 10) > parseInt(formData.totalGoals, 10)) {
          error = 'Cannot exceed total goals';
        }
        break;
      case 'fromDate':
        if (!value) error = 'Start date is required';
        break;
      case 'toDate':
        if (!value) error = 'End date is required';
        else if (formData.fromDate && value <= formData.fromDate) error = 'End date must be after start date';
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fields = ['employeeId', 'rating', 'totalGoals', 'achievedGoals', 'fromDate', 'toDate'];
    const newErrors = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return Object.keys(newErrors).length === 0;
  };

  const getStatusFromRating = (rating) => {
    if (!rating) return 'Not Rated';
    if (rating >= 4.8) return 'Outstanding';
    if (rating >= 4.4) return 'Excellent';
    if (rating >= 4.0) return 'Great';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.0) return 'Needs Improvement';
    return 'Poor';
  };

  const getStatusColor = (rating) => {
    if (!rating) return '#6b7280';
    if (rating >= 4.8) return '#10b981';
    if (rating >= 4.4) return '#34d399';
    if (rating >= 4.0) return '#3b82f6';
    if (rating >= 3.5) return '#f59e0b';
    if (rating >= 2.0) return '#f97316';
    return '#ef4444';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    if (!employees.some(emp => String(emp.id) === String(formData.employeeId))) {
      toast.error('Access Denied', 'You can only submit reviews for your own employees');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employeeId: parseInt(formData.employeeId, 10),
        rating: parseFloat(formData.rating),
        totalGoals: parseInt(formData.totalGoals, 10),
        achievedGoals: parseInt(formData.achievedGoals, 10),
        improvementPercent: formData.improvementPercent || null,
        reviewCycle: buildReviewCycle(formData.fromDate, formData.toDate),
      };

      const response = await fetch(API_ENDPOINTS.GET_PERFORMANCE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start review');
      }

      toast.success('Success', `Performance review saved for ${selectedEmployee?.cleanName || selectedEmployee?.name || 'employee'}`);
      setTimeout(() => navigate('/performance'), 1000);
    } catch (err) {
      toast.error('Error', err.message || 'Failed to start review');
    } finally {
      setLoading(false);
    }
  };

  const calculateGoalPercentage = () => {
    if (!formData.totalGoals || !formData.achievedGoals) return 0;
    const total = parseFloat(formData.totalGoals) || 0;
    const achieved = parseFloat(formData.achievedGoals) || 0;
    return total > 0 ? Math.round((achieved / total) * 100) : 0;
  };

  const getInitials = (name) => {
    const clean = cleanPersonName(name);
    if (!clean) return '?';
    return clean
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  };

  const cycleDurationLabel = calculateEffortFromDates(formData.toDate, formData.fromDate);
  const fieldErrClass = (field) => (errors[field] && touched[field] ? 'has-error' : '');
  const fieldOkClass = (field) => (touched[field] && !errors[field] && formData[field] ? 'has-ok' : '');

  const readinessSteps = [
    { label: 'Employee', done: Boolean(formData.employeeId) },
    { label: 'Rating', done: Number(formData.rating) >= 0.5 },
    { label: 'Goals', done: Boolean(formData.totalGoals && formData.achievedGoals !== '') },
    { label: 'Period', done: Boolean(formData.fromDate && formData.toDate) },
  ];

  if (loadingEmployees) return <LoadingSpinner message="Loading employees…" />;

  if (!canStartReview) {
    return (
      <div className="tm-page tm-page--narrow">
        <div className="tm-card tm-card--padded" style={{ textAlign: 'center', padding: 36 }}>
          <h2 className="tm-title" style={{ marginBottom: 8 }}>Access Restricted</h2>
          <p className="tm-subtitle" style={{ justifyContent: 'center', marginBottom: 16 }}>
            Only Admin, HR, and Managers can create performance reviews for their employees.
          </p>
          <button type="button" className="tm-btn tm-btn-primary" onClick={() => navigate('/performance')}>
            <FaArrowLeft size={11} /> Back to Performance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tm-page">
      {/* Enhanced Hero Header */}
      <div className="tm-create-hero">
        <div className="tm-header-left">
          <div className="tm-header-icon">
            <FaStar />
          </div>
          <div>
            <h1 className="tm-title">Start Performance Review</h1>
            <p className="tm-subtitle">
              <span className="tm-role-pill">{userRole}</span>
              <span>Evaluate employee task completion and set cycle goals</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="tm-create-steps">
            {readinessSteps.map(step => (
              <span key={step.label} className={`tm-create-step-chip ${step.done ? 'done' : ''}`}>
                <FaCheckCircle size={10} /> {step.label}
              </span>
            ))}
          </div>
          <button type="button" className="tm-btn tm-btn-secondary" onClick={() => navigate('/performance')}>
            <FaArrowLeft size={11} /> Back
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="tm-create-layout">
          {/* LEFT COLUMN: Filtered Employee Selection, Task Execution Metrics, & Goal Setting */}
          <div className="tm-create-col">
            {/* Employee Filter & Selection */}
            <div className="tm-form-section">
              <div className="tm-form-section-head">
                <h3 className="tm-form-section-title">
                  <FaUserCheck size={13} color="var(--tm-primary)" /> Select Employee
                </h3>
                <span className="tm-count-badge">
                  {filteredEmployees.length} of {employees.length} eligible
                </span>
              </div>

              {/* Branch / Department / Role / Search Filters */}
              <div
                style={{
                  padding: '12px',
                  background: 'var(--tm-bg-surface)',
                  border: '1px solid var(--tm-border)',
                  borderRadius: 'var(--tm-radius-sm)',
                  marginBottom: 14,
                }}
              >
                <div className="tm-form-grid-2" style={{ gap: 10 }}>
                  {branchOptions.length > 0 && (
                    <div className="tm-field">
                      <label style={{ fontSize: 11.5 }}>Branch</label>
                      <select
                        className="tm-select tm-select--compact"
                        style={{ height: 34 }}
                        value={branchFilter}
                        onChange={e => {
                          setBranchFilter(e.target.value);
                          setDeptFilter('ALL');
                          setFormData(prev => ({ ...prev, employeeId: '', totalGoals: '', achievedGoals: '', improvementPercent: '' }));
                          setSelectedEmployee(null);
                          setEmployeeStats(null);
                        }}
                      >
                        <option value="ALL">All Branches ({branchOptions.length})</option>
                        {branchOptions.map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {deptOptions.length > 0 && (
                    <div className="tm-field">
                      <label style={{ fontSize: 11.5 }}>Department</label>
                      <select
                        className="tm-select tm-select--compact"
                        style={{ height: 34 }}
                        value={deptFilter}
                        onChange={e => {
                          setDeptFilter(e.target.value);
                          setFormData(prev => ({ ...prev, employeeId: '', totalGoals: '', achievedGoals: '', improvementPercent: '' }));
                          setSelectedEmployee(null);
                          setEmployeeStats(null);
                        }}
                      >
                        <option value="ALL">All Departments ({deptOptions.length})</option>
                        {deptOptions.map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isManagerOrHR && roleOptions.length > 1 && (
                    <div className="tm-field">
                      <label style={{ fontSize: 11.5 }}>Role</label>
                      <select
                        className="tm-select tm-select--compact"
                        style={{ height: 34 }}
                        value={roleFilter}
                        onChange={e => {
                          setRoleFilter(e.target.value);
                          setFormData(prev => ({ ...prev, employeeId: '', totalGoals: '', achievedGoals: '', improvementPercent: '' }));
                          setSelectedEmployee(null);
                          setEmployeeStats(null);
                        }}
                      >
                        <option value="ALL">All Roles ({enrichedEmployees.length})</option>
                        {roleOptions.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="tm-field">
                    <div className="tm-field-label-row">
                      <label style={{ fontSize: 11.5 }}>Search Employee</label>
                      {hasEmployeeFilters && (
                        <button
                          type="button"
                          className="tm-btn tm-btn-ghost tm-btn-sm"
                          style={{ height: 22, padding: '0 8px', fontSize: 11 }}
                          onClick={clearEmployeeFilters}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="tm-search-wrap" style={{ width: '100%', minWidth: 0 }}>
                      <FaSearch size={11} className="tm-search-icon" />
                      <input
                        type="text"
                        className="tm-input"
                        style={{ height: 34, fontSize: 12.5 }}
                        placeholder="Search by name, dept, branch…"
                        value={empSearch}
                        onChange={e => setEmpSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`tm-field ${fieldErrClass('employeeId')} ${fieldOkClass('employeeId')}`}>
                <label>Employee <span className="tm-req">*</span></label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleEmployeeChange}
                  onBlur={() => handleBlur('employeeId')}
                >
                  <option value="">
                    {employees.length === 0
                      ? 'No eligible employees under your scope'
                      : filteredEmployees.length === 0
                        ? 'No employees match current filters'
                        : `Choose an employee (${filteredEmployees.length})...`}
                  </option>
                  {filteredEmployees.map(emp => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.cleanName} · {emp.resolvedDeptName}{emp.resolvedBranchName ? ` (${emp.resolvedBranchName})` : ''} · {emp.resolvedRole}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.employeeId} />

                {selectedEmployee && (
                  <div className="tm-assignee-preview" style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div className="tm-assignee-avatar">{getInitials(selectedEmployee.cleanName)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--tm-text-primary)' }}>
                          {selectedEmployee.cleanName}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--tm-text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <FaBuilding size={10} />
                          <span>{selectedEmployee.resolvedDeptName}</span>
                          {selectedEmployee.resolvedBranchName && <span>· {selectedEmployee.resolvedBranchName}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="tm-role-pill">{selectedEmployee.resolvedRole}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Employee Statistics */}
            {loadingStats && (
              <div className="tm-form-section" style={{ textAlign: 'center', padding: '24px' }}>
                <FaSpinner className="emp-spinner" /> Loading employee task statistics...
              </div>
            )}
            {employeeStats && !loadingStats && (
              <div className="tm-form-section">
                <div className="tm-form-section-head">
                  <h3 className="tm-form-section-title">
                    <FaTasks size={13} color="var(--tm-primary)" /> Task Execution Metrics
                  </h3>
                  <span className="tm-form-section-sub">Live task completion stats</span>
                </div>
                <div className="tm-perf-metrics-grid">
                  <div className="tm-perf-metric-card" style={{ borderLeftColor: 'var(--tm-primary)' }}>
                    <FaTasks style={{ fontSize: 18, color: 'var(--tm-primary)' }} />
                    <div className="tm-kpi-label" style={{ marginTop: 6 }}>Total Assigned</div>
                    <div className="tm-kpi-value">{employeeStats.totalAssigned || 0}</div>
                  </div>
                  <div className="tm-perf-metric-card" style={{ borderLeftColor: '#d97706' }}>
                    <FaClock style={{ fontSize: 18, color: '#d97706' }} />
                    <div className="tm-kpi-label" style={{ marginTop: 6 }}>In Progress</div>
                    <div className="tm-kpi-value">{employeeStats.inProgress || 0}</div>
                  </div>
                  <div className="tm-perf-metric-card" style={{ borderLeftColor: '#16a34a' }}>
                    <FaCheckCircle style={{ fontSize: 18, color: '#16a34a' }} />
                    <div className="tm-kpi-label" style={{ marginTop: 6 }}>Completed</div>
                    <div className="tm-kpi-value">{employeeStats.completed || 0}</div>
                  </div>
                  <div className="tm-perf-metric-card" style={{ borderLeftColor: '#dc2626' }}>
                    <FaExclamationTriangle style={{ fontSize: 18, color: '#dc2626' }} />
                    <div className="tm-kpi-label" style={{ marginTop: 6 }}>Overdue</div>
                    <div className="tm-kpi-value">{employeeStats.overdue || 0}</div>
                  </div>
                </div>
                <div className="tm-info-callout">
                  <FaInfoCircle size={12} />
                  <span>Goals have been pre-populated from real task completion statistics and can be adjusted below.</span>
                </div>
              </div>
            )}

            {/* Goal Setting */}
            <div className="tm-form-section">
              <div className="tm-form-section-head">
                <h3 className="tm-form-section-title">
                  <FaBullseye size={13} color="var(--tm-primary)" /> Goal Setting
                </h3>
                <span className="tm-form-section-sub">Cycle targets &amp; completion ratio</span>
              </div>
              <div className="tm-form-grid-3">
                <div className={`tm-field ${fieldErrClass('totalGoals')}`}>
                  <label>Total Goals <span className="tm-req">*</span></label>
                  <input type="number" name="totalGoals" value={formData.totalGoals} onChange={handleInputChange} onBlur={() => handleBlur('totalGoals')} min="1" placeholder="e.g., 10" />
                  <FieldError msg={errors.totalGoals} />
                </div>
                <div className={`tm-field ${fieldErrClass('achievedGoals')}`}>
                  <label>Achieved Goals <span className="tm-req">*</span></label>
                  <input type="number" name="achievedGoals" value={formData.achievedGoals} onChange={handleInputChange} onBlur={() => handleBlur('achievedGoals')} min="0" max={formData.totalGoals || 999} placeholder="e.g., 8" />
                  <FieldError msg={errors.achievedGoals} />
                </div>
                <div className="tm-field">
                  <label>Goal Completion %</label>
                  <input type="text" name="improvementPercent" value={formData.improvementPercent ? `${formData.improvementPercent}%` : ''} placeholder="Auto-calculated" readOnly />
                </div>
              </div>

              {Number(formData.totalGoals) > 0 && (
                <div className="tm-goal-preview">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span>Goal Achievement Progress</span>
                    <span style={{ fontWeight: 700, color: 'var(--tm-primary)' }}>{calculateGoalPercentage()}%</span>
                  </div>
                  <div className="tm-progress-track tm-progress-track--lg">
                    <div
                      className={`tm-progress-fill ${calculateGoalPercentage() >= 100 ? 'tm-progress-fill--done' : ''}`}
                      style={{ width: `${Math.min(100, calculateGoalPercentage())}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Star Rating, Review Period, & Live Review Summary */}
          <div className="tm-create-col">
            {/* Star Rating Section */}
            <div className="tm-form-section">
              <div className="tm-form-section-head">
                <h3 className="tm-form-section-title">
                  <FaStar size={13} color="#f59e0b" /> Performance Rating
                </h3>
                <span className="tm-form-section-sub">Half-star precision (0.5–5.0)</span>
              </div>
              <div className={`tm-field ${fieldErrClass('rating')}`}>
                <label>Rating (1–5 Stars) <span className="tm-req">*</span></label>
                <div className="tm-star-box">
                  <StarRating rating={formData.rating} onRatingChange={handleRatingChange} size={38} />
                </div>
                {formData.rating > 0 && (
                  <div className="tm-tier-row">
                    <span style={{ fontSize: 13 }}>Performance Tier:</span>
                    <span className="tm-tier-pill" style={{ backgroundColor: `${getStatusColor(formData.rating)}20`, color: getStatusColor(formData.rating) }}>
                      {getStatusFromRating(formData.rating)}
                    </span>
                  </div>
                )}
                <FieldError msg={errors.rating} />
              </div>
            </div>

            {/* Review Period */}
            <div className="tm-form-section">
              <div className="tm-form-section-head">
                <h3 className="tm-form-section-title">
                  <FaCalendarAlt size={13} color="var(--tm-primary)" /> Review Period
                </h3>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {[
                    { label: '30D', days: 30 },
                    { label: '90D', days: 90 },
                    { label: '6M', days: 180 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      className="tm-filter-pill"
                      style={{ padding: '2px 9px', fontSize: 11 }}
                      onClick={() => applyPeriodPreset(preset.days)}
                    >
                      Last {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="tm-form-grid-2">
                <div className={`tm-field ${fieldErrClass('fromDate')}`}>
                  <label>Start Date <span className="tm-req">*</span></label>
                  <input type="date" name="fromDate" value={formData.fromDate} max={today} onChange={handleInputChange} onBlur={() => handleBlur('fromDate')} />
                  <FieldError msg={errors.fromDate} />
                </div>
                <div className={`tm-field ${fieldErrClass('toDate')}`}>
                  <label>End Date <span className="tm-req">*</span></label>
                  <input type="date" name="toDate" value={formData.toDate} min={formData.fromDate || undefined} max={today} onChange={handleInputChange} onBlur={() => handleBlur('toDate')} disabled={!formData.fromDate} />
                  <FieldError msg={errors.toDate} />
                </div>
                <div className="tm-field tm-col-span-full">
                  <label>Cycle Duration</label>
                  <input type="text" value={cycleDurationLabel} placeholder="Auto-calculated" readOnly />
                </div>
              </div>

              {formData.fromDate && formData.toDate && (
                <div className="tm-info-callout" style={{ marginTop: 12 }}>
                  <FaCalendarAlt size={12} />
                  <span>Review cycle: <strong>{buildReviewCycle(formData.fromDate, formData.toDate)}</strong>{cycleDurationLabel ? ` (${cycleDurationLabel})` : ''}</span>
                </div>
              )}
            </div>

            {/* Live Review Summary */}
            <div className="tm-summary-card">
              <h4 className="tm-summary-title">
                <span>Review Summary</span>
                {formData.rating > 0 && (
                  <span
                    className="tm-tier-pill"
                    style={{
                      backgroundColor: `${getStatusColor(formData.rating)}20`,
                      color: getStatusColor(formData.rating),
                      fontSize: 11,
                      padding: '2px 9px',
                    }}
                  >
                    {getStatusFromRating(formData.rating)}
                  </span>
                )}
              </h4>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Employee</span>
                <span className="tm-summary-val">{selectedEmployee?.cleanName || 'Not selected'}</span>
              </div>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Department</span>
                <span className="tm-summary-val">{selectedEmployee?.resolvedDeptName || '—'}</span>
              </div>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Rating</span>
                <span className="tm-summary-val">
                  {formData.rating > 0 ? `${formData.rating.toFixed(1)} / 5.0` : 'Not rated'}
                </span>
              </div>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Goals</span>
                <span className="tm-summary-val">
                  {formData.totalGoals ? `${formData.achievedGoals || 0}/${formData.totalGoals} (${calculateGoalPercentage()}%)` : '—'}
                </span>
              </div>
              <div className="tm-summary-row">
                <span className="tm-summary-key">Cycle</span>
                <span className="tm-summary-val">
                  {formData.fromDate && formData.toDate ? buildReviewCycle(formData.fromDate, formData.toDate) : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="tm-form-footer" style={{ marginTop: 16 }}>
          <button type="button" className="tm-btn tm-btn-secondary" onClick={() => navigate('/performance')} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="tm-btn tm-btn-primary" disabled={loading}>
            {loading ? <><span className="tm-spinner" /> Saving Review...</> : <><FaSave size={12} /> Submit Performance Review</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartPerformanceReview;
