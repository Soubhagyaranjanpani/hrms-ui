
// import React, { useState, useEffect } from 'react';
// import {
//   FaFileAlt, FaDownload, FaFilter, FaTimes, FaSearch,
//   FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, FaChartLine,
//   FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher, FaClock,
//   FaBook, FaEye, FaCheckCircle, FaUserCheck, FaArrowUp, FaMapMarkerAlt,
//   FaChevronDown
// } from 'react-icons/fa';
// import { toast } from '../components/Toast';

// const ServiceBookReport = ({ onCancel }) => {
//   // ============================================
//   // STATE
//   // ============================================
//   const [filters, setFilters] = useState({
//     department: '',
//     designation: '',
//     branch: '',
//     employeeName: '',
//     status: '',
//     dateFrom: '',
//     dateTo: ''
//   });
//   const [showFilters, setShowFilters] = useState(true);
//   const [filteredData, setFilteredData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [page, setPage] = useState(0);
//   const [rowsPerPage] = useState(5);
//   const [showResults, setShowResults] = useState(false);

//   // ============================================
//   // DUMMY DATA
//   // ============================================
//   const DUMMY_EMPLOYEES = [
//     {
//       id: 1,
//       employeeId: 'EMP001',
//       employeeName: 'John Doe',
//       department: 'IT',
//       designation: 'Software Engineer',
//       branch: 'Mumbai',
//       status: 'Active',
//       joiningDate: '2020-01-15',
//       retirementDate: null,
//       serviceBookNumber: 'SB/2020/0001',
//       totalYears: 4.5,
//       appointments: [{ date: '2020-01-15', type: 'Appointment' }],
//       promotions: [
//         { date: '2021-03-01', from: 'Software Engineer', to: 'Senior Software Engineer' },
//         { date: '2023-01-15', from: 'Senior Software Engineer', to: 'Tech Lead' }
//       ],
//       transfers: [{ date: '2022-06-01', from: 'Mumbai', to: 'Bangalore' }],
//       trainings: [
//         { date: '2021-08-10', name: 'Leadership Program' },
//         { date: '2023-02-15', name: 'Cloud Architecture' }
//       ],
//       awards: [{ date: '2022-01-20', name: 'Star Performer' }],
//       disciplinary: [],
//       payRevisions: [{ date: '2023-01-01', oldPay: '50,000', newPay: '60,000' }],
//       retirements: []
//     },
//     {
//       id: 2,
//       employeeId: 'EMP002',
//       employeeName: 'Jane Smith',
//       department: 'HR',
//       designation: 'HR Manager',
//       branch: 'Delhi',
//       status: 'Active',
//       joiningDate: '2019-06-10',
//       retirementDate: null,
//       serviceBookNumber: 'SB/2019/0023',
//       totalYears: 5.8,
//       appointments: [{ date: '2019-06-10', type: 'Appointment' }],
//       promotions: [{ date: '2022-04-01', from: 'Sr. HR Executive', to: 'HR Manager' }],
//       transfers: [],
//       trainings: [
//         { date: '2020-02-10', name: 'HR Analytics' },
//         { date: '2022-08-15', name: 'Leadership Development' }
//       ],
//       awards: [
//         { date: '2021-12-15', name: 'HR Excellence' },
//         { date: '2023-03-20', name: 'Best Manager' }
//       ],
//       disciplinary: [],
//       payRevisions: [{ date: '2022-04-01', oldPay: '60,000', newPay: '75,000' }],
//       retirements: []
//     },
//     {
//       id: 3,
//       employeeId: 'EMP003',
//       employeeName: 'Mike Johnson',
//       department: 'IT',
//       designation: 'Senior Developer',
//       branch: 'Bangalore',
//       status: 'Active',
//       joiningDate: '2021-03-20',
//       retirementDate: null,
//       serviceBookNumber: 'SB/2021/0045',
//       totalYears: 3.2,
//       appointments: [{ date: '2021-03-20', type: 'Appointment' }],
//       promotions: [{ date: '2023-05-01', from: 'Software Engineer', to: 'Senior Developer' }],
//       transfers: [],
//       trainings: [
//         { date: '2022-01-10', name: 'React Advanced' },
//         { date: '2023-06-15', name: 'System Design' }
//       ],
//       awards: [],
//       disciplinary: [],
//       payRevisions: [],
//       retirements: []
//     },
//     {
//       id: 4,
//       employeeId: 'EMP004',
//       employeeName: 'Sarah Williams',
//       department: 'Sales',
//       designation: 'Sales Manager',
//       branch: 'Chennai',
//       status: 'Retired',
//       joiningDate: '2010-08-01',
//       retirementDate: '2024-03-31',
//       serviceBookNumber: 'SB/2010/0089',
//       totalYears: 13.7,
//       appointments: [{ date: '2010-08-01', type: 'Appointment' }],
//       promotions: [
//         { date: '2013-04-01', from: 'Sales Executive', to: 'Sr. Sales Executive' },
//         { date: '2017-01-15', from: 'Sr. Sales Executive', to: 'Assistant Sales Manager' },
//         { date: '2021-03-01', from: 'Assistant Sales Manager', to: 'Sales Manager' }
//       ],
//       transfers: [{ date: '2015-06-01', from: 'Delhi', to: 'Mumbai' }],
//       trainings: [
//         { date: '2012-05-10', name: 'Sales Fundamentals' },
//         { date: '2016-08-20', name: 'Leadership Training' }
//       ],
//       awards: [
//         { date: '2015-12-20', name: 'Top Performer' },
//         { date: '2018-12-15', name: 'Sales Excellence' }
//       ],
//       disciplinary: [],
//       payRevisions: [],
//       retirements: [{ date: '2024-03-31', type: 'Superannuation' }]
//     },
//     {
//       id: 5,
//       employeeId: 'EMP005',
//       employeeName: 'David Brown',
//       department: 'Finance',
//       designation: 'Accountant',
//       branch: 'Pune',
//       status: 'Terminated',
//       joiningDate: '2022-01-10',
//       retirementDate: null,
//       serviceBookNumber: 'SB/2022/0123',
//       totalYears: 1.5,
//       appointments: [{ date: '2022-01-10', type: 'Appointment' }],
//       promotions: [],
//       transfers: [],
//       trainings: [{ date: '2022-06-15', name: 'Accounting Software' }],
//       awards: [],
//       disciplinary: [{ date: '2023-04-15', type: 'Warning', reason: 'Policy violation' }],
//       payRevisions: [],
//       retirements: []
//     },
//     {
//       id: 6,
//       employeeId: 'EMP006',
//       employeeName: 'Emily Wilson',
//       department: 'Marketing',
//       designation: 'Marketing Manager',
//       branch: 'Hyderabad',
//       status: 'Active',
//       joiningDate: '2018-09-15',
//       retirementDate: null,
//       serviceBookNumber: 'SB/2018/0156',
//       totalYears: 5.8,
//       appointments: [{ date: '2018-09-15', type: 'Appointment' }],
//       promotions: [
//         { date: '2020-04-01', from: 'Marketing Executive', to: 'Sr. Marketing Executive' },
//         { date: '2022-01-15', from: 'Sr. Marketing Executive', to: 'Marketing Manager' }
//       ],
//       transfers: [],
//       trainings: [
//         { date: '2019-06-10', name: 'Digital Marketing' },
//         { date: '2021-08-15', name: 'Brand Management' }
//       ],
//       awards: [
//         { date: '2020-12-20', name: 'Marketing Excellence' },
//         { date: '2022-12-15', name: 'Innovation Award' }
//       ],
//       disciplinary: [],
//       payRevisions: [],
//       retirements: []
//     }
//   ];

//   const departments = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations'];
//   const designations = ['Software Engineer', 'Senior Developer', 'Tech Lead', 'HR Manager', 'Sales Manager', 'Accountant', 'Marketing Manager', 'Operations Manager'];
//   const branches = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Noida', 'Ahmedabad', 'Jaipur'];
//   const statuses = ['Active', 'Retired', 'Terminated'];

//   // ============================================
//   // FILTER EFFECT - Auto Apply Filters
//   // ============================================
//   useEffect(() => {
//     const hasFilters = searchTerm || 
//                        filters.department || 
//                        filters.designation || 
//                        filters.branch ||
//                        filters.status || 
//                        filters.employeeName || 
//                        filters.dateFrom || 
//                        filters.dateTo;
    
//     if (!hasFilters) {
//       setFilteredData([]);
//       setShowResults(false);
//       return;
//     }

//     setLoading(true);
//     setTimeout(() => {
//       let results = [...DUMMY_EMPLOYEES];

//       if (searchTerm) {
//         const search = searchTerm.toLowerCase();
//         results = results.filter(emp =>
//           emp.employeeName.toLowerCase().includes(search) ||
//           emp.employeeId.toLowerCase().includes(search) ||
//           emp.department.toLowerCase().includes(search) ||
//           emp.designation.toLowerCase().includes(search)
//         );
//       }

//       if (filters.department) {
//         results = results.filter(emp => emp.department === filters.department);
//       }
//       if (filters.designation) {
//         results = results.filter(emp => emp.designation === filters.designation);
//       }
//       if (filters.branch) {
//         results = results.filter(emp => emp.branch === filters.branch);
//       }
//       if (filters.status) {
//         results = results.filter(emp => emp.status === filters.status);
//       }
//       if (filters.employeeName) {
//         results = results.filter(emp =>
//           emp.employeeName.toLowerCase().includes(filters.employeeName.toLowerCase())
//         );
//       }
//       if (filters.dateFrom) {
//         results = results.filter(emp => emp.joiningDate >= filters.dateFrom);
//       }
//       if (filters.dateTo) {
//         results = results.filter(emp => emp.joiningDate <= filters.dateTo);
//       }

//       setFilteredData(results);
//       setShowResults(true);
//       setPage(0);
//       setLoading(false);
//     }, 300);
//   }, [searchTerm, filters]);

//   // ============================================
//   // HELPERS
//   // ============================================
//   const formatDate = (dateStr) => {
//     if (!dateStr) return '—';
//     return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
//   };

//   const getStatusBadge = (status) => {
//     const styles = {
//       Active: { bg: '#d1fae5', color: '#065f46' },
//       Retired: { bg: '#fed7aa', color: '#9a3412' },
//       Terminated: { bg: '#fee2e2', color: '#991b1b' }
//     };
//     const style = styles[status] || styles.Active;
//     return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '20px' }}>{status}</span>;
//   };

//   // ============================================
//   // HANDLERS
//   // ============================================
//   const resetFilters = () => {
//     setFilters({
//       department: '',
//       designation: '',
//       branch: '',
//       employeeName: '',
//       status: '',
//       dateFrom: '',
//       dateTo: ''
//     });
//     setSearchTerm('');
//     setFilteredData([]);
//     setShowResults(false);
//     toast.info('Filters Reset', 'All filters have been cleared');
//   };

//   const handleDownload = () => {
//     if (filteredData.length === 0) {
//       toast.warning('No Data', 'Please apply filters first');
//       return;
//     }
//     toast.success('Download Started', 'Report is being downloaded');
//     // Here you would implement actual download logic
//   };

//   const handleViewDetails = (employee) => {
//     setSelectedEmployee(employee);
//     setShowDetailModal(true);
//   };

//   const handleCancel = () => {
//     if (onCancel) onCancel();
//   };

//   // ============================================
//   // PAGINATION
//   // ============================================
//   const totalItems = filteredData.length;
//   const totalPages = Math.ceil(totalItems / rowsPerPage);
//   const startIndex = page * rowsPerPage;
//   const currentEmployees = filteredData.slice(startIndex, startIndex + rowsPerPage);

//   const getPaginationRange = () => {
//     const delta = 2;
//     const range = [];
//     const left = Math.max(0, page - delta);
//     const right = Math.min(totalPages - 1, page + delta);
//     if (left > 0) { range.push(0); if (left > 1) range.push('...'); }
//     for (let i = left; i <= right; i++) range.push(i);
//     if (right < totalPages - 1) { if (right < totalPages - 2) range.push('...'); range.push(totalPages - 1); }
//     return range;
//   };

//   // ============================================
//   // STATS
//   // ============================================
//   const totalEmployees = filteredData.length;
//   const activeEmployees = filteredData.filter(e => e.status === 'Active').length;
//   const totalPromotions = filteredData.reduce((sum, e) => sum + e.promotions.length, 0);
//   const totalTrainings = filteredData.reduce((sum, e) => sum + e.trainings.length, 0);

//   // ============================================
//   // RENDER
//   // ============================================
//   return (
//     <div className="cert-root" style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
//       {/* HEADER */}
//       <div className="cert-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
//         <div>
//           <h1 className="cert-title" style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Service Book Report</h1>
//           <p className="cert-subtitle" style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Comprehensive employee service records report</p>
//         </div>
//       </div>


//       {/* FILTERS */}
//       <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
//         <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}><FaFilter style={{ marginRight: '8px' }} /> Filters</h6>
//           <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }} onClick={() => setShowFilters(!showFilters)}>
//             {showFilters ? <FaTimes size={14} /> : <FaFilter size={14} />}
//           </button>
//         </div>
//         {showFilters && (
//           <div style={{ padding: '16px 20px' }}>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
//                 {/* Branch Dropdown */}
//               <div style={{ position: 'relative' }}>
//                 <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Branch</label>
//                 <select className="form-select" style={{ width: '100%', padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', appearance: 'none', WebkitAppearance: 'none' }} value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })}>
//                   <option value="">All Branches</option>
//                   {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
//                 </select>
//                 <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', bottom: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
//               </div>

//               {/* Department Dropdown */}
//               <div style={{ position: 'relative' }}>
//                 <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Department</label>
//                 <select className="form-select" style={{ width: '100%', padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', appearance: 'none', WebkitAppearance: 'none' }} value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
//                   <option value="">All Departments</option>
//                   {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
//                 </select>
//                 <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', bottom: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
//               </div>

//               {/* Designation Dropdown */}
//               <div style={{ position: 'relative' }}>
//                 <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Designation</label>
//                 <select className="form-select" style={{ width: '100%', padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', appearance: 'none', WebkitAppearance: 'none' }} value={filters.designation} onChange={(e) => setFilters({ ...filters, designation: e.target.value })}>
//                   <option value="">All Designations</option>
//                   {designations.map(des => <option key={des} value={des}>{des}</option>)}
//                 </select>
//                 <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', bottom: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
//               </div>

            
//               {/* Status Dropdown */}
//               <div style={{ position: 'relative' }}>
//                 <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Status</label>
//                 <select className="form-select" style={{ width: '100%', padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', appearance: 'none', WebkitAppearance: 'none' }} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
//                   <option value="">All Status</option>
//                   {statuses.map(st => <option key={st} value={st}>{st}</option>)}
//                 </select>
//                 <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', bottom: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
//               </div>

//               {/* Employee Name Input - No icon */}
//               <div>
//                 <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Employee Name</label>
//                 <input type="text" className="form-control" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} placeholder="Search by name or code" value={filters.employeeName} onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })} />
//               </div>

//               {/* From Date - No icon */}
//               <div>
//                 <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>From Date</label>
//                 <input type="date" className="form-control" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
//               </div>

//               {/* To Date - No icon */}
//               <div>
//                 <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>To Date</label>
//                 <input type="date" className="form-control" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
//               </div>
//             </div>

//             <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
//               <button style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }} onClick={handleDownload}>
//                 <FaDownload size={12} /> Download Report
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* TABLE - Only show when results available */}
//       {showResults && (
//         <>
//           {filteredData.length > 0 ? (
//             <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
//               <div style={{ overflowX: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
//                   <thead>
//                     <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branch</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Book No.</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joining Date</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Service</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Promotions</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trainings</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awards</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
//                       <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '60px' }}>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {loading ? (
//                       <tr><td colSpan="13" style={{ padding: '40px', textAlign: 'center' }}><div className="spinner-border text-primary" /></td></tr>
//                     ) : currentEmployees.length > 0 ? (
//                       currentEmployees.map((emp, idx) => (
//                         <tr key={emp.id} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onClick={() => handleViewDetails(emp)} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
//                           <td style={{ padding: '10px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>{startIndex + idx + 1}</td>
//                           <td style={{ padding: '10px 16px' }}>
//                             <div style={{ fontWeight: '600', color: '#0f172a' }}>{emp.employeeName}</div>
//                             <div style={{ fontSize: '12px', color: '#94a3b8' }}>{emp.employeeId}</div>
//                           </td>
//                           <td style={{ padding: '10px 16px', color: '#334155' }}>{emp.department}</td>
//                           <td style={{ padding: '10px 16px', color: '#334155' }}>{emp.designation}</td>
//                           <td style={{ padding: '10px 16px', color: '#475569' }}>{emp.branch || '—'}</td>
//                           <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>{emp.serviceBookNumber}</td>
//                           <td style={{ padding: '10px 16px', color: '#334155' }}>{formatDate(emp.joiningDate)}</td>
//                           <td style={{ padding: '10px 16px', fontWeight: '500', color: '#0f172a' }}>{emp.totalYears} yrs</td>
//                           <td style={{ padding: '10px 16px', textAlign: 'center' }}><span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{emp.promotions.length}</span></td>
//                           <td style={{ padding: '10px 16px', textAlign: 'center' }}><span style={{ background: '#cffafe', color: '#06b6d4', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{emp.trainings.length}</span></td>
//                           <td style={{ padding: '10px 16px', textAlign: 'center' }}><span style={{ background: '#fed7aa', color: '#9a3412', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{emp.awards.length}</span></td>
//                           <td style={{ padding: '10px 16px' }}>{getStatusBadge(emp.status)}</td>
//                           <td style={{ padding: '10px 16px', textAlign: 'center' }}>
//                             <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }} onClick={(e) => { e.stopPropagation(); handleViewDetails(emp); }} title="View">
//                               <FaEye size={12} />
//                             </button>
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr><td colSpan="13" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found</td></tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               {/* PAGINATION */}
//               {totalPages > 1 && (
//                 <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
//                   <span style={{ fontSize: '13px', color: '#64748b' }}>
//                     Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
//                   </span>
//                   <div style={{ display: 'flex', gap: '4px' }}>
//                     <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1, fontSize: '12px' }} disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
//                     {getPaginationRange().map((pg, i) => pg === '...' ? <span key={i} style={{ padding: '6px 8px', color: '#94a3b8' }}>…</span> : <button key={pg} style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: pg === page ? '#0f172a' : '#fff', color: pg === page ? '#fff' : '#334155', cursor: 'pointer', fontSize: '12px', fontWeight: pg === page ? '600' : '400' }} onClick={() => setPage(pg)}>{pg + 1}</button>)}
//                     <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer', opacity: page + 1 >= totalPages ? 0.5 : 1, fontSize: '12px' }} disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             // No Results Message
//             <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px 20px', textAlign: 'center' }}>
//               <FaSearch size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
//               <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#475569', margin: 0 }}>No Records Found</h3>
//               <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>Try adjusting your search or filter criteria</p>
//             </div>
//           )}
//         </>
//       )}

//       {/* DETAIL MODAL */}
//       {showDetailModal && selectedEmployee && (
//         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '20px' }}>
//           <div style={{ background: '#fff', borderRadius: '16px', width: '95%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
//             {/* Modal Header */}
//             <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
//               <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
//                 <FaBook /> Service Book - {selectedEmployee.employeeName}
//               </h5>
//               <button onClick={() => setShowDetailModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
//             </div>

//             {/* Modal Body */}
//             <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
//               {/* Employee Info Cards */}
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
//                 <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
//                   <FaUserTie size={20} style={{ color: '#4f46e5', marginBottom: '4px' }} />
//                   <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{selectedEmployee.employeeName}</h6>
//                   <small style={{ color: '#94a3b8' }}>{selectedEmployee.employeeId}</small>
//                 </div>
//                 <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
//                   <FaBuilding size={20} style={{ color: '#4f46e5', marginBottom: '4px' }} />
//                   <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{selectedEmployee.department}</h6>
//                   <small style={{ color: '#94a3b8' }}>Department</small>
//                 </div>
//                 <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
//                   <FaBriefcase size={20} style={{ color: '#4f46e5', marginBottom: '4px' }} />
//                   <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{selectedEmployee.designation}</h6>
//                   <small style={{ color: '#94a3b8' }}>Designation</small>
//                 </div>
//                 <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
//                   <FaMapMarkerAlt size={20} style={{ color: '#4f46e5', marginBottom: '4px' }} />
//                   <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{selectedEmployee.branch || '—'}</h6>
//                   <small style={{ color: '#94a3b8' }}>Branch</small>
//                 </div>
//                 <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
//                   <FaCalendarAlt size={20} style={{ color: '#4f46e5', marginBottom: '4px' }} />
//                   <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{formatDate(selectedEmployee.joiningDate)}</h6>
//                   <small style={{ color: '#94a3b8' }}>Joining Date</small>
//                 </div>
//                 <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
//                   <FaClock size={20} style={{ color: '#4f46e5', marginBottom: '4px' }} />
//                   <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{selectedEmployee.totalYears} yrs</h6>
//                   <small style={{ color: '#94a3b8' }}>Total Service</small>
//                 </div>
//               </div>

//               {/* Details Grid */}
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
//                 <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
//                   <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUserCheck /> Appointment</div>
//                   <div style={{ padding: '10px 14px', fontSize: '13px', color: '#334155' }}>{selectedEmployee.appointments?.length > 0 ? `${formatDate(selectedEmployee.appointments[0].date)} - ${selectedEmployee.appointments[0].type}` : '—'}</div>
//                 </div>
//                 <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
//                   <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaChartLine /> Promotions ({selectedEmployee.promotions?.length || 0})</div>
//                   <div style={{ padding: '10px 14px', fontSize: '13px', color: '#334155' }}>{selectedEmployee.promotions?.map((p, i) => <div key={i}><span style={{ fontWeight: '500' }}>{formatDate(p.date)}</span>: {p.from} → {p.to}</div>) || '—'}</div>
//                 </div>
//                 <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
//                   <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaExchangeAlt /> Transfers</div>
//                   <div style={{ padding: '10px 14px', fontSize: '13px', color: '#334155' }}>{selectedEmployee.transfers?.map((t, i) => <div key={i}><span style={{ fontWeight: '500' }}>{formatDate(t.date)}</span>: {t.from} → {t.to}</div>) || '—'}</div>
//                 </div>
//                 <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
//                   <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaChalkboardTeacher /> Trainings</div>
//                   <div style={{ padding: '10px 14px', fontSize: '13px', color: '#334155' }}>{selectedEmployee.trainings?.map((t, i) => <div key={i}><span style={{ fontWeight: '500' }}>{formatDate(t.date)}</span>: {t.name}</div>) || '—'}</div>
//                 </div>
//                 <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
//                   <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaTrophy /> Awards</div>
//                   <div style={{ padding: '10px 14px', fontSize: '13px', color: '#334155' }}>{selectedEmployee.awards?.map((a, i) => <div key={i}><span style={{ fontWeight: '500' }}>{formatDate(a.date)}</span>: {a.name}</div>) || '—'}</div>
//                 </div>
//                 <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
//                   <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaRupeeSign /> Pay Revisions</div>
//                   <div style={{ padding: '10px 14px', fontSize: '13px', color: '#334155' }}>{selectedEmployee.payRevisions?.map((p, i) => <div key={i}><span style={{ fontWeight: '500' }}>{formatDate(p.date)}</span>: {p.oldPay} → {p.newPay}</div>) || '—'}</div>
//                 </div>
//                 {selectedEmployee.retirementDate && (
//                   <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', gridColumn: 'span 2' }}>
//                     <div style={{ padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><FaClock /> Retirement</div>
//                     <div style={{ padding: '10px 14px', fontSize: '13px', color: '#334155' }}>Retired on {formatDate(selectedEmployee.retirementDate)}</div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Modal Footer */}
//             <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
//               <button style={{ padding: '8px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#475569' }} onClick={() => setShowDetailModal(false)}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ServiceBookReport;

import React, { useState, useEffect } from 'react';
import {
  FaFileAlt, FaDownload, FaFilter, FaTimes, FaSearch,
  FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher, FaClock,
  FaBook, FaEye, FaCheckCircle, FaUserCheck, FaArrowUp, FaMapMarkerAlt,
  FaChevronDown
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookReport = ({ onCancel }) => {
  // ============================================
  // STATE
  // ============================================
  const [filters, setFilters] = useState({
    department: '',
    designation: '',
    branch: '',
    employeeName: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [showResults, setShowResults] = useState(false);

  // ============================================
  // DUMMY DATA
  // ============================================
  const DUMMY_EMPLOYEES = [
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      department: 'IT',
      designation: 'Software Engineer',
      branch: 'Mumbai',
      status: 'Active',
      joiningDate: '2020-01-15',
      retirementDate: null,
      serviceBookNumber: 'SB/2020/0001',
      totalYears: 4.5,
      appointments: [{ date: '2020-01-15', type: 'Appointment' }],
      promotions: [
        { date: '2021-03-01', from: 'Software Engineer', to: 'Senior Software Engineer' },
        { date: '2023-01-15', from: 'Senior Software Engineer', to: 'Tech Lead' }
      ],
      transfers: [{ date: '2022-06-01', from: 'Mumbai', to: 'Bangalore' }],
      trainings: [
        { date: '2021-08-10', name: 'Leadership Program' },
        { date: '2023-02-15', name: 'Cloud Architecture' }
      ],
      awards: [{ date: '2022-01-20', name: 'Star Performer' }],
      disciplinary: [],
      payRevisions: [{ date: '2023-01-01', oldPay: '50,000', newPay: '60,000' }],
      retirements: []
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      department: 'HR',
      designation: 'HR Manager',
      branch: 'Delhi',
      status: 'Active',
      joiningDate: '2019-06-10',
      retirementDate: null,
      serviceBookNumber: 'SB/2019/0023',
      totalYears: 5.8,
      appointments: [{ date: '2019-06-10', type: 'Appointment' }],
      promotions: [{ date: '2022-04-01', from: 'Sr. HR Executive', to: 'HR Manager' }],
      transfers: [],
      trainings: [
        { date: '2020-02-10', name: 'HR Analytics' },
        { date: '2022-08-15', name: 'Leadership Development' }
      ],
      awards: [
        { date: '2021-12-15', name: 'HR Excellence' },
        { date: '2023-03-20', name: 'Best Manager' }
      ],
      disciplinary: [],
      payRevisions: [{ date: '2022-04-01', oldPay: '60,000', newPay: '75,000' }],
      retirements: []
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Mike Johnson',
      department: 'IT',
      designation: 'Senior Developer',
      branch: 'Bangalore',
      status: 'Active',
      joiningDate: '2021-03-20',
      retirementDate: null,
      serviceBookNumber: 'SB/2021/0045',
      totalYears: 3.2,
      appointments: [{ date: '2021-03-20', type: 'Appointment' }],
      promotions: [{ date: '2023-05-01', from: 'Software Engineer', to: 'Senior Developer' }],
      transfers: [],
      trainings: [
        { date: '2022-01-10', name: 'React Advanced' },
        { date: '2023-06-15', name: 'System Design' }
      ],
      awards: [],
      disciplinary: [],
      payRevisions: [],
      retirements: []
    },
    {
      id: 4,
      employeeId: 'EMP004',
      employeeName: 'Sarah Williams',
      department: 'Sales',
      designation: 'Sales Manager',
      branch: 'Chennai',
      status: 'Retired',
      joiningDate: '2010-08-01',
      retirementDate: '2024-03-31',
      serviceBookNumber: 'SB/2010/0089',
      totalYears: 13.7,
      appointments: [{ date: '2010-08-01', type: 'Appointment' }],
      promotions: [
        { date: '2013-04-01', from: 'Sales Executive', to: 'Sr. Sales Executive' },
        { date: '2017-01-15', from: 'Sr. Sales Executive', to: 'Assistant Sales Manager' },
        { date: '2021-03-01', from: 'Assistant Sales Manager', to: 'Sales Manager' }
      ],
      transfers: [{ date: '2015-06-01', from: 'Delhi', to: 'Mumbai' }],
      trainings: [
        { date: '2012-05-10', name: 'Sales Fundamentals' },
        { date: '2016-08-20', name: 'Leadership Training' }
      ],
      awards: [
        { date: '2015-12-20', name: 'Top Performer' },
        { date: '2018-12-15', name: 'Sales Excellence' }
      ],
      disciplinary: [],
      payRevisions: [],
      retirements: [{ date: '2024-03-31', type: 'Superannuation' }]
    },
    {
      id: 5,
      employeeId: 'EMP005',
      employeeName: 'David Brown',
      department: 'Finance',
      designation: 'Accountant',
      branch: 'Pune',
      status: 'Terminated',
      joiningDate: '2022-01-10',
      retirementDate: null,
      serviceBookNumber: 'SB/2022/0123',
      totalYears: 1.5,
      appointments: [{ date: '2022-01-10', type: 'Appointment' }],
      promotions: [],
      transfers: [],
      trainings: [{ date: '2022-06-15', name: 'Accounting Software' }],
      awards: [],
      disciplinary: [{ date: '2023-04-15', type: 'Warning', reason: 'Policy violation' }],
      payRevisions: [],
      retirements: []
    },
    {
      id: 6,
      employeeId: 'EMP006',
      employeeName: 'Emily Wilson',
      department: 'Marketing',
      designation: 'Marketing Manager',
      branch: 'Hyderabad',
      status: 'Active',
      joiningDate: '2018-09-15',
      retirementDate: null,
      serviceBookNumber: 'SB/2018/0156',
      totalYears: 5.8,
      appointments: [{ date: '2018-09-15', type: 'Appointment' }],
      promotions: [
        { date: '2020-04-01', from: 'Marketing Executive', to: 'Sr. Marketing Executive' },
        { date: '2022-01-15', from: 'Sr. Marketing Executive', to: 'Marketing Manager' }
      ],
      transfers: [],
      trainings: [
        { date: '2019-06-10', name: 'Digital Marketing' },
        { date: '2021-08-15', name: 'Brand Management' }
      ],
      awards: [
        { date: '2020-12-20', name: 'Marketing Excellence' },
        { date: '2022-12-15', name: 'Innovation Award' }
      ],
      disciplinary: [],
      payRevisions: [],
      retirements: []
    }
  ];

  const departments = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations'];
  const designations = ['Software Engineer', 'Senior Developer', 'Tech Lead', 'HR Manager', 'Sales Manager', 'Accountant', 'Marketing Manager', 'Operations Manager'];
  const branches = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Noida', 'Ahmedabad', 'Jaipur'];
  const statuses = ['Active', 'Retired', 'Terminated'];

  // ============================================
  // FILTER EFFECT - Auto Apply Filters
  // ============================================
  useEffect(() => {
    const hasFilters = searchTerm || 
                       filters.department || 
                       filters.designation || 
                       filters.branch ||
                       filters.status || 
                       filters.employeeName || 
                       filters.dateFrom || 
                       filters.dateTo;
    
    if (!hasFilters) {
      setFilteredData([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      let results = [...DUMMY_EMPLOYEES];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        results = results.filter(emp =>
          emp.employeeName.toLowerCase().includes(search) ||
          emp.employeeId.toLowerCase().includes(search) ||
          emp.department.toLowerCase().includes(search) ||
          emp.designation.toLowerCase().includes(search)
        );
      }

      if (filters.department) {
        results = results.filter(emp => emp.department === filters.department);
      }
      if (filters.designation) {
        results = results.filter(emp => emp.designation === filters.designation);
      }
      if (filters.branch) {
        results = results.filter(emp => emp.branch === filters.branch);
      }
      if (filters.status) {
        results = results.filter(emp => emp.status === filters.status);
      }
      if (filters.employeeName) {
        results = results.filter(emp =>
          emp.employeeName.toLowerCase().includes(filters.employeeName.toLowerCase())
        );
      }
      if (filters.dateFrom) {
        results = results.filter(emp => emp.joiningDate >= filters.dateFrom);
      }
      if (filters.dateTo) {
        results = results.filter(emp => emp.joiningDate <= filters.dateTo);
      }

      setFilteredData(results);
      setShowResults(true);
      setPage(0);
      setLoading(false);
    }, 300);
  }, [searchTerm, filters]);

  // ============================================
  // HELPERS
  // ============================================
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      Active: { bg: '#d1fae5', color: '#065f46' },
      Retired: { bg: '#fed7aa', color: '#9a3412' },
      Terminated: { bg: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || styles.Active;
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '20px' }}>{status}</span>;
  };

  // ============================================
  // HANDLERS
  // ============================================
  const resetFilters = () => {
    setFilters({
      department: '',
      designation: '',
      branch: '',
      employeeName: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
    setFilteredData([]);
    setShowResults(false);
    toast.info('Filters Reset', 'All filters have been cleared');
  };

  const handleDownload = () => {
    if (filteredData.length === 0) {
      toast.warning('No Data', 'Please apply filters first');
      return;
    }
    toast.success('Download Started', 'Report is being downloaded');
    // Here you would implement actual download logic
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  // ============================================
  // PAGINATION
  // ============================================
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const currentEmployees = filteredData.slice(startIndex, startIndex + rowsPerPage);

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

  // ============================================
  // STATS
  // ============================================
  const totalEmployees = filteredData.length;
  const activeEmployees = filteredData.filter(e => e.status === 'Active').length;
  const totalPromotions = filteredData.reduce((sum, e) => sum + e.promotions.length, 0);
  const totalTrainings = filteredData.reduce((sum, e) => sum + e.trainings.length, 0);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="cert-root" style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="cert-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 className="cert-title" style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Service Book Report</h1>
          <p className="cert-subtitle" style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Comprehensive employee service records report</p>
        </div>
      </div>


      {/* FILTERS */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}><FaFilter style={{ marginRight: '8px' }} /> Filters</h6>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }} onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <FaTimes size={14} /> : <FaFilter size={14} />}
          </button>
        </div>
        {showFilters && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {/* Branch Dropdown */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Branch</label>
                <select className="form-select" style={{ width: '100%', padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', appearance: 'none', WebkitAppearance: 'none' }} value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })}>
                  <option value="">All Branches</option>
                  {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                </select>
                <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', bottom: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>

              {/* Department Dropdown */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Department</label>
                <select className="form-select" style={{ width: '100%', padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', appearance: 'none', WebkitAppearance: 'none' }} value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
                  <option value="">All Departments</option>
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', bottom: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>

              {/* Designation Dropdown */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Designation</label>
                <select className="form-select" style={{ width: '100%', padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', appearance: 'none', WebkitAppearance: 'none' }} value={filters.designation} onChange={(e) => setFilters({ ...filters, designation: e.target.value })}>
                  <option value="">All Designations</option>
                  {designations.map(des => <option key={des} value={des}>{des}</option>)}
                </select>
                <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', bottom: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>

            
              {/* Status Dropdown */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Status</label>
                <select className="form-select" style={{ width: '100%', padding: '8px 32px 8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', appearance: 'none', WebkitAppearance: 'none' }} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All Status</option>
                  {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <FaChevronDown size={14} style={{ position: 'absolute', right: '12px', bottom: '12px', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>

              {/* Employee Name Input - No icon */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Employee Name</label>
                <input type="text" className="form-control" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} placeholder="Search by name or code" value={filters.employeeName} onChange={(e) => setFilters({ ...filters, employeeName: e.target.value })} />
              </div>

              {/* From Date - No icon */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>From Date</label>
                <input type="date" className="form-control" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
              </div>

              {/* To Date - No icon */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>To Date</label>
                <input type="date" className="form-control" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }} onClick={handleDownload}>
                <FaDownload size={12} /> Download Report
              </button>
            </div>
          </div>
        )}
      </div>

    
    </div>
  );
};

export default ServiceBookReport;