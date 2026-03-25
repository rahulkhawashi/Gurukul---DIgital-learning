import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  collection, addDoc, getDocs, query, where,
  orderBy, serverTimestamp, onSnapshot, doc, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;
let model = null;

function getModel() {
  if (!model && API_KEY && API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
}

export async function askGemini(prompt, context = '') {
  const ai = getModel();
  
  try {
    if (!ai) throw new Error("API Key missing");
    
    const fullPrompt = context
      ? `You are Gurukul AI, an intelligent teaching assistant. Use this class context:\n${context}\n\nStudent question: ${prompt}`
      : `You are Gurukul AI, an intelligent teaching assistant. ${prompt}`;

    const result = await ai.generateContent(fullPrompt);
    return result.response.text();
  } catch (err) {
    console.error('Gemini error:', err);
    // Intelligent Fallback for Demo
    return getFallbackResponse(prompt);
  }
}

function getFallbackResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('algebra')) return "Algebra is a branch of mathematics where we use letters (like x and y) to represent numbers and express relationships in equations. It helps us solve for unknown values!";
  if (p.includes('calculus')) return "Calculus is the mathematical study of continuous change. It has two main branches: Differential Calculus (about rates of change/slopes) and Integral Calculus (about accumulation/areas).";
  if (p.includes('hello') || p.includes('hi')) return "Hello! I am your Gurukul Assistant. How can I help you with your studies today?";
  if (p.includes('quiz')) return "I'd be happy to help! For the demo, I can generate a quiz on any topic like Algebra or Science. What should we focus on?";
  if (p.includes('thank')) return "You're very welcome! Keep up the great work in your studies.";
  
  return "That's a great question! While I'm currently in 'offline learning mode', I can tell you that staying curious is the key to mastering any subject. Would you like to explore more about mathematics or science?";
}

export async function generateQuiz(topic, context = '') {
  const prompt = `Generate a 5-question multiple choice quiz about "${topic}". 
Format each question as:
Q1: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Answer: [letter]

${context ? `Use this class material for context: ${context}` : ''}`;
  
  return askGemini(prompt);
}

export async function summarizeContent(content, title = '') {
  const prompt = `Summarize the following educational content in clear, concise bullet points suitable for a student. 
Title: ${title}
Content: ${content}`;
  
  return askGemini(prompt);
}

export async function generateInsights(heatmapData, engagementData) {
  const prompt = `As a teaching assistant, analyze this classroom data and provide 3-5 actionable insights for the teacher:

Topic Confusion Levels:
${heatmapData.map(h => `- ${h.topic}: ${h.confusionLevel}% confusion`).join('\n')}

Student Engagement:
- Average engagement: ${engagementData.length > 0 ? Math.round(engagementData.reduce((s, e) => s + e.score, 0) / engagementData.length) : 0}%
- Low engagement students: ${engagementData.filter(e => e.score < 50).length}
- Total students: ${engagementData.length}

Format each insight as a short, actionable recommendation starting with an emoji.`;

  return askGemini(prompt);
}

// ---- Chat Persistence ----

export async function saveChatMessage(userId, classId, message) {
  const chatRef = collection(db, 'chats');
  const q = query(chatRef, where('userId', '==', userId), where('classId', '==', classId));
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(chatRef, {
      userId,
      classId,
      messages: [message],
      updatedAt: serverTimestamp(),
    });
  } else {
    const chatDoc = snap.docs[0];
    const existing = chatDoc.data().messages || [];
    await updateDoc(doc(db, 'chats', chatDoc.id), {
      messages: [...existing, message],
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getChatHistory(userId, classId) {
  const q = query(
    collection(db, 'chats'),
    where('userId', '==', userId),
    where('classId', '==', classId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return [];
  return snap.docs[0].data().messages || [];
}

export function subscribeToChatHistory(userId, classId, callback) {
  const q = query(
    collection(db, 'chats'),
    where('userId', '==', userId),
    where('classId', '==', classId)
  );
  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      callback(snap.docs[0].data().messages || []);
    }
  });
}
