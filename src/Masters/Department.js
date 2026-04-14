
import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaEdit, FaArrowLeft, FaSave, FaExclamationCircle, FaUserPlus, FaTimes
} from "react-icons/fa";
import axios from "axios";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { BASE_URL, STORAGE_KEYS } from "../config/api.config";

/* ─── Validation Rules ─── */
const RULES = {
  deptName: {
    required: true,
    minLen: 2,
    maxLen: 100,
    pattern: /^[a-zA-Z0-9\s&-]+$/,
    patternMsg: "Only letters, numbers, spaces, & and -",
  },
  deptCode: {
    required: true,
    minLen: 2,
    maxLen: 20,
    pattern: /^[A-Z0-9-]+$/,
    patternMsg: "Only uppercase letters, numbers, and hyphens",
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
  const [selectedDept, setSelectedDept] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination (frontend)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });

  const [formData, setFormData] = useState({
    deptName: "",
    deptCode: "",
    branchId: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/departments/list?flag=0`, axiosConfig);
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        // Map API fields { id, name, code, branchId, status } to component fields
        const mapped = res.data.response.map((d) => ({
          id: d.id,
          deptName: d.name,
          deptCode: d.code,
          branchId: d.branchId,
          branchName: d.branchName || "",
          status: d.status || "y",
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

  // Fetch branches for dropdown
  const fetchBranches = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/branches/list?flag=0`, axiosConfig);
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        setBranches(res.data.response);
      }
    } catch (err) {
      console.error("Fetch branches error:", err);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchBranches();
  }, [fetchDepartments, fetchBranches]);

  // Filter departments based on search (name, code, branch name)
  const filteredDepartments = departments.filter((d) => {
    const query = debouncedSearch.toLowerCase();
    return (
      d.deptName?.toLowerCase().includes(query) ||
      d.deptCode?.toLowerCase().includes(query) ||
      d.branchName?.toLowerCase().includes(query)
    );
  });

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
    setFormData({ deptName: "", deptCode: "", branchId: "" });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedDept(null);
  };

  // Create or Update department
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const fields = ["deptName", "deptCode", "branchId"];
    const newTouched = {};
    const newErrors = {};
    fields.forEach((f) => {
      newTouched[f] = true;
      const err = validate(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setTouched(newTouched);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.warning("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.deptName.trim(),
        code: formData.deptCode.trim(),
        branchId: parseInt(formData.branchId),
        status: "y",
      };

      let url, method;
      if (editMode) {
        url = `${BASE_URL}/departments/update/${selectedDept.id}`;
        method = axios.put;
      } else {
        url = `${BASE_URL}/departments/add`;
        method = axios.post;
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
      deptName: dept.deptName,
      deptCode: dept.deptCode,
      branchId: dept.branchId,
    });
    setSelectedDept(dept);
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
    const { id, newStatus } = statusAction;
    setLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/departments/update/${id}`,
        { status: newStatus },
        axiosConfig
      );
      if (res.data?.status === 200) {
        toast.success(
          "Status Updated",
          `Department ${newStatus === "y" ? "activated" : "deactivated"}`
        );
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

  // Pagination range with ellipsis
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
                placeholder="Search by name, code, or branch…"
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
                    <th>Name</th>
                    <th>Code</th>
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
                        <td>
                          <div className="emp-name">{dept.deptName || "—"}</div>
                        </td>
                        <td>{dept.deptCode || "—"}</td>
                        <td>{dept.branchName || "—"}</td>
                        <td>
                          <div
                            onClick={() =>
                              handleStatusToggle(dept.id, dept.status, dept.deptName)
                            }
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
                                backgroundColor: dept.status === "y" ? "#6366f1" : "#cbd5e1",
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
                                color: dept.status === "y" ? "#6366f1" : "#94a3b8",
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
                          <span className="emp-empty-icon">🏛️</span>
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
              <div className="emp-form-grid">
                {/* Department Name */}
                <div
                  className={`emp-field ${isFieldErr("deptName") ? "has-error" : ""} ${
                    isFieldOk("deptName") ? "has-ok" : ""
                  }`}
                >
                  <div className="emp-label-row">
                    <label>
                      Department Name <span className="req">*</span>
                    </label>
                    <CharCount value={formData.deptName} max={100} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., Cardiology, Human Resources"
                    value={formData.deptName}
                    maxLength={100}
                    onChange={(e) => handleChange("deptName", e.target.value)}
                    onBlur={() => handleBlur("deptName")}
                  />
                  <FieldError msg={errors.deptName} />
                  <small className="emp-hint-text">2–100 characters, letters, numbers, spaces, &, -</small>
                </div>

                {/* Department Code */}
                <div
                  className={`emp-field ${isFieldErr("deptCode") ? "has-error" : ""} ${
                    isFieldOk("deptCode") ? "has-ok" : ""
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
                    placeholder="e.g., CAR001"
                    value={formData.deptCode}
                    maxLength={20}
                    onChange={(e) => handleChange("deptCode", e.target.value)}
                    onBlur={() => handleBlur("deptCode")}
                  />
                  <FieldError msg={errors.deptCode} />
                  <small className="emp-hint-text">Uppercase letters, numbers, hyphens</small>
                </div>

                {/* Branch */}
                <div
                  className={`emp-field ${isFieldErr("branchId") ? "has-error" : ""} ${
                    isFieldOk("branchId") ? "has-ok" : ""
                  }`}
                >
                  <label>
                    Branch <span className="req">*</span>
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleChange("branchId", e.target.value)}
                    onBlur={() => handleBlur("branchId")}
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