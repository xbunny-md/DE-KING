import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  cleanText,
  generateGiftCardCode,
  generateSafeId,
  LIMITS,
} from '../lib/validation';
import type {
  AccountStatus,
  AccountType,
  AdminRecord,
  AppSettings,
  AuditLog,
  BuyingFormat,
  CartItem,
  GiftCard,
  GiftCardStatus,
  GiftCardTheme,
  NewsletterSubscriber,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCategory,
  ProductCondition,
  ProductStatus,
  TicketStatus,
  TicketType,
  SupportTicket,
  UserProfile,
  UserRole,
} from '../types';

function toMillis(ts: { toMillis?: () => number } | undefined): number {
  return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export function subscribeActiveProducts(
  onData: (products: Product[]) => void
): Unsubscribe {
  const path = 'products';
  const q = query(collection(db, path), where('status', '==', 'active'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Product))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeSellerProducts(
  sellerId: string,
  onData: (products: Product[]) => void
): Unsubscribe {
  const path = 'products';
  const q = query(collection(db, path), where('sellerId', '==', sellerId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Product))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAllProductsAdmin(
  onData: (products: Product[]) => void
): Unsubscribe {
  const path = 'products';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ ...d.data(), id: d.id } as Product)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function getProductById(productId: string): Promise<Product | null> {
  const path = `products/${productId}`;
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as Product;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface ProductInput {
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
  status: ProductStatus;
}

export async function createProduct(
  input: ProductInput,
  sellerId: string,
  sellerName: string
): Promise<string> {
  const id = generateSafeId('prod');
  const path = `products/${id}`;
  const price = Math.max(0.01, Math.min(LIMITS.priceMax, Number(input.price) || 1));
  const payload: Record<string, unknown> = {
    id,
    title: cleanText(input.title, LIMITS.productTitleMax),
    description: cleanText(input.description, LIMITS.productDescMax),
    category: input.category,
    brand: cleanText(input.brand || 'De-King Studio', LIMITS.brandMax),
    countryOfOrigin: cleanText(input.countryOfOrigin || 'Tanzania', LIMITS.countryMax),
    condition: input.condition,
    buyingFormat: input.buyingFormat,
    price,
    stockQuantity: Math.max(0, Math.min(LIMITS.stockMax, Math.floor(Number(input.stockQuantity) || 1))),
    durationDays: Math.max(1, Math.min(365, Math.floor(Number(input.durationDays) || 30))),
    imageUrl: cleanText(input.imageUrl, LIMITS.imageUrlMax),
    isFeatured: Boolean(input.isFeatured),
    isDeal: Boolean(input.isDeal),
    isOutlet: Boolean(input.isOutlet),
    sellerId,
    sellerName: cleanText(sellerName || 'Verified Seller', LIMITS.displayNameMax),
    status: input.status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (typeof input.originalPrice === 'number' && input.originalPrice > price) {
    payload.originalPrice = Math.min(LIMITS.priceMax, input.originalPrice);
  }
  try {
    await setDoc(doc(db, 'products', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProduct(
  productId: string,
  updates: Partial<ProductInput>,
  isAdminAction = false
): Promise<void> {
  const path = `products/${productId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.title !== undefined) payload.title = cleanText(updates.title, LIMITS.productTitleMax);
  if (updates.description !== undefined) payload.description = cleanText(updates.description, LIMITS.productDescMax);
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.brand !== undefined) payload.brand = cleanText(updates.brand, LIMITS.brandMax);
  if (updates.countryOfOrigin !== undefined) payload.countryOfOrigin = cleanText(updates.countryOfOrigin, LIMITS.countryMax);
  if (updates.condition !== undefined) payload.condition = updates.condition;
  if (updates.buyingFormat !== undefined) payload.buyingFormat = updates.buyingFormat;
  if (updates.price !== undefined) payload.price = Math.max(0.01, Math.min(LIMITS.priceMax, Number(updates.price)));
  if (updates.originalPrice !== undefined) payload.originalPrice = Math.max(0, Math.min(LIMITS.priceMax, Number(updates.originalPrice)));
  if (updates.stockQuantity !== undefined) payload.stockQuantity = Math.max(0, Math.min(LIMITS.stockMax, Math.floor(Number(updates.stockQuantity))));
  if (updates.durationDays !== undefined) payload.durationDays = Math.max(1, Math.min(365, Math.floor(Number(updates.durationDays))));
  if (updates.imageUrl !== undefined) payload.imageUrl = cleanText(updates.imageUrl, LIMITS.imageUrlMax);
  if (isAdminAction && updates.isFeatured !== undefined) payload.isFeatured = Boolean(updates.isFeatured);
  if (updates.isDeal !== undefined) payload.isDeal = Boolean(updates.isDeal);
  if (updates.isOutlet !== undefined) payload.isOutlet = Boolean(updates.isOutlet);
  if (updates.status !== undefined) payload.status = updates.status;

  try {
    await updateDoc(doc(db, 'products', productId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Orders & Checkout
// ---------------------------------------------------------------------------

export interface CheckoutPayload {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  shippingCountry: string;
  postalCode: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  giftCardCode?: string;
  cartItems: CartItem[];
}

export async function placeOrder(payload: CheckoutPayload): Promise<string> {
  const orderId = generateSafeId('ord');
  const orderPath = `orders/${orderId}`;
  if (payload.cartItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  try {
    // Re-read authoritative product prices from Firestore
    const verifiedItems: {
      productId: string;
      sellerId: string;
      title: string;
      unitPrice: number;
      quantity: number;
      imageUrl: string;
    }[] = [];

    for (const item of payload.cartItems) {
      const pSnap = await getDoc(doc(db, 'products', item.productId));
      if (!pSnap.exists()) {
        throw new Error(`Product "${item.title}" is no longer available.`);
      }
      const prod = pSnap.data() as Product;
      if (prod.status !== 'active') {
        throw new Error(`Product "${prod.title}" is not currently active.`);
      }
      verifiedItems.push({
        productId: item.productId,
        sellerId: prod.sellerId,
        title: cleanText(prod.title, LIMITS.productTitleMax),
        unitPrice: prod.price,
        quantity: Math.max(1, Math.min(99, Math.floor(item.quantity))),
        imageUrl: cleanText(prod.imageUrl, LIMITS.imageUrlMax),
      });
    }

    const subtotal = Number(
      verifiedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0).toFixed(2)
    );
    const itemCount = verifiedItems.reduce((sum, i) => sum + i.quantity, 0);

    let discountAmount = 0;
    let appliedCard: GiftCard | null = null;
    const normalizedCode = payload.giftCardCode?.trim().toUpperCase();

    if (normalizedCode) {
      const gcSnap = await getDoc(doc(db, 'giftCards', normalizedCode));
      if (!gcSnap.exists()) {
        throw new Error('Gift card code not found.');
      }
      const gc = gcSnap.data() as GiftCard;
      if (gc.status !== 'active' && gc.status !== 'partially-used') {
        throw new Error(`Gift card is ${gc.status} and cannot be redeemed.`);
      }
      if (gc.balance <= 0) {
        throw new Error('Gift card has zero remaining balance.');
      }
      discountAmount = Number(Math.min(gc.balance, subtotal).toFixed(2));
      appliedCard = gc;
    }

    const totalAmount = Number(Math.max(0, subtotal - discountAmount).toFixed(2));
    const batch = writeBatch(db);

    const orderDoc: Record<string, unknown> = {
      id: orderId,
      buyerId: payload.buyerId,
      buyerName: cleanText(payload.buyerName || 'DE-KING Customer', LIMITS.displayNameMax),
      buyerEmail: cleanText(payload.buyerEmail, LIMITS.emailMax),
      shippingCountry: cleanText(payload.shippingCountry, LIMITS.countryMax),
      postalCode: cleanText(payload.postalCode || '00000', LIMITS.postalMax),
      shippingAddress: cleanText(payload.shippingAddress, LIMITS.addressMax),
      paymentMethod: payload.paymentMethod,
      subtotal,
      discountAmount,
      totalAmount,
      itemCount,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (normalizedCode && appliedCard) {
      orderDoc.giftCardCode = normalizedCode;
    }

    batch.set(doc(db, 'orders', orderId), orderDoc);

    for (const item of verifiedItems) {
      const lineId = generateSafeId('li');
      batch.set(doc(db, 'orders', orderId, 'items', lineId), {
        orderId,
        productId: item.productId,
        sellerId: item.sellerId,
        title: item.title,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      });
      batch.delete(doc(db, 'users', payload.buyerId, 'cart', item.productId));
    }

    if (appliedCard && normalizedCode && discountAmount > 0) {
      const nextBalance = Number((appliedCard.balance - discountAmount).toFixed(2));
      const nextStatus: GiftCardStatus = nextBalance === 0 ? 'redeemed' : 'partially-used';
      batch.update(doc(db, 'giftCards', normalizedCode), {
        balance: nextBalance,
        redeemedBy: payload.buyerId,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return orderId;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Missing or insufficient permissions')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, orderPath);
  }
}

export function subscribeMyOrders(
  buyerId: string,
  onData: (orders: Order[]) => void
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), where('buyerId', '==', buyerId));
  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Order))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(orders);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAllOrdersAdmin(
  onData: (orders: Order[]) => void
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ ...d.data(), id: d.id } as Order)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const path = `orders/${orderId}/items`;
  try {
    const snap = await getDocs(collection(db, 'orders', orderId, 'items'));
    return snap.docs.map((d) => d.data() as OrderItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelMyOrder(orderId: string): Promise<void> {
  return updateOrderStatus(orderId, 'cancelled');
}

// ---------------------------------------------------------------------------
// Gift Cards
// ---------------------------------------------------------------------------

export async function createGiftCard(input: {
  amount: number;
  recipientName: string;
  recipientEmail?: string;
  message?: string;
  designTheme: GiftCardTheme;
  purchaserId: string;
}): Promise<string> {
  const code = generateGiftCardCode();
  const path = `giftCards/${code}`;
  const amount = Math.max(
    LIMITS.giftCardAmountMin,
    Math.min(LIMITS.giftCardAmountMax, Number(input.amount) || 25)
  );

  const payload: Record<string, unknown> = {
    code,
    amount,
    balance: amount,
    recipientName: cleanText(input.recipientName || 'Valued Recipient', LIMITS.displayNameMax),
    designTheme: input.designTheme,
    purchaserId: input.purchaserId,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.recipientEmail?.trim()) {
    payload.recipientEmail = cleanText(input.recipientEmail, LIMITS.emailMax);
  }
  if (input.message?.trim()) {
    payload.message = cleanText(input.message, LIMITS.giftCardMessageMax);
  }

  try {
    await setDoc(doc(db, 'giftCards', code), payload);
    return code;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function lookupGiftCard(code: string): Promise<GiftCard | null> {
  const normalized = code.trim().toUpperCase();
  const path = `giftCards/${normalized}`;
  try {
    const snap = await getDoc(doc(db, 'giftCards', normalized));
    if (!snap.exists()) return null;
    return snap.data() as GiftCard;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeMyGiftCards(
  uid: string,
  onData: (cards: GiftCard[]) => void
): Unsubscribe {
  const path = 'giftCards';
  const q = query(collection(db, path), where('purchaserId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const cards = snap.docs
        .map((d) => d.data() as GiftCard)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(cards);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAllGiftCardsAdmin(
  onData: (cards: GiftCard[]) => void
): Unsubscribe {
  const path = 'giftCards';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as GiftCard));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function updateGiftCardAdmin(
  code: string,
  updates: { balance?: number; status?: GiftCardStatus }
): Promise<void> {
  const path = `giftCards/${code}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.balance !== undefined) payload.balance = Math.max(0, Number(updates.balance));
  if (updates.status !== undefined) payload.status = updates.status;
  try {
    await updateDoc(doc(db, 'giftCards', code), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Support Tickets
// ---------------------------------------------------------------------------

export async function createSupportTicket(input: {
  userId: string;
  name: string;
  email: string;
  type: TicketType;
  orderId?: string;
  subject: string;
  message: string;
}): Promise<string> {
  const id = generateSafeId('tkt');
  const path = `supportTickets/${id}`;
  const payload: Record<string, unknown> = {
    id,
    userId: input.userId,
    name: cleanText(input.name, LIMITS.displayNameMax),
    email: cleanText(input.email, LIMITS.emailMax),
    type: input.type,
    subject: cleanText(input.subject, LIMITS.ticketSubjectMax),
    message: cleanText(input.message, LIMITS.ticketMessageMax),
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.orderId?.trim()) {
    payload.orderId = cleanText(input.orderId, LIMITS.idMax);
  }

  try {
    await setDoc(doc(db, 'supportTickets', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeMyTickets(
  userId: string,
  onData: (tickets: SupportTicket[]) => void
): Unsubscribe {
  const path = 'supportTickets';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const tickets = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as SupportTicket))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(tickets);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAllTicketsAdmin(
  onData: (tickets: SupportTicket[]) => void
): Unsubscribe {
  const path = 'supportTickets';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ ...d.data(), id: d.id } as SupportTicket)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function updateTicketAdmin(
  ticketId: string,
  status: TicketStatus,
  adminNotes: string
): Promise<void> {
  const path = `supportTickets/${ticketId}`;
  try {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      status,
      adminNotes: cleanText(adminNotes, LIMITS.adminNotesMax),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTicketAdmin(ticketId: string): Promise<void> {
  const path = `supportTickets/${ticketId}`;
  try {
    await deleteDoc(doc(db, 'supportTickets', ticketId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export async function subscribeNewsletter(email: string, userId?: string): Promise<void> {
  const id = generateSafeId('sub');
  const path = `newsletterSubscribers/${id}`;
  const payload: Record<string, unknown> = {
    email: cleanText(email.toLowerCase(), LIMITS.emailMax),
    createdAt: serverTimestamp(),
  };
  if (userId) {
    payload.userId = userId;
  }
  try {
    await setDoc(doc(db, 'newsletterSubscribers', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeAllSubscribersAdmin(
  onData: (subs: NewsletterSubscriber[]) => void
): Unsubscribe {
  const path = 'newsletterSubscribers';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ ...d.data(), id: d.id } as NewsletterSubscriber)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

// ---------------------------------------------------------------------------
// Users, Admins, Settings & Audit Logs (Admin Panel)
// ---------------------------------------------------------------------------

export function subscribeAllUsersAdmin(
  onData: (users: UserProfile[]) => void
): Unsubscribe {
  const path = 'users';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as UserProfile));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAllAdmins(
  onData: (admins: AdminRecord[]) => void
): Unsubscribe {
  const path = 'admins';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as AdminRecord));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function updateUserAdmin(
  userId: string,
  updates: {
    role?: UserRole;
    status?: AccountStatus;
    displayName?: string;
    accountType?: AccountType;
    shipToCountry?: string;
  }
): Promise<void> {
  const path = `users/${userId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.displayName !== undefined) payload.displayName = cleanText(updates.displayName, LIMITS.displayNameMax);
  if (updates.accountType !== undefined) payload.accountType = updates.accountType;
  if (updates.shipToCountry !== undefined) payload.shipToCountry = cleanText(updates.shipToCountry, LIMITS.countryMax);

  try {
    await updateDoc(doc(db, 'users', userId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function grantAdminAccess(
  targetUid: string,
  targetEmail: string,
  grantedByUid: string
): Promise<void> {
  const path = `admins/${targetUid}`;
  try {
    await setDoc(doc(db, 'admins', targetUid), {
      uid: targetUid,
      email: cleanText(targetEmail, LIMITS.emailMax),
      grantedBy: grantedByUid,
      createdAt: serverTimestamp(),
    });
    await updateUserAdmin(targetUid, { role: 'admin' });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function revokeAdminAccess(targetUid: string): Promise<void> {
  const path = `admins/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'admins', targetUid));
    await updateUserAdmin(targetUid, { role: 'buyer' });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeStoreSettings(
  onData: (settings: AppSettings | null) => void
): Unsubscribe {
  const path = 'appSettings/storefront';
  return onSnapshot(
    doc(db, 'appSettings', 'storefront'),
    (snap) => {
      onData(snap.exists() ? (snap.data() as AppSettings) : null);
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export async function updateStoreSettings(
  settings: Omit<AppSettings, 'updatedBy' | 'updatedAt'>,
  updatedByUid: string
): Promise<void> {
  const path = 'appSettings/storefront';
  try {
    await setDoc(doc(db, 'appSettings', 'storefront'), {
      storeName: cleanText(settings.storeName, LIMITS.storeNameMax),
      supportEmail: cleanText(settings.supportEmail, LIMITS.emailMax),
      defaultCurrency: settings.defaultCurrency,
      freeShippingThreshold: Math.max(0, Number(settings.freeShippingThreshold) || 0),
      announcementText: cleanText(settings.announcementText, LIMITS.announcementMax),
      maintenanceMode: Boolean(settings.maintenanceMode),
      updatedBy: updatedByUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function writeAuditLog(input: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetCollection: string;
  targetId: string;
  details: string;
}): Promise<void> {
  const id = generateSafeId('log');
  const path = `auditLogs/${id}`;
  try {
    await setDoc(doc(db, 'auditLogs', id), {
      actorId: input.actorId,
      actorEmail: cleanText(input.actorEmail, LIMITS.emailMax),
      action: cleanText(input.action, 100),
      targetCollection: cleanText(input.targetCollection, 60),
      targetId: cleanText(input.targetId, LIMITS.idMax),
      details: cleanText(input.details, LIMITS.auditDetailsMax),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeAuditLogs(
  onData: (logs: AuditLog[]) => void
): Unsubscribe {
  const path = 'auditLogs';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ ...d.data(), id: d.id } as AuditLog)));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}
