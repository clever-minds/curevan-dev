
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Clock, CheckCircle, MapPin, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SOSAlert, Appointment } from '@/lib/types';
import { listSosAlerts, resolveSosAlert } from "@/lib/repos/alerts";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAppointmentById } from "@/lib/repos/appointments";
import { Skeleton } from "@/components/ui/skeleton";

// A small component for the map view
const AlertMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const apiKey = "AIzaSyDGxg9Uw6sQXWDVoEAmirxdVF5neAICKJM";
  if (!apiKey) {
    return <div className="h-64 bg-muted rounded-md flex items-center justify-center text-destructive-foreground">Maps API Key Missing</div>
  }
  return (
    <div className="h-64 rounded-md overflow-hidden border">
       <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={15}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId="sos-map"
        >
          <AdvancedMarker position={{ lat, lng }} />
        </Map>
      </APIProvider>
    </div>
  );
};


export default function SosAlertsPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Record<string, Appointment | null>>({});
  const { toast } = useToast();

  const fetchAlertsAndAppointments = async () => {
    setLoading(true);
    const alertData = await listSosAlerts();
    setAlerts(alertData);

    // Fetch appointment details for each alert
    const appointmentIds = alertData.map(a => a.bookingId).filter(id => id); // Filter out any undefined ids
    if (appointmentIds.length > 0) {
        const appointmentPromises = appointmentIds.map(id => getAppointmentById(id));
        const appointmentResults = await Promise.all(appointmentPromises);
        
        const appointmentsMap: Record<string, Appointment | null> = {};
        appointmentResults.forEach((appt, index) => {
            if(appt) {
                appointmentsMap[appointmentIds[index]] = appt;
            }
        });
        setAppointments(appointmentsMap);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAlertsAndAppointments();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    const result = await resolveSosAlert(alertId);
    if(result.success) {
      toast({ title: "Alert Resolved", description: `Alert ${alertId} has been marked as resolved.`});
      fetchAlertsAndAppointments(); // Refresh the list
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  }

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Emergency Alerts</h1>
        <p className="text-muted-foreground">Monitor and manage therapist safety alerts.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Active Alerts ({activeAlerts.length})</h2>
        {loading ? (
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-96 w-full" />
            </div>
        ) : activeAlerts.length > 0 ? (
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            {activeAlerts.map(alert => {
              const appointment = appointments[alert.bookingId];
              return (
              <Card key={alert.id} className="border-destructive shadow-lg bg-destructive/5">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant={'destructive'} className="mb-2 uppercase flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" />
                                {alert.type === 'sos' ? 'SOS Triggered' : 'Missed Check-in'}
                            </Badge>
                            <CardTitle>Therapist: {alert.therapistName}</CardTitle>
                            <CardDescription>Alert triggered at {new Date(alert.timestamp as string).toLocaleTimeString()}</CardDescription>
                        </div>
                         <Button size="sm" onClick={() => handleResolveAlert(alert.id)}>Resolve Alert</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm border-t border-b py-4 border-destructive/20">
                     <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>Patient: <strong>{appointment?.patientName || 'Loading...'}</strong></span>
                        <Button variant="link" size="sm" asChild className="p-0 h-auto"><Link href={`/dashboard/admin/users?search=${appointment?.patientId}`}>View</Link></Button>
                    </div>
                     <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1">Location: <strong>{appointment?.serviceAddress?.line1 || 'Loading...'}</strong></span>
                    </div>
                  </div>
                  <AlertMap lat={alert.location._latitude} lng={alert.location._longitude} />
                </CardContent>
              </Card>
            )})}
          </div>
        ) : (
          <div className="p-6 text-center bg-card border rounded-lg">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2"/>
            <p className="text-muted-foreground">No active alerts at the moment.</p>
          </div>
        )}
      </section>

       <section>
        <h2 className="text-xl font-semibold mb-4">Resolved Alerts</h2>
         <Card>
            <CardContent className="pt-6">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Therapist</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Resolved At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                        ) : resolvedAlerts.length > 0 ? (
                             resolvedAlerts.map(alert => (
                                <TableRow key={alert.id}>
                                    <TableCell>{new Date(alert.timestamp as string).toLocaleDateString()}</TableCell>
                                    <TableCell>{alert.therapistName}</TableCell>
                                    <TableCell>{appointments[alert.bookingId]?.patientName || 'N/A'}</TableCell>
                                    <TableCell><Badge variant="secondary">{alert.type}</Badge></TableCell>
                                    <TableCell>{alert.resolvedAt ? new Date(alert.resolvedAt as string).toLocaleString() : 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No resolved alerts found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
         </Card>
      </section>
    </div>
  );
}
