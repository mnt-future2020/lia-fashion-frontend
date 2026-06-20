'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader';
import DashboardContent from '@/components/Dashboard/Dashboard/Dashboard';
export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated && !loading) {
            router.push('/admin/login');
        }
        setLoading(false);
    }, [isAuthenticated, router, loading]);

    useEffect(() => {
        // Check if POS was the last active page
        const activeItem = localStorage.getItem('active_sidebar_item');
        if (activeItem === 'POS') {
            router.push('/admin/dashboard/pos');
        }
    }, [router]);

    if (loading) {
        return <div>Loading...</div>;
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
