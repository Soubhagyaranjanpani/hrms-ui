import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt, FaChartLine, FaClipboardCheck, FaSyncAlt,
  FaThLarge, FaFileAlt, FaChevronLeft, FaChevronRight,
  FaCheckCircle, FaClock, FaTimesCircle, FaTasks, FaStar,
  FaArrowRight
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  extractArray
} from '../config/api.config';
import {
  getNormalizedRole,
  getMyId,
  cleanPersonName,
  unwrapResponse
} from './taskAccess';
import {
  getStoredUser,
  collectMyIds,
  fetchScopedEmployeesPool
} from './taskScope';
import DailyWorkCalendar, { formatDate } from './DailyWorkCalendar';
import DailyWorkReport from './DailyWorkReport';
import DailyWorkReview from './DailyWorkReview';
import DailyWorkPerformance from './DailyWorkPerformance';
import LoadingSpinner from '../components/LoadingSpinner';
import './DailyWork.css';

const fetchArray = async (url) => {
  const response = await fetch(url, { headers: getAuthHeaders() });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  const body = unwrapResponse(data);
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.tasks)) return body.tasks;
  return extractArray(data);
};

const flattenTasks = (tasks) => {
  const map = new Map();
  const visit = (items) => {
    items.forEach(task => {
      if (!task || task.id == null) return;
      const id = String(task.id);
      if (map.has(id)) return;
      map.set(id, task);
      if (Array.isArray(task.subtasks)) {
        visit(task.subtasks);
      }
    });
  };
  visit(tasks);
  return [...map.values()];
};

const REPORTS_PER_PAGE = 8;
const OVERVIEW_PER_PAGE = 6;
const norm = (val) => (val == null ? '' : String(val).trim().toLowerCase());

export default function DailyWorkDashboard({ user }) {
  const navigate = useNavigate();
  const currentUser = user || getStoredUser();
  const role = getNormalizedRole(currentUser);
  const myId = getMyId(currentUser);
  const myIds = useMemo(() => collectMyIds(currentUser), [currentUser]);

  const isEmployee = role === 'Employee';
  const isManager  = role === 'Manager';
  const isAdmin    = role === 'Admin';
  const isHR       = role === 'Hr';

  const [tasks, setTasks]                       = useState([]);
  const [submissions, setSubmissions]           = useState([]);
  const [branches, setBranches]                 = useState([]);
  const [departments, setDepartments]           = useState([]);
  const [scopedPoolEmployees, setScopedPoolEmployees] = useState([]);
  const [rawPoolEmployees, setRawPoolEmployees] = useState([]);

  const [selectedDate, setSelectedDate]         = useState(formatDate(new Date()));
  const [branchFilter, setBranchFilter]         = useState('ALL');
  const [deptFilter, setDeptFilter]             = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedTask, setSelectedTask]         = useState('all');
  const [historyStatus, setHistoryStatus]       = useState('ALL');
  const [activeTab, setActiveTab]               = useState(null);
  const [overviewPage, setOverviewPage]         = useState(1);
  const [historyPage, setHistoryPage]           = useState(1);
  const [reviewPage, setReviewPage]             = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [warning, setWarning] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    setWarning('');

    try {
      if (isEmployee && myIds.size === 0 && !myId) {
        throw new Error('Employee ID missing. Please log in again.');
      }

      const endpoint = isEmployee
        ? API_ENDPOINTS.GET_MY_TASKS
        : API_ENDPOINTS.GET_ALL_TASKS;

      const [taskData, branchJson, empPool] = await Promise.all([
        fetchArray(endpoint),
        !isEmployee
          ? fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() })
              .then(r => (r.ok ? r.json().catch(() => null) : null))
              .catch(() => null)
          : Promise.resolve(null),
        !isEmployee
          ? fetchScopedEmployeesPool(currentUser, { includeAssigneesMeta: true }).catch(() => null)
          : Promise.resolve(null),
      ]);

      let allTasks = flattenTasks(taskData);

      if (!isEmployee) {
        if (branchJson) setBranches(extractArray(branchJson));
        if (empPool?.departments) setDepartments(empPool.departments);
        if (empPool?.rawEmployees) setRawPoolEmployees(empPool.rawEmployees);
        if (empPool?.scopedEmployees) setScopedPoolEmployees(empPool.scopedEmployees);

        // Scope tasks for Manager / HR to their own team / assigned tasks
        if ((isManager || isHR) && empPool?.loaded) {
          const teamIds = new Set();
          const teamNames = new Set();
          (empPool.scopedEmployees || []).forEach(e => {
            [e.id, e.employeeId, e.userId].forEach(id => {
              if (id != null && String(id).trim() !== '') teamIds.add(String(id));
            });
            const n = norm(cleanPersonName(e.name));
            if (n) teamNames.add(n);
          });

          allTasks = allTasks.filter(t => {
            const assignedById = t.assignedById ?? (typeof t.assignedBy === 'object' ? t.assignedBy?.id : null);
            const assignedToId = t.assignedToId ?? t.assigneeId ?? (typeof t.assignedTo === 'object' ? t.assignedTo?.id : null);
            const assignedToName = norm(cleanPersonName(t.assignedTo));

            if (assignedById != null && myIds.has(String(assignedById))) return true;
            if (assignedToId != null && (myIds.has(String(assignedToId)) || teamIds.has(String(assignedToId)))) return true;
            if (assignedToName && teamNames.has(assignedToName)) return true;
            return false;
          });
        }
      }

      setTasks(allTasks);

      const results = await Promise.allSettled(
        allTasks.map(task =>
          fetchArray(API_ENDPOINTS.GET_TASK_SUBMISSIONS(task.id))
        )
      );

      const map = new Map();
      let failed = 0;

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          result.value.forEach(report => {
            if (report.id != null) {
              map.set(String(report.id), {
                ...report,
                employeeName: cleanPersonName(report.employeeName),
              });
            }
          });
        } else {
          failed += 1;
        }
      });

      let reports = [...map.values()];

      if (isEmployee) {
        reports = reports.filter(report =>
          report.employeeId != null && myIds.has(String(report.employeeId))
        );
      }

      reports.sort((a, b) =>
        String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''))
      );

      setSubmissions(reports);

      if (failed > 0) {
        setWarning(
          `${failed} task submission histor${failed === 1 ? 'y' : 'ies'} could not be loaded.`
        );
      }
    } catch (err) {
      setError(err.message);
      setTasks([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee, isManager, isHR, myId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Reset pagination when filters or date change
  useEffect(() => {
    setOverviewPage(1);
    setHistoryPage(1);
    setReviewPage(1);
  }, [selectedDate, branchFilter, deptFilter, selectedEmployee, selectedTask, historyStatus]);

  // Lookup maps for branch/department resolution
  const orgLookups = useMemo(() => {
    const branchById = new Map();
    const branchByName = new Map();
    branches.forEach(b => {
      if (b?.id != null) branchById.set(String(b.id), b.name);
      if (b?.name) branchByName.set(norm(b.name), String(b.id ?? b.name));
    });

    const deptById = new Map();
    const deptByName = new Map();
    departments.forEach(d => {
      if (d?.id != null) deptById.set(String(d.id), d);
      if (d?.name && !deptByName.has(norm(d.name))) deptByName.set(norm(d.name), d);
    });

    const empById = new Map();
    const empByName = new Map();
    rawPoolEmployees.forEach(e => {
      [e.id, e.employeeId, e.userId].forEach(id => {
        if (id != null && String(id).trim() !== '') empById.set(String(id), e);
      });
      const n = norm(cleanPersonName(e.name));
      if (n && !empByName.has(n)) empByName.set(n, e);
    });

    const taskById = new Map();
    tasks.forEach(t => {
      if (t?.id != null) taskById.set(String(t.id), t);
    });

    const resolveOrg = ({ employeeId, employeeName, taskId, branchId, branchName, departmentId, departmentName }) => {
      const task = taskId != null ? taskById.get(String(taskId)) : null;
      const emp =
        (employeeId != null ? empById.get(String(employeeId)) : null) ||
        (employeeName ? empByName.get(norm(employeeName)) : null);

      const rawDeptId = departmentId ?? task?.departmentId ?? task?.department?.id ?? emp?.departmentId ?? null;
      const rawDeptName =
        departmentName ||
        task?.departmentName ||
        (typeof task?.department === 'object' ? task.department?.name : typeof task?.department === 'string' && isNaN(Number(task.department)) ? task.department : '') ||
        emp?.departmentName ||
        '';
      const deptObj =
        (rawDeptId != null ? deptById.get(String(rawDeptId)) : null) ||
        (rawDeptName ? deptByName.get(norm(rawDeptName)) : null);

      const resolvedDeptId = rawDeptId ?? deptObj?.id ?? null;
      const resolvedDeptName = rawDeptName || deptObj?.name || '';

      const rawBranchId = branchId ?? task?.branchId ?? task?.branch?.id ?? emp?.branchId ?? deptObj?.branchId ?? null;
      const rawBranchName =
        branchName ||
        task?.branchName ||
        (typeof task?.branch === 'object' ? task.branch?.name : typeof task?.branch === 'string' && isNaN(Number(task.branch)) ? task.branch : '') ||
        emp?.branchName ||
        deptObj?.branchName ||
        (rawBranchId != null ? branchById.get(String(rawBranchId)) : '') ||
        '';

      return {
        branchKey: rawBranchName ? norm(rawBranchName) : (rawBranchId != null ? `id:${rawBranchId}` : ''),
        branchLabel: rawBranchName || '',
        deptKey: resolvedDeptName ? norm(resolvedDeptName) : (resolvedDeptId != null ? `id:${resolvedDeptId}` : ''),
        deptLabel: resolvedDeptName || '',
      };
    };

    return { resolveOrg };
  }, [branches, departments, rawPoolEmployees, tasks]);

  // Combined scoped team members (pool employees + submission authors)
  const allTeamMembers = useMemo(() => {
    const employeeMap = new Map();

    scopedPoolEmployees.forEach(emp => {
      const id = emp.employeeId ?? emp.id;
      if (id == null) return;
      const org = orgLookups.resolveOrg({
        employeeId: id,
        employeeName: emp.name,
        branchId: emp.branchId,
        branchName: emp.branchName,
        departmentId: emp.departmentId,
        departmentName: emp.departmentName,
      });
      employeeMap.set(String(id), {
        id,
        name: cleanPersonName(emp.name) || `Employee #${id}`,
        ...org,
      });
    });

    submissions.forEach(report => {
      if (report.employeeId == null) return;
      const key = String(report.employeeId);
      if (!employeeMap.has(key)) {
        const org = orgLookups.resolveOrg({
          employeeId: report.employeeId,
          employeeName: report.employeeName,
          taskId: report.taskId,
        });
        employeeMap.set(key, {
          id: report.employeeId,
          name: cleanPersonName(report.employeeName) || `Employee #${report.employeeId}`,
          ...org,
        });
      }
    });

    return [...employeeMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [scopedPoolEmployees, submissions, orgLookups]);

  const branchOptions = useMemo(() => {
    const map = new Map();
    if (isAdmin) {
      branches.forEach(b => {
        if (b?.name) map.set(norm(b.name), b.name);
      });
    }
    allTeamMembers.forEach(m => {
      if (m.branchKey && m.branchLabel) map.set(m.branchKey, m.branchLabel);
    });
    tasks.forEach(t => {
      const org = orgLookups.resolveOrg({
        taskId: t.id,
        branchId: t.branchId,
        branchName: t.branchName,
        departmentId: t.departmentId,
        departmentName: t.departmentName,
      });
      if (org.branchKey && org.branchLabel) map.set(org.branchKey, org.branchLabel);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [isAdmin, branches, allTeamMembers, tasks, orgLookups]);

  const deptOptions = useMemo(() => {
    const map = new Map();
    if (isAdmin) {
      departments.forEach(d => {
        if (!d?.name) return;
        const org = orgLookups.resolveOrg({
          branchId: d.branchId,
          branchName: d.branchName,
          departmentId: d.id,
          departmentName: d.name,
        });
        if (branchFilter !== 'ALL' && org.branchKey !== branchFilter) return;
        map.set(norm(d.name), d.name);
      });
    }
    allTeamMembers.forEach(m => {
      if (branchFilter !== 'ALL' && m.branchKey !== branchFilter) return;
      if (m.deptKey && m.deptLabel) map.set(m.deptKey, m.deptLabel);
    });
    tasks.forEach(t => {
      const org = orgLookups.resolveOrg({
        taskId: t.id,
        branchId: t.branchId,
        branchName: t.branchName,
        departmentId: t.departmentId,
        departmentName: t.departmentName,
      });
      if (branchFilter !== 'ALL' && org.branchKey !== branchFilter) return;
      if (org.deptKey && org.deptLabel) map.set(org.deptKey, org.deptLabel);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [isAdmin, departments, allTeamMembers, tasks, branchFilter, orgLookups]);

  const employees = useMemo(() => {
    return allTeamMembers.filter(m => {
      if (branchFilter !== 'ALL' && m.branchKey !== branchFilter) return false;
      if (deptFilter !== 'ALL' && m.deptKey !== deptFilter) return false;
      return true;
    });
  }, [allTeamMembers, branchFilter, deptFilter]);

  const filteredTaskOptions = useMemo(() => {
    return tasks.filter(t => {
      const org = orgLookups.resolveOrg({
        taskId: t.id,
        branchId: t.branchId,
        branchName: t.branchName,
        departmentId: t.departmentId,
        departmentName: t.departmentName,
      });
      if (branchFilter !== 'ALL' && org.branchKey !== branchFilter) return false;
      if (deptFilter !== 'ALL' && org.deptKey !== deptFilter) return false;
      if (selectedEmployee !== 'all') {
        const assignedToId = t.assignedToId ?? t.assigneeId ?? t.assignedTo?.id;
        if (assignedToId != null && String(assignedToId) !== String(selectedEmployee)) return false;
      }
      return true;
    });
  }, [tasks, branchFilter, deptFilter, selectedEmployee, orgLookups]);

  const filteredReports = useMemo(() => {
    return submissions.filter(report => {
      const org = orgLookups.resolveOrg({
        employeeId: report.employeeId,
        employeeName: report.employeeName,
        taskId: report.taskId,
      });
      if (branchFilter !== 'ALL' && org.branchKey !== branchFilter) return false;
      if (deptFilter !== 'ALL' && org.deptKey !== deptFilter) return false;

      const employeeMatch =
        selectedEmployee === 'all' ||
        String(report.employeeId) === String(selectedEmployee);
      const taskMatch =
        selectedTask === 'all' ||
        String(report.taskId) === String(selectedTask);
      return employeeMatch && taskMatch;
    });
  }, [submissions, branchFilter, deptFilter, selectedEmployee, selectedTask, orgLookups]);

  const dailyReports = useMemo(
    () =>
      filteredReports.filter(report => {
        if (report.submissionDate !== selectedDate) return false;
        if (historyStatus !== 'ALL' && report.status !== historyStatus) return false;
        return true;
      }),
    [filteredReports, selectedDate, historyStatus]
  );

  const monthlyReports = useMemo(
    () =>
      filteredReports.filter(report =>
        report.submissionDate?.startsWith(selectedDate.slice(0, 7))
      ),
    [filteredReports, selectedDate]
  );

  const pendingReports  = useMemo(() => filteredReports.filter(r => r.status === 'SUBMITTED'), [filteredReports]);
  const approvedReports = useMemo(() => monthlyReports.filter(r => r.status === 'APPROVED'), [monthlyReports]);
  const rejectedReports = useMemo(() => monthlyReports.filter(r => r.status === 'REJECTED'), [monthlyReports]);

  const myTasks = useMemo(() => {
    return tasks.filter(task => {
      const assignedToId = task.assignedToId ?? task.assignedTo?.id;
      if (assignedToId == null) return isEmployee;
      return myIds.has(String(assignedToId));
    });
  }, [tasks, isEmployee, myIds]);

  const canReview = useCallback(
    (report) => {
      if (isEmployee || (myIds.size === 0 && !myId)) return false;
      if (report.employeeId != null && myIds.has(String(report.employeeId))) return false;
      if (isAdmin || isHR) return true;
      if (!isManager) return false;

      const task = tasks.find(t => String(t.id) === String(report.taskId));
      const assignerId = task?.assignedById ?? task?.assignedBy?.id;
      if (assignerId != null && myIds.has(String(assignerId))) return true;
      return scopedPoolEmployees.some(e =>
        [e.id, e.employeeId, e.userId].some(id => id != null && String(id) === String(report.employeeId))
      );
    },
    [isEmployee, myId, myIds, isAdmin, isHR, isManager, tasks, scopedPoolEmployees]
  );

  const reviewableReports = useMemo(
    () => pendingReports.filter(canReview),
    [pendingReports, canReview]
  );

  // Paginated Overview Feed (Pending Reviews if any, otherwise selected date submissions)
  const overviewList = reviewableReports.length > 0 ? reviewableReports : dailyReports;
  const totalOverviewPages = Math.max(1, Math.ceil(overviewList.length / OVERVIEW_PER_PAGE));
  const paginatedOverviewReports = useMemo(() => {
    const start = (overviewPage - 1) * OVERVIEW_PER_PAGE;
    return overviewList.slice(start, start + OVERVIEW_PER_PAGE);
  }, [overviewList, overviewPage]);

  // Paginated Daily Reports
  const totalHistoryPages = Math.max(1, Math.ceil(dailyReports.length / REPORTS_PER_PAGE));
  const paginatedDailyReports = useMemo(() => {
    const start = (historyPage - 1) * REPORTS_PER_PAGE;
    return dailyReports.slice(start, start + REPORTS_PER_PAGE);
  }, [dailyReports, historyPage]);

  // Paginated Pending Reviews
  const totalReviewPages = Math.max(1, Math.ceil(reviewableReports.length / REPORTS_PER_PAGE));
  const paginatedReviewReports = useMemo(() => {
    const start = (reviewPage - 1) * REPORTS_PER_PAGE;
    return reviewableReports.slice(start, start + REPORTS_PER_PAGE);
  }, [reviewableReports, reviewPage]);

  const getPageNumbers = (curr, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (curr > 3) pages.push('...');
    const start = Math.max(2, curr - 1);
    const end = Math.min(total - 1, curr + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (curr < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  };

  const hasScopeFilters =
    branchFilter !== 'ALL' ||
    deptFilter !== 'ALL' ||
    selectedEmployee !== 'all' ||
    selectedTask !== 'all';

  const resetScopeFilters = () => {
    setBranchFilter('ALL');
    setDeptFilter('ALL');
    setSelectedEmployee('all');
    setSelectedTask('all');
  };

  const toggleTab = (tab) => setActiveTab(prev => (prev === tab ? null : tab));

  return (
    <div className="dw-dashboard">
      {/* Page Header */}
      <div className="dw-page-header">
        <div className="dw-hero-left">
          <div className="dw-title-icon">
            <FaCalendarAlt size={15} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{isEmployee ? 'Daily Work & Performance' : 'Team Daily Work & Performance'}</h2>
              <span className="dw-role-pill">{role}</span>
            </div>
            <p className="dw-muted" style={{ margin: '2px 0 0' }}>
              Structured daily reporting, work calendar, manager reviews, and quality analytics
            </p>
          </div>
        </div>

        <div className="dw-page-header-actions">
          <button
            type="button"
            className="dw-secondary-btn"
            onClick={() => navigate('/TaskList')}
          >
            <FaTasks size={11} /> Task Directory
          </button>
          <button
            type="button"
            className="dw-secondary-btn"
            onClick={() => navigate('/performance')}
          >
            <FaStar size={11} /> Performance
          </button>
          <button
            type="button"
            className="dw-primary-btn"
            style={{ width: 'auto', padding: '9px 16px' }}
            onClick={loadDashboard}
            disabled={loading}
          >
            <FaSyncAlt size={11} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="dw-error" style={{ marginBottom: 16 }}>{error}</div>}
      {warning && <div className="dw-warning" style={{ marginBottom: 16 }}>{warning}</div>}

      {loading ? (
        <LoadingSpinner message="Loading daily work workspace…" />
      ) : (
        !error && (
          <>
            {/* 4 Compact Monthly Summary KPIs */}
            <div className="dw-stats-grid">
              <div
                className="dw-stat dw-stat--clickable"
                style={{ borderLeftColor: '#4f46e5' }}
                onClick={() => { setHistoryStatus('ALL'); setActiveTab('reports'); }}
              >
                <div className="dw-stat-top">
                  <small>Monthly Reports ({selectedDate.slice(0, 7)})</small>
                  <div className="dw-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                    <FaFileAlt size={12} />
                  </div>
                </div>
                <div className="dw-stat-bottom">
                  <h2>{monthlyReports.length}</h2>
                  <span className="dw-stat-hint">View logs</span>
                </div>
              </div>

              <div
                className="dw-stat dw-stat--clickable"
                style={{ borderLeftColor: '#d97706' }}
                onClick={() => {
                  if (!isEmployee) setActiveTab('review');
                  else { setHistoryStatus('SUBMITTED'); setActiveTab('reports'); }
                }}
              >
                <div className="dw-stat-top">
                  <small>Pending Reviews</small>
                  <div className="dw-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <FaClock size={12} />
                  </div>
                </div>
                <div className="dw-stat-bottom">
                  <h2>{pendingReports.length}</h2>
                  <span className="dw-stat-hint">Awaiting check</span>
                </div>
              </div>

              <div
                className="dw-stat dw-stat--clickable"
                style={{ borderLeftColor: '#16a34a' }}
                onClick={() => { setHistoryStatus('APPROVED'); setActiveTab('reports'); }}
              >
                <div className="dw-stat-top">
                  <small>Monthly Approved</small>
                  <div className="dw-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                    <FaCheckCircle size={12} />
                  </div>
                </div>
                <div className="dw-stat-bottom">
                  <h2>{approvedReports.length}</h2>
                  <span className="dw-stat-hint">Verified</span>
                </div>
              </div>

              <div
                className="dw-stat dw-stat--clickable"
                style={{ borderLeftColor: '#dc2626' }}
                onClick={() => { setHistoryStatus('REJECTED'); setActiveTab('reports'); }}
              >
                <div className="dw-stat-top">
                  <small>Monthly Rejected</small>
                  <div className="dw-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    <FaTimesCircle size={12} />
                  </div>
                </div>
                <div className="dw-stat-bottom">
                  <h2>{rejectedReports.length}</h2>
                  <span className="dw-stat-hint">Rework</span>
                </div>
              </div>
            </div>

            {/* Scope Filter Bar (Manager / HR / Admin) */}
            {!isEmployee && (
              <div className="dw-card" style={{ marginBottom: 12, padding: '10px 14px' }}>
                <div className="dw-filter-grid--4">
                  <div className="dw-field">
                    <label>Branch</label>
                    <select
                      value={branchFilter}
                      onChange={e => {
                        setBranchFilter(e.target.value);
                        setDeptFilter('ALL');
                        setSelectedEmployee('all');
                        setSelectedTask('all');
                      }}
                    >
                      <option value="ALL">All Branches ({branchOptions.length})</option>
                      {branchOptions.map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="dw-field">
                    <label>Department</label>
                    <select
                      value={deptFilter}
                      onChange={e => {
                        setDeptFilter(e.target.value);
                        setSelectedEmployee('all');
                        setSelectedTask('all');
                      }}
                    >
                      <option value="ALL">All Departments ({deptOptions.length})</option>
                      {deptOptions.map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="dw-field">
                    <label>Team Member</label>
                    <select
                      value={selectedEmployee}
                      onChange={e => {
                        setSelectedEmployee(e.target.value);
                        setSelectedTask('all');
                      }}
                    >
                      <option value="all">All Team Members ({employees.length})</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={String(employee.id)}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dw-field">
                    <div className="dw-label-row">
                      <label>Filter by Task</label>
                      {hasScopeFilters && (
                        <button
                          type="button"
                          className="dw-today-btn"
                          onClick={resetScopeFilters}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedTask}
                      onChange={e => setSelectedTask(e.target.value)}
                    >
                      <option value="all">All Tasks ({filteredTaskOptions.length})</option>
                      {filteredTaskOptions.map(task => (
                        <option key={task.id} value={String(task.id)}>
                          T-{String(task.id).padStart(3, '0')} · {task.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5-Tab Navigation Bar (click to open, click again to close) */}
            <div className="dw-tabs">
              <button
                type="button"
                className={activeTab === 'overview' ? 'active' : ''}
                onClick={() => toggleTab('overview')}
              >
                <FaThLarge size={12} /> Overview
              </button>

              <button
                type="button"
                className={activeTab === 'calendar' ? 'active' : ''}
                onClick={() => toggleTab('calendar')}
              >
                <FaCalendarAlt size={12} /> Work Calendar
              </button>

              <button
                type="button"
                className={activeTab === 'reports' ? 'active' : ''}
                onClick={() => toggleTab('reports')}
              >
                <FaFileAlt size={12} /> Daily Reports ({dailyReports.length})
              </button>

              {!isEmployee && (
                <button
                  type="button"
                  className={activeTab === 'review' ? 'active' : ''}
                  onClick={() => toggleTab('review')}
                >
                  <FaClipboardCheck size={12} /> Pending Reviews ({reviewableReports.length})
                </button>
              )}

              <button
                type="button"
                className={activeTab === 'performance' ? 'active' : ''}
                onClick={() => toggleTab('performance')}
              >
                <FaChartLine size={12} /> Performance
              </button>
            </div>

            {activeTab && (
              <div key={activeTab} className="dw-tab-panel-slide">
                {/* TAB 1: OVERVIEW (focused activity / report feed without duplicate calendar or graph) */}
                {activeTab === 'overview' && (
                  isEmployee ? (
                    <DailyWorkReport
                      tasks={myTasks}
                      selectedDate={selectedDate}
                      onSubmitted={loadDashboard}
                    />
                  ) : (
                    <div className="dw-card">
                      <div className="dw-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
                        <div>
                          <h3 className="dw-title">
                            {reviewableReports.length > 0
                              ? `Pending Reviews (${reviewableReports.length})`
                              : `Activity on ${selectedDate}`}
                          </h3>
                          <p className="dw-subtitle">
                            {reviewableReports.length > 0
                              ? 'Recent submissions awaiting your evaluation and quality rating'
                              : `${dailyReports.length} submission${dailyReports.length !== 1 ? 's' : ''} logged on ${selectedDate}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="dw-secondary-btn"
                          style={{ height: 32, padding: '0 11px', fontSize: 12 }}
                          onClick={() => setActiveTab('performance')}
                        >
                          <FaChartLine size={11} /> Quality Analytics <FaArrowRight size={10} />
                        </button>
                      </div>

                      {overviewList.length > 0 ? (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {paginatedOverviewReports.map(report => (
                              <DailyWorkReview
                                key={report.id}
                                submission={report}
                                canReview={canReview(report)}
                                onReviewed={loadDashboard}
                              />
                            ))}
                          </div>

                          <div className="dw-pg-row" style={{ marginTop: 10, paddingTop: 10 }}>
                            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                              Page <strong>{overviewPage}</strong> of <strong>{totalOverviewPages}</strong> ({overviewList.length} {reviewableReports.length > 0 ? 'pending' : 'submissions'})
                            </span>

                            {totalOverviewPages > 1 && (
                              <div className="dw-pg-controls">
                                <button
                                  type="button"
                                  className="dw-pg-btn"
                                  disabled={overviewPage === 1}
                                  onClick={() => setOverviewPage(p => Math.max(1, p - 1))}
                                >
                                  <FaChevronLeft size={10} />
                                </button>
                                {getPageNumbers(overviewPage, totalOverviewPages).map((pg, idx) =>
                                  pg === '...' ? (
                                    <span key={`ov-el-${idx}`} style={{ padding: '0 4px', fontSize: 12, color: 'var(--text-muted)' }}>…</span>
                                  ) : (
                                    <button
                                      key={pg}
                                      type="button"
                                      className={`dw-pg-btn ${pg === overviewPage ? 'active' : ''}`}
                                      onClick={() => setOverviewPage(pg)}
                                    >
                                      {pg}
                                    </button>
                                  )
                                )}
                                <button
                                  type="button"
                                  className="dw-pg-btn"
                                  disabled={overviewPage === totalOverviewPages}
                                  onClick={() => setOverviewPage(p => Math.min(totalOverviewPages, p + 1))}
                                >
                                  <FaChevronRight size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '28px 16px', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                          <p className="dw-muted" style={{ margin: '0 0 10px' }}>
                            No submissions logged for {selectedDate} matching current filters.
                          </p>
                          <button
                            type="button"
                            className="dw-secondary-btn"
                            onClick={() => setActiveTab('performance')}
                          >
                            <FaChartLine size={11} /> View Monthly Performance Analytics
                          </button>
                        </div>
                      )}
                    </div>
                  )
                )}

            {/* TAB 2: WORK CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="dw-dashboard-grid">
                <DailyWorkCalendar
                  submissions={filteredReports}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />

                <div className="dw-card">
                  <div className="dw-header" style={{ marginBottom: 10, paddingBottom: 10 }}>
                    <div>
                      <h3 className="dw-title">Submissions on {selectedDate}</h3>
                      <p className="dw-subtitle">
                        {dailyReports.length} report{dailyReports.length !== 1 ? 's' : ''} recorded
                      </p>
                    </div>
                  </div>
                  {!dailyReports.length ? (
                    <p className="dw-muted" style={{ margin: 0 }}>
                      No daily work reports recorded on {selectedDate}.
                    </p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {paginatedDailyReports.map(report => (
                          <DailyWorkReview
                            key={report.id}
                            submission={report}
                            canReview={canReview(report)}
                            onReviewed={loadDashboard}
                          />
                        ))}
                      </div>

                      {totalHistoryPages > 1 && (
                        <div className="dw-pg-row">
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Page <strong>{historyPage}</strong> of <strong>{totalHistoryPages}</strong> ({dailyReports.length} reports)
                          </span>
                          <div className="dw-pg-controls">
                            <button
                              type="button"
                              className="dw-pg-btn"
                              disabled={historyPage === 1}
                              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                            >
                              <FaChevronLeft size={10} />
                            </button>
                            {getPageNumbers(historyPage, totalHistoryPages).map((pg, idx) =>
                              pg === '...' ? (
                                <span key={`cal-el-${idx}`} style={{ padding: '0 4px', fontSize: 12, color: 'var(--text-muted)' }}>…</span>
                              ) : (
                                <button
                                  key={pg}
                                  type="button"
                                  className={`dw-pg-btn ${pg === historyPage ? 'active' : ''}`}
                                  onClick={() => setHistoryPage(pg)}
                                >
                                  {pg}
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              className="dw-pg-btn"
                              disabled={historyPage === totalHistoryPages}
                              onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                            >
                              <FaChevronRight size={10} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: DAILY REPORTS */}
            {activeTab === 'reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {isEmployee && (
                  <DailyWorkReport
                    tasks={myTasks}
                    selectedDate={selectedDate}
                    onSubmitted={loadDashboard}
                  />
                )}

                <div className="dw-card">
                  <div className="dw-header" style={{ marginBottom: 12, paddingBottom: 12 }}>
                    <div>
                      <h3 className="dw-title">Daily Work History — {selectedDate}</h3>
                      <p className="dw-subtitle">
                        {dailyReports.length} report{dailyReports.length !== 1 ? 's' : ''} found for selected date
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <select
                        value={historyStatus}
                        onChange={e => setHistoryStatus(e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid var(--border-medium)', borderRadius: 8, fontSize: 12.5, background: '#fff' }}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="SUBMITTED">Pending Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      <input
                        type="date"
                        value={selectedDate}
                        max={formatDate(new Date())}
                        onChange={e => e.target.value && setSelectedDate(e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid var(--border-medium)', borderRadius: 8, fontSize: 12.5 }}
                      />
                    </div>
                  </div>

                  {!dailyReports.length ? (
                    <p className="dw-muted" style={{ margin: 0 }}>
                      No reports found for {selectedDate}.
                    </p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {paginatedDailyReports.map(report => (
                          <DailyWorkReview
                            key={report.id}
                            submission={report}
                            canReview={canReview(report)}
                            onReviewed={loadDashboard}
                          />
                        ))}
                      </div>

                      {totalHistoryPages > 1 && (
                        <div className="dw-pg-row">
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Page <strong>{historyPage}</strong> of <strong>{totalHistoryPages}</strong> ({dailyReports.length} reports)
                          </span>
                          <div className="dw-pg-controls">
                            <button
                              type="button"
                              className="dw-pg-btn"
                              disabled={historyPage === 1}
                              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                            >
                              <FaChevronLeft size={10} />
                            </button>
                            {getPageNumbers(historyPage, totalHistoryPages).map((pg, idx) =>
                              pg === '...' ? (
                                <span key={`h-el-${idx}`} style={{ padding: '0 5px', fontSize: 12, color: 'var(--text-muted)' }}>…</span>
                              ) : (
                                <button
                                  key={pg}
                                  type="button"
                                  className={`dw-pg-btn ${pg === historyPage ? 'active' : ''}`}
                                  onClick={() => setHistoryPage(pg)}
                                >
                                  {pg}
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              className="dw-pg-btn"
                              disabled={historyPage === totalHistoryPages}
                              onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                            >
                              <FaChevronRight size={10} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PENDING REVIEWS (Manager / HR / Admin) */}
            {activeTab === 'review' && !isEmployee && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="dw-card">
                  <h3 className="dw-title">Pending Work Reviews</h3>
                  <p className="dw-subtitle">
                    {reviewableReports.length} submission{reviewableReports.length !== 1 ? 's' : ''} awaiting your evaluation and quality rating.
                  </p>
                </div>

                {paginatedReviewReports.length === 0 ? (
                  <div className="dw-card" style={{ textAlign: 'center', padding: 32 }}>
                    <p className="dw-muted" style={{ margin: 0 }}>
                      All caught up! No pending submissions require review right now.
                    </p>
                  </div>
                ) : (
                  <>
                    {paginatedReviewReports.map(report => (
                      <DailyWorkReview
                        key={report.id}
                        submission={report}
                        canReview={canReview(report)}
                        onReviewed={loadDashboard}
                      />
                    ))}

                    {totalReviewPages > 1 && (
                      <div className="dw-pg-row" style={{ marginTop: 4, borderTop: 'none', paddingTop: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Page <strong>{reviewPage}</strong> of <strong>{totalReviewPages}</strong> ({reviewableReports.length} pending)
                        </span>
                        <div className="dw-pg-controls">
                          <button
                            type="button"
                            className="dw-pg-btn"
                            disabled={reviewPage === 1}
                            onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                          >
                            <FaChevronLeft size={10} />
                          </button>
                          {getPageNumbers(reviewPage, totalReviewPages).map((pg, idx) =>
                            pg === '...' ? (
                              <span key={`r-el-${idx}`} style={{ padding: '0 5px', fontSize: 12, color: 'var(--text-muted)' }}>…</span>
                            ) : (
                              <button
                                key={pg}
                                type="button"
                                className={`dw-pg-btn ${pg === reviewPage ? 'active' : ''}`}
                                onClick={() => setReviewPage(pg)}
                              >
                                {pg}
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            className="dw-pg-btn"
                            disabled={reviewPage === totalReviewPages}
                            onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                          >
                            <FaChevronRight size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 5: PERFORMANCE */}
            {activeTab === 'performance' && (
              <DailyWorkPerformance
                submissions={monthlyReports}
                monthValue={selectedDate.slice(0, 7)}
                onMonthChange={val => {
                  if (val) setSelectedDate(`${val}-01`);
                }}
              />
            )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
