
import { PcrForm } from "./pcr-form";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function NewPcrPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return (
     <div className="space-y-6">
       <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight font-headline">Patient Care Report</h1>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                <CheckCircle className="mr-2 h-4 w-4" />
                Session Verified
            </Badge>
        </div>
        <p className="text-muted-foreground">Booking ID: {bookingId}. Complete the form to document the patient encounter.</p>
      </div>
      <PcrForm bookingId={bookingId} />
    </div>
  );
}
