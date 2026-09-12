
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Save, PackagePlus, Info, Plus, Minus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProductCategory } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { AIRichText } from '@/components/ai/ai-rich-text';
import { listProductCategories } from '@/lib/repos/products';
import { getTherapyCategoriesWithIds, listSubCategories } from '@/lib/repos/categories';
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
  subtitle: z.string().nullable().optional(),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters.'),
  longDescription: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  sku: z.string().min(1, 'SKU is required.'),
  category: z.string().min(1, 'Please select a category.'),
  subCategory: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  
  // Pricing & Taxes
  mrp: z.coerce.number().min(0, 'MRP must be a positive number.'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be a positive number.'),
  isTaxInclusive: z.boolean().default(true),
  isCouponExcluded: z.boolean().default(false).describe("Exclude this product from therapist coupon discounts."),
  hsnCode: z.string().nullable().optional(),
  sacCode: z.string().nullable().optional(),
  gstSlab: z.coerce.number().nullable().optional(),
  isRecommended: z.boolean().default(false).describe("Mark as a recommended product for a specific service"),
  serviceTypeId: z.coerce.number().nullable().optional().describe("Service Type this product is recommended for"),
  
  // Inventory & Fulfillment
  trackInventory: z.boolean().default(true),
  stock: z.coerce.number().min(0, 'Stock cannot be negative.'),
  reorderPoint: z.coerce.number().min(0, 'Reorder point cannot be negative.').optional(),
  dimensions: z.object({
    lengthCm: z.coerce.number().min(0, 'Length cannot be negative.').nullable().optional(),
    widthCm: z.coerce.number().min(0, 'Width cannot be negative.').nullable().optional(),
    heightCm: z.coerce.number().min(0, 'Height cannot be negative.').nullable().optional(),
    weightKg: z.coerce.number().min(0, 'Weight cannot be negative.').nullable().optional(),
  }).nullable().optional(),

  // Manufacturing & Compliance
  manufacturer: z.string().nullable().optional(),
  packer: z.string().nullable().optional(),
  importer: z.string().nullable().optional(),
  countryOfOrigin: z.string().nullable().optional(),
  batchNumber: z.string().nullable().optional(),
  mfgDate: z.date().nullable().optional(),
  expiryDate: z.date().nullable().optional(),

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
  additionalFeatures: z.array(z.object({
      title: z.string().min(1, 'Title is required'),
      value: z.string().min(1, 'Value is required'),
      isHighlighted: z.boolean().default(false)
  })).optional(),
  hasVariants: z.boolean().default(false),
  variants: z.array(z.object({
    sku: z.string().min(1, "SKU is required for variant"),
    mrp: z.coerce.number().min(0, "MRP must be positive"),
    sellingPrice: z.coerce.number().min(0, "Selling price must be positive"),
    stock: z.coerce.number().min(0, "Stock cannot be negative"),
    reorderPoint: z.coerce.number().min(0).optional(),
    attributes: z.record(z.string()),
    image: z.array(z.any()).optional(),
  })).optional(),
    bundleItems: z.array(z.object({
        componentProductId: z.number({ required_error: 'Product is required' }),
        componentVariantSku: z.string().nullable().optional(),
        quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
        sellingPrice: z.coerce.number().min(0).optional(),
        discount: z.coerce.number().min(0).optional(),
        gstSlab: z.coerce.number().min(0).optional()
    })).optional(),
}).superRefine((data, ctx) => {
    if (data.mrp !== undefined && data.sellingPrice !== undefined && data.sellingPrice > data.mrp) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: data.productType === 'Bundle' ? "Discounted price cannot be higher than Selling price." : "Selling price cannot be higher than MRP.",
            path: ["sellingPrice"]
        });
    }
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


const VariantAttributesInput = ({ value, onChange }: { value: Record<string, string>, onChange: (val: Record<string, string>) => void }) => {
  const [text, setText] = useState(() => 
    value ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ') : ''
  );

  const parseText = useCallback((t: string) => {
    const attrs: Record<string, string> = {};
    t.split(',').forEach(pair => {
      const parts = pair.split(':');
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim();
        if (k && v) attrs[k] = v;
      }
    });
    return attrs;
  }, []);

  useEffect(() => {
    const currentParsed = parseText(text);
    if (JSON.stringify(currentParsed) !== JSON.stringify(value || {})) {
      setText(value ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ') : '');
    }
  }, [value, text, parseText]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onChange(parseText(e.target.value));
  };

  return <Input placeholder="e.g. Size: M, Color: Red" value={text} onChange={handleChange} />;
};


export function ProductForm({
  productId,
  initialData,
}: {
  productId?: number;
  initialData?: Partial<ProductFormValues>;
}) {
   const { toast } = useToast();
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [serviceTypes, setServiceTypes] = useState<{id: number, name: string}[]>([]);
  const [subCategories, setSubCategories] = useState<{id: number, name: string}[]>([]);
  const router = useRouter();
   useEffect(() => {
    const fetchCategories = async () => {
        const data = await listProductCategories();
        setProductCategories(data);
    };
    const fetchServiceTypes = async () => {
        const data = await getTherapyCategoriesWithIds();
        setServiceTypes(data);
    };
    fetchCategories();
    fetchServiceTypes();
  }, []);
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
      additionalFeatures: [],
      isRecommended: false,
      serviceTypeId: undefined,
      hasVariants: false,
      variants: [],
      bundleItems: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalFeatures" as any
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control: form.control,
    name: "variants" as any
  });

  const { fields: bundleFields, append: appendBundleItem, remove: removeBundleItem } = useFieldArray({
    control: form.control,
    name: "bundleItems" as any
  });

  useEffect(() => {
  if (initialData) {
    console.log("Initial Data →", initialData);
    form.reset({
      ...initialData,
      category: initialData.category !== undefined && initialData.category !== null ? String(initialData.category) : undefined,
      subCategory: (initialData.subCategory || (initialData as any).subCategoryId) !== undefined && (initialData.subCategory || (initialData as any).subCategoryId) !== null ? String(initialData.subCategory || (initialData as any).subCategoryId) : undefined,
      bundleItems: initialData.bundleItems || [],
      gstSlab: initialData.gstSlab ?? undefined,
      mfgDate: initialData.mfgDate ? new Date(initialData.mfgDate) : undefined,
      expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate) : undefined,
      sacCode: initialData.sacCode || '',
      hsnCode: initialData.hsnCode || '',
      subtitle: initialData.subtitle || '',
      longDescription: initialData.longDescription || '',
      brand: initialData.brand || '',
      manufacturer: initialData.manufacturer || '',
      packer: initialData.packer || '',
      importer: initialData.importer || '',
      countryOfOrigin: initialData.countryOfOrigin || '',
      batchNumber: initialData.batchNumber || '',
      dimensions: {
        lengthCm: initialData.dimensions?.lengthCm ?? undefined,
        widthCm: initialData.dimensions?.widthCm ?? undefined,
        heightCm: initialData.dimensions?.heightCm ?? undefined,
        weightKg: initialData.dimensions?.weightKg ?? undefined,
      },
      additionalFeatures: (initialData as any).additionalFeatures || [],
      isRecommended: initialData.isRecommended || false,
      serviceTypeId: initialData.serviceTypeId ?? undefined,
    });
  }
}, [initialData, form]);

  const productType = form.watch('productType');
  const watchedCategory = form.watch('category');
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    if (watchedCategory) {
      listSubCategories(watchedCategory).then(data => {
        setSubCategories(data || []);
      }).catch(err => {
        console.error("Failed to fetch subcategories", err);
        setSubCategories([]);
      });
    } else {
      setSubCategories([]);
    }
  }, [watchedCategory]);

  useEffect(() => {
    if (productType === 'Bundle') {
      import('@/lib/api/products').then(api => {
        api.listProducts().then(data => {
          const uniqueProducts = (items: any[]) => Array.from(
            new Map(items.filter((p: any) => p.productType !== 'Bundle' && p.status === 'Active').map((p: any) => [p.id, p])).values()
          );
          if (data && data.products) {
            setAllProducts(uniqueProducts(data.products));
          } else if (Array.isArray(data)) {
            setAllProducts(uniqueProducts(data));
          } else if (data && data.data && Array.isArray(data.data)) {
            setAllProducts(uniqueProducts(data.data));
          }
        }).catch(err => console.error("Error fetching products for bundle:", err));
      });
    }
  }, [productType]);

  const watchedBundleItems = form.watch('bundleItems');
  const bundleItemsSerialized = JSON.stringify(watchedBundleItems);

  useEffect(() => {
    if (productType === 'Bundle' && watchedBundleItems && Array.isArray(watchedBundleItems)) {
      let totalMrp = 0;
      let totalSellingPrice = 0;
      let maxGst = 0;

      watchedBundleItems.forEach((item: any) => {
        const qty = Number(item.quantity) || 1;
        const sp = Number(item.sellingPrice) || 0; // Assuming this is base price (exclusive of GST)
        const disc = Number(item.discount) || 0;
        const gst = Number(item.gstSlab) || 0;
        
        // MRP is Base Price + GST
        const rowMrp = sp * (1 + (gst / 100));
        
        // Apply discount on base price as a percentage
        const discountAmount = sp * (disc / 100);
        const discountedBasePrice = Math.max(0, sp - discountAmount);
        
        // Final Selling Price adds GST on the discounted base price
        const rowFinalAmount = discountedBasePrice * (1 + (gst / 100));

        totalMrp += rowMrp * qty; 
        totalSellingPrice += rowFinalAmount * qty;
        
        if (gst > maxGst) {
          maxGst = gst;
        }
      });

      const currentMrp = Number(form.getValues('mrp') || 0);
      const currentSellingPrice = Number(form.getValues('sellingPrice') || 0);
      const currentGst = Number(form.getValues('gstSlab') || 0);
      
      const newMrp = Number(totalMrp.toFixed(2));
      const newSp = Number(totalSellingPrice.toFixed(2));

      if (currentMrp !== newMrp) {
        form.setValue('mrp', newMrp, { shouldValidate: true, shouldDirty: true });
      }
      if (currentSellingPrice !== newSp) {
        form.setValue('sellingPrice', newSp, { shouldValidate: true, shouldDirty: true });
      }
      if (currentGst !== maxGst) {
        form.setValue('gstSlab', maxGst, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [bundleItemsSerialized, productType, form]);

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
            subtitle: data.subtitle ?? undefined,
            tags: data.tags ?? undefined,
            shortDescription: data.shortDescription,
            longDescription: data.longDescription ?? undefined,
            brand: data.brand ?? undefined,
            sku: data.sku,
            category: Number(data.category),
            mrp: data.mrp,
            sellingPrice: data.sellingPrice,
            isTaxInclusive: data.isTaxInclusive,
            isCouponExcluded: data.isCouponExcluded,
            hsnCode: data.hsnCode ?? undefined,
            sacCode: data.sacCode ?? undefined,
            gstSlab: data.gstSlab ?? undefined,
            status: data.status,
            stock: data.stock,
            reorderPoint: data.reorderPoint,
            image_ids: imageIds,
            length_cm: data.dimensions?.lengthCm ?? undefined,
            width_cm: data.dimensions?.widthCm ?? undefined,
            height_cm: data.dimensions?.heightCm ?? undefined,
            weight_kg: data.dimensions?.weightKg ?? undefined,
            manufacturer: data.manufacturer ?? undefined,
            country_of_origin: data.countryOfOrigin ?? undefined,
            packer: data.packer ?? undefined,
            importer: data.importer ?? undefined,
            batch_number: data.batchNumber ?? undefined,
            manufacturing_date: data.mfgDate?.toISOString().split('T')[0],
            expiry_date: data.expiryDate?.toISOString().split('T')[0],
            additional_features: data.additionalFeatures?.map(f => JSON.stringify({
                title: f.title,
                value: f.value,
                is_highlighted: f.isHighlighted
            })) ?? [],
            is_recommended: data.isRecommended,
            service_type_id: data.serviceTypeId ?? undefined,
            sub_category_id: data.subCategory ? Number(data.subCategory) : undefined,
            variants: data.hasVariants ? (data.variants || []).map((v: any) => ({
                ...v,
                imageId: v.image && v.image.length > 0 ? v.image[0].id : undefined
            })) : [],
            bundleItems: data.productType === 'Bundle' ? data.bundleItems : [],
            bundle_items: data.productType === 'Bundle' ? data.bundleItems?.map((item: any) => ({
                component_product_id: item.componentProductId,
                component_variant_sku: item.componentVariantSku,
                quantity: item.quantity
            })) : [],
            additionalFeatures: data.additionalFeatures?.map(f => ({
                title: f.title,
                value: f.value,
                isHighlighted: f.isHighlighted
            })) ?? []
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
    } catch (err: any) {
        console.error(err);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: err.message || 'Something went wrong while saving the product.',
        });
    }
}


  return (
    <Form {...form}>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="space-y-6">
            <h3 className="text-lg font-medium font-headline border-b pb-2">Core Information</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <FormField control={form.control} name="productType" render={({ field }) => (<FormItem><FormLabel>Product Type <span className="text-red-500">*</span></FormLabel><Select onValueChange={field.onChange} key={field.value} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a product type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Physical">Physical Good</SelectItem><SelectItem value="Digital">Digital Product</SelectItem><SelectItem value="Service">Service</SelectItem><SelectItem value="Bundle">Bundle</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="e.g., Premium Massage Gun" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="subtitle" render={({ field }) => (<FormItem><FormLabel>Subtitle (Optional)</FormLabel><FormControl><Input placeholder="e.g., Deep Tissue Percussion Massager" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="Brand Name" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU <span className="text-red-500">*</span></FormLabel><FormControl><Input placeholder="UNIQUE-SKU-123" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category <span className="text-red-500">*</span></FormLabel><Select onValueChange={(val) => { field.onChange(val); form.setValue('subCategory', ''); }} key={field.value} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{productCategories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                
                <FormField control={form.control} name="subCategory" render={({ field }) => (<FormItem><FormLabel>Sub Category</FormLabel><Select onValueChange={field.onChange} key={field.value} value={field.value || ""} disabled={!watchedCategory || subCategories.length === 0}><FormControl><SelectTrigger><SelectValue placeholder="Select a sub category" /></SelectTrigger></FormControl><SelectContent>{subCategories.map(sub => <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                
                <FormField control={form.control} name="isRecommended" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 mt-1 shadow-sm h-[72px]">
                        <div className="space-y-0.5">
                            <FormLabel>Recommended</FormLabel>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}/>
                
                <FormField control={form.control} name="serviceTypeId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Service Type {form.watch("isRecommended") && <span className="text-red-500">*</span>}</FormLabel>
                        <Select onValueChange={field.onChange} key={field.value} value={field.value ? String(field.value) : undefined} disabled={!form.watch("isRecommended")}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select a therapy/service" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {serviceTypes.map(st => (
                                    <SelectItem key={st.id} value={String(st.id)}>{st.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tags <span className="text-muted-foreground">(Select or create)</span></FormLabel>
                            <MultiSelect
                                key={field.value?.join(',')}
                                options={allTagsOptions}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder="Select or type..."
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <FormField control={form.control} name="shortDescription" render={({ field }) => (<FormItem><FormLabel>Short Description <span className="text-red-500">*</span></FormLabel><FormControl><Textarea placeholder="A concise summary for product cards." rows={3} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <div className="space-y-4">
                    <FormLabel>Additional Features / Specifications <span className="text-muted-foreground">(Key-Value Pairs)</span></FormLabel>
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                                <FormField
                                    control={form.control}
                                    name={`additionalFeatures.${index}.title` as any}
                                    render={({ field }) => (
                                        <div className="flex-1">
                                            <FormControl>
                                                <Input {...field} placeholder="Label (e.g. Material)" />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`additionalFeatures.${index}.value` as any}
                                    render={({ field }) => (
                                        <div className="flex-1">
                                            <FormControl>
                                                <Input {...field} placeholder="Value (e.g. Plastic)" />
                                            </FormControl>
                                            <FormMessage />
                                        </div>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`additionalFeatures.${index}.isHighlighted` as any}
                                    render={({ field }) => (
                                        <div className="flex flex-col items-center gap-1 pt-2">
                                            <FormControl>
                                                <Checkbox 
                                                    checked={field.value} 
                                                    onCheckedChange={field.onChange} 
                                                />
                                            </FormControl>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase">Highlight</span>
                                        </div>
                                    )}
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => remove(index)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => append({ title: "", value: "", isHighlighted: false })}
                        className="mt-2"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Specification
                    </Button>
                </div>
                <FormField control={form.control} name="longDescription" render={({ field }) => (<FormItem><FormLabel>Full Description (Optional)</FormLabel><FormControl><AIRichText value={field.value || ''} onChange={field.onChange} placeholder="Detailed product description, specifications, and usage instructions..." context={{ entityType: 'post' }} /></FormControl><FormMessage /></FormItem>)}/>
            </div>
        </div>
        <Separator />
        

        
        <div className="space-y-6">
             <div className="flex items-center justify-between border-b pb-2">
                 <h3 className="text-lg font-medium font-headline">Product Variants</h3>
                 <FormField control={form.control} name="hasVariants" render={({ field }) => (
                     <FormItem className="flex items-center gap-2 space-y-0">
                         <FormLabel className="m-0">Enable Variants</FormLabel>
                         <FormControl>
                             <Switch checked={field.value} onCheckedChange={field.onChange} />
                         </FormControl>
                     </FormItem>
                 )}/>
             </div>
             {form.watch("hasVariants") && (
                 <div className="space-y-4">
                     <Alert><Info className="h-4 w-4" /><AlertDescription>Add specific SKUs, prices, and stock for each variant (e.g. Size M, Color Red).</AlertDescription></Alert>
                     <div className="border rounded-md overflow-x-auto">
                         <table className="w-full text-sm">
                             <thead className="bg-muted">
                                 <tr>
                                     <th className="p-2 text-left font-medium">SKU</th>
                                     <th className="p-2 text-left font-medium min-w-[200px]">Options (e.g. Size: M, Color: Red)</th>
                                     <th className="p-2 text-left font-medium">Image</th>
                                     <th className="p-2 text-left font-medium">MRP</th>
                                     <th className="p-2 text-left font-medium">Selling Price</th>
                                     <th className="p-2 text-left font-medium">Stock</th>
                                     <th className="p-2 text-center font-medium">Actions</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {variantFields.map((field, index) => (
                                     <tr key={field.id} className="border-t">
                                         <td className="p-2">
                                             <FormField control={form.control} name={`variants.${index}.sku` as any} render={({ field }) => (<FormControl><Input placeholder="Variant SKU" {...field} /></FormControl>)} />
                                         </td>
                                         <td className="p-2">
                                             <FormField control={form.control} name={`variants.${index}.attributes` as any} render={({ field }) => (<FormControl><VariantAttributesInput value={field.value as any} onChange={field.onChange} /></FormControl>)} />
                                         </td>
                                         <td className="p-2 min-w-[120px]">
                                             <FormField control={form.control} name={`variants.${index}.image` as any} render={({ field }) => (
                                                 <FormControl>
                                                     <MediaPicker
                                                         value={field.value || []}
                                                         onChange={(media: any) => field.onChange(media)}
                                                         multiple={false}
                                                     />
                                                 </FormControl>
                                             )} />
                                         </td>
                                         <td className="p-2">
                                             <FormField control={form.control} name={`variants.${index}.mrp` as any} render={({ field }) => (<FormControl><Input type="number" placeholder="MRP" {...field} /></FormControl>)} />
                                         </td>
                                         <td className="p-2">
                                             <FormField control={form.control} name={`variants.${index}.sellingPrice` as any} render={({ field }) => (<FormControl><Input type="number" placeholder="Price" {...field} /></FormControl>)} />
                                         </td>
                                         <td className="p-2">
                                             <FormField control={form.control} name={`variants.${index}.stock` as any} render={({ field }) => (<FormControl><Input type="number" placeholder="Stock" {...field} /></FormControl>)} />
                                         </td>
                                         <td className="p-2 text-center">
                                             <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)} className="text-destructive"><X className="h-4 w-4" /></Button>
                                         </td>
                                     </tr>
                                 ))}
                                 {variantFields.length === 0 && (
                                     <tr>
                                         <td colSpan={6} className="p-4 text-center text-muted-foreground">No variants added yet.</td>
                                     </tr>
                                 )}
                             </tbody>
                         </table>
                     </div>
                     <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({ sku: "", mrp: 0, sellingPrice: 0, stock: 0, attributes: {} })}>
                         <Plus className="h-4 w-4 mr-2" /> Add Variant
                     </Button>
                 </div>
             )}
        </div>


        {productType === 'Bundle' && (
            <>
                <Separator />
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-lg font-medium font-headline">Bundle Components</h3>
                    </div>
                    <div className="space-y-4">
                        <Alert><Info className="h-4 w-4" /><AlertDescription>Select the products that make up this bundle.</AlertDescription></Alert>
                        <div className="border rounded-md overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-2 text-left font-medium">Product <span className="text-red-500">*</span></th>
                                        <th className="p-2 text-left font-medium">Variant SKU (Optional)</th>
                                        <th className="p-2 text-left font-medium">Quantity <span className="text-red-500">*</span></th>
                                        <th className="p-2 text-left font-medium">Selling Price</th>
                                        <th className="p-2 text-left font-medium">Discount (%)</th>
                                        <th className="p-2 text-left font-medium">GST (%)</th>
                                        <th className="p-2 text-left font-medium">Final Amount</th>
                                        <th className="p-2 text-center font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bundleFields.map((field, index) => (
                                        <tr key={field.id} className="border-t">
                                            <td className="p-2 min-w-[200px]">
                                                <FormField control={form.control} name={`bundleItems.${index}.componentProductId` as any} render={({ field }) => (
                                                    <FormControl>
                                                        <Select onValueChange={(val) => {
                                                            field.onChange(Number(val));
                                                            const selectedProduct = allProducts.find(p => String(p.id) === val);
                                                            if (selectedProduct) {
                                                                console.log("Selected product for bundle:", selectedProduct);
                                                                if (selectedProduct.sku && (!selectedProduct.variants || selectedProduct.variants.length === 0)) {
                                                                    form.setValue(`bundleItems.${index}.componentVariantSku` as any, selectedProduct.sku, { shouldValidate: true, shouldDirty: true });
                                                                } else {
                                                                    form.setValue(`bundleItems.${index}.componentVariantSku` as any, "", { shouldValidate: true, shouldDirty: true });
                                                                }
                                                                const gst = selectedProduct.gst_slab || selectedProduct.gstSlab || selectedProduct.gstPercent || selectedProduct.gst_percent || 0;
                                                                form.setValue(`bundleItems.${index}.gstSlab` as any, Number(gst), { shouldValidate: true, shouldDirty: true });
                                                            }
                                                        }} value={field.value ? String(field.value) : undefined}>
                                                            <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                                                            <SelectContent>
                                                                {allProducts.map(p => (
                                                                    <SelectItem key={p.id} value={String(p.id)}>{p.title} (SKU: {p.sku})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                )} />
                                            </td>
                                            <td className="p-2">
                                                <FormField control={form.control} name={`bundleItems.${index}.componentVariantSku` as any} render={({ field }) => {
                                                    const selectedProductId = form.watch(`bundleItems.${index}.componentProductId`);
                                                    const selectedProduct = allProducts.find(p => String(p.id) === String(selectedProductId));
                                                    
                                                    if (selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0) {
                                                        return (
                                                            <FormControl>
                                                                <Select onValueChange={(val) => {
                                                                    field.onChange(val);
                                                                    const variant = selectedProduct.variants.find((v: any) => v.sku === val);
                                                                }} value={field.value ?? undefined}>
                                                                    <SelectTrigger><SelectValue placeholder="Select Variant" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {selectedProduct.variants.map((v: any) => (
                                                                            <SelectItem key={v.sku} value={v.sku}>{v.sku}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormControl>
                                                        );
                                                    }
                                                    
                                                    return (<FormControl><Input placeholder="Variant SKU" {...field} value={field.value ?? ''} /></FormControl>);
                                                }} />
                                            </td>
                                            <td className="p-2 w-24">
                                                <FormField control={form.control} name={`bundleItems.${index}.quantity` as any} render={({ field }) => (<FormControl><Input type="number" min="1" {...field} /></FormControl>)} />
                                            </td>
                                            <td className="p-2 w-24">
                                                <FormField control={form.control} name={`bundleItems.${index}.sellingPrice` as any} render={({ field }) => (<FormControl><Input type="number" min="0" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>)} />
                                            </td>
                                            <td className="p-2 w-24">
                                                <FormField control={form.control} name={`bundleItems.${index}.discount` as any} render={({ field }) => (<FormControl><Input type="number" min="0" max="100" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>)} />
                                            </td>
                                            <td className="p-2 w-24">
                                                <FormField control={form.control} name={`bundleItems.${index}.gstSlab` as any} render={({ field }) => (<FormControl><Input type="number" min="0" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>)} />
                                            </td>
                                            <td className="p-2 font-medium">
                                                {(() => {
                                                    const qty = Number(form.watch(`bundleItems.${index}.quantity` as any) || 0);
                                                    const sp = Number(form.watch(`bundleItems.${index}.sellingPrice` as any) || 0);
                                                    const disc = Number(form.watch(`bundleItems.${index}.discount` as any) || 0);
                                                    const gst = Number(form.watch(`bundleItems.${index}.gstSlab` as any) || 0);
                                                    const discountAmount = sp * (disc / 100);
                                                    const discountedPrice = Math.max(0, sp - discountAmount);
                                                    const gstAmount = discountedPrice * (gst / 100);
                                                    return '₹' + ((discountedPrice + gstAmount) * qty).toFixed(2);
                                                })()}
                                            </td>
                                            <td className="p-2 text-center">
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeBundleItem(index)} className="text-destructive"><X className="h-4 w-4" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {bundleFields.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-4 text-center text-muted-foreground">No components added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendBundleItem({ componentProductId: 0, quantity: 1 })}>
                            <Plus className="h-4 w-4 mr-2" /> Add Component
                        </Button>
                    </div>
                </div>
            </>
        )}

        <Separator />
        
        {!form.watch("hasVariants") && (
            <>
                <div className="space-y-6">
                    <h3 className="text-lg font-medium font-headline border-b pb-2">Pricing & Taxes</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={form.control} name="mrp" render={({ field }) => (<FormItem><FormLabel>{productType === 'Bundle' ? 'Selling Price' : 'MRP'} <span className="text-red-500">*</span></FormLabel><FormControl><Input type="number" step="any" placeholder="0.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="sellingPrice" render={({ field }) => (<FormItem><FormLabel>{productType === 'Bundle' ? 'Discounted Price' : 'Selling Price'} <span className="text-red-500">*</span></FormLabel><FormControl><Input type="number" step="any" placeholder="0.00" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                        {productType !== 'Bundle' && (
                            <FormField control={form.control} name="gstSlab" render={({ field }) => (<FormItem><FormLabel>GST Slab (%)</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g. 18" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                        )}
                        <FormField control={form.control} name="hsnCode" render={({ field }) => (<FormItem><FormLabel>HSN Code</FormLabel><FormControl><Input placeholder="HSN Code" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="sacCode" render={({ field }) => (<FormItem><FormLabel>SAC Code</FormLabel><FormControl><Input placeholder="SAC Code" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                    <div className="flex gap-6">
                        <FormField control={form.control} name="isTaxInclusive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm w-full"><div className="space-y-0.5"><FormLabel>Price includes taxes</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                        <FormField control={form.control} name="isCouponExcluded" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm w-full"><div className="space-y-0.5"><FormLabel>Exclude from Coupons</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                    </div>
                </div>
                <Separator />
            </>
        )}

        <Separator />
        {!form.watch("hasVariants") && (productType === 'Physical' || productType === 'Bundle') && (
            <div className="space-y-4">
                <h3 className="text-lg font-medium font-headline">Inventory & Fulfillment</h3>
                <FormField control={form.control} name="trackInventory" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Track Inventory</FormLabel><FormDescription>Enable stock management for this product.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Available Stock</FormLabel><FormControl><Input type="number" min="0" placeholder="100" {...field} disabled={!form.watch('trackInventory')} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="reorderPoint" render={({ field }) => (<FormItem><FormLabel>Reorder Point</FormLabel><FormControl><Input type="number" min="0" placeholder="10" {...field} disabled={!form.watch('trackInventory')} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
                 <h4 className="text-sm font-medium font-headline pt-2">Package Dimensions</h4>
                 <Alert><Info className="h-4 w-4" /><AlertDescription>These details are crucial for accurate shipping cost calculation.</AlertDescription></Alert>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField control={form.control} name="dimensions.lengthCm" render={({ field }) => (<FormItem><FormLabel>Length (cm)</FormLabel><FormControl><Input type="number" min="0" step="any" placeholder="e.g. 20" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="dimensions.widthCm" render={({ field }) => (<FormItem><FormLabel>Width (cm)</FormLabel><FormControl><Input type="number" min="0" step="any" placeholder="e.g. 15" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="dimensions.heightCm" render={({ field }) => (<FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" min="0" step="any" placeholder="e.g. 10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="dimensions.weightKg" render={({ field }) => (<FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" min="0" step="any" placeholder="e.g. 1.5" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
            </div>
        )}
        <Separator />
        <div className="space-y-6">
            <h3 className="text-lg font-medium font-headline border-b pb-2">Manufacturing & Compliance</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <FormField control={form.control} name="manufacturer" render={({ field }) => (<FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input placeholder="Manufacturer Name" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="countryOfOrigin" render={({ field }) => (<FormItem><FormLabel>Country of Origin</FormLabel><FormControl><Input placeholder="e.g., India" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="packer" render={({ field }) => (<FormItem><FormLabel>Packer (Optional)</FormLabel><FormControl><Input placeholder="Packer Name" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="importer" render={({ field }) => (<FormItem><FormLabel>Importer (Optional)</FormLabel><FormControl><Input placeholder="Importer Name" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                <FormField control={form.control} name="batchNumber" render={({ field }) => (<FormItem><FormLabel>Batch/Lot Number</FormLabel><FormControl><Input placeholder="e.g., A23-456" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <Controller control={form.control} name="mfgDate" render={({ field }) => (<FormItem><FormLabel>Manufacturing Date</FormLabel><DatePicker date={field.value ?? undefined} setDate={field.onChange} /></FormItem>)}/>
                <Controller control={form.control} name="expiryDate" render={({ field }) => (<FormItem><FormLabel>Use Before/Expiry Date</FormLabel><DatePicker date={field.value ?? undefined} setDate={field.onChange} /></FormItem>)}/>
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
                    <FormLabel>Images <span className="text-red-500">*</span></FormLabel>

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
             <FormField control={form.control} name="status" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Status <span className="text-red-500">*</span></FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Draft" /></FormControl><FormLabel className="font-normal">Draft</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Active" /></FormControl><FormLabel className="font-normal">Active</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Archived" /></FormControl><FormLabel className="font-normal">Archived</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)}/>
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit"   onClick={() => console.log('Submit button clicked!')} disabled={form.formState.isSubmitting}><PackagePlus className="mr-2 h-4 w-4"/>Save Product</Button>
        </div>
      </form>
    </Form>
  );
}
