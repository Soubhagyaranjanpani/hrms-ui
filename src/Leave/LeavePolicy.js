import { useState } from "react";
import { FaEdit, FaArrowLeft } from "react-icons/fa";

const LeavePolicy = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    leaveType: "",
    carryForwardAllowed: "No",
    leaveExpireDate: "",
    accrualPerMonth: "",
    policyDescription: "",
    policyPrice: "",
    policyDuration: "",
    policyApprover: "",
  });

  const [policyData, setPolicyData] = useState([
    {
      id: 1,
      leaveType: "Annual",
      carryForwardAllowed: "Yes",
      leaveExpireDate: "2025-12-31",
      accrualPerMonth: "2.5",
      policyDescription: "Standard annual",
      policyPrice: "0",
      policyDuration: "12 months",
      policyApprover: "HR Manager",
      status: "y",
    },
    {
      id: 2,
      leaveType: "Sick ",
      carryForwardAllowed: "No",
      leaveExpireDate: "2024-12-31",
      accrualPerMonth: "1",
      policyDescription: "Medical leave",
      policyPrice: "0",
      policyDuration: "12 months",
      policyApprover: "Team Lead",
      status: "y",
    },
    {
      id: 3,
      leaveType: "Casual ",
      carryForwardAllowed: "Yes",
      leaveExpireDate: "2025-06-30",
      accrualPerMonth: "1.5",
      policyDescription: "Short duration",
      policyPrice: "0",
      policyDuration: "6 months",
      policyApprover: "HR Manager",
      status: "y",
    },
    {
      id: 4,
      leaveType: "Maternity ",
      carryForwardAllowed: "No",
      leaveExpireDate: "2024-12-31",
      accrualPerMonth: "0",
      policyDescription: "26 weeks fully",
      policyPrice: "100",
      policyDuration: "6 months",
      policyApprover: "HR Director",
      status: "y",
    },
    {
      id: 5,
      leaveType: "Paternity ",
      carryForwardAllowed: "No",
      leaveExpireDate: "2024-12-31",
      accrualPerMonth: "0",
      policyDescription: "2 weeks paternity leave",
      policyPrice: "100",
      policyDuration: "2 weeks",
      policyApprover: "HR Manager",
      status: "y",
    },
    {
      id: 6,
      leaveType: "Bereavement ",
      carryForwardAllowed: "No",
      leaveExpireDate: "2024-12-31",
      accrualPerMonth: "0",
      policyDescription: "3 days paid leave",
      policyPrice: "0",
      policyDuration: "3 days",
      policyApprover: "Team Lead",
      status: "y",
    },
    {
      id: 7,
      leaveType: "Study ",
      carryForwardAllowed: "Yes",
      leaveExpireDate: "2025-03-31",
      accrualPerMonth: "1",
      policyDescription: "Educational",
      policyPrice: "0",
      policyDuration: "10 days",
      policyApprover: "Department Head",
      status: "y",
    },
  ]);

  // INPUT CHANGE
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ADD + UPDATE
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingPolicy) {
      const updated = policyData.map((p) =>
        p.id === editingPolicy.id ? { ...p, ...formData } : p
      );
      setPolicyData(updated);
      setEditingPolicy(null);
    } else {
      const newPolicy = {
        id: policyData.length + 1,
        ...formData,
        status: "y",
      };
      setPolicyData([...policyData, newPolicy]);
    }

    setFormData({
      leaveType: "",
      carryForwardAllowed: "No",
      leaveExpireDate: "",
      accrualPerMonth: "",
      policyDescription: "",
      policyPrice: "",
      policyDuration: "",
      policyApprover: "",
    });

    setShowForm(false);
    setCurrentPage(1);
  };

  // EDIT - Only if active
  const handleEdit = (policy) => {
    if (policy.status === "y") {
      setEditingPolicy(policy);
      setFormData(policy);
      setShowForm(true);
    }
  };

  // Filtered data based on search
  const filteredPolicies = policyData.filter(
    (p) =>
      p.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.carryForwardAllowed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.policyDescription &&
        p.policyDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination logic
  const totalItems = filteredPolicies.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentPolicies = filteredPolicies.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Predefined options for Leave Type dropdown
  const leaveTypeOptions = [
    "Annual Leave",
    "Sick Leave",
    "Casual Leave",
    "Maternity Leave",
    "Paternity Leave",
  ];

  // ================= LIST VIEW =================
  if (!showForm) {
    return (
      <div className="container mt-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0" style={{ color: "#6366f1" }}>
            Leave Policy
          </h2>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Leave..."
              value={searchQuery}
              onChange={handleSearch}
              style={{ width: "250px", borderRadius: "10px" }}
            />

            <button
              className="btn"
              style={{
                backgroundColor: "#6366f1",
                color: "white",
                borderRadius: "20px",
                padding: "8px 20px",
              }}
              onClick={() => {
                setShowForm(true);
                setEditingPolicy(null);
                setFormData({
                  leaveType: "",
                  carryForwardAllowed: "No",
                  leaveExpireDate: "",
                  accrualPerMonth: "",
                  policyDescription: "",
                  policyPrice: "",
                  policyDuration: "",
                  policyApprover: "",
                });
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div
          className="card-modern p-3"
          style={{
            borderRadius: "15px",
            backgroundColor: "white",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div className="table-responsive">
            <table className="table table-custom">
              <thead>
                <tr>
                  <th>No</th>
                  <th>LeaveType</th>
                  <th>CarryForward</th>
                  <th>ExpireDate</th>
                  <th>Accrual/Month</th>
                  <th>Description</th>
                  <th>Price($)</th>
                  <th>Duration</th>
                  <th>Approver</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentPolicies.length > 0 ? (
                  currentPolicies.map((policy, index) => (
                    <tr key={policy.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{policy.leaveType}</td>
                      <td>{policy.carryForwardAllowed}</td>
                      <td>{policy.leaveExpireDate}</td>
                      <td>{policy.accrualPerMonth}</td>
                      <td>{policy.policyDescription}</td>
                      <td>{policy.policyPrice}</td>
                      <td>{policy.policyDuration}</td>
                      <td>{policy.policyApprover}</td>

                      {/* ACTION BUTTON */}
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor:
                              policy.status === "y" ? "#6366f1" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            cursor: policy.status === "y" ? "pointer" : "not-allowed",
                            opacity: policy.status === "y" ? 1 : 0.6,
                            border: "none",
                          }}
                          onClick={() => handleEdit(policy)}
                          disabled={policy.status !== "y"}
                          title={
                            policy.status !== "y"
                              ? "Cannot edit inactive policy"
                              : "Edit policy"
                          }
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-muted">
                      No leave policies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalItems > 0 && (
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1rem",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "14px", color: "#6c757d" }}>
                Showing {startIndex + 1} to {endIndex} of {totalItems} entries
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                    backgroundColor: currentPage === 1 ? "#f8f9fa" : "#ffffff",
                    color: currentPage === 1 ? "#adb5bd" : "#6366f1",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "14px",
                  }}
                >
                  « Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #dee2e6",
                      backgroundColor: page === currentPage ? "#6366f1" : "#ffffff",
                      color: page === currentPage ? "#ffffff" : "#495057",
                      fontWeight: page === currentPage ? "bold" : "normal",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                    backgroundColor:
                      currentPage === totalPages ? "#f8f9fa" : "#ffffff",
                    color: currentPage === totalPages ? "#adb5bd" : "#6366f1",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "14px",
                  }}
                >
                  Next »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= FORM VIEW (SECOND PAGE) =================
  return (
    <div className="container mt-1">
      <div className="d-flex align-items-center gap-3 mb-3">
        <button
          className="btn"
          style={{
            backgroundColor: "#6366f1",
            color: "white",
            borderRadius: "20px",
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onClick={() => setShowForm(false)}
        >
          <FaArrowLeft /> Back
        </button>

        <h2 style={{ color: "#6366f1", fontWeight: "700" }}>
          {editingPolicy ? "Edit Leave Policy" : "Add Leave Policy"}
        </h2>
      </div>

      <div
        className="card p-4 shadow-sm"
        style={{
          borderRadius: "15px",
          border: "none",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Leave Type
              </label>
              <select
                className="form-select"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleInputChange}
                required
                style={{ borderRadius: "8px" }}
              >
                <option value="" disabled>Select leave type</option>
                {leaveTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Carry Forward Allowed
              </label>
              <select
                className="form-select"
                name="carryForwardAllowed"
                value={formData.carryForwardAllowed}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Leave Expire Date
              </label>
              <input
                type="date"
                className="form-control"
                name="leaveExpireDate"
                value={formData.leaveExpireDate}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Accrual Per Month (days)
              </label>
              <input
                type="number"
                step="0.5"
                className="form-control"
                name="accrualPerMonth"
                value={formData.accrualPerMonth}
                onChange={handleInputChange}
                placeholder="e.g., 2.5"
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Policy Description
              </label>
              <textarea
                className="form-control"
                name="policyDescription"
                value={formData.policyDescription}
                onChange={handleInputChange}
                rows="2"
                placeholder="Describe the policy"
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Policy Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="policyPrice"
                value={formData.policyPrice}
                onChange={handleInputChange}
                placeholder="e.g., 100.00"
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Policy Duration
              </label>
              <input
                type="text"
                className="form-control"
                name="policyDuration"
                value={formData.policyDuration}
                onChange={handleInputChange}
                placeholder="e.g., 12 months"
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Approver
              </label>
              <input
                type="text"
                className="form-control"
                name="policyApprover"
                value={formData.policyApprover}
                onChange={handleInputChange}
                placeholder="e.g., HR Manager"
                style={{ borderRadius: "8px" }}
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              className="btn me-2"
              style={{
                backgroundColor: "#6366f1",
                color: "white",
                borderRadius: "20px",
                padding: "8px 25px",
                border: "none",
              }}
            >
              {editingPolicy ? "Update Policy" : "Save Policy"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                borderRadius: "20px",
                padding: "8px 25px",
              }}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeavePolicy;