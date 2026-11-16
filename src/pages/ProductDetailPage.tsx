import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SafeImage } from '../components/common/SafeImage';
import { useToast } from '../components/common/Toast';
import { useCart } from '../contexts/CartContext';
import { BRAND_NAME, BUYING_FORMATS, CATEGORIES, CONDITIONS } from '../lib/constants';
import { formatCurrency } from '../lib/validation';
import { getProductById } from '../services/firestoreService';
import type { Product } from '../types';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleSaved, isSaved, shippingPref } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    getProductById(id)
      .then((item) => {
        if (mounted) {
          setProduct(item);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 aspect-[4/3] glass-panel rounded-3xl animate-pulse" />
        <div className="lg:col-span-5 glass-panel rounded-3xl p-8 space-y-4 animate-pulse">
          <div className="h-6 w-32 bg-slate-200/80 dark:bg-slate-800/80 rounded" />
          <div className="h-10 w-3/4 bg-slate-200/80 dark:bg-slate-800/80 rounded" />
          <div className="h-24 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          title="Listing not found"
          description="This item may have been removed or archived by the seller."
          actionLabel="Browse Catalog"
          actionTo="/catalog"
        />
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.slug === product.category);
  const conditionLabel = CONDITIONS.find((c) => c.value === product.condition)?.label || product.condition;
  const formatLabel = BUYING_FORMATS.find((f) => f.value === product.buyingFormat)?.label || product.buyingFormat;
  const saved = isSaved(product.id);
  const hasDiscount = typeof product.originalPrice === 'number' && product.originalPrice > product.price;

  const handleAdd = async (goToCart = false) => {
    setSubmitting(true);
    try {
      await addToCart(product, quantity);
      if (goToCart) {
        navigate('/cart');
      } else {
        showToast(`Added ${quantity} × "${product.title}" to your cart.`, 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to add item to cart.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      const nowSaved = await toggleSaved(product);
      showToast(nowSaved ? 'Added to Saved Items.' : 'Removed from Saved Items.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update watchlist.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <Link to={`/category/${product.category}`} className="hover:underline">
            {category?.name || product.category}
          </Link>
          <span className="mx-1.5">·</span>
          <span>{product.brand}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 glass-panel rounded-3xl overflow-hidden lg:sticky lg:top-24">
          <div className="aspect-[4/3] bg-slate-100/70 dark:bg-slate-800/70">
            <SafeImage
              src={product.imageUrl}
              alt={product.title}
              fallbackLabel={product.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              {product.brand} · {conditionLabel} · {formatLabel}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight text-balance">
              {product.title}
            </h1>
          </div>

          <div className="flex items-baseline gap-3 pb-6 border-b border-slate-900/[0.08] dark:border-white/[0.08]">
            <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-base text-slate-400 line-through font-mono tabular-nums">
                {formatCurrency(product.originalPrice!)}
              </span>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Availability</span>
              <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Seller</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{product.sellerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Origin</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{product.countryOfOrigin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Shipping Destination</span>
              <Link to="/ship-to" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                {shippingPref.country}
              </Link>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</span>
              <div className="inline-flex items-center glass-subtle rounded-xl">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-semibold font-mono tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stockQuantity), q + 1))}
                  className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting || product.stockQuantity <= 0}
              onClick={() => handleAdd(true)}
              className="w-full py-3 px-5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Buy It Now
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={submitting || product.stockQuantity <= 0}
                onClick={() => handleAdd(false)}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium glass-subtle text-slate-800 dark:text-slate-200 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-current text-red-600' : ''}`} />
                {saved ? 'Saved' : 'Save Item'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900/[0.08] dark:border-white/[0.08] space-y-2.5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Item Description
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description || 'No additional description provided by the seller.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-900/[0.08] dark:border-white/[0.08] space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{BRAND_NAME} Buyer Protection & verified merchant checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Tracked delivery across East Africa & international routes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
