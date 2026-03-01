

import type { Order, Appointment, Invoice as InvoiceType } from '@/lib/types';
import { getAppointmentById } from '@/lib/repos/appointments';
import { getOrderById } from '@/lib/repos/orders';
import serverApi from "@/lib/repos/axios.server";

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



async function generateGoodsInvoiceData(order: Order, invoice: InvoiceType) {
    const totalAmount = invoice.totalAmountPaise;
    const subtotal = order.subtotal;
    const cgstTotal = order.cgst || 0;
    const sgstTotal = order.sgst || 0;
    const igstTotal = order.igst || 0;
    const totalTax = order.totalTax || (cgstTotal + sgstTotal + igstTotal);
    console.log("cgstTotal",totalTax);
    const discount=order.couponDiscount;
    const items = order.items.map((item: any) => {
        const taxableValue = item.price * item.qty;
        const taxAmount = taxableValue * (item.taxRatePct / 100);
        return { 
            ...item, 
            id: item.sku, 
            name: item.name, 
            price: item.price, 
            quantity: item.qty, 
            gstRate: item.taxRatePct, 
            hsnCode: item.hsnCode, 
            cgst: order.cgst ? taxAmount / 2 : 0, 
            sgst: order.sgst ? taxAmount / 2 : 0,
            igst: order.igst || 0
        };
    });

    return {
        supplier: supplierDetails,
            customer: {
                name: order.customerName?? "",
                shippingAddress: normalizeAddress(order.shippingAddress),
                billingAddress: normalizeAddress(order.billingAddress)
            },
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: getSafeDate(invoice.issuedAt as any),
        placeOfSupply: `${order.shippingAddress.city}, ${order.shippingAddress.state}`,
        items,discount,
        subtotal, totalTax, cgstTotal, sgstTotal, igstTotal,
        totalAmount, amountInWords: numberToWords(totalAmount / 100)
    };
}


function generateServiceInvoiceData(appointment: Appointment, invoice: InvoiceType) {
    const totalAmount = invoice.totalAmountPaise;
    const subtotal = (appointment.serviceAmount || totalAmount / 1.18) * 100;
    const totalTax = totalAmount - subtotal;

    return {
        supplier: supplierDetails,
        customer: { name: appointment.patientName, billingAddress: appointment.serviceAddress!, shippingAddress: appointment.serviceAddress! },
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: getSafeDate(invoice.issuedAt as any),
        placeOfSupply: `${appointment.serviceAddress?.city}, ${appointment.serviceAddress?.state}`,
        items: [{ 
            id: appointment.id,
            name: appointment.therapyType, 
            quantity: 1, 
            price: subtotal, 
            gstRate: 18, 
            hsnCode: '99834', 
            cgst: totalTax / 2, 
            sgst: totalTax / 2, 
        }],
        subtotal, totalTax, cgstTotal: totalTax / 2, sgstTotal: totalTax / 2, igstTotal: 0,
        totalAmount, amountInWords: numberToWords(totalAmount/100)
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

export async function getInvoiceById(invoiceId: number) {
  try {
    const response = await serverApi.get(`/api/orders/invoice/${invoiceId}`, {
      withCredentials: true, // ✅ cookie send karega automatically
    });

    const invoice: InvoiceType = response.data.data;
    // Source ID check
    const sourceId = invoice.source.orderId || invoice.source.bookingId;
    if (!sourceId) {
      console.error(`Invoice ${invoiceId} has no source order or booking ID.`);
      return null;
    }

    if (invoice.source.orderId) {
      // Fetch order
      const orderRes = await serverApi.get(`/api/orders/${sourceId}`, {
        withCredentials: true,
      });
            console.log("invoice",orderRes.data.data);

      const order: Order = orderRes.data.data   ;

      if (!order) return null;

      return generateGoodsInvoiceData(order, invoice);
    }

    if (invoice.source.bookingId) {
      // Fetch appointment
      const appointmentRes = await serverApi.get(`/api/appointments/${sourceId}`, {
        withCredentials: true,
      });
      const appointment: Appointment = appointmentRes.data;
      if (!appointment) return null;

      return generateServiceInvoiceData(appointment, invoice);
    }

    return null;
  } catch (error: any) {
    console.error("GET INVOICE ERROR:", error?.message || error);
    return null;
  }
}

// Export the type for use in components
export type InvoiceData = Awaited<ReturnType<typeof generateGoodsInvoiceData>> | ReturnType<typeof generateServiceInvoiceData>;
