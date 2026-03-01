
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// This page is deprecated. The functionality has been merged into the main "My Earnings" page.
// This component now just redirects the user.
export default function TherapistReferralPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/earnings#referrals');
    }, [router]);

  return <Skeleton className="w-full h-screen" />;
}
