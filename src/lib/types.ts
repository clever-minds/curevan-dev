

export type Role = 'admin' | 'therapist' | 'patient';

// --- Core User & Auth ---
export interface AppUser {
  id: number;
  email?: string | null;
  role: Role;
  roles?: string[]; // For granular admin roles
  name?: string | null;
}

// export interface UserProfile {
//   id: number;
//   email: string;
//   role: Role;
//   roles?: string[];
//   name: string;
//   phone?: string;
//   createdAt?: Date | string | null;
//   address?: Address;
// }

export interface UserProfile {
  id: number;
  uid: string; // Firebase UID
  email: string;
  role: Role;
  roles?: string[];
  name: string;
  phone?: string;
  role_name?: string; // For display purposes (e.g., "admin.super" => "Super Admin")

  createdAt?: Date  | null;
  addresses?: Address[];
  shipping_address_id?: number;
  billing_address_id?: number;
}


export interface PatientProfile {
  number: string;
  mrn: string; // Medical Record Number
  dob: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  allergies?: string[];
  conditions?: string[];
  meds?: string[];
  lastVisitSummary?: string;
}

export interface Therapist {
  id: number; // This is the user UID
  user_id:number;
  name: string;
  specialty: string;
  registrationNo:string,
  bankAccountNo:string,
  bankIfscCode:string,
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  position: GeoPoint;
  lat:number;
  lng:number;
  rating: number;
  fullAddress:string;
  reviews: number;
  image: string;
  experience: number; // in years
  bio: string;
  qualifications: string;
  isProfilePublic?: boolean;
  profileViewCount?: number;
  serviceTypes: string[]; // Array of ServiceType IDs
  clinicId?: string;
  referralCode?: string;
  referralDiscountRate?: number;
  referralCommissionRate?: number;
  referralActive?: boolean;
  availability?: any;
  hourlyRate?: number;
  membershipPlan?: 'standard' | 'premium';
  platformFeePct?: number;
  isHighlighted?: boolean;
  distance?:number;
  tax?: {
    pan: string;
    panVerified?: boolean;
    lastPanUpdatedAt?: Date;
  }
}


// --- Services & Scheduling ---
export interface ServiceType {
  id: string;
  name: string;
  basePrice: number;
  durationMin: number;
  modeAllowed: ('home' | 'online' | 'clinic')[];
  isActive: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  address: Address;
  geo: GeoPoint;
  hours: Record<string, string>; // e.g., { mon: "9am-5pm", ... }
  contact: string;
  isActive: boolean;
}

export interface TherapistAvailability {
  therapistId: string;
  date: Date; // Start of day
  mode: ('home' | 'online' | 'clinic')[];
  slots: { start: Date; end: Date }[];
  isAvailable: boolean;
  updatedAt: Date;
}

export interface Appointment {
  id: number;
  patientId: number;
  dateofBirth:string;
  patientName: string;
  patientPhone?: string;
  therapistId: number;
  therapist: string;
  therapistPhone?: string;
  serviceTypeId: string;
  therapyType: string;
  serviceAmount?: number;
  totalAmount?: number;
  clinicId?: string;
  startTime?: Date ;
  endTime?: Date ;
  date: string;
  time: string;
  mode: 'home' | 'online' | 'clinic';
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No-Show';
  cancellationReason?: string | null;
  notes?: string;
  addressId?: number;
  createdAt: Date;
  serviceAddress?: Address;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded' | 'Failed';
  pcrStatus: 'not_started' | 'in_progress' | 'submitted' | 'locked' | 'returned' | 'Draft';
  verificationStatus: 'Verified' | 'Not Verified';
}

// --- E-commerce & Products ---
export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  longDescription?: string;
  categoryId: number;
  brand?: string;
  tags?: string[];
  featuredImage: string;
  images?: string[];
  price: number;
  mrp?: number;
  isActive: boolean;
  isCouponExcluded?: boolean;
  rating: number;
  sku: string;
  stock: number;
  reorderPoint: number;
  hsnCode: string;
  categoryname: string;
  // New fields for India compliance
  manufacturer?: string;
  packer?: string;
  importer?: string;
  countryOfOrigin?: string;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  dimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>; // { size: "L", color: "Blue" }
  mrp: number;
  price: number;
  taxCode: string; // HSN/SAC
  stockQty: number;
  isActive: boolean;
}

export interface Inventory {
  id:number,
  sku: string;
  productId: number;
  warehouseId?: string;
  onHand: number;
  reserved: number;
  reorderPoint?: number;
  updatedAt: string;
}


// --- Orders & Fulfillment ---
export interface Cart {
  number: string;
  items: { sku: string; qty: number; priceAtAdd: number }[];
  updatedAt: Date;
}

export interface CartItem extends Product {
  id:number;
  quantity: number
  productId: number;
}
interface InvoiceAddress {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
}
export interface Order {
  id: number;
  number: string;
  userId: number;
  customerName: string;
  customerPhone?: string;
  items: { 
    sku: string; 
    name: string; 
    qty: number; 
    price: number; 
    mrp: number;
    hsnCode: string;
    taxRatePct: number;
    featuredImage: string 
  }[];
  invoiceId:number;
  shippingAddress: Address;
  billingAddress: Address;

  
  subtotal: number;
  taxableValue?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalTax?: number;
  total: number;
  status: 'Placed' | 'Paid' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  createdAt: Date ;
  deliveredAt?: string | null;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded' | 'Failed';
  paymentTxnId?: string;
  couponCode?: string;
  couponId?: string;
  couponDiscount?: number;
  referredTherapistId?: string;
  commissionAmount?: number;
  commissionState?: 'onHold' | 'inBatch' | 'paid' | 'na';
  shiprocketOrderId?: number;
}

export interface Shipment {
  id: number; // Our internal shipment ID
  orderId: number;
  awb: string;
  carrier: string;
  createdAt: Date;
  customerName: string;
  cityState: string;
  status: 'Pending Pickup' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'NDR' | 'RTO' | 'Cancelled';
  eta: string;
  promisedDate?: Date;
  deliveredAt?: string;
  slaBreached: boolean;
  events?: { time: string; location: string; description: string, code?: string, raw?: any }[];
  provider?: "shiprocket";
  shiprocketShipmentId?: number;
  shiprocketOrderId?: number;
  trackingUrl?: string;
  labelUrl?: string;
  manifestUrl?: string;
  charges?: { shipping: number; codFee?: number; fuelSurcharge?: number; total: number };
  package?: { weightKg: number; lengthCm: number; widthCm: number; heightCm: number; volumetricWeight: number };
  pickup?: { addressId: string; scheduledAt: string };
  reverse?: boolean;
  idempotencyKey?: string;
}


export interface Return {
  id: string; // RMA Number
  orderId: string;
  customerName: string;
  cityState: string;
  items: { sku: string; name: string; qty: number; price: number }[];
  reason: 'Defective' | 'Wrong Item' | 'Not Needed' | 'Damaged';
  method: 'pickup' | 'drop-off';
  status: 'Requested' | 'Approved' | 'Pickup Scheduled' | 'In Transit' | 'Received' | 'Inspected' | 'Refunded' | 'Rejected' | 'Closed';
  refundStatus: 'Pending' | 'Processing' | 'Refunded' | 'Failed';
  totalRefundAmount: number;
  createdAt: Date;
}


// --- Payments, Payouts & Invoicing ---
export interface PayoutItem {
  id?: string;
  type: 'service' | 'product';
  sourceId: number;
  therapistId: number;
  patientId: number;
  serviceTypeId: string;
  grossAmount: number;
  platformFeePct: number;
  platformFeeAmount: number;
  gstOnPlatformFee?: number;
  preTdsPayable?: number;
  tdsDeducted?: number;
  netAmount: number; // Renamed from netPayable for clarity
  currency: 'INR';
  state: 'onHold' | 'inBatch' | 'paid' | 'disputed';
  weekStart: string; // ISO string of the Monday of the week
  createdAt: Date;
  membershipPlanSnapshot: 'standard' | 'premium';
  therapistName?: string; // Added for easier reporting
  therapistPan?: string; // Added for easier reporting
}


export interface PayoutBatch {
  id: string;
  therapistId: string;
  weekStart: Date;
  weekEnd: Date;
  payoutDate: Date;
  totals: { gross: number; commission: number; penalties: number; net: number };
  status: 'draft' | 'processing' | 'paid' | 'onHold';
  payoutRef?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'issued' | 'draft' | 'cancelled';
  number: string;
  source: { orderId?: string; bookingId?: string };
  issuedAt: Date ;
  totalAmountPaise: number;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  referenceInvoiceId: string;
  reason: string;
  status: 'issued';
  number: string;
  meta: { issuedAt: Date; createdBy: string };
  totalAmountPaise: number;
}

export interface InvoiceSequence {
    id: string; // e.g., INV-G-2025-26
    series: 'INV-G' | 'INV-S' | 'CN';
    financialYear: string;
    next: number;
}

export interface TaxSettings {
    id: 'active';
    supplier: { legalName: string; gstin: string; pan: string; cin: string; stateCode: string; address: Address; email: string; website: string };
    seriesConfig: { goods: string; services: string; credit: string };
    hsnSacCatalog: { code: string; label: string; defaultRatePct: number; type: 'good' | 'service' }[];
    gstRules: { defaultGoodsRatePct: number; defaultServiceRatePct: number; useShipToForGoods: boolean; useServiceAddressForServices: boolean };
}

// --- Records & Logs ---
export interface PCR { // Patient Care Report
  id: string; // bookingId
  patientId: string;
  therapistId: string;
  patientFullName: string;
  serviceTypeId: string;
  chiefComplaint: string;
  assessment: string;
  diagnosis?: string;
  treatmentProvided: string;
  planOfCare: string;
  vitals?: Record<string, string>; // bp, hr, rr, temp
  status: 'not_started' | 'in_progress' | 'submitted' | 'locked' | 'returned';
  lockedAt?: Date;
  lockedBy?: string;
  version: number;
  history: any[];
  createdAt: Date;
  incidentDate?: string;
  incidentLocation?: string;
  therapyType?: string;
  nextTreatmentDate?: string;
  attachment?: number[]; // array of attachment IDs
  therapistName?: string;
  signatureConfirmation?: boolean;
}

export interface Session {
    id: string; // bookingId
    bookingId: string;
    therapistId: string;
    startedAt: Date;
    endedAt: Date;
    durationMin: number;
    events: {type: string; at: Date; note: string}[];
}

export interface PcrAmendmentRequest {
    id: string;
    bookingId: string;
    therapistId: string;
    reason: string;
    requestedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
}

export interface VerificationLog {
    bookingId: string;
    therapistId: string;
    method: 'OTP' | 'QR' | 'GEOFENCE' | 'ADMIN';
    success: boolean;
    verifiedAt: Date;
    meta?: Record<string, any>;
}

export interface ConsentLog {
    number: string;
    consentType: 'terms' | 'privacy' | 'medical' | 'marketing';
    version: string;
    acceptedAt: Date;
    ip: string;
    userAgent: string;
}

// --- Support & System ---
export interface Notification {
  id: string;
  number: string;
  type: 'booking_confirmed' | 'therapist_on_way' | 'reminder' | 'payment_receipt' | 'new_review' | 'profile_approved';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface SOSAlert {
  id: string;
  therapistId: string;
  bookingId: string;
  location: GeoPoint;
  status: 'active' | 'resolved';
  triggeredAt: Date;
  resolvedAt?: Date;
}

export interface SupportTicket {
    id: string;
    number: string;
    topic: string;
    subject: string;
    bookingId?: string;
    orderId?: string;
    status: 'open' | 'pending' | 'escalated' | 'closed';
    updatedAt: string;
    messages?: { by: 'user' | 'admin'; at: string; text: string }[];
    createdAt?: Date;
    closedBy?: string;
    closedAt?: string;
}

export interface PaymentTransaction {
    id: string;
    ref: string;
    number: string;
    orderId?: string;
    bookingId?: string;
    amount: number;
    currency: string;
    status: 'paid' | 'failed';
    gateway: 'razorpay';
    createdAt: Date;
}

export interface AuditLog {
    id?: number;
    actorId: string; // "system" or a user UID
    action: string; // e.g., "payout.item.created"
    entityType: "booking" | "pcr" | "user" | "order" | "invoice" | "payoutBatch" | "profileChangeRequest" | "sosAlert";
    entityId: number;
    timestamp?: Date;
    details?: Record<string, any>;
}

export interface AIFeedback {
    id: string;
    timestamp: Date;
    number: string;
    context: 'chat_assistant' | 'pcr_refinement' | 'dashboard_summary' | 'content_generation';
    interactionId: string; // Unique ID for the specific AI query/response pair
    rating: 'positive' | 'negative';
    query?: string; // The user's query
    response?: string; // The AI's response
    userComment?: string;
}


// --- Config & Setup ---
export interface CommissionPenalty {
  planType: 'free' | 'premium';
  commissionRate: number;
  rules: { condition: string; penalty: number }[];
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface Coupon {
  id: number;
  code: string;
  therapistId?: number; // owner/referrer
  discountType: 'percent' | 'flat';
  value: number;
  permanent?: boolean;
  appliesTo?: { categories?: string[]; skus?: string[] };
  active: boolean;
  createdAt?: Date ;
  status?: 'Active' | 'Paused' | 'Expired' | 'Scheduled';
  usageLimit?: number | null;
}

export interface TaxSettings {
    id: 'active';
    supplier: { legalName: string; gstin: string; pan: string; cin: string; stateCode: string; address: Address; email: string; website: string };
    seriesConfig: { goods: string; services: string; credit: string };
    hsnSacCatalog: { code: string; label: string; defaultRatePct: number; type: 'good' | 'service' }[];
    gstRules: { defaultGoodsRatePct: number; defaultServiceRatePct: number; useShipToForGoods: boolean; useServiceAddressForServices: boolean };
}

export interface ProfileChangeRequest {
    id: string;
    number: string;
    role: 'therapist' | 'patient';
    entityId: number;
    section: string;
    changes: { fieldPath: string; old: any; new: any }[];
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    reviewerId?: string;
    createdAt: Date;
    reviewedAt?: string;
    attachments?: any[];
}


// --- Content Types ---
export interface JournalEntry {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  aiHint?: string;
  authorId: string;
  authorName: string;
  status: "draft" | "pending_review" | "published" | "archived";
  tags?: string[];
  videoUrl?: string;
  metaDescription?: string;   // ✅ add this
  publishedAt?: string;
  createdAt: Date;
  updatedAt: Date;
  categories: string;
  featuredImageId?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  stats?: { totalViews?: number; uniqueViews?: number };
}

export interface Training {
    id: string;
    title: string;
    slug: string;
    status: "draft" | "review" | "published" | "archived";
    categoryIds: string[];
    tags?: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    durationMin: number;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    attachments?: {name: string, url: string, type: string}[];
    authorId: string;
    readingTimeMin?: number;
    viewCount?: number;
    createdAt: Date;
    updatedAt: string;
    publishedAt?: string;
}

export interface Documentation {
    id: string;
    title: string;
    slug: string;
    status: "draft" | "review" | "published" | "archived";
    categoryIds: string[];
    tags?: string[];
    sopVersion: string;
    lastReviewedAt?: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    authorId: string;
    readingTimeMin?: number;
    viewCount?: number;
    createdAt: Date;
    updatedAt: string;
    publishedAt?: string;
}

export interface NewsletterSubscriber {
    id?: string; // Document ID is the email address
    email: string;
    status: 'pending' | 'active' | 'unsubscribed';
    createdAt: Date;
    confirmedAt?: Date;
    source: string; // e.g., 'footer', 'journal_popup'
    consentVersion: string; // e.g., 'v1.0'
    unsubToken: string;
    segments?: string[]; // e.g., ['patient', 'physiotherapy_interest']
}


// --- Utility Types ---
// export interface Date {
//   _seconds: number;
//   _nanoseconds: number;
// }



export interface Address {
  id:number;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  country: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T | null;
}

export interface ApplyCouponPayload {
  code: string;
  order_amount: number;
  category_id?: number;
  product_id?: number;
}

export interface ApplyCouponResponse {
  coupon_id: number;
  code: string;
  discount: number;
  final_amount: number;
}
// types/journal.ts
