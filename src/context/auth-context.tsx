'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type User } from 'firebase/auth'; // Keep type import
import { User as AppUser } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    userData: AppUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: () => void;

        const initAuth = async () => {
            const { onAuthStateChanged } = await import('firebase/auth');
            const { auth, db } = await import('@/lib/firebase');
            const { doc, getDoc } = await import('firebase/firestore');

            unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
                if (firebaseUser) {
                    setUser(firebaseUser);
                    try {
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        if (userDoc.exists()) {
                            setUserData(userDoc.data() as AppUser);
                        } else {
                            setUserData(null);
                        }
                    } catch (error) {
                        console.error("Error fetching user data:", error);
                        setUserData(null);
                    }
                } else {
                    setUser(null);
                    setUserData(null);
                }
                setLoading(false);
            });
        };

        initAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
