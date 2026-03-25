import {
  doc, setDoc, getDoc, getDocs, collection,
  query, where, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export async function updateEngagementScore(userId, classId, metrics) {
  // Weighted formula: attendance 25%, assignments 30%, focus 20%, chatbot 25%
  const score = Math.round(
    (metrics.attendancePercent || 0) * 0.25 +
    (metrics.assignmentPercent || 0) * 0.30 +
    (metrics.focusPercent || 0) * 0.20 +
    (metrics.chatbotPercent || 0) * 0.25
  );

  const docId = `${userId}_${classId}`;
  await setDoc(doc(db, 'engagementScores', docId), {
    userId,
    classId,
    score: Math.min(100, Math.max(0, score)),
    breakdown: metrics,
    updatedAt: serverTimestamp(),
  });

  return score;
}

export async function getEngagementScore(userId, classId) {
  const docId = `${userId}_${classId}`;
  const snap = await getDoc(doc(db, 'engagementScores', docId));
  if (!snap.exists()) return { score: 0, breakdown: {} };
  return snap.data();
}

export async function getClassEngagement(classId) {
  const q = query(
    collection(db, 'engagementScores'),
    where('classId', '==', classId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToEngagement(classId, callback) {
  const q = query(
    collection(db, 'engagementScores'),
    where('classId', '==', classId)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function getEngagementSuggestions(score) {
  if (score >= 80) return ['Great engagement! Keep it up! 🌟'];
  if (score >= 60) return [
    'Try completing more assignments for bonus XP',
    'Use the Focus Timer to boost your score',
  ];
  if (score >= 40) return [
    'Attend more classes to improve your score',
    'Ask the AI chatbot for help with assignments',
    'Try the Focus Timer for study sessions',
  ];
  return [
    '⚠️ Your engagement needs attention',
    'Start by attending your next class',
    'Complete at least one pending assignment',
    'Try one 25-min Focus Timer session',
  ];
}
