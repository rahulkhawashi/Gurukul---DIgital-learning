import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LuGraduationCap } from 'react-icons/lu';
import { HiOutlineAcademicCap } from 'react-icons/hi2';

export default function RoleSelection() {
  const [loading, setLoading] = useState(false);
  const { selectRole, user } = useAuth();
  const navigate = useNavigate();

  async function handleSelect(role) {
    setLoading(true);
    try {
      await selectRole(role);
      navigate(role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      console.error('Role selection error:', err);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-container animate-slide-up" style={{ maxWidth: 560 }}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo" style={{ justifyContent: 'center' }}>
            <div className="auth-logo-icon">🎓</div>
          </div>

          <h1 style={{ fontSize: 'var(--headline-md)', marginBottom: 'var(--space-2)' }}>
            Welcome, {user?.name || 'there'}!
          </h1>
          <p style={{ marginBottom: 'var(--space-8)' }}>
            Choose your role to get started
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-6)',
          }}>
            <button
              onClick={() => handleSelect('student')}
              disabled={loading}
              className="card-elevated"
              style={{
                cursor: 'pointer',
                padding: 'var(--space-8) var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)',
                border: 'none',
                background: 'var(--surface-container-high)',
                borderRadius: 'var(--radius-xl)',
                transition: 'all var(--transition-base)',
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
              <h3 style={{ fontSize: 'var(--title-lg)' }}>Student</h3>
              <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>
                Join classes, complete quests, and level up your knowledge
              </p>
            </button>

            <button
              onClick={() => handleSelect('teacher')}
              disabled={loading}
              className="card-elevated"
              style={{
                cursor: 'pointer',
                padding: 'var(--space-8) var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)',
                border: 'none',
                background: 'var(--surface-container-high)',
                borderRadius: 'var(--radius-xl)',
                transition: 'all var(--transition-base)',
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
              <h3 style={{ fontSize: 'var(--title-lg)' }}>Teacher</h3>
              <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>
                Create classes, manage students, and gain AI-powered insights
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
