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
    { "id": 1, "roleName": "Admin", "status": "y" },
    { "id": 2, "roleName": "Manager", "status": "y" },
    { "id": 3, "roleName": "HR", "status": "y" },
    { "id": 4, "roleName": "Developer", "status": "y" },
    { "id": 5, "roleName": "Tester", "status": "y" },
    { "id": 6, "roleName": "Accountant", "status": "y" },
    { "id": 7, "roleName": "Support", "status": "y" }
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

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // ================= LIST VIEW =================
  if (!showForm) {
    return (
      <div className="container mt-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0" style={{ color: "#6366f1" }}>Role Directory</h2>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Role..."
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
                  <th>No</th>
                  <th>NAME</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentRoles.length > 0 ? (
                  currentRoles.map((role, index) => (
                    <tr key={role.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{role.roleName}</td>
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
                              backgroundColor:
                                role.status === "y" ? "#2d6cdf" : "#ccc",
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
                                left: role.status === "y" ? "22px" : "2px",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: role.status === "y" ? "#2d6cdf" : "#999",
                              fontWeight: "600",
                              fontSize: "13px",
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
                            backgroundColor:
                              role.status === "y" ? "#6366f1" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            border: "none",
                          }}
                          disabled={role.status !== "y"}
                          onClick={() => handleEdit(role)}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
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

  // ================= FORM VIEW =================
  return (
    <div className="container mt-1">
      {/* Header with Back button on the right side */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 style={{ color: "#6366f1", fontWeight: "700" }}>
          {editingRole ? "Edit Role" : "Add Role"}
        </h2>

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
            <div className="col-md-12">
              <label style={{ color: "#6366f1" }}>Role Name</label>
              <input
                className="form-control"
                name="roleName"
                value={formData.roleName}
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
              }}
            >
              {editingRole ? "Update" : "Save"}
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

export default Role;