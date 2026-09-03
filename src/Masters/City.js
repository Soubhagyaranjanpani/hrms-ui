import { useState, useEffect } from "react";
import {
  FaSearch, FaEdit, FaArrowLeft, FaSave, FaExclamationCircle,
  FaUserPlus, FaTimes, FaTrash
} from "react-icons/fa";
import { toast } from "../components/Toast";

/* ─── Validation Rules ─── */
const RULES = {
  cityName: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s]+$/,
    patternMsg: "Only letters and spaces allowed",
  },
  cityCode: {
    required: true,
    minLen: 2,
    maxLen: 5,
    pattern: /^[A-Z]+$/,
    patternMsg: "Only uppercase letters allowed",
  },
};

const validate = (field, value) => {
  const r = RULES[field];
  if (!r) return "";
  const v = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (r.required && !v) return "This field is required";
  if (!v && !r.required) return "";
  if (r.minLen && v.length < r.minLen) return `Minimum ${r.minLen} characters`;
  if (r.maxLen && v.length > r.maxLen) return `Maximum ${r.maxLen} characters`;
  if (r.pattern && !r.pattern.test(v)) return r.patternMsg;
  return "";
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const CharCount = ({ value, max }) => {
  const len = (value || "").length;
  const warn = len > max * 0.85;
  return (
    <span className="char-count" style={{ color: warn ? "#f97316" : "#8b92b8" }}>
      {len}/{max}
    </span>
  );
};

// ─── DUMMY COUNTRIES DATA ───
const COUNTRIES = [
  { id: 1, name: "India", code: "IN" },
  { id: 2, name: "United States", code: "US" },
  { id: 3, name: "United Kingdom", code: "GB" },
  { id: 4, name: "Australia", code: "AU" },
  { id: 5, name: "Canada", code: "CA" },
  { id: 6, name: "Germany", code: "DE" },
  { id: 7, name: "France", code: "FR" },
  { id: 8, name: "Japan", code: "JP" },
];

// ─── DUMMY STATES DATA ───
const STATES = [
  { id: 1, name: "Maharashtra", code: "MH", countryId: 1 },
  { id: 2, name: "Gujarat", code: "GJ", countryId: 1 },
  { id: 3, name: "Rajasthan", code: "RJ", countryId: 1 },
  { id: 4, name: "California", code: "CA", countryId: 2 },
  { id: 5, name: "Texas", code: "TX", countryId: 2 },
  { id: 6, name: "New York", code: "NY", countryId: 2 },
  { id: 7, name: "London", code: "LD", countryId: 3 },
  { id: 8, name: "Manchester", code: "MN", countryId: 3 },
  { id: 9, name: "New South Wales", code: "NSW", countryId: 4 },
  { id: 10, name: "Queensland", code: "QLD", countryId: 4 },
];

// ─── DUMMY CITIES DATA ───
const INITIAL_CITIES = [
  { id: 1, cityName: "Mumbai", cityCode: "BOM", stateId: 1, stateName: "Maharashtra", countryId: 1, countryName: "India", status: "y" },
  { id: 2, cityName: "Pune", cityCode: "PUN", stateId: 1, stateName: "Maharashtra", countryId: 1, countryName: "India", status: "y" },
  { id: 3, cityName: "Ahmedabad", cityCode: "AMD", stateId: 2, stateName: "Gujarat", countryId: 1, countryName: "India", status: "y" },
  { id: 4, cityName: "Jaipur", cityCode: "JPR", stateId: 3, stateName: "Rajasthan", countryId: 1, countryName: "India", status: "y" },
  { id: 5, cityName: "Los Angeles", cityCode: "LAX", stateId: 4, stateName: "California", countryId: 2, countryName: "United States", status: "y" },
  { id: 6, cityName: "San Francisco", cityCode: "SFO", stateId: 4, stateName: "California", countryId: 2, countryName: "United States", status: "n" },
  { id: 7, cityName: "Houston", cityCode: "HOU", stateId: 5, stateName: "Texas", countryId: 2, countryName: "United States", status: "y" },
  { id: 8, cityName: "New York City", cityCode: "NYC", stateId: 6, stateName: "New York", countryId: 2, countryName: "United States", status: "y" },
  { id: 9, cityName: "Manchester", cityCode: "MAN", stateId: 8, stateName: "Manchester", countryId: 3, countryName: "United Kingdom", status: "n" },
  { id: 10, cityName: "Sydney", cityCode: "SYD", stateId: 9, stateName: "New South Wales", countryId: 4, countryName: "Australia", status: "y" },
];

const City = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  const [cities, setCities] = useState(INITIAL_CITIES);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });

  const [formData, setFormData] = useState({ 
    cityName: "", 
    cityCode: "", 
    countryId: "",
    stateId: ""
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // ─── FILTERED STATES BASED ON SELECTED COUNTRY ───
  const [filteredStates, setFilteredStates] = useState([]);

  // ─── SEARCH DEBOUNCE ───
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  // ─── UPDATE FILTERED STATES WHEN COUNTRY CHANGES ───
  useEffect(() => {
    if (formData.countryId) {
      const states = STATES.filter(s => s.countryId === parseInt(formData.countryId));
      setFilteredStates(states);
      // Reset stateId if selected state doesn't belong to selected country
      if (formData.stateId) {
        const exists = states.some(s => s.id === parseInt(formData.stateId));
        if (!exists) {
          setFormData(prev => ({ ...prev, stateId: "" }));
        }
      }
    } else {
      setFilteredStates([]);
      setFormData(prev => ({ ...prev, stateId: "" }));
    }
  }, [formData.countryId]);

  // ─── FILTER + SORT ───
  const filteredCities = cities
    .filter((c) =>
      c.cityName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.cityCode?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.stateName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.countryName?.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (a.status === "y" && b.status === "n") return -1;
      if (a.status === "n" && b.status === "y") return 1;
      return 0;
    });

  const totalItems = filteredCities.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentCities = filteredCities.slice(startIndex, startIndex + rowsPerPage);

  // ─── FORM HANDLERS ───
  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, formData[field]) }));
  };

  const resetForm = () => {
    setFormData({ cityName: "", cityCode: "", countryId: "", stateId: "" });
    setErrors({});
    setTouched({});
    setFilteredStates([]);
    setEditMode(false);
    setSelectedCity(null);
  };

  // ─── CRUD OPERATIONS ───
  const handleSubmit = (e) => {
    e.preventDefault();

    const errName = validate("cityName", formData.cityName);
    const errCode = validate("cityCode", formData.cityCode);
    setTouched({ cityName: true, cityCode: true });
    setErrors({ cityName: errName, cityCode: errCode });
    
    if (!formData.countryId) {
      toast.warning("Validation Error", "Please select a country");
      return;
    }
    
    if (!formData.stateId) {
      toast.warning("Validation Error", "Please select a state");
      return;
    }
    
    if (errName || errCode) {
      toast.warning("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const nameTrimmed = formData.cityName.trim();
      const codeTrimmed = formData.cityCode.trim().toUpperCase();
      const country = COUNTRIES.find(c => c.id === parseInt(formData.countryId));
      const state = STATES.find(s => s.id === parseInt(formData.stateId));

      if (editMode) {
        // Update
        const updated = cities.map((c) =>
          c.id === selectedCity.id
            ? { 
                ...c, 
                cityName: nameTrimmed, 
                cityCode: codeTrimmed,
                countryId: parseInt(formData.countryId),
                countryName: country?.name || "",
                stateId: parseInt(formData.stateId),
                stateName: state?.name || ""
              }
            : c
        );
        setCities(updated);
        toast.success("Success", "City updated");
      } else {
        // Create
        const newId = Math.max(...cities.map(c => c.id)) + 1;
        const newCity = {
          id: newId,
          cityName: nameTrimmed,
          cityCode: codeTrimmed,
          countryId: parseInt(formData.countryId),
          countryName: country?.name || "",
          stateId: parseInt(formData.stateId),
          stateName: state?.name || "",
          status: "y",
        };
        setCities([...cities, newCity]);
        toast.success("Success", "City created");
      }

      resetForm();
      setView("list");
      setSubmitting(false);
    }, 500);
  };

  const handleEdit = (city) => {
    if (city.status !== "y") {
      toast.warning("Inactive", "Cannot edit an inactive city");
      return;
    }
    setFormData({ 
      cityName: city.cityName, 
      cityCode: city.cityCode,
      countryId: city.countryId.toString(),
      stateId: city.stateId.toString()
    });
    // Set filtered states for the selected country
    const states = STATES.filter(s => s.countryId === city.countryId);
    setFilteredStates(states);
    setSelectedCity(city);
    setEditMode(true);
    setView("form");
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setCities(cities.filter(c => c.id !== id));
      toast.success("Deleted", "City removed");
    }
  };

  const handleStatusToggle = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setStatusAction({ id, newStatus, name });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;
    const updated = cities.map((c) =>
      c.id === id ? { ...c, status: newStatus } : c
    );
    setCities(updated);
    toast.success("Status Updated", "City status changed");
    setShowStatusModal(false);
    setStatusAction({ id: null, newStatus: null, name: "" });
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) {
      range.push(0);
      if (left > 1) range.push("...");
    }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) {
      if (right < totalPages - 2) range.push("...");
      range.push(totalPages - 1);
    }
    return range;
  };

  const isFieldOk = (f) => touched[f] && !errors[f] && formData[f]?.trim();
  const isFieldErr = (f) => touched[f] && !!errors[f];

  if (loading && view === "list" && cities.length === 0) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <>
      <div className="emp-root">
        {/* Header */}
        <div className="emp-header" style={view === "form" ? { justifyContent: "space-between" } : {}}>
          {view === "form" ? (
            <>
              <div>
                <h1 className="emp-title">{editMode ? "Edit City" : "Add City"}</h1>
                <p className="emp-subtitle">
                  {editMode ? "Update city information" : "Enter new city details"}
                </p>
              </div>
              <button
                className="emp-back-btn"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
              >
                <FaArrowLeft size={12} /> Back
              </button>
            </>
          ) : (
            <>
              <div className="emp-header-left">
                <div>
                  <h1 className="emp-title">City Directory</h1>
                  <p className="emp-subtitle">{totalItems} total cities</p>
                </div>
              </div>
              <button
                className="emp-add-btn"
                onClick={() => {
                  resetForm();
                  setView("form");
                }}
              >
                <FaUserPlus size={13} /> Add City
              </button>
            </>
          )}
        </div>

        {/* LIST VIEW */}
        {view === "list" ? (
          <>
            <div className="emp-search-bar">
              <div className="emp-search-wrap">
                <FaSearch className="emp-search-icon" size={12} />
                <input
                  className="emp-search-input"
                  type="text"
                  placeholder="Search by city name, code, state or country…"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
                {searchName && (
                  <button className="emp-search-clear" onClick={() => setSearchName("")}>
                    <FaTimes size={11} />
                  </button>
                )}
              </div>
            </div>

           <div className="emp-table-card">
  <div className="emp-table-wrap">
    <table className="emp-table">
      <thead>
        <tr>
          <th style={{ width: 44 }}>#</th>
          <th>City Code</th>
          <th>City Name</th>
          <th>State</th>
          <th>Country</th>
          <th style={{ width: 80 }}>Status</th>
          <th style={{ width: 100, textAlign: "center" }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {currentCities.length > 0 ? (
          currentCities.map((city, idx) => (
            <tr key={city.id} className="emp-row">
              <td className="emp-sno">{startIndex + idx + 1}</td>
               <td>                  {city.cityCode || "—"}
                
              </td>
              <td>
                <div className="emp-name">{city.cityName || "—"}</div>
              </td>
             
              <td>
                <div>
                  {city.stateName || "—"}
                </div>
              </td>
              <td>
                <div>
                  {city.countryName || "—"}
                </div>
              </td>
              <td>
                <div
                  onClick={() => handleStatusToggle(city.id, city.status, city.cityName)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "16px",
                      borderRadius: "50px",
                      backgroundColor: city.status === "y" ? "var(--accent-indigo)" : "var(--border-medium)",
                      position: "relative",
                      transition: "0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        position: "absolute",
                        top: "2px",
                        left: city.status === "y" ? "14px" : "2px",
                        transition: "0.2s",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: city.status === "y" ? "var(--accent-indigo)" : "var(--text-muted)",
                    }}
                  >
                    {city.status === "y" ? "Active" : "Inactive"}
                  </span>
                </div>
              </td>
              <td>
                <div className="emp-actions" style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                  <button
                    className="emp-act emp-act--edit"
                    onClick={() => handleEdit(city)}
                    title={city.status !== "y" ? "Cannot edit inactive city" : "Edit"}
                    style={{ opacity: city.status !== "y" ? 0.5 : 1 }}
                    disabled={city.status !== "y"}
                  >
                    <FaEdit size={12} />
                  </button>
                  
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="emp-empty">
              <div className="emp-empty-inner">
                <span className="emp-empty-icon">🏙️</span>
                <p>No cities found</p>
                <small>Try a different search or add a new city</small>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {totalItems > 0 && (
    <div className="emp-pagination" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span className="emp-page-info">
          Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} cities
        </span>
      </div>
      <div className="emp-page-controls">
        <button className="emp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
        {getPaginationRange().map((pg, i) =>
          pg === "..." ? (
            <span key={`dots-${i}`} className="emp-page-dots">…</span>
          ) : (
            <button key={pg} className={`emp-page-num ${pg === page ? "active" : ""}`} onClick={() => setPage(pg)}>
              {pg + 1}
            </button>
          )
        )}
        <button className="emp-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </div>
  )}
</div>
          </>
        ) : (
          /* ─── FORM VIEW ─── */
          <div className="emp-form-wrap">
            <form onSubmit={handleSubmit} noValidate className="emp-form-compact">
              <div className="emp-form-section-compact">
                <div className="emp-section-label">City Information</div>
                
                {/* City Name & Code */}
                <div className="emp-form-grid-2col" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {/* City Name */}
                  <div className={`emp-field-compact ${isFieldErr('cityName') ? 'has-error' : ''} ${isFieldOk('cityName') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>City Name <span className="req">*</span></label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai"
                      value={formData.cityName}
                      maxLength={50}
                      onChange={(e) => handleChange('cityName', e.target.value)}
                      onBlur={() => handleBlur('cityName')}
                    />
                    <FieldError msg={errors.cityName} />
                  </div>

                  {/* City Code */}
                  <div className={`emp-field-compact ${isFieldErr('cityCode') ? 'has-error' : ''} ${isFieldOk('cityCode') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>City Code <span className="req">*</span></label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., BOM"
                      value={formData.cityCode}
                      maxLength={5}
                      onChange={(e) => handleChange('cityCode', e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('cityCode')}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <FieldError msg={errors.cityCode} />
                  </div>
                </div>

                {/* Country & State - 2 column */}
                <div className="emp-form-grid-2col" style={{ gridTemplateColumns: "1fr 1fr", marginTop: "12px" }}>
                  {/* Country */}
                  <div className={`emp-field-compact ${!formData.countryId ? 'has-error' : 'has-ok'}`}>
                    <div className="emp-label-row">
                      <label>Country <span className="req">*</span></label>
                    </div>
                    <select
                      value={formData.countryId}
                      onChange={(e) => handleChange('countryId', e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                        backgroundColor: "#fff",
                      }}
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                    {!formData.countryId && touched.countryId && (
                      <span className="field-err">
                        <FaExclamationCircle size={10} /> Please select a country
                      </span>
                    )}
                  </div>

                  {/* State */}
                  <div className={`emp-field-compact ${!formData.stateId ? 'has-error' : 'has-ok'}`}>
                    <div className="emp-label-row">
                      <label>State <span className="req">*</span></label>
                    </div>
                    <select
                      value={formData.stateId}
                      onChange={(e) => handleChange('stateId', e.target.value)}
                      disabled={!formData.countryId}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "13px",
                        backgroundColor: !formData.countryId ? "#f1f5f9" : "#fff",
                        cursor: !formData.countryId ? "not-allowed" : "default",
                      }}
                    >
                      <option value="">{formData.countryId ? "Select State" : "Select Country First"}</option>
                      {filteredStates.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name} ({state.code})
                        </option>
                      ))}
                    </select>
                    {!formData.stateId && touched.stateId && (
                      <span className="field-err">
                        <FaExclamationCircle size={10} /> Please select a state
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="emp-form-actions">
                <button type="button" className="emp-cancel-btn" onClick={() => { resetForm(); setView('list'); }}>
                  Cancel
                </button>
                <button type="submit" className="emp-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {submitting
                    ? <><span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</>
                    : <><FaSave size={12} /> {editMode ? 'Update City' : 'Create City'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Status Confirmation Modal */}
        {showStatusModal && (
          <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
            <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="emp-modal-icon">{statusAction.newStatus === "y" ? "✅" : "⛔"}</div>
              <h3 className="emp-modal-title">Confirm Status Change</h3>
              <p className="emp-modal-body">
                Are you sure you want to <strong>{statusAction.newStatus === "y" ? "activate" : "deactivate"}</strong>{" "}
                <strong>{statusAction.name}</strong>?
              </p>
              <p className="emp-modal-warn">
                {statusAction.newStatus === "n"
                  ? "Inactive cities cannot be edited until reactivated."
                  : "Active cities will be available for selection."}
              </p>
              <div className="emp-modal-actions">
                <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default City;