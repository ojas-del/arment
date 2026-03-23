'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PetProfile {
  id: string;
  customer_id: string;
  name: string;
  breed: string;
  age_years: number;
  weight_kg: number;
  activity_level: string;
  allergies: string[] | null;
}

interface CustomerOrder {
  id: string;
  order_number: number;
  status: string;
  total: number;
  created_at: string;
}

interface Customer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  // Aggregated from join
  orders_count?: number;
  total_spent?: number;
  pets_count?: number;
}

interface CustomerDetail extends Customer {
  pet_profiles: PetProfile[];
  orders: CustomerOrder[];
}

interface EditFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminCustomersPage() {
  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail panel
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({ first_name: '', last_name: '', email: '', phone: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // -------------------------------------------------------------------
  // Debounced search
  // -------------------------------------------------------------------

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  // -------------------------------------------------------------------
  // Fetch customers list with aggregated data
  // -------------------------------------------------------------------

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // We fetch customers and count orders + pets via a Supabase RPC-like approach.
      // Since Supabase doesn't natively support aggregate counts in select,
      // we fetch customers first, then enrich with counts.

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (debouncedSearch.trim()) {
        const term = debouncedSearch.trim();
        query = query.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`
        );
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      const customerList = (data ?? []) as Customer[];

      // Enrich with order counts, total spent, and pet counts
      if (customerList.length > 0) {
        const customerIds = customerList.map((c) => c.id);

        // Fetch orders grouped data
        const { data: ordersData } = await supabase
          .from('orders')
          .select('customer_id, total')
          .in('customer_id', customerIds);

        // Fetch pet counts
        const { data: petsData } = await supabase
          .from('pet_profiles')
          .select('customer_id')
          .in('customer_id', customerIds);

        // Build lookup maps
        const orderStats = new Map<string, { count: number; total: number }>();
        (ordersData ?? []).forEach((o: { customer_id: string; total: number }) => {
          const existing = orderStats.get(o.customer_id) ?? { count: 0, total: 0 };
          existing.count += 1;
          existing.total += Number(o.total) || 0;
          orderStats.set(o.customer_id, existing);
        });

        const petCounts = new Map<string, number>();
        (petsData ?? []).forEach((p: { customer_id: string }) => {
          petCounts.set(p.customer_id, (petCounts.get(p.customer_id) ?? 0) + 1);
        });

        customerList.forEach((c) => {
          const stats = orderStats.get(c.id);
          c.orders_count = stats?.count ?? 0;
          c.total_spent = stats?.total ?? 0;
          c.pets_count = petCounts.get(c.id) ?? 0;
        });
      }

      setCustomers(customerList);
      setTotalCount(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // -------------------------------------------------------------------
  // Fetch customer detail
  // -------------------------------------------------------------------

  const fetchCustomerDetail = useCallback(async (customerId: string) => {
    setDetailLoading(true);

    try {
      const [customerRes, petsRes, ordersRes] = await Promise.all([
        supabase.from('customers').select('*').eq('id', customerId).single(),
        supabase.from('pet_profiles').select('*').eq('customer_id', customerId).order('name'),
        supabase.from('orders').select('id, order_number, status, total, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(20),
      ]);

      if (customerRes.error) throw customerRes.error;

      setCustomerDetail({
        ...(customerRes.data as Customer),
        pet_profiles: (petsRes.data ?? []) as PetProfile[],
        orders: (ordersRes.data ?? []) as CustomerOrder[],
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load customer details');
      setSelectedCustomerId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetail(selectedCustomerId);
    } else {
      setCustomerDetail(null);
    }
  }, [selectedCustomerId, fetchCustomerDetail]);

  // -------------------------------------------------------------------
  // Edit customer
  // -------------------------------------------------------------------

  const openEditModal = () => {
    if (!customerDetail) return;
    setEditForm({
      first_name: customerDetail.first_name,
      last_name: customerDetail.last_name,
      email: customerDetail.email,
      phone: customerDetail.phone ?? '',
    });
    setEditModalOpen(true);
  };

  const saveCustomer = async () => {
    if (!customerDetail) return;
    setEditSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerDetail.id);

      if (updateError) throw updateError;

      // Update local state
      setCustomerDetail((prev) =>
        prev
          ? {
              ...prev,
              first_name: editForm.first_name.trim(),
              last_name: editForm.last_name.trim(),
              email: editForm.email.trim(),
              phone: editForm.phone.trim() || null,
            }
          : null
      );

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerDetail.id
            ? {
                ...c,
                first_name: editForm.first_name.trim(),
                last_name: editForm.last_name.trim(),
                email: editForm.email.trim(),
                phone: editForm.phone.trim() || null,
              }
            : c
        )
      );

      setEditModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setEditSaving(false);
    }
  };

  // -------------------------------------------------------------------
  // Export placeholder
  // -------------------------------------------------------------------

  const handleExport = () => {
    alert('Export functionality coming soon. This will generate a CSV of all customers.');
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer accounts and profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{totalCount} customer{totalCount !== 1 ? 's' : ''}</span>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-deep-green text-white text-sm font-medium rounded-lg hover:bg-deep-green/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-md">
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
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchCustomers} className="ml-auto text-sm font-medium text-red-700 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Layout: Table + Detail panel */}
      <div className={`flex gap-6 ${selectedCustomerId ? '' : ''}`}>
        {/* Table */}
        <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all ${selectedCustomerId ? 'flex-1 min-w-0' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-deep-green border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading customers...</p>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-sm font-medium">No customers found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Phone</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Orders</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total Spent</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Pets</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => {
                    const isSelected = selectedCustomerId === customer.id;
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(isSelected ? null : customer.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-deep-green/[0.05]' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-deep-green/10 text-deep-green flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                        <td className="px-4 py-3 text-gray-600">{customer.phone ?? '--'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                            {customer.orders_count ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(customer.total_spent ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(customer.pets_count ?? 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-deep-green">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {customer.pets_count}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(customer.created_at)}</td>
                      </tr>
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

        {/* Detail panel */}
        {selectedCustomerId && (
          <div className="w-[420px] flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden self-start sticky top-[72px] max-h-[calc(100vh-100px)] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-deep-green border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading details...</p>
                </div>
              </div>
            ) : customerDetail ? (
              <div>
                {/* Detail header */}
                <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-deep-green text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {customerDetail.first_name?.charAt(0)}{customerDetail.last_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {customerDetail.first_name} {customerDetail.last_name}
                      </h3>
                      <p className="text-xs text-gray-500">{customerDetail.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={openEditModal}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-deep-green"
                      title="Edit customer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedCustomerId(null)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                      title="Close panel"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Customer info */}
                <div className="px-5 py-4 border-b border-gray-100 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Info</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Phone</span>
                      <p className="text-gray-700">{customerDetail.phone ?? '--'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Joined</span>
                      <p className="text-gray-700">{formatDate(customerDetail.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Total Orders</span>
                      <p className="text-gray-700 font-medium">{customerDetail.orders.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Total Spent</span>
                      <p className="text-gray-700 font-medium">
                        {formatCurrency(customerDetail.orders.reduce((sum, o) => sum + Number(o.total), 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pet profiles */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Pet Profiles ({customerDetail.pet_profiles.length})
                  </h4>
                  {customerDetail.pet_profiles.length === 0 ? (
                    <p className="text-sm text-gray-400">No pets registered</p>
                  ) : (
                    <div className="space-y-3">
                      {customerDetail.pet_profiles.map((pet) => (
                        <div key={pet.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🐕</span>
                              <span className="font-medium text-sm text-gray-900">{pet.name}</span>
                            </div>
                            {pet.activity_level && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold font-medium">
                                {pet.activity_level}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                            <div>
                              <span className="text-gray-400">Breed</span>
                              <p className="text-gray-700">{pet.breed || '--'}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Age</span>
                              <p className="text-gray-700">{pet.age_years ? `${pet.age_years}yr` : '--'}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Weight</span>
                              <p className="text-gray-700">{pet.weight_kg ? `${pet.weight_kg}kg` : '--'}</p>
                            </div>
                          </div>
                          {pet.allergies && pet.allergies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {pet.allergies.map((allergy, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full"
                                >
                                  {allergy}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order history */}
                <div className="px-5 py-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Recent Orders ({customerDetail.orders.length})
                  </h4>
                  {customerDetail.orders.length === 0 ? (
                    <p className="text-sm text-gray-400">No orders yet</p>
                  ) : (
                    <div className="space-y-2">
                      {customerDetail.orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-deep-green">{order.order_number}</p>
                            <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!editSaving) setEditModalOpen(false);
            }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Edit Customer</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                disabled={editSaving}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setEditModalOpen(false)}
                disabled={editSaving}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomer}
                disabled={editSaving || !editForm.first_name.trim() || !editForm.last_name.trim() || !editForm.email.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-deep-green rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {editSaving && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
