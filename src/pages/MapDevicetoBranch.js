import React, { useState } from 'react';
import {
  FaSave, FaEdit, FaPlus, FaArrowLeft, FaMapMarkerAlt,
  FaBuilding, FaUsers, FaCalendarAlt,
  FaServer, FaCheckCircle, FaTrash,
  FaExclamationCircle, FaSearch, FaFilter
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const MapDeviceToBranch = () => {
  // ─── Dummy Data ──────────────────────────────────────────
  const [deviceMappings, setDeviceMappings] = useState([
    {
      id: 1,
      deviceId: 1,
      deviceCode: 'DEV-001',
      deviceName: 'Main Gate Scanner',
      branch: 'Noida',
      departments: ['IT', 'Operations'],
      effectiveDate: '2024-01-01',
      isActive: true,
      status: 'Active'
    },
    {
      id: 2,
      deviceId: 2,
      deviceCode: 'DEV-002',
      deviceName: 'Office Entry Device',
      branch: 'Delhi',
      departments: ['HR', 'Admin'],
      effectiveDate: '2024-01-15',
      isActive: true,
      status: 'Active'
    },
    {
      id: 3,
      deviceId: 3,
      deviceCode: 'DEV-003',
      deviceName: 'Back Door Scanner',
      branch: 'Gurgaon',
      departments: ['Sales', 'Marketing'],
      effectiveDate: '2024-01-10',
      isActive: false,
      status: 'Inactive'
    },
    {
      id: 4,
      deviceId: 4,
      deviceCode: 'DEV-004',
      deviceName: 'HR Department Device',
      branch: 'Mumbai',
      departments: ['HR', 'Finance'],
      effectiveDate: '2024-02-01',
      isActive: true,
      status: 'Active'
    },
    {
      id: 5,
      deviceId: 5,
      deviceCode: 'DEV-005',
      deviceName: 'Finance Entry Scanner',
      branch: 'Bangalore',
      departments: ['Finance', 'Accounts'],
      effectiveDate: '2024-02-15',
      isActive: false,
      status: 'Inactive'
    },
    {
      id: 6,
      deviceId: 6,
      deviceCode: 'DEV-006',
      deviceName: 'IT Lab Device',
      branch: 'Pune',
      departments: ['IT', 'Operations'],
      effectiveDate: '2024-03-01',
      isActive: true,
      status: 'Active'
    }
  ]);

  // ─── Dropdown Options ────────────────────────────────────
  const registeredDevices = [
    { id: 1, deviceCode: 'DEV-001', deviceName: 'Main Gate Scanner', vendor: 'ZKTeco' },
    { id: 2, deviceCode: 'DEV-002', deviceName: 'Office Entry Device', vendor: 'eSSL' },
    { id: 3, deviceCode: 'DEV-003', deviceName: 'Back Door Scanner', vendor: 'Matrix' },
    { id: 4, deviceCode: 'DEV-004', deviceName: 'HR Department Device', vendor: 'Suprema' },
    { id: 5, deviceCode: 'DEV-005', deviceName: 'Finance Entry Scanner', vendor: 'Hikvision' },
    { id: 6, deviceCode: 'DEV-006', deviceName: 'IT Lab Device', vendor: 'Realtime' }
  ];

  const branches = ['Noida', 'Delhi', 'Gurgaon', 'Mumbai', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad'];
  const departments = ['HR', 'Finance', 'IT', 'Operations', 'Sales', 'Marketing', 'Admin', 'Production'];

  // ─── States ──────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Form State ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    deviceId: '',
    branch: '',
    departments: [],
    effectiveDate: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── Filter Logic ──────────────────────────────────────
  const filteredMappings = deviceMappings.filter(mapping => {
    const search = searchTerm.toLowerCase();
    return mapping.deviceCode.toLowerCase().includes(search) ||
           mapping.deviceName.toLowerCase().includes(search) ||
           mapping.branch.toLowerCase().includes(search) ||
           mapping.departments.some(dept => dept.toLowerCase().includes(search)) ||
           mapping.status.toLowerCase().includes(search);
  });

  // ─── Pagination ──────────────────────────────────────────
  const totalItems = filteredMappings.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const currentMappings = filteredMappings.slice(startIndex, startIndex + rowsPerPage);

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
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleMultiSelect = (department) => {
    const currentDepts = formData.departments || [];
    const updatedDepts = currentDepts.includes(department)
      ? currentDepts.filter(d => d !== department)
      : [...currentDepts, department];
    setFormData({ ...formData, departments: updatedDepts });
    if (touched.departments) {
      validateField('departments', updatedDepts);
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    const requiredFields = ['deviceId', 'branch', 'effectiveDate'];
    
    if (requiredFields.includes(field) && !value) {
      error = 'This field is required';
    }
    
    if (field === 'departments' && (!value || value.length === 0)) {
      error = 'Select at least one department';
    }
    
    setErrors({ ...errors, [field]: error });
    return error === '';
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['deviceId', 'branch', 'effectiveDate'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    if (!formData.departments || formData.departments.length === 0) {
      newErrors.departments = 'Select at least one department';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit Handler ──────────────────────────────────────
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }

    const device = registeredDevices.find(d => d.id === Number(formData.deviceId));

    if (editingMapping) {
      setDeviceMappings(deviceMappings.map(m => 
        m.id === editingMapping.id 
          ? { ...formData, id: m.id, deviceCode: device?.deviceCode, deviceName: device?.deviceName, status: formData.isActive ? 'Active' : 'Inactive' } 
          : m
      ));
      toast.success('Success', 'Device mapping updated successfully');
    } else {
      const newMapping = {
        id: Date.now(),
        ...formData,
        deviceCode: device?.deviceCode || `DEV-${String(deviceMappings.length + 1).padStart(3, '0')}`,
        deviceName: device?.deviceName || 'New Device',
        status: formData.isActive ? 'Active' : 'Inactive'
      };
      setDeviceMappings([...deviceMappings, newMapping]);
      toast.success('Success', 'Device mapped to branch successfully');
    }
    resetForm();
    setShowForm(false);
  };

  // ─── Reset Form ──────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      deviceId: '',
      branch: '',
      departments: [],
      effectiveDate: '',
      isActive: true
    });
    setErrors({});
    setTouched({});
    setEditingMapping(null);
  };

  // ─── Edit Handler ────────────────────────────────────────
  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      deviceId: mapping.deviceId,
      branch: mapping.branch,
      departments: mapping.departments || [],
      effectiveDate: mapping.effectiveDate,
      isActive: mapping.isActive
    });
    setShowForm(true);
  };

  // ─── Status Toggle ──────────────────────────────────────
  const handleStatusToggle = (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setDeviceMappings(deviceMappings.map(m =>
      m.id === id ? { ...m, isActive: newStatus === 'Active', status: newStatus } : m
    ));
    toast.success('Status Updated', `Device is now ${newStatus}`);
  };

  // ─── Open Form ──────────────────────────────────────────
  const openForm = () => {
    resetForm();
    setShowForm(true);
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
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
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
    btnWarning: { padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' },
    chip: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#eef2ff', color: '#4f46e5', marginRight: '4px', display: 'inline-block' },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .map-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .map-input.error {
          border-color: #ef4444 !important;
        }
        .map-input.error:focus {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
        }
        .toggle-switch {
          width: 28px;
          height: 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          border: none;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
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
          left: 14px;
        }
        .toggle-switch.inactive {
          background: #cbd5e1;
        }
        .toggle-switch.inactive::after {
          left: 2px;
        }
        .department-chip {
          display: inline-block;
          padding: 4px 12px;
          margin: 2px 4px 2px 0;
          background: #eef2ff;
          color: #4f46e5;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .department-chip.selected {
          background: #9d174d;
          color: white;
          border-color: #9d174d;
        }
        .department-chip:hover {
          transform: scale(1.05);
        }
        .search-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconBox}><FaMapMarkerAlt size={20} /></div>
          <div>
            <h1 style={styles.title}>Map Device to Branch</h1>
            <p style={styles.subtitle}>{deviceMappings.length} devices mapped</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!showForm && (
            <button style={styles.btnPrimary} onClick={openForm}>
              <FaPlus size={13} /> Map Device
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
              className="search-input"
              style={styles.searchInput}
              type="text"
              placeholder="Search by device code, name, branch, department or status..."
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

      {/* ─── FORM SECTION ────────────────────────────────── */}
      {showForm && (
        <div style={{ ...styles.card, marginBottom: '24px', borderColor: '#9d174d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              {editingMapping ? 'Edit Mapping' : 'Map Device to Branch'}
            </h4>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required</span>
          </div>

          <div style={styles.formGrid}>
            {/* Device Dropdown */}
            <div style={styles.field}>
              <label style={styles.label}>Device <span style={styles.required}>*</span></label>
              <select
                className={`map-input ${errors.deviceId && touched.deviceId ? 'error' : ''}`}
                style={styles.input}
                value={formData.deviceId}
                onChange={(e) => handleChange('deviceId', e.target.value)}
                onBlur={() => handleBlur('deviceId')}
                disabled={!!editingMapping}
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

            {/* Branch Dropdown */}
            <div style={styles.field}>
              <label style={styles.label}>Branch <span style={styles.required}>*</span></label>
              <select
                className={`map-input ${errors.branch && touched.branch ? 'error' : ''}`}
                style={styles.input}
                value={formData.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                onBlur={() => handleBlur('branch')}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              {errors.branch && touched.branch && <div style={styles.error}>{errors.branch}</div>}
            </div>

            {/* Department - Multi-select */}
            <div style={styles.field}>
              <label style={styles.label}>Department <span style={styles.required}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px', border: `1.5px solid ${errors.departments && touched.departments ? '#ef4444' : '#e2e8f0'}`, borderRadius: '8px', minHeight: '44px' }}>
                {departments.map(dept => (
                  <span
                    key={dept}
                    className={`department-chip ${formData.departments && formData.departments.includes(dept) ? 'selected' : ''}`}
                    onClick={() => handleMultiSelect(dept)}
                  >
                    {dept}
                  </span>
                ))}
              </div>
              {errors.departments && touched.departments && <div style={styles.error}>{errors.departments}</div>}
            </div>

            {/* Effective Date */}
            <div style={styles.field}>
              <label style={styles.label}>Effective Date <span style={styles.required}>*</span></label>
              <input
                type="date"
                className={`map-input ${errors.effectiveDate && touched.effectiveDate ? 'error' : ''}`}
                style={styles.input}
                value={formData.effectiveDate}
                onChange={(e) => handleChange('effectiveDate', e.target.value)}
                onBlur={() => handleBlur('effectiveDate')}
              />
              {errors.effectiveDate && touched.effectiveDate && <div style={styles.error}>{errors.effectiveDate}</div>}
            </div>
          </div>

          {/* ─── Form Actions ────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>
              Cancel
            </button>
            <button style={styles.btnSecondary} onClick={resetForm}>
              Reset
            </button>
            <button style={styles.btnPrimary} onClick={handleSubmit}>
              <FaSave size={13} /> {editingMapping ? 'Update Mapping' : 'Map Device'}
            </button>
          </div>
        </div>
      )}

      {/* ─── TABLE ─────────────────────────────────────────── */}
      {!showForm && (
        <div style={styles.card}>
          {filteredMappings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FaMapMarkerAlt size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No devices found</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>Try adjusting your search criteria</p>
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
                      <th style={styles.th}>Branch</th>
                      <th style={styles.th}>Departments</th>
                      <th style={styles.th}>Effective Date</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, textAlign: 'center', width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMappings.length > 0 ? (
                      currentMappings.map((mapping, idx) => (
                        <tr key={mapping.id} style={{ transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={styles.td}>{startIndex + idx + 1}</td>
                          <td style={{ ...styles.td, fontWeight: '600', color: '#9d174d' }}>{mapping.deviceCode}</td>
                          <td style={styles.td}><strong>{mapping.deviceName}</strong></td>
                          <td style={styles.td}>
                            <span style={{ ...styles.chip, background: '#d1fae5', color: '#059669' }}>
                              <FaBuilding size={10} style={{ marginRight: '4px' }} />
                              {mapping.branch}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {mapping.departments && mapping.departments.map(dept => (
                              <span key={dept} style={styles.chip}>
                                <FaUsers size={10} style={{ marginRight: '4px' }} />
                                {dept}
                              </span>
                            ))}
                          </td>
                          <td style={styles.td}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaCalendarAlt size={12} style={{ color: '#94a3b8' }} />
                              {new Date(mapping.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button
                                className={`toggle-switch ${mapping.isActive ? 'active' : 'inactive'}`}
                                onClick={() => handleStatusToggle(mapping.id, mapping.status)}
                              />
                              <span style={{ fontSize: '12px', fontWeight: '500', color: mapping.isActive ? '#065f46' : '#991b1b' }}>
                                {mapping.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <button
                              style={styles.btnWarning}
                              onClick={() => handleEdit(mapping)}
                              title="Edit"
                            >
                              <FaEdit size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                          <p>No mappings found</p>
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
                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} mappings
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

export default MapDeviceToBranch;