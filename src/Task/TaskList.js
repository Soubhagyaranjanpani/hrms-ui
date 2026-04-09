import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTasks, FaPlus, FaSearch, FaEye, FaEdit,
  FaThList, FaColumns, FaFilter, FaTimes
} from 'react-icons/fa';
import { STORAGE_KEYS } from '../config/api.config';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; }
};

const PRIORITY_COLORS = { Critical: '#9d174d', High: '#ef4444', Medium: '#d97706', Low: '#059669' };
const PRIORITY_BG     = { Critical: '#fdf2f8', High: '#fee2e2', Medium: '#fef3c7', Low: '#d1fae5' };

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
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{status}</span>
  );
};

const PriorityBadge = ({ priority }) => (
  <span style={{ background: PRIORITY_BG[priority] || '#f1f5f9', color: PRIORITY_COLORS[priority] || '#475569', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{priority}</span>
);

const PRIORITY_BAR_COLOR = { Critical: '#9d174d', High: '#ef4444', Medium: '#d97706', Low: '#059669' };

/* ── shared mock (replace with API calls) ── */
const MOCK_TASKS = [
  { id: 'T-001', title: 'Redesign User Onboarding Flow', description: 'Revamp the complete onboarding experience for new users.', status: 'In Progress', priority: 'High', assigneeName: 'Arjun Mehta', assigneeId: 2, createdById: 1, createdByName: 'Riya Sharma', dept: 'Design', deadline: '2026-04-20', effort: '5 days', tags: ['UX','Frontend'], progress: 65 },
  { id: 'T-002', title: 'API Rate Limiting Implementation', description: 'Implement rate limiting on all public API endpoints.', status: 'Pending Approval', priority: 'Critical', assigneeName: 'Dev Patel', assigneeId: 6, createdById: 4, createdByName: 'Karan Singh', dept: 'Backend', deadline: '2026-04-15', effort: '3 days', tags: ['Backend','Security'], progress: 0 },
  { id: 'T-003', title: 'Monthly Performance Report Q1', description: 'Compile and analyze Q1 performance metrics.', status: 'Completed', priority: 'Medium', assigneeName: 'Priya Nair', assigneeId: 3, createdById: 1, createdByName: 'Riya Sharma', dept: 'HR', deadline: '2026-04-10', effort: '2 days', tags: ['Reports'], progress: 100 },
  { id: 'T-004', title: 'Fix Authentication Bug on Mobile', description: 'Users on iOS 17+ experiencing token expiry issues.', status: 'In Review', priority: 'High', assigneeName: 'Karan Singh', assigneeId: 4, createdById: 2, createdByName: 'Arjun Mehta', dept: 'Engineering', deadline: '2026-04-12', effort: '1 day', tags: ['Bug','Mobile'], progress: 85 },
  { id: 'T-005', title: 'Set Up CI/CD Pipeline for Staging', description: 'Configure GitHub Actions for automated deployment.', status: 'Pending Approval', priority: 'Medium', assigneeName: 'Dev Patel', assigneeId: 6, createdById: 6, createdByName: 'Dev Patel', dept: 'DevOps', deadline: '2026-04-25', effort: '4 days', tags: ['DevOps'], progress: 0 },
  { id: 'T-006', title: 'User Research for New Dashboard', description: 'Conduct 10 user interviews for analytics dashboard.', status: 'Change Requested', priority: 'Low', assigneeName: 'Priya Nair', assigneeId: 3, createdById: 1, createdByName: 'Riya Sharma', dept: 'Design', deadline: '2026-04-30', effort: '6 days', tags: ['Research','UX'], progress: 30 },
];

const KANBAN_COLS = [
  { key: 'pending',    title: 'Pending Approval',            statuses: ['Pending Approval'],             borderColor: '#fbbf24' },
  { key: 'inprogress', title: 'In Progress',                 statuses: ['In Progress'],                  borderColor: 'var(--accent-indigo)' },
  { key: 'review',     title: 'In Review / Change Req.',     statuses: ['In Review','Change Requested'], borderColor: '#8b5cf6' },
  { key: 'done',       title: 'Completed',                   statuses: ['Completed'],                    borderColor: 'var(--success)' },
];

export default function TaskList({ user }) {
  const navigate = useNavigate();
  const currentUser = user || getUser();

  const [view, setView] = useState('table');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssign, setFilterAssign] = useState('All');
  const [search, setSearch] = useState('');

  const STATUSES   = ['All','Pending Approval','In Progress','In Review','Completed','Change Requested','Rejected'];
  const PRIORITIES_LIST = ['All','Critical','High','Medium','Low'];

  const filtered = MOCK_TASKS.filter(t => {
    const byStatus   = filterStatus   === 'All' || t.status   === filterStatus;
    const byPriority = filterPriority === 'All' || t.priority === filterPriority;
    const bySearch   = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const byAssign   = filterAssign === 'All'
      || (filterAssign === 'mine'    && t.assigneeId  === currentUser?.id)
      || (filterAssign === 'created' && t.createdById === currentUser?.id)
      || (filterAssign === 'pending' && t.status      === 'Pending Approval');
    return byStatus && byPriority && bySearch && byAssign;
  });

  const openDetail = id => navigate('/TaskDetail', { state: { taskId: id } });
  const hasFilters = filterStatus !== 'All' || filterPriority !== 'All' || search;

  const BtnStyle = (active) => ({
    padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: active ? 700 : 500, transition: 'all .2s',
    background: active ? 'var(--bg-white)' : 'transparent',
    color: active ? 'var(--accent-indigo)' : 'var(--text-muted)',
    boxShadow: active ? '0 1px 6px rgba(99,102,241,.12)' : 'none',
  });

  return (
    <div style={{ padding: '22px 24px', background: 'var(--bg-page)', minHeight: '100vh', animation: 'taskFadeUp .35s ease' }}>
      <style>{`
        @keyframes taskFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .tl-tr:hover td { background:#fafbff !important; cursor:pointer }
        select.tl-sel { padding:8px 12px; border:1.5px solid var(--border-medium); border-radius:10px; font-size:13px; font-family:'DM Sans',sans-serif; color:var(--text-primary); background:var(--bg-white); cursor:pointer; transition:all .2s; }
        select.tl-sel:focus { outline:none; border-color:var(--accent-indigo); box-shadow:0 0 0 3px rgba(99,102,241,.10); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 21, boxShadow: '0 4px 12px rgba(99,102,241,.25)' }}>
            <FaTasks />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Sora',sans-serif", letterSpacing: '-0.02em' }}>Task List</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 12, border: '1px solid var(--border-light)', gap: 3 }}>
            <button style={BtnStyle(view === 'table')} onClick={() => setView('table')}> <FaThList size={12} style={{ marginRight: 5 }} />Table</button>
            <button style={BtnStyle(view === 'kanban')} onClick={() => setView('kanban')}> <FaColumns size={12} style={{ marginRight: 5 }} />Kanban</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <select className="tl-sel" value={filterAssign} onChange={e => setFilterAssign(e.target.value)}>
          <option value="All">All Tasks</option>
          <option value="mine">Assigned to Me</option>
          <option value="created">Created by Me</option>
          <option value="pending">Pending Approval</option>
        </select>
        <select className="tl-sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="tl-sel" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          {PRIORITIES_LIST.map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            style={{ padding: '8px 12px 8px 34px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-primary)', background: 'var(--bg-white)', width: 220, outline: 'none' }}
          />
        </div>
        {hasFilters && (
          <button onClick={() => { setFilterStatus('All'); setFilterPriority('All'); setSearch(''); }}
            style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <FaTimes size={10} /> Clear
          </button>
        )}
      </div>

      {/* TABLE VIEW */}
      {view === 'table' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 18, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <FaSearch style={{ fontSize: 36, opacity: .3, marginBottom: 14 }} />
              <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>No tasks found</h4>
              <p style={{ fontSize: 13 }}>Try adjusting your filters or create a new task.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1.5px solid var(--accent-indigo-pale)' }}>
                    {['ID','Title','Assignee','Priority','Status','Deadline','Progress','Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="tl-tr" onClick={() => openDetail(t.id)}>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#ede9fe', padding: '2px 8px', borderRadius: 6, fontWeight: 600, color: 'var(--accent-indigo)' }}>{t.id}</span>
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.dept} · {t.effort}</div>
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
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={e => { e.stopPropagation(); openDetail(t.id); }} style={{ width: 32, height: 32, background: '#ede9fe', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
                            <FaEye size={13} />
                          </button>
                          <button onClick={e => e.stopPropagation()} style={{ width: 32, height: 32, background: '#fef3c7', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                            <FaEdit size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'start' }}>
          {KANBAN_COLS.map(col => {
            const colTasks = MOCK_TASKS.filter(t => col.statuses.includes(t.status));
            return (
              <div key={col.key} style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: 14, border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${col.borderColor}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{col.title}</span>
                  <span style={{ background: 'var(--bg-white)', border: '1px solid var(--border-medium)', width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {colTasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '18px 0' }}>No tasks</div>}
                  {colTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => openDetail(t.id)}
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '14px 14px 14px 18px', cursor: 'pointer', transition: 'all .25s', position: 'relative', borderLeft: `4px solid ${PRIORITY_BAR_COLOR[t.priority] || '#ccc'}` }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(99,102,241,.10)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent-indigo)', fontWeight: 600 }}>{t.id}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>{t.title}</div>
                      {t.progress > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ background: '#e8eaf6', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.progress}%`, background: 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 6 }} />
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{t.progress}% complete</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>👤 {t.assigneeName}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 {t.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}