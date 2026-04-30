import React, { useState, useEffect, useCallback } from 'react';
import {
  FaRupeeSign, FaUsers, FaCheckCircle, FaClock,
  FaArrowUp, FaArrowDown, FaChartBar,
  FaRobot,
} from 'react-icons/fa';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import axios from 'axios';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const getUser = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; } };

const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));
const fmtL = (n) => `₹${((n || 0) / 100000).toFixed(2)}L`;
const fmtK = (n) => `₹${((n || 0) / 1000).toFixed(1)}K`;
const toLabel = (ym) => { try { const [y, m] = ym.split('-'); return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' }); } catch { return ym; } };
const toLabelFull = (ym) => { try { const [y, m] = ym.split('-'); return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' }); } catch { return ym; } };
const currentYM = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`; };

const getToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
const axiosCfg = () => ({ headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } });

export default function PayrollDashboard({ user }) {
  const currentUser = user || getUser();

  const [selectedMonth, setSelectedMonth] = useState(currentYM());
  const [months, setMonths] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (month) => {
    setLoading(true);
    try {
      const [statsRes, monthsRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/dashboard/stats`, axiosCfg()),
        axios.get(`${BASE_URL}/api/payroll/months`, axiosCfg()),
      ]);
      
      const data = statsRes.data?.response || statsRes.data?.data || statsRes.data || {};
      setStats(data);
      
      const mArr = monthsRes.data?.response || monthsRes.data?.data || [];
      setMonths(mArr.length ? mArr : [month]);
      
      if (mArr.length > 0 && month !== mArr[0]) {
        setSelectedMonth(mArr[0]);
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(selectedMonth); }, [selectedMonth, fetchData]);

  if (loading) return <LoadingSpinner message="Loading payroll analytics…" />;

  const s = stats || {};
  const trend = s.payrollTrend || [];
  const depts = s.deptHeadcounts || [];
  
  const totalNetPayroll = s.totalPayrollThisMonth || 0;
  const totalEmployees = s.totalEmployees || 0;
  const processedCount = s.processedPayrollCount || 0;
  const pendingCount = s.pendingPayrollCount || 0;

  const maxNet = Math.max(...trend.map(t => t.netPayroll || 0), 1);
  const maxDept = Math.max(...depts.map(d => d.count || 0), 1);
  
  const prevMonth = trend.length >= 2 ? trend[trend.length - 2] : null;
  const currMonth = trend.length >= 1 ? trend[trend.length - 1] : null;
  const momChange = prevMonth && currMonth && prevMonth.netPayroll > 0
    ? ((currMonth.netPayroll - prevMonth.netPayroll) / prevMonth.netPayroll * 100).toFixed(1)
    : null;

  const statCards = [
    { 
      label: 'Total Payroll', 
      value: fmtL(totalNetPayroll), 
      sub: toLabelFull(selectedMonth), 
      icon: <FaRupeeSign />, 
      grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)', 
      light: '#ede9fe', 
      text: '#4c1d95' 
    },
    { 
      label: 'Employees', 
      value: totalEmployees, 
      sub: 'Active workforce', 
      icon: <FaUsers />, 
      grad: 'linear-gradient(135deg,#0891b2,#06b6d4)', 
      light: '#cffafe', 
      text: '#164e63' 
    },
    { 
      label: 'Processed', 
      value: `${processedCount}/${totalEmployees}`, 
      sub: 'Records processed', 
      icon: <FaCheckCircle />, 
      grad: 'linear-gradient(135deg,#059669,#10b981)', 
      light: '#d1fae5', 
      text: '#064e3b' 
    },
    { 
      label: 'Pending', 
      value: pendingCount, 
      sub: 'Awaiting action', 
      icon: <FaClock />, 
      grad: 'linear-gradient(135deg,#d97706,#f59e0b)', 
      light: '#fef3c7', 
      text: '#78350f' 
    },
  ];

  return (
    <div style={{ 
      padding: '24px', 
      background: 'var(--bg-page)', 
      minHeight: '100vh', 
      animation: 'payFade .4s ease',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <style>{`
        @keyframes payFade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .pay-card { background:var(--card-bg); border:1px solid var(--border-light); border-radius:18px; overflow:hidden; transition: all .2s; }
        .pay-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
        .trend-bar { transition: height .6s cubic-bezier(.34,1.56,.64,1); }
        .dept-bar  { transition: width  .6s cubic-bezier(.34,1.56,.64,1); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 15, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, boxShadow: '0 8px 20px rgba(99,102,241,.3)' }}>
            <FaRupeeSign />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, fontFamily: "'Sora',sans-serif", letterSpacing: '-0.03em' }}>Payroll Analytics</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
              Overview · {toLabelFull(selectedMonth)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ 
              padding: '9px 14px', 
              border: '1.5px solid var(--border-medium)', 
              borderRadius: 11, 
              fontSize: 13, 
              fontFamily: "'DM Sans',sans-serif", 
              color: 'var(--text-primary)', 
              background: 'var(--bg-white)', 
              outline: 'none', 
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {months.map(m => <option key={m} value={m}>{toLabelFull(m)}</option>)}
          </select>
        </div>
      </div>

      {/* AI Summary Banner */}
      {s.aiSummary && (
        <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius: 16, padding: '16px 20px', marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
            <FaRobot size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, fontFamily: "'Sora',sans-serif" }}>AI Payroll Insight</div>
            <div style={{ fontSize: 14, color: '#e0e7ff', lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{s.aiSummary}</div>
          </div>
          {momChange !== null && (
            <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: parseFloat(momChange) >= 0 ? '#34d399' : '#f87171', fontFamily: "'Sora',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                {parseFloat(momChange) >= 0 ? <FaArrowUp size={14} /> : <FaArrowDown size={14} />} {Math.abs(momChange)}%
              </div>
              <div style={{ fontSize: 11, color: '#818cf8', fontFamily: "'DM Sans',sans-serif" }}>vs last month</div>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards – Centered Content (same as TaskDashboard) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
        {statCards.map(({ label, value, sub, icon, grad, light }) => (
          <div key={label} className="pay-card" style={{ 
            padding: 22, 
            position: 'relative', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 6,
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: light, opacity: .6 }} />
            <div style={{ 
              width: 44, 
              height: 44, 
              borderRadius: 13, 
              background: grad, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontSize: 19, 
              marginBottom: 8, 
              boxShadow: `0 6px 16px ${light}`,
            }}>
              {icon}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: "'Sora',sans-serif" }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>

        {/* 6-Month Trend Chart */}
        <div className="pay-card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>Payroll Trend</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif" }}>Net salary outflow · last 6 months</p>
            </div>
            <FaChartBar style={{ color: 'var(--accent-indigo)', opacity: .5, fontSize: 18 }} />
          </div>
          {trend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>No trend data yet</div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160, marginBottom: 10 }}>
                {trend.map((t) => {
                  const h = Math.max((t.netPayroll / maxNet) * 140, 20);
                  const isSelected = t.yearMonth === selectedMonth;
                  return (
                    <div key={t.yearMonth} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? '#6366f1' : 'var(--text-primary)', fontFamily: "'Sora',sans-serif" }}>
                        {fmtK(t.netPayroll)}
                      </div>
                      <div
                        className="trend-bar"
                        style={{
                          width: '100%',
                          height: `${h}px`,
                          background: isSelected
                            ? 'linear-gradient(180deg,#6366f1,#8b5cf6)'
                            : t.netPayroll > 0
                              ? 'linear-gradient(180deg,#a5b4fc,#c7d2fe)'
                              : '#e2e8f0',
                          borderRadius: '8px 8px 4px 4px',
                          boxShadow: isSelected ? '0 4px 14px rgba(99,102,241,.3)' : 'none',
                          cursor: 'pointer',
                          opacity: t.netPayroll > 0 ? 1 : 0.5,
                        }}
                        onClick={() => setSelectedMonth(t.yearMonth)}
                        title={`${toLabelFull(t.yearMonth)}: ${fmtK(t.netPayroll)} | ${t.headCount} employees`}
                      />
                      <div style={{ fontSize: 10, color: isSelected ? '#6366f1' : 'var(--text-muted)', fontWeight: isSelected ? 700 : 400, fontFamily: "'DM Sans',sans-serif" }}>
                        {t.label || toLabel(t.yearMonth)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif" }}>
                        {t.headCount} emp
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(180deg,#6366f1,#8b5cf6)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif" }}>Selected Month</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaUsers size={10} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif" }}>Employee Count</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Department Breakdown */}
        <div className="pay-card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>Dept Breakdown</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif" }}>Employees by department</p>
            </div>
          </div>
          {depts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>No data for this month</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {depts.slice(0, 5).map((d, i) => {
                const colors = ['#6366f1', '#0891b2', '#059669', '#d97706', '#dc2626'];
                const w = Math.max((d.count / maxDept) * 100, 4);
                return (
                  <div key={d.department}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'DM Sans',sans-serif" }}>{d.department || 'Unknown'}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans',sans-serif" }}>{d.pct}%</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: colors[i], fontFamily: "'Sora',sans-serif" }}>{d.count}</span>
                      </div>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 8, height: 7, overflow: 'hidden' }}>
                      <div className="dept-bar" style={{ height: '100%', width: `${w}%`, background: colors[i], borderRadius: 8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Salary Component Breakdown */}
      <div className="pay-card" style={{ padding: 22 }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>Salary Component Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {[
            { label: 'Basic', value: s.totalBasicPayroll || 0, color: '#6366f1', bg: '#ede9fe' },
            { label: 'HRA', value: (s.totalPayrollThisMonth || 0) * 0.4, color: '#0891b2', bg: '#cffafe' },
            { label: 'Net Payroll', value: s.totalPayrollThisMonth || 0, color: '#059669', bg: '#d1fae5' },
            { label: 'PF', value: (s.totalBasicPayroll || 0) * 0.12, color: '#d97706', bg: '#fef3c7' },
            { label: 'Avg Salary', value: s.avgSalary || 0, color: '#dc2626', bg: '#fee2e2' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, fontFamily: "'Sora',sans-serif" }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Sora',sans-serif" }}>{fmtK(value)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>
                {totalNetPayroll > 0 ? ((value || 0) / totalNetPayroll * 100).toFixed(1) + '%' : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}