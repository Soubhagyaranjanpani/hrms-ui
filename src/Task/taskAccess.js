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

export const TASK_UPDATED_EVENT = 'hrms_task_updated';

export const notifyTaskDataChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TASK_UPDATED_EVENT));
  }
};

export const safeReadJson = async (res) => {
  if (!res) return {};
  try {
    const text = await res.text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
};

export const parseApiError = (res, data, fallback = 'Request failed') => {
  if (res?.status === 401) {
    return 'Session expired or unauthorized (401). Please sign in again.';
  }
  if (res?.status === 403) {
    return 'Access denied (403): You are not authorized to perform this action.';
  }
  return data?.message || data?.error || `${fallback}${res?.status ? ` (HTTP ${res.status})` : ''}`;
};

export const toLocalDateStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}-\d{2}T00:00:00/.test(trimmed)) return trimmed.slice(0, 10);
  }
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getNextBusinessDateStr = (fromDate = new Date()) => {
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return toLocalDateStr(d);
};

export const formatBusinessDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

export const isTaskOverdue = (task) => {
  if (!task?.dueDate || task.status === 'COMPLETED' || task.status === 'REJECTED') return false;
  const due = toLocalDateStr(task.dueDate);
  const today = toLocalDateStr(new Date());
  if (!due || !today) return false;
  return due < today;
};

export const getSubmissionLocalDate = (sub) => {
  if (!sub) return '';
  if (sub.submissionDate) return toLocalDateStr(sub.submissionDate);
  if (sub.submittedAt) return toLocalDateStr(sub.submittedAt);
  if (sub.createdAt) return toLocalDateStr(sub.createdAt);
  return '';
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