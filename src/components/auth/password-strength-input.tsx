
'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

const ValidationChecklistItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <li className={cn("flex items-center gap-2 text-sm", isValid ? "text-green-600" : "text-muted-foreground")}>
        {isValid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        <span>{text}</span>
    </li>
);

interface PasswordStrengthInputProps {
    passwordFieldName?: string;
    confirmPasswordFieldName?: string;
}

export function PasswordStrengthInput({ 
    passwordFieldName = 'password',
    confirmPasswordFieldName = 'confirmPassword'
}: PasswordStrengthInputProps) {
  const { control, watch } = useFormContext();
  const newPassword = watch(passwordFieldName);
  const confirmPassword = watch(confirmPasswordFieldName);

  const [validationState, setValidationState] = useState({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
      passwordsMatch: false,
  });

  useEffect(() => {
    setValidationState({
        minLength: newPassword?.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecialChar: /[^A-Za-z0-9]/.test(newPassword),
        passwordsMatch: newPassword && newPassword === confirmPassword,
    });
  }, [newPassword, confirmPassword]);

  return (
    <div className="space-y-6">
        <FormField
            control={control}
            name={passwordFieldName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <ValidationChecklistItem isValid={validationState.minLength} text="At least 8 characters" />
            <ValidationChecklistItem isValid={validationState.hasLowercase} text="One lowercase letter" />
            <ValidationChecklistItem isValid={validationState.hasUppercase} text="One uppercase letter" />
            <ValidationChecklistItem isValid={validationState.hasNumber} text="One number" />
            <ValidationChecklistItem isValid={validationState.hasSpecialChar} text="One special character" />
        </ul>

         <FormField
            control={control}
            name={confirmPasswordFieldName}
            render={({ field }) => (
                <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
    </div>
  );
}
