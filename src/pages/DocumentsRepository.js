
import React, { useState, useRef, useEffect } from 'react';
import { 
  FaSearch, FaPlus, FaTimes, FaFilePdf, FaFileWord, 
  FaFileImage, FaDownload, FaTrash, FaEdit, FaFileAlt,
  FaChartLine, FaExchangeAlt, FaTrophy, FaRupeeSign, 
  FaChalkboardTeacher, FaClock, FaSave, FaArrowLeft,
  FaChevronDown, FaUpload, FaEye, FaFilter, FaBuilding,
  FaUserTie, FaBriefcase, FaCheckCircle, FaCalendarAlt,
  FaUser, FaArrowRight
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookDocumentRepository = ({ employeeId, initialData, onSuccess, onCancel }) => {
 const [documents, setDocuments] = useState([
  // ─── JOHN DOE (Employee 1) ──────────────────────────────
  { id: 1, category: 'appointment', title: 'Appointment Order', fileName: 'Appointment_Order.pdf', fileType: 'pdf', fileSize: '1.2 MB', date: '2020-01-15', uploadedBy: 'HR Admin', uploadedOn: '2020-01-15', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Software Engineer' },
  { id: 2, category: 'confirmation', title: 'Confirmation Letter', fileName: 'Confirmation_Letter.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2020-07-15', uploadedBy: 'HR Manager', uploadedOn: '2020-07-15', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Software Engineer' },
  { id: 3, category: 'promotion', title: 'Promotion Order', fileName: 'Promotion_Order.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2021-03-01', uploadedBy: 'HR Manager', uploadedOn: '2021-03-01', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Senior Software Engineer' },
  { id: 4, category: 'salaryRevision', title: 'Salary Slip - Jan 2024', fileName: 'Salary_Slip_Jan2024.pdf', fileType: 'pdf', fileSize: '432 KB', date: '2024-01-01', uploadedBy: 'Payroll Manager', uploadedOn: '2024-01-01', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Senior Software Engineer' },
  { id: 5, category: 'transfer', title: 'Transfer Order', fileName: 'Transfer_Order_John.pdf', fileType: 'pdf', fileSize: '654 KB', date: '2023-06-01', uploadedBy: 'HR Admin', uploadedOn: '2023-06-01', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Senior Software Engineer' },
  { id: 6, category: 'award', title: 'Best Employee Award 2023', fileName: 'Best_Employee_Award.pdf', fileType: 'pdf', fileSize: '1.5 MB', date: '2023-12-20', uploadedBy: 'CEO Office', uploadedOn: '2023-12-20', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Senior Software Engineer' },
  { id: 7, category: 'training', title: 'AWS Certification', fileName: 'AWS_Certification.pdf', fileType: 'pdf', fileSize: '2.1 MB', date: '2023-08-10', uploadedBy: 'Employee', uploadedOn: '2023-08-15', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Senior Software Engineer' },
{ id: 8, category: 'retirement', title: 'Retirement Document', fileName: 'Retirement_John.pdf', fileType: 'pdf', fileSize: '1.0 MB', date: '2024-12-31', uploadedBy: 'HR Admin', uploadedOn: '2024-12-31', employeeName: 'John Doe', employeeId: 1, department: 'IT', branch: 'Mumbai', designation: 'Senior Software Engineer' },

  // ─── JANE SMITH (Employee 2) ──────────────────────────────
  { id: 9, category: 'appointment', title: 'Appointment Order', fileName: 'Appointment_Order_Jane.pdf', fileType: 'pdf', fileSize: '1.1 MB', date: '2019-03-10', uploadedBy: 'HR Admin', uploadedOn: '2019-03-10', employeeName: 'Jane Smith', employeeId: 2, department: 'HR', branch: 'Delhi', designation: 'HR Manager' },
  { id: 10, category: 'confirmation', title: 'Confirmation Letter', fileName: 'Confirmation_Letter_Jane.pdf', fileType: 'pdf', fileSize: '756 KB', date: '2019-09-10', uploadedBy: 'HR Manager', uploadedOn: '2019-09-10', employeeName: 'Jane Smith', employeeId: 2, department: 'HR', branch: 'Delhi', designation: 'HR Manager' },
  { id: 11, category: 'promotion', title: 'Promotion Order', fileName: 'Promotion_Order_Jane.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2021-06-01', uploadedBy: 'HR Manager', uploadedOn: '2021-06-01', employeeName: 'Jane Smith', employeeId: 2, department: 'HR', branch: 'Delhi', designation: 'Senior HR Manager' },
  { id: 12, category: 'salaryRevision', title: 'Salary Slip - Jan 2024', fileName: 'Salary_Slip_Jane_Jan2024.pdf', fileType: 'pdf', fileSize: '432 KB', date: '2024-01-01', uploadedBy: 'Payroll Manager', uploadedOn: '2024-01-01', employeeName: 'Jane Smith', employeeId: 2, department: 'HR', branch: 'Delhi', designation: 'Senior HR Manager' },
  { id: 13, category: 'transfer', title: 'Transfer Order', fileName: 'Transfer_Order_Jane.pdf', fileType: 'pdf', fileSize: '654 KB', date: '2022-06-01', uploadedBy: 'HR Admin', uploadedOn: '2022-06-01', employeeName: 'Jane Smith', employeeId: 2, department: 'HR', branch: 'Delhi', designation: 'Senior HR Manager' },
  { id: 14, category: 'award', title: 'HR Excellence Award', fileName: 'HR_Excellence_Award.pdf', fileType: 'pdf', fileSize: '1.3 MB', date: '2022-12-15', uploadedBy: 'CEO Office', uploadedOn: '2022-12-15', employeeName: 'Jane Smith', employeeId: 2, department: 'HR', branch: 'Delhi', designation: 'Senior HR Manager' },
  { id: 15, category: 'training', title: 'Leadership Training', fileName: 'Leadership_Training.pdf', fileType: 'pdf', fileSize: '1.8 MB', date: '2023-05-20', uploadedBy: 'Employee', uploadedOn: '2023-05-25', employeeName: 'Jane Smith', employeeId: 2, department: 'HR', branch: 'Delhi', designation: 'Senior HR Manager' },

  // ─── MIKE JOHNSON (Employee 3) ────────────────────────────
  { id: 16, category: 'appointment', title: 'Appointment Order', fileName: 'Appointment_Order_Mike.pdf', fileType: 'pdf', fileSize: '1.2 MB', date: '2020-08-20', uploadedBy: 'HR Admin', uploadedOn: '2020-08-20', employeeName: 'Mike Johnson', employeeId: 3, department: 'IT', branch: 'Bangalore', designation: 'Senior Developer' },
  { id: 17, category: 'confirmation', title: 'Confirmation Letter', fileName: 'Confirmation_Letter_Mike.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2021-02-20', uploadedBy: 'HR Manager', uploadedOn: '2021-02-20', employeeName: 'Mike Johnson', employeeId: 3, department: 'IT', branch: 'Bangalore', designation: 'Senior Developer' },
  { id: 18, category: 'promotion', title: 'Promotion Order', fileName: 'Promotion_Order_Mike.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2022-09-01', uploadedBy: 'HR Manager', uploadedOn: '2022-09-01', employeeName: 'Mike Johnson', employeeId: 3, department: 'IT', branch: 'Bangalore', designation: 'Tech Lead' },
  { id: 19, category: 'salaryRevision', title: 'Salary Slip - Jan 2024', fileName: 'Salary_Slip_Mike_Jan2024.pdf', fileType: 'pdf', fileSize: '432 KB', date: '2024-01-01', uploadedBy: 'Payroll Manager', uploadedOn: '2024-01-01', employeeName: 'Mike Johnson', employeeId: 3, department: 'IT', branch: 'Bangalore', designation: 'Tech Lead' },
  { id: 20, category: 'transfer', title: 'Transfer Order', fileName: 'Transfer_Order_Mike.pdf', fileType: 'pdf', fileSize: '654 KB', date: '2023-03-01', uploadedBy: 'HR Admin', uploadedOn: '2023-03-01', employeeName: 'Mike Johnson', employeeId: 3, department: 'IT', branch: 'Bangalore', designation: 'Tech Lead' },
  { id: 21, category: 'award', title: 'Innovation Award', fileName: 'Innovation_Award.pdf', fileType: 'pdf', fileSize: '1.2 MB', date: '2023-10-10', uploadedBy: 'CEO Office', uploadedOn: '2023-10-10', employeeName: 'Mike Johnson', employeeId: 3, department: 'IT', branch: 'Bangalore', designation: 'Tech Lead' },
  { id: 22, category: 'training', title: 'Python Certification', fileName: 'Python_Certification.pdf', fileType: 'pdf', fileSize: '2.0 MB', date: '2023-07-15', uploadedBy: 'Employee', uploadedOn: '2023-07-20', employeeName: 'Mike Johnson', employeeId: 3, department: 'IT', branch: 'Bangalore', designation: 'Tech Lead' },

  // ─── SARAH WILLIAMS (Employee 4) ──────────────────────────
  { id: 23, category: 'appointment', title: 'Appointment Order', fileName: 'Appointment_Order_Sarah.pdf', fileType: 'pdf', fileSize: '1.0 MB', date: '2021-01-05', uploadedBy: 'HR Admin', uploadedOn: '2021-01-05', employeeName: 'Sarah Williams', employeeId: 4, department: 'Sales', branch: 'Mumbai', designation: 'Sales Manager' },
  { id: 24, category: 'confirmation', title: 'Confirmation Letter', fileName: 'Confirmation_Letter_Sarah.pdf', fileType: 'pdf', fileSize: '756 KB', date: '2021-07-05', uploadedBy: 'HR Manager', uploadedOn: '2021-07-05', employeeName: 'Sarah Williams', employeeId: 4, department: 'Sales', branch: 'Mumbai', designation: 'Sales Manager' },
  { id: 25, category: 'promotion', title: 'Promotion Order', fileName: 'Promotion_Order_Sarah.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2023-01-01', uploadedBy: 'HR Manager', uploadedOn: '2023-01-01', employeeName: 'Sarah Williams', employeeId: 4, department: 'Sales', branch: 'Mumbai', designation: 'Senior Sales Manager' },
  { id: 26, category: 'salaryRevision', title: 'Salary Slip - Jan 2024', fileName: 'Salary_Slip_Sarah_Jan2024.pdf', fileType: 'pdf', fileSize: '432 KB', date: '2024-01-01', uploadedBy: 'Payroll Manager', uploadedOn: '2024-01-01', employeeName: 'Sarah Williams', employeeId: 4, department: 'Sales', branch: 'Mumbai', designation: 'Senior Sales Manager' },
  { id: 27, category: 'transfer', title: 'Transfer Order', fileName: 'Transfer_Order_Sarah.pdf', fileType: 'pdf', fileSize: '654 KB', date: '2022-12-01', uploadedBy: 'HR Admin', uploadedOn: '2022-12-01', employeeName: 'Sarah Williams', employeeId: 4, department: 'Sales', branch: 'Mumbai', designation: 'Senior Sales Manager' },
  { id: 28, category: 'award', title: 'Best Sales Award 2023', fileName: 'Best_Sales_Award.pdf', fileType: 'pdf', fileSize: '1.4 MB', date: '2023-12-20', uploadedBy: 'CEO Office', uploadedOn: '2023-12-20', employeeName: 'Sarah Williams', employeeId: 4, department: 'Sales', branch: 'Mumbai', designation: 'Senior Sales Manager' },
  { id: 29, category: 'training', title: 'Sales Training Certificate', fileName: 'Sales_Training.pdf', fileType: 'pdf', fileSize: '1.6 MB', date: '2023-04-10', uploadedBy: 'Employee', uploadedOn: '2023-04-15', employeeName: 'Sarah Williams', employeeId: 4, department: 'Sales', branch: 'Mumbai', designation: 'Senior Sales Manager' },

  // ─── DAVID BROWN (Employee 5) ─────────────────────────────
  { id: 30, category: 'appointment', title: 'Appointment Order', fileName: 'Appointment_Order_David.pdf', fileType: 'pdf', fileSize: '1.1 MB', date: '2018-11-15', uploadedBy: 'HR Admin', uploadedOn: '2018-11-15', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Accountant' },
  { id: 31, category: 'confirmation', title: 'Confirmation Letter', fileName: 'Confirmation_Letter_David.pdf', fileType: 'pdf', fileSize: '756 KB', date: '2019-05-15', uploadedBy: 'HR Manager', uploadedOn: '2019-05-15', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Accountant' },
  { id: 32, category: 'promotion', title: 'Promotion Order', fileName: 'Promotion_Order_David.pdf', fileType: 'pdf', fileSize: '856 KB', date: '2022-04-01', uploadedBy: 'HR Manager', uploadedOn: '2022-04-01', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Senior Accountant' },
  { id: 33, category: 'salaryRevision', title: 'Salary Slip - Jan 2024', fileName: 'Salary_Slip_David_Jan2024.pdf', fileType: 'pdf', fileSize: '432 KB', date: '2024-01-01', uploadedBy: 'Payroll Manager', uploadedOn: '2024-01-01', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Senior Accountant' },
  { id: 34, category: 'transfer', title: 'Transfer Order', fileName: 'Transfer_Order_David.pdf', fileType: 'pdf', fileSize: '654 KB', date: '2021-06-01', uploadedBy: 'HR Admin', uploadedOn: '2021-06-01', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Senior Accountant' },
  { id: 35, category: 'award', title: 'Best Employee Award', fileName: 'Award_Certificate.pdf', fileType: 'pdf', fileSize: '1.5 MB', date: '2022-01-20', uploadedBy: 'CEO Office', uploadedOn: '2022-01-20', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Senior Accountant' },
  { id: 36, category: 'training', title: 'Financial Analysis Certificate', fileName: 'Financial_Analysis.pdf', fileType: 'pdf', fileSize: '1.9 MB', date: '2023-09-01', uploadedBy: 'Employee', uploadedOn: '2023-09-05', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Senior Accountant' },
  { id: 37, category: 'retirement', title: 'Retirement Document', fileName: 'Retirement_David.pdf', fileType: 'pdf', fileSize: '1.0 MB', date: '2024-12-31', uploadedBy: 'HR Admin', uploadedOn: '2024-12-31', employeeName: 'David Brown', employeeId: 5, department: 'Finance', branch: 'Delhi', designation: 'Senior Accountant' },
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
  
  // ─── View Page State ────────────────────────────────────
  const [showViewPage, setShowViewPage] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [viewingEmployeeDocs, setViewingEmployeeDocs] = useState([]);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);

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
    { id: 'confirmation', label: 'Confirmation Letters', icon: <FaCheckCircle />, color: '#16a34a', bg: '#dcfce7' },
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

 const filteredDummyEmployees = DUMMY_EMPLOYEES.filter(emp => 
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

  // ─── Get Unique Employees from Documents ──────────────────
const getUniqueEmployees = () => {
  const uniqueEmployees = [];
  const seenNames = new Set();
  
  documents.forEach(doc => {
    if (!seenNames.has(doc.employeeName)) {
      seenNames.add(doc.employeeName);
      uniqueEmployees.push({
        id: doc.employeeId,
        name: doc.employeeName,
        department: doc.department,
        branch: doc.branch,
        designation: doc.designation,
        documentCount: documents.filter(d => d.employeeName === doc.employeeName).length
      });
    }
  });
  
  return uniqueEmployees;
};

// ─── Filter Employees ──────────────────────────────────────
const getFilteredEmployees = () => {
  let employees = getUniqueEmployees();
  
  // Search by keyword
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase();
    employees = employees.filter(emp =>
      emp.name.toLowerCase().includes(search) ||
      emp.department?.toLowerCase().includes(search) ||
      emp.branch?.toLowerCase().includes(search) ||
      emp.designation?.toLowerCase().includes(search)
    );
  }
  
  // Filter by department
  if (selectedDepartment !== 'all') {
    employees = employees.filter(emp => emp.department === selectedDepartment);
  }
  
  // Filter by branch
  if (selectedBranch !== 'all') {
    employees = employees.filter(emp => emp.branch === selectedBranch);
  }
  
  // Filter by designation
  if (selectedDesignation !== 'all') {
    employees = employees.filter(emp => emp.designation === selectedDesignation);
  }
  
  return employees;
};
  
const filteredEmployees = getFilteredEmployees();
const totalItems = filteredEmployees.length;
const totalPages = Math.ceil(totalItems / rowsPerPage);
const startIndex = page * rowsPerPage;
const currentEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

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
    const employees = getFilteredEmployees();
    toast.success('Search Complete', `Found ${employees.length} employees`);
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
  // Simulate download
  toast.success('Download Started', `Downloading ${doc.fileName}`);
 };

  // ─── View Employee Documents ─────────────────────────────
  const handleViewEmployee = (employeeName) => {
    const employee = DUMMY_EMPLOYEES.find(emp => emp.name === employeeName);
    if (employee) {
      const docs = documents.filter(doc => doc.employeeName === employeeName);
      setViewingEmployee(employee);
      setViewingEmployeeDocs(docs);
      // Set first document as selected for preview
      if (docs.length > 0) {
        setSelectedDocForPreview(docs[0]);
      }
      setShowViewPage(true);
    } else {
      toast.warning('Not Found', 'Employee details not found');
    }
  };

  const handleBackToList = () => {
    setShowViewPage(false);
    setViewingEmployee(null);
    setViewingEmployeeDocs([]);
    setSelectedDocForPreview(null);
  };

  const handleSelectDocumentForPreview = (doc) => {
  setSelectedDocForPreview(doc);
  toast.info('Document Selected', `Viewing ${doc.title}`);
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

  // ─── View Page Styles ────────────────────────────────────
  const viewPageStyles = {
    container: { padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' },
    card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    header: { padding: '20px 24px', background: 'linear-gradient(135deg, #9d174d, #7a0e3a)', color: 'white' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '10px 16px', borderBottom: '1px solid #f1f5f9' },
    badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    btnPrimary: { padding: '8px 20px', background: '#9d174d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnSecondary: { padding: '8px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnInfo: { padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' },
    btnSuccess: { padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#94a3b8' },
    previewBox: { textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  };

  // ─── RENDER VIEW PAGE ────────────────────────────────────
  if (showViewPage && viewingEmployee) {
    const category = selectedDocForPreview ? getCategoryInfo(selectedDocForPreview.category) : null;
    
    return (
      <div style={viewPageStyles.container}>
        {/* Back Button */}
       <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
  <button style={viewPageStyles.btnSecondary} onClick={handleBackToList}>
    <FaArrowLeft size={13} /> Back to List
  </button>
</div>
        {/* Employee Details Card */}
        <div style={viewPageStyles.card}>
          <div style={viewPageStyles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700' }}>
                {viewingEmployee.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>{viewingEmployee.name}</h2>
                <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
                  {viewingEmployee.code} • {viewingEmployee.department} • {viewingEmployee.designation}
                </p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px' }}>
                <FaFileAlt style={{ marginRight: '6px' }} />
                Total Documents: {viewingEmployeeDocs.length}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Document Preview Section ────────────────────── */}
{selectedDocForPreview && (
  <div style={{ ...viewPageStyles.card, marginTop: '20px' }}>
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Document Preview</h3>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Preview</span>
    </div>
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Employee</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.employeeName}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Department</span>
          <div style={{ fontWeight: '500',fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.department || '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Branch</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.branch || '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Designation</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.designation || '—'}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Date</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{formatDate(selectedDocForPreview.date)}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Uploaded By</span>
          <div style={{ fontWeight: '500', fontSize: '14px', color: '#0f172a' }}>{selectedDocForPreview.uploadedBy}</div>
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0 16px' }} />
      {/* ─── All Documents Table ──────────────────────────── */}
      <div style={{ ...viewPageStyles.card, marginTop: '20px' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>All Documents</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={viewPageStyles.table}>
            <thead>
              <tr>
                <th style={viewPageStyles.th}>#</th>
                <th style={viewPageStyles.th}>Document Type</th>
                <th style={viewPageStyles.th}>Title</th>
                <th style={viewPageStyles.th}>Date</th>
                <th style={{ ...viewPageStyles.th, textAlign: 'center', width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {viewingEmployeeDocs.length > 0 ? (
                viewingEmployeeDocs.map((doc, idx) => {
                  const cat = getCategoryInfo(doc.category);
                  return (
                    <tr key={doc.id}>
                      <td style={{ ...viewPageStyles.td, color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={viewPageStyles.td}>
                        <span style={{ ...viewPageStyles.badge, backgroundColor: cat.bg, color: cat.color }}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>
                      <td style={{ ...viewPageStyles.td, fontWeight: '500', color: '#0f172a' }}>{doc.title}</td>
                      <td style={viewPageStyles.td}>{formatDate(doc.date)}</td>
                      <td style={{ ...viewPageStyles.td, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                         <button
  style={{
    ...viewPageStyles.btnInfo,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }}
  onClick={() => handleSelectDocumentForPreview(doc)}
  title="View Document"
  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
>
  <FaEye size={12} /> View
</button>
                         <button
  style={{
    ...viewPageStyles.btnSuccess,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }}
  onClick={() => handleDownload(doc)}
  title="Download"
  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
>
  <FaDownload size={12} /> Download
</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5">
                    <div style={viewPageStyles.emptyState}>
                      <FaFileAlt size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                      <div style={{ fontSize: '16px', fontWeight: '500', color: '#475569' }}>No documents found for this employee</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
        <button style={viewPageStyles.btnSecondary} onClick={handleBackToList}>Close</button>
      </div>
    </div>
  </div>
)}

       
      </div>
    );
  }

  // ─── MAIN LIST PAGE ──────────────────────────────────────
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
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>
            <FaFilter style={{ marginRight: '8px' }} /> Filters
          </div>
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
                 <th>Documents</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
             <tbody>
  {currentEmployees.length > 0 ? (
    currentEmployees.map((emp, idx) => (
      <tr key={emp.id}>
        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>{startIndex + idx + 1}</td>
        <td style={{ fontWeight: '600', color: '#0f172a' }}>{emp.name}</td>
        <td>
          <span style={{ padding: '2px 10px', background: '#dbeafe', borderRadius: '12px', fontSize: '11px', color: '#2563eb' }}>
            {emp.department || '—'}
          </span>
        </td>
        <td>
          <span style={{ padding: '2px 10px', background: '#d1fae5', borderRadius: '12px', fontSize: '11px', color: '#059669' }}>
            {emp.branch || '—'}
          </span>
        </td>
        <td style={{ color: '#334155' }}>{emp.designation || '—'}</td>
        <td>
          <span style={{ padding: '2px 10px', background: '#fce7f3', borderRadius: '12px', fontSize: '11px', color: '#9d174d' }}>
            {emp.documentCount} Documents
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <button
              style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              onClick={() => handleViewEmployee(emp.name)}
              title="View All Documents"
            >
              <FaEye size={12} /> View
            </button>
          </div>
        </td>
      </tr>
    ))
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
    </div>
  );
};

export default ServiceBookDocumentRepository;