// Page titles and meta descriptions, taken from Curevan_SEO_Page_Titles.xlsx.
// Titles are written WITHOUT " | Curevan": the root layout's title template adds it (the home page uses title.absolute).
import type { Metadata } from 'next';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.curevan.com').replace(/\/$/, '');

type Seo = { title: string; description: string };

export const PAGE_SEO = {
  home: { title: "Curevan – Cure. Anywhere. | Home Therapy & Medical Devices", description: "Book physiotherapy, geriatric care, speech & other therapies, nursing and wellness care at home. Shop medical devices, therapy equipment & kits online." },
  about: { title: "About Us – Continuous Care at Home", description: "Curevan, a Himaya Care brand, brings verified therapists, standard care protocols and tracked outcomes to home healthcare. See how we make care continuous." },
  discover: { title: "Book Home Therapy & Nursing Visits", description: "Book physiotherapy, elder care, speech therapy, neuro rehab or nursing at home. Filter by location and specialty and get matched with a verified therapist." },
  therapists: { title: "Verified Home Therapists & Nurses", description: "Browse verified physiotherapists, speech therapists, nurses and elder care experts who visit your home. Compare specialties and book online." },
  ecommerce: { title: "Shop Medical Devices & Therapy Equipment", description: "Buy TENS/EMS electrode pads, balance boards, rehab equipment, therapist kits and medical apparel online. Used by Curevan therapists, delivered to you." },
  journal: { title: "Health Journal – Exercises & Home Care Tips", description: "Expert articles from Curevan therapists: exercises for back and knee pain, post-surgery recovery, elder care tips and guides to using therapy devices at home." },
  contact: { title: "Contact Us – Home Therapy & Care, Vadodara", description: "Call +91 951 444 6292 or email care@curevan.com to book home therapy, nursing or order medical devices. Office: Time Square, Vasna-Bhayli Road, Vadodara." },
  joinAsTherapist: { title: "Join as a Therapist – Earn with Home Visits", description: "Physiotherapists, nurses and therapists: join Curevan free, keep 100% of patient payments* and get home-visit bookings near you. Premium plans available." },
} satisfies Record<string, Seo>;

/** Therapy category pages, by category slug. */
export const CATEGORY_SEO: Record<string, Seo> = {
  "post-surgery-rehab": { title: "Post-Surgery Rehabilitation at Home", description: "Recover faster after knee, hip, spine or other surgery with a physiotherapist at home. Goal-based rehab plans with progress tracked every session." },
  "neuro-rehab": { title: "Neuro Rehab at Home – Stroke & Parkinson's", description: "Home neuro rehab for stroke, Parkinson's, spinal cord injury and other neurological conditions. Therapist visits with a care plan and tracked progress." },
  "respiratory-therapy": { title: "Respiratory Therapy at Home – Chest Physio", description: "Chest physiotherapy and breathing exercises at home for COPD, asthma and post-surgery recovery. Book a verified respiratory therapist." },
  "postpartum-care": { title: "Postpartum Care & Physiotherapy at Home", description: "Postnatal physiotherapy and care at home for new mothers – pelvic floor recovery, back pain relief and safe return to fitness, by verified experts." },
  "elder-care": { title: "Elder Care at Home – Geriatric Physio & Nursing", description: "Geriatric care at home for seniors – mobility and fall-prevention physiotherapy, nursing support and daily care by trained, verified professionals." },
  "nursing-care": { title: "Home Nursing Care – Qualified Nurses at Home", description: "Qualified nurses at home for wound dressing, injections, IV care, post-operative care and elderly support. Book a verified home nurse on Curevan." },
  "speech-therapy": { title: "Speech Therapy at Home – Children & Adults", description: "Speech and language therapy at home for children and adults – speech delay, stammering, and speech recovery after stroke. Book a verified speech therapist." },
  "occupational-therapy": { title: "Occupational Therapy & Wellness at Home", description: "Occupational therapy and wellness sessions at home to rebuild daily-living skills, ergonomics and independence after injury, illness or surgery." },
};

/** Legal pages, by their last path segment. */
export const LEGAL_SEO: Record<string, Seo> = {
  "terms-of-use": { title: "Terms of Use", description: "Terms that apply when you book home therapy, nursing or buy products on Curevan, operated by Himaya Care Pvt. Ltd." },
  "privacy-policy": { title: "Privacy Policy", description: "How Curevan collects, uses and protects your personal and health data when you book care or shop with us." },
  "refund-policy": { title: "Refund & Cancellation Policy", description: "Curevan's rules for cancelling or rescheduling home visits and for returns and refunds on shop orders." },
  "medical-consent": { title: "Medical Consent", description: "The consent you give before receiving home therapy or nursing care through Curevan professionals." },
  "marketing-consent": { title: "Marketing Consent", description: "How Curevan contacts you with offers and updates, and how to opt out at any time." },
  "cookie-policy": { title: "Cookie Policy", description: "Which cookies Curevan uses, why, and how you can manage them in your browser." },
  "therapist-conduct": { title: "Therapist Code of Conduct", description: "The professional and ethical standards every Curevan therapist and nurse agrees to follow on home visits." },
};

/** Metadata for a page: the sheet's title and description, the canonical link, and the same text for link previews. */
export function seoMetadata(path: string, seo: Seo, opts: { absoluteTitle?: boolean } = {}): Metadata {
  const title = opts.absoluteTitle ? { absolute: seo.title } : seo.title;
  return {
    title,
    description: seo.description,
    alternates: { canonical: path },
    openGraph: { title: seo.title, description: seo.description, url: `${SITE_URL}${path}`, siteName: 'Curevan', type: 'website' },
  };
}

// 60 characters in all (the sheet's limit): "[name] – Buy Online | Curevan", else without "Buy Online", else the name cut with "…"
export function productTitle(name: string) {
  const full = `${name} – Buy Online | Curevan`;
  if (full.length <= 60) return full;
  const short = `${name} | Curevan`;
  return short.length <= 60 ? short : `${name.slice(0, 60 - ' | Curevan'.length - 1).trimEnd()}… | Curevan`;
}
