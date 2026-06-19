
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
import { MapPin, Send, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useTransition } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { getTherapyCategories } from '@/lib/repos/categories';
import GooglePlacesInput from './GooglePlaceInput';
import { useAuth } from '@/context/auth-context';
import { createBookingAndInvoice } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const requestTherapistSchema = z.object({
  fullName: z.string().min(1, 'Please enter your full name.'),
  contact: z.string().min(1, 'Please enter your contact information.'),
  therapyType: z.string().min(1, 'Please select a therapy type.'),
  description: z.string().min(10, 'Please describe your needs.'),
  sessionMode: z.enum(['home', 'online', 'clinic'], { required_error: "Please select a session mode." }),
  scheduledDate: z.date({ required_error: "Please select a date." }),
  scheduledTime: z.string().min(1, { message: "Please select a time slot." }),
  line1: z.string().optional(),
  city: z.string().optional().refine((val) => !val || /^[a-zA-Z\s]*$/.test(val), {
    message: "City should only contain letters and spaces",
  }),
  pin: z.string().optional().refine((val) => !val || /^\d*$/.test(val), {
    message: "Pincode should only contain numbers",
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  prescription: z.any().optional(),
}).refine(data => {
    if (data.sessionMode === 'home') {
        return !!data.line1 && !!data.city && !!data.pin && !!data.latitude && !!data.longitude;
    }
    return true;
}, {
    message: "Please select an address from the dropdown suggestions to accurately find nearby therapists.",
    path: ["line1"]
});

type RequestTherapistFormValues = z.infer<typeof requestTherapistSchema>;

export function RequestTherapistForm({ onClose }: { onClose?: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [therapyCategories, setTherapyCategories] = useState<{id: number, name: string}[]>([]);
  
  const form = useForm<RequestTherapistFormValues>({
    resolver: zodResolver(requestTherapistSchema),
    defaultValues: {
      fullName: '',
      contact: '',
      description: '',
      sessionMode: 'home',
      prescription: null,
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
        const data = await getTherapyCategories();
        setTherapyCategories(data);
    };
    fetchCategories();
  }, []);

  const sessionMode = form.watch('sessionMode');

  const handleLocationRequest = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                form.setValue('latitude', latitude);
                form.setValue('longitude', longitude);
                toast({ title: "Location Fetched!", description: "Your current location has been recorded." });
                setIsGettingLocation(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast({ variant: 'destructive', title: "Location Error", description: "Could not retrieve your location." });
                setIsGettingLocation(false);
            }
        );
    } else {
        toast({ variant: 'destructive', title: "Unsupported", description: "Geolocation is not supported by this browser." });
        setIsGettingLocation(false);
    }
  };

  function onSubmit(data: RequestTherapistFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Required', description: 'Please sign in to request a therapist.' });
      router.push('/auth/signin');
      return;
    }

    let reportsBase64: any = null;
    if (data.prescription) {
      const file = data.prescription;
      if (file instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          reportsBase64 = [{ name: file.name, type: file.type, data: reader.result }];
          submitBooking(reportsBase64);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
    submitBooking(reportsBase64);

    function submitBooking(processedReports: any) {
      startTransition(async () => {
        const selectedCat = therapyCategories.find(c => c.name === data.therapyType);
        
        const result = await createBookingAndInvoice({
          patientId: user!.id,
          patientName: data.fullName || user!.name || 'N/A',
          dateofBirth: '1990-01-01', // default or ask in form if needed
          therapistId: null as any, // unassigned
          therapist: 'Unassigned',
          serviceTypeId: selectedCat ? selectedCat.id : (null as any),
          therapyType: data.therapyType,
          serviceAmount: 0,
          totalAmount: 0,
          date: format(data.scheduledDate, 'yyyy-MM-dd') as any,
          time: data.scheduledTime,
          mode: data.sessionMode,
          notes: data.description,
          reports: processedReports,
          latitude: data.latitude,
          longitude: data.longitude,
          status: 'Pending',
          verificationStatus: 'Not Verified',
        }, { paymentId: 'pay-later', gateway: 'none' });

        if (result.success) {
          toast({
            title: 'Request Submitted',
            description: "Our team will find the best therapist for you nearby. We'll notify you shortly.",
          });
          form.reset();
          if (onClose) onClose();
          router.push('/dashboard/bookings');
        } else {
          toast({ variant: 'destructive', title: 'Submission Failed', description: result.error || 'Failed to submit request.' });
        }
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
        <div className="grid md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                    <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email or Phone Number</FormLabel>
                <FormControl>
                    <Input placeholder="How can we reach you?" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="therapyType"
            render={({ field }) => (
                <FormItem>
                <FormLabel>What type of therapy do you need?</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a therapy type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {therapyCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe your needs</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe your condition or what you're looking for in a therapist."
                  rows={3}
                  {...field}
                />
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
                <FormLabel>Preferred Session Mode</FormLabel>
                <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="home" /></FormControl><FormLabel className="font-normal">Home Visit</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="online" /></FormControl><FormLabel className="font-normal">Online</FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="clinic" /></FormControl><FormLabel className="font-normal">Clinic</FormLabel></FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        {sessionMode === 'home' && (
            <div className="space-y-4 p-4 border rounded-md">
                <div className="flex justify-between items-center">
                    <h4 className="font-medium">Home Visit Address</h4>
                    <Button type="button" variant="outline" size="sm" onClick={handleLocationRequest} disabled={isGettingLocation}>
                        <MapPin className="mr-2" />
                        {isGettingLocation ? 'Fetching...' : 'Use Current Location'}
                    </Button>
                </div>
                <FormField control={form.control} name="line1" render={({ field }) => (<FormItem><FormLabel>Address Line 1</FormLabel><FormControl>
                  <GooglePlacesInput 
                    value={field.value || ''} 
                    onChange={field.onChange} 
                    onAddressSelect={(geo) => {
                      form.setValue('line1', geo.line1, { shouldValidate: true });
                      form.setValue('city', geo.city, { shouldValidate: true });
                      form.setValue('pin', geo.pin, { shouldValidate: true });
                      form.setValue('latitude', geo.lat, { shouldValidate: true });
                      form.setValue('longitude', geo.lng, { shouldValidate: true });
                    }} 
                  />
                </FormControl><FormMessage /></FormItem>)}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Your city" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="pin" render={({ field }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="Your pincode" {...field} onChange={(e) => {
                        const val = e.target.value;
                        if (!val || /^\d*$/.test(val)) {
                            field.onChange(val);
                        }
                    }} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
                {form.watch('latitude') && form.watch('longitude') && (
                    <Input disabled value={`Lat: ${form.watch('latitude')}, Lng: ${form.watch('longitude')}`} />
                )}
            </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} initialFocus className="rounded-md border p-0"/>
                    </FormControl><FormMessage /></FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                    <FormItem><FormLabel>Preferred Time</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                            {timeSlots.map((time) => (
                                <Button key={time} type="button" variant="outline" className={cn("text-xs h-10", field.value === time && "bg-primary text-primary-foreground")} onClick={() => field.onChange(time)}>{time}</Button>
                            ))}
                        </div>
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
                    <FormControl><Input type="file" accept="image/*,.pdf" onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} {...fieldProps}/></FormControl>
                    <FormDescription>You can upload an image or PDF of your prescription.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
            Submit Request
        </Button>
      </form>
    </Form>
  );
}
