import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTeacherClasses } from '../services/classService';
import { getClassHeatmap } from '../services/heatmapService';
import { getClassEngagement } from '../services/engagementService';
import { generateInsights } from '../services/gemini';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getConfusionColor, getConfusionLabel, getEngagementColor, getInitials } from '../utils/formatters';
import { FiBarChart2, FiZap, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default function Analytics() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [studentNames, setStudentNames] = useState({});
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      const cls = await getTeacherClasses(user.uid);
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClass(cls[0].classId);
        await loadData(cls[0].classId);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function loadData(classId) {
    try {
      const [h, e] = await Promise.all([
        getClassHeatmap(classId),
        getClassEngagement(classId),
      ]);
      setHeatmap(h);
      setEngagement(e);

      const promises = e.map(item => getDoc(doc(db, 'users', item.userId)));
      const userDocs = await Promise.all(promises);
      const namesMap = {};
      userDocs.forEach(docSnap => {
        if (docSnap.exists()) {
          namesMap[docSnap.id] = docSnap.data().name;
        }
      });
      setStudentNames(namesMap);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleClassChange(classId) {
    setSelectedClass(classId);
    await loadData(classId);
    setInsights('');
  }

  async function generateAIInsights() {
    setLoadingInsights(true);
    try {
      const result = await generateInsights(heatmap, engagement);
      setInsights(result);
    } catch (err) {
      setInsights('Could not generate insights at this time.');
    }
    setLoadingInsights(false);
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics & Insights 📊</h1>
        <p>AI-powered classroom intelligence</p>
      </div>

      {/* Class Selector */}
      {classes.length > 0 && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div className="role-toggle" style={{ maxWidth: 500 }}>
            {classes.map(c => (
              <button
                key={c.classId}
                className={`role-toggle-btn ${selectedClass === c.classId ? 'active' : ''}`}
                onClick={() => handleClassChange(c.classId)}
              >
                {c.className}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Doubt Heatmap */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <FiBarChart2 color="var(--primary)" />
            <h3 style={{ fontSize: 'var(--title-lg)' }}>Doubt Heatmap</h3>
          </div>
          {heatmap.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <p style={{ fontSize: 'var(--body-sm)' }}>No confusion data yet. Students need to use the confusion toggle.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {heatmap.map((item) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: getConfusionColor(item.confusionLevel),
                    boxShadow: `0 0 8px ${getConfusionColor(item.confusionLevel)}40`,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, fontWeight: 500 }}>{item.topic}</div>
                  <span className="label-sm" style={{ color: getConfusionColor(item.confusionLevel) }}>
                    {getConfusionLabel(item.confusionLevel)}
                  </span>
                  <div style={{
                    width: 80, height: 6, background: 'var(--surface-container-highest)',
                    borderRadius: 'var(--radius-full)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${item.confusionLevel}%`,
                      background: getConfusionColor(item.confusionLevel),
                      borderRadius: 'var(--radius-full)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Engagement Scores */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <FiZap color="var(--secondary)" />
            <h3 style={{ fontSize: 'var(--title-lg)' }}>Engagement Scores</h3>
          </div>
          {engagement.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <p style={{ fontSize: 'var(--body-sm)' }}>No engagement data yet. Scores update automatically as students interact.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {engagement.sort((a, b) => a.score - b.score).map((item) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div className="avatar avatar-sm">{getInitials(studentNames[item.userId] || item.userId)}</div>
                  <div style={{ flex: 1, fontWeight: 500 }}>{studentNames[item.userId] || `${item.userId.slice(0, 8)}...`}</div>
                  {item.score < 40 && <FiAlertTriangle size={14} color="var(--error)" />}
                  <span style={{
                    fontFamily: 'var(--font-headline)', fontWeight: 700,
                    color: getEngagementColor(item.score),
                  }}>
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <FiZap color="var(--tertiary)" />
            <h3 style={{ fontSize: 'var(--title-lg)' }}>AI Teaching Assistant</h3>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={generateAIInsights}
            disabled={loadingInsights}
          >
            {loadingInsights ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> Analyzing...</>
            ) : (
              <><FiRefreshCw size={14} /> Generate Insights</>
            )}
          </button>
        </div>
        {insights ? (
          <div style={{
            whiteSpace: 'pre-wrap', lineHeight: 1.8,
            fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
          }}>
            {insights}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
            <div className="empty-state-icon">🧠</div>
            <h3>No insights generated yet</h3>
            <p>Click "Generate Insights" to get AI-powered teaching recommendations based on your class data</p>
          </div>
        )}
      </div>
    </div>
  );
}
