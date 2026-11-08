import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId
);

// Initialize Auth
export const auth = getAuth(app);

// Test Firestore connection as required by skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client appears offline:', error.message);
      return false;
    }
    return true;
  }
}

// Error Context Handler conforming to FirestoreErrorInfo standard
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const UID_STORAGE_KEY = 'tabletop_client_uid';

// Get or create persistent client UID
export function getClientUid(): string {
  if (typeof window !== 'undefined') {
    const customUid = localStorage.getItem(UID_STORAGE_KEY);
    if (customUid) return customUid;
  }
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  if (typeof window !== 'undefined') {
    const generated =
      'user_' +
      Math.random().toString(36).substring(2, 8) +
      '_' +
      Date.now().toString(36).slice(-4);
    localStorage.setItem(UID_STORAGE_KEY, generated);
    return generated;
  }
  return 'user_guest';
}

export function setCustomClientUid(uid: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(UID_STORAGE_KEY, uid);
  }
}

export async function signInWithGooglePopup(): Promise<{
  uid: string;
  displayName: string | null;
}> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  setCustomClientUid(cred.user.uid);
  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName,
  };
}

export async function signOutAccount(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch {
    // Ignore sign-out errors
  }
  if (typeof window !== 'undefined') {
    const nextUid =
      'user_' +
      Math.random().toString(36).substring(2, 8) +
      '_' +
      Date.now().toString(36).slice(-4);
    localStorage.setItem(UID_STORAGE_KEY, nextUid);
    localStorage.removeItem('tabletop_account_logged_in');
    localStorage.removeItem('tabletop_player_name');
  }
}

// Ensure player has a unique UID for Firestore table operations
export async function ensureAuthUser(): Promise<{ uid: string }> {
  if (typeof window !== 'undefined') {
    const customUid = localStorage.getItem(UID_STORAGE_KEY);
    if (customUid) return { uid: customUid };
  }
  if (auth.currentUser) {
    setCustomClientUid(auth.currentUser.uid);
    return { uid: auth.currentUser.uid };
  }
  try {
    const cred = await signInAnonymously(auth);
    setCustomClientUid(cred.user.uid);
    return { uid: cred.user.uid };
  } catch {
    return { uid: getClientUid() };
  }
}
