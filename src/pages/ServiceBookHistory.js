
import React, { useState, useEffect, useRef } from 'react';
import {
  FaSearch, FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt,
  FaBook, FaEye, FaDownload, FaPrint, FaTimes,
  FaCheckCircle, FaClock, FaUserCheck, FaFileAlt, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher,
  FaPlus, FaSave, FaEdit, FaTrash, FaArrowLeft, FaMapMarkerAlt,
  FaChevronLeft, FaChevronRight, FaSpinner, FaHistory, FaFilter,
  FaUsers, FaIdCard, FaInfoCircle, FaUserPlus, FaCalendarCheck,
  FaPhone, FaEnvelope, FaVenusMars, FaHome, FaMoneyBillWave,
  FaUserGraduate, FaAward, FaCalendarWeek, FaClipboardList,
  FaCamera
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const FieldError = ({ msg }) => msg ? <span className="text-danger small">{msg}</span> : null;

const DetailCard = ({ icon, label, value, bg, badge, color }) => (
  <div style={{ background: bg || '#f8fafc', borderRadius: '10px', padding: '16px 18px', border: '1px solid #e2e8f0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      {icon}
      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>
    {badge ? (
      <span style={{ display: 'inline-block', background: color?.bg || '#d1fae5', color: color?.text || '#065f46', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
        {value}
      </span>
    ) : (
      <p style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
        {value}
      </p>
    )}
  </div>
);

const ServiceBookHistory = ({ user, onCancel }) => {
  // ─── Employees Data ──────────────────────────────────────────
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'Rahul Sharma',
      code: 'EMP001',
      branch: 'Noida',
      department: 'IT',
      designation: 'Senior Developer',
      status: 'Active',
      joiningDate: '2020-01-10',
      retirementDate: '2058-12-31',
      photo: null,
      appointment: { orderNo: 'APP-001', appointmentDate: '2020-01-05', appointmentType: 'Direct', employmentType: 'Permanent', initialDesignation: 'Software Engineer', joiningDate: '2020-01-10' },
      confirmation: { confirmationDate: '2020-07-10', confirmationOrderNo: 'CONF-001', probationCompleted: 'Yes' },
      promotions: [{ effectiveDate: '2022-04-01', from: 'Software Engineer', to: 'Senior Software Engineer', orderNo: 'PRO-001' }, { effectiveDate: '2024-04-01', from: 'Senior Software Engineer', to: 'Team Lead', orderNo: 'PRO-002' }],
      transfers: [{ date: '2023-06-01', fromBranch: 'Noida', toBranch: 'Delhi', reason: 'Promotion' }],
      deputations: [{ organization: 'Ministry of Corporate Affairs', startDate: '2024-01-15', endDate: '2024-06-15', status: 'Completed' }],
      payRevisions: [{ effectiveDate: '2023-01-01', oldBasic: '50000', newBasic: '55000', orderNo: 'PAY-001' }],
      training: [{ trainingName: 'React Advanced', provider: 'Udemy', type: 'Technical', startDate: '2023-03-01', endDate: '2023-03-15', certificate: 'cert.pdf' }],
      awards: [{ awardName: 'Best Performer', date: '2023-12-01', issuedBy: 'CEO Office' }],
      disciplinary: [{ caseNo: 'DISC-001', action: 'Warning', status: 'Closed' }],
      qualifications: [{ qualification: 'B.Tech CSE', university: 'IIT Delhi', year: '2018' }],
      certifications: [{ certificate: 'AWS Certified', issuedBy: 'Amazon', validTill: '2026-12-31' }],
      documents: [{ documentName: 'Appointment Letter', uploadDate: '2020-01-10', download: '#' }]
    },
    {
      id: 2,
      name: 'Jane Smith',
      code: 'EMP002',
      branch: 'Delhi',
      department: 'HR',
      designation: 'HR Manager',
      status: 'Active',
      joiningDate: '2019-06-10',
      retirementDate: null,
      photo: null,
      appointment: { orderNo: 'APP-002', appointmentDate: '2019-06-05', appointmentType: 'Direct', employmentType: 'Permanent', initialDesignation: 'HR Executive', joiningDate: '2019-06-10' },
      confirmation: { confirmationDate: '2019-12-10', confirmationOrderNo: 'CONF-002', probationCompleted: 'Yes' },
      promotions: [{ effectiveDate: '2021-04-01', from: 'HR Executive', to: 'HR Manager', orderNo: 'PRO-003' }],
      transfers: [],
      deputations: [],
      payRevisions: [{ effectiveDate: '2022-01-01', oldBasic: '45000', newBasic: '50000', orderNo: 'PAY-002' }],
      training: [{ trainingName: 'Leadership Skills', provider: 'Coursera', type: 'Soft Skills', startDate: '2022-08-01', endDate: '2022-08-15', certificate: 'cert.pdf' }],
      awards: [{ awardName: 'Employee of the Year', date: '2022-12-01', issuedBy: 'CEO Office' }],
      disciplinary: [],
      qualifications: [{ qualification: 'MBA HR', university: 'XLRI', year: '2017' }],
      certifications: [{ certificate: 'SHRM Certified', issuedBy: 'SHRM', validTill: '2025-12-31' }],
      documents: [{ documentName: 'Appointment Letter', uploadDate: '2019-06-10', download: '#' }]
    },
    {
      id: 3,
      name: 'Mike Johnson',
      code: 'EMP003',
      branch: 'Noida',
      department: 'IT',
      designation: 'Senior Developer',
      status: 'Active',
      joiningDate: '2021-03-20',
      retirementDate: null,
      photo: null,
      appointment: { orderNo: 'APP-003', appointmentDate: '2021-03-15', appointmentType: 'Direct', employmentType: 'Permanent', initialDesignation: 'Junior Developer', joiningDate: '2021-03-20' },
      confirmation: { confirmationDate: '2021-09-20', confirmationOrderNo: 'CONF-003', probationCompleted: 'Yes' },
      promotions: [{ effectiveDate: '2023-04-01', from: 'Junior Developer', to: 'Senior Developer', orderNo: 'PRO-004' }],
      transfers: [],
      deputations: [],
      payRevisions: [{ effectiveDate: '2023-01-01', oldBasic: '40000', newBasic: '45000', orderNo: 'PAY-003' }],
      training: [{ trainingName: 'React Basics', provider: 'Udemy', type: 'Technical', startDate: '2023-02-01', endDate: '2023-02-15', certificate: 'cert.pdf' }],
      awards: [],
      disciplinary: [],
      qualifications: [{ qualification: 'B.Sc IT', university: 'Delhi University', year: '2019' }],
      certifications: [{ certificate: 'React Certified', issuedBy: 'Meta', validTill: '2025-03-20' }],
      documents: [{ documentName: 'Appointment Letter', uploadDate: '2021-03-20', download: '#' }]
    },
    {
      id: 4,
      name: 'Sarah Williams',
      code: 'EMP004',
      branch: 'Gurgaon',
      department: 'Sales',
      designation: 'Sales Manager',
      status: 'Retired',
      joiningDate: '2010-08-01',
      retirementDate: '2024-03-31',
      photo: null,
      appointment: { orderNo: 'APP-004', appointmentDate: '2010-07-25', appointmentType: 'Direct', employmentType: 'Permanent', initialDesignation: 'Sales Executive', joiningDate: '2010-08-01' },
      confirmation: { confirmationDate: '2011-02-01', confirmationOrderNo: 'CONF-004', probationCompleted: 'Yes' },
      promotions: [
        { effectiveDate: '2013-04-01', from: 'Sales Executive', to: 'Senior Sales Executive', orderNo: 'PRO-005' },
        { effectiveDate: '2017-04-01', from: 'Senior Sales Executive', to: 'Sales Manager', orderNo: 'PRO-006' }
      ],
      transfers: [{ date: '2015-06-01', fromBranch: 'Delhi', toBranch: 'Gurgaon', reason: 'New Branch' }],
      deputations: [],
      payRevisions: [
        { effectiveDate: '2015-01-01', oldBasic: '30000', newBasic: '35000', orderNo: 'PAY-004' },
        { effectiveDate: '2020-01-01', oldBasic: '50000', newBasic: '60000', orderNo: 'PAY-005' }
      ],
      training: [
        { trainingName: 'Sales Management', provider: 'Salesforce', type: 'Professional', startDate: '2018-05-01', endDate: '2018-05-15', certificate: 'cert.pdf' },
        { trainingName: 'Customer Relationship', provider: 'Zoho', type: 'Professional', startDate: '2020-06-01', endDate: '2020-06-10', certificate: 'cert.pdf' }
      ],
      awards: [
        { awardName: 'Top Sales Performer', date: '2015-12-01', issuedBy: 'CEO Office' },
        { awardName: 'Best Manager', date: '2019-12-01', issuedBy: 'CEO Office' }
      ],
      disciplinary: [],
      qualifications: [{ qualification: 'MBA Marketing', university: 'IIM Lucknow', year: '2008' }],
      certifications: [],
      documents: [{ documentName: 'Appointment Letter', uploadDate: '2010-08-01', download: '#' }]
    },
    {
      id: 5,
      name: 'David Brown',
      code: 'EMP005',
      branch: 'Noida',
      department: 'Finance',
      designation: 'Accountant',
      status: 'Active',
      joiningDate: '2022-01-10',
      retirementDate: null,
      photo: null,
      appointment: { orderNo: 'APP-005', appointmentDate: '2022-01-05', appointmentType: 'Direct', employmentType: 'Permanent', initialDesignation: 'Accountant', joiningDate: '2022-01-10' },
      confirmation: { confirmationDate: '2022-07-10', confirmationOrderNo: 'CONF-005', probationCompleted: 'Yes' },
      promotions: [],
      transfers: [],
      deputations: [],
      payRevisions: [{ effectiveDate: '2023-01-01', oldBasic: '35000', newBasic: '38000', orderNo: 'PAY-006' }],
      training: [{ trainingName: 'Advanced Excel', provider: 'Coursera', type: 'Technical', startDate: '2022-04-01', endDate: '2022-04-10', certificate: 'cert.pdf' }],
      awards: [],
      disciplinary: [{ caseNo: 'DISC-002', action: 'Misconduct', status: 'Pending' }],
      qualifications: [{ qualification: 'B.Com', university: 'Delhi University', year: '2020' }],
      certifications: [],
      documents: [{ documentName: 'Appointment Letter', uploadDate: '2022-01-10', download: '#' }]
    }
  ]);

  const DUMMY_EMPLOYEES = [
    { id: 1, name: 'Rahul Sharma', code: 'EMP001', department: 'IT', designation: 'Senior Developer', branch: 'Noida' },
    { id: 2, name: 'Jane Smith', code: 'EMP002', department: 'HR', designation: 'HR Manager', branch: 'Delhi' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003', department: 'IT', designation: 'Senior Developer', branch: 'Noida' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004', department: 'Sales', designation: 'Sales Manager', branch: 'Gurgaon' },
    { id: 5, name: 'David Brown', code: 'EMP005', department: 'Finance', designation: 'Accountant', branch: 'Noida' }
  ];

  // ─── State ──────────────────────────────────────────────────
  const printRef = useRef(null);
  const fileInputRef = useRef(null);

  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(4);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ─── Filter States ──────────────────────────────────────────
  const [filters, setFilters] = useState({
    employeeName: '',
    employeeCode: '',
    branch: '',
    department: '',
    designation: '',
    status: ''
  });
  const branches = ['Noida', 'Delhi', 'Gurgaon', 'Mumbai', 'Bangalore', 'Pune'];  // ✅ Branch list
  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations'];
  const designations = ['Software Engineer', 'Senior Developer', 'Tech Lead', 'HR Manager', 'Sales Manager', 'Accountant', 'Marketing Manager', 'Operations Manager', 'Product Manager'];
  const statuses = ['Active', 'Retired'];

  const hasActiveFilters = Object.values(filters).some(val => val !== '');

  useEffect(() => {
    if (!hasActiveFilters) {
      setFilteredEmployees([]);
      return;
    }
    let filtered = [...employees];
    if (filters.employeeName) {
      const search = filters.employeeName.toLowerCase();
      filtered = filtered.filter(emp => emp.name.toLowerCase().includes(search));
    }
    if (filters.employeeCode) {
      const search = filters.employeeCode.toLowerCase();
      filtered = filtered.filter(emp => emp.code?.toLowerCase().includes(search));
    }
    if (filters.branch) {
      filtered = filtered.filter(emp => emp.branch === filters.branch);
    }
    if (filters.department) {
      filtered = filtered.filter(emp => emp.department === filters.department);
    }
    if (filters.designation) {
      filtered = filtered.filter(emp => emp.designation === filters.designation);
    }
    if (filters.status) {
      filtered = filtered.filter(emp => emp.status === filters.status);
    }
    setFilteredEmployees(filtered);
    setPage(0);
  }, [filters, employees]);

  const filteredEmployeeResults = DUMMY_EMPLOYEES.filter(emp => {
    const search = employeeSearchTerm.toLowerCase();
    return emp.name.toLowerCase().includes(search) || emp.code.toLowerCase().includes(search);
  });

  const handleEmployeeSelect = (employee) => {
    const emp = employees.find(e => e.id === employee.id) || employee;
    setSelectedEmployee(emp);
    setEmployeeSearchTerm(employee.name);
    setShowEmployeeDropdown(false);
  };

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

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      employeeName: '',
      employeeCode: '',
      branch: '',
      department: '',
      designation: '',
      status: ''
    });
    setFilteredEmployees([]);
    setPage(0);
  };

  // ─── Image Upload ──────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('Invalid File', 'Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('File too large', 'Maximum file size is 5MB');
      return;
    }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const photoData = reader.result;
      setEmployees(prev => prev.map(emp =>
        emp.id === viewEmployee?.id ? { ...emp, photo: photoData } : emp
      ));
      setViewEmployee(prev => prev ? { ...prev, photo: photoData } : null);
      setUploadingPhoto(false);
      toast.success('Success', 'Photo uploaded successfully');
    };
    reader.onerror = () => {
      setUploadingPhoto(false);
      toast.error('Error', 'Failed to upload photo');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = () => {
    if (!viewEmployee) return;
    setEmployees(prev => prev.map(emp =>
      emp.id === viewEmployee.id ? { ...emp, photo: null } : emp
    ));
    setViewEmployee(prev => prev ? { ...prev, photo: null } : null);
    toast.info('Removed', 'Photo removed successfully');
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleViewEmployee = (employee) => {
    setViewEmployee(employee);
    setShowDetailView(true);
  };

  const handleBackFromDetail = () => {
    setShowDetailView(false);
    setViewEmployee(null);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      Active: { bg: '#d1fae5', color: '#065f46', dot: '#10b981', label: 'Active' },
      Retired: { bg: '#fed7aa', color: '#9a3412', dot: '#f59e0b', label: 'Retired' },
      Terminated: { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Terminated' }
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

  // ─── Print Handler ──────────────────────────────────────────
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) {
      toast.warning('Print Error', 'No content to print');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Error', 'Please allow popups for printing');
      return;
    }
    const allStyles = document.querySelectorAll('style');
    let stylesHTML = '';
    allStyles.forEach(style => {
      stylesHTML += style.innerHTML;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>${viewEmployee?.name || 'Employee'} - Service Record</title>
          <style>
            ${stylesHTML}
            body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 40px; background: white; }
            .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
            .cert-status-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; display: inline-block; }
            @media print { body { padding: 20px; } button { display: none !important; } .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div style="max-width: 1100px; margin: 0 auto;">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ─── Download PDF ──────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!viewEmployee) {
      toast.warning('Error', 'No employee data to download');
      return;
    }
    toast.info('Generating PDF', 'Please wait...');
    try {
      const html2pdf = await import('html2pdf.js');
      const element = printRef.current;
      if (!element) {
        toast.error('Error', 'No content to export');
        return;
      }
      const opt = {
        margin: 10,
        filename: `${viewEmployee.name}_Service_Record.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf.default().set(opt).from(element).save();
      toast.success('Success', 'PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Error', 'Failed to download PDF. Please try again.');
    }
  };

  const styles = {
    container: { padding: '24px 28px', background: 'linear-gradient(135deg, #f8f9fc 0%, #f0f2f8 100%)', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
    headerCard: { background: 'white', borderRadius: '20px', padding: '20px 28px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e8ecf1' },
    headerTitle: { fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-0.03em' },
    headerSubtitle: { fontSize: '14px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' },
    iconContainer: { width: '52px', height: '52px', background: 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', boxShadow: '0 8px 24px rgba(157,23,77,0.3)' },
    filterCard: { background: 'white', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8ecf1' },
    tableCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8ecf1' },
    tableHeader: { background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '2px solid #e2e8f0' },
    tableHeaderCell: { padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' },
    tableRow: { transition: 'all 0.2s ease', cursor: 'pointer' },
    tableCell: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' },
    actionBtn: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9d174d', transition: 'all 0.2s ease' },
    secondaryBtn: { padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' },
    detailCard: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e8ecf1' },
    detailHeader: { background: 'linear-gradient(135deg, #9d174d 0%, #be185d 100%)', padding: '28px 32px', color: 'white' },
    detailSection: { padding: '32px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' },
    sectionHeader: { fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    tableGrid: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    tableGridHeader: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase', background: '#faf5f7', borderBottom: '1.5px solid #e2e8f0' },
    tableGridCell: { padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .cert-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 2px solid #fff; animation: spin 0.8s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .cert-status-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; display: inline-block; }
        .cert-table-row-hover:hover { background-color: #f9fafc; transition: background-color 0.2s ease; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
        .photo-upload-container { position: relative; }
        .photo-upload-container .photo-hover { opacity: 0; transition: opacity 0.3s ease; }
        .photo-upload-container:hover .photo-hover { opacity: 1; }
        @media (max-width: 768px) { .filter-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .filter-grid { grid-template-columns: 1fr; } }
        .text-muted { color: #94a3b8; }
        .small { font-size: 12px; }
        .no-print { display: inline-block; } 
        @media print { .no-print { display: none !important; } }
        .filter-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; }
        .filter-input { width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: #f8fafc; transition: all 0.3s ease; font-family: "'Inter', sans-serif"; }
        .filter-input:focus { border-color: #9d174d; background: white; box-shadow: 0 0 0 4px rgba(157,23,77,0.1); }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #eef2ff; color: #9d174d; }
        .form-control { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: #f8fafc; transition: all 0.3s ease; width: 100%; font-family: "'Inter', sans-serif"; }
        .form-control:focus { border-color: #9d174d; background: white; box-shadow: 0 0 0 4px rgba(157,23,77,0.1); }
        .cert-back-btn { padding: 10px 20px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: white; color: #475569; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s ease; }
        .cert-back-btn:hover { border-color: #9d174d; color: #9d174d; }
        .position-relative { position: relative; }
        .photo-upload-btn { position: absolute; bottom: 0; right: 0; background: #9d174d; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: all 0.3s ease; }
        .photo-upload-btn:hover { transform: scale(1.1); background: #7a0e3a; }
        .photo-remove-btn { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-size: 12px; transition: all 0.3s ease; }
        .photo-remove-btn:hover { transform: scale(1.1); background: #dc2626; }
      `}</style>

      {/* ─── HEADER ──────────────────────────────────────────── */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* ─── LEFT: Icon + Title ──────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={styles.iconContainer}><FaBook size={20} /></div>
            <div>
              <h1 style={styles.headerTitle}> Employee Service Book History</h1>
              <p style={styles.headerSubtitle}>
                {showDetailView ? ` ${viewEmployee?.name} - Service Record` :
                  hasActiveFilters ? ` ${totalItems.toLocaleString()} employee${totalItems !== 1 ? 's' : ''} found` :
                    'Apply filters to search employee records'}
              </p>
            </div>
          </div>

          {/* ─── RIGHT: Print + PDF + Back/Cancel ────────────── */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {showDetailView && viewEmployee && (
              <>
                <button
                  onClick={handlePrint}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)'; }}
                >
                  <FaPrint size={14} /> Print Service Book
                </button>

                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(5,150,105,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,150,105,0.3)'; }}
                >
                  <FaDownload size={14} /> Download PDF
                </button>
              </>
            )}

            {!showDetailView && onCancel && (
              <button className="cert-back-btn" onClick={handleCancel}>
                <FaTimes size={13} /> Cancel
              </button>
            )}
            {showDetailView && (
              <button type="button" className="cert-back-btn" onClick={handleBackFromDetail}>
                <FaArrowLeft size={12} /> Back
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── DETAIL VIEW ────────────────────────────────────────── */}
      {showDetailView && viewEmployee ? (
        <div style={styles.detailCard} ref={printRef}>
          {/* ─── Header with Photo ──────────────────────────────── */}
          <div style={styles.detailHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              {/* ─── LEFT: Photo Upload ────────────────────────── */}
              <div className="photo-upload-container" style={{ position: 'relative', flexShrink: 0 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                  {viewEmployee.photo ? (
                    <img
                      src={viewEmployee.photo}
                      alt={viewEmployee.name}
                      style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 4px 16px rgba(157,23,77,0.4)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #9d174d 0%, #be185d 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '48px', fontWeight: '700',
                      boxShadow: '0 4px 16px rgba(157,23,77,0.4)',
                      border: '4px solid rgba(255,255,255,0.3)'
                    }}>
                      {getInitials(viewEmployee.name)}
                    </div>
                  )}

                  <button
                    className="photo-upload-btn no-print"
                    onClick={triggerFileInput}
                    title="Upload Photo"
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? <FaSpinner className="cert-spinner" /> : <FaCamera size={14} />}
                  </button>

                  {viewEmployee.photo && (
                    <button
                      className="photo-remove-btn no-print"
                      onClick={handlePhotoRemove}
                      title="Remove Photo"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* ─── RIGHT: Employee Details ───────────────────── */}
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'white' }}>{viewEmployee.name}</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', fontSize: '14px', opacity: 0.9 }}>
                  <span><FaIdCard size={12} style={{ marginRight: '6px' }} /> ID: {viewEmployee.id}</span>
                  <span><FaIdCard size={12} style={{ marginRight: '6px' }} /> {viewEmployee.code}</span>

                  <span><FaBuilding size={12} style={{ marginRight: '6px' }} /> {viewEmployee.department}</span>
                  <span><FaUserTie size={12} style={{ marginRight: '6px' }} /> {viewEmployee.designation}</span>
                  {getStatusBadge(viewEmployee.status)}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.detailSection}>
            {/* ─── Section 1: Personal Information ──────────────────── */}
            <div style={{ marginBottom: '28px' }}>
              <h4 style={styles.sectionHeader}><FaUserTie size={16} color="#9d174d" /> Personal Information</h4>
              <div className="detail-grid">
                <DetailCard icon={<FaIdCard size={14} color="#9d174d" />} label="Employee ID" value={viewEmployee.id} bg="#f8fafc" />
                <DetailCard icon={<FaIdCard size={14} color="#9d174d" />} label="Employee Code" value={viewEmployee.code} bg="#f8fafc" />
                <DetailCard icon={<FaMapMarkerAlt size={14} color="#9d174d" />} label="Branch" value={viewEmployee.branch || 'Noida'} bg="#f8fafc" />
                <DetailCard icon={<FaBuilding size={14} color="#9d174d" />} label="Department" value={viewEmployee.department} bg="#f8fafc" />
                <DetailCard icon={<FaUserTie size={14} color="#9d174d" />} label="Designation" value={viewEmployee.designation} bg="#f8fafc" />
                <DetailCard icon={<FaCalendarAlt size={14} color="#9d174d" />} label="Joining Date" value={formatDate(viewEmployee.joiningDate)} bg="#f8fafc" />
                <DetailCard icon={<FaClock size={14} color="#9d174d" />} label="Status" value={getStatusBadge(viewEmployee.status)} bg="#f8fafc" badge />
                {viewEmployee.retirementDate && (
                  <DetailCard icon={<FaCalendarAlt size={14} color="#9d174d" />} label="Retirement Date" value={formatDate(viewEmployee.retirementDate)} bg="#f8fafc" />
                )}
              </div>
            </div>

            {/* ─── Section 2: Appointment Details ──────────────────── */}
            {viewEmployee.appointment && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaFileAlt size={16} color="#9d174d" /> Appointment Details</h4>
                <div className="detail-grid">
                  <DetailCard icon={<FaFileAlt size={14} color="#9d174d" />} label="Order No" value={viewEmployee.appointment.orderNo} bg="#f8fafc" />
                  <DetailCard icon={<FaCalendarAlt size={14} color="#9d174d" />} label="Appointment Date" value={formatDate(viewEmployee.appointment.appointmentDate)} bg="#f8fafc" />
                  <DetailCard icon={<FaUserPlus size={14} color="#9d174d" />} label="Appointment Type" value={viewEmployee.appointment.appointmentType} bg="#f8fafc" />
                  <DetailCard icon={<FaBriefcase size={14} color="#9d174d" />} label="Employment Type" value={viewEmployee.appointment.employmentType} bg="#f8fafc" />
                  <DetailCard icon={<FaUserTie size={14} color="#9d174d" />} label="Initial Designation" value={viewEmployee.appointment.initialDesignation} bg="#f8fafc" />
                  <DetailCard icon={<FaCalendarAlt size={14} color="#9d174d" />} label="Joining Date" value={formatDate(viewEmployee.appointment.joiningDate)} bg="#f8fafc" />
                </div>
              </div>
            )}

            {/* ─── Section 3: Confirmation ──────────────────────────── */}
            {viewEmployee.confirmation && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaUserCheck size={16} color="#9d174d" /> Confirmation</h4>
                <div className="detail-grid">
                  <DetailCard icon={<FaCalendarAlt size={14} color="#9d174d" />} label="Confirmation Date" value={formatDate(viewEmployee.confirmation.confirmationDate)} bg="#f8fafc" />
                  <DetailCard icon={<FaFileAlt size={14} color="#9d174d" />} label="Order No" value={viewEmployee.confirmation.confirmationOrderNo} bg="#f8fafc" />
                  <DetailCard icon={<FaCheckCircle size={14} color="#9d174d" />} label="Probation Completed" value={viewEmployee.confirmation.probationCompleted} bg="#f8fafc" badge color={{ bg: '#d1fae5', text: '#065f46' }} />
                </div>
              </div>
            )}

            {/* ─── Section 4: Promotion History ────────────────────── */}
            {viewEmployee.promotions && viewEmployee.promotions.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaChartLine size={16} color="#9d174d" /> Promotion History</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Effective Date</th>
                        <th style={styles.tableGridHeader}>From</th>
                        <th style={styles.tableGridHeader}>To</th>
                        <th style={styles.tableGridHeader}>Order No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.promotions.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{formatDate(item.effectiveDate)}</td>
                          <td style={styles.tableGridCell}>{item.from}</td>
                          <td style={styles.tableGridCell}>{item.to}</td>
                          <td style={styles.tableGridCell}>{item.orderNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 5: Transfer History ────────────────────── */}
            {viewEmployee.transfers && viewEmployee.transfers.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaExchangeAlt size={16} color="#9d174d" /> Transfer History</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Date</th>
                        <th style={styles.tableGridHeader}>From Branch</th>
                        <th style={styles.tableGridHeader}>To Branch</th>
                        <th style={styles.tableGridHeader}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.transfers.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{formatDate(item.date)}</td>
                          <td style={styles.tableGridCell}>{item.fromBranch}</td>
                          <td style={styles.tableGridCell}>{item.toBranch}</td>
                          <td style={styles.tableGridCell}>{item.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 6: Deputation History ────────────────────── */}
            {viewEmployee.deputations && viewEmployee.deputations.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaExchangeAlt size={16} color="#9d174d" /> Deputation History</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Organization</th>
                        <th style={styles.tableGridHeader}>Start</th>
                        <th style={styles.tableGridHeader}>End</th>
                        <th style={styles.tableGridHeader}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.deputations.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{item.organization}</td>
                          <td style={styles.tableGridCell}>{formatDate(item.startDate)}</td>
                          <td style={styles.tableGridCell}>{formatDate(item.endDate)}</td>
                          <td style={styles.tableGridCell}>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 7: Pay Revision ────────────────────────── */}
            {viewEmployee.payRevisions && viewEmployee.payRevisions.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaMoneyBillWave size={16} color="#9d174d" /> Pay Revision</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Effective Date</th>
                        <th style={styles.tableGridHeader}>Old Basic</th>
                        <th style={styles.tableGridHeader}>New Basic</th>
                        <th style={styles.tableGridHeader}>Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.payRevisions.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{formatDate(item.effectiveDate)}</td>
                          <td style={styles.tableGridCell}>₹{item.oldBasic}</td>
                          <td style={styles.tableGridCell}>₹{item.newBasic}</td>
                          <td style={styles.tableGridCell}>{item.orderNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 8: Training History ────────────────────── */}
            {viewEmployee.training && viewEmployee.training.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaChalkboardTeacher size={16} color="#9d174d" /> Training History</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Training</th>
                        <th style={styles.tableGridHeader}>Provider</th>
                        <th style={styles.tableGridHeader}>Type</th>
                        <th style={styles.tableGridHeader}>Start</th>
                        <th style={styles.tableGridHeader}>End</th>
                        <th style={styles.tableGridHeader}>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.training.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{item.trainingName}</td>
                          <td style={styles.tableGridCell}>{item.provider}</td>
                          <td style={styles.tableGridCell}>{item.type}</td>
                          <td style={styles.tableGridCell}>{formatDate(item.startDate)}</td>
                          <td style={styles.tableGridCell}>{formatDate(item.endDate)}</td>
                          <td style={styles.tableGridCell}>{item.certificate ? '✅' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 9: Awards & Recognition ────────────────── */}
            {viewEmployee.awards && viewEmployee.awards.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaTrophy size={16} color="#9d174d" /> Awards & Recognition</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Award</th>
                        <th style={styles.tableGridHeader}>Date</th>
                        <th style={styles.tableGridHeader}>Issued By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.awards.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{item.awardName}</td>
                          <td style={styles.tableGridCell}>{formatDate(item.date)}</td>
                          <td style={styles.tableGridCell}>{item.issuedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 10: Disciplinary Records ────────────────── */}
            {viewEmployee.disciplinary && viewEmployee.disciplinary.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaClipboardList size={16} color="#9d174d" /> Disciplinary Records</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Case No</th>
                        <th style={styles.tableGridHeader}>Action</th>
                        <th style={styles.tableGridHeader}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.disciplinary.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{item.caseNo}</td>
                          <td style={styles.tableGridCell}>{item.action}</td>
                          <td style={styles.tableGridCell}>
                            <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: item.status === 'Closed' ? '#d1fae5' : '#fef3c7', color: item.status === 'Closed' ? '#065f46' : '#92400e' }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 11: Qualification ────────────────────────── */}
            {viewEmployee.qualifications && viewEmployee.qualifications.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaUserGraduate size={16} color="#9d174d" /> Qualification</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Qualification</th>
                        <th style={styles.tableGridHeader}>University</th>
                        <th style={styles.tableGridHeader}>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.qualifications.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{item.qualification}</td>
                          <td style={styles.tableGridCell}>{item.university}</td>
                          <td style={styles.tableGridCell}>{item.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 12: Certifications ────────────────────────── */}
            {viewEmployee.certifications && viewEmployee.certifications.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaAward size={16} color="#9d174d" /> Certifications</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Certificate</th>
                        <th style={styles.tableGridHeader}>Issued By</th>
                        <th style={styles.tableGridHeader}>Valid Till</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.certifications.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{item.certificate}</td>
                          <td style={styles.tableGridCell}>{item.issuedBy}</td>
                          <td style={styles.tableGridCell}>{formatDate(item.validTill)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Section 13: Documents ────────────────────────────── */}
            {viewEmployee.documents && viewEmployee.documents.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h4 style={styles.sectionHeader}><FaFileAlt size={16} color="#9d174d" /> Documents</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.tableGrid}>
                    <thead>
                      <tr>
                        <th style={styles.tableGridHeader}>Document</th>
                        <th style={styles.tableGridHeader}>Upload Date</th>
                        <th style={styles.tableGridHeader}>Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployee.documents.map((item, idx) => (
                        <tr key={idx}>
                          <td style={styles.tableGridCell}>{item.documentName}</td>
                          <td style={styles.tableGridCell}>{formatDate(item.uploadDate)}</td>
                          <td style={styles.tableGridCell}>
                            <a href={item.download} style={{ color: '#9d174d', textDecoration: 'none', fontWeight: '600' }}>
                              <FaDownload size={12} /> Download
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* ─── Section 14: Timeline ────────────────────────────── */}
            <div className="mb-4">
              <h4 className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                <FaHistory size={16} color="#9d174d" /> Timeline
              </h4>

              <div className="card border-0 shadow-sm" style={{ background: '#f8fafc', borderRadius: '12px' }}>
                <div className="card-body p-4">
                  <ul className="list-unstyled mb-0 position-relative" style={{ paddingLeft: '30px' }}>
                    {/* Timeline Line */}
                    <div className="position-absolute" style={{
                      left: '14px',
                      top: '12px',
                      bottom: '12px',
                      width: '2px',
                      background: 'linear-gradient(180deg, #9d174d, #e2e8f0)'
                    }} />

                    {/* Event 1: 2020 Appointment */}
                    <li className="mb-3 position-relative">
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-circle bg-primary flex-shrink-0 mt-1" style={{ width: '14px', height: '14px', border: '2px solid white', boxShadow: '0 0 0 2px #9d174d', zIndex: 1 }} />
                        <div className="bg-white rounded-3 p-3 w-100 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="badge bg-primary px-2 py-1" style={{ background: '#9d174d' }}>2020</span>
                            <span className="fw-semibold text-dark">📋 Appointment</span>
                            <span className="text-muted ms-auto small">10 Jan 2020</span>
                          </div>
                          <div className="text-muted small mt-1">Joined as Software Engineer</div>
                        </div>
                      </div>
                    </li>

                    {/* Event 2: 2020 Confirmation */}
                    <li className="mb-3 position-relative">
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-circle bg-success flex-shrink-0 mt-1" style={{ width: '14px', height: '14px', border: '2px solid white', boxShadow: '0 0 0 2px #10b981', zIndex: 1 }} />
                        <div className="bg-white rounded-3 p-3 w-100 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="badge px-2 py-1" style={{ background: '#10b981' }}>2020</span>
                            <span className="fw-semibold text-dark">✅ Confirmation</span>
                            <span className="text-muted ms-auto small">10 Jul 2020</span>
                          </div>
                          <div className="text-muted small mt-1">Probation completed successfully</div>
                        </div>
                      </div>
                    </li>

                    {/* Event 3: 2022 Promotion */}
                    <li className="mb-3 position-relative">
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-circle flex-shrink-0 mt-1" style={{ width: '14px', height: '14px', background: '#f59e0b', border: '2px solid white', boxShadow: '0 0 0 2px #f59e0b', zIndex: 1 }} />
                        <div className="bg-white rounded-3 p-3 w-100 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="badge px-2 py-1" style={{ background: '#f59e0b' }}>2022</span>
                            <span className="fw-semibold text-dark">📈 Promotion</span>
                            <span className="text-muted ms-auto small">01 Apr 2022</span>
                          </div>
                          <div className="text-muted small mt-1">Software Engineer → Senior Software Engineer</div>
                        </div>
                      </div>
                    </li>

                    {/* Event 4: 2023 Training */}
                    <li className="mb-3 position-relative">
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-circle flex-shrink-0 mt-1" style={{ width: '14px', height: '14px', background: '#6366f1', border: '2px solid white', boxShadow: '0 0 0 2px #6366f1', zIndex: 1 }} />
                        <div className="bg-white rounded-3 p-3 w-100 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="badge px-2 py-1" style={{ background: '#6366f1' }}>2023</span>
                            <span className="fw-semibold text-dark">📚 Training</span>
                            <span className="text-muted ms-auto small">01 Mar 2023</span>
                          </div>
                          <div className="text-muted small mt-1">React Advanced - Technical Training</div>
                        </div>
                      </div>
                    </li>

                    {/* Event 5: 2024 Transfer */}
                    <li className="mb-3 position-relative">
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-circle flex-shrink-0 mt-1" style={{ width: '14px', height: '14px', background: '#8b5cf6', border: '2px solid white', boxShadow: '0 0 0 2px #8b5cf6', zIndex: 1 }} />
                        <div className="bg-white rounded-3 p-3 w-100 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="badge px-2 py-1" style={{ background: '#8b5cf6' }}>2024</span>
                            <span className="fw-semibold text-dark">🔄 Transfer</span>
                            <span className="text-muted ms-auto small">15 Jan 2024</span>
                          </div>
                          <div className="text-muted small mt-1">Deputation - Ministry of Corporate Affairs</div>
                        </div>
                      </div>
                    </li>

                    {/* Event 6: 2025 Award */}
                    <li className="position-relative">
                      <div className="d-flex align-items-start gap-3">
                        <div className="rounded-circle flex-shrink-0 mt-1" style={{ width: '14px', height: '14px', background: '#ec4899', border: '2px solid white', boxShadow: '0 0 0 2px #ec4899', zIndex: 1 }} />
                        <div className="bg-white rounded-3 p-3 w-100 shadow-sm" style={{ border: '1px solid #f1f5f9' }}>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="badge px-2 py-1" style={{ background: '#ec4899' }}>2025</span>
                            <span className="fw-semibold text-dark">🏆 Award</span>
                            <span className="text-muted ms-auto small">15 Jan 2025</span>
                          </div>
                          <div className="text-muted small mt-1">Best Performer - CEO Office</div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ─── FILTER & TABLE VIEW ──────────────────────────────
        <>
          <div style={styles.filterCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  <FaFilter style={{ marginRight: '8px' }} /> Filters
                </div>
                {hasActiveFilters && (
                  <span style={{ fontSize: '12px', color: '#9d174d', background: '#eef2ff', padding: '3px 12px', borderRadius: '12px', fontWeight: '500' }}>
                    {totalItems.toLocaleString()} results
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} style={{ padding: '6px 14px', fontSize: '12px', color: '#ef4444', background: 'transparent', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <FaTimes size={10} /> Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="filter-grid">
              <div>
                <label className="filter-label">Employee Name</label>
                <input type="text" className="filter-input" placeholder="Enter name..." value={filters.employeeName} onChange={(e) => handleFilterChange('employeeName', e.target.value)} />
              </div>
              <div>
                <label className="filter-label">Employee Code</label>
                <input type="text" className="filter-input" placeholder="e.g., EMP001" value={filters.employeeCode} onChange={(e) => handleFilterChange('employeeCode', e.target.value)} />
              </div>
              <div>
                <label className="filter-label">Branch</label>
                <select className="filter-input" value={filters.branch} onChange={(e) => handleFilterChange('branch', e.target.value)}>
                  <option value="">All Branches</option>
                  {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                </select>
              </div>
              <div>
                <label className="filter-label">Department</label>
                <select className="filter-input" value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div>
                <label className="filter-label">Designation</label>
                <select className="filter-input" value={filters.designation} onChange={(e) => handleFilterChange('designation', e.target.value)}>
                  <option value="">All Designations</option>
                  {designations.map(desg => <option key={desg} value={desg}>{desg}</option>)}
                </select>
              </div>
              <div>
                <label className="filter-label">Status</label>
                <select className="filter-input" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                  <option value="">All Status</option>
                  {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {hasActiveFilters ? (
            <div className="fade-in" style={styles.tableCard}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.tableHeaderCell}>#</th>
                      <th style={styles.tableHeaderCell}>Employee</th>
                      <th style={styles.tableHeaderCell}>Code</th>
                      <th style={styles.tableHeaderCell}>Branch</th>
                      <th style={styles.tableHeaderCell}>Department</th>
                      <th style={styles.tableHeaderCell}>Designation</th>
                      <th style={styles.tableHeaderCell}>Joining Date</th>
                      <th style={styles.tableHeaderCell}>Status</th>
                      <th style={{ ...styles.tableHeaderCell, textAlign: 'center', width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.length > 0 ? (
                      currentEmployees.map((emp, idx) => (
                        <tr key={emp.id} style={styles.tableRow} className="cert-table-row-hover"
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
                          <td style={styles.tableCell}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', background: '#eef2ff', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', color: '#9d174d' }}>
                              {startIndex + idx + 1}
                            </span>
                          </td>
                          <td style={styles.tableCell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #9d174d 0%, #be185d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                                {getInitials(emp.name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{emp.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...styles.tableCell, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{emp.code}</td>
                          <td style={styles.tableCell}>
                            <span className="cert-status-badge" style={{ background: '#eef2ff', color: '#9d174d' }}>
                              {emp.branch || '—'}
                            </span>
                          </td>
                          <td style={styles.tableCell}>
                            <span className="cert-status-badge" style={{ background: '#eef2ff', color: '#9d174d' }}>{emp.department}</span>
                          </td>
                          <td style={styles.tableCell}>{emp.designation}</td>
                          <td style={{ ...styles.tableCell, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{formatDate(emp.joiningDate)}</td>
                          <td style={styles.tableCell}>{getStatusBadge(emp.status)}</td>
                          <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                              <button onClick={() => handleViewEmployee(emp)} style={styles.actionBtn} title="View"
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#9d174d'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#9d174d'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#9d174d'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                <FaEye size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>
                          <FaSearch size={36} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                          <h3 style={{ color: '#475569', margin: 0, fontSize: '16px' }}>No records found</h3>
                          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Try adjusting your filter criteria</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e8ecf1', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems} records
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button disabled={page === 0} onClick={() => setPage(page - 1)} style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '13px', fontWeight: '500', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
                      <FaChevronLeft size={11} /> Prev
                    </button>
                    {getPaginationRange().map((pg, i) =>
                      pg === '...' ? (
                        <span key={`dots-${i}`} style={{ padding: '6px 4px', color: '#94a3b8', fontWeight: '600' }}>…</span>
                      ) : (
                        <button key={pg} onClick={() => setPage(pg)} style={{ padding: '8px 14px', borderRadius: '10px', border: pg === page ? 'none' : '1.5px solid #e2e8f0', background: pg === page ? 'linear-gradient(135deg, #9d174d 0%, #9d174d 100%)' : 'white', color: pg === page ? 'white' : '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: pg === page ? '700' : '500', minWidth: '38px' }}>
                          {pg + 1}
                        </button>
                      )
                    )}
                    <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '13px', fontWeight: '500', cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer', opacity: page + 1 >= totalPages ? 0.4 : 1 }}>
                      Next <FaChevronRight size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ServiceBookHistory;