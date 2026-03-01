
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
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const profileFormSchema = z.object({
  // Personal Info
  fullName: z.string().min(1, 'Full name is required.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  
  // Contact Info (locked)
  email: z.string().email(),
  mobile: z.string(),

  // Role Info (locked for patient)
  default_role_id: z.string().min(1, 'Please select a role.'),
  
  // Address & Emergency
  emergencyContact: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pin: z.string().optional(),
  country: z.string().optional(),
  
  // Preferences
  email_opt_in: z.boolean().default(false),
  push_opt_in: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      dob: '1990-01-01',
      gender: 'prefer_not_to_say',
      default_role_id: 'patient',
      email: '',
      mobile: '',
      email_opt_in: true,
      line1: '',
      line2: '',
      city: '',
      state: '',
      pin: '',
      country: '',
    },
  });

  useEffect(() => {
    if (user) {
        form.reset({
            fullName: user.name || '',
            email: user.email || '',
            default_role_id: user.role,
            dob: '1990-01-01',
            gender: 'prefer_not_to_say',
            email_opt_in: true,
            mobile: user.phone || '9876543210', // Mock data
            line1: user.address?.line1,
            city: user.address?.city,
            state: user.address?.state,
            pin: user.address?.pin,
            country: user.address?.country,
        })
    }
  }, [user, form])

  function onSubmit(data: ProfileFormValues) {
    console.log("Saving patient profile data:", data);
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <div className="grid md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormDescription>Changes to DOB require admin approval.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="other" /></FormControl><FormLabel className="font-normal">Other</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             {user?.role === 'admin' && (
                <FormField
                    control={form.control}
                    name="default_role_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Primary Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select your primary role" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="patient">Patient</SelectItem>
                                <SelectItem value="therapist">Therapist</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>

        <Separator />

        {/* Contact Information */}
          <h3 className="text-lg font-medium font-headline -mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email (Locked)</FormLabel><FormControl><Input type="email" {...field} disabled /></FormControl>
                    <FormDescription>To change your email, please go to <Link href="/dashboard/account/security" className="text-primary hover:underline">Security Settings</Link>.</FormDescription>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="mobile" render={({ field }) => (
                    <FormItem><FormLabel>Mobile (Locked)</FormLabel><FormControl><Input type="tel" {...field} disabled /></FormControl>
                     <FormDescription>To change your mobile, please go to <Link href="/dashboard/account/security" className="text-primary hover:underline">Security Settings</Link>.</FormDescription>
                    </FormItem>
                )}/>
                <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                    <FormItem><FormLabel>Emergency Contact</FormLabel><FormControl><Input type="tel" placeholder="Phone number for emergencies" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="line1" render={({ field }) => (<FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input placeholder="Street address" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="line2" render={({ field }) => (<FormItem><FormLabel>Address Line 2</FormLabel><FormControl><Input placeholder="Apartment, suite, etc." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="State" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="pin" render={({ field }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="Pincode" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="Country" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
        
        <Separator />
        
        {/* Notification Preferences */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Notification Preferences</h3>
            <FormField
                control={form.control}
                name="email_opt_in"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>Receive updates and reminders via email.</FormDescription>
                        </div>
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                        </FormControl>
                    </FormItem>
                )}
            />
              <FormField
                control={form.control}
                name="push_opt_in"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Push Notifications</FormLabel>
                            <FormDescription>Receive alerts directly on your device.</FormDescription>
                        </div>
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit">
                <Save className="mr-2 h-4 w-4"/>
                Save Changes
            </Button>
        </div>
      </form>
    </Form>
  );
}
