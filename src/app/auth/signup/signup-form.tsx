
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from '@/lib/api/auth';;
import { useRouter } from 'next/navigation';
import { createUserProfile } from '@/services/firestore-service';
import Link from 'next/link';
import { PasswordStrengthInput } from '@/components/auth/password-strength-input';

const signupFormSchema = z.object({
  fullName: z.string().min(1, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email address.'),
  mobile: z.string().min(10, 'Please enter a valid mobile number.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
    },
  });

  async function onSubmit(data: SignupFormValues) {
    
    setLoading(true);
    try {
const userCredential = await createUserWithEmailAndPassword({email: data.email,password: data.password,name: data.fullName,phone: data.mobile,role: 'patient',roles: ['patient']});      const user = userCredential.user;
      
      // await createUserProfile({
      //   uid: user.uid,
      //   email: data.email,
      //   name: data.fullName,
      //   phone: data.mobile,
      //   role: 'patient',
      //   roles: ['patient'],
      // });

      toast({
        title: 'Account Created!',
        description: 'You have successfully signed up. Please sign in to continue.',
      });

      router.push('/auth/signin');

    } catch (error: any) {
        console.error("Firebase Sign Up Error:", error);
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: error.code === 'auth/email-already-in-use'
              ? 'An account with this email already exists.'
              : error.message || 'An unexpected error occurred. Please try again.'
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Your mobile number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <PasswordStrengthInput />

        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referral Code (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter referral code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormDescription className="text-xs text-muted-foreground">
          By clicking Sign Up, you agree to our{' '}
          <Link href="/legal/terms-of-use" className="underline hover:text-primary">
            Terms of Use
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy-policy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
          .
        </FormDescription>

        <Button type="submit" className="w-full" disabled={loading || !form.formState.isValid}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Sign Up with Email
        </Button>
      </form>
    </Form>
  );
}
