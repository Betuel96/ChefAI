'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { AppUser, UserAccount } from '@/types';

interface AuthContextType {
  user: AppUser;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser: User | null) => {
      if (authUser) {
        // User is logged in, listen for account data changes
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userAccountData = doc.data() as UserAccount;
            setUser({ ...authUser, ...userAccountData });
          } else {
            // This case might happen briefly during signup
            setUser(authUser as AppUser);
          }
           setLoading(false);
        });

        // Return a cleanup function to unsubscribe from the snapshot listener
        return () => unsubscribeSnapshot();
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.