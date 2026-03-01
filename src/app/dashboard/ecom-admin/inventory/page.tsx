
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/admin/FilterBar";
import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { FileDown, Upload } from "lucide-react";
import type { Product, Inventory } from '@/lib/types';
import { listProducts } from "@/lib/repos/products";
import { downloadCsv } from "@/lib/utils";

export default function EcomAdminInventoryPage() {
    const [filters, setFilters] = useState({});
    const [products, setProducts] = useState<Product[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            const productData = await listProducts();
            setProducts(productData);
        };
        fetchData();
    }, []);

    const inventory = useMemo(() => products.map(p => ({
        ...p,
        sku: p.sku || `${p.id}-M`, // mock sku
        onHand: p.stock,
        reserved: Math.floor(Math.random() * 10),
        reorderPoint: p.reorderPoint,
        updatedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 5).toISOString(),
    })), [products]);
    
    const handleExport = () => {
        const headers = [
            "SKU", "Product Name", "Category ID", "On-Hand", "Reserved", "Available",
            "Reorder Point", "Last Updated", "Price", "MRP", "Brand",
            "Manufacturer", "Country of Origin", "Batch Number", "MFG Date", "Expiry Date",
        ];

        const data = inventory.map(item => [
            item.sku,
            item.name,
            item.categoryId,
            item.onHand,
            item.reserved,
            item.onHand - item.reserved,
            item.reorderPoint,
            new Date(item.updatedAt).toISOString(),
            item.price,
            item.mrp,
            item.brand || '',
            item.manufacturer || '',
            item.countryOfOrigin || '',
            item.batchNumber || '',
            item.mfgDate || '',
            item.expiryDate || '',
        ]);
        
        downloadCsv(headers, data, 'inventory-report.csv');
    }


    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Inventory Management</h1>
            <p className="text-muted-foreground">Monitor and manage stock levels for all products.</p>
        </div>

        <div className="flex justify-end gap-2">
            <Button variant="outline"><Upload className="mr-2" /> Import CSV</Button>
            <Button onClick={handleExport}><FileDown className="mr-2" /> Export CSV</Button>
        </div>

        <FilterBar showSearch showEcomFilters />
        
        <Card>
            <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
                <CardDescription>An overview of your product inventory.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">On-Hand</TableHead>
                            <TableHead className="text-center">Reserved</TableHead>
                            <TableHead className="text-center">Available</TableHead>
                            <TableHead className="text-center">Reorder Point</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.map((item) => {
                            const available = item.onHand - item.reserved;
                            const isLowStock = available <= (item.reorderPoint || 0);
                            return (
                                <TableRow key={item.id} className={isLowStock ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Image src={item.featuredImage} alt={item.name} width={40} height={40} className="rounded-md" />
                                        {item.name}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                                    <TableCell><Badge variant="outline">{item.categoryId}</Badge></TableCell>
                                    <TableCell className="text-center">{item.onHand}</TableCell>
                                    <TableCell className="text-center">{item.reserved}</TableCell>
                                    <TableCell className="text-center font-bold">
                                         {isLowStock ? <Badge variant="destructive">{available}</Badge> : available}
                                    </TableCell>
                                    <TableCell className="text-center">{item.reorderPoint}</TableCell>
                                    <TableCell>{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">Adjust Stock</Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </div>
    );
}
