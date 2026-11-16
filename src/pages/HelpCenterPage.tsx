import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  LifeBuoy,
  MessageSquare,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
  Truck,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_NAME, HELP_GUIDES, TICKET_TYPES } from '../lib/constants';
import {
  createSupportTicket,
  subscribeMyTickets,
} from '../services/firestoreService';
import type { SupportTicket, TicketType } from '../types';

const TOPIC_ICONS: Record<string, typeof BookOpen> = {
  buying: BookOpen,
  selling: Tag,
  'selling-faq': BookOpen,
  'selling-tips': BookOpen,
  account: ShieldCheck,
  'returns-refunds': RotateCcw,
  'shipping-tracking': Truck,
  'fees-billing': LifeBuoy,
};

const POPULAR_ARTICLES = [
  { label: 'How to track your order', to: '/help/shipping-tracking' },
  { label: 'Start a return & refund', to: '/help/returns-refunds' },
  { label: 'Seller listing best practices', to: '/help/selling-tips' },
  { label: 'Account security & verification', to: '/help/account' },
];

export function HelpCenterPage({ defaultContactOpen = false }: { defaultContactOpen?: boolean }) {
  const { topic } = useParams<{ topic?: string }>();
  const [searchParams] = useSearchParams();
  const { user, profile, isVerified } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [ticketType, setTicketType] = useState<TicketType>(
    (searchParams.get('type') as TicketType) || 'general'
  );
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (profile?.displayName) setName(profile.displayName);
    else if (user?.displayName) setName(user.displayName);
    if (user?.email) setEmail(user.email);
  }, [profile, user]);

  useEffect(() => {
    const paramType = searchParams.get('type') as TicketType | null;
    if (paramType) setTicketType(paramType);
    const paramSub = searchParams.get('subject');
    if (paramSub) setSubject(paramSub);
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      setMyTickets([]);
      return;
    }
    const unsub = subscribeMyTickets(user.uid, setMyTickets);
    return () => unsub();
  }, [user]);

  const activeGuide = topic ? HELP_GUIDES.find((g) => g.slug === topic) : null;

  const filteredGuides = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return HELP_GUIDES;
    return HELP_GUIDES.filter((g) => {
      const text = `${g.title} ${g.subtitle} ${g.sections.map((s) => s.items.map((i) => `${i.q} ${i.a}`).join(' ')).join(' ')}`.toLowerCase();
      return text.includes(q);
    });
  }, [searchTerm]);

  const handleSubmitTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to submit a support ticket.', 'error');
      navigate('/login');
      return;
    }
    if (!isVerified) {
      showToast('Please verify your email address before submitting a ticket.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const id = await createSupportTicket({
        userId: user.uid,
        name: name || user.email || `${BRAND_NAME} Member`,
        email: email || user.email || '',
        type: ticketType,
        orderId,
        subject,
        message,
      });
      setSubject('');
      setMessage('');
      setOrderId('');
      showToast(`Support ticket ${id} submitted.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to submit ticket.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/70 dark:border-white/10 pb-6">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white">{BRAND_NAME}</Link>
            <span>›</span>
            <Link to="/contact" className="hover:text-slate-900 dark:hover:text-white">Customer Service</Link>
            {activeGuide && (
              <>
                <span>›</span>
                <span className="text-slate-900 dark:text-slate-200 font-medium">{activeGuide.title}</span>
              </>
            )}
          </nav>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            {activeGuide ? activeGuide.title : `${BRAND_NAME} Customer Service & Help Center`}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {activeGuide
              ? activeGuide.subtitle
              : 'Browse buying, selling, returns, and billing guides or open a live support ticket.'}
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${BRAND_NAME} help guides...`}
            className="w-full h-10 pl-9 pr-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Preserved Popular Articles Strip */}
      <div className="glass-subtle rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
          Popular articles
        </span>
        {POPULAR_ARTICLES.map((art) => (
          <Link
            key={art.to}
            to={art.to}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-md glass-subtle"
          >
            {art.label}
          </Link>
        ))}
      </div>

      {/* Selected Topic Guide View */}
      {activeGuide && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">{activeGuide.summary}</p>
            <Link to="/contact" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              All Help Topics
            </Link>
          </div>

          {activeGuide.sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item) => (
                  <div
                    key={item.q}
                    className="glass-subtle rounded-xl p-5"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                      {item.q}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Topics Grid */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Browse Help Topics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredGuides.map((guide) => {
            const Icon = TOPIC_ICONS[guide.slug] || BookOpen;
            return (
              <Link
                key={guide.slug}
                to={`/help/${guide.slug}`}
                className={`glass-card rounded-2xl p-5 flex flex-col justify-between ${
                  guide.slug === topic
                    ? 'border-blue-600 ring-1 ring-blue-600/30'
                    : ''
                }`}
              >
                <div>
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {guide.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Preserved Other Options For You (Start Return / Report Missing Item) */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Need more help? Other options for you
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/contact-us?type=return&subject=Return%20Request"
            className="glass-card rounded-2xl p-6 flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl glass-subtle flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Start a return
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Request a return authorization and refund to your original payment method.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </Link>

          <Link
            to="/contact-us?type=missing-item&subject=Missing%20Item%20Report"
            className="glass-card rounded-2xl p-6 flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl glass-subtle flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Report a missing item
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Open an investigation if a shipment arrived incomplete or missed its window.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </Link>
        </div>
      </section>

      {/* Live Support Ticket Form & User Ticket History */}
      <section id="support-form" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmitTicket}
          className={`lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-8 space-y-5 ${
            defaultContactOpen ? 'ring-1 ring-blue-600/30' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Submit a Support or Return Request
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tkt-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Request Type
              </label>
              <select
                id="tkt-type"
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as TicketType)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              >
                {TICKET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tkt-order" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Order ID (Optional)
              </label>
              <input
                id="tkt-order"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ord_..."
                className="w-full h-10 px-3 text-sm font-mono glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tkt-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Name *
              </label>
              <input
                id="tkt-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="tkt-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address *
              </label>
              <input
                id="tkt-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tkt-subj" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject *
            </label>
            <input
              id="tkt-subj"
              type="text"
              required
              minLength={2}
              maxLength={160}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your question or claim"
              className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="tkt-msg" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Details *
            </label>
            <textarea
              id="tkt-msg"
              rows={4}
              required
              minLength={5}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide details so our support team can assist you."
              className="w-full p-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {submitting ? 'Submitting Ticket...' : 'Send Support Request'}
          </button>
        </form>

        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Your Support Tickets
          </h3>
          {!user ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Sign in
              </Link>{' '}
              to submit return requests, report missing items, and track responses.
            </p>
          ) : myTickets.length === 0 ? (
            <EmptyState
              title="No support tickets"
              description="Requests you submit will appear here with real-time admin resolution updates."
            />
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-white/10">
              {myTickets.map((t) => (
                <div key={t.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-slate-500 dark:text-slate-400">{t.id}</span>
                    <span className="font-semibold capitalize text-blue-600 dark:text-blue-400">
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.subject}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{t.message}</p>
                  {t.adminNotes && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                      Resolution: {t.adminNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
