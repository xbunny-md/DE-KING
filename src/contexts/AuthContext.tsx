import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../lib/constants';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { cleanText, LIMITS } from '../lib/validation';
import type { AccountType, UserProfile } from '../types';

export interface RegisterPayload {
  email: string;
  password: string;
  accountType: AccountType;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  shipToCountry?: string;
}

export interface ProfileUpdatePayload {
  displayName: string;
  firstName?: string;
  lastName?: string;
  accountType: AccountType;
  businessName?: string;
  phone?: string;
  shipToCountry: string;
  postalCode?: string;
  addressLine?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAuthReady: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (payload: RegisterPayload) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (payload: ProfileUpdatePayload) => Promise<void>;
  formatAuthError: (error: unknown) => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completion.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method). Please enable it or use Google Sign-In.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubAdmin: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }
      if (unsubAdmin) {
        unsubAdmin();
        unsubAdmin = undefined;
      }

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setHasAdminDoc(false);
        setIsAuthReady(true);
        return;
      }

      // Ensure user profile exists if verified
      const userRef = doc(db, 'users', currentUser.uid);
      if (currentUser.emailVerified && currentUser.email) {
        try {
          const existing = await getDoc(userRef);
          if (!existing.exists()) {
            const name = currentUser.displayName || currentUser.email.split('@')[0] || 'DE-KING Member';
            const isBootstrap =
              currentUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: cleanText(currentUser.email, LIMITS.emailMax),
              displayName: cleanText(name, LIMITS.displayNameMax),
              firstName: '',
              lastName: '',
              accountType: 'personal',
              businessName: '',
              phone: '',
              shipToCountry: 'TZ',
              postalCode: '',
              addressLine: '',
              role: isBootstrap ? 'seller' : 'buyer',
              status: 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('Initial profile sync deferred:', err);
        }
      }

      unsubProfile = onSnapshot(
        userRef,
        (snap) => {
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
          setIsAuthReady(true);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      );

      unsubAdmin = onSnapshot(
        doc(db, 'admins', currentUser.uid),
        (snap) => {
          setHasAdminDoc(snap.exists());
        },
        () => {
          setHasAdminDoc(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubAdmin) unsubAdmin();
    };
  }, []);

  const isVerified = Boolean(user?.emailVerified);

  const isAdmin = useMemo(() => {
    if (!user || !user.emailVerified) return false;
    const isBootstrap =
      user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
    return isBootstrap || hasAdminDoc;
  }, [user, hasAdminDoc]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const registerWithEmail = async (payload: RegisterPayload) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      payload.email.trim(),
      payload.password
    );
    const displayName =
      payload.accountType === 'business'
        ? payload.businessName?.trim() || 'Business Seller'
        : `${payload.firstName?.trim() || ''} ${payload.lastName?.trim() || ''}`.trim() ||
          payload.email.split('@')[0];

    await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No active user session.');
    await sendEmailVerification(auth.currentUser);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (payload: ProfileUpdatePayload) => {
    if (!auth.currentUser) throw new Error('You must be signed in.');
    const uid = auth.currentUser.uid;
    const path = `users/${uid}`;
    const userRef = doc(db, 'users', uid);

    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid,
          email: cleanText(auth.currentUser.email || '', LIMITS.emailMax),
          displayName: cleanText(payload.displayName, LIMITS.displayNameMax),
          firstName: cleanText(payload.firstName || '', LIMITS.firstNameMax),
          lastName: cleanText(payload.lastName || '', LIMITS.lastNameMax),
          accountType: payload.accountType,
          businessName: cleanText(payload.businessName || '', LIMITS.businessNameMax),
          phone: cleanText(payload.phone || '', LIMITS.phoneMax),
          shipToCountry: cleanText(payload.shipToCountry || 'TZ', LIMITS.countryMax),
          postalCode: cleanText(payload.postalCode || '', LIMITS.postalMax),
          addressLine: cleanText(payload.addressLine || '', LIMITS.addressMax),
          role: 'buyer',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          displayName: cleanText(payload.displayName, LIMITS.displayNameMax),
          firstName: cleanText(payload.firstName || '', LIMITS.firstNameMax),
          lastName: cleanText(payload.lastName || '', LIMITS.lastNameMax),
          accountType: payload.accountType,
          businessName: cleanText(payload.businessName || '', LIMITS.businessNameMax),
          phone: cleanText(payload.phone || '', LIMITS.phoneMax),
          shipToCountry: cleanText(payload.shipToCountry || 'TZ', LIMITS.countryMax),
          postalCode: cleanText(payload.postalCode || '', LIMITS.postalMax),
          addressLine: cleanText(payload.addressLine || '', LIMITS.addressMax),
          updatedAt: serverTimestamp(),
        });
      }
      await updateProfile(auth.currentUser, {
        displayName: cleanText(payload.displayName, LIMITS.displayNameMax),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthReady,
        isAdmin,
        isVerified,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        resendVerificationEmail,
        logout,
        updateUserProfile,
        formatAuthError: formatFirebaseAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
