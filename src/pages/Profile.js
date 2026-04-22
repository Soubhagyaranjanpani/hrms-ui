import React, { useState, useEffect } from 'react';
import {
  FaEnvelope, FaPhoneAlt, FaUserTie, FaIdCard,
  FaUser, FaBuilding, FaCalendarAlt, FaCode, FaGraduationCap,
  FaEdit, FaSave, FaTimes, FaKey, FaEye, FaEyeSlash, FaArrowLeft
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { BASE_URL, STORAGE_KEYS } from '../config/api.config';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  };

  const fetchProfile = async () => {
    const employeeId = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_ID);
    if (!employeeId) {
      toast.error('Error', 'Employee ID not found. Please login again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/employee-profile/full/${employeeId}`,
        axiosConfig
      );
      if (res.data?.status === 200 && res.data?.response) {
        const data = res.data.response;
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || '',
          department: data.department || '',
          branch: data.branch || '',
          managerName: data.managerName || '',
          joiningDate: data.joiningDate ? data.joiningDate.split('T')[0] : '',
          qualifications: data.qualifications || [],
          skills: data.skills || [],
        });
      } else {
        throw new Error(res.data?.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      toast.error('Error', err.response?.data?.message || 'Could not load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        role: profile.role || '',
        department: profile.department || '',
        branch: profile.branch || '',
        managerName: profile.managerName || '',
        joiningDate: profile.joiningDate ? profile.joiningDate.split('T')[0] : '',
        qualifications: profile.qualifications || [],
        skills: profile.skills || [],
      });
    }
  };

  const handleChangePasswordView = () => {
    setIsChangingPassword(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
  };

  const handleCancelPassword = () => {
    setIsChangingPassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        id: profile.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        branch: formData.branch,
        managerName: formData.managerName,
        joiningDate: formData.joiningDate,
        qualifications: formData.qualifications,
        skills: formData.skills,
      };

      const res = await axios.put(
        `${BASE_URL}/api/employee-profile/update`,
        payload,
        axiosConfig
      );

      if (res.data?.status === 200) {
        toast.success('Success', 'Profile updated successfully');
        setIsEditing(false);
        fetchProfile();
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Password handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setChangingPassword(true);
    try {
      const payload = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };

      const res = await axios.post(
        `${BASE_URL}/api/employees/change-password`,
        payload,
        axiosConfig
      );

      if (res.data?.status === 200) {
        toast.success('Success', 'Password changed successfully');
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordErrors({});
      } else {
        throw new Error(res.data?.message || 'Password change failed');
      }
    } catch (err) {
      console.error('Password change error:', err);
      toast.error('Error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;
  if (!profile) return <div className="container mt-4 text-center">No profile data available.</div>;

  const displayName = profile.name?.replace(/\s+null\s*/gi, ' ').trim() || '—';
  const initials = displayName?.charAt(0)?.toUpperCase() || '?';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

// ------------------- CHANGE PASSWORD VIEW (COMPACT) -------------------
// ------------------- CHANGE PASSWORD VIEW (VERTICAL LAYOUT, COMPACT) -------------------
if (isChangingPassword) {
  return (
    <div>
      {/* PAGE HEADER with Back button */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 className="emp-title">Change Password</h1>
          <p className="emp-subtitle">Enter your current password and choose a new one</p>
        </div>
        <button className="emp-back-btn" onClick={handleCancelPassword}>
          <FaArrowLeft size={12} /> Back
        </button>
      </div>

      {/* Compact form wrapper */}
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div className="emp-form-wrap">
          <form onSubmit={handleChangePasswordSubmit}>
            <div className="emp-form-section">
              <div className="emp-section-label">Security</div>
              {/* VERTICAL LAYOUT - each field takes full width */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Current Password */}
                <div className="emp-field">
                  <label>Current Password <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      style={{ width: '100%', paddingRight: '40px' }}
                      className={passwordErrors.currentPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                      }}
                    >
                      {showPassword.current ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <span className="field-err">{passwordErrors.currentPassword}</span>
                  )}
                </div>

                {/* New Password */}
                <div className="emp-field">
                  <label>New Password <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      style={{ width: '100%', paddingRight: '40px' }}
                      className={passwordErrors.newPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                      }}
                    >
                      {showPassword.new ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <span className="field-err">{passwordErrors.newPassword}</span>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="emp-field">
                  <label>Confirm New Password <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      style={{ width: '100%', paddingRight: '40px' }}
                      className={passwordErrors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                      }}
                    >
                      {showPassword.confirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <span className="field-err">{passwordErrors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={handleCancelPassword}>
                Cancel
              </button>
              <button type="submit" className="emp-submit-btn" disabled={changingPassword}>
                {changingPassword ? (
                  <><span className="emp-spinner" /> Changing…</>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

  // ------------------- EDIT PROFILE VIEW -------------------
  if (isEditing) {
    return (
      <div>
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <div>
            <h1 className="emp-title">Edit Profile</h1>
            <p className="emp-subtitle">Update your personal and employment information</p>
          </div>
          <button className="emp-back-btn" onClick={handleCancelEdit}>
            <FaArrowLeft size={12} /> Back
          </button>
        </div>

        <div className="emp-form-wrap">
          <form onSubmit={handleSubmit}>
            <div className="emp-form-section">
              <div className="emp-section-label">Personal Information</div>
              <div className="emp-form-grid">
                <div className="emp-field">
                  <label>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className="emp-field">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="emp-field">
                  <label>Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="emp-divider" />
            <div className="emp-form-section">
              <div className="emp-section-label">Employment Details</div>
              <div className="emp-form-grid">
                <div className="emp-field">
                  <label>Designation / Role</label>
                  <input type="text" name="role" value={formData.role} onChange={handleChange} />
                </div>
                <div className="emp-field">
                  <label>Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} />
                </div>
                <div className="emp-field">
                  <label>Branch</label>
                  <input type="text" name="branch" value={formData.branch} onChange={handleChange} />
                </div>
                <div className="emp-field">
                  <label>Manager Name</label>
                  <input type="text" name="managerName" value={formData.managerName} onChange={handleChange} />
                </div>
                <div className="emp-field">
                  <label>Joining Date</label>
                  <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="emp-divider" />
            <div className="emp-form-section">
              <div className="emp-section-label">Skills & Qualifications</div>
              <div className="emp-form-grid">
                <div className="emp-field">
                  <label>Qualifications (comma separated)</label>
                  <input
                    type="text"
                    name="qualifications"
                    value={Array.isArray(formData.qualifications) ? formData.qualifications.join(', ') : formData.qualifications}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      qualifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="e.g., B.Tech, MBA"
                  />
                </div>
                <div className="emp-field">
                  <label>Skills (comma separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="e.g., React, Java, Project Management"
                  />
                </div>
              </div>
            </div>
            <div className="emp-form-footer">
              <button type="button" className="emp-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
              <button type="submit" className="emp-submit-btn" disabled={submitting}>
                {submitting ? <><span className="emp-spinner" /> Updating…</> : <><FaSave size={12} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ------------------- READ-ONLY PROFILE VIEW -------------------
  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon"><FaUserTie /></div>
          <div className="page-header-text">
            <h1>My Profile</h1>
            <p>Manage account details and professional information</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="emp-add-btn" onClick={handleChangePasswordView}>
            <FaKey size={13} /> Change Password
          </button>
          <button className="emp-add-btn" onClick={handleEdit}>
            <FaEdit size={13} /> Edit Profile
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <section className="card-modern profile-hero-card">
          <div className="profile-hero-top">
            <div className="profile-avatar">{initials}</div>
            <div>
              <h3 className="profile-name">{displayName}</h3>
              <p className="profile-role">{profile.role || '—'}</p>
            </div>
          </div>
          <div className="profile-pill-row">
            <span className="profile-pill"><FaUserTie /> Active Account</span>
            {/* <span className="profile-pill"><FaBuilding /> {profile.department || '—'}</span> */}

          </div>
        </section>

        <section className="card-modern profile-details-card">
          <h4 className="profile-section-title">Contact Information</h4>
          <div className="profile-info-list">
            <div className="profile-info-item">
              <span className="profile-info-label"><FaEnvelope /> Email</span>
              <span className="profile-info-value">{profile.email || '—'}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label"><FaPhoneAlt /> Phone</span>
              <span className="profile-info-value">{profile.phone || '—'}</span>
            </div>
          </div>
        </section>
      </div>

      <section className="card-modern profile-work-card">
        <h4 className="profile-section-title">Employment Details</h4>
        <div className="profile-work-grid">
          <div className="profile-work-item">
            <span className="profile-work-label">Employee ID</span>
            <strong className="profile-work-value">{profile.employeeCode || '—'}</strong>
          </div>
          <div className="profile-work-item">
            <span className="profile-work-label">Department</span>
            <strong className="profile-work-value">{profile.department || '—'}</strong>
          </div>
          <div className="profile-work-item">
            <span className="profile-work-label">Designation</span>
            <strong className="profile-work-value">{profile.role || '—'}</strong>
          </div>
          <div className="profile-work-item">
            <span className="profile-work-label"><FaCalendarAlt /> Joining Date</span>
            <strong className="profile-work-value">{formatDate(profile.joiningDate)}</strong>
          </div>
          <div className="profile-work-item">
            <span className="profile-work-label"><FaBuilding /> Branch</span>
            <strong className="profile-work-value">{profile.branch || '—'}</strong>
          </div>
          <div className="profile-work-item">
            <span className="profile-work-label"><FaUser /> Manager</span>
            <strong className="profile-work-value">{profile.managerName || '—'}</strong>
          </div>
          <div className="profile-work-item" style={{ gridColumn: 'span 2' }}>
            <span className="profile-work-label"><FaGraduationCap /> Qualifications</span>
            <div style={{ marginTop: '8px' }}>
              {profile.qualifications && profile.qualifications.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.qualifications.map((q, idx) => (
                    <span key={idx} className="emp-pill emp-pill--coral">{q}</span>
                  ))}
                </div>
              ) : (
                <span className="profile-work-value">—</span>
              )}
            </div>
          </div>
          <div className="profile-work-item" style={{ gridColumn: 'span 2' }}>
            <span className="profile-work-label"><FaCode /> Skills</span>
            <div style={{ marginTop: '8px' }}>
              {profile.skills && profile.skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="emp-pill emp-pill--indigo">
                      {typeof skill === 'string' ? skill : skill.skillName || skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="profile-work-value">—</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile; nschskhcis i