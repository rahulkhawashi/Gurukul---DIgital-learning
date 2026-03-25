import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome, FiBook, FiTarget, FiBarChart2, FiClock,
  FiMessageCircle, FiSettings, FiLogOut, FiUsers,
  FiClipboard, FiCalendar, FiZap, FiLayers
} from 'react-icons/fi';
import { getInitials } from '../../utils/formatters';
import '../../styles/pages.css';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const teacherLinks = [
    { to: '/teacher', icon: <FiHome />, label: 'Dashboard', end: true },
    { to: '/teacher/classes', icon: <FiLayers />, label: 'My Classes' },
    { to: '/teacher/materials', icon: <FiBook />, label: 'Materials' },
    { to: '/teacher/assignments', icon: <FiClipboard />, label: 'Assignments' },
    { to: '/teacher/attendance', icon: <FiCalendar />, label: 'Attendance' },
    { to: '/teacher/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
    { to: '/teacher/insights', icon: <FiZap />, label: 'AI Insights' },
  ];

  const studentLinks = [
    { to: '/student', icon: <FiHome />, label: 'Dashboard', end: true },
    { to: '/student/classes', icon: <FiLayers />, label: 'My Classes' },
    { to: '/student/hub', icon: <FiBook />, label: 'Learning Hub' },
    { to: '/student/quests', icon: <FiTarget />, label: 'Quests' },
    { to: '/student/focus', icon: <FiClock />, label: 'Focus Timer' },
    { to: '/student/progress', icon: <FiBarChart2 />, label: 'My Progress' },
  ];

  const links = role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">🎓</div>
        <div className="sidebar-brand">
          <h2>Gurukul</h2>
          <span>Digital Learning</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">
          {role === 'teacher' ? 'Teaching' : 'Learning'}
        </div>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-container)',
          marginBottom: 'var(--space-2)',
        }}>
          <div className="avatar avatar-sm">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{
                width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
              }} />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              fontSize: 'var(--body-sm)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              fontSize: 'var(--label-sm)',
              color: 'var(--on-surface-variant)',
              textTransform: 'capitalize',
            }}>
              {role}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="sidebar-link"
          style={{ width: '100%', color: 'var(--error)', border: 'none', cursor: 'pointer' }}
        >
          <span className="sidebar-link-icon"><FiLogOut /></span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
