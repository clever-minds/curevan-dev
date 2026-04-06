
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Package, Receipt, Truck, Undo, Ban, Info, Printer, Star, FileText, Loader2, FileDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Price } from '../money/price';
import { cn, downloadCsv } from '@/lib/utils';
import type { Order } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { SupportFeedbackForm } from '../support-feedback-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { addDays, isBefore } from 'date-fns';
import Link from 'next/link';
import { listOrders, cancelOrder } from '@/lib/repos/orders';
import { createShipment } from '@/lib/actions/shipment';
import { requestReturnAction, initiateRefundAction, listReturnsAction } from '@/lib/actions';

const isAddressComplete = (address: any) => {
  if (!address) return false;
  const required = ['line1', 'city', 'state', 'pin'];
  return required.every(field => address[field] && address[field].toString().trim() !== '');
};

interface OrdersTableProps {
  scope: 'admin' | 'ecom-admin' | 'patient';
  filters?: any;
}

const getStatusBadgeVariant = (status?: Order['status']) => {
  switch (status) {
    case 'Paid':
    case 'Packed':
      return 'bg-blue-100 text-blue-800';
    case 'Shipped':
    case 'Delivered':
      return 'bg-green-100 text-green-800';
    case 'Placed':
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Returned':
      return 'bg-orange-100 text-orange-800';
    case 'Cancelled':
    case 'Refunded':
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

const ActionsMenu = ({ order, scope, onRefresh, asSheetItems = false, existingReturns = [] }: { order: Order, scope: OrdersTableProps['scope'], onRefresh?: () => void, asSheetItems?: boolean, existingReturns?: any[] }) => {
  const { toast } = useToast();
  const isAdmin = scope === 'admin' || scope === 'ecom-admin';
  const isPatient = scope === 'patient';
  const hasInvoice = (order.paymentStatus === 'Paid' || order.status === 'Paid' || order.status === 'Packed' || order.status === 'Shipped' || order.status === 'Delivered');
  const invoiceLink = `/dashboard/invoices?id=${order.invoiceId || order.id}`;
  const [isCreatingShipment, setIsCreatingShipment] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isReturning, setIsReturning] = React.useState(false);
  const [isRefunded, setIsRefunded] = React.useState(false);
  const [showReturnDialog, setShowReturnDialog] = React.useState(false);
  const [isReturnedLocally, setIsReturnedLocally] = React.useState(false);
  const [returnReason, setReturnReason] = React.useState('');

  const addressIncomplete = !isAddressComplete(order.shippingAddress);

  const handleCancelOrder = async () => {
    if (!confirm(`Are you sure you want to cancel order #${order.id}?`)) return;
    setIsCancelling(true);
    const result = await cancelOrder(order.id);
    if (result.success) {
      toast({ title: 'Order Cancelled', description: `Order #${order.id} has been cancelled successfully.` });
      if (onRefresh) onRefresh();
      else window.location.reload();
    } else {
      toast({ variant: 'destructive', title: 'Cancellation Failed', description: result.message || 'Could not cancel order.' });
    }
    setIsCancelling(false);
  }

  const handleCreateShipment = async () => {
    setIsCreatingShipment(true);
    const result = await createShipment(order.id);
    if (result.success) {
      toast({ title: 'Shipment Created', description: `Shipment for order ${order.id} has been created with AWB ${result.shipment?.awb}.` });
      // Here you would typically refetch the orders or update the specific order's state.
      // For now, the user can refresh to see the change.
    } else {
      toast({ variant: 'destructive', title: 'Shipment Failed', description: result.error });
    }
    setIsCreatingShipment(false);
  }

  const handleReturnOrder = async () => {
    if (!returnReason.trim()) {
      toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for the return.' });
      return;
    }
    setIsReturning(true);
    const result = await requestReturnAction(order.id, { reason: returnReason });
    if (result.success) {
      toast({ title: 'Return Requested', description: result.message || `Your return request for order #${order.id} has been submitted.` });
      setShowReturnDialog(false);
      setIsReturnedLocally(true);
      setReturnReason('');
      if (onRefresh) onRefresh();
    } else {
      toast({ variant: 'destructive', title: 'Return Failed', description: result.message || 'Could not submit return request.' });
    }
    setIsReturning(false);
  };

  const handleInitiateRefund = async () => {
    const amount = prompt(`Enter refund amount for order #${order.id}:`, (order.total).toString());
    if (!amount) return;
    const reason = prompt(`Enter reason for refund:`, "Admin initiated refund");
    
    setIsRefunded(true);
    const result = await initiateRefundAction({ orderId: order.id, amount: parseFloat(amount), reason: reason || undefined });
    if (result.success) {
      toast({ title: 'Refund Initiated', description: result.message || `Refund for order #${order.id} has been processed.` });
      if (onRefresh) onRefresh();
    } else {
      toast({ variant: 'destructive', title: 'Refund Failed', description: result.message || 'Could not process refund.' });
    }
    setIsRefunded(false);
  };

  const isCancellable = () => {
    // Admins can cancel anytime, patients only if Placed/Paid/Pending
    if (isAdmin) return true;
    return order.status === 'Placed' || order.status === 'Paid' || order.status === 'Pending';
  };

  const isReturnable = () => {
    // Hide button if already Returned/Refunded/Cancelled or if it's not Delivered
    if (order.status !== 'Delivered') return false;

    // Check if a return already exists for this order (either locally or on the server)
    if (isReturnedLocally) return false;
    const hasExistingReturn = (existingReturns || []).some(r => r.orderId.toString() === order.id.toString());
    if (hasExistingReturn) return false;

    // If deliveredAt exists, enforce the 10-day window.
    // Otherwise, allow return since the order is marked as Delivered.
    if (!order.deliveredAt) return true;

    const deliveredAtDate = getSafeDate(order.deliveredAt);
    if (!deliveredAtDate) return true;

    const returnDeadline = addDays(deliveredAtDate, 10);
    return isBefore(new Date(), returnDeadline);
  };

  const content = (
    <>
      {hasInvoice && (
        <DropdownMenuItem asChild>
          <Link href={invoiceLink} className="flex items-center w-full">
            <FileText className="mr-2 h-4 w-4" />
            View Invoice
          </Link>
        </DropdownMenuItem>
      )}

      {isCancellable() && order.status !== 'Cancelled' && order.status !== 'Refunded' && (
        <DropdownMenuItem
          onClick={handleCancelOrder}
          disabled={isCancelling}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
          Cancel Order
        </DropdownMenuItem>
      )}

      {(order.status === 'Shipped' || order.status === 'Delivered') && (
        <DropdownMenuItem><Truck className="mr-2 h-4 w-4" />Track Shipment</DropdownMenuItem>
      )}

      {isPatient && order.status === 'Delivered' && (
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              <Star className="mr-2 h-4 w-4" />Leave Feedback
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave Feedback</DialogTitle>
              <DialogDescription>How was your experience with the products in order #{order.id}?</DialogDescription>
            </DialogHeader>
            <SupportFeedbackForm formType="feedback" feedbackTopic="product" feedbackItemId={order.id.toString()} />
          </DialogContent>
        </Dialog>
      )}

      {isPatient && isReturnable() && (
        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogTrigger asChild>
            <DropdownMenuItem 
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer"
            >
              <Undo className="mr-2 h-4 w-4" />
              Return/Replace Items
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return/Replace Items</DialogTitle>
              <DialogDescription>
                Please provide a reason for returning or replacing items in order #{order.id}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="return-reason">Reason for Return</Label>
                <Textarea 
                  id="return-reason" 
                  placeholder="Tell us why you want to return these items..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleReturnOrder} 
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={isReturning || !returnReason.trim()}
              >
                {isReturning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Return Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer"><Info className="mr-2 h-4 w-4" />View Order Details</DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer"><Printer className="mr-2 h-4 w-4" />Print Packing Slip</DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCreateShipment}
            disabled={order.status === 'Shipped' || order.status === 'Delivered' || isCreatingShipment || addressIncomplete}
            className="cursor-pointer"
          >
            {isCreatingShipment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
            {addressIncomplete ? "Create Shipment (Fix Address First)" : "Create Shipment"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleInitiateRefund}
            disabled={isRefunded}
            className="text-red-600 focus:text-red-700 cursor-pointer"
          >
            {isRefunded ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo className="mr-2 h-4 w-4" />}
            Refund
          </DropdownMenuItem>
        </>
      )}
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
            <SheetTitle>Order #{order.id}</SheetTitle>
            <SheetDescription>Select an action to perform for this order.</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-2">
            {hasInvoice && <Button variant="outline" className="w-full justify-start" asChild><Link href={invoiceLink}><FileText className="mr-2" />View Invoice</Link></Button>}
            {isAdmin && <Button variant="outline" className="w-full justify-start" onClick={handleCreateShipment}><Truck className="mr-2" />Create Shipment</Button>}
            {isPatient && isReturnable() && (
              <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Undo className="mr-2" />
                    Return/Replace
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Return/Replace Items</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for returning or replacing items in order #{order.id}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="return-reason-mobile">Reason for Return</Label>
                      <Textarea 
                        id="return-reason-mobile" 
                        placeholder="Tell us why you want to return these items..."
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
                    <Button 
                      onClick={handleReturnOrder} 
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                      disabled={isReturning || !returnReason.trim()}
                    >
                      {isReturning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Return Request
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {isCancellable() && order.status !== 'Cancelled' && order.status !== 'Refunded' && (
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="mr-2 animate-spin" /> : <Ban className="mr-2" />}
                Cancel Order
              </Button>
            )}
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


const OrderCard = ({ order, scope, existingReturns = [] }: { order: Order, scope: OrdersTableProps['scope'], existingReturns?: any[] }) => {
  const createdAt = getSafeDate(order.createdAt);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold">#{order.id}</p>
            <p className="text-sm text-muted-foreground">{createdAt ? createdAt.toLocaleDateString() : 'N/A'}</p>
          </div>
          <Badge className={cn(getStatusBadgeVariant(order.status))} variant="secondary">{order.status}</Badge>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          {scope !== 'patient' && <p><strong>Customer:</strong> {order.customerName}</p>}
          <p><strong>Items:</strong> {order.items?.length || 0}</p>
          <p><strong>Amount:</strong> <Price amount={order.total} showDecimals={false} /></p>
          {scope !== 'patient' && <p><strong>Location:</strong> {order.shippingAddress?.city || '-'}</p>}
          <p><strong>Coupon:</strong> {order.couponCode || 'N/A'}</p>
        </div>
        <div className="mt-4 flex justify-end">
          <ActionsMenu order={order} scope={scope} onRefresh={() => window.location.reload()} asSheetItems existingReturns={existingReturns} />
        </div>
      </CardContent>
    </Card>
  );
}


export function OrdersTable({ scope, filters = {} }: OrdersTableProps) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [returns, setReturns] = React.useState<any[]>([]);
  const isMobile = useIsMobile();
  const [loading, setLoading] = React.useState(true);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    const [ordersData, returnsData] = await Promise.all([
      listOrders(filters),
      scope === 'patient' && filters.userId ? listReturnsAction({ userId: filters.userId }) : Promise.resolve([])
    ]);

    if (ordersData) setOrders(ordersData);
    if (returnsData) setReturns(returnsData);

    setLoading(false);
  }, [filters, scope]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExport = async () => {
    const allOrders = await listOrders(); // Fetch all orders for export
    const headers = [
      "Order ID", "User ID", "Created At", "Customer Name", "Customer Phone",
      "Subtotal (Paise)", "Coupon Discount (Paise)", "Total (Paise)",
      "Taxable Value (Paise)", "CGST (Paise)", "SGST (Paise)", "IGST (Paise)", "Total Tax (Paise)",
      "Status", "Payment Status", "Payment Txn ID",
      "Coupon Code", "Referred Therapist ID", "Commission Amount (Paise)", "Commission State",
      "Shipping Address", "Billing Address", "Delivered At"
    ];
    if (!allOrders) return;
    const data = allOrders.map(o => [
      o.id, o.userId, getSafeDate(o.createdAt)?.toISOString(), o.customerName, o.customerPhone,
      o.subtotal, o.couponDiscount, o.total,
      o.taxableValue, o.cgst, o.sgst, o.igst, o.totalTax,
      o.status, o.paymentStatus, o.paymentTxnId,
      o.couponCode, o.referredTherapistId, o.commissionAmount, o.commissionState,
      o.shippingAddress ? `${o.shippingAddress?.line1 || ''}, ${o.shippingAddress?.city || ''}, ${o.shippingAddress?.state || ''} ${o.shippingAddress?.pin || ''}` : '-',
      o.billingAddress ? `${o.billingAddress?.line1 || ''}, ${o.billingAddress?.city || ''}, ${o.billingAddress?.state || ''} ${o.billingAddress?.pin || ''}` : '-',
getSafeDate(o.deliveredAt)?.toISOString()
    ]);
    downloadCsv(headers, data, 'all-orders-export.csv');
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {(orders || []).map(order => <OrderCard key={order.id} order={order} scope={scope} existingReturns={returns} />)}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>All Orders</CardTitle>
          {(scope === 'admin' || scope === 'ecom-admin') && (
            <Button variant="outline" onClick={handleExport}>
              <FileDown className="mr-2" /> Export All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {scope !== 'patient' && <TableHead className="w-[50px]"><Checkbox /></TableHead>}
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                {scope !== 'patient' && <TableHead>Customer</TableHead>}
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Coupon</TableHead>
                {scope !== 'patient' && <TableHead>Location</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orders || []).map((order) => {
                const createdAt = getSafeDate(order.createdAt);
                return (
                  <TableRow key={order.id}>
                    {scope !== 'patient' && <TableCell><Checkbox /></TableCell>}
                    <TableCell className="font-mono text-xs">{order.number} </TableCell>
                    <TableCell>{createdAt ? createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                    {scope !== 'patient' && <TableCell className="font-medium">{order.customerName}</TableCell>}
                    <TableCell className="text-center">{order.items?.length || 0}</TableCell>
                    <TableCell className="text-right"><Price amount={order.total} showDecimals={false} /></TableCell>
                    <TableCell><Badge variant="secondary">{order.paymentStatus}</Badge></TableCell>
                    <TableCell><Badge className={cn(getStatusBadgeVariant(order.status))} variant="secondary">{order.status}</Badge></TableCell>
                    <TableCell>{order.couponCode ? <Badge variant="outline">{order.couponCode}</Badge> : '-'}</TableCell>
                    {scope !== 'patient' && (
                       <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{order.shippingAddress?.city || '-'}</span>
                            {!isAddressComplete(order.shippingAddress) && (
                              <Badge variant="destructive" className="text-[10px] py-0 h-4 w-fit">Incomplete</Badge>
                            )}
                          </div>
                       </TableCell>
                    )}
                    <TableCell className="text-right">
                      <ActionsMenu order={order} scope={scope} onRefresh={fetchOrders} existingReturns={returns} />
                    </TableCell>
                  </TableRow>
                )
              })}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={scope === 'patient' ? 7 : 10} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

