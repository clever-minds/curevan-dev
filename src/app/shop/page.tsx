// This is an alias for the ecommerce page. A ?coupon=CODE in the link is kept for checkout.
import EcommercePage from "../ecommerce/page";
import { CouponParamCapture } from "@/components/affiliate/CouponParamCapture";

export default function ShopPage() {
  return (
    <>
      <CouponParamCapture />
      <EcommercePage />
    </>
  );
}
