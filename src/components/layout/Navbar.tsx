import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Menu,
  Moon,
  Search,
  Shield,
  ShoppingBag,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BRAND_NAME, CATEGORIES } from '../../lib/constants';

export function Navbar({ announcementText }: { announcementText?: string }) {
  const { user, isAdmin } = useAuth();
  const { cartCount, savedItems, shippingPref } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (searchCategory !== 'all') params.set('category', searchCategory);
    navigate(`/catalog?${params.toString()}`);
    setMobileOpen(false);
  };

  return (
    <div>
      {announcementText && (
        <div className="bg-slate-950 dark:bg-blue-950/90 text-white text-xs py-1.5 px-4 text-center border-b border-white/10">
          {announcementText}
        </div>
      )}

      {/* Primary Top Bar Contract: Zone 1 (DE-KING Wordmark) - Zone 2 (5 Concise Nav Links) - Zone 3 (Primary Action) */}
      <header className="sticky top-0 z-40 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            {BRAND_NAME}
          </Link>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                `hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  isActive ? 'border-blue-600 text-slate-950 dark:text-white' : 'border-transparent'
                }`
              }
            >
              Catalog
            </NavLink>
            <NavLink
              to="/deals"
              className={({ isActive }) =>
                `hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  isActive ? 'border-blue-600 text-slate-950 dark:text-white' : 'border-transparent'
                }`
              }
            >
              Deals
            </NavLink>
            <NavLink
              to="/brand-outlet"
              className={({ isActive }) =>
                `hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  isActive ? 'border-blue-600 text-slate-950 dark:text-white' : 'border-transparent'
                }`
              }
            >
              Brand Outlet
            </NavLink>
            <NavLink
              to="/gift-cards"
              className={({ isActive }) =>
                `hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  isActive ? 'border-blue-600 text-slate-950 dark:text-white' : 'border-transparent'
                }`
              }
            >
              Gift Cards
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  isActive ? 'border-blue-600 text-slate-950 dark:text-white' : 'border-transparent'
                }`
              }
            >
              Help
            </NavLink>
          </nav>

          {/* Zone 3: Cart & Primary Account Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/cart"
              aria-label={`Shopping cart with ${cartCount} items`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 glass-subtle rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono tabular-nums">{cartCount}</span>
            </Link>

            {user ? (
              <Link
                to="/account"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Account</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                Sign In
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className="md:hidden p-2 text-slate-700 dark:text-slate-200 glass-subtle rounded-xl"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Search, Regional Utility & Original DE-KING Department Bar */}
      <div className="border-b border-slate-900/[0.06] dark:border-white/[0.07] bg-white/45 dark:bg-slate-950/45 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl items-center gap-2">
            <select
              aria-label="Filter by category"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="hidden sm:block h-10 px-3 text-xs font-medium glass-input rounded-xl text-slate-700 dark:text-slate-200"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for anything on DE-KING..."
                className="w-full h-10 pl-10 pr-3 text-sm glass-input rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Link
              to="/ship-to"
              className="inline-flex items-center gap-1 hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Ship to: {shippingPref.country}</span>
            </Link>
            <Link
              to="/sell"
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Sell
            </Link>
            <Link
              to="/saved"
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Watchlist ({savedItems.length})
            </Link>
            <Link
              to="/purchase-history"
              className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              My Kings
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 glass-subtle rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Preserved DE-KING Department Bar from home.php */}
        <nav
          aria-label="Departments"
          className="max-w-7xl mx-auto px-4 sm:px-6 pb-2.5 flex items-center gap-5 overflow-x-auto text-xs font-medium text-slate-600 dark:text-slate-400"
        >
          {CATEGORIES.map((cat) => (
            <NavLink
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className={({ isActive }) =>
                `hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                }`
              }
            >
              {cat.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden glass-nav px-4 py-4 space-y-3">
          <nav className="grid grid-cols-2 gap-2 text-sm font-medium">
            <Link to="/catalog" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl glass-subtle">
              Catalog
            </Link>
            <Link to="/deals" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl glass-subtle">
              Deals
            </Link>
            <Link to="/brand-outlet" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl glass-subtle">
              Brand Outlet
            </Link>
            <Link to="/gift-cards" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl glass-subtle">
              Gift Cards
            </Link>
            <Link to="/sell" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl glass-subtle">
              Sell
            </Link>
            <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl glass-subtle">
              Help & Contact
            </Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl glass-subtle text-blue-600 dark:text-blue-400">
                Admin Console
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
