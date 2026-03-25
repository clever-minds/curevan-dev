
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, FileDiff, FileDown, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useEffect, useState, useTransition } from "react";
import type { ProfileChangeRequest, UserProfile, Therapist } from "@/lib/types";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { FilterBar } from "@/components/admin/FilterBar";
import { getProfileChangeRequest, listProfileChangeRequests } from "@/lib/repos/content";
import { listUsers } from "@/lib/repos/users";
import { getSafeDate, downloadCsv } from "@/lib/utils";
import { listTherapists } from "@/lib/repos/therapists";
import { useToast } from "@/hooks/use-toast";
import { reviewProfileChangeRequest } from "@/lib/actions";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { getTherapistById } from "@/lib/repos/therapists";


export const dynamic = 'force-dynamic';

const ApprovalDialog = ({ request, onAction }: { request: ProfileChangeRequest, onAction: () => void }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [rejectionReason, setRejectionReason] = useState('');
  const [fullRequest, setFullRequest] = useState<ProfileChangeRequest | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleReview = (action: 'approve' | 'reject') => {
    startTransition(async () => {
      const result = await reviewProfileChangeRequest(request.id, action, rejectionReason);
      if (result.success) {
        toast({ title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`, description: 'The profile has been updated accordingly.' });
        onAction(); // Trigger a refetch in the parent
        setIsOpen(false); // Close dialog on success
      } else {
        toast({ variant: 'destructive', title: 'Action Failed', description: result.error || result.message });
      }
    });
  }

  const fetchDetails = async () => {
    if (fullRequest) return; // Already fetched
    setIsLoadingDetails(true);
    try {
      const data = await getProfileChangeRequest(request.id);
      if (data) setFullRequest(data);
    } catch (error) {
      console.error("Failed to fetch profile change request details:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load request details.' });
    } finally {
      setIsLoadingDetails(false);
    }
  }

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') {
      // Check if it's the availability object (with windows or flat days)
      const days = val.windows || val;
      if (days.mon && typeof days.mon === 'object') {
        return Object.entries(days)
          .filter(([_, day]: [string, any]) => day.enabled)
          .map(([name, day]: [string, any]) => {
            const morning = day.morning ? `${day.morning.start}-${day.morning.end}` : '';
            const evening = day.evening ? `${day.evening.start}-${day.evening.end}` : '';
            return `${name.toUpperCase()}: ${morning}${morning && evening ? ', ' : ''}${evening}`;
          }).join(' | ');
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

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
                {formatValue(change.old)}
              </div>
              <div className="text-muted-foreground col-span-1">New:</div>
              <div className="col-span-2 bg-green-50 p-2 rounded-md text-green-900">
                {formatValue(change.new)}
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


const ApprovalsTab = () => {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);

  const fetchRequests = async () => {
    const data = await listProfileChangeRequests();
    // Filter to only show requests for therapists
    setRequests(data.filter(r => r.role === 'therapist'));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleExport = () => {
    const headers = ["ID", "User ID", "Role", "Entity ID", "Section", "Changes", "Status", "Created At", "Reviewed At", "Reviewer ID"];
    const data = requests.map(req => [
      req.id,
      req.userId,
      req.role,
      req.entityId,
      req.section,
      JSON.stringify(req.changes),
      req.status,
      getSafeDate(req.createdAt)?.toISOString() || '',
      getSafeDate(req.reviewedAt)?.toISOString() || '',
      req.reviewerId || ''
    ]);
    downloadCsv(headers, data, 'profile-change-requests-export.csv');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pending Approvals ({pendingRequests.length})</CardTitle>
            <CardDescription>Review and approve or reject profile change requests from users.</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExport}><FileDown className="mr-2" />Export All Requests</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Therapist</TableHead>
              <TableHead>Section Changed</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/admin/users?search=${request.userId}`} className="hover:underline">{request.userId}</Link>
                </TableCell>
                <TableCell>{request.section}</TableCell>
                <TableCell>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="text-right space-x-2">
                  {request.role === 'therapist' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/therapists/${request.entityId}`} target="_blank">
                        <UserIcon className="mr-2" /> View Profile
                      </Link>
                    </Button>
                  )}
                  <ApprovalDialog request={request} onAction={fetchRequests} />
                </TableCell>
              </TableRow>
            ))}
            {pendingRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                  No pending therapist approvals.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function AdminUsersPage() {
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const [requestsData, usersData, therapistsData] = await Promise.all([
        listProfileChangeRequests(),
        listUsers(),
        listTherapists()
      ]);
      setPendingRequestCount(requestsData.filter(r => r.status === 'pending' && r.role === 'therapist').length);
      setUsers(usersData);
      setTherapists(therapistsData);
    };
    fetchData();
  }, []);

  const handleUserExport = () => {
    const headers = ["UID", "Name", "Email", "Phone", "Role", "Roles", "Created At"];
    const data = users.map(user => [
      user.uid,
      user.name,
      user.email,
      user.phone || '',
      user.role,
      (user.roles || []).join(', '),
      getSafeDate(user.createdAt)?.toISOString() || '',
    ]);
    downloadCsv(headers, data, 'users-export.csv');
  };

  const handleTherapistExport = () => {
    const headers = ["ID", "Name", "Specialty", "Experience", "Rating", "Reviews", "Membership", "PAN", "Address"];
    const data = therapists.map(t => [
      t.id, t.name, t.specialty, t.experience, t.rating, t.reviews,
      t.membershipPlan || 'standard', t.tax?.pan || '', `${t?.city}, ${t?.state}`
    ]);
    downloadCsv(headers, data, 'therapists-export.csv');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">User Management</h1>
        <p className="text-muted-foreground">View all users and manage profile change requests.</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="approvals">
            <ShieldAlert className="mr-2" />
            Profile Approvals
            {pendingRequestCount > 0 && <Badge variant="destructive" className="ml-2">{pendingRequestCount}</Badge>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4 space-y-4">
          <FilterBar
            showDatePicker={false}
            showLocationFilters={true}
            showSearch={true}
            showAdminUserFilters={true}
            onFilterChange={setFilters}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleUserExport}><FileDown className="mr-2" />Export Users</Button>
            <Button variant="outline" onClick={handleTherapistExport}><FileDown className="mr-2" />Export Therapists</Button>
          </div>
          <AdminUsersTable scope="admin" filters={filters} />
        </TabsContent>
        <TabsContent value="approvals" className="mt-4">
          <ApprovalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
