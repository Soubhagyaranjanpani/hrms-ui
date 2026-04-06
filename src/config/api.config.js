

export const BASE_URL = "http://localhost:8080/hrms";

export const API_ENDPOINTS = {
  // ── Auth / Employee ──────────────────────────
  LOGIN:           `${BASE_URL}/api/employees/login`,
  LOGOUT:          `${BASE_URL}/api/employees/logout`,
  CREATE_FIRST:    `${BASE_URL}/api/employees/create-first`,
  CREATE_EMPLOYEE: `${BASE_URL}/api/employees/create`,
  GET_PROFILE:     (username) => `${BASE_URL}/api/employees/profile/${username}`,
  CHANGE_PASSWORD: `${BASE_URL}/api/employees/change-password`,
  RESET_PASSWORD:  `${BASE_URL}/api/employees/reset-password`,
  SEND_OTP:        (username) => `${BASE_URL}/api/employees/send-otp/${username}`,
  GET_CURRENT:     `${BASE_URL}/api/employees/current`,

    CHECK_IN: `${BASE_URL}/api/attendance/check-in`,
  CHECK_OUT: `${BASE_URL}/api/attendance/check-out`,
  GET_MY_ATTENDANCE: `${BASE_URL}/api/attendance/my`,
  GET_SUMMARY: `${BASE_URL}/api/attendance/summary`,
  GET_DASHBOARD: `${BASE_URL}/api/attendance/dashboard`,
  
  // Policy
   GET_ACTIVE_POLICY: `${BASE_URL}/api/policies/attendance/active`,
  CREATE_POLICY: `${BASE_URL}/api/policies/attendance`,
  ACTIVATE_POLICY: (id) => `${BASE_URL}/api/policies/attendance/activate/${id}`,


};

// ── LocalStorage Keys ────────────────────────
export const STORAGE_KEYS = {
  JWT_TOKEN:   "jwtToken",
  EMPLOYEE_ID: "employeeId",
  USERNAME:    "username",
  ROLE:        "roleName",
  USER_DATA:   "userData",
};