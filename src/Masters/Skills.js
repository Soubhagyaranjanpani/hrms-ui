
import { useState } from "react";
import { FaEdit, FaArrowLeft, FaSearch, FaTimes } from "react-icons/fa";

const Skills = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    employeeId: "",
    skillName: "",
    proficiency: 3,
  });

  // Dummy employee list for dropdown
  const dummyEmployees = [
    { id: 1, name: "Soubhagya" },
    { id: 2, name: "Rahul Sharma" },
    { id: 3, name: "Priya Patel" },
    { id: 4, name: "Amit Kumar" },
    { id: 5, name: "Neha Singh" },
  ];

  // Dummy skills data with status
  const [skillsData, setSkillsData] = useState([
    { id: 1, employeeId: 1, employeeName: "Soubhagya", skillName: "React", proficiency: 5, status: "y" },
    { id: 2, employeeId: 1, employeeName: "Soubhagya", skillName: "Spring Boot", proficiency: 4, status: "y" },
    { id: 3, employeeId: 2, employeeName: "Rahul Sharma", skillName: "Python", proficiency: 3, status: "y" },
    { id: 4, employeeId: 3, employeeName: "Priya Patel", skillName: "Project Management", proficiency: 5, status: "y" },
    { id: 5, employeeId: 4, employeeName: "Amit Kumar", skillName: "Java", proficiency: 4, status: "n" },
    { id: 6, employeeId: 4, employeeName: "Amit Kumar", skillName: "SQL", proficiency: 4, status: "y" },
    { id: 7, employeeId: 5, employeeName: "Neha Singh", skillName: "Communication", proficiency: 5, status: "y" },
  ]);

  // Helper to reset form state
  const resetForm = () => {
    setFormData({ employeeId: "", skillName: "", proficiency: 3 });
    setEditingSkill(null);
  };

  // INPUT
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // STATUS TOGGLE
  const handleStatusToggle = (id) => {
    const updated = skillsData.map((s) =>
      s.id === id ? { ...s, status: s.status === "y" ? "n" : "y" } : s
    );
    setSkillsData(updated);
  };

  // SAVE
  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedEmployee = dummyEmployees.find(emp => emp.id === parseInt(formData.employeeId));
    const employeeName = selectedEmployee ? selectedEmployee.name : "Unknown";

    if (editingSkill) {
      const updated = skillsData.map((s) =>
        s.id === editingSkill.id
          ? {
              ...s,
              employeeId: parseInt(formData.employeeId),
              employeeName: employeeName,
              skillName: formData.skillName,
              proficiency: parseInt(formData.proficiency),
            }
          : s
      );
      setSkillsData(updated);
      setEditingSkill(null);
    } else {
      const newSkill = {
        id: skillsData.length + 1,
        employeeId: parseInt(formData.employeeId),
        employeeName: employeeName,
        skillName: formData.skillName,
        proficiency: parseInt(formData.proficiency),
        status: "y", // new skills default to active
      };
      setSkillsData([...skillsData, newSkill]);
    }

    resetForm();
    setShowForm(false);
    setCurrentPage(1);
  };

  // EDIT
  const handleEdit = (skill) => {
    // Prevent editing inactive skills
    if (skill.status !== "y") {
      alert("Cannot edit an inactive skill. Please activate it first.");
      return;
    }
    setEditingSkill(skill);
    setFormData({
      employeeId: skill.employeeId.toString(),
      skillName: skill.skillName,
      proficiency: skill.proficiency,
    });
    setShowForm(true);
  };

  // Filtered data based on search (by employee name or skill name)
  const filteredSkills = skillsData.filter((s) =>
    s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.skillName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredSkills.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentSkills = filteredSkills.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Render proficiency as progress bar
  const renderProficiency = (level) => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "60px",
            height: "8px",
            backgroundColor: "var(--border-light)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(level / 5) * 100}%`,
              height: "100%",
              backgroundColor: "var(--accent-indigo)",
              borderRadius: "4px",
            }}
          />
        </div>
        <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)" }}>
          {level}/5
        </span>
      </div>
    );
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
            Employee Skills
          </h2>

          <div className="d-flex gap-2">
            <div style={{ position: "relative", width: "250px" }}>
              <FaSearch
                size={12}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search by employee or skill..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid var(--border-medium)",
                  fontSize: "13px",
                  padding: "8px 14px 8px 34px",
                  fontFamily: "DM Sans, sans-serif",
                }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "2px",
                  }}
                >
                  <FaTimes size={11} />
                </button>
              )}
            </div>

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
              Add Skill
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
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>EMPLOYEE</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>SKILL</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>PROFICIENCY</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>STATUS</th>
                  <th style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {currentSkills.length > 0 ? (
                  currentSkills.map((skill, index) => (
                    <tr key={skill.id}>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{startIndex + index + 1}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{skill.employeeName}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{skill.skillName}</td>
                      <td>{renderProficiency(skill.proficiency)}</td>
                      <td>
                        <div
                          onClick={() => handleStatusToggle(skill.id)}
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
                              backgroundColor: skill.status === "y" ? "var(--accent-indigo)" : "#ccc",
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
                                left: skill.status === "y" ? "22px" : "2px",
                                transition: "0.3s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: skill.status === "y" ? "var(--accent-indigo)" : "#999",
                              fontWeight: "600",
                              fontSize: "12px",
                            }}
                          >
                            {skill.status === "y" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor: skill.status === "y" ? "var(--accent-indigo)" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            cursor: skill.status === "y" ? "pointer" : "not-allowed",
                            opacity: skill.status === "y" ? 1 : 0.6,
                            border: "none",
                            fontSize: "12px",
                            transition: "all 0.2s",
                          }}
                          disabled={skill.status !== "y"}
                          onClick={() => handleEdit(skill)}
                          title={skill.status !== "y" ? "Cannot edit inactive skill" : "Edit skill"}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted" style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      No skills found.
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
          {editingSkill ? "Edit Skill" : "Add Skill"}
        </h2>

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
            {/* Employee Dropdown */}
            <div className="col-md-6">
              <label
                style={{
                  color: "var(--accent-indigo)",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "6px",
                }}
              >
                Employee <span style={{ color: "red" }}>*</span>
              </label>
              <select
                className="form-control"
                name="employeeId"
                value={formData.employeeId}
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
                <option value="">Select Employee</option>
                {dummyEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill Name */}
            <div className="col-md-6">
              <label
                style={{
                  color: "var(--accent-indigo)",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "6px",
                }}
              >
                Skill Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="form-control"
                name="skillName"
                value={formData.skillName}
                onChange={handleInputChange}
                required
                placeholder="e.g., React, Java, Communication"
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

            {/* Proficiency Slider */}
            <div className="col-md-12">
              <label
                style={{
                  color: "var(--accent-indigo)",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "6px",
                }}
              >
                Proficiency (1-5)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <input
                  type="range"
                  name="proficiency"
                  min="1"
                  max="5"
                  value={formData.proficiency}
                  onChange={handleInputChange}
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    minWidth: "40px",
                    textAlign: "center",
                    fontWeight: "600",
                    color: "var(--accent-indigo)",
                    fontSize: "14px",
                  }}
                >
                  {formData.proficiency}
                </span>
              </div>
              <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                1 = Beginner, 5 = Expert
              </small>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
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
              {editingSkill ? "Update" : "Save"}
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

export default Skills;