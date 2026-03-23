'use client';

import { supabase } from '@/lib/supabase';
import { Fragment, useEffect, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface Order {
  id: string;
  customer_id: string;
  order_number: number;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total: number;
  payment_status: PaymentStatus;
  shipping_address: string | null;
  billing_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  order_items?: OrderItem[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAddress(addr: Address | null): string {
  if (!addr) return 'N/A';
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(', ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminOrdersPage() {
  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // -------------------------------------------------------------------
  // Fetch orders
  // -------------------------------------------------------------------

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('orders')
        .select(
          `*, customers!orders_customer_id_fkey(first_name, last_name, email), order_items(*)`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
      }

      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }

      if (searchQuery.trim()) {
        const term = searchQuery.trim();
        query = query.or(
          `order_number.eq.${parseInt(term) || 0},customers.first_name.ilike.%${term}%,customers.last_name.ilike.%${term}%`
        );
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setOrders((data as Order[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchQuery, dateFrom, dateTo]);

  // -------------------------------------------------------------------
  // Update order status
  // -------------------------------------------------------------------

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatusId(orderId);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // -------------------------------------------------------------------
  // Expand / collapse row
  // -------------------------------------------------------------------

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <span className="text-sm text-gray-500">{totalCount} order{totalCount !== 1 ? 's' : ''} total</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Order # or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green bg-white"
          >
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
          />
        </div>

        {/* Date to */}
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
          />
        </div>

        {/* Clear filters */}
        {(statusFilter !== 'all' || searchQuery || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-3 py-2 text-sm text-deep-green hover:bg-deep-green/5 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchOrders} className="ml-auto text-sm font-medium text-red-700 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-deep-green border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No orders found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Order #</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Payment</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const customerName = order.customers
                    ? `${order.customers.first_name} ${order.customers.last_name}`
                    : 'Unknown';

                  return (
                    <Fragment key={order.id}>
                      {/* Main row */}
                      <tr
                        onClick={() => toggleExpand(order.id)}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-deep-green/[0.03]' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 font-medium text-deep-green">{order.order_number}</td>
                        <td className="px-4 py-3">
                          <div>{customerName}</div>
                          {order.customers?.email && (
                            <div className="text-xs text-gray-400">{order.customers.email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3">
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </td>
                      </tr>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50/70 px-4 py-0">
                            <div className="py-5 space-y-5">
                              {/* Status update */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update status:</span>
                                {ORDER_STATUSES.map((s) => (
                                  <button
                                    key={s}
                                    disabled={updatingStatusId === order.id || order.status === s}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateOrderStatus(order.id, s);
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                      order.status === s
                                        ? `${STATUS_COLORS[s]} ring-2 ring-offset-1 ring-current`
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-deep-green hover:text-deep-green'
                                    } ${updatingStatusId === order.id ? 'opacity-50 cursor-wait' : ''}`}
                                  >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </button>
                                ))}
                                {updatingStatusId === order.id && (
                                  <div className="w-4 h-4 border-2 border-deep-green border-t-transparent rounded-full animate-spin" />
                                )}
                              </div>

                              {/* Grid: Items / Addresses */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Items */}
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                      Order Items ({order.order_items?.length ?? 0})
                                    </h4>
                                  </div>
                                  {order.order_items && order.order_items.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                      {order.order_items.map((item) => (
                                        <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                                            {item.variant_name && (
                                              <p className="text-xs text-gray-500">{item.variant_name}</p>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-medium">{formatCurrency(item.total_price)}</p>
                                            <p className="text-xs text-gray-400">
                                              {item.quantity} x {formatCurrency(item.unit_price)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="px-4 py-4 text-sm text-gray-400">No items</p>
                                  )}

                                  {/* Totals */}
                                  <div className="border-t border-gray-200 px-4 py-3 space-y-1 bg-gray-50/50">
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Subtotal</span>
                                      <span>{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                      <div className="flex justify-between text-xs text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(order.discount_amount)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Shipping</span>
                                      <span>{formatCurrency(order.shipping_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Tax</span>
                                      <span>{formatCurrency(order.tax_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-200">
                                      <span>Total</span>
                                      <span>{formatCurrency(order.total)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Addresses & Notes */}
                                <div className="space-y-4">
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                      Shipping Address
                                    </h4>
                                    <p className="text-sm text-gray-700">{formatAddress(order.shipping_address)}</p>
                                  </div>

                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                      Billing Address
                                    </h4>
                                    <p className="text-sm text-gray-700">{formatAddress(order.billing_address)}</p>
                                  </div>

                                  {order.notes && (
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                        Notes
                                      </h4>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                                    </div>
                                  )}

                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                      Timeline
                                    </h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <p>
                                        <span className="text-gray-400">Created:</span>{' '}
                                        {formatDateTime(order.created_at)}
                                      </p>
                                      <p>
                                        <span className="text-gray-400">Updated:</span>{' '}
                                        {formatDateTime(order.updated_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}
              &ndash;
              {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-xs font-medium text-gray-700">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
