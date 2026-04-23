
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getTherapistById } from '@/lib/repos/therapists';

// This is the legacy route. It now redirects to the canonical slug-based URL.
export default function LegacyTherapistProfileRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const redirect = async () => {
      // Find the therapist to get their name for the slug
      const therapist = await getTherapistById(id);
      if (therapist) {
          const slug = therapist.name.toLowerCase().replace(/ /g, '-');
          router.replace(`/therapists/${slug}`);
      } else {
          // If therapist not found, redirect to the main therapists list
          router.replace('/therapists');
      }
    }
    if (id) {
        redirect();
    }
  }, [id, router]);

  // Render a loading state while redirecting
  return (
      <div className="container mx-auto py-12">
        <Skeleton className="h-[80vh] w-full" />
      </div>
  );
}
