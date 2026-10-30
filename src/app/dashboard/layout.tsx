
'use client'

import { Sidebar } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { Suspense, useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarContent } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { listNotifications } from "@/lib/repos/notifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const notifs = await listNotifications();
        const unread = notifs.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (e) {
        console.error("Failed to fetch notifications for badge", e);
      }
    };
    fetchUnread();
    
    // Optional: could poll every 30-60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [user]);

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

  const getNotificationPath = () => {
    if (!user) return '/dashboard/patient/notifications';
    if (user.roles?.includes('admin.super')) return '/dashboard/admin/notifications';
    if (user.roles?.includes('admin.therapy')) return '/dashboard/therapy-admin/notifications';
    if (user.roles?.includes('admin.ecom')) return '/dashboard/ecom-admin/notifications';
    if (user.role === 'therapist') return '/dashboard/notifications';
    return '/dashboard/patient/notifications';
  };
  
  return (
    <Suspense fallback={<Skeleton className="w-full h-screen" />}>
        <div className="flex w-full max-w-full min-h-screen">
          <Sidebar>
            <SidebarContent>
              <DashboardNav />
            </SidebarContent>
          </Sidebar>
          <main className="flex-1 flex flex-col min-w-0 bg-muted/30 lg:ml-[280px]">
            <header className="flex h-14 items-center justify-end gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
               <Link href={getNotificationPath()}>
                 <Button variant="ghost" size="icon" className="relative">
                   <Bell className="h-5 w-5 text-muted-foreground" />
                   {unreadCount > 0 && (
                     <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                       {unreadCount > 99 ? '99+' : unreadCount}
                     </span>
                   )}
                 </Button>
               </Link>
            </header>
            <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
              {children}
            </div>
          </main>
        </div>
    </Suspense>
  );
}
