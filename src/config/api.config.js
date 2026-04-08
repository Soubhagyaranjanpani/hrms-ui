

export const BASE_URL = "http://localhost:8080/hrms";

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

  CHECK_IN: `${BASE_URL}/api/attendance/check-in`,
  CHECK_OUT: `${BASE_URL}/api/attendance/check-out`,
  GET_MY_ATTENDANCE: `${BASE_URL}/api/attendance/my`,
  GET_SUMMARY: `${BASE_URL}/api/attendance/summary`,
  GET_DASHBOARD: `${BASE_URL}/api/attendance/dashboard`,

  // Policy
  GET_ACTIVE_POLICY: `${BASE_URL}/api/policies/attendance/active`,
  CREATE_POLICY: `${BASE_URL}/api/policies/attendance`,
  ACTIVATE_POLICY: (id) => `${BASE_URL}/api/policies/attendance/activate/${id}`,


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