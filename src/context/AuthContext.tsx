import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  auth, 
  googleProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User
} from '../firebase/firebase.ts';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase.ts';

const ADMIN_EMAIL = 'jnanesh4127@gmail.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  idToken: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  const checkAdminClaim = async (firebaseUser: User | null): Promise<boolean> => {
    if (!firebaseUser) return false;
    try {
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      // Check custom claim or hardcoded admin email
      const hasClaim = !!tokenResult.claims.admin;
      const isExactAdminEmail = (firebaseUser.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
      return hasClaim || isExactAdminEmail;
    } catch {
      return false;
    }
  };

  const syncUserProfile = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userRef);
      const isExactAdmin = (firebaseUser.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      const payload = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL || '',
        role: isExactAdmin ? 'admin' : (snapshot.data()?.role || 'user'),
        disabled: false,
        lastLoginAt: new Date().toISOString(),
        ...(snapshot.exists() ? {} : { createdAt: new Date().toISOString() })
      };

      await setDoc(userRef, payload, { merge: true });
    } catch (e) {
      console.warn("Unable to sync user document to firestore (may be offline or awaiting rules):", e);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          const adminStatus = await checkAdminClaim(currentUser);
          setIsAdmin(adminStatus);
          await syncUserProfile(currentUser);
        } catch (e) {
          console.error("Error setting up auth state token:", e);
        }
      } else {
        setIdToken(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const token = await cred.user.getIdToken(true);
    setIdToken(token);
    const adminStatus = await checkAdminClaim(cred.user);
    setIsAdmin(adminStatus);
    await syncUserProfile(cred.user);
    return cred.user;
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn("Could not send verification email immediately:", e);
    }
    const token = await cred.user.getIdToken(true);
    setIdToken(token);
    const adminStatus = await checkAdminClaim(cred.user);
    setIsAdmin(adminStatus);
    await syncUserProfile(cred.user);
    return cred.user;
  };

  const loginWithGoogle = async (): Promise<User> => {
    const cred = await signInWithPopup(auth, googleProvider);
    const token = await cred.user.getIdToken(true);
    setIdToken(token);
    const adminStatus = await checkAdminClaim(cred.user);
    setIsAdmin(adminStatus);
    await syncUserProfile(cred.user);
    return cred.user;
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setIdToken(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error("No user is currently signed in.");
    }
  };

  const refreshIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      setIdToken(token);
      const adminStatus = await checkAdminClaim(auth.currentUser);
      setIsAdmin(adminStatus);
      return token;
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        idToken,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        resendVerificationEmail,
        refreshIdToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export { ADMIN_EMAIL };
