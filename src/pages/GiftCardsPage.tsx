import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, CreditCard, MapPin, Search, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SafeImage } from '../components/common/SafeImage';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_NAME, GIFT_CARD_THEMES, HERO_IMAGES, RETAIL_PARTNERS } from '../lib/constants';
import { formatCurrency } from '../lib/validation';
import {
  createGiftCard,
  lookupGiftCard,
  subscribeMyGiftCards,
} from '../services/firestoreService';
import type { GiftCard, GiftCardTheme } from '../types';

const FAQ_ITEMS = [
  {
    q: 'What can DE-KING gift cards be used for?',
    a: 'DE-KING gift cards can be redeemed at checkout toward eligible products across Electronics, Motors, Fashion, Collectibles & Art, Sports, Health & Beauty, Industrial Equipment, Home & Garden, and Brand Outlet listings.',
  },
  {
    q: 'Do I need an account to redeem a gift card?',
    a: 'Yes. A verified DE-KING account is required to apply a gift card code at checkout and protect remaining balances.',
  },
  {
    q: 'Do DE-KING gift cards expire?',
    a: 'Standard DE-KING digital and retail gift cards carry no expiration date or maintenance fees.',
  },
  {
    q: 'What happens if my order total is less than the card balance?',
    a: 'The unused balance stays active on the same gift card code and can be applied to future purchases.',
  },
];

const VALUE_PROPS = [
  {
    title: 'Hassle-free',
    description: 'Redeem digitally in seconds at checkout or purchase in person at authorized regional partner desks.',
    icon: ShieldCheck,
  },
  {
    title: 'Heartwarming designs',
    description: 'Select from Obsidian Matte, Champagne Stone, Royal Cobalt, and Emerald Studio finishes.',
    icon: Sparkles,
  },
  {
    title: 'Never expires',
    description: 'No expiration dates and zero dormancy fees—unused balances carry forward automatically.',
    icon: Clock,
  },
];

export function GiftCardsPage() {
  const { user, isVerified } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [amount, setAmount] = useState(50);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [designTheme, setDesignTheme] = useState<GiftCardTheme>('obsidian');
  const [purchasing, setPurchasing] = useState(false);

  const [checkCode, setCheckCode] = useState('');
  const [checkedCard, setCheckedCard] = useState<GiftCard | null>(null);
  const [checking, setChecking] = useState(false);

  const [myCards, setMyCards] = useState<GiftCard[]>([]);
  const [retailerQuery, setRetailerQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!user) {
      setMyCards([]);
      return;
    }
    const unsub = subscribeMyGiftCards(user.uid, setMyCards);
    return () => unsub();
  }, [user]);

  const handlePurchase = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to issue a gift card.', 'error');
      navigate('/login');
      return;
    }
    if (!isVerified) {
      showToast('Please verify your email address before purchasing a gift card.', 'error');
      return;
    }
    setPurchasing(true);
    try {
      const code = await createGiftCard({
        amount,
        recipientName,
        recipientEmail,
        message,
        designTheme,
        purchaserId: user.uid,
      });
      setRecipientName('');
      setRecipientEmail('');
      setMessage('');
      setCheckCode(code);
      showToast(`Gift card ${code} created (${formatCurrency(amount)}).`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to issue gift card.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isVerified) {
      showToast('Sign in with a verified account to verify gift card balances.', 'info');
      return;
    }
    if (!checkCode.trim()) return;
    setChecking(true);
    try {
      const card = await lookupGiftCard(checkCode);
      setCheckedCard(card);
      if (!card) {
        showToast('No gift card found for that code.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to look up gift card.', 'error');
    } finally {
      setChecking(false);
    }
  };

  const filteredRetailers = RETAIL_PARTNERS.filter((r) => {
    const q = retailerQuery.trim().toLowerCase();
    if (!q) return true;
    return `${r.city} ${r.country} ${r.partner} ${r.address}`.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* King Gift Cards Sub-Navigation */}
      <div className="glass-subtle rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>King Gift Cards</span>
        </div>
        <nav className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <a href="#issue-card" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Buy Digital Card
          </a>
          <a href="#balance-check" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Check Balance
          </a>
          <a href="#retailers" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Nearest Retailer
          </a>
          <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            FAQ
          </a>
        </nav>
      </div>

      {/* Hero Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch glass-panel rounded-2xl overflow-hidden">
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            {BRAND_NAME} Digital &amp; Retail Gifting
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 text-balance">
            Give the gift of choice with {BRAND_NAME} Gift Cards.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-7">
            Issue instant digital gift codes redeemable across every department, verify live balances, or locate nearby partner counters in East Africa and worldwide.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#issue-card"
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm"
            >
              Buy Gift Card
            </a>
            <a
              href="#retailers"
              className="px-5 py-2.5 text-sm font-medium glass-subtle text-slate-800 dark:text-slate-200 rounded-lg hover:bg-white/70 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Nearest Retailer
            </a>
          </div>
        </div>
        <div className="lg:col-span-6 min-h-[260px] bg-slate-100/60 dark:bg-slate-900/50">
          <SafeImage
            src={HERO_IMAGES.giftCards}
            alt="Obsidian and champagne DE-KING gift cards on travertine stone"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Preserved 3 Value Propositions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {VALUE_PROPS.map((prop) => {
          const Icon = prop.icon;
          return (
            <div key={prop.title} className="glass-card rounded-2xl p-6 space-y-2.5">
              <div className="w-9 h-9 rounded-lg glass-subtle flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {prop.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {prop.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Purchase & Balance Checker */}
      <section id="issue-card" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handlePurchase}
          className="lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Create &amp; Issue Gift Card
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Generates a unique redeemable {BRAND_NAME} code saved directly to your account ledger.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Amount (USD)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[25, 50, 100, 250].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`py-2.5 text-sm font-semibold font-mono tabular-nums rounded-lg border transition-colors ${
                    amount === preset
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'glass-subtle text-slate-700 dark:text-slate-300 hover:border-blue-500/40'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={5}
              max={5000}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Card Finish
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GIFT_CARD_THEMES.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setDesignTheme(theme.value)}
                  className={`p-3 rounded-xl border text-left transition-all glass-subtle ${
                    designTheme === theme.value
                      ? 'border-blue-600 ring-2 ring-blue-600/20'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`h-5 w-full rounded mb-2 ${theme.accent}`} />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gc-recipient" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Recipient Name *
              </label>
              <input
                id="gc-recipient"
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Amina Juma"
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="gc-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Recipient Email (Optional)
              </label>
              <input
                id="gc-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gc-message" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Personal Message
            </label>
            <textarea
              id="gc-message"
              rows={2}
              maxLength={300}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enjoy shopping on ${BRAND_NAME}.`}
              className="w-full p-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={purchasing}
            className="w-full py-3 px-5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {purchasing ? 'Issuing Gift Card...' : `Issue Gift Card (${formatCurrency(amount)})`}
          </button>
        </form>

        {/* Right column: Balance Checker + My Purchased Gift Cards */}
        <div id="balance-check" className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Check Gift Card Balance
            </h2>
            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="text"
                value={checkCode}
                onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                placeholder="KING-XXXX-XXXX"
                className="flex-1 h-10 px-3 text-sm font-mono uppercase glass-input rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={checking}
                className="px-4 h-10 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg whitespace-nowrap hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors"
              >
                {checking ? 'Checking...' : 'Check'}
              </button>
            </form>

            {checkedCard && (
              <div className="p-4 rounded-xl glass-subtle text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Code</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{checkedCard.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Remaining Balance</span>
                  <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(checkedCard.balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <span className="capitalize font-medium text-slate-900 dark:text-white">{checkedCard.status}</span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Your Issued Gift Cards
            </h3>
            {!user ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Sign in
                </Link>{' '}
                to view gift cards you have purchased.
              </p>
            ) : myCards.length === 0 ? (
              <EmptyState
                title="No gift cards issued yet"
                description="Gift cards you purchase will appear here with their live remaining balance."
                icon={<CreditCard className="w-5 h-5" />}
              />
            ) : (
              <div className="divide-y divide-slate-200/70 dark:divide-white/10">
                {myCards.map((card) => (
                  <div key={card.code} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-slate-900 dark:text-white truncate">
                        {card.code}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        For {card.recipientName} · {card.status}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(card.balance)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        of {formatCurrency(card.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Nearest Retailer Locator */}
      <section id="retailers" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Buy from Nearest Retailer
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Locate partner retail desks where {BRAND_NAME} gift cards are sold in person.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={retailerQuery}
              onChange={(e) => setRetailerQuery(e.target.value)}
              placeholder="Search city or country..."
              className="w-full h-10 pl-9 pr-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRetailers.map((loc) => (
            <div
              key={loc.partner}
              className="glass-card rounded-2xl p-5 space-y-2"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{loc.city} · {loc.country}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {loc.partner}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{loc.address}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">Hours: {loc.hours}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bulk CTA & FAQ */}
      <section id="faq" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 glass-dark-panel text-white rounded-2xl p-8 space-y-4">
          <h2 className="font-display text-2xl font-bold">
            Need Bulk Corporate Gift Cards?
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Reward teams, run customer incentives, or issue bulk corporate {BRAND_NAME} credits with consolidated invoicing.
          </p>
          <Link
            to="/contact-us?type=billing&subject=Bulk%20Gift%20Cards%20Order"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-white text-slate-900 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Request Bulk Order
          </Link>
        </div>

        <div className="lg:col-span-7 glass-panel rounded-2xl divide-y divide-slate-200/70 dark:divide-white/10">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900 dark:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="px-6 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
