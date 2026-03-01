'use client';

import * as React from 'react';
import type { UserProfile, Therapist } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, User, FileText, Activity, UserCog, Trash2, Star } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTrigger, SheetTitle } from '../ui/sheet';
import { useAuth } from '@/context/auth-context';
import { listUsers } from '@/lib/repos/users';
import { listTherapists } from '@/lib/repos/therapists';
import { Skeleton } from '../ui/skeleton';

interface AdminUsersTableProps {
  scope: 'admin' | 'therapyAdmin';
  filters?: any;
}

type CombinedUser = UserProfile & Partial<Therapist>;

const UserCard = ({ user, scope }: { user: CombinedUser, scope: 'admin' | 'therapyAdmin' }) => (
  <Card>
    <CardContent className="p-4 flex items-start gap-4">
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <ActionsMenu user={user} scope={scope} asSheetItems />
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {user.roles?.map(role => (
            <Badge key={role} variant="secondary">{role.split('.').pop()}</Badge>
          ))}
        </div>
        {user.role === 'therapist' && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>{user.specialty} &bull; {user.membershipPlan}</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const ActionsMenu = ({ user, scope, asSheetItems = false }: { user: CombinedUser; scope: 'admin' | 'therapyAdmin', asSheetItems?: boolean }) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes('admin.super');

  const content = (
    <>
      {user.role === 'therapist' ? (
        <DropdownMenuItem asChild>
          <Link href={`/therapists/${user.name?.toLowerCase().replace(/ /g, '-')}`} className="w-full flex items-center">
            <User className="mr-2"/>View Profile
          </Link>
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem><User className="mr-2"/>View Profile</DropdownMenuItem>
      )}
      <DropdownMenuItem asChild>
        <Link href={`/dashboard/admin/appointments?patientId=${user.uid}`} className="w-full flex items-center">
          <Activity className="mr-2"/>View Bookings
        </Link>
      </DropdownMenuItem>
      {user.role === 'therapist' && (
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/therapist/pcr?therapistId=${user.uid}`} className="w-full flex items-center">
            <FileText className="mr-2"/>View PCRs
          </Link>
        </DropdownMenuItem>
      )}
      {scope === 'admin' && isSuperAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/team?userId=${user.uid}`} className="w-full flex items-center">
              <UserCog className="mr-2"/>Manage Roles
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2"/>Suspend Account
          </DropdownMenuItem>
        </>
      )}
    </>
  );

  if (asSheetItems) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>{user.name}</SheetTitle>
            <SheetDescription>Select an action to perform for this user.</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-2">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{content}</DropdownMenuContent>
    </DropdownMenu>
  );
};

export function AdminUsersTable({ scope, filters = {} }: AdminUsersTableProps) {
  const [users, setUsers] = React.useState<CombinedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const fetchAndCombineData = async () => {
      setLoading(true);
      try {
        console.log('Fetching users and therapists...');
        const [userList, therapistProfiles] = await Promise.all([listUsers(), listTherapists()]);

        console.log('Users fetched:', userList);
        console.log('Therapists fetched:', therapistProfiles);

        const therapistMap = new Map<number, Therapist>();
        (therapistProfiles || []).forEach(t => therapistMap.set(Number(t.user_id), t));

        const combined: CombinedUser[] = userList.map(user => {
                const userId = Number(user.id);
               if (user.role_name === 'therapist' && therapistMap.has(userId)) {
                  return { ...user, ...therapistMap.get(userId)! };
                }
                return user;
              });

          console.log("User roles:",combined);

        setUsers(combined);
      } catch (err) {
        console.error('Error fetching users or therapists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCombineData();
  }, []);

  const filteredUsers = React.useMemo(() => {
    const { search, roles } = filters as any;
    return users.filter(user => {
      const matchesSearch =
        !search ||
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roles?.length
        ? user.roles?.some(userRole => roles.includes(userRole)) ?? false
        : true;

      return matchesSearch && matchesRole;
    });
  }, [users, filters]);

  if (loading) {
    const rows = isMobile ? 5 : 10;
    return (
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => <Skeleton key={i} className="w-full h-16" />)}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {filteredUsers.map(user => <UserCard key={user.uid} user={user} scope={scope} />)}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">
                    <div>{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map(role => (
                        <Badge key={role} variant={role.includes('super') ? 'destructive' : 'secondary'} className="capitalize">
                            {role.split('.').pop()} {user.role_name === 'admin' ? '(Admin)' : ''}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{user.specialty || 'N/A'}</TableCell>
                  <TableCell>{user.address ? `${user.address.city}, ${user.address.state}` : 'N/A'}</TableCell>
                  <TableCell>
                    {user.role_name === 'therapist' ? (
                      <Badge variant={user.membershipPlan === 'premium' ? 'default' : 'outline'} className="capitalize">
                        {user.membershipPlan}
                      </Badge>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {user.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400"/> {user.rating}
                      </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt as any).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu user={user} scope={scope} />
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No users found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
