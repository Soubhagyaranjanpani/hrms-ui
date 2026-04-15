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
  deptCode: {
    required: true,
    minLen: 2,
    maxLen: 20,
    pattern: /^[A-Z0-9-]+$/,
    patternMsg: "Only uppercase letters, numbers, and hyphens",
  },
  name: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s]+$/,
    patternMsg: "Only letters and spaces allowed",
  },
  branchId: {
    required: true,
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

const Department = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });

  const [formData, setFormData] = useState({ deptCode: "", name: "", branchId: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // For branch dropdown
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Auth
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

  // Fetch branches for dropdown
  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await axios.get(`${BASE_URL}/branches/list?flag=0`, axiosConfig);
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        setBranches(res.data.response);
      }
    } catch (err) {
      console.error("Fetch branches error:", err);
      toast.error("Error", "Failed to fetch branches");
    } finally {
      setLoadingBranches(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/departments/list?flag=0`, axiosConfig);
      // if (res.data?.status === 200 && Array.isArray(res.data.response)) 
if (res.data?.response && Array.isArray(res.data.response)) 

        {
        const mapped = res.data.response.map((d) => ({
          id: d.id,
          deptCode: d.code,
          name: d.name,
          branchId: d.branchId,
          branchName: d.branchName,
          status: d.isActive ? "y" : "n",
        }));
        setDepartments(mapped);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error", err.response?.data?.message || "Failed to fetch departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchBranches();
  }, [fetchDepartments]);

  // Filter & pagination
  const filteredDepartments = departments.filter((d) =>
    d.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    d.deptCode?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  const totalItems = filteredDepartments.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentDepartments = filteredDepartments.slice(startIndex, startIndex + rowsPerPage);

  // Form handlers
  const handleChange = (field, value) => {
    if (field === "deptCode") value = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
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
    setFormData({ deptCode: "", name: "", branchId: "" });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedDepartment(null);
  };

  // Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    // Validate all fields
    const errCode = validate("deptCode", formData.deptCode);
    const errName = validate("name", formData.name);
    const errBranch = validate("branchId", formData.branchId);
    setTouched({ deptCode: true, name: true, branchId: true });
    setErrors({ deptCode: errCode, name: errName, branchId: errBranch });

    if (errCode || errName || errBranch) {
      toast.warning("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const codeTrimmed = formData.deptCode.trim();
      const nameTrimmed = formData.name.trim();
      const branchIdInt = parseInt(formData.branchId);
      let url, method, payload;

      if (editMode) {
        url = `${BASE_URL}/departments/update`;
        method = axios.put;
        payload = {
          id: selectedDepartment.id,
          code: codeTrimmed,
          name: nameTrimmed,
          branchId: branchIdInt,
        };
      } else {
        url = `${BASE_URL}/departments/create`;
        method = axios.post;
        payload = {
          code: codeTrimmed,
          name: nameTrimmed,
          branchId: branchIdInt,
          isActive: true,
        };
      }

      const res = await method(url, payload, axiosConfig);
      if (res.data?.status === 200) {
        toast.success("Success", editMode ? "Department updated" : "Department created");
        resetForm();
        setView("list");
        fetchDepartments();
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

  // Edit department
  const handleEdit = (dept) => {
    if (dept.status !== "y") {
      toast.warning("Inactive", "Cannot edit an inactive department");
      return;
    }
    setFormData({
      deptCode: dept.deptCode,
      name: dept.name,
      branchId: dept.branchId ? dept.branchId.toString() : "",
    });
    setSelectedDepartment(dept);
    setEditMode(true);
    setView("form");
  };

  // Status toggle
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
      const res = await axios.put(
        `${BASE_URL}/departments/status/${id}`,
        null,
        axiosConfig
      );
      if (res.data?.status === 200) {
        toast.success("Status Updated", "Department status changed");
        fetchDepartments();
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

  // Pagination helpers
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

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(0);
  };

  if (loading && view === "list" && departments.length === 0) {
    return <LoadingSpinner message="Loading departments..." />;
  }

  return (
    <div className="emp-root">
      {/* Header */}
      <div className="emp-header" style={view === "form" ? { justifyContent: "space-between" } : {}}>
        {view === "form" ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? "Edit Department" : "Add Department"}</h1>
              <p className="emp-subtitle">
                {editMode ? "Update department information" : "Enter new department details"}
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
                <h1 className="emp-title">Department Directory</h1>
                <p className="emp-subtitle">{totalItems} total departments</p>
              </div>
            </div>
            <button
              className="emp-add-btn"
              onClick={() => {
                resetForm();
                setView("form");
              }}
            >
              <FaUserPlus size={13} /> Add Department
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
                placeholder="Search by name or code…"
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
                    <th>Code</th>
                    <th>Department Name</th>
                    <th>Branch</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 70, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDepartments.length > 0 ? (
                    currentDepartments.map((dept, idx) => (
                      <tr key={dept.id} className="emp-row">
                        <td className="emp-sno">{startIndex + idx + 1}</td>
                        <td>{dept.deptCode || "—"}</td>
                        <td>
                          <div className="emp-name">{dept.name || "—"}</div>
                        </td>
                        <td>{dept.branchName || "—"}</td>
                        <td>
                          <div
                            onClick={() => handleStatusToggle(dept.id, dept.status, dept.name)}
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
                                backgroundColor: dept.status === "y" ? "var(--accent-indigo)" : "var(--border-medium)",
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
                                  left: dept.status === "y" ? "22px" : "2px",
                                  transition: "0.2s",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "500",
                                color: dept.status === "y" ? "var(--accent-indigo)" : "var(--text-muted)",
                              }}
                            >
                              {dept.status === "y" ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="emp-actions">
                            <button
                              className="emp-act emp-act--edit"
                              onClick={() => handleEdit(dept)}
                              title={dept.status !== "y" ? "Cannot edit inactive department" : "Edit"}
                              style={{ opacity: dept.status !== "y" ? 0.5 : 1 }}
                              disabled={dept.status !== "y"}
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
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon">🏢</span>
                          <p>No departments found</p>
                          <small>Try a different search or add a new department</small>
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
                    Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} departments
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
              <div className="emp-section-label">Department Information</div>
              <div className="emp-form-grid" style={{ maxWidth: "500px" }}>
                {/* Department Code */}
                <div
                  className={`emp-field ${isFieldErr("deptCode") ? "has-error" : ""} ${isFieldOk("deptCode") ? "has-ok" : ""
                    }`}
                >
                  <div className="emp-label-row">
                    <label>
                      Department Code <span className="req">*</span>
                    </label>
                    <CharCount value={formData.deptCode} max={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., DEPT001"
                    value={formData.deptCode}
                    maxLength={20}
                    onChange={(e) => handleChange("deptCode", e.target.value)}
                    onBlur={() => handleBlur("deptCode")}
                  />
                  <FieldError msg={errors.deptCode} />
                  <small className="emp-hint-text">Uppercase letters, numbers, hyphens</small>
                </div>

                {/* Department Name */}
                <div
                  className={`emp-field ${isFieldErr("name") ? "has-error" : ""} ${isFieldOk("name") ? "has-ok" : ""
                    }`}
                >
                  <div className="emp-label-row">
                    <label>
                      Department Name <span className="req">*</span>
                    </label>
                    <CharCount value={formData.name} max={50} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., IT, HR, Finance"
                    value={formData.name}
                    maxLength={50}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                  />
                  <FieldError msg={errors.name} />
                  <small className="emp-hint-text">2–50 characters, letters only</small>
                </div>

                {/* Branch Dropdown */}
                <div
                  className={`emp-field ${isFieldErr("branchId") ? "has-error" : ""} ${isFieldOk("branchId") ? "has-ok" : ""
                    }`}
                >
                  <label>
                    Branch <span className="req">*</span>
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleChange("branchId", e.target.value)}
                    onBlur={() => handleBlur("branchId")}
                    disabled={loadingBranches}
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <FieldError msg={errors.branchId} />
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
                  <><FaSave size={12} /> {editMode ? "Update Department" : "Create Department"}</>
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
              {statusAction.newStatus === "y" ? "✅" : "⛔"}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{" "}
              <strong>{statusAction.newStatus === "y" ? "activate" : "deactivate"}</strong>{" "}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === "n"
                ? "Inactive departments cannot be edited until reactivated."
                : "Active departments will be available for selection."}
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

export default Department;