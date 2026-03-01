
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FilterBar } from "@/components/admin/FilterBar";
import { CouponsTable } from "@/components/admin/CouponsTable";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateMissingTherapistCodes } from "@/lib/actions";
import type { Coupon } from "@/lib/types";
import { listCoupons } from "@/lib/repos/coupons";

import { getSafeDate, downloadCsv } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default function AdminCouponsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [couponList, setCouponList] = useState<Coupon[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    const fetchCoupons = async () => {
        const data = await listCoupons();
        setCouponList(data);
    };
    fetchCoupons();
  }, []);

  const handleGenerateCodes = async () => {
    setIsGenerating(true);
    try {
      const newCoupons = await generateMissingTherapistCodes();
      if (newCoupons && newCoupons.length > 0) {
        // This state update is for UI reflection.
        // In a real app with a DB, you'd likely refetch the list.
        const formattedNewCoupons = newCoupons.map(c => ({...c, status: 'Active', usageLimit: null}))
       // setCouponList(prev => [...prev, ...formattedNewCoupons]);
        toast({
          title: "Codes Generated!",
          description: `Successfully generated ${newCoupons.length} new referral codes for therapists.`,
        });
      } else {
         toast({
          title: "No new codes needed",
          description: `All active, public therapists already have referral codes.`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: "Generation Failed",
        description: "An error occurred while generating codes.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    const headers = [
      "ID", "Code", "Therapist ID", "Discount Type", "Value", 
      "Permanent", "Active", "Status", "Usage Limit", "Created At"
    ];
    const data = couponList.map(coupon => [
        coupon.id,
        coupon.code,
        coupon.therapistId || '',
        coupon.discountType,
        coupon.value,
        coupon.permanent ? 'Yes' : 'No',
        coupon.active ? 'Yes' : 'No',
        coupon.status || '',
        coupon.usageLimit || 'N/A',
        getSafeDate(coupon.createdAt)?.toISOString() || ''
    ]);
    downloadCsv(headers, data, 'coupons-export.csv');
  };


  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Coupons</h1>
            <p className="text-muted-foreground">Create and manage discount and referral codes.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleGenerateCodes} disabled={isGenerating}>
              {isGenerating && <Loader2 className="mr-2 animate-spin" />}
              Generate Missing Therapist Codes
            </Button>
             <Button variant="outline" onClick={handleExport}>
              <FileDown className="mr-2" />
              Export All
            </Button>
            <Button asChild>
                <Link href="/dashboard/admin/coupons/new">
                    <PlusCircle className="mr-2" />
                    Create Coupon
                </Link>
            </Button>
        </div>
      </div>
      
       <FilterBar
            showDatePicker={true}
            showSearch={true}
            showEcomFilters={true}
        />
        
      <CouponsTable scope="admin" coupons={couponList} setCoupons={setCouponList} />
    </div>
  );
}
