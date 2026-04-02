import React, { useState } from 'react';
import { FaChartBar, FaChartLine, FaDownload, FaEye, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Reports = ({ user }) => {
  const [reports] = useState([
    { id: 1, name: 'Attendance Summary', type: 'Monthly', lastGenerated: '2024-03-31', views: 45, icon: <FaChartBar /> },
    { id: 2, name: 'Payroll Report', type: 'Monthly', lastGenerated: '2024-03-28', views: 38, icon: <FaChartLine /> },
    { id: 3, name: 'Leave Analysis', type: 'Quarterly', lastGenerated: '2024-03-25', views: 27, icon: <FaChartBar /> },
    { id: 4, name: 'Recruitment Metrics', type: 'Monthly', lastGenerated: '2024-03-30', views: 32, icon: <FaChartLine /> },
    { id: 5, name: 'Performance Review', type: 'Quarterly', lastGenerated: '2024-03-20', views: 41, icon: <FaChartBar /> },
    { id: 6, name: 'Training Completion', type: 'Monthly', lastGenerated: '2024-03-29', views: 23, icon: <FaChartLine /> },
  ]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Reports & Analytics</h2>
        <button className="btn-gradient" onClick={() => toast.info('Generate new report')}>
          <FaChartBar className="me-2" /> Generate Report
        </button>
      </div>

      <div className="row g-4">
        {reports.map(report => (
          <div key={report.id} className="col-md-6 col-lg-4">
            <div className="card-modern p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="stat-icon" style={{ background: 'rgba(45,156,124,0.2)' }}>
                  {report.icon}
                </div>
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-teal" data-bs-toggle="dropdown">
                    ...
                  </button>
                  <ul className="dropdown-menu" style={{ background: 'var(--card-bg)' }}>
                    <li><a className="dropdown-item text-light" href="#"><FaFilePdf className="me-2" /> Export PDF</a></li>
                    <li><a className="dropdown-item text-light" href="#"><FaFileExcel className="me-2" /> Export Excel</a></li>
                  </ul>
                </div>
              </div>
              
              <h6 className="mb-2">{report.name}</h6>
              <div className="d-flex justify-content-between mb-3">
                <small className="text-gray">Type: {report.type}</small>
                <small className="text-gray">{report.views} views</small>
              </div>
              
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-gray">Last: {report.lastGenerated}</small>
                <button className="btn-outline-teal btn-sm" onClick={() => toast.info(`Viewing ${report.name}`)}>
                  <FaEye className="me-1" /> View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="card-modern p-4 mt-4">
        <h5 className="mb-3">Report Insights</h5>
        <div className="row">
          <div className="col-md-4">
            <div className="text-center">
              <div className="display-6 fw-bold text-teal">87%</div>
              <small className="text-gray">Attendance Rate</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="text-center">
              <div className="display-6 fw-bold text-teal">$285K</div>
              <small className="text-gray">Monthly Payroll</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="text-center">
              <div className="display-6 fw-bold text-teal">94%</div>
              <small className="text-gray">Employee Satisfaction</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;