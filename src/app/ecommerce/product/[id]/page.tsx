'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Star, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck, 
  Truck, 
  Clock, 
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Info,
  RotateCcw,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel';
import { Price } from '@/components/money/price';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { fetchProductById, fetchPublicProducts, fetchRecommendedProducts } from '@/lib/repos/products';
import { fetchProductReviews } from '@/lib/repos/reviews';

import { estimateShipping, ShippingEstimate } from '@/lib/repos/shipment';
import { calculateProductPrice, Offer } from '@/lib/pricing';
import type { Product, Review } from '@/lib/types';
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
  const [reviews, setReviews] = useState<Review[]>([]);

  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviewCount, setReviewCount] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [lensStyle, setLensStyle] = useState<React.CSSProperties>({});
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [pincode, setPincode] = useState('');
  const [shippingEstimate, setShippingEstimate] = useState<ShippingEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);

  const isTherapist = user?.role === 'therapist';
  const cartItem = cart.find(item => Number(item.productId) === Number(id));
  const quantityInCart = cartItem?.quantity || 0;

  useEffect(() => {
    async function getProductData() {
      if (!id) return;
      setLoading(true);
      try {
        const [productData, reviewsData] = await Promise.all([
          fetchProductById(id as string),
          fetchProductReviews(id as string)
        ]);

        if (productData) {
          setProduct(productData);
          setReviews(reviewsData);
          
          if (productData.variants && productData.variants.length > 0) {
            setSelectedAttributes(productData.variants[0].attributes || {});
          }
          
          // Fetch related products
          const allCategoryProducts = await fetchPublicProducts({ category_id: productData.categoryId });
          setRelatedProducts(allCategoryProducts.filter(p => p.id !== productData.id).slice(0, 4));
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

  const isVideo = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  const getImageUrl = (path: string) => {
    if (!path) return "/images/no-image.png";
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  const baseOriginalPrice = product?.price || 0;
  const pricing = product ? calculateProductPrice(product, [], null) : null;
  
  const availableOptions = useMemo(() => {
    if (!product?.variants) return {};
    const options: Record<string, Set<string>> = {};
    product.variants.forEach((variant: any) => {
      Object.entries(variant.attributes || {}).forEach(([key, value]) => {
        if (!options[key]) options[key] = new Set();
        options[key].add(value as string);
      });
    });
    const result: Record<string, string[]> = {};
    Object.entries(options).forEach(([key, set]) => {
      result[key] = Array.from(set);
    });
    return result;
  }, [product?.variants]);

  useEffect(() => {
    if (product?.variants && Object.keys(selectedAttributes).length > 0) {
      const matched = product.variants.find((v: any) => {
        return Object.entries(v.attributes).every(([k, val]) => selectedAttributes[k] === val);
      });
      setSelectedVariant(matched || null);
      
      if (matched?.imageUrl && product.images) {
        let idx = product.images.findIndex((img: string) => img === matched.imageUrl);
        if (idx === -1) {
          product.images.unshift(matched.imageUrl);
          idx = 0;
          carouselApi?.reInit();
        }
        carouselApi?.scrollTo(idx);
        setActiveImageIndex(idx);
      }
    } else {
      setSelectedVariant(null);
    }
  }, [selectedAttributes, product?.variants, carouselApi, product]);

  // Calculate final displayed price (Variant overrides main price)
  const originalPrice = selectedVariant ? Number(selectedVariant.mrp || selectedVariant.selling_price || selectedVariant.sellingPrice || baseOriginalPrice) : baseOriginalPrice;
  const basePrice = selectedVariant ? Number(selectedVariant.selling_price || selectedVariant.sellingPrice || selectedVariant.mrp || originalPrice) : (pricing?.finalPrice ?? originalPrice);
  const displayPrice = basePrice;
  const therapistPrice = displayPrice * 0.90;
  const displayStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : product?.rating ? Number(product.rating).toFixed(1) : '0.0';

  const scrollToReviews = () => {
    const element = document.getElementById('product-reviews');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.on('select', () => {
      setActiveImageIndex(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handleThumbnailClick = (idx: number) => {
    setActiveImageIndex(idx);
    carouselApi?.scrollTo(idx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    
    // Calculate cursor position relative to image
    let x = e.pageX - left - window.scrollX;
    let y = e.pageY - top - window.scrollY;

    // Lens size (percentage of main image)
    const lensWidth = 200; 
    const lensHeight = 200;

    // Constrain lens within image bounds
    if (x < lensWidth / 2) x = lensWidth / 2;
    if (x > width - lensWidth / 2) x = width - lensWidth / 2;
    if (y < lensHeight / 2) y = lensHeight / 2;
    if (y > height - lensHeight / 2) y = height - lensHeight / 2;

    const xPercent = (x / width) * 100;
    const yPercent = (y / height) * 100;

    setZoomPos({ x: xPercent, y: yPercent });
    
    setLensStyle({
      left: `${x - lensWidth / 2}px`,
      top: `${y - lensHeight / 2}px`,
      width: `${lensWidth}px`,
      height: `${lensHeight}px`,
    });

    setZoomStyle({
      backgroundPosition: `${xPercent}% ${yPercent}%`,
      backgroundSize: `${width * 2.5}px ${height * 2.5}px` // 2.5x zoom
    });
  };

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

    // Require variant selection if product has variants
    if (product.variants?.length > 0 && !selectedVariant) {
      toast({
        variant: 'destructive',
        title: "Please Select Options",
        description: "You must select product variants (like Size/Color) before adding to cart.",
      });
      return;
    }
    
    addToCart(product, quantity, selectedVariant?.id, selectedAttributes);

    toast({
      title: 'Added to Cart!',
      description: `${quantity} x ${product.name} ${selectedVariant ? '(Variant selected)' : ''} has been added to your cart.`,
    });

    // Automatically open the cart sidebar for the user
    setTimeout(() => setIsCartOpen(true), 500);
  };

  useEffect(() => {
    if (product?.id) {
      fetchProductReviews(product.id).then(reviews => {
        setReviewCount(reviews.length);
      });
    }
  }, [product?.id]);

  const handleUpdateCartQuantity = (newQty: number) => {
    if (!product) return;
    updateQuantity(product.id, newQty);
  };

  const handleCheckShipping = async () => {
    if (!pincode || pincode.length !== 6) {
      toast({
        variant: 'destructive',
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode.",
      });
      return;
    }

    setEstimating(true);
    try {
      const weight = product?.dimensions?.weightKg || 0.5;
      const res = await estimateShipping(pincode, weight);
      if (res) {
        setShippingEstimate(res);
        toast({
          title: "Shipping Estimated",
          description: `Shipping to ${pincode} will cost ₹${res.rate}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: "Shipping Unavailable",
          description: "We couldn't estimate shipping for this pincode.",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setEstimating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-1/4" />
            </div>
          </div>
        </div>
    );
  }

  if (!product) return null;

  return (
    <div className="bg-background min-h-screen w-full">
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30 overflow-x-auto scrollbar-hide py-2 sm:py-4 w-full">
        <div className="px-4 w-max min-w-full md:container md:mx-auto">
          <Breadcrumb className="text-[10px] sm:text-sm">
            <BreadcrumbList className="flex-nowrap whitespace-nowrap">
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink href="/ecommerce">Marketplace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink href={`/ecommerce?category=${product.categoryname.toLowerCase().replace(/ /g, '-')}`}>
                  {product.categoryname}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="min-w-0 shrink-0">
                <BreadcrumbPage className="font-semibold text-primary truncate max-w-[150px] sm:max-w-none">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <main className="container mx-auto py-8 md:py-16 px-4 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start w-full">
          
          {/* Mobile Title & Rating (Visible only on mobile, placed above the gallery) */}
          <div className="md:hidden space-y-3 w-full">
            {product.brand && (
              <p className="text-primary font-bold tracking-widest uppercase text-xs">{product.brand}</p>
            )}
            <h1 className="text-2xl font-bold font-headline leading-tight break-words">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 cursor-pointer" onClick={scrollToReviews}>
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                <span className="font-bold text-sm">{averageRating}</span>
              </div>
              <div className="h-3 w-[1px] bg-border" />
              <span className="text-muted-foreground text-sm underline cursor-pointer" onClick={scrollToReviews}>{reviews.length} Reviews</span>
            </div>
          </div>

          {/* Mobile Image Gallery (Carousel) */}
          <div className="md:hidden w-full relative">
            <Carousel setApi={setCarouselApi} className="w-full">
              <CarouselContent>
                {product.images?.map((img, idx) => (
                  <CarouselItem key={idx} className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border flex items-center justify-center">
                    {isVideo(img) ? (
                      <video src={getImageUrl(img)} className="w-full h-full object-contain p-2" controls autoPlay muted loop />
                    ) : (
                      <Image src={getImageUrl(img)} alt={product.name} fill className="object-contain p-4" unoptimized />
                    )}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {/* Mobile Pagination Dots */}
            {product.images && product.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {product.images.map((_, idx) => (
                  <div key={idx} className={`w-2 h-2 rounded-full transition-all ${activeImageIndex === idx ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Left Column: Amazon-Style Image Gallery (Desktop only) */}
          <div className="hidden md:flex flex-col gap-8 lg:gap-12 lg:sticky lg:top-28 w-full">
            
            {/* Gallery Wrapper (Thumbnails + Main Image) */}
            <div className="flex flex-col-reverse md:flex-row gap-4 lg:gap-6 items-start w-full">
            
            {/* Vertical Thumbnails (Desktop) / Horizontal (Mobile) */}
            {product.images && product.images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[450px] scrollbar-hide w-full md:w-24 shrink-0 px-1 py-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleThumbnailClick(idx)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white ${
                      activeImageIndex === idx ? 'border-primary shadow-lg scale-95' : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    {isVideo(img) ? (
                      <div className="w-full h-full bg-black/5 flex items-center justify-center relative">
                        <video src={getImageUrl(img)} className="w-full h-full object-cover opacity-60" />
                        <Play className="w-4 h-4 text-primary absolute" />
                      </div>
                    ) : (
                      <Image
                        src={getImageUrl(img)}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        fill
                        className="object-contain p-1"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Main Image with Amazon-Style Lens Magnifier */}
            <div className="w-full md:flex-1 shrink-0 relative rounded-3xl bg-white border shadow-sm group overflow-hidden aspect-square sm:h-[400px] md:h-[450px] flex items-center justify-center">
              <div 
                className="relative w-full h-full overflow-hidden cursor-crosshair flex items-center justify-center bg-white"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setShowMagnifier(true)}
                onMouseLeave={() => setShowMagnifier(false)}
              >
                {isVideo(product.images?.[activeImageIndex] || '') ? (
                  <video
                    key={`video-${activeImageIndex}`}
                    src={getImageUrl(product.images?.[activeImageIndex] || '')}
                    className="w-full h-full object-contain p-4"
                    controls
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <>
                    <Image
                      key={`img-${activeImageIndex}`}
                      src={getImageUrl(product.images?.[activeImageIndex] || product.featuredImage)}
                      alt={product.name}
                      fill
                      priority
                      unoptimized
                      className="object-contain animate-in fade-in duration-700"
                    />
                    
                    {/* Amazon Lens */}
                    {showMagnifier && (
                      <div 
                        className="absolute border border-primary/30 bg-primary/5 pointer-events-none z-20 shadow-inner"
                        style={lensStyle}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Navigation Arrows (Reliable Slider Experience) */}
              {product.images && product.images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md shadow-md border-primary/10 hover:bg-white z-30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : product.images.length - 1))}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md shadow-md border-primary/10 hover:bg-white z-30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setActiveImageIndex(prev => (prev < product.images.length - 1 ? prev + 1 : 0))}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}

              {/* Amazon Zoom Portal (Floating Panel) */}
              {showMagnifier && !isVideo(product.images?.[activeImageIndex] || '') && (
                <div 
                  className="absolute inset-0 z-50 bg-white border-2 border-primary/10 shadow-2xl overflow-hidden hidden lg:block pointer-events-none"
                  style={{
                    backgroundImage: `url("${getImageUrl(product.images?.[activeImageIndex] || product.featuredImage)}")`,
                    backgroundRepeat: 'no-repeat',
                    ...zoomStyle
                  }}
                />
              )}

              <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                <Badge className="bg-primary/95 text-white backdrop-blur-md px-3 py-1 text-sm font-semibold shadow-sm">
                  {product.categoryname}
                </Badge>
                {product.stock <= 0 ? (
                  <Badge variant="destructive" className="px-3 py-1 text-sm bg-red-600 shadow-sm">Out of Stock</Badge>
                ) : product.stock < 10 && (
                   <Badge variant="destructive" className="px-3 py-1 text-sm shadow-sm">
                    Only {product.stock} left
                   </Badge>
                )}
              </div>
            </div>
          </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4">
              <Card className="border-none bg-muted/40 text-center p-2 sm:p-4">
                <CardContent className="p-0 flex flex-col items-center justify-center gap-1 sm:gap-2 h-full">
                  <ShieldCheck className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight">Quality Assured</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/40 text-center p-2 sm:p-4">
                <CardContent className="p-0 flex flex-col items-center justify-center gap-1 sm:gap-2 h-full">
                  <Truck className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight">India-wide Delivery</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/40 text-center p-2 sm:p-4">
                <CardContent className="p-0 flex flex-col items-center justify-center gap-1 sm:gap-2 h-full">
                  <CheckCircle2 className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                  <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight">Verified Listing</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="space-y-8 flex flex-col">
            {/* Desktop Title & Rating */}
            <div className="hidden md:block space-y-4">
              {product.brand && (
                <p className="text-primary font-bold tracking-widest uppercase text-xs sm:text-sm">{product.brand}</p>
              )}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-headline leading-tight break-words">{product.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={scrollToReviews}>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-5 h-5 ${Number(averageRating) >= s ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground/30'}`} 
                      />
                    ))}
                  </div>
                  <span className="font-bold text-lg">{averageRating}</span>
                </div>
                <div className="h-4 w-[1px] bg-border" />
                <span 
                  onClick={scrollToReviews}
                  className="text-muted-foreground font-medium underline cursor-pointer hover:text-primary transition-colors"
                >
                  {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
                <div className="h-4 w-[1px] bg-border" />
                <span className="text-muted-foreground font-medium">SKU: <span className="text-foreground">{product.sku}</span></span>
              </div>
            </div>

            <div className="space-y-4">
              {product.description && (
                <div className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium space-y-2 py-2 break-words">
                  {product.description.split('\n').map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {line.trim() && (
                        <>
                          {!line.includes('✔') && <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />}
                          <span className={line.includes('✔') ? "text-foreground font-semibold" : ""}>{line.trim()}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Unified Quick Specifications (Top Section) */}
              <div className="pt-2 space-y-4">
                <p className="text-sm font-black uppercase tracking-widest text-primary">Quick Specifications</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {/* System Specs */}
                  {[
                    { label: 'Brand', value: product.brand },
                    { label: 'SKU', value: product.sku },
                    { label: 'Dimensions', value: product.dimensions?.lengthCm ? `${product.dimensions.lengthCm}x${product.dimensions.widthCm}x${product.dimensions.heightCm} cm` : null },
                    { label: 'Origin', value: product.countryOfOrigin },
                  ].filter(s => s.value).map((spec, i) => (
                    <div key={i} className="flex flex-col border-b border-muted pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 mb-1">{spec.label}</span>
                      <span className="text-sm font-semibold text-foreground break-words">{spec.value}</span>
                    </div>
                  ))}
                  
                  {/* Highlighted Features */}
                  {product.additionalFeatures && product.additionalFeatures
                    .filter(f => f.isHighlighted)
                    .map((feature, i) => (
                      <div key={`feat-${i}`} className="flex flex-col border-b border-muted pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 mb-1">{feature.title}</span>
                        <span className="text-sm font-semibold text-foreground break-words">{feature.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8 rounded-3xl bg-muted/30 border space-y-6">
              <div className="space-y-2">
                {pricing && pricing.offerDiscount > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-baseline flex-wrap gap-x-4 gap-y-2">
                       <span className="text-2xl sm:text-4xl font-bold text-green-600">
                        <Price amount={displayPrice} showDecimals />
                      </span>
                      <span className="text-lg sm:text-xl text-muted-foreground line-through decoration-destructive/50">
                        <Price amount={originalPrice} showDecimals />
                      </span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        OFFER: <Price amount={pricing.offerDiscount} className="ml-1" /> OFF
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-green-600">
                       {pricing.message}
                    </p>
                  </div>
                ) : isTherapist ? (
                  <div className="space-y-4">
                    <div className="flex items-baseline flex-wrap gap-x-4 gap-y-2">
                       <span className="text-2xl sm:text-4xl font-bold text-primary">
                        <Price amount={therapistPrice} showDecimals />
                      </span>
                      <span className="text-lg sm:text-xl text-muted-foreground line-through decoration-destructive/50">
                        <Price amount={displayPrice} showDecimals />
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] sm:text-sm font-bold border border-primary/20">
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                      10% Therapist Exclusive Discount Applied
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-2xl sm:text-4xl font-bold">
                      <Price amount={displayPrice} showDecimals />
                    </span>
                    {originalPrice > displayPrice && (
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold text-xs">
                         SAVE {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
                       </Badge>
                    )}
                  </div>
                )}
                {originalPrice > displayPrice && <p className="text-xs sm:text-sm text-muted-foreground mr-2">MRP: <span className="line-through decoration-muted-foreground/70"><Price amount={originalPrice} showDecimals /></span></p>}
                {product.gstPercent !== undefined && product.gstPercent > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className="text-[10px] sm:text-xs font-medium border-primary/20 bg-primary/5 text-primary">
                        GST {product.gstPercent}%:
                      </Badge>
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-tight">
                        {product.isTaxInclusive ? 'Inclusive of all taxes' : 'Tax Excluded'}
                      </span>
                    </div>
                    {!product.isTaxInclusive && (
                      <p className="text-[10px] text-destructive font-medium">
                        * GST will be added at checkout
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Shipping Estimator (Check Delivery) */}
              <div className="space-y-4 border-y py-6 my-2">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm uppercase tracking-wider">Check Delivery Availability</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter Pincode (e.g. 110001)"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full h-12 px-4 rounded-xl bg-white border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-semibold"
                    />
                    {estimating && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={handleCheckShipping}
                    disabled={estimating || pincode.length !== 6}
                    variant="outline"
                    className="h-12 rounded-xl px-6 font-bold border-primary text-primary hover:bg-primary/5"
                  >
                    Check
                  </Button>
                </div>
                
                {shippingEstimate && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-green-800">
                          Available for Delivery to {pincode}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-green-700/80">
                          <span className="flex items-center gap-1">
                             Shipping: <span className="font-bold text-green-700">₹{shippingEstimate.rate}</span>
                          </span>
                          <span className="flex items-center gap-1">
                             Delivery: <span className="font-bold text-green-700">{shippingEstimate.estimated_delivery}</span>
                          </span>
                          <span className="flex items-center gap-1">
                             via {shippingEstimate.courier}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {Object.keys(availableOptions).length > 0 && (
                <div className="space-y-4 py-4 border-t">
                  <p className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Select Options</p>
                  {Object.entries(availableOptions).map(([key, values]) => (
                    <div key={key} className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{key}</p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val) => (
                          <Button
                            key={val}
                            variant={selectedAttributes[key] === val ? "default" : "outline"}
                            size="sm"
                            className={`rounded-lg ${selectedAttributes[key] === val ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: val }))}
                          >
                            {val}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="hidden md:block space-y-4">
                {quantityInCart > 0 ? (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-muted-foreground">Already in Cart</span>
                      <span className="text-primary font-bold">{quantityInCart} Units</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center border rounded-xl bg-muted/20">
                         <Button variant="ghost" size="icon" className="rounded-l-xl" onClick={() => handleUpdateCartQuantity(quantityInCart - 1)} disabled={quantityInCart <= 1}>
                           <Minus className="w-4 h-4" />
                         </Button>
                         <span className="w-12 text-center font-bold text-lg">{quantityInCart}</span>
                         <Button variant="ghost" size="icon" className="rounded-r-xl" onClick={() => handleUpdateCartQuantity(quantityInCart + 1)} disabled={quantityInCart >= displayStock}>
                           <Plus className="w-4 h-4" />
                         </Button>
                      </div>
                      <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsCartOpen(true)}>
                        View Cart
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center border rounded-2xl bg-white h-14 overflow-hidden shrink-0">
                       <Button variant="ghost" size="icon" className="h-full px-4 rounded-none border-r" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                        <Minus className="w-4 h-4" />
                       </Button>
                       <span className="w-14 text-center font-bold text-xl">{quantity}</span>
                       <Button variant="ghost" size="icon" className="h-full px-4 rounded-none border-l" onClick={() => setQuantity(q => q + 1)} disabled={displayStock > 0 && quantity >= displayStock}>
                        <Plus className="w-4 h-4" />
                       </Button>
                    </div>
                    <Button 
                      onClick={handleAddToCart} 
                      size="lg" 
                      className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={displayStock <= 0}
                    >
                      <ShoppingCart className="mr-3 w-6 h-6 text-white" />
                      {displayStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
                <div className={`flex items-center gap-2 ${displayStock > 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {displayStock > 0 ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  <span className="font-bold">{displayStock > 0 ? 'In Stock (Ready to dispatch)' : 'Currently Unavailable'}</span>
                </div>
                <div className="hidden sm:block h-4 w-[1px] bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold text-foreground">Delivery in 3-5 days</span>
                </div>
              </div>
              </div>
            </div>

          </div>

        {/* Product Details Tabs (Desktop) & Accordion (Mobile) */}
        <div className="mt-12 lg:mt-20">
          {/* Desktop Tabs */}
          <div className="hidden md:block">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6 sm:gap-8 overflow-x-auto scrollbar-hide flex-nowrap shrink-0">
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
                  Reviews ({averageRating} - {reviews.length} Customer Reviews)
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="pt-10 w-full">
                <div className="prose prose-slate max-w-none">
                  <div className="text-lg leading-relaxed space-y-6 w-full max-w-full overflow-hidden">
                    {product.longDescription ? (
                      <div 
                        className="[&_img]:!max-w-full [&_img]:!h-auto [&_img]:rounded-xl [&_img]:object-contain overflow-x-auto break-words [&_table]:!max-w-full [&_table]:block [&_iframe]:!max-w-full w-full" 
                        dangerouslySetInnerHTML={{ 
                          __html: product.longDescription.replace(/src="\/uploads\//g, `src="${process.env.NEXT_PUBLIC_API_URL ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/') ? process.env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_URL + '/') : 'http://localhost:5000/'}uploads/`) 
                        }} 
                      />
                    ) : (
                      <p>No additional description available at this time. Please contact support if you need more technical information about this product.</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="pt-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
                   {[
                     { label: 'Brand', value: product.brand },
                     { label: 'Category', value: product.categoryname },
                     { label: 'SKU', value: product.sku },
                     { label: 'Country of Origin', value: product.countryOfOrigin },
                     { label: 'Packer', value: product.packer },
                     { label: 'Importer', value: product.importer },
                     { label: 'Dimensions (LxWxH)', value: product.dimensions ? `${product.dimensions.lengthCm}x${product.dimensions.widthCm}x${product.dimensions.heightCm} cm` : null },
                     { label: 'Weight', value: product.dimensions ? `${product.dimensions.weightKg} kg` : null },
                     { label: 'Batch/Lot Number', value: product.batchNumber },
                     { label: 'Manufacturing Date', value: product.mfgDate },
                     { label: 'Expiry Date', value: product.expiryDate },
                     ...(product.additionalFeatures || []).map(f => ({ label: f.title, value: f.value }))
                   ].filter(spec => spec.value && spec.value !== '0' && spec.value !== '0.00').map((spec, i) => (
                     <div key={i} className="flex flex-col p-5 rounded-2xl border-2 bg-muted/5 shadow-sm">
                       <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/70 mb-1">{spec.label}</span>
                       <span className="text-base font-semibold text-foreground">{spec.value}</span>
                     </div>
                   ))}
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="pt-10 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex gap-4 p-6 rounded-2xl bg-muted/30 border">
                          <Truck className="w-8 h-8 text-primary shrink-0" />
                          <div className="space-y-1">
                              <p className="font-bold text-lg">Fast Delivery</p>
                              {shippingEstimate ? (
                                <p className="text-muted-foreground">
                                  Shipping to <span className="font-bold text-primary">{pincode}</span> will cost <span className="font-bold text-primary">₹{shippingEstimate.rate}</span> via {shippingEstimate.courier}. 
                                  Estimated delivery by <span className="font-bold text-primary">{shippingEstimate.estimated_delivery}</span>.
                                </p>
                              ) : (
                                <p className="text-muted-foreground">Standard delivery within 3-5 business days across India. Express shipping options available at checkout.</p>
                              )}
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

          {/* Mobile Accordion */}
          <div className="md:hidden">
            <Accordion type="single" collapsible className="w-full" defaultValue="description">
              <AccordionItem value="description" className="border-b border-border/50">
                <AccordionTrigger className="text-lg font-bold py-4 hover:no-underline">Description</AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 text-base text-muted-foreground">
                  <div className="prose prose-slate max-w-none">
                    <div className="text-base leading-relaxed space-y-4 w-full max-w-full overflow-hidden">
                      {product.longDescription ? (
                        <div 
                          className="[&_img]:!max-w-full [&_img]:!h-auto [&_img]:rounded-xl [&_img]:object-contain overflow-x-auto break-words [&_table]:!max-w-full [&_table]:block [&_iframe]:!max-w-full w-full" 
                          dangerouslySetInnerHTML={{ 
                            __html: product.longDescription.replace(/src="\/uploads\//g, `src="${process.env.NEXT_PUBLIC_API_URL ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/') ? process.env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_URL + '/') : 'http://localhost:5000/'}uploads/`) 
                          }} 
                        />
                      ) : (
                        <p>No additional description available at this time.</p>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="specifications" className="border-b border-border/50">
                <AccordionTrigger className="text-lg font-bold py-4 hover:no-underline">Specifications</AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="grid grid-cols-1 gap-4">
                     {[
                       { label: 'Brand', value: product.brand },
                       { label: 'Category', value: product.categoryname },
                       { label: 'SKU', value: product.sku },
                       { label: 'Country of Origin', value: product.countryOfOrigin },
                       { label: 'Packer', value: product.packer },
                       { label: 'Importer', value: product.importer },
                       { label: 'Dimensions (LxWxH)', value: product.dimensions ? `${product.dimensions.lengthCm}x${product.dimensions.widthCm}x${product.dimensions.heightCm} cm` : null },
                       { label: 'Weight', value: product.dimensions ? `${product.dimensions.weightKg} kg` : null },
                       { label: 'Batch/Lot Number', value: product.batchNumber },
                       { label: 'Manufacturing Date', value: product.mfgDate },
                       { label: 'Expiry Date', value: product.expiryDate },
                       ...(product.additionalFeatures || []).map(f => ({ label: f.title, value: f.value }))
                     ].filter(spec => spec.value && spec.value !== '0' && spec.value !== '0.00').map((spec, i) => (
                       <div key={i} className="flex flex-col p-4 rounded-xl border bg-muted/5 shadow-sm">
                         <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 mb-1">{spec.label}</span>
                         <span className="text-sm font-semibold text-foreground">{spec.value}</span>
                       </div>
                     ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping" className="border-b border-border/50">
                <AccordionTrigger className="text-lg font-bold py-4 hover:no-underline">Shipping & Returns</AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex gap-4 p-5 rounded-2xl bg-muted/30 border">
                          <Truck className="w-6 h-6 text-primary shrink-0" />
                          <div className="space-y-1">
                              <p className="font-bold text-base">Fast Delivery</p>
                              {shippingEstimate ? (
                                <p className="text-sm text-muted-foreground">
                                  Shipping to <span className="font-bold text-primary">{pincode}</span> will cost <span className="font-bold text-primary">₹{shippingEstimate.rate}</span> via {shippingEstimate.courier}. 
                                  Estimated delivery by <span className="font-bold text-primary">{shippingEstimate.estimated_delivery}</span>.
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Standard delivery within 3-5 business days across India.</p>
                              )}
                          </div>
                      </div>
                      <div className="flex gap-4 p-5 rounded-2xl bg-muted/30 border">
                          <RotateCcw className="w-6 h-6 text-primary shrink-0" />
                          <div className="space-y-1">
                              <p className="font-bold text-base">Easy Returns</p>
                              <p className="text-sm text-muted-foreground">14-day hassle-free returns on most unopened items.</p>
                          </div>
                      </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="reviews" className="border-b-0">
                <AccordionTrigger className="text-lg font-bold py-4 hover:no-underline text-left">
                  Reviews ({averageRating} - {reviews.length} Customer Reviews)
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="w-full">
                    <ProductReviews productId={product.id} initialRating={product.rating} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-32">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 sm:mb-10">
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

      {/* Sticky Mobile Add to Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-6">
        {quantityInCart > 0 ? (
          <div className="flex w-full gap-3">
            <div className="flex items-center border rounded-xl bg-muted/20 flex-1 justify-center max-w-[120px] shrink-0">
               <Button variant="ghost" size="icon" className="h-12 w-10 rounded-l-xl shrink-0" onClick={() => handleUpdateCartQuantity(quantityInCart - 1)} disabled={quantityInCart <= 1}>
                 <Minus className="w-4 h-4" />
               </Button>
               <span className="w-10 text-center font-bold text-lg">{quantityInCart}</span>
               <Button variant="ghost" size="icon" className="h-12 w-10 rounded-r-xl shrink-0" onClick={() => handleUpdateCartQuantity(quantityInCart + 1)} disabled={quantityInCart >= product.stock}>
                 <Plus className="w-4 h-4" />
               </Button>
            </div>
            <Button variant="default" className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={() => setIsCartOpen(true)}>
              View Cart
            </Button>
          </div>
        ) : (
          <div className="flex w-full gap-3">
            <div className="flex items-center border rounded-xl bg-white flex-1 max-w-[120px] shrink-0 overflow-hidden">
               <Button variant="ghost" size="icon" className="h-12 w-10 rounded-none border-r shrink-0" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                <Minus className="w-4 h-4" />
               </Button>
               <span className="w-10 text-center font-bold text-lg">{quantity}</span>
               <Button variant="ghost" size="icon" className="h-12 w-10 rounded-none border-l shrink-0" onClick={() => setQuantity(q => q + 1)} disabled={product.stock > 0 && quantity >= product.stock}>
                <Plus className="w-4 h-4" />
               </Button>
            </div>
            <Button 
              onClick={handleAddToCart} 
              className="flex-1 h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="mr-2 w-5 h-5 text-white" />
              {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
