
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { LogIn, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { resolveMyDashboardHref } from '@/lib/resolveDashboard';
import Link from 'next/link';
import { signInWithEmailAndPassword } from '@/lib/api/auth';
import { getUserProfile } from '@/lib/api/auth';

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
    try {
      const userCredential = await signInWithEmailAndPassword(data.email, data.password);
      const user = userCredential.user;
      if (!user?.token) {
        throw new Error("Auth token missing after login");
      }
      const token = user.token; // ✅ use directly
      document.cookie = `token=${user.token}; path=/;`;
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

      router.push(redirectUrl || resolveMyDashboardHref(userProfile.roles));

    } catch (error: any) {
      console.error("Firebase Sign In Error:", error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'Invalid credentials. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Link href="/auth/forgot-password" passHref legacyBehavior>
                  <a className="text-sm font-medium text-primary hover:underline">
                    Forgot Password?
                  </a>
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
