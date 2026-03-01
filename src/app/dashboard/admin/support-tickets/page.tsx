

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn, getSafeDate } from "@/lib/utils";
import { FilterBar } from "@/components/admin/FilterBar";
import { useMemo, useState, useEffect, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from '@/hooks/use-is-mobile';
import type { SupportTicket } from "@/lib/types";
import { listSupportTickets, updateSupportTicket } from "@/lib/repos/support";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

export const dynamic = 'force-dynamic';

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'open':
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'closed':
            return 'bg-green-100 text-green-800';
        case 'escalated':
            return 'bg-red-100 text-red-800';
        default:
            return 'secondary';
    }
}

const TicketViewDialog = ({ ticket, onUpdate }: { ticket: SupportTicket, onUpdate: () => void }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [replyText, setReplyText] = useState("");
    const [isPending, startTransition] = useTransition();
    
    const handleReply = (closeOnReply: boolean) => {
        if (!user || !replyText.trim()) return;
        startTransition(async () => {
            const newMessage = {
                by: 'admin' as const,
                at: new Date().toISOString(),
                text: replyText
            };

            const updateData: Partial<SupportTicket> = {
                messages: [...(ticket.messages || []), newMessage],
            };

            if (closeOnReply) {
                updateData.status = 'closed';
                updateData.closedBy = user.uid;
                updateData.closedAt = new Date().toISOString();
            } else {
                updateData.status = 'pending';
            }

            const result = await updateSupportTicket(ticket.id, updateData);

            if (result.success) {
                toast({ title: 'Reply Sent', description: `Ticket has been ${closeOnReply ? 'closed' : 'updated'}.` });
                setReplyText(""); // Clear the textarea
                onUpdate();
            } else {
                toast({ variant: 'destructive', title: 'Failed to send reply', description: result.error });
            }
        });
    }

    return (
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Ticket #{ticket.id}: {ticket.subject}</DialogTitle>
                <DialogDescription>
                    From: {ticket.userId} | Topic: <Badge variant="outline">{ticket.topic}</Badge> | Status: <Badge className={cn(getStatusBadgeVariant(ticket.status))}>{ticket.status}</Badge>
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-y-auto pr-4 space-y-4">
                {ticket.messages?.map((msg, index) => (
                    <div key={index} className={cn("flex flex-col", msg.by === 'user' ? 'items-start' : 'items-end')}>
                        <p className="text-xs font-semibold mb-1">{msg.by === 'user' ? ticket.userId : 'Admin'}</p>
                        <div className={cn(
                            "p-3 rounded-lg max-w-sm",
                            msg.by === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground'
                        )}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <p className="text-xs opacity-70 mt-2 text-right">{new Date(msg.at).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {(!ticket.messages || ticket.messages.length === 0) && (
                    <p className="text-sm text-muted-foreground">No message history available.</p>
                )}
            </div>
            <Separator />
            <div className="pt-4 space-y-4">
                <Textarea 
                    placeholder="Type your reply..." 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)} 
                    rows={4}
                    disabled={ticket.status === 'closed'}
                />
                <div className="flex justify-between items-center gap-2">
                     <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                     </DialogClose>
                    <div className="flex gap-2">
                        <Button onClick={() => handleReply(false)} disabled={!replyText || isPending || ticket.status === 'closed'}>
                            {isPending && <Loader2 className="mr-2 animate-spin" />} Send Reply
                        </Button>
                        <DialogClose asChild>
                             <Button onClick={() => handleReply(true)} disabled={!replyText || isPending || ticket.status === 'closed'}>
                                {isPending && <Loader2 className="mr-2 animate-spin" />} Send Reply and Close
                            </Button>
                        </DialogClose>
                    </div>
                </div>
            </div>
        </DialogContent>
    )
}

const TicketCard = ({ ticket, onUpdate }: { ticket: SupportTicket, onUpdate: () => void }) => (
    <Card>
        <CardHeader>
             <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-base">{ticket.subject}</CardTitle>
                    <CardDescription>Ticket #{ticket.id} &bull; Last updated: {getSafeDate(ticket.updatedAt)?.toLocaleDateString()}</CardDescription>
                </div>
                 <Badge className={cn(getStatusBadgeVariant(ticket.status))}>{ticket.status}</Badge>
            </div>
        </CardHeader>
        <CardContent>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">View Ticket</Button>
                </DialogTrigger>
                <TicketViewDialog ticket={ticket} onUpdate={onUpdate} />
            </Dialog>
        </CardContent>
    </Card>
)

export default function AdminSupportTicketsPage() {
  const [filters, setFilters] = useState({});
  const isMobile = useIsMobile();
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
      setLoading(true);
      const data = await listSupportTickets(filters);
      setSupportTickets(data);
      setLoading(false);
  };
  
  useEffect(() => {
    fetchTickets();
  }, [filters]);

  if (loading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Support Tickets</h1>
        <p className="text-muted-foreground">View and manage all user support tickets.</p>
      </div>

       <FilterBar showDatePicker showSearch showSupportTicketFilters onFilterChange={setFilters} />
      
       {isMobile ? (
        <div className="space-y-4">
            {supportTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onUpdate={fetchTickets} />)}
        </div>
       ) : (
        <Card>
            <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>A list of all support requests from users.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {supportTickets.map(ticket => (
                    <TableRow key={ticket.id}>
                        <TableCell className="font-mono">{ticket.id}</TableCell>
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell>{ticket.userId}</TableCell>
                        <TableCell><Badge variant="outline">{ticket.topic}</Badge></TableCell>
                        <TableCell><Badge className={cn(getStatusBadgeVariant(ticket.status))}>{ticket.status}</Badge></TableCell>
                        <TableCell>{getSafeDate(ticket.updatedAt)?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">View</Button>
                                </DialogTrigger>
                                <TicketViewDialog ticket={ticket} onUpdate={fetchTickets} />
                            </Dialog>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
       )}
    </div>
  );
}
