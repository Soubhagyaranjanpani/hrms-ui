// File: frontend/src/pages/SalaryStructure.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSearch, FaEdit, FaSave, FaTimes, FaArrowLeft,
  FaExclamationCircle, FaRupeeSign, FaUserPlus, FaCog,
  FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS, API_ENDPOINTS } from '../config/api.config';
import axios from 'axios';

/* ─── helpers ─────────────────────────────────────────── */
const cleanName = (n) => (n || '').replace(/\s+null\s*/gi, ' ').replace(/\s+null$/i, '').replace(/^null\s+/i, '').trim();
const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));

const avatarColors = [
  { bg: '#ede9fe', color: '#5b21b6' }, { bg: '#fff0e8', color: '#c2410c' },
  { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef3c7', color: '#92400e' },
  { bg: '#e0e7ff', color: '#3730a3' }, { bg: '#fce7f3', color: '#9d174d' },
];
const getAvatarColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];
const getInitials = (n) => {
  const p = cleanName(n).trim().split(/\s+/);
  return p.length === 1 ? p[0][0]?.toUpperCase() || '?' : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const FieldError = ({ msg }) =>
  msg ? <span className="field-err"><FaExclamationCircle size={10} /> {msg}</span> : null;

/* ─── validation ──────────────────────────────────────── */
const validateField = (field, value) => {
  const num = parseFloat(value);
  if (field === 'employeeId' && !value) return 'Select an employee';
  if (['basicSalary', 'ctc'].includes(field)) {
    if (value === '' || value === null) return 'Required';
    if (isNaN(num) || num < 0) return 'Enter a valid positive amount';
  }
  if (value !== '' && value !== null && !['employeeId', 'remarks', 'state'].includes(field)) {
    if (isNaN(parseFloat(value)) || parseFloat(value) < 0) return 'Must be a positive number';
  }
  return '';
};

const emptyForm = () => ({
  employeeId: '', ctc: '',
  basicSalary: '', dearnessAllowance: '', hra: '',
  travelAllow: '', medicalAllow: '', specialAllow: '',
  providentFund: '', employerPF: '', professionalTax: '', incomeTax: '',
  npsEmployee: '', npsEmployer: '', esiEmployee: '', esiEmployer: '',
  bonusAmount: '', leaveEncashment: '', gratuityAccrual: '', healthEduCess: '',
  state: '',
});

const EARNINGS = [
  { key: 'basicSalary', label: 'Basic Salary', required: true },
  { key: 'dearnessAllowance', label: 'Dearness Allowance (DA)' },
  { key: 'hra', label: 'HRA' },
  { key: 'travelAllow', label: 'Travel Allowance' },
  { key: 'medicalAllow', label: 'Medical Allowance' },
  { key: 'specialAllow', label: 'Special Allowance' },
  { key: 'bonusAmount', label: 'Bonus' },
  { key: 'leaveEncashment', label: 'Leave Encashment' },
];

const DEDUCTIONS = [
  { key: 'providentFund', label: 'PF (Employee)' },
  { key: 'employerPF', label: 'PF (Employer)' },
  { key: 'npsEmployee', label: 'NPS (Employee)' },
  { key: 'npsEmployer', label: 'NPS (Employer)' },
  { key: 'esiEmployee', label: 'ESI (Employee)' },
  { key: 'esiEmployer', label: 'ESI (Employer)' },
  { key: 'professionalTax', label: 'Professional Tax' },
  { key: 'incomeTax', label: 'Income Tax (TDS)' },
  { key: 'healthEduCess', label: 'Health & Edu Cess' },
  { key: 'gratuityAccrual', label: 'Gratuity Accrual' },
];

const PAGE_SIZE = 5;

/* ═══════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════ */
const SalaryStructure = ({ user }) => {

  const [view, setView] = useState('list');
  const [editMode, setEditMode] = useState(false);
  const [selectedStruct, setSelectedStruct] = useState(null);

  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Cascading filters
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filteredByGrade, setFilteredByGrade] = useState(false);

  const [salaryConfig, setSalaryConfig] = useState({});
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = { headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } };

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/payroll/structure/all`, axiosConfig);
      const arr = res.data?.response || res.data?.data || [];
      setStructures(Array.isArray(arr) ? arr : []);
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Failed to load');
      setStructures([]);
    } finally { setLoading(false); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [empRes, branchRes, deptRes, configRes, gradeRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/employees?page=0&size=500`, axiosConfig),
        axios.get(`${API_ENDPOINTS.GET_ACTIVE_BRANCHES}`, axiosConfig).catch(() => ({ data: {} })),
        axios.get(`${API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS}`, axiosConfig).catch(() => ({ data: {} })),
        axios.get(`${BASE_URL}/api/payroll/config`, axiosConfig).catch(() => ({ data: {} })),
        axios.get(`${BASE_URL}/api/grades`, axiosConfig).catch(() => ({ data: {} })),
      ]);
      const empArr = empRes.data?.response?.content || empRes.data?.data || [];
      setEmployees(Array.isArray(empArr) ? empArr : []);
      setFilteredEmployees(Array.isArray(empArr) ? empArr : []);
      setBranches(branchRes.data?.response || branchRes.data?.data || []);
      setDepartments(deptRes.data?.response || deptRes.data?.data || []);
      setSalaryConfig(configRes.data?.response || configRes.data?.data || {});
      setGrades(gradeRes.data?.response || gradeRes.data?.data || []);
    } catch {
      setBranches([]); setDepartments([]); setSalaryConfig({}); setGrades([]);
    }
  }, []);

  useEffect(() => { fetchStructures(); fetchData(); }, []);

  // Branch → Department cascade
  useEffect(() => {
    if (filterBranch) {
      const filtered = departments.filter(d =>
        (d.branchName === filterBranch) || (d.branch === filterBranch) || (String(d.branchId) === String(filterBranch))
      );
      setFilteredDepartments(filtered.length > 0 ? filtered : departments);
    } else {
      setFilteredDepartments(departments);
    }
    setFilterDepartment('');
  }, [filterBranch, departments]);

  // Grade + filters → Employee cascade
  useEffect(() => {
    if (filterGrade) {
      axios.get(`${BASE_URL}/api/employees/by-grade/${filterGrade}`, axiosConfig)
        .then(res => {
          let gradeEmps = res.data?.response || res.data?.data || [];
          if (filterBranch) gradeEmps = gradeEmps.filter(emp => emp.branchName === filterBranch || emp.branch === filterBranch || String(emp.branchId) === String(filterBranch));
          if (filterDepartment) gradeEmps = gradeEmps.filter(emp => emp.departmentName === filterDepartment || emp.department === filterDepartment || String(emp.departmentId) === String(filterDepartment));
          setFilteredEmployees(gradeEmps);
          setFilteredByGrade(true);
        })
        .catch(() => setFilteredEmployees([]));
    } else {
      let filtered = [...employees];
      if (filterBranch) filtered = filtered.filter(emp => emp.branchName === filterBranch || emp.branch === filterBranch || String(emp.branchId) === String(filterBranch));
      if (filterDepartment) filtered = filtered.filter(emp => emp.departmentName === filterDepartment || emp.department === filterDepartment || String(emp.departmentId) === String(filterDepartment));
      setFilteredEmployees(filtered);
      setFilteredByGrade(false);
    }
    setFormData(prev => ({ ...prev, employeeId: '' }));
  }, [filterGrade, filterBranch, filterDepartment, employees]);

  // Filter structures
  const filtered = structures.filter(s =>
    !search || (cleanName(s.employeeName) || '').toLowerCase().includes(search.toLowerCase())
    || (s.department || '').toLowerCase().includes(search.toLowerCase())
  );

  // Reset page on search
  useEffect(() => { setCurrentPage(1); }, [search]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedStructures = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Smart calculation from CTC
  const calculateFromCTC = (ctcValue) => {
    const ctc = parseFloat(ctcValue) || 0;
    if (ctc === 0) return;

    const cfg = salaryConfig;

    const basicPct = cfg.BASIC_PCT;
    const hraPct = cfg.HRA_PCT;
    const daPct = cfg.DA_PCT;
    const travelPct = cfg.TRAVEL_ALLOW_PCT;
    const medicalPct = cfg.MEDICAL_ALLOW_PCT;
    const pfPct = cfg.PF_EMPLOYEE_PCT;
    const pfEmprPct = cfg.PF_EMPLOYER_PCT;
    const npsEmpPct = cfg.NPS_EMPLOYEE_PCT;
    const npsEmprPct = cfg.NPS_EMPLOYER_PCT;
    const esiEmpPct = cfg.ESI_EMPLOYEE_PCT;
    const esiEmprPct = cfg.ESI_EMPLOYER_PCT;
    const bonusPct = cfg.BONUS_PCT;
    const gratuityPct = cfg.GRATUITY_PCT;
    const travelMin = cfg.TRAVEL_ALLOW_MIN;
    const medicalMin = cfg.MEDICAL_ALLOW_MIN;
    const ptMax = cfg.PROF_TAX_MAX;
    const stdDeduction = cfg.STANDARD_DEDUCTION;
    const cessPct = cfg.CESS_PCT;

    const monthlyCTC = ctc / 12;

    const monthlyBasic = basicPct ? (ctc * basicPct / 100) / 12 : monthlyCTC;
    const monthlyDA = daPct ? monthlyBasic * daPct / 100 : 0;
    const monthlyHRA = hraPct ? monthlyBasic * hraPct / 100 : 0;
    const monthlyTravel = travelPct ? Math.max(monthlyBasic * travelPct / 100, travelMin || 0) : (travelMin || 0);
    const monthlyMedical = medicalPct ? Math.max(monthlyBasic * medicalPct / 100, medicalMin || 0) : (medicalMin || 0);
    const monthlyPF = pfPct ? monthlyBasic * pfPct / 100 : 0;
    const monthlyPFEmpr = pfEmprPct ? monthlyBasic * pfEmprPct / 100 : 0;
    const monthlyNpsEmp = npsEmpPct ? (monthlyBasic + monthlyDA) * npsEmpPct / 100 : 0;
    const monthlyNpsEmpr = npsEmprPct ? (monthlyBasic + monthlyDA) * npsEmprPct / 100 : 0;
    const monthlyGratuity = gratuityPct ? monthlyBasic * gratuityPct / 100 : 0;
    const monthlyBonus = bonusPct ? monthlyBasic * bonusPct / 100 : 0;
    const monthlyESI_Emp = esiEmpPct ? monthlyBasic * esiEmpPct / 100 : 0;
    const monthlyESI_Empr = esiEmprPct ? monthlyBasic * esiEmprPct / 100 : 0;

    const sumEarnings = monthlyBasic + monthlyDA + monthlyHRA + monthlyTravel + monthlyMedical + monthlyBonus;
    const monthlySpecial = Math.max(0, monthlyCTC - sumEarnings);

    let monthlyTDS = 0;
    let monthlyCess = 0;
    if (stdDeduction) {
      const annualTaxable = Math.max(0, ctc - stdDeduction);
      let annualTax = 0;
      if (annualTaxable > 2400000) annualTax = (annualTaxable - 2400000) * 0.30 + 220000;
      else if (annualTaxable > 2000000) annualTax = (annualTaxable - 2000000) * 0.25 + 120000;
      else if (annualTaxable > 1600000) annualTax = (annualTaxable - 1600000) * 0.20 + 60000;
      else if (annualTaxable > 1200000) annualTax = (annualTaxable - 1200000) * 0.15 + 20000;
      else if (annualTaxable > 800000) annualTax = (annualTaxable - 800000) * 0.10;
      else if (annualTaxable > 400000) annualTax = (annualTaxable - 400000) * 0.05;
      monthlyTDS = annualTax / 12;
      monthlyCess = cessPct ? (annualTax * cessPct / 100) / 12 : 0;
    }

    setFormData(prev => ({
      ...prev,
      ctc: ctcValue,
      basicSalary: Math.round(monthlyBasic).toString(),
      dearnessAllowance: Math.round(monthlyDA).toString(),
      hra: Math.round(monthlyHRA).toString(),
      travelAllow: Math.round(monthlyTravel).toString(),
      medicalAllow: Math.round(monthlyMedical).toString(),
      specialAllow: Math.round(monthlySpecial).toString(),
      bonusAmount: Math.round(monthlyBonus).toString(),
      providentFund: Math.round(monthlyPF).toString(),
      employerPF: Math.round(monthlyPFEmpr).toString(),
      npsEmployee: Math.round(monthlyNpsEmp).toString(),
      npsEmployer: Math.round(monthlyNpsEmpr).toString(),
      esiEmployee: Math.round(monthlyESI_Emp).toString(),
      esiEmployer: Math.round(monthlyESI_Empr).toString(),
      professionalTax: ptMax ? Math.round(ptMax).toString() : '0',
      incomeTax: Math.round(monthlyTDS).toString(),
      healthEduCess: Math.round(monthlyCess).toString(),
      gratuityAccrual: Math.round(monthlyGratuity).toString(),
    }));
  };

  const handleChange = (field, value) => {
    if (field === 'ctc') { calculateFromCTC(value); return; }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  const handleEdit = (struct) => {
    setSelectedStruct(struct);
    setFormData({
      employeeId: String(struct.employeeId || ''),
      ctc: String(struct.ctc || ''),
      basicSalary: String(struct.basicSalary || ''),
      dearnessAllowance: String(struct.dearnessAllowance || ''),
      hra: String(struct.hra || ''),
      travelAllow: String(struct.travelAllow || ''),
      medicalAllow: String(struct.medicalAllow || ''),
      specialAllow: String(struct.specialAllow || ''),
      providentFund: String(struct.providentFund || ''),
      employerPF: String(struct.employerPF || ''),
      npsEmployee: String(struct.npsEmployee || ''),
      npsEmployer: String(struct.npsEmployer || ''),
      esiEmployee: String(struct.esiEmployee || ''),
      esiEmployer: String(struct.esiEmployer || ''),
      professionalTax: String(struct.professionalTax || ''),
      incomeTax: String(struct.incomeTax || ''),
      bonusAmount: String(struct.bonusAmount || ''),
      leaveEncashment: String(struct.leaveEncashment || ''),
      gratuityAccrual: String(struct.gratuityAccrual || ''),
      healthEduCess: String(struct.healthEduCess || ''),
      state: struct.state || '',
    });
    setErrors({}); setTouched({});
    setEditMode(true); setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allFields = ['employeeId', 'basicSalary', 'ctc', ...EARNINGS.map(f => f.key), ...DEDUCTIONS.map(f => f.key)];
    setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
    const errs = {};
    allFields.forEach(f => { const e = validateField(f, formData[f]); if (e) errs[f] = e; });
    setErrors(errs);
    if (Object.keys(errs).length > 0) { toast.warning('Validation Error', 'Please fix highlighted fields'); return; }

    const payload = {
      employeeId: parseInt(formData.employeeId),
      ctc: parseFloat(formData.ctc) || 0,
      basicSalary: parseFloat(formData.basicSalary) || 0,
      dearnessAllowance: parseFloat(formData.dearnessAllowance) || 0,
      hra: parseFloat(formData.hra) || 0,
      travelAllow: parseFloat(formData.travelAllow) || 0,
      medicalAllow: parseFloat(formData.medicalAllow) || 0,
      specialAllow: parseFloat(formData.specialAllow) || 0,
      providentFund: parseFloat(formData.providentFund) || 0,
      employerPF: parseFloat(formData.employerPF) || 0,
      npsEmployee: parseFloat(formData.npsEmployee) || 0,
      npsEmployer: parseFloat(formData.npsEmployer) || 0,
      esiEmployee: parseFloat(formData.esiEmployee) || 0,
      esiEmployer: parseFloat(formData.esiEmployer) || 0,
      professionalTax: parseFloat(formData.professionalTax) || 0,
      incomeTax: parseFloat(formData.incomeTax) || 0,
      bonusAmount: parseFloat(formData.bonusAmount) || 0,
      leaveEncashment: parseFloat(formData.leaveEncashment) || 0,
      gratuityAccrual: parseFloat(formData.gratuityAccrual) || 0,
      healthEduCess: parseFloat(formData.healthEduCess) || 0,
      state: formData.state || '',
    };

    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/payroll/structure`, payload, axiosConfig);
      if (res.data?.status === 200 || res.status === 200) {
        toast.success('Saved', editMode ? 'Salary structure updated' : 'Salary structure created');
        resetForm(); setView('list'); fetchStructures();
      } else { toast.error('Error', res.data?.message || 'Failed to save'); }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Something went wrong');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setFormData(emptyForm()); setErrors({}); setTouched({});
    setEditMode(false); setSelectedStruct(null);
    setFilterGrade(''); setFilterBranch(''); setFilterDepartment('');
    setFilteredByGrade(false); setShowConfigPanel(false);
  };

  const handleConfigUpdate = async (key, value) => {
    try {
      await axios.put(`${BASE_URL}/api/payroll/config/key/${key}`, { configValue: parseFloat(value) }, axiosConfig);
      setSalaryConfig(prev => ({ ...prev, [key]: parseFloat(value) }));
      toast.success('Updated', `${key} updated`);
      if (formData.ctc) calculateFromCTC(formData.ctc);
    } catch (err) {
      toast.error('Error', 'Failed to update configuration');
    }
  };

  const earningsFields = EARNINGS.map(f => f.key);
  const deductionsFields = DEDUCTIONS.map(f => f.key);
  const liveGross = earningsFields.reduce((a, k) => a + (parseFloat(formData[k]) || 0), 0);
  const liveDeduct = deductionsFields.reduce((a, k) => a + (parseFloat(formData[k]) || 0), 0);
  const liveNet = liveGross - liveDeduct;

  const isFieldOk = (f) => touched[f] && !errors[f] && formData[f] !== '';
  const isFieldErr = (f) => touched[f] && !!errors[f];

  if (loading && view === 'list' && structures.length === 0)
    return <LoadingSpinner message="Loading salary structures…" />;

  return (
    <div className="emp-root">
      {/* Header */}
      <div className="emp-header" style={view === 'form' ? { justifyContent: 'space-between' } : {}}>
        {view === 'form' ? (
          <>
            <div>
              <h1 className="emp-title">{editMode ? 'Edit Salary Structure' : 'Add Salary Structure'}</h1>
              <p className="emp-subtitle">
                {editMode && selectedStruct ? `${cleanName(selectedStruct.employeeName)} — update salary components` : 'Set up salary components for an employee'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="emp-back-btn" onClick={() => setShowConfigPanel(!showConfigPanel)} style={{ background: showConfigPanel ? '#ede9fe' : 'var(--bg-surface)' }}>
                <FaCog size={12} /> {showConfigPanel ? 'Hide Config' : 'Config'}
              </button>
              <button className="emp-back-btn" onClick={() => { setView('list'); resetForm(); }}>
                <FaArrowLeft size={12} /> Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="emp-header-left">
              <div>
                <h1 className="emp-title">Salary Structures</h1>
                <p className="emp-subtitle">{structures.length} employees configured</p>
              </div>
            </div>
            <button className="emp-add-btn" onClick={() => { resetForm(); setView('form'); }}>
              <FaUserPlus size={13} /> Add Structure
            </button>
          </>
        )}
      </div>

      {/* ════ LIST VIEW ════ */}
      {view === 'list' && (
        <>
          <div className="emp-search-bar">
            <div className="emp-search-wrap">
              <FaSearch className="emp-search-icon" size={12} />
              <input className="emp-search-input" type="text" placeholder="Search employee or department…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="emp-search-clear" onClick={() => setSearch('')}><FaTimes size={11} /></button>}
            </div>
          </div>

          <div className="emp-table-card">
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Basic</th>
                    <th>Gross (Monthly)</th>
                    <th>Deductions</th>
                    <th>Net (Monthly)</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStructures.length > 0 ? paginatedStructures.map((s, idx) => {
                    const name = cleanName(s.employeeName);
                    const ac = getAvatarColor(name);
                    const gross = (s.basicSalary || 0) + (s.dearnessAllowance || 0) + (s.hra || 0) + (s.travelAllow || 0) + (s.medicalAllow || 0) + (s.specialAllow || 0) + (s.bonusAmount || 0);
                    const deducts = (s.providentFund || 0) + (s.npsEmployee || 0) + (s.esiEmployee || 0) + (s.professionalTax || 0) + (s.incomeTax || 0) + (s.healthEduCess || 0);
                    return (
                      <tr key={s.id || idx} className="emp-row">
                        <td className="emp-sno">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>
                          <div className="emp-info-cell">
                            <div className="emp-avatar" style={{ background: ac.bg, color: ac.color }}>{getInitials(name)}</div>
                            <div>
                              <div className="emp-name">{name || '—'}</div>
                              <div className="emp-email">{s.employeeCode || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td>{s.department ? <span className="emp-pill emp-pill--indigo">{s.department}</span> : <span className="emp-dash">—</span>}</td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>₹{fmt(s.basicSalary)}</td>
                        <td style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>₹{fmt(gross)}</td>
                        <td style={{ fontSize: 13, color: '#dc2626' }}>-₹{fmt(deducts)}</td>
                        <td style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-indigo)', fontFamily: "'Sora',sans-serif" }}>₹{fmt(gross - deducts)}</td>
                        <td>
                          <div className="emp-actions">
                            <button className="emp-act emp-act--edit" onClick={() => handleEdit(s)} title="Edit structure"><FaEdit size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="8" className="emp-empty">
                        <div className="emp-empty-inner">
                          <span className="emp-empty-icon"><FaRupeeSign /></span>
                          <p>No salary structures found</p>
                          <small>Click "Add Structure" to set up an employee's salary</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '6px 12px', border: '1px solid var(--border-medium)', borderRadius: 8, background: 'var(--bg-white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
                <FaChevronLeft size={11} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)}
                  style={{ padding: '6px 12px', border: '1px solid var(--border-medium)', borderRadius: 8, background: currentPage === i + 1 ? 'var(--accent-indigo)' : 'var(--bg-white)', color: currentPage === i + 1 ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontWeight: currentPage === i + 1 ? 700 : 400 }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', border: '1px solid var(--border-medium)', borderRadius: 8, background: 'var(--bg-white)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                <FaChevronRight size={11} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ════ FORM VIEW ════ */}
      {view === 'form' && (
        <div className="emp-form-wrap">
          {showConfigPanel && (
            <div style={{ background: '#f5f3ff', borderRadius: 16, padding: 20, marginBottom: 20, border: '1.5px solid #c4b5fd' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCog /> Configuration Settings
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {Object.entries(salaryConfig).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 11, flex: 1, color: '#6b7280', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ').toLowerCase()}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={e => handleConfigUpdate(key, e.target.value)}
                      style={{ width: 90, padding: '6px 8px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, textAlign: 'right' }}
                    />
                    <span style={{ fontSize: 10, color: '#9ca3af', width: 20 }}>
                      {key.includes('PCT') || key.includes('PERCENTAGE') ? '%' : key.includes('FIXED') || key.includes('MIN') || key.includes('MAX') ? '₹' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {!editMode && (
              <>
                <div className="emp-form-section">
                  <div className="emp-section-label">Select Employee</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                    <div className="emp-field">
                      <label>Grade</label>
                      <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterBranch(''); setFilterDepartment(''); }}>
                        <option value="">All Grades</option>
                        {grades.map(g => (
                          <option key={g.id} value={g.id}>{g.code} - {g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="emp-field">
                      <label>Branch</label>
                      <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                        <option value="">All Branches</option>
                        {branches.map((b, i) => <option key={i} value={b.name || b}>{b.name || b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                    <div className="emp-field">
                      <label>Department</label>
                      <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
                        <option value="">All Departments</option>
                        {filteredDepartments.map((d, i) => <option key={i} value={d.name || d}>{d.name || d}</option>)}
                      </select>
                    </div>
                    <div className={`emp-field ${isFieldErr('employeeId') ? 'has-error' : ''}`}>
                      <label>Employee <span className="req">*</span></label>
                      <select value={formData.employeeId} onChange={e => handleChange('employeeId', e.target.value)} onBlur={() => handleBlur('employeeId')}>
                        <option value="">{filteredEmployees.length > 0 ? `Select (${filteredEmployees.length} available)` : 'No employees'}</option>
                        {filteredEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {cleanName(emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`)} — {emp.departmentName || ''}
                          </option>
                        ))}
                      </select>
                      <FieldError msg={errors.employeeId} />
                    </div>
                  </div>
                </div>
                <div className="emp-divider" />
              </>
            )}

            <div className="emp-form-section">
              <div className="emp-section-label" style={{ color: '#7c3aed' }}>CTC Details</div>
              <div className="emp-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className={`emp-field ${isFieldErr('ctc') ? 'has-error' : ''}`}>
                  <label>Annual CTC (₹) <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                    <input type="number" placeholder="e.g., 600000" value={formData.ctc} onChange={e => handleChange('ctc', e.target.value)} style={{ paddingLeft: 22, fontSize: 16, fontWeight: 600 }} />
                  </div>
                </div>
                <div className="emp-field" style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Monthly CTC</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed', fontFamily: "'Sora',sans-serif" }}>₹{fmt(parseFloat(formData.ctc || 0) / 12)}</div>
                </div>
              </div>
            </div>

            <div className="emp-divider" />

            <div className="emp-form-section">
              <div className="emp-section-label" style={{ color: '#059669' }}>💰 Earnings (Monthly)</div>
              <div className="emp-form-grid">
                {EARNINGS.map(({ key, label, required }) => (
                  <div key={key} className={`emp-field ${isFieldErr(key) ? 'has-error' : ''} ${isFieldOk(key) ? 'has-ok' : ''}`}>
                    <label>{label} {required && <span className="req">*</span>}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                      <input type="number" min="0" placeholder="0" value={formData[key]} onChange={e => handleChange(key, e.target.value)} onBlur={() => handleBlur(key)} style={{ paddingLeft: 22 }} />
                    </div>
                    <FieldError msg={errors[key]} />
                  </div>
                ))}
              </div>
            </div>

            <div className="emp-divider" />

            <div className="emp-form-section">
              <div className="emp-section-label" style={{ color: '#dc2626' }}>📉 Deductions & Contributions (Monthly)</div>
              <div className="emp-form-grid">
                {DEDUCTIONS.map(({ key, label }) => (
                  <div key={key} className="emp-field">
                    <label>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                      <input type="number" min="0" placeholder="0" value={formData[key]} onChange={e => handleChange(key, e.target.value)} style={{ paddingLeft: 22 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, margin: '0 0 20px', background: 'var(--bg-surface)', borderRadius: 14, padding: '16px 20px', border: '1px solid var(--border-light)' }}>
              {[
                { label: 'Gross / Month', value: liveGross, color: '#059669' },
                { label: 'Deductions', value: liveDeduct, color: '#dc2626' },
                { label: 'Net / Month', value: liveNet, color: 'var(--accent-indigo)' },
                { label: 'Annual CTC', value: parseFloat(formData.ctc) || 0, color: '#7c3aed' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Sora',sans-serif" }}>₹{fmt(value)}</div>
                </div>
              ))}
            </div>

            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>Cancel</button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting ? <><span className="emp-spinner" /> Saving…</> : <><FaSave size={12} /> {editMode ? 'Update Structure' : 'Save Structure'}</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalaryStructure;