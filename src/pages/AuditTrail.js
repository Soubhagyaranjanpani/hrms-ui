
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaSearch, FaEye, FaDownload, FaFilter, FaTimes,
  FaCheckCircle, FaClock,
  FaArrowLeft, FaHistory, FaInfoCircle,
  FaChevronLeft, FaChevronRight, FaUser, FaIdCard,
  FaUserPlus, FaCheck, FaShieldAlt, FaDatabase,
  FaArrowRight, FaUserTie, FaLaptop, FaGlobe,
  FaCalendarAlt, FaTag, FaFileAlt, FaExchangeAlt,
  FaUpload, FaTrash, FaBan
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from "../components/LoadingSpinner";

const AuditTrail = ({ user, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const [filters, setFilters] = useState({
    employeeSearch: '', 
    module: 'all',
    action: 'all', 
    user: '', 
    dateFrom: '', 
    dateTo: ''
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(8);

  // ============================================
  // DUMMY DATA 
  // ============================================
  const DUMMY_AUDIT_LOGS = [
    // ── 1. CREATE ──
    { 
      id: 1, 
      auditId: 'AUD-202400019',
      dateTime: '2024-04-10 14:20:00', 
      user: 'Neha Gupta', 
      role: 'HR Admin',
      module: 'Appointment', 
      action: 'Create', 
      description: 'New Employee Appointment Created',
      ipAddress: '192.168.1.15',
      device: 'Chrome / Windows',
      remarks: 'Appointment order created for new employee',
      employeeName: 'John Doe',
      employeeCode: 'EMP00128',
      fieldChanged: 'Appointment Order',
      oldValue: '--',
      newValue: 'Created',
      details: 'Appointment order created for new employee',
      actionDetails: {
        reason: 'New hiring',
        createdFields: ['Employee Name', 'Designation', 'Department', 'Joining Date']
      }
    },
    
    // ── 2. UPDATE: Designation Change ──
    { 
      id: 2, 
      auditId: 'AUD-202400015',
      dateTime: '2024-04-01 10:15:22', 
      user: 'Rajesh Kumar', 
      role: 'HR Admin',
      module: 'Promotion', 
      action: 'Update', 
      description: 'Designation Updated from Manager to Senior Manager',
      ipAddress: '192.168.1.10',
      device: 'Chrome / Windows',
      remarks: 'Promotion details updated successfully',
      employeeName: 'Ashish Sinha',
      employeeCode: 'EMP00125',
      fieldChanged: 'Designation',
      oldValue: 'Manager',
      newValue: 'Senior Manager',
      details: 'Designation updated during promotion process',
      actionDetails: {
        reason: 'Performance based promotion'
      }
    },
    
    // ── 3. UPDATE: Salary Change ──
    { 
      id: 3, 
      auditId: 'AUD-202400022',
      dateTime: '2024-04-20 15:30:00', 
      user: 'Priya Kapoor', 
      role: 'Auditor',
      module: 'Pay Revision', 
      action: 'Update', 
      description: 'Salary Updated with 15% Increment',
      ipAddress: '192.168.1.35',
      device: 'Chrome / Windows',
      remarks: 'Salary updated successfully',
      employeeName: 'Vikram Singh',
      employeeCode: 'EMP00130',
      fieldChanged: 'Salary',
      oldValue: '₹50,000',
      newValue: '₹57,500',
      details: 'Salary updated with 15% increment',
      actionDetails: {
        reason: 'Annual increment'
      }
    },
    
    // ── 4. UPDATE: Location Change ──
    { 
      id: 4, 
      auditId: 'AUD-202400020',
      dateTime: '2024-04-15 08:30:00', 
      user: 'Rajesh Kumar', 
      role: 'HR Admin',
      module: 'Transfer', 
      action: 'Update', 
      description: 'Employee Transfer Location Updated',
      ipAddress: '192.168.1.10',
      device: 'Chrome / Windows',
      remarks: 'Transfer location updated from Mumbai to Noida',
      employeeName: 'Ashish Sinha',
      employeeCode: 'EMP00125',
      fieldChanged: 'Location',
      oldValue: 'Mumbai',
      newValue: 'Noida',
      details: 'Employee transfer location updated',
      actionDetails: {
        reason: 'Business requirement'
      }
    },
    
    // ── 5. UPDATE: Department Change ──
    { 
      id: 5, 
      auditId: 'AUD-202400030',
      dateTime: '2024-05-10 11:00:00', 
      user: 'Neha Gupta', 
      role: 'HR Admin',
      module: 'Employee', 
      action: 'Update', 
      description: 'Department Changed from Sales to Marketing',
      ipAddress: '192.168.1.15',
      device: 'Chrome / Windows',
      remarks: 'Department updated',
      employeeName: 'Sarah Williams',
      employeeCode: 'EMP00127',
      fieldChanged: 'Department',
      oldValue: 'Sales',
      newValue: 'Marketing',
      details: 'Department changed',
      actionDetails: {
        reason: 'Organizational restructuring'
      }
    },
    
    // ── 6. UPDATE: Grade Change ──
    { 
      id: 6, 
      auditId: 'AUD-202400031',
      dateTime: '2024-05-15 14:30:00', 
      user: 'Amit Sharma', 
      role: 'HR Manager',
      module: 'Promotion', 
      action: 'Update', 
      description: 'Grade Updated from E3 to E4',
      ipAddress: '192.168.1.20',
      device: 'Firefox / MacOS',
      remarks: 'Grade updated',
      employeeName: 'Jane Smith',
      employeeCode: 'EMP00126',
      fieldChanged: 'Grade',
      oldValue: 'E3',
      newValue: 'E4',
      details: 'Grade updated during promotion',
      actionDetails: {
        reason: 'Promotion to next grade'
      }
    },
    
    // ── 7. APPROVAL ──
    { 
      id: 7, 
      auditId: 'AUD-202400016',
      dateTime: '2024-04-02 09:00:15', 
      user: 'Amit Sharma', 
      role: 'HR Manager',
      module: 'Promotion', 
      action: 'Approval', 
      description: 'Promotion Request Approved',
      ipAddress: '192.168.1.20',
      device: 'Firefox / MacOS',
      remarks: 'Promotion approved by HR Manager',
      employeeName: 'Ashish Sinha',
      employeeCode: 'EMP00125',
      fieldChanged: 'Promotion Status',
      oldValue: 'Pending',
      newValue: 'Approved',
      details: 'Promotion request approved',
      actionDetails: {
        reason: 'Performance exceeds expectations'
      }
    },
    
    // ── 8. UPLOAD ──
    { 
      id: 8, 
      auditId: 'AUD-202400017',
      dateTime: '2024-04-02 09:15:30', 
      user: 'Rajesh Kumar', 
      role: 'HR Admin',
      module: 'Documents', 
      action: 'Upload', 
      description: 'Promotion Letter Uploaded',
      ipAddress: '192.168.1.10',
      device: 'Chrome / Windows',
      remarks: 'Promotion letter document uploaded',
      employeeName: 'Ashish Sinha',
      employeeCode: 'EMP00125',
      fieldChanged: 'Document',
      oldValue: '--',
      newValue: 'Promotion Letter.pdf',
      details: 'Promotion letter uploaded to document repository',
      actionDetails: {
        reason: 'Required for records'
      }
    },
    
    // ── 9. VIEW ──
    { 
      id: 9, 
      auditId: 'AUD-202400018',
      dateTime: '2024-04-05 11:30:00', 
      user: 'Vikram Mehta', 
      role: 'Auditor',
      module: 'Service Book', 
      action: 'View', 
      description: 'Service Book Viewed for Audit',
      ipAddress: '192.168.1.30',
      device: 'Edge / Windows',
      remarks: 'Service book viewed for annual audit',
      employeeName: 'Priya Sharma',
      employeeCode: 'EMP00127',
      fieldChanged: '--',
      oldValue: '--',
      newValue: '--',
      details: 'Service book viewed for audit purposes',
      actionDetails: {
        reason: 'Annual audit review'
      }
    },

    // ── 10. DOWNLOAD ──
    { 
      id: 10, 
      auditId: 'AUD-202400035',
      dateTime: '2024-06-01 10:00:00', 
      user: 'Suresh Patel', 
      role: 'HR Officer',
      module: 'Documents', 
      action: 'Download', 
      description: 'Service Book PDF Downloaded',
      ipAddress: '192.168.1.25',
      device: 'Chrome / Windows',
      remarks: 'Service book downloaded',
      employeeName: 'Ashish Sinha',
      employeeCode: 'EMP00125',
      fieldChanged: 'Document',
      oldValue: '--',
      newValue: 'ServiceBook_EMP00125.pdf',
      details: 'Service book downloaded for reference',
      actionDetails: {
        reason: 'Employee requested copy'
      }
    },

    // ── 11. REJECT ──
    { 
      id: 11, 
      auditId: 'AUD-202400033',
      dateTime: '2024-05-25 16:00:00', 
      user: 'Amit Sharma', 
      role: 'HR Manager',
      module: 'Leave', 
      action: 'Reject', 
      description: 'Leave Request Rejected',
      ipAddress: '192.168.1.20',
      device: 'Firefox / MacOS',
      remarks: 'Leave request rejected',
      employeeName: 'Mike Johnson',
      employeeCode: 'EMP00129',
      fieldChanged: 'Leave Status',
      oldValue: 'Pending',
      newValue: 'Rejected',
      details: 'Leave request rejected due to no available leaves',
      actionDetails: {
        reason: 'No available leaves',
        comments: 'Employee has already used all leaves'
      }
    }
  ];

  // ============================================
  // ALL MODULES LIST
  // ============================================
  const modules = [
    { value: 'all', label: 'All Modules' },
    { value: 'Appointment', label: 'Appointment' },
    { value: 'Promotion', label: 'Promotion' },
    { value: 'Transfer', label: 'Transfer' },
    { value: 'Employee', label: 'Employee' },
    { value: 'Pay Revision', label: 'Pay Revision' },
    { value: 'Documents', label: 'Documents' },
    { value: 'Service Book', label: 'Service Book' },
    { value: 'Leave', label: 'Leave' },
    { value: 'Confirmation', label: 'Confirmation' },
    { value: 'Training', label: 'Training' },
    { value: 'Award', label: 'Award' },
    { value: 'Disciplinary', label: 'Disciplinary' },
    { value: 'Deputation', label: 'Deputation' }
  ];

  // ============================================
  // ALL ACTIONS LIST
  // ============================================
  const actions = [
    { value: 'all', label: 'All Actions' },
    { value: 'Create', label: 'Create', color: '#059669', bg: '#d1fae5', icon: <FaUserPlus size={11} /> },
    { value: 'Update', label: 'Update', color: '#d97706', bg: '#fef3c7', icon: <FaExchangeAlt size={11} /> },
    { value: 'Approval', label: 'Approval', color: '#2563eb', bg: '#dbeafe', icon: <FaCheckCircle size={11} /> },
    { value: 'Reject', label: 'Reject', color: '#dc2626', bg: '#fee2e2', icon: <FaBan size={11} /> },
    { value: 'Delete', label: 'Delete', color: '#991b1b', bg: '#fef2f2', icon: <FaTrash size={11} /> },
    { value: 'View', label: 'View', color: '#0891b2', bg: '#cffafe', icon: <FaEye size={11} /> },
    { value: 'Upload', label: 'Upload', color: '#7c3aed', bg: '#ede9fe', icon: <FaUpload size={11} /> },
    { value: 'Download', label: 'Download', color: '#db2777', bg: '#fce7f3', icon: <FaDownload size={11} /> }
  ];

  const primaryColor = '#9d174d';
  const primaryLight = '#be185d';
  const primaryBg = '#fdf2f8';
  const primaryShadow = 'rgba(157, 23, 77, 0.2)';
  const darkColor = '#1e293b';

  // ── FETCH DATA ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try { 
      await new Promise(r => setTimeout(r, 600)); 
      setAuditLogs(DUMMY_AUDIT_LOGS); 
      setFilteredLogs(DUMMY_AUDIT_LOGS);
      setShowTable(true);
    } catch (e) { 
      toast.error('Error', 'Failed to load audit trail'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── FILTER LOGIC ──
  useEffect(() => {
    setLoading(true);  
    let f = [...auditLogs];
    
    if (filters.employeeSearch.trim()) { 
      const s = filters.employeeSearch.toLowerCase(); 
      f = f.filter(l => 
        l.employeeName.toLowerCase().includes(s) || 
        l.employeeCode.toLowerCase().includes(s)
      ); 
    }
    
    if (filters.module !== 'all') {
      f = f.filter(l => l.module === filters.module);
    }
    
    if (filters.action !== 'all') {
      f = f.filter(l => l.action === filters.action);
    }
    
    if (filters.user.trim()) {
      f = f.filter(l => l.user.toLowerCase().includes(filters.user.toLowerCase()));
    }
    
    if (filters.dateFrom) {
      f = f.filter(l => l.dateTime.split(' ')[0] >= filters.dateFrom);
    }
    
    if (filters.dateTo) {
      f = f.filter(l => l.dateTime.split(' ')[0] <= filters.dateTo);
    }
    
    const actionOrder = {
      Create: 1,
      Update: 2,
      Approval: 3,
      Upload: 4,
      View: 5,
      Download: 6,
      Reject: 7
    };

    f.sort((a, b) => {
      const orderA = actionOrder[a.action] || 999;
      const orderB = actionOrder[b.action] || 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return new Date(b.dateTime) - new Date(a.dateTime);
    });

    setFilteredLogs(f);
    setPage(0);

    if (
      filters.employeeSearch === "" &&
      filters.module === "all" &&
      filters.action === "all" &&
      filters.user === "" &&
      filters.dateFrom === "" &&
      filters.dateTo === ""
    ) {
      if (!isReset) {
        setShowTable(true);
      }
    } else {
      setShowTable(f.length > 0);
    }

    setLoading(false);
    
  }, [filters, auditLogs]);

  const handleFilterChange = (field, value) => {
    setIsReset(false);
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ── RESET ──
  const handleClearFilters = () => {
    setFilters({
      employeeSearch: '',
      module: 'all',
      action: 'all',
      user: '',
      dateFrom: '',
      dateTo: ''
    });

    setFilteredLogs([]);
    setPage(0);
    setIsReset(true);
    setShowTable(false);

    toast.info('Filters Reset', 'All filters have been cleared');
  };

  const handleSearch = () => {
    if (filteredLogs.length === 0) {
      toast.warning('No Records', 'No audit records found matching your criteria');
    } else {
      toast.success('Search Complete', `Found ${filteredLogs.length} record(s)`);
    }
  };
  
  const handleViewDetails = (log) => { 
    setSelectedAuditLog(log); 
    setShowDetails(true); 
  };
  
  const handleBackToList = () => { 
    setShowDetails(false); 
    setSelectedAuditLog(null); 
  };
  
  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.warning('No Data', 'Please apply filters first');
      return;
    }
    toast.success('Export', 'Audit trail exported successfully');
  };
  
  const handleCancel = () => { if (onCancel) onCancel(); };

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => { 
    const d = 2, r = [], l = Math.max(0, page - d), rt = Math.min(totalPages - 1, page + d); 
    if (l > 0) { r.push(0); if (l > 1) r.push('...'); } 
    for (let i = l; i <= rt; i++) r.push(i); 
    if (rt < totalPages - 1) { if (rt < totalPages - 2) r.push('...'); r.push(totalPages - 1); } 
    return r; 
  };

  const formatDateTime = (s) => { 
    const [d, t] = s.split(' '); 
    return { 
      date: new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }), 
      time: t 
    }; 
  };

  const getActionBadge = (a) => { 
    const f = actions.find(x => x.value === a) || actions[0]; 
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '5px',
        padding: '4px 12px', 
        borderRadius: '14px', 
        background: f.bg, 
        color: f.color, 
        fontSize: '12px', 
        fontWeight: '600' 
      }}>
        {f.icon} {a}
      </span>
    ); 
  };
   
  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
    headerCard: { background: 'white', borderRadius: '16px', padding: '22px 28px', marginBottom: '22px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    headerTitle: { fontSize: '24px', fontWeight: '700', color: darkColor, margin: 0, letterSpacing: '-0.02em' },
    headerSubtitle: { fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' },
    iconContainer: { width: '48px', height: '48px', background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryLight} 100%)`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', boxShadow: `0 4px 12px ${primaryShadow}` },
    filterCard: { background: 'white', borderRadius: '14px', padding: '18px 22px', marginBottom: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    tableCard: { background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    tableHeader: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    tableHeaderCell: { padding: '13px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tableRow: { transition: 'all 0.2s ease', cursor: 'pointer' },
    tableCell: { padding: '13px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' },
    secondaryBtn: { padding: '8px 18px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s ease' },
    primaryBtn: { padding: '8px 20px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryLight} 100%)`, color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.3s ease', boxShadow: `0 2px 8px ${primaryShadow}` },
    primaryBtn: { padding: '8px 20px', borderRadius: '10px', border: 'none', background: '#9d174d', color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.3s ease' },
    dangerBtn: { padding: '8px 20px', borderRadius: '10px', border: '1.5px solid #fecaca', background: 'white', color: '#dc2626', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s ease' },
  };

  if (loading) return <LoadingSpinner message="Loading Audit Trail..." />;

  return (
    <div style={styles.container}>
      <style>{`
        input:focus, select:focus { border-color: ${primaryColor} !important; box-shadow: 0 0 0 3px ${primaryColor}15 !important; background: white !important; outline: none !important; }
        .audit-row:hover { background: ${primaryBg} !important; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }
      `}</style>

      {/* HEADER */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={styles.iconContainer}><FaShieldAlt /></div>
            <div>
              <h1 style={styles.headerTitle}>{showDetails ? 'Audit Details' : 'Audit History'}</h1>
              <p style={styles.headerSubtitle}>
                {showDetails 
                  ? `Viewing complete details for Audit ID: ${selectedAuditLog?.auditId}` 
                  : `Track all activities - Create, Update, Approval, Rejection & more`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {showDetails ? (
              <button onClick={handleBackToList} style={styles.secondaryBtn} 
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.color = primaryColor; e.currentTarget.style.background = primaryBg; }} 
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'white'; }}>
                <FaArrowLeft size={12} /> Back to List
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* FILTERS SECTION */}
      {!showDetails && (
        <div style={styles.filterCard}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>
            <FaFilter style={{ marginRight: '8px' }} /> Filters
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                <FaUser size={12} style={{ marginRight: '4px' }} /> Employee Search
              </label>
              <input 
                type="text" 
                placeholder="Search by name or code" 
                value={filters.employeeSearch} 
                onChange={(e) => handleFilterChange('employeeSearch', e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                <FaTag size={12} style={{ marginRight: '4px' }} /> Module
              </label>
              <select value={filters.module} onChange={(e) => handleFilterChange('module', e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#334155', background: '#f8fafc', cursor: 'pointer', outline: 'none' }}>
                <option value="all">All Modules</option>
                {modules.filter(m => m.value !== 'all').map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                <FaFileAlt size={12} style={{ marginRight: '4px' }} /> Action
              </label>
              <select value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: '#334155', background: '#f8fafc', cursor: 'pointer', outline: 'none' }}>
                <option value="all">All Actions</option>
                {actions.filter(a => a.value !== 'all').map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                <FaUserTie size={12} style={{ marginRight: '4px' }} /> User
              </label>
              <input 
                type="text" 
                placeholder="Search by user name" 
                value={filters.user} 
                onChange={(e) => handleFilterChange('user', e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                <FaCalendarAlt size={12} style={{ marginRight: '4px' }} /> From Date
              </label>
              <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' }} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                <FaCalendarAlt size={12} style={{ marginRight: '4px' }} /> To Date
              </label>
              <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} 
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#f8fafc' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button onClick={handleExport} style={styles.secondaryBtn} 
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.color = primaryColor; e.currentTarget.style.background = primaryBg; }} 
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'white'; }}>
              <FaDownload size={12} /> Export
            </button>
            <button onClick={handleSearch} style={styles.primaryBtn}>
              <FaSearch size={12} /> Search
            </button>
            <button onClick={handleClearFilters} style={styles.dangerBtn} 
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }} 
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
              <FaTimes size={12} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* TABLE SECTION */}
      {!showDetails && showTable && (
        <div style={styles.tableCard}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Audit Grid</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Total: {totalItems} records</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.tableHeaderCell}>Date & Time</th>
                  <th style={styles.tableHeaderCell}>Module</th>
                  <th style={styles.tableHeaderCell}>Action</th>
                  <th style={styles.tableHeaderCell}>User</th>
                  <th style={styles.tableHeaderCell}>Description</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: 'center', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.length > 0 ? currentLogs.map((log) => { 
                  const { date, time } = formatDateTime(log.dateTime); 
                  return (
                    <tr key={log.id} className="audit-row" style={styles.tableRow}>
                      <td style={{ ...styles.tableCell, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{date}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{time}</div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          padding: '3px 10px', 
                          borderRadius: '10px', 
                          background: primaryBg, 
                          color: primaryColor, 
                          fontSize: '12px', 
                          fontWeight: '600' 
                        }}>
                          {log.module}
                        </span>
                      </td>
                      <td style={styles.tableCell}>{getActionBadge(log.action)}</td>
                      <td style={styles.tableCell}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#0f172a', fontSize: '12px' }}>{log.user}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{log.role}</div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={{ fontSize: '13px', color: '#334155' }}>{log.description}</div>
                      </td>
                      <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                        <button onClick={() => handleViewDetails(log)} 
                          style={{ 
                            padding: '6px 16px', borderRadius: '8px', 
                            border: 'none', background: primaryColor, 
                            color: 'white', cursor: 'pointer', 
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', fontWeight: '500', transition: 'all 0.25s ease' 
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = primaryLight; e.currentTarget.style.transform = 'scale(1.05)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = primaryColor; e.currentTarget.style.transform = 'scale(1)'; }}
                          title="View complete details">
                          <FaEye size={11} /> View
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ 
                        width: '60px', height: '60px', borderRadius: '50%', 
                        background: primaryBg, display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', margin: '0 auto 12px' 
                      }}>
                        <FaSearch size={28} style={{ color: primaryColor }} />
                      </div>
                      <h3 style={{ color: '#0f172a', margin: 0, fontSize: '16px', fontWeight: '600' }}>No audit records found</h3>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Try adjusting your filter criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalItems > 0 && (
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '12px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px', 
              background: '#fafafa' 
            }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                Page {page + 1} of {totalPages} - Showing records {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)}
              </span>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <button disabled={page === 0} onClick={() => setPage(page - 1)} 
                  style={{ 
                    padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', 
                    background: 'white', color: primaryColor, cursor: page === 0 ? 'not-allowed' : 'pointer', 
                    opacity: page === 0 ? 0.4 : 1, fontSize: '12px', fontWeight: '500', 
                    display: 'flex', alignItems: 'center', gap: '4px' 
                  }}>
                  <FaChevronLeft size={9} /> Previous
                </button>
                {getPaginationRange().map((pg, i) => 
                  pg === '...' ? 
                    <span key={`d-${i}`} style={{ padding: '6px 4px', color: '#94a3b8', fontWeight: '600', fontSize: '12px' }}>...</span> : 
                    <button key={pg} onClick={() => setPage(pg)} 
                      style={{ 
                        padding: '6px 12px', borderRadius: '8px', 
                        border: pg === page ? 'none' : '1.5px solid #e2e8f0', 
                        background: pg === page ? primaryColor : 'white', 
                        color: pg === page ? 'white' : '#475569', 
                        cursor: 'pointer', fontSize: '12px', fontWeight: pg === page ? '600' : '500', 
                        minWidth: '34px', transition: 'all 0.2s ease' 
                      }}>
                      {pg + 1}
                    </button>
                )}
                <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} 
                  style={{ 
                    padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', 
                    background: 'white', color: primaryColor, cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer', 
                    opacity: page + 1 >= totalPages ? 0.4 : 1, fontSize: '12px', fontWeight: '500', 
                    display: 'flex', alignItems: 'center', gap: '4px' 
                  }}>
                  Next <FaChevronRight size={9} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== DETAIL VIEW ===== */}
      {showDetails && selectedAuditLog && (
        <div style={{ 
          background: 'white', borderRadius: '16px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {/* Detail Header */}
          <div style={{ 
            padding: '16px 24px', 
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryLight} 100%)`, 
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaHistory /> Audit Details
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                  Audit ID: {selectedAuditLog.auditId}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleBackToList} style={{ 
                  padding: '6px 16px', borderRadius: '8px', border: 'none', 
                  background: 'rgba(255,255,255,0.2)', color: 'white', 
                  cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <FaArrowLeft size={11} /> Back
                </button>
              </div>
            </div>
          </div>

          {/* Detail Body */}
          <div style={{ padding: '24px' }}>
            
            {/* ── EMPLOYEE INFO ── */}
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '12px 16px', background: primaryBg, borderRadius: '10px',
              marginBottom: '20px', border: `1px solid ${primaryColor}25`
            }}>
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '50%', 
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '18px', fontWeight: '700'
              }}>
                {selectedAuditLog.employeeName.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>
                  {selectedAuditLog.employeeName}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  <FaIdCard size={12} style={{ marginRight: '4px' }} />
                  {selectedAuditLog.employeeCode}
                </div>
              </div>
            </div>

            {/* ── BASIC DETAILS GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Audit ID', value: selectedAuditLog.auditId, icon: <FaTag size={14} /> },
                { label: 'Module', value: selectedAuditLog.module, icon: <FaFileAlt size={14} />, badge: true },
                { label: 'Action', value: selectedAuditLog.action, icon: <FaTag size={14} />, action: true },
                { label: 'Date & Time', value: `${formatDateTime(selectedAuditLog.dateTime).date} ${formatDateTime(selectedAuditLog.dateTime).time}`, icon: <FaCalendarAlt size={14} /> },
                { label: 'Performed By', value: selectedAuditLog.user, icon: <FaUserTie size={14} /> },
                { label: 'User Role', value: selectedAuditLog.role, icon: <FaShieldAlt size={14} /> },
                { label: 'IP Address', value: selectedAuditLog.ipAddress, icon: <FaGlobe size={14} />, mono: true },
                { label: 'Device', value: selectedAuditLog.device, icon: <FaLaptop size={14} /> },
                { label: 'Remarks', value: selectedAuditLog.remarks, icon: <FaInfoCircle size={14} />, full: true }
              ].map((item, i) => (
                <div key={i} style={{ 
                  padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', 
                  border: '1px solid #e2e8f0',
                  gridColumn: item.full ? '1 / -1' : 'auto'
                }}>
                  <div style={{ 
                    fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', 
                    letterSpacing: '0.05em', fontWeight: '600', marginBottom: '4px',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}>
                    {item.icon} {item.label}
                  </div>
                  {item.badge ? 
                    <span style={{ 
                      display: 'inline-block', padding: '3px 12px', borderRadius: '10px', 
                      background: primaryBg, color: primaryColor, fontSize: '13px', fontWeight: '600' 
                    }}>{item.value}</span> :
                    item.action ? 
                      getActionBadge(item.value) :
                    <div style={{ 
                      fontSize: '13px', color: '#0f172a', fontWeight: '500',
                      fontFamily: item.mono ? "'JetBrains Mono', monospace" : 'inherit'
                    }}>{item.value}</div>
                  }
                </div>
              ))}
            </div>

{/* ── ACTION DETAILS TABLE ── */}
{(selectedAuditLog.action === 'Update' || selectedAuditLog.action === 'Download') && (
  <div style={{ 
    border: '1px solid #e2e8f0', 
    borderRadius: '12px', 
    overflow: 'hidden'
  }}>
    <div style={{ 
      padding: '12px 20px', 
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px'
    }}>
      <FaInfoCircle size={14} style={{ color: primaryColor }} />
      <span style={{ fontWeight: '600', color: primaryColor, fontSize: '14px' }}>
        Action Details - {selectedAuditLog.action}
      </span>
    </div>
    
    <div style={{ padding: '0', overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        fontSize: '13px', 
        minWidth: '500px',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <thead>
          <tr style={{ 
            background: '#f8fafc', 
            borderBottom: '2px solid #e2e8f0'
          }}>
            <th style={{ 
              padding: '10px 16px', 
              textAlign: 'center',        
              fontSize: '11px', 
              fontWeight: '700', 
              color: '#475569', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '33.33%'
            }}>
              Field Details
            </th>
            <th style={{ 
              padding: '10px 16px', 
              textAlign: 'center',        
              fontSize: '11px', 
              fontWeight: '700', 
              color: '#475569', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '33.33%'
            }}>
              Old Value
            </th>
            <th style={{ 
              padding: '10px 16px', 
              textAlign: 'center',        
              fontSize: '11px', 
              fontWeight: '700', 
              color: '#475569', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '33.33%'
            }}>
              New Value
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ 
              padding: '10px 16px', 
              fontWeight: '500', 
              color: '#0f172a',
              textAlign: 'center'          
            }}>
              {selectedAuditLog.fieldChanged}
            </td>
            <td style={{ 
              padding: '10px 16px',
              textAlign: 'center'          
            }}>
              <span style={{ 
                background: '#fef2f2', 
                padding: '4px 12px', 
                borderRadius: '6px', 
                color: '#dc2626', 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: '12px',
                display: 'inline-block'
              }}>
                {selectedAuditLog.oldValue}
              </span>
            </td>
            <td style={{ 
              padding: '10px 16px',
              textAlign: 'center'          
            }}>
              <span style={{ 
                background: '#ecfdf5', 
                padding: '4px 12px', 
                borderRadius: '6px', 
                color: '#059669', 
                fontFamily: "'JetBrains Mono', monospace", 
                fontSize: '12px',
                display: 'inline-block'
              }}>
                {selectedAuditLog.newValue}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;