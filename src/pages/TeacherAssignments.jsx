import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToTeacherClasses } from '../services/classService';
import { subscribeToAssignments, createAssignment, deleteAssignment } from '../services/assignmentService';
import { FiPlus, FiTarget, FiCalendar, FiStar, FiTrash2 } from 'react-icons/fi';
import '../styles/components.css';
import '../styles/pages.css';

export default function TeacherAssignments() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assignments, setAssignments] = useState([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newXp, setNewXp] = useState(50);
  const [newDeadline, setNewDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubClasses = subscribeToTeacherClasses(user.uid, (data) => {
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
    return () => unsubAssignments();
  }, [selectedClass]);

  async function handleCreateQuest(e) {
    e.preventDefault();
    if (!selectedClass || !newTitle) return;
    
    setIsSubmitting(true);
    try {
      await createAssignment(selectedClass, {
        title: newTitle,
        description: newDesc,
        xp: Number(newXp),
        deadline: newDeadline ? new Date(newDeadline) : null,
      });
      
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewXp(50);
      setNewDeadline('');
    } catch (err) {
      console.error('Error creating assignment:', err);
      alert('Failed to create assignment');
    }
    setIsSubmitting(false);
  }

  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this quest?')) {
      try {
        await deleteAssignment(id);
      } catch (err) {
        console.error('Error deleting assignment:', err);
      }
    }
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-sm)', marginBottom: 'var(--space-1)' }}>Quest Manager</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Create assignments and reward XP</p>
        </div>
        
        {classes.length > 0 && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <FiPlus style={{ marginRight: 8 }} />
            Create Quest
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No Classes Yet</h3>
          <p>Create a class from the Dashboard first to assign quests.</p>
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
                  {c.className} ({c.classCode})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {assignments.length === 0 ? (
              <div className="empty-state" style={{ minHeight: '30vh' }}>
                <p>No quests created for this class yet.</p>
              </div>
            ) : (
              assignments.map(quest => (
                <div key={quest.id} className="card-elevated" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                    <div style={{ padding: 'var(--space-3)', background: 'rgba(239, 194, 0, 0.15)', borderRadius: 'var(--radius-md)' }}>
                      <FiTarget size={24} color="var(--tertiary)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--title-md)', marginBottom: 'var(--space-1)' }}>{quest.title}</h3>
                      <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)' }}>
                        {quest.description || 'No description provided.'}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--tertiary)', fontWeight: 600 }}>
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
                  
                  <button 
                    onClick={() => handleDelete(quest.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 8, borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
                    title="Delete Quest"
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 180, 171, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Create Quest Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 'var(--title-lg)', ...{ marginBottom: 'var(--space-6)' }}}>Create New Quest</h2>
            <form onSubmit={handleCreateQuest}>
              <div className="input-group">
                <label>Quest Title *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="e.g. Complete Algebra Worksheet"
                  required 
                />
              </div>
              <div className="input-group">
                <label>Description (Optional)</label>
                <textarea 
                  className="input-field" 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Instructions for the quest..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>XP Reward *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={newXp} 
                    onChange={e => setNewXp(e.target.value)} 
                    min="10"
                    max="500"
                    step="10"
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Deadline (Optional)</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={newDeadline} 
                    onChange={e => setNewDeadline(e.target.value)} 
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'var(--surface-container-high)' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Create Quest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
