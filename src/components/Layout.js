import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Layout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
      if (mobile) {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
      return;
    }
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const mainMarginLeft = isMobile ? '0px' : sidebarCollapsed ? '72px' : '260px';

  return (
    <div className="d-flex">
      {/* Sidebar Component */}
      <Sidebar 
        sidebarCollapsed={sidebarCollapsed}
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        onItemClick={() => isMobile && setSidebarOpen(false)}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
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
          width: isMobile ? '100%' : `calc(100% - ${mainMarginLeft})`,
          background: 'var(--bg-page)',
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
        <div style={{ padding: isMobile ? '12px' : '18px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;