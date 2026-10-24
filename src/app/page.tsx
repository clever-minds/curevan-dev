import { PAGE_SEO, seoMetadata } from '@/lib/seo';
import HomePage from './home-page';

// the sheet's full title already ends with the brand, so the " | Curevan" template is not added
export const metadata = seoMetadata('/', PAGE_SEO.home, { absoluteTitle: true });

export default function Page() {
  return <HomePage />;
}
