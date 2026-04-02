import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, FaUsers, FaCalendarCheck, FaMoneyBillWave, 
  FaPlane, FaUserPlus, FaChartLine, FaChalkboardTeacher, 
  FaFileAlt, FaChartBar, FaCog, FaSignOutAlt, FaBars, FaBell,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

const Layout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/employees', icon: <FaUsers />, label: 'Employees' },
    { path: '/attendance', icon: <FaCalendarCheck />, label: 'Attendance' },
    { path: '/payroll', icon: <FaMoneyBillWave />, label: 'Payroll' },
    { path: '/leaves', icon: <FaPlane />, label: 'Leave Management' },
    { path: '/recruitment', icon: <FaUserPlus />, label: 'Recruitment' },
    { path: '/performance', icon: <FaChartLine />, label: 'Performance' },
    { path: '/training', icon: <FaChalkboardTeacher />, label: 'Training' },
    { path: '/documents', icon: <FaFileAlt />, label: 'Documents' },
    { path: '/reports', icon: <FaChartBar />, label: 'Reports' },
    { path: '/settings', icon: <FaCog />, label: 'Settings' },
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';
  const mainMarginLeft = sidebarCollapsed ? '72px' : '260px';

  return (
    <div className="d-flex">

      {/* ── Sidebar ── */}
      <div
        className={`sidebar ${sidebarOpen ? 'show' : ''}`}
        style={{
          width: sidebarWidth,
          position: 'fixed',
          height: '100vh',
          transition: 'width 0.3s ease',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 1000,
          background: 'linear-gradient(180deg, #1e2340 0%, #252b50 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        {/* Brand + Toggle Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: sidebarCollapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '16px',
          minHeight: '72px',
          flexShrink: 0,
        }}>
          {/* Brand name */}
          {!sidebarCollapsed && (
            <div>
              <h3 style={{
                fontSize: '20px',
                margin: 0,
                background: 'linear-gradient(135deg, #818cf8, #fb923c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
              }}>HRNexus</h3>
              <p style={{ fontSize: '11px', color: '#8b92b8', margin: 0 }}>Enterprise HRMS</p>
            </div>
          )}

          {/* Collapse / Expand Toggle Button — clearly visible */}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: sidebarCollapsed ? '8px' : '8px 12px',
              background: 'rgba(99,102,241,0.18)',
              border: '1.5px solid rgba(129,140,248,0.4)',
              borderRadius: '10px',
              color: '#a5b4fc',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.32)';
              e.currentTarget.style.borderColor = '#818cf8';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.18)';
              e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)';
            }}
          >
            {sidebarCollapsed
              ? <FaChevronRight size={13} />
              : <><FaChevronLeft size={13} /><span>Collapse</span></>
            }
          </button>
        </div>

        {/* Nav Items */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
          {menuItems.map((item, index) => (
            <li key={index} style={{ margin: '3px 10px' }}>
              <NavLink
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.label : ''}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: sidebarCollapsed ? '0' : '12px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '11px' : '11px 14px',
                  color: isActive ? '#a5b4fc' : '#8b92b8',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                  background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                })}
              >
                <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}

          {/* Logout */}
          <li style={{ margin: '3px 10px', marginTop: '12px' }}>
            <div
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: sidebarCollapsed ? '0' : '12px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '11px' : '11px 14px',
                color: '#f87171',
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                borderLeft: '3px solid transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                e.currentTarget.style.borderLeft = '3px solid #ef4444';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderLeft = '3px solid transparent';
              }}
            >
              <FaSignOutAlt style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span>Logout</span>}
            </div>
          </li>
        </ul>
      </div>

      {/* ── Main Content ── */}
      <div
        className="main-content"
        style={{
          marginLeft: mainMarginLeft,
          flex: 1,
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          width: `calc(100% - ${mainMarginLeft})`,
          background: '#f0f2ff',
        }}
      >

        {/* Top Navbar */}
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
          {/* Mobile hamburger */}
          <button
            className="d-md-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <FaBars size={22} />
          </button>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="d-md-none"
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)',
                zIndex: 998,
              }}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>

            {/* Bell */}
            <div style={{ position: 'relative' }}>
              <FaBell
                size={19}
                style={{ color: '#8b92b8', cursor: 'pointer' }}
              />
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-6px',
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
              }}>3</span>
            </div>

            {/* User avatar + dropdown */}
            <div className="dropdown">
              <div
                className="d-flex align-items-center gap-2"
                data-bs-toggle="dropdown"
                style={{ cursor: 'pointer' }}
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
              }}>
                <li>
                  <a className="dropdown-item" href="#" style={{
                    borderRadius: '8px', color: '#1e2340', fontSize: '14px', padding: '8px 12px'
                  }}>Profile</a>
                </li>
                <li>
                  <a className="dropdown-item" href="#" style={{
                    borderRadius: '8px', color: '#1e2340', fontSize: '14px', padding: '8px 12px'
                  }}>Settings</a>
                </li>
                <li><hr className="dropdown-divider" style={{ borderColor: '#e0e2ff' }} /></li>
                <li>
                  <a className="dropdown-item" onClick={handleLogout} style={{
                    borderRadius: '8px', color: '#ef4444', fontSize: '14px',
                    padding: '8px 12px', cursor: 'pointer'
                  }}>Logout</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div style={{ padding: '24px' }}>
          <Outlet />
        </div>
      </div>

      {/* Scrollbar styles */}
      <style>{`
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: rgba(99,102,241,0.08); border-radius: 10px; }
        .sidebar::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
        .sidebar::-webkit-scrollbar-thumb:hover { background: #818cf8; }

        .dropdown-item:hover {
          background: #f5f6ff !important;
          color: #6366f1 !important;
        }
      `}</style>
    </div>
  );
};

export default Layout;