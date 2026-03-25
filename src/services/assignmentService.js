import {
  collection, doc, addDoc, getDocs, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

const assignmentsRef = collection(db, 'assignments');
const submissionsRef = collection(db, 'submissions');

export async function createAssignment(classId, assignment) {
  const data = {
    classId,
    title: assignment.title,
    description: assignment.description || '',
    xp: assignment.xp || 50,
    deadline: assignment.deadline || null,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(assignmentsRef, data);
  return { id: docRef.id, ...data };
}

export async function getClassAssignments(classId) {
  const q = query(
    assignmentsRef,
    where('classId', '==', classId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateAssignment(id, updates) {
  await updateDoc(doc(db, 'assignments', id), updates);
}

export async function deleteAssignment(id) {
  await deleteDoc(doc(db, 'assignments', id));
}

export async function submitAssignment(assignmentId, studentId, submission) {
  const data = {
    assignmentId,
    studentId,
    answer: submission.answer || '',
    submittedAt: serverTimestamp(),
    status: 'submitted',
  };
  const docRef = await addDoc(submissionsRef, data);
  return { id: docRef.id, ...data };
}

export async function getStudentSubmissions(studentId, classId) {
  const assignments = await getClassAssignments(classId);
  const assignmentIds = assignments.map(a => a.id);
  if (assignmentIds.length === 0) return [];

  const q = query(
    submissionsRef,
    where('studentId', '==', studentId),
    where('assignmentId', 'in', assignmentIds.slice(0, 10))
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToAssignments(classId, callback) {
  const q = query(
    assignmentsRef,
    where('classId', '==', classId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function calculateStudentXP(submissions, assignments) {
  let totalXP = 0;
  submissions.forEach(sub => {
    const assignment = assignments.find(a => a.id === sub.assignmentId);
    if (assignment && sub.status === 'submitted') {
      totalXP += assignment.xp || 0;
    }
  });
  return totalXP;
}
