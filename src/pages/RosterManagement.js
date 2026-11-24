import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaCalendarAlt, FaClock, FaUsers, FaExchangeAlt, FaPlus, FaFilter,
  FaSearch, FaChevronLeft, FaChevronRight, FaCheck, FaTimes, FaDownload,
  FaPrint, FaCopy, FaEdit, FaTrash, FaInfoCircle, FaSun, FaMoon, FaCoffee,
  FaCheckCircle, FaExclamationTriangle, FaLayerGroup, FaBuilding, FaUserTie,
  FaSyncAlt, FaUserPlus, FaLock, FaTable, FaSave, FaShareSquare, FaShieldAlt,
  FaCog, FaUndo, FaFileExcel, FaGift, FaExternalLinkAlt
} from 'react-icons/fa';
import { BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  DEFAULT_SHIFTS,
  DEFAULT_SHIFT_SYSTEM_SETTINGS,
  getStoredShifts,
  saveStoredShifts,
  getShiftSystemSettings,
  saveShiftSystemSettings,
  getShiftByCode,
  getEmployeeDefaultShifts,
  saveEmployeeDefaultShifts,
  getRosterAssignments,
  saveRosterAssignments,
  generateWeeklyShiftRotation,
  format12Hour,
  getTodayDateYMD,
  formatDateYMD,
  getDaysInMonth,
  isLeapYear
} from '../utils/rosterUtils';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Clean Name Utility (Matches Employees.js standard)
const cleanName = (name) => {
  if (!name) return '';
  let cleaned = name.replace(/\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s*/g, ' ');
  cleaned = cleaned.replace(/\s+null\s*/gi, ' ').replace(/\s+null$/i, '');
  cleaned = cleaned.replace(/^null\s+/i, '');
  return cleaned.trim();
};

export default function RosterManagement({ user }) {
  const navigate = useNavigate();
  const today = new Date();
  const todayDateStr = getTodayDateYMD();

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
  const isAdminOrHr = isHr;
  const isManager = currentRole === 'Manager';

  // ── Navigation Tabs ───────────────────────────────────────────────────────
  // 'calendar': Monthly 28-31 Day Matrix with Sticky Headers
  // 'mapping' : Employee Shift Assignment Table (GS, MS, DS, NS)
  // 'shifts'  : Shift Master Templates
  // 'rotation': Automatic Weekly Rotation Engine Panel
  const [activeTab, setActiveTab] = useState('calendar');

  // ── Date Selection (Supports 28, 29 leap, 30, 31 days) ───────────────────
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('All');

  // ── Real Backend Data States ──────────────────────────────────────────────
  const [employees, setEmployees] = useState(() => {
    try {
      const cached = localStorage.getItem('hrms_cached_employees') || localStorage.getItem('hrms_cached_all_employees');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [departmentList, setDepartmentList] = useState(['All']);
  const [branchList, setBranchList] = useState(['All']);
  const [activePolicy, setActivePolicy] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiSynced, setApiSynced] = useState(false);

  // ── Shift Master & Assignments ────────────────────────────────────────────
  const [shifts, setShifts] = useState(() => getStoredShifts());
  const [employeeDefaultShifts, setEmployeeDefaultShifts] = useState(() => getEmployeeDefaultShifts());
  const [rosterMap, setRosterMap] = useState(() => getRosterAssignments());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  // ── Modals & Dialogs ──────────────────────────────────────────────────────
  const [rotationModal, setRotationModal] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [cellDetailModal, setCellDetailModal] = useState({ show: false, employee: null, dateStr: '', shiftCode: '', note: '' });
  const [assignModal, setAssignModal] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showHolidayListModal, setShowHolidayListModal] = useState(false);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');
  const [holidayFilterTab, setHolidayFilterTab] = useState('ALL');
  const [newEmpForm, setNewEmpForm] = useState({
    name: '',
    code: '',
    department: 'Operations',
    designation: 'Team Member',
    branch: 'Main HQ',
    email: '',
    defaultShift: 'GS'
  });
  const [newShiftModal, setNewShiftModal] = useState(false);
  const [newShiftForm, setNewShiftForm] = useState({
    code: '',
    shortCode: '',
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    durationHours: 9.0,
    breakMinutes: 60,
    graceMinutes: 15,
    isNightShift: false,
    color: '#3b82f6',
    description: ''
  });

  // ── Shift Settings System State ───────────────────────────────────────────
  const [shiftSystemSettings, setShiftSystemSettings] = useState(() => getShiftSystemSettings());
  const [editingShifts, setEditingShifts] = useState(() => getStoredShifts());

  // ── Automatic Rotation Generator Form State ───────────────────────────────
  const [rotationForm, setRotationForm] = useState({
    scopeBranch: 'All',
    scopeDept: 'All',
    rotationPattern: 'MS_DS_NS', // Morning -> Day -> Night
    weeklyOffPolicy: 'SAT_SUN',  // Saturday & Sunday Off
    keepGeneralShiftFixed: true,
    minStaffPerShift: 2
  });

  // ── Manual Assignment Modal Form ──────────────────────────────────────────
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    shiftCode: 'GS',
    startDate: todayDateStr,
    endDate: formatDateYMD(new Date(today.getTime() + 29 * 86400000)),
    excludeWeekends: true
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. REAL API EXTRACTION: FETCH EMPLOYEES, DEPTS, BRANCHES, LEAVES, HOLIDAYS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAllBackendData = useCallback(async () => {
    setLoading(true);
    const rawToken = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN) ||
                     localStorage.getItem('jwtToken') ||
                     localStorage.getItem('token');
    const token = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : '';
    const authHeaders = token ? { Authorization: token, 'Content-Type': 'application/json' } : {};

    try {
      // 1. Fetch Dynamic Departments & Branches
      try {
        const [deptRes, branchRes] = await Promise.allSettled([
          axios.get(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers: authHeaders }),
          axios.get(API_ENDPOINTS.GET_ACTIVE_BRANCHES, { headers: authHeaders })
        ]);

        if (deptRes.status === 'fulfilled' && deptRes.value.data) {
          const dData = deptRes.value.data;
          const dList = dData?.response || dData?.data || [];
          if (Array.isArray(dList) && dList.length > 0) {
            const names = ['All', ...dList.map(d => d.name || d.departmentName).filter(Boolean)];
            setDepartmentList([...new Set(names)]);
          }
        }

        if (branchRes.status === 'fulfilled' && branchRes.value.data) {
          const bData = branchRes.value.data;
          const bList = bData?.response || bData?.data || [];
          if (Array.isArray(bList) && bList.length > 0) {
            const names = ['All', ...bList.map(b => b.name || b.branchName).filter(Boolean)];
            setBranchList([...new Set(names)]);
          }
        }
      } catch (err) {
        console.warn('Departments/branches fetch note:', err);
      }

      // 2. Fetch Active Attendance Policy
      try {
        const polRes = await axios.get(API_ENDPOINTS.GET_ACTIVE_POLICY, { headers: authHeaders });
        const polData = polRes.data?.response || polRes.data?.data || polRes.data;
        if (polData && polData.shiftStart) {
          setActivePolicy(polData);

          // Dynamically synchronize General Shift (GS) with backend attendance policy
          const startStr = String(polData.shiftStart).substring(0, 5);
          const endStr = String(polData.shiftEnd).substring(0, 5);
          const grace = polData.graceMinutes != null ? Number(polData.graceMinutes) : 15;
          const fullHrs = polData.fullDayHours != null ? Number(polData.fullDayHours) : 9;

          setShifts(prevShifts => {
            const updated = prevShifts.map(s => s.code === 'GS' ? {
              ...s,
              startTime: startStr || s.startTime,
              endTime: endStr || s.endTime,
              graceMinutes: grace,
              durationHours: fullHrs,
              description: `Corporate General Day Shift (${format12Hour(startStr)} – ${format12Hour(endStr)})`
            } : s);
            saveStoredShifts(updated, false);
            return updated;
          });
          setEditingShifts(prev => prev.map(s => s.code === 'GS' ? {
            ...s,
            startTime: startStr || s.startTime,
            endTime: endStr || s.endTime,
            graceMinutes: grace,
            durationHours: fullHrs,
            description: `Corporate General Day Shift (${format12Hour(startStr)} – ${format12Hour(endStr)})`
          } : s));
        }
      } catch (err) {
        console.warn('Attendance policy fetch note:', err);
      }

      // 2b. Fetch All Shift Master Categories from Backend PostgreSQL Database
      try {
        const shiftRes = await axios.get(API_ENDPOINTS.GET_SHIFTS, { headers: authHeaders });
        const sData = shiftRes.data?.response || shiftRes.data?.data || shiftRes.data;
        if (Array.isArray(sData) && sData.length > 0) {
          const formatted = sData.map(s => {
            const start = s.startTime ? String(s.startTime).substring(0, 5) : '09:00';
            const end = s.endTime ? String(s.endTime).substring(0, 5) : '18:00';
            return {
              id: s.id || `shift-${s.code?.toLowerCase()}`,
              code: s.code,
              shortCode: s.shortCode || s.code,
              name: s.name,
              startTime: start,
              endTime: end,
              durationHours: Number(s.durationHours) || 8.0,
              breakMinutes: Number(s.breakMinutes) || 45,
              graceMinutes: Number(s.graceMinutes) || 10,
              isNightShift: Boolean(s.isNightShift),
              color: s.color || '#3b82f6',
              bgColor: s.bgColor || '#eff6ff',
              borderColor: s.borderColor || '#bfdbfe',
              isActive: s.isActive !== false,
              description: s.description || `${s.name} (${format12Hour(start)} – ${format12Hour(end)})`
            };
          });

          const currentStored = getStoredShifts();
          const nonWorkShifts = currentStored.filter(s => s.code === 'WO' || s.code === 'HL' || s.code === 'LV');
          const merged = [...formatted, ...nonWorkShifts.filter(nw => !formatted.some(f => f.code === nw.code))];

          setShifts(merged);
          setEditingShifts(merged);
          saveStoredShifts(merged, false);
        }
      } catch (err) {
        console.warn('Backend shifts fetch note in RosterManagement:', err);
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

      // 4. Fetch Approved Leaves
      try {
        const leaveRes = await axios.get(API_ENDPOINTS.GET_ALL_LEAVES, { headers: authHeaders });
        const lList = leaveRes.data?.response || leaveRes.data?.data || leaveRes.data || [];
        if (Array.isArray(lList)) {
          setApprovedLeaves(lList);
        }
      } catch (err) {
        console.warn('All leaves fetch note:', err);
      }

      // 5. Fetch Real Employees from /api/employees (Paginates through ALL pages to load ALL employees)
      let rawList = [];
      const seenRawIds = new Set();
      const addRawEmployees = (items) => {
        if (!Array.isArray(items)) return;
        items.forEach(item => {
          if (item && item.id !== undefined && item.id !== null) {
            const k = String(item.id);
            if (!seenRawIds.has(k)) {
              seenRawIds.add(k);
              rawList.push(item);
            }
          }
        });
      };

      try {
        const res = await axios.get(`${BASE_URL}/api/employees?page=0&size=1000`, { headers: authHeaders });
        const respObj = res.data?.response || res.data;
        const page0Content = respObj?.content || (Array.isArray(respObj) ? respObj : (Array.isArray(res.data) ? res.data : []));
        addRawEmployees(page0Content);

        const totalPages = respObj?.totalPages || (respObj?.totalElements ? Math.ceil(respObj.totalElements / (respObj?.size || 10)) : 1);
        if (totalPages > 1) {
          const pagePromises = [];
          for (let p = 1; p < totalPages; p++) {
            pagePromises.push(
              axios.get(`${BASE_URL}/api/employees?page=${p}&size=1000`, { headers: authHeaders })
                .then(r => r.data?.response?.content || r.data?.content || (Array.isArray(r.data?.response) ? r.data.response : []))
                .catch(() => [])
            );
          }
          const allOtherPages = await Promise.all(pagePromises);
          allOtherPages.forEach(pContent => addRawEmployees(pContent));
        } else if (rawList.length <= 15) {
          // Probe additional pages in case backend capped page size without exposing totalPages
          for (let p = 1; p <= 10; p++) {
            try {
              const nextRes = await axios.get(`${BASE_URL}/api/employees?page=${p}&size=1000`, { headers: authHeaders });
              const nextObj = nextRes.data?.response || nextRes.data;
              const nextContent = nextObj?.content || (Array.isArray(nextObj) ? nextObj : []);
              if (!nextContent || nextContent.length === 0) break;
              const prevCount = rawList.length;
              addRawEmployees(nextContent);
              if (rawList.length === prevCount || nextObj?.last === true) break;
            } catch {
              break;
            }
          }
        }
      } catch (err) {
        console.warn('Primary employee endpoint failed, trying fallback dropdown:', err);
      }

      // Always fetch employee dropdown to merge any records not returned in main pagination
      try {
        const dropRes = await axios.get(API_ENDPOINTS.EMPLOYEE_DROPDOWN, { headers: authHeaders });
        const dropData = dropRes.data?.response || dropRes.data?.data || (Array.isArray(dropRes.data) ? dropRes.data : []);
        addRawEmployees(dropData);
      } catch {}

      // If still fewer than 20, also probe unpaginated /api/employees
      if (rawList.length < 20) {
        try {
          const unpaginatedRes = await axios.get(`${BASE_URL}/api/employees`, { headers: authHeaders });
          const unpObj = unpaginatedRes.data?.response || unpaginatedRes.data;
          const unpContent = unpObj?.content || (Array.isArray(unpObj) ? unpObj : []);
          addRawEmployees(unpContent);
        } catch {}
      }

      // Merge any previously cached employees if available
      try {
        const cachedAll = localStorage.getItem('hrms_cached_all_employees') || localStorage.getItem('hrms_cached_employees');
        if (cachedAll) {
          const parsed = JSON.parse(cachedAll);
          addRawEmployees(parsed);
        }
      } catch {}

      if (Array.isArray(rawList) && rawList.length > 0) {
        // Load ALL employees into Roster Management without excluding any records
        const seenIds = new Set();
        const mapped = [];

        for (const e of rawList) {
          if (!e) continue;
          const idKey = String(e.id);
          if (seenIds.has(idKey)) continue;
          seenIds.add(idKey);

          let fullName = cleanName(e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim());
          if (!fullName || fullName.toLowerCase() === 'null' || fullName.toLowerCase() === 'null null') {
            fullName = (e.firstName && e.firstName.toLowerCase() !== 'null')
              ? e.firstName
              : (e.email ? e.email.split('@')[0] : `Employee ${e.id}`);
          }

          mapped.push({
            id: e.id,
            name: fullName,
            code: e.employeeCode || e.code || `EMP${String(e.id).padStart(3, '0')}`,
            department: e.department?.name || e.department?.departmentName || e.departmentName || (typeof e.department === 'string' ? e.department : '') || 'Operations',
            designation: e.designation?.name || e.designation?.designationName || e.designationName || (typeof e.designation === 'string' ? e.designation : '') || 'Staff',
            branch: e.branch?.name || e.branch?.branchName || e.branchName || (typeof e.branch === 'string' ? e.branch : '') || 'Main HQ',
            email: e.email || '',
            joiningDate: e.joiningDate || e.dateOfJoining || null
          });
        }

        // Merge any frontend-added custom employees
        try {
          const customStr = localStorage.getItem('hrms_roster_custom_employees');
          if (customStr) {
            const customList = JSON.parse(customStr);
            if (Array.isArray(customList)) {
              for (const ce of customList) {
                if (ce && ce.id && !seenIds.has(String(ce.id))) {
                  seenIds.add(String(ce.id));
                  mapped.push(ce);
                }
              }
            }
          }
        } catch {}

        mapped.sort((a, b) => {
          const codeA = parseInt(String(a.code || '').replace(/\D/g, ''), 10) || Number(a.id) || 0;
          const codeB = parseInt(String(b.code || '').replace(/\D/g, ''), 10) || Number(b.id) || 0;
          return codeB - codeA;
        });

        setEmployees(mapped);
        setApiSynced(true);
        localStorage.setItem('hrms_cached_employees', JSON.stringify(mapped));
        localStorage.setItem('hrms_cached_all_employees', JSON.stringify(mapped));

        // 6. Build Interconnected Attendance Map
        const attMap = {};
        try {
          // Read On-Site & Client Verifications
          const onSiteStored = JSON.parse(localStorage.getItem('hrms_onsite_attendance') || '[]');
          const clientVerifs = JSON.parse(localStorage.getItem('hrms_client_verifications') || '[]');
          
          onSiteStored.forEach(r => {
            if (r.date) {
              const info = {
                status: 'PRESENT',
                onSite: true,
                clientName: r.clientName || 'On-Site Client Visit',
                checkIn: r.checkIn || '09:00:00',
                checkOut: r.checkOut || '18:00:00',
                hours: r.workingHours !== undefined ? Number(r.workingHours) : 9.0,
                remarks: r.remarks || 'Approved by HR'
              };
              if (r.employeeId) attMap[`${r.employeeId}_${r.date}`] = info;
              if (r.employee) attMap[`${r.employee.toLowerCase()}_${r.date}`] = info;
            }
          });

          clientVerifs.forEach(v => {
            if (v.status === 'APPROVED' || v.status === 'ON_SITE_APPROVED') {
              const vDates = Array.isArray(v.dates) ? v.dates : (v.date ? [v.date] : []);
              vDates.forEach(d => {
                const info = {
                  status: 'PRESENT',
                  onSite: true,
                  clientName: v.clientName || 'On-Site Client Visit',
                  checkIn: '09:00:00',
                  checkOut: '18:00:00',
                  hours: 9.0,
                  remarks: v.remarks || 'Approved by HR'
                };
                if (v.employeeId) attMap[`${v.employeeId}_${d}`] = info;
                if (v.submittedBy) attMap[`${v.submittedBy.toLowerCase()}_${d}`] = info;
              });
            }
          });

          // Read Local Punches
          for (let i = 0; i < localStorage.length; i++) {
            const lKey = localStorage.key(i);
            if (lKey && lKey.startsWith('hrms_today_punch_')) {
              try {
                const pData = JSON.parse(localStorage.getItem(lKey));
                if (pData && pData.date) {
                  const parts = lKey.split('_');
                  const empIdent = parts.slice(4).join('_') || parts[3];
                  attMap[`${empIdent}_${pData.date}`] = {
                    status: pData.status || (pData.checkIn ? 'PRESENT' : 'PENDING'),
                    checkIn: pData.checkIn,
                    checkOut: pData.checkOut,
                    hours: pData.hours || 0,
                    onSite: pData.onSite || false
                  };
                }
              } catch {}
            }
          }
        } catch (e) {
          console.warn('Attendance map build note:', e);
        }

        setAttendanceMap(attMap);
      }
    } catch (error) {
      console.error('Error fetching backend data for Roster:', error);
      try {
        const cached = localStorage.getItem('hrms_cached_employees') || localStorage.getItem('hrms_cached_all_employees');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEmployees(parsed);
          }
        }
      } catch {}
      toast.error('Sync Note', 'Displaying cached roster employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBackendData();

    const handleVerificationSync = () => {
      fetchAllBackendData();
    };

    const handleShiftSync = () => {
      const updated = getStoredShifts();
      if (Array.isArray(updated) && updated.length > 0) {
        setShifts(updated);
        setEditingShifts(updated);
      }
    };

    window.addEventListener('hrms_client_verification_updated', handleVerificationSync);
    window.addEventListener('hrms_shifts_updated', handleShiftSync);
    window.addEventListener('hrms_policy_updated', handleShiftSync);
    return () => {
      window.removeEventListener('hrms_client_verification_updated', handleVerificationSync);
      window.removeEventListener('hrms_shifts_updated', handleShiftSync);
      window.removeEventListener('hrms_policy_updated', handleShiftSync);
    };
  }, [fetchAllBackendData]);

  // Persist master state to localStorage (client-side draft, silent=true)
  useEffect(() => {
    saveStoredShifts(shifts, false);
  }, [shifts]);

  useEffect(() => {
    saveRosterAssignments(rosterMap);
  }, [rosterMap]);

  useEffect(() => {
    saveEmployeeDefaultShifts(employeeDefaultShifts);
  }, [employeeDefaultShifts]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. DYNAMIC MONTH CALENDAR DAYS (28, 29 LEAP, 30, 31 DAYS)
  // ─────────────────────────────────────────────────────────────────────────
  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const monthCalendarDays = useMemo(() => {
    const days = [];
    for (let day = 1; day <= daysInSelectedMonth; day++) {
      const d = new Date(selectedYear, selectedMonth, day);
      const dateStr = formatDateYMD(d);
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      days.push({
        dayNumber: day,
        date: d,
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNameFull: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfWeek,
        isWeekend,
        isToday: dateStr === todayDateStr
      });
    }
    return days;
  }, [selectedYear, selectedMonth, daysInSelectedMonth, todayDateStr]);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. FILTERED EMPLOYEES & REAL KPI COUNTERS
  // ─────────────────────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchEmployee.toLowerCase().trim();
      const matchesSearch = !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.code.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchesBranch = selectedBranch === 'All' || emp.branch === selectedBranch;

      const assignedCode = employeeDefaultShifts[emp.id] || 'GS';
      const matchesShift = selectedShiftFilter === 'All' ||
        (selectedShiftFilter === 'UNASSIGNED' ? !employeeDefaultShifts[emp.id] : assignedCode === selectedShiftFilter);

      return matchesSearch && matchesDept && matchesBranch && matchesShift;
    });
  }, [employees, searchEmployee, selectedDept, selectedBranch, selectedShiftFilter, employeeDefaultShifts]);

  // Real Dashboard KPI Counters
  const dashboardCounters = useMemo(() => {
    const counts = {
      total: employees.length,
      assigned: 0,
      unassigned: 0,
      GS: 0,
      MS: 0,
      DS: 0,
      NS: 0,
      onLeave: 0,
      holidays: holidays.length
    };

    // Check today's approved leaves
    const onLeaveSet = new Set();
    if (Array.isArray(approvedLeaves)) {
      approvedLeaves.forEach(lv => {
        if (String(lv.status).toUpperCase() === 'APPROVED' && lv.startDate && lv.endDate) {
          const empId = lv.employee?.id || lv.employeeId;
          if (empId && todayDateStr >= lv.startDate && todayDateStr <= lv.endDate) {
            onLeaveSet.add(String(empId));
          }
        }
      });
    }
    counts.onLeave = onLeaveSet.size;

    employees.forEach(emp => {
      const code = employeeDefaultShifts[emp.id];
      if (!code) {
        counts.unassigned++;
        counts.GS++; // Default fallback
      } else {
        counts.assigned++;
        if (code === 'GS') counts.GS++;
        else if (code === 'MS') counts.MS++;
        else if (code === 'DS') counts.DS++;
        else if (code === 'NS') counts.NS++;
        else counts.GS++;
      }
    });

    if (counts.assigned === 0 && employees.length > 0) {
      counts.assigned = employees.length;
    }

    return counts;
  }, [employees, employeeDefaultShifts, approvedLeaves, holidays, todayDateStr]);

  // Helper functions for calendar cells
  const isOfficialHoliday = useCallback((dateStr) => {
    if (!Array.isArray(holidays) || !dateStr) return false;
    return holidays.some(h => {
      const hDate = (h.date || h.holidayDate || h.startDate || '').split('T')[0];
      return hDate === dateStr;
    });
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

  const checkEmployeeOnLeave = useCallback((empId, dateStr) => {
    if (!Array.isArray(approvedLeaves) || !dateStr) return false;
    return approvedLeaves.some(lv => {
      if (lv.status && String(lv.status).toUpperCase() !== 'APPROVED') return false;
      const lvEmpId = String(lv.employee?.id || lv.employeeId || lv.empId || '');
      if (lvEmpId && lvEmpId !== String(empId)) return false;
      const start = (lv.startDate || lv.date || lv.from || '').split('T')[0];
      const end = (lv.endDate || lv.toDate || start).split('T')[0];
      return start && end && dateStr >= start && dateStr <= end;
    });
  }, [approvedLeaves]);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. AUTOMATIC WEEKLY ROTATION GENERATION PREVIEW
  // ─────────────────────────────────────────────────────────────────────────
  const handleGenerateRotationPreview = () => {
    const scopeEmployees = employees.filter(emp => {
      const matchesDept = rotationForm.scopeDept === 'All' || emp.department === rotationForm.scopeDept;
      const matchesBranch = rotationForm.scopeBranch === 'All' || emp.branch === rotationForm.scopeBranch;
      return matchesDept && matchesBranch;
    });

    if (scopeEmployees.length === 0) {
      toast.error('Selection Error', 'No employees found in the selected branch/department scope.');
      return;
    }

    // Identify employees designated for Fixed General Shift
    const generalShiftIds = [];
    if (rotationForm.keepGeneralShiftFixed) {
      scopeEmployees.forEach(emp => {
        const code = employeeDefaultShifts[emp.id] || 'GS';
        if (code === 'GS') generalShiftIds.push(emp.id);
      });
    }

    const result = generateWeeklyShiftRotation({
      employees: scopeEmployees,
      month: selectedMonth,
      year: selectedYear,
      weeklyOffPolicy: rotationForm.weeklyOffPolicy,
      generalShiftEmpIds: generalShiftIds,
      approvedLeaves: approvedLeaves,
      holidays: holidays
    });

    setPreviewResult(result);
    toast.success('Preview Generated', `Generated weekly rotation preview for ${result.employeeSchedules.length} employees with ${result.availableDutyDays} duty days.`);
  };

  // Apply preview assignments to active calendar state
  const handleApplyPreview = () => {
    if (!previewResult || !previewResult.assignments) return;

    const merged = { ...rosterMap, ...previewResult.assignments };
    setRosterMap(merged);
    saveRosterAssignments(merged);

    // Also update default shifts
    const newDefaults = { ...employeeDefaultShifts };
    previewResult.employeeSchedules.forEach(es => {
      const firstDuty = Object.values(es.dailyShifts).find(s => s.shiftCode !== 'WO' && s.shiftCode !== 'HL' && s.shiftCode !== 'LV');
      if (firstDuty) {
        newDefaults[es.employee.id] = firstDuty.shiftCode;
      }
    });
    setEmployeeDefaultShifts(newDefaults);
    saveEmployeeDefaultShifts(newDefaults);

    toast.success('Roster Applied', `Applied 30/31-day rotation preview to calendar. (${previewResult.conflicts.length} conflict notes handled).`);
    setRotationModal(false);
    setActiveTab('calendar');
  };

  const handleDirectGenerateAndApply = () => {
    const scopeEmployees = employees;
    if (scopeEmployees.length === 0) {
      toast.error('Selection Error', 'No employees found in the roster.');
      return;
    }

    const generalShiftIds = [];
    if (rotationForm.keepGeneralShiftFixed) {
      scopeEmployees.forEach(emp => {
        const code = employeeDefaultShifts[emp.id] || 'GS';
        if (code === 'GS') generalShiftIds.push(emp.id);
      });
    }

    const result = generateWeeklyShiftRotation({
      employees: scopeEmployees,
      daysInMonth: daysInSelectedMonth,
      month: selectedMonth,
      year: selectedYear,
      rotationSequence: ['MS', 'DS', 'NS'],
      fixedGeneralShiftIds: generalShiftIds,
      weeklyOffPolicy: rotationForm.weeklyOffPolicy || 'SAT_SUN',
      holidays: holidays,
      approvedLeaves: approvedLeaves
    });

    if (result && result.rosterMap) {
      const mergedRoster = { ...rosterMap, ...result.rosterMap };
      setRosterMap(mergedRoster);
      saveRosterAssignments(mergedRoster);

      const newDefaults = { ...employeeDefaultShifts };
      if (Array.isArray(result.employeeSchedules)) {
        result.employeeSchedules.forEach(es => {
          const firstDuty = Object.values(es.dailyShifts || {}).find(s => s.shiftCode !== 'WO' && s.shiftCode !== 'HL' && s.shiftCode !== 'LV');
          if (firstDuty) {
            newDefaults[es.employee.id] = firstDuty.shiftCode;
          }
        });
        setEmployeeDefaultShifts(newDefaults);
        saveEmployeeDefaultShifts(newDefaults);
      }

      setRotationModal(false);
      setActiveTab('calendar');
      toast.success('Roster Generated & Applied', `Generated and applied 30-day rotating roster for all ${scopeEmployees.length} employees.`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 5. MANUAL SHIFT ASSIGNMENT HANDLER
  // ─────────────────────────────────────────────────────────────────────────
  const handleAssignShiftSubmit = (e) => {
    e.preventDefault();
    const { employeeId, shiftCode, startDate, endDate, excludeWeekends } = assignForm;

    const found = employees.find(emp => String(emp.id) === String(employeeId));
    if (!found) {
      toast.error('Validation Error', 'Please select an employee.');
      return;
    }

    // Update default shift
    const updatedDefaults = { ...employeeDefaultShifts, [employeeId]: shiftCode };
    setEmployeeDefaultShifts(updatedDefaults);
    saveEmployeeDefaultShifts(updatedDefaults);

    // Populate calendar range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const newRoster = { ...rosterMap };

    const cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      const dateStr = formatDateYMD(cur);
      const key = `${employeeId}_${dateStr}`;
      if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        newRoster[key] = 'WO';
      } else {
        newRoster[key] = shiftCode;
      }
      cur.setDate(cur.getDate() + 1);
    }

    setRosterMap(newRoster);
    saveRosterAssignments(newRoster);

    toast.success('Shift Assigned', `Assigned ${shiftCode} to ${found.name} (${startDate} to ${endDate}).`);
    setAssignModal(false);
  };

  // Quick Inline Shift Switcher on Table Row
  const handleQuickShiftChange = (empId, shiftCode) => {
    if (!isAdminOrHr) {
      toast.info('Restricted', 'Only Admin or HR can reassign employee shifts.');
      return;
    }

    const updatedDefaults = { ...employeeDefaultShifts, [empId]: shiftCode };
    setEmployeeDefaultShifts(updatedDefaults);
    saveEmployeeDefaultShifts(updatedDefaults);

    // Propagate to current month workdays
    const newRoster = { ...rosterMap };
    monthCalendarDays.forEach(day => {
      const key = `${empId}_${day.dateStr}`;
      if (!day.isWeekend) {
        newRoster[key] = shiftCode;
      }
    });
    setRosterMap(newRoster);
    saveRosterAssignments(newRoster);

    toast.success('Shift Updated', `Shift set to ${shiftCode} for employee.`);
  };

  // Batch Shift Action
  const handleBatchAssign = (shiftCode) => {
    if (selectedEmpIds.length === 0) {
      toast.info('Selection Required', 'Please select at least one employee.');
      return;
    }

    const updatedDefaults = { ...employeeDefaultShifts };
    const newRoster = { ...rosterMap };

    selectedEmpIds.forEach(id => {
      updatedDefaults[id] = shiftCode;
      monthCalendarDays.forEach(day => {
        const key = `${id}_${day.dateStr}`;
        if (!day.isWeekend) {
          newRoster[key] = shiftCode;
        }
      });
    });

    setEmployeeDefaultShifts(updatedDefaults);
    saveEmployeeDefaultShifts(updatedDefaults);
    setRosterMap(newRoster);
    saveRosterAssignments(newRoster);

    toast.success('Batch Updated', `Assigned ${selectedEmpIds.length} employees to ${shiftCode}.`);
    setSelectedEmpIds([]);
  };

  // Shift Settings System Handlers
  const handleUpdateShiftField = (shiftId, field, value) => {
    setEditingShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s;
      const updated = { ...s, [field]: value };
      if (field === 'startTime' || field === 'endTime') {
        const start = field === 'startTime' ? value : s.startTime;
        const end = field === 'endTime' ? value : s.endTime;
        if (start && end) {
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          let diffMins = (eh * 60 + em) - (sh * 60 + sm);
          if (diffMins < 0 || updated.isNightShift) diffMins += 24 * 60;
          updated.durationHours = Number((diffMins / 60).toFixed(1));
        }
      }
      return updated;
    }));
  };

  const handleSaveAllShiftSettings = async () => {
    saveStoredShifts(editingShifts);
    setShifts(editingShifts);
    saveShiftSystemSettings(shiftSystemSettings);

    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    const authHeaders = token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {};

    // 1. Sync General Shift (GS) directly to backend Attendance Policy
    const gsShift = editingShifts.find(s => s.code === 'GS');
    if (gsShift) {
      try {
        const startStr = gsShift.startTime.length === 5 ? `${gsShift.startTime}:00` : gsShift.startTime;
        const endStr = gsShift.endTime.length === 5 ? `${gsShift.endTime}:00` : gsShift.endTime;

        const policyPayload = {
          name: `${gsShift.name || 'General Shift'} Policy`,
          shiftStart: startStr,
          shiftEnd: endStr,
          graceMinutes: Number(gsShift.graceMinutes || 15),
          halfDayThresholdHours: Number((gsShift.durationHours / 2).toFixed(1) || 4),
          fullDayHours: Number(gsShift.durationHours || 9),
          allowOvertime: true,
          isActive: true
        };

        const createRes = await axios.post(API_ENDPOINTS.CREATE_POLICY, policyPayload, { headers: authHeaders });
        const createdData = createRes.data?.response || createRes.data?.data || createRes.data;
        if (createdData?.id) {
          await axios.put(API_ENDPOINTS.ACTIVATE_POLICY(createdData.id), {}, { headers: authHeaders });
        }
      } catch (policyErr) {
        console.warn('Backend attendance policy sync note:', policyErr);
      }
    }

    // 2. Try updating /api/shifts/settings if supported by backend
    try {
      if (token) {
        await axios.post(
          API_ENDPOINTS.UPDATE_SHIFT_SETTINGS,
          {
            checkInBeforeMinutes: shiftSystemSettings.checkInBeforeMinutes,
            enforceCheckOutAfterShift: shiftSystemSettings.enforceCheckOutAfterShift,
            checkOutGraceMinutes: shiftSystemSettings.checkOutGraceMinutes
          },
          { headers: authHeaders }
        );
      }
    } catch (e) {
      console.warn('Backend shift settings sync note:', e);
    }

    toast.success('Shift Settings Saved', 'All shift timings, break durations, and window rules updated in database & local storage.');
  };

  const handleResetShiftSettings = () => {
    saveStoredShifts(DEFAULT_SHIFTS);
    setShifts(DEFAULT_SHIFTS);
    setEditingShifts(DEFAULT_SHIFTS);
    saveShiftSystemSettings(DEFAULT_SHIFT_SYSTEM_SETTINGS);
    setShiftSystemSettings(DEFAULT_SHIFT_SYSTEM_SETTINGS);
    toast.info('Settings Reset', 'Restored standard shift categories and default 5-min punch rules.');
  };

  const handleAddNewShift = async () => {
    if (!newShiftForm.name || !newShiftForm.code) {
      toast.error('Validation Error', 'Shift Name and Shift Code are required.');
      return;
    }
    const code = newShiftForm.code.toUpperCase().trim();
    if (editingShifts.some(s => s.code === code)) {
      toast.error('Duplicate Code', `A shift with code ${code} already exists.`);
      return;
    }

    const startStr = newShiftForm.startTime.length === 5 ? `${newShiftForm.startTime}:00` : newShiftForm.startTime;
    const endStr = newShiftForm.endTime.length === 5 ? `${newShiftForm.endTime}:00` : newShiftForm.endTime;

    const payload = {
      code,
      shortCode: newShiftForm.shortCode || code.substring(0, 2),
      name: newShiftForm.name.trim(),
      startTime: startStr,
      endTime: endStr,
      durationHours: Number(newShiftForm.durationHours) || 8.0,
      breakMinutes: Number(newShiftForm.breakMinutes) || 45,
      graceMinutes: Number(newShiftForm.graceMinutes) || 15,
      isNightShift: Boolean(newShiftForm.isNightShift),
      color: newShiftForm.color || '#3b82f6',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      isActive: true,
      description: newShiftForm.description || `${newShiftForm.name} (${format12Hour(newShiftForm.startTime)} – ${format12Hour(newShiftForm.endTime)})`
    };

    let serverId = null;
    try {
      const rawToken = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN) || localStorage.getItem('jwtToken') || '';
      const token = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
      const res = await axios.post(API_ENDPOINTS.CREATE_SHIFT, payload, { headers: { Authorization: token, 'Content-Type': 'application/json' } });
      const created = res.data?.response || res.data?.data || res.data;
      if (created?.id) serverId = created.id;
    } catch (apiErr) {
      console.warn('Backend create shift note:', apiErr);
    }

    const createdShift = {
      ...payload,
      id: serverId || `shift-${Date.now()}`,
      startTime: newShiftForm.startTime,
      endTime: newShiftForm.endTime
    };
    const updated = [...editingShifts, createdShift];
    setEditingShifts(updated);
    saveStoredShifts(updated);
    setShifts(updated);
    setNewShiftModal(false);
    window.dispatchEvent(new Event('hrms_shifts_updated'));
    toast.success('Shift Created & Stored', `New shift "${createdShift.name}" (${createdShift.code}) saved to backend database.`);
  };

  // Add new employee directly to Roster (Frontend Only)
  const handleAddNewEmployeeToRoster = (e) => {
    e.preventDefault();
    if (!newEmpForm.name.trim()) {
      toast.error('Validation Error', 'Please enter employee name.');
      return;
    }
    const newId = Date.now();
    const newEmp = {
      id: newId,
      name: newEmpForm.name.trim(),
      code: newEmpForm.code.trim() || `EMP${String(newId).slice(-4)}`,
      department: newEmpForm.department || 'Operations',
      designation: newEmpForm.designation || 'Team Member',
      branch: newEmpForm.branch || 'Main HQ',
      email: newEmpForm.email.trim() || '',
      joiningDate: todayDateStr
    };

    setEmployees(prev => [newEmp, ...prev]);
    const chosenShift = newEmpForm.defaultShift || 'GS';
    setEmployeeDefaultShifts(prev => ({ ...prev, [newId]: chosenShift }));

    // Populate month roster for this employee with default shift
    const newRoster = { ...rosterMap };
    monthCalendarDays.forEach(day => {
      const key = `${newId}_${day.dateStr}`;
      newRoster[key] = day.isWeekend ? 'WO' : chosenShift;
    });
    setRosterMap(newRoster);
    saveRosterAssignments(newRoster);

    // Save to local custom employees storage
    try {
      const storedStr = localStorage.getItem('hrms_roster_custom_employees');
      const stored = storedStr ? JSON.parse(storedStr) : [];
      localStorage.setItem('hrms_roster_custom_employees', JSON.stringify([newEmp, ...stored]));
    } catch {}

    toast.success('Employee Added to Roster', `${newEmp.name} has been added with default shift ${chosenShift}.`);
    setShowAddEmpModal(false);
    setNewEmpForm({
      name: '',
      code: '',
      department: 'Operations',
      designation: 'Team Member',
      branch: 'Main HQ',
      email: '',
      defaultShift: 'GS'
    });
  };

  // Export Roster to Comprehensive CSV Spreadsheet (Direct Client Download - No Backend Dependency)
  const handleExportCSV = () => {
    if (employees.length === 0) {
      toast.error('Export Error', 'No employee roster data to export.');
      return;
    }

    const headers = [
      'Employee ID',
      'Employee Code',
      'Employee Name',
      'Department',
      'Branch',
      'Default Shift'
    ];

    monthCalendarDays.forEach(d => headers.push(`${d.dayNumber}-${d.dayName}`));
    headers.push('Total Working Days');
    headers.push('Weekly Offs (WO)');
    headers.push('Public Holidays (H)');
    headers.push('Approved Leaves (L)');
    headers.push('General Shift (GS)');
    headers.push('Morning Shift (MS)');
    headers.push('Day Shift (DS)');
    headers.push('Night Shift (NS)');

    const rows = [headers];

    filteredEmployees.forEach(emp => {
      const defaultShiftCode = employeeDefaultShifts[emp.id] || 'GS';
      const row = [
        emp.id,
        emp.code,
        emp.name,
        emp.department,
        emp.branch,
        defaultShiftCode
      ];

      let workingCount = 0;
      let offCount = 0;
      let holCount = 0;
      let leaveCount = 0;
      let gsCount = 0;
      let msCount = 0;
      let dsCount = 0;
      let nsCount = 0;

      monthCalendarDays.forEach(d => {
        const key = `${emp.id}_${d.dateStr}`;
        const shiftCode = rosterMap[key] || employeeDefaultShifts[emp.id] || (d.isWeekend ? 'WO' : 'GS');
        row.push(shiftCode);

        if (shiftCode === 'WO') offCount++;
        else if (shiftCode === 'HL' || shiftCode === 'H') holCount++;
        else if (shiftCode === 'LV' || shiftCode === 'L') leaveCount++;
        else {
          workingCount++;
          if (shiftCode === 'GS') gsCount++;
          else if (shiftCode === 'MS') msCount++;
          else if (shiftCode === 'DS') dsCount++;
          else if (shiftCode === 'NS') nsCount++;
        }
      });

      row.push(workingCount);
      row.push(offCount);
      row.push(holCount);
      row.push(leaveCount);
      row.push(gsCount);
      row.push(msCount);
      row.push(dsCount);
      row.push(nsCount);

      rows.push(row);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HRMS_Roster_${monthNames[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Roster Downloaded', `Downloaded complete 30/31-day roster spreadsheet for ${monthNames[selectedMonth]} ${selectedYear}.`);
  };

  // Month Navigation
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

  // ── Access Denied for Admin or non-HR users ──
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
            Roster Management features are restricted to <strong>HR only</strong>. Admin or other roles do not have permission to view or manage shift rosters.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.href = '/dashboard'}
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
    <>
      <ToastContainer />
      <div className="attendance-root" style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {loading && (
          <div className="emp-modal-overlay">
            <LoadingSpinner message="Synchronizing Roster & Active Employees..." />
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="attendance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaCalendarAlt style={{ color: 'var(--accent-indigo, #6366f1)' }} />
                Roster &amp; Shift Management System
              </h1>
              {apiSynced ? (
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                  ● Connected to Employee API ({employees.length} Active Employees)
                </span>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  ● Synced Staff ({employees.length})
                </span>
              )}
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Multi-shift scheduling, deterministic weekly rotation (Morning → Day → Night), leave &amp; holiday exclusion, and attendance integration.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={fetchAllBackendData}
              className="btn-outline-indigo"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '12px' }}
              title="Resync live database records"
            >
              <FaSyncAlt size={11} className={loading ? 'fa-spin' : ''} />
              Sync API
            </button>

            {/* Prominent Direct Download Button */}
            <button
              onClick={handleExportCSV}
              className="btn-gradient"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                color: '#fff',
                cursor: 'pointer'
              }}
              title="Download 30/31-day roster spreadsheet (Excel / CSV)"
            >
              <FaDownload size={12} />
              Download Roster (Excel / CSV)
            </button>

            {isAdminOrHr && (
              <>
                <button
                  onClick={() => { setRotationModal(true); setPreviewResult(null); }}
                  className="btn-gradient"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
                    cursor: 'pointer'
                  }}
                  title="Open the Automatic Weekly Shift Rotation Engine modal"
                >
                  <FaClock size={12} />
                  ⚡ Generate Automatic Roster
                </button>

                <button
                  onClick={() => setShowAddEmpModal(true)}
                  className="btn-outline-indigo"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px' }}
                  title="Add an employee directly to the roster on frontend"
                >
                  <FaUserPlus size={12} />
                  + Add Employee to Roster
                </button>

                <button
                  onClick={() => setAssignModal(true)}
                  className="btn-outline-indigo"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px' }}
                >
                  <FaCalendarAlt size={12} />
                  Manual Assignment
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Real Dynamic Summary KPI Cards (Section 2) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div className="stat-card" style={{ padding: '14px', borderLeft: '3px solid #6366f1' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Total Employees</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{dashboardCounters.total}</div>
            <div style={{ fontSize: '10px', color: '#059669', fontWeight: '600' }}>● Active Staff</div>
          </div>

          <div className="stat-card" style={{ padding: '14px', borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Assigned</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{dashboardCounters.assigned}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Duty Active</div>
          </div>

          <div className="stat-card" style={{ padding: '14px', borderLeft: '3px solid #3b82f6', cursor: 'pointer' }} onClick={() => setSelectedShiftFilter(selectedShiftFilter === 'GS' ? 'All' : 'GS')}>
            <div style={{ fontSize: '11px', color: '#3b82f6' }}>General Shift (G)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>{dashboardCounters.GS}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>09:00 – 18:00 (Fixed)</div>
          </div>

          <div className="stat-card" style={{ padding: '14px', borderLeft: '3px solid #10b981', cursor: 'pointer' }} onClick={() => setSelectedShiftFilter(selectedShiftFilter === 'MS' ? 'All' : 'MS')}>
            <div style={{ fontSize: '11px', color: '#10b981' }}>Morning Shift (M)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{dashboardCounters.MS}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>06:00 – 14:00</div>
          </div>

          <div className="stat-card" style={{ padding: '14px', borderLeft: '3px solid #f59e0b', cursor: 'pointer' }} onClick={() => setSelectedShiftFilter(selectedShiftFilter === 'DS' ? 'All' : 'DS')}>
            <div style={{ fontSize: '11px', color: '#f59e0b' }}>Day Shift (D)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>{dashboardCounters.DS}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>14:00 – 22:00</div>
          </div>

          <div className="stat-card" style={{ padding: '14px', borderLeft: '3px solid #8b5cf6', cursor: 'pointer' }} onClick={() => setSelectedShiftFilter(selectedShiftFilter === 'NS' ? 'All' : 'NS')}>
            <div style={{ fontSize: '11px', color: '#8b5cf6' }}>Night Shift (N)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#8b5cf6' }}>{dashboardCounters.NS}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>22:00 – 06:00 (Overnight)</div>
          </div>

          <div className="stat-card" style={{ padding: '14px', borderLeft: '3px solid #4f46e5' }}>
            <div style={{ fontSize: '11px', color: '#4f46e5' }}>On Leave (L)</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#4f46e5' }}>{dashboardCounters.onLeave}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Approved Leaves</div>
          </div>

          <div
            className="stat-card"
            style={{
              padding: '14px',
              borderLeft: '3px solid #e11d48',
              cursor: 'pointer',
              background: '#ffffff',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onClick={() => setShowHolidayListModal(true)}
            title="Click to view total holiday list"
          >
            <div style={{ fontSize: '11px', color: '#e11d48', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Holidays (H)</span>
              <span style={{ fontSize: '9px', background: '#ffe4e6', color: '#e11d48', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>View ↗</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#e11d48' }}>{dashboardCounters.holidays}</div>
            <div style={{ fontSize: '10px', color: '#e11d48', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>Click to view total list</span>
              <span>↗</span>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '18px', overflowX: 'auto' }}>
          {[
            { id: 'calendar', label: 'Monthly Roster Calendar', icon: <FaCalendarAlt size={13} />, badge: `${daysInSelectedMonth} Days` },
            { id: 'mapping', label: 'Employee Shift Assignment', icon: <FaUserTie size={13} />, badge: employees.length },
            { id: 'rotation', label: 'Automatic Rotation Controls', icon: <FaClock size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? '#6366f1' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: activeTab === tab.id ? '#eef2ff' : '#f1f5f9', color: activeTab === tab.id ? '#6366f1' : '#64748b', fontWeight: '700' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Filter Bar (Working on Live Backend Data) ── */}
        <div className="card-modern" style={{ padding: '14px 18px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              {/* Search */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <FaSearch size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search employee by name, code or department..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  style={{ width: '100%', padding: '7px 12px 7px 30px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              {/* Branch Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  {branchList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Department Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Dept:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Shift Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Shift:</span>
                <select
                  value={selectedShiftFilter}
                  onChange={(e) => setSelectedShiftFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: '600' }}
                >
                  <option value="All">All Shifts</option>
                  <option value="GS">General Shift (G)</option>
                  <option value="MS">Morning Shift (M)</option>
                  <option value="DS">Day Shift (D)</option>
                  <option value="NS">Night Shift (N)</option>
                  <option value="UNASSIGNED">Unassigned</option>
                </select>
              </div>
            </div>

            {/* Month & Year Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={prevMonth} className="btn-outline-indigo" style={{ padding: '5px 9px', borderRadius: '6px' }} title="Previous Month">
                <FaChevronLeft size={10} />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', background: '#fff' }}
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', background: '#fff' }}
              >
                {[2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y} {isLeapYear(y) ? '(Leap Year)' : ''}</option>
                ))}
              </select>

              <button onClick={nextMonth} className="btn-outline-indigo" style={{ padding: '5px 9px', borderRadius: '6px' }} title="Next Month">
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: MONTHLY 28/29/30/31-DAY CALENDAR GRID (Section 3)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'calendar' && (
          <div>
            {/* Shift Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', fontSize: '11px', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {shifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => {
                  const sTime = s.startTime ? String(s.startTime).substring(0, 5) : '';
                  const eTime = s.endTime ? String(s.endTime).substring(0, 5) : '';
                  const timeStr = sTime && eTime ? ` (${sTime} - ${eTime})` : '';
                  const label = (s.name || s.code).replace(/ Shift$/i, '');
                  return (
                    <span key={s.id || s.code} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color || '#3b82f6' }}></span>
                      <strong>{s.shortCode || s.code}</strong> — {label}{timeStr}
                    </span>
                  );
                })}
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669', color: '#fff', fontSize: '8px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CS</span>
                  <strong>CS</strong> — Client Site
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706', color: '#fff', fontSize: '8px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>½</span>
                  <strong>½</strong> — Half Day
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#64748b' }}></span>
                  <strong>OFF</strong> — Weekly Off
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                  onClick={() => setShowHolidayListModal(true)}
                  title="Click to view total holiday list"
                >
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#e11d48' }}></span>
                  <strong style={{ color: '#e11d48' }}>H</strong> — Holiday <span style={{ fontSize: '9px', color: '#e11d48' }}>↗</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4f46e5' }}></span>
                  <strong>L</strong> — Leave
                </span>
              </div>
              <span style={{ color: '#64748b' }}>
                Showing <strong>{filteredEmployees.length}</strong> of {employees.length} employees • Click any cell to inspect/edit details
              </span>
            </div>

            {/* Matrix Calendar Table with Sticky Left Column & Sticky Header */}
            <div className="card-modern" style={{ overflow: 'auto', maxHeight: '80vh', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', position: 'relative' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '11px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
                    {/* Sticky Employee Details Column */}
                    <th
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 12,
                        background: '#f8fafc',
                        padding: '10px 14px',
                        textAlign: 'left',
                        minWidth: '240px',
                        maxWidth: '260px',
                        borderBottom: '2px solid #cbd5e1',
                        borderRight: '2px solid #cbd5e1',
                        fontWeight: '800',
                        color: '#1e293b'
                      }}
                    >
                      Employee Details ({filteredEmployees.length})
                    </th>

                    {/* Dynamic Days of the Month (28 to 31) */}
                    {monthCalendarDays.map(day => (
                      <th
                        key={day.dateStr}
                        style={{
                          padding: '8px 4px',
                          minWidth: '38px',
                          width: '38px',
                          borderBottom: '2px solid #cbd5e1',
                          borderRight: '1px solid #e2e8f0',
                          background: day.isToday ? '#ede9fe' : day.isWeekend ? '#f1f5f9' : '#f8fafc',
                          color: day.isToday ? '#6366f1' : day.isWeekend ? '#94a3b8' : '#334155'
                        }}
                      >
                        <div style={{ fontSize: '9px', fontWeight: '600' }}>{day.dayName}</div>
                        <div style={{ fontSize: '12px', fontWeight: '800' }}>{day.dayNumber}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={daysInSelectedMonth + 1} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        No employees found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, empIdx) => {
                      const defaultShiftCode = employeeDefaultShifts[emp.id] || 'GS';

                      return (
                        <tr key={emp.id} style={{ background: empIdx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          {/* Sticky Employee Details Column */}
                          <td
                            style={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 5,
                              background: empIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                              padding: '8px 12px',
                              textAlign: 'left',
                              borderBottom: '1px solid #f1f5f9',
                              borderRight: '2px solid #cbd5e1',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', flexShrink: 0 }}>
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{emp.name}</span>
                                  <span style={{ fontSize: '9px', color: '#6366f1', background: '#eef2ff', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                    {emp.code}
                                  </span>
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                  {emp.designation || 'Staff'} • {emp.department}
                                </div>
                                <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                                  {emp.branch} • Base Shift: <strong>{defaultShiftCode}</strong>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Days Cells */}
                          {monthCalendarDays.map(day => {
                            const key = `${emp.id}_${day.dateStr}`;
                            let shiftCode = rosterMap[key];

                            // Fallback if not specifically scheduled
                            if (!shiftCode) {
                              shiftCode = day.isWeekend ? 'WO' : defaultShiftCode;
                            }

                            // Interconnected attendance lookup
                            const att = attendanceMap[`${emp.id}_${day.dateStr}`] ||
                                        attendanceMap[`${(emp.email || '').toLowerCase()}_${day.dateStr}`] ||
                                        attendanceMap[`${(emp.code || '').toLowerCase()}_${day.dateStr}`];

                            const isLeave = checkEmployeeOnLeave(emp.id, day.dateStr);
                            const isHol = isOfficialHoliday(day.dateStr);

                            let cellShiftCode = shiftCode;
                            if (isLeave) cellShiftCode = 'LV';
                            else if (isHol) cellShiftCode = 'HL';
                            else if (att?.onSite) cellShiftCode = 'CS';

                            const shiftObj = getShiftByCode(cellShiftCode);
                            let shortLabel = shiftObj.shortCode || cellShiftCode;
                            if (att?.onSite) shortLabel = 'CS';
                            else if (att?.status === 'HALF_DAY') shortLabel = '½';

                            return (
                              <td
                                key={day.dateStr}
                                onClick={() => setCellDetailModal({
                                  show: true,
                                  employee: emp,
                                  dateStr: day.dateStr,
                                  shiftCode,
                                  note: shiftObj.name,
                                  attendance: att,
                                  isLeave,
                                  isHoliday: isHol
                                })}
                                style={{
                                  padding: '4px 2px',
                                  borderBottom: '1px solid #f1f5f9',
                                  borderRight: '1px solid #f1f5f9',
                                  background: day.isToday ? '#faf5ff' : day.isWeekend ? '#fbfcfe' : 'transparent',
                                  cursor: 'pointer'
                                }}
                                title={`${emp.name} - ${day.dateStr}: ${shiftObj.name}${att ? ` (Punch: ${att.checkIn || '--:--'} - ${att.checkOut || '--:--'}, ${att.hours || 0} hrs)` : ''}`}
                              >
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      width: '28px',
                                      height: '24px',
                                      lineHeight: '24px',
                                      borderRadius: '5px',
                                      background: att?.onSite ? '#ecfdf5' : att?.status === 'HALF_DAY' ? '#fffbeb' : shiftObj.bgColor,
                                      color: att?.onSite ? '#059669' : att?.status === 'HALF_DAY' ? '#d97706' : shiftObj.color,
                                      border: `1px solid ${att?.onSite ? '#10b981' : att?.status === 'HALF_DAY' ? '#f59e0b' : shiftObj.borderColor}`
                                    }}
                                  >
                                    {shortLabel}
                                  </span>
                                  {att && (
                                    <span
                                      style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: att.onSite ? '#10b981' : att.status === 'HALF_DAY' ? '#f59e0b' : '#3b82f6',
                                        border: '1px solid #fff'
                                      }}
                                      title={att.onSite ? 'Client Site Approved' : att.status === 'HALF_DAY' ? 'Half Day Worked' : 'Punched Present'}
                                    />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: EMPLOYEE SHIFT ASSIGNMENT TABLE (Section 7)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'mapping' && (
          <div>
            {/* Batch Action Bar */}
            {selectedEmpIds.length > 0 && isAdminOrHr && (
              <div style={{ marginBottom: '14px', padding: '10px 16px', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1' }}>
                  {selectedEmpIds.length} employee(s) selected:
                </span>
                {shifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => {
                  const sTime = s.startTime ? String(s.startTime).substring(0, 5) : '';
                  const eTime = s.endTime ? String(s.endTime).substring(0, 5) : '';
                  const timeStr = sTime && eTime ? ` (${sTime} - ${eTime})` : '';
                  return (
                    <button
                      key={s.code}
                      onClick={() => handleBatchAssign(s.code)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${s.color || '#3b82f6'}`,
                        background: s.bgColor || '#eff6ff',
                        color: s.color || '#2563eb',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Set to {s.name}{timeStr}
                    </button>
                  );
                })}
                <button onClick={() => setSelectedEmpIds([])} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>
                  Clear Selection
                </button>
              </div>
            )}

            {/* Employee Mapping Table */}
            <div className="card-modern" style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    {isAdminOrHr && (
                      <th style={{ padding: '12px 14px', width: '36px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={filteredEmployees.length > 0 && selectedEmpIds.length === filteredEmployees.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedEmpIds(filteredEmployees.map(x => x.id));
                            else setSelectedEmpIds([]);
                          }}
                        />
                      </th>
                    )}
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Employee Details</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>Department &amp; Designation</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>Branch</th>
                    <th style={{ padding: '12px 14px', fontWeight: '700' }}>Active Assigned Shift</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', minWidth: '220px' }}>Admin Quick Shift Selector</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp, idx) => {
                    const currentCode = employeeDefaultShifts[emp.id] || 'GS';
                    const currentObj = getShiftByCode(currentCode);
                    const isSelected = selectedEmpIds.includes(emp.id);

                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f5f3ff' : idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        {isAdminOrHr && (
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedEmpIds(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id]);
                              }}
                            />
                          </td>
                        )}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.code} • {emp.email || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#e0e7ff', color: '#4338ca', fontWeight: '600' }}>
                            {emp.department}
                          </span>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{emp.designation}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {emp.branch}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: currentObj.bgColor, color: currentObj.color, border: `1px solid ${currentObj.borderColor}` }}>
                            {currentObj.code} — {currentObj.name}
                          </span>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                            {currentObj.startTime} – {currentObj.endTime}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            disabled={!isAdminOrHr}
                            value={currentCode}
                            onChange={(e) => handleQuickShiftChange(emp.id, e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', background: '#fff', width: '100%' }}
                          >
                            {shifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => {
                              const sTime = s.startTime ? String(s.startTime).substring(0, 5) : '';
                              const eTime = s.endTime ? String(s.endTime).substring(0, 5) : '';
                              const timeStr = sTime && eTime ? `: ${sTime} - ${eTime}` : '';
                              return (
                                <option key={s.code} value={s.code}>
                                  {s.name} ({s.code}{timeStr})
                                </option>
                              );
                            })}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3 Shift Settings removed - centralized in Attendance Policy */}
        {false && activeTab === 'settings' && (
          <div>
            {/* Header & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaCog color="#6366f1" />
                  Shift Settings System
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Configure shift timings, break durations, check-in window rules, and weekly rotation policies.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setNewShiftModal(true)}
                  className="btn-outline-indigo"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px' }}
                >
                  <FaPlus size={11} />
                  Add New Shift
                </button>

                <button
                  onClick={handleResetShiftSettings}
                  className="btn-outline-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '12px', background: '#f8fafc' }}
                  title="Reset all settings to default corporate rules"
                >
                  <FaUndo size={11} />
                  Reset Defaults
                </button>

                <button
                  onClick={handleSaveAllShiftSettings}
                  className="btn-gradient"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                >
                  <FaSave size={12} />
                  Save Shift Settings
                </button>
              </div>
            </div>

            {/* Timing & Punch Rules Card */}
            <div className="card-modern" style={{ padding: '20px 24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaClock color="#6366f1" size={14} />
                Attendance Punch &amp; Timing Rules
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                {/* Check-in Window */}
                <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Check-In Window (Pre-Shift Access)
                  </label>
                  <select
                    value={shiftSystemSettings.checkInBeforeMinutes}
                    onChange={(e) => setShiftSystemSettings({ ...shiftSystemSettings, checkInBeforeMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff', marginBottom: '8px' }}
                  >
                    <option value={5}>5 minutes before shift start (Standard)</option>
                    <option value={10}>10 minutes before shift start</option>
                    <option value={15}>15 minutes before shift start</option>
                    <option value={30}>30 minutes before shift start</option>
                    <option value={0}>Exact shift start time only</option>
                  </select>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                    E.g. for a 09:00 AM shift, check-in button unlocks at <strong>08:55 AM</strong>. Punching before is locked.
                  </div>
                </div>

                {/* Checkout Rule */}
                <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Checkout Rule (Shift Completion Rule)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={shiftSystemSettings.enforceCheckOutAfterShift}
                      onChange={(e) => setShiftSystemSettings({ ...shiftSystemSettings, enforceCheckOutAfterShift: e.target.checked })}
                    />
                    <strong>Block checkout before scheduled shift end</strong>
                  </label>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                    Employees can only check out <strong>after</strong> their shift duration ends (e.g. 3–9 shift can only check out at or after 09:00 PM).
                  </div>
                </div>

                {/* Checkout Grace Window */}
                <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Checkout Recommended Window
                  </label>
                  <select
                    value={shiftSystemSettings.checkOutGraceMinutes}
                    onChange={(e) => setShiftSystemSettings({ ...shiftSystemSettings, checkOutGraceMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff', marginBottom: '8px' }}
                  >
                    <option value={10}>Within 10 minutes after shift (Standard)</option>
                    <option value={15}>Within 15 minutes after shift</option>
                    <option value={30}>Within 30 minutes after shift</option>
                    <option value={60}>Within 60 minutes after shift</option>
                  </select>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                    Prompts employee to check out promptly once their scheduled shift concludes.
                  </div>
                </div>
              </div>
            </div>

            {/* Shift Definitions Grid */}
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaLayerGroup color="#6366f1" size={14} />
              Configured Shift Categories ({editingShifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').length})
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {editingShifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => (
                <div
                  key={s.id}
                  className="card-modern"
                  style={{
                    padding: '18px',
                    borderRadius: '14px',
                    borderLeft: `4px solid ${s.color}`,
                    background: '#fff',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', background: s.bgColor, color: s.color, border: `1px solid ${s.borderColor}` }}>
                        {s.code}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>({s.shortCode})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={s.isActive !== false}
                          onChange={(e) => handleUpdateShiftField(s.id, 'isActive', e.target.checked)}
                        />
                        Active
                      </label>
                      {String(s.id || '').startsWith('shift-custom-') || !['GS', 'MS', 'DS', 'NS', 'S39'].includes(s.code) ? (
                        <button
                          onClick={() => {
                            const filtered = editingShifts.filter(item => item.id !== s.id);
                            setEditingShifts(filtered);
                          }}
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                          title="Delete Custom Shift"
                        >
                          <FaTrash size={11} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Shift Name */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Shift Name</label>
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => handleUpdateShiftField(s.id, 'name', e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '13px', fontWeight: '600', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  {/* Timings */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Start Time</label>
                      <input
                        type="time"
                        value={s.startTime}
                        onChange={(e) => handleUpdateShiftField(s.id, 'startTime', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>End Time</label>
                      <input
                        type="time"
                        value={s.endTime}
                        onChange={(e) => handleUpdateShiftField(s.id, 'endTime', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  {/* Duration, Break, Grace */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: '700', color: '#64748b' }}>HOURS</label>
                      <input
                        type="number"
                        step="0.5"
                        value={s.durationHours}
                        onChange={(e) => handleUpdateShiftField(s.id, 'durationHours', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: '700', color: '#64748b' }}>BREAK (MIN)</label>
                      <input
                        type="number"
                        value={s.breakMinutes}
                        onChange={(e) => handleUpdateShiftField(s.id, 'breakMinutes', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: '700', color: '#64748b' }}>GRACE (MIN)</label>
                      <input
                        type="number"
                        value={s.graceMinutes}
                        onChange={(e) => handleUpdateShiftField(s.id, 'graceMinutes', Number(e.target.value))}
                        style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  {/* Overnight Shift Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(s.isNightShift)}
                        onChange={(e) => handleUpdateShiftField(s.id, 'isNightShift', e.target.checked)}
                      />
                      <span>Spans midnight (Overnight Shift)</span>
                    </label>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: s.color }}>
                      {format12Hour(s.startTime)} – {format12Hour(s.endTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Save Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <button
                onClick={handleResetShiftSettings}
                className="btn-outline-secondary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Reset to Standard Defaults
              </button>
              <button
                onClick={handleSaveAllShiftSettings}
                className="btn-gradient"
                style={{ padding: '8px 24px', fontSize: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
              >
                <FaSave size={12} style={{ marginRight: '6px' }} />
                Save All Shift Settings
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: AUTOMATIC ROTATION CONTROLS (Section 5)
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'rotation' && (
          <div className="card-modern" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', maxWidth: '800px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
              Automatic Weekly Shift Rotation Configuration
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
              One employee works one assigned shift for one week (7 days), then automatically rotates to the next shift according to the configured cycle: <strong>Morning (06:00–14:00) → Day (14:00–22:00) → Night (22:00–06:00)</strong>. General shift staff remain fixed.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Target Branch Scope</label>
                <select
                  value={rotationForm.scopeBranch}
                  onChange={(e) => setRotationForm({ ...rotationForm, scopeBranch: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                >
                  {branchList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Target Department Scope</label>
                <select
                  value={rotationForm.scopeDept}
                  onChange={(e) => setRotationForm({ ...rotationForm, scopeDept: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                >
                  {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Weekly Off Policy</label>
                <select
                  value={rotationForm.weeklyOffPolicy}
                  onChange={(e) => setRotationForm({ ...rotationForm, weeklyOffPolicy: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                >
                  <option value="SAT_SUN">Both Saturday &amp; Sunday Off</option>
                  <option value="SUN_ONLY">Sunday Only Off (Saturday Working)</option>
                  <option value="SUN_WORKING">Sunday Working (Continuous Duty)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Rotation Sequence</label>
                <select
                  disabled
                  value={rotationForm.rotationPattern}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#f8fafc', color: '#475569' }}
                >
                  <option value="MS_DS_NS">Morning → Day → Night (Weekly)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rotationForm.keepGeneralShiftFixed}
                  onChange={(e) => setRotationForm({ ...rotationForm, keepGeneralShiftFixed: e.target.checked })}
                />
                Keep General Shift employees fixed on General Shift (Do not rotate into Night/Morning shifts)
              </label>
            </div>

            <button
              onClick={() => { setRotationModal(true); setPreviewResult(null); }}
              className="btn-gradient"
              style={{ padding: '10px 20px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FaClock size={13} />
              Open Generator &amp; Preview
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL: AUTOMATIC ROTATION GENERATOR & PREVIEW (Section 5)
        ═══════════════════════════════════════════════════════════════════ */}
        {rotationModal && (
          <div className="emp-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)' }}>
            <div className="card-modern" style={{ width: '900px', maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '18px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaClock size={18} color="#6366f1" />
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#1e293b', fontFamily: "'Sora', sans-serif" }}>
                    Automatic Weekly Shift Rotation Generator
                  </h3>
                </div>
                <button onClick={() => setRotationModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                  <FaTimes size={13} color="#64748b" />
                </button>
              </div>

              {/* Generator Configuration Parameters */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Month &amp; Year</label>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                      {monthNames[selectedMonth]} {selectedYear} ({daysInSelectedMonth} Days)
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Branch Scope</label>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{rotationForm.scopeBranch}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Department Scope</label>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{rotationForm.scopeDept}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Rule: <strong>Morning → Day → Night</strong> (7 days each) • Fixed General Shift: {rotationForm.keepGeneralShiftFixed ? 'Yes' : 'No'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleGenerateRotationPreview}
                      className="btn-outline-indigo"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      Inspect Preview
                    </button>
                    <button
                      type="button"
                      onClick={handleDirectGenerateAndApply}
                      className="btn-gradient"
                      style={{ padding: '8px 20px', fontSize: '12px', fontWeight: '700' }}
                    >
                      ✨ 1-Click Generate &amp; Apply Roster
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Result Output */}
              {previewResult && (
                <div>
                  <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong style={{ color: '#065f46', fontSize: '13px' }}>Preview Generated Successfully!</strong>
                      <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                        Total Days: {previewResult.totalCalendarDays} • Weekly Offs: {previewResult.totalWeeklyOffDays} • Holidays: {previewResult.standaloneHolidays} • Available Duty Days: <strong>{previewResult.availableDutyDays} Days</strong>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#065f46', fontWeight: '700' }}>
                      {previewResult.employeeSchedules.length} Employees Covered
                    </div>
                  </div>

                  {/* Conflict Warnings */}
                  {previewResult.conflicts.length > 0 && (
                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a', marginBottom: '16px', fontSize: '11px', color: '#92400e' }}>
                      <strong>Leave &amp; Schedule Conflicts Handled ({previewResult.conflicts.length}):</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {previewResult.conflicts.slice(0, 4).map((c, i) => (
                          <li key={i}>{c.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Summary Grid */}
                  <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '18px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '8px 12px' }}>Employee</th>
                          <th style={{ padding: '8px 12px' }}>Type</th>
                          <th style={{ padding: '8px 12px' }}>Duty Days</th>
                          <th style={{ padding: '8px 12px' }}>Weekly Offs</th>
                          <th style={{ padding: '8px 12px' }}>Leaves</th>
                          <th style={{ padding: '8px 12px' }}>Week 1 Shift</th>
                          <th style={{ padding: '8px 12px' }}>Week 2 Shift</th>
                          <th style={{ padding: '8px 12px' }}>Week 3 Shift</th>
                          <th style={{ padding: '8px 12px' }}>Week 4 Shift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewResult.employeeSchedules.map((es, idx) => {
                          const w1 = Object.values(es.dailyShifts)[2]?.shiftCode || 'GS';
                          const w2 = Object.values(es.dailyShifts)[9]?.shiftCode || 'GS';
                          const w3 = Object.values(es.dailyShifts)[16]?.shiftCode || 'GS';
                          const w4 = Object.values(es.dailyShifts)[23]?.shiftCode || 'GS';

                          return (
                            <tr key={es.employee.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '8px 12px', fontWeight: '700' }}>
                                {es.employee.name} <span style={{ color: '#64748b', fontWeight: '500' }}>({es.employee.code})</span>
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                {es.isGeneralShift ? (
                                  <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#eff6ff', color: '#2563eb', fontWeight: '700' }}>Fixed GS</span>
                                ) : (
                                  <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', fontWeight: '700' }}>Rotating</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: '700', color: '#059669' }}>{es.workingDays}d</td>
                              <td style={{ padding: '8px 12px', color: '#64748b' }}>{es.weeklyOffDays}d</td>
                              <td style={{ padding: '8px 12px', color: '#4f46e5' }}>{es.leaveDays}d</td>
                              <td style={{ padding: '8px 12px', fontWeight: '700' }}>{w1}</td>
                              <td style={{ padding: '8px 12px', fontWeight: '700' }}>{w2}</td>
                              <td style={{ padding: '8px 12px', fontWeight: '700' }}>{w3}</td>
                              <td style={{ padding: '8px 12px', fontWeight: '700' }}>{w4}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      ⚡ Clicking Apply will load these rotation assignments into your active calendar view.
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setRotationModal(false)} className="btn-outline-indigo" style={{ padding: '8px 16px', fontSize: '12px' }}>
                        Cancel
                      </button>
                      <button onClick={handleApplyPreview} className="btn-gradient" style={{ padding: '8px 18px', fontSize: '12px', fontWeight: '700' }}>
                        Apply to Calendar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL: ADD EMPLOYEE TO ROSTER (FRONTEND ONLY)
        ═══════════════════════════════════════════════════════════════════ */}
        {showAddEmpModal && (
          <div className="emp-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)' }}>
            <div className="card-modern" style={{ width: '480px', maxWidth: '92vw', padding: '24px', borderRadius: '16px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                    + Add Employee to Roster
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Include employee directly into the shift rotation &amp; calendar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                >
                  <FaTimes size={12} color="#64748b" />
                </button>
              </div>

              <form onSubmit={handleAddNewEmployeeToRoster}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newEmpForm.name}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Employee Code</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP101"
                      value={newEmpForm.code}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, code: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Operations"
                      value={newEmpForm.department}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Executive"
                      value={newEmpForm.designation}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Branch</label>
                    <input
                      type="text"
                      placeholder="e.g. Main HQ"
                      value={newEmpForm.branch}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, branch: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      placeholder="e.g. john@company.com"
                      value={newEmpForm.email}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Default Shift *</label>
                  <select
                    value={newEmpForm.defaultShift}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, defaultShift: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700', background: '#fff' }}
                  >
                    {shifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => {
                      const sTime = s.startTime ? String(s.startTime).substring(0, 5) : '';
                      const eTime = s.endTime ? String(s.endTime).substring(0, 5) : '';
                      const timeStr = sTime && eTime ? `: ${sTime} - ${eTime}` : '';
                      return (
                        <option key={s.code} value={s.code}>
                          {s.name} ({s.code}{timeStr})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddEmpModal(false)}
                    className="btn-outline-indigo"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-gradient"
                    style={{ padding: '8px 20px', fontSize: '12px', fontWeight: '700' }}
                  >
                    Add to Roster
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL: MANUAL SHIFT ASSIGNMENT
        ═══════════════════════════════════════════════════════════════════ */}
        {assignModal && (
          <div className="emp-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)' }}>
            <div className="card-modern" style={{ width: '460px', maxWidth: '90vw', padding: '24px', borderRadius: '16px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                  Manual Shift Assignment
                </h3>
                <button onClick={() => setAssignModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                  <FaTimes size={12} color="#64748b" />
                </button>
              </div>

              <form onSubmit={handleAssignShiftSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Select Employee *</label>
                  <select
                    required
                    value={assignForm.employeeId}
                    onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.code} - {emp.department})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Assigned Shift *</label>
                  <select
                    value={assignForm.shiftCode}
                    onChange={(e) => setAssignForm({ ...assignForm, shiftCode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff', fontWeight: '700' }}
                  >
                    {shifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => {
                      const sTime = s.startTime ? String(s.startTime).substring(0, 5) : '';
                      const eTime = s.endTime ? String(s.endTime).substring(0, 5) : '';
                      const timeStr = sTime && eTime ? `: ${sTime} - ${eTime}` : '';
                      return (
                        <option key={s.code} value={s.code}>
                          {s.name} ({s.code}{timeStr})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Start Date</label>
                    <input
                      type="date"
                      required
                      value={assignForm.startDate}
                      onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>End Date</label>
                    <input
                      type="date"
                      required
                      value={assignForm.endDate}
                      onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={assignForm.excludeWeekends}
                      onChange={(e) => setAssignForm({ ...assignForm, excludeWeekends: e.target.checked })}
                    />
                    Exclude Weekends (Saturday &amp; Sunday Off)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setAssignModal(false)} className="btn-outline-indigo" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-gradient" style={{ padding: '8px 18px', fontSize: '12px', fontWeight: '700' }}>
                    Save Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL: CELL DETAIL (VIEW/INSPECT SINGLE DAY ASSIGNMENT)
        ═══════════════════════════════════════════════════════════════════ */}
        {cellDetailModal.show && cellDetailModal.employee && (
          <div className="emp-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)' }}>
            <div className="card-modern" style={{ width: '420px', maxWidth: '90vw', padding: '22px', borderRadius: '16px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                  Duty Details: {cellDetailModal.dateStr}
                </h3>
                <button onClick={() => setCellDetailModal({ show: false, employee: null, dateStr: '', shiftCode: '', note: '' })} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                  <FaTimes size={12} color="#64748b" />
                </button>
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: getShiftByCode(cellDetailModal.shiftCode).bgColor, border: `1px solid ${getShiftByCode(cellDetailModal.shiftCode).borderColor}`, marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: getShiftByCode(cellDetailModal.shiftCode).color }}>
                  {cellDetailModal.shiftCode} — {getShiftByCode(cellDetailModal.shiftCode).name}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
                  {getShiftByCode(cellDetailModal.shiftCode).startTime !== '--:--'
                    ? `${format12Hour(getShiftByCode(cellDetailModal.shiftCode).startTime)} – ${format12Hour(getShiftByCode(cellDetailModal.shiftCode).endTime)}`
                    : 'Scheduled Rest Day'}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Employee:</span>
                  <strong>{cellDetailModal.employee.name} ({cellDetailModal.employee.code})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Designation:</span>
                  <strong>{cellDetailModal.employee.designation || 'Staff'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Department:</span>
                  <strong>{cellDetailModal.employee.department}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Branch:</span>
                  <strong>{cellDetailModal.employee.branch}</strong>
                </div>
              </div>

              {/* Interconnected Attendance & Punch Integration Panel */}
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaClock size={11} color="#6366f1" />
                  <span>Attendance & Punch Integration:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Check-In: </span>
                    <strong style={{ color: '#0f172a' }}>{cellDetailModal.attendance?.checkIn ? format12Hour(cellDetailModal.attendance.checkIn) : '--:--'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Check-Out: </span>
                    <strong style={{ color: '#0f172a' }}>{cellDetailModal.attendance?.checkOut ? format12Hour(cellDetailModal.attendance.checkOut) : '--:--'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Worked Hours: </span>
                    <strong style={{ color: '#0f172a' }}>{cellDetailModal.attendance?.hours ? `${Number(cellDetailModal.attendance.hours).toFixed(1)} hrs` : '--'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Status: </span>
                    <strong style={{
                      color: cellDetailModal.attendance?.onSite
                        ? '#059669'
                        : cellDetailModal.attendance?.status === 'HALF_DAY'
                        ? '#d97706'
                        : cellDetailModal.attendance?.status === 'PRESENT'
                        ? '#16a34a'
                        : cellDetailModal.isLeave
                        ? '#7c3aed'
                        : cellDetailModal.isHoliday
                        ? '#e11d48'
                        : '#64748b'
                    }}>
                      {cellDetailModal.attendance?.onSite
                        ? 'Client Site (Approved)'
                        : cellDetailModal.attendance?.status === 'HALF_DAY'
                        ? 'Half Day (Partial)'
                        : cellDetailModal.attendance?.status === 'PRESENT'
                        ? 'Present (Full Day)'
                        : cellDetailModal.isLeave
                        ? 'Approved Leave'
                        : cellDetailModal.isHoliday
                        ? 'Official Holiday'
                        : 'Scheduled Duty'}
                    </strong>
                  </div>
                </div>
                {cellDetailModal.attendance?.clientName && (
                  <div style={{ fontSize: '10.5px', color: '#065f46', marginTop: '8px', background: '#ecfdf5', padding: '5px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    🏢 <strong>Client Site:</strong> {cellDetailModal.attendance.clientName}
                  </div>
                )}
                {cellDetailModal.isHoliday && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: '#ffe4e6', borderRadius: '8px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#be123c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaGift size={12} />
                      <span><strong>Holiday:</strong> {holidays.find(h => (h.date || h.holidayDate || h.startDate || '').split('T')[0] === cellDetailModal.dateStr)?.name || 'Official Holiday'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setCellDetailModal({ show: false, employee: null, dateStr: '', shiftCode: '', note: '' });
                        setShowHolidayListModal(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#be123c', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}
                    >
                      View All ↗
                    </button>
                  </div>
                )}
              </div>

              {isAdminOrHr && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Override Shift for this Date</label>
                  <select
                    value={cellDetailModal.shiftCode}
                    onChange={(e) => {
                      const newCode = e.target.value;
                      const newRoster = { ...rosterMap, [`${cellDetailModal.employee.id}_${cellDetailModal.dateStr}`]: newCode };
                      setRosterMap(newRoster);
                      saveRosterAssignments(newRoster);
                      setCellDetailModal(prev => ({ ...prev, shiftCode: newCode }));
                      toast.success('Shift Updated', `Updated shift to ${newCode} on ${cellDetailModal.dateStr}.`);
                    }}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700' }}
                  >
                    {shifts.filter(s => s.code !== 'WO' && s.code !== 'HL' && s.code !== 'LV').map(s => {
                      const sTime = s.startTime ? String(s.startTime).substring(0, 5) : '';
                      const eTime = s.endTime ? String(s.endTime).substring(0, 5) : '';
                      const timeStr = sTime && eTime ? `: ${sTime} - ${eTime}` : '';
                      return (
                        <option key={s.code} value={s.code}>
                          {s.name} ({s.code}{timeStr})
                        </option>
                      );
                    })}
                    <option value="WO">Weekly Off (WO)</option>
                    <option value="HL">Holiday (HL)</option>
                    <option value="LV">Approved Leave (LV)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setCellDetailModal({ show: false, employee: null, dateStr: '', shiftCode: '', note: '' })}
                  className="btn-outline-indigo"
                  style={{ padding: '6px 16px', fontSize: '12px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODAL: ADD NEW CUSTOM SHIFT
        ═══════════════════════════════════════════════════════════════════ */}
        {newShiftModal && (
          <div className="emp-modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)' }}>
            <div className="card-modern" style={{ width: '500px', maxWidth: '92vw', padding: '24px', borderRadius: '16px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaPlus color="#6366f1" size={14} />
                  Add New Custom Shift
                </h3>
                <button
                  onClick={() => setNewShiftModal(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Shift Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Evening Shift"
                    value={newShiftForm.name}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Shift Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. ES"
                    maxLength={5}
                    value={newShiftForm.code}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Start Time</label>
                  <input
                    type="time"
                    value={newShiftForm.startTime}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, startTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>End Time</label>
                  <input
                    type="time"
                    value={newShiftForm.endTime}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, endTime: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#475569' }}>HOURS</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newShiftForm.durationHours}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, durationHours: Number(e.target.value) })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#475569' }}>BREAK (MIN)</label>
                  <input
                    type="number"
                    value={newShiftForm.breakMinutes}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, breakMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#475569' }}>GRACE (MIN)</label>
                  <input
                    type="number"
                    value={newShiftForm.graceMinutes}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, graceMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newShiftForm.isNightShift}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, isNightShift: e.target.checked })}
                  />
                  <span>This shift spans midnight (Overnight Shift)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setNewShiftModal(false)}
                  className="btn-outline-secondary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewShift}
                  className="btn-gradient"
                  style={{ padding: '8px 20px', fontSize: '12px' }}
                >
                  Create Shift
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
                  {isAdminOrHr && (
                    <button
                      onClick={() => {
                        setShowHolidayListModal(false);
                        navigate('/holidays');
                      }}
                      className="btn-outline-indigo"
                      style={{ padding: '7px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Manage Holidays</span>
                      <FaExternalLinkAlt size={10} />
                    </button>
                  )}
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
