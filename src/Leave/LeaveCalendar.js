
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { FaTimes, FaCalendarAlt, FaCheckCircle, FaSpinner } from "react-icons/fa";
import axios from "axios";
import { API_ENDPOINTS, STORAGE_KEYS } from "../config/api.config";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";

const records = (body) => {
  if (Number(body?.status) >= 400) throw new Error(body.message || 'Request failed');
  const data = body?.response ?? body?.data ?? body;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  throw new Error('Unexpected API response');
};
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}` });
const dateOnly = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fetchLeaveRequests = async (year, month) => {
  const { data } = await axios.get(API_ENDPOINTS.LEAVE_CALENDAR || API_ENDPOINTS.APPLY_LEAVE.replace(/apply$/, 'calendar'), {
    headers: auth(), params: { startDate: dateOnly(new Date(year,month,1)), endDate: dateOnly(new Date(year,month+1,0)) }
  });
  return records(data);
};
const submitLeaveRequest = async data => {
  const { data: result } = await axios.post(API_ENDPOINTS.APPLY_LEAVE, {
    leaveTypeId: Number(data.leaveType), startDate: data.startDate, endDate: data.endDate,
    isHalfDay: false, halfDaySession: null, reason: data.reason.trim()
  }, { headers: auth() });
  if (Number(result?.status) >= 400) throw new Error(result.message || 'Application failed');
};
const LeaveCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const leaveBalances = Object.fromEntries(leaveTypes.map(t => [t.name, "—"]));
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [formData, setFormData] = useState({ leaveType: "", reason: "" });

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || localStorage.getItem("user") || "{}");
  } catch {}
  const employeeId = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID) || currentUser.id || currentUser.employeeId;
  const employeeName = currentUser.name || currentUser.fullName || localStorage.getItem(STORAGE_KEYS.USERNAME) || "Current User";

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setInitialLoading(true);
    try {
      const [requests, types] = await Promise.all([
        fetchLeaveRequests(currentDate.getFullYear(), currentDate.getMonth()),
        axios.get(API_ENDPOINTS.LEAVE_TYPES, { headers: auth(), params: { flag: 0 } }).then(r => records(r.data)),
      ]);
      setLeaveTypes(types.filter(t => t.isActive === true && t.maxDaysPerYear != null));
      const calendarEvents = requests.map((req) => ({
        id: req.id,
        title: `${(req.employeeName || req.employee?.name || "Employee")} - ${(req.leaveType?.name || req.leaveTypeName || req.leaveType || "Leave")}`,
        start: req.startDate,
        end: dateOnly(new Date(Number(req.endDate.slice(0,4)), Number(req.endDate.slice(5,7))-1, Number(req.endDate.slice(8,10))+1)),
        color: getLeaveColor((req.leaveType?.name || req.leaveTypeName || req.leaveType || "Leave")),
        extendedProps: {
          type: (req.leaveType?.name || req.leaveTypeName || req.leaveType || "Leave"),
          status: req.status,
          employee: (req.employeeName || req.employee?.name || "Employee"),
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
      setFormData({ leaveType: "", reason: "" });
    } catch (error) {
      toast.error("Error", "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
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
              <div className="stat-trend">Balance unavailable</div>
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
            key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
            initialDate={currentDate}
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
                    <option value="">Select leave type</option>
                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
