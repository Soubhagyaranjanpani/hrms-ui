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
            if (selectedDate < today) {
                return 'Holiday date cannot be in the past';
            }
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

const validateAll = (formData) => {
    const errors = {};
    const fields = ['name', 'date', 'description'];
    fields.forEach(f => {
        const err = validate(f, formData[f]);
        if (err) errors[f] = err;
    });
    return errors;
};

/* ─── Sub-components ─── */
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

    // Helper function to get auth token
    const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

    /* ─── Fetch holidays ─── */
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

            if (result.status === 200 && result.response) {
                setHolidays(result.response);
            } else {
                setHolidays([]);
            }
        } catch (error) {
            console.error('Fetch holidays error:', error);
            toast.error('Error', 'Failed to fetch holidays');
            setHolidays([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
            fetchHolidays();
        }
    }, [fetchHolidays, view]);

    /* ─── Field handlers ─── */
    const handleChange = (field, value) => {
        const updated = { ...formData, [field]: value };
        setFormData(updated);
        if (touched[field]) {
            setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: validate(field, formData[field]) }));
    };

    /* ─── Create Holiday ─── */
    const handleCreate = async (e) => {
        e.preventDefault();
        const allFields = ['name', 'date', 'description'];
        setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
        const errs = validateAll(formData);
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            toast.warning('Validation Error', 'Please fix the highlighted fields');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(API_ENDPOINTS.CREATE_HOLIDAY, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
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
            console.error('Create holiday error:', error);
            toast.error('Error', 'Network error while creating holiday');
        } finally {
            setSubmitting(false);
        }
    };

    /* ─── Edit Holiday ─── */
    const handleEdit = (holiday) => {
        setSelectedHoliday(holiday);
        setFormData({
            name: holiday.name || '',
            date: holiday.date || '',
            description: holiday.description || ''
        });
        setErrors({});
        setTouched({});
        setEditMode(true);
        setView('form');
    };

    /* ─── Update Holiday ─── */
    const handleUpdate = async (e) => {
        e.preventDefault();
        const allFields = ['name', 'date', 'description'];
        setTouched(allFields.reduce((a, f) => ({ ...a, [f]: true }), {}));
        const errs = validateAll(formData);
        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            toast.warning('Validation Error', 'Please fix the highlighted fields');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.GET_ALL_HOLIDAYS}/${selectedHoliday.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
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
            console.error('Update holiday error:', error);
            toast.error('Error', 'Network error while updating holiday');
        } finally {
            setSubmitting(false);
        }
    };

    /* ─── Delete Holiday ─── */
    const confirmDelete = (holiday) => {
        setHolidayToDelete(holiday);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!holidayToDelete) return;

        try {
            const response = await fetch(API_ENDPOINTS.DELETE_HOLIDAY(holidayToDelete.id), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
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
            console.error('Delete holiday error:', error);
            toast.error('Error', 'Network error while deleting holiday');
        }
    };

    /* ─── Bulk Upload ─── */
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
                headers: {
                    'Authorization': `Bearer ${token}`
                },
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
            console.error('Upload error:', error);
            toast.error('Error', 'Network error while uploading file');
        } finally {
            setUploading(false);
        }
    };

    /* ─── Reset form ─── */
    const resetForm = () => {
        setFormData({ name: '', date: '', description: '' });
        setErrors({});
        setTouched({});
        setEditMode(false);
        setSelectedHoliday(null);
        setUploadFile(null);
    };

    /* ─── Helpers ─── */
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getHolidayStatus = (dateStr) => {
        const holidayDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (holidayDate.getTime() === today.getTime()) {
            return { label: 'Today', variant: 'warning' };
        } else if (holidayDate > today) {
            return { label: 'Upcoming', variant: 'info' };
        } else {
            return { label: 'Passed', variant: 'secondary' };
        }
    };

    const isFieldOk = (f) => touched[f] && !errors[f] && formData[f]?.trim();
    const isFieldErr = (f) => touched[f] && !!errors[f];

    /* ─── Statistics ─── */
    const getStatistics = () => {
        const total = holidays.length;
        const today = new Date().toISOString().split('T')[0];
        const upcoming = holidays.filter(h => new Date(h.date) > new Date()).length;
        const todayCount = holidays.filter(h => h.date === today).length;
        const passed = holidays.filter(h => new Date(h.date) < new Date()).length;
        return { total, upcoming, todayCount, passed };
    };

    const stats = getStatistics();

    // Filter holidays based on search
    const filteredHolidays = holidays.filter(holiday =>
        holiday.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        holiday.date?.includes(searchTerm)
    );

    /* ─── Calendar Logic ─── */
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const getHolidaysForDate = (dateStr) => {
        return holidays.filter(holiday => holiday.date === dateStr);
    };

    const isFutureDate = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(dateStr);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate > today;
    };

    const isPastDate = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(dateStr);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    const getDateStatusClass = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        if (dateStr === today) return 'calendar-day-today';
        
        const dateHolidays = getHolidaysForDate(dateStr);
        if (dateHolidays.length > 0) return 'calendar-day-holiday';
        if (isFutureDate(dateStr)) return 'calendar-day-future';
        return '';
    };

    const getDateTooltip = (dateStr) => {
        const dateHolidays = getHolidaysForDate(dateStr);
        if (dateHolidays.length > 0) {
            const holidayNames = dateHolidays.map(h => h.name).join(', ');
            return `🎉 ${holidayNames}`;
        }
        if (isFutureDate(dateStr)) return 'No holidays scheduled';
        return 'No holidays';
    };

    const changeMonth = (increment) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const today = new Date().toISOString().split('T')[0];

        const days = [];
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const dateHolidays = getHolidaysForDate(dateStr);
            const hasHoliday = dateHolidays.length > 0;
            const tooltip = getDateTooltip(dateStr);
            const statusClass = getDateStatusClass(dateStr);
            const isFuture = isFutureDate(dateStr);

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${statusClass} ${hasHoliday ? 'has-holiday' : ''}`}
                    title={tooltip}
                >
                    <span className="calendar-day-number">{day}</span>
                    {hasHoliday && (
                        <div className="holiday-indicator">
                            <FaGift size={10} />
                            {dateHolidays.length > 1 && <span className="holiday-count">{dateHolidays.length}</span>}
                        </div>
                    )}
                    {hasHoliday && (
                        <div className="holiday-names">
                            {dateHolidays.map(h => h.name).join(' • ')}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get upcoming holidays (next 5)
    const upcomingHolidays = holidays
        .filter(h => new Date(h.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    if (loading && view === 'list' && holidays.length === 0) {
        return <LoadingSpinner message="Loading holidays..." />;
    }

    /* ════════════════════════════════════════════════
       RENDER
    ════════════════════════════════════════════════ */
    return (
        <div className="emp-root">

            {/* ── Header ── */}
            <div className="emp-header" style={view !== 'list' ? { justifyContent: 'space-between' } : {}}>
                {view !== 'list' ? (
                    <>
                        <div>
                            <h1 className="emp-title">
                                {view === 'upload' ? 'Bulk Upload Holidays' : (editMode ? 'Edit Holiday' : 'Add Holiday')}
                            </h1>
                            <p className="emp-subtitle">
                                {view === 'upload'
                                    ? 'Upload multiple holidays via CSV file'
                                    : (editMode ? 'Update holiday information' : 'Enter new holiday details')}
                            </p>
                        </div>
                        <button className="emp-back-btn" onClick={() => { setView('list'); resetForm(); }}>
                            <FaArrowLeft size={12} /> Back to List
                        </button>
                    </>
                ) : (
                    <>
                        <div className="emp-header-left">
                            <div>
                                <h1 className="emp-title">Holiday Calendar</h1>
                                <p className="emp-subtitle">{filteredHolidays.length} total holidays</p>
                            </div>
                        </div>
                        <div className="header-actions">
                            {/* Display Mode Toggle */}
                            <div className="display-mode-toggle">
                                <button 
                                    className={`mode-btn ${displayMode === 'calendar' ? 'active' : ''}`}
                                    onClick={() => setDisplayMode('calendar')}
                                    title="Calendar View"
                                >
                                    <FaCalendarWeek size={14} />
                                </button>
                                <button 
                                    className={`mode-btn ${displayMode === 'table' ? 'active' : ''}`}
                                    onClick={() => setDisplayMode('table')}
                                    title="Table View"
                                >
                                    <FaList size={14} />
                                </button>
                            </div>
                            <button className="btn-outline-indigo" onClick={() => { resetForm(); setView('upload'); }}>
                                <FaCloudUploadAlt size={16} /> Bulk Upload
                            </button>
                            <button className="emp-add-btn" onClick={() => { resetForm(); setView('form'); setEditMode(false); }}>
                                <FaPlus size={13} /> Add Holiday
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ════════════ LIST VIEW ════════════ */}
            {view === 'list' && (
                <>
                    {/* Search Bar */}
                    <div className="emp-search-bar">
                        <div className="emp-search-wrap">
                            <FaSearch className="emp-search-icon" size={12} />
                            <input
                                className="emp-search-input"
                                type="text"
                                placeholder="Search by holiday name or date..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="emp-search-clear" onClick={() => setSearchTerm('')}>
                                    <FaTimes size={11} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                            <div className="stat-label" style={{ fontSize: '12px' }}>
                                <FaCalendarAlt size={12} />
                                Total Holidays
                            </div>
                            <div className="stat-value" style={{ fontSize: '28px', color: '#6366f1' }}>{stats.total}</div>
                            <div className="stat-trend" style={{ fontSize: '11px' }}>All holidays</div>
                        </div>

                        <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                            <div className="stat-label" style={{ fontSize: '12px' }}>
                                <FaCalendarAlt size={12} />
                                Upcoming
                            </div>
                            <div className="stat-value" style={{ fontSize: '28px', color: '#10b981' }}>{stats.upcoming}</div>
                            <div className="stat-trend" style={{ fontSize: '11px' }}>Yet to come</div>
                        </div>

                        <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                            <div className="stat-label" style={{ fontSize: '12px' }}>
                                <FaCalendarAlt size={12} />
                                Today
                            </div>
                            <div className="stat-value present" style={{ fontSize: '28px' }}>{stats.todayCount}</div>
                            <div className="stat-trend" style={{ fontSize: '11px' }}>Current holiday</div>
                        </div>

                        <div className="stat-card attendance-stat" style={{ padding: '16px' }}>
                            <div className="stat-label" style={{ fontSize: '12px' }}>
                                <FaCalendarAlt size={12} />
                                Passed
                            </div>
                            <div className="stat-value absent" style={{ fontSize: '28px' }}>{stats.passed}</div>
                            <div className="stat-trend" style={{ fontSize: '11px' }}>Already passed</div>
                        </div>
                    </div>

                    {/* Calendar View */}
                    {displayMode === 'calendar' && (
                        <>
                            <div className="attendance-table-card" style={{ overflow: 'visible', marginBottom: '24px' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                            Holiday Calendar
                                        </h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => changeMonth(-1)} className="calendar-nav-btn" style={{ padding: '6px 10px' }}>
                                            <FaChevronLeft size={12} />
                                        </button>
                                        <button onClick={() => changeMonth(1)} className="calendar-nav-btn" style={{ padding: '6px 10px' }}>
                                            <FaChevronRight size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '20px' }}>
                                    <div className="calendar-grid">
                                        {weekDays.map(day => (
                                            <div key={day} className="calendar-weekday" style={{ fontSize: '13px', padding: '8px' }}>{day}</div>
                                        ))}
                                        {renderCalendar()}
                                    </div>

                                    {/* Legend */}
                                    <div className="calendar-legend" style={{ gap: '12px', paddingTop: '16px' }}>
                                        <div className="legend-item" style={{ fontSize: '12px' }}>
                                            <span className="legend-color holiday-color"></span>
                                            <span>Holiday</span>
                                        </div>
                                        <div className="legend-item" style={{ fontSize: '12px' }}>
                                            <span className="legend-color today-color"></span>
                                            <span>Today</span>
                                        </div>
                                        <div className="legend-item" style={{ fontSize: '12px' }}>
                                            <span className="legend-color future-color"></span>
                                            <span>Future Date</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Holidays Preview */}
                            {upcomingHolidays.length > 0 && (
                                <div className="attendance-table-card">
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                            Upcoming Holidays
                                        </h3>
                                    </div>
                                    <div style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {upcomingHolidays.map((holiday, idx) => {
                                                const dateObj = new Date(holiday.date);
                                                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                                const daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
                                                
                                                return (
                                                    <div key={holiday.id} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '12px 16px',
                                                        background: daysUntil === 0 ? '#fef3c7' : '#f9fafb',
                                                        borderRadius: '10px',
                                                        border: daysUntil === 0 ? '1px solid #fbbf24' : '1px solid #e5e7eb'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '10px',
                                                                background: daysUntil === 0 ? '#fbbf24' : '#ede9fe',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: daysUntil === 0 ? '#fff' : '#6366f1'
                                                            }}>
                                                                <FaGift size={18} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                                                    {holiday.name}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                                    {formatDate(holiday.date)} • {dayName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {daysUntil === 0 ? (
                                                                <span style={{
                                                                    background: '#fbbf24',
                                                                    color: '#fff',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500'
                                                                }}>
                                                                    Today! 🎉
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    background: '#e0e7ff',
                                                                    color: '#4f46e5',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500'
                                                                }}>
                                                                    {daysUntil} day{daysUntil !== 1 ? 's' : ''} left
                                                                </span>
                                                            )}
                                                            <div className="emp-actions">
                                                                <button className="emp-act emp-act--edit" onClick={() => handleEdit(holiday)} title="Edit">
                                                                    <FaEdit size={12} />
                                                                </button>
                                                                <button className="emp-act emp-act--del" onClick={() => confirmDelete(holiday)} title="Delete">
                                                                    <FaTrashAlt size={12} />
                                                                </button>
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
                                        <tr>
                                            <th style={{ width: 50 }}>#</th>
                                            <th>Holiday Name</th>
                                            <th>Date</th>
                                            <th>Day</th>
                                            <th>Status</th>
                                            <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHolidays.length > 0 ? filteredHolidays.map((holiday, idx) => {
                                            const status = getHolidayStatus(holiday.date);
                                            const dateObj = new Date(holiday.date);
                                            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                                            return (
                                                <tr key={holiday.id} className="emp-row">
                                                    <td className="emp-sno">{idx + 1}</td>
                                                    <td>
                                                        <div className="emp-info-cell">
                                                            <div className="emp-avatar" style={{ background: '#ede9fe', color: '#6366f1' }}>
                                                                <FaGift size={14} />
                                                            </div>
                                                            <div>
                                                                <div className="emp-name">{holiday.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="emp-date">{formatDate(holiday.date)}</td>
                                                    <td className="emp-branch">{dayName}</td>
                                                    <td>
                                                        <span
                                                            className={`emp-pill ${status.variant === 'warning' ? 'emp-pill--coral' :
                                                                    status.variant === 'info' ? 'emp-pill--indigo' : 'emp-pill--muted'
                                                                }`}
                                                            style={status.variant === 'secondary' ? { background: '#f1f5f9', color: '#64748b' } : {}}
                                                        >
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="emp-actions">
                                                            <button className="emp-act emp-act--edit" onClick={() => handleEdit(holiday)} title="Edit">
                                                                <FaEdit size={12} />
                                                            </button>
                                                            <button className="emp-act emp-act--del" onClick={() => confirmDelete(holiday)} title="Delete">
                                                                <FaTrashAlt size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="6" className="emp-empty">
                                                    <div className="emp-empty-inner">
                                                        <span className="emp-empty-icon">📅</span>
                                                        <p>No holidays found</p>
                                                        <small>{searchTerm ? 'Try a different search term' : 'Click "Add Holiday" to create one'}</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ════════════ FORM VIEW (Add/Edit Holiday) ════════════ */}
            {view === 'form' && (
                <div className="emp-form-wrap">
                    <form onSubmit={editMode ? handleUpdate : handleCreate} noValidate>
                        <div className="emp-form-section">
                            <div className="emp-section-label">Holiday Information</div>
                            <div className="emp-form-grid">
                                {/* Holiday Name */}
                                <div className={`emp-field ${isFieldErr('name') ? 'has-error' : ''} ${isFieldOk('name') ? 'has-ok' : ''}`}>
                                    <div className="emp-label-row">
                                        <label>Holiday Name <span className="req">*</span></label>
                                        <CharCount value={formData.name} max={100} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="e.g., Diwali, Christmas, New Year"
                                        value={formData.name}
                                        maxLength={100}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        onBlur={() => handleBlur('name')}
                                    />
                                    <FieldError msg={errors.name} />
                                    <small className="emp-hint-text">2–100 characters</small>
                                </div>

                                {/* Date */}
                                <div className={`emp-field ${isFieldErr('date') ? 'has-error' : ''} ${isFieldOk('date') ? 'has-ok' : ''}`}>
                                    <label>Date <span className="req">*</span></label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleChange('date', e.target.value)}
                                        onBlur={() => handleBlur('date')}
                                    />
                                    <FieldError msg={errors.date} />
                                    <small className="emp-hint-text">Cannot be a past date</small>
                                </div>

                                {/* Description */}
                                <div className={`emp-field ${isFieldErr('description') ? 'has-error' : ''}`} style={{ gridColumn: '1 / -1' }}>
                                    <div className="emp-label-row">
                                        <label>Description</label>
                                        <CharCount value={formData.description} max={500} />
                                    </div>
                                    <textarea
                                        rows={4}
                                        placeholder="Optional description or notes about this holiday"
                                        value={formData.description}
                                        maxLength={500}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        onBlur={() => handleBlur('description')}
                                    />
                                    <FieldError msg={errors.description} />
                                    <small className="emp-hint-text">Brief description of the holiday (optional)</small>
                                </div>
                            </div>
                        </div>

                        {/* Form Footer */}
                        <div className="emp-form-footer">
                            <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); resetForm(); }}>
                                Cancel
                            </button>
                            <button type="submit" className="emp-submit-btn" disabled={submitting}>
                                {submitting
                                    ? <><span className="emp-spinner" /> {editMode ? 'Updating…' : 'Creating…'}</>
                                    : <><FaSave size={12} /> {editMode ? 'Update Holiday' : 'Create Holiday'}</>
                                }
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ════════════ UPLOAD VIEW ════════════ */}
            {view === 'upload' && (
                <div className="emp-form-wrap">
                    <form onSubmit={handleUpload} noValidate>
                        <div className="emp-form-section">
                            <div className="emp-section-label">Bulk Upload Holidays</div>

                            {/* Info Alert */}
                            <div className="upload-info-card">
                                <FaFileAlt size={20} style={{ color: '#6366f1', flexShrink: 0 }} />
                                <div>
                                    <strong>CSV File Format</strong><br />
                                    Format: <code>name,date</code><br />
                                    Example: <code>Diwali,2024-11-12</code><br />
                                    <small>Date format: YYYY-MM-DD (e.g., 2024-12-25)</small>
                                </div>
                            </div>

                            <div className="emp-field">
                                <label>Select CSV File <span className="req">*</span></label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    style={{ padding: '10px', border: '1.5px solid #e0e2ff', borderRadius: '10px', width: '100%' }}
                                />
                                {uploadFile && (
                                    <div className="upload-success">
                                        ✓ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                                    </div>
                                )}
                                <small className="emp-hint-text">Upload a CSV file with holiday names and dates</small>
                            </div>
                        </div>

                        {/* Form Footer */}
                        <div className="emp-form-footer">
                            <button type="button" className="emp-cancel-btn" onClick={() => { setView('list'); setUploadFile(null); }}>
                                Cancel
                            </button>
                            <button type="submit" className="emp-submit-btn" disabled={uploading}>
                                {uploading
                                    ? <><span className="emp-spinner" /> Uploading…</>
                                    : <><FaUpload size={12} /> Upload & Process</>
                                }
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Delete Modal ── */}
            {showDeleteModal && holidayToDelete && (
                <div className="emp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="emp-modal delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="emp-modal-icon"><FaTrashAlt size={24} /></div>
                        <h3 className="emp-modal-title">Delete Holiday</h3>
                        <p className="emp-modal-body">
                            You're about to permanently delete <strong>{holidayToDelete.name}</strong>.
                        </p>
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