
// import React, { useState } from 'react';
// import {
//   FaSave, FaEdit, FaPlus, FaArrowLeft,
//   FaToggleOn, FaToggleOff, FaServer
// } from 'react-icons/fa';
// import { toast } from '../components/Toast';

// const DeviceManagement = () => {
//   // ─── States ──────────────────────────────────────────────
//   const [devices, setDevices] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const [editingDevice, setEditingDevice] = useState(null);
//   const [currentPage, setCurrentPage] = useState(0);
//   const [rowsPerPage] = useState(5);
//   const [showStatusModal, setShowStatusModal] = useState(false);
//   const [statusAction, setStatusAction] = useState({
//     id: null,
//     name: "",
//     newStatus: ""
//   });

//   // ─── Form State ───────────────────────────────────────────
//   const [formData, setFormData] = useState({
//     deviceCode: '',
//     deviceName: '',
//     vendor: '',
//     model: '',
//     serialNumber: '',
//     deviceType: '',
//     branch: '',
//     installationLocation: '',
//     status: true,
//     remarks: '',
//   });

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});

//   // ─── Dropdown Options ────────────────────────────────────
//   const vendors = ['ZKTeco', 'eSSL', 'Matrix', 'Suprema', 'Hikvision', 'Realtime', 'Mantra', 'Others'];
//   const deviceTypes = ['Fingerprint', 'Face Recognition', 'Face + Fingerprint', 'Palm Recognition', 'RFID Card', 'QR Code'];
//   const branches = ['Noida', 'Delhi', 'Gurgaon', 'Mumbai', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad'];

//   // ─── Device Code Generation ─────────────────────────────
//   const generateDeviceCode = () => {
//     const count = devices.length + 1;
//     return `DEV-${String(count).padStart(3, '0')}`;
//   };

//   // ─── Form Handlers ───────────────────────────────────────
//   const handleChange = (field, value) => {
//     setFormData({ ...formData, [field]: value });
//     if (touched[field]) {
//       validateField(field, value);
//     }
//   };

//   const handleBlur = (field) => {
//     setTouched({ ...touched, [field]: true });
//     validateField(field, formData[field]);
//   };

//   const validateField = (field, value) => {
//     let error = '';
//     const requiredFields = ['deviceName', 'vendor', 'model', 'serialNumber', 'deviceType', 'branch', 'installationLocation'];
    
//     if (requiredFields.includes(field) && !value) {
//       error = 'This field is required';
//     }
    
//     setErrors({ ...errors, [field]: error });
//     return error === '';
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     const requiredFields = ['deviceName', 'vendor', 'model', 'serialNumber', 'deviceType', 'branch', 'installationLocation'];
    
//     requiredFields.forEach(field => {
//       if (!formData[field]) {
//         newErrors[field] = 'This field is required';
//       }
//     });
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // ─── Submit Handler ──────────────────────────────────────
//   const handleSubmit = () => {
//     if (!validateForm()) {
//       toast.warning('Validation Error', 'Please fill all required fields');
//       return;
//     }

//     if (editingDevice) {
//       setDevices(devices.map(d => d.id === editingDevice.id ? { ...formData, id: d.id, deviceCode: d.deviceCode } : d));
//       toast.success('Success', 'Device updated successfully');
//     } else {
//       const newDevice = {
//         id: Date.now(),
//         ...formData,
//         deviceCode: generateDeviceCode(),
//       };
//       setDevices([...devices, newDevice]);
//       toast.success('Success', 'Device registered successfully');
//     }
//     resetForm();
//     setShowForm(false);
//   };

//   // ─── Reset Form ──────────────────────────────────────────
//   const resetForm = () => {
//     setFormData({
//       deviceCode: '',
//       deviceName: '',
//       vendor: '',
//       model: '',
//       serialNumber: '',
//       deviceType: '',
//       branch: '',
//       installationLocation: '',
//       status: true,
//       remarks: '',
//     });
//     setErrors({});
//     setTouched({});
//     setEditingDevice(null);
//   };

//   // ─── Edit Handler ────────────────────────────────────────
//   const handleEdit = (device) => {
//     setEditingDevice(device);
//     setFormData(device);
//     setShowForm(true);
//   };

//   // ─── Status Toggle with Modal ──────────────────────────
//   const handleStatusToggle = (id, name, currentStatus) => {
//     const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
//     setStatusAction({
//       id,
//       name,
//       newStatus
//     });
//     setShowStatusModal(true);
//   };

//   const confirmStatusChange = () => {
//     const { id, newStatus } = statusAction;
//     setDevices(devices.map(d => 
//       d.id === id ? { ...d, status: newStatus === 'Active' } : d
//     ));
//     setShowStatusModal(false);
//     toast.success('Status Updated', `${statusAction.name} is now ${newStatus}`);
//   };

//   // ─── Pagination ──────────────────────────────────────────
//   const totalItems = devices.length;
//   const totalPages = Math.ceil(totalItems / rowsPerPage);
//   const startIndex = currentPage * rowsPerPage;
//   const currentDevices = devices.slice(startIndex, startIndex + rowsPerPage);

//   const getPaginationRange = () => {
//     const delta = 2;
//     const range = [];
//     const left = Math.max(0, currentPage - delta);
//     const right = Math.min(totalPages - 1, currentPage + delta);
//     if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
//     for (let i = left; i <= right; i++) range.push(i);
//     if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
//     return range;
//   };

//   // ─── Open Form ──────────────────────────────────────────
//   const openForm = () => {
//     resetForm();
//     setShowForm(true);
//     setFormData({ ...formData, deviceCode: generateDeviceCode() });
//   };

//   // ─── Styles ──────────────────────────────────────────────
//   const styles = {
//     container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
//     card: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e8ecf1' },
//     header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
//     title: { fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 },
//     subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' },
//     iconBox: { width: '46px', height: '46px', background: 'linear-gradient(135deg, #9d174d, #be185d)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
//     formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
//     field: { display: 'flex', flexDirection: 'column', gap: '4px' },
//     label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
//     required: { color: '#ef4444', marginLeft: '2px' },
//     input: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', transition: 'all 0.3s ease' },
//     error: { color: '#ef4444', fontSize: '11px', marginTop: '2px' },
//     table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
//     th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' },
//     td: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9' },
//     btnPrimary: { padding: '8px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
//     btnSecondary: { padding: '8px 20px', background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
//     btnWarning: { padding: '6px 12px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s ease' },
//   };

//   return (
//     <div style={styles.container}>
//       <style>{`
//         .device-input:focus {
//           border-color: #9d174d !important;
//           box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
//         }
//         .device-input.error {
//           border-color: #ef4444 !important;
//         }
//         .device-input.error:focus {
//           box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
//         }
//         .toggle-switch {
//           width: 40px;
//           height: 22px;
//           border-radius: 11px;
//           cursor: pointer;
//           transition: all 0.3s ease;
//           position: relative;
//           border: none;
//         }
//         .toggle-switch::after {
//           content: '';
//           position: absolute;
//           width: 18px;
//           height: 18px;
//           border-radius: 50%;
//           background: white;
//           top: 2px;
//           left: 2px;
//           transition: all 0.3s ease;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.2);
//         }
//         .toggle-switch.active {
//           background: #9d174d;
//         }
//         .toggle-switch.active::after {
//           left: 20px;
//         }
//         .toggle-switch.inactive {
//           background: #cbd5e1;
//         }
//         .toggle-switch.inactive::after {
//           left: 2px;
//         }
//         .emp-modal-overlay {
//           position: fixed;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           background: rgba(15, 23, 42, 0.6);
//           backdrop-filter: blur(4px);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           z-index: 9999;
//         }
//         .emp-modal {
//           background: white;
//           border-radius: 20px;
//           padding: 32px 40px;
//           max-width: 420px;
//           width: 100%;
//           text-align: center;
//           box-shadow: 0 20px 60px rgba(0,0,0,0.3);
//         }
//         .emp-modal-icon { font-size: 48px; margin-bottom: 16px; }
//         .emp-modal-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
//         .emp-modal-body { font-size: 14px; color: #475569; margin: 0 0 4px 0; }
//         .emp-modal-warn { font-size: 13px; color: #94a3b8; margin: 0 0 20px 0; }
//         .emp-modal-actions { display: flex; gap: 12px; justify-content: center; }
//         .emp-modal-cancel { padding: 10px 24px; background: #e2e8f0; color: #374151; border: none; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; }
//         .emp-modal-cancel:hover { background: #cbd5e1; }
//         .emp-modal-confirm { padding: 10px 24px; background: #9d174d; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; }
//         .emp-modal-confirm:hover { background: #7a0e3a; }
//       `}</style>

//       {/* ─── HEADER ──────────────────────────────────────── */}
//       <div style={styles.header}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
//           <div style={styles.iconBox}><FaServer size={20} /></div>
//           <div>
//             <h1 style={styles.title}>Device Management</h1>
//             <p style={styles.subtitle}>{devices.length} devices registered</p>
//           </div>
//         </div>
//         <div style={{ display: 'flex', gap: '10px' }}>
//           {!showForm && (
//             <button style={styles.btnPrimary} onClick={openForm}>
//               <FaPlus size={13} /> Register Device
//             </button>
//           )}
//           {showForm && (
//             <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>
//               <FaArrowLeft size={13} /> Back to List
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ─── FORM SECTION ────────────────────────────────── */}
//       {showForm && (
//         <div style={{ ...styles.card, marginBottom: '24px', borderColor: '#9d174d' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
//             <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
//               {editingDevice ? 'Edit Device' : 'Register New Device'}
//             </h4>
//             <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required</span>
//           </div>

//           <div style={styles.formGrid}>
//             {/* Device Code */}
//             <div style={styles.field}>
//               <label style={styles.label}>Device Code</label>
//               <input
//                 type="text"
//                 style={{ ...styles.input, background: '#f1f5f9', cursor: 'not-allowed' }}
//                 value={formData.deviceCode || generateDeviceCode()}
//                 readOnly
//                 disabled
//               />
//             </div>

//             {/* Device Name */}
//             <div style={styles.field}>
//               <label style={styles.label}>Device Name <span style={styles.required}>*</span></label>
//               <input
//                 type="text"
//                 className={`device-input ${errors.deviceName && touched.deviceName ? 'error' : ''}`}
//                 style={styles.input}
//                 placeholder="e.g., Main Gate Scanner"
//                 value={formData.deviceName}
//                 onChange={(e) => handleChange('deviceName', e.target.value)}
//                 onBlur={() => handleBlur('deviceName')}
//               />
//               {errors.deviceName && touched.deviceName && <div style={styles.error}>{errors.deviceName}</div>}
//             </div>

//             {/* Vendor */}
//             <div style={styles.field}>
//               <label style={styles.label}>Vendor <span style={styles.required}>*</span></label>
//               <select
//                 className={`device-input ${errors.vendor && touched.vendor ? 'error' : ''}`}
//                 style={styles.input}
//                 value={formData.vendor}
//                 onChange={(e) => handleChange('vendor', e.target.value)}
//                 onBlur={() => handleBlur('vendor')}
//               >
//                 <option value="">Select Vendor</option>
//                 {vendors.map(v => <option key={v} value={v}>{v}</option>)}
//               </select>
//               {errors.vendor && touched.vendor && <div style={styles.error}>{errors.vendor}</div>}
//             </div>

//             {/* Model */}
//             <div style={styles.field}>
//               <label style={styles.label}>Model <span style={styles.required}>*</span></label>
//               <input
//                 type="text"
//                 className={`device-input ${errors.model && touched.model ? 'error' : ''}`}
//                 style={styles.input}
//                 placeholder="e.g., ZK-4500"
//                 value={formData.model}
//                 onChange={(e) => handleChange('model', e.target.value)}
//                 onBlur={() => handleBlur('model')}
//               />
//               {errors.model && touched.model && <div style={styles.error}>{errors.model}</div>}
//             </div>

//             {/* Serial Number */}
//             <div style={styles.field}>
//               <label style={styles.label}>Serial Number <span style={styles.required}>*</span></label>
//               <input
//                 type="text"
//                 className={`device-input ${errors.serialNumber && touched.serialNumber ? 'error' : ''}`}
//                 style={styles.input}
//                 placeholder="e.g., SN-2024-001"
//                 value={formData.serialNumber}
//                 onChange={(e) => handleChange('serialNumber', e.target.value)}
//                 onBlur={() => handleBlur('serialNumber')}
//               />
//               {errors.serialNumber && touched.serialNumber && <div style={styles.error}>{errors.serialNumber}</div>}
//             </div>

//             {/* Device Type */}
//             <div style={styles.field}>
//               <label style={styles.label}>Device Type <span style={styles.required}>*</span></label>
//               <select
//                 className={`device-input ${errors.deviceType && touched.deviceType ? 'error' : ''}`}
//                 style={styles.input}
//                 value={formData.deviceType}
//                 onChange={(e) => handleChange('deviceType', e.target.value)}
//                 onBlur={() => handleBlur('deviceType')}
//               >
//                 <option value="">Select Device Type</option>
//                 {deviceTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
//               </select>
//               {errors.deviceType && touched.deviceType && <div style={styles.error}>{errors.deviceType}</div>}
//             </div>

//             {/* Branch */}
//             <div style={styles.field}>
//               <label style={styles.label}>Branch <span style={styles.required}>*</span></label>
//               <select
//                 className={`device-input ${errors.branch && touched.branch ? 'error' : ''}`}
//                 style={styles.input}
//                 value={formData.branch}
//                 onChange={(e) => handleChange('branch', e.target.value)}
//                 onBlur={() => handleBlur('branch')}
//               >
//                 <option value="">Select Branch</option>
//                 {branches.map(b => <option key={b} value={b}>{b}</option>)}
//               </select>
//               {errors.branch && touched.branch && <div style={styles.error}>{errors.branch}</div>}
//             </div>

//             {/* Installation Location */}
//             <div style={styles.field}>
//               <label style={styles.label}>Installation Location <span style={styles.required}>*</span></label>
//               <input
//                 type="text"
//                 className={`device-input ${errors.installationLocation && touched.installationLocation ? 'error' : ''}`}
//                 style={styles.input}
//                 placeholder="e.g., Reception, Main Gate"
//                 value={formData.installationLocation}
//                 onChange={(e) => handleChange('installationLocation', e.target.value)}
//                 onBlur={() => handleBlur('installationLocation')}
//               />
//               {errors.installationLocation && touched.installationLocation && <div style={styles.error}>{errors.installationLocation}</div>}
//             </div>

//             {/* Remarks */}
//             <div style={{ ...styles.field, gridColumn: 'span 2' }}>
//               <label style={styles.label}>Remarks</label>
//               <textarea
//                 style={{ ...styles.input, resize: 'vertical', minHeight: '60px' }}
//                 placeholder="Any additional notes..."
//                 value={formData.remarks}
//                 onChange={(e) => handleChange('remarks', e.target.value)}
//               />
//             </div>
//           </div>

//           {/* ─── Form Actions ────────────────────────────── */}
//           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
//             <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>
//               Cancel
//             </button>
//             <button style={styles.btnSecondary} onClick={resetForm}>
//               Reset
//             </button>
//             <button style={styles.btnPrimary} onClick={handleSubmit}>
//               <FaSave size={13} /> {editingDevice ? 'Update Device' : 'Register Device'}
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ─── TABLE ─────────────────────────────────────────── */}
//       {/* Table only show when form is NOT visible */}
//       {!showForm && (
//         <div style={styles.card}>
//           {devices.length === 0 ? (
//             <div style={{ textAlign: 'center', padding: '60px 20px' }}>
//               <FaServer size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
//               <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No devices registered yet</h3>
//               <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>Click "Register Device" to add your first device</p>
//               <button style={styles.btnPrimary} onClick={openForm}>
//                 <FaPlus size={13} /> Register Device
//               </button>
//             </div>
//           ) : (
//             <>
//               <div style={{ overflowX: 'auto' }}>
//                 <table style={styles.table}>
//                   <thead>
//                     <tr>
//                       <th style={styles.th}>#</th>
//                       <th style={styles.th}>Device Code</th>
//                       <th style={styles.th}>Device Name</th>
//                       <th style={styles.th}>Vendor</th>
//                       <th style={styles.th}>Model</th>
//                       <th style={styles.th}>Device Type</th>
//                       <th style={styles.th}>Branch</th>
//                       <th style={styles.th}>Location</th>
//                       <th style={styles.th}>Status</th>
//                       <th style={{ ...styles.th, textAlign: 'center', width: '80px' }}>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {currentDevices.length > 0 ? (
//                       currentDevices.map((device, idx) => (
//                         <tr key={device.id} style={{ transition: 'all 0.2s ease' }}
//                           onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
//                           onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
//                         >
//                           <td style={styles.td}>{startIndex + idx + 1}</td>
//                           <td style={{ ...styles.td, fontWeight: '600', color: '#9d174d' }}>{device.deviceCode}</td>
//                           <td style={styles.td}><strong>{device.deviceName}</strong></td>
//                           <td style={styles.td}>{device.vendor}</td>
//                           <td style={styles.td}>{device.model}</td>
//                           <td style={styles.td}>
//                             <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#eef2ff', color: '#4f46e5' }}>
//                               {device.deviceType}
//                             </span>
//                           </td>
//                           <td style={styles.td}>{device.branch}</td>
//                           <td style={styles.td}>{device.installationLocation}</td>
//                           {/* Status - Toggle Switch in Table */}
//                           <td style={styles.td}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                               <button
//                                 className={`toggle-switch ${device.status ? 'active' : 'inactive'}`}
//                                 onClick={() => handleStatusToggle(
//                                   device.id,
//                                   device.deviceName,
//                                   device.status ? 'Active' : 'Inactive'
//                                 )}
//                               />
//                               <span style={{ fontSize: '12px', fontWeight: '500', color: device.status ? '#065f46' : '#991b1b' }}>
//                                 {device.status ? 'Active' : 'Inactive'}
//                               </span>
//                             </div>
//                           </td>
//                           <td style={{ ...styles.td, textAlign: 'center' }}>
//                             <button
//                               style={styles.btnWarning}
//                               onClick={() => handleEdit(device)}
//                               title="Edit"
//                             >
//                               <FaEdit size={13} />
//                             </button>
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan="10" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
//                           <p>No devices found</p>
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               {/* ─── Pagination ────────────────────────────────── */}
//               {totalPages > 0 && (
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
//                   <span style={{ fontSize: '13px', color: '#6b7280' }}>
//                     Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} devices
//                   </span>
//                   <div style={{ display: 'flex', gap: '6px' }}>
//                     <button
//                       style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: currentPage === 0 ? 0.5 : 1 }}
//                       disabled={currentPage === 0}
//                       onClick={() => setCurrentPage(currentPage - 1)}
//                     >
//                       ← Prev
//                     </button>
//                     {getPaginationRange().map((pg, i) =>
//                       pg === '...' ? (
//                         <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
//                       ) : (
//                         <button
//                           key={pg}
//                           style={{ padding: '6px 10px', border: '1px solid #e5e7eb', background: pg === currentPage ? '#9d174d' : 'white', color: pg === currentPage ? 'white' : '#374151', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px' }}
//                           onClick={() => setCurrentPage(pg)}
//                         >
//                           {pg + 1}
//                         </button>
//                       )
//                     )}
//                     <button
//                       style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: currentPage + 1 >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: currentPage + 1 >= totalPages ? 0.5 : 1 }}
//                       disabled={currentPage + 1 >= totalPages}
//                       onClick={() => setCurrentPage(currentPage + 1)}
//                     >
//                       Next →
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       )}

//       {/* ─── Status Modal ────────────────────────────────── */}
//       {showStatusModal && (
//         <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
//           <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="emp-modal-icon">
//               {statusAction.newStatus === "Active" ? "✅" : "⛔"}
//             </div>
//             <h3 className="emp-modal-title">Confirm Status Change</h3>
//             <p className="emp-modal-body">
//               Are you sure you want to{" "}
//               <strong>
//                 {statusAction.newStatus === "Active" ? "activate" : "deactivate"}
//               </strong>{" "}
//               <strong>{statusAction.name}</strong>?
//             </p>
//             <p className="emp-modal-warn">
//               {statusAction.newStatus === "Inactive"
//                 ? "Inactive devices cannot be used for attendance marking."
//                 : "This device will become available for attendance."}
//             </p>
//             <div className="emp-modal-actions">
//               <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>
//                 Cancel
//               </button>
//               <button className="emp-modal-confirm" onClick={confirmStatusChange}>
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DeviceManagement;

import React, { useState } from 'react';
import {
  FaSave, FaEdit, FaPlus, FaArrowLeft,
  FaToggleOn, FaToggleOff, FaServer
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const DeviceManagement = () => {
  // ─── Dummy Data ──────────────────────────────────────────
  const dummyDevices = [
    {
      id: 1,
      deviceCode: 'DEV-001',
      deviceName: 'Main Gate Scanner',
      vendor: 'ZKTeco',
      model: 'ZK-4500',
      serialNumber: 'SN-2024-001',
      deviceType: 'Fingerprint',
      branch: 'Noida',
      installationLocation: 'Main Gate',
      status: true,
      remarks: 'High traffic area'
    },
    {
      id: 2,
      deviceCode: 'DEV-002',
      deviceName: 'Office Entry Device',
      vendor: 'eSSL',
      model: 'eSSL-2000',
      serialNumber: 'SN-2024-002',
      deviceType: 'Face Recognition',
      branch: 'Delhi',
      installationLocation: 'Reception',
      status: true,
      remarks: 'For employees'
    },
    {
      id: 3,
      deviceCode: 'DEV-003',
      deviceName: 'Back Door Scanner',
      vendor: 'Matrix',
      model: 'MTX-3000',
      serialNumber: 'SN-2024-003',
      deviceType: 'RFID Card',
      branch: 'Gurgaon',
      installationLocation: 'Back Gate',
      status: false,
      remarks: 'Under maintenance'
    }
  ];

  // ─── States ──────────────────────────────────────────────
  const [devices, setDevices] = useState(dummyDevices);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: "",
    newStatus: ""
  });

  // ─── Form State ───────────────────────────────────────────
  const [formData, setFormData] = useState({
    deviceCode: '',
    deviceName: '',
    vendor: '',
    model: '',
    serialNumber: '',
    deviceType: '',
    branch: '',
    installationLocation: '',
    status: true,
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── Dropdown Options ────────────────────────────────────
  const vendors = ['ZKTeco', 'eSSL', 'Matrix', 'Suprema', 'Hikvision', 'Realtime', 'Mantra', 'Others'];
  const deviceTypes = ['Fingerprint', 'Face Recognition', 'Face + Fingerprint', 'Palm Recognition', 'RFID Card', 'QR Code'];
  const branches = ['Noida', 'Delhi', 'Gurgaon', 'Mumbai', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad'];

  // ─── Device Code Generation ─────────────────────────────
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
    const requiredFields = ['deviceName', 'vendor', 'model', 'serialNumber', 'deviceType', 'branch', 'installationLocation'];
    
    if (requiredFields.includes(field) && !value) {
      error = 'This field is required';
    }
    
    setErrors({ ...errors, [field]: error });
    return error === '';
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['deviceName', 'vendor', 'model', 'serialNumber', 'deviceType', 'branch', 'installationLocation'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit Handler ──────────────────────────────────────
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fill all required fields');
      return;
    }

    if (editingDevice) {
      setDevices(devices.map(d => d.id === editingDevice.id ? { ...formData, id: d.id, deviceCode: d.deviceCode } : d));
      toast.success('Success', 'Device updated successfully');
    } else {
      const newDevice = {
        id: Date.now(),
        ...formData,
        deviceCode: generateDeviceCode(),
      };
      setDevices([...devices, newDevice]);
      toast.success('Success', 'Device registered successfully');
    }
    resetForm();
    setShowForm(false);
  };

  // ─── Reset Form ──────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      deviceCode: '',
      deviceName: '',
      vendor: '',
      model: '',
      serialNumber: '',
      deviceType: '',
      branch: '',
      installationLocation: '',
      status: true,
      remarks: '',
    });
    setErrors({});
    setTouched({});
    setEditingDevice(null);
  };

  // ─── Edit Handler ────────────────────────────────────────
  const handleEdit = (device) => {
    setEditingDevice(device);
    setFormData(device);
    setShowForm(true);
  };

  // ─── Status Toggle with Modal ──────────────────────────
  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({
      id,
      name,
      newStatus
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;
    setDevices(devices.map(d => 
      d.id === id ? { ...d, status: newStatus === 'Active' } : d
    ));
    setShowStatusModal(false);
    toast.success('Status Updated', `${statusAction.name} is now ${newStatus}`);
  };

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

  // ─── Open Form ──────────────────────────────────────────
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
  };

  return (
    <div style={styles.container}>
      <style>{`
        .device-input:focus {
          border-color: #9d174d !important;
          box-shadow: 0 0 0 3px rgba(157,23,77,0.1) !important;
        }
        .device-input.error {
          border-color: #ef4444 !important;
        }
        .device-input.error:focus {
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
        .emp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .emp-modal {
          background: white;
          border-radius: 20px;
          padding: 32px 40px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .emp-modal-icon { font-size: 48px; margin-bottom: 16px; }
        .emp-modal-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
        .emp-modal-body { font-size: 14px; color: #475569; margin: 0 0 4px 0; }
        .emp-modal-warn { font-size: 13px; color: #94a3b8; margin: 0 0 20px 0; }
        .emp-modal-actions { display: flex; gap: 12px; justify-content: center; }
        .emp-modal-cancel { padding: 10px 24px; background: #e2e8f0; color: #374151; border: none; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; }
        .emp-modal-cancel:hover { background: #cbd5e1; }
        .emp-modal-confirm { padding: 10px 24px; background: #9d174d; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; }
        .emp-modal-confirm:hover { background: #7a0e3a; }
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
          {!showForm ? (
            <button style={styles.btnPrimary} onClick={openForm}>
              <FaPlus size={13} /> Register Device
            </button>
          ) : (
            <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>
              <FaArrowLeft size={13} /> Back to List
            </button>
          )}
        </div>
      </div>

      {/* ─── TABLE OR FORM ─────────────────────────────────── */}
      {!showForm ? (
        <div style={styles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Device Code</th>
                  <th style={styles.th}>Device Name</th>
                  <th style={styles.th}>Vendor</th>
                  <th style={styles.th}>Model</th>
                  <th style={styles.th}>Device Type</th>
                  <th style={styles.th}>Branch</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'center', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentDevices.length > 0 ? (
                  currentDevices.map((device, idx) => (
                    <tr key={device.id} style={{ transition: 'all 0.2s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={styles.td}>{startIndex + idx + 1}</td>
                      <td style={{ ...styles.td, fontWeight: '600', color: '#9d174d' }}>{device.deviceCode}</td>
                      <td style={styles.td}><strong>{device.deviceName}</strong></td>
                      <td style={styles.td}>{device.vendor}</td>
                      <td style={styles.td}>{device.model}</td>
                      <td style={styles.td}>
                        <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#eef2ff', color: '#4f46e5' }}>
                          {device.deviceType}
                        </span>
                      </td>
                      <td style={styles.td}>{device.branch}</td>
                      <td style={styles.td}>{device.installationLocation}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            className={`toggle-switch ${device.status ? 'active' : 'inactive'}`}
                            onClick={() => handleStatusToggle(
                              device.id,
                              device.deviceName,
                              device.status ? 'Active' : 'Inactive'
                            )}
                          />
                          <span style={{ fontSize: '12px', fontWeight: '500', color: device.status ? '#065f46' : '#991b1b' }}>
                            {device.status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          style={styles.btnWarning}
                          onClick={() => handleEdit(device)}
                          title="Edit"
                        >
                          <FaEdit size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
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
        </div>
      ) : (
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
              <input
                type="text"
                style={{ ...styles.input, background: '#f1f5f9', cursor: 'not-allowed' }}
                value={formData.deviceCode || generateDeviceCode()}
                readOnly
                disabled
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Device Name <span style={styles.required}>*</span></label>
              <input
                type="text"
                className={`device-input ${errors.deviceName && touched.deviceName ? 'error' : ''}`}
                style={styles.input}
                placeholder="e.g., Main Gate Scanner"
                value={formData.deviceName}
                onChange={(e) => handleChange('deviceName', e.target.value)}
                onBlur={() => handleBlur('deviceName')}
              />
              {errors.deviceName && touched.deviceName && <div style={styles.error}>{errors.deviceName}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Vendor <span style={styles.required}>*</span></label>
              <select
                className={`device-input ${errors.vendor && touched.vendor ? 'error' : ''}`}
                style={styles.input}
                value={formData.vendor}
                onChange={(e) => handleChange('vendor', e.target.value)}
                onBlur={() => handleBlur('vendor')}
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {errors.vendor && touched.vendor && <div style={styles.error}>{errors.vendor}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Model <span style={styles.required}>*</span></label>
              <input
                type="text"
                className={`device-input ${errors.model && touched.model ? 'error' : ''}`}
                style={styles.input}
                placeholder="e.g., ZK-4500"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                onBlur={() => handleBlur('model')}
              />
              {errors.model && touched.model && <div style={styles.error}>{errors.model}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Serial Number <span style={styles.required}>*</span></label>
              <input
                type="text"
                className={`device-input ${errors.serialNumber && touched.serialNumber ? 'error' : ''}`}
                style={styles.input}
                placeholder="e.g., SN-2024-001"
                value={formData.serialNumber}
                onChange={(e) => handleChange('serialNumber', e.target.value)}
                onBlur={() => handleBlur('serialNumber')}
              />
              {errors.serialNumber && touched.serialNumber && <div style={styles.error}>{errors.serialNumber}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Device Type <span style={styles.required}>*</span></label>
              <select
                className={`device-input ${errors.deviceType && touched.deviceType ? 'error' : ''}`}
                style={styles.input}
                value={formData.deviceType}
                onChange={(e) => handleChange('deviceType', e.target.value)}
                onBlur={() => handleBlur('deviceType')}
              >
                <option value="">Select Device Type</option>
                {deviceTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
              {errors.deviceType && touched.deviceType && <div style={styles.error}>{errors.deviceType}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Branch <span style={styles.required}>*</span></label>
              <select
                className={`device-input ${errors.branch && touched.branch ? 'error' : ''}`}
                style={styles.input}
                value={formData.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                onBlur={() => handleBlur('branch')}
              >
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.branch && touched.branch && <div style={styles.error}>{errors.branch}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Installation Location <span style={styles.required}>*</span></label>
              <input
                type="text"
                className={`device-input ${errors.installationLocation && touched.installationLocation ? 'error' : ''}`}
                style={styles.input}
                placeholder="e.g., Reception, Main Gate"
                value={formData.installationLocation}
                onChange={(e) => handleChange('installationLocation', e.target.value)}
                onBlur={() => handleBlur('installationLocation')}
              />
              {errors.installationLocation && touched.installationLocation && <div style={styles.error}>{errors.installationLocation}</div>}
            </div>

            <div style={{ ...styles.field, gridColumn: 'span 2' }}>
              <label style={styles.label}>Remarks</label>
              <textarea
                style={{ ...styles.input, resize: 'vertical', minHeight: '60px' }}
                placeholder="Any additional notes..."
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button style={styles.btnSecondary} onClick={() => { resetForm(); setShowForm(false); }}>
              Cancel
            </button>
            <button style={styles.btnSecondary} onClick={resetForm}>
              Reset
            </button>
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
            <div className="emp-modal-icon">
              {statusAction.newStatus === "Active" ? "✅" : "⛔"}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{" "}
              <strong>
                {statusAction.newStatus === "Active" ? "activate" : "deactivate"}
              </strong>{" "}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === "Inactive"
                ? "Inactive devices cannot be used for attendance marking."
                : "This device will become available for attendance."}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;