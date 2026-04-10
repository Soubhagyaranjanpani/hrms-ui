import React, { useState, useMemo } from 'react';
import {
  FaDownload, FaEye, FaCheckCircle, FaClock, FaRupeeSign,
  FaUserFriends, FaChartLine, FaCalendarAlt, FaArrowRight,
  FaRegClock, FaRegCheckCircle, FaUser, FaPercent
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const Payroll = ({ user }) => {
  const [payroll, setPayroll] = useState([
    { id: 1, employee: 'Emma Watson', month: 'March 2024', basic: 50000, allowances: 15000, deductions: 5000, net: 60000, status: 'Processed', paymentDate: '2024-03-28' },
    { id: 2, employee: 'Liam Brown', month: 'March 2024', basic: 45000, allowances: 12000, deductions: 4000, net: 53000, status: 'Processed', paymentDate: '2024-03-28' },
    { id: 3, employee: 'Olivia Davis', month: 'March 2024', basic: 40000, allowances: 10000, deductions: 3500, net: 46500, status: 'Pending', paymentDate: '-' },
    { id: 4, employee: 'Noah Wilson', month: 'March 2024', basic: 55000, allowances: 18000, deductions: 6000, net: 67000, status: 'Processed', paymentDate: '2024-03-28' },
    { id: 5, employee: 'Sophia Garcia', month: 'February 2024', basic: 48000, allowances: 11000, deductions: 4200, net: 54800, status: 'Processed', paymentDate: '2024-02-27' },
    { id: 6, employee: 'Mason Martinez', month: 'February 2024', basic: 52000, allowances: 14000, deductions: 4800, net: 61200, status: 'Processed', paymentDate: '2024-02-27' },
  ]);

  const [selectedMonth, setSelectedMonth] = useState('March 2024');

  // Filtered payroll based on selected month
  const filteredPayroll = useMemo(() => {
    return payroll.filter(record => record.month === selectedMonth);
  }, [payroll, selectedMonth]);

  // Computed totals for filtered data
  const totalPayroll = filteredPayroll.reduce((sum, p) => sum + p.net, 0);
  const totalBasic = filteredPayroll.reduce((sum, p) => sum + p.basic, 0);
  const totalAllowances = filteredPayroll.reduce((sum, p) => sum + p.allowances, 0);
  const totalDeductions = filteredPayroll.reduce((sum, p) => sum + p.deductions, 0);
  const totalGross = totalBasic + totalAllowances;

  const processedCount = filteredPayroll.filter(p => p.status === 'Processed').length;
  const avgSalary = filteredPayroll.length ? totalPayroll / filteredPayroll.length : 0;

  // Distribution percentages
  const basicPercent = totalGross ? (totalBasic / totalGross) * 100 : 0;
  const allowancesPercent = totalGross ? (totalAllowances / totalGross) * 100 : 0;
  const deductionsPercent = totalGross ? (totalDeductions / totalGross) * 100 : 0;

  // Recent transactions (last 3 processed)
  const recentTransactions = useMemo(() => {
    return [...filteredPayroll]
      .filter(p => p.status === 'Processed')
      .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      .slice(0, 3);
  }, [filteredPayroll]);

  const handleProcessPayroll = () => {
    toast.success('Payroll processing started!');
  };

  const handleDownloadSlip = (employee) => {
    toast.info(`Downloading payslip for ${employee}`);
  };

  const handleExportSummary = () => {
    toast.info('Exporting summary...');
  };

  const handleGenerateReports = () => {
    toast.info('Generating reports...');
  };

  // Helper to get employee initials
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
      {/* Page Header with modern gradient */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div className="page-header-left">
          <div className="page-header-icon" style={{
            background: 'linear-gradient(145deg, var(--accent-indigo), var(--accent-indigo-light))',
            boxShadow: '0 10px 20px -5px rgba(157, 23, 77, 0.3)'
          }}>
            <FaRupeeSign />
          </div>
          <div className="page-header-text">
            <h1 style={{ background: 'linear-gradient(135deg, var(--primary-navy), var(--accent-indigo))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Payroll Management
            </h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaCalendarAlt size={12} /> {selectedMonth} • {filteredPayroll.length} employees
            </p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn-gradient" onClick={handleProcessPayroll} style={{ padding: '12px 24px', borderRadius: '14px' }}>
            <FaCheckCircle className="me-2" /> Process Payroll
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Total Payroll</p>
                <h3 className="fw-bold mb-0">₹{(totalPayroll / 1000).toFixed(1)}K</h3>
                <small>For {selectedMonth}</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(45,156,124,0.2)' }}>
                <FaRupeeSign color="#2d9c7c" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Processed</p>
                <h3 className="fw-bold mb-0">{processedCount}/{filteredPayroll.length}</h3>
                <small>Employees</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.2)' }}>
                <FaRegCheckCircle color="#2ecc71" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Average Salary</p>
                <h3 className="fw-bold mb-0">₹{(avgSalary / 1000).toFixed(1)}K</h3>
                <small>Per employee</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.2)' }}>
                <FaChartLine color="#3498db" />
              </div>
            </div>
          </div>
        </div>

        
         <div className="col-md-3">
          <div className="stat-card h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Pending</p>
                <h3 className="fw-bold mb-0">{filteredPayroll.length - processedCount}</h3>
                <small>Awaiting processing</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(243,156,18,0.2)' }}>
                <FaRegClock color="#f39c12" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selector & Quick Actions - Modernized */}
      <div className="card-modern p-4 mb-4" style={{ borderRadius: '24px' }}>
        <div className="row align-items-end g-3">
          <div className="col-md-5">
            <label className="form-label-modern" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaCalendarAlt size={12} /> Payroll Period
            </label>
            <div style={{ position: 'relative' }}>
              <select
                className="form-control-modern"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ paddingLeft: '36px', appearance: 'none', cursor: 'pointer' }}
              >
                <option>March 2024</option>
                <option>February 2024</option>
                <option>January 2024</option>
              </select>
              <FaCalendarAlt size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-indigo)', opacity: 0.7 }} />
            </div>
          </div>
          <div className="col-md-7">
            <label className="form-label-modern">Quick Actions</label>
            <div className="d-flex gap-3">
              <button className="btn-outline-teal w-100" onClick={handleExportSummary} style={{ borderRadius: '14px', padding: '10px' }}>
                <FaDownload className="me-2" size={12} /> Export Summary
              </button>
              <button className="btn-outline-teal w-100" onClick={handleGenerateReports} style={{ borderRadius: '14px', padding: '10px' }}>
                <FaChartLine className="me-2" size={12} /> Generate Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table with Employee Avatars & Improved Styling */}
      <div className="card-modern overflow-hidden" style={{ borderRadius: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
        <div className="table-responsive">
          <table className="table table-custom" style={{ marginBottom: 0 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                <th style={{ borderTopLeftRadius: '20px' }}>Employee</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th style={{ borderTopRightRadius: '20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayroll.map((record) => (
                <tr key={record.id} style={{ transition: 'background 0.2s' }}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div className="emp-avatar" style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(145deg, var(--accent-indigo-pale), #fdf2f8)', color: 'var(--accent-indigo)' }}>
                        {getInitials(record.employee)}
                      </div>
                      <div>
                        <div className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{record.employee}</div>
                      </div>
                    </div>
                  </td>
                  <td>₹{record.basic.toLocaleString()}</td>
                  <td>₹{record.allowances.toLocaleString()}</td>
                  <td className="text-danger">-₹{record.deductions.toLocaleString()}</td>
                  <td style={{ color: 'var(--accent-teal)', fontWeight: 'bold', fontSize: '15px' }}>
                    ₹{record.net.toLocaleString()}
                  </td>
                  <td>
                    <span className={record.status === 'Processed' ? 'badge-success' : 'badge-warning'} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {record.status === 'Processed' ? <FaCheckCircle size={10} /> : <FaClock size={10} />}
                      {record.status}
                    </span>
                  </td>
                  <td>
                    {record.paymentDate !== '-' ? (
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{record.paymentDate}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="emp-act emp-act--edit"
                        style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(157,23,77,0.1)', border: 'none', color: 'var(--accent-indigo)' }}
                        onClick={() => toast.info('View details')}
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        className="emp-act emp-act--edit"
                        style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(217,119,6,0.1)', border: 'none', color: 'var(--accent-amber)' }}
                        onClick={() => handleDownloadSlip(record.employee)}
                      >
                        <FaDownload size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayroll.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div style={{ opacity: 0.6 }}>
                      <FaRupeeSign size={40} style={{ marginBottom: '12px', color: 'var(--text-muted)' }} />
                      <p className="text-muted mb-0">No payroll records found for {selectedMonth}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Distribution & Recent Transactions - Dynamic & Enhanced */}
      <div className="row mt-4 g-4">
        <div className="col-md-6">
          <div className="card-modern p-4" style={{ borderRadius: '24px', height: '100%' }}>
            <div className="d-flex align-items-center gap-2 mb-4">
              <FaPercent style={{ color: 'var(--accent-indigo)' }} />
              <h5 className="mb-0" style={{ fontWeight: 600 }}>Salary Distribution</h5>
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span>💰 Basic Salary</span>
                <span className="fw-semibold">{basicPercent.toFixed(0)}%</span>
              </div>
              <div className="progress-modern" style={{ height: '10px', borderRadius: '20px' }}>
                <div className="progress-bar" style={{ width: `${basicPercent}%`, background: 'linear-gradient(90deg, var(--accent-indigo), var(--accent-indigo-light))', borderRadius: '20px' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span>🎁 Allowances</span>
                <span className="fw-semibold">{allowancesPercent.toFixed(0)}%</span>
              </div>
              <div className="progress-modern" style={{ height: '10px', borderRadius: '20px' }}>
                <div className="progress-bar" style={{ width: `${allowancesPercent}%`, background: 'linear-gradient(90deg, var(--accent-teal), var(--accent-teal-light))', borderRadius: '20px' }}></div>
              </div>
            </div>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-2">
                <span>📉 Deductions</span>
                <span className="fw-semibold">{deductionsPercent.toFixed(0)}%</span>
              </div>
              <div className="progress-modern" style={{ height: '10px', borderRadius: '20px' }}>
                <div className="progress-bar" style={{ width: `${deductionsPercent}%`, background: 'linear-gradient(90deg, var(--danger), #f87171)', borderRadius: '20px' }}></div>
              </div>
            </div>
            <hr className="my-3" style={{ borderColor: 'var(--border-light)' }} />
            <div className="d-flex justify-content-between align-items-center mt-2">
              <span className="text-muted">Total Gross (Basic + Allowances)</span>
              <span className="fw-bold">₹{totalGross.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card-modern p-4" style={{ borderRadius: '24px', height: '100%' }}>
            <div className="d-flex align-items-center gap-2 mb-4">
              <FaRegClock style={{ color: 'var(--accent-indigo)' }} />
              <h5 className="mb-0" style={{ fontWeight: 600 }}>Recent Transactions</h5>
              {recentTransactions.length > 0 && (
                <span className="badge-info ms-auto" style={{ fontSize: '10px' }}>Latest 3</span>
              )}
            </div>
            {recentTransactions.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {recentTransactions.map(transaction => (
                  <div key={transaction.id} className="d-flex align-items-center justify-content-between p-2" style={{ borderRadius: '16px', background: 'var(--bg-surface)', transition: 'all 0.2s' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="emp-avatar" style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(145deg, #d1fae5, #a7f3d0)', color: 'var(--accent-teal)' }}>
                        {getInitials(transaction.employee)}
                      </div>
                      <div>
                        <p className="mb-0 fw-semibold">{transaction.employee}</p>
                        <small className="text-muted">{transaction.month} • {transaction.paymentDate}</small>
                      </div>
                    </div>
                    <div style={{ color: 'var(--accent-teal)', fontWeight: 'bold', fontSize: '16px' }}>
                      +₹{transaction.net.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <FaRupeeSign size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>No processed transactions for {selectedMonth}</p>
              </div>
            )}
            {recentTransactions.length > 0 && (
              <div className="mt-3 text-end">
                <button className="btn-outline-teal" style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '30px' }} onClick={() => toast.info('View all transactions')}>
                  View All <FaArrowRight size={10} className="ms-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;