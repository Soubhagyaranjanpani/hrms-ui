import React, { useState, useRef, useEffect } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit, FaTrash,
  FaArrowLeft, FaArrowRight, FaCheckCircle,
  FaTag, FaList, FaInfoCircle, FaClock, FaCaretDown,
  FaChevronDown, FaTimesCircle
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

const SkillMaster = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [skills, setSkills] = useState([
    {
      id: 1,
      skillCode: 'SK001',
      skillName: 'Java',
      skillCategory: 'Programming',
      skillType: 'Technical',
      parentSkill: null,
      skillLevelApplicable: ['Beginner', 'Intermediate', 'Advanced'],
      description: 'Java programming language for enterprise application development',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-15T10:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 2,
      skillCode: 'SK002',
      skillName: 'Spring Boot',
      skillCategory: 'Framework',
      skillType: 'Technical',
      parentSkill: 'Java',
      skillLevelApplicable: ['Intermediate', 'Advanced'],
      description: 'Spring Boot framework for building microservices',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-01-20T14:20:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 3,
      skillCode: 'SK003',
      skillName: 'React',
      skillCategory: 'Frontend',
      skillType: 'Technical',
      parentSkill: null,
      skillLevelApplicable: ['Beginner', 'Intermediate', 'Advanced'],
      description: 'React library for building user interfaces',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-01T09:15:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 4,
      skillCode: 'SK004',
      skillName: 'Leadership',
      skillCategory: 'Management',
      skillType: 'Soft Skill',
      parentSkill: null,
      skillLevelApplicable: ['Intermediate', 'Advanced'],
      description: 'Leadership and team management skills',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-02-10T11:45:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 5,
      skillCode: 'SK005',
      skillName: 'Communication',
      skillCategory: 'Interpersonal',
      skillType: 'Soft Skill',
      parentSkill: null,
      skillLevelApplicable: ['Beginner', 'Intermediate', 'Advanced'],
      description: 'Verbal and written communication skills',
      status: 'Inactive',
      createdBy: 'Admin',
      createdDate: '2026-03-05T08:50:00Z',
      modifiedBy: 'Admin',
      modifiedDate: '2026-07-20T16:30:00Z'
    },
    {
      id: 6,
      skillCode: 'SK006',
      skillName: 'Node.js',
      skillCategory: 'Backend',
      skillType: 'Technical',
      parentSkill: null,
      skillLevelApplicable: ['Beginner', 'Intermediate'],
      description: 'Node.js runtime for server-side JavaScript',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-04-12T13:10:00Z',
      modifiedBy: null,
      modifiedDate: null
    },
    {
      id: 7,
      skillCode: 'SK007',
      skillName: 'Angular',
      skillCategory: 'Frontend',
      skillType: 'Technical',
      parentSkill: null,
      skillLevelApplicable: ['Intermediate', 'Advanced'],
      description: 'Angular framework for building web applications',
      status: 'Active',
      createdBy: 'Admin',
      createdDate: '2026-05-18T08:30:00Z',
      modifiedBy: null,
      modifiedDate: null
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
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

  // Parent Skill Dropdown state
  const [parentSkillSearch, setParentSkillSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const parentDropdownRef = useRef(null);

  // Skill Level Applicable state
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const levelDropdownRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    skillCode: '',
    skillName: '',
    skillCategory: '',
    skillType: '',
    parentSkill: '',
    skillLevelApplicable: [],
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // CONSTANTS
  // ============================================
  const skillCategories = [
    { value: 'Programming', label: 'Programming' },
    { value: 'Framework', label: 'Framework' },
    { value: 'Frontend', label: 'Frontend' },
    { value: 'Backend', label: 'Backend' },
    { value: 'Database', label: 'Database' },
    { value: 'Cloud', label: 'Cloud' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Management', label: 'Management' },
    { value: 'Interpersonal', label: 'Interpersonal' },
    { value: 'Other', label: 'Other' }
  ];

  const skillTypes = [
    { value: 'Technical', label: 'Technical' },
    { value: 'Soft Skill', label: 'Soft Skill' },
    { value: 'Domain', label: 'Domain' },
    { value: 'Language', label: 'Language' },
    { value: 'Other', label: 'Other' }
  ];

  const skillLevels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' }
  ];

  // ============================================
  // FILTER & PAGINATION
  // ============================================
  const filteredSkills = skills.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.skillCode.toLowerCase().includes(search) ||
      item.skillName.toLowerCase().includes(search) ||
      item.skillCategory.toLowerCase().includes(search) ||
      item.skillType.toLowerCase().includes(search) ||
      (item.parentSkill && item.parentSkill.toLowerCase().includes(search)) ||
      (item.description && item.description.toLowerCase().includes(search));
  });

  const totalItems = filteredSkills.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentSkills = filteredSkills.slice(startIndex, startIndex + rowsPerPage);

  // Parent skill options (for dropdown)
  const parentSkillOptions = skills
    .filter(skill => skill.id !== editingSkill?.id)
    .map(skill => skill.skillName);

  const filteredParentSkills = parentSkillOptions.filter(name =>
    name.toLowerCase().includes(parentSkillSearch.toLowerCase())
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

  const generateSkillCode = () => {
    const count = skills.length + 1;
    const prefix = 'SK';
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

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(event.target)) {
        setShowParentDropdown(false);
      }
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target)) {
        setShowLevelDropdown(false);
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
      skillCode: generateSkillCode(),
      skillName: '',
      skillCategory: '',
      skillType: '',
      parentSkill: '',
      skillLevelApplicable: [],
      description: '',
      status: 'Active'
    });
    setErrors({});
    setTouched({});
    setEditingSkill(null);
    setParentSkillSearch('');
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    let error = '';

    if (field === 'skillName') {
      if (!value) {
        error = 'Skill Name is required';
      } else if (value.length > 100) {
        error = 'Skill Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(value)) {
        error = 'No special characters allowed';
      } else {
        const duplicate = skills.some(item =>
          item.skillName.toLowerCase() === value.toLowerCase() &&
          (!editingSkill || item.id !== editingSkill.id)
        );
        if (duplicate) {
          error = 'Skill Name must be unique';
        }
      }
    } else if (field === 'skillCategory' && !value) {
      error = 'Skill Category is required';
    } else if (field === 'skillType' && !value) {
      error = 'Skill Type is required';
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = ['skillName', 'skillCategory', 'skillType'];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }

    if (formData.skillName) {
      if (formData.skillName.length > 100) {
        newErrors.skillName = 'Skill Name must be 100 characters or less';
      } else if (/[^a-zA-Z0-9\s\-\.]/.test(formData.skillName)) {
        newErrors.skillName = 'No special characters allowed';
      } else {
        const duplicate = skills.some(item =>
          item.skillName.toLowerCase() === formData.skillName.toLowerCase() &&
          (!editingSkill || item.id !== editingSkill.id)
        );
        if (duplicate) {
          newErrors.skillName = 'Skill Name must be unique';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // SKILL LEVEL FUNCTIONS
  // ============================================
  const toggleLevel = (level) => {
    const current = formData.skillLevelApplicable;
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    handleChange('skillLevelApplicable', updated);
  };

  const removeLevel = (level) => {
    const updated = formData.skillLevelApplicable.filter(l => l !== level);
    handleChange('skillLevelApplicable', updated);
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

    const skillData = {
      skillCode: formData.skillCode,
      skillName: formData.skillName,
      skillCategory: formData.skillCategory,
      skillType: formData.skillType,
      parentSkill: formData.parentSkill || null,
      skillLevelApplicable: formData.skillLevelApplicable,
      description: formData.description || '',
      status: formData.status
    };

    if (editingSkill) {
      const updated = skills.map(item =>
        item.id === editingSkill.id
          ? {
            ...item,
            ...skillData,
            modifiedBy: 'Admin',
            modifiedDate: new Date().toISOString()
          }
          : item
      );
      setSkills(updated);
      showToast('success', 'Success', 'Skill updated successfully');
    } else {
      const newSkill = {
        id: Date.now(),
        ...skillData,
        createdBy: 'Admin',
        createdDate: new Date().toISOString(),
        modifiedBy: null,
        modifiedDate: null
      };
      setSkills([newSkill, ...skills]);
      showToast('success', 'Success', 'Skill added successfully');
    }

    resetForm();
    setShowForm(false);
    setPage(0);
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      showToast('warning', 'Cannot Edit', 'Inactive skills cannot be edited');
      return;
    }
    setEditingSkill(item);
    setFormData({
      skillCode: item.skillCode,
      skillName: item.skillName,
      skillCategory: item.skillCategory,
      skillType: item.skillType,
      parentSkill: item.parentSkill || '',
      skillLevelApplicable: item.skillLevelApplicable || [],
      description: item.description || '',
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
      showToast('error', 'Cannot Delete', 'This skill is already in use');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      return;
    }

    const updated = skills.filter(item => item.id !== deleteTarget.id);
    setSkills(updated);
    showToast('success', 'Deleted', `${deleteTarget.skillName} has been deleted`);
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
    const updated = skills.map(item =>
      item.id === id
        ? {
          ...item,
          status: newStatus,
          modifiedBy: 'Admin',
          modifiedDate: new Date().toISOString()
        }
        : item
    );
    setSkills(updated);
    setShowStatusModal(false);
    showToast('success', 'Status Updated', `${statusAction.name} is now ${newStatus}`);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormData(prev => ({ ...prev, skillCode: generateSkillCode() }));
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
          <h1 className="cert-title">Skill Master</h1>
          <p className="cert-subtitle">Manage skills for candidate evaluation and job requirements</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> Add Skill
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
              <div className="cert-section-label">Skill Details</div>
              <div className="cert-form-grid-3col">

                {/* Skill Code - Auto */}
                <div className="cert-field-compact">
                  <label className="required">Skill Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.skillCode}
                    readOnly
                    placeholder="Auto-generated"
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Auto-generated unique identifier
                  </small>
                </div>

                {/* Skill Name - Required */}
                <div className={`cert-field-compact ${touched.skillName && errors.skillName ? 'has-error' : ''}`}>
                  <label className="required">Skill Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Java, React, Leadership"
                    value={formData.skillName}
                    onChange={(e) => handleChange('skillName', e.target.value)}
                    onBlur={() => handleBlur('skillName')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.skillName} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Name displayed across the application
                  </small>
                </div>

                {/* Skill Category - Required */}
                <div className={`cert-field-compact ${touched.skillCategory && errors.skillCategory ? 'has-error' : ''}`}>
                  <label className="required">Skill Category</label>
                  <select
                    value={formData.skillCategory}
                    onChange={(e) => handleChange('skillCategory', e.target.value)}
                    onBlur={() => handleBlur('skillCategory')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Category</option>
                    {skillCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.skillCategory} />
                </div>

                {/* Skill Type - Required */}
                <div className={`cert-field-compact ${touched.skillType && errors.skillType ? 'has-error' : ''}`}>
                  <label className="required">Skill Type</label>
                  <select
                    value={formData.skillType}
                    onChange={(e) => handleChange('skillType', e.target.value)}
                    onBlur={() => handleBlur('skillType')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Type</option>
                    {skillTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.skillType} />
                </div>

                {/* Parent Skill - Searchable Dropdown */}
                <div className="cert-field-compact" ref={parentDropdownRef}>
                  <label>Parent Skill</label>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '0 12px',
                        cursor: 'pointer',
                        background: '#fff',
                        minHeight: '38px'
                      }}
                      onClick={() => setShowParentDropdown(!showParentDropdown)}
                    >
                      <input
                        type="text"
                        placeholder="Search parent skill..."
                        value={parentSkillSearch}
                        onChange={(e) => {
                          setParentSkillSearch(e.target.value);
                          setShowParentDropdown(true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowParentDropdown(!showParentDropdown);
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
                    {showParentDropdown && (
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
                        {filteredParentSkills.length > 0 ? (
                          filteredParentSkills.map(name => (
                            <div
                              key={name}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderBottom: '1px solid #f3f4f6',
                                background: formData.parentSkill === name ? '#fdf2f8' : 'transparent'
                              }}
                              onClick={() => {
                                handleChange('parentSkill', name);
                                setParentSkillSearch(name);
                                setShowParentDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.target.style.background = formData.parentSkill === name ? '#fdf2f8' : 'transparent'}
                            >
                              {name}
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '8px 12px', color: '#6b7280', fontSize: '14px' }}>
                            No skills found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Creates parent-child relationships between skills
                  </small>
                </div>

                {/* Skill Level Applicable - Multi-select */}
                <div className="cert-field-compact" ref={levelDropdownRef}>
                  <label>Skill Level Applicable</label>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '4px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        background: '#fff',
                        minHeight: '38px'
                      }}
                      onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                    >
                      {formData.skillLevelApplicable.length > 0 ? (
                        formData.skillLevelApplicable.map(level => (
                          <span
                            key={level}
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
                            {level}
                            <FaTimesCircle
                              size={12}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLevel(level);
                              }}
                            />
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                          Select levels...
                        </span>
                      )}
                      <FaChevronDown size={12} style={{ color: '#6b7280', marginLeft: 'auto' }} />
                    </div>
                    {showLevelDropdown && (
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
                        {skillLevels.map(level => (
                          <div
                            key={level.value}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              borderBottom: '1px solid #f3f4f6',
                              background: formData.skillLevelApplicable.includes(level.value) ? '#fdf2f8' : 'transparent'
                            }}
                            onClick={() => toggleLevel(level.value)}
                          >
                            <input
                              type="checkbox"
                              checked={formData.skillLevelApplicable.includes(level.value)}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            {level.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Indicates which proficiency levels apply to this skill
                  </small>
                </div>

                {/* Description - Text Area */}
                <div className="cert-field-compact" style={{ gridColumn: 'span 2' }}>
                  <label>Description</label>
                  <textarea
                    rows="3"
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
                    Additional information about the skill
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
                <FaSave size={12} /> {editingSkill ? 'Update' : 'Save'}
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
                placeholder="Search by code, name, category, type or description..."
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
                    <th>Skill Code</th>
                    <th>Skill Name</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Parent</th>
                    <th>Levels</th>
                        <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSkills.length > 0 ? (
                    currentSkills.map((item, idx) => (
                      <tr key={item.id} className="cert-table-row-hover">
                        <td className="text-center">{startIndex + idx + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                            {item.skillCode}
                          </span>
                        </td>
                        <td>
                          <strong>{item.skillName}</strong>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{
                            background: '#e0e7ff',
                            color: '#4f46e5',
                            fontSize: '12px',
                            padding: '2px 10px'
                          }}>
                            {item.skillCategory}
                          </span>
                        </td>
                        <td>
                          <span className="cert-status-badge" style={{
                            background: '#d1fae5',
                            color: '#065f46',
                            fontSize: '12px',
                            padding: '2px 10px'
                          }}>
                            {item.skillType}
                          </span>
                        </td>
                        <td>
                          {item.parentSkill ? (
                            <span style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              fontSize: '12px',
                              padding: '2px 10px',
                              borderRadius: '12px'
                            }}>
                              {item.parentSkill}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(item.skillLevelApplicable || []).map(level => (
                              <span
                                key={level}
                                style={{
                                  background: '#fdf2f8',
                                  color: '#9d174d',
                                  fontSize: '10px',
                                  padding: '1px 8px',
                                  borderRadius: '10px',
                                  fontWeight: '500'
                                }}
                              >
                                {level}
                              </span>
                            ))}
                            {(!item.skillLevelApplicable || item.skillLevelApplicable.length === 0) && (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                            )}
                          </div>
                        </td>
                        <td> <span style={{ fontSize: '13px', color: '#374151' }}>
                               {item.description || '—'} </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            className="d-flex align-items-center justify-content-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleStatusToggle(
                              item.id,
                              item.skillName,
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
                        No skills found
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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} skills
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
                ? 'Inactive skills cannot be used for new job requirements or candidate evaluations.'
                : 'This skill will become available for selection throughout the HRMS.'}
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

export default SkillMaster;