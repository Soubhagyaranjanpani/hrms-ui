import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

const LeaveApproval = () => {
  const [leaves, setLeaves] = useState([
  {
    id: 1,
    employee: "Ritik",
    type: "Casual Leave",
    startDate: "2024-04-10",
    endDate: "2024-04-12",
    days: 3,
    status: "Pending",
    reason: "Personal Work",
    appliedDate: "2024-04-05",
  },

  {
    id: 2,
    employee: "Aman",
    type: "Sick Leave",
    startDate: "2024-04-06",
    endDate: "2024-04-06",
    days: 1,
    status: "Approved",
    reason: "Fever",
    appliedDate: "2024-04-01",
  },

  {
    id: 3,
    employee: "Neha",
    type: "Annual Leave",
    startDate: "2024-04-15",
    endDate: "2024-04-18",
    days: 4,
    status: "Rejected",
    reason: "Travel",
    appliedDate: "2024-04-10",
  }
]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(""); // "approved" or "rejected"
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Approve
  const handleApprove = (id) => {
    const updated = leaves.map((l) =>
      l.id === id ? { ...l, status: "Approved" } : l
    );
    setLeaves(updated);
    setPopupType("approved");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  // ❌ Reject
  const handleReject = (id) => {
    const updated = leaves.map((l) =>
      l.id === id ? { ...l, status: "Rejected" } : l
    );
    setLeaves(updated);
    setPopupType("rejected");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const filteredLeaves = leaves.filter((l) =>
    l.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status) => {
    if (status === "Approved") return "badge-success";
    if (status === "Rejected") return "badge-danger";
    return "badge-warning";
  };

  return (
    <div className="emp-root">
      {/* Header */}
      <div className="emp-header">
        <h1 className="emp-title">Leave Approval</h1>
      </div>

      {/* Search */}
      <div className="emp-search-bar">
        <div className="emp-search-wrap">
          <FaSearch size={12} />
          <input
            className="emp-search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")}>
              <FaTimes size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="emp-table-card">
        <table className="emp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((leave, index) => (
              <tr key={leave.id}>
                <td>{index + 1}</td>
                <td>{leave.employee}</td>
                <td>{leave.type}</td>
                <td>{leave.startDate} → {leave.endDate}</td>
                <td>{leave.days}</td>
                <td>{leave.reason}</td>
                <td>
                  <span className={getStatusClass(leave.status)}>
                    {leave.status}
                  </span>
                </td>
                <td>
                  {leave.status === "Pending" && (
                    <>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => handleApprove(leave.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(leave.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 POPUP – NO BORDER, ONLY SPINNER + MESSAGE */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "320px",
              padding: "24px",
              borderRadius: "20px",
              background: "#1a1a2e",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LoadingSpinner
              message={
                popupType === "approved"
                  ? "Leave Approved Successfully "
                  : "❌ Leave Rejected!"
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;
















































// import { useState } from "react";
// import { FaSearch, FaTimes } from "react-icons/fa";
// // import LoadingSpinner from "../components/LoadingSpinner";

// const LeaveApproval = () => {
//   const [leaves, setLeaves] = useState([
//     {
//       id: 1,
//       employee: "Ritik",
//       type: "Casual Leave",
//       startDate: "2024-04-10",
//       endDate: "2024-04-12",
//       days: 3,
//       status: "Pending",
//       reason: "Personal Work",
//       appliedDate: "2024-04-05",
//     },
//     {
//       id: 2,
//       employee: "Aman",
//       type: "Sick Leave",
//       startDate: "2024-04-06",
//       endDate: "2024-04-06",
//       days: 1,
//       status: "Approved",
//       reason: "Fever",
//       appliedDate: "2024-04-01",
//     },
//   ]);

//   const [showPopup, setShowPopup] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   // ✅ Approve
//   const handleApprove = (id) => {
//     const updated = leaves.map((l) =>
//       l.id === id ? { ...l, status: "Approved" } : l
//     );
//     setLeaves(updated);
//     setShowPopup(true);
//     setTimeout(() => {
//       setShowPopup(false);
//     }, 2000);
//   };

//   // ❌ Reject
//   const handleReject = (id) => {
//     const updated = leaves.map((l) =>
//       l.id === id ? { ...l, status: "Rejected" } : l
//     );
//     setLeaves(updated);
//   };

//   // filter
//   const filteredLeaves = leaves.filter((l) =>
//     l.employee.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // status style
//   const getStatusClass = (status) => {
//     if (status === "Approved") return "badge-success";
//     if (status === "Rejected") return "badge-danger";
//     return "badge-warning";
//   };

//   return (
//     <div className="emp-root">
//       {/* Header */}
//       <div className="emp-header">
//         <h1 className="emp-title">Leave Approval</h1>
//       </div>

//       {/* Search */}
//       <div className="emp-search-bar">
//         <div className="emp-search-wrap">
//           <FaSearch size={12} />
//           <input
//             className="emp-search-input"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           {searchTerm && (
//             <button onClick={() => setSearchTerm("")}>
//               <FaTimes size={11} />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Table */}
//       <div className="emp-table-card">
//         <table className="emp-table">
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>Employee</th>
//               <th>Type</th>
//               <th>Duration</th>
//               <th>Days</th>
//               <th>Reason</th>
//               <th>Status</th>
//               <th>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredLeaves.map((leave, index) => (
//               <tr key={leave.id}>
//                 <td>{index + 1}</td>
//                 <td>{leave.employee}</td>
//                 <td>{leave.type}</td>
//                 <td>{leave.startDate} → {leave.endDate}</td>
//                 <td>{leave.days}</td>
//                 <td>{leave.reason}</td>
//                 <td>
//                   <span className={getStatusClass(leave.status)}>
//                     {leave.status}
//                   </span>
//                 </td>
//                 <td>
//                   {leave.status === "Pending" && (
//                     <>
//                       <button
//                         className="btn btn-success btn-sm me-2"
//                         onClick={() => handleApprove(leave.id)}
//                       >
//                         Approve
//                       </button>
//                       <button
//                         className="btn btn-danger btn-sm"
//                         onClick={() => handleReject(leave.id)}
//                       >
//                         Reject
//                       </button>
//                     </>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* ✅ Compact Popup – fixed width & auto height, no huge dimensions */}
//       {showPopup && (
//         <div
//           style={{
//             position: "fixed",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "100%",
//             background: "rgba(0,0,0,0.5)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             zIndex: 9999,
//           }}
//         >
//           <div
//             style={{
//               width: "280px",           // fixed compact width
//               background: "var(--card-bg)",
//               borderRadius: "20px",
//               padding: "24px 20px",
//               boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//             }}
//           >
//             {/* Override LoadingSpinner styles for popup use */}
//             <div style={{ textAlign: "center", width: "100%" }}>
//               <div
//                 style={{
//                   display: "inline-block",
//                   width: "60px",
//                   height: "60px",
//                   position: "relative",
//                   marginBottom: "16px",
//                 }}
//               >
//                 <div
//                   style={{
//                     position: "absolute",
//                     width: "100%",
//                     height: "100%",
//                     borderRadius: "50%",
//                     border: "3px solid transparent",
//                     borderTopColor: "#2d9c7c",
//                     borderRightColor: "#2d9c7c",
//                     animation: "spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite",
//                   }}
//                 />
//                 <div
//                   style={{
//                     position: "absolute",
//                     width: "70%",
//                     height: "70%",
//                     top: "15%",
//                     left: "15%",
//                     borderRadius: "50%",
//                     border: "3px solid transparent",
//                     borderBottomColor: "#f4b942",
//                     borderLeftColor: "#f4b942",
//                     animation: "spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite 0.3s",
//                   }}
//                 />
//                 <div
//                   style={{
//                     position: "absolute",
//                     width: "40%",
//                     height: "40%",
//                     top: "30%",
//                     left: "30%",
//                     borderRadius: "50%",
//                     border: "3px solid transparent",
//                     borderTopColor: "#e74c3c",
//                     borderRightColor: "#e74c3c",
//                     animation: "spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite 0.6s",
//                   }}
//                 />
//                 <div
//                   style={{
//                     position: "absolute",
//                     width: "20%",
//                     height: "20%",
//                     top: "40%",
//                     left: "40%",
//                     background: "linear-gradient(135deg, #2d9c7c, #f4b942)",
//                     borderRadius: "50%",
//                     animation: "pulse 1.5s ease-in-out infinite",
//                   }}
//                 />
//               </div>
//               <p
//                 style={{
//                   color: "#b0b0b0",
//                   fontSize: "14px",
//                   margin: 0,
//                   animation: "fadeInOut 1.5s ease-in-out infinite",
//                 }}
//               >
//                 Leave Approved...
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add keyframe animations (if not already in global CSS) */}
//       <style>{`
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//         @keyframes pulse {
//           0%, 100% { transform: scale(1); opacity: 0.8; }
//           50% { transform: scale(1.2); opacity: 1; }
//         }
//         @keyframes fadeInOut {
//           0%, 100% { opacity: 0.6; }
//           50% { opacity: 1; }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default LeaveApproval;