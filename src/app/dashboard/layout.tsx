
'use client'

import { Sidebar } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { Suspense, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarContent } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // This effect handles redirection if the user is not logged in.
  useEffect(() => {
    // Don't do anything while auth state is loading.
    if (isLoading) {
      return;
    }
    // If loading is finished and there's no user, redirect to signin.
    if (!user) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router]);

  // While loading, show a skeleton screen.
  if (isLoading || !user) {
    return (
        <div className="flex min-h-screen">
          <Skeleton className="w-[280px] h-screen hidden lg:block" />
          <main className="flex-1 bg-muted/30 p-4 md:p-6 lg:p-8">
            <Skeleton className="h-full w-full" />
          </main>
        </div>
    );
  }
  
  return (
    <Suspense fallback={<Skeleton className="w-full h-screen" />}>
        <div className="flex min-h-screen w-full max-w-full overflow-hidden">
          <Sidebar>
            <SidebarContent>
              <DashboardNav />
            </SidebarContent>
          </Sidebar>
          <main className="flex-1 min-w-0 bg-muted/30 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
    </Suspense>
  );
}
