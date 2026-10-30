'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarPlus, LifeBuoy, Phone, ShoppingBag, UserSearch, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFeatures, type Features } from '@/lib/repos/publicConfig';

/** Book again with the last therapist, request a therapist, shop, raise a ticket. Masked calling and care packs stay hidden until their flags are on. */
export function QuickActions({ lastTherapist }: { lastTherapist: { therapistId: number; name: string } | null }) {
  const [features, setFeatures] = React.useState<Features>({ maskedCall: false, carePacks: false });
  React.useEffect(() => { getFeatures().then(setFeatures); }, []);

  return (
    <Card data-testid="quick-actions">
      <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {lastTherapist && (
          <Button asChild variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left"><Link href={`/booking/${lastTherapist.therapistId}`}><CalendarPlus className="mr-2 h-4 w-4 shrink-0" />Book again with {lastTherapist.name}</Link></Button>
        )}
        <Button asChild variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left"><Link href="/discover"><UserSearch className="mr-2 h-4 w-4 shrink-0" />Request a therapist</Link></Button>
        <Button asChild variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left"><Link href="/ecommerce"><ShoppingBag className="mr-2 h-4 w-4 shrink-0" />Shop</Link></Button>
        <Button asChild variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left"><Link href="/dashboard/patient/support"><LifeBuoy className="mr-2 h-4 w-4 shrink-0" />Raise a ticket</Link></Button>
        {features.maskedCall && <Button variant="outline" disabled className="h-auto justify-start py-3"><Phone className="mr-2 h-4 w-4" />Call your therapist</Button>}
        {features.carePacks && <Button variant="outline" disabled className="h-auto justify-start py-3"><Package className="mr-2 h-4 w-4" />Care packs</Button>}
      </CardContent>
    </Card>
  );
}
