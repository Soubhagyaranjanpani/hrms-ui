import React, { useState, useEffect } from 'react';
import {
  FaUsers,
  FaUserCheck,
  FaPlane,
  FaMoneyBillWave,
  FaChartLine,
  FaCalendarAlt,
  FaBolt,
  FaArrowUp,
  FaArrowDown,
  FaRegClock,
  FaMars,
  FaVenus,
  FaGenderless,
  FaBuilding,
} from 'react-icons/fa';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = ({ user }) => {
  const chartPalette = {
    primary: '#9d174d',
    success: '#15803d',
    warning: '#d97706',
    info: '#b45309',
    danger: '#dc2626',
    text: '#475569',
    grid: 'rgba(148, 163, 184, 0.25)',
  };

  const [stats, setStats] = useState({
    totalEmployees: 156,
    presentToday: 142,
    pendingLeaves: 8,
    averageAttendance: 94,
    totalDepartments: 8,
    monthlyPayroll: '245K'
  });

  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Hired',
        data: [12, 19, 15, 17, 14, 13],
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return chartPalette.success;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, '#22c55e');
          gradient.addColorStop(1, '#15803d');
          return gradient;
        },
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.62,
        categoryPercentage: 0.58,
      },
      {
        label: 'Resigned',
        data: [5, 3, 4, 6, 2, 4],
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return chartPalette.danger;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, '#f87171');
          gradient.addColorStop(1, '#dc2626');
          return gradient;
        },
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.62,
        categoryPercentage: 0.58,
      }
    ]
  };

  const donutData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [{
      data: [87, 64, 5],
      backgroundColor: [chartPalette.primary, chartPalette.success, chartPalette.warning],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 8,
      spacing: 2,
    }]
  };

  const barChartOptions = {
    responsive: true,
    animation: {
      duration: 1100,
      easing: 'easeOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: chartPalette.text,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          font: { size: 12, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        borderColor: 'rgba(190, 24, 93, 0.45)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        padding: 10,
        displayColors: true,
        caretPadding: 8,
      },
    },
    scales: {
      x: {
        ticks: {
          color: chartPalette.text,
          font: { size: 11, weight: '600' },
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: chartPalette.text,
          stepSize: 5,
          font: { size: 11 },
        },
        grid: {
          color: chartPalette.grid,
          borderDash: [4, 4],
          drawBorder: false,
        },
        border: { display: false },
      },
    },
  };

  const donutOptions = {
    responsive: true,
    cutout: '72%',
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        borderColor: 'rgba(190, 24, 93, 0.45)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        padding: 10,
        displayColors: true,
      },
    },
  };

  const recentActivities = [
    { id: 1, user: 'Emma Watson', action: 'Applied for leave', time: '2 hours ago', type: 'leave' },
    { id: 2, user: 'Liam Brown', action: 'Marked attendance', time: '4 hours ago', type: 'attendance' },
    { id: 3, user: 'Olivia Davis', action: 'Salary processed', time: 'Yesterday', type: 'payroll' },
    { id: 4, user: 'Noah Wilson', action: 'Completed training', time: 'Yesterday', type: 'training' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Board Meeting', date: '2024-04-05', time: '10:00 AM' },
    { id: 2, title: 'Employee Review', date: '2024-04-07', time: '2:00 PM' },
    { id: 3, title: 'Training Session', date: '2024-04-10', time: '11:00 AM' },
  ];

  const metricCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      note: '+12 this month',
      noteColor: 'var(--success)',
      icon: <FaUsers />,
      iconBg: 'rgba(79, 70, 229, 0.14)',
      iconColor: chartPalette.primary,
      trend: '+8.3%',
      trendUp: true,
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      note: `${Math.round((stats.presentToday / stats.totalEmployees) * 100)}% attendance`,
      noteColor: 'var(--success)',
      icon: <FaUserCheck />,
      iconBg: 'rgba(15, 118, 110, 0.14)',
      iconColor: chartPalette.success,
      trend: '+2.1%',
      trendUp: true,
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      note: '3 awaiting approval',
      noteColor: 'var(--warning)',
      icon: <FaPlane />,
      iconBg: 'rgba(217, 119, 6, 0.14)',
      iconColor: chartPalette.warning,
      trend: '-1.4%',
      trendUp: false,
    },
    {
      title: 'Monthly Payroll',
      value: `$${stats.monthlyPayroll}`,
      note: 'Processed on 28th',
      noteColor: chartPalette.info,
      icon: <FaMoneyBillWave />,
      iconBg: 'rgba(3, 105, 161, 0.14)',
      iconColor: chartPalette.info,
      trend: '+5.0%',
      trendUp: true,
    },
  ];

  const getActivityColor = (type) => {
    if (type === 'leave') return 'var(--warning)';
    if (type === 'payroll') return chartPalette.info;
    if (type === 'training') return 'var(--accent-indigo)';
    return 'var(--success)';
  };

  const totalGenderCount = donutData.datasets[0].data.reduce((sum, value) => sum + value, 0);
  const femalePercentage = Math.round((donutData.datasets[0].data[1] / totalGenderCount) * 100);

  const insightCards = [
    {
      label: 'Attendance Score',
      value: `${stats.averageAttendance}%`,
      icon: <FaUserCheck />,
      bg: 'rgba(5, 150, 105, 0.12)',
      color: 'var(--success)',
    },
    {
      label: 'Departments Active',
      value: stats.totalDepartments,
      icon: <FaBuilding />,
      bg: 'rgba(79, 70, 229, 0.12)',
      color: 'var(--accent-indigo)',
    },
    {
      label: 'Leave Risk',
      value: 'Low',
      icon: <FaPlane />,
      bg: 'rgba(217, 119, 6, 0.12)',
      color: 'var(--warning)',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-icon">
            <FaBolt />
          </div>
          <div className="page-header-text">
            <h1>Dashboard Overview</h1>
            <p>Welcome back, {user?.name || 'User'} · Real-time workforce insights</p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn-outline-indigo">
            <FaRegClock /> Refresh
          </button>
          <button className="btn-gradient">
            Generate Report
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {insightCards.map((insight) => (
          <div className="col-lg-4" key={insight.label}>
            <div className="quick-insight-card">
              <div className="quick-insight-icon" style={{ background: insight.bg, color: insight.color }}>
                {insight.icon}
              </div>
              <div>
                <p className="mb-1" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{insight.label}</p>
                <h6 className="mb-0" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{insight.value}</h6>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {metricCards.map((card) => (
          <div key={card.title} className="col-xl-3 col-md-6">
            <div className="stat-card h-100">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="mb-1" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{card.title}</p>
                  <h3 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>{card.value}</h3>
                  <small style={{ color: card.noteColor, fontWeight: 600 }}>{card.note}</small>
                </div>
                <div
                  className="stat-icon"
                  style={{
                    background: card.iconBg,
                    color: card.iconColor,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
                  }}
                >
                  {card.icon}
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>vs last month</div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: card.trendUp ? 'var(--success)' : 'var(--danger)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {card.trendUp ? <FaArrowUp /> : <FaArrowDown />}
                  {card.trend}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-xl-7 col-lg-8">
          <div className="card-modern p-4 dashboard-chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Hiring Trends 2024</h5>
              <span className="status-badge info">Monthly</span>
            </div>
            <div className="dashboard-chart-body" style={{ height: 300 }}>
              <Bar data={barChartData} options={{ ...barChartOptions, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
        <div className="col-xl-5 col-lg-4">
          <div className="card-modern p-4 dashboard-chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Gender Diversity</h5>
              <span className="status-badge success">Balanced</span>
            </div>
            <div className="gender-card-layout dashboard-chart-body">
              <div className="gender-chart-wrap">
                <Doughnut data={donutData} options={{ ...donutOptions, maintainAspectRatio: false }} />
                <div className="gender-center-label">
                  <strong>{totalGenderCount}</strong>
                  <span>Total</span>
                </div>
              </div>
              <div className="gender-legend-list">
                <div className="gender-legend-item">
                  <div className="gender-legend-title">
                    <span className="legend-dot" style={{ background: chartPalette.primary }}></span>
                    <FaMars /> Male
                  </div>
                  <strong>{donutData.datasets[0].data[0]}</strong>
                </div>
                <div className="gender-legend-item">
                  <div className="gender-legend-title">
                    <span className="legend-dot" style={{ background: chartPalette.success }}></span>
                    <FaVenus /> Female
                  </div>
                  <strong>{donutData.datasets[0].data[1]}</strong>
                </div>
                <div className="gender-legend-item">
                  <div className="gender-legend-title">
                    <span className="legend-dot" style={{ background: chartPalette.warning }}></span>
                    <FaGenderless /> Other
                  </div>
                  <strong>{donutData.datasets[0].data[2]}</strong>
                </div>
                <div className="gender-balance-chip">
                  Female representation: <b>{femalePercentage}%</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities & Calendar */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card-modern p-4 dashboard-content-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Recent Activities</h5>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 24 hours</span>
            </div>
            <div className="timeline dashboard-content-body">
              {recentActivities.map(activity => (
                <div
                  key={activity.id}
                  className="d-flex gap-3 mb-3 pb-3 border-bottom"
                  style={{ borderColor: 'var(--border-light)' }}
                >
                  <div
                    className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                    style={{
                      width: 40,
                      height: 40,
                      background: `${getActivityColor(activity.type)}1f`,
                    }}
                  >
                    <FaChartLine color={getActivityColor(activity.type)} />
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0 fw-semibold" style={{ color: 'var(--text-primary)' }}>{activity.user}</p>
                    <small style={{ color: 'var(--text-secondary)' }}>{activity.action}</small>
                    <div className="small" style={{ color: 'var(--text-muted)' }}>{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card-modern p-4 dashboard-content-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Upcoming Events</h5>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>This week</span>
            </div>
            <div className="dashboard-content-body">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  className="d-flex gap-3 mb-3 p-3 rounded"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    className="text-center rounded"
                    style={{
                      minWidth: 52,
                      background: 'rgba(79, 70, 229, 0.12)',
                      color: 'var(--accent-indigo)',
                      padding: '8px 6px',
                      fontWeight: 700,
                    }}
                  >
                    <FaCalendarAlt style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 11 }}>{event.date.split('-')[2]}</div>
                  </div>
                  <div>
                    <p className="mb-1 fw-semibold" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                    <small style={{ color: 'var(--text-secondary)' }}>{event.date}</small>
                    <div className="small" style={{ color: 'var(--text-muted)' }}>{event.time}</div>
                  </div>
                  <div className="ms-auto d-flex align-items-center">
                    <span className="status-badge info">Scheduled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-chart-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .dashboard-chart-body {
          flex: 1;
        }

        .dashboard-content-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .dashboard-content-body {
          flex: 1;
        }

        .quick-insight-card {
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 72px;
        }

        .quick-insight-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .status-badge.info {
          background: rgba(79, 70, 229, 0.14);
          color: var(--accent-indigo);
        }

        .status-badge.success {
          background: rgba(5, 150, 105, 0.14);
          color: var(--success);
        }

        .gender-card-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .gender-chart-wrap {
          position: relative;
          height: 230px;
        }

        .gender-center-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          pointer-events: none;
        }

        .gender-center-label strong {
          color: var(--text-primary);
          font-size: 22px;
          line-height: 1;
        }

        .gender-center-label span {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          margin-top: 4px;
        }

        .gender-legend-list {
          display: grid;
          gap: 8px;
        }

        .gender-legend-item {
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-white);
          color: var(--text-secondary);
          font-size: 13px;
        }

        .gender-legend-title {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
        }

        .gender-balance-chip {
          margin-top: 2px;
          border-radius: 10px;
          padding: 8px 10px;
          background: rgba(79, 70, 229, 0.1);
          color: var(--accent-indigo);
          font-size: 12px;
          font-weight: 600;
        }

        @media (min-width: 992px) {
          .gender-card-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;