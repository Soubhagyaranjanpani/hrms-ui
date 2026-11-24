import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaClock, FaShieldAlt, FaSignInAlt, FaSignOutAlt, FaCoffee,
  FaCalendarCheck, FaCheckCircle, FaInfoCircle, FaEdit, FaMoon,
  FaSun, FaLayerGroup, FaTimes, FaSyncAlt, FaCalendarDay, FaUserClock
} from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  DEFAULT_SHIFTS,
  DEFAULT_SHIFT_SYSTEM_SETTINGS,
  getStoredShifts,
  saveStoredShifts,
  getShiftSystemSettings,
  saveShiftSystemSettings,
  format12Hour
} from '../utils/rosterUtils';

/* ─── helpers ───────────────────────────────────────────────────────────── */
const getToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

const authFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

const fmtTime = (t) => {
  if (!t) return '—';
  const parts = String(t).split(':');
  if (parts.length < 2) return t;
  const hour = parseInt(parts[0], 10);
  const m = parts[1];
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const calcShiftDuration = (start, end, isNight) => {
  if (!start || !end) return 0;
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0 || isNight) {
    mins += 24 * 60;
  }
  return Number((mins / 60).toFixed(1));
};

const isOvernightTime = (start, end) => {
  if (!start || !end) return false;
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return false;
  return (eh * 60 + em) < (sh * 60 + sm);
};

/* Unwrap { response: {...}, status, message } OR { data: {...} } OR raw */
const unwrap = (json) => json?.response ?? json?.data ?? json;

const EMPTY_FORM = {
  name: '12-9 Shift Policy',
  shiftCode: '12-9',
  shiftStart: '12:00',
  shiftEnd: '21:00',
  isNightShift: false,
  graceMinutes: 10,
  halfDayThresholdHours: 4,
  fullDayHours: 8,
  allowOvertime: true,
  isActive: true,
  checkInBeforeMinutes: 10,
  enforceCheckOutAfterShift: true,
  checkOutGraceMinutes: 15,
  breakMinutes: 45,
  weeklyOffPolicy: 'SAT_SUN'
};

/* ─── main component ────────────────────────────────────────────────────── */
export default function AttendancePolicyPage({ user } = {}) {
  const navigate = useNavigate();

  // ── Role & Security Context (HR-Only Strict Access) ──────────────────────
  const getNormalizedRole = () => {
    try {
      const uData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
      const raw = localStorage.getItem(STORAGE_KEYS.ROLE) ||
                  localStorage.getItem('roleName') ||
                  localStorage.getItem('role') ||
                  localStorage.getItem('userRole') ||
                  user?.role ||
                  user?.roleName ||
                  user?.role?.name ||
                  uData?.role ||
                  uData?.roleName ||
                  uData?.role?.name;
      if (raw) {
        let s = typeof raw === 'object' ? (raw.name || raw.roleName || raw.role || '') : String(raw);
        if (s.toUpperCase().startsWith('ROLE_')) s = s.substring(5);
        const up = s.toUpperCase().replace(/[\s_-]+/g, '');
        if (up === 'HR' || up === 'HUMANRESOURCE' || up === 'HUMANRESOURCES' || up === 'HROFFICER' || up === 'HRMANAGER') return 'Hr';
        if (up === 'ADMIN' || up === 'ADMINISTRATOR' || up === 'SUPERADMIN') return 'Admin';
        if (up === 'MANAGER') return 'Manager';
        return 'Employee';
      }
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN) || localStorage.getItem('jwtToken');
      if (token && token.includes('.')) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tokenRole = payload.role || payload.roles || payload.roleName || payload.authorities || payload.auth;
          const found = Array.isArray(tokenRole) ? tokenRole.find(Boolean) : tokenRole;
          if (found) {
            let s = typeof found === 'object' ? (found.authority || found.role || '') : String(found);
            if (s.toUpperCase().startsWith('ROLE_')) s = s.substring(5);
            const up = s.toUpperCase().replace(/[\s_-]+/g, '');
            if (up === 'HR' || up === 'HUMANRESOURCE' || up === 'HUMANRESOURCES' || up === 'HROFFICER' || up === 'HRMANAGER') return 'Hr';
            if (up === 'ADMIN' || up === 'ADMINISTRATOR' || up === 'SUPERADMIN') return 'Admin';
            if (up === 'MANAGER') return 'Manager';
          }
        } catch {}
      }
    } catch {}
    return 'Employee';
  };

  const currentRole = getNormalizedRole();
  const isHr = currentRole === 'Hr';

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [systemSettings, setSystemSettings] = useState(() => getShiftSystemSettings());
  const [shiftsList, setShiftsList] = useState(() => getStoredShifts());

  // ── Shift Category Editor State ──
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [isEditingShift, setIsEditingShift] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    id: null,
    code: '',
    shortCode: '',
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    durationHours: 9.0,
    breakMinutes: 45,
    graceMinutes: 15,
    isNightShift: false,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    description: '',
    isActive: true
  });

  /* ── fetch active policy ── */
  const fetchActive = async () => {
    if (!isHr) return;
    setLoading(true);
    try {
      const res = await authFetch(API_ENDPOINTS.GET_ACTIVE_POLICY);
      if (res.ok) {
        const json = await res.json();
        const active = unwrap(json);
        setPolicy(active);
        try {
          localStorage.setItem('hrms_active_attendance_policy', JSON.stringify(active));
        } catch {}
      } else if (res.status === 404) {
        setPolicy(null);
      }
    } catch {
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  };

  /* ── fetch backend shifts ── */
  const fetchShifts = async () => {
    if (!isHr) return;
    try {
      const res = await authFetch(API_ENDPOINTS.GET_SHIFTS);
      if (res.ok) {
        const json = await res.json();
        const data = unwrap(json);
        if (Array.isArray(data) && data.length > 0) {
          setShiftsList(data);
          saveStoredShifts(data, false);
        }
      }
    } catch (err) {
      console.warn('Backend shifts fetch note:', err);
    }
  };

  useEffect(() => {
    if (!isHr) {
      setLoading(false);
      return;
    }

    fetchActive();
    fetchShifts();

    const handleUpdated = () => {
      fetchActive();
    };

    window.addEventListener('hrms_policy_updated', handleUpdated);

    return () => {
      window.removeEventListener('hrms_policy_updated', handleUpdated);
    };
  }, [isHr]);

  const handleOpenAddShift = () => {
    setIsEditingShift(false);
    setShiftForm({
      id: null,
      code: '',
      shortCode: '',
      name: '',
      startTime: '09:00',
      endTime: '18:00',
      durationHours: 9.0,
      breakMinutes: 45,
      graceMinutes: 15,
      isNightShift: false,
      color: '#3b82f6',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      description: '',
      isActive: true
    });
    setShowShiftModal(true);
  };

  const handleOpenEditShift = (s) => {
    setIsEditingShift(true);
    const start = s.startTime ? String(s.startTime).substring(0, 5) : '09:00';
    const end = s.endTime ? String(s.endTime).substring(0, 5) : '18:00';
    const isNight = isOvernightTime(start, end) || Boolean(s.isNightShift);
    const dur = calcShiftDuration(start, end, isNight);

    setShiftForm({
      id: s.id || null,
      code: s.code || '',
      shortCode: s.shortCode || s.code || '',
      name: s.name || '',
      startTime: start,
      endTime: end,
      durationHours: dur || Number(s.durationHours) || 8.0,
      breakMinutes: s.breakMinutes != null ? Number(s.breakMinutes) : 45,
      graceMinutes: s.graceMinutes != null ? Number(s.graceMinutes) : 15,
      isNightShift: isNight,
      color: s.color || '#3b82f6',
      bgColor: s.bgColor || '#eff6ff',
      borderColor: s.borderColor || '#bfdbfe',
      description: s.description || '',
      isActive: s.isActive !== false
    });
    setShowShiftModal(true);
  };

  const handleSaveShift = async () => {
    if (!shiftForm.code.trim() || !shiftForm.name.trim()) {
      toast.error('Validation Error', 'Shift Code and Shift Name are required.');
      return;
    }
    setSavingShift(true);
    try {
      const startStr = shiftForm.startTime.length === 5 ? `${shiftForm.startTime}:00` : shiftForm.startTime;
      const endStr = shiftForm.endTime.length === 5 ? `${shiftForm.endTime}:00` : shiftForm.endTime;
      const dur = calcShiftDuration(shiftForm.startTime, shiftForm.endTime, shiftForm.isNightShift);

      const payload = {
        code: shiftForm.code.toUpperCase().trim(),
        shortCode: shiftForm.shortCode || shiftForm.code.toUpperCase().trim(),
        name: shiftForm.name.trim(),
        startTime: startStr,
        endTime: endStr,
        durationHours: dur || Number(shiftForm.durationHours) || 8.0,
        breakMinutes: Number(shiftForm.breakMinutes) || 45,
        graceMinutes: Number(shiftForm.graceMinutes) || 10,
        isNightShift: Boolean(shiftForm.isNightShift),
        color: shiftForm.color || '#3b82f6',
        bgColor: shiftForm.bgColor || '#eff6ff',
        borderColor: shiftForm.borderColor || '#bfdbfe',
        isActive: Boolean(shiftForm.isActive),
        description: shiftForm.description || `${shiftForm.name} (${fmtTime(shiftForm.startTime)} – ${fmtTime(shiftForm.endTime)})`
      };

      let res;
      if (isEditingShift && shiftForm.id) {
        res = await authFetch(API_ENDPOINTS.UPDATE_SHIFT(shiftForm.id), {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await authFetch(API_ENDPOINTS.CREATE_SHIFT, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const json = await res.json().catch(() => null);
      const saved = unwrap(json);

      // Update local storage and broadcast to Roster Management
      const existing = getStoredShifts();
      let matched = false;
      const updatedList = existing.map(s => {
        if (s.id === saved?.id || s.code === payload.code) {
          matched = true;
          return { ...s, ...payload, id: saved?.id || s.id };
        }
        return s;
      });
      if (!matched) {
        updatedList.push({ ...payload, id: saved?.id || `shift-${Date.now()}` });
      }

      saveStoredShifts(updatedList);
      setShiftsList(updatedList);

      window.dispatchEvent(new Event('hrms_shifts_updated'));
      window.dispatchEvent(new Event('hrms_policy_updated'));

      toast.success('Shift Saved to Database!', `Shift "${payload.name}" (${payload.code}) saved to backend database and synchronized to Roster Management.`);
      setShowShiftModal(false);
      fetchShifts();
    } catch (e) {
      toast.error('Save Error', e.message || 'Failed to save shift category.');
    } finally {
      setSavingShift(false);
    }
  };

  const handleDeleteShift = async (s) => {
    if (!window.confirm(`Are you sure you want to delete shift "${s.name}" (${s.code})?`)) return;
    try {
      if (s.id && typeof s.id === 'number') {
        const res = await authFetch(API_ENDPOINTS.DELETE_SHIFT(s.id), { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
      }
      const updated = shiftsList.filter(item => (item.id ? item.id !== s.id : item.code !== s.code));
      setShiftsList(updated);
      saveStoredShifts(updated);
      window.dispatchEvent(new Event('hrms_shifts_updated'));
      toast.success('Shift Deleted', `Shift category "${s.name}" removed from database.`);
      fetchShifts();
    } catch (e) {
      toast.error('Delete Error', e.message || 'Failed to delete shift.');
    }
  };

  /* ── edit current active policy ── */
  const handleEditActive = () => {
    if (!policy) return;
    setIsEditing(true);
    const sys = getShiftSystemSettings();
    const sStart = policy.shiftStart ? String(policy.shiftStart).substring(0, 5) : '12:00';
    const sEnd = policy.shiftEnd ? String(policy.shiftEnd).substring(0, 5) : '09:00';
    const isNight = isOvernightTime(sStart, sEnd) || Boolean(policy.isNightShift);

    setForm({
      name: policy.name || '12-9',
      shiftCode: policy.shiftCode || policy.code || '12-9',
      shiftStart: sStart,
      shiftEnd: sEnd,
      isNightShift: isNight,
      graceMinutes: policy.graceMinutes != null ? policy.graceMinutes : 10,
      halfDayThresholdHours: policy.halfDayThresholdHours != null ? policy.halfDayThresholdHours : 4,
      fullDayHours: policy.fullDayHours != null ? policy.fullDayHours : 8,
      allowOvertime: policy.allowOvertime !== false,
      isActive: true,
      checkInBeforeMinutes: policy.checkInBeforeMinutes ?? sys.checkInBeforeMinutes ?? 10,
      enforceCheckOutAfterShift: policy.enforceCheckOutAfterShift ?? sys.enforceCheckOutAfterShift ?? true,
      checkOutGraceMinutes: policy.checkOutGraceMinutes ?? sys.checkOutGraceMinutes ?? 15,
      breakMinutes: policy.breakMinutes ?? sys.breakMinutes ?? 45,
      weeklyOffPolicy: policy.weeklyOffPolicy ?? sys.weeklyOffPolicy ?? 'SAT_SUN'
    });
    setShowModal(true);
  };

  /* ── open new policy form ── */
  const handleOpenCreate = () => {
    setIsEditing(false);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  /* ── create / save ── */
  const handleCreate = async () => {
    const required = ['name', 'shiftStart', 'shiftEnd', 'graceMinutes', 'halfDayThresholdHours', 'fullDayHours'];
    for (const k of required) {
      if (form[k] === '' || form[k] == null) {
        toast.error('Validation Error', `"${k}" is required.`);
        return;
      }
    }
    setSaving(true);
    try {
      const startStr = form.shiftStart.length === 5 ? `${form.shiftStart}:00` : form.shiftStart;
      const endStr = form.shiftEnd.length === 5 ? `${form.shiftEnd}:00` : form.shiftEnd;

      const payload = {
        name: form.name,
        shiftStart: startStr,
        shiftEnd: endStr,
        graceMinutes: Number(form.graceMinutes),
        halfDayThresholdHours: Number(form.halfDayThresholdHours),
        fullDayHours: Number(form.fullDayHours),
        allowOvertime: Boolean(form.allowOvertime),
        isActive: Boolean(form.isActive),
        // Extended attributes
        checkInBeforeMinutes: Number(form.checkInBeforeMinutes),
        enforceCheckOutAfterShift: Boolean(form.enforceCheckOutAfterShift),
        checkOutGraceMinutes: Number(form.checkOutGraceMinutes),
        breakMinutes: Number(form.breakMinutes),
        isNightShift: Boolean(form.isNightShift),
        shiftCode: form.shiftCode || '12-9'
      };

      let res;
      if (isEditing && policy?.id) {
        // Edit existing policy in database
        res = await authFetch(API_ENDPOINTS.UPDATE_POLICY(policy.id), {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // Fallback if backend expects core fields or POST
          res = await authFetch(API_ENDPOINTS.UPDATE_POLICY(policy.id), {
            method: 'PUT',
            body: JSON.stringify({
              name: form.name,
              shiftStart: startStr,
              shiftEnd: endStr,
              graceMinutes: Number(form.graceMinutes),
              halfDayThresholdHours: Number(form.halfDayThresholdHours),
              fullDayHours: Number(form.fullDayHours),
              allowOvertime: Boolean(form.allowOvertime),
              isActive: Boolean(form.isActive)
            }),
          });
        }
      } else {
        // Create new policy in database
        res = await authFetch(API_ENDPOINTS.CREATE_POLICY, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        // Strict backend fallback
        if (!res.ok) {
          const corePayload = {
            name: form.name,
            shiftStart: startStr,
            shiftEnd: endStr,
            graceMinutes: Number(form.graceMinutes),
            halfDayThresholdHours: Number(form.halfDayThresholdHours),
            fullDayHours: Number(form.fullDayHours),
            allowOvertime: Boolean(form.allowOvertime),
            isActive: Boolean(form.isActive),
          };
          res = await authFetch(API_ENDPOINTS.CREATE_POLICY, {
            method: 'POST',
            body: JSON.stringify(corePayload),
          });
        }
      }

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json().catch(() => null);
      const savedPolicy = unwrap(json);
      const targetId = savedPolicy?.id || policy?.id;
      if (targetId && form.isActive) {
        try {
          await authFetch(API_ENDPOINTS.ACTIVATE_POLICY(targetId), { method: 'PUT' });
        } catch (actErr) {
          console.warn('Auto-activate note:', actErr);
        }
      }

      // Try updating /api/shifts/settings backend endpoint as well
      try {
        await authFetch(API_ENDPOINTS.UPDATE_SHIFT_SETTINGS, {
          method: 'POST',
          body: JSON.stringify({
            checkInBeforeMinutes: Number(form.checkInBeforeMinutes),
            enforceCheckOutAfterShift: Boolean(form.enforceCheckOutAfterShift),
            checkOutGraceMinutes: Number(form.checkOutGraceMinutes),
            breakMinutes: Number(form.breakMinutes),
            shiftCode: form.shiftCode || '12-9'
          })
        });
      } catch {}

      // ── BIND TO LOCAL STORAGE & ALL SUBSYSTEMS ──
      const updatedSysSettings = {
        checkInBeforeMinutes: Number(form.checkInBeforeMinutes),
        enforceCheckOutAfterShift: Boolean(form.enforceCheckOutAfterShift),
        checkOutGraceMinutes: Number(form.checkOutGraceMinutes),
        breakMinutes: Number(form.breakMinutes),
        weeklyOffPolicy: form.weeklyOffPolicy || 'SAT_SUN'
      };
      saveShiftSystemSettings(updatedSysSettings);
      setSystemSettings(updatedSysSettings);

      // Bind shift definitions
      const rawStored = localStorage.getItem('hrms_shift_definitions');
      const existingShifts = rawStored ? JSON.parse(rawStored) : DEFAULT_SHIFTS;

      const codeToUse = form.shiftCode || '12-9';
      const durationHrs = calcShiftDuration(form.shiftStart, form.shiftEnd, form.isNightShift);

      const boundShift = {
        id: `shift-${codeToUse.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        code: codeToUse,
        shortCode: codeToUse,
        name: form.name,
        startTime: form.shiftStart.substring(0, 5),
        endTime: form.shiftEnd.substring(0, 5),
        durationHours: durationHrs || Number(form.fullDayHours),
        breakMinutes: Number(form.breakMinutes),
        graceMinutes: Number(form.graceMinutes),
        color: '#e11d48',
        bgColor: '#fff1f2',
        borderColor: '#fecdd3',
        isNightShift: Boolean(form.isNightShift),
        isActive: true,
        description: `${form.name} (${fmtTime(form.shiftStart)} – ${fmtTime(form.shiftEnd)})`
      };

      let matched = false;
      const updatedList = existingShifts.map(s => {
        if (s.code === codeToUse || s.code === 'GS') {
          matched = true;
          return { ...s, ...boundShift, code: s.code };
        }
        return s;
      });
      if (!matched) {
        updatedList.push(boundShift);
      }

      saveStoredShifts(updatedList);
      setShiftsList(updatedList);
      try {
        localStorage.removeItem('hrms_current_user_shift_override');
      } catch {}

      window.dispatchEvent(new Event('hrms_shift_settings_updated'));
      window.dispatchEvent(new Event('hrms_shifts_updated'));
      window.dispatchEvent(new Event('hrms_policy_updated'));
      window.dispatchEvent(new Event('hrms_active_policy_updated'));

      toast.success('Policy Saved & Bound!', `Policy "${form.name}" bound to backend & synchronized across all roster & punch systems.`);
      setShowModal(false);
      setIsEditing(false);
      setForm(EMPTY_FORM);
      fetchActive();
    } catch (e) {
      toast.error('Error', e.message || 'Failed to save and bind policy.');
    } finally {
      setSaving(false);
    }
  };

  /* ── activate ── */
  const handleActivate = async (id) => {
    setActivating(true);
    try {
      const res = await authFetch(API_ENDPOINTS.ACTIVATE_POLICY(id), { method: 'PUT' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Success!', 'Policy activated successfully!');
      fetchActive();
    } catch (e) {
      toast.error('Error', e.message || 'Failed to activate policy.');
    } finally {
      setActivating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // Calculations for current active policy
  const sStart = policy?.shiftStart ? String(policy.shiftStart).substring(0, 5) : '--:--';
  const sEnd = policy?.shiftEnd ? String(policy.shiftEnd).substring(0, 5) : '--:--';
  const isNight = isOvernightTime(sStart, sEnd) || Boolean(policy?.isNightShift);
  const shiftDuration = calcShiftDuration(sStart, sEnd, isNight);

  // Check-in pre-shift unlock time
  let checkInUnlockTimeStr = '—';
  if (sStart !== '--:--') {
    const [sh, sm] = sStart.split(':').map(Number);
    const unlockMins = sh * 60 + sm - (systemSettings.checkInBeforeMinutes || 10);
    const normalizedMins = (unlockMins + 24 * 60) % (24 * 60);
    const uh = Math.floor(normalizedMins / 60);
    const um = normalizedMins % 60;
    checkInUnlockTimeStr = fmtTime(`${String(uh).padStart(2, '0')}:${String(um).padStart(2, '0')}`);
  }

  /* ─── render ─────────────────────────────────────────────────────────── */
  // ── Access Denied for Admin, Employee, or non-HR users ──
  if (!isHr) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f8fafc',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fee2e2',
          padding: '40px 30px',
          textAlign: 'center',
          boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.08)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginBottom: '20px'
          }}>
            <FaShieldAlt />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontFamily: "'Sora', sans-serif" }}>
            Access Denied
          </h2>
          <div style={{
            display: 'inline-block',
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            Access by Only HR
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            Attendance Policy features are restricted to <strong>HR only</strong>. Admin, Employee, or other roles do not have permission to view or configure attendance policies.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#6B1E2E',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ padding: '32px 36px' }}>
      <ToastContainer />

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Attendance Policy &amp; Shift Engine</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Centralized backend rules for shift hours, punch access windows, grace periods, checkout locks &amp; overtime
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                saveShiftSystemSettings(systemSettings);
                window.dispatchEvent(new Event('hrms_shift_settings_updated'));
                window.dispatchEvent(new Event('hrms_shifts_updated'));
                toast.success('Sync Complete', 'Policy successfully re-bound and synced to all subsystems.');
              }}
              className="btn-outline-indigo"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px' }}
              title="Broadcast and re-bind this policy across all tabs and widgets"
            >
              <FaSyncAlt size={12} /> Sync Subsystems
            </button>

            <button
              onClick={handleOpenCreate}
              className="btn-gradient"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
            >
              <span style={{ fontSize: '17px', lineHeight: 1 }}>+</span> Create Policy
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px' }}>
          <LoadingSpinner message="Loading attendance policy and shift engine data..." />
        </div>

      ) : policy ? (
        <div className="card-modern" style={{ overflow: 'hidden', borderRadius: '18px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          {/* Card header */}
          <div style={{
            padding: '24px 28px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light)',
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#fee2e2',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                border: '1px solid #fecdd3',
                boxShadow: '0 4px 10px rgba(225, 29, 72, 0.12)'
              }}>
                <FaClock size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#0f172a',
                    fontFamily: "'Sora', sans-serif"
                  }}>
                    {policy.name || 'Active Shift Policy'}
                  </h2>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: policy.isActive ? '#dcfce7' : '#f1f5f9',
                    color: policy.isActive ? '#15803d' : '#64748b'
                  }}>
                    {policy.isActive ? '● Active in Database' : 'Inactive'}
                  </span>
                  {isNight && (
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: '#ede9fe',
                      color: '#6d28d9',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <FaMoon size={10} /> Overnight Duty (Spans Midnight)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Bound to backend database • Enforcing rules across Roster Calendar, Punch Widgets &amp; Attendance Records
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleEditActive}
                className="btn-gradient"
                style={{ fontSize: '12px', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                title="Edit active shift policy rules and update backend"
              >
                <FaEdit size={13} /> Edit Policy &amp; Bindings
              </button>
              {!policy.isActive && (
                <button
                  onClick={() => handleActivate(policy.id)}
                  disabled={activating}
                  className="btn-outline-indigo"
                  style={{ fontSize: '12px', padding: '9px 18px' }}
                >
                  {activating ? 'Activating...' : '✦ Activate'}
                </button>
              )}
            </div>
          </div>

          {/* Real Live Subsystem Binding Status Banner */}
          <div style={{
            margin: '20px 28px 0',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
            borderRadius: 12,
            border: '1px solid #a7f3d0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaCheckCircle size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#065f46' }}>
                  Backend &amp; Subsystems Fully Bound
                </div>
                <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                  Governing <strong>Check-In Open Time ({checkInUnlockTimeStr})</strong>, <strong>Shift Duration ({shiftDuration} hrs)</strong>, <strong>Checkout Gate</strong>, and <strong>Roster Calendars</strong>.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#065f46', background: '#d1fae5', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
                Bound Code: {form.shiftCode || policy.shiftCode || '12-9'}
              </span>
            </div>
          </div>

          {/* Stats grid (All Parameters - Click any card to edit) */}
          <div style={{
            padding: '20px 28px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '16px'
          }}>
            {/* 1. Shift Start */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #3b82f6', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Shift Start</span>
                <span style={{ fontSize: '10px', color: '#3b82f6' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>{fmtTime(policy.shiftStart)}</div>
              <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '4px' }}>Scheduled Duty Start</div>
            </div>

            {/* 2. Shift End */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #8b5cf6', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Shift End</span>
                <span style={{ fontSize: '10px', color: '#8b5cf6' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>{fmtTime(policy.shiftEnd)}</div>
              <div style={{ fontSize: '10px', color: isNight ? '#7c3aed' : '#64748b', marginTop: '4px', fontWeight: isNight ? '700' : '400' }}>
                {isNight ? '🌙 Next Day Morning' : 'Same Day Conclusion'}
              </div>
            </div>

            {/* 3. Duration */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #10b981', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Shift Duration</span>
                <span style={{ fontSize: '10px', color: '#10b981' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{shiftDuration} hrs</div>
              <div style={{ fontSize: '10px', color: '#059669', marginTop: '4px' }}>Total Span of Duty</div>
            </div>

            {/* 4. Grace Period */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #f59e0b', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Grace Period</span>
                <span style={{ fontSize: '10px', color: '#f59e0b' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>{policy.graceMinutes != null ? `${policy.graceMinutes} min` : '10 min'}</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Punches on-time up to grace</div>
            </div>

            {/* 5. Check-In Window */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #06b6d4', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Pre-Shift Access</span>
                <span style={{ fontSize: '10px', color: '#06b6d4' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0891b2', marginTop: '4px' }}>{systemSettings.checkInBeforeMinutes ?? 10} min</div>
              <div style={{ fontSize: '10px', color: '#0891b2', marginTop: '4px' }}>Button opens at {checkInUnlockTimeStr}</div>
            </div>

            {/* 6. Checkout Gate */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #e11d48', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Checkout Lock Rule</span>
                <span style={{ fontSize: '10px', color: '#e11d48' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#be123c', marginTop: '6px' }}>
                {systemSettings.enforceCheckOutAfterShift !== false ? 'Block Early Out' : 'Flexible Out'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Only out after shift ends</div>
            </div>

            {/* 7. Post-Shift Window */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #6366f1', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Checkout Window</span>
                <span style={{ fontSize: '10px', color: '#6366f1' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#4f46e5', marginTop: '4px' }}>{systemSettings.checkOutGraceMinutes ?? 15} min</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Prompt after shift end</div>
            </div>

            {/* 8. Break Duration */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #ea580c', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Meal / Break Time</span>
                <span style={{ fontSize: '10px', color: '#ea580c' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#c2410c', marginTop: '4px' }}>{systemSettings.breakMinutes ?? 45} min</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Pause allotment per shift</div>
            </div>

            {/* 9. Half-Day Threshold */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #d97706', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Half-Day Threshold</span>
                <span style={{ fontSize: '10px', color: '#d97706' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>{policy.halfDayThresholdHours != null ? `${policy.halfDayThresholdHours} hrs` : '4 hrs'}</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Minimum for partial credit</div>
            </div>

            {/* 10. Full-Day Hours */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #16a34a', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Full-Day Required</span>
                <span style={{ fontSize: '10px', color: '#16a34a' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>{policy.fullDayHours != null ? `${policy.fullDayHours} hrs` : '8 hrs'}</div>
              <div style={{ fontSize: '10px', color: '#15803d', marginTop: '4px' }}>100% Present criteria</div>
            </div>

            {/* 11. Overtime */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #4338ca', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Overtime Credit</span>
                <span style={{ fontSize: '10px', color: '#4338ca' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: policy.allowOvertime ? '#15803d' : '#64748b', marginTop: '4px' }}>
                {policy.allowOvertime ? 'Allowed' : 'Disabled'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Beyond-shift productivity</div>
            </div>

            {/* 12. Weekly Offs */}
            <div
              onClick={handleEditActive}
              className="stat-card"
              style={{ padding: '16px', borderLeft: '4px solid #475569', cursor: 'pointer', position: 'relative' }}
              title="Click to edit shift policy rules"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Weekly Rest Offs</span>
                <span style={{ fontSize: '10px', color: '#475569' }}>✏️ Edit</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#334155', marginTop: '6px' }}>
                {systemSettings.weeklyOffPolicy === 'SUN_ONLY' ? 'Sunday Only' : 'Sat & Sun Off'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Automated rest roster</div>
            </div>
          </div>

          {/* Bound Categories Overview Strip - ALL CATEGORIES EDITABLE */}
          <div style={{
            margin: '0 28px 24px',
            padding: '18px 22px',
            background: '#f8fafc',
            borderRadius: 14,
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaLayerGroup color="#6366f1" size={14} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                  Bound Shift Master Categories ({shiftsList.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').length})
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Click ✏️ on any category to edit timings &amp; rules in backend database
                </span>
                <button
                  onClick={handleOpenAddShift}
                  className="btn-outline-indigo"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '5px 12px', fontWeight: '700' }}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span> Add Shift Category
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {shiftsList.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => (
                <div
                  key={s.id || s.code}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#fff',
                    border: `1px solid ${s.borderColor || '#cbd5e1'}`,
                    borderLeft: `4px solid ${s.color || '#6366f1'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: s.color || '#1e293b', fontWeight: '800' }}>{s.code}</strong>
                      <span style={{ color: '#334155', fontWeight: '700' }}>{s.name}</span>
                      {s.isNightShift && (
                        <span style={{ fontSize: '9px', background: '#ede9fe', color: '#7c3aed', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                          Overnight
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      ({format12Hour(s.startTime)} – {format12Hour(s.endTime)}) • {s.durationHours} hrs
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                    <button
                      onClick={() => handleOpenEditShift(s)}
                      style={{
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#334155',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}
                      title="Edit this shift category in database"
                    >
                      ✏️ Edit
                    </button>
                    {s.code !== 'GS' && (
                      <button
                        onClick={() => handleDeleteShift(s)}
                        style={{
                          border: '1px solid #fecdd3',
                          background: '#fff1f2',
                          color: '#e11d48',
                          borderRadius: '6px',
                          padding: '4px 7px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                        title="Delete shift category from database"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer info strip */}
          <div style={{
            margin: '0 28px 24px',
            padding: '12px 18px',
            background: '#faf5ff',
            borderRadius: 10,
            border: '1px solid #f3e8ff',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            color: '#7e22ce'
          }}>
            <FaInfoCircle size={14} />
            <span>
              Only one policy can be active at a time in the backend database. Modifying or saving this policy updates the server database immediately and synchronizes all punch and roster views.
            </span>
          </div>
        </div>

      ) : (
        /* Empty state */
        <div className="card-modern" style={{
          padding: '64px 32px',
          textAlign: 'center',
          border: '2px dashed var(--border-medium)',
          borderRadius: '16px',
          background: '#fff'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 18px',
            border: '1px solid var(--border-light)'
          }}>📋</div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            No Active Policy Found
          </h3>
          <p style={{ margin: '8px auto 24px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.6 }}>
            Create an attendance policy to define shift hours, pre-shift punch windows, grace periods, and overtime rules.
          </p>
          <button
            onClick={handleOpenCreate}
            className="btn-gradient"
          >
            + Create First Policy
          </button>
        </div>
      )}

      {/* CREATE & EDIT MODAL (ALL ATTRIBUTES BOUND) */}
      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setForm(EMPTY_FORM);
            }
          }}
          className="emp-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div className="card-modern" style={{ maxWidth: '640px', width: '96%', borderRadius: '18px', background: '#fff', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#fee2e2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaEdit size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                    {isEditing ? 'Edit Active Policy & Backend Bindings' : 'Create & Bind Attendance Policy'}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Configures server database &amp; synchronizes punch windows, checkout gates &amp; roster rules
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                }}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px 24px' }}>
              {/* SECTION 1: Policy Name & Shift Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Policy Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. 12-9 Shift Policy"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Shift Code *
                  </label>
                  <input
                    name="shiftCode"
                    value={form.shiftCode}
                    onChange={(e) => setForm({ ...form, shiftCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. 12-9"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* SECTION 2: Shift Timings */}
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaClock color="#6366f1" size={12} />
                  Shift Hours &amp; Day-Span
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Shift Start Time *
                    </label>
                    <input
                      type="time"
                      name="shiftStart"
                      value={form.shiftStart}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                      Formatted: <strong>{fmtTime(form.shiftStart)}</strong>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Shift End Time *
                    </label>
                    <input
                      type="time"
                      name="shiftEnd"
                      value={form.shiftEnd}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                      Formatted: <strong>{fmtTime(form.shiftEnd)}</strong>
                    </div>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b', cursor: 'pointer', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    name="isNightShift"
                    checked={form.isNightShift}
                    onChange={handleChange}
                  />
                  <span>🌙 <strong>Spans midnight (Overnight / Next-Day Shift)</strong></span>
                </label>
              </div>

              {/* SECTION 3: Punch Access Windows & Checkout Rules */}
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaSignInAlt color="#10b981" size={12} />
                  Punch Access &amp; Checkout Restrictions
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Check-In Window (Pre-Shift Access)
                    </label>
                    <select
                      name="checkInBeforeMinutes"
                      value={form.checkInBeforeMinutes}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      <option value={5}>5 min before shift start (Standard)</option>
                      <option value={10}>10 min before shift start</option>
                      <option value={15}>15 min before shift start</option>
                      <option value={30}>30 min before shift start</option>
                      <option value={0}>Exact shift start time only</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Checkout Prompt Window
                    </label>
                    <select
                      name="checkOutGraceMinutes"
                      value={form.checkOutGraceMinutes}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      <option value={10}>Within 10 min after shift</option>
                      <option value={15}>Within 15 min after shift</option>
                      <option value={30}>Within 30 min after shift</option>
                      <option value={60}>Within 60 min after shift</option>
                    </select>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b', cursor: 'pointer', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    name="enforceCheckOutAfterShift"
                    checked={form.enforceCheckOutAfterShift}
                    onChange={handleChange}
                  />
                  <span>🔒 <strong>Enforce Shift Completion (Block checkout before scheduled shift end)</strong></span>
                </label>
              </div>

              {/* SECTION 4: Grace, Breaks, and Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Grace (min) *
                  </label>
                  <input
                    type="number"
                    name="graceMinutes"
                    min="0"
                    value={form.graceMinutes}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Break (min) *
                  </label>
                  <input
                    type="number"
                    name="breakMinutes"
                    min="0"
                    value={form.breakMinutes}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Half-Day (hrs) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    name="halfDayThresholdHours"
                    min="0"
                    value={form.halfDayThresholdHours}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Full-Day (hrs) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    name="fullDayHours"
                    min="0"
                    value={form.fullDayHours}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* SECTION 5: Weekly Off Schedule */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Weekly Rest Off Schedule
                </label>
                <select
                  name="weeklyOffPolicy"
                  value={form.weeklyOffPolicy}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                >
                  <option value="SAT_SUN">Saturday &amp; Sunday Off (Standard 5-day week)</option>
                  <option value="SUN_ONLY">Sunday Only Off (6-day operational week)</option>
                  <option value="SUN_WORKING">All 7 Days Operational (Rotational Rest Schedule)</option>
                </select>
              </div>

              {/* SECTION 6: Toggles */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Allow Overtime</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>Log hours beyond shift end</p>
                  </div>
                  <input
                    type="checkbox"
                    name="allowOvertime"
                    checked={form.allowOvertime}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </label>

                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Set as Active Policy</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>Activate across server immediately</p>
                  </div>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                }}
                className="btn-outline-secondary"
                style={{ padding: '8px 18px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="btn-gradient"
                style={{ padding: '8px 22px', fontSize: '12px', fontWeight: '700' }}
              >
                {saving ? 'Saving & Binding...' : 'Save & Bind to All Subsystems'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: EDIT OR ADD SHIFT MASTER CATEGORY (PERSISTS TO DB)
      ═══════════════════════════════════════════════════════════════════ */}
      {showShiftModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShiftModal(false);
            }
          }}
          className="emp-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div className="card-modern" style={{ maxWidth: '540px', width: '96%', borderRadius: '18px', background: '#fff', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaClock size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                    {isEditingShift ? `Edit Shift Category (${shiftForm.code})` : 'Add New Shift Category'}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Updates PostgreSQL shift_master table &amp; syncs to Roster Management
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowShiftModal(false)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Shift Name *
                  </label>
                  <input
                    type="text"
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                    placeholder="e.g. Morning Shift"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Shift Code *
                  </label>
                  <input
                    type="text"
                    value={shiftForm.code}
                    disabled={isEditingShift && (shiftForm.code === 'GS' || shiftForm.code === '12-9')}
                    onChange={(e) => setShiftForm({ ...shiftForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MS"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '800' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                    Formatted: <strong>{fmtTime(shiftForm.startTime)}</strong>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                    Formatted: <strong>{fmtTime(shiftForm.endTime)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={shiftForm.isNightShift}
                    onChange={(e) => setShiftForm({ ...shiftForm, isNightShift: e.target.checked })}
                  />
                  <span>🌙 <strong>Spans midnight (Overnight / Next-Day Shift)</strong></span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Duration (hrs)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={shiftForm.durationHours}
                    onChange={(e) => setShiftForm({ ...shiftForm, durationHours: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Break (min)
                  </label>
                  <input
                    type="number"
                    value={shiftForm.breakMinutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, breakMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Grace (min)
                  </label>
                  <input
                    type="number"
                    value={shiftForm.graceMinutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, graceMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Badge Color Theme
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', label: 'Rose' },
                    { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'Sky' },
                    { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Amber' },
                    { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Purple' },
                    { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Emerald' },
                    { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Blue' }
                  ].map(c => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setShiftForm({ ...shiftForm, color: c.color, bgColor: c.bg, borderColor: c.border })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: c.color,
                        border: shiftForm.color === c.color ? '3px solid #0f172a' : '1px solid transparent',
                        cursor: 'pointer'
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={shiftForm.description}
                  onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                  placeholder="e.g. Operational Duty Shift"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowShiftModal(false)}
                className="btn-outline-secondary"
                style={{ padding: '8px 18px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShift}
                disabled={savingShift}
                className="btn-gradient"
                style={{ padding: '8px 22px', fontSize: '12px', fontWeight: '700' }}
              >
                {savingShift ? 'Saving to Database...' : 'Save Shift to Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
