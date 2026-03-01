
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Package, Check, X, Truck, Undo } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Price } from '../money/price';
import { cn } from '@/lib/utils';
import type { Return } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { listReturns } from '@/lib/repos/returns';

interface ReturnsTableProps {
  scope: 'admin' | 'ecom-admin';
  filters?: any;
}

const getStatusBadgeVariant = (status?: Return['status']) => {
  switch (status) {
    case 'Requested':
        return 'bg-yellow-100 text-yellow-800';
    case 'Approved':
    case 'Pickup Scheduled':
    case 'In Transit':
    case 'Received':
    case 'Inspected':
        return 'bg-blue-100 text-blue-800';
    case 'Refunded':
        return 'bg-green-100 text-green-800';
    case 'Rejected':
    case 'Closed':
        return 'bg-red-100 text-red-800';
    default:
        return 'secondary';
  }
};

const getSafeDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    if (typeof date === 'object' && date._seconds) {
        return new Date(date._seconds * 1000);
    }
    return null;
}

const ActionsMenu = ({ rma, scope, asSheetItems = false }: { rma: Return, scope: ReturnsTableProps['scope'], asSheetItems?: boolean }) => {
  const content = (
    <>
      <DropdownMenuItem><Package className="mr-2" />View Details</DropdownMenuItem>
      <DropdownMenuItem><Check className="mr-2" />Approve</DropdownMenuItem>
      <DropdownMenuItem><X className="mr-2" />Reject</DropdownMenuItem>
      <DropdownMenuItem><Truck className="mr-2" />Schedule Pickup</DropdownMenuItem>
      <DropdownMenuItem className="text-red-600 focus:text-red-700"><Undo className="mr-2" />Issue Refund</DropdownMenuItem>
    </>
  );

  if (asSheetItems) {
    return (
      <Sheet>
        <SheetTrigger asChild>
           <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Return #{rma.id}</SheetTitle>
            <SheetDescription>Select an action to perform for this return.</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-2">
             <Button variant="outline" className="w-full justify-start"><Package className="mr-2" />View Details</Button>
             <Button variant="outline" className="w-full justify-start"><Check className="mr-2" />Approve</Button>
             <Button variant="outline" className="w-full justify-start"><X className="mr-2" />Reject</Button>
             <Button variant="outline" className="w-full justify-start"><Truck className="mr-2" />Schedule Pickup</Button>
             <Button variant="destructive" className="w-full justify-start"><Undo className="mr-2" />Issue Refund</Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{content}</DropdownMenuContent>
    </DropdownMenu>
  );
};


const ReturnCard = ({ rma, scope }: { rma: Return, scope: ReturnsTableProps['scope'] }) => {
    const createdAt = getSafeDate(rma.createdAt);
    
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold">{rma.id}</p>
                        <p className="text-sm text-muted-foreground">{createdAt ? createdAt.toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <Badge className={cn(getStatusBadgeVariant(rma.status))} variant="secondary">{rma.status}</Badge>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                    <p><strong>Order:</strong> {rma.orderId}</p>
                    <p><strong>Customer:</strong> {rma.customerName}</p>
                    <p><strong>Location:</strong> {rma.cityState}</p>
                    <p><strong>Reason:</strong> {rma.reason}</p>
                    <p><strong>Amount:</strong> <Price amount={rma.totalRefundAmount} showDecimals /></p>
                </div>
                <div className="mt-4 flex justify-end">
                    <ActionsMenu rma={rma} scope={scope} asSheetItems />
                </div>
            </CardContent>
        </Card>
    );
}

export function ReturnsTable({ scope, filters = {} }: ReturnsTableProps) {
  const [returns, setReturns] = React.useState<Return[]>([]);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const fetchReturns = async () => {
        const data = await listReturns(filters);
        setReturns(data);
    };
    fetchReturns();
  }, [filters]);

  const filteredReturns = React.useMemo(() => {
    return returns;
  }, [returns, filters]);

  if (isMobile) {
      return (
          <div className="space-y-3">
              {filteredReturns.map(rma => <ReturnCard key={rma.id} rma={rma} scope={scope} />)}
          </div>
      )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"><Checkbox /></TableHead>
                <TableHead>RMA #</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refund Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.map((rma) => {
                 const createdAt = getSafeDate(rma.createdAt);
                return (
                <TableRow key={rma.id}>
                  <TableCell><Checkbox /></TableCell>
                  <TableCell className="font-mono text-xs">{rma.id}</TableCell>
                  <TableCell className="font-mono text-xs">{rma.orderId}</TableCell>
                  <TableCell>{createdAt ? createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="font-medium">{rma.customerName}</TableCell>
                  <TableCell className="text-center">{rma.items.length}</TableCell>
                  <TableCell>{rma.reason}</TableCell>
                  <TableCell><Badge className={cn(getStatusBadgeVariant(rma.status))} variant="secondary">{rma.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{rma.refundStatus}</Badge></TableCell>
                  <TableCell className="text-right"><Price amount={rma.totalRefundAmount} showDecimals /></TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu rma={rma} scope={scope} />
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
