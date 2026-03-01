

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
import { Price } from './money/price';

export default function ProductCard({ product }: { product: Product }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const { cart, addToCart, updateQuantity } = useCart();
  const isTherapist = user?.role === 'therapist';

  const cartItem = cart.find(item => Number(item.productId) === Number(product.id));
  console.log('cartItem log:', cartItem);
  const quantityInCart = cartItem?.quantity || 0;
console.log('quantityInCart log:', quantityInCart);
  // Therapist gets a 10% discount
  const price = product.price;
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
          <div className="relative h-48 w-full">
              <Image
                  src={product.featuredImage ? `${process.env.NEXT_PUBLIC_API_URL}${product.featuredImage}` : "/images/no-image.png"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  data-ai-hint={product.categoryId}
              />
               <Badge variant="secondary" className="absolute top-2 right-2">{product.categoryname}</Badge>
          </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
          <CardTitle className="text-lg font-bold font-headline mb-1 line-clamp-1">{product.name}</CardTitle>
          <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
            <span className="font-semibold text-foreground">4.5</span>
            <span>(150 reviews)</span>
          </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex-col items-start">
        <div className="w-full mb-4">
            {isTherapist ? (
                <div>
                    <p className="text-sm text-muted-foreground line-through">Retail: <Price amount={price} showDecimals /></p>
                    <p className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Tag className="w-5 h-5"/>
                        <span><Price amount={therapistPrice} showDecimals /></span>
                    </p>
                    <Badge className="mt-1" variant="destructive">10% Therapist Discount</Badge>
                </div>
            ) : (
                <p className="text-2xl font-bold"><Price amount={price} showDecimals /></p>
            )}
        </div>
         {quantityInCart > 0 ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-semibold">In Cart:</span>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => handleUpdateQuantity(quantityInCart - 1)}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{quantityInCart}</span>
              <Button size="icon" variant="outline" onClick={() => handleUpdateQuantity(quantityInCart + 1)} disabled={quantityInCart >= 5}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={handleAddToCart} className="w-full">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
