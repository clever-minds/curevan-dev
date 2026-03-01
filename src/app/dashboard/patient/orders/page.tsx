
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, FileDown, Star, Undo, Truck, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/admin/FilterBar';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn, getSafeDate, downloadCsv } from '@/lib/utils';
import Link from 'next/link';
import type { Order } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Price } from '@/components/money/price';
import { SupportFeedbackForm } from '@/components/support-feedback-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { listOrders } from '@/lib/repos/orders';

export const dynamic = 'force-dynamic';

export default function PatientOrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            const data = await listOrders({ userId: user.uid });
            setOrders(data);
        };
        fetchData();
    }, [user]);
    
    const handleExport = () => {
        const headers = [
            "Order ID", "Date", "Items Count", "Subtotal", "Discount", "Total",
            "Status", "Payment Status", "Delivered At", "Coupon Code"
        ];
        
        const data = orders.map(order => [
            order.id,
            getSafeDate(order.createdAt)?.toISOString() || '',
            order.items.length,
            (order.subtotal || 0) / 100,
            (order.couponDiscount || 0) / 100,
            (order.total || 0) / 100,
            order.status,
            order.paymentStatus,
            getSafeDate(order.deliveredAt)?.toISOString() || '',
            order.couponCode || '',
        ]);
        
        downloadCsv(headers, data, 'my-orders-export.csv');
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">My Orders</h1>
                    <p className="text-muted-foreground">Track your product purchases from the Curevan Shop.</p>
                </div>
                 <Button variant="outline" onClick={handleExport}><FileDown className="mr-2"/> Export Orders</Button>
            </div>

            <FilterBar showDatePicker showSearch showEcomFilters />
            
            <OrdersTable scope="patient" filters={{ userId: user?.uid }} />
        </div>
    );
}
