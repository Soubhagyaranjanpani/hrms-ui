import React, { useState } from 'react';
import {
  FaSync, FaServer, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaClock, FaWifi, FaCircle, FaBuilding, FaSearch,
  FaFilter, FaArrowLeft, FaChevronLeft, FaChevronRight,
  FaDatabase, FaHistory, FaBell, FaChartLine, FaEye,
  FaDownload, FaUpload
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import 'bootstrap/dist/css/bootstrap.min.css';

const SynchronizationDashboard = ({ onCancel }) => {
  // ─── Dummy Data ──────────────────────────────────────────
  const [syncData, setSyncData] = useState([
    { id: 1, deviceCode: 'BIO-001', deviceName: 'Main Gate Scanner', branch: 'Noida', lastSync: '10:30 AM', recordsReceived: 125, failedRecords: 0, status: 'Success', lastHeartbeat: '10:30 AM', vendor: 'ZKTeco' },
    { id: 2, deviceCode: 'BIO-002', deviceName: 'Office Entry Device', branch: 'Delhi', lastSync: '10:25 AM', recordsReceived: 118, failedRecords: 3, status: 'Warning', lastHeartbeat: '10:25 AM', vendor: 'eSSL' },
    { id: 3, deviceCode: 'BIO-003', deviceName: 'Back Door Scanner', branch: 'Gurgaon', lastSync: '10:45 AM', recordsReceived: 205, failedRecords: 0, status: 'Success', lastHeartbeat: '10:45 AM', vendor: 'Matrix' },
    { id: 4, deviceCode: 'BIO-004', deviceName: 'HR Department Device', branch: 'Mumbai', lastSync: '10:30 AM', recordsReceived: 89, failedRecords: 0, status: 'Success', lastHeartbeat: '10:30 AM', vendor: 'Suprema' },
    { id: 5, deviceCode: 'BIO-005', deviceName: 'Finance Entry Scanner', branch: 'Bangalore', lastSync: 'Yesterday', recordsReceived: 156, failedRecords: 12, status: 'Failed', lastHeartbeat: '06:00 PM', vendor: 'Hikvision' },
    { id: 6, deviceCode: 'BIO-006', deviceName: 'IT Lab Device', branch: 'Pune', lastSync: '10:40 AM', recordsReceived: 67, failedRecords: 0, status: 'Success', lastHeartbeat: '10:40 AM', vendor: 'Realtime' },
    { id: 7, deviceCode: 'BIO-007', deviceName: 'Backup Gate Scanner', branch: 'Noida', lastSync: '10:20 AM', recordsReceived: 42, failedRecords: 0, status: 'Success', lastHeartbeat: '10:20 AM', vendor: 'ZKTeco' },
    { id: 8, deviceCode: 'BIO-008', deviceName: 'Visitor Entry Device', branch: 'Delhi', lastSync: '09:00 AM', recordsReceived: 34, failedRecords: 2, status: 'Warning', lastHeartbeat: '09:00 AM', vendor: 'eSSL' }
  ]);

  // ─── Stats ──────────────────────────────────────────────
  const stats = {
    total: syncData.length,
    success: syncData.filter(d => d.status === 'Success').length,
    warning: syncData.filter(d => d.status === 'Warning').length,
    failed: syncData.filter(d => d.status === 'Failed').length,
    totalRecords: syncData.reduce((sum, d) => sum + d.recordsReceived, 0),
    totalFailed: syncData.reduce((sum, d) => sum + d.failedRecords, 0)
  };

  // ─── States ──────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const branches = ['all', ...new Set(syncData.map(d => d.branch))];
  const statuses = ['all', 'Success', 'Warning', 'Failed'];

  // ─── Filter Logic ────────────────────────────────────────
  const filteredData = syncData.filter(item => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = item.deviceCode.toLowerCase().includes(search) ||
                          item.deviceName.toLowerCase().includes(search) ||
                          item.branch.toLowerCase().includes(search) ||
                          item.vendor.toLowerCase().includes(search);
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesBranch = filterBranch === 'all' || item.branch === filterBranch;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

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
      Success: { bg: '#d1fae5', color: '#065f46', icon: <FaCheckCircle size={12} className="me-1" />, label: 'Success' },
      Warning: { bg: '#fef3c7', color: '#92400e', icon: <FaExclamationTriangle size={12} className="me-1" />, label: 'Warning' },
      Failed: { bg: '#fee2e2', color: '#991b1b', icon: <FaTimesCircle size={12} className="me-1" />, label: 'Failed' }
    };
    const style = styles[status] || styles.Success;
    return <span className="badge rounded-pill fw-semibold px-3 py-2 d-inline-flex align-items-center" style={{ background: style.bg, color: style.color, fontSize: '12px' }}>{style.icon} {style.label}</span>;
  };

  const getRecordsBadge = (received, failed) => {
    if (failed === 0) {
      return <span className="badge rounded-pill fw-semibold px-3 py-2" style={{ background: '#d1fae5', color: '#065f46', fontSize: '12px' }}>{received} records</span>;
    } else if (failed > 0 && failed <= 5) {
      return <span className="badge rounded-pill fw-semibold px-3 py-2" style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px' }}>{received} records <span className="ms-1" style={{ color: '#ef4444' }}>({failed} failed)</span></span>;
    } else {
      return <span className="badge rounded-pill fw-semibold px-3 py-2" style={{ background: '#fee2e2', color: '#991b1b', fontSize: '12px' }}>{received} records <span className="ms-1" style={{ color: '#ef4444' }}>({failed} failed)</span></span>;
    }
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
    btnInfo: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', transition: 'all 0.2s ease' },
    chip: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    searchBox: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchInput: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', flex: '1', minWidth: '200px', transition: 'all 0.3s ease' },
    filterSelect: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer', transition: 'all 0.3s ease' },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .sync-input:focus {
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
        .sync-icon { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaSync size={20} /></div>
          <div>
            <h1 style={styles.title}>Synchronization Dashboard</h1>
            <p style={styles.subtitle}>
              {stats.total} devices • {stats.success} Success • {stats.warning} Warning • {stats.failed} Failed
            </p>
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
              <div className="stat-number" style={{ color: '#10b981' }}>{stats.success}</div>
              <div className="stat-label">Sync Success</div>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: '#d1fae5', color: '#10b981', fontSize: '20px' }}>
              <FaCheckCircle />
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card d-flex justify-content-between align-items-center" style={{ borderLeftColor: '#f59e0b' }}>
            <div>
              <div className="stat-number" style={{ color: '#f59e0b' }}>{stats.warning}</div>
              <div className="stat-label">Warning</div>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: '#fef3c7', color: '#f59e0b', fontSize: '20px' }}>
              <FaExclamationTriangle />
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="stat-card d-flex justify-content-between align-items-center" style={{ borderLeftColor: '#ef4444' }}>
            <div>
              <div className="stat-number" style={{ color: '#ef4444' }}>{stats.failed}</div>
              <div className="stat-label">Sync Failed</div>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: '#fee2e2', color: '#ef4444', fontSize: '20px' }}>
              <FaTimesCircle />
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
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Failed">Failed</option>
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
        {syncData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FaSync size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No sync data found</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>No biometric sync records available</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Device</th>
                    <th style={styles.th}>Last Sync</th>
                    <th style={styles.th}>Records Received</th>
                    <th style={styles.th}>Failed Records</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, idx) => (
                      <tr key={item.id} className="card-hover" style={{ transition: 'all 0.2s ease' }}>
                        <td style={styles.td}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', background: '#eef2ff', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', color: '#9d174d' }}>
                            {startIndex + idx + 1}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.deviceCode}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.deviceName}</div>
                          </div>
                        </td>
                        
                        <td style={styles.td}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <FaClock size={12} style={{ color: '#94a3b8' }} />
                            {item.lastSync}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                            {item.recordsReceived}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {item.failedRecords > 0 ? (
                            <span style={{ color: item.failedRecords > 5 ? '#ef4444' : '#f59e0b', fontWeight: '600', fontSize: '14px' }}>
                              {item.failedRecords}
                            </span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: '600', fontSize: '14px' }}>0</span>
                          )}
                        </td>
                        <td style={styles.td}>{getStatusBadge(item.status)}</td>
                        
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                        <FaSearch size={36} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                        <p style={{ fontSize: '16px', fontWeight: '500', color: '#475569' }}>No sync records found</p>
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

export default SynchronizationDashboard;