
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';
import { resolveMyDashboardHref } from '@/lib/resolveDashboard';
import { LogIn } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const testUsers: (UserProfile & { label: string })[] = [
    { uid: 'admin-super-01', email: 'admin@curevan.com', role: 'admin', roles: ['admin.super'], name: 'Curevan Super Admin', label: 'Super Admin' },
    { uid: 'admin-ecom-01', email: 'ecom@curevan.com', role: 'admin', roles: ['admin.ecom'], name: 'E-commerce Admin', label: 'E-com Admin' },
    { uid: 'admin-therapy-01', email: 'therapy@curevan.com', role: 'admin', roles: ['admin.therapy'], name: 'Therapy Admin', label: 'Therapy Admin' },
    { uid: 'therapist-01', email: 'therapist@curevan.com', role: 'therapist', roles: ['therapist'], name: 'Dr. Rafia Ma', label: 'Therapist' },
    { uid: 'patient-01', email: 'patient@curevan.com', role: 'patient', roles: ['patient'], name: 'Patient User', label: 'Patient' },
];

export function DebugLoginButtons() {
  const { login } = useAuth();
  const router = useRouter();

  const handleDebugLogin = (user: UserProfile) => {
    login(user);
    const dashboardUrl = resolveMyDashboardHref(user.roles);
    router.push(dashboardUrl);
  };

  return (
    <Card className="bg-muted/50 border-dashed">
        <CardHeader className="p-4">
            <CardTitle className="text-base">Debug Login</CardTitle>
            <CardDescription className="text-xs">Click to log in as a test user.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
             <div className="grid grid-cols-1 gap-2">
                {testUsers.map((user) => (
                    <Button
                        key={user.uid}
                        variant="outline"
                        onClick={() => handleDebugLogin(user)}
                        className="w-full justify-start"
                    >
                        <LogIn className="mr-2 h-4 w-4" />
                        Log in as {user.label}
                    </Button>
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
