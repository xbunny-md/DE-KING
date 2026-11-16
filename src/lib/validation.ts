// Validation boundaries synchronized verbatim with firebase-blueprint.json & firestore.rules

export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const GIFT_CARD_CODE_PATTERN = /^[A-Z0-9-]+$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LIMITS = {
  idMax: 128,
  emailMax: 160,
  displayNameMax: 120,
  firstNameMax: 60,
  lastNameMax: 60,
  businessNameMax: 120,
  phoneMax: 40,
  countryMax: 60,
  postalMax: 24,
  addressMax: 240,
  productTitleMin: 2,
  productTitleMax: 140,
  productDescMax: 2000,
  brandMax: 80,
  imageUrlMax: 500,
  priceMax: 1000000,
  stockMax: 100000,
  giftCardAmountMin: 5,
  giftCardAmountMax: 5000,
  giftCardMessageMax: 300,
  ticketSubjectMin: 2,
  ticketSubjectMax: 160,
  ticketMessageMin: 5,
  ticketMessageMax: 2000,
  adminNotesMax: 1000,
  announcementMax: 200,
  storeNameMax: 80,
  auditDetailsMax: 500,
} as const;

export function cleanText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function isValidId(value: string): boolean {
  return value.length >= 1 && value.length <= LIMITS.idMax && ID_PATTERN.test(value);
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 3 && trimmed.length <= LIMITS.emailMax && EMAIL_PATTERN.test(trimmed);
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'id';
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
  return `${cleanPrefix}_${randomPart}`.slice(0, LIMITS.idMax);
}

export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = (len: number) => {
    let out = '';
    for (let i = 0; i < len; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };
  return `KING-${block(4)}-${block(4)}`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'TZS' || currency === 'UGX' ? 0 : 2,
      maximumFractionDigits: currency === 'TZS' || currency === 'UGX' ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
