/**
 * PRODUCTION-LEVEL HRMS ROSTER & SHIFT MANAGEMENT SYSTEM UTILITIES
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides:
 *  - Standard 4 Shift Master Categories (General, Morning, Day, Night) + Special & Status Shifts
 *  - 28, 29, 30, and 31-day Dynamic Month Date Handlers (including Leap-Year Feb)
 *  - Deterministic Weekly Shift Rotation Engine (Morning -> Day -> Night -> Morning)
 *  - Fixed General Shift preservation
 *  - Real Holiday & Approved Leave Conflict Resolution
 *  - Configurable Weekly Off Policies (Sat & Sun Off, Sun Only Off, Sun Working)
 *  - Duty Working Days Calculation (Total - Weekly Offs - Non-overlapping Holidays)
 *  - Strict 5-min before / post-shift Check-in and Checkout Rule Engine
 */

// ─── 1. SHIFT MASTER DEFINITIONS ─────────────────────────────────────────────
export const DEFAULT_SHIFTS = [
  {
    id: 'shift-gs',
    code: 'GS',
    shortCode: 'G',
    name: 'General Shift',
    startTime: '09:00',
    endTime: '18:00',
    durationHours: 9.0,
    breakMinutes: 60,
    graceMinutes: 15,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    isNightShift: false,
    isActive: true,
    description: 'Corporate General Day Shift (9:00 AM – 6:00 PM)'
  },
  {
    id: 'shift-ms',
    code: 'MS',
    shortCode: 'M',
    name: 'Morning Shift',
    startTime: '06:00',
    endTime: '14:00',
    durationHours: 8.0,
    breakMinutes: 45,
    graceMinutes: 15,
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    isNightShift: false,
    isActive: true,
    description: 'Early Operational Shift (6:00 AM – 2:00 PM)'
  },
  {
    id: 'shift-ds',
    code: 'DS',
    shortCode: 'D',
    name: 'Day Shift',
    startTime: '14:00',
    endTime: '22:00',
    durationHours: 8.0,
    breakMinutes: 45,
    graceMinutes: 15,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    isNightShift: false,
    isActive: true,
    description: 'Afternoon / Day Operational Shift (2:00 PM – 10:00 PM)'
  },
  {
    id: 'shift-ns',
    code: 'NS',
    shortCode: 'N',
    name: 'Night Shift',
    startTime: '22:00',
    endTime: '06:00',
    durationHours: 8.0,
    breakMinutes: 45,
    graceMinutes: 15,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    isNightShift: true,
    isActive: true,
    description: 'Overnight Operational Shift (10:00 PM – 6:00 AM)'
  },
  {
    id: 'shift-s39',
    code: 'S39',
    shortCode: '3-9',
    name: '3-9 Shift (Evening)',
    startTime: '15:00',
    endTime: '21:00',
    durationHours: 6.0,
    breakMinutes: 30,
    graceMinutes: 10,
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    isNightShift: false,
    isActive: true,
    description: 'Special Operational Shift (3:00 PM – 9:00 PM)'
  },
  {
    id: 'shift-wo',
    code: 'WO',
    shortCode: 'OFF',
    name: 'Weekly Off',
    startTime: '--:--',
    endTime: '--:--',
    durationHours: 0,
    breakMinutes: 0,
    graceMinutes: 0,
    color: '#64748b',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    isNightShift: false,
    isActive: true,
    description: 'Scheduled weekly rest day (Saturday / Sunday or custom off)'
  },
  {
    id: 'shift-hl',
    code: 'HL',
    shortCode: 'H',
    name: 'Holiday',
    startTime: '--:--',
    endTime: '--:--',
    durationHours: 0,
    breakMinutes: 0,
    graceMinutes: 0,
    color: '#e11d48',
    bgColor: '#fff1f2',
    borderColor: '#fecdd3',
    isNightShift: false,
    isActive: true,
    description: 'Approved public or branch holiday'
  },
  {
    id: 'shift-lv',
    code: 'LV',
    shortCode: 'L',
    name: 'Approved Leave',
    startTime: '--:--',
    endTime: '--:--',
    durationHours: 0,
    breakMinutes: 0,
    graceMinutes: 0,
    color: '#4f46e5',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
    isNightShift: false,
    isActive: true,
    description: 'Employee on approved personal / medical leave'
  }
];

// Helper: Get shift object by code
export const getShiftByCode = (code) => {
  const allShifts = getStoredShifts();
  if (!code) return allShifts[0] || DEFAULT_SHIFTS[0];
  const upper = String(code).toUpperCase().trim();
  const found = allShifts.find(s => s.code.toUpperCase() === upper || s.shortCode.toUpperCase() === upper);
  if (found) return found;

  // Fallback alias mappings
  if (upper === 'G') return getShiftByCode('GS');
  if (upper === 'M') return getShiftByCode('MS');
  if (upper === 'D') return getShiftByCode('DS');
  if (upper === 'N') return getShiftByCode('NS');
  if (upper === 'OFF') return getShiftByCode('WO');
  if (upper === 'H') return getShiftByCode('HL');
  if (upper === 'L') return getShiftByCode('LV');

  // Check if active server policy matches
  try {
    const rawPol = localStorage.getItem('hrms_active_attendance_policy');
    if (rawPol) {
      const pol = JSON.parse(rawPol);
      const sStart = pol.shiftStart ? String(pol.shiftStart).substring(0, 5) : '12:00';
      const sEnd = pol.shiftEnd ? String(pol.shiftEnd).substring(0, 5) : '09:00';
      const [sh, sm] = sStart.split(':').map(Number);
      const [eh, em] = sEnd.split(':').map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      const isNight = mins < 0 || Boolean(pol.isNightShift);
      if (mins <= 0 || isNight) mins += 24 * 60;

      return {
        id: `shift-active-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        code: code,
        shortCode: code,
        name: pol.name || `${code} Shift`,
        startTime: sStart,
        endTime: sEnd,
        durationHours: Number((mins / 60).toFixed(1)) || Number(pol.fullDayHours) || 8.0,
        breakMinutes: 45,
        graceMinutes: Number(pol.graceMinutes) || 10,
        color: '#e11d48',
        bgColor: '#fff1f2',
        borderColor: '#fecdd3',
        isNightShift: isNight,
        isActive: true,
        description: `Active server policy (${format12Hour(sStart)} – ${format12Hour(sEnd)})`
      };
    }
  } catch {}

  return {
    id: `shift-custom-${code}`,
    code: code,
    shortCode: code,
    name: `${code} Shift`,
    startTime: '09:00',
    endTime: '18:00',
    durationHours: 9.0,
    breakMinutes: 60,
    graceMinutes: 15,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    isNightShift: false,
    isActive: true,
    description: 'Custom configured shift'
  };
};

// ─── 2. DATE & CALENDAR UTILITIES ────────────────────────────────────────────
export const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

export const format12Hour = (timeStr) => {
  if (!timeStr || timeStr === '--:--') return '--:--';
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${String(formattedHour).padStart(2, '0')}:${minutes} ${ampm}`;
};

export const getTodayDateYMD = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateYMD = (str) => {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const getMondayOfDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── 3. LOCAL CACHE HELPERS (SESSION / DRAFT PERSISTENCE) ─────────────────────
export const getStoredShifts = () => {
  let list = DEFAULT_SHIFTS;
  try {
    const raw = localStorage.getItem('hrms_shifts_master') || localStorage.getItem('hrms_shift_definitions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    }
  } catch {}

  // Check if active server policy in localStorage should be injected
  try {
    const rawPol = localStorage.getItem('hrms_active_attendance_policy');
    if (rawPol) {
      const pol = JSON.parse(rawPol);
      const code = pol.name || pol.shiftCode || '12-9';
      const sStart = pol.shiftStart ? String(pol.shiftStart).substring(0, 5) : '12:00';
      const sEnd = pol.shiftEnd ? String(pol.shiftEnd).substring(0, 5) : '09:00';
      const [sh, sm] = sStart.split(':').map(Number);
      const [eh, em] = sEnd.split(':').map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      const isNight = mins < 0 || Boolean(pol.isNightShift);
      if (mins <= 0 || isNight) mins += 24 * 60;
      const duration = Number((mins / 60).toFixed(1)) || Number(pol.fullDayHours) || 8.0;

      const activeShiftObj = {
        id: `shift-active-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        code: code,
        shortCode: code,
        name: pol.name || `${code} Shift`,
        startTime: sStart,
        endTime: sEnd,
        durationHours: duration,
        breakMinutes: 45,
        graceMinutes: Number(pol.graceMinutes) || 10,
        color: '#e11d48',
        bgColor: '#fff1f2',
        borderColor: '#fecdd3',
        isNightShift: isNight,
        isActive: true,
        description: `Active server policy (${format12Hour(sStart)} – ${format12Hour(sEnd)})`
      };

      let found = false;
      const combined = list.map(s => {
        if (s.code === code || s.code === '12-9') {
          found = true;
          return { ...s, ...activeShiftObj, code: s.code };
        }
        return s;
      });
      if (!found) combined.splice(4, 0, activeShiftObj);
      return combined;
    }
  } catch {}

  return list;
};

export const saveStoredShifts = (shifts, notify = true) => {
  try {
    localStorage.setItem('hrms_shifts_master', JSON.stringify(shifts));
    localStorage.setItem('hrms_shift_definitions', JSON.stringify(shifts));
    if (notify) {
      window.dispatchEvent(new Event('hrms_shifts_updated'));
    }
  } catch {}
};

export const getEmployeeDefaultShifts = () => {
  try {
    const raw = localStorage.getItem('hrms_employee_default_shifts');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

export const saveEmployeeDefaultShifts = (mapping) => {
  try {
    localStorage.setItem('hrms_employee_default_shifts', JSON.stringify(mapping));
  } catch {}
};

export const getRosterAssignments = () => {
  try {
    const raw = localStorage.getItem('hrms_roster_assignments');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

export const saveRosterAssignments = (assignments) => {
  try {
    localStorage.setItem('hrms_roster_assignments', JSON.stringify(assignments));
  } catch {}
};

// ─── SHIFT SYSTEM GLOBAL CONFIGURATION ──────────────────────────────────────
export const DEFAULT_SHIFT_SYSTEM_SETTINGS = {
  checkInBeforeMinutes: 5,        // Unlocked 5 mins before shift start (e.g. 05:55 AM for MS 06:00 AM)
  enforceCheckOutAfterShift: true,// Block checkout before shift end time
  checkOutGraceMinutes: 10,       // Grace window after shift end
  weeklyRotationIntervalDays: 7,  // 7 days per shift before rotating
  rotationSequence: ['MS', 'DS', 'NS'],
  keepGeneralShiftFixed: true,
  weeklyOffPolicy: 'SAT_SUN'      // SAT_SUN | SUN_ONLY | SUN_WORKING
};

export const getShiftSystemSettings = () => {
  try {
    const raw = localStorage.getItem('hrms_shift_system_settings');
    if (raw) return { ...DEFAULT_SHIFT_SYSTEM_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SHIFT_SYSTEM_SETTINGS;
};

export const saveShiftSystemSettings = (settings) => {
  try {
    localStorage.setItem('hrms_shift_system_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('hrms_shift_settings_updated'));
  } catch {}
};

// ─── 4. DETERMINISTIC AUTOMATIC WEEKLY SHIFT ROTATION ENGINE ─────────────────
/**
 * Executes the Weekly Shift Rotation Algorithm:
 *  - One employee works one shift for 1 week (7 days), then rotates to the next shift.
 *  - Rotation sequence: Morning (MS) -> Day (DS) -> Night (NS) -> Morning (MS).
 *  - General Shift (GS) employees remain strictly on General Shift unless configured to rotate.
 *  - Supports 28, 29, 30, and 31-day months seamlessly.
 *  - Automatically excludes Weekly Offs based on policy (SAT_SUN, SUN_ONLY, SUN_WORKING).
 *  - Integrates approved employee leaves (marks 'L' / LV, prevents duty assignment).
 *  - Integrates holidays (marks 'H' / HL, adjusts working days calculation).
 *  - Avoids double-counting holidays overlapping weekly offs.
 *
 * @param {Object} params
 * @param {Array} params.employees - Real active employees from /api/employees
 * @param {number} params.month - 0-indexed month (0 = Jan, 11 = Dec)
 * @param {number} params.year - Full year (e.g. 2026)
 * @param {string} params.weeklyOffPolicy - 'SAT_SUN' | 'SUN_ONLY' | 'SUN_WORKING'
 * @param {Array} params.generalShiftEmpIds - Array of employee IDs designated for Fixed General Shift
 * @param {Array} params.approvedLeaves - Real approved leaves from /api/leaves/all
 * @param {Array} params.holidays - Real holidays from /api/holidays
 * @param {string} params.rotationStartDateStr - Custom start date anchor for 7-day boundary calculation
 * @returns {Object} Complete roster matrix, statistics, conflict warnings, and duty days breakdown
 */
export const generateWeeklyShiftRotation = ({
  employees = [],
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
  weeklyOffPolicy = 'SAT_SUN',
  generalShiftEmpIds = [],
  approvedLeaves = [],
  holidays = [],
  rotationStartDateStr = null
}) => {
  const daysInMonth = getDaysInMonth(year, month);
  const rotationSequence = ['MS', 'DS', 'NS']; // Morning -> Day -> Night

  // Build quick holiday lookup map: 'YYYY-MM-DD' -> Holiday Name
  const holidayMap = new Map();
  if (Array.isArray(holidays)) {
    holidays.forEach(h => {
      if (h.date) {
        const dStr = String(h.date).split('T')[0];
        holidayMap.set(dStr, h.name || 'Company Holiday');
      }
    });
  }

  // Build quick approved leave lookup map: `${empId}_${YYYY-MM-DD}` -> Leave Reason
  const leaveMap = new Map();
  if (Array.isArray(approvedLeaves)) {
    approvedLeaves.forEach(lv => {
      const status = String(lv.status || '').toUpperCase();
      if (status === 'APPROVED' && lv.startDate && lv.endDate) {
        const empId = lv.employee?.id || lv.employeeId;
        if (empId) {
          const start = new Date(lv.startDate);
          const end = new Date(lv.endDate);
          const cur = new Date(start);
          while (cur <= end) {
            leaveMap.set(`${empId}_${formatDateYMD(cur)}`, lv.reason || 'Approved Leave');
            cur.setDate(cur.getDate() + 1);
          }
        }
      }
    });
  }

  // Anchor date for weekly 7-day calculation
  const anchorDate = rotationStartDateStr
    ? parseDateYMD(rotationStartDateStr)
    : new Date(year, 0, 1); // Default: Jan 1 of current year

  // Calculate Calendar Days List
  const calendarDays = [];
  let totalSaturdays = 0;
  let totalSundays = 0;
  let totalHolidaysInMonth = 0;
  let holidaysOverlappingOff = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = formatDateYMD(d);
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    if (isSunday) totalSundays++;
    if (isSaturday) totalSaturdays++;

    let isWeeklyOff = false;
    if (weeklyOffPolicy === 'SAT_SUN') {
      isWeeklyOff = isSaturday || isSunday;
    } else if (weeklyOffPolicy === 'SUN_ONLY') {
      isWeeklyOff = isSunday;
    } else if (weeklyOffPolicy === 'SUN_WORKING') {
      isWeeklyOff = false;
    }

    const isHoliday = holidayMap.has(dateStr);
    if (isHoliday) {
      totalHolidaysInMonth++;
      if (isWeeklyOff) {
        holidaysOverlappingOff++;
      }
    }

    calendarDays.push({
      dayNumber: day,
      date: d,
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isSunday,
      isSaturday,
      isWeeklyOff,
      isHoliday,
      holidayName: holidayMap.get(dateStr) || null
    });
  }

  // Calculate Available Duty Days for this Month
  const totalWeeklyOffDays = weeklyOffPolicy === 'SAT_SUN'
    ? (totalSaturdays + totalSundays)
    : weeklyOffPolicy === 'SUN_ONLY'
    ? totalSundays
    : 0;

  const standaloneHolidays = totalHolidaysInMonth - holidaysOverlappingOff;
  const availableDutyDays = Math.max(0, daysInMonth - totalWeeklyOffDays - standaloneHolidays);

  // Generate Matrix for all employees
  const assignments = {};
  const employeeSchedules = [];
  const shiftCounters = { total: employees.length, GS: 0, MS: 0, DS: 0, NS: 0, ON_LEAVE: 0, UNASSIGNED: 0 };
  const conflicts = [];

  // General shift set
  const genSet = new Set(generalShiftEmpIds.map(String));

  // Eligible rotating employees list
  const rotatingEmployees = [];
  employees.forEach(emp => {
    if (genSet.has(String(emp.id))) {
      shiftCounters.GS++;
    } else {
      rotatingEmployees.push(emp);
    }
  });

  // Assign Rotating Employees staggered across MS -> DS -> NS
  rotatingEmployees.forEach((emp, empIdx) => {
    // Initial stagger offset: 0 = MS, 1 = DS, 2 = NS
    const initialOffset = empIdx % rotationSequence.length;
    if (initialOffset === 0) shiftCounters.MS++;
    else if (initialOffset === 1) shiftCounters.DS++;
    else shiftCounters.NS++;
  });

  employees.forEach((emp, empIdx) => {
    const empId = emp.id;
    const isGeneralShift = genSet.has(String(empId));
    let initialOffset = 0;

    if (!isGeneralShift) {
      const rotIdx = rotatingEmployees.findIndex(r => String(r.id) === String(empId));
      initialOffset = rotIdx >= 0 ? rotIdx % rotationSequence.length : 0;
    }

    const rowDailyShifts = {};
    let empWorkingDaysCount = 0;
    let empLeaveDaysCount = 0;
    let empOffDaysCount = 0;
    let empHolidayDaysCount = 0;

    calendarDays.forEach(dayInfo => {
      const { date, dateStr, isWeeklyOff, isHoliday, holidayName } = dayInfo;
      const key = `${empId}_${dateStr}`;
      const leaveKey = `${empId}_${dateStr}`;
      const hasApprovedLeave = leaveMap.has(leaveKey);

      let shiftCode = '';
      let status = 'ASSIGNED';
      let note = '';

      // Priority 1: Approved Leave
      if (hasApprovedLeave) {
        status = 'ON_LEAVE';
        shiftCode = 'LV';
        note = leaveMap.get(leaveKey);
        empLeaveDaysCount++;
        conflicts.push({
          employeeId: empId,
          employeeName: emp.name,
          date: dateStr,
          type: 'LEAVE',
          message: `${emp.name} is on approved leave on ${dateStr} (${note}).`
        });
      }
      // Priority 2: Holiday
      else if (isHoliday) {
        status = 'HOLIDAY';
        shiftCode = 'HL';
        note = holidayName;
        empHolidayDaysCount++;
      }
      // Priority 3: Weekly Off
      else if (isWeeklyOff) {
        status = 'WEEKLY_OFF';
        shiftCode = 'WO';
        note = 'Weekly Off';
        empOffDaysCount++;
      }
      // Priority 4: Duty Shift Assignment
      else {
        if (isGeneralShift) {
          shiftCode = 'GS';
        } else {
          // Compute week number since anchor date
          const diffDays = Math.floor((date.getTime() - anchorDate.getTime()) / (86400000));
          const weekNumber = Math.max(0, Math.floor(diffDays / 7));
          const rotationIndex = (initialOffset + weekNumber) % rotationSequence.length;
          shiftCode = rotationSequence[rotationIndex];
        }
        status = 'ASSIGNED';
        empWorkingDaysCount++;
      }

      assignments[key] = shiftCode;
      rowDailyShifts[dateStr] = {
        dateStr,
        shiftCode,
        status,
        note,
        shift: getShiftByCode(shiftCode)
      };
    });

    employeeSchedules.push({
      employee: emp,
      isGeneralShift,
      workingDays: empWorkingDaysCount,
      leaveDays: empLeaveDaysCount,
      weeklyOffDays: empOffDaysCount,
      holidayDays: empHolidayDaysCount,
      dailyShifts: rowDailyShifts
    });
  });

  return {
    month,
    year,
    daysInMonth,
    calendarDays,
    totalCalendarDays: daysInMonth,
    totalWeeklyOffDays,
    totalHolidaysInMonth,
    holidaysOverlappingOff,
    standaloneHolidays,
    availableDutyDays,
    weeklyOffPolicy,
    shiftCounters,
    employeeSchedules,
    assignments,
    conflicts
  };
};

// ─── 5. 30-DAY QUICK PLANNER (BACKWARDS COMPATIBILITY) ─────────────────────────
export const autoGenerate30DayPlan = (employees = [], customDefaultShifts = null) => {
  const defaults = customDefaultShifts || getEmployeeDefaultShifts();
  const currentRoster = getRosterAssignments();
  const newRoster = { ...currentRoster };

  const today = new Date();
  let assignedCount = 0;

  employees.forEach((emp, empIdx) => {
    let shiftCode = defaults[emp.id];
    if (!shiftCode) {
      shiftCode = empIdx % 2 === 0 ? 'GS' : 'MS';
      defaults[emp.id] = shiftCode;
    }

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + dayOffset);
      const dayOfWeek = d.getDay();
      const dateStr = formatDateYMD(d);
      const key = `${emp.id}_${dateStr}`;

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        newRoster[key] = 'WO';
      } else {
        newRoster[key] = shiftCode;
        assignedCount++;
      }
    }
  });

  saveEmployeeDefaultShifts(defaults);
  saveRosterAssignments(newRoster);

  return {
    success: true,
    totalEmployees: employees.length,
    assignedCount,
    updatedDefaults: defaults,
    updatedRoster: newRoster,
    startDate: formatDateYMD(today),
    endDate: formatDateYMD(new Date(today.getTime() + 29 * 86400000))
  };
};

export const getEmployeeShiftForDate = (employeeId, dateStr = getTodayDateYMD()) => {
  if (!employeeId) return getShiftByCode('GS');
  const rosterMap = getRosterAssignments();
  const key = `${employeeId}_${dateStr}`;
  if (rosterMap[key]) {
    return getShiftByCode(rosterMap[key]);
  }
  const defaultShifts = getEmployeeDefaultShifts();
  if (defaultShifts[employeeId]) {
    const d = parseDateYMD(dateStr);
    const day = d.getDay();
    if (day === 0 || day === 6) return getShiftByCode('WO');
    return getShiftByCode(defaultShifts[employeeId]);
  }
  const d = parseDateYMD(dateStr);
  const day = d.getDay();
  if (day === 0 || day === 6) return getShiftByCode('WO');
  return getShiftByCode('GS');
};

export const getCurrentEmployeeIdentity = (explicitUser = null) => {
  let uData = {};
  try {
    uData = JSON.parse(localStorage.getItem('userData') || '{}') || {};
  } catch {}

  const rawId =
    explicitUser?.employeeId ??
    explicitUser?.id ??
    localStorage.getItem('employeeId') ??
    localStorage.getItem('hrms_employee_id') ??
    uData?.employeeId ??
    uData?.id ??
    localStorage.getItem('userId');

  const cleanVal = (v) => {
    if (v === undefined || v === null) return '';
    const s = String(v).trim();
    return s && s !== 'null' && s !== 'undefined' ? s : '';
  };

  const employeeId = cleanVal(rawId);
  const rawUsername =
    explicitUser?.email ??
    explicitUser?.username ??
    localStorage.getItem('username') ??
    uData?.email ??
    uData?.username ??
    '';
  const username = cleanVal(rawUsername).toLowerCase();

  return {
    employeeId,
    username,
    storageScope: employeeId || username || 'anonymous'
  };
};

const extractRecordEmployeeIds = (record) => {
  if (!record || typeof record !== 'object') return { id: '', username: '' };
  const cleanVal = (v) => {
    if (v === undefined || v === null) return '';
    const s = String(v).trim();
    return s && s !== 'null' && s !== 'undefined' ? s : '';
  };
  const id = cleanVal(
    record.employeeId ??
      record.empId ??
      record.userId ??
      record.employee?.employeeId ??
      record.employee?.id
  );
  const username = cleanVal(
    record.employeeUsername ??
      record.username ??
      record.employeeEmail ??
      record.email ??
      record.employee?.email ??
      record.employee?.username
  ).toLowerCase();
  return { id, username };
};

export const recordMatchesCurrentEmployee = (record, explicitUser = null) => {
  if (!record || typeof record !== 'object') return false;
  const { employeeId, username } = getCurrentEmployeeIdentity(explicitUser);
  const rec = extractRecordEmployeeIds(record);

  if (rec.id) {
    return Boolean(employeeId && rec.id === employeeId);
  }
  if (rec.username) {
    return Boolean(username && rec.username === username);
  }
  return false;
};

export const filterBackendRecordsForCurrentEmployee = (records, explicitUser = null) => {
  if (!Array.isArray(records)) return [];
  const { employeeId, username } = getCurrentEmployeeIdentity(explicitUser);
  return records.filter((record) => {
    const rec = extractRecordEmployeeIds(record);
    if (rec.id) return Boolean(employeeId && rec.id === employeeId);
    if (rec.username) return Boolean(username && rec.username === username);
    // Backend /my endpoints may omit employeeId on personal DTOs
    return true;
  });
};

export const getCurrentUserTodayShift = (explicitUser = null) => {
  try {
    const { employeeId } = getCurrentEmployeeIdentity(explicitUser);
    const today = getTodayDateYMD();
    if (employeeId) {
      return getEmployeeShiftForDate(employeeId, today);
    }
  } catch {}
  return getShiftByCode('GS');
};

export const setCurrentUserShiftOverride = (shiftCode) => {
  if (shiftCode) {
    localStorage.setItem('hrms_current_user_shift_override', shiftCode);
  } else {
    localStorage.removeItem('hrms_current_user_shift_override');
  }
};

// ─── 6. STRICT TIMING RULE ENGINE ─────────────────────────────────────────────
export const evaluateShiftTimingRules = (shift, referenceTime = new Date()) => {
  if (!shift || !shift.startTime || shift.startTime === '--:--' || !shift.endTime || shift.endTime === '--:--') {
    return {
      canCheckIn: true,
      canCheckOut: true,
      checkInMessage: 'Flexible / Rest Day: Check-in unrestricted.',
      checkOutMessage: 'Flexible / Rest Day: Check-out unrestricted.',
      shiftStartFormatted: '--:--',
      shiftEndFormatted: '--:--',
      checkInWindowStartFormatted: '--:--',
      isCheckInOpen: true,
      isCheckOutOpen: true,
      checkInRemainingSeconds: 0,
      checkOutRemainingSeconds: 0,
      formattedCheckInCountdown: '00:00:00',
      formattedCheckOutCountdown: '00:00:00'
    };
  }

  const sysSettings = getShiftSystemSettings();
  const checkInBeforeMinutes = Number(sysSettings.checkInBeforeMinutes ?? 5);

  const shiftStartFormatted = format12Hour(shift.startTime);
  const shiftEndFormatted = format12Hour(shift.endTime);

  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);

  const isOvernight = Boolean(shift.isNightShift || endH < startH || (endH === startH && endM <= startM));

  let shiftStartTime = new Date(referenceTime);
  shiftStartTime.setHours(startH, startM, 0, 0);

  let shiftEndTime = new Date(referenceTime);
  shiftEndTime.setHours(endH, endM, 0, 0);

  if (isOvernight) {
    // Determine which duty cycle referenceTime belongs to:
    // Today's shift cycle opens at todayWindowStartMins (start time minus preShift buffer).
    // Before today's opening window, we are in yesterday's duty cycle which concludes today morning.
    const todayWindowStartMins = startH * 60 + startM - checkInBeforeMinutes;
    const refMins = referenceTime.getHours() * 60 + referenceTime.getMinutes();

    if (refMins >= todayWindowStartMins) {
      shiftStartTime.setHours(startH, startM, 0, 0);
      shiftEndTime.setDate(shiftEndTime.getDate() + 1);
    } else {
      shiftStartTime.setDate(shiftStartTime.getDate() - 1);
      shiftStartTime.setHours(startH, startM, 0, 0);
    }
  }

  // Check-in opens checkInBeforeMinutes (default 5 min) before shift start
  const checkInOpenTime = new Date(shiftStartTime);
  checkInOpenTime.setMinutes(checkInOpenTime.getMinutes() - checkInBeforeMinutes);

  const checkInWindowStartFormatted = format12Hour(
    `${String(checkInOpenTime.getHours()).padStart(2, '0')}:${String(checkInOpenTime.getMinutes()).padStart(2, '0')}`
  );

  const diffToCheckInOpen = checkInOpenTime.getTime() - referenceTime.getTime();
  const diffToShiftEnd = shiftEndTime.getTime() - referenceTime.getTime();

  const canCheckIn = diffToCheckInOpen <= 0;
  const checkInRemainingSeconds = Math.max(0, Math.floor(diffToCheckInOpen / 1000));
  const inHrs = Math.floor(checkInRemainingSeconds / 3600);
  const inMins = Math.floor((checkInRemainingSeconds % 3600) / 60);
  const inSecs = checkInRemainingSeconds % 60;
  const formattedCheckInCountdown = `${String(inHrs).padStart(2, '0')}h ${String(inMins).padStart(2, '0')}m ${String(inSecs).padStart(2, '0')}s`;

  let checkInMessage = '';
  if (canCheckIn) {
    checkInMessage = `Check-in is open! (Permitted ${checkInBeforeMinutes} minutes before shift from ${checkInWindowStartFormatted}).`;
  } else {
    checkInMessage = `Check-in opens ${checkInBeforeMinutes} minutes before shift at ${checkInWindowStartFormatted} (${formattedCheckInCountdown} remaining).`;
  }

  const enforceCheckout = sysSettings.enforceCheckOutAfterShift !== false;
  const canCheckOut = enforceCheckout ? (diffToShiftEnd <= 0) : true;
  const checkOutRemainingSeconds = Math.max(0, Math.floor(diffToShiftEnd / 1000));
  const outHrs = Math.floor(checkOutRemainingSeconds / 3600);
  const outMins = Math.floor((checkOutRemainingSeconds % 3600) / 60);
  const outSecs = checkOutRemainingSeconds % 60;
  const formattedCheckOutCountdown = `${String(outHrs).padStart(2, '0')}h ${String(outMins).padStart(2, '0')}m ${String(outSecs).padStart(2, '0')}s`;

  let checkOutMessage = '';
  if (canCheckOut) {
    checkOutMessage = `Shift completed at ${shiftEndFormatted}. Checkout unlocked (recommended within 10+ minutes).`;
  } else {
    checkOutMessage = `Checkout locked until shift end at ${shiftEndFormatted} (${formattedCheckOutCountdown} remaining). Early checkout restricted.`;
  }

  return {
    canCheckIn,
    canCheckOut,
    checkInBeforeMinutes,
    checkInMessage,
    checkOutMessage,
    shiftStartFormatted,
    shiftEndFormatted,
    checkInWindowStartFormatted,
    isCheckInOpen: canCheckIn,
    isCheckOutOpen: canCheckOut,
    checkInRemainingSeconds,
    checkOutRemainingSeconds,
    formattedCheckInCountdown,
    formattedCheckOutCountdown
  };
};

export const checkShiftCheckoutRule = (shift, referenceDate = new Date()) => {
  const result = evaluateShiftTimingRules(shift, referenceDate);
  return {
    allowed: result.canCheckOut,
    remainingSeconds: result.checkOutRemainingSeconds,
    remainingMinutes: Math.ceil(result.checkOutRemainingSeconds / 60),
    formattedRemaining: result.formattedCheckOutCountdown,
    shiftStartFormatted: result.shiftStartFormatted,
    shiftEndFormatted: result.shiftEndFormatted,
    shiftEndTime: shift?.endTime || '--:--',
    isShiftEnded: result.canCheckOut,
    message: result.checkOutMessage
  };
};

// ─── 7. UNIFIED SHIFT ATTENDANCE CALCULATION & SYNC ENGINE ─────────────────────

/**
 * Calculates attendance status, working hours, late mark, early exit,
 * and overtime shift-wise.
 */
export const calculateShiftAttendance = ({
  checkIn,
  checkOut,
  shift,
  breakMinutes = 0
}) => {
  if (!checkIn) {
    return {
      status: 'NOT_CHECKED_IN',
      statusLabel: 'Not Checked In',
      workingHours: 0,
      overtimeHours: 0,
      isLate: false,
      lateMinutes: 0,
      isEarlyExit: false,
      earlyExitMinutes: 0,
      isPresent: false,
      isHalfDay: false
    };
  }

  const s = shift || getShiftByCode('GS');
  const [inH, inM] = String(checkIn).split(':').map(Number);
  const inTotalMins = (inH || 0) * 60 + (inM || 0);

  // Evaluate late entry against shift start time + grace period
  let isLate = false;
  let lateMinutes = 0;
  if (s.startTime && s.startTime !== '--:--') {
    const [startH, startM] = s.startTime.split(':').map(Number);
    const startTotalMins = (startH || 0) * 60 + (startM || 0);
    const grace = Number(s.graceMinutes !== undefined ? s.graceMinutes : 15);
    if (inTotalMins > (startTotalMins + grace)) {
      isLate = true;
      lateMinutes = inTotalMins - startTotalMins;
    }
  }

  // If checked in but not checked out yet (On Duty)
  if (!checkOut) {
    return {
      status: 'PRESENT',
      statusLabel: isLate ? `On Duty (Late by ${lateMinutes}m)` : 'On Duty (Checked In)',
      workingHours: 0,
      overtimeHours: 0,
      isLate,
      lateMinutes,
      isEarlyExit: false,
      earlyExitMinutes: 0,
      isPresent: true,
      isHalfDay: false
    };
  }

  // Both checkIn and checkOut exist: calculate productive duration
  const [outH, outM] = String(checkOut).split(':').map(Number);
  let outTotalMins = (outH || 0) * 60 + (outM || 0);
  if (outTotalMins < inTotalMins) {
    // Shift crossed midnight (e.g. Night shift)
    outTotalMins += 24 * 60;
  }

  const effectiveBreak = Number(breakMinutes || 0);
  const grossMins = Math.max(0, outTotalMins - inTotalMins);
  const netMins = Math.max(0, grossMins - effectiveBreak);
  const workingHours = Number((netMins / 60).toFixed(2));

  // Check early exit against shift scheduled end time
  let isEarlyExit = false;
  let earlyExitMinutes = 0;
  if (s.endTime && s.endTime !== '--:--') {
    const [endH, endM] = s.endTime.split(':').map(Number);
    let endTotalMins = (endH || 0) * 60 + (endM || 0);
    if (s.isNightShift || endH < (s.startTime ? Number(s.startTime.split(':')[0]) : 0)) {
      if (outTotalMins >= 24 * 60) endTotalMins += 24 * 60;
    }
    if (outTotalMins < endTotalMins) {
      isEarlyExit = true;
      earlyExitMinutes = endTotalMins - outTotalMins;
    }
  }

  // Calculate Overtime against Shift Standard Duration
  const targetDuration = Number(s.durationHours || 8.0);
  let overtimeHours = 0;
  if (workingHours > targetDuration) {
    overtimeHours = Number((workingHours - targetDuration).toFixed(2));
  }

  // Classification logic:
  // Full Day Present: workingHours >= (targetDuration <= 6 ? targetDuration - 0.5 : 7.5)
  // Half Day: workingHours >= half threshold and < full threshold
  // Absent: workingHours < half threshold
  let activePolicy = null;
  try {
    const rawPol = localStorage.getItem('hrms_active_attendance_policy');
    if (rawPol) activePolicy = JSON.parse(rawPol);
  } catch {}

  const fullDayThreshold = activePolicy?.fullDayHours ? Number(activePolicy.fullDayHours) : (targetDuration <= 6 ? Math.max(3.5, targetDuration - 0.5) : 7.5);
  const halfDayThreshold = activePolicy?.halfDayHours ? Number(activePolicy.halfDayHours) : Math.min(4.0, targetDuration / 2);

  let status = 'PRESENT';
  let statusLabel = 'Present (Full Day)';
  let isPresent = true;
  let isHalfDay = false;

  if (workingHours >= fullDayThreshold) {
    status = 'PRESENT';
    statusLabel = overtimeHours > 0 ? `Present (OT: +${overtimeHours}h)` : 'Present (Full Day)';
    isPresent = true;
    isHalfDay = false;
  } else if (workingHours >= halfDayThreshold) {
    status = 'HALF_DAY';
    statusLabel = 'Half Day (Partial)';
    isPresent = false;
    isHalfDay = true;
  } else {
    status = 'ABSENT';
    statusLabel = 'Absent (Insufficient Hours)';
    isPresent = false;
    isHalfDay = false;
  }

  return {
    status,
    statusLabel,
    workingHours,
    overtimeHours,
    isLate,
    lateMinutes,
    isEarlyExit,
    earlyExitMinutes,
    isPresent,
    isHalfDay
  };
};

/**
 * Sync today's attendance record across employee-scoped storage channels and dispatch broadcast events
 */
export const syncAttendanceRecord = (record, notify = true, explicitUser = null) => {
  if (!record || !record.date) return;
  try {
    const { employeeId, username, storageScope } = getCurrentEmployeeIdentity(explicitUser);
    if (!employeeId && !username) return;

    const taggedRecord = {
      ...record,
      employeeId: record.employeeId || employeeId || undefined,
      employeeUsername: record.employeeUsername || username || undefined
    };

    // 1. Employee-scoped today punch object (replaces global hrms_today_punches)
    localStorage.setItem(`hrms_user_today_punch_${storageScope}`, JSON.stringify(taggedRecord));

    // 2. Date + employee-specific key (used by RosterManagement & AttendanceDashboard)
    localStorage.setItem(`hrms_today_punch_${taggedRecord.date}_${storageScope}`, JSON.stringify(taggedRecord));

    // 3. Employee-scoped attendance logs history
    const logsKey = `hrms_attendance_logs_${storageScope}`;
    const logs = JSON.parse(localStorage.getItem(logsKey) || '[]');
    const existingIdx = logs.findIndex(r => (r.date || '').split('T')[0] === taggedRecord.date);
    if (existingIdx >= 0) {
      logs[existingIdx] = { ...logs[existingIdx], ...taggedRecord };
    } else {
      logs.unshift(taggedRecord);
    }
    localStorage.setItem(logsKey, JSON.stringify(logs));

    // Clear legacy global keys so another user never inherits a shared punch
    localStorage.removeItem('hrms_today_punches');

    // 4. Notify all components and windows
    if (notify && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hrms_attendance_updated', { detail: taggedRecord }));
      window.dispatchEvent(new CustomEvent('hrms_today_punches_updated', { detail: taggedRecord }));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.error('Error syncing attendance record:', err);
  }
};

/**
 * Retrieve the current employee's locally cached attendance logs
 */
export const getCurrentUserAttendanceLogs = (explicitUser = null) => {
  try {
    const { employeeId, username, storageScope } = getCurrentEmployeeIdentity(explicitUser);
    if (!employeeId && !username) return [];

    const scopedRaw = localStorage.getItem(`hrms_attendance_logs_${storageScope}`);
    if (scopedRaw) {
      const parsed = JSON.parse(scopedRaw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Legacy fallback: only include records explicitly tagged for this employee
    const legacyLogs = JSON.parse(localStorage.getItem('hrms_attendance_logs') || '[]');
    if (Array.isArray(legacyLogs)) {
      return legacyLogs.filter(r => recordMatchesCurrentEmployee(r, explicitUser));
    }
  } catch {}
  return [];
};

/**
 * Retrieve the current unified attendance record for today (strictly scoped to current employee)
 */
export const getUnifiedTodayAttendance = (explicitUser = null) => {
  const today = getTodayDateYMD();
  const { employeeId, username, storageScope } = getCurrentEmployeeIdentity(explicitUser);

  try {
    if (employeeId || username) {
      const scopedCurrent = localStorage.getItem(`hrms_user_today_punch_${storageScope}`);
      if (scopedCurrent) {
        const parsed = JSON.parse(scopedCurrent);
        if (parsed.date === today && recordMatchesCurrentEmployee(parsed, explicitUser)) {
          return parsed;
        }
      }

      const userSpecific = localStorage.getItem(`hrms_today_punch_${today}_${storageScope}`);
      if (userSpecific) {
        const parsed = JSON.parse(userSpecific);
        if (parsed.date === today && recordMatchesCurrentEmployee(parsed, explicitUser)) {
          return parsed;
        }
      }

      const logs = getCurrentUserAttendanceLogs(explicitUser);
      const found = logs.find(r => (r.date || '').split('T')[0] === today);
      if (found) {
        return found;
      }
    }
  } catch {}

  const activeShift = getCurrentUserTodayShift(explicitUser);
  return {
    date: today,
    employeeId: employeeId || undefined,
    employeeUsername: username || undefined,
    checkIn: null,
    checkOut: null,
    status: 'NOT_CHECKED_IN',
    shiftCode: activeShift.code,
    shiftName: activeShift.name,
    workingHours: 0,
    overtimeHours: 0
  };
};
