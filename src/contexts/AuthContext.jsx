import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ uid: firebaseUser.uid, ...userData });
            setRole(userData.role);
          } else {
            // User exists in Auth but not in Firestore (first-time Google login or failed registration)
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });
            setRole(null); // needs role selection
          }
        } catch (err) {
          console.error('Error fetching user doc:', err);
          // Set user even if Firestore fails so they aren't stuck
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function register(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return cred.user;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function loginWithGoogle(selectedRole) {
    const cred = await signInWithPopup(auth, googleProvider);
    // Securely assign role if first-time user
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDocSnapshot = await getDoc(userDocRef);
    if (!userDocSnapshot.exists()) {
      const userData = {
        id: cred.user.uid,
        name: cred.user.displayName || 'User',
        email: cred.user.email,
        photoURL: cred.user.photoURL || null,
        role: selectedRole || 'student',
        joinedClasses: [],
        createdAt: serverTimestamp(),
      };
      await setDoc(userDocRef, userData);
      setUser({ uid: cred.user.uid, ...userData });
      setRole(userData.role);
    }
    return cred.user;
  }

  async function selectRole(selectedRole) {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const userData = {
      id: uid,
      name: auth.currentUser.displayName || 'User',
      email: auth.currentUser.email,
      photoURL: auth.currentUser.photoURL || null,
      role: selectedRole,
      joinedClasses: [],
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', uid), userData);
    setUser({ uid, ...userData });
    setRole(selectedRole);
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setRole(null);
  }

  const value = {
    user,
    role,
    loading,
    register,
    login,
    loginWithGoogle,
    selectRole,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
