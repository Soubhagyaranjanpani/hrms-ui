import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaBuilding, FaChartLine, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast } from '../components/Toast';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.warning('Missing field', 'Please enter your email address.');
      return;
    }
    if (!password) {
      toast.warning('Missing field', 'Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== 200) {
        if (res.status === 401 || (data.message || '').toLowerCase().includes('bad credentials')) {
          toast.error('Login failed', 'Invalid email or password. Please try again.');
        } else if (res.status === 403) {
          toast.error('Access denied', 'Your account may be inactive. Contact admin.');
        } else if (res.status >= 500) {
          toast.error('Server error', 'Something went wrong on our end. Please try again.');
        } else {
          toast.error('Login failed', data.message || 'An unexpected error occurred.');
        }
        return;
      }

      const { jwtToken, username, employeeId, roleName } = data.response;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, jwtToken);
      localStorage.setItem(STORAGE_KEYS.EMPLOYEE_ID, employeeId);
      localStorage.setItem(STORAGE_KEYS.USERNAME, username);
      
      // Save role directly from API response (no fallback)
      if (roleName) {
        localStorage.setItem(STORAGE_KEYS.ROLE, roleName.toUpperCase());
      }

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
      }

      // Create user data object
      const userData = {
        id: employeeId,
        email: username,
        name: username.split('@')[0],
        role: roleName ? roleName.toUpperCase() : null,
        avatar: username[0].toUpperCase(),
        jwtToken,
      };
      
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

      console.log('Role saved from API:', localStorage.getItem(STORAGE_KEYS.ROLE));

      onLogin(userData);
      navigate('/dashboard');
      setTimeout(() => toast.success('Welcome back!', `Logged in as ${userData.name}`), 100);
      
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Network error', 'Unable to reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{
      background: 'linear-gradient(145deg, #f8fafc 0%, #eef2ff 50%, #f1f5f9 100%)'
    }}>
      {/* Animated background shapes */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="position-absolute rounded-circle" style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          top: '-200px',
          right: '-150px',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <div className="position-absolute rounded-circle" style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)',
          bottom: '-150px',
          left: '-100px',
          animation: 'float 18s ease-in-out infinite reverse'
        }} />
        <div className="position-absolute rounded-circle" style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
          top: '40%',
          right: '20%',
          animation: 'pulse 15s ease-in-out infinite'
        }} />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, -20px) rotate(5deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .input-focus-ring:focus {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
          border-color: #6366f1;
        }
        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -60%;
          width: 200%;
          height: 200%;
          background: linear-gradient(115deg, rgba(255,255,255,0) 10%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 90%);
          transform: rotate(25deg);
          animation: shimmer 3s infinite;
        }
      `}</style>

      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-lg-10 col-md-12">
            <div className="row g-0 shadow-xxl rounded-4 overflow-hidden animate-slide-up">
              
              {/* Left Panel - Branding & Features */}
              <div className="col-lg-6 d-none d-lg-block p-5" style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
                color: 'white'
              }}>
                <div className="d-flex flex-column h-100">
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="rounded-3 p-2 d-inline-flex align-items-center justify-content-center" style={{
                        width: '44px',
                        height: '44px',
                        background: '#ffffff',
                        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.18)'
                      }}>
                        <FaBuilding size={24} style={{ color: '#4f46e5' }} />
                      </div>
                      <h2 className="fw-bold mb-0 text-white" style={{ letterSpacing: '-0.5px' }}>HRNexus</h2>
                    </div>
                    <p className="text-white-50 mb-0">Enterprise Human Resource Management System</p>
                  </div>

                  <div className="mt-auto">
                    <div className="mb-4">
                      <div className="bg-white bg-opacity-10 rounded-3 p-3 mb-3">
                        <FaChartLine className="mb-2" size={24} />
                        <p className="mb-0 small text-white-70">Streamline your HR operations with powerful analytics and insights</p>
                      </div>
                      <div className="bg-white bg-opacity-10 rounded-3 p-3 mb-3">
                        <FaUsers className="mb-2" size={24} />
                        <p className="mb-0 small text-white-70">Manage employees, attendance, and payroll all in one place</p>
                      </div>
                      <div className="bg-white bg-opacity-10 rounded-3 p-3">
                        <FaCalendarAlt className="mb-2" size={24} />
                        <p className="mb-0 small text-white-70">Track leaves, holidays, and performance seamlessly</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-top border-white border-opacity-10">
                      <div className="d-flex gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-white bg-opacity-20 rounded-circle" style={{ width: '6px', height: '6px' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Login Form */}
              <div className="col-lg-6 bg-white p-4 p-md-5" style={{ background: '#ffffff' }}>
                <div className="text-center mb-4 d-lg-none">
                  <div className="d-inline-flex align-items-center justify-content-center bg-gradient rounded-3 p-2 mb-2" style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  }}>
                    <FaBuilding size={24} className="text-white" />
                  </div>
                  <h3 className="fw-bold mb-1" style={{ color: '#1e1b4b' }}>HRNexus</h3>
                </div>

                <div className="text-center mb-5">
                  <h2 className="fw-bold mb-2" style={{ color: '#1e1b4b', letterSpacing: '-0.5px' }}>Welcome back</h2>
                  <p className="text-muted mb-0">Sign in to access your HR dashboard</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2" style={{ color: '#334155', fontSize: '0.9rem' }}>
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text border-end-0 bg-light" style={{ borderRadius: '14px 0 0 14px', borderColor: '#e2e8f0' }}>
                        <FaEnvelope className="text-secondary" size={16} />
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 bg-light input-focus-ring"
                        style={{ borderRadius: '0 14px 14px 0', borderColor: '#e2e8f0', padding: '12px 16px' }}
                        placeholder="employee@hrms.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold mb-2" style={{ color: '#334155', fontSize: '0.9rem' }}>
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text border-end-0 bg-light" style={{ borderRadius: '14px 0 0 14px', borderColor: '#e2e8f0' }}>
                        <FaLock className="text-secondary" size={16} />
                      </span>
                      <input
                        type={showPass ? 'text' : 'password'}
                        className="form-control border-start-0 border-end-0 bg-light input-focus-ring"
                        style={{ borderRadius: 0, borderColor: '#e2e8f0', padding: '12px 16px' }}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="input-group-text border-start-0 bg-light"
                        style={{ borderRadius: '0 14px 14px 0', borderColor: '#e2e8f0', cursor: 'pointer' }}
                        onClick={() => setShowPass((p) => !p)}
                        tabIndex={-1}
                      >
                        {showPass ? <FaEyeSlash size={16} className="text-secondary" /> : <FaEye size={16} className="text-secondary" />}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ cursor: 'pointer', borderColor: '#cbd5e1' }}
                      />
                      <label className="form-check-label small text-muted" htmlFor="remember" style={{ cursor: 'pointer' }}>
                        Remember me
                      </label>
                    </div>
                    <a href="#" className="small text-decoration-none" style={{ color: '#6366f1', fontWeight: 500 }}>
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 py-3 fw-semibold btn-shine"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      border: 'none',
                      borderRadius: '14px',
                      color: 'white',
                      fontSize: '0.95rem',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Authenticating...
                      </>
                    ) : 'Sign In'}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="small text-muted mb-0">
                    Demo: <span className="fw-medium" style={{ color: '#6366f1' }}>employee@hrms.com</span> / <span className="fw-medium" style={{ color: '#6366f1' }}>password</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 text-center d-lg-none">
                  <div className="d-flex justify-content-center gap-4 text-muted small">
                    <span>Analytics</span>
                    <span>•</span>
                    <span>Employees</span>
                    <span>•</span>
                    <span>Payroll</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;