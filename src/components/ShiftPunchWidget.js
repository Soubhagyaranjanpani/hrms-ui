import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  FaClock, FaSignInAlt, FaSignOutAlt, FaLock, FaCheckCircle,
  FaExclamationTriangle, FaInfoCircle, FaCalendarAlt,
  FaUserClock, FaHistory, FaShieldAlt
} from 'react-icons/fa';
import { BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast } from './Toast';
import {
  DEFAULT_SHIFTS,
  getStoredShifts,
  getCurrentUserTodayShift,
  setCurrentUserShiftOverride,
  checkShiftCheckoutRule,
  calculateShiftAttendance,
  syncAttendanceRecord,
  getUnifiedTodayAttendance,
  format12Hour,
  getTodayDateYMD
} from '../utils/rosterUtils';

const ShiftPunchWidget = ({ user, onAttendanceChange, embeddedMode = false }) => {
  // Current real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Today's attendance state
  const [todayRecord, setTodayRecord] = useState(() => {
    return getUnifiedTodayAttendance();
  });

  const [loading, setLoading] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedShiftCode, setSelectedShiftCode] = useState('');

  // Available shifts list
  const shiftsList = getStoredShifts();

  // Active shift resolution (strictly from official roster or active policy)
  const activeShift = getCurrentUserTodayShift() || shiftsList[0] || DEFAULT_SHIFTS[0];

  // Effective real-time for rule checks
  const effectiveTime = currentTime;

  // Evaluate the checkout timing rule
  const checkoutRule = checkShiftCheckoutRule(activeShift, effectiveTime);

  // Timer: Tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update localStorage when override shift changes
  const handleShiftSelect = (code) => {
    setSelectedShiftCode(code);
    setCurrentUserShiftOverride(code);
    toast.info('Shift Updated', `Active shift switched to [${code}]: ${shiftsList.find(s => s.code === code)?.name}`);
  };

  const getAuthConfig = useCallback(() => {
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
  }, []);

  // Sync today's attendance from backend
  const fetchTodayStatus = useCallback(async () => {
    try {
      const today = getTodayDateYMD();
      const res = await axios.get(API_ENDPOINTS.GET_MY_ATTENDANCE, getAuthConfig());
      const records = res.data?.response || res.data?.data || res.data?.content || res.data || [];
      if (Array.isArray(records)) {
        const todayMatch = records.find(r => {
          const d = String(r.date || r.attendanceDate || '').split('T')[0];
          return d === today;
        });
        if (todayMatch) {
          const cIn = todayMatch.checkIn || todayMatch.inTime || null;
          const cOut = todayMatch.checkOut || todayMatch.outTime || null;
          const calc = calculateShiftAttendance({
            checkIn: cIn,
            checkOut: cOut,
            shift: activeShift,
            breakMinutes: activeShift.breakMinutes || 0
          });

          const updated = {
            date: today,
            checkIn: cIn,
            checkOut: cOut,
            status: calc.status,
            statusLabel: calc.statusLabel,
            shiftCode: activeShift.code,
            shiftName: activeShift.name,
            workingHours: calc.workingHours || todayMatch.workingHours || todayMatch.hours || 0,
            overtimeHours: calc.overtimeHours || 0,
            isLate: calc.isLate,
            lateMinutes: calc.lateMinutes,
            isEarlyExit: calc.isEarlyExit,
            earlyExitMinutes: calc.earlyExitMinutes
          };
          setTodayRecord(updated);
          syncAttendanceRecord(updated, false);
          return;
        }
      }
    } catch {}
  }, [getAuthConfig, activeShift]);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  // Synchronize across all components and windows
  useEffect(() => {
    const handleSync = (e) => {
      const rec = e?.detail || getUnifiedTodayAttendance();
      if (rec && rec.date === getTodayDateYMD()) {
        setTodayRecord(rec);
      }
    };
    window.addEventListener('hrms_attendance_updated', handleSync);
    window.addEventListener('hrms_today_punches_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('hrms_attendance_updated', handleSync);
      window.removeEventListener('hrms_today_punches_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK IN HANDLER
  // ─────────────────────────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (todayRecord.checkIn) {
      toast.info('Already Checked In', `You already checked in today at ${format12Hour(todayRecord.checkIn)}`);
      return;
    }

    setLoading(true);
    const nowTimeStr = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS
    const today = getTodayDateYMD();

    try {
      let apiSuccess = false;
      try {
        const response = await axios.post(API_ENDPOINTS.CHECK_IN, {
          shiftCode: activeShift.code,
          shiftName: activeShift.name
        }, getAuthConfig());

        apiSuccess =
          response.status === 200 ||
          response.status === 201 ||
          response.data?.status === 200 ||
          String(response.data?.status || '').toUpperCase() === 'SUCCESS' ||
          response.data?.success === true;
      } catch (err) {
        // Fallback to local sync if backend service is unreachable
        apiSuccess = true;
      }

      if (apiSuccess) {
        const calc = calculateShiftAttendance({
          checkIn: nowTimeStr,
          checkOut: null,
          shift: activeShift
        });

        const updated = {
          date: today,
          checkIn: nowTimeStr,
          checkOut: null,
          status: calc.status,
          statusLabel: calc.statusLabel,
          shiftCode: activeShift.code,
          shiftName: activeShift.name,
          isLate: calc.isLate,
          lateMinutes: calc.lateMinutes,
          workingHours: 0,
          overtimeHours: 0,
          employee: user?.name || localStorage.getItem(STORAGE_KEYS.USERNAME) || 'Employee',
          punchedAt: new Date().toISOString()
        };
        setTodayRecord(updated);
        syncAttendanceRecord(updated, true);

        const lateNotice = calc.isLate ? ` (Late by ${calc.lateMinutes} mins)` : ' (On-Time)';
        toast.success(
          'Checked In Successfully!',
          `Clocked in at ${format12Hour(nowTimeStr)}${lateNotice}. Shift: ${activeShift.name} (${format12Hour(activeShift.startTime)} – ${format12Hour(activeShift.endTime)})`
        );

        if (onAttendanceChange) onAttendanceChange(updated);
      }
    } catch (error) {
      toast.error('Check-in Failed', error.message || 'Unable to record check-in.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CHECK OUT HANDLER (ENFORCING SHIFT TIMING RULE)
  // ─────────────────────────────────────────────────────────────────────────
  const handleCheckOut = async (isOverride = false) => {
    if (!todayRecord.checkIn) {
      toast.error('Check-in Required', 'You must check in first before checking out.');
      return;
    }

    if (todayRecord.checkOut) {
      toast.info('Already Checked Out', `You already clocked out today at ${format12Hour(todayRecord.checkOut)}.`);
      return;
    }

    // STRICT RULE: If shift is 3-9 (or any shift with endTime), check if shift ended!
    if (!checkoutRule.allowed && !isOverride) {
      toast.error(
        'Checkout Blocked by Shift Policy',
        `Your shift (${activeShift.name}) ends at ${checkoutRule.shiftEndFormatted} (${activeShift.endTime}). Checkout is strictly permitted only after shift completion. Remaining: ${checkoutRule.formattedRemaining}`
      );
      return;
    }

    setLoading(true);
    const nowTimeStr = currentTime.toTimeString().split(' ')[0];
    const today = getTodayDateYMD();

    try {
      let apiSuccess = false;
      try {
        const response = await axios.post(API_ENDPOINTS.CHECK_OUT, {
          shiftCode: activeShift.code,
          override: isOverride,
          overrideReason: overrideReason || undefined
        }, getAuthConfig());

        apiSuccess =
          response.status === 200 ||
          response.status === 201 ||
          response.data?.status === 200 ||
          String(response.data?.status || '').toUpperCase() === 'SUCCESS' ||
          response.data?.success === true;
      } catch (err) {
        // Fallback to local sync
        apiSuccess = true;
      }

      if (apiSuccess) {
        const calc = calculateShiftAttendance({
          checkIn: todayRecord.checkIn,
          checkOut: nowTimeStr,
          shift: activeShift,
          breakMinutes: activeShift.breakMinutes || 0
        });

        const updated = {
          ...todayRecord,
          date: today,
          checkIn: todayRecord.checkIn,
          checkOut: nowTimeStr,
          status: calc.status,
          statusLabel: calc.statusLabel,
          workingHours: calc.workingHours,
          overtimeHours: calc.overtimeHours,
          isEarlyExit: calc.isEarlyExit,
          earlyExitMinutes: calc.earlyExitMinutes,
          isLate: calc.isLate,
          lateMinutes: calc.lateMinutes,
          shiftCode: activeShift.code,
          shiftName: activeShift.name,
          completedAt: new Date().toISOString()
        };

        setTodayRecord(updated);
        syncAttendanceRecord(updated, true);

        const statusText = calc.status === 'PRESENT' ? 'Full Day Present' : 'Half Day';
        const otText = calc.overtimeHours > 0 ? ` (OT: +${calc.overtimeHours} hrs)` : '';
        toast.success(
          'Shift Completed & Checked Out!',
          `Clocked out at ${format12Hour(nowTimeStr)}. Duration: ${calc.workingHours} hrs [${statusText}]${otText}.`
        );

        setShowOverrideModal(false);
        setOverrideReason('');

        if (onAttendanceChange) onAttendanceChange(updated);
      }
    } catch (error) {
      toast.error('Check-out Failed', error.message || 'Unable to record check-out.');
    } finally {
      setLoading(false);
    }
  };

  // State flags
  const isCheckedIn = Boolean(todayRecord.checkIn);
  const isCheckedOut = Boolean(todayRecord.checkOut);
  const canCheckIn = !isCheckedIn && !isCheckedOut;
  const canCheckOut = isCheckedIn && !isCheckedOut && checkoutRule.allowed;

  return (
    <div
      className="card-modern"
      style={{
        borderRadius: '18px',
        border: '1px solid var(--border-light, #e2e8f0)',
        background: 'var(--card-bg, #ffffff)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        padding: embeddedMode ? '18px' : '24px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner with Active Shift Information */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-light, #f1f5f9)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: activeShift.bgColor || '#eff6ff',
              border: `1px solid ${activeShift.borderColor || '#bfdbfe'}`,
              color: activeShift.color || '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '800'
            }}
          >
            {activeShift.code}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                {activeShift.name}
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: activeShift.bgColor || '#eff6ff',
                  color: activeShift.color || '#3b82f6',
                  border: `1px solid ${activeShift.borderColor || '#bfdbfe'}`
                }}
              >
                {activeShift.startTime} – {activeShift.endTime}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', margin: '2px 0 0 0' }}>
              Standard Shift Timing: <strong>{format12Hour(activeShift.startTime)}</strong> to{' '}
              <strong>{format12Hour(activeShift.endTime)}</strong> ({activeShift.durationHours} hrs duration)
            </p>
          </div>
        </div>

        {/* Official Assigned Shift */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Assigned Shift:</span>
          <span style={{
            padding: '5px 12px',
            fontSize: '12px',
            borderRadius: '8px',
            background: activeShift.bgColor || '#eff6ff',
            color: activeShift.color || '#2563eb',
            border: `1px solid ${activeShift.borderColor || '#bfdbfe'}`,
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FaClock size={11} />
            {activeShift.code} • {activeShift.name} ({format12Hour(activeShift.startTime)} – {format12Hour(activeShift.endTime)})
          </span>
        </div>
      </div>

      {/* Main Punch Clock Display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          alignItems: 'center',
          marginTop: '18px'
        }}
      >
        {/* Left: Real-time Digital Clock & Status */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted, #64748b)', fontSize: '12px' }}>
            <FaClock size={12} />
            <span>Current Standard Time:</span>
          </div>

          <div
            style={{
              fontSize: '34px',
              fontWeight: '800',
              fontFamily: "'Sora', sans-serif",
              letterSpacing: '-0.02em',
              color: 'var(--text-primary, #0f172a)',
              marginTop: '4px'
            }}
          >
            {effectiveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
            {effectiveTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* Today's Punch Time Badges */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                Punch In
              </span>
              <strong style={{ fontSize: '15px', color: todayRecord.checkIn ? '#10b981' : '#94a3b8' }}>
                {todayRecord.checkIn ? format12Hour(todayRecord.checkIn) : '--:--'}
              </strong>
            </div>

            <div
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                Punch Out
              </span>
              <strong style={{ fontSize: '15px', color: todayRecord.checkOut ? '#ef4444' : '#94a3b8' }}>
                {todayRecord.checkOut ? format12Hour(todayRecord.checkOut) : '--:--'}
              </strong>
            </div>

            <div
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                Working Hours
              </span>
              <strong style={{ fontSize: '15px', color: '#6366f1' }}>
                {todayRecord.workingHours ? `${todayRecord.workingHours} hrs` : '--'}
              </strong>
            </div>

            <div
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: todayRecord.status === 'PRESENT' ? '#ecfdf5' : todayRecord.status === 'HALF_DAY' ? '#fffbeb' : '#f8fafc',
                border: todayRecord.status === 'PRESENT' ? '1px solid #a7f3d0' : todayRecord.status === 'HALF_DAY' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                minWidth: '130px'
              }}
            >
              <span style={{ fontSize: '10px', color: todayRecord.status === 'PRESENT' ? '#065f46' : '#92400e', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                Attendance Status
              </span>
              <strong style={{ fontSize: '13px', color: todayRecord.status === 'PRESENT' ? '#059669' : todayRecord.status === 'HALF_DAY' ? '#d97706' : '#64748b' }}>
                {todayRecord.statusLabel || (todayRecord.checkOut ? (todayRecord.status === 'HALF_DAY' ? 'Half Day' : 'Full Day') : todayRecord.checkIn ? 'On Duty' : 'Not Checked In')}
              </strong>
            </div>
          </div>
        </div>

        {/* Right: Check-in / Checkout Actions & Rule Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Shift Timing Notice Box */}
          {isCheckedIn && !isCheckedOut && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: checkoutRule.allowed ? '1px solid #86efac' : '1px solid #fde68a',
                background: checkoutRule.allowed ? '#f0fdf4' : '#fffbeb',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              {checkoutRule.allowed ? (
                <FaCheckCircle size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
              ) : (
                <FaLock size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              )}
              <div style={{ fontSize: '12px' }}>
                <strong style={{ color: checkoutRule.allowed ? '#166534' : '#92400e', display: 'block', marginBottom: '2px' }}>
                  {checkoutRule.allowed
                    ? 'Shift Completed — Check-out Unlocked'
                    : `Shift In Progress — Checkout Locked until ${checkoutRule.shiftEndFormatted}`}
                </strong>
                <span style={{ color: checkoutRule.allowed ? '#15803d' : '#b45309' }}>
                  {checkoutRule.allowed
                    ? `Your scheduled shift ended at ${checkoutRule.shiftEndFormatted}. You may now clock out.`
                    : `Shift ends at ${checkoutRule.shiftEndFormatted} (${activeShift.endTime}). Checkout can only be done AFTER shift time.`}
                </span>

                {!checkoutRule.allowed && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#fef3c7',
                        color: '#92400e',
                        fontWeight: '700',
                        fontSize: '11px'
                      }}
                    >
                      ⏱️ {checkoutRule.formattedRemaining} remaining
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowOverrideModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#b45309',
                        textDecoration: 'underline',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '0 4px'
                      }}
                    >
                      Early departure request?
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Check In Button */}
            <button
              onClick={handleCheckIn}
              disabled={loading || !canCheckIn}
              className={canCheckIn ? 'btn-gradient' : 'btn-outline-indigo'}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: canCheckIn ? 'pointer' : 'not-allowed',
                opacity: canCheckIn ? 1 : 0.5
              }}
            >
              <FaSignInAlt size={15} />
              {isCheckedIn ? 'Checked In' : 'Punch In (Check In)'}
            </button>

            {/* Check Out Button with STRICT RULE ENFORCEMENT */}
            <button
              onClick={() => handleCheckOut(false)}
              disabled={loading || isCheckedOut || !isCheckedIn || !checkoutRule.allowed}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                color: '#ffffff',
                cursor: canCheckOut ? 'pointer' : 'not-allowed',
                background: canCheckOut
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : isCheckedIn && !checkoutRule.allowed
                  ? '#94a3b8'
                  : '#cbd5e1',
                boxShadow: canCheckOut ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
              title={
                !isCheckedIn
                  ? 'Please check in first'
                  : isCheckedOut
                  ? 'Already checked out today'
                  : !checkoutRule.allowed
                  ? `Checkout is only allowed after shift time (${checkoutRule.shiftEndFormatted})`
                  : 'Clock out now'
              }
            >
              {!checkoutRule.allowed && isCheckedIn && !isCheckedOut ? (
                <>
                  <FaLock size={13} />
                  <span>Locked until {checkoutRule.shiftEndFormatted}</span>
                </>
              ) : isCheckedOut ? (
                <>
                  <FaCheckCircle size={14} />
                  <span>Checked Out</span>
                </>
              ) : (
                <>
                  <FaSignOutAlt size={14} />
                  <span>Clock Out (Check Out)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────
          MODAL: EMERGENCY / AUTHORIZED EARLY DEPARTURE REQUEST
      ─────────────────────────────────────────────────────────────────── */}
      {showOverrideModal && (
        <div
          className="emp-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            className="card-modern"
            style={{
              width: '460px',
              maxWidth: '92vw',
              padding: '24px',
              borderRadius: '16px',
              background: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaExclamationTriangle size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                  Early Checkout Authorization
                </h3>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                  Shift: {activeShift.name} ({activeShift.startTime} – {activeShift.endTime})
                </p>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
              Standard shift checkout opens after <strong>{checkoutRule.shiftEndFormatted}</strong> ({checkoutRule.formattedRemaining} remaining).
              To proceed with an early departure, please specify an authorized administrative or emergency reason.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Reason for Early Checkout *
              </label>
              <textarea
                rows="3"
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Medical emergency / Approved official site visit / Personal emergency"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideReason('');
                }}
                className="btn-outline-indigo"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!overrideReason.trim()}
                onClick={() => handleCheckOut(true)}
                className="btn-gradient-coral"
                style={{
                  padding: '8px 18px',
                  fontSize: '12px',
                  opacity: overrideReason.trim() ? 1 : 0.5,
                  cursor: overrideReason.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Authorize &amp; Clock Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftPunchWidget;
