
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaSearch, FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, 
  FaTimes, FaEye, FaArrowLeft, FaPrint, FaFileExport,
  FaUser, FaPhone, FaEnvelope, FaCalendarCheck, FaIdCard,
  FaClock, FaCheckCircle, FaArrowUp, FaExchangeAlt, FaGraduationCap,
  FaTrophy, FaRupeeSign, FaGavel, FaUserPlus, FaUserCheck,
  FaHistory, FaFileAlt, FaChartLine, FaUsers, FaFilter,
  FaThList, FaColumns, FaUserCircle, FaChartPie, FaCalendarWeek,
  FaAward, FaCheckDouble, FaDownload, FaShareAlt,
  FaChevronLeft, FaChevronRight, FaDotCircle, FaUserGraduate,
  FaSpinner, FaMapMarkerAlt,FaClipboardList 
} from 'react-icons/fa';
import { toast } from '../components/Toast';
import LoadingSpinner from "../components/LoadingSpinner";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const ServiceBookTimeline = ({ employeeId, onCancel }) => {
  // ============================================
  // STATE
  // ============================================
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [view, setView] = useState('table');
  const [activeTab, setActiveTab] = useState('timeline');
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  
  const [filters, setFilters] = useState({
    employeeName: '',
    employeeCode: '',
    department: '',
    designation: '',
    branch: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    eventType: 'all',
    search: ''
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [animateTimeline, setAnimateTimeline] = useState(false);
  const [searchStats, setSearchStats] = useState({
    totalEmployees: 0,
    filteredCount: 0,
    searchTime: '0ms'
  });

  // ============================================
  // DUMMY DATA
  // ============================================
  const DUMMY_EMPLOYEES = [
    { id: 1, code: 'EMP001', name: 'John Doe', department: 'IT', designation: 'Software Engineer', joiningDate: '2023-02-15', status: 'Active', email: 'john.doe@company.com', phone: '+91 98765 43210', dob: '1998-06-20', gender: 'Male', experience: '2 Years', location: 'Noida', branch: 'Noida', grade: 'L1' },
    { id: 2, code: 'EMP002', name: 'Jane Smith', department: 'HR', designation: 'HR Manager', joiningDate: '2019-06-10', status: 'Active', email: 'jane.smith@company.com', phone: '+91 98765 43211', dob: '1988-08-22', gender: 'Female', experience: '8 Years', location: 'Mumbai', branch: 'Mumbai', grade: 'L4' },
    { id: 3, code: 'EMP003', name: 'Mike Johnson', department: 'IT', designation: 'Senior Developer', joiningDate: '2020-08-01', status: 'Active', email: 'mike.johnson@company.com', phone: '+91 98765 43212', dob: '1992-11-30', gender: 'Male', experience: '5 Years', location: 'Bangalore', branch: 'Bangalore', grade: 'L3' },
    { id: 4, code: 'EMP004', name: 'Sarah Williams', department: 'Sales', designation: 'Sales Manager', joiningDate: '2018-03-15', status: 'Active', email: 'sarah.williams@company.com', phone: '+91 98765 43213', dob: '1990-07-18', gender: 'Female', experience: '7 Years', location: 'Delhi', branch: 'Delhi', grade: 'L4' },
    { id: 5, code: 'EMP005', name: 'Ashish Sinha', department: 'IT', designation: 'Senior Business Analyst', joiningDate: '2020-04-01', status: 'Active', email: 'ashish.sinha@company.com', phone: '+91 98765 43210', dob: '1990-05-15', gender: 'Male', experience: '5 Years', location: 'Noida', branch: 'Noida', grade: 'L3' },
    { id: 6, code: 'EMP006', name: 'Priya Sharma', department: 'HR', designation: 'HR Manager', joiningDate: '2019-06-10', status: 'Active', email: 'priya.sharma@company.com', phone: '+91 98765 43211', dob: '1988-08-22', gender: 'Female', experience: '8 Years', location: 'Mumbai', branch: 'Mumbai', grade: 'L4' },
    { id: 7, code: 'EMP007', name: 'Rahul Verma', department: 'IT', designation: 'Tech Lead', joiningDate: '2018-03-20', status: 'Active', email: 'rahul.verma@company.com', phone: '+91 98765 43212', dob: '1992-11-30', gender: 'Male', experience: '7 Years', location: 'Bangalore', branch: 'Bangalore', grade: 'L4' },
    { id: 8, code: 'EMP008', name: 'Sneha Patel', department: 'Sales', designation: 'Sales Manager', joiningDate: '2010-08-01', status: 'Inactive', email: 'sneha.patel@company.com', phone: '+91 98765 43213', dob: '1985-03-10', gender: 'Female', experience: '15 Years', location: 'Delhi', branch: 'Delhi', grade: 'L5' },
    { id: 9, code: 'EMP009', name: 'Vikram Singh', department: 'Finance', designation: 'Senior Accountant', joiningDate: '2016-01-10', status: 'Active', email: 'vikram.singh@company.com', phone: '+91 98765 43214', dob: '1995-07-25', gender: 'Male', experience: '9 Years', location: 'Pune', branch: 'Pune', grade: 'L3' },
    { id: 10, code: 'EMP010', name: 'Ananya Reddy', department: 'Marketing', designation: 'Marketing Manager', joiningDate: '2021-09-15', status: 'Active', email: 'ananya.reddy@company.com', phone: '+91 98765 43215', dob: '1993-12-01', gender: 'Female', experience: '4 Years', location: 'Hyderabad', branch: 'Hyderabad', grade: 'L4' },
    { id: 11, code: 'EMP011', name: 'Arjun Nair', department: 'IT', designation: 'DevOps Engineer', joiningDate: '2022-01-20', status: 'Active', email: 'arjun.nair@company.com', phone: '+91 98765 43216', dob: '1991-09-12', gender: 'Male', experience: '3 Years', location: 'Chennai', branch: 'Chennai', grade: 'L2' },
    { id: 12, code: 'EMP012', name: 'Meera Iyer', department: 'HR', designation: 'HR Executive', joiningDate: '2020-11-01', status: 'Inactive', email: 'meera.iyer@company.com', phone: '+91 98765 43217', dob: '1994-04-18', gender: 'Female', experience: '5 Years', location: 'Kolkata', branch: 'Kolkata', grade: 'L2' }
  ];

  const DUMMY_EVENTS = {
    1: [
      { id: 1, type: 'appointment', title: 'Appointment as Business Analyst', description: 'Appointed as Business Analyst in IT department', date: '2020-04-01', referenceNo: 'APP-2020-001', sourceModule: 'HRMS', approvedBy: 'Rajesh Kumar', remarks: 'Joined as per offer letter' },
      { id: 2, type: 'confirmation', title: 'Probation Confirmation', description: 'Probation period completed successfully', date: '2020-10-15', referenceNo: 'CONF-2020-010', sourceModule: 'HRMS', approvedBy: 'Amit Sharma', remarks: 'Performance satisfactory' },
      { id: 3, type: 'promotion', title: 'Promotion to Senior Business Analyst', description: 'Promoted from Business Analyst to Senior Business Analyst', date: '2022-04-01', referenceNo: 'PRO-2022-005', sourceModule: 'HRMS', approvedBy: 'Director IT', remarks: 'Based on annual appraisal' },
      { id: 4, type: 'training', title: 'SAP Functional Training', description: 'Completed SAP Functional Training Program', date: '2022-07-10', referenceNo: 'TRN-2022-012', sourceModule: 'Training', approvedBy: 'L&D Head', remarks: 'Certified with A grade' },
      { id: 5, type: 'transfer', title: 'Transfer to Noida Branch', description: 'Transferred from Mumbai to Noida branch', date: '2023-01-01', referenceNo: 'TRF-2023-003', sourceModule: 'HRMS', approvedBy: 'VP Operations', remarks: 'On request transfer' },
      { id: 6, type: 'payRevision', title: 'Annual Salary Revision', description: 'Performance-based salary increment of 15%', date: '2024-04-01', referenceNo: 'PAY-2024-008', sourceModule: 'Payroll', approvedBy: 'Finance Head', remarks: 'Exceeds expectations rating' },
      { id: 7, type: 'award', title: 'Employee Excellence Award', description: 'Received Employee Excellence Award for outstanding performance', date: '2024-08-15', referenceNo: 'AWD-2024-003', sourceModule: 'HRMS', approvedBy: 'CEO', remarks: 'Annual award ceremony' },
      { id: 8, type: 'retirement', title: 'Superannuation Retirement', description: 'Retirement after 18 years of dedicated service', date: '2038-04-01', referenceNo: 'RET-2038-001', sourceModule: 'HRMS', approvedBy: 'Board', remarks: 'With full benefits' }
    ],
    2: [
      { id: 9, type: 'appointment', title: 'Appointment as HR Executive', description: 'Appointed as HR Executive in HR department', date: '2019-06-10', referenceNo: 'APP-2019-015', sourceModule: 'HRMS', approvedBy: 'HR Director', remarks: 'Campus recruitment' },
      { id: 10, type: 'confirmation', title: 'Probation Confirmation', description: 'Probation period completed successfully', date: '2019-12-10', referenceNo: 'CONF-2019-025', sourceModule: 'HRMS', approvedBy: 'HR Head', remarks: 'All KPIs met' },
      { id: 11, type: 'promotion', title: 'Promotion to HR Manager', description: 'Promoted from HR Executive to HR Manager', date: '2021-03-15', referenceNo: 'PRO-2021-012', sourceModule: 'HRMS', approvedBy: 'VP HR', remarks: 'Exceptional leadership' },
      { id: 12, type: 'training', title: 'Leadership Development Program', description: 'Completed Advanced Leadership Program', date: '2022-05-20', referenceNo: 'TRN-2022-008', sourceModule: 'Training', approvedBy: 'L&D Head', remarks: 'IIM Ahmedabad' },
      { id: 13, type: 'award', title: 'Best HR Manager Award', description: 'Received Best HR Manager Award for 2022', date: '2022-12-15', referenceNo: 'AWD-2022-005', sourceModule: 'HRMS', approvedBy: 'CEO', remarks: 'Excellence in HR practices' }
    ],
    3: [
      { id: 14, type: 'appointment', title: 'Appointment as Software Engineer', description: 'Appointed as Software Engineer in IT department', date: '2018-03-20', referenceNo: 'APP-2018-042', sourceModule: 'HRMS', approvedBy: 'CTO', remarks: 'Lateral hire' },
      { id: 15, type: 'confirmation', title: 'Probation Confirmation', description: 'Probation period completed successfully', date: '2018-09-20', referenceNo: 'CONF-2018-056', sourceModule: 'HRMS', approvedBy: 'Project Manager', remarks: 'Good technical skills' },
      { id: 16, type: 'promotion', title: 'Promotion to Senior Developer', description: 'Promoted from Software Engineer to Senior Developer', date: '2020-06-01', referenceNo: 'PRO-2020-018', sourceModule: 'HRMS', approvedBy: 'Tech Head', remarks: 'Outstanding contribution' },
      { id: 17, type: 'promotion', title: 'Promotion to Tech Lead', description: 'Promoted to Tech Lead - Team Management role', date: '2022-10-15', referenceNo: 'PRO-2022-025', sourceModule: 'HRMS', approvedBy: 'CTO', remarks: 'Leadership potential' },
      { id: 18, type: 'training', title: 'AWS Cloud Architecture', description: 'Completed AWS Cloud Architecture Certification', date: '2021-11-20', referenceNo: 'TRN-2021-030', sourceModule: 'Training', approvedBy: 'L&D', remarks: 'AWS Certified Solutions Architect' }
    ],
    4: [
      { id: 19, type: 'appointment', title: 'Appointment as Sales Executive', description: 'Appointed as Sales Executive in Sales department', date: '2010-08-01', referenceNo: 'APP-2010-008', sourceModule: 'HRMS', approvedBy: 'Sales Head', remarks: 'Experienced hire' },
      { id: 20, type: 'promotion', title: 'Promotion to Sales Manager', description: 'Promoted from Sales Executive to Sales Manager', date: '2015-03-01', referenceNo: 'PRO-2015-012', sourceModule: 'HRMS', approvedBy: 'VP Sales', remarks: 'Consistent top performer' },
      { id: 21, type: 'award', title: 'Top Performer Award', description: 'Received Top Performer Award for 2019', date: '2019-12-20', referenceNo: 'AWD-2019-005', sourceModule: 'HRMS', approvedBy: 'CEO', remarks: 'Highest revenue generated' },
      { id: 22, type: 'retirement', title: 'Voluntary Retirement', description: 'Voluntary retirement after 14 years of service', date: '2024-03-15', referenceNo: 'RET-2024-002', sourceModule: 'HRMS', approvedBy: 'Board', remarks: 'Personal reasons' }
    ],
    5: [
      { id: 23, type: 'appointment', title: 'Appointment as Accountant', description: 'Appointed as Accountant in Finance department', date: '2016-01-10', referenceNo: 'APP-2016-003', sourceModule: 'HRMS', approvedBy: 'CFO', remarks: 'CA qualified' },
      { id: 24, type: 'confirmation', title: 'Probation Confirmation', description: 'Probation period completed successfully', date: '2016-07-10', referenceNo: 'CONF-2016-008', sourceModule: 'HRMS', approvedBy: 'Finance Head', remarks: 'Good analytical skills' },
      { id: 25, type: 'promotion', title: 'Promotion to Senior Accountant', description: 'Promoted from Accountant to Senior Accountant', date: '2020-06-15', referenceNo: 'PRO-2020-012', sourceModule: 'HRMS', approvedBy: 'CFO', remarks: 'Exceeding expectations' },
      { id: 26, type: 'award', title: 'Best Financial Analyst', description: 'Received Best Financial Analyst Award for 2021', date: '2021-12-20', referenceNo: 'AWD-2021-007', sourceModule: 'HRMS', approvedBy: 'CEO', remarks: 'Cost saving initiatives' }
    ],
    6: [
      { id: 27, type: 'appointment', title: 'Appointment as Marketing Executive', description: 'Appointed as Marketing Executive in Marketing department', date: '2021-09-15', referenceNo: 'APP-2021-025', sourceModule: 'HRMS', approvedBy: 'CMO', remarks: 'MBA from IIM' },
      { id: 28, type: 'confirmation', title: 'Probation Confirmation', description: 'Probation period completed successfully', date: '2022-03-15', referenceNo: 'CONF-2022-018', sourceModule: 'HRMS', approvedBy: 'Marketing Head', remarks: 'Creative approach' },
      { id: 29, type: 'promotion', title: 'Promotion to Marketing Manager', description: 'Promoted from Marketing Executive to Marketing Manager', date: '2023-09-15', referenceNo: 'PRO-2023-015', sourceModule: 'HRMS', approvedBy: 'CMO', remarks: 'Outstanding campaigns' }
    ],
    7: [
      { id: 30, type: 'appointment', title: 'Appointment as DevOps Engineer', description: 'Appointed as DevOps Engineer in IT department', date: '2022-01-20', referenceNo: 'APP-2022-005', sourceModule: 'HRMS', approvedBy: 'CTO', remarks: 'AWS & Kubernetes expert' },
      { id: 31, type: 'confirmation', title: 'Probation Confirmation', description: 'Probation period completed successfully', date: '2022-07-20', referenceNo: 'CONF-2022-022', sourceModule: 'HRMS', approvedBy: 'Tech Lead', remarks: 'Quick learner' }
    ],
    8: [
      { id: 32, type: 'appointment', title: 'Appointment as HR Executive', description: 'Appointed as HR Executive in HR department', date: '2020-11-01', referenceNo: 'APP-2020-035', sourceModule: 'HRMS', approvedBy: 'HR Head', remarks: 'MBA HR' },
      { id: 33, type: 'confirmation', title: 'Probation Confirmation', description: 'Probation period completed successfully', date: '2021-05-01', referenceNo: 'CONF-2021-012', sourceModule: 'HRMS', approvedBy: 'HR Manager', remarks: 'Good interpersonal skills' },
      { id: 34, type: 'retirement', title: 'Voluntary Retirement', description: 'Voluntary retirement due to personal reasons', date: '2024-01-15', referenceNo: 'RET-2024-001', sourceModule: 'HRMS', approvedBy: 'Board', remarks: 'Relocation abroad' }
    ]
  };

  const eventTypes = [
    { value: 'all', label: 'All Events', color: '#6b7280', bg: '#f3f4f6' },
    { value: 'appointment', label: 'Appointment', icon: <FaUserPlus size={14} />, color: '#4f46e5', bg: '#e0e7ff' },
    { value: 'confirmation', label: 'Confirmation', icon: <FaUserCheck size={14} />, color: '#10b981', bg: '#d1fae5' },
    { value: 'promotion', label: 'Promotion', icon: <FaArrowUp size={14} />, color: '#f59e0b', bg: '#fed7aa' },
    { value: 'transfer', label: 'Transfer', icon: <FaExchangeAlt size={14} />, color: '#06b6d4', bg: '#cffafe' },
    { value: 'training', label: 'Training', icon: <FaGraduationCap size={14} />, color: '#8b5cf6', bg: '#ede9fe' },
    { value: 'award', label: 'Award', icon: <FaTrophy size={14} />, color: '#ef4444', bg: '#fee2e2' },
    { value: 'payRevision', label: 'Pay Revision', icon: <FaRupeeSign size={14} />, color: '#ec489a', bg: '#fce7f3' },
    { value: 'disciplinary', label: 'Disciplinary', icon: <FaGavel size={14} />, color: '#dc2626', bg: '#fecaca' },
    { value: 'retirement', label: 'Retirement', icon: <FaClock size={14} />, color: '#64748b', bg: '#f1f5f9' }
  ];

  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations'];
  const designations = ['Software Engineer', 'Senior Developer', 'Tech Lead', 'HR Manager', 'Sales Manager', 'Accountant', 'Marketing Manager', 'Operations Manager', 'Product Manager', 'Senior Business Analyst', 'DevOps Engineer', 'HR Executive'];
  const statuses = ['Active', 'Inactive'];
  const branches = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Noida', 'Ahmedabad', 'Jaipur'];

  // ============================================
  // DEBOUNCE VALUES
  // ============================================
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedEmployeeName = useDebounce(filters.employeeName, 500);
  const debouncedEmployeeCode = useDebounce(filters.employeeCode, 500);

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchEmployees = useCallback(async (pageNum = 0) => {
    setSearchLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      let filtered = [...DUMMY_EMPLOYEES];
      
      if (debouncedSearchTerm) {
        const search = debouncedSearchTerm.toLowerCase();
        filtered = filtered.filter(emp => 
          emp.name.toLowerCase().includes(search) || 
          emp.code.toLowerCase().includes(search) ||
          emp.department.toLowerCase().includes(search) ||
          emp.designation.toLowerCase().includes(search)
        );
      }
      if (debouncedEmployeeCode) {
        filtered = filtered.filter(emp => 
          emp.code.toLowerCase().includes(debouncedEmployeeCode.toLowerCase())
        );
      }
      if (debouncedEmployeeName) {
        filtered = filtered.filter(emp => 
          emp.name.toLowerCase().includes(debouncedEmployeeName.toLowerCase())
        );
      }
      if (filters.department) {
        filtered = filtered.filter(emp => 
          emp.department.toLowerCase() === filters.department.toLowerCase()
        );
      }
      if (filters.designation) {
        filtered = filtered.filter(emp => 
          emp.designation.toLowerCase() === filters.designation.toLowerCase()
        );
      }
      if (filters.branch) {
        filtered = filtered.filter(emp => 
          (emp.location?.toLowerCase() === filters.branch.toLowerCase() ||
           emp.branch?.toLowerCase() === filters.branch.toLowerCase())
        );
      }
      if (filters.status) {
        filtered = filtered.filter(emp => 
          emp.status.toLowerCase() === filters.status.toLowerCase()
        );
      }
      
      const start = pageNum * rowsPerPage;
      const paginatedResults = filtered.slice(start, start + rowsPerPage);
      
      setSearchResults(paginatedResults);
      setTotalItems(filtered.length);
      setTotalPages(Math.ceil(filtered.length / rowsPerPage));
      setHasSearched(true);
      setSearchStats({
        totalEmployees: filtered.length,
        filteredCount: paginatedResults.length,
        searchTime: `${Math.round(Math.random() * 50 + 10)}ms`
      });
    } catch (error) {
      toast.error('Error', 'Failed to fetch employees');
    } finally {
      setSearchLoading(false);
    }
  }, [debouncedSearchTerm, debouncedEmployeeCode, debouncedEmployeeName, filters]);

  useEffect(() => setEmployees(DUMMY_EMPLOYEES), []);

  useEffect(() => {
    const hasFilters = debouncedSearchTerm || debouncedEmployeeCode || debouncedEmployeeName || 
                       filters.department || filters.designation || filters.branch || filters.status;
    if (hasFilters || showAllEmployees) {
      fetchEmployees(0);
      setPage(0);
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setTotalItems(0);
      setTotalPages(0);
    }
  }, [debouncedSearchTerm, debouncedEmployeeCode, debouncedEmployeeName, filters, showAllEmployees, fetchEmployees]);

  // Timeline events filter
  useEffect(() => {
    if (!showDetails) return;
    let filtered = [...timelineEvents];
    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(search) || 
        event.description.toLowerCase().includes(search) ||
        event.referenceNo.toLowerCase().includes(search)
      );
    }
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(event => event.type === filters.eventType);
    }
    if (filters.dateFrom) filtered = filtered.filter(event => event.date >= filters.dateFrom);
    if (filters.dateTo) filtered = filtered.filter(event => event.date <= filters.dateTo);
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredEvents(filtered);
    setPage(0);
  }, [timelineEvents, filters, showDetails]);

  // ============================================
  // HANDLERS
  // ============================================
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      fetchEmployees(newPage);
    }
  };

  const handleShowAll = () => {
    setShowAllEmployees(true);
    setSearchTerm('');
    setFilters({
      employeeName: '', employeeCode: '', department: '', designation: '', branch: '',
      status: '', dateFrom: '', dateTo: '', eventType: 'all', search: ''
    });
    fetchEmployees(0);
    setPage(0);
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setTimelineEvents(DUMMY_EVENTS[employee.id] || []);
    setFilteredEvents(DUMMY_EVENTS[employee.id] || []);
    setShowDetails(true);
    setFilters({
      employeeName: '', employeeCode: '', department: '', designation: '', branch: '',
      status: '', dateFrom: '', dateTo: '', eventType: 'all', search: ''
    });
    setPage(0);
    setTimeout(() => setAnimateTimeline(true), 100);
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
    setTimelineEvents([]);
    setFilteredEvents([]);
    setAnimateTimeline(false);
  };

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

  const handleClearFilters = () => {
    setFilters({
      employeeName: '', employeeCode: '', department: '', designation: '', branch: '',
      status: '', dateFrom: '', dateTo: '', eventType: 'all', search: ''
    });
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
    setShowAllEmployees(false);
    setTotalItems(0);
    setTotalPages(0);
    setPage(0);
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCancel = () => { if (onCancel) onCancel(); };
  const handlePrint = () => window.print();
  const handleExport = () => toast.success('Export', 'Service book exported successfully');

  // ============================================
  // PAGINATION
  // ============================================
  const displayItems = showDetails ? filteredEvents : searchResults;
  const totalItemsDisplay = showDetails ? filteredEvents.length : totalItems;
  const totalPagesDisplay = showDetails ? Math.ceil(filteredEvents.length / rowsPerPage) : totalPages;
  const startIndex = page * rowsPerPage;
  const currentItems = showDetails ? displayItems.slice(startIndex, startIndex + rowsPerPage) : displayItems;

  const getPaginationRange = () => {
    const delta = 2, range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPagesDisplay - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPagesDisplay - 1) { if (right < totalPagesDisplay - 2) range.push('...'); range.push(totalPagesDisplay - 1); }
    return range;
  };

  // ============================================
  // HELPERS
  // ============================================
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getEventTypeInfo = (type) => eventTypes.find(t => t.value === type) || eventTypes[0];
  const getEventIcon = (type) => { const info = getEventTypeInfo(type); return info.icon || <FaDotCircle size={14} />; };

  const getStatusBadge = (status) => {
    const styles = {
      Active: { bg: '#d1fae5', color: '#065f46', label: 'Active', dot: '#10b981' },
      Inactive: { bg: '#fee2e2', color: '#dc2626', label: 'Inactive', dot: '#ef4444' }
    };
    const style = styles[status] || styles.Active;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 14px', borderRadius: '20px', background: style.bg, color: style.color, fontSize: '12px', fontWeight: '600', letterSpacing: '0.02em' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: style.dot, marginRight: '7px', display: 'inline-block', boxShadow: `0 0 6px ${style.dot}` }} />
        {style.label}
      </span>
    );
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const highlightText = (text, search) => {
    if (!search || !text) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => regex.test(part) ? <span key={i} style={{ background: '#fef3c7', color: '#92400e', padding: '0 3px', borderRadius: '3px', fontWeight: '600' }}>{part}</span> : part);
  };

  // ============================================
  // STYLES
  // ============================================
  const styles = {
    container: { padding: '24px 28px', background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f2f8 100%)', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
    headerCard: { background: 'white', borderRadius: '20px', padding: '20px 28px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e8ecf1' },
    headerTitle: { fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-0.03em' },
    headerSubtitle: { fontSize: '14px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' },
    iconContainer: { width: '52px', height: '52px', background: 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' },
    filterCard: { background: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8ecf1' },
    statIcon: (color) => ({ width: '44px', height: '44px', borderRadius: '14px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, fontSize: '20px' }),
    tableCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8ecf1' },
    tableHeader: { background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '2px solid #e2e8f0' },
    tableHeaderCell: { padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' },
    tableRow: { transition: 'all 0.2s ease', cursor: 'pointer' },
    tableCell: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' },
    actionBtn: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9d174d', transition: 'all 0.2s ease' },
    primaryBtn: { padding: '10px 22px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
    secondaryBtn: { padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
    modalCard: { background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '540px', width: '100%', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' },
    timelineVertical: { position: 'relative', paddingLeft: '40px' },
    timelineDot: (color) => ({ position: 'absolute', left: '-8px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: color, border: '3px solid white', boxShadow: `0 0 0 3px ${color}30` }),
    timelineLine: { position: 'absolute', left: '0px', top: '24px', bottom: '-16px', width: '2px', background: 'linear-gradient(180deg, #9d174d 0%, #e2e8f0 100%)' },
    employeeCard: { background: 'white', borderRadius: '20px', padding: '24px 28px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e8ecf1' },
    kanbanCard: { background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8ecf1', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' },
  };

  if (loading) return <LoadingSpinner message="Loading Service Book..." />;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .timeline-item { animation: slideInRight 0.5s ease forwards; opacity: 0; }
        .timeline-item:nth-child(1) { animation-delay: 0.1s; }
        .timeline-item:nth-child(2) { animation-delay: 0.2s; }
        .timeline-item:nth-child(3) { animation-delay: 0.3s; }
        .timeline-item:nth-child(4) { animation-delay: 0.4s; }
        .timeline-item:nth-child(5) { animation-delay: 0.5s; }
        .timeline-item:nth-child(6) { animation-delay: 0.6s; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(99,102,241,0.15) !important; }
        input:focus, select:focus { border-color: #9d174d !important; box-shadow: 0 0 0 4px rgba(99,102,241,0.1) !important; background: white !important; }
        .filter-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; }
        .filter-input { width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: #f8fafc; transition: all 0.3s ease; font-family: "'Inter', sans-serif"; }
        .filter-input:focus { border-color: #9d174d; background: white; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        .cert-status-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; display: inline-block; }
        .cert-table-row-hover:hover { background-color: #f9fafb; transition: background-color 0.2s ease; }
        .search-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } }
      `}</style>

      {/* HEADER */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={styles.iconContainer}><FaHistory size={20} /></div>
            <div>
              <h1 style={styles.headerTitle}>Service Book Timeline</h1>
              <p style={styles.headerSubtitle}>
                {showDetails ? `📋 Viewing complete service history for ${selectedEmployee?.name}` : 
                 hasSearched ? `🔍 ${totalItems.toLocaleString()} employee${totalItems !== 1 ? 's' : ''} found` : 
                 'Search employees to view service history'}
              </p>
            </div>
          </div>
          {showDetails && (
            <button onClick={handleBackToList} style={styles.secondaryBtn}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9d174d'; e.currentTarget.style.color = '#9d174d'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}>
              <FaArrowLeft size={12} /> Back to List
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      {!showDetails ? (
        <>
          {/* FILTER SECTION */}
          <div style={styles.filterCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
               <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>
                           <FaFilter style={{ marginRight: '8px' }} /> Filters
                         </div>
                         
                {hasSearched && (
                  <span style={{ fontSize: '12px', color: '#9d174d', background: '#eef2ff', padding: '3px 12px', borderRadius: '12px', fontWeight: '500' }}>
                    {totalItems.toLocaleString()} results • {searchStats.searchTime}
                  </span>
                )}
                {searchLoading && <FaSpinner className="search-spinner" size={16} color="#9d174d" />}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!showAllEmployees && (
                  <button onClick={handleShowAll} style={{ padding: '6px 14px', fontSize: '12px', color: '#9d174d', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e0e7ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#eef2ff'; }}>
                    <FaUsers size={10} /> Show All
                  </button>
                  
                )}
                 <button onClick={() => {
                    if (searchTerm.length >= 2 || searchTerm.length === 0) setSearchTerm(searchTerm);
                    else toast.warning('Minimum 2 characters required for search');
                  }} style={{ padding: '9px 16px', background: 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', height: '38px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.3)'; }}>
                    <FaSearch size={13} /> Search
                  </button>
                {(hasSearched || searchTerm) && (
                  <button onClick={handleClearFilters} style={{ padding: '6px 14px', fontSize: '12px', color: '#ef4444', background: 'transparent', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <FaTimes size={10} /> Clear All
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Employee Code */}
              <div>
                <label className="filter-label">Employee Code</label>
                <input type="text" className="filter-input" placeholder="e.g., EMP001" value={filters.employeeCode} onChange={(e) => handleFilterChange('employeeCode', e.target.value)} />
              </div>
              
              {/* Employee Name */}
              <div>
                <label className="filter-label">Employee Name</label>
                <input type="text" className="filter-input" placeholder="Enter name..." value={filters.employeeName} onChange={(e) => handleFilterChange('employeeName', e.target.value)} />
              </div>
              
              {/* Department */}
              <div>
                <label className="filter-label">Department</label>
                <select className="filter-input" value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              
              {/* Designation */}
              <div>
                <label className="filter-label">Designation</label>
                <select className="filter-input" value={filters.designation} onChange={(e) => handleFilterChange('designation', e.target.value)}>
                  <option value="">All Designations</option>
                  {designations.map(desg => <option key={desg} value={desg}>{desg}</option>)}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="filter-label">Branch</label>
                <select className="filter-input" value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)}>
                  <option value="">All Branches</option>
                  {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                </select>
              </div>

              {/* Search Input */}
              <div>
                {/* <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type="text" className="filter-input" placeholder="Search employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ paddingLeft: '32px' }} />
                    <FaSearch size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div> */}
                  {/* <button onClick={() => {
                    if (searchTerm.length >= 2 || searchTerm.length === 0) setSearchTerm(searchTerm);
                    else toast.warning('Minimum 2 characters required for search');
                  }} style={{ padding: '9px 16px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', height: '38px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.3)'; }}>
                    <FaSearch size={13} /> Search
                  </button> */}
                </div>
              </div>
            </div>
        

          {/* SEARCH RESULTS */}
          {hasSearched && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.statIcon('#9d174d')}><FaUsers size={16} /></div>
                  {totalItems.toLocaleString()} Employee{totalItems !== 1 ? 's' : ''} Found
                </div>
                {searchResults.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                      Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, totalItems)} of {totalItems.toLocaleString()}
                    </span>
                    <button onClick={() => setView(view === 'table' ? 'kanban' : 'table')} style={{ ...styles.secondaryBtn, padding: '6px 12px', fontSize: '12px' }}>
                      {view === 'table' ? <FaThList size={12} /> : <FaColumns size={12} />}
                    </button>
                  </div>
                )}
             
             
              </div>

              {searchResults.length > 0 ? (
                view === 'table' ? (
                  <div style={styles.tableCard}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                        <thead>
                          <tr style={styles.tableHeader}>
                            <th style={styles.tableHeaderCell}>#</th>
                            <th style={styles.tableHeaderCell}>Employee</th>
                            <th style={styles.tableHeaderCell}>Code</th>
                            <th style={styles.tableHeaderCell}>Department</th>
                            <th style={styles.tableHeaderCell}>Designation</th>
                            <th style={styles.tableHeaderCell}>Branch</th>
                            <th style={styles.tableHeaderCell}>Joining Date</th>
                            <th style={styles.tableHeaderCell}>Status</th>
                            <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map((emp, idx) => (
                            <tr key={emp.id} style={styles.tableRow} onClick={() => handleEmployeeClick(emp)}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
                              <td style={styles.tableCell}>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', background: '#eef2ff', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', color: '#9d174d' }}>
                                  {page * rowsPerPage + idx + 1}
                                </span>
                              </td>
                              <td style={styles.tableCell}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                                    {getInitials(emp.name)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>
                                      {highlightText(emp.name, searchTerm || filters.employeeName)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{emp.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={styles.tableCell}>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#475569' }}>
                                  {highlightText(emp.code, filters.employeeCode)}
                                </span>
                              </td>
                              <td style={styles.tableCell}>
                                <span className="cert-status-badge" style={{ background: '#eef2ff', color: '#9d174d' }}>
                                  {highlightText(emp.department, filters.department)}
                                </span>
                              </td>
                              <td style={styles.tableCell}>
                                <span style={{ fontSize: '13px', color: '#334155' }}>
                                  {highlightText(emp.designation, filters.designation)}
                                </span>
                              </td>
                              <td style={styles.tableCell}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569' }}>
                                  <FaMapMarkerAlt size={11} color="#9d174d" />
                                  {emp.branch || emp.location || 'N/A'}
                                </span>
                              </td>
                              <td style={{ ...styles.tableCell, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                                {formatDate(emp.joiningDate)}
                              </td>
                              <td style={styles.tableCell}>{getStatusBadge(emp.status)}</td>
                              <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                                <button onClick={(e) => { e.stopPropagation(); handleEmployeeClick(emp); }} style={styles.actionBtn}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#9d174d'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#9d174d'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#9d174d'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                  <FaEye size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
              
              
              
               {/* Pagination */}
              {totalPages > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', marginTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    Page {page + 1} of {totalPages} • {totalItems.toLocaleString()} total employees
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button disabled={page === 0} onClick={() => handlePageChange(page - 1)} style={{ ...styles.secondaryBtn, padding: '8px 14px', opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                      <FaChevronLeft size={11} /> Prev
                    </button>
                    {getPaginationRange().map((pg, i) => pg === '...' ? 
                      <span key={`dots-${i}`} style={{ padding: '6px 4px', color: '#94a3b8', fontWeight: '600' }}>…</span> : 
                      <button key={pg} onClick={() => handlePageChange(pg)} style={{ padding: '8px 14px', borderRadius: '10px', border: pg === page ? 'none' : '1.5px solid #e2e8f0', background: pg === page ? 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)' : 'white', color: pg === page ? 'white' : '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: pg === page ? '700' : '500', minWidth: '38px', transition: 'all 0.2s ease' }}>
                        {pg + 1}
                      </button>
                    )}
                    <button disabled={page + 1 >= totalPages} onClick={() => handlePageChange(page + 1)} style={{ ...styles.secondaryBtn, padding: '8px 14px', opacity: page + 1 >= totalPages ? 0.4 : 1, cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer' }}>
                      Next <FaChevronRight size={11} />
                    </button>
                  </div>
                </div>
              )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                    {searchResults.map((emp) => (
                      <div key={emp.id} onClick={() => handleEmployeeClick(emp)} className="hover-lift" style={styles.kanbanCard}>
                        {/* Kanban Card - same as before but with branch */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: '700', flexShrink: 0 }}>
                            {getInitials(emp.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                                  {highlightText(emp.name, searchTerm || filters.employeeName)}
                                </div>
                                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                  {highlightText(emp.designation, filters.designation)}
                                </div>
                              </div>
                              {getStatusBadge(emp.status)}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px', padding: '14px', background: '#f8fafc', borderRadius: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                <FaIdCard size={11} color="#9d174d" />
                                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{emp.code}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                <FaBuilding size={11} color="#9d174d" />
                                <span>{emp.department}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                <FaCalendarAlt size={11} color="#9d174d" />
                                <span>{formatDate(emp.joiningDate)}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                <FaMapMarkerAlt size={11} color="#9d174d" />
                                <span>{emp.branch || emp.location || 'N/A'}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                              <button onClick={(e) => { e.stopPropagation(); handleEmployeeClick(emp); }} style={styles.primaryBtn}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                                <FaEye size={12} /> View Service History
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    ))}
                    
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e8ecf1' }}>
                  <FaSearch size={40} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                  <h3 style={{ color: '#475569', margin: 0, fontSize: '18px', fontWeight: '600' }}>No employees found</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Try adjusting your search or filter criteria</p>
                </div>
              )}

           
            </>
          )}
        </>
      ) : (
        /* EMPLOYEE DETAILS VIEW */
        <div className="print-area">
          {selectedEmployee && (
            <div style={styles.employeeCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: '700', flexShrink: 0, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                    {getInitials(selectedEmployee.name)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>{selectedEmployee.name}</h2>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                        <FaIdCard size={12} color="#9d174d" /> {selectedEmployee.code}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                        <FaBuilding size={12} color="#9d174d" /> {selectedEmployee.department}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                        <FaBriefcase size={12} color="#9d174d" /> {selectedEmployee.designation}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                        <FaMapMarkerAlt size={12} color="#9d174d" /> {selectedEmployee.location || selectedEmployee.branch || 'N/A'}
                      </span>
                      <span>{getStatusBadge(selectedEmployee.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <FaEnvelope size={12} color="#9d174d" />
                  <span style={{ fontWeight: '500' }}>{selectedEmployee.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <FaPhone size={12} color="#9d174d" />
                  <span style={{ fontWeight: '500' }}>{selectedEmployee.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <FaUser size={12} color="#9d174d" />
                  <span style={{ fontWeight: '500' }}>{selectedEmployee.gender}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <FaCalendarAlt size={12} color="#9d174d" />
                  <span style={{ fontWeight: '500' }}>DOB: {formatDate(selectedEmployee.dob)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <FaCalendarCheck size={12} color="#9d174d" />
                  <span style={{ fontWeight: '500' }}>DOJ: {formatDate(selectedEmployee.joiningDate)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <FaChartLine size={12} color="#9d174d" />
                  <span style={{ fontWeight: '500' }}>Exp: {selectedEmployee.experience}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <FaMapMarkerAlt size={12} color="#9d174d" />
                  <span style={{ fontWeight: '500' }}>Branch: {selectedEmployee.location || selectedEmployee.branch || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'white', borderRadius: '16px', padding: '6px', border: '1px solid #e8ecf1' }}>
            <button onClick={() => setActiveTab('timeline')} style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'timeline' ? '700' : '500', background: activeTab === 'timeline' ? 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)' : 'transparent', color: activeTab === 'timeline' ? 'white' : '#64748b', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FaHistory size={13} /> Timeline View
            </button>
            <button onClick={() => setActiveTab('table')} style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'table' ? '700' : '500', background: activeTab === 'table' ? 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)' : 'transparent', color: activeTab === 'table' ? 'white' : '#64748b', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FaThList size={13} /> Table View
            </button>
          </div>

          {/* Timeline or Table View */}
          {activeTab === 'timeline' ? (
            <div style={{ ...styles.filterCard, padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.statIcon('#9d174d')}><FaHistory size={16} /></div>
                  Service Book Timeline ({filteredEvents.length} Events)
                </h3>
              </div>
              {filteredEvents.length > 0 ? (
                <div style={styles.timelineVertical}>
                  {filteredEvents.map((event, idx) => {
                    const eventInfo = getEventTypeInfo(event.type);
                    return (
                      <div key={event.id} className="timeline-item" style={{ position: 'relative', paddingBottom: idx === filteredEvents.length - 1 ? '0' : '32px', cursor: 'pointer' }} onClick={() => handleViewEvent(event)}>
                        {idx < filteredEvents.length - 1 && <div style={styles.timelineLine} />}
                        <div style={styles.timelineDot(eventInfo.color)} />
                        <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e8ecf1', transition: 'all 0.3s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = eventInfo.color; e.currentTarget.style.transform = 'translateX(8px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e8ecf1'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: eventInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: eventInfo.color, fontSize: '18px' }}>{getEventIcon(event.type)}</div>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{event.title}</div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span className="cert-status-badge" style={{ background: eventInfo.bg, color: eventInfo.color }}>{eventInfo.label}</span>
                                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FaCalendarAlt size={10} /> {formatDate(event.date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#9d174d', fontWeight: '600' }}>{event.referenceNo}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{event.sourceModule}</div>
                            </div>
                          </div>
                          <p style={{ fontSize: '13px', color: '#475569', margin: '12px 0 0 0', lineHeight: '1.6' }}>{event.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FaHistory size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                  <h3 style={{ color: '#475569', margin: 0, fontSize: '16px' }}>No events found</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>No service history available</p>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.tableCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e8ecf1' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.statIcon('#9d174d')}><FaClipboardList size={16} /></div>Service Book Timeline ({filteredEvents.length})
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.tableHeaderCell}>#</th>
                      <th style={styles.tableHeaderCell}>Date</th>
                      <th style={styles.tableHeaderCell}>Event Type</th>
                      <th style={styles.tableHeaderCell}>Event Title</th>
                      <th style={styles.tableHeaderCell}>Description</th>
                      <th style={styles.tableHeaderCell}>Reference No</th>
                      <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? currentItems.map((event, idx) => {
                      const eventInfo = getEventTypeInfo(event.type);
                      return (
                        <tr key={event.id} style={styles.tableRow} onClick={() => handleViewEvent(event)} onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
                          <td style={styles.tableCell}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', background: '#eef2ff', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', color: '#9d174d' }}>{startIndex + idx + 1}</span></td>
                          <td style={{ ...styles.tableCell, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarAlt size={12} color="#9d174d" />{formatDate(event.date)}</div></td>
                          <td style={styles.tableCell}><span className="cert-status-badge" style={{ background: eventInfo.bg, color: eventInfo.color }}>{getEventIcon(event.type)}{eventInfo.label}</span></td>
                          <td style={{ ...styles.tableCell, fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{event.title}</td>
                          <td style={{ ...styles.tableCell, fontSize: '13px', maxWidth: '250px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.description}</div></td>
                          <td style={styles.tableCell}><div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#9d174d', fontWeight: '600' }}>{event.referenceNo}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{event.sourceModule}</div></div></td>
                          <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                            <button onClick={(e) => { e.stopPropagation(); handleViewEvent(event); }} style={styles.actionBtn}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#9d174d'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#9d174d'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#9d174d'; e.currentTarget.style.borderColor = '#e2e8f0'; }}><FaEye size={13} /></button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}><FaHistory size={36} style={{ color: '#cbd5e1', marginBottom: '10px' }} /><h3 style={{ color: '#475569', margin: 0, fontSize: '16px' }}>No events found</h3><p style={{ color: '#94a3b8', fontSize: '14px' }}>No service history available for this employee</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {currentItems.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #e8ecf1', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItemsDisplay)} of {totalItemsDisplay} events</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button disabled={page === 0} onClick={() => setPage(page - 1)} style={{ ...styles.secondaryBtn, padding: '8px 14px', opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}><FaChevronLeft size={11} /> Prev</button>
                    {getPaginationRange().map((pg, i) => pg === '...' ? <span key={`dots-${i}`} style={{ padding: '6px 4px', color: '#94a3b8', fontWeight: '600' }}>…</span> : <button key={pg} onClick={() => setPage(pg)} style={{ padding: '8px 14px', borderRadius: '10px', border: pg === page ? 'none' : '1.5px solid #e2e8f0', background: pg === page ? 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)' : 'white', color: pg === page ? 'white' : '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: pg === page ? '700' : '500', minWidth: '38px', transition: 'all 0.2s ease' }}>{pg + 1}</button>)}
                    <button disabled={page + 1 >= totalPagesDisplay} onClick={() => setPage(page + 1)} style={{ ...styles.secondaryBtn, padding: '8px 14px', opacity: page + 1 >= totalPagesDisplay ? 0.4 : 1, cursor: page + 1 >= totalPagesDisplay ? 'not-allowed' : 'pointer' }}>Next <FaChevronRight size={11} /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div style={styles.modalOverlay} onClick={() => setShowEventModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const eventInfo = getEventTypeInfo(selectedEvent.type);
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${eventInfo.color}, ${eventInfo.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', boxShadow: `0 8px 24px ${eventInfo.color}40` }}>{getEventIcon(selectedEvent.type)}</div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>{selectedEvent.title}</h3>
                        <span className="cert-status-badge" style={{ background: eventInfo.bg, color: eventInfo.color }}>{eventInfo.label}</span>
                      </div>
                    </div>
                    <button onClick={() => setShowEventModal(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}><FaTimes size={14} /></button>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gap: '18px' }}>
                      <div><div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Description</div><div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.7' }}>{selectedEvent.description}</div></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                        <div><div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Event Date</div><div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarAlt size={13} color="#9d174d" />{formatDate(selectedEvent.date)}</div></div>
                        <div><div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Reference Number</div><div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace" }}>{selectedEvent.referenceNo}</div></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                        <div><div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Source Module</div><div style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>{selectedEvent.sourceModule}</div></div>
                        <div><div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Approved By</div><div style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>{selectedEvent.approvedBy || '—'}</div></div>
                      </div>
                      {selectedEvent.remarks && <div><div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' }}>Remarks</div><div style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic' }}>{selectedEvent.remarks}</div></div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => setShowEventModal(false)} style={styles.secondaryBtn}>Close</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookTimeline;