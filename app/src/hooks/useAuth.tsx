import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  type User,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  logOut,
  getUserData,
  updateUserSession,
  updateUserProfile,
  uploadProfileImage,
  linkAccount,
  unlinkFromProvider,
  sendVerificationEmail,
  updateUserPassword,
  googleProvider,
  EmailAuthProvider,
  type UserData,
  db,
  auth
} from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  setUserSession: (sessionId: string | null, isActive: boolean) => Promise<void>;
  updateProfileInfo: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  changeProfileImage: (file: File) => Promise<string>;
  linkGoogleAccount: () => Promise<void>;
  linkEmailAccount: (email: string, password: string) => Promise<void>;
  unlinkAccount: (providerId: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserData(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Real-time user data sync from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUserData({ uid: snapshot.id, ...snapshot.data() } as UserData);
      }
      setLoading(false);
    }, (err) => {
      console.error('[Auth] Firestore Sync Error:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const login = async (email: string, password: string) => {
    await signInWithEmail(email, password);
  };

  const signup = async (email: string, password: string, name: string) => {
    await signUpWithEmail(email, password, name);
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await updateUserSession(currentUser.uid, null, false).catch(() => {});
      }
    } catch {}
    await logOut();
  };

  const refreshUserData = async () => {
    if (currentUser) {
      const data = await getUserData(currentUser.uid);
      setUserData(data);
    }
  };

  const setUserSession = async (sessionId: string | null, isActive: boolean) => {
    if (currentUser) {
      await updateUserSession(currentUser.uid, sessionId, isActive);
    }
  };

  const updateProfileInfo = async (data: { displayName?: string; photoURL?: string }) => {
    if (currentUser) {
      await updateUserProfile(currentUser.uid, data);
    }
  };

  const changeProfileImage = async (file: File) => {
    if (!currentUser) throw new Error('Not logged in');
    const url = await uploadProfileImage(currentUser.uid, file);
    return url;
  };

  const linkGoogleAccount = async () => {
    if (!currentUser) throw new Error('Not logged in');
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    const result = await signInWithPopup(auth, googleProvider);
    await linkAccount(GoogleAuthProvider.credentialFromResult(result)!);
  };

  const linkEmailAccount = async (email: string, password: string) => {
    if (!currentUser) throw new Error('Not logged in');
    const credential = EmailAuthProvider.credential(email, password);
    await linkAccount(credential);
  };

  const unlinkAccount = async (providerId: string) => {
    if (!currentUser) throw new Error('Not logged in');
    await unlinkFromProvider(providerId);
  };

  const sendVerification = async () => {
    if (currentUser) {
      await sendVerificationEmail(currentUser);
    }
  };

  const changePassword = async (newPassword: string) => {
    if (currentUser) {
      await updateUserPassword(currentUser, newPassword);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    refreshUserData,
    setUserSession,
    updateProfileInfo,
    changeProfileImage,
    linkGoogleAccount,
    linkEmailAccount,
    unlinkAccount,
    sendVerification,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
