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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Star, UserCheck, AlertTriangle, Snowflake, CheckCircle, MessageSquare } from 'lucide-react';
import { getQualityQueue, recordQualityAction } from '@/lib/repos/therapyAdmin';

export function QualityQueue() {
  const { toast } = useToast();
  const [therapists, setTherapists] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>('flagged');
  const [selectedTherapist, setSelectedTherapist] = React.useState<any | null>(null);
  const [actionType, setActionType] = React.useState<string>('note');
  const [actionNote, setActionNote] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);

  const loadData = React.useCallback(() => {
    setLoading(true);
    getQualityQueue()
      .then(setTherapists)
      .catch((err) => console.error('Failed to load quality queue:', err))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActionSubmit = async () => {
    if (!selectedTherapist) return;
    setSubmitting(true);
    try {
      await recordQualityAction(selectedTherapist.therapistId, actionType, actionNote);
      toast({
        title: 'Action Recorded',
        description: `Quality action "${actionType}" applied for Dr. ${selectedTherapist.name}.`,
      });
      setSelectedTherapist(null);
      setActionNote('');
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: err.message || 'Could not record quality action.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = therapists.filter((t) => {
    if (filter === 'flagged') return t.qualityStatus !== 'ok';
    if (filter === 'coaching') return t.qualityStatus === 'coaching';
    if (filter === 'under_review') return t.qualityStatus === 'under_review';
    if (filter === 'frozen') return t.qualityStatus === 'frozen';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'frozen':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <Snowflake className="h-3 w-3" /> Frozen
          </Badge>
        );
      case 'under_review':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit bg-red-600">
            <AlertTriangle className="h-3 w-3" /> Under Review
          </Badge>
        );
      case 'coaching':
        return (
          <Badge variant="outline" className="flex items-center gap-1 w-fit text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <MessageSquare className="h-3 w-3" /> Coaching
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle className="h-3 w-3" /> OK
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" /> Quality & Rating Queue
          </CardTitle>
          <CardDescription>
            Flagged therapists based on 10+ ratings averaging &lt;4.5 (coaching) or &lt;4.0 (under review).
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flagged">All Flagged</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="coaching">Coaching</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
              <SelectItem value="all">Show All Therapists</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading quality queue...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No therapists currently match the selected quality filter.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Therapist</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Avg Rating (Window)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.therapistId}>
                  <TableCell>
                    <div className="font-semibold text-sm">Dr. {t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.qualification || 'Therapist'}</div>
                  </TableCell>
                  <TableCell className="text-xs">{t.city}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-semibold text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                      <span>{t.avgRating > 0 ? t.avgRating.toFixed(1) : 'N/A'}</span>
                      <span className="text-xs text-muted-foreground font-normal">({t.totalRatings} ratings)</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(t.qualityStatus)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {t.qualityNote || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTherapist(t);
                        setActionType('note');
                        setActionNote(t.qualityNote || '');
                      }}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Action Dialog */}
      <Dialog open={!!selectedTherapist} onOpenChange={(open) => !open && setSelectedTherapist(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Therapist Quality Action</DialogTitle>
            <DialogDescription>
              Take action for Dr. {selectedTherapist?.name} (Current Rating: {selectedTherapist?.avgRating?.toFixed(1) || 'N/A'}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Select Action</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Add Quality Note</SelectItem>
                  <SelectItem value="interview">Schedule Clinical Interview</SelectItem>
                  <SelectItem value="coaching">Assign Peer Coaching</SelectItem>
                  <SelectItem value="freeze">Freeze (Block New Bookings)</SelectItem>
                  <SelectItem value="unfreeze">Unfreeze / Restore OK Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Reason / Note</label>
              <Textarea
                placeholder="Details of the conversation, audit finding, or improvement plan..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTherapist(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleActionSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Apply Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
