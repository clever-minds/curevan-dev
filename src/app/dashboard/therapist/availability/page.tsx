'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

type DaySchedule = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export default function AvailabilityPage() {
  const { user, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS_OF_WEEK.map((_, i) => ({ day_of_week: i, start_time: "09:00", end_time: "17:00", is_active: false }))
  );

  useEffect(() => {
    async function fetchAvail() {
      if (!user) return;
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/therapist/availability`, { headers });
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data)) {
           setSchedule(prev => {
             const newSchedule = [...prev];
             data.data.forEach((item: any) => {
               newSchedule[item.day_of_week] = {
                 day_of_week: item.day_of_week,
                 start_time: item.start_time.substring(0, 5),
                 end_time: item.end_time.substring(0, 5),
                 is_active: true
               };
             });
             return newSchedule;
           });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAvail();
  }, [user]);

  const handleToggle = (dayIndex: number, checked: boolean) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].is_active = checked;
    setSchedule(newSchedule);
  };

  const handleTimeChange = (dayIndex: number, field: 'start_time' | 'end_time', value: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex][field] = value;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeSchedule = schedule.filter(s => s.is_active).map(s => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time
      }));
      
      const headers = await getAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/therapist/availability`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: activeSchedule })
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: "Availability saved", description: "Your weekly schedule has been updated." });
      } else {
        toast({ title: "Error", description: data.error || "Failed to save availability.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return <Skeleton className="w-full h-[600px]" />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly Availability</h1>
        <p className="text-muted-foreground">Set your recurring weekly schedule for appointments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
          <CardDescription>Configure the hours you are available each day of the week.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white">
               <div className="flex items-center gap-4 w-1/3">
                 <Switch 
                   checked={day.is_active} 
                   onCheckedChange={(c) => handleToggle(index, c)} 
                 />
                 <Label className="font-medium text-base">{DAYS_OF_WEEK[index]}</Label>
               </div>
               
               {day.is_active ? (
                 <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Start</Label>
                      <Input 
                        type="time" 
                        value={day.start_time} 
                        onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <span className="text-muted-foreground">-</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">End</Label>
                      <Input 
                        type="time" 
                        value={day.end_time} 
                        onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 text-muted-foreground text-sm italic">
                   Unavailable
                 </div>
               )}
            </div>
          ))}
        </CardContent>
        <CardFooter>
           <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto ml-auto">
              {saving ? 'Saving...' : 'Save Schedule'}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
