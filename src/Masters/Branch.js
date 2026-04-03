import { useState } from "react";
import { FaEdit, FaArrowLeft } from "react-icons/fa";


const Branch = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);

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
            branchName: "Morgan Stanley Financial",
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
            city: "New York City",
            state: "New York",
            country: "USA",
            pincode: "10001",
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

    const filteredBranches = branchData.filter(
        (b) =>
            b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // ================= LIST VIEW =================
    if (!showForm) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">Branch Directory</h2>

                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by Name, Code or City..."
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
                                padding: "8px 20px"
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
                        boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
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
                                {filteredBranches.map((branch, index) => (
                                    <tr key={branch.id}>
                                        <td>{index + 1}</td>
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

                                        {/* ACTION BUTTON - Only enabled for active branches */}
                                        <td>
                                            <button
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: branch.status === "y" ? "#6366f1" : "#ccc",
                                                    color: "white",
                                                    borderRadius: "10px",
                                                    padding: "6px 10px",
                                                    cursor: branch.status === "y" ? "pointer" : "not-allowed",
                                                    opacity: branch.status === "y" ? 1 : 0.6,
                                                    border: "none"
                                                }}
                                                onClick={() => handleEdit(branch)}
                                                disabled={branch.status !== "y"}
                                                title={branch.status !== "y" ? "Cannot edit inactive branch" : "Edit branch"}
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

    // ================= FORM VIEW =================
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
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                    onClick={() => setShowForm(false)}
                >
                    <FaArrowLeft /> Back
                </button>

                <h2 className="mb-0">
                    {editingBranch ? "Edit Branch" : "Add New Branch"}
                </h2>
            </div>

            <div
                className="card p-4 shadow-sm"
                style={{
                    borderRadius: "15px",
                    border: "none",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
                }}
            >
                <form onSubmit={handleSubmit}>
                    <div className="row g-3">

                        <div className="col-md-6">
                            <label className="form-label fw-semibold" style={{ color: "#6366f1" }}>Branch Code</label>
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
                            <label className="form-label fw-semibold" style={{ color: "#6366f1", }}>Branch Name</label>
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
                            <label className="form-label fw-semibold" style={{ color: "#6366f1", }}>Address</label>
                            <input
                                className="form-control"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                style={{ borderRadius: "8px" }}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-semibold" style={{ color: "#6366f1", }}>City</label>
                            <input
                                className="form-control"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                style={{ borderRadius: "8px" }}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-semibold" style={{ color: "#6366f1", }}>State</label>
                            <input
                                className="form-control"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                style={{ borderRadius: "8px" }}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-semibold" style={{ color: "#6366f1", }}>Country</label>
                            <input
                                className="form-control"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                style={{ borderRadius: "8px" }}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-semibold" style={{ color: "#6366f1", }}>Pincode</label>
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
                                borderRadius: "10px",
                                padding: "8px 25px",
                                border: "none"
                            }}
                        >
                            {editingBranch ? "Update Branch" : "Save Branch"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                                borderRadius: "10px",
                                padding: "8px 25px"
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