import { useState } from "react";
import { FaEdit, FaArrowLeft } from "react-icons/fa";

const Role = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    roleName: "",
  });

  const [roleData, setRoleData] = useState([
    { id: 1, roleName: "Admin", status: "y" },
    { id: 2, roleName: "Manager", status: "y" },
    { id: 3, roleName: "HR", status: "y" },
    { id: 4, roleName: "Developer", status: "y" },
    { id: 5, roleName: "Tester", status: "y" },
    { id: 6, roleName: "Accountant", status: "y" },
    { id: 7, roleName: "Support", status: "y" },
  ]);

  // INPUT
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // SAVE
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingRole) {
      const updated = roleData.map((r) =>
        r.id === editingRole.id ? { ...r, ...formData } : r
      );
      setRoleData(updated);
      setEditingRole(null);
    } else {
      const newRole = {
        id: roleData.length + 1,
        ...formData,
        status: "y",
      };
      setRoleData([...roleData, newRole]);
    }

    setFormData({ roleName: "" });
    setShowForm(false);
    setCurrentPage(1);
  };

  // EDIT
  const handleEdit = (role) => {
    if (role.status === "y") {
      setEditingRole(role);
      setFormData(role);
      setShowForm(true);
    }
  };

  // STATUS TOGGLE
  const handleStatusToggle = (id) => {
    const updated = roleData.map((r) =>
      r.id === id ? { ...r, status: r.status === "y" ? "n" : "y" } : r
    );
    setRoleData(updated);
  };

  // Filtered data based on search
  const filteredRoles = roleData.filter((r) =>
    r.roleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredRoles.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentRoles = filteredRoles.slice(startIndex, endIndex);

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
            Role Directory
          </h2>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Role..."
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
                setEditingRole(null);
                setFormData({ roleName: "" });
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
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>STATUS</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentRoles.length > 0 ? (
                  currentRoles.map((role, index) => (
                    <tr key={role.id}>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{startIndex + index + 1}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{role.roleName}</td>
                      <td>
                        <div
                          onClick={() => handleStatusToggle(role.id)}
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
                              backgroundColor: role.status === "y" ? "var(--accent-indigo)" : "#ccc",
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
                                left: role.status === "y" ? "22px" : "2px",
                                transition: "0.3s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: role.status === "y" ? "var(--accent-indigo)" : "#999",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            {role.status === "y" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor: role.status === "y" ? "var(--accent-indigo)" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            cursor: role.status === "y" ? "pointer" : "not-allowed",
                            opacity: role.status === "y" ? 1 : 0.6,
                            border: "none",
                            fontSize: "12px",
                            transition: "all 0.2s",
                          }}
                          disabled={role.status !== "y"}
                          onClick={() => handleEdit(role)}
                          title={role.status !== "y" ? "Cannot edit inactive role" : "Edit role"}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted" style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      No roles found.
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
          {editingRole ? "Edit Role" : "Add Role"}
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
            <div className="col-md-6">
              <label
                style={{
                  color: "var(--accent-indigo)",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "6px",
                }}
              >
                Role Name
              </label>
              <input
                className="form-control"
                name="roleName"
                value={formData.roleName}
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
              {editingRole ? "Update" : "Save"}
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

export default Role;