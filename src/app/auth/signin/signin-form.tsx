
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { resolveMyDashboardHref } from '@/lib/resolveDashboard';
import Link from 'next/link';
import { signInWithEmailAndPassword, getUserProfile } from '@/lib/api/auth';

const signinFormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type SigninFormValues = z.infer<typeof signinFormSchema>;

export function SigninForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Success toast for email verification
  const hasShownVerifiedToast = useRef(false);
  useEffect(() => {
    if (searchParams.get('verified') === 'true' && !hasShownVerifiedToast.current) {
        toast({
            title: "Email Verified Successfully!",
            description: "You can now sign in to your account.",
            variant: "default",
        });
        hasShownVerifiedToast.current = true;
    }
  }, [searchParams, toast]);

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SigninFormValues) {
    // if (!auth) {
    //   toast({
    //     variant: 'destructive',
    //     title: 'Authentication service not ready',
    //     description: 'Please wait a moment and try again.'
    //   });
    //   return;
    // }
    setLoading(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(data.email, data.password);
      const user = userCredential.user;
      if (!user?.token) {
        throw new Error("Auth token missing after login");
      }
      const token = user.token; // ✅ use directly
      document.cookie = `token=${user.token}; path=/; max-age=31536000;`; // 1 year
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', user.token);
      }
      const userProfile = await getUserProfile(token);
      console.log("userProfile",userProfile);
      if (!userProfile) {
        throw new Error("User profile not found. Please contact support.");
      }

      login(userProfile);

      toast({
        title: 'Sign In Successful',
        description: `Welcome back, ${userProfile.name}!`,
      });

      const redirectUrl = searchParams.get('redirectUrl');

      // Resolve role-specific dashboard link
      const roles = Array.isArray(userProfile.role) ? userProfile.role : [userProfile.role].filter(Boolean) as string[];
      const dashboardHref = resolveMyDashboardHref(roles);

      router.push(redirectUrl || dashboardHref);

    } catch (error: any) {
      console.error("Firebase Sign In Error:", error);
      const errorMessage = error.message || 'Invalid credentials. Please try again.';
      setAuthError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {authError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-destructive">Unable to Sign In</p>
              <p className="text-xs text-destructive/80 leading-relaxed font-medium">
                {authError}
              </p>
              <button 
                type="button"
                onClick={() => setAuthError(null)}
                className="text-[10px] font-bold uppercase tracking-widest text-destructive/60 hover:text-destructive transition-colors mt-2"
              >
                Dismiss
              </button>
            </div>
            <button onClick={() => setAuthError(null)} type="button">
              <XCircle className="w-4 h-4 text-destructive/40 hover:text-destructive transition-colors" />
            </button>
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link href="/auth/forgot-password"  className="text-sm font-medium text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
          Sign In
        </Button>
      </form>
    </Form>
  );
}
