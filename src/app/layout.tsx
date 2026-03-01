
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import GoogleAnalytics from '@/components/google-analytics';
import BottomNav from '@/components/bottom-nav';
import { AIChatAssistant } from '@/components/ai-chat-assistant';
import { Suspense } from 'react';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { LocationConsentDialog } from '@/components/location-consent-dialog';

export const metadata: Metadata = {
  title: {
    default: 'In-Home Physiotherapy & Care | Curevan',
    template: '%s | Curevan',
  },
  description: 'Curevan offers professional, in-home physiotherapy, nursing, and wellness services. Find certified therapists, book appointments, and shop for medical supplies online.',
  keywords: ['physiotherapy at home', 'home nursing services', 'therapist booking', 'medical supplies online', 'Curevan', 'telehealth'],
  openGraph: {
    title: 'Curevan | In-Home Physiotherapy, Nursing Care & Wellness Products',
    description: 'Convenient and professional healthcare services and products, delivered to your doorstep.',
    url: 'https://www.curevan.com',
    siteName: 'Curevan',
    // images: [
    //   {
    //     url: 'https://www.curevan.com/og-image.png', // Add a default OG image
    //     width: 1200,
    //     height: 630,
    //   },
    // ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased flex flex-col')}>
        <Suspense fallback={null}>
          <AuthProvider>
            <CartProvider>
              <Header />
              <main className="flex-1 pb-16 lg:pb-0 relative">
                 <Suspense fallback={null}>{children}</Suspense>
              </main>
              <Footer />
              <Toaster />
              <BottomNav />
              <AIChatAssistant />
              <CookieConsentBanner />
              <LocationConsentDialog/>
            </CartProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
