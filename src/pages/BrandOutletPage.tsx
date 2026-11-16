import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SafeImage } from '../components/common/SafeImage';
import { ProductGridSkeleton } from '../components/common/Skeletons';
import { ProductCard } from '../components/store/ProductCard';
import { BRAND_NAME, BUYING_FORMATS, CONDITIONS, HERO_IMAGES } from '../lib/constants';
import { subscribeActiveProducts } from '../services/firestoreService';
import type { Product } from '../types';

export function BrandOutletPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [brandFilter, setBrandFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [priceCap, setPriceCap] = useState<'all' | 'under-50' | '50-200' | 'over-200'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'newest'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  useEffect(() => {
    const unsub = subscribeActiveProducts((items) => {
      setProducts(items.filter((p) => p.isOutlet || p.buyingFormat === 'outlet-deal'));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products]
  );

  const availableOrigins = useMemo(
    () => Array.from(new Set(products.map((p) => p.countryOfOrigin).filter(Boolean))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const base = products.filter((p) => {
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false;
      if (originFilter !== 'all' && p.countryOfOrigin !== originFilter) return false;
      if (conditionFilter !== 'all' && p.condition !== conditionFilter) return false;
      if (formatFilter !== 'all' && p.buyingFormat !== formatFilter) return false;
      if (priceCap === 'under-50' && p.price >= 50) return false;
      if (priceCap === '50-200' && (p.price < 50 || p.price > 200)) return false;
      if (priceCap === 'over-200' && p.price <= 200) return false;
      return true;
    });
    if (sortBy === 'price-asc') return [...base].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...base].sort((a, b) => b.price - a.price);
    return base;
  }, [products, brandFilter, originFilter, conditionFilter, formatFilter, priceCap, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <Link to="/" className="hover:text-slate-900 dark:hover:text-white">{BRAND_NAME}</Link>
        <span>›</span>
        <span className="text-slate-900 dark:text-slate-200 font-medium">Brand Outlet</span>
      </nav>

      <div className="glass-panel rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-center">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
            Direct Closeouts & Brand Specials
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3 text-balance">
            Brand Outlet
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Explore outlet deals, closeout items, and brand specials curated for value shoppers across {BRAND_NAME}.
          </p>
        </div>
        <div className="lg:col-span-6 min-h-[240px]">
          <SafeImage
            src={HERO_IMAGES.outlet}
            alt="DE-KING Brand Outlet architectural gallery"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Multi-Attribute Filter Bar + Preserved View/Sort Controls from brand-outlet.php */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            aria-label="Filter by brand"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-10 px-3 text-sm glass-input rounded-xl"
          >
            <option value="all">All Brands</option>
            {availableBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by country of origin"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="h-10 px-3 text-sm glass-input rounded-xl"
          >
            <option value="all">Country of Origin</option>
            {availableOrigins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by condition"
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="h-10 px-3 text-sm glass-input rounded-xl"
          >
            <option value="all">All Conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by price range"
            value={priceCap}
            onChange={(e) => setPriceCap(e.target.value as typeof priceCap)}
            className="h-10 px-3 text-sm glass-input rounded-xl"
          >
            <option value="all">Price Range</option>
            <option value="under-50">Under $50</option>
            <option value="50-200">$50 – $200</option>
            <option value="over-200">Over $200</option>
          </select>

          <select
            aria-label="Filter by buying format"
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="h-10 px-3 text-sm glass-input rounded-xl"
          >
            <option value="all">Buying Format</option>
            {BUYING_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-900/[0.06] dark:border-white/[0.07]">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </p>

          <div className="flex items-center gap-3">
            <select
              aria-label="Sort outlet listings"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-9 px-3 text-xs font-medium glass-input rounded-xl"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest arrivals</option>
            </select>

            <div className="inline-flex items-center p-1 glass-subtle rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                aria-label="Compact view"
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Compact
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <ProductGridSkeleton count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Brand Outlet listings available"
          description="Sellers and administrators can publish outlet inventory by toggling Brand Outlet when creating or editing a product."
          actionLabel="List an Outlet Item"
          actionTo="/sell/new"
        />
      ) : viewMode === 'compact' ? (
        <div className="space-y-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
