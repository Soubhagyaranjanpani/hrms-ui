import React, { useState, useEffect } from 'react';
import { 
  FaFileAlt, FaDownload, FaPrint, FaFilter, FaTimes, FaSearch,
  FaUserTie, FaBuilding, FaBriefcase, FaCalendarAlt, FaChartLine,
  FaExchangeAlt, FaTrophy, FaRupeeSign, FaChalkboardTeacher, FaClock,
  FaBook, FaEye, FaCheckCircle, FaUserCheck, FaArrowUp, FaMapMarkerAlt
} from 'react-icons/fa';
import { toast } from '../components/Toast';

const ServiceBookReport = ({ onCancel }) => {
  const [filters, setFilters] = useState({
    department: '',
    designation: '',
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

  // Dummy data
  const DUMMY_EMPLOYEES = [
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      department: 'IT',
      designation: 'Software Engineer',
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
  const statuses = ['Active', 'Retired', 'Terminated'];

  // Apply filters
  useEffect(() => {
    let results = [...DUMMY_EMPLOYEES];
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(emp => 
        emp.employeeName.toLowerCase().includes(search) ||
        emp.employeeId.toLowerCase().includes(search) ||
        emp.department.toLowerCase().includes(search) ||
        emp.designation.toLowerCase().includes(search)
      );
    }
    
    // Department filter
    if (filters.department) {
      results = results.filter(emp => emp.department === filters.department);
    }
    
    // Designation filter
    if (filters.designation) {
      results = results.filter(emp => emp.designation === filters.designation);
    }
    
    // Status filter
    if (filters.status) {
      results = results.filter(emp => emp.status === filters.status);
    }
    
    // Employee name filter
    if (filters.employeeName) {
      results = results.filter(emp => emp.employeeName.toLowerCase().includes(filters.employeeName.toLowerCase()));
    }
    
    // Date range filters
    if (filters.dateFrom) {
      results = results.filter(emp => emp.joiningDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      results = results.filter(emp => emp.joiningDate <= filters.dateTo);
    }
    
    setFilteredData(results);
    setPage(0);
  }, [searchTerm, filters]);

  // Pagination
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

  const resetFilters = () => {
    setFilters({
      department: '',
      designation: '',
      employeeName: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
    toast.info('Filters Reset', 'Showing all records');
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    toast.success('Export Started', 'Report will be downloaded shortly');
  };

  const handlePrint = () => {
    window.print();
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
      Active: { bg: '#d1fae5', color: '#065f46' },
      Retired: { bg: '#fed7aa', color: '#9a3412' },
      Terminated: { bg: '#fee2e2', color: '#991b1b' }
    };
    const style = styles[status] || styles.Active;
    return <span className="badge" style={{ backgroundColor: style.bg, color: style.color, padding: '4px 8px' }}>{status}</span>;
  };

  // Stats
  const totalEmployees = filteredData.length;
  const activeEmployees = filteredData.filter(e => e.status === 'Active').length;
  const totalPromotions = filteredData.reduce((sum, e) => sum + e.promotions.length, 0);
  const totalTrainings = filteredData.reduce((sum, e) => sum + e.trainings.length, 0);

  return (
    <div className="cert-root">
      {/* Header */}
      <div className="cert-header">
        <div>
          <h1 className="cert-title">Service Book Report</h1>
          <p className="cert-subtitle">Comprehensive employee service records report</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-outline-success btn-sm" onClick={handleExport}>
            <FaDownload className="me-1" size={12} /> Export
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint}>
            <FaPrint className="me-1" size={12} /> Print
          </button>
          {onCancel && (
            <button className="cert-cancel-btn" onClick={handleCancel}>
              <FaTimes size={13} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="cert-search-bar">
        <div className="cert-search-wrap">
          <FaSearch className="cert-search-icon" size={12} />
          <input
            className="cert-search-input"
            type="text"
            placeholder="Search by name, ID, department or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="cert-search-clear" onClick={() => setSearchTerm('')}>
              <FaTimes size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="cert-stats">
        <div className="cert-stat-card">
          <FaUserTie size={16} color="#4f46e5" />
          <span>{totalEmployees} Total Employees</span>
        </div>
        <div className="cert-stat-card">
          <FaCheckCircle size={16} color="#10b981" />
          <span>{activeEmployees} Active</span>
        </div>
        <div className="cert-stat-card">
          <FaChartLine size={16} color="#f59e0b" />
          <span>{totalPromotions} Promotions</span>
        </div>
        <div className="cert-stat-card">
          <FaChalkboardTeacher size={16} color="#06b6d4" />
          <span>{totalTrainings} Trainings</span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><FaFilter className="me-2" /> Filters</h6>
          <button className="btn btn-sm btn-link" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <FaTimes /> : <FaFilter />}
          </button>
        </div>
        {showFilters && (
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-bold">Department</label>
                <select className="form-select" value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})}>
                  <option value="">All Departments</option>
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Designation</label>
                <select className="form-select" value={filters.designation} onChange={(e) => setFilters({...filters, designation: e.target.value})}>
                  <option value="">All Designations</option>
                  {designations.map(des => <option key={des} value={des}>{des}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Status</label>
                <select className="form-select" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                  <option value="">All Status</option>
                  {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Employee Name</label>
                <input type="text" className="form-control" placeholder="Search by name" value={filters.employeeName} onChange={(e) => setFilters({...filters, employeeName: e.target.value})} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Joining Date From</label>
                <input type="date" className="form-control" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Joining Date To</label>
                <input type="date" className="form-control" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={resetFilters}>Reset</button>
            </div>
          </div>
        )}
      </div>

      {/* Report Table */}
      <div className="cert-table-card">
        <div className="cert-table-wrap">
          <table className="cert-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Service Book No.</th>
                <th>Joining Date</th>
                <th>Total Service</th>
                <th>Promotions</th>
                <th>Trainings</th>
                <th>Awards</th>
                <th>Status</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12" className="text-center py-4"><div className="spinner-border text-primary" /></td></tr>
              ) : currentEmployees.length > 0 ? (
                currentEmployees.map((emp, idx) => (
                  <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => handleViewDetails(emp)}>
                    <td className="text-center">{startIndex + idx + 1}</td>
                    <td>
                      <div className="fw-bold">{emp.employeeName}</div>
                      <small className="text-muted">{emp.employeeId}</small>
                    </td>
                    <td>{emp.department}</td>
                    <td>{emp.designation}</td>
                    <td>{emp.serviceBookNumber}</td>
                    <td>{formatDate(emp.joiningDate)}</td>
                    <td>{emp.totalYears} yrs</td>
                    <td className="text-center"><span className="cert-status-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{emp.promotions.length}</span></td>
                    <td className="text-center"><span className="cert-status-badge" style={{ background: '#cffafe', color: '#06b6d4' }}>{emp.trainings.length}</span></td>
                    <td className="text-center"><span className="cert-status-badge" style={{ background: '#fed7aa', color: '#9a3412' }}>{emp.awards.length}</span></td>
                    <td>{getStatusBadge(emp.status)}</td>
                    <td className="text-center">
                      <button className="cert-act cert-act--edit" onClick={(e) => { e.stopPropagation(); handleViewDetails(emp); }} title="View">
                        <FaEye size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="12" className="text-center py-5">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="cert-pagination" style={{ justifyContent: 'center', display: 'flex', gap: '8px', marginTop: '20px', padding: '12px 0' }}>
            <button className="cert-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Prev</button>
            {getPaginationRange().map((pg, i) =>
              pg === '...' ? <span key={i} className="cert-page-dots">…</span> : <button key={pg} className={`cert-page-num ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg + 1}</button>
            )}
            <button className="cert-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><FaBook className="me-2" /> Service Book - {selectedEmployee.employeeName}</h5>
                <button type="button" className="close text-white" onClick={() => setShowDetailModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-3"><div className="text-center p-3 bg-light rounded"><FaUserTie size={24} className="text-primary mb-2" /><h6>{selectedEmployee.employeeName}</h6><small>{selectedEmployee.employeeId}</small></div></div>
                  <div className="col-md-3"><div className="text-center p-3 bg-light rounded"><FaBuilding size={24} className="text-primary mb-2" /><h6>{selectedEmployee.department}</h6><small>Department</small></div></div>
                  <div className="col-md-3"><div className="text-center p-3 bg-light rounded"><FaBriefcase size={24} className="text-primary mb-2" /><h6>{selectedEmployee.designation}</h6><small>Designation</small></div></div>
                  <div className="col-md-3"><div className="text-center p-3 bg-light rounded"><FaCalendarAlt size={24} className="text-primary mb-2" /><h6>{formatDate(selectedEmployee.joiningDate)}</h6><small>Joining Date</small></div></div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3"><div className="card"><div className="card-header bg-light"><FaUserCheck className="me-2" /> Appointment</div><div className="card-body">{formatDate(selectedEmployee.appointments?.[0]?.date)} - {selectedEmployee.appointments?.[0]?.type}</div></div></div>
                  <div className="col-md-6 mb-3"><div className="card"><div className="card-header bg-light"><FaChartLine className="me-2" /> Promotions ({selectedEmployee.promotions?.length || 0})</div><div className="card-body">{selectedEmployee.promotions?.map((p,i) => <div key={i}>{formatDate(p.date)}: {p.from} → {p.to}</div>) || '—'}</div></div></div>
                  <div className="col-md-6 mb-3"><div className="card"><div className="card-header bg-light"><FaExchangeAlt className="me-2" /> Transfers</div><div className="card-body">{selectedEmployee.transfers?.map((t,i) => <div key={i}>{formatDate(t.date)}: {t.from} → {t.to}</div>) || '—'}</div></div></div>
                  <div className="col-md-6 mb-3"><div className="card"><div className="card-header bg-light"><FaChalkboardTeacher className="me-2" /> Trainings</div><div className="card-body">{selectedEmployee.trainings?.map((t,i) => <div key={i}>{formatDate(t.date)}: {t.name}</div>) || '—'}</div></div></div>
                  <div className="col-md-6 mb-3"><div className="card"><div className="card-header bg-light"><FaTrophy className="me-2" /> Awards</div><div className="card-body">{selectedEmployee.awards?.map((a,i) => <div key={i}>{formatDate(a.date)}: {a.name}</div>) || '—'}</div></div></div>
                  <div className="col-md-6 mb-3"><div className="card"><div className="card-header bg-light"><FaRupeeSign className="me-2" /> Pay Revisions</div><div className="card-body">{selectedEmployee.payRevisions?.map((p,i) => <div key={i}>{formatDate(p.date)}: {p.oldPay} → {p.newPay}</div>) || '—'}</div></div></div>
                  {selectedEmployee.retirementDate && <div className="col-md-12 mb-3"><div className="card"><div className="card-header bg-light"><FaClock className="me-2" /> Retirement</div><div className="card-body">Retired on {formatDate(selectedEmployee.retirementDate)}</div></div></div>}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBookReport;