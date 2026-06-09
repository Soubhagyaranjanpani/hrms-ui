import { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaEdit, FaArrowLeft, FaSave, FaExclamationCircle,
  FaUserPlus, FaTimes
} from "react-icons/fa";
import axios from "axios";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { BASE_URL, STORAGE_KEYS } from "../config/api.config";

// ==================== Validation Rules ====================
const RULES = {
  employeeId: { required: true },
  skillName: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z0-9\s\-]+$/,
    patternMsg: "Only letters, numbers, spaces and hyphens",
  },
  proficiency: { required: true, min: 1, max: 5 },
};


const validate = (field, value) => {
  const r = RULES[field];
  if (!r) return "";
  const v = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (r.required && !v) return "This field is required";
  if (!v && !r.required) return "";

  if (field === "skillName") {
    if (v.length < r.minLen) return `Minimum ${r.minLen} characters`;
    if (v.length > r.maxLen) return `Maximum ${r.maxLen} characters`;
    if (r.pattern && !r.pattern.test(v)) return r.patternMsg;
  }
  if (field === "proficiency") {
    const num = parseInt(v);
    if (isNaN(num) || num < r.min || num > r.max) return `Must be between ${r.min} and ${r.max}`;
  }
  return "";
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

// ==================== Main Component ====================
const Skills = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
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
    skillName: "",
    proficiency: 3,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ---------- Auth Helpers ----------
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

  // ---------- API Calls ----------
  // Fetch employees from the exact endpoint: /employees?name=1&page=0&size=10
const fetchEmployees = useCallback(async () => {
  if (!ensureToken()) return;
  try {
    // Use the exact endpoint with isActive=true to get only active employees
    const res = await axios.get(`${BASE_URL}/api/employees?isActive=true&page=0&size=50`, axiosConfig);
    
    // Extract the array from response.content (Spring Boot Page wrapper)
    let employeeList = [];
    if (res.data?.response?.content && Array.isArray(res.data.response.content)) {
      employeeList = res.data.response.content;
    } 
    // Fallback for other possible structures (keep for robustness)
    else if (res.data?.content && Array.isArray(res.data.content)) {
      employeeList = res.data.content;
    } else if (res.data?.response && Array.isArray(res.data.response)) {
      employeeList = res.data.response;
    } else if (Array.isArray(res.data)) {
      employeeList = res.data;
    }
    
    // Map to { id, name } – your API already provides id and name directly
    const mapped = employeeList.map(emp => ({
      id: emp.id,
      name: emp.name
    }));
    
    setEmployees(mapped);
    if (mapped.length === 0) {
      toast.warning("No employees", "No active employees found.");
    }
  } catch (err) {
    console.error("Fetch employees error:", err);
    toast.error("Error", err.response?.data?.message || "Could not load employees");
    setEmployees([]);
  }
}, []);




  const fetchSkills = useCallback(async () => {
    if (!ensureToken()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}api/employee-profile/full/15`, axiosConfig);
      if (res.data?.status === 200 && Array.isArray(res.data.response)) {
        const mapped = res.data.response.map((s) => ({
          id: s.id,
          employeeId: s.employeeId,
          employeeName: s.employeeName,
          skillName: s.skillName,
          proficiency: s.proficiency,
          status: s.isActive ? "y" : "n",
        }));
        setSkillsData(mapped);
      } else {
        setSkillsData([]);
      }
    } catch (err) {
      console.error("Fetch skills error:", err);
      toast.error("Error", err.response?.data?.message || "Failed to fetch skills");
      setSkillsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSkill = async (payload) => {
    const res = await axios.post(`${BASE_URL}/api/employee-profile/skill`, payload, axiosConfig);
    return res.data;
  };

  const updateSkill = async (id, payload) => {
    const res = await axios.put(`${BASE_URL}/skills/update`, { id, ...payload }, axiosConfig);
    return res.data;
  };

  const toggleSkillStatus = async (id) => {
    const res = await axios.put(`${BASE_URL}/skills/status/${id}`, null, axiosConfig);
    return res.data;
  };

  // ---------- Initial Load ----------
  useEffect(() => {
    fetchEmployees();  // Load employees for dropdown
    fetchSkills();
  }, [fetchEmployees, fetchSkills]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchName]);

  // ---------- Filter & Sort ----------
  const filteredSkills = skillsData
    .filter((s) => {
      const query = debouncedSearch.toLowerCase();
      return (
        s.employeeName?.toLowerCase().includes(query) ||
        s.skillName?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (a.status === "y" && b.status === "n") return -1;
      if (a.status === "n" && b.status === "y") return 1;
      return 0;
    });

  const totalItems = filteredSkills.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentSkills = filteredSkills.slice(startIndex, startIndex + rowsPerPage);

  // ---------- Form Handlers ----------
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
    setFormData({ employeeId: "", skillName: "", proficiency: 3 });
    setErrors({});
    setTouched({});
    setEditMode(false);
    setSelectedSkill(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureToken()) return;

    const errEmp = validate("employeeId", formData.employeeId);
    const errName = validate("skillName", formData.skillName);
    const errProf = validate("proficiency", formData.proficiency);
    setTouched({ employeeId: true, skillName: true, proficiency: true });
    setErrors({ employeeId: errEmp, skillName: errName, proficiency: errProf });

    if (errEmp || errName || errProf) {
      toast.warning("Validation Error", "Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: parseInt(formData.employeeId),
        skillName: formData.skillName.trim(),
        proficiency: parseInt(formData.proficiency),
      };

      if (editMode) {
        await updateSkill(selectedSkill.id, payload);
        toast.success("Success", "Skill updated");
      } else {
        await createSkill({ ...payload});
        toast.success("Success", "Skill created");
      }
      resetForm();
      setView("list");
      fetchSkills(); // refresh list
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Error", err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (skill) => {
    if (skill.status !== "y") {
      toast.warning("Inactive", "Cannot edit an inactive skill");
      return;
    }
    setFormData({
      employeeId: skill.employeeId.toString(),
      skillName: skill.skillName,
      proficiency: skill.proficiency,
    });
    setSelectedSkill(skill);
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
      await toggleSkillStatus(id);
      toast.success("Status Updated", `Skill ${statusAction.newStatus === "y" ? "activated" : "deactivated"}`);
      fetchSkills();
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

  const isFieldOk = (f) => touched[f] && !errors[f] && (f === "proficiency" ? true : formData[f]?.trim());
  const isFieldErr = (f) => touched[f] && !!errors[f];

  const renderProficiency = (level) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "60px", height: "6px", backgroundColor: "var(--border-light)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${(level / 5) * 100}%`, height: "100%", backgroundColor: "var(--accent-indigo)" }} />
      </div>
      <span style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-secondary)" }}>{level}/5</span>
    </div>
  );

  if (loading && view === "list" && skillsData.length === 0) {
    return <LoadingSpinner message="Loading skills..." />;
  }

  return (
    <div className="emp-root">
      {/* Header */}
      <div className="emp-header" style={view === "form" ? { justifyContent: "space-between" } : {}}>
        {view === "form" ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? "Edit Skill" : "Add Skill"}</h1>
              <p className="emp-subtitle">
                {editMode ? "Update skill information" : "Enter new skill details"}
              </p>
            </div>
            <button className="emp-back-btn" onClick={() => { resetForm(); setView("list"); }}>
              <FaArrowLeft size={12} /> Back
            </button>
          </>
        ) : (
          <>
            <div className="emp-header-left">
              <div>
                <h1 className="emp-title">Employee Skills</h1>
                <p className="emp-subtitle">{totalItems} total skills</p>
              </div>
            </div>
            <button className="emp-add-btn" onClick={() => { resetForm(); setView("form"); }}>
              <FaUserPlus size={13} /> Add Skill
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
                placeholder="Search by employee or skill…"
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
                    <th>Employee</th>
                    <th>Skill</th>
                    <th>Proficiency</th>
                    <th style={{ width: 80 }}>Status</th>
                    <th style={{ width: 70, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSkills.length > 0 ? (
                    currentSkills.map((skill, idx) => (
                      <tr key={skill.id} className="emp-row">
                        <td className="emp-sno">{startIndex + idx + 1}</td>
                        <td className="emp-name">{skill.employeeName}</td>
                        <td>{skill.skillName}</td>
                        <td>{renderProficiency(skill.proficiency)}</td>
                        <td>
                          <div
                            onClick={() => handleStatusToggle(skill.id, skill.status, skill.skillName)}
                            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "16px",
                                borderRadius: "50px",
                                backgroundColor: skill.status === "y" ? "var(--accent-indigo)" : "var(--border-medium)",
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
                                  left: skill.status === "y" ? "14px" : "2px",
                                  transition: "0.2s",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "500",
                                color: skill.status === "y" ? "var(--accent-indigo)" : "var(--text-muted)",
                              }}
                            >
                              {skill.status === "y" ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="emp-actions">
                            <button
                              className="emp-act emp-act--edit"
                              onClick={() => handleEdit(skill)}
                              title={skill.status !== "y" ? "Cannot edit inactive skill" : "Edit"}
                              style={{ opacity: skill.status !== "y" ? 0.5 : 1 }}
                              disabled={skill.status !== "y"}
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
                          <span className="emp-empty-icon">📚</span>
                          <p>No skills found</p>
                          <small>Try a different search or add a new skill</small>
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
                    Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} skills
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
        /* ========== FORM VIEW ========== */
        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit} noValidate className="emp-form-compact">
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Skill Information</div>
              <div className="emp-form-grid-3col">
                {/* Employee Dropdown - fetched from the exact API */}
                <div className={`emp-field-compact ${isFieldErr('employeeId') ? 'has-error' : ''} ${isFieldOk('employeeId') ? 'has-ok' : ''}`}>
                  <label>Employee <span className="req">*</span></label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => handleChange('employeeId', e.target.value)}
                    onBlur={() => handleBlur('employeeId')}
                  >
                    <option value="">Select employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  <FieldError msg={errors.employeeId} />
                </div>

                {/* Skill Name */}
                <div className={`emp-field-compact ${isFieldErr('skillName') ? 'has-error' : ''} ${isFieldOk('skillName') ? 'has-ok' : ''}`}>
                  <label>Skill Name <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g., React, Java, Communication"
                    value={formData.skillName}
                    maxLength={50}
                    onChange={(e) => handleChange('skillName', e.target.value)}
                    onBlur={() => handleBlur('skillName')}
                  />
                  <FieldError msg={errors.skillName} />
                </div>

                {/* Proficiency */}
                <div className={`emp-field-compact ${isFieldErr('proficiency') ? 'has-error' : ''} ${isFieldOk('proficiency') ? 'has-ok' : ''}`}>
                  <label>Proficiency (1-5) <span className="req">*</span></label>
                  <select
                    value={formData.proficiency}
                    onChange={(e) => handleChange('proficiency', e.target.value)}
                    onBlur={() => handleBlur('proficiency')}
                  >
                    <option value="1">1 - Beginner</option>
                    <option value="2">2 - Basic</option>
                    <option value="3">3 - Intermediate</option>
                    <option value="4">4 - Advanced</option>
                    <option value="5">5 - Expert</option>
                  </select>
                  <FieldError msg={errors.proficiency} />
                </div>
              </div>
            </div>

            <div className="emp-form-actions">
              <button type="button" className="emp-cancel-btn" onClick={() => { resetForm(); setView('list'); }}>
                Cancel
              </button>
              <button type="submit" className="emp-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {submitting
                  ? <><span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</>
                  : <><FaSave size={12} /> {editMode ? 'Update Skill' : 'Create Skill'}</>
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
                ? "Inactive skills cannot be edited until reactivated."
                : "Active skills will be available for selection."}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Skills;