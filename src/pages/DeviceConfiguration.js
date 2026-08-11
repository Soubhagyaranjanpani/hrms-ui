
import React, { useState } from 'react';
import {
  FaSave, FaSync, FaHistory, FaEdit,
  FaToggleOn, FaToggleOff, FaServer, FaCheckCircle,
  FaExclamationCircle, FaClock, FaWifi, FaPlug,
  FaFlask, FaPlus
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const DeviceConnectionConfig = () => {
  // ─── Dummy Data ──────────────────────────────────────────
  const registeredDevices = [
    { id: 1, deviceCode: 'DEV-001', deviceName: 'Main Gate Scanner', vendor: 'ZKTeco' },
    { id: 2, deviceCode: 'DEV-002', deviceName: 'Office Entry Device', vendor: 'eSSL' },
    { id: 3, deviceCode: 'DEV-003', deviceName: 'Back Door Scanner', vendor: 'Matrix' },
    { id: 4, deviceCode: 'DEV-004', deviceName: 'HR Department Device', vendor: 'Suprema' },
    { id: 5, deviceCode: 'DEV-005', deviceName: 'Finance Entry Scanner', vendor: 'Hikvision' },
    { id: 6, deviceCode: 'DEV-006', deviceName: 'IT Lab Device', vendor: 'Realtime' },
    { id: 7, deviceCode: 'DEV-007', deviceName: 'Sales Office Scanner', vendor: 'Mantra' },
    { id: 8, deviceCode: 'DEV-008', deviceName: 'Admin Block Device', vendor: 'ZKTeco' },
    { id: 9, deviceCode: 'DEV-009', deviceName: 'Production Gate', vendor: 'eSSL' },
    { id: 10, deviceCode: 'DEV-010', deviceName: 'Warehouse Scanner', vendor: 'Matrix' }
  ];

  // ─── Generate More Dummy Devices with Config ────────────
  const generateDummyDevices = () => {
    const configs = [];
    const connectionTypes = ['TCP/IP', 'SDK', 'REST API'];
    const protocols = ['TCP/IP', 'HTTP', 'HTTPS'];
    const syncModes = ['Automatic', 'Manual'];
    const statuses = ['Connected', 'Disconnected'];
    
    for (let i = 0; i < 15; i++) {
      const device = registeredDevices[i % registeredDevices.length];
      configs.push({
        id: i + 1,
        deviceCode: device.deviceCode,
        deviceName: device.deviceName,
        vendor: device.vendor,
        connectionType: connectionTypes[i % 3],
        ipAddress: `192.168.${Math.floor(i / 5) + 1}.${i * 10 + 100}`,
        portNumber: 4370 + i,
        communicationProtocol: protocols[i % 3],
        syncMode: syncModes[i % 2],
        syncInterval: (i % 5) + 1,
        retryCount: (i % 3) + 1,
        retryInterval: (i % 4) * 10 + 10,
        connectionTimeout: (i % 5) + 5,
        enableAutoSync: i % 2 === 0,
        lastSyncTime: i % 2 === 0 ? '2024-01-15 10:30:00' : '2024-01-14 15:20:00',
        nextSyncTime: i % 2 === 0 ? '2024-01-15 10:35:00' : 'Not scheduled',
        connectionStatus: statuses[i % 2]
      });
    }
    return configs;
  };

  // ─── States ──────────────────────────────────────────────
  const [devices, setDevices] = useState(generateDummyDevices());
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, timestamp: '2024-01-15 10:30:00', message: 'Device connected successfully', type: 'success' },
    { id: 2, timestamp: '2024-01-15 10:25:00', message: 'Sync completed - 45 records updated', type: 'info' },
    { id: 3, timestamp: '2024-01-15 10:20:00', message: 'Connection timeout, retrying...', type: 'warning' }
  ]);

  // ─── Form State ──────────────────────────────────────────
  const [config, setConfig] = useState({
    deviceId: '',
    connectionType: 'TCP/IP',
    ipAddress: '',
    portNumber: '',
    communicationProtocol: 'TCP/IP',
    syncMode: 'Automatic',
    syncInterval: 5,
    retryCount: 3,
    retryInterval: 30,
    connectionTimeout: 10,
    enableAutoSync: true,
    lastSyncTime: '',
    nextSyncTime: '',
    connectionStatus: 'Disconnected'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── Connection Options ──────────────────────────────────
  const connectionTypes = ['TCP/IP', 'SDK', 'REST API'];
  const communicationProtocols = ['TCP/IP', 'HTTP', 'HTTPS'];
  const syncModes = ['Automatic', 'Manual'];

  // ─── Pagination ──────────────────────────────────────────
  const totalItems = devices.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const currentDevices = devices.slice(startIndex, startIndex + rowsPerPage);

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

  // ─── Form Handlers ───────────────────────────────────────
  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field, config[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    const requiredFields = ['connectionType', 'ipAddress', 'portNumber', 'communicationProtocol', 'syncMode'];
    
    if (requiredFields.includes(field) && !value) {
      error = 'This field is required';
    }
    
    if (field === 'ipAddress' && value) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(value)) {
        error = 'Invalid IP address format';
      }
    }
    
    if (field === 'portNumber' && value) {
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        error = 'Port must be between 1 and 65535';
      }
    }
    
    if (field === 'syncInterval' && value) {
      const interval = parseInt(value);
      if (isNaN(interval) || interval < 1) {
        error = 'Sync interval must be at least 1 minute';
      }
    }
    
    if (field === 'connectionTimeout' && value) {
      const timeout = parseInt(value);
      if (isNaN(timeout) || timeout < 1) {
        error = 'Timeout must be at least 1 second';
      }
    }
    
    setErrors({ ...errors, [field]: error });
    return error === '';
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['connectionType', 'ipAddress', 'portNumber', 'communicationProtocol', 'syncMode'];
    
    requiredFields.forEach(field => {
      if (!config[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    if (config.ipAddress) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(config.ipAddress)) {
        newErrors.ipAddress = 'Invalid IP address format';
      }
    }
    
    if (config.portNumber) {
      const port = parseInt(config.portNumber);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.portNumber = 'Port must be between 1 and 65535';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Actions ─────────────────────────────────────────────
  const handleEdit = (device) => {
    setEditingDevice(device);
    setConfig({
      deviceId: device.id,
      connectionType: device.connectionType || 'TCP/IP',
      ipAddress: device.ipAddress || '',
      portNumber: device.portNumber || '',
      communicationProtocol: device.communicationProtocol || 'TCP/IP',
      syncMode: device.syncMode || 'Automatic',
      syncInterval: device.syncInterval || 5,
      retryCount: device.retryCount || 3,
      retryInterval: device.retryInterval || 30,
      connectionTimeout: device.connectionTimeout || 10,
      enableAutoSync: device.enableAutoSync !== undefined ? device.enableAutoSync : true,
      lastSyncTime: device.lastSyncTime || '',
      nextSyncTime: device.nextSyncTime || '',
      connectionStatus: device.connectionStatus || 'Disconnected'
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix all errors');
      return;
    }

    const device = registeredDevices.find(d => d.id === Number(config.deviceId));
    const updatedDevice = {
      id: Number(config.deviceId),
      deviceCode: device?.deviceCode || `DEV-${String(devices.length + 1).padStart(3, '0')}`,
      deviceName: device?.deviceName || 'New Device',
      vendor: device?.vendor || 'Unknown',
      ...config
    };

    if (editingDevice) {
      setDevices(devices.map(d => d.id === Number(config.deviceId) ? updatedDevice : d));
      toast.success('Success', 'Configuration updated successfully');
    } else {
      setDevices([...devices, updatedDevice]);
      toast.success('Success', 'Device configuration added successfully');
    }
    
    setShowForm(false);
    setEditingDevice(null);
    resetForm();
  };

  const resetForm = () => {
    setConfig({
      deviceId: '',
      connectionType: 'TCP/IP',
      ipAddress: '',
      portNumber: '',
      communicationProtocol: 'TCP/IP',
      syncMode: 'Automatic',
      syncInterval: 5,
      retryCount: 3,
      retryInterval: 30,
      connectionTimeout: 10,
      enableAutoSync: true,
      lastSyncTime: '',
      nextSyncTime: '',
      connectionStatus: 'Disconnected'
    });
    setErrors({});
    setTouched({});
  };

  const handleTestConnection = () => {
    if (!config.ipAddress || !config.portNumber) {
      toast.warning('Validation Error', 'Please enter IP Address and Port first');
      return;
    }

    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      const success = Math.random() > 0.3;
      if (success) {
        setConfig({ ...config, connectionStatus: 'Connected' });
        toast.success('Connection Test', 'Device connected successfully!');
        addLog('Device connection test successful', 'success');
        if (editingDevice) {
          setDevices(devices.map(d => 
            d.id === Number(config.deviceId) ? { ...d, connectionStatus: 'Connected' } : d
          ));
        }
      } else {
        setConfig({ ...config, connectionStatus: 'Disconnected' });
        toast.error('Connection Test', 'Failed to connect to device');
        addLog('Device connection test failed', 'error');
      }
    }, 2000);
  };

  const handleSyncNow = () => {
    if (config.connectionStatus !== 'Connected') {
      toast.warning('Sync Error', 'Device is not connected. Please test connection first.');
      return;
    }

    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      const formattedTime = now.toISOString().replace('T', ' ').slice(0, 19);
      const nextSync = new Date(now.getTime() + config.syncInterval * 60000).toISOString().replace('T', ' ').slice(0, 19);
      
      setConfig({ 
        ...config, 
        lastSyncTime: formattedTime,
        nextSyncTime: nextSync
      });
      toast.success('Sync Completed', 'Data synchronized successfully!');
      addLog('Manual sync completed', 'success');
    }, 2000);
  };

  const addLog = (message, type) => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);
    setLogs([{ id: Date.now(), timestamp, message, type }, ...logs]);
  };

  // ─── Styles ──────────────────────────────────────────────
  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8ecf1', marginBottom: '24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    iconBox: { width: '46px', height: '46px', background: 'linear-gradient(135deg, #9d174d, #be185d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
    field: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    required: { color: '#ef4444', marginLeft: '2px' },
    input: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', transition: 'all 0.3s ease' },
    error: { color: '#ef4444', fontSize: '11px', marginTop: '2px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' },
    td: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9' },
    btnPrimary: { padding: '8px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSecondary: { padding: '8px 20px', background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnSuccess: { padding: '8px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
    btnInfo: { padding: '8px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
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
    readOnlyField: { background: '#f1f5f9', cursor: 'not-allowed' },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .config-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .config-input.error {
          border-color: #ef4444 !important;
        }
        .config-input.error:focus {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
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
        .log-entry {
          padding: 8px 12px;
          border-left: 3px solid;
          margin-bottom: 4px;
          background: #f8fafc;
          border-radius: 4px;
        }
        .log-entry.success { border-color: #10b981; }
        .log-entry.error { border-color: #ef4444; }
        .log-entry.warning { border-color: #f59e0b; }
        .log-entry.info { border-color: #3b82f6; }
        .btn-loading {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaPlug size={20} /></div>
          <div>
            <h1 style={styles.title}>Device Connection Configuration</h1>
            <p style={styles.subtitle}>{devices.length} devices configured</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.btnInfo} onClick={() => setShowLogs(!showLogs)}>
            <FaHistory size={13} /> {showLogs ? 'Hide Logs' : 'View Logs'}
          </button>
          {!showForm && (
            <button style={styles.btnPrimary} onClick={() => { resetForm(); setShowForm(true); setEditingDevice(null); }}>
              <FaPlus size={13} /> Add Configuration
            </button>
          )}
          {showForm && (
            <button style={styles.btnSecondary} onClick={() => { setShowForm(false); setEditingDevice(null); resetForm(); }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ─── TABLE ─────────────────────────────────────────── */}
      {!showForm && (
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Device Code</th>
                  <th style={styles.th}>Device Name</th>
                  <th style={styles.th}>Vendor</th>
                  <th style={styles.th}>IP Address</th>
                  <th style={styles.th}>Port</th>
                  <th style={styles.th}>Connection Type</th>
                  <th style={styles.th}>Protocol</th>
                  <th style={styles.th}>Sync Mode</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentDevices.map((device, idx) => (
                  <tr key={device.id}>
                    <td style={styles.td}>{startIndex + idx + 1}</td>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#9d174d' }}>{device.deviceCode}</td>
                    <td style={styles.td}><strong>{device.deviceName}</strong></td>
                    <td style={styles.td}>{device.vendor}</td>
                    <td style={styles.td}>{device.ipAddress || '-'}</td>
                    <td style={styles.td}>{device.portNumber || '-'}</td>
                    <td style={styles.td}>
                      <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#eef2ff', color: '#4f46e5' }}>
                        {device.connectionType || '-'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#fce7f3', color: '#9d174d' }}>
                        {device.communicationProtocol || '-'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: device.syncMode === 'Automatic' ? '#d1fae5' : '#fef3c7', color: device.syncMode === 'Automatic' ? '#065f46' : '#92400e' }}>
                        {device.syncMode || '-'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge(device.connectionStatus)}>
                        {device.connectionStatus === 'Connected' ? <FaCheckCircle size={12} /> : <FaExclamationCircle size={12} />}
                        {device.connectionStatus || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        style={{ padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={() => handleEdit(device)}
                        title="Edit Configuration"
                      >
                        <FaEdit size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── PAGINATION ────────────────────────────────── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} devices
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
                      onMouseEnter={(e) => {
                        if (pg !== currentPage) {
                          e.currentTarget.style.background = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pg !== currentPage) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
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
        </div>
      )}

      {/* ─── CONFIGURATION FORM ────────────────────────────── */}
      {showForm && (
        <div style={{ ...styles.card, borderColor: '#9d174d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              {editingDevice ? `Edit Configuration - ${editingDevice.deviceCode}` : 'Add New Configuration'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>Status:</span>
              <span style={styles.statusBadge(config.connectionStatus)}>
                {config.connectionStatus === 'Connected' ? <FaCheckCircle size={12} /> : <FaExclamationCircle size={12} />}
                {config.connectionStatus}
              </span>
            </div>
          </div>

          <div style={styles.formGrid}>
            {/* Device Dropdown */}
            <div style={styles.field}>
              <label style={styles.label}>Device <span style={styles.required}>*</span></label>
              <select
                className="config-input"
                style={styles.input}
                value={config.deviceId}
                onChange={(e) => handleChange('deviceId', e.target.value)}
                disabled={!!editingDevice}
              >
                <option value="">Select Device</option>
                {registeredDevices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.deviceCode} - {d.deviceName} ({d.vendor})
                  </option>
                ))}
              </select>
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

            {/* Port Number */}
            <div style={styles.field}>
              <label style={styles.label}>Port Number <span style={styles.required}>*</span></label>
              <input
                type="number"
                className={`config-input ${errors.portNumber && touched.portNumber ? 'error' : ''}`}
                style={styles.input}
                placeholder="4370"
                value={config.portNumber}
                onChange={(e) => handleChange('portNumber', e.target.value)}
                onBlur={() => handleBlur('portNumber')}
              />
              {errors.portNumber && touched.portNumber && <div style={styles.error}>{errors.portNumber}</div>}
            </div>

            {/* Communication Protocol */}
            <div style={styles.field}>
              <label style={styles.label}>Communication Protocol <span style={styles.required}>*</span></label>
              <select
                className={`config-input ${errors.communicationProtocol && touched.communicationProtocol ? 'error' : ''}`}
                style={styles.input}
                value={config.communicationProtocol}
                onChange={(e) => handleChange('communicationProtocol', e.target.value)}
                onBlur={() => handleBlur('communicationProtocol')}
              >
                {communicationProtocols.map(protocol => <option key={protocol} value={protocol}>{protocol}</option>)}
              </select>
              {errors.communicationProtocol && touched.communicationProtocol && <div style={styles.error}>{errors.communicationProtocol}</div>}
            </div>

            {/* Sync Mode */}
            <div style={styles.field}>
              <label style={styles.label}>Sync Mode <span style={styles.required}>*</span></label>
              <select
                className={`config-input ${errors.syncMode && touched.syncMode ? 'error' : ''}`}
                style={styles.input}
                value={config.syncMode}
                onChange={(e) => handleChange('syncMode', e.target.value)}
                onBlur={() => handleBlur('syncMode')}
              >
                {syncModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
              </select>
              {errors.syncMode && touched.syncMode && <div style={styles.error}>{errors.syncMode}</div>}
            </div>

            {/* Sync Interval */}
            <div style={styles.field}>
              <label style={styles.label}>Sync Interval (Minutes) <span style={styles.required}>*</span></label>
              <input
                type="number"
                className={`config-input ${errors.syncInterval && touched.syncInterval ? 'error' : ''}`}
                style={styles.input}
                placeholder="5"
                value={config.syncInterval}
                onChange={(e) => handleChange('syncInterval', e.target.value)}
                onBlur={() => handleBlur('syncInterval')}
                disabled={config.syncMode === 'Manual'}
              />
              {errors.syncInterval && touched.syncInterval && <div style={styles.error}>{errors.syncInterval}</div>}
            </div>

            {/* Retry Count */}
            <div style={styles.field}>
              <label style={styles.label}>Retry Count</label>
              <input
                type="number"
                className="config-input"
                style={styles.input}
                placeholder="3"
                value={config.retryCount}
                onChange={(e) => handleChange('retryCount', e.target.value)}
              />
            </div>

            {/* Retry Interval */}
            <div style={styles.field}>
              <label style={styles.label}>Retry Interval (Seconds)</label>
              <input
                type="number"
                className="config-input"
                style={styles.input}
                placeholder="30"
                value={config.retryInterval}
                onChange={(e) => handleChange('retryInterval', e.target.value)}
              />
            </div>

            {/* Connection Timeout */}
            <div style={styles.field}>
              <label style={styles.label}>Connection Timeout (Seconds) <span style={styles.required}>*</span></label>
              <input
                type="number"
                className={`config-input ${errors.connectionTimeout && touched.connectionTimeout ? 'error' : ''}`}
                style={styles.input}
                placeholder="10"
                value={config.connectionTimeout}
                onChange={(e) => handleChange('connectionTimeout', e.target.value)}
                onBlur={() => handleBlur('connectionTimeout')}
              />
              {errors.connectionTimeout && touched.connectionTimeout && <div style={styles.error}>{errors.connectionTimeout}</div>}
            </div>

            {/* Enable Auto Sync - Toggle */}
            <div style={styles.field}>
              <label style={styles.label}>Enable Auto Sync</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <button
                  className={`toggle-switch ${config.enableAutoSync ? 'active' : 'inactive'}`}
                  onClick={() => handleChange('enableAutoSync', !config.enableAutoSync)}
                />
                <span style={{ fontSize: '13px', fontWeight: '500', color: config.enableAutoSync ? '#065f46' : '#991b1b' }}>
                  {config.enableAutoSync ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Last Sync Time - Read Only */}
            <div style={styles.field}>
              <label style={styles.label}>Last Sync Time</label>
              <div style={{ ...styles.input, ...styles.readOnlyField, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaClock size={14} style={{ color: '#94a3b8' }} />
                <span>{config.lastSyncTime || 'Never'}</span>
              </div>
            </div>

            {/* Next Sync Time - Read Only */}
            <div style={styles.field}>
              <label style={styles.label}>Next Sync Time</label>
              <div style={{ ...styles.input, ...styles.readOnlyField, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaClock size={14} style={{ color: '#94a3b8' }} />
                <span>{config.nextSyncTime || 'Not scheduled'}</span>
              </div>
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
            <button 
              style={{ ...styles.btnInfo, ...(isSyncing ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
              onClick={handleSyncNow}
              disabled={isSyncing}
            >
              <FaSync size={13} /> {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button style={styles.btnPrimary} onClick={handleSave}>
              <FaSave size={13} /> Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* ─── LOGS SECTION ──────────────────────────────────── */}
      {showLogs && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              <FaHistory size={14} style={{ marginRight: '8px' }} />
              Connection Logs
            </h4>
            <button 
              style={styles.btnSecondary}
              onClick={() => setLogs([])}
            >
              Clear Logs
            </button>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <p>No logs available</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`log-entry ${log.type}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>{log.message}</span>
                    <span style={{ color: '#94a3b8' }}>{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceConnectionConfig; 