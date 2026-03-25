import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { LuGraduationCap } from 'react-icons/lu';
import '../styles/components.css';
import '../styles/pages.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'student');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Wait for useEffect to navigate once user state is populated
    } catch (err) {
      const msg = err.message || err.code || 'Something went wrong';
      setError(msg.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]*\)\.?/g, '').trim() || msg);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(role);
      // Wait for useEffect
    } catch (err) {
      const msg = err.message || err.code || 'Something went wrong';
      setError(msg.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]*\)\.?/g, '').trim() || msg);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-container animate-slide-up">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🎓</div>
            <div>
              <h2 style={{ fontSize: 'var(--title-lg)', fontWeight: 800 }}>Gurukul</h2>
              <span className="label-sm">Digital Learning</span>
            </div>
          </div>

          <h1 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--space-2)' }}>Welcome back</h1>
          <p style={{ marginBottom: 'var(--space-6)' }}>Sign in to continue your learning journey</p>

          {error && (
            <div className="badge-danger" style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--body-sm)',
              background: 'rgba(255, 180, 171, 0.1)',
            }}>
              {error}
            </div>
          )}

          {/* Role Toggle */}
          <div className="input-group" style={{ marginBottom: 'var(--space-2)' }}>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-toggle-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => setRole('student')}
              >
                <LuGraduationCap style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Student
              </button>
              <button
                type="button"
                className={`role-toggle-btn ${role === 'teacher' ? 'active' : ''}`}
                onClick={() => setRole('teacher')}
              >
                <HiOutlineAcademicCap style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Teacher
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.1rem'
                }} />
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.1rem'
                }} />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--outline)',
                    cursor: 'pointer', background: 'none', border: 'none',
                  }}
                >
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : `Sign In as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            id="google-login"
            className="btn-google"
            onClick={handleGoogle}
            disabled={loading}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to={`/register?role=${role}`}>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
