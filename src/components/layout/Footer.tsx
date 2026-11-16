import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { BRAND_NAME, SHIPPING_COUNTRIES } from '../../lib/constants';
import { isValidEmail } from '../../lib/validation';
import { subscribeNewsletter } from '../../services/firestoreService';
import { useToast } from '../common/Toast';

export function Footer() {
  const { user } = useAuth();
  const { shippingPref, setShippingPref } = useCart();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await subscribeNewsletter(email, user?.uid);
      setEmail('');
      showToast('Subscribed to DE-KING deals, new arrivals, and updates.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="mt-20 border-t border-slate-900/[0.08] dark:border-white/[0.08] bg-white/55 dark:bg-slate-950/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Buy
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/catalog" className="hover:text-slate-950 dark:hover:text-white transition-colors">Browse Products</Link></li>
            <li><Link to="/deals" className="hover:text-slate-950 dark:hover:text-white transition-colors">Deals</Link></li>
            <li><Link to="/brand-outlet" className="hover:text-slate-950 dark:hover:text-white transition-colors">Brand Outlet</Link></li>
            <li><Link to="/gift-cards" className="hover:text-slate-950 dark:hover:text-white transition-colors">Gift Cards</Link></li>
            <li><Link to="/help/buying" className="hover:text-slate-950 dark:hover:text-white transition-colors">Buying Help</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Sell
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/sell/new" className="hover:text-slate-950 dark:hover:text-white transition-colors">Start Selling</Link></li>
            <li><Link to="/sell" className="hover:text-slate-950 dark:hover:text-white transition-colors">Seller Center</Link></li>
            <li><Link to="/help/selling-faq" className="hover:text-slate-950 dark:hover:text-white transition-colors">Selling FAQ & Policies</Link></li>
            <li><Link to="/help/selling-tips" className="hover:text-slate-950 dark:hover:text-white transition-colors">Seller Tips & Tools</Link></li>
            <li><Link to="/help/fees-billing" className="hover:text-slate-950 dark:hover:text-white transition-colors">Fees & Billing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
            About & Support
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/contact" className="hover:text-slate-950 dark:hover:text-white transition-colors">Help & Contact</Link></li>
            <li><Link to="/contact-us" className="hover:text-slate-950 dark:hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link to="/help/returns-refunds" className="hover:text-slate-950 dark:hover:text-white transition-colors">Returns & Refunds</Link></li>
            <li><Link to="/help/shipping-tracking" className="hover:text-slate-950 dark:hover:text-white transition-colors">Shipping & Tracking</Link></li>
            <li><Link to="/help/account" className="hover:text-slate-950 dark:hover:text-white transition-colors">Account Help</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Stay in the loop
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Subscribe for deals, new arrivals, and updates from {BRAND_NAME}.
          </p>
          <form onSubmit={handleSubscribe} className="flex items-center gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 min-w-0 h-10 px-3 text-sm glass-input rounded-xl text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-4 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {submitting ? 'Saving...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-900/[0.06] dark:border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">© 2026 {BRAND_NAME}. All rights reserved.</span>
            <span aria-hidden="true">·</span>
            <span>Accepted: Visa · Mastercard · M-Pesa · PayPal · DE-KING Gift Cards</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="footer-country" className="sr-only">
              Select country and language
            </label>
            <select
              id="footer-country"
              value={shippingPref.country}
              onChange={(e) => setShippingPref({ ...shippingPref, country: e.target.value })}
              className="h-9 px-3 text-xs glass-input rounded-xl text-slate-700 dark:text-slate-300"
            >
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} — English
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
