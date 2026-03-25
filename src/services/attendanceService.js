import {
  collection, doc, addDoc, getDocs, updateDoc,
  query, where, serverTimestamp, onSnapshot, setDoc
} from 'firebase/firestore';
import { db } from './firebase';

const attendanceRef = collection(db, 'attendance');

export async function markAttendance(classId, studentId, status = 'present') {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const docId = `${classId}_${studentId}_${date}`;
  
  await setDoc(doc(db, 'attendance', docId), {
    classId,
    studentId,
    date,
    status,
    timestamp: serverTimestamp(),
  });
}

export async function getClassAttendance(classId, date) {
  const q = query(
    attendanceRef,
    where('classId', '==', classId),
    where('date', '==', date || new Date().toISOString().split('T')[0])
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getStudentAttendance(studentId, classId) {
  const q = query(
    attendanceRef,
    where('classId', '==', classId),
    where('studentId', '==', studentId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAttendancePercentage(studentId, classId) {
  const records = await getStudentAttendance(studentId, classId);
  if (records.length === 0) return 100;
  const present = records.filter(r => r.status === 'present').length;
  return Math.round((present / records.length) * 100);
}

export async function updateAttendanceStatus(docId, status) {
  await updateDoc(doc(db, 'attendance', docId), { status });
}

export function subscribeToAttendance(classId, date, callback) {
  const q = query(
    attendanceRef,
    where('classId', '==', classId),
    where('date', '==', date || new Date().toISOString().split('T')[0])
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
