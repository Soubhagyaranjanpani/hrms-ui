import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserCheck, FaPlane, FaMoneyBillWave, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = ({ user }) => {
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
        backgroundColor: '#2d9c7c',
        borderRadius: 8,
      },
      {
        label: 'Resigned',
        data: [5, 3, 4, 6, 2, 4],
        backgroundColor: '#e74c3c',
        borderRadius: 8,
      }
    ]
  };

  const donutData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [{
      data: [87, 64, 5],
      backgroundColor: ['#2d9c7c', '#f4b942', '#3498db'],
      borderWidth: 0,
    }]
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard</h2>
        <p className="text-gray mb-0">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Total Employees</p>
                <h3 className="fw-bold mb-0">{stats.totalEmployees}</h3>
                <small className="text-success">+12 this month</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(45,156,124,0.2)' }}>
                <FaUsers color="#2d9c7c" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Present Today</p>
                <h3 className="fw-bold mb-0">{stats.presentToday}</h3>
                <small className="text-success">{Math.round(stats.presentToday/stats.totalEmployees*100)}% attendance</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.2)' }}>
                <FaUserCheck color="#2ecc71" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Pending Leaves</p>
                <h3 className="fw-bold mb-0">{stats.pendingLeaves}</h3>
                <small className="text-warning">3 awaiting approval</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(243,156,18,0.2)' }}>
                <FaPlane color="#f39c12" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-gray mb-1">Monthly Payroll</p>
                <h3 className="fw-bold mb-0">${stats.monthlyPayroll}</h3>
                <small className="text-info">Processed on 28th</small>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.2)' }}>
                <FaMoneyBillWave color="#3498db" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card-modern p-4">
            <h5 className="mb-3">Hiring Trends 2024</h5>
            <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { labels: { color: '#e8f0f2' } } } }} />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card-modern p-4">
            <h5 className="mb-3">Gender Diversity</h5>
            <Doughnut data={donutData} options={{ responsive: true, plugins: { legend: { labels: { color: '#e8f0f2' } } } }} />
          </div>
        </div>
      </div>

      {/* Recent Activities & Calendar */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card-modern p-4">
            <h5 className="mb-3">Recent Activities</h5>
            <div className="timeline">
              {recentActivities.map(activity => (
                <div key={activity.id} className="d-flex gap-3 mb-3 pb-3 border-bottom" style={{ borderColor: 'rgba(45,156,124,0.2)' }}>
                  <div className="rounded-circle bg-gradient p-2" style={{ width: '40px', height: '40px', background: 'rgba(45,156,124,0.2)' }}>
                    <FaChartLine color="#2d9c7c" />
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0 fw-semibold">{activity.user}</p>
                    <small className="text-gray">{activity.action}</small>
                    <div className="small text-gray">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card-modern p-4">
            <h5 className="mb-3">Upcoming Events</h5>
            {upcomingEvents.map(event => (
              <div key={event.id} className="d-flex gap-3 mb-3 p-3 rounded" style={{ background: 'rgba(45,156,124,0.05)' }}>
                <div className="text-center">
                  <div className="bg-gradient rounded p-2" style={{ background: 'rgba(45,156,124,0.2)' }}>
                    <FaCalendarAlt color="#2d9c7c" />
                  </div>
                </div>
                <div>
                  <p className="mb-0 fw-semibold">{event.title}</p>
                  <small className="text-gray">{event.date} at {event.time}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;