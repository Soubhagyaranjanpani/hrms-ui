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
  branchCode: {
    required: true,
    minLen: 2,
    maxLen: 20,
    pattern: /^[A-Z0-9-]+$/,
    patternMsg: "Only uppercase letters, numbers, and hyphens",
  },
  branchName: {
    required: true,
    minLen: 2,
    maxLen: 100,
    pattern: /^[a-zA-Z0-9\s&-]+$/,
    patternMsg: "Only letters, numbers, spaces, & and -",
  },
  address: { required: false, maxLen: 200 },
  city: { required: false, maxLen: 50 },
  state: { required: false, maxLen: 50 },
  country: { required: false, maxLen: 50 },
  pincode: {
    required: false,
    minLen: 6,
    maxLen: 6,
    pattern: /^[1-9][0-9]{5}$/,
    patternMsg: "Enter a valid 6-digit Indian pincode",
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

const Branch = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({ id: null, newStatus: null, name: "" });

  const [formData, setFormData] = useState({
    branchCode: "",
    branchName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
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

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  const fetchBranches = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/branches/list?flag=0`, axiosConfig);
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        const mapped = res.data.response.map((b) => ({
          id: b.id,
          branchCode: b.code,
          branchName: b.name,
          address: b.address || "",
          city: b.city || "",
          state: b.state || "",
          country: b.country || "",
          pincode: b.pincode || "",
          status: b.isActive ? "y" : "n",
        }));
        setBranches(mapped);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error", err.response?.data?.message || "Failed to fetch branches");
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const filteredBranches = branches.filter((b) => {
    const query = debouncedSearch.toLowerCase();
    return (
      b.branchName?.toLowerCase().includes(query) ||
      b.branchCode?.toLowerCase().includes(query) ||
      b.city?.toLowerCase().includes(query)
    );
  });
  const totalItems = filteredBranches.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentBranches = filteredBranches.slice(startIndex, startIndex + rowsPerPage);

  const handleChange = (field, value) => {
    if (field === "branchCode") value = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (field === "pincode") value = value.replace(/\D/g, "").slice(0, 6);
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
    setFormData({
      branchCode: "",
      branchName: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedBranch(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    const fields = ["branchCode", "branchName", "address", "city", "state", "country", "pincode"];
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
      let url, method, payload;

      if (editMode) {
        url = `${BASE_URL}/branches/update`;
        method = axios.put;
        payload = {
          id: selectedBranch.id,
          code: formData.branchCode.trim(),
          name: formData.branchName.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          pincode: formData.pincode.trim(),
        };
      } else {
        url = `${BASE_URL}/branches/create`;
        method = axios.post;
        payload = {
          code: formData.branchCode.trim(),
          name: formData.branchName.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          pincode: formData.pincode.trim(),
          isActive: true,
        };
      }

      const res = await method(url, payload, axiosConfig);
      if (res.data?.status === 200) {
        toast.success("Success", editMode ? "Branch updated" : "Branch created");
        resetForm();
        setView("list");
        fetchBranches();
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

  const handleEdit = (branch) => {
    if (branch.status !== "y") {
      toast.warning("Inactive", "Cannot edit an inactive branch");
      return;
    }
    setFormData({
      branchCode: branch.branchCode,
      branchName: branch.branchName,
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      country: branch.country || "",
      pincode: branch.pincode || "",
    });
    setSelectedBranch(branch);
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
      const res = await axios.put(`${BASE_URL}/branches/status/${id}`, null, axiosConfig);
      if (res.data?.status === 200) {
        toast.success("Status Updated", "Branch status changed");
        fetchBranches();
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

  if (loading && view === "list" && branches.length === 0) {
    return <LoadingSpinner message="Loading branches..." />;
  }

  return (
    <>
      <div className="emp-root">
        {/* Header */}
        <div className="emp-header" style={view === "form" ? { justifyContent: "space-between" } : {}}>
          {view === "form" ? (
            <>
              <div>
                <h1 className="emp-title">{editMode ? "Edit Branch" : "Add Branch"}</h1>
                <p className="emp-subtitle">
                  {editMode ? "Update branch information" : "Enter new branch details"}
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
                  <h1 className="emp-title">Branch Directory</h1>
                  <p className="emp-subtitle">{totalItems} total branches</p>
                </div>
              </div>
              <button
                className="emp-add-btn"
                onClick={() => {
                  resetForm();
                  setView("form");
                }}
              >
                <FaUserPlus size={13} /> Add Branch
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
                  placeholder="Search by name, code, or city…"
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
                      <th>Branch Name</th>
                      <th>Address</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Country</th>
                      <th>Pincode</th>
                      <th style={{ width: 80 }}>Status</th>
                      <th style={{ width: 70, textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBranches.length > 0 ? (
                      currentBranches.map((branch, idx) => (
                        <tr key={branch.id} className="emp-row">
                          <td className="emp-sno">{startIndex + idx + 1}</td>
                          <td>{branch.branchCode || "—"}</td>
                          <td><div className="emp-name">{branch.branchName || "—"}</div></td>
                          <td>{branch.address || "—"}</td>
                          <td>{branch.city || "—"}</td>
                          <td>{branch.state || "—"}</td>
                          <td>{branch.country || "—"}</td>
                          <td>{branch.pincode || "—"}</td>
                          <td>
                            <div
                              onClick={() => handleStatusToggle(branch.id, branch.status, branch.branchName)}
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
                                  backgroundColor: branch.status === "y" ? "var(--accent-indigo)" : "var(--border-medium)",
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
                                    left: branch.status === "y" ? "14px" : "2px",
                                    transition: "0.2s",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "500",
                                  color: branch.status === "y" ? "var(--accent-indigo)" : "var(--text-muted)",
                                }}
                              >
                                {branch.status === "y" ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="emp-actions">
                              <button
                                className="emp-act emp-act--edit"
                                onClick={() => handleEdit(branch)}
                                title={branch.status !== "y" ? "Cannot edit inactive branch" : "Edit"}
                                style={{ opacity: branch.status !== "y" ? 0.5 : 1 }}
                                disabled={branch.status !== "y"}
                              >
                                <FaEdit size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="emp-empty">
                          <div className="emp-empty-inner">
                            <span className="emp-empty-icon">🏢</span>
                            <p>No branches found</p>
                            <small>Try a different search or add a new branch</small>
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
                      Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} branches
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
          /* ========== FORM VIEW – EXACTLY MATCHING EMPLOYEE FORM STRUCTURE ========== */

          <div className="emp-form-wrap">
            <form onSubmit={handleSubmit} noValidate className="emp-form-compact">

              <div className="emp-form-section-compact">
                <div className="emp-section-label">Branch Information</div>
                <div className="emp-form-grid-3col">

                  {/* Branch Code */}
                  <div className={`emp-field-compact ${isFieldErr('branchCode') ? 'has-error' : ''} ${isFieldOk('branchCode') ? 'has-ok' : ''}`}>
                    <label>Branch Code <span className="req">*</span></label>
                    <input
                      type="text"
                      placeholder="Full branch code"
                      value={formData.branchCode}
                      maxLength={20}
                      onChange={(e) => handleChange('branchCode', e.target.value)}
                      onBlur={() => handleBlur('branchCode')}
                    />
                    <FieldError msg={errors.branchCode} />
                  </div>

                  {/* Branch Name */}
                  <div className={`emp-field-compact ${isFieldErr('branchName') ? 'has-error' : ''} ${isFieldOk('branchName') ? 'has-ok' : ''}`}>
                    <label>Branch Name <span className="req">*</span></label>
                    <input
                      type="text"
                      placeholder="Full branch name"
                      value={formData.branchName}
                      maxLength={100}
                      onChange={(e) => handleChange('branchName', e.target.value)}
                      onBlur={() => handleBlur('branchName')}
                    />
                    <FieldError msg={errors.branchName} />
                  </div>

                  {/* Address Textarea (now in same 3‑column row) */}
                  <div className={`emp-field-compact ${isFieldErr('address') ? 'has-error' : ''}`}>
                    <label>Address<span className="req">*</span></label>

                    <textarea
                      rows={2}
                      placeholder="Street, area, landmark"
                      value={formData.address}
                      maxLength={100}
                      onChange={(e) => handleChange('address', e.target.value)}
                      onBlur={() => handleBlur('address')}
                    />
                    <FieldError msg={errors.address} />
                  </div>

                  {/* City */}
                  <div className={`emp-field-compact ${isFieldErr('city') ? 'has-error' : ''}`} style={{ marginTop: '-20px' }}>
                    <label>City<span className="req">*</span></label>

                    <input
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      maxLength={6}
                      onChange={(e) => handleChange('city', e.target.value)}
                      onBlur={() => handleBlur('city')}
                    />
                    <FieldError msg={errors.city} />
                  </div>

                  {/* State */}
                  <div className={`emp-field-compact ${isFieldErr('state') ? 'has-error' : ''}`} style={{ marginTop: '-20px' }}>

                    <label>Pincode<span className="req">*</span></label>
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.state}
                      maxLength={50}
                      onChange={(e) => handleChange('state', e.target.value)}
                      onBlur={() => handleBlur('state')}
                    />
                    <FieldError msg={errors.state} />
                  </div>

                  {/* Country */}
                  <div className={`emp-field-compact ${isFieldErr('country') ? 'has-error' : ''}`} style={{ marginTop: '-20px' }}>
                    <label>Country<span className="req">*</span></label>

                    <input
                      type="text"
                      placeholder="Country"
                      value={formData.country}
                      maxLength={50}
                      onChange={(e) => handleChange('country', e.target.value)}
                      onBlur={() => handleBlur('country')}
                    />
                    <FieldError msg={errors.country} />
                  </div>

                  {/* Pincode + two empty divs to keep 3 columns */}
                  <div className={`emp-field-compact ${isFieldErr('pincode') ? 'has-error' : ''}`}>
                    <label>Pincode<span className="req">*</span></label>
                    <input
                      type="text"
                      placeholder="6-digit pincode"
                      value={formData.pincode}
                      maxLength={6}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      onBlur={() => handleBlur('pincode')}
                    />
                    <FieldError msg={errors.pincode} />
                  </div>
                  {/* <div></div> */}
                  {/* <div></div> */}
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
                  ? "Inactive branches cannot be edited until reactivated."
                  : "Active branches will be available for selection."}
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

export default Branch;