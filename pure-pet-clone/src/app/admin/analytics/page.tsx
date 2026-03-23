'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  lastMonthOrders: number;
  lastMonthRevenue: number;
  newCustomers: number;
  lastMonthNewCustomers: number;
}

interface TopProduct {
  product_id: string;
  name: string;
  total_quantity: number;
  total_revenue: number;
  image_url?: string;
}

interface RecentReview {
  id: string;
  rating: number;
  comment: string;
  customer_name: string;
  product_name: string;
  created_at: string;
}

interface SubscriberMonth {
  month: string;
  count: number;
}

interface DailyOrders {
  day: string;
  count: number;
  revenue: number;
}

type DateRange = 'week' | 'month' | 'quarter' | 'year';

const DATE_RANGES: { id: DateRange; label: string }[] = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' },
];

function getDateRange(range: DateRange): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (range) {
    case 'week': {
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);
      prevStart.setHours(0, 0, 0, 0);
      break;
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);
      break;
    }
    case 'quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd.getFullYear(), Math.floor(prevEnd.getMonth() / 3) * 3, 1);
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1);
      prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd.getFullYear(), 0, 1);
      break;
    }
  }

  return { start, end, prevStart, prevEnd };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

function formatPercent(current: number, previous: number): { value: string; positive: boolean } {
  if (previous === 0) return { value: current > 0 ? '+100%' : '0%', positive: current >= 0 };
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
    positive: change >= 0,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    lastMonthOrders: 0,
    lastMonthRevenue: 0,
    newCustomers: 0,
    lastMonthNewCustomers: 0,
  });

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [subscriberGrowth, setSubscriberGrowth] = useState<SubscriberMonth[]>([]);
  const [dailyOrders, setDailyOrders] = useState<DailyOrders[]>([]);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { start, end, prevStart, prevEnd } = getDateRange(dateRange);
    const startStr = start.toISOString();
    const endStr = end.toISOString();
    const prevStartStr = prevStart.toISOString();
    const prevEndStr = prevEnd.toISOString();

    try {
      // Fetch current period orders
      const { data: currentOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .gte('created_at', startStr)
        .lte('created_at', endStr);
      if (ordersErr) throw ordersErr;

      // Fetch previous period orders
      const { data: prevOrders, error: prevOrdersErr } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .gte('created_at', prevStartStr)
        .lte('created_at', prevEndStr);
      if (prevOrdersErr) throw prevOrdersErr;

      // Fetch current period new customers
      const { count: newCust, error: custErr } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startStr)
        .lte('created_at', endStr);
      if (custErr) throw custErr;

      // Fetch previous period new customers
      const { count: prevNewCust, error: prevCustErr } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', prevStartStr)
        .lte('created_at', prevEndStr);
      if (prevCustErr) throw prevCustErr;

      const totalRevenue = (currentOrders || []).reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0);
      const prevRevenue = (prevOrders || []).reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0);

      setStats({
        totalOrders: currentOrders?.length || 0,
        totalRevenue: totalRevenue,
        lastMonthOrders: prevOrders?.length || 0,
        lastMonthRevenue: prevRevenue,
        newCustomers: newCust || 0,
        lastMonthNewCustomers: prevNewCust || 0,
      });

      // Build daily orders for chart
      const dailyMap = new Map<string, { count: number; revenue: number }>();
      (currentOrders || []).forEach(o => {
        const day = new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const existing = dailyMap.get(day) || { count: 0, revenue: 0 };
        dailyMap.set(day, { count: existing.count + 1, revenue: existing.revenue + (parseFloat(String(o.total)) || 0) });
      });
      const sorted = Array.from(dailyMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([day, data]) => ({ day, ...data }));
      setDailyOrders(sorted);

      // Top products
      const { data: orderItems, error: itemsErr } = await supabase
        .from('order_items')
        .select('product_id, quantity, price, products(name, image_url)')
        .gte('created_at', startStr)
        .lte('created_at', endStr);

      if (itemsErr) {
        // Fallback: try without date filter on order_items (join through orders)
        const { data: allItems, error: allItemsErr } = await supabase
          .from('order_items')
          .select('product_id, quantity, price, products(name, image_url)');
        if (allItemsErr) throw allItemsErr;
        processTopProducts(allItems || []);
      } else {
        processTopProducts(orderItems || []);
      }

      // Recent reviews
      const { data: reviews, error: reviewsErr } = await supabase
        .from('reviews')
        .select('id, rating, comment, customer_name, product_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (reviewsErr) throw reviewsErr;
      setRecentReviews(reviews || []);

      // Subscriber growth (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data: subscribers, error: subsErr } = await supabase
        .from('email_subscribers')
        .select('id, created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });
      if (subsErr) throw subsErr;

      const monthMap = new Map<string, number>();
      (subscribers || []).forEach(s => {
        const month = new Date(s.created_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        monthMap.set(month, (monthMap.get(month) || 0) + 1);
      });
      setSubscriberGrowth(Array.from(monthMap.entries()).map(([month, count]) => ({ month, count })));

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const processTopProducts = (items: any[]) => {
    const productMap = new Map<string, TopProduct>();
    items.forEach((item: any) => {
      const pid = item.product_id;
      const existing = productMap.get(pid);
      const qty = parseInt(String(item.quantity)) || 1;
      const price = parseFloat(String(item.price)) || 0;
      const productData = item.products as any;
      if (existing) {
        existing.total_quantity += qty;
        existing.total_revenue += price * qty;
      } else {
        productMap.set(pid, {
          product_id: pid,
          name: productData?.name || 'Unknown Product',
          total_quantity: qty,
          total_revenue: price * qty,
          image_url: productData?.image_url,
        });
      }
    });
    const sorted = Array.from(productMap.values()).sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10);
    setTopProducts(sorted);
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ─── Render Helpers ────────────────────────────────────────────────────────

  const maxDailyCount = Math.max(...dailyOrders.map(d => d.count), 1);
  const maxSubscriberCount = Math.max(...subscriberGrowth.map(s => s.count), 1);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? 'text-gold' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Track your store performance and key metrics</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-deep-green border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const ordersChange = formatPercent(stats.totalOrders, stats.lastMonthOrders);
  const revenueChange = formatPercent(stats.totalRevenue, stats.lastMonthRevenue);
  const customersChange = formatPercent(stats.newCustomers, stats.lastMonthNewCustomers);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track your store performance and key metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {DATE_RANGES.map(r => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                dateRange === r.id
                  ? 'bg-deep-green text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xs font-medium ${ordersChange.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {ordersChange.value}
            </span>
            <span className="text-xs text-gray-400">vs prev period</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xs font-medium ${revenueChange.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {revenueChange.value}
            </span>
            <span className="text-xs text-gray-400">vs prev period</span>
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Customers</span>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.newCustomers.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xs font-medium ${customersChange.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {customersChange.value}
            </span>
            <span className="text-xs text-gray-400">vs prev period</span>
          </div>
        </div>

        {/* Page Views (placeholder) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Page Views</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">--</p>
          <p className="text-xs text-gray-400 mt-1">Connect analytics to view</p>
        </div>

        {/* Conversion Rate (placeholder) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</span>
            <div className="w-8 h-8 bg-deep-green/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-deep-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">--</p>
          <p className="text-xs text-gray-400 mt-1">Connect analytics to view</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Orders Over Time</h3>
          {dailyOrders.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No order data for this period
            </div>
          ) : (
            <div className="space-y-0">
              <div className="flex items-end gap-1 h-48">
                {dailyOrders.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">{d.count}</span>
                    <div
                      className="w-full bg-deep-green/80 rounded-t-sm min-h-[4px] transition-all hover:bg-deep-green"
                      style={{ height: `${(d.count / maxDailyCount) * 100}%` }}
                      title={`${d.day}: ${d.count} orders, ${formatCurrency(d.revenue)}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-2 border-t border-gray-100 pt-2">
                {dailyOrders.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[9px] text-gray-400 leading-none">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subscriber Growth */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Subscriber Growth (Last 6 Months)</h3>
          {subscriberGrowth.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              No subscriber data available
            </div>
          ) : (
            <div className="space-y-0">
              <div className="flex items-end gap-2 h-48">
                {subscriberGrowth.map((s, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">{s.count}</span>
                    <div
                      className="w-full bg-gold/80 rounded-t-sm min-h-[4px] transition-all hover:bg-gold"
                      style={{ height: `${(s.count / maxSubscriberCount) * 100}%` }}
                      title={`${s.month}: ${s.count} new subscribers`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2 border-t border-gray-100 pt-2">
                {subscriberGrowth.map((s, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[10px] text-gray-400">{s.month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Top Products</h3>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              No product data available
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map((product, idx) => (
                <div key={product.product_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <span className="text-xs font-semibold text-gray-400 w-6 text-center">{idx + 1}</span>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.total_quantity} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.total_revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Recent Reviews</h3>
          </div>
          {recentReviews.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              No reviews yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentReviews.map(review => (
                <div key={review.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-deep-green/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-deep-green">
                          {(review.customer_name || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{review.customer_name || 'Anonymous'}</span>
                        <span className="text-xs text-gray-400 ml-2">{review.product_name || ''}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1 ml-9">
                    {renderStars(review.rating)}
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-600 ml-9 line-clamp-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
