import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaUmbrellaBeach, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ShiftPunchWidget from '../components/ShiftPunchWidget';
import {
  getUnifiedTodayAttendance,
  getCurrentUserAttendanceLogs,
  filterBackendRecordsForCurrentEmployee,
  recordMatchesCurrentEmployee,
  calculateShiftAttendance,
  getShiftByCode,
  format12Hour
} from '../utils/rosterUtils';

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

const normalizeStatus = (status, checkIn) => {
  const s = String(status || '').toUpperCase().trim();
  if (s === 'PRESENT' || s === 'HALF_DAY' || s === 'LEAVE' || s === 'ABSENT' || s === 'WEEKEND' || s === 'HOLIDAY') {
    return s;
  }
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

const MyAttendance = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ── Employee Joining Date Detection ──────────────────────────
  const [joiningDate, setJoiningDate] = useState(() => {
    try {
      const direct = localStorage.getItem('employee_joining_date') || 
                     localStorage.getItem('joiningDate') || 
                     localStorage.getItem('dateOfJoining');
      if (direct) return normalizeDate(direct);

      const uData = JSON.parse(localStorage.getItem('userData') || '{}');
      const uDate = uData.joiningDate || uData.dateOfJoining || uData.doj || uData.appointment?.joiningDate;
      if (uDate) return normalizeDate(uDate);
    } catch {}
    return null;
  });

  useEffect(() => {
    const fetchEmployeeJoiningDate = async () => {
      try {
        const empId = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID);
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (!empId || !token) return;
        const res = await axios.get(`${BASE_URL}/api/employee-profile/full/${empId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profile = res.data?.response;
        const doj = profile?.joiningDate || profile?.dateOfJoining || profile?.appointment?.joiningDate;
        if (doj) {
          const cleanDoj = normalizeDate(doj);
          setJoiningDate(cleanDoj);
          localStorage.setItem('employee_joining_date', cleanDoj);
        }
      } catch (err) {}
    };
    fetchEmployeeJoiningDate();
  }, []);

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
    if (Array.isArray(data.response?.response)) return data.response.response;
    if (Array.isArray(data.response?.data)) return data.response.data;
    if (Array.isArray(data.response?.content)) return data.response.content;
    if (typeof data.response === 'object' && data.response !== null) {
      const vals = Object.values(data.response);
      if (vals.length > 0 && (vals[0]?.date || vals[0]?.attendanceDate)) return vals;
    }
    return [];
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
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

  const mergeOnSiteAttendance = (baseRecords) => {
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

        if (!e && !id && !n) return false;
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
      onSiteStored.forEach(r => {
        if (matchUser(r.employee, r.employeeId, r.employeeName) && r.date) {
          const normD = normalizeDate(r.date);
          approvedDatesMap[normD] = {
            ...r,
            date: normD
          };
        }
      });

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
                onSite: true,
                workingHours: 9,
                checkIn: '09:00:00',
                checkOut: '18:00:00',
                clientName: v.clientName,
              };
            }
          });
        }
      });

      Object.values(approvedDatesMap).forEach(onSiteRec => {
        const existingIdx = recordsList.findIndex(r => r.date === onSiteRec.date);
        if (existingIdx >= 0) {
          recordsList[existingIdx].status = 'PRESENT';
          recordsList[existingIdx].workingHours = recordsList[existingIdx].workingHours || 9;
          recordsList[existingIdx].checkIn = recordsList[existingIdx].checkIn || '09:00:00';
          recordsList[existingIdx].checkOut = recordsList[existingIdx].checkOut || '18:00:00';
          recordsList[existingIdx].onSite = true;
          recordsList[existingIdx].clientName = onSiteRec.clientName;
        } else {
          recordsList.push({
            id: onSiteRec.id || `onsite-${onSiteRec.date}`,
            date: onSiteRec.date,
            checkIn: onSiteRec.checkIn || '09:00:00',
            checkOut: onSiteRec.checkOut || '18:00:00',
            workingHours: onSiteRec.workingHours || 9,
            status: 'PRESENT',
            onSite: true,
            clientName: onSiteRec.clientName,
          });
        }
      });
    } catch (err) {}
    return recordsList;
  };

  const mergeLocalAndShiftAttendance = (baseRecords) => {
    let list = [...(baseRecords || [])];
    try {
      // 1. Merge today's unified punch (scoped to current employee)
      const todayRecord = getUnifiedTodayAttendance(user);
      if (todayRecord && todayRecord.date && (todayRecord.checkIn || todayRecord.checkOut)) {
        const normToday = normalizeDate(todayRecord.date);
        const existingIdx = list.findIndex(r => normalizeDate(r.date || r.attendanceDate || r.punchDate || r.checkInDate) === normToday);
        const shiftObj = getShiftByCode(todayRecord.shiftCode || 'GS');
        const calc = calculateShiftAttendance({
          checkIn: todayRecord.checkIn,
          checkOut: todayRecord.checkOut,
          shift: shiftObj,
          breakMinutes: shiftObj.breakMinutes || 0
        });

        const todayMerged = {
          id: `today-${normToday}`,
          date: normToday,
          checkIn: todayRecord.checkIn,
          checkOut: todayRecord.checkOut,
          hours: calc.workingHours || todayRecord.workingHours || 0,
          workingHours: calc.workingHours || todayRecord.workingHours || 0,
          status: calc.status,
          statusLabel: calc.statusLabel,
          shiftCode: todayRecord.shiftCode || shiftObj.code,
          shiftName: todayRecord.shiftName || shiftObj.name,
          overtimeHours: calc.overtimeHours || todayRecord.overtimeHours || 0,
          isLate: calc.isLate,
          lateMinutes: calc.lateMinutes,
          isEarlyExit: calc.isEarlyExit,
          earlyExitMinutes: calc.earlyExitMinutes
        };

        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...todayMerged };
        } else {
          list.push(todayMerged);
        }
      }

      // 2. Merge local attendance logs (strictly scoped to current employee)
      const logs = getCurrentUserAttendanceLogs(user);
      logs.forEach(logRec => {
        if (logRec && logRec.date && (logRec.checkIn || logRec.checkOut)) {
          const normD = normalizeDate(logRec.date);
          const exIdx = list.findIndex(r => normalizeDate(r.date || r.attendanceDate || r.punchDate || r.checkInDate) === normD);
          if (exIdx === -1) {
            const shiftObj = getShiftByCode(logRec.shiftCode || 'GS');
            const calc = calculateShiftAttendance({
              checkIn: logRec.checkIn,
              checkOut: logRec.checkOut,
              shift: shiftObj,
              breakMinutes: shiftObj.breakMinutes || 0
            });
            list.push({
              id: `log-${normD}`,
              date: normD,
              checkIn: logRec.checkIn,
              checkOut: logRec.checkOut,
              hours: calc.workingHours || logRec.workingHours || 0,
              workingHours: calc.workingHours || logRec.workingHours || 0,
              status: calc.status,
              statusLabel: calc.statusLabel,
              shiftCode: logRec.shiftCode || shiftObj.code,
              shiftName: logRec.shiftName || shiftObj.name,
              overtimeHours: calc.overtimeHours || 0,
              isLate: calc.isLate,
              lateMinutes: calc.lateMinutes
            });
          }
        }
      });
    } catch (e) {
      console.warn('Error merging local shift attendance:', e);
    }
    return list;
  };

  const fetchAttendance = async (showRefreshMessage = false) => {
    if (showRefreshMessage) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      let rawRecords = [];
      try {
        const response = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, getAuthConfig());
        rawRecords = filterBackendRecordsForCurrentEmployee(parseAttendanceRecords(response.data), user);
      } catch (err) {
        console.warn('GET_MY_ATTENDANCE failed, attempting dashboard fallback:', err);
      }

      // If /my returned no records, attempt fallback to /dashboard endpoint
      if (rawRecords.length === 0) {
        try {
          const dashRes = await axios.get(API_ENDPOINTS.GET_DASHBOARD, {
            params: { month: selectedMonth + 1, year: selectedYear },
            ...getAuthConfig()
          });
          rawRecords = filterBackendRecordsForCurrentEmployee(parseAttendanceRecords(dashRes.data), user);
        } catch (e) {
          // ignore
        }
      }

      const attendanceData = mergeLocalAndShiftAttendance(mergeOnSiteAttendance(rawRecords));
      
      const transformedData = attendanceData.map(record => {
        const rawDate = record.date || record.attendanceDate || record.punchDate || record.checkInDate;
        const normDate = normalizeDate(rawDate);
        const checkIn = record.checkIn || record.inTime || record.punchIn;
        const checkOut = record.checkOut || record.outTime || record.punchOut;
        const status = normalizeStatus(record.status || record.attendanceStatus, checkIn);

        return {
          id: record.id,
          date: normDate,
          checkIn,
          checkOut,
          hours: record.workingHours !== undefined ? record.workingHours : (record.hours || 0),
          status,
          statusLabel: record.statusLabel,
          shiftCode: record.shiftCode || 'GS',
          shiftName: record.shiftName || 'General Shift',
          overtimeHours: record.overtimeHours || record.overtime || 0,
          isLate: record.isLate,
          lateMinutes: record.lateMinutes,
          leaveType: record.leaveType || null,
          employeeName: record.employeeName || record.name,
          onSite: record.onSite,
          clientName: record.clientName
        };
      });
      
      setRecords(transformedData);
      
      if (showRefreshMessage) {
        toast.success('Success', 'Attendance records refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      const message = error.response?.data?.message || 'Failed to fetch attendance records';
      toast.error('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();

    const handleSync = (e) => {
      if (e?.detail && !recordMatchesCurrentEmployee(e.detail, user)) return;
      fetchAttendance();
    };

    window.addEventListener('hrms_client_verification_updated', handleSync);
    window.addEventListener('hrms_attendance_updated', handleSync);
    window.addEventListener('hrms_today_punches_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('hrms_client_verification_updated', handleSync);
      window.removeEventListener('hrms_attendance_updated', handleSync);
      window.removeEventListener('hrms_today_punches_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [user]);

  // Sync current month with selected month/year
  useEffect(() => {
    setCurrentMonth(new Date(selectedYear, selectedMonth, 1));
  }, [selectedMonth, selectedYear]);

  const getStatusText = (record) => {
    if (record.status === 'LEAVE' && record.leaveType) {
      return `${record.status} (${record.leaveType})`;
    }
    return record.status || 'PENDING';
  };

  // Calendar generation logic
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getAttendanceForDate = (dateStr) => {
    const target = normalizeDate(dateStr);
    return records.find(record => normalizeDate(record.date) === target);
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
    const hasWorked = record && (
      record.status === 'PRESENT' || 
      record.status === 'HALF_DAY' || 
      record.status === 'LEAVE' || 
      record.onSite ||
      Boolean(record.checkIn)
    );

    // If date is before joining date AND record is not marked present/leave, show as blank
    if (joiningDate && normalizeDate(dateStr) < normalizeDate(joiningDate) && !hasWorked) {
      return '';
    }
    
    if (!record) return '';
    
    const status = normalizeStatus(record.status, record.checkIn);

    // Apply status filter to calendar view
    if (statusFilter !== 'all') {
      if (status.toLowerCase() !== statusFilter.toLowerCase()) {
        return '';
      }
    }
    
    switch(status) {
      case 'PRESENT': return 'calendar-day-present';
      case 'ABSENT': return 'calendar-day-absent';
      case 'LEAVE': return 'calendar-day-leave';
      case 'WEEKEND': return 'calendar-day-weekend';
      case 'HALF_DAY': return 'calendar-day-halfday';
      default: return '';
    }
  };

  const getStatusTooltip = (dateStr) => {
    const record = getAttendanceForDate(dateStr);
    const hasWorked = record && (
      record.status === 'PRESENT' || 
      record.status === 'HALF_DAY' || 
      record.status === 'LEAVE' || 
      record.onSite ||
      Boolean(record.checkIn)
    );
    if (joiningDate && normalizeDate(dateStr) < normalizeDate(joiningDate) && !hasWorked) {
      return 'Not Joined Yet';
    }
    if (isFutureDate(dateStr)) return 'Future date - No data yet';
    if (!record) return 'No record';
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
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add cells for each day of the month
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
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1);
    setCurrentMonth(newDate);
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate summary stats for the selected month/year
  const monthRecords = records.filter(record => {
    if (!record || !record.date) return false;
    const norm = normalizeDate(record.date);
    if (!norm) return false;
    const parts = norm.split('-');
    if (parts.length >= 2) {
      return (parseInt(parts[1], 10) - 1) === selectedMonth && parseInt(parts[0], 10) === selectedYear;
    }
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
  });
  
  // Calculate attendance metrics: keep present/halfday/leave records, and exclude pre-joining absents
  const activeRecords = monthRecords.filter(r => {
    if (!joiningDate) return true;
    const normDate = normalizeDate(r.date);
    const normJoin = normalizeDate(joiningDate);
    const status = normalizeStatus(r.status, r.checkIn);
    if (status === 'PRESENT' || status === 'HALF_DAY' || status === 'LEAVE' || r.onSite || r.checkIn) return true;
    return normDate >= normJoin;
  });
  const workingDaysRecords = activeRecords.filter(r => normalizeStatus(r.status, r.checkIn) !== 'WEEKEND');
  
  const summary = {
    total: workingDaysRecords.length,
    present: workingDaysRecords.filter(r => normalizeStatus(r.status, r.checkIn) === 'PRESENT').length,
    absent: workingDaysRecords.filter(r => normalizeStatus(r.status, r.checkIn) === 'ABSENT').length,
    halfDay: workingDaysRecords.filter(r => normalizeStatus(r.status, r.checkIn) === 'HALF_DAY').length,
    leave: workingDaysRecords.filter(r => normalizeStatus(r.status, r.checkIn) === 'LEAVE').length,
    totalHours: workingDaysRecords.reduce((sum, r) => sum + (r.hours || 0), 0).toFixed(1)
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <>
      <ToastContainer />
      <div className="attendance-root">
        {refreshing && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Refreshing records..." />
          </div>
        )}

        <div className="attendance-header">
          <h1>My Attendance History</h1>
          <p>View and track all your attendance records and monthly calendar</p>
        </div>

        {/* ── Shift Punch Widget ── */}
        <ShiftPunchWidget user={user} embeddedMode={true} />

        {/* Summary Cards - Compact */}
        <div className="summary-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaCalendarAlt size={11} style={{ marginRight: '4px' }} />
              Working Days
            </div>
            <div className="stat-value total" style={{ fontSize: '28px' }}>{summary.total}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>Excluding weekends</div>
          </div>
          
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaCheckCircle size={11} style={{ marginRight: '4px' }} />
              Present
            </div>
            <div className="stat-value present" style={{ fontSize: '28px' }}>{summary.present}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>
              {summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : 0}% rate
            </div>
          </div>
          
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaClock size={11} style={{ marginRight: '4px' }} />
              Half Day
            </div>
            <div className="stat-value late" style={{ fontSize: '28px' }}>{summary.halfDay}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>Partial attendance</div>
          </div>

          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaUmbrellaBeach size={11} style={{ marginRight: '4px' }} />
              Leave
            </div>
            <div className="stat-value" style={{ fontSize: '28px', color: '#8b5cf6' }}>{summary.leave}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>Approved leaves</div>
          </div>
          
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaTimesCircle size={11} style={{ marginRight: '4px' }} />
              Absent
            </div>
            <div className="stat-value absent" style={{ fontSize: '28px' }}>{summary.absent}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>No attendance</div>
          </div>
          
          <div className="stat-card attendance-stat" style={{ padding: '14px' }}>
            <div className="stat-label" style={{ fontSize: '11px' }}>
              <FaClock size={11} style={{ marginRight: '4px' }} />
              Total Hours
            </div>
            <div className="stat-value hours" style={{ fontSize: '28px' }}>{summary.totalHours}</div>
            <div className="stat-trend" style={{ fontSize: '10px' }}>Hours worked</div>
          </div>
        </div>

        {/* Filters - Above Calendar */}
        <div className="filter-card" style={{ marginBottom: '24px' }}>
          <div className="filter-group">
            <div className="filter-item">
              <label><FaCalendarAlt size={12} /> Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="filter-select"
              >
                {months.map(month => (
                  <option key={month} value={month}>
                    {new Date(2000, month, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <label><FaCalendarAlt size={12} /> Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="filter-select"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <label><FaEye size={12} /> Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
                <option value="absent">Absent</option>
                <option value="weekend">Weekend</option>
              </select>
            </div>
            
            <div className="filter-item">
              <button onClick={() => fetchAttendance(true)} className="refresh-btn" disabled={refreshing}>
                <FaSearch size={14} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Modern Calendar Component */}
        <div className="attendance-table-card" style={{ overflow: 'visible', marginBottom: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Attendance Calendar
                {statusFilter !== 'all' && (
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    marginLeft: '10px',
                    padding: '2px 8px',
                    background: 'var(--accent-indigo-pale)',
                    borderRadius: '20px',
                    color: 'var(--accent-indigo)'
                  }}>
                    Filtered: {statusFilter}
                  </span>
                )}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => changeMonth(-1)} className="calendar-nav-btn" style={{ padding: '6px 10px' }}>
                <FaChevronLeft size={12} />
              </button>
              <button onClick={() => changeMonth(1)} className="calendar-nav-btn" style={{ padding: '6px 10px' }}>
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
          
          <div style={{ padding: '20px' }}>
            {loading ? (
              <div className="attendance-loading" style={{ padding: '40px' }}>
                <div className="loading-spinner"></div>
                <p>Loading attendance data...</p>
              </div>
            ) : (
              <>
                <div className="calendar-grid">
                  {weekDays.map(day => (
                    <div key={day} className="calendar-weekday" style={{ fontSize: '13px', padding: '8px' }}>{day}</div>
                  ))}
                  {renderCalendar()}
                </div>
                
                {/* Legend */}
                <div className="calendar-legend" style={{ gap: '12px', paddingTop: '16px' }}>
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
                </div>

                {/* Filter info message */}
                {statusFilter !== 'all' && (
                  <div style={{
                    marginTop: '20px',
                    padding: '10px 16px',
                    background: 'var(--accent-indigo-pale)',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '12px', color: 'var(--accent-indigo)', margin: 0 }}>
                      🔍 Showing only <strong>{statusFilter}</strong> days in the calendar
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary Footer */}
        {!loading && monthRecords.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Total records for {monthNames[selectedMonth]} {selectedYear}: {monthRecords.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
                {summary.present > 0 && (
                  <span style={{ color: '#10b981' }}>
                    ✅ Present: {summary.present}
                  </span>
                )}
                {summary.halfDay > 0 && (
                  <span style={{ color: '#f59e0b' }}>
                    ⏰ Half Day: {summary.halfDay}
                  </span>
                )}
                {summary.leave > 0 && (
                  <span style={{ color: '#8b5cf6' }}>
                    📅 Leave: {summary.leave}
                  </span>
                )}
                {summary.absent > 0 && (
                  <span style={{ color: '#ef4444' }}>
                    ❌ Absent: {summary.absent}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table Card */}
        <div className="attendance-table-card" style={{ marginTop: '24px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Daily Attendance &amp; Shift Log
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {monthRecords.length} recorded shift{monthRecords.length === 1 ? '' : 's'}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface, #f8fafc)', borderBottom: '1px solid var(--border-light, #e2e8f0)', color: 'var(--text-muted, #64748b)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Shift</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Check In</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Check Out</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Hours</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Overtime</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {monthRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No attendance records for {monthNames[selectedMonth]} {selectedYear}. Use the Check-in button above to clock in!
                    </td>
                  </tr>
                ) : (
                  monthRecords
                    .slice()
                    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                    .map((r, i) => (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {r.date}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {r.shiftCode || 'GS'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: r.checkIn ? '#059669' : '#94a3b8' }}>
                          {r.checkIn ? format12Hour(r.checkIn) : '--:--'}
                          {r.isLate && <span style={{ fontSize: '10px', color: '#dc2626', marginLeft: '4px' }}>({r.lateMinutes}m late)</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: r.checkOut ? '#dc2626' : '#94a3b8' }}>
                          {r.checkOut ? format12Hour(r.checkOut) : '--:--'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {r.hours > 0 ? `${Number(r.hours).toFixed(1)} hrs` : '--'}
                        </td>
                        <td style={{ padding: '12px 16px', color: r.overtimeHours > 0 ? '#10b981' : '#94a3b8', fontWeight: r.overtimeHours > 0 ? '700' : '400' }}>
                          {r.overtimeHours > 0 ? `+${Number(r.overtimeHours).toFixed(1)} hrs` : '0.0 hrs'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: r.status === 'PRESENT' ? '#ecfdf5' : r.status === 'HALF_DAY' ? '#fffbeb' : r.status === 'LEAVE' ? '#f5f3ff' : '#fee2e2',
                            color: r.status === 'PRESENT' ? '#065f46' : r.status === 'HALF_DAY' ? '#92400e' : r.status === 'LEAVE' ? '#5b21b6' : '#991b1b'
                          }}>
                            {r.statusLabel || r.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyAttendance;
