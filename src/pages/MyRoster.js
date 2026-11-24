import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaCalendarAlt, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaInfoCircle, FaSun, FaMoon, FaCoffee,
  FaCalendarCheck, FaRegCalendarAlt, FaTimes, FaUserTie, FaBuilding, FaLock,
  FaSignInAlt, FaSignOutAlt, FaGift, FaSearch
} from 'react-icons/fa';
import axios from 'axios';
import { BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  DEFAULT_SHIFTS,
  getStoredShifts,
  saveStoredShifts,
  getShiftByCode,
  format12Hour,
  getTodayDateYMD,
  formatDateYMD,
  parseDateYMD,
  getDaysInMonth,
  evaluateShiftTimingRules,
  getEmployeeShiftForDate
} from '../utils/rosterUtils';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MyRoster({ user }) {
  const todayDateStr = getTodayDateYMD();
  const today = new Date();

  // Selected calendar month & year
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Logged-in employee details
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live backend data
  const [activePolicy, setActivePolicy] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [showHolidayListModal, setShowHolidayListModal] = useState(false);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');
  const [holidayFilterTab, setHolidayFilterTab] = useState('ALL');

  // Selected cell detail modal
  const [detailModal, setDetailModal] = useState({ show: false, dayData: null });

  // Resolve authenticated employee from localStorage / API
  useEffect(() => {
    try {
      const uDataStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      const empId = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID);
      const email = localStorage.getItem(STORAGE_KEYS.USERNAME);
      const role = localStorage.getItem(STORAGE_KEYS.ROLE) || 'EMPLOYEE';

      let empObj = {
        id: empId || 1,
        name: email ? email.split('@')[0] : 'Employee',
        email: email || '',
        code: empId ? `EMP${String(empId).padStart(3, '0')}` : 'EMP001',
        department: 'Operations',
        branch: 'Main HQ',
        role: role
      };

      if (uDataStr) {
        try {
          const parsed = JSON.parse(uDataStr);
          empObj = {
            ...empObj,
            ...parsed,
            id: parsed.id || empId,
            name: parsed.name || empObj.name,
            code: parsed.employeeCode || parsed.code || empObj.code,
            department: parsed.departmentName || parsed.department || empObj.department,
            branch: parsed.branchName || parsed.branch || empObj.branch
          };
        } catch {}
      }

      setEmployee(empObj);
    } catch (e) {
      console.warn('Error reading employee from storage:', e);
    }
  }, []);

  // Fetch real Backend Data: Attendance Policy, My Leaves, Holidays
  const fetchBackendData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    const authHeaders = token
      ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
      : {};

    try {
      // 1. Fetch Active Attendance Policy
      try {
        const polRes = await axios.get(API_ENDPOINTS.GET_ACTIVE_POLICY, { headers: authHeaders });
        const polData = polRes.data?.response || polRes.data?.data || polRes.data;
        if (polData && polData.shiftStart) {
          setActivePolicy(polData);
        }
      } catch (err) {
        console.warn('Attendance policy fetch note:', err);
      }

      // 2. Fetch My Approved Leaves
      try {
        const leaveRes = await axios.get(API_ENDPOINTS.GET_MY_LEAVES, { headers: authHeaders });
        const lList = leaveRes.data?.response || leaveRes.data?.data || leaveRes.data || [];
        if (Array.isArray(lList)) {
          setMyLeaves(lList);
        }
      } catch (err) {
        console.warn('My leaves fetch note:', err);
      }

      // 3. Fetch Official Holidays
      try {
        const holRes = await axios.get(API_ENDPOINTS.GET_ALL_HOLIDAYS, { headers: authHeaders });
        const hList = holRes.data?.response || holRes.data?.data || holRes.data || [];
        if (Array.isArray(hList)) {
          setHolidays(hList);
        }
      } catch (err) {
        console.warn('Holidays fetch note:', err);
      }

      // 4. Fetch All Shift Categories from Backend
      try {
        const shiftRes = await axios.get(API_ENDPOINTS.GET_SHIFTS, { headers: authHeaders });
        const sList = shiftRes.data?.response || shiftRes.data?.data || shiftRes.data || [];
        if (Array.isArray(sList) && sList.length > 0) {
          saveStoredShifts(sList, false);
        }
      } catch (err) {
        console.warn('My roster shifts fetch note:', err);
      }
    } catch (error) {
      console.error('Error loading data for My Roster:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const [settingsVersion, setSettingsVersion] = useState(0);
  const shifts = useMemo(() => getStoredShifts(), [settingsVersion]);
  const [todayPunchRecord, setTodayPunchRecord] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);

  // Fetch today's actual attendance punch status from PostgreSQL backend
  const fetchTodayPunchStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      if (!token) return;
      const res = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, {
        headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
      });
      const list = res.data?.response || res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        const todayStr = getTodayDateYMD();
        const found = list.find(r => r.date === todayStr);
        if (found) {
          setTodayPunchRecord(found);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchBackendData();
    fetchTodayPunchStatus();

    const handleSettingsUpdated = () => {
      setSettingsVersion(v => v + 1);
    };
    window.addEventListener('hrms_shift_settings_updated', handleSettingsUpdated);
    window.addEventListener('hrms_shifts_updated', handleSettingsUpdated);
    window.addEventListener('hrms_policy_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleSettingsUpdated);
    return () => {
      window.removeEventListener('hrms_shift_settings_updated', handleSettingsUpdated);
      window.removeEventListener('hrms_shifts_updated', handleSettingsUpdated);
      window.removeEventListener('hrms_policy_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleSettingsUpdated);
    };
  }, [fetchBackendData, fetchTodayPunchStatus]);

  // Build Holiday Lookup Map
  const holidayMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(holidays)) {
      holidays.forEach(h => {
        if (h.date) {
          const dStr = String(h.date).split('T')[0];
          map.set(dStr, h.name || 'Company Holiday');
        }
      });
    }
    return map;
  }, [holidays]);

  // Holiday utilities for Total Holiday List modal
  const formatHolidayDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? cleanStr : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getHolidayDayName = (dateStr) => {
    if (!dateStr) return '';
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getHolidayDetailStatus = (dateStr) => {
    if (!dateStr) return { label: 'Scheduled', color: '#64748b', bg: '#f1f5f9' };
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    let holidayDate;
    if (parts.length === 3) {
      holidayDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      holidayDate = new Date(dateStr);
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    holidayDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((holidayDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { label: '🎉 Today!', color: '#b45309', bg: '#fef3c7', isToday: true };
    } else if (diffDays > 0) {
      if (diffDays <= 7) {
        return { label: `In ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: '#4338ca', bg: '#e0e7ff', isUpcoming: true };
      }
      return { label: 'Upcoming', color: '#0369a1', bg: '#e0f2fe', isUpcoming: true };
    } else {
      return { label: 'Completed', color: '#64748b', bg: '#f1f5f9', isPast: true };
    }
  };

  const isWeekendHoliday = (dateStr) => {
    if (!dateStr) return false;
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    let d;
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(dateStr);
    }
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const sortedHolidays = useMemo(() => {
    if (!Array.isArray(holidays)) return [];
    return [...holidays].sort((a, b) => {
      const da = (a.date || a.holidayDate || a.startDate || '').split('T')[0];
      const db = (b.date || b.holidayDate || b.startDate || '').split('T')[0];
      return da.localeCompare(db);
    });
  }, [holidays]);

  const holidayStats = useMemo(() => {
    const todayStr = getTodayDateYMD();
    let upcoming = 0;
    let passed = 0;
    let thisMonth = 0;

    sortedHolidays.forEach(h => {
      const dStr = (h.date || h.holidayDate || h.startDate || '').split('T')[0];
      if (!dStr) return;
      if (dStr >= todayStr) upcoming++;
      else passed++;

      const parts = dStr.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (y === selectedYear && m === selectedMonth) {
          thisMonth++;
        }
      }
    });

    return {
      total: sortedHolidays.length,
      upcoming,
      passed,
      thisMonth
    };
  }, [sortedHolidays, selectedYear, selectedMonth]);

  const displayedHolidays = useMemo(() => {
    const q = (holidaySearchQuery || '').toLowerCase().trim();
    const todayStr = getTodayDateYMD();

    return sortedHolidays.filter(h => {
      const dStr = (h.date || h.holidayDate || h.startDate || '').split('T')[0];
      const name = (h.name || h.holidayName || h.title || '').toLowerCase();
      const desc = (h.description || '').toLowerCase();
      const dayName = getHolidayDayName(dStr).toLowerCase();
      const formatted = formatHolidayDate(dStr).toLowerCase();

      const matchesSearch = !q ||
        name.includes(q) ||
        desc.includes(q) ||
        dStr.includes(q) ||
        dayName.includes(q) ||
        formatted.includes(q);

      if (!matchesSearch) return false;

      if (holidayFilterTab === 'UPCOMING') {
        return dStr >= todayStr;
      }
      if (holidayFilterTab === 'PAST') {
        return dStr < todayStr;
      }
      if (holidayFilterTab === 'THIS_MONTH') {
        const parts = dStr.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          return y === selectedYear && m === selectedMonth;
        }
        return false;
      }

      return true; // 'ALL'
    });
  }, [sortedHolidays, holidaySearchQuery, holidayFilterTab, selectedYear, selectedMonth]);

  // Build Approved Leave Lookup Map
  const leaveMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(myLeaves)) {
      myLeaves.forEach(lv => {
        const status = String(lv.status || '').toUpperCase();
        if (status === 'APPROVED' && lv.startDate && lv.endDate) {
          const start = new Date(lv.startDate);
          const end = new Date(lv.endDate);
          const cur = new Date(start);
          while (cur <= end) {
            map.set(formatDateYMD(cur), lv.reason || lv.leaveType?.name || 'Approved Leave');
            cur.setDate(cur.getDate() + 1);
          }
        }
      });
    }
    return map;
  }, [myLeaves]);

  // Calculate Calendar Days & Personal Schedule for the selected Month
  const calendarData = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const days = [];

    let totalWorking = 0;
    let totalWeeklyOffs = 0;
    let totalHolidays = 0;
    let totalLeaves = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(selectedYear, selectedMonth, day);
      const dateStr = formatDateYMD(d);
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === todayDateStr;

      const isHoliday = holidayMap.has(dateStr);
      const holidayName = holidayMap.get(dateStr) || null;
      const hasApprovedLeave = leaveMap.has(dateStr);
      const leaveReason = leaveMap.get(dateStr) || null;

      let shiftCode = 'GS';
      let status = 'ASSIGNED';
      let note = '';

      if (hasApprovedLeave) {
        status = 'ON_LEAVE';
        shiftCode = 'LV';
        note = leaveReason;
        totalLeaves++;
      } else if (isHoliday) {
        status = 'HOLIDAY';
        shiftCode = 'HL';
        note = holidayName;
        totalHolidays++;
      } else if (isWeekend) {
        status = 'WEEKLY_OFF';
        shiftCode = 'WO';
        note = 'Weekly Off';
        totalWeeklyOffs++;
      } else {
        // Resolve employee assigned shift or default General Shift
        const assigned = employee ? getEmployeeShiftForDate(employee.id, dateStr) : getShiftByCode('GS');
        shiftCode = assigned.code;
        status = 'ASSIGNED';
        note = assigned.name;
        totalWorking++;
      }

      const shiftObj = getShiftByCode(shiftCode);

      days.push({
        dayNumber: day,
        date: d,
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfWeek,
        isWeekend,
        isToday,
        status,
        shiftCode,
        note,
        shift: shiftObj,
        holidayName,
        leaveReason
      });
    }

    return {
      daysInMonth,
      days,
      stats: {
        totalDays: daysInMonth,
        workingDays: totalWorking,
        weeklyOffs: totalWeeklyOffs,
        holidays: totalHolidays,
        leaves: totalLeaves
      }
    };
  }, [selectedYear, selectedMonth, employee, holidayMap, leaveMap, todayDateStr]);

  // Today's Shift & Strict Timing Evaluation
  const todayShift = useMemo(() => {
    if (!employee) return getShiftByCode('GS');
    return getEmployeeShiftForDate(employee.id, todayDateStr);
  }, [employee, todayDateStr]);

  const timingRules = useMemo(() => {
    return evaluateShiftTimingRules(todayShift, today);
  }, [todayShift, today]);

  // Tomorrow's Shift
  const tomorrowShift = useMemo(() => {
    if (!employee) return getShiftByCode('GS');
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);
    const tomStr = formatDateYMD(tom);
    if (holidayMap.has(tomStr)) return getShiftByCode('HL');
    if (leaveMap.has(tomStr)) return getShiftByCode('LV');
    const dayOfWeek = tom.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return getShiftByCode('WO');
    return getEmployeeShiftForDate(employee.id, tomStr);
  }, [employee, today, holidayMap, leaveMap]);

  // Current Week Days (Mon - Sun)
  const currentWeekDays = useMemo(() => {
    const monday = new Date(today);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDateYMD(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      let shiftCode = 'GS';
      let status = 'ASSIGNED';
      let note = '';

      if (leaveMap.has(dateStr)) {
        status = 'ON_LEAVE';
        shiftCode = 'LV';
        note = leaveMap.get(dateStr);
      } else if (holidayMap.has(dateStr)) {
        status = 'HOLIDAY';
        shiftCode = 'HL';
        note = holidayMap.get(dateStr);
      } else if (isWeekend) {
        status = 'WEEKLY_OFF';
        shiftCode = 'WO';
        note = 'Weekly Off';
      } else {
        const assigned = employee ? getEmployeeShiftForDate(employee.id, dateStr) : getShiftByCode('GS');
        shiftCode = assigned.code;
        status = 'ASSIGNED';
        note = assigned.name;
      }

      week.push({
        date: d,
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dateStr === todayDateStr,
        isWeekend,
        shiftCode,
        status,
        note,
        shift: getShiftByCode(shiftCode)
      });
    }
    return week;
  }, [today, todayDateStr, employee, leaveMap, holidayMap]);

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToToday = () => {
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  };

  const handlePunchCheckIn = async () => {
    if (!timingRules.canCheckIn) {
      toast.error('Check-in Not Allowed Yet', timingRules.checkInMessage);
      return;
    }
    setPunchLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const shiftCode = todayShift?.code || 'GS';
      const response = await axios.post(
        `${API_ENDPOINTS.CHECK_IN}?shiftCode=${shiftCode}`,
        {},
        { headers: { Authorization: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '' } }
      );
      if (response.data?.status === 'SUCCESS' || response.status === 200) {
        toast.success('Database Synced', response.data?.message || 'Checked in successfully!');
        fetchTodayPunchStatus();
      } else {
        toast.error('Check-in Restricted', response.data?.message || 'Check-in failed');
      }
    } catch (err) {
      toast.error('Check-in Error', err.response?.data?.message || 'Check-in failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchCheckOut = async () => {
    if (!timingRules.canCheckOut) {
      toast.error('Checkout Restricted by Shift Policy', timingRules.checkOutMessage);
      return;
    }
    setPunchLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const shiftCode = todayShift?.code || 'GS';
      const response = await axios.post(
        `${API_ENDPOINTS.CHECK_OUT}?shiftCode=${shiftCode}`,
        {},
        { headers: { Authorization: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '' } }
      );
      if (response.data?.status === 'SUCCESS' || response.status === 200) {
        toast.success('Database Synced', response.data?.message || 'Checked out successfully!');
        fetchTodayPunchStatus();
      } else {
        toast.error('Check-out Restricted', response.data?.message || 'Checkout failed');
      }
    } catch (err) {
      toast.error('Checkout Error', err.response?.data?.message || 'Checkout failed');
    } finally {
      setPunchLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="attendance-root" style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {loading && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Loading your personal duty roster..." />
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="attendance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaClock style={{ color: 'var(--accent-indigo, #6366f1)' }} />
                My Shift &amp; Duty Schedule
              </h1>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                Personal Shift (Private)
              </span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Logged-in Employee: <strong>{employee?.name}</strong> ({employee?.code}) • Department: <strong>{employee?.department}</strong> • Branch: <strong>{employee?.branch}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={goToToday}
              className="btn-outline-indigo"
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}
            >
              Today Shortcut
            </button>
          </div>
        </div>

        {/* ── Strict Employee Privacy & Security Alert ── */}
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12px',
          color: '#166534'
        }}>
          <FaLock size={16} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <strong>Strict Shift Privacy Active:</strong> You are securely authenticated. In compliance with HRMS confidentiality rules, you can only view your own shift schedule and punch timings. Access to other employees' schedules is strictly restricted.
          </div>
        </div>

        {/* ── 4 Quick Highlight Cards: Today, Tomorrow, Week, Next Week ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '22px' }}>
          {/* Card 1: Today's Shift */}
          <div className="stat-card" style={{ padding: '16px', borderRadius: '14px', borderLeft: `4px solid ${todayShift.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>TODAY'S SHIFT</span>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', background: todayShift.bgColor, color: todayShift.color, border: `1px solid ${todayShift.borderColor}` }}>
                {todayShift.code}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', fontFamily: "'Sora', sans-serif" }}>
              {todayShift.name}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: todayShift.color, marginTop: '4px' }}>
              {todayShift.startTime !== '--:--' ? `${format12Hour(todayShift.startTime)} – ${format12Hour(todayShift.endTime)}` : 'Rest Day (Off)'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              {timingRules.canCheckIn ? (
                <span style={{ color: '#059669', fontWeight: '700' }}>🟢 Check-in is open</span>
              ) : (
                <span style={{ color: '#d97706', fontWeight: '700' }}>🔒 Check-in opens 5m before ({timingRules.checkInWindowStartFormatted})</span>
              )}
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              {!todayPunchRecord?.checkIn ? (
                <button
                  onClick={handlePunchCheckIn}
                  disabled={punchLoading || !timingRules.canCheckIn}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    border: 'none',
                    background: timingRules.canCheckIn ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0',
                    color: timingRules.canCheckIn ? '#fff' : '#94a3b8',
                    cursor: timingRules.canCheckIn ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  title={timingRules.canCheckIn ? 'Punch in to start shift' : timingRules.checkInMessage}
                >
                  <FaSignInAlt size={11} />
                  {punchLoading ? 'Saving...' : 'Punch In'}
                </button>
              ) : !todayPunchRecord?.checkOut ? (
                <button
                  onClick={handlePunchCheckOut}
                  disabled={punchLoading || !timingRules.canCheckOut}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    border: 'none',
                    background: timingRules.canCheckOut ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#e2e8f0',
                    color: timingRules.canCheckOut ? '#fff' : '#94a3b8',
                    cursor: timingRules.canCheckOut ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  title={timingRules.canCheckOut ? 'Punch out to end shift' : timingRules.checkOutMessage}
                >
                  <FaSignOutAlt size={11} />
                  {punchLoading ? 'Saving...' : (timingRules.canCheckOut ? 'Punch Out' : 'Punch Out (Locked)')}
                </button>
              ) : (
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaCheckCircle size={12} />
                  Shift Completed ({todayPunchRecord.checkIn} – {todayPunchRecord.checkOut})
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Tomorrow's Shift */}
          <div className="stat-card" style={{ padding: '16px', borderRadius: '14px', borderLeft: `4px solid ${tomorrowShift.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>TOMORROW'S SHIFT</span>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', background: tomorrowShift.bgColor, color: tomorrowShift.color, border: `1px solid ${tomorrowShift.borderColor}` }}>
                {tomorrowShift.code}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', fontFamily: "'Sora', sans-serif" }}>
              {tomorrowShift.name}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: tomorrowShift.color, marginTop: '4px' }}>
              {tomorrowShift.startTime !== '--:--' ? `${format12Hour(tomorrowShift.startTime)} – ${format12Hour(tomorrowShift.endTime)}` : 'Rest Day (Off)'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
              Duration: <strong>{tomorrowShift.durationHours} hrs</strong> • Break: {tomorrowShift.breakMinutes}m
            </div>
          </div>

          {/* Card 3: Current Month Duty Summary */}
          <div className="stat-card" style={{ padding: '16px', borderRadius: '14px', borderLeft: '4px solid #6366f1' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
              {monthNames[selectedMonth]} {selectedYear} DUTY STATS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Working Days</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                  {calendarData.stats.workingDays}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Weekly Offs</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#64748b' }}>
                  {calendarData.stats.weeklyOffs}
                </div>
              </div>
              <div
                style={{ cursor: 'pointer', padding: '2px 4px', borderRadius: '6px', transition: 'background 0.15s ease' }}
                onClick={() => setShowHolidayListModal(true)}
                title="Click to view total holiday list"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Holidays</span>
                  <span style={{ fontSize: '9px', color: '#e11d48', fontWeight: '700' }}>View ↗</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#e11d48' }}>
                  {calendarData.stats.holidays}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Leaves</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#4f46e5' }}>
                  {calendarData.stats.leaves}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Next Week Rotation Projection */}
          <div className="stat-card" style={{ padding: '16px', borderRadius: '14px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>
              WEEKLY ROTATION CYCLE
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
              Morning → Day → Night
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
              Shift cycles every 7 days. General shift employees remain fixed on General Shift ({activePolicy?.shiftStart ? format12Hour(activePolicy.shiftStart) : '09:00 AM'} - {activePolicy?.shiftEnd ? format12Hour(activePolicy.shiftEnd) : '06:00 PM'}).
            </p>
          </div>
        </div>

        {/* ── Current Week Breakdown Bar (Mon - Sun) ── */}
        <div className="card-modern" style={{ padding: '16px 20px', borderRadius: '14px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaRegCalendarAlt size={14} color="#6366f1" />
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                Current Week Duty Roster (Monday – Sunday)
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Week of {currentWeekDays[0]?.dateStr} to {currentWeekDays[6]?.dateStr}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
            {currentWeekDays.map((cd, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: cd.isToday ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  background: cd.isToday ? '#f5f3ff' : cd.isWeekend ? '#f8fafc' : '#ffffff',
                  textAlign: 'center',
                  boxShadow: cd.isToday ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', color: cd.isToday ? '#6366f1' : '#64748b' }}>
                  {cd.dayName}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: '2px 0 6px 0' }}>
                  {cd.dayNum}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: cd.shift.bgColor,
                    color: cd.shift.color,
                    border: `1px solid ${cd.shift.borderColor}`
                  }}
                >
                  {cd.shiftCode}
                </span>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cd.shift.startTime !== '--:--' ? `${cd.shift.startTime}-${cd.shift.endTime}` : cd.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Monthly Interactive Calendar (28, 29, 30, 31 Days) ── */}
        <div className="card-modern" style={{ padding: '20px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' }}>
          {/* Calendar Header with Month & Year Navigator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={prevMonth}
                className="btn-outline-indigo"
                style={{ padding: '6px 10px', borderRadius: '8px' }}
                title="Previous Month"
              >
                <FaChevronLeft size={11} />
              </button>

              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#1e293b', fontFamily: "'Sora', sans-serif" }}>
                {monthNames[selectedMonth]} {selectedYear}
              </h2>

              <button
                onClick={nextMonth}
                className="btn-outline-indigo"
                style={{ padding: '6px 10px', borderRadius: '8px' }}
                title="Next Month"
              >
                <FaChevronRight size={11} />
              </button>

              <span style={{ fontSize: '11px', color: '#64748b', padding: '3px 8px', background: '#f1f5f9', borderRadius: '6px' }}>
                {calendarData.daysInMonth} Days
              </span>
            </div>

            {/* Shift Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '11px' }}>
              {shifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => {
                const sTime = s.startTime ? String(s.startTime).substring(0, 5) : '';
                const eTime = s.endTime ? String(s.endTime).substring(0, 5) : '';
                const timeStr = sTime && eTime ? ` (${sTime} - ${eTime})` : '';
                const label = (s.name || s.code).replace(/ Shift$/i, '');
                return (
                  <span key={s.id || s.code} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color || '#3b82f6' }}></span>
                    {s.shortCode || s.code} — {label}{timeStr}
                  </span>
                );
              })}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#64748b' }}></span>
                OFF — Weekly Off
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#e11d48' }}></span>
                H — Holiday
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4f46e5' }}></span>
                L — Leave
              </span>
            </div>
          </div>

          {/* Month Day Grid (7 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dname, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '11px',
                  color: idx === 0 || idx === 6 ? '#94a3b8' : '#475569',
                  background: '#f8fafc',
                  borderRadius: '6px'
                }}
              >
                {dname}
              </div>
            ))}

            {/* Empty Offset cells before 1st of the month */}
            {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }).map((_, emptyIdx) => (
              <div key={`empty-${emptyIdx}`} style={{ minHeight: '80px', background: '#fafafa', borderRadius: '8px', opacity: 0.4 }}></div>
            ))}

            {/* Actual Days of the Month */}
            {calendarData.days.map((dayObj) => {
              const isToday = dayObj.isToday;
              return (
                <div
                  key={dayObj.dateStr}
                  onClick={() => setDetailModal({ show: true, dayData: dayObj })}
                  style={{
                    minHeight: '85px',
                    padding: '8px',
                    borderRadius: '10px',
                    border: isToday ? '2px solid #6366f1' : '1px solid #e2e8f0',
                    background: isToday ? '#f5f3ff' : dayObj.isWeekend ? '#fbfcfe' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  title="Click to view full duty details"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: isToday ? '800' : '600', color: isToday ? '#6366f1' : '#334155' }}>
                      {dayObj.dayNumber}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#6366f1', background: '#ede9fe', padding: '1px 5px', borderRadius: '4px' }}>
                        TODAY
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '4px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: dayObj.shift.bgColor,
                        color: dayObj.shift.color,
                        border: `1px solid ${dayObj.shift.borderColor}`
                      }}
                    >
                      {dayObj.shiftCode}
                    </span>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                      {dayObj.shift.startTime !== '--:--' ? `${dayObj.shift.startTime}–${dayObj.shift.endTime}` : dayObj.note}
                    </div>
                  </div>

                  {dayObj.status === 'HOLIDAY' && (
                    <div style={{ fontSize: '9px', color: '#e11d48', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🎉 {dayObj.holidayName}
                    </div>
                  )}

                  {dayObj.status === 'ON_LEAVE' && (
                    <div style={{ fontSize: '9px', color: '#4f46e5', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🏖️ On Leave
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Detail Modal for Clicked Day Cell ── */}
        {detailModal.show && detailModal.dayData && (
          <div className="emp-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)' }}>
            <div className="card-modern" style={{ width: '420px', maxWidth: '90vw', padding: '22px', borderRadius: '16px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaCalendarAlt size={15} color="#6366f1" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                    Duty Details: {detailModal.dayData.dateStr}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailModal({ show: false, dayData: null })}
                  style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                >
                  <FaTimes size={12} color="#64748b" />
                </button>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: detailModal.dayData.shift.bgColor, border: `1px solid ${detailModal.dayData.shift.borderColor}`, marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: detailModal.dayData.shift.color }}>
                    {detailModal.dayData.shiftCode} — {detailModal.dayData.shift.name}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                    {detailModal.dayData.dayName}
                  </span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginTop: '6px', fontFamily: "'Sora', sans-serif" }}>
                  {detailModal.dayData.shift.startTime !== '--:--'
                    ? `${format12Hour(detailModal.dayData.shift.startTime)} – ${format12Hour(detailModal.dayData.shift.endTime)}`
                    : detailModal.dayData.note}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                  {detailModal.dayData.shift.description}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Employee:</span>
                  <strong>{employee?.name} ({employee?.code})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Department:</span>
                  <strong>{employee?.department}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Branch:</span>
                  <strong>{employee?.branch}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Working Hours:</span>
                  <strong>{detailModal.dayData.shift.durationHours} Hours</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span style={{ fontWeight: '700', color: detailModal.dayData.status === 'ASSIGNED' ? '#059669' : '#e11d48' }}>
                    {detailModal.dayData.status}
                  </span>
                </div>
                {detailModal.dayData.holidayName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48' }}>
                    <span>Holiday Name:</span>
                    <strong>{detailModal.dayData.holidayName}</strong>
                  </div>
                )}
                {detailModal.dayData.leaveReason && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4f46e5' }}>
                    <span>Leave Reason:</span>
                    <strong>{detailModal.dayData.leaveReason}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDetailModal({ show: false, dayData: null })}
                  className="btn-outline-indigo"
                  style={{ padding: '7px 18px', fontSize: '12px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL: TOTAL HOLIDAY LIST (POPUP DISPLAY OF ALL HOLIDAYS)
        ═══════════════════════════════════════════════════════════════════ */}
        {showHolidayListModal && (
          <div
            className="emp-modal-overlay"
            style={{
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(4px)',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowHolidayListModal(false);
            }}
          >
            <div
              className="card-modern"
              style={{
                width: '740px',
                maxWidth: '96vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '18px',
                background: '#ffffff',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)',
                overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)',
                  borderBottom: '1px solid #ffe4e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: '#ffe4e6',
                      color: '#e11d48',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(225, 29, 72, 0.15)'
                    }}
                  >
                    <FaGift size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                      Total Holiday List
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Official company holidays • <strong>{sortedHolidays.length}</strong> total declared
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowHolidayListModal(false)}
                  style={{
                    border: 'none',
                    background: '#f1f5f9',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Close Modal"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Quick Summary KPI Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  padding: '16px 24px 8px 24px',
                  background: '#fafafa'
                }}
              >
                <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>TOTAL HOLIDAYS</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#e11d48' }}>{holidayStats.total}</div>
                </div>
                <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>UPCOMING</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0284c7' }}>{holidayStats.upcoming}</div>
                </div>
                <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{monthNames[selectedMonth].toUpperCase()}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{holidayStats.thisMonth}</div>
                </div>
                <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>COMPLETED</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#64748b' }}>{holidayStats.passed}</div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }} />
                  <input
                    type="text"
                    placeholder="Search holiday name, date (e.g. 2026-08), day..."
                    value={holidaySearchQuery}
                    onChange={(e) => setHolidaySearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  {holidaySearchQuery && (
                    <button
                      onClick={() => setHolidaySearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'ALL', label: `All (${holidayStats.total})` },
                    { id: 'UPCOMING', label: `Upcoming (${holidayStats.upcoming})` },
                    { id: 'THIS_MONTH', label: `${monthNames[selectedMonth]} (${holidayStats.thisMonth})` },
                    { id: 'PAST', label: `Past (${holidayStats.passed})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setHolidayFilterTab(tab.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: holidayFilterTab === tab.id ? '1px solid #e11d48' : '1px solid #e2e8f0',
                        background: holidayFilterTab === tab.id ? '#ffe4e6' : '#ffffff',
                        color: holidayFilterTab === tab.id ? '#be123c' : '#475569',
                        fontSize: '11px',
                        fontWeight: holidayFilterTab === tab.id ? '700' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Holiday Table List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', maxHeight: '420px' }}>
                {displayedHolidays.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📅</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>No holidays found</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      {holidaySearchQuery ? 'No holidays matching your search filter.' : 'No holidays have been configured yet.'}
                    </div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginTop: '8px', marginBottom: '8px' }}>
                    <thead>
                      <tr style={{ position: 'sticky', top: 0, background: '#ffffff', zIndex: 1, borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '11px', fontWeight: '700' }}>
                        <th style={{ padding: '10px 8px', width: '36px' }}>#</th>
                        <th style={{ padding: '10px 12px' }}>Holiday Name</th>
                        <th style={{ padding: '10px 12px' }}>Date</th>
                        <th style={{ padding: '10px 12px' }}>Day</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                        <th style={{ padding: '10px 12px' }}>Roster Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedHolidays.map((holiday, idx) => {
                        const dStr = (holiday.date || holiday.holidayDate || holiday.startDate || '').split('T')[0];
                        const dayName = getHolidayDayName(dStr);
                        const status = getHolidayDetailStatus(dStr);
                        const isWeekend = isWeekendHoliday(dStr);

                        return (
                          <tr
                            key={holiday.id || idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: status.isToday ? '#fffbeb' : idx % 2 === 0 ? '#ffffff' : '#fcfcfd'
                            }}
                          >
                            <td style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: '600' }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '6px',
                                    background: '#fee2e2',
                                    color: '#e11d48',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <FaGift size={12} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>
                                    {holiday.name || holiday.holidayName || holiday.title || 'Official Holiday'}
                                  </div>
                                  {holiday.description && (
                                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                                      {holiday.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap' }}>
                              {formatHolidayDate(dStr)}
                            </td>
                            <td style={{ padding: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                              {dayName}
                            </td>
                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: status.bg,
                                  color: status.color
                                }}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                              {isWeekend ? (
                                <span style={{ fontSize: '10.5px', color: '#d97706', background: '#fef3c7', padding: '2px 7px', borderRadius: '4px', fontWeight: '600' }}>
                                  Weekend (Weekly Off)
                                </span>
                              ) : (
                                <span style={{ fontSize: '10.5px', color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: '4px', fontWeight: '600' }}>
                                  Duty Off (Holiday)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '14px 24px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Showing <strong>{displayedHolidays.length}</strong> of <strong>{sortedHolidays.length}</strong> total holidays
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowHolidayListModal(false)}
                    className="btn-gradient"
                    style={{ padding: '7px 20px', fontSize: '12px', fontWeight: '700' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
