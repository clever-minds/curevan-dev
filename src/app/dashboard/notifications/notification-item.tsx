
'use client';

import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bell, CalendarCheck, CheckCircle, CreditCard, Star } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { markNotificationAsRead } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const notificationIcons: Record<Notification['type'], React.ElementType> = {
  booking_confirmed: CalendarCheck,
  therapist_on_way: CheckCircle,
  reminder: Bell,
  payment_receipt: CreditCard,
  new_review: Star,
  profile_approved: CheckCircle,
};

export function NotificationItem({ notification: initialNotification }: { notification: Notification }) {
  const [notification, setNotification] = useState(initialNotification);
  const Icon = notificationIcons[notification.type] || Bell;
  const router = useRouter();
  const { toast } = useToast();

  const handleNotificationClick = async () => {
    // Optimistically mark as read in the UI
    if (!notification.read) {
        setNotification(prev => ({ ...prev, read: true }));
    }

    // Call server action to mark as read in DB
    const result = await markNotificationAsRead(notification.id);
    if (!result.success) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Could not update notification status.',
        });
        // Revert optimistic update on failure
        setNotification(prev => ({ ...prev, read: false }));
    }

    // Navigate if a link is present
    if (notification.link) {
      router.push(notification.link);
    }
  };
  
  // Safely format the date
  let timeAgo = '';
  try {
    const createdAtDate = notification.createdAt ? new Date(notification.createdAt) : null;
    if (createdAtDate && !isNaN(createdAtDate.getTime())) {
      timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });
    }
  } catch (error) {
    console.error("Failed to format date for notification:", notification.id, error);
  }

  const content = (
    <div
      onClick={notification.link ? handleNotificationClick : undefined}
      className={cn(
        "flex items-start gap-4 p-4 transition-colors",
        !notification.read && "bg-primary/5",
        notification.link && "hover:bg-muted/50 cursor-pointer"
      )}
    >
      <div className="mt-1">
        <div className={cn(
            "rounded-full p-2",
            !notification.read ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold">{notification.title}</h4>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        {timeAgo && <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>}
      </div>
      {!notification.read && (
        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2" title="Unread"></div>
      )}
    </div>
  );

  return content;
}
