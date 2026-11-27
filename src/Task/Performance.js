import React, { useState, useEffect, useMemo } from 'react';
import {
  FaStar, FaChartLine, FaTrophy, FaArrowUp, FaCheckCircle,
  FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaTasks,
  FaMedal, FaClipboardList
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  extractArray
} from '../config/api.config';
import {
  getNormalizedRole,
  normalizeRole,
  getMyId,
  cleanPersonName,
  unwrapResponse,
  safeReadJson,
  parseApiError
} from './taskAccess';
import { getStoredUser, getMyOrgScope, fetchScopedEmployeesPool, collectMyIds } from './taskScope';
import TaskModuleNav from './TaskModuleNav';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import './TaskModule.css';

const REVIEWS_PER_PAGE = 8;
const norm = (val) => (val == null ? '' : String(val).trim().toLowerCase());

const getInitials = (name) => {
  const clean = cleanPersonName(name);
  if (!clean) return '?';
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
};

const computeScopedStats = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { avgRating: null, completedReviews: 0, goalAchievementPct: null, outstandingCount: 0 };
  }
  const rated = items.filter(p => p.rating != null && !isNaN(Number(p.rating)));
  const avgRating = rated.length
    ? rated.reduce((s, p) => s + Number(p.rating), 0) / rated.length
    : null;
  const totalGoals = items.reduce((s, p) => s + (Number(p.totalGoals) || 0), 0);
  const achievedGoals = items.reduce((s, p) => s + (Number(p.achievedGoals) || 0), 0);
  const goalAchievementPct = totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : null;
  const outstandingCount = rated.filter(p => Number(p.rating) >= 4.5).length;
  return {
    avgRating,
    completedReviews: items.length,
    goalAchievementPct,
    outstandingCount,
  };
};

const Performance = ({ user }) => {
  const navigate = useNavigate();
  const currentUser = user || getStoredUser();
  const userRole = getNormalizedRole(currentUser);
  const myId = getMyId(currentUser);
  const isEmployee = userRole === 'Employee';
  const isManagerOrHR = userRole === 'Manager' || userRole === 'Hr';
  const canStartReview = ['Admin', 'Hr', 'Manager'].includes(userRole);

  const [performances, setPerformances]   = useState([]);
  const [stats, setStats]                 = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [branches, setBranches]           = useState([]);
  const [departmentsMeta, setDepartmentsMeta] = useState([]);
  const [employeeMeta, setEmployeeMeta]   = useState([]);
  const [loading, setLoading]             = useState(true);

  const [searchTerm, setSearchTerm]     = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [deptFilter, setDeptFilter]     = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage]                 = useState(1);

  const loadPerformanceData = async () => {
    try {
      const requests = [
        fetch(API_ENDPOINTS.GET_PERFORMANCE, { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.GET_PERF_STATS, { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.GET_TOP_PERFORMERS, { headers: getAuthHeaders() }),
        !isEmployee ? fetchScopedEmployeesPool(currentUser).catch(() => null) : Promise.resolve(null),
        !isEmployee ? fetch(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: getAuthHeaders() }).catch(() => null) : Promise.resolve(null),
      ];

      const [listRes, statsRes, topRes, empPool, branchRes] = await Promise.all(requests);

      const [listData, statsData, topData, branchData] = await Promise.all([
        safeReadJson(listRes),
        safeReadJson(statsRes),
        safeReadJson(topRes),
        branchRes && branchRes.ok ? safeReadJson(branchRes) : Promise.resolve(null),
      ]);

      if (!listRes.ok) throw new Error(parseApiError(listRes, listData, 'Failed to load performance list'));
      if (!statsRes.ok) throw new Error(parseApiError(statsRes, statsData, 'Failed to load performance stats'));
      if (!topRes.ok) throw new Error(parseApiError(topRes, topData, 'Failed to load top performers'));

      let cleanedPerformances = extractArray(listData).map(perf => ({
        ...perf,
        name: cleanPersonName(perf.name) || 'Anonymous',
      }));

      let cleanedTopPerformers = extractArray(topData).map(perf => ({
        ...perf,
        name: cleanPersonName(perf.name) || 'Anonymous',
      }));

      let resolvedStats = unwrapResponse(statsData) || null;

      if (!isEmployee) {
        if (branchData) setBranches(extractArray(branchData));
        if (empPool?.departments) setDepartmentsMeta(empPool.departments);
        if (empPool?.rawEmployees) setEmployeeMeta(empPool.rawEmployees);
      }

      if (isManagerOrHR) {
        const empList = empPool?.rawEmployees || [];
        const scopedEmps = empPool?.scopedEmployees || [];
        const { myIds, myName, myDeptName } = getMyOrgScope(empList, currentUser);
        const allowedIds = new Set();
        const allowedNames = new Set();
        scopedEmps.forEach(e => {
          [e.id, e.employeeId, e.userId].forEach(id => {
            if (id != null && String(id).trim() !== '') allowedIds.add(String(id));
          });
          const n = cleanPersonName(e.name).toLowerCase();
          if (n) allowedNames.add(n);
        });

        const filterByScope = (item) => {
          const empId = item.employeeId ?? item.empId ?? item.employee?.id ?? null;
          const itemName = cleanPersonName(item.name).toLowerCase();
          if (empId != null && myIds.has(String(empId))) return false;
          if (myName && itemName && itemName === myName) return false;
          const itemRole = item.roleName || item.role;
          if (itemRole && normalizeRole(itemRole) !== 'Employee') return false;

          if (empPool?.loaded) {
            if (empId != null) return allowedIds.has(String(empId));
            if (itemName) return allowedNames.has(itemName);
            return false;
          }

          if (isManagerOrHR && myDeptName) {
            return String(item.department || '').trim().toLowerCase() === String(myDeptName).trim().toLowerCase();
          }
          return false;
        };

        cleanedPerformances = cleanedPerformances.filter(filterByScope);
        cleanedTopPerformers = cleanedTopPerformers.filter(filterByScope);
        resolvedStats = computeScopedStats(cleanedPerformances);
      } else if (userRole === 'Employee') {
        const myIds = collectMyIds(currentUser);
        const onlyMe = (item) => {
          const itemIds = [item.employeeId, item.empId, item.id, item.employee?.id]
            .filter(v => v != null)
            .map(String);
          if (itemIds.some(id => myIds.has(id))) return true;
          if (myId && itemIds.includes(String(myId))) return true;
          return false;
        };
        cleanedPerformances = cleanedPerformances.filter(onlyMe);
        cleanedTopPerformers = cleanedTopPerformers.filter(onlyMe);
        resolvedStats = computeScopedStats(cleanedPerformances);
      } else {
        // Fill missing/zero goalAchievementPct from real list totals when reviews carry goals
        const computed = computeScopedStats(cleanedPerformances);
        if (
          resolvedStats &&
          (resolvedStats.goalAchievementPct == null || Number(resolvedStats.goalAchievementPct) === 0) &&
          computed.goalAchievementPct != null &&
          computed.goalAchievementPct > 0
        ) {
          resolvedStats = { ...resolvedStats, goalAchievementPct: computed.goalAchievementPct };
        }
      }

      setPerformances(cleanedPerformances);
      setStats(resolvedStats);
      setTopPerformers(cleanedTopPerformers);
    } catch (err) {
      toast.error('Load Error', err.message || 'Could not load performance data');
      console.error('Performance data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve branch name on each performance row for filtering
  const enrichedPerformances = useMemo(() => {
    const branchById = new Map();
    branches.forEach(b => {
      if (b?.id != null && b?.name) branchById.set(String(b.id), b.name);
    });

    const deptById = new Map();
    const deptByName = new Map();
    departmentsMeta.forEach(d => {
      if (d?.id != null) deptById.set(String(d.id), d);
      if (d?.name && !deptByName.has(norm(d.name))) deptByName.set(norm(d.name), d);
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

    return performances.map(perf => {
      const empId = perf.employeeId ?? perf.empId ?? perf.employee?.id ?? null;
      const emp =
        (empId != null ? empById.get(String(empId)) : null) ||
        empByName.get(norm(cleanPersonName(perf.name)));
      const deptObj =
        (emp?.departmentId != null ? deptById.get(String(emp.departmentId)) : null) ||
        (perf.department ? deptByName.get(norm(perf.department)) : null);
      const branchId = perf.branchId ?? emp?.branchId ?? deptObj?.branchId ?? null;
      const branchName =
        perf.branchName ||
        emp?.branchName ||
        deptObj?.branchName ||
        (branchId != null ? branchById.get(String(branchId)) : '') ||
        '';

      return { ...perf, resolvedBranch: branchName };
    });
  }, [performances, branches, departmentsMeta, employeeMeta]);

  const branchOptions = useMemo(() => {
    const set = new Set();
    enrichedPerformances.forEach(p => {
      if (p.resolvedBranch) set.add(p.resolvedBranch);
    });
    return [...set].sort();
  }, [enrichedPerformances]);

  const departments = useMemo(() => {
    const set = new Set();
    enrichedPerformances.forEach(p => {
      if (branchFilter !== 'ALL' && p.resolvedBranch !== branchFilter) return;
      if (p.department) set.add(p.department);
    });
    return [...set].sort();
  }, [enrichedPerformances, branchFilter]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    enrichedPerformances.forEach(p => {
      if (p.status) set.add(p.status);
    });
    return [...set].sort();
  }, [enrichedPerformances]);

  const filteredPerformances = useMemo(() => {
    return enrichedPerformances.filter(perf => {
      if (branchFilter !== 'ALL' && perf.resolvedBranch !== branchFilter) return false;
      if (deptFilter !== 'ALL' && perf.department !== deptFilter) return false;
      if (statusFilter !== 'ALL' && perf.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        perf.name?.toLowerCase().includes(q) ||
        perf.department?.toLowerCase().includes(q) ||
        perf.resolvedBranch?.toLowerCase().includes(q) ||
        perf.status?.toLowerCase().includes(q)
      );
    });
  }, [enrichedPerformances, branchFilter, deptFilter, statusFilter, searchTerm]);

  const hasFilters =
    branchFilter !== 'ALL' || deptFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm.trim() !== '';

  const resetFilters = () => {
    setBranchFilter('ALL');
    setDeptFilter('ALL');
    setStatusFilter('ALL');
    setSearchTerm('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredPerformances.length / REVIEWS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginatedPerformances = useMemo(() => {
    const start = (page - 1) * REVIEWS_PER_PAGE;
    return filteredPerformances.slice(start, start + REVIEWS_PER_PAGE);
  }, [filteredPerformances, page]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Outstanding':
      case 'Excellent':
        return { bg: '#dcfce7', color: '#166534' };
      case 'Great':
      case 'Good':
        return { bg: '#dbeafe', color: '#1e40af' };
      default:
        return { bg: '#fef3c7', color: '#92400e' };
    }
  };

  const formatImprovement = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return `${value}%`;
    if (typeof value === 'string' && value.includes('%')) return value;
    return `${value}%`;
  };

  const calculateProgress = (achieved, total) => {
    if (!total || total === 0) return 0;
    return Math.round((achieved / total) * 100);
  };

  if (loading) return <LoadingSpinner message="Loading performance data…" />;

  return (
    <div className="tm-page tm-page--compact">
      {/* Header */}
      <div className="tm-header">
        <div className="tm-header-left">
          <div className="tm-header-icon">
            <FaTrophy />
          </div>
          <div>
            <h1 className="tm-title">Performance Reviews</h1>
            <p className="tm-subtitle">
              <span className="tm-role-pill">{userRole}</span>
              <span>Track and manage employee performance metrics and review cycles</span>
            </p>
          </div>
        </div>

        <div className="tm-header-actions">
          <button
            type="button"
            className="tm-btn tm-btn-secondary"
            onClick={() => navigate('/TaskList')}
          >
            <FaTasks size={11} /> Task Directory
          </button>
          {canStartReview && (
            <button
              type="button"
              className="tm-btn tm-btn-primary"
              onClick={() => navigate('/PerformanceReview')}
            >
              <FaPlus size={11} /> Start Review Cycle
            </button>
          )}
        </div>
      </div>

      <TaskModuleNav user={currentUser} />

      {/* 4 Compact KPI Stats Cards */}
      <div className="tm-kpi-grid tm-kpi-grid--compact">
        {[
          {
            label: 'Avg Rating',
            val: stats?.avgRating != null ? Number(stats.avgRating).toFixed(1) : '—',
            color: '#4f46e5',
            bg: '#eef2ff',
            sub: 'Current cycle',
            icon: <FaStar size={13} />,
          },
          {
            label: 'Completed Reviews',
            val: stats?.completedReviews ?? '—',
            color: '#0891b2',
            bg: '#ecfeff',
            sub: 'Evaluated records',
            icon: <FaChartLine size={13} />,
          },
          {
            label: 'Goal Achievement',
            val: stats?.goalAchievementPct != null ? `${stats.goalAchievementPct}%` : '—',
            color: '#16a34a',
            bg: '#f0fdf4',
            sub: 'Overall rate',
            icon: <FaCheckCircle size={13} />,
          },
          {
            label: 'Outstanding',
            val: stats?.outstandingCount ?? '—',
            color: '#d97706',
            bg: '#fffbeb',
            sub: 'Rated 4.5+',
            icon: <FaTrophy size={13} />,
            onClick: () => {
              setStatusFilter(prev => (prev === 'Outstanding' ? 'ALL' : 'Outstanding'));
              setPage(1);
            },
            active: statusFilter === 'Outstanding',
          },
        ].map(card => (
          <div
            key={card.label}
            className={`tm-kpi-card tm-kpi-card--compact ${card.onClick ? 'tm-kpi-card--clickable' : ''}`}
            style={{
              borderLeftColor: card.color,
              outline: card.active ? `2px solid ${card.color}` : 'none',
            }}
            onClick={card.onClick}
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
        ))}
      </div>

      {/* Ranked Top Performers Podium */}
      <div className="tm-card" style={{ marginBottom: 14 }}>
        <div className="tm-card-header">
          <h3 className="tm-card-title">
            <FaMedal size={13} color="#d97706" /> Top Performers
            <span className="tm-count-badge">{Array.isArray(topPerformers) ? topPerformers.length : 0}</span>
          </h3>
          <span className="tm-card-meta">Highest-rated team members in current cycle</span>
        </div>
        <div className="tm-card-body" style={{ padding: '14px 16px' }}>
          {!Array.isArray(topPerformers) || topPerformers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 18, color: 'var(--tm-text-muted)', fontSize: 13 }}>
              No top performers data available yet.
            </div>
          ) : (
            <div className="tm-podium-grid">
              {topPerformers.map((performer, idx) => {
                const rank = idx + 1;
                const rankClass = rank <= 3 ? `tm-podium-rank--${rank}` : 'tm-podium-rank--2';
                const cleanName = cleanPersonName(performer.name) || 'Anonymous';
                const impText = formatImprovement(performer.improvementPercent);
                const goalPct =
                  performer.totalGoals > 0
                    ? `${calculateProgress(performer.achievedGoals, performer.totalGoals)}% goals`
                    : null;

                return (
                  <div key={`${performer.employeeId}-${idx}`} className="tm-podium-card">
                    <div className="tm-performer-left">
                      <span className={`tm-podium-rank ${rankClass}`}>#{rank}</span>
                      <div className="tm-emp-avatar">{getInitials(cleanName)}</div>
                      <div style={{ minWidth: 0 }}>
                        <h6 className="tm-performer-name">{cleanName}</h6>
                        <p className="tm-performer-dept">{performer.department || '—'}</p>
                      </div>
                    </div>
                    <div className="tm-performer-right">
                      <span className="tm-rating-pill">
                        <FaStar size={11} color="#f59e0b" />
                        {performer.rating != null ? Number(performer.rating).toFixed(1) : '—'}
                      </span>
                      <small className="tm-performer-imp" style={{ marginTop: 4 }}>
                        {impText ? (
                          <>
                            <FaArrowUp size={9} /> {impText}
                          </>
                        ) : (
                          goalPct || 'Top rated'
                        )}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Unified Evaluated Reviews Directory Card (Header + Filters + Table + Pagination) */}
      <div className="tm-card">
        <div className="tm-card-header" style={{ gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 className="tm-card-title">
              <FaClipboardList size={13} color="var(--tm-primary)" /> Evaluated Reviews
            </h3>
            <span className="tm-count-badge">
              {filteredPerformances.length} review{filteredPerformances.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {!isEmployee && branchOptions.length > 0 && (
              <select
                className="tm-select tm-select--compact"
                value={branchFilter}
                onChange={e => { setBranchFilter(e.target.value); setDeptFilter('ALL'); setPage(1); }}
              >
                <option value="ALL">All Branches</option>
                {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            {departments.length > 0 && (
              <select
                className="tm-select tm-select--compact"
                value={deptFilter}
                onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            {statusOptions.length > 0 && (
              <select
                className="tm-select tm-select--compact"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">All Tiers</option>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <div className="tm-search-wrap" style={{ minWidth: 210 }}>
              <FaSearch className="tm-search-icon" />
              <input
                type="text"
                className="tm-input"
                style={{ height: 30, fontSize: 12 }}
                placeholder="Search employee or status…"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            {hasFilters && (
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

        <div className="tm-table-scroll">
          <table className="tm-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Rating</th>
                <th>Goals</th>
                <th>Progress</th>
                <th>Improvement</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPerformances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="tm-table-empty">
                    No performance reviews found.
                  </td>
                </tr>
              ) : (
                paginatedPerformances.map((perf, idx) => {
                  const pct = calculateProgress(perf.achievedGoals, perf.totalGoals);
                  const badgeStyle = getStatusBadgeStyle(perf.status);
                  const isNegative = String(perf.improvementPercent || '').includes('-');
                  const cleanName = cleanPersonName(perf.name) || 'Anonymous';
                  return (
                    <tr key={perf.id || `${perf.employeeId}-${idx}`}>
                      <td>
                        <div className="tm-emp-cell">
                          <span className="tm-emp-avatar">{getInitials(cleanName)}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: 'var(--tm-text-primary)' }}>{cleanName}</div>
                            {(perf.resolvedBranch || perf.reviewCycle) && (
                              <div className="tm-cell-sub">
                                {[perf.resolvedBranch, perf.reviewCycle].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tm-role-pill" style={{ background: '#f1f5f9', color: '#475569' }}>
                          {perf.department || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="tm-rating-pill">
                          <FaStar size={11} color="#f59e0b" />
                          <span>{perf.rating != null ? Number(perf.rating).toFixed(1) : '—'}</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {perf.achievedGoals || 0}/{perf.totalGoals || 0}
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div className="tm-progress-row">
                          <div className="tm-progress-track">
                            <div className={`tm-progress-fill ${pct >= 100 ? 'tm-progress-fill--done' : ''}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="tm-progress-pct">{pct}%</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: isNegative ? '#dc2626' : '#16a34a' }}>
                        {formatImprovement(perf.improvementPercent) || '—'}
                      </td>
                      <td>
                        <span className="tm-status-badge" style={{ background: badgeStyle.bg, color: badgeStyle.color }}>
                          <span className="tm-status-dot" />
                          {perf.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="tm-pagination-bar">
            <span className="tm-pagination-info">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({filteredPerformances.length} reviews)
            </span>
            <div className="tm-pagination-controls">
              <button
                type="button"
                className="tm-pg-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <FaChevronLeft size={10} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  type="button"
                  className={`tm-pg-btn ${pg === page ? 'active' : ''}`}
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </button>
              ))}
              <button
                type="button"
                className="tm-pg-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;
