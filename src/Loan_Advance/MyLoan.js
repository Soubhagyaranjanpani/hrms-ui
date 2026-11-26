import React, { useState, useEffect, useCallback } from 'react';
import {
  FaPlus, FaSearch, FaTimes, FaEye, FaBan, FaPaperclip, FaArrowLeft,
  FaMoneyBillWave, FaCalendarAlt, FaWallet, FaCheckCircle,
  FaSave, FaExclamationCircle, FaPercent
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

// ============================================
// STATIC MOCK DATA (logged-in employee: Rahul Sharma)
// ============================================
const CURRENT_EMP = { empId: 'EMP-1042', empName: 'Rahul Sharma', department: 'Engineering', grade: 'M2', netSalary: 85000 };

const STATIC_MY_LOANS = [
  {
    id: 1, loanRef: 'LN-0087', loanType: 'Salary Advance', amount: 50000, tenure: 5, emi: 10000,
    purpose: 'Medical emergency at home', appliedOn: '2025-10-20', requestedDisburse: '2025-11-01',
    disbursedOn: '2025-11-01', preferredRecovery: 'Payroll Deduction', attachment: 'medical_bill.pdf',
    paidEmis: 2, balance: 30000, status: 'Active', nextEmiDate: '2026-01-01',
    chain: [
      { role: 'Reporting Manager', status: 'Approved', date: '2025-10-21' },
      { role: 'HR Head', status: 'Approved', date: '2025-10-23' },
      { role: 'Finance', status: 'Approved', date: '2025-10-28' }
    ]
  },
  {
    id: 2, loanRef: 'LN-0091', loanType: 'Personal Loan', amount: 20000, tenure: 4, emi: 5000,
    purpose: 'Home repair', appliedOn: '2025-10-22', requestedDisburse: '2025-10-25',
    disbursedOn: null, preferredRecovery: 'Payroll Deduction', attachment: 'quotation.pdf',
    paidEmis: 0, balance: 0, status: 'Pending Approval', nextEmiDate: null,
    chain: [
      { role: 'Reporting Manager', status: 'Pending', date: null },
      { role: 'HR Head', status: 'Waiting', date: null },
      { role: 'Finance', status: 'Waiting', date: null }
    ]
  },
  {
    id: 3, loanRef: 'LN-0062', loanType: 'Emergency Loan', amount: 15000, tenure: 3, emi: 5000,
    purpose: 'Travel emergency', appliedOn: '2025-09-05', requestedDisburse: '2025-09-10',
    disbursedOn: null, preferredRecovery: 'Payroll Deduction', attachment: 'travel_receipt.pdf',
    paidEmis: 0, balance: 0, status: 'Rejected', nextEmiDate: null,
    rejectionReason: 'Supporting document was not clear. Please re-apply with a valid receipt.',
    chain: [
      { role: 'Reporting Manager', status: 'Approved', date: '2025-09-06' },
      { role: 'HR Head', status: 'Rejected', date: '2025-09-08' },
      { role: 'Finance', status: 'Closed', date: null }
    ]
  },
  {
    id: 4, loanRef: 'LN-0031', loanType: 'Salary Advance', amount: 10000, tenure: 2, emi: 5000,
    purpose: 'School admission fees', appliedOn: '2025-05-02', requestedDisburse: '2025-05-05',
    disbursedOn: '2025-05-05', preferredRecovery: 'Payroll Deduction', attachment: 'fees.pdf',
    paidEmis: 2, balance: 0, status: 'Closed', nextEmiDate: null,
    chain: [
      { role: 'Reporting Manager', status: 'Approved', date: '2025-05-03' },
      { role: 'HR Head', status: 'Approved', date: '2025-05-03' },
      { role: 'Finance', status: 'Approved', date: '2025-05-04' }
    ]
  },
  {
    id: 5, loanRef: 'LN-0098', loanType: 'Personal Loan', amount: 30000, tenure: 6, emi: 5000,
    purpose: 'Laptop purchase', appliedOn: '2025-10-28', requestedDisburse: '2025-11-20',
    disbursedOn: null, preferredRecovery: 'Bank Transfer', attachment: '',
    paidEmis: 0, balance: 0, status: 'Draft', nextEmiDate: null,
    chain: [
      { role: 'Reporting Manager', status: 'Waiting', date: null },
      { role: 'HR Head', status: 'Waiting', date: null },
      { role: 'Finance', status: 'Waiting', date: null }
    ]
  }
];

const STATUS_TABS = ['All', 'Active', 'Pending Approval', 'Draft', 'Closed', 'Rejected'];
const LOAN_TYPES = ['Salary Advance', 'Personal Loan', 'Emergency Loan'];
const RECOVERY_MODES = ['Payroll Deduction', 'Bank Transfer'];

// ============================================
// HELPERS
// ============================================
const fmt = (n) => `₹ ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const getStatusColor = (status) => {
  switch (status) {
    case 'Active': return { bg: '#d1fae5', color: '#065f46' };
    case 'Pending Approval': return { bg: '#fef3c7', color: '#92400e' };
    case 'Closed': return { bg: '#e5e7eb', color: '#374151' };
    case 'Rejected': return { bg: '#fee2e2', color: '#b91c1c' };
    case 'Draft': return { bg: '#e0e7ff', color: '#4f46e5' };
    default: return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

const getStageColor = (status) => {
  switch (status) {
    case 'Approved': return { bg: '#d1fae5', color: '#065f46' };
    case 'Pending': return { bg: '#fef3c7', color: '#92400e' };
    case 'Rejected': return { bg: '#fee2e2', color: '#b91c1c' };
    default: return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

// Builds the EMI schedule for an active / closed loan
const buildSchedule = (loan) => {
  if (!loan.disbursedOn) return [];
  const start = new Date(loan.disbursedOn);
  return Array.from({ length: loan.tenure }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() + i + 1, 1);
    return {
      no: i + 1,
      dueDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      amount: loan.emi,
      status: i < loan.paidEmis ? 'Paid' : 'Upcoming'
    };
  });
};

const calculateEmi = (amount, tenure) => {
  const a = Number(amount) || 0;
  const t = Number(tenure) || 0;
  if (t <= 0) return 0;
  return Math.round(a / t);
};

const emptyForm = (loanRef) => ({
  loanRef,
  empId: CURRENT_EMP.empId,
  empName: CURRENT_EMP.empName,
  department: CURRENT_EMP.department,
  grade: CURRENT_EMP.grade,
  netSalary: CURRENT_EMP.netSalary,
  loanType: '',
  amount: '',
  tenure: '',
  purpose: '',
  requestedDisburse: '',
  preferredRecovery: 'Payroll Deduction',
  attachment: ''
});

// ============================================
// FIELD ERROR COMPONENT
// ============================================
const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

// ============================================
// COMPONENT
// ============================================
const MyLoansScreen = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusTab, setStatusTab] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const [viewLoan, setViewLoan] = useState(null);
  const [cancelLoan, setCancelLoan] = useState(null);

  // ---------- apply form state ----------
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm(''));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ---------- simulate fetch ----------
  const fetchLoans = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoans([...STATIC_MY_LOANS]);
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  // ---------- debounced search ----------
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(0); }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ---------- summary ----------
  const activeLoans = loans.filter((l) => l.status === 'Active');
  const totalOutstanding = activeLoans.reduce((s, l) => s + l.balance, 0);
  const monthlyEmi = activeLoans.reduce((s, l) => s + l.emi, 0);
  const maxEligible = CURRENT_EMP.netSalary * 0.5;
  const availableLimit = Math.max(maxEligible - totalOutstanding, 0);
  const nextEmi = activeLoans.map((l) => l.nextEmiDate).filter(Boolean).sort()[0];

  // ---------- filter + paginate ----------
  const filteredLoans = loans.filter((item) => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch =
      item.loanRef.toLowerCase().includes(s) ||
      item.loanType.toLowerCase().includes(s) ||
      item.status.toLowerCase().includes(s) ||
      (item.purpose || '').toLowerCase().includes(s);
    const matchTab = statusTab === 'All' || item.status === statusTab;
    return matchSearch && matchTab;
  });

  const totalItems = filteredLoans.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLoans = filteredLoans.slice(startIndex, startIndex + rowsPerPage);

  const countFor = (tab) => (tab === 'All' ? loans.length : loans.filter((l) => l.status === tab).length);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) {
      if (right < totalPages - 2) range.push('...');
      range.push(totalPages - 1);
    }
    return range;
  };

  // ---------- cancel application ----------
  const confirmCancel = () => {
    setLoans((prev) => prev.filter((l) => l.id !== cancelLoan.id));
    toast.success('Cancelled', `${cancelLoan.loanRef} application cancelled`);
    setCancelLoan(null);
    setViewLoan(null);
    setPage(0);
  };

  const canCancel = (l) => l.status === 'Pending Approval' || l.status === 'Draft';

  // ============================================
  // APPLY FORM HANDLERS
  // ============================================
  // next ref = highest existing number + 1 (avoids clashes)
  const generateLoanRef = () => {
    const max = loans.reduce((m, l) => {
      const n = parseInt(String(l.loanRef).replace(/\D/g, ''), 10);
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return `LN-${String(max + 1).padStart(4, '0')}`;
  };

  const handleOpenForm = () => {
    setFormData(emptyForm(generateLoanRef()));
    setErrors({});
    setTouched({});
    setViewLoan(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData(emptyForm(''));
    setErrors({});
    setTouched({});
  };

  const validateField = (field, value, data = formData) => {
    let error = '';

    if (field === 'loanType' && !value) {
      error = 'Loan Type is required';
    } else if (field === 'amount') {
      if (!value) error = 'Loan Amount is required';
      else if (Number(value) <= 0) error = 'Amount must be greater than zero';
      else if (Number(value) > data.netSalary * 0.5)
        error = 'Amount exceeds 50% of net salary limit';
    } else if (field === 'tenure') {
      if (!value) error = 'Tenure is required';
      else if (Number(value) < 1 || Number(value) > 12)
        error = 'Tenure must be between 1 and 12 months';
    } else if (field === 'purpose' && !String(value).trim()) {
      error = 'Purpose is required';
    } else if (field === 'requestedDisburse' && !value) {
      error = 'Requested disbursement date is required';
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = ['loanType', 'amount', 'tenure', 'purpose', 'requestedDisburse'];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!String(formData[field]).trim()) newErrors[field] = 'This field is required';
    }

    if (formData.amount && Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (formData.amount && Number(formData.amount) > formData.netSalary * 0.5) {
      newErrors.amount = 'Amount exceeds 50% of net salary limit';
    }

    if (formData.tenure && (Number(formData.tenure) < 1 || Number(formData.tenure) > 12)) {
      newErrors.tenure = 'Tenure must be between 1 and 12 months';
    }

    setErrors(newErrors);
    setTouched({
      loanType: true, amount: true, tenure: true, purpose: true, requestedDisburse: true
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newLoan = {
        id: Date.now(),
        loanRef: formData.loanRef,
        loanType: formData.loanType,
        amount: Number(formData.amount),
        tenure: Number(formData.tenure),
        emi: calculateEmi(formData.amount, formData.tenure),
        purpose: formData.purpose.trim(),
        appliedOn: new Date().toISOString().slice(0, 10),
        requestedDisburse: formData.requestedDisburse,
        disbursedOn: null,
        preferredRecovery: formData.preferredRecovery,
        attachment: formData.attachment,
        paidEmis: 0,
        balance: 0,
        status: 'Pending Approval',
        nextEmiDate: null,
        chain: [
          { role: 'Reporting Manager', status: 'Pending', date: null },
          { role: 'HR Head', status: 'Waiting', date: null },
          { role: 'Finance', status: 'Waiting', date: null }
        ]
      };

      setLoans((prev) => [newLoan, ...prev]);
      toast.success('Success', 'Loan application submitted successfully');
      setSubmitting(false);
      handleCloseForm();
      setStatusTab('All');
      setSearchTerm('');
      setPage(0);
    }, 500);
  };

  if (loading && loans.length === 0) return <LoadingSpinner message="Loading your loans..." />;

  const emiPreview = calculateEmi(formData.amount, formData.tenure);

  return (
    <div className="cert-root">
      {/* HEADER */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">
            {showForm ? 'New Loan Application' : viewLoan ? `Loan ${viewLoan.loanRef}` : 'My Loans'}
          </h1>
          <p className="cert-subtitle">
            {showForm
              ? 'Fill in the details below to apply for a loan or salary advance'
              : viewLoan
                ? 'Loan details, approval status and repayment schedule'
                : `${CURRENT_EMP.empName} (${CURRENT_EMP.empId}) · Track your applications, balances and repayments`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!viewLoan && !showForm && (
            <button className="cert-add-btn" onClick={handleOpenForm}>
              <FaPlus size={13} /> New Loan Application
            </button>
          )}
          {showForm && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleCloseForm}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {viewLoan && !showForm && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={() => setViewLoan(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        /* ================= NEW LOAN APPLICATION FORM ================= */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            {/* EMPLOYEE DETAILS (READ-ONLY) */}
            <div className="cert-form-section-compact" style={{ marginBottom: '16px' }}>
              <div className="cert-section-label">Employee Details</div>
              <div className="cert-form-grid-3col">
                {[
                  ['Employee ID', formData.empId],
                  ['Name', formData.empName],
                  ['Department', formData.department],
                  ['Grade', formData.grade],
                  ['Net Salary (Monthly)', `₹ ${formData.netSalary.toLocaleString()}`],
                  ['Loan Ref No.', formData.loanRef]
                ].map(([label, value]) => (
                  <div className="cert-field-compact" key={label}>
                    <label>{label}</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={value}
                      readOnly
                      style={{
                        fontSize: '14px', padding: '6px 12px', background: '#f3f4f6',
                        fontFamily: label === 'Loan Ref No.' ? 'monospace' : undefined
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* LOAN REQUEST */}
            <div className="cert-form-section-compact">
              <div className="cert-section-label">Loan Request</div>
              <div className="cert-form-grid-3col">

                {/* Loan Type */}
                <div className={`cert-field-compact ${touched.loanType && errors.loanType ? 'has-error' : ''}`}>
                  <label className="required">Loan Type</label>
                  <select
                    value={formData.loanType}
                    onChange={(e) => handleChange('loanType', e.target.value)}
                    onBlur={() => handleBlur('loanType')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Loan Type</option>
                    {LOAN_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <FieldError msg={touched.loanType && errors.loanType} />
                </div>

                {/* Loan Amount */}
                <div className={`cert-field-compact ${touched.amount && errors.amount ? 'has-error' : ''}`}>
                  <label className="required">Loan Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    onBlur={() => handleBlur('amount')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={touched.amount && errors.amount} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Max Eligible: ₹ {(formData.netSalary * 0.5).toLocaleString()} (50% of net salary)
                  </small>
                </div>

                {/* Tenure */}
                <div className={`cert-field-compact ${touched.tenure && errors.tenure ? 'has-error' : ''}`}>
                  <label className="required">Tenure (months)</label>
                  <input
                    type="number"
                    placeholder="1 - 12 months"
                    value={formData.tenure}
                    onChange={(e) => handleChange('tenure', e.target.value)}
                    onBlur={() => handleBlur('tenure')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                    min="1"
                    max="12"
                  />
                  <FieldError msg={touched.tenure && errors.tenure} />
                </div>

                {/* Requested Disburse */}
                <div className={`cert-field-compact ${touched.requestedDisburse && errors.requestedDisburse ? 'has-error' : ''}`}>
                  <label className="required">Requested Disburse Date</label>
                  <input
                    type="date"
                    value={formData.requestedDisburse}
                    onChange={(e) => handleChange('requestedDisburse', e.target.value)}
                    onBlur={() => handleBlur('requestedDisburse')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={touched.requestedDisburse && errors.requestedDisburse} />
                </div>

                {/* Preferred Recovery */}
                <div className="cert-field-compact">
                  <label>Preferred Recovery</label>
                  <select
                    value={formData.preferredRecovery}
                    onChange={(e) => handleChange('preferredRecovery', e.target.value)}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    {RECOVERY_MODES.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                {/* Attachment */}
                <div className="cert-field-compact">
                  <label>Attach Document</label>
                  <input
                    type="text"
                    placeholder="e.g., medical_bill.pdf"
                    value={formData.attachment}
                    onChange={(e) => handleChange('attachment', e.target.value)}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Medical bill / quotation / receipt (static demo)
                  </small>
                </div>

                {/* Purpose - full width */}
                <div
                  className={`cert-field-compact ${touched.purpose && errors.purpose ? 'has-error' : ''}`}
                  style={{ gridColumn: 'span 3' }}
                >
                  <label className="required">Purpose / Reason</label>
                  <textarea
                    rows="2"
                    placeholder="Describe the reason for this loan..."
                    value={formData.purpose}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    onBlur={() => handleBlur('purpose')}
                    style={{
                      fontSize: '14px',
                      padding: '6px 12px',
                      resize: 'vertical',
                      minHeight: '70px',
                      width: '100%'
                    }}
                  />
                  <FieldError msg={touched.purpose && errors.purpose} />
                </div>

              </div>
            </div>

            {/* LIVE EMI PREVIEW */}
            <div
              className="cert-form-section-compact"
              style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <div className="cert-section-label" style={{ color: '#065f46' }}>
                Live EMI Preview
              </div>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', fontSize: '13px', marginTop: '4px' }}>
                <div>
                  <FaMoneyBillWave size={12} style={{ color: '#059669', marginRight: '6px' }} />
                  <strong>EMI per month:</strong>{' '}
                  <span style={{ color: '#065f46', fontWeight: 600 }}>
                    ₹ {emiPreview.toLocaleString()}
                  </span>
                </div>
                <div>
                  <FaPercent size={12} style={{ color: '#059669', marginRight: '6px' }} />
                  <strong>Interest:</strong>{' '}
                  <span style={{ color: '#065f46', fontWeight: 600 }}>0% (advance)</span>
                </div>
                <div>
                  <FaCalendarAlt size={12} style={{ color: '#059669', marginRight: '6px' }} />
                  <strong>Tenure:</strong>{' '}
                  <span style={{ color: '#065f46', fontWeight: 600 }}>
                    {formData.tenure || 0} months
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="cert-form-actions" style={{ marginTop: '16px' }}>
              <button type="button" className="cert-cancel-btn" onClick={handleCloseForm}>
                <FaTimes size={12} /> Cancel
              </button>
              <button
                type="submit"
                className="cert-add-btn"
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {submitting ? (
                  <><span className="emp-spinner" /> Saving…</>
                ) : (
                  <><FaSave size={12} /> Submit Application</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : viewLoan ? (
        /* ================= DETAIL (full page) ================= */
        <div className="cert-form-wrap">
          <div className="cert-form-compact">
            {/* LOAN DETAILS (READ-ONLY) */}
            <div className="cert-form-section-compact" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="cert-section-label">Loan Details</div>
                <span
                  style={{
                    background: getStatusColor(viewLoan.status).bg,
                    color: getStatusColor(viewLoan.status).color,
                    fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontWeight: 500
                  }}
                >
                  {viewLoan.status}
                </span>
              </div>
              <div className="cert-form-grid-3col">
                {[
                  ['Loan Ref No.', viewLoan.loanRef],
                  ['Loan Type', viewLoan.loanType],
                  ['Loan Amount', fmt(viewLoan.amount)],
                  ['Tenure', `${viewLoan.tenure} months`],
                  ['EMI per month', fmt(viewLoan.emi)],
                  ['Interest', '0% (advance)'],
                  ['Applied On', fmtDate(viewLoan.appliedOn)],
                  ['Requested Disburse Date', fmtDate(viewLoan.requestedDisburse)],
                  ['Disbursed On', fmtDate(viewLoan.disbursedOn)],
                  ['Preferred Recovery', viewLoan.preferredRecovery],
                  ['Balance', fmt(viewLoan.balance)],
                  ['EMIs Paid', `${viewLoan.paidEmis} of ${viewLoan.tenure}`]
                ].map(([k, v]) => (
                  <div className="cert-field-compact" key={k}>
                    <label>{k}</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={v}
                      readOnly
                      style={{
                        fontSize: '14px', padding: '6px 12px', background: '#f3f4f6',
                        fontFamily: k === 'Loan Ref No.' ? 'monospace' : undefined
                      }}
                    />
                  </div>
                ))}
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Purpose / Reason</label>
                  <textarea
                    rows="2"
                    readOnly
                    value={viewLoan.purpose}
                    style={{ fontSize: '14px', padding: '6px 12px', width: '100%', background: '#f3f4f6', minHeight: '56px' }}
                  />
                </div>
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Attachment</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                    <FaPaperclip size={12} style={{ color: '#6b7280' }} />
                    <span>{viewLoan.attachment || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {viewLoan.status === 'Rejected' && viewLoan.rejectionReason && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                <strong>Rejection reason:</strong> {viewLoan.rejectionReason}
              </div>
            )}

            {/* APPROVAL STATUS */}
            <div className="cert-form-section-compact" style={{ marginBottom: '16px' }}>
              <div className="cert-section-label">Approval Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                {viewLoan.chain.map((s, i) => {
                  const c = getStageColor(s.status);
                  return (
                    <div
                      key={s.role}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                    >
                      <strong>{i + 1}. {s.role}</strong>
                      <span>
                        {s.date && <small style={{ color: '#6b7280', marginRight: 8 }}>{fmtDate(s.date)}</small>}
                        <span style={{ background: c.bg, color: c.color, fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontWeight: 500 }}>
                          {s.status}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EMI SCHEDULE */}
            {viewLoan.disbursedOn && (
              <div className="cert-form-section-compact" style={{ marginBottom: '16px' }}>
                <div className="cert-section-label">EMI Schedule</div>
                <table className="cert-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>EMI #</th>
                      <th>Due Date</th>
                      <th>Amount (₹)</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildSchedule(viewLoan).map((r) => (
                      <tr key={r.no}>
                        <td>{r.no}</td>
                        <td>{fmtDate(r.dueDate)}</td>
                        <td>{fmt(r.amount)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              background: r.status === 'Paid' ? '#d1fae5' : '#f3f4f6',
                              color: r.status === 'Paid' ? '#065f46' : '#6b7280',
                              fontSize: '11px', padding: '2px 10px', borderRadius: '12px'
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Form Actions */}
            <div className="cert-form-actions" style={{ marginTop: '16px' }}>
              <button type="button" className="cert-cancel-btn" onClick={() => setViewLoan(null)}>
                <FaArrowLeft size={12} /> Back to list
              </button>
              {canCancel(viewLoan) && (
                <button
                  type="button"
                  className="cert-add-btn"
                  onClick={() => setCancelLoan(viewLoan)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FaBan size={12} /> Cancel Application
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= LIST ================= */
        <>
          {/* SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {[
              { icon: <FaWallet size={14} />, label: 'Outstanding Balance', value: fmt(totalOutstanding), sub: `${activeLoans.length} active loan(s)`, bg: '#fef3c7', color: '#92400e' },
              { icon: <FaMoneyBillWave size={14} />, label: 'Monthly EMI', value: fmt(monthlyEmi), sub: 'Deducted from payroll', bg: '#e0e7ff', color: '#4f46e5' },
              { icon: <FaCalendarAlt size={14} />, label: 'Next EMI Date', value: fmtDate(nextEmi), sub: 'Payroll cycle', bg: '#fce7f3', color: '#9d174d' },
              { icon: <FaCheckCircle size={14} />, label: 'Available Limit', value: fmt(availableLimit), sub: `of ${fmt(maxEligible)} (50% net salary)`, bg: '#d1fae5', color: '#065f46' }
            ].map((c) => (
              <div key={c.label} className="cert-table-card" style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{c.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{c.value}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by loan ref, type, purpose, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '14px', padding: '6px 12px' }}
              />
              {searchTerm && (
                <button className="emp-search-clear" onClick={() => setSearchTerm('')}>
                  <FaTimes size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatusTab(tab); setPage(0); }}
                style={{
                  padding: '5px 14px',
                  fontSize: '12px',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  background: statusTab === tab ? '#9d174d' : 'white',
                  color: statusTab === tab ? 'white' : '#374151'
                }}
              >
                {tab} ({countFor(tab)})
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Ref No.</th>
                    <th>Loan Type</th>
                    <th>Applied On</th>
                    <th>Amount (₹)</th>
                    <th>EMI (₹)</th>
                    <th>Repayment</th>
                    <th>Balance (₹)</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLoans.length > 0 ? (
                    currentLoans.map((item, idx) => {
                      const sc = getStatusColor(item.status);
                      const pct = item.tenure ? Math.round((item.paidEmis / item.tenure) * 100) : 0;
                      return (
                        <tr key={item.id} className="cert-table-row-hover">
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '13px' }}>{item.loanRef}</span>
                          </td>
                          <td>
                            <span style={{ background: '#e0e7ff', color: '#4f46e5', fontSize: '12px', padding: '2px 10px', borderRadius: '12px' }}>
                              {item.loanType}
                            </span>
                          </td>
                          <td>{fmtDate(item.appliedOn)}</td>
                          <td><span style={{ fontWeight: 600 }}>{fmt(item.amount)}</span></td>
                          <td>{fmt(item.emi)}</td>
                          <td style={{ minWidth: '120px' }}>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>
                              {item.paidEmis} of {item.tenure} EMIs paid
                            </div>
                            <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#059669' }} />
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: item.balance > 0 ? 600 : 400, color: item.balance > 0 ? '#b45309' : '#6b7280' }}>
                              {fmt(item.balance)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className="cert-status-badge"
                              style={{ background: sc.bg, color: sc.color, fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontWeight: 500 }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <div className="cert-actions" style={{ justifyContent: 'center', gap: '6px' }}>
                              <button className="cert-act cert-act--edit" title="View details" onClick={() => setViewLoan(item)}>
                                <FaEye size={12} />
                              </button>
                              {canCancel(item) && (
                                <button className="cert-act cert-act--delete" title="Cancel application" onClick={() => setCancelLoan(item)}>
                                  <FaBan size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No loans found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} loans
                </div>
                <div className="cert-pagination" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    className="cert-page-btn"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ← Prev
                  </button>
                  {getPaginationRange().map((pg, i) =>
                    pg === '...' ? (
                      <span key={i} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        style={{
                          padding: '6px 10px', border: '1px solid #e5e7eb',
                          background: pg === page ? '#9d174d' : 'white',
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px', cursor: 'pointer', fontSize: '12px', minWidth: '34px'
                        }}
                      >
                        {pg + 1}
                      </button>
                    )
                  )}
                  <button
                    className="cert-page-btn"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e5e7eb', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= CANCEL CONFIRM MODAL ================= */}
      {cancelLoan && (
        <div className="emp-modal-overlay" onClick={() => setCancelLoan(null)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">⛔</div>
            <h3 className="emp-modal-title">Cancel Application</h3>
            <p className="emp-modal-body">
              Are you sure you want to cancel <strong>{cancelLoan.loanRef}</strong> ({cancelLoan.loanType}, {fmt(cancelLoan.amount)})?
            </p>
            <p className="emp-modal-warn">This will withdraw your request. You can apply again later.</p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setCancelLoan(null)}>Keep</button>
              <button className="emp-modal-confirm" onClick={confirmCancel}>Cancel Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoansScreen;