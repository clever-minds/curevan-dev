'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Edit,
  Trash2,
  BarChart
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Price } from '../money/price';
import { cn } from '@/lib/utils';
import type { Coupon } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { deleteCoupon } from "@/lib/repos/coupons";
import { useRouter } from "next/navigation";

interface CouponsTableProps {
  scope: 'admin' | 'ecom-admin' | 'therapy-admin';
  coupons: Coupon[];
  filters?: any;
  setCoupons?: React.Dispatch<React.SetStateAction<Coupon[]>>;
}

/* ---------------------------------- utils --------------------------------- */

const getStatusBadgeVariant = (status?: Coupon['status']) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'Expired':
      return 'bg-gray-100 text-gray-800';
    case 'Scheduled':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'secondary';
  }
};

/* ------------------------------- ActionsMenu ------------------------------- */

const ActionsMenu = ({
  coupon,
  scope,
  asSheetItems = false,
  setCoupons,
}: {
  coupon: Coupon;
  scope: CouponsTableProps['scope'];
  asSheetItems?: boolean;
  setCoupons?: CouponsTableProps['setCoupons'];
}) => {
  const isTherapyAdmin = scope === 'therapy-admin';
  const { toast } = useToast();
  const router = useRouter();
  const handleEdit = () => {
    router.push(`/dashboard/admin/coupons/${coupon.id}/edit`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coupon? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await deleteCoupon(coupon.id);
      if (res.success) {
        toast({
          title: "Coupon Deleted",
          description: res.message,
        });
        setCoupons?.(prev => prev.filter(c => c.id !== coupon.id));
      }
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err?.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  /* ---------------------------- Mobile Sheet UI ---------------------------- */

  if (asSheetItems) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Coupon: {coupon.code}</SheetTitle>
            <SheetDescription>
              Select an action to perform
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <BarChart className="mr-2" /> View Redemptions
            </Button>

            {!isTherapyAdmin && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleEdit}
                >
                  <Edit className="mr-2" /> Edit
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  {coupon.status === 'Active'
                    ? <><Pause className="mr-2" /> Pause</>
                    : <><Play className="mr-2" /> Activate</>}
                </Button>

                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2" /> Delete
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  /* --------------------------- Desktop Dropdown UI -------------------------- */

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <BarChart className="mr-2" /> View Redemptions
        </DropdownMenuItem>

        {!isTherapyAdmin && (
          <>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2" /> Edit
            </DropdownMenuItem>

            {coupon.status === 'Active' && (
              <DropdownMenuItem>
                <Pause className="mr-2" /> Pause
              </DropdownMenuItem>
            )}

            {coupon.status === 'Paused' && (
              <DropdownMenuItem>
                <Play className="mr-2" /> Activate
              </DropdownMenuItem>
            )}

            <DropdownMenuItem>
              <Copy className="mr-2" /> Duplicate
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/* -------------------------------- CouponCard ------------------------------- */

const CouponCard = ({
  coupon,
  scope,
  setCoupons,
}: {
  coupon: Coupon;
  scope: CouponsTableProps['scope'];
  setCoupons?: CouponsTableProps['setCoupons'];
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold font-mono text-lg">{coupon.code}</p>
          <p className="text-sm text-muted-foreground">
            {coupon.discountType === 'percent'
              ? `${coupon.value * 100}% off`
              : <Price amount={coupon.value} showDecimals />}
          </p>
        </div>
        <Badge className={cn(getStatusBadgeVariant(coupon.status))}>
          {coupon.status}
        </Badge>
      </div>

      <div className="mt-4 text-sm space-y-1">
        <p><strong>Scope:</strong> Global</p>
        <p><strong>Owner:</strong> {coupon.therapistId ? 'Therapist' : 'Platform'}</p>
        <p><strong>Usage:</strong> 15 / {coupon.usageLimit || '∞'}</p>
      </div>

      <div className="mt-4 flex justify-end">
        <ActionsMenu
          coupon={coupon}
          scope={scope}
          asSheetItems
          setCoupons={setCoupons}
        />
      </div>
    </CardContent>
  </Card>
);

/* ------------------------------ CouponsTable ------------------------------- */

export function CouponsTable({
  scope,
  coupons,
  filters = {},
  setCoupons,
}: CouponsTableProps) {
  const isMobile = useIsMobile();

  const filteredCoupons = React.useMemo(() => coupons, [coupons, filters]);

  if (isMobile) {
    return (
      <div className="space-y-3">
        {filteredCoupons.map(coupon => (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            scope={scope}
            setCoupons={setCoupons}
          />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox /></TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredCoupons.map(coupon => (
              <TableRow key={coupon.id}>
                <TableCell><Checkbox /></TableCell>
                <TableCell className="font-mono font-bold">
                  {coupon.code}
                </TableCell>
                <TableCell className="capitalize">
                  {coupon.discountType}
                </TableCell>
                <TableCell>
                  {coupon.discountType === 'percent'
                    ? `${coupon.value * 100}%`
                    : <Price amount={coupon.value} showDecimals />}
                </TableCell>
                <TableCell>
                  {coupon.therapistId ? 'Therapist' : 'Platform'}
                </TableCell>
                <TableCell>
                  15 / {coupon.usageLimit || '∞'}
                </TableCell>
                <TableCell>
                  <Badge className={cn(getStatusBadgeVariant(coupon.status))}>
                    {coupon.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ActionsMenu
                    coupon={coupon}
                    scope={scope}
                    setCoupons={setCoupons}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
