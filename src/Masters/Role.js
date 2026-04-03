import { useState } from "react";
import { FaEdit, FaArrowLeft } from "react-icons/fa";

const Role = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [formData, setFormData] = useState({
    roleName: "",
  });

  const [roleData, setRoleData] = useState([
    { id: 1, roleName: "Admin", status: "y" },
    { id: 2, roleName: "Doctor", status: "y" },
    { id: 3, roleName: "Nurse", status: "y" },
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

  const filteredRoles = roleData.filter((r) =>
    r.roleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ================= LIST =================
  if (!showForm) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Role Directory</h2>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "250px", borderRadius: "10px" }}
            />

            <button
              className="btn"
              style={{
                backgroundColor: "#6366f1",
                color: "white",
                borderRadius: "10px",
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
                {filteredRoles.map((role, index) => (
                  <tr key={role.id}>
                    <td>{index + 1}</td>
                    <td>{role.roleName}</td>

                    {/* SAME TOGGLE */}
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
                            color:
                              role.status === "y" ? "#2d6cdf" : "#999",
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ================= FORM =================
  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn"
          style={{
            backgroundColor: "#6366f1",
            color: "white",
            borderRadius: "10px",
            padding: "8px 20px",
          }}
          onClick={() => setShowForm(false)}
        >
          <FaArrowLeft /> Back
        </button>

        <h2>{editingRole ? "Edit Role" : "Add Role"}</h2>
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
                borderRadius: "10px",
                padding: "8px 25px",
              }}
            >
              {editingRole ? "Update" : "Save"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ borderRadius: "10px", padding: "8px 25px" }}
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