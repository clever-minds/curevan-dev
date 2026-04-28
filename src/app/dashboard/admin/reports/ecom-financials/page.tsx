
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/admin/FilterBar";
import { Price } from "@/components/money/price";
import { useState, useEffect, useMemo } from "react";
import type { Order } from "@/lib/types";
import { listOrders } from "@/lib/repos/orders";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown } from "lucide-react";
import { getSafeDate, downloadCsv } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default function EcomFinancialsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const ordersData = await listOrders(filters);
            setOrders(ordersData);
            setLoading(false);
        }
        fetchData();
    }, [filters]);

    const handleExport = async () => {
        const allOrders = await listOrders(); // Fetch all for a full export
        const headers = [
            "Order ID", "User ID", "Date", "Customer Name", "Customer Phone",
            "Subtotal (Paise)", "Coupon Code", "Coupon Discount (Paise)", "Taxable Value (Paise)",
            "CGST (Paise)", "SGST (Paise)", "IGST (Paise)", "Total Tax (Paise)", "Total (Paise)",
            "Payment Status", "Payment Txn ID", "Shipping Charges (Paise)",
            "Status", "Referred Therapist ID", "Commission Amount (Paise)", "Commission State",

            "Shipping Address Line 1", "Shipping Address City", "Shipping Address State", "Shipping Address Pin",
            "Billing Address Line 1", "Billing Address City", "Billing Address State", "Billing Address Pin",
            "Delivered At"
        ];
        
        const data = allOrders.map(order => [
            order.id,
            order.userId,
            getSafeDate(order.createdAt)?.toISOString() || '',
            order.customerName,
            order.customerPhone || '',
            order.subtotal || 0,
            order.couponCode || '',
            order.couponDiscount || 0,
            order.taxableValue || 0,
            order.cgst || 0,
            order.sgst || 0,
            order.igst || 0,
            order.totalTax || 0,
            order.total || 0,
            order.paymentStatus,
            order.paymentTxnId || '',
            order.shippingCharges || 0,
            order.status,
            order.referredTherapistId || '',
            order.commissionAmount || 0,
            order.commissionState || '',

            order.shippingAddress?.line1 || '',
            order.shippingAddress?.city || '',
            order.shippingAddress?.state || '',
            order.shippingAddress?.pin || '',
            order.billingAddress?.line1 || '',
            order.billingAddress?.city || '',
            order.billingAddress?.state || '',
            order.billingAddress?.pin || '',
            getSafeDate(order.deliveredAt)?.toISOString() || ''
        ]);

        downloadCsv(headers, data, 'ecom-financial-report.csv');
    }

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">E-commerce Financial Report</h1>
            <p className="text-muted-foreground">Detailed breakdown of all product sales for tax and accounting purposes.</p>
        </div>

        <FilterBar 
            showDatePicker 
            showSearch 
            showEcomFilters 
            onFilterChange={setFilters}
        />
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Sales Ledger</CardTitle>
                        <CardDescription>A summary of all e-commerce sales transactions.</CardDescription>
                    </div>
                     <Button onClick={handleExport}><FileDown className="mr-2"/>Export Detailed CSV</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Sales Price</TableHead>
                                <TableHead className="text-right">Discount</TableHead>
                                <TableHead className="text-right">Taxable</TableHead>
                                <TableHead className="text-right">CGST</TableHead>
                                <TableHead className="text-right">SGST</TableHead>
                                <TableHead className="text-right">IGST</TableHead>
                                <TableHead className="text-right">Shipping</TableHead>
                                <TableHead className="text-right">Total</TableHead>

                                <TableHead>Payment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                             <TableRow><TableCell colSpan={10}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
                        ) : orders.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.number}</TableCell>
                                <TableCell>{item.customerName}</TableCell>
                                <TableCell className="text-right"><Price amount={item.subtotal} showDecimals /></TableCell>
                                <TableCell className="text-right text-destructive">-<Price amount={(item.couponDiscount || 0) } showDecimals /></TableCell>
                                <TableCell className="text-right"><Price amount={(item.taxableValue || 0) } showDecimals /></TableCell>
                                <TableCell className="text-right"><Price amount={(item.cgst || 0) } showDecimals /></TableCell>
                                <TableCell className="text-right"><Price amount={(item.sgst || 0) } showDecimals /></TableCell>
                                <TableCell className="text-right"><Price amount={(item.igst || 0) } showDecimals /></TableCell>
                                <TableCell className="text-right font-medium text-muted-foreground"><Price amount={(item.shippingCharges || 0) } showDecimals /></TableCell>
                                <TableCell className="text-right font-bold"><Price amount={item.total } showDecimals /></TableCell>

                                <TableCell><Badge variant="secondary">{item.paymentStatus}</Badge></TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
        </div>
    );
}
