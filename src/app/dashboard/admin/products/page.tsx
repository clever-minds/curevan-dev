
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
import { MoreVertical, PlusCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryManager from "./categories/page";
import { FilterBar } from "@/components/admin/FilterBar";
import { useEffect, useState, useMemo } from "react";
import type { Product, Inventory } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Price } from "@/components/money/price";
import { listProducts } from "@/lib/repos/products";
import { deleteProduct } from "@/lib/api/products";
import { listInventory } from "@/lib/repos/inventory";
import { downloadCsv } from "@/lib/utils";
import type { MediaItem, MediaFile } from "@/types/media";

export const dynamic = 'force-dynamic';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const [productsData, inventoryData] = await Promise.all([
          listProducts(),
          listInventory()
        ]);

        setProducts(productsData);
        setInventory(inventoryData);
        setLoading(false);
    };
    fetchData();
  }, []);
  const handleDelete = async (id: number) => {
      if (!confirm("Are you sure you want to delete this product?")) return;

      deleteProduct(id).then(() => {
          setProducts(products.filter(p => p.id !== id));
      }).catch((error) => {
          alert("Failed to delete product: " + error.message);
      });
    };

  const productInventory = useMemo(() => {
    const inventoryMap = new Map(inventory.map(item => [item.productId, item]));
    return products.map(product => {
      const inv = inventoryMap.get(product.id.toString());
      console.log("inventoryMap",inventoryMap);
      return {
        ...product,
        onHand: inv?.onHand ?? product.stock,
        reserved: inv?.reserved ?? 0,
        available: (inv?.onHand ?? product.stock) - (inv?.reserved ?? 0),
      };
    });
  }, [products, inventory]);

  const filteredProducts = useMemo(() => {
    const { search, categories, brand, stockStatus }: any = filters;

    return productInventory.filter(p => {
    console.log("featuredpro",p);

        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !categories || categories.length === 0 || categories.includes(p.categoryId);
        const matchesBrand = !brand || p.brand?.toLowerCase().includes(brand.toLowerCase());
        
        let matchesStock = true;
        if (stockStatus === 'in_stock') matchesStock = p.available > 0;
        if (stockStatus === 'low_stock') matchesStock = p.available <= p.reorderPoint && p.available > 0;
        if (stockStatus === 'out_of_stock') matchesStock = p.available <= 0;

        return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    })
  }, [productInventory, filters])

  const handleExport = () => {
    const headers = [
        "ID", "Name", "SKU", "Category ID", "Brand", "Price", "MRP",
        "On Hand Stock", "Reserved Stock", "Available Stock", "Reorder Point", 
        "Active", "Coupon Excluded",
        "HSN Code", "Manufacturer", "Country of Origin", "Packer", "Importer",
        "Batch Number", "MFG Date", "Expiry Date",
        "Short Description", "Long Description"
    ];
    
    const data = productInventory.map(p => [
        p.id,
        p.name,
        p.sku,
        p.categoryId,
        p.brand || '',
        p.price,
        p.mrp || p.price,
        p.onHand,
        p.reserved,
        p.available,
        p.reorderPoint,
        p.isActive ? 'Yes' : 'No',
        p.isCouponExcluded ? 'Yes' : 'No',
        p.hsnCode || '',
        p.manufacturer || '',
        p.countryOfOrigin || '',
        p.packer || '',
        p.importer || '',
        p.batchNumber || '',
        p.mfgDate || '',
        p.expiryDate || '',
        p.description,
        p.longDescription || ''
    ]);

    downloadCsv(headers, data, 'curevan-product-master.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Store</h1>
              <p className="text-muted-foreground">Manage your products and categories.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><FileDown className="mr-2" /> Export Products</Button>
            <Button asChild>
              <Link href="/dashboard/admin/products/new">
                  <PlusCircle className="mr-2" />
                  Add New Product
              </Link>
            </Button>
          </div>
      </div>

      <FilterBar 
          onFilterChange={setFilters} 
          showSearch 
          showEcomFilters 
      />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">All Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>A list of all products in your store.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-center">On Hand</TableHead>
                      <TableHead className="text-center">Reserved</TableHead>
                      <TableHead className="text-center">Available</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7}>
                                <Skeleton className="w-full h-24" />
                            </TableCell>
                        </TableRow>
                    ) : filteredProducts.map((product) => {
                       const isLowStock = product.available <= product.reorderPoint;
                       return (
                        <TableRow key={product.id} className={isLowStock ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                            <TableCell className="font-medium flex items-center gap-3">
                                <Image src={product.featuredImage ? `${process.env.NEXT_PUBLIC_API_URL}${product.featuredImage}` : "/images/no-image.png"} alt={product.name} width={40} height={40} className="rounded-md object-cover" data-ai-hint={product.categoryId} />
                                {product.name}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{product.categoryId}</Badge>
                            </TableCell>
                            <TableCell><Price amount={product.price} showDecimals /></TableCell>
                            <TableCell className="text-center">{product.onHand}</TableCell>
                            <TableCell className="text-center">{product.reserved}</TableCell>
                            <TableCell className="text-center font-bold">
                                {isLowStock ? <Badge variant="destructive">{product.available}</Badge> : product.available}
                            </TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                   <Link href={`/dashboard/admin/products/${product.id}/edit`}>
                                      Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem> 
                                  <Link href={`/products/${product.id}`}>
                                    View on Store
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive"  onClick={() => handleDelete(product.id)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                       )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
