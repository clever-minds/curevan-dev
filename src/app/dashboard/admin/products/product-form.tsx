
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, PackagePlus, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProductCategory } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { AIRichText } from '@/components/ai/ai-rich-text';
import { listProductCategories } from '@/lib/repos/products';
import { createProducts } from '@/lib/api/products';
import { updateProduct } from '@/lib/api/products';

//import { listProductCategories } from '@/lib/api/categories';
import { Product } from "@/lib/types";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MultiSelect } from '@/components/ui/multi-select';
import { useRouter } from "next/navigation";
import MediaPicker from "@/components/MediaPicker";
import type { MediaItem } from "@/types/media";

const productFormSchema = z.object({
  // Core Info
  productType: z.enum(['Physical', 'Digital', 'Service', 'Bundle'], { required_error: "Product type is required." }),
  title: z.string().min(3, 'Product title must be at least 3 characters.'),
  subtitle: z.string().optional(),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters.'),
  longDescription: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().min(1, "SKU is required."),
  category: z.string().min(1, 'Please select a category.'),
  tags: z.array(z.string()).optional(),
  
  // Pricing & Taxes
  mrp: z.coerce.number().min(0, 'MRP must be a positive number.'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be a positive number.'),
  isTaxInclusive: z.boolean().default(true),
  isCouponExcluded: z.boolean().default(false).describe("Exclude this product from therapist coupon discounts."),
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
  gstSlab: z.coerce.number().optional(),
  
  // Inventory & Fulfillment
  trackInventory: z.boolean().default(true),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  reorderPoint: z.coerce.number().optional(),
  dimensions: z.object({
    lengthCm: z.coerce.number().optional(),
    widthCm: z.coerce.number().optional(),
    heightCm: z.coerce.number().optional(),
    weightKg: z.coerce.number().optional(),
  }).optional(),

  // Manufacturing & Compliance
  manufacturer: z.string().optional(),
  packer: z.string().optional(),
  importer: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  batchNumber: z.string().optional(),
  mfgDate: z.date().optional(),
  expiryDate: z.date().optional(),

  // Media & Visibility
images: z
  .array(
    z.object({
      id: z.number(),
      url: z.string(),
    })
  )
  .min(1, 'At least one image is required'),
  status: z.enum(['Draft', 'Active', 'Archived'], { required_error: 'Please select a status.'}),
}).refine(data => {
    if (data.mrp !== undefined && data.sellingPrice !== undefined) {
        return data.sellingPrice <= data.mrp;
    }
    return true;
}, {
    message: "Selling price cannot be higher than MRP.",
    path: ["sellingPrice"],
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const createProductAction = async (data: ProductFormValues) => {
    console.log("Server Action: Creating product...", data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, productId: `PROD-${Math.floor(Math.random() * 9000) + 1000}` };
}

const allTagsOptions = [
    { value: 'recovery', label: 'Recovery' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'pain-relief', label: 'Pain Relief' },
    { value: 'mobility', label: 'Mobility' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'wellness', label: 'Wellness' },
    { value: 'elderly-care', label: 'Elderly Care' },
    { value: 'orthopedic', label: 'Orthopedic' },
];


export function ProductForm({
  productId,
  initialData,
}: {
  productId?: number;
  initialData?: Partial<ProductFormValues>;
}) {
   const { toast } = useToast();
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const router = useRouter();
   useEffect(() => {
    const fetchCategories = async () => {
        const data = await listProductCategories();
        setProductCategories(data);
    };
    fetchCategories();
  }, []);
  useEffect(() => {
  if (initialData) {
    console.log("Initial Data →", initialData);
    form.reset({
      ...initialData,
      category: initialData.category ? String(initialData.category) : undefined,
      gstSlab: initialData.gstSlab ?? undefined,
      mfgDate: initialData.mfgDate ? new Date(initialData.mfgDate) : undefined,
      expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate) : undefined,
       sacCode: initialData.sacCode || '',    // ✅ convert null → ''
      hsnCode: initialData.hsnCode || '',    // if needed
    });
  }
}, [initialData]);


  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productType: 'Physical',
      status: 'Draft',
      tags: [],
      images: [], 
      mrp: 0,
      sellingPrice: 0,
      isTaxInclusive: true,
      isCouponExcluded: false,
      trackInventory: true,
      stock: 0,
      reorderPoint: 0,
    },
  });

  const productType = form.watch('productType');

  // async function onSubmit(data: ProductFormValues) {
  //   console.log("category,,,,,",data.category);
  //     const imageIds = data.images.map((img: { id: number }) => img.id);

  //       const result = await createProducts({
  //           productType: data.productType,
  //           title: data.title,
  //           subtitle: data.subtitle,
  //           shortDescription: data.shortDescription,
  //           longDescription: data.longDescription,
  //           brand: data.brand,
  //           sku: data.sku,
  //           category: Number(data.category),
  //           mrp: data.mrp,
  //           sellingPrice: data.sellingPrice,
  //           isTaxInclusive: data.isTaxInclusive,
  //           isCouponExcluded: data.isCouponExcluded,
  //           hsnCode: data.hsnCode,
  //           sacCode: data.sacCode,
  //           gstSlab: data.gstSlab,
  //           status: data.status,
  //           stock: data.stock,
  //           reorderPoint: data.reorderPoint,
  //           image_ids: imageIds, // <-- yahi pass hongi
  //           length_cm: data.dimensions?.lengthCm,
  //           width_cm: data.dimensions?.widthCm,
  //           height_cm: data.dimensions?.heightCm,
  //           weight_kg: data.dimensions?.weightKg,

  //           // ✅ Add manufacturing/compliance
  //           manufacturer: data.manufacturer,
  //           country_of_origin: data.countryOfOrigin,
  //           packer: data.packer,
  //           importer: data.importer,
  //           batch_number: data.batchNumber,
  //           manufacturing_date: data.mfgDate?.toISOString().split('T')[0],
  //           expiry_date: data.expiryDate?.toISOString().split('T')[0],
  //       });    
  // if(result.success) {
  //       toast({
  //           title: 'Product Saved!',
  //           description: `The product "${data.title}" has been successfully saved with ID ${result.productId}.`,
  //       });
  //             router.push(`/dashboard/ecom-admin/products`);

  //   } else {
  //       toast({
  //           variant: 'destructive',
  //           title: 'Save Failed',
  //           description: `The product could not be saved. Please try again.`,
  //       });
  //   }
  // }
  async function onSubmit(data: ProductFormValues) {
    console.log("imageIds",data);

    const imageIds = data.images.map((img: { id: number }) => img.id);
    try {
        let result;

        const payload = {
            productType: data.productType,
            title: data.title,
            subtitle: data.subtitle,
            shortDescription: data.shortDescription,
            tags: data.tags,
            longDescription: data.longDescription,
            brand: data.brand,
            sku: data.sku,
            category: Number(data.category),
            mrp: data.mrp,
            sellingPrice: data.sellingPrice,
            isTaxInclusive: data.isTaxInclusive,
            isCouponExcluded: data.isCouponExcluded,
            hsnCode: data.hsnCode,
            sacCode: data.sacCode,
            gstSlab: data.gstSlab,
            status: data.status,
            stock: data.stock,
            reorderPoint: data.reorderPoint,
            image_ids: imageIds,
            length_cm: data.dimensions?.lengthCm,
            width_cm: data.dimensions?.widthCm,
            height_cm: data.dimensions?.heightCm,
            weight_kg: data.dimensions?.weightKg,
            manufacturer: data.manufacturer,
            country_of_origin: data.countryOfOrigin,
            packer: data.packer,
            importer: data.importer,
            batch_number: data.batchNumber,
            manufacturing_date: data.mfgDate?.toISOString().split('T')[0],
            expiry_date: data.expiryDate?.toISOString().split('T')[0],
        };

        if (productId) {
            result = await updateProduct(productId, payload);
        } else {
            result = await createProducts(payload);
        }

        if (result.success) {
            toast({
                title: 'Product Saved!',
                description: `The product "${data.title}" has been successfully saved with ID ${result.productId}.`,
            });
            router.push(`/dashboard/ecom-admin/products`);
        } else {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: `The product could not be saved. Please try again.`,
            });
        }
    } catch (err) {
        console.error(err);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Something went wrong while saving the product.',
        });
    }
}


  return (
    <Form {...form}>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Core Information</h3>
            <FormField control={form.control} name="productType" render={({ field }) => (<FormItem><FormLabel>Product Type</FormLabel><Select onValueChange={field.onChange} key={field.value} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a product type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Physical">Physical Good</SelectItem><SelectItem value="Digital">Digital Product</SelectItem><SelectItem value="Service">Service</SelectItem><SelectItem value="Bundle">Bundle</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Premium Massage Gun" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="subtitle" render={({ field }) => (<FormItem><FormLabel>Subtitle (Optional)</FormLabel><FormControl><Input placeholder="e.g., Deep Tissue Percussion Massager" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="shortDescription" render={({ field }) => (<FormItem><FormLabel>Short Description</FormLabel><FormControl><Textarea placeholder="A concise summary for product cards." rows={3} {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="longDescription" render={({ field }) => (<FormItem><FormLabel>Full Description (Optional)</FormLabel><FormControl><AIRichText value={field.value || ''} onChange={field.onChange} placeholder="Detailed product description, specifications, and usage instructions..." context={{ entityType: 'post' }} /></FormControl><FormMessage /></FormItem>)}/>
            <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="Brand Name" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input placeholder="UNIQUE-SKU-123" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            </div>
             <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} key={field.value} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{productCategories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tags <span className="text-muted-foreground">(Select or create new)</span></FormLabel>
                            <MultiSelect
                                key={field.value?.join(',')}
                                options={allTagsOptions}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder="Select or type to create tags..."
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
        <Separator />
        <div className="space-y-4">
             <h3 className="text-lg font-medium font-headline">Pricing, Taxes & Promotions</h3>
             <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="mrp" render={({ field }) => (<FormItem><FormLabel>MRP (₹)</FormLabel><FormControl><Input type="number" placeholder="e.g., 6000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="sellingPrice" render={({ field }) => (<FormItem><FormLabel>Selling Price (₹)</FormLabel><FormControl><Input type="number" placeholder="e.g., 4999" {...field} /></FormControl><FormMessage /></FormItem>)}/>
             </div>
             <FormField control={form.control} name="isTaxInclusive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Price includes tax?</FormLabel><FormDescription>Is GST already included in the selling price?</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
             <FormField control={form.control} name="isCouponExcluded" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Exclude from Therapist Coupons</FormLabel><FormDescription>If enabled, this product will not be discounted by referral codes.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
            {productType === 'Service' ? (<FormField control={form.control} name="sacCode" render={({ field }) => (<FormItem><FormLabel>SAC Code</FormLabel><FormControl><Input placeholder="e.g., 99834" {...field} /></FormControl><FormMessage /></FormItem>)}/>) : (<FormField control={form.control} name="hsnCode" render={({ field }) => (<FormItem><FormLabel>HSN Code</FormLabel><FormControl><Input placeholder="e.g., 901910" {...field} /></FormControl><FormMessage /></FormItem>)}/>)}
            <FormField control={form.control} name="gstSlab" render={({ field }) => (<FormItem><FormLabel>GST Slab (%)</FormLabel><Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}><FormControl><SelectTrigger><SelectValue placeholder="Select GST rate" /></SelectTrigger></FormControl><SelectContent><SelectItem value="0">0%</SelectItem><SelectItem value="5">5%</SelectItem><SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem><SelectItem value="28">28%</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
        </div>
        <Separator />
        {(productType === 'Physical' || productType === 'Bundle') && (
            <div className="space-y-4">
                <h3 className="text-lg font-medium font-headline">Inventory & Fulfillment</h3>
                <FormField control={form.control} name="trackInventory" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Track Inventory</FormLabel><FormDescription>Enable stock management for this product.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Available Stock</FormLabel><FormControl><Input type="number" placeholder="100" {...field} disabled={!form.watch('trackInventory')} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="reorderPoint" render={({ field }) => (<FormItem><FormLabel>Reorder Point</FormLabel><FormControl><Input type="number" placeholder="10" {...field} disabled={!form.watch('trackInventory')} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
                 <h4 className="text-sm font-medium font-headline pt-2">Package Dimensions</h4>
                 <Alert><Info className="h-4 w-4" /><AlertDescription>These details are crucial for accurate shipping cost calculation.</AlertDescription></Alert>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField control={form.control} name="dimensions.lengthCm" render={({ field }) => (<FormItem><FormLabel>Length (cm)</FormLabel><FormControl><Input type="number" placeholder="e.g. 20" {...field} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="dimensions.widthCm" render={({ field }) => (<FormItem><FormLabel>Width (cm)</FormLabel><FormControl><Input type="number" placeholder="e.g. 15" {...field} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="dimensions.heightCm" render={({ field }) => (<FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="e.g. 10" {...field} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="dimensions.weightKg" render={({ field }) => (<FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="e.g. 1.5" {...field} /></FormControl></FormItem>)}/>
                </div>
            </div>
        )}
        <Separator />
        <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Manufacturing & Compliance</h3>
            <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="manufacturer" render={({ field }) => (<FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input placeholder="Manufacturer Name" {...field} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="countryOfOrigin" render={({ field }) => (<FormItem><FormLabel>Country of Origin</FormLabel><FormControl><Input placeholder="e.g., India" {...field} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="packer" render={({ field }) => (<FormItem><FormLabel>Packer (Optional)</FormLabel><FormControl><Input placeholder="Packer Name" {...field} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="importer" render={({ field }) => (<FormItem><FormLabel>Importer (Optional)</FormLabel><FormControl><Input placeholder="Importer Name" {...field} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="batchNumber" render={({ field }) => (<FormItem><FormLabel>Batch/Lot Number</FormLabel><FormControl><Input placeholder="e.g., A23-456" {...field} /></FormControl></FormItem>)}/>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <Controller control={form.control} name="mfgDate" render={({ field }) => (<FormItem><FormLabel>Manufacturing Date</FormLabel><DatePicker date={field.value} setDate={field.onChange} /></FormItem>)}/>
                <Controller control={form.control} name="expiryDate" render={({ field }) => (<FormItem><FormLabel>Use Before/Expiry Date</FormLabel><DatePicker date={field.value} setDate={field.onChange} /></FormItem>)}/>
            </div>
        </div>
        <Separator />
        <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Media & Visibility</h3>
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images</FormLabel>

                    <FormControl>
                      <MediaPicker
                        value={field.value as MediaItem[]}   // ✅ FIX
                        onChange={(media: MediaItem[]) => field.onChange(media)}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
             <FormField control={form.control} name="status" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Status</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} key={field.value} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Draft" /></FormControl><FormLabel className="font-normal">Draft</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Active" /></FormControl><FormLabel className="font-normal">Active</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Archived" /></FormControl><FormLabel className="font-normal">Archived</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)}/>
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit"   onClick={() => console.log('Submit button clicked!')} disabled={form.formState.isSubmitting}><PackagePlus className="mr-2 h-4 w-4"/>Save Product</Button>
        </div>
      </form>
    </Form>
  );
}
