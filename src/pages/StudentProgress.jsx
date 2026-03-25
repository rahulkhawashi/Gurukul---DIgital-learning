import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToStudentClasses } from '../services/classService';
import { getAttendancePercentage } from '../services/attendanceService';
import { getStudentSubmissions, getClassAssignments, calculateStudentXP } from '../services/assignmentService';
import { getEngagementScore, getEngagementSuggestions, updateEngagementScore } from '../services/engagementService';
import { FiTrendingUp, FiCheckCircle, FiStar, FiActivity, FiRefreshCw } from 'react-icons/fi';
import '../styles/components.css';
import '../styles/pages.css';

export default function StudentProgress() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  const [attendancePercent, setAttendancePercent] = useState(100);
  const [xp, setXp] = useState(0);
  const [completedQuests, setCompletedQuests] = useState(0);
  const [engagement, setEngagement] = useState({ score: 0, breakdown: {} });
  const [suggestions, setSuggestions] = useState([]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubClasses = subscribeToStudentClasses(user.uid, (data) => {
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].classId);
      }
    });
    return () => unsubClasses();
  }, [user]);

  const loadData = async () => {
    if (!user || !selectedClass) return;
    setIsRefreshing(true);
    try {
      // 1. Attendance
      const attP = await getAttendancePercentage(user.uid, selectedClass);
      setAttendancePercent(attP);
      
      // 2. Quests / XP
      const assignments = await getClassAssignments(selectedClass);
      const subs = await getStudentSubmissions(user.uid, selectedClass);
      const earnedXp = calculateStudentXP(subs, assignments);
      setXp(earnedXp);
      setCompletedQuests(subs.length);
      
      const assignmentPercent = assignments.length > 0 
        ? Math.round((subs.length / assignments.length) * 100)
        : 100;

      // 3. Compute Engagement Score
      // To simulate chatbot/focus stats, we default to 50 for now
      const metrics = {
        attendancePercent: attP,
        assignmentPercent,
        focusPercent: 50,
        chatbotPercent: 50
      };
      
      const newScore = await updateEngagementScore(user.uid, selectedClass, metrics);
      
      // 4. Fetch stored
      const engData = await getEngagementScore(user.uid, selectedClass);
      setEngagement(engData);
      setSuggestions(getEngagementSuggestions(newScore));

    } catch (err) {
      console.error('Failed to load progress data:', err);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user, selectedClass]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--secondary)';
    if (score >= 60) return 'var(--primary)';
    if (score >= 40) return 'var(--tertiary)';
    return 'var(--error)';
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-sm)', marginBottom: 'var(--space-1)' }}>My Progress</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Track your performance and AI insights</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={loadData}
          disabled={isRefreshing}
        >
          <FiRefreshCw className={isRefreshing ? 'spin' : ''} style={{ marginRight: 8 }} />
          Refresh Stats
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <h3>No Classes Yet</h3>
          <p>Join a class from the Dashboard to see your progress.</p>
        </div>
      ) : (
        <>
          <div className="input-group" style={{ maxWidth: 300, marginBottom: 'var(--space-6)' }}>
            <label>Select Class</label>
            <select 
              className="input-field" 
              value={selectedClass || ''} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>
                  {c.className} ({c.teacherName})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            {/* XP Card */}
            <div className="card-elevated" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(239, 194, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiStar size={24} color="var(--tertiary)" />
              </div>
              <div>
                <div style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: 1 }}>Total XP</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>{xp}</div>
              </div>
            </div>

            {/* Attendance Card */}
            <div className="card-elevated" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(74, 225, 118, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCheckCircle size={24} color="var(--secondary)" />
              </div>
              <div>
                <div style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: 1 }}>Attendance</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>{attendancePercent}%</div>
              </div>
            </div>

            {/* Engagement Score Card */}
            <div className="card-elevated" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
               <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(79, 70, 229, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiActivity size={24} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: 1 }}>Engagement</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: getScoreColor(engagement.score) }}>{engagement.score}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)', gap: 'var(--space-6)' }}>
            
            <div className="card-elevated">
              <h3 style={{ fontSize: 'var(--title-md)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTrendingUp /> AI Insights for You
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {suggestions.map((suggestion, index) => (
                  <div key={index} style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--surface-container-high)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${getScoreColor(engagement.score)}`
                  }}>
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card-elevated" style={{ background: 'var(--primary-container)', color: 'var(--on-surface)' }}>
              <h3 style={{ fontSize: 'var(--title-md)', marginBottom: 'var(--space-4)' }}>Quest Stats</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span>Completed Quests</span>
                <span style={{ fontWeight: 600 }}>{completedQuests}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--space-3)' }}>
                <span>Completion Rate</span>
                <span style={{ fontWeight: 600 }}>{engagement.breakdown?.assignmentPercent || 0}%</span>
              </div>
              <p style={{ marginTop: 'var(--space-4)', fontSize: '0.85rem', opacity: 0.8 }}>
                Complete more quests on the Quest Board to boost your XP multiplier and engagement score.
              </p>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
