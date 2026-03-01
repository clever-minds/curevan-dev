
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getTherapistById } from '@/lib/repos/therapists';

// This is the legacy route. It now redirects to the canonical slug-based URL.
export default function LegacyTherapistProfileRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      // Find the therapist to get their name for the slug
      const therapist = await getTherapistById(params.id);
      if (therapist) {
          const slug = therapist.name.toLowerCase().replace(/ /g, '-');
          router.replace(`/therapists/${slug}`);
      } else {
          // If therapist not found, redirect to the main therapists list
          router.replace('/therapists');
      }
    }
    redirect();
  }, [params.id, router]);

  // Render a loading state while redirecting
  return (
      <div className="container mx-auto py-12">
        <Skeleton className="h-[80vh] w-full" />
      </div>
  );
}
