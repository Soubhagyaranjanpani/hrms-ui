import React, { useState } from 'react';
import {
  FaSave, FaFlask, FaPlug, FaCheckCircle,
  FaExclamationCircle, FaServer, FaEye, FaEyeSlash,
  FaEdit, FaPlus, FaTimes, FaArrowLeft, FaSearch
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const DeviceConnectionConfig = () => {
  // ─── Dummy Registered Devices ────────────────────────────
  const registeredDevices = [
    { id: 1, deviceCode: 'DEV-001', deviceName: 'Main Gate Scanner', vendor: 'ZKTeco' },
    { id: 2, deviceCode: 'DEV-002', deviceName: 'Office Entry Device', vendor: 'eSSL' },
    { id: 3, deviceCode: 'DEV-003', deviceName: 'Back Door Scanner', vendor: 'Matrix' },
    { id: 4, deviceCode: 'DEV-004', deviceName: 'HR Department Device', vendor: 'Suprema' },
    { id: 5, deviceCode: 'DEV-005', deviceName: 'Finance Entry Scanner', vendor: 'Hikvision' }
  ];

  // ─── Dummy Saved Configurations ──────────────────────────
  const dummyConfigs = [
    { id: 1, deviceId: 1, deviceCode: 'DEV-001', deviceName: 'Main Gate Scanner', connectionType: 'LAN', ipAddress: '192.168.1.100', port: '4370', username: 'admin', password: 'admin123', syncInterval: '5', connectionStatus: 'Connected' },
    { id: 2, deviceId: 2, deviceCode: 'DEV-002', deviceName: 'Office Entry Device', connectionType: 'API', ipAddress: '192.168.1.101', port: '8080', username: 'admin', password: 'pass123', syncInterval: '10', connectionStatus: 'Disconnected' },
    { id: 3, deviceId: 3, deviceCode: 'DEV-003', deviceName: 'Back Door Scanner', connectionType: 'SDK', ipAddress: '192.168.1.102', port: '4370', username: '', password: '', syncInterval: '15', connectionStatus: 'Connected' },
    { id: 4, deviceId: 4, deviceCode: 'DEV-004', deviceName: 'HR Department Device', connectionType: 'LAN', ipAddress: '192.168.1.103', port: '4370', username: 'admin', password: 'admin123', syncInterval: '30', connectionStatus: 'Connected' },
    { id: 5, deviceId: 5, deviceCode: 'DEV-005', deviceName: 'Finance Entry Scanner', connectionType: 'API', ipAddress: '192.168.1.104', port: '8080', username: 'admin', password: 'pass123', syncInterval: '5', connectionStatus: 'Disconnected' },
    { id: 6, deviceId: 1, deviceCode: 'DEV-001', deviceName: 'Main Gate Scanner', connectionType: 'SDK', ipAddress: '192.168.1.105', port: '4370', username: '', password: '', syncInterval: '10', connectionStatus: 'Connected' },
    { id: 7, deviceId: 2, deviceCode: 'DEV-002', deviceName: 'Office Entry Device', connectionType: 'LAN', ipAddress: '192.168.1.106', port: '4370', username: 'admin', password: 'admin123', syncInterval: '15', connectionStatus: 'Disconnected' },
    { id: 8, deviceId: 3, deviceCode: 'DEV-003', deviceName: 'Back Door Scanner', connectionType: 'API', ipAddress: '192.168.1.107', port: '8080', username: 'admin', password: 'pass123', syncInterval: '30', connectionStatus: 'Connected' },
    { id: 9, deviceId: 4, deviceCode: 'DEV-004', deviceName: 'HR Department Device', connectionType: 'LAN', ipAddress: '192.168.1.108', port: '4370', username: 'admin', password: 'admin123', syncInterval: '5', connectionStatus: 'Connected' },
    { id: 10, deviceId: 5, deviceCode: 'DEV-005', deviceName: 'Finance Entry Scanner', connectionType: 'SDK', ipAddress: '192.168.1.109', port: '4370', username: '', password: '', syncInterval: '10', connectionStatus: 'Disconnected' }
  ];

  // ─── Initial Config ───────────────────────────────────────
  const initialConfig = {
    deviceId: '',
    connectionType: 'LAN',
    ipAddress: '',
    port: '',
    username: '',
    password: '',
    syncInterval: '5',
    connectionStatus: 'Disconnected'
  };

  // ─── States ──────────────────────────────────────────────
  const [configs, setConfigs] = useState(dummyConfigs);
  const [config, setConfig] = useState(initialConfig);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Options ─────────────────────────────────────────────
  const connectionTypes = ['LAN', 'API', 'SDK'];
  const syncIntervals = ['1', '5', '10', '15', '30', '60'];
  const statusOptions = ['Connected', 'Disconnected'];

  // ─── Filter Logic ──────────────────────────────────────
  const filteredConfigs = configs.filter(cfg => {
    const search = searchTerm.toLowerCase();
    return cfg.deviceCode.toLowerCase().includes(search) ||
           cfg.deviceName.toLowerCase().includes(search) ||
           cfg.connectionType.toLowerCase().includes(search) ||
           cfg.ipAddress.toLowerCase().includes(search) ||
           cfg.connectionStatus.toLowerCase().includes(search) ||
           cfg.port.toString().includes(search);
  });

  // ─── Pagination ──────────────────────────────────────────
  const totalItems = filteredConfigs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const currentConfigs = filteredConfigs.slice(startIndex, startIndex + rowsPerPage);

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

  // ─── Validation ──────────────────────────────────────────
  const validateField = (field, value) => {
    let error = '';
    const required = ['deviceId', 'connectionType', 'ipAddress', 'port', 'syncInterval', 'connectionStatus'];

    if (required.includes(field) && !value) {
      error = 'This field is required';
    }

    if (field === 'ipAddress' && value) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(value)) {
        error = 'Invalid IP address format';
      }
    }

    if (field === 'port' && value) {
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        error = 'Port must be between 1 and 65535';
      }
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, config[field]);
  };

  const validateForm = () => {
    const required = ['deviceId', 'connectionType', 'ipAddress', 'port', 'syncInterval', 'connectionStatus'];
    let valid = true;
    const newErrors = {};

    required.forEach(field => {
      if (!config[field]) {
        newErrors[field] = 'This field is required';
        valid = false;
      }
    });

    if (config.ipAddress) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(config.ipAddress)) {
        newErrors.ipAddress = 'Invalid IP address format';
        valid = false;
      }
    }

    if (config.port) {
      const port = parseInt(config.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.port = 'Port must be between 1 and 65535';
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  // ─── Actions ─────────────────────────────────────────────
  const handleAddNew = () => {
    setConfig(initialConfig);
    setEditingId(null);
    setErrors({});
    setTouched({});
    setShowForm(true);
  };

  const handleEdit = (cfg) => {
    setConfig({
      deviceId: cfg.deviceId || '',
      connectionType: cfg.connectionType || 'LAN',
      ipAddress: cfg.ipAddress || '',
      port: cfg.port || '',
      username: cfg.username || '',
      password: cfg.password || '',
      syncInterval: cfg.syncInterval || '5',
      connectionStatus: cfg.connectionStatus || 'Disconnected'
    });
    setEditingId(cfg.id);
    setErrors({});
    setTouched({});
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingId(null);
    setConfig(initialConfig);
    setErrors({});
    setTouched({});
  };

  const handleTestConnection = () => {
    if (!config.ipAddress || !config.port) {
      toast.warning('Validation Error', 'Please enter IP Address and Port first');
      return;
    }

    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      const success = Math.random() > 0.3;
      const status = success ? 'Connected' : 'Disconnected';
      setConfig(prev => ({ ...prev, connectionStatus: status }));

      if (success) {
        toast.success('Connection Test', 'Device connected successfully!');
      } else {
        toast.error('Connection Test', 'Failed to connect to device');
      }
    }, 1500);
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix all errors');
      return;
    }

    const device = registeredDevices.find(d => d.id === Number(config.deviceId));
    
    const newConfig = {
      id: editingId || Date.now(),
      deviceId: Number(config.deviceId),
      deviceCode: device?.deviceCode || 'DEV-000',
      deviceName: device?.deviceName || 'Unknown',
      ...config
    };

    if (editingId) {
      setConfigs(prev => prev.map(c => c.id === editingId ? newConfig : c));
      toast.success('Success', 'Configuration updated successfully!');
    } else {
      setConfigs(prev => [...prev, newConfig]);
      toast.success('Success', 'Configuration added successfully!');
    }

    setShowForm(false);
    setEditingId(null);
    setConfig(initialConfig);
    setErrors({});
    setTouched({});
  };

  // ─── Styles ──────────────────────────────────────────────
  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8ecf1', marginBottom: '24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    iconBox: { width: '46px', height: '46px', background: 'linear-gradient(135deg, #9d174d, #be185d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
    searchBox: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchInput: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', flex: '1', minWidth: '200px', transition: 'all 0.3s ease' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
    field: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    required: { color: '#ef4444', marginLeft: '2px' },
    input: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', transition: 'all 0.3s ease' },
    inputGroup: { display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '8px', background: 'white', transition: 'all 0.3s ease' },
    error: { color: '#ef4444', fontSize: '11px', marginTop: '2px' },
    statusBadge: (status) => ({
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: status === 'Connected' ? '#d1fae5' : '#fee2e2',
      color: status === 'Connected' ? '#065f46' : '#991b1b',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    }),
    btnPrimary: { padding: '10px 24px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSecondary: { padding: '10px 24px', background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSuccess: { padding: '10px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' },
    td: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9' },
    editBtn: { padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .config-input:focus { border-color: #9d174d !important; box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important; }
        .config-input.error { border-color: #ef4444 !important; }
        .config-input.error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .input-group-focus:focus-within { border-color: #9d174d !important; box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important; }
        .search-input:focus { border-color: #9d174d !important; box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important; }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaPlug size={20} /></div>
          <div>
            <h1 style={styles.title}>Device Connection Configuration</h1>
            <p style={styles.subtitle}>{configs.length} configurations saved</p>
          </div>
        </div>
        {!showForm ? (
          <button style={styles.btnPrimary} onClick={handleAddNew}>
            <FaPlus size={13} /> Add Configuration
          </button>
        ) : (
          <button style={styles.btnSecondary} onClick={handleBack}>
            <FaArrowLeft size={13} /> Back
          </button>
        )}
      </div>

      {/* ─── SEARCH BAR ────────────────────────────────────── */}
      {!showForm && (
        <div style={{ ...styles.card, marginBottom: '16px' }}>
          <div style={styles.searchBox}>
            <input
              className="search-input"
              style={styles.searchInput}
              type="text"
              placeholder="Search by device code, name, IP, connection type, status or port..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
            <button 
              style={{ ...styles.btnSecondary, padding: '8px 16px' }}
              onClick={() => { setSearchTerm(''); setCurrentPage(0); }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ─── TABLE ─────────────────────────────────────────── */}
      {!showForm && (
        <div style={styles.card}>
          {filteredConfigs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FaServer size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No configurations found</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Device</th>
                      <th style={styles.th}>Connection Type</th>
                      <th style={styles.th}>IP Address</th>
                      <th style={styles.th}>Port</th>
                      <th style={styles.th}>Sync Interval</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentConfigs.length > 0 ? (
                      currentConfigs.map((cfg, idx) => (
                        <tr key={cfg.id}>
                          <td style={styles.td}>{startIndex + idx + 1}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{cfg.deviceCode}</td>
                          <td style={styles.td}>
                            <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#eef2ff', color: '#4f46e5' }}>
                              {cfg.connectionType}
                            </span>
                          </td>
                          <td style={styles.td}>{cfg.ipAddress}</td>
                          <td style={styles.td}>{cfg.port}</td>
                          <td style={styles.td}>{cfg.syncInterval} min</td>
                          <td style={styles.td}>
                            <span style={styles.statusBadge(cfg.connectionStatus)}>
                              {cfg.connectionStatus === 'Connected' ? <FaCheckCircle size={12} /> : <FaExclamationCircle size={12} />}
                              {cfg.connectionStatus}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <button
                              style={styles.editBtn}
                              onClick={() => handleEdit(cfg)}
                              title="Edit Configuration"
                            >
                              <FaEdit size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          No configurations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ─── PAGINATION ────────────────────────────────── */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} configurations
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                          style={{ 
                            padding: '6px 10px', 
                            border: '1px solid #e5e7eb', 
                            background: pg === currentPage ? '#9d174d' : 'white', 
                            color: pg === currentPage ? 'white' : '#374151', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontSize: '12px', 
                            minWidth: '34px',
                            transition: 'all 0.2s ease'
                          }}
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

      {/* ─── CONFIGURATION FORM ────────────────────────────── */}
      {showForm && (
        <div style={{ ...styles.card, borderColor: '#9d174d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              {editingId ? 'Edit Configuration' : 'Add New Configuration'}
            </h4>
            <button style={styles.btnSecondary} onClick={handleBack}>
              <FaTimes size={13} /> Cancel
            </button>
          </div>

          <div style={styles.formGrid}>
            {/* Device Dropdown */}
            <div style={styles.field}>
              <label style={styles.label}>Device <span style={styles.required}>*</span></label>
              <select
                className={`config-input ${errors.deviceId && touched.deviceId ? 'error' : ''}`}
                style={styles.input}
                value={config.deviceId}
                onChange={(e) => handleChange('deviceId', e.target.value)}
                onBlur={() => handleBlur('deviceId')}
              >
                <option value="">Select Device</option>
                {registeredDevices.map(d => (
                  <option key={d.id} value={d.id}>{d.deviceCode} - {d.deviceName}</option>
                ))}
              </select>
              {errors.deviceId && touched.deviceId && <div style={styles.error}>{errors.deviceId}</div>}
            </div>

            {/* Connection Type */}
            <div style={styles.field}>
              <label style={styles.label}>Connection Type <span style={styles.required}>*</span></label>
              <select
                className={`config-input ${errors.connectionType && touched.connectionType ? 'error' : ''}`}
                style={styles.input}
                value={config.connectionType}
                onChange={(e) => handleChange('connectionType', e.target.value)}
                onBlur={() => handleBlur('connectionType')}
              >
                {connectionTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              {errors.connectionType && touched.connectionType && <div style={styles.error}>{errors.connectionType}</div>}
            </div>

            {/* IP Address */}
            <div style={styles.field}>
              <label style={styles.label}>IP Address <span style={styles.required}>*</span></label>
              <input
                type="text"
                className={`config-input ${errors.ipAddress && touched.ipAddress ? 'error' : ''}`}
                style={styles.input}
                placeholder="192.168.1.100"
                value={config.ipAddress}
                onChange={(e) => handleChange('ipAddress', e.target.value)}
                onBlur={() => handleBlur('ipAddress')}
              />
              {errors.ipAddress && touched.ipAddress && <div style={styles.error}>{errors.ipAddress}</div>}
            </div>

            {/* Port */}
            <div style={styles.field}>
              <label style={styles.label}>Port <span style={styles.required}>*</span></label>
              <input
                type="number"
                className={`config-input ${errors.port && touched.port ? 'error' : ''}`}
                style={styles.input}
                placeholder="4370"
                value={config.port}
                onChange={(e) => handleChange('port', e.target.value)}
                onBlur={() => handleBlur('port')}
              />
              {errors.port && touched.port && <div style={styles.error}>{errors.port}</div>}
            </div>

            {/* Username */}
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                className="config-input"
                style={styles.input}
                placeholder="admin"
                value={config.username}
                onChange={(e) => handleChange('username', e.target.value)}
              />
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div className="input-group-focus" style={{ ...styles.inputGroup, overflow: 'hidden' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="config-input"
                  style={{ ...styles.input, border: 'none', flex: 1 }}
                  placeholder="••••••••"
                  value={config.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
                <button
                  type="button"
                  style={{ padding: '0 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {/* Sync Interval */}
            <div style={styles.field}>
              <label style={styles.label}>Sync Interval (Minutes) <span style={styles.required}>*</span></label>
              <select
                className={`config-input ${errors.syncInterval && touched.syncInterval ? 'error' : ''}`}
                style={styles.input}
                value={config.syncInterval}
                onChange={(e) => handleChange('syncInterval', e.target.value)}
                onBlur={() => handleBlur('syncInterval')}
              >
                {syncIntervals.map(val => <option key={val} value={val}>{val} min</option>)}
              </select>
              {errors.syncInterval && touched.syncInterval && <div style={styles.error}>{errors.syncInterval}</div>}
            </div>

            {/* Connection Status */}
            <div style={styles.field}>
              <label style={styles.label}>Connection Status <span style={styles.required}>*</span></label>
              <select
                className={`config-input ${errors.connectionStatus && touched.connectionStatus ? 'error' : ''}`}
                style={styles.input}
                value={config.connectionStatus}
                onChange={(e) => handleChange('connectionStatus', e.target.value)}
                onBlur={() => handleBlur('connectionStatus')}
              >
                {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
              {errors.connectionStatus && touched.connectionStatus && <div style={styles.error}>{errors.connectionStatus}</div>}
            </div>
          </div>

          {/* ─── Buttons ────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <button
              style={{ ...styles.btnSuccess, ...(isTesting ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              <FaFlask size={13} /> {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            <button style={styles.btnPrimary} onClick={handleSave}>
              <FaSave size={13} /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceConnectionConfig;