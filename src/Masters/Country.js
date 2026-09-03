import { useState } from "react";
import {
  FaSearch, FaEdit, FaArrowLeft, FaSave, FaExclamationCircle,
  FaUserPlus, FaTimes, FaTrash
} from "react-icons/fa";
import { toast } from "../components/Toast";

/* ─── Validation Rules ─── */
const RULES = {
  countryName: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s]+$/,
    patternMsg: "Only letters and spaces allowed",
  },
  countryCode: {
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

// ─── DUMMY DATA ───
const INITIAL_COUNTRIES = [
  { id: 1, countryName: "India", countryCode: "IN", status: "y" },
  { id: 2, countryName: "United States", countryCode: "US", status: "y" },
  { id: 3, countryName: "United Kingdom", countryCode: "GB", status: "y" },
  { id: 4, countryName: "Australia", countryCode: "AU", status: "y" },
  { id: 5, countryName: "Canada", countryCode: "CA", status: "y" },
  { id: 6, countryName: "Germany", countryCode: "DE", status: "n" },
  { id: 7, countryName: "France", countryCode: "FR", status: "n" },
  { id: 8, countryName: "Japan", countryCode: "JP", status: "y" },
  { id: 9, countryName: "China", countryCode: "CN", status: "n" },
  { id: 10, countryName: "Brazil", countryCode: "BR", status: "y" },
];

const Country = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const [countries, setCountries] = useState(INITIAL_COUNTRIES);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });

  const [formData, setFormData] = useState({ countryName: "", countryCode: "" });
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
  const filteredCountries = countries
    .filter((c) =>
      c.countryName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.countryCode?.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (a.status === "y" && b.status === "n") return -1;
      if (a.status === "n" && b.status === "y") return 1;
      return 0;
    });

  const totalItems = filteredCountries.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentCountries = filteredCountries.slice(startIndex, startIndex + rowsPerPage);

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
    setFormData({ countryName: "", countryCode: "" });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedCountry(null);
  };

  // ─── CRUD OPERATIONS ───
  const handleSubmit = (e) => {
    e.preventDefault();

    const errName = validate("countryName", formData.countryName);
    const errCode = validate("countryCode", formData.countryCode);
    setTouched({ countryName: true, countryCode: true });
    setErrors({ countryName: errName, countryCode: errCode });
    if (errName || errCode) {
      toast.warning("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const nameTrimmed = formData.countryName.trim();
      const codeTrimmed = formData.countryCode.trim().toUpperCase();

      if (editMode) {
        // Update
        const updated = countries.map((c) =>
          c.id === selectedCountry.id
            ? { ...c, countryName: nameTrimmed, countryCode: codeTrimmed }
            : c
        );
        setCountries(updated);
        toast.success("Success", "Country updated");
      } else {
        // Create
        const newId = Math.max(...countries.map(c => c.id)) + 1;
        const newCountry = {
          id: newId,
          countryName: nameTrimmed,
          countryCode: codeTrimmed,
          status: "y",
        };
        setCountries([...countries, newCountry]);
        toast.success("Success", "Country created");
      }

      resetForm();
      setView("list");
      setSubmitting(false);
    }, 500);
  };

  const handleEdit = (country) => {
    if (country.status !== "y") {
      toast.warning("Inactive", "Cannot edit an inactive country");
      return;
    }
    setFormData({ countryName: country.countryName, countryCode: country.countryCode });
    setSelectedCountry(country);
    setEditMode(true);
    setView("form");
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setCountries(countries.filter(c => c.id !== id));
      toast.success("Deleted", "Country removed");
    }
  };

  const handleStatusToggle = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setStatusAction({ id, newStatus, name });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus } = statusAction;
    const updated = countries.map((c) =>
      c.id === id ? { ...c, status: newStatus } : c
    );
    setCountries(updated);
    toast.success("Status Updated", "Country status changed");
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

  if (loading && view === "list" && countries.length === 0) {
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
                <h1 className="emp-title">{editMode ? "Edit Country" : "Add Country"}</h1>
                <p className="emp-subtitle">
                  {editMode ? "Update country information" : "Enter new country details"}
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
                  <h1 className="emp-title">Country Directory</h1>
                  <p className="emp-subtitle">{totalItems} total countries</p>
                </div>
              </div>
              <button
                className="emp-add-btn"
                onClick={() => {
                  resetForm();
                  setView("form");
                }}
              >
                <FaUserPlus size={13} /> Add Country
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
                  placeholder="Search by country name or code…"
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
          <th >Country Code</th>
          <th>Country Name</th>
          <th style={{ width: 80 }}>Status</th>
          <th style={{ width: 100, textAlign: "center" }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {currentCountries.length > 0 ? (
          currentCountries.map((country, idx) => (
            <tr key={country.id} className="emp-row">
              <td className="emp-sno">{startIndex + idx + 1}</td>
               <td>
                <div>
                  {country.countryCode || "—"}
                </div>
              </td>
              <td>
                <div className="emp-name">{country.countryName || "—"}</div>
              </td>
             
              <td>
                <div
                  onClick={() => handleStatusToggle(country.id, country.status, country.countryName)}
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
                      backgroundColor: country.status === "y" ? "var(--accent-indigo)" : "var(--border-medium)",
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
                        left: country.status === "y" ? "14px" : "2px",
                        transition: "0.2s",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "500",
                      color: country.status === "y" ? "var(--accent-indigo)" : "var(--text-muted)",
                    }}
                  >
                    {country.status === "y" ? "Active" : "Inactive"}
                  </span>
                </div>
              </td>
              <td>
                <div className="emp-actions" style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                  <button
                    className="emp-act emp-act--edit"
                    onClick={() => handleEdit(country)}
                    title={country.status !== "y" ? "Cannot edit inactive country" : "Edit"}
                    style={{ opacity: country.status !== "y" ? 0.5 : 1 }}
                    disabled={country.status !== "y"}
                  >
                    <FaEdit size={12} />
                  </button>
                 
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="emp-empty">
              
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
          Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} countries
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
                <div className="emp-section-label">Country Information</div>
                <div className="emp-form-grid-2col" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {/* Country Name */}
                  <div className={`emp-field-compact ${isFieldErr('countryName') ? 'has-error' : ''} ${isFieldOk('countryName') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>Country Name <span className="req">*</span></label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., India"
                      value={formData.countryName}
                      maxLength={50}
                      onChange={(e) => handleChange('countryName', e.target.value)}
                      onBlur={() => handleBlur('countryName')}
                    />
                    <FieldError msg={errors.countryName} />
                  </div>

                  {/* Country Code */}
                  <div className={`emp-field-compact ${isFieldErr('countryCode') ? 'has-error' : ''} ${isFieldOk('countryCode') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>Country Code <span className="req">*</span></label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g., IN"
                      value={formData.countryCode}
                      maxLength={5}
                      onChange={(e) => handleChange('countryCode', e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('countryCode')}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <FieldError msg={errors.countryCode} />
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
                    : <><FaSave size={12} /> {editMode ? 'Update Country' : 'Create Country'}</>
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
                  ? "Inactive countries cannot be edited until reactivated."
                  : "Active countries will be available for selection."}
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

export default Country;