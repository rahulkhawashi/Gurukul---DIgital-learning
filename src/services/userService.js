import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const usersRef = collection(db, 'users');

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getUsersByIds(userIds) {
  if (!userIds || userIds.length === 0) return [];
  
  // Firestore 'in' queries are limited to 10 items.
  // We chunk the array into arrays of 10.
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }
  
  const users = [];
  for (const chunk of chunks) {
    const q = query(usersRef, where('id', 'in', chunk));
    const snap = await getDocs(q);
    snap.docs.forEach(d => users.push({ id: d.id, ...d.data() }));
  }
  
  return users;
}
