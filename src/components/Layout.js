import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Layout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const mainMarginLeft = sidebarCollapsed ? '72px' : '260px';

  return (
    <div className="d-flex">
      {/* Sidebar Component */}
      <Sidebar 
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="d-md-none"
          style={{
            position: 'fixed',
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 998,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
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
        {/* Header Component */}
        <Header 
          user={user}
          onLogout={handleLogout}
          onMenuClick={toggleMobileSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page Content */}
        <div style={{ padding: '24px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;