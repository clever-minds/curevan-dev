'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import useRazorpay from '@/hooks/use-razorpay';
import { createOrder } from '@/lib/actions/order';
import { Loader2, Edit, Trash2, Plus, X, MapPin, User, Mail, Phone, ChevronRight, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { createAddress, deleteAddress, listAddresses, updateAddress } from '@/lib/repos/address';
import { getIndianStates } from '@/lib/repos/meta';

// --- Reverse Geocoding helper ---
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

const addressSchema = z.object({
  customerName: z.string().min(1, "Full name is required."),
  customerPhone: z.string().min(10, "A valid phone number is required."),
  customerEmail: z.string().email("Valid email is required"),
  shippingAddressId: z.string().min(1, "Please select a shipping address"),
  billingAddressId: z.string().optional(),
  useShippingAsBilling: z.boolean().default(true),
  newShippingAddress: z.object({
    line1: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pin: z.string().min(1, "Pincode is required"),
  }).optional(),
  newBillingAddress: z.object({
    line1: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pin: z.string().min(1, "Pincode is required"),
  }).optional(),
}).refine(data => {
  if (data.shippingAddressId === 'new' && !data.newShippingAddress) {
    return false;
  }
  if (!data.useShippingAsBilling && data.billingAddressId === 'new' && !data.newBillingAddress) {
    return false;
  }
  return true;
}, { message: "Please fill in all required address fields" });

type AddressFormValues = z.infer<typeof addressSchema>;

// Unified Modal Component for both Add and Edit
function AddressModal({
  isOpen,
  onClose,
  onSave,
  indianStates,
  address = null,
  mode = 'add'
}: any) {
  const [formData, setFormData] = useState(address || {
    fullName: '',
    email: '',
    phone: '',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (address) {
      setFormData(address);
    }
  }, [address]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      fullAddress: '',
      city: '',
      state: '',
      pincode: '',
    });
  };

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

  const isEditMode = mode === 'edit';
  const buttonText = isEditMode ? 'Save Changes' : 'Add Address';
  const title = isEditMode ? 'Edit Address' : 'Add New Address';
  const subtitle = isEditMode ? 'Update your delivery details' : 'Add a new delivery address';
  const icon = isEditMode ? Edit : Plus;
  const IconComponent = icon;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <style>{`
        :root {
          --primary: 262, 80%, 50%;
          --accent: 280, 85%, 56%;
        }
      `}</style>

      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20">
        {/* Animated Header Background */}
        <div className="relative h-32 overflow-hidden">
          {/* Gradient Background using CSS variables */}
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
            }}
          ></div>

          {/* Animated Gradient Overlay */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: `linear-gradient(-45deg, transparent 0%, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%, transparent 100%)`,
              animation: 'shimmer 3s infinite'
            }}
          ></div>

          {/* Content */}
          <div className="relative h-full px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm"
                style={{
                  background: `hsl(var(--primary) / 0.2)`,
                  border: `2px solid hsl(var(--primary) / 0.4)`
                }}
              >
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <p className="text-white/80 text-sm mt-1">{subtitle}</p>
              </div>
            </div>

            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white backdrop-blur-sm"
            >
              <X size={24} />
            </button>
          </div>

          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[calc(90vh-250px)] overflow-y-auto">
          <div className="space-y-8">
            {/* Contact Information Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `hsl(var(--primary) / 0.1)`,
                    color: `hsl(var(--primary))`
                  }}
                >
                  <User size={20} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <Input
                    value={formData?.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your name"
                    className="h-11 px-4 border-gray-300 rounded-xl focus:border-0 transition-all"
                    style={{
                      '--tw-ring-color': 'hsl(var(--primary) / 0.2)',
                      '--tw-ring-offset-width': '0px'
                    } as any}
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 0 3px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary))`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail size={16} style={{ color: 'hsl(var(--primary))' }} />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData?.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="h-11 px-4 border-gray-300 rounded-xl focus:border-0 transition-all"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0 3px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary))`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = '';
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone size={16} style={{ color: 'hsl(var(--primary))' }} />
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={formData?.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10 digit number"
                      className="h-11 px-4 border-gray-300 rounded-xl focus:border-0 transition-all"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0 3px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary))`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = '';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Animated Divider */}
            <div className="relative h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent">
              <div
                className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 bg-white"
                style={{ color: 'hsl(var(--accent))' }}
              >
                <ChevronRight size={18} className="animate-pulse" />
              </div>
            </div>

            {/* Address Information Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `hsl(var(--accent) / 0.1)`,
                    color: `hsl(var(--accent))`
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Address Details</h4>

                  {/* Use Current Location Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleUseLocation}
                    disabled={isFetchingLocation}
                    className="gap-2 text-xs border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl"
                  >
                    {isFetchingLocation
                      ? <Loader2 size={13} className="animate-spin" />
                      : <MapPin size={13} />
                    }
                    {isFetchingLocation ? 'Detecting...' : 'Use Current Location'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <Input
                    value={formData?.fullAddress || ''}
                    onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                    placeholder="House No, Building Name, Street"
                    className="h-11 px-4 border-gray-300 rounded-xl focus:border-0 transition-all"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 0 3px hsl(var(--accent) / 0.15), 0 0 0 1px hsl(var(--accent))`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <Input
                      value={formData?.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="h-11 px-4 border-gray-300 rounded-xl focus:border-0 transition-all"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0 3px hsl(var(--accent) / 0.15), 0 0 0 1px hsl(var(--accent))`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = '';
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <Select
                      value={formData?.state || ''}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger
                        className="h-11 border-gray-300 rounded-xl focus:border-0"
                        style={{
                          '--tw-ring-color': 'hsl(var(--accent) / 0.2)'
                        } as any}
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state: string) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                    <Input
                      value={formData?.pincode || ''}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="6 digits"
                      className="h-11 px-4 border-gray-300 rounded-xl focus:border-0 transition-all"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0 3px hsl(var(--accent) / 0.15), 0 0 0 1px hsl(var(--accent))`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = '';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50/50 px-8 py-6 flex gap-3 sticky bottom-0">
          <Button
            onClick={() => {
              onSave(formData);
              handleReset();
              onClose();
            }}
            className="flex-1 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg h-11 border-0"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
            }}
          >
            {buttonText}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="flex-1 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-100 transition-all h-11"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CheckoutAddressForm() {
  const { user } = useAuth();
  const { cart, getCartTotal, appliedCoupon, commissionInfo, clearCart } = useCart();
  const { toast } = useToast();
  const { openPayment, isLoaded } = useRazorpay();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [indianStates, setIndianStates] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddShipping, setShowAddShipping] = useState(false);
  const [showAddBilling, setShowAddBilling] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
      useShippingAsBilling: true,
      shippingAddressId: '',
      billingAddressId: '',
    },
    mode: 'onChange',
  });

  const useShippingAsBilling = form.watch('useShippingAsBilling');
  const shippingAddressId = form.watch('shippingAddressId');
  const billingAddressId = form.watch('billingAddressId');

  useEffect(() => {
    const fetchStates = async () => {
      const states = await getIndianStates();
      setIndianStates(states);
    };
    fetchStates();
  }, []);

  useEffect(() => {
    fetchAddressesData();
  }, [user?.id]);

  const fetchAddressesData = async () => {
    if (!user?.id) return;
    const data = await listAddresses();
    const addressList = Array.isArray(data) ? data : [];
    setAddresses(addressList);
    
    if (addressList.length > 0) {
      form.setValue('shippingAddressId', String(addressList[0].id), { shouldValidate: true });
    } else {
      form.setValue('shippingAddressId', '', { shouldValidate: true });
    }
  };

  const onSubmit = (data: AddressFormValues) => {
    startTransition(async () => {
      if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to place an order.' });
        return;
      }

      const { total, discount, subtotal } = getCartTotal();
      console.log("data for check create order total", total, "discount", discount, "subtotal", subtotal);

      const finalShippingId = Number(data.shippingAddressId);
      const finalBillingId = data.useShippingAsBilling
        ? Number(data.shippingAddressId)
        : Number(data.billingAddressId);

      try {


        // 2️⃣ Open Razorpay modal
        openPayment({
          amount: Math.round(total * 100),
          currency: 'INR',
          receipt: "",          // internal receipt id
          orderId: "", // Razorpay order ID
          productName: `Curevan Order`,
          productDescription: `Your order with ${cart.length} items.`,
          prefill: { name: data.customerName, email: data.customerEmail, contact: data.customerPhone },
          onSuccess: async (paymentResponse) => {
            // 3️⃣ After payment success, create order in DB
            const orderResult = await createOrder({
              userId: user.id,
              customerName: data.customerName,
              customerPhone: data.customerPhone,
              items: cart,
              shippingAddressId: finalShippingId,
              billingAddressId: finalBillingId,
              couponCode: appliedCoupon?.code,
              couponDiscount: discount,
              subtotal: subtotal,
              total: total,
              referredTherapistId: commissionInfo?.referredTherapistId,
              paymentStatus: "Paid",
              paymentRef: paymentResponse.razorpay_payment_id,
              paymentGateway: "razorpay",
            });

            if (!orderResult.success || !orderResult.orderId) {
              toast({ variant: 'destructive', title: 'Order Failed', description: orderResult.error || 'Could not create your order after payment.' });
              return;
            }

            clearCart();
            toast({ title: "Order Placed!", description: `Your order #${orderResult.orderId} has been confirmed.` });
            router.push(`/dashboard/${user.role}/orders`);
          },
          onFailure: (error) => {
            toast({ variant: 'destructive', title: 'Payment Failed', description: error.reason || 'Please try again.' });
          }
        });

      } catch (err: any) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Error', description: err.message || 'Something went wrong.' });
      }
    });
  };


  const handleAddAddress = async (type: 'shipping' | 'billing', formData: any) => {
    const payload = {
      user_id: user!.id,
      street: formData.fullAddress,
      full_name: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      state: formData.state,
      country: 'India',
      postal_code: formData.pincode,
      is_default: false
    };

    const result = await createAddress(payload);
    if (result) {
      toast({ title: '✓ Address added successfully!' });
      await fetchAddressesData();

      //   if (type === 'shipping') {
      //     form.setValue('shippingAddressId', Sresult.id), { shouldValidate: true });
      //     setShowAddShipping(false);
      //   } else {
      //     form.setValue('billingAddressId', String(result.id), { shouldValidate: true });
      //     setShowAddBilling(false);
      //   }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add address' });
    }
  };

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await deleteAddress(Number(id));
    if (result.success) {
      toast({ title: '✓ Address deleted!' });
      await fetchAddressesData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleEditClick = (addr: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress(addr);
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
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong' });
    }
  };

  return (
    <>
      {/* Modals */}
      <AddressModal
        address={editingAddress}
        isOpen={!!editingAddress}
        onClose={() => setEditingAddress(null)}
        onSave={handleSaveEdit}
        indianStates={indianStates}
        mode="edit"
      />

      <AddressModal
        isOpen={showAddShipping}
        onClose={() => setShowAddShipping(false)}
        onSave={(data: any) => handleAddAddress('shipping', data)}
        indianStates={indianStates}
        mode="add"
      />

      <AddressModal
        isOpen={showAddBilling}
        onClose={() => setShowAddBilling(false)}
        onSave={(data: any) => handleAddAddress('billing', data)}
        indianStates={indianStates}
        mode="add"
      />

      {/* Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ========== SHIPPING ADDRESS ========== */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Shipping Address</h4>

            {/* Saved Addresses */}
            {addresses && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <FormField
                    key={`ship-${addr.id}`}
                    control={form.control}
                    name="shippingAddressId"
                    render={({ field }) => {
                      const isSelected = field.value === String(addr.id);
                      return (
                        <FormItem>
                          <FormControl>
                            <div
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative group ${isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                              <input
                                type="radio"
                                name="shippingAddress"
                                value={String(addr.id)}
                                checked={isSelected}
                                onChange={() => {
                                  field.onChange(String(addr.id));
                                  form.trigger('shippingAddressId');
                                }}
                                className="absolute opacity-0 w-full h-full cursor-pointer"
                              />

                              <div className="space-y-2 pointer-events-none">
                                <div>
                                  <p className="font-semibold text-gray-900">{addr.fullName}</p>
                                  <p className="text-sm text-gray-600">{form.getValues('customerEmail')}</p>
                                  <p className="text-sm text-gray-600">{form.getValues('customerPhone')}</p>
                                </div>

                                <div className="border-t border-gray-200 pt-2">
                                  <p className="text-sm text-gray-700 leading-relaxed">{addr.fullAddress}</p>
                                  <p className="text-sm text-gray-700">{addr.city}, {addr.state} - {addr.pincode}</p>
                                </div>
                              </div>

                              <div className="absolute top-4 right-4 pointer-events-none">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-400 bg-white'
                                  }`}>
                                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                              </div>

                              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={(e) => handleEditClick(addr, e)}
                                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-blue-600 shadow-sm"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteAddress(String(addr.id), e)}
                                  className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors text-red-600 shadow-sm"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddShipping(true)}
              className="w-full gap-2"
            >
              <Plus size={18} />
              Add New Address
            </Button>
          </div>

          {/* ========== BILLING ADDRESS ========== */}
          <div className="space-y-4">
            <FormField control={form.control} name="useShippingAsBilling" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base cursor-pointer">Use same address as shipping</FormLabel>
                  <p className="text-sm text-gray-600">Faster checkout</p>
                </div>
              </FormItem>
            )} />

            {!useShippingAsBilling && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Billing Address</h4>

                {addresses && addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <FormField
                        key={`bill-${addr.id}`}
                        control={form.control}
                        name="billingAddressId"
                        render={({ field }) => {
                          const isSelected = field.value === String(addr.id);
                          return (
                            <FormItem>
                              <FormControl>
                                <div
                                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative group ${isSelected
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    name="billingAddress"
                                    value={String(addr.id)}
                                    checked={isSelected}
                                    onChange={() => {
                                      field.onChange(String(addr.id));
                                      form.trigger('billingAddressId');
                                    }}
                                    className="absolute opacity-0 w-full h-full cursor-pointer"
                                  />

                                  <div className="space-y-2 pointer-events-none">
                                    <div>
                                      <p className="font-semibold text-gray-900">{addr.fullName}</p>
                                      <p className="text-sm text-gray-600">{form.getValues('customerEmail')}</p>
                                      <p className="text-sm text-gray-600">{form.getValues('customerPhone')}</p>
                                    </div>

                                    <div className="border-t border-gray-200 pt-2">
                                      <p className="text-sm text-gray-700 leading-relaxed">{addr.fullAddress}</p>
                                      <p className="text-sm text-gray-700">{addr.city}, {addr.state} - {addr.pincode}</p>
                                    </div>
                                  </div>

                                  <div className="absolute top-4 right-4 pointer-events-none">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                        ? 'border-green-500 bg-green-500'
                                        : 'border-gray-400 bg-white'
                                      }`}>
                                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                  </div>

                                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                    <button
                                      type="button"
                                      onClick={(e) => handleEditClick(addr, e)}
                                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-blue-600 shadow-sm"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteAddress(String(addr.id), e)}
                                      className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors text-red-600 shadow-sm"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddBilling(true)}
                  className="w-full gap-2"
                >
                  <Plus size={18} />
                  Add New Address
                </Button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={!isLoaded || isPending}>
            {isPending ? <Loader2 className="mr-2 animate-spin" /> : 'Proceed to Payment'}
          </Button>
        </form>
      </Form>
    </>
  );
}