'use client';

import { useAuth as useAuthContext } from '@/context/auth-context';

export function useAuth() {
  const { user, userData, loading } = useAuthContext();

  const isStudent = userData?.role === 'student';
  const canUploadProjects = isStudent;

  return { user, userData, loading, isStudent, canUploadProjects };
}
