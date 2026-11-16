import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SafeImage } from '../components/common/SafeImage';
import { useToast } from '../components/common/Toast';
import { useCart } from '../contexts/CartContext';
import { BRAND_NAME } from '../lib/constants';
import { formatCurrency } from '../lib/validation';
import { getProductById } from '../services/firestoreService';

export function SavedItemsPage() {
  const { savedItems, addToCart, toggleSaved } = useCart();
  const { showToast } = useToast();

  const handleMoveToCart = async (productId: string) => {
    try {
      const product = await getProductById(productId);
      if (!product) {
        showToast('This product is no longer available.', 'error');
        return;
      }
      await addToCart(product, 1);
      showToast(`Added "${product.title}" to your cart.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to add to cart.', 'error');
    }
  };

  const handleRemove = async (productId: string, title: string, price: number, category: string, imageUrl: string) => {
    try {
      await toggleSaved({
        id: productId,
        title,
        price,
        category: category as never,
        imageUrl,
        description: '',
        brand: '',
        countryOfOrigin: '',
        condition: 'new',
        buyingFormat: 'buy-now',
        stockQuantity: 1,
        durationDays: 30,
        isFeatured: false,
        isDeal: false,
        isOutlet: false,
        sellerId: 'unknown',
        sellerName: '',
        status: 'active',
        createdAt: null as never,
        updatedAt: null as never,
      });
      showToast('Removed from Saved Items.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to remove item.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Saved Items
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Watchlist items synced with your {BRAND_NAME} account.
        </p>
      </div>

      {savedItems.length === 0 ? (
        <EmptyState
          title="Your watchlist is empty"
          description="Save items while browsing the catalog to track prices and jump back in anytime."
          actionLabel="Explore Catalog"
          actionTo="/catalog"
          icon={<Heart className="w-6 h-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItems.map((item) => (
            <div
              key={item.productId}
              className="glass-card rounded-2xl overflow-hidden flex flex-col"
            >
              <Link to={`/product/${item.productId}`} className="aspect-[4/3] bg-slate-100/70 dark:bg-slate-800/70 block overflow-hidden">
                <SafeImage
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mb-1">
                    {item.category.replace(/-/g, ' ')}
                  </p>
                  <Link
                    to={`/product/${item.productId}`}
                    className="text-base font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                  >
                    {item.title}
                  </Link>
                  <p className="font-mono font-semibold text-sm tabular-nums mt-2 text-slate-900 dark:text-white">
                    {formatCurrency(item.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-200/70 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(item.productId)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item.title} from saved`}
                    onClick={() =>
                      handleRemove(item.productId, item.title, item.price, item.category, item.imageUrl)
                    }
                    className="p-2 glass-subtle rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
