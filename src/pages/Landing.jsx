import { Link, useNavigate } from 'react-router-dom';
import { LuGraduationCap } from 'react-icons/lu';
import { HiOutlineAcademicCap } from 'react-icons/hi2';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-container animate-slide-up" style={{ maxWidth: 600 }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo" style={{ justifyContent: 'center' }}>
            <div className="auth-logo-icon">🎓</div>
          </div>

          <h1 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--space-2)' }}>
            Welcome to Gurukul
          </h1>
          <p style={{ marginBottom: 'var(--space-8)' }}>
            Digital Learning Platform. Please select your portal to continue.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}>
            <button
              onClick={() => navigate('/login?role=student')}
              className="card-elevated"
              style={{
                cursor: 'pointer',
                padding: 'var(--space-8) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)',
                border: 'none',
                background: 'var(--surface-container-high)',
                borderRadius: 'var(--radius-xl)',
                transition: 'all var(--transition-base)',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 64, height: 64,
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(79, 70, 229, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LuGraduationCap size={32} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: 'var(--title-md)' }}>Student Portal</h3>
              <span className="btn btn-primary" style={{ marginTop: 'auto', width: '100%', pointerEvents: 'none' }}>
                Log In as Student
              </span>
            </button>

            <button
              onClick={() => navigate('/login?role=teacher')}
              className="card-elevated"
              style={{
                cursor: 'pointer',
                padding: 'var(--space-8) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)',
                border: 'none',
                background: 'var(--surface-container-high)',
                borderRadius: 'var(--radius-xl)',
                transition: 'all var(--transition-base)',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 64, height: 64,
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(74, 225, 118, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HiOutlineAcademicCap size={32} color="var(--secondary)" />
              </div>
              <h3 style={{ fontSize: 'var(--title-md)' }}>Teacher Portal</h3>
              <span className="btn btn-primary" style={{ marginTop: 'auto', width: '100%', background: 'var(--secondary)', color: 'black', pointerEvents: 'none' }}>
                Log In as Teacher
              </span>
            </button>
          </div>

          <div className="auth-footer" style={{ marginTop: 0 }}>
            Don't have an account?{' '}
            <Link to="/register">Create one here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
