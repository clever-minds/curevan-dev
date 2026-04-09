

'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import type { ProductCategory } from "@/lib/types";
import { listProductCategories } from "@/lib/api/categories";
import { addProductCategory } from "@/lib/api/categories";
import { deleteProductCategory } from "@/lib/api/categories";
import { getToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { updateCategory } from "@/lib/api/categories";


import MediaPicker from "@/components/MediaPicker";
import type { MediaItem } from "@/types/media";

const categorySchema = z.object({
    name: z.string().min(1, "Category name is required."),
    description: z.string().min(1, "Description is required.").max(180, "Description must be 180 characters or less."),
    image: z.array(z.object({
        id: z.number(),
        url: z.string(),
    })).min(1, "Please select an image."),
});





type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoryManager() {
  const { toast } = useToast();
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  console.log(productCategories);
  const fetchCategories = async () => {
    setLoading(true);
    const data = await listProductCategories();
    setProductCategories(data);
    console.log("data log......",data);
    console.log('categories data log:', productCategories, Array.isArray(productCategories));

    setLoading(false);
  };
  
  useEffect(() => {     
    fetchCategories();
  }, []);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
        name: "",
        description: "",
        image: []
    }
  });

  function onSubmit(data: CategoryFormValues) {
    startTransition(async () => {
      try {
          const token =await getToken();
            console.log("CategoryFormValues.......",data);
            if (!token) {
                throw new Error('Token missing, please login again');
            }

        await addProductCategory(token, {
            name: data.name,
            description: data.description,
            image_id: data.image[0].id,
            status: true
            });

        toast({
          title: "Category Created!",
          description: `The category "${data.name}" has been added.`,
        });
        form.reset(); // Clear the form
        fetchCategories(); // Re-fetch the categories to update the list
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to create category. Please try again.",
        });
      }
    });
  }
  const handleDeleteCategory = async (category: ProductCategory) => {
  if (!confirm(`Delete "${category.name}" ?`)) return;

  try {
    const token = await getToken();
    if (!token) throw new Error('Token missing');

    await deleteProductCategory(category.id, token);

    setProductCategories(prev =>
      prev.filter(c => c.id !== category.id)
    );

    toast({
      title: 'Category deleted',
      description: `"${category.name}" removed successfully`,
    });
  } catch (error: any) {
    toast({
      variant: 'destructive',
      title: 'Delete failed',
      description: error.message,
    });
  }
};
const editForm = useForm<CategoryFormValues>({
  resolver: zodResolver(categorySchema),
  defaultValues: {
    name: "",
    description: "",
    image: [],
  },
});
const handleEditCategory = (category: ProductCategory) => {
  setSelectedCategory(category);
  editForm.reset({
    name: category.name,
    description: category.description,
    image: category.image ? [{ id: category.image_id ?? -1, url: category.image }] : [],
  });
  setEditOpen(true);
};


const onEditSubmit = (data: CategoryFormValues) => {
  startTransition(async () => {
    try {
      const token = await getToken();
      if (!token || !selectedCategory) {
        throw new Error("Token or category missing");
      }

      await updateCategory(
        selectedCategory.id,
        {
          name: data.name,
          description: data.description,
          image_id: data.image[0].id,
          is_active: true,
        },
        token
      );

      toast({
        title: "Category Updated",
        description: `"${data.name}" updated successfully`,
      });

      setEditOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Something went wrong",
      });
    }
  });
};

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Product Categories</CardTitle>
                    <CardDescription>Manage the categories for your products.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading categories...</p>
                    ) : (
                        <div className="space-y-4">
                            {productCategories.map(category => (
                                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        {category.image && (
                                        <Image
                                            src={category.image.startsWith("http") ? category.image : `${process.env.NEXT_PUBLIC_API_URL}${category.image}`}
                                            alt={category.name}
                                            width={40}
                                            height={40}
                                            className="rounded-md object-cover"
                                        />
                                        )}
                                        <div>
                                            <h4 className="font-semibold">{category.name}</h4>
                                            <p className="text-sm text-muted-foreground">{category.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditCategory(category)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCategory(category)}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Add New Category</CardTitle>
                    <CardDescription>Create a new category for products.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                           <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Rehabilitation" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="flex justify-between items-center">
                                        <span>Description</span>
                                        <span className={`text-[10px] ${field.value?.length > 180 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                            {field.value?.length || 0}/180
                                        </span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="A short description..." 
                                            {...field} 
                                            maxLength={180}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Category Image</FormLabel>
                                    <FormControl>
                                      <MediaPicker
                                        value={field.value as MediaItem[]}
                                        onChange={(media: MediaItem[]) => field.onChange(media)}
                                        multiple={false}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 animate-spin" />}
                                Add Category
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Category</DialogTitle>
      <DialogDescription>
        Update product category details
      </DialogDescription>
    </DialogHeader>

    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
        <FormField
          control={editForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-between items-center">
                <span>Description</span>
                <span className={`text-[10px] ${field.value?.length > 180 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {field.value?.length || 0}/180
                </span>
              </FormLabel>
              <FormControl>
                <Textarea 
                    {...field} 
                    maxLength={180}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Image</FormLabel>
              <FormControl>
                <MediaPicker
                  value={field.value as MediaItem[]}
                  onChange={(media: MediaItem[]) => field.onChange(media)}
                  multiple={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 animate-spin" />}
            Update Category
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>

    </div>
  );
}
