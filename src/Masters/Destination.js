import { useState } from "react";
import { FaEdit, FaArrowLeft } from "react-icons/fa";

const Destination = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDestination, setEditingDestination] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    destinationName: "",
  });

  const [destinationData, setDestinationData] = useState([
    { id: 1, destinationName: "Paris", status: "y" },
    { id: 2, destinationName: "Tokyo", status: "y" },
    { id: 3, destinationName: "New York", status: "y" },
    { id: 4, destinationName: "London", status: "y" },
    { id: 5, destinationName: "Dubai", status: "y" },
    { id: 6, destinationName: "Singapore", status: "y" },
    { id: 7, destinationName: "Sydney", status: "y" },
  ]);

  // INPUT
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // SAVE
  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingDestination) {
      const updated = destinationData.map((d) =>
        d.id === editingDestination.id ? { ...d, ...formData } : d
      );
      setDestinationData(updated);
      setEditingDestination(null);
    } else {
      const newDestination = {
        id: destinationData.length + 1,
        ...formData,
        status: "y",
      };
      setDestinationData([...destinationData, newDestination]);
    }

    setFormData({ destinationName: "" });
    setShowForm(false);
    setCurrentPage(1); // reset to first page after add/edit
  };

  // EDIT
  const handleEdit = (destination) => {
    if (destination.status === "y") {
      setEditingDestination(destination);
      setFormData(destination);
      setShowForm(true);
    }
  };

  // STATUS TOGGLE
  const handleStatusToggle = (id) => {
    const updated = destinationData.map((d) =>
      d.id === id ? { ...d, status: d.status === "y" ? "n" : "y" } : d
    );
    setDestinationData(updated);
  };

  // Filtered data based on search
  const filteredDestinations = destinationData.filter((d) =>
    d.destinationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredDestinations.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentDestinations = filteredDestinations.slice(startIndex, endIndex);

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
            Destination Directory
          </h2>

          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Destination..."
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
                {currentDestinations.length > 0 ? (
                  currentDestinations.map((destination, index) => (
                    <tr key={destination.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{destination.destinationName}</td>
                      <td>
                        <div
                          onClick={() => handleStatusToggle(destination.id)}
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
                                destination.status === "y" ? "#2d6cdf" : "#ccc",
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
                                left: destination.status === "y" ? "22px" : "2px",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              color: destination.status === "y" ? "#2d6cdf" : "#999",
                              fontWeight: "600",
                              fontSize: "13px",
                            }}
                          >
                            {destination.status === "y" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor:
                              destination.status === "y" ? "#6366f1" : "#ccc",
                            color: "white",
                            borderRadius: "10px",
                            padding: "6px 10px",
                            border: "none",
                          }}
                          disabled={destination.status !== "y"}
                          onClick={() => handleEdit(destination)}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
                      No destinations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
          {editingDestination ? "Edit Destination" : "Add Destination"}
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
            <div className="col-md-12">
              <label style={{ color: "#6366f1" }}>Destination Name</label>
              <input
                className="form-control"
                name="destinationName"
                value={formData.destinationName}
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
              {editingDestination ? "Update" : "Save"}
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

export default Destination;