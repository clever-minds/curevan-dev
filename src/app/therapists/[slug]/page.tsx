
import { notFound } from 'next/navigation';
import { TherapistProfileClient } from './therapist-profile';
import type { Therapist } from '@/lib/types';
import type { Metadata, ResolvingMetadata } from 'next';
import { getTherapistBySlug } from '@/lib/repos/therapists';
import { listJournalEntries } from '@/lib/repos/content';

export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug

  const therapist = await getTherapistBySlug(slug);

  if (!therapist) {
    return {
      title: 'Therapist Not Found',
      description: 'The therapist you are looking for is not on our platform.',
    }
  }

  return {
    title: `${therapist.name} | ${therapist.specialty} in ${therapist.city}`,
    description: `Book an appointment with ${therapist.name}, a certified ${therapist.specialty} with ${therapist.experience_years} years of experience. ${therapist.bio.substring(0, 120)}...`,
    openGraph: {
      title: `${therapist.name} | Curevan Therapist Profile`,
      description: therapist.bio.substring(0, 160),
      images: [
        {
          url: therapist.image,
          width: 100,
          height: 100,
          alt: therapist.name,
        },
      ],
    },
  }
}

// This is now an async Server Component
export default async function TherapistProfilePage({ params }: { params: { slug: string } }) {
  // We can directly use the slug from params here
  const slug = params.slug;
  const therapist = await getTherapistBySlug(slug);
        console.log("getTherapistBySlug params2",therapist);

  if (!therapist || !therapist.isProfilePublic) {
    notFound();
  }

  // Fetch authored posts here on the server
  const authoredPosts = await listJournalEntries({ authorId: therapist.id, status: 'published' });

  // We pass all fetched data as props to the client component
  return <TherapistProfileClient therapist={therapist} authoredPosts={authoredPosts} />;
}
