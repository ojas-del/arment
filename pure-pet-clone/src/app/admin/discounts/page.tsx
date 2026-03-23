'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  applies_to: 'all' | 'specific_products' | 'specific_collections';
  product_ids: string[] | null;
  collection_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

interface AutomatedDiscount {
  id: string;
  name: string;
  type: 'buy_x_get_y' | 'bundle' | 'volume';
  conditions: Record<string, unknown>;
  discount_value: number;
  discount_type: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

type DiscountCodeFormData = Omit<DiscountCode, 'id' | 'used_count' | 'created_at' | 'updated_at'>;
type AutoDiscountFormData = Omit<AutomatedDiscount, 'id' | 'created_at' | 'updated_at'>;

const emptyCodeForm: DiscountCodeFormData = {
  code: '',
  type: 'percentage',
  value: 0,
  min_order_amount: null,
  max_uses: null,
  starts_at: null,
  ends_at: null,
  is_active: true,
  applies_to: 'all',
  product_ids: null,
  collection_ids: null,
};

const emptyAutoForm: AutoDiscountFormData = {
  name: '',
  type: 'buy_x_get_y',
  conditions: {},
  discount_value: 0,
  discount_type: 'percentage',
  is_active: true,
  priority: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRandomCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getCodeStatus(code: DiscountCode): 'active' | 'expired' | 'scheduled' | 'inactive' {
  if (!code.is_active) return 'inactive';
  const now = new Date();
  if (code.starts_at && new Date(code.starts_at) > now) return 'scheduled';
  if (code.ends_at && new Date(code.ends_at) < now) return 'expired';
  if (code.max_uses && code.used_count >= code.max_uses) return 'expired';
  return 'active';
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-red-100 text-red-700',
    scheduled: 'bg-blue-100 text-blue-700',
    inactive: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.inactive}`}>
      {status}
    </span>
  );
}

function formatValue(type: string, value: number): string {
  if (type === 'percentage') return `${value}%`;
  if (type === 'fixed_amount') return `£${value.toFixed(2)}`;
  return 'Free Shipping';
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiscountsPage() {
  const [activeTab, setActiveTab] = useState<'codes' | 'automatic'>('codes');

  // Discount Codes state
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [codesError, setCodesError] = useState<string | null>(null);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [codeForm, setCodeForm] = useState<DiscountCodeFormData>(emptyCodeForm);
  const [codeSaving, setCodeSaving] = useState(false);
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null);

  // Automated Discounts state
  const [autos, setAutos] = useState<AutomatedDiscount[]>([]);
  const [autosLoading, setAutosLoading] = useState(true);
  const [autosError, setAutosError] = useState<string | null>(null);
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [editingAuto, setEditingAuto] = useState<AutomatedDiscount | null>(null);
  const [autoForm, setAutoForm] = useState<AutoDiscountFormData>(emptyAutoForm);
  const [autoSaving, setAutoSaving] = useState(false);
  const [deleteAutoId, setDeleteAutoId] = useState<string | null>(null);

  const [conditionsJson, setConditionsJson] = useState('{}');
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchCodes = useCallback(async () => {
    setCodesLoading(true);
    setCodesError(null);
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setCodesError(error.message);
    } else {
      setCodes(data || []);
    }
    setCodesLoading(false);
  }, []);

  const fetchAutos = useCallback(async () => {
    setAutosLoading(true);
    setAutosError(null);
    const { data, error } = await supabase
      .from('automated_discounts')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      setAutosError(error.message);
    } else {
      setAutos(data || []);
    }
    setAutosLoading(false);
  }, []);

  useEffect(() => {
    fetchCodes();
    fetchAutos();
  }, [fetchCodes, fetchAutos]);

  // ─── Discount Code CRUD ───────────────────────────────────────────────────

  function openCreateCode() {
    setEditingCode(null);
    setCodeForm(emptyCodeForm);
    setCodeModalOpen(true);
  }

  function openEditCode(code: DiscountCode) {
    setEditingCode(code);
    setCodeForm({
      code: code.code,
      type: code.type,
      value: code.value,
      min_order_amount: code.min_order_amount,
      max_uses: code.max_uses,
      starts_at: code.starts_at,
      ends_at: code.ends_at,
      is_active: code.is_active,
      applies_to: code.applies_to,
      product_ids: code.product_ids,
      collection_ids: code.collection_ids,
    });
    setCodeModalOpen(true);
  }

  async function saveCode() {
    setCodeSaving(true);
    setCodesError(null);

    const payload = {
      ...codeForm,
      starts_at: codeForm.starts_at || null,
      ends_at: codeForm.ends_at || null,
      product_ids: codeForm.applies_to === 'specific_products' ? codeForm.product_ids : null,
      collection_ids: codeForm.applies_to === 'specific_collections' ? codeForm.collection_ids : null,
    };

    if (editingCode) {
      const { error } = await supabase
        .from('discount_codes')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingCode.id);

      if (error) {
        setCodesError(error.message);
        setCodeSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('discount_codes')
        .insert([payload]);

      if (error) {
        setCodesError(error.message);
        setCodeSaving(false);
        return;
      }
    }

    setCodeModalOpen(false);
    setCodeSaving(false);
    fetchCodes();
  }

  async function deleteCode(id: string) {
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) {
      setCodesError(error.message);
    } else {
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
    setDeleteCodeId(null);
  }

  // ─── Automated Discount CRUD ──────────────────────────────────────────────

  function openCreateAuto() {
    setEditingAuto(null);
    setAutoForm(emptyAutoForm);
    setConditionsJson('{}');
    setConditionsError(null);
    setAutoModalOpen(true);
  }

  function openEditAuto(auto: AutomatedDiscount) {
    setEditingAuto(auto);
    setAutoForm({
      name: auto.name,
      type: auto.type,
      conditions: auto.conditions,
      discount_value: auto.discount_value,
      discount_type: auto.discount_type,
      is_active: auto.is_active,
      priority: auto.priority,
    });
    setConditionsJson(JSON.stringify(auto.conditions, null, 2));
    setConditionsError(null);
    setAutoModalOpen(true);
  }

  async function saveAuto() {
    setAutoSaving(true);
    setAutosError(null);

    let parsedConditions: Record<string, unknown>;
    try {
      parsedConditions = JSON.parse(conditionsJson);
    } catch {
      setConditionsError('Invalid JSON');
      setAutoSaving(false);
      return;
    }

    const payload = {
      ...autoForm,
      conditions: parsedConditions,
    };

    if (editingAuto) {
      const { error } = await supabase
        .from('automated_discounts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingAuto.id);

      if (error) {
        setAutosError(error.message);
        setAutoSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('automated_discounts')
        .insert([payload]);

      if (error) {
        setAutosError(error.message);
        setAutoSaving(false);
        return;
      }
    }

    setAutoModalOpen(false);
    setAutoSaving(false);
    fetchAutos();
  }

  async function deleteAuto(id: string) {
    const { error } = await supabase.from('automated_discounts').delete().eq('id', id);
    if (error) {
      setAutosError(error.message);
    } else {
      setAutos((prev) => prev.filter((a) => a.id !== id));
    }
    setDeleteAutoId(null);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage discount codes and automatic discounts</p>
        </div>
        <button
          onClick={activeTab === 'codes' ? openCreateCode : openCreateAuto}
          className="inline-flex items-center gap-2 px-4 py-2 bg-deep-green text-white rounded-lg text-sm font-medium hover:bg-deep-green/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {activeTab === 'codes' ? 'Create Discount Code' : 'Create Automatic Discount'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('codes')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'codes'
                ? 'border-deep-green text-deep-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Discount Codes
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{codes.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('automatic')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'automatic'
                ? 'border-deep-green text-deep-green'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Automatic Discounts
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{autos.length}</span>
          </button>
        </nav>
      </div>

      {/* ─── Discount Codes Tab ──────────────────────────────────────────────── */}
      {activeTab === 'codes' && (
        <>
          {codesError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {codesError}
            </div>
          )}

          {codesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-deep-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : codes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No discount codes yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first discount code to get started.</p>
              <button
                onClick={openCreateCode}
                className="inline-flex items-center gap-2 px-4 py-2 bg-deep-green text-white rounded-lg text-sm font-medium hover:bg-deep-green/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Discount Code
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Usage</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Dates</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {codes.map((code) => {
                      const status = getCodeStatus(code);
                      return (
                        <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-deep-green bg-deep-green/5 px-2 py-0.5 rounded">
                              {code.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 capitalize">{code.type.replace('_', ' ')}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{formatValue(code.type, code.value)}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {code.used_count}{code.max_uses ? ` / ${code.max_uses}` : ' / unlimited'}
                          </td>
                          <td className="px-4 py-3">{statusBadge(status)}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            <div>{code.starts_at ? new Date(code.starts_at).toLocaleDateString() : 'No start'}</div>
                            <div>{code.ends_at ? new Date(code.ends_at).toLocaleDateString() : 'No end'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditCode(code)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteCodeId(code.id)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Automatic Discounts Tab ─────────────────────────────────────────── */}
      {activeTab === 'automatic' && (
        <>
          {autosError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {autosError}
            </div>
          )}

          {autosLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-deep-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : autos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No automatic discounts yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create automatic discounts that apply without a code.</p>
              <button
                onClick={openCreateAuto}
                className="inline-flex items-center gap-2 px-4 py-2 bg-deep-green text-white rounded-lg text-sm font-medium hover:bg-deep-green/90 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Automatic Discount
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {autos.map((auto) => (
                      <tr key={auto.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{auto.name}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{auto.type.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatValue(auto.discount_type, auto.discount_value)}
                        </td>
                        <td className="px-4 py-3">
                          {statusBadge(auto.is_active ? 'active' : 'inactive')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{auto.priority}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditAuto(auto)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteAutoId(auto.id)}
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
            </div>
          )}
        </>
      )}

      {/* ─── Discount Code Modal ─────────────────────────────────────────────── */}
      {codeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setCodeModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
              </h2>
              <button onClick={() => setCodeModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeForm.code}
                    onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAVE20"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setCodeForm({ ...codeForm, code: generateRandomCode() })}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Generate Code
                  </button>
                </div>
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={codeForm.type}
                    onChange={(e) => setCodeForm({ ...codeForm, type: e.target.value as DiscountCode['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none bg-white"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value {codeForm.type === 'percentage' ? '(%)' : codeForm.type === 'fixed_amount' ? '(GBP)' : ''}
                  </label>
                  <input
                    type="number"
                    value={codeForm.value}
                    onChange={(e) => setCodeForm({ ...codeForm, value: parseFloat(e.target.value) || 0 })}
                    disabled={codeForm.type === 'free_shipping'}
                    min={0}
                    step={codeForm.type === 'percentage' ? 1 : 0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Min order & Max uses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (GBP)</label>
                  <input
                    type="number"
                    value={codeForm.min_order_amount ?? ''}
                    onChange={(e) => setCodeForm({ ...codeForm, min_order_amount: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="No minimum"
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={codeForm.max_uses ?? ''}
                    onChange={(e) => setCodeForm({ ...codeForm, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Unlimited"
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(codeForm.starts_at)}
                    onChange={(e) => setCodeForm({ ...codeForm, starts_at: fromDatetimeLocal(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(codeForm.ends_at)}
                    onChange={(e) => setCodeForm({ ...codeForm, ends_at: fromDatetimeLocal(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                  />
                </div>
              </div>

              {/* Applies to */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                <select
                  value={codeForm.applies_to}
                  onChange={(e) => setCodeForm({ ...codeForm, applies_to: e.target.value as DiscountCode['applies_to'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none bg-white"
                >
                  <option value="all">All Products</option>
                  <option value="specific_products">Specific Products</option>
                  <option value="specific_collections">Specific Collections</option>
                </select>
              </div>

              {/* Product IDs */}
              {codeForm.applies_to === 'specific_products' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product IDs (comma-separated UUIDs)</label>
                  <input
                    type="text"
                    value={(codeForm.product_ids || []).join(', ')}
                    onChange={(e) =>
                      setCodeForm({
                        ...codeForm,
                        product_ids: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="uuid1, uuid2, ..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none font-mono text-xs"
                  />
                </div>
              )}

              {/* Collection IDs */}
              {codeForm.applies_to === 'specific_collections' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection IDs (comma-separated UUIDs)</label>
                  <input
                    type="text"
                    value={(codeForm.collection_ids || []).join(', ')}
                    onChange={(e) =>
                      setCodeForm({
                        ...codeForm,
                        collection_ids: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="uuid1, uuid2, ..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none font-mono text-xs"
                  />
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCodeForm({ ...codeForm, is_active: !codeForm.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${codeForm.is_active ? 'bg-deep-green' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${codeForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-700">{codeForm.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
              <button
                onClick={() => setCodeModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCode}
                disabled={codeSaving || !codeForm.code.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-deep-green rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {codeSaving && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {editingCode ? 'Update Code' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Automatic Discount Modal ────────────────────────────────────────── */}
      {autoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setAutoModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingAuto ? 'Edit Automatic Discount' : 'Create Automatic Discount'}
              </h2>
              <button onClick={() => setAutoModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={autoForm.name}
                  onChange={(e) => setAutoForm({ ...autoForm, name: e.target.value })}
                  placeholder="e.g. Buy 2 Get 1 Free"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                />
              </div>

              {/* Type & Discount Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Trigger</label>
                  <select
                    value={autoForm.type}
                    onChange={(e) => setAutoForm({ ...autoForm, type: e.target.value as AutomatedDiscount['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none bg-white"
                  >
                    <option value="buy_x_get_y">Buy X Get Y</option>
                    <option value="bundle">Bundle</option>
                    <option value="volume">Volume</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={autoForm.discount_type}
                    onChange={(e) => setAutoForm({ ...autoForm, discount_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none bg-white"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
              </div>

              {/* Value & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value {autoForm.discount_type === 'percentage' ? '(%)' : autoForm.discount_type === 'fixed_amount' ? '(GBP)' : ''}
                  </label>
                  <input
                    type="number"
                    value={autoForm.discount_value}
                    onChange={(e) => setAutoForm({ ...autoForm, discount_value: parseFloat(e.target.value) || 0 })}
                    disabled={autoForm.discount_type === 'free_shipping'}
                    min={0}
                    step={autoForm.discount_type === 'percentage' ? 1 : 0.01}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    value={autoForm.priority}
                    onChange={(e) => setAutoForm({ ...autoForm, priority: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Lower number = higher priority</p>
                </div>
              </div>

              {/* Conditions (JSON) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions (JSON)</label>
                <textarea
                  value={conditionsJson}
                  onChange={(e) => {
                    setConditionsJson(e.target.value);
                    setConditionsError(null);
                  }}
                  rows={6}
                  placeholder='{"min_quantity": 3, "product_ids": ["..."]}'
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-deep-green/20 focus:border-deep-green outline-none resize-y ${
                    conditionsError ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {conditionsError && (
                  <p className="text-xs text-red-600 mt-1">{conditionsError}</p>
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAutoForm({ ...autoForm, is_active: !autoForm.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoForm.is_active ? 'bg-deep-green' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-700">{autoForm.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
              <button
                onClick={() => setAutoModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAuto}
                disabled={autoSaving || !autoForm.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-deep-green rounded-lg hover:bg-deep-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {autoSaving && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {editingAuto ? 'Update Discount' : 'Create Discount'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal (Codes) ───────────────────────────────── */}
      {deleteCodeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteCodeId(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Discount Code</h3>
                <p className="text-sm text-gray-500">This action cannot be undone. The discount code will be permanently removed.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteCodeId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCode(deleteCodeId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal (Automatic) ───────────────────────────── */}
      {deleteAutoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteAutoId(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Automatic Discount</h3>
                <p className="text-sm text-gray-500">This action cannot be undone. The automatic discount will be permanently removed.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteAutoId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAuto(deleteAutoId)}
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