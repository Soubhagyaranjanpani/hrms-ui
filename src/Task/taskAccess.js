import { STORAGE_KEYS } from '../config/api.config';

const readUserData = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {};
  } catch {
    return {};
  }
};

export const normalizeRole = (raw) => {
  if (!raw) return null;

  let s =
    typeof raw === 'object'
      ? raw.name || raw.roleName || raw.role || ''
      : String(raw);

  if (typeof s !== 'string') return null;
  s = s.trim().toUpperCase();

  if (s.startsWith('ROLE_')) {
    s = s.substring(5);
  }

  const up = s.replace(/[\s_-]+/g, '');

  if (up === 'ADMIN' || up === 'ADMINISTRATOR' || up === 'SUPERADMIN') {
    return 'Admin';
  }
  if (
    up === 'HR' ||
    up === 'HUMANRESOURCE' ||
    up === 'HUMANRESOURCES' ||
    up === 'HROFFICER' ||
    up === 'HRMANAGER'
  ) {
    return 'Hr';
  }
  if (up === 'MANAGER') {
    return 'Manager';
  }
  if (up === 'EMPLOYEE') {
    return 'Employee';
  }

  return null;
};

export const getNormalizedRole = (currentUser) => {
  try {
    const uData = readUserData();

    const roles = [
      currentUser?.roleName,
      currentUser?.role,
      currentUser?.role?.name,
      localStorage.getItem(STORAGE_KEYS.ROLE),
      localStorage.getItem('roleName'),
      localStorage.getItem('role'),
      localStorage.getItem('userRole'),
      uData?.roleName,
      uData?.role,
      uData?.role?.name,
    ];

    for (const raw of roles) {
      const role = normalizeRole(raw);
      if (role) return role;
    }

    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (token && token.includes('.')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tokenRole =
          payload.role ||
          payload.roles ||
          payload.roleName ||
          payload.authorities ||
          payload.auth;

        if (Array.isArray(tokenRole)) {
          const found = tokenRole.find(Boolean);
          if (found) {
            const parsed = normalizeRole(
              typeof found === 'string' ? found : found.authority || found.role
            );
            if (parsed) return parsed;
          }
        } else if (tokenRole) {
          const parsed = normalizeRole(tokenRole);
          if (parsed) return parsed;
        }
      } catch {
        // ignore malformed token payload
      }
    }
  } catch (error) {
    console.error('Role detection error:', error);
  }

  return 'Employee';
};

export const getMyId = (currentUser) => {
  const u = readUserData();
  return (
    currentUser?.employeeId ||
    localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID) ||
    u.employeeId ||
    currentUser?.id ||
    u.id ||
    ''
  );
};

export const cleanPersonName = (name) => {
  if (!name) return '';
  if (typeof name === 'object') {
    const raw =
      name.name || `${name.firstName || ''} ${name.lastName || ''}`;
    return raw.replace(/\s+null\s*/gi, '').trim();
  }
  return String(name).replace(/\s+null\s*/gi, '').trim();
};

export const unwrapResponse = (data) => {
  if (!data) return null;
  return data.response ?? data.data ?? data;
};

export const calculateEffortFromDates = (dueDateStr, startDateStr = '') => {
  if (!dueDateStr) return '';

  const end = new Date(`${dueDateStr}T00:00:00`);
  if (isNaN(end)) return '';

  let start;
  if (startDateStr) {
    start = new Date(`${startDateStr}T00:00:00`);
  } else {
    start = new Date();
    start.setHours(0, 0, 0, 0);
  }

  if (isNaN(start)) return '';

  const diffDays = Math.round((end - start) / 86400000);
  if (diffDays < 0) return '';

  const totalDays = startDateStr ? diffDays + 1 : Math.max(1, diffDays);
  return totalDays === 1 ? '1 day' : `${totalDays} days`;
};