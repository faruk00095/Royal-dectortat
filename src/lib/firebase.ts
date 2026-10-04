import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/keep',
  'https://www.googleapis.com/auth/keep.readonly',
];

export const googleAuthProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => googleAuthProvider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, idToken: string, accessToken: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const idToken = await user.getIdToken();
        if (onAuthSuccess) {
          onAuthSuccess(user, idToken, cachedAccessToken);
        }
      } catch (err) {
        console.error('Failed to get ID token:', err);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (withKeepScope = false): Promise<{
  user: User;
  idToken: string;
  accessToken: string | null;
} | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    if (withKeepScope) {
      SCOPES.forEach((scope) => provider.addScope(scope));
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    const idToken = await result.user.getIdToken();
    return {
      user: result.user,
      idToken,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getIdToken = async (): Promise<string | null> => {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken();
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
