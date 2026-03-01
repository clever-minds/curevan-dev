'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,35.638,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

export function SocialSigninButtons() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Next.js ka use karo
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  useEffect(() => {
    // ✅ Next.js searchParams se token read karo
    const token = searchParams.get('token');
    
    console.log('🔍 SearchParams token:', token);
    console.log('🔍 Window URL:', window.location.href);

    if (token) {
      console.log('✅ Token found!');
      
      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);
      console.log('✅ Token stored');

      // Show toast
      toast({
        title: 'Login Successful! 🎉',
        description: 'Welcome back!'
      });

      // Clean URL aur redirect
      window.history.replaceState({}, '', '/dashboard/account');
      
      setTimeout(() => {
        console.log('✅ Navigating to dashboard...');
        router.push('/dashboard/account');
      }, 800);
    }
  }, [searchParams, toast, router]);

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogleLogin}
        className="w-full"
        variant="outline"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <GoogleIcon />
            <span className="ml-2">Continue with Google</span>
          </>
        )}
      </Button>
    </div>
  );
}