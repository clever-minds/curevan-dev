
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { resetPassword } from '@/lib/actions/user';
import { useRouter } from 'next/navigation';
import { PasswordStrengthInput } from '@/components/auth/password-strength-input';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid or missing reset token.',
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        token: token,
        newPassword: data.password,
      });

      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been updated. You can now sign in with your new password.',
      });

      router.push('/auth/signin');
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <PasswordStrengthInput />
        
        <Button type="submit" className="w-full" disabled={loading || !form.formState.isValid}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
          Reset Password
        </Button>
      </form>
    </Form>
  );
}
