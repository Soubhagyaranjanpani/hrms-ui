import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaTasks, FaSearch, FaEye, FaEdit, FaPlus,
  FaThList, FaColumns, FaTimes, FaSort, FaSortUp, FaSortDown,
  FaChevronLeft, FaChevronRight, FaCalendarAlt, FaStar,
  FaClock, FaCheckCircle, FaClipboardCheck
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  extractArray
} from '../config/api.config';
import {
  getNormalizedRole,
  cleanPersonName
} from './taskAccess';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './TaskModule.css';

const PRIORITY_COLORS = { Critical: '#991b1b', High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };
const PRIORITY_BG     = { Critical: '#fee2e2', High: '#fef2f2', Medium: '#fef3c7', Low: '#dcfce7' };
const PRIORITY_RANK   = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending Approval',
  IN_PROGRESS:      'In Progress',
  COMPLETED:        'Completed',
  IN_REVIEW:        'In Review',
  REJECTED:         'Rejected',
  CHANGE_REQUESTED: 'Change Requested',
};

const normalizePriority = (p) => {
  if (!p) return 'Medium';
  const u = String(p).toUpperCase();
  if (u === 'CRITICAL') return 'Critical';
  if (u === 'HIGH')     return 'High';
  if (u === 'MEDIUM')   return 'Medium';
  if (u === 'LOW')      return 'Low';
  return u.charAt(0) + u.slice(1).toLowerCase();
};

const StatusBadge = ({ status }) => {
  const map = {
    PENDING_APPROVAL: { bg: '#fef3c7', color: '#92400e' },
    IN_PROGRESS:      { bg: '#dbeafe', color: '#1e40af' },
    COMPLETED:        { bg: '#dcfce7', color: '#166534' },
    IN_REVIEW:        { bg: '#fef3c7', color: '#92400e' },
    REJECTED:         { bg: '#fee2e2', color: '#991b1b' },
    CHANGE_REQUESTED: { bg: '#fff7ed', color: '#c2410c' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span className="tm-status-badge" style={{ background: s.bg, color: s.color }}>
      <span className="tm-status-dot" />
      {STATUS_LABELS[status] || status}
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

const KANBAN_COLS = [
  { key: 'pending',    title: 'Pending Approval',        statuses: ['PENDING_APPROVAL'],              borderColor: '#f59e0b' },
  { key: 'inprogress', title: 'In Progress',             statuses: ['IN_PROGRESS'],                   borderColor: '#2563eb' },
  { key: 'review',     title: 'In Review / Change Req.', statuses: ['IN_REVIEW', 'CHANGE_REQUESTED'], borderColor: '#d97706' },
  { key: 'done',       title: 'Completed',               statuses: ['COMPLETED'],                     borderColor: '#16a34a' },
];

const formatShortDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function TaskList({ user }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const navState   = location.state || {};
  const userRole   = getNormalizedRole(user);
  const isEmployee = userRole === 'Employee';
  const canCreate  = ['Admin', 'Hr', 'Manager'].includes(userRole);

  const [tasks,        setTasks]        = useState([]);
  const [branches,     setBranches]     = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterSource, setFilterSource] = useState(isEmployee ? 'mine' : 'all');

  const [view,             setView]             = useState(navState.view || 'table');
  const [filterBranch,     setFilterBranch]     = useState(navState.branch || 'ALL');
  const [filterDepartment, setFilterDepartment] = useState(navState.department || 'ALL');
  const [filterStatus,     setFilterStatus]     = useState(navState.status || 'ALL');
  const [filterPriority,   setFilterPriority]   = useState(navState.priority || 'ALL');
  const [filterAssignee,   setFilterAssignee]   = useState(navState.assignee || 'ALL');
  const [filterDueDate,    setFilterDueDate]    = useState('');
  const [search,           setSearch]           = useState('');

  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load branches & departments for filter dropdowns (non-employee)
  useEffect(() => {
    if (isEmployee) return;
    let active = true;
    Promise.all([
      fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }).then(r => r.json()).catch(() => []),
      fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: getAuthHeaders() }).then(r => r.json()).catch(() => []),
    ]).then(([bData, dData]) => {
      if (!active) return;
      setBranches(extractArray(bData));
      setDepartments(extractArray(dData));
    });
    return () => { active = false; };
  }, [isEmployee]);

  // Fetch tasks when filter source changes
  useEffect(() => {
    let active = true;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const url = (isEmployee || filterSource === 'mine')
          ? API_ENDPOINTS.GET_MY_TASKS
          : API_ENDPOINTS.GET_ALL_TASKS;

        const res  = await fetch(url, { headers: getAuthHeaders() });
        const data = await res.json();

        if (!active) return;
        if (!res.ok) throw new Error(data.message || 'Failed to load tasks');

        setTasks(extractArray(data));
      } catch (err) {
        if (!active) return;
        toast.error('Load Error', err.message || 'Could not load tasks');
        setTasks([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTasks();
    return () => { active = false; };
  }, [filterSource, isEmployee]);

  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);

  // Resolve branch/department display names safely
  const getTaskBranchName = (t) => {
    if (t.branchName) return t.branchName;
    if (typeof t.branch === 'object' && t.branch?.name) return t.branch.name;
    if (typeof t.branch === 'string' && isNaN(Number(t.branch))) return t.branch;
    const found = branches.find(b => String(b.id) === String(t.branchId ?? t.branch));
    return found?.name || '—';
  };

  const getTaskDeptName = (t) => {
    if (t.departmentName) return t.departmentName;
    if (typeof t.department === 'object' && t.department?.name) return t.department.name;
    if (typeof t.department === 'string' && isNaN(Number(t.department))) return t.department;
    const found = departments.find(d => String(d.id) === String(t.departmentId ?? t.department));
    return found?.name || '—';
  };

  // Dynamic filter options
  const branchOptions = useMemo(() => {
    const names = new Set(branches.map(b => b.name).filter(Boolean));
    safeTasks.forEach(t => {
      const n = getTaskBranchName(t);
      if (n && n !== '—') names.add(n);
    });
    return [...names].sort();
  }, [branches, safeTasks, departments]);

  const deptOptions = useMemo(() => {
    const selectedBranchObj = branches.find(b => b.name === filterBranch);
    const names = new Set();

    departments.forEach(d => {
      if (filterBranch === 'ALL' || !selectedBranchObj || String(d.branchId) === String(selectedBranchObj.id)) {
        if (d.name) names.add(d.name);
      }
    });

    safeTasks.forEach(t => {
      if (filterBranch !== 'ALL' && getTaskBranchName(t) !== filterBranch) return;
      const n = getTaskDeptName(t);
      if (n && n !== '—') names.add(n);
    });
    return [...names].sort();
  }, [departments, branches, safeTasks, filterBranch]);

  const assigneeOptions = useMemo(() => {
    const set = new Set();
    safeTasks.forEach(t => {
      const name = cleanPersonName(t.assignedTo);
      if (name) set.add(name);
    });
    return [...set].sort();
  }, [safeTasks]);

  const summaryStats = useMemo(() => ({
    total: safeTasks.length,
    inProgress: safeTasks.filter(t => t.status === 'IN_PROGRESS').length,
    inReview: safeTasks.filter(t => t.status === 'IN_REVIEW').length,
    completed: safeTasks.filter(t => t.status === 'COMPLETED').length,
  }), [safeTasks]);

  // Filter + Sort
  const filteredAndSorted = useMemo(() => {
    const list = safeTasks.filter(t => {
      const bName = getTaskBranchName(t);
      const dName = getTaskDeptName(t);
      const aName = cleanPersonName(t.assignedTo) || 'Unassigned';
      const byName = cleanPersonName(t.assignedBy);
      const pri = normalizePriority(t.priority);

      if (filterBranch !== 'ALL' && bName !== filterBranch) return false;
      if (filterDepartment !== 'ALL' && dName !== filterDepartment) return false;
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      if (filterPriority !== 'ALL' && pri !== filterPriority) return false;
      if (filterAssignee !== 'ALL' && aName !== filterAssignee) return false;

      if (filterDueDate && t.dueDate) {
        const dueStr = new Date(t.dueDate).toISOString().split('T')[0];
        if (dueStr > filterDueDate) return false;
      } else if (filterDueDate && !t.dueDate) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const idStr = `t-${String(t.id).padStart(3, '0')}`;
        const matches =
          t.title?.toLowerCase().includes(q) ||
          idStr.includes(q) ||
          String(t.id).includes(q) ||
          aName.toLowerCase().includes(q) ||
          byName.toLowerCase().includes(q) ||
          dName.toLowerCase().includes(q) ||
          bName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });

    const { key, direction } = sortConfig;
    const mult = direction === 'asc' ? 1 : -1;

    return [...list].sort((a, b) => {
      if (key === 'id') return (Number(a.id) - Number(b.id)) * mult;
      if (key === 'title') return (a.title || '').localeCompare(b.title || '') * mult;
      if (key === 'priority') {
        const ra = PRIORITY_RANK[normalizePriority(a.priority)] || 0;
        const rb = PRIORITY_RANK[normalizePriority(b.priority)] || 0;
        return (ra - rb) * mult;
      }
      if (key === 'status') return (a.status || '').localeCompare(b.status || '') * mult;
      if (key === 'dueDate') {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return (da - db) * mult;
      }
      if (key === 'progress') return ((Number(a.progress) || 0) - (Number(b.progress) || 0)) * mult;
      return 0;
    });
  }, [
    safeTasks, filterBranch, filterDepartment, filterStatus,
    filterPriority, filterAssignee, filterDueDate, search,
    sortConfig, branches, departments
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  const toggleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort size={10} style={{ opacity: 0.35, marginLeft: 4 }} />;
    return sortConfig.direction === 'asc'
      ? <FaSortUp size={10} style={{ marginLeft: 4 }} />
      : <FaSortDown size={10} style={{ marginLeft: 4 }} />;
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const openDetail = (id) => navigate('/TaskDetail', { state: { taskId: id } });
  const editTask = (task, e) => {
    e.stopPropagation();
    navigate('/CreateTask', { state: { taskToEdit: task, isEditing: true } });
  };

  const hasFilters =
    filterBranch !== 'ALL' ||
    filterDepartment !== 'ALL' ||
    filterStatus !== 'ALL' ||
    filterPriority !== 'ALL' ||
    filterAssignee !== 'ALL' ||
    Boolean(filterDueDate) ||
    Boolean(search.trim());

  const clearFilters = () => {
    setFilterBranch('ALL');
    setFilterDepartment('ALL');
    setFilterStatus('ALL');
    setFilterPriority('ALL');
    setFilterAssignee('ALL');
    setFilterDueDate('');
    setSearch('');
    setCurrentPage(1);
  };

  const startItem = filteredAndSorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem   = Math.min(currentPage * pageSize, filteredAndSorted.length);

  return (
    <div className="tm-page">
      {/* Header */}
      <div className="tm-header">
        <div className="tm-header-left">
          <div className="tm-header-icon">
            <FaTasks />
          </div>
          <div>
            <h1 className="tm-title">
              {isEmployee ? 'My Assigned Tasks' : 'Task Directory'}
            </h1>
            <p className="tm-subtitle">
              {loading ? 'Loading…' : `${filteredAndSorted.length} task${filteredAndSorted.length !== 1 ? 's' : ''} matching current filters`}
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
          <div className="tm-segmented">
            <button type="button" className={`tm-segmented-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>
              <FaThList size={12} /> Table
            </button>
            <button type="button" className={`tm-segmented-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
              <FaColumns size={12} /> Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Compact Clickable KPI Summary Strip */}
      {!loading && (
        <div className="tm-kpi-grid tm-kpi-grid--compact">
          {[
            {
              key: 'ALL',
              label: 'Total Tasks',
              val: summaryStats.total,
              color: '#2563eb',
              bg: '#eff6ff',
              sub: 'Show all',
              icon: <FaTasks size={13} />,
            },
            {
              key: 'IN_PROGRESS',
              label: 'In Progress',
              val: summaryStats.inProgress,
              color: '#0891b2',
              bg: '#ecfeff',
              sub: 'Active work',
              icon: <FaClock size={13} />,
            },
            {
              key: 'IN_REVIEW',
              label: 'In Review',
              val: summaryStats.inReview,
              color: '#d97706',
              bg: '#fffbeb',
              sub: 'Awaiting approval',
              icon: <FaClipboardCheck size={13} />,
            },
            {
              key: 'COMPLETED',
              label: 'Completed',
              val: summaryStats.completed,
              color: '#16a34a',
              bg: '#f0fdf4',
              sub: `${summaryStats.total > 0 ? Math.round((summaryStats.completed / summaryStats.total) * 100) : 0}% done`,
              icon: <FaCheckCircle size={13} />,
            },
          ].map(card => {
            const isSelected = filterStatus === card.key && card.key !== 'ALL';
            return (
              <div
                key={card.key}
                className="tm-kpi-card tm-kpi-card--compact"
                style={{
                  borderLeftColor: card.color,
                  cursor: 'pointer',
                  outline: isSelected ? `2px solid ${card.color}` : 'none',
                }}
                onClick={() => {
                  setFilterStatus(prev => (prev === card.key || card.key === 'ALL' ? 'ALL' : card.key));
                  setCurrentPage(1);
                }}
              >
                <div className="tm-kpi-top">
                  <span className="tm-kpi-label">{card.label}</span>
                  <span className="tm-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </span>
                </div>
                <div className="tm-kpi-bottom">
                  <div className="tm-kpi-value" style={{ color: card.color }}>{card.val}</div>
                  <span className="tm-kpi-sub">{card.sub}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Facet Filter Bar */}
      <div className="tm-filter-bar">
        {!isEmployee ? (
          <select
            className="tm-select"
            value={filterSource}
            onChange={e => { setFilterSource(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Scope: All Accessible</option>
            <option value="mine">Scope: Assigned to Me</option>
          </select>
        ) : (
          <span className="tm-role-pill">
            Assigned to Me
          </span>
        )}

        {!isEmployee && branchOptions.length > 0 && (
          <select
            className="tm-select"
            value={filterBranch}
            onChange={e => { setFilterBranch(e.target.value); setFilterDepartment('ALL'); setCurrentPage(1); }}
          >
            <option value="ALL">All Branches</option>
            {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}

        {!isEmployee && deptOptions.length > 0 && (
          <select
            className="tm-select"
            value={filterDepartment}
            onChange={e => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
          >
            <option value="ALL">All Departments</option>
            {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}

        <select className="tm-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
          <option value="ALL">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>

        <select className="tm-select" value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setCurrentPage(1); }}>
          <option value="ALL">All Priorities</option>
          {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {!isEmployee && assigneeOptions.length > 1 && (
          <select className="tm-select" value={filterAssignee} onChange={e => { setFilterAssignee(e.target.value); setCurrentPage(1); }}>
            <option value="ALL">All Assignees</option>
            {assigneeOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}

        <div className="tm-date-inline">
          <span className="tm-date-inline-label">Due ≤</span>
          <input
            type="date"
            className="tm-input"
            value={filterDueDate}
            onChange={e => { setFilterDueDate(e.target.value); setCurrentPage(1); }}
            title="Filter tasks due on or before date"
          />
        </div>

        <div className="tm-search-wrap tm-search-wrap--grow">
          <FaSearch className="tm-search-icon" />
          <input
            className="tm-input"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search ID, title, assignee, dept…"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            className="tm-btn tm-btn-danger-outline tm-btn-sm"
            onClick={clearFilters}
          >
            <FaTimes size={10} /> Reset
          </button>
        )}
      </div>

      {loading && <LoadingSpinner message="Loading tasks…" />}

      {/* TABLE VIEW */}
      {!loading && view === 'table' && (
        <div className="tm-card">
          {paginatedTasks.length === 0 ? (
            <div className="tm-table-empty">
              <FaSearch style={{ fontSize: 32, opacity: 0.3, marginBottom: 10 }} />
              <h4 style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--tm-text-secondary)', margin: '0 0 6px' }}>No tasks found</h4>
              <p style={{ fontSize: 13, margin: 0 }}>Try adjusting your filters or creating a new task.</p>
            </div>
          ) : (
            <>
              <div className="tm-table-scroll">
                <table className="tm-table tm-table--wide">
                  <thead>
                    <tr>
                      <th className="tm-th-sort" onClick={() => toggleSort('id')}>
                        ID {renderSortIcon('id')}
                      </th>
                      <th className="tm-th-sort" onClick={() => toggleSort('title')}>
                        Task Title {renderSortIcon('title')}
                      </th>
                      <th>Assigned By</th>
                      <th>Assigned To</th>
                      <th>Branch / Dept</th>
                      <th className="tm-th-sort" onClick={() => toggleSort('priority')}>
                        Priority {renderSortIcon('priority')}
                      </th>
                      <th className="tm-th-sort" onClick={() => toggleSort('status')}>
                        Status {renderSortIcon('status')}
                      </th>
                      <th className="tm-th-sort" onClick={() => toggleSort('progress')}>
                        Progress {renderSortIcon('progress')}
                      </th>
                      <th>Start Date</th>
                      <th className="tm-th-sort" onClick={() => toggleSort('dueDate')}>
                        Due Date {renderSortIcon('dueDate')}
                      </th>
                      <th className="tm-th-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map(t => {
                      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED';
                      const bName = getTaskBranchName(t);
                      const dName = getTaskDeptName(t);
                      const pct = t.progress || 0;
                      return (
                        <tr key={t.id} className="tm-tr-clickable" onClick={() => openDetail(t.id)}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className="tm-id-badge">
                              T-{String(t.id).padStart(3, '0')}
                            </span>
                          </td>
                          <td>
                            <div className="tm-cell-title" title={t.title}>
                              {t.title}
                            </div>
                            {t.effort && (
                              <div className="tm-cell-sub">
                                Est: {t.effort}
                              </div>
                            )}
                          </td>
                          <td style={{ color: 'var(--tm-text-secondary)', whiteSpace: 'nowrap' }}>
                            {cleanPersonName(t.assignedBy) || '—'}
                          </td>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {cleanPersonName(t.assignedTo) || 'Unassigned'}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600 }}>{bName}</div>
                            <div className="tm-cell-sub">{dName}</div>
                          </td>
                          <td>
                            <PriorityBadge priority={t.priority} />
                          </td>
                          <td>
                            <StatusBadge status={t.status} />
                          </td>
                          <td style={{ minWidth: 120 }}>
                            <div className="tm-progress-row">
                              <div className="tm-progress-track">
                                <div className={`tm-progress-fill ${pct >= 100 ? 'tm-progress-fill--done' : ''}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="tm-progress-pct">{pct}%</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--tm-text-secondary)', whiteSpace: 'nowrap' }}>
                            {formatShortDate(t.startDate || t.createdAt)}
                          </td>
                          <td>
                            <span className={`tm-cell-date ${isOverdue ? 'tm-cell-date--overdue' : ''}`}>
                              <FaCalendarAlt size={10} /> {formatShortDate(t.dueDate)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                type="button"
                                className="tm-icon-action tm-icon-action--primary"
                                onClick={e => { e.stopPropagation(); openDetail(t.id); }}
                                title="Open Task Workspace"
                              >
                                <FaEye size={12} />
                              </button>
                              {canCreate && (
                                <button
                                  type="button"
                                  className="tm-icon-action tm-icon-action--amber"
                                  onClick={e => editTask(t, e)}
                                  title="Edit Task"
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
              </div>

              {/* Pagination Footer */}
              <div className="tm-pagination-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="tm-pagination-info">
                    Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{filteredAndSorted.length}</strong> tasks
                  </span>
                  <select
                    className="tm-select tm-select--compact"
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>

                {totalPages > 1 && (
                  <div className="tm-pagination-controls">
                    <button
                      type="button"
                      className="tm-pg-btn"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
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
                    <button
                      type="button"
                      className="tm-pg-btn"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <FaChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {!loading && view === 'kanban' && (
        <div className="tm-kanban-grid">
          {KANBAN_COLS.map(col => {
            const colTasks = filteredAndSorted.filter(t => col.statuses.includes(t.status));
            return (
              <div key={col.key} className="tm-kanban-col">
                <div className="tm-kanban-col-head" style={{ borderBottomColor: col.borderColor }}>
                  <span className="tm-kanban-col-title">{col.title}</span>
                  <span className="tm-kanban-count">
                    {colTasks.length}
                  </span>
                </div>
                <div className="tm-kanban-list">
                  {colTasks.length === 0 && (
                    <div className="tm-table-empty" style={{ padding: '20px 8px' }}>
                      No tasks
                    </div>
                  )}
                  {colTasks.map(t => {
                    const pri = normalizePriority(t.priority);
                    const pct = t.progress || 0;
                    return (
                      <div
                        key={t.id}
                        className="tm-kanban-card"
                        onClick={() => openDetail(t.id)}
                        style={{ borderLeftColor: PRIORITY_COLORS[pri] || '#94a3b8' }}
                      >
                        <div className="tm-kanban-card-top">
                          <span className="tm-id-badge">
                            T-{String(t.id).padStart(3, '0')}
                          </span>
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <div className="tm-kanban-card-title">
                          {t.title}
                        </div>
                        <div className="tm-kanban-card-org">
                          {getTaskBranchName(t)} · {getTaskDeptName(t)}
                        </div>
                        {pct > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div className="tm-progress-row">
                              <div className="tm-progress-track">
                                <div className={`tm-progress-fill ${pct >= 100 ? 'tm-progress-fill--done' : ''}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="tm-progress-pct">{pct}%</span>
                            </div>
                          </div>
                        )}
                        <div className="tm-kanban-card-foot">
                          <span>{cleanPersonName(t.assignedTo) || 'Unassigned'}</span>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span>{formatShortDate(t.dueDate)}</span>
                            {canCreate && (
                              <button
                                type="button"
                                className="tm-icon-action tm-icon-action--amber"
                                onClick={e => editTask(t, e)}
                                title="Edit Task"
                                style={{ width: 22, height: 22 }}
                              >
                                <FaEdit size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}