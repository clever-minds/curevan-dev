

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, PackagePlus, Percent, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Therapist, ProductCategory } from '@/lib/types';
import { listTherapists } from '@/lib/repos/therapists';
import { listProductCategories } from '@/lib/repos/products';
import { createCoupon, updateCoupon } from '@/lib/repos/coupons';
interface CouponFormProps {
  coupon?: Partial<CouponFormValues> | null;
  couponId?: number;
}

const couponFormSchema = z.object({
  // Core Info
  code: z.string().min(3).max(20).transform(v => v.toUpperCase()),
  type: z.enum(['percent', 'flat'], { required_error: "Type is required." }),
  value: z.coerce.number().min(0, "Value must be positive."),
  maxDiscount: z.coerce.number().optional(),

  // Validity & Limits
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  usageLimit: z.coerce.number().optional(),
  usagePerUser: z.coerce.number().optional(),
  minOrderValue: z.coerce.number().optional(),
  
  // Scope & Rules
  ownerType: z.enum(['Platform', 'Therapist'], { required_error: 'Owner type is required.'}),
  therapistId: z.string().optional(),
  scope: z.enum(['Global', 'Category', 'Product']),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  isStackable: z.boolean().default(false),
  status: z.enum(['Active', 'Paused', 'Scheduled']),

  // Meta
  internalNotes: z.string().optional(),
}).refine(data => {
    if (data.ownerType === 'Therapist') {
        return !!data.therapistId;
    }
    return true;
}, {
    message: "A therapist must be selected for therapist-owned codes.",
    path: ["therapistId"],
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

export function CouponForm({ coupon,couponId }: CouponFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
console.log("Initializing form with coupon:", coupon);
  useEffect(() => {
    const fetchData = async () => {
      const [therapistData, categoryData] = await Promise.all([
        listTherapists(),
        listProductCategories()
      ]);
      setTherapists(therapistData);
      setProductCategories(categoryData);
    };
    fetchData();
  }, []);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
        code: '',
        type: 'percent',
        value: 10,
        ownerType: 'Platform',
        scope: 'Global',
        isStackable: false,
        status: 'Active',
        maxDiscount: undefined,
        usageLimit: undefined,
        usagePerUser: undefined,
        minOrderValue: undefined,
        internalNotes: '',
    },
  });
  useEffect(() => {
    if (!coupon) return;

    const mappedCoupon: Partial<CouponFormValues> = {
      code: coupon.code ?? '',
      type: coupon.type ?? 'percent',
      value: Number(coupon.value) ?? 0,

      ownerType: coupon.ownertype ?? 'Platform',
      scope: coupon.scope ?? 'Global',
      isStackable: coupon.isstackable ?? false,

      maxDiscount: coupon.maxdiscount
        ? Number(coupon.maxdiscount)
        : undefined,

      usageLimit: coupon.usagelimit ?? undefined,
      usagePerUser: coupon.usageperuser ?? undefined,
      minOrderValue: coupon.minordervalue
        ? Number(coupon.minordervalue)
        : undefined,

      validFrom: coupon.validfrom
        ? new Date(coupon.validfrom)
        : undefined,

      validTo: coupon.validto
        ? new Date(coupon.validto)
        : undefined,

      therapistId: coupon.therapistid
        ? String(coupon.therapistid)
        : undefined,

      status: coupon.status ?? 'Active',
      internalNotes: coupon.internalnotes ?? '',
    };

    console.log('Mapped coupon →', mappedCoupon);

    form.reset(mappedCoupon);
  }, [coupon, form]);


  const ownerType = form.watch('ownerType');
  const scope = form.watch('scope');

async function onSubmit(data: CouponFormValues) {
  try {
    let res;

    if (couponId) {
      // ✅ UPDATE
      res = await updateCoupon(couponId, {
        status: data.status,
        value: data.value,
        code: data.code,
        type: data.type,
        scope: data.scope,
        owner_type: data.ownerType,
        is_stackable: data.isStackable,
        max_discount: data.maxDiscount,
        valid_from: data.validFrom?.toISOString(),
        valid_to: data.validTo?.toISOString(),
        usage_limit: data.usageLimit,
        usage_per_user: data.usagePerUser,
        min_order_value: data.minOrderValue,
        therapist_id: data.therapistId
          ? Number(data.therapistId)
          : null,
        applicable_categories: data.applicableCategories?.map(Number),
        applicable_products: data.applicableProducts?.map(Number),
        internal_notes: data.internalNotes,
      });
    } else {
      res = await createCoupon({
        status: data.status,
        value: data.value,
        code: data.code,
        type: data.type,
        scope: data.scope,
        owner_type: data.ownerType,
        is_stackable: data.isStackable,
        max_discount: data.maxDiscount,
        valid_from: data.validFrom?.toISOString(),
        valid_to: data.validTo?.toISOString(),
        usage_limit: data.usageLimit,
        usage_per_user: data.usagePerUser,
        min_order_value: data.minOrderValue,
        therapist_id: data.therapistId
          ? Number(data.therapistId)
          : undefined,
        applicable_categories: data.applicableCategories?.map(Number),
        applicable_products: data.applicableProducts?.map(Number),
        internal_notes: data.internalNotes,
      });
    }

    if (res?.success) {
      toast({
        title: couponId ? 'Coupon Updated!' : 'Coupon Created!',
        description: `Coupon "${data.code}" saved successfully.`,
      });

      router.push('/dashboard/ecom-admin/coupons');
      return;
    }

    throw new Error(res?.message || 'Failed to save coupon');

  } catch (error: any) {
    console.error('Coupon submit error:', error);

    toast({
      title: 'Failed',
      description: error?.message || 'Something went wrong',
      variant: 'destructive',
    });
  }
}



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Column 1 */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium font-headline">Coupon Details</h3>
                 <FormField control={form.control} name="code" render={({ field }) => (<FormItem><FormLabel>Coupon Code</FormLabel><FormControl><Input placeholder="e.g., DIWALI20" {...field} /></FormControl><FormDescription>Unique, uppercase code.</FormDescription><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Discount Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="percent"><Percent className="inline-block mr-2"/>Percentage</SelectItem><SelectItem value="flat"><Tag className="inline-block mr-2"/>Fixed Amount (₹)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="value" render={({ field }) => (<FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" placeholder={form.watch('type') === 'percent' ? '10' : '100'} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="maxDiscount" render={({ field }) => (<FormItem><FormLabel>Max Discount (₹)</FormLabel><FormControl><Input type="number" placeholder="Optional cap" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium font-headline">Validity & Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="validFrom" render={({ field }) => (<FormItem><FormLabel>Valid From</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormDescription>Optional start date.</FormDescription></FormItem>)}/>
                    <FormField control={form.control} name="validTo" render={({ field }) => (<FormItem><FormLabel>Valid To</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormDescription>Optional expiry date.</FormDescription></FormItem>)}/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="usageLimit" render={({ field }) => (<FormItem><FormLabel>Total Usage Limit</FormLabel><FormControl><Input type="number" placeholder="Optional" {...field} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="usagePerUser" render={({ field }) => (<FormItem><FormLabel>Limit Per User</FormLabel><FormControl><Input type="number" placeholder="Optional" {...field} /></FormControl></FormItem>)}/>
                </div>
                 <FormField control={form.control} name="minOrderValue" render={({ field }) => (<FormItem><FormLabel>Min. Order Value (₹)</FormLabel><FormControl><Input type="number" placeholder="Optional" {...field} /></FormControl></FormItem>)}/>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Scope & Rules</h3>
            <div className="grid md:grid-cols-3 gap-6">
                <FormField control={form.control} name="ownerType" render={({ field }) => (<FormItem><FormLabel>Owner</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Platform">Platform</SelectItem><SelectItem value="Therapist">Therapist</SelectItem></SelectContent></Select></FormItem>)}/>
                {ownerType === 'Therapist' && (
                    <FormField control={form.control} name="therapistId" render={({ field }) => (<FormItem><FormLabel>Select Therapist</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a therapist"/></SelectTrigger></FormControl><SelectContent>{therapists.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                )}
            </div>
             <div className="grid md:grid-cols-3 gap-6 items-end">
                <FormField control={form.control} name="scope" render={({ field }) => (<FormItem><FormLabel>Scope</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Global">Global (All Products)</SelectItem><SelectItem value="Category">Specific Categories</SelectItem><SelectItem value="Product">Specific Products</SelectItem></SelectContent></Select></FormItem>)}/>
                {scope === 'Category' && <MultiSelect options={productCategories.map(c => ({label: c.name, value: String(c.id)}))} selected={form.watch('applicableCategories') || []} onChange={(v) => form.setValue('applicableCategories', v)} placeholder="Select categories" />}
                {scope === 'Product' && <MultiSelect options={[]} selected={form.watch('applicableProducts') || []} onChange={(v) => form.setValue('applicableProducts', v)} placeholder="Select products" />}
            </div>
            <FormField control={form.control} name="isStackable" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Stackable</FormLabel><FormDescription>Can this coupon be used with other platform offers?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )}/>
        </div>
        
        <Separator />

        <div className="space-y-4">
             <h3 className="text-lg font-medium font-headline">Status & Meta</h3>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem className="space-y-3"><FormLabel>Status</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Active" /></FormControl><FormLabel className="font-normal">Active</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Paused" /></FormControl><FormLabel className="font-normal">Paused</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Scheduled" /></FormControl><FormLabel className="font-normal">Scheduled</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="internalNotes" render={({ field }) => (<FormItem><FormLabel>Internal Notes</FormLabel><FormControl><Textarea placeholder="For internal reference only." rows={3} {...field} /></FormControl></FormItem>)}/>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/admin/coupons')}>Cancel</Button>
            <Button type="submit"><Save className="mr-2 h-4 w-4"/>Save Coupon</Button>
        </div>
      </form>
    </Form>
  );
}
