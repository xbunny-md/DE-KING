import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { CATEGORIES, CONDITIONS } from '../../lib/constants';
import { formatCurrency } from '../../lib/validation';
import type { Product } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { useToast } from '../common/Toast';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addToCart, toggleSaved, isSaved } = useCart();
  const { showToast } = useToast();
  const saved = isSaved(product.id);

  const categoryLabel =
    CATEGORIES.find((c) => c.slug === product.category)?.shortName || product.category;
  const conditionLabel =
    CONDITIONS.find((c) => c.value === product.condition)?.label || product.condition;

  const hasDiscount =
    typeof product.originalPrice === 'number' && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      showToast(`Added "${product.title}" to cart.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to add to cart.', 'error');
    }
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const nowSaved = await toggleSaved(product);
      showToast(
        nowSaved ? 'Saved to your DE-KING watchlist.' : 'Removed from your watchlist.',
        'info'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update watchlist.', 'error');
    }
  };

  if (compact) {
    return (
      <article className="group glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-5">
        <Link
          to={`/product/${product.id}`}
          className="w-full sm:w-44 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100/80 dark:bg-slate-800/80 shrink-0"
        >
          <SafeImage
            src={product.imageUrl}
            alt={product.title}
            fallbackLabel={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{conditionLabel}</span>
            {product.isOutlet && (
              <>
                <span aria-hidden="true">·</span>
                <span>Brand Outlet</span>
              </>
            )}
          </div>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {product.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {product.brand} · Ships from {product.countryOfOrigin}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
                {discountPercent}% off
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSave}
              aria-label={saved ? 'Remove from saved items' : 'Save item to watchlist'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                saved
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'glass-subtle text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {product.stockQuantity > 0 ? 'Add' : 'Sold out'}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group glass-card rounded-2xl overflow-hidden flex flex-col">
      <Link
        to={`/product/${product.id}`}
        className="block relative aspect-[4/3] bg-slate-100/80 dark:bg-slate-800/80 overflow-hidden"
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.title}
          fallbackLabel={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={saved ? 'Remove from saved items' : 'Save item to watchlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md border transition-colors ${
            saved
              ? 'bg-slate-900/90 text-white border-slate-900 dark:bg-white/95 dark:text-slate-900 dark:border-white'
              : 'bg-white/80 dark:bg-slate-950/75 text-slate-700 dark:text-slate-200 border-white/60 dark:border-white/15 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5 truncate">
            <span>{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{conditionLabel}</span>
            {product.isOutlet && (
              <>
                <span aria-hidden="true">·</span>
                <span>Outlet</span>
              </>
            )}
          </div>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {product.brand} · Ships from {product.countryOfOrigin}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-slate-900/[0.06] dark:border-white/[0.08]">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                  {formatCurrency(product.originalPrice!)}
                </span>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.stockQuantity > 0 ? 'Add' : 'Sold out'}
          </button>
        </div>
      </div>
    </article>
  );
}
