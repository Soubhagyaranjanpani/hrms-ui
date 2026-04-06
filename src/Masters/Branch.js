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

    setFormData({
      branchName: "",
      branchCode: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    });

    setShowForm(false);
    setCurrentPage(1); // ✅ Reset to first page after add/edit
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

  // Filtered data based on search (search on multiple fields)
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
  const currentBranches = filteredBranches.slice(startIndex, endIndex); // ✅ Use this for rendering

  // Go to specific page
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle search with page reset
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // ✅ Reset to first page when searching
  };

  // ================= LIST VIEW =================
  if (!showForm) {
    return (
      <div className="container mt-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0" style={{ color: "#6366f1" }}>
            Branch Directory
          </h2>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Name..."
              value={searchQuery}
              onChange={handleSearch} // ✅ Using handleSearch that resets page
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
                setEditingBranch(null);
                setFormData({
                  branchName: "",
                  branchCode: "",
                  address: "",
                  city: "",
                  state: "",
                  country: "",
                  pincode: "",
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
                  <th>CODE</th>
                  <th>BRANCH NAME</th>
                  <th>ADDRESS</th>
                  <th>CITY</th>
                  <th>STATE</th>
                  <th>COUNTRY</th>
                  <th>PINCODE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentBranches.length > 0 ? ( // ✅ Use currentBranches
                  currentBranches.map((branch, index) => (
                    <tr key={branch.id}>
                      <td>{startIndex + index + 1}</td> {/* ✅ Correct row number */}
                      <td>{branch.branchCode}</td>
                      <td>{branch.branchName}</td>
                      <td>{branch.address}</td>
                      <td>{branch.city}</td>
                      <td>{branch.state}</td>
                      <td>{branch.country}</td>
                      <td>{branch.pincode}</td>

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
                              backgroundColor:
                                branch.status === "y" ? "#2d6cdf" : "#ccc",
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
                              color: branch.status === "y" ? "#2d6cdf" : "#999",
                              fontWeight: "600",
                              fontSize: "13px",
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
                            backgroundColor:
                              branch.status === "y" ? "#6366f1" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            cursor: branch.status === "y" ? "pointer" : "not-allowed",
                            opacity: branch.status === "y" ? 1 : 0.6,
                            border: "none",
                          }}
                          onClick={() => handleEdit(branch)}
                          disabled={branch.status !== "y"}
                          title={
                            branch.status !== "y"
                              ? "Cannot edit inactive branch"
                              : "Edit branch"
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
                      No branches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ PAGINATION - exactly like Role component */}
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
                {/* Previous button */}
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

                {/* Page numbers */}
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

                {/* Next button */}
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

  // ================= FORM VIEW =================
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
          {editingBranch ? "Edit Branch" : "Add Branch"}
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
                Branch Code
              </label>
              <input
                className="form-control"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleInputChange}
                required
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Branch Name
              </label>
              <input
                className="form-control"
                name="branchName"
                value={formData.branchName}
                onChange={handleInputChange}
                required
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Address
              </label>
              <input
                className="form-control"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                City
              </label>
              <input
                className="form-control"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                State
              </label>
              <input
                className="form-control"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Country
              </label>
              <input
                className="form-control"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>
                Pincode
              </label>
              <input
                className="form-control"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
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
              {editingBranch ? "Update Branch" : "Save Branch"}
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

export default Branch;