import React, { useState } from 'react';
import { FaBars, FaBell, FaUserCircle } from 'react-icons/fa';

const Header = ({ user, onLogout, onMenuClick, sidebarCollapsed }) => {
  const [notificationCount] = useState(3);

  return (
    <nav style={{
      background: '#ffffff',
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
      {/* Mobile hamburger menu button */}
      <button
        className="d-md-none"
        onClick={onMenuClick}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#6366f1',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f0f2ff'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <FaBars size={22} />
      </button>

      {/* Right side items */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f2ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FaBell size={19} style={{ color: '#8b92b8' }} />
            {notificationCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>{notificationCount}</span>
            )}
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div className="dropdown">
          <div
            className="d-flex align-items-center gap-2"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'all 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f2ff'}
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
              fontSize: '15px',
              flexShrink: 0,
            }}>
              {user?.avatar || user?.name?.charAt(0) || 'A'}
            </div>
            <div className="d-none d-sm-block" style={{ lineHeight: 1.3 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e2340' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: '#8b92b8' }}>
                {user?.role || 'Employee'}
              </div>
            </div>
          </div>
          
          <ul className="dropdown-menu dropdown-menu-end" style={{
            background: '#fff',
            border: '1px solid #e0e2ff',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(99,102,241,0.12)',
            padding: '8px',
            marginTop: '8px',
            minWidth: '200px',
          }}>
            <li>
              <a className="dropdown-item" href="#" style={{
                borderRadius: '8px', 
                color: '#1e2340', 
                fontSize: '14px', 
                padding: '8px 12px',
                transition: 'all 0.2s ease',
              }}>👤 Profile</a>
            </li>
            <li>
              <a className="dropdown-item" href="#" style={{
                borderRadius: '8px', 
                color: '#1e2340', 
                fontSize: '14px', 
                padding: '8px 12px',
                transition: 'all 0.2s ease',
              }}>⚙️ Account Settings</a>
            </li>
            <li>
              <a className="dropdown-item" href="#" style={{
                borderRadius: '8px', 
                color: '#1e2340', 
                fontSize: '14px', 
                padding: '8px 12px',
                transition: 'all 0.2s ease',
              }}>🔒 Security</a>
            </li>
            <li><hr className="dropdown-divider" style={{ borderColor: '#e0e2ff', margin: '8px 0' }} /></li>
            <li>
              <a className="dropdown-item" onClick={onLogout} style={{
                borderRadius: '8px', 
                color: '#ef4444', 
                fontSize: '14px',
                padding: '8px 12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>🚪 Logout</a>
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