'use client';

import React, { useState } from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose, SheetDescription } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { useCart } from "@/context/cart-context";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";
import { Trash2, Loader2, X, Tag } from "lucide-react";
import { Separator } from "../ui/separator";
import { useAuth } from "@/context/auth-context";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Price } from "../money/price";
import { imageUrl } from '@/lib/image';

export function CartSheet({ children }: { children: React.ReactNode }) {
    const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart, isCartOpen, setIsCartOpen, appliedCoupon, validateStock } = useCart();
    const [isValidating, setIsValidating] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
console.log("CartSheet render - cart items:", cart);
    const { subtotal, discount, total } = getCartTotal();

    const handleCheckout = async () => {
        if (!user) {
            setIsCartOpen(false);
            router.push('/auth/signin?redirectUrl=/shop/checkout');
            return;
        }

        setIsValidating(true);
        try {
            const res = await validateStock();
            console.log("Stock validation response:", res);
            if (res.success) {
                setIsCartOpen(false);
                router.push('/shop/checkout');
            } else {
                alert(res.message || "Some items in your cart are out of stock. Please check your cart.");
            }
        } catch (error) {
            console.error("Checkout validation error:", error);
            alert("Failed to validate stock. Please try again.");
        } finally {
            setIsValidating(false);
        }
    }
    
    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden border-l border-muted">
                <SheetHeader className="p-6 pb-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-2xl font-bold font-headline">Shopping Cart ({cart.length})</SheetTitle>
                    </div>
                    <SheetDescription className="text-sm text-muted-foreground mt-1">
                        Review your items before proceeding to checkout.
                    </SheetDescription>
                </SheetHeader>

                {cart.length > 0 ? (
                    <>
                        <ScrollArea className="flex-1 px-6 mt-6">
                            <div className="space-y-6 pb-6">
                                {cart.map(item => (
                                    <div key={item.id} className="group relative flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted/30 border shrink-0">
                                            <Image 
                                                src={imageUrl(item.featuredImage)} 
                                                alt={item.name} 
                                                fill 
                                                className="object-cover" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8">
                                            <p className="font-bold text-base leading-tight truncate-2-lines mb-1">{item.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>Qty: {item.quantity}</span>
                                            </div>
                                            <p className="font-bold text-lg text-foreground mt-1">
                                                <Price amount={item.price} showDecimals />
                                            </p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute -top-1 -right-1 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors" 
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        
                        <div className="p-6 bg-muted/30 border-t space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium uppercase tracking-wider">Subtotal</span>
                                    <span className="font-semibold text-foreground tracking-tight"><Price amount={subtotal} showDecimals /></span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1 font-medium uppercase tracking-wider">
                                            <Tag className="w-4 h-4" /> 
                                            Discount
                                            {appliedCoupon?.code && <Badge variant="secondary" className="ml-2">{appliedCoupon.code}</Badge>}
                                        </span>
                                        <span className="text-primary font-bold tracking-tight">-<Price amount={discount} showDecimals /></span>
                                    </div>
                                )}
                                <Separator className="bg-muted-foreground/10" />
                                <div className="flex justify-between items-center py-2 text-xl">
                                    <p className="font-bold font-headline uppercase tracking-tighter">Total</p>
                                    <p className="font-black text-foreground tracking-tighter">
                                        <Price amount={total} showDecimals />
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <Button 
                                    onClick={handleCheckout} 
                                    className="h-14 rounded-2xl bg-[#6333ea] hover:bg-[#5228c2] text-lg font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                    disabled={total === 0 || isValidating}
                                >
                                    {isValidating ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Validating...</>
                                    ) : 'Proceed to Checkout'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={clearCart}
                                    className="h-12 rounded-xl text-muted-foreground font-semibold hover:bg-muted"
                                >
                                    Clear Cart
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <p className="text-muted-foreground">Your cart is empty.</p>
                        <Button variant="link" asChild><Link href="/shop">Start Shopping</Link></Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
