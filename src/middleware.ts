import { NextResponse, type NextRequest } from 'next/server';
import { categorySlug } from '@/lib/slug';

// Old links go to the clean link with a real 308 before the page renders (a redirect thrown inside a streamed page is only a 200 with a script):
//   /therapists/category/Post-Surgery%20Rehab  ->  /therapists/category/post-surgery-rehab
//   /ecommerce/product/81                      ->  /ecommerce/product/tens-electrode-pads
export const config = { matcher: ['/therapists/category/:slug', '/ecommerce/product/:slug'] };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const last = decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1));
  let clean: string | null = null;

  if (pathname.startsWith('/therapists/category/')) {
    const slug = categorySlug({ name: last });
    if (slug !== last) clean = slug;
  } else if (/^\d+$/.test(last)) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/frontend/${last}`, { signal: AbortSignal.timeout(3000) });
      const slug = res.ok ? (await res.json())?.data?.slug : null;
      if (slug) clean = slug;
    } catch { /* the page itself still opens by id */ }
  }

  if (!clean) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = pathname.slice(0, pathname.lastIndexOf('/') + 1) + clean;
  return NextResponse.redirect(url, 308);
}
