'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/api/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function performVerification() {
      if (!token) {
        setStatus('error');
        setErrorMessage('Verification token is missing.');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified. Redirecting to Sign In...",
        });
        
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?verified=true');
        }, 3000);
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to verify email. The link may have expired.');
      }
    }

    performVerification();
  }, [token, router, toast]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-var(--header-height))] py-12 px-4">
      <Card className="w-full max-w-md border-2 border-primary/10 shadow-xl overflow-hidden">
        <div className="h-2 bg-primary animate-pulse" />
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold font-headline">Email Verification</CardTitle>
          <CardDescription>
            Validating your account access.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <Loader2 className="h-16 w-16 text-primary animate-spin relative" />
              </div>
              <p className="text-lg font-medium animate-pulse text-muted-foreground italic">
                Verifying your email...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/30">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-green-600 dark:text-green-400">Success!</h3>
                <p className="text-muted-foreground max-w-[280px]">
                  Your email has been verified. You're being redirected to the sign-in page.
                </p>
              </div>
              <Button asChild className="mt-4 ring-offset-2 ring-primary">
                <Link href="/auth/signin">Sign In Now</Link>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/30">
                <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-red-600 dark:text-red-400">Verification Failed</h3>
                <p className="text-red-500/80 font-medium">
                  {errorMessage}
                </p>
                <p className="text-sm text-muted-foreground max-w-[280px] mt-2">
                  Try requesting another verification email from your account settings.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/auth/signin">Go to Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">Support</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
