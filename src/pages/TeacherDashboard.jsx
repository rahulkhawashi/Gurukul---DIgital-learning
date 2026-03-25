import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTeacherClasses } from '../services/classService';
import { FiPlus, FiUsers, FiBook, FiTarget, FiCopy, FiCheck, FiTrash2, FiRefreshCw, FiBarChart2, FiZap } from 'react-icons/fi';
import { createClass, deleteClass, regenerateCode } from '../services/classService';
import { formatDate } from '../utils/formatters';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadClasses();
  }, [user]);

  async function loadClasses() {
    if (!user?.uid) return;
    try {
      const data = await getTeacherClasses(user.uid);
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      await createClass(user.uid, newClassName.trim(), newSubject.trim());
      setNewClassName('');
      setNewSubject('');
      setShowCreate(false);
      await loadClasses();
    } catch (err) {
      console.error('Create class error:', err);
    }
    setCreating(false);
  }

  async function handleRegenerate(classId) {
    try {
      await regenerateCode(classId);
      await loadClasses();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(classId) {
    if (!confirm('Delete this class? This action cannot be undone.')) return;
    try {
      await deleteClass(classId);
      await loadClasses();
    } catch (err) {
      console.error(err);
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const totalStudents = classes.reduce((s, c) => s + (c.students?.length || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Manage your classes and track student progress</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(79, 70, 229, 0.15)', color: 'var(--primary)' }}>
            <FiBook />
          </div>
          <div className="stat-card-value">{classes.length}</div>
          <div className="stat-card-label">Active Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(74, 225, 118, 0.15)', color: 'var(--secondary)' }}>
            <FiUsers />
          </div>
          <div className="stat-card-value">{totalStudents}</div>
          <div className="stat-card-label">Total Students</div>
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
            <FiBarChart2 />
          </div>
          <div className="stat-card-value">—</div>
          <div className="stat-card-label">Avg Engagement</div>
        </div>
      </div>

      {/* Classes Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2>Your Classes</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <FiPlus /> Create Class
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Class</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label>Class Name</label>
                <input
                  className="input-field"
                  placeholder="e.g., Mathematics Grade 10"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label>Subject (Optional)</label>
                <input
                  className="input-field"
                  placeholder="e.g., Mathematics"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Class'}
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
          <div className="empty-state-icon">📚</div>
          <h3>No classes yet</h3>
          <p>Create your first class to get started with Gurukul</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <FiPlus /> Create Your First Class
          </button>
        </div>
      ) : (
        <div className="grid-auto">
          {classes.map((cls) => (
            <div key={cls.classId} className="card card-elevated" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--title-lg)', marginBottom: 'var(--space-1)' }}>{cls.className}</h3>
                  {cls.subject && <span className="badge badge-primary">{cls.subject}</span>}
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(cls.classId)} title="Delete">
                  <FiTrash2 size={14} />
                </button>
              </div>

              {/* Code */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--surface-container-lowest)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-4)',
              }}>
                <span className="label-sm" style={{ flex: 1 }}>Class Code</span>
                <span style={{
                  fontFamily: 'var(--font-headline)',
                  fontWeight: 800,
                  fontSize: 'var(--title-md)',
                  color: 'var(--primary)',
                  letterSpacing: '0.05em',
                }}>
                  {cls.classCode}
                </span>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => copyCode(cls.classCode)}
                  title="Copy code"
                >
                  {copiedCode === cls.classCode ? <FiCheck color="var(--secondary)" /> : <FiCopy size={14} />}
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => handleRegenerate(cls.classId)}
                  title="Regenerate code"
                >
                  <FiRefreshCw size={14} />
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
                <div>
                  <div style={{ fontSize: 'var(--headline-sm)', fontWeight: 700, fontFamily: 'var(--font-headline)' }}>
                    {cls.students?.length || 0}
                  </div>
                  <div className="label-sm">Students</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--headline-sm)', fontWeight: 700, fontFamily: 'var(--font-headline)', color: 'var(--secondary)' }}>
                    0
                  </div>
                  <div className="label-sm">Quests</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
