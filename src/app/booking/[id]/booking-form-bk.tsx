
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import type { Appointment, Therapist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle, MapPin, Upload } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useState, useMemo, useEffect, useTransition } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import useRazorpay from '@/hooks/use-razorpay';
import { isSameDay, isPast, set } from 'date-fns';
import { Price } from '@/components/money/price';
import { listAppointmentsForUser } from '@/lib/repos/appointments';
import { getTherapyCategories } from '@/lib/repos/categories';
import { createBookingAndInvoice } from '@/lib/actions/booking';

const bookingFormSchema = z.object({

  serviceType: z.string().min(1, { message: "Please select a service type." }),
  patientFullName: z
    .string()
    .min(1, { message: "Please enter the patient's full name." }),

  dob: z
    .string()
    .min(1, { message: "Please select the date of birth." })
    // optional: add date format check
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format.",
    }),
  sessionMode: z.enum(['home', 'online', 'clinic'], { required_error: "Please select a session mode." }),
  scheduledDate: z.date({ required_error: "Please select a date." }),
  scheduledTime: z.string().min(1, { message: "Please select a time slot." }),
  isHomeVisit: z.boolean().default(false),
  addressId: z.string().optional(),
  selectedAddress: z.string().optional(),
  line1: z.string().optional(),
  city: z.string().optional(),
  pin: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  prescription: z.any().optional(),
  notes: z.string().optional(),
  consent_terms: z.boolean().refine(val => val === true, { message: "You must agree to the Terms of Use." }),
  consent_medical: z.boolean().refine(val => val === true, { message: "You must agree to the Medical Consent Terms." }),
  consent_privacy: z.boolean().refine(val => val === true, { message: "You must agree to the Privacy Policy." }),
  consent_refund: z.boolean().refine(val => val === true, { message: "You must agree to the Refund, Cancellation & Return Policy." }),
}).refine(data => {
    if (data.sessionMode === 'home') {
        return !!data.line1 && !!data.city && !!data.pin;
    }
    return true;
}, {
    message: "Address, City, and Pincode are required for home visits.",
    path: ["line1"],
});


type BookingFormValues = z.infer<typeof bookingFormSchema>;

export function BookingForm({ therapist }: { therapist: Therapist }) {
    console.log("therapist booking",therapist);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { openPayment, isLoaded } = useRazorpay();
  const [therapistAppointments, setTherapistAppointments] = useState<Appointment[]>([]);
  const [therapyCategories, setTherapyCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        const [apps, cats] = await Promise.all([
            listAppointmentsForUser(therapist.id, 'therapist'),
            getTherapyCategories()
        ]);
        setTherapistAppointments(apps);
        setTherapyCategories(cats);
    };
    fetchData();
  }, [therapist.id]);


  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceType: therapist.serviceTypes[0] || 'Physiotherapy',
      sessionMode: 'home',
      isHomeVisit: true,
      prescription: null,
      notes: '',
      consent_terms: false,
      consent_medical: false,
      consent_privacy: false,
      consent_refund: false,
      selectedAddress: user?.address ? 'primary' : 'new',
    },
  });

  useEffect(() => {
    if (user?.address) {
      form.setValue('selectedAddress', 'primary');
      form.setValue('line1', user.address.line1);
      form.setValue('city', user.address.city);
      form.setValue('pin', user.address.pin);
    } else {
      form.setValue('selectedAddress', 'new');
    }
  }, [user, form]);


  const sessionMode = form.watch('sessionMode');
  const selectedDate = form.watch('scheduledDate');
  const selectedAddress = form.watch('selectedAddress');

  useEffect(() => {
      if (selectedAddress === 'primary' && user?.address) {
          form.setValue('line1', user.address.line1);
          form.setValue('city', user.address.city);
          form.setValue('pin', user.address.pin);
      } else if (selectedAddress === 'new') {
          form.setValue('line1', '');
          form.setValue('city', '');
          form.setValue('pin', '');
      }
  }, [selectedAddress, user, form]);
  
 const timeSlots = useMemo(() => {
    if (!selectedDate || !therapist.availability) return [];

    const dayOfWeek = selectedDate.toLocaleString('en-US', { weekday: 'short' }).toLowerCase() as keyof Therapist['availability']['windows'];
    const availability = therapist.availability.windows[dayOfWeek];

    if (!availability ) return [];

    const slots: string[] = [];
    const addSlots = (period: { start: string | null, end: string | null, enabled: boolean }) => {
        if (!period.enabled || !period.start || !period.end) return;
        const startHour = parseInt(period.start.split(':')[0]);
        const endHour = parseInt(period.end.split(':')[0]);
        for (let i = startHour; i < endHour; i++) {
            slots.push(`${i.toString().padStart(2, '0')}:00`);
        }
    };
    console.log("availability values",availability)

    addSlots(availability.morning);
    addSlots(availability.evening);

    return slots;
}, [selectedDate, therapist.availability]);

  const isTimeSlotAvailable = (time: string): boolean => {
    if (!selectedDate) return false;

    const [hour, minute] = time.split(':').map(Number);
    const slotDateTime = set(selectedDate, { hours: hour, minutes: minute });
    if (isPast(slotDateTime)) return false;

    const isBooked = therapistAppointments.some(app => 
        isSameDay(new Date(app.date), selectedDate) &&
        app.time === time &&
        app.status !== 'Cancelled'
    );
    if (isBooked) return false;

    return true;
  };
  
  const isDateFullyBooked = (date: Date) => {
  const appointmentsOnDate = therapistAppointments.filter(app =>
    isSameDay(new Date(app.date), date) && app.status !== 'Cancelled'
  );

  console.log("length timeSlots.length", timeSlots.length);
  console.log("length appointmentsOnDate.length", appointmentsOnDate.length);

  return timeSlots.length > 0 && appointmentsOnDate.length >= timeSlots.length;
}
console.log("timeSlots", timeSlots);
  const handleLocationRequest = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                form.setValue('latitude', latitude);
                form.setValue('longitude', longitude);
                toast({
                    title: "Location Fetched!",
                    description: "Your current location has been recorded."
                });
                setIsGettingLocation(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast({
                    variant: 'destructive',
                    title: "Location Error",
                    description: "Could not retrieve your location. Please check browser permissions."
                });
                setIsGettingLocation(false);
            }
        );
    } else {
        toast({
            variant: 'destructive',
            title: "Unsupported",
            description: "Geolocation is not supported by this browser."
        });
        setIsGettingLocation(false);
    }
  };

  function onSubmit(data: BookingFormValues) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: "Authentication Required",
            description: "Please sign in to book an appointment.",
        });
        router.push('/auth/signin');
        return;
    }

    const serviceAmount = 1500; // Placeholder price

    openPayment({
        amount: serviceAmount * 100,
        currency: 'INR',
        receipt: `receipt_booking_${therapist.id}_${Date.now()}`,
        productName: `Session with ${therapist.name}`,
        productDescription: `A ${data.serviceType} session scheduled for ${data.scheduledDate.toLocaleDateString()} at ${data.scheduledTime}.`,
        prefill: {
            name: user.name,
            email: user.email,
        },
        onSuccess: (paymentResponse) => {
            startTransition(async () => {
                const bookingDetails = {
                    patientId: user.id,
                    patientName: user.name || 'N/A',
                    therapistId: therapist.id,
                    therapist: therapist.name,
                    serviceTypeId: data.serviceType.toLowerCase().replace(/ /g, '-'),
                    therapyType: data.serviceType,
                    serviceAmount: serviceAmount,
                    totalAmount: serviceAmount,
                    date: data.scheduledDate.toISOString(),
                    time: data.scheduledTime,
                    mode: data.sessionMode,
                    notes: data.notes,
                    serviceAddress: data.sessionMode === 'home' ? {
                        line1: data.line1 || '', city: data.city || '', pin: data.pin || '', state: 'Gujarat', country: 'India'
                    } : undefined,
                    status: 'Pending',            // or whatever default you want
                    verificationStatus: 'Pending',
                };

                const result = await createBookingAndInvoice(bookingDetails, { paymentId: paymentResponse.razorpay_payment_id, gateway: 'razorpay' });

                if(result.success) {
                    toast({
                      title: 'Booking Confirmed!',
                      description: 'Your appointment has been successfully booked.',
                    });
                    router.push('/dashboard/bookings');
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Booking Failed',
                        description: result.error || 'There was an issue saving your booking. Please contact support.',
                    });
                }
            });
        }
    });
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {therapyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            {/* Patient Full Name */}
                <FormField
                    control={form.control}
                    name="patientFullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Patient Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter patient full name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Date of Birth */}
                <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                                <Input type="date" placeholder="Select date of birth" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

            <FormField
                control={form.control}
                name="sessionMode"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Session Mode</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="home" /></FormControl>
                            <FormLabel className="font-normal">Home Visit</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="online" /></FormControl>
                            <FormLabel className="font-normal">Online</FormLabel>
                        </FormItem>
                         <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="clinic" /></FormControl>
                            <FormLabel className="font-normal">Clinic</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            {sessionMode === 'home' && (
                <div className="space-y-4 p-4 border rounded-md">
                     <FormField
                        control={form.control}
                        name="selectedAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select Address</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a saved address" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {user?.address && <SelectItem value="primary">{user.address.line1}, {user.address.city}</SelectItem>}
                                        <SelectItem value="new">Add a new address</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                     {(selectedAddress === 'new' || !user?.address) && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium">New Address</h4>
                                <Button type="button" variant="outline" size="sm" onClick={handleLocationRequest} disabled={isGettingLocation}>
                                    <MapPin className="mr-2" />
                                    {isGettingLocation ? 'Fetching...' : 'Use Current Location'}
                                </Button>
                            </div>
                            <FormField control={form.control} name="line1" render={({ field }) => (
                                <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input placeholder="Building name and street" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="city" render={({ field }) => (
                                    <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Your city" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="pin" render={({ field }) => (
                                    <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="Your pincode" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                        </div>
                     )}
                     {form.watch('latitude') && form.watch('longitude') && (
                        <Input disabled value={`Lat: ${form.watch('latitude')}, Lng: ${form.watch('longitude')}`} />
                    )}
                </div>
            )}
            
            <div className="flex flex-col gap-6">
                <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Preferred Date</FormLabel>
                            <FormControl>
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                        date < new Date(new Date().setDate(new Date().getDate() - 1)) ||
                                        isDateFullyBooked(date)
                                    }
                                    initialFocus
                                    className="rounded-md border p-0"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Preferred Time</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-3 gap-2">
                                    {timeSlots.map((time) => (
                                        <Button
                                            key={time}
                                            type="button"
                                            variant="outline"
                                            className={cn("text-xs h-10", field.value === time && "bg-primary text-primary-foreground")}
                                            onClick={() => field.onChange(time)}
                                            disabled={!isTimeSlotAvailable(time)}
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            </FormControl>
                             {!selectedDate && <FormDescription className="mt-2">Please select a date first.</FormDescription>}
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="prescription"
                render={({ field: { onChange, ...fieldProps } }) => (
                    <FormItem>
                        <FormLabel>Upload Prescription (Optional)</FormLabel>
                        <FormControl>
                            <Input 
                                type="file" 
                                accept="image/*,.pdf" 
                                onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                {...fieldProps}
                            />
                        </FormControl>
                        <FormDescription>You can upload an image or PDF of your prescription.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Special Instructions</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Any additional notes for the therapist or clinic." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="consent_terms"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I agree to the <Link href="/legal/terms-of-use" className="text-primary hover:underline" target="_blank">Terms of Use</Link>.</FormLabel>
                            <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="consent_medical"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I agree to the <Link href="/legal/medical-consent" className="text-primary hover:underline" target="_blank">Medical Consent Terms</Link>.</FormLabel>
                             <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="consent_privacy"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I agree to the <Link href="/legal/privacy-policy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>.</FormLabel>
                             <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="consent_refund"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I agree to the <Link href="/legal/refund-policy" className="text-primary hover:underline" target="_blank">Refund, Cancellation & Return Policy</Link>.</FormLabel>
                             <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-muted-foreground">Service Fee</p>
                <p className="text-2xl font-bold"><Price amount={1500} showDecimals /></p>
            </div>

            <Button
                size="lg"
                type="submit"
                disabled={!isLoaded || isPending}
                className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white hover:opacity-90 transition-opacity"
            >
                <CheckCircle className="mr-2 h-4 w-4" />
                Proceed to Payment
            </Button>
        </form>
    </Form>
  );
}
