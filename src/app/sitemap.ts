
import { MetadataRoute } from 'next';
import { listPublicJournalEntries } from '@/lib/repos/content';
import { listTherapists } from '@/lib/repos/therapists';
import { getTherapyCategoriesWithIds } from '@/lib/repos/categories';
import { categorySlug, productPath, therapistPath } from '@/lib/slug';
import { fetchPublicProducts } from '@/lib/repos/products';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.curevan.com').replace(/\/$/, '');
  const now = new Date().toISOString();

  // 1. Static high-value landing and public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/therapists`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ecommerce`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/join-as-therapist`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Legal & compliance pages
    {
      url: `${baseUrl}/legal/terms-of-use`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal/refund-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal/medical-consent`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal/cookie-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal/marketing-consent`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal/therapist-conduct`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  // 2. Dynamic routes for therapy categories/services
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const therapyCategories = await getTherapyCategoriesWithIds();
    const uniqueSlugs = Array.from(new Set((therapyCategories || []).filter((cat) => cat?.name?.trim()).map(categorySlug)));

    categoryRoutes = uniqueSlugs.map((slug) => ({
      url: `${baseUrl}/therapists/category/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error('Sitemap category fetch error:', err);
  }

  // 3. Dynamic routes for verified therapists
  let therapistRoutes: MetadataRoute.Sitemap = [];
  try {
    const therapists = await listTherapists();
    therapistRoutes = (therapists || [])
      .filter((therapist) => therapist && therapist.name && (therapist.isProfilePublic ?? true))
      .map((therapist) => ({
        url: `${baseUrl}${therapistPath(therapist)}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch (err) {
    console.error('Sitemap therapist fetch error:', err);
  }

  // 4. Dynamic routes for public journal entries / blogs
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const allPosts = await listPublicJournalEntries();
    postRoutes = (allPosts || [])
      .filter((post) => post && post.slug && post.status === 'published')
      .map((post) => {
        const publishedDate = post.publishedAt
          ? new Date(post.publishedAt)
          : (post.updatedAt ? new Date(post.updatedAt) : new Date());
        const lastModified = isNaN(publishedDate.getTime()) ? now : publishedDate.toISOString();

        return {
          url: `${baseUrl}/journal/${encodeURIComponent(post.slug)}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      });
  } catch (err) {
    console.error('Sitemap journal fetch error:', err);
  }

  // 5. Dynamic routes for public e-commerce products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchPublicProducts();
    productRoutes = (products || [])
      .filter((product) => product && product.id)
      .map((product) => ({
        url: `${baseUrl}${productPath(product)}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch (err) {
    console.error('Sitemap product fetch error:', err);
  }

  const allRoutes = [
    ...staticRoutes,
    ...categoryRoutes,
    ...therapistRoutes,
    ...productRoutes,
    ...postRoutes,
  ];

  // Fail-safe: ensure no unencoded '&' or invalid characters can trigger xmlParseEntityRef errors
  return allRoutes.map((route) => ({
    ...route,
    url: route.url.replace(/&/g, '%26'),
  }));
}
