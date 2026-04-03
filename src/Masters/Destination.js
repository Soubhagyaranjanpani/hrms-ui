import { useState } from "react";
import { FaEdit, FaArrowLeft } from "react-icons/fa";



const Destination = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingDestination, setEditingDestination] = useState(null);

    const [formData, setFormData] = useState({
        destinationName: "",
    });

    const [destinationData, setDestinationData] = useState([
        { id: 1, destinationName: "Paris", status: "y" },
        { id: 2, destinationName: "Tokyo", status: "y" },
        { id: 3, destinationName: "New York", status: "y" },
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

    const filteredDestinations = destinationData.filter((d) =>
        d.destinationName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ================= LIST =================
    if (!showForm) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">Destination Directory</h2>

                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by Destination..."
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
                                {filteredDestinations.map((destination, index) => (
                                    <tr key={destination.id}>
                                        <td>{index + 1}</td>
                                        <td>{destination.destinationName}</td>

                                        {/* SAME TOGGLE */}
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
                                                        color:
                                                            destination.status === "y" ? "#2d6cdf" : "#999",
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

                <h2>{editingDestination ? "Edit Destination" : "Add Destination"}</h2>
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
                                borderRadius: "10px",
                                padding: "8px 25px",
                            }}
                        >
                            {editingDestination ? "Update" : "Save"}
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

export default Destination;