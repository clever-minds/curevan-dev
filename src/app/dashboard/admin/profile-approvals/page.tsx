
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
import { FileDiff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileChangeRequest } from "@/lib/types";
import { listProfileChangeRequests, approveProfileChangeRequest, rejectProfileChangeRequest, getProfileChangeRequest } from "@/lib/repos/content";

export const dynamic = 'force-dynamic';

const ApprovalDialog = ({
  request,
  onAction
}: {
  request: ProfileChangeRequest,
  onAction: (id: string, action: 'approve' | 'reject', reason?: string) => Promise<void>
}) => {
  const [isPending, startTransition] = useTransition();
  const [rejectionReason, setRejectionReason] = useState('');
  const [fullRequest, setFullRequest] = useState<ProfileChangeRequest | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleReview = (action: 'approve' | 'reject') => {
    startTransition(async () => {
      await onAction(String(request.id), action, rejectionReason);
    });
  }

  const fetchDetails = async () => {
    if (fullRequest) return;
    setIsLoadingDetails(true);
    const data = await getProfileChangeRequest(String(request.id));
    console.log("changes data", data);
    if (data) setFullRequest(data);
    setIsLoadingDetails(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) fetchDetails();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileDiff className="mr-2 h-4 w-4" />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Profile Change</DialogTitle>
          <DialogDescription>
            Approve or reject the changes requested by {request.role === 'therapist' ? 'the therapist' : 'the patient'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
          {isLoadingDetails ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (fullRequest || request).changes?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No changes found.</div>
          ) : (fullRequest || request).changes?.map((change, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 items-start text-sm">
              <div className="font-semibold col-span-3 pb-1 border-b">{change.name || change.fieldPath}</div>
              <div className="text-muted-foreground col-span-1">Old:</div>
              <div className="col-span-2 bg-red-50 p-2 rounded-md text-red-900 line-through">
                {typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old ?? '—')}

              </div>
              <div className="text-muted-foreground col-span-1">New:</div>
              <div className="col-span-2 bg-green-50 p-2 rounded-md text-green-900">
                {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new ?? '—')}
              </div>
            </div>
          ))}
          <div className="pt-4">
            <label htmlFor="rejectionReason" className="text-sm font-medium">Reason for Rejection (Optional)</label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Mention why you are rejecting these changes..."
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="destructive" onClick={() => handleReview('reject')} disabled={isPending || isLoadingDetails}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => handleReview('approve')} disabled={isPending || isLoadingDetails}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminProfileApprovalsPage({ roleFilter }: { roleFilter?: 'therapist' | 'patient' } = {}) {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    let data = await listProfileChangeRequests();
    if (roleFilter) {
      data = data.filter(r => r.role === roleFilter);
    }
    setRequests(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const result = action === 'approve'
        ? await approveProfileChangeRequest(requestId)
        : await rejectProfileChangeRequest(requestId, reason);

      if (result.success) {
        setRequests((prev: ProfileChangeRequest[]) => prev.filter((r: ProfileChangeRequest) => String(r.id) !== String(requestId)));
        toast({
          title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: `Failed to ${action} request`,
          description: result.message,
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: `Error processing request`,
        description: err.message,
      });
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading requests...</div>;
  }

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
                <TableHead>Id</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Section Changed</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      {/* <span>{request.userId}</span> */}
                      <span className="text-xs text-muted-foreground font-mono">ID: {request.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{request.role}</Badge>
                  </TableCell>
                  <TableCell>{request.section}</TableCell>
                  <TableCell>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right">
                    <ApprovalDialog request={request} onAction={handleAction} />
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
