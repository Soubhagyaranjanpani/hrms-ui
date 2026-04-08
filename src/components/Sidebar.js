import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaUsers, FaCalendarCheck, FaMoneyBillWave,
  FaPlane, FaUserPlus, FaChartLine, FaChalkboardTeacher,
  FaFileAlt, FaChartBar, FaCog,
  FaChevronLeft, FaChevronRight, FaBuilding, FaSitemap,
  FaUserTag, FaDatabase, FaUserCircle, FaLeaf, FaChartPie, FaCheck
} from 'react-icons/fa';

const Sidebar = ({ sidebarCollapsed, toggleSidebar, onLogout }) => {
  const [masterOpen, setMasterOpen] = useState(true);
  const [employeeOpen, setEmployeeOpen] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(true);
  const [payrollOpen, setPayrollOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);

  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
  ];

  // Employee section items
  const employeeItems = [
    { path: '/employees', icon: <FaUsers />, label: 'Employee ' },
    { path: 'attendance-dashboard', icon: <FaChartLine />, label: 'Attendance Dashboard' },
    { path: 'attendance-summary', icon: <FaChartPie />, label: 'Attendance Summary' },
    { path: '/attendance-policy', icon: <FaCog />, label: 'Attendance Policy' },
    { path: '/attendance', icon: <FaCalendarCheck />, label: 'Attendance' },
    { path: '/performance', icon: <FaChartLine />, label: 'Performance' },
    { path: '/training', icon: <FaChalkboardTeacher />, label: 'Training' },
  ];

  // Leave section items
  const leaveItems = [
    { path: '/leaves', icon: <FaPlane />, label: 'Apply Leave' },
    {path:'/approvedLeaves', icon:<FaCheck />, label:'Approve & Reject leave'},
    {path:'/leavePolicy', icon:<FaCog />, label:'Leave Policy'},
    { path: '/leaveCalendar', icon: <FaChartBar />, label: 'Leave Calendar' },

  ];

  const masterItems = [
    { path: '/branch', icon: <FaBuilding />, label: 'Branches' },
    { path: '/department', icon: <FaSitemap />, label: 'Departments' },
    { path: '/role', icon: <FaUserTag />, label: 'Roles' },
    { path: 'destination', icon: <FaUserTag />, label: 'Destination' },
  ];

  // Payroll section items
  const payrollItems = [
    { path: '/payroll', icon: <FaMoneyBillWave />, label: 'Payroll Management' },
    { path: '/payroll/salary', icon: <FaMoneyBillWave />, label: 'Salary Processing' },
    { path: '/reports', icon: <FaChartBar />, label: 'Payroll Reports' },
  ];

  // Documents section items
  const documentsItems = [
    { path: '/documents', icon: <FaFileAlt />, label: 'All Documents' },
    { path: '/documents/employee', icon: <FaFileAlt />, label: 'Employee Documents' },
    { path: '/documents/company', icon: <FaFileAlt />, label: 'Company Documents' },
  ];

  const toggleMaster = () => {
    setMasterOpen(!masterOpen);
  };

  const toggleEmployee = () => {
    setEmployeeOpen(!employeeOpen);
  };

  const toggleLeave = () => {
    setLeaveOpen(!leaveOpen);
  };

  const togglePayroll = () => {
    setPayrollOpen(!payrollOpen);
  };

  const toggleDocuments = () => {
    setDocumentsOpen(!documentsOpen);
  };

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  return (
    <div
      className="sidebar"
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
        {/* Dashboard Menu Item */}
        {menuItems.map((item, index) => (
          <li key={index} style={{ margin: '3px 10px' }}>
            <NavLink
              to={item.path}
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

        {/* Employee Section Header */}
        {!sidebarCollapsed && (
          <li style={{ margin: '16px 10px 8px 10px' }}>
            <div
              onClick={toggleEmployee}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                color: '#6b7298',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#a5b4fc';
                e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#6b7298';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUserCircle size={12} />
                <span>EMPLOYEE</span>
              </span>
              {employeeOpen ? <FaChevronLeft size={10} /> : <FaChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Employee Items */}
        {(employeeOpen || sidebarCollapsed) && (
          <>
            {employeeItems.map((item, index) => (
              <li key={`employee-${index}`} style={{ margin: '3px 10px' }}>
                <NavLink
                  to={item.path}
                  title={sidebarCollapsed ? item.label : ''}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: sidebarCollapsed ? '0' : '12px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '11px' : '11px 14px',
                    paddingLeft: sidebarCollapsed ? '11px' : '38px',
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
          </>
        )}

        {/* Leave Section Header */}
        {!sidebarCollapsed && (
          <li style={{ margin: '16px 10px 8px 10px' }}>
            <div
              onClick={toggleLeave}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                color: '#6b7298',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#a5b4fc';
                e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#6b7298';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaPlane size={12} />
                <span>LEAVE</span>
              </span>
              {leaveOpen ? <FaChevronLeft size={10} /> : <FaChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Leave Items */}
        {(leaveOpen || sidebarCollapsed) && (
          <>
            {leaveItems.map((item, index) => (
              <li key={`leave-${index}`} style={{ margin: '3px 10px' }}>
                <NavLink
                  to={item.path}
                  title={sidebarCollapsed ? item.label : ''}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: sidebarCollapsed ? '0' : '12px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '11px' : '11px 14px',
                    paddingLeft: sidebarCollapsed ? '11px' : '38px',
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
          </>
        )}

        {/* Master Section Header */}
        {!sidebarCollapsed && (
          <li style={{ margin: '16px 10px 8px 10px' }}>
            <div
              onClick={toggleMaster}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                color: '#6b7298',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#a5b4fc';
                e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#6b7298';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaDatabase size={12} />
                <span>MASTER</span>
              </span>
              {masterOpen ? <FaChevronLeft size={10} /> : <FaChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Master Items */}
        {(masterOpen || sidebarCollapsed) && (
          <>
            {masterItems.map((item, index) => (
              <li key={`master-${index}`} style={{ margin: '3px 10px' }}>
                <NavLink
                  to={item.path}
                  title={sidebarCollapsed ? item.label : ''}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: sidebarCollapsed ? '0' : '12px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '11px' : '11px 14px',
                    paddingLeft: sidebarCollapsed ? '11px' : '38px',
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
          </>
        )}

        {/* Payroll Section Header */}
        {!sidebarCollapsed && (
          <li style={{ margin: '16px 10px 8px 10px' }}>
            <div
              onClick={togglePayroll}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                color: '#6b7298',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#a5b4fc';
                e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#6b7298';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaMoneyBillWave size={12} />
                <span>PAYROLL</span>
              </span>
              {payrollOpen ? <FaChevronLeft size={10} /> : <FaChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Payroll Items */}
        {(payrollOpen || sidebarCollapsed) && (
          <>
            {payrollItems.map((item, index) => (
              <li key={`payroll-${index}`} style={{ margin: '3px 10px' }}>
                <NavLink
                  to={item.path}
                  title={sidebarCollapsed ? item.label : ''}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: sidebarCollapsed ? '0' : '12px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '11px' : '11px 14px',
                    paddingLeft: sidebarCollapsed ? '11px' : '38px',
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
          </>
        )}

        {/* Documents Section Header */}
        {!sidebarCollapsed && (
          <li style={{ margin: '16px 10px 8px 10px' }}>
            <div
              onClick={toggleDocuments}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                color: '#6b7298',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#a5b4fc';
                e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#6b7298';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileAlt size={12} />
                <span>DOCUMENTS</span>
              </span>
              {documentsOpen ? <FaChevronLeft size={10} /> : <FaChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Documents Items */}
        {(documentsOpen || sidebarCollapsed) && (
          <>
            {documentsItems.map((item, index) => (
              <li key={`documents-${index}`} style={{ margin: '3px 10px' }}>
                <NavLink
                  to={item.path}
                  title={sidebarCollapsed ? item.label : ''}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: sidebarCollapsed ? '0' : '12px',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    padding: sidebarCollapsed ? '11px' : '11px 14px',
                    paddingLeft: sidebarCollapsed ? '11px' : '38px',
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
          </>
        )}

        {/* Logout */}
        <li style={{ margin: '3px 10px', marginTop: '12px' }}>
          <div
            onClick={onLogout}
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
              borderLeft: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.borderLeft ='none';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderLeft = 'none';
            }}
          >
          </div>
        </li>
      </ul>

      <style>{`
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: rgba(99,102,241,0.08); border-radius: 10px; }
        .sidebar::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
        .sidebar::-webkit-scrollbar-thumb:hover { background: #818cf8; }
      `}</style>
    </div>
  );
};

export default Sidebar;