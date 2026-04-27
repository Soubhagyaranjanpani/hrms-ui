import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers, FaTasks, FaRupeeSign, FaStar,
  FaUserPlus, FaLayerGroup, FaRobot, FaChevronRight, FaCircle,
  FaUser, FaCheckCircle, FaClock, FaTrophy, FaSync
} from 'react-icons/fa';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

/* ─── helpers ──────────────────────────────────────────────────── */

const getUser  = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; } };
const getToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
const axiosCfg = () => ({ headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } });
const fmtINR   = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);
const fmtLakh  = (n) => { const v = (n || 0) / 100000; return v >= 1 ? `₹${v.toFixed(2)}L` : `₹${fmtINR(n)}`; };
const fmtK     = (n) => { const v = (n || 0) / 1000; return v >= 1 ? `₹${v.toFixed(1)}K` : `₹${fmtINR(n)}`; };  // ← FIXED: toified → toFixed
const clean    = (n) => (n || '').replace(/\s*null\s*/gi, ' ').replace(/\s+/g, ' ').trim();
const ini      = (n) => { const p = clean(n).split(' ').filter(Boolean); return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0]?.[0] || '?').toUpperCase(); };
const cap      = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, ' ') : '';

/* ─── Design tokens ───────────────────────────────────────────── */
const BRAND   = '#6B1E2E';
const BRAND_L = '#F9EEF0';

const C = {
  bg:      '#F5F4F1',
  surface: '#FFFFFF',
  border:  '#E4E2DC',
  border2: '#CCCAC3',
  text1:   '#1A1917',
  text2:   '#5C5A55',
  text3:   '#9B9890',
};

const KPI_COLORS = [
  { cardBg: 'linear-gradient(135deg,#6B1E2E 0%,#9B3347 100%)', icon: '#fff', label: '#ffc4cd', val: '#fff', sub: '#ffb3c0', bar: 'rgba(255,255,255,0.35)', barBg: 'rgba(255,255,255,0.15)' },
  { cardBg: 'linear-gradient(135deg,#1D4ED8 0%,#3B82F6 100%)', icon: '#fff', label: '#bfdbfe', val: '#fff', sub: '#93c5fd', bar: 'rgba(255,255,255,0.35)', barBg: 'rgba(255,255,255,0.15)' },
  { cardBg: 'linear-gradient(135deg,#065F46 0%,#10B981 100%)', icon: '#fff', label: '#a7f3d0', val: '#fff', sub: '#6ee7b7', bar: 'rgba(255,255,255,0.35)', barBg: 'rgba(255,255,255,0.15)' },
  { cardBg: 'linear-gradient(135deg,#92400E 0%,#F59E0B 100%)', icon: '#fff', label: '#fde68a', val: '#fff', sub: '#fcd34d', bar: 'rgba(255,255,255,0.35)', barBg: 'rgba(255,255,255,0.15)' },
];

const STATUS = {
  IN_PROGRESS:      { label: 'In Progress', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  COMPLETED:        { label: 'Completed',   bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  IN_REVIEW:        { label: 'In Review',   bg: '#F5F3FF', color: '#5B21B6', dot: '#8B5CF6' },
  PENDING_APPROVAL: { label: 'Pending',     bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  REJECTED:         { label: 'Rejected',    bg: '#FFF1F2', color: '#9F1239', dot: '#F43F5E' },
  DRAFT:            { label: 'Draft',       bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
};

const BADGE = {
  Outstanding:  { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  Excellent:    { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
  Great:        { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  Good:         { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  Satisfactory: { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
};

const ACTIVITY_CONFIG = {
  EMPLOYEE:    { bg: BRAND_L,    color: BRAND,     icon: <FaUser size={12} />,        label: 'Employee' },
  TASK:        { bg: '#EFF6FF',  color: '#1D4ED8', icon: <FaCheckCircle size={12} />, label: 'Task' },
  PAYROLL:     { bg: '#ECFDF5',  color: '#065F46', icon: <FaRupeeSign size={12} />,   label: 'Payroll' },
  PERFORMANCE: { bg: '#FFFBEB',  color: '#D97706', icon: <FaTrophy size={12} />,      label: 'Performance' },
};

const PAL = [BRAND, '#1D4ED8', '#065F46', '#92400E', '#5B21B6', '#0891B2', '#B45309', '#9F1239'];
const aBg  = (n = '') => PAL[(n.charCodeAt(0) || 0) % PAL.length];

/* ─── Micro components ─────────────────────────────────────────── */
const Av = ({ name, sz = 34, r = 8 }) => (
  <div style={{ width: sz, height: sz, borderRadius: r, flexShrink: 0, background: aBg(name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: sz * .32, userSelect: 'none' }}>
    {ini(name)}
  </div>
);

const Pill = ({ children, bg = C.bg, color = C.text2 }) => (
  <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, lineHeight: 1.8, whiteSpace: 'nowrap', display: 'inline-block' }}>
    {children}
  </span>
);

const Bar = ({ pct = 0, color = BRAND, bg = '#eee', h = 4 }) => (
  <div style={{ background: bg, borderRadius: 99, height: h, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color, borderRadius: 99, transition: 'width 1s ease' }} />
  </div>
);

const Stars = ({ n = 0 }) => (
  <span style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => <FaStar key={i} size={10} color={i <= Math.round(n) ? '#F59E0B' : '#E5E3DC'} />)}
  </span>
);

const HR = () => <div style={{ height: 1, background: C.border }} />;

const BrandBtn = ({ children, onClick }) => (
  <button onClick={onClick}
    style={{ fontSize: 11, color: '#fff', background: BRAND, border: 'none', padding: '5px 12px', borderRadius: 5, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', transition: 'opacity .12s' }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
  >
    {children} <FaChevronRight size={8} />
  </button>
);

const CardHeader = ({ title, sub, btnLabel, onBtn }) => (
  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{sub}</div>}
    </div>
    {btnLabel && <BrandBtn onClick={onBtn}>{btnLabel}</BrandBtn>}
  </div>
);

const StatTile = ({ label, value, bg, color }) => (
  <div style={{ background: bg, borderRadius: 7, padding: '9px 12px', border: `1px solid ${color}22` }}>
    <div style={{ fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3, opacity: .8 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.03em' }}>{value}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   AI INSIGHT BANNER - Independent Auto-Refresh Component
═══════════════════════════════════════════════════════════════ */
const AIInsightBanner = ({ initialInsight }) => {
  const [insight, setInsight] = useState(initialInsight || '');
  const [countdown, setCountdown] = useState(10);
  const [refreshSecs, setRefreshSecs] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  // Fetch AI config from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/dashboard/ai-config`, axiosCfg());
        const config = res.data?.response || res.data?.data || res.data || {};
        if (config.refreshSeconds && config.refreshSeconds > 0) {
          setRefreshSecs(config.refreshSeconds);
          setCountdown(config.refreshSeconds);
        }
        if (config.enabled !== undefined) {
          setIsEnabled(config.enabled);
        }
        if (config.lastGenerated) {
          setLastUpdated(config.lastGenerated);
        }
      } catch (e) {
        console.log('AI config fetch failed, using defaults');
      }
    };
    fetchConfig();
  }, []);

  // Fetch only the AI insight (not full dashboard)
  const fetchInsight = useCallback(async () => {
    if (!isEnabled) return;
    
    setIsRefreshing(true);
    try {
      const r = await axios.get(`${BASE_URL}/api/dashboard/stats`, axiosCfg());
      const data = r.data?.response || r.data?.data || r.data || {};
      const newInsight = data.aiSummary;
      if (newInsight && newInsight !== insight) {
        setInsight(newInsight);
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (e) {
      console.log('AI insight refresh failed');
    }
    setIsRefreshing(false);
  }, [insight, isEnabled]);

  // Countdown timer that triggers refresh
  useEffect(() => {
    if (!isEnabled) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchInsight();
          return refreshSecs;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [refreshSecs, fetchInsight, isEnabled]);

  // Update from parent
  useEffect(() => {
    if (initialInsight && initialInsight !== insight) {
      setInsight(initialInsight);
    }
  }, [initialInsight]);

  if (!insight || !isEnabled) return null;

  return (
    <div className="a1" style={{
      background: 'linear-gradient(135deg, #1E1B4B 0%, #2D1B69 100%)',
      borderRadius: 12,
      padding: '14px 20px',
      marginBottom: 18,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      border: '1px solid rgba(139,92,246,0.3)',
      position: 'relative',
      transition: 'opacity 0.3s ease',
      opacity: isRefreshing ? 0.75 : 1
    }}>
      {/* Animated Icon */}
      <div style={{
        width: 36, height: 36,
        borderRadius: 10,
        background: isRefreshing 
          ? 'linear-gradient(135deg, #F59E0B, #D97706)' 
          : 'linear-gradient(135deg, #8B5CF6, #6366F1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
        boxShadow: isRefreshing 
          ? '0 4px 12px rgba(245,158,11,0.4)' 
          : '0 4px 12px rgba(139,92,246,0.4)',
        animation: isRefreshing ? 'spin 1s linear infinite' : 'pulse 2s infinite',
        transition: 'all 0.3s ease'
      }}>
        {isRefreshing ? <FaSync size={14} /> : <FaRobot size={16} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header Row */}
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: '#A78BFA',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap'
        }}>
          <span>✨ AI-Powered Insight</span>
          
          {/* LIVE Badge */}
          <span style={{
            background: 'rgba(16,185,129,0.2)',
            color: '#34d399',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 8,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s infinite' }} />
            LIVE
          </span>

          {/* Countdown */}
          <span style={{ 
            marginLeft: 'auto', 
            fontSize: 9, 
            color: '#6B7280', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 5 
          }}>
            <FaClock size={9} />
            Next update in {countdown}s
          </span>
        </div>

        {/* Insight Text */}
        <div style={{ 
          fontSize: 13.5, 
          color: '#E0E7FF', 
          lineHeight: 1.6, 
          fontWeight: 500,
          transition: 'opacity 0.3s ease'
        }}>
          {insight}
        </div>

        {/* Footer Info */}
        <div style={{ 
          fontSize: 9, 
          color: '#6B7280', 
          marginTop: 8, 
          display: 'flex', 
          gap: 14,
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            🤖 Powered by Ari AI
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            📊 Real-time data analysis
          </span>
          {lastUpdated && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              🕐 Updated {lastUpdated}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const cu = user || getUser();

  const [d, setD]   = useState(null);
  const [lx, setLx] = useState(true);
  const [ts, setTs] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTs(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLx(true);
    try {
      const r = await axios.get(`${BASE_URL}/api/dashboard/stats`, axiosCfg());
      setD(r.data?.response || r.data?.data || r.data || {});
    } catch { setD({}); }
    finally { setLx(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = d || {};
  const fname = clean(s.loggedInUserName || cu?.name || '').split(' ')[0] || 'there';
  const role  = s.loggedInUserRole || cu?.roleName || '';
  const today = s.currentDate || ts.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const month = s.currentMonth || ts.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const hr    = ts.getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  const tasks = s.recentTasks        || [];
  const emps  = s.recentEmployees    || [];
  const perf  = s.topPerformers      || [];
  const rtg   = s.ratingDistribution || [];
  const acts  = s.recentActivity     || [];
  const depts = s.deptHeadcounts     || [];
  const trend = s.payrollTrend       || [];
  const slips = s.recentPayslips     || [];

  const maxDept  = Math.max(...depts.map(x => x.count || 0), 1);
  const maxTrend = Math.max(...trend.map(x => x.netPayroll || 0), 1);

  const TC = useMemo(() => {
    const agg = {
      total:      s.totalTasks              || 0,
      pending:    s.pendingTasks            || 0,
      inProgress: s.inProgressTasks         || 0,
      completed:  s.completedTasksThisMonth || 0,
      inReview:   s.inReviewTasks           || 0,
      overdue:    s.overdueTasks            || 0,
    };
    const allZero = agg.pending === 0 && agg.inProgress === 0 && agg.completed === 0 && agg.inReview === 0;
    if (allZero && tasks.length > 0) {
      const c = { total: 0, pending: 0, inProgress: 0, completed: 0, inReview: 0, overdue: 0 };
      tasks.forEach(t => {
        c.total++;
        if (t.status === 'PENDING_APPROVAL') c.pending++;
        else if (t.status === 'IN_PROGRESS')  c.inProgress++;
        else if (t.status === 'COMPLETED')    c.completed++;
        else if (t.status === 'IN_REVIEW')    c.inReview++;
      });
      if ((s.totalTasks || 0) > c.total) c.total = s.totalTasks;
      return c;
    }
    return agg;
  }, [d, tasks]);

  const hasPerfData = (s.avgPerformanceRating || 0) > 0 || perf.length > 0 || rtg.length > 0;

  const sortedActivities = useMemo(() => {
    return [...acts].sort((a, b) => {
      const timeA = a.activityTime || a.timestamp;
      const timeB = b.activityTime || b.timestamp;
      if (!timeA && !timeB) return 0;
      if (!timeA) return 1;
      if (!timeB) return -1;
      return timeB.localeCompare(timeA);
    });
  }, [acts]);

  if (lx) return <LoadingSpinner message="Loading dashboard…" />;

  const completionRate  = TC.total > 0 ? Math.round((TC.completed / TC.total) * 100) : 0;
  const payrollTotal    = (s.processedPayrollCount || 0) + (s.pendingPayrollCount || 0);
  const payrollPct      = payrollTotal > 0 ? Math.round(((s.processedPayrollCount || 0) / payrollTotal) * 100) : 0;

  const kpis = [
    {
      label:  'Total Employees',
      value:  s.totalEmployees || 0,
      sub:    s.newHiresThisMonth > 0 ? `+${s.newHiresThisMonth} new this month` : 'Active workforce',
      trend:  s.employeeGrowthPct > 0 ? `${s.employeeGrowthPct.toFixed(1)}% growth rate` : null,
      pct:    Math.min(s.employeeGrowthPct || 0, 100),
      icon:   <FaUsers size={18} />, route: '/Employees',
    },
    {
      label:  'Total Tasks',
      value:  TC.total,
      sub:    TC.overdue > 0 ? `⚠ ${TC.overdue} overdue` : `${TC.completed} completed`,
      trend:  `${completionRate}% completion rate`,
      pct:    completionRate,
      icon:   <FaTasks size={18} />, route: '/TaskDashboard',
    },
    {
      label:  `Payroll · ${month}`,
      value:  s.totalPayrollThisMonth > 0 ? fmtLakh(s.totalPayrollThisMonth) : '—',
      sub:    s.avgSalary > 0 ? `Avg ${fmtK(s.avgSalary)} / emp` : `${s.pendingPayrollCount || 0} pending`,
      trend:  (s.processedPayrollCount || 0) > 0 ? `${s.processedPayrollCount} processed` : 'No payroll processed',
      pct:    payrollPct,
      icon:   <FaRupeeSign size={18} />, route: '/payroll-dashboard',
    },
    {
      label:  'Avg Performance',
      value:  (s.avgPerformanceRating || 0) > 0 ? `${s.avgPerformanceRating.toFixed(1)}/5` : perf.length > 0 ? `${perf[0].rating?.toFixed(1)}/5` : '—',
      sub:    (s.performanceReviewsDone || 0) > 0 ? `${s.performanceReviewsDone} reviews done` : perf.length > 0 ? `${perf.length} top performers` : 'No reviews yet',
      trend:  (s.outstandingEmployees || 0) > 0 ? `${s.outstandingEmployees} outstanding` : rtg.length > 0 ? `${rtg.length} rating tiers` : null,
      pct:    (s.avgPerformanceRating || 0) > 0 ? (s.avgPerformanceRating / 5) * 100 : perf.length > 0 ? (perf[0].rating / 5) * 100 : 0,
      icon:   <FaStar size={18} />, route: '/Performance',
    },
  ];

  return (
    <div style={{ padding: '20px 24px', background: C.bg, minHeight: '100vh', fontFamily: "'Inter','DM Sans',sans-serif", fontSize: 13, color: C.text1 }}>
      <style>{`
        @keyframes fu { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .card  { background:${C.surface}; border:1px solid ${C.border}; border-radius:10px; overflow:hidden; }
        .cc    { cursor:pointer; transition:border-color .15s, box-shadow .15s; }
        .cc:hover { border-color:${C.border2}; box-shadow:0 3px 12px rgba(0,0,0,.07); }
        .rh:hover { background:${C.bg} !important; }
        .a1{animation:fu .28s ease both} .a2{animation:fu .28s ease .06s both}
        .a3{animation:fu .28s ease .11s both} .a4{animation:fu .28s ease .16s both}
        .nb {
          background: ${BRAND}; color:#fff; border:none;
          padding:6px 14px; border-radius:6px; cursor:pointer;
          font-size:12px; font-weight:600; display:flex; align-items:center; gap:6px;
          transition:opacity .12s; font-family:inherit;
        }
        .nb:hover { opacity:.88; }
        .kpicard { border-radius:12px; padding:16px 18px; cursor:pointer; transition:transform .15s, box-shadow .15s; overflow:hidden; position:relative; }
        .kpicard:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.18); }
      `}</style>

      {/* ═══ TOPBAR ════════════════════════════════════════════════ */}
      <div className="a1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: aBg(fname), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {ini(s.loggedInUserName || fname)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text1, letterSpacing: '-0.03em' }}>
              {greet}, {fname}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
              {role && (
                <span style={{ background: BRAND, color: '#fff', padding: '2px 9px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{role}</span>
              )}
              <span style={{ fontSize: 11, color: C.text3 }}>{today}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 7 }}>
          {[
            { l: 'Employees', i: <FaUsers size={11} />,     p: '/Employees' },
            { l: 'Tasks',     i: <FaTasks size={11} />,     p: '/TaskDashboard' },
            { l: 'Payroll',   i: <FaRupeeSign size={10} />, p: '/payroll' },
            { l: 'Reviews',   i: <FaStar size={10} />,      p: '/Performance' },
          ].map(m => (
            <button key={m.l} className="nb" onClick={() => navigate(m.p)}>{m.i} {m.l}</button>
          ))}
        </div>
      </div>

      {/* ═══ AI INSIGHT BANNER - Independent Refresh ══════════════ */}
      <AIInsightBanner initialInsight={s.aiSummary} />

      {/* ═══ KPI CARDS ════════════════════════════════════════════ */}
      <div className="a2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
        {kpis.map((k, idx) => {
          const kc = KPI_COLORS[idx];
          return (
            <div key={k.label} className="kpicard" onClick={() => navigate(k.route)} style={{ background: kc.cardBg }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: kc.label, textTransform: 'uppercase', letterSpacing: '.08em' }}>{k.label}</div>
                <div style={{ color: kc.icon, opacity: .9 }}>{k.icon}</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: kc.val, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5, fontVariantNumeric: 'tabular-nums' }}>
                {k.value}
              </div>
              <div style={{ fontSize: 11.5, color: kc.sub, fontWeight: 500, marginBottom: 12 }}>
                {k.sub}
              </div>
              <Bar pct={k.pct} color={kc.bar} bg={kc.barBg} h={3} />
              {k.trend && <div style={{ fontSize: 10, color: kc.label, marginTop: 6, opacity: .85 }}>{k.trend}</div>}
            </div>
          );
        })}
      </div>

      {/* ═══ ROW 1 — Tasks / Performance / Activity ════════════════ */}
      <div className="a3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>

        {/* TASKS */}
        <div className="card">
          <CardHeader
            title="Recent Tasks"
            sub={`${TC.inProgress} active · ${TC.inReview} in review · ${TC.overdue} overdue`}
            btnLabel="All Tasks"
            onBtn={() => navigate('/TaskList')}
          />
          <div style={{ padding: '8px 16px 10px', display: 'flex', gap: 5, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}` }}>
            {[
              { l: 'Pending',  v: TC.pending,    bg: '#FFFBEB', c: '#92400E' },
              { l: 'Active',   v: TC.inProgress, bg: '#EFF6FF', c: '#1D4ED8' },
              { l: 'Review',   v: TC.inReview,   bg: '#F5F3FF', c: '#5B21B6' },
              { l: 'Done',     v: TC.completed,  bg: '#ECFDF5', c: '#065F46' },
              { l: 'Overdue',  v: TC.overdue,    bg: '#FFF1F2', c: '#9F1239' },
            ].map(p => (
              <Pill key={p.l} bg={p.bg} color={p.c}>{p.v} {p.l}</Pill>
            ))}
          </div>
          {tasks.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: C.text3, fontSize: 12 }}>
              No tasks — <span style={{ color: BRAND, cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/TaskDashboard')}>create one →</span>
            </div>
          ) : tasks.map((t, i) => {
            const sm = STATUS[t.status] || STATUS.DRAFT;
            return (
              <React.Fragment key={t.id}>
                <div className="rh" onClick={() => navigate(`/TaskDetail/${t.id}`)} style={{ padding: '10px 16px', cursor: 'pointer', transition: 'background .1s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{t.title}</span>
                    <Pill bg={sm.bg} color={sm.color}>{sm.label}</Pill>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ flex: 1 }}><Bar pct={t.progress || 0} color={sm.dot} bg={sm.bg} h={3} /></div>
                    <span style={{ fontSize: 10, color: C.text3, flexShrink: 0 }}>{t.progress || 0}%</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: C.text3, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span>👤 {t.assignedTo}</span>
                    <span>📅 {t.dueDate}</span>
                    {t.priority && (
                      <Pill                        bg={t.priority === 'HIGH' ? '#FFF1F2' : t.priority === 'MEDIUM' ? '#FFFBEB' : '#ECFDF5'}
                        color={t.priority === 'HIGH' ? '#9F1239' : t.priority === 'MEDIUM' ? '#92400E' : '#065F46'}
                      >{cap(t.priority)}</Pill>
                    )}
                  </div>
                </div>
                {i < tasks.length - 1 && <HR />}
              </React.Fragment>
            );
          })}
        </div>

        {/* PERFORMANCE */}
        <div className="card">
          <CardHeader
            title="Performance"
            sub={
              (s.performanceReviewsDone || 0) > 0
                ? `${s.performanceReviewsDone} reviews · avg ${(s.avgPerformanceRating || 0).toFixed(1)}/5`
                : perf.length > 0 ? `${perf.length} rated employees` : 'No reviews yet'
            }
            btnLabel="Full Report"
            onBtn={() => navigate('/Performance')}
          />
          <div style={{ padding: '14px 16px' }}>
            {(s.avgPerformanceRating || 0) > 0 ? (
              <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #FDE68A' }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 34, fontWeight: 800, color: '#D97706', letterSpacing: '-0.05em', lineHeight: 1 }}>{(s.avgPerformanceRating || 0).toFixed(1)}</div>
                  <div style={{ fontSize: 9, color: '#92400E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>out of 5</div>
                </div>
                <div style={{ flex: 1 }}>
                  <Stars n={s.avgPerformanceRating} />
                  <div style={{ fontSize: 11, color: '#92400E', marginTop: 6 }}>
                    {(s.outstandingEmployees || 0) > 0 ? `${s.outstandingEmployees} outstanding · ` : ''}{s.performanceReviewsDone} reviewed
                  </div>
                  <div style={{ marginTop: 8 }}><Bar pct={(s.avgPerformanceRating / 5) * 100} color='#F59E0B' bg='#FDE68A44' h={4} /></div>
                </div>
              </div>
            ) : perf.length > 0 ? (
              <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '10px 14px', marginBottom: 14, border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600, marginBottom: 4 }}>Top performer ratings available</div>
                <Stars n={perf[0]?.rating || 0} />
                <div style={{ fontSize: 10, color: '#92400E', marginTop: 4 }}>Highest: {perf[0]?.rating?.toFixed(1)}/5</div>
              </div>
            ) : (
              <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '12px 14px', marginBottom: 14, textAlign: 'center', border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: 11, color: '#92400E', fontWeight: 500 }}>No performance reviews yet</div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>Reviews will appear here once added</div>
              </div>
            )}

            {perf.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Top Performers</div>
                {perf.map((p, i) => {
                  const bm = BADGE[p.badge] || BADGE.Good;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < perf.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{['🥇', '🥈', '🥉'][i] || ''}</span>
                      <Av name={p.employeeName} sz={30} r={7} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.employeeName}</div>
                        <div style={{ fontSize: 10, color: C.text3 }}>{p.department}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#D97706' }}>{p.rating?.toFixed(1)}</div>
                        <span style={{ background: bm.bg, color: bm.color, border: `1px solid ${bm.border}`, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>{p.badge}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {rtg.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Rating Breakdown</div>
                {rtg.map(r => {
                  const bm = BADGE[r.label] || BADGE.Good;
                  return (
                    <div key={r.label} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FaCircle size={6} color={bm.border} />
                          <span style={{ fontSize: 11, color: C.text2, fontWeight: 500 }}>{r.label}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.text1 }}>{r.count} <span style={{ color: C.text3, fontWeight: 400 }}>({r.pct}%)</span></span>
                      </div>
                      <Bar pct={r.pct || 0} color={bm.border} bg={C.bg} h={4} />
                    </div>
                  );
                })}
              </div>
            )}

            {!hasPerfData && (
              <div style={{ textAlign: 'center', padding: '12px 0', color: C.text3, fontSize: 12 }}>No performance data yet</div>
            )}
          </div>
        </div>

        {/* ACTIVITY */}
        <div className="card">
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Recent Activity</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>Last 7 days · {sortedActivities.length} events</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <FaClock size={10} color={C.text3} />
              <span style={{ fontSize: 10, color: C.text3 }}>Real-time</span>
            </div>
          </div>

          {sortedActivities.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: C.text3, fontSize: 12 }}>
              <FaClock size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
              <div>No recent activity</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>Activities will appear here</div>
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {sortedActivities.slice(0, 8).map((a, i) => {
                const config = ACTIVITY_CONFIG[a.module] || { 
                  bg: C.bg, color: C.text2, 
                  icon: <FaCircle size={10} />, 
                  label: a.module 
                };
                const timestamp = a.timestamp || 'Recently';
                const isRecent = timestamp.includes('min') || timestamp.includes('Just now') || timestamp === 'Recently';
                
                return (
                  <React.Fragment key={i}>
                    <div className="rh" style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'background .1s' }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: 8, 
                        background: config.bg, color: config.color, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: 13, flexShrink: 0,
                        border: `1px solid ${config.color}22`
                      }}>
                        {config.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ 
                            fontSize: 10, fontWeight: 700, 
                            color: config.color, 
                            textTransform: 'uppercase', 
                            letterSpacing: '.05em',
                            background: config.bg,
                            padding: '2px 6px',
                            borderRadius: 3
                          }}>
                            {config.label}
                          </span>
                          <span style={{ 
                            fontSize: 9, color: isRecent ? '#10B981' : C.text3, 
                            display: 'flex', alignItems: 'center', gap: 3,
                            flexShrink: 0
                          }}>
                            {isRecent && <FaCircle size={4} color="#10B981" />}
                            {timestamp}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.text2, fontWeight: 500, lineHeight: 1.5, marginTop: 4, marginBottom: 3 }}>
                          {a.action}
                        </div>
                        <div style={{ fontSize: 10, color: C.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>by {a.actor}</span>
                          {a.type && (
                            <>
                              <span>•</span>
                              <span style={{ textTransform: 'capitalize' }}>{a.type}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {i < sortedActivities.length - 1 && <HR />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ ROW 2 — Employees / Depts / Payroll ═══════════════════ */}
      <div className="a4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

        {/* RECENT EMPLOYEES */}
        <div className="card">
          <CardHeader title="Recent Joins" sub={`${s.totalEmployees || 0} total · ${s.newHiresThisMonth || 0} this month`} btnLabel="All Employees" onBtn={() => navigate('/Employees')} />
          {emps.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: C.text3, fontSize: 12 }}>No employees yet</div>
          ) : emps.map((e, i) => (
            <React.Fragment key={e.id || i}>
              <div className="rh" onClick={() => navigate('/Employees')} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background .1s' }}>
                <Av name={e.name} sz={34} r={8} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                  <div style={{ fontSize: 10.5, color: C.text3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {e.role && <span style={{ background: BRAND_L, color: BRAND, padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{e.role}</span>}
                    {e.department && <span>{e.department}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: C.text3 }}>{e.joinedDate}</div>
                  <div style={{ fontSize: 9, color: C.text3, fontFamily: 'monospace', marginTop: 2 }}>{e.employeeCode}</div>
                </div>
              </div>
              {i < emps.length - 1 && <HR />}
            </React.Fragment>
          ))}
          <HR />
          <div style={{ padding: '10px 16px' }}>
            <button onClick={() => navigate('/Employees')}
              style={{ width: '100%', padding: '7px', border: `1.5px dashed ${BRAND}55`, borderRadius: 7, background: 'transparent', color: BRAND, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .12s', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = BRAND_L}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <FaUserPlus size={11} /> Add New Employee
            </button>
          </div>
        </div>

        {/* DEPARTMENTS */}
        <div className="card">
          <CardHeader title="Departments" sub={`${depts.length} dept${depts.length !== 1 ? 's' : ''} · ${s.totalEmployees || 0} people`} />
          <div style={{ padding: '14px 16px' }}>
            {depts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.text3, fontSize: 12 }}>No department data</div>
            ) : depts.map((dept, i) => {
              const colors = [BRAND, '#1D4ED8', '#065F46', '#D97706', '#9F1239', '#5B21B6'];
              const bgs    = [BRAND_L, '#EFF6FF', '#ECFDF5', '#FFFBEB', '#FFF1F2', '#F5F3FF'];
              const bc  = colors[i % colors.length];
              const bbg = bgs[i % bgs.length];
              return (
                <div key={dept.department} style={{ marginBottom: i < depts.length - 1 ? 14 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: bc }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text1 }}>{dept.department}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: C.text3 }}>{dept.pct}%</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: bc, minWidth: 20, textAlign: 'right' }}>{dept.count}</span>
                    </div>
                  </div>
                  <Bar pct={(dept.count / maxDept) * 100} color={bc} bg={bbg} h={6} />
                </div>
              );
            })}
          </div>
        </div>

        {/* PAYROLL */}
        <div className="card">
          <CardHeader title="Payroll Snapshot" sub={month} btnLabel="Analytics" onBtn={() => navigate('/payroll-dashboard')} />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <StatTile label="Total Outflow"  value={s.totalPayrollThisMonth > 0 ? fmtLakh(s.totalPayrollThisMonth) : '—'} bg='#ECFDF5' color='#065F46' />
              <StatTile label="Avg / Employee" value={s.avgSalary > 0 ? fmtK(s.avgSalary) : '—'}                            bg='#EFF6FF' color='#1D4ED8' />
              <StatTile label="Processed"      value={s.processedPayrollCount || 0}                                          bg={BRAND_L} color={BRAND} />
              <StatTile label="Pending"        value={s.pendingPayrollCount || 0}                                            bg='#FFFBEB' color='#D97706' />
            </div>

            {trend.length > 0 ? (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>6-Month Trend</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 52 }}>
                  {trend.slice(-6).map((t, i, arr) => {
                    const h = Math.max((t.netPayroll / maxTrend) * 46, 4);
                    const isL = i === arr.length - 1;
                    return (
                      <div key={t.yearMonth || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: '100%', height: `${h}px`, background: isL ? BRAND : `${BRAND}55`, borderRadius: '3px 3px 2px 2px', transition: 'height .6s ease' }} />
                        <div style={{ fontSize: 9, color: isL ? BRAND : C.text3, fontWeight: isL ? 700 : 400 }}>{t.label}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ padding: '10px 12px', background: '#ECFDF5', borderRadius: 7, fontSize: 11, color: '#065F46', fontWeight: 500, textAlign: 'center', border: '1px solid #A7F3D0' }}>
                Generate payroll to see trends here
              </div>
            )}

            {slips.length > 0 && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Recent Payslips</div>
                {slips.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < slips.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Av name={p.employeeName} sz={26} r={7} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>{p.employeeName}</div>
                        <div style={{ fontSize: 10, color: C.text3 }}>{p.payrollMonth}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>{fmtK(p.netSalary)}</div>
                      <Pill bg='#ECFDF5' color='#065F46'>{cap(p.status)}</Pill>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 10 }}>
        {[
          { t: 'Salary Setup',        sub: 'Set employee CTC & allowances',                          ico: <FaLayerGroup size={13}/>, cardBg:'linear-gradient(135deg,#5B21B6,#7C3AED)', p:'/salary-structure', cta:'Configure' },
          { t: 'Run Payroll',         sub: `${s.pendingPayrollCount || 0} records need processing`,  ico: <FaRupeeSign size={13}/>,  cardBg:'linear-gradient(135deg,#065F46,#059669)', p:'/payroll',       cta:'Process' },
          { t: 'Task Manager',        sub: `${TC.inProgress || 0} tasks currently active`,           ico: <FaTasks size={13}/>,     cardBg:'linear-gradient(135deg,#1D4ED8,#3B82F6)', p:'/TaskList',         cta:'Manage' },
          { t: 'Performance Reviews', sub: `${s.totalReviewsThisQuarter || 0} reviews this quarter`, ico: <FaStar size={13}/>,      cardBg:`linear-gradient(135deg,${BRAND},#9B3347)`, p:'/Performance',      cta:'Review' },
        ].map(m => (
          <div key={m.t} className="cc" onClick={() => navigate(m.p)}
            style={{ background: m.cardBg, borderRadius: 10, padding: '13px 16px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{m.ico}</div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{m.cta} →</span>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{m.t}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2 }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}