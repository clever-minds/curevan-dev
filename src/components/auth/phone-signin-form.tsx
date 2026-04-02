
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, sendOTP } from '@/lib/firebase'; // make sure this exists
import { loginWithOTP } from '@/lib/api/auth';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CardDescription } from '../ui/card';
import { resolveMyDashboardHref } from '@/lib/resolveDashboard';
import { getUserProfile } from '@/lib/api/auth';

const phoneSchema = z.object({
  phoneNumber: z.string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^\d+$/, 'Only digits allowed'),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;


export function PhoneSigninForm() {
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: '',
    },
});

  useEffect(() => {
    if (typeof window === 'undefined' || !auth) return;

    if (!recaptchaVerifierRef.current) {
      try {
        const { setupRecaptcha } = require('@/lib/firebase');
        recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container');
        console.log("reCAPTCHA initialized on mount.");
      } catch (error) {
        console.error("Error initializing reCAPTCHA:", error);
      }
    }
    
    return () => {
        if (recaptchaVerifierRef.current) {
            const { resetRecaptcha } = require('@/lib/firebase');
            resetRecaptcha();
            recaptchaVerifierRef.current = null;
            console.log("reCAPTCHA cleaned up on unmount.");
        }
    };
  }, []);

 // 🔹 Send OTP
  const handleSendOTP = async (data: PhoneFormValues) => {
    setLoading(true);
    try {
      // 1️⃣ Check backend if number exists
     const checkData = await loginWithOTP({
            phoneNumber: `+91${data.phoneNumber}`
            });
    
      if (!checkData.success)
        throw new Error(checkData.error || 'Phone number not registered');

      // 2️⃣ Send OTP via Firebase
      const formattedPhone = `+91${data.phoneNumber}`;

      confirmationResultRef.current = await sendOTP(formattedPhone);
  if (confirmationResultRef.current) {
      setOtpSent(true);
      toast({
        title: 'OTP Sent!',
        description: `OTP sent to ${formattedPhone}`,
      });
    }
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResultRef.current) return;

    setLoading(true);
    try {
      const result = await confirmationResultRef.current.confirm(otp);
      const phoneNumber = result.user.phoneNumber;

      // 3️⃣ Call backend to generate JWT
     const data = await loginWithOTP({
                phoneNumber: phoneNumber || '',
                verifyOtp: true,
                });
      if (!data.success) throw new Error(data.error || 'Failed to login');
      const token=data.token;
      const userProfile = await getUserProfile(token);
      if (!userProfile) {
          throw new Error("User profile not found. Please contact support.");
      }
      login(userProfile);
      
      toast({ title: 'Signed in!', description: 'Welcome!' });
      const redirectUrl = searchParams.get('redirectUrl');
      
      // Resolve role-specific dashboard link
      const roles = Array.isArray(userProfile.role) ? userProfile.role : [userProfile.role].filter(Boolean) as string[];
      const dashboardHref = resolveMyDashboardHref(roles);
      
      router.push(redirectUrl || dashboardHref);
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Invalid OTP', description: err.message });
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
        {!otpSent ? (
            <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(handleSendOTP)} className="space-y-4">
                    <FormField
                        control={phoneForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold border-r pr-3">+91</span>
                                    <Input 
                                        id="phone" 
                                        type="tel"
                                        placeholder="9876543210"
                                        className="pl-16 h-12 text-lg font-medium tracking-wider"
                                        maxLength={10}
                                        {...field}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) {
                                                field.onChange(val);
                                            }
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={loading || !auth}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                        Send OTP
                    </Button>
                </form>
            </Form>
        ) : (
            <>
                <CardDescription>
                    Enter the OTP sent to your phone.
                </CardDescription>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input 
                            id="otp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                        Verify & Sign In
                    </Button>
                </form>
            </>
        )}
        <div id="recaptcha-container"></div>
        <p className="text-center text-sm text-muted-foreground">
        Prefer another method?{' '}
        <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
            Sign In with Email
        </Link>
        </p>
    </>
  );
}
