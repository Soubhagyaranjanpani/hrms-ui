import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaStar, FaArrowLeft, FaSave, FaUser, FaChartLine, FaTasks, 
  FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaInfoCircle, FaCalendarAlt
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

// ── Format date to "DD MMM YYYY" ──
const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Build reviewCycle string from two dates ──
const buildReviewCycle = (from, to) => {
  if (!from || !to) return '';
  return `${formatDateLabel(from)} - ${formatDateLabel(to)}`;
};

// ── Interactive Star Rating ──
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
    <div className="star-rating-container">
      <div className="stars-wrapper">
        {[0, 1, 2, 3, 4].map((index) => {
          const fillPercent = Math.max(0, Math.min(1, displayRating - index)) * 100;
          return (
            <div
              key={index}
              className="star-item"
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={(e) => handleClick(e, index)}
              style={{ cursor: editable ? 'pointer' : 'default' }}
            >
              <div className="star-background"><FaStar size={size} /></div>
              <div className="star-fill" style={{ width: `${fillPercent}%` }}><FaStar size={size} /></div>
            </div>
          );
        })}
      </div>
      <div className="rating-value">
        <span className="rating-number">{displayRating.toFixed(1)}</span>
        <span className="rating-max">/ 5.0</span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════
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
    fromDate: '',   // NEW
    toDate: '',     // NEW
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ── Fetch employees ──
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

  // ── Fetch stats ──
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

  // ── Handlers ──
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

    // Auto-calculate improvement %
    if ((name === 'totalGoals' || name === 'achievedGoals') && newFormData.totalGoals && newFormData.achievedGoals) {
      const total = parseFloat(newFormData.totalGoals) || 0;
      const achieved = parseFloat(newFormData.achievedGoals) || 0;
      if (total > 0) newFormData.improvementPercent = ((achieved / total) * 100).toFixed(1);
    }

    // If toDate is before fromDate, clear toDate
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

  // ── Submit ──
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
        reviewCycle: buildReviewCycle(formData.fromDate, formData.toDate), // "01 Apr 2026 - 30 Jun 2026"
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

  if (loadingEmployees) return <LoadingSpinner message="Loading employees…" />;

  // ── Render ──
  return (
    <div className="perf-review-container">
      {/* Header */}
      <div className="perf-header">
        <button className="perf-back-btn" onClick={() => navigate('/performance')}>
          <FaArrowLeft size={16} /> Back to Performance
        </button>
        <div>
          <h1 className="perf-title">Start Performance Review</h1>
          <p className="perf-subtitle">Evaluate employee performance and set goals</p>
        </div>
      </div>

      <div className="perf-form-card">
        <form onSubmit={handleSubmit}>

          {/* ── Employee Selection ── */}
          <div className="perf-section">
            <div className="perf-section-header">
              <FaUser className="perf-section-icon" />
              <h3>Select Employee</h3>
            </div>
            <div className={`perf-field ${errors.employeeId && touched.employeeId ? 'has-error' : ''}`}>
              <label className="perf-label required">Employee</label>
              <select name="employeeId" value={formData.employeeId} onChange={handleEmployeeChange} onBlur={() => handleBlur('employeeId')} className="perf-select">
                <option value="">Choose an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} • {emp.departmentName || 'No Department'} • {emp.roleName || 'No Role'}
                  </option>
                ))}
              </select>
              {errors.employeeId && touched.employeeId && <span className="perf-error">{errors.employeeId}</span>}
            </div>
          </div>

          {/* ── Employee Stats ── */}
          {loadingStats && (
            <div className="perf-stats-loading"><FaSpinner className="spinner" /> Loading employee statistics...</div>
          )}
          {employeeStats && !loadingStats && (
            <div className="perf-stats-section">
              <div className="perf-section-header">
                <FaChartLine className="perf-section-icon" />
                <h3>Employee Statistics</h3>
              </div>
              <div className="perf-stats-grid">
                <div className="perf-stat-card"><FaTasks className="stat-icon" /><div className="stat-content"><span className="stat-label">Total Tasks</span><span className="stat-value">{employeeStats.totalAssigned || 0}</span></div></div>
                <div className="perf-stat-card warning"><FaClock className="stat-icon" /><div className="stat-content"><span className="stat-label">In Progress</span><span className="stat-value">{employeeStats.inProgress || 0}</span></div></div>
                <div className="perf-stat-card success"><FaCheckCircle className="stat-icon" /><div className="stat-content"><span className="stat-label">Completed</span><span className="stat-value">{employeeStats.completed || 0}</span></div></div>
                <div className="perf-stat-card danger"><FaExclamationTriangle className="stat-icon" /><div className="stat-content"><span className="stat-label">Overdue</span><span className="stat-value">{employeeStats.overdue || 0}</span></div></div>
                <div className="perf-stat-card info"><FaInfoCircle className="stat-icon" /><div className="stat-content"><span className="stat-label">Pending Approval</span><span className="stat-value">{employeeStats.pendingApproval || 0}</span></div></div>
              </div>
              <div className="perf-auto-fill-note"><FaInfoCircle size={12} /><span>Goals have been auto-filled based on task statistics. You can adjust them below.</span></div>
            </div>
          )}

          {/* ── Star Rating ── */}
          <div className="perf-section">
            <div className="perf-section-header">
              <FaStar className="perf-section-icon" />
              <h3>Performance Rating</h3>
            </div>
            <div className={`perf-field ${errors.rating && touched.rating ? 'has-error' : ''}`}>
              <label className="perf-label required">Rating (1–5 Stars)</label>
              <div className="perf-rating-wrapper">
                <StarRating rating={formData.rating} onRatingChange={handleRatingChange} size={40} />
              </div>
              {formData.rating > 0 && (
                <div className="perf-rating-status">
                  <span>Performance Level:</span>
                  <span className="status-badge" style={{ backgroundColor: `${getStatusColor(formData.rating)}20`, color: getStatusColor(formData.rating) }}>
                    {getStatusFromRating(formData.rating)}
                  </span>
                </div>
              )}
              {errors.rating && touched.rating && <span className="perf-error">{errors.rating}</span>}
            </div>
          </div>

          {/* ── Goals ── */}
          <div className="perf-section">
            <div className="perf-section-header">
              <FaChartLine className="perf-section-icon" />
              <h3>Goal Setting</h3>
            </div>
            <div className="perf-goals-grid">
              <div className={`perf-field ${errors.totalGoals && touched.totalGoals ? 'has-error' : ''}`}>
                <label className="perf-label required">Total Goals</label>
                <input type="number" name="totalGoals" value={formData.totalGoals} onChange={handleInputChange} onBlur={() => handleBlur('totalGoals')} min="1" placeholder="e.g., 10" className="perf-input" />
                {errors.totalGoals && touched.totalGoals && <span className="perf-error">{errors.totalGoals}</span>}
              </div>
              <div className={`perf-field ${errors.achievedGoals && touched.achievedGoals ? 'has-error' : ''}`}>
                <label className="perf-label required">Achieved Goals</label>
                <input type="number" name="achievedGoals" value={formData.achievedGoals} onChange={handleInputChange} onBlur={() => handleBlur('achievedGoals')} min="0" max={formData.totalGoals || 999} placeholder="e.g., 8" className="perf-input" />
                {errors.achievedGoals && touched.achievedGoals && <span className="perf-error">{errors.achievedGoals}</span>}
              </div>
            </div>

            {formData.totalGoals > 0 && (
              <div className="perf-progress-section">
                <div className="progress-header">
                  <span>Goal Achievement Progress</span>
                  <span className="progress-percent">{calculateGoalPercentage()}%</span>
                </div>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar-fill" style={{ width: `${calculateGoalPercentage()}%` }} />
                </div>
              </div>
            )}

            <div className="perf-improvement-field">
              <label className="perf-label">Improvement Percentage</label>
              <div className="improvement-input-wrapper">
                <input type="text" name="improvementPercent" value={formData.improvementPercent} placeholder="Auto-calculated" className="perf-input" readOnly />
                <span className="percent-symbol">%</span>
              </div>
              <small className="perf-hint">Automatically calculated based on achieved vs total goals</small>
            </div>
          </div>

          {/* ── Review Period (Date Range) ── NEW SECTION ── */}
          <div className="perf-section">
            <div className="perf-section-header">
              <FaCalendarAlt className="perf-section-icon" />
              <h3>Review Period</h3>
            </div>

            <div className="perf-goals-grid">
              {/* From Date */}
              <div className={`perf-field ${errors.fromDate && touched.fromDate ? 'has-error' : ''}`}>
                <label className="perf-label required">Start Date</label>
                <input
                  type="date"
                  name="fromDate"
                  value={formData.fromDate}
                  max={today}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('fromDate')}
                  className="perf-input"
                />
                {errors.fromDate && touched.fromDate && <span className="perf-error">{errors.fromDate}</span>}
              </div>

              {/* To Date */}
              <div className={`perf-field ${errors.toDate && touched.toDate ? 'has-error' : ''}`}>
                <label className="perf-label required">End Date</label>
                <input
                  type="date"
                  name="toDate"
                  value={formData.toDate}
                  min={formData.fromDate || undefined}
                  max={today}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('toDate')}
                  className="perf-input"
                  disabled={!formData.fromDate}
                />
                {errors.toDate && touched.toDate && <span className="perf-error">{errors.toDate}</span>}
                {!formData.fromDate && <small className="perf-hint">Select start date first</small>}
              </div>
            </div>

            {/* Preview the saved string */}
            {formData.fromDate && formData.toDate && (
              <div className="perf-cycle-preview">
                <FaCalendarAlt size={13} />
                <span>Review cycle will be saved as: <strong>{buildReviewCycle(formData.fromDate, formData.toDate)}</strong></span>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="perf-actions">
            <button type="button" className="emp-cancel-btn" onClick={() => navigate('/performance')} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="emp-submit-btn" disabled={loading}>
              {loading
                ? <><span className="emp-spinner" /> Starting Review...</>
                : <><FaSave size={14} /> Start Review</>
              }
            </button>
          </div>

        </form>
      </div>

      <style jsx>{`
        /* ── Container & Header ── */
        .perf-review-container { max-width: 900px; margin: 0 auto; padding: 24px; }
        .perf-header { margin-bottom: 32px; }
        .perf-back-btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--bg-surface); border: 1.5px solid var(--border-medium); border-radius: 10px; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; }
        .perf-back-btn:hover { background: var(--border-light); border-color: var(--accent-indigo); color: var(--accent-indigo); }
        .perf-title { font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0; }
        .perf-subtitle { font-size: 14px; color: var(--text-muted); margin: 0; }

        /* ── Form Card ── */
        .perf-form-card { background: var(--card-bg); border: 1px solid var(--border-light); border-radius: 20px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }

        /* ── Sections ── */
        .perf-section { margin-bottom: 32px; }
        .perf-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid var(--border-light); }
        .perf-section-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
        .perf-section-icon { color: var(--accent-indigo); font-size: 18px; }

        /* ── Fields ── */
        .perf-field { margin-bottom: 20px; }
        .perf-field.has-error .perf-input, .perf-field.has-error .perf-select { border-color: var(--danger); }
        .perf-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
        .perf-label.required::after { content: ' *'; color: var(--danger); }
        .perf-input, .perf-select { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border-medium); border-radius: 10px; font-size: 14px; color: var(--text-primary); background: var(--card-bg); transition: all 0.2s; box-sizing: border-box; }
        .perf-input:focus, .perf-select:focus { outline: none; border-color: var(--accent-indigo); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .perf-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .perf-error { display: block; color: var(--danger); font-size: 12px; margin-top: 6px; }
        .perf-hint { display: block; font-size: 12px; color: var(--text-muted); margin-top: 6px; }

        /* ── Stats ── */
        .perf-stats-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 24px; background: var(--bg-surface); border-radius: 12px; margin-bottom: 24px; color: var(--text-muted); }
        .perf-stats-section { margin-bottom: 32px; }
        .perf-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .perf-stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--bg-surface); border-radius: 12px; border-left: 3px solid var(--accent-indigo); }
        .perf-stat-card.warning { border-left-color: #f59e0b; }
        .perf-stat-card.success { border-left-color: #10b981; }
        .perf-stat-card.danger  { border-left-color: #ef4444; }
        .perf-stat-card.info    { border-left-color: #3b82f6; }
        .stat-icon { font-size: 24px; color: var(--accent-indigo); }
        .perf-stat-card.warning .stat-icon { color: #f59e0b; }
        .perf-stat-card.success .stat-icon { color: #10b981; }
        .perf-stat-card.danger  .stat-icon { color: #ef4444; }
        .perf-stat-card.info    .stat-icon { color: #3b82f6; }
        .stat-content { display: flex; flex-direction: column; }
        .stat-label { font-size: 12px; color: var(--text-muted); }
        .stat-value { font-size: 24px; font-weight: 700; color: var(--text-primary); }
        .perf-auto-fill-note { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #ede9fe; border-radius: 10px; color: var(--accent-indigo); font-size: 13px; }

        /* ── Star Rating ── */
        .perf-rating-wrapper { padding: 16px; background: var(--bg-surface); border-radius: 12px; display: flex; justify-content: center; }
        .star-rating-container { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .stars-wrapper { display: flex; gap: 8px; }
        .star-item { position: relative; display: inline-block; }
        .star-background { color: #d1d5db; }
        .star-fill { position: absolute; top: 0; left: 0; overflow: hidden; color: #fbbf24; }
        .rating-value { display: flex; align-items: baseline; gap: 4px; }
        .rating-number { font-size: 24px; font-weight: 700; color: var(--text-primary); }
        .rating-max { font-size: 14px; color: var(--text-muted); }
        .perf-rating-status { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px; font-size: 14px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-weight: 600; }

        /* ── Goals Grid ── */
        .perf-goals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .perf-progress-section { margin-bottom: 24px; padding: 16px; background: var(--bg-surface); border-radius: 12px; }
        .progress-header { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
        .progress-percent { font-weight: 600; color: var(--accent-indigo); }
        .progress-bar-wrapper { height: 8px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent-indigo), #818cf8); border-radius: 10px; transition: width 0.3s ease; }
        .perf-improvement-field { margin-bottom: 20px; }
        .improvement-input-wrapper { position: relative; }
        .improvement-input-wrapper .perf-input { padding-right: 40px; }
        .percent-symbol { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-weight: 600; }

        /* ── Review Period Preview ── */
        .perf-cycle-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #ede9fe;
          border-radius: 10px;
          color: var(--accent-indigo);
          font-size: 13px;
          margin-top: 4px;
        }
        .perf-cycle-preview strong { font-weight: 700; }

        /* ── Actions — reuse emp-submit-btn / emp-cancel-btn from global CSS ── */
        .perf-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border-light); }

        /* ── Spinner ── */
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .perf-review-container { padding: 16px; }
          .perf-form-card { padding: 20px; }
          .perf-goals-grid { grid-template-columns: 1fr; }
          .perf-stats-grid { grid-template-columns: 1fr; }
          .perf-actions { flex-direction: column-reverse; }
        }
      `}</style>
    </div>
  );
};

export default StartPerformanceReview;