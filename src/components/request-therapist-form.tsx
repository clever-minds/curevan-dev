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
import { MapPin, Send, Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useTransition, useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { getTherapyCategoriesWithIds } from '@/lib/repos/categories';
import { useAuth } from '@/context/auth-context';
import { createBookingAndInvoice } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AddressFormModal, AddressPickerModal } from '@/app/booking/[id]/booking-form';
import { createAddress, deleteAddress, listAddresses, updateAddress } from '@/lib/repos/address';
import { getIndianStates } from '@/lib/repos/meta';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const requestTherapistSchema = z.object({
  patientFullName: z.string().min(1, 'Please enter patient full name.'),
  contact: z.string().min(1, 'Please enter your contact information.'),
  dob: z.string().min(1, { message: 'Please select the date of birth.' }).refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date format.' }),
  therapyType: z.string().min(1, 'Please select a therapy type.'),
  description: z.string().min(10, 'Please describe your needs.'),
  sessionMode: z.enum(['home', 'online', 'clinic'], { required_error: "Please select a session mode." }),
  scheduledDate: z.date({ required_error: "Please select a date." }),
  scheduledTime: z.string().min(1, { message: "Please select a time slot." }),
  addressId: z.string().optional(),
  prescription: z.any().optional(),
  consent_terms: z.boolean().refine(val => val === true, { message: 'You must agree to the Terms of Use.' }),
  consent_medical: z.boolean().refine(val => val === true, { message: 'You must agree to the Medical Consent Terms.' }),
  consent_privacy: z.boolean().refine(val => val === true, { message: 'You must agree to the Privacy Policy.' }),
  consent_refund: z.boolean().refine(val => val === true, { message: 'You must agree to the Refund, Cancellation & Return Policy.' }),
}).refine(data => {
    if (data.sessionMode === 'home') return !!data.addressId;
    return true;
}, {
    message: "Please select a delivery address for home visits.",
    path: ["addressId"]
});

type RequestTherapistFormValues = z.infer<typeof requestTherapistSchema>;

export function RequestTherapistForm({ onClose }: { onClose?: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [therapyCategories, setTherapyCategories] = useState<{id: number, name: string}[]>([]);
  
  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [indianStates, setIndianStates] = useState<string[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddressFormModal, setShowAddressFormModal] = useState(false);
  const [showAddressPickerModal, setShowAddressPickerModal] = useState(false);

  const form = useForm<RequestTherapistFormValues>({
    resolver: zodResolver(requestTherapistSchema),
    defaultValues: {
      patientFullName: '',
      contact: '',
      dob: '',
      description: '',
      sessionMode: 'home',
      prescription: null,
      consent_terms: false,
      consent_medical: false,
      consent_privacy: false,
      consent_refund: false,
      addressId: '',
    },
  });

  const sessionMode = form.watch('sessionMode');
  const selectedAddressId = form.watch('addressId');

  const selectedAddress = useMemo(
    () => addresses.find(a => String(a.id) === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  useEffect(() => {
    const fetchData = async () => {
        const [data, states] = await Promise.all([
          getTherapyCategoriesWithIds(),
          getIndianStates()
        ]);
        setTherapyCategories(data);
        setIndianStates(states);
    };
    fetchData();
  }, []);

  useEffect(() => { fetchAddressesData(); }, [user?.id]);

  const fetchAddressesData = async () => {
    if (!user?.id) return;
    setIsAddressLoading(true);
    const data = await listAddresses();
    setIsAddressLoading(false);
    if (data && Array.isArray(data) && data.length > 0) {
      setAddresses(data);
      form.setValue('addressId', String(data[0].id), { shouldValidate: true });
    }
  };

  const handleAddAddress = async (formData: any) => {
    const result = await createAddress({
      user_id: user!.id,
      street: formData.fullAddress,
      full_name: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      state: formData.state,
      country: 'India',
      postal_code: formData.pincode,
      is_default: false,
    });
    if (result) {
      toast({ title: '✓ Address added successfully!' });
      await fetchAddressesData();
      setShowAddressFormModal(false);
      setShowAddressPickerModal(true);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add address' });
    }
  };

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await deleteAddress(Number(id));
    if (result.success) {
      toast({ title: '✓ Address deleted!' });
      if (selectedAddressId === id) form.setValue('addressId', '');
      await fetchAddressesData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleSaveEdit = async (formData: any) => {
    if (!editingAddress) return;
    const payload = {
      user_id: user!.id,
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      street: formData.fullAddress,
      city: formData.city,
      state: formData.state,
      country: 'India',
      postal_code: formData.pincode,
    };
    try {
      const result = await updateAddress(editingAddress.id, payload);
      if (result && result.success) {
        toast({ title: '✓ Address updated successfully!' });
        await fetchAddressesData();
        setEditingAddress(null);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update address' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Something went wrong' });
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
          patientName: data.patientFullName || user!.name || 'N/A',
          dateofBirth: data.dob,
          therapistId: null as any,
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
          addressId: data.sessionMode === 'home' ? Number(data.addressId) : undefined,
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
    <>
      <AddressPickerModal
        isOpen={showAddressPickerModal}
        onClose={() => setShowAddressPickerModal(false)}
        addresses={addresses}
        selectedId={selectedAddressId || ''}
        isLoading={isAddressLoading}
        onSelect={(id) => {
          form.setValue('addressId', id, { shouldValidate: true });
          setShowAddressPickerModal(false);
        }}
        onAdd={() => {
          setShowAddressPickerModal(false);
          setShowAddressFormModal(true);
        }}
        onEdit={(addr) => {
          setEditingAddress(addr);
          setShowAddressPickerModal(false);
        }}
        onDelete={handleDeleteAddress}
      />

      <AddressFormModal
        isOpen={showAddressFormModal}
        onClose={() => setShowAddressFormModal(false)}
        onSave={handleAddAddress}
        indianStates={indianStates}
        mode="add"
      />

      <AddressFormModal
        isOpen={!!editingAddress}
        onClose={() => setEditingAddress(null)}
        onSave={handleSaveEdit}
        indianStates={indianStates}
        address={editingAddress}
        mode="edit"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
          <div className="grid md:grid-cols-2 gap-4">
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
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
              <div className="space-y-3">
                <FormLabel className="text-base">Home Visit Address</FormLabel>
                {selectedAddress ? (
                  <div className="relative p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="pr-8 space-y-1">
                      <p className="font-semibold text-gray-900">{selectedAddress.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedAddress.fullAddress}</p>
                      <p className="text-sm text-gray-500">{selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddressPickerModal(true)} className="mt-3 text-primary bg-primary/10 hover:bg-primary/20">
                      Change Address
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed rounded-xl text-center hover:bg-gray-50 transition-colors">
                    <p className="text-gray-500 text-sm mb-3">No delivery address selected</p>
                    <Button type="button" onClick={() => setShowAddressPickerModal(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Select or Add Address
                    </Button>
                  </div>
                )}
                {form.formState.errors.addressId && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.addressId.message}</p>
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

          <div className="space-y-3 pt-4 border-t">
            <FormField control={form.control} name="consent_terms" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I agree to the <Link href="/terms-of-use" className="text-primary hover:underline">Terms of Use</Link>.</FormLabel>
                </div>
              </FormItem>
            )} />
            <FormField control={form.control} name="consent_medical" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I agree to the <Link href="/medical-consent" className="text-primary hover:underline">Medical Consent Terms</Link>.</FormLabel>
                </div>
              </FormItem>
            )} />
            <FormField control={form.control} name="consent_privacy" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I agree to the <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.</FormLabel>
                </div>
              </FormItem>
            )} />
            <FormField control={form.control} name="consent_refund" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>I agree to the <Link href="/refund-policy" className="text-primary hover:underline">Refund, Cancellation & Return Policy</Link>.</FormLabel>
                </div>
              </FormItem>
            )} />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
              Submit Request
          </Button>
        </form>
      </Form>
    </>
  );
}
