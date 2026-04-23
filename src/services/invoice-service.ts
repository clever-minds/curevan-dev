

import type { Order, Appointment, Invoice as InvoiceType } from '@/lib/types';
import { getAppointmentById } from '@/lib/repos/appointments';
import { getOrderById, listOrders } from '@/lib/repos/orders';
import serverApi from "@/lib/repos/axios.server";
import { getToken } from "@/lib/auth";
const supplierDetails = {
  legalName: "Himaya Care Pvt. Ltd.",
  tradeName: "Curevan",
  address: {
    line1: "Office 704, Time Square, Vasna-Bhayli Main Rd",
    city: "Vadodara",
    state: "Gujarat",
    pin: "390012",
    country: "India"
  },
  gstin: "24AAICH1171N1ZG", // Example GSTIN
  phone: "+91 79 9060 213",
  email: "accounts@curevan.com"
};

interface InvoiceAddress {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}

const normalizeAddress = (addr: any): InvoiceAddress => ({
  id: addr?.id ?? 0,
  name: addr?.name ?? "",
  address: addr?.address ?? addr?.line1 ?? "",
  city: addr?.city ?? "",
  state: addr?.state ?? "",
  pincode: addr?.pincode ?? addr?.pin ?? "",
  phone: addr?.phone ?? ""
});

// A very basic number-to-words converter for Indian currency.
// NOTE: A production app should use a robust library for this.
function numberToWords(num: number): string {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    let digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
  };

  const numStr = num.toFixed(2);
  const [integerPart, fractionalPart] = numStr.split('.').map(Number);

  let words = '';
  if (integerPart > 9999999) words += inWords(Math.floor(integerPart / 10000000)) + ' crore ';
  if (integerPart > 99999) words += inWords(Math.floor((integerPart / 100000) % 100)) + ' lakh ';
  if (integerPart > 999) words += inWords(Math.floor((integerPart / 1000) % 100)) + ' thousand ';
  if (integerPart > 99) words += inWords(Math.floor((integerPart / 100) % 10)) + ' hundred ';
  if (integerPart % 100 > 0) words += (words ? 'and ' : '') + inWords(integerPart % 100);

  words = 'Rupees ' + words.charAt(0).toUpperCase() + words.slice(1);

  if (fractionalPart > 0) {
    words += ' and ' + inWords(fractionalPart) + ' paise';
  }

  return words + ' only.';
}
const getSafeDate = (date?: string | Date | null): string => {
  if (!date) return new Date().toISOString();

  if (typeof date === "string") {
    return new Date(date).toISOString();
  }

  if (date instanceof Date) {
    return date.toISOString();
  }

  return new Date().toISOString();
};



async function generateGoodsInvoiceData(order: any, invoice: any) {
  // Use most accurate totals from either 'invoice' (offical record) or 'source' (order data)
  const totalAmount = Number(order.total || (invoice.total_amount_paise / 100) || 0);
  const cgstTotal = Number(order.cgst || ((invoice.cgst_amount || 0) / 100) || 0);
  const sgstTotal = Number(order.sgst || ((invoice.sgst_amount || 0) / 100) || 0);
  const igstTotal = Number(order.igst || ((invoice.igst_amount || 0) / 100) || 0);
  const totalTaxFromApi = cgstTotal + sgstTotal + igstTotal;
  
  const orderSubtotal = Number(order.subtotal || order.taxable_value || (totalAmount - totalTaxFromApi));
  const orderDiscount = Number(order.coupon_discount || order.couponDiscount || 0);
  
  // Map items using already calculated backend values
  let calculatedSubtotal = 0;
  const items = (order.items || []).map((item: any) => {
    const qty = Number(item.qty || item.quantity || 1);
    const gstRate = Number(item.tax_rate_pct || item.gstPercent || 0);
    const isInclusive = item.is_tax_inclusive !== undefined ? Boolean(item.is_tax_inclusive) : (item.isTaxInclusive !== undefined ? Boolean(item.isTaxInclusive) : false);
    
    // Determine the unit price excluding GST
    let unitPriceExcl = Number(item.price_excl_gst);
    if (isNaN(unitPriceExcl) || unitPriceExcl === 0) {
        const rawPrice = Number(item.price || 0);
        unitPriceExcl = isInclusive ? (rawPrice / (1 + (gstRate / 100))) : rawPrice;
    }
    
    // Taxable Value for the line (Rate * Qty)
    const lineTaxableValue = Number(item.taxable_value || (unitPriceExcl * qty));
    calculatedSubtotal += lineTaxableValue;
    
    // Split taxes if present, otherwise calculate for UI if rate > 0
    const itemCgst = Number(item.cgst || 0);
    const itemSgst = Number(item.sgst || 0);
    const itemIgst = Number(item.igst || 0);
    const itemTotalTax = itemCgst + itemSgst + itemIgst;

    // Fallback: Calculate tax based on gstRate if missing
    let finalCgst = itemCgst;
    let finalSgst = itemSgst;
    let finalIgst = itemIgst;

    if (itemTotalTax === 0 && gstRate > 0) {
      const calculatedTax = (lineTaxableValue * (gstRate / 100));
      if (igstTotal > 0 || (order.shipping_address?.state && order.shipping_address?.state !== supplierDetails.address.state)) {
        finalIgst = calculatedTax;
      } else {
        finalCgst = calculatedTax / 2;
        finalSgst = calculatedTax / 2;
      }
    }

    return {
      ...item,
      id: item.id || item.sku,
      name: item.name || 'Product',
      hsnCode: item.hsnCode || '3004',
      quantity: qty,
      price: unitPriceExcl, // Rate (Exclusive)
      gstRate: gstRate,
      cgst: finalCgst,
      sgst: finalSgst,
      igst: finalIgst,
      taxableValue: lineTaxableValue // Amount (Taxable)
    };
  });

  // Calculate internal sum of taxes from items
  const itemsCgst = items.reduce((sum, i) => sum + i.cgst, 0);
  const itemsSgst = items.reduce((sum, i) => sum + i.sgst, 0);
  const itemsIgst = items.reduce((sum, i) => sum + i.igst, 0);
  const totalItemsTax = itemsCgst + itemsSgst + itemsIgst;

  // Final totals resolution: Use the larger of the two to ensure no missing tax
  const finalCgstTotal = Math.max(cgstTotal, itemsCgst);
  const finalSgstTotal = Math.max(sgstTotal, itemsSgst);
  const finalIgstTotal = Math.max(igstTotal, itemsIgst);
  const finalTotalTax = finalCgstTotal + finalSgstTotal + finalIgstTotal;

  // Source of Truth for the Final Amount
  const resolvedTotal = totalAmount || (calculatedSubtotal + finalTotalTax - orderDiscount);

  return {
    ...invoice,
    supplier: supplierDetails,
    customer: {
      name: order.customer_name || order.customerName || "Customer",
      shippingAddress: normalizeAddress(order.shipping_address || order.shippingAddress),
      billingAddress: normalizeAddress(order.billing_address || order.billingAddress)
    },
    invoiceNumber: invoice.invoice_number || invoice.invoiceNumber || `INV-${invoice.id}`,
    issuedAt: getSafeDate(invoice.issued_at || invoice.issuedAt),
    invoiceDate: getSafeDate(invoice.issued_at || invoice.issuedAt),
    placeOfSupply: order.shipping_address?.state || order.shippingAddress?.state || "Gujarat",
    items,
    subtotal: calculatedSubtotal, // Sum of all item "Amount"
    totalTax: finalTotalTax,
    cgstTotal: finalCgstTotal,
    sgstTotal: finalSgstTotal,
    igstTotal: finalIgstTotal,
    discount: orderDiscount,
    couponCode: order.coupon_code || order.couponCode || null,
    totalAmount: resolvedTotal,
    amountInWords: numberToWords(resolvedTotal)
  };
}




function generateServiceInvoiceData(appointment: Appointment, invoice: InvoiceType) {
  // Convert Paise to Rupees for consistency
  const totalAmountRupees = (invoice as any).total_amount_paise ? ((invoice as any).total_amount_paise / 100) : (invoice.totalAmountPaise / 100);
  const subtotalRupees = appointment.serviceAmount || (totalAmountRupees / 1.18);
  const totalTaxRupees = totalAmountRupees - subtotalRupees;

  return {
    ...invoice,
    supplier: supplierDetails,
    customer: { 
      name: appointment.patientName, 
      billingAddress: normalizeAddress(appointment.serviceAddress), 
      shippingAddress: normalizeAddress(appointment.serviceAddress) 
    },
    invoiceNumber: (invoice as any).invoice_number || invoice.invoiceNumber || `INV-${invoice.id}`,
    invoiceDate: getSafeDate((invoice as any).issued_at || invoice.issuedAt as any),
    placeOfSupply: `${appointment.serviceAddress?.city || ''}, ${appointment.serviceAddress?.state || ''}`,
    items: [{
      id: appointment.id,
      name: appointment.therapyType || 'Physiotherapy Service',
      quantity: 1,
      price: subtotalRupees,
      gstRate: 18,
      hsnCode: '99834',
      cgst: totalTaxRupees / 2,
      sgst: totalTaxRupees / 2,
      taxableValue: subtotalRupees
    }],
    subtotal: subtotalRupees, 
    totalTax: totalTaxRupees, 
    cgstTotal: totalTaxRupees / 2, 
    sgstTotal: totalTaxRupees / 2, 
    igstTotal: 0,
    totalAmount: totalAmountRupees, 
    amountInWords: numberToWords(totalAmountRupees)
  };
}


// export async function getInvoiceById(invoiceId: string) {
//     const invoiceRef = db.collection('invoices').doc(invoiceId);
//     const invoiceSnap = await invoiceRef.get();

//     if (!invoiceSnap.exists) {
//         console.warn(`No invoice found with ID: ${invoiceId}`);
//         return null;
//     }
//     const invoice = invoiceSnap.data() as InvoiceType;
//     const sourceId = invoice.source.orderId || invoice.source.bookingId;

//     if (!sourceId) {
//         console.error(`Invoice ${invoiceId} has no source order or booking ID.`);
//         return null;
//     }

//     if (invoice.source.orderId) {
//         const order = await getOrderById(sourceId);
//         if (!order) return null;
//         return await generateGoodsInvoiceData(order, invoice);
//     }

//     if (invoice.source.bookingId) {
//         const appointment = await getAppointmentById(sourceId);
//         if (!appointment) return null;
//         return generateServiceInvoiceData(appointment, invoice);
//     }

//     return null;
// }

export async function getInvoiceById(invoiceId: string | number) {
  try {
    console.log("Fetching invoice for ID:", invoiceId);
    const token = await getToken();
    if (!token) {
      throw new Error('Token missing, please login again');
    }
    const response = await serverApi.get(`/api/orders/invoice/${invoiceId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const apiData = response.data.data;
    const invoice = apiData.invoice;
    let orderData = apiData.source;

    if (!invoice) {
        console.error("INVOICE FETCH ERROR: Invoice object missing in response data.");
        return null;
    }

    if (apiData.type === 'order' || invoice.order_id) {
      const sourceIdValue = invoice.order_id || invoice.source?.orderId;
      console.log(`RESOLVING ORDER: Invoice ${invoiceId}, Source ID: ${sourceIdValue}`);

      if (!orderData) {
          try {
            const orderRes = await serverApi.get(`/api/orders/${sourceIdValue}`, {
              withCredentials: true,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            orderData = orderRes.data.data;
          } catch (err: any) {
             // Fallbacks already covered in logic or handled by sister 'source' object
          }
      }

      if (!orderData) {
          console.error("INVOICE CRITICAL ERROR: Could not resolve source order data.");
          return null;
      }

      return await generateGoodsInvoiceData(orderData, invoice);
    }

    if (apiData.type === 'booking' || invoice.booking_id) {
      const bookingId = invoice.booking_id || invoice.source?.bookingId;
      if (!orderData) {
          const appointmentRes = await serverApi.get(`/api/appointments/${bookingId}`, {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          orderData = appointmentRes.data;
      }
      if (!orderData) return null;
      return generateServiceInvoiceData(orderData, invoice);
    }

    return null;
  } catch (error: any) {
    console.error("GET INVOICE ERROR:", {
      invoiceId,
      message: error?.message,
      response: error?.response?.data
    });
    return null;
  }
}

// Export the type for use in components
export type InvoiceData = Awaited<ReturnType<typeof generateGoodsInvoiceData>> | ReturnType<typeof generateServiceInvoiceData>;
