import {
  collection, doc, addDoc, getDocs, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

const materialsRef = collection(db, 'materials');

export async function addMaterial(classId, material) {
  const data = {
    classId,
    type: material.type, // video, pdf, image, link
    title: material.title,
    url: material.url,
    description: material.description || '',
    tags: material.tags || [],
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(materialsRef, data);
  return { id: docRef.id, ...data };
}

export async function uploadMaterialFile(classId, file) {
  if (!file) throw new Error("No file provided");
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  const storageRef = ref(storage, `materials/${classId}/${filename}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

export async function getClassMaterials(classId) {
  const q = query(
    materialsRef,
    where('classId', '==', classId)
  );
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return data.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
    return timeB - timeA;
  });
}

export async function updateMaterial(id, updates) {
  await updateDoc(doc(db, 'materials', id), updates);
}

export async function deleteMaterial(id) {
  await deleteDoc(doc(db, 'materials', id));
}

export function subscribeToMaterials(classId, callback) {
  const q = query(
    materialsRef,
    where('classId', '==', classId)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
    callback(data);
  });
}

export function detectMaterialType(url) {
  if (!url) return 'link';
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'video';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(jpg|jpeg|png|gif|webp|svg)/.test(lower)) return 'image';
  return 'link';
}

export function getYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?#]+)/);
  return match ? match[1] : null;
}
