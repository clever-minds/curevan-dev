
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { sendPasswordResetEmail } from '@/lib/actions/user';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {

    try {
      console.log("send email data", data);
      await sendPasswordResetEmail(data.email);
      setSubmitted(true);
      toast({
        title: 'Reset Link Sent',
        description: 'If an account exists for this email, a password reset link has been sent.',
      });
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      // We still show a generic success message to avoid user enumeration attacks
      setSubmitted(true);
      toast({
        title: 'Request Received',
        description: 'If an account exists for this email, you will receive a reset link shortly.',
      });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-md">
        <p>Please check your inbox for the password reset link. It might take a few minutes to arrive.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Send Reset Link
        </Button>
      </form>
    </Form>
  );
}
