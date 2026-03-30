import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  unlink,
  type User,
  type AuthCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteField,
  serverTimestamp,
  orderBy,
  deleteDoc,
  type Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD4cLjO3naxE9-671Jpeurx0gGlLrMXR_Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "methalobrowser.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "methalobrowser",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "methalobrowser.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "827889710750",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:827889710750:web:43e84a317765449ebeed8f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export { EmailAuthProvider, GoogleAuthProvider };

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
  isAdmin: boolean;
  accountType: 'Free' | 'Pro' | 'Enterprise' | 'Admin';
  tabLimit: number;
  sessionId?: string;
  tabCount: number;
  isActive: boolean;
}

export interface SupportTicket {
  id?: string;
  fullName: string;
  accountEmail: string;
  replyEmail: string;
  problem: string;
  status: 'pending' | 'resolved';
  createdAt: Timestamp | null;
}

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  const userData: Omit<UserData, 'uid'> = {
    email,
    displayName: name,
    createdAt: serverTimestamp() as unknown as Timestamp,
    lastLoginAt: serverTimestamp() as unknown as Timestamp,
    isAdmin: false,
    accountType: 'Free',
    tabLimit: 2,
    tabCount: 0,
    isActive: false
  };
  await setDoc(doc(db, 'users', userCredential.user.uid), userData);
  return userCredential.user;
};

export const signInWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await updateDoc(doc(db, 'users', userCredential.user.uid), { lastLoginAt: serverTimestamp() });
  return userCredential.user;
};

export const signInWithGoogle = async () => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    const userData: Omit<UserData, 'uid'> = {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp() as unknown as Timestamp,
      lastLoginAt: serverTimestamp() as unknown as Timestamp,
      isAdmin: false,
      accountType: 'Free',
      tabLimit: 2,
      tabCount: 0,
      isActive: false
    };
    await setDoc(doc(db, 'users', user.uid), userData);
  } else {
    await updateDoc(doc(db, 'users', user.uid), { lastLoginAt: serverTimestamp() });
  }
  return user;
};

export const logOut = async () => {
  await signOut(auth);
};

export const updateUserPassword = async (user: User, newPassword: string) => {
  await updatePassword(user, newPassword);
};

export const sendVerificationEmail = async (user: User) => {
  await sendEmailVerification(user);
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const updateUserProfile = async (uid: string, data: { displayName?: string; photoURL?: string }) => {
  if (auth.currentUser) {
    const authData: { displayName?: string; photoURL?: string } = { ...data };
    if (authData.photoURL && authData.photoURL.startsWith('data:')) {
      delete authData.photoURL;
    }
    await updateProfile(auth.currentUser, authData);
  }
  await updateDoc(doc(db, 'users', uid), data);
};

export const uploadProfileImage = async (uid: string, file: File) => {
  const storageRef = ref(storage, `profiles/${uid}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  await updateUserProfile(uid, { photoURL: downloadURL });
  return downloadURL;
};

export const linkAccount = async (credential: AuthCredential) => {
  if (!auth.currentUser) throw new Error('No user logged in');
  return await linkWithCredential(auth.currentUser, credential);
};

export const unlinkFromProvider = async (providerId: string) => {
  if (!auth.currentUser) throw new Error('No user logged in');
  return await unlink(auth.currentUser, providerId);
};

export const migrateSessionId = async (targetUid: string, sourceUid: string) => {
  const sourceDoc = await getDoc(doc(db, 'users', sourceUid));
  const sourceData = sourceDoc.data();
  if (sourceData?.sessionId) {
    await updateDoc(doc(db, 'users', targetUid), { sessionId: sourceData.sessionId });
    await updateDoc(doc(db, 'users', sourceUid), { sessionId: deleteField() });
  }
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) return { uid, ...userDoc.data() } as UserData;
  return null;
};

export const updateUserSession = async (uid: string, sessionId: string | null, isActive: boolean) => {
  await updateDoc(doc(db, 'users', uid), {
    sessionId: sessionId || null,
    isActive,
    lastLoginAt: serverTimestamp()
  });
};

export const updateUserTabCount = async (uid: string, tabCount: number) => {
  await updateDoc(doc(db, 'users', uid), { tabCount });
};

export const adminUpdateUser = async (uid: string, data: { 
  accountType?: string; 
  isAdmin?: boolean; 
  tabLimit?: number;
  isActive?: boolean;
  sessionId?: string | null;
  tabCount?: number;
}) => {
  await updateDoc(doc(db, 'users', uid), data as any);
};

export const adminDeleteUser = async (uid: string) => {
  await deleteDoc(doc(db, 'users', uid));
};

// Support Request Functions
export const submitSupportTicket = async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
  const ticketData = {
    ...ticket,
    status: 'pending',
    createdAt: serverTimestamp()
  };
  await setDoc(doc(collection(db, 'support_tickets')), ticketData);
};

export const adminFetchSupportTickets = async (): Promise<SupportTicket[]> => {
  const ticketsSnapshot = await getDocs(query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')));
  return ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SupportTicket);
};

export const adminUpdateTicketStatus = async (id: string, status: 'pending' | 'resolved') => {
  await updateDoc(doc(db, 'support_tickets', id), { status });
};

export const adminDeleteTicket = async (id: string) => {
  await deleteDoc(doc(db, 'support_tickets', id));
};

// Admin functions - Renamed to force bundle refresh
export const adminFetchAllUsers = async (): Promise<UserData[]> => {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as UserData);
};

export const adminFetchActiveSessions = async (): Promise<UserData[]> => {
  const q = query(collection(db, 'users'), where('isActive', '==', true));
  const sessionsSnapshot = await getDocs(q);
  return sessionsSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as UserData);
};

export { onAuthStateChanged, type User };
