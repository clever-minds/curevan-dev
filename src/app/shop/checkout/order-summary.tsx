'use client';

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Price } from "@/components/money/price";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tag, X, Loader2 } from "lucide-react";
import { imageUrl } from '@/lib/image';
import { applyCoupon as applyCouponAPI } from "@/lib/repos/coupons";

export function OrderSummary() {
  const { cart, getCartTotal, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || "");
  const [couponLoading, setCouponLoading] = useState(false);
  const { toast } = useToast();

  const { subtotal, discount, total } = getCartTotal();

  const handleApplyCoupon = useCallback(async (codeToApply: string) => {
    if (!codeToApply.trim()) return;

    try {
      setCouponLoading(true);

      const response = await applyCouponAPI({
        code: codeToApply.trim(),
        order_amount: subtotal
      });

      if (response) {
        applyCoupon({
            id: response.coupon_id,
            code: response.code,
            discountType: "flat",
            value: response.discount,
            active: true,
        });


        toast({
          title: "Coupon Applied!",
          description: `You saved ₹${response.discount}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "Coupon not valid",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while applying coupon.",
      });
    } finally {
      setCouponLoading(false);
    }
  }, [applyCoupon, subtotal, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Cart Items */}
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {cart.map(item => (
            <div key={item.id} className="flex items-start gap-4">
              <Image
                src={imageUrl(item.featuredImage)}
                alt={item.name}
                width={64}
                height={64}
                className="rounded-md object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="font-semibold">
                <Price amount={item.price * item.quantity} showDecimals />
              </p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Coupon Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Enter gift or coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={!!appliedCoupon || couponLoading}
            />

            {!appliedCoupon ? (
              <Button
                onClick={() => handleApplyCoupon(couponCode)}
                disabled={!couponCode.trim() || couponLoading}
              >
                {couponLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : 'Apply'}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  removeCoupon();
                  setCouponCode('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>
              <Price amount={subtotal} showDecimals />
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Coupon ({appliedCoupon?.code})
              </span>
              <span className="text-primary">
                -<Price amount={discount} showDecimals />
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>Free</span>
          </div>
        </div>

        <Separator />

        {/* Final Total */}
        <div className="flex justify-between font-bold text-lg">
          <p>Total</p>
          <p>
            <Price amount={total} showDecimals />
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
