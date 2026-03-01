
'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { Save, FileDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSafeDate, downloadCsv } from '@/lib/utils';
import { listUsers } from '@/lib/repos/users';
import { listTherapists } from '@/lib/repos/therapists';
import { listAppointments } from '@/lib/repos/appointments';
import { listOrders } from '@/lib/repos/orders';
import { listProducts, listProductCategories } from '@/lib/repos/products';
import { listCoupons } from '@/lib/repos/coupons';
import { listDocumentation, listJournalEntries, listTrainings, listProfileChangeRequests, listAuditLogs, listSessionLogs, listPcrAmendmentRequests, listNewsletterSubscribers, listPaymentTransactions, listInvoices, listCreditNotes, listPatientProfiles, listAiFeedback } from '@/lib/repos/content';
import { listReturns } from '@/lib/repos/returns';
import { listShipments } from '@/lib/repos/shipments';
import { useTransition } from 'react';
import { updatePlatformSettings } from '@/lib/actions/settings';

const settingsSchema = z.object({
  payoutDay: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  maxDiscountPercent: z.coerce.number().min(0).max(100),
  premiumServiceFeeRate: z.coerce.number().min(0).max(1),
  timeZone: z.string(),
  currency: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const dataExportItems = [
    { name: "Users", description: "All user accounts (patients, therapists, admins).", exportFunc: async () => downloadCsv(
        ["uid", "email", "name", "phone", "role", "roles"],
        (await listUsers()).map(u => [u.uid, u.email, u.name, u.phone, u.role, (u.roles || []).join(',')]),
        "users.csv"
    )},
    { name: "Patient Profiles", description: "All patient-specific medical profiles.", exportFunc: async () => downloadCsv(
        ["userId", "mrn", "dob", "gender", "allergies", "conditions", "meds", "lastVisitSummary"],
        (await listPatientProfiles()).map(p => [p.userId, p.mrn, getSafeDate(p.dob)?.toISOString(), p.gender, p.allergies?.join(', '), p.conditions?.join(', '), p.meds?.join(', '), p.lastVisitSummary]),
        "patient_profiles.csv"
    )},
    { name: "Therapist Profiles", description: "Detailed profiles for all therapists.", exportFunc: async () => downloadCsv(
        ["id", "name", "specialty", "experience", "rating", "reviews", "membershipPlan", "pan", "address", "bio"],
        (await listTherapists()).map(t => [t.id, t.name, t.specialty, t.experience, t.rating, t.reviews, t.membershipPlan, t.tax?.pan, `${t.address.city}, ${t.address.state}`, t.bio]),
        "therapists.csv"
    )},
    { name: "Appointments", description: "All service bookings.", exportFunc: async () => downloadCsv(
        ["id", "date", "time", "therapistId", "patientId", "status", "paymentStatus", "pcrStatus"],
        (await listAppointments()).map(a => [a.id, a.date, a.time, a.therapistId, a.patientId, a.status, a.paymentStatus, a.pcrStatus]),
        "appointments.csv"
    )},
    { name: "Orders", description: "All e-commerce product orders.", exportFunc: async () => downloadCsv(
        ["id", "createdAt", "userId", "customerName", "total", "status", "paymentStatus"],
        (await listOrders()).map(o => [o.id, getSafeDate(o.createdAt)?.toISOString(), o.userId, o.customerName, o.total, o.status, o.paymentStatus]),
        "orders.csv"
    )},
     { name: "Invoices", description: "All generated invoices for services and products.", exportFunc: async () => downloadCsv(
        ["id", "invoiceNumber", "status", "userId", "source.orderId", "source.bookingId", "issuedAt", "totalAmountPaise"],
        (await listInvoices()).map(i => [i.id, i.invoiceNumber, i.status, i.userId, i.source.orderId, i.source.bookingId, getSafeDate(i.issuedAt)?.toISOString(), i.totalAmountPaise]),
        "invoices.csv"
    )},
     { name: "Credit Notes", description: "All issued credit notes for returns/refunds.", exportFunc: async () => downloadCsv(
        ["id", "creditNoteNumber", "referenceInvoiceId", "reason", "status", "userId", "issuedAt", "totalAmountPaise"],
        (await listCreditNotes()).map(cn => [cn.id, cn.creditNoteNumber, cn.referenceInvoiceId, cn.reason, cn.status, cn.userId, getSafeDate(cn.meta.issuedAt)?.toISOString(), cn.totalAmountPaise]),
        "credit_notes.csv"
    )},
    { name: "Products", description: "Complete catalog of products.", exportFunc: async () => downloadCsv(
        ["id", "name", "sku", "categoryId", "price", "stock"],
        (await listProducts()).map(p => [p.id, p.name, p.sku, p.categoryId, p.price, p.stock]),
        "products.csv"
    )},
     { name: "Product Categories", description: "All product categories.", exportFunc: async () => downloadCsv(
        ["id", "name", "description"],
        (await listProductCategories()).map(c => [c.id, c.name, c.description]),
        "product_categories.csv"
    )},
    { name: "Coupons", description: "All promotional and referral codes.", exportFunc: async () => downloadCsv(
        ["id", "code", "therapistId", "discountType", "value", "status"],
        (await listCoupons()).map(c => [c.id, c.code, c.therapistId, c.discountType, c.value, c.status]),
        "coupons.csv"
    )},
    { name: "Shipments", description: "All order shipment records.", exportFunc: async () => downloadCsv(
        ["id", "orderId", "awb", "carrier", "status", "createdAt", "eta"],
        (await listShipments()).map(s => [s.id, s.orderId, s.awb, s.carrier, s.status, s.createdAt, s.eta]),
        "shipments.csv"
    )},
     { name: "Returns (RMAs)", description: "All product return requests.", exportFunc: async () => downloadCsv(
        ["id", "orderId", "customerName", "reason", "status", "refundStatus", "totalRefundAmount"],
        (await listReturns()).map(r => [r.id, r.orderId, r.customerName, r.reason, r.status, r.refundStatus, r.totalRefundAmount]),
        "returns.csv"
    )},
    { name: "Journal Entries", description: "All blog posts and articles.", exportFunc: async () => downloadCsv(
        ["id", "title", "slug", "status", "authorName", "publishedAt"],
        (await listJournalEntries()).map(j => [j.id, j.title, j.slug, j.status, j.authorName, j.publishedAt]),
        "journal.csv"
    )},
    { name: "Trainings", description: "All training materials for therapists.", exportFunc: async () => downloadCsv(
        ["id", "title", "slug", "status", "difficulty", "durationMin"],
        (await listTrainings()).map(t => [t.id, t.title, t.slug, t.status, t.difficulty, t.durationMin]),
        "trainings.csv"
    )},
    { name: "Documentation (SOPs)", description: "All Standard Operating Procedures.", exportFunc: async () => downloadCsv(
        ["id", "title", "slug", "status", "sopVersion"],
        (await listDocumentation()).map(d => [d.id, d.title, d.slug, d.status, d.sopVersion]),
        "documentation.csv"
    )},
    { name: "Audit Logs", description: "All system and user actions.", exportFunc: async () => downloadCsv(
        ["actorId", "action", "entityType", "entityId", "timestamp"],
        (await listAuditLogs()).map(l => [l.actorId, l.action, l.entityType, l.entityId, getSafeDate(l.timestamp)?.toISOString()]),
        "audit_logs.csv"
    )},
    { name: "Session Logs", description: "Detailed logs of started and ended therapy sessions.", exportFunc: async () => downloadCsv(
        ["id", "bookingId", "therapistId", "startedAt", "endedAt", "durationMin"],
        (await listSessionLogs()).map(s => [s.id, s.bookingId, s.therapistId, getSafeDate(s.startedAt)?.toISOString(), getSafeDate(s.endedAt)?.toISOString(), s.durationMin]),
        "session_logs.csv"
    )},
    { name: "PCR Amendment Requests", description: "Requests from therapists to unlock PCRs.", exportFunc: async () => downloadCsv(
        ["id", "bookingId", "therapistId", "reason", "requestedAt"],
        (await listPcrAmendmentRequests()).map(r => [r.id, r.bookingId, r.therapistId, r.reason, getSafeDate(r.requestedAt)?.toISOString()]),
        "pcr_amend_requests.csv"
    )},
    { name: "Newsletter Subscribers", description: "List of all users subscribed to the newsletter.", exportFunc: async () => downloadCsv(
        ["email", "status", "source", "createdAt"],
        (await listNewsletterSubscribers()).map(s => [s.email, s.status, s.source, getSafeDate(s.createdAt)?.toISOString()]),
        "newsletter_subscribers.csv"
    )},
    { name: "Payment Transactions", description: "Raw logs from payment gateways.", exportFunc: async () => downloadCsv(
        ["id", "ref", "userId", "orderId", "bookingId", "amount", "currency", "status", "gateway", "createdAt"],
        (await listPaymentTransactions()).map(t => [t.id, t.ref, t.userId, t.orderId, t.bookingId, t.amount, t.currency, t.status, t.gateway, getSafeDate(t.createdAt)?.toISOString()]),
        "payment_transactions.csv"
    )},
    { name: "AI Feedback", description: "All feedback logs for AI interactions.", exportFunc: async () => downloadCsv(
        ["id", "timestamp", "userId", "context", "rating", "query", "response", "userComment"],
        (await listAiFeedback()).map(f => [f.id, f.timestamp, f.userId, f.context, f.rating, f.query, f.response, f.userComment]),
        "ai_feedback.csv"
    )},
];

const timezones = ["Asia/Kolkata", "America/New_York", "Europe/London"];
const currencies = ["INR", "USD", "EUR", "GBP"];

export default function AdminPlatformSettingsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        payoutDay: 'Friday',
        maxDiscountPercent: 20,
        premiumServiceFeeRate: 0.10,
        timeZone: 'Asia/Kolkata',
        currency: 'INR',
    },
  });

  function onSubmit(data: SettingsFormValues) {
    startTransition(async () => {
      const result = await updatePlatformSettings(data);
      if (result.success) {
        toast({
          title: 'Settings Saved',
          description: 'Global platform settings have been updated.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: result.error || 'An unexpected error occurred.',
        });
      }
    });
  }

  const handleDataExport = (exportFunc?: () => void, dataType?: string) => {
    if (exportFunc) {
      exportFunc();
      toast({
        title: 'Export Started',
        description: `Your export for "${dataType}" has begun and will be downloaded shortly.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Export Not Implemented',
        description: `The export function for "${dataType}" is not yet available.`,
      });
    }
  };

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Platform Settings</h1>
        <p className="text-muted-foreground">Manage global settings for the Curevan platform. Changes may require an app restart to take effect.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
           <CardDescription>These settings affect all users and transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FormField
                    control={form.control}
                    name="payoutDay"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Weekly Payout Day</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Monday">Monday</SelectItem>
                                <SelectItem value="Tuesday">Tuesday</SelectItem>
                                <SelectItem value="Wednesday">Wednesday</SelectItem>
                                <SelectItem value="Thursday">Thursday</SelectItem>
                                <SelectItem value="Friday">Friday</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>The day of the week payouts are processed.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="maxDiscountPercent"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Max Coupon Discount (%)</FormLabel>
                        <FormControl><Input type="number" placeholder="20" {...field} /></FormControl>
                         <FormDescription>The maximum discount percentage a coupon can have.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="premiumServiceFeeRate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Premium Plan Fee Rate</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.10" {...field} /></FormControl>
                         <FormDescription>Platform fee for Premium therapists (e.g., 0.10 for 10%).</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="timeZone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>System Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormDescription>The default timezone for all operations.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                         <FormItem>
                            <FormLabel>System Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormDescription>The default currency code (e.g., INR, USD).</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>
               <div className="flex justify-end">
                 <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2"/>}
                    Save Settings
                 </Button>
               </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Export raw database collections as CSV files for analysis or backup. This provides a complete data dump.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                {dataExportItems.map(item => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Button variant="outline" onClick={() => handleDataExport(item.exportFunc, item.name)} disabled={!item.exportFunc}>
                            <FileDown className="mr-2" />
                            Export
                        </Button>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
