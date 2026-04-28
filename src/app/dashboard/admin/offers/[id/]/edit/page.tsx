
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OfferForm } from '@/components/admin/OfferForm';
import { listOffers } from '@/lib/repos/offers';
import type { Offer } from '@/lib/types';

export default function EditOfferPage() {
  const router = useRouter();
  const { id } = useParams();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const allOffers = await listOffers();
        const found = allOffers.find(o => String(o.id) === id);
        if (found) {
          setOffer(found);
        }
      } catch (error) {
        console.error("Failed to fetch offer", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Offer not found</h2>
        <Button className="mt-4" onClick={() => router.push('/dashboard/admin/offers')}>Back to Offers</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Edit Offer</h1>
        <p className="text-muted-foreground">Modify the details of your promotional offer.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <OfferForm offer={offer} offerId={Number(id)} />
        </CardContent>
      </Card>
    </div>
  );
}
