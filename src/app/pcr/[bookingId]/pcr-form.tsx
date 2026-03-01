
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Save, Lock, Edit, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIRichText } from '@/components/ai/ai-rich-text';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createPayoutItemForBooking } from '@/lib/actions';
import Link from 'next/link';
import { getTherapyCategories } from '@/lib/repos/categories';
import { getPcrById, updatePcr } from '@/lib/repos/pcr';
import type { PCR } from '@/lib/types';


const pcrFormSchema = z.object({
  // Patient Demographics (read-only from server)
  patientFullName: z.string(),
  dob: z.string(),
  
  // Incident Info
  incidentDate: z.string().min(1, 'Incident date is required'),
  incidentLocation: z.string().min(1, 'Incident location is required'),
  therapyType: z.string().min(1, 'Therapy type is required'),
  
  // Clinical Findings
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  assessment: z.string().min(10, 'Please provide a more detailed assessment.'),
  diagnosis: z.string().optional(),
  
  // Vital Signs
  vitalSigns: z.object({
    bp: z.string().optional(),
    hr: z.string().optional(),
    rr: z.string().optional(),
    temp: z.string().optional(),
  }),

  // Treatment & Plan
  treatmentProvided: z.string().min(10, 'Please describe the treatment provided.'),
  planOfCare: z.string().min(10, 'Please outline the plan of care.'),
  nextTreatmentDate: z.string().optional(),

  // Attachments & Signature
  attachment: z.any().optional(),
  status: z.enum(['not_started', 'in_progress', 'submitted', 'locked', 'returned']),
  therapistName: z.string().min(1, 'Your name is required'),
  signatureConfirmation: z.boolean(),
}).refine(data => {
    if (data.status === 'locked') {
        return data.signatureConfirmation === true;
    }
    return true;
}, {
    message: 'You must confirm your digital signature to lock the report.',
    path: ['signatureConfirmation'],
});


type PcrFormValues = z.infer<typeof pcrFormSchema>;

export function PcrForm({ bookingId }: { bookingId: string }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [therapyCategories, setTherapyCategories] = useState<string[]>([]);

  const form = useForm<PcrFormValues>({
    resolver: zodResolver(pcrFormSchema),
    defaultValues: {
        status: 'in_progress',
        signatureConfirmation: false,
        attachment: null,
    },
  });

  useEffect(() => {
    const fetchPcrData = async () => {
        setIsLoading(true);
        const [pcrData, cats] = await Promise.all([
          getPcrById(bookingId),
          getTherapyCategories()
        ]);

        if (pcrData) {
            form.reset(pcrData as any);
        }
        setTherapyCategories(cats);
        setIsLoading(false);
    }
    fetchPcrData();
  }, [bookingId, form]);

  async function handleSaveDraft() {
    const data = form.getValues();
    await updatePcr(bookingId, { ...data, status: 'in_progress' });
    toast({ title: 'PCR Draft Saved' });
  }

  async function handleFinalize() {
     const result = await form.trigger();
     if (!result) {
         toast({ variant: 'destructive', title: 'Validation Failed', description: 'Please fill all required fields and confirm your signature.' });
         return;
     }
     setIsFinalizing(true);
     const data = form.getValues();
     await updatePcr(bookingId, { ...data, status: 'locked' });
     
     const payoutResult = await createPayoutItemForBooking(bookingId);

     if (payoutResult.success) {
         toast({ title: 'PCR Finalized & Locked', description: payoutResult.message });
         form.reset({ ...data, status: 'locked' });
     } else {
         toast({ variant: 'destructive', title: 'Action Failed', description: payoutResult.message });
     }
     setIsFinalizing(false);
  }
  
  async function handleUnlock() {
      await updatePcr(bookingId, { status: 'returned' });
      form.reset({ ...form.getValues(), status: 'returned' });
      toast({ title: 'PCR Unlocked', description: 'The PCR is now available for editing by the therapist.' });
  }

  const isFinal = form.watch('status') === 'locked';
  const isAdmin = user?.role === 'admin';
  const canUnlock = user?.roles?.includes('admin.therapy') || user?.roles?.includes('admin.super');

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10 col-span-1" />
                <Skeleton className="h-10 col-span-1" />
                 <Skeleton className="h-10 col-span-1" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-8">
        <div className="sticky top-[var(--header-height)] bg-background/95 backdrop-blur-sm z-10 -mx-8 px-8 py-4 border-b">
            {isFinal && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>This PCR is Locked</AlertTitle>
                    <AlertDescription>
                       This report has been finalized and cannot be edited. To make changes, an admin must unlock it.
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                    {/* Actions for Therapists */}
                    {!isAdmin && !isFinal && (
                         <div className="flex items-center gap-2">
                            <Button type="button" onClick={handleSaveDraft} variant="outline" disabled={isFinalizing}><Save className="mr-2 h-4 w-4"/>Save Draft</Button>
                            <Button type="button" onClick={handleFinalize} disabled={isFinalizing}>
                                {isFinalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4"/>}
                                Lock & Finalize
                            </Button>
                        </div>
                    )}
                     {/* Actions for Admins */}
                    {isAdmin && canUnlock && (
                         <div className="flex items-center gap-2">
                             <Button type="button" variant="destructive" disabled={!isFinal} onClick={handleUnlock}>
                                <Edit className="mr-2 h-4 w-4"/>Unlock for Edit
                            </Button>
                        </div>
                    )}
                </div>
                 {isFinal && (
                    <Button variant="secondary" asChild>
                        <Link href={`/dashboard/invoices?id=INV-${bookingId}`}><FileText className="mr-2"/>View Service Invoice</Link>
                    </Button>
                )}
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-3 space-y-8">
            {/* Patient Demographics */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Patient Demographics</h3>
              <p className="text-sm text-muted-foreground">This information is pre-filled from the booking and cannot be changed.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="patientFullName" render={({ field }) => (
                  <FormItem><FormLabel>Patient Full Name</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="dob" render={({ field }) => (
                  <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field}  /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>  
            </div>

            <Separator/>

            {/* Incident Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Incident Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="incidentDate" render={({ field }) => (
                  <FormItem><FormLabel>Incident Date</FormLabel><FormControl><Input type="date" {...field} disabled={isFinal} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="incidentLocation" render={({ field }) => (
                  <FormItem><FormLabel>Incident Location</FormLabel><FormControl><Input placeholder="123 Main St" {...field} disabled={isFinal} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField
                  control={form.control}
                  name="therapyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Therapy Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isFinal}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select therapy type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {therapyCategories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />
            
            {/* Clinical Findings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Clinical Findings</h3>
                <FormField control={form.control} name="chiefComplaint" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint</FormLabel>
                      <FormControl>
                        <AIRichText
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g., Lower back pain"
                          context={{ entityType: "pcr", field: "chiefComplaint" }}
                          disabled={isFinal}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="assessment" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment (Subjective / Objective)</FormLabel>
                       <div className="relative">
                          <FormControl>
                             <AIRichText
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Patient states... Observation..."
                                context={{ entityType: "pcr", field: "assessment" }}
                                disabled={isFinal}
                              />
                          </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="diagnosis" render={({ field }) => (
                    <FormItem><FormLabel>Diagnosis (Optional)</FormLabel><FormControl><AIRichText value={field.value} onChange={field.onChange} placeholder="Therapist's professional diagnosis" context={{ entityType: 'pcr', field: 'diagnosis' }} disabled={isFinal} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField control={form.control} name="vitalSigns.bp" render={({ field }) => (<FormItem><FormLabel>BP</FormLabel><FormControl><Input placeholder="120/80" {...field} disabled={isFinal} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="vitalSigns.hr" render={({ field }) => (<FormItem><FormLabel>Heart Rate</FormLabel><FormControl><Input placeholder="80" {...field} disabled={isFinal} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="vitalSigns.rr" render={({ field }) => (<FormItem><FormLabel>Resp. Rate</FormLabel><FormControl><Input placeholder="16" {...field} disabled={isFinal} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="vitalSigns.temp" render={({ field }) => (<FormItem><FormLabel>Temp</FormLabel><FormControl><Input placeholder="98.6°F" {...field} disabled={isFinal} /></FormControl></FormItem>)}/>
                </div>
            </div>
            
            <Separator />

            {/* Treatment & Plan */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Treatment & Plan</h3>
              <FormField control={form.control} name="treatmentProvided" render={({ field }) => (
                    <FormItem><FormLabel>Treatment Provided</FormLabel><FormControl><AIRichText value={field.value} onChange={field.onChange} placeholder="Detailed record of the treatment or therapy administered..." context={{ entityType: 'pcr', field: 'treatmentProvided' }} disabled={isFinal} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="planOfCare" render={({ field }) => (
                    <FormItem><FormLabel>Plan of Care</FormLabel><FormControl><AIRichText value={field.value} onChange={field.onChange} placeholder="Recommended next steps, exercises, or future treatment plan..." context={{ entityType: 'pcr', field: 'planOfCare' }} disabled={isFinal} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="nextTreatmentDate" render={({ field }) => (
                  <FormItem><FormLabel>Next Treatment Date (Optional)</FormLabel><FormControl><Input type="date" {...field} disabled={isFinal} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>

            <Separator />

            {/* Attachments & Signature */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Attachments & Signature</h3>
                <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field: { onChange, ...fieldProps} }) => (
                        <FormItem>
                        <FormLabel>Upload Attachment</FormLabel>
                        <FormControl>
                            <Input type="file" onChange={(e) => onChange(e.target.files)} {...fieldProps} disabled={isFinal} />
                        </FormControl>
                        <FormDescription>Files such as lab reports, images, or prescriptions.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField control={form.control} name="therapistName" render={({ field }) => (
                    <FormItem><FormLabel>Therapist Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} disabled={isFinal} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="signatureConfirmation" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isFinal} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Digital Signature</FormLabel>
                            <FormDescription>
                                By checking this box, I certify that the information provided in this report is accurate and complete to the best of my knowledge.
                            </FormDescription>
                            <FormMessage />
                        </div>
                    </FormItem>
                )}/>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
