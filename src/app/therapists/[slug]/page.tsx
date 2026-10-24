
import { notFound } from 'next/navigation';
import { TherapistProfileClient } from './therapist-profile';
import type { Therapist } from '@/lib/types';
import type { Metadata, ResolvingMetadata } from 'next';
import { getTherapistBySlug } from '@/lib/repos/therapists';
import { listPublicJournalEntries } from '@/lib/repos/content';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params

  const therapist = await getTherapistBySlug(slug);

  if (!therapist) {
    return {
      title: 'Therapist Not Found',
      description: 'The therapist you are looking for is not on our platform.',
    }
  }

  // sheet template: "[Name] – [Specialty] in [City]" and "Book [Name], a verified [Specialty] specialist with [X]+ years' experience, for home visits in [City]. [Short bio]."
  const specialty = (Array.isArray(therapist.serviceTypes) && therapist.serviceTypes[0]) || (typeof therapist.specialty === 'string' ? therapist.specialty : 'Therapist');
  const where = therapist.city || 'your city';
  const intro = `Book ${therapist.name}, a verified ${specialty} specialist with ${therapist.experience_years}+ years' experience, for home visits in ${where}.`;
  return {
    title: `${therapist.name} – ${specialty} in ${where}`,
    description: `${intro} ${therapist.bio || ''}`.trim().slice(0, 160),
    alternates: { canonical: `/therapists/${slug}` },
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
export default async function TherapistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  // We can directly use the slug from params here
  const { slug } = await params;
  const therapist = await getTherapistBySlug(slug);
        console.log("getTherapistBySlug params2",therapist);

  if (!therapist || !therapist.isProfilePublic) {
    notFound();
  }

  // Fetch authored posts here on the server
  const authoredPosts = await listPublicJournalEntries({ authorId: therapist.id, status: 'published' });

  // We pass all fetched data as props to the client component
  return <TherapistProfileClient therapist={therapist} authoredPosts={authoredPosts} />;
}
