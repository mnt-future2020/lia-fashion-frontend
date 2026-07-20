'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader';
import DashboardContent from '@/components/Dashboard/Dashboard/Dashboard';
export default function Dashboard() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only decide once auth has finished loading, so a logged-in admin isn't
        // bounced to login during the brief initial auth check.
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        // Check if POS was the last active page
        const activeItem = localStorage.getItem('active_sidebar_item');
        if (activeItem === 'POS') {
            router.push('/admin/dashboard/pos');
        }
    }, [router]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null; // redirecting to /admin/login
    }

    return (
        <div>
             <div className="bgclrrr pt-3">
            <Header headerName={"Dashboard"} />
            <DashboardContent />
      </div>
        </div>
    );
}
