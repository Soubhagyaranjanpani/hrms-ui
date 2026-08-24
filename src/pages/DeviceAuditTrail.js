import React, { useState } from 'react';
import {
  FaHistory, FaUser, FaServer, FaSearch, FaFilter,
  FaArrowLeft, FaChevronLeft, FaChevronRight, FaEye,
  FaPlus, FaEdit, FaTrash, FaSync, FaLink, FaClock,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import 'bootstrap/dist/css/bootstrap.min.css';

const DeviceAuditTrail = ({ onCancel }) => {
  // ─── Dummy Data ──────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      dateTime: '2024-01-15 10:30:00',
      user: 'Admin User',
      userRole: 'Administrator',
      device: 'BIO-001 - Main Gate Scanner',
      action: 'Create',
      actionIcon: <FaPlus size={12} />,
      fieldChanged: 'Device Registration',
      oldValue: '—',
      newValue: 'BIO-001 registered successfully',
      status: 'Success'
    },
    {
      id: 2,
      dateTime: '2024-01-15 10:45:00',
      user: 'HR Manager',
      userRole: 'HR',
      device: 'BIO-002 - Office Entry Device',
      action: 'Update',
      actionIcon: <FaEdit size={12} />,
      fieldChanged: 'Branch Mapping',
      oldValue: 'Delhi',
      newValue: 'Noida',
      status: 'Success'
    },
    {
      id: 3,
      dateTime: '2024-01-15 11:00:00',
      user: 'Admin User',
      userRole: 'Administrator',
      device: 'BIO-003 - Back Door Scanner',
      action: 'Mapping',
      actionIcon: <FaLink size={12} />,
      fieldChanged: 'Employee Mapping',
      oldValue: 'EMP001 - Rahul Sharma',
      newValue: 'EMP003 - Mike Johnson',
      status: 'Success'
    },
    {
      id: 4,
      dateTime: '2024-01-15 11:30:00',
      user: 'System',
      userRole: 'System',
      device: 'BIO-001 - Main Gate Scanner',
      action: 'Sync',
      actionIcon: <FaSync size={12} />,
      fieldChanged: 'Attendance Sync',
      oldValue: '156 records',
      newValue: '234 records',
      status: 'Success'
    },
    {
      id: 5,
      dateTime: '2024-01-15 12:00:00',
      user: 'Admin User',
      userRole: 'Administrator',
      device: 'BIO-004 - HR Department Device',
      action: 'Delete',
      actionIcon: <FaTrash size={12} />,
      fieldChanged: 'Device Deletion',
      oldValue: 'BIO-004 - HR Department Device',
      newValue: '—',
      status: 'Failed'
    },
    {
      id: 6,
      dateTime: '2024-01-15 12:30:00',
      user: 'System',
      userRole: 'System',
      device: 'BIO-005 - Finance Entry Scanner',
      action: 'Update',
      actionIcon: <FaEdit size={12} />,
      fieldChanged: 'Device Status',
      oldValue: 'Offline',
      newValue: 'Online',
      status: 'Success'
    },
    {
      id: 7,
      dateTime: '2024-01-15 13:00:00',
      user: 'HR Manager',
      userRole: 'HR',
      device: 'BIO-002 - Office Entry Device',
      action: 'Mapping',
      actionIcon: <FaLink size={12} />,
      fieldChanged: 'Employee Mapping',
      oldValue: 'EMP002 - Jane Smith',
      newValue: 'EMP005 - David Brown',
      status: 'Success'
    },
    {
      id: 8,
      dateTime: '2024-01-15 13:30:00',
      user: 'Admin User',
      userRole: 'Administrator',
      device: 'BIO-006 - IT Lab Device',
      action: 'Create',
      actionIcon: <FaPlus size={12} />,
      fieldChanged: 'Device Registration',
      oldValue: '—',
      newValue: 'BIO-006 registered successfully',
      status: 'Success'
    }
  ]);

  // ─── Stats ──────────────────────────────────────────────
  const stats = {
    total: auditLogs.length,
    success: auditLogs.filter(l => l.status === 'Success').length,
    failed: auditLogs.filter(l => l.status === 'Failed').length,
    actions: {
      create: auditLogs.filter(l => l.action === 'Create').length,
      update: auditLogs.filter(l => l.action === 'Update').length,
      delete: auditLogs.filter(l => l.action === 'Delete').length,
      mapping: auditLogs.filter(l => l.action === 'Mapping').length,
      sync: auditLogs.filter(l => l.action === 'Sync').length
    }
  };

  // ─── States ──────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const actions = ['all', 'Create', 'Update', 'Delete', 'Mapping', 'Sync'];
  const statuses = ['all', 'Success', 'Failed'];

  // ─── Filter Logic ────────────────────────────────────────
  const filteredLogs = auditLogs.filter(log => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = log.user.toLowerCase().includes(search) ||
                          log.device.toLowerCase().includes(search) ||
                          log.action.toLowerCase().includes(search) ||
                          log.fieldChanged.toLowerCase().includes(search) ||
                          log.oldValue.toLowerCase().includes(search) ||
                          log.newValue.toLowerCase().includes(search);
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  const getActionBadge = (action) => {
    const styles = {
      Create: { bg: '#d1fae5', color: '#065f46', icon: <FaPlus size={10} /> },
      Update: { bg: '#dbeafe', color: '#1d4ed8', icon: <FaEdit size={10} /> },
      Delete: { bg: '#fee2e2', color: '#991b1b', icon: <FaTrash size={10} /> },
      Mapping: { bg: '#fef3c7', color: '#92400e', icon: <FaLink size={10} /> },
      Sync: { bg: '#ede9fe', color: '#5b21b6', icon: <FaSync size={10} /> }
    };
    const style = styles[action] || styles.Create;
    return <span className="badge rounded-pill fw-semibold px-3 py-2 d-inline-flex align-items-center" style={{ background: style.bg, color: style.color, fontSize: '11px' }}>{style.icon} <span className="ms-1">{action}</span></span>;
  };

  const getStatusBadge = (status) => {
    const styles = {
      Success: { bg: '#d1fae5', color: '#065f46', icon: <FaCheckCircle size={12} className="me-1" /> },
      Failed: { bg: '#fee2e2', color: '#991b1b', icon: <FaTimesCircle size={12} className="me-1" /> }
    };
    const style = styles[status] || styles.Success;
    return <span className="badge rounded-pill fw-semibold px-3 py-2 d-inline-flex align-items-center" style={{ background: style.bg, color: style.color, fontSize: '12px' }}>{style.icon} {status}</span>;
  };

  // ─── Styles ──────────────────────────────────────────────
  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8ecf1' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    iconBox: { width: '46px', height: '46px', background: 'linear-gradient(135deg, #9d174d, #be185d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' },
    td: { padding: '10px 16px', borderBottom: '1px solid #f1f5f9' },
    chip: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    searchBox: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchInput: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', flex: '1', minWidth: '200px', transition: 'all 0.3s ease' },
    filterSelect: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer', transition: 'all 0.3s ease' },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .audit-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          border-left: 4px solid #9d174d;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #e8ecf1;
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .stat-card .stat-number { font-size: 28px; font-weight: 700; color: #1e293b; }
        .stat-card .stat-label { font-size: 13px; color: #64748b; font-weight: 500; }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .card-hover:hover { background: #f8fafc; transition: all 0.2s ease; }
        .value-changed { background: #fef3c7; padding: 2px 8px; border-radius: 4px; }
        .value-old { color: #ef4444; text-decoration: line-through; }
        .value-new { color: #10b981; font-weight: 600; }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaHistory size={20} /></div>
          <div>
            <h1 style={styles.title}>Device Audit Trail</h1>
            <p style={styles.subtitle}>{auditLogs.length} audit records • {stats.success} Success • {stats.failed} Failed</p>
          </div>
        </div>
        {onCancel && (
          <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" onClick={onCancel}>
            <FaArrowLeft size={13} /> Back
          </button>
        )}
      </div>

    

      {/* ─── SEARCH & FILTER ────────────────────────────────── */}
      <div style={{ ...styles.card, marginBottom: '16px' }}>
        <div style={styles.searchBox}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by user, device, action, field..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          />
          <select
            style={styles.filterSelect}
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
          >
            <option value="all">All Actions</option>
            {actions.filter(a => a !== 'all').map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <select
            style={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          >
            <option value="all">All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
          <button 
            className="btn" 
            style={{ background: '#9d174d', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
            onClick={() => { setSearchTerm(''); setFilterAction('all'); setFilterStatus('all'); setPage(0); }}
          >
            <FaFilter size={12} /> Reset
          </button>
        </div>
      </div>

      {/* ─── TABLE ───────────────────────────────────────────── */}
      <div style={styles.card}>
        {auditLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FaHistory size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No audit records found</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>No device audit trails available</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Device</th>
                    <th style={styles.th}>Action</th>
                    <th style={styles.th}>Field Changed</th>
                    <th style={styles.th}>Old Value</th>
                    <th style={styles.th}>New Value</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log, idx) => (
                      <tr key={log.id} className="card-hover" style={{ transition: 'all 0.2s ease' }}>
                        <td style={styles.td}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', background: '#eef2ff', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', color: '#9d174d' }}>
                            {startIndex + idx + 1}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <FaClock size={12} style={{ color: '#94a3b8' }} />
                            {log.dateTime}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div>
                            <div style={{ fontWeight: '500', color: '#1e293b' }}>{log.user}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{log.userRole}</div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontSize: '13px' }}>{log.device}</span>
                        </td>
                        <td style={styles.td}>{getActionBadge(log.action)}</td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '500', color: '#1e293b' }}>{log.fieldChanged}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#ef4444', fontSize: '13px' }}>
                            {log.oldValue === '—' ? <span style={{ color: '#94a3b8' }}>—</span> : log.oldValue}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#10b981', fontWeight: '500', fontSize: '13px' }}>
                            {log.newValue === '—' ? <span style={{ color: '#94a3b8' }}>—</span> : log.newValue}
                          </span>
                        </td>
                        <td style={styles.td}>{getStatusBadge(log.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                        <FaSearch size={36} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                        <p style={{ fontSize: '16px', fontWeight: '500', color: '#475569' }}>No audit records found</p>
                        <p style={{ fontSize: '13px' }}>Try adjusting your search or filter criteria</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── PAGINATION ────────────────────────────────── */}
            {totalItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} audit records
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: page === 0 ? 0.5 : 1 }}
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button
                        key={pg}
                        style={{ padding: '6px 10px', border: '1px solid #e5e7eb', background: pg === page ? '#9d174d' : 'white', color: pg === page ? 'white' : '#374151', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px' }}
                        onClick={() => setPage(pg)}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: page + 1 >= totalPages ? 0.5 : 1 }}
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeviceAuditTrail;