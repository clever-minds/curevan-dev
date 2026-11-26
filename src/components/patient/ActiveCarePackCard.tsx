'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CarePack } from '@/lib/repos/carePacks';

interface Props {
  carePack: CarePack;
}

export function ActiveCarePackCard({ carePack }: Props) {
  const remaining = carePack.sessions_total - carePack.sessions_used;
  const expiresDate = carePack.expires_at ? new Date(carePack.expires_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : '';

  const bookingHref = carePack.therapist_id ? `/booking/${carePack.therapist_id}?carePackId=${carePack.id}` : `/book?carePackId=${carePack.id}`;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background" data-testid="active-care-pack-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">{carePack.plan_name || 'Care Package'}</CardTitle>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary font-medium">
            Active Pack
          </Badge>
        </div>
        <CardDescription>
          {remaining} of {carePack.sessions_total} sessions left – expires on {expiresDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((carePack.sessions_used / carePack.sessions_total) * 100)}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs text-muted-foreground">
            {carePack.therapist_name ? `Dedicated Therapist: ${carePack.therapist_name}` : 'Applicable for all licensed therapists'}
          </span>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href={bookingHref}>
                <Calendar className="mr-2 h-4 w-4" />
                Book next session
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/patient/care-packs">
                View all packs <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
