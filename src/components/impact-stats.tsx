

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPublicStats } from '@/lib/repos/stats';
import { Users, BriefcaseMedical, Package, ShieldCheck, Truck } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface Stats {
  usersTotal: number;
  therapistsTotal: number;
  productsTotal: number;
  patientsServedTotal: number;
  productsDeliveredTotal: number;
}

const formatNumber = (num: number): string => {
    if (num < 1000) return num.toString();
    const k = num / 1000;
    if (k < 1000) return k.toFixed(2).replace(/\.00$/, '') + 'K';
    const m = k / 1000;
    return m.toFixed(2).replace(/\.00$/, '') + 'M';
};

const StatItem = ({ icon: Icon, value, label, loading }: { icon: React.ElementType, value: number, label: string, loading: boolean }) => (
  <div className="flex flex-col items-center justify-center p-4 text-center">
    <div className="p-4 bg-white/20 rounded-full mb-4">
        <Icon className="w-8 h-8" />
    </div>
    {loading && value === 0 ? (
        <>
            <Skeleton className="h-9 w-24 mb-2" />
            <Skeleton className="h-5 w-32" />
        </>
    ) : (
        <>
            <p className={cn("text-4xl font-bold", loading && "opacity-50")}>{formatNumber(value)}</p>
            <p className="text-sm font-medium uppercase tracking-wider text-white/80">{label}</p>
        </>
    )}
  </div>
);


export function ImpactStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
        const fetchedStats = await getPublicStats();
        setStats(fetchedStats);
    } catch (error) {
        console.error("Failed to fetch stats:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <section className="w-full bg-footer-gradient text-white">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4">Our Impact in Numbers</h2>
            <p className="max-w-2xl mx-auto text-lg text-white/80">Real-time stats from the Curevan platform, reflecting our growing community.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatItem icon={Users} value={stats?.usersTotal || 0} label="Happy Users" loading={loading} />
          <StatItem icon={BriefcaseMedical} value={stats?.therapistsTotal || 0} label="Verified Therapists" loading={loading} />
          <StatItem icon={ShieldCheck} value={stats?.patientsServedTotal || 0} label="Sessions Completed" loading={loading} />
          <StatItem icon={Package} value={stats?.productsTotal || 0} label="Wellness Products" loading={loading} />
          <StatItem icon={Truck} value={stats?.productsDeliveredTotal || 0} label="Products Delivered" loading={loading} />
        </div>
      </div>
    </section>
  );
}
