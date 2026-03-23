'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

// ────────────────────────────── Types ──────────────────────────────

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  type: 'manual' | 'automated';
  conditions: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

interface Product {
  id: string;
  name: string;
  image_url?: string | null;
  price?: number;
}

interface ProductCollection {
  id: string;
  product_id: string;
  collection_id: string;
  sort_order: number;
}

interface CollectionFormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  type: 'manual' | 'automated';
  conditions: string;
  is_active: boolean;
  sort_order: number;
}

type Alert = { type: 'success' | 'error'; message: string } | null;

// ────────────────────────────── Helpers ──────────────────────────────

const emptyForm: CollectionFormData = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  type: 'manual',
  conditions: '{}',
  is_active: true,
  sort_order: 0,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ────────────────────────────── Component ──────────────────────────────

export default function CollectionsAdminPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<Alert>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'manual' | 'automated'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionFormData>(emptyForm);

  // Product picker state (for manual collections)
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [managingCollectionId, setManagingCollectionId] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [collectionProducts, setCollectionProducts] = useState<ProductCollection[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch collections ──

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Fetch product counts from junction table
      const { data: junctions } = await supabase
        .from('product_collections')
        .select('collection_id');

      const countMap: Record<string, number> = {};
      (junctions || []).forEach((j: { collection_id: string }) => {
        countMap[j.collection_id] = (countMap[j.collection_id] || 0) + 1;
      });

      const enriched = (data || []).map((c) => ({
        ...c,
        products_count: countMap[c.id] || 0,
      }));

      setCollections(enriched);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load collections';
      setAlert({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  // ── Filtered list ──

  const filtered = collections.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.is_active) ||
      (statusFilter === 'inactive' && !c.is_active);
    return matchSearch && matchType && matchStatus;
  });

  // ── Open modal ──

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (col: Collection) => {
    setEditingId(col.id);
    setForm({
      name: col.name,
      slug: col.slug,
      description: col.description || '',
      image_url: col.image_url || '',
      type: col.type,
      conditions: col.conditions ? JSON.stringify(col.conditions, null, 2) : '{}',
      is_active: col.is_active,
      sort_order: col.sort_order,
    });
    setModalOpen(true);
  };

  // ── Save ──

  const handleSave = async () => {
    if (!form.name.trim()) {
      setAlert({ type: 'error', message: 'Collection name is required.' });
      return;
    }

    let parsedConditions: Record<string, unknown> | null = null;
    if (form.type === 'automated') {
      try {
        parsedConditions = JSON.parse(form.conditions);
      } catch {
        setAlert({ type: 'error', message: 'Conditions must be valid JSON.' });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        type: form.type,
        conditions: form.type === 'automated' ? parsedConditions : null,
        is_active: form.is_active,
        sort_order: form.sort_order,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase.from('collections').update(payload).eq('id', editingId);
        if (error) throw error;
        setAlert({ type: 'success', message: 'Collection updated successfully.' });
      } else {
        const { error } = await supabase.from('collections').insert(payload);
        if (error) throw error;
        setAlert({ type: 'success', message: 'Collection created successfully.' });
      }

      setModalOpen(false);
      fetchCollections();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save collection';
      setAlert({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      // Also delete junction table entries
      await supabase.from('product_collections').delete().eq('collection_id', deleteId);
      const { error } = await supabase.from('collections').delete().eq('id', deleteId);
      if (error) throw error;
      setAlert({ type: 'success', message: 'Collection deleted successfully.' });
      setDeleteId(null);
      fetchCollections();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete collection';
      setAlert({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  };

  // ── Product Picker ──

  const openProductPicker = async (collectionId: string) => {
    setManagingCollectionId(collectionId);
    setProductSearch('');
    setLoadingProducts(true);
    setProductPickerOpen(true);

    try {
      // Fetch all products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, image_url, price')
        .order('name');

      // Fetch current collection products
      const { data: junctions } = await supabase
        .from('product_collections')
        .select('*')
        .eq('collection_id', collectionId)
        .order('sort_order');

      setAllProducts(products || []);
      setCollectionProducts(junctions || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      setAlert({ type: 'error', message });
    } finally {
      setLoadingProducts(false);
    }
  };

  const addProductToCollection = async (productId: string) => {
    if (!managingCollectionId) return;
    try {
      const maxSort = collectionProducts.reduce((max, p) => Math.max(max, p.sort_order), 0);
      const { data, error } = await supabase
        .from('product_collections')
        .insert({
          product_id: productId,
          collection_id: managingCollectionId,
          sort_order: maxSort + 1,
        })
        .select()
        .single();

      if (error) throw error;
      setCollectionProducts((prev) => [...prev, data]);
      setAlert({ type: 'success', message: 'Product added to collection.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add product';
      setAlert({ type: 'error', message });
    }
  };

  const removeProductFromCollection = async (productId: string) => {
    if (!managingCollectionId) return;
    try {
      const { error } = await supabase
        .from('product_collections')
        .delete()
        .eq('product_id', productId)
        .eq('collection_id', managingCollectionId);

      if (error) throw error;
      setCollectionProducts((prev) => prev.filter((p) => p.product_id !== productId));
      setAlert({ type: 'success', message: 'Product removed from collection.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove product';
      setAlert({ type: 'error', message });
    }
  };

  const filteredProducts = allProducts.filter(
    (p) => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const collectionProductIds = new Set(collectionProducts.map((cp) => cp.product_id));
  const assignedProducts = allProducts.filter((p) => collectionProductIds.has(p.id));
  const availableProducts = filteredProducts.filter((p) => !collectionProductIds.has(p.id));

  // ────────────────────────────── JSX ──────────────────────────────

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
            alert.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="ml-4 hover:opacity-70">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-sm text-gray-500 mt-1">Group products into curated collections</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-deep-green hover:bg-deep-green/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Collection
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search collections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'manual' | 'automated')}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green bg-white"
        >
          <option value="all">All Types</option>
          <option value="manual">Manual</option>
          <option value="automated">Automated</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Products</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    {search || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'No collections match your filters.'
                      : 'No collections yet. Create your first collection.'}
                  </td>
                </tr>
              ) : (
                filtered.map((col) => (
                  <tr key={col.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {col.image_url ? (
                          <img src={col.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-off-white flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{col.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{col.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          col.type === 'manual'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {col.type === 'manual' ? 'Manual' : 'Automated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        {col.products_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          col.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${col.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {col.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {col.type === 'manual' && (
                          <button
                            onClick={() => openProductPicker(col.id)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Manage products"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(col)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-deep-green transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(col.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {collections.length} collections
          </div>
        )}
      </div>

      {/* ─── Create / Edit Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Collection' : 'New Collection'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: editingId ? f.slug : slugify(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green"
                  placeholder="e.g. Best Sellers"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green"
                  placeholder="auto-generated-from-name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green resize-none"
                  placeholder="Optional collection description..."
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green"
                  placeholder="https://..."
                />
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="mt-2 w-16 h-16 rounded-lg object-cover bg-gray-100" />
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="collection-type"
                      checked={form.type === 'manual'}
                      onChange={() => setForm((f) => ({ ...f, type: 'manual' }))}
                      className="w-4 h-4 text-deep-green focus:ring-deep-green"
                    />
                    <span className="text-sm text-gray-700">Manual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="collection-type"
                      checked={form.type === 'automated'}
                      onChange={() => setForm((f) => ({ ...f, type: 'automated' }))}
                      className="w-4 h-4 text-deep-green focus:ring-deep-green"
                    />
                    <span className="text-sm text-gray-700">Automated</span>
                  </label>
                </div>
              </div>

              {/* Conditions (automated only) */}
              {form.type === 'automated' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conditions (JSON)</label>
                  <textarea
                    value={form.conditions}
                    onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green resize-none"
                    placeholder='{"tag": "new-arrivals", "min_price": 10}'
                  />
                  <p className="mt-1 text-xs text-gray-400">Define conditions as a JSON object for automatic product matching.</p>
                </div>
              )}

              {/* Sort Order + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-deep-green focus:ring-deep-green"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-deep-green hover:bg-deep-green/90 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {saving && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {editingId ? 'Update Collection' : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Collection</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-700">
                  {collections.find((c) => c.id === deleteId)?.name}
                </span>
                ? All product associations will also be removed.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {deleting && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Product Picker Modal ─── */}
      {productPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setProductPickerOpen(false); fetchCollections(); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Manage Products</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {collections.find((c) => c.id === managingCollectionId)?.name} -- {collectionProducts.length} product(s) assigned
                </p>
              </div>
              <button
                onClick={() => { setProductPickerOpen(false); fetchCollections(); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-deep-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Assigned products */}
                {assignedProducts.length > 0 && (
                  <div className="px-6 py-3 border-b border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">In Collection ({assignedProducts.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {assignedProducts.map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-deep-green/10 text-deep-green rounded-lg text-xs font-medium">
                          {p.image_url && <img src={p.image_url} alt="" className="w-4 h-4 rounded object-cover" />}
                          {p.name}
                          <button
                            onClick={() => removeProductFromCollection(p.id)}
                            className="p-0.5 rounded hover:bg-deep-green/20 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-100">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search products to add..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green"
                    />
                  </div>
                </div>

                {/* Available products list */}
                <div className="flex-1 overflow-y-auto px-6 py-2">
                  {availableProducts.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      {productSearch ? 'No matching products found.' : 'All products have been added.'}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {availableProducts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => addProductToCollection(p.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                        >
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                            {p.price != null && <div className="text-xs text-gray-400">${p.price.toFixed(2)}</div>}
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-deep-green transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}