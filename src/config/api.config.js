
export const BASE_URL = "http://localhost:8080/hrms";
//export const BASE_URL = "http://103.133.215.182:8081/hrms";
//export const BASE_URL = "http://192.168.1.200:8081/hrms";

export const API_ENDPOINTS = {

  // ── Auth / Employee ──────────────────────────

  LOGIN: `${BASE_URL}/api/employees/login`,
  LOGOUT: `${BASE_URL}/api/employees/logout`,
  CREATE_FIRST: `${BASE_URL}/api/employees/create-first`,
  CREATE_EMPLOYEE: `${BASE_URL}/api/employees/create`,

  GET_PROFILE: (username) =>
    `${BASE_URL}/api/employees/profile/${username}`,

  CHANGE_PASSWORD:
    `${BASE_URL}/api/employees/change-password`,

  RESET_PASSWORD:
    `${BASE_URL}/api/employees/reset-password`,

  SEND_OTP: (username) =>
    `${BASE_URL}/api/employees/send-otp/${username}`,

  GET_CURRENT: `${BASE_URL}/api/employees/current`,

  EMPLOYEE_DROPDOWN:
    `${BASE_URL}/api/employees/dropdown`,

  GET_BRANCHES: `${BASE_URL}/branches/list`,
  GET_DEPARTMENT: `${BASE_URL}/departments/list`,
  GET_EMPLOYEES: `${BASE_URL}/api/employees`,

  GET_ACTIVE_DEPARTMENTS:
    `${BASE_URL}/departments/list?flag=1`,

  GET_ACTIVE_BRANCHES:
    `${BASE_URL}/branches/list?flag=1`,

  GET_ACTIVE_ROLES:
    `${BASE_URL}/roles/list?flag=1`,

  GET_ACTIVE_DESIGNATIONS:
    `${BASE_URL}/designations/list?flag=1`,

  // ── Attendance ──────────────────────────────

  CHECK_IN: `${BASE_URL}/api/attendance/check-in`,
  CHECK_OUT: `${BASE_URL}/api/attendance/check-out`,
  GET_MY_ATTENDANCE: `${BASE_URL}/api/attendance/my`,
  GET_SUMMARY: `${BASE_URL}/api/attendance/summary`,
  GET_DASHBOARD: `${BASE_URL}/api/attendance/dashboard`,

  // ── Policy ──────────────────────────────────

  GET_ACTIVE_POLICY:
    `${BASE_URL}/api/policies/attendance/active`,

  GET_ALL_POLICIES:
    `${BASE_URL}/api/policies/attendance`,

  CREATE_POLICY:
    `${BASE_URL}/api/policies/attendance`,

  UPDATE_POLICY: (id) =>
    `${BASE_URL}/api/policies/attendance/${id}`,

  DELETE_POLICY: (id) =>
    `${BASE_URL}/api/policies/attendance/${id}`,

  ACTIVATE_POLICY: (id) =>
    `${BASE_URL}/api/policies/attendance/activate/${id}`,

  // ── Shift Master & Policies ──────────────────

  GET_SHIFTS: `${BASE_URL}/api/shifts`,
  CREATE_SHIFT: `${BASE_URL}/api/shifts`,

  UPDATE_SHIFT: (id) =>
    `${BASE_URL}/api/shifts/${id}`,

  DELETE_SHIFT: (id) =>
    `${BASE_URL}/api/shifts/${id}`,

  GET_SHIFT_SETTINGS:
    `${BASE_URL}/api/shifts/settings`,

  UPDATE_SHIFT_SETTINGS:
    `${BASE_URL}/api/shifts/settings`,

  GET_MY_SHIFT:
    `${BASE_URL}/api/shifts/my-shift`,

  // ── Leave ───────────────────────────────────

  APPLY_LEAVE: `${BASE_URL}/api/leaves/apply`,
  GET_MY_LEAVES: `${BASE_URL}/api/leaves/my`,
  GET_TEAM_LEAVES: `${BASE_URL}/api/leaves/team`,
  APPROVE_LEAVE: `${BASE_URL}/api/leaves/approve`,
  REJECT_LEAVE: `${BASE_URL}/api/leaves/reject`,

  DELETE_LEAVE: (id) =>
    `${BASE_URL}/api/leaves/${id}`,

  LEAVE_TYPES: `${BASE_URL}/api/leave-type`,

  GET_LEAVE_BALANCE: (empId) =>
    `${BASE_URL}/api/leaves/balance/${empId}`,

  GET_ALL_LEAVES: `${BASE_URL}/api/leaves/all`,
  LEAVE_DASHBOARD: `${BASE_URL}/api/leaves/dashboard`,

  CREATE_LEAVE_POLICY:
    `${BASE_URL}/api/leave-policy`,

  UPDATE_LEAVE_POLICY: (id) =>
    `${BASE_URL}/api/leave-policy/${id}`,

  GET_ALL_LEAVE_POLICIES:
    `${BASE_URL}/api/leave-policy/policies`,

  CREATE_HOLIDAY: `${BASE_URL}/api/holidays`,
  GET_ALL_HOLIDAYS: `${BASE_URL}/api/holidays`,

  DELETE_HOLIDAY: (id) =>
    `${BASE_URL}/api/holidays/${id}`,

  UPLOAD_HOLIDAYS:
    `${BASE_URL}/api/holidays/upload`,

  // ── Additional Leave APIs ───────────────────

  LEAVE_CALENDAR: `${BASE_URL}/api/leaves/calendar`,

  CREATE_LEAVE_TYPE:
    `${BASE_URL}/api/leave-type`,

  UPDATE_LEAVE_TYPE: (id) =>
    `${BASE_URL}/api/leave-type/${id}`,

  UPDATE_LEAVE_TYPE_STATUS: (id, active) =>
    `${BASE_URL}/api/leave-type/${id}/status?active=${active}`,

  // ── Documents ───────────────────────────────

  UPLOAD_DOCUMENT:
    `${BASE_URL}/api/documents/upload`,

  GET_EMPLOYEE_DOCUMENTS: (employeeId) =>
    `${BASE_URL}/api/documents/employee/${employeeId}`,

  // ── Employee Designation ────────────────────

  EMPLOYEE_DESIGNATION:
    `${BASE_URL}/employee/designation`,

  // ═══════════════════════════════════════════
  // TASK MANAGEMENT
  // ═══════════════════════════════════════════

  GET_ALL_TASKS:
    `${BASE_URL}/api/tasks`,

  GET_MY_TASKS:
    `${BASE_URL}/api/tasks/my`,

  GET_TASK_BY_ID: (id) =>
    `${BASE_URL}/api/tasks/${id}`,

  CREATE_TASK:
    `${BASE_URL}/api/tasks`,

  UPDATE_TASK: (id) =>
    `${BASE_URL}/api/tasks/${id}`,

  CREATE_SUBTASK: (id) =>
    `${BASE_URL}/api/tasks/${id}/subtasks`,

  UPDATE_SUBTASK: (parentId, subtaskId) =>
    `${BASE_URL}/api/tasks/${parentId}/subtasks/${subtaskId}`,

  UPDATE_TASK_STATUS:
    `${BASE_URL}/api/tasks/status`,

  ADD_COMMENT: (id) =>
    `${BASE_URL}/api/tasks/${id}/comments`,

  SEND_CHANGE_REQ: (id) =>
    `${BASE_URL}/api/tasks/${id}/change-request`,

  APPROVE_CHANGE: (id) =>
    `${BASE_URL}/api/tasks/${id}/change-request/approve`,

  REJECT_CHANGE: (id) =>
    `${BASE_URL}/api/tasks/${id}/change-request/reject`,

  // ── Role Based Task Assignment ───────────────

  GET_TASK_ASSIGNEES:
    `${BASE_URL}/api/tasks/assignees`,

  GET_DEPARTMENT_ASSIGNEES: (departmentId) =>
    `${BASE_URL}/api/tasks/assignees?departmentId=${departmentId}`,

  // ── Daily Task Submissions ──────────────────

  SUBMIT_TASK_PROOF: (taskId) =>
    `${BASE_URL}/api/tasks/${taskId}/submissions`,

  SUBMIT_PROOF: (taskId) =>
    `${BASE_URL}/api/tasks/${taskId}/submissions`,

  GET_TASK_SUBMISSIONS: (taskId) =>
    `${BASE_URL}/api/tasks/${taskId}/submissions`,

  GET_SUBMISSIONS: (taskId) =>
    `${BASE_URL}/api/tasks/${taskId}/submissions`,

  REVIEW_TASK_SUBMISSION: (submissionId) =>
    `${BASE_URL}/api/tasks/submissions/${submissionId}/review`,

  REVIEW_SUBMISSION: (submissionId) =>
    `${BASE_URL}/api/tasks/submissions/${submissionId}/review`,

  DOWNLOAD_PROOF: (submissionId) =>
    `${BASE_URL}/api/tasks/submissions/${submissionId}/proof`,

  DOWNLOAD_TASK_PROOF: (submissionId) =>
    `${BASE_URL}/api/tasks/submissions/${submissionId}/proof`,

  // ── Employee Progress ───────────────────────

  GET_MY_PROGRESS:
    `${BASE_URL}/api/progress/me`,

  PROGRESS_ME:
    `${BASE_URL}/api/progress/me`,

  GET_TEAM_PROGRESS:
    `${BASE_URL}/api/progress/team`,

  PROGRESS_TEAM:
    `${BASE_URL}/api/progress/team`,

  GET_EMPLOYEE_PROGRESS: (employeeId) =>
    `${BASE_URL}/api/progress/employees/${employeeId}`,

  GET_EMPLOYEE_TASK_STATS: (employeeId) =>
    `${BASE_URL}/api/tasks/stats/${employeeId}`,

  // Existing legacy constant retained
  GET_EMPLOYEE_STATISTICS:
    `${BASE_URL}/api/tasks/stats`,

  // ── Performance ─────────────────────────────

  GET_PERFORMANCE:
    `${BASE_URL}/api/performance`,

  GET_PERF_STATS:
    `${BASE_URL}/api/performance/stats`,

  GET_TOP_PERFORMERS:
    `${BASE_URL}/api/performance/top`,

  CREATE_REVIEW:
    `${BASE_URL}/api/performance`,

  // ── Payroll ─────────────────────────────────

  GET_PAYROLL: `${BASE_URL}/api/payroll`,

  GET_PAYROLL_STATS:
    `${BASE_URL}/api/payroll/stats`,

  GET_PAYROLL_MONTHS:
    `${BASE_URL}/api/payroll/months`,

  GET_PAYROLL_BY_ID: (id) =>
    `${BASE_URL}/api/payroll/${id}`,

  GET_EMP_PAY_HISTORY: (empId) =>
    `${BASE_URL}/api/payroll/employee/${empId}`,

  GENERATE_PAYROLL:
    `${BASE_URL}/api/payroll/generate`,

  UPDATE_PAYROLL: (id) =>
    `${BASE_URL}/api/payroll/${id}`,

  APPROVE_PAYROLL:
    `${BASE_URL}/api/payroll/approve`,

  PROCESS_PAYROLL:
    `${BASE_URL}/api/payroll/process`,

  SAVE_SALARY_STRUCTURE:
    `${BASE_URL}/api/payroll/structure`,

  GET_ALL_STRUCTURES:
    `${BASE_URL}/api/payroll/structure/all`,

  // ── Reports ─────────────────────────────────

  REPORT_TYPES:
    `${BASE_URL}/api/reports/types`,

  REPORT_GENERATE:
    `${BASE_URL}/api/reports/generate`,

  REPORT_DOWNLOAD_EXCEL:
    `${BASE_URL}/api/reports/download/excel`,

  REPORT_DOWNLOAD_PDF:
    `${BASE_URL}/api/reports/download/pdf`,

  // ── Client Site Verification ────────────────

  CLIENT_VERIFICATION_APPLY:
    `${BASE_URL}/api/employee-verification/apply`,

  CLIENT_VERIFICATION_PENDING_COUNT:
    `${BASE_URL}/api/employee-verification/pending-count`,

  CLIENT_VERIFICATION_REVIEW: (id) =>
    `${BASE_URL}/api/employee-verification/review/${id}`,

  CLIENT_VERIFICATION_REQUESTS:
    `${BASE_URL}/api/employee-verification/requests`,

  CLIENT_VERIFICATION_MY:
    `${BASE_URL}/api/employee-verification/my`,

  CLIENT_VERIFICATION_ALL:
    `${BASE_URL}/api/employee-verification/all`,
};

// ═════════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═════════════════════════════════════════════

export const STORAGE_KEYS = {
  JWT_TOKEN: "jwtToken",
  EMPLOYEE_ID: "employeeId",
  USERNAME: "username",
  ROLE: "roleName",
  USER_DATA: "userData",
};

// ── JSON Authentication Headers ──────────────

export const getAuthHeaders = () => {
  const token = localStorage.getItem(
    STORAGE_KEYS.JWT_TOKEN
  );

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// ── Multipart Authentication Headers ─────────

export const getMultipartAuthHeaders = () => {
  const token = localStorage.getItem(
    STORAGE_KEYS.JWT_TOKEN
  );

  if (!token) {
    throw new Error("Authentication token not found");
  }

  return {
    Authorization: token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`,
  };
};

// ── Extract Array From API Response ──────────

export const extractArray = (response) => {
  if (!response) return [];

  if (Array.isArray(response)) return response;

  if (response.data && Array.isArray(response.data))
    return response.data;

  if (response.response && Array.isArray(response.response))
    return response.response;

  if (response.content && Array.isArray(response.content))
    return response.content;

  if (response.items && Array.isArray(response.items))
    return response.items;

  if (response.payload && Array.isArray(response.payload))
    return response.payload;

  const keys = [
    "data",
    "response",
    "content",
    "items",
    "payload"
  ];

  for (const key of keys) {
    const value = response[key];

    if (value && typeof value === "object") {
      const result = extractArray(value);

      if (result.length > 0) {
        return result;
      }
    }
  }

  return [];
};
