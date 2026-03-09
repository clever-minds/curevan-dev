
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect, useTransition } from "react";
import { Search, UserPlus, MoreVertical, Shield, ShieldCheck, ShieldOff, FileDown, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile, Therapist } from "@/lib/types";
import { listUsers } from "@/lib/repos/users";
import { cn, downloadCsv, getSafeDate } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { listTherapists } from "@/lib/repos/therapists";
import { updateUserRoles, inviteAdminUser } from "@/lib/actions/team";


export const dynamic = 'force-dynamic';

const roleFilters = [
    { label: 'All Users', value: 'all' },
    { label: 'Super Admins', value: 'admin.super' },
    { label: 'E-com Admins', value: 'admin.ecom' },
    { label: 'Therapy Admins', value: 'admin.therapy' },
    { label: 'Therapists', value: 'therapist' },
    { label: 'Patients', value: 'patient' },
];

export default function TeamManagementPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<(UserProfile & Partial<Therapist>)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRoles, setNewInviteRoles] = useState<string[]>([]);
  const [isInviting, startInviteTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  
  useEffect(() => {
    if (currentUser && !currentUser.roles?.includes('admin.super')) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access the Team Management page.',
      });
      router.push('/dashboard/account');
    }
  }, [currentUser, router, toast]);

  const fetchUsers = async () => {
    setLoading(true);
    const [userList, therapistProfiles] = await Promise.all([
      listUsers(),
      listTherapists()
    ]);
    const therapistMap = new Map(therapistProfiles.map(t => [t.id, t]));
    const combinedUsers = userList.map(user => {
        if (therapistMap.has(user.id)) {
            return { ...user, ...therapistMap.get(user.id) };
        }
        return user;
    });
    setUsers(combinedUsers);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, [])


  const handleRoleChange = (targetUser: UserProfile, role: string, add: boolean) => {
    startUpdateTransition(async () => {
      let newRoles = [...(targetUser.roles || [])];
      if (add) {
        if (!newRoles.includes(role)) newRoles.push(role);
      } else {
        newRoles = newRoles.filter(r => r !== role);
      }
      
      const result = await updateUserRoles(targetUser.uid, newRoles);

      if (result.success) {
          toast({ title: "Roles Updated!", description: `Roles for ${targetUser.name} have been updated. User must re-login to see changes.` });
          setUsers(prevUsers => prevUsers.map(u => u.uid === targetUser.uid ? { ...u, roles: newRoles } : u));
      } else {
          toast({ variant: "destructive", title: "Update Failed", description: result.error });
      }
    });
  };

  const handleInvite = () => {
    startInviteTransition(async () => {
      if (!newInviteEmail || newInviteRoles.length === 0) {
          toast({ variant: 'destructive', title: 'Invalid Invite', description: 'Please provide an email and select at least one role.' });
          return;
      }
      const result = await inviteAdminUser(newInviteEmail, newInviteRoles);
      if(result.success) {
          toast({ title: 'Invite Sent!', description: `An invitation has been sent to ${newInviteEmail}.` });
          setNewInviteEmail("");
          setNewInviteRoles([]);
          document.querySelector('[data-radix-dialog-close-button]')?.dispatchEvent(new MouseEvent('click'));
      } else {
          toast({ variant: 'destructive', title: 'Invite Failed', description: result.error });
      }
    });
  }
  
  const handleExport = () => {
    const headers = ["UID", "Name", "Email", "Phone", "Role", "Roles", "City", "State", "Created At"];
    const data = users.map(user => [
        user.uid,
        user.name,
        user.email,
        user.phone || '',
        user.role,
        (user.roles || []).join(', '),
        user.address?.city || '',
        user.address?.state || '',
        getSafeDate(user.createdAt)?.toISOString() || '',
    ]);
    downloadCsv(headers, data, 'all-users-export.csv');
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
        const matchesSearch = !searchQuery || user.email.includes(searchQuery) || user.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesRole = true;
        if (activeFilter !== 'all') {
            if (['Therapist', 'Patient'].includes(activeFilter)) {
                matchesRole = user.role === activeFilter;
            } else {
                 matchesRole = user.roles?.includes(activeFilter) ?? false;
            }
        }
        
        return matchesSearch && matchesRole;
    })
  }, [users, searchQuery, activeFilter]);
  
  if (!currentUser || !currentUser.roles?.includes('admin.super') || loading) {
    return <Skeleton className="w-full h-screen" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Team Management</h1>
        <p className="text-muted-foreground">Assign administrative roles to users. This page is for Super Admins only.</p>
      </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
                {roleFilters.map(filter => (
                    <Button 
                        key={filter.value} 
                        variant={activeFilter === filter.value ? 'default' : 'outline'}
                        onClick={() => setActiveFilter(filter.value)}
                    >
                        {filter.label}
                    </Button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                 <Input 
                    placeholder="Search by name or email..." 
                    className="w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2"/>Invite Admin</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite New Admin</DialogTitle>
                            <DialogDescription>
                                Enter the user's email and select the roles to assign. They will receive an email to set up their account.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input placeholder="user@example.com" value={newInviteEmail} onChange={(e) => setNewInviteEmail(e.target.value)} />
                             <div className="space-y-2">
                                <p className="font-medium text-sm">Roles</p>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="invite-ecom" onCheckedChange={(checked) => setNewInviteRoles(p => checked ? [...p, 'admin.ecom'] : p.filter(r => r !== 'admin.ecom'))} />
                                    <label htmlFor="invite-ecom">E-commerce Admin</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="invite-therapy" onCheckedChange={(checked) => setNewInviteRoles(p => checked ? [...p, 'admin.therapy'] : p.filter(r => r !== 'admin.therapy'))}/>
                                    <label htmlFor="invite-therapy">Therapy Admin</label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id="invite-super" onCheckedChange={(checked) => setNewInviteRoles(p => checked ? [...p, 'admin.super'] : p.filter(r => r !== 'admin.super'))}/>
                                    <label htmlFor="invite-super">Super Admin</label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                             <Button type="button" onClick={handleInvite} disabled={isInviting}>
                                {isInviting && <Loader2 className="mr-2 animate-spin" />}
                                Send Invite
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleExport}><FileDown className="mr-2"/>Export All</Button>
            </div>
        </div>
        <UserTable users={filteredUsers} onRoleChange={handleRoleChange} isUpdating={isUpdating} />
    </div>
  );
}

const UserTable = ({ users, onRoleChange, isUpdating }: { users: (UserProfile & Partial<Therapist>)[], onRoleChange: Function, isUpdating: boolean }) => {
    const roleLabels: Record<string, string> = {
        'admin.super': 'Super Admin',
        'admin.ecom': 'E-com Admin',
        'admin.therapy': 'Therapy Admin',
        'therapist': 'Therapist',
        'patient': 'Patient'
    };

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.uid}>
                            <TableCell>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {user.roles?.map(role => <Badge key={role} variant={role.includes('super') ? 'destructive' : 'secondary'}>{roleLabels[role] || role}</Badge>)}
                                </div>
                            </TableCell>
                            <TableCell>
                                {user.address ? `${user.address.city}, ${user.address.state}` : 'N/A'}
                            </TableCell>
                            <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isUpdating}><MoreVertical /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <RoleChangeItem user={user} onRoleChange={onRoleChange} role="admin.ecom" label="E-com Admin" />
                                    <RoleChangeItem user={user} onRoleChange={onRoleChange} role="admin.therapy" label="Therapy Admin" />
                                    <DropdownMenuSeparator />
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className={cn(
                                                "w-full",
                                                user.roles?.includes('admin.super') ? "text-destructive focus:text-destructive" : "text-green-600 focus:text-green-600"
                                            )}>
                                                 {user.roles?.includes('admin.super') ? <ShieldOff className="mr-2"/> : <ShieldCheck className="mr-2"/>}
                                                 {user.roles?.includes('admin.super') ? 'Remove Super Admin' : 'Make Super Admin'}
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This is a highly sensitive action. Assigning or revoking Super Admin rights has significant security implications.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onRoleChange(user, 'admin.super', !user.roles?.includes('admin.super'))}>
                                                    Yes, Proceed
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No users match the current filters.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


const RoleChangeItem = ({ user, onRoleChange, role, label }: { user: UserProfile, onRoleChange: Function, role: string, label: string}) => {
    const hasRole = user.roles?.includes(role);
    return (
        <DropdownMenuItem onClick={() => onRoleChange(user, role, !hasRole)}>
             {hasRole ? <ShieldOff className="mr-2"/> : <ShieldCheck className="mr-2"/>}
             {hasRole ? `Remove ${label}` : `Make ${label}`}
        </DropdownMenuItem>
    )
}

      
