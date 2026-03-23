'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  status: 'draft' | 'published';
  template: string;
  created_at: string;
  updated_at: string;
}

interface PageSection {
  id: string;
  page_id: string;
  section_type: string;
  content: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
}

type PageFormData = Omit<Page, 'id' | 'created_at' | 'updated_at'>;

const TEMPLATES = ['default', 'landing', 'about', 'contact', 'faq', 'blog', 'product'];
const SECTION_TYPES = ['Hero', 'Banner', 'Product Grid', 'Text Block', 'FAQ', 'Video', 'Testimonials', 'CTA', 'Image Gallery', 'Features'];

const emptyPageForm: PageFormData = {
  title: '',
  slug: '',
  content: '',
  meta_title: '',
  meta_description: '',
  status: 'draft',
  template: 'default',
};

const emptySectionForm: Omit<PageSection, 'id' | 'page_id'> = {
  section_type: 'Text Block',
  content: {},
  sort_order: 0,
  is_visible: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Page modal
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageForm, setPageForm] = useState<PageFormData>(emptyPageForm);

  // Sections modal
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [sectionsPage, setSectionsPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [sectionForm, setSectionForm] = useState<Omit<PageSection, 'id' | 'page_id'>>(emptySectionForm);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionContentJson, setSectionContentJson] = useState('{}');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('pages')
        .select('*')
        .order('updated_at', { ascending: false });
      if (fetchError) throw fetchError;
      setPages(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch pages';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSections = useCallback(async (pageId: string) => {
    setSectionsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });
      if (fetchError) throw fetchError;
      setSections(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sections';
      setError(message);
    } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // ─── Page CRUD ─────────────────────────────────────────────────────────────

  const openCreatePage = () => {
    setEditingPage(null);
    setPageForm(emptyPageForm);
    setShowPageModal(true);
  };

  const openEditPage = (page: Page) => {
    setEditingPage(page);
    setPageForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
      status: page.status,
      template: page.template,
    });
    setShowPageModal(true);
  };

  const handleSavePage = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingPage) {
        const { error: updateError } = await supabase
          .from('pages')
          .update({ ...pageForm, updated_at: new Date().toISOString() })
          .eq('id', editingPage.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('pages')
          .insert([{ ...pageForm }]);
        if (insertError) throw insertError;
      }
      setShowPageModal(false);
      fetchPages();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save page';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      // Delete associated sections first
      const { error: sectionsError } = await supabase
        .from('page_sections')
        .delete()
        .eq('page_id', deleteTarget.id);
      if (sectionsError) throw sectionsError;

      const { error: deleteError } = await supabase
        .from('pages')
        .delete()
        .eq('id', deleteTarget.id);
      if (deleteError) throw deleteError;

      setDeleteTarget(null);
      fetchPages();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete page';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // ─── Section CRUD ──────────────────────────────────────────────────────────

  const openSections = (page: Page) => {
    setSectionsPage(page);
    setShowSectionsModal(true);
    setShowSectionForm(false);
    setEditingSection(null);
    fetchSections(page.id);
  };

  const openAddSection = () => {
    setEditingSection(null);
    const nextOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) + 1 : 0;
    setSectionForm({ ...emptySectionForm, sort_order: nextOrder });
    setSectionContentJson('{}');
    setShowSectionForm(true);
  };

  const openEditSection = (section: PageSection) => {
    setEditingSection(section);
    setSectionForm({
      section_type: section.section_type,
      content: section.content,
      sort_order: section.sort_order,
      is_visible: section.is_visible,
    });
    setSectionContentJson(JSON.stringify(section.content, null, 2));
    setShowSectionForm(true);
  };

  const handleSaveSection = async () => {
    if (!sectionsPage) return;
    setSaving(true);
    setError(null);
    try {
      let parsedContent: Record<string, unknown>;
      try {
        parsedContent = JSON.parse(sectionContentJson);
      } catch {
        setError('Invalid JSON in section content');
        setSaving(false);
        return;
      }

      const payload = { ...sectionForm, content: parsedContent, page_id: sectionsPage.id };

      if (editingSection) {
        const { error: updateError } = await supabase
          .from('page_sections')
          .update(payload)
          .eq('id', editingSection.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('page_sections')
          .insert([payload]);
        if (insertError) throw insertError;
      }
      setShowSectionForm(false);
      setEditingSection(null);
      fetchSections(sectionsPage.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save section';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!sectionsPage) return;
    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('page_sections')
        .delete()
        .eq('id', sectionId);
      if (deleteError) throw deleteError;
      fetchSections(sectionsPage.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete section';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReorderSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!sectionsPage) return;
    const idx = sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const currentOrder = sections[idx].sort_order;
    const swapOrder = sections[swapIdx].sort_order;

    try {
      await supabase
        .from('page_sections')
        .update({ sort_order: swapOrder })
        .eq('id', sections[idx].id);
      await supabase
        .from('page_sections')
        .update({ sort_order: currentOrder })
        .eq('id', sections[swapIdx].id);
      fetchSections(sectionsPage.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reorder section';
      setError(message);
    }
  };

  const toggleSectionVisibility = async (section: PageSection) => {
    try {
      const { error: updateError } = await supabase
        .from('page_sections')
        .update({ is_visible: !section.is_visible })
        .eq('id', section.id);
      if (updateError) throw updateError;
      if (sectionsPage) fetchSections(sectionsPage.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle visibility';
      setError(message);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your site pages and their content sections</p>
        </div>
        <button
          onClick={openCreatePage}
          className="px-4 py-2 bg-deep-green text-white rounded-lg hover:bg-deep-green/90 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Page
        </button>
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

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-deep-green border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading pages...</p>
          </div>
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-4">No pages yet. Create your first page to get started.</p>
          <button onClick={openCreatePage} className="px-4 py-2 bg-deep-green text-white rounded-lg text-sm font-medium hover:bg-deep-green/90 transition-colors">
            Create Page
          </button>
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-900 text-sm">{page.title}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">/{page.slug}</code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        page.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${page.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {page.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{page.template}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {new Date(page.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openSections(page)}
                          title="Manage Sections"
                          className="p-1.5 text-gray-400 hover:text-deep-green hover:bg-deep-green/5 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditPage(page)}
                          title="Edit Page"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(page)}
                          title="Delete Page"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Create/Edit Page Modal ──────────────────────────────────────────── */}
      {showPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPageModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </h2>
              <button onClick={() => setShowPageModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setPageForm(f => ({
                      ...f,
                      title,
                      slug: !editingPage ? generateSlug(title) : f.slug,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all"
                  placeholder="Page title"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">/</span>
                  <input
                    type="text"
                    value={pageForm.slug}
                    onChange={(e) => setPageForm(f => ({ ...f, slug: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all"
                    placeholder="page-slug"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={pageForm.content}
                  onChange={(e) => setPageForm(f => ({ ...f, content: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all resize-y font-mono"
                  placeholder="Page content..."
                />
              </div>

              {/* Status + Template row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={pageForm.status}
                    onChange={(e) => setPageForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select
                    value={pageForm.template}
                    onChange={(e) => setPageForm(f => ({ ...f, template: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all bg-white"
                  >
                    {TEMPLATES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SEO Fields */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">SEO / Meta</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={pageForm.meta_title}
                      onChange={(e) => setPageForm(f => ({ ...f, meta_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all"
                      placeholder="SEO title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      value={pageForm.meta_description}
                      onChange={(e) => setPageForm(f => ({ ...f, meta_description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none transition-all resize-y"
                      placeholder="SEO description..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowPageModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePage}
                disabled={saving || !pageForm.title || !pageForm.slug}
                className="px-4 py-2 text-sm font-medium text-white bg-deep-green rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editingPage ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Page</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to delete <strong>&ldquo;{deleteTarget.title}&rdquo;</strong>? This will also delete all associated sections. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePage}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sections Modal ───────────────────────────────────────────────────── */}
      {showSectionsModal && sectionsPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowSectionsModal(false); setShowSectionForm(false); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sections: {sectionsPage.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage content sections for this page</p>
              </div>
              <button onClick={() => { setShowSectionsModal(false); setShowSectionForm(false); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Section Form */}
              {showSectionForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {editingSection ? 'Edit Section' : 'Add New Section'}
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <select
                          value={sectionForm.section_type}
                          onChange={(e) => setSectionForm(f => ({ ...f, section_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                        >
                          {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={sectionForm.sort_order}
                          onChange={(e) => setSectionForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Content (JSON)</label>
                      <textarea
                        value={sectionContentJson}
                        onChange={(e) => setSectionContentJson(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none resize-y"
                        placeholder='{ "heading": "...", "body": "..." }'
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="section-visible"
                        checked={sectionForm.is_visible}
                        onChange={(e) => setSectionForm(f => ({ ...f, is_visible: e.target.checked }))}
                        className="rounded border-gray-300 text-deep-green focus:ring-deep-green"
                      />
                      <label htmlFor="section-visible" className="text-sm text-gray-700">Visible</label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setShowSectionForm(false); setEditingSection(null); }}
                        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveSection}
                        disabled={saving}
                        className="px-3 py-1.5 text-sm text-white bg-deep-green rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {editingSection ? 'Update' : 'Add'} Section
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections List */}
              {sectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-deep-green border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">No sections yet for this page.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        section.is_visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      {/* Drag handle / order */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleReorderSection(section.id, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReorderSection(section.id, 'down')}
                          disabled={idx === sections.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-deep-green bg-deep-green/10 px-2 py-0.5 rounded">{section.section_type}</span>
                          <span className="text-xs text-gray-400">Order: {section.sort_order}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {JSON.stringify(section.content).substring(0, 80)}...
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleSectionVisibility(section)}
                          title={section.is_visible ? 'Hide' : 'Show'}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {section.is_visible ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => openEditSection(section)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Section Button */}
              {!showSectionForm && (
                <button
                  onClick={openAddSection}
                  className="mt-4 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-deep-green hover:text-deep-green transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Section
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
