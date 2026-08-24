import React, { useState, useRef, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle,
  FaTag, FaList, FaInfoCircle, FaClock, FaChevronDown,
  FaTimesCircle, FaUser, FaUsers, FaUserTie
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
// EMPLOYEE DATA (Mock)
// ============================================
const employees = [
  { id: 'EMP101', name: 'Rahul Sharma', designation: 'Technical Lead', department: 'IT' },
  { id: 'EMP102', name: 'Priya Patel', designation: 'Senior Developer', department: 'IT' },
  { id: 'EMP103', name: 'Amit Kumar', designation: 'HR Manager', department: 'HR' },
  { id: 'EMP104', name: 'Neha Singh', designation: 'Recruitment Lead', department: 'HR' },
  { id: 'EMP105', name: 'Vikram Reddy', designation: 'Finance Manager', department: 'Finance' },
  { id: 'EMP106', name: 'Sneha Joshi', designation: 'Senior Analyst', department: 'Finance' },
  { id: 'EMP107', name: 'Ravi Desai', designation: 'Engineering Manager', department: 'IT' },
  { id: 'EMP108', name: 'Ananya Mehta', designation: 'Product Manager', department: 'Product' },
  { id: 'EMP109', name: 'Karan Singh', designation: 'QA Lead', department: 'IT' },
  { id: 'EMP110', name: 'Meera Iyer', designation: 'UX Designer', department: 'Design' }
];

const departments = [
  { value: 'IT', label: 'IT' },
  { value: 'HR', label: 'HR' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Operations', label: 'Operations' }
];

const InterviewPanelMaster = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [panels, setPanels] = useState([
    {
      id: 1,
      panelCode: 'PNL001',
      panelName: 'Java Technical Panel',
      department: 'IT',
      primaryInterviewer: 'EMP102 - Rahul Sharma',
      secondaryInterviewer: 'EMP104 - Neha Singh',
      panelMembers: ['EMP101 - Priya Patel', 'EMP107 - Ravi Desai', 'EMP109 - Karan Singh'],
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 2,
      panelCode: 'PNL002',
      panelName: 'HR Interview Panel',
      department: 'HR',
      primaryInterviewer: 'EMP103 - Amit Kumar',
      secondaryInterviewer: null,
      panelMembers: ['EMP104 - Neha Singh'],
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-20T14:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 3,
      panelCode: 'PNL003',
      panelName: 'Frontend Development Panel',
      department: 'IT',
      primaryInterviewer: 'EMP101 - Priya Patel',
      secondaryInterviewer: 'EMP109 - Karan Singh',
      panelMembers: ['EMP107 - Ravi Desai', 'EMP110 - Meera Iyer'],
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-01T09:15:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 4,
      panelCode: 'PNL004',
      panelName: 'Finance & Analytics Panel',
      department: 'Finance',
      primaryInterviewer: 'EMP105 - Vikram Reddy',
      secondaryInterviewer: 'EMP106 - Sneha Joshi',
      panelMembers: ['EMP106 - Sneha Joshi'],
      status: 'Inactive',
      createdBy: 'Admin',
      createdDate: '2026-02-10T11:45:00Z',
      modifiedBy: 'Admin',
      modifiedDate: '2026-07-20T16:30:00Z'
    },
    {
      id: 5,
      panelCode: 'PNL005',
      panelName: 'Product Management Panel',
      department: 'Product',
      primaryInterviewer: 'EMP108 - Ananya Mehta',
      secondaryInterviewer: null,
      panelMembers: ['EMP103 - Amit Kumar', 'EMP101 - Priya Patel'],
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-05T08:50:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 6,
      panelCode: 'PNL006',
      panelName: 'Design & UX Panel',
      department: 'Design',
      primaryInterviewer: 'EMP110 - Meera Iyer',
      secondaryInterviewer: 'EMP102 - Rahul Sharma',
      panelMembers: ['EMP101 - Priya Patel'],
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-04-12T13:10:00Z',
      modifiedBy: null,
      modifiedDate: null
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);
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

  // Dropdown states
  const [primarySearch, setPrimarySearch] = useState('');
  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const primaryRef = useRef(null);

  const [secondarySearch, setSecondarySearch] = useState('');
  const [showSecondaryDropdown, setShowSecondaryDropdown] = useState(false);
  const secondaryRef = useRef(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    panelCode: '',
    panelName: '',
    department: '',
    primaryInterviewer: '',
    secondaryInterviewer: '',
    panelMembers: [],
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // FILTER & PAGINATION
  // ============================================
  const filteredPanels = panels.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.panelCode.toLowerCase().includes(search) ||
      item.panelName.toLowerCase().includes(search) ||
      item.department.toLowerCase().includes(search) ||
      (item.primaryInterviewer && item.primaryInterviewer.toLowerCase().includes(search)) ||
      (item.secondaryInterviewer && item.secondaryInterviewer.toLowerCase().includes(search)) ||
      (item.panelMembers && item.panelMembers.some(m => m.toLowerCase().includes(search)));
  });

  const totalItems = filteredPanels.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentPanels = filteredPanels.slice(startIndex, startIndex + rowsPerPage);

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

  const generatePanelCode = () => {
    const count = panels.length + 1;
    const prefix = 'PNL';
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

  // Filter employee options
  const getEmployeeOptions = (search, excludeSelected = []) => {
    return employees
      .filter(emp => {
        const displayName = `${emp.id} - ${emp.name}`;
        const matchesSearch = displayName.toLowerCase().includes(search.toLowerCase());
        const notExcluded = !excludeSelected.includes(displayName);
        return matchesSearch && notExcluded;
      })
      .map(emp => `${emp.id} - ${emp.name}`);
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (primaryRef.current && !primaryRef.current.contains(event.target)) {
        setShowPrimaryDropdown(false);
      }
      if (secondaryRef.current && !secondaryRef.current.contains(event.target)) {
        setShowSecondaryDropdown(false);
      }
      if (memberRef.current && !memberRef.current.contains(event.target)) {
        setShowMemberDropdown(false);
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
      panelCode: generatePanelCode(),
      panelName: '',
      department: '',
      primaryInterviewer: '',
      secondaryInterviewer: '',
      panelMembers: [],
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingPanel(null);
    setPrimarySearch('');
    setSecondarySearch('');
    setMemberSearch('');
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';

    if (field === 'panelName') {
      if (!value) {
        error = 'Panel Name is required';
      } else if (value.length > 100) {
        error = 'Panel Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        const duplicate = panels.some(item =>
          item.panelName.toLowerCase() === value.toLowerCase() &&
          (!editingPanel || item.id !== editingPanel.id)
        );
        if (duplicate) {
          error = 'Panel Name must be unique';
        }
      }
    } else if (field === 'department' && !value) {
      error = 'Department is required';
    } else if (field === 'primaryInterviewer' && !value) {
      error = 'Primary Interviewer is required';
    } else if (field === 'panelMembers' && value.length === 0) {
      error = 'At least one Panel Member is required';
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = ['panelName', 'department', 'primaryInterviewer', 'panelMembers'];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field] || (field === 'panelMembers' && formData[field].length === 0)) {
        newErrors[field] = field === 'panelMembers' ? 'At least one Panel Member is required' : 'This field is required';
      }
    }

    if (formData.panelName) {
      if (formData.panelName.length > 100) {
        newErrors.panelName = 'Panel Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.panelName)) {
        newErrors.panelName = 'No special characters allowed';
      } else {
        const duplicate = panels.some(item =>
          item.panelName.toLowerCase() === formData.panelName.toLowerCase() &&
          (!editingPanel || item.id !== editingPanel.id)
        );
        if (duplicate) {
          newErrors.panelName = 'Panel Name must be unique';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // PANEL MEMBER FUNCTIONS
  // ============================================
  const toggleMember = (member) => {
    const current = formData.panelMembers;
    const updated = current.includes(member)
      ? current.filter(m => m !== member)
      : [...current, member];
    handleChange('panelMembers', updated);
  };

  const removeMember = (member) => {
    const updated = formData.panelMembers.filter(m => m !== member);
    handleChange('panelMembers', updated);
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

    const panelData = {
      panelCode: formData.panelCode,
      panelName: formData.panelName,
      department: formData.department,
      primaryInterviewer: formData.primaryInterviewer,
      secondaryInterviewer: formData.secondaryInterviewer || null,
      panelMembers: formData.panelMembers,
      status: formData.status
    };

    if (editingPanel) {
      const updated = panels.map(item =>
        item.id === editingPanel.id
          ? {
            ...item,
            ...panelData,
            modifiedBy: 'Admin',
            modifiedDate: new Date().toISOString()
          }
          : item
      );
      setPanels(updated);
      showToast('success', 'Success', 'Interview panel updated successfully');
    } else {
      const newPanel = {
        id: Date.now(),
        ...panelData,
        createdBy: 'Admin',
        createdDate: new Date().toISOString(),
        modifiedBy: null,
        modifiedDate: null
      };
      setPanels([newPanel, ...panels]);
      showToast('success', 'Success', 'Interview panel added successfully');
    }

    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive panels cannot be edited');
      return;
    }
    setEditingPanel(item);
    setFormData({
      panelCode: item.panelCode,
      panelName: item.panelName,
      department: item.department,
      primaryInterviewer: item.primaryInterviewer || '',
      secondaryInterviewer: item.secondaryInterviewer || '',
      panelMembers: item.panelMembers || [],
      status: item.status
    });
    setPrimarySearch(item.primaryInterviewer || '');
    setSecondarySearch(item.secondaryInterviewer || '');
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const isUsed = false; // Replace with actual check

    if (isUsed) {
      showToast('error', 'Cannot Delete', 'This panel is already in use');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    const updated = panels.filter(item => item.id !== deleteTarget.id);
    setPanels(updated);
    showToast('success', 'Deleted', `${deleteTarget.panelName} has been deleted`);
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
    const updated = panels.map(item =>
      item.id === id
        ? {
          ...item,
          status: newStatus,
          modifiedBy: 'Admin',
          modifiedDate: new Date().toISOString()
        }
        : item
    );
    setPanels(updated);
    setShowStatusModal(false);
    showToast('success', 'Status Updated', `${statusAction.name} is now ${newStatus}`);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, panelCode: generatePanelCode() }));
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // ============================================
  // SEARCHABLE DROPDOWN COMPONENT
  // ============================================
  const SearchableDropdown = ({
    value,
    searchValue,
    setSearchValue,
    showDropdown,
    setShowDropdown,
    options,
    onSelect,
    placeholder,
    label,
    error,
    touched,
    excludeSelected = [],
    dropdownRef
  }) => {
    const filteredOptions = options
      .filter(opt => opt.toLowerCase().includes(searchValue.toLowerCase()))
      .filter(opt => !excludeSelected.includes(opt));

    return (
      <div className={`cert-field-compact ${touched && error ? 'has-error' : ''}`} ref={dropdownRef}>
        <label>{label}</label>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${touched && error ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '8px',
              padding: '0 12px',
              cursor: 'pointer',
              background: '#fff',
              minHeight: '38px'
            }}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <input
              type="text"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setShowDropdown(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
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
          {showDropdown && (
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
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div
                    key={option}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderBottom: '1px solid #f3f4f6',
                      background: value === option ? '#fdf2f8' : 'transparent'
                    }}
                    onClick={() => {
                      onSelect(option);
                      setSearchValue(option);
                      setShowDropdown(false);
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.background = value === option ? '#fdf2f8' : 'transparent'}
                  >
                    {option}
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px 12px', color: '#6b7280', fontSize: '14px' }}>
                  No options found
                </div>
              )}
            </div>
          )}
        </div>
        <FieldError msg={error} />
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Interview Panel Master</h1>
          <p className="cert-subtitle">Manage interview panels for candidate evaluation</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Interview Panel
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
              <div className="cert-section-label">Interview Panel Details</div>
              <div className="cert-form-grid-3col">

                {/* Panel Code - Auto */}
                <div className="cert-field-compact">
                  <label className="required">Panel Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.panelCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Auto-generated unique identifier
                  </small>
                </div>

                {/* Panel Name - Required */}
                <div className={`cert-field-compact ${touched.panelName && errors.panelName ? 'has-error' : ''}`}>
                  <label className="required">Panel Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Java Technical Panel"
                    value={formData.panelName}
                    onChange={(e) => handleChange('panelName', e.target.value)}
                    onBlur={() => handleBlur('panelName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.panelName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Display name used while assigning interview panels
                  </small>
                </div>

                {/* Department - Required */}
                <div className={`cert-field-compact ${touched.department && errors.department ? 'has-error' : ''}`}>
                  <label className="required">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    onBlur={() => handleBlur('department')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.department} />
                </div>

                {/* Primary Interviewer - Required */}
                <SearchableDropdown
                  value={formData.primaryInterviewer}
                  searchValue={primarySearch}
                  setSearchValue={setPrimarySearch}
                  showDropdown={showPrimaryDropdown}
                  setShowDropdown={setShowPrimaryDropdown}
                  options={getEmployeeOptions(primarySearch, [formData.secondaryInterviewer, ...formData.panelMembers])}
                  onSelect={(val) => handleChange('primaryInterviewer', val)}
                  placeholder="Search employee..."
                  label="Primary Interviewer"
                  error={errors.primaryInterviewer}
                  touched={touched.primaryInterviewer}
                  dropdownRef={primaryRef}
                />

                {/* Secondary Interviewer - Optional */}
                <SearchableDropdown
                  value={formData.secondaryInterviewer}
                  searchValue={secondarySearch}
                  setSearchValue={setSecondarySearch}
                  showDropdown={showSecondaryDropdown}
                  setShowDropdown={setShowSecondaryDropdown}
                  options={getEmployeeOptions(secondarySearch, [formData.primaryInterviewer, ...formData.panelMembers])}
                  onSelect={(val) => handleChange('secondaryInterviewer', val)}
                  placeholder="Search employee..."
                  label="Secondary Interviewer (Optional)"
                  error={errors.secondaryInterviewer}
                  touched={touched.secondaryInterviewer}
                  dropdownRef={secondaryRef}
                />

                {/* Panel Members - Multi-select */}
                <div className={`cert-field-compact ${touched.panelMembers && errors.panelMembers ? 'has-error' : ''}`} ref={memberRef} style={{ gridColumn: 'span 1' }}>
                  <label className="required">Panel Members</label>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '4px',
                        border: `1px solid ${touched.panelMembers && errors.panelMembers ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '8px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        background: '#fff',
                        minHeight: '38px'
                      }}
                      onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    >
                      {formData.panelMembers.length > 0 ? (
                        formData.panelMembers.map(member => (
                          <span
                            key={member}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#fdf2f8',
                              color: '#9d174d',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            {member.split(' - ')[1] || member}
                            <FaTimesCircle
                              size={12}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMember(member);
                              }}
                            />
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                          Select panel members...
                        </span>
                      )}
                      <FaChevronDown size={12} style={{ color: '#6b7280', marginLeft: 'auto' }} />
                    </div>
                    {showMemberDropdown && (
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
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                          <input
                            type="text"
                            placeholder="Search members..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            style={{
                              width: '100%',
                              border: 'none',
                              outline: 'none',
                              fontSize: '14px',
                              padding: '4px 0'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {getEmployeeOptions(memberSearch, [formData.primaryInterviewer, formData.secondaryInterviewer])
                          .filter(opt => !formData.panelMembers.includes(opt))
                          .map(option => (
                            <div
                              key={option}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                borderBottom: '1px solid #f3f4f6'
                              }}
                              onClick={() => toggleMember(option)}
                              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={formData.panelMembers.includes(option)}
                                onChange={() => {}}
                                style={{ cursor: 'pointer' }}
                              />
                              {option}
                            </div>
                          ))}
                        {getEmployeeOptions(memberSearch, [formData.primaryInterviewer, formData.secondaryInterviewer])
                          .filter(opt => !formData.panelMembers.includes(opt)).length === 0 && (
                          <div style={{ padding: '8px 12px', color: '#6b7280', fontSize: '14px' }}>
                            No members found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <FieldError msg={errors.panelMembers} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Additional interviewers participating in the panel
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
                <FaSave size={12} /> {editingPanel ? 'Update' : 'Save'}
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
                placeholder="Search by code, name, department, interviewer..."
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
                    <th>Panel Code</th>
                    <th>Panel Name</th>
                    <th>Department</th>
                    <th>Primary Interviewer</th>
                    <th>Secondary</th>
                    <th>Members</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPanels.length > 0 ? (
                    currentPanels.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {item.panelCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.panelName}</strong>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            fontSize: '12px',
                            padding: '2px 10px'
                          }}>
                            {item.department}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaUserTie size={12} style={{ color: '#9d174d' }} />
                            {item.primaryInterviewer?.split(' - ')[1] || item.primaryInterviewer}
                          </span>
                        </td>
                        <td>
                          {item.secondaryInterviewer ? (
                            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaUser size={12} style={{ color: '#6b7280' }} />
                              {item.secondaryInterviewer.split(' - ')[1]}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(item.panelMembers || []).map(member => (
                              <span
                                key={member}
                                style={{
                                  background: '#fdf2f8',
                                  color: '#9d174d',
                                  fontSize: '10px',
                                  padding: '1px 8px',
                                  borderRadius: '10px',
                                  fontWeight: '500'
                                }}
                              >
                                {member.split(' - ')[1] || member}
                              </span>
                            ))}
                            {(!item.panelMembers || item.panelMembers.length === 0) && (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(
                              item.id,
                              item.panelName,
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
                      <td colSpan="10" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No interview panels found
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} panels
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
                ? 'Inactive panels cannot be used for interview scheduling.'
                : 'This panel will become available for interview scheduling.'}
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

export default InterviewPanelMaster;