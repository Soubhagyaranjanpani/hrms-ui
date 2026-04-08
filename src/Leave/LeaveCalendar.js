// import React, { useState, useEffect } from "react";
// import { FaChevronLeft, FaChevronRight, FaFilter, FaTimes, FaCalendarAlt } from "react-icons/fa";
// import axios from "axios";
// import { API_ENDPOINTS, STORAGE_KEYS } from "../config/api.config";
// import { toast } from "../components/Toast";
// import LoadingSpinner from "../components/LoadingSpinner";

// const LeaveCalendar = () => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [leaveEvents, setLeaveEvents] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);
//   const [filterDept, setFilterDept] = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [departments, setDepartments] = useState([]);
//   const [employees, setEmployees] = useState([]);

//   // Get current month/year details
//   const currentYear = currentDate.getFullYear();
//   const currentMonth = currentDate.getMonth();
//   const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
//   const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
//   const startDate = new Date(firstDayOfMonth);
//   startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
//   const endDate = new Date(lastDayOfMonth);
//   endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

//   const weeks = [];
//   let currentWeekStart = new Date(startDate);
//   while (currentWeekStart <= endDate) {
//     const week = [];
//     for (let i = 0; i < 7; i++) {
//       const day = new Date(currentWeekStart);
//       week.push(day);
//       currentWeekStart.setDate(currentWeekStart.getDate() + 1);
//     }
//     weeks.push(week);
//   }

//   // Fetch leave data (mock or real)
//   const fetchLeaveEvents = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
//       const headers = { Authorization: `Bearer ${token}` };
//       const response = await axios.get(API_ENDPOINTS.ALL_LEAVE_REQUESTS, { headers });
//       let leaves = response.data?.response || response.data || [];
//       leaves = leaves.filter(leave => {
//         const start = new Date(leave.startDate);
//         return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
//       });
//       setLeaveEvents(leaves);
//     } catch (error) {
//       console.error("Error fetching leave events:", error);
//       toast.error("Error", "Could not load leave calendar");
//       setLeaveEvents(generateMockLeaves(currentYear, currentMonth));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateMockLeaves = (year, month) => {
//     return [
//       { id: 1, employeeName: "John Doe", employeeId: "EMP001", leaveType: "Annual", startDate: new Date(year, month, 5), endDate: new Date(year, month, 7), status: "approved", department: "Engineering" },
//       { id: 2, employeeName: "Jane Smith", employeeId: "EMP002", leaveType: "Sick", startDate: new Date(year, month, 10), endDate: new Date(year, month, 12), status: "approved", department: "HR" },
//       { id: 3, employeeName: "Mike Johnson", employeeId: "EMP003", leaveType: "Casual", startDate: new Date(year, month, 15), endDate: new Date(year, month, 16), status: "pending", department: "Sales" },
//       { id: 4, employeeName: "Emily Brown", employeeId: "EMP004", leaveType: "Annual", startDate: new Date(year, month, 20), endDate: new Date(year, month, 25), status: "approved", department: "Marketing" },
//       { id: 5, employeeName: "Robert Wilson", employeeId: "EMP005", leaveType: "Sick", startDate: new Date(year, month, 2), endDate: new Date(year, month, 3), status: "rejected", department: "Engineering" },
//     ];
//   };

//   useEffect(() => {
//     fetchLeaveEvents();
//   }, [currentDate]);

//   const getLeaveTypeColor = (type) => {
//     switch (type?.toLowerCase()) {
//       case "annual": return "#6366f1";
//       case "sick": return "#f97316";
//       case "casual": return "#10b981";
//       case "unpaid": return "#ef4444";
//       default: return "#8b92b8";
//     }
//   };

//   const getStatusBadge = (status) => {
//     const styles = {
//       approved: { bg: "#d1fae5", color: "#065f46", text: "Approved" },
//       pending: { bg: "#fef3c7", color: "#92400e", text: "Pending" },
//       rejected: { bg: "#fee2e2", color: "#991b1b", text: "Rejected" },
//     };
//     const s = styles[status?.toLowerCase()] || styles.pending;
//     return <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 600 }}>{s.text}</span>;
//   };

//   const getEventsForDay = (date) => {
//     return leaveEvents.filter(event => {
//       const eventStart = new Date(event.startDate);
//       const eventEnd = new Date(event.endDate);
//       const target = new Date(date);
//       return target >= eventStart && target <= eventEnd;
//     });
//   };

//   const changeMonth = (delta) => {
//     setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
//   };

//   const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//   const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//   // Navigation component (only used at bottom now)
//   const NavigationButtons = () => (
//     <div className="d-flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
//       <div className="d-flex gap-2">
//         <button className="emp-page-btn" onClick={() => changeMonth(-1)}><FaChevronLeft /> Prev</button>
//         <button className="emp-page-btn" onClick={() => changeMonth(1)}>Next <FaChevronRight /></button>
//       </div>
//       <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: "20px", fontWeight: 600, margin: 0, color: "#1e2340" }}>
//         {monthNames[currentMonth]} {currentYear}
//       </h3>
//       <button className="emp-page-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
//     </div>
//   );

//   if (loading) return <LoadingSpinner message="Loading calendar..." />;

//   return (
//     <div className="container mt-3">
//       <div className="emp-root">
//         {/* Header */}
//         <div className="emp-header">
//           <div className="emp-header-left">
//             <div>
//               <h1 className="emp-title" style={{ fontSize: "24px" }}>Leave Calendar</h1>
//               <p className="emp-subtitle">View all employee leave requests at a glance</p>
//             </div>
//           </div>
//           <div className="d-flex gap-2">
//             <button className="emp-add-btn" onClick={() => setShowFilters(!showFilters)} style={{ background: "linear-gradient(135deg, #8b92b8, #a5b4fc)" }}>
//               <FaFilter size={12} /> Filters
//             </button>
//             <button className="emp-add-btn" onClick={fetchLeaveEvents}>
//               <FaCalendarAlt size={12} /> Refresh
//             </button>
//           </div>
//         </div>

//         {/* Filters Panel */}
//         {showFilters && (
//           <div className="emp-table-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
//             <div className="d-flex justify-content-between align-items-center mb-3">
//               <h6 style={{ margin: 0, color: "#6366f1", fontWeight: 600 }}>Filter Leave Events</h6>
//               <button className="emp-search-clear" onClick={() => setShowFilters(false)}><FaTimes /></button>
//             </div>
//             <div className="emp-form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))" }}>
//               <div className="emp-field">
//                 <label>Department</label>
//                 <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
//                   <option value="">All Departments</option>
//                   <option value="Engineering">Engineering</option>
//                   <option value="HR">HR</option>
//                   <option value="Sales">Sales</option>
//                   <option value="Marketing">Marketing</option>
//                 </select>
//               </div>
//               <div className="emp-field">
//                 <label>Status</label>
//                 <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
//                   <option value="all">All Status</option>
//                   <option value="approved">Approved</option>
//                   <option value="pending">Pending</option>
//                   <option value="rejected">Rejected</option>
//                 </select>
//               </div>
//               <div className="emp-field">
//                 <label>&nbsp;</label>
//                 <button className="emp-submit-btn" style={{ padding: "8px 16px", marginTop: "4px" }} onClick={fetchLeaveEvents}>Apply Filters</button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Calendar Grid (no top navigation) */}
//         <div className="emp-table-card" style={{ overflowX: "auto" }}>
//           <div style={{ minWidth: "700px" }}>
//             {/* Weekday headers */}
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e0e2ff", background: "#f5f6ff", borderRadius: "16px 16px 0 0" }}>
//               {weekDays.map(day => (
//                 <div key={day} style={{ padding: "12px", textAlign: "center", fontWeight: 700, fontSize: "12px", color: "#6366f1", textTransform: "uppercase" }}>
//                   {day}
//                 </div>
//               ))}
//             </div>
//             {/* Weeks */}
//             {weeks.map((week, wIdx) => (
//               <div key={wIdx} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: wIdx === weeks.length-1 ? "none" : "1px solid #f0f1f9" }}>
//                 {week.map((day, dIdx) => {
//                   const isCurrentMonth = day.getMonth() === currentMonth;
//                   const events = getEventsForDay(day);
//                   const filteredEvents = events.filter(ev => {
//                     if (filterDept && ev.department !== filterDept) return false;
//                     if (filterStatus !== "all" && ev.status !== filterStatus) return false;
//                     return true;
//                   });
//                   return (
//                     <div key={dIdx} style={{ padding: "8px", minHeight: "100px", background: isCurrentMonth ? "#fff" : "#fafaff", borderRight: dIdx === 6 ? "none" : "1px solid #f0f1f9" }}>
//                       <div style={{ fontWeight: 600, fontSize: "14px", color: isCurrentMonth ? "#1e2340" : "#c7d2fe", marginBottom: "6px" }}>
//                         {day.getDate()}
//                       </div>
//                       <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
//                         {filteredEvents.slice(0, 3).map(event => (
//                           <div key={event.id} style={{ background: `${getLeaveTypeColor(event.leaveType)}20`, borderLeft: `3px solid ${getLeaveTypeColor(event.leaveType)}`, borderRadius: "6px", padding: "4px 6px", fontSize: "10px", fontWeight: 500, color: "#4a5082" }}>
//                             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                               <span><strong>{event.employeeName}</strong> ({event.leaveType})</span>
//                               {getStatusBadge(event.status)}
//                             </div>
//                           </div>
//                         ))}
//                         {filteredEvents.length > 3 && (
//                           <div style={{ fontSize: "9px", color: "#8b92b8", textAlign: "center" }}>
//                             +{filteredEvents.length - 3} more
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Bottom Navigation (pagination) - only here */}
//         <div style={{ marginTop: "20px" }}>
//           <NavigationButtons />
//         </div>

//         {/* Legend */}
//         <div className="emp-table-card" style={{ marginTop: "20px", padding: "12px 20px", display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "12px", height: "12px", background: "#6366f1", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Annual</span></div>
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "12px", height: "12px", background: "#f97316", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Sick</span></div>
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Casual</span></div>
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "12px", height: "12px", background: "#d1fae5", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Approved</span></div>
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "12px", height: "12px", background: "#fef3c7", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Pending</span></div>
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "12px", height: "12px", background: "#fee2e2", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Rejected</span></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeaveCalendar;


import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { FaTimes, FaCalendarAlt, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";

// ===============================
// Mock API functions (replace with real endpoints)
// ===============================
const mockLeaveRequests = [
  {
    id: 1,
    employee: { id: 101, name: "Ritik Sharma" },
    leaveType: "Sick",
    startDate: "2026-04-10",
    endDate: "2026-04-10",
    status: "Approved",
    reason: "Fever",
  },
  {
    id: 2,
    employee: { id: 102, name: "Aman Verma" },
    leaveType: "Annual",
    startDate: "2026-04-12",
    endDate: "2026-04-14",
    status: "Approved",
    reason: "Vacation",
  },
  {
    id: 3,
    employee: { id: 103, name: "Rahul Mehta" },
    leaveType: "Casual",
    startDate: "2026-04-15",
    endDate: "2026-04-15",
    status: "Pending",
    reason: "Personal work",
  },
  {
    id: 4,
    employee: { id: 0, name: "Holiday" },
    leaveType: "Holiday",
    startDate: "2026-04-20",
    endDate: "2026-04-20",
    status: "Company",
    reason: "",
  },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchLeaveRequests = async (year, month) => {
  await delay(600);
  return mockLeaveRequests.filter((req) => {
    const start = new Date(req.startDate);
    return start.getFullYear() === year && start.getMonth() === month;
  });
};

const submitLeaveRequest = async (data) => {
  await delay(800);
  console.log("Submitting leave:", data);
  return { success: true, id: Date.now() };
};

const fetchLeaveBalances = async (employeeId) => {
  await delay(400);
  return { Sick: 12, Annual: 20, Casual: 8, Unpaid: 0 };
};

// ===============================
// Main Component
// ===============================
const LeaveCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({ Sick: 0, Annual: 0, Casual: 0, Unpaid: 0 });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [formData, setFormData] = useState({ leaveType: "Sick", reason: "" });

  // Get logged‑in user (replace with actual auth context)
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = currentUser.id || 101;
  const employeeName = currentUser.name || "Current User";

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setInitialLoading(true);
    try {
      const [requests, balances] = await Promise.all([
        fetchLeaveRequests(currentDate.getFullYear(), currentDate.getMonth()),
        fetchLeaveBalances(employeeId),
      ]);
      setLeaveBalances(balances);
      const calendarEvents = requests.map((req) => ({
        id: req.id,
        title: `${req.employee.name} - ${req.leaveType}`,
        start: req.startDate,
        end: req.endDate,
        color: getLeaveColor(req.leaveType),
        extendedProps: {
          type: req.leaveType,
          status: req.status,
          employee: req.employee.name,
          reason: req.reason,
        },
      }));
      setEvents(calendarEvents);
    } catch (error) {
      toast.error("Error", "Failed to load calendar data");
    } finally {
      setInitialLoading(false);
    }
  };

  const getLeaveColor = (type) => {
    switch (type?.toLowerCase()) {
      case "sick": return "var(--danger)";
      case "annual": return "var(--success)";
      case "casual": return "var(--warning)";
      case "unpaid": return "var(--text-muted)";
      default: return "var(--info)";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStartDate || !selectedEndDate) {
      toast.warning("Validation", "Please select start and end dates");
      return;
    }
    if (new Date(selectedEndDate) < new Date(selectedStartDate)) {
      toast.warning("Invalid dates", "End date cannot be before start date");
      return;
    }
    setLoading(true);
    try {
      await submitLeaveRequest({
        employeeId,
        leaveType: formData.leaveType,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        reason: formData.reason,
      });
      toast.success("Success", "Leave request submitted");
      await loadCalendarData();
      setShowModal(false);
      // Reset form
      setSelectedStartDate("");
      setSelectedEndDate("");
      setFormData({ leaveType: "Sick", reason: "" });
    } catch (error) {
      toast.error("Error", "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // FullCalendar custom styling using CSS variables (complements global.css)
  const calendarStyles = `
    .fc {
      font-family: 'DM Sans', sans-serif;
    }
    .fc-toolbar-title {
      font-family: 'Sora', sans-serif;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .fc-button-primary {
      background: linear-gradient(135deg, var(--accent-indigo), var(--accent-indigo-light)) !important;
      border: none !important;
      box-shadow: 0 2px 8px rgba(99,102,241,0.3);
      border-radius: 10px !important;
      font-weight: 500 !important;
      text-transform: capitalize;
      transition: all 0.2s;
    }
    .fc-button-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);
    }
    .fc-daygrid-day {
      transition: background 0.2s;
    }
    .fc-daygrid-day:hover {
      background: var(--bg-surface);
      cursor: pointer;
    }
    .fc-day-today {
      background: var(--accent-indigo-pale) !important;
    }
    .fc-daygrid-day-number {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .fc-day-other .fc-daygrid-day-number {
      color: var(--text-muted);
    }
    .fc-event {
      border-radius: 8px !important;
      border: none !important;
      padding: 2px 6px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      cursor: pointer;
      transition: transform 0.1s;
    }
    .fc-event:hover {
      transform: scale(1.02);
      filter: brightness(0.95);
    }
    .fc-col-header-cell {
      background: var(--bg-surface);
      padding: 8px 0;
    }
    .fc-col-header-cell-cushion {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-indigo);
      text-transform: uppercase;
    }
    .fc-scrollgrid {
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid var(--border-light);
    }
    @media (max-width: 768px) {
      .fc-toolbar {
        flex-direction: column;
        gap: 10px;
      }
    }
  `;

  if (initialLoading) return <LoadingSpinner message="Loading calendar..." />;

  return (
    <div className="container mt-3">
      <style>{calendarStyles}</style>
      <div className="emp-root">
        {/* Header */}
        <div className="emp-header">
          <div className="emp-header-left">
            <div>
              <h1 className="emp-title">Leave Calendar</h1>
              <p className="emp-subtitle">Manage and track employee leaves</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="emp-add-btn" onClick={() => setShowModal(true)}>
              <FaCalendarAlt size={12} /> Apply Leave
            </button>
          </div>
        </div>

        {/* Leave Balance Cards */}
        <div className="summary-grid">
          {Object.entries(leaveBalances).map(([type, balance]) => (
            <div key={type} className="stat-card" style={{ textAlign: "center" }}>
              <div className="stat-label">{type} Leave</div>
              <div className="stat-value" style={{ color: "var(--accent-indigo)" }}>{balance}</div>
              <div className="stat-trend">days left</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="emp-table-card" style={{ marginBottom: "20px", padding: "12px 20px", display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <div className="d-flex align-items-center gap-2"><span style={{ width: "12px", height: "12px", background: "var(--danger)", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Sick</span></div>
          <div className="d-flex align-items-center gap-2"><span style={{ width: "12px", height: "12px", background: "var(--success)", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Annual</span></div>
          <div className="d-flex align-items-center gap-2"><span style={{ width: "12px", height: "12px", background: "var(--warning)", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Casual</span></div>
          <div className="d-flex align-items-center gap-2"><span style={{ width: "12px", height: "12px", background: "var(--info)", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Holiday</span></div>
          <div className="d-flex align-items-center gap-2"><span style={{ width: "12px", height: "12px", background: "#d1fae5", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Approved</span></div>
          <div className="d-flex align-items-center gap-2"><span style={{ width: "12px", height: "12px", background: "#fef3c7", borderRadius: "2px" }}></span><span style={{ fontSize: "12px" }}>Pending</span></div>
        </div>

        {/* Calendar Card – no dateClick or eventClick handlers */}
        <div className="emp-table-card" style={{ padding: "16px" }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            height="70vh"
            headerToolbar={false}
            eventDisplay="block"
          />
        </div>

        {/* Pagination */}
        <div className="emp-pagination" style={{ marginTop: "20px" }}>
          <div className="emp-page-info">
            Showing {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <div className="emp-page-controls">
            <button className="emp-page-btn" onClick={() => changeMonth(-1)}>« Prev</button>
            <button className="emp-page-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
            <button className="emp-page-btn" onClick={() => changeMonth(1)}>Next »</button>
          </div>
        </div>
      </div>

      {/* Modal – only for adding leave, triggered by Apply Leave button */}
      {showModal && (
        <div className="emp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="emp-modal-icon" style={{ background: "var(--accent-indigo-pale)", color: "var(--accent-indigo)" }}>
              <FaCalendarAlt size={24} />
            </div>
            <h3 className="emp-modal-title">Apply for Leave</h3>
            <div className="emp-modal-body" style={{ textAlign: "left" }}>
              <p><strong>👤 Employee:</strong> {employeeName}</p>
              <form onSubmit={handleSubmit}>
                <div className="emp-field" style={{ marginBottom: "12px" }}>
                  <label>Leave Type *</label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    required
                  >
                    <option value="Sick">Sick Leave (Balance: {leaveBalances.Sick} days)</option>
                    <option value="Annual">Annual Leave (Balance: {leaveBalances.Annual} days)</option>
                    <option value="Casual">Casual Leave (Balance: {leaveBalances.Casual} days)</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>
                <div className="emp-field" style={{ marginBottom: "12px" }}>
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="emp-field" style={{ marginBottom: "12px" }}>
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    required
                  />
                </div>
                <div className="emp-field" style={{ marginBottom: "12px" }}>
                  <label>Reason (optional)</label>
                  <textarea
                    rows="3"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Brief reason..."
                  />
                </div>
                <div className="emp-modal-actions" style={{ marginTop: "20px" }}>
                  <button type="button" className="emp-modal-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="emp-modal-confirm" disabled={loading}>
                    {loading ? <FaSpinner className="fa-spin" /> : <FaCheckCircle />}
                    {loading ? " Submitting..." : " Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendar;