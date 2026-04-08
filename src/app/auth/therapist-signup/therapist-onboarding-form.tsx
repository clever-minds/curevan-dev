'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { UserPlus, Save, AlertCircle, AlertTriangle, Loader2, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Therapist } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Price } from '@/components/money/price';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { getIndianStates } from '@/lib/repos/meta';
import { listTherapists } from '@/lib/repos/therapists';
import { createTherapistAction, requestProfileUpdate } from '@/lib/actions/therapist';
import { useRouter } from 'next/navigation';
import { getTherapistProfileById } from '@/lib/repos/therapistProfiles';
import Image from 'next/image';
import { PasswordStrengthInput } from '@/components/auth/password-strength-input';
import { getTherapyCategories } from '@/lib/repos/categories';
import { MultiSelect } from '@/components/ui/multi-select';
import GooglePlacesInput from '@/components/GooglePlaceInput';
import MediaPicker from '@/components/MediaPicker';

export const dynamic = 'force-dynamic';

const availabilitySchema = z.object({
  enabled: z.boolean(),
  morning: z.object({ start: z.string(), end: z.string() }),
  evening: z.object({ start: z.string(), end: z.string() }),
});

const panRegex = new RegExp(/^([A-Z]){5}([0-9]){4}([A-Z]){1}$/);

export const therapistOnboardingSchema = z.object({
  // Account
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character.')
    .optional(),
  confirmPassword: z.string().optional(),

  // Public Profile
  fullName: z.string().min(1, 'Full name is required.'),
  bio: z.string().optional(),
  image: z.any().optional(),
  lat: z.coerce.number().min(1, "Latitude is required"),
  lng: z.coerce.number().min(1, "Longitude is required"),
  fullAddress: z.string().min(1, 'Full Address is required.'),
  serviceRadiusKm: z.coerce.number().min(1, 'Service radius is required.'),
  line1: z.string().min(1, 'Address is required.'),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required").refine((val) => /^[a-zA-Z\s]*$/.test(val), {
    message: "City should only contain letters and spaces",
  }),
  state: z.string().min(1, "State is required").refine((val) => /^[a-zA-Z\s]*$/.test(val), {
    message: "State should only contain letters and spaces",
  }),
  pin: z.string().min(1, 'Pincode is required.').refine((val) => /^\d*$/.test(val), {
    message: "Pincode should only contain numbers",
  }),

  // Professional Details
  mobile: z.string().length(10, 'A valid 10-digit mobile number is required.').refine((val) => /^\d*$/.test(val), {
    message: "Mobile number should only contain numbers",
  }),
  qualification: z.string().min(1, 'Qualifications are required.'),
  registrationNo: z.string().min(1, 'Registration number is required.'),
  specialty: z.array(z.string())
    .min(1, "Select at least one specialty"),
  kycIdProof: z.any().optional(),
  kycLicense: z.any().optional(),
  profileImageId: z.any().optional(),

  // Availability & Pricing
  experience_years: z.coerce.number().min(0, 'Experience must be a positive number.'),
  hourlyRate: z.coerce.number().min(1, "Rate is required"),
  membershipPlan: z.enum(['standard', 'premium']),
  availability: z.object({
    mon: availabilitySchema, tue: availabilitySchema, wed: availabilitySchema,
    thu: availabilitySchema, fri: availabilitySchema, sat: availabilitySchema,
    sun: availabilitySchema,
  }),

  // Bank & Payouts
  panNumber: z.string().regex(panRegex, 'Enter a valid PAN (e.g., ABCDE1234F).'),
  bankAccountNumber: z.string().min(1, 'Bank account number is required.'),
  bankIfscCode: z.string().min(1, 'IFSC code is required.'),
  kycBankProof: z.any().optional(),
}).refine(data => {
  // Make password required only for new signups
  if (!data.email) { // A way to check if it's a new signup
    return !!data.password && data.password === data.confirmPassword;
  }
  // For edits, if a new password is provided, it must match confirmation
  if (data.password) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match or are required.",
  path: ['confirmPassword'],
});


type TherapistOnboardingValues = z.infer<typeof therapistOnboardingSchema>;

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const fieldPolicies = {
  fullName: { policy: "needsApproval", label: "Full Name" },
  bio: { policy: "instant", label: "Bio" },
  image: { policy: "needsApproval", label: "Profile Picture" },
  serviceRadiusKm: { policy: "instant", label: "Service Radius (km)" },
  line1: { policy: "instant", label: "Address Line 1" },
  city: { policy: "instant", label: "City" },
  state: { policy: "instant", label: "State" },
  pin: { policy: "instant", label: "Pincode" },
  email: { policy: "locked", label: "Email Address" },
  mobile: { policy: "locked", label: "Mobile Number" },
  qualification: { policy: "needsApproval", label: "Qualification(s)" },
  registrationNo: { policy: "needsApproval", label: "Registration Number" },
  kycIdProof: { policy: "needsApproval", label: "ID Proof" },
  kycLicense: { policy: "needsApproval", label: "License Document" },
  experience_years: { policy: "needsApproval", label: "Years of Experience" },
  hourlyRate: { policy: "instant", label: "Hourly Rate" },
  membershipPlan: { policy: "instant", label: "Membership Plan" },
  availability: { policy: "instant", label: "Availability" },
  panNumber: { policy: "needsApproval", label: "PAN Number" },
  bankAccountNumber: { policy: "needsApproval", label: "Bank Account Number" },
  bankIfscCode: { policy: "needsApproval", label: "Bank IFSC Code" },
  kycBankProof: { policy: "needsApproval", label: "Bank Proof" },
  profileImageId: { policy: "needsApproval", label: "Profile Picture" },
  specialty: { policy: "needsApproval", label: "Specialty" },
  fullAddress: { policy: "instant", label: "Full Address" }
};

const PolicyBadge = ({ policy }: { policy: 'instant' | 'needsApproval' | 'locked' }) => {
  const policyMap = {
    instant: { text: "Editable", className: "bg-green-100 text-green-800", tooltip: "Changes are saved instantly." },
    needsApproval: { text: "Needs Approval", className: "bg-yellow-100 text-yellow-800", tooltip: "Changes require admin review." },
    locked: { text: "Locked", className: "bg-gray-100 text-gray-800", tooltip: "This field cannot be changed here." },
  };
  const { text, className, tooltip } = policyMap[policy];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={className}>{text}</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
};

const FormFieldWrapper = ({ fieldName, children, noBadge }: { fieldName: keyof typeof fieldPolicies, children: React.ReactNode, noBadge?: boolean }) => {
  const policy = fieldPolicies[fieldName]?.policy || 'locked';
  return (
    <div className="relative">
      {children}
      {!noBadge && (
        <div className="absolute top-0 right-0">
          <PolicyBadge policy={policy as 'instant' | 'needsApproval' | 'locked'} />
        </div>
      )}
    </div>
  );
};

const recommendPrice = (years: number): number => {
  if (years <= 5) return 500;
  if (years <= 10) return 500 + 100 * (years - 5);
  return 1000 + 50 * (years - 10);
}

const generateTimeSlots = (startHour: number, endHour: number) => {
  const slots = [];
  for (let i = startHour; i <= endHour; i++) {
    const hour = i.toString().padStart(2, '0');
    slots.push(`${hour}:00`);
  }
  return slots;
};

const morningSlots = generateTimeSlots(6, 13);
const eveningSlots = generateTimeSlots(13, 21);
const allSlots = generateTimeSlots(6, 21);

const TimeSlotSelect = ({ field, slots, disabled }: { field: any, slots: string[], disabled: boolean }) => (
  <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
    <SelectContent>{slots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}</SelectContent>
  </Select>
);


export function TherapistOnboardingForm({ isEditing = false }: { isEditing?: boolean }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [indianStates, setIndianStates] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const form = useForm<TherapistOnboardingValues>({
    resolver: zodResolver(therapistOnboardingSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      mobile: '',
      fullName: '',
      bio: '',
      image: null,
      serviceRadiusKm: 5,
      line1: '',
      city: '',
      state: '',
      pin: '',
      fullAddress: '',
      lat: 0,
      lng: 0,
      qualification: '',
      registrationNo: '',
      kycIdProof: null,
      kycLicense: null,
      profileImageId: null,
      kycBankProof: null,
      experience_years: 0,
      hourlyRate: 500,
      membershipPlan: 'standard',
      availability: {
        mon: { enabled: true, morning: { start: '09:00', end: '12:00' }, evening: { start: '15:00', end: '18:00' } },
        tue: { enabled: true, morning: { start: '09:00', end: '12:00' }, evening: { start: '15:00', end: '18:00' } },
        wed: { enabled: true, morning: { start: '09:00', end: '12:00' }, evening: { start: '15:00', end: '18:00' } },
        thu: { enabled: true, morning: { start: '09:00', end: '12:00' }, evening: { start: '15:00', end: '18:00' } },
        fri: { enabled: true, morning: { start: '09:00', end: '12:00' }, evening: { start: '15:00', end: '18:00' } },
        sat: { enabled: false, morning: { start: '09:00', end: '12:00' }, evening: { start: '15:00', end: '18:00' } },
        sun: { enabled: false, morning: { start: '09:00', end: '12:00' }, evening: { start: '15:00', end: '18:00' } },
      },
      panNumber: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      specialty: [],
    },
  });
  const [meta, setMeta] = useState({
    therapyCategories: [],
  });
  useEffect(() => {
    const fetchStates = async () => {
      const states = await getIndianStates();
      setIndianStates(states);
    };
    fetchStates();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      const [therapyCats] = await Promise.all([
        getTherapyCategories(),
      ]);
      setMeta({ therapyCategories: therapyCats } as any);
    };
    fetchData();
  }, []);
  useEffect(() => {
    const loadInitialData = async () => {
      if (user && isEditing && !dataLoaded) {
        console.log('Loading therapist profile for user:', user.id);
        const therapist = await getTherapistProfileById(user.id);
        console.log('Checking if we need to load therapist profile for user:', therapist);
        console.log("Checking therapist", therapist?.availability);
        if (therapist) {
          form.reset({
            email: user.email || '',
            mobile: user.phone || 'N/A',
            fullName: therapist.name,
            bio: therapist.bio,
            serviceRadiusKm: 5, // Default or therapist.serviceRadiusKm
            line1: therapist?.line1 || '',
            line2: therapist?.line2 || '',
            lat: therapist?.lat || 0,
            lng: therapist?.lng || 0,
            city: therapist?.city || '',
            fullAddress: therapist?.fullAddress || '',
            state: therapist?.state || '',
            pin: therapist?.pin || '',
            qualification: therapist.qualifications ? therapist.qualifications : '',
            registrationNo: therapist.registrationNo || '',
            experience_years: therapist.experience_years || 0,
            hourlyRate: therapist.hourlyRate || 500,
            membershipPlan: therapist.membershipPlan || 'standard',
            availability: (() => {
              const raw = therapist.availability?.windows || therapist.availability;
              if (!raw || typeof raw !== 'object') return form.getValues('availability');
              
              const normalized: any = {};
              ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(day => {
                const dayData = raw[day];
                if (dayData) {
                  // If enabled is inside morning/evening, derive day level enabled from them
                  const isMorningEnabled = dayData.morning?.enabled ?? false;
                  const isEveningEnabled = dayData.evening?.enabled ?? false;
                  
                  normalized[day] = {
                    enabled: dayData.enabled ?? (isMorningEnabled || isEveningEnabled),
                    morning: {
                      start: (dayData.morning?.start || '09:00').substring(0, 5),
                      end: (dayData.morning?.end || '12:00').substring(0, 5)
                    },
                    evening: {
                      start: (dayData.evening?.start || '15:00').substring(0, 5),
                      end: (dayData.evening?.end || '18:00').substring(0, 5)
                    }
                  };
                }
              });
              return Object.keys(normalized).length > 0 ? normalized : form.getValues('availability');
            })(),
            panNumber: therapist.tax?.pan || '',
            bankAccountNumber: therapist.bankAccountNo || '',
            bankIfscCode: therapist.bankIfscCode || '',
            specialty: Array.isArray(therapist.specialty)
              ? therapist.specialty
              : therapist.specialty
                ? [therapist.specialty]
                : [],
          });
          if (therapist.image) {
            setImagePreview(therapist.image);
          }
        }
        setDataLoaded(true);
      } else if (!isEditing) {
        setDataLoaded(true);
      }
    };
    loadInitialData();
  }, [user, isEditing, dataLoaded, form]);

  const experience_years = form.watch('experience_years');
  const recommendedRate = useMemo(() => recommendPrice(experience_years), [experience_years]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'Image too large', description: 'Please select an image smaller than 2MB.' });
        return;
      }
      form.setValue('image', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: TherapistOnboardingValues) {
    startTransition(async () => {
      try {
        // Extract IDs from objects FIRST
        const profileImageID = data.profileImageId?.id;
        const kycIdProofId = data.kycIdProof?.id;
        const kycLicenseId = data.kycLicense?.id;
        const kycBankProofId = data.kycBankProof?.id;


        // Build clean payload with only IDs (no object versions)
        const payload = {
          ...data,
          profileImageId: profileImageID,
          kycIdProof: kycIdProofId,
          kycLicense: kycLicenseId,
          kycBankProof: kycBankProofId,
        };

        console.log('=== FINAL PAYLOAD ===');
        console.log(JSON.stringify(payload, null, 2));
        console.log('profileImageId:', payload.profileImageId);
        console.log('kycIdProof:', payload.kycIdProof);
        console.log('kycLicense:', payload.kycLicense);
        console.log('kycBankProof:', payload.kycBankProof);
        console.log('=== END ===');

        let result;

        if (isEditing) {
          result = await requestProfileUpdate(payload);
        } else {
          result = await createTherapistAction(payload);
          // If signup successful, also submit a change request for approval
          if (result.success && result.uid) {
            await requestProfileUpdate(payload, result.uid);
          }
        }

        if (result.success) {
          toast({
            title: isEditing
              ? 'Update Request Submitted!'
              : 'Registration Successful!',
            description: isEditing
              ? 'Your changes have been submitted for admin review.'
              : 'Your profile has been submitted for verification. Please sign in.',
          });

          if (!isEditing) {
            router.push('/auth/signin');
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Failed',
            description: result.error || 'Something went wrong',
          });
        }
      } catch (error) {
        console.error('Submission error:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message || 'An unexpected error occurred',
        });
      }
    });
  }

  if (!dataLoaded) {
    return <div>Loading...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="account">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="public-profile">Public Profile</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="availability">Availability & Pricing</TabsTrigger>
            <TabsTrigger value="payouts">Bank & Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card><CardHeader><CardTitle>Account Credentials</CardTitle><CardDescription>This will be used to log in to the platform.</CardDescription></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField name="email" control={form.control} render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} disabled={isEditing} /></FormControl><FormMessage /></FormItem>)} />
                {!isEditing && <PasswordStrengthInput />}
              </CardContent></Card>
          </TabsContent>

          <TabsContent value="public-profile" className="space-y-6">
            <Card><CardHeader><CardTitle>Public Profile</CardTitle><CardDescription>This information is visible to patients.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <FormFieldWrapper fieldName="fullName"><FormField name="fullName" control={form.control} render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <div className="space-y-4">
                  <FormFieldWrapper fieldName="profileImageId">
                    <FormField
                      name="profileImageId"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Document</FormLabel>
                          <FormControl>
                            <MediaPicker
                              value={field.value ? [field.value] : []}
                              onChange={(media) => field.onChange(media[0] || null)}
                              multiple={false}
                            />
                          </FormControl>
                          <FormDescription>Professional license</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FormFieldWrapper>
                </div>
                <FormFieldWrapper fieldName="bio"><FormField name="bio" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="A short, professional biography for your public profile." rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <FormFieldWrapper fieldName="serviceRadiusKm"><FormField name="serviceRadiusKm" control={form.control} render={({ field }) => (<FormItem><FormLabel>Service Radius (km)</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <h4 className="font-medium pt-2">Primary Location</h4>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <FormFieldWrapper fieldName="fullAddress">
                      <FormItem>
                        <FormLabel>Search Address</FormLabel>
                        <GooglePlacesInput value={form.watch('fullAddress') || ''}
                          onAddressSelect={({ line1, line2, city, state, pin, lat, lng, fullAddress }) => {
                            form.setValue('line1', line1);
                            form.setValue('line2', line2);
                            form.setValue('city', city);
                            form.setValue('state', state);
                            form.setValue('pin', pin);
                            form.setValue('lat', lat);
                            form.setValue('lng', lng);
                            form.setValue('fullAddress', fullAddress);
                          }}
                        />
                      </FormItem>

                    </FormFieldWrapper>
                    <FormField name="line1" control={form.control} render={({ field }) => (<FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input placeholder="Landmark or neighborhood" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="line2" control={form.control} render={({ field }) => (<FormItem><FormLabel>Address Line 2</FormLabel><FormControl><Input placeholder="Landmark or neighborhood" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <FormField
                      name="lat"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly
                              tabIndex={-1}
                              className="bg-gray-50 border-dashed cursor-not-allowed focus-visible:ring-0"
                              placeholder="Automatic"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="lng"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly
                              tabIndex={-1}
                              className="bg-gray-50 border-dashed cursor-not-allowed focus-visible:ring-0"
                              placeholder="Automatic"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <FormFieldWrapper fieldName="city"><FormField name="city" control={form.control} render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Your city" {...field} onChange={(e) => {
                      const val = e.target.value;
                      if (!val || /^[a-zA-Z\s]*$/.test(val)) {
                          field.onChange(val);
                      }
                    }} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                    <FormFieldWrapper fieldName="state"><FormField name="state" control={form.control} render={({ field }) => (<FormItem><FormLabel>State</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your state" /></SelectTrigger></FormControl><SelectContent>{indianStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} /></FormFieldWrapper>
                    <FormFieldWrapper fieldName="pin"><FormField name="pin" control={form.control} render={({ field }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="Your pincode" {...field} onChange={(e) => {
                      const val = e.target.value;
                      if (!val || /^\d*$/.test(val)) {
                          field.onChange(val);
                      }
                    }} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                  </div>
                </div>
              </CardContent></Card>
          </TabsContent>

          <TabsContent value="professional" className="space-y-6">
            <Card><CardHeader><CardTitle>Professional Details</CardTitle><CardDescription>Information for verification and records.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <FormFieldWrapper fieldName="mobile"><FormField name="mobile" control={form.control} render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input type="tel" placeholder="Your mobile number" {...field} onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 10 && (!val || /^\d*$/.test(val))) {
                      field.onChange(val);
                  }
                }} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <FormFieldWrapper fieldName="qualification"><FormField name="qualification" control={form.control} render={({ field }) => (<FormItem><FormLabel>Qualification(s)</FormLabel><FormControl><Textarea placeholder="Your degrees and certifications" {...field} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <FormFieldWrapper fieldName="specialty">
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={meta.therapyCategories.map(c => ({ label: c, value: c }))}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder="Select Specialties"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper fieldName="registrationNo"><FormField name="registrationNo" control={form.control} render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input placeholder="Your medical board registration #" {...field} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
                  <FormFieldWrapper fieldName="kycIdProof">
                    <FormField
                      name="kycIdProof"
                      control={form.control}
                      render={({ field: { onChange, value, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>ID Proof Document</FormLabel>
                          <FormControl>
                            <MediaPicker
                              value={value ? [value] : []}
                              onChange={(media) => onChange(media[0] || null)}
                              multiple={false}
                              {...fieldProps}
                            />
                          </FormControl>
                          <FormDescription>Aadhar, PAN Card, etc.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper fieldName="kycLicense">
                    <FormField
                      name="kycLicense"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Document</FormLabel>
                          <FormControl>
                            <MediaPicker
                              value={field.value ? [field.value] : []}
                              onChange={(media) => field.onChange(media[0] || null)}
                              multiple={false}
                            />
                          </FormControl>
                          <FormDescription>Professional license</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FormFieldWrapper>
                </div>

              </CardContent></Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card><CardHeader><CardTitle>Pricing</CardTitle><CardDescription>Set your rates for services.</CardDescription></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormFieldWrapper fieldName="experience_years"><FormField name="experience_years" control={form.control} render={({ field }) => (<FormItem><FormLabel>Years of Experience</FormLabel><FormControl><Input type="number" placeholder="5" {...field} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <FormFieldWrapper fieldName="hourlyRate">
                  <FormField name="hourlyRate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Your Hourly Rate (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="p-2 text-xs bg-muted rounded-md mt-2">Recommended: <Price amount={recommendedRate} /> <Button type="button" variant="link" size="sm" className="p-0 h-auto ml-2" onClick={() => form.setValue('hourlyRate', recommendedRate)}>Apply</Button></div>
                </FormFieldWrapper>
              </CardContent></Card>

            <Card><CardHeader><CardTitle>Membership Plan</CardTitle><CardDescription>Choose a plan that fits your needs.</CardDescription></CardHeader>
              <CardContent>
                <FormField control={form.control} name="membershipPlan" render={({ field }) => (
                  <FormItem><FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid md:grid-cols-2 gap-4">
                      <FormItem><Label htmlFor="plan-standard" className="block w-full p-4 border rounded-lg cursor-pointer has-[:checked]:bg-primary/5 has-[:checked]:border-primary"><div className="flex items-center justify-between"><span className="font-bold">Standard</span><RadioGroupItem value="standard" id="plan-standard" /></div><p className="text-sm text-muted-foreground mt-1">0% platform fee. Basic profile and visibility.</p></Label></FormItem>
                      <FormItem><Label htmlFor="plan-premium" className="block w-full p-4 border rounded-lg cursor-pointer has-[:checked]:bg-primary/5 has-[:checked]:border-primary"><div className="flex items-center justify-between"><span className="font-bold">Premium</span><RadioGroupItem value="premium" id="plan-premium" /></div><p className="text-sm text-muted-foreground mt-1">10% platform fee on services. Higher visibility, advanced tools, and dedicated support.</p></Label></FormItem>
                    </RadioGroup>
                  </FormControl><FormMessage /></FormItem>
                )} />
              </CardContent></Card>

            <Card><CardHeader><CardTitle>Weekly Availability</CardTitle><CardDescription>Set your standard working hours. Patients can book slots within these windows.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Heads up!</AlertTitle><AlertDescription>Changes to availability do not affect existing bookings.</AlertDescription></Alert>
                {days.map((day) => (
                  <div key={day} className="p-4 border rounded-lg grid md:grid-cols-3 gap-4 items-start">
                    <Controller name={`availability.${day}.enabled` as any} control={form.control} render={({ field }) => (
                      <FormItem className="flex items-center gap-4"><Switch id={`switch-${day}`} checked={field.value} onCheckedChange={field.onChange} /><Label htmlFor={`switch-${day}`} className="capitalize text-lg font-bold">{day}</Label></FormItem>
                    )} />
                    <div className="space-y-1"><Label>Morning (06:00 - 13:00)</Label><div className="flex gap-2"><FormField name={`availability.${day}.morning.start` as any} control={form.control} render={({ field }) => (<FormItem><TimeSlotSelect field={field} slots={morningSlots} disabled={!form.watch(`availability.${day}.enabled` as any)} /></FormItem>)} /> <FormField name={`availability.${day}.morning.end` as any} control={form.control} render={({ field }) => (<FormItem><TimeSlotSelect field={field} slots={morningSlots} disabled={!form.watch(`availability.${day}.enabled` as any)} /></FormItem>)} /></div></div>
                    <div className="space-y-1"><Label>Evening (13:00 - 21:00)</Label><div className="flex gap-2"><FormField name={`availability.${day}.evening.start` as any} control={form.control} render={({ field }) => (<FormItem><TimeSlotSelect field={field} slots={eveningSlots} disabled={!form.watch(`availability.${day}.enabled` as any)} /></FormItem>)} /> <FormField name={`availability.${day}.evening.end` as any} control={form.control} render={({ field }) => (<FormItem><TimeSlotSelect field={field} slots={eveningSlots} disabled={!form.watch(`availability.${day}.enabled` as any)} /></FormItem>)} /></div></div>
                  </div>
                ))}
              </CardContent></Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <Card><CardHeader><CardTitle>Bank & Payouts</CardTitle><CardDescription>This information is encrypted and used solely for processing your earnings.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <FormFieldWrapper fieldName="panNumber"><FormField name="panNumber" control={form.control} render={({ field }) => (<FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input placeholder="e.g., ABCDE1234F" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl><FormDescription>PAN is mandatory for TDS deduction. We report TDS against your PAN so you can claim it in your annual ITR.</FormDescription><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <FormFieldWrapper fieldName="bankAccountNumber"><FormField name="bankAccountNumber" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bank Account Number</FormLabel><FormControl><Input placeholder="Your account number" {...field} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <FormFieldWrapper fieldName="bankIfscCode"><FormField name="bankIfscCode" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bank IFSC Code</FormLabel><FormControl><Input placeholder="Your bank's IFSC code" {...field} /></FormControl><FormMessage /></FormItem>)} /></FormFieldWrapper>
                <FormFieldWrapper fieldName="kycBankProof">
                  <FormField
                    name="kycBankProof"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Proof Document</FormLabel>
                        <FormControl>
                          <MediaPicker
                            value={field.value ? [field.value] : []}
                            onChange={(media) => field.onChange(media[0] || null)}
                            multiple={false}
                          />
                        </FormControl>
                        <FormDescription>Canceled cheque, statement</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormFieldWrapper>
              </CardContent></Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={isPending || !form.formState.isValid}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isEditing ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isEditing ? 'Submit Changes for Review' : 'Submit for Verification'}
          </Button>
        </div>
      </form>
    </Form>
  );
}