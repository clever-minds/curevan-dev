
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { OfferForm } from '@/components/admin/OfferForm';

export default function NewOfferPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Create New Offer</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create a new promotional discount for your products or categories.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <OfferForm />
        </CardContent>
      </Card>
    </div>
  );
}
