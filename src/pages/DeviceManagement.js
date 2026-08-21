import React, { useState } from 'react';
import {
  FaSave, FaEdit, FaPlus, FaArrowLeft, FaServer,
  FaSearch, FaFilter
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const DeviceManagement = () => {
  // ─── Dummy Data ──────────────────────────────────────────
  const dummyDevices = [
    { id: 1, deviceCode: 'DEV-001', deviceName: 'Main Gate Scanner', deviceType: 'Fingerprint', manufacturer: 'ZKTeco', model: 'ZK-4500', serialNumber: 'SN-2024-001', ipAddress: '192.168.1.100', port: '4370', status: true },
    { id: 2, deviceCode: 'DEV-002', deviceName: 'Office Entry Device', deviceType: 'Face Recognition', manufacturer: 'eSSL', model: 'eSSL-2000', serialNumber: 'SN-2024-002', ipAddress: '192.168.1.101', port: '8080', status: true },
    { id: 3, deviceCode: 'DEV-003', deviceName: 'Back Door Scanner', deviceType: 'RFID Card', manufacturer: 'Matrix', model: 'MTX-3000', serialNumber: 'SN-2024-003', ipAddress: '192.168.1.102', port: '4370', status: false },
    { id: 4, deviceCode: 'DEV-004', deviceName: 'HR Department Device', deviceType: 'Face + Fingerprint', manufacturer: 'Suprema', model: 'SUP-1000', serialNumber: 'SN-2024-004', ipAddress: '192.168.1.103', port: '4370', status: true },
    { id: 5, deviceCode: 'DEV-005', deviceName: 'Finance Entry Scanner', deviceType: 'Face Recognition', manufacturer: 'Hikvision', model: 'HIK-5000', serialNumber: 'SN-2024-005', ipAddress: '192.168.1.104', port: '8080', status: false }
  ];

  // ─── States ──────────────────────────────────────────────
  const [devices, setDevices] = useState(dummyDevices);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, name: "", newStatus: "" });
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Form State ───────────────────────────────────────────
  const [formData, setFormData] = useState({
    deviceCode: '',
    deviceName: '',
    deviceType: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    ipAddress: '',
    port: '',
    status: true
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── Dropdown Options ────────────────────────────────────
  const deviceTypes = ['Fingerprint', 'Face Recognition', 'Face + Fingerprint', 'Palm Recognition', 'RFID Card', 'QR Code'];
  const manufacturers = ['ZKTeco', 'eSSL', 'Matrix', 'Suprema', 'Hikvision', 'Realtime', 'Mantra', 'Others'];

  // ─── Generate Device Code ─────────────────────────────
  const generateDeviceCode = () => {
    const count = devices.length + 1;
    return `DEV-${String(count).padStart(3, '0')}`;
  };

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
    const requiredFields = ['deviceName', 'deviceType', 'manufacturer', 'model', 'serialNumber', 'ipAddress', 'port'];
    if (requiredFields.includes(field) && !value) {
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
    setErrors({ ...errors, [field]: error });
    return error === '';
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['deviceName', 'deviceType', 'manufacturer', 'model', 'serialNumber', 'ipAddress', 'port'];
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    if (formData.ipAddress) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(formData.ipAddress)) {
        newErrors.ipAddress = 'Invalid IP address format';
      }
    }
    if (formData.port) {
      const port = parseInt(formData.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.port = 'Port must be between 1 and 65535';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }
    if (editingDevice) {
      setDevices(devices.map(d => d.id === editingDevice.id ? { ...formData, id: d.id, deviceCode: d.deviceCode } : d));
      toast.success('Success', 'Device updated successfully');
    } else {
      const newDevice = { id: Date.now(), ...formData, deviceCode: generateDeviceCode() };
      setDevices([...devices, newDevice]);
      toast.success('Success', 'Device registered successfully');
    }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({ deviceCode: '', deviceName: '', deviceType: '', manufacturer: '', model: '', serialNumber: '', ipAddress: '', port: '', status: true });
    setErrors({});
    setTouched({});
    setEditingDevice(null);
  };

  // ─── Edit ──────────────────────────────────────────────────
  const handleEdit = (device) => {
    setEditingDevice(device);
    setFormData(device);
    setShowForm(true);
  };

  // ─── Status Toggle ──────────────────────────────────────
  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({ id, name, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;
    setDevices(devices.map(d => d.id === id ? { ...d, status: newStatus === 'Active' } : d));
    setShowStatusModal(false);
    toast.success('Status Updated', `${statusAction.name} is now ${newStatus}`);
  };

  // ─── Filter Logic ──────────────────────────────────────
  const filteredDevices = devices.filter(device => {
    const search = searchTerm.toLowerCase();
    return device.deviceCode.toLowerCase().includes(search) ||
           device.deviceName.toLowerCase().includes(search) ||
           device.manufacturer.toLowerCase().includes(search) ||
           device.model.toLowerCase().includes(search) ||
           device.deviceType.toLowerCase().includes(search) ||
           device.serialNumber.toLowerCase().includes(search) ||
           device.ipAddress.toLowerCase().includes(search);
  });

  // ─── Pagination ──────────────────────────────────────────
  const totalItems = filteredDevices.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const currentDevices = filteredDevices.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => {
    const delta = 2, range = [];
    const left = Math.max(0, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
    setFormData({ ...formData, deviceCode: generateDeviceCode() });
  };

  // ─── Styles ──────────────────────────────────────────────
  const styles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8ecf1' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
    iconBox: { width: '46px', height: '46px', background: 'linear-gradient(135deg, #9d174d, #be185d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
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
    btnWarning: { padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' },
    searchBox: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
    searchInput: { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', flex: '1', minWidth: '200px', transition: 'all 0.3s ease' },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .device-input:focus { border-color: #9d174d !important; box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important; }
        .device-input.error { border-color: #ef4444 !important; }
        .device-input.error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .toggle-switch { width: 28px; height: 16px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; position: relative; border: none; }
        .toggle-switch::after { content: ''; position: absolute; width: 12px; height: 12px; border-radius: 50%; background: white; top: 2px; left: 2px; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .toggle-switch.active { background: #9d174d; }
        .toggle-switch.active::after { left: 14px; }
        .toggle-switch.inactive { background: #cbd5e1; }
        .toggle-switch.inactive::after { left: 2px; }
        .emp-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .emp-modal { background: white; border-radius: 20px; padding: 32px 40px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .emp-modal-icon { font-size: 48px; margin-bottom: 16px; }
        .emp-modal-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
        .emp-modal-body { font-size: 14px; color: #475569; margin: 0 0 4px 0; }
        .emp-modal-warn { font-size: 13px; color: #94a3b8; margin: 0 0 20px 0; }
        .emp-modal-actions { display: flex; gap: 12px; justify-content: center; }
        .emp-modal-cancel { padding: 10px 24px; background: #e2e8f0; color: #374151; border: none; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; }
        .emp-modal-cancel:hover { background: #cbd5e1; }
        .emp-modal-confirm { padding: 10px 24px; background: #9d174d; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; }
        .emp-modal-confirm:hover { background: #7a0e3a; }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .card-hover:hover { background: #f8fafc; transition: all 0.2s ease; }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaServer size={20} /></div>
          <div>
            <h1 style={styles.title}>Device Management</h1>
            <p style={styles.subtitle}>{devices.length} devices registered</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!showForm && (
            <button style={styles.btnPrimary} onClick={openForm}>
              <FaPlus size={13} /> Register Device
            </button>
          )}
          {showForm && (
            <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>
              <FaArrowLeft size={13} /> Back to List
            </button>
          )}
        </div>
      </div>

      {/* ─── SEARCH BAR ────────────────────────────────────── */}
      {!showForm && (
        <div style={{ ...styles.card, marginBottom: '16px' }}>
          <div style={styles.searchBox}>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search by code, name, type, manufacturer, model, serial number or IP..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
            <button 
              style={{ ...styles.btnSecondary, padding: '8px 16px' }}
              onClick={() => { setSearchTerm(''); setCurrentPage(0); }}
            >
              <FaFilter size={12} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* ─── TABLE ─────────────────────────────────────────── */}
      {!showForm ? (
        <div style={styles.card}>
          {filteredDevices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FaServer size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No devices found</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Device Code</th>
                      <th style={styles.th}>Device Name</th>
                      <th style={styles.th}>Device Type</th>
                      <th style={styles.th}>Manufacturer</th>
                      <th style={styles.th}>Model</th>
                      <th style={styles.th}>Serial Number</th>
                      <th style={styles.th}>IP Address</th>
                      <th style={styles.th}>Port</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, textAlign: 'center', width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDevices.length > 0 ? (
                      currentDevices.map((device, idx) => (
                        <tr key={device.id} className="card-hover">
                          <td style={styles.td}>{startIndex + idx + 1}</td>
                          <td style={{ ...styles.td, fontWeight: '600', color: '#9d174d' }}>{device.deviceCode}</td>
                          <td style={styles.td}><strong>{device.deviceName}</strong></td>
                          <td style={styles.td}>
                            <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#eef2ff', color: '#4f46e5' }}>
                              {device.deviceType}
                            </span>
                          </td>
                          <td style={styles.td}>{device.manufacturer}</td>
                          <td style={styles.td}>{device.model}</td>
                          <td style={styles.td}>{device.serialNumber}</td>
                          <td style={styles.td}>{device.ipAddress}</td>
                          <td style={styles.td}>{device.port}</td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button
                                className={`toggle-switch ${device.status ? 'active' : 'inactive'}`}
                                onClick={() => handleStatusToggle(device.id, device.deviceName, device.status ? 'Active' : 'Inactive')}
                              />
                              <span style={{ fontSize: '12px', fontWeight: '500', color: device.status ? '#065f46' : '#991b1b' }}>
                                {device.status ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <button style={styles.btnWarning} onClick={() => handleEdit(device)} title="Edit">
                              <FaEdit size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                          <p>No devices found</p>
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
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} devices
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
      ) : (
        // ─── FORM ──────────────────────────────────────────────
        <div style={{ ...styles.card, borderColor: '#9d174d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              {editingDevice ? 'Edit Device' : 'Register New Device'}
            </h4>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required</span>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Device Code</label>
              <input type="text" style={{ ...styles.input, background: '#f1f5f9', cursor: 'not-allowed' }} value={formData.deviceCode || generateDeviceCode()} readOnly disabled />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Device Name <span style={styles.required}>*</span></label>
              <input type="text" className={`device-input ${errors.deviceName && touched.deviceName ? 'error' : ''}`} style={styles.input} placeholder="e.g., Main Gate Scanner" value={formData.deviceName} onChange={(e) => handleChange('deviceName', e.target.value)} onBlur={() => handleBlur('deviceName')} />
              {errors.deviceName && touched.deviceName && <div style={styles.error}>{errors.deviceName}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Device Type <span style={styles.required}>*</span></label>
              <select className={`device-input ${errors.deviceType && touched.deviceType ? 'error' : ''}`} style={styles.input} value={formData.deviceType} onChange={(e) => handleChange('deviceType', e.target.value)} onBlur={() => handleBlur('deviceType')}>
                <option value="">Select Device Type</option>
                {deviceTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
              {errors.deviceType && touched.deviceType && <div style={styles.error}>{errors.deviceType}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Manufacturer <span style={styles.required}>*</span></label>
              <select className={`device-input ${errors.manufacturer && touched.manufacturer ? 'error' : ''}`} style={styles.input} value={formData.manufacturer} onChange={(e) => handleChange('manufacturer', e.target.value)} onBlur={() => handleBlur('manufacturer')}>
                <option value="">Select Manufacturer</option>
                {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.manufacturer && touched.manufacturer && <div style={styles.error}>{errors.manufacturer}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Model <span style={styles.required}>*</span></label>
              <input type="text" className={`device-input ${errors.model && touched.model ? 'error' : ''}`} style={styles.input} placeholder="e.g., ZK-4500" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} onBlur={() => handleBlur('model')} />
              {errors.model && touched.model && <div style={styles.error}>{errors.model}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Serial Number <span style={styles.required}>*</span></label>
              <input type="text" className={`device-input ${errors.serialNumber && touched.serialNumber ? 'error' : ''}`} style={styles.input} placeholder="e.g., SN-2024-001" value={formData.serialNumber} onChange={(e) => handleChange('serialNumber', e.target.value)} onBlur={() => handleBlur('serialNumber')} />
              {errors.serialNumber && touched.serialNumber && <div style={styles.error}>{errors.serialNumber}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>IP Address <span style={styles.required}>*</span></label>
              <input type="text" className={`device-input ${errors.ipAddress && touched.ipAddress ? 'error' : ''}`} style={styles.input} placeholder="192.168.1.100" value={formData.ipAddress} onChange={(e) => handleChange('ipAddress', e.target.value)} onBlur={() => handleBlur('ipAddress')} />
              {errors.ipAddress && touched.ipAddress && <div style={styles.error}>{errors.ipAddress}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Port <span style={styles.required}>*</span></label>
              <input type="number" className={`device-input ${errors.port && touched.port ? 'error' : ''}`} style={styles.input} placeholder="4370" value={formData.port} onChange={(e) => handleChange('port', e.target.value)} onBlur={() => handleBlur('port')} />
              {errors.port && touched.port && <div style={styles.error}>{errors.port}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>Cancel</button>
            <button style={styles.btnSecondary} onClick={resetForm}>Reset</button>
            <button style={styles.btnPrimary} onClick={handleSubmit}>
              <FaSave size={13} /> {editingDevice ? 'Update Device' : 'Register Device'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Status Modal ────────────────────────────────── */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">{statusAction.newStatus === "Active" ? "✅" : "⛔"}</div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">Are you sure you want to <strong>{statusAction.newStatus === "Active" ? "activate" : "deactivate"}</strong> <strong>{statusAction.name}</strong>?</p>
            <p className="emp-modal-warn">{statusAction.newStatus === "Inactive" ? "Inactive devices cannot be used for attendance marking." : "This device will become available for attendance."}</p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;