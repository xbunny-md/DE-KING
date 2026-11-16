import type {
  BuyingFormat,
  GiftCardTheme,
  OrderStatus,
  PaymentMethod,
  ProductCategory,
  ProductCondition,
  TicketType,
} from '../types';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'lupinstarnley009@gmail.com';

export const BRAND_NAME = 'DE-KING';

export const HERO_IMAGES = {
  marketplace: '/src/assets/images/hero_marketplace_showcase_1794857792322.jpg',
  outlet: '/src/assets/images/brand_outlet_gallery_1794857791937.jpg',
  giftCards: '/src/assets/images/gift_cards_editorial_1794857792450.jpg',
  sellerStudio: '/src/assets/images/seller_studio_workspace_1794857794184.jpg',
  motors: '/src/assets/images/motors_precision_gear_1794857794674.jpg',
} as const;

export const STUDIO_IMAGE_PRESETS: { label: string; url: string }[] = [
  { label: 'Studio Tech & Audio Showcase', url: HERO_IMAGES.marketplace },
  { label: 'Apparel & Luxury Gallery', url: HERO_IMAGES.outlet },
  { label: 'Automotive & Precision Hardware', url: HERO_IMAGES.motors },
  { label: 'Merchant Packaging & Studio', url: HERO_IMAGES.sellerStudio },
  { label: 'Metallic Gift Card Presentation', url: HERO_IMAGES.giftCards },
];

// Preserved exact category hierarchy and ordering from original DE-KING repository
export const CATEGORIES: {
  slug: ProductCategory;
  name: string;
  shortName: string;
  description: string;
}[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    shortName: 'Electronics',
    description: 'Laptops, smartphones, studio audio, smartwatches, and everyday tech accessories.',
  },
  {
    slug: 'motors',
    name: 'Motors',
    shortName: 'Motors',
    description: 'Precision automotive parts, cockpit upgrades, workshop tools, and vehicle accessories.',
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    shortName: 'Fashion',
    description: 'Authenticated leather goods, outerwear, timepieces, footwear, and eyewear.',
  },
  {
    slug: 'collectibles-and-art',
    name: 'Collectibles & Art',
    shortName: 'Collectibles & Art',
    description: 'Rare artifacts, limited-edition prints, coins, and curated collector pieces.',
  },
  {
    slug: 'sports',
    name: 'Sports',
    shortName: 'Sports',
    description: 'Sports gear, fitness equipment, cycling hardware, and outdoor essentials.',
  },
  {
    slug: 'health-and-beauty',
    name: 'Health & Beauty',
    shortName: 'Health & Beauty',
    description: 'Skincare formulations, grooming instruments, fragrance, and wellness essentials.',
  },
  {
    slug: 'industrial-equipment',
    name: 'Industrial Equipment',
    shortName: 'Industrial Equipment',
    description: 'Workshop machinery, measurement tools, fasteners, and commercial hardware.',
  },
  {
    slug: 'home-and-garden',
    name: 'Home & Garden',
    shortName: 'Home & Garden',
    description: 'Architectural lighting, kitchen appliances, interior furnishings, and garden gear.',
  },
];

export const CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

export const BUYING_FORMATS: { value: BuyingFormat; label: string }[] = [
  { value: 'buy-now', label: 'Buy It Now' },
  { value: 'outlet-deal', label: 'Outlet Deal' },
  { value: 'bulk', label: 'Bulk / Wholesale' },
];

export const SHIPPING_COUNTRIES: { code: string; name: string }[] = [
  { code: 'TZ', name: 'United Republic of Tanzania' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'CN', name: 'China' },
  { code: 'ZA', name: 'South Africa' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; subtitle: string }[] = [
  { value: 'mpesa', label: 'M-Pesa Mobile Money', subtitle: 'Instant mobile confirmation for East Africa' },
  { value: 'visa', label: 'Visa Card', subtitle: 'Debit or credit card with 3D Secure' },
  { value: 'mastercard', label: 'Mastercard', subtitle: 'Global card acceptance' },
  { value: 'paypal', label: 'PayPal', subtitle: 'Protected express checkout' },
  { value: 'gift-card', label: 'DE-KING Gift Card', subtitle: 'Redeem balance directly at checkout' },
];

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export const GIFT_CARD_THEMES: { value: GiftCardTheme; label: string; accent: string }[] = [
  { value: 'obsidian', label: 'Obsidian Matte', accent: 'bg-slate-900 text-white' },
  { value: 'champagne', label: 'Champagne Stone', accent: 'bg-stone-200 text-slate-900' },
  { value: 'cobalt', label: 'Royal Cobalt', accent: 'bg-blue-700 text-white' },
  { value: 'celebration', label: 'Emerald Studio', accent: 'bg-emerald-800 text-white' },
];

export const RETAIL_PARTNERS = [
  { city: 'Dar es Salaam', country: 'Tanzania', partner: 'Mlimani City Flagship Desk', address: 'Sam Nujoma Rd, Kinondoni', hours: '09:00 – 20:00' },
  { city: 'Arusha', country: 'Tanzania', partner: 'Aim Mall Concierge', address: 'Nairobi Rd, Majengo', hours: '09:00 – 19:00' },
  { city: 'Nairobi', country: 'Kenya', partner: 'Westgate Retail Counter', address: 'Mwanzi Rd, Westlands', hours: '09:00 – 20:30' },
  { city: 'Kampala', country: 'Uganda', partner: 'Acacia Avenue Hub', address: 'Kololo Hill Dr', hours: '09:00 – 19:30' },
  { city: 'London', country: 'United Kingdom', partner: 'Canary Wharf Partner Kiosk', address: 'Cabot Square E14', hours: '08:30 – 19:00' },
  { city: 'New York', country: 'United States', partner: 'SoHo Exchange Point', address: 'Mercer St, NY 10012', hours: '10:00 – 20:00' },
];

export const TICKET_TYPES: { value: TicketType; label: string }[] = [
  { value: 'general', label: 'General Support' },
  { value: 'return', label: 'Return & Refund Request' },
  { value: 'missing-item', label: 'Report Missing Item' },
  { value: 'account', label: 'Account & Security' },
  { value: 'billing', label: 'Fees & Billing' },
];

export interface HelpGuideSection {
  title: string;
  items: { q: string; a: string }[];
}

export interface HelpGuide {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  sections: HelpGuideSection[];
}

export const HELP_GUIDES: HelpGuide[] = [
  {
    slug: 'buying',
    title: 'Buying Help',
    subtitle: 'How to search, compare, purchase, and track orders on DE-KING.',
    summary: 'Everything buyers need to shop securely across Electronics, Motors, Fashion, and Deals.',
    sections: [
      {
        title: 'Common Questions',
        items: [
          { q: 'How do I search for items?', a: 'Use the catalog search bar to filter by product keyword, category, condition, brand, or country of origin.' },
          { q: 'How do I make a purchase?', a: 'Open any listing, choose your quantity, and select Add to Cart or Buy It Now to proceed to verified checkout.' },
          { q: 'What payment methods are accepted?', a: 'DE-KING supports M-Pesa, Visa, Mastercard, PayPal, and DE-KING Gift Cards.' },
          { q: 'How do I track my order?', a: 'Sign in and visit Purchase History to see live status updates (Pending, Processing, Shipped, Delivered).' },
          { q: 'Can I cancel an order?', a: 'Orders with Pending status can be cancelled directly from your Purchase History before fulfillment begins.' },
        ],
      },
      {
        title: 'Buying Tips',
        items: [
          { q: 'Check condition and stock', a: 'Review the item condition rating (New, Like New, Excellent, Good, Fair) and shipping country preferences before checkout.' },
          { q: 'Save items for comparison', a: 'Bookmark listings to your Saved Watchlist to monitor price changes and availability.' },
        ],
      },
    ],
  },
  {
    slug: 'selling',
    title: 'Selling Help',
    subtitle: 'Create verified listings, manage inventory, and fulfill customer orders.',
    summary: 'Step-by-step guidance for personal and business sellers on DE-KING.',
    sections: [
      {
        title: 'Common Questions',
        items: [
          { q: 'How do I start selling?', a: 'Sign in with a verified account, open Business Selling in the Seller Center, and publish your first listing.' },
          { q: 'What items can I sell?', a: 'Electronics, Motors, Fashion, Collectibles & Art, Sports, Health & Beauty, Industrial Equipment, and Home & Garden.' },
          { q: 'What are the selling fees?', a: 'Standard listing creation is free; transparent final value fees apply only when an item sells.' },
          { q: 'How do I get paid?', a: 'Payouts settle to your verified business or personal settlement method after delivery confirmation.' },
        ],
      },
    ],
  },
  {
    slug: 'selling-faq',
    title: 'Selling FAQ',
    subtitle: 'Answers to frequent merchant questions about pricing, shipping, and policies.',
    summary: 'Detailed operational policies for DE-KING merchants.',
    sections: [
      {
        title: 'Listing & Storefront Policies',
        items: [
          { q: 'How long do listings stay active?', a: 'Choose 7, 14, or 30-day listing durations, or keep inventory continuously active by updating stock quantities.' },
          { q: 'Can I edit or pause a listing?', a: 'Yes. From the Seller Center you can edit pricing, stock levels, deal flags, or switch status to Draft/Archived.' },
          { q: 'How do Brand Outlet listings work?', a: 'Tag closeout or surplus branded stock as Outlet Deals so value shoppers can discover them in the Brand Outlet.' },
        ],
      },
    ],
  },
  {
    slug: 'selling-tips',
    title: 'Seller Tips & Best Practices',
    subtitle: 'Master listing presentation, pricing, and fulfillment on DE-KING.',
    summary: 'Practical merchandising advice adapted from DE-KING seller standards.',
    sections: [
      {
        title: 'Merchandising & Fulfillment',
        items: [
          { q: '1. Compelling Product Photos & Clear Titles', a: 'Include brand, model, size, color, and key specs in the title and select clean studio photography.' },
          { q: '2. Detailed Descriptions & Honest Condition', a: 'Highlight unique features and disclose any wear honestly to build buyer trust and reduce returns.' },
          { q: '3. Competitive Pricing Strategy', a: 'Set a clear original price alongside discounted deal pricing when running promotions.' },
          { q: '4. Fast Shipping Options', a: 'Keep stock quantities accurate in real time and offer reliable regional and international dispatch.' },
        ],
      },
    ],
  },
  {
    slug: 'account',
    title: 'Account Help',
    subtitle: 'Registration, email verification, password resets, and profile security.',
    summary: 'Manage your Personal or Business DE-KING account securely.',
    sections: [
      {
        title: 'Account & Security',
        items: [
          { q: 'How do I create an account?', a: 'Register with Google Sign-In for instant verified access, or create a Personal or Business account with email and password.' },
          { q: 'How do I reset my password?', a: 'Use Forgot Password on the Sign In page or trigger a password reset email directly from Account Settings.' },
          { q: 'Why must my email be verified?', a: 'Email verification protects buyers and sellers against unauthorized orders, listing spoofing, and fraud.' },
        ],
      },
    ],
  },
  {
    slug: 'returns-refunds',
    title: 'Returns & Refunds',
    subtitle: 'How returns, damaged deliveries, and buyer protection claims work.',
    summary: 'Four-step return resolution backed by DE-KING support tickets.',
    sections: [
      {
        title: 'How Returns Work',
        items: [
          { q: 'Step 1: Check Return Eligibility', a: 'Items must be returned within the eligible window in original condition unless damaged or not as described.' },
          { q: 'Step 2: Submit a Return Ticket', a: 'Sign in and open a Return Request in Customer Service referencing your Order ID.' },
          { q: 'Step 3: Ship the Item Back', a: 'Follow the carrier instructions provided in your support ticket thread.' },
          { q: 'Step 4: Receive Your Refund', a: 'Refunds are issued to your original payment method (M-Pesa, card, PayPal, or gift card balance) once verified.' },
        ],
      },
    ],
  },
  {
    slug: 'shipping-tracking',
    title: 'Shipping & Tracking',
    subtitle: 'Get information about shipping options and track your orders.',
    summary: 'Standard (5-7 days), Expedited (2-3 days), Next-Day (1 day), and In-Store Pickup.',
    sections: [
      {
        title: 'Shipping Options',
        items: [
          { q: 'Standard & Expedited Shipping', a: 'Standard delivery arrives in 5-7 business days; Expedited shipping arrives in 2-3 business days with full tracking and insurance.' },
          { q: 'Next-Day & In-Store Pickup', a: 'Next-Day delivery is available on select items, or pick up within 1-2 business days at a DE-KING retail partner desk.' },
          { q: 'Missing or Delayed Package', a: 'If an order exceeds its estimated delivery window, submit a Missing Item report in Customer Service.' },
        ],
      },
    ],
  },
  {
    slug: 'fees-billing',
    title: 'Fees & Billing',
    subtitle: 'Invoices, gift card balances, payment reconciliation, and fee inquiries.',
    summary: 'Clear billing transparency for buyers and sellers on DE-KING.',
    sections: [
      {
        title: 'Billing & Gift Cards',
        items: [
          { q: 'Are there fees for buyers?', a: 'No platform surcharge is added for browsing or standard checkout. Applicable shipping or local taxes are shown before confirmation.' },
          { q: 'How do Gift Card balances carry over?', a: 'If your order total is less than your gift card value, the remaining balance stays active on the same code for future orders.' },
          { q: 'How do I dispute a charge?', a: 'Open a Fees & Billing support ticket with your Order ID and our operations team will review it promptly.' },
        ],
      },
    ],
  },
];
