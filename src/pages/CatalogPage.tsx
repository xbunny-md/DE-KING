import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { ProductGridSkeleton } from '../components/common/Skeletons';
import { ProductCard } from '../components/store/ProductCard';
import { BRAND_NAME, CATEGORIES, CONDITIONS } from '../lib/constants';
import { subscribeActiveProducts } from '../services/firestoreService';
import type { Product } from '../types';

interface CatalogPageProps {
  dealsOnly?: boolean;
}

export function CatalogPage({ dealsOnly = false }: CatalogPageProps) {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const initialCategory = slug || searchParams.get('category') || 'all';
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [queryText, setQueryText] = useState(searchParams.get('q') || '');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');

  useEffect(() => {
    setCategoryFilter(slug || searchParams.get('category') || 'all');
    setQueryText(searchParams.get('q') || '');
  }, [slug, searchParams]);

  useEffect(() => {
    const unsub = subscribeActiveProducts((items) => {
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const currentCategory = CATEGORIES.find((c) => c.slug === categoryFilter);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const list = products.filter((item) => {
      if (dealsOnly && !item.isDeal && !(item.originalPrice && item.originalPrice > item.price)) {
        return false;
      }
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) return false;
      if (q) {
        const hay = `${item.title} ${item.brand} ${item.description} ${item.countryOfOrigin}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, dealsOnly, categoryFilter, conditionFilter, queryText, sortBy]);

  const pageTitle = dealsOnly
    ? 'Deals & Price Drops'
    : currentCategory
    ? currentCategory.name
    : 'Marketplace Catalog';

  const pageDesc = dealsOnly
    ? `Verified markdowns, spotlight deals, and limited-time pricing from ${BRAND_NAME} sellers.`
    : currentCategory
    ? currentCategory.description
    : `Browse every active listing across Electronics, Motors, Fashion, Collectibles & Art, Sports, and Industrial Equipment on ${BRAND_NAME}.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white">{BRAND_NAME}</Link>
            <span>›</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">{pageTitle}</span>
          </nav>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            {pageTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            {pageDesc}
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}
        </div>
      </div>

      {/* Frosted Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={queryText}
            onChange={(e) => {
              setQueryText(e.target.value);
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('q', e.target.value);
              else next.delete('q');
              setSearchParams(next, { replace: true });
            }}
            placeholder="Filter by keyword or brand..."
            className="w-full h-10 pl-10 pr-3 text-sm glass-input rounded-xl"
          />
        </div>

        <select
          aria-label="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 text-sm glass-input rounded-xl"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Condition"
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="h-10 px-3 text-sm glass-input rounded-xl"
        >
          <option value="all">All Conditions</option>
          {CONDITIONS.map((cond) => (
            <option key={cond.value} value={cond.value}>
              {cond.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            aria-label="Sort products"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc')}
            className="w-full h-10 px-3 text-sm glass-input rounded-xl"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Interactive Department Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
            categoryFilter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'glass-subtle text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10'
          }`}
        >
          All Departments
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => setCategoryFilter(cat.slug)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
              categoryFilter === cat.slug
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'glass-subtle text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10'
            }`}
          >
            {cat.shortName}
          </button>
        ))}
      </div>

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching listings found"
          description={
            products.length === 0
              ? `No active products have been published on ${BRAND_NAME} yet. Create a listing in the Seller Center or Admin Console.`
              : 'Try clearing your search or switching category/condition filters.'
          }
          actionLabel={products.length === 0 ? 'List a Product' : 'Reset Filters'}
          actionTo={products.length === 0 ? '/sell/new' : undefined}
          onAction={
            products.length === 0
              ? undefined
              : () => {
                  setCategoryFilter('all');
                  setConditionFilter('all');
                  setQueryText('');
                }
          }
        />
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
