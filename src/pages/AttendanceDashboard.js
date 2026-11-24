import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaClock, FaSignInAlt, FaSignOutAlt, FaUserCheck, FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  DEFAULT_SHIFTS,
  getCurrentUserTodayShift,
  evaluateShiftTimingRules,
  calculateShiftAttendance,
  syncAttendanceRecord,
  getUnifiedTodayAttendance,
  getStoredShifts,
  saveStoredShifts,
  getTodayDateYMD,
  format12Hour
} from '../utils/rosterUtils';

const AttendanceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalHalfDay: 0,
    totalLeave: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getAuthConfig = () => {
    const rawToken = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN) || 
                     localStorage.getItem('jwtToken') || 
                     localStorage.getItem('token');
    const token = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : '';
    return {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    };
  };

  const parseAttendanceRecords = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.response)) return data.response;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.response?.response)) return data.response.response;
    if (Array.isArray(data.response?.data)) return data.response.data;
    if (Array.isArray(data.response?.content)) return data.response.content;
    if (Array.isArray(data.data?.response)) return data.data.response;
    if (typeof data.response === 'object' && data.response !== null) {
      const vals = Object.values(data.response);
      if (vals.length > 0 && (vals[0]?.date || vals[0]?.attendanceDate || vals[0]?.punchDate)) return vals;
    }
    return [];
  };

  const normalizeDate = (d) => {
    if (!d) return '';
    if (Array.isArray(d) && d.length >= 3) {
      const y = d[0];
      const m = String(d[1]).padStart(2, '0');
      const day = String(d[2]).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    if (typeof d === 'number') {
      const dateObj = new Date(d);
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
    const s = String(d).trim();
    if (s.includes('T')) return s.split('T')[0];
    if (s.includes(' ')) return s.split(' ')[0];
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(s)) {
      const parts = s.split(/[-/]/);
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return s;
  };

  const normalizeStatus = (status, checkIn, isApproved) => {
    const s = String(status || '').toUpperCase().trim();
    if (s === 'PRESENT' || s === 'HALF_DAY' || s === 'LEAVE' || s === 'ABSENT' || s === 'WEEKEND' || s === 'HOLIDAY') {
      return s;
    }
    if (s === 'APPROVED' || s === 'REGULARIZED' || s === 'APPROVED_PRESENT' || isApproved === true || isApproved === 1) {
      return 'PRESENT';
    }
    if (s === 'APPROVED_LEAVE') return 'LEAVE';
    if (s === 'APPROVED_HALF_DAY') return 'HALF_DAY';
    if (s === 'CHECKED_IN' || s === 'ON_DUTY') return 'PRESENT';
    if (checkIn && checkIn !== '--:--') return 'PRESENT';
    return s || (checkIn ? 'PRESENT' : 'PENDING');
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return null;
    try {
      const timePart = timeString.split('.')[0];
      const [hours, minutes] = timePart.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };

  const mergeClientSiteApprovedAttendance = (baseRecords) => {
    let recordsList = [...(baseRecords || [])];
    try {
      const onSiteStored = JSON.parse(localStorage.getItem('hrms_onsite_attendance') || '[]');
      const clientVerifications = JSON.parse(localStorage.getItem('hrms_client_verifications') || '[]');
      const currentEmp = (localStorage.getItem(STORAGE_KEYS.USERNAME) || localStorage.getItem('username') || '').trim().toLowerCase();
      const currentEmpId = String(localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID) || localStorage.getItem('employeeId') || '').trim();
      let userData = {};
      try { userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}'); } catch {}
      const userEmail = String(userData.email || '').trim().toLowerCase();
      const userName = String(userData.name || '').trim().toLowerCase();
      const userEmpId = String(userData.id || userData.employeeId || '').trim();

      const matchUser = (emp, empId, name) => {
        const e = String(emp || '').trim().toLowerCase();
        const id = String(empId || '').trim();
        const n = String(name || '').trim().toLowerCase();

        if (!e && !id && !n) return true;
        if (currentEmp) {
          if (e === currentEmp) return true;
          if (e && (e.startsWith(currentEmp) || currentEmp.startsWith(e))) return true;
          const currentPrefix = currentEmp.split('@')[0];
          if (currentPrefix && (e === currentPrefix || e.startsWith(currentPrefix) || currentPrefix.startsWith(e))) return true;
        }
        if (userEmail) {
          if (e === userEmail) return true;
          const emailPrefix = userEmail.split('@')[0];
          if (emailPrefix && (e === emailPrefix || e.startsWith(emailPrefix) || emailPrefix.startsWith(e))) return true;
        }
        if (currentEmpId && currentEmpId !== 'null' && currentEmpId !== 'undefined' && id && id === currentEmpId) return true;
        if (userEmpId && userEmpId !== 'null' && userEmpId !== 'undefined' && id && id === userEmpId) return true;
        if (userName && n && (n === userName || n.includes(userName) || userName.includes(n))) return true;
        return false;
      };

      const approvedDatesMap = {};

      // 1. Read from hrms_onsite_attendance
      onSiteStored.forEach(r => {
        if (matchUser(r.employee, r.employeeId, r.employeeName) && r.date) {
          const normD = normalizeDate(r.date);
          approvedDatesMap[normD] = {
            id: r.id || `onsite-${normD}`,
            date: normD,
            status: 'PRESENT',
            checkIn: r.checkIn || '09:00:00',
            checkOut: r.checkOut || '18:00:00',
            workingHours: r.workingHours !== undefined ? Number(r.workingHours) : 9.0,
            onSite: true,
            isApproved: true,
            clientName: r.clientName || 'Client Site Work',
            remarks: r.remarks || 'Client Site Visit Approved by HR'
          };
        }
      });

      // 2. Read from hrms_client_verifications
      clientVerifications.forEach(v => {
        const isApproved = v.status === 'APPROVED' || v.status === 'ON_SITE_APPROVED';
        if (isApproved && matchUser(v.submittedBy, v.employeeId, v.submittedByName)) {
          const vDates = Array.isArray(v.dates) && v.dates.length > 0
            ? v.dates
            : (v.date ? [v.date] : (v.visitDate ? [v.visitDate] : []));
          vDates.forEach(d => {
            const normD = normalizeDate(d);
            if (!approvedDatesMap[normD]) {
              approvedDatesMap[normD] = {
                id: `verification-${v.id}-${normD}`,
                date: normD,
                status: 'PRESENT',
                checkIn: '09:00:00',
                checkOut: '18:00:00',
                workingHours: 9.0,
                onSite: true,
                isApproved: true,
                clientName: v.clientName || 'Client Site Work',
                remarks: v.remarks || 'Client Site Visit Approved by HR'
              };
            }
          });
        }
      });

      // Merge into recordsList
      Object.values(approvedDatesMap).forEach(onSiteRec => {
        const existingIdx = recordsList.findIndex(r => normalizeDate(r.date || r.attendanceDate || r.punchDate) === onSiteRec.date);
        if (existingIdx >= 0) {
          recordsList[existingIdx] = {
            ...recordsList[existingIdx],
            status: 'PRESENT',
            checkIn: recordsList[existingIdx].checkIn || onSiteRec.checkIn,
            checkOut: recordsList[existingIdx].checkOut || onSiteRec.checkOut,
            workingHours: recordsList[existingIdx].workingHours || onSiteRec.workingHours,
            onSite: true,
            isApproved: true,
            clientName: onSiteRec.clientName,
            remarks: onSiteRec.remarks
          };
        } else {
          recordsList.push(onSiteRec);
        }
      });
    } catch (err) {
      console.warn('Error merging client site approved attendance:', err);
    }
    return recordsList;
  };

  const getTodayPunchStorageKey = () => {
    const currentEmpId = String(localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID) || localStorage.getItem(STORAGE_KEYS.USERNAME) || 'user');
    return `hrms_today_punch_${getTodayStr()}_${currentEmpId}`;
  };

  const getSavedTodayPunch = () => {
    try {
      const raw = localStorage.getItem(getTodayPunchStorageKey());
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveTodayPunch = (record) => {
    try {
      localStorage.setItem(getTodayPunchStorageKey(), JSON.stringify(record));
    } catch {}
  };

  const fetchTodayStatus = async () => {
    try {
      let rawRecords = [];
      try {
        const response = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, getAuthConfig());
        rawRecords = parseAttendanceRecords(response.data);
      } catch (err) {
        console.warn('GET_MY_ATTENDANCE error:', err);
      }

      // If /my returned no records, attempt fallback to /dashboard endpoint
      if (rawRecords.length === 0) {
        try {
          const now = new Date();
          const dashRes = await axios.get(API_ENDPOINTS.GET_DASHBOARD, {
            params: { month: now.getMonth() + 1, year: now.getFullYear() },
            ...getAuthConfig()
          });
          rawRecords = parseAttendanceRecords(dashRes.data);
        } catch (e) {}
      }

      // Merge client site approved dates into raw records
      rawRecords = mergeClientSiteApprovedAttendance(rawRecords);

      const todayStr = getTodayStr();
      const unifiedPunch = getUnifiedTodayAttendance();
      const savedPunch = getSavedTodayPunch();
      const todayData = rawRecords.find(record => {
        const rDate = normalizeDate(record.date || record.attendanceDate || record.punchDate || record.checkInDate);
        return rDate === todayStr;
      });

      const checkIn = todayData?.checkIn || todayData?.inTime || todayData?.punchIn || unifiedPunch?.checkIn || savedPunch?.checkIn || null;
      let checkOut = todayData?.checkOut || todayData?.outTime || todayData?.punchOut || unifiedPunch?.checkOut || savedPunch?.checkOut || null;
      const isApproved = todayData?.isApproved || todayData?.approved || todayData?.onSite || unifiedPunch?.onSite || savedPunch?.isApproved;

      const calc = calculateShiftAttendance({
        checkIn,
        checkOut,
        shift: activeShift,
        breakMinutes: activeShift.breakMinutes || 0
      });

      if (checkIn || todayData || unifiedPunch?.checkIn || savedPunch) {
        const recordObj = {
          id: todayData?.id || unifiedPunch?.id || savedPunch?.id || `today-${todayStr}`,
          checkIn,
          checkOut,
          hours: calc.workingHours || todayData?.workingHours || 0,
          workingHours: calc.workingHours || todayData?.workingHours || 0,
          status: calc.status,
          statusLabel: calc.statusLabel,
          shiftCode: activeShift.code,
          shiftName: activeShift.name,
          overtimeHours: calc.overtimeHours,
          isLate: calc.isLate,
          lateMinutes: calc.lateMinutes,
          isEarlyExit: calc.isEarlyExit,
          earlyExitMinutes: calc.earlyExitMinutes,
          date: todayStr,
          leaveType: todayData?.leaveType || null,
          onSite: isApproved || false
        };
        setTodayRecord(recordObj);
        saveTodayPunch(recordObj);
        syncAttendanceRecord(recordObj, false);
      } else {
        setTodayRecord(null);
      }

      const transformed = rawRecords.map(r => {
        const cIn = r.checkIn || r.inTime || r.punchIn;
        const isApp = r.isApproved || r.approved || r.approvalStatus === 'APPROVED' || r.onSite;
        return {
          ...r,
          date: normalizeDate(r.date || r.attendanceDate || r.punchDate || r.checkInDate),
          checkIn: cIn,
          checkOut: r.checkOut || r.outTime || r.punchOut,
          status: normalizeStatus(r.status || r.attendanceStatus, cIn, isApp),
          workingHours: r.workingHours !== undefined ? r.workingHours : (r.hours || 0)
        };
      });

      // Also ensure today's record is present in transformed if punched
      if (checkIn) {
        const tIdx = transformed.findIndex(r => r.date === todayStr);
        const todayTransformed = {
          id: `today-${todayStr}`,
          date: todayStr,
          checkIn,
          checkOut,
          status: calc.status,
          statusLabel: calc.statusLabel,
          workingHours: calc.workingHours || 0,
          shiftCode: activeShift.code,
          shiftName: activeShift.name,
          overtimeHours: calc.overtimeHours || 0,
          onSite: isApproved || false
        };
        if (tIdx >= 0) {
          transformed[tIdx] = { ...transformed[tIdx], ...todayTransformed };
        } else {
          transformed.push(todayTransformed);
        }
      }

      setMonthlyRecords(transformed);
      calculateStats(transformed);
    } catch (error) {
      console.error('Error fetching today status:', error);
      toast.error('Error', 'Failed to fetch attendance status');
    }
  };

  const calculateStats = (records) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const pastRecords = (records || []).filter(record => {
      if (!record || !record.date) return false;
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate <= today && record.status !== 'WEEKEND';
    });

    const present = pastRecords.filter(r => normalizeStatus(r.status, r.checkIn, r.isApproved || r.approved || r.onSite) === 'PRESENT').length;
    const absent = pastRecords.filter(r => normalizeStatus(r.status, r.checkIn, r.isApproved || r.approved || r.onSite) === 'ABSENT').length;
    const halfDay = pastRecords.filter(r => normalizeStatus(r.status, r.checkIn, r.isApproved || r.approved || r.onSite) === 'HALF_DAY').length;
    const leave = pastRecords.filter(r => normalizeStatus(r.status, r.checkIn, r.isApproved || r.approved || r.onSite) === 'LEAVE').length;

    setStats({
      totalPresent: present,
      totalAbsent: absent,
      totalHalfDay: halfDay,
      totalLeave: leave
    });
  };

  const fetchMonthlyStats = async (targetDate) => {
    try {
      const target = targetDate || currentMonth || new Date();
      let records = [];
      try {
        const response = await axios.get(API_ENDPOINTS.GET_DASHBOARD, {
          params: { month: target.getMonth() + 1, year: target.getFullYear() },
          ...getAuthConfig()
        });
        records = parseAttendanceRecords(response.data);
      } catch (e) {
        console.warn('Dashboard stats fetch error:', e);
      }

      // Merge client site approved attendance
      records = mergeClientSiteApprovedAttendance(records);

      if (records.length > 0) {
        const transformed = records.map(r => {
          const checkIn = r.checkIn || r.inTime || r.punchIn;
          const isApproved = r.isApproved || r.approved || r.onSite || r.approvalStatus === 'APPROVED';
          return {
            ...r,
            date: normalizeDate(r.date || r.attendanceDate || r.punchDate || r.checkInDate),
            checkIn,
            checkOut: r.checkOut || r.outTime || r.punchOut,
            status: normalizeStatus(r.status || r.attendanceStatus, checkIn, isApproved),
            workingHours: r.workingHours !== undefined ? r.workingHours : (r.hours || 0)
          };
        });

        setMonthlyRecords(prev => {
          const map = {};
          (prev || []).forEach(item => { if (item.date) map[item.date] = item; });
          transformed.forEach(item => { if (item.date) map[item.date] = { ...map[item.date], ...item }; });
          const merged = Object.values(map);
          calculateStats(merged);
          return merged;
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const [shiftVersion, setShiftVersion] = useState(0);

  const fetchShiftAndPolicyData = useCallback(async () => {
    try {
      // 1. Fetch active policy from backend
      try {
        const polRes = await axios.get(API_ENDPOINTS.GET_ACTIVE_POLICY, getAuthConfig());
        const pol = polRes.data?.response || polRes.data?.data || polRes.data;
        if (pol && pol.shiftStart && pol.shiftEnd) {
          localStorage.setItem('hrms_active_attendance_policy', JSON.stringify(pol));
        }
      } catch (e) {}

      // 2. Fetch all master shifts from backend
      try {
        const shiftsRes = await axios.get(API_ENDPOINTS.GET_SHIFTS, getAuthConfig());
        const sList = shiftsRes.data?.response || shiftsRes.data?.data || shiftsRes.data || [];
        if (Array.isArray(sList) && sList.length > 0) {
          saveStoredShifts(sList, false);
        }
      } catch (e) {}
      setShiftVersion(v => v + 1);
    } catch (err) {
      console.warn('Shift/policy fetch note:', err);
    }
  }, []);

  const shiftsList = useMemo(() => getStoredShifts(), [shiftVersion]);

  // Official assigned shift from roster or active server policy (locked - manual change disallowed)
  const activeShift = useMemo(() => {
    try {
      localStorage.removeItem('hrms_current_user_shift_override');
    } catch {}
    const todayAssigned = getCurrentUserTodayShift();
    if (todayAssigned) return todayAssigned;
    return shiftsList[0] || DEFAULT_SHIFTS[0];
  }, [shiftsList, shiftVersion]);

  const effectiveTime = currentTime;
  const timingRules = evaluateShiftTimingRules(activeShift, effectiveTime);

  const handleCheckIn = async () => {
    if (!timingRules.canCheckIn) {
      toast.error('Check-in Not Allowed Yet', timingRules.checkInMessage);
      return;
    }
    setLoading(true);
    try {
      const shiftCode = activeShift?.code || 'GS';
      try {
        await axios.post(`${API_ENDPOINTS.CHECK_IN}?shiftCode=${shiftCode}`, {}, getAuthConfig());
      } catch (err) {}

      const nowTime = currentTime.toTimeString().split(' ')[0];
      const todayStr = getTodayStr();

      const calc = calculateShiftAttendance({
        checkIn: nowTime,
        checkOut: null,
        shift: activeShift
      });

      const newRecord = {
        id: `today-${todayStr}`,
        date: todayStr,
        checkIn: nowTime,
        checkOut: null,
        status: calc.status,
        statusLabel: calc.statusLabel,
        shiftCode: activeShift.code,
        shiftName: activeShift.name,
        hours: 0,
        workingHours: 0,
        overtimeHours: 0,
        isLate: calc.isLate,
        lateMinutes: calc.lateMinutes
      };

      setTodayRecord(newRecord);
      saveTodayPunch(newRecord);
      syncAttendanceRecord(newRecord, true);

      const lateNotice = calc.isLate ? ` (Late: ${calc.lateMinutes} mins)` : ' (On-Time)';
      toast.success('Database Synced', `Checked in successfully for ${activeShift.name}!${lateNotice}`);
      await Promise.all([fetchTodayStatus(), fetchMonthlyStats(currentMonth)]);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Check-in failed';
      toast.error('Check-in Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!timingRules.canCheckOut) {
      toast.error('Checkout Restricted by Shift Policy', timingRules.checkOutMessage);
      return;
    }
    setLoading(true);
    try {
      const shiftCode = activeShift?.code || 'GS';
      try {
        await axios.post(`${API_ENDPOINTS.CHECK_OUT}?shiftCode=${shiftCode}`, {}, getAuthConfig());
      } catch (err) {}

      const nowTime = currentTime.toTimeString().split(' ')[0];
      const todayStr = getTodayStr();
      const inTime = todayRecord?.checkIn || activeShift?.startTime || '09:00:00';

      const calc = calculateShiftAttendance({
        checkIn: inTime,
        checkOut: nowTime,
        shift: activeShift,
        breakMinutes: activeShift.breakMinutes || 0
      });

      const updatedRecord = {
        ...(todayRecord || {}),
        id: todayRecord?.id || `today-${todayStr}`,
        date: todayStr,
        checkIn: inTime,
        checkOut: nowTime,
        hours: calc.workingHours,
        workingHours: calc.workingHours,
        status: calc.status,
        statusLabel: calc.statusLabel,
        overtimeHours: calc.overtimeHours,
        isEarlyExit: calc.isEarlyExit,
        earlyExitMinutes: calc.earlyExitMinutes,
        isLate: calc.isLate,
        lateMinutes: calc.lateMinutes,
        shiftCode: activeShift.code,
        shiftName: activeShift.name
      };

      setTodayRecord(updatedRecord);
      saveTodayPunch(updatedRecord);
      syncAttendanceRecord(updatedRecord, true);

      const statusLabel = calc.status === 'HALF_DAY' ? 'Half Day' : 'Full Day';
      const otNotice = calc.overtimeHours > 0 ? ` (+${calc.overtimeHours}h OT)` : '';
      toast.success('Database Synced', `Checked out successfully! Total worked: ${calc.workingHours} hrs (${statusLabel})${otNotice}.`);
      await Promise.all([fetchTodayStatus(), fetchMonthlyStats(currentMonth)]);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Check-out failed';
      if (message.toLowerCase().includes('check-in not found')) {
        toast.error('Check-out Failed', 'You need to check in first before checking out');
      } else if (message.toLowerCase().includes('already checked out')) {
        toast.error('Check-out Failed', 'You have already checked out for today');
      } else {
        toast.error('Check-out Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchMonthlyStats(currentMonth);
    fetchShiftAndPolicyData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const handleVerificationSync = () => {
      fetchTodayStatus();
      fetchMonthlyStats(currentMonth);
    };

    const handleShiftUpdated = () => {
      setShiftVersion(v => v + 1);
    };

    window.addEventListener('hrms_client_verification_updated', handleVerificationSync);
    window.addEventListener('hrms_attendance_updated', handleVerificationSync);
    window.addEventListener('hrms_today_punches_updated', handleVerificationSync);
    window.addEventListener('hrms_shifts_updated', handleShiftUpdated);
    window.addEventListener('hrms_active_policy_updated', handleShiftUpdated);
    window.addEventListener('storage', handleVerificationSync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('hrms_client_verification_updated', handleVerificationSync);
      window.removeEventListener('hrms_attendance_updated', handleVerificationSync);
      window.removeEventListener('hrms_today_punches_updated', handleVerificationSync);
      window.removeEventListener('hrms_shifts_updated', handleShiftUpdated);
      window.removeEventListener('hrms_active_policy_updated', handleShiftUpdated);
      window.removeEventListener('storage', handleVerificationSync);
    };
  }, [currentMonth, fetchShiftAndPolicyData]);

  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = todayRecord?.checkOut !== null && todayRecord?.checkOut !== undefined;
  const isWeekend = todayRecord?.status === 'WEEKEND';
  const isOnLeave = todayRecord?.status === 'LEAVE';
  const canCheckIn = !isCheckedIn && !isCheckedOut && !isWeekend && !isOnLeave && timingRules.canCheckIn;
  const canCheckOut = isCheckedIn && !isCheckedOut && !isWeekend && timingRules.canCheckOut;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'success';
      case 'HALF_DAY': return 'warning';
      case 'ABSENT': return 'danger';
      case 'LEAVE': return 'info';
      case 'WEEKEND': return 'secondary';
      default: return 'info';
    }
  };

  const getStatusText = (record) => {
    if (!record) return 'PENDING';
    if (record.status === 'LEAVE' && record.leaveType) {
      return `${record.status} (${record.leaveType})`;
    }
    if (record.status === 'HALF_DAY') {
      return 'HALF DAY (Partial Attendance)';
    }
    if (record.status === 'PRESENT' && record.checkOut) {
      return 'PRESENT (Full Day Shift)';
    }
    if (record.status === 'PRESENT' && !record.checkOut) {
      return 'ON DUTY (Checked In)';
    }
    return record.status || 'PENDING';
  };

  // Calendar generation
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getAttendanceForDate = (dateStr) => {
    const target = normalizeDate(dateStr);
    return monthlyRecords.find(record => normalizeDate(record.date) === target);
  };

  const isFutureDate = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const getDateStatusClass = (dateStr) => {
    if (isFutureDate(dateStr)) return '';
    const record = getAttendanceForDate(dateStr);
    if (!record) return '';
    const status = normalizeStatus(record.status, record.checkIn, record.isApproved || record.onSite);
    switch(status) {
      case 'PRESENT': return 'calendar-day-present';
      case 'ABSENT': return 'calendar-day-absent';
      case 'LEAVE': return 'calendar-day-leave';
      case 'WEEKEND': return 'calendar-day-weekend';
      case 'HALF_DAY': return 'calendar-day-halfday';
      case 'HOLIDAY': return 'calendar-day-holiday';  
      default: return '';
    }
  };

  const getStatusTooltip = (dateStr) => {
    if (isFutureDate(dateStr)) return 'Future date - No data yet';
    const record = getAttendanceForDate(dateStr);
    if (!record) return 'No record';
    if (record.onSite) {
      return `PRESENT (Client Site Approved: ${record.clientName || 'On-Site'}) - ${(record.workingHours || 9).toFixed(1)} hrs`;
    }
    if (record.status === 'LEAVE' && record.leaveType) {
      return `${record.status} (${record.leaveType})`;
    }
    if (record.workingHours) {
      return `${record.status} - ${record.workingHours.toFixed(1)} hrs`;
    }
    return record.status;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = getTodayStr();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === today;
      const statusClass = getDateStatusClass(dateStr);
      const tooltip = getStatusTooltip(dateStr);
      const isFuture = isFutureDate(dateStr);

      days.push(
        <div
          key={day}
          className={`calendar-day ${statusClass} ${isToday ? 'calendar-day-today' : ''} ${isFuture ? 'calendar-day-future' : ''}`}
          title={tooltip}
        >
          <span className="calendar-day-number">{day}</span>
          {statusClass && !isFuture && <span className="calendar-day-indicator"></span>}
        </div>
      );
    }
    return days;
  };

  const changeMonth = (increment) => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1);
    setCurrentMonth(nextMonth);
    fetchMonthlyStats(nextMonth);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <ToastContainer />
      <div className="attendance-root" style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {loading && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Processing..." />
          </div>
        )}

        {/* Header */}
        <div className="attendance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Attendance Dashboard</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Track your daily attendance and view statistics</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <FaCalendarAlt style={{ color: '#6366f1' }} />
              <span style={{ fontWeight: '700', color: '#1e293b' }}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: activeShift.bgColor || '#eff6ff', border: `1px solid ${activeShift.borderColor || '#bfdbfe'}`, fontSize: '13px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeShift.color || '#3b82f6', display: 'inline-block' }}></span>
              <span style={{ fontWeight: '700', color: activeShift.color || '#1d4ed8' }}>
                Today's Shift: {activeShift.name} ({format12Hour(activeShift.startTime)} – {format12Hour(activeShift.endTime)})
              </span>
            </div>
          </div>
        </div>

        {/* ── Today's Check In / Check Out Section ── */}
        <div className="card-modern" style={{ marginBottom: '20px', borderRadius: '16px', border: '1px solid var(--border-light, #e2e8f0)', padding: '16px 20px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '4px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
                <strong style={{ color: 'var(--text-primary, #0f172a)' }}>Today:</strong> {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 6px 0', color: 'var(--text-primary, #0f172a)', fontFamily: "'Sora', sans-serif" }}>
                Today's Scheduled Shift: <span style={{ color: activeShift.color || '#2563eb' }}>{activeShift.name}</span> ({format12Hour(activeShift.startTime)} – {format12Hour(activeShift.endTime)})
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  background: activeShift.bgColor || '#eff6ff',
                  color: activeShift.color || '#2563eb',
                  border: `1px solid ${activeShift.borderColor || '#bfdbfe'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FaClock size={11} />
                  {activeShift.code} • {activeShift.name} ({activeShift.durationHours}h Duration · Grace: {activeShift.graceMinutes || 10}m)
                </span>
                <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '12px', marginLeft: '6px' }}>
                  Current Time: <strong style={{ color: 'var(--accent-indigo, #6366f1)', fontSize: '13px' }}>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* Check In Button */}
              <button
                onClick={handleCheckIn}
                disabled={loading || !canCheckIn || isCheckedIn || isCheckedOut}
                className={canCheckIn && !isCheckedIn && !isCheckedOut ? 'btn-gradient' : 'btn-outline-indigo'}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: (isCheckedIn || isCheckedOut) ? 0.9 : canCheckIn ? 1 : 0.55,
                  cursor: canCheckIn && !isCheckedIn && !isCheckedOut ? 'pointer' : 'default',
                  border: isCheckedIn || isCheckedOut ? '1px solid #a7f3d0' : undefined,
                  background: isCheckedIn || isCheckedOut ? '#ecfdf5' : undefined,
                  color: isCheckedIn || isCheckedOut ? '#065f46' : undefined
                }}
                title={!timingRules.canCheckIn && !isCheckedIn ? timingRules.checkInMessage : 'Check In'}
              >
                {isCheckedIn || isCheckedOut ? (
                  <>
                    <FaCheckCircle size={12} color="#10b981" />
                    Checked In ({formatTime(todayRecord?.checkIn)})
                  </>
                ) : (
                  <>
                    <FaSignInAlt size={12} />
                    Check In
                  </>
                )}
              </button>

              {/* Check Out Button */}
              <button
                onClick={handleCheckOut}
                disabled={loading || !canCheckOut || isCheckedOut}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  color: '#fff',
                  background: isCheckedOut
                    ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    : canCheckOut
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : '#cbd5e1',
                  opacity: (canCheckOut || isCheckedOut) ? 1 : 0.65,
                  cursor: canCheckOut && !isCheckedOut ? 'pointer' : 'default',
                  boxShadow: canCheckOut ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                }}
                title={isCheckedOut ? 'Shift completed & checked out for today' : !timingRules.canCheckOut && isCheckedIn ? timingRules.checkOutMessage : 'Check Out'}
              >
                {isCheckedOut ? (
                  <>
                    <FaCheckCircle size={12} />
                    Checked Out ({formatTime(todayRecord?.checkOut)}) • {todayRecord?.hours > 0 ? todayRecord.hours.toFixed(1) : '0.0'} hrs
                  </>
                ) : (
                  <>
                    <FaSignOutAlt size={12} />
                    Check Out
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Today's Status Details */}
          {todayRecord && todayRecord.status !== 'WEEKEND' && (
            <div style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-light, #f1f5f9)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '10px'
            }}>
              <div>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Check In</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary, #0f172a)', fontFamily: "'Sora', sans-serif" }}>
                  {todayRecord.checkIn ? formatTime(todayRecord.checkIn) : '--:--'}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Check Out</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary, #0f172a)', fontFamily: "'Sora', sans-serif" }}>
                  {todayRecord.checkOut ? formatTime(todayRecord.checkOut) : '--:--'}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Working Hours</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary, #0f172a)', fontFamily: "'Sora', sans-serif" }}>
                  {todayRecord.hours > 0 ? todayRecord.hours.toFixed(1) : '0.0'} hrs
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Status</p>
                <span className={`badge-${getStatusColor(todayRecord.status)}`} style={{ fontSize: '11px', padding: '3px 8px', fontFamily: "'DM Sans', sans-serif" }}>
                  {todayRecord.statusLabel || getStatusText(todayRecord)}
                </span>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Shift</p>
                <p style={{ fontSize: '13px', fontWeight: '700', color: activeShift.color || '#3b82f6', fontFamily: "'Sora', sans-serif" }}>
                  {todayRecord.shiftCode || activeShift.code}
                </p>
              </div>
              {todayRecord.overtimeHours > 0 && (
                <div>
                  <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Overtime</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', fontFamily: "'Sora', sans-serif" }}>
                    +{todayRecord.overtimeHours.toFixed(1)} hrs
                  </p>
                </div>
              )}
              {todayRecord.isLate && (
                <div>
                  <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '10px', marginBottom: '2px', fontFamily: "'DM Sans', sans-serif" }}>Late Mark</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', fontFamily: "'Sora', sans-serif" }}>
                    {todayRecord.lateMinutes}m late
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards - Centered (same as other dashboards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* Present Days */}
          <div className="stat-card attendance-stat" style={{
            padding: '20px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            transition: 'all 0.2s'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              color: '#10b981',
              fontSize: 20
            }}>
              <FaUserCheck />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Present Days</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981', fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.totalPresent}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This month</div>
          </div>

          {/* Half Days */}
          <div className="stat-card attendance-stat" style={{
            padding: '20px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              color: '#f59e0b',
              fontSize: 20
            }}>
              <FaClock />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Half Days</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.totalHalfDay}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This month</div>
          </div>

          {/* Leave Days */}
          <div className="stat-card attendance-stat" style={{
            padding: '20px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              color: '#8b5cf6',
              fontSize: 20
            }}>
              <FaCalendarAlt />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Leave Days</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.totalLeave}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This month</div>
          </div>

          {/* Absent Days */}
          <div className="stat-card attendance-stat" style={{
            padding: '20px 16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              color: '#ef4444',
              fontSize: 20
            }}>
              <FaCalendarAlt />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Absent Days</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444', fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.totalAbsent}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>This month</div>
          </div>
        </div>

        {/* Modern Calendar Component */}
        <div className="attendance-table-card" style={{ overflow: 'visible' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>
                Attendance Calendar
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => changeMonth(-1)} className="calendar-nav-btn" style={{ padding: '6px 10px', fontFamily: "'DM Sans', sans-serif" }}>
                <FaChevronLeft size={12} />
              </button>
              <button onClick={() => changeMonth(1)} className="calendar-nav-btn" style={{ padding: '6px 10px', fontFamily: "'DM Sans', sans-serif" }}>
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <div className="calendar-grid">
              {weekDays.map(day => (
                <div key={day} className="calendar-weekday" style={{ fontSize: '13px', padding: '8px', fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{day}</div>
              ))}
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="calendar-legend" style={{ gap: '12px', paddingTop: '16px', fontFamily: "'DM Sans', sans-serif" }}>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color present-color"></span>
                <span>Present</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color absent-color"></span>
                <span>Absent</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color leave-color"></span>
                <span>Leave</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color weekend-color"></span>
                <span>Weekend</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color halfday-color"></span>
                <span>Half Day</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color today-color"></span>
                <span>Today</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color future-color"></span>
                <span>Future Date</span>
              </div>
              <div className="legend-item" style={{ fontSize: '12px' }}>
                <span className="legend-color holiday-color"></span>
                <span>Holiday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceDashboard;