export const BASE_URL = "http://localhost:8080/hrms";

// export const BASE_URL = "http://103.133.215.182:8081/hrms";

export const API_ENDPOINTS = {
  // ── Auth / Employee ──────────────────────────
  LOGIN: `${BASE_URL}/api/employees/login`,
  LOGOUT: `${BASE_URL}/api/employees/logout`,
  CREATE_FIRST: `${BASE_URL}/api/employees/create-first`,
  CREATE_EMPLOYEE: `${BASE_URL}/api/employees/create`,
  GET_PROFILE: (username) => `${BASE_URL}/api/employees/profile/${username}`,
  CHANGE_PASSWORD: `${BASE_URL}/api/employees/change-password`,
  RESET_PASSWORD: `${BASE_URL}/api/employees/reset-password`,
  SEND_OTP: (username) => `${BASE_URL}/api/employees/send-otp/${username}`,
  GET_CURRENT: `${BASE_URL}/api/employees/current`,
  EMPLOYEE_DROPDOWN: `${BASE_URL}/api/employees/dropdown`,

  GET_BRANCHES: `${BASE_URL}/branches/list`,
  GET_DEPARTMENT: `${BASE_URL}/departments/list`,
  GET_EMPLOYEES: `${BASE_URL}/api/employees`,

  GET_ACTIVE_DEPARTMENTS: `${BASE_URL}/departments/list?flag=1`,
  GET_ACTIVE_BRANCHES: `${BASE_URL}/branches/list?flag=1`,
  GET_ACTIVE_ROLES: `${BASE_URL}/roles/list?flag=1`,
  GET_ACTIVE_DESIGNATIONS: `${BASE_URL}/designations/list?flag=1`,



  // ── Attendance ──────────────────────────────
  CHECK_IN: `${BASE_URL}/api/attendance/check-in`,
  CHECK_OUT: `${BASE_URL}/api/attendance/check-out`,
  GET_MY_ATTENDANCE: `${BASE_URL}/api/attendance/my`,
  GET_SUMMARY: `${BASE_URL}/api/attendance/summary`,
  GET_DASHBOARD: `${BASE_URL}/api/attendance/dashboard`,

  // ── Policy ──────────────────────────────────
  GET_ACTIVE_POLICY: `${BASE_URL}/api/policies/attendance/active`,
  CREATE_POLICY: `${BASE_URL}/api/policies/attendance`,
  ACTIVATE_POLICY: (id) => `${BASE_URL}/api/policies/attendance/activate/${id}`,

  // ── Leave ───────────────────────────────────
  APPLY_LEAVE: `${BASE_URL}/api/leaves/apply`,
  GET_MY_LEAVES: `${BASE_URL}/api/leaves/my`,
  GET_TEAM_LEAVES: `${BASE_URL}/api/leaves/team`,
  APPROVE_LEAVE: `${BASE_URL}/api/leaves/approve`,
  REJECT_LEAVE: `${BASE_URL}/api/leaves/reject`,
  DELETE_LEAVE: (id) => `${BASE_URL}/api/leaves/${id}`,
  LEAVE_TYPES: `${BASE_URL}/api/leave-type`,
  GET_LEAVE_BALANCE: (empId) => `${BASE_URL}/api/leaves/balance/${empId}`,
  GET_ALL_LEAVES: `${BASE_URL}/api/leaves/all`,
  LEAVE_DASHBOARD: `${BASE_URL}/api/leaves/dashboard`,
  CREATE_LEAVE_POLICY: `${BASE_URL}/api/leave-policy`,
  UPDATE_LEAVE_POLICY: (id) => `${BASE_URL}/api/leave-policy/${id}`,
  GET_ALL_LEAVE_POLICIES: `${BASE_URL}/api/leave-policy/policies`,
  CREATE_HOLIDAY: `${BASE_URL}/api/holidays`,
  GET_ALL_HOLIDAYS: `${BASE_URL}/api/holidays`,
  DELETE_HOLIDAY: (id) => `${BASE_URL}/api/holidays/${id}`,
  UPLOAD_HOLIDAYS: `${BASE_URL}/api/holidays/upload`,

  // ── Documents ───────────────────────────────
  UPLOAD_DOCUMENT: `${BASE_URL}/api/documents/upload`,
  GET_EMPLOYEE_DOCUMENTS: (employeeId) => `${BASE_URL}/api/documents/employee/${employeeId}`,



  // ── Tasks ───────────────────────────────────

  UPDATE_TASK: (id) => `${BASE_URL}/api/tasks/${id}`,                         
  UPDATE_SUBTASK: (parentId, subtaskId) =>
    `${BASE_URL}/api/tasks/${parentId}/subtasks/${subtaskId}`,    




  GET_ALL_TASKS: `${BASE_URL}/api/tasks`,
  GET_MY_TASKS: `${BASE_URL}/api/tasks/my`,
  GET_TASK_BY_ID: (id) => `${BASE_URL}/api/tasks/${id}`,
  CREATE_TASK: `${BASE_URL}/api/tasks`,
  UPDATE_TASK_STATUS: `${BASE_URL}/api/tasks/status`,
  ADD_COMMENT: (id) => `${BASE_URL}/api/tasks/${id}/comments`,
  CREATE_SUBTASK: (id) => `${BASE_URL}/api/tasks/${id}/subtasks`,
  SEND_CHANGE_REQ: (id) => `${BASE_URL}/api/tasks/${id}/change-request`,
  APPROVE_CHANGE: (id) => `${BASE_URL}/api/tasks/${id}/change-request/approve`,
  REJECT_CHANGE: (id) => `${BASE_URL}/api/tasks/${id}/change-request/reject`,

  // ── Performance ─────────────────────────────
  GET_PERFORMANCE: `${BASE_URL}/api/performance`,
  GET_PERF_STATS: `${BASE_URL}/api/performance/stats`,
  GET_TOP_PERFORMERS: `${BASE_URL}/api/performance/top`,
  CREATE_REVIEW: `${BASE_URL}/api/performance`,

  GET_EMPLOYEE_STATISTICS: `${BASE_URL}/api/tasks/stats`,



 // ── Payroll ─────────────────────────────────
  GET_PAYROLL:             `${BASE_URL}/api/payroll`,
  GET_PAYROLL_STATS:       `${BASE_URL}/api/payroll/stats`,
  GET_PAYROLL_MONTHS:      `${BASE_URL}/api/payroll/months`,
  GET_PAYROLL_BY_ID:       (id) =>    `${BASE_URL}/api/payroll/${id}`,
  GET_EMP_PAY_HISTORY:     (empId) => `${BASE_URL}/api/payroll/employee/${empId}`,
  GENERATE_PAYROLL:        `${BASE_URL}/api/payroll/generate`,
  UPDATE_PAYROLL:          (id) =>    `${BASE_URL}/api/payroll/${id}`,
  APPROVE_PAYROLL:         `${BASE_URL}/api/payroll/approve`,
  PROCESS_PAYROLL:         `${BASE_URL}/api/payroll/process`,
  SAVE_SALARY_STRUCTURE:   `${BASE_URL}/api/payroll/structure`,
  GET_ALL_STRUCTURES:      `${BASE_URL}/api/payroll/structure/all`,


};





// ── LocalStorage Keys ────────────────────────
export const STORAGE_KEYS = {
  JWT_TOKEN: "jwtToken",
  EMPLOYEE_ID: "employeeId",
  USERNAME: "username",
  ROLE: "roleName",
  USER_DATA: "userData",
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const extractArray = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  
  // Handle different response structures
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.response && Array.isArray(response.response)) return response.response;
  if (response.content && Array.isArray(response.content)) return response.content;
  if (response.items && Array.isArray(response.items)) return response.items;
  if (response.payload && Array.isArray(response.payload)) return response.payload;
  
  return [];
};