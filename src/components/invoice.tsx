

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InvoiceData } from "@/services/invoice-service";
import Logo from "./logo";
import { Price } from "./money/price";


export function Invoice({ invoice }: { invoice: InvoiceData }) {

    return (
        <Card className="max-w-4xl mx-auto my-8 p-4 sm:p-8 print:shadow-none print:border-none">
            <CardHeader className="p-4 grid grid-cols-2 gap-4 items-start">
                <div>
                   <Logo />
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold text-primary">Tax Invoice</h1>
                    <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                    <p><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4">
                    <div>
                        <h3 className="font-semibold mb-2">Sold By:</h3>
                        <p className="font-bold">{invoice.supplier.legalName}</p>
                        <p>{invoice.supplier.address.line1}</p>
                        <p>{invoice.supplier.address.city}, {invoice.supplier.address.state} - {invoice.supplier.address.pin}</p>
                        <p><strong>GSTIN:</strong> {invoice.supplier.gstin}</p>
                    </div>
                    <div className="sm:text-right">
                        <div>
                            <h3 className="font-semibold mb-1">Billing Address:</h3>
                            <p className="font-bold">{invoice.customer.billingAddress?.name}</p>
                            <p>{invoice.customer.billingAddress?.address}</p>
                            <p>{invoice.customer.billingAddress?.city}, {invoice.customer?.billingAddress?.state} - {invoice.customer.billingAddress?.pincode}</p>
                        </div>
                        <div className="mt-2">
                             <h3 className="font-semibold mb-1">Shipping Address:</h3>
                            <p className="font-bold">{invoice.customer.shippingAddress.name}</p>
                            <p>{invoice.customer.shippingAddress.address}</p>
                            <p>{invoice.customer.shippingAddress.city}, {invoice.customer.shippingAddress.state} - {invoice.customer.shippingAddress.pin}</p>
                        </div>
                    </div>
                </div>
                <Separator/>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4">
                    <div><p><strong>Place of Supply:</strong> {invoice.placeOfSupply}</p></div>
                    <div className="sm:text-right"><p><strong>Place of Delivery:</strong> {invoice.placeOfSupply}</p></div>
                 </div>


                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>HSN/SAC</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        {item.name}
                                        <p className="text-xs text-muted-foreground">GST @ {item.gstRate}%</p>
                                    </TableCell>
                                    <TableCell>{item.hsnCode}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right"><Price amount={item.price } showDecimals /></TableCell>
                                    <TableCell className="text-right"><Price amount={(item.price * item.quantity) } showDecimals /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <Separator className="my-4"/>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="font-bold">Total In Words:</h4>
                        <p className="text-xs">{invoice.amountInWords}</p>
                    </div>
                   <div className="space-y-1">

                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span><Price amount={invoice.subtotal} showDecimals /></span>
                            </div>

                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                <span>Coupon Discount:</span>
                                <span>- <Price amount={invoice.discount} showDecimals /></span>
                                </div>
                            )}

                            <Separator className="my-1" />

                            {invoice.cgstTotal > 0 && (
                                <div className="flex justify-between">
                                <span>CGST:</span>
                                <span><Price amount={invoice.cgstTotal} showDecimals /></span>
                                </div>
                            )}

                            {invoice.sgstTotal > 0 && (
                                <div className="flex justify-between">
                                <span>SGST:</span>
                                <span><Price amount={invoice.sgstTotal} showDecimals /></span>
                                </div>
                            )}

                            {invoice.igstTotal > 0 && (
                                <div className="flex justify-between">
                                <span>IGST:</span>
                                <span><Price amount={invoice.igstTotal} showDecimals /></span>
                                </div>
                            )}

                            <Separator className="my-1" />

                            <div className="flex justify-between font-bold text-lg">
                                <span>Final Total:</span>
                                <span><Price amount={invoice.totalAmount} showDecimals /></span>
                            </div>

                            </div>

                </div>

            </CardContent>
            <Separator />
            <CardFooter className="p-4 text-xs text-muted-foreground">
                <div className="w-full">
                    <p className="font-bold">Terms & Conditions:</p>
                    <ul className="list-disc pl-4">
                        <li>This is a computer generated invoice and does not require a physical signature.</li>
                        <li>All disputes are subject to Vadodara jurisdiction only.</li>
                    </ul>
                     <div className="text-right mt-8">
                        <p className="font-semibold">For {invoice.supplier.tradeName}</p>
                        <div className="h-12"></div>
                        <p>Authorized Signatory</p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
