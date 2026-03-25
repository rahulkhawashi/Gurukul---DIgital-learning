import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, query, where, updateDoc, arrayUnion } from 'firebase/firestore';

const FIRST_NAMES = ["Aisha", "Aarav", "Priya", "Rahul", "Neha", "Vikram", "Sneha", "Rohan", "Ananya", "Karan", "Pooja", "Arjun", "Kavya", "Aditya", "Riya", "Dev", "Isha", "Sai", "Meera", "Yash"];
const LAST_NAMES = ["Sharma", "Patel", "Singh", "Gupta", "Kumar", "Desai", "Joshi", "Das", "Reddy", "Iyer"];

export default function SeedData() {
  const { user, role } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function fetchClasses() {
      if (role !== 'teacher') return;
      const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const snap = await getDocs(q);
      const cls = snap.docs.map(d => d.data());
      setClasses(cls);
      if (cls.length > 0) setSelectedClass(cls[0].classId);
    }
    fetchClasses();
  }, [user, role]);

  async function handleSeed() {
    let targetClassId = selectedClass;
    
    setLoading(true);
    setStatus('Looking up class...');
    
    if (manualCode) {
      const q = query(collection(db, 'classes'), where('classCode', '==', manualCode.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setStatus('Class Code not found!');
        setLoading(false);
        return;
      }
      targetClassId = snap.docs[0].id;
    }

    if (!targetClassId) {
      setStatus('No class selected.');
      setLoading(false);
      return;
    }

    setStatus('Seeding data... This may take a few seconds.');
    
    try {
      const batch = writeBatch(db);
      const studentIds = [];

      // 1. Create 20 fake students
      for (let i = 0; i < 20; i++) {
        const studentId = `fake_student_${Date.now()}_${i}`;
        const name = `${FIRST_NAMES[i]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
        
        const userRef = doc(db, 'users', studentId);
        batch.set(userRef, {
          id: studentId,
          name,
          email: `${name.replace(' ', '.').toLowerCase()}@gurukul.demo`,
          role: 'student',
          joinedClasses: [targetClassId],
          createdAt: serverTimestamp()
        });
        
        studentIds.push(studentId);
        
        // 2. Generate Engagement Score for this student
        const engagementRef = doc(db, 'engagementScores', `${targetClassId}_${studentId}`);
        const score = Math.floor(Math.random() * 60) + 40; // 40-100
        batch.set(engagementRef, {
          classId: targetClassId,
          userId: studentId,
          score,
          updatedAt: serverTimestamp()
        });

        // 3. Generate Attendance for past 5 days
        for (let d = 0; d < 5; d++) {
          const date = new Date();
          date.setDate(date.getDate() - d);
          const dateStr = date.toISOString().split('T')[0];
          
          const attRef = doc(collection(db, 'attendance'));
          const roll = Math.random();
          let status = 'present';
          if (roll > 0.85) status = 'absent';
          else if (roll > 0.7) status = 'late';

          batch.set(attRef, {
            classId: targetClassId,
            studentId,
            date: dateStr,
            status,
            timestamp: serverTimestamp()
          });
        }
      }

      const topics = [
        { name: "Algebra Basics", confusion: 85, count: 18 },
        { name: "Quadratic Equations", confusion: 45, count: 12 },
        { name: "Graphing Functions", confusion: 15, count: 8 },
        { name: "Trigonometry Intro", confusion: 95, count: 20 },
        { name: "Statistics", confusion: 60, count: 15 }
      ];

      for (const t of topics) {
        const topicId = `${targetClassId}_${t.name.toLowerCase().replace(/\s+/g, '_')}`;
        const heatRef = doc(db, 'heatmapData', topicId);
        batch.set(heatRef, {
          classId: targetClassId,
          topic: t.name,
          confusionLevel: t.confusion * 5, 
          reportCount: t.count,
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      // Finally, push all studentIds into the classes document so they appear in total counts
      await updateDoc(doc(db, 'classes', targetClassId), {
        students: arrayUnion(...studentIds)
      });
      
      setStatus('Successfully seeded 20 students, attendance, heatmap, and engagement data!');
    } catch (err) {
      console.error(err);
      setStatus('Error seeding data: ' + err.message);
    }
    setLoading(false);
  }

  if (role !== 'teacher') return <p>Only teachers can seed data.</p>;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1>Seed Demo Data 🧪</h1>
        <p>Instantly populate your class with fake students and analytics data.</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="input-group">
          <label>Option 1: Select Your Class</label>
          <select 
            className="input-field"
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setManualCode(''); }}
            disabled={!!manualCode}
          >
            {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
          </select>
        </div>

        <div style={{ textAlign: 'center', margin: 'var(--space-4) 0', color: 'var(--on-surface-variant)' }}>— OR —</div>

        <div className="input-group">
          <label>Option 2: Enter Class Code directly</label>
          <input 
            type="text"
            className="input-field"
            placeholder="e.g. GKL-XXXX"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary btn-lg" 
          style={{ width: '100%', marginTop: 'var(--space-4)' }}
          onClick={handleSeed}
          disabled={loading || (!selectedClass && !manualCode)}
        >
          {loading ? 'Seeding...' : 'Inject 20 Fake Students'}
        </button>

        {status && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)' }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
