import {
  doc, setDoc, getDocs, collection,
  query, where, serverTimestamp, onSnapshot, increment
} from 'firebase/firestore';
import { db } from './firebase';

export async function reportConfusion(classId, topic, level = 1) {
  const docId = `${classId}_${topic.toLowerCase().replace(/\s+/g, '_')}`;
  
  await setDoc(doc(db, 'heatmapData', docId), {
    classId,
    topic,
    confusionLevel: increment(level),
    reportCount: increment(1),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getClassHeatmap(classId) {
  const q = query(
    collection(db, 'heatmapData'),
    where('classId', '==', classId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    // Normalize to 0-100
    const avgConfusion = data.reportCount > 0
      ? Math.min(100, Math.round((data.confusionLevel / data.reportCount) * 20))
      : 0;
    return {
      id: d.id,
      topic: data.topic,
      confusionLevel: avgConfusion,
      reportCount: data.reportCount || 0,
      updatedAt: data.updatedAt,
    };
  }).sort((a, b) => b.confusionLevel - a.confusionLevel);
}

export async function resetTopicConfusion(classId, topic) {
  const docId = `${classId}_${topic.toLowerCase().replace(/\s+/g, '_')}`;
  await setDoc(doc(db, 'heatmapData', docId), {
    classId,
    topic,
    confusionLevel: 0,
    reportCount: 0,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToHeatmap(classId, callback) {
  const q = query(
    collection(db, 'heatmapData'),
    where('classId', '==', classId)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => {
      const item = d.data();
      const avg = item.reportCount > 0
        ? Math.min(100, Math.round((item.confusionLevel / item.reportCount) * 20))
        : 0;
      return {
        id: d.id,
        topic: item.topic,
        confusionLevel: avg,
        reportCount: item.reportCount || 0,
      };
    }).sort((a, b) => b.confusionLevel - a.confusionLevel);
    callback(data);
  });
}
