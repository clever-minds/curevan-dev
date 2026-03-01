
'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveMyDashboardHref } from "@/lib/resolveDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const dashboardUrl = resolveMyDashboardHref(user.roles);
      router.replace(dashboardUrl);
    }
  }, [user, router]);

  // Show a loading skeleton while we wait for the user and redirect.
  return <Skeleton className="w-full h-screen" />;
}
