
'use client';

import ProductCard from '@/components/product-card';
import { FilterSidebar } from '@/components/ecommerce/filter-sidebar';
import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import type { Product, ProductCategory } from '@/lib/types';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Coupon, Therapist } from '@/lib/types';
import { fetchPublicProducts, fetchPublicProductCategories } from '@/lib/repos/products';
import { getCoupons } from '@/lib/repos/coupons';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

function EcommerceContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    price: [0, 10000],
    rating: 0,
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const searchParams = useSearchParams();
  const { applyCoupon, appliedCoupon } = useCart();
  const [showRefBanner, setShowRefBanner] = useState(false);
  const { toast } = useToast();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchData = async () => {
        const [productsData, categoriesData, couponsData] = await Promise.all([
            fetchPublicProducts(),
            fetchPublicProductCategories(),
            getCoupons(),
        ]);
        setProducts(productsData);
        setProductCategories(categoriesData);
        setCoupons(couponsData);

        if (productsData.length > 0) {
            const prices = productsData.map(p => p.price);
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));
            setFilters(prev => ({
                ...prev,
                price: [min, max]
            }));
        }
    };
    fetchData();
  }, []);

  const { minPrice, maxPrice } = useMemo(() => {
    if (products.length === 0) return { minPrice: 0, maxPrice: 10000 };
    const prices = products.map(p => p.price);
    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  const handleApplyCoupon = useCallback((codeToApply: string) => {
    if (coupons.length === 0) {
        toast({
            variant: 'destructive',
            title: "Error",
            description: "Could not retrieve coupon data. Please try again later."
        });
        return;
    }
    const foundCoupon = coupons.find(c => c.code.toUpperCase() === codeToApply.toUpperCase() && c.active);
    if (foundCoupon) {
        applyCoupon(foundCoupon);
        setShowRefBanner(true);
    }
  }, [coupons, applyCoupon, toast]);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && !appliedCoupon) {
      handleApplyCoupon(refCode);
    }
  }, [searchParams, appliedCoupon, handleApplyCoupon]);

  const filteredProducts = useMemo(() => {

    return products.filter(product => {

      const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.category === 'all' || product.categoryId.toString().toLowerCase().replace(/ /g, '-') === filters.category;
      const matchesPrice = product.price >= filters.price[0] && product.price <= filters.price[1];
      //const matchesRating = product.rating >= filters.rating;

      return matchesSearch && matchesCategory && matchesPrice ;
    });

  }, [filters, products]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const handleShowMore = () => {
    setVisibleCount(prevCount => prevCount + PAGE_SIZE);
  };
  
  const currentProducts = filteredProducts.slice(0, visibleCount);
                console.log("Filtering products:", currentProducts, "with filters:", filters);

  return (
    <div className="flex">
       <aside className="w-80 hidden lg:flex flex-col sticky top-[var(--header-height)] h-[calc(100vh-var(--header-height))]">
          <ScrollArea className="flex-1">
            <div className="p-8">
              <FilterSidebar 
                categories={productCategories} 
                filters={filters} 
                setFilters={setFilters} 
                minPrice={minPrice}
                maxPrice={maxPrice}
              />
            </div>
          </ScrollArea>
       </aside>
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto py-8 md:py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
                Medical Device Marketplace
                </h1>
                <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
                Browse our curated selection of professional-grade medical devices and wellness supplies to support your health journey.
                </p>
                 <Alert className="mt-6 max-w-2xl mx-auto text-left">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Have a therapist code?</AlertTitle>
                    <AlertDescription>You can apply it in your cart to get a discount on eligible products!</AlertDescription>
                 </Alert>
            </div>
            
            <Card className="lg:hidden mb-4">
                <CardContent className="p-2">
                   <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <SlidersHorizontal className="mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0 flex flex-col">
                        <ScrollArea className="flex-1">
                            <div className="p-8">
                               <FilterSidebar 
                                    categories={productCategories} 
                                    filters={filters} 
                                    setFilters={setFilters} 
                                    minPrice={minPrice}
                                    maxPrice={maxPrice}
                                    isMobile={true}
                                    closeSheet={() => setIsSheetOpen(false)}
                                />
                            </div>
                        </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </CardContent>
            </Card>

            {currentProducts.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {currentProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                    ))}
                </div>
                {visibleCount < filteredProducts.length && (
                  <div className="mt-12 text-center">
                    <Button onClick={handleShowMore} size="lg">
                      Show More Products
                    </Button>
                  </div>
                )}
              </>
            ) : (
                <div className="text-center py-16">
                    <h3 className="text-2xl font-semibold">No Products Found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your filters to find what you're looking for.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default function EcommercePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EcommerceContent />
        </Suspense>
    );
}
