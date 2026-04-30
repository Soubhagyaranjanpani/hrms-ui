// src/pages/holiday/HolidayManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    FaPlus,
    FaSearch,
    FaTimes,
    FaTrashAlt,
    FaCalendarAlt,
    FaUpload,
    FaFileAlt,
    FaChevronLeft,
    FaChevronRight,
    FaGift,
    FaCloudUploadAlt,
    FaArrowLeft,
    FaSave,
    FaExclamationCircle,
    FaEdit,
    FaList,
    FaCalendarWeek
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';

/* ─── Validation Rules ─── */
const RULES = {
    name: {
        required: true,
        minLen: 2,
        maxLen: 100,
        pattern: /^[a-zA-Z0-9\s\-',.!&()]+$/,
        patternMsg: 'Only letters, numbers, spaces and basic punctuation allowed'
    },
    date: {
        required: true,
        validate: (value) => {
            if (!value) return '';
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) return 'Holiday date cannot be in the past';
            return '';
        }
    },
    description: {
        required: false,
        maxLen: 500
    }
};

const validate = (field, value) => {
    const r = RULES[field];
    if (!r) return '';
    const v = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
    if (r.required && !v) return 'This field is required';
    if (!v && !r.required) return '';
    if (r.minLen && v.length < r.minLen) return `Minimum ${r.minLen} characters required`;
    if (r.maxLen && v.length > r.maxLen) return `Maximum ${r.maxLen} characters allowed`;
    if (r.pattern && !r.pattern.test(v)) return r.patternMsg;
    if (r.validate) {
        const customError = r.validate(value);
        if (customError) return customError;
    }
    return '';
};

const FieldError = ({ msg }) =>
    msg ? (
        <span className="field-err">
            <FaExclamationCircle size={10} /> {msg}
        </span>
    ) : null;

const CharCount = ({ value, max }) => {
    const len = (value || '').length;
    const warn = len > max * 0.85;
    return (
        <span className="char-count" style={{ color: warn ? '#f97316' : '#8b92b8' }}>
            {len}/{max}
        </span>
    );
};

const HolidayManagement = () => {
    const [view, setView] = useState('list');
    const [displayMode, setDisplayMode] = useState('calendar'); // 'calendar' or 'table'
    const [editMode, setEditMode] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);

    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [formData, setFormData] = useState({
        name: '',
        date: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const [uploadFile, setUploadFile] = useState(null);

    const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.GET_ALL_HOLIDAYS, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.status === 200 && result.response) setHolidays(result.response);
            else setHolidays([]);
        } catch (error) {
            console.error('Fetch holidays error:', error);
            toast.error('Error', 'Failed to fetch holidays');
            setHolidays([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') fetchHolidays();
    }, [fetchHolidays, view]);

    const handleChange = (field, value) => {
        const updated = { ...formData, [field]: value };
        setFormData(updated);
        if (touched[field]) setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: validate(field, formData[field]) }));
    };

    const validateAll = () => {
        const errs = {};
        ['name', 'date', 'description'].forEach(f => {
            const err = validate(f, formData[f]);
            if (err) errs[f] = err;
        });
        return errs;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const allFields = ['name', 'date', 'description'];
        setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
        const errs = validateAll();
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            toast.warning('Validation Error', 'Please fix the highlighted fields');
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch(API_ENDPOINTS.CREATE_HOLIDAY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.status === 200) {
                toast.success('Success', 'Holiday created successfully');
                resetForm();
                setView('list');
                fetchHolidays();
            } else {
                toast.error('Error', result.message || 'Failed to create holiday');
            }
        } catch (error) {
            toast.error('Error', 'Network error while creating holiday');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (holiday) => {
        setSelectedHoliday(holiday);
        setFormData({
            name: holiday.name || '',
            date: holiday.date || '',
            description: holiday.description || ''
        });
        setEditMode(true);
        setView('form');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const allFields = ['name', 'date', 'description'];
        setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
        const errs = validateAll();
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            toast.warning('Validation Error', 'Please fix the highlighted fields');
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.GET_ALL_HOLIDAYS}/${selectedHoliday.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.status === 200) {
                toast.success('Success', 'Holiday updated successfully');
                resetForm();
                setView('list');
                fetchHolidays();
            } else {
                toast.error('Error', result.message || 'Failed to update holiday');
            }
        } catch (error) {
            toast.error('Error', 'Network error while updating holiday');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (holiday) => {
        setHolidayToDelete(holiday);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!holidayToDelete) return;
        try {
            const response = await fetch(API_ENDPOINTS.DELETE_HOLIDAY(holidayToDelete.id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });
            const result = await response.json();
            if (result.status === 200) {
                toast.success('Success', `${holidayToDelete.name} deleted successfully`);
                setShowDeleteModal(false);
                setHolidayToDelete(null);
                fetchHolidays();
            } else {
                toast.error('Error', result.message || 'Failed to delete holiday');
            }
        } catch (error) {
            toast.error('Error', 'Network error while deleting holiday');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            toast.warning('Warning', 'Please select a CSV file to upload');
            return;
        }
        if (!uploadFile.name.endsWith('.csv')) {
            toast.error('Error', 'Please upload a valid CSV file');
            return;
        }
        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', uploadFile);
        try {
            const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
            const response = await fetch(API_ENDPOINTS.UPLOAD_HOLIDAYS, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataUpload
            });
            const result = await response.json();
            if (result.status === 200) {
                toast.success('Success', result.message || 'Holidays uploaded successfully');
                setUploadFile(null);
                setView('list');
                fetchHolidays();
            } else {
                toast.error('Error', result.message || 'Failed to upload holidays');
            }
        } catch (error) {
            toast.error('Error', 'Network error while uploading file');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', date: '', description: '' });
        setErrors({});
        setTouched({});
        setEditMode(false);
        setSelectedHoliday(null);
        setUploadFile(null);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getHolidayStatus = (dateStr) => {
        const holidayDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (holidayDate.getTime() === today.getTime()) return { label: 'Today', variant: 'warning' };
        else if (holidayDate > today) return { label: 'Upcoming', variant: 'info' };
        else return { label: 'Passed', variant: 'secondary' };
    };

    const isFieldOk = (f) => touched[f] && !errors[f] && formData[f]?.trim();
    const isFieldErr = (f) => touched[f] && !!errors[f];

    const getStatistics = () => {
        const total = holidays.length;
        const today = new Date().toISOString().split('T')[0];
        const upcoming = holidays.filter(h => new Date(h.date) > new Date()).length;
        const todayCount = holidays.filter(h => h.date === today).length;
        const passed = holidays.filter(h => new Date(h.date) < new Date()).length;
        return { total, upcoming, todayCount, passed };
    };
    const stats = getStatistics();

    const filteredHolidays = holidays.filter(holiday =>
        holiday.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        holiday.date?.includes(searchTerm)
    );

    // Calendar helpers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
    const getHolidaysForDate = (dateStr) => holidays.filter(h => h.date === dateStr);
    const isFutureDate = (dateStr) => new Date(dateStr) > new Date();
    const getDateStatusClass = (dateStr) => {
        if (dateStr === new Date().toISOString().split('T')[0]) return 'calendar-day-today';
        return getHolidaysForDate(dateStr).length > 0 ? 'calendar-day-holiday' : '';
    };
    const getDateTooltip = (dateStr) => {
        const h = getHolidaysForDate(dateStr);
        return h.length ? `🎉 ${h.map(hh => hh.name).join(', ')}` : '';
    };

    const changeMonth = (inc) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + inc, 1));
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasHoliday = getHolidaysForDate(dateStr).length > 0;
            const statusClass = getDateStatusClass(dateStr);
            days.push(
                <div key={day} className={`calendar-day ${statusClass} ${hasHoliday ? 'has-holiday' : ''}`} title={getDateTooltip(dateStr)}>
                    <span className="calendar-day-number">{day}</span>
                    {hasHoliday && <FaGift size={10} style={{ marginTop: '4px', color: '#f59e0b' }} />}
                </div>
            );
        }
        return days;
    };

    const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0,5);

    if (loading && view === 'list' && holidays.length === 0) return <LoadingSpinner message="Loading holidays..." />;

    // ──────────────────────────────────────────────────────────────
    // RENDER
    // ──────────────────────────────────────────────────────────────
    return (
        <div className="emp-root">
            {/* Header */}
            <div className="emp-header" style={{ justifyContent: view !== 'list' ? 'space-between' : 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                {view !== 'list' ? (
                    <>
                        <div>
                            <h1 className="emp-title">{view === 'upload' ? 'Bulk Upload Holidays' : (editMode ? 'Edit Holiday' : 'Add Holiday')}</h1>
                            <p className="emp-subtitle">{view === 'upload' ? 'Upload multiple holidays via CSV file' : (editMode ? 'Update holiday information' : 'Enter new holiday details')}</p>
                        </div>
                        <button className="emp-back-btn" onClick={() => { setView('list'); resetForm(); }}><FaArrowLeft size={12} /> Back to List</button>
                    </>
                ) : (
                    <>
                        <div>
                            <h1 className="emp-title">Holiday Calendar</h1>
                            <p className="emp-subtitle">{filteredHolidays.length} total holidays</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {/* Display Mode Toggle */}
                            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                <button
                                    className={`mode-btn ${displayMode === 'calendar' ? 'active' : ''}`}
                                    onClick={() => setDisplayMode('calendar')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: displayMode === 'calendar' ? 'var(--accent-indigo)' : 'transparent',
                                        color: displayMode === 'calendar' ? 'white' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                ><FaCalendarWeek size={14} /> Calendar</button>
                                <button
                                    className={`mode-btn ${displayMode === 'table' ? 'active' : ''}`}
                                    onClick={() => setDisplayMode('table')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: displayMode === 'table' ? 'var(--accent-indigo)' : 'transparent',
                                        color: displayMode === 'table' ? 'white' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                ><FaList size={14} /> Table</button>
                            </div>
                            <button className="emp-add-btn" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }} onClick={() => { resetForm(); setView('upload'); }}>
                                <FaCloudUploadAlt size={13} /> Bulk Upload
                            </button>
                            <button className="emp-add-btn" onClick={() => { resetForm(); setView('form'); setEditMode(false); }}>
                                <FaPlus size={13} /> Add Holiday
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ================= LIST VIEW ================= */}
            {view === 'list' && (
                <>
                    {/* Search Bar */}
                    <div className="emp-search-bar">
                        <div className="emp-search-wrap">
                            <FaSearch className="emp-search-icon" size={12} />
                            <input className="emp-search-input" type="text" placeholder="Search by holiday name or date..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            {searchTerm && <button className="emp-search-clear" onClick={() => setSearchTerm('')}><FaTimes size={11} /></button>}
                        </div>
                    </div>

                    {/* Stats Cards – Centered (icon above value) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div className="stat-card" style={{ padding: '20px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#6366f1', fontSize: 20 }}><FaCalendarAlt /></div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Total Holidays</div>
                            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.total}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>All holidays</div>
                        </div>
                        <div className="stat-card" style={{ padding: '20px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#10b981', fontSize: 20 }}><FaCalendarAlt /></div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Upcoming</div>
                            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.upcoming}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Yet to come</div>
                        </div>
                        <div className="stat-card" style={{ padding: '20px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#f59e0b', fontSize: 20 }}><FaCalendarAlt /></div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Today</div>
                            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.todayCount}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Current holiday</div>
                        </div>
                        <div className="stat-card" style={{ padding: '20px 16px', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#ef4444', fontSize: 20 }}><FaCalendarAlt /></div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Sora', sans-serif" }}>Passed</div>
                            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{stats.passed}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Already passed</div>
                        </div>
                    </div>

                    {/* Calendar View */}
                    {displayMode === 'calendar' && (
                        <>
                            <div className="attendance-table-card" style={{ overflow: 'visible', marginBottom: '24px' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}>Holiday Calendar</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => changeMonth(-1)} className="calendar-nav-btn" style={{ padding: '6px 10px' }}><FaChevronLeft size={12} /></button>
                                        <button onClick={() => changeMonth(1)} className="calendar-nav-btn" style={{ padding: '6px 10px' }}><FaChevronRight size={12} /></button>
                                    </div>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <div className="calendar-grid">
                                        {weekDays.map(day => <div key={day} className="calendar-weekday" style={{ fontSize: '13px', padding: '8px', fontFamily: "'Sora', sans-serif", fontWeight: 600 }}>{day}</div>)}
                                        {renderCalendar()}
                                    </div>
                                    <div className="calendar-legend" style={{ gap: '12px', paddingTop: '16px' }}>
                                        <div className="legend-item"><span className="legend-color holiday-color"></span><span>Holiday</span></div>
                                        <div className="legend-item"><span className="legend-color today-color"></span><span>Today</span></div>
                                        <div className="legend-item"><span className="legend-color future-color"></span><span>Future Date</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Holidays Preview */}
                            {upcomingHolidays.length > 0 && (
                                <div className="emp-table-card">
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', fontFamily: "'Sora', sans-serif" }}>Upcoming Holidays</h3>
                                    </div>
                                    <div style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {upcomingHolidays.map((holiday, idx) => {
                                                const dateObj = new Date(holiday.date);
                                                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                                const daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
                                                return (
                                                    <div key={holiday.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: daysUntil === 0 ? '#fef3c7' : '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: daysUntil === 0 ? '#fbbf24' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: daysUntil === 0 ? '#fff' : '#6366f1' }}><FaGift size={18} /></div>
                                                            <div><div style={{ fontWeight: 600 }}>{holiday.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(holiday.date)} • {dayName}</div></div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {daysUntil === 0 ? <span style={{ background: '#fbbf24', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: 12, fontWeight: 500 }}>Today! 🎉</span> : <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px', fontSize: 12, fontWeight: 500 }}>{daysUntil} day{daysUntil !== 1 ? 's' : ''} left</span>}
                                                            <div className="emp-actions">
                                                                <button className="emp-act emp-act--edit" onClick={() => handleEdit(holiday)}><FaEdit size={12} /></button>
                                                                <button className="emp-act emp-act--del" onClick={() => confirmDelete(holiday)}><FaTrashAlt size={12} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Table View */}
                    {displayMode === 'table' && (
                        <div className="emp-table-card">
                            <div className="emp-table-wrap">
                                <table className="emp-table">
                                    <thead>
                                        <tr><th>#</th><th>Holiday Name</th><th>Date</th><th>Day</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {filteredHolidays.length > 0 ? filteredHolidays.map((holiday, idx) => {
                                            const status = getHolidayStatus(holiday.date);
                                            const dayName = new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' });
                                            return (
                                                <tr key={holiday.id} className="emp-row">
                                                    <td className="emp-sno">{idx + 1}</td>
                                                    <td><div className="emp-info-cell"><div className="emp-avatar" style={{ background: '#ede9fe', color: '#6366f1' }}><FaGift size={14} /></div><div className="emp-name">{holiday.name}</div></div></td>
                                                    <td className="emp-date">{formatDate(holiday.date)}</td>
                                                    <td>{dayName}</td>
                                                    <td><span className={`emp-pill ${status.variant === 'warning' ? 'emp-pill--coral' : status.variant === 'info' ? 'emp-pill--indigo' : 'emp-pill--muted'}`}>{status.label}</span></td>
                                                    <td><div className="emp-actions"><button className="emp-act emp-act--edit" onClick={() => handleEdit(holiday)}><FaEdit size={12} /></button><button className="emp-act emp-act--del" onClick={() => confirmDelete(holiday)}><FaTrashAlt size={12} /></button></div></td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan="6" className="emp-empty"><div className="emp-empty-inner"><span className="emp-empty-icon">📅</span><p>No holidays found</p><small>{searchTerm ? 'Try a different search term' : 'Click "Add Holiday" to create one'}</small></div></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ================= FORM VIEW (Add/Edit Holiday) ================= */}
            {view === 'form' && (
                <div className="emp-form-wrap">
                    <form onSubmit={editMode ? handleUpdate : handleCreate} className="emp-form-compact">
                        <div className="emp-form-section-compact">
                            <div className="emp-section-label">Holiday Information</div>
                            <div className="emp-form-grid-3col">
                                {/* Name (span 3) */}
                                <div className={`emp-field-compact ${isFieldErr('name') ? 'has-error' : ''} ${isFieldOk('name') ? 'has-ok' : ''}`} style={{ gridColumn: 'span 3' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><label className="required">Holiday Name</label><CharCount value={formData.name} max={100} /></div>
                                    <input type="text" placeholder="e.g., Diwali, Christmas, New Year" value={formData.name} maxLength={100} onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} />
                                    <FieldError msg={errors.name} />
                                    <small className="task-hint-text">2–100 characters</small>
                                </div>

                                {/* Date */}
                                <div className={`emp-field-compact ${isFieldErr('date') ? 'has-error' : ''} ${isFieldOk('date') ? 'has-ok' : ''}`}>
                                    <label className="required">Date</label>
                                    <input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} onBlur={() => handleBlur('date')} />
                                    <FieldError msg={errors.date} />
                                </div>

                                {/* Description (span 3) */}
                                <div className={`emp-field-compact ${isFieldErr('description') ? 'has-error' : ''}`} style={{ gridColumn: 'span 3' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><label>Description</label><CharCount value={formData.description} max={500} /></div>
                                    <textarea rows={3} placeholder="Optional description or notes about this holiday" value={formData.description} maxLength={500} onChange={(e) => handleChange('description', e.target.value)} onBlur={() => handleBlur('description')} />
                                    <FieldError msg={errors.description} />
                                    <small className="task-hint-text">Brief description of the holiday (optional)</small>
                                </div>
                            </div>
                        </div>

                        <div className="emp-form-actions">
                            <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>Cancel</button>
                            <button type="submit" className="emp-add-btn" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {submitting ? <><span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</> : <><FaSave size={12} /> {editMode ? 'Update Holiday' : 'Create Holiday'}</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ================= UPLOAD VIEW ================= */}
            {view === 'upload' && (
                <div className="emp-form-wrap">
                    <form onSubmit={handleUpload} className="emp-form-compact">
                        <div className="emp-form-section-compact">
                            <div className="emp-section-label">Bulk Upload Holidays</div>
                            <div style={{ background: '#ede9fe', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <FaFileAlt size={20} style={{ color: '#6366f1', flexShrink: 0 }} />
                                <div><strong>CSV File Format</strong><br />Format: <code>name,date</code><br />Example: <code>Diwali,2024-11-12</code><br /><small>Date format: YYYY-MM-DD (e.g., 2024-12-25)</small></div>
                            </div>
                            <div className="emp-field-compact">
                                <label className="required">Select CSV File</label>
                                <input type="file" accept=".csv" onChange={(e) => setUploadFile(e.target.files[0])} style={{ padding: '10px', border: '1.5px solid var(--border-medium)', borderRadius: '10px', width: '100%' }} />
                                {uploadFile && <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981' }}>✓ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)</div>}
                                <small className="task-hint-text">Upload a CSV file with holiday names and dates</small>
                            </div>
                        </div>
                        <div className="emp-form-actions">
                            <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); setUploadFile(null); }}>Cancel</button>
                            <button type="submit" className="emp-add-btn" disabled={uploading} style={{ display: 'inline-flex', gap: '6px' }}>
                                {uploading ? <><span className="emp-spinner" /> Uploading…</> : <><FaUpload size={12} /> Upload & Process</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && holidayToDelete && (
                <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="emp-modal-icon"><FaTrashAlt size={24} /></div>
                        <h3 className="emp-modal-title">Delete Holiday</h3>
                        <p className="emp-modal-body">You're about to permanently delete <strong>{holidayToDelete.name}</strong>.</p>
                        <p className="emp-modal-warn">This action cannot be undone.</p>
                        <div className="emp-modal-actions">
                            <button className="emp-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="emp-modal-confirm" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidayManagement;