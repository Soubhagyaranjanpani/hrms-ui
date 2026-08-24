import React, { useState } from 'react';
import {
  FaSave, FaEdit, FaPlus, FaArrowLeft, FaSync,
  FaCalendarAlt, FaToggleOn, FaServer, FaCheckCircle,
  FaToggleOff, FaExclamationCircle, FaSearch, FaFilter,
  FaClock, FaDownload, FaHistory, FaUser, FaFingerprint,
  FaRobot, FaClock as FaClockIcon,FaTimes
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const AttendanceSynchronization = () => {
  // ─── Dummy Data ──────────────────────────────────────────
  const [syncLogs, setSyncLogs] = useState([
    {
      id: 1,
      deviceId: 1,
      deviceCode: 'DEV-001',
      deviceName: 'Main Gate Scanner',
      syncFrom: '2024-01-01T09:00:00',
      syncTo: '2024-01-01T18:00:00',
      syncType: 'Incremental',
      lastSyncTime: '2024-01-01T18:30:00',
      syncStatus: 'Success',
      recordsImported: 156,
      importedBy: 'System',
      syncDate: '2024-01-01T18:30:00',
      isAutoSync: true
    },
    {
      id: 2,
      deviceId: 2,
      deviceCode: 'DEV-002',
      deviceName: 'Office Entry Device',
      syncFrom: '2024-01-02T09:00:00',
      syncTo: '2024-01-02T18:00:00',
      syncType: 'Full',
      lastSyncTime: '2024-01-02T18:30:00',
      syncStatus: 'Success',
      recordsImported: 234,
      importedBy: 'System',
      syncDate: '2024-01-02T18:30:00',
      isAutoSync: true
    },
    {
      id: 3,
      deviceId: 3,
      deviceCode: 'DEV-003',
      deviceName: 'Back Door Scanner',
      syncFrom: '2024-01-03T09:00:00',
      syncTo: '2024-01-03T18:00:00',
      syncType: 'Incremental',
      lastSyncTime: '2024-01-02T18:30:00',
      syncStatus: 'Failed',
      recordsImported: 0,
      importedBy: 'System',
      syncDate: '2024-01-03T18:30:00',
      isAutoSync: false
    },
    {
      id: 4,
      deviceId: 4,
      deviceCode: 'DEV-004',
      deviceName: 'HR Department Device',
      syncFrom: '2024-01-04T09:00:00',
      syncTo: '2024-01-04T18:00:00',
      syncType: 'Full',
      lastSyncTime: '2024-01-04T18:30:00',
      syncStatus: 'In Progress',
      recordsImported: 89,
      importedBy: 'System',
      syncDate: '2024-01-04T18:30:00',
      isAutoSync: true
    },
    {
      id: 5,
      deviceId: 5,
      deviceCode: 'DEV-005',
      deviceName: 'Finance Entry Scanner',
      syncFrom: '2024-01-05T09:00:00',
      syncTo: '2024-01-05T18:00:00',
      syncType: 'Incremental',
      lastSyncTime: '2024-01-05T18:30:00',
      syncStatus: 'Success',
      recordsImported: 312,
      importedBy: 'System',
      syncDate: '2024-01-05T18:30:00',
      isAutoSync: true
    }
  ]);

  // ─── Dropdown Options ────────────────────────────────────
  const registeredDevices = [
    { id: 1, deviceCode: 'DEV-001', deviceName: 'Main Gate Scanner', vendor: 'ZKTeco' },
    { id: 2, deviceCode: 'DEV-002', deviceName: 'Office Entry Device', vendor: 'eSSL' },
    { id: 3, deviceCode: 'DEV-003', deviceName: 'Back Door Scanner', vendor: 'Matrix' },
    { id: 4, deviceCode: 'DEV-004', deviceName: 'HR Department Device', vendor: 'Suprema' },
    { id: 5, deviceCode: 'DEV-005', deviceName: 'Finance Entry Scanner', vendor: 'Hikvision' }
  ];

  const syncTypes = ['Incremental', 'Full'];

  // ─── States ──────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Form State ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    deviceId: '',
    syncFrom: '',
    syncTo: '',
    syncType: 'Incremental',
    lastSyncTime: '',
    syncStatus: '',
    isAutoSync: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── Filter Logic ──────────────────────────────────────
  const filteredLogs = syncLogs.filter(log => {
    const search = searchTerm.toLowerCase();
    return log.deviceName.toLowerCase().includes(search) ||
           log.deviceCode.toLowerCase().includes(search) ||
           log.syncType.toLowerCase().includes(search) ||
           log.syncStatus.toLowerCase().includes(search) ||
           log.recordsImported.toString().includes(search);
  });

  // ─── Form Handlers ───────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    const requiredFields = ['deviceId', 'syncFrom', 'syncTo', 'syncType'];

    if (requiredFields.includes(field) && !value) {
      error = 'This field is required';
    }

    if (field === 'syncFrom' && value && formData.syncTo && new Date(value) > new Date(formData.syncTo)) {
      error = 'From date cannot be after To date';
    }

    if (field === 'syncTo' && value && formData.syncFrom && new Date(value) < new Date(formData.syncFrom)) {
      error = 'To date cannot be before From date';
    }

    setErrors({ ...errors, [field]: error });
    return error === '';
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['deviceId', 'syncFrom', 'syncTo', 'syncType'];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.syncFrom && formData.syncTo && new Date(formData.syncFrom) > new Date(formData.syncTo)) {
      newErrors.syncFrom = 'From date cannot be after To date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Get Last Sync Time for Device ────────────────────────
  const getLastSyncForDevice = (deviceId) => {
    const log = syncLogs.find(l => l.deviceId === Number(deviceId));
    return log ? log.lastSyncTime : null;
  };

  const getSyncStatusForDevice = (deviceId) => {
    const log = syncLogs.find(l => l.deviceId === Number(deviceId));
    return log ? log.syncStatus : 'Never Synced';
  };

  // ─── Update Form When Device Changes ──────────────────────
  const handleDeviceChange = (deviceId) => {
    const lastSync = getLastSyncForDevice(deviceId);
    const status = getSyncStatusForDevice(deviceId);
    setFormData({
      ...formData,
      deviceId: deviceId,
      lastSyncTime: lastSync || '',
      syncStatus: status
    });
    if (touched.deviceId) {
      validateField('deviceId', deviceId);
    }
  };

  // ─── Edit Handler ──────────────────────────────────────
  const handleEdit = (log) => {
    setEditingId(log.id);
    setFormData({
      deviceId: log.deviceId,
      syncFrom: log.syncFrom,
      syncTo: log.syncTo,
      syncType: log.syncType,
      lastSyncTime: log.lastSyncTime,
      syncStatus: log.syncStatus,
      isAutoSync: log.isAutoSync || true
    });
    setShowForm(true);
  };

  // ─── Sync Now Handler ──────────────────────────────────────
  const handleSyncNow = () => {
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }

    setIsSyncing(true);
    toast.info('Syncing', 'Starting attendance synchronization...');

    setTimeout(() => {
      const device = registeredDevices.find(d => d.id === Number(formData.deviceId));
      const now = new Date().toISOString();
      const status = 'Success';

      const newSyncLog = {
        id: editingId || Date.now(),
        deviceId: Number(formData.deviceId),
        deviceCode: device?.deviceCode || `DEV-${String(syncLogs.length + 1).padStart(3, '0')}`,
        deviceName: device?.deviceName || 'Unknown Device',
        syncFrom: formData.syncFrom,
        syncTo: formData.syncTo,
        syncType: formData.syncType,
        lastSyncTime: now,
        syncStatus: status,
        recordsImported: Math.floor(Math.random() * 200) + 50,
        importedBy: 'System',
        syncDate: now,
        isAutoSync: formData.isAutoSync
      };

      if (editingId) {
        setSyncLogs(syncLogs.map(log => log.id === editingId ? newSyncLog : log));
        toast.success('Success', 'Sync log updated successfully');
      } else {
        setSyncLogs([newSyncLog, ...syncLogs]);
        toast.success('Success', `Imported ${newSyncLog.recordsImported} records successfully`);
      }

      resetForm();
      setShowForm(false);
      setIsSyncing(false);
    }, 3000);
  };

  // ─── Reset Form ──────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      deviceId: '',
      syncFrom: '',
      syncTo: '',
      syncType: 'Incremental',
      lastSyncTime: '',
      syncStatus: '',
      isAutoSync: true
    });
    setErrors({});
    setTouched({});
    setEditingId(null);
  };

  // ─── Open Form ──────────────────────────────────────────
  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  // ─── Cancel Form ──────────────────────────────────────────
  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // ─── Pagination ──────────────────────────────────────────
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  // ─── Format Date/Time ────────────────────────────────────
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ─── Styles ──────────────────────────────────────────────
  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8ecf1' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    iconBox: { width: '46px', height: '46px', background: 'linear-gradient(135deg, #9d174d, #be185d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
    searchBox: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchInput: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', flex: '1', minWidth: '200px', transition: 'all 0.3s ease' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' },
    field: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    required: { color: '#ef4444', marginLeft: '2px' },
    input: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', transition: 'all 0.3s ease' },
    error: { color: '#ef4444', fontSize: '11px', marginTop: '2px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' },
    td: { padding: '10px 16px', borderBottom: '1px solid #f1f5f9' },
    btnPrimary: { padding: '8px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSecondary: { padding: '8px 20px', background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSuccess: { padding: '8px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnWarning: { padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' },
    chip: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Success': { bg: '#d1fae5', color: '#065f46', icon: <FaCheckCircle size={12} /> },
      'Failed': { bg: '#fee2e2', color: '#991b1b', icon: <FaExclamationCircle size={12} /> },
      'In Progress': { bg: '#fef3c7', color: '#92400e', icon: <FaSync size={12} className="fa-spin" /> },
      'Never Synced': { bg: '#f1f5f9', color: '#64748b', icon: <FaClock size={12} /> }
    };
    return badges[status] || badges['Never Synced'];
  };

  return (
    <div style={styles.container}>
      <style>{`
        .sync-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .sync-input.error {
          border-color: #ef4444 !important;
        }
        .sync-input.error:focus {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
        }
        .fa-spin {
          animation: fa-spin 2s infinite linear;
        }
        @keyframes fa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .search-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .toggle-switch {
          width: 40px;
          height: 22px;
          border-radius: 11px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          border: none;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          top: 2px;
          left: 2px;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .toggle-switch.active {
          background: #9d174d;
        }
        .toggle-switch.active::after {
          left: 20px;
        }
        .toggle-switch.inactive {
          background: #cbd5e1;
        }
        .toggle-switch.inactive::after {
          left: 2px;
        }
        .readonly-field {
          background: #f1f5f9 !important;
          cursor: not-allowed !important;
          color: #64748b !important;
        }
        .datetime-input {
          padding: 9px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          background: white;
          transition: all 0.3s ease;
          width: 100%;
          font-family: inherit;
        }
        .datetime-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .datetime-input.error {
          border-color: #ef4444 !important;
        }
        .datetime-input.error:focus {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
        }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaSync size={20} /></div>
          <div>
            <h1 style={styles.title}>Attendance Synchronization</h1>
            <p style={styles.subtitle}>{syncLogs.length} sync logs available</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!showForm && (
            <button style={styles.btnPrimary} onClick={openForm}>
              <FaSync size={13} /> Sync Now
            </button>
          )}
          {showForm && (
            <button style={styles.btnSecondary} onClick={handleCancel}>
              <FaArrowLeft size={13} /> Back to List
            </button>
          )}
        </div>
      </div>

      {/* ─── SEARCH BAR ────────────────────────────────────── */}
    {!showForm && (
  <div className="emp-search-bar">
    <div className="emp-search-wrap">
      <FaSearch className="emp-search-icon" size={12} />
      <input
        className="emp-search-input"
        type="text"
        placeholder="Search by device name, code, sync type, status or records..."
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
      />
      {searchTerm && (
        <button className="cert-search-clear" onClick={() => { setSearchTerm(''); setCurrentPage(0); }}>
          <FaTimes size={11} />
        </button>
      )}
    </div>
  </div>
)}
      {/* ─── FORM SECTION ────────────────────────────────── */}
      {showForm && (
        <div style={{ ...styles.card, marginBottom: '24px', borderColor: '#9d174d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              <FaSync size={14} style={{ marginRight: '8px' }} />
              {editingId ? 'Edit Sync Log' : 'Synchronize Attendance Logs'}
            </h4>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required</span>
          </div>

          <div style={styles.formGrid}>
            {/* Device Dropdown */}
            <div style={styles.field}>
              <label style={styles.label}>Device <span style={styles.required}>*</span></label>
              <select
                className={`sync-input ${errors.deviceId && touched.deviceId ? 'error' : ''}`}
                style={styles.input}
                value={formData.deviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                onBlur={() => handleBlur('deviceId')}
              >
                <option value="">Select Device</option>
                {registeredDevices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.deviceCode} - {d.deviceName} ({d.vendor})
                  </option>
                ))}
              </select>
              {errors.deviceId && touched.deviceId && <div style={styles.error}>{errors.deviceId}</div>}
            </div>

            {/* Sync From - Date Time Picker */}
            <div style={styles.field}>
              <label style={styles.label}>Sync From <span style={styles.required}>*</span></label>
              <input
                type="datetime-local"
                className={`datetime-input ${errors.syncFrom && touched.syncFrom ? 'error' : ''}`}
                value={formData.syncFrom}
                onChange={(e) => handleChange('syncFrom', e.target.value)}
                onBlur={() => handleBlur('syncFrom')}
              />
              {errors.syncFrom && touched.syncFrom && <div style={styles.error}>{errors.syncFrom}</div>}
            </div>

            {/* Sync To - Date Time Picker */}
            <div style={styles.field}>
              <label style={styles.label}>Sync To <span style={styles.required}>*</span></label>
              <input
                type="datetime-local"
                className={`datetime-input ${errors.syncTo && touched.syncTo ? 'error' : ''}`}
                value={formData.syncTo}
                onChange={(e) => handleChange('syncTo', e.target.value)}
                onBlur={() => handleBlur('syncTo')}
              />
              {errors.syncTo && touched.syncTo && <div style={styles.error}>{errors.syncTo}</div>}
            </div>

            {/* Sync Type */}
            <div style={styles.field}>
              <label style={styles.label}>Sync Type <span style={styles.required}>*</span></label>
              <select
                className={`sync-input ${errors.syncType && touched.syncType ? 'error' : ''}`}
                style={styles.input}
                value={formData.syncType}
                onChange={(e) => handleChange('syncType', e.target.value)}
                onBlur={() => handleBlur('syncType')}
              >
                <option value="">Select Sync Type</option>
                {syncTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.syncType && touched.syncType && <div style={styles.error}>{errors.syncType}</div>}
            </div>

            {/* Last Sync Time - Auto, Read Only */}
            <div style={styles.field}>
              <label style={styles.label}>Last Sync Time <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>(Auto)</span></label>
              <div style={{
                ...styles.input,
                background: '#f1f5f9',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#64748b'
              }}>
                <FaClockIcon size={14} style={{ color: '#94a3b8' }} />
                <span>{formData.lastSyncTime ? formatDateTime(formData.lastSyncTime) : 'Never Synced'}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Auto-updated on successful sync</span>
            </div>

            {/* Sync Status - Auto, Read Only */}
            <div style={styles.field}>
              <label style={styles.label}>Sync Status <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>(Auto)</span></label>
              <div style={{
                ...styles.input,
                background: '#f1f5f9',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {(() => {
                  const badge = getStatusBadge(formData.syncStatus || 'Never Synced');
                  return (
                    <span style={{
                      ...styles.chip,
                      background: badge.bg,
                      color: badge.color,
                      padding: '4px 12px'
                    }}>
                      {badge.icon}
                      {formData.syncStatus || 'Never Synced'}
                    </span>
                  );
                })()}
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Auto-updated after sync attempt</span>
            </div>

            {/* Auto Sync Toggle */}
            <div style={styles.field}>
              <label style={styles.label}>Auto Sync</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <button
                  className={`toggle-switch ${formData.isAutoSync ? 'active' : 'inactive'}`}
                  onClick={() => handleChange('isAutoSync', !formData.isAutoSync)}
                />
                <span style={{ fontSize: '13px', fontWeight: '500', color: formData.isAutoSync ? '#065f46' : '#991b1b' }}>
                  {formData.isAutoSync ? 'Auto sync enabled' : 'Manual sync only'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                <FaRobot size={12} style={{ marginRight: '4px' }} />
                {formData.isAutoSync ? 'Synchronization will run automatically' : 'Synchronization will run only when triggered manually'}
              </span>
            </div>
          </div>

          {/* ─── Form Actions ────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button style={styles.btnSecondary} onClick={handleCancel}>
              Cancel
            </button>
            <button style={styles.btnSecondary} onClick={resetForm}>
              Reset
            </button>
            <button
              style={isSyncing ? { ...styles.btnSuccess, opacity: 0.7, cursor: 'not-allowed' } : styles.btnSuccess}
              onClick={handleSyncNow}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <><FaSync size={13} className="fa-spin" /> Syncing...</>
              ) : (
                <><FaSync size={13} /> {editingId ? 'Update' : 'Sync Now'}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── TABLE ─────────────────────────────────────────── */}
      {!showForm && (
        <div style={styles.card}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FaSync size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No sync logs found</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Device</th>
                      <th style={styles.th}>Sync Type</th>
                      <th style={styles.th}>Sync From</th>
                      <th style={styles.th}>Sync To</th>
                      <th style={styles.th}>Last Sync Time</th>
                      <th style={styles.th}>Records</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, textAlign: 'center', width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.length > 0 ? (
                      currentLogs.map((log, idx) => {
                        const statusBadge = getStatusBadge(log.syncStatus);
                        return (
                          <tr key={log.id} style={{ transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={styles.td}>{startIndex + idx + 1}</td>
                            <td style={{ ...styles.td, fontWeight: '500' }}>
                              <div>
                                {log.isAutoSync && (
                                  <FaRobot size={12} style={{ color: '#9d174d', marginRight: '4px' }} title="Auto Sync" />
                                )}
                                {log.deviceName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{log.deviceCode}</div>
                            </td>
                            <td style={styles.td}>
                              <span style={{ ...styles.chip, background: '#eef2ff', color: '#4f46e5' }}>
                                {log.syncType}
                              </span>
                            </td>
                            <td style={styles.td}>{formatDateTime(log.syncFrom)}</td>
                            <td style={styles.td}>{formatDateTime(log.syncTo)}</td>
                            <td style={styles.td}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaClockIcon size={12} style={{ color: '#94a3b8' }} />
                                {formatDateTime(log.lastSyncTime)}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={{ ...styles.chip, background: '#fce7f3', color: '#9d174d' }}>
                                <FaUser size={10} style={{ marginRight: '4px' }} />
                                {log.recordsImported}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.chip,
                                background: statusBadge.bg,
                                color: statusBadge.color
                              }}>
                                {statusBadge.icon}
                                {log.syncStatus}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <button
                                style={styles.btnWarning}
                                onClick={() => handleEdit(log)}
                                title="Edit"
                              >
                                <FaEdit size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                          <p>No sync logs found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ─── Pagination ────────────────────────────────── */}
              {totalPages > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} logs
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: currentPage === 0 ? 0.5 : 1 }}
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      ← Prev
                    </button>
                    {getPaginationRange().map((pg, i) =>
                      pg === '...' ? (
                        <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                      ) : (
                        <button
                          key={pg}
                          style={{ padding: '6px 10px', border: '1px solid #e5e7eb', background: pg === currentPage ? '#9d174d' : 'white', color: pg === currentPage ? 'white' : '#374151', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px' }}
                          onClick={() => setCurrentPage(pg)}
                        >
                          {pg + 1}
                        </button>
                      )
                    )}
                    <button
                      style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: currentPage + 1 >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: currentPage + 1 >= totalPages ? 0.5 : 1 }}
                      disabled={currentPage + 1 >= totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceSynchronization;  