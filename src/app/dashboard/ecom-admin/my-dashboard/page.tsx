
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ReportAiSummary from "@/components/report/report-ai-summary";
import { DollarSign, ShoppingBag, RotateCcw, Package, Percent, Truck, FileDown, Printer, AlertTriangle, TrendingUp, HandCoins, CheckCircle, Hourglass } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Price } from "@/components/money/price";
import { FilterBar } from "@/components/admin/FilterBar";
import type { ProductCategory, Order, Product } from '@/lib/types';
import { listProductCategories, listProducts } from "@/lib/repos/products";
import { listOrders } from "@/lib/repos/orders";
import { getSafeDate } from "@/lib/utils";

const KpiCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
    <Card className="avoid-break">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{typeof value === 'number' ? <Price amount={value} /> : value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const ActionableTable = ({ title, headers, children, action }: { title: string, headers: string[], children: React.ReactNode, action?: React.ReactNode }) => (
    <Card className="avoid-break">
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {action}
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow>{headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{children}</TableBody>
            </Table>
        </CardContent>
    </Card>
);


export default function EcomAdminDashboardPage() {
    const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [categoriesData, ordersData, productsData] = await Promise.all([
                listProductCategories(),
                listOrders(),
                listProducts(),
            ]);
            setProductCategories(categoriesData);
            setRecentOrders(ordersData.slice(0,5));
            setProducts(productsData);
            setOrders(ordersData);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    const lowStockData = useMemo(() => {
        return products.filter(p => p.stock < p.reorderPoint).map(p => ({
             sku: p.sku || `${p.id}-M`, product: p.name, stock: p.stock, sold30d: Math.floor(Math.random() * 50) + 10, daysCover: Math.floor(p.stock / ((Math.floor(Math.random() * 50) + 10) / 30))
        }))
    }, [products]);

    const revenueRefundsData = useMemo(() => {
        const dataMap = new Map<string, { revenue: number, refunds: number, time: number }>();
        orders.forEach(order => {
            const dateObj = getSafeDate(order.createdAt);
            if(!dateObj) return;
            const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!dataMap.has(dateLabel)) {
                // Ensure we have a timestamp for sorting
                const dateAtMidnight = new Date(dateObj);
                dateAtMidnight.setHours(0,0,0,0);
                dataMap.set(dateLabel, { revenue: 0, refunds: 0, time: dateAtMidnight.getTime() });
            }
            const entry = dataMap.get(dateLabel)!;
            // Removed / 100 as backend 'total' is already in Rupees
            if (order.status !== 'Refunded') {
                entry.revenue += (order.total || 0);
            } else {
                entry.refunds += (order.total || 0);
            }
        });
      
        
        
        // Convert to array and sort chronologically by the 'time' property
        return Array.from(dataMap.entries())
            .map(([date, values]) => ({ date, ...values }))
            .sort((a, b) => a.time - b.time);
    }, [orders]);

    const ordersByStatusData = useMemo(() => {
        const counts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([status, count]) => ({ status, count }));
    }, [orders]);

    const topCategoriesData = useMemo(() => {
        const categoryMap = new Map<string, number>();
        orders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.sku?.toLowerCase() === item.sku?.toLowerCase());
                if (product) {
                    // Use product.categoryname (mapped in repository) or fallback to ID lookup
                    const categoryName = product.categoryname || productCategories.find(c => String(c.id) === String(product.categoryId))?.name || 'Unknown';
                    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + (item.price * item.qty));
                }
            });
        });
        return Array.from(categoryMap.entries())
            .map(([categoryName, revenue]) => ({ categoryName, revenue }))
            .sort((a,b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [orders, products, productCategories]);

    const kpis = useMemo(() => {
        const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
        const gmv = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = orders.length;
        const aov = totalOrders > 0 ? gmv / totalOrders : 0;
        const refunds = orders.filter(o => o.status === 'Refunded').length;
        const refundRate = totalOrders > 0 ? (refunds / totalOrders) * 100 : 0;
        const onTime = orders.filter(o => o.status === 'Delivered').length; // Mock
        const onTimeRate = totalOrders > 0 ? (onTime / totalOrders) * 100 : 0;
console.log("gmv",gmv);
console.log("totalOrders",totalOrders);
console.log("aov",aov);
console.log("refundRate",refundRate.toFixed(1) + '%');
console.log("onTimeRate",onTimeRate.toFixed(1) + '%');
        return { gmv, totalOrders, aov, refundRate: refundRate.toFixed(1) + '%', onTimeRate: onTimeRate.toFixed(1) + '%' };
        
    }, [orders]);

    return (
        <div className="space-y-8">
            <div className="no-print space-y-4">
                 <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-headline">E-commerce Admin • My Dashboard</h1>
                        <p className="text-muted-foreground">An overview of your store's performance and operations.</p>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2"/> Print</Button>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button><FileDown className="mr-2"/> Export CSV</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Orders</DropdownMenuItem>
                                <DropdownMenuItem>Returns</DropdownMenuItem>
                                <DropdownMenuItem>Shipments</DropdownMenuItem>
                                <DropdownMenuItem>Low-stock SKUs</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                 <FilterBar
                    showDatePicker={true}
                    showLocationFilters={true}
                    showSearch={true}
                    showEcomFilters={true}
                 />
            </div>

            <section id="report" className="print-area space-y-8">
                <div className="print-only hidden text-center mb-8">
                    <h1 className="text-3xl font-bold">E-commerce Summary</h1>
                    <p className="text-muted-foreground">For period: Last 90 Days</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    <KpiCard title="GMV Paid" value={kpis.gmv} icon={DollarSign} />
                    <KpiCard title="Orders Placed" value={kpis.totalOrders} icon={ShoppingBag} />
                    <KpiCard title="Avg. Order Value" value={kpis.aov} icon={TrendingUp} />
                    <KpiCard title="Refund Rate" value={kpis.refundRate} icon={RotateCcw} />
                    <KpiCard title="On-time Delivery" value={kpis.onTimeRate} icon={Truck} />
                </div>
                
                 <ReportAiSummary 
                    summaryText={[
                        "Revenue is up 15% WoW, driven by strong sales in the 'Physiotherapy' category.",
                        "Coupon 'SAVE10' has high usage but low AOV; consider making it product-specific.",
                        "Several SKUs for 'Resistance Bands' are nearing their reorder point. Plan procurement."
                    ]}
                    regenerate={() => console.log('regenerate')}
                    copy={() => console.log('copy')}
                />
                
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Revenue vs Refunds (90d)" type="line" data={revenueRefundsData} categoryKey="date" valueKey="revenue" loading={loading}/>
                    <DashboardCard title="Orders by Status (90d)" type="pie" data={ordersByStatusData} categoryKey="status" valueKey="count" loading={loading} />
                    <DashboardCard title="Top 10 Categories by Revenue (90d)" type="bar" data={topCategoriesData} categoryKey="categoryName" valueKey="revenue" loading={loading} />
                </div>

                 <ActionableTable title="Recent Orders" headers={['Order #', 'Date', 'Customer', 'Items', 'Amount', 'Status', 'Actions']}>
                     {recentOrders.map(order => {
                        const createdAt = getSafeDate(order.createdAt);
                        return (
                            <TableRow key={order.id}>
                                <TableCell>{order.id}</TableCell>
                                <TableCell>{createdAt ? createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell>{order.customerName}</TableCell>
                                <TableCell>{order.items.length}</TableCell>
                                <TableCell><Price amount={(order.total || 0)} showDecimals /></TableCell>
                                <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                                <TableCell><Button variant="outline" size="sm">View Order</Button></TableCell>
                            </TableRow>
                        )
                     })}
                </ActionableTable>
                 <ActionableTable title="Low-Stock SKUs" headers={['SKU', 'Product', 'Stock', 'Sold (30d)', 'Days Left', 'Actions']}>
                    {lowStockData.map(item => (
                        <TableRow key={item.sku}>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell>{item.product}</TableCell>
                            <TableCell><Badge variant="destructive">{item.stock}</Badge></TableCell>
                            <TableCell>{item.sold30d}</TableCell>
                            <TableCell>{item.daysCover}</TableCell>
                            <TableCell><Button variant="outline" size="sm">View Product</Button></TableCell>
                        </TableRow>
                    ))}
                </ActionableTable>
            </section>
        </div>
    );
}
