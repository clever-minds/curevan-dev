
import { MetadataRoute } from 'next';
import { listJournalEntries } from '@/lib/repos/content';
import { listTherapists } from '@/lib/repos/therapists';
import { getTherapyCategories } from '@/lib/repos/categories';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.curevan.com';

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/services',
    '/therapists',
    '/shop',
    '/journal',
    '/contact',
    '/faq',
    '/legal/terms-of-use',
    '/legal/privacy-policy',
    '/legal/medical-consent',
    '/legal/refund-policy',
    '/legal/cookie-policy',
    '/legal/therapist-conduct'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic routes for therapists
  const therapists = await listTherapists();
  const therapistRoutes = therapists
    .filter(therapist => therapist.isProfilePublic)
    .map((therapist) => ({
      url: `${baseUrl}/therapists/${therapist.name.toLowerCase().replace(/ /g, '-')}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Dynamic routes for journal entries
  const allPosts = await listJournalEntries();
  const postRoutes = allPosts
    .filter(post => post.status === 'published' && post.publishedAt)
    .map((post) => {
      const publishedDate = new Date(post.publishedAt!);
      const lastModified = isNaN(publishedDate.getTime()) ? new Date().toISOString() : publishedDate.toISOString();

      return {
        url: `${baseUrl}/journal/${post.slug}`,
        lastModified: lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });
    
  const therapyCategories = await getTherapyCategories();
  // Dynamic routes for services
  const serviceRoutes = therapyCategories.map((service) => ({
    url: `${baseUrl}/services/${service.toLowerCase().replace(/ /g, '-')}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));


  return [...staticRoutes, ...therapistRoutes, ...postRoutes, ...serviceRoutes];
}
