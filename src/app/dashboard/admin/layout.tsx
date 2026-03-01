
'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      // Still loading user, do nothing yet
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard/account'); // Or a dedicated "access-denied" page
    }
  }, [user, router]);

  if (!user) {
    // You can show a loading state or a skeleton screen while checking auth
    return <Skeleton className="w-full h-screen" />;
  }

  if (user.role !== 'admin') {
     return (
       <Card className="m-8">
        <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to view this page. Redirecting...</p>
        </CardContent>
       </Card>
     )
  }

  return (
    <div className="space-y-6">
        {children}
    </div>
  );
}
