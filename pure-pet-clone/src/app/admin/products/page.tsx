'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  barcode: string | null;
  track_inventory: boolean;
  inventory_count: number;
  category_id: string | null;
  brand_id: string | null;
  status: 'draft' | 'active' | 'archived';
  images: string[] | null;
  weight: number | null;
  weight_unit: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

type ProductFormData = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const EMPTY_FORM: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  price: 0,
  compare_at_price: null,
  sku: '',
  barcode: '',
  track_inventory: false,
  inventory_count: 0,
  category_id: null,
  brand_id: null,
  status: 'draft',
  images: null,
  weight: null,
  weight_unit: 'kg',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Product['status'] }) {
  const map: Record<Product['status'], { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    draft: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    archived: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StockBadge({ product }: { product: Product }) {
  if (!product.track_inventory) {
    return <span className="text-xs text-gray-400">Not tracked</span>;
  }
  if (product.inventory_count <= 0) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Out of stock</span>;
  }
  if (product.inventory_count <= 10) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{product.inventory_count} left</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">In stock ({product.inventory_count})</span>;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="w-10 h-10 bg-gray-200 rounded-lg" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-36" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function AdminProductsPage() {
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal / form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_FORM });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------
  // Toast helper
  // --------------------------------------------------
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // --------------------------------------------------
  // Fetch products
  // --------------------------------------------------
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setProducts((data as Product[]) || []);
      setTotalCount(count ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products';
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  }, [page, search, addToast]);

  // --------------------------------------------------
  // Fetch categories & brands (once)
  // --------------------------------------------------
  const fetchDropdowns = useCallback(async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('brands').select('id, name').order('name'),
      ]);
      if (catRes.error) throw catRes.error;
      if (brandRes.error) throw brandRes.error;

      setCategories((catRes.data as Category[]) || []);
      setBrands((brandRes.data as Brand[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load categories / brands';
      addToast('error', message);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  // --------------------------------------------------
  // Category / brand name lookup maps
  // --------------------------------------------------
  const categoryMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);



  // --------------------------------------------------
  // Form helpers
  // --------------------------------------------------
  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setSlugManuallyEdited(false);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      short_description: product.short_description ?? '',
      price: product.price,
      compare_at_price: product.compare_at_price,
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      track_inventory: product.track_inventory,
      inventory_count: product.inventory_count,
      category_id: product.category_id,
      brand_id: product.brand_id,
      status: product.status,
      images: product.images ?? null,
      weight: product.weight,
      weight_unit: product.weight_unit ?? 'kg',
    });
    setSlugManuallyEdited(true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const updateField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-generate slug from name unless user has manually touched it
      if (key === 'name' && !slugManuallyEdited) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  // --------------------------------------------------
  // Image upload via Cloudinary
  // --------------------------------------------------
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const currentImages = form.images ? [...form.images] : [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) {
          addToast('error', data.error || 'Upload failed');
          continue;
        }

        currentImages.push(data.url);
      }

      updateField('images', currentImages.length > 0 ? currentImages : null);
      addToast('success', `${files.length} image${files.length > 1 ? 's' : ''} uploaded.`);
    } catch {
      addToast('error', 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = (form.images || []).filter((_, i) => i !== index);
    updateField('images', updated.length > 0 ? updated : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  // --------------------------------------------------
  // Save (create / update)
  // --------------------------------------------------
  const handleSave = async () => {
    // Basic validation
    if (!form.name.trim()) {
      addToast('error', 'Product name is required.');
      return;
    }
    if (!form.slug.trim()) {
      addToast('error', 'Slug is required.');
      return;
    }
    if (form.price < 0) {
      addToast('error', 'Price cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description || null,
        short_description: form.short_description || null,
        price: form.price,
        compare_at_price: form.compare_at_price || null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        track_inventory: form.track_inventory,
        inventory_count: form.inventory_count,
        category_id: form.category_id || null,
        brand_id: form.brand_id || null,
        status: form.status,
        images: form.images && form.images.length > 0 ? form.images : null,
        weight: form.weight || null,
        weight_unit: form.weight_unit || null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
        addToast('success', 'Product updated successfully.');
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        addToast('success', 'Product created successfully.');
      }

      closeForm();
      fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save product';
      addToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Delete
  // --------------------------------------------------
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      addToast('success', `"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      addToast('error', message);
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-sm border ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {t.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="text-current opacity-50 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} product{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-deep-green text-white text-sm font-medium rounded-lg hover:bg-deep-green/90 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search products by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-gray-500 font-medium">No products found</p>
                      <p className="text-gray-400 text-xs">
                        {search ? 'Try a different search term.' : 'Get started by adding your first product.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                      {product.sku && (
                        <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                      )}
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3 text-gray-600">
                      {product.category_id ? categoryMap.get(product.category_id) ?? '---' : '---'}
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{formatPrice(product.price)}</span>
                      {product.compare_at_price != null && product.compare_at_price > product.price && (
                        <span className="ml-1.5 text-xs text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>
                      )}
                    </td>
                    {/* Stock */}
                    <td className="px-4 py-3">
                      <StockBadge product={product} />
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(product.created_at)}</td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditForm(product)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-deep-green hover:bg-deep-green/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}--{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter((i) => {
                  // Show first, last, and pages around current
                  if (i === 0 || i === totalPages - 1) return true;
                  if (Math.abs(i - page) <= 1) return true;
                  return false;
                })
                .reduce<(number | 'ellipsis')[]>((acc, i, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== undefined && i - (arr[idx - 1] as number) > 1) {
                    acc.push('ellipsis');
                  }
                  acc.push(i);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 text-gray-400 text-xs">...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                        item === page
                          ? 'bg-deep-green text-white'
                          : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {item + 1}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* Slide-over form (Create / Edit)                                  */}
      {/* ================================================================ */}
      {showForm && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeForm} />

          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-[slideIn_200ms_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                    placeholder="e.g. Turkey & Sweet Potato"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      updateField('slug', slugify(e.target.value));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                    placeholder="auto-generated-from-name"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input
                  type="text"
                  value={form.short_description ?? ''}
                  onChange={(e) => updateField('short_description', e.target.value)}
                  maxLength={255}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                  placeholder="Brief one-liner about the product"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green resize-y"
                  placeholder="Full product description..."
                />
              </div>

              {/* Pricing */}
              <fieldset className="border border-gray-200 rounded-lg p-4">
                <legend className="text-sm font-semibold text-gray-700 px-2">Pricing</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (GBP) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compare-at Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.compare_at_price ?? ''}
                      onChange={(e) => updateField('compare_at_price', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Inventory */}
              <fieldset className="border border-gray-200 rounded-lg p-4">
                <legend className="text-sm font-semibold text-gray-700 px-2">Inventory</legend>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={form.sku ?? ''}
                        onChange={(e) => updateField('sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                        placeholder="e.g. PP-TRK-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                      <input
                        type="text"
                        value={form.barcode ?? ''}
                        onChange={(e) => updateField('barcode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                        placeholder="UPC / EAN / ISBN"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.track_inventory}
                        onChange={(e) => updateField('track_inventory', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-deep-green/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-deep-green" />
                    </label>
                    <span className="text-sm text-gray-700">Track inventory</span>
                  </div>
                  {form.track_inventory && (
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Count</label>
                      <input
                        type="number"
                        min="0"
                        value={form.inventory_count}
                        onChange={(e) => updateField('inventory_count', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                      />
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Weight */}
              <fieldset className="border border-gray-200 rounded-lg p-4">
                <legend className="text-sm font-semibold text-gray-700 px-2">Shipping</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.weight ?? ''}
                      onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green"
                      placeholder="e.g. 1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={form.weight_unit ?? 'kg'}
                      onChange={(e) => updateField('weight_unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Organisation */}
              <fieldset className="border border-gray-200 rounded-lg p-4">
                <legend className="text-sm font-semibold text-gray-700 px-2">Organisation</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category_id ?? ''}
                      onChange={(e) => updateField('category_id', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green bg-white"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <select
                      value={form.brand_id ?? ''}
                      onChange={(e) => updateField('brand_id', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green bg-white"
                    >
                      <option value="">No brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value as Product['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-deep-green/30 focus:border-deep-green bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </fieldset>

              {/* Media - Cloudinary Upload */}
              <fieldset className="border border-gray-200 rounded-lg p-4">
                <legend className="text-sm font-semibold text-gray-700 px-2">Product Images</legend>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? 'border-deep-green bg-deep-green/5'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                  onClick={() => document.getElementById('product-image-input')?.click()}
                >
                  <input
                    id="product-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-deep-green animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-sm text-gray-600">Uploading to Cloudinary...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-deep-green">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF, SVG (max 10MB each)</p>
                    </div>
                  )}
                </div>

                {/* Image Previews */}
                {form.images && form.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {form.images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt={`Product image ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="12">Error</text></svg>';
                          }}
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-deep-green text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="Remove image"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-deep-green rounded-lg hover:bg-deep-green/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {editingId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Delete confirmation dialog                                       */}
      {/* ================================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
