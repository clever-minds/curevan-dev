
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';
import { getIndianStates, getRoles } from '@/lib/repos/meta';
import { getTherapyCategories } from '@/lib/repos/categories';
import { listProductCategories } from '@/lib/repos/products';
import { Label } from '../ui/label';
import { listTherapists } from '@/lib/repos/therapists';
import type { Therapist } from '@/lib/types';

interface FilterBarProps {
  showDatePicker?: boolean;
  showLocationFilters?: boolean;
  showSearch?: boolean;
  showTherapyFilters?: boolean;
  showEcomFilters?: boolean;
  showAdminUserFilters?: boolean;
  showAppointmentFilters?: boolean;
  showSupportTicketFilters?: boolean; // New prop
  onFilterChange?: (filters: any) => void;
}

const defaultFilters = {
    search: '',
    dateRange: undefined,
    state: '',
    city: '',
    serviceTypes: [],
    therapists: [],
    mode: '',
    paymentStatus: '',
    pcrStatus: '',
    therapistId: '',
    categories: [],
    coupons: [],
    orderStatus: '',
    roles: [],
    accountStatus: '',
    specialty: [],
    availability: 'any',
    plan: 'any',
    sort: 'distance',
    gender: 'any',
    experience_years: 0,
    language: 'any',
    brand: '',
    stockStatus: 'all',
    payoutStatus: '',
    supportTopic: '',
    supportStatus: '',
};

export function FilterBar({
  showDatePicker,
  showLocationFilters,
  showSearch,
  showTherapyFilters,
  showEcomFilters,
  showAdminUserFilters,
  showAppointmentFilters,
  showSupportTicketFilters, // New prop
  onFilterChange
}: FilterBarProps) {
  const [filters, setFilters] = React.useState(defaultFilters);
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [meta, setMeta] = React.useState({
      indianStates: [],
      therapyCategories: [],
      productCategories: [],
      roles: [],
      therapists: [],
  });

  React.useEffect(() => {
    const fetchData = async () => {
        const [states, therapyCats, productCats, roles, therapists] = await Promise.all([
            getIndianStates(),
            getTherapyCategories(),
            listProductCategories(),
            getRoles(),
            listTherapists()
        ]);
        setMeta({ indianStates: states, therapyCategories: therapyCats, productCategories: productCats, roles, therapists } as any);
    };
    fetchData();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };
  
  const handleApplyFilters = React.useCallback(() => {
      if (onFilterChange) {
        onFilterChange(filters);
      }
      if(isMobile) {
        setIsSheetOpen(false);
      }
  }, [filters, onFilterChange, isMobile]);

  React.useEffect(() => {
    if (!isMobile) {
      const handler = setTimeout(() => {
          handleApplyFilters();
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [filters, isMobile, handleApplyFilters]);
  
  const resetFilters = () => {
    setFilters(defaultFilters);
    if (onFilterChange) {
        onFilterChange(defaultFilters);
    }
     if(isMobile) {
        setIsSheetOpen(false);
      }
  }

  const FilterContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
        {showSearch && (
            <div className="space-y-1">
                <Label>Search</Label>
                <Input 
                    placeholder="Search by name, ID..." 
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                />
            </div>
        )}
        {showDatePicker && (
             <div className="space-y-1">
                <Label>Date Range</Label>
                <DateRangePicker />
            </div>
        )}
        {showLocationFilters && (
            <div className="space-y-1">
                <Label>Location</Label>
                 <Input 
                    placeholder="City, State, or Pincode..."
                />
            </div>
        )}
        {showTherapyFilters && (
             <div className="space-y-1">
                <Label>Specialty</Label>
                <MultiSelect options={meta.therapyCategories.map(c => ({label: c, value: c}))} selected={filters.specialty} onChange={(v) => handleFilterChange('specialty', v)} placeholder="All Specialties" />
            </div>
        )}
        {showAppointmentFilters && (
            <>
                <div className="space-y-1">
                    <Label>Therapist</Label>
                    <Select onValueChange={(v) => handleFilterChange('therapistId', v)} value={filters.therapistId}>
                        <SelectTrigger><SelectValue placeholder="All Therapists" /></SelectTrigger>
                        <SelectContent>
                            {meta.therapists.map((therapist: Therapist) => <SelectItem key={therapist.id} value={therapist.id.toString()}>{therapist.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label>Session Mode</Label>
                    <Select onValueChange={(v) => handleFilterChange('mode', v)} value={filters.mode}>
                        <SelectTrigger><SelectValue placeholder="All Modes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="clinic">Clinic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label>Payment Status</Label>
                    <Select onValueChange={(v) => handleFilterChange('paymentStatus', v)} value={filters.paymentStatus}>
                        <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Refunded">Refunded</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label>PCR Status</Label>
                    <Select onValueChange={(v) => handleFilterChange('pcrStatus', v)} value={filters.pcrStatus}>
                        <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="locked">Locked</SelectItem>
                            <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label>Payout Status</Label>
                    <Select onValueChange={(v) => handleFilterChange('payoutStatus', v)} value={filters.payoutStatus}>
                        <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="onHold">On Hold</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </>
        )}
        {showEcomFilters && (
            <>
                <div className="space-y-1">
                    <Label>Product Category</Label>
                    <Select onValueChange={(v) => handleFilterChange('categories', [v])} value={filters.categories[0] || ''}>
                        <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                        <SelectContent>
                            {meta.productCategories.map((cat:any) => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label>Stock Status</Label>
                    <Select onValueChange={(v) => handleFilterChange('stockStatus', v)} value={filters.stockStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="in_stock">In Stock</SelectItem>
                            <SelectItem value="low_stock">Low Stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </>
        )}
        {showAdminUserFilters && (
             <div className="space-y-1">
                <Label>User Role</Label>
                <MultiSelect options={meta.roles.map(r => ({label: r, value: r}))} selected={filters.roles} onChange={(v) => handleFilterChange('roles', v)} placeholder="All Roles" />
            </div>
        )}
         {showSupportTicketFilters && (
            <>
                <div className="space-y-1">
                    <Label>Topic</Label>
                    <Select onValueChange={(v) => handleFilterChange('supportTopic', v)} value={filters.supportTopic}>
                        <SelectTrigger><SelectValue placeholder="All Topics" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="booking">Booking</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="order">Order</SelectItem>
                            <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>Status</Label>
                    <Select onValueChange={(v) => handleFilterChange('supportStatus', v)} value={filters.supportStatus}>
                        <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </>
        )}
    </div>
  );

  if (isMobile) {
    return (
        <Card className="no-print">
            <CardContent className="p-2">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                            <SlidersHorizontal className="mr-2" />
                            Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] flex flex-col">
                        <SheetHeader>
                            <SheetTitle>Filter Data</SheetTitle>
                            <SheetDescription>Refine the results to find exactly what you're looking for.</SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto pr-4 -mr-6 py-4">
                            <div className="space-y-4">
                                {FilterContent}
                            </div>
                        </div>
                        <div className="flex justify-between gap-2 border-t pt-4">
                            <Button variant="ghost" onClick={resetFilters}><Trash2 className="mr-2"/>Reset</Button>
                            <Button onClick={handleApplyFilters}>Apply Filters</Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="no-print">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4 justify-between">
            <div className="flex-grow">
                {FilterContent }
            </div>
            <div className="flex-shrink-0">
                 <Button variant="ghost" onClick={resetFilters} className="shrink-0"><Trash2 className="mr-2"/>Reset All</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
