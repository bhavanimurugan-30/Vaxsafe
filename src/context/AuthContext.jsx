import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import {
  getUserProfile,
  saveUserProfile,
  getClinicById,
  saveClinicDocument
} from '../services/dataService';
import { DEMO_ACCOUNTS } from '../services/seedData';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'vaxsafe_auth_user';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and listen to auth state
  useEffect(() => {
    let unsubscribe = null;

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const profile = await getUserProfile(fbUser.uid, fbUser.email);
            const userObj = {
              uid: fbUser.uid,
              email: fbUser.email,
              name: profile?.name || fbUser.email.split('@')[0],
              role: profile?.role || 'Healthcare Staff',
              // Fall back to the account's own UID (not a shared demo clinic)
              // so every clinic's data stays scoped to that clinic.
              clinicId: profile?.clinicId || fbUser.uid,
              clinicName: profile?.clinicName || 'Unassigned Facility'
            };
            setCurrentUser(userObj);
            const clinicData = await getClinicById(userObj.clinicId);
            setClinic(clinicData);
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        } else {
          setCurrentUser(null);
          setClinic(null);
        }
        setLoading(false);
      });
    } else {
      // Local fallback auth state restore
      try {
        const cached = localStorage.getItem(AUTH_STORAGE_KEY);
        if (cached) {
          const userObj = JSON.parse(cached);
          setCurrentUser(userObj);
          getClinicById(userObj.clinicId).then(setClinic);
        } else {
          // Default to pre-authenticated Clinic A director for instant demo access
          const defaultUser = {
            uid: 'demo-clinic-a-uid',
            ...DEMO_ACCOUNTS[0]
          };
          setCurrentUser(defaultUser);
          getClinicById(defaultUser.clinicId).then(setClinic);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
        }
      } catch (e) {
        console.warn('Local auth restore error:', e);
      }
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Standard Email/Password Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(cred.user.uid, cred.user.email);
        const userObj = {
          uid: cred.user.uid,
          email: cred.user.email,
          name: profile?.name || email.split('@')[0],
          role: profile?.role || 'Staff Operator',
          // Fall back to the account's own UID (not a shared demo clinic)
          // so every clinic's data stays scoped to that clinic.
          clinicId: profile?.clinicId || cred.user.uid,
          clinicName: profile?.clinicName || 'Unassigned Facility'
        };
        setCurrentUser(userObj);
        const clinicData = await getClinicById(userObj.clinicId);
        setClinic(clinicData);
        setLoading(false);
        return { success: true, user: userObj };
      } else {
        // Local fallback mode: first check for a previously registered
        // profile (covers dynamically registered clinics running offline),
        // then demo accounts, then accept arbitrary valid credentials for
        // evaluation purposes (existing demo behavior).
        const profile = await getUserProfile(null, email);
        const matchedDemo = !profile
          ? DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === email.toLowerCase())
          : null;

        const clinicId = profile?.clinicId || (matchedDemo ? matchedDemo.clinicId : 'clinic-a');
        const clinicData = await getClinicById(clinicId);

        const userObj = {
          uid: profile?.uid || `user-${Date.now()}`,
          email,
          name: profile?.name || (matchedDemo ? matchedDemo.name : email.split('@')[0]),
          role: profile?.role || (matchedDemo ? matchedDemo.role : 'Operations Officer'),
          clinicId,
          clinicName: profile?.clinicName || clinicData?.name || 'Unassigned Facility'
        };

        setCurrentUser(userObj);
        setClinic(clinicData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
        setLoading(false);
        return { success: true, user: userObj };
      }
    } catch (err) {
      setLoading(false);
      let message = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Incorrect email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found for this email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please wait a moment and try again.';
      }
      return { success: false, error: message };
    }
  };

  // Clinic Self-Registration: creates the Firebase Auth account, the
  // clinics/{uid} Firestore document, and the users/{uid} profile document,
  // then signs the new clinic in.
  const registerClinic = async ({
    clinicName,
    email,
    password,
    location,
    latitude,
    longitude,
    coldStorageCapacity
  }) => {
    setLoading(true);
    try {
      let uid;
      let accountEmail = email;

      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        accountEmail = cred.user.email;
      } else {
        uid = `clinic-${Date.now()}`;
      }

      const clinicDoc = {
        id: uid,
        name: clinicName,
        shortName: clinicName,
        lat: latitude,
        lng: longitude,
        address: location,
        contact: '',
        coldStorageCapacity,
        backupGenerator: 'Not specified',
        certifiedRange: '2.0°C – 8.0°C',
        isDynamic: true,
        registeredAt: new Date().toISOString()
      };
      await saveClinicDocument(uid, clinicDoc);

      const userObj = {
        uid,
        email: accountEmail,
        name: clinicName,
        role: 'Clinic Administrator',
        clinicId: uid,
        clinicName
      };
      await saveUserProfile(uid, userObj);

      if (!isFirebaseConfigured) {
        // Local mode has no real session listener, so persist and set state
        // directly, matching the existing local-login behavior.
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
      }

      setCurrentUser(userObj);
      setClinic(clinicDoc);
      setLoading(false);
      return { success: true, user: userObj };
    } catch (err) {
      setLoading(false);
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this clinic email already exists.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid clinic email address.';
      }
      return { success: false, error: message };
    }
  };

  // Quick Demo Login helper (switches clinic identity instantly for multi-clinic verification)
  const switchDemoAccount = async (accountEmail) => {
    const acc = DEMO_ACCOUNTS.find(a => a.email === accountEmail) || DEMO_ACCOUNTS[0];
    const clinicData = await getClinicById(acc.clinicId);
    const userObj = {
      uid: `demo-${acc.clinicId}`,
      ...acc
    };
    setCurrentUser(userObj);
    setClinic(clinicData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
    return userObj;
  };

  // Logout
  const logout = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.warn('Firebase signout warning:', err);
    }
    setCurrentUser(null);
    setClinic(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Switch clinic directly (for admin testing)
  const switchClinic = async (newClinicId) => {
    const clinicData = await getClinicById(newClinicId);
    if (clinicData && currentUser) {
      const updatedUser = {
        ...currentUser,
        clinicId: clinicData.id,
        clinicName: clinicData.name
      };
      setCurrentUser(updatedUser);
      setClinic(clinicData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      await saveUserProfile(currentUser.uid, updatedUser);
    }
  };

  const value = {
    currentUser,
    clinic,
    loading,
    login,
    registerClinic,
    logout,
    switchDemoAccount,
    switchClinic,
    isFirebaseConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
