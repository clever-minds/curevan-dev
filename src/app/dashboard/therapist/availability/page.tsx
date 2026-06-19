'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/context/auth-context";
import { getTherapistById, saveAvailability } from "@/lib/repos/therapists";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function AvailabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAvailable, setIsAvailable] = useState(true);
  
  // A simple representation of availability. In a real system, you'd have an array of dates or recurring rules.
  // We'll just mock saving it as a global flag for now or for the selected date.
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAvail() {
      if (!user) return;
      try {
        const therapist = await getTherapistById(user.id);
        if (therapist && therapist.availability) {
          // If availability is an array of blocked dates, load it
          if (Array.isArray(therapist.availability)) {
             setUnavailableDates(therapist.availability);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAvail();
  }, [user]);

  // Update toggle state when date changes
  useEffect(() => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      setIsAvailable(!unavailableDates.includes(dateStr));
    }
  }, [date, unavailableDates]);

  const handleToggleChange = (checked: boolean) => {
    setIsAvailable(checked);
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    
    setUnavailableDates(prev => {
      if (!checked && !prev.includes(dateStr)) {
        return [...prev, dateStr]; // Mark as unavailable
      } else if (checked && prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr); // Remove from unavailable
      }
      return prev;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // Save to the therapist's availability JSON object via API
    const success = await saveAvailability({ availability: unavailableDates });
    if (success) {
      toast({ title: "Availability saved", description: "Your schedule has been updated." });
    } else {
      toast({ title: "Error", description: "Failed to save availability.", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return <Skeleton className="w-full h-[600px]" />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Availability Calendar</h1>
        <p className="text-muted-foreground">Manage the days you are available to take bookings.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to modify your availability.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
              modifiers={{
                 unavailable: (d) => unavailableDates.includes(d.toISOString().split('T')[0])
              }}
              modifiersStyles={{
                 unavailable: { textDecoration: 'line-through', color: 'red' }
              }}
              className="rounded-md border shadow-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status for {date?.toLocaleDateString() || 'Selected Date'}</CardTitle>
            <CardDescription>Are you taking appointments on this date?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 p-4 border rounded-lg bg-muted/50">
              <Switch 
                id="available" 
                checked={isAvailable} 
                onCheckedChange={handleToggleChange} 
                disabled={!date}
              />
              <div className="space-y-0.5">
                <Label htmlFor="available" className="text-base">
                  {isAvailable ? 'Available' : 'Unavailable'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isAvailable 
                    ? 'You will receive booking requests.' 
                    : 'You will not appear in searches or receive requests.'}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
             <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Availability'}
             </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
