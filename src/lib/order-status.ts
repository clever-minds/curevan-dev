// Order statuses arrive both capitalised (older rows: "Paid", "Shipped") and lowercase (courier pipeline: "in_transit"). One place reads both.
const key = (s?: string | null) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '_');

const LABELS: Record<string, string> = {
  placed: 'Placed', pending: 'Pending', paid: 'Paid', packed: 'Packed', awb_generated: 'Ready to ship', picked_up: 'Picked up', shipped: 'Shipped',
  in_transit: 'In transit', out_for_delivery: 'Out for delivery', delivered: 'Delivered', rto: 'Returning to seller', return_approved: 'Return approved',
  returned: 'Returned', cancelled: 'Cancelled', refunded: 'Refunded',
};

export const orderStatusLabel = (s?: string | null) => LABELS[key(s)] ?? String(s ?? '');

export function orderStatusClass(s?: string | null) {
  switch (key(s)) {
    case 'paid': case 'packed': case 'awb_generated': return 'bg-blue-100 text-blue-800';
    case 'picked_up': case 'shipped': case 'in_transit': case 'out_for_delivery': case 'delivered': return 'bg-green-100 text-green-800';
    case 'placed': case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'returned': case 'return_approved': case 'rto': return 'bg-orange-100 text-orange-800';
    case 'cancelled': case 'refunded': return 'bg-red-100 text-red-800';
    default: return 'secondary';
  }
}

export const isDelivered = (s?: string | null) => key(s) === 'delivered';
/** On its way or delivered: there is a tracking link to show. */
export const isInShipment = (s?: string | null) => ['picked_up', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'awb_generated'].includes(key(s));
/** Paid and a tracked invoice exists from here on. */
export const hasPaidInvoice = (s?: string | null) => ['paid', 'packed', 'awb_generated', 'picked_up', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(key(s));

export const RETURN_REASONS = [
  { code: 'damaged', label: 'Arrived damaged', photo: true },
  { code: 'defective', label: 'Not working / defective', photo: true },
  { code: 'wrong_item', label: 'Wrong item received', photo: false },
  { code: 'missing_part', label: 'Part missing', photo: false },
] as const;
