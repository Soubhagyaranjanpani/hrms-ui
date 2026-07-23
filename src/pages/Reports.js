import React, { useState, useEffect, useCallback } from 'react';
import {
  FaFileExcel, FaFilePdf, FaEye, FaFilter, FaTimes,
  FaUsers, FaBuilding, FaClock, FaCalendarAlt,
  FaDownload, FaRedo, FaChartBar, FaSearch,
  FaTasks, FaRupeeSign, FaPrint, FaHome,
  FaChevronLeft, FaChevronRight, FaSyncAlt,
  FaColumns, FaTable, FaThLarge,FaChevronDown,FaChevronUp
} from 'react-icons/fa';
import { toast, ToastContainer } from '../components/Toast';
import axios from 'axios';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const [reportTypes, setReportTypes] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [favoriteReports, setFavoriteReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  const [filters, setFilters] = useState({
    reportType: '',
    startDate: '',
    endDate: '',
    statuses: [],
    employeeIds: [],
    departmentIds: [],
    month: '',
    year: new Date().getFullYear().toString(),
    sortBy: '',
    sortDirection: 'DESC',
    selectedColumns: [],
    searchTerm: '',
    additionalFilters: {}
  });

  const [visibleColumns, setVisibleColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.JWT_TOKEN)}`,
    'Content-Type': 'application/json',
  });

  const axiosConfig = { headers: getAuthHeaders() };

  useEffect(() => {
    fetchReportTypes();
    loadUserPreferences();
  }, []);

  const loadUserPreferences = () => {
    const saved = localStorage.getItem('report_preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      setFavoriteReports(prefs.favorites || []);
      setRecentReports(prefs.recent || []);
    }
  };

  const saveUserPreferences = () => {
    localStorage.setItem('report_preferences', JSON.stringify({
      favorites: favoriteReports,
      recent: recentReports.slice(0, 10)
    }));
  };

  const fetchReportTypes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/reports/types`, axiosConfig);
      const types = response.data || [];
      setReportTypes(types);
      if (types.length > 0 && !selectedReport) {
        handleReportTypeSelect(types[0]);
      }
    } catch (error) {
      toast.error('Error', 'Failed to load report types');
    }
  };

  const fetchFilterOptions = async (reportTypeConfig) => {
    const options = {};
    if (reportTypeConfig?.availableFilters) {
      for (const filter of reportTypeConfig.availableFilters) {
        if (filter.dataSource) {
          try {
            const response = await axios.get(`${BASE_URL}${filter.dataSource}`, axiosConfig);
            const data = response.data?.response || response.data?.data || response.data || [];
            options[filter.field] = Array.isArray(data) ? data : [];
          } catch (error) {
            options[filter.field] = [];
          }
        }
        if (filter.options) {
          options[filter.field] = filter.options;
        }
      }
    }
    setFilterOptions(options);
  };

  const getDefaultFiltersForReport = (reportTypeConfig) => {
    const defaultFilters = {};
    
    if (reportTypeConfig.type === 'ATTENDANCE' || 
        reportTypeConfig.type === 'attendance' ||
        reportTypeConfig.name?.toLowerCase().includes('attendance')) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      defaultFilters.startDate = firstDay.toISOString().split('T')[0];
      defaultFilters.endDate = lastDay.toISOString().split('T')[0];
      defaultFilters.month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      defaultFilters.year = today.getFullYear().toString();
    }
    
    return defaultFilters;
  };

  const handleReportTypeSelect = (reportTypeConfig) => {
    setSelectedReport(reportTypeConfig);
    
    const defaultFiltersForType = getDefaultFiltersForReport(reportTypeConfig);
    
    setFilters(prev => ({
      ...prev,
      reportType: reportTypeConfig.type,
      selectedColumns: reportTypeConfig.columns
        ?.filter(col => col.defaultVisible)
        ?.map(col => col.field) || [],
      ...defaultFiltersForType,
      startDate: defaultFiltersForType.startDate || '',
      endDate: defaultFiltersForType.endDate || '',
      month: defaultFiltersForType.month || '',
      year: defaultFiltersForType.year || '',
      statuses: [],
      employeeIds: [],
      departmentIds: [],
      searchTerm: '',
      additionalFilters: {}
    }));
    
    setReportData(null);
    setCurrentPage(0);
    setSearchTerm('');
    fetchFilterOptions(reportTypeConfig);
    
    setRecentReports(prev => {
      const filtered = prev.filter(r => r.type !== reportTypeConfig.type);
      return [{ type: reportTypeConfig.type, name: reportTypeConfig.name, timestamp: new Date() }, ...filtered];
    });
    saveUserPreferences();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateReport = async () => {
    if (!filters.reportType) {
      toast.warning('Warning', 'Please select a report type');
      return;
    }

    setLoading(true);
    
    const payload = {
      reportType: filters.reportType
    };
    
    if (filters.startDate) payload.startDate = filters.startDate;
    if (filters.endDate) payload.endDate = filters.endDate;
    if (filters.month) payload.month = filters.month;
    if (filters.year) payload.year = filters.year;
    if (filters.statuses && filters.statuses.length > 0) payload.statuses = filters.statuses;
    if (filters.employeeIds && filters.employeeIds.length > 0) payload.employeeIds = filters.employeeIds;
    if (filters.departmentIds && filters.departmentIds.length > 0) payload.departmentIds = filters.departmentIds;
    if (filters.sortBy) payload.sortBy = filters.sortBy;
    if (filters.sortDirection) payload.sortDirection = filters.sortDirection;
    if (filters.searchTerm) payload.searchTerm = filters.searchTerm;
    if (Object.keys(filters.additionalFilters).length > 0) payload.additionalFilters = filters.additionalFilters;
    
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}/api/reports/generate`, payload, {
        headers: getAuthHeaders()
      });
      
      setReportData(response.data);
      
      if (response.data.columns) {
        setVisibleColumns(response.data.columns.map(col => col.field));
      }
      
      toast.success('Success', `Generated ${response.data.summary?.totalRecords || 0} records`);
    } catch (error) {
      console.error('Error:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            'Failed to generate report';
        toast.error('Error', errorMessage);
      } else if (error.request) {
        toast.error('Error', 'No response from server');
      } else {
        toast.error('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!filters.reportType) {
      toast.warning('Warning', 'Please select a report type');
      return;
    }
    setDownloading(true);
    try {
      const endpoint = `${BASE_URL}/api/reports/download/${format}`;
      const response = await axios.post(endpoint, filters, { ...axiosConfig, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute('download', `${filters.reportType}_${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Success', `${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error('Error', `Failed to download ${format.toUpperCase()}`);
    } finally {
      setDownloading(false);
    }
  };

  const resetFilters = () => {
    const defaultFilters = getDefaultFiltersForReport(selectedReport || {});
    setFilters(prev => ({
      ...prev,
      startDate: defaultFilters.startDate || '',
      endDate: defaultFilters.endDate || '',
      statuses: [],
      employeeIds: [],
      departmentIds: [],
      month: defaultFilters.month || '',
      year: defaultFilters.year || '',
      sortBy: '',
      sortDirection: 'DESC',
      searchTerm: '',
      additionalFilters: {}
    }));
    setReportData(null);
    setCurrentPage(0);
    setSearchTerm('');
  };

  const toggleColumn = (field) => {
    setVisibleColumns(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const formatCellValue = (value, type) => {
    if (value === null || value === undefined) return '—';
    if (value === '') return '—';
    switch (type) {
      case 'DATE':
        try {
          if (typeof value === 'string' && value.includes('T')) {
            return new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
          }
          return value;
        } catch { return value; }
      case 'CURRENCY':
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
      case 'NUMBER':
        return typeof value === 'number' ? new Intl.NumberFormat('en-IN').format(value) : value;
      case 'BOOLEAN':
        return value === true || value === 'true' || value === 1 ? '✓' : '✗';
      default:
        return String(value);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    const s = status.toString().toUpperCase();
    if (['APPROVED', 'PRESENT', 'ACTIVE', 'COMPLETED', 'PAID', 'PROCESSED'].includes(s))
      return { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7' };
    if (['PENDING', 'IN_PROGRESS', 'HALF_DAY', 'LATE', 'PENDING_APPROVAL', 'IN_REVIEW'].includes(s))
      return { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' };
    if (['REJECTED', 'ABSENT', 'INACTIVE', 'FAILED', 'CANCELLED'].includes(s))
      return { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' };
    return { bg: '#eff6ff', color: '#1e40af', border: '#93c5fd' };
  };

  const getReportIcon = (iconName) => {
    const icons = {
      users: <FaUsers />, clock: <FaClock />, calendar: <FaCalendarAlt />,
      rupee: <FaRupeeSign />, tasks: <FaTasks />, building: <FaBuilding />,
      home: <FaHome />, chart: <FaChartBar />
    };
    return icons[iconName] || <FaChartBar />;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = (data) => {
    if (!sortField || !data) return data || [];
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === null) aVal = '';
      if (bVal === null) bVal = '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredData = getSortedData(reportData?.data?.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  })) || [];

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(0); }, [searchTerm]);

  const styles = {
    page: {
      padding: '0',
      background: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Inter', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    topBar: {
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    },
    topBarLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    topBarTitle: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#0f172a',
      letterSpacing: '-0.02em',
    },
    topBarSubtitle: {
      fontSize: '13px',
      color: '#64748b',
      marginTop: '2px',
    },
    content: {
      padding: '24px',
      maxWidth: '1440px',
      margin: '0 auto',
    },
    typeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '12px',
      marginBottom: '24px',
    },
    typeCard: (isSelected) => ({
      background: isSelected ? '#f0fdf4' : '#ffffff',
      border: isSelected ? '2px solid #22c55e' : '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      position: 'relative',
      boxShadow: isSelected ? '0 0 0 4px rgba(34, 197, 94, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
    }),
    typeIcon: {
      width: '44px',
      height: '44px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      flexShrink: 0,
    },
    typeLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    typeName: {
      fontSize: '15px',
      fontWeight: 600,
      color: '#0f172a',
      marginTop: '2px',
    },
    filterBar: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    },
    filterBarHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: showFilters ? '20px' : '0',
    },
    filterLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: '6px',
      display: 'block',
    },
    filterInput: {
      width: '100%',
      padding: '9px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#334155',
      background: '#ffffff',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box',
    },
    btn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      padding: '9px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap',
    },
    btnPrimary: {
      background: '#0f172a',
      color: '#ffffff',
    },
    btnSuccess: {
      background: '#059669',
      color: '#ffffff',
    },
    btnDanger: {
      background: '#dc2626',
      color: '#ffffff',
    },
    btnOutline: {
      background: '#ffffff',
      color: '#334155',
      border: '1px solid #e2e8f0',
    },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    },
    statCard: (borderColor) => ({
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderLeft: `4px solid ${borderColor || '#6366f1'}`,
      borderRadius: '10px',
      padding: '16px',
    }),
    statLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '4px',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 700,
      color: '#0f172a',
      lineHeight: 1,
    },
    statSub: {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '4px',
    },
    tableContainer: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
    },
    tableHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid #e2e8f0',
      flexWrap: 'wrap',
      gap: '12px',
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 14px',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      minWidth: '240px',
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '13px',
      color: '#334155',
      width: '100%',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px',
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: 600,
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: '#f8fafc',
      borderBottom: '2px solid #e2e8f0',
      whiteSpace: 'nowrap',
      position: 'sticky',
      top: 0,
      cursor: 'pointer',
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #f1f5f9',
      color: '#334155',
      whiteSpace: 'nowrap',
    },
    tr: (isEven) => ({
      background: isEven ? '#ffffff' : '#f8fafc',
    }),
    statusBadge: (status) => {
      const c = getStatusColor(status);
      return {
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        letterSpacing: '0.03em',
      };
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 20px',
      borderTop: '1px solid #e2e8f0',
      flexWrap: 'wrap',
      gap: '12px',
    },
    pageBtn: (active) => ({
      minWidth: '34px',
      height: '34px',
      borderRadius: '8px',
      border: active ? '1px solid #0f172a' : '1px solid #e2e8f0',
      background: active ? '#0f172a' : '#ffffff',
      color: active ? '#ffffff' : '#334155',
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s',
    }),
    columnToggle: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      padding: '12px 20px',
      borderBottom: '1px solid #e2e8f0',
      background: '#fafbfc',
    },
    columnChip: (active) => ({
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 500,
      cursor: 'pointer',
      border: active ? '1px solid #6366f1' : '1px solid #e2e8f0',
      background: active ? '#eef2ff' : '#ffffff',
      color: active ? '#4338ca' : '#64748b',
      transition: 'all 0.15s',
    }),
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modal: {
      background: '#ffffff',
      borderRadius: '16px',
      width: '95vw',
      maxWidth: '1400px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '20px 24px',
      borderBottom: '1px solid #e2e8f0',
    },
    modalBody: {
      flex: 1,
      overflow: 'auto',
      padding: '0',
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      padding: '16px 24px',
      borderTop: '1px solid #e2e8f0',
    },
    filterRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px',
      marginBottom: '20px',
    },
    filterRow2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
      marginBottom: '20px',
    },
    statusChipContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      background: '#ffffff',
      minHeight: '42px',
    },
    statusChip: (isSelected) => ({
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 500,
      border: isSelected ? 'none' : '1px solid #e2e8f0',
      background: isSelected ? '#6366f1' : '#ffffff',
      color: isSelected ? '#ffffff' : '#64748b',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }),
    filterActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid #e2e8f0',
    },
  };

  if (!reportTypes.length) return <LoadingSpinner message="Loading report configurations..." />;

  return (
    <div style={styles.page}>
      <ToastContainer />

      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <div>
            <div style={styles.topBarTitle}>Reports</div>
            <div style={styles.topBarSubtitle}>Generate & export data insights</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            style={{ ...styles.btn, ...styles.btnOutline }}
            onClick={resetFilters}
          >
            <FaSyncAlt size={12} /> Reset
          </button>
          {reportData && (
            <>
              <button
                style={{ ...styles.btn, ...styles.btnSuccess }}
                onClick={() => handleDownload('excel')}
                disabled={downloading}
              >
                <FaFileExcel size={13} /> Excel
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnDanger }}
                onClick={() => handleDownload('pdf')}
                disabled={downloading}
              >
                <FaFilePdf size={13} /> PDF
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnOutline }}
                onClick={() => setShowModal(true)}
              >
                <FaEye size={13} /> Full View
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.typeGrid}>
          {reportTypes.map(type => (
            <div
              key={type.type}
              style={styles.typeCard(selectedReport?.type === type.type)}
              onClick={() => handleReportTypeSelect(type)}
            >
              <div style={{
                ...styles.typeIcon,
                background: selectedReport?.type === type.type ? '#dcfce7' : '#f1f5f9',
                color: selectedReport?.type === type.type ? '#16a34a' : '#6366f1',
              }}>
                {getReportIcon(type.icon)}
              </div>
              <div>
                <div style={styles.typeLabel}>{type.type?.replace(/_/g, ' ')}</div>
                <div style={styles.typeName}>{type.name}</div>
              </div>
            </div>
          ))}
        </div>

        {selectedReport && (
          <div style={styles.filterBar}>
            <div style={styles.filterBarHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilter size={13} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  Filters
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  background: '#f1f5f9',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {selectedReport.name}
                </span>
              </div>
              <button
                style={{ ...styles.btn, ...styles.btnOutline, fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'}
              </button>
            </div>

            {showFilters && (
              <>
                {/* Row 1 - Basic Filters (4 columns) */}
                <div style={styles.filterRow}>
                  {/* Date Range */}
                  <div>
                    <label style={styles.filterLabel}>DATE RANGE</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        style={styles.filterInput}
                      />
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        style={styles.filterInput}
                      />
                    </div>
                  </div>

                  {/* Month */}
                  <div>
                    <label style={styles.filterLabel}>MONTH</label>
                    <input
                      type="month"
                      value={filters.month}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                      style={styles.filterInput}
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label style={styles.filterLabel}>YEAR</label>
                    <select
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      style={styles.filterInput}
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <label style={styles.filterLabel}>SEARCH</label>
                    <input
                      type="text"
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      placeholder="Search employee..."
                      style={styles.filterInput}
                    />
                  </div>
                </div>

                {/* Row 2 - Status & Sort (3 columns) */}
                <div style={styles.filterRow2}>
                  {/* Attendance Status */}
                  <div>
                    <label style={styles.filterLabel}>ATTENDANCE STATUS</label>
                    <div style={styles.statusChipContainer}>
                      {['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'].map(status => {
                        const isSelected = filters.statuses?.includes(status);
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              const current = filters.statuses || [];
                              const newStatuses = isSelected 
                                ? current.filter(s => s !== status)
                                : [...current, status];
                              handleFilterChange('statuses', newStatuses);
                            }}
                            style={styles.statusChip(isSelected)}
                          >
                            {status.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label style={styles.filterLabel}>SORT BY</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      style={styles.filterInput}
                    >
                      <option value="">Default</option>
                      <option value="employeeName">Employee Name</option>
                      <option value="date">Date</option>
                      <option value="status">Status</option>
                      <option value="checkIn">Check In Time</option>
                      <option value="checkOut">Check Out Time</option>
                    </select>
                  </div>

                  {/* Order */}
                  <div>
                    <label style={styles.filterLabel}>ORDER</label>
                    <select
                      value={filters.sortDirection}
                      onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
                      style={styles.filterInput}
                    >
                      <option value="DESC">Descending (Newest First)</option>
                      <option value="ASC">Ascending (Oldest First)</option>
                    </select>
                  </div>
                </div>
 
                {/* Action Buttons */}
                <div style={styles.filterActions}>
                  <button
                    style={{ ...styles.btn, ...styles.btnOutline }}
                    onClick={resetFilters}
                  >
                    <FaSyncAlt size={12} /> Reset Filters
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      background: '#0f172a',
                      color: '#ffffff',
                      padding: '10px 28px',
                      fontSize: '14px',
                    }}
                    onClick={handleGenerateReport}
                    disabled={loading}
                  >
                    {loading ? ( 
                      <><span className="emp-spinner" style={{ width: '14px', height: '14px', marginRight: '6px' }} /> Generating...</>
                    ) : (
                      <><FaChartBar size={13} /> Generate Report</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {reportData && (
          <>
            {reportData.summary?.statusCounts && Object.keys(reportData.summary.statusCounts).length > 0 && (
              <div style={styles.statsRow}>
                <div style={styles.statCard('#6366f1')}>
                  <div style={styles.statLabel}>Total Records</div>
                  <div style={styles.statValue}>{reportData.summary.totalRecords}</div>
                  <div style={styles.statSub}>All records</div>
                </div>
                {Object.entries(reportData.summary.statusCounts).map(([status, count]) => {
                  const c = getStatusColor(status);
                  return (
                    <div key={status} style={styles.statCard(c.border)}>
                      <div style={styles.statLabel}>{status.replace(/_/g, ' ')}</div>
                      <div style={{ ...styles.statValue, color: c.color }}>{count}</div>
                      <div style={styles.statSub}>
                        {reportData.summary.totalRecords > 0
                          ? `${Math.round((count / reportData.summary.totalRecords) * 100)}%`
                          : '0%'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.tableContainer}>
              <div style={styles.tableHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                    {reportData.reportName}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '3px 10px',
                    borderRadius: '12px',
                  }}>
                    {totalItems} records
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={styles.searchBox}>
                    <FaSearch size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Search results..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={styles.searchInput}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                      >
                        <FaTimes size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {reportData.columns?.length > 0 && (
                <div style={styles.columnToggle}>
                  <FaColumns size={11} style={{ color: '#94a3b8', marginRight: '4px', flexShrink: 0, marginTop: '5px' }} />
                  {reportData.columns.map(col => (
                    <div
                      key={col.field}
                      style={styles.columnChip(visibleColumns.includes(col.field))}
                      onClick={() => toggleColumn(col.field)}
                    >
                      {col.header}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '48px', textAlign: 'center' }}>#</th>
                      {reportData.columns
                        ?.filter(col => visibleColumns.includes(col.field))
                        .map(col => (
                          <th key={col.field} style={styles.th} onClick={() => handleSort(col.field)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {col.header}
                              {sortField === col.field && (
                                sortDirection === 'asc' ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />
                              )}
                            </div>
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <tr
                          key={index}
                          style={styles.tr(index % 2 === 0)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f8fafc'; }}
                        >
                          <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', fontWeight: 500 }}>
                            {startIndex + index + 1}
                          </td>
                          {reportData.columns
                            ?.filter(col => visibleColumns.includes(col.field))
                            .map(col => (
                              <td key={col.field} style={styles.td}>
                                {col.type === 'STATUS' ? (
                                  <span style={styles.statusBadge(row[col.field])}>
                                    {row[col.field] ? String(row[col.field]).replace(/_/g, ' ') : '—'}
                                  </span>
                                ) : col.type === 'BOOLEAN' ? (
                                  <span style={{
                                    color: row[col.field] ? '#16a34a' : '#dc2626',
                                    fontWeight: 600,
                                    fontSize: '16px',
                                  }}>
                                    {row[col.field] ? '✓' : '✗'}
                                  </span>
                                ) : col.type === 'CURRENCY' ? (
                                  <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>
                                    {formatCellValue(row[col.field], col.type)}
                                  </span>
                                ) : (
                                  formatCellValue(row[col.field], col.type)
                                )}
                              </td>
                            ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={visibleColumns.length + 1}
                          style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}
                        >
                          <FaSearch size={24} style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                          <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
                            {searchTerm ? 'No matching results' : 'No data available'}
                          </div>
                          <div style={{ fontSize: '13px' }}>
                            {searchTerm ? 'Try adjusting your search terms' : 'Try adjusting your filters'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <div style={styles.pagination}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Showing <strong>{startIndex + 1}</strong>–<strong>{Math.min(startIndex + rowsPerPage, totalItems)}</strong> of <strong>{totalItems}</strong>
                    </span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(0); }}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      style={styles.pageBtn(false)}
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <FaChevronLeft size={10} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) pageNum = i;
                      else if (currentPage < 4) pageNum = i;
                      else if (currentPage > totalPages - 5) pageNum = totalPages - 7 + i;
                      else pageNum = currentPage - 3 + i;
                      return (
                        <button
                          key={pageNum}
                          style={styles.pageBtn(currentPage === pageNum)}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    <button
                      style={styles.pageBtn(false)}
                      disabled={currentPage + 1 >= totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <FaChevronRight size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showModal && reportData && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {reportData.reportName}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {reportData.summary?.totalRecords || 0} records · Generated {new Date(reportData.generatedAt).toLocaleString()}
                </div>
                {reportData.summary?.statusCounts && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {Object.entries(reportData.summary.statusCounts).map(([status, count]) => {
                      const c = getStatusColor(status);
                      return (
                        <span key={status} style={{
                          ...styles.statusBadge(status),
                          fontSize: '12px',
                          padding: '5px 12px',
                        }}>
                          {status.replace(/_/g, ' ')}: {count}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '48px', textAlign: 'center' }}>#</th>
                      {reportData.columns.map(col => (
                        <th key={col.field} style={styles.th}>{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map((row, index) => (
                      <tr key={index} style={styles.tr(index % 2 === 0)}>
                        <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>
                          {index + 1}
                        </td>
                        {reportData.columns.map(col => (
                          <td key={col.field} style={styles.td}>
                            {col.type === 'STATUS' ? (
                              <span style={styles.statusBadge(row[col.field])}>
                                {row[col.field] ? String(row[col.field]).replace(/_/g, ' ') : '—'}
                              </span>
                            ) : (
                              formatCellValue(row[col.field], col.type)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.btn, ...styles.btnOutline }}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnSuccess }}
                onClick={() => handleDownload('excel')}
              >
                <FaFileExcel size={13} /> Export Excel
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnDanger }}
                onClick={() => handleDownload('pdf')}
              >
                <FaFilePdf size={13} /> Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;