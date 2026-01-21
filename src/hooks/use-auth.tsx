'use client';

import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface UserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
  isUideStudent?: boolean;
  career?: string;
  skills?: string[];
  role?: 'student' | 'viewer';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);

      if (authUser) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            setUserData(null);
          }
          setLoading(false);
        });

        return () => unsubscribeUser();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const isStudent = userData?.role === 'student';
  const canUploadProjects = isStudent;

  return { user, userData, loading, isStudent, canUploadProjects };
}
