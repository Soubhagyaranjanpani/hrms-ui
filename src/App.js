import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/global.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import LeaveManagement from './pages/LeaveManagement';
import Recruitment from './pages/Recruitment';
import Performance from './pages/Performance';
import Training from './pages/Training';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { ToastContainer } from './components/Toast'; 
import { STORAGE_KEYS } from './config/api.config'; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser]         = useState(null);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    // ✅ Use the same keys that Login.jsx saves
    const token    = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);  // 'jwtToken'
    const userJson = localStorage.getItem(STORAGE_KEYS.USER_DATA);  // 'userData'

    if (token && userJson) {
      try {
        const userData = JSON.parse(userJson);
        setIsAuthenticated(true);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        clearSession();
      }
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }

    setLoading(false);
  }, []);

  const clearSession = () => {
    // ✅ Remove every key we store — no key left behind
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    clearSession();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <Layout user={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard    user={currentUser} />} />
          <Route path="employees"   element={<Employees    user={currentUser} />} />
          <Route path="attendance"  element={<Attendance   user={currentUser} />} />
          <Route path="payroll"     element={<Payroll      user={currentUser} />} />
          <Route path="leaves"      element={<LeaveManagement user={currentUser} />} />
          <Route path="recruitment" element={<Recruitment  user={currentUser} />} />
          <Route path="performance" element={<Performance  user={currentUser} />} />
          <Route path="training"    element={<Training     user={currentUser} />} />
          <Route path="documents"   element={<Documents    user={currentUser} />} />
          <Route path="reports"     element={<Reports      user={currentUser} />} />
          <Route path="settings"    element={<Settings     user={currentUser} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;