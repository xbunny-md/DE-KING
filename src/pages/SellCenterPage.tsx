import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Edit3, Plus, Search, ShieldCheck, Store, Trash2, TrendingUp } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SafeImage } from '../components/common/SafeImage';
import { TableRowsSkeleton } from '../components/common/Skeletons';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_NAME, CATEGORIES, HERO_IMAGES } from '../lib/constants';
import { formatCurrency } from '../lib/validation';
import {
  deleteProduct,
  subscribeSellerProducts,
  updateProduct,
} from '../services/firestoreService';
import type { Product, ProductStatus } from '../types';

export function SellCenterPage() {
  const { user, profile, isVerified } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState('');

  useEffect(() => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }
    const unsub = subscribeSellerProducts(user.uid, (items) => {
      setListings(items);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleStatusChange = async (productId: string, status: ProductStatus) => {
    try {
      await updateProduct(productId, { status });
      showToast(`Listing updated to ${status}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update status.', 'error');
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      showToast(`Deleted "${product.title}".`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete listing.', 'error');
    }
  };

  const handleStartListingSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = quickTitle.trim();
    navigate(query ? `/sell/new?q=${encodeURIComponent(query)}` : '/sell/new');
  };

  const sellerDisplayName =
    profile?.businessName ||
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Seller';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* Preserved Welcome Seller Bar */}
      {user && (
        <div className="glass-panel rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg glass-subtle flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Welcome back, {sellerDisplayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your {BRAND_NAME} storefront inventory, pricing, and fulfillment.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <Link to="/account" className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400">
              My Account
            </Link>
            <a href="#seller-inventory" className="text-blue-600 dark:text-blue-400 hover:underline">
              My Sales &amp; Listings ({listings.length})
            </a>
          </div>
        </div>
      )}

      {/* Preserved Selling Sub-Navigation */}
      <div className="glass-subtle rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {BRAND_NAME} Selling Center
        </span>
        <nav className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Link to="/sell" className="text-slate-900 dark:text-white font-semibold">
            Business selling
          </Link>
          <Link to="/help/selling-tips" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Tips for listing
          </Link>
          <Link to="/help/selling-faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            FAQ
          </Link>
          <Link to="/account" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            My Kings
          </Link>
          <Link
            to="/sell/new"
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            List an item
          </Link>
        </nav>
      </div>

      {/* Seller Studio Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch glass-panel rounded-2xl overflow-hidden">
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            {BRAND_NAME} Seller Studio
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 text-balance">
            Publish listings and reach verified buyers.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-7">
            Manage product inventory, outlet markdowns, stock quantities, and pricing directly in Cloud Firestore with seller protection and transparent fees.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/sell/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create New Listing
            </Link>
            <Link
              to="/help/selling"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium glass-subtle text-slate-800 dark:text-slate-200 rounded-lg hover:bg-white/70 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Selling Guide &amp; FAQ
            </Link>
          </div>
        </div>
        <div className="lg:col-span-6 min-h-[260px] bg-slate-100/60 dark:bg-slate-900/50">
          <SafeImage
            src={HERO_IMAGES.sellerStudio}
            alt="Merchant packaging and studio camera setup"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Preserved Start Your Listing Quick Launcher + 3-Step Guide */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Start your listing
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Enter what you are selling to launch directly into the listing builder.
            </p>
          </div>
          <form onSubmit={handleStartListingSearch} className="flex w-full lg:w-[440px] gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Tell us what you're selling (e.g. MacBook Pro M3)"
                className="w-full h-10 pl-9 pr-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 h-10 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Start Listing
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { num: '1', title: 'Tell us what you are selling', desc: 'Set title, category, brand, and honest condition.' },
            { num: '2', title: 'Set your price & stock', desc: 'Configure Buy It Now, Outlet Deal, or Bulk pricing.' },
            { num: '3', title: 'Publish & ship', desc: 'Go live across DE-KING feeds and manage fulfillment.' },
          ].map((step) => (
            <div key={step.num} className="glass-subtle rounded-xl p-4 flex items-start gap-3">
              <span className="font-mono text-xs font-bold w-6 h-6 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                {step.num}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seller Listings Table */}
      <section id="seller-inventory" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Your Marketplace Listings
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Real-time inventory owned by your {BRAND_NAME} account.
            </p>
          </div>
          {user && isVerified && (
            <Link
              to="/sell/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg whitespace-nowrap hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Listing
            </Link>
          )}
        </div>

        {!user ? (
          <EmptyState
            title="Sign in to manage your seller inventory"
            description="Authenticate with Google or email/password to create listings, edit pricing, and track stock."
            actionLabel="Sign In to Sell"
            actionTo="/login"
          />
        ) : loading ? (
          <TableRowsSkeleton rows={4} />
        ) : listings.length === 0 ? (
          <EmptyState
            title="You have not published any listings yet"
            description="Create your first listing with photos, pricing, condition, and inventory quantity."
            actionLabel="Create First Listing"
            actionTo="/sell/new"
          />
        ) : (
          <div className="glass-panel rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Product</th>
                  <th className="py-3.5 px-4 font-medium">Category</th>
                  <th className="py-3.5 px-4 font-medium text-right">Price</th>
                  <th className="py-3.5 px-4 font-medium text-right">Stock</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/product/${item.id}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {item.title}
                      </Link>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.brand} · {item.condition}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {CATEGORIES.find((c) => c.slug === item.category)?.shortName || item.category}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {item.stockQuantity}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Change status for ${item.title}`}
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as ProductStatus)}
                        className="h-8 px-2 text-xs glass-input rounded-md text-slate-900 dark:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="sold-out">Sold Out</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/sell/edit/${item.id}`}
                          aria-label={`Edit ${item.title}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-white/60 dark:hover:bg-white/10"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          aria-label={`Delete ${item.title}`}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-white/60 dark:hover:bg-white/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Preserved CTA Banner ("If you don't love it, list it") + 3 Seller Benefits */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 glass-dark-panel text-white rounded-2xl p-8 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <h2 className="font-display text-2xl font-bold">
              If you don&apos;t love it, list it.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Turn surplus inventory, electronics, fashion, or automotive gear into working capital on {BRAND_NAME}.
            </p>
          </div>
          <div>
            <Link
              to="/sell/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-white text-slate-900 rounded-lg hover:bg-blue-50 transition-colors"
            >
              List an item
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, title: 'Global buyer reach', desc: 'Appear in category search, Deals, and Brand Outlet feeds immediately.' },
            { icon: ShieldCheck, title: 'Verified seller protection', desc: 'Role-enforced ownership and secure verified buyer transactions.' },
            { icon: CheckCircle2, title: 'Zero listing clutter', desc: 'Edit pricing, quantities, or visibility status in one click.' },
          ].map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="glass-card rounded-2xl p-5 space-y-2.5">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{b.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4-Step Selling Process */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { step: '01', title: 'Create Listing', body: 'Add specifications, condition, pricing, and photography.' },
          { step: '02', title: 'Reach Buyers', body: 'Appear instantly across category, outlet, and search feeds.' },
          { step: '03', title: 'Ship & Track', body: 'Deliver across East Africa and global destinations reliably.' },
          { step: '04', title: 'Grow Reputation', body: 'Maintain accurate stock and responsive buyer service.' },
        ].map((item) => (
          <div
            key={item.step}
            className="glass-card rounded-2xl p-6"
          >
            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
              {item.step}
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-2 mb-1.5">
              {item.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
