
'use client';

import { useEffect, useState } from 'react';
import { Plus, Tag, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { OffersTable } from '@/components/admin/OffersTable';
import { listOffers, deleteOffer, updateOffer } from '@/lib/repos/offers';
import type { Offer } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchOffersData = async () => {
    setLoading(true);
    try {
      const data = await listOffers();
      setOffers(data);
    } catch (error) {
      console.error("Failed to fetch offers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      setLoading(true);
      const res = await deleteOffer(id);
      if (res.success) {
        toast({ title: "Offer deleted" });
        await fetchOffersData();
      } else {
        toast({ variant: "destructive", title: "Failed to delete offer", description: res.message });
        setLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (id: number, active: boolean) => {
    setLoading(true);
    const offer = offers.find(o => o.id === id);
    if (!offer) {
      setLoading(false);
      return;
    }
    const res = await updateOffer(id, { ...offer, isActive: active });
    if (res.success) {
      toast({ title: active ? "Offer activated" : "Offer deactivated" });
      await fetchOffersData();
    } else {
      toast({ variant: "destructive", title: "Failed to update status", description: res.message });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffersData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offers Management</h1>
          <p className="text-muted-foreground">
            Create and manage product-level, category-level, and global offers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOffersData} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/dashboard/admin/offers/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Offer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offers.filter(o => o.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[100px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      ) : (
        <OffersTable 
          offers={offers} 
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
