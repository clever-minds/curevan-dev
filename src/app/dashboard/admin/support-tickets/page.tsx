

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
import { listSupportTickets, getSupportTicket } from "@/lib/repos/support";
import { replyToSupportTicketAction, closeSupportTicketAction } from "@/lib/actions";
import { Textarea } from "@/components/ui/textarea";
import { Send, User, Loader2, MessageSquare } from "lucide-react";
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
    const [details, setDetails] = useState<SupportTicket | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoadingDetails(true);
            const data = await getSupportTicket(ticket.id);
            if (data) {
                setDetails(data);
            }
            setLoadingDetails(false);
        };
        fetchDetails();
    }, [ticket.id]);
    
    const handleReply = (closeOnReply: boolean) => {
        if (!user || !replyText.trim()) return;
        startTransition(async () => {
            const isCreator = String(user?.id) === String(ticket?.userId);
            const data = { 
                ticketId: parseInt(ticket.id), 
                message: replyText,
                sender_type: isCreator ? 'user' : 'admin'
            };
            const result = await replyToSupportTicketAction(data);

            if (result.success) {
                if (closeOnReply) {
                    const closeResult = await closeSupportTicketAction(parseInt(ticket.id));
                    if (!closeResult.success) {
                        toast({ variant: 'destructive', title: 'Reply sent, but failed to close ticket', description: closeResult.message });
                    }
                }
                toast({ title: 'Reply Sent', description: `Ticket has been ${closeOnReply ? 'closed' : 'updated'}.` });
                setReplyText(""); // Clear the textarea
                
                // Refresh details after reply
                const updatedData = await getSupportTicket(ticket.id);
                if (updatedData) setDetails(updatedData);
                
                onUpdate();
            } else {
                toast({ variant: 'destructive', title: 'Failed to send reply', description: result.message });
            }
        });
    }

    const currentTicket = details || ticket;

    return (
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle className="text-2xl pt-2">Ticket #{currentTicket.id}: {currentTicket.subject}</DialogTitle>
                <DialogDescription className="text-base py-1">
                    From: {currentTicket.userId} | Title: <Badge variant="outline" className="font-normal text-sm">{currentTicket.subject}</Badge> | Status: <Badge className={cn("text-sm py-1 px-3", getStatusBadgeVariant(currentTicket.status))}>{currentTicket.status}</Badge>
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6 py-4">
                {currentTicket.message && (
                    <div className="flex flex-col items-end text-xs rounded-xl bg-primary text-primary-foreground p-5 mb-5 shadow-md w-fit ml-auto">
                        <p className="font-bold mb-1 text-lg border-b border-primary-foreground/20 pb-1 w-full">Original Request:</p>
                        <p className="whitespace-pre-wrap text-lg pt-1">{currentTicket.message}</p>
                    </div>
                )}
                
                {loadingDetails ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-3/4" />
                        <Skeleton className="h-20 w-3/4 ml-auto" />
                    </div>
                ) : (
                    <>
                        {currentTicket.messages?.map((msg, index) => (
                            <div key={index} className={cn("flex flex-col mb-6", msg.by === 'user' ? 'items-end' : 'items-start')}>
                                <p className="text-base font-semibold mb-2 flex items-center gap-2">
                                    {msg.by === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                                    {msg.by === 'user' ? 'User' : 'Admin'}
                                </p>
                                <div className={cn(
                                    "p-5 rounded-xl max-w-lg shadow-md w-fit",
                                    msg.by === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted mr-auto'
                                )}>
                                    <p className="text-lg whitespace-pre-wrap">{msg.text}</p>
                                    <p className={cn("text-sm opacity-70 mt-2", msg.by === 'user' ? 'text-right' : 'text-left')}>
                                        {msg.at ? new Date(msg.at).toLocaleString() : 'Just now'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!currentTicket.messages || currentTicket.messages.length === 0) && (
                            <p className="text-sm text-muted-foreground italic">No message history available.</p>
                        )}
                    </>
                )}
            </div>
            <div className="pt-6 space-y-4 border-t">
                <Textarea 
                    placeholder="Type your reply..." 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)} 
                    rows={8}
                    className="text-lg p-5"
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
