
'use client';

import React, { useEffect, useTransition } from 'react';
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
import { Send, Star, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { DialogClose } from './ui/dialog';
import { createSupportTicket } from '@/lib/actions'; // Import the server action

const supportFeedbackSchema = z.object({
  formType: z.enum(['support', 'feedback']),
  
  // Support fields
  supportTopic: z.string().optional(),
  supportItemId: z.string().optional(),
  supportSubject: z.string().optional(),
  supportDescription: z.string().optional(),
  supportAttachment: z.any().optional(),

  // Feedback fields
  feedbackTopic: z.string().optional(),
  feedbackItemId: z.string().optional(),
  feedbackRating: z.coerce.number().optional(),
  feedbackComments: z.string().optional(),
  feedbackVisibility: z.boolean().optional(),
}).refine(data => {
    if (data.formType === 'support') {
        return !!data.supportTopic && !!data.supportSubject && !!data.supportDescription;
    }
    return true;
}, {
    message: "Topic, Subject, and Description are required for support tickets.",
    path: ["supportDescription"],
}).refine(data => {
    if (data.formType === 'feedback') {
        return !!data.feedbackTopic && !!data.feedbackItemId && (data.feedbackRating !== undefined && data.feedbackRating > 0);
    }
    return true;
}, {
    message: "A rating is required for feedback.",
    path: ["feedbackRating"],
});

type SupportFeedbackFormValues = z.infer<typeof supportFeedbackSchema>;

interface SupportFeedbackFormProps {
    formType?: 'support' | 'feedback';
    feedbackTopic?: 'appointment' | 'product' | 'therapist' | 'clinic';
    feedbackItemId?: string;
    onFormSubmit?: () => void;
}

export function SupportFeedbackForm({ 
    formType: initialFormType = 'support',
    feedbackTopic: initialFeedbackTopic,
    feedbackItemId: initialFeedbackItemId,
    onFormSubmit,
}: SupportFeedbackFormProps) {
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = React.useState(0);
  const [isPending, startTransition] = useTransition();
  
  const form = useForm<SupportFeedbackFormValues>({
    resolver: zodResolver(supportFeedbackSchema),
    defaultValues: {
      formType: initialFormType,
      feedbackTopic: initialFeedbackTopic,
      feedbackItemId: initialFeedbackItemId,
      feedbackVisibility: true,
      feedbackRating: 0,
      supportAttachment: null,
    },
  });

  const formType = form.watch('formType');
  const rating = form.watch('feedbackRating');
  
   useEffect(() => {
    form.reset({
      formType: initialFormType,
      feedbackTopic: initialFeedbackTopic,
      feedbackItemId: initialFeedbackItemId,
      feedbackVisibility: true,
      feedbackRating: 0,
      supportAttachment: null,
    });
  }, [initialFormType, initialFeedbackTopic, initialFeedbackItemId, form]);


  function onSubmit(data: SupportFeedbackFormValues) {
    startTransition(async () => {
      if (data.formType === 'support') {
        const result = await createSupportTicket({
          name: 'Anonymous User', // Or get from auth context if available
          email: 'anonymous@example.com', // Or get from auth context
          subject: data.supportSubject!,
          message: data.supportDescription!,
          topic: data.supportTopic!,
        });

        if (result.success) {
            toast({
              title: 'Support Ticket Created!',
              description: "We've received your ticket and will get back to you shortly.",
            });
        } else {
             toast({
              variant: 'destructive',
              title: 'Submission Failed',
              description: result.error || "An unexpected error occurred.",
            });
        }
      } else {
        // Handle feedback form submission
        console.log("Feedback submitted:", data);
        toast({
          title: 'Feedback Submitted!',
          description: "Thank you for your valuable feedback!",
        });
      }

      if (onFormSubmit) {
          onFormSubmit();
      }
      form.reset(); // Reset form on successful submission
    });
  }

  const SubmitButton = (
    <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
        Submit
    </Button>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {initialFormType === 'support' && (
             <FormField
                control={form.control}
                name="formType"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>What would you like to do?</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                            >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="support" /></FormControl>
                                <FormLabel className="font-normal">Raise a Support Ticket</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="feedback" /></FormControl>
                                <FormLabel className="font-normal">Submit Feedback</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )}
       
        
        {formType === 'support' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="supportTopic"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>What is your issue about?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select a topic" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="booking">Booking</SelectItem>
                                    <SelectItem value="payment">Payment</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                    <SelectItem value="order">Order</SelectItem>
                                    <SelectItem value="general">General Inquiry</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="supportItemId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Related Item ID (Optional)</FormLabel>
                            <FormControl><Input placeholder="e.g., Appointment or Order ID" {...field} /></FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="supportSubject"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                            <Input placeholder="A brief summary of your issue" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="supportDescription"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Describe your issue</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Please provide a detailed explanation of the problem you're experiencing."
                            rows={5}
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="supportAttachment"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Attach a file (Optional)</FormLabel>
                        <FormControl>
                            <Input type="file" {...field} />
                        </FormControl>
                        <FormDescription>
                            Upload a screenshot or relevant document.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

        {formType === 'feedback' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                 <FormField
                    control={form.control}
                    name="feedbackRating"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Rating</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                "w-8 h-8 cursor-pointer",
                                                (hoverRating >= star || (rating || 0) >= star)
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-muted-foreground"
                                            )}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => field.onChange(star)}
                                        />
                                    ))}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="feedbackComments"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Your Comments (Optional)</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Share your detailed feedback..."
                            rows={5}
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="feedbackVisibility"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Make my review public?</FormLabel>
                                <FormDescription>Your name will appear as "Verified Patient".</FormDescription>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />
            </div>
        )}
        
        {initialFormType === 'feedback' ? (
            <DialogClose asChild>{SubmitButton}</DialogClose>
        ) : (
            SubmitButton
        )}
      </form>
    </Form>
  );
}
