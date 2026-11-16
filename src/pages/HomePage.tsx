import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SafeImage } from '../components/common/SafeImage';
import { ProductGridSkeleton } from '../components/common/Skeletons';
import { ProductCard } from '../components/store/ProductCard';
import { BRAND_NAME, CATEGORIES, HERO_IMAGES } from '../lib/constants';
import { subscribeActiveProducts } from '../services/firestoreService';
import type { Product } from '../types';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeActiveProducts((items) => {
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const featuredProducts = useMemo(() => {
    const featured = products.filter((p) => p.isFeatured);
    return featured.length > 0 ? featured : products.slice(0, 8);
  }, [products]);

  const scrollSlider = (direction: -1 | 1) => {
    if (!trackRef.current) return;
    const step = 340 * direction;
    trackRef.current.scrollBy({ left: step, behavior: 'smooth' });
  };

  return (
    <div className="space-y-20 pb-8">
      {/* Section 1: Welcome to DE-KING Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="glass-panel rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wide text-blue-600 dark:text-blue-400 mb-3">
              {BRAND_NAME} Global Commerce
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08] text-balance mb-5">
              Welcome to {BRAND_NAME}. Your one-stop shop for curated essentials.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl">
              Explore verified listings across electronics, motors, fashion, and industrial equipment with transparent pricing and dependable shipping across East Africa and worldwide.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
              >
                Explore Catalog
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/sell"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold glass-subtle text-slate-800 dark:text-slate-100 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Start Selling
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[300px] lg:min-h-[460px] bg-slate-100 dark:bg-slate-900">
            <SafeImage
              src={HERO_IMAGES.marketplace}
              alt="DE-KING curated headphones, smartwatch, and wireless audio hardware"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950/75 via-slate-950/30 to-transparent">
              <div className="backdrop-blur-md bg-white/15 border border-white/25 rounded-2xl px-4 py-3 text-white flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200">Verified Departments</p>
                  <p className="text-sm font-semibold truncate">
                    8 Curated Categories · Direct Seller & Outlet Inventory
                  </p>
                </div>
                <Link
                  to="/deals"
                  className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  Shop Deals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Shopping Made Easy & DE-KING Category Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Shopping made easy
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Enjoy reliability, secure deliveries, and direct access to every department on {BRAND_NAME}.
            </p>
          </div>
          <Link
            to="/catalog"
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            View all listings
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="group glass-card rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <h3 className="font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {category.description}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 mt-4">
                Shop now
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 3: Shop the Latest Trends with DE-KING (Featured Listings Slider) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Shop the latest trends with {BRAND_NAME}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Discover featured listings and international finds published by verified merchants.
            </p>
          </div>
          {featuredProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollSlider(-1)}
                aria-label="Scroll featured products left"
                className="p-2.5 glass-subtle rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider(1)}
                aria-label="Scroll featured products right"
                className="p-2.5 glass-subtle rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <ProductGridSkeleton count={3} />
        ) : featuredProducts.length === 0 ? (
          <EmptyState
            title={`No active listings in ${BRAND_NAME} yet`}
            description="Your Cloud Firestore catalog is live and ready. Publish your first item from the Seller Center or add curated products via the Admin Console."
            actionLabel="Create First Listing"
            actionTo="/sell/new"
          />
        ) : (
          <div
            ref={trackRef}
            className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] sm:auto-cols-[minmax(320px,320px)] gap-6 overflow-x-auto pb-2 scroll-smooth snap-x"
          >
            {featuredProducts.map((product) => (
              <div key={product.id} className="snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 4: Endless Accessories / Motors Showcase & Buyer Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="glass-dark-panel text-white rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 min-h-[260px]">
            <SafeImage
              src={HERO_IMAGES.motors}
              alt="DE-KING precision automotive accessories on dark slate"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
            <p className="text-xs font-semibold text-blue-400 mb-3">
              Motors & Precision Upgrades
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-balance mb-4">
              Endless accessories. Epic prices.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              Browse upgrades for your ride, workshop tooling, and Brand Outlet specials curated for lasting reliability across regional and global routes.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/category/motors"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-white text-slate-950 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                Shop Motors
              </Link>
              <Link
                to="/brand-outlet"
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium border border-white/20 bg-white/5 text-slate-100 rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Explore Brand Outlet
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-3" />
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1.5">
              Verified Accounts & Checkout
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every seller listing and buyer order on {BRAND_NAME} is protected with verified identity checks and live order tracking.
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-3" />
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1.5">
              East Africa & Global Shipping
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Dedicated delivery corridors across Tanzania, Kenya, Uganda, UK, US, and Europe with M-Pesa and card checkout.
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-3" />
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1.5">
              Hassle-Free Returns
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Submit return or missing-item claims directly from Customer Service with tracked resolution tickets.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
