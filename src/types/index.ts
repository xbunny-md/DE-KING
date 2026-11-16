import type { Timestamp } from 'firebase/firestore';

export type AccountType = 'personal' | 'business';
export type UserRole = 'buyer' | 'seller' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export type ProductCategory =
  | 'electronics'
  | 'motors'
  | 'fashion'
  | 'collectibles-and-art'
  | 'sports'
  | 'health-and-beauty'
  | 'industrial-equipment'
  | 'home-and-garden';

export type ProductCondition = 'new' | 'like-new' | 'excellent' | 'good' | 'fair';
export type BuyingFormat = 'buy-now' | 'outlet-deal' | 'bulk';
export type ProductStatus = 'active' | 'draft' | 'sold-out' | 'archived';

export type PaymentMethod = 'visa' | 'mastercard' | 'mpesa' | 'paypal' | 'gift-card';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type GiftCardTheme = 'obsidian' | 'champagne' | 'cobalt' | 'celebration';
export type GiftCardStatus = 'active' | 'partially-used' | 'redeemed' | 'void';

export type TicketType = 'general' | 'return' | 'missing-item' | 'account' | 'billing';
export type TicketStatus = 'open' | 'in-review' | 'resolved' | 'closed';

export type CurrencyCode = 'USD' | 'TZS' | 'KES' | 'UGX';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  accountType: AccountType;
  businessName?: string;
  phone?: string;
  shipToCountry: string;
  postalCode?: string;
  addressLine?: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AdminRecord {
  uid: string;
  email: string;
  grantedBy: string;
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  brand: string;
  countryOfOrigin: string;
  condition: ProductCondition;
  buyingFormat: BuyingFormat;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  durationDays: number;
  imageUrl: string;
  isFeatured: boolean;
  isDeal: boolean;
  isOutlet: boolean;
  sellerId: string;
  sellerName: string;
  status: ProductStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerId: string;
  quantity: number;
  addedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SavedItem {
  productId: string;
  title: string;
  price: number;
  category: string;
  imageUrl: string;
  savedAt: Timestamp;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  shippingCountry: string;
  postalCode: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  giftCardCode?: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  itemCount: number;
  status: OrderStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  orderId: string;
  productId: string;
  sellerId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
}

export interface GiftCard {
  code: string;
  amount: number;
  balance: number;
  recipientEmail?: string;
  recipientName: string;
  message?: string;
  designTheme: GiftCardTheme;
  purchaserId: string;
  redeemedBy?: string;
  status: GiftCardStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SupportTicket {
  id: string;
  userId: string;
  name: string;
  email: string;
  type: TicketType;
  orderId?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  adminNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  userId?: string;
  createdAt: Timestamp;
}

export interface AppSettings {
  storeName: string;
  supportEmail: string;
  defaultCurrency: CurrencyCode;
  freeShippingThreshold: number;
  announcementText: string;
  maintenanceMode: boolean;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface AuditLog {
  id?: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetCollection: string;
  targetId: string;
  details: string;
  createdAt: Timestamp;
}

export interface ShippingPreference {
  country: string;
  postalCode: string;
}
