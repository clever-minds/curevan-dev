

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/admin/FilterBar";
import { FileDiff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { ProfileChangeRequest } from "@/lib/types";
import { listProfileChangeRequests } from "@/lib/repos/content";

export const dynamic = 'force-dynamic';

export default function AdminProfileApprovalsPage() {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
        setLoading(true);
        const data = await listProfileChangeRequests();
        setRequests(data);
        setLoading(false);
    }
    fetchRequests();
  }, []);

  const handleAction = (requestId: string, action: 'approve' | 'reject') => {
    // In a real app, this would be a server action
    console.log(`Action: ${action} on request: ${requestId}`);
    setRequests(prev => prev.filter(r => r.id !== requestId));
    toast({
        title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The profile change request has been processed.`,
    });
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Profile Change Approvals</h1>
        <p className="text-muted-foreground">Review and approve changes to user profiles.</p>
      </div>

       <FilterBar showSearch showAdminUserFilters />

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests ({pendingRequests.length})</CardTitle>
          <CardDescription>Review and approve or reject profile change requests from users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Section Changed</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.userId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{request.role}</Badge>
                  </TableCell>
                  <TableCell>{request.section}</TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm"><FileDiff className="mr-2"/>Review</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAction(request.id, 'reject')}>Reject</Button>
                    <Button size="sm" onClick={() => handleAction(request.id, 'approve')}>Approve</Button>
                  </TableCell>
                </TableRow>
              ))}
               {pendingRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    No pending requests.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
