'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import type { Appointment, Therapist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  CheckCircle, MapPin, Edit, Trash2, Plus, X,
  User, Mail, Phone, ChevronRight, ChevronDown, Loader2, Navigation,
} from 'lucide-react';
import {
  Form, FormControl, FormField, FormItem, FormLabel,
  FormMessage, FormDescription,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useState, useMemo, useEffect, useTransition } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import useRazorpay from '@/hooks/use-razorpay';
import { isSameDay, isPast, set, format } from 'date-fns';
import { Price } from '@/components/money/price';
import { listAppointmentsForUser } from '@/lib/repos/appointments';
import { getTherapyCategories } from '@/lib/repos/categories';
import { createBookingAndInvoice } from '@/lib/actions/booking';
import { createAddress, deleteAddress, listAddresses, updateAddress } from '@/lib/repos/address';
import { getIndianStates } from '@/lib/repos/meta';

// ─────────────────────────────────────────────────────────────────────────────
// Reverse Geocoding helper (OpenStreetMap Nominatim — free, no key needed)
// ─────────────────────────────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<{
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
} | null> {
  try {
    const GOOGLE_API_KEY = "AIzaSyDGxg9Uw6sQXWDVoEAmirxdVF5neAICKJM";
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&language=en&region=IN`
    );
    const data = await res.json();

    if (data.status !== 'OK' || !data.results?.length) return null;

    const components: { types: string[]; long_name: string; short_name: string }[] =
      data.results[0].address_components ?? [];

    const get = (type: string) =>
      components.find(c => c.types.includes(type))?.long_name || '';

    const streetNumber = get('street_number');
    const route = get('route');
    const sublocality = get('sublocality_level_1') || get('sublocality') || get('neighborhood');
    const fullAddress = [streetNumber, route, sublocality].filter(Boolean).join(', ');

    const city =
      get('locality') ||
      get('administrative_area_level_3') ||
      get('administrative_area_level_2');

    const state = get('administrative_area_level_1');
    const pincode = get('postal_code');

    return { fullAddress, city, state, pincode };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / Edit Address Modal
// ─────────────────────────────────────────────────────────────────────────────

function AddressFormModal({
  isOpen,
  onClose,
  onSave,
  indianStates,
  address = null,
  mode = 'add',
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  indianStates: string[];
  address?: any;
  mode?: 'add' | 'edit';
}) {
  const blank = { fullName: '', email: '', phone: '', fullAddress: '', city: '', state: '', pincode: '' };
  const [formData, setFormData] = useState(address || blank);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const { toast } = useToast();

  useEffect(() => { if (address) setFormData(address); }, [address]);

  if (!isOpen) return null;

  const isEdit = mode === 'edit';
  const Icon = isEdit ? Edit : Plus;

  const handleReset = () => setFormData(blank);

  // ── Auto-fill from GPS ──────────────────────────────────────────────────
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Not supported', description: 'Geolocation is not supported by your browser.' });
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        const geo = await reverseGeocode(latitude, longitude);
        if (geo) {
          setFormData((prev: any) => ({
            ...prev,
            fullAddress: geo.fullAddress || prev.fullAddress,
            city: geo.city || prev.city,
            state: geo.state || prev.state,
            pincode: geo.pincode || prev.pincode,
          }));
          toast({ title: '📍 Location detected!', description: 'Address fields have been filled automatically.' });
        } else {
          toast({ variant: 'destructive', title: 'Could not resolve address', description: 'Please fill in the address manually.' });
        }
        setIsFetchingLocation(false);
      },
      () => {
        toast({ variant: 'destructive', title: 'Location Error', description: 'Could not retrieve your location.' });
        setIsFetchingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
      <style>{`
        :root { --primary: 262, 80%, 50%; --accent: 280, 85%, 56%; }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">

        {/* Header */}
        <div className="relative h-28 overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(280,85%,56%))' }} />
          <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(-45deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%)', animation: 'shimmer 3s infinite' }} />
          <div className="relative h-full px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{isEdit ? 'Edit Address' : 'Add New Address'}</h3>
                <p className="text-white/75 text-sm">{isEdit ? 'Update delivery details' : 'Add a new delivery location'}</p>
              </div>
            </div>
            <button onClick={() => { handleReset(); onClose(); }} className="p-2 hover:bg-white/15 rounded-xl text-white transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">

          {/* Contact */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><User size={16} /></div>
              <span className="font-semibold text-gray-800">Contact Information</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Enter full name" className="rounded-xl" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 block"><Mail size={13} className="text-purple-500" />Email</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 block"><Phone size={13} className="text-purple-500" />Phone</label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="10-digit number" className="rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2 text-purple-400">
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Address with "Use My Location" button */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-fuchsia-50 flex items-center justify-center text-fuchsia-600"><MapPin size={16} /></div>
                <span className="font-semibold text-gray-800">Address Details</span>
              </div>

              {/* 📍 Use My Location button — inside the modal */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleUseLocation}
                disabled={isFetchingLocation}
                className="gap-1.5 text-xs border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl"
              >
                {isFetchingLocation
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Navigation size={13} />
                }
                {isFetchingLocation ? 'Detecting...' : 'Use My Location'}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Street Address</label>
                <Input value={formData.fullAddress} onChange={e => setFormData({ ...formData, fullAddress: e.target.value })} placeholder="House No, Building, Street" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
                  <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">State</label>
                  <Select value={formData.state} onValueChange={v => setFormData({ ...formData, state: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>
                      {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Pincode</label>
                  <Input value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} placeholder="6 digits" className="rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-8 py-5 flex gap-3">
          <Button
            onClick={() => { onSave(formData); handleReset(); onClose(); }}
            className="flex-1 text-white rounded-xl h-11 border-0 font-semibold"
            style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(280,85%,56%))' }}
          >
            {isEdit ? 'Save Changes' : 'Add Address'}
          </Button>
          <Button variant="outline" onClick={() => { handleReset(); onClose(); }} className="flex-1 rounded-xl h-11 font-semibold">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Address Picker Modal
// ─────────────────────────────────────────────────────────────────────────────

function AddressPickerModal({
  isOpen,
  onClose,
  addresses,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  addresses: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (addr: any) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">

        {/* Header */}
        <div className="relative h-24 overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(280,85%,56%))' }} />
          <div className="relative h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Select Address</h3>
                <p className="text-white/70 text-xs">Choose a delivery location</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/15 rounded-xl text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Address List */}
        <div className="p-5 max-h-[55vh] overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <Loader2 className="animate-spin w-8 h-8" />
              <p className="text-sm">Loading addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-500">No addresses saved</p>
                <p className="text-sm text-gray-400 mt-1">Add your first delivery address</p>
              </div>
            </div>
          ) : (
            addresses.map((addr) => {
              const isSelected = selectedId === String(addr.id);
              return (
                <div
                  key={addr.id}
                  onClick={() => { onSelect(String(addr.id)); onClose(); }}
                  className={cn(
                    'relative p-4 rounded-2xl border-2 cursor-pointer transition-all group',
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  )}
                >
                  {/* Radio indicator */}
                  <div className="absolute top-4 right-4">
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300 bg-white'
                    )}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>

                  <div className="pr-8 space-y-1">
                    <p className="font-semibold text-gray-900 text-sm">{addr.fullName}</p>
                    <p className="text-sm text-gray-600">{addr.fullAddress}</p>
                    <p className="text-sm text-gray-500">{addr.city}, {addr.state} — {addr.pincode}</p>
                  </div>

                  {/* Edit / Delete (shown on hover) */}
                  <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(addr); }}
                      className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition-colors"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(String(addr.id), e); }}
                      className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-5 py-4">
          <Button
            type="button"
            onClick={onAdd}
            className="w-full gap-2 rounded-xl h-11 text-white font-semibold border-0"
            style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(280,85%,56%))' }}
          >
            <Plus size={16} /> Add New Address
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const bookingFormSchema = z.object({
  serviceType: z.string().min(1, { message: 'Please select a service type.' }),
  patientFullName: z.string().min(1, { message: "Please enter the patient's full name." }),
  dob: z.string().min(1, { message: 'Please select the date of birth.' })
    .refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date format.' }),
  sessionMode: z.enum(['home', 'online', 'clinic'], { required_error: 'Please select a session mode.' }),
  scheduledDate: z.date({ required_error: 'Please select a date.' }),
  scheduledTime: z.string().min(1, { message: 'Please select a time slot.' }),
  isHomeVisit: z.boolean().default(false),
  addressId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  prescription: z.any().optional(),
  notes: z.string().optional(),
  consent_terms: z.boolean().refine(val => val === true, { message: 'You must agree to the Terms of Use.' }),
  consent_medical: z.boolean().refine(val => val === true, { message: 'You must agree to the Medical Consent Terms.' }),
  consent_privacy: z.boolean().refine(val => val === true, { message: 'You must agree to the Privacy Policy.' }),
  consent_refund: z.boolean().refine(val => val === true, { message: 'You must agree to the Refund, Cancellation & Return Policy.' }),
}).refine(data => {
  if (data.sessionMode === 'home') return !!data.addressId;
  return true;
}, {
  message: 'Please select a delivery address for home visits.',
  path: ['addressId'],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// BookingForm
// ─────────────────────────────────────────────────────────────────────────────

export function BookingForm({ therapist }: { therapist: Therapist }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { openPayment, isLoaded } = useRazorpay();

  const [therapistAppointments, setTherapistAppointments] = useState<Appointment[]>([]);
  const [therapyCategories, setTherapyCategories] = useState<string[]>([]);

  // Address state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [indianStates, setIndianStates] = useState<string[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddressFormModal, setShowAddressFormModal] = useState(false);
  const [showAddressPickerModal, setShowAddressPickerModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [apps, cats, states] = await Promise.all([
        listAppointmentsForUser(therapist.id, 'therapist'),
        getTherapyCategories(),
        getIndianStates(),
      ]);
      setTherapistAppointments(apps);
      setTherapyCategories(cats);
      setIndianStates(states);
    };
    fetchData();
  }, [therapist.id]);

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

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceType: therapist.serviceTypes[0] || 'Physiotherapy',
      sessionMode: 'home',
      isHomeVisit: true,
      prescription: null,
      notes: '',
      dob:"",
      consent_terms: false,
      consent_medical: false,
      consent_privacy: false,
      consent_refund: false,
      addressId: '',
    },
  });

  const sessionMode = form.watch('sessionMode');
  const selectedDate = form.watch('scheduledDate');
  const selectedAddressId = form.watch('addressId');

  const selectedAddress = useMemo(
    () => addresses.find(a => String(a.id) === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const timeSlots = useMemo(() => {
    if (!selectedDate || !therapist.availability) return [];
    const day = selectedDate.toLocaleString('en-US', { weekday: 'short' }).toLowerCase() as keyof Therapist['availability']['windows'];
    const avail = therapist.availability.windows[day];
    if (!avail) return [];
    const slots: string[] = [];
    const addSlots = (period: { start: string | null; end: string | null; enabled: boolean }) => {
      if (!period.enabled || !period.start || !period.end) return;
      for (let i = parseInt(period.start); i < parseInt(period.end); i++)
        slots.push(`${i.toString().padStart(2, '0')}:00`);
    };
    addSlots(avail.morning);
    addSlots(avail.evening);
    return slots;
  }, [selectedDate, therapist.availability]);

  const isTimeSlotAvailable = (time: string): boolean => {
    if (!selectedDate) return false;
    const [h, m] = time.split(':').map(Number);
    if (isPast(set(selectedDate, { hours: h, minutes: m }))) return false;
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return !therapistAppointments.some(a =>
      a.date.startsWith(selectedDateStr) && a.time === time && a.status !== 'Cancelled'
    );
  };

  const isDateFullyBooked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeSlots.length > 0 &&
      therapistAppointments.filter(a => a.date.startsWith(dateStr) && a.status !== 'Cancelled').length >= timeSlots.length;
  };

  // ── Address handlers ──────────────────────────────────────────────────────

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


  // ── Submit ────────────────────────────────────────────────────────────────

  function onSubmit(data: BookingFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Required', description: 'Please sign in to book an appointment.' });
      router.push('/auth/signin');
      return;
    }

    const serviceAmount = therapist.hourlyRate ?? 500;

console.log("booking new data",data);
    openPayment({
      amount: serviceAmount * 100,
      currency: 'INR',
      receipt: `receipt_booking_${therapist.id}_${Date.now()}`,
      productName: `Session with ${therapist.name}`,
      productDescription: `A ${data.serviceType} session on ${data.scheduledDate.toLocaleDateString()} at ${data.scheduledTime}.`,
      prefill: { name: user.name, email: user.email },
      onSuccess: (paymentResponse) => {
        startTransition(async () => {
          const result = await createBookingAndInvoice({
            patientId: user.id,
            patientName: data.patientFullName || user.name || 'N/A',
            dateofBirth:data.dob,
            therapistId: therapist.id,
            therapist: therapist.name,
            serviceTypeId: data.serviceType.toLowerCase().replace(/ /g, '-'),
            therapyType: data.serviceType,
            serviceAmount,
            totalAmount: serviceAmount,
            date: format(data.scheduledDate, 'yyyy-MM-dd'),
            time: data.scheduledTime,
            mode: data.sessionMode,
            notes: data.notes,
            addressId: data.sessionMode === 'home' ? Number(data.addressId) : undefined,  // ← yahan
            status: 'Pending',
            verificationStatus: 'Not Verified',
          }, { paymentId: paymentResponse.razorpay_payment_id, gateway: 'razorpay' });

          if (result.success) {
            toast({ title: 'Booking Confirmed!', description: 'Your appointment has been successfully booked.' });
            router.push('/dashboard/bookings');
          } else {
            toast({ variant: 'destructive', title: 'Booking Failed', description: result.error || 'There was an issue saving your booking.' });
          }
        });
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Address Picker Modal */}
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

      {/* Add Address Modal */}
      <AddressFormModal
        isOpen={showAddressFormModal}
        onClose={() => setShowAddressFormModal(false)}
        onSave={handleAddAddress}
        indianStates={indianStates}
        mode="add"
      />

      {/* Edit Address Modal */}
      <AddressFormModal
        isOpen={!!editingAddress}
        onClose={() => setEditingAddress(null)}
        onSave={handleSaveEdit}
        indianStates={indianStates}
        address={editingAddress}
        mode="edit"
      />

      {/* ── Main Form ── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Service Type */}
          <FormField control={form.control} name="serviceType" render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger></FormControl>
                <SelectContent>{therapyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {/* Patient Full Name */}
          <FormField control={form.control} name="patientFullName" render={({ field }) => (
            <FormItem>
              <FormLabel>Patient Full Name</FormLabel>
              <FormControl><Input placeholder="Enter patient full name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Date of Birth */}
          <FormField control={form.control} name="dob" render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Session Mode */}
          <FormField control={form.control} name="sessionMode" render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Session Mode</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                  {(['home', 'online', 'clinic'] as const).map(mode => (
                    <FormItem key={mode} className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value={mode} /></FormControl>
                      <FormLabel className="font-normal capitalize">{mode === 'home' ? 'Home Visit' : mode}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* ── Home Visit: Address Picker ── */}
          {sessionMode === 'home' && (
            <div className="space-y-3">
              <FormLabel className="text-base">Delivery Address</FormLabel>

              {/* Selected address card OR empty state */}
              {selectedAddress ? (
                <div
                  className="relative p-4 rounded-2xl border-2 border-purple-400 bg-purple-50 cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => setShowAddressPickerModal(true)}
                >
                  <div className="pr-10 space-y-1">
                    <p className="font-semibold text-gray-900 text-sm">{selectedAddress.fullName}</p>
                    <p className="text-sm text-gray-600">{selectedAddress.fullAddress}</p>
                    <p className="text-sm text-gray-500">{selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}</p>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-lg group-hover:bg-purple-200 transition-colors">
                    Change <ChevronDown size={12} />
                  </div>
                </div>
              ) : (
                <div
                  className="p-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                  onClick={() => setShowAddressPickerModal(true)}
                >
                  {isAddressLoading ? (
                    <><Loader2 className="animate-spin text-gray-400 w-6 h-6" /><p className="text-sm text-gray-400">Loading addresses...</p></>
                  ) : (
                    <><MapPin className="text-gray-300 w-8 h-8" /><p className="text-sm font-medium text-gray-500">Select or add a delivery address</p><p className="text-xs text-gray-400">Tap to open address picker</p></>
                  )}
                </div>
              )}

              {/* Validation error */}
              <FormField control={form.control} name="addressId" render={() => <FormMessage />} />

              {/* Lat/lng if captured */}
              {form.watch('latitude') && form.watch('longitude') && (
                <Input disabled value={`Lat: ${form.watch('latitude')}, Lng: ${form.watch('longitude')}`} className="text-xs text-gray-400" />
              )}
            </div>
          )}

          {/* Date & Time */}
          <div className="flex flex-col gap-6">
            <FormField control={form.control} name="scheduledDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Date</FormLabel>
                <FormControl>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={date =>
                      date < new Date(new Date().setDate(new Date().getDate() - 1)) ||
                      isDateFullyBooked(date)
                    }
                    initialFocus
                    className="rounded-md border p-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="scheduledTime" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Time</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(time => (
                      <Button
                        key={time}
                        type="button"
                        variant="outline"
                        className={cn('text-xs h-10', field.value === time && 'bg-primary text-primary-foreground')}
                        onClick={() => field.onChange(time)}
                        disabled={!isTimeSlotAvailable(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </FormControl>
                {!selectedDate && <FormDescription>Please select a date first.</FormDescription>}
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Prescription */}
          <FormField control={form.control} name="prescription" render={({ field: { onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Upload Prescription (Optional)</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*,.pdf" onChange={e => onChange(e.target.files?.[0] ?? null)} {...fieldProps} />
              </FormControl>
              <FormDescription>Upload an image or PDF of your prescription.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          {/* Notes */}
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel>Special Instructions</FormLabel>
              <FormControl><Textarea placeholder="Any additional notes for the therapist or clinic." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Consents */}
          <div className="space-y-4">
            {([
              { name: 'consent_terms', href: '/legal/terms-of-use', label: 'Terms of Use' },
              { name: 'consent_medical', href: '/legal/medical-consent', label: 'Medical Consent Terms' },
              { name: 'consent_privacy', href: '/legal/privacy-policy', label: 'Privacy Policy' },
              { name: 'consent_refund', href: '/legal/refund-policy', label: 'Refund, Cancellation & Return Policy' },
            ] as const).map(({ name, href, label }) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I agree to the <Link href={href} className="text-primary hover:underline" target="_blank">{label}</Link>.</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
            ))}
          </div>

          {/* Price */}
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-muted-foreground">Service Fee</p>
            <p className="text-2xl font-bold"><Price amount={therapist?.hourlyRate ?? 1500} showDecimals /></p>
          </div>

          {/* Submit */}
          <Button
            size="lg"
            type="submit"
            disabled={!isLoaded || isPending}
            className="w-full text-white hover:opacity-90 transition-opacity border-0"
            style={{ background: 'linear-gradient(135deg, hsl(262,80%,50%), hsl(280,85%,56%))' }}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Proceed to Payment
          </Button>

        </form>
      </Form>
    </>
  );
}