
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
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
    // This effect should only run on the client side where Firebase is available.
    if (!isFirebaseConfigured || typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser: User | null) => {
      if (authUser) {
        // User is logged in. Get their profile from Firestore.
        const userDocRef = doc(db, 'users', authUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const docData = docSnapshot.data();
            const createdAtTimestamp = docData.createdAt as Timestamp;
            const serializableAccountData: UserAccount = {
                name: docData.name,
                username: docData.username,
                email: docData.email,
                photoURL: docData.photoURL,
                isPremium: docData.isPremium,
                subscriptionTier: docData.subscriptionTier,
                profileType: docData.profileType || 'public',
                isVerified: docData.isVerified,
                badges: docData.badges || [],
                notificationSettings: docData.notificationSettings || { publicFeed: true, followingFeed: true },
                lastVisitedFeeds: docData.lastVisitedFeeds || null,
                canMonetize: docData.canMonetize || false,
                stripeConnectAccountId: docData.stripeConnectAccountId || null,
                verificationRequestStatus: docData.verificationRequestStatus || null,
                createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
            };
            setUser({ ...authUser, ...serializableAccountData });
          } else {
            setUser(authUser as AppUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUser(authUser as AppUser);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // User is logged out.
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
