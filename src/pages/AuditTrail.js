
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaSearch, FaBuilding, FaCalendarAlt, 
  FaEye, FaDownload, FaFilter, FaTimes,
  FaCheckCircle, FaUpload,
  FaClock, FaUserCheck, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaGraduationCap,
  FaArrowLeft, FaHistory, FaInfoCircle,
  FaChevronLeft, FaChevronRight, FaUser, FaIdCard,
  FaEnvelope, FaPhone, FaUserPlus, FaArrowUp, FaGavel,
  FaPlane, FaCheck, FaShieldAlt, FaUserShield,
  FaDatabase, FaServer, FaLaptop, FaGlobe, FaArrowRight
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from "../components/LoadingSpinner";

const AuditTrail = ({ user, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const [filters, setFilters] = useState({
    employeeName: '', employeeCode: '', module: 'all',
    action: 'all', user: '', dateFrom: '', dateTo: ''
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(8);

  const DUMMY_AUDIT_LOGS = [
    { id: 1, dateTime: '2024-04-01 10:15:22', user: 'Rajesh Kumar (HR Admin)', module: 'Promotion', action: 'Update', fieldChanged: 'Designation', oldValue: 'Manager', newValue: 'Senior Manager', ipAddress: '192.168.1.10', employeeName: 'Ashish Sinha', employeeCode: 'EMP006', details: 'Designation updated during promotion process', status: 'Approved' },
    { id: 2, dateTime: '2024-04-02 09:00:15', user: 'Amit Sharma (HR Manager)', module: 'Promotion', action: 'Approve', fieldChanged: 'Status', oldValue: 'Pending', newValue: 'Approved', ipAddress: '192.168.1.20', employeeName: 'Ashish Sinha', employeeCode: 'EMP006', details: 'Promotion request approved', status: 'Approved' },
    { id: 3, dateTime: '2024-04-02 09:15:30', user: 'Rajesh Kumar (HR Admin)', module: 'Documents', action: 'Upload', fieldChanged: 'Promotion Letter', oldValue: '--', newValue: 'Uploaded', ipAddress: '192.168.1.10', employeeName: 'Ashish Sinha', employeeCode: 'EMP006', details: 'Promotion letter uploaded', status: 'Approved' },
    { id: 4, dateTime: '2024-04-05 11:30:00', user: 'Vikram Mehta (Auditor)', module: 'Service Book', action: 'View', fieldChanged: '--', oldValue: '--', newValue: '--', ipAddress: '192.168.1.30', employeeName: 'Priya Sharma', employeeCode: 'EMP007', details: 'Service book viewed for audit', status: 'Approved' },
    { id: 5, dateTime: '2024-04-10 14:20:00', user: 'Neha Gupta (HR Admin)', module: 'Appointment', action: 'Create', fieldChanged: 'Appointment Order', oldValue: '--', newValue: 'Created', ipAddress: '192.168.1.15', employeeName: 'John Doe', employeeCode: 'EMP001', details: 'New employee appointment created', status: 'Approved' },
    { id: 6, dateTime: '2024-04-12 16:45:00', user: 'Suresh Patel (HR Officer)', module: 'Documents', action: 'Download', fieldChanged: 'Service Book PDF', oldValue: '--', newValue: 'Downloaded', ipAddress: '192.168.1.25', employeeName: 'Jane Smith', employeeCode: 'EMP002', details: 'Service book PDF downloaded', status: 'Approved' },
    { id: 7, dateTime: '2024-04-15 08:30:00', user: 'Rajesh Kumar (HR Admin)', module: 'Transfer', action: 'Update', fieldChanged: 'Location', oldValue: 'Mumbai', newValue: 'Noida', ipAddress: '192.168.1.10', employeeName: 'Ashish Sinha', employeeCode: 'EMP006', details: 'Employee transfer location updated', status: 'Approved' },
    { id: 8, dateTime: '2024-04-18 10:00:00', user: 'Amit Sharma (HR Manager)', module: 'Transfer', action: 'Approve', fieldChanged: 'Status', oldValue: 'Pending', newValue: 'Approved', ipAddress: '192.168.1.20', employeeName: 'Ashish Sinha', employeeCode: 'EMP006', details: 'Transfer request approved', status: 'Approved' },
    { id: 9, dateTime: '2024-04-20 15:30:00', user: 'Priya Kapoor (Payroll)', module: 'Pay Revision', action: 'Update', fieldChanged: 'Salary', oldValue: '50,000', newValue: '57,500', ipAddress: '192.168.1.35', employeeName: 'Vikram Singh', employeeCode: 'EMP010', details: 'Salary updated with 15% increment', status: 'Rejected' },
    { id: 10, dateTime: '2024-04-22 11:15:00', user: 'Neha Gupta (HR Admin)', module: 'Training', action: 'Create', fieldChanged: 'Training Record', oldValue: '--', newValue: 'Created', ipAddress: '192.168.1.15', employeeName: 'Sneha Patel', employeeCode: 'EMP009', details: 'Training record created', status: 'Approved' },
    { id: 11, dateTime: '2024-04-25 09:45:00', user: 'Amit Sharma (HR Manager)', module: 'Award', action: 'Approve', fieldChanged: 'Status', oldValue: 'Nominated', newValue: 'Approved', ipAddress: '192.168.1.20', employeeName: 'Jane Smith', employeeCode: 'EMP002', details: 'Best HR Manager award approved', status: 'Approved' },
    { id: 12, dateTime: '2024-04-28 14:00:00', user: 'Vikram Mehta (Auditor)', module: 'Disciplinary', action: 'View', fieldChanged: '--', oldValue: '--', newValue: '--', ipAddress: '192.168.1.30', employeeName: 'David Brown', employeeCode: 'EMP005', details: 'Disciplinary record viewed for compliance', status: 'Approved' },
    { id: 13, dateTime: '2024-05-02 10:30:00', user: 'Rajesh Kumar (HR Admin)', module: 'Confirmation', action: 'Update', fieldChanged: 'Probation Status', oldValue: 'Pending', newValue: 'Confirmed', ipAddress: '192.168.1.10', employeeName: 'Arjun Nair', employeeCode: 'EMP012', details: 'Probation confirmation updated', status: 'Approved' },
    { id: 14, dateTime: '2024-05-05 16:00:00', user: 'Suresh Patel (HR Officer)', module: 'Documents', action: 'Upload', fieldChanged: 'Appointment Letter', oldValue: '--', newValue: 'Uploaded', ipAddress: '192.168.1.25', employeeName: 'John Doe', employeeCode: 'EMP001', details: 'Appointment letter uploaded', status: 'Approved' },
    { id: 15, dateTime: '2024-05-10 12:00:00', user: 'Neha Gupta (HR Admin)', module: 'Deputation', action: 'Create', fieldChanged: 'Deputation Order', oldValue: '--', newValue: 'Created', ipAddress: '192.168.1.15', employeeName: 'Ananya Reddy', employeeCode: 'EMP011', details: 'Deputation to London office created', status: 'Pending' },
    { id: 16, dateTime: '2024-05-15 09:00:00', user: 'Vikram Mehta (Auditor)', module: 'Service Book', action: 'Download', fieldChanged: 'Audit Report', oldValue: '--', newValue: 'Exported', ipAddress: '192.168.1.30', employeeName: 'Mike Johnson', employeeCode: 'EMP003', details: 'Audit report exported for review', status: 'Approved' }
  ];

  const modules = [
    { value: 'all', label: 'All Modules' },
    { value: 'Appointment', label: 'Appointment' }, { value: 'Confirmation', label: 'Confirmation' },
    { value: 'Promotion', label: 'Promotion' }, { value: 'Transfer', label: 'Transfer' },
    { value: 'Deputation', label: 'Deputation' }, { value: 'Training', label: 'Training' },
    { value: 'Award', label: 'Award' }, { value: 'Pay Revision', label: 'Pay Revision' },
    { value: 'Disciplinary', label: 'Disciplinary' }, { value: 'Documents', label: 'Documents' },
    { value: 'Service Book', label: 'Service Book' }
  ];

  const actions = [
    { value: 'all', label: 'All Actions' },
    { value: 'Create', label: 'Created', color: '#059669', bg: '#d1fae5', icon: <FaUserPlus size={11} /> },
    { value: 'Update', label: 'Updated', color: '#d97706', bg: '#fef3c7', icon: <FaExchangeAlt size={11} /> },
    { value: 'Approve', label: 'Approved', color: '#2563eb', bg: '#dbeafe', icon: <FaCheckCircle size={11} /> },
    { value: 'Reject', label: 'Rejected', color: '#dc2626', bg: '#fee2e2', icon: <FaTimes size={11} /> },
    { value: 'Upload', label: 'Uploaded', color: '#7c3aed', bg: '#ede9fe', icon: <FaUpload size={11} /> },
    { value: 'Download', label: 'Downloaded', color: '#db2777', bg: '#fce7f3', icon: <FaDownload size={11} /> },
    { value: 'View', label: 'Viewed', color: '#0891b2', bg: '#cffafe', icon: <FaEye size={11} /> }
  ];

  const primaryColor = '#6366f1';
  const primaryLight = '#818cf8';
  const primaryBg = '#eef2ff';
  const primaryShadow = 'rgba(99,102,241,0.2)';
  const darkColor = '#1e293b';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { await new Promise(r => setTimeout(r, 600)); setAuditLogs(DUMMY_AUDIT_LOGS); setFilteredLogs(DUMMY_AUDIT_LOGS); }
    catch (e) { toast.error('Error', 'Failed to load audit trail'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let f = [...auditLogs];
    if (searchTerm.trim()) { const s = searchTerm.toLowerCase(); f = f.filter(l => l.employeeName.toLowerCase().includes(s) || l.employeeCode.toLowerCase().includes(s) || l.user.toLowerCase().includes(s) || l.module.toLowerCase().includes(s) || l.action.toLowerCase().includes(s)); }
    if (filters.employeeName.trim()) f = f.filter(l => l.employeeName.toLowerCase().includes(filters.employeeName.toLowerCase()));
    if (filters.employeeCode.trim()) f = f.filter(l => l.employeeCode.toLowerCase().includes(filters.employeeCode.toLowerCase()));
    if (filters.module !== 'all') f = f.filter(l => l.module === filters.module);
    if (filters.action !== 'all') f = f.filter(l => l.action === filters.action);
    if (filters.user.trim()) f = f.filter(l => l.user.toLowerCase().includes(filters.user.toLowerCase()));
    if (filters.dateFrom) f = f.filter(l => l.dateTime.split(' ')[0] >= filters.dateFrom);
    if (filters.dateTo) f = f.filter(l => l.dateTime.split(' ')[0] <= filters.dateTo);
    if (activeTab === 'approved') f = f.filter(l => l.status === 'Approved');
    if (activeTab === 'rejected') f = f.filter(l => l.status === 'Rejected');
    if (activeTab === 'pending') f = f.filter(l => l.status === 'Pending');
    f.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    setFilteredLogs(f); setPage(0);
  }, [searchTerm, filters, auditLogs, activeTab]);

  const handleFilterChange = (f, v) => setFilters(p => ({ ...p, [f]: v }));
  const handleClearFilters = () => { setFilters({ employeeName: '', employeeCode: '', module: 'all', action: 'all', user: '', dateFrom: '', dateTo: '' }); setSearchTerm(''); };
  const handleViewDetails = (l) => { setSelectedAuditLog(l); setShowDetails(true); };
  const handleBackToList = () => { setShowDetails(false); setSelectedAuditLog(null); };
  const handleExport = () => toast.success('Export', 'Audit trail exported successfully');
  const handleCancel = () => { if (onCancel) onCancel(); };

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => { const d = 2, r = [], l = Math.max(0, page - d), rt = Math.min(totalPages - 1, page + d); if (l > 0) { r.push(0); if (l > 1) r.push('...'); } for (let i = l; i <= rt; i++) r.push(i); if (rt < totalPages - 1) { if (rt < totalPages - 2) r.push('...'); r.push(totalPages - 1); } return r; };

  const formatDateTime = (s) => { const [d, t] = s.split(' '); return { date: new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }), time: t }; };

  const getActionBadge = (a) => { const f = actions.find(x => x.value === a) || actions[0]; return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '14px', background: f.bg, color: f.color, fontSize: '12px', fontWeight: '600' }}>{f.icon}{f.label}</span>); };
  
  const getStatusBadge = (status) => {
    const s = { Approved: { bg: '#d1fae5', color: '#065f46', icon: <FaCheck size={10} />, label: 'Approved' }, Rejected: { bg: '#fee2e2', color: '#dc2626', icon: <FaTimes size={10} />, label: 'Rejected' }, Pending: { bg: '#fef3c7', color: '#92400e', icon: <FaClock size={10} />, label: 'Pending' } };
    const st = s[status] || s.Approved;
    return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '14px', background: st.bg, color: st.color, fontSize: '11px', fontWeight: '600' }}>{st.icon}{st.label}</span>);
  };

  const totalRecords = auditLogs.length;
  const approvedRecords = auditLogs.filter(l => l.status === 'Approved').length;
  const rejectedRecords = auditLogs.filter(l => l.status === 'Rejected').length;
  const pendingRecords = auditLogs.filter(l => l.status === 'Pending').length;

  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
    headerCard: { background: 'white', borderRadius: '16px', padding: '22px 28px', marginBottom: '22px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    headerTitle: { fontSize: '24px', fontWeight: '700', color: darkColor, margin: 0, letterSpacing: '-0.02em' },
    headerSubtitle: { fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' },
    iconContainer: { width: '48px', height: '48px', background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryLight} 100%)`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', boxShadow: `0 4px 12px ${primaryShadow}` },
    statCard: { background: 'white', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', transition: 'all 0.25s ease', cursor: 'default' },
    statIcon: (c) => ({ width: '40px', height: '40px', borderRadius: '12px', background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c, fontSize: '18px' }),
    statValue: { fontSize: '26px', fontWeight: '700', color: '#0f172a', lineHeight: '1', marginBottom: '2px' },
    statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
    filterCard: { background: 'white', borderRadius: '14px', padding: '18px 22px', marginBottom: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    tableCard: { background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    tableHeader: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    tableHeaderCell: { padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tableRow: { transition: 'all 0.2s ease', cursor: 'pointer' },
    tableCell: { padding: '13px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' },
    secondaryBtn: { padding: '8px 18px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s ease' },
    primaryBtn: { padding: '8px 20px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryLight} 100%)`, color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.3s ease', boxShadow: `0 2px 8px ${primaryShadow}` },
    tabBtn: (active) => ({ padding: '7px 16px', borderRadius: '10px', border: active ? 'none' : '1.5px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: active ? '600' : '500', background: active ? primaryColor : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', gap: '6px' }),
  };

  if (loading) return <LoadingSpinner message="Loading Audit Trail..." />;

  return (
    <div style={styles.container}>
      <style>{`
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 8px 24px ${primaryShadow} !important; border-color: ${primaryColor}30 !important; }
        input:focus, select:focus { border-color: ${primaryColor} !important; box-shadow: 0 0 0 3px ${primaryColor}15 !important; background: white !important; outline: none !important; }
        .audit-row:hover { background: ${primaryBg} !important; }
      `}</style>

      {/* HEADER */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={styles.iconContainer}><FaShieldAlt /></div>
            <div>
              <h1 style={styles.headerTitle}>{showDetails ? 'Audit Log Details' : 'Activity History & Audit Trail'}</h1>
              <p style={styles.headerSubtitle}>{showDetails ? `Viewing details for log entry #${selectedAuditLog?.id}` : `Showing ${totalItems} activity records - Track who did what and when`}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showDetails ? (
              <button onClick={handleBackToList} style={styles.secondaryBtn} onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.color = primaryColor; e.currentTarget.style.background = primaryBg; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'white'; }}><FaArrowLeft size={12} /> Back to Activity List</button>
            ) : (
              <>
                <button style={styles.secondaryBtn} onClick={handleExport}><FaDownload size={12} /> Download Report</button>
                <button style={styles.primaryBtn} onClick={handleCancel}><FaTimes size={12} /> Close</button>
              </>
            )}
          </div>
        </div>
      </div>

 {/* SEARCH AND FILTER SECTION */}
          <div style={styles.filterCard}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>Search and Filter Records</div>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <FaSearch size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 2 }} />
              <input type="text" placeholder="Type to search by employee name, user, module..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '11px 44px 11px 42px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#f8fafc', transition: 'all 0.3s ease', fontFamily: "'Inter', sans-serif" }} />
              {searchTerm && <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px', borderRadius: '50%', zIndex: 2 }}><FaTimes size={12} /></button>}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="text" placeholder="Employee Name" value={filters.employeeName} onChange={(e) => handleFilterChange('employeeName', e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', width: '140px', background: '#f8fafc' }} />
                <input type="text" placeholder="Employee Code" value={filters.employeeCode} onChange={(e) => handleFilterChange('employeeCode', e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', width: '120px', background: '#f8fafc' }} />
                <select value={filters.module} onChange={(e) => handleFilterChange('module', e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontFamily: "'Inter', sans-serif", color: '#334155', background: '#f8fafc', cursor: 'pointer', outline: 'none' }}>
                  <option value="all">Module: All</option>
                  {modules.filter(m => m.value !== 'all').map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontFamily: "'Inter', sans-serif", color: '#334155', background: '#f8fafc', cursor: 'pointer', outline: 'none' }}>
                  <option value="all">Action: All</option>
                  {actions.filter(a => a.value !== 'all').map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <input type="text" placeholder="Performed By (User)" value={filters.user} onChange={(e) => handleFilterChange('user', e.target.value)} style={{ padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', width: '150px', background: '#f8fafc' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1.5px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>From:</span>
                  <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} style={{ padding: '4px', border: 'none', fontSize: '12px', outline: 'none', background: 'transparent' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1.5px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>To:</span>
                  <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} style={{ padding: '4px', border: 'none', fontSize: '12px', outline: 'none', background: 'transparent' }} />
                </div>
              </div>
              <button onClick={handleClearFilters} style={{ ...styles.secondaryBtn, color: '#dc2626', padding: '7px 14px', borderColor: '#fecaca', fontSize: '12px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}><FaTimes size={10} /> Clear All Filters</button>
            </div>
          </div>
      {!showDetails ? (
        <>
          {/* QUICK SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {[
              { icon: <FaDatabase size={18} />, color: primaryColor, val: totalRecords, label: 'Total Activities', hint: 'All recorded actions' },
              { icon: <FaCheckCircle size={18} />, color: '#059669', val: approvedRecords, label: 'Successful', hint: 'Approved actions' },
              { icon: <FaTimes size={18} />, color: '#dc2626', val: rejectedRecords, label: 'Rejected', hint: 'Declined actions' },
              { icon: <FaClock size={18} />, color: '#d97706', val: pendingRecords, label: 'In Progress', hint: 'Awaiting decision' }
            ].map((s, i) => (
              <div key={i} className="hover-lift" style={styles.statCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.statIcon(s.color)}>{s.icon}</div>
                  <div>
                    <div style={styles.statValue}>{s.val}</div>
                    <div style={styles.statLabel}>{s.label}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{s.hint}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* STATUS FILTER TABS */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { value: 'all', label: 'All Activities', icon: <FaDatabase size={10} />, count: totalRecords },
              { value: 'approved', label: 'Successful', icon: <FaCheckCircle size={10} />, count: approvedRecords },
              { value: 'rejected', label: 'Rejected', icon: <FaTimes size={10} />, count: rejectedRecords },
              { value: 'pending', label: 'In Progress', icon: <FaClock size={10} />, count: pendingRecords }
            ].map(tab => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={styles.tabBtn(activeTab === tab.value)}>
                {tab.icon} {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* ACTIVITY LOG TABLE */}
          <div style={styles.tableCard}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Activity Log</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Click on any row to view complete details</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1150 }}>
                <thead><tr style={styles.tableHeader}>
                  <th style={styles.tableHeaderCell}>When</th>
                  <th style={styles.tableHeaderCell}>Who Did It</th>
                  <th style={styles.tableHeaderCell}>Employee</th>
                  <th style={styles.tableHeaderCell}>Where (Module)</th>
                  <th style={styles.tableHeaderCell}>What Happened</th>
                  <th style={styles.tableHeaderCell}>Result</th>
                  <th style={styles.tableHeaderCell}>What Changed</th>
                  <th style={styles.tableHeaderCell}>IP Address</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: 'center', width: '60px' }}>Details</th>
                </tr></thead>
                <tbody>
                  {currentLogs.length > 0 ? currentLogs.map((log) => { const { date, time } = formatDateTime(log.dateTime); return (
                    <tr key={log.id} className="audit-row" style={styles.tableRow} onClick={() => handleViewDetails(log)} onMouseEnter={(e) => { e.currentTarget.style.background = primaryBg; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
                      <td style={{ ...styles.tableCell, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{date}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{time}</div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: `linear-gradient(135deg, ${primaryColor}, ${primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>
                            {log.user.split(' ')[0][0]}{log.user.split(' ')[1]?.[0] || ''}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '12px' }}>{log.user.split('(')[0].trim()}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{log.user.split('(')[1]?.replace(')', '')}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{log.employeeName}</span>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{log.employeeCode}</div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '10px', background: primaryBg, color: primaryColor, fontSize: '11px', fontWeight: '600' }}>{log.module}</span>
                      </td>
                      <td style={styles.tableCell}>{getActionBadge(log.action)}</td>
                      <td style={styles.tableCell}>{getStatusBadge(log.status)}</td>
                      <td style={{ ...styles.tableCell, fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ background: '#fef2f2', padding: '2px 7px', borderRadius: '4px', color: '#dc2626', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`Old: ${log.oldValue}`}>{log.oldValue}</span>
                          <FaArrowRight size={8} style={{ color: primaryColor, flexShrink: 0 }} />
                          <span style={{ background: '#ecfdf5', padding: '2px 7px', borderRadius: '4px', color: '#059669', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`New: ${log.newValue}`}>{log.newValue}</span>
                        </div>
                      </td>
                      <td style={{ ...styles.tableCell, fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                        <code style={{ background: primaryBg, padding: '2px 8px', borderRadius: '6px', color: primaryColor, fontWeight: '500' }}>{log.ipAddress}</code>
                      </td>
                      <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleViewDetails(log); }} 
                          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: primaryColor, transition: 'all 0.25s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = primaryColor; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.transform = 'scale(1.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = primaryColor; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; }}
                          title="View complete details">
                          <FaEye size={12} />
                        </button>
                      </td>
                    </tr>
                  );}) : (
                    <tr><td colSpan={9} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><FaSearch size={28} style={{ color: primaryColor }} /></div>
                      <h3 style={{ color: '#0f172a', margin: 0, fontSize: '16px', fontWeight: '600' }}>No activity records found</h3>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Try changing your search or filter settings</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px', background: '#fafafa' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Page {page + 1} of {totalPages} - Showing records {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)}</span>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <button disabled={page === 0} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: primaryColor, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}><FaChevronLeft size={9} /> Previous</button>
                  {getPaginationRange().map((pg, i) => pg === '...' ? <span key={`d-${i}`} style={{ padding: '6px 4px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>...</span> : <button key={pg} onClick={() => setPage(pg)} style={{ padding: '6px 12px', borderRadius: '8px', border: pg === page ? 'none' : '1.5px solid #e2e8f0', background: pg === page ? primaryColor : 'white', color: pg === page ? 'white' : '#475569', cursor: 'pointer', fontSize: '12px', fontWeight: pg === page ? '600' : '500', minWidth: '34px', transition: 'all 0.2s ease' }}>{pg + 1}</button>)}
                  <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: primaryColor, cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer', opacity: page + 1 >= totalPages ? 0.4 : 1, fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>Next <FaChevronRight size={9} /></button>
                </div>
              </div>
            )}
          </div>

          {/* LEGEND */}
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
            <span style={{ fontWeight: '600', color: '#0f172a' }}>Legend:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }}></span> Successful</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }}></span> Rejected</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706' }}></span> In Progress</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}><FaInfoCircle size={12} color={primaryColor} /> Click any row to see complete details</span>
          </div>
        </>
      ) : (
        /* DETAIL VIEW */
        selectedAuditLog && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '22px', padding: '16px 20px', background: primaryBg, borderRadius: '14px', border: `1.5px solid ${primaryColor}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', boxShadow: `0 4px 12px ${primaryShadow}` }}><FaHistory /></div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Activity Record #{selectedAuditLog.id}</h3>
                    {getStatusBadge(selectedAuditLog.status)}
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{selectedAuditLog.details}</p>
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '14px' }}>Complete Activity Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                ['Date & Time', `${formatDateTime(selectedAuditLog.dateTime).date} at ${formatDateTime(selectedAuditLog.dateTime).time}`, 'mono'],
                ['Performed By', selectedAuditLog.user],
                ['Employee Affected', `${selectedAuditLog.employeeName} (${selectedAuditLog.employeeCode})`],
                ['Module / Section', selectedAuditLog.module, 'badge'],
                ['Type of Action', selectedAuditLog.action, 'action'],
                ['Field That Changed', selectedAuditLog.fieldChanged],
                ['Previous Value', selectedAuditLog.oldValue, 'old'],
                ['New Value', selectedAuditLog.newValue, 'new'],
                ['Computer IP Address', selectedAuditLog.ipAddress, 'mono']
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{item[0]}</div>
                  {item[2] === 'badge' ? <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '10px', background: primaryBg, color: primaryColor, fontSize: '12px', fontWeight: '600' }}>{item[1]}</span> :
                   item[2] === 'action' ? getActionBadge(item[1]) :
                   item[2] === 'old' ? <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', background: '#fef2f2', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', fontFamily: "'JetBrains Mono', monospace" }}>{item[1]}</div> :
                   item[2] === 'new' ? <div style={{ fontSize: '13px', color: '#059669', fontWeight: '600', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', fontFamily: "'JetBrains Mono', monospace" }}>{item[1]}</div> :
                   <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', fontFamily: item[2] === 'mono' ? "'JetBrains Mono', monospace" : 'inherit' }}>{item[1]}</div>}
                </div>
              ))}
            </div>
            
            <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '12px 16px', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaInfoCircle size={14} color="#d97706" /></div>
              <div>
                <div style={{ fontWeight: '600', color: '#92400e', fontSize: '12px', marginBottom: '1px' }}>This is a Read-Only Record</div>
                <span style={{ fontSize: '11px', color: '#a16207' }}>Activity records are automatically created by the system and cannot be modified or removed.</span>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default AuditTrail;