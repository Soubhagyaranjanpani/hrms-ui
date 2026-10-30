import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit,
  FaArrowLeft, FaExclamationCircle, FaChevronDown, FaBuilding,
  FaCity, FaGlobe
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../../config/api.config';


const JobLocationMaster = () => {
  // ============================================
  // STATE
  // ============================================
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const [branches, setBranches] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [workModes, setWorkModes] = useState([]);


  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: '',
    newStatus: ''
  });

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
  // AUTH HELPERS
  // ============================================
  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  };

  const ensureToken = () => {
    if (!getAuthToken()) {
      toast.error('Authentication Required', 'Please login to continue');
      return false;
    }
    return true;
  };

  // ============================================
  // FETCH LOCATIONS
  // ============================================
  const fetchLocations = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/recuirment/getAllJobLocation`,
        axiosConfig
      );
      const list = Array.isArray(res.data) ? res.data : (res.data?.response || []);

      const mapped = list.map((item) => {
        const isActive =
          String(item.status ?? '').toLowerCase() === 'y' ||
          item.status === true ||
          String(item.status ?? '').toLowerCase() === 'active';
        return {
          id: item.id,
          locationCode: item.locationCode || '',
          locationName: item.locationName || '',
          branch: item.branch || item.branchName || '',
          city: item.city || '',
          state: item.state || '',
          country: item.country || '',
          pinCode: item.pinCode || '',
          workMode: item.workMode || '',
          description: item.description || '',
          status: isActive ? 'Active' : 'Inactive',
          createdBy: item.createdBy || '—',
          createdDate: item.createdDate || null,
          modifiedBy: item.modifiedBy || null,
          modifiedDate: item.modifiedDate || null
        };
      });

      setLocations(mapped);
      console.log('🔵 [fetchLocations] response:', res);
    } catch (err) {
      console.error('🔴 [fetchLocations] error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to fetch job locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);



  // dropdown

  const fetchBranches = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/branches/list?flag=1`,
        axiosConfig
      );

      setBranches(res.data.response || []);

    } catch (err) {
      console.error('🔴 [fetchBranches] error:', err);
      toast.error('Error', err.response?.response?.message || 'Failed to fetch branches');
      setBranches([]);
    }
  }, []);


  const fetchCountries = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/api/recuirment/fetchallCountry`,
        axiosConfig
      );

      setCountries(res.data || []);

    } catch (err) {
      console.error('🔴 [fetchCountries] error:', err);
      toast.error('Error', err.response?.message || 'Failed to fetch countries');
      setCountries([]);
    }
  }, []);

  const fetchStates = useCallback(async (id) => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/api/recuirment/getStateByCountryId/${id}`,
        axiosConfig
      );

      setStates(res.data || []);

    } catch (err) {
      console.error('🔴 [fetchStates] error:', err);
      toast.error('Error', err.response?.response?.message || 'Failed to fetch states');
      setStates([]);
    }
  }, []);


  const fetchCities = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/api/recuirment/getAllCity`,
        axiosConfig
      );

      setCities(res.data|| []);

    } catch (err) {
      console.error('🔴 [fetchCities] error:', err);
      toast.error('Error', err.response?.response?.message || 'Failed to fetch cities');
      setCities([]);
    }
  }, []);


  const fetchWorkModes = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(
        `${BASE_URL}/api/recuirment/getAllWorkMode`,
        axiosConfig
      );

      setWorkModes(res.data || []);

    } catch (err) {
      console.error('🔴 [fetchWorkModes] error:', err);
      toast.error('Error', err.response?.response?.message || 'Failed to fetch work modes');
      setWorkModes([]);
    }
  }, []);


  console.log('🔵 [formData]', formData);



  useEffect(() => {
    fetchLocations();
    fetchBranches();
    fetchCountries();
    fetchWorkModes();
  }, [fetchLocations, fetchBranches, fetchCountries,fetchWorkModes]);



  // ============================================
  // DEBOUNCED SEARCH
  // ============================================
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Click outside for branch dropdown
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
  // FILTERED + PAGINATED
  // ============================================
  const filteredLocations = locations
    .filter((item) => {
      const search = debouncedSearch.toLowerCase();
      return (
        item.locationCode?.toLowerCase().includes(search) ||
        item.locationName?.toLowerCase().includes(search) ||
        item.branch?.toLowerCase().includes(search) ||
        item.city?.toLowerCase().includes(search) ||
        item.state?.toLowerCase().includes(search) ||
        item.country?.toLowerCase().includes(search) ||
        item.pinCode?.includes(search) ||
        item.workMode?.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      if (a.status === 'Active' && b.status === 'Inactive') return -1;
      if (a.status === 'Inactive' && b.status === 'Active') return 1;
      return 0;
    });

  const totalItems = filteredLocations.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLocations = filteredLocations.slice(startIndex, startIndex + rowsPerPage);


  // ============================================
  // UTILITIES
  // ============================================
  const generateLocationCode = () =>
    `LOC${String(locations.length + 1).padStart(3, '0')}`;

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) {
      if (right < totalPages - 2) range.push('...');
      range.push(totalPages - 1);
    }
    return range;
  };

  // ============================================
  // FORM HANDLERS
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
    if (touched[field]) validateField(field, value);
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
        const duplicate = locations.some(
          (item) =>
            item.locationName.toLowerCase() === value.toLowerCase() &&
            (!editingLocation || item.id !== editingLocation.id)
        );
        if (duplicate) error = 'Location Name must be unique';
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
      if (!value) error = 'PIN Code is required';
      else if (!/^\d{6}$/.test(value)) error = 'PIN Code must be exactly 6 digits';
    } else if (field === 'workMode' && !value) {
      error = 'Work Mode is required';
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = [
      'locationName', 'branch', 'city', 'state', 'country', 'pinCode', 'workMode'
    ];
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
        const duplicate = locations.some(
          (item) =>
            item.locationName.toLowerCase() === formData.locationName.toLowerCase() &&
            (!editingLocation || item.id !== editingLocation.id)
        );
        if (duplicate) newErrors.locationName = 'Location Name must be unique';
      }
    }

    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = 'PIN Code must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // SUBMIT (Create / Update)
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    try {
      // ✅ Payload matches backend DTO
      const payload = {
        id: editingLocation ? editingLocation.id : 0,
        locationCode: formData.locationCode,
        locationName: formData.locationName.trim(),
        branchId: formData.branch,
        cityId: formData.city,
        stateId: formData.state,
        countryId: formData.country,
        pinCode: formData.pinCode,
        workModeId: formData.workMode,
        description: formData.description?.trim() || '',
        status: 'y'
      };

      console.log('🔵 [submit] payload:', payload);

      let res;
      if (editingLocation) {
        res = await axios.put(
          `${BASE_URL}/api/recuirment/updateJobLocationById/${editingLocation.id}`,
          payload,
          axiosConfig
        );
      } else {
        res = await axios.post(
          `${BASE_URL}/api/recuirment/saveLocation`,
          payload,
          axiosConfig
        );
      }

      if (res.status === 200 || res.status === 201) {
        toast.success(
          'Success',
          editingLocation ? 'Job location updated successfully' : 'Job location created successfully'
        );
        resetForm();
        setShowForm(false);
        setPage(0);
        fetchLocations();
      } else {
        throw new Error(res.data?.message || 'Operation failed');
      }
    } catch (err) {
      console.error('🔴 [submit] error:', err);
      toast.error(
        'Error',
        err.response?.data?.message || err.message || 'Something went wrong'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    if (item.status === 'Inactive') {
      toast.warning('Cannot Edit', 'Inactive locations cannot be edited');
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

  const handleAddNew = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, locationCode: generateLocationCode() }));
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // ============================================
  // STATUS TOGGLE
  // ============================================
  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setStatusAction({ id, name, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    const { id, newStatus, name } = statusAction;
    setLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/recuirment/updateJobLocationStatus/${id}`,
        { status: newStatus === 'Active' ? 'y' : 'n' },
        axiosConfig
      );

      if (res.status === 200) {
        toast.success('Status Updated', `${name} is now ${newStatus}`);
        fetchLocations();
      } else {
        throw new Error(res.data?.message || 'Failed to change status');
      }
    } catch (err) {
      console.error('🔴 [statusToggle] error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to change status');
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, name: '', newStatus: '' });
    }
  };

  // ============================================
  // RENDER GUARD
  // ============================================
  if (loading && !showForm && locations.length === 0) {
    return <LoadingSpinner message="Loading job locations..." />;
  }

  return (
    <div className="cert-root">
      {/* HEADER */}
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
        /* ================= FORM ================= */
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
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Auto-generated</small>
                </div>

                {/* Location Name */}
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
                    Max 100 characters, no special characters
                  </small>
                </div>

                <div className={`cert-field-compact ${touched.locationName && errors.locationName ? 'has-error' : ''}`}>
                  <label className="required">Branch</label>
                  <select
                    value={formData.branch ?? ''}
                    onChange={(e) =>
                      handleChange(
                        'branch',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    onBlur={() => handleBlur('branch')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Branch</option>

                    {branches.map((branch) => (
                      <option key={branch.id} value={Number(branch.id)}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.branch} />
                </div>

                {/* Country */}
                <div className={`cert-field-compact ${touched.locationName && errors.locationName ? 'has-error' : ''}`}>
                  <label className="required">Country</label>
                  <select
                    value={formData.country ?? ''}


                    onChange={(e) => {
                      const value = e.target.value;
                      const country = value === '' ? '' : Number(value);

                      handleChange('country', country);
                      fetchStates(country);
                    }}
                    onBlur={() => handleBlur('country')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Country</option>

                    {countries.map((country) => (
                      <option key={country.id} value={Number(country.id)}>
                        {country.countryName}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.country} />
                </div>

                {/* State */}
                <div className={`cert-field-compact ${touched.state && errors.state ? 'has-error' : ''}`}>
                  <label className="required">State</label>
                  <select
                    value={formData.state}

                    onChange={(e) => {
                      const value = e.target.value;
                      const state = value === '' ? '' : Number(value);

                      handleChange('state', state);
                      fetchCities(state);
                    }}

                    onBlur={() => handleBlur('state')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.stateName}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.state} />
                </div>

                {/* City */}
                <div className={`cert-field-compact ${touched.city && errors.city ? 'has-error' : ''}`}>
                  <label className="required">City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => {
                      const value = e.target.value;
                      const city = value === '' ? '' : Number(value);

                      handleChange('city', city);
                    }}
                    onBlur={() => handleBlur('city')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.cityName}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.city} />
                </div>

                {/* PIN Code */}
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
                </div>

                {/* Work Mode */}
                <div className={`cert-field-compact ${touched.workMode && errors.workMode ? 'has-error' : ''}`}>
                  <label className="required">Work Mode</label>
                  <select
                    value={formData.workMode}
                    onChange={(e) => handleChange('workMode', e.target.value)}
                    onBlur={() => handleBlur('workMode')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Work Mode</option>
                    {workModes.map((mode) => (
                      <option key={mode.id} value={mode.id}>{mode.workModeName}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.workMode} />
                </div>

                {/* Description */}
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
                </div>

              </div>
            </div>

            {/* Form Actions */}
            <div className="cert-form-actions">
              <button type="button" className="cert-cancel-btn" onClick={handleBackToList}>
                <FaTimes size={12} /> Cancel
              </button>
              <button
                type="submit"
                className="cert-add-btn"
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {submitting ? (
                  <><span className="emp-spinner" /> Saving…</>
                ) : (
                  <><FaSave size={12} /> {editingLocation ? 'Update' : 'Save'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= TABLE ================= */
        <>
          {/* Search Bar */}
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by code, name, branch, city, state, country, PIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '14px', padding: '6px 12px' }}
              />
              {searchTerm && (
                <button className="emp-search-clear" onClick={() => setSearchTerm('')}>
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
                    <th>Country</th>
                    <th>State</th>
                    <th>City</th>
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
                        <td><strong>{item.locationName}</strong></td>
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
                            <FaGlobe size={11} style={{ color: '#6b7280' }} />
                            {item.country}
                          </span>
                        </td>
                        <td>{item.state}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaCity size={11} style={{ color: '#6b7280' }} />
                            {item.city}
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
                            onClick={() => handleStatusToggle(item.id, item.locationName, item.status)}
                          >
                            <div style={{
                              width: '28px',
                              height: '16px',
                              borderRadius: '50px',
                              backgroundColor: item.status === 'Active' ? '#9d174d' : '#d1d5db',
                              position: 'relative',
                              transition: '.2s'
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#fff',
                                position: 'absolute',
                                top: '2px',
                                left: item.status === 'Active' ? '14px' : '2px',
                                transition: '.2s'
                              }} />
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              color: item.status === 'Active' ? '#9d174d' : '#94a3b8'
                            }}>
                              {item.status}
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
            {totalItems > 0 && (
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
                      <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button
                        key={pg}
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

      {/* STATUS CHANGE MODAL */}
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

// ============================================
// FIELD ERROR COMPONENT
// ============================================
const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

export default JobLocationMaster;