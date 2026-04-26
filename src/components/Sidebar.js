import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaUsers, FaCalendarCheck, FaMoneyBillWave,
  FaPlane, FaUserPlus, FaChartLine, FaChalkboardTeacher,
  FaFileAlt, FaChartBar, FaCog,
  FaBuilding, FaSitemap,
  FaUserTag, FaDatabase, FaUserCircle, FaLeaf, FaChartPie, FaCheck, FaTasks, FaRupeeSign
} from 'react-icons/fa';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import ariHrmsLogo from '../assets/ARI-HRMS-logo.png';

const Sidebar = ({ sidebarCollapsed, sidebarOpen, isMobile, onItemClick, onLogout }) => {
  const [masterOpen, setMasterOpen] = useState(true);
  const [employeeOpen, setEmployeeOpen] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(true);
  const [payrollOpen, setPayrollOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(true);

  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/documents', icon: <FaFileAlt />, label: 'All Documents' },
  ];

  // Employee section items
  const employeeItems = [
    { path: '/employees', icon: <FaUsers />, label: 'Employee ' },
    { path: 'attendance-dashboard', icon: <FaChartLine />, label: 'Attendance Dashboard' },
    { path: 'attendance-summary', icon: <FaChartPie />, label: 'Attendance Summary' },
    { path: '/attendance-policy', icon: <FaCog />, label: 'Attendance Policy' },
    { path: '/attendance', icon: <FaCalendarCheck />, label: 'Attendance' },
    { path: '/training', icon: <FaChalkboardTeacher />, label: 'Training' },
    { path: '/EmployeeGrade', icon: <FaUserTag />, label: 'Employee Grade' },
  ];

  // Leave section items
  const leaveItems = [
    { path: '/LeaveDashboard', icon: <FaChartLine />, label: 'Leave Dashboard' },
    { path: '/leaves', icon: <FaPlane />, label: 'Apply Leave' },
    { path: '/approvedLeaves', icon: <FaCheck />, label: 'Approve & Reject leave' },
    { path: '/leavePolicy', icon: <FaCog />, label: 'Leave Policy' },
    // { path: '/leaveCalendar', icon: <FaChartBar />, label: 'Leave Calendar' },
    { path: '/holidays', icon: <FaLeaf />, label: 'Holiday Management' },


  ];

  const masterItems = [
    { path: '/branch', icon: <FaBuilding />, label: 'Branches' },
    { path: '/department', icon: <FaSitemap />, label: 'Departments' },
    { path: '/role', icon: <FaUserTag />, label: 'Roles' },
    { path: '/designation', icon: <FaCheck />, label: 'Designation' },
    { path: '/skills', icon: <FaChartBar />, label: 'Skills' },
    { path: '/leave', icon: <FaCalendarCheck />, label: 'Leave' },


  ];

  // Payroll section items
  const payrollItems = [
    { path: '/payroll-dashboard', icon: <FaChartBar />, label: 'Payroll Dashboard' },
    { path: '/SalaryConfig', icon: <FaCog />, label: 'Salary Configuration' },

    { path: '/salary-structure', icon: <FaRupeeSign />, label: 'Salary Structure' },
    { path: '/payroll', icon: <FaMoneyBillWave />, label: 'Payroll Management' },


    // { path: '/reports', icon: <FaChartBar />, label: 'Payroll Reports' },
  ];

  // Task Management section items
  const tasksItems = [
    { path: '/TaskDashboard', icon: <FaTachometerAlt />, label: 'Task Dashboard' },
    { path: '/CreateTask', icon: <FaTasks />, label: 'Create &Edit Task' },
    { path: '/TaskList', icon: <FaTasks />, label: 'My Tasks' },
    // { path: '/TaskDetail', icon: <FaTasks />, label: 'Task Detail' },
    { path: '/performance', icon: <FaChartLine />, label: 'Performance' },
    { path: '/PerformanceReview', icon: <FaChartLine />, label: 'Performance Review' },

  ];

  // Documents section items
  // const documentsItems = [

  //    { path: '/documents/employee', icon: <FaFileAlt />, label: 'Employee Documents' },
  //    { path: '/documents/company', icon: <FaFileAlt />, label: 'Company Documents' },
  // ];

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

  const toggleTasks = () => {
    setTasksOpen(!tasksOpen);
  };

  const sidebarWidth = isMobile ? '260px' : (sidebarCollapsed ? '72px' : '260px');

  return (
    <div
      className="sidebar"
      style={{
        width: sidebarWidth,
        position: 'fixed',
        top: 0,
        left: 0,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        height: '100vh',
        transition: 'transform 0.3s ease, width 0.3s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 1000,
        background: 'linear-gradient(135deg, var(--sidebar-bg-top), var(--sidebar-bg-bottom))',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand + Toggle Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: sidebarCollapsed ? '20px 0' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '16px',
        minHeight: '72px',
        flexShrink: 0,
      }}>
        {!sidebarCollapsed && (
          <div style={{
            background: 'rgba(255,255,255,0.98)',
            borderRadius: '12px',
            padding: 0,
            maxWidth: '220px',
            width: '100%'
          }}>
            <img src={ariHrmsLogo} alt="ARI-HRMS" style={{ width: '100%', height: 'auto', display: 'block', filter: 'contrast(1.12) saturate(1.08)', borderRadius: '8px' }} />
          </div>
        )}
      </div>

      {/* Nav Items */}
      <ul
        style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}
        onClickCapture={(e) => {
          if (isMobile && e.target.closest('a')) {
            onItemClick?.();
          }
        }}
      >
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
                color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                textDecoration: 'none',
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--sidebar-border-active)' : '3px solid transparent',
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
                color: 'var(--sidebar-heading)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--sidebar-text-active)';
                e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-heading)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUserCircle size={12} />
                <span>EMPLOYEE</span>
              </span>
              {employeeOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
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
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--sidebar-border-active)' : '3px solid transparent',
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

        {/* Task Management Section Header */}
        {!sidebarCollapsed && (
          <li style={{ margin: '16px 10px 8px 10px' }}>
            <div
              onClick={toggleTasks}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                color: 'var(--sidebar-heading)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--sidebar-text-active)';
                e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-heading)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTasks size={12} />
                <span>TASK MANAGEMENT</span>
              </span>
              {tasksOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Task Management Items */}
        {(tasksOpen || sidebarCollapsed) && (
          <>
            {tasksItems.map((item, index) => (
              <li key={`tasks-${index}`} style={{ margin: '3px 10px' }}>
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
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--sidebar-border-active)' : '3px solid transparent',
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
                color: 'var(--sidebar-heading)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--sidebar-text-active)';
                e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-heading)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaPlane size={12} />
                <span>LEAVE</span>
              </span>
              {leaveOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
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
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--sidebar-border-active)' : '3px solid transparent',
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
                color: 'var(--sidebar-heading)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--sidebar-text-active)';
                e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-heading)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaDatabase size={12} />
                <span>MASTER</span>
              </span>
              {masterOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
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
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--sidebar-border-active)' : '3px solid transparent',
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
                color: 'var(--sidebar-heading)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--sidebar-text-active)';
                e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-heading)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaMoneyBillWave size={12} />
                <span>PAYROLL</span>
              </span>
              {payrollOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
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
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--sidebar-border-active)' : '3px solid transparent',
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
                color: 'var(--sidebar-heading)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--sidebar-text-active)';
                e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-heading)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFileAlt size={12} />
                <span>DOCUMENTS</span>
              </span>
              {documentsOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Documents Items */}
        {(documentsOpen || sidebarCollapsed) && (
          <>
            {/* {documentsItems.map((item, index) => (
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
                    color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--sidebar-border-active)' : '3px solid transparent',
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
            ))} */}
          </>
        )}

        {/* Logout */}
        <li style={{ margin: '3px 10px', marginTop: '12px' }}>
          <div
            onClick={() => {
              if (isMobile) onItemClick?.();
              onLogout();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: sidebarCollapsed ? '0' : '12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              padding: sidebarCollapsed ? '11px' : '11px 14px',
              color: 'var(--danger)',
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
              e.currentTarget.style.borderLeft = 'none';
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
        .sidebar::-webkit-scrollbar-track { background: rgba(190,24,93,0.08); border-radius: 10px; }
        .sidebar::-webkit-scrollbar-thumb { background: var(--accent-indigo); border-radius: 10px; }
        .sidebar::-webkit-scrollbar-thumb:hover { background: var(--accent-indigo-light); }
      `}</style>
    </div>
  );
};

export default Sidebar;