
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
import { Save, Percent, Tag, PackagePlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import type { Product, ProductCategory, Offer } from '@/lib/types';
import { listProductCategories, listProducts } from '@/lib/repos/products';
import { createOffer, updateOffer } from '@/lib/repos/offers';

interface OfferFormProps {
  offer?: Partial<Offer> | null;
  offerId?: number;
}

const offerFormSchema = z.object({
  // Core Info
  name: z.string().min(3).max(50),
  type: z.enum(['percent', 'flat'], { required_error: "Type is required." }),
  value: z.coerce.number().min(0, "Value must be positive."),
  
  // Validity & Limits
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  
  // Scope & Rules
  scope: z.enum(['global', 'product']),
  applicableProducts: z.array(z.string()).optional(),
  status: z.enum(['Active', 'Paused', 'Scheduled']),

  // Meta
  description: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

export function OfferForm({ offer, offerId }: OfferFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [prodData, categoryData] = await Promise.all([
        listProducts(),
        listProductCategories()
      ]);
      setProducts(prodData);
      setProductCategories(categoryData);
    };
    fetchData();
  }, []);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      name: offer?.name || '',
      type: offer?.type || 'percent',
      value: offer?.value || 10,
      scope: (offer?.scope as any) || 'global',
      status: offer?.isActive === false ? 'Paused' : 'Active',
      description: offer?.description || '',
      applicableProducts: offer?.applicableProducts?.map(String) || [],
    },
  });

  useEffect(() => {
    if (!offer) return;
    form.reset({
      name: offer.name || '',
      type: offer.type || 'percent',
      value: offer.value || 0,
      scope: (offer.scope as any) || 'global',
      status: offer.isActive === false ? 'Paused' : 'Active',
      description: offer.description || '',
      applicableProducts: offer.applicableProducts?.map(String) || [],
      validFrom: offer.validFrom ? new Date(offer.validFrom) : undefined,
      validTo: offer.validTo ? new Date(offer.validTo) : undefined,
    });
  }, [offer, form]);

  const scope = form.watch('scope');

  async function onSubmit(data: OfferFormValues) {
    try {
      const payload: Partial<Offer> = {
        name: data.name,
        type: data.type,
        value: data.value,
        scope: data.scope,
        isActive: data.status === 'Active',
        validFrom: data.validFrom?.toISOString(),
        validTo: data.validTo?.toISOString(),
        applicableProducts: data.scope === 'product' ? data.applicableProducts?.map(Number) : [],
        description: data.description,
      };

      let res;
      if (offerId) {
        res = await updateOffer(offerId, payload);
      } else {
        res = await createOffer(payload);
      }

      if (res?.success) {
        toast({
          title: offerId ? 'Offer Updated!' : 'Offer Created!',
          description: `Offer "${data.name}" saved successfully.`,
        });
        router.push('/dashboard/admin/offers');
      } else {
        throw new Error(res?.message || 'Failed to save offer');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(onSubmit)(e);
        }} 
        className="space-y-8"
      >
        
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Column 1: Offer Details */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium font-headline text-primary">Offer Details</h3>
                 <FormField 
                    control={form.control} 
                    name="name" 
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Offer Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Summer Sale 20" {...field} />
                            </FormControl>
                            <FormDescription>Internal name for this promotion.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
                 
                <div className="grid grid-cols-2 gap-4">
                  <FormField 
                    control={form.control} 
                    name="type" 
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Discount Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="percent">
                                        <Percent className="inline-block mr-2 w-4 h-4"/> Percentage
                                    </SelectItem>
                                    <SelectItem value="flat">
                                        <Tag className="inline-block mr-2 w-4 h-4"/> Fixed Amount (₹)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                  />
                  
                  <FormField 
                      control={form.control} 
                      name="value" 
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Value</FormLabel>
                              <FormControl>
                                  <Input type="number" placeholder={form.watch('type') === 'percent' ? '10' : '100'} {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                </div>
            </div>

            {/* Column 2: Validity */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium font-headline text-primary">Validity & Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField 
                        control={form.control} 
                        name="validFrom" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valid From</FormLabel>
                                <DatePicker date={field.value} setDate={field.onChange} />
                                <FormDescription>Optional start date.</FormDescription>
                            </FormItem>
                        )}
                    />
                    <FormField 
                        control={form.control} 
                        name="validTo" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valid To</FormLabel>
                                <DatePicker date={field.value} setDate={field.onChange} />
                                <FormDescription>Optional expiry date.</FormDescription>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline text-primary">Scope & Rules</h3>
             <div className="grid md:grid-cols-3 gap-6 items-end">
                <FormField 
                    control={form.control} 
                    name="scope" 
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Scope</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="global">Global (All Products)</SelectItem>
                                    <SelectItem value="product">Specific Products</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
                
                
                {scope === 'product' && (
                    <div className="md:col-span-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-sm font-medium mb-2 block">Select Products</Label>
                        <MultiSelect 
                            options={products.map(p => ({label: p.name, value: String(p.id)}))} 
                            selected={form.watch('applicableProducts') || []} 
                            onChange={(v) => form.setValue('applicableProducts', v)} 
                            placeholder="Select products" 
                        />
                    </div>
                )}
            </div>
        </div>
        
        <Separator />

        <div className="space-y-4">
             <h3 className="text-lg font-medium font-headline text-primary">Status & Meta</h3>
            <FormField 
                control={form.control} 
                name="status" 
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="Active" /></FormControl>
                                    <FormLabel className="font-normal">Active</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="Paused" /></FormControl>
                                    <FormLabel className="font-normal">Paused</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="Scheduled" /></FormControl>
                                    <FormLabel className="font-normal">Scheduled</FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <FormField 
                control={form.control} 
                name="description" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Internal Notes / Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="For internal reference only." rows={3} {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/admin/offers')}>Cancel</Button>
            <Button type="submit" className="min-w-[140px]">
                <Save className="mr-2 h-4 w-4"/> Save Offer
            </Button>
        </div>
      </form>
    </Form>
  );
}
