import React, { useState, useRef, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle,
  FaTag, FaList, FaInfoCircle, FaClock, FaChevronDown,
  FaTimesCircle, FaMapMarkerAlt, FaBuilding, FaCity,
  FaGlobe, FaMapPin, FaBriefcase
} from 'react-icons/fa';

// ============================================
// TOAST NOTIFICATION
// ============================================
const showToast = (type, title, message) => {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:${colors[type] || '#3b82f6'};color:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:300px;margin-bottom:8px;animation:slideIn 0.3s ease;">
      <span style="font-weight:600;">${title}</span>
      <span style="flex:1;">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">×</button>
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 500px;
  `;
  document.body.appendChild(container);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  return container;
};

// ============================================
// MASTER DATA
// ============================================
const branches = [
  { id: 'BR001', name: 'Noida Branch' },
  { id: 'BR002', name: 'Gurgaon Branch' },
  { id: 'BR003', name: 'Mumbai Branch' },
  { id: 'BR004', name: 'Bangalore Branch' },
  { id: 'BR005', name: 'Hyderabad Branch' },
  { id: 'BR006', name: 'Chennai Branch' },
  { id: 'BR007', name: 'Pune Branch' },
  { id: 'BR008', name: 'Delhi Branch' }
];

const cities = [
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Bangalore', label: 'Bangalore' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Chennai', label: 'Chennai' },
  { value: 'Kolkata', label: 'Kolkata' },
  { value: 'Pune', label: 'Pune' },
  { value: 'Noida', label: 'Noida' },
  { value: 'Gurgaon', label: 'Gurgaon' },
  { value: 'Ahmedabad', label: 'Ahmedabad' }
];

const states = [
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Gujarat', label: 'Gujarat' }
];

const countries = [
  { value: 'India', label: 'India' },
  { value: 'USA', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'UAE', label: 'United Arab Emirates' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' }
];

const workModes = [
  { value: 'Onsite', label: 'Onsite' },
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Work from Home', label: 'Work from Home' },
  { value: 'Flexible', label: 'Flexible' }
];

const JobLocationMaster = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [locations, setLocations] = useState([
    {
      id: 1,
      locationCode: 'LOC001',
      locationName: 'Noida Head Office',
      branch: 'Noida Branch',
      city: 'Noida',
      state: 'Uttar Pradesh',
      country: 'India',
      pinCode: '201301',
      workMode: 'Onsite',
      description: 'Corporate headquarters for North India operations',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 2,
      locationCode: 'LOC002',
      locationName: 'Gurgaon Tech Park',
      branch: 'Gurgaon Branch',
      city: 'Gurgaon',
      state: 'Haryana',
      country: 'India',
      pinCode: '122001',
      workMode: 'Hybrid',
      description: 'Technology hub for digital transformation projects',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-20T14:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 3,
      locationCode: 'LOC003',
      locationName: 'Mumbai Corporate Center',
      branch: 'Mumbai Branch',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pinCode: '400001',
      workMode: 'Onsite',
      description: 'Corporate center for Western India operations',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-01T09:15:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 4,
      locationCode: 'LOC004',
      locationName: 'Bangalore R&D Center',
      branch: 'Bangalore Branch',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pinCode: '560001',
      workMode: 'Remote',
      description: 'Research and development center for product innovation',
      status: 'Inactive',
      createdBy: 'Admin',
      createdDate: '2026-02-10T11:45:00Z',
      modifiedBy: 'Admin',
      modifiedDate: '2026-07-20T16:30:00Z'
    },
    {
      id: 5,
      locationCode: 'LOC005',
      locationName: 'Hyderabad Global Center',
      branch: 'Hyderabad Branch',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pinCode: '500001',
      workMode: 'Hybrid',
      description: 'Global delivery center for international clients',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-05T08:50:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 6,
      locationCode: 'LOC006',
      locationName: 'Chennai Development Center',
      branch: 'Chennai Branch',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pinCode: '600001',
      workMode: 'Onsite',
      description: 'Development center for South India operations',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-04-12T13:10:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 7,
      locationCode: 'LOC007',
      locationName: 'Pune IT Park',
      branch: 'Pune Branch',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      pinCode: '411001',
      workMode: 'Work from Home',
      description: 'IT park facility with flexible work arrangements',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-05-18T08:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: '',
    newStatus: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Branch Searchable Dropdown
  const [branchSearch, setBranchSearch] = useState('');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const branchRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    locationCode: '',
    locationName: '',
    branch: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    workMode: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // FILTER & PAGINATION
  // ============================================
  const filteredLocations = locations.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.locationCode.toLowerCase().includes(search) ||
      item.locationName.toLowerCase().includes(search) ||
      item.branch.toLowerCase().includes(search) ||
      item.city.toLowerCase().includes(search) ||
      item.state.toLowerCase().includes(search) ||
      item.country.toLowerCase().includes(search) ||
      item.pinCode.includes(search) ||
      item.workMode.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search));
  });

  const totalItems = filteredLocations.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLocations = filteredLocations.slice(startIndex, startIndex + rowsPerPage);

  // Branch filter for dropdown
  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(branchSearch.toLowerCase())
  );

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateLocationCode = () => {
    const count = locations.length + 1;
    const prefix = 'LOC';
    const padded = String(count).padStart(3, '0');
    return `${prefix}${padded}`;
  };

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

  // Click outside handler for branch dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (branchRef.current && !branchRef.current.contains(event.target)) {
        setShowBranchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // FORM FUNCTIONS
  // ============================================
  const resetForm = () => {
    setFormData({
      locationCode: generateLocationCode(),
      locationName: '',
      branch: '',
      city: '',
      state: '',
      country: '',
      pinCode: '',
      workMode: '',
      description: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingLocation(null);
    setBranchSearch('');
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';

    if (field === 'locationName') {
      if (!value) {
        error = 'Location Name is required';
      } else if (value.length > 100) {
        error = 'Location Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        const duplicate = locations.some(item =>
          item.locationName.toLowerCase() === value.toLowerCase() &&
          (!editingLocation || item.id !== editingLocation.id)
        );
        if (duplicate) {
          error = 'Location Name must be unique';
        }
      }
    } else if (field === 'branch' && !value) {
      error = 'Branch is required';
    } else if (field === 'city' && !value) {
      error = 'City is required';
    } else if (field === 'state' && !value) {
      error = 'State is required';
    } else if (field === 'country' && !value) {
      error = 'Country is required';
    } else if (field === 'pinCode') {
      if (!value) {
        error = 'PIN Code is required';
      } else if (!/^\d{6}$/.test(value)) {
        error = 'PIN Code must be exactly 6 digits';
      }
    } else if (field === 'workMode' && !value) {
      error = 'Work Mode is required';
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = ['locationName', 'branch', 'city', 'state', 'country', 'pinCode', 'workMode'];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }

    if (formData.locationName) {
      if (formData.locationName.length > 100) {
        newErrors.locationName = 'Location Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.locationName)) {
        newErrors.locationName = 'No special characters allowed';
      } else {
        const duplicate = locations.some(item =>
          item.locationName.toLowerCase() === formData.locationName.toLowerCase() &&
          (!editingLocation || item.id !== editingLocation.id)
        );
        if (duplicate) {
          newErrors.locationName = 'Location Name must be unique';
        }
      }
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = 'PIN Code must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('warning', 'Validation Error', 'Please fix the highlighted fields');
      return;
    }

    const locationData = {
      locationCode: formData.locationCode,
      locationName: formData.locationName,
      branch: formData.branch,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pinCode: formData.pinCode,
      workMode: formData.workMode,
      description: formData.description || '',
      status: formData.status
    };

    if (editingLocation) {
      const updated = locations.map(item =>
        item.id === editingLocation.id
          ? {
            ...item,
            ...locationData,
            modifiedBy: 'Admin',
            modifiedDate: new Date().toISOString()
          }
          : item
      );
      setLocations(updated);
      showToast('success', 'Success', 'Job location updated successfully');
    } else {
      const newLocation = {
        id: Date.now(),
        ...locationData,
        createdBy: 'Admin',
        createdDate: new Date().toISOString(),
        modifiedBy: null,
        modifiedDate: null
      };
      setLocations([newLocation, ...locations]);
      showToast('success', 'Success', 'Job location added successfully');
    }

    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive locations cannot be edited');
      return;
    }
    setEditingLocation(item);
    setFormData({
      locationCode: item.locationCode,
      locationName: item.locationName,
      branch: item.branch,
      city: item.city,
      state: item.state,
      country: item.country,
      pinCode: item.pinCode,
      workMode: item.workMode,
      description: item.description || '',
      status: item.status
    });
    setBranchSearch(item.branch);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const isUsed = false; // Replace with actual check

    if (isUsed) {
      showToast('error', 'Cannot Delete', 'This location is already in use');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    const updated = locations.filter(item => item.id !== deleteTarget.id);
    setLocations(updated);
    showToast('success', 'Deleted', `${deleteTarget.locationName} has been deleted`);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

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
    const updated = locations.map(item =>
      item.id === id
        ? {
          ...item,
          status: newStatus,
          modifiedBy: 'Admin',
          modifiedDate: new Date().toISOString()
        }
        : item
    );
    setLocations(updated);
    setShowStatusModal(false);
    showToast('success', 'Status Updated', `${statusAction.name} is now ${newStatus}`);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, locationCode: generateLocationCode() }));
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Job Location Master</h1>
          <p className="cert-subtitle">Manage job locations for recruitment and HR operations</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Job Location
            </button>
          )}
          {showForm && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        /* ==========================================
           FORM SECTION
           ========================================== */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Job Location Details</div>
              <div className="cert-form-grid-3col">

                {/* Location Code - Auto */}
                <div className="cert-field-compact">
                  <label className="required">Location Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.locationCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Auto-generated unique identifier
                  </small>
                </div>

                {/* Location Name - Required */}
                <div className={`cert-field-compact ${touched.locationName && errors.locationName ? 'has-error' : ''}`}>
                  <label className="required">Location Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Noida Head Office"
                    value={formData.locationName}
                    onChange={(e) => handleChange('locationName', e.target.value)}
                    onBlur={() => handleBlur('locationName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.locationName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Display name of the work location
                  </small>
                </div>

                {/* Branch - Searchable Dropdown */}
                <div className={`cert-field-compact ${touched.branch && errors.branch ? 'has-error' : ''}`} ref={branchRef}>
                  <label className="required">Branch</label>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: `1px solid ${touched.branch && errors.branch ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '8px',
                        padding: '0 12px',
                        cursor: 'pointer',
                        background: '#fff',
                        minHeight: '38px'
                      }}
                      onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    >
                      <input
                        type="text"
                        placeholder="Search branch..."
                        value={branchSearch}
                        onChange={(e) => {
                          setBranchSearch(e.target.value);
                          setShowBranchDropdown(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBranchDropdown(!showBranchDropdown);
                        }}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          fontSize: '14px',
                          padding: '6px 0',
                          background: 'transparent'
                        }}
                      />
                      <FaChevronDown size={12} style={{ color: '#6b7280' }} />
                    </div>
                    {showBranchDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        {filteredBranches.length > 0 ? (
                          filteredBranches.map(branch => (
                            <div
                              key={branch.id}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderBottom: '1px solid #f3f4f6',
                                background: formData.branch === branch.name ? '#fdf2f8' : 'transparent'
                              }}
                              onClick={() => {
                                handleChange('branch', branch.name);
                                setBranchSearch(branch.name);
                                setShowBranchDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.target.style.background = formData.branch === branch.name ? '#fdf2f8' : 'transparent'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaBuilding size={12} style={{ color: '#6b7280' }} />
                                {branch.name}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '8px 12px', color: '#6b7280', fontSize: '14px' }}>
                            No branches found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <FieldError msg={errors.branch} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Maps the location to an organizational branch
                  </small>
                </div>

                {/* City - Dropdown */}
                <div className={`cert-field-compact ${touched.city && errors.city ? 'has-error' : ''}`}>
                  <label className="required">City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    onBlur={() => handleBlur('city')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.value} value={city.value}>{city.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.city} />
                </div>

                {/* State - Dropdown */}
                <div className={`cert-field-compact ${touched.state && errors.state ? 'has-error' : ''}`}>
                  <label className="required">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    onBlur={() => handleBlur('state')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.state} />
                </div>

                {/* Country - Dropdown */}
                <div className={`cert-field-compact ${touched.country && errors.country ? 'has-error' : ''}`}>
                  <label className="required">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    onBlur={() => handleBlur('country')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.value} value={country.value}>{country.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.country} />
                </div>

                {/* PIN Code - Numeric */}
                <div className={`cert-field-compact ${touched.pinCode && errors.pinCode ? 'has-error' : ''}`}>
                  <label className="required">PIN Code</label>
                  <input
                    type="text"
                    placeholder="6-digit PIN code"
                    value={formData.pinCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      handleChange('pinCode', value);
                    }}
                    onBlur={() => handleBlur('pinCode')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                    maxLength="6"
                  />
                  <FieldError msg={errors.pinCode} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Postal code of the work location (6 digits)
                  </small>
                </div>

                {/* Work Mode - Dropdown */}
                <div className={`cert-field-compact ${touched.workMode && errors.workMode ? 'has-error' : ''}`}>
                  <label className="required">Work Mode</label>
                  <select
                    value={formData.workMode}
                    onChange={(e) => handleChange('workMode', e.target.value)}
                    onBlur={() => handleBlur('workMode')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Work Mode</option>
                    {workModes.map(mode => (
                      <option key={mode.value} value={mode.value}>{mode.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.workMode} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Defines how employees will work from this location
                  </small>
                </div>

                {/* Description - Text Area */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 1' }}>
                  <label>Description</label>
                  <textarea
                    rows="2"
                    placeholder="Enter description (optional)"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    style={{ 
                      fontSize: '14px', 
                      padding: '6px 12px', 
                      resize: 'vertical', 
                      minHeight: '80px',
                      width: '100%'
                    }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Additional information about the work location
                  </small>
                </div>

              </div>
            </div>

            {/* Form Actions */}
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>
                <FaTimes size={12} /> Cancel
              </button>
             
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingLocation ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ==========================================
           TABLE SECTION
           ========================================== */
        <>
          {/* Search Bar */}
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name, branch, city, state, country, PIN..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                style={{ fontSize: '14px', padding: '6px 12px' }}
              />
              {searchTerm && (
                <button className="cert-search-clear" onClick={() => { setSearchTerm(''); setPage(0); }}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
            
          </div>

          {/* Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Location Code</th>
                    <th>Location Name</th>
                    <th>Branch</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Country</th>
                    <th>PIN</th>
                    <th>Work Mode</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLocations.length > 0 ? (
                    currentLocations.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {item.locationCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.locationName}</strong>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            fontSize: '12px',
                            padding: '2px 10px'
                          }}>
                            {item.branch}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaCity size={11} style={{ color: '#6b7280' }} />
                            {item.city}
                          </span>
                        </td>
                        <td>{item.state}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaGlobe size={11} style={{ color: '#6b7280' }} />
                            {item.country}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {item.pinCode}
                          </span>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{
                            background: item.workMode === 'Onsite' ? '#d1fae5' : 
                                      item.workMode === 'Remote' ? '#fef3c7' :
                                      item.workMode === 'Hybrid' ? '#e0e7ff' : '#fce4ec',
                            color: item.workMode === 'Onsite' ? '#065f46' : 
                                   item.workMode === 'Remote' ? '#92400e' :
                                   item.workMode === 'Hybrid' ? '#4f46e5' : '#b91c1c',
                            fontSize: '11px',
                            padding: '2px 10px',
                            borderRadius: '12px'
                          }}>
                            {item.workMode}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(
                              item.id,
                              item.locationName,
                              item.status || 'Active'
                            )}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '16px',
                                borderRadius: '50px',
                                backgroundColor: (item.status || 'Active') === 'Active' ? '#9d174d' : '#d1d5db',
                                position: 'relative',
                                transition: '.2s'
                              }}
                            >
                              <div
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  background: '#fff',
                                  position: 'absolute',
                                  top: '2px',
                                  left: (item.status || 'Active') === 'Active' ? '14px' : '2px',
                                  transition: '.2s'
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: (item.status || 'Active') === 'Active' ? '#9d174d' : '#94a3b8'
                              }}
                            >
                              {item.status || 'Active'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cert-actions" style={{ justifyContent: 'center' }}>
                            <button
                              className="cert-act cert-act--edit"
                              onClick={() => handleEdit(item)}
                              title={item.status === 'Inactive' ? 'Cannot edit inactive record' : 'Edit'}
                              disabled={item.status === 'Inactive'}
                              style={{
                                opacity: item.status === 'Inactive' ? 0.5 : 1,
                                cursor: item.status === 'Inactive' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <FaEdit size={12} />
                            </button>
                           
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No job locations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} locations
                </div>

                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    className="cert-page-btn"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} className="cert-page-dots" style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button
                        key={pg}
                        className={`cert-page-num ${pg === page ? 'active' : ''}`}
                        onClick={() => setPage(pg)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #e5e7eb',
                          background: pg === page ? '#9d174d' : 'white',
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          minWidth: '34px'
                        }}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button
                    className="cert-page-btn"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==========================================
          STATUS CHANGE MODAL
          ========================================== */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">
              {statusAction.newStatus === 'Active' ? '✅' : '⛔'}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{' '}
              <strong>{statusAction.newStatus === 'Active' ? 'activate' : 'deactivate'}</strong>{' '}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === 'Inactive'
                ? 'Inactive locations cannot be used for new job postings or HR transactions.'
                : 'This location will become available for recruitment and HR operations.'}
            </p>
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

// ============================================
// FIELD ERROR COMPONENT
// ============================================
const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

export default JobLocationMaster;