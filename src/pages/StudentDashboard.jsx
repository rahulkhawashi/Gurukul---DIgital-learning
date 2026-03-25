import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStudentClasses, joinClass } from '../services/classService';
import { FiPlus, FiBook, FiTarget, FiClock, FiStar, FiTrendingUp } from 'react-icons/fi';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    loadClasses();
  }, [user]);

  async function loadClasses() {
    if (!user?.uid) return;
    try {
      const data = await getStudentClasses(user.uid);
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!classCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      await joinClass(user.uid, classCode.trim().toUpperCase());
      setClassCode('');
      setShowJoin(false);
      await loadClasses();
    } catch (err) {
      setJoinError(err.message);
    }
    setJoining(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Hey, {user?.name?.split(' ')[0]} 🚀</h1>
        <p>Your learning journey continues</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(79, 70, 229, 0.15)', color: 'var(--primary)' }}>
            <FiBook />
          </div>
          <div className="stat-card-value">{classes.length}</div>
          <div className="stat-card-label">Enrolled Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(74, 225, 118, 0.15)', color: 'var(--secondary)' }}>
            <FiStar />
          </div>
          <div className="stat-card-value">0</div>
          <div className="stat-card-label">Total XP</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239, 194, 0, 0.15)', color: 'var(--tertiary)' }}>
            <FiTarget />
          </div>
          <div className="stat-card-value">0</div>
          <div className="stat-card-label">Active Quests</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(195, 192, 255, 0.15)', color: 'var(--primary)' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-card-value">—</div>
          <div className="stat-card-label">Engagement</div>
        </div>
      </div>

      {/* Classes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2>Your Classes</h2>
        <button className="btn btn-primary" onClick={() => setShowJoin(true)}>
          <FiPlus /> Join Class
        </button>
      </div>

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Join a Class</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowJoin(false)}>✕</button>
            </div>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--on-surface-variant)' }}>
              Enter the class code shared by your teacher
            </p>
            {joinError && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--body-sm)',
                background: 'rgba(255, 180, 171, 0.1)',
                color: 'var(--error)',
              }}>
                {joinError}
              </div>
            )}
            <form onSubmit={handleJoin}>
              <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label>Class Code</label>
                <input
                  className="input-field"
                  placeholder="e.g., GKL-8X2P"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: 'var(--title-lg)',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={joining}>
                  {joining ? 'Joining...' : 'Join Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Cards */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '200px' }}>
          <div className="spinner" />
        </div>
      ) : classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎒</div>
          <h3>No classes joined yet</h3>
          <p>Ask your teacher for a class code and join to get started</p>
          <button className="btn btn-primary" onClick={() => setShowJoin(true)}>
            <FiPlus /> Join Your First Class
          </button>
        </div>
      ) : (
        <div className="grid-auto">
          {classes.map((cls) => (
            <div key={cls.classId} className="card card-elevated">
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--space-1)' }}>{cls.className}</h3>
                {cls.subject && <span className="badge badge-primary">{cls.subject}</span>}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: 'var(--title-md)', fontWeight: 700, fontFamily: 'var(--font-headline)', color: 'var(--secondary)' }}>0</div>
                  <div className="label-sm">XP Earned</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--title-md)', fontWeight: 700, fontFamily: 'var(--font-headline)' }}>0</div>
                  <div className="label-sm">Quests</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--title-md)', fontWeight: 700, fontFamily: 'var(--font-headline)' }}>{cls.students?.length || 0}</div>
                  <div className="label-sm">Classmates</div>
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '0%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
