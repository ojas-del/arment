'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

// ────────────────────────────── Types ──────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: Category | null;
  products_count?: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string;
  sort_order: number;
  is_active: boolean;
}

type Alert = { type: 'success' | 'error'; message: string } | null;

// ────────────────────────────── Helpers ──────────────────────────────

const emptyForm: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  parent_id: '',
  sort_order: 0,
  is_active: true,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ────────────────────────────── Component ──────────────────────────────

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<Alert>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inline sort editing
  const [editingSortId, setEditingSortId] = useState<string | null>(null);
  const [editingSortValue, setEditingSortValue] = useState<number>(0);

  // ── Fetch ──

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: cats, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Fetch product counts per category
      const { data: countData } = await supabase
        .from('products')
        .select('category_id');

      const countMap: Record<string, number> = {};
      (countData || []).forEach((p: { category_id: string | null }) => {
        if (p.category_id) {
          countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
        }
      });

      const enriched = (cats || []).map((c) => ({
        ...c,
        parent: cats?.find((p) => p.id === c.parent_id) || null,
        products_count: countMap[c.id] || 0,
      }));

      setCategories(enriched);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load categories';
      setAlert({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  // ── Filtered list ──

  const filtered = categories.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.is_active) ||
      (statusFilter === 'inactive' && !c.is_active);
    return matchSearch && matchStatus;
  });

  // ── Open modal ──

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image_url: cat.image_url || '',
      parent_id: cat.parent_id || '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setModalOpen(true);
  };

  // ── Save ──

  const handleSave = async () => {
    if (!form.name.trim()) {
      setAlert({ type: 'error', message: 'Category name is required.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        parent_id: form.parent_id || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
        if (error) throw error;
        setAlert({ type: 'success', message: 'Category updated successfully.' });
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        setAlert({ type: 'success', message: 'Category created successfully.' });
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
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
      const { error } = await supabase.from('categories').delete().eq('id', deleteId);
      if (error) throw error;
      setAlert({ type: 'success', message: 'Category deleted successfully.' });
      setDeleteId(null);
      fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      setAlert({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  };

  // ── Inline sort order update ──

  const handleSortOrderSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order: editingSortValue, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setEditingSortId(null);
      fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update sort order';
      setAlert({ type: 'error', message });
    }
  };

  // Move up / down helpers
  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const idx = filtered.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filtered.length) return;

    const current = filtered[idx];
    const neighbor = filtered[swapIdx];

    try {
      await Promise.all([
        supabase.from('categories').update({ sort_order: neighbor.sort_order, updated_at: new Date().toISOString() }).eq('id', current.id),
        supabase.from('categories').update({ sort_order: current.sort_order, updated_at: new Date().toISOString() }).eq('id', neighbor.id),
      ]);
      fetchCategories();
    } catch {
      setAlert({ type: 'error', message: 'Failed to reorder categories.' });
    }
  };

  // ── Render helpers ──

  const parentOptions = categories.filter((c) => c.id !== editingId);

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '--';
    return categories.find((c) => c.id === parentId)?.name || 'Unknown';
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories and hierarchy</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-deep-green hover:bg-deep-green/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Category
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
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green"
          />
        </div>
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Parent Category</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Products</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Sort Order</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    {search || statusFilter !== 'all'
                      ? 'No categories match your filters.'
                      : 'No categories yet. Create your first category.'}
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-off-white flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3 text-gray-500">{getParentName(cat.parent_id)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        {cat.products_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          cat.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => moveCategory(cat.id, 'up')}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Move up"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        {editingSortId === cat.id ? (
                          <input
                            type="number"
                            value={editingSortValue}
                            onChange={(e) => setEditingSortValue(parseInt(e.target.value) || 0)}
                            onBlur={() => handleSortOrderSave(cat.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSortOrderSave(cat.id);
                              if (e.key === 'Escape') setEditingSortId(null);
                            }}
                            className="w-14 text-center text-xs border border-deep-green rounded px-1 py-0.5 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setEditingSortId(cat.id);
                              setEditingSortValue(cat.sort_order);
                            }}
                            className="text-xs text-gray-500 hover:text-deep-green font-mono min-w-[28px] py-0.5 px-1 rounded hover:bg-gray-100 transition-colors"
                            title="Click to edit sort order"
                          >
                            {cat.sort_order}
                          </button>
                        )}
                        <button
                          onClick={() => moveCategory(cat.id, 'down')}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Move down"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-deep-green transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
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
            {filtered.length} of {categories.length} categories
          </div>
        )}
      </div>

      {/* ─── Create / Edit Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Category' : 'New Category'}</h2>
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
                  placeholder="e.g. Dry Food"
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
                  placeholder="Optional category description..."
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

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green bg-white"
                >
                  <option value="">None (top-level)</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

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
                {editingId ? 'Update Category' : 'Create Category'}
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
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Category</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-700">
                  {categories.find((c) => c.id === deleteId)?.name}
                </span>
                ? This action cannot be undone.
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
    </div>
  );
}