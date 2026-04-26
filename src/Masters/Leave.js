import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaEdit, FaArrowLeft, FaSave, FaExclamationCircle,
  FaUserPlus, FaTimes
} from "react-icons/fa";
import axios from "axios";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { BASE_URL, STORAGE_KEYS } from "../config/api.config";

/* ─── Validation Rules (unchanged) ─── */
const RULES = {
  name: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s]+$/,
    patternMsg: "Only letters and spaces allowed",
  },
  maxDaysPerYear: {
    required: true,
    min: 1,
    max: 365,
  },
};

const validate = (field, value) => {
  const r = RULES[field];
  if (!r) return "";
  const v = typeof value === "string" ? value.trim() : value;
  if (r.required && (v === undefined || v === null || v === "")) return "This field is required";
  if (field === "maxDaysPerYear") {
    const num = Number(v);
    if (isNaN(num)) return "Must be a number";
    if (r.min && num < r.min) return `Minimum ${r.min} day(s)`;
    if (r.max && num > r.max) return `Maximum ${r.max} day(s)`;
    return "";
  }
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

// ✅ Helper to get fresh auth headers on every request
const getAuthConfig = () => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const LeaveTypes = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });
  const [statusUpdating, setStatusUpdating] = useState(false); // ✅ separate loading for toggle

  const [formData, setFormData] = useState({ name: "", maxDaysPerYear: 1, isActive: true });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const ensureToken = () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token) {
      toast.error("Authentication Required", "Please login to continue");
      return false;
    }
    return true;
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  // Normalise API response (handles id / _id)
  const normaliseLeaveTypes = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      id: item.id || item._id,
      name: item.name,
      maxDaysPerYear: item.maxDaysPerYear || 0,
      isActive: item.isActive === true || item.isActive === "true" || item.isActive === 1,
    }));
  };

  const fetchLeaveTypes = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/leave-type`, getAuthConfig());
      let dataArray = [];
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        dataArray = res.data.response;
      } else if (Array.isArray(res.data)) {
        dataArray = res.data;
      }
      const normalized = normaliseLeaveTypes(dataArray);
      setLeaveTypes(normalized);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error", err.response?.data?.message || "Failed to fetch leave types");
      setLeaveTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  // Filter & pagination
  const filteredItems = leaveTypes.filter((item) =>
    item.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + rowsPerPage);

  // Form handlers
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
    setFormData({ name: "", maxDaysPerYear: 1, isActive: true });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedItem(null);
  };

  // Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    const nameErr = validate("name", formData.name);
    const maxErr = validate("maxDaysPerYear", formData.maxDaysPerYear);
    setTouched({ name: true, maxDaysPerYear: true });
    setErrors({ name: nameErr, maxDaysPerYear: maxErr });
    if (nameErr || maxErr) {
      toast.warning("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        maxDaysPerYear: Number(formData.maxDaysPerYear),
        isActive: formData.isActive,
      };

      let res;
      if (editMode) {
        res = await axios.put(`${BASE_URL}/api/leave-type/${selectedItem.id}`, payload, getAuthConfig());
      } else {
        res = await axios.post(`${BASE_URL}/api/leave-type`, payload, getAuthConfig());
      }

      if (res.status >= 200 && res.status < 300) {
        toast.success(editMode ? "Leave type updated" : "Leave type created");
        resetForm();
        setView("list");
        await fetchLeaveTypes();
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

  // Edit
  const handleEdit = (item) => {
    if (!item.isActive) {
      toast.warning("Inactive", "Cannot edit an inactive leave type");
      return;
    }
    setFormData({
      name: item.name,
      maxDaysPerYear: item.maxDaysPerYear,
      isActive: item.isActive,
    });
    setSelectedItem(item);
    setEditMode(true);
    setView("form");
  };

  // ✅ Safe status toggle: fetch full object first, then update isActive
  const handleStatusToggle = (id, currentStatus, name) => {
    setStatusAction({ id, newStatus: !currentStatus, name });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!ensureToken()) return;
    const { id, newStatus } = statusAction;
    setStatusUpdating(true);
    try {
      // 1. Fetch the full leave type object
      const fetchRes = await axios.get(`${BASE_URL}/api/leave-type/${id}`, getAuthConfig());
      const existing = fetchRes.data?.response || fetchRes.data;
      if (!existing || !existing.id) {
        throw new Error("Could not retrieve current leave type data");
      }

      // 2. Update only isActive, keep all other fields
      const updatePayload = {
        name: existing.name,
        maxDaysPerYear: existing.maxDaysPerYear,
        isActive: newStatus,
      };

      const res = await axios.put(`${BASE_URL}/api/leave-type/${id}`, updatePayload, getAuthConfig());
      if (res.status >= 200 && res.status < 300) {
        toast.success(`Leave type ${newStatus ? "activated" : "deactivated"}`);
        await fetchLeaveTypes();
        setPage(0); // ✅ reset pagination after data change
      } else {
        throw new Error(res.data?.message || "Status change failed");
      }
    } catch (err) {
      console.error("Status change error:", err);
      toast.error("Error", err.response?.data?.message || "Failed to change status");
    } finally {
      setStatusUpdating(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, newStatus: null, name: "" });
    }
  };

  // Pagination range
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

  const isFieldOk = (f) => touched[f] && !errors[f] && formData[f] !== undefined && formData[f] !== "";
  const isFieldErr = (f) => touched[f] && !!errors[f];

  if (loading && view === "list" && leaveTypes.length === 0) {
    return <LoadingSpinner message="Loading leave types..." />;
  }

  return (
    <div className="emp-root">
      {/* Header */}
      <div className="emp-header" style={view === "form" ? { justifyContent: "space-between" } : {}}>
        {view === "form" ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? "Edit Leave Type" : "Add Leave Type"}</h1>
              <p className="emp-subtitle">
                {editMode ? "Update leave type details" : "Enter new leave type information"}
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
                <h1 className="emp-title">Leave Types</h1>
                <p className="emp-subtitle">{totalItems} total leave types</p>
              </div>
            </div>
            <button
              className="emp-add-btn"
              onClick={() => {
                resetForm();
                setView("form");
              }}
            >
              <FaUserPlus size={13} /> Add Leave Type
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
                placeholder="Search by leave type name…"
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
                    <th>Leave Type Name</th>
                    <th style={{ width: 120 }}>Max Days/Year</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 70, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((item, idx) => (
                      <tr key={item.id} className="emp-row">
                        <td className="emp-sno">{startIndex + idx + 1}</td>
                        <td>
                          <div className="emp-name">{item.name || "—"}</div>
                        </td>
                        <td style={{ fontWeight: "500", color: "var(--accent-indigo)" }}>
                          {item.maxDaysPerYear}
                        </td>
                        <td>
                          <div
                            onClick={() => handleStatusToggle(item.id, item.isActive, item.name)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              style={{
                                width: "42px",
                                height: "22px",
                                borderRadius: "50px",
                                backgroundColor: item.isActive ? "var(--accent-indigo)" : "var(--border-medium)",
                                position: "relative",
                                transition: "0.2s",
                              }}
                            >
                              <div
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  backgroundColor: "white",
                                  position: "absolute",
                                  top: "2px",
                                  left: item.isActive ? "22px" : "2px",
                                  transition: "0.2s",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "500",
                                color: item.isActive ? "var(--accent-indigo)" : "var(--text-muted)",
                              }}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="emp-actions">
                            <button
                              className="emp-act emp-act--edit"
                              onClick={() => handleEdit(item)}
                              title={!item.isActive ? "Cannot edit inactive leave type" : "Edit"}
                              style={{ opacity: !item.isActive ? 0.5 : 1 }}
                              disabled={!item.isActive}
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
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon">📅</span>
                          <p>No leave types found</p>
                          <small>Try a different search or add a new leave type</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="emp-pagination" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="emp-page-info">
                    Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} leave types
                  </span>
                </div>

                <div className="emp-page-controls">
                  <button
                    className="emp-page-btn"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === "..." ? (
                      <span key={`dots-${i}`} className="emp-page-dots">…</span>
                    ) : (
                      <button
                        key={pg}
                        className={`emp-page-num ${pg === page ? "active" : ""}`}
                        onClick={() => setPage(pg)}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button
                    className="emp-page-btn"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* FORM VIEW */
        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit} noValidate>
            <div className="emp-form-section">
              <div className="emp-section-label">Leave Type Details</div>
              <div className="emp-form-grid" style={{ maxWidth: "800px", width: "100%" }}>
                {/* Name field */}
                <div
                  className={`emp-field ${isFieldErr("name") ? "has-error" : ""} ${isFieldOk("name") ? "has-ok" : ""
                    }`}
                  style={{ gridColumn: "span 2" }}
                >
                  <div className="emp-label-row">
                    <label>
                      Leave Type Name <span className="req">*</span>
                    </label>
                    <CharCount value={formData.name} max={50} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., Annual Leave, Sick Leave"
                    value={formData.name}
                    maxLength={50}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                  />
                  <FieldError msg={errors.name} />
                  <small className="emp-hint-text">2–50 characters, letters and spaces only</small>
                </div>

                {/* Max Days Per Year */}
                <div
                  className={`emp-field ${isFieldErr("maxDaysPerYear") ? "has-error" : ""} ${isFieldOk("maxDaysPerYear") ? "has-ok" : ""
                    }`}
                  style={{ gridColumn: "span 1" }}
                >
                  <label>
                    Max Days Per Year <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    step="1"
                    value={formData.maxDaysPerYear}
                    onChange={(e) => handleChange("maxDaysPerYear", e.target.value)}
                    onBlur={() => handleBlur("maxDaysPerYear")}
                  />
                  <FieldError msg={errors.maxDaysPerYear} />
                  <small className="emp-hint-text">Between 1 and 365 days</small>
                </div>

                {/* Active Checkbox */}
                <div className="emp-field" style={{ gridColumn: "span 2", flexDirection: "row", gap: "12px", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleChange("isActive", e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label style={{ marginBottom: 0, fontWeight: "500", color: "var(--text-secondary)" }}>
                    Active (can be used for leave applications)
                  </label>
                </div>
              </div>
            </div>

            <div className="emp-form-footer">
              <button
                type="button"
                className="emp-cancel-btn"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting ? (
                  <><span className="emp-spinner" /> {editMode ? "Updating…" : "Creating…"}</>
                ) : (
                  <><FaSave size={12} /> {editMode ? "Update Leave Type" : "Create Leave Type"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">
              {statusAction.newStatus ? "✅" : "⛔"}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{" "}
              <strong>{statusAction.newStatus ? "activate" : "deactivate"}</strong>{" "}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {!statusAction.newStatus
                ? "Inactive leave types cannot be edited until reactivated."
                : "Active leave types will be available for leave applications."}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button
                className="emp-modal-confirm"
                onClick={confirmStatusChange}
                disabled={statusUpdating}
              >
                {statusUpdating ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTypes;