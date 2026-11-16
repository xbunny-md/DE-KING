import { useEffect, useState } from 'react';
import { ChevronDown, Package } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SafeImage } from '../components/common/SafeImage';
import { TableRowsSkeleton } from '../components/common/Skeletons';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_NAME } from '../lib/constants';
import { formatCurrency } from '../lib/validation';
import {
  cancelMyOrder,
  getOrderItems,
  subscribeMyOrders,
} from '../services/firestoreService';
import type { Order, OrderItem } from '../types';

export function PurchaseHistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const unsub = subscribeMyOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!itemsByOrder[orderId]) {
      try {
        const items = await getOrderItems(orderId);
        setItemsByOrder((prev) => ({ ...prev, [orderId]: items }));
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Unable to load order items.', 'error');
      }
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await cancelMyOrder(orderId);
      showToast(`Order ${orderId} cancelled.`, 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to cancel order.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Purchase History
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review your {BRAND_NAME} orders, inspect line items, and track fulfillment status.
        </p>
      </div>

      {loading ? (
        <TableRowsSkeleton rows={4} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders placed yet"
          description="Completed checkouts and delivery status updates will appear here."
          actionLabel="Shop Catalog"
          actionTo="/catalog"
          icon={<Package className="w-6 h-6" />}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isOpen = expandedId === order.id;
            const lineItems = itemsByOrder[order.id];
            const dateLabel = order.createdAt?.toDate
              ? order.createdAt.toDate().toLocaleDateString()
              : 'Just now';

            return (
              <div
                key={order.id}
                className="glass-panel rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(order.id)}
                  className="w-full px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-left hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {order.id}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {dateLabel} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} · {order.shippingCountry}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-200">
                      {order.status}
                    </span>
                    <span className="font-mono font-bold text-sm tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-200/70 dark:border-white/10 px-6 py-5 glass-subtle space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Shipping Address</span>
                        <span>{order.shippingAddress}, {order.postalCode}, {order.shippingCountry}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Payment Method</span>
                        <span className="uppercase">{order.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Breakdown</span>
                        <span className="font-mono tabular-nums">
                          Subtotal {formatCurrency(order.subtotal)}
                          {order.discountAmount > 0 ? ` · Discount -${formatCurrency(order.discountAmount)}` : ''}
                        </span>
                      </div>
                    </div>

                    {lineItems ? (
                      <div className="divide-y divide-slate-200/70 dark:divide-white/10 glass-panel rounded-xl">
                        {lineItems.map((li, idx) => (
                          <div key={`${li.productId}-${idx}`} className="p-3 flex items-center gap-3 text-sm">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100/70 dark:bg-slate-800 shrink-0">
                              <SafeImage src={li.imageUrl} alt={li.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white truncate">{li.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                                Qty {li.quantity} × {formatCurrency(li.unitPrice)}
                              </p>
                            </div>
                            <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                              {formatCurrency(li.quantity * li.unitPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Loading line items...</p>
                    )}

                    {order.status === 'pending' && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCancel(order.id)}
                          className="px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          Cancel Pending Order
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
