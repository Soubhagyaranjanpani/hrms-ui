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
    setCurrentPage(1);
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
            Department Directory
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
                setShowForm(true);
                setEditingDept(null);
                setFormData({
                  deptName: "",
                  deptCode: "",
                  branch: "",
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
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>NO</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>NAME</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>CODE</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>BRANCH</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>STATUS</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentDepts.length > 0 ? (
                  currentDepts.map((dept, index) => (
                    <tr key={dept.id}>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{startIndex + index + 1}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{dept.deptName}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{dept.deptCode}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{dept.branch}</td>
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
                              backgroundColor: dept.status === "y" ? "var(--accent-indigo)" : "#ccc",
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
                                left: dept.status === "y" ? "22px" : "2px",
                                transition: "0.3s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: dept.status === "y" ? "var(--accent-indigo)" : "#999",
                              fontWeight: "600",
                              fontSize: "12px",
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
                            backgroundColor: dept.status === "y" ? "var(--accent-indigo)" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            cursor: dept.status === "y" ? "pointer" : "not-allowed",
                            opacity: dept.status === "y" ? 1 : 0.6,
                            border: "none",
                            fontSize: "12px",
                            transition: "all 0.2s",
                          }}
                          disabled={dept.status !== "y"}
                          onClick={() => handleEdit(dept)}
                          title={dept.status !== "y" ? "Cannot edit inactive department" : "Edit department"}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted" style={{ fontSize: "13px", color: "var(--text-muted)" }}>
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
          {editingDept ? "Edit Department" : "Add Department"}
        </h2>

        <button
          className="btn"
          style={{
            background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-indigo-light))",
            color: "white",
            borderRadius: "12px",
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: "600",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => setShowForm(false)}
        >
          <FaArrowLeft /> Back
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
            <div className="col-md-4">
              <label style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                Name
              </label>
              <input
                className="form-control"
                name="deptName"
                value={formData.deptName}
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

            <div className="col-md-4">
              <label style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                Code
              </label>
              <input
                className="form-control"
                name="deptCode"
                value={formData.deptCode}
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

            <div className="col-md-4">
              <label style={{ color: "var(--accent-indigo)", fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>
                Branch
              </label>
              <select
                className="form-control"
                name="branch"
                value={formData.branch}
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
              {editingDept ? "Update" : "Save"}
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