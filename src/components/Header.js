import React, { useState } from 'react';
import { FaBars, FaBell, FaBuilding } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi'; // ✅ NEW ICON

const Header = ({ user, onLogout, onMenuClick }) => {
  const [notificationCount] = useState(3);

  const getRoleColor = (role) => {
    if (!role) return '#8b92b8';
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'admin') return '#f97316';
    if (lowerRole === 'employee') return '#818cf8';
    if (lowerRole === 'manager') return '#10b981';
    return '#8b92b8';
  };

  return (
    <nav style={{
      background: '#1e2340',
      borderBottom: '1px solid #e0e2ff',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 12px rgba(99,102,241,0.07)',
    }}>

      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="d-md-none"
          onClick={onMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6366f1',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px'
          }}
        >
          <FaBars size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBuilding size={20} style={{ color: '#818cf8', opacity: 0.8 }} />
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1rem, 4vw, 1.35rem)',
            fontWeight: 700,
            background: 'linear-gradient(120deg, #6366f1 0%, #f97316 45%, #10b981 80%)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            Human Resource Management System
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button style={{
            background: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}>
            <FaBell size={19} style={{ color: '#8b92b8' }} />
            {notificationCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {notificationCount}
              </span>
            )}
          </button>
        </div>

        {/* USER */}
        <div className="dropdown">
          <div
            className="d-flex align-items-center gap-2"
            data-bs-toggle="dropdown"
            style={{
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
              background: 'transparent'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'transparent'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
            }}>
              {user?.avatar || user?.name?.charAt(0) || 'A'}
            </div>

            <div>
              <div style={{ fontWeight: 600, color: '#f5f6ff' }}>
                {user?.name || 'User'}
              </div>
              <div style={{
                fontSize: '12px',
                color: getRoleColor(user?.role)
              }}>
                {user?.role || 'Employee'}
              </div>
            </div>
          </div>

          {/* DROPDOWN */}
          <ul className="dropdown-menu dropdown-menu-end" style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '8px',
            marginTop: '8px'
          }}>
            <li>
              <a className="dropdown-item" href="#">👤 Profile</a>
            </li>

            <li><hr className="dropdown-divider" /></li>

            {/* ✅ ONLY CHANGE → Logout Icon */}
            <li>
              <a className="dropdown-item d-flex align-items-center gap-2" onClick={onLogout}>
                <FiLogOut size={16} />
                Logout
              </a>
            </li>
          </ul>
        </div>

      </div>

      <style>{`
        .dropdown-item:hover {
          background: #f5f6ff !important;
          color: #6366f1 !important;
        }
      `}</style>

    </nav>
  );
};

export default Header;