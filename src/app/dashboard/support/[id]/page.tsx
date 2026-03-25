
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getSupportTicket,
} from '@/lib/repos/support';
import { replyToSupportTicketAction, closeSupportTicketAction } from '@/lib/actions';
import { SupportTicket } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, ArrowLeft, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from "@/context/auth-context";

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const fetchTicket = async () => {
    try {
      const data = await getSupportTicket(id as string);
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load ticket details.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    startTransition(async () => {
      const isCreator = String(user?.id) === String(ticket?.userId);
      console.log("DEBUG: isCreator check", { userId: user?.id, ticketUserId: ticket?.userId, result: isCreator });
      const data = {
        ticketId: Number(ticket?.id),
        message: replyMessage,
        sender_type: isCreator ? 'user' : 'admin'
      };
      const result = await replyToSupportTicketAction(data);
      if (result.success) {
        setReplyMessage('');
        fetchTicket(); // Refresh ticket to show new message
        toast({
          title: 'Reply Sent',
          description: 'Your reply has been added to the ticket.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message || 'Failed to send reply.',
        });
      }
    });
  };

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;

    startTransition(async () => {
      const result = await closeSupportTicketAction(Number(ticket?.id));
      if (result.success) {
        fetchTicket();
        toast({
          title: 'Ticket Closed',
          description: 'The ticket has been marked as closed.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message || 'Failed to close ticket.',
        });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h2 className="text-xl font-semibold">Ticket Not Found</h2>
            <p className="text-muted-foreground mt-2">The ticket you are looking for does not exist or you do not have permission to view it.</p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/dashboard/support"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4" />;
      case 'closed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'pending': return 'secondary';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="w-full px-4 py-2 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight font-headline">{ticket.subject || ticket.support_subject}</h1>
          <Badge variant={getStatusVariant(ticket.status)} className="capitalize flex items-center gap-1 text-sm py-1 px-3">
            {getStatusIcon(ticket.status)}
            {ticket.status}
          </Badge>
          <span className="text-muted-foreground text-sm">
            Created on {format(new Date(ticket.createdAt || Date.now()), 'PPP')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {ticket.status !== 'closed' && user?.role === 'admin' && (
            <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
              Close Ticket
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/support"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Support</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b py-3">
          <CardDescription className="text-1xl  font-bold">
            Ticket <span className="text-1xl  font-bold text-primary">#{ticket.id}</span>
          </CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 pt-6 border-t px-6">
          {ticket.bookingId && (
            <div>
              <p className="text-lg uppercase font-bold">Booking ID</p>
              <p className="text-base font-medium mt-1">#{ticket.bookingId}</p>
            </div>
          )}
          {ticket.orderId && (
            <div>
              <p className="text-lg uppercase font-bold">Order ID</p>
              <p className="text-base font-medium mt-1">#{ticket.orderId}</p>
            </div>
          )}
        </div>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] p-6 lg:h-[800px]">
            <div className="space-y-6">
              {/* Initial message display with fallbacks for message / description */}
              {(ticket.message || ticket.description || ticket.support_description) && (
                <div className="flex gap-4 max-w-[90%] ml-auto flex-row-reverse">
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarFallback className="bg-primary text-primary-foreground text-base">U</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 flex flex-col items-end">
                    <div className="rounded-xl p-5 text-lg bg-primary text-primary-foreground shadow-md w-fit">
                      {ticket.message}
                    </div>
                    <p className="text-sm text-muted-foreground">Original Request • {format(new Date(ticket.createdAt || Date.now()), 'p, MMM d')}</p>
                  </div>
                </div>
              )}
              {(() => { console.log("DEBUG: Messages in render", user?.id, ticket.messages); return null; })()}
              {ticket.messages?.map((msg, index) => (
                <div key={index} className={cn(
                  "flex gap-4 max-w-[90%]",
                  msg.by === 'user' ? "ml-auto flex-row-reverse" : ""
                )}>
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarFallback className={cn(
                      "text-base",
                      msg.by === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {msg.by === 'user' ? 'U' : 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "space-y-2 flex flex-col",
                    msg.by === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "rounded-xl p-5 text-lg shadow-md w-fit",
                      msg.by === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {msg.text}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {msg.by === 'admin' ? 'Support Agent' : 'You'} • {format(new Date(msg.at), 'p, MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        {ticket.status !== 'closed' && (
          <CardFooter className="border-t p-6">
            <form onSubmit={handleReply} className="flex w-full gap-3">
              <Textarea
                placeholder="Type your reply here..."
                className="min-h-[200px] resize-none text-lg p-5"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                disabled={isPending}
              />
              <Button type="submit" size="icon" className="h-[100px] w-[100px]" disabled={isPending || !replyMessage.trim()}>
                {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
              </Button>
            </form>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
