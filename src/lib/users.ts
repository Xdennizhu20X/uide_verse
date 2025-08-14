// lib/api/users.ts
import type { User } from '@/lib/types';

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // Aquí implementa la lógica para obtener el usuario de tu backend
    // Ejemplo con fetch a tu API:
    const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}