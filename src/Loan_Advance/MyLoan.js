import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEye,
  FaArrowLeft, FaExclamationCircle, FaMoneyBillWave,
  FaCalendarAlt, FaPercent
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

// ============================================
// STATIC MOCK DATA (logged-in employee only)
// ============================================
const CURRENT_EMP = {
  empId: 'EMP-1042',
  empName: 'Rahul Sharma',
  department: 'Engineering',
  grade: 'M2',
  netSalary: 85000
};

const STATIC_LOANS = [
  {
    id: 1, loanRef: 'LN-0087', loanType: 'Salary Advance', amount: 50000, tenure: 5,
    emi: 10000, purpose: 'Medical emergency at home', requestedDisburse: '2025-11-01',
    preferredRecovery: 'Payroll Deduction', attachment: 'medical_bill.pdf',
    disbursedOn: '2025-11-01', balance: 30000, paidEmis: 2, status: 'Active', rejectReason: ''
  },
  {
    id: 2, loanRef: 'LN-0091', loanType: 'Personal Loan', amount: 20000, tenure: 4,
    emi: 5000, purpose: 'Home repair', requestedDisburse: '2025-10-25',
    preferredRecovery: 'Payroll Deduction', attachment: 'quotation.pdf',
    disbursedOn: null, balance: 0, paidEmis: 0, status: 'Pending Approval', rejectReason: ''
  },
  {
    id: 3, loanRef: 'LN-0062', loanType: 'Emergency Loan', amount: 15000, tenure: 3,
    emi: 5000, purpose: 'Travel emergency', requestedDisburse: '2025-09-10',
    preferredRecovery: 'Payroll Deduction', attachment: 'travel_receipt.pdf',
    disbursedOn: null, balance: 0, paidEmis: 0, status: 'Rejected',
    rejectReason: 'Existing active advance must be cleared before a new emergency loan.'
  },
  {
    id: 4, loanRef: 'LN-0055', loanType: 'Salary Advance', amount: 25000, tenure: 5,
    emi: 5000, purpose: 'Family function', requestedDisburse: '2025-04-01',
    preferredRecovery: 'Payroll Deduction', attachment: 'family_event.jpg',
    disbursedOn: '2025-04-01', balance: 0, paidEmis: 5, status: 'Closed', rejectReason: ''
  },
  {
    id: 5, loanRef: 'LN-0098', loanType: 'Personal Loan', amount: 30000, tenure: 6,
    emi: 5000, purpose: 'Education fees', requestedDisburse: '2025-11-15',
    preferredRecovery: 'Bank Transfer', attachment: 'fees_receipt.pdf',
    disbursedOn: null, balance: 0, paidEmis: 0, status: 'Draft', rejectReason: ''
  },
  {
    id: 6, loanRef: 'LN-0099', loanType: 'Emergency Loan', amount: 10000, tenure: 2,
    emi: 5000, purpose: 'Vehicle repair', requestedDisburse: '2025-11-05',
    preferredRecovery: 'Payroll Deduction', attachment: '—',
    disbursedOn: null, balance: 0, paidEmis: 0, status: 'Approved', rejectReason: ''
  },
  {
    id: 7, loanRef: 'LN-0100', loanType: 'Personal Loan', amount: 12000, tenure: 3,
    emi: 4000, purpose: 'Applied by mistake', requestedDisburse: '2025-10-30',
    preferredRecovery: 'Payroll Deduction', attachment: '—',
    disbursedOn: null, balance: 0, paidEmis: 0, status: 'Cancelled', rejectReason: ''
  }
];

const LOAN_TYPES = ['Salary Advance', 'Personal Loan', 'Emergency Loan'];
const RECOVERY_MODES = ['Payroll Deduction', 'Bank Transfer'];
const STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Active', 'Closed', 'Rejected', 'Cancelled'];

const EMPTY_FORM = {
  loanRef: '', loanType: '', amount: '', tenure: '', purpose: '',
  requestedDisburse: '', preferredRecovery: 'Payroll Deduction', attachment: ''
};

// ============================================
// HELPERS
// ============================================
const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const mon = dt.toLocaleString('en-GB', { month: 'short' });
  return `${day}-${mon}-${String(dt.getFullYear()).slice(-2)}`;
};

const formatMoney = (n) => `₹ ${Number(n).toLocaleString('en-IN')}`;

const getStatusColor = (status) => {
  switch (status) {
    case 'Active': return { bg: '#d1fae5', color: '#065f46' };
    case 'Approved': return { bg: '#dbeafe', color: '#1e40af' };
    case 'Pending Approval': return { bg: '#fef3c7', color: '#92400e' };
    case 'Closed': return { bg: '#e5e7eb', color: '#374151' };
    case 'Rejected': return { bg: '#fee2e2', color: '#b91c1c' };
    case 'Cancelled': return { bg: '#f3e8ff', color: '#6b21a8' };
    case 'Draft': return { bg: '#e0e7ff', color: '#4f46e5' };
    default: return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

// ============================================
// COMPONENT
// ============================================
const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);

  // Filters + search
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  // Modals: { mode: 'view' | 'reason', loan }
  const [modal, setModal] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ---------- fetch (static simulation) ----------
  const fetchLoans = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoans([...STATIC_LOANS]);
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  // ---------- debounced search ----------
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ---------- filter + paginate ----------
  const filteredLoans = loans.filter((item) => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch =
      !s ||
      item.loanRef.toLowerCase().includes(s) ||
      item.loanType.toLowerCase().includes(s) ||
      item.status.toLowerCase().includes(s);
    const matchStatus = !statusFilter || item.status === statusFilter;
    const matchType = !typeFilter || item.loanType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalItems = filteredLoans.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLoans = filteredLoans.slice(startIndex, startIndex + rowsPerPage);

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

  // ---------- utilities ----------
  const generateLoanRef = () => `LN-${String(loans.length + 100).padStart(4, '0')}`;

  const calculateEmi = (amount, tenure) => {
    const a = Number(amount) || 0;
    const t = Number(tenure) || 0;
    return t > 0 ? Math.round(a / t) : 0;
  };

  const maxEligible = CURRENT_EMP.netSalary * 0.5;
  const emiPreview = calculateEmi(formData.amount, formData.tenure);

  // ---------- form handlers ----------
  const resetForm = () => {
    setFormData({ ...EMPTY_FORM, loanRef: generateLoanRef() });
    setErrors({});
    setTouched({});
    setEditingLoan(null);
  };

  const validateField = (field, value) => {
    let error = '';
    if (field === 'loanType' && !value) error = 'Loan Type is required';
    else if (field === 'amount') {
      if (!value) error = 'Loan Amount is required';
      else if (Number(value) <= 0) error = 'Amount must be greater than zero';
      else if (Number(value) > maxEligible) error = 'Amount exceeds 50% of net salary limit';
    } else if (field === 'tenure') {
      if (!value) error = 'Tenure is required';
      else if (Number(value) < 1 || Number(value) > 12) error = 'Tenure must be between 1 and 12 months';
    } else if (field === 'purpose' && !value) error = 'Purpose is required';
    else if (field === 'requestedDisburse' && !value) error = 'Requested disbursement date is required';
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
    const required = ['loanType', 'amount', 'tenure', 'purpose', 'requestedDisburse'];
    const newErrors = {};
    required.forEach((f) => { if (!formData[f]) newErrors[f] = 'This field is required'; });
    if (formData.amount && Number(formData.amount) > maxEligible)
      newErrors.amount = 'Amount exceeds 50% of net salary limit';
    if (formData.tenure && (Number(formData.tenure) < 1 || Number(formData.tenure) > 12))
      newErrors.tenure = 'Tenure must be between 1 and 12 months';
    setErrors(newErrors);
    setTouched(Object.fromEntries(required.map((f) => [f, true])));
    return Object.keys(newErrors).length === 0;
  };

  const buildLoan = (status) => ({
    id: editingLoan ? editingLoan.id : Date.now(),
    loanRef: formData.loanRef,
    loanType: formData.loanType,
    amount: Number(formData.amount),
    tenure: Number(formData.tenure),
    emi: calculateEmi(formData.amount, formData.tenure),
    purpose: formData.purpose,
    requestedDisburse: formData.requestedDisburse,
    preferredRecovery: formData.preferredRecovery,
    attachment: formData.attachment || '—',
    disbursedOn: null,
    balance: 0,
    paidEmis: 0,
    status,
    rejectReason: ''
  });

  const saveLoan = (status, message) => {
    setSubmitting(true);
    setTimeout(() => {
      const loan = buildLoan(status);
      if (editingLoan) {
        setLoans((prev) => prev.map((l) => (l.id === editingLoan.id ? { ...l, ...loan } : l)));
      } else {
        setLoans((prev) => [loan, ...prev]);
      }
      toast.success('Success', message);
      resetForm();
      setShowForm(false);
      setPage(0);
      setSubmitting(false);
    }, 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    saveLoan('Pending Approval', editingLoan ? 'Loan application updated successfully' : 'Loan application submitted successfully');
  };

  const handleSaveDraft = () => {
    if (!formData.loanType) {
      setErrors((p) => ({ ...p, loanType: 'Loan Type is required' }));
      setTouched((p) => ({ ...p, loanType: true }));
      toast.warning('Validation Error', 'Select a loan type to save a draft');
      return;
    }
    saveLoan('Draft', 'Draft saved');
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  // Draft loans reopen in the form; others open the view modal
  const handleView = (item) => {
    if (item.status === 'Draft') {
      setEditingLoan(item);
      setFormData({
        loanRef: item.loanRef, loanType: item.loanType, amount: item.amount,
        tenure: item.tenure, purpose: item.purpose, requestedDisburse: item.requestedDisburse,
        preferredRecovery: item.preferredRecovery, attachment: item.attachment === '—' ? '' : item.attachment
      });
      setErrors({});
      setTouched({});
      setShowForm(true);
      return;
    }
    setModal({ mode: item.status === 'Rejected' ? 'reason' : 'view', loan: item });
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  const handleCancelLoan = (loan) => {
    setLoans((prev) => prev.map((l) => (l.id === loan.id ? { ...l, status: 'Cancelled' } : l)));
    toast.success('Cancelled', `${loan.loanRef} has been cancelled`);
    setModal(null);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSearchTerm('');
  };

  // ---------- render guard ----------
  if (loading && !showForm && loans.length === 0) {
    return <LoadingSpinner message="Loading loans..." />;
  }

  const actionLabel = (status) => (status === 'Rejected' ? 'View reason' : status === 'Draft' ? 'Edit' : 'View');
  const hasFilters = statusFilter || typeFilter || searchTerm;

  return (
    <div className="cert-root">
      {/* HEADER */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">
            Loans &amp; Advances <span style={{ color: '#9ca3af', fontWeight: 400 }}>&gt;</span> My Loans
          </h1>
          <p className="cert-subtitle">Track your loan applications, EMIs and outstanding balance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm ? (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> New Application
            </button>
          ) : (
            <button
              type="button"
              className="cert-back-btn"
              onClick={handleBackToList}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        /* ================= FORM ================= */
        <div className="cert-form-wrap">
          <form onSubmit={handleSubmit} className="cert-form-compact">
            {/* EMPLOYEE DETAILS (READ-ONLY) */}
            <div className="cert-form-section-compact" style={{ marginBottom: '16px' }}>
              <div className="cert-section-label">Employee Details</div>
              <div className="cert-form-grid-3col">
                {[
                  ['Employee ID', CURRENT_EMP.empId],
                  ['Name', CURRENT_EMP.empName],
                  ['Department', CURRENT_EMP.department],
                  ['Grade', CURRENT_EMP.grade],
                  ['Net Salary (Monthly)', formatMoney(CURRENT_EMP.netSalary)],
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
                <div className={`cert-field-compact ${touched.loanType && errors.loanType ? 'has-error' : ''}`}>
                  <label className="required">Loan Type</label>
                  <select
                    value={formData.loanType}
                    onChange={(e) => handleChange('loanType', e.target.value)}
                    onBlur={() => handleBlur('loanType')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    <option value="">Select Loan Type</option>
                    {LOAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <FieldError msg={errors.loanType} />
                </div>

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
                  <FieldError msg={errors.amount} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Max Eligible: {formatMoney(maxEligible)} (50% of net salary)
                  </small>
                </div>

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
                  <FieldError msg={errors.tenure} />
                </div>

                <div className={`cert-field-compact ${touched.requestedDisburse && errors.requestedDisburse ? 'has-error' : ''}`}>
                  <label className="required">Requested Disburse Date</label>
                  <input
                    type="date"
                    value={formData.requestedDisburse}
                    onChange={(e) => handleChange('requestedDisburse', e.target.value)}
                    onBlur={() => handleBlur('requestedDisburse')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.requestedDisburse} />
                </div>

                <div className="cert-field-compact">
                  <label>Preferred Recovery</label>
                  <select
                    value={formData.preferredRecovery}
                    onChange={(e) => handleChange('preferredRecovery', e.target.value)}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    {RECOVERY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

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
                    style={{ fontSize: '14px', padding: '6px 12px', resize: 'vertical', minHeight: '70px', width: '100%' }}
                  />
                  <FieldError msg={errors.purpose} />
                </div>
              </div>
            </div>

            {/* LIVE EMI PREVIEW */}
            <div
              className="cert-form-section-compact"
              style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <div className="cert-section-label" style={{ color: '#065f46' }}>Live EMI Preview</div>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', fontSize: '13px', marginTop: '4px' }}>
                <div>
                  <FaMoneyBillWave size={12} style={{ color: '#059669', marginRight: '6px' }} />
                  <strong>EMI per month:</strong>{' '}
                  <span style={{ color: '#065f46', fontWeight: 600 }}>{formatMoney(emiPreview)}</span>
                </div>
                <div>
                  <FaPercent size={12} style={{ color: '#059669', marginRight: '6px' }} />
                  <strong>Interest:</strong>{' '}
                  <span style={{ color: '#065f46', fontWeight: 600 }}>0% (advance)</span>
                </div>
                <div>
                  <FaCalendarAlt size={12} style={{ color: '#059669', marginRight: '6px' }} />
                  <strong>Tenure:</strong>{' '}
                  <span style={{ color: '#065f46', fontWeight: 600 }}>{formData.tenure || 0} months</span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="cert-form-actions" style={{ marginTop: '16px' }}>
              <button type="button" className="cert-cancel-btn" onClick={handleBackToList}>
                <FaTimes size={12} /> Cancel
              </button>
              <button
                type="button"
                className="cert-cancel-btn"
                onClick={handleSaveDraft}
                disabled={submitting}
              >
                <FaSave size={12} /> Save as Draft
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
                  <><FaSave size={12} /> {editingLoan ? 'Update & Submit' : 'Submit Application'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= LIST ================= */
        <>
          {/* Filters + Search */}
          <div
            className="emp-search-bar"
            style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                style={{ fontSize: '14px', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white' }}
              >
                <option value="">All Status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                style={{ fontSize: '14px', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white' }}
              >
                <option value="">All Loan Types</option>
                {LOAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{ fontSize: '13px', color: '#9d174d', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by ref no, type, status..."
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

          {/* Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Ref No.</th>
                    <th>Type</th>
                    <th>Amount (₹)</th>
                    <th>EMI (₹)</th>
                    <th>Disbursed</th>
                    <th>Balance (₹)</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLoans.length > 0 ? (
                    currentLoans.map((item, idx) => {
                      const sc = getStatusColor(item.status);
                      const isActive = item.status === 'Active';
                      return (
                        <tr key={item.id} className="cert-table-row-hover">
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '13px' }}>
                              {item.loanRef}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              background: '#e0e7ff', color: '#4f46e5', fontSize: '12px',
                              padding: '2px 10px', borderRadius: '12px', whiteSpace: 'nowrap'
                            }}>
                              {item.loanType}
                            </span>
                          </td>
                          <td><span style={{ fontWeight: 600 }}>{formatMoney(item.amount)}</span></td>
                          <td>{formatMoney(item.emi)}</td>
                          <td>{formatDate(item.disbursedOn)}</td>
                          <td>
                            {isActive ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, color: '#b45309' }}>{formatMoney(item.balance)}</span>
                                <small style={{ fontSize: '11px', color: '#6b7280' }}>
                                  ({item.paidEmis} of {item.tenure})
                                </small>
                              </div>
                            ) : item.status === 'Closed' ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#6b7280' }}>{formatMoney(0)}</span>
                                <small style={{ fontSize: '11px', color: '#6b7280' }}>
                                  ({item.paidEmis} of {item.tenure})
                                </small>
                              </div>
                            ) : (
                              <span style={{ color: '#6b7280' }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <span
                                className="cert-status-badge"
                                style={{
                                  background: sc.bg, color: sc.color, fontSize: '11px',
                                  padding: '3px 10px', borderRadius: '12px', fontWeight: 500,
                                  display: 'inline-flex', alignItems: 'center', gap: '5px'
                                }}
                              >
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
                                {item.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleView(item)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer', color: '#9d174d',
                                  fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0
                                }}
                              >
                                <FaEye size={11} /> {actionLabel(item.status)}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No loan applications found
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
                      <span key={`dots-${i}`} style={{ padding: '6px 4px', color: '#6b7280' }}>…</span>
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

      {/* VIEW / REJECTION REASON MODAL */}
      {modal && (
        <div className="emp-modal-overlay" onClick={() => setModal(null)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, textAlign: 'left' }}>
            <h3 className="emp-modal-title">
              {modal.mode === 'reason' ? 'Rejection Reason' : 'Loan Details'} — {modal.loan.loanRef}
            </h3>

            {modal.mode === 'reason' ? (
              <>
                <p className="emp-modal-body">
                  {modal.loan.rejectReason || 'No reason was provided.'}
                </p>
                <p className="emp-modal-warn">
                  You can submit a new application once the issue above is resolved.
                </p>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', fontSize: '13px', margin: '12px 0' }}>
                {[
                  ['Loan Type', modal.loan.loanType],
                  ['Status', modal.loan.status],
                  ['Amount', formatMoney(modal.loan.amount)],
                  ['EMI', formatMoney(modal.loan.emi)],
                  ['Tenure', `${modal.loan.tenure} months`],
                  ['Recovery', modal.loan.preferredRecovery],
                  ['Requested Disburse', formatDate(modal.loan.requestedDisburse)],
                  ['Disbursed On', formatDate(modal.loan.disbursedOn)],
                  ['Paid EMIs', `${modal.loan.paidEmis} of ${modal.loan.tenure}`],
                  ['Balance', modal.loan.balance ? formatMoney(modal.loan.balance) : '—'],
                  ['Attachment', modal.loan.attachment || '—']
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>{k}</div>
                    <div style={{ fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>Purpose</div>
                  <div style={{ fontWeight: 500 }}>{modal.loan.purpose}</div>
                </div>
              </div>
            )}

            <div className="emp-modal-actions">
              {modal.loan.status === 'Pending Approval' && (
                <button className="emp-modal-cancel" onClick={() => handleCancelLoan(modal.loan)}>
                  Cancel Loan
                </button>
              )}
              <button className="emp-modal-confirm" onClick={() => setModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoans;