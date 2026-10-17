// Payouts are worked out on the server (src/services/payoutService.js in the backend): tier fee, GST on the fee, TDS,
// the weekly batches and their approval. Nothing is calculated in the browser any more.
export { createPayoutItemForBooking } from '@/lib/actions';
