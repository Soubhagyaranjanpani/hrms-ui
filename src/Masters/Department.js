import { useState } from "react";
import { FaEdit, FaArrowLeft } from "react-icons/fa";

const Department = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    deptName: "",
    deptCode: "",
    branch: "",
  });

  const [deptData, setDeptData] = useState([
    {
      id: 1,
      deptName: "Cardiology",
      deptCode: "CAR001",
      branch: "City Hospital",
      status: "y",
    },
    {
      id: 2,
      deptName: "Neurology",
      deptCode: "NEU002",
      branch: "City Hospital",
      status: "y",
    },
    {
      id: 3,
      deptName: "Orthopedics",
      deptCode: "ORT003",
      branch: "City Hospital",
      status: "y",
    },
    {
      id: 4,
      deptName: "Pediatrics",
      deptCode: "PED004",
      branch: "City Hospital",
      status: "y",
    },
    {
      id: 5,
      deptName: "Radiology",
      deptCode: "RAD005",
      branch: "City Hospital",
      status: "y",
    },
    {
      id: 6,
      deptName: "Dermatology",
      deptCode: "DER006",
      branch: "City Hospital",
      status: "y",
    },
    {
      id: 7,
      deptName: "Oncology",
      deptCode: "ONC007",
      branch: "City Hospital",
      status: "y",
    },
  ]);

  // INPUT
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ADD + UPDATE
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingDept) {
      const updated = deptData.map((d) =>
        d.id === editingDept.id ? { ...d, ...formData } : d
      );
      setDeptData(updated);
      setEditingDept(null);
    } else {
      const newDept = {
        id: deptData.length + 1,
        ...formData,
        status: "y",
      };
      setDeptData([...deptData, newDept]);
    }

    setFormData({
      deptName: "",
      deptCode: "",
      branch: "",
    });

    setShowForm(false);
    setCurrentPage(1); // reset to first page after add/edit
  };

  // EDIT
  const handleEdit = (dept) => {
    if (dept.status === "y") {
      setEditingDept(dept);
      setFormData(dept);
      setShowForm(true);
    }
  };

  // STATUS
  const handleStatusToggle = (id) => {
    const updated = deptData.map((d) =>
      d.id === id ? { ...d, status: d.status === "y" ? "n" : "y" } : d
    );
    setDeptData(updated);
  };

  // Filtered data based on search
  const filteredDepts = deptData.filter(
    (d) =>
      d.deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deptCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredDepts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentDepts = filteredDepts.slice(startIndex, endIndex);

  // Go to specific page
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when search changes
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // ================= LIST =================
  if (!showForm) {
    return (
      <div className="container mt-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0" style={{ color: "#6366f1" }}>
            Department Directory
          </h2>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Name..."
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
              onClick={() => setShowForm(true)}
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
                  <th>NO</th>
                  <th>NAME</th>
                  <th>CODE</th>
                  <th>BRANCH</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentDepts.length > 0 ? (
                  currentDepts.map((dept, index) => (
                    <tr key={dept.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{dept.deptName}</td>
                      <td>{dept.deptCode}</td>
                      <td>{dept.branch}</td>
                      <td>
                        <div
                          onClick={() => handleStatusToggle(dept.id)}
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
                                dept.status === "y" ? "#2d6cdf" : "#ccc",
                              position: "relative",
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
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: dept.status === "y" ? "#2d6cdf" : "#999",
                              fontWeight: "600",
                              fontSize: "13px",
                            }}
                          >
                            {dept.status === "y" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor:
                              dept.status === "y" ? "#6366f1" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            border: "none",
                          }}
                          disabled={dept.status !== "y"}
                          onClick={() => handleEdit(dept)}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No departments found.
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
                    backgroundColor: currentPage === totalPages ? "#f8f9fa" : "#ffffff",
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

  // ================= FORM =================
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
          }}
          onClick={() => setShowForm(false)}
        >
          <FaArrowLeft /> Back
        </button>

        <h2 style={{ color: "#6366f1", fontWeight: "700" }}>
          {editingDept ? "Edit Department" : "Add Department"}
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
            <div className="col-md-4">
              <label style={{ color: "#6366f1" }}>Name</label>
              <input
                className="form-control"
                name="deptName"
                value={formData.deptName}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-4">
              <label style={{ color: "#6366f1" }}>Code</label>
              <input
                className="form-control"
                name="deptCode"
                value={formData.deptCode}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              />
            </div>

            <div className="col-md-4">
              <label style={{ color: "#6366f1" }}>Branch</label>
              <select
                className="form-control"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                style={{ borderRadius: "8px" }}
              >
                <option value="">Select Branch</option>
                <option value="Delphi Healthcare">Delphi Healthcare</option>
                <option value="Morgan Stanley">Morgan Stanley</option>
                <option value="Infosys">Infosys</option>
                <option value="Google NYC">Google NYC</option>
              </select>
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
              }}
            >
              {editingDept ? "Update" : "Save"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ borderRadius: "20px", padding: "8px 25px" }}
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

export default Department;