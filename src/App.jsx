import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import RoleSelection from './pages/RoleSelection';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import FocusTimer from './pages/FocusTimer';
import Analytics from './pages/Analytics';
import Sidebar from './components/common/Sidebar';
import ChatBot from './components/chat/ChatBot';
import TeacherMaterials from './pages/TeacherMaterials';
import TeacherAssignments from './pages/TeacherAssignments';
import StudentHub from './pages/StudentHub';
import StudentQuests from './pages/StudentQuests';
import StudentProgress from './pages/StudentProgress';
import TeacherAttendance from './pages/TeacherAttendance';
import SeedData from './pages/SeedData';
import './index.css';
import './styles/components.css';
import './styles/pages.css';

function ProtectedRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--on-surface-variant)' }}>Loading Gurukul...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/landing" />;
  if (!role) return <Navigate to="/select-role" />;
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'teacher' ? '/teacher' : '/student'} />;
  }

  return children;
}

function AppLayout({ children }) {
  const { role } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        {children}
      </main>
      <ChatBot />
    </div>
  );
}

function AuthRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/landing" />;
  if (!role) return <Navigate to="/select-role" />;
  return <Navigate to={role === 'teacher' ? '/teacher' : '/student'} />;
}

function ComingSoon({ title }) {
  return (
    <div className="page">
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon">🚧</div>
        <h3>{title}</h3>
        <p>This feature is coming soon!</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/select-role" element={<RoleSelection />} />

          {/* Root Redirect */}
          <Route path="/" element={<AuthRedirect />} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRole="teacher">
              <AppLayout><TeacherDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/classes" element={
            <ProtectedRoute allowedRole="teacher">
              <AppLayout><TeacherDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/materials" element={
            <ProtectedRoute allowedRole="teacher">
              <AppLayout><TeacherMaterials /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/assignments" element={
            <ProtectedRoute allowedRole="teacher">
              <AppLayout><TeacherAssignments /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/attendance" element={
            <ProtectedRoute allowedRole="teacher">
              <AppLayout><TeacherAttendance /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/analytics" element={
            <ProtectedRoute allowedRole="teacher">
              <AppLayout><Analytics /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/insights" element={
            <ProtectedRoute allowedRole="teacher">
              <AppLayout><Analytics /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/seed" element={
            <ProtectedRoute allowedRole="teacher">
               <AppLayout><SeedData /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRole="student">
              <AppLayout><StudentDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/classes" element={
            <ProtectedRoute allowedRole="student">
              <AppLayout><StudentDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/hub" element={
            <ProtectedRoute allowedRole="student">
              <AppLayout><StudentHub /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/quests" element={
            <ProtectedRoute allowedRole="student">
              <AppLayout><StudentQuests /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/focus" element={
            <ProtectedRoute allowedRole="student">
              <AppLayout><FocusTimer /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/progress" element={
            <ProtectedRoute allowedRole="student">
              <AppLayout><StudentProgress /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
