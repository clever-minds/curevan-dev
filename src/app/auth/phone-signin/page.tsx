
'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import the component that uses client-side hooks
const PhoneSigninForm = dynamic(
  () => import('@/components/auth/phone-signin-form').then((mod) => mod.PhoneSigninForm),
  { 
    ssr: false,
    loading: () => (
        <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }
);


export default function PhoneSigninPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-var(--header-height))] py-12">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold font-headline">Sign In with Phone</CardTitle>
                <CardDescription>
                   Enter your phone number to receive a verification code.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <PhoneSigninForm />
            </CardContent>
        </Card>
    </div>
  );
}
