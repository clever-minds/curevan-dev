
// TODO: Implement the Health Records page.
// This page will list all locked PCRs for the patient,
// allowing them to view their treatment history.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PatientRecordsPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Health Records</h1>
        <p className="text-muted-foreground">This section will list your PCRs, lab reports, and allow you to export your history.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
           <CardDescription>This feature is currently under development.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your health records will be accessible here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
