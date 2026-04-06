'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCcw, Home, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

export default function SigninError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Signin Boundary Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-var(--header-height))] py-12 px-4 relative overflow-hidden">
      {/* Premium background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

      <Card className="w-full max-w-lg border-none shadow-2xl bg-background/60 backdrop-blur-xl ring-1 ring-white/20 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-destructive/5">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline tracking-tight">Authentication Error</CardTitle>
          <CardDescription className="text-lg mt-2">
            Something went wrong while trying to sign you in.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-6 mb-6">
            <p className="text-sm font-mono text-destructive/80 break-words leading-relaxed text-center italic">
              "{error.message || 'An unexpected error occurred during the sign-in process.'}"
            </p>
            {error.digest && (
              <p className="text-[10px] text-muted-foreground text-center mt-3 uppercase tracking-widest font-bold opacity-50">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={() => reset()} 
              variant="default" 
              className="w-full h-12 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-95"
            >
              <RefreshCcw className="mr-2 w-4 h-4" /> Try Again
            </Button>
            <Button asChild variant="outline" className="w-full h-12 hover:bg-background/80 transition-all hover:scale-[1.02] active:scale-95">
              <Link href="/">
                <Home className="mr-2 w-4 h-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-white/10 bg-white/5 p-6 rounded-b-2xl items-center">
            <p className="text-xs text-muted-foreground font-medium text-center">
              Still having trouble? Our support team is here to help.
            </p>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                <Link href="/support">
                    <LifeBuoy className="mr-2 w-3 h-3" /> Get Support
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
