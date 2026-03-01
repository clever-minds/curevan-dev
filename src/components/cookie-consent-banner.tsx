
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Cookie } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check localStorage only on the client side after the component has mounted.
    // This prevents hydration mismatches.
    const consent = localStorage.getItem('cookie-consent');
    if (consent === null) {
      // Only show the banner if no choice has been made.
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'granted');
    setShowBanner(false);
    // Here you would typically initialize analytics scripts like Google Analytics
    // For example: window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'denied');
    setShowBanner(false);
     // Here you would deny analytics scripts
    // For example: window.gtag('consent', 'update', { 'analytics_storage': 'denied' });
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[200] w-full p-4",
        "transition-transform duration-500 ease-in-out",
        showBanner ? "translate-y-0" : "translate-y-full"
    )}>
       <div className="container mx-auto">
            <div className="p-4 bg-background border rounded-lg shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Cookie className="w-6 h-6 text-primary flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies. Read our{' '}
                        <Link href="/legal/cookie-policy" className="underline font-semibold hover:text-primary">
                            Cookie Policy
                        </Link>
                        .
                    </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" onClick={handleDecline}>
                        Decline
                    </Button>
                    <Button onClick={handleAccept}>Accept</Button>
                </div>
            </div>
       </div>
    </div>
  );
}
