import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaEdit, FaArrowLeft, FaSave, FaExclamationCircle,
  FaUserPlus, FaTimes
} from "react-icons/fa";
import axios from "axios";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { BASE_URL, STORAGE_KEYS } from "../config/api.config";

/* ─── Validation Rules ─── */
const RULES = {
  designationName: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s]+$/,
    patternMsg: "Only letters and spaces allowed",
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

const Designation = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState(null);

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });

  const [formData, setFormData] = useState({ designationName: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  };

  const ensureToken = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication Required", "Please login to continue");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  const fetchDesignations = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/designations/list?flag=0`, axiosConfig);
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        const mapped = res.data.response.map((d) => ({
          id: d.id,
          designationName: d.name || d.designationName || "",
          status: (d.isActive === true || d.active === true || d.status === "y") ? "y" : "n",
        }));
        setDesignations(mapped);
      } else {
        setDesignations([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error", err.response?.data?.message || "Failed to fetch designations");
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const filteredDesignations = designations.filter((d) =>
    d.designationName?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  const totalItems = filteredDesignations.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentDesignations = filteredDesignations.slice(startIndex, startIndex + rowsPerPage);

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
    setFormData({ designationName: "" });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedDesignation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    const err = validate("designationName", formData.designationName);
    setTouched({ designationName: true });
    setErrors({ designationName: err });
    if (err) {
      toast.warning("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const nameTrimmed = formData.designationName.trim();
      let url, method, payload;

      if (editMode) {
        url = `${BASE_URL}/api/designations/update`;
        method = axios.put;
        payload = { id: selectedDesignation.id, name: nameTrimmed };
      } else {
        url = `${BASE_URL}/api/designations/create`;
        method = axios.post;
        payload = { name: nameTrimmed };
      }

      const res = await method(url, payload, axiosConfig);
      if (res.data?.status === 200) {
        toast.success("Success", editMode ? "Designation updated" : "Designation created");
        resetForm();
        setView("list");
        fetchDesignations();
      } else {
        throw new Error(res.data?.message || "Operation failed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Error", err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (designation) => {
    if (designation.status !== "y") {
      toast.warning("Inactive", "Cannot edit an inactive designation");
      return;
    }
    setFormData({ designationName: designation.designationName });
    setSelectedDesignation(designation);
    setEditMode(true);
    setView("form");
  };

  const handleStatusToggle = (id, currentStatus, name) => {
    const newStatus = currentStatus === "y" ? "n" : "y";
    setStatusAction({ id, newStatus, name });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    const { id } = statusAction;
    setLoading(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/designations/status/${id}`, null, axiosConfig);
      if (res.data?.status === 200) {
        toast.success("Status Updated", "Designation status changed");
        fetchDesignations();
      } else {
        throw new Error(res.data?.message || "Status change failed");
      }
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to change status");
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, newStatus: null, name: "" });
    }
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

  if (loading && view === "list" && designations.length === 0) {
    return <LoadingSpinner message="Loading designations..." />;
  }

  return (
    <>
      <div className="emp-root">
        {/* Header */}
        <div className="emp-header" style={view === "form" ? { justifyContent: "space-between" } : {}}>
          {view === "form" ? (
            <>
              <div>
                <h1 className="emp-title">{editMode ? "Edit Designation" : "Add Designation"}</h1>
                <p className="emp-subtitle">
                  {editMode ? "Update designation information" : "Enter new designation details"}
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
                  <h1 className="emp-title">Designation Directory</h1>
                  <p className="emp-subtitle">{totalItems} total designations</p>
                </div>
              </div>
              <button
                className="emp-add-btn"
                onClick={() => {
                  resetForm();
                  setView("form");
                }}
              >
                <FaUserPlus size={13} /> Add Designation
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
                  placeholder="Search by designation name…"
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
                      <th>Designation Name</th>
                      <th style={{ width: 100 }}>Status</th>
                      <th style={{ width: 70, textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDesignations.length > 0 ? (
                      currentDesignations.map((designation, idx) => (
                        <tr key={designation.id} className="emp-row">
                          <td className="emp-sno">{startIndex + idx + 1}</td>
                          <td>
                            <div className="emp-name">{designation.designationName || "—"}</div>
                          </td>
                          <td>
                            <div
                              onClick={() => handleStatusToggle(designation.id, designation.status, designation.designationName)}
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
                                  backgroundColor: designation.status === "y" ? "var(--accent-indigo)" : "var(--border-medium)",
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
                                    left: designation.status === "y" ? "14px" : "2px",
                                    transition: "0.2s",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "500",
                                  color: designation.status === "y" ? "var(--accent-indigo)" : "var(--text-muted)",
                                }}
                              >
                                {designation.status === "y" ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="emp-actions">
                              <button
                                className="emp-act emp-act--edit"
                                onClick={() => handleEdit(designation)}
                                title={designation.status !== "y" ? "Cannot edit inactive designation" : "Edit"}
                                style={{ opacity: designation.status !== "y" ? 0.5 : 1 }}
                                disabled={designation.status !== "y"}
                              >
                                <FaEdit size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="emp-empty">
                          <div className="emp-empty-inner">
                            <span className="emp-empty-icon">🏷️</span>
                            <p>No designations found</p>
                            <small>Try a different search or add a new designation</small>
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
                      Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} designations
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
          /* ========== FORM VIEW – EXACTLY LIKE BRANCH PAGE ========== */
          <div className="emp-form-wrap">
            <form onSubmit={handleSubmit} noValidate className="emp-form-compact">
              <div className="emp-form-section-compact">
                <div className="emp-section-label">Designation Information</div>
                <div className="emp-form-grid-3col">
                  {/* Designation Name */}
                  <div className={`emp-field-compact ${isFieldErr('designationName') ? 'has-error' : ''} ${isFieldOk('designationName') ? 'has-ok' : ''}`}>
                    <div className="emp-label-row">
                      <label>Designation Name <span className="req">*</span></label>
                    </div>
                    <input
                      type="text"
                      placeholder="Designation Name"
                      value={formData.designationName}
                      maxLength={50}
                      onChange={(e) => handleChange('designationName', e.target.value)}
                      onBlur={() => handleBlur('designationName')}
                    />
                    <FieldError msg={errors.designationName} />
                  </div>
                  {/* Empty columns to keep 3‑col alignment */}
                  <div></div>
                  <div></div>
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
                    : <><FaSave size={12} /> {editMode ? 'Update Branch' : 'Create Branch'}</>
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
                  ? "Inactive designations cannot be edited until reactivated."
                  : "Active designations will be available for selection."}
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

export default Designation;