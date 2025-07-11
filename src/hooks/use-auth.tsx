
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
  const [loading, setLoading] = useState(true); // Start as true

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setLoading(false);
      return;
    }

    // This listener handles auth state changes (login/logout)
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser: User | null) => {
      if (authUser) {
        try {
            // User is authenticated. Force a reload to get the latest user data (e.g., emailVerified).
            await authUser.reload();
            // The `auth.currentUser` is now the freshest user object.
            const freshUser = auth.currentUser;
            
            if (!freshUser) {
              setUser(null);
              setLoading(false);
              return;
            }

            // Now get their profile from Firestore.
            const userDocRef = doc(db, 'users', freshUser.uid);
            
            // This listener handles profile data changes (e.g., becoming premium)
            const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnapshot) => {
              if (docSnapshot.exists()) {
                const docData = docSnapshot.data();
                
                // Manually convert Firestore Timestamp to a serializable ISO string
                const createdAtTimestamp = docData.createdAt as Timestamp;
                const serializableAccountData: UserAccount = {
                    name: docData.name,
                    username: docData.username,
                    email: docData.email,
                    photoURL: docData.photoURL,
                    isPremium: docData.isPremium,
                    subscriptionTier: docData.subscriptionTier,
                    profileType: docData.profileType || 'public',
                    notificationSettings: docData.notificationSettings || { publicFeed: true, followingFeed: true },
                    lastVisitedFeeds: docData.lastVisitedFeeds || null,
                    createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
                };

                setUser({ ...freshUser, ...serializableAccountData });
              } else {
                // This can happen if the user document hasn't been created yet during signup.
                // We'll treat them as logged in, but without extra profile data for now.
                // The createUserDocument function will soon create the doc, and this listener will re-run.
                setUser(freshUser as AppUser);
              }
              // We have the full user state (or know it's pending creation), so loading is done.
              setLoading(false);
            }, (error) => {
                // Handle errors fetching the document
                console.error(
                  `[use-auth.tsx > onSnapshot] ¡ERROR DE PERMISOS DE FIRESTORE!
----------------------------------------------------------------------
No se pudo leer el perfil del usuario (UID: ${freshUser.uid}).
Esto casi siempre significa que las REGLAS DE SEGURIDAD de Cloud Firestore no se han publicado correctamente.

Causa probable: Las reglas predeterminadas están en "modo de producción", que bloquea todas las lecturas, o las reglas personalizadas no permiten que un usuario lea su propio documento en la colección '/users'.

Solución:
1. Ve a la Consola de Firebase -> Cloud Firestore -> Pestaña "Reglas".
2. Pega el contenido del archivo 'firestore.rules' del proyecto. La regla clave que necesitas es:
   match /users/{userId} {
     allow get: if request.auth.uid == userId;
     // ... otras reglas
   }
3. Haz clic en "Publicar".

Error original:`,
                  error
                );
                setUser(freshUser as AppUser); // Fallback to authUser only
                setLoading(false);
            });

            // This is a cleanup function. It will be called when the user logs out.
            return () => {
              unsubscribeSnapshot();
            };
        } catch (error) {
            console.error("[useAuth] Error reloading user or setting up snapshot:", error);
            // If something goes wrong, at least show the basic user info and stop loading.
            setUser(authUser as AppUser); // Use the original authUser as a fallback
            setLoading(false);
        }
      } else {
        // User is logged out.
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup the main auth listener on component unmount
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
