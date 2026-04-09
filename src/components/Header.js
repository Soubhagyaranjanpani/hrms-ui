import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaBuilding } from 'react-icons/fa';
import { FiLogOut, FiMenu } from 'react-icons/fi';

const Header = ({ user, onLogout, onMenuClick }) => {
  const notificationCount = 3;
  const navigate = useNavigate();
  const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%234f46e5'/%3E%3Cstop offset='1' stop-color='%230f766e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' fill='url(%23g)'/%3E%3Ctext x='40' y='50' font-family='Arial, sans-serif' font-size='30' font-weight='700' text-anchor='middle' fill='white'%3EU%3C/text%3E%3C/svg%3E";

  const avatarSrc = user?.avatar && typeof user.avatar === 'string'
    ? user.avatar
    : PLACEHOLDER_AVATAR;

  const getRoleClass = (role) => {
    if (!role) return 'app-header-role-default';
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'admin') return 'app-header-role-admin';
    if (lowerRole === 'employee') return 'app-header-role-employee';
    if (lowerRole === 'manager') return 'app-header-role-manager';
    return 'app-header-role-default';
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <nav className="app-header">

      {/* LEFT */}
      <div className="app-header-left">
        <button
          className="app-header-menu-btn"
          onClick={onMenuClick}
          type="button"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <FiMenu size={20} />
        </button>

        <div className="app-header-title-wrap">
          <FaBuilding size={18} className="app-header-title-icon" />
          <h1 className="app-header-title">
            ARI-HRMS • Human Resource Management System
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="app-header-right">

        {/* Bell */}
        <div className="app-header-bell-wrap">
          <button className="app-header-bell-btn">
            <FaBell size={18} />
            {notificationCount > 0 && (
              <span className="app-header-bell-badge">
                {notificationCount}
              </span>
            )}
          </button>
        </div>

        {/* USER */}
        <div className="dropdown">
          <div
            className="d-flex align-items-center gap-2 app-header-user-trigger"
            data-bs-toggle="dropdown"
          >
            <div className="app-header-user-avatar">
              <img
                src={avatarSrc}
                alt="User profile"
                className="app-header-user-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_AVATAR;
                }}
              />
            </div>

            <div className="app-header-user-meta">
              <div className="app-header-user-name">
                {user?.name || 'User'}
              </div>
              <div className={`app-header-user-role ${getRoleClass(user?.role)}`}>
                {user?.role || 'Employee'}
              </div>
            </div>
          </div>

          {/* DROPDOWN */}
          <ul className="dropdown-menu dropdown-menu-end app-header-dropdown-menu">
            <li>
              <button type="button" className="dropdown-item app-header-dropdown-btn" onClick={handleProfileClick}>
                👤 Profile
              </button>
            </li>

            <li><hr className="dropdown-divider" /></li>

            {/* ✅ ONLY CHANGE → Logout Icon */}
            <li>
              <button type="button" className="dropdown-item d-flex align-items-center gap-2 app-header-dropdown-btn" onClick={onLogout}>
                <FiLogOut size={16} />
                Logout
              </button>
            </li>
          </ul>
        </div>

      </div>
    </nav>
  );
};

export default Header;