'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Pencil } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { ProductCategory } from "@/lib/types";
import { listProductCategories, listAllSubCategories, addSubCategory, deleteSubCategory, updateSubCategory } from "@/lib/api/categories";
import { getToken } from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const dynamic = 'force-dynamic';

const subCategorySchema = z.object({
    name: z.string().min(1, "Sub-category name is required."),
    category_id: z.string().min(1, "Please select a parent category."),
});

type SubCategoryFormValues = z.infer<typeof subCategorySchema>;

export default function SubCategoryManager() {
  const { toast } = useToast();
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [catData, subCatData] = await Promise.all([
            listProductCategories(),
            listAllSubCategories()
        ]);
        setProductCategories(catData || []);
        setSubCategories(subCatData || []);
    } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to fetch categories data', variant: 'destructive' });
    }
    setLoading(false);
  };
  
  useEffect(() => {     
    fetchData();
  }, []);

  const form = useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategorySchema),
    defaultValues: {
        name: "",
        category_id: ""
    }
  });

  function onSubmit(data: SubCategoryFormValues) {
    startTransition(async () => {
      try {
          const token = await getToken();
            if (!token) {
                throw new Error('Token missing, please login again');
            }

        await addSubCategory(token, {
            name: data.name,
            category_id: data.category_id,
            status: true
        });

        toast({
          title: "Sub-Category added!",
          description: "Sub-Category has been successfully added to the catalog.",
        });
        
        form.reset();
        await fetchData();

      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to add sub-category.",
          variant: "destructive",
        });
      }
    });
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sub-category?')) return;
    
    try {
        const token = await getToken();
        if (!token) throw new Error('Token missing');
        await deleteSubCategory(id, token);
        toast({
            title: "Success",
            description: "Sub-Category deleted successfully",
        });
        fetchData();
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message || "Failed to delete sub-category",
            variant: "destructive"
        });
    }
  };

  const handleEditClick = (sub: any) => {
    setSelectedSubCategory(sub);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSubCategory) return;

    try {
        const token = await getToken();
        if (!token) throw new Error('Token missing');
        
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const category_id = formData.get('category_id') as string;

        await updateSubCategory(selectedSubCategory.id, {
            name,
            category_id
        }, token);

        toast({
            title: "Success",
            description: "Sub-Category updated successfully",
        });
        setEditOpen(false);
        fetchData();
    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message || "Failed to update sub-category",
            variant: "destructive"
        });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sub-Categories</h2>
          <p className="text-muted-foreground mt-1">
            Manage your product sub-categories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Sub-Category</CardTitle>
              <CardDescription>
                Create a new sub-category for your products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a parent category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productCategories.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-Category Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Cleansers" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Sub-Category
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Sub-Categories</CardTitle>
              <CardDescription>
                View and manage your current sub-categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : subCategories.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
                  No sub-categories found. Create one to get started.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Name</th>
                        <th className="p-3 text-left font-medium">Parent Category</th>
                        <th className="p-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subCategories.map((sub, i) => (
                        <tr key={sub.id} className={i !== subCategories.length - 1 ? "border-b" : ""}>
                          <td className="p-3 font-medium">{sub.name}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {sub.category_name}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                             <Button
                              variant="ghost"
                              size="icon"
                              className="mr-2 h-8 w-8"
                              onClick={() => handleEditClick(sub)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                              onClick={() => handleDelete(sub.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

       <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Category</DialogTitle>
            <DialogDescription>
              Make changes to the sub-category details below.
            </DialogDescription>
          </DialogHeader>
          {selectedSubCategory && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category_id">Parent Category</Label>
                <Select name="category_id" defaultValue={String(selectedSubCategory.category_id)}>
                  <SelectTrigger id="edit-category_id">
                    <SelectValue placeholder="Select a parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  defaultValue={selectedSubCategory.name} 
                  required 
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
