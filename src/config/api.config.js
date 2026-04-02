

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
};

// ── LocalStorage Keys ────────────────────────
export const STORAGE_KEYS = {
  JWT_TOKEN:   "jwtToken",
  EMPLOYEE_ID: "employeeId",
  USERNAME:    "username",
  ROLE:        "roleName",
  USER_DATA:   "userData",
};