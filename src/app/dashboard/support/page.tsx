

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { SupportFeedbackForm } from "@/components/support-feedback-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { listSupportTickets } from "@/lib/repos/support";
import type { SupportTicket } from "@/lib/types";

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'open':
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'closed':
            return 'bg-green-100 text-green-800';
        default:
            return 'secondary';
    }
}

export default function PatientSupportPage() {
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
        const data = await listSupportTickets();
        setSupportTickets(data);
    };
    fetchTickets();
  }, []);

  return (
    <div className="space-y-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">My Support Tickets</h1>
                <p className="text-muted-foreground">View your past support tickets or create a new one.</p>
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2" />
                        Create New Ticket
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Support Ticket</DialogTitle>
                        <DialogDescription>
                            Our support team will get back to you within 24 hours.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="pt-4">
                        <SupportFeedbackForm formType="support" />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
       <Card>
        <CardHeader>
          <CardTitle>Your Tickets</CardTitle>
           <CardDescription>A list of your support requests.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
                {supportTickets.map(ticket => (
                    <div key={ticket.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <p className="font-semibold">{ticket.subject}</p>
                            <p className="text-sm text-muted-foreground">Ticket #{ticket.id} &bull; Last updated: {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge className={cn(getStatusBadgeVariant(ticket.status))}>{ticket.status}</Badge>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/support/${ticket.id}`}>View</Link>
                            </Button>
                        </div>
                    </div>
                ))}
           </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">Need help? You can also check our <Link href="/faq" className="underline">FAQ page</Link>.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
