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
    console.error('Signin Boundary Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] py-12 px-4 relative">
      <Card className="w-full max-w-lg border overflow-hidden shadow-xl animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Authentication Error</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Something went wrong while trying to sign you in.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-4 mb-6">
            <p className="text-xs font-mono text-destructive/80 break-words text-center italic leading-relaxed">
              {error.message || 'An unexpected error occurred during the sign-in process.'}
            </p>
            {error.digest && (
              <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-50 uppercase tracking-tighter">
                Ref: {error.digest}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={() => reset()} 
              variant="default" 
              className="w-full"
            >
              <RefreshCcw className="mr-2 w-4 h-4" /> Try Again
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 w-4 h-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t bg-muted/30 p-4 items-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              Still having trouble?
            </p>
            <Button asChild variant="link" size="sm" className="text-primary text-xs">
                <Link href="/support">
                    <LifeBuoy className="mr-2 w-3 h-3" /> Contact Support
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
