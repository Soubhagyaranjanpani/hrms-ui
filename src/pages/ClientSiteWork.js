import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle, FaTimesCircle,
  FaClock, FaBuilding, FaUser, FaCheck, FaTimes,
  FaEye, FaChevronLeft, FaChevronRight, FaInfoCircle, FaFileAlt, FaSpinner,
  FaBriefcase, FaSearch, FaUserTie, FaCheckDouble, FaExclamationTriangle,
  FaFilter, FaCalendarCheck, FaFolderOpen, FaArrowLeft, FaCalendarDay,
  FaHistory, FaSyncAlt
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../components/Toast';
import { BASE_URL, API_ENDPOINTS, STORAGE_KEYS, getAuthHeaders } from '../config/api.config';
import LoadingSpinner from '../components/LoadingSpinner';

const STORAGE_VERIFICATIONS_KEY = 'hrms_client_verifications';
const STORAGE_ONSITE_KEY = 'hrms_onsite_attendance';
const ROWS_PER_PAGE = 8;

const ClientSiteWork = ({ user, defaultTab, embedded = false, onBackToAttendance }) => {
  // ── Role Detection (HR vs Employee vs Admin vs Manager) ────
  const getCleanRole = () => {
    try {
      const uData = JSON.parse(localStorage.getItem('userData') || '{}');
      const raw = localStorage.getItem(STORAGE_KEYS.ROLE) ||
                  localStorage.getItem('roleName') ||
                  localStorage.getItem('role') ||
                  user?.role ||
                  user?.roleName ||
                  uData?.role || '';
      let s = String(raw).trim();
      if (s.toUpperCase().startsWith('ROLE_')) s = s.substring(5);
      const up = s.toUpperCase().replace(/[\s_-]+/g, '');
      if (up === 'HR' || up === 'HUMANRESOURCE' || up === 'HUMANRESOURCES' || up === 'HROFFICER' || up === 'HRMANAGER') return 'HR';
      if (up === 'ADMIN' || up === 'ADMINISTRATOR' || up === 'SUPERADMIN') return 'ADMIN';
      if (up === 'MANAGER') return 'MANAGER';
    } catch {}
    return 'EMPLOYEE';
  };

  const effectiveRole = getCleanRole();
  const isHr = effectiveRole === 'HR';
  const isAdmin = effectiveRole === 'ADMIN';
  const isApprover = isHr || isAdmin;
  const currentUsername = (localStorage.getItem(STORAGE_KEYS.USERNAME) || user?.email || user?.name || 'employee').toLowerCase();

  // Tab State
  const determineInitialTab = () => {
    if (defaultTab) return defaultTab;
    return isApprover ? 'approvals' : 'apply';
  };

  const [activeTab, setActiveTab] = useState(determineInitialTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Current Employee Profile
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [employeesMap, setEmployeesMap] = useState({});

  useEffect(() => {
    const fetchCurrentEmployeeProfile = async () => {
      try {
        const empId = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID) || user?.id;
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (!empId || !token) return;
        const res = await axios.get(`${BASE_URL}/api/employee-profile/full/${empId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.response) {
          setEmployeeProfile(res.data.response);
        }
      } catch (e) {
        // Fallback safely
      }
    };
    fetchCurrentEmployeeProfile();
  }, [user]);

  // ── Form State ──────────────────────────────────────────────
  const [formData, setFormData] = useState({
    clientName: '',
    projectName: '',
    siteLocation: '',
    contactPerson: '',
    purposeDescription: '',
  });

  const [selectedDates, setSelectedDates] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Month & Year Navigation for Calendar Picker
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Table State
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [approveModalItem, setApproveModalItem] = useState(null);
  const [approveRemarks, setApproveRemarks] = useState('');
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // ── Local Storage Helpers ────────────────────────────────────
  const getStoredRecords = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_VERIFICATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const saveStoredRecords = (records) => {
    try {
      localStorage.setItem(STORAGE_VERIFICATIONS_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error writing localStorage:', e);
    }
  };

  // Broadcast counter change to other components & open tabs
  const broadcastSync = () => {
    window.dispatchEvent(new CustomEvent('hrms_client_verification_updated'));
    try {
      localStorage.setItem('hrms_client_verifications_sync', String(Date.now()));
    } catch {}
  };

  // ── Fetch Employee Directory for Metadata ────────────────────
  useEffect(() => {
    const fetchEmployeesList = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (!token) return;
        const res = await axios.get(`${BASE_URL}/api/employee-profile/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = res.data?.response || res.data || [];
        const map = {};
        if (Array.isArray(list)) {
          list.forEach(emp => {
            const email = (emp.email || emp.username || '').toLowerCase();
            const code = (emp.employeeCode || emp.code || '').toLowerCase();
            const name = (emp.fullName || emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`).trim();
            if (email) map[email] = { ...emp, displayName: name };
            if (code) map[code] = { ...emp, displayName: name };
            if (name) map[name.toLowerCase()] = { ...emp, displayName: name };
          });
          setEmployeesMap(map);
        }
      } catch (err) {
        // Fallback safely
      }
    };
    fetchEmployeesList();
  }, []);

  // ── Fetch Pending Count (Syncs in Real Time with other HRs) ───
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await axios.get(
        API_ENDPOINTS.CLIENT_VERIFICATION_PENDING_COUNT,
        { headers: getAuthHeaders() }
      );
      if (response.data && response.data.pendingCount !== undefined) {
        setPendingCount(Number(response.data.pendingCount));
        return;
      }
    } catch (err) {
      // Local fallback
    }
    const stored = getStoredRecords();
    const count = stored.filter(r => r.status === 'PENDING_VERIFICATION' || r.status === 'PENDING').length;
    setPendingCount(count);
  }, [getStoredRecords]);

  // ── Fetch Verification Records ──────────────────────────────
  const fetchVerifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    let records = [];

    try {
      const endpoint = isApprover
        ? (API_ENDPOINTS.CLIENT_VERIFICATION_ALL || API_ENDPOINTS.CLIENT_VERIFICATION_REQUESTS)
        : API_ENDPOINTS.CLIENT_VERIFICATION_MY;

      const response = await axios.get(endpoint, { headers: getAuthHeaders() });
      if (response.data) {
        records = Array.isArray(response.data)
          ? response.data
          : (response.data.response || response.data.data || []);
      }
    } catch (err) {
      // Read from local cache
    }

    if (!records || records.length === 0) {
      records = getStoredRecords();
    }

    setVerifications(records);
    if (!silent) setLoading(false);
  }, [isApprover, getStoredRecords]);

  // Initial load + Real-Time Sync Listeners
  useEffect(() => {
    fetchVerifications();
    fetchPendingCount();

    // Listen to changes made by other HRs or other tabs
    const handleSyncUpdate = () => {
      fetchPendingCount();
      fetchVerifications(true);
    };

    window.addEventListener('hrms_client_verification_updated', handleSyncUpdate);
    window.addEventListener('storage', handleSyncUpdate);
    window.addEventListener('focus', handleSyncUpdate);

    // Periodic polling every 10 seconds to ensure multi-HR counters stay in exact sync
    const pollInterval = setInterval(() => {
      fetchPendingCount();
    }, 10000);

    return () => {
      window.removeEventListener('hrms_client_verification_updated', handleSyncUpdate);
      window.removeEventListener('storage', handleSyncUpdate);
      window.removeEventListener('focus', handleSyncUpdate);
      clearInterval(pollInterval);
    };
  }, [fetchVerifications, fetchPendingCount]);

  // ── Interactive Calendar Matrix Generation ──────────────────
  const monthName = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ dayNumber: dayNum, dateString: iso, isCurrentMonth: false, isWeekend: false });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(viewYear, viewMonth, day);
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      days.push({ dayNumber: day, dateString: iso, isCurrentMonth: true, isWeekend });
    }

    // Trailing days from next month to complete standard 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const iso = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateString: iso, isCurrentMonth: false, isWeekend: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Calendar Navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Toggle Date Selection
  const toggleDate = (dateStr) => {
    setSelectedDates(prev => {
      let next;
      if (prev.includes(dateStr)) {
        next = prev.filter(d => d !== dateStr);
      } else {
        next = [...prev, dateStr].sort();
      }
      return next;
    });
    if (formErrors.dates) {
      setFormErrors(prev => ({ ...prev, dates: '' }));
    }
  };

  // Quick Date Helpers
  const handleSelectToday = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDates(prev => Array.from(new Set([...prev, todayStr])).sort());
    if (formErrors.dates) setFormErrors(prev => ({ ...prev, dates: '' }));
  };

  const handleSelectYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
    setSelectedDates(prev => Array.from(new Set([...prev, yestStr])).sort());
    if (formErrors.dates) setFormErrors(prev => ({ ...prev, dates: '' }));
  };

  const handleSelectCurrentWeek = () => {
    const now = new Date();
    const currDay = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (currDay === 0 ? 6 : currDay - 1));
    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      weekDates.push(str);
    }
    setSelectedDates(prev => Array.from(new Set([...prev, ...weekDates])).sort());
    if (formErrors.dates) setFormErrors(prev => ({ ...prev, dates: '' }));
  };

  const handleClearSelection = () => {
    setSelectedDates([]);
  };

  // ── Form Input Change & Validation ──────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.clientName.trim()) {
      errors.clientName = 'Client organization name is required';
    }
    if (!formData.siteLocation.trim()) {
      errors.siteLocation = 'Client site location / address is required';
    }
    if (!formData.purposeDescription.trim()) {
      errors.purposeDescription = 'Work description / deliverables are required';
    }
    if (selectedDates.length === 0) {
      errors.dates = 'Please select at least one visit date on the calendar';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit Verification Request ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Required', 'Please fill all required fields and select at least one visit date.');
      return;
    }

    setSubmitting(true);
    const payload = {
      clientName: formData.clientName.trim(),
      projectName: formData.projectName.trim() || undefined,
      siteLocation: formData.siteLocation.trim(),
      contactPerson: formData.contactPerson.trim() || undefined,
      purposeDescription: formData.purposeDescription.trim(),
      dates: [...selectedDates].sort(),
    };

    try {
      let createdId = Date.now();
      let createdStatus = 'PENDING_VERIFICATION';

      try {
        const response = await axios.post(
          API_ENDPOINTS.CLIENT_VERIFICATION_APPLY,
          payload,
          { headers: getAuthHeaders() }
        );
        if (response.data) {
          if (response.data.requestId) createdId = response.data.requestId;
          if (response.data.status) createdStatus = response.data.status;
        }
      } catch (apiErr) {
        // Persist locally
      }

      const newRecord = {
        id: createdId,
        clientName: payload.clientName,
        projectName: payload.projectName || '',
        siteLocation: payload.siteLocation,
        contactPerson: payload.contactPerson || '',
        purposeDescription: payload.purposeDescription,
        dates: payload.dates,
        status: createdStatus,
        submittedBy: currentUsername,
        submittedByName: user?.name || employeeProfile?.fullName || currentUsername.split('@')[0],
        employeeCode: employeeProfile?.employeeCode || employeeProfile?.code || '',
        department: employeeProfile?.departmentName || employeeProfile?.department?.name || '',
        submittedAt: new Date().toISOString(),
        rejectionReason: '',
      };

      const updatedList = [newRecord, ...verifications];
      setVerifications(updatedList);
      saveStoredRecords(updatedList);
      broadcastSync();

      toast.success('Request Submitted', `Client site work submitted for ${selectedDates.length} date(s). Awaiting HR verification.`);

      // Reset Form
      setFormData({
        clientName: '',
        projectName: '',
        siteLocation: '',
        contactPerson: '',
        purposeDescription: '',
      });
      setSelectedDates([]);
      setFormErrors({});
      fetchPendingCount();

      // Switch to my-requests if employee
      if (!isApprover) {
        setActiveTab('my-requests');
      }
    } catch (error) {
      toast.error('Submission Failed', error.response?.data?.message || 'Could not submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── HR Review: Approve ──────────────────────────────────────
  const handleConfirmApprove = async () => {
    if (!approveModalItem) return;
    setActionLoading(true);

    try {
      const reviewPayload = {
        decision: 'APPROVED',
        rejectionReason: approveRemarks.trim() || undefined,
      };

      try {
        await axios.post(
          API_ENDPOINTS.CLIENT_VERIFICATION_REVIEW(approveModalItem.id),
          reviewPayload,
          { headers: getAuthHeaders() }
        );
      } catch (apiErr) {
        // Fallback locally
      }

      // Automatically register attendance as PRESENT in hrms_onsite_attendance
      const rawDates = Array.isArray(approveModalItem.dates) && approveModalItem.dates.length > 0
        ? approveModalItem.dates
        : (approveModalItem.date ? [approveModalItem.date] : (approveModalItem.visitDate ? [approveModalItem.visitDate] : []));
      const visitDates = rawDates.map(d => {
        if (!d) return '';
        if (Array.isArray(d) && d.length >= 3) {
          return `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`;
        }
        const s = String(d).trim();
        if (s.includes('T')) return s.split('T')[0];
        if (s.includes(' ')) return s.split(' ')[0];
        return s;
      }).filter(Boolean);

      const empIdent = (approveModalItem.submittedBy || 'employee').toLowerCase();
      const meta = getEmployeeMeta(approveModalItem);
      const empName = meta?.displayName || meta?.name || approveModalItem.submittedByName || empIdent;
      const empId = meta?.id || approveModalItem.employeeId || approveModalItem.id;

      try {
        const existingOnSite = JSON.parse(localStorage.getItem(STORAGE_ONSITE_KEY) || '[]');
        const newAttendanceRecords = visitDates.map(dateStr => ({
          id: `onsite-${approveModalItem.id}-${dateStr}`,
          verificationId: approveModalItem.id,
          employee: empIdent,
          employeeName: empName,
          employeeId: empId,
          date: dateStr,
          status: 'PRESENT',
          onSite: true,
          checkIn: '09:00:00',
          checkOut: '18:00:00',
          workingHours: 9,
          clientName: approveModalItem.clientName,
          remarks: approveRemarks || 'On-Site Client Visit Approved by HR'
        }));

        const mergedOnSite = [...existingOnSite];
        newAttendanceRecords.forEach(newRec => {
          const idx = mergedOnSite.findIndex(r => r.date === newRec.date && (r.employee || '').toLowerCase() === empIdent);
          if (idx >= 0) {
            mergedOnSite[idx] = newRec;
          } else {
            mergedOnSite.push(newRec);
          }
        });
        localStorage.setItem(STORAGE_ONSITE_KEY, JSON.stringify(mergedOnSite));
      } catch (storageErr) {
        console.error('Error saving on-site attendance:', storageErr);
      }

      // Update local verification record
      const updatedList = verifications.map(item => {
        if (item.id === approveModalItem.id) {
          return {
            ...item,
            status: 'APPROVED',
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUsername,
            remarks: approveRemarks.trim() || 'Approved by HR',
          };
        }
        return item;
      });

      setVerifications(updatedList);
      saveStoredRecords(updatedList);
      broadcastSync(); // Sync counter across other HRs immediately

      setApproveModalItem(null);
      setApproveRemarks('');
      toast.success('Approved & Regularized', `Attendance verified as PRESENT for ${visitDates.length} date(s).`);
      fetchPendingCount();
    } catch (error) {
      toast.error('Approval Error', error.response?.data?.message || 'Could not approve request.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── HR Review: Reject ───────────────────────────────────────
  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    if (!rejectionReason.trim()) {
      toast.warning('Reason Required', 'Please provide a brief reason for rejecting this client site work request.');
      return;
    }
    setActionLoading(true);

    try {
      const reviewPayload = {
        decision: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      };

      try {
        await axios.post(
          API_ENDPOINTS.CLIENT_VERIFICATION_REVIEW(rejectModalItem.id),
          reviewPayload,
          { headers: getAuthHeaders() }
        );
      } catch (apiErr) {
        // Fallback locally
      }

      const updatedList = verifications.map(item => {
        if (item.id === rejectModalItem.id) {
          return {
            ...item,
            status: 'REJECTED',
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUsername,
            rejectionReason: rejectionReason.trim(),
          };
        }
        return item;
      });

      setVerifications(updatedList);
      saveStoredRecords(updatedList);
      broadcastSync(); // Sync counter across other HRs immediately

      setRejectModalItem(null);
      setRejectionReason('');
      toast.info('Request Rejected', 'The client site work request has been marked as rejected.');
      fetchPendingCount();
    } catch (error) {
      toast.error('Rejection Error', error.response?.data?.message || 'Could not reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Helper: Employee Metadata ───────────────────────────────
  const getEmployeeMeta = (item) => {
    const raw = (item.submittedBy || '').toLowerCase();
    const rawName = (item.submittedByName || '').toLowerCase();
    const fromMap = employeesMap[raw] || employeesMap[rawName];
    return {
      name: item.submittedByName || fromMap?.displayName || item.submittedBy || 'Employee',
      code: item.employeeCode || fromMap?.employeeCode || fromMap?.code || '--',
      dept: item.department || fromMap?.departmentName || fromMap?.department?.name || 'Operations',
      email: item.submittedBy || fromMap?.email || '--',
    };
  };

  // ── Filtered & Paginated Lists ──────────────────────────────
  const pendingRequests = useMemo(() => {
    return verifications.filter(item => item.status === 'PENDING_VERIFICATION' || item.status === 'PENDING');
  }, [verifications]);

  const approvedRequests = useMemo(() => {
    return verifications.filter(item => item.status === 'APPROVED' || item.status === 'ON_SITE_APPROVED');
  }, [verifications]);

  const rejectedRequests = useMemo(() => {
    return verifications.filter(item => item.status === 'REJECTED');
  }, [verifications]);

  const mySubmissions = useMemo(() => {
    return verifications.filter(item => {
      const sub = (item.submittedBy || '').toLowerCase();
      return sub === currentUsername || (!sub && !isApprover);
    });
  }, [verifications, currentUsername, isApprover]);

  const displayedList = useMemo(() => {
    let list = [];
    if (activeTab === 'approvals') {
      list = pendingRequests;
    } else if (activeTab === 'all-records') {
      list = verifications;
    } else if (activeTab === 'my-requests') {
      list = mySubmissions;
    } else {
      list = [];
    }

    if (statusFilter !== 'ALL' && activeTab === 'all-records') {
      list = list.filter(item => {
        if (statusFilter === 'PENDING') return item.status === 'PENDING_VERIFICATION' || item.status === 'PENDING';
        if (statusFilter === 'APPROVED') return item.status === 'APPROVED' || item.status === 'ON_SITE_APPROVED';
        if (statusFilter === 'REJECTED') return item.status === 'REJECTED';
        return true;
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item => {
        const meta = getEmployeeMeta(item);
        return (
          (item.clientName || '').toLowerCase().includes(q) ||
          (item.projectName || '').toLowerCase().includes(q) ||
          (item.siteLocation || '').toLowerCase().includes(q) ||
          (item.contactPerson || '').toLowerCase().includes(q) ||
          meta.name.toLowerCase().includes(q) ||
          meta.code.toLowerCase().includes(q) ||
          (item.dates || []).some(d => d.includes(q))
        );
      });
    }

    return list;
  }, [activeTab, pendingRequests, verifications, mySubmissions, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(displayedList.length / ROWS_PER_PAGE) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return displayedList.slice(start, start + ROWS_PER_PAGE);
  }, [displayedList, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchTerm]);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '--';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'ON_SITE_APPROVED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0'
          }}>
            <FaCheckCircle size={11} /> Approved • Present
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca'
          }}>
            <FaTimesCircle size={11} /> Rejected
          </span>
        );
      case 'PENDING_VERIFICATION':
      case 'PENDING':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a'
          }}>
            <FaClock size={11} /> Pending HR Verification
          </span>
        );
    }
  };

  return (
    <div className="attendance-root" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: embedded ? '0' : '10px 8px' }}>
      
      {/* ── HEADER SECTION ───────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid var(--border-light, #e2e8f0)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            {embedded && onBackToAttendance && (
              <button
                onClick={onBackToAttendance}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-indigo, #9d174d)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaArrowLeft size={11} /> Back to Regular Attendance
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: 'var(--accent-indigo-pale, #fbcfe8)',
                color: 'var(--accent-indigo, #9d174d)',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                <FaMapMarkerAlt />
              </span>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary, #1e293b)', fontFamily: "'Sora', sans-serif" }}>
                  Client Site Work & On-Duty Regularization
                </h1>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                  Log visits performed at client facilities. Once approved by HR, dates are marked as <strong>Present (9.0 hrs)</strong> in your attendance.
                </p>
              </div>
            </div>
          </div>

          {/* Action & Sync Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => { fetchPendingCount(); fetchVerifications(); }}
              title="Refresh Records"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                borderRadius: '10px',
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaSyncAlt size={11} /> Refresh
            </button>

            {activeTab !== 'apply' && (
              <button
                onClick={() => setActiveTab('apply')}
                style={{
                  background: 'var(--accent-indigo, #9d174d)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(157, 23, 77, 0.25)'
                }}
              >
                <FaCalendarDay size={12} /> Log Client Visit
              </button>
            )}
          </div>
        </div>

        {/* ── QUICK SUMMARY STATS ──────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginTop: '20px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-light, #f1f5f9)'
        }}>
          {isApprover ? (
            <>
              {/* HR / Admin Stat Cards */}
              <div
                onClick={() => setActiveTab('approvals')}
                style={{
                  background: activeTab === 'approvals' ? '#fff1f2' : '#f8fafc',
                  border: activeTab === 'approvals' ? '1.5px solid #fda4af' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pending Verification
                  </span>
                  <FaClock color="#e11d48" size={14} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#be123c', marginTop: '6px' }}>
                  {pendingRequests.length}
                </div>
                <span style={{ fontSize: '11px', color: '#881337' }}>
                  Awaiting your approval
                </span>
              </div>

              <div
                onClick={() => { setActiveTab('all-records'); setStatusFilter('APPROVED'); }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Approved
                  </span>
                  <FaCheckCircle color="#15803d" size={14} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#166534', marginTop: '6px' }}>
                  {approvedRequests.length}
                </div>
                <span style={{ fontSize: '11px', color: '#14532d' }}>
                  Credited as Present attendance
                </span>
              </div>

              <div
                onClick={() => { setActiveTab('all-records'); setStatusFilter('REJECTED'); }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Rejected Requests
                  </span>
                  <FaTimesCircle color="#b91c1c" size={14} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#991b1b', marginTop: '6px' }}>
                  {rejectedRequests.length}
                </div>
                <span style={{ fontSize: '11px', color: '#7f1d1d' }}>
                  Visit requests declined
                </span>
              </div>

              <div
                onClick={() => { setActiveTab('all-records'); setStatusFilter('ALL'); }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    All Site Work Logs
                  </span>
                  <FaFileAlt color="#475569" size={14} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                  {verifications.length}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Complete audit trail
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Employee Stat Cards */}
              <div
                onClick={() => setActiveTab('my-requests')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    My Pending Requests
                  </span>
                  <FaClock color="#b45309" size={14} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#92400e', marginTop: '6px' }}>
                  {mySubmissions.filter(r => r.status === 'PENDING_VERIFICATION' || r.status === 'PENDING').length}
                </div>
                <span style={{ fontSize: '11px', color: '#78350f' }}>
                  Awaiting HR review
                </span>
              </div>

              <div
                onClick={() => setActiveTab('my-requests')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Approved On-Site Visits
                  </span>
                  <FaCheckCircle color="#15803d" size={14} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#166534', marginTop: '6px' }}>
                  {mySubmissions.filter(r => r.status === 'APPROVED' || r.status === 'ON_SITE_APPROVED').length}
                </div>
                <span style={{ fontSize: '11px', color: '#14532d' }}>
                  Credited as Present (9 hrs/day)
                </span>
              </div>

              <div
                onClick={() => setActiveTab('my-requests')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Submitted
                  </span>
                  <FaHistory color="#475569" size={14} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
                  {mySubmissions.length}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Your total client site applications
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TABS NAVIGATION ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '2px solid var(--border-light, #e2e8f0)',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {isApprover && (
          <>
            <button
              onClick={() => setActiveTab('approvals')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'approvals' ? 700 : 500,
                color: activeTab === 'approvals' ? 'var(--accent-indigo, #9d174d)' : 'var(--text-secondary, #475569)',
                borderBottom: activeTab === 'approvals' ? '3px solid var(--accent-indigo, #9d174d)' : '3px solid transparent',
                marginBottom: '-3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <FaCheckDouble size={13} />
              Pending Approvals
              {pendingRequests.length > 0 && (
                <span style={{
                  background: 'var(--accent-indigo, #9d174d)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 8px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('all-records')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'all-records' ? 700 : 500,
                color: activeTab === 'all-records' ? 'var(--accent-indigo, #9d174d)' : 'var(--text-secondary, #475569)',
                borderBottom: activeTab === 'all-records' ? '3px solid var(--accent-indigo, #9d174d)' : '3px solid transparent',
                marginBottom: '-3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <FaFileAlt size={13} />
              All Site Work Records ({verifications.length})
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('apply')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'apply' ? 700 : 500,
            color: activeTab === 'apply' ? 'var(--accent-indigo, #9d174d)' : 'var(--text-secondary, #475569)',
            borderBottom: activeTab === 'apply' ? '3px solid var(--accent-indigo, #9d174d)' : '3px solid transparent',
            marginBottom: '-3px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <FaCalendarDay size={13} />
          Log Client Site Visit
        </button>

        <button
          onClick={() => setActiveTab('my-requests')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'my-requests' ? 700 : 500,
            color: activeTab === 'my-requests' ? 'var(--accent-indigo, #9d174d)' : 'var(--text-secondary, #475569)',
            borderBottom: activeTab === 'my-requests' ? '3px solid var(--accent-indigo, #9d174d)' : '3px solid transparent',
            marginBottom: '-3px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <FaCalendarCheck size={13} />
          My Submissions ({mySubmissions.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 1: FORM (LOG CLIENT SITE WORK)                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'apply' && (
        <form onSubmit={handleSubmit}>
          <div style={{
            background: 'var(--card-bg, #fff)',
            borderRadius: '16px',
            border: '1px solid var(--border-light, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            marginBottom: '24px',
            overflow: 'hidden'
          }}>
            {/* Step 1: Engagement Details */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{
                  background: 'var(--accent-indigo-pale, #fbcfe8)',
                  color: 'var(--accent-indigo, #9d174d)',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px'
                }}>
                  1
                </span>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary, #1e293b)' }}>
                    Client Site & Engagement Details
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                    Provide client organization details and where the on-duty work took place.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '18px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '6px' }}>
                    <FaBuilding size={11} style={{ marginRight: '6px' }} />
                    Client Organization / Company Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    placeholder="e.g., Tata Consultancy Services, Infosys, Tech Mahindra"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: formErrors.clientName ? '1px solid #ef4444' : '1px solid var(--border-light, #cbd5e1)',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.clientName && (
                    <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      {formErrors.clientName}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '6px' }}>
                    <FaFolderOpen size={11} style={{ marginRight: '6px' }} />
                    Project / Assignment Name
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    placeholder="e.g., Core Banking Platform Modernization"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light, #cbd5e1)',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '6px' }}>
                    <FaMapMarkerAlt size={11} style={{ marginRight: '6px' }} />
                    Client Site Location / Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="siteLocation"
                    value={formData.siteLocation}
                    onChange={handleInputChange}
                    placeholder="e.g., TCS Olympus, Hiranandani Estate, Thane"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: formErrors.siteLocation ? '1px solid #ef4444' : '1px solid var(--border-light, #cbd5e1)',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.siteLocation && (
                    <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      {formErrors.siteLocation}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '6px' }}>
                    <FaUserTie size={11} style={{ marginRight: '6px' }} />
                    Client Contact Person / SPOC
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="e.g., Rajesh Sharma (Client Project Lead)"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light, #cbd5e1)',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #475569)', marginBottom: '6px' }}>
                  <FaFileAlt size={11} style={{ marginRight: '6px' }} />
                  Purpose of Client Visit & Deliverables Description <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="purposeDescription"
                  rows={3}
                  value={formData.purposeDescription}
                  onChange={handleInputChange}
                  placeholder="Describe your on-site deliverables, client meeting objectives, or deployment tasks performed at the client facility..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: formErrors.purposeDescription ? '1px solid #ef4444' : '1px solid var(--border-light, #cbd5e1)',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#fff',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                {formErrors.purposeDescription && (
                  <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    {formErrors.purposeDescription}
                  </span>
                )}
              </div>
            </div>

            {/* Step 2: Interactive Calendar Picker */}
            <div style={{
              padding: '24px',
              borderTop: '1px solid var(--border-light, #e2e8f0)',
              background: '#fcfdfe'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    background: 'var(--accent-indigo-pale, #fbcfe8)',
                    color: 'var(--accent-indigo, #9d174d)',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px'
                  }}>
                    2
                  </span>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary, #1e293b)' }}>
                      Select Visit Dates on Calendar
                    </h2>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                      Click on working dates to select them. Approved dates will regularize attendance as <strong>Present (9.0 hrs)</strong>.
                    </p>
                  </div>
                </div>

                {/* Calendar Nav & Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '4px 8px' }}>
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#475569' }}
                      title="Previous Month"
                    >
                      <FaChevronLeft size={10} />
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', minWidth: '120px', textAlign: 'center' }}>
                      {monthName}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#475569' }}
                      title="Next Month"
                    >
                      <FaChevronRight size={10} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCurrentMonth}
                    style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
                  >
                    Current Month
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectToday}
                    style={{ background: '#e0e7ff', border: '1px solid #c7d2fe', color: '#3730a3', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Today
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectYesterday}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Yesterday
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectCurrentWeek}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + This Week (Mon-Fri)
                  </button>

                  {selectedDates.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Error Notice */}
              {formErrors.dates && (
                <div style={{
                  marginBottom: '14px',
                  padding: '10px 14px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaExclamationTriangle size={14} />
                  <span>{formErrors.dates}</span>
                </div>
              )}

              {/* Intuitive Visual Calendar Grid */}
              <div style={{
                background: '#fff',
                border: '1px solid var(--border-light, #e2e8f0)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
              }}>
                {/* Day Headers (Sun - Sat) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '11px',
                  color: '#64748b',
                  padding: '10px 0'
                }}>
                  <span style={{ color: '#ef4444' }}>SUN</span>
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span style={{ color: '#ef4444' }}>SAT</span>
                </div>

                {/* Days Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '1px',
                  background: '#e2e8f0'
                }}>
                  {calendarDays.map((item, idx) => {
                    const isSelected = selectedDates.includes(item.dateString);
                    const isCurrent = item.isCurrentMonth;
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleDate(item.dateString)}
                        style={{
                          background: isSelected
                            ? 'var(--accent-indigo, #9d174d)'
                            : isCurrent
                              ? (item.isWeekend ? '#fafafa' : '#fff')
                              : '#f1f5f9',
                          color: isSelected
                            ? '#fff'
                            : isCurrent
                              ? (item.isWeekend ? '#b45309' : '#1e293b')
                              : '#94a3b8',
                          padding: '12px 8px',
                          minHeight: '64px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s ease',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: isSelected ? 800 : (isCurrent ? 600 : 400),
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: isSelected ? 'rgba(255,255,255,0.25)' : 'transparent'
                          }}>
                            {item.dayNumber}
                          </span>
                          {isSelected && <FaCheck size={11} color="#fff" />}
                        </div>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          opacity: isSelected ? 0.9 : 0.7,
                          marginTop: '4px'
                        }}>
                          {isSelected ? 'Selected' : (item.isWeekend ? 'Weekend' : 'Workday')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Dates Chip Tray & Summary */}
              {selectedDates.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  background: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-indigo, #9d174d)' }}>
                      Selected Visit Dates ({selectedDates.length}) • Total {selectedDates.length * 9} hrs Present Credit
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      style={{ background: 'none', border: 'none', color: '#be123c', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Remove All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedDates.map(dStr => (
                      <span
                        key={dStr}
                        style={{
                          background: '#fff',
                          color: 'var(--accent-indigo, #9d174d)',
                          border: '1px solid #f472b6',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FaCalendarCheck size={11} />
                        {formatDateDisplay(dStr)}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleDate(dStr); }}
                          style={{
                            background: '#fbcfe8',
                            border: 'none',
                            color: '#9d174d',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '9px',
                            padding: 0
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Form Actions */}
            <div style={{
              padding: '18px 24px',
              background: '#f8fafc',
              borderTop: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {selectedDates.length > 0 ? (
                  <span>Ready to submit <strong>{selectedDates.length}</strong> date(s) for verification.</span>
                ) : (
                  <span>Please select at least 1 visit date from the calendar above.</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ clientName: '', projectName: '', siteLocation: '', contactPerson: '', purposeDescription: '' });
                    setSelectedDates([]);
                    setFormErrors({});
                  }}
                  style={{
                    background: '#fff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'var(--accent-indigo, #9d174d)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(157, 23, 77, 0.3)'
                  }}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="spinner" /> Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Submit for HR Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB 2: REQUESTS TABLE (APPROVALS, ALL, MY REQUESTS)     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab !== 'apply' && (
        <div style={{
          background: 'var(--card-bg, #fff)',
          borderRadius: '16px',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          {/* Table Header Bar & Filter Controls */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-light, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary, #1e293b)' }}>
                {activeTab === 'approvals' && 'Pending Client Site Verification Requests'}
                {activeTab === 'all-records' && 'Complete Client Site Work Verification Log'}
                {activeTab === 'my-requests' && 'My Client Site Work Submissions'}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                {activeTab === 'approvals' && 'Review employee on-site visits and verify them to credit Present attendance.'}
                {activeTab === 'all-records' && 'Audit trail of all client site requests, approved records, and rejected entries.'}
                {activeTab === 'my-requests' && 'Status of your submitted client site visits and attendance regularization.'}
              </p>
            </div>

            {/* Search and Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '230px' }}>
                <FaSearch size={12} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search client, employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light, #cbd5e1)',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {activeTab === 'all-records' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaFilter size={11} color="#64748b" style={{ marginRight: '4px' }} />
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: statusFilter === st ? 700 : 500,
                        background: statusFilter === st ? 'var(--primary-navy, #3b1f2b)' : '#f1f5f9',
                        color: statusFilter === st ? '#fff' : '#475569'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 18px', color: '#475569', fontWeight: 600 }}>Employee Details</th>
                  <th style={{ textAlign: 'left', padding: '12px 18px', color: '#475569', fontWeight: 600 }}>Client & Project</th>
                  <th style={{ textAlign: 'left', padding: '12px 18px', color: '#475569', fontWeight: 600 }}>Site Location</th>
                  <th style={{ textAlign: 'left', padding: '12px 18px', color: '#475569', fontWeight: 600 }}>Dates Requested</th>
                  <th style={{ textAlign: 'left', padding: '12px 18px', color: '#475569', fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '12px 18px', color: '#475569', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      <LoadingSpinner message="Loading client site work records..." />
                    </td>
                  </tr>
                ) : paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                      <FaMapMarkerAlt size={28} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No client site work records found.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        {searchTerm ? 'Try adjusting your search criteria.' : 'Click "Log Client Visit" to submit on-duty client work.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedList.map(item => {
                    const meta = getEmployeeMeta(item);
                    const dates = item.dates || [];
                    const isPending = item.status === 'PENDING_VERIFICATION' || item.status === 'PENDING';

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Employee Details */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: 'var(--accent-indigo-pale, #fbcfe8)',
                              color: 'var(--accent-indigo, #9d174d)',
                              fontWeight: 700,
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {(meta.name[0] || 'E').toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                                {meta.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {meta.code !== '--' ? `${meta.code} • ` : ''}{meta.dept}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Client & Project */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {item.clientName || '--'}
                          </div>
                          {item.projectName && (
                            <div style={{ fontSize: '11px', color: 'var(--accent-indigo, #9d174d)', fontWeight: 500 }}>
                              {item.projectName}
                            </div>
                          )}
                        </td>

                        {/* Location */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '12px' }}>
                            <FaMapMarkerAlt size={11} color="#94a3b8" />
                            <span>{item.siteLocation || '--'}</span>
                          </div>
                          {item.contactPerson && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              SPOC: {item.contactPerson}
                            </div>
                          )}
                        </td>

                        {/* Dates Requested */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                            {dates.slice(0, 2).map(d => (
                              <span
                                key={d}
                                style={{
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                {formatDateDisplay(d)}
                              </span>
                            ))}
                            {dates.length > 2 && (
                              <span style={{
                                background: '#e0e7ff',
                                color: '#3730a3',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}>
                                +{dates.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          {renderStatusBadge(item.status)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => setDetailModalItem(item)}
                              style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="View Details"
                            >
                              <FaEye size={11} /> View
                            </button>

                            {isApprover && isPending && (
                              <>
                                <button
                                  onClick={() => {
                                    setApproveModalItem(item);
                                    setApproveRemarks('');
                                  }}
                                  style={{
                                    background: '#15803d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Approve & Regularize Attendance"
                                >
                                  <FaCheck size={10} /> Approve
                                </button>

                                <button
                                  onClick={() => {
                                    setRejectModalItem(item);
                                    setRejectionReason('');
                                  }}
                                  style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Reject Request"
                                >
                                  <FaTimes size={10} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to {Math.min(currentPage * ROWS_PER_PAGE, displayedList.length)} of {displayedList.length} records
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: currentPage === 1 ? '#94a3b8' : '#475569'
                  }}
                >
                  Previous
                </button>

                <span style={{ fontSize: '12px', fontWeight: 600, padding: '5px 10px', color: '#1e293b' }}>
                  {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    color: currentPage === totalPages ? '#94a3b8' : '#475569'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL 1: VIEW DETAILS                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {detailModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileAlt color="var(--accent-indigo, #9d174d)" size={16} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                  Client Site Work Details
                </h3>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 24px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Employee</div>
                  <div style={{ fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {getEmployeeMeta(detailModalItem).name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {getEmployeeMeta(detailModalItem).dept}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
                  <div style={{ marginTop: '4px' }}>
                    {renderStatusBadge(detailModalItem.status)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Client Organization</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                    {detailModalItem.clientName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Project Name</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                    {detailModalItem.projectName || '--'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Site Location / Address</div>
                <div style={{ color: '#1e293b', marginTop: '2px' }}>
                  {detailModalItem.siteLocation}
                </div>
              </div>

              {detailModalItem.contactPerson && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Client SPOC</div>
                  <div style={{ color: '#1e293b', marginTop: '2px' }}>
                    {detailModalItem.contactPerson}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Purpose & Deliverables</div>
                <div style={{ color: '#1e293b', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px', lineHeight: 1.5 }}>
                  {detailModalItem.purposeDescription}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Visit Dates ({detailModalItem.dates?.length || 0})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(detailModalItem.dates || []).map(d => (
                    <span key={d} style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                      {formatDateDisplay(d)}
                    </span>
                  ))}
                </div>
              </div>

              {detailModalItem.rejectionReason && (
                <div style={{ marginTop: '14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#b91c1c' }}>
                  <strong>HR Remarks / Rejection Reason:</strong>
                  <div style={{ marginTop: '2px' }}>{detailModalItem.rejectionReason}</div>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDetailModalItem(null)}
                style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL 2: APPROVE CONFIRMATION                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {approveModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#dcfce7', color: '#15803d', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaCheck />
              </span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Approve Client Site Work
              </h3>
            </div>

            <div style={{ padding: '20px 24px', fontSize: '13px' }}>
              <p style={{ margin: '0 0 12px 0', color: '#334155', lineHeight: 1.5 }}>
                You are approving client site visits for <strong>{getEmployeeMeta(approveModalItem).name}</strong> at <strong>{approveModalItem.clientName}</strong>.
              </p>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', marginBottom: '16px', color: '#166534', fontSize: '12px' }}>
                ✅ <strong>{approveModalItem.dates?.length || 0} date(s)</strong> will be immediately marked and regularized as <strong>Present (9.0 hrs)</strong> in the attendance records.
              </div>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Optional Approval Remarks
              </label>
              <input
                type="text"
                placeholder="e.g., Client visit verified and on-duty attendance approved"
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                disabled={actionLoading}
                onClick={() => setApproveModalItem(null)}
                style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmApprove}
                style={{
                  background: '#15803d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {actionLoading ? <FaSpinner className="spinner" /> : <FaCheck />} Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL 3: REJECT CONFIRMATION                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {rejectModalItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#fee2e2', color: '#b91c1c', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaTimes />
              </span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                Reject Client Site Work Request
              </h3>
            </div>

            <div style={{ padding: '20px 24px', fontSize: '13px' }}>
              <p style={{ margin: '0 0 12px 0', color: '#334155', lineHeight: 1.5 }}>
                Rejecting client site work for <strong>{getEmployeeMeta(rejectModalItem).name}</strong>. Attendance for these dates will not be credited as Present.
              </p>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Rejection Reason <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="State the reason for rejection (e.g., Client visit unconfirmed by manager, dates already applied under leave)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                disabled={actionLoading}
                onClick={() => setRejectModalItem(null)}
                style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmReject}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {actionLoading ? <FaSpinner className="spinner" /> : <FaTimes />} Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSiteWork;
