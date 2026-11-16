import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SafeImage } from '../components/common/SafeImage';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { BRAND_NAME, PAYMENT_METHODS, SHIPPING_COUNTRIES } from '../lib/constants';
import { formatCurrency } from '../lib/validation';
import { lookupGiftCard, placeOrder } from '../services/firestoreService';
import type { GiftCard, PaymentMethod } from '../types';

export function CartCheckoutPage() {
  const { user, profile, isVerified } = useAuth();
  const {
    cartItems,
    cartSubtotal,
    shippingPref,
    updateCartQuantity,
    removeFromCart,
  } = useCart();
  const { showToast } = useToast();

  const [shippingCountry, setShippingCountry] = useState(shippingPref.country || 'TZ');
  const [postalCode, setPostalCode] = useState(shippingPref.postalCode || profile?.postalCode || '');
  const [shippingAddress, setShippingAddress] = useState(profile?.addressLine || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [giftCardInput, setGiftCardInput] = useState('');
  const [appliedCard, setAppliedCard] = useState<GiftCard | null>(null);
  const [applyingCard, setApplyingCard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.shipToCountry) setShippingCountry(profile.shipToCountry);
    if (profile?.postalCode) setPostalCode(profile.postalCode);
    if (profile?.addressLine) setShippingAddress(profile.addressLine);
  }, [profile]);

  const discountAmount = appliedCard
    ? Number(Math.min(appliedCard.balance, cartSubtotal).toFixed(2))
    : 0;
  const totalAmount = Number(Math.max(0, cartSubtotal - discountAmount).toFixed(2));

  const handleApplyGiftCard = async () => {
    if (!giftCardInput.trim()) return;
    setApplyingCard(true);
    try {
      const card = await lookupGiftCard(giftCardInput);
      if (!card) {
        showToast('Gift card code not found.', 'error');
        setAppliedCard(null);
      } else if (card.status !== 'active' && card.status !== 'partially-used') {
        showToast(`Gift card is ${card.status}.`, 'error');
        setAppliedCard(null);
      } else if (card.balance <= 0) {
        showToast('Gift card has zero remaining balance.', 'error');
        setAppliedCard(null);
      } else {
        setAppliedCard(card);
        showToast(`Applied ${formatCurrency(card.balance)} gift card balance.`, 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to verify gift card.', 'error');
    } finally {
      setApplyingCard(false);
    }
  };

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isVerified) {
      showToast('Please sign in with a verified email to complete checkout.', 'error');
      return;
    }
    if (!shippingAddress.trim() || !postalCode.trim()) {
      showToast('Please provide your shipping address and postal code.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const orderId = await placeOrder({
        buyerId: user.uid,
        buyerName: profile?.displayName || user.displayName || user.email || `${BRAND_NAME} Buyer`,
        buyerEmail: user.email || '',
        shippingCountry,
        postalCode,
        shippingAddress,
        paymentMethod,
        giftCardCode: appliedCard?.code,
        cartItems,
      });
      setConfirmedOrderId(orderId);
      setAppliedCard(null);
      setGiftCardInput('');
      showToast('Order placed successfully.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Checkout failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="glass-panel rounded-3xl p-8 text-center space-y-5">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Order Confirmed
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Order reference{' '}
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {confirmedOrderId}
            </span>{' '}
            has been recorded in Cloud Firestore and is now pending fulfillment.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/purchase-history"
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              View Purchase History
            </Link>
            <Link
              to="/catalog"
              className="px-5 py-2.5 text-sm font-medium glass-subtle rounded-xl"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Shopping Cart & Checkout
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review items, apply {BRAND_NAME} gift card balances, and confirm shipping details.
        </p>
      </div>

      {!user ? (
        <EmptyState
          title="Sign in to access your shopping cart"
          description={`Your cart syncs securely with your ${BRAND_NAME} account across sessions.`}
          actionLabel="Sign In"
          actionTo="/login"
          icon={<ShoppingBag className="w-6 h-6" />}
        />
      ) : cartItems.length === 0 ? (
        <EmptyState
          title="No items in your cart yet"
          description="Explore active marketplace listings across Electronics, Motors, Fashion, and Brand Outlet."
          actionLabel="Browse Catalog"
          actionTo="/catalog"
          icon={<ShoppingBag className="w-6 h-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 glass-panel rounded-3xl divide-y divide-slate-900/[0.06] dark:divide-white/[0.08]">
            {cartItems.map((item) => (
              <div key={item.productId} className="p-5 flex items-center gap-4">
                <Link
                  to={`/product/${item.productId}`}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100/80 dark:bg-slate-800/80 shrink-0"
                >
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.productId}`}
                    className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
                    {formatCurrency(item.price)} each
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="inline-flex items-center glass-subtle rounded-xl">
                      <button
                        type="button"
                        aria-label={`Decrease quantity for ${item.title}`}
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-mono font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity for ${item.title}`}
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-right font-mono font-semibold text-sm tabular-nums shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleCheckout}
            className="lg:col-span-5 glass-panel rounded-3xl p-6 space-y-5"
          >
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Order Summary & Shipping
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="chk-country" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ship To Country *
                </label>
                <select
                  id="chk-country"
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                  className="w-full h-10 px-3 text-sm glass-input rounded-xl"
                >
                  {SHIPPING_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="chk-postal" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Postal Code *
                </label>
                <input
                  id="chk-postal"
                  type="text"
                  required
                  maxLength={24}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="14111"
                  className="w-full h-10 px-3 text-sm glass-input rounded-xl"
                />
              </div>
            </div>

            <div>
              <label htmlFor="chk-addr" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Delivery Street Address *
              </label>
              <input
                id="chk-addr"
                type="text"
                required
                minLength={3}
                maxLength={240}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Street, building, suite, or pickup point"
                className="w-full h-10 px-3 text-sm glass-input rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method
              </label>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === pm.value
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                        : 'glass-subtle'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white block">
                        {pm.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {pm.subtitle}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm.value}
                      checked={paymentMethod === pm.value}
                      onChange={() => setPaymentMethod(pm.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="chk-gc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Gift Card Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  id="chk-gc"
                  type="text"
                  value={giftCardInput}
                  onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                  placeholder="KING-XXXX-XXXX"
                  className="flex-1 h-10 px-3 text-sm font-mono uppercase glass-input rounded-xl"
                />
                <button
                  type="button"
                  disabled={applyingCard}
                  onClick={handleApplyGiftCard}
                  className="px-4 h-10 text-xs font-semibold glass-subtle rounded-xl hover:bg-white dark:hover:bg-slate-800"
                >
                  {applyingCard ? '...' : 'Apply'}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-900/[0.08] dark:border-white/[0.08] pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatCurrency(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Gift Card ({appliedCard?.code})</span>
                  <span className="font-mono tabular-nums">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-900/[0.06] dark:border-white/[0.06]">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Processing Order...' : `Confirm & Place Order (${formatCurrency(totalAmount)})`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
