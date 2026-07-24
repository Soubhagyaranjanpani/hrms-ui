import React, { useState, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle, FaCircle,
  FaLayerGroup, FaBuilding, FaStar, FaFlag
} from 'react-icons/fa';

// Simple toast notification function
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

const InterviewRoundMaster = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [rounds, setRounds] = useState([
    {
      id: 1,
      roundCode: 'RND001',
      roundName: 'Technical Round 1',
      roundSequence: 1,
      applicableDepartment: 'IT',
      mandatory: true,
      maxScore: 100,
      passingScore: 70,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 2,
      roundCode: 'RND002',
      roundName: 'Technical Round 2',
      roundSequence: 2,
      applicableDepartment: 'IT',
      mandatory: true,
      maxScore: 100,
      passingScore: 80,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-20T14:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 3,
      roundCode: 'RND003',
      roundName: 'HR Round',
      roundSequence: 3,
      applicableDepartment: 'All',
      mandatory: true,
      maxScore: 100,
      passingScore: 60,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-01T09:15:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 4,
      roundCode: 'RND004',
      roundName: 'Manager Round',
      roundSequence: 4,
      applicableDepartment: 'All',
      mandatory: false,
      maxScore: 100,
      passingScore: 75,
      status: 'Inactive',
      createdBy: 'Admin',
      createdDate: '2026-02-10T11:45:00Z',
      modifiedBy: 'Admin',
      modifiedDate: '2026-07-20T16:30:00Z'
    },
    {
      id: 5,
      roundCode: 'RND005',
      roundName: 'Telephonic Screening',
      roundSequence: 1,
      applicableDepartment: 'Sales',
      mandatory: true,
      maxScore: 50,
      passingScore: 35,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-03-05T08:50:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 6,
      roundCode: 'RND006',
      roundName: 'Final Round',
      roundSequence: 5,
      applicableDepartment: 'All',
      mandatory: true,
      maxScore: 100,
      passingScore: 85,
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-04-12T13:10:00Z',
      modifiedBy: null,
      modifiedDate: null
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
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

  // Form state
  const [formData, setFormData] = useState({
    roundCode: '',
    roundName: '',
    roundSequence: '',
    applicableDepartment: '',
    mandatory: true,
    maxScore: '',
    passingScore: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // DEPARTMENT OPTIONS
  // ============================================
  const departments = [
    { value: 'All', label: 'All Departments' },
    { value: 'IT', label: 'IT' },
    { value: 'HR', label: 'HR' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Operations', label: 'Operations' }
  ];

  // ============================================
  // FILTERED DATA
  // ============================================
  const filteredRounds = rounds.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.roundCode.toLowerCase().includes(search) ||
      item.roundName.toLowerCase().includes(search) ||
      item.applicableDepartment.toLowerCase().includes(search) ||
      (item.roundSequence && String(item.roundSequence).includes(search));
  });

  const totalItems = filteredRounds.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentRounds = filteredRounds.slice(startIndex, startIndex + rowsPerPage);

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

  const generateRoundCode = () => {
    const count = rounds.length + 1;
    const prefix = 'RND';
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

  const getMandatoryBadge = (mandatory) => {
    return mandatory ? (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: '#d1fae5',
        color: '#065f46',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500'
      }}>
        <FaCheckCircle size={10} /> Yes
      </span>
    ) : (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: '#f3f4f6',
        color: '#6b7280',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500'
      }}>
        <FaCircle size={10} /> No
      </span>
    );
  };

  // ============================================
  // FORM FUNCTIONS
  // ============================================
  const resetForm = () => {
    setFormData({
      roundCode: generateRoundCode(),
      roundName: '',
      roundSequence: '',
      applicableDepartment: '',
      mandatory: true,
      maxScore: '',
      passingScore: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingRound(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';

    if (field === 'roundName') {
      if (!value) {
        error = 'Round Name is required';
      } else if (value.length > 100) {
        error = 'Round Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        const duplicate = rounds.some(item =>
          item.roundName.toLowerCase() === value.toLowerCase() &&
          (!editingRound || item.id !== editingRound.id)
        );
        if (duplicate) {
          error = 'Round Name must be unique';
        }
      }
    } else if (field === 'roundSequence') {
      if (!value) {
        error = 'Round Sequence is required';
      } else if (!/^\d+$/.test(value) || Number(value) <= 0) {
        error = 'Enter a valid positive number';
      } else {
        const duplicate = rounds.some(item =>
          Number(item.roundSequence) === Number(value) &&
          (!editingRound || item.id !== editingRound.id)
        );
        if (duplicate) {
          error = 'Round Sequence must be unique';
        }
      }
    } else if (field === 'applicableDepartment' && !value) {
      error = 'Applicable Department is required';
    } else if (field === 'maxScore') {
      if (!value) {
        error = 'Maximum Score is required';
      } else if (!/^\d+$/.test(value) || Number(value) <= 0) {
        error = 'Enter a valid positive number';
      } else if (Number(value) > 1000) {
        error = 'Maximum Score cannot exceed 1000';
      }
    } else if (field === 'passingScore') {
      if (!value) {
        error = 'Passing Score is required';
      } else if (!/^\d+$/.test(value) || Number(value) <= 0) {
        error = 'Enter a valid positive number';
      } else if (formData.maxScore && Number(value) > Number(formData.maxScore)) {
        error = 'Passing Score cannot exceed Maximum Score';
      }
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = [
      'roundName', 'roundSequence', 'applicableDepartment',
      'maxScore', 'passingScore'
    ];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }

    // Additional validations
    if (formData.roundName) {
      if (formData.roundName.length > 100) {
        newErrors.roundName = 'Round Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.roundName)) {
        newErrors.roundName = 'No special characters allowed';
      } else {
        const duplicate = rounds.some(item =>
          item.roundName.toLowerCase() === formData.roundName.toLowerCase() &&
          (!editingRound || item.id !== editingRound.id)
        );
        if (duplicate) {
          newErrors.roundName = 'Round Name must be unique';
        }
      }
    }

    if (formData.roundSequence) {
      if (!/^\d+$/.test(formData.roundSequence) || Number(formData.roundSequence) <= 0) {
        newErrors.roundSequence = 'Enter a valid positive number';
      } else {
        const duplicate = rounds.some(item =>
          Number(item.roundSequence) === Number(formData.roundSequence) &&
          (!editingRound || item.id !== editingRound.id)
        );
        if (duplicate) {
          newErrors.roundSequence = 'Round Sequence must be unique';
        }
      }
    }

    if (formData.maxScore) {
      if (!/^\d+$/.test(formData.maxScore) || Number(formData.maxScore) <= 0) {
        newErrors.maxScore = 'Enter a valid positive number';
      } else if (Number(formData.maxScore) > 1000) {
        newErrors.maxScore = 'Maximum Score cannot exceed 1000';
      }
    }

    if (formData.passingScore) {
      if (!/^\d+$/.test(formData.passingScore) || Number(formData.passingScore) <= 0) {
        newErrors.passingScore = 'Enter a valid positive number';
      } else if (formData.maxScore && Number(formData.passingScore) > Number(formData.maxScore)) {
        newErrors.passingScore = 'Passing Score cannot exceed Maximum Score';
      }
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

    const roundData = {
      roundCode: formData.roundCode,
      roundName: formData.roundName,
      roundSequence: Number(formData.roundSequence),
      applicableDepartment: formData.applicableDepartment,
      mandatory: formData.mandatory,
      maxScore: Number(formData.maxScore),
      passingScore: Number(formData.passingScore),
      status: formData.status
    };

    if (editingRound) {
      const updated = rounds.map(item =>
        item.id === editingRound.id
          ? {
            ...item,
            ...roundData,
            modifiedBy: 'Admin',
            modifiedDate: new Date().toISOString()
          }
          : item
      );
      setRounds(updated);
      showToast('success', 'Success', 'Interview round updated successfully');
    } else {
      const newRound = {
        id: Date.now(),
        ...roundData,
        createdBy: 'Admin',
        createdDate: new Date().toISOString(),
        modifiedBy: null,
        modifiedDate: null
      };
      setRounds([newRound, ...rounds]);
      showToast('success', 'Success', 'Interview round added successfully');
    }

    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive rounds cannot be edited');
      return;
    }
    setEditingRound(item);
    setFormData({
      roundCode: item.roundCode,
      roundName: item.roundName,
      roundSequence: String(item.roundSequence),
      applicableDepartment: item.applicableDepartment,
      mandatory: item.mandatory,
      maxScore: String(item.maxScore),
      passingScore: String(item.passingScore),
      status: item.status
    });
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const isUsed = false; // Replace with actual check

    if (isUsed) {
      showToast('error', 'Cannot Delete', 'This interview round is already in use');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    const updated = rounds.filter(item => item.id !== deleteTarget.id);
    setRounds(updated);
    showToast('success', 'Deleted', `${deleteTarget.roundName} has been deleted`);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // ============================================
  // STATUS TOGGLE - FIXED
  // ============================================
  const handleStatusToggle = (id, name, currentStatus) => {
    if (!id) {
      showToast('error', 'Error', 'Invalid record ID');
      return;
    }

    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    console.log(`🔄 Toggling status: ID=${id}, Name=${name}, New=${newStatus}`);
    
    setStatusAction({
      id: id,
      name: name || 'Record',
      newStatus: newStatus
    });
    setShowStatusModal(true);
  };

  // ============================================
  // CONFIRM STATUS CHANGE - FIXED
  // ============================================
  const confirmStatusChange = () => {
    if (!statusAction.id) {
      showToast('error', 'Error', 'Invalid record ID');
      setShowStatusModal(false);
      return;
    }

    const { id, newStatus, name } = statusAction;
    
    console.log(`✅ Confirming: ID=${id}, New Status=${newStatus}`);

    const updated = rounds.map(item =>
      item.id === id
        ? {
          ...item,
          status: newStatus,
          modifiedBy: 'Admin',
          modifiedDate: new Date().toISOString()
        }
        : item
    );
    setRounds(updated);
    
    showToast('success', 'Status Updated', `${name} is now ${newStatus}`);
    setShowStatusModal(false);
    setStatusAction({ id: null, newStatus: null, name: '' });
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, roundCode: generateRoundCode() }));
    setShowForm(true);
  };

  return (
    <div className="cert-root">
      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Interview Round Master</h1>
          <p className="cert-subtitle">Manage interview rounds for recruitment process</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Interview Round
            </button>
          )}
          {showForm && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleCancelForm}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          FORM SECTION
          ========================================== */}
      {showForm ? (
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Interview Round Details</div>
              <div className="cert-form-grid-3col">

                {/* Round Code - Auto */}
                <div className="cert-field-compact">
                  <label>Round Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.roundCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated</small>
                </div>

                {/* Round Name - Required */}
                <div className={`cert-field-compact ${touched.roundName && errors.roundName ? 'has-error' : ''}`}>
                  <label className="required">Round Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Technical Round, HR Round"
                    value={formData.roundName}
                    onChange={(e) => handleChange('roundName', e.target.value)}
                    onBlur={() => handleBlur('roundName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.roundName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Max 100 characters, no special characters</small>
                </div>

                {/* Round Sequence - Required */}
                <div className={`cert-field-compact ${touched.roundSequence && errors.roundSequence ? 'has-error' : ''}`}>
                  <label className="required">Round Sequence</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 1, 2, 3"
                    value={formData.roundSequence}
                    onChange={(e) => handleChange('roundSequence', e.target.value)}
                    onBlur={() => handleBlur('roundSequence')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.roundSequence} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Must be unique positive number</small>
                </div>

                {/* Applicable Department - Required */}
                <div className={`cert-field-compact ${touched.applicableDepartment && errors.applicableDepartment ? 'has-error' : ''}`}>
                  <label className="required">Applicable Department</label>
                  <select
                    value={formData.applicableDepartment}
                    onChange={(e) => handleChange('applicableDepartment', e.target.value)}
                    onBlur={() => handleBlur('applicableDepartment')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.applicableDepartment} />
                </div>

                {/* Mandatory */}
                <div className="cert-field-compact">
                  <label>Mandatory</label>
                  <select
                    value={formData.mandatory}
                    onChange={(e) => handleChange('mandatory', e.target.value === 'true')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {/* Maximum Score - Required */}
                <div className={`cert-field-compact ${touched.maxScore && errors.maxScore ? 'has-error' : ''}`}>
                  <label className="required">Maximum Score</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="e.g., 100"
                    value={formData.maxScore}
                    onChange={(e) => handleChange('maxScore', e.target.value)}
                    onBlur={() => handleBlur('maxScore')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.maxScore} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Max 1000</small>
                </div>

                {/* Passing Score - Required */}
                <div className={`cert-field-compact ${touched.passingScore && errors.passingScore ? 'has-error' : ''}`}>
                  <label className="required">Passing Score</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 70"
                    value={formData.passingScore}
                    onChange={(e) => handleChange('passingScore', e.target.value)}
                    onBlur={() => handleBlur('passingScore')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.passingScore} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Must be less than or equal to Maximum Score</small>
                </div>

             
              </div>
            </div>

            {/* Form Actions */}
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleCancelForm}>
                <FaTimes size={12} /> Cancel
              </button>
             
              <button type="submit" className="cert-add-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaSave size={12} /> {editingRound ? 'Update' : 'Save'}
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
              {/* <FaSearch className="emp-search-icon" size={12} /> */}
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name, department or sequence..."
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
                    <th>Round Code</th>
                    <th>Round Name</th>
                    <th style={{ textAlign: 'center' }}>Sequence</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'center' }}>Mandatory</th>
                    <th style={{ textAlign: 'center' }}>Max Score</th>
                    <th style={{ textAlign: 'center' }}>Passing Score</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRounds.length > 0 ? (
                    currentRounds.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {item.roundCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.roundName}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#ede9fe',
                            color: '#6d28d9',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {item.roundSequence}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: '#e0e7ff',
                            color: '#3730a3',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {item.applicableDepartment}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {getMandatoryBadge(item.mandatory)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            {item.maxScore}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            fontWeight: '600',
                            color: item.passingScore >= 70 ? '#065f46' : '#b45309'
                          }}>
                            {item.passingScore}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(
                              item.id,
                              item.roundName,
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
                        No interview rounds found
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} interview rounds
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
          STATUS CHANGE MODAL - FIXED
          ========================================== */}
      {showStatusModal && (
        <div 
          className="emp-modal-overlay" 
          onClick={() => {
            setShowStatusModal(false);
            setStatusAction({ id: null, newStatus: null, name: '' });
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="emp-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div 
              className="emp-modal-icon"
              style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '16px'
              }}
            >
              {statusAction.newStatus === 'Active' ? '✅' : '⛔'}
            </div>
            <h3 
              className="emp-modal-title"
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                textAlign: 'center',
                marginBottom: '12px'
              }}
            >
              Confirm Status Change
            </h3>
            <p 
              className="emp-modal-body"
              style={{
                fontSize: '14px',
                color: '#475569',
                textAlign: 'center',
                marginBottom: '8px',
                lineHeight: '1.5'
              }}
            >
              Are you sure you want to{' '}
              <strong style={{ color: '#9d174d' }}>
                {statusAction.newStatus === 'Active' ? 'activate' : 'deactivate'}
              </strong>{' '}
              <strong>{statusAction.name || 'this record'}</strong>?
            </p>
            <p 
              className="emp-modal-warn"
              style={{
                fontSize: '13px',
                color: statusAction.newStatus === 'Inactive' ? '#dc2626' : '#059669',
                textAlign: 'center',
                marginBottom: '24px',
                padding: '8px 12px',
                background: statusAction.newStatus === 'Inactive' ? '#fef2f2' : '#ecfdf5',
                borderRadius: '8px'
              }}
            >
              {statusAction.newStatus === 'Inactive'
                ? 'Inactive interview rounds cannot be used in recruitment process.'
                : 'This interview round will become available for selection.'}
            </p>
            <div 
              className="emp-modal-actions"
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}
            >
              <button
                className="emp-modal-cancel"
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusAction({ id: null, newStatus: null, name: '' });
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                className="emp-modal-confirm"
                onClick={confirmStatusChange}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: statusAction.newStatus === 'Active' ? '#10b981' : '#9d174d',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL
          ========================================== */}
      {showDeleteModal && deleteTarget && (
        <div 
          className="emp-modal-overlay" 
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="emp-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div 
              className="emp-modal-icon"
              style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '16px'
              }}
            >
              🗑️
            </div>
            <h3 
              className="emp-modal-title"
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                textAlign: 'center',
                marginBottom: '12px'
              }}
            >
              Confirm Delete
            </h3>
            <p 
              className="emp-modal-body"
              style={{
                fontSize: '14px',
                color: '#475569',
                textAlign: 'center',
                marginBottom: '8px',
                lineHeight: '1.5'
              }}
            >
              Are you sure you want to delete <strong>{deleteTarget.roundName}</strong>?
            </p>
            <p 
              className="emp-modal-warn"
              style={{
                fontSize: '13px',
                color: '#dc2626',
                textAlign: 'center',
                marginBottom: '24px',
                padding: '8px 12px',
                background: '#fef2f2',
                borderRadius: '8px'
              }}
            >
              {deleteTarget.status === 'Active'
                ? 'This interview round is currently active. It cannot be deleted if already used in recruitments.'
                : 'This action cannot be undone.'}
            </p>
            <div 
              className="emp-modal-actions"
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}
            >
              <button
                className="emp-modal-cancel"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                className="emp-modal-confirm"
                onClick={confirmDelete}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
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

export default InterviewRoundMaster;