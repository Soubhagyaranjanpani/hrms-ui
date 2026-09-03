import { useState } from "react";
import {
  FaSearch, FaEdit, FaArrowLeft, FaSave, FaExclamationCircle,
  FaUserPlus, FaTimes, FaTrash
} from "react-icons/fa";
import { toast } from "../components/Toast";

/* ─── Validation Rules ─── */
const RULES = {
  stateName: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s]+$/,
    patternMsg: "Only letters and spaces allowed",
  },
  stateCode: {
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
const INITIAL_STATES = [
  { id: 1, stateName: "Maharashtra", stateCode: "MH", countryId: 1, countryName: "India", status: "y" },
  { id: 2, stateName: "Gujarat", stateCode: "GJ", countryId: 1, countryName: "India", status: "y" },
  { id: 3, stateName: "Rajasthan", stateCode: "RJ", countryId: 1, countryName: "India", status: "y" },
  { id: 4, stateName: "California", stateCode: "CA", countryId: 2, countryName: "United States", status: "y" },
  { id: 5, stateName: "Texas", stateCode: "TX", countryId: 2, countryName: "United States", status: "y" },
  { id: 6, stateName: "New York", stateCode: "NY", countryId: 2, countryName: "United States", status: "y" },
  { id: 7, stateName: "London", stateCode: "LD", countryId: 3, countryName: "United Kingdom", status: "n" },
  { id: 8, stateName: "Manchester", stateCode: "MN", countryId: 3, countryName: "United Kingdom", status: "n" },
  { id: 9, stateName: "New South Wales", stateCode: "NSW", countryId: 4, countryName: "Australia", status: "y" },
  { id: 10, stateName: "Queensland", stateCode: "QLD", countryId: 4, countryName: "Australia", status: "y" },
];

const State = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedState, setSelectedState] = useState(null);

  const [states, setStates] = useState(INITIAL_STATES);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });

  const [formData, setFormData] = useState({ 
    stateName: "", 
    stateCode: "", 
    countryId: "" 
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ─── SEARCH DEBOUNCE ───
  useState(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  // ─── FILTER + SORT ───
  const filteredStates = states
    .filter((s) =>
      s.stateName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.stateCode?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.countryName?.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (a.status === "y" && b.status === "n") return -1;
      if (a.status === "n" && b.status === "y") return 1;
      return 0;
    });

  const totalItems = filteredStates.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentStates = filteredStates.slice(startIndex, startIndex + rowsPerPage);

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
    setFormData({ stateName: "", stateCode: "", countryId: "" });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedState(null);
  };

  // ─── CRUD OPERATIONS ───
  const handleSubmit = (e) => {
    e.preventDefault();

    const errName = validate("stateName", formData.stateName);
    const errCode = validate("stateCode", formData.stateCode);
    setTouched({ stateName: true, stateCode: true });
    setErrors({ stateName: errName, stateCode: errCode });
    
    if (!formData.countryId) {
      toast.warning("Validation Error", "Please select a country");
      return;
    }
    
    if (errName || errCode) {
      toast.warning("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const nameTrimmed = formData.stateName.trim();
      const codeTrimmed = formData.stateCode.trim().toUpperCase();
      const country = COUNTRIES.find(c => c.id === parseInt(formData.countryId));

      if (editMode) {
        // Update
        const updated = states.map((s) =>
          s.id === selectedState.id
            ? { 
                ...s, 
                stateName: nameTrimmed, 
                stateCode: codeTrimmed,
                countryId: parseInt(formData.countryId),
                countryName: country?.name || ""
              }
            : s
        );
        setStates(updated);
        toast.success("Success", "State updated");
      } else {
        // Create
        const newId = Math.max(...states.map(s => s.id)) + 1;
        const newState = {
          id: newId,
          stateName: nameTrimmed,
          stateCode: codeTrimmed,
          countryId: parseInt(formData.countryId),
          countryName: country?.name || "",
          status: "y",
        };
        setStates([...states, newState]);
        toast.success("Success", "State created");
      }

      resetForm();
      setView("list");
      setSubmitting(false);
    }, 500);
  };

  const handleEdit = (state) => {
    if (state.status !== "y") {
      toast.warning("Inactive", "Cannot edit an inactive state");
      return;
    }
    setFormData({ 
      stateName: state.stateName, 
      stateCode: state.stateCode,
      countryId: state.countryId.toString()
    });
    setSelectedState(state);
    setEditMode(true);
    setView("form");
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setStates(states.filter(s => s.id !== id));
      toast.success("Deleted", "State removed");
    }
  };

  const handleStatusToggle = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setStatusAction({ id, newStatus, name });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;
    const updated = states.map((s) =>
      s.id === id ? { ...s, status: newStatus } : s
    );
    setStates(updated);
    toast.success("Status Updated", "State status changed");
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

  if (loading && view === "list" && states.length === 0) {
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
                <h1 className="emp-title">{editMode ? "Edit State" : "Add State"}</h1>
                <p className="emp-subtitle">
                  {editMode ? "Update state information" : "Enter new state details"}
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
                  <h1 className="emp-title">State Directory</h1>
                  <p className="emp-subtitle">{totalItems} total states</p>
                </div>
              </div>
              <button
                className="emp-add-btn"
                onClick={() => {
                  resetForm();
                  setView("form");
                }}
              >
                <FaUserPlus size={13} /> Add State
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
                  placeholder="Search by state name, code or country…"
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
          <th >State Code</th>
          <th>State Name</th>
          <th>Country</th>
          <th style={{ width: 80 }}>Status</th>
          <th style={{ width: 70, textAlign: "center" }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {currentStates.length > 0 ? (
          currentStates.map((state, idx) => (
            <tr key={state.id} className="emp-row">
              <td className="emp-sno">{startIndex + idx + 1}</td>
              <td>{state.stateCode || "—"}</td>
              <td><div className="emp-name">{state.stateName || "—"}</div></td>
              <td>{state.countryName || "—"}</td>
              <td>
                <div
                  onClick={() => handleStatusToggle(state.id, state.status, state.stateName)}
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
                      backgroundColor: state.status === "y" ? "var(--accent-indigo)" : "var(--border-medium)",
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
                        left: state.status === "y" ? "14px" : "2px",
                        transition: "0.2s",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: state.status === "y" ? "var(--accent-indigo)" : "var(--text-muted)",
                    }}
                  >
                    {state.status === "y" ? "Active" : "Inactive"}
                  </span>
                </div>
              </td>
              <td>
                <div className="emp-actions">
                  <button
                    className="emp-act emp-act--edit"
                    onClick={() => handleEdit(state)}
                    title={state.status !== "y" ? "Cannot edit inactive state" : "Edit"}
                    style={{ opacity: state.status !== "y" ? 0.5 : 1 }}
                    disabled={state.status !== "y"}
                  >
                    <FaEdit size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="emp-empty">
             
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
          Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} states
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
                <div className="emp-section-label">State Information</div>
                <div className="emp-form-grid-2col" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {/* State Name */}
                  <div className={`emp-field-compact ${isFieldErr('stateName') ? 'has-error' : ''} ${isFieldOk('stateName') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>State Name <span className="req">*</span></label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., Maharashtra"
                      value={formData.stateName}
                      maxLength={50}
                      onChange={(e) => handleChange('stateName', e.target.value)}
                      onBlur={() => handleBlur('stateName')}
                    />
                    <FieldError msg={errors.stateName} />
                  </div>

                  {/* State Code */}
                  <div className={`emp-field-compact ${isFieldErr('stateCode') ? 'has-error' : ''} ${isFieldOk('stateCode') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>State Code <span className="req">*</span></label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., MH"
                      value={formData.stateCode}
                      maxLength={5}
                      onChange={(e) => handleChange('stateCode', e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('stateCode')}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <FieldError msg={errors.stateCode} />
                  </div>
                </div>

                {/* Country - Full width */}
                <div className="emp-form-grid-2col" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ marginTop: "5px" }}>
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
                    : <><FaSave size={12} /> {editMode ? 'Update State' : 'Create State'}</>
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
                  ? "Inactive states cannot be edited until reactivated."
                  : "Active states will be available for selection."}
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

export default State;