import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTasks, FaClock, FaCheckCircle, FaSpinner, FaSearch,
  FaExclamationTriangle, FaArrowRight, FaPlus, FaEye,
  FaChartBar, FaUserCheck, FaFire, FaCalendarAlt
} from 'react-icons/fa';
import { STORAGE_KEYS } from '../config/api.config';

/* ── helpers ── */
const getUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; }
};

const PRIORITY_COLORS = { Critical: '#9d174d', High: '#ef4444', Medium: '#d97706', Low: '#059669' };
const PRIORITY_BG    = { Critical: '#fdf2f8', High: '#fee2e2', Medium: '#fef3c7', Low: '#d1fae5' };

const StatusBadge = ({ status }) => {
  const map = {
    'Pending Approval': { bg: '#fef3c7', color: '#92400e' },
    'In Progress':      { bg: '#dbeafe', color: '#1e40af' },
    'Completed':        { bg: '#dcfce7', color: '#166534' },
    'In Review':        { bg: '#f3e8ff', color: '#5b21b6' },
    'Rejected':         { bg: '#fee2e2', color: '#991b1b' },
    'Change Requested': { bg: '#fff7ed', color: '#c2410c' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => (
  <span style={{
    background: PRIORITY_BG[priority] || '#f1f5f9',
    color: PRIORITY_COLORS[priority] || '#475569',
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600
  }}>{priority}</span>
);

/* ── mock data (replace with API) ── */
const MOCK_TASKS = [
  { id: 'T-001', title: 'Redesign User Onboarding Flow', status: 'In Progress', priority: 'High', assigneeName: 'Arjun Mehta', dept: 'Design', deadline: '2026-04-20', progress: 65, createdBy: 'Riya Sharma' },
  { id: 'T-002', title: 'API Rate Limiting Implementation', status: 'Pending Approval', priority: 'Critical', assigneeName: 'Dev Patel', dept: 'Backend', deadline: '2026-04-15', progress: 0, createdBy: 'Karan Singh' },
  { id: 'T-003', title: 'Monthly Performance Report Q1', status: 'Completed', priority: 'Medium', assigneeName: 'Priya Nair', dept: 'HR', deadline: '2026-04-10', progress: 100, createdBy: 'Riya Sharma' },
  { id: 'T-004', title: 'Fix Authentication Bug on Mobile', status: 'In Review', priority: 'High', assigneeName: 'Karan Singh', dept: 'Engineering', deadline: '2026-04-12', progress: 85, createdBy: 'Arjun Mehta' },
  { id: 'T-005', title: 'Set Up CI/CD Pipeline for Staging', status: 'Pending Approval', priority: 'Medium', assigneeName: 'Dev Patel', dept: 'DevOps', deadline: '2026-04-25', progress: 0, createdBy: 'Dev Patel' },
  { id: 'T-006', title: 'User Research for New Dashboard', status: 'Change Requested', priority: 'Low', assigneeName: 'Priya Nair', dept: 'Design', deadline: '2026-04-30', progress: 30, createdBy: 'Riya Sharma' },
];

export default function TaskDashboard({ user }) {
  const navigate = useNavigate();
  const currentUser = user || getUser();
  const [tasks] = useState(MOCK_TASKS);

  const stats = {
    total:   tasks.length,
    pending: tasks.filter(t => t.status === 'Pending Approval').length,
    active:  tasks.filter(t => t.status === 'In Progress').length,
    review:  tasks.filter(t => t.status === 'In Review').length,
    done:    tasks.filter(t => t.status === 'Completed').length,
    change:  tasks.filter(t => t.status === 'Change Requested').length,
  };

  const deptLoad = Object.entries(
    tasks.reduce((acc, t) => { acc[t.dept] = (acc[t.dept] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const priorityDist = ['Critical','High','Medium','Low'].map(p => ({
    label: p,
    count: tasks.filter(t => t.priority === p).length,
  }));

  const overdue = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Completed');
  const recent  = [...tasks].slice(0, 5);

  const StatCard = ({ label, value, icon, iconBg, iconColor, sub, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)', border: '1px solid var(--border-light)',
        borderRadius: 18, padding: 20, cursor: onClick ? 'pointer' : 'default',
        transition: 'all .3s', boxShadow: '0 2px 8px rgba(99,102,241,.04)',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,.10)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,.04)'; }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 13, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, fontSize: 20, marginBottom: 14 }}>
        {icon}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: '22px 24px', background: 'var(--bg-page)', minHeight: '100vh', animation: 'taskFadeUp .35s ease' }}>
      <style>{`
        @keyframes taskFadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .task-tr:hover td { background: #fafbff !important; cursor:pointer }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 21, boxShadow: '0 4px 12px rgba(99,102,241,.25)' }}>
            <FaChartBar />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Sora',sans-serif", letterSpacing: '-0.02em' }}>Task Dashboard</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Welcome back, {currentUser?.name || 'User'} · {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
        </div>
        {/* <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/tasks')}
            style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '9px 18px', borderRadius: 11, fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <FaEye size={13} /> View All Tasks
          </button>
          <button
            onClick={() => navigate('/tasks/create')}
            style={{ background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 12px rgba(99,102,241,.25)' }}
          >
            <FaPlus size={12} /> New Task
          </button>
        </div> */}
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaExclamationTriangle style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
            {overdue.length} overdue task{overdue.length > 1 ? 's' : ''} — {overdue.map(t => t.title).join(', ')}
          </span>
          <button onClick={() => navigate('/tasks')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            View <FaArrowRight size={10} />
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 22 }}>
        <StatCard label="Total Tasks"       value={stats.total}   icon={<FaTasks />}             iconBg="#ede9fe" iconColor="var(--accent-indigo)" sub="All tasks"         onClick={() => navigate('/tasks')} />
        <StatCard label="Pending Approval"  value={stats.pending} icon={<FaClock />}              iconBg="#fef3c7" iconColor="var(--accent-amber)"  sub="Awaiting review"  onClick={() => navigate('/tasks')} />
        <StatCard label="In Progress"       value={stats.active}  icon={<FaSpinner />}            iconBg="#dbeafe" iconColor="#1d4ed8"              sub="Currently active" onClick={() => navigate('/tasks')} />
        <StatCard label="In Review"         value={stats.review}  icon={<FaSearch />}             iconBg="#f3e8ff" iconColor="#7c3aed"              sub="Under review"     onClick={() => navigate('/tasks')} />
        <StatCard label="Completed"         value={stats.done}    icon={<FaCheckCircle />}        iconBg="#d1fae5" iconColor="var(--accent-teal)"   sub="Done"             onClick={() => navigate('/tasks')} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16, marginBottom: 22 }}>

        {/* Dept Workload */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Department Workload</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tasks per dept</span>
          </div>
          <div style={{ padding: 20 }}>
            {deptLoad.map(([dept, count]) => (
              <div key={dept} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{dept}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ background: '#e8eaf6', borderRadius: 10, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / stats.total) * 100}%`, background: 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 10, transition: 'width .6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Status Breakdown</h3>
          </div>
          <div style={{ padding: 20 }}>
            {[
              { label: 'Pending Approval', val: stats.pending, color: '#d97706' },
              { label: 'In Progress',      val: stats.active,  color: 'var(--accent-indigo)' },
              { label: 'In Review',        val: stats.review,  color: '#7c3aed' },
              { label: 'Change Requested', val: stats.change,  color: '#c2410c' },
              { label: 'Completed',        val: stats.done,    color: 'var(--success)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{val}/{stats.total}</span>
                </div>
                <div style={{ background: '#e8eaf6', borderRadius: 10, height: 7, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${stats.total > 0 ? (val / stats.total) * 100 : 0}%`, background: color, borderRadius: 10, transition: 'width .6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Mix */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Priority Mix</h3>
          </div>
          <div style={{ padding: '14px 20px' }}>
            {priorityDist.map(({ label, count }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[label], display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 60, height: 6, background: '#e8eaf6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`, background: PRIORITY_COLORS[label], borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', width: 18, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaFire style={{ color: 'var(--accent-teal)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#065f46' }}>{stats.done} tasks completed this cycle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Recent Tasks</h3>
          <button onClick={() => navigate('/tasks')} style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)', color: 'var(--accent-indigo)', padding: '6px 14px', borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            View All <FaArrowRight size={10} />
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1.5px solid var(--accent-indigo-pale)' }}>
                {['Task ID','Title','Assignee','Priority','Status','Deadline','Progress',''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(t => (
                <tr key={t.id} className="task-tr" onClick={() => navigate('/tasks/detail', { state: { taskId: t.id } })}>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#ede9fe', padding: '2px 8px', borderRadius: 6, fontWeight: 600, color: 'var(--accent-indigo)' }}>{t.id}</span>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.dept}</div>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9', fontSize: 13, color: 'var(--text-secondary)' }}>{t.assigneeName}</td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}><PriorityBadge priority={t.priority} /></td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}><StatusBadge status={t.status} /></td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{t.deadline}</td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9', minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#e8eaf6', borderRadius: 8, height: 7, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${t.progress}%`, background: t.progress >= 100 ? 'var(--success)' : 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 8 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 28 }}>{t.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/tasks/detail', { state: { taskId: t.id } }); }}
                      style={{ width: 32, height: 32, background: '#ede9fe', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}
                    >
                      <FaEye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}