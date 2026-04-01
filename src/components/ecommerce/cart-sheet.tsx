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
            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle>Shopping Cart ({cart.length})</SheetTitle>
                     <SheetDescription>
                        Review your items before proceeding to checkout.
                    </SheetDescription>
                </SheetHeader>
                {cart.length > 0 ? (
                    <>
                        <ScrollArea className="flex-1 -mx-6">
                            <div className="px-6">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-start gap-4 py-4">
                                        <Image src={imageUrl(item.featuredImage)} alt={item.name} width={64} height={64} className="rounded-md object-cover" />
                                        <div className="flex-1">
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            <p className="font-semibold mt-1"><Price amount={item.price} showDecimals /></p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <SheetFooter className="mt-auto">
                            <div className="w-full space-y-4">
                                <Separator />
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span><Price amount={subtotal} showDecimals /></span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Tag className="w-4 h-4" /> 
                                                Discount
                                                {appliedCoupon?.code && <Badge variant="secondary">{appliedCoupon.code}</Badge>}
                                            </span>
                                            <span className="text-primary">-<Price amount={discount} showDecimals /></span>
                                        </div>
                                    )}
                                </div>
                                <Separator />

                                <div className="flex justify-between font-bold text-lg">
                                    <p>Total</p>
                                    <p><Price amount={total} showDecimals /></p>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                     <Button onClick={handleCheckout} disabled={total === 0 || isValidating}>
                                        {isValidating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating...</> : 'Proceed to Checkout'}
                                    </Button>
                                    <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
                                </div>
                            </div>
                        </SheetFooter>
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
