'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getCredentialQueue } from '@/lib/repos/therapyAdmin';

export function CredentialQueue() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getCredentialQueue()
      .then(setItems)
      .catch((err) => console.error('Failed to load credential queue:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string, days: number | null) => {
    if (status === 'expired') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <AlertTriangle className="h-3 w-3" /> Expired (Hidden from Slots)
        </Badge>
      );
    }
    if (status === 'expiring_soon') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 w-fit text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <Clock className="h-3 w-3" /> Expiring in {days} {days === 1 ? 'day' : 'days'}
        </Badge>
      );
    }
    if (status === 'missing') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit text-muted-foreground">
          Pending Validity Date
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1 w-fit text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">
        <CheckCircle className="h-3 w-3" /> Valid ({days}d left)
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-headline flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" /> Council Registration & Credential Queue
        </CardTitle>
        <CardDescription>
          Tracking allied council registration numbers, expiry dates, and automatic 30-day renewal alerts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading credentials...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No therapist credential records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Therapist</TableHead>
                <TableHead>Council</TableHead>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.user_id}>
                  <TableCell>
                    <div className="font-semibold text-sm">Dr. {item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.qualification} • {item.city}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {item.council || 'State Allied Council'}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {item.registration_no || '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.registration_valid_until
                      ? new Date(item.registration_valid_until).toLocaleDateString()
                      : 'Not set'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.credential_status, item.days_remaining)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
