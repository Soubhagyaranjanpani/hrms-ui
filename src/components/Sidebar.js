import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaUsers, FaCalendarCheck, FaMoneyBillWave,
  FaPlane, FaUserPlus, FaChartLine, FaChalkboardTeacher,
  FaFileAlt, FaChartBar, FaCog,
  FaBuilding, FaSitemap,FaPlus,FaBriefcase ,
  FaUserTag, FaDatabase, FaUserCircle, FaLeaf, FaChartPie, FaCheck, FaTasks, FaRupeeSign, FaSignOutAlt, FaClock, FaUserFriends,
  FaAward,
  FaDochub,
  FaBook,
  FaTrailer
} from 'react-icons/fa';
import { BsChevronDown, BsChevronRight } from 'react-icons/bs';
import ariHrmsLogo from '../assets/ARI-HRMS-logo.png';
import { FaTimeline } from 'react-icons/fa6';

const Sidebar = ({ sidebarCollapsed, sidebarOpen, isMobile, onItemClick, onLogout }) => {
  const [masterOpen, setMasterOpen] = useState(true);
  const [employeeOpen, setEmployeeOpen] = useState(true);
  const [serviceBookOpen, setServiceBookOpen] = useState(true);
  const [attendanceOpen, setAttendanceOpen] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(true);
  const [payrollOpen, setPayrollOpen] = useState(true);
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(true);
 const [subMenuOpen, setSubMenuOpen] = useState({});

  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    // Get user role from localStorage or your auth context
    // Convert to proper case for comparison
    const role = localStorage.getItem('roleName') || 'Employee';
    // Normalize role: capitalize first letter, rest lowercase
    const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    console.log('User Role:', role, 'Normalized:', normalizedRole); // For debugging
    setUserRole(normalizedRole);
  }, []);

  // Menu items accessible to all roles
  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard', roles: ['Admin', 'Hr', 'Manager', 'Employee'] },
    { path: '/documents', icon: <FaFileAlt />, label: 'All Documents', roles: ['Admin', 'Hr', 'Manager', 'Employee'] },
    { path: '/reports', icon: <FaChartBar />, label: 'Reports', roles: ['Admin', 'Hr', 'Manager'] },
  ];

  // Employee section items - Employee Management
  const employeeItems = [
    { path: '/employees', icon: <FaUsers />, label: 'Employee List', roles: ['Admin', 'Hr', 'Manager'] },
    { path: '/EmployeeGrade', icon: <FaUserTag />, label: 'Employee Grade', roles: ['Admin', 'Hr'] },
        {path: '/Certification', icon: <FaChalkboardTeacher />, label: 'Certification', roles: ['Admin', 'Hr']},
    {path: '/EmployeeDesignation', icon:<FaCheck />,label: 'Employee Designation',roles:['Admin','Hr']},
    {path: '/EmployeeSkillMaster', icon:< FaBook/>,label:'Employee Skill Master',roles:['Admin','Hr']},
  ];

  // serive book 
  const serviceBookItems = [
    {path: '/CreateServiceBook', icon: <FaPlus />, label: 'Create Service Book ', roles: ['Admin', 'Hr']},
    {path : '/AppointmentDetail', icon: <FaBriefcase />, label: 'Appointment', roles: ['Admin', 'Hr']},
    {path : '/ConfirmationDetails', icon: <FaUserCircle />, label: 'Confirmation', roles: ['Admin', 'Hr']},
    {path : '/PromotionHistory', icon: <FaDatabase />, label: 'Promotion ', roles: ['Admin', 'Hr']},
    {path : '/TransferHistory', icon: <FaSitemap />, label: 'Transfer', roles: ['Admin', 'Hr']},
    {path : '/DeputationManagement', icon: <FaSitemap />, label: 'Deputation ', roles: ['Admin', 'Hr']},
    {path : '/PayRevisionHistory', icon: <FaSitemap />, label: 'Pay Revision', roles: ['Admin', 'Hr']},
    {path : '/DisciplinaryRecords', icon: <FaChartBar />, label: 'Disciplinary', roles: ['Admin','Hr']},
    {path : '/AwardsHistory', icon:<FaAward />,label: 'Awards',roles:['Admin','Hr']},
    {path : '/TrainingHistory',icon:<FaPlane />,label: 'Training History',roles:['Admin','Hr']},
    {path : '/Retirement', icon:<FaBuilding />,label:'Retirement',roles:['Admin','Hr']},
    {path: '/Timeline', icon:<FaTimeline />,label:'Timeline',roles:['Admin','Hr']},
    {path: '/DocumentsRepository',icon:<FaDochub />,label:'Documents',roles:['Admin','Hr']},
    {path: '/SearchBook',icon:<FaBook />,label:'Search Book',roles:['Admin','Hr']},
    {path:'/AuditTrail',icon:<FaTrailer />,label:'Audit History',roles:['Admin','Hr']},
    {path: '/ServicebookReport',icon:<FaBook />,label:'Report',roles:['Admin','Hr']},
  ];

  // Attendance section items - separate from Employee
  const attendanceItems = [
    { path: '/attendance-dashboard', icon: <FaChartLine />, label: 'Attendance Dashboard', roles: ['Admin', 'Hr', 'Manager', 'Employee'] },
    { path: '/attendance-summary', icon: <FaChartPie />, label: 'Attendance Summary', roles: ['Admin', 'Hr', 'Manager', 'Employee'] },
    { path: '/attendance', icon: <FaCalendarCheck />, label: 'Mark Attendance', roles: ['Admin', 'Hr', 'Manager', 'Employee'] },
    { path: '/attendance-policy', icon: <FaCog />, label: 'Attendance Policy', roles: ['Admin', 'Hr'] },

  ];

  // Leave section items with role restrictions
  const leaveItems = [
    { path: '/LeaveDashboard', icon: <FaChartLine />, label: 'Leave Dashboard', roles: ['Admin', 'Hr', 'Manager'] },
    { path: '/leaves', icon: <FaPlane />, label: 'Apply Leave', roles: ['Admin', 'Hr', 'Manager', 'Employee'] },
    { path: '/approvedLeaves', icon: <FaCheck />, label: 'Approve & Reject leave', roles: ['Admin', 'Hr', 'Manager'] },
    { path: '/leavePolicy', icon: <FaCog />, label: 'Leave Policy', roles: ['Admin', 'Hr'] },
    { path: '/holidays', icon: <FaLeaf />, label: 'Holiday Management', roles: ['Admin', 'Hr'] },
  ];

  // Master section items - only for Admin
  // const masterItems = [
  //   { path: '/branch', icon: <FaBuilding />, label: 'Branches', roles: ['Admin'] },
  //   { path: '/department', icon: <FaSitemap />, label: 'Departments', roles: ['Admin'] },
  //   { path: '/role', icon: <FaUserTag />, label: 'Roles', roles: ['Admin'] },
  //       { path: '/designation', icon: <FaCheck />, label: 'Designation', roles: ['Admin'] },
  //   { path: '/leave', icon: <FaCalendarCheck />, label: 'Leave', roles: ['Admin'] },
  //   { path: '/skills', icon: <FaCalendarCheck />, label: 'skill', roles: ['Admin'] },
  //   {path: '/SourceMaster', icon: <FaDatabase />, label: 'SourceMaster', roles : ['Admin','Hr'] },

  // ];
// Master section items - with Recruitment Sub-Module
const masterItems = [
  { path: '/branch', icon: <FaBuilding />, label: 'Branches', roles: ['Admin'] },
  { path: '/department', icon: <FaSitemap />, label: 'Departments', roles: ['Admin'] },
  { path: '/role', icon: <FaUserTag />, label: 'Roles', roles: ['Admin'] },
  { path: '/designation', icon: <FaCheck />, label: 'Designation', roles: ['Admin'] },
  { path: '/leave', icon: <FaCalendarCheck />, label: 'Leave', roles: ['Admin'] },
  { path: '/skills', icon: <FaCalendarCheck />, label: 'Skill', roles: ['Admin'] },
    {
    icon: <FaDatabase />,
    label: 'Recruitment',
    roles: ['Admin', 'Hr'],
    isSubMenu: true,
    children: [
      { path: '/SourceMaster', icon: <FaDatabase />, label: 'Source Master', roles: ['Admin', 'Hr'] },
      { path: '/InterviewType', icon: <FaUserPlus />, label: 'Interview Type', roles: ['Admin', 'Hr'] },
      { path: '/InterviewRound', icon: <FaBriefcase />, label: 'Interview Round', roles: ['Admin', 'Hr'] },
      { path: '/CandidateStatus', icon: <FaUsers />, label: 'Candidate Status', roles: ['Admin', 'Hr'] },
      { path: '/RejectionReason', icon: <FaCalendarCheck />, label: 'Rejection Reason', roles: ['Admin', 'Hr'] },
      { path: '/OfferStatus', icon: <FaTasks />, label: 'Offer Status', roles: ['Admin', 'Hr'] },
      { path: '/Noticeperiod', icon: <FaCheck />, label: 'Notice period', roles: ['Admin', 'Hr'] },
      { path: '/SkillMaster', icon: <FaUserPlus />, label: 'Skill Master', roles: ['Admin', 'Hr'] },
     { path: '/InterviewPanel', icon: <FaUserPlus />, label: 'Interview Panel', roles: ['Admin', 'Hr'] },
     { path: '/JobLocation', icon: <FaUserPlus />, label: 'Job Location', roles: ['Admin', 'Hr'] },

    ]
  },
];

  // Payroll section items - only Admin and HR
  const payrollItems = [
    { path: '/payroll-dashboard', icon: <FaChartBar />, label: 'Payroll Dashboard', roles: ['Admin', 'Hr'] },
    { path: '/SalaryConfig', icon: <FaCog />, label: 'Salary Configuration', roles: ['Admin', 'Hr'] },
    { path: '/salary-structure', icon: <FaRupeeSign />, label: 'Salary Structure', roles: ['Admin', 'Hr'] },
    { path: '/payroll', icon: <FaMoneyBillWave />, label: 'Payroll Management', roles: ['Admin', 'Hr'] },
  ];

  // Task Management items - all roles
  const tasksItems = [
    { path: '/TaskDashboard', icon: <FaTachometerAlt />, label: 'Task Dashboard', roles: ['Admin', 'Hr', 'Manager', 'Employee'] },
    { path: '/CreateTask', icon: <FaTasks />, label: 'Create & Edit Task', roles: ['Admin', 'Hr', 'Manager'] },
    { path: '/TaskList', icon: <FaTasks />, label: 'My Tasks', roles: ['Admin', 'Hr', 'Manager', 'Employee'] },
    { path: '/performance', icon: <FaChartLine />, label: 'Performance', roles: ['Admin', 'Hr', 'Manager'] },
    { path: '/PerformanceReview', icon: <FaChartLine />, label: 'Performance Review', roles: ['Admin', 'Hr', 'Manager'] },
  ];

  // Helper function to check if user has access to an item
  const hasAccess = (itemRoles) => {
    if (!userRole) return false;
    return itemRoles.includes(userRole);
  };

  // Helper function to check if a section has any visible items
  const hasAnyVisibleItems = (items) => {
    return items.some(item => hasAccess(item.roles));
  };

  const toggleMaster = () => setMasterOpen(!masterOpen);
  const toggleEmployee = () => setEmployeeOpen(!employeeOpen);
 const toggleServiceBook = () => setServiceBookOpen(!serviceBookOpen);
  const toggleAttendance = () => setAttendanceOpen(!attendanceOpen);
  const toggleLeave = () => setLeaveOpen(!leaveOpen);
  const togglePayroll = () => setPayrollOpen(!payrollOpen);
  const toggleDocuments = () => setDocumentsOpen(!documentsOpen);
  const toggleTasks = () => setTasksOpen(!tasksOpen);

  const sidebarWidth = isMobile ? '260px' : (sidebarCollapsed ? '72px' : '260px');

  // If role is not loaded yet, show loading or return null
  if (!userRole) {
    return null; // Or a loading spinner
  }

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
        {/* Dashboard Menu Items */}
        {menuItems.map((item, index) => (
          hasAccess(item.roles) && (
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
          )
        ))}

        {/* Employee Section - Employee Management */}
        {hasAnyVisibleItems(employeeItems) && !sidebarCollapsed && (
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
                <FaUserFriends size={12} />
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
              hasAccess(item.roles) && (
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
              )
            ))}
          </>
        )}

        {/* Service Book Section */}
        {hasAnyVisibleItems(serviceBookItems) && !sidebarCollapsed && (
          <li style={{ margin: '16px 10px 8px 10px' }}>
            <div
              onClick={toggleServiceBook}
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
                <FaChartLine size={12} />
                <span> Employee SERVICE BOOK</span>
              </span>
              {serviceBookOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
            </div>
          </li>
        )}
        {/* Service Book Items */}
        {(serviceBookOpen || sidebarCollapsed) && (
          <>
            {serviceBookItems.map((item, index) => (
              hasAccess(item.roles) && (
                <li key={`servicebook-${index}`} style={{ margin: '3px 10px' }}>
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
              )
            ))}
          </>
        )}

        {/* Attendance Section - Separate from Employee */}
        {hasAnyVisibleItems(attendanceItems) && !sidebarCollapsed && (
          <li style={{ margin: '16px 10px 8px 10px' }}>
            <div
              onClick={toggleAttendance}
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
                <FaClock size={12} />
                <span>ATTENDANCE</span>
              </span>
              {attendanceOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Attendance Items */}
        {(attendanceOpen || sidebarCollapsed) && (
          <>
            {attendanceItems.map((item, index) => (
              hasAccess(item.roles) && (
                <li key={`attendance-${index}`} style={{ margin: '3px 10px' }}>
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
              )
            ))}
          </>
        )}

        {/* Task Management Section */}
        {hasAnyVisibleItems(tasksItems) && !sidebarCollapsed && (
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
                <span>TASK</span>
              </span>
              {tasksOpen ? <BsChevronDown size={10} /> : <BsChevronRight size={10} />}
            </div>
          </li>
        )}

        {/* Task Management Items */}
        {(tasksOpen || sidebarCollapsed) && (
          <>
            {tasksItems.map((item, index) => (
              hasAccess(item.roles) && (
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
              )
            ))}
          </>
        )}

        {/* Leave Section */}
        {hasAnyVisibleItems(leaveItems) && !sidebarCollapsed && (
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
              hasAccess(item.roles) && (
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
              )
            ))}
          </>
        )}

        {/* Master Section - Only for Admin */}
        {/* {hasAnyVisibleItems(masterItems) && !sidebarCollapsed && (
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
        )} */}
// ===== MASTER SECTION =====
{hasAnyVisibleItems(masterItems) && !sidebarCollapsed && (
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

{/* Master Items - Support Sub-Menu */}
{(masterOpen || sidebarCollapsed) && (
  <>
    {masterItems.map((item, index) => {
      // ✅ Check if item has children (Sub-Menu)
      if (item.children) {
        return hasAccess(item.roles) && (
          <li key={`master-${index}`} style={{ margin: '3px 10px' }}>
            <div
              onClick={() => {
                // Toggle sub-menu
                const key = `recruitment-${index}`;
                setSubMenuOpen(prev => ({
                  ...prev,
                  [key]: !prev[key]
                }));
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                paddingLeft: '38px',
                color: 'var(--sidebar-text)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--sidebar-text-active)';
                e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--sidebar-text)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.icon}
                <span>{item.label}</span>
              </span>
              {subMenuOpen[`recruitment-${index}`] ? (
                <BsChevronDown size={10} />
              ) : (
                <BsChevronRight size={10} />
              )}
            </div>
            
            {/* Sub-Menu Items */}
            {subMenuOpen[`recruitment-${index}`] && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {item.children.map((child, childIdx) => (
                  hasAccess(child.roles) && (
                    <li key={`child-${childIdx}`} style={{ margin: '2px 0' }}>
                      <NavLink
                        to={child.path}
                        title={sidebarCollapsed ? child.label : ''}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 14px',
                          paddingLeft: '54px',
                          color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                          background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                          borderLeft: isActive ? '3px solid var(--sidebar-border-active)' : '3px solid transparent',
                          fontSize: '13px',
                          fontWeight: isActive ? 500 : 400,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        })}
                      >
                        {child.icon}
                        <span>{child.label}</span>
                      </NavLink>
                    </li>
                  )
                ))}
              </ul>
            )}
          </li>
        );
      }
      
      // ✅ Normal menu item (no children)
      return hasAccess(item.roles) && (
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
      );
    })}
  </>
)}
        {/* Master Items */}
        {(masterOpen || sidebarCollapsed) && (
          <>
            {masterItems.map((item, index) => (
              hasAccess(item.roles) && (
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
              )
            ))}
          </>
        )}

        {/* Payroll Section - Only Admin and HR */}
        {hasAnyVisibleItems(payrollItems) && !sidebarCollapsed && (
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
              hasAccess(item.roles) && (
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
              )
            ))}
          </>
        )}

        {/* Logout Button */}
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
            <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>
              <FaSignOutAlt />
            </span>
            {!sidebarCollapsed && <span>Logout</span>}
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