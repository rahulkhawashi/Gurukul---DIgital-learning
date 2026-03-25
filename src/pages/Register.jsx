import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { LuGraduationCap } from 'react-icons/lu';
import '../styles/components.css';
import '../styles/pages.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'student');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, register, selectRole, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      await selectRole(role);
      // Wait for useEffect
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

          <h1 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--space-2)' }}>Create Account</h1>
          <p style={{ marginBottom: 'var(--space-6)' }}>Start your intelligent learning journey</p>

          {error && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--body-sm)',
              background: 'rgba(255, 180, 171, 0.1)',
              color: 'var(--error)',
            }}>
              {error}
            </div>
          )}

          {/* Role Toggle */}
          <div className="input-group" style={{ marginBottom: 'var(--space-2)' }}>
            <label>I am a</label>
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
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.1rem',
                }} />
                <input
                  id="register-name"
                  type="text"
                  className="input-field"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.1rem',
                }} />
                <input
                  id="register-email"
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
                  transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.1rem',
                }} />
                <input
                  id="register-password"
                  type={showPw ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Min. 6 characters"
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
              id="register-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : `Create ${role === 'teacher' ? 'Teacher' : 'Student'} Account`}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            id="google-register"
            className="btn-google"
            onClick={handleGoogle}
            disabled={loading}
          >
            <FcGoogle size={20} />
            Sign up with Google
          </button>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
