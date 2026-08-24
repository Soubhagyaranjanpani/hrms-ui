import React, { useState } from 'react';
import {
  FaServer, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaClock, FaSync, FaWifi, FaCircle, FaBuilding, FaSearch,
  FaFilter, FaArrowLeft, FaChevronLeft, FaChevronRight,
  FaDatabase, FaHistory, FaBell, FaChartLine, FaEye
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import 'bootstrap/dist/css/bootstrap.min.css';

const DeviceHealthDashboard = ({ onCancel }) => {
  // ─── Dummy Data ──────────────────────────────────────────
  const [devices, setDevices] = useState([
    { id: 1, deviceCode: 'BIO-001', deviceName: 'Main Gate Scanner', branch: 'Noida', status: 'Online', lastSync: '10:32 AM', lastHeartbeat: '10:32 AM', syncStatus: 'Success', vendor: 'ZKTeco', ip: '192.168.1.101' },
    { id: 2, deviceCode: 'BIO-002', deviceName: 'Office Entry Device', branch: 'Delhi', status: 'Offline', lastSync: '08:15 AM', lastHeartbeat: '08:15 AM', syncStatus: 'Failed', vendor: 'eSSL', ip: '192.168.1.102' },
    { id: 3, deviceCode: 'BIO-003', deviceName: 'Back Door Scanner', branch: 'Gurgaon', status: 'Online', lastSync: '10:45 AM', lastHeartbeat: '10:45 AM', syncStatus: 'Success', vendor: 'Matrix', ip: '192.168.1.103' },
    { id: 4, deviceCode: 'BIO-004', deviceName: 'HR Department Device', branch: 'Mumbai', status: 'Online', lastSync: '10:30 AM', lastHeartbeat: '10:30 AM', syncStatus: 'Success', vendor: 'Suprema', ip: '192.168.1.104' },
    { id: 5, deviceCode: 'BIO-005', deviceName: 'Finance Entry Scanner', branch: 'Bangalore', status: 'Offline', lastSync: 'Yesterday', lastHeartbeat: '06:00 PM', syncStatus: 'Failed', vendor: 'Hikvision', ip: '192.168.1.105' },
    { id: 6, deviceCode: 'BIO-006', deviceName: 'IT Lab Device', branch: 'Pune', status: 'Online', lastSync: '10:40 AM', lastHeartbeat: '10:40 AM', syncStatus: 'Success', vendor: 'Realtime', ip: '192.168.1.106' },
    { id: 7, deviceCode: 'BIO-007', deviceName: 'Backup Gate Scanner', branch: 'Noida', status: 'Online', lastSync: '10:20 AM', lastHeartbeat: '10:20 AM', syncStatus: 'Pending', vendor: 'ZKTeco', ip: '192.168.1.107' },
    { id: 8, deviceCode: 'BIO-008', deviceName: 'Visitor Entry Device', branch: 'Delhi', status: 'Offline', lastSync: '09:00 AM', lastHeartbeat: '09:00 AM', syncStatus: 'Failed', vendor: 'eSSL', ip: '192.168.1.108' }
  ]);

  // ─── Stats ──────────────────────────────────────────────
  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'Online').length,
    offline: devices.filter(d => d.status === 'Offline').length,
    syncSuccess: devices.filter(d => d.syncStatus === 'Success').length,
    syncFailed: devices.filter(d => d.syncStatus === 'Failed').length,
    syncPending: devices.filter(d => d.syncStatus === 'Pending').length
  };

  // ─── States ──────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const branches = ['all', ...new Set(devices.map(d => d.branch))];
  const statuses = ['all', 'Online', 'Offline'];

  // ─── Filter Logic ────────────────────────────────────────
  const filteredDevices = devices.filter(device => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = device.deviceCode.toLowerCase().includes(search) ||
                          device.deviceName.toLowerCase().includes(search) ||
                          device.branch.toLowerCase().includes(search) ||
                          device.vendor.toLowerCase().includes(search);
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    const matchesBranch = filterBranch === 'all' || device.branch === filterBranch;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const totalItems = filteredDevices.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentDevices = filteredDevices.slice(startIndex, startIndex + rowsPerPage);

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

  const getStatusBadge = (status) => {
    const styles = {
      Online: { bg: '#d1fae5', color: '#065f46', icon: <FaCircle size={8} style={{ color: '#10b981' }} className="me-1" /> },
      Offline: { bg: '#fee2e2', color: '#991b1b', icon: <FaCircle size={8} style={{ color: '#ef4444' }} className="me-1" /> }
    };
    const style = styles[status] || styles.Offline;
    return <span className="badge rounded-pill fw-semibold px-3 py-2 d-inline-flex align-items-center" style={{ background: style.bg, color: style.color, fontSize: '12px' }}>{style.icon} {status}</span>;
  };

  const getSyncBadge = (status) => {
    const styles = {
      Success: { bg: '#d1fae5', color: '#065f46', icon: <FaCheckCircle size={12} className="me-1" /> },
      Failed: { bg: '#fee2e2', color: '#991b1b', icon: <FaTimesCircle size={12} className="me-1" /> },
      Pending: { bg: '#fef3c7', color: '#92400e', icon: <FaClock size={12} className="me-1" /> }
    };
    const style = styles[status] || styles.Pending;
    return <span className="badge rounded-pill fw-semibold px-3 py-2 d-inline-flex align-items-center" style={{ background: style.bg, color: style.color, fontSize: '12px' }}>{style.icon} {status}</span>;
  };

  // ─── Styles (like Attendance Exception) ──────────────────
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
    btnInfo: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', transition: 'all 0.2s ease' },
    chip: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    searchBox: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchInput: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', flex: '1', minWidth: '200px', transition: 'all 0.3s ease' },
    filterSelect: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer', transition: 'all 0.3s ease' },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .exp-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .exp-input.error {
          border-color: #ef4444 !important;
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
        .no-print { display: inline-block; }
        @media print { .no-print { display: none !important; } }
        .card-hover:hover { background: #f8fafc; transition: all 0.2s ease; }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaServer size={20} /></div>
          <div>
            <h1 style={styles.title}>Device Health Dashboard</h1>
            <p style={styles.subtitle}>{devices.length} devices monitored • {stats.online} Online • {stats.offline} Offline</p>
          </div>
        </div>
        {onCancel && (
          <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" onClick={onCancel}>
            <FaArrowLeft size={13} /> Back
          </button>
        )}
      </div>

      {/* ─── STATS CARDS ────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="stat-card d-flex justify-content-between align-items-center">
            <div>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Devices</div>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: '#eef2ff', color: '#9d174d', fontSize: '20px' }}>
              <FaServer />
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card d-flex justify-content-between align-items-center" style={{ borderLeftColor: '#10b981' }}>
            <div>
              <div className="stat-number" style={{ color: '#10b981' }}>{stats.online}</div>
              <div className="stat-label">Online</div>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: '#d1fae5', color: '#10b981', fontSize: '20px' }}>
              <FaWifi />
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card d-flex justify-content-between align-items-center" style={{ borderLeftColor: '#ef4444' }}>
            <div>
              <div className="stat-number" style={{ color: '#ef4444' }}>{stats.offline}</div>
              <div className="stat-label">Offline</div>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: '#fee2e2', color: '#ef4444', fontSize: '20px' }}>
              <FaTimesCircle />
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card d-flex justify-content-between align-items-center" style={{ borderLeftColor: '#f59e0b' }}>
            <div>
              <div className="stat-number" style={{ color: '#f59e0b' }}>{stats.syncFailed}</div>
              <div className="stat-label">Sync Failures</div>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: '#fef3c7', color: '#f59e0b', fontSize: '20px' }}>
              <FaExclamationTriangle />
            </div>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER ────────────────────────────────── */}
      <div style={{ ...styles.card, marginBottom: '16px' }}>
        <div style={styles.searchBox}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by device code, name, branch or vendor..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          />
          <select
            style={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          >
            <option value="all">All Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
          <select
            style={styles.filterSelect}
            value={filterBranch}
            onChange={(e) => { setFilterBranch(e.target.value); setPage(0); }}
          >
            <option value="all">All Branches</option>
            {branches.filter(b => b !== 'all').map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          <button 
            className="btn" 
            style={{ background: '#9d174d', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
            onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterBranch('all'); setPage(0); }}
          >
            <FaFilter size={12} /> Reset
          </button>
        </div>
      </div>

      {/* ─── TABLE ───────────────────────────────────────────── */}
      <div style={styles.card}>
        {devices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FaServer size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No devices found</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>No devices are currently registered</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Device</th>
                    <th style={styles.th}>Branch</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Last Heartbeat</th>
                    <th style={styles.th}>Last Sync</th>
                    <th style={styles.th}>Sync Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDevices.length > 0 ? (
                    currentDevices.map((device, idx) => (
                      <tr key={device.id} className="card-hover" style={{ transition: 'all 0.2s ease' }}>
                        <td style={styles.td}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', background: '#eef2ff', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', color: '#9d174d' }}>
                            {startIndex + idx + 1}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{device.deviceCode}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{device.deviceName}</div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.chip, background: '#dbeafe', color: '#1d4ed8' }}>
                            <FaBuilding size={10} style={{ marginRight: '4px' }} />
                            {device.branch}
                          </span>
                        </td>
                        <td style={styles.td}>{getStatusBadge(device.status)}</td>
                        <td style={styles.td}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <FaClock size={12} style={{ color: '#94a3b8' }} />
                            {device.lastHeartbeat}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <FaSync size={12} style={{ color: '#94a3b8' }} />
                            {device.lastSync}
                          </span>
                        </td>
                        <td style={styles.td}>{getSyncBadge(device.syncStatus)}</td>
                        
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                        <FaSearch size={36} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                        <p style={{ fontSize: '16px', fontWeight: '500', color: '#475569' }}>No devices found</p>
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
                  Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} devices
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

export default DeviceHealthDashboard;