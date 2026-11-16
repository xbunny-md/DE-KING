import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Trash2,
  Users,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_NAME, ORDER_STATUSES } from '../lib/constants';
import { formatCurrency } from '../lib/validation';
import {
  createGiftCard,
  deleteProduct,
  deleteTicketAdmin,
  getOrderItems,
  grantAdminAccess,
  revokeAdminAccess,
  subscribeAllAdmins,
  subscribeAllGiftCardsAdmin,
  subscribeAllOrdersAdmin,
  subscribeAllProductsAdmin,
  subscribeAllSubscribersAdmin,
  subscribeAllTicketsAdmin,
  subscribeAllUsersAdmin,
  subscribeAuditLogs,
  subscribeStoreSettings,
  updateGiftCardAdmin,
  updateOrderStatus,
  updateProduct,
  updateStoreSettings,
  updateTicketAdmin,
  updateUserAdmin,
  writeAuditLog,
} from '../services/firestoreService';
import type {
  AdminRecord,
  AuditLog,
  CurrencyCode,
  GiftCard,
  GiftCardStatus,
  NewsletterSubscriber,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductStatus,
  SupportTicket,
  TicketStatus,
  UserProfile,
  UserRole,
} from '../types';

type AdminTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'users'
  | 'gift-cards'
  | 'tickets'
  | 'newsletter'
  | 'settings'
  | 'audit';

const TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Catalog', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'gift-cards', label: 'Gift Cards', icon: CreditCard },
  { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'audit', label: 'Audit Logs', icon: Activity },
];

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AdminTab>('overview');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});

  // Ticket notes draft
  const [ticketNotes, setTicketNotes] = useState<Record<string, string>>({});

  // Admin Gift Card issuance form
  const [gcAmount, setGcAmount] = useState('50');
  const [gcRecipient, setGcRecipient] = useState('');

  // Store Settings form
  const [storeName, setStoreName] = useState(`${BRAND_NAME} Marketplace`);
  const [supportEmail, setSupportEmail] = useState('support@de-king.store');
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('USD');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('150');
  const [announcementText, setAnnouncementText] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribeAllProductsAdmin(setProducts),
      subscribeAllOrdersAdmin(setOrders),
      subscribeAllUsersAdmin(setUsers),
      subscribeAllAdmins(setAdmins),
      subscribeAllGiftCardsAdmin(setGiftCards),
      subscribeAllTicketsAdmin(setTickets),
      subscribeAllSubscribersAdmin(setSubscribers),
      subscribeAuditLogs(setAuditLogs),
      subscribeStoreSettings((s) => {
        if (!s) return;
        setStoreName(s.storeName);
        setSupportEmail(s.supportEmail);
        setDefaultCurrency(s.defaultCurrency);
        setFreeShippingThreshold(String(s.freeShippingThreshold));
        setAnnouncementText(s.announcementText);
        setMaintenanceMode(s.maintenanceMode);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const logAction = async (
    action: string,
    targetCollection: string,
    targetId: string,
    details: string
  ) => {
    if (!user?.email) return;
    await writeAuditLog({
      actorId: user.uid,
      actorEmail: user.email,
      action,
      targetCollection,
      targetId,
      details,
    });
  };

  const metrics = useMemo(() => {
    const grossRevenue = orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const activeListings = products.filter((p) => p.status === 'active').length;
    const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in-review').length;
    return {
      grossRevenue,
      activeListings,
      openTickets,
      totalUsers: users.length,
      totalOrders: orders.length,
      totalGiftCards: giftCards.length,
    };
  }, [orders, products, tickets, users, giftCards]);

  const adminUidSet = useMemo(() => new Set(admins.map((a) => a.uid)), [admins]);

  const handleExpandOrder = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    if (!orderItemsMap[orderId]) {
      const items = await getOrderItems(orderId);
      setOrderItemsMap((prev) => ({ ...prev, [orderId]: items }));
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateStoreSettings(
        {
          storeName,
          supportEmail,
          defaultCurrency,
          freeShippingThreshold: Number(freeShippingThreshold) || 0,
          announcementText,
          maintenanceMode,
        },
        user.uid
      );
      await logAction('UPDATE_SETTINGS', 'appSettings', 'storefront', `Updated store settings (${storeName})`);
      showToast('Store settings saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save settings.', 'error');
    }
  };

  const handleIssueGiftCard = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const code = await createGiftCard({
        amount: Number(gcAmount) || 50,
        recipientName: gcRecipient || `${BRAND_NAME} Customer`,
        designTheme: 'obsidian',
        purchaserId: user.uid,
      });
      await logAction('ISSUE_GIFT_CARD', 'giftCards', code, `Issued ${formatCurrency(Number(gcAmount))} card`);
      setGcRecipient('');
      showToast(`Issued gift card ${code}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to issue gift card.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 glass-panel rounded-2xl p-3 lg:sticky lg:top-20">
          <div className="px-3 py-2.5 mb-2 border-b border-slate-200/70 dark:border-white/10">
            <h1 className="font-display text-base font-bold text-slate-900 dark:text-white">
              {BRAND_NAME} Admin Console
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {user?.email}
            </p>
          </div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Viewport */}
        <div className="lg:col-span-9 space-y-6">
          {/* Top Breadcrumb Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-2xl px-5 py-4">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              <span>{BRAND_NAME} Admin</span>
              <span className="mx-2">/</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                {TABS.find((t) => t.id === tab)?.label}
              </span>
            </div>
            <Link
              to="/sell/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </Link>
          </div>

          {/* 1. Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Gross Order Volume', value: formatCurrency(metrics.grossRevenue) },
                  { label: 'Total Orders', value: String(metrics.totalOrders) },
                  { label: 'Active Catalog Listings', value: String(metrics.activeListings) },
                  { label: 'Registered Users', value: String(metrics.totalUsers) },
                  { label: 'Open Support Tickets', value: String(metrics.openTickets) },
                  { label: 'Issued Gift Cards', value: String(metrics.totalGiftCards) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-panel rounded-2xl p-5"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Recent Orders
                </h2>
                {orders.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No orders placed yet.</p>
                ) : (
                  <div className="divide-y divide-slate-200/70 dark:divide-white/10 text-sm">
                    {orders.slice(0, 5).map((o) => (
                      <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{o.id}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{o.buyerEmail} · {o.shippingCountry}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="capitalize text-xs font-medium text-slate-700 dark:text-slate-200">{o.status}</span>
                          <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                            {formatCurrency(o.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Catalog / Products */}
          {tab === 'products' && (
            <div className="glass-panel rounded-2xl overflow-x-auto">
              {products.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="Catalog is empty"
                    description="Publish products directly to Firestore to populate the storefront."
                    actionLabel="Create Product"
                    actionTo="/sell/new"
                  />
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">Product</th>
                      <th className="py-3.5 px-4 font-medium text-right">Price</th>
                      <th className="py-3.5 px-4 font-medium text-right">Stock</th>
                      <th className="py-3.5 px-4 font-medium">Flags</th>
                      <th className="py-3.5 px-4 font-medium">Status</th>
                      <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link to={`/product/${p.id}`} className="font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {p.title}
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{p.brand} · {p.sellerName}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(p.price)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          {p.stockQuantity}
                        </td>
                        <td className="py-3.5 px-4 text-xs space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={async () => {
                              await updateProduct(p.id, { isFeatured: !p.isFeatured }, true);
                              await logAction('TOGGLE_FEATURED', 'products', p.id, `isFeatured=${!p.isFeatured}`);
                            }}
                            className={`px-2 py-1 rounded border transition-colors ${
                              p.isFeatured
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-600/10'
                                : 'glass-subtle text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            Featured
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await updateProduct(p.id, { isDeal: !p.isDeal }, true);
                              await logAction('TOGGLE_DEAL', 'products', p.id, `isDeal=${!p.isDeal}`);
                            }}
                            className={`px-2 py-1 rounded border transition-colors ${
                              p.isDeal
                                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-600/10'
                                : 'glass-subtle text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            Deal
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            aria-label={`Status for ${p.title}`}
                            value={p.status}
                            onChange={async (e) => {
                              const next = e.target.value as ProductStatus;
                              await updateProduct(p.id, { status: next }, true);
                              await logAction('UPDATE_PRODUCT_STATUS', 'products', p.id, `status=${next}`);
                            }}
                            className="h-8 px-2 text-xs glass-input rounded text-slate-900 dark:text-white"
                          >
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="sold-out">Sold Out</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            aria-label={`Delete ${p.title}`}
                            onClick={async () => {
                              await deleteProduct(p.id);
                              await logAction('DELETE_PRODUCT', 'products', p.id, p.title);
                              showToast(`Deleted "${p.title}".`, 'info');
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* 3. Orders */}
          {tab === 'orders' && (
            <div className="glass-panel rounded-2xl divide-y divide-slate-200/70 dark:divide-white/10">
              {orders.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No orders yet" description="Orders placed by buyers will appear here." />
                </div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => handleExpandOrder(o.id)}
                          className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {o.id}
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {o.buyerName} ({o.buyerEmail}) · {o.shippingAddress}, {o.shippingCountry}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(o.totalAmount)}
                        </span>
                        <select
                          aria-label={`Order status for ${o.id}`}
                          value={o.status}
                          onChange={async (e) => {
                            const next = e.target.value as OrderStatus;
                            await updateOrderStatus(o.id, next);
                            await logAction('UPDATE_ORDER_STATUS', 'orders', o.id, `status=${next}`);
                            showToast(`Order ${o.id} marked ${next}.`, 'success');
                          }}
                          className="h-8 px-2 text-xs glass-input rounded text-slate-900 dark:text-white"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {expandedOrder === o.id && orderItemsMap[o.id] && (
                      <div className="glass-subtle rounded-xl p-3 text-xs space-y-1.5">
                        {orderItemsMap[o.id].map((li, i) => (
                          <div key={i} className="flex justify-between text-slate-800 dark:text-slate-200">
                            <span>{li.quantity} × {li.title}</span>
                            <span className="font-mono tabular-nums">{formatCurrency(li.unitPrice * li.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. Users & Roles */}
          {tab === 'users' && (
            <div className="glass-panel rounded-2xl overflow-x-auto">
              {users.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No user profiles" description="Verified user profiles appear here upon sign-in." />
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">User</th>
                      <th className="py-3.5 px-4 font-medium">Type</th>
                      <th className="py-3.5 px-4 font-medium">Role</th>
                      <th className="py-3.5 px-4 font-medium">Status</th>
                      <th className="py-3.5 px-4 font-medium text-right">Admin Grant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                    {users.map((u) => {
                      const isGrantedAdmin = adminUidSet.has(u.uid);
                      return (
                        <tr key={u.uid} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-slate-900 dark:text-white">{u.displayName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{u.email}</p>
                          </td>
                          <td className="py-3.5 px-4 capitalize text-xs text-slate-700 dark:text-slate-300">{u.accountType}</td>
                          <td className="py-3.5 px-4">
                            <select
                              aria-label={`Role for ${u.email}`}
                              value={u.role}
                              onChange={async (e) => {
                                const next = e.target.value as UserRole;
                                await updateUserAdmin(u.uid, { role: next });
                                await logAction('UPDATE_USER_ROLE', 'users', u.uid, `role=${next}`);
                                showToast(`Updated ${u.email} role to ${next}.`, 'success');
                              }}
                              className="h-8 px-2 text-xs glass-input rounded text-slate-900 dark:text-white"
                            >
                              <option value="buyer">Buyer</option>
                              <option value="seller">Seller</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              aria-label={`Account status for ${u.email}`}
                              value={u.status}
                              onChange={async (e) => {
                                const next = e.target.value as 'active' | 'suspended';
                                await updateUserAdmin(u.uid, { status: next });
                                await logAction('UPDATE_USER_STATUS', 'users', u.uid, `status=${next}`);
                              }}
                              className="h-8 px-2 text-xs glass-input rounded text-slate-900 dark:text-white"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {u.uid === user?.uid ? (
                              <span className="text-xs text-slate-400">Current Session</span>
                            ) : isGrantedAdmin ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  await revokeAdminAccess(u.uid);
                                  await logAction('REVOKE_ADMIN', 'admins', u.uid, u.email);
                                  showToast(`Revoked admin access for ${u.email}.`, 'info');
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                              >
                                Revoke Admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!user) return;
                                  await grantAdminAccess(u.uid, u.email, user.uid);
                                  await logAction('GRANT_ADMIN', 'admins', u.uid, u.email);
                                  showToast(`Granted admin access to ${u.email}.`, 'success');
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors"
                              >
                                Grant Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* 5. Gift Cards */}
          {tab === 'gift-cards' && (
            <div className="space-y-6">
              <form
                onSubmit={handleIssueGiftCard}
                className="glass-panel rounded-2xl p-5 flex flex-wrap items-end gap-3"
              >
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={gcRecipient}
                    onChange={(e) => setGcRecipient(e.target.value)}
                    placeholder="Recipient full name"
                    className="w-full h-9 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    min={5}
                    max={5000}
                    required
                    value={gcAmount}
                    onChange={(e) => setGcAmount(e.target.value)}
                    className="w-full h-9 px-3 text-sm font-mono tabular-nums glass-input rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="h-9 px-4 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Issue Gift Card
                </button>
              </form>

              <div className="glass-panel rounded-2xl overflow-x-auto">
                {giftCards.length === 0 ? (
                  <div className="p-6">
                    <EmptyState title="No gift cards issued" description="Issue a gift card above or wait for buyer purchases." />
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-3.5 px-4 font-medium">Code</th>
                        <th className="py-3.5 px-4 font-medium">Recipient</th>
                        <th className="py-3.5 px-4 font-medium text-right">Balance / Amount</th>
                        <th className="py-3.5 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                      {giftCards.map((gc) => (
                        <tr key={gc.code} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-xs text-slate-900 dark:text-white">{gc.code}</td>
                          <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">{gc.recipientName}</td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-slate-900 dark:text-white">
                            {formatCurrency(gc.balance)} / {formatCurrency(gc.amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              aria-label={`Gift card status for ${gc.code}`}
                              value={gc.status}
                              onChange={async (e) => {
                                const next = e.target.value as GiftCardStatus;
                                await updateGiftCardAdmin(gc.code, { status: next });
                                await logAction('UPDATE_GIFT_CARD', 'giftCards', gc.code, `status=${next}`);
                              }}
                              className="h-8 px-2 text-xs glass-input rounded text-slate-900 dark:text-white"
                            >
                              <option value="active">Active</option>
                              <option value="partially-used">Partially Used</option>
                              <option value="redeemed">Redeemed</option>
                              <option value="void">Void</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* 6. Support Tickets */}
          {tab === 'tickets' && (
            <div className="glass-panel rounded-2xl divide-y divide-slate-200/70 dark:divide-white/10">
              {tickets.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No support tickets" description="Customer inquiries and return requests will appear here." />
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{t.id}</span>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {t.subject}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t.name} ({t.email}) · Type: {t.type}{t.orderId ? ` · Order: ${t.orderId}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Ticket status for ${t.id}`}
                          value={t.status}
                          onChange={async (e) => {
                            const next = e.target.value as TicketStatus;
                            await updateTicketAdmin(t.id, next, ticketNotes[t.id] ?? t.adminNotes ?? '');
                            await logAction('UPDATE_TICKET', 'supportTickets', t.id, `status=${next}`);
                            showToast('Ticket status updated.', 'success');
                          }}
                          className="h-8 px-2 text-xs glass-input rounded text-slate-900 dark:text-white"
                        >
                          <option value="open">Open</option>
                          <option value="in-review">In Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteTicketAdmin(t.id);
                            await logAction('DELETE_TICKET', 'supportTickets', t.id, t.subject);
                          }}
                          aria-label={`Delete ticket ${t.id}`}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t.message}</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ticketNotes[t.id] ?? t.adminNotes ?? ''}
                        onChange={(e) => setTicketNotes((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="Resolution notes visible to customer..."
                        className="flex-1 h-9 px-3 text-xs glass-input rounded-lg text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await updateTicketAdmin(t.id, t.status, ticketNotes[t.id] ?? t.adminNotes ?? '');
                          await logAction('ADD_TICKET_NOTE', 'supportTickets', t.id, 'Updated admin resolution note');
                          showToast('Resolution note saved.', 'success');
                        }}
                        className="px-3 h-9 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 7. Newsletter */}
          {tab === 'newsletter' && (
            <div className="glass-panel rounded-2xl p-6">
              {subscribers.length === 0 ? (
                <EmptyState title="No subscribers yet" description="Footer newsletter sign-ups appear here." />
              ) : (
                <div className="divide-y divide-slate-200/70 dark:divide-white/10 text-sm">
                  {subscribers.map((s, idx) => (
                    <div key={s.id || idx} className="py-2.5 flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-900 dark:text-white">{s.email}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. Settings */}
          {tab === 'settings' && (
            <form
              onSubmit={handleSaveSettings}
              className="glass-panel rounded-2xl p-6 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Storefront Name</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Support Email</label>
                  <input
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Currency</label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value as CurrencyCode)}
                    className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="TZS">TZS</option>
                    <option value="KES">KES</option>
                    <option value="UGX">UGX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Free Shipping Threshold (USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums glass-input rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Top Announcement Banner (Optional)</label>
                <input
                  type="text"
                  maxLength={200}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. Free regional shipping on orders over $150"
                  className="w-full h-10 px-3 text-sm glass-input rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                />
                <span>Enable Maintenance Banner Mode</span>
              </label>

              <div>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </form>
          )}

          {/* 9. Audit Logs */}
          {tab === 'audit' && (
            <div className="glass-panel rounded-2xl p-6">
              {auditLogs.length === 0 ? (
                <EmptyState title="No audit events recorded" description="Administrative actions are logged here immutably." />
              ) : (
                <div className="divide-y divide-slate-200/70 dark:divide-white/10 text-xs">
                  {auditLogs.map((log, i) => (
                    <div key={log.id || i} className="py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">{log.action}</span>
                        <span className="mx-2 text-slate-400">·</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">{log.targetCollection}/{log.targetId}</span>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                      </div>
                      <div className="text-right text-slate-500 dark:text-slate-400">
                        <p className="font-mono">{log.actorEmail}</p>
                        <p>{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'Just now'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
