'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SetupAdminPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const makeMeSuperAdmin = async () => {
        if (!user) {
            toast({ title: 'Please log in first' });
            return;
        }
        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                role: 'superadmin',
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }, { merge: true });

            toast({ title: 'Success!', description: 'You are now a Super Admin' });
            router.push('/admin');
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-2xl font-bold">Admin Setup</h1>
            <p>Click the button below to grant yourself Super Admin privileges.</p>
            <Button onClick={makeMeSuperAdmin} disabled={loading || !user}>
                {loading ? 'Processing...' : 'Make Me Super Admin'}
            </Button>
            {!user && <p className="text-red-500">You must be logged in to use this.</p>}
        </div>
    );
}
