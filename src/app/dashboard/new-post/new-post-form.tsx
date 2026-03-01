
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
import { Save, Loader2, Upload, Eye, Check, PenSquare, ArrowRightLeft, Shrink, Bold, Italic, List, Undo2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X as XIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIRichText } from '@/components/ai/ai-rich-text';
import { getTherapyCategories } from '@/lib/repos/categories';


const editorFormSchema = z.object({
  // Common fields
  title: z.string().min(5, 'Title must be at least 5 characters.').max(100, 'Title should be 100 characters or less.'),
  slug: z.string().optional(),
  excerpt: z.string().min(20, 'Excerpt must be at least 20 characters.').max(160, 'Excerpt should be 160 characters or less for SEO.'),
  content: z.string().min(100, 'Content must be at least 100 characters.'),
  coverImageUrl: z.any().refine((val) => val, "Featured image is required."),
  categories: z.array(z.string()).min(1, 'Please select at least one category.'),
  status: z.enum(['draft', 'review', 'published', 'archived']),

  // Post specific
  videoUrl: z.string().url({ message: 'Please enter a valid YouTube URL.' }).optional().or(z.literal('')),
  metaDescription: z.string().max(160, 'Meta description should be 160 characters or less.').optional(),
  
  // Training specific
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  durationMin: z.coerce.number().optional(),

  // Documentation specific
  sopVersion: z.string().optional(),
});

type EditorFormValues = z.infer<typeof editorFormSchema>;

type ContentType = 'post' | 'training' | 'documentation';

interface NewPostFormProps {
    contentType: ContentType;
}

export function NewPostForm({ contentType = 'post' }: NewPostFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [allCategories, setAllCategories] = useState<any[]>([]);

  const form = useForm<EditorFormValues>({
    resolver: zodResolver(editorFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImageUrl: null,
      status: 'draft',
      categories: [],
      sopVersion: 'v1.0',
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
        const cats = await getTherapyCategories();
        setAllCategories(cats.map(c => ({ id: c.toLowerCase().replace(/ /g, '-'), name: c })));
    };
    fetchCategories();
  }, []);

  // Watch all form fields to trigger autosave
  const watchedValues = form.watch();

  useEffect(() => {
    // This effect handles the autosave logic
    if (form.formState.isDirty) {
      setAutoSaveStatus('saving');
      const timer = setTimeout(() => {
        // In a real app, you would make an API call to save the draft
        console.log(`Autosaving ${contentType} draft...`, form.getValues());
        setAutoSaveStatus('saved');
        form.reset(form.getValues()); // Resets the 'dirty' state after saving
      }, 1500); // Debounce autosave

      return () => clearTimeout(timer);
    }
  }, [watchedValues, form, contentType]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'Image too large', description: 'Please select an image smaller than 2MB.' });
        return;
      }
      form.setValue('coverImageUrl', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImagePreview(null);
    form.setValue('coverImageUrl', null, { shouldValidate: true });
    const fileInput = document.getElementById('coverImageUrl-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };
  

  function onSubmit(data: EditorFormValues) {
    console.log(data);
    toast({
      title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Saved!`,
      description: `Your ${contentType} has been saved.`,
    });
    form.reset();
    setImagePreview(null);
  }

  // A simple slug generation utility
  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  }

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && value.title) {
        form.setValue('slug', generateSlug(value.title), { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Featured Image</FormLabel>
                    <FormControl>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label htmlFor="coverImageUrl-upload" className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                <Upload className="w-4 h-4" />
                                Upload Image
                            </label>
                            <Input id="coverImageUrl-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            <span className="text-sm text-muted-foreground">or</span>
                            <Input placeholder="Paste image URL" onChange={(e) => form.setValue('coverImageUrl', e.target.value)} />
                        </div>
                        {imagePreview && (
                            <div className="mt-2 relative w-fit">
                                <Image src={imagePreview} alt="Preview" width={200} height={105} className="max-h-40 w-auto rounded-md border" />
                                <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                                    <XIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Recommended size: 1200x630px. Max file size: 2MB.</p>
                    </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Content</FormLabel>
                  <FormControl>
                    <AIRichText
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Write the full content here..."
                      context={{ entityType: contentType, field: 'content' }}
                      disabled={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt (Short Summary)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief summary for previews."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">SEO & Meta Settings</h3>
               <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="auto-generated-from-title" {...field} />
                      </FormControl>
                      <FormDescription>Customize the URL. Use lowercase letters, numbers, and hyphens.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {contentType === 'post' && (
                    <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Meta Description (Optional)</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="A brief description for search engines. If empty, the excerpt will be used."
                            rows={2}
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
             <div className="p-4 border rounded-lg bg-card space-y-6 sticky top-24">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel className='font-semibold'>Status</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="draft" /></FormControl>
                                <FormLabel className="font-normal">Draft</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="review" /></FormControl>
                                <FormLabel className="font-normal">Submit for Review</FormLabel>
                                </FormItem>
                                {role === 'admin' && (
                                <>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="published" /></FormControl>
                                    <FormLabel className="font-normal">Published</FormLabel>
                                </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="archived" /></FormControl>
                                    <FormLabel className="font-normal">Archived</FormLabel>
                                </FormItem>
                                </>
                                )}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                
                <Separator/>

                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Categories</FormLabel>
                      <div className="space-y-2">
                        {allCategories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                             <Checkbox
                                id={category.id}
                                checked={field.value?.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), category.id]
                                    : (field.value || []).filter((id) => id !== category.id);
                                  field.onChange(newValue);
                                }}
                              />
                            <label htmlFor={category.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {contentType === 'post' && (
                    <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>YouTube Video URL (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                 {contentType === 'training' && (
                     <>
                        <FormField
                            control={form.control}
                            name="difficulty"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Difficulty</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="durationMin"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Duration (Minutes)</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g., 15" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}

                 {contentType === 'documentation' && (
                    <FormField
                        control={form.control}
                        name="sopVersion"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>SOP Version</FormLabel>
                            <FormControl><Input placeholder="e.g., v1.1" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                 <div className="flex justify-between items-center text-sm text-muted-foreground">
                   <span>{autoSaveStatus === 'saving' ? 'Saving...' : 'All changes saved'}</span>
                   {autoSaveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>

                <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline"><Eye className='mr-2'/>Preview</Button>
                    <Button type="submit"><Save className="mr-2"/>Save</Button>
                </div>
             </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

    