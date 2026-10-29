import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaSave, FaTimes, FaPlus, FaSearch, FaEdit,
  FaArrowLeft, FaExclamationCircle, FaChevronDown,
  FaMoneyBillWave, FaCalendarAlt, FaUser, FaPercent
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

// ============================================
// STATIC MOCK DATA
// ============================================
const STATIC_LOANS = [
  {
    id: 1,
    loanRef: 'LN-0087',
    empId: 'EMP-1042',
    empName: 'Rahul Sharma',
    department: 'Engineering',
    grade: 'M2',
    netSalary: 85000,
    loanType: 'Salary Advance',
    amount: 50000,
    tenure: 5,
    emi: 10000,
    purpose: 'Medical emergency at home',
    requestedDisburse: '2025-11-01',
    preferredRecovery: 'Payroll Deduction',
    attachment: 'medical_bill.pdf',
    disbursedOn: '2025-11-01',
    balance: 30000,
    paidEmis: 2,
    status: 'Active'
  },
  {
    id: 2,
    loanRef: 'LN-0091',
    empId: 'EMP-1042',
    empName: 'Rahul Sharma',
    department: 'Engineering',
    grade: 'M2',
    netSalary: 85000,
    loanType: 'Personal Loan',
    amount: 20000,
    tenure: 4,
    emi: 5000,
    purpose: 'Home repair',
    requestedDisburse: '2025-10-25',
    preferredRecovery: 'Payroll Deduction',
    attachment: 'quotation.pdf',
    disbursedOn: null,
    balance: 0,
    paidEmis: 0,
    status: 'Pending Approval'
  },
  {
    id: 3,
    loanRef: 'LN-0062',
    empId: 'EMP-1042',
    empName: 'Rahul Sharma',
    department: 'Engineering',
    grade: 'M2',
    netSalary: 85000,
    loanType: 'Emergency Loan',
    amount: 15000,
    tenure: 3,
    emi: 5000,
    purpose: 'Travel emergency',
    requestedDisburse: '2025-09-10',
    preferredRecovery: 'Payroll Deduction',
    attachment: 'travel_receipt.pdf',
    disbursedOn: null,
    balance: 0,
    paidEmis: 0,
    status: 'Rejected'
  },
  {
    id: 4,
    loanRef: 'LN-0075',
    empId: 'EMP-2011',
    empName: 'Priya Verma',
    department: 'Finance',
    grade: 'M1',
    netSalary: 62000,
    loanType: 'Salary Advance',
    amount: 25000,
    tenure: 5,
    emi: 5000,
    purpose: 'Family function',
    requestedDisburse: '2025-08-01',
    preferredRecovery: 'Payroll Deduction',
    attachment: 'family_event.jpg',
    disbursedOn: '2025-08-01',
    balance: 0,
    paidEmis: 5,
    status: 'Closed'
  },
  {
    id: 5,
    loanRef: 'LN-0095',
    empId: 'EMP-3045',
    empName: 'Amit Singh',
    department: 'Sales',
    grade: 'M1',
    netSalary: 55000,
    loanType: 'Personal Loan',
    amount: 30000,
    tenure: 6,
    emi: 5000,
    purpose: 'Education fees',
    requestedDisburse: '2025-11-15',
    preferredRecovery: 'Payroll Deduction',
    attachment: 'fees_receipt.pdf',
    disbursedOn: null,
    balance: 0,
    paidEmis: 0,
    status: 'Draft'
  }
];

const LOAN_TYPES = ['Salary Advance', 'Personal Loan', 'Emergency Loan'];
const RECOVERY_MODES = ['Payroll Deduction', 'Bank Transfer'];

// ============================================
// COMPONENT
// ============================================
const LoanMaster = () => {
  // ============================================
  // STATE
  // ============================================
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState({
    id: null,
    name: '',
    newStatus: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    loanRef: '',
    empId: '',
    empName: '',
    department: '',
    grade: '',
    netSalary: 0,
    loanType: '',
    amount: '',
    tenure: '',
    purpose: '',
    requestedDisburse: '',
    preferredRecovery: 'Payroll Deduction',
    attachment: '',
    status: 'Draft'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ============================================
  // SIMULATE FETCH (Static Data)
  // ============================================
  const fetchLoans = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoans([...STATIC_LOANS]);
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // ============================================
  // DEBOUNCED SEARCH
  // ============================================
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ============================================
  // FILTERED + PAGINATED
  // ============================================
  const filteredLoans = loans
    .filter((item) => {
      const search = debouncedSearch.toLowerCase();
      return (
        item.loanRef?.toLowerCase().includes(search) ||
        item.empId?.toLowerCase().includes(search) ||
        item.empName?.toLowerCase().includes(search) ||
        item.department?.toLowerCase().includes(search) ||
        item.loanType?.toLowerCase().includes(search) ||
        item.status?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      if (a.status === 'Active' && b.status !== 'Active') return -1;
      if (a.status !== 'Active' && b.status === 'Active') return 1;
      return 0;
    });

  const totalItems = filteredLoans.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentLoans = filteredLoans.slice(startIndex, startIndex + rowsPerPage);

  // ============================================
  // UTILITIES
  // ============================================
  const generateLoanRef = () =>
    `LN-${String(loans.length + 100).padStart(4, '0')}`;

  const calculateEmi = (amount, tenure) => {
    const a = Number(amount) || 0;
    const t = Number(tenure) || 0;
    if (t <= 0) return 0;
    return Math.round(a / t);
  };

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

  // ============================================
  // FORM HANDLERS
  // ============================================
  const resetForm = () => {
    setFormData({
      loanRef: generateLoanRef(),
      empId: '',
      empName: '',
      department: '',
      grade: '',
      netSalary: 0,
      loanType: '',
      amount: '',
      tenure: '',
      purpose: '',
      requestedDisburse: '',
      preferredRecovery: 'Payroll Deduction',
      attachment: '',
      status: 'Draft'
    });
    setErrors({});
    setTouched({});
    setEditingLoan(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) validateField(field, value);
  };

  const validateField = (field, value) => {
    let error = '';

    if (field === 'loanType' && !value) {
      error = 'Loan Type is required';
    } else if (field === 'amount') {
      if (!value) error = 'Loan Amount is required';
      else if (Number(value) <= 0) error = 'Amount must be greater than zero';
      else if (Number(value) > formData.netSalary * 0.5)
        error = 'Amount exceeds 50% of net salary limit';
    } else if (field === 'tenure') {
      if (!value) error = 'Tenure is required';
      else if (Number(value) < 1 || Number(value) > 12)
        error = 'Tenure must be between 1 and 12 months';
    } else if (field === 'purpose' && !value) {
      error = 'Purpose is required';
    } else if (field === 'requestedDisburse' && !value) {
      error = 'Requested disbursement date is required';
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateForm = () => {
    const fieldsToValidate = [
      'loanType', 'amount', 'tenure', 'purpose', 'requestedDisburse'
    ];
    const newErrors = {};

    for (const field of fieldsToValidate) {
      if (!formData[field]) newErrors[field] = 'This field is required';
    }

    if (formData.amount && Number(formData.amount) > formData.netSalary * 0.5) {
      newErrors.amount = 'Amount exceeds 50% of net salary limit';
    }

    if (formData.tenure && (Number(formData.tenure) < 1 || Number(formData.tenure) > 12)) {
      newErrors.tenure = 'Tenure must be between 1 and 12 months';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // SUBMIT (Static simulation)
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.warning('Validation Error', 'Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const emi = calculateEmi(formData.amount, formData.tenure);
      const newLoan = {
        id: editingLoan ? editingLoan.id : Date.now(),
        loanRef: formData.loanRef,
        empId: formData.empId || 'EMP-1042',
        empName: formData.empName || 'Rahul Sharma',
        department: formData.department || 'Engineering',
        grade: formData.grade || 'M2',
        netSalary: formData.netSalary || 85000,
        loanType: formData.loanType,
        amount: Number(formData.amount),
        tenure: Number(formData.tenure),
        emi,
        purpose: formData.purpose,
        requestedDisburse: formData.requestedDisburse,
        preferredRecovery: formData.preferredRecovery,
        attachment: formData.attachment || '—',
        disbursedOn: null,
        balance: 0,
        paidEmis: 0,
        status: 'Pending Approval'
      };

      if (editingLoan) {
        setLoans((prev) =>
          prev.map((l) => (l.id === editingLoan.id ? { ...l, ...newLoan } : l))
        );
        toast.success('Success', 'Loan application updated successfully');
      } else {
        setLoans((prev) => [newLoan, ...prev]);
        toast.success('Success', 'Loan application submitted successfully');
      }

      resetForm();
      setShowForm(false);
      setPage(0);
      setSubmitting(false);
    }, 500);
  };

  const handleEdit = (item) => {
    if (item.status === 'Closed' || item.status === 'Rejected') {
      toast.warning('Cannot Edit', `${item.status} loans cannot be edited`);
      return;
    }
    setEditingLoan(item);
    setFormData({
      loanRef: item.loanRef,
      empId: item.empId,
      empName: item.empName,
      department: item.department,
      grade: item.grade,
      netSalary: item.netSalary,
      loanType: item.loanType,
      amount: item.amount,
      tenure: item.tenure,
      purpose: item.purpose,
      requestedDisburse: item.requestedDisburse,
      preferredRecovery: item.preferredRecovery,
      attachment: item.attachment,
      status: item.status
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    resetForm();
    // auto-fill employee details (static simulation)
    setFormData((prev) => ({
      ...prev,
      loanRef: generateLoanRef(),
      empId: 'EMP-1042',
      empName: 'Rahul Sharma',
      department: 'Engineering',
      grade: 'M2',
      netSalary: 85000
    }));
    setShowForm(true);
  };

  const handleBackToList = () => {
    resetForm();
    setShowForm(false);
  };

  // ============================================
  // STATUS TOGGLE
  // ============================================
  const handleStatusToggle = (id, name, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
    setStatusAction({ id, name, newStatus });
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    const { id, newStatus, name } = statusAction;
    setLoans((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    toast.success('Status Updated', `${name} is now ${newStatus}`);
    setShowStatusModal(false);
    setStatusAction({ id: null, name: '', newStatus: '' });
  };

  // ============================================
  // STATUS CHIP COLOR
  // ============================================
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

  // ============================================
  // RENDER GUARD
  // ============================================
  if (loading && !showForm && loans.length === 0) {
    return <LoadingSpinner message="Loading loans..." />;
  }

  const emiPreview = calculateEmi(formData.amount, formData.tenure);

  return (
    <div className="cert-root">
      {/* HEADER */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Loans & Advances</h1>
          <p className="cert-subtitle">Manage employee loan applications and repayment schedules</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!showForm && (
            <button className="cert-add-btn" onClick={handleAddNew}>
              <FaPlus size={13} /> New Loan Application
            </button>
          )}
          {showForm && (
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
                <div className="cert-field-compact">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.empId}
                    readOnly
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                </div>
                <div className="cert-field-compact">
                  <label>Name</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.empName}
                    readOnly
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                </div>
                <div className="cert-field-compact">
                  <label>Department</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.department}
                    readOnly
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                </div>
                <div className="cert-field-compact">
                  <label>Grade</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.grade}
                    readOnly
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                </div>
                <div className="cert-field-compact">
                  <label>Net Salary (Monthly)</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={`₹ ${formData.netSalary.toLocaleString()}`}
                    readOnly
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6' }}
                  />
                </div>
                <div className="cert-field-compact">
                  <label>Loan Ref No.</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.loanRef}
                    readOnly
                    style={{ fontSize: '14px', padding: '6px 12px', background: '#f3f4f6', fontFamily: 'monospace' }}
                  />
                </div>
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
                  <FieldError msg={errors.loanType} />
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
                  <FieldError msg={errors.amount} />
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
                  <FieldError msg={errors.tenure} />
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
                  <FieldError msg={errors.requestedDisburse} />
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
                  <FieldError msg={errors.purpose} />
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
              <button type="button" className="cert-cancel-btn" onClick={handleBackToList}>
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
                  <><FaSave size={12} /> {editingLoan ? 'Update' : 'Submit Application'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= TABLE ================= */
        <>
          {/* Search Bar */}
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

          {/* Table */}
          <div className="cert-table-card">
            <div className="cert-table-wrap">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Ref No.</th>
                    <th>Employee</th>
                    <th>Loan Type</th>
                    <th>Amount (₹)</th>
                    <th>EMI (₹)</th>
                    <th>Tenure</th>
                    <th>Balance (₹)</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLoans.length > 0 ? (
                    currentLoans.map((item, idx) => {
                      const sc = getStatusColor(item.status);
                      return (
                        <tr key={item.id} className="cert-table-row-hover">
                          <td className="text-center">{startIndex + idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '500', fontSize: '13px' }}>
                              {item.loanRef}
                            </span>
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
                            <span style={{
                              background: '#e0e7ff',
                              color: '#4f46e5',
                              fontSize: '12px',
                              padding: '2px 10px',
                              borderRadius: '12px'
                            }}>
                              {item.loanType}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>
                              ₹ {item.amount.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            ₹ {item.emi.toLocaleString()}
                          </td>
                          <td>{item.tenure} mo</td>
                          <td>
                            <span style={{ fontWeight: item.balance > 0 ? 600 : 400, color: item.balance > 0 ? '#b45309' : '#6b7280' }}>
                              ₹ {item.balance.toLocaleString()}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className="cert-status-badge"
                              style={{
                                background: sc.bg,
                                color: sc.color,
                                fontSize: '11px',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontWeight: 500
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <div className="cert-actions" style={{ justifyContent: 'center' }}>
                              <button
                                className="cert-act cert-act--edit"
                                onClick={() => handleEdit(item)}
                                title={
                                  item.status === 'Closed' || item.status === 'Rejected'
                                    ? 'Cannot edit closed/rejected loan'
                                    : 'Edit'
                                }
                                disabled={item.status === 'Closed' || item.status === 'Rejected'}
                                style={{
                                  opacity: (item.status === 'Closed' || item.status === 'Rejected') ? 0.5 : 1,
                                  cursor: (item.status === 'Closed' || item.status === 'Rejected') ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <FaEdit size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-5" style={{ color: '#6b7280' }}>
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
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
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
                          padding: '6px 10px',
                          border: '1px solid #e5e7eb',
                          background: pg === page ? '#9d174d' : 'white',
                          color: pg === page ? 'white' : '#374151',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          minWidth: '34px'
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
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* STATUS CHANGE MODAL */}
      {showStatusModal && (
        <div className="emp-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-icon">
              {statusAction.newStatus === 'Active' ? '✅' : '⛔'}
            </div>
            <h3 className="emp-modal-title">Confirm Status Change</h3>
            <p className="emp-modal-body">
              Are you sure you want to{' '}
              <strong>{statusAction.newStatus === 'Active' ? 'activate' : 'close'}</strong>{' '}
              <strong>{statusAction.name}</strong>?
            </p>
            <p className="emp-modal-warn">
              {statusAction.newStatus === 'Closed'
                ? 'Closed loans cannot be reopened. Outstanding balance must be settled.'
                : 'This loan will become active and EMI deductions will begin.'}
            </p>
            <div className="emp-modal-actions">
              <button className="emp-modal-cancel" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="emp-modal-confirm" onClick={confirmStatusChange}>
                Confirm
              </button>
            </div>
          </div>
        </div>
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

export default LoanMaster;