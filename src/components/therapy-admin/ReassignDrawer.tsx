'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowRight, CheckCircle, Clock, MapPin, Star, UserCheck } from 'lucide-react';
import { reassignBooking } from '@/lib/repos/therapyAdmin';

interface Candidate {
  therapistId: number;
  profileId: number;
  name: string;
  phone: string;
  city: string;
  distanceKm: number | null;
  avgRating: number;
  ratingCount: number;
}

interface ImpactedBooking {
  booking: {
    id: number;
    patientId: number;
    patientName: string;
    patientPhone?: string;
    currentTherapistId: number;
    currentTherapistName: string;
    serviceType: string;
    date: string;
    time: string;
    address: string;
    leaveReason?: string;
  };
  candidates: Candidate[];
}

interface ReassignDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ImpactedBooking[];
  onReassigned: () => void;
}

export function ReassignDrawer({ open, onOpenChange, items, onReassigned }: ReassignDrawerProps) {
  const { toast } = useToast();
  const [submittingId, setSubmittingId] = React.useState<number | null>(null);

  const handleReassign = async (bookingId: number, newTherapistId: number, therapistName: string) => {
    setSubmittingId(bookingId);
    try {
      await reassignBooking(bookingId, newTherapistId, 'Emergency leave coverage');
      toast({
        title: 'Booking Reassigned',
        description: `Booking #${bookingId} has been reassigned to Dr. ${therapistName}. Notifications sent.`,
      });
      onReassigned();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Reassignment Failed',
        description: err.message || 'Could not reassign therapist.',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl flex items-center gap-2 font-headline">
            <AlertCircle className="h-5 w-5 text-amber-500" /> Emergency Reassignment Queue
          </SheetTitle>
          <SheetDescription>
            Therapist leave today or tomorrow overlaps with active appointments. Reassign to eligible nearby therapists.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="font-medium text-foreground">All clear!</p>
              <p className="text-sm">No active bookings currently impacted by emergency leaves.</p>
            </div>
          ) : (
            items.map(({ booking, candidates }) => (
              <Card key={booking.id} className="border-amber-200 dark:border-amber-900/50 shadow-sm">
                <CardHeader className="pb-3 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">Booking #{booking.id}</span>
                        <Badge variant="outline" className="text-xs bg-background">
                          {booking.serviceType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Patient: <span className="font-medium text-foreground">{booking.patientName}</span>
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {booking.date} at {booking.time}
                      </div>
                      <div className="text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                        On Leave: Dr. {booking.currentTherapistName}
                      </div>
                    </div>
                  </div>
                  {booking.address && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{booking.address}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Eligible Candidates (within 8km, quality OK, free slot):
                  </p>
                  {candidates.length === 0 ? (
                    <div className="py-3 px-3 rounded-md bg-muted text-xs text-muted-foreground text-center">
                      No matching therapists available for this slot within 8 km. Admin intervention required.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {candidates.map((cand) => (
                        <div
                          key={cand.therapistId}
                          className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="font-medium text-sm flex items-center gap-2">
                              <span>Dr. {cand.name}</span>
                              <span className="flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-0.5" />
                                {cand.avgRating > 0 ? cand.avgRating.toFixed(1) : 'New'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                              {cand.distanceKm !== null && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {cand.distanceKm} km away
                                </span>
                              )}
                              <span>{cand.city}</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={submittingId === booking.id}
                            onClick={() => handleReassign(booking.id, cand.therapistId, cand.name)}
                          >
                            Reassign <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
