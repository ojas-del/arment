'use client';

import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  activeSubscriptions: number;
  productsCount: number;
  pendingReviews: number;
}

interface RecentOrder {
  id: string;
  customer_id: string;
  status: string;
  total: number;
  created_at: string;
  customers: { first_name: string; last_name: string; email: string } | null;
}

interface ActivityLogEntry {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  details: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
}

const ACTION_ICONS: Record<string, string> = {
  create: 'M12 4.5v15m7.5-7.5h-15',
  update: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
  delete: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
  login: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
};

function getActionIcon(action: string): string {
  const key = Object.keys(ACTION_ICONS).find((k) => action.toLowerCase().includes(k));
  return ACTION_ICONS[key || 'update'] || ACTION_ICONS.update;
}

// ---------------------------------------------------------------------------
// Skeleton Components
// ---------------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 mb-1" />
      <div className="h-3 bg-gray-100 rounded w-16" />
    </div>
  );
}

function OrderRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
    </tr>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, value, subtitle, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[] | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      const errs: string[] = [];

      // Fetch all stats in parallel
      const [
        ordersRes,
        revenueRes,
        customersRes,
        subscriptionsRes,
        productsRes,
        reviewsRes,
        recentOrdersRes,
        activityRes,
      ] = await Promise.all([
        // Total orders
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        // Total revenue
        supabase.from('orders').select('total'),
        // Total customers
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        // Active subscriptions
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        // Products count
        supabase.from('products').select('*', { count: 'exact', head: true }),
        // Pending reviews (unpublished)
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_published', false),
        // Recent orders (last 10) with customer info
        supabase
          .from('orders')
          .select('id, customer_id, status, total, created_at, customers(first_name, last_name, email)')
          .order('created_at', { ascending: false })
          .limit(10),
        // Recent activity
        supabase
          .from('activity_log')
          .select('id, admin_user_id, action, entity_type, details, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (cancelled) return;

      // Process stats with graceful error handling per query
      const totalOrders = ordersRes.error ? (errs.push('Failed to load orders count'), 0) : (ordersRes.count ?? 0);
      const totalCustomers = customersRes.error ? (errs.push('Failed to load customers count'), 0) : (customersRes.count ?? 0);
      const activeSubscriptions = subscriptionsRes.error ? (errs.push('Failed to load subscriptions'), 0) : (subscriptionsRes.count ?? 0);
      const productsCount = productsRes.error ? (errs.push('Failed to load products count'), 0) : (productsRes.count ?? 0);
      const pendingReviews = reviewsRes.error ? (errs.push('Failed to load reviews count'), 0) : (reviewsRes.count ?? 0);

      let totalRevenue = 0;
      if (revenueRes.error) {
        errs.push('Failed to load revenue');
      } else if (revenueRes.data) {
        totalRevenue = revenueRes.data.reduce((sum: number, row: { total: number }) => sum + (row.total || 0), 0);
      }

      setStats({ totalOrders, totalRevenue, totalCustomers, activeSubscriptions, productsCount, pendingReviews });

      if (recentOrdersRes.error) {
        errs.push('Failed to load recent orders');
        setRecentOrders([]);
      } else {
        // Supabase returns joined data; normalize to our type
        const orders = (recentOrdersRes.data || []).map((o: Record<string, unknown>) => ({
          id: o.id as string,
          customer_id: o.customer_id as string,
          status: o.status as string,
          total: o.total as number,
          created_at: o.created_at as string,
          customers: o.customers as RecentOrder['customers'],
        }));
        setRecentOrders(orders);
      }

      if (activityRes.error) {
        errs.push('Failed to load activity log');
        setActivityLog([]);
      } else {
        setActivityLog((activityRes.data as ActivityLogEntry[]) || []);
      }

      setErrors(errs);
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  const statsLoading = stats === null;
  const ordersLoading = recentOrders === null;
  const activityLoading = activityLog === null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back. Here is what is happening today.</p>
        </div>
        <div className="text-xs text-gray-400">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Error Banner */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <p className="font-medium mb-1">Some data failed to load:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              subtitle="All time"
              icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              subtitle="All time"
              icon="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              label="Total Customers"
              value={stats.totalCustomers.toLocaleString()}
              subtitle="Registered"
              icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
            <StatCard
              label="Active Subscriptions"
              value={stats.activeSubscriptions.toLocaleString()}
              subtitle="Currently active"
              icon="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
              iconBg="bg-yellow-50"
              iconColor="text-yellow-600"
            />
            <StatCard
              label="Products"
              value={stats.productsCount.toLocaleString()}
              subtitle="In catalog"
              icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <StatCard
              label="Pending Reviews"
              value={stats.pendingReviews.toLocaleString()}
              subtitle="Awaiting approval"
              icon="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/products"
          className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-5 py-4 hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 bg-deep-green/10 rounded-lg flex items-center justify-center group-hover:bg-deep-green group-hover:text-white transition-colors">
            <svg className="w-5 h-5 text-deep-green group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Add Product</p>
            <p className="text-xs text-gray-400">Create a new product listing</p>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-5 py-4 hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 bg-deep-green/10 rounded-lg flex items-center justify-center group-hover:bg-deep-green group-hover:text-white transition-colors">
            <svg className="w-5 h-5 text-deep-green group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">View Orders</p>
            <p className="text-xs text-gray-400">Manage and process orders</p>
          </div>
        </Link>

        <Link
          href="/admin/pages"
          className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-5 py-4 hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 bg-deep-green/10 rounded-lg flex items-center justify-center group-hover:bg-deep-green group-hover:text-white transition-colors">
            <svg className="w-5 h-5 text-deep-green group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Manage Pages</p>
            <p className="text-xs text-gray-400">Edit site content and pages</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders + Activity Log side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders -- wider */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-deep-green hover:underline font-medium">
              View all
            </Link>
          </div>

          {ordersLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-50">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <OrderRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              <svg className="w-10 h-10 mx-auto text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              No orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-50">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => {
                    const customerName = order.customers
                      ? `${order.customers.first_name} ${order.customers.last_name}`
                      : 'Unknown';
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-600">#{order.id.slice(0, 8)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900">{customerName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusStyle(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs" title={formatDate(order.created_at)}>
                          {formatRelativeTime(order.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Log -- narrower */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          </div>

          {activityLoading ? (
            <div className="px-6 py-4 space-y-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <ActivitySkeleton key={i} />
              ))}
            </div>
          ) : activityLog.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              <svg className="w-10 h-10 mx-auto text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No recent activity.
            </div>
          ) : (
            <div className="px-6 py-4 space-y-4 max-h-[480px] overflow-y-auto">
              {activityLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={getActionIcon(entry.action)} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">
                      <span className="font-medium capitalize">{entry.action}</span>
                      {' '}
                      <span className="text-gray-500">{entry.entity_type}</span>
                      {entry.details && (
                        <span className="text-gray-400 block text-xs mt-0.5 truncate">{entry.details}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
