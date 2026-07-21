import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaEdit, FaArrowLeft, FaSave, FaExclamationCircle, FaUserPlus, FaTimes
} from "react-icons/fa";
import axios from "axios";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { BASE_URL, STORAGE_KEYS } from "../config/api.config";

/*
  NOTE: bound to the real backend contract:

  GET  /employee-designation?flag=0|1                 -> list (plain array OR wrapped, both handled)
  POST /employee-designation        body:{employeeId, designationId}  -> EmployeeDesignationResponse
  PUT  /employee-designation/{id}   body:{employeeId, designationId}  -> EmployeeDesignationResponse
  PUT  /employee-designation/{id}/status?active=true|false
  GET  /api/designations/list?flag=0                   -> designation master list (for dropdown)

  employeeId is a plain number input below (no employee master list/search API confirmed yet).
  Swap it for a real <select>/search-dropdown once you share that endpoint.

  IMPORTANT: this assumes EmployeeDesignationResponse now includes `employeeId`
  (see the one-line backend fix) so the edit form can prefill it correctly.
*/

/* ─── Validation Rules ─── */
const RULES = {
  employeeId: {
    required: true,
    isPositiveInt: true,
  },
  designationId: {
    required: true,
    patternMsg: "Please select a designation",
  },
};

const validate = (field, value) => {
  const r = RULES[field];
  if (!r) return "";
  const v = String(value ?? "").trim();
  if (r.required && !v) return "This field is required";
  if (r.isPositiveInt && (!/^\d+$/.test(v) || Number(v) <= 0)) {
    return "Enter a valid positive number";
  }
  return "";
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

const EmployeeDesignation = ({ user, onCancel }) => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });

  const [formData, setFormData] = useState({
    employeeId: "",
    designationId: "",
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

  const ensureToken = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication Required", "Please login to continue");
      return false;
    }
    return true;
  };

  /* ─── Helper: Parse API response (handles plain array OR wrapped) ─── */
  const parseApiResponse = (res) => {
    const data = res.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      if (Array.isArray(data.response)) return data.response;
      if (Array.isArray(data.data)) return data.data;
      if (data.status && Array.isArray(data.content)) return data.content;
    }
    if (Array.isArray(data)) return data;
    return [];
  };

  /* ─── Debounced Search ─── */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  /* ─── Fetch Designations (for dropdown) ─── */
  const fetchDesignations = useCallback(async () => {
    if (!ensureToken()) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/designations/list?flag=0`, axiosConfig);
      const data = parseApiResponse(res);
      const mapped = data.map((des) => ({
        id: des.id,
        designationName: des.designationName || des.name || "",
      }));
      setDesignations(mapped);
    } catch (err) {
      console.error("Fetch designations error:", err);
      setDesignations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Fetch Employee-Designation records ─── */
  const fetchEmployees = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/employee-designation?flag=0`, axiosConfig);
      const data = parseApiResponse(res);

      const mapped = data.map((emp) => ({
        id: emp.id,
        employeeId: emp.employeeId,
        employeeName: emp.employeeName || "",
        designationName: emp.designationName || "",
        createdDate: emp.createdDate || "",
        updatedDate: emp.updatedDate || null,
        status: emp.isActive ? "y" : "n",
      }));

      setEmployees(mapped);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error", err.response?.data?.message || "Failed to fetch employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDesignations();
    fetchEmployees();
  }, [fetchDesignations, fetchEmployees]);

  /* ─── Filter & Sort ─── */
  const filteredEmployees = employees
    .filter((emp) => {
      const query = debouncedSearch.toLowerCase();
      return (
        emp.employeeName?.toLowerCase().includes(query) ||
        emp.designationName?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (a.status === "y" && b.status === "n") return -1;
      if (a.status === "n" && b.status === "y") return 1;
      return 0;
    });

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const startIndex = page * rowsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

  /* ─── Form Handlers ─── */
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
    setFormData({ employeeId: "", designationId: "" });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedEmployee(null);
  };

  /* ─── Submit Handler (Create / Update) ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    const fields = ["employeeId", "designationId"];
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
        employeeId: Number(formData.employeeId),
        designationId: Number(formData.designationId),
      };

      let res;
      if (editMode) {
        res = await axios.put(
          `${BASE_URL}/employee-designation/${selectedEmployee.id}`,
          payload,
          axiosConfig
        );
      } else {
        res = await axios.post(`${BASE_URL}/employee-designation`, payload, axiosConfig);
      }

      if (res.status >= 200 && res.status < 300) {
        toast.success("Success", editMode ? "Employee designation updated" : "Employee designation created");
        resetForm();
        setView("list");
        fetchEmployees();
      }
    } catch (err) {
      console.error("Submit error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Something went wrong";
      toast.error("Error", typeof msg === "string" ? msg : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Edit Handler ─── */
  const handleEdit = (employee) => {
    if (employee.status !== "y") {
      toast.warning("Inactive", "Cannot edit an inactive employee");
      return;
    }
    if (!employee.employeeId) {
      toast.error(
        "Missing Data",
        "employeeId not found in response — make sure the backend mapToResponse() sets it"
      );
      return;
    }
    // designationId isn't in the response DTO either — we only know the name.
    // Try to resolve it from the loaded designations list by matching the name.
    const matchedDesignation = designations.find(
      (d) => d.designationName === employee.designationName
    );

    setFormData({
      employeeId: String(employee.employeeId),
      designationId: matchedDesignation ? String(matchedDesignation.id) : "",
    });
    setSelectedEmployee(employee);
    setEditMode(true);
    setView("form");
  };

  /* ─── Status Toggle ─── */
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
      const active = statusAction.newStatus === "y";
      await axios.put(
        `${BASE_URL}/employee-designation/${id}/status?active=${active}`,
        null,
        axiosConfig
      );
      toast.success("Status Updated", `Employee status changed to ${active ? "Active" : "Inactive"}`);
      fetchEmployees();
    } catch (err) {
      console.error("Status change error:", err);
      toast.error("Error", err.response?.data?.message || "Failed to change status");
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusAction({ id: null, newStatus: null, name: "" });
    }
  };

  /* ─── Pagination ─── */
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isFieldOk = (f) => touched[f] && !errors[f] && String(formData[f] ?? "").trim();
  const isFieldErr = (f) => touched[f] && !!errors[f];

  if (loading && view === "list" && employees.length === 0) {
    return <LoadingSpinner message="Loading employees..." />;
  }

  return (
    <>
      <div className="emp-root">
        {/* Header */}
        <div className="emp-header" style={view === "form" ? { justifyContent: "space-between" } : {}}>
          {view === "form" ? (
            <>
              <div>
                <h1 className="emp-title">{editMode ? "Edit Employee Designation" : "Add Employee Designation"}</h1>
                <p className="emp-subtitle">
                  {editMode ? "Update employee designation" : "Assign designation to employee"}
                </p>
              </div>
              <button
                className="emp-back-btn"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
              >
                <FaArrowLeft size={12} /> Back to List
              </button>
            </>
          ) : (
            <>
              <div className="emp-header-left">
                <div>
                  <h1 className="emp-title">Employee Designation</h1>
                  <p className="emp-subtitle">{totalItems} total employees</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className="emp-add-btn"
                  onClick={() => {
                    resetForm();
                    setView("form");
                  }}
                >
                  <FaUserPlus size={13} /> Add Employee
                </button>
                {onCancel && (
                  <button className="emp-cancel-btn" onClick={onCancel}>
                    <FaTimes size={13} /> Close
                  </button>
                )}
              </div>
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
                  placeholder="Search by employee name or designation…"
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
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Created Date</th>
                      <th style={{ width: 80 }}>Status</th>
                      <th style={{ width: 70, textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.length > 0 ? (
                      currentEmployees.map((emp, idx) => (
                        <tr key={emp.id} className="emp-row">
                          <td className="emp-sno">{startIndex + idx + 1}</td>
                          <td>
                            <div className="emp-name">{emp.employeeName || "—"}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                background: "#e0e7ff",
                                color: "#3730a3",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {emp.designationName || "—"}
                            </span>
                          </td>
                          <td>{formatDate(emp.createdDate)}</td>
                          <td>
                            <div
                              onClick={() =>
                                handleStatusToggle(emp.id, emp.status, emp.employeeName)
                              }
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
                                  backgroundColor:
                                    emp.status === "y"
                                      ? "var(--accent-indigo)"
                                      : "var(--border-medium)",
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
                                    left: emp.status === "y" ? "14px" : "2px",
                                    transition: "0.2s",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "500",
                                  color:
                                    emp.status === "y"
                                      ? "var(--accent-indigo)"
                                      : "var(--text-muted)",
                                }}
                              >
                                {emp.status === "y" ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="emp-actions">
                              <button
                                className="emp-act emp-act--edit"
                                onClick={() => handleEdit(emp)}
                                title={
                                  emp.status !== "y"
                                    ? "Cannot edit inactive employee"
                                    : "Edit"
                                }
                                style={{ opacity: emp.status !== "y" ? 0.5 : 1 }}
                                disabled={emp.status !== "y"}
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
                            <span className="emp-empty-icon">👤</span>
                            <p>No employees found</p>
                            <small>Try a different search or add a new employee</small>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <div
                  className="emp-pagination"
                  style={{ justifyContent: "space-between", flexWrap: "wrap" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="emp-page-info">
                      Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)}{" "}
                      of {totalItems} employees
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
                        <span key={`dots-${i}`} className="emp-page-dots">
                          …
                        </span>
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
          /* ========== FORM VIEW ========== */
          <div className="emp-form-wrap">
            <form onSubmit={handleSubmit} noValidate className="emp-form-compact">
              <div className="emp-form-section-compact">
                <div className="emp-section-label">Employee Information</div>
                <div className="emp-form-grid-3col">
                  {/* Employee ID */}
                  <div
                    className={`emp-field-compact ${
                      isFieldErr("employeeId") ? "has-error" : ""
                    } ${isFieldOk("employeeId") ? "has-ok" : ""}`}
                  >
                    <label>
                      Employee ID <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter employee ID"
                      value={formData.employeeId}
                      onChange={(e) => handleChange("employeeId", e.target.value)}
                      onBlur={() => handleBlur("employeeId")}
                    />
                    <FieldError msg={errors.employeeId} />
                  </div>

                  {/* Designation Dropdown */}
                  <div
                    className={`emp-field-compact ${
                      isFieldErr("designationId") ? "has-error" : ""
                    } ${isFieldOk("designationId") ? "has-ok" : ""}`}
                  >
                    <label>
                      Designation <span className="req">*</span>
                    </label>
                    <select
                      value={formData.designationId}
                      onChange={(e) => handleChange("designationId", e.target.value)}
                      onBlur={() => handleBlur("designationId")}
                    >
                      <option value="">Select Designation</option>
                      {designations.map((des) => (
                        <option key={des.id} value={des.id}>
                          {des.designationName}
                        </option>
                      ))}
                    </select>
                    {designations.length === 0 && (
                      <small style={{ color: "#f59e0b", fontSize: "11px", marginTop: "4px", display: "block" }}>
                        No designations loaded. Please check the API.
                      </small>
                    )}
                    <FieldError msg={errors.designationId} />
                  </div>
                </div>

                {editMode && selectedEmployee && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px 12px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    Currently: <strong>{selectedEmployee.employeeName}</strong> —{" "}
                    <strong>{selectedEmployee.designationName}</strong>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="emp-form-actions">
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
                <button
                  type="submit"
                  className="emp-add-btn"
                  disabled={submitting}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  {submitting ? (
                    <>
                      <span className="emp-spinner" />{" "}
                      {editMode ? "Updating…" : "Creating…"}
                    </>
                  ) : (
                    <>
                      <FaSave size={12} /> {editMode ? "Update Employee" : "Save Employee"}
                    </>
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
                <strong>
                  {statusAction.newStatus === "y" ? "activate" : "deactivate"}
                </strong>{" "}
                <strong>{statusAction.name}</strong>?
              </p>
              <p className="emp-modal-warn">
                {statusAction.newStatus === "n"
                  ? "Inactive employees cannot be edited until reactivated."
                  : "Active employees will be available for selection and editing."}
              </p>
              <div className="emp-modal-actions">
                <button
                  className="emp-modal-cancel"
                  onClick={() => setShowStatusModal(false)}
                >
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
    </>
  );
};

export default EmployeeDesignation;