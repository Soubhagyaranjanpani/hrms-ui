import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast, ToastContainer } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

/* Unwrap { response: {...}, status, message } OR { data: {...} } OR raw */
const unwrap = (json) => json?.response ?? json?.data ?? json;

const EMPTY_FORM = {
  name: '',
  shiftStart: '',
  shiftEnd: '',
  graceMinutes: '',
  halfDayThresholdHours: '',
  fullDayHours: '',
  allowOvertime: false,
  isActive: true,
};

/* ─── main component ────────────────────────────────────────────────────── */
export default function AttendancePolicyPage() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  /* ── fetch active policy ── */
  const fetchActive = async () => {
    setLoading(true);
    try {
      const res = await authFetch(API_ENDPOINTS.GET_ACTIVE_POLICY);
      if (res.ok) {
        const json = await res.json();
        setPolicy(unwrap(json));
      } else if (res.status === 404) {
        setPolicy(null);
      }
    } catch {
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  /* ── create ── */
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
      const payload = {
        ...form,
        graceMinutes: Number(form.graceMinutes),
        halfDayThresholdHours: Number(form.halfDayThresholdHours),
        fullDayHours: Number(form.fullDayHours),
      };
      const res = await authFetch(API_ENDPOINTS.CREATE_POLICY, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Success!', 'Policy created successfully!');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchActive();
    } catch (e) {
      toast.error('Error', e.message || 'Failed to create policy.');
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

  /* ─── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="main-content" style={{ padding: '32px 36px' }}>
      <ToastContainer />

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1>Attendance Policy</h1>
            <p>Manage shift rules, grace periods &amp; overtime configuration</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '17px', lineHeight: 1 }}>+</span> Create Policy
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px' }}>
          <LoadingSpinner message="Loading policy data..." />
        </div>

      ) : policy ? (
        <div className="card-modern" style={{ overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{
            padding: '24px 28px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 13,
                background: 'var(--accent-indigo-pale)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                border: '1px solid var(--border-light)'
              }}>🕐</div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  fontFamily: "'Sora', sans-serif"
                }}>
                  {policy.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unnamed Policy</span>}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                  <span className={`badge-${policy.isActive ? 'success' : 'info'}`}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {!policy.isActive && (
                <button
                  onClick={() => handleActivate(policy.id)}
                  disabled={activating}
                  className="btn-outline-indigo"
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  {activating ? 'Activating...' : '✦ Activate'}
                </button>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{
            padding: '24px 28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div className="stat-card">
              <div className="stat-label">Shift Start</div>
              <div className="stat-value total">{fmtTime(policy.shiftStart)}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Shift End</div>
              <div className="stat-value total">{fmtTime(policy.shiftEnd)}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Grace Period</div>
              <div className="stat-value hours">{policy.graceMinutes != null ? `${policy.graceMinutes} min` : '—'}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Half-Day After</div>
              <div className="stat-value late">{policy.halfDayThresholdHours != null ? `${policy.halfDayThresholdHours} hrs` : '—'}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Full-Day Hours</div>
              <div className="stat-value present">{policy.fullDayHours != null ? `${policy.fullDayHours} hrs` : '—'}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Overtime</div>
              <div className="stat-value" style={{ color: policy.allowOvertime ? 'var(--success)' : 'var(--text-muted)' }}>
                {policy.allowOvertime == null ? 'Not Set' : policy.allowOvertime ? 'Allowed' : 'Disabled'}
              </div>
            </div>
          </div>

          {/* Footer info strip */}
          <div style={{
            margin: '0 28px 22px',
            padding: '10px 16px',
            background: 'var(--bg-surface)',
            borderRadius: 10,
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--text-muted)'
          }}>
            <span>ℹ️</span>
            Only one policy can be active at a time. Creating a new policy and marking it active will replace the current one.
          </div>
        </div>

      ) : (
        /* Empty state */
        <div className="card-modern" style={{
          padding: '64px 32px',
          textAlign: 'center',
          border: '2px dashed var(--border-medium)'
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
            Create an attendance policy to define shift hours, grace periods, and overtime rules for your organisation.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient"
          >
            + Create First Policy
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setForm(EMPTY_FORM);
            }
          }}
          className="emp-modal-overlay"
        >
          <div className="emp-modal" style={{ maxWidth: '500px', width: '90%', textAlign: 'left' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 className="emp-modal-title" style={{ textAlign: 'center' }}>Create Attendance Policy</h3>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Define shift &amp; working-hour rules
              </p>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
              {/* Policy Name */}
              <div className="emp-field" style={{ marginBottom: '16px' }}>
                <div className="emp-label-row">
                  <label>Policy Name <span className="req">*</span></label>
                </div>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Standard 9–6 Shift"
                  className="form-control-modern"
                />
              </div>

              {/* Shift Times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="emp-field">
                  <label>Shift Start <span className="req">*</span></label>
                  <input
                    type="time"
                    name="shiftStart"
                    value={form.shiftStart}
                    onChange={handleChange}
                    className="form-control-modern"
                  />
                </div>
                <div className="emp-field">
                  <label>Shift End <span className="req">*</span></label>
                  <input
                    type="time"
                    name="shiftEnd"
                    value={form.shiftEnd}
                    onChange={handleChange}
                    className="form-control-modern"
                  />
                </div>
              </div>

              {/* Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="emp-field">
                  <label>Grace (min) <span className="req">*</span></label>
                  <input
                    type="number"
                    name="graceMinutes"
                    min="0"
                    value={form.graceMinutes}
                    onChange={handleChange}
                    placeholder="15"
                    className="form-control-modern"
                  />
                </div>
                <div className="emp-field">
                  <label>Half-Day (hrs) <span className="req">*</span></label>
                  <input
                    type="number"
                    name="halfDayThresholdHours"
                    min="0"
                    value={form.halfDayThresholdHours}
                    onChange={handleChange}
                    placeholder="4"
                    className="form-control-modern"
                  />
                </div>
                <div className="emp-field">
                  <label>Full-Day (hrs) <span className="req">*</span></label>
                  <input
                    type="number"
                    name="fullDayHours"
                    min="0"
                    value={form.fullDayHours}
                    onChange={handleChange}
                    placeholder="8"
                    className="form-control-modern"
                  />
                </div>
              </div>

              {/* Toggle switches */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>Allow Overtime</p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>Enable beyond-shift hours</p>
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
                  padding: '10px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>Set as Active</p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>Activate immediately</p>
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

            <div className="emp-modal-actions" style={{ marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                }}
                className="emp-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="emp-modal-confirm"
                style={{
                  background: saving ? 'var(--text-muted)' : 'linear-gradient(135deg, var(--accent-indigo), var(--accent-indigo-light))'
                }}
              >
                {saving ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}