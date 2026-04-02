import React, { useState } from 'react';
import { FaDownload, FaEye, FaCheckCircle, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Payroll = ({ user }) => {
  const [payroll, setPayroll] = useState([
    { id: 1, employee: 'Emma Watson', month: 'March 2024', basic: 50000, allowances: 15000, deductions: 5000, net: 60000, status: 'Processed', paymentDate: '2024-03-28' },
    { id: 2, employee: 'Liam Brown', month: 'March 2024', basic: 45000, allowances: 12000, deductions: 4000, net: 53000, status: 'Processed', paymentDate: '2024-03-28' },
    { id: 3, employee: 'Olivia Davis', month: 'March 2024', basic: 40000, allowances: 10000, deductions: 3500, net: 46500, status: 'Pending', paymentDate: '-' },
    { id: 4, employee: 'Noah Wilson', month: 'March 2024', basic: 55000, allowances: 18000, deductions: 6000, net: 67000, status: 'Processed', paymentDate: '2024-03-28' },
  ]);

  const [selectedMonth, setSelectedMonth] = useState('March 2024');

  const totalPayroll = payroll.reduce((sum, p) => sum + p.net, 0);
  const processedCount = payroll.filter(p => p.status === 'Processed').length;

  const handleProcessPayroll = () => {
    toast.success('Payroll processing started!');
  };

  const handleDownloadSlip = (employee) => {
    toast.info(`Downloading payslip for ${employee}`);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0">Payroll Management</h2>
        <button className="btn-gradient" onClick={handleProcessPayroll}>
          <FaCheckCircle className="me-2" /> Process Payroll
        </button>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Total Payroll</p>
                <h3 className="fw-bold mb-0">${(totalPayroll / 1000).toFixed(1)}K</h3>
                <small>For {selectedMonth}</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(45,156,124,0.2)' }}>
                <FaCheckCircle color="#2d9c7c" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Processed</p>
                <h3 className="fw-bold mb-0">{processedCount}/{payroll.length}</h3>
                <small>Employees</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.2)' }}>
                <FaCheckCircle color="#2ecc71" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Average Salary</p>
                <h3 className="fw-bold mb-0">${(totalPayroll / payroll.length / 1000).toFixed(1)}K</h3>
                <small>Per employee</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.2)' }}>
                <FaEye color="#3498db" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Pending</p>
                <h3 className="fw-bold mb-0">{payroll.length - processedCount}</h3>
                <small>Awaiting processing</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(243,156,18,0.2)' }}>
                <FaClock color="#f39c12" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="card-modern p-4 mb-4">
        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Payroll Period</label>
            <select 
              className="form-control" 
              style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option>March 2024</option>
              <option>February 2024</option>
              <option>January 2024</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Quick Actions</label>
            <div className="d-flex gap-2">
              <button className="btn-outline-teal w-100">Export Summary</button>
              <button className="btn-outline-teal w-100">Generate Reports</button>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card-modern overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map(record => (
                <tr key={record.id}>
                  <td className="fw-semibold">{record.employee}</td>
                  <td>${record.basic.toLocaleString()}</td>
                  <td>${record.allowances.toLocaleString()}</td>
                  <td>${record.deductions.toLocaleString()}</td>
                  <td className="fw-bold text-teal">${record.net.toLocaleString()}</td>
                  <td>
                    <span className={record.status === 'Processed' ? 'badge-success' : 'badge-warning'}>
                      {record.status}
                    </span>
                  </td>
                  <td>{record.paymentDate}</td>
                  <td>
                    <FaEye className="me-2" style={{ color: '#2d9c7c', cursor: 'pointer' }} onClick={() => toast.info('View details')} />
                    <FaDownload style={{ color: '#f4b942', cursor: 'pointer' }} onClick={() => handleDownloadSlip(record.employee)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Breakdown Card */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card-modern p-4">
            <h5 className="mb-3">Salary Distribution</h5>
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Basic Salary</span>
                <span>68%</span>
              </div>
              <div className="progress-modern">
                <div className="progress-bar" style={{ width: '68%' }}></div>
              </div>
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Allowances</span>
                <span>22%</span>
              </div>
              <div className="progress-modern">
                <div className="progress-bar" style={{ width: '22%' }}></div>
              </div>
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span>Deductions</span>
                <span>10%</span>
              </div>
              <div className="progress-modern">
                <div className="progress-bar" style={{ width: '10%', background: '#e74c3c' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card-modern p-4">
            <h5 className="mb-3">Recent Transactions</h5>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'rgba(45,156,124,0.2)' }}>
              <div>
                <p className="mb-0 fw-semibold">Emma Watson</p>
                <small className="text-gray">March 2024 Salary</small>
              </div>
              <div className="text-teal fw-bold">+$60,000</div>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'rgba(45,156,124,0.2)' }}>
              <div>
                <p className="mb-0 fw-semibold">Liam Brown</p>
                <small className="text-gray">March 2024 Salary</small>
              </div>
              <div className="text-teal fw-bold">+$53,000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;