import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SafeImage } from '../components/common/SafeImage';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import {
  BRAND_NAME,
  BUYING_FORMATS,
  CATEGORIES,
  CONDITIONS,
  SHIPPING_COUNTRIES,
  STUDIO_IMAGE_PRESETS,
} from '../lib/constants';
import {
  createProduct,
  getProductById,
  updateProduct,
} from '../services/firestoreService';
import type {
  BuyingFormat,
  ProductCategory,
  ProductCondition,
  ProductStatus,
} from '../types';

export function CreateListingPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const { user, profile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(() => (!isEditing ? searchParams.get('q') || '' : ''));
  const [category, setCategory] = useState<ProductCategory>('electronics');
  const [brand, setBrand] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('Tanzania');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('49.99');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('new');
  const [buyingFormat, setBuyingFormat] = useState<BuyingFormat>('buy-now');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [durationDays, setDurationDays] = useState('30');
  const [imageUrl, setImageUrl] = useState(STUDIO_IMAGE_PRESETS[0].url);
  const [isDeal, setIsDeal] = useState(false);
  const [isOutlet, setIsOutlet] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<ProductStatus>('active');

  useEffect(() => {
    if (!id) return;
    getProductById(id)
      .then((item) => {
        if (!item) {
          showToast('Listing not found.', 'error');
          navigate('/sell');
          return;
        }
        setTitle(item.title);
        setCategory(item.category);
        setBrand(item.brand);
        setCountryOfOrigin(item.countryOfOrigin);
        setDescription(item.description);
        setPrice(String(item.price));
        setOriginalPrice(item.originalPrice ? String(item.originalPrice) : '');
        setCondition(item.condition);
        setBuyingFormat(item.buyingFormat);
        setStockQuantity(String(item.stockQuantity));
        setDurationDays(String(item.durationDays));
        setImageUrl(item.imageUrl);
        setIsDeal(item.isDeal);
        setIsOutlet(item.isOutlet);
        setIsFeatured(item.isFeatured);
        setStatus(item.status);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, navigate, showToast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      showToast('Price must be greater than $0.00.', 'error');
      return;
    }

    setSaving(true);
    try {
      const sellerName =
        profile?.businessName ||
        profile?.displayName ||
        user.displayName ||
        user.email?.split('@')[0] ||
        `${BRAND_NAME} Seller`;

      const payload = {
        title,
        description,
        category,
        brand: brand || `${BRAND_NAME} Studio`,
        countryOfOrigin,
        condition,
        buyingFormat,
        price: numericPrice,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        stockQuantity: Number(stockQuantity) || 1,
        durationDays: Number(durationDays) || 30,
        imageUrl,
        isFeatured: isAdmin ? isFeatured : false,
        isDeal,
        isOutlet,
        status,
      };

      if (isEditing && id) {
        await updateProduct(id, payload, isAdmin);
        showToast('Listing updated successfully.', 'success');
      } else {
        await createProduct(payload, user.uid, sellerName);
        showToast('Listing published to Cloud Firestore.', 'success');
      }
      navigate('/sell');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save listing.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-96 glass-panel rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link
        to="/sell"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Seller Center
      </Link>

      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Edit Listing' : 'Create Your Listing'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Complete product details below to publish directly to the live {BRAND_NAME} marketplace.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] bg-slate-100/70 dark:bg-slate-900/50">
              <SafeImage
                src={imageUrl}
                alt={title || 'Listing preview'}
                fallbackLabel={title || 'Product Preview'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Studio Image Presets
              </label>
              <select
                aria-label="Choose studio image preset"
                value={STUDIO_IMAGE_PRESETS.some((p) => p.url === imageUrl) ? imageUrl : ''}
                onChange={(e) => {
                  if (e.target.value) setImageUrl(e.target.value);
                }}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              >
                <option value="">Custom Image URL</option>
                {STUDIO_IMAGE_PRESETS.map((preset) => (
                  <option key={preset.url} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <div>
                <label htmlFor="prod-img" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Image URL
                </label>
                <input
                  id="prod-img"
                  type="text"
                  maxLength={500}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or /src/assets/images/..."
                  className="w-full h-10 px-3 text-xs font-mono glass-input rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <label htmlFor="prod-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Item Title *
            </label>
            <input
              id="prod-title"
              type="text"
              required
              minLength={2}
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brand, model, capacity, and color"
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-cat" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                id="prod-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prod-brand" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Brand *
              </label>
              <input
                id="prod-brand"
                type="text"
                required
                maxLength={80}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Sony, Bosch, Nike"
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              id="prod-desc"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe specifications, condition, accessories included, and shipping notes."
              className="w-full p-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prod-price" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Price (USD) *
              </label>
              <input
                id="prod-price"
                type="number"
                required
                min={0.01}
                max={1000000}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono tabular-nums glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="prod-orig" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Original Price (Optional)
              </label>
              <input
                id="prod-orig"
                type="number"
                min={0}
                max={1000000}
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="For deals"
                className="w-full h-10 px-3 text-sm font-mono tabular-nums glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="prod-qty" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Stock Quantity *
              </label>
              <input
                id="prod-qty"
                type="number"
                required
                min={0}
                max={100000}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono tabular-nums glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prod-cond" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Condition *
              </label>
              <select
                id="prod-cond"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prod-fmt" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Buying Format
              </label>
              <select
                id="prod-fmt"
                value={buyingFormat}
                onChange={(e) => setBuyingFormat(e.target.value as BuyingFormat)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              >
                {BUYING_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prod-origin" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Country of Origin
              </label>
              <select
                id="prod-origin"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              >
                {SHIPPING_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-dur" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Listing Duration
              </label>
              <select
                id="prod-dur"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            <div>
              <label htmlFor="prod-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Visibility Status
              </label>
              <select
                id="prod-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              >
                <option value="active">Active (Public)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 text-sm text-slate-800 dark:text-slate-200">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDeal}
                onChange={(e) => setIsDeal(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Show in Deals</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOutlet}
                onChange={(e) => setIsOutlet(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Show in Brand Outlet</span>
            </label>
            {isAdmin && (
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Featured on Homepage (Admin)</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving
              ? 'Saving...'
              : isEditing
              ? 'Save Listing Changes'
              : 'Publish Listing Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
