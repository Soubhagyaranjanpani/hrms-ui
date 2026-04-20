import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaEdit, FaSave, FaTimes, FaArrowLeft,
  FaPlus, FaEye, FaDownload, FaCheckCircle, FaClock,
  FaRupeeSign, FaExclamationCircle, FaCheck, FaPrint,
  FaPaperPlane, FaBan, FaUndo,
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import axios from 'axios';

/* ─── helpers ───────────────────────────────────────────── */
const cleanName = (n) => (n || '').replace(/\s+null\s*/gi, ' ').replace(/\s+null$/i, '').replace(/^null\s+/i, '').trim();
const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));
const toLabelFull = (ym) => { try { const [y, m] = ym.split('-'); return new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' }); } catch { return ym; } };
const currentYM = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`; };
const getInitials = (n) => { const p = cleanName(n).trim().split(/\s+/); return p.length === 1 ? p[0][0]?.toUpperCase() || '?' : (p[0][0] + p[p.length - 1][0]).toUpperCase(); };

const avatarColors = [
  { bg: '#ede9fe', color: '#5b21b6' }, { bg: '#fff0e8', color: '#c2410c' },
  { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef3c7', color: '#92400e' },
  { bg: '#e0e7ff', color: '#3730a3' }, { bg: '#fce7f3', color: '#9d174d' },
];
const getAvatarColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];

const STATUS_CFG = {
  DRAFT: { bg: '#f1f5f9', color: '#475569', label: 'Draft', icon: null },
  PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pending', icon: <FaClock size={9} /> },
  APPROVED: { bg: '#dbeafe', color: '#1e40af', label: 'Approved', icon: <FaCheckCircle size={9} /> },
  PROCESSED: { bg: '#dcfce7', color: '#166534', label: 'Processed', icon: <FaCheckCircle size={9} /> },
  PAID: { bg: '#f3e8ff', color: '#5b21b6', label: 'Paid', icon: <FaCheckCircle size={9} /> },
  REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected', icon: <FaBan size={9} /> },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.DRAFT;
  return (
    <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {c.icon}
      {c.label}
    </span>
  );
};

const FieldError = ({ msg }) =>
  msg ? <span className="field-err"><FaExclamationCircle size={10} /> {msg}</span> : null;

/* ─── validation ────────────────────────────────────────── */
const RULES = {
  basicSalary: { required: true, min: 0 },
  hra: { required: false, min: 0 },
  travelAllow: { required: false, min: 0 },
  medicalAllow: { required: false, min: 0 },
  specialAllow: { required: false, min: 0 },
  otherEarnings: { required: false, min: 0 },
  providentFund: { required: false, min: 0 },
  professionalTax: { required: false, min: 0 },
  incomeTax: { required: false, min: 0 },
  loanDeduction: { required: false, min: 0 },
  otherDeductions: { required: false, min: 0 },
  workingDays: { required: true, min: 1, max: 31 },
  paidDays: { required: true, min: 0 },
  lopDays: { required: true, min: 0 },
};

const validateField = (field, value, editForm) => {
  const rule = RULES[field];
  if (!rule) return '';
  const num = Number(value);
  if (rule.required && (value === '' || value === null || value === undefined)) return 'Required';
  if (value !== '' && value !== null && value !== undefined) {
    if (isNaN(num)) return 'Must be a number';
    if (rule.min !== undefined && num < rule.min) return `Min ${rule.min}`;
    if (rule.max !== undefined && num > rule.max) return `Max ${rule.max}`;
  }
  return '';
};

const validateAllEdit = (form) => {
  const errs = {};
  Object.keys(RULES).forEach(f => { const e = validateField(f, form[f]); if (e) errs[f] = e; });
  if (Number(form.paidDays) > Number(form.workingDays))
    errs.paidDays = 'Cannot exceed working days';
  if (Number(form.lopDays) + Number(form.paidDays) > Number(form.workingDays))
    errs.lopDays = 'LOP + Paid cannot exceed working days';
  return errs;
};

const emptyEditForm = () => ({
  basicSalary: '', hra: '', travelAllow: '', medicalAllow: '', specialAllow: '', otherEarnings: '',
  providentFund: '', professionalTax: '', incomeTax: '', loanDeduction: '', otherDeductions: '',
  workingDays: '26', paidDays: '26', lopDays: '0', remarks: '',
});

const emptyGenerateForm = () => ({
  yearMonth: currentYM(), workingDays: '26', useSalaryStructure: true,
  defaultBasic: '15000', defaultHra: '6000', defaultTravelAllow: '1600', defaultMedicalAllow: '1250',
  defaultSpecialAllow: '2000', defaultPF: '1800', defaultPT: '200',
});

/* ─── Payslip Modal with PDF Download ────────────────── */
const PayslipModal = ({ record, onClose, axiosConfig }) => {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head><title>Payslip</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#111;padding:40px;max-width:700px;margin:0 auto}.header{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:24px 30px;border-radius:16px 16px 0 0}.header h1{font-size:22px;margin-bottom:4px}.header p{font-size:12px;opacity:.8}.body{border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:24px 30px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;padding:16px 0;border-bottom:1px solid #e5e7eb;margin-bottom:20px}.info-item label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:2px}.info-item span{font-size:13px;font-weight:600}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f9fafb;padding:10px 14px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase}td{padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px}.net{background:#f0fdf4;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-top:12px}.net .label{font-size:14px;font-weight:600;color:#374151}.net .value{font-size:24px;font-weight:700;color:#059669}.footer{margin-top:20px;text-align:center;font-size:10px;color:#9ca3af}@media print{@page{margin:1cm}}</style>
    </head><body>
    <div class="header"><h1>PAYSLIP</h1><p>${record.payrollMonth || ''} &nbsp;|&nbsp; Code: ${record.employeeCode || '—'}</p></div>
    <div class="body">
      <div class="info-grid">
        <div class="info-item"><label>Name</label><span>${cleanName(record.employee)}</span></div>
        <div class="info-item"><label>Designation</label><span>${record.designation || '—'}</span></div>
        <div class="info-item"><label>Department</label><span>${record.department || '—'}</span></div>
        <div class="info-item"><label>Branch</label><span>${record.branch || '—'}</span></div>
        <div class="info-item"><label>Working Days</label><span>${record.workingDays || 0}</span></div>
        <div class="info-item"><label>Paid / LOP</label><span>${record.paidDays || 0} / ${record.lopDays || 0}</span></div>
        <div class="info-item"><label>Payment Date</label><span>${record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('en-IN') : 'Pending'}</span></div>
        <div class="info-item"><label>Status</label><span>${record.status}</span></div>
      </div>
      <table><thead><tr><th>Earnings</th><th style="text-align:right">₹</th><th>Deductions</th><th style="text-align:right">₹</th></tr></thead>
      <tbody>
        <tr><td>Basic</td><td style="text-align:right">${fmt(record.basicSalary)}</td><td>PF</td><td style="text-align:right">${fmt(record.providentFund)}</td></tr>
        <tr><td>HRA</td><td style="text-align:right">${fmt(record.hra)}</td><td>Prof Tax</td><td style="text-align:right">${fmt(record.professionalTax)}</td></tr>
        <tr><td>Travel</td><td style="text-align:right">${fmt(record.travelAllow)}</td><td>TDS</td><td style="text-align:right">${fmt(record.incomeTax)}</td></tr>
        <tr><td>Medical</td><td style="text-align:right">${fmt(record.medicalAllow)}</td><td>Loan</td><td style="text-align:right">${fmt(record.loanDeduction)}</td></tr>
        <tr><td>Special</td><td style="text-align:right">${fmt(record.specialAllow)}</td><td>Other</td><td style="text-align:right">${fmt(record.otherDeductions)}</td></tr>
        <tr style="font-weight:700;background:#f9fafb"><td>Gross</td><td style="text-align:right;color:#059669">₹${fmt(record.grossEarnings)}</td><td>Total Deductions</td><td style="text-align:right;color:#dc2626">₹${fmt(record.totalDeductions)}</td></tr>
      </tbody></table>
      <div class="net"><span class="label">Net Take-Home</span><span class="value">₹${fmt(record.netSalary)}</span></div>
      <div class="footer">Computer-generated payslip · ${new Date().toLocaleDateString('en-IN')}</div>
    </div></body></html>`;
    const w = window.open('', '_blank', 'width=820,height=640');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
      const response = await fetch(`${BASE_URL}/api/payroll/${record.id}/payslip/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${cleanName(record.employee).replace(/\s+/g, '_')}_${record.payrollMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Downloaded', 'Payslip PDF saved successfully');
    } catch (err) {
      toast.error('Error', 'Failed to download PDF payslip');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="emp-modal-overlay" onClick={onClose}>
      <div className="emp-modal" style={{ maxWidth: 500, width: '94%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 className="emp-modal-title" style={{ margin: 0 }}>Payslip Preview</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{cleanName(record.employee)} · {record.payrollMonth}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-surface)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaTimes size={13} />
          </button>
        </div>

        {/* Avatar + name card */}
        <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 13, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {getInitials(record.employee)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{cleanName(record.employee)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)' }}>{record.designation} · {record.department}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#86efac', fontFamily: "'Sora',sans-serif" }}>₹{fmt(record.netSalary)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>Net take-home</div>
          </div>
        </div>

        {/* Days */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[['Working', record.workingDays || 0, '#4f46e5'], ['Paid', record.paidDays || 0, '#059669'], ['LOP', record.lopDays || 0, '#dc2626']].map(([l, v, c]) => (
            <div key={l} style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{l} Days</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c, fontFamily: "'Sora',sans-serif" }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Earnings vs Deductions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Earnings</div>
            {[['Basic', record.basicSalary], ['HRA', record.hra], ['Travel', record.travelAllow], ['Medical', record.medicalAllow], ['Special', record.specialAllow], ['Other', record.otherEarnings]].filter(([, v]) => (v || 0) > 0).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                <span style={{ fontWeight: 600 }}>₹{fmt(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 2px', fontWeight: 700, fontSize: 13, color: '#059669' }}>
              <span>Gross</span><span>₹{fmt(record.grossEarnings)}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Deductions</div>
            {[['PF', record.providentFund], ['Prof Tax', record.professionalTax], ['TDS', record.incomeTax], ['Loan', record.loanDeduction], ['Other', record.otherDeductions]].filter(([, v]) => (v || 0) > 0).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>-₹{fmt(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 2px', fontWeight: 700, fontSize: 13, color: '#dc2626' }}>
              <span>Total</span><span>-₹{fmt(record.totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', borderRadius: 12, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Net Take-Home</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#059669', fontFamily: "'Sora',sans-serif" }}>₹{fmt(record.netSalary)}</span>
        </div>

        <div className="emp-modal-actions" style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button className="emp-modal-cancel" onClick={onClose}>Close</button>
          <button
            className="emp-submit-btn"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
          >
            <FaPrint size={12} /> Print
          </button>
          <button
            className="emp-submit-btn"
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#059669,#10b981)' }}
          >
            {downloading ? (
              <><span className="emp-spinner" style={{ width: 12, height: 12 }} /> Downloading…</>
            ) : (
              <><FaDownload size={12} /> Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Process Modal ─────────────────────────────────────── */
const ProcessModal = ({ yearMonth, payroll, onClose, onDone, axiosConfig }) => {
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState('approved');
  const [busy, setBusy] = useState(false);

  const approvedCount = payroll.filter(p => p.status === 'APPROVED').length;
  const pendingCount = payroll.filter(p => p.status === 'PENDING').length;

  const handleProcess = async () => {
    setBusy(true);
    try {
      if (mode === 'all_pending' && pendingCount > 0)
        await axios.post(`${BASE_URL}/api/payroll/approve`, { yearMonth }, axiosConfig);
      const res = await axios.post(`${BASE_URL}/api/payroll/process`, { yearMonth, paymentDate: payDate }, axiosConfig);
      if (res.data?.status === 200 || res.status === 200) {
        toast.success('Processed', res.data?.response || res.data?.data || 'Payroll processed');
        onDone(); onClose();
      } else { toast.error('Error', res.data?.message || 'Processing failed'); }
    } catch (err) { toast.error('Error', err.response?.data?.message || 'Processing failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="emp-modal-overlay" onClick={onClose}>
      <div className="emp-modal" style={{ maxWidth: 440, width: '92%' }} onClick={e => e.stopPropagation()}>
        <h3 className="emp-modal-title">🚀 Process Payroll — {toLabelFull(yearMonth)}</h3>
        <p className="emp-modal-body">Choose which records to process and set the payment date.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '12px 0' }}>
          {[
            { val: 'approved', label: 'Process Approved records only', sub: `${approvedCount} records`, color: '#1e40af', bg: '#dbeafe' },
            { val: 'all_pending', label: 'Approve + Process all Pending', sub: `${pendingCount} pending records`, color: '#92400e', bg: '#fef3c7' },
          ].map(({ val, label, sub, color, bg }) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${mode === val ? 'var(--accent-indigo)' : 'var(--border-medium)'}`, cursor: 'pointer', background: mode === val ? '#f5f3ff' : 'var(--bg-white)', transition: 'all .15s' }}>
              <input type="radio" value={val} checked={mode === val} onChange={() => setMode(val)} style={{ width: 16, height: 16, accentColor: 'var(--accent-indigo)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
              </div>
              <span style={{ background: bg, color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                {val === 'approved' ? approvedCount : pendingCount}
              </span>
            </label>
          ))}
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Payment Date</label>
          <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
            style={{ padding: '10px 13px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 14, width: '100%', outline: 'none' }} />
        </div>

        <div className="emp-modal-actions">
          <button className="emp-modal-cancel" onClick={onClose}>Cancel</button>
          <button
            className="emp-submit-btn"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)', opacity: busy || (mode === 'approved' && approvedCount === 0) ? 0.6 : 1 }}
            onClick={handleProcess}
            disabled={busy || (mode === 'approved' && approvedCount === 0)}
          >
            <FaCheckCircle size={12} /> {busy ? 'Processing…' : 'Confirm & Process'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function PayrollRun({ user }) {
  const navigate = useNavigate();

  const [view, setView] = useState('list');
  const [editMode, setEditMode] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const [payroll, setPayroll] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentYM());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvingBusy, setApprovingBusy] = useState(false);
  const [submittingBusy, setSubmittingBusy] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRecords, setSelectedRecords] = useState(new Set());

  const [payslipRecord, setPayslipRecord] = useState(null);
  const [showProcess, setShowProcess] = useState(false);

  const [editForm, setEditForm] = useState(emptyEditForm());
  const [generateForm, setGenerateForm] = useState(emptyGenerateForm());
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = { headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } };

  /* ── fetch ── */
  const fetchData = useCallback(async (month) => {
    setLoading(true);
    try {
      const [listRes, monthsRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/payroll?month=${month}`, axiosConfig),
        axios.get(`${BASE_URL}/api/payroll/months`, axiosConfig),
      ]);
      const arr = listRes.data?.response || listRes.data?.data || [];
      const mArr = monthsRes.data?.response || monthsRes.data?.data || [];
      setPayroll(Array.isArray(arr) ? arr : []);
      setMonths(Array.isArray(mArr) && mArr.length ? mArr : [month]);
      setSelectedRecords(new Set());
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Failed to load payroll');
      setPayroll([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(selectedMonth); }, [selectedMonth]);

  /* ── filter ── */
  const filtered = payroll.filter(p => {
    const byStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const bySearch = !search || (p.employee || '').toLowerCase().includes(search.toLowerCase())
      || (p.employeeCode || '').toLowerCase().includes(search.toLowerCase())
      || (p.department || '').toLowerCase().includes(search.toLowerCase());
    return byStatus && bySearch;
  });

  const counts = { DRAFT: 0, PENDING: 0, APPROVED: 0, PROCESSED: 0 };
  payroll.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
  const totalNet = payroll.reduce((a, p) => a + (p.netSalary || 0), 0);

  /* ── Selection Handlers ── */
  const toggleSelectAll = () => {
    if (selectedRecords.size === filtered.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedRecords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRecords(newSet);
  };

  /* ── Workflow Actions ── */

  // SUBMIT: DRAFT → PENDING
  const handleSubmitForApproval = async () => {
    const selectedArray = Array.from(selectedRecords);
    const draftRecords = payroll.filter(p =>
      p.status === 'DRAFT' && selectedRecords.has(p.id)
    );

    if (draftRecords.length === 0) {
      toast.warning('No DRAFT records selected', 'Select DRAFT records to submit for approval');
      return;
    }

    setSubmittingBusy(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/payroll/submit`, {
        recordIds: draftRecords.map(r => r.id)
      }, axiosConfig);

      if (res.data?.status === 200 || res.status === 200) {
        toast.success('Submitted', `${draftRecords.length} records submitted for approval`);
        fetchData(selectedMonth);
      } else {
        toast.error('Error', res.data?.message || 'Submission failed');
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmittingBusy(false);
    }
  };

  // APPROVE: PENDING → APPROVED
  const handleApproveSelected = async () => {
    const selectedArray = Array.from(selectedRecords);
    const pendingRecords = payroll.filter(p =>
      p.status === 'PENDING' && selectedRecords.has(p.id)
    );

    if (pendingRecords.length === 0) {
      toast.warning('No PENDING records selected', 'Select PENDING records to approve');
      return;
    }

    setApprovingBusy(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/payroll/approve`, {
        yearMonth: selectedMonth,
        recordIds: pendingRecords.map(r => r.id)
      }, axiosConfig);

      if (res.data?.status === 200 || res.status === 200) {
        toast.success('Approved', `${pendingRecords.length} records approved`);
        fetchData(selectedMonth);
      } else {
        toast.error('Error', res.data?.message || 'Approval failed');
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Approval failed');
    } finally {
      setApprovingBusy(false);
    }
  };

  // APPROVE ALL PENDING (bulk)
  const handleApproveAllPending = async () => {
    if (counts.PENDING === 0) {
      toast.warning('No PENDING records', 'Nothing to approve');
      return;
    }

    setApprovingBusy(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/payroll/approve`, {
        yearMonth: selectedMonth
      }, axiosConfig);
      toast.success('Approved', res.data?.response || res.data?.data || 'All pending records approved');
      fetchData(selectedMonth);
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Approval failed');
    } finally {
      setApprovingBusy(false);
    }
  };

  // REJECT: PENDING/APPROVED → REJECTED
  const handleRejectSelected = async () => {
    const selectedArray = Array.from(selectedRecords);
    const rejectableRecords = payroll.filter(p =>
      (p.status === 'PENDING' || p.status === 'APPROVED') && selectedRecords.has(p.id)
    );

    if (rejectableRecords.length === 0) {
      toast.warning('No rejectable records selected', 'Select PENDING or APPROVED records to reject');
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/payroll/reject`, {
        recordIds: rejectableRecords.map(r => r.id)
      }, axiosConfig);
      toast.success('Rejected', `${rejectableRecords.length} records rejected`);
      fetchData(selectedMonth);
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Rejection failed');
    }
  };

  /* ── export CSV ── */
  const handleExport = () => {
    if (!filtered.length) { toast.warning('No data', 'Nothing to export'); return; }
    const rows = [
      ['Employee', 'Code', 'Dept', 'Branch', 'Gross', 'PF', 'TDS', 'Net', 'Status', 'Payment Date'],
      ...filtered.map(p => [cleanName(p.employee), p.employeeCode, p.department, p.branch, p.grossEarnings, p.providentFund, p.incomeTax, p.netSalary, p.status, p.paymentDate || '']),
    ];
    const url = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `payroll-${selectedMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported', 'CSV downloaded');
  };

  /* ── edit handlers ── */
  const handleEdit = (record) => {
    setEditRecord(record);
    setEditForm({
      basicSalary: String(record.basicSalary || ''),
      hra: String(record.hra || ''),
      travelAllow: String(record.travelAllow || ''),
      medicalAllow: String(record.medicalAllow || ''),
      specialAllow: String(record.specialAllow || ''),
      otherEarnings: String(record.otherEarnings || ''),
      providentFund: String(record.providentFund || ''),
      professionalTax: String(record.professionalTax || ''),
      incomeTax: String(record.incomeTax || ''),
      loanDeduction: String(record.loanDeduction || ''),
      otherDeductions: String(record.otherDeductions || ''),
      workingDays: String(record.workingDays || 26),
      paidDays: String(record.paidDays || 26),
      lopDays: String(record.lopDays || 0),
      remarks: record.remarks || '',
    });
    setErrors({}); setTouched({});
    setEditMode(true); setView('edit');
  };

  const handleEditChange = (field, value) => {
    const updated = { ...editForm, [field]: value };
    setEditForm(updated);
    if (touched[field]) {
      let e = validateField(field, value);
      if (field === 'paidDays' && Number(value) > Number(updated.workingDays)) e = 'Cannot exceed working days';
      if (field === 'lopDays' && Number(value) + Number(updated.paidDays) > Number(updated.workingDays)) e = 'LOP+Paid cannot exceed working days';
      setErrors(prev => ({ ...prev, [field]: e }));
    }
  };

  const handleEditBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, editForm[field]) }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const allFields = Object.keys(RULES);
    setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    const errs = validateAllEdit(editForm);
    setErrors(errs);
    if (Object.keys(errs).length > 0) { toast.warning('Validation Error', 'Please fix the highlighted fields'); return; }

    const payload = Object.fromEntries(
      Object.entries(editForm).map(([k, v]) => ['remarks'].includes(k) ? [k, v] : [k, parseFloat(v) || 0])
    );
    setSubmitting(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/payroll/${editRecord.id}`, payload, axiosConfig);
      if (res.data?.status === 200 || res.status === 200) {
        toast.success('Saved', 'Payroll record updated');
        resetEditForm(); setView('list'); fetchData(selectedMonth);
      } else { toast.error('Error', res.data?.message || 'Update failed'); }
    } catch (err) { toast.error('Error', err.response?.data?.message || 'Something went wrong'); }
    finally { setSubmitting(false); }
  };

  /* ── generate handlers ── */
  const handleGenerateChange = (field, value) => setGenerateForm(prev => ({ ...prev, [field]: value }));

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!generateForm.yearMonth) { toast.warning('Required', 'Select a month'); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/payroll/generate`, {
        ...generateForm, workingDays: +generateForm.workingDays,
        defaultBasic: +generateForm.defaultBasic || 0, defaultHra: +generateForm.defaultHra || 0,
        defaultTravelAllow: +generateForm.defaultTravelAllow || 0, defaultMedicalAllow: +generateForm.defaultMedicalAllow || 0,
        defaultSpecialAllow: +generateForm.defaultSpecialAllow || 0, defaultPF: +generateForm.defaultPF || 0,
        defaultPT: +generateForm.defaultPT || 0,
      }, axiosConfig);
      if (res.data?.status === 200 || res.status === 200) {
        toast.success('Generated', res.data?.response || res.data?.data || 'Records created');
        setSelectedMonth(generateForm.yearMonth);
        fetchData(generateForm.yearMonth);
        setView('list');
        setGenerateForm(emptyGenerateForm());
      } else { toast.error('Error', res.data?.message || 'Generation failed'); }
    } catch (err) { toast.error('Error', err.response?.data?.message || 'Something went wrong'); }
    finally { setSubmitting(false); }
  };

  const resetEditForm = () => {
    setEditForm(emptyEditForm()); setErrors({}); setTouched({});
    setEditMode(false); setEditRecord(null);
  };

  /* ── live preview ── */
  const liveGross = ['basicSalary', 'hra', 'travelAllow', 'medicalAllow', 'specialAllow', 'otherEarnings'].reduce((a, k) => a + (parseFloat(editForm[k]) || 0), 0);
  const liveDeduct = ['providentFund', 'professionalTax', 'incomeTax', 'loanDeduction', 'otherDeductions'].reduce((a, k) => a + (parseFloat(editForm[k]) || 0), 0);
  const liveLop = liveGross > 0 && parseInt(editForm.workingDays) > 0 ? (liveGross / parseInt(editForm.workingDays)) * (parseInt(editForm.lopDays) || 0) : 0;
  const liveNet = liveGross - liveDeduct - liveLop;

  const isFieldOk = (f) => touched[f] && !errors[f] && editForm[f] !== '';
  const isFieldErr = (f) => touched[f] && !!errors[f];

  const canSubmit = payroll.some(p => p.status === 'DRAFT');
  const canApprove = payroll.some(p => p.status === 'PENDING');
  const canProcess = payroll.some(p => p.status === 'APPROVED');

  const selectedArray = Array.from(selectedRecords);
  const selectedStatuses = selectedArray.map(id => payroll.find(p => p.id === id)?.status);
  const allSelectedDraft = selectedArray.length > 0 && selectedStatuses.every(s => s === 'DRAFT');
  const allSelectedPending = selectedArray.length > 0 && selectedStatuses.every(s => s === 'PENDING');
  const allSelectedApproved = selectedArray.length > 0 && selectedStatuses.every(s => s === 'APPROVED');

  if (loading && view === 'list' && payroll.length === 0)
    return <LoadingSpinner message="Loading payroll records…" />;

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="emp-root">

      {/* ── Header ── */}
      <div className="emp-header" style={view !== 'list' ? { justifyContent: 'space-between' } : {}}>
        {view === 'list' ? (
          <>
            <div className="emp-header-left">
              <div>
                <h1 className="emp-title">Payroll Run</h1>
                <p className="emp-subtitle">
                  {toLabelFull(selectedMonth)} · {payroll.length} records · ₹{fmt(totalNet)} total net
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Submit Button - Shows when DRAFT records exist */}
              {canSubmit && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={submittingBusy || !allSelectedDraft}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 11,
                    border: 'none', background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: allSelectedDraft ? 'pointer' : 'not-allowed',
                    opacity: allSelectedDraft ? 1 : 0.5
                  }}
                  title={allSelectedDraft ? 'Submit selected DRAFT records' : 'Select DRAFT records first'}
                >
                  <FaPaperPlane size={12} /> Submit for Approval
                </button>
              )}

              {/* Approve Button - Shows when PENDING records exist */}
              {canApprove && (
                <button
                  onClick={handleApproveSelected}
                  disabled={approvingBusy || !allSelectedPending}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 11,
                    border: 'none', background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: allSelectedPending ? 'pointer' : 'not-allowed',
                    opacity: allSelectedPending ? 1 : 0.5
                  }}
                  title={allSelectedPending ? 'Approve selected PENDING records' : 'Select PENDING records first'}
                >
                  <FaCheck size={12} /> {approvingBusy ? 'Approving…' : 'Approve Selected'}
                </button>
              )}

              {/* Approve All Pending Button */}
              {canApprove && (
                <button
                  onClick={handleApproveAllPending}
                  disabled={approvingBusy}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 11,
                    border: '1.5px solid #0891b2', background: 'transparent', color: '#0891b2',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <FaCheckCircle size={12} /> Approve All Pending
                </button>
              )}

              {/* Process Button - Shows when APPROVED records exist */}
              {canProcess && (
                <button
                  onClick={() => setShowProcess(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 11,
                    border: 'none', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,.25)'
                  }}
                >
                  <FaRupeeSign size={11} /> Process Payroll
                </button>
              )}

              {/* Generate Button */}
              <button className="emp-add-btn" onClick={() => { setGenerateForm(emptyGenerateForm()); setView('generate'); }}>
                <FaPlus size={12} /> Generate Records
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="emp-title">
                {view === 'generate' ? 'Generate Payroll Records' : 'Edit Payroll Record'}
              </h1>
              <p className="emp-subtitle">
                {view === 'generate'
                  ? 'Creates DRAFT records for all active employees'
                  : editRecord ? `${cleanName(editRecord.employee)} · ${editRecord.payrollMonth}` : ''}
              </p>
            </div>
            <button
              className="emp-back-btn"
              onClick={() => { view === 'edit' ? resetEditForm() : setGenerateForm(emptyGenerateForm()); setView('list'); }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          </>
        )}
      </div>

      {/* ════ LIST VIEW ════ */}
      {view === 'list' && (
        <>
          {/* Status pipeline cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { key: 'DRAFT', emoji: '📝', bg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', textColor: '#475569', label: 'Draft' },
              { key: 'PENDING', emoji: '⏳', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', textColor: '#92400e', label: 'Pending' },
              { key: 'APPROVED', emoji: '✅', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', textColor: '#1e40af', label: 'Approved' },
              { key: 'PROCESSED', emoji: '💸', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', textColor: '#166534', label: 'Processed' },
            ].map(({ key, emoji, bg, textColor, label }) => (
              <div
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? 'ALL' : key)}
                style={{ background: bg, borderRadius: 14, padding: '14px 18px', cursor: 'pointer', border: `1.5px solid ${statusFilter === key ? textColor : 'transparent'}`, transition: 'all .2s' }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Sora',sans-serif", color: textColor }}>{counts[key]}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: textColor }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Search & filters */}
          <div className="emp-search-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-primary)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none' }}
            >
              {months.map(m => <option key={m} value={m}>{toLabelFull(m)}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid var(--border-medium)', borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: 'var(--text-primary)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="ALL">All Statuses</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="emp-search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 280 }}>
              <FaSearch className="emp-search-icon" size={12} />
              <input className="emp-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee, dept…" />
              {search && <button className="emp-search-clear" onClick={() => setSearch('')}><FaTimes size={11} /></button>}
            </div>
            <button
              onClick={handleExport}
              style={{ padding: '8px 14px', border: '1.5px solid var(--border-medium)', borderRadius: 10, background: 'var(--bg-surface)', cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', transition: 'all .15s' }}
            >
              <FaDownload size={11} /> Export CSV
            </button>

            {/* Selection count */}
            {selectedRecords.size > 0 && (
              <span style={{ fontSize: 12, color: 'var(--accent-indigo)', fontWeight: 600, marginLeft: 'auto' }}>
                {selectedRecords.size} selected
              </span>
            )}
          </div>

          {/* Table */}
          <div className="emp-table-card">
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedRecords.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-indigo)' }}
                      />
                    </th>
                    <th style={{ width: 44 }}>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Working / LOP</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((p, idx) => {
                    const name = cleanName(p.employee);
                    const ac = getAvatarColor(name);
                    const isSelected = selectedRecords.has(p.id);

                    return (
                      <tr key={p.id} className="emp-row" style={{ background: isSelected ? '#f5f3ff' : undefined }}>
                        <td onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(p.id)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-indigo)' }}
                          />
                        </td>
                        <td className="emp-sno" onClick={() => setPayslipRecord(p)}>{idx + 1}</td>
                        <td onClick={() => setPayslipRecord(p)}>
                          <div className="emp-info-cell">
                            <div className="emp-avatar" style={{ background: ac.bg, color: ac.color }}>{getInitials(name)}</div>
                            <div>
                              <div className="emp-name">{name || '—'}</div>
                              <div className="emp-email">{p.employeeCode}</div>
                            </div>
                          </div>
                        </td>
                        <td onClick={() => setPayslipRecord(p)}>
                          {p.department
                            ? <span className="emp-pill emp-pill--indigo">{p.department}</span>
                            : <span className="emp-dash">—</span>}
                        </td>
                        <td onClick={() => setPayslipRecord(p)} style={{ fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.paidDays || 0}/{p.workingDays || 0}</span>
                          {(p.lopDays || 0) > 0 && (
                            <span style={{ marginLeft: 6, fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                              LOP: {p.lopDays}
                            </span>
                          )}
                        </td>
                        <td onClick={() => setPayslipRecord(p)} style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>₹{fmt(p.grossEarnings)}</td>
                        <td onClick={() => setPayslipRecord(p)} style={{ fontSize: 13, color: '#dc2626' }}>-₹{fmt(p.totalDeductions)}</td>
                        <td onClick={() => setPayslipRecord(p)}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-indigo)', fontFamily: "'Sora',sans-serif" }}>
                            ₹{fmt(p.netSalary)}
                          </span>
                        </td>
                        <td onClick={() => setPayslipRecord(p)}><StatusBadge status={p.status} /></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="emp-actions">
                            <button className="emp-act" style={{ background: '#ede9fe', color: 'var(--accent-indigo)' }} onClick={() => setPayslipRecord(p)} title="View payslip">
                              <FaEye size={12} />
                            </button>
                            {(p.status === 'DRAFT' || p.status === 'PENDING') && (
                              <button className="emp-act emp-act--edit" onClick={() => handleEdit(p)} title="Edit record">
                                <FaEdit size={12} />
                              </button>
                            )}
                            
                            {p.status === 'PROCESSED' && (
                              <>
                                <button
                                  className="emp-act"
                                  style={{ background: '#dcfce7', color: '#166534' }}
                                  onClick={async () => {
                                    try {
                                      const token = getAuthToken();
                                      const response = await fetch(`${BASE_URL}/api/payroll/${p.id}/payslip/pdf`, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      });
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `Payslip_${cleanName(p.employee).replace(/\s+/g, '_')}_${p.payrollMonth}.pdf`;
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      toast.success('Downloaded', 'Payslip PDF saved');
                                    } catch (err) {
                                      toast.error('Error', 'Download failed');
                                    }
                                  }}
                                  title="Download PDF payslip"
                                >
                                  <FaDownload size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="10" className="emp-empty">
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon"><FaRupeeSign /></span>
                          <p>No records found</p>
                          <small>
                            {payroll.length === 0
                              ? 'Click "Generate Records" to create payroll for this month.'
                              : 'Try adjusting your filters.'}
                          </small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedRecords.size > 0 && (
            <div style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
              borderRadius: 40, padding: '8px 16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', gap: 16, zIndex: 100
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedRecords.size} record{selectedRecords.size !== 1 ? 's' : ''} selected
              </span>
              <div style={{ width: 1, height: 20, background: 'var(--border-medium)' }} />

              {allSelectedDraft && (
                <button onClick={handleSubmitForApproval} disabled={submittingBusy} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none',
                  borderRadius: 30, background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}>
                  <FaPaperPlane size={11} /> Submit for Approval
                </button>
              )}

              {allSelectedPending && (
                <button onClick={handleApproveSelected} disabled={approvingBusy} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none',
                  borderRadius: 30, background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}>
                  <FaCheck size={11} /> Approve Selected
                </button>
              )}

              {allSelectedApproved && (
                <button onClick={() => setShowProcess(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none',
                  borderRadius: 30, background: 'linear-gradient(135deg,#059669,#10b981)',
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}>
                  <FaRupeeSign size={11} /> Process Selected
                </button>
              )}

              <button onClick={() => setSelectedRecords(new Set())} style={{
                padding: '4px 8px', border: 'none', background: 'transparent',
                color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer'
              }}>
                Clear
              </button>
            </div>
          )}
        </>
      )}

      {/* ════ GENERATE VIEW ════ */}
      {view === 'generate' && (
        <div className="emp-form-wrap">
          <form onSubmit={handleGenerateSubmit} noValidate>

            <div className="emp-form-section">
              <div className="emp-section-label">Payroll Period</div>
              <div className="emp-form-grid">
                <div className="emp-field">
                  <label>Month <span className="req">*</span></label>
                  <input type="month" value={generateForm.yearMonth} onChange={e => handleGenerateChange('yearMonth', e.target.value)} />
                  <small className="emp-hint-text">Select the month to generate payroll for</small>
                </div>
                <div className="emp-field">
                  <label>Working Days</label>
                  <input type="number" min="1" max="31" value={generateForm.workingDays} onChange={e => handleGenerateChange('workingDays', e.target.value)} />
                  <small className="emp-hint-text">Default working days for this month</small>
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            <div className="emp-form-section">
              <div className="emp-section-label">Generation Settings</div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '14px 16px', marginBottom: 18, border: '1px solid var(--border-light)' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={generateForm.useSalaryStructure}
                    onChange={e => handleGenerateChange('useSalaryStructure', e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-indigo)', marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Use Salary Structure (Recommended)</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      Automatically fills each employee's salary from their saved salary structure.
                      Falls back to the default values below if no structure is set.
                    </div>
                  </div>
                </label>
              </div>

              <div className="emp-section-label" style={{ marginBottom: 12 }}>Default Values (Fallback)</div>
              <div className="emp-form-grid">
                {[
                  { key: 'defaultBasic', label: 'Basic Salary (₹)' },
                  { key: 'defaultHra', label: 'HRA (₹)' },
                  { key: 'defaultTravelAllow', label: 'Travel Allow. (₹)' },
                  { key: 'defaultMedicalAllow', label: 'Medical Allow. (₹)' },
                  { key: 'defaultSpecialAllow', label: 'Special Allow. (₹)' },
                  { key: 'defaultPF', label: 'Provident Fund (₹)' },
                  { key: 'defaultPT', label: 'Professional Tax (₹)' },
                ].map(({ key, label }) => (
                  <div key={key} className="emp-field">
                    <label>{label}</label>
                    <input type="number" min="0" placeholder="0" value={generateForm[key]} onChange={e => handleGenerateChange(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); setGenerateForm(emptyGenerateForm()); }}>Cancel</button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting ? <><span className="emp-spinner" /> Generating…</> : <><FaPlus size={12} /> Generate Records</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ════ EDIT VIEW ════ */}
      {view === 'edit' && editRecord && (
        <div className="emp-form-wrap">
          <form onSubmit={handleEditSubmit} noValidate>

            {/* Earnings */}
            <div className="emp-form-section">
              <div className="emp-section-label" style={{ color: '#059669' }}>💰 Earnings</div>
              <div className="emp-form-grid">
                {[
                  { key: 'basicSalary', label: 'Basic Salary', required: true },
                  { key: 'hra', label: 'HRA', required: false },
                  { key: 'travelAllow', label: 'Travel Allowance', required: false },
                  { key: 'medicalAllow', label: 'Medical Allowance', required: false },
                  { key: 'specialAllow', label: 'Special Allowance', required: false },
                  { key: 'otherEarnings', label: 'Other Earnings', required: false },
                ].map(({ key, label, required }) => (
                  <div key={key} className={`emp-field ${isFieldErr(key) ? 'has-error' : ''} ${isFieldOk(key) ? 'has-ok' : ''}`}>
                    <label>{label} {required && <span className="req">*</span>}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                      <input type="number" min="0" placeholder="0" value={editForm[key]} onChange={e => handleEditChange(key, e.target.value)} onBlur={() => handleEditBlur(key)} style={{ paddingLeft: 22 }} />
                    </div>
                    <FieldError msg={errors[key]} />
                  </div>
                ))}
              </div>
            </div>

            <div className="emp-divider" />

            {/* Deductions */}
            <div className="emp-form-section">
              <div className="emp-section-label" style={{ color: '#dc2626' }}>📉 Deductions</div>
              <div className="emp-form-grid">
                {[
                  { key: 'providentFund', label: 'Provident Fund (PF)' },
                  { key: 'professionalTax', label: 'Professional Tax' },
                  { key: 'incomeTax', label: 'Income Tax (TDS)' },
                  { key: 'loanDeduction', label: 'Loan Deduction' },
                  { key: 'otherDeductions', label: 'Other Deductions' },
                ].map(({ key, label }) => (
                  <div key={key} className="emp-field">
                    <label>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                      <input type="number" min="0" placeholder="0" value={editForm[key]} onChange={e => handleEditChange(key, e.target.value)} style={{ paddingLeft: 22 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="emp-divider" />

            {/* Attendance */}
            <div className="emp-form-section">
              <div className="emp-section-label">📅 Attendance</div>
              <div className="emp-form-grid">
                {[
                  { key: 'workingDays', label: 'Working Days', hint: 'Total working days in the month' },
                  { key: 'paidDays', label: 'Paid Days', hint: 'Days the employee was paid for' },
                  { key: 'lopDays', label: 'LOP Days', hint: 'Loss of Pay — deducted from net salary' },
                ].map(({ key, label, hint }) => (
                  <div key={key} className={`emp-field ${isFieldErr(key) ? 'has-error' : ''} ${isFieldOk(key) ? 'has-ok' : ''}`}>
                    <label>{label}</label>
                    <input type="number" min="0" max="31" placeholder="0" value={editForm[key]} onChange={e => handleEditChange(key, e.target.value)} onBlur={() => handleEditBlur(key)} />
                    <FieldError msg={errors[key]} />
                    <small className="emp-hint-text">{hint}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="emp-divider" />

            {/* Remarks */}
            <div className="emp-form-section">
              <div className="emp-section-label">Additional Notes</div>
              <div className="emp-field" style={{ maxWidth: '100%' }}>
                <label>Remarks (optional)</label>
                <textarea rows={2} placeholder="Any special notes for this record…" value={editForm.remarks} onChange={e => handleEditChange('remarks', e.target.value)} maxLength={200} />
              </div>
            </div>

            {/* Live preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, margin: '0 0 20px', background: 'var(--bg-surface)', borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border-light)' }}>
              {[
                { label: 'Gross Earnings', value: liveGross, color: '#059669' },
                { label: 'Total Deductions', value: liveDeduct + liveLop, color: '#dc2626' },
                { label: 'Net Salary', value: liveNet, color: 'var(--accent-indigo)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Sora',sans-serif" }}>₹{fmt(value)}</div>
                  {label === 'Net Salary' && liveLop > 0 && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>Incl. LOP -₹{fmt(liveLop)}</div>}
                </div>
              ))}
            </div>

            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); resetEditForm(); }}>Cancel</button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting ? <><span className="emp-spinner" /> Saving…</> : <><FaSave size={12} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modals ── */}
      {payslipRecord && <PayslipModal record={payslipRecord} onClose={() => setPayslipRecord(null)} axiosConfig={axiosConfig} />}
      {showProcess && (
        <ProcessModal
          yearMonth={selectedMonth}
          payroll={payroll}
          onClose={() => setShowProcess(false)}
          onDone={() => fetchData(selectedMonth)}
          axiosConfig={axiosConfig}
        />
      )}
    </div>
  );
}