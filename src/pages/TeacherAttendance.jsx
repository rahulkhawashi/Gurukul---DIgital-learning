import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToTeacherClasses, subscribeToClass } from '../services/classService';
import { getUsersByIds } from '../services/userService';
import { subscribeToAttendance, markAttendance } from '../services/attendanceService';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import '../styles/components.css';
import '../styles/pages.css';

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetails, setClassDetails] = useState(null);
  
  // yyyy-mm-dd
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Fetch teacher's classes
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTeacherClasses(user.uid, (data) => {
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].classId);
      }
    });
    return () => unsub();
  }, [user]);

  // Fetch specific class details (to get student IDs array)
  useEffect(() => {
    if (!selectedClass) {
      setClassDetails(null);
      setStudents([]);
      return;
    }
    const unsub = subscribeToClass(selectedClass, async (data) => {
      setClassDetails(data);
      if (data && data.students && data.students.length > 0) {
        const studentProfiles = await getUsersByIds(data.students);
        setStudents(studentProfiles);
      } else {
        setStudents([]);
      }
    });
    return () => unsub();
  }, [selectedClass]);

  // Fetch attendance records for selected class and date
  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setAttendanceRecords([]);
      return;
    }
    const unsub = subscribeToAttendance(selectedClass, selectedDate, setAttendanceRecords);
    return () => unsub();
  }, [selectedClass, selectedDate]);

  async function handleStatusChange(studentId, newStatus) {
    if (!selectedClass) return;
    try {
      await markAttendance(selectedClass, studentId, newStatus);
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  }

  const getRecordForStudent = (studentId) => {
    return attendanceRecords.find(r => r.studentId === studentId);
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--headline-sm)', marginBottom: 'var(--space-1)' }}>Attendance Manager</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Track student participation and presence</p>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No Classes Yet</h3>
          <p>Create a class from the Dashboard first to manage attendance.</p>
        </div>
      ) : (
        <div className="card-elevated" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
            <div className="input-group" style={{ flex: '1 1 250px' }}>
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
            
            <div className="input-group" style={{ flex: '0 0 200px' }}>
              <label>Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--title-md)', marginBottom: 'var(--space-4)' }}>
              Student Roster {students.length > 0 ? `(${students.length})` : ''}
            </h3>
            
            {students.length === 0 ? (
              <div className="empty-state" style={{ minHeight: '20vh', padding: 'var(--space-4)' }}>
                <p>No students have joined this class yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {students.map(student => {
                  const record = getRecordForStudent(student.id);
                  const status = record?.status || null; // present, absent, late, or null
                  
                  return (
                    <div key={student.id} style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--surface-container)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'var(--primary)', color: 'var(--background)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: '1.2rem',
                          backgroundImage: student.photoURL ? `url(${student.photoURL})` : 'none',
                          backgroundSize: 'cover'
                        }}>
                          {!student.photoURL && (student.name ? student.name.charAt(0).toUpperCase() : '?')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{student.name || 'Unknown User'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{student.email}</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button 
                          className={`btn ${status === 'present' ? 'btn-primary' : ''}`}
                          style={{
                            padding: '6px 12px',
                            background: status === 'present' ? 'var(--secondary)' : 'var(--surface-container-high)',
                            color: status === 'present' ? '#000' : 'var(--on-surface)'
                          }}
                          onClick={() => handleStatusChange(student.id, 'present')}
                        >
                          <FiCheckCircle size={16} style={{ marginRight: 6 }}/> Present
                        </button>
                        
                        <button 
                          className={`btn ${status === 'late' ? 'btn-primary' : ''}`}
                          style={{
                            padding: '6px 12px',
                            background: status === 'late' ? 'var(--tertiary)' : 'var(--surface-container-high)',
                            color: status === 'late' ? '#000' : 'var(--on-surface)'
                          }}
                          onClick={() => handleStatusChange(student.id, 'late')}
                        >
                          <FiClock size={16} style={{ marginRight: 6 }}/> Late
                        </button>
                        
                        <button 
                          className={`btn ${status === 'absent' ? 'btn-primary' : ''}`}
                          style={{
                            padding: '6px 12px',
                            background: status === 'absent' ? 'var(--error)' : 'var(--surface-container-high)',
                            color: status === 'absent' ? '#fff' : 'var(--on-surface)'
                          }}
                          onClick={() => handleStatusChange(student.id, 'absent')}
                        >
                          <FiXCircle size={16} style={{ marginRight: 6 }}/> Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
