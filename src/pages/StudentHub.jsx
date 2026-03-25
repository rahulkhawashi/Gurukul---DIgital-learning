import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToStudentClasses } from '../services/classService';
import { subscribeToMaterials, detectMaterialType } from '../services/materialService';
import { reportConfusion } from '../services/heatmapService';
import { FiLink, FiVideo, FiFileText, FiImage, FiExternalLink, FiHelpCircle } from 'react-icons/fi';
import '../styles/components.css';
import '../styles/pages.css';

export default function StudentHub() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [reportingFor, setReportingFor] = useState(null); // stores material id to show the 🔴🟡🟢 popup

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
      setMaterials([]);
      return;
    }
    const unsubMaterials = subscribeToMaterials(selectedClass, setMaterials);
    return () => unsubMaterials();
  }, [selectedClass]);

  const getIconForType = (type) => {
    switch (type) {
      case 'video': return <FiVideo size={20} color="var(--primary)" />;
      case 'pdf': return <FiFileText size={20} color="var(--tertiary)" />;
      case 'image': return <FiImage size={20} color="var(--secondary)" />;
      default: return <FiLink size={20} color="var(--outline)" />;
    }
  };

  async function handleReport(topic, level, matId) {
    try {
      await reportConfusion(selectedClass, topic, level);
      setReportingFor(null);
      // Optional: show a small toast "Reported!"
    } catch(err) {
      console.error(err);
    }
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--headline-sm)', marginBottom: 'var(--space-1)' }}>Learning Hub</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Access materials shared by your teachers</p>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No Classes Yet</h3>
          <p>Join a class from the Dashboard to access learning materials.</p>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            {materials.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1', minHeight: '30vh' }}>
                <p>No materials shared in this class yet.</p>
              </div>
            ) : (
              materials.map(mat => (
                <div key={mat.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div style={{ padding: 'var(--space-2)', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', marginRight: 'var(--space-4)' }}>
                      {getIconForType(mat.type)}
                    </div>
                    <h3 style={{ fontSize: 'var(--title-md)', marginTop: 4 }}>{mat.title}</h3>
                  </div>
                  
                  {mat.description && (
                    <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-3)', flexGrow: 1 }}>
                      {mat.description}
                    </p>
                  )}
                  
                  {mat.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-4)' }}>
                      {mat.tags.map(tag => (
                        <span key={tag} className="badge" style={{ background: 'var(--surface-container-high)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {reportingFor === mat.id ? (
                      <div className="animate-fade-in" style={{ 
                        display: 'flex', justifyContent: 'space-between', 
                        background: 'var(--surface-container-highest)', 
                        padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)' 
                      }}>
                        <button onClick={() => handleReport(mat.title, 100, mat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="High confusion">🔴</button>
                        <button onClick={() => handleReport(mat.title, 50, mat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Moderate understanding">🟡</button>
                        <button onClick={() => handleReport(mat.title, 0, mat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Strong concept">🟢</button>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setReportingFor(mat.id)}
                        style={{ border: '1px solid var(--outline)' }}
                      >
                        <FiHelpCircle style={{ marginRight: 8 }} /> Report Understanding
                      </button>
                    )}
                    
                    <a 
                      href={mat.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ display: 'flex', justifyContent: 'center' }}
                    >
                      Open Material <FiExternalLink style={{ marginLeft: 8 }} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
