
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationItem } from './notification-item';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import type { Notification } from '@/lib/types';
import { listNotifications } from '@/lib/repos/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
      if (!user) return; // Don't fetch if user is not logged in

      const fetchNotifications = async () => {
          setLoading(true);
          const data = await listNotifications();
          setNotifications(data);
          setLoading(false);
      }
      fetchNotifications();
  }, [user]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Notifications</h1>
        <p className="text-muted-foreground">Here's what's new. Stay up-to-date with your appointments and account activity.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
              {loading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                  ))
              ) : (
                  <div className="p-6 text-center text-muted-foreground">
                      You have no new notifications.
                  </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
