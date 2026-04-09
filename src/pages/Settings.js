import React, { useState } from 'react';
import { FaBuilding, FaBell, FaShieldAlt, FaUserCog, FaGlobe, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Settings = ({ user }) => {
  const [company, setCompany] = useState({
    name: 'ARI-HRMS',
    email: 'contact@ari-hrms.com',
    phone: '+1 234 567 8900',
    address: '123 Business Ave, New York, NY 10001',
    timezone: 'EST',
    dateFormat: 'MM/DD/YYYY',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    leaveRequests: true,
    payrollAlerts: true,
    attendanceReminders: false,
    weeklyReports: true,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div>
      <h2 className="mb-4">Settings</h2>

      <div className="row g-4">
        {/* Company Settings */}
        <div className="col-lg-6">
          <div className="card-modern p-4">
            <h5 className="mb-3">
              <FaBuilding className="me-2" /> Company Information
            </h5>
            <div className="mb-3">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-control"
                style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows="2"
                style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="col-lg-6">
          <div className="card-modern p-4">
            <h5 className="mb-3">
              <FaBell className="me-2" /> Notification Preferences
            </h5>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailAlerts"
                checked={notifications.emailAlerts}
                onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                style={{ backgroundColor: notifications.emailAlerts ? '#2d9c7c' : '' }}
              />
              <label className="form-check-label" htmlFor="emailAlerts">Email Alerts</label>
            </div>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="leaveRequests"
                checked={notifications.leaveRequests}
                onChange={(e) => setNotifications({ ...notifications, leaveRequests: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="leaveRequests">Leave Request Notifications</label>
            </div>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="payrollAlerts"
                checked={notifications.payrollAlerts}
                onChange={(e) => setNotifications({ ...notifications, payrollAlerts: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="payrollAlerts">Payroll Alerts</label>
            </div>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="weeklyReports"
                checked={notifications.weeklyReports}
                onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="weeklyReports">Weekly Reports</label>
            </div>
          </div>

          {/* System Preferences */}
          <div className="card-modern p-4 mt-4">
            <h5 className="mb-3">
              <FaGlobe className="me-2" /> System Preferences
            </h5>
            <div className="mb-3">
              <label className="form-label">Timezone</label>
              <select className="form-control" style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}>
                <option>EST (Eastern Time)</option>
                <option>PST (Pacific Time)</option>
                <option>GMT (Greenwich Mean Time)</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Date Format</label>
              <select className="form-control" style={{ background: 'rgba(10,25,31,0.8)', borderColor: 'rgba(45,156,124,0.3)', color: 'white' }}>
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-4 text-end">
        <button className="btn-gradient" onClick={handleSave}>
          <FaSave className="me-2" /> Save All Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;