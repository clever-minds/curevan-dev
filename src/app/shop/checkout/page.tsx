
'use client';

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Price } from "@/components/money/price";
import { CheckoutAddressForm } from "./checkout-address-form";
import { OrderSummary } from "./order-summary";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutPage() {
    const { cart } = useCart();
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/signin?redirectUrl=/shop/checkout');
        }
        if (!isLoading && cart.length === 0) {
            router.push('/shop');
        }
    }, [user, isLoading, cart, router]);

    if (isLoading || !user || cart.length === 0) {
        return (
             <div className="container mx-auto max-w-5xl py-12">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <Skeleton className="h-12 w-1/2 mb-6" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                     <div>
                        <Skeleton className="h-12 w-1/2 mb-6" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-5xl py-12">
            <Button variant="link" asChild className="mb-4 -ml-4">
                <Link href="/shop"><ArrowLeft className="mr-2"/> Back to Shop</Link>
            </Button>
            <div className="grid md:grid-cols-2 gap-12 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping & Billing Details</CardTitle>
                        <CardDescription>Enter your address to proceed with the order.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CheckoutAddressForm />
                    </CardContent>
                </Card>
                 <div className="sticky top-24">
                    <OrderSummary />
                </div>
            </div>
        </div>
    )
}
