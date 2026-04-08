import React from 'react';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaBuilding, FaUserTie, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';

const Profile = ({ user }) => {
  const profile = {
    name: user?.name || 'User Name',
    role: user?.role || 'Employee',
    email: user?.email || 'user@company.com',
    phone: user?.phone || '+91 90000 00000',
    location: user?.location || 'Hyderabad, India',
    department: user?.department || 'Human Resources',
    employeeId: user?.employeeId || 'EMP-1024',
    joiningDate: user?.joiningDate || '12 Mar 2023',
  };

  const initials = profile.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon">
            <FaUserTie />
          </div>
          <div className="page-header-text">
            <h1>My Profile</h1>
            <p>Manage account details and professional information</p>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <section className="card-modern profile-hero-card">
          <div className="profile-hero-top">
            <div className="profile-avatar">{initials}</div>
            <div>
              <h3 className="profile-name">{profile.name}</h3>
              <p className="profile-role">{profile.role}</p>
            </div>
          </div>

          <div className="profile-pill-row">
            <span className="profile-pill"><FaShieldAlt /> Active Account</span>
            <span className="profile-pill"><FaBuilding /> {profile.department}</span>
          </div>
        </section>

        <section className="card-modern profile-details-card">
          <h4 className="profile-section-title">Contact Information</h4>
          <div className="profile-info-list">
            <div className="profile-info-item">
              <span className="profile-info-label"><FaEnvelope /> Email</span>
              <span className="profile-info-value">{profile.email}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label"><FaPhoneAlt /> Phone</span>
              <span className="profile-info-value">{profile.phone}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label"><FaMapMarkerAlt /> Location</span>
              <span className="profile-info-value">{profile.location}</span>
            </div>
          </div>
        </section>
      </div>

      <section className="card-modern profile-work-card">
        <h4 className="profile-section-title">Employment Details</h4>
        <div className="profile-work-grid">
          <div className="profile-work-item">
            <span className="profile-work-label">Employee ID</span>
            <strong className="profile-work-value">{profile.employeeId}</strong>
          </div>
          <div className="profile-work-item">
            <span className="profile-work-label">Department</span>
            <strong className="profile-work-value">{profile.department}</strong>
          </div>
          <div className="profile-work-item">
            <span className="profile-work-label">Designation</span>
            <strong className="profile-work-value">{profile.role}</strong>
          </div>
          <div className="profile-work-item">
            <span className="profile-work-label"><FaCalendarAlt /> Joining Date</span>
            <strong className="profile-work-value">{profile.joiningDate}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;