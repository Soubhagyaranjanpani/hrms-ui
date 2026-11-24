import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartPie, FaCalendarAlt, FaTrophy, FaClock, FaCheckCircle, FaTimesCircle, FaUmbrellaBeach, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getUnifiedTodayAttendance,
  calculateShiftAttendance,
  getShiftByCode,
  format12Hour
} from '../utils/rosterUtils';

const AttendanceSummary = () => {
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
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

  const getClientSiteApprovedRecords = () => {
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

      const map = {};

      // 1. From hrms_onsite_attendance
      onSiteStored.forEach(r => {
        if (matchUser(r.employee, r.employeeId, r.employeeName) && r.date) {
          const normD = normalizeDate(r.date);
          map[normD] = {
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

      // 2. From hrms_client_verifications
      clientVerifications.forEach(v => {
        const isApproved = v.status === 'APPROVED' || v.status === 'ON_SITE_APPROVED';
        if (isApproved && matchUser(v.submittedBy, v.employeeId, v.submittedByName)) {
          const vDates = Array.isArray(v.dates) && v.dates.length > 0
            ? v.dates
            : (v.date ? [v.date] : (v.visitDate ? [v.visitDate] : []));
          vDates.forEach(d => {
            const normD = normalizeDate(d);
            if (!map[normD]) {
              map[normD] = {
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

      return Object.values(map);
    } catch (e) {
      console.warn('Error reading approved client site records:', e);
      return [];
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      let basePresent = 0;
      let baseAbsent = 0;
      let baseLeave = 0;
      let baseHalf = 0;
      let baseHours = 0;
      let rawRecords = [];

      try {
        const response = await axios.get(API_ENDPOINTS.GET_SUMMARY, {
          params: { month, year },
          ...getAuthConfig()
        });
        const summaryData = response.data?.response || response.data?.data || response.data;
        if (summaryData) {
          basePresent = Number(summaryData.presentDays || 0);
          baseAbsent = Number(summaryData.absentDays || 0);
          baseLeave = Number(summaryData.leaveDays || 0);
          baseHalf = Number(summaryData.halfDays || 0);
          baseHours = Number(summaryData.totalWorkingHours || 0);
        }
      } catch (err) {
        console.warn('Backend GET_SUMMARY error, computing from client records:', err);
      }

      // Fetch raw records to check which dates are already marked present
      try {
        const myRes = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, getAuthConfig());
        rawRecords = parseAttendanceRecords(myRes.data);
      } catch (e) {}

      if (rawRecords.length === 0) {
        try {
          const dashRes = await axios.get(API_ENDPOINTS.GET_DASHBOARD, {
            params: { month, year },
            ...getAuthConfig()
          });
          rawRecords = parseAttendanceRecords(dashRes.data);
        } catch (e) {}
      }

      // Read client site approved dates for the selected month and year
      const approvedOnSite = getClientSiteApprovedRecords();
      const monthStr = String(month).padStart(2, '0');
      const yearStr = String(year);

      let additionalPresent = 0;
      let additionalHours = 0;

      approvedOnSite.forEach(onSiteRec => {
        const [y, m] = (onSiteRec.date || '').split('-');
        if (y === yearStr && m === monthStr) {
          // Check if already recorded as PRESENT in backend raw records
          const backendRec = rawRecords.find(r => normalizeDate(r.date || r.attendanceDate || r.punchDate) === onSiteRec.date);
          const alreadyPresentInBackend = backendRec && (
            normalizeStatus(backendRec.status || backendRec.attendanceStatus, backendRec.checkIn) === 'PRESENT' ||
            (backendRec.checkIn && backendRec.checkIn !== '--:--')
          );

          if (!alreadyPresentInBackend) {
            additionalPresent += 1;
            additionalHours += (onSiteRec.workingHours !== undefined ? Number(onSiteRec.workingHours) : 9.0);
          }
        }
      });

      // Merge today's unified punch if within selected month/year
      const todayRec = getUnifiedTodayAttendance();
      if (todayRec && todayRec.date && todayRec.checkIn) {
        const [ty, tm] = todayRec.date.split('-');
        if (ty === yearStr && tm === monthStr) {
          const inBackend = rawRecords.find(r => normalizeDate(r.date || r.attendanceDate || r.punchDate) === todayRec.date);
          const alreadyMarked = inBackend && (
            normalizeStatus(inBackend.status || inBackend.attendanceStatus, inBackend.checkIn) === 'PRESENT' ||
            (inBackend.checkIn && inBackend.checkIn !== '--:--')
          );
          if (!alreadyMarked) {
            if (todayRec.status === 'HALF_DAY') {
              baseHalf += 1;
            } else {
              additionalPresent += 1;
            }
            additionalHours += Number(todayRec.workingHours || 0);
          }
        }
      }

      const finalPresent = basePresent + additionalPresent;
      const finalAbsent = Math.max(0, baseAbsent - additionalPresent);
      const finalHours = baseHours + additionalHours;
      const totalDays = finalPresent + finalAbsent + baseLeave + baseHalf;

      setSummary({
        presentDays: finalPresent,
        absentDays: finalAbsent,
        leaveDays: baseLeave,
        halfDays: baseHalf,
        totalWorkingHours: finalHours,
        totalWorkingDays: totalDays
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      const message = error.response?.data?.message || 'Failed to fetch attendance summary';
      toast.error('Error', message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyRecords = async () => {
    try {
      let rawRecords = [];
      try {
        const response = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, getAuthConfig());
        rawRecords = parseAttendanceRecords(response.data);
      } catch (err) {}

      if (rawRecords.length === 0) {
        try {
          const dashRes = await axios.get(API_ENDPOINTS.GET_DASHBOARD, {
            params: { month, year },
            ...getAuthConfig()
          });
          rawRecords = parseAttendanceRecords(dashRes.data);
        } catch (e) {}
      }

      // Merge approved client site records
      const approvedOnSite = getClientSiteApprovedRecords();
      approvedOnSite.forEach(onSiteRec => {
        const existingIdx = rawRecords.findIndex(r => normalizeDate(r.date || r.attendanceDate || r.punchDate) === onSiteRec.date);
        if (existingIdx >= 0) {
          rawRecords[existingIdx] = {
            ...rawRecords[existingIdx],
            status: 'PRESENT',
            checkIn: rawRecords[existingIdx].checkIn || onSiteRec.checkIn,
            checkOut: rawRecords[existingIdx].checkOut || onSiteRec.checkOut,
            workingHours: rawRecords[existingIdx].workingHours || onSiteRec.workingHours,
            onSite: true,
            isApproved: true,
            clientName: onSiteRec.clientName,
            remarks: onSiteRec.remarks
          };
        } else {
          rawRecords.push(onSiteRec);
        }
      });

      // Merge today's unified punch and local logs
      const todayRec = getUnifiedTodayAttendance();
      if (todayRec && todayRec.date && (todayRec.checkIn || todayRec.checkOut)) {
        const normD = normalizeDate(todayRec.date);
        const exIdx = rawRecords.findIndex(r => normalizeDate(r.date || r.attendanceDate || r.punchDate) === normD);
        const todayObj = {
          id: `today-${normD}`,
          date: normD,
          checkIn: todayRec.checkIn,
          checkOut: todayRec.checkOut,
          workingHours: todayRec.workingHours || 0,
          status: todayRec.status || 'PRESENT',
          shiftCode: todayRec.shiftCode || 'GS'
        };
        if (exIdx >= 0) {
          rawRecords[exIdx] = { ...rawRecords[exIdx], ...todayObj };
        } else {
          rawRecords.push(todayObj);
        }
      }

      const logs = JSON.parse(localStorage.getItem('hrms_attendance_logs') || '[]');
      logs.forEach(logRec => {
        if (logRec && logRec.date && (logRec.checkIn || logRec.checkOut)) {
          const normD = normalizeDate(logRec.date);
          const exIdx = rawRecords.findIndex(r => normalizeDate(r.date || r.attendanceDate || r.punchDate) === normD);
          if (exIdx === -1) {
            rawRecords.push({
              id: `log-${normD}`,
              date: normD,
              checkIn: logRec.checkIn,
              checkOut: logRec.checkOut,
              workingHours: logRec.workingHours || 0,
              status: logRec.status || 'PRESENT',
              shiftCode: logRec.shiftCode || 'GS'
            });
          }
        }
      });

      const transformed = rawRecords.map(r => {
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

      setMonthlyRecords(transformed);
    } catch (error) {
      console.error('Error fetching monthly records:', error);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchMonthlyRecords();

    const handleSync = () => {
      fetchSummary();
      fetchMonthlyRecords();
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
  }, [month, year]);

  // Sync current month with selected month/year
  useEffect(() => {
    setCurrentMonth(new Date(year, month - 1, 1));
  }, [month, year]);

  const attendanceRate = summary?.totalWorkingDays && summary.totalWorkingDays > 0
    ? ((summary.presentDays / summary.totalWorkingDays) * 100).toFixed(1)
    : 0;

  const getRatingColor = () => {
    const rate = parseFloat(attendanceRate);
    if (rate >= 90) return { color: '#10b981', text: 'Excellent', bg: '#d1fae5' };
    if (rate >= 75) return { color: '#f59e0b', text: 'Good', bg: '#fed7aa' };
    if (rate >= 60) return { color: '#f59e0b', text: 'Average', bg: '#ffedd5' };
    return { color: '#ef4444', text: 'Needs Improvement', bg: '#fee2e2' };
  };

  const rating = getRatingColor();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0.0';
    return hours.toFixed(1);
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
    setMonth(newDate.getMonth() + 1);
    setYear(newDate.getFullYear());
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <ToastContainer />
      <div className="attendance-root">
        {loading && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Loading summary data..." />
          </div>
        )}

        <div className="attendance-header">
          <h1>Attendance Summary</h1>
          <p>Monthly overview and performance metrics</p>
        </div>

        {/* Filter Card */}
        <div className="filter-card">
          <div className="filter-group">
            <div className="filter-item">
              <label>Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="filter-select"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <label>Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="filter-select"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <button onClick={fetchSummary} className="refresh-btn" disabled={loading}>
                <FaCalendarAlt size={14} />
                {loading ? 'Loading...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {summary ? (
          <>
            {/* Rating Card */}
            {/* <div className="card-modern" style={{ 
              background: rating.bg, 
              marginBottom: '24px',
              border: `1px solid ${rating.color}`
            }}>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <p style={{ color: rating.color, marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                      Attendance Rating
                    </p>
                    <h2 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '2px', color: rating.color }}>
                      {attendanceRate}%
                    </h2>
                    <p style={{ color: rating.color, fontWeight: '500', fontSize: '14px' }}>{rating.text}</p>
                  </div>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    background: rating.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.9
                  }}>
                    <FaTrophy size={32} color="white" />
                  </div>
                </div>
              </div>
            </div> */}

            {/* Stats Grid - 6 cards */}
            <div className="summary-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaCalendarAlt size={11} style={{ marginRight: '4px' }} />
                  Total Working Days
                </div>
                <div className="stat-value total" style={{ fontSize: '28px' }}>{summary.totalWorkingDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>Days in month</div>
              </div>
              
              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaCheckCircle size={11} style={{ marginRight: '4px' }} />
                  Present Days
                </div>
                <div className="stat-value present" style={{ fontSize: '28px' }}>{summary.presentDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>
                  {summary.totalWorkingDays > 0 ? ((summary.presentDays / summary.totalWorkingDays) * 100).toFixed(1) : 0}% of total
                </div>
              </div>

              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaClock size={11} style={{ marginRight: '4px' }} />
                  Half Days
                </div>
                <div className="stat-value late" style={{ fontSize: '28px' }}>{summary.halfDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>Partial attendance</div>
              </div>
              
              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaTimesCircle size={11} style={{ marginRight: '4px' }} />
                  Absent Days
                </div>
                <div className="stat-value absent" style={{ fontSize: '28px' }}>{summary.absentDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>No attendance</div>
              </div>

              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaUmbrellaBeach size={11} style={{ marginRight: '4px' }} />
                  Leave Days
                </div>
                <div className="stat-value" style={{ fontSize: '28px', color: '#8b5cf6' }}>{summary.leaveDays || 0}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>Approved leaves</div>
              </div>

              <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                <div className="stat-label" style={{ fontSize: '11px' }}>
                  <FaClock size={11} style={{ marginRight: '4px' }} />
                  Total Hours
                </div>
                <div className="stat-value hours" style={{ fontSize: '28px' }}>{formatHours(summary.totalWorkingHours)}</div>
                <div className="stat-trend" style={{ fontSize: '10px' }}>Hours worked</div>
              </div>
            </div>

            {/* Modern Calendar Component */}
            <div className="attendance-table-card" style={{ overflow: 'visible', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Attendance Calendar
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
                    <span className="legend-color holiday-color"></span>
                    <span>Holiday</span>
                  </div>
                  <div className="legend-item" style={{ fontSize: '12px' }}>
                    <span className="legend-color future-color"></span>
                    <span>Future Date</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="card-modern">
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Performance Insights
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Attendance Rate</span>
                    <div style={{ flex: 1, maxWidth: '300px', marginLeft: 'auto' }}>
                      <div style={{ 
                        background: '#e5e7eb', 
                        borderRadius: '10px', 
                        height: '8px', 
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${attendanceRate}%`, 
                          background: rating.color, 
                          height: '100%', 
                          borderRadius: '10px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                    <span style={{ fontWeight: '600', color: rating.color }}>{attendanceRate}%</span>
                  </div>
                  
                  {summary.presentDays > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Average Hours/Day</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {summary.totalWorkingDays > 0 
                          ? (summary.totalWorkingHours / summary.totalWorkingDays).toFixed(1) 
                          : '0.0'} hours
                      </span>
                    </div>
                  )}
                  
                  {summary.absentDays > 0 && (
                    <div style={{ 
                      background: '#fef2f2', 
                      padding: '12px', 
                      borderRadius: '12px',
                      marginTop: '8px'
                    }}>
                      <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>
                        ⚠️ You were absent for {summary.absentDays} day{summary.absentDays > 1 ? 's' : ''} this month.
                        {summary.absentDays > 3 && " Consider improving your attendance."}
                      </p>
                    </div>
                  )}
                  
                  {summary.leaveDays > 0 && (
                    <div style={{ 
                      background: '#f3e8ff', 
                      padding: '12px', 
                      borderRadius: '12px',
                      marginTop: '8px'
                    }}>
                      <p style={{ fontSize: '13px', color: '#7c3aed', margin: 0 }}>
                        📅 You took {summary.leaveDays} day{summary.leaveDays > 1 ? 's' : ''} of leave this month.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="attendance-empty">
            <div className="empty-icon">
              <FaChartPie />
            </div>
            <p>No data available for selected period</p>
            <small>Try selecting a different month or year</small>
          </div>
        )}
      </div>
    </>
  );
};

export default AttendanceSummary;