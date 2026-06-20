'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

export function useAuth() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const token = getAuthToken();
            if (!token) {
                router.push('/admin/login');
            }
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);

        return () => {
            window.removeEventListener('storage', checkAuth);
        };
    }, [router]);

    return null;
}
