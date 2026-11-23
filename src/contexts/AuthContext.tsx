import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { rolePermissions, roles } from '../data/options';
import type { AuthResult, Permission, Role, User } from '../types/auth';
import { auth } from '../firebase';

const PROFILE_ROLES_KEY = 'queldrin_profile_roles';
const DEFAULT_ROLE: Role = 'Infrastructure Manager';

interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (input: SignupInput) => Promise<AuthResult>;
  googleSignIn: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'email' | 'role'>>) => Promise<AuthResult>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && roles.some((role) => role === value);
}

function getStoredRole(userId: string): Role | null {
  const raw = localStorage.getItem(PROFILE_ROLES_KEY);
  if (!raw) return null;

  try {
    const profiles = JSON.parse(raw) as Record<string, unknown>;
    const role = profiles[userId];
    return isRole(role) ? role : null;
  } catch {
    return null;
  }
}

function saveRole(userId: string, role: Role): void {
  let profiles: Record<string, unknown> = {};
  const raw = localStorage.getItem(PROFILE_ROLES_KEY);
  if (raw) {
    try {
      profiles = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      profiles = {};
    }
  }
  profiles[userId] = role;
  localStorage.setItem(PROFILE_ROLES_KEY, JSON.stringify(profiles));
}

function toPublicUser(firebaseUser: FirebaseUser): User {
  const googleProvider = firebaseUser.providerData.find((item) => item.providerId === 'google.com');
  const provider = googleProvider
    ? 'google'
    : 'password';

  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Queldrin user',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || googleProvider?.photoURL || null,
    role: getStoredRole(firebaseUser.uid) ?? DEFAULT_ROLE,
    provider
  };
}

function getAuthError(error: unknown): string {
  const authError = error as { code?: unknown; message?: unknown };
  switch (authError?.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/weak-password':
      return 'Choose a stronger password and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups and try again.';
    case 'auth/requires-recent-login':
      return 'Please sign in again before changing your email address.';
    case 'auth/network-request-failed':
      return 'Unable to reach Firebase. Check your internet connection and try again.';
    default:
      return typeof authError?.message === 'string'
        ? authError.message
        : 'Authentication failed. Please try again.';
  }
}

const success: AuthResult = { ok: true };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('queldrin_users');
    localStorage.removeItem('queldrin_session');

    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toPublicUser(firebaseUser) : null);
      setLoading(false);
    });
  }, []);

  const login: AuthContextValue['login'] = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return success;
    } catch (error) {
      return { ok: false, error: getAuthError(error) };
    }
  };

  const signup: AuthContextValue['signup'] = async ({ name, email, password, role }) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      saveRole(credential.user.uid, role);
      await updateFirebaseProfile(credential.user, { displayName: name.trim() });
      setUser(toPublicUser(credential.user));
      return success;
    } catch (error) {
      return { ok: false, error: getAuthError(error) };
    }
  };

  const googleSignIn: AuthContextValue['googleSignIn'] = async () => {
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      if (!getStoredRole(credential.user.uid)) {
        saveRole(credential.user.uid, DEFAULT_ROLE);
      }
      setUser(toPublicUser(credential.user));
      return success;
    } catch (error) {
      return { ok: false, error: getAuthError(error) };
    }
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return success;
    } catch (error) {
      return { ok: false, error: getAuthError(error) };
    }
  };

  const logout: AuthContextValue['logout'] = async () => {
    try {
      await signOut(auth);
      return success;
    } catch (error) {
      return { ok: false, error: getAuthError(error) };
    }
  };

  const updateProfile: AuthContextValue['updateProfile'] = async (patch) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return { ok: false, error: 'Not signed in.' };

    try {
      if (patch.email && patch.email.trim() !== firebaseUser.email) {
        await updateEmail(firebaseUser, patch.email.trim());
      }
      if (patch.name !== undefined && patch.name.trim() !== firebaseUser.displayName) {
        await updateFirebaseProfile(firebaseUser, { displayName: patch.name.trim() });
      }
      if (patch.role) saveRole(firebaseUser.uid, patch.role);
      setUser(toPublicUser(firebaseUser));
      return success;
    } catch (error) {
      setUser(toPublicUser(firebaseUser));
      return { ok: false, error: getAuthError(error) };
    }
  };

  const can = (permission: Permission) => user ? rolePermissions[user.role].includes(permission) : false;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, googleSignIn, resetPassword, logout, updateProfile, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
