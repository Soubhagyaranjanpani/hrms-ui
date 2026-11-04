import React, { useState, useEffect, useCallback } from 'react';
import {
  FaPlus, FaSearch, FaTimes, FaEye, FaArrowLeft, FaPaperclip,
  FaCheckCircle, FaTimesCircle, FaCheck, FaExclamationCircle,
  FaSave, FaMoneyBillWave, FaCalendarAlt, FaPercent
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

// ============================================
// STATIC MOCK DATA
// ============================================
const ROLES = ['Reporting Manager', 'HR Head', 'Finance'];
const LOAN_TYPES = ['Salary Advance', 'Personal Loan', 'Emergency Loan'];
const RECOVERY_MODES = ['Payroll Deduction', 'Bank Transfer'];
// Logged-in employee details (static simulation, same as Loans & Advances page)
const CURRENT_EMP = {
  empId: 'EMP-1042', empName: 'Rahul Sharma', department: 'Engineering', grade: 'M2', netSalary: 85000
};
const EMPTY_FORM = {
  loanRef: '', empId: '', empName: '', department: '', grade: '', netSalary: 0,
  loanType: '', amount: '', tenure: '', purpose: '', requestedDisburse: '',
  preferredRecovery: 'Payroll Deduction', attachment: '', status: 'Draft'
};
const MAX_TENURE = 12;
const MAX_PERCENT = 0.5;

const makeChain = () => ROLES.map((role, i) => ({
  role,
  status: i === 0 ? 'Pending' : 'Waiting',
  actedOn: null,
  remarks: ''
}));

const STATIC_REQUESTS = [
  {
    id: 2, loanRef: 'LN-0091', empId: 'EMP-1042', empName: 'Rahul Sharma', department: 'Engineering', grade: 'M2',
    netSalary: 85000, loanType: 'Personal Loan', amount: 20000, tenure: 4, emi: 5000,
    purpose: 'Home repair', attachment: 'quotation.pdf', appliedOn: '2025-10-22',
    activeOutstanding: 0, status: 'Pending Approval', rejectionReason: '', chain: makeChain()
  },
  {
    id: 6, loanRef: 'LN-0099', empId: 'EMP-2011', empName: 'Priya Verma', department: 'Finance', grade: 'M1',
    netSalary: 62000, loanType: 'Emergency Loan', amount: 40000, tenure: 8, emi: 5000,
    purpose: 'Family medical treatment', attachment: 'hospital_estimate.pdf', appliedOn: '2025-10-26',
    activeOutstanding: 12000, status: 'Pending Approval', rejectionReason: '',
    chain: [
      { role: 'Reporting Manager', status: 'Approved', actedOn: '2025-10-27', remarks: 'Genuine requirement.' },
      { role: 'HR Head', status: 'Pending', actedOn: null, remarks: '' },
      { role: 'Finance', status: 'Waiting', actedOn: null, remarks: '' }
    ]
  },
  {
    id: 7, loanRef: 'LN-0102', empId: 'EMP-3045', empName: 'Amit Singh', department: 'Sales', grade: 'M1',
    netSalary: 55000, loanType: 'Salary Advance', amount: 15000, tenure: 3, emi: 5000,
    purpose: 'Rent deposit', attachment: 'rent_agreement.pdf', appliedOn: '2025-10-18',
    activeOutstanding: 0, status: 'Approved', rejectionReason: '',
    chain: [
      { role: 'Reporting Manager', status: 'Approved', actedOn: '2025-10-19', remarks: 'Approved.' },
      { role: 'HR Head', status: 'Approved', actedOn: '2025-10-20', remarks: 'OK.' },
      { role: 'Finance', status: 'Approved', actedOn: '2025-10-21', remarks: 'Cleared for disbursement.' }
    ]
  },
  {
    id: 8, loanRef: 'LN-0080', empId: 'EMP-4120', empName: 'Neha Kapoor', department: 'Marketing', grade: 'M1',
    netSalary: 58000, loanType: 'Personal Loan', amount: 25000, tenure: 5, emi: 5000,
    purpose: 'Wedding expenses', attachment: 'invoice.pdf', appliedOn: '2025-10-05',
    activeOutstanding: 0, status: 'Rejected', rejectionReason: 'Invoice does not match the requested amount.',
    chain: [
      { role: 'Reporting Manager', status: 'Approved', actedOn: '2025-10-06', remarks: 'Fine from my side.' },
      { role: 'HR Head', status: 'Rejected', actedOn: '2025-10-08', remarks: 'Invoice does not match the requested amount.' },
      { role: 'Finance', status: 'Closed', actedOn: null, remarks: '' }
    ]
  },
  {
    id: 9, loanRef: 'LN-0071', empId: 'EMP-5002', empName: 'Karan Mehta', department: 'Operations', grade: 'M2',
    netSalary: 72000, loanType: 'Personal Loan', amount: 30000, tenure: 6, emi: 5000,
    purpose: 'Vehicle repair', attachment: 'garage_estimate.pdf', appliedOn: '2025-09-28',
    activeOutstanding: 0, status: 'Approved', rejectionReason: '',
    chain: [
      { role: 'Reporting Manager', status: 'Approved', actedOn: '2025-09-29', remarks: 'Approved.' },
      { role: 'HR Head', status: 'Approved', actedOn: '2025-09-30', remarks: 'Policy compliant.' },
      { role: 'Finance', status: 'Approved', actedOn: '2025-10-01', remarks: 'Cleared for disbursement.' }
    ]
  },
  {
    id: 10, loanRef: 'LN-0066', empId: 'EMP-6310', empName: 'Sneha Iyer', department: 'HR', grade: 'M1',
    netSalary: 60000, loanType: 'Salary Advance', amount: 12000, tenure: 3, emi: 4000,
    purpose: 'Security deposit', attachment: 'deposit_receipt.pdf', appliedOn: '2025-09-15',
    activeOutstanding: 0, status: 'Approved', rejectionReason: '',
    chain: [
      { role: 'Reporting Manager', status: 'Approved', actedOn: '2025-09-16', remarks: 'OK.' },
      { role: 'HR Head', status: 'Approved', actedOn: '2025-09-17', remarks: 'OK.' },
      { role: 'Finance', status: 'Approved', actedOn: '2025-09-18', remarks: 'Cleared.' }
    ]
  },
  {
    id: 11, loanRef: 'LN-0104', empId: 'EMP-7188', empName: 'Vikram Rao', department: 'Engineering', grade: 'M3',
    netSalary: 98000, loanType: 'Emergency Loan', amount: 35000, tenure: 7, emi: 5000,
    purpose: 'Hospital admission', attachment: 'hospital_bill.pdf', appliedOn: '2025-10-29',
    activeOutstanding: 0, status: 'Pending Approval', rejectionReason: '',
    chain: [
      { role: 'Reporting Manager', status: 'Approved', actedOn: '2025-10-30', remarks: 'Urgent case.' },
      { role: 'HR Head', status: 'Approved', actedOn: '2025-10-30', remarks: 'Verified documents.' },
      { role: 'Finance', status: 'Pending', actedOn: null, remarks: '' }
    ]
  }
];

// ============================================
// HELPERS
// ============================================
const fmt = (n) => `₹ ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const getStatusColor = (status) => {
  switch (status) {
    case 'Approved': return { bg: '#d1fae5', color: '#065f46' };
    case 'Pending Approval':
    case 'Pending': return { bg: '#fef3c7', color: '#92400e' };
    case 'Rejected': return { bg: '#fee2e2', color: '#b91c1c' };
    case 'Closed': return { bg: '#e5e7eb', color: '#374151' };
    default: return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

const getEligibility = (r) => {
  const limit = r.netSalary * MAX_PERCENT;
  return [
    {
      ok: r.amount <= limit,
      text: r.amount <= limit
        ? `Amount within 50% net salary limit (max ${fmt(limit)})`
        : `Amount exceeds 50% net salary limit (max ${fmt(limit)})`
    },
    {
      ok: r.activeOutstanding === 0,
      text: r.activeOutstanding === 0
        ? 'No active loan outstanding'
        : `Active loan outstanding of ${fmt(r.activeOutstanding)}`
    },
    {
      ok: r.tenure <= MAX_TENURE,
      text: r.tenure <= MAX_TENURE
        ? `Tenure within policy (max ${MAX_TENURE} months)`
        : `Tenure exceeds policy (max ${MAX_TENURE} months)`
    }
  ];
};

const pendingStage = (r) => (r.status === 'Pending Approval' ? r.chain.find((s) => s.status === 'Pending') : null);

// ============================================
// COMPONENT
// ============================================
const LoanApproval = ({ userRole = 'Reporting Manager' }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Role of the logged-in approver: pass it from your auth / user context
  // (one of 'Reporting Manager' | 'HR Head' | 'Finance')
  const currentRole = userRole;

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // Add-form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ---------- simulate fetch ----------
  const fetchRequests = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setRequests(STATIC_REQUESTS.map((r) => ({ ...r, chain: r.chain.map((s) => ({ ...s })) })));
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ---------- debounced search ----------
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(0); }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const isMine = (r) => pendingStage(r)?.role === currentRole;

  const filtered = requests.filter((r) => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch =
      r.loanRef.toLowerCase().includes(s) ||
      r.empName.toLowerCase().includes(s) ||
      r.empId.toLowerCase().includes(s) ||
      r.loanType.toLowerCase().includes(s) ||
      r.status.toLowerCase().includes(s);
    const matchTab =
      tab === 'All' ||
      (tab === 'Pending for me' ? isMine(r) : r.status === tab);
    return matchSearch && matchTab;
  }).sort((a, b) => (isMine(b) ? 1 : 0) - (isMine(a) ? 1 : 0));

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentRows = filtered.slice(startIndex, startIndex + rowsPerPage);

  const countFor = (t) =>
    t === 'All' ? requests.length
      : t === 'Pending for me' ? requests.filter(isMine).length
      : requests.filter((r) => r.status === t).length;

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

  const selected = requests.find((r) => r.id === selectedId) || null;

  // ---------- open / close ----------
  const openRequest = (r) => {
    setSelectedId(r.id);
    setRemarks('');
    setRemarksError('');
  };

  const closeRequest = () => {
    setSelectedId(null);
    setRemarks('');
    setRemarksError('');
  };

  // ---------- approve / reject ----------
  const today = () => new Date().toISOString().slice(0, 10);

  const handleApprove = () => {
    const stage = pendingStage(selected);
    if (!stage || stage.role !== currentRole) return;

    setSubmitting(true);
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== selected.id) return r;
          const idx = r.chain.findIndex((s) => s.status === 'Pending');
          const chain = r.chain.map((s, i) => {
            if (i === idx) return { ...s, status: 'Approved', actedOn: today(), remarks: remarks.trim() };
            if (i === idx + 1) return { ...s, status: 'Pending' };
            return s;
          });
          const isLast = idx === r.chain.length - 1;
          return { ...r, chain, status: isLast ? 'Approved' : 'Pending Approval' };
        })
      );
      const isLast = ROLES.indexOf(stage.role) === ROLES.length - 1;
      toast.success(
        isLast ? 'Approved' : 'Forwarded',
        isLast
          ? `${selected.loanRef} fully approved and ready for disbursement`
          : `${selected.loanRef} forwarded to ${ROLES[ROLES.indexOf(stage.role) + 1]}`
      );
      setSubmitting(false);
      setTab('All');
      setPage(0);
      closeRequest();
    }, 400);
  };

  const handleReject = () => {
    const stage = pendingStage(selected);
    if (!stage || stage.role !== currentRole) return;

    if (!remarks.trim()) {
      setRemarksError('Remarks are required to reject a request');
      toast.warning('Validation Error', 'Please enter the reason for rejection');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== selected.id) return r;
          const idx = r.chain.findIndex((s) => s.status === 'Pending');
          const chain = r.chain.map((s, i) => {
            if (i === idx) return { ...s, status: 'Rejected', actedOn: today(), remarks: remarks.trim() };
            if (i > idx) return { ...s, status: 'Closed' };
            return s;
          });
          return { ...r, chain, status: 'Rejected', rejectionReason: remarks.trim() };
        })
      );
      toast.success('Rejected', `${selected.loanRef} has been rejected and closed`);
      setSubmitting(false);
      setTab('All');
      setPage(0);
      closeRequest();
    }, 400);
  };


  // ============================================
  // ADD FORM HANDLERS
  // ============================================
  const generateLoanRef = () => `LN-${String(requests.length + 100).padStart(4, '0')}`;

  const calculateEmi = (amount, tenure) => {
    const a = Number(amount) || 0;
    const t = Number(tenure) || 0;
    return t > 0 ? Math.round(a / t) : 0;
  };

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM, loanRef: generateLoanRef() });
    setErrors({});
    setTouched({});
  };

  const handleAddNew = () => {
    closeRequest();
    setFormData({ ...EMPTY_FORM, ...CURRENT_EMP, loanRef: generateLoanRef() });
    setErrors({});
    setTouched({});
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  const validateField = (field, value, data = formData) => {
    let error = '';
    if (field === 'loanType' && !value) {
      error = 'Loan Type is required';
    } else if (field === 'amount') {
      if (!value) error = 'Loan Amount is required';
      else if (Number(value) <= 0) error = 'Amount must be greater than zero';
      else if (Number(value) > data.netSalary * MAX_PERCENT) error = 'Amount exceeds 50% of net salary limit';
    } else if (field === 'tenure') {
      if (!value) error = 'Tenure is required';
      else if (Number(value) < 1 || Number(value) > MAX_TENURE) error = 'Tenure must be between 1 and 12 months';
    } else if (field === 'purpose' && !value) {
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
    const newErrors = {};
    ['loanType', 'amount', 'tenure', 'purpose', 'requestedDisburse'].forEach((f) => {
      if (!formData[f]) newErrors[f] = 'This field is required';
    });
    if (formData.amount && Number(formData.amount) > formData.netSalary * MAX_PERCENT) {
      newErrors.amount = 'Amount exceeds 50% of net salary limit';
    }
    if (formData.tenure && (Number(formData.tenure) < 1 || Number(formData.tenure) > MAX_TENURE)) {
      newErrors.tenure = 'Tenure must be between 1 and 12 months';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }
    setFormSubmitting(true);
    setTimeout(() => {
      const newRequest = {
        id: Date.now(),
        loanRef: formData.loanRef,
        empId: formData.empId,
        empName: formData.empName,
        department: formData.department,
        grade: formData.grade,
        netSalary: formData.netSalary,
        loanType: formData.loanType,
        amount: Number(formData.amount),
        tenure: Number(formData.tenure),
        emi: calculateEmi(formData.amount, formData.tenure),
        purpose: formData.purpose,
        attachment: formData.attachment || '—',
        appliedOn: today(),
        activeOutstanding: 0,
        status: 'Pending Approval',
        rejectionReason: '',
        chain: makeChain()
      };
      setRequests((prev) => [newRequest, ...prev]);
      toast.success('Success', 'Loan application submitted successfully');
      setFormSubmitting(false);
      setShowForm(false);
      setTab('All');
      setPage(0);
      resetForm();
    }, 500);
  };

  const emiPreview = calculateEmi(formData.amount, formData.tenure);

  if (loading && requests.length === 0) return <LoadingSpinner message="Loading approvals..." />;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="cert-root">
      {/* HEADER */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">
            {showForm ? (
              <>
                <span style={{ color: '#6b7280', fontWeight: 400, cursor: 'pointer' }} onClick={handleBackToList}>Approvals</span>
                {' > '}New Loan Application
              </>
            ) : selected ? (
              <>
                <span style={{ color: '#6b7280', fontWeight: 400, cursor: 'pointer' }} onClick={closeRequest}>Approvals</span>
                {' > '}Loan Request {selected.loanRef}
              </>
            ) : 'Approvals'}
          </h1>
          <p className="cert-subtitle">
            {showForm
              ? 'Fill in the details to submit a loan request for approval'
              : selected
                ? 'Review the request and take action. Approval is sequential.'
                : 'Loan requests waiting for your approval'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!selected && !showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> New Loan Application
            </button>
          )}
          {(selected || showForm) && (
            <button
              type="button"
              className="cert-back-btn"
              onClick={showForm ? handleBackToList : closeRequest}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <FaArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        /* ================= ADD FORM ================= */
        <div className="cert-form-wrap">
          <form onSubmit={handleFormSubmit} className="cert-form-compact">
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
                ].map(([k, v]) => (
                  <div className="cert-field-compact" key={k}>
                    <label>{k}</label>
                    <input
                      type="text" className="form-control bg-light" value={v} readOnly
                      style={{
                        fontSize: '14px', padding: '6px 12px', background: '#f3f4f6',
                        fontFamily: k === 'Loan Ref No.' ? 'monospace' : undefined
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
                    type="number" placeholder="e.g., 50000" value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    onBlur={() => handleBlur('amount')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.amount} />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>
                    Max Eligible: ₹ {(formData.netSalary * MAX_PERCENT).toLocaleString()} (50% of net salary)
                  </small>
                </div>

                <div className={`cert-field-compact ${touched.tenure && errors.tenure ? 'has-error' : ''}`}>
                  <label className="required">Tenure (months)</label>
                  <input
                    type="number" placeholder="1 - 12 months" value={formData.tenure} min="1" max="12"
                    onChange={(e) => handleChange('tenure', e.target.value)}
                    onBlur={() => handleBlur('tenure')}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  />
                  <FieldError msg={errors.tenure} />
                </div>

                <div className={`cert-field-compact ${touched.requestedDisburse && errors.requestedDisburse ? 'has-error' : ''}`}>
                  <label className="required">Requested Disburse Date</label>
                  <input
                    type="date" value={formData.requestedDisburse}
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
                    type="text" placeholder="e.g., medical_bill.pdf" value={formData.attachment}
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
                    rows="2" placeholder="Describe the reason for this loan..." value={formData.purpose}
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
                  <span style={{ color: '#065f46', fontWeight: 600 }}>₹ {emiPreview.toLocaleString()}</span>
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
                type="submit" className="cert-add-btn" disabled={formSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {formSubmitting ? (
                  <><span className="emp-spinner" /> Saving…</>
                ) : (
                  <><FaSave size={12} /> Submit Application</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : selected ? (
        /* ================= DETAIL ================= */
        <div className="cert-form-wrap">
          <div className="cert-form-compact">
            {/* APPLICANT */}
            <div className="cert-form-section-compact" style={{ marginBottom: '16px' }}>
              <div className="cert-section-label">Applicant</div>
              <div className="cert-form-grid-3col">
                {[
                  ['Applicant', `${selected.empName}`],
                  ['Employee ID', selected.empId],
                  ['Department', selected.department],
                  ['Grade', selected.grade],
                  ['Net Salary (Monthly)', fmt(selected.netSalary)],
                  ['Applied On', fmtDate(selected.appliedOn)]
                ].map(([k, v]) => (
                  <div className="cert-field-compact" key={k}>
                    <label>{k}</label>
                    <input
                      type="text" className="form-control bg-light" value={v} readOnly
                      style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* LOAN DETAILS */}
            <div className="cert-form-section-compact" style={{ marginBottom: '16px' }}>
              <div className="cert-section-label">Loan Details</div>
              <div className="cert-form-grid-3col">
                {[
                  ['Loan Type', selected.loanType],
                  ['Amount', fmt(selected.amount)],
                  ['Tenure', `${selected.tenure} months`],
                  ['EMI', fmt(selected.emi)],
                  ['Interest', '0% (advance)'],
                  ['Loan Ref No.', selected.loanRef]
                ].map(([k, v]) => (
                  <div className="cert-field-compact" key={k}>
                    <label>{k}</label>
                    <input
                      type="text" className="form-control bg-light" value={v} readOnly
                      style={{
                        fontSize: '14px', padding: '6px 12px', background: '#f3f4f6',
                        fontFamily: k === 'Loan Ref No.' ? 'monospace' : undefined
                      }}
                    />
                  </div>
                ))}
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Purpose</label>
                  <textarea
                    rows="2" readOnly value={selected.purpose}
                    style={{ fontSize: '14px', padding: '6px 12px', width: '100%', background: '#f3f4f6', minHeight: '56px' }}
                  />
                </div>
                <div className="cert-field-compact" style={{ gridColumn: 'span 3' }}>
                  <label>Attachment</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                    <FaPaperclip size={12} style={{ color: '#6b7280' }} />
                    <span>{selected.attachment || '—'}</span>
                    {selected.attachment && (
                      <button
                        type="button"
                        className="cert-cancel-btn"
                        style={{ padding: '3px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => toast.success('Info', `Opening ${selected.attachment} (static demo)`)}
                      >
                        <FaEye size={11} /> View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ELIGIBILITY */}
            <div className="cert-form-section-compact" style={{ marginBottom: '16px', background: '#f9fafb' }}>
              <div className="cert-section-label">Eligibility Check</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                {getEligibility(selected).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: c.ok ? '#065f46' : '#b91c1c' }}>
                    {c.ok ? <FaCheckCircle size={13} /> : <FaTimesCircle size={13} />}
                    {c.text}
                  </div>
                ))}
              </div>
            </div>

            {/* APPROVAL CHAIN */}
            <div className="cert-form-section-compact" style={{ marginBottom: '16px' }}>
              <div className="cert-section-label">Approval Chain</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selected.chain.map((s, i) => {
                  const c = getStatusColor(s.status);
                  const canAct = s.status === 'Pending' && s.role === currentRole && selected.status === 'Pending Approval';
                  return (
                    <div
                      key={s.role}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                        padding: '10px 14px', border: `1px solid ${canAct ? '#9d174d' : '#e5e7eb'}`,
                        borderRadius: '6px', background: canAct ? '#fdf2f8' : 'white', flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ fontSize: '14px' }}>
                        <strong>{i + 1}. {s.role}</strong>
                        {s.actedOn && <small style={{ color: '#6b7280', marginLeft: 10 }}>{fmtDate(s.actedOn)}</small>}
                        {s.remarks && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>“{s.remarks}”</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: c.bg, color: c.color, fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontWeight: 500 }}>
                          {s.status}
                        </span>
                        {canAct && (
                          <>
                            <button
                              type="button" className="cert-add-btn" disabled={submitting} onClick={handleApprove}
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              Approve
                            </button>
                            <button
                              type="button" className="cert-cancel-btn" disabled={submitting} onClick={handleReject}
                              style={{ padding: '4px 12px', fontSize: '12px' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <small style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                Approval is sequential. Each approver sees action buttons only at their own stage.
                Rejection at any stage closes the request with a reason.
              </small>
            </div>

            {/* RESULT BANNERS */}
            {selected.status === 'Rejected' && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                <strong>Request closed.</strong> Rejection reason: {selected.rejectionReason}
              </div>
            )}
            {selected.status === 'Approved' && (
              <div style={{ padding: '10px 14px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                <strong>Fully approved.</strong> The loan is ready for disbursement.
              </div>
            )}
            {selected.status === 'Pending Approval' && !pendingStage(selected)?.role.includes(currentRole) && (
              <div style={{ padding: '10px 14px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                Waiting for <strong>{pendingStage(selected)?.role}</strong>. You can act only when this request reaches your stage.
              </div>
            )}

            {/* REMARKS + ACTIONS (only for the current approver) */}
            {isMine(selected) && (
              <>
                <div className={`cert-field-compact ${remarksError ? 'has-error' : ''}`}>
                  <label>Remarks <small style={{ color: '#6b7280' }}>(required for rejection)</small></label>
                  <textarea
                    rows="2"
                    placeholder="Add your remarks..."
                    value={remarks}
                    onChange={(e) => { setRemarks(e.target.value); if (remarksError) setRemarksError(''); }}
                    style={{ fontSize: '14px', padding: '6px 12px', resize: 'vertical', minHeight: '70px', width: '100%' }}
                  />
                  {remarksError && (
                    <span className="field-err">
                      <FaExclamationCircle size={10} /> {remarksError}
                    </span>
                  )}
                </div>

                <div className="cert-form-actions" style={{ marginTop: '16px' }}>
                  <button type="button" className="cert-cancel-btn" disabled={submitting} onClick={handleReject}>
                    <FaTimes size={12} /> Reject
                  </button>
                  <button
                    type="button" className="cert-add-btn" disabled={submitting} onClick={handleApprove}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {submitting ? (
                      <><span className="emp-spinner" /> Saving…</>
                    ) : (
                      <>
                        <FaCheck size={12} />
                        {currentRole === 'Finance' ? 'Approve & Finalize' : 'Approve & Forward'}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ================= LIST ================= */
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input
                className="emp-search-input"
                type="text"
                placeholder="Search by loan ref, employee, type, status..."
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

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
            {['All', 'Pending for me', 'Pending Approval', 'Approved', 'Rejected'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(0); }}
                style={{
                  padding: '5px 14px', fontSize: '12px', borderRadius: '16px', border: '1px solid #e5e7eb', cursor: 'pointer',
                  background: tab === t ? '#9d174d' : 'white',
                  color: tab === t ? 'white' : '#374151'
                }}
              >
                {t} ({countFor(t)})
              </button>
            ))}
          </div>

          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Ref No.</th>
                    <th>Applicant</th>
                    <th>Loan Type</th>
                    <th>Amount (₹)</th>
                    <th>Tenure</th>
                    <th>Applied On</th>
                    <th>Waiting On</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((item, idx) => {
                      const sc = getStatusColor(item.status);
                      const stage = pendingStage(item);
                      return (
                        <tr key={item.id} className="cert-table-row-hover">
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 500, fontSize: '13px' }}>{item.loanRef}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong>{item.empName}</strong>
                              <small style={{ fontSize: '11px', color: '#6b7280' }}>
                                {item.empId} · {item.department}
                              </small>
                            </div>
                          </td>
                          <td>
                            <span style={{ background: '#e0e7ff', color: '#4f46e5', fontSize: '12px', padding: '2px 10px', borderRadius: '12px' }}>
                              {item.loanType}
                            </span>
                          </td>
                          <td><span style={{ fontWeight: 600 }}>{fmt(item.amount)}</span></td>
                          <td>{item.tenure} mo</td>
                          <td>{fmtDate(item.appliedOn)}</td>
                          <td style={{ fontSize: '13px' }}>
                            {stage ? (
                              <span style={{ fontWeight: stage.role === currentRole ? 600 : 400, color: stage.role === currentRole ? '#9d174d' : '#374151' }}>
                                {stage.role === currentRole ? 'You' : stage.role}
                              </span>
                            ) : '—'}
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
                            <div className="cert-actions" style={{ justifyContent: 'center' }}>
                              <button
                                className="cert-act cert-act--edit"
                                title={isMine(item) ? 'Review & act' : 'View'}
                                onClick={() => openRequest(item)}
                              >
                                <FaEye size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-5" style={{ color: '#6b7280' }}>
                        No loan requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="cert-table-footer">
                <div className="cert-table-info" style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} requests
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
    </div>
  );
};

// ============================================
// FIELD ERROR COMPONENT
// ============================================
const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

export default LoanApproval;