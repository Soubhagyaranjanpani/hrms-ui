import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaStar, FaArrowLeft, FaSave, FaUser, FaChartLine, FaTasks, 
  FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaInfoCircle, FaCalendarAlt, FaExclamationCircle
} from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const extractArray = (data) => {
  if (data?.response && Array.isArray(data.response)) return data.response;
  if (data?.response?.content && Array.isArray(data.response.content)) return data.response.content;
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.data?.content && Array.isArray(data.data.content)) return data.data.content;
  if (data?.content && Array.isArray(data.content)) return data.content;
  return [];
};

const cleanEmployeeName = (name) => {
  if (!name) return '';
  return name.replace(/\s+null\s*/gi, '').trim();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildReviewCycle = (from, to) => {
  if (!from || !to) return '';
  return `${formatDateLabel(from)} - ${formatDateLabel(to)}`;
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

// ── Interactive Star Rating (centered) ──
const StarRating = ({ rating, onRatingChange, size = 32, editable = true }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating || 0);

  const handleMouseMove = (e, index) => {
    if (!editable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starValue = index + (x / rect.width > 0.5 ? 1 : 0.5);
    setHoverRating(starValue);
  };

  const handleClick = (e, index) => {
    if (!editable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starValue = index + (x / rect.width > 0.5 ? 1 : 0.5);
    setSelectedRating(starValue);
    onRatingChange(starValue);
  };

  const displayRating = hoverRating || selectedRating;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fillPercent = Math.max(0, Math.min(1, displayRating - index)) * 100;
          return (
            <div
              key={index}
              style={{ position: 'relative', display: 'inline-block', cursor: editable ? 'pointer' : 'default' }}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={(e) => handleClick(e, index)}
            >
              <div style={{ color: '#d1d5db' }}><FaStar size={size} /></div>
              <div style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', width: `${fillPercent}%`, color: '#fbbf24' }}>
                <FaStar size={size} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{displayRating.toFixed(1)}</span>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 5.0</span>
      </div>
    </div>
  );
};

const StartPerformanceReview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeStats, setEmployeeStats] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    employeeId: '',
    rating: 0,
    totalGoals: '',
    achievedGoals: '',
    improvementPercent: '',
    fromDate: '',
    toDate: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=100`, { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setEmployees(extractArray(data).map(emp => ({ ...emp, name: cleanEmployeeName(emp.name) })));
        }
      } catch (err) {
        toast.error('Error', 'Failed to load employees');
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch employee stats
  const fetchEmployeeStats = async (employeeId) => {
    if (!employeeId) return;
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.GET_EMPLOYEE_STATISTICS}/${employeeId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const stats = data.response || data.data || data;
        if (stats.employeeName) stats.employeeName = cleanEmployeeName(stats.employeeName);
        setEmployeeStats(stats);

        const totalTasks = stats.totalAssigned || 0;
        const completedTasks = stats.completed || 0;
        const inProgressTasks = stats.inProgress || 0;
        const achievedGoals = completedTasks + Math.floor(inProgressTasks * 0.5);
        const improvementPercent = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

        setFormData(prev => ({
          ...prev,
          totalGoals: totalTasks.toString(),
          achievedGoals: achievedGoals.toString(),
          improvementPercent,
        }));
        setSelectedEmployee(employees.find(emp => emp.id === parseInt(employeeId)) || null);
      } else {
        setEmployeeStats(null);
        setSelectedEmployee(null);
      }
    } catch {
      setEmployeeStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handlers
  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setFormData(prev => ({ ...prev, employeeId, rating: 0, totalGoals: '', achievedGoals: '', improvementPercent: '' }));
    setEmployeeStats(null);
    setSelectedEmployee(null);
    if (employeeId) fetchEmployeeStats(employeeId);
    if (errors.employeeId) setErrors(prev => ({ ...prev, employeeId: '' }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) setErrors(prev => ({ ...prev, rating: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if ((name === 'totalGoals' || name === 'achievedGoals') && newFormData.totalGoals && newFormData.achievedGoals) {
      const total = parseFloat(newFormData.totalGoals) || 0;
      const achieved = parseFloat(newFormData.achievedGoals) || 0;
      if (total > 0) newFormData.improvementPercent = ((achieved / total) * 100).toFixed(1);
    }

    if (name === 'fromDate' && newFormData.toDate && value > newFormData.toDate) {
      newFormData.toDate = '';
    }

    setFormData(newFormData);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    switch (field) {
      case 'employeeId':   if (!value) error = 'Please select an employee'; break;
      case 'rating':       if (!value || value < 0.5) error = 'Please provide a rating'; break;
      case 'totalGoals':   if (!value) error = 'Total goals is required'; else if (parseInt(value) < 1) error = 'Must be at least 1'; break;
      case 'achievedGoals':
        if (value === '') error = 'Achieved goals is required';
        else if (parseInt(value) < 0) error = 'Cannot be negative';
        else if (formData.totalGoals && parseInt(value) > parseInt(formData.totalGoals)) error = 'Cannot exceed total goals';
        break;
      case 'fromDate':     if (!value) error = 'Start date is required'; break;
      case 'toDate':
        if (!value) error = 'End date is required';
        else if (formData.fromDate && value <= formData.fromDate) error = 'End date must be after start date';
        break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const validateForm = () => {
    const fields = ['employeeId', 'rating', 'totalGoals', 'achievedGoals', 'fromDate', 'toDate'];
    const newErrors = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return Object.keys(newErrors).length === 0;
  };

  const getStatusFromRating = (rating) => {
    if (!rating) return 'Not Rated';
    if (rating >= 4.8) return 'Outstanding';
    if (rating >= 4.4) return 'Excellent';
    if (rating >= 4.0) return 'Great';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.0) return 'Needs Improvement';
    return 'Poor';
  };

  const getStatusColor = (rating) => {
    if (!rating) return '#6b7280';
    if (rating >= 4.8) return '#10b981';
    if (rating >= 4.4) return '#34d399';
    if (rating >= 4.0) return '#3b82f6';
    if (rating >= 3.5) return '#f59e0b';
    if (rating >= 2.0) return '#f97316';
    return '#ef4444';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.warning('Validation Error', 'Please fix the highlighted fields'); return; }

    setLoading(true);
    try {
      const payload = {
        employeeId: parseInt(formData.employeeId),
        rating: parseFloat(formData.rating),
        totalGoals: parseInt(formData.totalGoals),
        achievedGoals: parseInt(formData.achievedGoals),
        improvementPercent: formData.improvementPercent || null,
        reviewCycle: buildReviewCycle(formData.fromDate, formData.toDate),
      };

      const response = await fetch(API_ENDPOINTS.GET_PERFORMANCE, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start review');
      }

      toast.success('Success', `Performance review started for ${selectedEmployee?.name || 'employee'}`);
      setTimeout(() => navigate('/performance'), 1500);
    } catch (err) {
      toast.error('Error', err.message || 'Failed to start review');
    } finally {
      setLoading(false);
    }
  };

  const calculateGoalPercentage = () => {
    if (!formData.totalGoals || !formData.achievedGoals) return 0;
    const total = parseFloat(formData.totalGoals) || 0;
    const achieved = parseFloat(formData.achievedGoals) || 0;
    return total > 0 ? Math.round((achieved / total) * 100) : 0;
  };

  const fieldErrClass = (field) => (errors[field] && touched[field] ? 'has-error' : '');
  const fieldOkClass = (field) => (touched[field] && !errors[field] && formData[field] ? 'has-ok' : '');

  if (loadingEmployees) return <LoadingSpinner message="Loading employees…" />;

  return (
    <div className="emp-root">
      {/* Header with back button on the right */}
      <div className="emp-header" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 className="emp-title">Start Performance Review</h1>
          <p className="emp-subtitle">Evaluate employee performance and set goals</p>
        </div>
        <button className="emp-back-btn" onClick={() => navigate('/performance')}>
          <FaArrowLeft size={12} /> Back
        </button>
      </div>

      <div className="emp-form-wrap">
        <form onSubmit={handleSubmit} noValidate className="emp-form-compact">

          {/* Employee Selection Section */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Select Employee</div>
            <div className="emp-form-grid-3col">
              <div className={`emp-field-compact ${fieldErrClass('employeeId')} ${fieldOkClass('employeeId')}`} style={{ gridColumn: 'span 3' }}>
                <label className="required">Employee</label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleEmployeeChange}
                  onBlur={() => handleBlur('employeeId')}
                >
                  <option value="">Choose an employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} • {emp.departmentName || 'No Dept'} • {emp.roleName || 'No Role'}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.employeeId} />
              </div>
            </div>
          </div>

          {/* Employee Statistics */}
          {loadingStats && (
            <div className="emp-form-section-compact" style={{ textAlign: 'center', padding: '20px' }}>
              <FaSpinner className="emp-spinner" /> Loading employee statistics...
            </div>
          )}
          {employeeStats && !loadingStats && (
            <div className="emp-form-section-compact">
              <div className="emp-section-label">Employee Statistics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div className="stats-card" style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, borderLeft: '3px solid var(--accent-indigo)' }}>
                  <FaTasks style={{ fontSize: 24, color: 'var(--accent-indigo)' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Tasks</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{employeeStats.totalAssigned || 0}</div>
                </div>
                <div className="stats-card" style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, borderLeft: '3px solid #f59e0b' }}>
                  <FaClock style={{ fontSize: 24, color: '#f59e0b' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>In Progress</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{employeeStats.inProgress || 0}</div>
                </div>
                <div className="stats-card" style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, borderLeft: '3px solid #10b981' }}>
                  <FaCheckCircle style={{ fontSize: 24, color: '#10b981' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Completed</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{employeeStats.completed || 0}</div>
                </div>
                <div className="stats-card" style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, borderLeft: '3px solid #ef4444' }}>
                  <FaExclamationTriangle style={{ fontSize: 24, color: '#ef4444' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overdue</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{employeeStats.overdue || 0}</div>
                </div>
                <div className="stats-card" style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, borderLeft: '3px solid #3b82f6' }}>
                  <FaInfoCircle style={{ fontSize: 24, color: '#3b82f6' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending Approval</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{employeeStats.pendingApproval || 0}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#ede9fe', borderRadius: 10, color: 'var(--accent-indigo)', fontSize: 13 }}>
                <FaInfoCircle size={12} />
                <span>Goals have been auto-filled based on task statistics. You can adjust them below.</span>
              </div>
            </div>
          )}

          {/* Star Rating Section */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Performance Rating</div>
            <div className={`emp-field-compact ${fieldErrClass('rating')}`}>
              <label className="required">Rating (1–5 Stars)</label>
              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                <StarRating rating={formData.rating} onRatingChange={handleRatingChange} size={40} />
              </div>
              {formData.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                  <span>Performance Level:</span>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontWeight: 600, backgroundColor: `${getStatusColor(formData.rating)}20`, color: getStatusColor(formData.rating) }}>
                    {getStatusFromRating(formData.rating)}
                  </span>
                </div>
              )}
              <FieldError msg={errors.rating} />
            </div>
          </div>

          {/* Goal Setting Section */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Goal Setting</div>
            <div className="emp-form-grid-3col">
              <div className={`emp-field-compact ${fieldErrClass('totalGoals')}`}>
                <label className="required">Total Goals</label>
                <input type="number" name="totalGoals" value={formData.totalGoals} onChange={handleInputChange} onBlur={() => handleBlur('totalGoals')} min="1" placeholder="e.g., 10" />
                <FieldError msg={errors.totalGoals} />
              </div>
              <div className={`emp-field-compact ${fieldErrClass('achievedGoals')}`}>
                <label className="required">Achieved Goals</label>
                <input type="number" name="achievedGoals" value={formData.achievedGoals} onChange={handleInputChange} onBlur={() => handleBlur('achievedGoals')} min="0" max={formData.totalGoals || 999} placeholder="e.g., 8" />
                <FieldError msg={errors.achievedGoals} />
              </div>
            </div>

            {formData.totalGoals > 0 && (
              <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-surface)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span>Goal Achievement Progress</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>{calculateGoalPercentage()}%</span>
                </div>
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${calculateGoalPercentage()}%`, background: 'linear-gradient(90deg, var(--accent-indigo), #818cf8)', borderRadius: 10 }} />
                </div>
              </div>
            )}

            <div className="emp-field-compact">
              <label>Improvement Percentage</label>
              <div style={{ position: 'relative' }}>
                <input type="text" name="improvementPercent" value={formData.improvementPercent} placeholder="Auto-calculated" readOnly style={{ paddingRight: 40 }} />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>%</span>
              </div>
              <small className="task-hint-text">Automatically calculated based on achieved vs total goals</small>
            </div>
          </div>

          {/* Review Period (Date Range) Section */}
          <div className="emp-form-section-compact">
            <div className="emp-section-label">Review Period</div>
            <div className="emp-form-grid-3col">
              <div className={`emp-field-compact ${fieldErrClass('fromDate')}`}>
                <label className="required">Start Date</label>
                <input type="date" name="fromDate" value={formData.fromDate} max={today} onChange={handleInputChange} onBlur={() => handleBlur('fromDate')} />
                <FieldError msg={errors.fromDate} />
              </div>
              <div className={`emp-field-compact ${fieldErrClass('toDate')}`}>
                <label className="required">End Date</label>
                <input type="date" name="toDate" value={formData.toDate} min={formData.fromDate || undefined} max={today} onChange={handleInputChange} onBlur={() => handleBlur('toDate')} disabled={!formData.fromDate} />
                <FieldError msg={errors.toDate} />
                {!formData.fromDate && <small className="task-hint-text">Select start date first</small>}
              </div>
            </div>
            {formData.fromDate && formData.toDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#ede9fe', borderRadius: 10, color: 'var(--accent-indigo)', fontSize: 13, marginTop: 4 }}>
                <FaCalendarAlt size={12} />
                <span>Review cycle will be saved as: <strong>{buildReviewCycle(formData.fromDate, formData.toDate)}</strong></span>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="emp-form-actions">
            <button type="button" className="emp-cancel-btn" onClick={() => navigate('/performance')} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="emp-add-btn" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {loading ? <><span className="emp-spinner" /> Starting Review...</> : <><FaSave size={12} /> Start Review</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StartPerformanceReview;