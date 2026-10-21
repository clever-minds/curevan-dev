'use client';

import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { isMinor } from '@/lib/booking-consent';

/** Shown only when the date of birth makes the patient younger than 18. */
export function GuardianFields() {
  const form = useFormContext();
  const dob = form.watch('dob') as string | undefined;
  if (!isMinor(dob)) return null;
  return (
    <div className="space-y-4 rounded-md border border-amber-300 bg-amber-50/60 p-4" data-testid="guardian-fields">
      <p className="text-sm font-medium">The patient is under 18. A parent or guardian must give their details and consent.</p>
      <FormField control={form.control} name="guardianName" render={({ field }) => (
        <FormItem><FormLabel>Parent or guardian's name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="guardianRelation" render={({ field }) => (
        <FormItem><FormLabel>Relation to the patient</FormLabel><FormControl><Input placeholder="e.g. Mother" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="guardianPhone" render={({ field }) => (
        <FormItem><FormLabel>Guardian's mobile number</FormLabel><FormControl><Input inputMode="numeric" maxLength={10} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="guardianConsent" render={({ field }) => (
        <FormItem className="flex items-start gap-2 space-y-0">
          <FormControl><Checkbox checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true)} /></FormControl>
          <div className="space-y-1"><FormLabel className="font-normal">I am the parent or guardian and I consent to this booking and to the care of the patient.</FormLabel><FormMessage /></div>
        </FormItem>
      )} />
    </div>
  );
}
