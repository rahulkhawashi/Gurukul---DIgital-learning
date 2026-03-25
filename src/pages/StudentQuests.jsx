import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToStudentClasses } from '../services/classService';
import { subscribeToAssignments, submitAssignment, getStudentSubmissions } from '../services/assignmentService';
import { FiTarget, FiCalendar, FiStar, FiCheckCircle } from 'react-icons/fi';
import '../styles/components.css';
import '../styles/pages.css';

export default function StudentQuests() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submittingIds, setSubmittingIds] = useState(new Set());

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

  useEffect(() => {
    if (!selectedClass) {
      setAssignments([]);
      return;
    }
    const unsubAssignments = subscribeToAssignments(selectedClass, setAssignments);
    
    // Fetch user's submissions for this class
    const fetchSubmissions = async () => {
      if (user && selectedClass) {
        const subs = await getStudentSubmissions(user.uid, selectedClass);
        setSubmissions(subs);
      }
    };
    fetchSubmissions();
    
    return () => unsubAssignments();
  }, [selectedClass, user]);

  async function handleCompleteQuest(assignmentId) {
    if (!user) return;
    
    setSubmittingIds(prev => new Set(prev).add(assignmentId));
    try {
      await submitAssignment(assignmentId, user.uid, { answer: 'Completed' });
      // Refresh submissions
      const subs = await getStudentSubmissions(user.uid, selectedClass);
      setSubmissions(subs);
    } catch (err) {
      console.error('Failed to submit assignment:', err);
      alert('Failed to complete quest');
    }
    setSubmittingIds(prev => {
      const next = new Set(prev);
      next.delete(assignmentId);
      return next;
    });
  }

  const isCompleted = (assignmentId) => {
    return submissions.some(sub => sub.assignmentId === assignmentId);
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--headline-sm)', marginBottom: 'var(--space-1)' }}>Quest Board</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Complete assignments to earn XP</p>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No Classes Yet</h3>
          <p>Join a class from the Dashboard to access quests.</p>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
            {assignments.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1', minHeight: '30vh' }}>
                <p>No active quests in this class.</p>
              </div>
            ) : (
              assignments.map(quest => {
                const completed = isCompleted(quest.id);
                const isSubmitting = submittingIds.has(quest.id);
                
                return (
                  <div key={quest.id} className="card-elevated" style={{ 
                    display: 'flex', flexDirection: 'column',
                    opacity: completed ? 0.7 : 1,
                    border: completed ? '1px solid var(--secondary)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <div style={{ 
                        padding: 'var(--space-2)', 
                        background: completed ? 'rgba(74, 225, 118, 0.15)' : 'rgba(239, 194, 0, 0.15)', 
                        borderRadius: 'var(--radius-md)' 
                      }}>
                        {completed ? <FiCheckCircle size={24} color="var(--secondary)" /> : <FiTarget size={24} color="var(--tertiary)" />}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ fontSize: 'var(--title-md)', marginBottom: 2 }}>{quest.title}</h3>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: completed ? 'var(--secondary)' : 'var(--tertiary)', fontWeight: 600 }}>
                            <FiStar /> {quest.xp} XP
                          </span>
                          {quest.deadline && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiCalendar /> Due: {new Date(quest.deadline.seconds * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {quest.description && (
                      <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-4)', flexGrow: 1 }}>
                        {quest.description}
                      </p>
                    )}
                    
                    <button 
                      onClick={() => handleCompleteQuest(quest.id)}
                      disabled={completed || isSubmitting}
                      className={`btn ${completed ? '' : 'btn-primary'}`}
                      style={{ 
                        marginTop: 'auto', 
                        width: '100%',
                        background: completed ? 'var(--surface-container-high)' : '',
                        color: completed ? 'var(--secondary)' : ''
                      }}
                    >
                      {completed ? (
                        <><FiCheckCircle style={{ marginRight: 8 }} /> Quest Completed</>
                      ) : isSubmitting ? (
                        'Submitting...'
                      ) : (
                        'Complete Quest'
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
