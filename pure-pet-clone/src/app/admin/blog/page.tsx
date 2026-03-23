'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  author_id: string | null;
  status: 'draft' | 'published' | 'archived';
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogPostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  meta_title: string;
  meta_description: string;
}

const emptyForm: BlogPostFormData = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  featured_image: '',
  status: 'draft',
  tags: [],
  meta_title: '',
  meta_description: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700',
    draft: 'bg-amber-100 text-amber-700',
    archived: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogPostFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Delete state
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ─── Filtered Posts ───────────────────────────────────────────────────────

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditingPost(null);
    setForm(emptyForm);
    setTagsInput('');
    setSlugManuallyEdited(false);
    setModalOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      featured_image: post.featured_image || '',
      status: post.status,
      tags: post.tags || [],
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
    });
    setTagsInput((post.tags || []).join(', '));
    setSlugManuallyEdited(true); // Don't overwrite existing slug on edit
    setModalOpen(true);
  }

  function handleTitleChange(title: string) {
    const updates: Partial<BlogPostFormData> = { title };
    if (!slugManuallyEdited) {
      updates.slug = slugify(title);
    }
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function handleSlugChange(slug: string) {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug: slugify(slug) }));
  }

  function handleTagsChange(value: string) {
    setTagsInput(value);
    const tags = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, tags }));
  }

  async function savePost() {
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt || null,
      featured_image: form.featured_image || null,
      status: form.status,
      tags: form.tags.length > 0 ? form.tags : null,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    };

    // Set published_at when status changes to published
    if (form.status === 'published') {
      if (!editingPost || editingPost.status !== 'published') {
        payload.published_at = new Date().toISOString();
      }
    }

    if (editingPost) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingPost.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert([payload]);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setModalOpen(false);
    setSaving(false);
    fetchPosts();
  }

  async function deletePost(id: string) {
    const { error: deleteError } = await supabase.from('blog_posts').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletePostId(null);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;
  const archivedCount = posts.filter((p) => p.status === 'archived').length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage blog content</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-deep-green text-white rounded-lg text-sm font-medium hover:bg-deep-green/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Blog Post
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Published</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{publishedCount}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Drafts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{draftCount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Archived</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{archivedCount}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by title..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-deep-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          {posts.length === 0 ? (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No blog posts yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first blog post to get started.</p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-deep-green text-white rounded-lg text-sm font-medium hover:bg-deep-green/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Blog Post
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No matching posts</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filter.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tags</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">/{post.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(post.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {post.tags && post.tags.length > 0 ? (
                          post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-off-white text-deep-green font-medium">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No tags</span>
                        )}
                        {post.tags && post.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(post.published_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(post.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            // Placeholder: preview in new tab
                            window.open(`/blog/${post.slug}`, '_blank');
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Preview"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEdit(post)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletePostId(post.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
            Showing {filteredPosts.length} of {posts.length} post{posts.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ─── Create / Edit Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPost ? 'Edit Blog Post' : 'Create Blog Post'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                  {!slugManuallyEdited && form.title && (
                    <span className="text-xs text-gray-400 font-normal ml-2">(auto-generated from title)</span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">/blog/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="post-slug"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none font-mono"
                  />
                  {slugManuallyEdited && form.title && (
                    <button
                      type="button"
                      onClick={() => {
                        setSlugManuallyEdited(false);
                        setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
                      }}
                      className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  placeholder="Write your blog post content here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none resize-y font-mono leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1">{form.content.length} characters</p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={3}
                  placeholder="Brief summary of the post for listings and SEO..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none resize-y"
                />
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                <input
                  type="text"
                  value={form.featured_image}
                  onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                />
                {form.featured_image && (
                  <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.featured_image}
                      alt="Featured preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Status & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as BlogPost['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  {form.status === 'published' && (!editingPost || editingPost.status !== 'published') && (
                    <p className="text-xs text-emerald-600 mt-1">Will be published immediately on save.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="nutrition, dogs, health"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                  />
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-off-white text-deep-green font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SEO */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  SEO Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={form.meta_title}
                      onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                      placeholder={form.title || 'Meta title for search engines'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">{form.meta_title.length}/60 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      value={form.meta_description}
                      onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                      rows={2}
                      placeholder={form.excerpt || 'Description for search engine results...'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none resize-y"
                    />
                    <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/160 characters</p>
                  </div>
                </div>

                {/* SEO Preview */}
                {(form.meta_title || form.title) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-medium">Search Preview</p>
                    <p className="text-blue-700 text-base font-medium leading-tight truncate">
                      {form.meta_title || form.title}
                    </p>
                    <p className="text-emerald-700 text-xs mt-0.5 truncate">
                      purepetfood.com/blog/{form.slug || '...'}
                    </p>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {form.meta_description || form.excerpt || 'No description set.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-between z-10">
              <button
                type="button"
                onClick={() => {
                  if (form.slug) {
                    window.open(`/blog/${form.slug}`, '_blank');
                  }
                }}
                disabled={!form.slug}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePost}
                  disabled={saving || !form.title.trim() || !form.slug.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-deep-green rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingPost ? 'Update Post' : form.status === 'published' ? 'Publish Post' : 'Save Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ───────────────────────────────────────── */}
      {deletePostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeletePostId(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Blog Post</h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone. The blog post &ldquo;{posts.find((p) => p.id === deletePostId)?.title}&rdquo; will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletePostId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(deletePostId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}