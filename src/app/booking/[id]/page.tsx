
'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Star, MessageSquare, MapPin } from 'lucide-react';
import { BookingForm } from './booking-form';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Therapist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getTherapistById } from '@/lib/repos/therapists';

export const dynamic = 'force-dynamic';

export default function BookingPage({ params }: { params: { id: string } }) {
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTherapist() {
      try {
        const t = await getTherapistById(params.id);
        if (!t) {
            notFound();
        }
        setTherapist(t);
      } catch (error) {
        console.error("Failed to fetch therapist:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchTherapist();
  }, [params.id]);


  if (loading) {
    return (
        <div className="container mx-auto max-w-5xl py-8 md:py-12">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
                <div>
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    )
  }
  
  if (!therapist) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 md:py-12">
        <Breadcrumb className="mb-8">
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
             <BreadcrumbItem>
                <BreadcrumbLink asChild>
                    <Link href="/discover">Discover</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbPage>Booking</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
             <div className="relative w-28 h-28 flex-shrink-0">
                <Image
                    src={therapist.image}
                    alt={therapist.name}
                    fill
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                    data-ai-hint="therapist portrait"
                />
            </div>
            <div>
                <h1 className="text-3xl font-bold font-headline">{therapist.name}</h1>
                <p className="text-lg text-primary">{therapist.serviceTypes.join(', ')}</p>
                <p className="text-md text-muted-foreground">{therapist.specialty}</p>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                        <span className="font-semibold text-foreground">{therapist.rating}</span>
                        ({therapist.reviews} reviews)
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3"/> {therapist.address.line1}
                </p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
                <h3 className="font-bold mb-2">About {therapist.name.split(' ')[0]}</h3>
                <p className="text-muted-foreground">
                    {therapist.bio}
                </p>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
                <h2 className="text-2xl font-bold font-headline mb-4 text-left md:text-center">Book an Appointment</h2>
                <BookingForm therapist={therapist} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
