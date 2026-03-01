
"use client";
import { formatINR } from "@/lib/currency";

export function Price({ amount, showDecimals=false, className }:{
  amount:number; showDecimals?:boolean; className?:string;
}) {
  if (amount==null || isNaN(amount as any)) return <span>-</span>;
  return <span className={`tabular-nums whitespace-nowrap ${className||""}`}>{formatINR(amount, showDecimals)}</span>;
}
