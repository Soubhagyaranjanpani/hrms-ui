
import React, { useState, useRef, useEffect } from 'react';
import { 
  FaSearch, FaPlus, FaTimes, FaFilePdf, FaFileWord, 
  FaFileImage, FaDownload, FaTrash, FaEdit, FaFileAlt,
  FaChartLine, FaExchangeAlt, FaTrophy, FaRupeeSign, 
  FaChalkboardTeacher, FaClock, FaSave, FaArrowLeft,
  FaChevronDown, FaUpload, FaEye, FaFilter, FaBuilding,
  FaUserTie, FaBriefcase, FaCheckCircle, FaCalendarAlt,
  FaUser
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookDocumentRepository = ({ employeeId, initialData, onSuccess, onCancel }) => {
  const [documents, setDocuments] = useState([
    { id: 1, category: 'appointment', title: 'Appointment Order', fileName: 'Appointment_Order.pdf', fileType: 'pdf', fileSize: '1.2 MB', date: '2020-01-15', uploadedBy: 'HR Admin', uploadedOn: '2020-01-15', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Software Engineer' },
    { id: 2, category: 'promotion', title: 'Promotion Order', fileName: 'Promotion_Order.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2021-03-01', uploadedBy: 'HR Manager', uploadedOn: '2021-03-01', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Software Engineer' },
    { id: 3, category: 'transfer', title: 'Transfer Order', fileName: 'Transfer_Order.pdf', fileType: 'pdf', fileSize: '654 KB', date: '2022-06-01', uploadedBy: 'HR Admin', uploadedOn: '2022-06-01', employeeName: 'Jane Smith', employeeId: 2, department: 'HR', branch: 'Delhi', designation: 'HR Manager' },
    { id: 4, category: 'salaryRevision', title: 'Salary Revision', fileName: 'Salary_Revision.pdf', fileType: 'pdf', fileSize: '432 KB', date: '2023-01-01', uploadedBy: 'Payroll Manager', uploadedOn: '2023-01-01', employeeName: 'Mike Johnson', employeeId: 3, department: 'IT', branch: 'Bangalore', designation: 'Senior Developer' },
    { id: 5, category: 'training', title: 'Training Certificate', fileName: 'Training_Certificate.jpg', fileType: 'jpg', fileSize: '2.1 MB', date: '2021-08-10', uploadedBy: 'Employee', uploadedOn: '2021-08-15', employeeName: 'Sarah Williams', employeeId: 4, department: 'Sales', branch: 'Mumbai', designation: 'Sales Manager' },
    { id: 6, category: 'award', title: 'Award Certificate', fileName: 'Award_Certificate.pdf', fileType: 'pdf', fileSize: '1.5 MB', date: '2022-01-20', uploadedBy: 'CEO Office', uploadedOn: '2022-01-20', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Accountant' }
  ]);

  // Search and Filter States 
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeNameSearch, setEmployeeNameSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedDesignation, setSelectedDesignation] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Pagination States
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  
  // View Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Refs
  const employeeInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const employeeNameInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          employeeInputRef.current && !employeeInputRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'John Doe', code: 'EMP001', department: 'IT', branch: 'Mumbai', designation: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', branch: 'Delhi', designation: 'HR Manager' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', branch: 'Bangalore', designation: 'Senior Developer' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', branch: 'Mumbai', designation: 'Sales Manager' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', branch: 'Delhi', designation: 'Accountant' },
    { id: 6, name: 'Robert Wilson', code: 'EMP006', department: 'IT', branch: 'Bangalore', designation: 'DevOps Engineer' },
    { id: 7, name: 'Emily Davis', code: 'EMP007', department: 'HR', branch: 'Mumbai', designation: 'Recruitment Specialist' },
    { id: 8, name: 'James Taylor', code: 'EMP008', department: 'Finance', branch: 'Bangalore', designation: 'Financial Analyst' },
    { id: 9, name: 'Lisa Anderson', code: 'EMP009', department: 'Sales', branch: 'Delhi', designation: 'Sales Executive' },
    { id: 10, name: 'Michael Brown', code: 'EMP010', department: 'IT', branch: 'Mumbai', designation: 'System Administrator' }
  ];

  const documentCategories = [
    { id: 'appointment', label: 'Appointment Orders', icon: <FaFileAlt />, color: '#4f46e5', bg: '#e0e7ff' },
    { id: 'promotion', label: 'Promotion Orders', icon: <FaChartLine />, color: '#f59e0b', bg: '#fed7aa' },
    { id: 'transfer', label: 'Transfer Orders', icon: <FaExchangeAlt />, color: '#06b6d4', bg: '#cffafe' },
    { id: 'salaryRevision', label: 'Salary Revision', icon: <FaRupeeSign />, color: '#ec489a', bg: '#fce7f3' },
    { id: 'training', label: 'Training Certificates', icon: <FaChalkboardTeacher />, color: '#8b5cf6', bg: '#ede9fe' },
    { id: 'award', label: 'Awards', icon: <FaTrophy />, color: '#ef4444', bg: '#fee2e2' },
    { id: 'retirement', label: 'Retirement Documents', icon: <FaClock />, color: '#64748b', bg: '#f1f5f9' }
  ];

  // Get unique values for filters
  const departments = ['all', ...new Set(documents.map(doc => doc.department))];
  const branches = ['all', ...new Set(documents.map(doc => doc.branch))];
  const designations = ['all', ...new Set(documents.map(doc => doc.designation))];

  const filteredEmployees = DUMMY_EMPLOYEES.filter(emp => 
    emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) || 
    emp.code.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  // Get unique employee names from documents for the employee name input
  const uniqueEmployeeNames = [...new Set(documents.map(doc => doc.employeeName))];

  const getFilteredDocuments = () => {
    let docs = documents;
    
    // Filter by employee name (exact match from dropdown)
    if (employeeNameSearch && employeeNameSearch !== '') {
      docs = docs.filter(doc => doc.employeeName === employeeNameSearch);
    }
    
    // Search by keyword
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      docs = docs.filter(doc => 
        doc.employeeName.toLowerCase().includes(search) ||
        doc.title.toLowerCase().includes(search) ||
        doc.fileName.toLowerCase().includes(search) ||
        doc.department?.toLowerCase().includes(search) ||
        doc.branch?.toLowerCase().includes(search) ||
        doc.designation?.toLowerCase().includes(search)
      );
    }
    
    // Filter by employee
    if (selectedEmployee) {
      docs = docs.filter(doc => doc.employeeId === selectedEmployee.id);
    }
    
    // Filter by category
    if (activeCategory !== 'all') {
      docs = docs.filter(doc => doc.category === activeCategory);
    }
    
    // Filter by department
    if (selectedDepartment !== 'all') {
      docs = docs.filter(doc => doc.department === selectedDepartment);
    }
    
    // Filter by branch
    if (selectedBranch !== 'all') {
      docs = docs.filter(doc => doc.branch === selectedBranch);
    }
    
    // Filter by designation
    if (selectedDesignation !== 'all') {
      docs = docs.filter(doc => doc.designation === selectedDesignation);
    }
    
    // Filter by date range
    if (fromDate) {
      docs = docs.filter(doc => doc.date >= fromDate);
    }
    if (toDate) {
      docs = docs.filter(doc => doc.date <= toDate);
    }
    
    return docs;
  };

  const filteredDocs = getFilteredDocuments();
  const totalItems = filteredDocs.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentDocs = filteredDocs.slice(startIndex, startIndex + rowsPerPage);

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(0, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
    return range;
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearchTerm(employee.name);
    setEmployeeNameSearch(employee.name);
    setShowEmployeeDropdown(false);
    setPage(0);
    setHasSearched(true);
    toast.success('Employee Selected', `Showing documents for ${employee.name}`);
  };

  const handleEmployeeNameSelect = (name) => {
    setEmployeeNameSearch(name);
    setPage(0);
    setHasSearched(true);
    toast.success('Employee Selected', `Showing documents for ${name}`);
  };

  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
    setEmployeeNameSearch('');
    setPage(0);
  };

  const handleSearch = () => {
    setHasSearched(true);
    setPage(0);
    if (!searchTerm && !employeeNameSearch && !selectedEmployee && activeCategory === 'all' && 
        selectedDepartment === 'all' && selectedBranch === 'all' && selectedDesignation === 'all' &&
        !fromDate && !toDate) {
      toast.info('Showing All', 'Displaying all documents');
    } else {
      toast.success('Search Complete', `Found ${filteredDocs.length} documents`);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
    setEmployeeNameSearch('');
    setActiveCategory('all');
    setSelectedDepartment('all');
    setSelectedBranch('all');
    setSelectedDesignation('all');
    setFromDate('');
    setToDate('');
    setHasSearched(false);
    setPage(0);
    toast.info('Reset', 'Search filters cleared');
  };

  const handleDownload = (doc) => {
    toast.info('Download', `Downloading ${doc.fileName}`);
  };

  const handleView = (doc) => {
    setViewingDoc(doc);
    setShowViewModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getCategoryInfo = (categoryId) => {
    return documentCategories.find(cat => cat.id === categoryId) || documentCategories[0];
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') return <FaFilePdf style={{ color: '#dc2626' }} size={20} />;
    if (fileType === 'docx' || fileType === 'doc') return <FaFileWord style={{ color: '#2563eb' }} size={20} />;
    if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') return <FaFileImage style={{ color: '#10b981' }} size={20} />;
    return <FaFileAlt style={{ color: '#6b7280' }} size={20} />;
  };

  // Check if any filter is active
  const hasActiveFilters = searchTerm || employeeNameSearch || selectedEmployee || activeCategory !== 'all' || 
                           selectedDepartment !== 'all' || selectedBranch !== 'all' || 
                           selectedDesignation !== 'all' || fromDate || toDate;

  // Filter employee names based on search
  const filteredEmployeeNames = uniqueEmployeeNames.filter(name =>
    name.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        .service-doc-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .service-doc-btn-primary {
          background: #9d174d;
          color: white;
          box-shadow: 0 4px 12px rgba(157, 23, 77, 0.3);
        }
        .service-doc-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(157, 23, 77, 0.4);
        }
        .service-doc-btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        .service-doc-btn-secondary:hover {
          background: #e2e8f0;
        }
        .service-doc-btn-danger {
          background: #fee2e2;
          color: #ef4444;
        }
        .service-doc-btn-danger:hover {
          background: #fecaca;
        }
        .service-doc-btn-success {
          background: #10b981;
          color: white;
        }
        .service-doc-btn-success:hover {
          background: #059669;
        }
        .service-doc-input {
          padding: 8px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
          width: 100%;
          box-sizing: border-box;
          background: white;
        }
        .service-doc-input:focus {
          border-color: #9d174d;
          box-shadow: 0 0 0 3px rgba(157, 23, 77, 0.1);
        }
        .service-doc-input[type="date"] {
          min-height: 38px;
        }
        .service-doc-select {
          padding: 8px 32px 8px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background: white;
          cursor: pointer;
          box-sizing: border-box;
          min-height: 38px;
        }
        .service-doc-select:focus {
          border-color: #9d174d;
          box-shadow: 0 0 0 3px rgba(157, 23, 77, 0.1);
        }
        .service-doc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .service-doc-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .service-doc-table td {
          padding: 10px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .service-doc-table tr:hover td {
          background: #f8fafc;
        }
        .service-doc-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .service-doc-dropdown {
          position: absolute;
          top: calc(100% + 2px);
          left: 0;
          right: 0;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          max-height: 250px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          margin-top: 0;
        }
        .service-doc-dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .service-doc-dropdown-item:last-child {
          border-bottom: none;
        }
        .service-doc-dropdown-item:hover {
          background: #f8f0f3;
        }
        .service-doc-dropdown-item .emp-name {
          font-weight: 600;
          color: #0f172a;
        }
        .service-doc-dropdown-item .emp-details {
          font-size: 12px;
          color: #94a3b8;
        }
        .service-doc-dropdown-item .emp-branch {
          padding: 2px 10px;
          background: #f1f5f9;
          border-radius: 12px;
          font-size: 11px;
          color: #64748b;
        }
        .service-doc-pagination {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .service-doc-page-btn {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .service-doc-page-btn:hover:not(:disabled) {
          background: #f1f5f9;
        }
        .service-doc-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .service-doc-page-btn.active {
          background: #9d174d;
          color: white;
          border-color: #9d174d;
        }
        .service-doc-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 20px;
        }
        .service-doc-modal-content {
          background: white;
          border-radius: 16px;
          width: 95%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px rgba(0,0,0,0.25);
          overflow: hidden;
        }
        .service-doc-modal-header {
          padding: 16px 24px;
          background: linear-gradient(135deg, #9d174d, #9d174d);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .service-doc-modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }
        .service-doc-modal-footer {
          padding: 12px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }
        .search-container {
          display: grid;
          grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 1fr auto;
          gap: 12px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          align-items: end;
        }
        @media (max-width: 1200px) {
          .search-container {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        @media (max-width: 768px) {
          .search-container {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .search-container {
            grid-template-columns: 1fr;
          }
        }
        .search-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          display: block;
          margin-bottom: 4px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }
        .empty-state svg {
          color: #cbd5e1;
          margin-bottom: 16px;
        }
        .filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          margin-left: 6px;
        }
        .employee-input-wrapper {
          position: relative;
          width: 100%;
        }
        .employee-input-wrapper .service-doc-input {
          padding-right: 30px;
        }
        .employee-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .employee-clear-btn:hover {
          color: #ef4444;
        }
        .selected-employee-info {
          font-size: 11px;
          color: #10b981;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .employee-name-dropdown {
          position: absolute;
          top: calc(100% + 2px);
          left: 0;
          right: 0;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          margin-top: 0;
        }
        .employee-name-item {
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .employee-name-item:last-child {
          border-bottom: none;
        }
        .employee-name-item:hover {
          background: #f8f0f3;
        }
        .employee-name-item .name-text {
          font-weight: 500;
          color: #0f172a;
        }
        .employee-name-item .count-badge {
          margin-left: auto;
          padding: 2px 10px;
          background: #f1f5f9;
          border-radius: 12px;
          font-size: 11px;
          color: #64748b;
        }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Service Book Document Repository</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Centralized employee document storage</p>
        </div>
        {onCancel && (
          <button className="service-doc-btn service-doc-btn-secondary" onClick={onCancel}>
            <FaTimes size={13} /> Cancel
          </button>
        )}
      </div>

      <div className="search-container">
      
        {/* Branch Filter */}
        <div>
          <label className="search-label">
            <FaBriefcase size={11} style={{ marginRight: '4px' }} /> Branch
          </label>
          <div style={{ position: 'relative' }}>
            <select
              className="service-doc-select"
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPage(0);
                if (e.target.value !== 'all') {
                  setHasSearched(true);
                }
              }}
            >
              <option value="all">All Branches</option>
              {branches.filter(b => b !== 'all').map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Department Filter */}
        <div>
          <label className="search-label">
            <FaBuilding size={11} style={{ marginRight: '4px' }} /> Department
          </label>
          <div style={{ position: 'relative' }}>
            <select
              className="service-doc-select"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setPage(0);
                if (e.target.value !== 'all') {
                  setHasSearched(true);
                }
              }}
            >
              <option value="all">All Departments</option>
              {departments.filter(d => d !== 'all').map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Designation Filter */}
        <div>
          <label className="search-label">
            <FaUserTie size={11} style={{ marginRight: '4px' }} /> Designation
          </label>
          <div style={{ position: 'relative' }}>
            <select
              className="service-doc-select"
              value={selectedDesignation}
              onChange={(e) => {
                setSelectedDesignation(e.target.value);
                setPage(0);
                if (e.target.value !== 'all') {
                  setHasSearched(true);
                }
              }}
            >
              <option value="all">All Designations</option>
              {designations.filter(d => d !== 'all').map(desig => (
                <option key={desig} value={desig}>{desig}</option>
              ))}
            </select>
            <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

 {/* Search Input */}
        <div>
          <label className="search-label">
            <FaSearch size={11} style={{ marginRight: '4px' }} /> Employee Name
          </label>
          <input
            className="service-doc-input"
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
              if (e.target.value) {
                setHasSearched(true);
              }
            }}
          />
        </div>

        {/* From Date */}
        <div>
          <label className="search-label">
            <FaCalendarAlt size={11} style={{ marginRight: '4px' }} /> From Date
          </label>
          <input
            type="date"
            className="service-doc-input"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
              if (e.target.value) {
                setHasSearched(true);
              }
            }}
          />
        </div>

        {/* To Date */}
        <div>
          <label className="search-label">
            <FaCalendarAlt size={11} style={{ marginRight: '4px' }} /> To Date
          </label>
          <input
            type="date"
            className="service-doc-input"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
              if (e.target.value) {
                setHasSearched(true);
              }
            }}
          />
        </div>

        {/* Search & Reset Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="service-doc-btn service-doc-btn-primary" onClick={handleSearch}>
            <FaSearch size={14} /> Search
          </button>
         
        </div>
      </div>

      {/* DOCUMENTS TABLE */}
      {(hasSearched || hasActiveFilters) ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Results Summary */}
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: '#0f172a' }}>{totalItems}</span>
              <span style={{ color: '#64748b' }}> document(s) found</span>
              {employeeNameSearch && (
                <span className="filter-tag" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <FaUser size={10} /> {employeeNameSearch}
                </span>
              )}
              {selectedEmployee && (
                <span className="filter-tag" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <FaUserTie size={10} /> {selectedEmployee.name}
                </span>
              )}
              {activeCategory !== 'all' && (
                <span className="filter-tag" style={{ background: '#fce7f3', color: '#ec489a' }}>
                  {documentCategories.find(c => c.id === activeCategory)?.label}
                </span>
              )}
              {selectedDepartment !== 'all' && (
                <span className="filter-tag" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <FaBuilding size={10} /> {selectedDepartment}
                </span>
              )}
              {selectedBranch !== 'all' && (
                <span className="filter-tag" style={{ background: '#d1fae5', color: '#059669' }}>
                  <FaBriefcase size={10} /> {selectedBranch}
                </span>
              )}
              {selectedDesignation !== 'all' && (
                <span className="filter-tag" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <FaUserTie size={10} /> {selectedDesignation}
                </span>
              )}
              {fromDate && (
                <span className="filter-tag" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <FaCalendarAlt size={10} /> From: {formatDate(fromDate)}
                </span>
              )}
              {toDate && (
                <span className="filter-tag" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <FaCalendarAlt size={10} /> To: {formatDate(toDate)}
                </span>
              )}
              {searchTerm && (
                <span className="filter-tag" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <FaSearch size={10} /> {searchTerm}
                </span>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="service-doc-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Branch</th>
                  <th>Designation</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDocs.length > 0 ? (
                  currentDocs.map((doc, idx) => {
                    const category = getCategoryInfo(doc.category);
                    return (
                      <tr key={doc.id}>
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>{startIndex + idx + 1}</td>
                        <td style={{ fontWeight: '600', color: '#0f172a' }}>{doc.employeeName}</td>
                        <td>
                          <span style={{ padding: '2px 10px', background: '#dbeafe', borderRadius: '12px', fontSize: '11px', color: '#2563eb' }}>
                            {doc.department || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ padding: '2px 10px', background: '#d1fae5', borderRadius: '12px', fontSize: '11px', color: '#059669' }}>
                            {doc.branch || '—'}
                          </span>
                        </td>
                        <td style={{ color: '#334155' }}>{doc.designation || '—'}</td>
                        <td>
                          <span className="service-doc-badge" style={{ backgroundColor: category.bg, color: category.color }}>
                            {category.icon} {category.label}
                          </span>
                        </td>
                        <td style={{ color: '#334155' }}>{formatDate(doc.date)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}
                              onClick={() => handleView(doc)}
                              title="View"
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
                    <td colSpan="8">
                      <div className="empty-state">
                        <FaFileAlt size={48} />
                        <div style={{ fontSize: '16px', fontWeight: '500', color: '#475569' }}>No documents found</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search or filter criteria</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalItems > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
              </span>
              <div className="service-doc-pagination">
                <button className="service-doc-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
                {getPaginationRange().map((pg, i) => 
                  pg === '...' ? 
                    <span key={`dots-${i}`} style={{ padding: '6px 8px', color: '#94a3b8' }}>…</span> : 
                    <button key={pg} className={`service-doc-page-btn ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg + 1}</button>
                )}
                <button className="service-doc-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <></>
      )}

      {/* VIEW MODAL */}
      {showViewModal && viewingDoc && (
        <div className="service-doc-modal">
          <div className="service-doc-modal-content">
            <div className="service-doc-modal-header">
              <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaFileAlt /> Document Preview
              </h5>
              <button onClick={() => setShowViewModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', color: 'white', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div className="service-doc-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Employee</span>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{viewingDoc.employeeName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Department</span>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{viewingDoc.department || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Branch</span>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{viewingDoc.branch || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Designation</span>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{viewingDoc.designation || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Category</span>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{viewingDoc.title}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Date</span>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{formatDate(viewingDoc.date)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>File Name</span>
                  <div style={{ fontWeight: '500', color: '#0f172a', fontFamily: 'monospace', fontSize: '12px' }}>{viewingDoc.fileName}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>File Size</span>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{viewingDoc.fileSize}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Uploaded By</span>
                  <div style={{ fontWeight: '500', color: '#0f172a' }}>{viewingDoc.uploadedBy}</div>
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0 16px' }} />
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <FaFileAlt size={64} style={{ color: '#6366f1', marginBottom: '12px' }} />
                <p style={{ color: '#64748b' }}>Document preview available in full version</p>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>{viewingDoc.fileName}</p>
              </div>
            </div>
            <div className="service-doc-modal-footer">
              <button className="service-doc-btn service-doc-btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="service-doc-btn service-doc-btn-primary" onClick={() => handleDownload(viewingDoc)}>
                <FaDownload size={13} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookDocumentRepository;