

'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, Tag, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useCart } from '@/context/cart-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Price } from './money/price';
import { calculateProductPrice } from '@/lib/pricing';


export default function ProductCard({ product }: { product: Product }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const { cart, addToCart, updateQuantity, offers } = useCart();
  const isTherapist = user?.role === 'therapist';

  const cartItem = cart.find(item => Number(item.productId) === Number(product.id));
  console.log('cartItem log:', cartItem);
  const quantityInCart = cartItem?.quantity || 0;
  console.log('quantityInCart log:', quantityInCart);
  // Therapist gets a 10% discount
  // Pricing Engine logic
  const pricing = calculateProductPrice(product, offers, null);
  const price = pricing.finalPrice;
  const originalPrice = product.price;
  const therapistPrice = price * 0.90;


  const handleAddToCart = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: "Authentication Required",
        description: "Please sign in to add items to your cart.",
      });
      router.push('/auth/signin');
      return;
    }
    addToCart(product);
    toast({
      title: 'Added to Cart!',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    updateQuantity(product.id, newQuantity);
  };


  return (
    <Card className="flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <Link href={`/ecommerce/product/${product.id}`} className="block relative h-48 w-full cursor-pointer overflow-hidden">
          <Image
            src={product.featuredImage ? `${process.env.NEXT_PUBLIC_API_URL}${product.featuredImage}` : "/images/no-image.png"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            data-ai-hint={product.categoryId}
          />
          <Badge variant="secondary" className="absolute top-2 right-2 backdrop-blur-md bg-white/70">{product.categoryname}</Badge>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <Link href={`/ecommerce/product/${product.id}`} className="hover:text-primary transition-colors cursor-pointer">
          <CardTitle className="text-lg font-bold font-headline mb-1 line-clamp-1">{product.name}</CardTitle>
        </Link>
        <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
          <span className="font-semibold text-foreground">4.5</span>
          <span>(150 reviews)</span>
        </div>
      </CardContent>
    </Card>
  );
}
