import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, arrayUnion, arrayRemove,
  serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { generateClassCode } from '../utils/classCode';

const classesRef = collection(db, 'classes');

export async function createClass(teacherId, className, subject = '') {
  const classCode = generateClassCode();
  const newClass = {
    className,
    teacherId,
    classCode,
    subject,
    students: [],
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(classesRef, newClass);
  return { classId: docRef.id, ...newClass };
}

export async function joinClass(studentId, classCode) {
  const q = query(classesRef, where('classCode', '==', classCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid class code');
  
  const classDoc = snap.docs[0];
  const classData = classDoc.data();
  
  if (classData.students.includes(studentId)) {
    throw new Error('Already joined this class');
  }
  
  await updateDoc(doc(db, 'classes', classDoc.id), {
    students: arrayUnion(studentId),
  });

  // Also update user's joinedClasses
  await updateDoc(doc(db, 'users', studentId), {
    joinedClasses: arrayUnion(classDoc.id),
  });

  return { classId: classDoc.id, ...classData };
}

export async function getClass(classId) {
  const snap = await getDoc(doc(db, 'classes', classId));
  if (!snap.exists()) throw new Error('Class not found');
  return { classId: snap.id, ...snap.data() };
}

export async function getTeacherClasses(teacherId) {
  const q = query(classesRef, where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ classId: d.id, ...d.data() }));
}

export async function getStudentClasses(studentId) {
  const q = query(classesRef, where('students', 'array-contains', studentId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ classId: d.id, ...d.data() }));
}

export async function updateClass(classId, updates) {
  await updateDoc(doc(db, 'classes', classId), updates);
}

export async function regenerateCode(classId) {
  const newCode = generateClassCode();
  await updateDoc(doc(db, 'classes', classId), { classCode: newCode });
  return newCode;
}

export async function deleteClass(classId) {
  await deleteDoc(doc(db, 'classes', classId));
}

export async function removeStudent(classId, studentId) {
  await updateDoc(doc(db, 'classes', classId), {
    students: arrayRemove(studentId),
  });
  await updateDoc(doc(db, 'users', studentId), {
    joinedClasses: arrayRemove(classId),
  });
}

export function subscribeToClass(classId, callback) {
  return onSnapshot(doc(db, 'classes', classId), (snap) => {
    if (snap.exists()) callback({ classId: snap.id, ...snap.data() });
  });
}

export function subscribeToTeacherClasses(teacherId, callback) {
  const q = query(classesRef, where('teacherId', '==', teacherId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ classId: d.id, ...d.data() })));
  });
}

export function subscribeToStudentClasses(studentId, callback) {
  const q = query(classesRef, where('students', 'array-contains', studentId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ classId: d.id, ...d.data() })));
  });
}
