import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  FaChartLine,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaPaperPlane,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaTasks,
  FaStar,
  FaExternalLinkAlt,
  FaSitemap,
  FaThList,
  FaTimes,
  FaUserTie,
  FaBuilding
} from 'react-icons/fa';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  extractArray
} from '../config/api.config';
import {
  getNormalizedRole,
  normalizeRole,
  cleanPersonName
} from './taskAccess';
import { getStoredUser, fetchScopedEmployeesPool } from './taskScope';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './TaskModule.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const fmt = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const norm = (val) => (val == null ? '' : String(val).trim().toLowerCase());

export default function TaskProgressChart({ user, isEmployee: isEmployeeProp }) {
  const navigate = useNavigate();
  const currentUser = user || getStoredUser();
  const role = getNormalizedRole(currentUser);
  const isEmployee = typeof isEmployeeProp === 'boolean' ? isEmployeeProp : role === 'Employee';
  const isManagerOrHR = !isEmployee && (role === 'Manager' || role === 'Hr');

  const [days, setDays] = useState(14);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeeMeta, setEmployeeMeta] = useState([]);
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState('all');
  const [activePanel, setActivePanel] = useState(null); // null | 'analytics' | 'department' | 'table'
  const [compareMetric, setCompareMetric] = useState('completed'); // 'completed' | 'approved' | 'submissions'
  const [deptMetric, setDeptMetric] = useState('all'); // 'all' | 'submissions' | 'approved' | 'completed' | 'approvalRate'
  const [deptRoleFilter, setDeptRoleFilter] = useState('ALL'); // 'ALL' | 'Manager' | 'Employee'
  const [deptManagerFilter, setDeptManagerFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));

    const q = new URLSearchParams({ from: fmt(from), to: fmt(to) });
    const url = `${isEmployee ? API_ENDPOINTS.PROGRESS_ME : API_ENDPOINTS.PROGRESS_TEAM}?${q}`;

    setLoading(true);
    const requests = [fetch(url, { headers: getAuthHeaders() })];
    if (!isEmployee) {
      requests.push(
        fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }).catch(() => null),
        fetchScopedEmployeesPool(currentUser).catch(() => null)
      );
    }

    Promise.all(requests)
      .then(async ([res, branchRes, empPool]) => {
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
        const body = data.response ?? data.data ?? data;
        let list = Array.isArray(body) ? body : body ? [body] : extractArray(data);

        if (!isEmployee) {
          const branchJson = branchRes && branchRes.ok ? await branchRes.json().catch(() => null) : null;
          if (!active) return;

          if (branchJson) setBranches(extractArray(branchJson));
          if (empPool?.departments) setDepartments(empPool.departments);
          if (empPool?.rawEmployees) setEmployeeMeta(empPool.rawEmployees);

          if (isManagerOrHR && empPool?.loaded) {
            const scopedEmps = empPool.scopedEmployees || [];
            const allowedIds = new Set();
            const allowedNames = new Set();
            scopedEmps.forEach(e => {
              [e.id, e.employeeId, e.userId].forEach(id => {
                if (id != null && String(id).trim() !== '') allowedIds.add(String(id));
              });
              const n = cleanPersonName(e.name).toLowerCase();
              if (n) allowedNames.add(n);
            });
            list = list.filter(p => {
              if (p.employeeId != null && allowedIds.has(String(p.employeeId))) return true;
              const pName = cleanPersonName(p.employeeName).toLowerCase();
              return Boolean(pName && allowedNames.has(pName));
            });
          }
        }

        setPeople(list);
        setSelected('all');
        setCurrentPage(1);
      })
      .catch((err) => {
        if (!active) return;
        toast.error('Progress', err.message || 'Could not load progress');
        setPeople([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, isEmployee, isManagerOrHR]);

  // Enrich each progress entry with resolved branch, department, role & manager metadata
  const enrichedPeople = useMemo(() => {
    const branchById = new Map();
    const branchByName = new Map();
    branches.forEach(b => {
      if (b?.id != null) branchById.set(String(b.id), b);
      if (b?.name) branchByName.set(norm(b.name), b);
    });

    const deptById = new Map();
    const deptByName = new Map();
    departments.forEach(d => {
      if (d?.id != null) deptById.set(String(d.id), d);
      if (d?.name) {
        const key = norm(d.name);
        if (!deptByName.has(key)) deptByName.set(key, d);
      }
    });

    const empById = new Map();
    const empByName = new Map();
    employeeMeta.forEach(e => {
      [e.id, e.employeeId, e.userId].forEach(id => {
        if (id != null && String(id).trim() !== '') empById.set(String(id), e);
      });
      const n = norm(cleanPersonName(e.name));
      if (n && !empByName.has(n)) empByName.set(n, e);
    });

    return people.map(p => {
      const emp =
        (p.employeeId != null ? empById.get(String(p.employeeId)) : null) ||
        empByName.get(norm(cleanPersonName(p.employeeName)));

      const rawDeptId = p.departmentId ?? p.department?.id ?? emp?.departmentId ?? null;
      const rawDeptName =
        (typeof p.department === 'object' ? p.department?.name : p.department) ||
        p.departmentName ||
        emp?.departmentName ||
        '';

      const deptObj =
        (rawDeptId != null ? deptById.get(String(rawDeptId)) : null) ||
        (rawDeptName ? deptByName.get(norm(rawDeptName)) : null);

      const resolvedDeptId = rawDeptId ?? deptObj?.id ?? null;
      const resolvedDeptName = rawDeptName || deptObj?.name || 'Unassigned';

      const rawBranchId =
        p.branchId ??
        (typeof p.branch === 'object' ? p.branch?.id : null) ??
        emp?.branchId ??
        deptObj?.branchId ??
        null;

      const rawBranchName =
        p.branchName ||
        (typeof p.branch === 'object' ? p.branch?.name : typeof p.branch === 'string' && isNaN(Number(p.branch)) ? p.branch : '') ||
        emp?.branchName ||
        deptObj?.branchName ||
        '';

      const branchObj =
        (rawBranchId != null ? branchById.get(String(rawBranchId)) : null) ||
        (rawBranchName ? branchByName.get(norm(rawBranchName)) : null);

      const resolvedBranchId = rawBranchId ?? branchObj?.id ?? null;
      const resolvedBranchName = rawBranchName || branchObj?.name || '';

      const resolvedRole = normalizeRole(emp?.roleName || emp?.role || p.roleName || p.role) || 'Employee';

      const rawMgrId =
        emp?.managerId ??
        emp?.reportingManagerId ??
        emp?.reportingToId ??
        emp?.reportsToId ??
        p.managerId ??
        null;

      const mgrRecord = rawMgrId != null ? empById.get(String(rawMgrId)) : null;
      const rawMgrName =
        cleanPersonName(
          emp?.reportingManagerName ||
          emp?.managerName ||
          (typeof emp?.reportingManager === 'object' ? emp.reportingManager?.name : emp?.reportingManager) ||
          (typeof emp?.manager === 'object' ? emp.manager?.name : emp?.manager) ||
          mgrRecord?.name ||
          p.managerName
        ) || '';

      return {
        ...p,
        resolvedDeptId: resolvedDeptId != null ? String(resolvedDeptId) : '',
        resolvedDeptName,
        resolvedBranchId: resolvedBranchId != null ? String(resolvedBranchId) : '',
        resolvedBranchName,
        resolvedRole,
        resolvedManagerId: rawMgrId != null ? String(rawMgrId) : '',
        resolvedManagerName: rawMgrName,
      };
    });
  }, [people, branches, departments, employeeMeta]);

  // Branch dropdown options
  const branchOptions = useMemo(() => {
    const map = new Map();
    if (!isManagerOrHR) {
      branches.forEach(b => {
        if (b?.id != null && b?.name) map.set(String(b.id), b.name);
      });
    }
    enrichedPeople.forEach(p => {
      if (p.resolvedBranchName) {
        const key = p.resolvedBranchId || `name:${norm(p.resolvedBranchName)}`;
        if (!map.has(key)) map.set(key, p.resolvedBranchName);
      }
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [branches, enrichedPeople, isManagerOrHR]);

  // Department dropdown options cascaded by selected Branch
  const deptOptions = useMemo(() => {
    const map = new Map();
    const matchesSelectedBranch = (bId, bName) => {
      if (branchFilter === 'ALL') return true;
      if (branchFilter.startsWith('name:')) {
        return norm(bName) === branchFilter.slice(5);
      }
      if (bId != null && String(bId) === String(branchFilter)) return true;
      const selectedBranchLabel = branchOptions.find(([id]) => id === branchFilter)?.[1];
      return Boolean(selectedBranchLabel && bName && norm(bName) === norm(selectedBranchLabel));
    };

    if (!isManagerOrHR) {
      departments.forEach(d => {
        if (d?.id != null && d?.name && matchesSelectedBranch(d.branchId, d.branchName)) {
          map.set(String(d.id), d.name);
        }
      });
    }

    enrichedPeople.forEach(p => {
      if (!matchesSelectedBranch(p.resolvedBranchId, p.resolvedBranchName)) return;
      if (p.resolvedDeptName && p.resolvedDeptName !== 'Unassigned') {
        const key = p.resolvedDeptId || `name:${norm(p.resolvedDeptName)}`;
        if (!map.has(key)) map.set(key, p.resolvedDeptName);
      }
    });

    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [departments, enrichedPeople, branchFilter, branchOptions, isManagerOrHR]);

  // Team members filtered by Branch and Department
  const orgFilteredPeople = useMemo(() => {
    const selectedBranchLabel = branchOptions.find(([id]) => id === branchFilter)?.[1];
    const selectedDeptLabel = deptOptions.find(([id]) => id === deptFilter)?.[1];

    return enrichedPeople.filter(p => {
      if (branchFilter !== 'ALL') {
        if (branchFilter.startsWith('name:')) {
          if (norm(p.resolvedBranchName) !== branchFilter.slice(5)) return false;
        } else {
          const idMatch = p.resolvedBranchId && p.resolvedBranchId === String(branchFilter);
          const nameMatch = !p.resolvedBranchId && selectedBranchLabel && norm(p.resolvedBranchName) === norm(selectedBranchLabel);
          if (!idMatch && !nameMatch) return false;
        }
      }

      if (deptFilter !== 'ALL') {
        if (deptFilter.startsWith('name:')) {
          if (norm(p.resolvedDeptName) !== deptFilter.slice(5)) return false;
        } else {
          const idMatch = p.resolvedDeptId && p.resolvedDeptId === String(deptFilter);
          const nameMatch = !p.resolvedDeptId && selectedDeptLabel && norm(p.resolvedDeptName) === norm(selectedDeptLabel);
          if (!idMatch && !nameMatch) return false;
        }
      }

      return true;
    });
  }, [enrichedPeople, branchFilter, deptFilter, branchOptions, deptOptions]);

  const shown = useMemo(
    () => (
      selected === 'all'
        ? orgFilteredPeople
        : orgFilteredPeople.filter(p => String(p.employeeId) === String(selected))
    ),
    [orgFilteredPeople, selected]
  );

  // Aggregate daily submissions & approvals across selected employees
  const daily = useMemo(() => {
    if (!shown.length || !Array.isArray(shown[0].daily)) return [];
    return shown[0].daily.map((d, i) => ({
      date: d.date,
      submissions: shown.reduce((s, p) => s + (p.daily?.[i]?.submissions || 0), 0),
      approved: shown.reduce((s, p) => s + (p.daily?.[i]?.approved || 0), 0),
    }));
  }, [shown]);

  const totals = useMemo(() => {
    const total = shown.reduce((s, p) => s + (p.totalSubmissions || 0), 0);
    const avgDaily = shown.length
      ? (shown.reduce((s, p) => s + (p.avgDailySubmissions || 0), 0) / shown.length).toFixed(2)
      : '0.00';
    const approved = shown.reduce((s, p) => s + (p.approvedSubmissions || 0), 0);
    const late = shown.reduce((s, p) => s + (p.lateSubmissions || 0), 0);
    return { total, avgDaily, approved, late };
  }, [shown]);

  // Daily Submissions ChartJS Dataset
  const dailyChartData = useMemo(() => ({
    labels: daily.map(d => d.date?.slice(5) || ''),
    datasets: [
      {
        label: 'Submitted Reports',
        data: daily.map(d => d.submissions),
        backgroundColor: '#6366f1',
        borderRadius: 5,
      },
      {
        label: 'Approved Reports',
        data: daily.map(d => d.approved),
        backgroundColor: '#10b981',
        borderRadius: 5,
      },
    ],
  }), [daily]);

  // Team Comparison Bar Chart (Non-Employee)
  const teamComparisonData = useMemo(() => {
    const labels = orgFilteredPeople.map(p => cleanPersonName(p.employeeName) || `Emp #${p.employeeId}`);
    const values = orgFilteredPeople.map(p => {
      if (compareMetric === 'completed') return p.taskStats?.completed ?? 0;
      if (compareMetric === 'approved') return p.approvedSubmissions ?? 0;
      return p.totalSubmissions ?? 0;
    });
    const labelMap = {
      completed: 'Completed Tasks',
      approved: 'Approved Submissions',
      submissions: 'Total Submissions',
    };
    const colorMap = {
      completed: '#10b981',
      approved: '#6366f1',
      submissions: '#3b82f6',
    };

    return {
      labels,
      datasets: [
        {
          label: labelMap[compareMetric],
          data: values,
          backgroundColor: colorMap[compareMetric],
          borderRadius: 6,
        },
      ],
    };
  }, [orgFilteredPeople, compareMetric]);

  // Department-wise Team Aggregation & Chart Data
  const departmentSummary = useMemo(() => {
    const grouped = new Map();
    const nameOccurrences = new Map();

    orgFilteredPeople.forEach(p => {
      const deptName = p.resolvedDeptName || 'Unassigned';
      const key = p.resolvedDeptId || `name:${norm(deptName)}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          name: deptName,
          branchName: p.resolvedBranchName || '',
          members: 0,
          submissions: 0,
          approved: 0,
          completed: 0,
          late: 0,
          overdue: 0,
        });
      }
      const entry = grouped.get(key);
      entry.members += 1;
      entry.submissions += p.totalSubmissions ?? 0;
      entry.approved += p.approvedSubmissions ?? 0;
      entry.completed += p.taskStats?.completed ?? 0;
      entry.late += p.lateSubmissions ?? 0;
      entry.overdue += p.taskStats?.overdue ?? 0;
    });

    const rows = [...grouped.values()];
    rows.forEach(r => {
      const n = norm(r.name);
      nameOccurrences.set(n, (nameOccurrences.get(n) || 0) + 1);
    });

    return rows
      .map(r => ({
        ...r,
        label:
          nameOccurrences.get(norm(r.name)) > 1 && r.branchName
            ? `${r.name} (${r.branchName})`
            : r.name,
        approvalRate: r.submissions > 0 ? Math.round((r.approved / r.submissions) * 100) : 0,
      }))
      .sort((a, b) => (b.submissions + b.completed) - (a.submissions + a.completed) || b.members - a.members);
  }, [orgFilteredPeople]);

  const deptWiseChartData = useMemo(() => {
    const labels = departmentSummary.map(d => d.label);
    if (deptMetric === 'all') {
      return {
        labels,
        datasets: [
          {
            label: 'Total Submissions',
            data: departmentSummary.map(d => d.submissions),
            backgroundColor: '#3b82f6',
            borderRadius: 5,
          },
          {
            label: 'Approved Submissions',
            data: departmentSummary.map(d => d.approved),
            backgroundColor: '#10b981',
            borderRadius: 5,
          },
          {
            label: 'Completed Tasks',
            data: departmentSummary.map(d => d.completed),
            backgroundColor: '#6366f1',
            borderRadius: 5,
          },
        ],
      };
    }

    const config = {
      submissions: { label: 'Total Submissions', color: '#3b82f6', val: d => d.submissions },
      approved: { label: 'Approved Submissions', color: '#10b981', val: d => d.approved },
      completed: { label: 'Completed Tasks', color: '#6366f1', val: d => d.completed },
      approvalRate: { label: 'Approval Rate (%)', color: '#0891b2', val: d => d.approvalRate },
    }[deptMetric];

    return {
      labels,
      datasets: [
        {
          label: config.label,
          data: departmentSummary.map(config.val),
          backgroundColor: config.color,
          borderRadius: 6,
        },
      ],
    };
  }, [departmentSummary, deptMetric]);

  // Managers available inside the active Branch/Department scope for Department-Wise Manager/Employee drilldown
  const deptManagerOptions = useMemo(() => {
    const map = new Map();
    orgFilteredPeople.forEach(p => {
      if (p.resolvedRole === 'Manager') {
        const name = cleanPersonName(p.employeeName);
        if (name) map.set(`mgr:${norm(name)}`, name);
      }
      if (p.resolvedManagerName) {
        map.set(`mgr:${norm(p.resolvedManagerName)}`, p.resolvedManagerName);
      }
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [orgFilteredPeople]);

  // Department-Wise Manager -> Employee hierarchy
  const managerGroupedMembers = useMemo(() => {
    const filteredByRoleAndMgr = orgFilteredPeople.filter(p => {
      if (deptRoleFilter === 'Employee' && p.resolvedRole !== 'Employee') return false;
      if (deptManagerFilter !== 'ALL') {
        const targetName = deptManagerFilter.slice(4);
        const isTheManager = p.resolvedRole === 'Manager' && norm(cleanPersonName(p.employeeName)) === targetName;
        const reportsToManager = norm(p.resolvedManagerName) === targetName;
        if (!isTheManager && !reportsToManager) return false;
      }
      return true;
    });

    const groups = new Map();
    filteredByRoleAndMgr.forEach(p => {
      const groupName =
        p.resolvedRole === 'Manager'
          ? cleanPersonName(p.employeeName) || 'Manager'
          : p.resolvedManagerName || 'Direct / Unassigned Manager';
      const groupKey =
        p.resolvedRole === 'Manager' || p.resolvedManagerName
          ? `mgr:${norm(groupName)}`
          : 'direct';

      if (deptRoleFilter === 'Manager' && groupKey === 'direct') return;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          managerName: groupName,
          isDirect: groupKey === 'direct',
          departments: new Set(),
          members: [],
          submissions: 0,
          approved: 0,
          completed: 0,
          overdue: 0,
        });
      }
      const g = groups.get(groupKey);
      if (p.resolvedDeptName) g.departments.add(p.resolvedDeptName);
      g.members.push(p);
      g.submissions += p.totalSubmissions ?? 0;
      g.approved += p.approvedSubmissions ?? 0;
      g.completed += p.taskStats?.completed ?? 0;
      g.overdue += p.taskStats?.overdue ?? 0;
    });

    return [...groups.values()]
      .map(g => ({
        ...g,
        departmentList: [...g.departments].join(', ') || '—',
        approvalRate: g.submissions > 0 ? Math.round((g.approved / g.submissions) * 100) : 0,
      }))
      .sort((a, b) => {
        if (a.isDirect !== b.isDirect) return a.isDirect ? 1 : -1;
        return b.members.length - a.members.length || a.managerName.localeCompare(b.managerName);
      });
  }, [orgFilteredPeople, deptRoleFilter, deptManagerFilter]);

  const filteredPeople = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return orgFilteredPeople;
    return orgFilteredPeople.filter(p => {
      const name = cleanPersonName(p.employeeName).toLowerCase();
      const dept = (p.resolvedDeptName || p.department || '').toLowerCase();
      const branch = (p.resolvedBranchName || '').toLowerCase();
      return name.includes(q) || dept.includes(q) || branch.includes(q);
    });
  }, [orgFilteredPeople, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPeople.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedPeople = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPeople.slice(start, start + pageSize);
  }, [filteredPeople, currentPage, pageSize]);

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

  const hasOrgOrMemberFilter =
    branchFilter !== 'ALL' ||
    deptFilter !== 'ALL' ||
    selected !== 'all' ||
    deptRoleFilter !== 'ALL' ||
    deptManagerFilter !== 'ALL';

  const resetFilters = () => {
    setBranchFilter('ALL');
    setDeptFilter('ALL');
    setSelected('all');
    setDeptRoleFilter('ALL');
    setDeptManagerFilter('ALL');
    setCurrentPage(1);
  };

  const handleBranchChange = (value) => {
    setBranchFilter(value);
    setDeptFilter('ALL');
    setSelected('all');
    setDeptManagerFilter('ALL');
    setCurrentPage(1);
  };

  const handleDeptChange = (value) => {
    setDeptFilter(value);
    setSelected('all');
    setDeptManagerFilter('ALL');
    setCurrentPage(1);
  };

  if (loading && people.length === 0) {
    return <LoadingSpinner message="Loading progress analytics…" />;
  }

  const startItem = filteredPeople.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredPeople.length);

  return (
    <div className="tm-page tm-page--compact">
      <div className="tm-card">
        {/* Header & Filters */}
        <div className="tm-card-header">
          <h3 className="tm-card-title">
            <FaChartLine size={14} color="var(--tm-primary)" />
            {isEmployee ? 'My Daily Submission & Task Progress' : 'Team Daily Submission & Task Progress'}
          </h3>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="tm-btn tm-btn-secondary tm-btn-sm"
              onClick={() => navigate('/TaskList')}
            >
              <FaTasks size={11} /> Task Directory
            </button>
            <button
              type="button"
              className="tm-btn tm-btn-secondary tm-btn-sm"
              onClick={() => navigate('/performance')}
            >
              <FaStar size={11} /> Performance
            </button>

            {!isEmployee && branchOptions.length > 0 && (
              <select
                className="tm-select tm-select--compact"
                value={branchFilter}
                onChange={e => handleBranchChange(e.target.value)}
              >
                <option value="ALL">All Branches</option>
                {branchOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}

            {!isEmployee && deptOptions.length > 0 && (
              <select
                className="tm-select tm-select--compact"
                value={deptFilter}
                onChange={e => handleDeptChange(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {deptOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}

            {!isEmployee && orgFilteredPeople.length > 0 && (
              <select
                className="tm-select tm-select--compact"
                value={selected}
                onChange={e => setSelected(e.target.value)}
              >
                <option value="all">All Team Members ({orgFilteredPeople.length})</option>
                {orgFilteredPeople.map(p => (
                  <option key={p.employeeId} value={String(p.employeeId)}>
                    {cleanPersonName(p.employeeName)}
                  </option>
                ))}
              </select>
            )}

            <select
              className="tm-select tm-select--compact"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>

            {!isEmployee && hasOrgOrMemberFilter && (
              <button
                type="button"
                className="tm-btn tm-btn-ghost tm-btn-sm"
                onClick={resetFilters}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="tm-card-body" style={{ padding: '14px 16px' }}>
          {people.length === 0 ? (
            <div className="tm-table-empty">
              No progress records available for the selected range.
            </div>
          ) : (
            <>
              {/* 4 Compact KPI Summary Cards */}
              <div className="tm-kpi-grid tm-kpi-grid--compact">
                {[
                  {
                    label: 'Total Submissions',
                    val: totals.total,
                    color: '#2563eb',
                    bg: '#eff6ff',
                    sub: `${totals.approved} approved`,
                    icon: <FaPaperPlane size={13} />,
                  },
                  {
                    label: 'Avg Submissions / Day',
                    val: totals.avgDaily,
                    color: '#0891b2',
                    bg: '#ecfeff',
                    sub: 'Daily pace',
                    icon: <FaClock size={13} />,
                  },
                  {
                    label: 'Approved Submissions',
                    val: totals.approved,
                    color: '#16a34a',
                    bg: '#f0fdf4',
                    sub: `${totals.total > 0 ? Math.round((totals.approved / totals.total) * 100) : 0}% approval rate`,
                    icon: <FaCheckCircle size={13} />,
                  },
                  {
                    label: 'Late Submissions',
                    val: totals.late,
                    color: totals.late > 0 ? '#dc2626' : '#64748b',
                    bg: totals.late > 0 ? '#fef2f2' : '#f1f5f9',
                    sub: totals.late > 0 ? 'Needs follow-up' : 'All on time',
                    icon: <FaExclamationTriangle size={13} />,
                  },
                ].map(item => (
                  <div key={item.label} className="tm-kpi-card tm-kpi-card--compact" style={{ borderLeftColor: item.color }}>
                    <div className="tm-kpi-top">
                      <span className="tm-kpi-label">{item.label}</span>
                      <span className="tm-kpi-icon" style={{ background: item.bg, color: item.color }}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="tm-kpi-bottom">
                      <div className="tm-kpi-value" style={{ color: item.color }}>{item.val}</div>
                      <span className="tm-kpi-sub">{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons to Open Analytics Graphs, Department-Wise Drilldown, & Team Breakdown Table */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: activePanel ? 14 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`tm-btn tm-btn-sm ${activePanel === 'analytics' ? 'tm-btn-primary' : 'tm-btn-secondary'}`}
                    onClick={() => setActivePanel(prev => (prev === 'analytics' ? null : 'analytics'))}
                  >
                    <FaChartLine size={12} /> View Analytics
                  </button>

                  {!isEmployee && (
                    <>
                      <button
                        type="button"
                        className={`tm-btn tm-btn-sm ${activePanel === 'department' ? 'tm-btn-primary' : 'tm-btn-secondary'}`}
                        onClick={() => setActivePanel(prev => (prev === 'department' ? null : 'department'))}
                      >
                        <FaSitemap size={12} /> Department Wise
                        <span
                          className="tm-count-badge"
                          style={
                            activePanel === 'department'
                              ? { background: 'rgba(255, 255, 255, 0.22)', color: '#ffffff' }
                              : undefined
                          }
                        >
                          {deptOptions.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`tm-btn tm-btn-sm ${activePanel === 'table' ? 'tm-btn-primary' : 'tm-btn-secondary'}`}
                        onClick={() => setActivePanel(prev => (prev === 'table' ? null : 'table'))}
                      >
                        <FaThList size={12} /> Team Breakdown
                        <span
                          className="tm-count-badge"
                          style={
                            activePanel === 'table'
                              ? { background: 'rgba(255, 255, 255, 0.22)', color: '#ffffff' }
                              : undefined
                          }
                        >
                          {filteredPeople.length}
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {activePanel && (
                  <button
                    type="button"
                    className="tm-btn tm-btn-ghost tm-btn-sm"
                    onClick={() => setActivePanel(null)}
                  >
                    <FaTimes size={11} /> Close
                  </button>
                )}
              </div>

              {/* Panel 1: View Analytics (Daily Submissions & Employee Comparison Graphs) */}
              {activePanel === 'analytics' && (
                orgFilteredPeople.length === 0 ? (
                  <div className="tm-chart-empty">
                    No analytics data matches the selected branch or department filter.
                  </div>
                ) : (
                  <div className={!isEmployee && orgFilteredPeople.length > 1 ? 'tm-charts-grid--equal' : ''}>
                    {/* Daily Submissions vs Approvals Chart */}
                    <div className="tm-chart-card tm-chart-card--compact" style={{ marginBottom: 0 }}>
                      <div className="tm-chart-head">
                        <h4 className="tm-chart-title">Daily Submissions vs Approved Reports</h4>
                      </div>
                      <div className="tm-chart-box tm-chart-box--compact">
                        <Bar
                          data={dailyChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
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
                      </div>
                    </div>

                    {/* Employee Performance Comparison Chart (Manager / HR / Admin) */}
                    {!isEmployee && orgFilteredPeople.length > 1 && (
                      <div className="tm-chart-card tm-chart-card--compact">
                        <div className="tm-chart-head">
                          <h4 className="tm-chart-title">
                            <FaUsers size={13} color="var(--tm-primary)" /> Employee Comparison
                          </h4>
                          <select
                            className="tm-select tm-select--compact"
                            value={compareMetric}
                            onChange={e => setCompareMetric(e.target.value)}
                          >
                            <option value="completed">Completed Tasks</option>
                            <option value="approved">Approved Submissions</option>
                            <option value="submissions">Total Submissions</option>
                          </select>
                        </div>

                        <div className="tm-chart-box tm-chart-box--compact">
                          <Bar
                            data={teamComparisonData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
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
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Panel 2: Department-Wise Cascaded Dropdown & Manager / Employee Breakdown */}
              {!isEmployee && activePanel === 'department' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Branch -> Department -> Manager -> Role Filter Toolbar */}
                  <div className="tm-dept-toolbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="tm-filter-label">
                        <FaBuilding size={11} color="var(--tm-primary)" /> Branch &amp; Dept Drilldown
                      </span>

                      {branchOptions.length > 0 && (
                        <select
                          className="tm-select tm-select--compact"
                          value={branchFilter}
                          onChange={e => handleBranchChange(e.target.value)}
                        >
                          <option value="ALL">All Branches ({branchOptions.length})</option>
                          {branchOptions.map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      )}

                      <select
                        className="tm-select tm-select--compact"
                        value={deptFilter}
                        onChange={e => handleDeptChange(e.target.value)}
                      >
                        <option value="ALL">All Departments ({deptOptions.length})</option>
                        {deptOptions.map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </select>

                      {deptManagerOptions.length > 0 && (
                        <select
                          className="tm-select tm-select--compact"
                          value={deptManagerFilter}
                          onChange={e => setDeptManagerFilter(e.target.value)}
                        >
                          <option value="ALL">All Managers ({deptManagerOptions.length})</option>
                          {deptManagerOptions.map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="tm-segmented">
                      {[
                        { id: 'ALL', label: 'All Roles' },
                        { id: 'Manager', label: 'Managers' },
                        { id: 'Employee', label: 'Employees' },
                      ].map(r => (
                        <button
                          key={r.id}
                          type="button"
                          className={`tm-segmented-btn ${deptRoleFilter === r.id ? 'active' : ''}`}
                          style={{ padding: '4px 10px', fontSize: 11.5 }}
                          onClick={() => setDeptRoleFilter(r.id)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clickable Department Pills According to Selected Branch */}
                  {deptOptions.length > 0 && (
                    <div className="tm-dept-pills">
                      <button
                        type="button"
                        className={`tm-dept-pill ${deptFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => handleDeptChange('ALL')}
                      >
                        All Departments
                        <span className="tm-dept-pill-count">{deptOptions.length}</span>
                      </button>
                      {deptOptions.map(([id, name]) => {
                        const deptStats = departmentSummary.find(
                          d => d.key === id || norm(d.name) === norm(name)
                        );
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`tm-dept-pill ${deptFilter === id ? 'active' : ''}`}
                            onClick={() => handleDeptChange(deptFilter === id ? 'ALL' : id)}
                          >
                            {name}
                            <span className="tm-dept-pill-count">{deptStats?.members ?? 0}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Department-Wise Graph (click any bar to filter that department) */}
                  <div className="tm-chart-card tm-chart-card--compact">
                    <div className="tm-chart-head">
                      <h4 className="tm-chart-title">
                        <FaSitemap size={13} color="var(--tm-primary)" /> Department-Wise Team Progress
                        <span className="tm-count-badge">{departmentSummary.length}</span>
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="tm-chart-sub">Click a bar or pill to filter</span>
                        <select
                          className="tm-select tm-select--compact"
                          value={deptMetric}
                          onChange={e => setDeptMetric(e.target.value)}
                        >
                          <option value="all">All Metrics</option>
                          <option value="submissions">Total Submissions</option>
                          <option value="approved">Approved Submissions</option>
                          <option value="completed">Completed Tasks</option>
                          <option value="approvalRate">Approval Rate (%)</option>
                        </select>
                      </div>
                    </div>

                    {departmentSummary.length === 0 ? (
                      <div className="tm-chart-empty">
                        No department data matches the selected branch or department filter.
                      </div>
                    ) : (
                      <div className="tm-chart-box" style={{ height: 220 }}>
                        <Bar
                          data={deptWiseChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            onClick: (_, elements) => {
                              if (elements?.length > 0) {
                                const clicked = departmentSummary[elements[0].index];
                                if (clicked) {
                                  const matchingOption = deptOptions.find(
                                    ([id, name]) => id === clicked.key || norm(name) === norm(clicked.name)
                                  );
                                  if (matchingOption) {
                                    handleDeptChange(deptFilter === matchingOption[0] ? 'ALL' : matchingOption[0]);
                                  }
                                }
                              }
                            },
                            plugins: {
                              legend: {
                                display: deptMetric === 'all',
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
                                callbacks: {
                                  afterBody: (items) => {
                                    const idx = items?.[0]?.dataIndex;
                                    const dept = idx != null ? departmentSummary[idx] : null;
                                    if (!dept) return [];
                                    return [
                                      `Team Members: ${dept.members}`,
                                      `Approval Rate: ${dept.approvalRate}%`,
                                    ];
                                  },
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
                                max: deptMetric === 'approvalRate' ? 100 : undefined,
                                grid: { color: '#f1f5f9' },
                                border: { display: false },
                                ticks: {
                                  precision: 0,
                                  font: { size: 11 },
                                  callback: v => (deptMetric === 'approvalRate' ? `${v}%` : v),
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Manager -> Employee Hierarchy Breakdown for Active Branch / Department */}
                  {managerGroupedMembers.length === 0 ? (
                    <div className="tm-chart-empty">
                      No managers or employees match the selected department filters.
                    </div>
                  ) : deptRoleFilter === 'Manager' ? (
                    <div className="tm-card">
                      <div className="tm-card-header">
                        <h4 className="tm-card-title" style={{ fontSize: 13.5 }}>
                          <FaUserTie size={13} color="var(--tm-primary)" /> Managers Team Summary
                          <span className="tm-count-badge">{managerGroupedMembers.length}</span>
                        </h4>
                        <span className="tm-card-meta">Click a manager to inspect their team members</span>
                      </div>
                      <div className="tm-table-scroll">
                        <table className="tm-table">
                          <thead>
                            <tr>
                              {['Manager', 'Department(s)', 'Team Members', 'Submissions', 'Approved', 'Approval %', 'Completed Tasks', 'Overdue'].map(h => (
                                <th key={h}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {managerGroupedMembers.map(group => (
                              <tr
                                key={group.key}
                                className="tm-tr-clickable"
                                onClick={() => {
                                  setDeptManagerFilter(group.key);
                                  setDeptRoleFilter('ALL');
                                }}
                              >
                                <td style={{ fontWeight: 600 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <FaUserTie size={11} color="var(--tm-primary)" />
                                    {group.managerName}
                                  </span>
                                </td>
                                <td>{group.departmentList}</td>
                                <td><span className="tm-count-badge">{group.members.length}</span></td>
                                <td>{group.submissions}</td>
                                <td style={{ color: '#16a34a', fontWeight: 600 }}>{group.approved}</td>
                                <td style={{ fontWeight: 600, color: group.approvalRate >= 75 ? '#16a34a' : group.approvalRate >= 40 ? '#d97706' : '#64748b' }}>
                                  {group.approvalRate}%
                                </td>
                                <td style={{ fontWeight: 600 }}>{group.completed}</td>
                                <td style={{ color: group.overdue > 0 ? '#dc2626' : 'inherit', fontWeight: 600 }}>
                                  {group.overdue}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="tm-mgr-group-list">
                      {managerGroupedMembers.map(group => (
                        <div key={group.key} className="tm-mgr-group">
                          <div className="tm-mgr-group-head">
                            <span className="tm-mgr-group-title">
                              <FaUserTie size={12} color="var(--tm-primary)" />
                              {group.managerName}
                              <span className="tm-count-badge">{group.members.length}</span>
                            </span>
                            <div className="tm-mgr-group-metrics">
                              <span>Submissions: {group.submissions}</span>
                              <span style={{ color: '#16a34a' }}>Approved: {group.approved}</span>
                              <span>Completed Tasks: {group.completed}</span>
                            </div>
                          </div>

                          <div className="tm-table-scroll">
                            <table className="tm-table">
                              <thead>
                                <tr>
                                  {['Member', 'Role', 'Department', 'Submissions', 'Approved', 'Approval %', 'Completed', 'Overdue', 'Tasks'].map(h => (
                                    <th key={h}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {group.members.map(p => {
                                  const isRowSelected = String(p.employeeId) === String(selected);
                                  const totalSub = p.totalSubmissions ?? 0;
                                  const appSub = p.approvedSubmissions ?? 0;
                                  const approvalPct = totalSub > 0 ? Math.round((appSub / totalSub) * 100) : 0;
                                  const cleanName = cleanPersonName(p.employeeName);
                                  return (
                                    <tr
                                      key={p.employeeId}
                                      onClick={() => setSelected(isRowSelected ? 'all' : String(p.employeeId))}
                                      className={`tm-tr-clickable ${isRowSelected ? 'tm-tr-selected' : ''}`}
                                    >
                                      <td style={{ fontWeight: 600 }}>{cleanName}</td>
                                      <td>
                                        <span className="tm-role-pill">{p.resolvedRole}</span>
                                      </td>
                                      <td>{p.resolvedDeptName || p.department || '—'}</td>
                                      <td>{totalSub}</td>
                                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{appSub}</td>
                                      <td style={{ fontWeight: 600, color: approvalPct >= 75 ? '#16a34a' : approvalPct >= 40 ? '#d97706' : '#64748b' }}>
                                        {approvalPct}%
                                      </td>
                                      <td style={{ fontWeight: 600 }}>{p.taskStats?.completed ?? 0}</td>
                                      <td style={{ color: (p.taskStats?.overdue || 0) > 0 ? '#dc2626' : 'inherit', fontWeight: 600 }}>
                                        {p.taskStats?.overdue ?? 0}
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className="tm-icon-action tm-icon-action--primary"
                                          onClick={e => {
                                            e.stopPropagation();
                                            navigate('/TaskList', { state: { assignee: cleanName } });
                                          }}
                                          title={`View tasks for ${cleanName}`}
                                        >
                                          <FaExternalLinkAlt size={10} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Panel 3: Paginated Team Breakdown Table */}
              {!isEmployee && activePanel === 'table' && (
                <div className="tm-card">
                  <div className="tm-card-header" style={{ marginBottom: 12 }}>
                    <h4 className="tm-card-title" style={{ margin: 0, fontSize: 14 }}>
                      <FaUsers size={13} color="var(--tm-primary)" />
                      Team Breakdown
                      <span className="tm-count-badge">{filteredPeople.length}</span>
                    </h4>
                    <div className="tm-search-wrap" style={{ minWidth: 220 }}>
                      <FaSearch size={12} className="tm-search-icon" />
                      <input
                        type="text"
                        className="tm-input"
                        placeholder="Search member or department…"
                        value={searchTerm}
                        onChange={e => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <div className="tm-table-scroll">
                    <table className="tm-table">
                      <thead>
                        <tr>
                          {['Employee', 'Department', 'Submissions', 'Approved', 'Approval %', 'Avg / Day', 'Active Days', 'Completed Tasks', 'Overdue', 'Tasks'].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPeople.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ textAlign: 'center', padding: 20, color: 'var(--tm-text-muted)' }}>
                              {searchTerm.trim()
                                ? `No team members match "${searchTerm}".`
                                : 'No team members match the selected branch or department filter.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedPeople.map(p => {
                            const isRowSelected = String(p.employeeId) === String(selected);
                            const totalSub = p.totalSubmissions ?? 0;
                            const appSub = p.approvedSubmissions ?? 0;
                            const approvalPct = totalSub > 0 ? Math.round((appSub / totalSub) * 100) : 0;
                            const cleanName = cleanPersonName(p.employeeName);
                            return (
                              <tr
                                key={p.employeeId}
                                onClick={() => setSelected(isRowSelected ? 'all' : String(p.employeeId))}
                                className={`tm-tr-clickable ${isRowSelected ? 'tm-tr-selected' : ''}`}
                              >
                                <td style={{ fontWeight: 600 }}>
                                  {cleanName}
                                </td>
                                <td>{p.resolvedDeptName || p.department || '—'}</td>
                                <td>{totalSub}</td>
                                <td style={{ color: '#16a34a', fontWeight: 600 }}>{appSub}</td>
                                <td style={{ fontWeight: 600, color: approvalPct >= 75 ? '#16a34a' : approvalPct >= 40 ? '#d97706' : '#64748b' }}>
                                  {approvalPct}%
                                </td>
                                <td>{p.avgDailySubmissions ?? 0}</td>
                                <td>{p.activeDays ?? 0}</td>
                                <td style={{ fontWeight: 600 }}>{p.taskStats?.completed ?? 0}</td>
                                <td style={{ color: (p.taskStats?.overdue || 0) > 0 ? '#dc2626' : 'inherit', fontWeight: 600 }}>
                                  {p.taskStats?.overdue ?? 0}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="tm-icon-action tm-icon-action--primary"
                                    onClick={e => {
                                      e.stopPropagation();
                                      navigate('/TaskList', { state: { assignee: cleanName } });
                                    }}
                                    title={`View tasks for ${cleanName}`}
                                  >
                                    <FaExternalLinkAlt size={10} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredPeople.length > 0 && (
                    <div className="tm-pagination-bar">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="tm-pagination-info">
                          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{filteredPeople.length}</strong> members
                        </span>
                        <select
                          className="tm-select tm-select--compact"
                          value={pageSize}
                          onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        >
                          <option value={8}>8 / page</option>
                          <option value={15}>15 / page</option>
                          <option value={30}>30 / page</option>
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
