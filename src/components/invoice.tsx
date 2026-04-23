
'use client';

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InvoiceData } from "@/services/invoice-service";
import Logo from "./logo";
import { Price } from "./money/price";
import React from 'react';

export function Invoice({ invoice }: { invoice: InvoiceData }) {
    // React.useEffect(() => {
    //     // Delay slightly to ensure fonts and layout are ready
    //     const timer = setTimeout(() => {
    //         window.print();
    //     }, 1000);
    //     return () => clearTimeout(timer);
    // }, []);

    // Determine tax groupings for the HSN summary and totals breakdown
    const getSafeDate = (date: any): Date | null => {
        if (!date) return null;
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        if (typeof date === 'object' && date._seconds) {
            return new Date(date._seconds * 1000);
        }
        return null;
    }

    const numberToWords = (num: number): string => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero Rupees Only';

        const format = (n: number): string => {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
            return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + format(n % 100) : '');
        };

        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);

        const getWords = (n: number) => {
            const crores = Math.floor(n / 10000000);
            const lakhs = Math.floor((n % 10000000) / 100000);
            const thousands = Math.floor((n % 100000) / 1000);
            const hundreds = Math.floor((n % 1000) / 100);
            const rest = Math.floor(n % 100);

            let res = '';
            if (crores > 0) res += format(crores) + 'Crore ';
            if (lakhs > 0) res += format(lakhs) + 'Lakh ';
            if (thousands > 0) res += format(thousands) + 'Thousand ';
            if (hundreds > 0) res += format(hundreds) + 'Hundred ';
            if (rest > 0) res += (res !== '' ? 'and ' : '') + format(rest);
            return res.trim();
        };

        let finalWords = '';
        if (rupees > 0) {
            finalWords += getWords(rupees) + ' Rupees';
        }

        if (paise > 0) {
            if (finalWords !== '') finalWords += ' and ';
            finalWords += format(paise) + 'Paise';
        }

        return (finalWords || 'Zero') + ' Only';
    };

    const taxGroupings = invoice.items.reduce((acc: any, item) => {
        const rate = item.gstRate || 0;
        const isIgst = (item.igst || 0) > 0;
        const type = isIgst ? 'IGST' : 'CGST_SGST';
        const key = `${rate}_${type}`;

        if (!acc[key]) {
            acc[key] = { rate, type, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        acc[key].taxable += (item.taxableValue || (item.price * item.quantity));
        acc[key].cgst += (item.cgst || 0);
        acc[key].sgst += (item.sgst || 0);
        acc[key].igst += (item.igst || 0);
        return acc;
    }, {});

    const hsnSummary = Object.values(taxGroupings);

    return (
        <Card className="max-w-[210mm] mx-auto my-8 p-0 border shadow-lg print:shadow-none print:border-none print:m-0 bg-white text-[11px] font-sans text-black leading-tight border-none">
            {/* Main Wrapper with Border */}
            <div className="border border-gray-400 m-4 print:m-0">
                {/* Header: Logo | Company Details | TAX INVOICE */}
                <div className="grid grid-cols-[1fr_2fr_1.2fr] border-b border-gray-400">
                    <div className="p-4 flex flex-col items-center justify-center border-r border-gray-400">
                        <Logo className="h-14 w-auto" />
                        <p className="text-[8px] font-bold text-primary mt-1 uppercase tracking-tighter">We make workplace safer</p>
                    </div>
                    <div className="p-4 text-center border-r border-gray-400">
                        <h1 className="text-base font-black uppercase mb-1">{invoice.supplier.legalName}</h1>
                        <div className="space-y-0.5 text-[10px]">
                            <p className="font-semibold">CIN #{invoice.supplier.gstin.substring(0, 5)}... {invoice.supplier.address.pin}</p>
                            <p>{invoice.supplier.address.line1}</p>
                            <p>{invoice.supplier.address.city}, {invoice.supplier.address.state}, India - {invoice.supplier.address.pin}</p>
                            <p>GSTIN {invoice.supplier.gstin}</p>
                            <p>{invoice.supplier.email}</p>
                            <p>+91 {invoice.supplier.phone}</p>
                        </div>
                    </div>
                    <div className="p-4 flex flex-col justify-center items-end bg-gray-50/20">
                        <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">Tax Invoice</h2>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 border-b border-gray-400">
                    <div className="grid grid-cols-[110px_1fr] border-r border-gray-400">
                        <div className="p-1 px-2 border-r border-gray-400 space-y-1 font-bold">
                            <p>Invoice #</p>
                            <p>Invoice Date</p>
                            <p>Terms</p>
                            <p>Due Date</p>
                            <p>E-Way Bill#</p>
                        </div>
                        <div className="p-1 px-2 space-y-1 font-bold">
                            <p className="font-black">: {invoice.invoiceNumber}</p>
                            <p>: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            <p>: Due on Receipt</p>
                            <p>: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            <p>: -</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-[110px_1fr]">
                        <div className="p-1 px-2 border-r border-gray-400 font-bold uppercase text-[10px] flex items-center">
                            Place Of Supply
                        </div>
                        <div className="p-1 px-2 font-bold flex items-center">
                            : {invoice.placeOfSupply}
                        </div>
                    </div>
                </div>

                {/* Billing & Shipping Labels */}
                <div className="grid grid-cols-2 bg-gray-100 font-bold border-b border-gray-400 uppercase text-[9px] tracking-widest text-gray-600">
                    <div className="p-1 px-2 border-r border-gray-400">Bill To (Customer Name)</div>
                    <div className="p-1 px-2">Ship To (Shipping Address)</div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 border-b border-gray-400 min-h-[120px]">
                    <div className="p-3 border-r border-gray-400 space-y-1">
                        <p className="font-black uppercase text-[13px] leading-tight mb-2 text-black underline underline-offset-2 tracking-tight">
                            {invoice.customer.name}
                        </p>
                        <div className="space-y-0.5 text-[10px] text-gray-700 font-medium">
                            <p>Phone: {invoice.customer.billingAddress?.phone || '-'}</p>
                            <p>GSTIN: -</p>
                        </div>
                    </div>
                    <div className="p-3 space-y-1">
                        <p className="font-black uppercase text-[11px] leading-tight mb-1 text-black">
                            {invoice.customer.shippingAddress?.name || invoice.customer.name}
                        </p>
                        <p className="text-[10px] leading-snug text-gray-800 font-semibold">
                            {invoice.customer.shippingAddress?.address}
                        </p>
                        <p className="text-[10px] text-gray-800 font-semibold">
                            {invoice.customer.shippingAddress?.city}, {invoice.customer.shippingAddress?.state} - {invoice.customer.shippingAddress?.pincode}
                        </p>
                        <p className="text-[10px] text-gray-800 font-bold uppercase tracking-wider mt-1">India</p>
                    </div>
                </div>

                {/* Subject Line */}
                <div className="p-3 border-b border-gray-400 bg-white">
                    <p className="font-bold mb-1 text-gray-900">Subject :</p>
                    <p className="text-gray-900 font-medium italic underline underline-offset-2">Tax Invoice for your recent order {invoice.invoiceNumber}. Includes {invoice.items.length} items.</p>
                </div>

                {/* Main Table */}
                <div className="overflow-hidden border-b border-gray-400">
                    <Table className="border-collapse w-full border-0">
                        <TableHeader className="bg-gray-100">
                            <TableRow className="hover:bg-gray-100 h-10 border-b border-gray-400">
                                <TableHead className="border-r border-gray-400 w-10 text-center font-black p-0 text-black">#</TableHead>
                                <TableHead className="border-r border-gray-400 font-black p-2 text-black">Item & Description</TableHead>
                                <TableHead className="border-r border-gray-400 w-16 text-center font-black p-0 text-black">Qty</TableHead>
                                <TableHead className="border-r border-gray-400 w-28 text-right font-black p-2 text-black">Rate</TableHead>
                                <TableHead className="border-r border-gray-400 text-center p-0 font-black text-black" colSpan={2}>
                                    <div className="border-b border-gray-400 w-full py-1 uppercase text-[8px] tracking-wider text-gray-500">CGST</div>
                                    <div className="flex w-full">
                                        <span className="flex-1 border-r border-gray-400 py-1">%</span>
                                        <span className="flex-1 py-1">Amt</span>
                                    </div>
                                </TableHead>
                                <TableHead className="border-r border-gray-400 text-center p-0 font-black text-black" colSpan={2}>
                                    <div className="border-b border-gray-400 w-full py-1 uppercase text-[8px] tracking-wider text-gray-500">SGST</div>
                                    <div className="flex w-full">
                                        <span className="flex-1 border-r border-gray-400 py-1">%</span>
                                        <span className="flex-1 py-1">Amt</span>
                                    </div>
                                </TableHead>
                                <TableHead className="border-r border-gray-400 text-center p-0 font-black text-black" colSpan={2}>
                                    <div className="border-b border-gray-400 w-full py-1 uppercase text-[8px] tracking-wider text-gray-500">IGST</div>
                                    <div className="flex w-full">
                                        <span className="flex-1 border-r border-gray-400 py-1">%</span>
                                        <span className="flex-1 py-1">Amt</span>
                                    </div>
                                </TableHead>
                                <TableHead className="w-28 text-right font-black p-2 text-black">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item, index) => {
                                const taxableValue = item.taxableValue || (item.price * item.quantity);
                                const cgstAmt = item.cgst || 0;
                                const sgstAmt = item.sgst || 0;
                                const igstAmt = item.igst || 0;
                                const gstRate = item.gstRate || 0;

                                return (
                                    <TableRow key={item.id} className="border-b last:border-0 border-gray-400 hover:bg-transparent h-16">
                                        <TableCell className="border-r border-gray-400 text-center p-2 align-top text-gray-500 font-bold">{index + 1}</TableCell>
                                        <TableCell className="border-r border-gray-400 p-2 align-top">
                                            <p className="font-black text-xs text-black">{item.name}</p>
                                            <p className="text-[9px] text-gray-500 mt-2 font-mono uppercase tracking-tight">HSN: {item.hsnCode}</p>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-400 text-center p-2 align-top font-bold text-xs">{item.quantity}<br /><span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">Nos</span></TableCell>
                                        <TableCell className="border-r border-gray-400 text-right p-2 align-top font-bold"><Price amount={(item.price || 0)} showDecimals /></TableCell>
                                        <TableCell className="border-r border-gray-400 p-0 align-top h-16" colSpan={2}>
                                            <div className="flex w-full h-full">
                                                <span className="flex-1 border-r border-gray-400 p-2 text-center text-gray-600 font-bold flex items-center justify-center">{(igstAmt > 0) ? '0' : (gstRate / 2)}%</span>
                                                <span className="flex-1 p-2 text-right font-bold flex items-center justify-end"><Price amount={cgstAmt} showDecimals /></span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-400 p-0 align-top h-16" colSpan={2}>
                                            <div className="flex w-full h-full">
                                                <span className="flex-1 border-r border-gray-400 p-2 text-center text-gray-600 font-bold flex items-center justify-center">{(igstAmt > 0) ? '0' : (gstRate / 2)}%</span>
                                                <span className="flex-1 p-2 text-right font-bold flex items-center justify-end"><Price amount={sgstAmt} showDecimals /></span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-400 p-0 align-top h-16" colSpan={2}>
                                            <div className="flex w-full h-full">
                                                <span className="flex-1 border-r border-gray-400 p-2 text-center text-gray-600 font-bold flex items-center justify-center">{(igstAmt > 0) ? gstRate : '0'}%</span>
                                                <span className="flex-1 p-2 text-right font-bold flex items-center justify-end"><Price amount={igstAmt} showDecimals /></span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right p-2 align-top font-black text-xs text-black"><Price amount={taxableValue} showDecimals /></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Totals & Signature Section */}
                <div className="grid grid-cols-[1.2fr_1fr]">
                    <div className="p-4 space-y-6 border-r border-gray-400">
                        <div>
                            <p className="font-bold text-[9px] uppercase text-gray-400 mb-1 tracking-widest">Total In Words</p>
                            <p className="font-black italic text-xs leading-tight capitalize text-gray-900 border-l-2 border-black pl-3 py-1 bg-gray-50/50 rounded-r">
                                Indian Rupee {numberToWords(invoice.totalAmount)}
                            </p>
                        </div>

                        <div className="grid grid-cols-[1fr_0.5fr] gap-4">
                            <div className="space-y-1">
                                <p className="font-bold uppercase text-[9px] text-gray-500 border-b pb-1 mb-2 tracking-widest">Payment Details</p>
                                <div className="text-[10px] space-y-1 leading-tight">
                                    <p className="font-black uppercase leading-none mb-1 text-black">{invoice.supplier.legalName}</p>
                                    <p><span className="font-bold">PAN -</span> {invoice.supplier.gstin.substring(2, 12)}</p>
                                    <p><span className="font-bold text-gray-900 underline decoration-primary underline-offset-1">HDFC BANK LTD</span>, BARODA</p>
                                    <p><span className="font-bold">A/c No -</span> 5020006094XXXX</p>
                                    <p><span className="font-bold">IFSC -</span> HDFC0000033</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center border border-gray-200 rounded p-2 bg-gray-50/50 shadow-sm">
                                <div className="h-16 w-16 bg-white border border-gray-100 rounded flex items-center justify-center grayscale opacity-60">
                                    <div className="grid grid-cols-3 gap-0.5 opacity-20">
                                        {[...Array(9)].map((_, i) => <div key={i} className="w-2 h-2 bg-black"></div>)}
                                    </div>
                                </div>
                                <p className="text-[7px] font-black mt-1 uppercase text-gray-400 tracking-tighter">Scan to Pay</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-[8px] font-black uppercase text-gray-400 mb-2 tracking-widest leading-none">Terms & Conditions</p>
                            <ul className="text-[8px] text-gray-600 list-disc pl-4 italic space-y-1 font-medium leading-snug">
                                <li>Tax rates are indicative and subject to change per governement regulations.</li>
                                <li>All disputes are subject to <span className="font-black uppercase text-black">{invoice.supplier.address.city}</span> jurisdiction.</li>
                                <li>Goods once sold will not be taken back or exchanged.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col bg-gray-50/10 h-full">
                        <div className="grid grid-cols-[140px_1fr] border-b border-gray-400 p-0 text-xs shadow-sm">
                            <div className="p-2 border-r border-gray-400 font-bold space-y-3 text-right pr-4 text-[10px] text-gray-500 uppercase tracking-tight">
                                <p>SUB TOTAL</p>
                                {Object.values(taxGroupings).map((tax: any) => (
                                    <React.Fragment key={`${tax.rate}_${tax.type}`}>
                                        {tax.type === 'IGST' ? (
                                            <p>IGST {tax.rate}%</p>
                                        ) : (
                                            <>
                                                <p>CGST {tax.rate / 2}%</p>
                                                <p>SGST {tax.rate / 2}%</p>
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}
                                <p>SHIPPING</p>
                                {(invoice as any).discount > 0 && <p className="text-primary font-black">DISCOUNT { (invoice as any).couponCode ? `(${ (invoice as any).couponCode })` : '' }</p>}
                                <div className="pt-4 mt-2 border-t border-gray-200">
                                    <p className="text-sm font-black text-black tracking-tighter">TOTAL</p>
                                    <p className="text-sm font-black text-black mt-2">BALANCE DUE</p>
                                </div>
                            </div>
                            <div className="p-2 text-right font-black space-y-3 text-xs text-black tracking-tight bg-white/50">
                                <p><Price amount={invoice.subtotal || 0} showDecimals /></p>
                                {Object.values(taxGroupings).map((tax: any) => (
                                    <React.Fragment key={`val_${tax.rate}_${tax.type}`}>
                                        {tax.type === 'IGST' ? (
                                            <p><Price amount={tax.igst || 0} showDecimals /></p>
                                        ) : (
                                            <>
                                                <p><Price amount={tax.cgst || 0} showDecimals /></p>
                                                <p><Price amount={tax.sgst || 0} showDecimals /></p>
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}
                                <p className="text-gray-400">FREE</p>
                                {(invoice as any).discount > 0 && <p className="text-primary">- <Price amount={(invoice as any).discount} showDecimals /></p>}
                                <div className="pt-4 mt-2 border-t border-gray-300">
                                    <p className="text-sm font-black text-black"><Price amount={invoice.totalAmount || 0} showDecimals /></p>
                                    <div className="border-b-4 border-double border-blue-900 pb-1 mt-1 inline-block ml-auto w-full">
                                        <p className="text-sm font-black text-black"><Price amount={invoice.totalAmount || 0} showDecimals /></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-4 flex flex-col justify-between items-start bg-white border-t border-gray-400">
                            <div>
                                <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Total Amount (in words)</p>
                                <p className="text-[11px] font-black italic text-black leading-tight border-b border-gray-200 pb-1">{numberToWords(invoice.totalAmount)}</p>
                            </div>

                            <div className="w-full flex flex-col items-center mt-4">
                                <div className="text-center">
                                    <p className="font-bold uppercase text-[9px] text-gray-400 tracking-widest mb-1">Authenticated By</p>
                                    <p className="font-black uppercase text-xs leading-none text-black tracking-tight">{invoice.supplier.tradeName}</p>
                                </div>
                                <div className="relative py-4">
                                    <div className="h-16 w-36 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center italic text-gray-200 text-[9px] bg-gray-50/20 uppercase font-black tracking-widest shadow-inner">Digital Stamp / Signature</div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none opacity-5 flex flex-col items-center">
                                        <Logo className="h-12 w-auto grayscale" />
                                        <p className="text-[6px] font-black uppercase text-black">Curevan Verified</p>
                                    </div>
                                </div>
                                <p className="font-black uppercase text-[11px] border-t-2 border-gray-900 w-full text-center pt-2 tracking-tighter bg-white shadow-sm">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HSN Summary Table Section */}
                <div className="border-t border-gray-400 bg-white">
                    <div className="bg-gray-100 p-2 font-black uppercase text-[9px] tracking-widest border-b border-gray-400 text-center text-gray-600">HSN/SAC Tax Liability Summary</div>
                    <Table className="border-0">
                        <TableHeader>
                            <TableRow className="bg-white hover:bg-white h-10 border-b border-gray-400">
                                <TableHead className="border-r border-gray-400 font-bold p-2 text-black uppercase text-[8px] w-24">HSN/SAC</TableHead>
                                <TableHead className="border-r border-gray-400 text-right font-bold p-2 text-black uppercase text-[8px]">Taxable Amount</TableHead>
                                <TableHead className="border-r border-gray-400 text-center p-0 font-bold text-black uppercase text-[8px]" colSpan={2}>
                                    <div className="border-b border-gray-200 w-full py-1">CGST</div>
                                    <div className="flex w-full">
                                        <span className="flex-1 border-r border-gray-200 py-1">Rate</span>
                                        <span className="flex-1 py-1">Amount</span>
                                    </div>
                                </TableHead>
                                <TableHead className="border-r border-gray-400 text-center p-0 font-bold text-black uppercase text-[8px]" colSpan={2}>
                                    <div className="border-b border-gray-200 w-full py-1">SGST</div>
                                    <div className="flex w-full">
                                        <span className="flex-1 border-r border-gray-200 py-1">Rate</span>
                                        <span className="flex-1 py-1">Amount</span>
                                    </div>
                                </TableHead>
                                <TableHead className="border-r border-gray-400 text-center p-0 font-bold text-black uppercase text-[8px]" colSpan={2}>
                                    <div className="border-b border-gray-200 w-full py-1">IGST</div>
                                    <div className="flex w-full">
                                        <span className="flex-1 border-r border-gray-200 py-1">Rate</span>
                                        <span className="flex-1 py-1">Amount</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-bold p-2 text-right text-black uppercase text-[8px] w-32">Total Tax</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hsnSummary.map((tax: any) => (
                                <TableRow key={tax.rate} className="border-b last:border-0 border-gray-300 hover:bg-transparent">
                                    <TableCell className="border-r border-gray-400 font-mono p-2 text-[10px] text-gray-500">{Object.keys(taxGroupings).length > 1 ? 'Various' : invoice.items[0]?.hsnCode}</TableCell>
                                    <TableCell className="border-r border-gray-400 text-right p-2 font-bold"><Price amount={tax.taxable} showDecimals /></TableCell>
                                    <TableCell className="border-r border-gray-400 p-0" colSpan={2}>
                                        <div className="flex w-full">
                                            <span className="flex-1 border-r border-gray-200 p-2 text-center text-gray-400">{tax.igst > 0 ? '0' : tax.rate / 2}%</span>
                                            <span className="flex-1 p-2 text-right font-bold"><Price amount={tax.igst > 0 ? 0 : tax.cgst} showDecimals /></span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="border-r border-gray-400 p-0" colSpan={2}>
                                        <div className="flex w-full">
                                            <span className="flex-1 border-r border-gray-200 p-2 text-center text-gray-400">{tax.igst > 0 ? '0' : tax.rate / 2}%</span>
                                            <span className="flex-1 p-2 text-right font-bold"><Price amount={tax.igst > 0 ? 0 : tax.sgst} showDecimals /></span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="border-r border-gray-400 p-0" colSpan={2}>
                                        <div className="flex w-full">
                                            <span className="flex-1 border-r border-gray-200 p-2 text-center text-gray-400">{tax.rate}%</span>
                                            <span className="flex-1 p-2 text-right font-bold"><Price amount={tax.igst} showDecimals /></span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right p-2 font-black text-black"><Price amount={tax.cgst + tax.sgst + tax.igst} showDecimals /></TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-gray-100 font-black border-t-2 border-gray-400 h-10">
                                <TableCell className="border-r border-gray-400 p-2 uppercase tracking-tight text-[9px] text-gray-600">Grand Total liability</TableCell>
                                <TableCell className="border-r border-gray-400 text-right p-2"><Price amount={invoice.subtotal} showDecimals /></TableCell>
                                <TableCell className="border-r border-gray-400 p-2 text-right" colSpan={2}><Price amount={invoice.cgstTotal} showDecimals /></TableCell>
                                <TableCell className="border-r border-gray-400 p-2 text-right" colSpan={2}><Price amount={invoice.sgstTotal} showDecimals /></TableCell>
                                <TableCell className="border-r border-gray-400 p-2 text-right" colSpan={2}><Price amount={invoice.igstTotal} showDecimals /></TableCell>
                                <TableCell className="text-right p-2 text-black font-black bg-white border-l border-gray-400"><Price amount={invoice.totalTax} showDecimals /></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="text-center p-8 border-t mt-4 border-gray-100 print:border-none">
                <p className="text-xl font-black text-black tracking-tighter">Visit our official portal - <span className="text-primary underline underline-offset-8 decoration-4">www.curevan.com</span></p>
                <div className="flex justify-center gap-12 mt-4">
                    <p className="text-[9px] uppercase font-black text-gray-300 tracking-[0.3em]">Integrity</p>
                    <p className="text-[9px] uppercase font-black text-gray-300 tracking-[0.3em]">Quality</p>
                    <p className="text-[9px] uppercase font-black text-gray-300 tracking-[0.3em]">Care</p>
                </div>
                <p className="text-[7px] uppercase font-medium text-gray-400 mt-6 tracking-widest leading-none">This document is electronically generated and verified by Curevan Healthcare Systems.</p>
            </div>
        </Card>
    );
}
