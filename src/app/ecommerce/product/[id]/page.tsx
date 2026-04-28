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
import { fetchProductById, fetchPublicProducts } from '@/lib/repos/products';
import { fetchProductReviews } from '@/lib/repos/reviews';
import { getActiveOffers } from '@/lib/repos/offers';
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
  const [offers, setOffers] = useState<Offer[]>([]);
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
        const [productData, reviewsData, offersData] = await Promise.all([
          fetchProductById(id as string),
          fetchProductReviews(id as string),
          getActiveOffers()
        ]);
        
        setOffers(offersData);

        if (productData) {
          setProduct(productData);
          setReviews(reviewsData);
          
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

  const originalPrice = product?.price || 0;
  const pricing = product ? calculateProductPrice(product, offers, null) : null;
  const price = pricing?.finalPrice ?? originalPrice;
  const therapistPrice = price * 0.90;

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
    <div className="bg-background min-h-screen">
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30 overflow-x-auto scrollbar-hide py-2 sm:py-4">
        <div className="container mx-auto px-4 min-w-max sm:min-w-0">
          <Breadcrumb className="text-[10px] sm:text-sm">
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
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="font-semibold text-primary truncate max-w-[150px] sm:max-w-none">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <main className="container mx-auto py-8 md:py-16 px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          {/* Left Column: Amazon-Style Image Gallery */}
          <div className="flex flex-col gap-8 lg:gap-12">
            
            {/* Gallery Wrapper (Thumbnails + Main Image) */}
            <div className="flex flex-col-reverse md:flex-row gap-4 lg:gap-6 items-start">
            
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
            <div className="flex-1 w-full relative rounded-3xl bg-white border shadow-sm group overflow-hidden h-[400px] md:h-[450px] flex items-center justify-center">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <Card className="border-none bg-muted/40 text-center p-3 sm:p-4">
                <CardContent className="p-0 space-y-2">
                  <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-primary" />
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Quality Assured</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/40 text-center p-3 sm:p-4">
                <CardContent className="p-0 space-y-2">
                  <Truck className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-primary" />
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">India-wide Delivery</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-muted/40 text-center p-3 sm:p-4">
                <CardContent className="p-0 space-y-2">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-primary" />
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Verified Listing</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="space-y-8 flex flex-col">
            <div className="space-y-4">
              {product.brand && (
                <p className="text-primary font-bold tracking-widest uppercase text-xs sm:text-sm">{product.brand}</p>
              )}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-headline leading-tight">{product.name}</h1>
              
              {product.description && (
                <div className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium space-y-2 py-2">
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

              <div className="flex items-center gap-6">
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
                      <span className="text-sm font-semibold text-foreground">{spec.value}</span>
                    </div>
                  ))}
                  
                  {/* Highlighted Features */}
                  {product.additionalFeatures && product.additionalFeatures
                    .filter(f => f.isHighlighted)
                    .map((feature, i) => (
                      <div key={`feat-${i}`} className="flex flex-col border-b border-muted pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 mb-1">{feature.title}</span>
                        <span className="text-sm font-semibold text-foreground">{feature.value}</span>
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
                        <Price amount={price} showDecimals />
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
                        <Price amount={price} showDecimals />
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
                      <Price amount={price} showDecimals />
                    </span>
                    {product.mrp && product.mrp > price && (
                       <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold text-xs">
                         SAVE {Math.round(((product.mrp - price) / product.mrp) * 100)}%
                       </Badge>
                    )}
                  </div>
                )}
                {product.mrp && <p className="text-xs sm:text-sm text-muted-foreground mr-2">MRP: <span className="line-through decoration-muted-foreground/70"><Price amount={product.mrp} showDecimals /></span></p>}
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
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center border rounded-2xl bg-white h-14 overflow-hidden shrink-0">
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
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
                <div className={`flex items-center gap-2 ${product.stock > 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {product.stock > 0 ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  <span className="font-bold">{product.stock > 0 ? 'In Stock (Ready to dispatch)' : 'Currently Unavailable'}</span>
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

        {/* Product Details Tabs */}
        <div className="mt-12 lg:mt-32">
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
            <TabsContent value="description" className="pt-10 max-w-4xl">
              <div className="prose prose-slate max-w-none">
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
              <div className="grid md:grid-cols-2 gap-6">
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
            <TabsContent value="shipping" className="pt-10 max-w-2xl">
                <div className="space-y-6">
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
