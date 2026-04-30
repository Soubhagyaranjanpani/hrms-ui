import React, { useState, useEffect } from "react";
import { FaEdit, FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaPlus } from "react-icons/fa";
import axios from "axios";
import { API_ENDPOINTS, STORAGE_KEYS } from "../config/api.config";
import { toast } from "../components/Toast"; 
import LoadingSpinner from "../components/LoadingSpinner";

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

// Small toggle switch matching Branch page status toggle
const ToggleSwitch = ({ name, checked, onChange, disabled, label }) => (
  <label className="toggle-switch" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: disabled ? "not-allowed" : "pointer" }}>
    <div
      className="toggle-container"
      style={{
        width: "28px",
        height: "16px",
        borderRadius: "50px",
        backgroundColor: checked ? "var(--accent-indigo)" : "var(--border-medium)",
        position: "relative",
        transition: "background-color 0.2s ease",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={() => !disabled && onChange({ target: { name, type: "checkbox", checked: !checked } })}
    >
      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: "white",
          position: "absolute",
          top: "2px",
          left: checked ? "14px" : "2px",
          transition: "left 0.2s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </div>
    {label && <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>{label}</span>}
  </label>
);

const LeavePolicy = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    leaveTypeId: "",
    carryForwardAllowed: false,
    maxCarryForwardDays: "",
    expiryType: "YEAR_END",
    accrualEnabled: false,
    accrualPerMonth: "",
    requiresApproval: true,
    maxApprovalLevels: "1",
    sandwichPolicyEnabled: false,
    holidayIncludedInLeave: false,
    weekendIncludedInLeave: false,
    allowHalfDay: false,
    allowBackdatedLeave: false,
    maxLeaveDaysPerRequest: "",
    documentRequired: false,
    isActive: true,
  });

  const [policyData, setPolicyData] = useState([]);

  const expiryTypeOptions = [
    { value: "NEVER", label: "Never Expires" },
    { value: "YEAR_END", label: "End of Year" },
    { value: "FINANCIAL_YEAR_END", label: "End of Financial Year" },
    { value: "AFTER_DAYS", label: "After Specific Days" },
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([fetchLeaveTypes(), fetchPolicies()]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Error", "Failed to load leave policies data");
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.LEAVE_TYPES, getAuthHeaders());
      if (Array.isArray(response.data)) setLeaveTypes(response.data);
      else if (response.data?.response && Array.isArray(response.data.response)) setLeaveTypes(response.data.response);
      else if (response.data?.data && Array.isArray(response.data.data)) setLeaveTypes(response.data.data);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      toast.error("Error", "Failed to fetch leave types");
      throw error;
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_ALL_LEAVE_POLICIES, getAuthHeaders());
      if (response.data?.response && Array.isArray(response.data.response)) setPolicyData(response.data.response);
      else if (Array.isArray(response.data)) setPolicyData(response.data);
      else if (response.data?.data && Array.isArray(response.data.data)) setPolicyData(response.data.data);
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Error", "Failed to fetch leave policies");
      throw error;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leaveTypeId) {
      toast.warning("Validation Error", "Please select a leave type");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        maxCarryForwardDays: formData.maxCarryForwardDays ? parseInt(formData.maxCarryForwardDays) : null,
        accrualPerMonth: formData.accrualPerMonth ? parseFloat(formData.accrualPerMonth) : null,
        maxApprovalLevels: formData.maxApprovalLevels ? parseInt(formData.maxApprovalLevels) : null,
        maxLeaveDaysPerRequest: formData.maxLeaveDaysPerRequest ? parseInt(formData.maxLeaveDaysPerRequest) : null,
        leaveTypeId: parseInt(formData.leaveTypeId),
      };
      if (editingPolicy) {
        await axios.put(API_ENDPOINTS.UPDATE_LEAVE_POLICY(editingPolicy.id), payload, getAuthHeaders());
        toast.success("Success", "Leave policy updated successfully");
      } else {
        await axios.post(API_ENDPOINTS.CREATE_LEAVE_POLICY, payload, getAuthHeaders());
        toast.success("Success", "Leave policy created successfully");
      }
      await fetchPolicies();
      resetForm();
      setShowForm(false);
      setEditingPolicy(null);
      setCurrentPage(1);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Error saving policy";
      toast.error("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      leaveTypeId: "",
      carryForwardAllowed: false,
      maxCarryForwardDays: "",
      expiryType: "YEAR_END",
      accrualEnabled: false,
      accrualPerMonth: "",
      requiresApproval: true,
      maxApprovalLevels: "1",
      sandwichPolicyEnabled: false,
      holidayIncludedInLeave: false,
      weekendIncludedInLeave: false,
      allowHalfDay: false,
      allowBackdatedLeave: false,
      maxLeaveDaysPerRequest: "",
      documentRequired: false,
      isActive: true,
    });
  };

  const handleActivate = async (policy) => {
    if (!window.confirm(`Activate this policy for ${getLeaveTypeName(policy.leaveType?.id || policy.leaveType)}? This will deactivate other policies for this leave type.`)) return;
    setLoading(true);
    try {
      await axios.put(API_ENDPOINTS.ACTIVATE_LEAVE_POLICY(policy.id), {}, getAuthHeaders());
      await fetchPolicies();
      toast.success("Success", "Policy activated successfully");
    } catch (error) {
      toast.error("Error", error.response?.data?.message || "Error activating policy");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      leaveTypeId: policy.leaveType?.id || "",
      carryForwardAllowed: policy.carryForwardAllowed || false,
      maxCarryForwardDays: policy.maxCarryForwardDays || "",
      expiryType: policy.expiryType || "YEAR_END",
      accrualEnabled: policy.accrualEnabled || false,
      accrualPerMonth: policy.accrualPerMonth || "",
      requiresApproval: policy.requiresApproval ?? true,
      maxApprovalLevels: policy.maxApprovalLevels || "1",
      sandwichPolicyEnabled: policy.sandwichPolicyEnabled || false,
      holidayIncludedInLeave: policy.holidayIncludedInLeave || false,
      weekendIncludedInLeave: policy.weekendIncludedInLeave || false,
      allowHalfDay: policy.allowHalfDay || false,
      allowBackdatedLeave: policy.allowBackdatedLeave || false,
      maxLeaveDaysPerRequest: policy.maxLeaveDaysPerRequest || "",
      documentRequired: policy.documentRequired || false,
      isActive: policy.isActive ?? true,
    });
    setShowForm(true);
  };

  const getLeaveTypeName = (leaveTypeId) => {
    const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : "Unknown";
  };

  const formatBoolean = (value) => (value ? "Yes" : "No");

  const filteredPolicies = policyData.filter(p =>
    (p.leaveType?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatBoolean(p.carryForwardAllowed).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredPolicies.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentPolicies = filteredPolicies.slice(startIndex, endIndex);

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
  const handleSearch = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };

  if (initialLoading) return <LoadingSpinner message="Loading leave policies..." />;

  // ================= LIST VIEW =================
  if (!showForm) {
    return (
      <div className="emp-root">
        <div className="emp-header" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 className="emp-title">Leave Policies</h1>
            <p className="emp-subtitle">Manage leave rules and configurations</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="emp-search-wrap" style={{ width: "250px" }}>
              <span className="emp-search-icon">🔍</span>
              <input type="text" className="emp-search-input" placeholder="Search by leave type..." value={searchQuery} onChange={handleSearch} />
              {searchQuery && <button className="emp-search-clear" onClick={() => setSearchQuery("")}>✕</button>}
            </div>
            <button className="emp-add-btn" onClick={() => { setShowForm(true); setEditingPolicy(null); resetForm(); }}>
              <FaPlus size={13} /> Add Policy
            </button>
          </div>
        </div>

        <div className="emp-table-card">
          <div className="emp-table-wrap">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>#</th><th>Leave Type</th><th>Carry Forward</th><th>Max Carry Days</th><th>Accrual/Month</th><th>Approval</th><th>Half Day</th><th>Status</th><th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && currentPolicies.length === 0 ? (
                  <tr><td colSpan="9" className="emp-empty"><div className="emp-empty-inner"><div className="emp-spinner"></div><p>Loading policies...</p></div></td></tr>
                ) : currentPolicies.length > 0 ? (
                  currentPolicies.map((policy, idx) => (
                    <tr key={policy.id} className="emp-row">
                      <td className="emp-sno">{startIndex + idx + 1}</td>
                      <td>
                        <div className="emp-info-cell">
                          <div className="emp-avatar" style={{ background: "#e0e7ff", color: "#6366f1" }}>{policy.leaveType?.name?.charAt(0) || "L"}</div>
                          <div><div className="emp-name">{policy.leaveType?.name || "Unknown"}</div>{policy.isActive && <span className="emp-pill emp-pill--indigo" style={{ fontSize: "10px", padding: "2px 8px" }}>Active</span>}</div>
                        </div>
                      </td>
                      <td>{formatBoolean(policy.carryForwardAllowed)}</td>
                      <td>{policy.maxCarryForwardDays || "-"}</td>
                      <td>{policy.accrualPerMonth || "-"}</td>
                      <td>{formatBoolean(policy.requiresApproval)}</td>
                      <td>{formatBoolean(policy.allowHalfDay)}</td>
                      <td><span className={`emp-pill`} style={{ background: policy.isActive ? "#d1fae5" : "#f3f4f6", color: policy.isActive ? "#065f46" : "#6b7280" }}>{policy.isActive ? "Active" : "Inactive"}</span></td>
                      <td>
                        <div className="emp-actions">
                          <button className="emp-act emp-act--edit" onClick={() => handleEdit(policy)} title="Edit policy" disabled={loading}><FaEdit size={12} /></button>
                          {!policy.isActive && <button className="emp-act" style={{ background: "#d1fae5", color: "#065f46" }} onClick={() => handleActivate(policy)} title="Activate policy"><FaCheckCircle size={12} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="9" className="emp-empty"><div className="emp-empty-inner"><div className="emp-empty-icon">📋</div><p>No leave policies found</p><small>Click "Add Policy" to create one</small></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalItems > 0 && (
            <div className="emp-pagination">
              <span className="emp-page-info">Showing {startIndex + 1} to {endIndex} of {totalItems} entries</span>
              <div className="emp-page-controls">
                <button className="emp-page-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loading}>« Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return <button key={pageNum} className={`emp-page-num ${pageNum === currentPage ? "active" : ""}`} onClick={() => goToPage(pageNum)}>{pageNum}</button>;
                })}
                <button className="emp-page-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || loading}>Next »</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= FORM VIEW (with small toggle switches) =================
  return (
    <div className="emp-root">
      <div className="emp-header" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="emp-title">{editingPolicy ? "Edit Leave Policy" : "Create Leave Policy"}</h1>
          <p className="emp-subtitle">{editingPolicy ? "Modify policy rules and settings" : "Define new leave policy rules"}</p>
        </div>
        <button className="emp-back-btn" onClick={() => { setShowForm(false); setEditingPolicy(null); resetForm(); }}><FaArrowLeft size={12} /> Back</button>
      </div>

      <div className="emp-form-wrap">
        <form onSubmit={handleSubmit} className="emp-form-compact">

          {/* Basic Information */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Basic Information</div>
            <div className="emp-form-grid-3col">
              <div className="emp-field-compact" style={{ gridColumn: "span 2" }}>
                <label className="required">Leave Type</label>
                <select name="leaveTypeId" value={formData.leaveTypeId} onChange={handleInputChange} required disabled={loading}>
                  <option value="">Select leave type</option>
                  {leaveTypes.map(type => <option key={type.id} value={type.id}>{type.name} (Max: {type.maxDaysPerYear} days/year)</option>)}
                </select>
              </div>
              <div className="emp-field-compact">
                <label>Status</label>
                <ToggleSwitch name="isActive" checked={formData.isActive} onChange={handleInputChange} disabled={loading} label={formData.isActive ? "Active" : "Inactive"} />
                <small className="task-hint-text">Only one policy per leave type can be active</small>
              </div>
            </div>
          </div>

          <div className="emp-divider" />

          {/* Carry Forward & Expiry */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Carry Forward & Expiry</div>
            <div className="emp-form-grid-3col">
              <div className="emp-field-compact"><ToggleSwitch name="carryForwardAllowed" checked={formData.carryForwardAllowed} onChange={handleInputChange} disabled={loading} label="Carry Forward Allowed" /></div>
              <div className="emp-field-compact"><label>Max Carry Forward Days</label><input type="number" name="maxCarryForwardDays" value={formData.maxCarryForwardDays} onChange={handleInputChange} disabled={!formData.carryForwardAllowed || loading} placeholder="e.g., 30" /></div>
              <div className="emp-field-compact"><label>Expiry Type</label><select name="expiryType" value={formData.expiryType} onChange={handleInputChange} disabled={loading}>{expiryTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
            </div>
          </div>

          <div className="emp-divider" />

          {/* Accrual Settings */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Accrual Settings</div>
            <div className="emp-form-grid-3col">
              <div className="emp-field-compact"><ToggleSwitch name="accrualEnabled" checked={formData.accrualEnabled} onChange={handleInputChange} disabled={loading} label="Accrual Enabled" /></div>
              <div className="emp-field-compact"><label>Accrual Per Month (days)</label><input type="number" step="0.5" name="accrualPerMonth" value={formData.accrualPerMonth} onChange={handleInputChange} disabled={!formData.accrualEnabled || loading} placeholder="e.g., 2.5" /></div>
            </div>
          </div>

          <div className="emp-divider" />

          {/* Approval Rules */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Approval Rules</div>
            <div className="emp-form-grid-3col">
              <div className="emp-field-compact"><ToggleSwitch name="requiresApproval" checked={formData.requiresApproval} onChange={handleInputChange} disabled={loading} label="Requires Approval" /></div>
              <div className="emp-field-compact"><label>Max Approval Levels</label><input type="number" name="maxApprovalLevels" value={formData.maxApprovalLevels} onChange={handleInputChange} disabled={!formData.requiresApproval || loading} placeholder="e.g., 2" /></div>
              <div className="emp-field-compact"><label>Max Days Per Request</label><input type="number" name="maxLeaveDaysPerRequest" value={formData.maxLeaveDaysPerRequest} onChange={handleInputChange} disabled={loading} placeholder="e.g., 10" /></div>
            </div>
          </div>

          <div className="emp-divider" />

          {/* Advanced Settings - All Toggles (small size) */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Advanced Settings</div>
            <div className="emp-form-grid-3col">
              <ToggleSwitch name="sandwichPolicyEnabled" checked={formData.sandwichPolicyEnabled} onChange={handleInputChange} disabled={loading} label="Sandwich Policy Enabled" />
              <ToggleSwitch name="holidayIncludedInLeave" checked={formData.holidayIncludedInLeave} onChange={handleInputChange} disabled={loading} label="Holiday Included in Leave" />
              <ToggleSwitch name="weekendIncludedInLeave" checked={formData.weekendIncludedInLeave} onChange={handleInputChange} disabled={loading} label="Weekend Included in Leave" />
              <ToggleSwitch name="allowHalfDay" checked={formData.allowHalfDay} onChange={handleInputChange} disabled={loading} label="Allow Half Day Leave" />
              <ToggleSwitch name="allowBackdatedLeave" checked={formData.allowBackdatedLeave} onChange={handleInputChange} disabled={loading} label="Allow Backdated Leave" />
              <ToggleSwitch name="documentRequired" checked={formData.documentRequired} onChange={handleInputChange} disabled={loading} label="Document Required" />
            </div>
          </div>

          <div className="emp-form-actions">
            <button type="button" className="emp-cancel-btn" onClick={() => { setShowForm(false); setEditingPolicy(null); resetForm(); }} disabled={loading}>Cancel</button>
            <button type="submit" className="emp-add-btn" disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {loading ? <><span className="emp-spinner" /> {editingPolicy ? "Updating..." : "Saving..."}</> : <>{editingPolicy ? "Update Policy" : "Save Policy"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeavePolicy;