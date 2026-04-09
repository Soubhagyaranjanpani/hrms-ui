import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaChartLine, FaUsers, FaCalendarAlt, FaShieldAlt, FaRocket, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { toast } from '../components/Toast';
import ariHrmsLogo from '../assets/ARI-HRMS-logo.png';

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
    <div className="min-vh-100 position-relative overflow-hidden" style={{ background: 'linear-gradient(140deg, #fff7ed 0%, #fff1f2 50%, #fdf2f8 100%)' }}>
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="position-absolute rounded-circle" style={{ width: '520px', height: '520px', background: 'radial-gradient(circle, rgba(190,24,93,0.10) 0%, transparent 70%)', top: '-240px', right: '-160px', animation: 'float 22s ease-in-out infinite' }} />
        <div className="position-absolute rounded-circle" style={{ width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', bottom: '-180px', left: '-130px', animation: 'float 18s ease-in-out infinite reverse' }} />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0,0) rotate(0deg); }
          50% { transform: translate(26px,-20px) rotate(4deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-animate { animation: fadeUp .55s ease-out; }
        .lp-nav {
          backdrop-filter: blur(10px);
          background: rgba(255,255,255,.65);
          border: 1px solid rgba(255,255,255,.6);
          border-radius: 16px;
          box-shadow: 0 10px 28px rgba(30, 41, 59, .08);
        }
        .lp-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          background: rgba(157,23,77,.10);
          color: #9d174d;
          border: 1px solid rgba(157,23,77,.25);
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .02em;
        }
        .lp-heading {
          color: #4a102a;
          line-height: 1.1;
          letter-spacing: -.02em;
          font-weight: 800;
          margin: 14px 0 14px;
          font-size: clamp(1.9rem, 4vw, 3.2rem);
        }
        .lp-sub {
          color: #64748b;
          font-size: 1rem;
          max-width: 620px;
        }
        .lp-stat {
          background: rgba(255,255,255,.8);
          border: 1px solid rgba(255,255,255,.9);
          border-radius: 14px;
          padding: 14px 16px;
          box-shadow: 0 6px 20px rgba(15,23,42,.06);
        }
        .lp-stat .v { color: #4a102a; font-weight: 800; font-size: 1.05rem; }
        .lp-stat .l { color: #64748b; font-size: .8rem; }
        .lp-card {
          background: rgba(255,255,255,.92);
          border: 1px solid rgba(255,255,255,.95);
          border-radius: 22px;
          box-shadow: 0 18px 48px rgba(15,23,42,.12);
          backdrop-filter: blur(12px);
        }
        .lp-input:focus {
          box-shadow: 0 0 0 4px rgba(190,24,93,.15) !important;
          border-color: #be185d !important;
        }
        .lp-cta {
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #9d174d 0%, #be185d 100%);
          color: #fff;
          font-weight: 700;
          transition: all .2s ease;
        }
        .lp-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(190,24,93,.35); }
        .lp-mini {
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(255,255,255,.95);
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 8px 22px rgba(15,23,42,.06);
          height: 100%;
        }
        .lp-logo-wrap {
          background: rgba(255,255,255,.98);
          border-radius: 14px;
          padding: 0;
        }
        .lp-logo-img {
          width: min(360px, 44vw);
          min-width: 220px;
          height: auto;
          display: block;
          filter: contrast(1.12) saturate(1.08);
          border-radius: 8px;
        }
        @media (max-width: 768px) {
          .lp-logo-img {
            width: min(260px, 62vw);
            min-width: 170px;
          }
        }
      `}</style>

      <div className="container py-3 py-md-4 position-relative" style={{ zIndex: 1 }}>
        <div className="lp-nav px-3 px-md-4 py-1 py-md-1 d-flex align-items-center justify-content-between lp-animate">
          <div className="d-flex align-items-center">
            <div className="lp-logo-wrap">
              <img src={ariHrmsLogo} alt="ARI-HRMS" className="lp-logo-img" />
            </div>
          </div>
          <div className="d-none d-md-flex align-items-center gap-4" style={{ color: '#475569', fontWeight: 600, fontSize: 14 }}>
            <span>Home</span>
            <span>Features</span>
            <span>Solutions</span>
            <span>Support</span>
          </div>
        </div>

        <div className="row g-4 g-lg-5 align-items-center mt-2 mt-lg-3">
          <div className="col-lg-7 lp-animate">
            <span className="lp-chip"><FaRocket size={12} /> Smart Workforce Portal</span>
            <h1 className="lp-heading">Operate your entire HR workflow from one modern portal.</h1>
            <p className="lp-sub">
              Manage people, attendance, leave, payroll, and analytics with a clean enterprise experience built for speed, control, and visibility.
            </p>

            <div className="d-flex flex-wrap gap-3 mt-4">
              <div className="lp-stat"><div className="v">98.4%</div><div className="l">Attendance Accuracy</div></div>
              <div className="lp-stat"><div className="v">4x Faster</div><div className="l">Approval Workflows</div></div>
              <div className="lp-stat"><div className="v">24/7</div><div className="l">Self-Service Access</div></div>
            </div>

            <div className="row g-3 mt-2">
              <div className="col-sm-4">
                <div className="lp-mini">
                  <FaUsers style={{ color: '#9d174d' }} />
                  <div className="mt-2 fw-bold" style={{ color: '#4a102a' }}>Employee Hub</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Unified profile, onboarding, and records.</div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="lp-mini">
                  <FaCalendarAlt style={{ color: '#9d174d' }} />
                  <div className="mt-2 fw-bold" style={{ color: '#4a102a' }}>Leave & Attendance</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Real-time status, approvals, and calendars.</div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="lp-mini">
                  <FaChartLine style={{ color: '#9d174d' }} />
                  <div className="mt-2 fw-bold" style={{ color: '#4a102a' }}>HR Analytics</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Actionable insights for better decisions.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5 lp-animate">
            <div className="lp-card p-4 p-md-5">
              <div className="d-flex align-items-center gap-2 mb-2">
                <FaShieldAlt style={{ color: '#9d174d' }} />
                <span style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>Secure Sign In</span>
              </div>
              <h3 className="mb-1" style={{ color: '#4a102a', fontWeight: 800 }}>Welcome back</h3>
              <p className="mb-4" style={{ color: '#64748b' }}>Sign in to continue to your dashboard</p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label fw-semibold mb-2" style={{ color: '#334155', fontSize: '0.9rem' }}>Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text border-end-0 bg-light" style={{ borderRadius: '12px 0 0 12px', borderColor: '#e2e8f0' }}>
                      <FaEnvelope className="text-secondary" size={15} />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 bg-light lp-input"
                      style={{ borderRadius: '0 12px 12px 0', borderColor: '#e2e8f0', padding: '11px 14px' }}
                      placeholder="employee@hrms.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label fw-semibold mb-2" style={{ color: '#334155', fontSize: '0.9rem' }}>Password</label>
                  <div className="input-group">
                    <span className="input-group-text border-end-0 bg-light" style={{ borderRadius: '12px 0 0 12px', borderColor: '#e2e8f0' }}>
                      <FaLock className="text-secondary" size={15} />
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0 bg-light lp-input"
                      style={{ borderRadius: 0, borderColor: '#e2e8f0', padding: '11px 14px' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="input-group-text border-start-0 bg-light"
                      style={{ borderRadius: '0 12px 12px 0', borderColor: '#e2e8f0', cursor: 'pointer' }}
                      onClick={() => setShowPass((p) => !p)}
                      tabIndex={-1}
                    >
                      {showPass ? <FaEyeSlash size={15} className="text-secondary" /> : <FaEye size={15} className="text-secondary" />}
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ cursor: 'pointer', borderColor: '#cbd5e1' }}
                    />
                    <label className="form-check-label small text-muted" htmlFor="remember" style={{ cursor: 'pointer' }}>Remember me</label>
                  </div>
                  <a href="#" className="small text-decoration-none" style={{ color: '#9d174d', fontWeight: 600 }}>Forgot password?</a>
                </div>

                <button type="submit" className="btn w-100 py-3 lp-cta" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Authenticating...
                    </>
                  ) : (
                    <span className="d-inline-flex align-items-center gap-2">Sign In <FaArrowRight size={12} /></span>
                  )}
                </button>
              </form>

              <div className="d-flex align-items-center gap-2 mt-4" style={{ fontSize: 12, color: '#64748b' }}>
                <FaCheckCircle style={{ color: '#15803d' }} />
                Trusted by HR teams for secure and reliable operations
              </div>

              <div className="mt-3 text-center" style={{ fontSize: 12, color: '#64748b' }}>
                Demo: <span style={{ color: '#9d174d', fontWeight: 700 }}>employee@hrms.com</span> / <span style={{ color: '#9d174d', fontWeight: 700 }}>password</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;