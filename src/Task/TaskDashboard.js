import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTasks, FaClock, FaCheckCircle, FaSpinner, FaSearch,
  FaExclamationTriangle, FaArrowRight, FaEye,
  FaChartBar, FaFire,
} from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS, getAuthHeaders } from '../config/api.config';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; }
};

// ── status/priority badge helpers ──
const PRIORITY_COLORS = { Critical: '#9d174d', HIGH: '#ef4444', MEDIUM: '#d97706', LOW: '#059669' };
const PRIORITY_BG     = { Critical: '#fdf2f8', HIGH: '#fee2e2', MEDIUM: '#fef3c7', LOW: '#d1fae5' };

const StatusBadge = ({ status }) => {
  const map = {
    'PENDING_APPROVAL': { bg: '#fef3c7', color: '#92400e',  label: 'Pending Approval' },
    'IN_PROGRESS':      { bg: '#dbeafe', color: '#1e40af',  label: 'In Progress' },
    'COMPLETED':        { bg: '#dcfce7', color: '#166534',  label: 'Completed' },
    'IN_REVIEW':        { bg: '#f3e8ff', color: '#5b21b6',  label: 'In Review' },
    'REJECTED':         { bg: '#fee2e2', color: '#991b1b',  label: 'Rejected' },
    'CHANGE_REQUESTED': { bg: '#fff7ed', color: '#c2410c',  label: 'Change Requested' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const p = (priority || '').toUpperCase() === 'HIGH' ? 'High' : 
            (priority || '').toUpperCase() === 'MEDIUM' ? 'Medium' :
            (priority || '').toUpperCase() === 'LOW' ? 'Low' :
            (priority || '').charAt(0).toUpperCase() + (priority || '').slice(1).toLowerCase();
  return (
    <span style={{ background: PRIORITY_BG[p] || '#f1f5f9', color: PRIORITY_COLORS[p] || '#475569', padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
      {p}
    </span>
  );
};

// ✅ CORRECTED StatCard – fully centered content (icon, label, value, sub)
const StatCard = ({ label, value, icon, iconBg, iconColor, sub, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border-light)',
      borderRadius: 14,
      padding: 14,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all .2s',
      boxShadow: '0 1px 4px rgba(99,102,241,.04)',
      // ⭐ CENTERING
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 4,
    }}
    onMouseEnter={e => {
      if (onClick) {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,.08)';
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '0 1px 4px rgba(99,102,241,.04)';
    }}
  >
    <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, fontSize: 16, marginBottom: 4 }}>
      {icon}
    </div>
    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function TaskDashboard({ user }) {
  const navigate    = useNavigate();
  const currentUser = user || getUser();

  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res  = await fetch(API_ENDPOINTS.GET_ALL_TASKS, { headers: getAuthHeaders() });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load tasks');
        }
        
        let tasksArray = [];
        if (data.response && Array.isArray(data.response)) {
          tasksArray = data.response;
        } else if (Array.isArray(data)) {
          tasksArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          tasksArray = data.data;
        } else {
          console.warn('Unexpected API response structure:', data);
          tasksArray = [];
        }
        
        setTasks(tasksArray);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        toast.error('Load Error', err.message || 'Could not load tasks');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  const stats = {
    total:   safeTasks.length,
    pending: safeTasks.filter(t => t.status === 'PENDING_APPROVAL').length,
    active:  safeTasks.filter(t => t.status === 'IN_PROGRESS').length,
    review:  safeTasks.filter(t => t.status === 'IN_REVIEW').length,
    done:    safeTasks.filter(t => t.status === 'COMPLETED').length,
    change:  safeTasks.filter(t => t.status === 'CHANGE_REQUESTED').length,
  };

  const deptLoad = Object.entries(
    safeTasks.reduce((acc, t) => {
      const d = t.department || 'Unknown';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const priorityDist = ['HIGH', 'MEDIUM', 'LOW'].map(p => ({
    label: p === 'HIGH' ? 'High' : p === 'MEDIUM' ? 'Medium' : 'Low',
    count: safeTasks.filter(t => (t.priority || '').toUpperCase() === p).length,
  }));

  const overdue = safeTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
  );

  const recent = [...safeTasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatAssignee = (assignedTo) => {
    if (!assignedTo) return 'Unassigned';
    return assignedTo.replace(/\s+null\s*/g, '').trim();
  };

  return (
    <div style={{ padding: '12px 20px', background: 'var(--bg-page)', minHeight: '100vh', animation: 'taskFadeUp .35s ease' }}>
      <style>{`
        @keyframes taskFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .task-tr:hover td { background: #fafbff !important; cursor:pointer }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, boxShadow: '0 2px 8px rgba(99,102,241,.2)' }}>
            <FaChartBar />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "'Sora',sans-serif", letterSpacing: '-0.01em' }}>Task Dashboard</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Welcome back, {currentUser?.name || currentUser?.firstName || 'User'} · {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 10, padding: '6px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaExclamationTriangle style={{ color: 'var(--danger)', fontSize: 12, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#991b1b' }}>
            {overdue.length} overdue task{overdue.length > 1 ? 's' : ''} — {overdue.map(t => t.title).join(', ')}
          </span>
          <button onClick={() => navigate('/TaskList')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            View <FaArrowRight size={9} />
          </button>
        </div>
      )}

      {/* Stats Row – all 5 cards now have centered content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Tasks"      value={stats.total}   icon={<FaTasks size={13} />}       iconBg="#ede9fe" iconColor="var(--accent-indigo)" sub="All tasks"         onClick={() => navigate('/TaskList')} />
        <StatCard label="Pending Approval" value={stats.pending} icon={<FaClock size={13} />}        iconBg="#fef3c7" iconColor="var(--accent-amber)"  sub="Awaiting review"  onClick={() => navigate('/TaskList')} />
        <StatCard label="In Progress"      value={stats.active}  icon={<FaSpinner size={13} />}      iconBg="#dbeafe" iconColor="#1d4ed8"              sub="Currently active" onClick={() => navigate('/TaskList')} />
        <StatCard label="In Review"        value={stats.review}  icon={<FaSearch size={13} />}       iconBg="#f3e8ff" iconColor="#7c3aed"              sub="Under review"     onClick={() => navigate('/TaskList')} />
        <StatCard label="Completed"        value={stats.done}    icon={<FaCheckCircle size={13} />}  iconBg="#d1fae5" iconColor="var(--accent-teal)"   sub="Done"             onClick={() => navigate('/TaskList')} />
      </div>

      {/* Charts Row – unchanged */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 12, marginBottom: 16 }}>
        {/* Dept Workload */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Department Workload</h3>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tasks per dept</span>
          </div>
          <div style={{ padding: 12 }}>
            {deptLoad.length > 0 ? deptLoad.map(([dept, count]) => (
              <div key={dept} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{dept}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>
                </div>
                <div style={{ background: '#e8eaf6', borderRadius: 8, height: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`, background: 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 8, transition: 'width .6s ease' }} />
                </div>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: 11 }}>No data</p>}
          </div>
        </div>

        {/* Status Breakdown */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Status Breakdown</h3>
          </div>
          <div style={{ padding: 12 }}>
            {[
              { label: 'Pending Approval', val: stats.pending, color: '#d97706' },
              { label: 'In Progress',      val: stats.active,  color: 'var(--accent-indigo)' },
              { label: 'In Review',        val: stats.review,  color: '#7c3aed' },
              { label: 'Change Requested', val: stats.change,  color: '#c2410c' },
              { label: 'Completed',        val: stats.done,    color: 'var(--success)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>{val}/{stats.total}</span>
                </div>
                <div style={{ background: '#e8eaf6', borderRadius: 6, height: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${stats.total > 0 ? (val / stats.total) * 100 : 0}%`, background: color, borderRadius: 6, transition: 'width .6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Mix */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Priority Mix</h3>
          </div>
          <div style={{ padding: '10px 12px' }}>
            {priorityDist.map(({ label, count }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[label.toUpperCase()] || '#475569', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 50, height: 4, background: '#e8eaf6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`, background: PRIORITY_COLORS[label.toUpperCase()] || '#475569', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', width: 16, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FaFire style={{ color: 'var(--accent-teal)', fontSize: 11 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#065f46' }}>{stats.done} tasks completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Recent Tasks</h3>
          <button onClick={() => navigate('/TaskList')} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--accent-indigo)', padding: '4px 10px', borderRadius: 8, fontWeight: 600, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <FaArrowRight size={9} />
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {recent.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--accent-indigo-pale)' }}>
                  {['ID','Title','Assignee','Priority','Status','Deadline','Progress',''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id} className="task-tr" onClick={() => navigate('/TaskDetail', { state: { taskId: t.id } })}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f9' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#ede9fe', padding: '2px 6px', borderRadius: 5, fontWeight: 600, color: 'var(--accent-indigo)' }}>T-{String(t.id).padStart(3, '0')}</span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f9' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{t.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{t.department}</div>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f9', fontSize: 11, color: 'var(--text-secondary)' }}>
                      {formatAssignee(t.assignedTo)}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f9' }}><PriorityBadge priority={t.priority} /></td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f9' }}><StatusBadge status={t.status} /></td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f9', fontFamily: 'monospace', fontSize: 10, color: 'var(--text-secondary)' }}>
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f9', minWidth: 100 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, background: '#e8eaf6', borderRadius: 5, height: 5, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${t.progress || 0}%`, background: (t.progress || 0) >= 100 ? 'var(--success)' : 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 5 }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{t.progress || 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f9' }}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/TaskDetail', { state: { taskId: t.id } }); }}
                        style={{ width: 26, height: 26, background: '#ede9fe', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}
                      >
                        <FaEye size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No tasks found. Create your first task to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}