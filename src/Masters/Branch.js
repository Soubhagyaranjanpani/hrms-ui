import { useState } from "react";
import { FaEdit, FaArrowLeft } from "react-icons/fa";

const Branch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    branchName: "",
    branchCode: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  const [branchData, setBranchData] = useState([
    {
      id: 1,
      branchName: "Delphi Healthcare",
      branchCode: "DEL001",
      address: "Connaught Place, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110001",
      status: "y",
    },
    {
      id: 2,
      branchName: "Morgan Stanley",
      branchCode: "MUM002",
      address: "Andheri East, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400001",
      status: "y",
    },
    {
      id: 3,
      branchName: "Infosys Limited",
      branchCode: "BLR003",
      address: "MG Road, Bangalore",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      pincode: "560001",
      status: "y",
    },
    {
      id: 4,
      branchName: "Google NYC",
      branchCode: "NYC004",
      address: "Times Square, Manhattan",
      city: "New York",
      state: "New York",
      country: "USA",
      pincode: "10001",
      status: "y",
    },
    {
      id: 5,
      branchName: "TCS Corporate",
      branchCode: "TCS005",
      address: "Salt Lake Sector V",
      city: "Kolkata",
      state: "West Bengal",
      country: "India",
      pincode: "700091",
      status: "y",
    },
    {
      id: 6,
      branchName: "Wipro Tech",
      branchCode: "WIP006",
      address: "Hitech City",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500081",
      status: "y",
    },
    {
      id: 7,
      branchName: "Accenture Hub",
      branchCode: "ACC007",
      address: "DLF Cyber City",
      city: "Gurgaon",
      state: "Haryana",
      country: "India",
      pincode: "122002",
      status: "y",
    },
  ]);

  // Helper to reset form state
  const resetForm = () => {
    setFormData({
      branchName: "",
      branchCode: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    });
    setEditingBranch(null);
  };

  // INPUT CHANGE
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ADD + UPDATE
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingBranch) {
      const updated = branchData.map((b) =>
        b.id === editingBranch.id ? { ...b, ...formData } : b
      );
      setBranchData(updated);
      setEditingBranch(null);
    } else {
      const newBranch = {
        id: branchData.length + 1,
        ...formData,
        status: "y",
      };
      setBranchData([...branchData, newBranch]);
    }

    resetForm();
    setShowForm(false);
    setCurrentPage(1);
  };

  // EDIT - Only if branch is active
  const handleEdit = (branch) => {
    if (branch.status === "y") {
      setEditingBranch(branch);
      setFormData(branch);
      setShowForm(true);
    }
  };

  // STATUS TOGGLE
  const handleStatusToggle = (id) => {
    const updated = branchData.map((b) =>
      b.id === id ? { ...b, status: b.status === "y" ? "n" : "y" } : b
    );
    setBranchData(updated);
  };

  // Filtered data based on search
  const filteredBranches = branchData.filter(
    (b) =>
      b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination logic
  const totalItems = filteredBranches.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentBranches = filteredBranches.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // ================= LIST VIEW =================
  if (!showForm) {
    return (
      <div className="container mt-1">
        <div
          className="d-flex justify-content-between align-items-center mb-3"
          style={{ flexWrap: "wrap", gap: "12px" }}
        >
          <h2
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: "22px",
              fontWeight: "700",
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Branch Directory
          </h2>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Name..."
              value={searchQuery}
              onChange={handleSearch}
              style={{
                width: "250px",
                borderRadius: "12px",
                border: "1px solid var(--border-medium)",
                fontSize: "13px",
                padding: "8px 14px",
                fontFamily: "DM Sans, sans-serif",
              }}
            />

            <button
              className="btn"
              style={{
                background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-indigo-light))",
                color: "white",
                borderRadius: "12px",
                padding: "8px 20px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                transition: "all 0.25s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(99,102,241,0.42)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.3)";
              }}
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div
          className="card-modern p-3"
          style={{
            borderRadius: "20px",
            backgroundColor: "var(--card-bg)",
            boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div className="table-responsive">
            <table className="table table-custom" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>No</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>CODE</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>BRANCH NAME</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>ADDRESS</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>CITY</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>STATE</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>COUNTRY</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>PINCODE</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>STATUS</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentBranches.length > 0 ? (
                  currentBranches.map((branch, index) => (
                    <tr key={branch.id}>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{startIndex + index + 1}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{branch.branchCode}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{branch.branchName}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{branch.address}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{branch.city}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{branch.state}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{branch.country}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{branch.pincode}</td>

                      {/* STATUS TOGGLE */}
                      <td>
                        <div
                          onClick={() => handleStatusToggle(branch.id)}
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
                              backgroundColor: branch.status === "y" ? "var(--accent-indigo)" : "#ccc",
                              position: "relative",
                              transition: "0.3s",
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
                                left: branch.status === "y" ? "22px" : "2px",
                                transition: "0.3s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              }}
                            ></div>
                          </div>
                          <span
                            style={{
                              color: branch.status === "y" ? "var(--accent-indigo)" : "#999",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            {branch.status === "y" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* ACTION BUTTON */}
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor: branch.status === "y" ? "var(--accent-indigo)" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            cursor: branch.status === "y" ? "pointer" : "not-allowed",
                            opacity: branch.status === "y" ? 1 : 0.6,
                            border: "none",
                            fontSize: "12px",
                            transition: "all 0.2s",
                          }}
                          onClick={() => handleEdit(branch)}
                          disabled={branch.status !== "y"}
                          title={branch.status !== "y" ? "Cannot edit inactive branch" : "Edit branch"}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-muted" style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      No branches found.
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
                borderTop: "1px solid var(--border-light)",
                paddingTop: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1rem",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Showing {startIndex + 1} to {endIndex} of {totalItems} entries
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: currentPage === 1 ? "#f8f9fa" : "var(--bg-white)",
                    color: currentPage === 1 ? "#adb5bd" : "var(--accent-indigo)",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontFamily: "DM Sans, sans-serif",
                    transition: "all 0.2s",
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
                      borderRadius: "8px",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: page === currentPage ? "var(--accent-indigo)" : "var(--bg-white)",
                      color: page === currentPage ? "#ffffff" : "var(--text-secondary)",
                      fontWeight: page === currentPage ? "bold" : "normal",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontFamily: "DM Sans, sans-serif",
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
                    borderRadius: "8px",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: currentPage === totalPages ? "#f8f9fa" : "var(--bg-white)",
                    color: currentPage === totalPages ? "#adb5bd" : "var(--accent-indigo)",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "12px",
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

  // ================= FORM VIEW =================
  return (
    <div className="container mt-1">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "22px",
            fontWeight: "700",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {editingBranch ? "Edit Branch" : "Add Branch"}
        </h2>

        {/* REPLACED BACK BUTTON - exactly as requested */}
        <button
          className="emp-back-btn"
          onClick={() => {
            resetForm();
            setShowForm(false);
          }}
        >
          <FaArrowLeft size={12} /> Back
        </button>
      </div>

      <div
        className="card p-4 shadow-sm"
        style={{
          borderRadius: "20px",
          border: "1px solid var(--border-light)",
          boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
          backgroundColor: "var(--card-bg)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                Branch Code
              </label>
              <input
                className="form-control"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleInputChange}
                required
                style={{
                  borderRadius: "10px",
                  border: "1px solid var(--border-medium)",
                  fontSize: "13px",
                  fontFamily: "DM Sans, sans-serif",
                  padding: "9px 12px",
                  backgroundColor: "var(--bg-surface)",
                }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                Branch Name
              </label>
              <input
                className="form-control"
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                required
                style={{
                  borderRadius: "10px",
                  border: "1px solid var(--border-medium)",
                  fontSize: "13px",
                  fontFamily: "DM Sans, sans-serif",
                  padding: "9px 12px",
                  backgroundColor: "var(--bg-surface)",
                }}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold" style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                Address
              </label>
              <input
                className="form-control"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                style={{
                  borderRadius: "10px",
                  border: "1px solid var(--border-medium)",
                  fontSize: "13px",
                  fontFamily: "DM Sans, sans-serif",
                  padding: "9px 12px",
                  backgroundColor: "var(--bg-surface)",
                }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                City
              </label>
              <input
                className="form-control"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                style={{
                  borderRadius: "10px",
                  border: "1px solid var(--border-medium)",
                  fontSize: "13px",
                  fontFamily: "DM Sans, sans-serif",
                  padding: "9px 12px",
                  backgroundColor: "var(--bg-surface)",
                }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                State
              </label>
              <input
                className="form-control"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                style={{
                  borderRadius: "10px",
                  border: "1px solid var(--border-medium)",
                  fontSize: "13px",
                  fontFamily: "DM Sans, sans-serif",
                  padding: "9px 12px",
                  backgroundColor: "var(--bg-surface)",
                }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                Country
              </label>
              <input
                className="form-control"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                style={{
                  borderRadius: "10px",
                  border: "1px solid var(--border-medium)",
                  fontSize: "13px",
                  fontFamily: "DM Sans, sans-serif",
                  padding: "9px 12px",
                  backgroundColor: "var(--bg-surface)",
                }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                Pincode
              </label>
              <input
                className="form-control"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                style={{
                  borderRadius: "10px",
                  border: "1px solid var(--border-medium)",
                  fontSize: "13px",
                  fontFamily: "DM Sans, sans-serif",
                  padding: "9px 12px",
                  backgroundColor: "var(--bg-surface)",
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              className="btn me-2"
              style={{
                background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-indigo-light))",
                color: "white",
                borderRadius: "12px",
                padding: "9px 25px",
                border: "none",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(99,102,241,0.42)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.3)";
              }}
            >
              {editingBranch ? "Update Branch" : "Save Branch"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                borderRadius: "12px",
                padding: "9px 25px",
                fontSize: "13px",
                fontWeight: "500",
                border: "1.5px solid var(--border-medium)",
                backgroundColor: "var(--bg-white)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Branch;