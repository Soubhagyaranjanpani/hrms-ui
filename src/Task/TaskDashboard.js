import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  FaTasks, FaClock, FaCheckCircle, FaSpinner, FaSearch,
  FaExclamationTriangle, FaArrowRight, FaEye, FaEdit, FaPlus,
  FaChartBar, FaPercent, FaClipboardCheck, FaChevronLeft,
  FaChevronRight, FaCalendarAlt, FaBuilding, FaSitemap, FaStar
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  extractArray
} from '../config/api.config';
import {
  getNormalizedRole,
  getMyId,
  cleanPersonName
} from './taskAccess';
import { getStoredUser, scopeEmployeesForRole, getMyOrgScope, collectMyIds, getTokenClaims } from './taskScope';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './TaskModule.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PRIORITY_COLORS = { Critical: '#991b1b', High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };
const PRIORITY_BG     = { Critical: '#fee2e2', High: '#fef2f2', Medium: '#fef3c7', Low: '#dcfce7' };

const STATUS_META = {
  PENDING_APPROVAL: { label: 'Pending Approval', bg: '#fef3c7', color: '#92400e', chartColor: '#f59e0b' },
  IN_PROGRESS:      { label: 'In Progress',      bg: '#dbeafe', color: '#1e40af', chartColor: '#2563eb' },
  IN_REVIEW:        { label: 'In Review',        bg: '#fef3c7', color: '#92400e', chartColor: '#d97706' },
  CHANGE_REQUESTED: { label: 'Change Requested', bg: '#fff7ed', color: '#c2410c', chartColor: '#f97316' },
  COMPLETED:        { label: 'Completed',        bg: '#dcfce7', color: '#166534', chartColor: '#16a34a' },
  REJECTED:         { label: 'Rejected',         bg: '#fee2e2', color: '#991b1b', chartColor: '#dc2626' },
};

const normalizePriority = (priority) => {
  if (!priority) return 'Medium';
  const u = String(priority).toUpperCase();
  if (u === 'CRITICAL') return 'Critical';
  if (u === 'HIGH')     return 'High';
  if (u === 'MEDIUM')   return 'Medium';
  if (u === 'LOW')      return 'Low';
  return u.charAt(0) + u.slice(1).toLowerCase();
};

const StatusBadge = ({ status }) => {
  const s = STATUS_META[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span className="tm-status-badge" style={{ background: s.bg, color: s.color }}>
      <span className="tm-status-dot" />
      {s.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const p = normalizePriority(priority);
  return (
    <span className="tm-status-badge" style={{ background: PRIORITY_BG[p] || '#f1f5f9', color: PRIORITY_COLORS[p] || '#475569' }}>
      {p}
    </span>
  );
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

const KpiCard = ({ label, value, icon, accentBg, accentColor, sub, active, onClick }) => (
  <div
    onClick={onClick}
    className={`tm-kpi-card tm-kpi-card--compact ${onClick ? 'tm-kpi-card--clickable' : ''} ${active ? 'tm-kpi-card--active' : ''}`}
    style={{
      borderLeftColor: active ? accentColor : accentBg,
      borderColor: active ? accentColor : undefined,
      boxShadow: active ? `0 0 0 1px ${accentColor}33` : undefined,
    }}
  >
    <div className="tm-kpi-top">
      <span className="tm-kpi-label">{label}</span>
      <div className="tm-kpi-icon" style={{ background: accentBg, color: accentColor }}>
        {icon}
      </div>
    </div>
    <div className="tm-kpi-bottom">
      <div className="tm-kpi-value">{value}</div>
      {sub && <div className="tm-kpi-sub">{sub}</div>}
    </div>
  </div>
);

const STATUS_DONUT_ORDER = [
  'PENDING_APPROVAL',
  'IN_PROGRESS',
  'IN_REVIEW',
  'CHANGE_REQUESTED',
  'COMPLETED',
  'REJECTED',
];

export default function TaskDashboard({ user }) {
  const navigate    = useNavigate();
  const currentUser = user || getStoredUser();
  const userRole    = getNormalizedRole(currentUser);
  const myId        = getMyId(currentUser);
  const isEmployee  = userRole === 'Employee';
  const isAdmin     = userRole === 'Admin';
  const isHR        = userRole === 'Hr';
  const isManager   = userRole === 'Manager';
  const canCreate   = ['Admin', 'Hr', 'Manager'].includes(userRole);

  const [tasks,       setTasks]       = useState([]);
  const [branches,    setBranches]    = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  // Role-based drill-down filters
  const [selectedBranch,  setSelectedBranch]  = useState('ALL');
  const [selectedDept,    setSelectedDept]    = useState('ALL');
  const [selectedManager, setSelectedManager] = useState('ALL');

  // Table filters & pagination
  const [statusFilter,   setStatusFilter]   = useState('ALL'); // 'ALL' | status enum | 'OVERDUE' | 'PENDING_REVIEWS'
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm,     setSearchTerm]     = useState('');
  const [currentPage,    setCurrentPage]    = useState(1);
  const [pageSize,       setPageSize]       = useState(6);

  useEffect(() => {
    let active = true;
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const tasksUrl = isEmployee ? API_ENDPOINTS.GET_MY_TASKS : API_ENDPOINTS.GET_ALL_TASKS;

        const requests = [
          fetch(tasksUrl, { headers: getAuthHeaders() }),
        ];

        if (!isEmployee) {
          requests.push(
            fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }),
            fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: getAuthHeaders() })
          );
          if (isManager || isHR) {
            requests.push(
              fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=200`, { headers: getAuthHeaders() }).catch(() => null),
              fetch(API_ENDPOINTS.GET_TASK_ASSIGNEES, { headers: getAuthHeaders() }).catch(() => null)
            );
          }
        }

        const responses = await Promise.all(requests);
        const taskJson  = await responses[0].json();

        if (!active) return;
        if (!responses[0].ok) {
          throw new Error(taskJson?.message || 'Failed to load tasks');
        }

        setTasks(extractArray(taskJson));

        if (!isEmployee && responses[1] && responses[2]) {
          const [bJson, dJson, eJson, aJson] = await Promise.all([
            responses[1].json().catch(() => []),
            responses[2].json().catch(() => []),
            responses[3] && responses[3].ok ? responses[3].json().catch(() => null) : Promise.resolve(null),
            responses[4] && responses[4].ok ? responses[4].json().catch(() => null) : Promise.resolve(null),
          ]);
          if (active) {
            setBranches(extractArray(bJson));
            setDepartments(extractArray(dJson));

            const assigneeMetaById = new Map();
            if (aJson) {
              extractArray(aJson).forEach(group => {
                (group.employees || []).forEach(emp => {
                  if (emp?.id != null) {
                    assigneeMetaById.set(String(emp.id), {
                      roleName: emp.roleName || emp.role,
                      departmentId: emp.departmentId ?? group.departmentId,
                      departmentName: emp.departmentName ?? group.departmentName,
                      branchId: emp.branchId ?? group.branchId,
                      managerId: emp.managerId ?? emp.reportingManagerId ?? emp.reportingToId,
                    });
                  }
                });
              });
            }

            if (eJson) {
              setEmployees(
                extractArray(eJson).map(emp => {
                  const meta = emp?.id != null ? assigneeMetaById.get(String(emp.id)) : null;
                  return {
                    ...emp,
                    roleName: emp.roleName || emp.role || meta?.roleName,
                    departmentId: emp.departmentId ?? emp.department?.id ?? meta?.departmentId,
                    departmentName: emp.departmentName ?? emp.department?.name ?? meta?.departmentName,
                    branchId: emp.branchId ?? emp.branch?.id ?? meta?.branchId,
                    managerId: emp.managerId ?? meta?.managerId,
                  };
                })
              );
            } else if (aJson) {
              setEmployees(
                extractArray(aJson).flatMap(group =>
                  (group.employees || []).map(emp => ({
                    ...emp,
                    roleName: emp.roleName || emp.role,
                    departmentId: emp.departmentId ?? group.departmentId,
                    departmentName: emp.departmentName ?? group.departmentName,
                    branchId: emp.branchId ?? group.branchId,
                  }))
                )
              );
            }
          }
        }
      } catch (err) {
        if (!active) return;
        console.error('Dashboard fetch error:', err);
        toast.error('Load Error', err.message || 'Could not load dashboard');
        setTasks([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { active = false; };
  }, [isEmployee, isManager, isHR]);

  // Helpers to resolve branch & department names consistently
  const resolveBranchName = (t) => {
    if (t.branchName) return t.branchName;
    if (typeof t.branch === 'object' && t.branch?.name) return t.branch.name;
    if (typeof t.branch === 'string' && isNaN(Number(t.branch))) return t.branch;
    const found = branches.find(b => String(b.id) === String(t.branchId ?? t.branch));
    return found?.name || 'Unassigned Branch';
  };

  const resolveDeptName = (t) => {
    if (t.departmentName) return t.departmentName;
    if (typeof t.department === 'object' && t.department?.name) return t.department.name;
    if (typeof t.department === 'string' && isNaN(Number(t.department))) return t.department;
    const found = departments.find(d => String(d.id) === String(t.departmentId ?? t.department));
    return found?.name || 'Unassigned Dept';
  };

  // Base role-scoped tasks:
  // - Employee sees only tasks assigned to her (or containing a subtask assigned to her)
  // - Manager sees only their own team/assigned tasks
  const roleScopedTasks = useMemo(() => {
    const raw = Array.isArray(tasks) ? tasks : [];
    if (isEmployee) {
      const claims = getTokenClaims();
      const myIds = collectMyIds(currentUser);
      const myFullName = cleanPersonName(
        currentUser?.fullName ||
        (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}` : '') ||
        claims?.name ||
        ''
      ).toLowerCase();

      return raw.filter(t => {
        const assignedToId = t.assignedToId ?? t.assigneeId ?? (typeof t.assignedTo === 'object' ? t.assignedTo?.id : null);
        const assignedToName = cleanPersonName(t.assignedTo).toLowerCase();
        if (assignedToId != null && myIds.size > 0 && myIds.has(String(assignedToId))) return true;
        if (myFullName && assignedToName && assignedToName === myFullName) return true;
        if (Array.isArray(t.subtasks) && t.subtasks.some(st => {
          const stId = st?.assignedToId ?? st?.assigneeId ?? (typeof st?.assignedTo === 'object' ? st.assignedTo?.id : null);
          const stName = cleanPersonName(st?.assignedTo).toLowerCase();
          if (stId != null && myIds.size > 0 && myIds.has(String(stId))) return true;
          if (myFullName && stName && stName === myFullName) return true;
          return false;
        })) return true;
        if ((assignedToId != null && myIds.size > 0) || (assignedToName && myFullName)) return false;
        return true;
      });
    }
    if (!isManager) return raw;

    const { myIds, myName, myDeptId, myDeptName, myBranchId, myBranchName } = getMyOrgScope(employees, currentUser);
    const teamEmps = scopeEmployeesForRole(employees, currentUser, departments);

    const teamIds = new Set();
    const teamNames = new Set();
    teamEmps.forEach(e => {
      [e.id, e.employeeId, e.userId].forEach(id => {
        if (id != null && String(id).trim() !== '') teamIds.add(String(id));
      });
      const n = cleanPersonName(e.name).toLowerCase();
      if (n) teamNames.add(n);
    });

    return raw.filter(t => {
      const assignedById = t.assignedById ?? (typeof t.assignedBy === 'object' ? t.assignedBy?.id : null);
      const assignedToId = t.assignedToId ?? (typeof t.assignedTo === 'object' ? t.assignedTo?.id : null);
      const assignedByName = cleanPersonName(t.assignedBy).toLowerCase();
      const assignedToName = cleanPersonName(t.assignedTo).toLowerCase();

      // 1. Tasks created by this Manager or assigned directly to this Manager
      if (assignedById != null && myIds.has(String(assignedById))) return true;
      if (myName && assignedByName && assignedByName === myName) return true;
      if (assignedToId != null && myIds.has(String(assignedToId))) return true;
      if (myName && assignedToName && assignedToName === myName) return true;

      // 2. Tasks assigned to this Manager's own scoped employees
      if (assignedToId != null && teamIds.has(String(assignedToId))) return true;
      if (assignedToName && teamNames.has(assignedToName)) return true;

      // 3. Fallback when team employee IDs aren't loaded yet: match Manager's own department (not other departments)
      if (employees.length === 0) {
        const dId = t.departmentId ?? (typeof t.department === 'object' ? t.department?.id : null);
        const dName = resolveDeptName(t).toLowerCase();
        if (myDeptId != null && dId != null) return String(dId) === String(myDeptId);
        if (myDeptName && dName) return dName === String(myDeptName).trim().toLowerCase();
        const bId = t.branchId ?? (typeof t.branch === 'object' ? t.branch?.id : null);
        const bName = resolveBranchName(t).toLowerCase();
        if (myBranchId != null && bId != null) return String(bId) === String(myBranchId);
        if (myBranchName && bName) return bName === String(myBranchName).trim().toLowerCase();
      }

      return false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, isManager, employees, departments]);

  const safeTasks = roleScopedTasks;

  // Dynamic drill-down options (Admin/HR see org options; Manager sees only their own scoped branch/dept)
  const branchOptions = useMemo(() => {
    const map = new Map();
    if (!isManager) {
      branches.forEach(b => map.set(String(b.id), b.name));
    }
    safeTasks.forEach(t => {
      const id = t.branchId ?? (typeof t.branch === 'object' ? t.branch?.id : null);
      const name = resolveBranchName(t);
      if (id != null && !map.has(String(id))) map.set(String(id), name);
    });
    return [...map.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, safeTasks, departments, isManager]);

  const deptOptions = useMemo(() => {
    const map = new Map();
    if (!isManager) {
      departments.forEach(d => {
        if (selectedBranch === 'ALL' || String(d.branchId) === String(selectedBranch)) {
          map.set(String(d.id), d.name);
        }
      });
    }
    safeTasks.forEach(t => {
      const bId = t.branchId ?? (typeof t.branch === 'object' ? t.branch?.id : null);
      if (selectedBranch !== 'ALL' && String(bId) !== String(selectedBranch)) return;
      const dId = t.departmentId ?? (typeof t.department === 'object' ? t.department?.id : null);
      const dName = resolveDeptName(t);
      if (dId != null && !map.has(String(dId))) map.set(String(dId), dName);
    });
    return [...map.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments, safeTasks, selectedBranch, branches, isManager]);

  const managerOptions = useMemo(() => {
    const map = new Map();
    safeTasks.forEach(t => {
      const bId = t.branchId ?? (typeof t.branch === 'object' ? t.branch?.id : null);
      const dId = t.departmentId ?? (typeof t.department === 'object' ? t.department?.id : null);
      if (selectedBranch !== 'ALL' && String(bId) !== String(selectedBranch)) return;
      if (selectedDept !== 'ALL' && String(dId) !== String(selectedDept)) return;

      if (t.assignedById != null && t.assignedBy) {
        map.set(String(t.assignedById), cleanPersonName(t.assignedBy));
      }
    });
    return [...map.entries()];
  }, [safeTasks, selectedBranch, selectedDept]);

  // Scope tasks by Branch -> Department -> Manager drill-downs
  const scopedTasks = useMemo(() => {
    return safeTasks.filter(t => {
      if (selectedBranch !== 'ALL') {
        const bId = t.branchId ?? (typeof t.branch === 'object' ? t.branch?.id : null);
        if (String(bId) !== String(selectedBranch)) return false;
      }
      if (selectedDept !== 'ALL') {
        const dId = t.departmentId ?? (typeof t.department === 'object' ? t.department?.id : null);
        if (String(dId) !== String(selectedDept)) return false;
      }
      if (selectedManager !== 'ALL') {
        if (String(t.assignedById) !== String(selectedManager)) return false;
      }
      return true;
    });
  }, [safeTasks, selectedBranch, selectedDept, selectedManager]);

  const isTaskOverdue = (t) => {
    if (!t.dueDate || t.status === 'COMPLETED' || t.status === 'REJECTED') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(t.dueDate) < today;
  };

  // 8 Accurate KPI Metrics
  const kpis = useMemo(() => {
    const total     = scopedTasks.length;
    const pending   = scopedTasks.filter(t => t.status === 'PENDING_APPROVAL').length;
    const active    = scopedTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const inReview  = scopedTasks.filter(t => t.status === 'IN_REVIEW').length;
    const changeReq = scopedTasks.filter(t => t.status === 'CHANGE_REQUESTED').length;
    const completed = scopedTasks.filter(t => t.status === 'COMPLETED').length;
    const rejected  = scopedTasks.filter(t => t.status === 'REJECTED').length;
    const overdue   = scopedTasks.filter(isTaskOverdue).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingReviews = inReview + changeReq;

    return {
      total,
      pending,
      active,
      inReview,
      changeReq,
      completed,
      rejected,
      overdue,
      completionRate,
      pendingReviews,
    };
  }, [scopedTasks]);

  // Mutually Exclusive Task Status Donut Chart
  const donutData = useMemo(() => {
    const statuses = [
      'PENDING_APPROVAL',
      'IN_PROGRESS',
      'IN_REVIEW',
      'CHANGE_REQUESTED',
      'COMPLETED',
      'REJECTED',
    ];
    const counts = statuses.map(st => scopedTasks.filter(t => t.status === st).length);
    return {
      labels: statuses.map(st => STATUS_META[st].label),
      datasets: [
        {
          data: counts,
          backgroundColor: statuses.map(st => STATUS_META[st].chartColor),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    };
  }, [scopedTasks]);

  // Branch Performance Comparison (Admin)
  const branchComparisonData = useMemo(() => {
    const grouped = new Map();
    safeTasks.forEach(t => {
      const name = resolveBranchName(t);
      if (!grouped.has(name)) grouped.set(name, { total: 0, completed: 0, active: 0 });
      const entry = grouped.get(name);
      entry.total += 1;
      if (t.status === 'COMPLETED') entry.completed += 1;
      if (t.status === 'IN_PROGRESS') entry.active += 1;
    });

    const labels = [...grouped.keys()];
    return {
      labels,
      datasets: [
        {
          label: 'Completed',
          data: labels.map(l => grouped.get(l).completed),
          backgroundColor: '#10b981',
          borderRadius: 6,
        },
        {
          label: 'In Progress',
          data: labels.map(l => grouped.get(l).active),
          backgroundColor: '#6366f1',
          borderRadius: 6,
        },
        {
          label: 'Total Tasks',
          data: labels.map(l => grouped.get(l).total),
          backgroundColor: '#cbd5e1',
          borderRadius: 6,
        },
      ],
    };
  }, [safeTasks, branches]);

  // Department Performance Comparison (Admin & HR)
  const deptComparisonData = useMemo(() => {
    const grouped = new Map();
    scopedTasks.forEach(t => {
      const name = resolveDeptName(t);
      if (!grouped.has(name)) grouped.set(name, { total: 0, completed: 0 });
      const entry = grouped.get(name);
      entry.total += 1;
      if (t.status === 'COMPLETED') entry.completed += 1;
    });

    const sorted = [...grouped.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 7);
    const labels = sorted.map(([name]) => name);
    return {
      labels,
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: sorted.map(([, v]) => (v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0)),
          backgroundColor: '#6366f1',
          borderRadius: 6,
        },
      ],
    };
  }, [scopedTasks, departments]);

  // Team Member Performance Comparison (Manager)
  const teamMemberComparisonData = useMemo(() => {
    const grouped = new Map();
    scopedTasks.forEach(t => {
      const name = cleanPersonName(t.assignedTo) || 'Unassigned';
      if (!grouped.has(name)) grouped.set(name, { total: 0, completed: 0 });
      const entry = grouped.get(name);
      entry.total += 1;
      if (t.status === 'COMPLETED') entry.completed += 1;
    });

    const sorted = [...grouped.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
    const labels = sorted.map(([name]) => name);
    return {
      labels,
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: sorted.map(([, v]) => (v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0)),
          backgroundColor: '#2563eb',
          borderRadius: 6,
          barThickness: 26,
        },
      ],
    };
  }, [scopedTasks]);

  // Employee Upcoming Deadlines & Subtask Summary
  const employeeSubtaskSummary = useMemo(() => {
    if (!isEmployee) return { total: 0, completed: 0, pending: 0 };
    let total = 0;
    let completed = 0;
    scopedTasks.forEach(t => {
      if (Array.isArray(t.subtasks)) {
        t.subtasks.forEach(s => {
          if (!myId || String(s.assignedToId) === String(myId)) {
            total += 1;
            if (s.status === 'COMPLETED') completed += 1;
          }
        });
      }
    });
    return { total, completed, pending: total - completed };
  }, [scopedTasks, isEmployee, myId]);

  // Filtered & Paginated Table Rows
  const tableTasks = useMemo(() => {
    return [...scopedTasks]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .filter(t => {
        if (statusFilter === 'OVERDUE') {
          if (!isTaskOverdue(t)) return false;
        } else if (statusFilter === 'PENDING_REVIEWS') {
          if (t.status !== 'IN_REVIEW' && t.status !== 'CHANGE_REQUESTED') return false;
        } else if (statusFilter !== 'ALL') {
          if (t.status !== statusFilter) return false;
        }

        if (priorityFilter !== 'ALL') {
          if (normalizePriority(t.priority) !== priorityFilter) return false;
        }

        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          t.title?.toLowerCase().includes(q) ||
          `t-${String(t.id).padStart(3, '0')}`.includes(q) ||
          String(t.id).includes(q) ||
          cleanPersonName(t.assignedTo).toLowerCase().includes(q) ||
          resolveDeptName(t).toLowerCase().includes(q) ||
          resolveBranchName(t).toLowerCase().includes(q)
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedTasks, statusFilter, priorityFilter, searchTerm, branches, departments]);

  const totalPages = Math.max(1, Math.ceil(tableTasks.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tableTasks.slice(start, start + pageSize);
  }, [tableTasks, currentPage, pageSize]);

  const toggleStatusFilter = (target) => {
    setStatusFilter(prev => (prev === target && target !== 'ALL' ? 'ALL' : target));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  if (loading) return <LoadingSpinner message="Loading task dashboard…" />;

  const startItem = tableTasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem   = Math.min(currentPage * pageSize, tableTasks.length);
  const hasTableFilters = statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchTerm.trim() !== '';

  return (
    <div className="tm-page tm-page--compact">
      {/* Executive Header */}
      <div className="tm-exec-hero">
        <div className="tm-header-left">
          <div className="tm-header-icon">
            <FaChartBar />
          </div>
          <div>
            <h1 className="tm-title">
              {isAdmin ? 'Organization Task Dashboard' : isHR ? 'Department Task Dashboard' : isEmployee ? 'My Work Dashboard' : 'Team Task Dashboard'}
            </h1>
            <p className="tm-subtitle">
              <span className="tm-role-pill">{userRole}</span>
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className={`tm-health-pill ${kpis.overdue === 0 ? 'tm-health-pill--ok' : 'tm-health-pill--warn'}`}>
                {kpis.overdue === 0 ? `${kpis.completionRate}% Completion · On Track` : `${kpis.completionRate}% Completion · ${kpis.overdue} Overdue`}
              </span>
            </p>
          </div>
        </div>

        <div className="tm-header-actions">
          <button
            type="button"
            className="tm-btn tm-btn-secondary"
            onClick={() => navigate('/performance')}
          >
            <FaStar size={11} /> Performance
          </button>
          {canCreate && (
            <button
              type="button"
              className="tm-btn tm-btn-primary"
              onClick={() => navigate('/CreateTask')}
            >
              <FaPlus size={11} /> Create Task
            </button>
          )}
          <button
            type="button"
            className="tm-btn tm-btn-secondary"
            onClick={() => navigate('/TaskList')}
          >
            Task List <FaArrowRight size={10} />
          </button>
        </div>
      </div>

      {/* Role-Based Organizational Filter Strip (Admin / HR / Manager) */}
      {!isEmployee && (branchOptions.length > 0 || deptOptions.length > 0 || (isAdmin && managerOptions.length > 0)) && (
        <div className="tm-filter-bar">
          <span className="tm-filter-label">
            <FaBuilding size={12} color="var(--tm-primary)" /> {isManager ? 'Team Scope' : 'Scope Filter'}
          </span>

          {isManager && branchOptions.length <= 1 && deptOptions.length <= 1 ? (
            <span className="tm-role-pill">
              {deptOptions[0]?.[1] || branchOptions[0]?.[1] || 'My Team'}
            </span>
          ) : (
            <>
              {branchOptions.length > 0 && (
                <select
                  className="tm-select tm-select--compact"
                  value={selectedBranch}
                  onChange={e => { setSelectedBranch(e.target.value); setSelectedDept('ALL'); setSelectedManager('ALL'); setCurrentPage(1); }}
                >
                  <option value="ALL">All Branches ({branchOptions.length})</option>
                  {branchOptions.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}

              {deptOptions.length > 0 && (
                <select
                  className="tm-select tm-select--compact"
                  value={selectedDept}
                  onChange={e => { setSelectedDept(e.target.value); setSelectedManager('ALL'); setCurrentPage(1); }}
                >
                  <option value="ALL">All Departments ({deptOptions.length})</option>
                  {deptOptions.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}

              {isAdmin && managerOptions.length > 0 && (
                <select
                  className="tm-select tm-select--compact"
                  value={selectedManager}
                  onChange={e => { setSelectedManager(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">All Assigners / Managers</option>
                  {managerOptions.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}

              {(selectedBranch !== 'ALL' || selectedDept !== 'ALL' || selectedManager !== 'ALL') && (
                <button
                  type="button"
                  className="tm-btn tm-btn-ghost tm-btn-sm"
                  onClick={() => { setSelectedBranch('ALL'); setSelectedDept('ALL'); setSelectedManager('ALL'); setCurrentPage(1); }}
                >
                  Reset Scope
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Overdue Alert Banner */}
      {kpis.overdue > 0 && (
        <div className="tm-alert tm-alert--danger">
          <div className="tm-alert-text">
            <FaExclamationTriangle size={14} color="#dc2626" />
            <span>{kpis.overdue} overdue task{kpis.overdue !== 1 ? 's' : ''} require attention.</span>
          </div>
          <button
            type="button"
            className="tm-btn tm-btn-secondary tm-btn-sm"
            style={{ borderColor: '#fca5a5', color: '#dc2626' }}
            onClick={() => toggleStatusFilter('OVERDUE')}
          >
            {statusFilter === 'OVERDUE' ? 'Show All Tasks' : 'Filter Overdue'}
          </button>
        </div>
      )}

      {/* 8 Compact Interactive KPI Cards */}
      <div className="tm-kpi-grid tm-kpi-grid--compact">
        <KpiCard
          label="Total Tasks"
          value={kpis.total}
          icon={<FaTasks />}
          accentBg="#eef2ff"
          accentColor="#4f46e5"
          sub={isEmployee && employeeSubtaskSummary.total > 0 ? `+ ${employeeSubtaskSummary.total} subtasks` : 'All scoped'}
          active={statusFilter === 'ALL'}
          onClick={() => toggleStatusFilter('ALL')}
        />
        <KpiCard
          label="Pending Approval"
          value={kpis.pending}
          icon={<FaClock />}
          accentBg="#fef3c7"
          accentColor="#d97706"
          sub="Awaiting acceptance"
          active={statusFilter === 'PENDING_APPROVAL'}
          onClick={() => toggleStatusFilter('PENDING_APPROVAL')}
        />
        <KpiCard
          label="In Progress"
          value={kpis.active}
          icon={<FaSpinner />}
          accentBg="#dbeafe"
          accentColor="#2563eb"
          sub="Active execution"
          active={statusFilter === 'IN_PROGRESS'}
          onClick={() => toggleStatusFilter('IN_PROGRESS')}
        />
        <KpiCard
          label="In Review"
          value={kpis.inReview}
          icon={<FaSearch />}
          accentBg="#fef3c7"
          accentColor="#b45309"
          sub="Under review"
          active={statusFilter === 'IN_REVIEW'}
          onClick={() => toggleStatusFilter('IN_REVIEW')}
        />
        <KpiCard
          label="Completed"
          value={kpis.completed}
          icon={<FaCheckCircle />}
          accentBg="#dcfce7"
          accentColor="#16a34a"
          sub="Closed & verified"
          active={statusFilter === 'COMPLETED'}
          onClick={() => toggleStatusFilter('COMPLETED')}
        />
        <KpiCard
          label="Overdue"
          value={kpis.overdue}
          icon={<FaExclamationTriangle />}
          accentBg="#fee2e2"
          accentColor="#dc2626"
          sub="Past due date"
          active={statusFilter === 'OVERDUE'}
          onClick={() => toggleStatusFilter('OVERDUE')}
        />
        <KpiCard
          label="Completion Rate"
          value={`${kpis.completionRate}%`}
          icon={<FaPercent />}
          accentBg="#dcfce7"
          accentColor="#15803d"
          sub={`${kpis.completed}/${kpis.total} done`}
          active={statusFilter === 'COMPLETED'}
          onClick={() => toggleStatusFilter('COMPLETED')}
        />
        <KpiCard
          label="Pending Reviews"
          value={kpis.pendingReviews}
          icon={<FaClipboardCheck />}
          accentBg="#ffedd5"
          accentColor="#ea580c"
          sub={`${kpis.inReview} rev · ${kpis.changeReq} chg`}
          active={statusFilter === 'PENDING_REVIEWS'}
          onClick={() => toggleStatusFilter('PENDING_REVIEWS')}
        />
      </div>

      {/* Laptop-Fit Animated Analytics Row: Interactive Status Donut + Role Performance Comparison */}
      <div className="tm-charts-grid tm-charts-grid--compact tm-animate-section">
        {/* Status Donut Chart */}
        <div className="tm-chart-card tm-chart-card--compact tm-chart-card--elevated">
          <div className="tm-chart-head">
            <h3 className="tm-chart-title">Task Status Distribution</h3>
            <span className="tm-chart-sub">Click status to filter</span>
          </div>

          {kpis.total === 0 ? (
            <div className="tm-chart-empty" style={{ padding: '28px 16px' }}>
              No tasks available for distribution chart.
            </div>
          ) : (
            <div className="tm-donut-split">
              <div className="tm-donut-ring">
                <Doughnut
                  data={donutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    animation: {
                      duration: 900,
                      easing: 'easeOutQuart',
                      animateRotate: true,
                      animateScale: true,
                    },
                    onClick: (_, elements) => {
                      if (elements?.length > 0) {
                        const clickedStatus = STATUS_DONUT_ORDER[elements[0].index];
                        if (clickedStatus) toggleStatusFilter(clickedStatus);
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 9,
                        cornerRadius: 8,
                      },
                    },
                  }}
                />
                <div className="tm-donut-center">
                  <div className="tm-donut-total">{kpis.total}</div>
                  <div className="tm-donut-caption">Total</div>
                </div>
              </div>

              <div className="tm-donut-legend">
                {STATUS_DONUT_ORDER.map((st, idx) => {
                  const meta = STATUS_META[st];
                  const count = donutData.datasets[0]?.data[idx] || 0;
                  const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
                  return (
                    <button
                      key={st}
                      type="button"
                      className={`tm-donut-legend-row ${statusFilter === st ? 'active' : ''}`}
                      onClick={() => toggleStatusFilter(st)}
                    >
                      <span className="tm-donut-legend-left">
                        <span className="tm-donut-legend-dot" style={{ background: meta.chartColor }} />
                        <span>{meta.label}</span>
                      </span>
                      <span className="tm-donut-legend-val">{count} ({pct}%)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="tm-exec-completion-bar">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--tm-text-secondary)' }}>Overall Completion Progress</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>{kpis.completionRate}%</span>
            </div>
            <div className="tm-progress-track">
              <div className="tm-progress-fill tm-progress-fill--done" style={{ width: `${kpis.completionRate}%` }} />
            </div>
          </div>

          <div className="tm-overdue-foot tm-overdue-foot--compact">
            <span>Overdue Tasks (Derived Condition)</span>
            <strong>{kpis.overdue}</strong>
          </div>
        </div>

        {/* Right Chart: Admin Branch / Manager Team Member / HR Dept Comparison */}
        <div className="tm-chart-card tm-chart-card--compact tm-chart-card--elevated">
          <div className="tm-chart-head">
            <h3 className="tm-chart-title">
              <FaSitemap size={13} color="var(--tm-primary)" />
              {isAdmin && selectedBranch === 'ALL'
                ? 'Branch-Wise Task Performance'
                : isManager
                  ? 'Team Member Completion Rate (%)'
                  : 'Department Completion Rate (%)'}
            </h3>
            <span className="tm-chart-sub">
              {isAdmin && selectedBranch === 'ALL'
                ? 'Click a branch bar to drill down'
                : isManager
                  ? 'Click a bar to filter member tasks'
                  : 'Click a department bar to filter'}
            </span>
          </div>

          {scopedTasks.length === 0 ? (
            <div className="tm-chart-empty" style={{ padding: '28px 16px' }}>
              No task records available for comparison.
            </div>
          ) : (
            <div className="tm-chart-box tm-chart-box--compact">
              {isAdmin && selectedBranch === 'ALL' ? (
                <Bar
                  data={branchComparisonData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 850,
                      easing: 'easeOutQuart',
                      delay: (ctx) => ctx.dataIndex * 55 + ctx.datasetIndex * 70,
                    },
                    onClick: (_, elements) => {
                      if (elements?.length > 0) {
                        const branchName = branchComparisonData.labels[elements[0].index];
                        const match = branchOptions.find(([, name]) => name === branchName);
                        if (match) {
                          setSelectedBranch(prev => (prev === match[0] ? 'ALL' : match[0]));
                          setSelectedDept('ALL');
                          setSelectedManager('ALL');
                          setCurrentPage(1);
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                          boxWidth: 9,
                          usePointStyle: true,
                          pointStyle: 'circle',
                          padding: 12,
                          font: { size: 11, family: 'DM Sans, sans-serif' },
                        },
                      },
                      tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 9,
                        cornerRadius: 8,
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } },
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        border: { display: false },
                        ticks: { precision: 0, font: { size: 11 } },
                      },
                    },
                  }}
                />
              ) : isManager ? (
                <Bar
                  data={teamMemberComparisonData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 850,
                      easing: 'easeOutQuart',
                      delay: (ctx) => ctx.dataIndex * 55,
                    },
                    onClick: (_, elements) => {
                      if (elements?.length > 0) {
                        const memberName = teamMemberComparisonData.labels[elements[0].index];
                        if (memberName) {
                          setSearchTerm(prev => (prev === memberName ? '' : memberName));
                          setCurrentPage(1);
                        }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 9,
                        cornerRadius: 8,
                        callbacks: {
                          label: ctx => `Completion Rate: ${ctx.parsed.y}%`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } },
                      },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#f1f5f9' },
                        border: { display: false },
                        ticks: { callback: v => `${v}%`, font: { size: 11 } },
                      },
                    },
                  }}
                />
              ) : (
                <Bar
                  data={deptComparisonData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 850,
                      easing: 'easeOutQuart',
                      delay: (ctx) => ctx.dataIndex * 55,
                    },
                    onClick: (_, elements) => {
                      if (elements?.length > 0) {
                        const deptName = deptComparisonData.labels[elements[0].index];
                        const match = deptOptions.find(([, name]) => name === deptName);
                        if (match) {
                          setSelectedDept(prev => (prev === match[0] ? 'ALL' : match[0]));
                          setSelectedManager('ALL');
                          setCurrentPage(1);
                        }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#0f172a',
                        padding: 9,
                        cornerRadius: 8,
                        callbacks: {
                          label: ctx => `Completion Rate: ${ctx.parsed.y}%`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } },
                      },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#f1f5f9' },
                        border: { display: false },
                        ticks: { callback: v => `${v}%`, font: { size: 11 } },
                      },
                    },
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Paginated Tasks Overview Table */}
      <div className="tm-card tm-animate-section tm-animate-section--delay">
        <div className="tm-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 className="tm-card-title">
              {statusFilter === 'ALL' ? 'Recent Tasks' : 'Filtered Tasks'}
            </h3>
            <span className="tm-count-badge">
              {tableTasks.length}
            </span>
            <button
              type="button"
              className="tm-link-chip"
              onClick={() => navigate('/TaskList', {
                state: {
                  status: statusFilter === 'OVERDUE' ? 'ALL' : statusFilter,
                  priority: priorityFilter,
                  branch: selectedBranch,
                  department: selectedDept,
                },
              })}
            >
              Open in Task List <FaArrowRight size={9} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="tm-search-wrap">
              <FaSearch className="tm-search-icon" />
              <input
                type="text"
                className="tm-input"
                placeholder="Search ID, title, assignee..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <select
              className="tm-select tm-select--compact"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="CHANGE_REQUESTED">Change Requested</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue Only</option>
            </select>

            <select
              className="tm-select tm-select--compact"
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Priorities</option>
              {['Critical', 'High', 'Medium', 'Low'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {hasTableFilters && (
              <button
                type="button"
                className="tm-btn tm-btn-ghost tm-btn-sm"
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="tm-table-scroll">
          {paginatedTasks.length > 0 ? (
            <table className="tm-table tm-table--medium">
              <thead>
                <tr>
                  {['ID', 'Title', 'Branch / Dept', 'Assignee', 'Priority', 'Status', 'Due Date', 'Progress', ''].map(h => (
                    <th key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map(t => {
                  const overdueFlag = isTaskOverdue(t);
                  const pct = t.progress || 0;
                  return (
                    <tr key={t.id} className="tm-tr-clickable" onClick={() => navigate('/TaskDetail', { state: { taskId: t.id } })}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="tm-id-badge">
                          T-{String(t.id).padStart(3, '0')}
                        </span>
                      </td>
                      <td>
                        <div className="tm-cell-title">
                          {t.title}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{resolveBranchName(t)}</div>
                        <div className="tm-cell-sub">{resolveDeptName(t)}</div>
                      </td>
                      <td style={{ color: 'var(--tm-text-secondary)', whiteSpace: 'nowrap' }}>
                        <div className="tm-emp-cell">
                          <span className="tm-emp-avatar tm-emp-avatar--xs">
                            {getInitials(cleanPersonName(t.assignedTo) || 'U')}
                          </span>
                          <span>{cleanPersonName(t.assignedTo) || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td>
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>
                        <span className={`tm-cell-date ${overdueFlag ? 'tm-cell-date--overdue' : ''}`}>
                          <FaCalendarAlt size={10} />
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div className="tm-progress-row">
                          <div className="tm-progress-track">
                            <div className={`tm-progress-fill ${pct >= 100 ? 'tm-progress-fill--done' : ''}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="tm-progress-pct">{pct}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="tm-icon-action tm-icon-action--primary"
                            onClick={e => { e.stopPropagation(); navigate('/TaskDetail', { state: { taskId: t.id } }); }}
                            title="View task details"
                          >
                            <FaEye size={12} />
                          </button>
                          {canCreate && (
                            <button
                              type="button"
                              className="tm-icon-action tm-icon-action--amber"
                              onClick={e => { e.stopPropagation(); navigate('/CreateTask', { state: { taskToEdit: t, isEditing: true } }); }}
                              title="Edit task"
                            >
                              <FaEdit size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="tm-table-empty">
              No tasks match the active filters.
            </div>
          )}
        </div>

        {tableTasks.length > 0 && (
          <div className="tm-pagination-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="tm-pagination-info">
                Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{tableTasks.length}</strong> tasks
              </span>
              <select
                className="tm-select tm-select--compact"
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={6}>6 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="tm-pagination-controls">
                <button type="button" className="tm-pg-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <FaChevronLeft size={10} />
                </button>
                {getPageNumbers().map((pg, idx) =>
                  pg === '...' ? (
                    <span key={`el-${idx}`} style={{ padding: '0 6px', fontSize: 12, color: 'var(--tm-text-muted)' }}>…</span>
                  ) : (
                    <button
                      key={pg}
                      type="button"
                      className={`tm-pg-btn ${pg === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pg)}
                    >
                      {pg}
                    </button>
                  )
                )}
                <button type="button" className="tm-pg-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <FaChevronRight size={10} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}