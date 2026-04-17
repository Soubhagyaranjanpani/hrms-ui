import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTasks, FaSearch, FaEye, FaEdit,
  FaThList, FaColumns, FaTimes,
} from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS, getAuthHeaders } from '../config/api.config';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {}; } catch { return {}; }
};

const PRIORITY_COLORS = { Critical: '#9d174d', HIGH: '#ef4444', MEDIUM: '#d97706', LOW: '#059669' };
const PRIORITY_BG     = { Critical: '#fdf2f8', HIGH: '#fee2e2', MEDIUM: '#fef3c7', LOW: '#d1fae5' };
const PRIORITY_BAR_COLOR = PRIORITY_COLORS;

// normalise backend SNAKE_CASE status to display label
const STATUS_LABELS = {
  PENDING_APPROVAL:  'Pending Approval',
  IN_PROGRESS:       'In Progress',
  COMPLETED:         'Completed',
  IN_REVIEW:         'In Review',
  REJECTED:          'Rejected',
  CHANGE_REQUESTED:  'Change Requested',
};

const StatusBadge = ({ status }) => {
  const map = {
    PENDING_APPROVAL:  { bg: '#fef3c7', color: '#92400e' },
    IN_PROGRESS:       { bg: '#dbeafe', color: '#1e40af' },
    COMPLETED:         { bg: '#dcfce7', color: '#166534' },
    IN_REVIEW:         { bg: '#f3e8ff', color: '#5b21b6' },
    REJECTED:          { bg: '#fee2e2', color: '#991b1b' },
    CHANGE_REQUESTED:  { bg: '#fff7ed', color: '#c2410c' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  // Handle both uppercase (from API) and title case
  const p = (priority || '').toUpperCase() === 'HIGH' ? 'High' : 
            (priority || '').toUpperCase() === 'MEDIUM' ? 'Medium' :
            (priority || '').toUpperCase() === 'LOW' ? 'Low' :
            (priority || '').charAt(0).toUpperCase() + (priority || '').slice(1).toLowerCase();
  return (
    <span style={{ background: PRIORITY_BG[p] || '#f1f5f9', color: PRIORITY_COLORS[p] || '#475569', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {p}
    </span>
  );
};

const KANBAN_COLS = [
  { key: 'pending',    title: 'Pending Approval',          statuses: ['PENDING_APPROVAL'],              borderColor: '#fbbf24' },
  { key: 'inprogress', title: 'In Progress',               statuses: ['IN_PROGRESS'],                   borderColor: 'var(--accent-indigo)' },
  { key: 'review',     title: 'In Review / Change Req.',   statuses: ['IN_REVIEW', 'CHANGE_REQUESTED'], borderColor: '#8b5cf6' },
  { key: 'done',       title: 'Completed',                 statuses: ['COMPLETED'],                     borderColor: 'var(--success)' },
];

const STATUSES_FILTER = ['All', 'Pending Approval', 'In Progress', 'In Review', 'Completed', 'Change Requested', 'Rejected'];
const PRIORITIES_LIST = ['All', 'Critical', 'High', 'Medium', 'Low'];

export default function TaskList({ user }) {
  const navigate    = useNavigate();
  const currentUser = user || getUser();

  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterSource, setFilterSource] = useState('all'); // 'all' | 'mine'

  const [view,           setView]           = useState('table');
  const [filterStatus,   setFilterStatus]   = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [search,         setSearch]         = useState('');

  // Helper function to extract tasks array from API response
  const extractTasksArray = (data) => {
    if (data.response && Array.isArray(data.response)) {
      return data.response;
    } else if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.tasks && Array.isArray(data.tasks)) {
      return data.tasks;
    } else {
      console.warn('Unexpected API response structure:', data);
      return [];
    }
  };

  // Helper function to format assignee name
  const formatAssignee = (assignedTo) => {
    if (!assignedTo) return 'Unassigned';
    // Remove "null" text if present (e.g., "ANIRUDH null" -> "ANIRUDH")
    return assignedTo.replace(/\s+null\s*/g, '').trim();
  };

  // ── fetch tasks when filter source changes ──
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const url = filterSource === 'mine'
          ? API_ENDPOINTS.GET_MY_TASKS
          : API_ENDPOINTS.GET_ALL_TASKS;

        const res  = await fetch(url, { headers: getAuthHeaders() });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to load tasks');
        
        const tasksArray = extractTasksArray(data);
        setTasks(tasksArray);
      } catch (err) {
        toast.error('Load Error', err.message || 'Could not load tasks');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [filterSource]);

  // Safety check before filtering
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // ── filter on frontend ──
  const filtered = safeTasks.filter(t => {
    const displayStatus   = STATUS_LABELS[t.status] || t.status;
    const displayPriority = (t.priority || '').toUpperCase() === 'HIGH' ? 'High' : 
                           (t.priority || '').toUpperCase() === 'MEDIUM' ? 'Medium' :
                           (t.priority || '').toUpperCase() === 'LOW' ? 'Low' :
                           (t.priority || '').charAt(0).toUpperCase() + (t.priority || '').slice(1).toLowerCase();

    const byStatus   = filterStatus   === 'All' || displayStatus   === filterStatus;
    const byPriority = filterPriority === 'All' || displayPriority === filterPriority;
    const bySearch   = !search || t.title.toLowerCase().includes(search.toLowerCase());

    return byStatus && byPriority && bySearch;
  });

  const openDetail  = id => navigate('/TaskDetail', { state: { taskId: id } });
  
  // Navigate to edit task page
  const editTask = (task, e) => {
    e.stopPropagation();
    navigate('/CreateTask', { state: { taskToEdit: task, isEditing: true } });
  };
  
  const hasFilters  = filterStatus !== 'All' || filterPriority !== 'All' || search;

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
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {loading ? 'Loading…' : `${filtered.length} task${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 12, border: '1px solid var(--border-light)', gap: 3 }}>
          <button style={BtnStyle(view === 'table')}  onClick={() => setView('table')}>  <FaThList  size={12} style={{ marginRight: 5 }} />Table</button>
          <button style={BtnStyle(view === 'kanban')} onClick={() => setView('kanban')}> <FaColumns size={12} style={{ marginRight: 5 }} />Kanban</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        {/* Assign filter — triggers new API fetch */}
        <select
          className="tl-sel"
          value={filterSource}
          onChange={e => {
            setFilterSource(e.target.value);
            setFilterStatus('All');
          }}
        >
          <option value="all">All Tasks</option>
          <option value="mine">Assigned to Me</option>
        </select>

        <select className="tl-sel" value={filterStatus}   onChange={e => setFilterStatus(e.target.value)}>
          {STATUSES_FILTER.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="tl-sel" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          {PRIORITIES_LIST.map(p => <option key={p}>{p}</option>)}
        </select>

        <div style={{ position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            style={{ padding: '8px 12px 8px 34px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-primary)', background: 'var(--bg-white)', width: 220, outline: 'none' }}
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => { setFilterStatus('All'); setFilterPriority('All'); setSearch(''); }}
            style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <FaTimes size={10} /> Clear
          </button>
        )}
      </div>

      {loading && <LoadingSpinner message="Loading tasks…" />}

      {/* TABLE VIEW */}
      {!loading && view === 'table' && (
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
                        <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#ede9fe', padding: '2px 8px', borderRadius: 6, fontWeight: 600, color: 'var(--accent-indigo)' }}>
                          T-{String(t.id).padStart(3, '0')}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.department} · {t.effort}</div>
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formatAssignee(t.assignedTo)}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}><PriorityBadge priority={t.priority} /></td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9', minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: '#e8eaf6', borderRadius: 8, height: 7, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.progress || 0}%`, background: (t.progress || 0) >= 100 ? 'var(--success)' : 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 8 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 28 }}>{t.progress || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #f0f2f9' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={e => { e.stopPropagation(); openDetail(t.id); }} style={{ width: 32, height: 32, background: '#ede9fe', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-indigo)' }}>
                            <FaEye size={13} />
                          </button>
                          <button 
                            onClick={e => editTask(t, e)} 
                            style={{ width: 32, height: 32, background: '#fef3c7', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}
                          >
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
      {!loading && view === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'start' }}>
          {KANBAN_COLS.map(col => {
            const colTasks = safeTasks.filter(t => col.statuses.includes(t.status));
            const getPriorityColor = (t) => {
              const priority = (t.priority || '').toUpperCase();
              if (priority === 'HIGH') return PRIORITY_BAR_COLOR.HIGH || '#ef4444';
              if (priority === 'MEDIUM') return PRIORITY_BAR_COLOR.MEDIUM || '#d97706';
              if (priority === 'LOW') return PRIORITY_BAR_COLOR.LOW || '#059669';
              return '#ccc';
            };
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
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '14px 14px 14px 18px', cursor: 'pointer', transition: 'all .25s', position: 'relative', borderLeft: `4px solid ${getPriorityColor(t)}` }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(99,102,241,.10)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent-indigo)', fontWeight: 600 }}>T-{String(t.id).padStart(3,'0')}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>{t.title}</div>
                      {(t.progress || 0) > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ background: '#e8eaf6', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.progress}%`, background: 'linear-gradient(90deg,var(--accent-indigo),var(--accent-indigo-light))', borderRadius: 6 }} />
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{t.progress}% complete</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>👤 {formatAssignee(t.assignedTo)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '—'}</span>
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