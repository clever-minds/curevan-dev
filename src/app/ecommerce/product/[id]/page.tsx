
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Star, 
  ShoppingCart, 
  ChevronLeft, 
  ShieldCheck, 
  Truck, 
  Clock, 
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Info,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Price } from '@/components/money/price';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { fetchProductById, fetchPublicProducts } from '@/lib/repos/products';
import type { Product } from '@/lib/types';
import ProductCard from '@/components/product-card';
import ProductReviews from '@/components/product-reviews';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cart, addToCart, updateQuantity, setIsCartOpen } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isTherapist = user?.role === 'therapist';
  const cartItem = cart.find(item => Number(item.productId) === Number(id));
  const quantityInCart = cartItem?.quantity || 0;

  useEffect(() => {
    async function getProductData() {
      if (!id) return;
      setLoading(true);
      try {
        const productData = await fetchProductById(id as string);
        if (productData) {
          setProduct(productData);
          // Fetch related products
          const allProducts = await fetchPublicProducts();
          const related = allProducts
            .filter(p => p.categoryId === productData.categoryId && p.id !== productData.id)
            .slice(0, 4);
          setRelatedProducts(related);
        } else {
          toast({
            variant: 'destructive',
            title: "Product Not Found",
            description: "The product you're looking for does not exist.",
          });
          router.push('/ecommerce');
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    }
    getProductData();
  }, [id, router, toast]);

  const price = product?.price || 0;
  const therapistPrice = price * 0.90;

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      toast({
        variant: 'destructive',
        title: "Authentication Required",
        description: "Please sign in to add items to your cart.",
      });
      router.push('/auth/signin');
      return;
    }
    
    // If already in cart, just update quantity
    if (quantityInCart > 0) {
      const newQty = Math.min(quantityInCart + quantity, product.stock);
      updateQuantity(product.id, newQty);
    } else {
      addToCart(product, quantity);
    }

    toast({
      title: 'Added to Cart!',
      description: `${quantity} x ${product.name} has been added to your cart.`,
    });

    // Automatically open the cart sidebar for the user
    setTimeout(() => setIsCartOpen(true), 500);
  };

  const handleUpdateCartQuantity = (newQty: number) => {
    if (!product) return;
    updateQuantity(product.id, newQty);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-1/4" />
            <div className="space-y-4 pt-8">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-background min-h-screen">
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto py-4 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/ecommerce">Marketplace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/ecommerce?category=${product.categoryname.toLowerCase().replace(/ /g, '-')}`}>
                  {product.categoryname}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-primary">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <main className="container mx-auto py-8 md:py-16 px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          {/* Left Column: Image Gallery */}
          <div className="space-y-6">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white border shadow-sm group">
              <Image
                src={product.images && product.images[activeImageIndex] 
                  ? `${process.env.NEXT_PUBLIC_API_URL}${product.images[activeImageIndex]}` 
                  : product.featuredImage 
                    ? `${process.env.NEXT_PUBLIC_API_URL}${product.featuredImage}` 
                    : "/images/no-image.png"
                }
                alt={product.name}
                fill
                priority
                className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <Badge className="bg-primary/95 text-white backdrop-blur-md px-3 py-1 text-sm font-semibold">
                  {product.categoryname}
                </Badge>
                {product.stock <= 0 ? (
                  <Badge variant="destructive" className="px-3 py-1 text-sm bg-red-600">Out of Stock</Badge>
                ) : product.stock < 10 && (
                   <Badge variant="destructive" className="px-3 py-1 text-sm">
                    Only {product.stock} left
                   </Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}${img}`}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <Card className="border-none bg-muted/40 text-center p-4">
                <CardContent className="p-0 space-y-2">
                  <ShieldCheck className="w-8 h-8 mx-auto text-primary" />
                  <p className="text-xs font-bold uppercase tracking-wider">Quality Assured</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/40 text-center p-4">
                <CardContent className="p-0 space-y-2">
                  <Truck className="w-8 h-8 mx-auto text-primary" />
                  <p className="text-xs font-bold uppercase tracking-wider">India-wide Delivery</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/40 text-center p-4">
                <CardContent className="p-0 space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-primary" />
                  <p className="text-xs font-bold uppercase tracking-wider">Verified Listing</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="space-y-8 flex flex-col">
            <div className="space-y-4">
              {product.brand && (
                <p className="text-primary font-bold tracking-widest uppercase text-sm">{product.brand}</p>
              )}
              <h1 className="text-4xl md:text-5xl font-bold font-headline leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="font-bold text-lg">4.8</span>
                </div>
                <div className="h-4 w-[1px] bg-border" />
                <span className="text-muted-foreground font-medium underline cursor-pointer hover:text-primary transition-colors">150+ Reviews</span>
                <div className="h-4 w-[1px] bg-border" />
                <span className="text-muted-foreground font-medium">SKU: <span className="text-foreground">{product.sku}</span></span>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-muted/30 border space-y-6">
              <div className="space-y-2">
                {isTherapist ? (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-4">
                       <span className="text-4xl font-bold text-primary">
                        <Price amount={therapistPrice} showDecimals />
                      </span>
                      <span className="text-xl text-muted-foreground line-through decoration-destructive/50">
                        <Price amount={price} showDecimals />
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
                      <ShoppingCart className="w-4 h-4" />
                      10% Therapist Exclusive Discount Applied
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold">
                      <Price amount={price} showDecimals />
                    </span>
                    {product.mrp && product.mrp > price && (
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold">
                         SAVE {Math.round(((product.mrp - price) / product.mrp) * 100)}%
                       </Badge>
                    )}
                  </div>
                )}
                {product.mrp && <p className="text-sm text-muted-foreground">MRP: <Price amount={product.mrp} showDecimals /> <span className="italic">(Incl. of all taxes)</span></p>}
              </div>

              <div className="space-y-4">
                {quantityInCart > 0 ? (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-muted-foreground">Already in Cart</span>
                      <span className="text-primary font-bold">{quantityInCart} Units</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center border rounded-xl bg-muted/20">
                         <Button variant="ghost" size="icon" className="rounded-l-xl" onClick={() => handleUpdateCartQuantity(quantityInCart - 1)} disabled={quantityInCart <= 1}>
                           <Minus className="w-4 h-4" />
                         </Button>
                         <span className="w-12 text-center font-bold text-lg">{quantityInCart}</span>
                         <Button variant="ghost" size="icon" className="rounded-r-xl" onClick={() => handleUpdateCartQuantity(quantityInCart + 1)} disabled={quantityInCart >= product.stock}>
                           <Plus className="w-4 h-4" />
                         </Button>
                      </div>
                      <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsCartOpen(true)}>
                        View Cart
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex items-center border rounded-2xl bg-white h-14 overflow-hidden">
                       <Button variant="ghost" size="icon" className="h-full px-4 rounded-none border-r" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                        <Minus className="w-4 h-4" />
                       </Button>
                       <span className="w-14 text-center font-bold text-xl">{quantity}</span>
                       <Button variant="ghost" size="icon" className="h-full px-4 rounded-none border-l" onClick={() => setQuantity(q => q + 1)} disabled={product.stock > 0 && quantity >= product.stock}>
                        <Plus className="w-4 h-4" />
                       </Button>
                    </div>
                    <Button 
                      onClick={handleAddToCart} 
                      size="lg" 
                      className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={product.stock <= 0}
                    >
                      <ShoppingCart className="mr-3 w-6 h-6 text-white" />
                      {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className={`flex items-center gap-2 ${product.stock > 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {product.stock > 0 ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  <span>{product.stock > 0 ? 'In Stock (Ready to dispatch)' : 'Currently Unavailable'}</span>
                </div>
                <div className="h-4 w-[1px] bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Delivery in 3-5 days</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-4 p-4 rounded-2xl border bg-muted/20">
                    <Package className="w-10 h-10 text-primary shrink-0" />
                    <div>
                        <p className="font-bold text-sm uppercase text-muted-foreground">Manufacturer</p>
                        <p className="font-semibold">{product.manufacturer || 'Information not provided'}</p>
                    </div>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl border bg-muted/20">
                    <Info className="w-10 h-10 text-primary shrink-0" />
                    <div>
                        <p className="font-bold text-sm uppercase text-muted-foreground">Compliance</p>
                        <p className="font-semibold">HSN: {product.hsnCode}</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-20 lg:mt-32">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-8">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 h-auto text-lg font-bold"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="specifications" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 h-auto text-lg font-bold"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger 
                value="shipping" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 h-auto text-lg font-bold"
              >
                Shipping & Returns
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 h-auto text-lg font-bold"
              >
                Reviews ({product.rating || '4.8'})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-10 max-w-4xl">
              <div className="prose prose-slate max-w-none">
                <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                  {product.description}
                </p>
                <div className="text-lg leading-relaxed space-y-6">
                  {product.longDescription ? (
                    <div dangerouslySetInnerHTML={{ __html: product.longDescription }} />
                  ) : (
                    <p>No additional description available at this time. Please contact support if you need more technical information about this product.</p>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="specifications" className="pt-10">
              <div className="grid md:grid-cols-2 gap-4">
                 {[
                   { label: 'Brand', value: product.brand },
                   { label: 'Category', value: product.categoryname },
                   { label: 'SKU', value: product.sku },
                   { label: 'HSN Code', value: product.hsnCode },
                   { label: 'Manufacturer', value: product.manufacturer },
                   { label: 'Country of Origin', value: product.countryOfOrigin },
                   { label: 'Packer', value: product.packer },
                   { label: 'Importer', value: product.importer },
                   { label: 'Dimensions (LxWxH)', value: product.dimensions ? `${product.dimensions.lengthCm}x${product.dimensions.widthCm}x${product.dimensions.heightCm} cm` : null },
                   { label: 'Weight', value: product.dimensions ? `${product.dimensions.weightKg} kg` : null },
                   { label: 'Batch/Lot Number', value: product.batchNumber },
                   { label: 'Manufacturing Date', value: product.mfgDate },
                   { label: 'Expiry Date', value: product.expiryDate },
                 ].filter(spec => spec.value && spec.value !== '0' && spec.value !== '0.00').map((spec, i) => (
                   <div key={i} className="flex justify-between p-4 rounded-xl border bg-muted/10">
                     <span className="font-bold text-muted-foreground">{spec.label}</span>
                     <span className="font-semibold text-right">{spec.value}</span>
                   </div>
                 ))}
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="pt-10 max-w-2xl">
                <div className="space-y-6">
                    <div className="flex gap-4 p-6 rounded-2xl bg-muted/30 border">
                        <Truck className="w-8 h-8 text-primary shrink-0" />
                        <div className="space-y-1">
                            <p className="font-bold text-lg">Fast Delivery</p>
                            <p className="text-muted-foreground">Standard delivery within 3-5 business days across India. Express shipping options available at checkout.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 p-6 rounded-2xl bg-muted/30 border">
                        <RotateCcw className="w-8 h-8 text-primary shrink-0" />
                        <div className="space-y-1">
                            <p className="font-bold text-lg">Easy Returns</p>
                            <p className="text-muted-foreground">14-day hassle-free returns on most unopened items. Final sale items will be marked clearly on the listing.</p>
                        </div>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="reviews" className="pt-10">
              <div className="w-full">
                <ProductReviews productId={product.id} initialRating={product.rating} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-32">
            <div className="flex items-end justify-between mb-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-headline">You May Also Like</h2>
                <p className="text-muted-foreground text-lg">Explore more professional products in {product.categoryname}</p>
              </div>
              <Button variant="ghost" className="text-primary font-bold group" asChild>
                <a href={`/ecommerce?category=${product.categoryname.toLowerCase().replace(/ /g, '-')}`}>
                  View All Category <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
